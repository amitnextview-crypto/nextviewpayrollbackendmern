const tokenService = require('../services/token-service');
const userService = require('../services/user-service');
const ErrorHandler = require('../utils/error-handler');
const { TokenExpiredError } = require('jsonwebtoken');

/**
 * 🔐 Main Authentication Middleware
 */
const auth = async (req, res, next) => {
  const { accessToken: accessTokenFromCookie, refreshToken: refreshTokenFromCookie } = req.cookies;

  try {
    // No access token → unauthorized
    if (!accessTokenFromCookie) {
      return next(ErrorHandler.unAuthorized());
    }

    // ✅ Verify access token
    let userData;
    try {
      userData = await tokenService.verifyAccessToken(accessTokenFromCookie);
      if (!userData) throw new Error(ErrorHandler.unAuthorized());
      req.user = userData;
    } catch (e) {
      console.log('🔒 Token Error:', e.message);

      // ✅ If expired, regenerate from refresh token
      if (e instanceof TokenExpiredError) {
        console.log('⏳ Access token expired — trying refresh...');
        if (!refreshTokenFromCookie) return next(ErrorHandler.unAuthorized());

        // Verify refresh token
        const userDataRefresh = await tokenService.verifyRefreshToken(refreshTokenFromCookie);
        const { _id, email, username, type } = userDataRefresh;
        const tokenRecord = await tokenService.findRefreshToken(_id, refreshTokenFromCookie);
        if (!tokenRecord) return next(ErrorHandler.unAuthorized());

        // Generate new tokens
        const payload = { _id, email, username, type };
        const { accessToken, refreshToken } = tokenService.generateToken(payload);

        // Update refresh token in DB
        await tokenService.updateRefreshToken(_id, refreshTokenFromCookie, refreshToken);

        // Check if user is active
        const user = await userService.findUser({ email });
        if (!user || user.status !== 'active') {
          return next(
            ErrorHandler.unAuthorized('Your account is inactive. Please contact admin.')
          );
        }

        // ✅ Assign user and set cookies
        req.user = user;
       const cookieOptions = {
  httpOnly: true,
  secure: true,
  sameSite: "none",
  path: "/",
  maxAge: 1000 * 60 * 60 * 24 * 30,
};

res.cookie("accessToken", accessToken, cookieOptions);
res.cookie("refreshToken", refreshToken, cookieOptions);

        console.log('✅ Tokens refreshed successfully');
        return next();
      }

      // Other token error
      return next(ErrorHandler.unAuthorized());
    }

    // Token valid
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return next(ErrorHandler.unAuthorized());
  }
};

/**
 * 🧩 Role-based authorization middleware (case-insensitive)
 */
const authRole = (roles = []) => {
  return (req, res, next) => {
    const userRole = req.user?.type?.toLowerCase();
    const allowed = roles.map((r) => r.toLowerCase());
    console.log('🧩 AuthRole Check:', { userRole, allowed });
    if (!req.user || !allowed.includes(userRole)) {
      return next(ErrorHandler.notAllowed());
    }
    next();
  };
};

module.exports = {
  auth,
  authRole,
};
