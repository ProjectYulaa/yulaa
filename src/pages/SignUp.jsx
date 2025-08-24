import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "../firebase";
import { useNavigate, Link } from "react-router-dom";
import { doc, setDoc } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";
import Header from "../components/Header";
import "../styles/SignUp.css";

const SignUp = () => {
  const [name, setName] = useState("");
  const [phonenumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const navigate = useNavigate();

  const handleSignUp = async (e) => {
    e.preventDefault();

    if (!name || !phonenumber || !email || !password) {
      return toast.error("Please fill all fields");
    }

    const passwordRegex = /^(?=.*[A-Z])(?=.*[\W_]).{6,}$/;
    if (!passwordRegex.test(password)) {
      return toast.error(
        "Password must be at least 6 characters, include a capital letter and special character."
      );
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      await updateProfile(user, {
        displayName: name,
      });

      await setDoc(doc(db, "users", user.uid), {
        name,
        email,
        phonenumber,
        createdAt: new Date(),
      });

      toast.success("Account created successfully!");
      navigate("/");
    } catch (error) {
      console.error("SignUp Error:", error);
      toast.error(error.message || "Signup failed");
    }
  };

  return (
    <>
      <Header />
      <div className="signup-container">
        <h2>Sign Up</h2>
        <form onSubmit={handleSignUp} className="signup-form">
          <input
            type="text"
            placeholder="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <input
            type="tel"
            placeholder="Phone Number"
            value={phonenumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
          />
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Create Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Create Account</button>
          <p>
            Already have an account? <Link to="/signin">Login here</Link>
          </p>
        </form>
      </div>
    </>
  );
};

export default SignUp;
