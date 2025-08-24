// src/utils/billingUtils.js
import { doc, collection, addDoc, getDocs, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "../firebase";

// Save billing method (card or UPI)
export const saveBillingMethod = async (userId, method) => {
  if (!userId || !method) return;
  try {
    const userBillingRef = collection(db, "users", userId, "billingMethods");
    await addDoc(userBillingRef, {
      ...method,
      isDefault: false,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Error saving billing method:", error);
  }
};

// Get all billing methods
export const getBillingMethods = async (userId) => {
  const methods = [];
  try {
    const snapshot = await getDocs(collection(db, "users", userId, "billingMethods"));
    snapshot.forEach((doc) => {
      methods.push({ id: doc.id, ...doc.data() });
    });
  } catch (error) {
    console.error("Error fetching billing methods:", error);
  }
  return methods;
};

// Set default billing method
export const setDefaultBillingMethod = async (userId, methodId) => {
  const methodsSnapshot = await getDocs(collection(db, "users", userId, "billingMethods"));
  for (const docSnap of methodsSnapshot.docs) {
    await updateDoc(doc(db, "users", userId, "billingMethods", docSnap.id), {
      isDefault: docSnap.id === methodId,
    });
  }
};

// Delete billing method
export const deleteBillingMethod = async (userId, methodId) => {
  try {
    await deleteDoc(doc(db, "users", userId, "billingMethods", methodId));
  } catch (error) {
    console.error("Error deleting billing method:", error);
  }
};
