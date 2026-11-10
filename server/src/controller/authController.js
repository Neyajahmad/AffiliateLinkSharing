const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Users = require('../model/Users');
const { OAuth2Client } = require('google-auth-library');
const { validationResult } = require('express-validator');
const send = require('../service/emailService');
const {
    attemptToRefreshToken,
    buildUserPayload,
    setAuthCookies,
    clearAuthCookies,
    cookieOptions
} = require('../util/authUtil');

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const authController = {
    login: async (request, response) => {
        try {
            const errors = validationResult(request);
            if (!errors.isEmpty()) {
                return response.status(401).json({
                    message: 'Invalid email or password',
                    errors: errors.array()
                });
            }

            const { username, password } = request.body;
            const data = await Users.findOne({ email: String(username).trim() });

            // Google-only accounts have no password set.
            if (!data || !data.password) {
                return response.status(401).json({ message: 'Invalid email or password' });
            }

            const isMatch = await bcrypt.compare(password, data.password);
            if (!isMatch) {
                return response.status(401).json({ message: 'Invalid email or password' });
            }

            const user = buildUserPayload(data);
            setAuthCookies(response, user);
            response.json({ user: user, message: 'User authenticated' });
        } catch (error) {
            console.log(error);
            response.status(500).json({ message: 'Internal server error' });
        }
    },

    logout: (request, response) => {
        clearAuthCookies(response);
        response.json({ message: 'Logout successful' });
    },

    isUserLoggedIn: async (request, response) => {
        const token = request.cookies?.jwtToken;
        const refreshToken = request.cookies?.refreshToken;

        try {
            let userId = null;
            if (token) {
                try {
                    userId = jwt.verify(token, process.env.JWT_SECRET).id;
                } catch (error) {
                    // Expired or invalid access token: try the refresh token below.
                }
            }

            if (!userId && refreshToken) {
                const { newAccessToken, user } = await attemptToRefreshToken(refreshToken);
                response.cookie('jwtToken', newAccessToken, cookieOptions);
                return response.json({ message: 'User is logged in', user: user });
            }

            if (!userId) {
                return response.status(401).json({ message: 'Unauthorized access' });
            }

            const data = await Users.findById(userId);
            if (!data) {
                clearAuthCookies(response);
                return response.status(401).json({ message: 'Unauthorized access' });
            }

            return response.json({ message: 'User is logged in', user: buildUserPayload(data) });
        } catch (error) {
            console.log('isUserLoggedIn failed:', error.message);
            return response.status(401).json({ message: 'Unauthorized access' });
        }
    },

    register: async (request, response) => {
        try {
            const { username, password, name } = request.body;
            const email = String(username || '').trim();

            if (!name || !String(name).trim()) {
                return response.status(400).json({ message: 'Name is required' });
            }
            if (!EMAIL_PATTERN.test(email)) {
                return response.status(400).json({ message: 'Please enter a valid email address' });
            }
            if (!password || String(password).length < 6) {
                return response.status(400).json({ message: 'Password must be at least 6 characters long' });
            }

            const existing = await Users.findOne({ email: email });
            if (existing) {
                return response.status(401)
                    .json({ message: 'An account already exists with this email' });
            }

            const encryptedPassword = await bcrypt.hash(password, 10);
            const data = await Users.create({
                email: email,
                password: encryptedPassword,
                name: String(name).trim(),
                role: 'admin'
            });

            const user = buildUserPayload(data);
            setAuthCookies(response, user);
            response.json({ message: 'User registered', user: user });
        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    },

    googleAuth: async (request, response) => {
        const { idToken } = request.body || {};
        if (!idToken) {
            return response.status(401).json({ message: 'Invalid request' });
        }

        const clientId = process.env.GOOGLE_CLIENT_ID;
        if (!clientId) {
            console.log('Google sign-in failed: GOOGLE_CLIENT_ID is not set on the server');
            return response.status(500).json({
                message: 'Google sign-in is not configured on the server'
            });
        }

        let payload;
        try {
            const googleClient = new OAuth2Client(clientId);
            const ticket = await googleClient.verifyIdToken({
                idToken: idToken,
                audience: clientId
            });
            payload = ticket.getPayload();
        } catch (error) {
            // Most common cause: the server's GOOGLE_CLIENT_ID differs from the
            // client ID the frontend used (REACT_APP_GOOGLE_CLIENT_ID).
            console.log('Google token verification failed:', error.message);
            return response.status(401).json({
                message: 'Google sign-in failed: the Google token could not be verified'
            });
        }

        try {
            const { sub: googleId, name, email, email_verified: emailVerified } = payload;
            if (!email || emailVerified === false) {
                return response.status(401).json({
                    message: 'Your Google account email is not verified'
                });
            }

            let data = await Users.findOne({ email: email });
            if (!data) {
                data = await Users.create({
                    email: email,
                    name: name || email.split('@')[0],
                    isGoogleUser: true,
                    googleId: googleId,
                    role: 'admin'
                });
            }

            const user = buildUserPayload(data);
            setAuthCookies(response, user);
            response.json({ user: user, message: 'User authenticated' });
        } catch (error) {
            console.log(error);
            return response.status(500).json({ message: 'Internal server error' });
        }
    },

    sendResetPasswordToken: async (req, res) => {
        try {
            const { email } = req.body;
            if (!email) return res.status(400).json({ message: 'Email is required' });
            const user = await Users.findOne({ email });
            if (user) {
                // Generate 6-digit code
                const code = Math.floor(100000 + Math.random() * 900000).toString();
                const expiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
                user.resetPasswordCode = code;
                user.resetPasswordCodeExpiry = expiry;
                try {
                    await user.save();
                } catch (saveErr) {
                    console.error('Error saving user with reset code:', saveErr);
                }
                try {
                    await send(email, 'Your Password Reset Code', `Your password reset code is: ${code}`);
                } catch (emailErr) {
                    console.error('Error sending reset code email:', emailErr);
                }
            }
            // Always return a generic message
            return res.json({ message: 'If the email exists, a reset code has been sent.' });
        } catch (err) {
            console.error(err);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },

    /**
     * Resets the user's password if the code is valid and not expired.
     * Body: { email, code, newPassword }
     */
    resetPassword: async (req, res) => {
        try {
            const { email, code, newPassword } = req.body;
            if (!email || !code || !newPassword) {
                return res.status(400).json({ message: 'Email, code, and newPassword are required' });
            }
            if (String(newPassword).length < 6) {
                return res.status(400).json({ message: 'Password must be at least 6 characters long' });
            }
            const user = await Users.findOne({ email }).lean();
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            if (!user.resetPasswordCode || !user.resetPasswordCodeExpiry) {
                return res.status(400).json({ message: 'No reset code found. Please request a new one.' });
            }
            if (user.resetPasswordCode !== code) {
                return res.status(400).json({ message: 'Invalid reset code' });
            }
            if (user.resetPasswordCodeExpiry < new Date()) {
                return res.status(400).json({ message: 'Reset code expired' });
            }
            const hashed = await bcrypt.hash(newPassword, 10);
            await Users.updateOne({ email }, {
                $set: { password: hashed },
                $unset: { resetPasswordCode: '', resetPasswordCodeExpiry: '' }
            });
            return res.json({ message: 'Password reset successful' });
        } catch (err) {
            console.error('RESET PASSWORD ERROR:', err);
            return res.status(500).json({ message: 'Internal server error' });
        }
    },
};

module.exports = authController;
