'use client';

import { useState } from 'react';
import Navbar from './components/layout/Navbar';
import Hero from './components/sections/Hero';
import Features from './components/sections/Features';
import CTA from './components/sections/CTA';
import Footer from './components/sections/Footer';
import AccountTypeModal from './components/ui/AccountTypeModal';

export default function Home() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleGetStarted = () => {
    setIsModalOpen(true);
  };

  const handleAccountSelect = (type: 'professor' | 'student') => {
    // Modal handles the redirect, this is just for any additional logic
    console.log('Selected account type:', type);
  };

  return (
    <main className="min-h-screen">
      <Navbar onGetStarted={handleGetStarted} />
      <Hero onGetStarted={handleGetStarted} />
      <Features />
      <CTA />
      <Footer />
      <AccountTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={handleAccountSelect}
      />
    </main>
  );
}
