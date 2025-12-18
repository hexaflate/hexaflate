import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCSe0fnfndYJc8bK8Amr46bzB2EgiHcyHc",
  authDomain: "hexcate-mother-base.firebaseapp.com",
  projectId: "hexcate-mother-base",
  storageBucket: "hexcate-mother-base.appspot.com",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
