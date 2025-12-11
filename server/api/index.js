const serverless = require('serverless-http');
const app = require('../index'); // import original Express app

module.exports = serverless(app);
