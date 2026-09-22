import Navbar from "../../components/Navbar/Navbar";
import CategorySection from "../../components/CategorySection/CategorySection";
import Hero from "../../components/Hero/Hero";
import EventSection from "../../components/EventSection/EventSection";
import CitySection from "../../components/CitySection/CitySection";
import HostEvent from "../../components/HostEvent/HostEvent";
import { Footer } from "../../components/Footer/Footer";
function Home() {
  return (
    <>
      <Navbar />

      <main>
        <Hero />
            <CitySection />
        <CategorySection />
        <EventSection />
        <HostEvent />
        <Footer />
      </main>

    </>
  );
}

export default Home;