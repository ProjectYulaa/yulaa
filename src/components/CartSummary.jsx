// CartSummary.jsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "../styles/Cart.css";
import { FaTrash, FaStar } from "react-icons/fa";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useBuyNow } from "../contexts/BuyNowContext";
import { fetchCartFromFirestoreOrLocalStorage, removeFromCart } from '../utils/cartUtils';

const CartSummary = ({ externalCartItems = null }) => {
  const [user] = useAuthState(auth);
  const [cartItems, setCartItems] = useState([]);
  const { buyNowProduct, clearBuyNow } = useBuyNow();

  useEffect(() => {
    const loadCart = async () => {
      const buyNowFromStorage = buyNowProduct || JSON.parse(localStorage.getItem("buyNowProduct"));

      if (buyNowFromStorage) {
        // ✅ Use only Buy Now product
        setCartItems([{ ...buyNowFromStorage, quantity: 1 }]);
        return;
      }

      // ⛔ No Buy Now product, load regular cart
      if (externalCartItems) {
        setCartItems(externalCartItems);
      } else if (user) {
        const cartRef = doc(db, "carts", user.uid);
        const cartSnap = await getDoc(cartRef);
        if (cartSnap.exists()) {
          setCartItems(cartSnap.data().items || []);
        }
      } else {
        const localCart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartItems(localCart);
      }
    };

    loadCart();
  }, [user, externalCartItems, buyNowProduct]);

  const updateCartStorage = async (updatedCart) => {
    setCartItems(updatedCart);
    if (!externalCartItems && !buyNowProduct) {
      if (user?.uid) {
        await setDoc(doc(db, "carts", user.uid), { items: updatedCart });
      } else {
        localStorage.setItem("cart", JSON.stringify(updatedCart));
      }
    }
  };

  const handleQuantityChange = (id, qty) => {
    if (buyNowProduct || externalCartItems) return;
    const updated = cartItems.map((item) =>
      item.id === id ? { ...item, quantity: Number(qty) } : item
    );
    updateCartStorage(updated);
  };

  const handleRemove = async (productId) => {
    if (buyNowProduct || externalCartItems) return;
    await removeFromCart(user?.uid, productId);
    const updated = user?.uid
      ? await fetchCartFromFirestoreOrLocalStorage(user.uid)
      : JSON.parse(localStorage.getItem("cart")) || [];
    setCartItems(updated);
  };

  const total = cartItems.reduce(
    (acc, item) => acc + item.price * item.quantity,
    0
  );

  if (cartItems.length === 0) {
    return (
      <div className="cart-empty">
        <h2>Your Cart is Empty</h2>
        <p>Looks like you haven't added anything to your cart yet.</p>
        <Link to="/products" className="explore-button">
          Explore Products
        </Link>
      </div>
    );
  }

  return (
    <div className="cart-container">
      <div className="cart-grid">
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
                {!buyNowProduct && !externalCartItems && (
                  <>
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
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="cart-summary">
          <h2>Price Details</h2>
          <p>Total Items: {cartItems.length}</p>
          <p>Subtotal: ₹{total}</p>

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

          {total < 499 && <p>Delivery Charges: ₹59</p>}
          <p className="final-amount">
            Final Amount: ₹
            {total >= 999
              ? (total * 0.9).toFixed(2)
              : total < 499
              ? (total + 59).toFixed(2)
              : total}
          </p>
        </div>
      </div>
    </div>
  );
};

export default CartSummary;
