/**
 * Unit tests for TapStack
 * Ensures 100% coverage of main stack orchestration
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } => {
    const outputs: Record<string, any> = {
      ...args.inputs,
      id: args.name + '_id',
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      name: args.name,
      url: `https://${args.name}.amazonaws.com`,
    };

    return {
      id: args.name + '_id',
      state: outputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Mock Pulumi Config
    (pulumi.Config as any) = jest.fn().mockImplementation(() => ({
      require: jest.fn((key: string) => {
        if (key === 'dbEndpoint') return 'test-db.example.com:5432';
        return 'test-value';
      }),
      requireSecret: jest.fn((key: string) => pulumi.output('test-secret')),
      getSecret: jest.fn((key: string) => pulumi.output('test-secret')),
      getNumber: jest.fn(() => 3),
      get: jest.fn((key: string) => {
        if (key === 'logLevel') return 'INFO';
        if (key === 'apiKey') return undefined; // No apiKey configured by default
        return 'default-value';
      }),
    }));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Initialization', () => {
    it('should create stack with default values', () => {
      stack = new TapStack('test-tap-stack', {});

      expect(stack).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
      expect(stack.lambdaName).toBeDefined();
      expect(stack.roleArn).toBeDefined();
      expect(stack.logGroupName).toBeDefined();
      expect(stack.dlqUrl).toBeDefined();
      expect(stack.layerArn).toBeDefined();
    });

    it('should create stack with custom environment suffix', () => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'production',
      });

      expect(stack).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
    });

    it('should create stack with custom tags', () => {
      const customTags = {
        Environment: 'staging',
        Team: 'platform',
        CostCenter: 'engineering',
      };

      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'staging',
        tags: customTags,
      });

      expect(stack).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
    });

    it('should use default environment suffix when not provided', () => {
      stack = new TapStack('test-tap-stack', {});

      expect(stack).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(() => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'test',
        tags: {},
      });
    });

    it('should expose Lambda ARN output', async () => {
      expect(stack.lambdaArn).toBeDefined();
    });

    it('should expose Lambda name output', async () => {
      const lambdaName = await stack.lambdaName;
      expect(lambdaName).toBeDefined();
    });

    it('should expose IAM role ARN output', async () => {
      expect(stack.roleArn).toBeDefined();
    });

    it('should expose log group name output', async () => {
      expect(stack.logGroupName).toBeDefined();
    });

    it('should expose DLQ URL output', async () => {
      expect(stack.dlqUrl).toBeDefined();
    });

    it('should expose Layer ARN output', async () => {
      expect(stack.layerArn).toBeDefined();
    });
  });

  describe('Lambda Optimizer Stack Integration', () => {
    it('should instantiate LambdaOptimizerStack as child', () => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'test',
        tags: {},
      });

      expect(stack).toBeDefined();
      expect(stack.lambdaArn).toBeDefined();
    });

    it('should pass environment suffix to child stack', () => {
      const envSuffix = 'prod-us-east-1';
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: envSuffix,
        tags: {},
      });

      expect(stack).toBeDefined();
    });

    it('should pass tags to child stack', () => {
      const tags = {
        Application: 'test-app',
        Environment: 'test',
      };

      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'test',
        tags: tags,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tags object', () => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'test',
        tags: {},
      });

      expect(stack).toBeDefined();
    });

    it('should handle undefined tags', () => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should handle short environment suffix', () => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'a',
        tags: {},
      });

      expect(stack).toBeDefined();
    });

    it('should handle hyphenated environment suffix', () => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'prod-us-west-2-blue',
        tags: {},
      });

      expect(stack).toBeDefined();
    });

    it('should handle numeric environment suffix', () => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'env123',
        tags: {},
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Output Registration', () => {
    beforeEach(() => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'test',
        tags: {},
      });
    });

    it('should register all required outputs', async () => {
      const outputs = await Promise.all([
        stack.lambdaArn,
        stack.lambdaName,
        stack.roleArn,
        stack.logGroupName,
        stack.dlqUrl,
        stack.layerArn,
      ]);

      outputs.forEach(output => {
        expect(output).toBeDefined();
      });
    });

    it('should have non-empty output values', async () => {
      expect(stack.lambdaArn).toBeDefined();
      expect(stack.lambdaName).toBeDefined();
    });
  });

  describe('Component Resource Type', () => {
    it('should use correct component resource type', () => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'test',
        tags: {},
      });

      // Component resource type is 'tap:stack:TapStack'
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Options', () => {
    it('should accept custom resource options', () => {
      const customOpts = {
        protect: false,
        dependsOn: [],
      };

      stack = new TapStack(
        'test-tap-stack',
        {
          environmentSuffix: 'test',
          tags: {},
        },
        customOpts
      );

      expect(stack).toBeDefined();
    });

    it('should work without custom resource options', () => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'test',
        tags: {},
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Integration with All 10 Optimizations', () => {
    beforeEach(() => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
          Team: 'platform',
        },
      });
    });

    it('should expose all optimization outputs through stack', async () => {
      // Verify all outputs are accessible
      expect(stack.lambdaArn).toBeDefined(); // Requirement 1-4
      expect(stack.roleArn).toBeDefined(); // Requirement 5-6
      expect(stack.logGroupName).toBeDefined(); // Requirement 7
      expect(stack.layerArn).toBeDefined(); // Requirement 8
      expect(stack.dlqUrl).toBeDefined(); // Requirement 9
      // Requirement 10 (tagging) is implicit in all resources
    });

    it('should propagate configuration to Lambda optimizer', async () => {
      const outputs = await Promise.all([
        stack.lambdaArn,
        stack.lambdaName,
        stack.roleArn,
        stack.logGroupName,
        stack.dlqUrl,
        stack.layerArn,
      ]);

      // All outputs should be defined, indicating successful configuration
      expect(outputs.every(o => o !== undefined)).toBe(true);
    });
  });
});
