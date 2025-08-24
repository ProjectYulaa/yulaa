import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Admin.css";

const sections = [
  { name: "Customer Queries", path: "/admin/contacts" },
  { name: "Orders", path: "/admin/orders" },
  { name: "Products", path: "/admin/products" },
  { name: "Testimonials", path: "/admin/testimonials" },
  { name: "Users", path: "/admin/users" },
  { name: "Admin Chat Dashboard", path: "/admin/chatdashboard" }, // ✅ New button
];

const AdminDashboard = () => {
  const navigate = useNavigate();

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
    </div>
  );
};

export default AdminDashboard;
