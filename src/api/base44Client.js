import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp 
} from "firebase/firestore";
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";

// Replace these with your actual Firebase project configuration credentials or environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "YOUR_API_KEY",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "YOUR_PROJECT.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "YOUR_PROJECT_ID",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "YOUR_PROJECT.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "YOUR_SENDER_ID",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "YOUR_APP_ID"
};

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);

// Helper to construct CRUD operations for any collection
const createEntityHandler = (collectionName) => {
  const colRef = collection(db, collectionName);

  return {
    // List / Find documents
    async find(params = {}) {
      try {
        let q = colRef;
        const constraints = [];

        if (typeof params === 'object' && params !== null) {
          Object.keys(params).forEach((key) => {
            if (params[key] !== undefined) {
              constraints.push(where(key, "==", params[key]));
            }
          });
        }

        if (constraints.length > 0) {
          q = query(colRef, ...constraints);
        }

        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data()
        }));
      } catch (error) {
        console.error(`Error finding in ${collectionName}:`, error);
        return [];
      }
    },

    // Get single document by ID
    async get(id) {
      if (!id) return null;
      try {
        const docRef = doc(db, collectionName, id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          return { id: docSnap.id, ...docSnap.data() };
        }
        return null;
      } catch (error) {
        console.error(`Error getting doc ${id} in ${collectionName}:`, error);
        return null;
      }
    },

    // Create a new document
    async create(data) {
      try {
        const docRef = await addDoc(colRef, {
          ...data,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
        return { id: docRef.id, ...data };
      } catch (error) {
        console.error(`Error creating doc in ${collectionName}:`, error);
        throw error;
      }
    },

    // Update an existing document
    async update(id, data) {
      if (!id) throw new Error("Document ID required for update");
      try {
        const docRef = doc(db, collectionName, id);
        await updateDoc(docRef, {
          ...data,
          updatedAt: serverTimestamp()
        });
        return { id, ...data };
      } catch (error) {
        console.error(`Error updating doc ${id} in ${collectionName}:`, error);
        throw error;
      }
    },

    // Delete a document
    async delete(id) {
      if (!id) throw new Error("Document ID required for delete");
      try {
        const docRef = doc(db, collectionName, id);
        await deleteDoc(docRef);
        return { success: true, id };
      } catch (error) {
        console.error(`Error deleting doc ${id} in ${collectionName}:`, error);
        throw error;
      }
    }
  };
};

// Dynamic entity Proxy so base44.entities.<EntityName> works automatically
const entitiesProxy = new Proxy({}, {
  get(target, prop) {
    if (typeof prop === 'string') {
      const collectionName = prop.toLowerCase();
      if (!target[collectionName]) {
        target[collectionName] = createEntityHandler(collectionName);
      }
      return target[collectionName];
    }
    return undefined;
  }
});

// Auth methods proxy attached to base44 for backwards compatibility
const authProxy = {
  login: (email, password) => signInWithEmailAndPassword(auth, email, password),
  register: ({ email, password }) => createUserWithEmailAndPassword(auth, email, password),
  logout: () => signOut(auth),
  loginWithProvider: async (providerName) => {
    if (providerName === 'google') {
      const provider = new GoogleAuthProvider();
      return await signInWithPopup(auth, provider);
    }
    throw new Error(`Provider ${providerName} is not supported`);
  }
};

// Export mock/wrapper object matching original base44 interface
export const base44 = {
  entities: entitiesProxy,
  auth: authProxy
};