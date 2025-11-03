// CDKTF Test Setup
expect.extend({
  toHaveResource(synthesized, resourceType) {
    const resources = JSON.parse(synthesized);
    const pass = resources.resource && resources.resource[resourceType];

    return {
      pass,
      message: () =>
        pass
          ? `Expected synthesized stack not to have resource type ${resourceType}`
          : `Expected synthesized stack to have resource type ${resourceType}`,
    };
  },

  toHaveResourceWithProperties(synthesized, resourceType, properties) {
    const resources = JSON.parse(synthesized);
    let pass = false;
    let matchedResource = null;

    if (resources.resource && resources.resource[resourceType]) {
      const resourcesOfType = Object.values(resources.resource[resourceType]);

      for (const resource of resourcesOfType) {
        const matches = Object.entries(properties).every(([key, value]) => {
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // For nested objects, do a partial match using expect.objectContaining
            try {
              expect(resource[key]).toMatchObject(value);
              return true;
            } catch {
              return false;
            }
          } else if (typeof value === 'object' && Array.isArray(value)) {
            // For arrays, check if all expected items are present
            try {
              expect(resource[key]).toEqual(expect.arrayContaining(value));
              return true;
            } catch {
              return false;
            }
          } else if (typeof value === 'string' && value.includes('expect.stringContaining')) {
            // Handle expect.stringContaining
            return typeof resource[key] === 'string';
          } else {
            return JSON.stringify(resource[key]) === JSON.stringify(value);
          }
        });

        if (matches) {
          pass = true;
          matchedResource = resource;
          break;
        }
      }
    }

    return {
      pass,
      message: () =>
        pass
          ? `Expected synthesized stack not to have resource ${resourceType} with properties ${JSON.stringify(properties)}`
          : `Expected synthesized stack to have resource ${resourceType} with properties ${JSON.stringify(properties)}. Found resources: ${JSON.stringify(
              resources.resource?.[resourceType] || 'none',
              null,
              2
            )}`,
    };
  },

  toHaveOutput(synthesized, outputName) {
    const resources = JSON.parse(synthesized);
    const pass = resources.output && resources.output[outputName];

    return {
      pass,
      message: () =>
        pass
          ? `Expected synthesized stack not to have output ${outputName}`
          : `Expected synthesized stack to have output ${outputName}`,
    };
  },
});
