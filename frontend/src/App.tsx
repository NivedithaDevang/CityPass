import { BrowserRouter, Routes, Route } from "react-router-dom";

import Home from "./pages/Home/Home";
import Settings from "./pages/Settings/Settings";
import Events from "./pages/Events/Events";
import { Activities } from "./pages/Activities/Activities";
import { Concerts } from "./pages/Concerts/Concerts";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/events" element={<Events />} />
        <Route path="/activities" element={<Activities />} />
        <Route path="/concerts" element={<Concerts />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;