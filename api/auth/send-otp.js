const handler = require('../index.js');

module.exports = (req, res) => {
  req.url = '/api/auth/send-otp';
  return handler(req, res);
};
