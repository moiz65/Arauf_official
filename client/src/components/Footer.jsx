import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 py-6 mt-auto">
      <div className="container mx-auto text-center text-sm text-gray-600">
        <p>
          © {new Date().getFullYear()} <a href="https://digioussolutions.com" className="text-blue-600 hover:text-blue-800 transition-colors">Digious Solutions</a>. All rights reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
