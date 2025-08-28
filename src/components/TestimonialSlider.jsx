// src/components/TestimonialSlider.jsx
import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { db } from "../firebase";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/TestimonialSlider.css";
import { collection, query, where, orderBy, limit, getDocs, onSnapshot } from "firebase/firestore";

export default function TestimonialSlider() {
  const [tests, setTests] = useState([]);

useEffect(() => {
  async function load() {
    try {
      const q = query(
        collection(db, "testimonials"),
        where("published", "==", true),     // ✅ only allowed docs
        orderBy("createdAt", "desc"),
        limit(20)
      );
      const snap = await getDocs(q);
      setTests(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    } catch (err) {
      console.error("Testimonials load error:", err);
    }
  }
  load();
}, []);

  const settings = {
    dots: true,
    infinite: true,
    slidesToShow: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
  };

  if (!tests.length)
    return <div className="text-center p-8">Loading testimonials…</div>;

  return (
    <div className="testimonial-slider">
      <h2 className="section-title">Happy Moms, Happy Stories</h2>
      <Slider {...settings}>
        {tests.map((t) => (
          <div key={t.id} className="testimonial-card">
            <div>
              <p>“{t.feedback}”</p>
              <h4>– {t.name}</h4>
              <h4>– {t.city}</h4>
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}
