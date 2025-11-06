// src/pages/People.tsx
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, FormEvent } from 'react'
import { collection, addDoc, updateDoc, serverTimestamp, query, orderBy, onSnapshot, deleteDoc, doc, arrayUnion } from 'firebase/firestore'
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

type Customer = {
  id?: string
  firstName?: string
  lastName?: string
  streetAddress?: string
  city?: string
  state?: string
  zip?: string
  email?: string
  phone?: string
  notes?: string
  pictures?: string[]
  createdAt?: any
}

export default function People() {
  const { user } = useAuth()

  const [customers, setCustomers] = useState<Customer[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)

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
    pictures: '', // optional comma-separated URLs
  })

  // Edit modal state
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingForm, setEditingForm] = useState({ ...form })
  const [editingPhotoFiles, setEditingPhotoFiles] = useState<File[]>([])
  const editingFileInputRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    if (!user) {
      setCustomers([])
      return
    }

    const q = query(collection(db, `users/${user.uid}/customers`), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      const items: Customer[] = []
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...(docSnap.data() as any) })
      })
      setCustomers(items)
    })

    return () => unsub()
  }, [user])

  function handleFormChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target as HTMLInputElement
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  function handlePhotoFilesChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    setPhotoFiles(Array.from(e.target.files))
  }

  async function handleAddCustomer(e: FormEvent) {
    e.preventDefault()
    if (!user) return
    setSubmitting(true)

    try {
      // 1) create a new document so we have an id to put storage files under
      const initialDocData = {
        firstName: form.firstName,
        lastName: form.lastName,
        streetAddress: form.streetAddress,
        city: form.city,
        state: form.state,
        zip: form.zip,
        email: form.email,
        phone: form.phone,
        notes: form.notes,
        pictures: [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      }

      const customersCollection = collection(db, `users/${user.uid}/customers`)
      const newDocRef = await addDoc(customersCollection, initialDocData)

      // 2) upload selected files (if any) to Firebase Storage and collect download URLs
      const uploadedUrls: string[] = []
      if (photoFiles && photoFiles.length > 0) {
        for (const file of photoFiles) {
          const filePath = `users/${user.uid}/customers/${newDocRef.id}/${Date.now()}_${file.name}`
          const sRef = storageRef(storage, filePath)
          await uploadBytes(sRef, file)
          const downloadUrl = await getDownloadURL(sRef)
          uploadedUrls.push(downloadUrl)
        }
      }

      // 3) parse any comma-separated URLs from the pictures text field (optional)
      const urlImages = form.pictures
        ? form.pictures.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      // 4) update the document with the combined list of images
      const allImages = [...urlImages, ...uploadedUrls]
      await updateDoc(newDocRef, {
        pictures: allImages,
        updatedAt: serverTimestamp(),
      })

      // 5) reset the form and file states
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
        pictures: '',
      })
      setPhotoFiles([])
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (err) {
      console.error('Failed to add customer', err)
      alert('Failed to add customer. See console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  // --- Edit handlers ---
  function openEdit(item: Customer) {
    setEditingId(item.id || null)
    setEditingForm({
      firstName: item.firstName || '',
      lastName: item.lastName || '',
      streetAddress: item.streetAddress || '',
      city: item.city || '',
      state: item.state || '',
      zip: item.zip || '',
      email: item.email || '',
      phone: item.phone || '',
      notes: item.notes || '',
      pictures: (item.pictures || []).join(', '),
    })
    setEditingPhotoFiles([])
    if (editingFileInputRef.current) editingFileInputRef.current.value = ''
  }

  function closeEdit() {
    setEditingId(null)
    setEditingForm({ ...form })
    setEditingPhotoFiles([])
    if (editingFileInputRef.current) editingFileInputRef.current.value = ''
  }

  function handleEditingFormChange(e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    const { name, value } = e.target as HTMLInputElement
    setEditingForm((prev) => ({ ...prev, [name]: value }))
  }

  function handleEditingPhotoFilesChange(e: ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return
    setEditingPhotoFiles(Array.from(e.target.files))
  }

  async function handleSaveEdit(e?: FormEvent) {
    if (e) e.preventDefault()
    if (!user || !editingId) return
    setSubmitting(true)

    try {
      const docRef = doc(db, `users/${user.uid}/customers/${editingId}`)

      // 1) upload any new files and collect URLs
      const uploadedUrls: string[] = []
      if (editingPhotoFiles && editingPhotoFiles.length > 0) {
        for (const file of editingPhotoFiles) {
          const filePath = `users/${user.uid}/customers/${editingId}/${Date.now()}_${file.name}`
          const sRef = storageRef(storage, filePath)
          await uploadBytes(sRef, file)
          const downloadUrl = await getDownloadURL(sRef)
          uploadedUrls.push(downloadUrl)
        }
      }

      // 2) prepare update data (fields)
      const updateData: any = {
        firstName: editingForm.firstName,
        lastName: editingForm.lastName,
        streetAddress: editingForm.streetAddress,
        city: editingForm.city,
        state: editingForm.state,
        zip: editingForm.zip,
        email: editingForm.email,
        phone: editingForm.phone,
        notes: editingForm.notes,
        updatedAt: serverTimestamp(),
      }

      // 3) if there are new uploaded URLs, append them using arrayUnion
      if (uploadedUrls.length > 0) {
        updateData.pictures = arrayUnion(...uploadedUrls)
      }

      await updateDoc(docRef, updateData)

      // 4) close modal and reset
      closeEdit()
    } catch (err) {
      console.error('Failed to save edit', err)
      alert('Failed to save changes. See console for details.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDeleteCustomer(item: Customer) {
    if (!user || !item.id) return
    try {
      await deleteDoc(doc(db, `users/${user.uid}/customers/${item.id}`))
    } catch (err) {
      console.error('Failed to delete customer', err)
      alert('Failed to delete customer. See console.')
    }
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">People</h1>

      {/* Add Customer Form (same as before) */}
      <form
        className="mb-8 space-y-4 bg-white rounded-lg border border-neutral-200 p-6 shadow max-w-2xl"
        onSubmit={handleAddCustomer}
      >
        <div className="grid grid-cols-2 gap-4">
          <input name="firstName" placeholder="First name" value={form.firstName} onChange={handleFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
          <input name="lastName" placeholder="Last name" value={form.lastName} onChange={handleFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
        </div>

        <input name="streetAddress" placeholder="Street address" value={form.streetAddress} onChange={handleFormChange} className="w-full rounded-md border border-neutral-300 px-3 py-2" />

        <div className="grid grid-cols-3 gap-4">
          <input name="city" placeholder="City" value={form.city} onChange={handleFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
          <input name="state" placeholder="State" value={form.state} onChange={handleFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
          <input name="zip" placeholder="ZIP" value={form.zip} onChange={handleFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input name="email" placeholder="Email" value={form.email} onChange={handleFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
          <input name="phone" placeholder="Phone" value={form.phone} onChange={handleFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
        </div>

        <textarea name="notes" placeholder="Notes" value={form.notes} onChange={(e) => handleFormChange(e as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2" />

        <input
          placeholder="Pictures (optional URLs) — or upload files below"
          name="pictures"
          value={form.pictures}
          onChange={handleFormChange}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />

        <input
          type="file"
          accept="image/*"
          multiple
          ref={fileInputRef}
          onChange={handlePhotoFilesChange}
          className="block mt-2"
        />

        <button type="submit" disabled={submitting} className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded font-semibold">
          {submitting ? 'Adding...' : 'Add Customer'}
        </button>
      </form>

      <div className="space-y-4">
        {customers.map((c) => (
          <div key={c.id} className="bg-white p-4 rounded border border-neutral-200 shadow max-w-2xl">
            <div className="flex justify-between items-start">
              <div>
                <div className="font-semibold">{c.firstName} {c.lastName}</div>
                <div className="text-sm text-neutral-600">{c.email}</div>
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={() => openEdit(c)} className="text-sm text-sky-600">Edit</button>
                <button onClick={() => handleDeleteCustomer(c)} className="text-sm text-red-600">Delete</button>
              </div>
            </div>
            {c.pictures && c.pictures.length > 0 && (
              <div className="mt-3 flex gap-2">
                {c.pictures!.map((p, i) => (
                  <img key={i} src={p} alt={`pic-${i}`} className="h-20 w-20 object-cover rounded" />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-lg font-semibold mb-4">Edit Person</h2>
            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <input name="firstName" placeholder="First name" value={editingForm.firstName} onChange={handleEditingFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
                <input name="lastName" placeholder="Last name" value={editingForm.lastName} onChange={handleEditingFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
              </div>

              <input name="streetAddress" placeholder="Street address" value={editingForm.streetAddress} onChange={handleEditingFormChange} className="w-full rounded-md border border-neutral-300 px-3 py-2" />

              <div className="grid grid-cols-3 gap-4">
                <input name="city" placeholder="City" value={editingForm.city} onChange={handleEditingFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
                <input name="state" placeholder="State" value={editingForm.state} onChange={handleEditingFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
                <input name="zip" placeholder="ZIP" value={editingForm.zip} onChange={handleEditingFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input name="email" placeholder="Email" value={editingForm.email} onChange={handleEditingFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
                <input name="phone" placeholder="Phone" value={editingForm.phone} onChange={handleEditingFormChange} className="rounded-md border border-neutral-300 px-3 py-2" />
              </div>

              <textarea name="notes" placeholder="Notes" value={editingForm.notes} onChange={(e) => handleEditingFormChange(e as any)} className="w-full rounded-md border border-neutral-300 px-3 py-2" />

              <input
                placeholder="Pictures (optional URLs) — or upload files below"
                name="pictures"
                value={editingForm.pictures}
                onChange={handleEditingFormChange}
                className="w-full rounded-md border border-neutral-300 px-3 py-2"
              />

              <input
                type="file"
                accept="image/*"
                multiple
                ref={editingFileInputRef}
                onChange={handleEditingPhotoFilesChange}
                className="block mt-2"
              />

              <div className="flex justify-end gap-3">
                <button type="button" onClick={closeEdit} className="bg-neutral-200 px-4 py-2 rounded">Cancel</button>
                <button type="submit" disabled={submitting} className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded">
                  {submitting ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}