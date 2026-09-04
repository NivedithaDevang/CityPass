import Navbar from "../components/Navbar/Navbar";
import Hero from "../components/Hero/Hero";
import CategorySection from "../components/CategorySection/CategorySection";
import EventSection from "../components/EventSection/EventSection";
import CitySection from "../components/CitySection/CitySection";
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

    </>
  );
}

export default Home;