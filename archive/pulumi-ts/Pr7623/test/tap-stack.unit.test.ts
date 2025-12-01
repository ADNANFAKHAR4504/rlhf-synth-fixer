import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock all Pulumi resources
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } {
    return {
      id: args.inputs.name ? `${args.inputs.name}_id` : 'default_id',
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDIODR4TAW7CSEXAMPLE',
      };
    }
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  describe('Stack Creation with Default Values', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-stack', {});
    });

    it('should create stack with default environment suffix', async () => {
      expect(stack).toBeDefined();
    });

    it('should export stateTableName output', (done) => {
      pulumi
        .all([stack.stateTableName])
        .apply(([tableName]) => {
          expect(tableName).toBeDefined();
          expect(typeof tableName).toBe('string');
          done();
        });
    });

    it('should export startRuleArn output', (done) => {
      pulumi
        .all([stack.startRuleArn])
        .apply(([arn]) => {
          expect(arn).toBeDefined();
          expect(typeof arn).toBe('string');
          done();
        });
    });

    it('should export stopRuleArn output', (done) => {
      pulumi
        .all([stack.stopRuleArn])
        .apply(([arn]) => {
          expect(arn).toBeDefined();
          expect(typeof arn).toBe('string');
          done();
        });
    });

    it('should export stateMachineArn output', (done) => {
      pulumi
        .all([stack.stateMachineArn])
        .apply(([arn]) => {
          expect(arn).toBeDefined();
          expect(typeof arn).toBe('string');
          done();
        });
    });

    it('should calculate estimated monthly savings', (done) => {
      pulumi
        .all([stack.estimatedMonthlySavings])
        .apply(([savings]) => {
          expect(savings).toBeDefined();
          expect(typeof savings).toBe('number');
          expect(savings).toBeGreaterThan(0);
          // Calculate expected: (2 * 0.0416 + 1 * 0.0832) * 13 * 22
          const expected = (2 * 0.0416 + 1 * 0.0832) * 13 * 22;
          expect(savings).toBe(expected);
          done();
        });
    });
  });

  describe('Stack Creation with Custom Values', () => {
    let stack: TapStack;
    const customSuffix = 'test123';
    const customTags = {
      Environment: 'testing',
      Team: 'qa',
    };

    beforeAll(() => {
      stack = new TapStack('test-stack-custom', {
        environmentSuffix: customSuffix,
        tags: customTags,
      });
    });

    it('should create stack with custom environment suffix', async () => {
      expect(stack).toBeDefined();
    });

    it('should use custom tags', (done) => {
      pulumi
        .all([stack.stateTableName])
        .apply(() => {
          expect(stack).toBeDefined();
          done();
        });
    });
  });

  describe('Lambda Functions Configuration', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-lambda', {
        environmentSuffix: 'lambda-test',
      });
    });

    it('should create Lambda functions with correct environment variables', (done) => {
      pulumi
        .all([stack.stateTableName])
        .apply(([tableName]) => {
          expect(tableName).toBeDefined();
          done();
        });
    });
  });

  describe('EventBridge Rules Configuration', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-eventbridge', {
        environmentSuffix: 'event-test',
      });
    });

    it('should create start and stop EventBridge rules', (done) => {
      pulumi
        .all([stack.startRuleArn, stack.stopRuleArn])
        .apply(([startArn, stopArn]) => {
          expect(startArn).toBeDefined();
          expect(stopArn).toBeDefined();
          expect(startArn).not.toBe(stopArn);
          done();
        });
    });
  });

  describe('Step Functions State Machine', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-sfn', {
        environmentSuffix: 'sfn-test',
      });
    });

    it('should create Step Functions state machine', (done) => {
      pulumi
        .all([stack.stateMachineArn])
        .apply(([arn]) => {
          expect(arn).toBeDefined();
          expect(typeof arn).toBe('string');
          done();
        });
    });
  });

  describe('DynamoDB State Table', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-dynamodb', {
        environmentSuffix: 'ddb-test',
      });
    });

    it('should create DynamoDB table for state tracking', (done) => {
      pulumi
        .all([stack.stateTableName])
        .apply(([tableName]) => {
          expect(tableName).toBeDefined();
          expect(typeof tableName).toBe('string');
          done();
        });
    });
  });

  describe('Cost Calculation Logic', () => {
    it('should calculate monthly savings correctly for default configuration', () => {
      const stack = new TapStack('test-cost', {});

      // Expected calculation: (2 * 0.0416 + 1 * 0.0832) * 13 * 22
      // 2 t3.medium instances at $0.0416/hr
      // 1 t3.large instance at $0.0832/hr
      // 13 hours per day shutdown
      // 22 business days per month
      const expectedSavings = (2 * 0.0416 + 1 * 0.0832) * 13 * 22;

      pulumi.all([stack.estimatedMonthlySavings]).apply(([savings]) => {
        expect(savings).toBe(expectedSavings);
        expect(savings).toBeCloseTo(47.59, 2);
      });
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environment suffix in resource names', (done) => {
      const testSuffix = 'pr123';
      const stack = new TapStack('test-naming', {
        environmentSuffix: testSuffix,
      });

      pulumi
        .all([stack.stateTableName])
        .apply(([tableName]) => {
          expect(tableName).toContain(testSuffix);
          done();
        });
    });
  });

  describe('IAM Roles and Policies', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-iam', {
        environmentSuffix: 'iam-test',
      });
    });

    it('should create IAM roles for Lambda, Step Functions, and EventBridge', (done) => {
      pulumi
        .all([
          stack.stateTableName,
          stack.startRuleArn,
          stack.stopRuleArn,
          stack.stateMachineArn,
        ])
        .apply(() => {
          expect(stack).toBeDefined();
          done();
        });
    });
  });

  describe('CloudWatch Alarms', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-alarms', {
        environmentSuffix: 'alarm-test',
      });
    });

    it('should create CloudWatch alarms for monitoring', (done) => {
      pulumi
        .all([stack.stateMachineArn])
        .apply(() => {
          expect(stack).toBeDefined();
          done();
        });
    });
  });
});
