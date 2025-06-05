import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCt6uN8wZGZz0hUpiOqjLJlr5RNNukijjs",
    authDomain: "to-do-app-d6574.firebaseapp.com",
    projectId: "to-do-app-d6574",
    storageBucket: "to-do-app-d6574.firebasestorage.app",
    messagingSenderId: "667043612127",
    appId: "1:667043612127:web:2feb57d54ad1b8bb97b06a",
    measurementId: "G-JKW0MG5RPF"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };