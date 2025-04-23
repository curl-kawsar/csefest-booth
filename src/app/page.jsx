'use client';

import { useState } from 'react';
import Image from 'next/image';
import EventRegistrationForm from '@/components/EventRegistrationForm';
import RegistrationsList from '@/components/RegistrationsList';
import FinanceSummary from '@/components/FinanceSummary';

export default function Home() {
  const [activeTab, setActiveTab] = useState('registration');
  const [bluetoothConnection, setBluetoothConnection] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleRegister = (registrationData) => {
    // Increment refresh trigger to refresh registrations and finance data
    setRefreshTrigger(prev => prev + 1);
  };

  const refreshData = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    refreshData();
  };

  return (
    <div className="py-8 px-4 w-full">
      <div className="max-w-6xl mx-auto">
        {/* Header with tech theme */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-2 tech-gradient-text">
            <span>BAIUST CSE FEST</span>
          </h1>
          <div className="flex justify-center items-center gap-2 mb-4">
            <div className="h-1 w-16 bg-blue-500"></div>
            <div className="text-xl font-mono tracking-wider text-white">EVENT REGISTRATION SYSTEM</div>
            <div className="h-1 w-16 bg-blue-500"></div>
          </div>
          
          <p className="text-gray-300 max-w-2xl mx-auto">
            Register for exciting events: 
            <span className="text-blue-400 font-semibold ml-1">Hackathon, IUPC, Typing Speed Contest, E-Football & ICT Quiz</span>
          </p>
          
          {/* Digital clock-like counter */}
          <div className="mt-6 flex justify-center gap-4">
            <div className="bg-gray-900 px-3 py-2 rounded-md border border-blue-500">
              <div className="text-xs text-gray-400">EVENTS</div>
              <div className="text-2xl font-mono text-blue-400">05</div>
            </div>
            <div className="bg-gray-900 px-3 py-2 rounded-md border border-purple-500">
              <div className="text-xs text-gray-400">PRIZES</div>
              <div className="text-2xl font-mono text-purple-400">10K+</div>
            </div>
            <div className="bg-gray-900 px-3 py-2 rounded-md border border-green-500">
              <div className="text-xs text-gray-400">REGISTER</div>
              <div className="text-2xl font-mono text-green-400">NOW</div>
            </div>
          </div>
        </div>
        
        {/* Interactive Tabs */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-gray-900 bg-opacity-70 rounded-xl p-1 w-full max-w-2xl justify-between">
            <button
              className={`py-3 px-4 rounded-lg transition-all duration-300 ${
                activeTab === 'registration'
                  ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              onClick={() => handleTabClick('registration')}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Registration
              </div>
            </button>
            <button
              className={`py-3 px-4 rounded-lg transition-all duration-300 ${
                activeTab === 'registrations'
                  ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              onClick={() => handleTabClick('registrations')}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
                Participants
              </div>
            </button>
            <button
              className={`py-3 px-4 rounded-lg transition-all duration-300 ${
                activeTab === 'finance'
                  ? 'bg-gradient-to-r from-green-600 to-green-500 text-white shadow-lg'
                  : 'text-gray-400 hover:text-white hover:bg-gray-800'
              }`}
              onClick={() => handleTabClick('finance')}
            >
              <div className="flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                Finance
              </div>
            </button>
          </div>
        </div>
        
        {/* Content container with simplified background */}
        <div className="mb-8">
          {/* Content based on active tab */}
          <div className="bg-gray-900 bg-opacity-70 p-1 rounded-2xl shadow-2xl">
            {activeTab === 'registration' && (
              <EventRegistrationForm 
                onRegister={handleRegister} 
                refreshRegistrations={refreshData}
                onBluetoothConnect={connection => setBluetoothConnection(connection)}
              />
            )}
            
            {activeTab === 'registrations' && (
              <RegistrationsList 
                bluetoothConnection={bluetoothConnection} 
                refreshTrigger={refreshTrigger} 
              />
            )}
            
            {activeTab === 'finance' && (
              <FinanceSummary 
                refreshTrigger={refreshTrigger} 
              />
            )}
          </div>
        </div>
        
        {/* Footer */}
        <div className="text-center mb-8 text-sm text-gray-400">
          <div className="mb-2 flex flex-wrap justify-center gap-4">
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div>
              <span>Hackathon</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-purple-500 mr-2"></div>
              <span>IUPC</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
              <span>Typing Contest</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
              <span>E-Football</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 rounded-full bg-red-500 mr-2"></div>
              <span>ICT Quiz</span>
            </div>
          </div>
          <p className="font-mono">Organized by Department of CSE, BAIUST | ©2025</p>
        </div>
      </div>
    </div>
  );
}
