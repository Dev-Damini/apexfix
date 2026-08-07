import React, { createContext, useState, useContext, useEffect } from 'react';
import { auth, db } from '@/api/base44Client';
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState({ id: 'apexbank-firebase' });

  useEffect(() => {
    // Listen for Firebase Auth changes automatically
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setIsLoadingAuth(true);
      setAuthError(null);

      if (firebaseUser) {
        try {
          // Fetch or provision user profile data from Firestore 'user' collection
          const userDocRef = doc(db, 'user', firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);

          let userData = {
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || '',
            role: 'user'
          };

          if (userDocSnap.exists()) {
            userData = { ...userData, ...userDocSnap.data() };
          } else {
            // Provision initial document if user signed in via Google or external provider
            const initialProfile = {
              ...userData,
              balance: 1000,
              createdAt: serverTimestamp()
            };
            await setDoc(userDocRef, initialProfile);
            userData = { ...userData, balance: 1000 };
          }

          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Error fetching user profile from Firestore:", error);
          setUser({
            id: firebaseUser.uid,
            uid: firebaseUser.uid,
            email: firebaseUser.email,
            role: 'user'
          });
          setIsAuthenticated(true);
        }
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }

      setIsLoadingAuth(false);
      setAuthChecked(true);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      setIsLoadingAuth(true);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const register = async (email, password, extraData = {}) => {
    try {
      setIsLoadingAuth(true);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const newUid = userCredential.user.uid;

      // Create standard user profile in Firestore
      const userProfile = {
        id: newUid,
        uid: newUid,
        email,
        role: 'user',
        balance: 1000,
        createdAt: serverTimestamp(),
        ...extraData
      };

      await setDoc(doc(db, 'user', newUid), userProfile);
      return userCredential.user;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const updateUserProfile = async (data) => {
    if (!user?.uid) return;
    try {
      const userDocRef = doc(db, 'user', user.uid);
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp()
      });
      setUser(prev => ({ ...prev, ...data }));
    } catch (error) {
      console.error("Failed to update user profile:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/login';
  };

  const checkUserAuth = async () => {
    return isAuthenticated;
  };

  const checkAppState = async () => {
    setIsLoadingPublicSettings(false);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated, 
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      login,
      register,
      updateUserProfile,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};