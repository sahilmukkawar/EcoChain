import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => {
  return (
    <footer className="mt-auto bg-gradient-to-r from-blue-900 to-green-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 py-12">
          {/* Company Info */}
          <div className="footer-section">
            <h3 className="text-2xl font-bold mb-4 flex items-center">
              <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center mr-2">♻️</span>
              EcoChain
            </h3>
            <p className="text-gray-300 mb-4">
              Revolutionizing waste management through blockchain technology. Turning today's waste into tomorrow's products.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label="Facebook">
                <span className="text-xl">📘</span>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label="Twitter">
                <span className="text-xl">🐦</span>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label="Instagram">
                <span className="text-xl">📷</span>
              </a>
              <a href="#" className="text-gray-300 hover:text-white transition-colors" aria-label="LinkedIn">
                <span className="text-xl">👔</span>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="footer-section">
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-700">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">🏠</span> Home
                </Link>
              </li>
              <li>
                <Link to="/dashboard" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">📊</span> Dashboard
                </Link>
              </li>
              <li>
                <Link to="/marketplace" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">🛒</span> Marketplace
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">ℹ️</span> About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">📞</span> Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Services */}
          <div className="footer-section">
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-700">Our Services</h4>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">🚚</span> Waste Collection
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">🔄</span> Recycling
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">🌱</span> Eco-Token Rewards
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">🏭</span> Factory Partnerships
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors flex items-center">
                  <span className="mr-2">📱</span> Mobile App
                </a>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div className="footer-section">
            <h4 className="text-lg font-semibold mb-4 pb-2 border-b border-gray-700">Contact Us</h4>
            <ul className="space-y-3">
              <li className="flex items-start">
                <span className="mr-3 mt-1">📍</span>
                <span className="text-gray-300">123 Green Street, Eco City, EC 12345</span>
              </li>
              <li className="flex items-center">
                <span className="mr-3">📞</span>
                <span className="text-gray-300">+1 (123) 456-7890</span>
              </li>
              <li className="flex items-center">
                <span className="mr-3">✉️</span>
                <span className="text-gray-300">info@ecochain.com</span>
              </li>
              <li className="flex items-center">
                <span className="mr-3">🕒</span>
                <span className="text-gray-300">Mon-Fri: 9AM - 6PM</span>
              </li>
            </ul>
            
            {/* Newsletter Signup */}
            <div className="mt-6">
              <h5 className="text-md font-semibold mb-2">Subscribe to our newsletter</h5>
              <div className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-3 py-2 text-gray-800 rounded-l-lg focus:outline-none w-full"
                />
                <button className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded-r-lg font-semibold transition-colors">
                  Go
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} EcoChain. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
              <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;