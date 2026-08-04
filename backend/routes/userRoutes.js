const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Order = require('../models/Order');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const Razorpay = require('razorpay');
const indianLocations = require('../data/indianLocations');

const titleCase = (str) => String(str || '').charAt(0).toUpperCase() + String(str || '').slice(1);

const LOCATION_SEARCH_CACHE = new Map();
const LOCATION_SEARCH_TTL = 15 * 60 * 1000;

// Live locality search via the free India Post pincode API,
// merged with the curated list and any areas already in the fleet.
const searchLocalities = async (q) => {
    const key = q.toLowerCase();
    if (LOCATION_SEARCH_CACHE.has(key)) {
        const cached = LOCATION_SEARCH_CACHE.get(key);
        if (Date.now() - cached.time < LOCATION_SEARCH_TTL) return cached.results;
        LOCATION_SEARCH_CACHE.delete(key);
    }

    const matches = [];
    const seen = new Set();
    const add = (name, district, state, pincode) => {
        const dk = `${String(name).toLowerCase()}|${String(district).toLowerCase()}`;
        if (seen.has(dk)) return;
        seen.add(dk);
        matches.push({ name, district, state, pincode });
    };

    indianLocations.forEach(({ city, localities }) => {
        if (city.toLowerCase().includes(key)) add(city, city, '', '');
        localities.forEach(loc => {
            if (loc.toLowerCase().includes(key)) add(loc, city, '', '');
        });
    });

    const vehicles = await Vehicle.find({ approved: true }).select('district location');
    vehicles.forEach(v => {
        if (v.district && String(v.district).toLowerCase().includes(key)) add(String(v.district), String(v.district), '', '');
        if (v.location && v.district && String(v.location).toLowerCase().includes(key)) add(String(v.location), String(v.district), '', '');
    });

    try {
        const res = await fetch(`https://api.postalpincode.in/postoffice/${encodeURIComponent(q)}`, {
            signal: AbortSignal.timeout(8000)
        });
        if (res.ok) {
            const data = await res.json();
            if (Array.isArray(data) && data[0]?.Status === 'Success' && Array.isArray(data[0].PostOffice)) {
                data[0].PostOffice.forEach(o => {
                    if (o.Name) add(o.Name, o.District, o.State, o.Pincode);
                });
            }
        }
    } catch (err) {
        // Upstream offline — fall back to curated/fleet matches only
    }

    const results = matches.slice(0, 12);
    LOCATION_SEARCH_CACHE.set(key, { results, time: Date.now() });
    return results;
};

// Get all available vehicles
router.get('/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ approved: true });
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get Indian cities with their localities for the search UI
// (curated list merged with any districts already present in the fleet)
router.get('/locations', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ approved: true }).select('district location');
        const dbDistricts = {};
        vehicles.forEach(v => {
            if (!v.district) return;
            const key = String(v.district).trim().toLowerCase();
            if (!key) return;
            if (!dbDistricts[key]) dbDistricts[key] = new Set();
            if (v.location) dbDistricts[key].add(String(v.location).trim());
        });

        const cities = indianLocations.map(({ city, localities }) => {
            const key = city.toLowerCase();
            const extra = dbDistricts[key];
            if (extra) {
                delete dbDistricts[key];
                return { city, localities: [...new Set([...localities, ...extra])] };
            }
            return { city, localities };
        });

        // Any fleet districts not in the curated list still appear in the dropdown
        Object.keys(dbDistricts).forEach(key => {
            cities.push({ city: titleCase(key), localities: [...dbDistricts[key]] });
        });

        cities.sort((a, b) => a.city.localeCompare(b.city));
        res.json({ cities });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Live locality search (typeahead) for the search UI
router.get('/locations/search', async (req, res) => {
    try {
        const q = String(req.query.q || '').trim();
        if (q.length < 2) return res.json({ results: [] });
        const results = await searchLocalities(q);
        res.json({ results });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Create razorpay order setup
router.post('/create-order', auth, async (req, res) => {
    try {
        const { amount } = req.body;
        if (!process.env.RAZORPAY_KEY_ID) {
            return res.json({
                id: "simulated_order_" + Date.now(),
                amount: amount * 100,
                currency: "INR"
            });
        }
        const instance = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });
        const options = { amount: amount * 100, currency: "INR", receipt: "rcpt_" + Date.now() };
        const order = await instance.orders.create(options);
        res.json(order);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Book a vehicle
router.post('/book', auth, async (req, res) => {
    try {
        const { vehicleId, startDate, endDate, pickupLocation, pickupDistrict, totalCost } = req.body;
        const newOrder = new Order({
            user: req.user.id,
            vehicle: vehicleId,
            startDate,
            endDate,
            pickupLocation,
            pickupDistrict,
            totalCost
        });
        await newOrder.save();
        res.status(201).json(newOrder);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Get user orders (Past and Upcoming)
router.get('/orders', auth, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).populate('vehicle');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Update Profile
router.put('/profile', auth, async (req, res) => {
    try {
        const { name, picture } = req.body;
        const updatedUser = await User.findByIdAndUpdate(req.user.id, { name, picture }, { new: true });
        res.json(updatedUser);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Rate a vehicle
router.post('/vehicles/:id/rate', auth, async (req, res) => {
    try {
        const { rating } = req.body;
        const vehicle = await Vehicle.findById(req.params.id);
        if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });

        // Find if user already rated it
        const existingIndex = vehicle.ratings.findIndex(r => r.user.toString() === req.user.id);
        if (existingIndex > -1) {
            vehicle.ratings[existingIndex].rating = rating;
        } else {
            vehicle.ratings.push({ user: req.user.id, rating });
        }

        await vehicle.save();
        res.json(vehicle);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Compatibility route with standard 'Rent a Ride' search from Home page UI
router.post('/showSingleofSameModel', async (req, res) => {
    try {
        const { pickUpDistrict, pickUpLocation, pickupDate, dropOffDate } = req.body;

        let query = { approved: true };
        if (pickUpDistrict) query.district = { $regex: new RegExp(`^${pickUpDistrict}$`, 'i') };
        if (pickUpLocation) query.location = { $regex: new RegExp(`^${pickUpLocation}$`, 'i') };

        // Strict temporal filtering against vendor availability
        if (pickupDate && dropOffDate) {
            query.availableFrom = { $lte: new Date(pickupDate) };
            query.availableUntil = { $gte: new Date(dropOffDate) };
        }

        const vehicles = await Vehicle.find(query);
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
