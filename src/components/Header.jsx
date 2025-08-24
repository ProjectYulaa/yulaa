// src/components/Header.jsx
import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

// Contexts
import { AuthContext } from "../contexts/AuthContext";
import { CartContext } from "../contexts/CartContext";

// Components
import SearchBar from "./SearchBar";
import LocationPopup from "./LocationPopup";

// Styles
import "../styles/Header.css";

// Icons
import { FaShoppingCart, FaBars, FaTimes, FaSearch } from "react-icons/fa";

export default function Header() {
  const { user } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationText, setLocationText] = useState("Choose Location");
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [isHoveringAccount, setIsHoveringAccount] = useState(false);

  const navigate = useNavigate();

  // Lock body scroll when either mobile menu OR search overlay is open
  useEffect(() => {
    document.body.style.overflow =
      mobileMenuOpen || mobileSearchOpen ? "hidden" : "auto";
  }, [mobileMenuOpen, mobileSearchOpen]);

  // Location + delivery check (unchanged logic)
  useEffect(() => {
    const location = JSON.parse(localStorage.getItem("deliveryPincode"));
    if (location) {
      setLocationText(
        `${location.city}, ${location.state} - ${location.pincode}`
      );
      setDeliveryAvailable(location.deliveryAvailable);
    }
  }, [locationOpen]);

  // Signout (unchanged logic)
  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Sticky header (unchanged logic)
  useEffect(() => {
    const header = document.querySelector(".header-container");
    const handleScroll = () => {
      if (window.scrollY > 50) {
        header.classList.add("sticky");
        document.body.style.paddingTop = header.offsetHeight + "px";
      } else {
        header.classList.remove("sticky");
        document.body.style.paddingTop = "0";
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className="header-container">
      {/* Promo strip */}
      <div className="header-top-row">
        <p className="header-top-text">
          Free Delivery on orders over ₹999 & 10% off
        </p>
      </div>

      {/* MAIN HEADER ROW */}
      <div className="header-top">
        {/* LEFT (mobile: hamburger + search) */}
        <div className="mobile-left-icons">
          <button
            className="hamburger-btn"
            aria-label="Open menu"
            onClick={() => setMobileMenuOpen(true)}
          >
            <FaBars size={20} />
  
          </button>
          <button
            className="search-toggle-btn"
            aria-label="Open search"
            onClick={() => setMobileSearchOpen(true)}
          >
            <FaSearch size={20} />
          </button>
        </div>

        {/* CENTER (logo always present, centered on mobile) */}
        <div className="logo-center">
          <Link to="/" className="logo">
            Yulaa
          </Link>
        </div>

        {/* RIGHT (mobile: account + cart) */}
        <div className="mobile-right-icons">
          <div
            className="account-dropdown"
            onMouseEnter={() => setIsHoveringAccount(true)}
            onMouseLeave={() => setIsHoveringAccount(false)}
          >
            <button className="account-label" aria-haspopup="menu">
              Hello, {user ? user.displayName || user.email : "Sign In"} ▼
            </button>
            {isHoveringAccount && (
              <div className="dropdown-menu">
                {!user ? (
                  <>
                    <Link to="/signin" className="dropdown-item">
                      Sign In
                    </Link>
                    <Link to="/signup" className="dropdown-item">
                      Sign Up
                    </Link>
                  </>
                ) : (
                  <>
                    <Link to="/youraccount" className="dropdown-item">
                      Your Account
                    </Link>
                    <Link onClick={handleSignOut} className="dropdown-item">
                      Sign Out
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <Link to="/cart" className="nav-link cart-icon mobile-cart" aria-label="Cart">
            <FaShoppingCart size={18} />
            <span className="cart-count">{cartCount}</span>
          </Link>
        </div>

        {/* Desktop-only utilities (unchanged) */}
        <button
          onClick={() => setLocationOpen(true)}
          className="delivery-btn desktop-only"
        >
          🚚 Delivering to{" "}
          {locationText === "Choose Location" ? "" : locationText}
        </button>

        <div className="search-wrapper desktop-only">
          <SearchBar />
        </div>

        <div className="right-section desktop-nav">

  {/* ✅ Desktop account dropdown */}
  <div
    className="account-dropdown desktop-account"
    onMouseEnter={() => setIsHoveringAccount(true)}
    onMouseLeave={() => setIsHoveringAccount(false)}
  >
    <button className="account-label">
      Hello, {user ? user.displayName || user.email : "Sign In"} ▼
    </button>
    {isHoveringAccount && (
      <div className="dropdown-menu">
        {!user ? (
          <>
            <Link to="/signin" className="dropdown-item">Sign In</Link>
            <Link to="/signup" className="dropdown-item">Sign Up</Link>
          </>
        ) : (
          <>
            <Link to="/youraccount" className="dropdown-item">Your Account</Link>
            <Link onClick={handleSignOut} className="dropdown-item">Sign Out</Link>
          </>
        )}
      </div>
    )}
  </div>

          <Link to="/cart" className="nav-link cart-icon" aria-label="Cart desktop">
            <FaShoppingCart size={18} />
            <span className="cart-count">{cartCount}</span>
          </Link>
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/products" className="nav-link">
            Products
          </Link>
        </div>
      </div>

      {/* MOBILE SEARCH OVERLAY */}
      {mobileSearchOpen && (
        <div className="mobile-search-overlay" role="dialog" aria-modal="true">
          <div className="mobile-search-box">
            <SearchBar onSelect={() => setMobileSearchOpen(false)} />
            <button
              className="close-search-btn"
              aria-label="Close search"
              onClick={() => setMobileSearchOpen(false)}
            >
              <FaTimes size={22} />
            </button>
          </div>
        </div>
      )}

      {/* MOBILE MENU DRAWER */}
      {mobileMenuOpen && (
        <div className="mobile-menu-overlay" role="dialog" aria-modal="true">
          <div className="mobile-menu">
            <button
              className="close-btn"
              aria-label="Close menu"
              onClick={() => setMobileMenuOpen(false)}
            >
              <FaTimes size={22} />
            </button>

            {/* Title as requested */}
            <h3 className="mobile-menu-title">Menu</h3>

            <nav className="mobile-nav-links">
              <Link to="/" onClick={() => setMobileMenuOpen(false)}>
                Home
              </Link>
              <Link to="/products" onClick={() => setMobileMenuOpen(false)}>
                Products
              </Link>
              <Link to="/cart" onClick={() => setMobileMenuOpen(false)}>
                Cart ({cartCount})
              </Link>
            </nav>

            <div className="mobile-account">
              {user ? (
                <>
                  <Link
                    to="/youraccount"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Your Account
                  </Link>
                  <button onClick={handleSignOut}>Sign Out</button>
                </>
              ) : (
                <>
                  <Link to="/signin" onClick={() => setMobileMenuOpen(false)}>
                    Sign In
                  </Link>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Location Popup (unchanged) */}
      {locationOpen && (
        <LocationPopup onClose={() => setLocationOpen(false)} />
      )}
    </header>
  );
}
