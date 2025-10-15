import { useEffect, useMemo, useState, ChangeEvent, FormEvent } from 'react'
import useDocumentTitle from '../hooks/useDocumentTitle'

// Local storage key for customers
const STORAGE_KEY = 'b2b_customers_v1'

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
  pictures: string[] // data URLs
  createdAt: string // ISO
  updatedAt: string // ISO
}

function safeUUID() {
  try {
    return crypto.randomUUID()
  } catch {
    return String(Date.now())
  }
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

  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState('')
  const [error, setError] = useState<string | null>(null)

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

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Customer[]
        if (Array.isArray(parsed)) setCustomers(parsed)
      }
    } catch (e) {
      // ignore
    }
  }, [])

  // Persist whenever customers change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customers))
    } catch (e) {
      // ignore
    }
  }, [customers])

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
      setError(null)
      e.target.value = ''
    } catch (err) {
      setError('Could not read one or more images.')
      e.target.value = ''
    }
  }

  function removePicture(idx: number) {
    setPictures((prev) => prev.filter((_, i) => i !== idx))
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()

    if (!form.firstName.trim() && !form.lastName.trim()) {
      setError('Please provide at least a first or last name.')
      return
    }

    const now = new Date().toISOString()
    const customer: Customer = {
      id: safeUUID(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      streetAddress: form.streetAddress.trim() || undefined,
      city: form.city.trim() || undefined,
      state: form.state.trim() || undefined,
      zip: form.zip.trim() || undefined,
      email: form.email.trim() || undefined,
      phone: form.phone.trim() || undefined,
      notes: form.notes.trim() || undefined,
      pictures: pictures.slice(0, MAX_IMAGES),
      createdAt: now,
      updatedAt: now,
    }

    setCustomers((prev) => [customer, ...prev])

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
    setError(null)
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
          <button type="submit" className="bg-sky-600 hover:bg-sky-700 text-white font-semibold px-4 py-2 rounded-md">
            Save customer
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