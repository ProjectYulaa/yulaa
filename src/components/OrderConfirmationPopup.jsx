// components/OrderConfirmationPopup.jsx
import React from 'react';
import '../styles/OrderConfirmationPopup.css'; // use external CSS
import { FaStar } from "react-icons/fa";

const OrderConfirmationPopup = ({ cartItems,defaultAddress, paymentMethod, onClose, onConfirm }) => {

 if (!cartItems || cartItems.length === 0) {
  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <h3>No Items in Cart</h3>
        <p>Your cart appears to be empty. Please add items to place an order.</p>
        <div className="popup-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <div className="popup-overlay">
      <div className="popup-box">
        <h3>Review Your Order</h3>
        
        <div>
          <strong>Delivery/Billing Address</strong>
        {defaultAddress ? (<>
              <p>{defaultAddress.name}</p> 
                <p>{defaultAddress.town},{" "}
                {defaultAddress.city}, {defaultAddress.state} -{" "}
                {defaultAddress.pincode},
              </p>
              <p> {defaultAddress.fulladdress}</p>
              <p>{defaultAddress.phone} </p></>
        ) : (
          <p>No default address set.</p>
        )}
        </div>
<div className="popup-content-grid">
  {/* LEFT: Cart Items */}
  <div className="order-items">
    {cartItems.map((item) => (
      <div className="cart-item" key={item.id}>
        <img src={item.image} alt={item.name} className="item-image" />
        <div className="item-details">
          <h2>{item.name}</h2>
          <div className="stars">
            {[...Array(5)].map((_, i) => (
              <FaStar
                key={i}
                color={i < item.rating ? "#FFD700" : "#ccc"}
              />
            ))}
          </div>
          <p className="price">₹{item.price}</p>
          <p className="quantity">Qty: {item.quantity}</p>
        </div>
      </div>
    ))}
  </div>

  {/* RIGHT: Summary */}
  <div className="cart-summary">
    <h2>Price Details</h2>
    <p>Total Items: {cartItems.length}</p>
    <p>Subtotal: ₹{total}</p>

    {total >= 999 ? (
      <>
        <p className="free-delivery success">✅ Your order qualify for Free Delivery!</p>
        <p className="extra-discount success">🎉 Extra 10% Discount will be applied at checkout!</p>
      </>
    ) : total >= 499 ? (
      <p className="free-delivery success">✅ You qualify for Free Delivery!</p>
    ) : (
      <p className="delivery-charge warning">
        🚚 Orders below ₹499 incur ₹59 delivery charge.
        <br />
        Add ₹{499 - total} more to get Free Delivery.
      </p>
    )}

    {total < 499 && <p>Delivery Charges: ₹59</p>}

    <p className="final-amount">
      Final Amount: ₹
      {total >= 999
        ? (total * 0.9).toFixed(2)
        : total < 499
          ? (total + 59).toFixed(2)
          : total}
    </p>
  </div>
</div>
        <div>
          <strong>Payment Method:</strong>
          <p>{paymentMethod?.type} - {paymentMethod?.detail}</p>
        </div>

        <div className="popup-actions">
          <button onClick={onClose}>Cancel</button>
          <button className="confirm-btn" onClick={onConfirm}>Confirm Order</button>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmationPopup;
