// src/App.jsx
import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { auth } from "./firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { toast, Toaster } from "react-hot-toast";
import { AuthProvider } from "./contexts/AuthContext";
import { BuyNowProvider } from "./contexts/BuyNowContext";
import { CartProvider } from "./contexts/CartContext";

import './App.css'
// Pages
import Home from "./pages/Home";
import About from "./pages/About";
import TermsOfService from "./pages/TermsofServices";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import YourAccount from "./pages/YourAccount";
import Orders from "./pages/Orders";
import Products from "./pages/Products";
import ProductDetails from "./pages/ProductDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Orderconfirmation from "./pages/Orderconfirmation";
import Addresses from "./pages/Addresses";
import Security from "./pages/Security";
import MyQueries from "./pages/MyQueries";
import Payments from "./pages/Payments";
import Help from "./pages/Help";
import Chat from "./pages/Chat";

// Admin Pages
import AdminDashboard from "./admin/AdminDashboard";
import AdminLogin from "./admin/AdminLogin";
import ContactsAdmin from "./admin/pages/ContactsAdmin";
import OrdersAdmin from "./admin/pages/OrdersAdmin";
import ProductsAdmin from "./admin/pages/ProductsAdmin";
import TestimonialsAdmin from "./admin/pages/TestimonialsAdmin";
import UsersAdmin from "./admin/pages/UsersAdmin";
import AdminChatDashboard from "./admin/AdminChatDashboard";


function App() {
  useEffect(() => {
    if (isSignInWithEmailLink(auth, window.location.href)) {
      let email = window.localStorage.getItem("emailForSignIn");
      if (!email) {
        email = window.prompt("Please provide your email again");
      }
      signInWithEmailLink(auth, email, window.location.href)
        .then(() => {
          window.localStorage.removeItem("emailForSignIn");
          toast.success("You're now signed in!");
        })
        .catch((err) => {
          toast.error(err.message);
        });
    }
  }, []);

  return (
    <AuthProvider>
       <BuyNowProvider> 
        <CartProvider>
        <div className="overflow-x-hidden">
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              background: "#fff0f5", // light pink base
              color: "#222",         // soft black text
              boxShadow: "0px 4px 12px rgba(0, 0, 0, 0.15)",
              borderRadius: "12px",
              padding: "12px 16px",
              fontSize: "15px",
              fontFamily: "'Inter', sans-serif",
            },
            success: {
              icon: "✅",
              style: {
                background: "#e6ffed",
                color: "#065f46",
              },
            },
            error: {
              icon: "⚠️",
              style: {
                background: "#ffe8e8",
                color: "#b91c1c",
              },
            },
          }}
        />

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/help" element={<Help />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/youraccount" element={<YourAccount />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<ProductDetails />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/orderconfirmation" element={<Orderconfirmation />} />
          <Route path="/addresses" element={<Addresses />} />
          <Route path="/security" element={<Security />} />
          <Route path="/my-queries" element={<MyQueries />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/contacts" element={<ContactsAdmin />} />
          <Route path="/admin/orders" element={<OrdersAdmin />} />
          <Route path="/admin/products" element={<ProductsAdmin />} />
          <Route path="/admin/testimonials" element={<TestimonialsAdmin />} />
          <Route path="/admin/users" element={<UsersAdmin />} />
          <Route path="/admin/chatdashboard" element={<AdminChatDashboard />} />
          
        </Routes>
      </div>
     </CartProvider> 
     </BuyNowProvider>
    </AuthProvider>
  );
}

export default App;
