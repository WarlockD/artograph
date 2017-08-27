const req = require.context('./', false, /^.*Node\.js$/);
const nodes = req.keys()
  .map((path) => req(path).default)
  .filter((node) => !!node.nodeName)
  .sort((a, b) => {
    return a.nodeName.localeCompare(b.nodeName);
  });

export default nodes;
