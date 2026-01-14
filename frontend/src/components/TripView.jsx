import { useState } from 'react';
import API_BASE_URL from '../config';

function TripView() {
  const [tripId, setTripId] = useState('');
  const [tripData, setTripData] = useState(null);
  const [paymentData, setPaymentData] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const endTrip = async () => {
    setError('');
    setMessage('');
    if (!tripId) {
      setError('Please enter a trip ID');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/trips/${tripId}/end`, {
        method: 'POST',
      });

      const data = await response.json();
      if (response.ok && data.data) {
        setTripData(data.data);
        setMessage('Trip ended successfully!');
      } else {
        setError(data.message || 'Failed to end trip');
      }
    } catch (err) {
      setError('Error ending trip: ' + err.message);
    }
  };

  const processPayment = async () => {
    setError('');
    setMessage('');
    if (!tripId) {
      setError('Please enter a trip ID');
      return;
    }

    if (!tripData || !tripData.fare) {
      setError('Please end the trip first to get the fare');
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tripId,
          amount: tripData.fare,
        }),
      });

      const data = await response.json();
      if (response.ok && data.data) {
        setPaymentData(data.data);
        setMessage('Payment processed successfully!');
      } else {
        setError(data.message || 'Failed to process payment');
      }
    } catch (err) {
      setError('Error processing payment: ' + err.message);
    }
  };

  return (
    <div className="view">
      <h2>🏁 Trip & Payment View</h2>
      
      <div className="form-group">
        <label>Trip ID:</label>
        <input 
          type="text" 
          value={tripId} 
          onChange={(e) => setTripId(e.target.value)}
          placeholder="Enter trip ID from Rider view"
        />
      </div>

      <button onClick={endTrip} className="btn-primary">End Trip</button>

      {tripData && (
        <div className="status-card">
          <h3>Trip Details</h3>
          <p><strong>Trip ID:</strong> {tripData.id}</p>
          <p><strong>Status:</strong> <span className="status-badge">{tripData.status}</span></p>
          <p><strong>Fare:</strong> ${tripData.fare?.toFixed(2)}</p>
          <p><strong>Distance:</strong> {tripData.distance?.toFixed(2)} km</p>
          {tripData.endTime && <p><strong>End Time:</strong> {new Date(tripData.endTime).toLocaleString()}</p>}
        </div>
      )}

      {tripData && (
        <>
          <h3>Process Payment</h3>
          <button onClick={processPayment} className="btn-success">Process Payment (${tripData.fare?.toFixed(2)})</button>
        </>
      )}

      {paymentData && (
        <div className="status-card success-card">
          <h3>Payment Confirmation</h3>
          <p><strong>Payment ID:</strong> {paymentData.id}</p>
          <p><strong>Status:</strong> <span className="status-badge">{paymentData.status}</span></p>
          <p><strong>Amount:</strong> ${paymentData.amount?.toFixed(2)}</p>
          <p><strong>Method:</strong> {paymentData.paymentMethod}</p>
        </div>
      )}

      {message && <div className="success">{message}</div>}
      {error && <div className="error">{error}</div>}
    </div>
  );
}

export default TripView;
