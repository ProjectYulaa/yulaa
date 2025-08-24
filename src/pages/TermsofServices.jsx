import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/TermsOfServices.css";


const TermsOfService = () => {
  return (
    <>
      <Header />
        <div className="page-title">
         <h1>Terms of Service</h1>
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
          onClick={() => navigate("/products")}>
            ← Back to Products
          </button>
      </div>
      <div className="terms-container">
      <main>
        <div>
          <section>
            <h2 >
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Yulaa, you agree to be bound by these Terms
              of Service. If you do not agree to these terms, please do not use
              our website.
            </p>
          </section>

          <section >
            <h2>2. Use of the Site</h2>
            <p>
              You agree to use this site only for lawful purposes. You must not
              use the website in any way that breaches any applicable local,
              national, or international law or regulation.
            </p>
          </section>

          <section>
            <h2>
              3. Intellectual Property
            </h2>
            <p>
              All content, designs, graphics, and other materials on this site
              are the intellectual property of Yulaa and are protected by
              copyright and trademark laws. You may not use any of these without
              prior written permission.
            </p>
          </section>

          <section>
            <h2 >
              4. Limitation of Liability
            </h2>
            <p>
              Yulaa will not be liable for any indirect, incidental, special,
              consequential or punitive damages resulting from your use or
              inability to use our services.
            </p>
          </section>

          <section >
            <h2 >5. Changes to Terms</h2>
            <p>
              We reserve the right to change or update these Terms of Service at
              any time. Your continued use of the website following any changes
              constitutes acceptance of those changes.
            </p>
          </section>

          <section>
            <h2 >6. Contact Us</h2>
            <p>
              For any questions regarding these Terms, please contact us at{" "}
              <a
                href="mailto:support@yulaa.in"
                className="text-blue-600 underline"
              >
                myyualaa@gmail.com
              </a>
              .
            </p>
          </section>
        </div>
      </main>
      </div>
      <Footer />
    </>
  );
};

export default TermsOfService;
