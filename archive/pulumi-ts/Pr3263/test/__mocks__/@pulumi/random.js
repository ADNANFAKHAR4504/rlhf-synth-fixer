module.exports = {
  RandomString: class {
    constructor(name, args) {
      const resource = {
        type: 'random:string',
        name,
        args,
        result: 'random123',
      };

      if (!global.mockResources) {
        global.mockResources = [];
      }
      global.mockResources.push(resource);

      Object.assign(this, resource);
    }
  },
};