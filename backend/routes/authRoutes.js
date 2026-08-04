const express = require('express');
const router = express.Router();
const { OAuth2Client } = require('google-auth-library');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID || 'mock-client-id');
const JWT_SECRET = process.env.JWT_SECRET || 'secret-key-for-jwt-carconnect';

const generateTokenAndSetCookie = (user, role, res) => {
    const token = jwt.sign({ id: user._id, role }, JWT_SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, secure: false, maxAge: 7 * 24 * 3600000, sameSite: 'lax' });
    return token;
};

const sanitizeUser = (user, role) => {
    const obj = user.toObject ? user.toObject() : { ...user };
    delete obj.password;
    return { ...obj, role };
};

// Email/Password Signup
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, role } = req.body;
        if (!email || !password || !name) return res.status(400).json({ message: 'Missing fields' });

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = new User({ email, password: hashedPassword, name, role: role || 'user' });
        await user.save();

        const token = generateTokenAndSetCookie(user, user.role, res);
        res.json({ user: sanitizeUser(user, user.role), token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Email/Password Login
router.post('/login', async (req, res) => {
    try {
        const { email, password, role } = req.body;
        const user = await User.findOne({ email });
        if (!user || !user.password) return res.status(400).json({ message: 'Invalid credentials or login with Google' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        // The portal the user chooses decides the session role. The account is never
        // permanently bound to a single portal, so vendors can also log in as users.
        const sessionRole = (role === 'vendor' || role === 'user') ? role : (user.role || 'user');
        const token = generateTokenAndSetCookie(user, sessionRole, res);
        res.json({ user: sanitizeUser(user, sessionRole), token });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Google Login Original Route
router.post('/google', async (req, res) => {
    try {
        const { token, role } = req.body;
        let payload;

        if (token.startsWith('mock_')) {
            const mockId = token.replace('mock_', '');
            payload = { sub: mockId, email: mockId + '@example.com', name: 'Mock User ' + mockId, picture: '' };
        } else {
            const ticket = await client.verifyIdToken({ idToken: token, audience: process.env.GOOGLE_CLIENT_ID });
            payload = ticket.getPayload();
        }

        const { sub, email, name, picture } = payload;
        let user = await User.findOne({ email });
        if (!user) {
            user = new User({ googleId: sub, email, name, picture, role: role || 'user' });
            await user.save();
        } else if (!user.googleId) {
            user.googleId = sub;
            await user.save();
        }

        const sessionRole = (role === 'vendor' || role === 'user') ? role : (user.role || 'user');
        const authToken = generateTokenAndSetCookie(user, sessionRole, res);
        res.json({ user: sanitizeUser(user, sessionRole), token: authToken });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server Error' });
    }
});

router.get('/me', async (req, res) => {
    try {
        const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');
        if (!token) return res.status(401).json({ message: 'Not authenticated' });
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id);
        if (!user) return res.status(401).json({ message: 'User not found' });
        res.json({ user: sanitizeUser(user, user.role) });
    } catch (err) {
        res.status(401).json({ message: 'Invalid token' });
    }
});

router.post('/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ message: 'Logged out' });
});

module.exports = router;
