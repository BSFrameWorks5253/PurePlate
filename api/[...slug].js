const handler = require('./index.js');

module.exports = async function (req, res) {
  return handler(req, res);
};
