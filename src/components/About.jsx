// src/components/About.jsx
import React from "react";
import "../styles/About.css";

export default function About() {
  return (
    <section className="about">
      <div className="about-content reverse"></div>
      <img
        src="/images/about/aboutyulaa.png"
        alt="About Yulaa"
        className="about-img"
      />
      <div className="about__text">
        <h1>About Yulaa</h1>
        <p>
          Yulaa is more than a brand — it's a movement of mindful motherhood.
          Our products are designed to ease your journey through natural and
          research-backed care. From nausea relief to gentle teas, we support
          your wellness with softness and science.
        </p>
      </div>
    </section>
  );
}
