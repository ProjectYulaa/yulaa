
// src/pages/Orders.jsx
import React, { useEffect, useState } from "react";
import { db, auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "../styles/Orders.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import {
  collection,
  addDoc,
  serverTimestamp,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { generateInvoice } from "../utils/invoiceGenerator";

const Orders = () => {
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [selectedTab, setSelectedTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const navigate = useNavigate();
  const [summary, setSummary] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [popupData, setPopupData] = useState({ orderId: "", productName: "" });
  const [queryType, setQueryType] = useState("");
  const [reason, setReason] = useState("");
  const [showReviewPopup, setShowReviewPopup] = useState(false);
const [reviewData, setReviewData] = useState({ category: "", productName: "" });
const [rating, setRating] = useState(0);
const [comment, setComment] = useState("");
const [submittingReview, setSubmittingReview] = useState(false);
const [reviews, setReviews] = useState({});

useEffect(() => {
  const q = query(collection(db, "productReviews"), orderBy("createdAt", "desc"));
  const unsubscribe = onSnapshot(q, (snapshot) => {
    const data = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Group by category & compute average rating
    const grouped = {};
    data.forEach((review) => {
      if (!grouped[review.category]) {
        grouped[review.category] = { ratings: [], comments: [] };
      }
      grouped[review.category].ratings.push(review.rating);
      grouped[review.category].comments.push(review.comment);
    });

    // Compute average rating
    const result = {};
    Object.keys(grouped).forEach((cat) => {
      const ratings = grouped[cat].ratings;
      result[cat] = {
        avgRating: ratings.reduce((a, b) => a + b, 0) / ratings.length,
        latestComment: grouped[cat].comments[0], // most recent
      };
    });

    setReviews(result);
  });

  return () => unsubscribe();
}, []);


const handleSubmitReview = async () => {
  if (!rating || !comment.trim()) {
    alert("Please provide both rating and comment.");
    return;
  }

  try {
    setSubmittingReview(true);
    await addDoc(collection(db, "productReviews"), {
      userId: user.uid,
      category: reviewData.category,
      productName: reviewData.productName,
      rating,
      comment,
      createdAt: serverTimestamp(),
    });

    alert("Thank you! Your review has been submitted.");
    setShowReviewPopup(false);
    setRating(0);
    setComment("");
  } catch (err) {
    console.error("Error saving review:", err);
    alert("Failed to submit review. Try again later.");
  } finally {
    setSubmittingReview(false);
  }
};

  // Reason options for each query type
  const reasonsMap = {
    Exchange: [
      "Didn't like the color, need another color.",
      "Size does not fit, need product of another size.",
      "Product is damaged/wet/bad/broken, need exchange.",
    ],
    Return: ["Find better price somewhere else", "Did not like the product."],
    Refund: [
      "Item not delivered",
      "Product defective/damaged",
      "Order cancelled",
      "Other",
    ],
  };

  // Auth subscription
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (!currentUser) {
        navigate("/signin");
      } else {
        setUser(currentUser);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // ✅ Live fetch orders with real-time sync
  useEffect(() => {
    if (!user) return;

    setLoading(true);
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(ordersData);
        setFilteredOrders(ordersData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching orders:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Filter by tab
  const filterByTab = (tab) => {
    setSelectedTab(tab);

    if (tab === "all") setFilteredOrders(orders);
    else if (tab === "repeat")
      setFilteredOrders(orders.filter((o) => o.repeat));
    else if (tab === "pending")
      setFilteredOrders(orders.filter((o) => o.status === "pending"));
    else if (tab === "cancelled")
      setFilteredOrders(orders.filter((o) => o.status === "cancelled"));
  };

  // Filter by search term
  useEffect(() => {
    if (!searchTerm) {
      filterByTab(selectedTab);
      return;
    }

    const keyword = searchTerm.toLowerCase();

    const filtered = orders.filter((o) =>
      o.items?.some((p) => p.title?.toLowerCase().includes(keyword) || p.name?.toLowerCase().includes(keyword))
    );

    setFilteredOrders(filtered);
  }, [searchTerm, orders, selectedTab]);

  // Order tracking steps
  const trackingSteps = [
    "Order Placed",
    "Order Confirmed",
    "Shipped",
    "Out for Delivery",
    "Delivered",
  ];

  // Handle popup submission
  const handleSubmitPopup = async () => {
    if (!queryType) {
      alert("Please select a query type.");
      return;
    }
    if (!reason) {
      alert("Please select a reason.");
      return;
    }
    if (!summary.trim()) {
      alert("Please enter a summary of your problem.");
      return;
    }

    try {
      setSubmitting(true);
      await addDoc(collection(db, "userQueries"), {
        userId: user.uid,
        orderId: popupData.orderId,
        productName: popupData.productName,
        queryType,
        reason,
        summary,
        createdAt: serverTimestamp(),
        status: "pending",
      });

      alert("Your query has been submitted successfully!");
      setShowPopup(false);
    } catch (error) {
      console.error("Error submitting query:", error);
      alert("Failed to submit query. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  // Get current step index based on order.status OR item.trackingStatus
  const getCurrentStepIndex = (status) => {
    switch (status?.toLowerCase()) {
      case "pending":
        return 0;
      case "confirmed":
      case "order confirmed":
        return 1;
      case "shipped":
        return 2;
      case "out for delivery":
        return 3;
      case "delivered":
        return 4;
      case "cancelled":
        return -1;
      default:
        return 0;
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="page-title">
          <h1>Your Orders</h1>
          <p>Loading orders...</p>
        </div>
        <Footer />
      </>
    );
  }

  // ✅ Order Detail View
  if (selectedOrder) {
    const order = selectedOrder;
    const currentStepIndex = getCurrentStepIndex(order.status);

    return (
      <>
        <Header />
        <div className="page-title">
          <h1>Order Details</h1>
          <button
            style={{
              marginTop: "0.5rem",
              padding: "0.35rem 0.7rem",
              backgroundColor: "#0073e6",
              color: "white",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.9rem",
            }}
            onClick={() => setSelectedOrder(null)}
          >
            ← Back to Orders
          </button>
        </div>

        <div className="order-confirmation-container">
          <div className="order-details-card">
            <div className="order-details-header">
              <div>
                <strong>Order placed:</strong>{" "}
                {order.createdAt?.seconds
                  ? new Date(order.createdAt.seconds * 1000).toLocaleDateString()
                  : order.date || "N/A"}
              </div>
              <div>
                <strong>Order number:</strong> {order.orderId || order.id}
              </div>
              <button className="invoice-link" onClick={() => generateInvoice(order)}>
                Download Invoice ⬇
              </button>
            </div>

            <div className="order-details-content">
              <div>
                <strong>Ship to</strong>
                <br />
                {order.customerName || order.shippingName || "N/A"}
                <br />
                {order.address?.fulladdress ||
                  order.address?.addressLine1 ||
                  "N/A"}
                ,<br />
                {order.address?.town || order.address?.city},{" "}
                {order.address?.city}
                <br />
                {order.address?.state} {order.address?.pincode}
                <br />
                {order.address?.country || "India"}
              </div>
              <div>
                <strong>Payment Methods</strong>
                <br />
                {order.paymentMethod?.detail ||
                  order.paymentMethod ||
                  "No current charges"}
              </div>
              <div>
                <strong>Order Summary</strong>
                <br />
                Item(s) Subtotal: ₹
                {order.subtotal ||
                  order.items?.reduce((a, b) => a + (b.price || 0), 0)}
                <br />
                Shipping: ₹{order.shipping || 0}
                <br />
                <b>Total:</b> ₹{order.total || 0}
                <br />
                <b>Grand Total:</b> ₹{order.total || 0}
              </div>
            </div>
          </div>

          {/* ✅ Items list with after-sales sync */}
               {/* ✅ Items list with after-sales sync + per-item tracking */}
<div className="order-items-list">
  {(order.items || []).map((item, idx) => {
    const currentStepIndex = getCurrentStepIndex(item.trackingStatus || order.status);

    return (
      <div className="order-item" key={idx}>
        <img
          src={item.image || item.imgUrl || ""}
          alt={item.title || item.name || ""}
        />
        <div className="order-item-details">
          <a href={`/product/${item.id || ""}`}>
            {item.title || item.name || ""}
          </a>
          <div>
            Sold by:{" "}
            <span style={{ fontWeight: "normal" }}>
              {item.seller || "Yulaa"}
            </span>
          </div>
          <div>                          {/* 🔹 Show rating if exists */}
{reviews[item.category] && (
  <div className="product-review-display" style={{ marginTop: "0.5rem" }}>
    <div style={{ color: "#f9a825", fontSize: "1.2rem" }}>
      {"★".repeat(Math.round(reviews[item.category].avgRating))}
      {"☆".repeat(5 - Math.round(reviews[item.category].avgRating))}
      <span style={{ marginLeft: "6px", color: "#555", fontSize: "0.9rem" }}>
        ({reviews[item.category].avgRating.toFixed(1)})
      </span>
    </div>
  </div>
)}</div>

          {/* 🔹 Show After-Sales Action */}
          {item.afterSalesAction && (
            <div
              style={{
                marginTop: "0.5rem",
                color: "darkred",
                fontWeight: "600",
              }}
            >
              {`After-Sales Action: ${item.afterSalesAction}`}
            </div>
          )}

          {/* 🔹 Show Admin Comment */}
          {item.adminComment && (
            <div
              style={{
                marginTop: "0.3rem",
                fontStyle: "italic",
                color: "#555",
              }}
            >
              Note from Yulaa: {item.adminComment}
            </div>
          )}

          {/* Return/Exchange/Refund Window */}
          {(() => {
            if (!order.createdAt?.seconds) return null;

            const purchaseDate = new Date(order.createdAt.seconds * 1000);
            const returnWindowCloseDate = new Date(purchaseDate);
            returnWindowCloseDate.setDate(returnWindowCloseDate.getDate() + 5);
            const now = new Date();

            const options = { year: "numeric", month: "long", day: "numeric" };
            const formattedDate = returnWindowCloseDate.toLocaleDateString(undefined, options);

            // 🔹 Only show button if window open AND no after-sales action yet
            if (now <= returnWindowCloseDate && !item.afterSalesAction) {
              return (
                <>
                  <div>
                    Return/Exchange/Refund window will be closed on {formattedDate}
                  </div>
                  <button
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.35rem 0.7rem",
                      backgroundColor: "#0073e6",
                      color: "white",
                      border: "none",
                      borderRadius: "5px",
                      cursor: "pointer",
                      fontWeight: "600",
                      fontSize: "0.9rem",
                    }}
                    onClick={() => {
                      setPopupData({
                        orderId: order.orderId || order.id,
                        productName: item.title || item.name,
                      });
                      setShowPopup(true);
                    }}
                  >
                    Return/Exchange/Refund
                  </button>
                </>
              );
            } else if (!item.afterSalesAction) {
              return (
                <div>
                  Return/Exchange/Refund window was closed on {formattedDate}
                </div>
              );
            }
            return null;
          })()}

          <div className="order-item-price">₹{item.price || "0.00"}</div>
          <div className="order-item-buttons">
            
            <button onClick={() => alert("Buy it again clicked")}>
              Buy it again
            </button>
            <button
              onClick={() => window.open(`/product/${item.id}`, "_blank")}
            >
              View your item
            </button>
            <button
  onClick={() => {
    setReviewData({
      category: item.category || "General",
      productName: item.title || item.name, 
    });
    setShowReviewPopup(true);
  }}
>
  Write a Product Review
</button>
          </div>

          {/* ✅ Per-item tracking */}
          <div className="order-tracking">
            <h4>Tracking for this item</h4>
            <div className="order-tracking-steps">
              {trackingSteps.map((step, i) => (
                <div key={step} className="tracking-step">
                  <div
                    className={`tracking-circle ${i <= currentStepIndex ? "active" : ""}`}
                  >
                    {i + 1}
                  </div>
                  <div style={{ marginTop: 6 }}>{step}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  })}
</div>
          {/* ✅ Live tracking updates */}
          <div className="order-tracking">
            <h3>Order Tracking</h3>
            <div className="order-tracking-steps">
              {trackingSteps.map((step, i) => {
                // decide tracking status either from order.status or first item's trackingStatus
                const itemStatus = order.items?.[0]?.trackingStatus;
                const stepIndex = getCurrentStepIndex(itemStatus || order.status);

                return (
                  <div key={step} className="tracking-step">
                    <div
                      className={`tracking-circle ${
                        i <= stepIndex ? "active" : ""
                      }`}
                    >
                      {i + 1}
                    </div>
                    <div style={{ marginTop: 6 }}>{step}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
  {/* Popup for Product Reviews */}
{showReviewPopup && (
  <div className="popup-overlay">
    <div className="popup-container">
      <h2>Write a Review</h2>
      <p><strong>Category:</strong> {reviewData.category}</p>
      <p><strong>Product:</strong> {reviewData.productName}</p>

      <label>Rating:</label>
      <div style={{ display: "flex", gap: "5px", margin: "8px 0" }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            onClick={() => setRating(star)}
            style={{
              fontSize: "1.8rem",
              cursor: "pointer",
              color: star <= rating ? "#f9a825" : "#ccc", // gold for selected, grey otherwise
              transition: "color 0.2s ease",
            }}
          >
            ★
          </span>
        ))}
      </div>

      <label>Comment:</label>
      <textarea
        placeholder="Share your thoughts..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <div className="popup-buttons">
        <button onClick={handleSubmitReview} disabled={submittingReview}>
          {submittingReview ? "Submitting..." : "Submit Review"}
        </button>
        <button onClick={() => setShowReviewPopup(false)}>Cancel</button>
      </div>
    </div>
  </div>
)}
        {/* Popup for return/exchange/refund */}
        {showPopup && (
          <div className="popup-overlay">
            <div className="popup-container">
              <h2>Submit Return/Exchange/Refund Request</h2>
              <p>
                <strong>Order ID:</strong> {popupData.orderId}
              </p>
              <p>
                <strong>Product:</strong> {popupData.productName}
              </p>

              <label>Query Type:</label>
              <select
                value={queryType}
                onChange={(e) => {
                  setQueryType(e.target.value);
                  setReason("");
                }}
              >
                <option value="">-- Select --</option>
                <option value="Exchange">Exchange</option>
                <option value="Return">Return</option>
                <option value="Refund">Refund</option>
              </select>

              {queryType && (
                <>
                  <label>Reason:</label>
                  <select
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  >
                    <option value="">-- Select --</option>
                    {reasonsMap[queryType]?.map((r, i) => (
                      <option key={i} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </>
              )}

              <label>Summary:</label>
              <textarea
                placeholder="Please describe your issue..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
              />

              <div className="popup-buttons">
                <button onClick={handleSubmitPopup} disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Query"}
                </button>
                <button onClick={() => setShowPopup(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        <Footer />
      </>
    );
  }

  // ✅ Orders list view
  return (
    <>
      <Header />
      <div className="page-title">
        <h1>Your Orders</h1>
        <p>
          Every touchpoint — from products to packaging — is filled with thought
          and care.
        </p>
        <button
          style={{
            marginTop: "0.5rem",
            padding: "0.35rem 0.7rem",
            backgroundColor: "#0073e6",
            color: "white",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.9rem",
          }}
          onClick={() => navigate("/youraccount")}
        >
          ← Back to Your Yulaa Account
        </button>
      </div>
      <div className="orders-wrapper">
        <section className="section">
          <div className="orders-tabs">
            <button
              type="button"
              className={selectedTab === "all" ? "active" : ""}
              onClick={() => filterByTab("all")}
            >
              Orders
            </button>
            <button
              type="button"
              className={selectedTab === "pending" ? "active" : ""}
              onClick={() => filterByTab("pending")}
            >
              Not Yet Shipped
            </button>
            <button
              type="button"
              className={selectedTab === "cancelled" ? "active" : ""}
              onClick={() => filterByTab("cancelled")}
            >
              Cancelled Orders
            </button>

            <div className="order-search">
              <input
                type="text"
                placeholder="Search all orders"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button onClick={() => filterByTab(selectedTab)}>Search</button>
            </div>
          </div>

          <div className="order-filters">
            <strong>{filteredOrders.length} orders</strong>
          </div>

          <div className="orders-container">
            {filteredOrders.length === 0 ? (
              <p>No orders found.</p>
            ) : (
              filteredOrders.map((order) => (
                <div
                  key={order.id}
                  className="order-card"
                  style={{ cursor: "pointer" }}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="order-header">
                    <span>Order ID: {order.orderId || order.id}</span>
                    <span>
                      {order.createdAt?.seconds
                        ? new Date(
                            order.createdAt.seconds * 1000
                          ).toLocaleDateString()
                        : "Date N/A"}
                    </span>
                  </div>
                  <div className="order-products">
                    {Array.isArray(order.items) && order.items.length > 0 ? (
                      order.items.map((product, idx) => (
                        <div className="product-item" key={idx}>
                          <img src={product.image} alt={product.title || product.name} />
                          <div>
                            <h4>{product.title || product.name}</h4>
                            <p>₹{product.price}</p>
                          </div>
                          {/* 🔹 Show rating if exists */}
{reviews[product.category] && (
  <div className="product-review-display" style={{ marginTop: "0.5rem" }}>
    <div style={{ color: "#f9a825", fontSize: "1.2rem" }}>
      {"★".repeat(Math.round(reviews[product.category].avgRating))}
      {"☆".repeat(5 - Math.round(reviews[product.category].avgRating))}
      <span style={{ marginLeft: "6px", color: "#555", fontSize: "0.9rem" }}>
        ({reviews[product.category].avgRating.toFixed(1)})
      </span>
    </div>
  </div>
)}

                        </div>
                      ))
                    ) : (
                      <p>Click on Order ID for detailed View</p>
                    )}
                  </div>
                  <div className="order-footer">
                    <strong>Status:</strong> {order.status || "pending"}
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="section">
          <h2>Manage More</h2>
          <div className="account-grid">
            <div
              className="account-item"
              onClick={() => navigate("/security")}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === "Enter" && navigate("/security")}
            >
              <div className="icon">🔒</div>
              <h4>Login & Security</h4>
              <p>Update name, email & password</p>
            </div>
            <div
              className="account-item"
              onClick={() => navigate("/addresses")}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === "Enter" && navigate("/addresses")}
            >
              <div className="icon">📍</div>
              <h4>Your Addresses</h4>
              <p>Manage saved addresses</p>
            </div>
            <div
              className="account-item"
              onClick={() => navigate("/payments")}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === "Enter" && navigate("/payments")}
            >
              <div className="icon">💳</div>
              <h4>Payment Options</h4>
              <p>Add or update payment methods</p>
            </div>
            <div
              className="account-item"
              onClick={() => navigate("/wishlist")}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === "Enter" && navigate("/wishlist")}
            >
              <div className="icon">❤️</div>
              <h4>Your Wishlist</h4>
              <p>See your saved products</p>
            </div>
            <div
              className="account-item"
              onClick={() => navigate("/help")}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => e.key === "Enter" && navigate("/help")}
            >
              <div className="icon">❓</div>
              <h4>Help & Support</h4>
              <p>Raise queries or find answers</p>
            </div>
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
};

export default Orders;
