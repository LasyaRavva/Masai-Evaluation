const firebaseConfig = {
  apiKey: "AIzaSyBHkehBm50UPgs5P7knlQ2P22LXOVTIXCU",
  authDomain: "time-tracking-dashboard-805e1.firebaseapp.com",
  projectId: "time-tracking-dashboard-805e1",
    storageBucket: "time-tracking-dashboard-805e1.appspot.com",
  messagingSenderId: "456620157206",
  appId: "1:456620157206:web:5b1e9c867b30b398c48837",
  measurementId: "G-938JD7GLHY"
};

try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully");
} catch (error) {
    console.error("Firebase initialization error:", error);
}

let auth = null;
let db = null;

try {
    auth = firebase.auth();
    db = firebase.firestore();
    console.log("Auth and Firestore modules loaded");
} catch (error) {
    console.error("Error loading Firebase modules:", error);
}
