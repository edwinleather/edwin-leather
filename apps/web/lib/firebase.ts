"use client";

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updatePassword,
  signInWithEmailAndPassword,
  type User
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
};

export function firebaseConfigured() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.authDomain);
}

export function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig as Record<string, string>);
}

export function getFBAuth() {
  return getAuth(getFirebaseApp());
}

async function requireAuth(): Promise<User> {
  const auth = getFBAuth();
  const current = auth.currentUser;
  if (!current) throw new Error("Not signed in");
  return current;
}

export async function currentIdToken(): Promise<string> {
  const user = await requireAuth();
  return user.getIdToken();
}

export function signInWithGoogle(): Promise<User> {
  const auth = getFBAuth();
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  return signInWithPopup(auth, provider).then((result) => result.user);
}

export function signInWithPassword(email: string, password: string): Promise<User> {
  return signInWithEmailAndPassword(getFBAuth(), email, password).then((result) => result.user);
}

export async function createAccountWithEmail(email: string, password: string): Promise<User> {
  const result = await createUserWithEmailAndPassword(getFBAuth(), email, password);
  if (result.user.emailVerified === false) {
    await sendEmailVerification(result.user);
  }
  return result.user;
}

export async function resendEmailVerification(): Promise<void> {
  const user = await requireAuth();
  await sendEmailVerification(user);
}

export function sendPasswordReset(email: string): Promise<void> {
  return sendPasswordResetEmail(getFBAuth(), email);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = await requireAuth();
  const email = user.email;
  if (!email) throw new Error("No email on this account");
  const credential = EmailAuthProvider.credential(email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

export async function signOutFirebase(): Promise<void> {
  await getFBAuth().signOut().catch(() => undefined);
}
