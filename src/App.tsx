import React, { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';

interface HealthData {
  status: string;
  environment: string;
  port: number;
  timestamp: string;
}

interface ApiData {
  success: boolean;
  data?: any[];
  mockData?: any[];
  error?: string;
  message?: string;
  count?: number;
}

function App() {
  const [healthData, setHealthData] = useState<HealthData | null>(null);
  const [apiData, setApiData] = useState<ApiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch health data
        const healthResponse = await fetch('/api/health');
        const health = await healthResponse.json();
        setHealthData(health);

        // Fetch sample data
        const dataResponse = await fetch('/api/data');
        const data = await dataResponse.json();
        setApiData(data);

        setLoading(false);
      } catch (err) {
        setError('Failed to fetch data from API');
        setLoading(false);
        console.error('API Error:', err);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading SPCS Application...</div>
      </div>
    );
  }

  return (
    <div className="App">
      <div className="container">
        <div className="header">
          <h1>🚀 SPCS Application Template</h1>
          <p>React + Express + Snowflake SPCS</p>
        </div>

        {error && <div className="error">{error}</div>}

        <div className="card">
          <h2>📊 System Status</h2>
          {healthData && (
            <div>
              <p><strong>Status:</strong> {healthData.status}</p>
              <p><strong>Environment:</strong> {healthData.environment}</p>
              <p><strong>Port:</strong> {healthData.port}</p>
              <p><strong>Timestamp:</strong> {new Date(healthData.timestamp).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="card">
          <h2>🔗 Database Connection</h2>
          {apiData && (
            <div>
              <p><strong>Connection Status:</strong> {apiData.success ? '✅ Connected' : '❌ Failed'}</p>
              {apiData.error && <p><strong>Error:</strong> {apiData.error}</p>}
              {apiData.message && <p><strong>Message:</strong> {apiData.message}</p>}
              
              {apiData.data && apiData.data.length > 0 && (
                <div>
                  <h3>Sample Data from Snowflake:</h3>
                  <pre>{JSON.stringify(apiData.data[0], null, 2)}</pre>
                </div>
              )}
              
              {apiData.mockData && (
                <div>
                  <h3>Mock Data (Development):</h3>
                  <pre>{JSON.stringify(apiData.mockData[0], null, 2)}</pre>
                </div>
              )}
            </div>
          )}
        </div>

        <Dashboard />

        <div className="card">
          <h2>🛠️ Next Steps</h2>
          <ul>
            <li>Replace the sample /api/data endpoint with your actual data queries</li>
            <li>Add your React components in the src/components/ directory</li>
            <li>Update database configuration in server.js</li>
            <li>Customize the SPCS service specification in snowflake/service_spec.yaml</li>
            <li>Run deployment scripts to deploy to SPCS</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default App;

