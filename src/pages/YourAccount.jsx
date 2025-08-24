// src/pages/YourAccount.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/YourAccount.css";

export default function YourAccount() {
  const navigate = useNavigate();

  const handleProtectedRedirect = (path) => {
    navigate(`/${path}`);
  };

  return (
    <>
      <Header />
      <div className="your-account-container">
        <h1>Your Yulaa Account</h1>
        <p className="subtitle">
          Welcome back! Manage your orders, security, addresses, and more.
        </p>

        <section className="account-grid-section">
          <div className="account-grid">
            <div
              className="account-item"
              onClick={() => handleProtectedRedirect("orders")}
            >
              <div className="icon">📦</div>
              <h4>Your Orders</h4>
              <p>Track, return or buy things again</p>
            </div>
              <div
              className="account-item"
              onClick={() => handleProtectedRedirect("my-queries")}
            >
              <div className="icon">📦</div>
              <h4>MyQueries</h4>
              <p>Check your queries here</p>
            </div>
            <div
              className="account-item"
              onClick={() => handleProtectedRedirect("security")}
            >
              <div className="icon">🔒</div>
              <h4>Login & Security</h4>
              <p>Update name, email & password</p>
            </div>
            <div
              className="account-item"
              onClick={() => handleProtectedRedirect("addresses")}
            >
              <div className="icon">📍</div>
              <h4>Your Addresses</h4>
              <p>Manage saved addresses</p>
            </div>
            <div
              className="account-item"
              onClick={() => handleProtectedRedirect("payments")}
            >
              <div className="icon">💳</div>
              <h4>Payment Options</h4>
              <p>Add or update payment methods</p>
            </div>
            <div
              className="account-item"
              onClick={() => handleProtectedRedirect("wishlist")}
            >
              <div className="icon">❤️</div>
              <h4>Your Wishlist</h4>
              <p>See your saved products</p>
            </div>
            <div
              className="account-item"
              onClick={() => handleProtectedRedirect("help")}
            >
              <div className="icon">❓</div>
              <h4>Help & Support</h4>
              <p>Raise queries or find answers</p>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
