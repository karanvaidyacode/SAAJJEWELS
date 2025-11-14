// express_backend/src/server.js
const app = require("./app");
const { connectDB } = require("./config/db");

const PORT = process.env.PORT || 3002;

if (require.main === module) {
  // For local runs we want to ensure DB is connected before listening
  connectDB()
    .then((isConnected) => {
      if (!isConnected) {
        console.warn("Local: DB not connected. Starting server anyway for debugging.");
      } else {
        console.log("Local: DB connected.");
      }
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on 0.0.0.0:${PORT}`);
      });
    })
    .catch((err) => {
      console.error("Local: DB connection error (starting server anyway):", err);
      app.listen(PORT, "0.0.0.0", () => {
        console.log(`Server running on 0.0.0.0:${PORT}`);
      });
    });
}
