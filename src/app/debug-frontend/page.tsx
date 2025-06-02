'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function DebugPage() {
  const { user } = useAuth();
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const runDebug = async () => {
      const info: any = {
        user: user,
        localStorage: {
          token: localStorage.getItem('auth_token'),
          userData: localStorage.getItem('user_data')
        },
        apis: {}
      };

      if (user && localStorage.getItem('auth_token')) {
        const token = localStorage.getItem('auth_token');
        
        // Test teacher classes
        try {
          const classesRes = await fetch('/api/teacher/classes', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          info.apis.classes = {
            status: classesRes.status,
            data: classesRes.ok ? await classesRes.json() : await classesRes.text()
          };
        } catch (e) {
          info.apis.classes = { error: e.message };
        }

        // Test teacher subjects
        try {
          const subjectsRes = await fetch('/api/teacher/subjects', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          info.apis.subjects = {
            status: subjectsRes.status,
            data: subjectsRes.ok ? await subjectsRes.json() : await subjectsRes.text()
          };
        } catch (e) {
          info.apis.subjects = { error: e.message };
        }

        // Test students API with class ID 1
        try {
          const studentsRes = await fetch('/api/students?class_id=1', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          info.apis.students = {
            status: studentsRes.status,
            data: studentsRes.ok ? await studentsRes.json() : await studentsRes.text()
          };
        } catch (e) {
          info.apis.students = { error: e.message };
        }
      }

      setDebugInfo(info);
      setLoading(false);
    };

    if (user !== undefined) { // Wait for auth context to load
      runDebug();
    }
  }, [user]);

  if (loading) {
    return <div className="p-4">Loading debug info...</div>;
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Frontend Debug Information</h1>
      
      <div className="space-y-4">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">Auth Context User:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo.user, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">LocalStorage:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo.localStorage, null, 2)}
          </pre>
        </div>

        <div className="bg-gray-100 p-4 rounded">
          <h2 className="font-bold mb-2">API Responses:</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(debugInfo.apis, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
