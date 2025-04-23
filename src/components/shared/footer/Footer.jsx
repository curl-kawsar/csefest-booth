import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 bg-opacity-90 border-t border-gray-800 text-gray-400">
      <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="font-mono text-xs mb-4 md:mb-0">
            <div className="flex items-center mb-1">
              <span className="text-blue-400 mr-2">[*]</span>
              <span>Department of Computer Science & Engineering, BAIUST</span>
            </div>
            <div className="text-gray-500">
              {new Date().getFullYear()} &copy; All rights reserved 
            </div>
          </div>
          
          <div className="flex space-x-4 items-center">
            <div className="text-xs font-mono text-gray-500">Ethernet Status:</div>
            <div className="flex items-center">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
              <span className="text-xs font-mono text-green-400">Connected</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 