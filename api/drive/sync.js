const handler = require('../index.js');

module.exports = (req, res) => {
  req.url = '/api/drive/sync';
  return handler(req, res);
};
