import "./Hero.css";
import { useNavigate } from "react-router-dom";
function Hero() {
  const navigate = useNavigate();
  return (
    <section className="hero">
      <div className="hero-content">
        <p className="hero-tagline">YOUR CITY. YOUR EXPERIENCES.</p>

        <h1>
          Discover what's <br /> happening around you.
        </h1>

        <p className="hero-description">
          Explore events, experiences and unforgettable moments
          happening across your city.
        </p>

        <button className="hero-button"
        onClick={() => navigate("/events")} >
          Explore Events
        </button>
      </div>
    </section>
  );
}

export default Hero;