// src/pages/Help.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/Help.css";

const FAQs = [
  { question: "How can I track my order?", answer: "You can track your order status in your account under 'Orders'. Each order has a tracking ID and status updates." },
  { question: "What is the refund policy?", answer: "Refund requests can be made within 5 days of delivery. Refunds are processed after product inspection and confirmation." },
  { question: "What payment methods do you accept?", answer: "We accept Cash on Delivery, Credit/Debit Cards, UPI, and Net Banking for online payments." },
  { question: "How do I return or exchange a product?", answer: "You can initiate a return or exchange request from your order details page within 5 days of delivery." },
  { question: "Can I buy products in bulk?", answer: "Yes! For bulk purchases, please use the chat or contact us with your requirements." },
];

export default function Help() {
  const navigate = useNavigate();

  const handleChatRedirect = () => {
    navigate("/chat"); // Redirect to Chat.jsx page route
  };

  return (
    <>
      <Header />

      <div className="page-title">
         <h1>Help & FAQs</h1>
        <p>
          Every touchpoint — from products to packaging — is filled with thought
          and care.
        </p>
          <button style={{
            marginTop: '0.5rem',
            padding: '0.35rem 0.7rem',
            backgroundColor: '#0073e6',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '0.9rem',
          }}
          onClick={() => navigate("/youraccount")}>
            ← Back to Your Yulaa Account
          </button>
      </div>

      <div className="help-page">

        <section className="faq-section">
          <h2 className="section-title">Frequently Asked Questions</h2>
          {FAQs.map(({ question, answer }, idx) => (
            <div key={idx} className="faq-item">
              <strong>Q: {question}</strong>
              <p>A: {answer}</p>
            </div>
          ))}
        </section>

        <button onClick={handleChatRedirect} className="chat-button">
          Chat Now with an Expert
        </button>
      </div>
      <Footer />
    </>
  );
}
