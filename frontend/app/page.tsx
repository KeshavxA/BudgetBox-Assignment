"use client";
import { useEffect, useState } from 'react';
import { useBudgetStore } from '@/store/useBudgetStore';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function Dashboard() {
  const { data, status, updateField, setSyncStatus, loadFromServer } = useBudgetStore();
  const [isClient, setIsClient] = useState(false);

  // 1. Initialize & Fetch Data from API on Load
  useEffect(() => {
    setIsClient(true);
    
    // Define the fetch function
    const fetchLatestData = async () => {
      try {
        const res = await fetch('http://localhost:3001/budget/latest?email=hire-me@anshumat.org');
        if (res.ok) {
          const serverData = await res.json();
          // Only load if server returned actual data (not empty object)
          if (serverData && serverData.income !== undefined) {
             loadFromServer(serverData);
             console.log("Data loaded from API:", serverData);
          }
        }
      } catch (e) {
        console.log("Could not fetch from API (Offline mode active)");
      }
    };

    // Attempt fetch on mount
    fetchLatestData();

    // Auto-sync listener for when internet returns
    const handleOnline = () => handleSync(); 
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, []); // Empty dependency array = runs once on mount

  // Calculations [cite: 20-21]
  const totalExpenses = data.monthlyBills + data.food + data.transport + data.subscriptions + data.miscellaneous;
  const savings = data.income - totalExpenses;
  const burnRate = data.income > 0 ? ((totalExpenses / data.income) * 100).toFixed(1) : "0";

  const chartData = [
    { name: 'Bills', value: data.monthlyBills },
    { name: 'Food', value: data.food },
    { name: 'Transport', value: data.transport },
    { name: 'Subscriptions', value: data.subscriptions },
    { name: 'Misc', value: data.miscellaneous },
  ].filter(d => d.value > 0);

  // 2. Sync Logic (Push to API) [cite: 64]
  const handleSync = async () => {
    setSyncStatus('Sync Pending');
    try {
      const res = await fetch('http://localhost:3001/budget/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          email: 'hire-me@anshumat.org', 
          budget: data 
        }),
      });
      
      if (res.ok) {
        setSyncStatus('Synced');
        // Optional: clear any dirty flags here
      } else {
        throw new Error("Sync failed");
      }
    } catch (e) {
      alert("Network Error: Data saved locally only. Will sync later.");
      // Status stays 'Sync Pending' or similar
    }
  };

  if (!isClient) return <div className="p-10">Loading BudgetBox...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-white p-4 rounded-xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">BudgetBox 📦</h1>
            <p className="text-sm text-gray-500">Local-First Budgeting</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className={`px-3 py-1 rounded-full text-xs font-medium border ${
              status === 'Synced' ? 'bg-green-100 text-green-700 border-green-200' : 
              status === 'Sync Pending' ? 'bg-amber-100 text-amber-700 border-amber-200' : 
              'bg-gray-100 text-gray-700 border-gray-200'
            }`}>
              ● {status}
            </div>
            <button 
              onClick={handleSync}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors shadow-sm"
            >
              Sync Now
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Form */}
          <section className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">📝 Edit Budget</h2>
            <div className="space-y-4">
              {Object.keys(data).map((key) => (
                <div key={key} className="flex flex-col">
                  <label className="capitalize text-xs font-medium text-gray-500 mb-1">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-400">$</span>
                    <input
                      type="number"
                      value={data[key as keyof typeof data] || ''}
                      onChange={(e) => updateField(key as keyof typeof data, parseFloat(e.target.value) || 0)}
                      className="w-full pl-7 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                      placeholder="0.00"
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Analytics */}
          <div className="space-y-6">
            <section className="grid grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Burn Rate</p>
                <p className={`text-2xl font-bold mt-1 ${Number(burnRate) > 100 ? 'text-red-600' : 'text-gray-800'}`}>
                  {burnRate}%
                </p>
              </div>
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">Savings</p>
                <p className={`text-2xl font-bold mt-1 ${savings < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  ${savings.toLocaleString()}
                </p>
              </div>
            </section>

            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">💡 Insights</h3>
              <ul className="space-y-2 text-sm">
                {savings < 0 && <li className="text-red-600 bg-red-50 p-2 rounded">⚠️ Expenses exceed income!</li>}
                {data.food > (data.income * 0.4) && <li className="text-amber-600 bg-amber-50 p-2 rounded">🍔 Reduce food spend.</li>}
                {savings >= 0 && data.food <= (data.income * 0.4) && <li className="text-gray-500">All metrics look good.</li>}
              </ul>
            </section>

            <section className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 h-64 flex flex-col">
               <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={chartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={5} dataKey="value">
                      {chartData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}