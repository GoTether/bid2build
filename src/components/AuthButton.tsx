import { signInWithPopup, signInWithRedirect, signOut } from 'firebase/auth'
import { auth, googleProvider } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

export default function AuthButton() {
  const { user, loading } = useAuth()

  async function handleSignIn() {
    try {
      await signInWithPopup(auth, googleProvider)
    } catch (error) {
      // If popup fails, try redirect
      console.error('Popup sign-in failed, trying redirect:', error)
      await signInWithRedirect(auth, googleProvider)
    }
  }

  async function handleSignOut() {
    try {
      await signOut(auth)
    } catch (error) {
      console.error('Sign-out failed:', error)
    }
  }

  if (loading) {
    return (
      <button
        disabled
        className="bg-neutral-200 text-neutral-500 px-4 py-2 rounded-md cursor-not-allowed"
      >
        Loading...
      </button>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-neutral-700">
          {user.email || user.displayName || 'User'}
        </span>
        <button
          onClick={handleSignOut}
          className="bg-neutral-600 hover:bg-neutral-700 text-white px-4 py-2 rounded-md"
        >
          Sign out
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={handleSignIn}
      className="bg-sky-600 hover:bg-sky-700 text-white px-4 py-2 rounded-md"
    >
      Sign in with Google
    </button>
  )
}
