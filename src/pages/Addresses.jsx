import React, { useEffect, useState } from "react";
import "../styles/Checkout.css";
import { db, auth } from "../firebase";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartSummary from "../components/CartSummary";
import { generateOrderId } from '../utils/orderUtils';

const Checkout = () => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [subtotalAmount, setSubtotalAmount] = useState(0);
const [shippingCharge, setShippingCharge] = useState(0);
const [totalAmount, setTotalAmount] = useState(0);
  const [cartItems, setCartItems] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
const [selectedAddress, setSelectedAddress] = useState(null);
const [selectedBillingMethod, setSelectedBillingMethod] = useState(null);
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
  const [defaultAddress, setDefaultAddress] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState("");
  const navigate = useNavigate();  

  const clearCartInFirestore = async (userId) => {
  const cartRef = collection(db, "users", userId, "cart");
  const snapshot = await getDocs(cartRef);
  const deletions = snapshot.docs.map((docSnap) => deleteDoc(doc(db, "users", userId, "cart", docSnap.id)));
  await Promise.all(deletions);
};
useEffect(() => {
  if (cartItems.length > 0) {
    const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0);
    const shipping = subtotal >= 999 ? 0 : subtotal >= 499 ? 0 : 59;
    const discount = subtotal >= 999 ? subtotal * 0.1 : 0;
    const finalTotal = subtotal - discount + shipping;

    setSubtotalAmount(subtotal.toFixed(2));
    setShippingCharge(shipping);
    setTotalAmount(finalTotal.toFixed(2));
  }
}, [cartItems]);

const fetchLatestCartItems = async (uid) => {
  if (uid) {
    const cartRef = doc(db, "carts", uid);
    const cartSnap = await getDoc(cartRef);
    return cartSnap.exists() ? cartSnap.data().items : [];
  } else {
    const localCart = JSON.parse(localStorage.getItem("cart")) || [];
    return localCart;
  }
};

useEffect(() => {
  const fetchCartItems = async () => {
    if (user?.uid) {
      // Logged in - fetch from Firestore
      const userCartRef = doc(db, 'carts', user.uid);
      const docSnap = await getDoc(userCartRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setCartItems(data.items || []);
      }
    } else {
      // Guest - fetch from localStorage
      const localCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCartItems(localCart);
    }
  };

  fetchCartItems();
}, [user]);

useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (user) => {
    if (user) {
      setUser(user); // ✅ Set user object
      setUserId(user.uid); // you already had this
      await fetchAddresses(user.uid);
    }
  });

  return () => unsubscribe(); // cleanup
}, []);

  const fetchAddresses = async (uid) => {
    const ref = collection(db, "users", uid, "addresses");
    const docs = await getDocs(ref);
    const all = [];
    docs.forEach((doc) => all.push({ id: doc.id, ...doc.data() }));
    setAddresses(all);
    const def = all.find((a) => a.isDefault);
    setDefaultAddress(def || null);
    setShowForm(all.length === 0);
  };

  const handlePincodeLookup = async () => {
    if (formData.pincode.length === 6) {
      try {
        const response = await fetch(
          `https://api.postalpincode.in/pincode/${formData.pincode}`,
        );
        const data = await response.json();
        const location = data[0]?.PostOffice?.[0];
        if (location) {
          setFormData((prev) => ({
            ...prev,
            city: location.District,
            state: location.State,
          }));
        }
      } catch (error) {
        console.error("Error fetching pincode data", error);
      }
    }
  };

  const saveAddress = async () => {
    if (!userId) return;
    const ref = collection(db, "users", userId, "addresses");
    await addDoc(ref, { ...formData, isDefault: addresses.length === 0 });
    await fetchAddresses(userId);
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

  const deleteAddress = async (id) => {
    await deleteDoc(doc(db, "users", userId, "addresses", id));
    await fetchAddresses(userId);
  };

  const setAsDefault = async (id) => {
    const ref = collection(db, "users", userId, "addresses");
    const docs = await getDocs(ref);
    for (const d of docs.docs) {
      await updateDoc(d.ref, { isDefault: d.id === id });
    }
    await fetchAddresses(userId);
  };

const saveOrder = async (orderData) => {
  try {
    const docRef = await addDoc(collection(db, "orders"), orderData);
    console.log("Order saved with ID:", docRef.id);
  } catch (error) {
    console.error("Error saving order:", error);
    throw error;
  }
};  
const handlePlaceOrder = async () => {
  if (!defaultAddress) {
    alert("Please select a delivery address.");
    return;
  }

  // ✅ Fetch fresh cart
  const freshCart = await fetchLatestCartItems(user?.uid);
  setCartItems(freshCart);

  if (!freshCart || freshCart.length === 0) {
    alert("Your cart is empty. Please add items before placing an order.");
    return;
  }

  const orderData = {
    orderId: generateOrderId(),
    date: new Date().toLocaleDateString(),
    addresses: selectedAddress,
    paymentMethod: selectedPayment,
    items: freshCart,
    subtotal: subtotalAmount,
    shipping: shippingCharge,
    total: totalAmount,
    email: user?.email,
  };

  // Proceed to payment
  if (selectedPayment === "online") {
    navigate('/payment', { state: { orderData } });
  } else {
    setShowPopup(true); // COD path already handled separately
  }
};



const handleConfirmOrder = async () => {
  const orderId = `ORD-${Date.now()}`;
  const order = {
    orderId,
    cart: cartItems,
    addresses: selectedAddress,
    payment: selectedBillingMethod,
    status: "Placed",
    createdAt: new Date(),
  };

  // Save order to Firestore
  await addDoc(collection(db, "orders"), order);

  setShowPopup(false);

  if (selectedBillingMethod?.type === "COD") {
    navigate("/orderconfirmation", { state: { order } });
  } else {
    navigate("/payment", { state: { order } });
  }
};
  return (
    <>
      <Header />
      <div className="page-title">
          <h1>Manage Billing Address and more</h1>
          <p>
            Thoughtfully curated essentials to comfort, soothe, and support you
            through pregnancy and beyond.
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

      <div className="checkout-container">
        {/* Address Section */}
        <div className="address-section">
          {addresses.length > 0 && (
            <>
              <h3>Saved Addresses</h3>
              <div className="address-list">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`address-card ${addr.isDefault ? "default" : ""}`}
                  >
                    <p>
                      <strong>{addr.name}</strong> ({addr.phone})
                    </p>
                    <p>
                      {addr.town}, {addr.city}, {addr.state} - {addr.pincode},{" "}
                      {addr.fulladdress}
                    </p>
                    <p>{addr.instruction}</p>
                    <div className="address-actions">
                      <button onClick={() => setAsDefault(addr.id)}>
                        Set As Default
                      </button>
                      <button onClick={() => deleteAddress(addr.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {showForm && (
            <div className="address-form">
              <h3>Add New Address</h3>
              <input
                placeholder="Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
              <input
                placeholder="Phone Number"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
              <input
                placeholder="Email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
              <input
                placeholder="Pincode"
                value={formData.pincode}
                onBlur={handlePincodeLookup}
                onChange={(e) =>
                  setFormData({ ...formData, pincode: e.target.value })
                }
              />
              <input placeholder="City" value={formData.city} disabled />
              <input placeholder="State" value={formData.state} disabled />
              <input
                placeholder="Town / Area"
                value={formData.town}
                onChange={(e) =>
                  setFormData({ ...formData, town: e.target.value })
                }
              />
              <input
                placeholder="Address"
                value={formData.fulladdress}
                onChange={(e) =>
                  setFormData({ ...formData, fulladdress: e.target.value })
                }
              />
              <textarea
                placeholder="Delivery Instructions"
                value={formData.instruction}
                onChange={(e) =>
                  setFormData({ ...formData, instruction: e.target.value })
                }
              />
              <button onClick={saveAddress}>Save Address</button>
            </div>
          )}

          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="add-address-btn"
            >
              + Add Another Address
            </button>
          )}
        </div>
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
};
export default Checkout;
