import useDocumentTitle from '../hooks/useDocumentTitle'

export default function Projects() {
  useDocumentTitle('Projects')
  return (
    <div className="py-8 space-y-4">
      <h1 className="text-3xl font-bold text-neutral-800">Projects</h1>
      <p className="text-neutral-600">Browse active and upcoming projects. This is your starting point to explore bids and opportunities.</p>
    </div>
  )
}