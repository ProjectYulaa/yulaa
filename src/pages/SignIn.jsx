// src/pages/SignIn.jsx
import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  fetchSignInMethodsForEmail,
} from "firebase/auth";
import { auth } from "../firebase";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { toast, Toaster } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/SignIn.css";
import { syncGuestCartToUserCart } from "../utils/cartUtils";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [resetMode, setResetMode] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
const redirectPath = queryParams.get("redirect") || "/";
const safeRedirect = redirectPath.startsWith("/") ? redirectPath : `/${redirectPath}`;

  const handleSignIn = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      toast.success("Welcome back!");

      // Sync guest cart after login
      await syncGuestCartToUserCart(user.uid);

      // Handle BuyNow or redirect logic
      const redirectAfterLogin = sessionStorage.getItem("redirectAfterLogin");
      const buynowProductId = sessionStorage.getItem("buynowProductId");

      if (redirectAfterLogin) {
        sessionStorage.removeItem("redirectAfterLogin");

        if (buynowProductId) {
          sessionStorage.removeItem("buynowProductId");
          navigate(`/trigger-buynow/${buynowProductId}`);
        } else {
          navigate(redirectAfterLogin);
        }
      } else {
        navigate(safeRedirect); // fallback
      }
    } catch (err) {
      console.error("Login error:", err);
      if (err.code === "auth/user-not-found") {
        toast.error("No account found with this email.");
      } else if (err.code === "auth/wrong-password") {
        toast.error("Incorrect password.");
      } else if (err.code === "auth/invalid-email") {
        toast.error("Invalid email format.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  const handlePasswordReset = async (e) => {
    e.preventDefault();
    try {
      const signInMethods = await fetchSignInMethodsForEmail(auth, email);
      if (signInMethods.length === 0) {
        toast.error("No account found with this email.");
        return;
      }

      await sendPasswordResetEmail(auth, email);
      toast.success("Password reset email sent! Check your inbox.");
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.code === "auth/invalid-email") {
        toast.error("Invalid email format.");
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <>
      <Header />
      <div className="signin-container">
        <form
          onSubmit={resetMode ? handlePasswordReset : handleSignIn}
          className="signin-form"
        >
          <h2>{resetMode ? "Forgot Password?" : "Sign In to Yulaa"}</h2>

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="input-field"
            required
          />

          {!resetMode && (
            <input
              type="password"
              placeholder="Your Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field"
              required
            />
          )}

          <button type="submit" className="signin-button">
            {resetMode ? "Send Reset Link" : "Sign In"}
          </button>

          <div>
            <button
              type="button"
              className="forget-button"
              onClick={() => setResetMode(!resetMode)}
            >
              {resetMode ? "Back to Sign In" : "Forgot your password?"}
            </button>
          </div>

          <div>
            Don’t have an account?{" "}
            <Link to={`/signup?redirect=${redirectPath}`}>
              Click here to Sign Up
            </Link>
          </div>
        </form>
      </div>
      <Footer />
    </>
  );
}
