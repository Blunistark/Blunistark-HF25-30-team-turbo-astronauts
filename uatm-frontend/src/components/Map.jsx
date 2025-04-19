import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const Map = ({ drones, selectedDrone }) => {
  const mapRef = useRef(null);

  // Custom drone icon
  const getDroneIcon = (status, battery) => {
    const color = status === 'en_route' ? 'blue' : 
                 status === 'charging' ? 'orange' : 'gray';
    
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        background-color: ${color};
        width: 20px;
        height: 20px;
        border-radius: 50%;
        border: 2px solid white;
        box-shadow: 0 0 5px rgba(0,0,0,0.3);
        position: relative;
      ">
        <div style="
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          background: white;
          padding: 2px 5px;
          border-radius: 3px;
          font-size: 10px;
          white-space: nowrap;
          box-shadow: 0 0 3px rgba(0,0,0,0.2);
        ">${battery.toFixed(0)}%</div>
      </div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  // Center map on selected drone
  useEffect(() => {
    if (selectedDrone && drones[selectedDrone] && mapRef.current) {
      const drone = drones[selectedDrone];
      mapRef.current.setView([drone.location.lat, drone.location.lon], 15);
    }
  }, [selectedDrone, drones]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <MapContainer
        center={[12.9716, 77.5946]} // Bangalore coordinates
        zoom={13}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
        zoomControl={true}
        scrollWheelZoom={true}
        doubleClickZoom={true}
        touchZoom={true}
        dragging={true}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
        {Object.entries(drones).map(([id, drone]) => (
          <Marker
            key={id}
            position={[drone.location.lat, drone.location.lon]}
            icon={getDroneIcon(drone.status, drone.battery_level)}
            eventHandlers={{
              click: () => {
                if (mapRef.current) {
                  mapRef.current.setView([drone.location.lat, drone.location.lon], 15);
                }
              }
            }}
          >
            <Popup>
              <div style={{ padding: '5px' }}>
                <h3 style={{ margin: '0 0 5px 0' }}>{id}</h3>
                <p style={{ margin: '2px 0' }}>Status: {drone.status}</p>
                <p style={{ margin: '2px 0' }}>Battery: {drone.battery_level.toFixed(1)}%</p>
                <p style={{ margin: '2px 0' }}>Altitude: {drone.location.altitude.toFixed(1)}m</p>
                <p style={{ margin: '2px 0' }}>Total Distance: {drone.total_distance.toFixed(1)}km</p>
                <p style={{ margin: '2px 0' }}>Flight Time: {(drone.total_flight_time / 3600).toFixed(1)}h</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default Map; 