import React from 'react';
import { Link } from 'react-router-dom';
import {
  Leaf,
  ArrowRight,
  Check,
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Home,
  LayoutDashboard,
  ShoppingCart,
  Info,
  MessageSquare,
  Recycle,
  Factory,
  Smartphone,
  Award,
  Users,
  ExternalLink
} from 'lucide-react';

const Footer: React.FC = () => {
  const quickLinks = [
    { name: 'Home', link: '/', icon: Home },
    { name: 'Dashboard', link: '/dashboard', icon: LayoutDashboard },
    { name: 'Marketplace', link: '/marketplace', icon: ShoppingCart },
    { name: 'About Us', link: '/about', icon: Info },
    { name: 'Contact', link: '/contact', icon: MessageSquare },
  ];

  const services = [
    { name: 'Waste Collection', icon: Recycle },
    { name: 'Recycling Process', icon: Recycle },
    { name: 'EcoToken Rewards', icon: Award },
    { name: 'Factory Partnerships', icon: Factory },
    { name: 'Mobile Application', icon: Smartphone },
    { name: 'Community Programs', icon: Users },
  ];

  const socialLinks = [
    { name: 'Facebook', icon: Facebook, href: '#', color: 'hover:text-blue-600' },
    { name: 'Twitter', icon: Twitter, href: '#', color: 'hover:text-blue-400' },
    { name: 'Instagram', icon: Instagram, href: '#', color: 'hover:text-pink-500' },
    { name: 'LinkedIn', icon: Linkedin, href: '#', color: 'hover:text-blue-700' },
  ];

  return (
    <footer className="bg-gradient-to-br from-gray-50 to-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Company Info */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-green-100 rounded-lg">
                <Leaf className="h-8 w-8 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold">
                <span className="bg-gradient-to-r from-green-500 to-blue-400 text-transparent bg-clip-text">
                  EcoChain
                </span>
              </h3>
            </div>
            
            <p className="text-gray-600 mb-6 leading-relaxed">
              Revolutionizing waste management through blockchain technology. 
              Turning today's waste into tomorrow's sustainable products.
            </p>

            {/* Social Links */}
            <div className="mb-6">
              <h5 className="text-sm font-semibold text-gray-800 mb-3">Follow Us</h5>
              <div className="flex gap-3">
                {socialLinks.map(({ name, icon: Icon, href, color }) => (
                  <a
                    key={name}
                    href={href}
                    className={`p-2 rounded-lg bg-gray-100 text-gray-600 ${color} transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
                    aria-label={name}
                    title={name}
                  >
                    <Icon size={18} />
                  </a>
                ))}
              </div>
            </div>

            {/* Stats or Awards */}
            
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <ArrowRight size={18} className="text-green-500" />
              Quick Links
            </h4>
            <nav>
              <ul className="space-y-3">
                {quickLinks.map(({ name, link, icon: Icon }) => (
                  <li key={name}>
                    <Link
                      to={link}
                      className="flex items-center gap-3 text-gray-600 hover:text-green-600 transition-colors duration-200 group focus:outline-none focus:text-green-600"
                    >
                      <Icon size={16} className="text-gray-400 group-hover:text-green-500 transition-colors" />
                      <span className="group-hover:translate-x-1 transition-transform duration-200">
                        {name}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Services */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Check size={18} className="text-green-500" />
              Our Services
            </h4>
            <ul className="space-y-3">
              {services.map(({ name, icon: Icon }) => (
                <li key={name} className="flex items-center gap-3 text-gray-600 group">
                  <div className="p-1 rounded bg-green-100 group-hover:bg-green-200 transition-colors">
                    <Icon size={14} className="text-green-600" />
                  </div>
                  <span className="group-hover:text-green-600 transition-colors duration-200">
                    {name}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info & Newsletter */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare size={18} className="text-green-500" />
              Get In Touch
            </h4>
            
            {/* Contact Details */}
            <ul className="space-y-4 mb-8">
              <li className="flex items-start gap-3 text-gray-600">
                <MapPin size={18} className="text-green-500 mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">Address</div>
                  <div className="text-sm">123 Green Street<br />Eco City, EC 12345</div>
                </div>
              </li>
              
              <li className="flex items-center gap-3 text-gray-600">
                <Phone size={18} className="text-green-500 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">Phone</div>
                  <a href="tel:+11234567890" className="text-sm hover:text-green-600 transition-colors">
                    +1 (123) 456-7890
                  </a>
                </div>
              </li>
              
              <li className="flex items-center gap-3 text-gray-600">
                <Mail size={18} className="text-green-500 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">Email</div>
                  <a href="mailto:info@ecochain.com" className="text-sm hover:text-green-600 transition-colors">
                    info@ecochain.com
                  </a>
                </div>
              </li>
              
              <li className="flex items-center gap-3 text-gray-600">
                <Clock size={18} className="text-green-500 flex-shrink-0" />
                <div>
                  <div className="font-medium text-gray-800">Hours</div>
                  <div className="text-sm">Mon-Fri: 9AM - 6PM</div>
                </div>
              </li>
            </ul>

          </div>
            
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 ">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
            {/* Copyright */}
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <p>&copy; {new Date().getFullYear()} EcoChain. All rights reserved.</p>
              <div className="hidden lg:flex items-center gap-2 text-green-600">
                <Leaf size={14} />
                <span className="text-xs">Powered by sustainable technology</span>
              </div>
            </div>

            {/* Legal Links */}
            <nav className="flex flex-wrap justify-center gap-6 text-sm">
              {[
                'Privacy Policy',
                'Terms of Service',
                'Cookie Policy',
                'Sustainability Report'
              ].map((item) => (
                <a
                  key={item}
                  href="#"
                  className="text-gray-600 hover:text-green-600 transition-colors duration-200 flex items-center gap-1 group focus:outline-none focus:text-green-600"
                >
                  <span>{item}</span>
                  <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;