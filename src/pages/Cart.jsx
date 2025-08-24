// src/pages/Cart.jsx

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/Cart.css";
import { FaTrash, FaStar } from "react-icons/fa";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useContext } from "react";


const Cart = () => {
  const [user] = useAuthState(auth);
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();
 
  // Load cart from Firestore or localStorage
  useEffect(() => {
    const fetchCart = async () => {
      if (user) {
        // ✅ Load from Firebase
        const cartRef = doc(db, "carts", user.uid);
        const cartSnap = await getDoc(cartRef);
        if (cartSnap.exists()) {
          setCartItems(cartSnap.data().items || []);
        }
      } else {
        // ✅ Load from localStorage
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartItems(localCart);
      }
    };

    fetchCart();
  }, [user]);

  // Save cart to Firestore or localStorage
  const updateCartStorage = async (updatedCart) => {
    setCartItems(updatedCart);
    if (user?.uid) {
      await setDoc(doc(db, "carts", user.uid), { items: updatedCart });
    } else {
      localStorage.setItem("cart", JSON.stringify(updatedCart));
    }
  };

  const handleQuantityChange = (id, qty) => {
    const updated = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: Number(qty) } : item,
    );
    updateCartStorage(updated);
  };

  const handleRemove = (id) => {
    const updated = cartItems.filter((item) => item.id !== id);
    updateCartStorage(updated);
  };

  const handleProceedToCheckout = () => {
    if (user?.uid) {
      navigate("/checkout");
    } else {
      navigate("/signin?redirect=/cart");
    }
  };

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0,
  );

  // If cart is empty
  if (cartItems.length === 0) {
    return (
      <>
        <Header />
        <div className="cart-empty">
          <h2>Your Cart is Empty</h2>
          <p>Looks like you haven't added anything to your cart yet.</p>
          <Link to="/products" className="explore-button">
            Explore Products
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  // If cart has items
  return (
    <>
      <Header />
      <div className="cart-container">
        <div className="page-title">
         <h1>Shopping Cart</h1>
          <p>
            Everything begins with you. Our care is built around the real needs
            of mothers.
          </p>
        </div>
        
        <div className="cart-grid">
          {/* Left Column */}
          <div className="cart-items">
            {cartItems.map((item) => (
              <div className="cart-item" key={item.id}>
                <img src={item.image} alt={item.name} className="item-image" />
                <div className="item-details">
                  <h2>{item.name}</h2>
                  <div className="stars">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        color={i < item.rating ? "#FFD700" : "#ccc"}
                      />
                    ))}
                  </div>
                  <p className="price">₹{item.price}</p>
                  <select
                    value={item.quantity}
                    onChange={(e) =>
                      handleQuantityChange(item.id, e.target.value)
                    }
                  >
                    {[...Array(10)].map((_, i) => (
                      <option key={i + 1} value={i + 1}>
                        Qty: {i + 1}
                      </option>
                    ))}
                  </select>
                  <button
                    className="remove-btn"
                    onClick={() => handleRemove(item.id)}
                  >
                    <FaTrash /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Right Column */}
          <div className="cart-summary">
            <h2>Price Details</h2>
            <p>Total Items: {cartItems.length}</p>
            <p>Subtotal: ₹{total}</p>

            {/* Delivery and Discount Messages */}
            {total >= 999 ? (
              <>
                <p className="free-delivery success">
                  ✅ You qualify for Free Delivery!
                </p>
                <p className="extra-discount success">
                  🎉 Extra 10% Discount will be applied at checkout!
                </p>
              </>
            ) : total >= 499 ? (
              <p className="free-delivery success">
                ✅ You qualify for Free Delivery!
              </p>
            ) : (
              <p className="delivery-charge warning">
                🚚 Orders below ₹499 incur ₹59 delivery charge.
                <br />
                Add ₹{499 - total} more to get Free Delivery.
              </p>
            )}

            {/* Display Delivery Charges if needed */}
            {total < 499 && <p>Delivery Charges: ₹59</p>}

            {/* Display Final Amount after discount or delivery charge */}
            <p className="final-amount">
              Final Amount: ₹
              {total >= 999
                ? (total * 0.9).toFixed(2)
                : total < 499
                  ? (total + 59).toFixed(2)
                  : total}
            </p>

            <button className="checkout-btn" onClick={handleProceedToCheckout}>
              Proceed to Checkout
            </button>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Cart;
