import React, { useEffect, useState } from 'react';
import '../styles/Security.css';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  RecaptchaVerifier,
  signInWithPhoneNumber
} from 'firebase/auth';

const Security = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState({});
  const [editMode, setEditMode] = useState({});
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState(null);
  const [loading, setLoading] = useState(true);

  // 🔒 Watch for Firebase auth state
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await fetchUserData(currentUser.uid);
      } else {
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  // 📦 Fetch user Firestore profile
  const fetchUserData = async (uid) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserData(data);
        setFormData((prev) => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (field) => {
    setEditMode({ ...editMode, [field]: !editMode[field] });
  };

   const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    validateField(name, value);
  };

  const validateField = (name, value) => {
    if (name === 'phone') {
      const valid = /^\+91\d{10}$/.test(value);
      setErrors((prev) => ({ ...prev, phone: valid ? '' : 'Invalid Indian phone number (+91...)' }));
    }
  };

  const setupRecaptcha = () => {
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        size: 'invisible',
        callback: () => { }
      });
    }
  };

  const handleSavePhone = async () => {
    if (errors.phone) return;

    try {
      setupRecaptcha();
      const appVerifier = window.recaptchaVerifier;
      const result = await signInWithPhoneNumber(auth, formData.phone, appVerifier);
      setConfirmationResult(result);
      setShowOtpInput(true);
    } catch (err) {
      console.error("OTP Send Error:", err);
      alert("Failed to send OTP. Check phone number or network.");
    }
  };

  const verifyOtpAndSave = async () => {
    if (!otp || !confirmationResult) return;

    try {
      await confirmationResult.confirm(otp);
      await updateDoc(doc(db, 'users', user.uid), { phone: formData.phone });
      setEditMode({ ...editMode, phone: false });
      setShowOtpInput(false);
      setOtp('');
      fetchUserData(user.uid);
      alert("Phone number verified and updated!");
    } catch (err) {
      console.error("OTP Verification Error:", err);
      alert("Invalid OTP. Please try again.");
    }
  };

  const handleSave = async (field) => {
    try {
      const docRef = doc(db, 'users', user.uid);
      await updateDoc(docRef, { [field]: formData[field] });
      setEditMode({ ...editMode, [field]: false });
      fetchUserData(user.uid); // refresh
    } catch (err) {
      console.error("Error updating field:", field, err);
    }
  };

  if (loading) return <div className="security-container">Loading your data...</div>;

  return (
    <><Header/>
        <div className="page-title">
        <h1>Login & Security</h1>
        <p>
          Every touchpoint — from products to packaging — is filled with thought
          and care.
        </p>
          <button style={{
            marginTop: '0.5rem',
            padding: '0.35rem 0.7rem',
            backgroundColor: '#0073e6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
          }}
          onClick={() => navigate("/youraccount")}>
            ← Back to Your Yulaa Account
          </button>
      </div>
    <div className="security-container">
      {/* Name */}
      <div className="security-section">
        <label>Name</label>
        {editMode.name ? (
          <>
            <input name="name" value={formData.name || ''} onChange={handleChange} />
            <button onClick={() => handleSave('name')}>Save</button>
          </>
        ) : (
          <>
            <span>{userData?.name}</span>
            <button onClick={() => handleEdit('name')}>Edit</button>
          </>
        )}
      </div>

      {/* Email */}
      <div className="security-section">
        <label>Email</label>
        {editMode.email ? (
          <>
            <input name="email" value={formData.email || ''} onChange={handleChange} />
            <button onClick={() => handleSave('email')}>Save</button>
          </>
        ) : (
          <>
            <span>{userData?.email}</span>
            <button onClick={() => handleEdit('email')}>Edit</button>
          </>
        )}
      </div>

      {/* Phone */}
      <div className="security-section">
        <label>Primary mobile number</label>
        {editMode.phonenumber ? (
          <>
            <input name="phonenumber" value={formData.phonenumber || ''} onChange={handleChange} />
            <button onClick={() => handleSave('phonenumber')}>Save</button>
          </>
        ) : (
          <>
            <span>{userData?.phonenumber}</span>
            <button onClick={() => handleEdit('phonenumber')}>Edit</button>
          </>
        )}
      </div>

      {/* Password Reset */}
      <div className="security-section">
        <label>Password</label>
        <span>********</span>
        <button onClick={() => auth.sendPasswordResetEmail(user.email)}>Change</button>
      </div>

      {/* 2FA Setup */}
      <div className="security-section">
        <label>2-step verification</label>
        <span>Add a layer of security to your account</span>
        <button onClick={() => alert("2FA setup coming soon!")}>Turn on</button>
      </div>

      {/* Compromised Account */}
      <div className="security-section">
        <label>Compromised account?</label>
        <span>Take steps like changing your password and signing out everywhere.</span>
        <button onClick={() => auth.signOut()}>Start</button>
      </div>
    </div>
    <Footer/></>
  );
};

export default Security;
