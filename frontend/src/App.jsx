import React from 'react';
import Hero from './components/Hero';
import TestWorkflow from './components/TestWorkflow';
import Navbar from './components/Navbar';
import './App.css';

function App() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white safe-area-inset">
      <Navbar />
      <main className="pb-8 sm:pb-12">
        <Hero />
        <TestWorkflow />
      </main>
    </div>
  );
}

export default App;
