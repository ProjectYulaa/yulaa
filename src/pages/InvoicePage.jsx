import React from "react";
import { generateInvoice } from "../utils/invoiceGenerator";
import { useLocation } from "react-router-dom";

const InvoicePage = ({ order }) => {
  const location = useLocation();
  const { order } = location.state || {};

  if (!order) return <p>No order found</p>;

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Invoice Preview</h2>
      <p><strong>Order ID:</strong> {order.orderId}</p>
      <p><strong>Customer:</strong> {order.customerName}</p>
      <button 
        onClick={() => generateInvoice(order)}
        style={{ padding: "0.5rem 1rem", background: "#0073e6", color: "#fff", border: "none", borderRadius: "5px" }}
      >
        Download Invoice ⬇
      </button>
    </div>
  );
};

export default InvoicePage;
