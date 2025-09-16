// lambda.js - AWS Lambda handler for serverless express
const serverlessExpress = require('@vendia/serverless-express');
const app = require('./app');

// Create the serverless express handler
exports.handler = serverlessExpress({ app });