// src/contexts/CartContext.jsx
import { createContext, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthContext } from "./AuthContext";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { user } = useAuthContext(); // already gated (admins -> null)
  const [cartItems, setCartItems] = useState(() => {
    // Initialize from localStorage for guests
    try {
      return JSON.parse(localStorage.getItem("cart")) || [];
    } catch {
      return [];
    }
  });
  const [cartCount, setCartCount] = useState(0);
  const [buyNowProduct, setBuyNowProduct] = useState(null);

  // Keep cartCount in sync with items
  useEffect(() => {
    const total = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);
    setCartCount(total);
  }, [cartItems]);

  // Live sync: Firestore for logged-in customers, localStorage for guests
  useEffect(() => {
    let unsubscribeFirestore = null;
    let onStorage = null;

    if (user?.uid) {
      // When a user signs in, stop using localStorage
      onStorage && window.removeEventListener("storage", onStorage);

      const cartDocRef = doc(db, "carts", user.uid);
      unsubscribeFirestore = onSnapshot(
        cartDocRef,
        (snap) => {
          if (snap.exists()) {
            const data = snap.data();
            const items = Array.isArray(data?.items) ? data.items : [];
            setCartItems(items);
          } else {
            setCartItems([]);
          }
        },
        (error) => {
          console.error("Live cart sync error:", error);
        }
      );
    } else {
      // Guest mode → read from localStorage and keep it in sync across tabs
      const syncGuestCart = () => {
        try {
          const stored = JSON.parse(localStorage.getItem("cart")) || [];
          setCartItems(stored);
        } catch {
          setCartItems([]);
        }
      };

      syncGuestCart();
      onStorage = (e) => {
        if (e.key === "cart") syncGuestCart();
      };
      window.addEventListener("storage", onStorage);
    }

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      if (onStorage) window.removeEventListener("storage", onStorage);
    };
  }, [user]);

  // Public updater: writes to Firestore if logged in, else localStorage
  const updateCart = async (items) => {
    setCartItems(items);

    if (user?.uid) {
      try {
        await setDoc(doc(db, "carts", user.uid), { items }, { merge: true });
      } catch (err) {
        console.error("Failed to update cart in Firestore:", err);
      }
    } else {
      try {
        localStorage.setItem("cart", JSON.stringify(items));
      } catch (err) {
        console.error("Failed to persist guest cart:", err);
      }
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartItems,
        setCartItems,      // optional, but kept for compatibility
        cartCount,
        updateCart,
        buyNowProduct,
        setBuyNowProduct,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
