import { useState, useEffect } from 'react';
import API_BASE_URL from '../config';

function DriverView() {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [latitude, setLatitude] = useState('37.7849');
  const [longitude, setLongitude] = useState('-122.4094');
  const [rideId, setRideId] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Fetch drivers on mount
  useEffect(() => {
    fetch(`${API_BASE_URL}/data/drivers`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data && Array.isArray(data.data)) {
          setDrivers(data.data);
          if (data.data.length > 0) setSelectedDriver(data.data[0].id);
        }
      })
      .catch(() => setError('Failed to fetch drivers'));
  }, []);

  const updateLocation = async () => {
    setError('');
    setMessage('');
    try {
      const response = await fetch(`${API_BASE_URL}/drivers/${selectedDriver}/location`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Location updated successfully');
      } else {
        setError(data.message || 'Failed to update location');
      }
    } catch (err) {
      setError('Error updating location: ' + err.message);
    }
  };

  const acceptRide = async () => {
    setError('');
    setMessage('');
    if (!rideId) {
      setError('Please enter a ride ID');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/drivers/${selectedDriver}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Ride accepted successfully!');
      } else {
        setError(data.message || 'Failed to accept ride');
      }
    } catch (err) {
      setError('Error accepting ride: ' + err.message);
    }
  };

  return (
    <div className="view">
      <h2>🚕 Driver View</h2>
      
      <div className="form-group">
        <label>Driver:</label>
        <select value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
          {drivers.map(d => (
            <option key={d.id} value={d.id}>
              {d.name} - {d.status} ({d.tier})
            </option>
          ))}
        </select>
      </div>

      <h3>Update Location</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Latitude:</label>
          <input type="number" step="0.0001" value={latitude} onChange={(e) => setLatitude(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Longitude:</label>
          <input type="number" step="0.0001" value={longitude} onChange={(e) => setLongitude(e.target.value)} />
        </div>
      </div>
      <button onClick={updateLocation} className="btn-secondary">Update Location</button>

      <h3>Accept Ride</h3>
      <div className="form-group">
        <label>Ride ID:</label>
        <input 
          type="text" 
          value={rideId} 
          onChange={(e) => setRideId(e.target.value)}
          placeholder="Enter ride ID from Rider view"
        />
      </div>
      <button onClick={acceptRide} className="btn-primary">Accept Ride</button>

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default DriverView;
