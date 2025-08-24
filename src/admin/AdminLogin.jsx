import React, { useState, useEffect } from "react";
import { toast, Toaster } from "react-hot-toast";
import { getDoc, doc } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/Admin.css";
import { useNavigate } from "react-router-dom"; // 👈 Add this



const AdminLogin = ({ section, onSuccess }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passKey, setPassKey] = useState("");
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
const handleLogin = async () => {
    setLoading(true);
    try {
      const adminDoc = await getDoc(doc(db, "adminCredentials", "adminLogin"));
      const passkeyDoc = await getDoc(doc(db, "adminCredentials", "passkeys"));

      if (!adminDoc.exists() || !passkeyDoc.exists()) {
        toast.error("Admin credentials not set in Firestore.");
        return;
      }

      const { email: adminEmail, password: adminPassword } = adminDoc.data();
      const sectionKey = passkeyDoc.data()[`${section}Key`];

      if (email !== adminEmail || password !== adminPassword) {
        toast.error("Invalid email or password");
      } else if (passKey !== sectionKey) {
        toast.error("Incorrect pass key");
      } else {
        toast.success("Access granted!");
        onSuccess(); // call back to unlock page
      }
    } catch (err) {
      toast.error("Login failed");
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <div className="admin-modal">
      <h2>Admin Verification - {section}</h2>
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
      <input
        type="text"
        placeholder="Section Pass Key"
        value={passKey}
        onChange={(e) => setPassKey(e.target.value)}
      />
      <button onClick={handleLogin} disabled={loading}>
        {loading ? "Verifying..." : "Verify"}
      </button>

      {/* 👇 Back to Dashboard Link */}
      <div className="back-btn" onClick={() => navigate("/admin")}>
        ← Back to Admin Dashboard
      </div>

    </div>
  );
};

export default AdminLogin;
