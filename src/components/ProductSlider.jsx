// src/pages/ProductSlider.jsx
import React, { useEffect, useState, useContext } from "react";
import {
  collection,
  onSnapshot,
  getDocs,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaStar,FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { toast } from "react-hot-toast";
import "../styles/ProductSlider.css";
import { addToCart } from "../utils/cartUtils";
import { AuthContext } from "../contexts/AuthContext";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const Products = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [categoryRatings, setCategoryRatings] = useState({});
  const navigate = useNavigate();

  // ✅ Fetch products
  // ✅ Fetch products once
  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      const fetchedProducts = querySnapshot.docs.map((docRef) => ({
        id: docRef.id,
        ...docRef.data(),
      }));
      setProducts(fetchedProducts);
    };
    fetchProducts();
  }, []);

  
  // ✅ Live subscription to reviews
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "productReviews"), (snapshot) => {
      const reviews = snapshot.docs.map((doc) => doc.data());

      // group by category
      const categoryData = {};
      reviews.forEach((r) => {
        if (!categoryData[r.category]) {
          categoryData[r.category] = { total: 0, count: 0 };
        }
        categoryData[r.category].total += r.rating;
        categoryData[r.category].count += 1;
      });

      // calculate averages
      const averages = {};
      Object.keys(categoryData).forEach((cat) => {
        averages[cat] =
          categoryData[cat].count > 0
            ? categoryData[cat].total / categoryData[cat].count
            : 0;
      });

      setCategoryRatings(averages);
    });

    return () => unsub(); // cleanup
  }, []);

  // ✅ Attach category average rating to each product
  const productsWithRatings = products.map((p) => ({
    ...p,
    rating: categoryRatings[p.category] || 0,
  }));

  const handleProductClick = (e, id) => {
    e.stopPropagation();
    navigate(`/product/${id}`);
  };

  const handleQuantityChange = (productId, value) => {
    setQuantities((prev) => ({
      ...prev,
      [productId]: Math.max(1, parseInt(value) || 1),
    }));
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    const quantity = quantities[product.id] || 1;
    const productToAdd = { ...product, quantity };

    if (!productToAdd.id) {
      console.error("Invalid product structure:", productToAdd);
      return;
    }

    addToCart(user?.uid, productToAdd);
    toast.success("Added to cart");
  };

  const handleWishlist = (e) => {
    e.stopPropagation();
    if (!user) {
      toast.info("Please sign in to add to wishlist");
    } else {
      // Add wishlist logic here
    }
  };

  const sliderSettings = {
    dots: false,
    infinite: true,
    speed: 500,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
        },
      },
    ],
  };

  const renderProductCard = (product) => {
    const avgRating = categoryRatings[product.category] || 0;

    return (
      <div
        key={product.id}
        className="product-card"
        onClick={(e) => handleProductClick(e, product.id)}
      >
        <div className="relative">
          <img src={product.image} alt={product.name} className="product-image" />
          <FaHeart className="wishlist-icon" onClick={handleWishlist} />
        </div>
        <div className="product-details">
          <h4 className="product-title">{product.name}</h4>

          {/* ✅ Show average rating for the category */}
         <div className="flex items-center gap-1">
  {[...Array(5)].map((_, i) => {
    const starValue = i + 1;
    if (avgRating >= starValue) {
      return <FaStar key={i} className="text-yellow-400" />;
    } else if (avgRating >= starValue - 0.5) {
      return <FaStarHalfAlt key={i} className="text-yellow-400" />;
    } else {
      return <FaRegStar key={i} className="text-gray-300" />;
    }
  })}
  {avgRating > 0 && (
    <span className="text-sm text-gray-600">
      ({avgRating.toFixed(1)})
    </span>
  )}
</div>
          <p
            className="product-price"
            style={{ color: "#000", fontWeight: "normal" }}
          >
            ₹{product.price}
          </p>

          <div className="product-actions">
            <button
              className="btn-cart"
              onClick={(e) => handleAddToCart(e, product)}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  };

  const categoryProducts = products.filter((p) => p.category);
  const trimesterProducts = products.filter((p) => p.trimester);
  const allProducts = products;

  return (
    <div className="products-page">
      <section className="product-section">
        <h2>Maternity Essentials By Yulaa</h2>
        <Slider {...sliderSettings}>
          {categoryProducts.map(renderProductCard)}
        </Slider>
      </section>

      <section className="product-section">
        <h2>Trimester Essentials by Yulaa</h2>
        <Slider {...sliderSettings}>
          {trimesterProducts.map(renderProductCard)}
        </Slider>
      </section>

      <section className="product-section">
        <h2>Shop our Favorites</h2>
        <Slider {...sliderSettings}>
          {allProducts.map(renderProductCard)}
        </Slider>
      </section>
    </div>
  );
};

export default Products;
