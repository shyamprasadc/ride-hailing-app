import { useState, useEffect } from 'react';
import API_BASE_URL from '../config';

function DriverView() {
  const [drivers, setDrivers] = useState([]);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [latitude, setLatitude] = useState('37.7849');
  const [longitude, setLongitude] = useState('-122.4094');
  const [nearbyRides, setNearbyRides] = useState([]);
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

  // Fetch nearby rides when driver changes or periodically
  useEffect(() => {
    if (!selectedDriver) return;

    const fetchNearbyRides = () => {
      fetch(`${API_BASE_URL}/drivers/${selectedDriver}/nearby-rides?radius=10`)
        .then(res => res.json())
        .then(data => {
          if (data && data.data && Array.isArray(data.data)) {
            setNearbyRides(data.data);
          }
        })
        .catch(() => {});
    };

    // Fetch immediately
    fetchNearbyRides();

    // Poll every 5 seconds
    const interval = setInterval(fetchNearbyRides, 5000);

    return () => clearInterval(interval);
  }, [selectedDriver]);

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

  const acceptRide = async (rideId) => {
    setError('');
    setMessage('');

    try {
      const response = await fetch(`${API_BASE_URL}/drivers/${selectedDriver}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage('Ride accepted successfully!');
        // Remove accepted ride from list
        setNearbyRides(nearbyRides.filter(ride => ride.id !== rideId));
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

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}

      <h3>Nearby Ride Requests ({nearbyRides.length})</h3>
      {nearbyRides.length === 0 ? (
        <p className="info-message">No nearby ride requests at the moment.</p>
      ) : (
        <div className="nearby-rides-list">
          {nearbyRides.map(ride => (
            <div key={ride.id} className="ride-card">
              <div className="ride-info">
                <p><strong>Ride ID:</strong> {ride.id}</p>
                <p><strong>Rider:</strong> {ride.rider.name}</p>
                <p><strong>Pickup:</strong> ({ride.pickup.latitude.toFixed(4)}, {ride.pickup.longitude.toFixed(4)})</p>
                <p><strong>Destination:</strong> ({ride.destination.latitude.toFixed(4)}, {ride.destination.longitude.toFixed(4)})</p>
                <p><strong>Distance:</strong> {ride.distance.toFixed(2)} km</p>
                <p><strong>Tier:</strong> {ride.tier}</p>
              </div>
              <button onClick={() => acceptRide(ride.id)} className="btn-primary">Accept Ride</button>
            </div>
          ))}
        </div>
      )}


    </div>
  );
}

export default DriverView;
