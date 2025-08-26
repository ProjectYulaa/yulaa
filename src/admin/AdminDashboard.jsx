import React from "react";
import { useNavigate } from "react-router-dom";
import { getAuth, signOut } from "firebase/auth";   // 👈 import Firebase Auth
import "../styles/Admin.css";

const sections = [
  { name: "Customer Queries", path: "/admin/contacts" },
  { name: "Orders", path: "/admin/orders" },
  { name: "Products", path: "/admin/products" },
  { name: "Testimonials", path: "/admin/testimonials" },
  { name: "Users", path: "/admin/users" },
  { name: "Admin Chat Dashboard", path: "/admin/chatdashboard" },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const auth = getAuth();

  const handleLogout = async () => {
    try {
      // Clear gate token
      sessionStorage.removeItem("admin_gate");

+     // Set a flag so next page knows we logged out
+     sessionStorage.setItem("logged_out", "true");

      // Sign out from Firebase Auth
      await signOut(auth);

      // Redirect to security gate
      navigate("/yeahmerasecuritypagehai");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };


  return (
    <div className="admin-home">
      <h2>Yulaa Admin Dashboard</h2>

      <div className="section-buttons">
        {sections.map((sec) => (
          <button
            key={sec.name}
            onClick={() => navigate(sec.path)}
            className="admin-btn"
          >
            {sec.name}
          </button>
        ))}
      </div>

      {/* 👇 Logout button */}
      <div className="logout-btn">
        <button onClick={handleLogout} className="admin-btn logout">
          Logout
        </button>
      </div>
    </div>
  );
};

export default AdminDashboard;
