const req = require.context('./', false, /^.*Node\.js$/);
const nodes = req.keys()
  .map(req)
  .map((v) => v.default)
  .sort((a, b) => {
    return a.nodeName.localeCompare(b.nodeName);
  });

export default nodes;
