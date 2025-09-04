import dotenv from "dotenv"; // import at the start/ endpoint of the project
import app from "./app.js";
import connectDB from "./db/index.js";

// configuration
dotenv.config({
  // Without dotenv.config(), Node.js won’t know about .env
  path: "./.env",
});

// start server
const port = process.env.PORT;

// connection of the database 
connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`✅ Server running on port ${port}`);
    });
  })
  .catch((error) => {
    console.error("❌ MongoDB connection error!!", error);
    process.exit(1);
  });
