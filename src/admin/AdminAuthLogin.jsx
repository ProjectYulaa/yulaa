// src/components/AdminAuthLogin.jsx
import { useState, useEffect } from "react";
import { signInWithEmailAndPassword, signOut, onIdTokenChanged } from "firebase/auth";
import { toast } from "react-hot-toast";
import { adminAuth } from "../firebase"; // isolated admin auth

export default function AdminAuthLogin({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If already signed in & has isAdmin claim, allow right away
  useEffect(() => {
    const unsub = onIdTokenChanged(adminAuth, async (user) => {
      if (!user) return;
      try {
        const token = await user.getIdTokenResult(true);
        if (token.claims?.isAdmin) {
          onSuccess?.();
        }
      } catch (e) {
        console.error("Token check failed:", e);
      }
    });
    return () => unsub();
  }, [onSuccess]);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(adminAuth, email, password);
      const token = await user.getIdTokenResult(true);
      if (token.claims?.isAdmin) {
        toast.success("Admin verified");
        onSuccess?.();
      } else {
        toast.error("This account is not an admin");
        await signOut(adminAuth); // sign out the admin session, not storefront
      }
    } catch (e) {
      console.error(e);
      toast.error("Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-modal">
      <h2>Admin Verification</h2>
      <input
        type="email"
        placeholder="Admin Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        autoComplete="username"
      />
      <input
        type="password"
        placeholder="Admin Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />
      <button type="button" onClick={handleLogin} disabled={loading || !email || !password}>
        {loading ? "Verifying..." : "Verify"}
      </button>
    </div>
  );
}
