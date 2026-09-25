import "./LegalPage.css";
import Navbar from "../../components/Navbar/Navbar";

function PrivacyPolicy() {
  return (
    <>
<Navbar />
      <div className="legal-page">
        <div className="legal-header">
          <h1>Privacy Policy</h1>
          <p>Last updated: September 2026</p>
        </div>

        <div className="legal-layout">
          {/* Quick Section Navigation */}
          <aside className="legal-sidebar">
            <a href="#information-collected" className="legal-nav-link">
              1. Information We Collect
            </a>
            <a href="#how-we-use" className="legal-nav-link">
              2. How We Use Data
            </a>
            <a href="#sharing" className="legal-nav-link">
              3. Sharing & Disclosure
            </a>
            <a href="#cookies" className="legal-nav-link">
              4. Cookies & Tracking
            </a>
            <a href="#data-security" className="legal-nav-link">
              5. Data Security & Storage
            </a>
            <a href="#your-rights" className="legal-nav-link">
              6. Your Privacy Rights
            </a>
          </aside>

          {/* Policy Text */}
          <article className="legal-content">
            <section id="information-collected" className="legal-section">
              <h2>1. Information We Collect</h2>
              <p>
                We collect personal information to provide event ticket bookings,
                organizer management tools, and personalized recommendations.
              </p>
              <ul>
                <li><strong>Account Data:</strong> Name, email address, password, phone number, and profile image.</li>
                <li><strong>Booking History:</strong> Events viewed, tickets purchased, and transaction references.</li>
                <li><strong>Device & Usage Data:</strong> IP address, browser type, and interaction logs.</li>
              </ul>
            </section>

            <section id="how-we-use" className="legal-section">
              <h2>2. How We Use Data</h2>
              <p>
                Your information is used strictly to fulfill ticket orders, communicate
                schedule updates or cancellations, and safeguard against unauthorized access.
              </p>
            </section>

            <section id="sharing" className="legal-section">
              <h2>3. Sharing & Disclosure</h2>
              <p>
                We share essential ticket and attendee details (such as attendee names)
                with event organisers solely for guest list check-in at the venue.
                We do not sell your personal data to marketing third parties.
              </p>
            </section>

            <section id="cookies" className="legal-section">
              <h2>4. Cookies & Session Management</h2>
              <p>
                We use secure, HTTP-only cookies to keep you signed in and remember your
                session preferences while exploring cities and checking out tickets.
              </p>
            </section>

            <section id="data-security" className="legal-section">
              <h2>5. Data Security & Storage</h2>
              <p>
                We maintain industry-standard encrypted storage and secure transmission
                protocols (SSL/TLS) for account records and sensitive transactions.
              </p>
            </section>

            <section id="your-rights" className="legal-section">
              <h2>6. Your Privacy Rights</h2>
              <p>
                You can review or update your profile details anytime via your Account
                Settings. You may also deactivate your account or request data removal
                by using the Settings menu or contacting support.
              </p>
            </section>
          </article>
        </div>
      </div>
    </>
  );
}

export default PrivacyPolicy;