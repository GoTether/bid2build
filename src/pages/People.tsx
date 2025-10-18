{filtered.length === 0 ? (
  <p className="text-neutral-600">No customers yet.</p>
) : (
  <ul className="space-y-3">
    {filtered.map((c) => (
      <li key={c.id} className="bg-white border border-neutral-200 rounded-lg p-4 shadow-sm flex items-start gap-4">
        {/* Thumbnails */}
        {c.pictures && c.pictures.length > 0 ? (
          <div className="flex -space-x-2">
            {c.pictures.slice(0, 3).map((src, idx) => (
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

        {/* Delete Button */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm("Delete this customer? This cannot be undone.")) {
              handleDelete(c.id);
            }
          }}
          className="ml-4 text-red-600 hover:text-red-800 text-xs font-semibold px-2 py-1 rounded border border-red-200"
        >
          Delete
        </button>
      </li>
    ))}
  </ul>
)}
