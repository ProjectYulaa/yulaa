import React, { useState, useEffect } from "react";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/ContactSection.css";
import { toast, Toaster } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../contexts/AuthContext"; // ✅

export default function ContactSection() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    queryType: "",
    product: "",
    rating: "",
    msg: "",
  });

  const [products, setProducts] = useState([]);
  const [showQueriesButton, setShowQueriesButton] = useState(false);
 const { user: currentUser } = useAuthContext(); // ✅
  const navigate = useNavigate();

  const handleViewQueries = () => {
    if (currentUser?.email) {
      navigate("/my-queries");
    } else {
      localStorage.setItem("redirectAfterLogin", "/my-queries");
      navigate("/signin");
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const productList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name,
        }));
        setProducts(productList);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await addDoc(collection(db, "contacts"), {
        ...form,
        createdAt: serverTimestamp(),
      });

      toast.success(
        "Your Query has been registered with Yulaa. We will respond to your query in 48–72 business hrs via email or phone. Thank you for using Yulaa Services."
      );

      setShowQueriesButton(true);
      setForm({
        name: "",
        email: "",
        phone: "",
        queryType: "",
        product: "",
        rating: "",
        msg: "",
      });
    } catch (e) {
      toast.error("Oops! Something went wrong. Please try again later.");
    }
  };

  return (
    <section className="contact-section">
      <div className="contact-info">
        <p>📍 Yulaa Address</p>
        <p>📞 +91 1234567890</p>
        <p>✉️ myyulaa@gmail.com</p>
        <p>📸 @YulaaInsta • 👍 /YulaaFacebook</p>
      </div>

      <form onSubmit={handleSubmit}>
        <input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Name"
          required
        />
        <input
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="Email"
          type="email"
          required
        />
        <input
          value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })}
          placeholder="Phone"
          required
        />

        <select
          value={form.queryType}
          onChange={(e) => setForm({ ...form, queryType: e.target.value })}
          required
        >
          <option value="">Select Query Type</option>
          <option value="Refund Issue">Refund Issue</option>
          <option value="Price Concern">Price Concern</option>
          <option value="Over Charged">Over Charged</option>
          <option value="Payment Failed">Payment Failed</option>
          <option value="Order Status/Tracking">Order Status/Tracking</option>
          <option value="Product Query">Product Query</option>
          <option value="Product Feedback">Product Feedback</option>
          <option value="Others">Others</option>
        </select>

        {form.queryType === "Product Feedback" && (
          <>
            <select
              value={form.product}
              onChange={(e) => setForm({ ...form, product: e.target.value })}
              required
            >
              <option value="">Select Product</option>
              {products.map((p) => (
                <option key={p.id} value={p.name}>
                  {p.name}
                </option>
              ))}
            </select>

            <select
              value={form.rating}
              onChange={(e) => setForm({ ...form, rating: e.target.value })}
              required
            >
              <option value="">Rate the Product</option>
              <option value="1">★☆☆☆☆</option>
              <option value="2">★★☆☆☆</option>
              <option value="3">★★★☆☆</option>
              <option value="4">★★★★☆</option>
              <option value="5">★★★★★</option>
            </select>
          </>
        )}

        <textarea
          value={form.msg}
          onChange={(e) => setForm({ ...form, msg: e.target.value })}
          placeholder="Message"
          required
        />
        <button type="submit">Submit</button>
        
      {showQueriesButton && (
        <button onClick={handleViewQueries} className="view-queries-btn">
          View My Query Status
        </button>
      )}
      </form>
    </section>
  );
}
