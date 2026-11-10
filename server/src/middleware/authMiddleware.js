const jwt = require('jsonwebtoken');
const { attemptToRefreshToken, cookieOptions } = require('../util/authUtil');

const authMiddleware = {
    protect: async (request, response, next) => {
        const token = request.cookies?.jwtToken;
        const refreshToken = request.cookies?.refreshToken;

        if (!token && !refreshToken) {
            return response.status(401).json({ error: 'Unauthorized access' });
        }

        if (token) {
            try {
                request.user = jwt.verify(token, process.env.JWT_SECRET);
                return next();
            } catch (error) {
                // Access token expired or invalid: fall through to refresh.
            }
        }

        if (!refreshToken) {
            return response.status(401).json({ error: 'Unauthorized access' });
        }

        try {
            const { newAccessToken, user } = await attemptToRefreshToken(refreshToken);
            response.cookie('jwtToken', newAccessToken, cookieOptions);
            request.user = user;
            return next();
        } catch (error) {
            console.log('Refresh token rejected:', error.message);
            return response.status(401).json({ error: 'Unauthorized access' });
        }
    },
};

module.exports = authMiddleware;
