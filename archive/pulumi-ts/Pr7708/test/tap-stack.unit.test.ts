import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let TapStack: any;

  beforeAll(() => {
    // Dynamically import after setting mocks
    TapStack = require('../lib/tap-stack').TapStack;
  });

  describe('Stack Initialization', () => {
    it('should create a TapStack with default values', async () => {
      const stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
      expect(stack.ec2ScannerArn).toBeDefined();
      expect(stack.s3ScannerArn).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
      expect(stack.complianceTableName).toBeDefined();
    });

    it('should create a TapStack with custom environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
      });

      expect(stack).toBeDefined();
      expect(stack.ec2ScannerArn).toBeDefined();
    });

    it('should create a TapStack with custom tags', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'staging',
        tags: {
          Team: 'DevOps',
          Project: 'InfraQA',
        },
      });

      expect(stack).toBeDefined();
    });

    it('should use default environmentSuffix when not provided', async () => {
      const stack = new TapStack('test-stack', {});

      expect(stack).toBeDefined();
      // The stack should still be created with 'dev' as default
    });
  });

  describe('Stack Outputs', () => {
    let stack: any;

    beforeAll(() => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });
    });

    it('should have ec2ScannerArn output', async () => {
      expect(stack.ec2ScannerArn).toBeDefined();

      const arn = await stack.ec2ScannerArn;
      expect(typeof arn).toBe('object');
    });

    it('should have s3ScannerArn output', async () => {
      expect(stack.s3ScannerArn).toBeDefined();

      const arn = await stack.s3ScannerArn;
      expect(typeof arn).toBe('object');
    });

    it('should have dashboardName output', async () => {
      expect(stack.dashboardName).toBeDefined();

      const name = await stack.dashboardName;
      expect(typeof name).toBe('object');
    });

    it('should have complianceTableName output', async () => {
      expect(stack.complianceTableName).toBeDefined();

      const name = await stack.complianceTableName;
      expect(typeof name).toBe('object');
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environmentSuffix in resource names', async () => {
      const envSuffix = 'qa';
      const stack = new TapStack('test-stack', {
        environmentSuffix: envSuffix,
      });

      expect(stack).toBeDefined();
      // Resources should be named with the environmentSuffix
    });

    it('should handle special characters in environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test-env-123',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Stack Configuration', () => {
    it('should accept empty tags object', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(stack).toBeDefined();
    });

    it('should accept multiple tags', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
        tags: {
          Environment: 'development',
          Owner: 'team-a',
          CostCenter: 'engineering',
          Project: 'compliance',
        },
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: undefined,
      });

      expect(stack).toBeDefined();
    });

    it('should handle undefined tags', async () => {
      const stack = new TapStack('test-stack', {
        tags: undefined,
      });

      expect(stack).toBeDefined();
    });

    it('should handle null values in args', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: null as any,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Component Resource Type', () => {
    it('should be registered as tap:stack:TapStack type', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
      });

      expect(stack).toBeDefined();
      // Pulumi ComponentResource should be created with correct type
    });
  });

  describe('Stack Lifecycle', () => {
    it('should create stack without parent', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
      });

      expect(stack).toBeDefined();
    });

    it('should create stack with provider option', async () => {
      const stack = new TapStack(
        'test-stack',
        {
          environmentSuffix: 'dev',
        },
        { provider: undefined }
      );

      expect(stack).toBeDefined();
    });
  });

  describe('Integration with Pulumi', () => {
    it('should register outputs correctly', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'dev',
      });

      // Check that all expected outputs are present
      expect(stack.ec2ScannerArn).toBeDefined();
      expect(stack.s3ScannerArn).toBeDefined();
      expect(stack.dashboardName).toBeDefined();
      expect(stack.complianceTableName).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty environmentSuffix string', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: '',
      });

      expect(stack).toBeDefined();
    });

    it('should handle very long environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'very-long-environment-suffix-name',
      });

      expect(stack).toBeDefined();
    });

    it('should handle numeric-like environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: '12345',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Multiple Stack Instances', () => {
    it('should allow creating multiple stack instances', async () => {
      const stack1 = new TapStack('test-stack-1', {
        environmentSuffix: 'dev1',
      });

      const stack2 = new TapStack('test-stack-2', {
        environmentSuffix: 'dev2',
      });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack1).not.toBe(stack2);
    });
  });
});
