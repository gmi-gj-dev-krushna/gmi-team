import React from 'react';

function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#000000] border-t border-gray-200 py-6">
      <div className="container mx-auto px-4 flex justify-between items-center text-sm text-white">
        <div>© {currentYear} GMI Dashboard. All rights reserved.</div>
        <div className="flex space-x-4">
          <a href="#" className="hover:text-white transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-white transition-colors">Terms of Service</a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
