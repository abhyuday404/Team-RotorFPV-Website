import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import ComingSoon from './components/ComingSoon';

function App() {
  return (
    <Router>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/team" element={<ComingSoon title="Our Team" />} />
          <Route path="/drones" element={<ComingSoon title="Our Drones" />} />
          <Route path="/achievements" element={<ComingSoon title="Achievements" />} />
          <Route path="/about" element={<ComingSoon title="About Us" />} />
          <Route path="/sponsors" element={<ComingSoon title="Sponsors" />} />
          <Route path="/gallery" element={<ComingSoon title="Gallery" />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;
