// This script will modify the AuthController temporarily to add detailed logging

const fs = require('fs');
const path = require('path');

const authControllerPath = path.join(__dirname, 'src/controllers/AuthController.js');

// Read the current file
const originalContent = fs.readFileSync(authControllerPath, 'utf8');

// Create a backup
fs.writeFileSync(authControllerPath + '.backup', originalContent);

// Add logging to the login method
const modifiedContent = originalContent.replace(
  'login = ErrorMiddleware.asyncWrapper(async (req, res) => {',
  `login = ErrorMiddleware.asyncWrapper(async (req, res) => {
    // 🔍 DEBUGGING: Log incoming request data
    console.log('🔍 LOGIN REQUEST DEBUG:');
    console.log('  Headers:', req.headers);
    console.log('  Body:', req.body);
    console.log('  Raw body type:', typeof req.body);
    console.log('  Email:', req.body.email);
    console.log('  Password:', req.body.password);
    console.log('  Email type:', typeof req.body.email);
    console.log('  Password type:', typeof req.body.password);
    console.log('');`
);

// Write the modified file
fs.writeFileSync(authControllerPath, modifiedContent);

console.log('✅ Added debugging to AuthController.js');
console.log('🔄 Restart the backend server to see the debugging output');
console.log('⚠️  Remember to run: node remove-debug-logging.js to clean up afterwards'); 