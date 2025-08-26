import React from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import ErrorBoundary from './components/ErrorBoundary';

function App() {

  return (
    <ErrorBoundary>
      <div className="App">
        <div className="container">
          <ErrorBoundary>
            <Dashboard />
          </ErrorBoundary>
        </div>
      </div>
    </ErrorBoundary>
  );
}

export default App;

