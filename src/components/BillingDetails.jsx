import React, { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import OrderConfirmationPopup from "../components/OrderConfirmationPopup";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle, FaTimesCircle, FaTrash, FaStar } from "react-icons/fa";
import "../styles/BillingDetails.css";

const BillingDetails = () => {
  const auth = getAuth();
  const user = auth.currentUser;
  const userId = user?.uid;

  // Billing methods state
  const [methods, setMethods] = useState([]);
  const [loadingMethods, setLoadingMethods] = useState(true);

  // Form state for adding billing method
  const [type, setType] = useState("card");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [name, setName] = useState("");
  const [upiId, setUpiId] = useState("");

  // Address and cart states
  const [addresses, setAddresses] = useState([]);
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    pincode: "",
    city: "",
    state: "",
    town: "",
    fulladdress: "",
    instruction: "",
  });

  // Order & UI states
  const [cartItems, setCartItems] = useState([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selectedBillingMethod, setSelectedBillingMethod] = useState(null);
  const [message, setMessage] = useState("");

  const navigate = useNavigate();

  // Validation helpers
  const validateCardNumber = (num) => {
    const sanitized = num.replace(/\s+/g, "");
    if (!/^\d{13,19}$/.test(sanitized)) return false;
    let sum = 0;
    let shouldDouble = false;
    for (let i = sanitized.length - 1; i >= 0; i--) {
      let digit = parseInt(sanitized[i], 10);
      if (shouldDouble) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      shouldDouble = !shouldDouble;
    }
    return sum % 10 === 0;
  };
  const validateExpiry = (exp) => {
    if (!/^\d{2}\/\d{2}$/.test(exp)) return false;
    const [mm, yy] = exp.split("/").map(Number);
    if (mm < 1 || mm > 12) return false;
    const now = new Date();
    const expiryDate = new Date(2000 + yy, mm);
    return expiryDate > now;
  };
  const validateCVV = (cvv) => /^\d{3,4}$/.test(cvv);
  const validateUPI = (id) => /^[\w.-]+@[\w.-]+$/.test(id);

  // Load billing methods realtime
  useEffect(() => {
    if (!userId) return;
    const q = collection(db, "users", userId, "billingMethods");
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMethods(data);
      setLoadingMethods(false);
      // Set selectedBillingMethod if none selected yet
      if (!selectedBillingMethod) {
        const def = data.find((m) => m.isDefault) || data[0];
        setSelectedBillingMethod(def || null);
      }
    });
    return () => unsub();
  }, [userId, selectedBillingMethod]);

  // Load addresses on mount
  useEffect(() => {
    if (!userId) return;
    fetchAddresses();
  }, [userId]);

  // Load cart items on mount
  useEffect(() => {
    const fetchCartItems = async () => {
      if (!userId) {
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartItems(localCart);
        return;
      }
      const cartRef = doc(db, "carts", userId);
      const docSnap = await getDocs(collection(db, "carts", userId, "items"));
      if (docSnap.empty) {
        setCartItems([]);
      } else {
        const items = [];
        docSnap.forEach((doc) => items.push({ id: doc.id, ...doc.data() }));
        setCartItems(items);
      }
    };
    fetchCartItems();
  }, [userId]);

  // Fetch addresses
  const fetchAddresses = async () => {
    if (!userId) return;
    const ref = collection(db, "users", userId, "addresses");
    const docs = await getDocs(ref);
    const all = [];
    docs.forEach((doc) => all.push({ id: doc.id, ...doc.data() }));
    setAddresses(all);
    const def = all.find((a) => a.isDefault);
    setDefaultAddress(def || null);
    setShowForm(all.length === 0);
  };

  // Save new address
  const saveAddress = async () => {
    if (!userId) return;
    const ref = collection(db, "users", userId, "addresses");
    await addDoc(ref, { ...formData, isDefault: addresses.length === 0 });
    await fetchAddresses();
    setShowForm(false);
    setFormData({
      name: "",
      phone: "",
      email: "",
      pincode: "",
      city: "",
      state: "",
      town: "",
      fulladdress: "",
      instruction: "",
    });
  };

  // Set default address
  const setAsDefaultAddress = async (id) => {
    if (!userId) return;
    const ref = collection(db, "users", userId, "addresses");
    const docs = await getDocs(ref);
    for (const d of docs.docs) {
      await updateDoc(d.ref, { isDefault: d.id === id });
    }
    await fetchAddresses();
  };

  // Add billing method
  const handleAddMethod = async () => {
    if (!userId) {
      setMessage("Please log in first.");
      return;
    }
    if (type === "card") {
      if (!validateCardNumber(cardNumber)) {
        setMessage("Invalid card number.");
        return;
      }
      if (!validateExpiry(expiry)) {
        setMessage("Invalid expiry date.");
        return;
      }
      if (!validateCVV(cvv)) {
        setMessage("Invalid CVV.");
        return;
      }
      if (!name) {
        setMessage("Name on card is required.");
        return;
      }
    } else if (type === "upi") {
      if (!validateUPI(upiId)) {
        setMessage("Invalid UPI ID.");
        return;
      }
    }

    // Check duplicate (card by last 4 digits, upi by upiId)
    const isDuplicate = methods.some((m) =>
      type === "card"
        ? m.cardNumber?.slice(-4) === cardNumber.slice(-4)
        : m.upiId === upiId
    );
    if (isDuplicate) {
      setMessage(`${type === "card" ? "Card" : "UPI"} already saved.`);
      return;
    }

    const hasDefault = methods.some((m) => m.isDefault);

    const newMethod = {
      type,
      isDefault: !hasDefault,
      createdAt: serverTimestamp(),
      ...(type === "card"
        ? {
            cardNumber: `**** **** **** ${cardNumber.slice(-4)}`,
            expiry,
            name,
          }
        : { upiId }),
    };

    await addDoc(collection(db, "users", userId, "billingMethods"), newMethod);
    setMessage(`${type === "card" ? "Card" : "UPI"} added successfully.`);

    // Clear inputs
    setCardNumber("");
    setExpiry("");
    setCvv("");
    setName("");
    setUpiId("");
  };

  // Delete billing method
  const handleDeleteMethod = async (id) => {
    await deleteDoc(doc(db, "users", userId, "billingMethods", id));
  };

  // Set default billing method
  const handleSetDefaultMethod = async (id) => {
    if (!userId) return;
    const batchUpdates = methods.map((m) =>
      updateDoc(doc(db, "users", userId, "billingMethods", m.id), {
        isDefault: m.id === id,
      })
    );
    await Promise.all(batchUpdates);
  };

  // Handle placing order
  const handlePlaceOrder = () => {
    if (!selectedBillingMethod) {
      setMessage("Please select a billing method before placing the order.");
      return;
    }
    if (!defaultAddress) {
      setMessage("Please select or add a delivery address.");
      return;
    }
    if (!cartItems.length) {
      setMessage("Your cart is empty. Please add items before placing the order.");
      return;
    }
    setMessage("");
    setShowPopup(true);
  };

  // Confirm order and save in Firestore
  const handleConfirmOrder = async () => {
    const orderId = `ORD-${Date.now()}`;
    const order = {
      orderId,
      cart: cartItems,
      address: defaultAddress,
      paymentMethod: selectedBillingMethod,
      status: "Placed",
      createdAt: new Date(),
      userId,
    };
    await addDoc(collection(db, "orders"), order);

    // Optionally clear cart
    // (you can add clear cart logic here)

    setShowPopup(false);
    setMessage("Order placed successfully!");

    // Redirect after order
    if (selectedBillingMethod.type === "COD") {
      navigate("/orderconfirmation", { state: { order } });
    } else {
      navigate("/payment", { state: { order } });
    }
  };

  return (
    <div className="billing-container">
      <h2>Billing Methods</h2>
      {loadingMethods ? (
        <p>Loading billing methods...</p>
      ) : methods.length === 0 ? (
        <p>No billing methods saved. Please add one to proceed.</p>
      ) : (
        <ul>
          {methods.map((m) => (
            <li key={m.id} style={{ marginBottom: "0.8rem" }}>
              <label>
                <input
                  type="radio"
                  name="billingMethod"
                  checked={selectedBillingMethod?.id === m.id}
                  onChange={() => setSelectedBillingMethod(m)}
                />
              {m.type === "card" ? (
  <>
    Card: **** **** **** {m.cardNumber.slice(-4)} ({m.name})
  </>
) : (
  <>UPI: {m.upiId}</>
)}
                {m.isDefault && <FaStar color="gold" style={{ marginLeft: 6 }} />}
              </label>
              {!m.isDefault && (
                <button onClick={() => handleSetDefaultMethod(m.id)} style={{ marginLeft: 10 }}>
                  Set Default
                </button>
              )}
              <button onClick={() => handleDeleteMethod(m.id)} style={{ marginLeft: 10 }}>
                <FaTrash />
              </button>
            </li>
          ))}
        </ul>
      )}

      <h3>Add New Billing Method</h3>
      <select value={type} onChange={(e) => setType(e.target.value)}>
        <option value="card">Card</option>
        <option value="upi">UPI</option>
      </select>

      {type === "card" && (
        <div>
          <input
            type="text"
            placeholder="Card Number"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value)}
          />
          {cardNumber && (
            validateCardNumber(cardNumber) ? (
              <FaCheckCircle color="green" />
            ) : (
              <FaTimesCircle color="red" />
            )
          )}
          <input
            type="text"
            placeholder="Expiry (MM/YY)"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
          />
          <input
            type="text"
            placeholder="CVV"
            value={cvv}
            onChange={(e) => setCvv(e.target.value)}
          />
          <input
            type="text"
            placeholder="Name on Card"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
      )}

      {type === "upi" && (
        <div>
          <input
            type="text"
            placeholder="UPI ID"
            value={upiId}
            onChange={(e) => setUpiId(e.target.value)}
          />
          {upiId && (validateUPI(upiId) ? <FaCheckCircle color="green" /> : <FaTimesCircle color="red" />)}
        </div>
      )}

      <button onClick={handleAddMethod}>Add Method</button>

      <hr style={{ margin: "2rem 0" }} />

      {/* Address Section */}
      <h2>Delivery Addresses</h2>
      {defaultAddress ? (
        <div>
          <p>{defaultAddress.name}</p>
          <p>
            {defaultAddress.town}, {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}
          </p>
          <p>{defaultAddress.fulladdress}</p>
          <p>{defaultAddress.phone}</p>
        </div>
      ) : (
        <p>No default address set.</p>
      )}
      <button onClick={() => setShowForm(true)}>Add New Address</button>

      {showForm && (
        <div>
          <input
            type="text"
            placeholder="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />
          <input
            type="text"
            placeholder="Phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <input
            type="text"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="text"
            placeholder="Pincode"
            value={formData.pincode}
            onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
          />
          <input
            type="text"
            placeholder="City"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
          />
          <input
            type="text"
            placeholder="State"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
          />
          <input
            type="text"
            placeholder="Town"
            value={formData.town}
            onChange={(e) => setFormData({ ...formData, town: e.target.value })}
          />
          <input
            type="text"
            placeholder="Full Address"
            value={formData.fulladdress}
            onChange={(e) => setFormData({ ...formData, fulladdress: e.target.value })}
          />
          <input
            type="text"
            placeholder="Delivery Instruction"
            value={formData.instruction}
            onChange={(e) => setFormData({ ...formData, instruction: e.target.value })}
          />
          <button onClick={saveAddress}>Save Address</button>
          <button onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      )}

      <hr style={{ margin: "2rem 0" }} />

      {/* Place Order Button */}
      {methods.length > 0 && (
        <button onClick={handlePlaceOrder} style={{ padding: "0.7rem 1.5rem" }}>
          Place Order
        </button>
      )}

      {/* Message */}
      {message && <p style={{ color: "red", marginTop: "1rem" }}>{message}</p>}

      {/* Order Confirmation Popup */}
      {showPopup && (
        <OrderConfirmationPopup
          cartItems={cartItems}
          defaultAddress={defaultAddress}
          paymentMethod={selectedBillingMethod}
          onClose={() => setShowPopup(false)}
          onConfirm={handleConfirmOrder}
        />
      )}
    </div>
  );
};

export default BillingDetails;
