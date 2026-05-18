/**
 * Firebase configuration for the Saldo app.
 * Initializes the Firebase Web SDK, Auth (with AsyncStorage persistence for
 * React Native / Expo) and Cloud Firestore.
 *
 * To use a different project, replace the values below or move them into
 * environment variables prefixed with EXPO_PUBLIC_.
 */
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import {
  initializeAuth,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getAuth,
  Auth,
  // @ts-ignore - getReactNativePersistence is not in firebase/auth typings but exists at runtime
  getReactNativePersistence,
} from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

export const firebaseConfig = {
  apiKey: "AIzaSyAJUsMNei9PJ0NrOByi-NpKpQnwJqYm9JY",
  authDomain: "app-financas-d5b1f.firebaseapp.com",
  projectId: "app-financas-d5b1f",
  storageBucket: "app-financas-d5b1f.firebasestorage.app",
  messagingSenderId: "370766143868",
  appId: "1:370766143868:web:f61047281f3c94ce2b84f9",
  measurementId: "G-VK2VST34PT",
};

let app: FirebaseApp;
if (getApps().length === 0) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

// Initialize Auth with React Native persistence (so the session survives reloads).
let _auth: Auth;
try {
  _auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // initializeAuth throws if already called (e.g. fast refresh) — fall back to getAuth.
  _auth = getAuth(app);
}

export const firebaseApp = app;
export const auth: Auth = _auth;
export const db: Firestore = getFirestore(app);
