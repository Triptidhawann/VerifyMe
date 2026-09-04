const serverless = require('serverless-http');
const app = require('./src/app');

// Wrap the Express app for Netlify Functions
module.exports.handler = serverless(app);
