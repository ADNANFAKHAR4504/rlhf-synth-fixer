// CDKTF Test Setup
process.env.GITHUB_RUN_ID = 'local';
process.env.GITHUB_RUN_ATTEMPT = '';
process.env.CI_PIPELINE_ID = '';
process.env.CI_RUN_ID = '';

const resolveActual = (resource, key) => {
  if (Object.prototype.hasOwnProperty.call(resource, key)) {
    return resource[key];
  }

  if (key === 'name' && Object.prototype.hasOwnProperty.call(resource, 'name_prefix')) {
    return resource.name_prefix;
  }

  return undefined;
};

const matchesValue = (resource, key, expected) => {
  const actual = resolveActual(resource, key);

  if (
    expected &&
    typeof expected === 'object' &&
    typeof expected.asymmetricMatch === 'function'
  ) {
    return expected.asymmetricMatch(actual);
  }

  if (
    expected &&
    typeof expected === 'object' &&
    !Array.isArray(expected) &&
    expected !== null
  ) {
    try {
      expect(actual).toMatchObject(expected);
      return true;
    } catch {
      return false;
    }
  }

  if (Array.isArray(expected)) {
    try {
      expect(actual).toEqual(expect.arrayContaining(expected));
      return true;
    } catch {
      return false;
    }
  }

  return JSON.stringify(actual) === JSON.stringify(expected);
};

expect.extend({
  toHaveResource(synthesized, resourceType) {
    const resources = JSON.parse(synthesized);
    const resourceEntries = resources.resource?.[resourceType] || null;
    const pass = !!resourceEntries;

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
        const matches = Object.entries(properties).every(([key, value]) =>
          matchesValue(resource, key, value)
        );

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
    const outputValue = resources.output?.[outputName] || null;
    const pass = !!outputValue;

    return {
      pass,
      message: () =>
        pass
          ? `Expected synthesized stack not to have output ${outputName}`
          : `Expected synthesized stack to have output ${outputName}`,
    };
  },
});
