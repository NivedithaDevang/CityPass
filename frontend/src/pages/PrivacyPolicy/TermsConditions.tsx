import "./LegalPage.css";
import Navbar from "../../components/Navbar/Navbar";
function TermsConditions() {
  return (
    <>
<Navbar />
      <div className="legal-page">
        <div className="legal-header">
          <h1>Terms & Conditions</h1>
          <p>Last updated: September 2026</p>
        </div>

        <div className="legal-layout">
          {/* Quick Section Navigation */}
          <aside className="legal-sidebar">
            <a href="#acceptance" className="legal-nav-link">
              1. Acceptance of Terms
            </a>
            <a href="#account" className="legal-nav-link">
              2. Account & Eligibility
            </a>
            <a href="#ticketing" className="legal-nav-link">
              3. Ticket Booking & Payments
            </a>
            <a href="#cancellations" className="legal-nav-link">
              4. Cancellations & Refunds
            </a>
            <a href="#organisers" className="legal-nav-link">
              5. Organiser Guidelines
            </a>
            <a href="#liability" className="legal-nav-link">
              6. Limitation of Liability
            </a>
          </aside>

          {/* Policy Text */}
          <article className="legal-content">
            <section id="acceptance" className="legal-section">
              <h2>1. Acceptance of Terms</h2>
              <p>
                By registering, accessing, or booking tickets through CityPass,
                you agree to comply with and be bound by these Terms & Conditions.
                If you do not agree to these terms, please discontinue using the
                platform immediately.
              </p>
            </section>

            <section id="account" className="legal-section">
              <h2>2. Account & Eligibility</h2>
              <p>
                To book tickets or host events, you must provide accurate, current,
                and complete registration information. You are responsible for
                safeguarding your password and account credentials.
              </p>
              <ul>
                <li>You must be at least 18 years old or access under supervision.</li>
                <li>Accounts cannot be transferred or sold to third parties.</li>
                <li>CityPass reserves the right to deactivate accounts violating terms.</li>
              </ul>
            </section>

            <section id="ticketing" className="legal-section">
              <h2>3. Ticket Booking & Payments</h2>
              <p>
                All ticket prices, dates, times, and venue locations are set directly
                by the respective event organisers. CityPass serves as the verified
                ticketing intermediary.
              </p>
              <p>
                Once payment is confirmed, tickets are sent digitally to your account
                and registered email address.
              </p>
            </section>

            <section id="cancellations" className="legal-section">
              <h2>4. Cancellations & Refunds</h2>
              <p>
                Refund and cancellation eligibility depends on the specific policy
                selected by the event organiser:
              </p>
              <ul>
                <li>If an event is cancelled by the organiser, full refunds are issued automatically.</li>
                <li>Convenience fees and booking charges are non-refundable unless required by law.</li>
                <li>Ticket transfers are subject to organiser venue rules at the door.</li>
              </ul>
            </section>

            <section id="organisers" className="legal-section">
              <h2>5. Organiser Guidelines</h2>
              <p>
                Users who apply and are approved to host events on CityPass must
                ensure that all event listings, images, and descriptions are
                accurate and compliant with local municipal and venue regulations.
              </p>
            </section>

            <section id="liability" className="legal-section">
              <h2>6. Limitation of Liability</h2>
              <p>
                CityPass is not liable for personal damages, injuries, or venue
                disputes occurring at physical event locations. Organisers assume
                full operational responsibility for the execution and safety of their events.
              </p>
            </section>
          </article>
        </div>
      </div>
    </>
  );
}

export default TermsConditions;