const jwt = require('jsonwebtoken');
const Users = require('../model/Users');

const ACCESS_TOKEN_TTL = '1h';
const REFRESH_TOKEN_TTL = '7d';

const cookieOptions = {
    httpOnly: true,
    secure: true,
    path: '/',
    sameSite: 'None'
};

// Shape of the user object stored in the JWT and returned to the client.
// Never include password hashes or reset codes here.
const buildUserPayload = (data) => ({
    id: data._id.toString(),
    name: data.name,
    email: data.email,
    role: data.role ? data.role : 'admin',
    adminId: data.adminId ? data.adminId.toString() : undefined,
    credits: data.credits,
    subscription: data.subscription
});

const setAuthCookies = (response, user) => {
    const accessToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
    const refreshToken = jwt.sign(user, process.env.JWT_REFRESH_TOKEN_SECRET, { expiresIn: REFRESH_TOKEN_TTL });
    response.cookie('jwtToken', accessToken, cookieOptions);
    response.cookie('refreshToken', refreshToken, cookieOptions);
};

const clearAuthCookies = (response) => {
    response.clearCookie('jwtToken', cookieOptions);
    response.clearCookie('refreshToken', cookieOptions);
};

// Verifies the refresh token, reloads the user from the DB (credits and
// subscription can change during the refresh token's lifetime) and issues a
// new access token. Throws if the refresh token is invalid or the user is gone.
const attemptToRefreshToken = async (refreshToken) => {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_TOKEN_SECRET);
    const data = await Users.findById(decoded.id);
    if (!data) {
        throw new Error('User for refresh token no longer exists');
    }

    const user = buildUserPayload(data);
    const newAccessToken = jwt.sign(user, process.env.JWT_SECRET, { expiresIn: ACCESS_TOKEN_TTL });
    return { newAccessToken, user };
};

module.exports = {
    attemptToRefreshToken,
    buildUserPayload,
    setAuthCookies,
    clearAuthCookies,
    cookieOptions
};
