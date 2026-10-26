
import CategorySection from "../../components/CategorySection/CategorySection";
import Hero from "../../components/Hero/Hero";
import EventSection from "../../components/EventSection/EventSection";
import CitySection from "../../components/CitySection/CitySection";
import HostEvent from "../../components/HostEvent/HostEvent";
import "./Home.css"
function Home() {
  return (
    <div style={{ position: "relative" }}>


        <Hero />
            <CitySection />
        <CategorySection />
        <EventSection />
        <HostEvent />

</div>  );
}

export default Home;