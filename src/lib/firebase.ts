import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

const firebaseConfig = {
  apiKey: "AIzaSyBXPL6hlivx2yidBz5WXK9cX64AniIJ8Bw",
  authDomain: "bid2build-d6d1c.firebaseapp.com",
  projectId: "bid2build-d6d1c",
  storageBucket: "bid2build-d6d1c.appspot.com",
  messagingSenderId: "833302962979",
  appId: "1:833302962979:web:f8c877f4521bced144e296",
  measurementId: "G-J68M6LYK3Y"
}

// Initialize Firebase
export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()
export const db = getFirestore(app)
export const storage = getStorage(app)
