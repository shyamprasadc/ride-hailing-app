import { useState } from 'react';
import RiderView from './components/RiderView';
import DriverView from './components/DriverView';
import TripView from './components/TripView';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('rider');

  return (
    <div className="app">
      <header>
        <h1>🚗 Ride Hailing Demo</h1>
        <p className="subtitle">Backend API Demonstration</p>
      </header>

      <div className="tabs">
        <button 
          className={activeTab === 'rider' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('rider')}
        >
          Rider
        </button>
        <button 
          className={activeTab === 'driver' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('driver')}
        >
          Driver
        </button>
        <button 
          className={activeTab === 'trip' ? 'tab active' : 'tab'}
          onClick={() => setActiveTab('trip')}
        >
          Trip & Payment
        </button>
      </div>

      <div className="content">
        {activeTab === 'rider' && <RiderView />}
        {activeTab === 'driver' && <DriverView />}
        {activeTab === 'trip' && <TripView />}
      </div>

      <footer>
        <p>Demo Flow: Create Ride → Accept Ride → End Trip → Process Payment</p>
      </footer>
    </div>
  );
}

export default App;
