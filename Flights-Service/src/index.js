const express = require("express");

const { ServerConfig } = require("./config"); // Chỉ import ServerConfig từ ./config
const { sequelize } = require("./models"); // Import sequelize từ models/index.js
const apiRoutes = require("./routes");

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
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