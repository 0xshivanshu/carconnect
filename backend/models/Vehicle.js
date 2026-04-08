const mongoose = require("mongoose");

const vehicleSchema = new mongoose.Schema({
    vendor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    brand: { type: String, required: true },
    type: { type: String, enum: ['SUV', 'Sedan', 'Hatchback'], required: true },
    transmission: { type: String, enum: ['Automatic', 'Manual'], required: true },
    fuelType: { type: String, enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'] },
    pricePerDay: { type: Number, required: true },
    seats: { type: Number, default: 5 },
    image: { type: String, required: true },
    district: { type: String, default: 'Mumbai', required: true },
    location: { type: String, default: 'Bandra West', required: true },
    availableFrom: { type: Date, required: true, default: Date.now },
    availableUntil: { type: Date, required: true, default: () => Date.now() + 30 * 24 * 60 * 60 * 1000 },
    ratings: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        rating: { type: Number, min: 1, max: 5 }
    }],
    approved: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Vehicle", vehicleSchema);
