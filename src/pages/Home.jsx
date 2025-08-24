// src/pages/Home.jsx
import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "../components/Header";
import About from "../components/About";
import ContactSection from "../components/ContactSections";
import TrustSeals from "../components/TrustSeals";
import Footer from "../components/Footer";
import ProductSlider from "../components/ProductSlider";
import TestimonialSlider from "../components/TestimonialSlider";
import "../styles/Home.css";
import UniversalSlider from "../components/UniversalSlider";
import heroSlides from "../data/heroslides";

export default function Home() {
  useEffect(() => {
    const sections = document.querySelectorAll(".scroll-fade");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target); // Animate only once
          }
        });
      },
      { threshold: 0.2 }
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);


  return (
    <>
    <div className= "page-fade ">
      <Header />
    <div>
      {/* ✅ Just one-liner */}
      <UniversalSlider slides={heroSlides} type="hero" />
    </div>
    <main>        
      <section >
          <About/>
        </section>
        </main>
    <div className="home-image-section">
      <Link to="/products" className="image-card">
        <img src="/assets/home-image1.PNG" alt="Shop Now 1" />
      </Link>
      <Link to="/products" className="image-card">
        <img src="/assets/home-image2.PNG" alt="Shop Now 2" />
      </Link>
      <Link to="/products" className="image-card">
        <img src="/assets/home-image3.PNG" alt="Shop Now 3" />
      </Link>
    </div>
      <main>
        <section>
          <ProductSlider />
        </section>
        <section >
          <TestimonialSlider />
        </section>
        <section >
          <ContactSection />
        </section>
        <section >
          <TrustSeals />
        </section>
      </main>
      <Footer />
      </div>
    </>
  );
}
