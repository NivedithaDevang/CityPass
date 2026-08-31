import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import CategorySection from "../components/CategorySection";
import EventSection from "../components/EventSection";
import CitySection from "../components/CitySection";
import Footer from "../components/Footer";

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
        <CategorySection />
        <EventSection />
        <CitySection />
      </main>

      <Footer />
    </>
  );
}

export default Home;