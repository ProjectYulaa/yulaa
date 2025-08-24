import Header from "../components/Header";
import Footer from "../components/Footer";
import "../styles/PrivacyPolicy.css";

export default function PrivacyPolicy() {
  return (
    <>
      <Header />
            <div className="page-title">
           <h1 >Privacy Policy</h1>
          <p>
            At Yulaa, your privacy is a top priority. This Privacy Policy
            outlines how we collect, use, and protect your personal information.
            By using our website, you consent to the practices described here.
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
      <div className="privacy-policy">
      <main >
        <div >
          <section>
            <h2>Information We Collect</h2>
            <ul>
              <li>Personal details (name, email, address, phone)</li>
              <li>Payment and transaction information</li>
              <li>Device and browser information</li>
              <li>Browsing behavior on our site</li>
            </ul>
          </section>

          <section>
            <h2 >
              How We Use Your Information
            </h2>
            <ul >
              <li>To process orders and provide customer support</li>
              <li>To personalize your experience on our website</li>
              <li>To send updates, offers, and promotional content</li>
              <li>To analyze site performance and improve services</li>
            </ul>
          </section>

          <section>
            <h2 >Data Protection</h2>
            <p>
              We implement robust security measures to safeguard your data. All
              payment transactions are encrypted and processed through secure
              gateways.
            </p>
          </section>

          <section>
            <h2 >Third-Party Sharing</h2>
            <p >
              We never sell your information. We may share it with trusted
              partners solely to provide our services (e.g., delivery partners,
              payment processors).
            </p>
          </section>

          <section>
            <h2 >Your Choices</h2>
            <ul >
              <li>
                Update or delete your information via your account settings
              </li>
              <li>Unsubscribe from promotional emails anytime</li>
              <li>Request access to your stored data</li>
            </ul>
          </section>

          <p>
            For questions or concerns, contact us at{" "}
            <strong>myyulaa@gmail.com</strong>
          </p>
        </div>
      </main> </div>
      <Footer />
   </>
  );
}
