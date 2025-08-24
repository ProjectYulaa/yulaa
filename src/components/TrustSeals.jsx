import React from "react";
import "../styles/TrustSeals.css"; // Make sure this file exists

const TrustSeals = () => {
  return (
    <section className="trust-seals flex flex-col items-center text-center py-6 bg-gray-50 rounded-2xl shadow-sm">
      <h2 className="trust-title">Secure & Trusted Payments</h2>
      <p className="trustseal-title">
        We accept all major payment methods with end-to-end encryption for your
        safety.
      </p>

      <div className="trusticon-title">
        <img
          src="/icons/ssl.svg"
          alt="Secure SSL"
          title="Secure SSL"
          className="trust-icon"
        />
        <img
          src="/icons/visa.svg"
          alt="Visa"
          title="Visa"
          className="trust-icon"
        />
        <img
          src="/icons/mastercard.svg"
          alt="MasterCard"
          title="MasterCard"
          className="trust-icon"
        />
        <img
          src="/icons/upi.svg"
          alt="UPI"
          title="UPI"
          className="trust-icon"
        />
        <img
          src="/icons/razorpay.svg"
          alt="Razorpay"
          title="Razorpay"
          className="trust-icon"
        />
        <img
          src="/icons/paypal.svg"
          alt="PayPal"
          title="PayPal"
          className="trust-icon"
        />
        <img
          src="/icons/stripe.svg"
          alt="Stripe"
          title="Stripe"
          className="trust-icon"
        />
        <img
          src="/icons/cod.svg"
          alt="Cash on Delivery"
          title="Cash on Delivery"
          className="trust-icon"
        />
      </div>
    </section>
  );
};

export default TrustSeals;
