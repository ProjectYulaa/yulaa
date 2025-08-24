import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import { db } from "../../firebase";
import { toast, Toaster } from "react-hot-toast";
import AdminLogin from "../AdminLogin";
import { useNavigate } from "react-router-dom";
import { utils, writeFile } from "xlsx";
import "../../styles/Admin.css";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase";

const UsersAdmin = () => {
  const [verified, setVerified] = useState(false);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (verified) {
      fetchUsers();
    }
  }, [verified]);

  const fetchUsers = async () => {
    try {
      const snapshot = await getDocs(collection(db, "users"));
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch users.");
    }
  };
const handleDeleteUser = async (uid) => {
  try {
    const deleteUser = httpsCallable(functions, "deleteUserAccount");
    const result = await deleteUser({ uid });
    if (result.data.success) {
      toast.success("User deleted from Auth & Firestore");
    }
  } catch (error) {
    toast.error("Failed to delete user: " + error.message);
  }
};
  const deleteSubcollection = async (userId, subcollectionName) => {
    const subcollectionRef = collection(db, "users", userId, subcollectionName);
    const snapshot = await getDocs(subcollectionRef);
    const deletePromises = snapshot.docs.map((docSnap) =>
      deleteDoc(doc(db, "users", userId, subcollectionName, docSnap.id))
    );
    await Promise.all(deletePromises);
  };

const confirmDeleteUser = async () => {
  if (!selectedUser) return;
  const { id, email } = selectedUser;

  try {
    await deleteSubcollection(id, "addresses");
    await deleteSubcollection(id, "billingMethods");
    await deleteDoc(doc(db, "users", id));
    await handleDeleteUser(id); // 🔥 Delete from Firebase Auth
    toast.success(`User ${email} deleted from Firestore & Auth.`);
    setSelectedUser(null);
    fetchUsers();
  } catch (err) {
    console.error(err);
    toast.error("Failed to delete user and related data.");
  }
};


  const exportToExcel = () => {
    const ws = utils.json_to_sheet(users.map(user => ({
      Name: user.name || "N/A",
      Email: user.email,
      Phone: user.phonenumber || ""
    })));
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Users");
    writeFile(wb, "Yulaa_Users.xlsx");
  };

  if (!verified) {
    return <AdminLogin section="users" onSuccess={() => setVerified(true)} />;
  }

  return (
    <div className="admin-section">
      <div className="admin-header">
        <h2>Manage Registered Users</h2>
        <div className="admin-actions">
          <button onClick={() => navigate("/admin")}>
            ← Back to Dashboard
          </button>
          <button onClick={exportToExcel}>
            Export to Excel
          </button>
        </div>
      </div>

      {users.length === 0 ? (
        <p>No users found.</p>
      ) : (
        users.map((user) => (
          <div key={user.id} className="user-card">
            <p><strong>Name:</strong> {user.name || "N/A"}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <p><strong>Phone:</strong> {user.phonenumber}</p>
            <button onClick={() => setSelectedUser(user)}>
              Delete User and Data
            </button>
          </div>
        ))
      )}

      {selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Deletion</h3>
            <p>
              Are you sure to delete the account and data for <strong>{selectedUser.email}</strong>?
            </p>
            <div className="modal-actions">
              <button className="confirm-btn" onClick={confirmDeleteUser}>
                Yes, Confirmed, Delete Account & Data
              </button>
              <button className="cancel-btn" onClick={() => setSelectedUser(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersAdmin;
