require('dotenv').config();
const app = require('./src/app');

// Intercept unhandled background rejections (e.g. gRPC or external DNS lookups) so server never crashes
process.on('unhandledRejection', (reason) => {
  console.warn('[Server Warning] Unhandled rejection intercepted:', (reason && reason.message) || reason);
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    app.listen(PORT, () => {
      console.log(`VerifyMe Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();
