import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { getAuth } from "firebase/auth";
import NotFound from "./pages/NotFound.jsx";

const gateOk = () => {
  try {
    const gate = JSON.parse(sessionStorage.getItem("admin_gate") || "null");
    return gate?.ok && gate.exp > Date.now();
  } catch { return false; }
};

export default function AdminLayout() {
  const auth = getAuth();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsub = auth.onAuthStateChanged(async (user) => {
      if (!user) { setIsAdmin(false); setChecking(false); return; }
      const token = await user.getIdTokenResult(true);
      setIsAdmin(token.claims.isAdmin === true);
      setChecking(false);
    });
    return () => unsub();
  }, []);

  if (checking) return null; // or a small loader

  // Must have: 1) came via gate, and 2) actual isAdmin claim
  if (!gateOk() || !isAdmin) return <NotFound />;

  return <Outlet />;
}
