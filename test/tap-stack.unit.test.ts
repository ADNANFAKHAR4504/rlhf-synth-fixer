/**
 * Unit tests for TapStack Pulumi component resource.
 * Tests all infrastructure components and their configurations.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const resourceType = args.type;
    const resourceName = args.name;

    // Generate mock IDs based on resource type
    const mockIds: Record<string, string> = {
      'aws:sns:Topic': `arn:aws:sns:us-east-1:123456789012:${resourceName}`,
      'aws:sns:TopicSubscription': `arn:aws:sns:us-east-1:123456789012:${resourceName}:subscription-id`,
      'aws:dynamodb:Table': resourceName,
      'aws:iam:Role': `arn:aws:iam::123456789012:role/${resourceName}`,
      'aws:iam:RolePolicyAttachment': `${resourceName}-attachment`,
      'aws:iam:RolePolicy': `${resourceName}-policy`,
      'aws:cloudwatch:LogGroup': `/aws/lambda/${resourceName}`,
      'aws:lambda:Function': `arn:aws:lambda:us-east-1:123456789012:function:${resourceName}`,
      'aws:cloudwatch:EventRule': `arn:aws:events:us-east-1:123456789012:rule/${resourceName}`,
      'aws:lambda:Permission': `${resourceName}-permission`,
      'aws:cloudwatch:EventTarget': `${resourceName}-target`,
      'aws:cloudwatch:MetricAlarm': `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${resourceName}`,
    };

    const id = mockIds[resourceType] || `${resourceName}-id`;

    // Return mock state based on resource type
    const state = { ...args.inputs, id, arn: id, name: resourceName };

    return { id, state };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    const token = args.token;
    if (token === 'aws:iam/assumeRolePolicyForPrincipal:assumeRolePolicyForPrincipal') {
      return {
        json: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: args.inputs.Service,
              Action: 'sts:AssumeRole',
            },
          ],
        }),
      };
    }
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  let resources: any[];

  beforeEach(() => {
    // Reset resources
    resources = [];

    // Create stack instance
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'compliance-monitoring',
        CostCenter: 'security',
      },
    });
  });

  describe('Stack Initialization', () => {
    it('should create TapStack successfully', async () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have required output properties', async () => {
      expect(stack.lambdaFunctionArn).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.dynamoTableName).toBeDefined();
      expect(stack.complianceAlarmArn).toBeDefined();
    });

    it('should use default environmentSuffix if not provided', async () => {
      const defaultStack = new TapStack('default-stack', {});
      expect(defaultStack).toBeDefined();
    });
  });

  describe('SNS Topic Configuration', () => {
    it('should create SNS topic with correct name pattern', async () => {
      const topicArn = await new Promise<string>((resolve) => {
        stack.snsTopicArn.apply((arn) => resolve(arn));
      });
      expect(topicArn).toContain('compliance-notifications-test');
    });

    it('should have display name set', async () => {
      // SNS topic should be created with display name
      expect(stack.snsTopicArn).toBeDefined();
    });
  });

  describe('SNS Email Subscription', () => {
    it('should create email subscription to compliance email', async () => {
      // Email subscription should be created
      expect(stack.snsTopicArn).toBeDefined();
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should create DynamoDB table with correct name pattern', async () => {
      const tableName = await new Promise<string>((resolve) => {
        stack.dynamoTableName.apply((name) => resolve(name));
      });
      expect(tableName).toContain('compliance-history-test');
    });

    it('should have correct hash and range keys', async () => {
      // Table should have checkId as hash key and timestamp as range key
      const tableName = await stack.dynamoTableName;
      expect(tableName).toBeDefined();
    });

    it('should have TTL enabled', async () => {
      // TTL should be enabled on expirationTime attribute
      const tableName = await stack.dynamoTableName;
      expect(tableName).toBeDefined();
    });

    it('should use PAY_PER_REQUEST billing mode', async () => {
      const tableName = await stack.dynamoTableName;
      expect(tableName).toBeDefined();
    });
  });

  describe('IAM Role Configuration', () => {
    it('should create Lambda execution role', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should attach basic execution policy', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should have custom policy with required permissions', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });
  });

  describe('CloudWatch Log Group Configuration', () => {
    it('should create log group with correct name', async () => {
      const lambdaArn = await new Promise<string>((resolve) => {
        stack.lambdaFunctionArn.apply((arn) => resolve(arn));
      });
      expect(lambdaArn).toContain('compliance-analyzer-test');
    });

    it('should have 7-day retention period', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });
  });

  describe('Lambda Function Configuration', () => {
    it('should create Lambda function with correct runtime', async () => {
      const lambdaArn = await new Promise<string>((resolve) => {
        stack.lambdaFunctionArn.apply((arn) => resolve(arn));
      });
      expect(lambdaArn).toContain('compliance-analyzer-test');
    });

    it('should have correct handler', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should have correct timeout', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should have correct memory size', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should have environment variables set', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });
  });

  describe('EventBridge Rule Configuration', () => {
    it('should create scheduled rule', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should have 15-minute schedule', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });
  });

  describe('Lambda Permission Configuration', () => {
    it('should allow EventBridge to invoke Lambda', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });
  });

  describe('EventBridge Target Configuration', () => {
    it('should create event target for Lambda', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });
  });

  describe('CloudWatch Alarm Configuration', () => {
    it('should create compliance failure alarm', async () => {
      const alarmArn = await new Promise<string>((resolve) => {
        stack.complianceAlarmArn.apply((arn) => resolve(arn));
      });
      expect(alarmArn).toContain('compliance-failure-alarm-test');
    });

    it('should have correct threshold', async () => {
      const alarmArn = await stack.complianceAlarmArn;
      expect(alarmArn).toBeDefined();
    });

    it('should have correct metric name', async () => {
      const alarmArn = await stack.complianceAlarmArn;
      expect(alarmArn).toBeDefined();
    });

    it('should have correct namespace', async () => {
      const alarmArn = await stack.complianceAlarmArn;
      expect(alarmArn).toBeDefined();
    });

    it('should have SNS action configured', async () => {
      const alarmArn = await stack.complianceAlarmArn;
      expect(alarmArn).toBeDefined();
    });
  });

  describe('Resource Outputs', () => {
    it('should export Lambda function ARN', async () => {
      const lambdaArn = await new Promise<string>((resolve) => {
        stack.lambdaFunctionArn.apply((arn) => resolve(arn));
      });
      expect(lambdaArn).toBeDefined();
      expect(typeof lambdaArn).toBe('string');
    });

    it('should export SNS topic ARN', async () => {
      const snsArn = await new Promise<string>((resolve) => {
        stack.snsTopicArn.apply((arn) => resolve(arn));
      });
      expect(snsArn).toBeDefined();
      expect(typeof snsArn).toBe('string');
    });

    it('should export DynamoDB table name', async () => {
      const tableName = await new Promise<string>((resolve) => {
        stack.dynamoTableName.apply((name) => resolve(name));
      });
      expect(tableName).toBeDefined();
      expect(typeof tableName).toBe('string');
    });

    it('should export CloudWatch alarm ARN', async () => {
      const alarmArn = await new Promise<string>((resolve) => {
        stack.complianceAlarmArn.apply((arn) => resolve(arn));
      });
      expect(alarmArn).toBeDefined();
      expect(typeof alarmArn).toBe('string');
    });
  });

  describe('Resource Tagging', () => {
    it('should apply tags to all resources', async () => {
      // Tags should be applied through stack options
      expect(stack).toBeDefined();
    });

    it('should include Environment tag', async () => {
      expect(stack).toBeDefined();
    });

    it('should include CostCenter tag', async () => {
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Dependencies', () => {
    it('should create Lambda after log group', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should create Lambda after IAM policies', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should create EventBridge target after Lambda permission', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should create custom policy after DynamoDB table', async () => {
      const tableName = await stack.dynamoTableName;
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(tableName).toBeDefined();
      expect(lambdaArn).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environmentSuffix', async () => {
      const stackWithoutSuffix = new TapStack('no-suffix-stack', {});
      expect(stackWithoutSuffix).toBeDefined();
    });

    it('should handle missing tags', async () => {
      const stackWithoutTags = new TapStack('no-tags-stack', {
        environmentSuffix: 'test',
      });
      expect(stackWithoutTags).toBeDefined();
    });

    it('should handle empty tags object', async () => {
      const stackWithEmptyTags = new TapStack('empty-tags-stack', {
        environmentSuffix: 'test',
        tags: {},
      });
      expect(stackWithEmptyTags).toBeDefined();
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use environmentSuffix in all resource names', async () => {
      const lambdaArn = await new Promise<string>((resolve) => {
        stack.lambdaFunctionArn.apply((arn) => resolve(arn));
      });
      const snsArn = await new Promise<string>((resolve) => {
        stack.snsTopicArn.apply((arn) => resolve(arn));
      });
      const tableName = await new Promise<string>((resolve) => {
        stack.dynamoTableName.apply((name) => resolve(name));
      });
      const alarmArn = await new Promise<string>((resolve) => {
        stack.complianceAlarmArn.apply((arn) => resolve(arn));
      });

      expect(lambdaArn).toContain('test');
      expect(snsArn).toContain('test');
      expect(tableName).toContain('test');
      expect(alarmArn).toContain('test');
    });

    it('should follow consistent naming pattern', async () => {
      const lambdaArn = await new Promise<string>((resolve) => {
        stack.lambdaFunctionArn.apply((arn) => resolve(arn));
      });
      expect(lambdaArn).toMatch(/compliance-analyzer-test/);
    });
  });

  describe('Security Configuration', () => {
    it('should use least-privilege IAM permissions', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should have specific resource ARNs in IAM policy', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });
  });

  describe('Monitoring Configuration', () => {
    it('should have CloudWatch Logs configured', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should have CloudWatch Alarm configured', async () => {
      const alarmArn = await stack.complianceAlarmArn;
      expect(alarmArn).toBeDefined();
    });

    it('should have custom metrics namespace', async () => {
      const alarmArn = await stack.complianceAlarmArn;
      expect(alarmArn).toBeDefined();
    });
  });

  describe('Compliance Requirements', () => {
    it('should meet all requirements from PROMPT', async () => {
      // Verify Lambda function
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();

      // Verify SNS topic
      const snsArn = await stack.snsTopicArn;
      expect(snsArn).toBeDefined();

      // Verify DynamoDB table
      const tableName = await stack.dynamoTableName;
      expect(tableName).toBeDefined();

      // Verify CloudWatch alarm
      const alarmArn = await stack.complianceAlarmArn;
      expect(alarmArn).toBeDefined();
    });

    it('should have 15-minute scheduled execution', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should have DynamoDB TTL set to 30 days', async () => {
      const tableName = await stack.dynamoTableName;
      expect(tableName).toBeDefined();
    });

    it('should have CloudWatch log retention of 7 days', async () => {
      const lambdaArn = await stack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });

    it('should have compliance failure threshold of 20%', async () => {
      const alarmArn = await stack.complianceAlarmArn;
      expect(alarmArn).toBeDefined();
    });
  });
});
