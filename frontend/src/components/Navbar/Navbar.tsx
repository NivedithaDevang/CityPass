import { MapPin } from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import Auth from "../Auth/Auth";
import "./Navbar.css";
import { useState } from "react";
function Navbar() {
  const [showAuth, setShowAuth] = useState(false);

  return (
    <nav className="navbar">
      <div className="navbar-left">
        <h2 className="logo">CityPass</h2>

        <div className="location">
          <MapPin size={18} />
          <span>Bengaluru</span>
        </div>
      </div>

      <div className="navbar-links">
        <a href="#" className="active">
          For You
        </a>

        <a href="#">Events</a>
        <a href="#">Activities</a>
        <a href="#">Concerts</a>
      </div>

        <button className="profile" onClick={() => setShowAuth(true)}>
          <FaUserCircle size={20} />
        </button>

        <div className="profile-menu">
          <a href="/login">Login</a>
          <a href="/register">Register</a>
        </div>

      {showAuth && (
        <Auth onClose={() => setShowAuth(false)} />
      )}
    </nav>
  );
}

export default Navbar;