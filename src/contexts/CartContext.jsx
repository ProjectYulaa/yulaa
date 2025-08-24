// src/contexts/CartContext.jsx
import { createContext, useEffect, useState } from "react";
import { db } from "../firebase";
import { onSnapshot, doc } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { setDoc } from "firebase/firestore";

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [buyNowProduct, setBuyNowProduct] = useState(null);

const updateCart = async (items, userId = null) => {
    setCartItems(items);
    const totalCount = items.reduce((acc, item) => acc + (item.quantity || 1), 0);
    setCartCount(totalCount);

    if (userId) {
      // Logged in → update Firestore
      await setDoc(doc(db, "carts", userId), { items });
    } else {
      // Guest → update localStorage
      localStorage.setItem("cart", JSON.stringify(items));
    }
  };

  useEffect(() => {
    const auth = getAuth();

    let unsubscribeFirestore = null;
    let interval = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user?.uid) {
        const cartDocRef = doc(db, "carts", user.uid);

        // ✅ Enable real-time sync for logged-in user
        unsubscribeFirestore = onSnapshot(cartDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const items = data.items || [];
            setCartItems(items);

            const totalCount = items.reduce(
              (acc, item) => acc + (item.quantity || 1),
              0
            );
            setCartCount(totalCount);
          } else {
            setCartItems([]);
            setCartCount(0);
          }
        }, (error) => {
          console.error("Live cart sync error:", error);
        });
      } else {
        // ✅ Guest user fallback to localStorage polling
        const syncGuestCart = () => {
          const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
          setCartItems(storedCart);
          const totalCount = storedCart.reduce(
            (acc, item) => acc + (item.quantity || 1),
            0
          );
          setCartCount(totalCount);
        };

        syncGuestCart();

        window.addEventListener("storage", (e) => {
          if (e.key === "cart") syncGuestCart();
        });

        interval = setInterval(syncGuestCart, 500);
      }
    });

    return () => {
      if (unsubscribeFirestore) unsubscribeFirestore();
      if (interval) clearInterval(interval);
      unsubscribeAuth();
    };
  }, []);

  return (
    <CartContext.Provider
      value={{ cartItems, setCartItems, cartCount, setCartCount, updateCart, buyNowProduct, setBuyNowProduct }}
    >
      {children}
    </CartContext.Provider>
  );
};
