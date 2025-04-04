const express = require("express");
const rateLimit = require("express-rate-limit");

const { ServerConfig } = require("./config");
const { sequelize } = require("./models");
const { createProxyMiddleware } = require("http-proxy-middleware");
const apiRoutes = require("./routes");
const app = express();

// Middleware để parse body JSON và URL-encoded
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20, // Limit each IP to 20 requests per `window` (here, per 1 minutes)
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use(limiter);

// Proxy cho flightService
app.use(
  "/flightService",
  createProxyMiddleware({
    target: ServerConfig.FLIGHT_SERVICE,
    changeOrigin: true,
    pathRewrite: { "^/flightService": "/" },
  })
);

// Proxy cho bookingService
app.use(
  "/bookingService",
  createProxyMiddleware({
    target: ServerConfig.BOOKING_SERVICE,
    changeOrigin: true,
    pathRewrite: { "^/bookingService": "/" },
  })
);

app.use("/api", apiRoutes);

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log("Successfully connected to the database (MySQL)");

    app.listen(ServerConfig.PORT, () => {
      console.log(`Successfully started the server on PORT: ${ServerConfig.PORT}`);
    });
  } catch (error) {
    console.error("Failed to start the server:", error);
    process.exit(1);
  }
}

startServer();