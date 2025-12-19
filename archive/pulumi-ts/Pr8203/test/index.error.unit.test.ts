import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime before importing index
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('Image Processor Error Handling Tests', () => {
  it('should throw error when ENVIRONMENT_SUFFIX is not set', () => {
    // Set ENVIRONMENT (required but not the one we're testing)
    process.env.ENVIRONMENT = 'dev';

    // Clear the ENVIRONMENT_SUFFIX if it was set
    const originalValue = process.env.ENVIRONMENT_SUFFIX;
    delete process.env.ENVIRONMENT_SUFFIX;

    // Clear the module cache to force re-import
    const modulePath = require.resolve('../lib/index');
    delete require.cache[modulePath];

    // Attempt to import should throw
    expect(() => {
      require('../lib/index');
    }).toThrow('ENVIRONMENT_SUFFIX environment variable is required');

    // Restore for other tests
    if (originalValue) {
      process.env.ENVIRONMENT_SUFFIX = originalValue;
    }
  });
});
