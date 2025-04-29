import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { connectToBluetoothDevice, printRegistrationReceipt, disconnectFromDevice } from '@/lib/bluetoothPrinter';

const RegistrationsList = ({ bluetoothConnection, refreshTrigger }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePin, setDeletePin] = useState('');
  const [deletingRegistration, setDeletingRegistration] = useState(null);
  const [deletingLoading, setDeletingLoading] = useState(false);
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
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

  // Apply date filtering
  const getFilteredByDate = (regs) => {
    return regs.filter(reg => {
      const regDate = new Date(reg.createdAt);
      
      if (dateFilter === 'today') {
        const today = new Date();
        return regDate.toDateString() === today.toDateString();
      } 
      else if (dateFilter === 'yesterday') {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        return regDate.toDateString() === yesterday.toDateString();
      } 
      else if (dateFilter === 'thisWeek') {
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        return regDate >= weekStart;
      } 
      else if (dateFilter === 'thisMonth') {
        const today = new Date();
        const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
        return regDate >= monthStart;
      } 
      else if (dateFilter === 'custom') {
        const startDate = new Date(customDateRange.startDate);
        startDate.setHours(0, 0, 0, 0);
        
        const endDate = new Date(customDateRange.endDate);
        endDate.setHours(23, 59, 59, 999);
        
        return regDate >= startDate && regDate <= endDate;
      } 
      else {
        return true; // 'all' option
      }
    });
  };

  // Filter registrations based on search input AND date filter
  const filteredRegistrations = getFilteredByDate(registrations).filter(reg => 
    reg.participantName.toLowerCase().includes(filter.toLowerCase()) ||
    reg.email.toLowerCase().includes(filter.toLowerCase()) ||
    reg.phone.includes(filter) ||
    reg.tokenNumber.toLowerCase().includes(filter.toLowerCase()) ||
    (reg.eventId && reg.eventId.name.toLowerCase().includes(filter.toLowerCase()))
  );

  // Format date for display
  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

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

  const handleDeleteClick = (registration) => {
    setDeletingRegistration(registration);
    setDeletePin('');
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingRegistration) return;
    
    try {
      setDeletingLoading(true);
      const response = await fetch('/api/registrations', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          registrationId: deletingRegistration._id,
          pin: deletePin
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete registration');
      }
      
      toast.success('Registration deleted successfully');
      setShowDeleteModal(false);
      fetchRegistrations(); // Refresh the list
    } catch (error) {
      console.error('Error deleting registration:', error);
      toast.error(error.message);
    } finally {
      setDeletingLoading(false);
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="col-span-2 relative">
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
        
        <div>
          <select 
            className="w-full bg-gray-800 border-2 border-gray-700 rounded-md p-3 text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          >
            <option value="today">Today's Registrations</option>
            <option value="yesterday">Yesterday</option>
            <option value="thisWeek">This Week</option>
            <option value="thisMonth">This Month</option>
            <option value="custom">Custom Date Range</option>
            <option value="all">All Time</option>
          </select>
        </div>
      </div>
      
      {/* Custom date range selector */}
      {dateFilter === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
          <div>
            <label className="block text-gray-400 font-mono text-sm mb-2">
              Start Date:
            </label>
            <input 
              type="date"
              className="w-full bg-gray-900 border-2 border-gray-700 rounded-md p-2 text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={customDateRange.startDate}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, startDate: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-gray-400 font-mono text-sm mb-2">
              End Date:
            </label>
            <input 
              type="date"
              className="w-full bg-gray-900 border-2 border-gray-700 rounded-md p-2 text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={customDateRange.endDate}
              onChange={(e) => setCustomDateRange(prev => ({ ...prev, endDate: e.target.value }))}
            />
          </div>
        </div>
      )}
      
      {/* Date filter summary */}
      <div className="mb-4 text-center">
        <span className="inline-block bg-gray-800 rounded-full px-4 py-1 text-sm font-mono text-blue-400 border border-blue-800">
          {dateFilter === 'today' && 'Showing today\'s registrations'}
          {dateFilter === 'yesterday' && 'Showing yesterday\'s registrations'}
          {dateFilter === 'thisWeek' && 'Showing this week\'s registrations'}
          {dateFilter === 'thisMonth' && 'Showing this month\'s registrations'}
          {dateFilter === 'custom' && `Showing registrations from ${customDateRange.startDate} to ${customDateRange.endDate}`}
          {dateFilter === 'all' && 'Showing all registrations'}
          {' • '}
          <span className="text-green-400">{filteredRegistrations.length}</span> records found
        </span>
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
      ) : filteredRegistrations.length === 0 ? (
        <div className="terminal p-6 text-center">
          <p className="text-yellow-500 font-mono mb-2">No records found for this date range</p>
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
                  <th className="px-4 py-3 border-b border-gray-700">DATE</th>
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
                    <td className="px-4 py-3 text-xs text-gray-400">
                      {formatDate(registration.createdAt)}
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {registration.eventId?.fee || 'N/A'}
                    </td>
                    <td className="px-4 py-3 flex space-x-2">
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
                      
                      <button
                        className="bg-gradient-to-r from-red-600 to-red-700 text-white py-1 px-3 rounded-md text-sm flex items-center space-x-1 hover:from-red-500 hover:to-red-600 transition-colors duration-300"
                        onClick={() => handleDeleteClick(registration)}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
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
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
          <div className="bg-gray-800 border-2 border-red-500 rounded-xl p-6 max-w-md w-full m-4 shadow-2xl">
            <div className="terminal-header mb-4">
              <div className="terminal-title text-lg font-bold text-red-400">
                <span className="text-white">$</span> sudo rm registration
              </div>
              <div className="terminal-dots">
                <div className="terminal-dot dot-red"></div>
                <div className="terminal-dot dot-yellow"></div>
                <div className="terminal-dot dot-green"></div>
              </div>
            </div>
            
            <div className="mb-4 text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-900 bg-opacity-30 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              
              <h3 className="text-xl font-bold text-white mb-2">Confirm Deletion</h3>
              <p className="text-gray-300 mb-2">
                Are you sure you want to delete this registration?
              </p>
              
              <div className="bg-gray-900 p-2 rounded mb-2 text-left">
                <p className="text-yellow-400 font-mono text-sm">
                  {deletingRegistration?.tokenNumber} | {deletingRegistration?.participantName}
                </p>
                <p className="text-green-400 font-mono text-sm">
                  Event: {deletingRegistration?.eventId?.name}
                </p>
              </div>
              
              <div className="text-gray-300 text-sm mb-4">
                This action cannot be undone.
              </div>
              
              <div className="mb-4">
                <label className="block text-gray-400 font-mono text-sm mb-2">
                  Enter Security PIN to confirm:
                </label>
                <input 
                  type="password"
                  className="w-full bg-gray-900 border-2 border-gray-700 rounded-md p-2 text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  placeholder="Security PIN"
                  value={deletePin}
                  onChange={(e) => setDeletePin(e.target.value)}
                  maxLength={4}
                />
              </div>
            </div>
            
            <div className="flex justify-between space-x-4">
              <button
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 px-4 rounded-md transition-colors duration-300"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button
                className={`flex-1 bg-red-600 hover:bg-red-500 text-white py-2 px-4 rounded-md flex justify-center items-center transition-colors duration-300 ${deletingLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                onClick={handleDeleteConfirm}
                disabled={deletingLoading || deletePin.length !== 4}
              >
                {deletingLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Delete Registration'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationsList; 