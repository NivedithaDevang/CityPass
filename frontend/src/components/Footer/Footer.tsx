import { Link } from "react-router-dom";
import "./Footer.css";

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-top-accent" />
      
      <div className="footer-container">
        <div className="footer-grid">
          <div className="footer-col brand-col">
            <Link to="/" className="footer-brand">
              CityPass<span className="brand-dot">.</span>
            </Link>
            <p className="footer-tagline">
              Your gateway to live concerts, comedy specials, pop-up events, and unforgettable experiences across your city.
            </p>
            
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Discover</h4>
            <ul className="footer-nav-list">
              <li><Link to="/events">All Events</Link></li>
              <li><Link to="/events?category=Music">Concerts & Gigs</Link></li>
              <li><Link to="/events?category=Comedy">Standup Comedy</Link></li>
              <li><Link to="/events?category=Food">Food & Pop-ups</Link></li>
              <li><Link to="/events?category=Sports">Sports & Fitness</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4 className="footer-heading">Company</h4>
            <ul className="footer-nav-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/events">Explore Cities</Link></li>
              <li><Link to="/settings">Host an Event</Link></li>
              <li><Link to="/settings">My Account</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} CityPass Technologies Inc. All rights reserved.</p>
         
        </div>
      </div>
    </footer>
  );
};