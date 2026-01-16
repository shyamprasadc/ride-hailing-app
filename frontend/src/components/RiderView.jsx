import { useState, useEffect } from 'react';
import API_BASE_URL from '../config';

function RiderView() {
  const [riders, setRiders] = useState([]);
  const [selectedRider, setSelectedRider] = useState('');
  const [pickupLat, setPickupLat] = useState('37.7749');
  const [pickupLng, setPickupLng] = useState('-122.4194');
  const [destLat, setDestLat] = useState('37.8049');
  const [destLng, setDestLng] = useState('-122.3894');
  const [tier, setTier] = useState('ECONOMY');
  const [rideId, setRideId] = useState('');
  const [rideStatus, setRideStatus] = useState(null);
  const [error, setError] = useState('');

  // Fetch riders on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/data/riders`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data && Array.isArray(data.data)) {
          setRiders(data.data);
          if (data.data.length > 0) setSelectedRider(data.data[0].id);
        }
      })
      .catch(() => setError('Failed to fetch riders'));
  }, []);

  // Poll ride status
  useEffect(() => {
    if (!rideId) return;
    
    const interval = setInterval(() => {
      fetch(`${API_BASE_URL}/rides/${rideId}`)
        .then(res => res.json())
        .then(data => {
          if (data.data) setRideStatus(data.data);
        })
        .catch(() => {});
    }, 3000);

    return () => clearInterval(interval);
  }, [rideId]);

  const createRide = async () => {
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/rides`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          riderId: selectedRider,
          pickupLat: parseFloat(pickupLat),
          pickupLng: parseFloat(pickupLng),
          destLat: parseFloat(destLat),
          destLng: parseFloat(destLng),
          tier,
        }),
      });

      const data = await response.json();
      if (data.data && data.data.rideId) {
        setRideId(data.data.rideId);
        setRideStatus(data.data);
      } else {
        setError('Failed to create ride');
      }
    } catch (err) {
      setError('Error creating ride: ' + err.message);
    }
  };

  return (
    <div className="view">
      <h2>🚗 Rider View</h2>
      
      <div className="form-group">
        <label>Rider:</label>
        <select value={selectedRider} onChange={(e) => setSelectedRider(e.target.value)}>
          {riders.map(r => (
            <option key={r.id} value={r.id}>{r.name} ({r.email})</option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Pickup Lat:</label>
          <input type="number" step="0.0001" value={pickupLat} onChange={(e) => setPickupLat(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Pickup Lng:</label>
          <input type="number" step="0.0001" value={pickupLng} onChange={(e) => setPickupLng(e.target.value)} />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Dest Lat:</label>
          <input type="number" step="0.0001" value={destLat} onChange={(e) => setDestLat(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Dest Lng:</label>
          <input type="number" step="0.0001" value={destLng} onChange={(e) => setDestLng(e.target.value)} />
        </div>
      </div>

      <div className="form-group">
        <label>Tier:</label>
        <select value={tier} onChange={(e) => setTier(e.target.value)}>
          <option value="ECONOMY">Economy</option>
          <option value="PREMIUM">Premium</option>
        </select>
      </div>

      <button onClick={createRide} className="btn-primary">Create Ride</button>

      {error && <div className="error">{error}</div>}

      {rideStatus && (
        <div className="status-card">
          <h3>Ride Status</h3>
          <p><strong>Ride ID:</strong> {rideId}</p>
          <p><strong>Status:</strong> <span className="status-badge">{rideStatus.status}</span></p>
          
          {rideStatus.status === 'REQUESTED' && (
            <p className="info-message">🔍 Searching for drivers... Waiting for a driver to accept your ride.</p>
          )}
          
          {rideStatus.driver && (
            <div>
              <p><strong>Driver:</strong> {rideStatus.driver.name} ({rideStatus.driver.phone})</p>
            </div>
          )}
          {rideStatus.trip && (
            <div>
              <p><strong>Trip ID:</strong> {rideStatus.trip.id}</p>
              <p><strong>Trip Status:</strong> {rideStatus.trip.status}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default RiderView;
