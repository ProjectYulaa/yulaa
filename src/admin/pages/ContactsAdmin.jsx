// src/pages/admin/ContactsAdmin.jsx
import React, { useEffect, useState } from "react";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc 
} from "firebase/firestore";
import { db } from "../../firebase";
import { toast, Toaster } from "react-hot-toast";
import AdminLogin from "../AdminLogin";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom"; 
import "../../styles/Admin.css"; 

const ContactsAdmin = () => {
  const [verified, setVerified] = useState(false);
  const [queries, setQueries] = useState([]);
  const [activeQuery, setActiveQuery] = useState(null);
  const [response, setResponse] = useState({ status: "Inprogress", comment: "" });

  const navigate = useNavigate();

  useEffect(() => {
    if (!verified) return;

    // 📌 Real-time listener for both "contacts" and "userQueries"
    const contactsQ = query(collection(db, "contacts"), orderBy("createdAt", "desc"));
    const userQueriesQ = query(collection(db, "userQueries"), orderBy("createdAt", "desc"));

    const unsubContacts = onSnapshot(contactsQ, (snapshot) => {
      const contactsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        type: "contact",
        ...doc.data(),
      }));
      mergeAndSet(contactsData, null);
    });

    const unsubUserQueries = onSnapshot(userQueriesQ, (snapshot) => {
      const userQueriesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        type: "order-query",
        ...doc.data(),
      }));
      mergeAndSet(null, userQueriesData);
    });

    let contactsCache = [];
    let userQueriesCache = [];

    const mergeAndSet = (contactsData, userQueriesData) => {
      if (contactsData) contactsCache = contactsData;
      if (userQueriesData) userQueriesCache = userQueriesData;

      const all = [...contactsCache, ...userQueriesCache].sort(
        (a, b) => (b.createdAt?.toDate ? b.createdAt.toDate() : b.createdAt?.seconds * 1000) -
                  (a.createdAt?.toDate ? a.createdAt.toDate() : a.createdAt?.seconds * 1000)
      );
      setQueries(all);
    };

    return () => {
      unsubContacts();
      unsubUserQueries();
    };
  }, [verified]);

  const handleRespondClick = (query) => {
    setActiveQuery(query);
    setResponse({
      status: query.status || "Inprogress",
      comment: query.adminComment || "",
    });
  };

  const handleSubmitResponse = async (query) => {
    try {
      const ref = doc(db, query.type === "contact" ? "contacts" : "userQueries", query.id);
      await updateDoc(ref, {
        status: response.status,
        adminComment: response.comment,
        updatedAt: new Date(),
      });
      toast.success("Response submitted!");
      setActiveQuery(null);
    } catch (err) {
      console.error(err);
      toast.error("Failed to submit response");
    }
  };

  const exportToExcel = () => {
    const worksheet = XLSX.utils.json_to_sheet(queries);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CustomerQueries");
    XLSX.writeFile(workbook, "customer_queries.xlsx");
  };

  if (!verified) {
    return <AdminLogin section="contacts" onSuccess={() => setVerified(true)} />;
  }

  return (
    <div className="admin-section">
      <h2>Customer Queries (Contacts + Order Queries)</h2>
      <div className="admin-actions">
        <button onClick={exportToExcel}>Export to Excel</button>
        <button onClick={() => navigate("/admin")}>← Back to Dashboard</button>
      </div>

      {queries.length === 0 ? (
        <p>No queries found.</p>
      ) : (
        queries.map((query) => (
          <div key={query.id} className="query-card">
            {query.type === "order-query" ? (
              <>
                <p><strong>Order ID:</strong> {query.orderId}</p>
                <p><strong>Product:</strong> {query.productName}</p>
                <p><strong>Query Type:</strong> {query.queryType}</p>
                <p><strong>Reason:</strong> {query.reason}</p>
                <p><strong>Summary:</strong> {query.summary}</p>
              </>
            ) : (
              <>
                <p><strong>Name:</strong> {query.name}</p>
                <p><strong>Email:</strong> {query.email}</p>
                <p><strong>Query Type:</strong> {query.queryType}</p>
                <p><strong>Message:</strong> {query.msg}</p>
                <p><strong>Product:</strong> {query.product}</p>
                <p><strong>Rating:</strong> {query.rating}★</p>
              </>
            )}

            <p><strong>Date:</strong> {new Date(query.createdAt?.seconds ? query.createdAt.seconds * 1000 : query.createdAt?.toDate()).toLocaleString()}</p>
            <p><strong>Status:</strong> {query.status || "Pending"}</p>
            {query.adminComment && <p><strong>Admin Comment:</strong> {query.adminComment}</p>}

            {activeQuery?.id === query.id ? (
              <div className="respond-box">
                <label>
                  Status:{" "}
                  <select
                    value={response.status}
                    onChange={(e) => setResponse({ ...response, status: e.target.value })}
                  >
                    <option value="Inprogress">Inprogress</option>
                    <option value="Resolved">Resolved</option>
                  </select>
                </label>
                <br />
                <textarea
                  rows="3"
                  placeholder="Write your response..."
                  value={response.comment}
                  onChange={(e) => setResponse({ ...response, comment: e.target.value })}
                />
                <br />
                <button onClick={() => handleSubmitResponse(query)}>Submit</button>
                <button onClick={() => setActiveQuery(null)}>Cancel</button>
              </div>
            ) : (
              <button onClick={() => handleRespondClick(query)}>Respond</button>
            )}
          </div>
        ))
      )}
      <Toaster />
    </div>
  );
};

export default ContactsAdmin;
