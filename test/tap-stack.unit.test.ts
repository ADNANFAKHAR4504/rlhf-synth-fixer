import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi runtime mocks
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    const { type, name, inputs } = args;
    return {
      id: `${name}-id`,
      state: {
        ...inputs,
        name: inputs.name || name,
        arn: `arn:aws:${type}:us-east-1:123456789012:${name}`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args;
  },
});

describe('TapStack Structure', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Reset Pulumi runtime state
    // Reset state is not available in newer Pulumi versions
  });

  describe('with props', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackWithProps', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'prod',
          Project: 'test',
        },
      });
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('has expected outputs', () => {
      expect(stack.apiEndpoint).toBeDefined();
      expect(stack.tableName).toBeDefined();
    });
  });

  describe('with default values', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackDefault', {
        environmentSuffix: 'dev',
      });
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('has expected outputs', () => {
      expect(stack.apiEndpoint).toBeDefined();
      expect(stack.tableName).toBeDefined();
    });
  });
});
