import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactSection from "../components/ContactSections";
import "../styles/PAbout.css";

const About = () => {
  return (
    <div className="about-page">
      <Header />
      <main className="about-main">
        {/* Our Story */}
        <section className="about-section">
          <div className="about-content">
            <img
              src="/images/about/our-story.png"
              alt="Our Story"
              className="about-img"
            />
            <div className="about-text">
              <h2>Our Story</h2>
              <p>
                At Yulaa, we believe motherhood is not just a phase – it’s a
                transformation, a celebration, and a quiet revolution. Born from
                love, research, and real conversations with mothers, Yulaa is
                here to simplify and beautify pregnancy — one trimester at a
                time.
                <br />
                <br />
                We offer thoughtfully curated care kits, expert-backed products,
                and supportive content designed to gently guide moms through
                pregnancy and early motherhood. Whether it’s the first
                trimester’s morning nausea or the third trimester’s emotional
                overwhelm, Yulaa is built to say: “You’re not alone. We’re right
                here.”
              </p>
            </div>
          </div>
        </section>

        {/* About Our Founder */}
        <section className="about-section reverse">
          <div className="about-content">
            <img
              src="/images/about/founder.png"
              alt="Our Founder"
              className="about-img"
            />
            <div className="about-text">
              <h2>About Our Founder</h2>
              <blockquote>
                “I started Yulaa because I couldn’t find a space that felt like
                home during my pregnancy. Everything was either too clinical or
                too commercial. I wanted a space where moms are heard, not just
                sold to.” — Our CEO
              </blockquote>
              <p>
                Her vision is to create a world where no woman feels alone
                during pregnancy. A brand that brings warmth, dignity, and
                emotional support into every box, every message, every moment.
              </p>
            </div>
          </div>
        </section>

        {/* Our Values */}
        <section className="values-section">
          <h1 className="section-title">Our Values-YULAA</h1>
          <div className="values-grid">
            <div className="value-card">
              <h3>
                Y – <strong>You</strong>
              </h3>
              <p>
                Everything begins with you. Our care is built around the real
                needs of mothers.
              </p>
            </div>
            <div className="value-card">
              <h3>
                U – <strong>Understanding</strong>
              </h3>
              <p>
                We listen before we speak, always honoring real stories over
                assumptions.
              </p>
            </div>
            <div className="value-card">
              <h3>
                L – <strong>Love</strong>
              </h3>
              <p>
                Every touchpoint — from products to packaging — is filled with
                thought and care.
              </p>
            </div>
            <div className="value-card">
              <h3>
                A – <strong>Authentic</strong>
              </h3>
              <p>We keep it real, transparent, and grounded in trust.</p>
            </div>
            <div className="value-card">
              <h3>
                A – <strong>Affirming</strong>
              </h3>
              <p>
                We uplift and celebrate moms, through every emotion, every
                trimester, every step.
              </p>
            </div>
          </div>
        </section>

        {/* Why Happy Moms */}
        <section className="about-section">
          <div className="about-content">
            <img
              src="/images/about/happy-moms.png"
              alt="Happy Moms"
              className="about-img"
            />
            <div className="about-text">
              <h2>Why Happy Moms</h2>
              <p>
                Becoming a mother for the first time isn’t just a biological
                shift — it’s an emotional earthquake. You’re building a life
                inside while trying to hold your own life together. Yulaa is
                here to make that journey softer.
                <br />
                <br />
                We don’t promise to make pregnancy perfect. But we do promise to
                make it kinder. Because when a mom feels happy and supported,
                the magic flows to her baby and beyond.
              </p>
            </div>
          </div>
        </section>

        {/* Contact Us */}
        <section>
          <h2 className="section-title text-center">Contact Us</h2>
          <ContactSection />
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
