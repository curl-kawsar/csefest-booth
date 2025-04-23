import React from 'react';
import Link from 'next/link';

const Navbar = () => {
  return (
    <nav className="bg-gray-900 bg-opacity-90 backdrop-blur-sm border-b border-gray-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <div className="font-mono text-blue-400 font-bold text-xl flex items-center">
              <div className="w-8 h-8 bg-blue-500 rounded-md mr-2 flex items-center justify-center">
                <span className="text-white">&lt;/&gt;</span>
              </div>
              <span className="glow-text">BAIUST_CSE</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="px-2 py-1 rounded-md bg-blue-900 bg-opacity-50 border border-blue-800 text-blue-400 text-xs font-mono">
              <span className="mr-1">&#9679;</span> System Online
            </div>
            <Link 
              href="/" 
              className="hover:text-blue-400 transition-colors duration-200 font-mono text-sm text-gray-300"
            >
              Home
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 