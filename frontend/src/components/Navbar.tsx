import { MapPin, User } from "lucide-react";
import "../../styles/Navbar.css";

function Navbar() {
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

      <button className="profile">
        <User size={20} />
      </button>
    </nav>
  );
}

export default Navbar;