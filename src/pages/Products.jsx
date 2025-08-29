// src/pages/Products.jsx
import React, { useEffect, useState, useContext, useMemo } from "react";

import {
  collection,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../firebase";
import { useNavigate } from "react-router-dom";
import { FaHeart, FaStar, FaFilter } from "react-icons/fa";
import { toast } from "react-hot-toast";
import "../styles/Products.css";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { addToCart } from "../utils/cartUtils";
import { AuthContext } from "../contexts/AuthContext";
import { useBuyNow } from "../contexts/BuyNowContext";
import { getAuth } from "firebase/auth";
import { useRef } from "react";

const Products = () => {
 const { user } = useContext(AuthContext);
  const { setBuyNowProduct } = useBuyNow();
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [categoryRatings, setCategoryRatings] = useState({});
  const navigate = useNavigate();

  // Filters & sort
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedTrimester, setSelectedTrimester] = useState("all");
  const [availabilityOnly, setAvailabilityOnly] = useState(false);
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [sortBy, setSortBy] = useState("newest");

  // Pagination
  const PAGE_SIZE = 12;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sidebarRef = useRef(null);
  const startX = useRef(0);
  const currentX = useRef(0);
  const isDragging = useRef(false);

  // start swipe
  const handleTouchStart = (e) => {
    startX.current = e.touches[0].clientX;
    currentX.current = startX.current;
    isDragging.current = true;
  };

  // track swipe
  const handleTouchMove = (e) => {
    if (!isDragging.current) return;
    currentX.current = e.touches[0].clientX;

    const deltaX = currentX.current - startX.current;
    if (deltaX < 0) {
      // move sidebar left while dragging
      sidebarRef.current.style.transform = `translateX(${deltaX}px)`;
    }
  };

  // end swipe
  const handleTouchEnd = () => {
    if (!isDragging.current) return;
    isDragging.current = false;

    const deltaX = currentX.current - startX.current;

    // if swipe left more than 80px → close
    if (deltaX < -80) {
      setFilterOpen(false);
      document.body.classList.remove("filters-open");
    } else {
      // reset position
      sidebarRef.current.style.transform = "translateX(0)";
    }
  };


  // --- 🔹 Fetch products ---
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "products"));
        const fetchedProducts = querySnapshot.docs.map((docRef) => ({
          id: docRef.id,
          ...docRef.data(),
        }));
        setProducts(fetchedProducts);
      } catch (err) {
        console.error("Error fetching products:", err);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
  return () => document.body.classList.remove("filters-open");
}, []);


  // --- 🔹 Real-time reviews by category ---
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "productReviews"), (snapshot) => {
      const reviews = snapshot.docs.map((doc) => doc.data());

      const grouped = reviews.reduce((acc, r) => {
        if (!r.category) return acc;
        if (!acc[r.category]) acc[r.category] = { total: 0, count: 0 };
        acc[r.category].total += Number(r.rating || 0);
        acc[r.category].count += 1;
        return acc;
      }, {});

      const averages = {};
      for (let cat in grouped) {
        averages[cat] = {
          avg: grouped[cat].total / grouped[cat].count,
          count: grouped[cat].count,
        };
      }
      setCategoryRatings(averages);
    });

    return () => unsub();
  }, []);

  // --- 🔹 Helpers ---
  const formatReviewCount = (count) => {
    if (count >= 1000000) return (count / 1000000).toFixed(1) + "m+";
    if (count >= 1000) return (count / 1000).toFixed(1) + "k+";
    return count;
  };

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

  const handleWishlist = (e, product) => {
    e.stopPropagation();
    if (!user) {
      toast("Please sign in to add to wishlist");
    } else {
      toast.success("Added to wishlist");
    }
  };

  const handleBuyNow = (e, product) => {
    e.stopPropagation();
    const auth = getAuth();
    const currentUser = auth.currentUser;
    setBuyNowProduct(product);
    if (currentUser) {
      navigate("/checkout");
    } else {
      localStorage.setItem("redirectAfterLogin", "checkout");
      navigate("/signin");
    }
  };

  // --- 🔹 Filters ---
  const categories = useMemo(() => {
    const setC = new Set();
    products.forEach((p) => p.category && setC.add(p.category));
    return ["all", ...Array.from(setC)];
  }, [products]);

  const trimesters = useMemo(() => {
    const setT = new Set();
    products.forEach((p) => p.trimester && setT.add(p.trimester));
    return ["all", ...Array.from(setT)];
  }, [products]);

  // --- 🔹 Filtering & sorting ---
  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (selectedTrimester !== "all") {
      list = list.filter((p) => p.trimester === selectedTrimester);
    }
    if (availabilityOnly) {
      list = list.filter((p) => (p.stock == null ? true : p.stock > 0));
    }
    const [minPrice, maxPrice] = priceRange;
    list = list.filter((p) => {
      const price = Number(p.price || 0);
      return price >= minPrice && price <= maxPrice;
    });

    if (sortBy === "price-asc") {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "price-desc") {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else {
      list.sort((a, b) => {
        const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return tb - ta;
      });
    }
    return list;
  }, [products, selectedCategory, selectedTrimester, availabilityOnly, priceRange, sortBy]);

  // --- 🔹 Pagination ---
  const visibleProducts = filteredProducts.slice(0, visibleCount);
  const handleLoadMore = () => setVisibleCount((prev) => prev + PAGE_SIZE);

  const derivedMinPrice = useMemo(() => {
    if (!products.length) return 0;
    return Math.min(...products.map((p) => Number(p.price || 0)));
  }, [products]);

  const derivedMaxPrice = useMemo(() => {
    if (!products.length) return 10000;
    return Math.max(...products.map((p) => Number(p.price || 0)));
  }, [products]);

  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [selectedCategory, selectedTrimester, availabilityOnly, priceRange, sortBy]);

  return (
    <>
      <Header />
      <div className="page-title">
        <h1>Shop Yulaa Essentials</h1>
        <p>Discover thoughtfully curated kits & products for every stage.</p>
      </div>

      <main className="products-page container">
        <div className="products-header">
          <div className="header-controls">
<button
  className="filter-toggle"
  onClick={() => {
    setFilterOpen((s) => {
      const newState = !s;
      if (newState) {
        document.body.classList.add("filters-open");
      } else {
        document.body.classList.remove("filters-open");
      }
      return newState;
    });
  }}
  aria-expanded={filterOpen}
  aria-controls="filters"
>
  <FaFilter /> Add Filters
</button>

            <select
              className="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">Sort: Newest</option>
              <option value="price-asc">Sort: Price: Low to High</option>
              <option value="price-desc">Sort: Price: High to Low</option>
            </select>
          </div>
        </div>

        <div className="products-grid-wrap">
          {/* Sidebar Filters */}
<aside
  ref={sidebarRef}
  id="filters"
  className={`filters-sidebar ${filterOpen ? "open" : ""}`}
  onTouchStart={handleTouchStart}
  onTouchMove={handleTouchMove}
  onTouchEnd={handleTouchEnd}
>
  {/* ... filter contents ... */}
            {filterOpen && (
  <div
    className="filters-overlay"
    onClick={() => {
      setFilterOpen(false);
      document.body.classList.remove("filters-open");
    }}
  />
)}
            <div className="filter-block">
              <h4>Category</h4>
              <ul className="filter-list">
                {categories.map((c) => (
                  <li key={c}>
                    <label>
                      <input
                        type="radio"
                        name="category"
                        checked={selectedCategory === c}
                        onChange={() => setSelectedCategory(c)}
                      />{" "}
                      {c === "all" ? "All" : c}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="filter-block">
              <h4>Trimester</h4>
              <ul className="filter-list">
                {trimesters.map((t) => (
                  <li key={t}>
                    <label>
                      <input
                        type="radio"
                        name="trimester"
                        checked={selectedTrimester === t}
                        onChange={() => setSelectedTrimester(t)}
                      />{" "}
                      {t === "all" ? "All" : t}
                    </label>
                  </li>
                ))}
              </ul>
            </div>

            <div className="filter-block">
              <h4>Availability</h4>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={availabilityOnly}
                  onChange={(e) => setAvailabilityOnly(e.target.checked)}
                />{" "}
                In stock only
              </label>
            </div>

            <div className="filter-block">
              <h4>Price</h4>
              <div className="price-range">
                <input
                  type="number"
                  min={derivedMinPrice}
                  max={derivedMaxPrice}
                  value={priceRange[0]}
                  onChange={(e) => setPriceRange([Number(e.target.value || 0), priceRange[1]])}
                />
                <span> — </span>
                <input
                  type="number"
                  min={derivedMinPrice}
                  max={derivedMaxPrice}
                  value={priceRange[1]}
                  onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value || derivedMaxPrice)])}
                />
              </div>
            </div>

            <div className="filter-actions">
              <button
                className="btn-secondary"
                onClick={() => {
                  setSelectedCategory("all");
                  setSelectedTrimester("all");
                  setAvailabilityOnly(false);
                  setPriceRange([derivedMinPrice, derivedMaxPrice]);
                }}
              >
                Reset
              </button>
            </div>
          </aside>
 {/* Product Grid */}
          <section className="products-grid">
            {visibleProducts.length === 0 ? (
              <div className="no-results">No products found for selected filters.</div>
            ) : (
              <div className="grid">
                {visibleProducts.map((product) => {
                  const catReview = categoryRatings[product.category] || { avg: 0, count: 0 };
                  const avgRating = catReview.avg || 0;
                  const reviewCount = catReview.count || 0;

                  return (
                    <article
                      key={product.id}
                      className="product-card"
                      onClick={(e) => handleProductClick(e, product.id)}
                    >
                      <div className="card-media">
                        <img src={product.image} alt={product.name} className="card-image" />
                        <button
                          className="wishlist-btn"
                          onClick={(e) => handleWishlist(e, product)}
                          aria-label="Add to wishlist"
                        >
                          <FaHeart />
                        </button>
                        {product.isNew && <span className="badge new">New</span>}
                        {product.stock === 0 && <span className="badge out">Out of stock</span>}
                      </div>

                      <div className="card-body">
                        <h3 className="card-title">{product.name}</h3>

                        <div className="card-meta">
                          <div className="rating">
                            {[...Array(5)].map((_, i) => {
                              const threshold = i + 1;
                              return (
                                <FaStar
                                  key={i}
                                  className={
                                    avgRating >= threshold
                                      ? "star on"
                                      : avgRating >= threshold - 0.5
                                      ? "star half"
                                      : "star"
                                  }
                                  style={{ color: avgRating >= threshold - 0.5 ? "#f9a825" : "#ccc" }}
                                />
                              );
                            })}
                            <span className="reviews">
                              ({formatReviewCount(reviewCount)})
                            </span>
                          </div>

                          <div className="price">₹{product.price}</div>
                        </div>

                        <div className="card-actions">
                          <button
                            className="btn-cart"
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={product.stock === 0}
                          >
                            Add to Cart
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}

            {visibleCount < filteredProducts.length && (
              <div className="load-more-wrap">
                <button className="btn-outline" onClick={handleLoadMore}>
                  Load More
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </>
  );
};

export default Products;