import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <h1 className="text-4xl font-bold text-neutral-800 mb-4">404</h1>
      <p className="text-neutral-600 mb-8">Page not found</p>
      <Link 
        to="/projects" 
        className="bg-sky-500 hover:bg-sky-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
      >
        Go to Projects
      </Link>
    </div>
  )
}