import { useState, useEffect } from "react";
import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { toast } from "react-hot-toast";

export default function AdminAuthLogin({ onSuccess }) {
  const auth = getAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // If user already signed in with isAdmin, allow right away
  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) return;
      const token = await user.getIdTokenResult(true);
      if (token.claims.isAdmin === true) {
        onSuccess();
      }
    });
    return () => unsub();
  }, []);

  const handleLogin = async () => {
    setLoading(true);
    try {
      const { user } = await signInWithEmailAndPassword(auth, email, password);
      const token = await user.getIdTokenResult(true);
      if (token.claims.isAdmin === true) {
        toast.success("Admin verified");
        onSuccess();
      } else {
        toast.error("This account is not an admin");
        await signOut(auth);
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
      />
      <input
        type="password"
        placeholder="Admin Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Verifying..." : "Verify"}
      </button>
    </div>
  );
}
