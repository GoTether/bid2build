import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'
import { getDatabase } from 'firebase/database'
import { getStorage } from 'firebase/storage'
import { getAnalytics, isSupported as isAnalyticsSupported } from 'firebase/analytics'

const firebaseConfig = {
  apiKey: 'AIzaSyBXPL6hlivx2yidBz5WXK9cX64AniIJ8Bw',
  authDomain: 'bid2build-d6d1c.firebaseapp.com',
  projectId: 'bid2build-d6d1c',
  storageBucket: 'bid2build-d6d1c.firebasestorage.app',
  messagingSenderId: '833302962979',
  appId: '1:833302962979:web:f8c877f4521bced144e296',
  measurementId: 'G-J68M6LYK3Y',
}

export const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
export const rtdb = getDatabase(app)
export const storage = getStorage(app)
export const analyticsPromise = (async () => {
  try {
    return (await isAnalyticsSupported()) ? getAnalytics(app) : null
  } catch {
    return null
  }
})()
