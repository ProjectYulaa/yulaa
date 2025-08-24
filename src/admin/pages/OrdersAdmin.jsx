// src/pages/admin/OrdersAdmin.jsx
import React, { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  updateDoc,
  doc,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "../../firebase";
import { toast } from "react-hot-toast";
import * as XLSX from "xlsx";
import { useNavigate } from "react-router-dom";
import "../../styles/Admin.css";

const OrdersAdmin = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // local pending updates before submit
  const [pendingUpdates, setPendingUpdates] = useState({});

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        const ordersData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleFieldChange = (orderId, productIndex, field, value) => {
    setPendingUpdates((prev) => ({
      ...prev,
      [orderId]: {
        ...(prev[orderId] || {}),
        [productIndex]: {
          ...(prev[orderId]?.[productIndex] || {}),
          [field]: value,
        },
      },
    }));
  };
  
 const submitUpdates = async (orderId, productIndex) => {
  try {
    const orderRef = doc(db, "orders", orderId);
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;

    const productUpdates = pendingUpdates[orderId]?.[productIndex];
    if (!productUpdates) {
      toast.error("No changes to save");
      return;
    }

    const updatedItems = [...order.items];
    const oldItem = updatedItems[productIndex];

    // prepare history log
    let statusHistory = oldItem.statusHistory || [];
    const now = new Date().toLocaleString();

    Object.keys(productUpdates).forEach((field) => {
      if (oldItem[field] !== productUpdates[field]) {
        statusHistory.push({
          field,
          from: oldItem[field] || "None",
          to: productUpdates[field],
          changedAt: now,
        });
      }
    });

    // ✅ keep only last 5 entries
    if (statusHistory.length > 5) {
      statusHistory = statusHistory.slice(-5);
    }

    updatedItems[productIndex] = {
      ...oldItem,
      ...productUpdates,
      statusHistory,
    };

    await updateDoc(orderRef, { items: updatedItems });

    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, items: updatedItems } : o
      )
    );

    setPendingUpdates((prev) => {
      const updated = { ...prev };
      delete updated[orderId]?.[productIndex];
      return updated;
    });

    toast.success("Changes submitted successfully");
  } catch (error) {
    console.error("Error submitting changes:", error);
    toast.error("Failed to update product status");
  }
};

  const handleExemption = (orderId, productIndex) => {
    toast(
      (t) => (
        <div>
          <p>
            This product is outside Exchange / Return / Refund policy of Yulaa.
            Do you want to proceed?
          </p>
          <div style={{ marginTop: "0.5rem" }}>
            <button
              onClick={() => {
                handleFieldChange(orderId, productIndex, "exemptionGranted", true);
                toast.dismiss(t.id);
                toast.success("Exemption granted, please select After-Sales Action");
              }}
              style={{
                marginRight: "0.5rem",
                padding: "4px 8px",
                background: "#4caf50",
                color: "#fff",
                borderRadius: "4px",
              }}
            >
              Yes
            </button>
            <button
              onClick={() => toast.dismiss(t.id)}
              style={{
                padding: "4px 8px",
                background: "#f44336",
                color: "#fff",
                borderRadius: "4px",
              }}
            >
              No
            </button>
          </div>
        </div>
      ),
      { duration: 5000 }
    );
  };

  const exportToExcel = () => {
    const exportData = orders.map((order) => ({
      OrderID: order.orderId,
      Status: order.status,
      Date: new Date(order.createdAt.seconds * 1000).toLocaleString(),
      Customer: order.address?.customerName,
      Email: order.address?.email,
      Phone: order.address?.phone,
      Address: order.address?.fulladdress,
      Payment: order.payment?.detail,
      Items: order.items
        ?.map((item) => `${item.name} (${item.quantity} x ₹${item.price})`)
        .join("; "),
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "orders_export.xlsx");
  };

  if (loading) return <p>Loading orders...</p>;
  if (!orders.length) return <p>No orders found.</p>;

  const refundOptions = ["Refunded", "Exchange Issued", "Returned"];
  const trackingOptions = [
    "Order Confirmed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];

  return (
    <div className="orders-admin">
      <h2>All Orders</h2>

      <div className="admin-actions">
        <button onClick={exportToExcel}>Export to Excel</button>
        <button onClick={() => navigate("/admin")}>← Back to Dashboard</button>
      </div>

      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.id} className="order-card">
            <h3>Order ID: {order.orderId}</h3>
             <p><strong>Name:</strong> {order.customerName}</p>
            <p>
              <strong>Created At:</strong>{" "}
              {new Date(order.createdAt.seconds * 1000).toLocaleString()}
            </p>
            <p><strong>Status:</strong> {order.status}</p>
            
           

            <div>
              <h4>Cart Items:</h4>
              <ul>
                {order.items?.map((item, idx) => {
                  const purchaseDate = new Date(order.createdAt.seconds * 1000);
                  const returnWindowClose = new Date(purchaseDate);
                  returnWindowClose.setDate(returnWindowClose.getDate() + 5);
                  const now = new Date();
                  const withinPolicy = now <= returnWindowClose;

                  const pending =
                    pendingUpdates[order.id]?.[idx] || {};

                  return (
                    <li key={idx} style={{ marginBottom: "1rem" }}>
                      <div>
                        <strong>{item.name}</strong> ({item.quantity} × ₹
                        {item.price}) = ₹{item.quantity * item.price}
                      </div>

                      {/* Tracking */}
                      <label>
                        Tracking Status:
                        <select
                          value={
                            pending.trackingStatus ??
                            item.trackingStatus ??
                            ""
                          }
                          onChange={(e) =>
                            handleFieldChange(
                              order.id,
                              idx,
                              "trackingStatus",
                              e.target.value
                            )
                          }
                        >
                          <option value="">-- Select --</option>
                          {trackingOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        onClick={() => submitUpdates(order.id, idx)}
                        style={{ marginLeft: "0.5rem" }}
                      >
                        Submit
                      </button>

                      {/* After-sales / Refund */}
                     {/* After-sales / Refund */}
<div style={{ marginTop: "0.5rem" }}>
  {withinPolicy || item.exemptionGranted || pending.exemptionGranted ? (
    <>
      <label>
        After-Sales Action:
        <select
          value={
            pending.afterSalesAction ??
            item.afterSalesAction ??
            ""
          }
          onChange={(e) =>
            handleFieldChange(
              order.id,
              idx,
              "afterSalesAction",
              e.target.value
            )
          }
        >
          <option value="">-- Select --</option>
          {refundOptions.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      </label>

      <textarea
        placeholder="Optional comment..."
        value={
          pending.adminComment ??
          item.adminComment ??
          ""
        }
        onChange={(e) =>
          handleFieldChange(
            order.id,
            idx,
            "adminComment",
            e.target.value
          )
        }
        style={{ display: "block", marginTop: "0.5rem" }}
      />

      <button
        onClick={() => submitUpdates(order.id, idx)}
        style={{ marginTop: "0.5rem" }}
      >
        Submit
      </button>
    </>
  ) : (
    <button onClick={() => handleExemption(order.id, idx)}>
      Make an exemption
    </button>
  )}
</div>

{/* Status History */}
{item.statusHistory?.length > 0 && (
  <div style={{ marginTop: "0.5rem", fontSize: "0.9rem", color: "#555" }}>
    <strong>Status History (last 5):</strong>
    <ul>
      {[...item.statusHistory].reverse().map((h, i) => (
        <li key={i}>
          [{h.changedAt}] <em>{h.field}</em> changed from 
          <strong> {h.from} </strong> → 
          <strong> {h.to}</strong>
        </li>
      ))}
    </ul>
  </div>
)}


                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersAdmin;
