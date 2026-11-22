import { createContext, useState, useEffect, useContext } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Listen for Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const defaultProfile = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          emailVerified: firebaseUser.emailVerified,
          displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
          role: 'USER'
        };

        try {
          // Fetch additional user profile data from Firestore
          const docRef = doc(db, 'users', firebaseUser.uid);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const profileData = docSnap.data();
            setUser({
              ...defaultProfile,
              ...profileData,
              displayName: profileData.name || firebaseUser.displayName || defaultProfile.displayName
            });
          } else {
            // Profile document doesn't exist yet: lazily auto-create it for existing users
            try {
              await setDoc(docRef, {
                uid: firebaseUser.uid,
                name: defaultProfile.name,
                email: firebaseUser.email,
                role: 'USER',
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
              });
            } catch (createErr) {
              console.warn('[AuthContext] Profile document auto-creation notice:', createErr.message);
            }

            // Fallback user state with default profile
            setUser(defaultProfile);
          }
        } catch (error) {
          console.warn('[AuthContext] Profile document fetch notice (falling back to Auth session):', error.message || error);
          // Graceful fallback: Do NOT wipe the user session!
          // Retain authenticated state derived directly from verified Firebase Auth session
          setUser(defaultProfile);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return { success: true };
    } catch (error) {
      throw mapFirebaseError(error);
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;

      // Check if this is a new user by checking Firestore
      const docRef = doc(db, 'users', firebaseUser.uid);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        // Create Firestore user document for the Google user
        await setDoc(docRef, {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'Google User',
          email: firebaseUser.email,
          role: 'USER',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      return { success: true };
    } catch (error) {
      if (error.code === 'auth/popup-closed-by-user') {
        throw 'Google sign-in was cancelled.';
      }
      throw mapFirebaseError(error);
    }
  };

  const signup = async (name, email, password) => {
    try {
      // 1. Create Firebase Auth account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // 2. Update display name
      await updateProfile(firebaseUser, { displayName: name });

      // 3. Create Firestore user document
      await setDoc(doc(db, 'users', firebaseUser.uid), {
        uid: firebaseUser.uid,
        name: name,
        email: email,
        role: 'USER',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 4. Send email verification
      await sendEmailVerification(firebaseUser);

      return { success: true };
    } catch (error) {
      throw mapFirebaseError(error);
    }
  };

  const resetPassword = async (email) => {
    try {
      await sendPasswordResetEmail(auth, email);
      return { success: true };
    } catch (error) {
      throw mapFirebaseError(error);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error", error);
    }
  };

  // Helper to map Firebase errors to friendly messages
  const mapFirebaseError = (error) => {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/invalid-credential':
      case 'auth/user-not-found':
      case 'auth/wrong-password':
        return 'Email or password is incorrect.';
      case 'auth/weak-password':
        return 'Your password does not meet the required security level.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/network-request-failed':
        return 'Unable to connect. Please check your internet connection.';
      default:
        return 'An error occurred during authentication. Please try again.';
    }
  };

  const value = {
    user,
    loading,
    login,
    loginWithGoogle,
    signup,
    logout,
    resetPassword
  };

  return <AuthContext.Provider value={value}>{!loading && children}</AuthContext.Provider>;
};
