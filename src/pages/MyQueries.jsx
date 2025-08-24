import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";
import { useAuthContext } from "../contexts/AuthContext";
import "../styles/MyQueries.css";
import Header from "../components/Header";
import Footer from "../components/Footer";

const MyQueries = () => {
  const { user } = useAuthContext();
  const [queries, setQueries] = useState([]);

  useEffect(() => {
    if (!user?.email && !user?.uid) return;

    const fetchQueries = async () => {
      try {
        // 1️⃣ Existing "contacts" collection queries (ContactSections.jsx)
        const contactsQ = query(
          collection(db, "contacts"),
          where("email", "==", user.email),
          orderBy("createdAt", "desc")
        );
        const contactsSnap = await getDocs(contactsQ);
        const contactsData = contactsSnap.docs.map((doc) => ({
          id: doc.id,
          type: "contact",
          ...doc.data(),
        }));

        // 2️⃣ New "userQueries" collection queries (Orders.jsx popup)
        const userQueriesQ = query(
          collection(db, "userQueries"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );
        const userQueriesSnap = await getDocs(userQueriesQ);
        const userQueriesData = userQueriesSnap.docs.map((doc) => ({
          id: doc.id,
          type: "order-query",
          ...doc.data(),
        }));

        // 3️⃣ Merge both & sort by createdAt
        const allData = [...contactsData, ...userQueriesData].sort(
          (a, b) => b.createdAt?.toDate() - a.createdAt?.toDate()
        );

        setQueries(allData);
      } catch (error) {
        console.error("Error fetching queries:", error);
      }
    };

    fetchQueries();
  }, [user]);

  return (
    <>
      <Header />
      <div className="page-title">
         <h1>My Submitted Queries</h1>
        <p>
          Every touchpoint — from products to packaging — is filled with thought
          and care.
        </p>
          <button style={{
            marginTop: '0.5rem',
            padding: '0.35rem 0.7rem',
            backgroundColor: '#0073e6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
          }}
          onClick={() => navigate("/youraccount")}>
            ← Back to Your Yulaa Account
          </button>
      </div>

      <section className="my-queries-section">
       
        {queries.length === 0 ? (
          <p>No queries found.</p>
        ) : (
          <div className="query-list">
            {queries.map((q) => (
              <div key={q.id} className="query-card">
{q.type === "order-query" ? (
  <>
    <p><strong>Order ID:</strong> {q.orderId}</p>
    <p><strong>Product:</strong> {q.productName}</p>
    <p><strong>Query Type:</strong> {q.queryType}</p>
    <p><strong>Reason:</strong> {q.reason}</p>
    <p><strong>Summary:</strong> {q.summary}</p>
    <p><strong>Status:</strong> {q.status || "Pending"}</p>
    {q.adminComment && (
      <p><strong>Yulaa Comments: </strong> {q.adminComment}</p>
    )}
  </>
) : (
  <>
    <p><strong>Query Type:</strong> {q.queryType}</p>
    {q.name && <p><strong>Name:</strong> {q.name}</p>}
    {q.email && <p><strong>Email:</strong> {q.email}</p>}
    {q.product && <p><strong>Product:</strong> {q.product}</p>}
    {q.rating && <p><strong>Rating:</strong> {q.rating} ★</p>}
    <p><strong>Message:</strong> {q.msg}</p>
    <p><strong>Status:</strong> {q.status || "Pending"}</p>
    {q.adminComment && (
      <p><strong>Yulaa Comments:</strong> {q.adminComment}</p>
    )}
  </>
)}

                <p><small>Submitted on: {q.createdAt?.toDate().toLocaleString()}</small></p>
              </div>
            ))}
          </div>
        )}
      </section>
      <Footer />
    </>
  );
};

export default MyQueries;
