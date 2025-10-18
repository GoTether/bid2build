import { useEffect, useState, useMemo, FormEvent, ChangeEvent } from "react";
import { useAuth } from "../hooks/useAuth";
import { db } from "../lib/firebase";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";

type Customer = {
  id: string;
  firstName: string;
  lastName: string;
  streetAddress?: string;
  city?: string;
  state?: string;
  zip?: string;
  email?: string;
  phone?: string;
  notes?: string;
  pictures: string[];
  createdAt: string;
  updatedAt: string;
};

function fullName(c: Customer) {
  return [c.firstName, c.lastName].filter(Boolean).join(" ").trim() || "Unnamed";
}

function notesExcerpt(text?: string, max = 120) {
  if (!text) return "";
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "…";
}

export default function People() {
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");

  // Add-customer form state
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    streetAddress: "",
    city: "",
    state: "",
    zip: "",
    email: "",
    phone: "",
    notes: "",
    pictures: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Load customers from Firestore
  useEffect(() => {
    if (!user) {
      setCustomers([]);
      return;
    }
    const q = query(
      collection(db, `users/${user.uid}/customers`),
      orderBy("createdAt", "desc")
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedCustomers: Customer[] = [];
      snapshot.forEach((docSnap) => {
        loadedCustomers.push({ id: docSnap.id, ...docSnap.data() } as Customer);
      });
      setCustomers(loadedCustomers);
    });
    return () => unsubscribe();
  }, [user]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
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
        .join(" ")
        .toLowerCase();
      return parts.includes(q);
    });
  }, [customers, search]);

  async function handleDelete(id: string) {
    if (!user) return;
    if (!window.confirm("Delete this customer? This cannot be undone.")) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/customers`, id));
    } catch (err) {
      alert("Failed to delete customer. See console for details.");
      console.error(err);
    }
  }

  async function handleAddCustomer(e: FormEvent) {
    e.preventDefault();
    if (!user) return;
    setSubmitting(true);
    try {
      const docData = {
        ...form,
        pictures: form.pictures
          ? form.pictures
              .split(",")
              .map((s) => s.trim())
              .filter((s) => !!s)
          : [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      await addDoc(collection(db, `users/${user.uid}/customers`), docData);
      setForm({
        firstName: "",
        lastName: "",
        streetAddress: "",
        city: "",
        state: "",
        zip: "",
        email: "",
        phone: "",
        notes: "",
        pictures: "",
      });
    } catch (err) {
      alert("Failed to add customer. See console for details.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleFormChange(
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold text-neutral-800 mb-6">People</h1>

      {/* Add Customer Form */}
      <form
        className="mb-8 space-y-4 bg-white rounded-lg border border-neutral-200 p-6 shadow max-w-2xl"
        onSubmit={handleAddCustomer}
      >
        <div className="flex flex-wrap gap-4">
          <input
            placeholder="First Name"
            name="firstName"
            value={form.firstName}
            onChange={handleFormChange}
            required
            className="flex-1 min-w-[120px] rounded-md border border-neutral-300 px-3 py-2"
          />
          <input
            placeholder="Last Name"
            name="lastName"
            value={form.lastName}
            onChange={handleFormChange}
            required
            className="flex-1 min-w-[120px] rounded-md border border-neutral-300 px-3 py-2"
          />
          <input
            placeholder="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleFormChange}
            className="flex-1 min-w-[160px] rounded-md border border-neutral-300 px-3 py-2"
          />
          <input
            placeholder="Phone"
            name="phone"
            value={form.phone}
            onChange={handleFormChange}
            className="flex-1 min-w-[120px] rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <div className="flex flex-wrap gap-4">
          <input
            placeholder="Street Address"
            name="streetAddress"
            value={form.streetAddress}
            onChange={handleFormChange}
            className="flex-1 min-w-[200px] rounded-md border border-neutral-300 px-3 py-2"
          />
          <input
            placeholder="City"
            name="city"
            value={form.city}
            onChange={handleFormChange}
            className="flex-1 min-w-[120px] rounded-md border border-neutral-300 px-3 py-2"
          />
          <input
            placeholder="State"
            name="state"
            value={form.state}
            onChange={handleFormChange}
            className="w-24 rounded-md border border-neutral-300 px-3 py-2"
          />
          <input
            placeholder="Zip"
            name="zip"
            value={form.zip}
            onChange={handleFormChange}
            className="w-24 rounded-md border border-neutral-300 px-3 py-2"
          />
        </div>
        <textarea
          placeholder="Notes"
          name="notes"
          value={form.notes}
          onChange={handleFormChange}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
        <input
          placeholder="Pictures (comma-separated URLs)"
          name="pictures"
          value={form.pictures}
          onChange={handleFormChange}
          className="w-full rounded-md border border-neutral-300 px-3 py-2"
        />
        <button
          type="submit"
          disabled={submitting}
          className="bg-sky-600 hover:bg-sky-700 text-white px-6 py-2 rounded font-semibold"
        >
          {submitting ? "Adding..." : "Add Customer"}
        </button>
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
          {filtered.map((c: Customer) => (
            <li key={c.id} className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex items-start gap-4">
              {/* Thumbnails */}
              {c.pictures && c.pictures.length > 0 ? (
                <div className="flex -space-x-2">
                  {c.pictures.slice(0, 3).map((src: string, idx: number) => (
                    <img
                      key={idx}
                      src={src}
                      alt={`thumbnail-${idx}`}
                      className="w-8 h-8 rounded object-cover border border-white shadow"
                    />
                  ))}
                </div>
              ) : (
                <div className="w-8 h-8 rounded bg-neutral-100 border border-neutral-200 flex items-center justify-center text-neutral-400 text-xs">
                  No Image
                </div>
              )}

              {/* Customer Details */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-neutral-900 truncate">{fullName(c)}</div>
                <div className="text-sm text-neutral-700">
                  {[c.city, c.state].filter(Boolean).join(", ")} {c.zip ? ` ${c.zip}` : ""}
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

              {/* Delete Button */}
              <button
                type="button"
                onClick={() => handleDelete(c.id)}
                className="ml-4 text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 rounded border border-red-200"
              >
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
