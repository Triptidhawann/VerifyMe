require('dotenv').config();
const connectDB = require('./src/config/database');
const app = require('./src/app');

const PORT = process.env.PORT || 5000;

// Connect to Database, then start server
const startServer = async () => {
  try {
    // We are now using Firebase Admin SDK and Firestore instead of MongoDB
    // await connectDB();
    
    // 2. Start Express server
    app.listen(PORT, () => {
      console.log(`VerifyMe Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1); // Exit process with failure
  }
};

startServer();
