import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { connectToBluetoothDevice, printRegistrationReceipt, disconnectFromDevice } from '@/lib/bluetoothPrinter';

const RegistrationsList = ({ bluetoothConnection, refreshTrigger }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');
  const registrationsPerPage = 10;

  const fetchRegistrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/registrations');
      if (!response.ok) {
        throw new Error('Failed to fetch registrations');
      }
      const data = await response.json();
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
      toast.error('Failed to load registrations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [refreshTrigger]);

  // Filter registrations based on search input
  const filteredRegistrations = registrations.filter(reg => 
    reg.participantName.toLowerCase().includes(filter.toLowerCase()) ||
    reg.email.toLowerCase().includes(filter.toLowerCase()) ||
    reg.phone.includes(filter) ||
    reg.tokenNumber.toLowerCase().includes(filter.toLowerCase()) ||
    (reg.eventId && reg.eventId.name.toLowerCase().includes(filter.toLowerCase()))
  );

  // Pagination logic
  const indexOfLastRegistration = currentPage * registrationsPerPage;
  const indexOfFirstRegistration = indexOfLastRegistration - registrationsPerPage;
  const currentRegistrations = filteredRegistrations.slice(indexOfFirstRegistration, indexOfLastRegistration);
  const totalPages = Math.ceil(filteredRegistrations.length / registrationsPerPage);

  const handlePrintReceipt = async (registration) => {
    if (!bluetoothConnection?.server) {
      toast.error('Printer not connected. Please connect a printer first.');
      return;
    }

    try {
      await printRegistrationReceipt(bluetoothConnection.server, registration);
      toast.success('Receipt printed successfully!');
    } catch (error) {
      console.error('Error printing receipt:', error);
      toast.error(`Failed to print receipt: ${error.message}`);
    }
  };

  return (
    <div className="bg-gray-900 bg-opacity-90 p-6 rounded-xl shadow-lg border border-gray-700">
      <div className="terminal-header mb-6">
        <div className="terminal-title text-xl font-bold text-purple-400">
          <span className="text-green-400">$</span> Participants_List
        </div>
        <div className="terminal-dots">
          <div className="terminal-dot dot-red"></div>
          <div className="terminal-dot dot-yellow"></div>
          <div className="terminal-dot dot-green"></div>
        </div>
      </div>
      
      <div className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="grep -i 'search by name, email, token, event...'"
          className="w-full bg-gray-800 border-2 border-gray-700 rounded-md p-3 pl-10 text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-300"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>
      
      {loading ? (
        <div className="py-20">
          <div className="flex flex-col items-center justify-center">
            <svg className="h-10 w-10 text-purple-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-purple-400 font-mono text-lg">Loading participants data...</p>
            <div className="mt-2 text-gray-500 font-mono text-sm">SELECT * FROM registrations;</div>
          </div>
        </div>
      ) : registrations.length === 0 ? (
        <div className="terminal p-6 text-center">
          <p className="text-yellow-500 font-mono mb-2">No records found in database</p>
          <p className="text-gray-500 font-mono text-sm">0 rows returned</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border border-gray-700 bg-gray-800 bg-opacity-80">
            <table className="min-w-full">
              <thead>
                <tr className="bg-gray-900 text-gray-300 text-left text-sm uppercase font-mono tracking-wider">
                  <th className="px-4 py-3 border-b border-gray-700"># TOKEN</th>
                  <th className="px-4 py-3 border-b border-gray-700">PARTICIPANT</th>
                  <th className="px-4 py-3 border-b border-gray-700">EVENT</th>
                  <th className="px-4 py-3 border-b border-gray-700">FEE (BDT)</th>
                  <th className="px-4 py-3 border-b border-gray-700">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {currentRegistrations.map((registration, index) => (
                  <tr 
                    key={registration._id} 
                    className={`
                      text-gray-300 hover:bg-gray-700 transition-colors duration-150
                      ${index % 2 === 0 ? 'bg-gray-800 bg-opacity-70' : 'bg-gray-800 bg-opacity-40'}
                    `}
                  >
                    <td className="px-4 py-3 font-mono text-yellow-400">
                      {registration.tokenNumber}
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <div className="font-medium text-blue-400">{registration.participantName}</div>
                        <div className="text-xs text-gray-400 mt-1">{registration.email}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-green-400">
                      {registration.eventId?.name || 'Unknown'}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {registration.eventId?.fee || 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        className={`bg-gradient-to-r from-purple-600 to-purple-700 text-white py-1 px-3 rounded-md text-sm flex items-center space-x-1 hover:from-purple-500 hover:to-purple-600 transition-colors duration-300 ${!bluetoothConnection?.server ? 'opacity-50 cursor-not-allowed' : ''}`}
                        onClick={() => handlePrintReceipt(registration)}
                        disabled={!bluetoothConnection?.server}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span>Print</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-6 font-mono text-gray-300">
              <button
                className={`px-4 py-2 rounded-md flex items-center space-x-1 transition-colors duration-300 ${
                  currentPage === 1 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                }`}
                onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
                disabled={currentPage === 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span>prev</span>
              </button>
              
              <div className="flex items-center space-x-1">
                <span className="bg-gray-800 rounded-md px-3 py-1">Page {currentPage}</span>
                <span className="text-gray-500">of</span>
                <span className="bg-gray-800 rounded-md px-3 py-1">{totalPages}</span>
              </div>
              
              <button
                className={`px-4 py-2 rounded-md flex items-center space-x-1 transition-colors duration-300 ${
                  currentPage === totalPages 
                    ? 'bg-gray-800 text-gray-500 cursor-not-allowed' 
                    : 'bg-gray-800 hover:bg-gray-700 text-blue-400'
                }`}
                onClick={() => setCurrentPage(curr => Math.min(curr + 1, totalPages))}
                disabled={currentPage === totalPages}
              >
                <span>next</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
          
          <div className="mt-4 text-xs text-center text-gray-500 font-mono">
            Showing {currentRegistrations.length} out of {filteredRegistrations.length} registrations
          </div>
        </>
      )}
    </div>
  );
};

export default RegistrationsList; 