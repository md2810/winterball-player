import { initializeApp } from 'firebase/app'
import { getDatabase, ref, onValue, set } from 'firebase/database'

// Firebase configuration - replace with your own
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
}

const app = initializeApp(firebaseConfig)
const database = getDatabase(app)

export interface PlayerConfig {
  scale: number
  backgroundMode: 'cover' | 'black'
}

export const defaultConfig: PlayerConfig = {
  scale: 1,
  backgroundMode: 'cover'
}

const configRef = ref(database, 'config')

export function subscribeToConfig(callback: (config: PlayerConfig) => void) {
  return onValue(configRef, (snapshot) => {
    const data = snapshot.val()
    if (data) {
      callback({ ...defaultConfig, ...data })
    } else {
      callback(defaultConfig)
    }
  })
}

export async function updateConfig(config: Partial<PlayerConfig>) {
  const currentRef = ref(database, 'config')
  await set(currentRef, config)
}

export { database }
