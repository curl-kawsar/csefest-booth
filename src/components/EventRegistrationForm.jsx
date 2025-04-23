import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { connectToBluetoothDevice, printRegistrationReceipt, disconnectFromDevice } from '@/lib/bluetoothPrinter';

const EventRegistrationForm = ({ onRegister, refreshRegistrations, onBluetoothConnect }) => {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [institutionName, setInstitutionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [bluetoothConnection, setBluetoothConnection] = useState(null);
  const [printerStatus, setPrinterStatus] = useState('Not connected');

  // Fetch events when component mounts
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await fetch('/api/events');
        if (!response.ok) {
          throw new Error('Failed to fetch events');
        }
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('Error fetching events:', error);
        toast.error('Failed to load events');
      }
    };

    fetchEvents();

    // Seed initial events if none exist
    const seedEvents = async () => {
      try {
        await fetch('/api/seed');
      } catch (error) {
        console.error('Error seeding events:', error);
      }
    };

    seedEvents();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedEvent || !participantName || !email || !phone) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      // Make sure institution name is never null
      const formData = {
        eventId: selectedEvent,
        participantName: participantName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        institutionName: institutionName ? institutionName.trim() : '',
      };
      
      const response = await fetch('/api/registrations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      // First check if the response is OK before trying to parse JSON
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error occurred' }));
        throw new Error(errorData.error || `Error: ${response.status}`);
      }

      const registrationData = await response.json();
      
      // Make sure we have valid data before proceeding
      if (!registrationData || !registrationData._id) {
        throw new Error('Invalid registration data received');
      }
      
      toast.success('Registration successful!');
      
      // Print receipt if printer is connected
      if (bluetoothConnection?.server) {
        try {
          await printRegistrationReceipt(bluetoothConnection.server, registrationData);
          toast.success('Ticket printed successfully!');
        } catch (printError) {
          console.error('Error printing receipt:', printError);
          toast.error(`Failed to print receipt: ${printError.message}`);
        }
      } else {
        toast.info('Printer not connected. Connect to print ticket.');
      }
      
      // Reset form
      setSelectedEvent('');
      setParticipantName('');
      setEmail('');
      setPhone('');
      setInstitutionName('');
      
      // Notify parent component of successful registration
      if (onRegister) onRegister(registrationData);
      
      // Refresh registrations list
      if (refreshRegistrations) refreshRegistrations();
      
    } catch (error) {
      console.error('Error registering for event:', error);
      toast.error(error.message || 'Failed to register for event');
    } finally {
      setLoading(false);
    }
  };

  const connectToPrinter = async () => {
    try {
      setPrinterStatus('Connecting...');
      const connection = await connectToBluetoothDevice();
      setBluetoothConnection(connection);
      
      // Also update the connection in the parent component
      if (onBluetoothConnect) {
        onBluetoothConnect(connection);
      }
      
      setPrinterStatus('Connected');
      toast.success('Printer connected successfully!');
    } catch (error) {
      console.error('Error connecting to printer:', error);
      setPrinterStatus('Connection failed');
      toast.error(`Failed to connect to printer: ${error.message}`);
    }
  };

  const disconnectPrinter = async () => {
    if (bluetoothConnection?.device) {
      try {
        await disconnectFromDevice(bluetoothConnection.device);
        setBluetoothConnection(null);
        
        // Also update the connection in the parent component
        if (onBluetoothConnect) {
          onBluetoothConnect(null);
        }
        
        setPrinterStatus('Disconnected');
        toast.success('Printer disconnected');
      } catch (error) {
        console.error('Error disconnecting printer:', error);
        toast.error('Failed to disconnect printer');
      }
    }
  };

  return (
    <div className="bg-gray-900 bg-opacity-90 p-6 rounded-xl shadow-lg border border-gray-700">
      <div className="terminal-header mb-6">
        <div className="terminal-title text-xl font-bold text-blue-400">
          <span className="text-green-400">$</span> Event_Registration
        </div>
        <div className="terminal-dots">
          <div className="terminal-dot dot-red"></div>
          <div className="terminal-dot dot-yellow"></div>
          <div className="terminal-dot dot-green"></div>
        </div>
      </div>
      
      <div className="mb-6 bg-gray-800 p-4 rounded-lg border border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className={`w-3 h-3 rounded-full mr-2 ${bluetoothConnection?.device ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="text-gray-300 font-mono">Printer Status: </span>
            <span className={`ml-2 font-mono ${bluetoothConnection?.device ? 'text-green-400' : 'text-red-400'}`}>
              {printerStatus}
            </span>
          </div>
          {bluetoothConnection?.device ? (
            <button
              type="button"
              onClick={disconnectPrinter}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 transition-colors duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              onClick={connectToPrinter}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors duration-300 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              Connect Printer
            </button>
          )}
        </div>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="group">
          <label className="block text-blue-400 mb-2 font-mono" htmlFor="event">
            <span className="text-green-400">&gt;</span> SELECT_EVENT *
          </label>
          <select
            id="event"
            className="w-full bg-gray-800 border-2 border-gray-700 rounded-md p-3 text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            value={selectedEvent}
            onChange={(e) => setSelectedEvent(e.target.value)}
            required
          >
            <option value="">-- Select Event --</option>
            {events.map((event) => (
              <option key={event._id} value={event._id}>
                {event.name} - {event.fee} BDT
              </option>
            ))}
          </select>
        </div>
        
        <div className="group">
          <label className="block text-blue-400 mb-2 font-mono" htmlFor="name">
            <span className="text-green-400">&gt;</span> PARTICIPANT_NAME *
          </label>
          <div className="relative">
            <input
              id="name"
              type="text"
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-md p-3 pl-10 text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              value={participantName}
              onChange={(e) => setParticipantName(e.target.value)}
              required
            />
            <div className="absolute left-3 top-3.5 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="group">
          <label className="block text-blue-400 mb-2 font-mono" htmlFor="email">
            <span className="text-green-400">&gt;</span> EMAIL_ADDRESS *
          </label>
          <div className="relative">
            <input
              id="email"
              type="email"
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-md p-3 pl-10 text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <div className="absolute left-3 top-3.5 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="group">
          <label className="block text-blue-400 mb-2 font-mono" htmlFor="phone">
            <span className="text-green-400">&gt;</span> PHONE_NUMBER *
          </label>
          <div className="relative">
            <input
              id="phone"
              type="tel"
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-md p-3 pl-10 text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
            <div className="absolute left-3 top-3.5 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="group">
          <label className="block text-blue-400 mb-2 font-mono" htmlFor="institution">
            <span className="text-green-400">&gt;</span> INSTITUTION_NAME
          </label>
          <div className="relative">
            <input
              id="institution"
              type="text"
              className="w-full bg-gray-800 border-2 border-gray-700 rounded-md p-3 pl-10 text-gray-200 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
              value={institutionName}
              onChange={(e) => setInstitutionName(e.target.value)}
            />
            <div className="absolute left-3 top-3.5 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="pt-4">
          <button
            type="submit"
            className={`w-full p-3 rounded-md font-bold font-mono shadow-lg relative overflow-hidden ${
              loading 
                ? 'bg-gray-600 cursor-not-allowed' 
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white'
            }`}
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <svg className="h-5 w-5 text-white mr-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                PROCESSING...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <span className="mr-2 font-mono tracking-wider">&gt; REGISTER_NOW</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            )}
          </button>
        </div>

        <div className="mt-4 text-xs text-center text-gray-500 font-mono">
          * Required fields | After registration, a token will be generated and printed if printer is connected
        </div>
      </form>
    </div>
  );
};

export default EventRegistrationForm; 