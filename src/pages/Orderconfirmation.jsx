import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { db, auth } from "../firebase";  // auth added for user info
import { doc, onSnapshot, deleteDoc } from "firebase/firestore";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/Orderconfirmation.css";
import { toast, Toaster } from "react-hot-toast";
import { generateInvoice } from "../utils/invoiceGenerator";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

const trackingSteps = ["Order Placed", "Processing", "Shipped", "Out for Delivery", "Delivered"];

const Orderconfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { order } = location.state || {};
  const [orderStatus, setOrderStatus] = useState(order?.status || "Order Placed");

 useEffect(() => {
  if (!order?.orderId) {
    navigate("/");
    return;
  }

  const clearCartAndLogOrder = async () => {
    const user = auth.currentUser;

    // 1. Clear cart (your existing logic)
    if (user) {
      try {
        await deleteDoc(doc(db, "carts", user.uid));
      } catch (error) {
        console.error("Error clearing Firestore cart:", error);
      }
    } else {
      localStorage.removeItem("cart");
      toast.success(
        "Order has been placed successfully. You can track the live status of the order from order history. Your order will be delivered in 3-7 business days",
        { duration: 8000, position: "top-center" }
      );
    }

    // 2. Additional request → log each item into "countOfOrders"
    try {
      const promises = order.items.map((item) =>
        addDoc(collection(db, "countOfOrders"), {
          createdAt: serverTimestamp(),          // Timestamp
          productName: item.title || item.name,  // Product name
          quantity: item.quantity || 1,          // Quantity
          status: order.status || "Order Placed",// Current order status
          orderId: order.orderId,                // Reference to full order
          userId: user?.uid || "guest",          // Optional: track customer
        })
      );

      await Promise.all(promises);
      console.log("✅ Items logged in countOfOrders");
    } catch (err) {
      console.error("Error logging countOfOrders:", err);
    }
  };

  clearCartAndLogOrder();

  // 3. Live order status listener (existing logic)
  const unsubscribe = onSnapshot(doc(db, "orders", order.orderId), (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.status) setOrderStatus(data.status);
    }
  });

  return () => unsubscribe();
}, [order, navigate]);


  if (!order) return null;

  const currentStepIndex = trackingSteps.indexOf(orderStatus);

  return (
    <>
      <Header />
            <div className="page-title">
         <h1>Order Summary</h1>
        <h1>
<strong>Order number</strong> {order.orderId}
        </h1>
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
          onClick={() => navigate("/products")}>
            ← Back to Products
          </button>
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
            whiteSpace:'balance'
          }}
          onClick={() => navigate("/orders")}>
            ← Review Order History
          </button>


      </div>

      <div className="order-confirmation-container">
        <h2>Order Details</h2>
        <div className="order-details-card">
          <div className="order-details-header">
            <div><strong>Order placed</strong> {order.date}</div>
            <div><strong>Order number</strong> {order.orderId}</div>
            <button 
  className="invoice-link"
  onClick={() => generateInvoice(order)}
>
  Download Invoice ⬇
</button>
          </div>

          <div className="order-details-content">
            <div>
              <strong>Ship to</strong><br />
              {order.customerName}<br />
              {order.address.fulladdress},<br />
              {order.address.town}, {order.address.city},<br />
              {order.address.state} {order.address.pincode}<br />
              {order.address.country || "India"}
            </div>
            <div>
              <strong>Payment Methods</strong><br />
              {order.paymentMethod?.detail || "No current charges"}
            </div>
            <div>
              <strong>Order Summary</strong><br />
              Item(s) Subtotal: ₹{order.subtotal}<br />
              Shipping: ₹{order.shipping}<br />
              <b>Total:</b> ₹{order.total}<br />
              <b>Grand Total:</b> ₹{order.total}
            </div>
          </div>
        </div>

    <div className="order-items-list">
  {order.items.map((item, idx) => (
    <div className="order-item" key={idx}>
      <img
        src={item.image || item.imgUrl || ""}
        alt={item.title || item.name}
      />
      <div className="order-item-details">
        <a href={`/product/${item.id}`}>
          {item.title || item.name}
        </a>
        <div>
          Sold by: <span style={{ fontWeight: "normal" }}>{item.seller || "Yulaa"}</span>
        </div>

       {/* ✅ Return/Exchange/Refund Window */}
{(() => {
  let purchaseDate;

  if (order.createdAt?.seconds) {
    // Firestore timestamp
    purchaseDate = new Date(order.createdAt.seconds * 1000);
  } else if (order.date) {
    // Fallback if only order.date (string) is present
    purchaseDate = new Date(order.date);
  }

  if (!purchaseDate) return null;

  const returnWindowCloseDate = new Date(purchaseDate);
  returnWindowCloseDate.setDate(returnWindowCloseDate.getDate() + 5);
  const now = new Date();

  const options = { year: "numeric", month: "long", day: "numeric" };
  const formattedDate = returnWindowCloseDate.toLocaleDateString(undefined, options);

  if (now <= returnWindowCloseDate && !item.afterSalesAction) {
    return (
      <div style={{ color: "green", fontWeight: "500" }}>
        Return/Exchange/Refund window will be closed on {formattedDate}
      </div>
    );
  } else {
    return (
      <div style={{ color: "red", fontWeight: "500" }}>
        Return/Exchange/Refund window closed on {formattedDate}
      </div>
    );
  }
})()}


        <div className="order-item-price">₹{item.price || "0.00"}</div>
        <div className="order-item-buttons">
          <button>Buy it again</button>
          <button>View your item</button>
        </div>
      </div>
    </div>
  ))}
</div>

        <div className="order-tracking">
          <h3>Order Tracking</h3>
          <div className="order-tracking-steps">
            {trackingSteps.map((step, i) => (
              <div key={step} className="tracking-step">
                <div className={`tracking-circle ${i <= currentStepIndex ? "active" : ""}`}>
                  {i + 1}
                </div>
                <div style={{ marginTop: 6 }}>{step}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Orderconfirmation;
