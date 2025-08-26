import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import AdminAuthLogin from "./AdminAuthLogin.jsx";
import { toast, Toaster } from "react-hot-toast";

export default function YeahMeraSecurityPageHai() {
  const navigate = useNavigate();

  const handleSuccess = () => {
    // short-lived gate token so AdminLayout knows you came via gate
    const payload = { ok: true, exp: Date.now() + 15 * 60 * 1000 };
    sessionStorage.setItem("admin_gate", JSON.stringify(payload));
    navigate("/admin");
  };

  // if already have a valid gate token, go directly
  useEffect(() => {
    try {

  // If redirected after logout, show toast
   if (sessionStorage.getItem("logged_out") === "true") {
       toast.success("You have been logged out");
       sessionStorage.removeItem("logged_out");
     }

      const gate = JSON.parse(sessionStorage.getItem("admin_gate") || "null");
      if (gate?.ok && gate.exp > Date.now()) navigate("/admin");
    } catch {}
  }, [navigate]);

   return (
   <>
      <AdminAuthLogin onSuccess={handleSuccess} />
      <Toaster />
    </>
  );
}
