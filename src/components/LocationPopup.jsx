import React, { useState } from "react";
import "../styles/LocationPopup.css";

export default function LocationPopup({ onClose }) {
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (pincode.trim().length !== 6 || isNaN(pincode)) {
      alert("Please enter a valid 6-digit pincode.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data = await response.json();

      if (
        data[0].Status === "Success" &&
        data[0].PostOffice &&
        data[0].PostOffice.length > 0
      ) {
        const postOffice = data[0].PostOffice[0];
        const locationInfo = {
          pincode: pincode,
          city: postOffice.District,
          state: postOffice.State,
        };

        // Save in localStorage
        localStorage.setItem("deliveryPincode", JSON.stringify(locationInfo));

        // Optionally: pass to parent (e.g., header) via callback or just reload
        onClose();
      } else {
        alert("Invalid pincode. Please try again.");
      }
    } catch (error) {
      console.error("Error validating pincode:", error);
      alert("Failed to validate pincode. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="location-popup-overlay">
      <div className="location-popup-box">
        <h2>Enter Your Pincode</h2>
        <input
          type="text"
          value={pincode}
          onChange={(e) => setPincode(e.target.value)}
          maxLength={6}
          placeholder="e.g., 110001"
        />
        <div className="popup-buttons">
          <button onClick={handleSave} className="save-btn" disabled={loading}>
            {loading ? "Validating..." : "Save"}
          </button>
          <button onClick={onClose} className="close-btn" disabled={loading}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
