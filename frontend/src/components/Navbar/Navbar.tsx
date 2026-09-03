import { MapPin } from "lucide-react";
import { FaUserCircle } from "react-icons/fa";
import Auth from "../Auth/Auth";
import Sidebar from "../Sidebar/Sidebar";
import "./Navbar.css";
import { useState } from "react";
import type { User } from "../../types/auth";

function Navbar() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(false);

  const handleProfileClick = () => {
    if (!user) {
      setShowAuth(true);
    } else {
      setIsSidebarOpen(true);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("http://localhost:3000/api/logout", {
        method: "POST",
        credentials: "include",
      });
    } finally {
      setUser(null);
      setIsSidebarOpen(false);
    }
  };

  return (
    <>
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

        <button className="profile" onClick={handleProfileClick}>
          <FaUserCircle size={24} />
        </button>

        {/* Auth Modal */}
        {showAuth && (
          <Auth
            onClose={() => setShowAuth(false)}
            onSuccess={(loggedInUser: User) => {
              setUser(loggedInUser);
              setShowAuth(false);
            }}
          />
        )}
      </nav>

      {/* Profile Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        user={user}
        onLogout={handleLogout}
      />
    </>
  );
}

export default Navbar;