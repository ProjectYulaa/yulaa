import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import "../styles/Payments.css";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { CheckCircle, XCircle } from "lucide-react"; // ✅ Icons

export default function Payments() {
  const [billingMethods, setBillingMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newMethod, setNewMethod] = useState({
    type: "card",
    cardNumber: "",
    expiry: "",
    cvv: "",
    name: "",
    upiId: "",
  });
  const [isValid, setIsValid] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showIcon, setShowIcon] = useState(false);

  // Luhn Algorithm for card validation
  const isValidCardNumber = (number) => {
    const clean = number.replace(/\D/g, "");
    let sum = 0;
    let shouldDouble = false;

    for (let i = clean.length - 1; i >= 0; i--) {
      let digit = parseInt(clean[i], 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };

  // Simple UPI regex validation
  const isValidUpiId = (upi) => /^[\w.-]+@[\w.-]+$/.test(upi);

  // Format card input with spaces
  const formatCardInput = (value) => {
    return value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
  };

  // Real-time validation on input change
  useEffect(() => {
    let valid = false;
    let error = "";

    if (newMethod.type === "card") {
      const cleanCard = newMethod.cardNumber.replace(/\D/g, "");
      if (!newMethod.cardNumber || !newMethod.expiry || !newMethod.cvv || !newMethod.name) {
        error = "Please fill in all card details.";
      } else if (cleanCard.length < 12 || cleanCard.length > 19) {
        error = "Card number length is invalid.";
      } else if (!isValidCardNumber(cleanCard)) {
        error = "Invalid card number.";
      } else {
        valid = true;
      }
    } else if (newMethod.type === "upi") {
      if (!newMethod.upiId) {
        error = "Please enter UPI ID.";
      } else if (!isValidUpiId(newMethod.upiId)) {
        error = "Invalid UPI ID format.";
      } else {
        valid = true;
      }
    }

    setIsValid(valid);
    setErrorMsg(error);
    setShowIcon(newMethod.type === "card" ? newMethod.cardNumber.length > 0 : newMethod.upiId.length > 0);
  }, [newMethod]);

  useEffect(() => {
    const user = auth.currentUser;
    if (!user) {
      toast.error("Please log in to view payment methods.");
      setLoading(false);
      return;
    }

    const billingRef = collection(db, "users", user.uid, "billingMethods");
    const unsubscribe = onSnapshot(billingRef, (snapshot) => {
      const methods = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setBillingMethods(methods);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleDelete = async (id) => {
    try {
      const user = auth.currentUser;
      await deleteDoc(doc(db, "users", user.uid, "billingMethods", id));
      toast.success("Billing method deleted.");
    } catch (err) {
      toast.error("Error deleting billing method.");
      console.error(err);
    }
  };

  const handleAddMethod = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;
    if (!user) return toast.error("Please log in first.");
    if (!isValid) return; // extra safety

    try {
      const payload = {
        type: newMethod.type,
        createdAt: serverTimestamp(),
      };

      if (newMethod.type === "card") {
        payload.cardNumber = newMethod.cardNumber.replace(/\D/g, "");
        payload.expiry = newMethod.expiry;
        payload.cvv = newMethod.cvv;
        payload.name = newMethod.name;
      } else {
        payload.upiId = newMethod.upiId;
      }

      const existingDefault = billingMethods.some((m) => m.isDefault);
      payload.isDefault = !existingDefault;

      await addDoc(collection(db, "users", user.uid, "billingMethods"), payload);

      toast.success("Billing method added.");
      setNewMethod({
        type: "card",
        cardNumber: "",
        expiry: "",
        cvv: "",
        name: "",
        upiId: "",
      });
    } catch (err) {
      toast.error("Error adding billing method.");
      console.error(err);
    }
  };

  const setDefaultMethod = async (id) => {
    try {
      const user = auth.currentUser;
      const methodsRef = collection(db, "users", user.uid, "billingMethods");

      for (const method of billingMethods) {
        if (method.isDefault && method.id !== id) {
          await updateDoc(doc(methodsRef, method.id), { isDefault: false });
        }
      }
      await updateDoc(doc(methodsRef, id), { isDefault: true });
      toast.success("Default billing method updated.");
    } catch (err) {
      toast.error("Error updating default method.");
      console.error(err);
    }
  };

  return (
    <>
      <Header />
            <div className="page-title">
        <h1>Payment Methods</h1>
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
      <div className="payments-page">

        {loading ? (
          <p>Loading...</p>
        ) : billingMethods.length === 0 ? (
          <p>No saved billing methods.</p>
        ) : (
          <ul className="billing-list">
            {billingMethods.map((method) => (
              <li key={method.id} className="billing-item">
                <div>
                  {method.type === "card" ? (
                    <>
                      <strong>Card:</strong> **** **** **** {method.cardNumber?.slice(-4)}
                      <span> ({method.name})</span>
                    </>
                  ) : (
                    <>
                      <strong>UPI:</strong> {method.upiId}
                    </>
                  )}
                  {method.isDefault && <span className="default-badge">Default</span>}
                </div>

                <div className="billing-actions">
                  {!method.isDefault && (
                    <button
                      onClick={() => setDefaultMethod(method.id)}
                      className="default-btn"
                    >
                      Set Default
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="delete-btn"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <h3>Add New Payment Method</h3>
        <form onSubmit={handleAddMethod} className="add-method-form">
          <label>
            Type:
            <select
              value={newMethod.type}
              onChange={(e) => setNewMethod({ ...newMethod, type: e.target.value })}
            >
              <option value="card">Card</option>
              <option value="upi">UPI</option>
            </select>
          </label>

          {newMethod.type === "card" && (
            <>
              <div className="input-with-icon">
                <input
                  type="text"
                  placeholder="Card Number"
                  value={newMethod.cardNumber}
                  onChange={(e) =>
                    setNewMethod({ ...newMethod, cardNumber: formatCardInput(e.target.value) })
                  }
                />
                {showIcon && (
                  isValid ? (
                    <CheckCircle size={20} color="green" />
                  ) : (
                    <XCircle size={20} color="red" />
                  )
                )}
              </div>
              <input
                type="text"
                placeholder="Expiry (MM/YY)"
                value={newMethod.expiry}
                onChange={(e) => setNewMethod({ ...newMethod, expiry: e.target.value })}
              />
              <input
                type="password"
                placeholder="CVV"
                value={newMethod.cvv}
                onChange={(e) => setNewMethod({ ...newMethod, cvv: e.target.value })}
              />
              <input
                type="text"
                placeholder="Name on Card"
                value={newMethod.name}
                onChange={(e) => setNewMethod({ ...newMethod, name: e.target.value })}
              />
            </>
          )}

          {newMethod.type === "upi" && (
            <div className="input-with-icon">
              <input
                type="text"
                placeholder="UPI ID"
                value={newMethod.upiId}
                onChange={(e) => setNewMethod({ ...newMethod, upiId: e.target.value })}
              />
              {showIcon && (
                isValid ? (
                  <CheckCircle size={20} color="green" />
                ) : (
                  <XCircle size={20} color="red" />
                )
              )}
            </div>
          )}

          {errorMsg && <p className="error-text">{errorMsg}</p>}

          <button type="submit" className="add-btn" disabled={!isValid}>
            Add Method
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
}
