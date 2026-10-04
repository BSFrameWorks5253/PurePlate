const handler = require('../index.js');

module.exports = (req, res) => {
  req.url = '/api/auth/verify-otp';
  return handler(req, res);
};
