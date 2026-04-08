const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    googleId: { type: String, sparse: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String },
    name: { type: String, required: true },
    picture: { type: String },
    role: { type: String, enum: ["user", "vendor"], default: "user" }
}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
