'use client';

import { useEffect, useState } from 'react';

export default function DebugSessionPage() {
  const [sessionData, setSessionData] = useState<any>({});

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const userData = localStorage.getItem('user_data');
    
    setSessionData({
      token: token || 'No token found',
      userData: userData ? JSON.parse(userData) : 'No user data found',
      rawUserData: userData || 'No raw user data found'
    });
  }, []);

  const clearSession = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
    window.location.reload();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Debug Session Data</h1>
      
      <div className="mb-4">
        <button 
          onClick={clearSession}
          className="bg-red-500 text-white px-4 py-2 rounded"
        >
          Clear Session & Reload
        </button>
      </div>

      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-bold mb-2">Current Session:</h2>
        <pre className="text-sm overflow-auto">
          {JSON.stringify(sessionData, null, 2)}
        </pre>
      </div>
    </div>
  );
}
