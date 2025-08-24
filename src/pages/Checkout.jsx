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
} from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import CartSummary from "../components/CartSummary";
import { generateOrderId } from '../utils/orderUtils';
import BillingDetails from "../components/BillingDetails";
import OrderConfirmationPopup from "../components/OrderConfirmationPopup";
import { useBuyNow } from "../contexts/BuyNowContext";

const Checkout = () => {
  const [user, setUser] = useState(null);
  const [userId, setUserId] = useState(null);
  const [subtotalAmount, setSubtotalAmount] = useState(0);
  const [shippingCharge, setShippingCharge] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const { buyNowProduct } = useBuyNow();
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

useEffect(() => {
  const loadCartItems = async () => {
    // 1. Check sessionStorage (Buy Now)
    const sessionProduct = sessionStorage.getItem("buyNowProduct");
    if (sessionProduct) {
      setCartItems([JSON.parse(sessionProduct)]);
      sessionStorage.removeItem("buyNowProduct");
      return;
    }

    // 2. Check Context (Buy Now fallback)
    if (buyNowProduct) {
      setCartItems([buyNowProduct]);
      return;
    }

    // 3. Fallback: Load from Firestore or Local Storage
    if (user?.uid) {
      const cartRef = doc(db, "carts", user.uid);
      const docSnap = await getDoc(cartRef);
      if (docSnap.exists()) {
        setCartItems(docSnap.data().items || []);
      }
    } else {
      const localCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCartItems(localCart);
    }
  };

  loadCartItems();
}, [user, buyNowProduct]);

  const fetchCartItems = async () => {
    if (user?.uid) {
      const cartRef = doc(db, "carts", user.uid);
      const docSnap = await getDoc(cartRef);
      if (docSnap.exists()) {
        setCartItems(docSnap.data().items || []);
      }
    } else {
      const localCart = JSON.parse(localStorage.getItem("cart")) || [];
      setCartItems(localCart);
    }
  };

  // 🟡 Auth listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setUserId(user.uid);
        await fetchAddresses(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  // 🟡 Price calculation
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
        const response = await fetch(`https://api.postalpincode.in/pincode/${formData.pincode}`);
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
      name: "", phone: "", email: "", pincode: "", city: "", state: "",
      town: "", fulladdress: "", instruction: ""
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

  const handlePlaceOrder = async () => {
    if (!defaultAddress) return alert("Please select a delivery address.");
    if (!cartItems || cartItems.length === 0) return alert("Your cart is empty.");

    const orderData = {
      orderId: generateOrderId(),
      date: new Date().toLocaleDateString(),
      addresses: defaultAddress,
      paymentMethod: selectedPayment,
      items: cartItems,
      subtotal: subtotalAmount,
      shipping: shippingCharge,
      total: totalAmount,
      email: user?.email,
    };

    if (selectedPayment === "online") {
      navigate('/payment', { state: { orderData } });
    } else {
      setShowPopup(true);
    }
  };

  const handleConfirmOrder = async () => {
  if (!defaultAddress) return alert("Please select a delivery address.");
  if (!cartItems || cartItems.length === 0) return alert("Your cart is empty.");

  // Generate orderId in similar format (random digits)
  const orderId = `${Math.floor(100 + Math.random() * 900)}-${Date.now()}-${Math.floor(100000 + Math.random() * 900000)}`;

  const orderDate = new Date();

  const order = {
    orderId,
    date: orderDate.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }),
    customerName: defaultAddress.name,
    address: defaultAddress,
    paymentMethod: selectedBillingMethod,
    items: cartItems,
    subtotal: subtotalAmount,
    shipping: shippingCharge,
    total: totalAmount,
    status: "Order Placed",
    createdAt: orderDate,
  };

  // Save order to Firestore
  await addDoc(collection(db, "orders"), order);

  setShowPopup(false);

  // Redirect to Order Confirmation page passing order info
  navigate("/orderconfirmation", { state: { order } });
};


  return (
    <>
      <Header />
          <div className="page-title">
          <h1>Cart Summary</h1>
          <p>Thoughtfully curated essentials to comfort, soothe, and support you through pregnancy and beyond.</p>
        </div>
      <div className="checkout-container">
        {/* Address Section */}
        <div className="address-section">
          {addresses.length > 0 && (
            <>
              <h3>Saved Addresses</h3>
              <div className="address-list">
                {addresses.map((addr) => (
                  <div key={addr.id} className={`address-card ${addr.isDefault ? "default" : ""}`}>
                    <p><strong>{addr.name}</strong> ({addr.phone})</p>
                    <p>{addr.town}, {addr.city}, {addr.state} - {addr.pincode}, {addr.fulladdress}</p>
                    <p>{addr.instruction}</p>
                    <div className="address-actions">
                      <button onClick={() => setAsDefault(addr.id)}>Set As Default</button>
                      <button onClick={() => deleteAddress(addr.id)}>Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {showForm && (
            <div className="address-form">
              <h3>Add New Address</h3>
              <input placeholder="Name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              <input placeholder="Phone Number" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              <input placeholder="Email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
              <input placeholder="Pincode" value={formData.pincode} onBlur={handlePincodeLookup} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} />
              <input placeholder="City" value={formData.city} disabled />
              <input placeholder="State" value={formData.state} disabled />
              <input placeholder="Town / Area" value={formData.town} onChange={(e) => setFormData({ ...formData, town: e.target.value })} />
              <input placeholder="Address" value={formData.fulladdress} onChange={(e) => setFormData({ ...formData, fulladdress: e.target.value })} />
              <textarea placeholder="Delivery Instructions" value={formData.instruction} onChange={(e) => setFormData({ ...formData, instruction: e.target.value })} />
              <button onClick={saveAddress}>Save Address</button>
            </div>
          )}

          {!showForm && (
            <button onClick={() => setShowForm(true)} className="add-address-btn">
              + Add Another Address
            </button>
          )}
        </div>

        {/* Cart Summary */}
        <div className="cart-summary-box">
          <CartSummary cartItems={cartItems} />
        </div>

        {/* Payment Section */}
        <div className="payment-section">
          <h3>Payment Options</h3>
          <button onClick={() => {
            setSelectedPayment("cod");
            setSelectedBillingMethod({ type: "COD", detail: "Cash on Delivery" });
          }}>
            Cash on Delivery (COD)
          </button>
          <button onClick={() => {
            setSelectedPayment("online");
            setSelectedBillingMethod({ type: "Online", detail: "Online Payment" });
          }}>
            Pay Online
          </button>

          {selectedPayment === "cod" && defaultAddress && (
            <div className="cod-box">
              <p>This is your delivery address:</p>
              <p>{defaultAddress.name}</p>
              <p>{defaultAddress.town}, {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode},</p>
              <p>{defaultAddress.fulladdress}</p>
              <p>{defaultAddress.phone}</p>
              <button onClick={() => setShowPopup(true)} className="place-order-button">
                Place Order
              </button>
            </div>
          )}
        </div>

        <div>
          {selectedPayment === "online" && defaultAddress && (
            <BillingDetails defaultAddress={defaultAddress} onPlaceOrder={handlePlaceOrder} />
          )}
        </div>
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
      <Footer />
    </>
  );
};

export default Checkout;
