import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export const placeOrder = async ({ user, cartItems, formData }) => {
  if (!formData.name || !formData.email || !formData.phone || !formData.address) {
    throw new Error("Please fill in all required fields.");
  }
  if (cartItems.length === 0) {
    throw new Error("Your cart is empty.");
  }

  const orderId = `order_${Date.now()}`;
  const orderRef = doc(db, "orders", orderId);

  await setDoc(orderRef, {
    userId: user?.uid || "guest",
    items: cartItems,
    billingDetails: formData,
    paymentMethod: formData.paymentMethod,
    status: formData.paymentMethod === "COD" ? "Pending" : "Pending Payment",
    createdAt: serverTimestamp(),
  });

  // Clear cart in both Firestore & localStorage
  if (user?.uid) {
    await setDoc(doc(db, "carts", user.uid), { items: [] });
  } else {
    localStorage.removeItem("cart");
  }

  return orderId;
};
