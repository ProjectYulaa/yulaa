import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
} from "firebase/firestore";
import { db } from "../firebase";

// Save a new address
export const saveAddress = async (userId, address) => {
  await addDoc(collection(db, "addresses"), {
    ...address,
    userId,
    default: false,
    createdAt: new Date(),
  });
};

// Get all addresses for a user
export const getAddresses = async (userId) => {
  const q = query(collection(db, "addresses"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
};

// Update an existing address
export const updateAddress = async (id, updatedAddress) => {
  const docRef = doc(db, "addresses", id);
  await updateDoc(docRef, updatedAddress);
};

// Delete an address
export const deleteAddress = async (id) => {
  const docRef = doc(db, "addresses", id);
  await deleteDoc(docRef);
};

// Set one address as default (and others as non-default)
export const setDefaultAddress = async (userId, addressId) => {
  const q = query(collection(db, "addresses"), where("userId", "==", userId));
  const snapshot = await getDocs(q);

  for (const docSnap of snapshot.docs) {
    const ref = doc(db, "addresses", docSnap.id);
    const isDefault = docSnap.id === addressId;
    await updateDoc(ref, { default: isDefault });
  }
};
