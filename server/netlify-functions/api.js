const serverless = require('serverless-http');
const app = require('../src/app');

// Wrap the Express app for Netlify Functions, ensuring the router understands the Netlify path
module.exports.handler = serverless(app, {
  basePath: '/.netlify/functions'
});
