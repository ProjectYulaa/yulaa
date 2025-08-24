import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { toast, Toaster } from "react-hot-toast";
import AdminLogin from "../AdminLogin";
import "../../styles/Admin.css"; 
import * as XLSX from "xlsx";

const TestimonialsAdmin = () => {
  const [verified, setVerified] = useState(false);
  const [testimonials, setTestimonials] = useState([]);
  const [newTestimonial, setNewTestimonial] = useState({
    name: "",
    feedback: "",
    rating: "",
    city: "",
  });

  useEffect(() => {
    if (verified) {
      fetchTestimonials();
    }
  }, [verified]);

  const fetchTestimonials = async () => {
    try {
      const snapshot = await getDocs(collection(db, "testimonials"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTestimonials(data);
    } catch (err) {
      toast.error("Failed to fetch testimonials");
      console.error(err);
    }
  };

  const handleAdd = async () => {
    try {
      await addDoc(collection(db, "testimonials"), {
        ...newTestimonial,
        rating: Number(newTestimonial.rating),
      });
      toast.success("Testimonial added");
      setNewTestimonial({ name: "", feedback: "", rating: "", city: "" });
      fetchTestimonials();
    } catch (err) {
      toast.error("Add failed");
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteDoc(doc(db, "testimonials", id));
      toast.success("Testimonial deleted");
      fetchTestimonials();
    } catch (err) {
      toast.error("Delete failed");
      console.error(err);
    }
  };

  if (!verified) {
    return (
      <AdminLogin
        section="testimonials"
        onSuccess={() => setVerified(true)}
      />
    );
  }

const exportToExcel = () => {
  const worksheet = XLSX.utils.json_to_sheet(testimonials);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Testimonials");
  const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
  const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
  saveAs(blob, "testimonials.xlsx");
};
  
  return (
    <div className="admin-section">
      <h2>Manage Testimonials</h2>
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
  <button onClick={() => window.history.back()}>← Back to Dashboard</button>
  <button onClick={exportToExcel}>Export to Excel</button>
</div>

      {/* Add New Testimonial */}
      <div className="add-form">
        <h3>Add New Testimonial</h3>
        {["name", "feedback", "rating", "city"].map((field) => (
          <input
            key={field}
            type={field === "rating" ? "number" : "text"}
            placeholder={field}
            value={newTestimonial[field]}
            onChange={(e) =>
              setNewTestimonial((prev) => ({
                ...prev,
                [field]: e.target.value,
              }))
            }
          />
        ))}
        <button onClick={handleAdd}>Add Testimonial</button>
      </div>

      {/* Testimonials List */}
      {testimonials.length === 0 ? (
        <p>No testimonials available.</p>
      ) : (
        testimonials.map((t) => (
          <div key={t.id} className="testimonial-card">
            <h4>{t.name}</h4>
            <p>{t.feedback}</p>
            <p>⭐ {t.rating}/5</p>
            <p>{t.city}</p>
            <button onClick={() => handleDelete(t.id)}>Delete</button>
          </div>
        ))
      )}
    </div>
  );
};

export default TestimonialsAdmin;
