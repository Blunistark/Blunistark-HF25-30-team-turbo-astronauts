const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 8000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// In-memory storage for fleet state
let fleetState = {
    status: 'stopped',
    drones: {},
    deliveries: [],
    stats: {
        total_deliveries: 0,
        successful_deliveries: 0,
        failed_deliveries: 0,
        average_delivery_time: 0,
        total_distance: 0,
        total_flight_time: 0
    }
};

// Helper function to generate random drone data
const generateDroneData = (id) => {
    const statuses = ['idle', 'en_route', 'charging', 'maintenance'];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
        id,
        status,
        battery_level: Math.floor(Math.random() * 100),
        location: {
            lat: 12.9716 + (Math.random() - 0.5) * 0.1,
            lon: 77.5946 + (Math.random() - 0.5) * 0.1,
            altitude: Math.floor(Math.random() * 100)
        },
        current_delivery: status === 'en_route' ? {
            id: `delivery_${Math.floor(Math.random() * 1000)}`,
            status: 'in_progress',
            start_time: new Date().toISOString(),
            pickup_location: {
                lat: 12.9716,
                lon: 77.5946
            },
            delivery_location: {
                lat: 12.9716 + (Math.random() - 0.5) * 0.1,
                lon: 77.5946 + (Math.random() - 0.5) * 0.1
            }
        } : null,
        total_distance: Math.floor(Math.random() * 1000),
        total_flight_time: Math.floor(Math.random() * 3600)
    };
};

// Helper function to generate statistics
const generateStatistics = () => {
    return {
        total_deliveries: Math.floor(Math.random() * 100),
        successful_deliveries: Math.floor(Math.random() * 80),
        failed_deliveries: Math.floor(Math.random() * 20),
        average_delivery_time: Math.floor(Math.random() * 1800),
        total_distance: Math.floor(Math.random() * 10000),
        total_flight_time: Math.floor(Math.random() * 36000)
    };
};

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// API endpoints
app.post('/api/fleet/start', (req, res) => {
    try {
        fleetState.status = 'running';
        // Initialize drones if not already present
        if (Object.keys(fleetState.drones).length === 0) {
            for (let i = 1; i <= 5; i++) {
                fleetState.drones[`drone_${i}`] = generateDroneData(`drone_${i}`);
            }
        }
        res.json({ status: 'success', message: 'Fleet started successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to start fleet' });
    }
});

app.post('/api/fleet/pause', (req, res) => {
    try {
        fleetState.status = 'paused';
        res.json({ status: 'success', message: 'Fleet paused successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to pause fleet' });
    }
});

app.post('/api/fleet/resume', (req, res) => {
    try {
        fleetState.status = 'running';
        res.json({ status: 'success', message: 'Fleet resumed successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to resume fleet' });
    }
});

app.post('/api/fleet/reset', (req, res) => {
    try {
        fleetState = {
            status: 'stopped',
            drones: {},
            deliveries: [],
            stats: {
                total_deliveries: 0,
                successful_deliveries: 0,
                failed_deliveries: 0,
                average_delivery_time: 0,
                total_distance: 0,
                total_flight_time: 0
            }
        };
        res.json({ status: 'success', message: 'Fleet reset successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to reset fleet' });
    }
});

app.get('/api/fleet/status', (req, res) => {
    try {
        if (fleetState.status === 'running') {
            // Update drone data
            Object.keys(fleetState.drones).forEach(id => {
                fleetState.drones[id] = generateDroneData(id);
            });
            // Update statistics
            fleetState.stats = generateStatistics();
        }
        res.json(fleetState);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch fleet status' });
    }
});

app.get('/api/fleet/statistics/current', (req, res) => {
    try {
        res.json(fleetState.stats);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch current statistics' });
    }
});

app.get('/api/fleet/statistics/historical', (req, res) => {
    try {
        // Generate historical data
        const historicalData = Array.from({ length: 24 }, (_, i) => ({
            timestamp: new Date(Date.now() - (23 - i) * 3600000).toISOString(),
            ...generateStatistics()
        }));
        res.json(historicalData);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch historical statistics' });
    }
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${port}`);
}); 