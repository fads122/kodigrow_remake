'use client';

import { useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Button from '../ui/Button';
import AccountTypeModal from '../ui/AccountTypeModal';

interface NavbarProps {
  onGetStarted?: () => void;
}

const Navbar = ({ onGetStarted }: NavbarProps) => {
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const navLinks = [
    { name: 'Features', href: '#features' },
    { name: 'About', href: '#about' },
    { name: 'Pricing', href: '#pricing' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
      className="absolute top-0 left-0 right-0 z-50 bg-transparent"
    >
      <div className="flex items-center justify-between bg-transparent w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {/* Logo */}
        <motion.a
          href="/"
          className="flex items-center"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Image
            src="/kodi.png"
            alt="KodiGrow logo"
            width={200}
            height={60}
            className="object-contain"
            priority
          />
        </motion.a>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6 ml-8">
          {navLinks.map((link, index) => (
            <motion.a
              key={index}
              href={link.href}
              className="text-white hover:text-blue-400 font-medium transition-colors"
              whileHover={{ y: -2 }}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              {link.name}
            </motion.a>
          ))}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-white">
              <button
                onClick={() => router.push('/login')}
                className="hover:text-blue-400 font-medium transition-colors"
              >
                Sign In
              </button>
              <span className="text-slate-500">|</span>
              <button
                onClick={() => setIsModalOpen(true)}
                className="hover:text-blue-400 font-medium transition-colors"
              >
                Sign Up
              </button>
            </div>
            <Button variant="primary" size="sm" onClick={onGetStarted}>
              Get Started
            </Button>
          </div>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2 text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800"
          >
            <div className="px-4 py-4 space-y-4">
              {navLinks.map((link, index) => (
                <motion.a
                  key={index}
                  href={link.href}
                  className="block text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  {link.name}
                </motion.a>
              ))}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-center gap-2 text-white py-2">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      router.push('/login');
                    }}
                    className="hover:text-blue-400 font-medium transition-colors"
                  >
                    Sign In
                  </button>
                  <span className="text-slate-500">|</span>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      setIsModalOpen(true);
                    }}
                    className="hover:text-blue-400 font-medium transition-colors"
                  >
                    Sign Up
                  </button>
                </div>
                <Button variant="primary" size="md" className="w-full" onClick={onGetStarted}>
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Account Type Modal */}
      <AccountTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSelect={() => setIsModalOpen(false)}
      />
    </motion.nav>
  );
};

export default Navbar;

