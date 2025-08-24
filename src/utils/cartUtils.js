// cartUtils.js
import { doc, collection, setDoc, getDoc, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import { getAuth } from "firebase/auth";

/**
 * Add product to cart (localStorage for guests, Firestore for logged-in users)
 */
export const addToCart = async (userId, product, quantity = 1) => {
  if (!product || !product.id) {
    console.error("Invalid product passed to addToCart:", product);
    return;
  }

  const productWithQty = {
    ...product,
    quantity,
  };

  if (userId) {
    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);
    let cart = [];

    if (cartSnap.exists()) {
      cart = cartSnap.data().items || [];
    }

    const existing = cart.find((item) => item.id === product.id);
    if (existing) {
      existing.quantity += productWithQty.quantity;
    } else {
      cart.push(productWithQty);
    }

    await setDoc(cartRef, { items: cart }, { merge: true });
  } else {
    const localCart = JSON.parse(localStorage.getItem("cart")) || [];
    const existing = localCart.find((item) => item.id === product.id);

    if (existing) {
      existing.quantity += productWithQty.quantity;
    } else {
      localCart.push(productWithQty);
    }

    localStorage.setItem("cart", JSON.stringify(localCart));
  }
};


/**
 * When a guest logs in, sync their localStorage cart to Firestore
 */
export const syncGuestCartToUserCart = async (userId) => {
  const guestCart = JSON.parse(localStorage.getItem("cart")) || [];

  if (guestCart.length === 0) return; // Nothing to sync

  const userCartRef = doc(db, "carts", userId);
  const userCartSnap = await getDoc(userCartRef);

  let existingCart = [];
  if (userCartSnap.exists()) {
    existingCart = userCartSnap.data().items || [];
  }

  const mergedCart = [...existingCart];

  guestCart.forEach((guestItem) => {
    const exists = mergedCart.find((item) => item.id === guestItem.id);
    if (exists) {
      exists.quantity += guestItem.quantity || 1;
    } else {
      mergedCart.push({
        ...guestItem,
        quantity: guestItem.quantity || 1,
      });
    }
  });

  await setDoc(userCartRef, { items: mergedCart }, { merge: true });

  // Clear guest cart
  localStorage.removeItem("cart");
};

export const fetchCartItems = async (userId) => {
  try {
    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);

    if (cartSnap.exists()) {
      return cartSnap.data().items || [];
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error fetching cart items:", error);
    return [];
  }
};

export const fetchCartFromFirestoreOrLocalStorage = async (userId) => {
  if (userId) {
    // Logged-in: fetch from Firestore
    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);
    return cartSnap.exists() ? cartSnap.data().items || [] : [];
  } else {
    // Guest: fetch from localStorage
    const localCart = JSON.parse(localStorage.getItem("cart")) || [];
    return localCart;
  }
};

export const removeFromCart = async (userId, productId) => {
  if (userId) {
    const cartRef = doc(db, "carts", userId);
    const cartSnap = await getDoc(cartRef);
    if (cartSnap.exists()) {
      const items = cartSnap.data().items || [];
      const updatedItems = items.filter((item) => item.id !== productId);
      await setDoc(cartRef, { items: updatedItems });
    }
  } else {
    const localCart = JSON.parse(localStorage.getItem("cart")) || [];
    const updated = localCart.filter((item) => item.id !== productId);
    localStorage.setItem("cart", JSON.stringify(updated));
  }
};
