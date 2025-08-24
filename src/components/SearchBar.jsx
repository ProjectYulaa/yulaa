import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase";
import "../styles/SearchBar.css";

const categories = ["All", "Maternity", "Wellness", "Accessories", "Skincare"];

const SearchBar = ({ onSelect }) => {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [allProducts, setAllProducts] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [showResults, setShowResults] = useState(false);

  const navigate = useNavigate();
  const searchBoxRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      const querySnapshot = await getDocs(collection(db, "products"));
      const products = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAllProducts(products);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    if (query.trim() === "") {
      setFiltered([]);
      return;
    }

    const results = allProducts.filter((product) => {
      const matchCategory =
        category === "All" ||
        product.category?.toLowerCase() === category.toLowerCase();
      const matchName = product.name
        .toLowerCase()
        .includes(query.toLowerCase());
      return matchCategory && matchName;
    });

    setFiltered(results);
  }, [query, category, allProducts]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchBoxRef.current &&
        !searchBoxRef.current.contains(e.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target)
      ) {
        setShowResults(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (productId) => {
    navigate(`/product/${productId}`);
    setQuery("");
    setShowResults(false);

     if (onSelect) onSelect();

  };

  return (
    <div className="search-bar-container" ref={searchBoxRef}>
      <div className="search-bar">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          placeholder="Search Yulaa products"
        />
        <button>🔍</button>
      </div>

      {showResults && filtered.length > 0 && (
        <ul className="search-dropdown" ref={dropdownRef}>
          {filtered.map((product) => (
            <li key={product.id} onClick={() => handleSelect(product.id)}>
              {product.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
