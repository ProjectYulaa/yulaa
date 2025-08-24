// src/pages/ProductDetails.jsx
import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { db } from "../firebase";
import {
  doc, getDoc, collection, query, where, onSnapshot, addDoc, getDocs
} from "firebase/firestore";
import { Timestamp } from "firebase/firestore";
import { FaStar, FaHeart } from "react-icons/fa";
import "../styles/ProductDetails.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { addToCart } from "../utils/cartUtils";
import { AuthContext } from "../contexts/AuthContext";
import { getAuth } from "firebase/auth";

const ProductDetails = () => {
  const { user } = useContext(AuthContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [product, setProduct] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [pincode, setPincode] = useState("");
  const [estimatedDate, setEstimatedDate] = useState("");
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [comparisonProducts, setComparisonProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("description");

  // Reviews State
  const [reviews, setReviews] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [reviewCount, setReviewCount] = useState(0);
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [newReview, setNewReview] = useState({ rating: 0, comment: "" });

  const [soldCount, setSoldCount] = useState(0);

  // 🔹 Fetch sold count (last 48 hours)
  useEffect(() => {
    if (!product) return;

    const fetchSoldCount = async () => {
      try {
        const snapshot = await getDocs(collection(db, "countOfOrders"));
        let count = 0;
        const now = new Date();
        const cutoff = new Date(now.getTime() - 48 * 60 * 60 * 1000);

        snapshot.forEach((docSnap) => {
          const orderItem = docSnap.data();
          const orderDate = orderItem.createdAt?.toDate
            ? orderItem.createdAt.toDate()
            : null;

          if (
            orderDate &&
            orderDate >= cutoff &&
            orderItem.productName === product.name
          ) {
            count += orderItem.quantity || 0;
          }
        });

        setSoldCount(count);
      } catch (err) {
        console.error("Error fetching sold count:", err);
      }
    };

    fetchSoldCount();
  }, [id, product]);

  // 🔹 Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const docRef = doc(db, "products", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = { id: docSnap.id, ...docSnap.data() };
          setProduct(data);
          setSelectedImage(data.image || data.images?.[0] || "");
        }
      } catch (error) {
        console.error("Error fetching product:", error);
      }
    };
    fetchProduct();
  }, [id]);

  // 🔹 Fetch related products
  useEffect(() => {
    if (!product?.category) return;
    const fetchRelated = async () => {
      try {
        const q = query(collection(db, "products"), where("category", "==", product.category));
        const querySnapshot = await getDocs(q);
        const results = [];
        querySnapshot.forEach((docSnap) => {
          if (docSnap.id !== id) results.push({ id: docSnap.id, ...docSnap.data() });
        });
        setRelatedProducts(results.slice(0, 8));
        setComparisonProducts(results.slice(0, 5));
      } catch (error) {
        console.error("Error fetching related products:", error);
      }
    };
    fetchRelated();
  }, [product, id]);

  // 🔹 Fetch reviews
  useEffect(() => {
    if (!product?.category) return;
    const q = query(collection(db, "productReviews"), where("category", "==", product.category));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reviewsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setReviews(reviewsData);

      if (reviewsData.length > 0) {
        const total = reviewsData.reduce((sum, r) => sum + (r.rating || 0), 0);
        setAvgRating(total / reviewsData.length);
        setReviewCount(reviewsData.length);
      } else {
        setAvgRating(0);
        setReviewCount(0);
      }
    });
    return () => unsubscribe();
  }, [product?.category]);

  const formatReviewCount = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M+";
    if (num >= 1000) return (num / 1000).toFixed(1) + "k+";
    return num;
  };

  // 🔹 Buy Now
  const handleBuyNow = (prod) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    const productWithQty = {
      ...prod,
      quantity,
      ...(selectedSize ? { size: selectedSize } : {}),
    };

    // ✅ Save to sessionStorage only
    sessionStorage.setItem("buyNowProduct", JSON.stringify(productWithQty));

    if (currentUser) {
      navigate("/checkout");
    } else {
      localStorage.setItem("redirectAfterLogin", "checkout");
      navigate("/signin");
    }
  };

  // Pincode Check
  const handlePincodeCheck = () => {
    if (!pincode || pincode.length < 6) {
      alert("Please enter a valid pincode.");
      return;
    }
    const today = new Date();
    today.setDate(today.getDate() + 4);
    const estDate = today.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    setEstimatedDate(`Delivery by ${estDate}`);
  };

  if (!product) return <div className="loader">Loading...</div>;

  return (
    <>
      <Header />
      <div className="product-page-wrapper">
        <div className="product-container">
          {/* LEFT: Image Gallery */}
          <div className="product-gallery">
            {product.images?.length > 1 && (
              <div className="thumbnail-list">
                {product.images.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt="thumb"
                    className={`thumbnail ${selectedImage === img ? "active" : ""}`}
                    onClick={() => setSelectedImage(img)}
                  />
                ))}
              </div>
            )}
            <div className="main-image-container">
              <img src={selectedImage} alt={product.name} className="main-image" />
            </div>
          </div>

          {/* CENTER: Product Info */}
          <div className="product-info">
            <h1>{product.name}</h1>
           <p className="sold-count">
  {soldCount} sold in last 48 hours
</p>
            {/* 🔹 Updated Rating Section */}
            <div className="product-rating">
              {[...Array(5)].map((_, i) => (
                <FaStar
                  key={i}
                  color={i < Math.round(avgRating) ? "#FFD700" : "#ccc"}
                />
              ))}
              <span className="review-count">
                ({formatReviewCount(reviewCount)} reviews)
              </span>
            </div>

            <p className="product-price">
              ₹{product.price}
              <span className="mrp"> MRP: ₹{product.mrp}</span>
            </p>

            <div className="offers-section">
              <h4>Available Offers</h4>
              <ul>
                <li>🎉 Get 10% off on prepaid orders</li>
                <li>🚚 Free shipping above ₹999</li>
              </ul>
            </div>

            {product.sizes?.length > 0 && (
              <div className="size-selector">
                <label>Select Size:</label>
                <div className="size-options">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      className={`size-btn ${selectedSize === size ? "active" : ""}`}
                      onClick={() => setSelectedSize(size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <ul className="product-features">
              {product.highlights?.map((point, idx) => (
                <li key={idx}>{point}</li>
              ))}
            </ul>

            <div className="wishlist-bar">
              <FaHeart /> <span>Add to Wishlist</span>
            </div>
          </div>

          {/* RIGHT: Purchase Box */}
          <div className="purchase-box">
            <div className="price-section">
              <strong className="product-price">₹{product.price}</strong>
              <p className="tax-note">Inclusive of all taxes</p>
            </div>

<div className="quantity-section">
  <label>Quantity:</label>
  <div className="quantity-buttons">
    <button
      className="qty-btn"
      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
    >
      -
    </button>
    <span className="qty-display">{quantity}</span>
    <button
      className="qty-btn"
      onClick={() => setQuantity((prev) => prev + 1)}
    >
      +
    </button>
  </div>
</div>
            <button
              onClick={() => addToCart(user?.uid, product, quantity)}
              className="btn-cart"
              disabled={!selectedSize && product.sizes?.length > 0}
            >
              Add to Cart
            </button>
        <button
  className="btn-buy"
  onClick={() => handleBuyNow(product)}
  disabled={!selectedSize && product.sizes?.length > 0}
>
  Buy Now
</button>


            <div className="delivery-checker">
              <input
                type="text"
                placeholder="Enter Pincode"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
              />
              <button onClick={handlePincodeCheck}>Check</button>
              {estimatedDate && <p className="est-date success">{estimatedDate}</p>}
            </div>

            <p className="seller-info">Sold by: Yulaa</p>
          </div>
        </div>

        {/* TABS Section */}
        <div className="product-tabs">
          <div className="tab-buttons">
            <button
              className={activeTab === "description" ? "active" : ""}
              onClick={() => setActiveTab("description")}
            >
              Description
            </button>
            <button
              className={activeTab === "shipping" ? "active" : ""}
              onClick={() => setActiveTab("shipping")}
            >
              Shipping & Returns
            </button>
            <button
              className={activeTab === "policy" ? "active" : ""}
              onClick={() => setActiveTab("policy")}
            >
              Return Policy
            </button>
          </div>

          <div className="tab-content">
            {activeTab === "description" && (
              <ul className="product-description-list">
                {product.description
                  ?.split(".")
                  .map((line) => line.replace(/['"]+/g, "").trim())
                  .filter((line) => line.length > 0)
                  .map((point, idx) => (
                    <li key={idx}>{point}.</li>
                  ))}
              </ul>
            )}

            {activeTab === "shipping" && (
              <div>
                <p>We ship pan-India with delivery times between 3–7 business days.</p>
                <p>Free shipping on orders above ₹999.</p>
                <p>Return & Exchange Policy – At Yulaa, we strive to provide you with the best shopping experience. However, if you need to return or exchange an item, please review our policy below:</p>
                
                <p>Returns & Exchanges</p>
                 <p>Return Request: Initiate your return request within 5 days of receiving your order.</p>
                 <p>Non-Refundable Charges: Duties, taxes, and shipping charges are non-refundable.</p>
                 <p>Sale & Discounted Products: Items purchased on sale or with a discount are not eligible for return, exchange, or refund.</p>
                 <p>Refunds: Refunds will be issued only as store credits. No cash refunds are available.</p>

<p>Shipping & Dispatch </p>
<p>Immediate Shipping: Orders are shipped within 24 hours of placement.</p>
<p>For any assistance, feel free to reach out to our customer support team.</p>
              </div>
            )}

            {activeTab === "policy" && (
              <div>
                <p>Easy returns within 7 days of delivery.</p>
                <p>Product must be unused and in original packaging.</p>
<p>Here's a guide on how to raise a return request on our website:</p>
<p>👉Log in to your account</p>
<p>👉Select the Orders</p>
<p>👉Click "Request a Return"</p>
<p>👉Select the item(s) you wish to return</p>
<p>👉Specify the reason for the return</p>
<p>👉Provide any additional details requested, such as the item's condition or defects</p>
<p>👉 Click on the "Request Return" button</p>
              </div>
            )}
          </div>
        </div>

        {/* 🔹 Customer Reviews Section */}
        {reviews.length > 0 && (
          <div className="reviews-section">
            <h2>Customer Reviews</h2>
            {reviews
              .slice(0, showAllReviews ? reviews.length : 5)
              .map((rev) => (
                <div key={rev.id} className="review-box">
                  <div className="review-rating">
                    {[...Array(5)].map((_, i) => (
                      <FaStar
                        key={i}
                        color={i < rev.rating ? "#FFD700" : "#ccc"}
                      />
                    ))}
                  </div>
                  <p className="review-comment">{rev.comment}</p>
                </div>
              ))}

            {reviews.length > 5 && (
              <button
                className="btn-view-all"
                onClick={() => setShowAllReviews(!showAllReviews)}
              >
                {showAllReviews ? "Show Less" : "View All"}
              </button>
            )}
            {/* Write a Review Button */}
{!showReviewForm ? (
  <button
    className="btn-cart"
    onClick={() => {
      if (!user) {
        localStorage.setItem("redirectAfterLogin", window.location.pathname);
        navigate("/signin");
      } else {
        setShowReviewForm(true);
      }
    }}
  >
    Write a Review
  </button>
) : (
  <div className="review-form">
    <h3>Write a Review</h3>
    <div className="rating-input">
      {[...Array(5)].map((_, i) => (
        <FaStar
          key={i}
          color={i < newReview.rating ? "#FFD700" : "#ccc"}
          onClick={() => setNewReview({ ...newReview, rating: i + 1 })}
          style={{ cursor: "pointer" }}
        />
      ))}
    </div>
    <textarea
      placeholder="Share your experience..."
      value={newReview.comment}
      onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
    />
    <button
      className="btn-cart"
      onClick={async () => {
        if (!newReview.rating || !newReview.comment) {
          alert("Please add both rating and comment.");
          return;
        }
        try {
          await addDoc(collection(db, "productReviews"), {
            productId: id,
            category: product.category,
            rating: newReview.rating,
            comment: newReview.comment,
            userId: user.uid,
            createdAt: Timestamp.now(),
          });
          setNewReview({ rating: 0, comment: "" });
          setShowReviewForm(false);
        } catch (err) {
          console.error("Error adding review:", err);
        }
      }}
    >
      Submit Review
    </button>
  </div>
)}

          </div>
        )}

        {/* Related products */}
        <div className="related-products-section">
          <h2>You May Also Like</h2>
          <div className="carousel">
            {relatedProducts.map((item) => (
              <Link to={`/product/${item.id}`} key={item.id} className="carousel-item">
                <img src={item.image} alt={item.name} />
                <p className="name">{item.name}</p>
                <p className="price">₹{item.price}</p>
                <div className="stars">
                  {[...Array(5)].map((_, i) => (
                    <FaStar key={i} color={i < item.rating ? "#FFD700" : "#ccc"} />
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ProductDetails;
