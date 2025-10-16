import { useEffect, useMemo, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import useDocumentTitle from '../hooks/useDocumentTitle'
import { useAuth } from '../hooks/useAuth'
import { collection, addDoc, onSnapshot, query, orderBy, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'

// Image limits
const MAX_IMAGES = 5
const MAX_IMAGE_BYTES = 1 * 1024 * 1024 // 1MB per image
const MAX_NEW_SELECTION_BYTES = 5 * 1024 * 1024 // ~5MB total per selection

// Types
export type Customer = {
  id: string
  firstName: string
  lastName: string
  streetAddress?: string
  city?: string
  state?: string
  zip?: string
  email?: string
  phone?: string
  notes?: string
  pictures: string[] // download URLs from Storage
  createdAt: string // ISO
  updatedAt: string // ISO
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function People() {
  useDocumentTitle('People')

  const { user } = useAuth()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
    email: '',
    phone: '',
    notes: '',
  })

  const [pictures, setPictures] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])

  // Load from Firestore when user is signed in
  useEffect(() => {
    if (!user) {
      setCustomers([])
      return
    }

    const q = query(
      collection(db, `users/${user.uid}/customers`),
      orderBy('createdAt', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedCustomers: Customer[] = []
      snapshot.forEach((doc) => {
        loadedCustomers.push({ id: doc.id, ...doc.data() } as Customer)
      })
      setCustomers(loadedCustomers)
    })

    return () => unsubscribe()
  }, [user])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => {
      const parts = [
        c.firstName,
        c.lastName,
        c.email,
        c.phone,
        c.streetAddress,
        c.city,
        c.state,
        c.zip,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return parts.includes(q)
    })
  }, [customers, search])

  function onFieldChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
  }

  async function onPicturesChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || [])

    if (!files.length) return

    // Validate selection size and file types
    const invalidType = files.find((f) => !f.type.startsWith('image/'))
    if (invalidType) {
      setError('Only image files are allowed.')
      e.target.value = ''
      return
    }

    const tooBig = files.find((f) => f.size > MAX_IMAGE_BYTES)
    if (tooBig) {
      setError('Each image must be 1MB or smaller.')
      e.target.value = ''
      return
    }

    const totalNew = files.reduce((sum, f) => sum + f.size, 0)
    if (totalNew > MAX_NEW_SELECTION_BYTES) {
      setError('Selected images are too large altogether (max ~5MB per selection).')
      e.target.value = ''
      return
    }

    if (pictures.length + files.length > MAX_IMAGES) {
      setError(`You can add up to ${MAX_IMAGES} pictures.`)
      e.target.value = ''
      return
    }

    try {
      const dataUrls = await Promise.all(files.map(readFileAsDataURL))
      setPictures((prev) => [...prev, ...dataUrls])
      setSelectedFiles((prev) => [...prev, ...files])
      setError(null)
      e.target.value = ''
    } catch {
      setError('Could not read one or more images.')
      e.target.value = ''
    }
  }

  function removePicture(idx: number) {
    setPictures((prev) => prev.filter((_, i) => i !== idx))
    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx))
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()

    if (!user) {
      setError('Please sign in to add customers.')
      return
    }

    if (!form.firstName.trim() && !form.lastName.trim()) {
      setError('Please provide at least a first or last name.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Step 1: Create Firestore doc with empty pictures array
      const customerData = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        streetAddress: form.streetAddress.trim() || undefined,
        city: form.city.trim() || undefined,
        state: form.state.trim() || undefined,
        zip: form.zip.trim() || undefined,
        email: form.email.trim() || undefined,
        phone: form.phone.trim() || undefined,
        notes: form.notes.trim() || undefined,
        pictures: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const docRef = await addDoc(
        collection(db, `users/${user.uid}/customers`),
        customerData
      )

      // Step 2: Upload files to Storage (if any)
      if (selectedFiles.length > 0) {
        const uploadPromises = selectedFiles.slice(0, MAX_IMAGES).map(async (file) => {
          const storageRef = ref(
            storage,
            `customer-images/${user.uid}/${docRef.id}/${file.name}`
          )
          await uploadBytes(storageRef, file)
          return getDownloadURL(storageRef)
        })

        const downloadUrls = await Promise.all(uploadPromises)

        // Step 3: Update Firestore doc with download URLs
        await updateDoc(doc(db, `users/${user.uid}/customers`, docRef.id), {
          pictures: downloadUrls,
          updatedAt: serverTimestamp(),
        })
      }

      // Reset form
      setForm({
        firstName: '',
        lastName: '',
        streetAddress: '',
        city: '',
        state: '',
        zip: '',
        email: '',
        phone: '',
        notes: '',
      })
      setPictures([])
      setSelectedFiles([])
      setError(null)
    } catch (err) {
      // Log detailed error to console
      console.error('Failed to save customer:', err)
      
      // Extract Firebase error code if available
      const fbError = err as { code?: string; message?: string }
      const errorMsg = fbError.code
        ? `Failed to save customer (${fbError.code}). Please try again.`
        : 'Failed to save customer. Please try again.'
      
      setError(errorMsg)
    } finally {
      setUploading(false)
    }
  }

  function fullName(c: Customer) {
    return [c.firstName, c.lastName].filter(Boolean).join(' ').trim() || 'Unnamed'
  }

  function notesExcerpt(text?: string, max = 120) {
    if (!text) return ''
    if (text.length <= max) return text
    return text.slice(0, max - 1) + '…'
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">People</h1>

      {!user && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <p className="text-amber-900">Please sign in to manage customers.</p>
        </div>
      )}

      {/* Add Customer */}
      <form onSubmit={onSubmit} className="bg-white border border-neutral-200 rounded-lg p-4 md:p-6 shadow-sm space-y-4 mb-8">
        <h2 className="text-xl font-semibold text-neutral-800">Add customer</h2>

        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">{error}</div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">First name</label>
            <input name="firstName" value={form.firstName} onChange={onFieldChange} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Last name</label>
            <input name="lastName" value={form.lastName} onChange={onFieldChange} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Street address</label>
          <input name="streetAddress" value={form.streetAddress} onChange={onFieldChange} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">City</label>
            <input name="city" value={form.city} onChange={onFieldChange} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">State</label>
            <input name="state" value={form.state} onChange={onFieldChange} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">ZIP</label>
            <input name="zip" value={form.zip} onChange={onFieldChange} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Email</label>
            <input name="email" type="email" value={form.email} onChange={onFieldChange} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Phone</label>
            <input name="phone" value={form.phone} onChange={onFieldChange} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Notes</label>
          <textarea name="notes" value={form.notes} onChange={onFieldChange} rows={3} className="mt-1 w-full rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500" />
        </div>

        <div>
          <label className="block text-sm font-medium text-neutral-700">Pictures (up to 5 images)</label>
          <input type="file" accept="image/*" multiple onChange={onPicturesChange} className="mt-1" />

          {pictures.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-3">
              {pictures.map((src, idx) => (
                <div key={idx} className="relative w-24 h-24 border border-neutral-200 rounded overflow-hidden">
                  <img src={src} alt={`preview-${idx}`} className="object-cover w-full h-full" />
                  <button
                    type="button"
                    onClick={() => removePicture(idx)}
                    className="absolute top-1 right-1 bg-white/80 text-red-600 text-xs font-semibold px-1.5 py-0.5 rounded"
                    aria-label="Remove picture"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-2">
          <button 
            type="submit" 
            disabled={!user || uploading}
            className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded-md disabled:bg-neutral-300 disabled:cursor-not-allowed"
          >
            {uploading ? 'Saving...' : 'Save customer'}
          </button>
        </div>
      </form>

      {/* Search */}
      <div className="mb-4">
        <input
          placeholder="Search by name, email, phone, city, state, zip"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-96 rounded-md border border-neutral-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-neutral-600">No customers yet.</p>
      ) : (
        <ul className="space-y-3">
          {filtered.map((c) => (
            <li key={c.id} className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start gap-4">
                {/* Thumbnails */}
                {c.pictures && c.pictures.length > 0 ? (
                  <div className="flex -space-x-2">
                    {c.pictures.slice(0, 3).map((src, idx) => (
                      <img
                        key={idx}
                        src={src}
                        alt={`thumbnail-${idx}`}
                        className="w-12 h-12 rounded object-cover border border-white shadow"
                      />
                    ))}
                  </div>
                ) : (
                  <div className="w-12 h-12 rounded bg-neutral-100 border border-neutral-200" />
                )}

                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-neutral-900 truncate">{fullName(c)}</div>
                  <div className="text-sm text-neutral-700">
                    {[c.city, c.state].filter(Boolean).join(', ')} {c.zip ? ` ${c.zip}` : ''}
                  </div>

                  <div className="mt-1 text-sm text-neutral-700 space-y-0.5">
                    {c.email && <div>Email: {c.email}</div>}
                    {c.phone && <div>Phone: {c.phone}</div>}
                    {c.streetAddress && <div>Address: {c.streetAddress}</div>}
                  </div>

                  {c.notes && (
                    <div className="mt-2 text-sm text-neutral-600">
                      {notesExcerpt(c.notes)}
                    </div>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}