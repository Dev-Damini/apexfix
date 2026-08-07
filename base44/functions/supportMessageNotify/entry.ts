import { initializeApp, getApps, getApp } from "npm:firebase@10.12.0/app";
import { 
  getFirestore, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp 
} from "npm:firebase@10.12.0/firestore";

// Initialize Firebase App
const firebaseConfig = {
  apiKey: Deno.env.get("VITE_FIREBASE_API_KEY"),
  authDomain: Deno.env.get("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: Deno.env.get("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: Deno.env.get("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: Deno.env.get("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: Deno.env.get("VITE_FIREBASE_APP_ID")
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);

Deno.serve(async (req) => {
  try {
    const payload = await req.json();
    const message = payload.data || payload;

    // Only notify admin when a CUSTOMER sends a message
    if (!message || message.role !== 'customer') {
      return Response.json({ skipped: true });
    }

    // Query Firestore for all users with role 'admin'
    const usersRef = collection(db, 'user');
    const q = query(usersRef, where('role', '==', 'admin'));
    const querySnapshot = await getDocs(q);

    const admins: Array<{ email?: string; full_name?: string }> = [];
    querySnapshot.forEach((docSnap) => {
      admins.push(docSnap.data() as { email?: string; full_name?: string });
    });

    if (admins.length === 0) {
      return Response.json({ ok: true, notified: 0, warning: "No admins found" });
    }

    // Write email documents to Firestore 'mail' collection 
    // (Integrates directly with Firebase 'Trigger Email' extension or custom backend)
    const emailPromises = admins.map(async (admin) => {
      if (!admin.email) return;

      const emailData = {
        to: admin.email,
        message: {
          subject: `New support message from ${message.sender_name || message.sender_email}`,
          text: `Hi ${admin.full_name || 'Admin'},\n\nA customer has sent a new support message:\n\nFrom: ${message.sender_name || ''} (${message.sender_email})\nMessage: "${message.message}"\n\nPlease log into the admin panel to reply.\nCustomers may also be directed to: Myapex@mail2usa.com\n\nApex Bank System`
        },
        createdAt: serverTimestamp()
      };

      return addDoc(collection(db, 'mail'), emailData);
    });

    await Promise.all(emailPromises);

    return Response.json({ ok: true, notified: admins.length });
  } catch (error: any) {
    console.error("Error sending support notification:", error);
    return Response.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
});