const { StatusCodes } = require("http-status-codes");
const { ErrorResponse } = require("../utils/common");
const { UserService } = require("../services");

// Development mock user data
const DEV_USER = {
  id: 1,
  email: "dev@example.com",
  isAdmin: true,
  isFlightCompany: true
};

function validateAuthRequest(req, res, next) {
  if (!req.body.email) {
    ErrorResponse.message = "Something went wrong while authenticating";
    ErrorResponse.explanation = "Email data not found in the request body";
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.password) {
    ErrorResponse.message = "Something went wrong while authenticating";
    ErrorResponse.explanation = "Password not found in the request body";
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  next();
}

async function checkAuth(req, res, next) {
  // Bypass authentication in development
  if (process.env.NODE_ENV === 'development') {
    req.user = DEV_USER;
    console.log("[DEV] Bypassing auth, using mock user:", DEV_USER);
    return next();
  }

  // Production authentication
  try {
    const response = await UserService.isAuthenticated(
      req.headers["x-access-token"]
    );
    if (response) {
      req.user = response;
      next();
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return res.status(error.statusCode || StatusCodes.FORBIDDEN).json(error);
  }
}

async function checkAdmin(req, res, next) {
  // Bypass in development
  if (process.env.NODE_ENV === 'development') {
    console.log("[DEV] Bypassing admin check");
    return next();
  }

  try {
    const response = await UserService.isAdmin(req.user.id);
    if (response) {
      return next();
    }
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "User not authorized to perform the action" });
  } catch (error) {
    console.error("Admin check error:", error);
    return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
}

async function checkFlightCompany(req, res, next) {
  // Bypass in development
  if (process.env.NODE_ENV === 'development') {
    console.log("[DEV] Bypassing flight company check");
    return next();
  }

  try {
    const response = await UserService.isFlightCompany(req.user.id);
    if (response) {
      return next();
    }
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ msg: "User not authorized to perform the action" });
  } catch (error) {
    console.error("Flight company check error:", error);
    return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
}

function validateAddRoleRequest(req, res, next) {
  if (!req.body.role) {
    ErrorResponse.message = "Failed to add a role to the user";
    ErrorResponse.error = new AppError(
      ["The Role was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  if (!req.body.id) {
    ErrorResponse.message = "Failed to add a role to the user";
    ErrorResponse.error = new AppError(
      ["The User ID was not found in the incoming request"],
      StatusCodes.BAD_REQUEST
    );
    return res.status(StatusCodes.BAD_REQUEST).json(ErrorResponse);
  }
  next();
}

async function checkRights(req, res, next) {
  // Bypass in development
  if (process.env.NODE_ENV === 'development') {
    console.log("[DEV] Bypassing rights check");
    return next();
  }

  try {
    const [isAdmin, isFlightCompany] = await Promise.all([
      UserService.isAdmin(req.user.id),
      UserService.isFlightCompany(req.user.id)
    ]);
    
    if (req.method === "GET" || isAdmin || isFlightCompany) {
      return next();
    }
    return res.status(StatusCodes.FORBIDDEN).json({ 
      message: "Access denied",
      explanation: "User is not authorized to perform this action"
    });
  } catch (error) {
    console.error("Rights check error:", error);
    return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json(error);
  }
}

module.exports = {
  validateAuthRequest,
  checkAuth,
  checkAdmin,
  checkFlightCompany,
  validateAddRoleRequest,
  checkRights,
  DEV_USER // Export for testing purposes
};