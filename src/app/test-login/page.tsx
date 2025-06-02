'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SimpleLoginPage() {
  const [credentials, setCredentials] = useState({ username: 'principal', password: 'password123' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      const result = await response.json();
      console.log('Login result:', result);

      if (result.success) {
        // Store authentication data
        localStorage.setItem('auth_token', result.data.token);
        const { token, ...userWithoutToken } = result.data;
        localStorage.setItem('user_data', JSON.stringify(userWithoutToken));
        
        setMessage('Login successful! Redirecting to timetable...');
        
        // Redirect to timetable page
        setTimeout(() => {
          router.push('/timetable');
        }, 1000);
      } else {
        setMessage('Login failed: ' + (result.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage('Login error: ' + error);
    } finally {
      setLoading(false);
    }
  };

  const goToTimetable = () => {
    router.push('/timetable');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center">Simple Login Test</h1>
        
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Username
            </label>
            <input
              type="text"
              value={credentials.username}
              onChange={(e) => setCredentials({...credentials, username: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              type="password"
              value={credentials.password}
              onChange={(e) => setCredentials({...credentials, password: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="space-y-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login & Go to Timetable'}
            </button>
            
            <button
              type="button"
              onClick={goToTimetable}
              className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Go to Timetable (without login)
            </button>
          </div>
        </form>
        
        {message && (
          <div className={`mt-4 p-3 rounded ${
            message.includes('successful') 
              ? 'bg-green-100 text-green-700 border border-green-300' 
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
}
