import React, { useState, useEffect } from 'react';
import Map from './components/Map';
import DroneVisualization from './components/DroneVisualization';
import './App.css';

const API_BASE_URL = 'http://localhost:8000/api';

function App() {
  const [drones, setDrones] = useState({});
  const [fleetStatus, setFleetStatus] = useState('stopped');
  const [statistics, setStatistics] = useState(null);
  const [viewMode, setViewMode] = useState('map');
  const [selectedDrone, setSelectedDrone] = useState(null);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [simulationSpeed, setSimulationSpeed] = useState(1);

  // Enhanced error handling
  const handleApiError = (error, action) => {
    console.error(`Error during ${action}:`, error);
    setError(`Failed to ${action}: ${error.message}`);
    // Reset relevant state on error
    if (action.includes('fetch')) {
      setDrones({});
      setStatistics(null);
    }
  };

  // Fetch fleet status and update drones with validation
  const fetchFleetStatus = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/fleet/status`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Validate data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid data format received from server');
      }

      // Ensure drones object exists and is properly structured
      const validatedDrones = data.drones || {};
      Object.entries(validatedDrones).forEach(([id, drone]) => {
        if (!drone.location || !drone.status) {
          console.warn(`Invalid drone data for ${id}:`, drone);
          validatedDrones[id] = {
            ...drone,
            location: drone.location || { lat: 12.9716, lon: 77.5946, altitude: 0 },
            status: drone.status || 'idle',
            battery_level: drone.battery_level || 100,
            current_delivery: drone.current_delivery || null,
            total_distance: drone.total_distance || 0,
            total_flight_time: drone.total_flight_time || 0
          };
        }
      });

      setDrones(validatedDrones);
      setStatistics(data.stats || null);
      setError(null);
    } catch (error) {
      handleApiError(error, 'fetch fleet status');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch current statistics
  const fetchStatistics = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching statistics from:', `${API_BASE_URL}/fleet/statistics/current`);
      const response = await fetch(`${API_BASE_URL}/fleet/statistics/current`);
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Received statistics:', data);
      
      setStatistics(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError(`Failed to fetch statistics: ${error.message}`);
      setStatistics(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Enhanced fleet control functions
  const startFleet = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${API_BASE_URL}/fleet/start`, { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setFleetStatus('running');
      setError(null);
      fetchFleetStatus();
    } catch (error) {
      handleApiError(error, 'start fleet');
    } finally {
      setIsLoading(false);
    }
  };

  const pauseFleet = async () => {
    try {
      setIsLoading(true);
      console.log('Pausing fleet...');
      const response = await fetch(`${API_BASE_URL}/fleet/pause`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Pause response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Pause response:', data);
      
      setFleetStatus('paused');
      setError(null);
    } catch (error) {
      console.error('Error pausing fleet:', error);
      setError(`Failed to pause fleet: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resumeFleet = async () => {
    try {
      setIsLoading(true);
      console.log('Resuming fleet...');
      const response = await fetch(`${API_BASE_URL}/fleet/resume`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Resume response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Resume response:', data);
      
      setFleetStatus('running');
      setError(null);
    } catch (error) {
      console.error('Error resuming fleet:', error);
      setError(`Failed to resume fleet: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFleet = async () => {
    try {
      setIsLoading(true);
      console.log('Resetting fleet...');
      const response = await fetch(`${API_BASE_URL}/fleet/reset`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Reset response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Reset response:', data);
      
      setFleetStatus('stopped');
      setDrones({});
      setStatistics(null);
      setError(null);
    } catch (error) {
      console.error('Error resetting fleet:', error);
      setError(`Failed to reset fleet: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Update data periodically with configurable interval
  useEffect(() => {
    let interval;
    if (fleetStatus === 'running') {
      fetchFleetStatus();
      interval = setInterval(fetchFleetStatus, 5000 / simulationSpeed);
    }
    return () => clearInterval(interval);
  }, [fleetStatus, simulationSpeed]);

  return (
    <div className="app">
      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-spinner"></div>
          <p>Loading...</p>
        </div>
      )}
      
      {error && (
        <div className="error-message">
          <span className="error-icon">⚠️</span>
          {error}
        </div>
      )}
      
      <div className="header">
        <h1>Drone Fleet Management System</h1>
        <div className="status-indicator">
          <span className={`status-dot ${fleetStatus}`}></span>
          <span className="status-text">Fleet Status: {fleetStatus.toUpperCase()}</span>
        </div>
      </div>

      <div className="main-content">
        <div className="sidebar">
          <div className="view-controls">
            <button 
              className={`view-button ${viewMode === 'map' ? 'active' : ''}`} 
              onClick={() => setViewMode('map')}
              disabled={isLoading}
            >
              <span className="icon">🗺️</span>
              2D Map View
            </button>
            <button 
              className={`view-button ${viewMode === '3d' ? 'active' : ''}`} 
              onClick={() => setViewMode('3d')}
              disabled={isLoading}
            >
              <span className="icon">🌐</span>
              3D View
            </button>
          </div>

          <div className="fleet-controls">
            <button 
              className={`control-button ${fleetStatus === 'running' ? 'active' : ''}`}
              onClick={startFleet} 
              disabled={fleetStatus === 'running' || isLoading}
            >
              <span className="icon">▶️</span>
              Start Fleet
            </button>
            <button 
              className={`control-button ${fleetStatus === 'paused' ? 'active' : ''}`}
              onClick={pauseFleet} 
              disabled={fleetStatus !== 'running' || isLoading}
            >
              <span className="icon">⏸️</span>
              Pause Fleet
            </button>
            <button 
              className={`control-button ${fleetStatus === 'running' ? 'active' : ''}`}
              onClick={resumeFleet} 
              disabled={fleetStatus !== 'paused' || isLoading}
            >
              <span className="icon">⏯️</span>
              Resume Fleet
            </button>
            <button 
              className="control-button reset"
              onClick={resetFleet}
              disabled={isLoading}
            >
              <span className="icon">🔄</span>
              Reset Fleet
        </button>
          </div>

          <div className="drone-list">
            <h3>Active Drones</h3>
            <div className="drone-cards">
              {drones && Object.entries(drones).map(([id, drone]) => (
                <div 
                  key={id} 
                  className={`drone-card ${selectedDrone === id ? 'selected' : ''} ${drone.status}`}
                  onClick={() => setSelectedDrone(id)}
                >
                  <div className="drone-header">
                    <h4>{id}</h4>
                    <span className={`status-indicator ${drone.status}`}></span>
                  </div>
                  <div className="drone-info">
                    <div className="info-row">
                      <span className="label">Status:</span>
                      <span className="value">{drone.status}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Battery:</span>
                      <div className="battery-indicator">
                        <div 
                          className="battery-level" 
                          style={{ width: `${drone.battery_level}%` }}
                        ></div>
                        <span className="battery-text">{drone.battery_level?.toFixed(1)}%</span>
                      </div>
                    </div>
                    <div className="info-row">
                      <span className="label">Altitude:</span>
                      <span className="value">{drone.location?.altitude?.toFixed(1)}m</span>
                    </div>
                    {drone.current_delivery && (
                      <div className="delivery-info">
                        <div className="info-row">
                          <span className="label">Delivery ID:</span>
                          <span className="value">{drone.current_delivery.id}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Status:</span>
                          <span className="value">{drone.current_delivery.status}</span>
                        </div>
                        <div className="info-row">
                          <span className="label">Started:</span>
                          <span className="value">
                            {new Date(drone.current_delivery.start_time).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="visualization-container">
          {viewMode === 'map' ? (
            <Map drones={drones} selectedDrone={selectedDrone} />
          ) : (
            <DroneVisualization drones={drones} selectedDrone={selectedDrone} />
          )}
        </div>
      </div>

      {statistics && (
        <div className="statistics-panel">
          <h3>Fleet Statistics</h3>
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">🚁</div>
              <div className="stat-content">
                <span className="stat-label">Total Drones</span>
                <span className="stat-value">{statistics.total_drones}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✈️</div>
              <div className="stat-content">
                <span className="stat-label">Active Drones</span>
                <span className="stat-value">{statistics.active_drones}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏳</div>
              <div className="stat-content">
                <span className="stat-label">Idle Drones</span>
                <span className="stat-value">{statistics.idle_drones}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔋</div>
              <div className="stat-content">
                <span className="stat-label">Charging Drones</span>
                <span className="stat-value">{statistics.charging_drones}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📦</div>
              <div className="stat-content">
                <span className="stat-label">Total Deliveries</span>
                <span className="stat-value">{statistics.total_deliveries}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <span className="stat-label">Completed Deliveries</span>
                <span className="stat-value">{statistics.completed_deliveries}</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⚡</div>
              <div className="stat-content">
                <span className="stat-label">Avg Battery</span>
                <span className="stat-value">{statistics.avg_battery_level?.toFixed(1)}%</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-content">
                <span className="stat-label">Avg Waiting Time</span>
                <span className="stat-value">{statistics.avg_waiting_time?.toFixed(1)}s</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
