const handler = require('../index.js');

module.exports = (req, res) => {
  req.url = '/api/auth/check-email';
  return handler(req, res);
};
