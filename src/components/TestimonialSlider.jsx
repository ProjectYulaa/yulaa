// src/components/TestimonialSlider.jsx
import React, { useEffect, useState } from "react";
import Slider from "react-slick";
import { db } from "../firebase";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../styles/TestimonialSlider.css";
import { collection, query, where, orderBy, limit, onSnapshot } from "firebase/firestore";

export default function TestimonialSlider() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    const q = query(
      collection(db, "testimonials"),
      where("published", "==", true),       // must be a boolean in Firestore
      orderBy("createdAt", "desc"),         // createdAt should be a Timestamp on all published docs
      limit(20)
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        setTests(rows);
        setLoading(false);
      },
      (error) => {
        console.error("Testimonials load error:", error);
        setErr(error);
        setLoading(false);
      }
    );

    return () => unsub();
  }, []);

  const settings = {
    dots: true,
    infinite: true,
    slidesToShow: 1,
    autoplay: true,
    autoplaySpeed: 5000,
    arrows: false,
  };

  if (loading) {
    return <div className="text-center p-8">Loading testimonials…</div>;
  }

  if (err) {
    return <div className="text-center p-8 text-red-600">Failed to load testimonials.</div>;
  }

  if (tests.length === 0) {
    return <div className="text-center p-8">No testimonials yet.</div>;
  }

  return (
    <div className="testimonial-slider">
      <h2 className="section-title">Happy Moms, Happy Stories</h2>
      <Slider {...settings}>
        {tests.map((t) => (
          <div key={t.id} className="testimonial-card">
            <div>
              <p>“{t.feedback}”</p>
              <h4>– {t.name}</h4>
              {t.city ? <h4>– {t.city}</h4> : null}
            </div>
          </div>
        ))}
      </Slider>
    </div>
  );
}
