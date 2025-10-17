import React from 'react';
import Hero from './components/Hero';
import TestWorkflow from './components/TestWorkflow';
import Navbar from './components/Navbar';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <Navbar />
      <Hero />
      <TestWorkflow />
    </div>
  );
}

export default App;
