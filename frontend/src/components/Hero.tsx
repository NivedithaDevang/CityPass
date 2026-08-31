import "../../styles/Hero.css";

function Hero() {
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

        <button className="hero-button">
          Explore Events
        </button>
      </div>
    </section>
  );
}

export default Hero;