import React from 'react';

interface DashboardProps {}

const Dashboard: React.FC<DashboardProps> = () => {
  // Sample data for demonstration
  const sampleMetrics = [
    { label: 'Active Users', value: '1,234', change: '+12%' },
    { label: 'Total Records', value: '45.6K', change: '+5.2%' },
    { label: 'API Calls', value: '8,901', change: '+18%' },
    { label: 'Success Rate', value: '99.7%', change: '+0.1%' }
  ];

  return (
    <div className="card">
      <h2>📈 Dashboard</h2>
      <p>This is a sample dashboard component. Replace with your actual visualizations.</p>
      
      <div className="metrics-grid">
        {sampleMetrics.map((metric, index) => (
          <div key={index} className="metric-card">
            <div className="metric-value">{metric.value}</div>
            <div className="metric-label">{metric.label}</div>
            <div className="metric-change positive">{metric.change}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: '30px' }}>
        <h3>💡 Visualization Ideas</h3>
        <ul>
          <li>Use Recharts for charts and graphs</li>
          <li>Display real-time data from your Snowflake queries</li>
          <li>Add filters and interactive controls</li>
          <li>Implement responsive design for mobile</li>
        </ul>
      </div>

      <style jsx>{`
        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        
        .metric-card {
          background: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          border-left: 4px solid #007bff;
          text-align: center;
        }
        
        .metric-value {
          font-size: 2em;
          font-weight: bold;
          color: #333;
          margin-bottom: 8px;
        }
        
        .metric-label {
          color: #666;
          font-size: 0.9em;
          margin-bottom: 8px;
        }
        
        .metric-change {
          font-size: 0.8em;
          font-weight: bold;
        }
        
        .metric-change.positive {
          color: #28a745;
        }
        
        .metric-change.negative {
          color: #dc3545;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;

