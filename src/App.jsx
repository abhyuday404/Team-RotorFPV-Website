import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Achievements from './pages/Achievements';
import Admin from './pages/Admin';
import Gallery from './pages/Gallery';
import Team from './pages/Team';
import Silk from './components/Silk';
import MobileOverlay from './components/MobileOverlay';

function App() {
  return (
    <Router>
      {false && <MobileOverlay />}
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
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/team" element={<Team />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
