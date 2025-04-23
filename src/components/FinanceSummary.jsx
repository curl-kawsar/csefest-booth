import { useState, useEffect } from 'react';
import { toast } from 'sonner';

const FinanceSummary = ({ refreshTrigger }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/finance');
      if (!response.ok) {
        throw new Error('Failed to fetch finance summary');
      }
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error('Error fetching finance summary:', error);
      toast.error('Failed to load finance summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [refreshTrigger]);

  // Function to get random decimal numbers for visualization
  const getRandomValues = () => {
    return Array.from({ length: 20 }, () => Math.floor(Math.random() * 9) + 1);
  };

  return (
    <div className="bg-gray-900 bg-opacity-90 p-6 rounded-xl shadow-lg border border-gray-700">
      <div className="terminal-header mb-6">
        <div className="terminal-title text-xl font-bold text-green-400">
          <span className="text-green-400">$</span> Finance_Analytics
        </div>
        <div className="terminal-dots">
          <div className="terminal-dot dot-red"></div>
          <div className="terminal-dot dot-yellow"></div>
          <div className="terminal-dot dot-green"></div>
        </div>
      </div>
      
      {loading ? (
        <div className="py-20">
          <div className="flex flex-col items-center justify-center">
            <svg className="h-10 w-10 text-green-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-green-400 font-mono text-lg">Calculating financial metrics...</p>
            <div className="mt-2 text-gray-500 font-mono text-sm">SELECT SUM(fee) FROM registrations GROUP BY event_id;</div>
          </div>
        </div>
      ) : !summary ? (
        <div className="terminal p-6 text-center">
          <p className="text-yellow-500 font-mono mb-2">No financial data available</p>
          <p className="text-gray-500 font-mono text-sm">0 rows returned</p>
        </div>
      ) : (
        <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-800 bg-opacity-90 p-5 rounded-lg border border-gray-700 relative overflow-hidden group hover:border-green-500 transition-colors duration-300">
              <div className="relative z-10">
                <div className="text-gray-400 font-mono text-sm mb-1">TOTAL REGISTRATIONS</div>
                <div className="text-3xl font-bold font-mono text-green-400 mb-2">{summary.totalRegistrations}</div>
                <div className="text-gray-500 font-mono text-xs">Participants registered for events</div>
              </div>
              {/* Abstract digital pattern in background */}
              <div className="absolute bottom-0 right-0 opacity-10 text-[8px] font-mono text-green-500 overflow-hidden w-full h-full flex flex-wrap content-end justify-end p-2">
                {getRandomValues().map((val, idx) => (
                  <span key={idx} className="mx-[1px]">{val}</span>
                ))}
              </div>
            </div>
            
            <div className="bg-gray-800 bg-opacity-90 p-5 rounded-lg border border-gray-700 relative overflow-hidden group hover:border-green-500 transition-colors duration-300">
              <div className="relative z-10">
                <div className="text-gray-400 font-mono text-sm mb-1">TOTAL REVENUE</div>
                <div className="text-3xl font-bold font-mono text-green-400 mb-2">{summary.totalAmount} <span className="text-lg">BDT</span></div>
                <div className="text-gray-500 font-mono text-xs">Collected from all events</div>
              </div>
              {/* Abstract digital pattern in background */}
              <div className="absolute bottom-0 right-0 opacity-10 text-[8px] font-mono text-green-500 overflow-hidden w-full h-full flex flex-wrap content-end justify-end p-2">
                {getRandomValues().map((val, idx) => (
                  <span key={idx} className="mx-[1px]">{val}</span>
                ))}
              </div>
            </div>
          </div>
          
          <div className="bg-gray-800 bg-opacity-80 rounded-lg border border-gray-700 overflow-hidden mb-6">
            <div className="bg-gray-900 text-green-400 p-3 border-b border-gray-700 font-mono flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              EVENT BREAKDOWN
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-700">
                <thead>
                  <tr className="bg-gray-900 text-left text-xs font-mono uppercase tracking-wider text-gray-400">
                    <th className="px-4 py-3">EVENT NAME</th>
                    <th className="px-4 py-3 text-center">FEE (BDT)</th>
                    <th className="px-4 py-3 text-center">REGISTRATIONS</th>
                    <th className="px-4 py-3 text-right">REVENUE (BDT)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700 bg-gray-800 bg-opacity-70">
                  {summary.events.map((event, index) => (
                    <tr key={index} className="hover:bg-gray-700 transition-colors duration-150">
                      <td className="px-4 py-3 text-blue-400 font-medium">
                        {event.name}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-gray-300">
                        {event.fee}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900 text-blue-300">
                          {event.count}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right font-mono text-green-400 font-medium">
                        {event.total}
                      </td>
                    </tr>
                  ))}
                  <tr className="bg-gray-900 text-white font-medium">
                    <td className="px-4 py-3 font-mono" colSpan="2">TOTAL</td>
                    <td className="px-4 py-3 text-center font-mono">{summary.totalRegistrations}</td>
                    <td className="px-4 py-3 text-right font-mono text-green-400">{summary.totalAmount}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="bg-gray-800 bg-opacity-80 rounded-lg border border-gray-700 p-4">
            <div className="font-mono text-green-400 mb-4 text-sm flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              REVENUE VISUALIZATION
            </div>
            
            <div className="space-y-3">
              {summary.events.map((event, index) => {
                // Calculate percentage of total for bar width
                const percentage = (event.total / summary.totalAmount) * 100;
                
                return (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between text-xs font-mono">
                      <span className="text-gray-400">{event.name}</span>
                      <span className="text-green-400">{event.total} BDT</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-blue-600 to-green-500"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          <div className="mt-4 text-xs text-center text-gray-500 font-mono">
            Last updated: {new Date().toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceSummary; 