import { Link } from "react-router-dom";
import "./Footer.css";

export const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <Link to="/" className="footer-brand">CityPass</Link>
        <p>Discover events, activities, and experiences across the city.</p>
        <nav className="footer-links" aria-label="Footer navigation">
          <Link to="/">Home</Link>
          <Link to="/events">Events</Link>
          <Link to="/settings">Settings</Link>
        </nav>
        <small>&copy; {new Date().getFullYear()} CityPass</small>
      </div>
    </footer>
  );
};
