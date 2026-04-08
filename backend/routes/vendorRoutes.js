const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Order = require('../models/Order');
const User = require('../models/User');
const { auth, isVendor } = require('../middleware/auth');

// Get all vehicles for logged-in vendor
router.get('/vehicles', auth, isVendor, async (req, res) => {
    try {
        const vehicles = await Vehicle.find({ vendor: req.user.id });
        res.json(vehicles);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Add a vehicle (Default to disabled/pending approval if you implement an admin flow later)
router.post('/vehicles', auth, isVendor, async (req, res) => {
    try {
        const newVehicle = new Vehicle({
            ...req.body,
            vendor: req.user.id,
            approved: true // Set to false if you want admin approval flow
        });
        await newVehicle.save();
        res.status(201).json(newVehicle);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Delete a vehicle
router.delete('/vehicles/:id', auth, isVendor, async (req, res) => {
    try {
        await Vehicle.findOneAndDelete({ _id: req.params.id, vendor: req.user.id });
        res.json({ message: 'Vehicle deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

// Get orders made for the vendor's vehicles (Notifications/Management)
router.get('/orders', auth, isVendor, async (req, res) => {
    try {
        // Find vehicles owned by vendor
        const vendorVehicles = await Vehicle.find({ vendor: req.user.id }).select('_id');
        const vehicleIds = vendorVehicles.map(v => v._id);

        // Find orders for those vehicles
        const orders = await Order.find({ vehicle: { $in: vehicleIds } })
            .populate('user', 'name email')
            .populate('vehicle', 'name brand');

        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
