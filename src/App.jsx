import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ComingSoon from './components/ComingSoon';
import Achievements from './pages/Achievements';
import Admin from './pages/Admin';
import Silk from './components/Silk';

function App() {
  return (
    <Router>
      <div className="app-background">
        <Silk
          speed={3.7}
          scale={1}
          color="#022e5223"
          noiseIntensity={1.3}
          rotation={0}
        />
      </div>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<ComingSoon title="Our Team" />} />
          <Route path="/drones" element={<ComingSoon title="Our Drones" />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/about" element={<ComingSoon title="About Us" />} />
          <Route path="/sponsors" element={<ComingSoon title="Sponsors" />} />
          <Route path="/gallery" element={<ComingSoon title="Gallery" />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
