const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Order = require('../models/Order');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const Razorpay = require('razorpay');

// Get all available vehicles
router.get('/vehicles', async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ approved: true });
        res.json(vehicles);
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
