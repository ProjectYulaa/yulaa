
// main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext'; // ✅ named import
import { BuyNowProvider } from './contexts/BuyNowContext'; // ✅ Correct path and import

// External styles for Slick Slider
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";


ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>
      <CartProvider>
        <BuyNowProvider>
          <App />
        </BuyNowProvider>
      </CartProvider>
    </AuthProvider>
  </BrowserRouter>
);
