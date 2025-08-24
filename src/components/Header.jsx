import React, { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { FaShoppingCart } from "react-icons/fa";
import SearchBar from "./SearchBar";
import LocationPopup from "./LocationPopup";
import "../styles/Header.css";
import { CartContext } from "../contexts/CartContext";

export default function Header() {
  const { user } = useContext(AuthContext);
  const { cartCount } = useContext(CartContext);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationText, setLocationText] = useState("Choose Location");
  const [deliveryAvailable, setDeliveryAvailable] = useState(true);
  const [isHoveringAccount, setIsHoveringAccount] = useState(false);

  const handleDropdownEnter = () => setIsHoveringAccount(true);
  const handleDropdownLeave = () => setIsHoveringAccount(false);

  const navigate = useNavigate();

  // Location + delivery check
  useEffect(() => {
    const location = JSON.parse(localStorage.getItem("deliveryPincode"));
    if (location) {
      setLocationText(`${location.city}, ${location.state} - ${location.pincode}`);
      setDeliveryAvailable(location.deliveryAvailable);
    }
  }, [locationOpen]);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate("/");
  };

  // 👇 Sticky header logic
  useEffect(() => {
    const header = document.querySelector(".header-container");

    const handleScroll = () => {
      if (window.scrollY > 50) {
        header.classList.add("sticky");
        document.body.style.paddingTop = header.offsetHeight + "px"; // prevent overlap
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
      {/* ========== Extreme TOP ROW ========== */}
      <div className="header-top-row">
        <p className="header-top-text">
          Free Delivery on orders over ₹999 & 10% off
        </p>
      </div>

      {/* ========== TOP ROW ========== */}
      <div className="header-top">
        <div className="left-section">
          <Link to="/" className="logo">
            Yulaa
          </Link>
        </div>

        <div>
          <SearchBar />
        </div>

        <div className="right-section">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/products" className="nav-link">
            Products
          </Link>
          <Link to="/cart" className="nav-link cart-icon">
            <FaShoppingCart size={18} />
            <span className="cart-count">{cartCount}</span>
          </Link>
        </div>
      </div>

      {/* ========== BOTTOM ROW ========== */}
      <div className="header-bottom">
        <button onClick={() => setLocationOpen(true)} className="delivery-btn">
          🚚 Delivering to{" "}
          {locationText === "Choose Location" ? "" : locationText}
        </button>
        <div
          className="account-dropdown"
          onMouseEnter={handleDropdownEnter}
          onMouseLeave={handleDropdownLeave}
        >
          <button className="account-label">
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
      </div>

      {locationOpen && <LocationPopup onClose={() => setLocationOpen(false)} />}
    </header>
  );
}
