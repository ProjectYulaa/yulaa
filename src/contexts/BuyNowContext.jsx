// contexts/BuyNowContext.js
import React, { createContext, useContext, useState, useEffect } from "react";

const BuyNowContext = createContext();

export const BuyNowProvider = ({ children }) => {
  const [buyNowProduct, setBuyNowProduct] = useState(null);

  useEffect(() => {
    const savedProduct = localStorage.getItem("buyNowProduct");
    if (savedProduct) {
      setBuyNowProduct(JSON.parse(savedProduct));
    }
  }, []);

  const triggerBuyNow = (product) => {
    setBuyNowProduct(product);
    localStorage.setItem("buyNowProduct", JSON.stringify(product));
  };

  const clearBuyNow = () => {
    setBuyNowProduct(null);
    localStorage.removeItem("buyNowProduct");
  };

  return (
    <BuyNowContext.Provider value={{ buyNowProduct, triggerBuyNow, clearBuyNow }}>
      {children}
    </BuyNowContext.Provider>
  );
};

export const useBuyNow = () => useContext(BuyNowContext);
