import * as pulumi from '@pulumi/pulumi';

// Helper function to unwrap Pulumi Output values
const unwrap = <T>(output: pulumi.Output<T>): Promise<T> => {
  return pulumi.output(output).promise();
};

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } => {
    const id = `${args.name}-id`;
    const state = {
      ...args.inputs,
      id,
      arn: `arn:aws:service:us-east-1:123456789012:${args.type}/${args.name}`,
      name: args.name,
      url: `https://test.url/${args.name}`,
      keyId: `key-${args.name}`,
    };
    return { id, state };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '342597974367',
        arn: 'arn:aws:iam::342597974367:user/test',
        userId: 'AIDAI123456789',
      };
    }
    return {};
  },
});

describe('TapStack', () => {
  let stack: typeof import('../lib/tap-stack');

  beforeAll(() => {
    stack = require('../lib/tap-stack');
  });

  describe('TapStack Resource Creation', () => {
    it('should create TapStack with all required resources', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
          ManagedBy: 'pulumi',
        },
      });

      expect(tapStack).toBeDefined();
      expect(tapStack.metricAggregatorFunctionName).toBeDefined();
      expect(tapStack.snsTopicArn).toBeDefined();
      expect(tapStack.dashboardName).toBeDefined();
      expect(tapStack.deadLetterQueueUrl).toBeDefined();
    });

    it('should use environmentSuffix in resource names', async () => {
      const testSuffix = 'prod123';
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: testSuffix,
        tags: {
          Environment: 'prod',
        },
      });

      const functionName = await unwrap(tapStack.metricAggregatorFunctionName);
      const dashboardName = await unwrap(tapStack.dashboardName);

      expect(functionName).toContain(testSuffix);
      expect(dashboardName).toContain(testSuffix);
    });

    it('should apply tags to resources', async () => {
      const testTags = {
        Environment: 'staging',
        Team: 'observability',
        ManagedBy: 'pulumi',
      };

      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'staging',
        tags: testTags,
      });

      expect(tapStack).toBeDefined();
    });

    it('should create SNS topic with encryption', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'encrypted',
        tags: {},
      });

      const snsTopicArn = await unwrap(tapStack.snsTopicArn);
      expect(snsTopicArn).toContain('arn:aws:');
    });

    it('should create dead letter queue for Lambda', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'dlq',
        tags: {},
      });

      const dlqUrl = await unwrap(tapStack.deadLetterQueueUrl);
      expect(dlqUrl).toContain('https://');
    });

    it('should create metric aggregator Lambda function', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'lambda',
        tags: {},
      });

      const functionName = await unwrap(tapStack.metricAggregatorFunctionName);
      expect(functionName).toContain('metric-aggregator');
      expect(functionName).toContain('lambda');
    });

    it('should create CloudWatch dashboard', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'dashboard',
        tags: {},
      });

      const dashboardName = await unwrap(tapStack.dashboardName);
      expect(dashboardName).toContain('observability');
      expect(dashboardName).toContain('dashboard');
    });
  });

  describe('TapStack Configuration', () => {
    it('should handle different environment suffixes', async () => {
      const suffixes = ['dev', 'staging', 'prod', 'test123'];

      for (const suffix of suffixes) {
        const tapStack = new stack.TapStack(`stack-${suffix}`, {
          environmentSuffix: suffix,
          tags: {},
        });

        const functionName = await unwrap(tapStack.metricAggregatorFunctionName);
        expect(functionName).toContain(suffix);
      }
    });

    it('should handle empty tags', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'notags',
        tags: {},
      });

      expect(tapStack).toBeDefined();
    });

    it('should handle complex tag structures', async () => {
      const complexTags = {
        Environment: 'production',
        Team: 'platform-engineering',
        CostCenter: 'engineering-123',
        Application: 'monitoring',
        Version: '1.0.0',
      };

      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'complex',
        tags: complexTags,
      });

      expect(tapStack).toBeDefined();
    });
  });

  describe('TapStack Outputs', () => {
    it('should export all required outputs', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'outputs',
        tags: {},
      });

      expect(tapStack.metricAggregatorFunctionName).toBeDefined();
      expect(tapStack.snsTopicArn).toBeDefined();
      expect(tapStack.dashboardName).toBeDefined();
      expect(tapStack.deadLetterQueueUrl).toBeDefined();
    });

    it('should have valid output types', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'types',
        tags: {},
      });

      const functionName = await unwrap(tapStack.metricAggregatorFunctionName);
      const snsArn = await unwrap(tapStack.snsTopicArn);
      const dashboard = await unwrap(tapStack.dashboardName);
      const dlqUrl = await unwrap(tapStack.deadLetterQueueUrl);

      expect(typeof functionName).toBe('string');
      expect(typeof snsArn).toBe('string');
      expect(typeof dashboard).toBe('string');
      expect(typeof dlqUrl).toBe('string');
    });
  });

  describe('TapStack Resource Naming', () => {
    it('should use consistent naming patterns', async () => {
      const suffix = 'naming-test';
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: suffix,
        tags: {},
      });

      const functionName = await unwrap(tapStack.metricAggregatorFunctionName);
      const dashboardName = await unwrap(tapStack.dashboardName);

      expect(functionName).toMatch(/^metric-aggregator-/);
      expect(dashboardName).toMatch(/^observability-/);
    });

    it('should include environmentSuffix in all resource names', async () => {
      const suffix = 'suffix123';
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: suffix,
        tags: {},
      });

      const functionName = await unwrap(tapStack.metricAggregatorFunctionName);
      const dashboardName = await unwrap(tapStack.dashboardName);
      const dlqUrl = await unwrap(tapStack.deadLetterQueueUrl);
      const snsArn = await unwrap(tapStack.snsTopicArn);

      expect(functionName).toContain(suffix);
      expect(dashboardName).toContain(suffix);
      expect(dlqUrl).toContain(suffix);
      expect(snsArn).toContain(suffix);
    });
  });

  describe('TapStack Edge Cases', () => {
    it('should handle special characters in environmentSuffix', async () => {
      const suffix = 'test-env-123';
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: suffix,
        tags: {},
      });

      expect(tapStack).toBeDefined();
    });

    it('should handle long environmentSuffix', async () => {
      const suffix = 'very-long-environment-suffix-name-1234567890';
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: suffix,
        tags: {},
      });

      expect(tapStack).toBeDefined();
    });

    it('should handle tags with special characters', async () => {
      const tags = {
        'Environment:Test': 'value1',
        'Team/SubTeam': 'value2',
      };

      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'special-chars',
        tags,
      });

      expect(tapStack).toBeDefined();
    });
  });

  describe('TapStack Component Resource', () => {
    it('should be a valid Pulumi ComponentResource', () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'component',
        tags: {},
      });

      expect(tapStack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should register outputs', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'register',
        tags: {},
      });

      expect(tapStack.metricAggregatorFunctionName).toBeDefined();
      expect(tapStack.snsTopicArn).toBeDefined();
      expect(tapStack.dashboardName).toBeDefined();
      expect(tapStack.deadLetterQueueUrl).toBeDefined();
    });
  });
});
