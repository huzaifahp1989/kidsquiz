// Firebase configuration (not currently used - using Supabase instead)
// This file is kept for reference only. All backend services are handled by Supabase.

export const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Firebase is not initialized as we're using Supabase for all backend services:
// - Authentication: Supabase Auth
// - Database: Supabase PostgreSQL
// - Storage: Supabase Storage (if needed)

const firebase = null;
export default firebase;
