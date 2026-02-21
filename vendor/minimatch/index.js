const mm10 = require("minimatch10");

function minimatch(p, pattern, options) {
  return mm10.minimatch(p, pattern, options);
}

Object.assign(minimatch, mm10);

module.exports = minimatch;
