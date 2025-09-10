import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="App-footer">
      <div className="footer-container">
        <div className="footer-section">
          <h4>EcoChain</h4>
          <p>Revolutionizing waste management through blockchain technology</p>
        </div>
        <div className="footer-section">
          <h4>Quick Links</h4>
          <ul>
            <li><a href="/">Home</a></li>
            <li><a href="/dashboard">Dashboard</a></li>
            <li><a href="/about">About Us</a></li>
            <li><a href="/contact">Contact</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4>Contact Us</h4>
          <p>Email: info@ecochain.com</p>
          <p>Phone: +1 (123) 456-7890</p>
        </div>
      </div>
      <div className="copyright">
        <p>&copy; {new Date().getFullYear()} EcoChain. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;