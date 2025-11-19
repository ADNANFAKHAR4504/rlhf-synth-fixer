/**
 * Test setup file for Pulumi mocking
 *
 * This sets up the Pulumi runtime for testing without actual deployment.
 */

import * as pulumi from '@pulumi/pulumi';

// Set Pulumi to test mode
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } => {
    return {
      id: args.name + '_id',
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
        id: 'us-east-1',
      };
    }
    return args.inputs;
  },
});

// Set required Pulumi configuration for tests
pulumi.runtime.setConfig('project:environmentSuffix', 'test');
pulumi.runtime.setConfig('project:environment', 'dev');
