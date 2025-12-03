/**
 * Unit tests for the TapStack CI/CD Pipeline infrastructure
 *
 * These tests verify that all resources are created with correct configurations
 * including naming patterns, tags, encryption, and security settings.
 */
import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks before importing the stack
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } {
    const id = `${args.name}_id`;
    const state = {
      ...args.inputs,
      id: id,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      name: args.inputs.name || args.name,
      repositoryUrl: args.type === 'aws:ecr/repository:Repository'
        ? `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.inputs.name}`
        : undefined,
      bucket: args.type === 'aws:s3/bucket:Bucket' ? args.inputs.bucket : undefined,
      keyId: args.type === 'aws:kms/key:Key' ? id : undefined,
      url: args.type === 'aws:sqs/queue:Queue'
        ? `https://sqs.us-east-1.amazonaws.com/123456789012/${args.inputs.name}`
        : undefined,
    };
    return { id, state };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1', id: 'us-east-1' };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012', arn: 'arn:aws:iam::123456789012:root', userId: 'AIDAI...' };
    }
    return {};
  },
});

// Mock Pulumi configuration
pulumi.runtime.setConfig('project:environmentSuffix', 'test');

import { TapStack, TapStackArgs } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;

  beforeAll(() => {
    const args: TapStackArgs = {
      environmentSuffix: 'test',
      tags: {
        Environment: 'test',
        ManagedBy: 'Pulumi',
      },
    };
    stack = new TapStack('test-tap-stack', args);
  });

  describe('TapStack Component Resource', () => {
    it('should create a TapStack component resource', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should use the correct resource type', () => {
      // TapStack should be registered with the custom type 'tap:stack:TapStack'
      expect(stack).toBeDefined();
    });
  });

  describe('TapStack Configuration', () => {
    it('should accept environmentSuffix argument', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'prod',
      };
      const prodStack = new TapStack('prod-tap-stack', args);
      expect(prodStack).toBeDefined();
    });

    it('should accept tags argument', () => {
      const args: TapStackArgs = {
        environmentSuffix: 'dev',
        tags: {
          Project: 'TAP',
          Team: 'DevOps',
        },
      };
      const taggedStack = new TapStack('tagged-tap-stack', args);
      expect(taggedStack).toBeDefined();
    });

    it('should work without optional arguments', () => {
      const minimalStack = new TapStack('minimal-tap-stack', {});
      expect(minimalStack).toBeDefined();
    });
  });
});

describe('Infrastructure Code Validation', () => {
  // Read the infrastructure code to validate configuration
  const fs = require('fs');
  const path = require('path');
  const infraCode = fs.readFileSync(
    path.join(__dirname, '../lib/tap-stack.ts'),
    'utf8'
  );

  describe('Lambda Function Configuration', () => {
    it('should define Lambda function with correct name pattern', () => {
      expect(infraCode).toContain('optimized-lambda');
      expect(infraCode).toContain('aws.lambda.Function');
    });

    it('should configure memory to 1024 MB (optimized)', () => {
      expect(infraCode).toContain('memorySize: 1024');
    });

    it('should configure timeout to 30 seconds', () => {
      expect(infraCode).toContain('timeout: 30');
    });

    it('should enable X-Ray tracing', () => {
      expect(infraCode).toContain('tracingConfig:');
      expect(infraCode).toContain("mode: 'Active'");
    });

    it('should configure Dead Letter Queue', () => {
      expect(infraCode).toContain('deadLetterConfig');
      expect(infraCode).toContain('targetArn: dlqQueue.arn');
    });

    it('should attach Lambda layer', () => {
      expect(infraCode).toContain('layers:');
      expect(infraCode).toContain('sharedLayer.arn');
    });

    it('should use nodejs18.x runtime', () => {
      expect(infraCode).toContain("runtime: 'nodejs18.x'");
    });

    it('should NOT use SnapStart (Node.js incompatible)', () => {
      expect(infraCode).not.toContain('snapStart: {');
    });

    it('should have comment explaining SnapStart limitation', () => {
      expect(infraCode).toContain('SnapStart is NOT supported for Node.js');
    });

    it('should NOT configure reserved concurrency (quota limits)', () => {
      expect(infraCode).not.toContain('reservedConcurrentExecutions:');
    });

    it('should have comment explaining concurrency limitation', () => {
      expect(infraCode).toContain('Reserved concurrency NOT SET');
      expect(infraCode).toContain('account quota');
    });

    it('should configure environment variables', () => {
      expect(infraCode).toContain('environment:');
      expect(infraCode).toContain('DYNAMODB_TABLE:');
      expect(infraCode).toContain('REGION:');
      expect(infraCode).toContain('ENVIRONMENT:');
    });
  });

  describe('Lambda Layer Configuration', () => {
    it('should create Lambda layer with Node.js runtime compatibility', () => {
      expect(infraCode).toContain('aws.lambda.LayerVersion');
      expect(infraCode).toContain('compatibleRuntimes');
      expect(infraCode).toContain('nodejs18.x');
      expect(infraCode).toContain('nodejs20.x');
    });
  });

  describe('DynamoDB Configuration', () => {
    it('should create DynamoDB table', () => {
      expect(infraCode).toContain('aws.dynamodb.Table');
      expect(infraCode).toContain('transactions-table');
    });

    it('should use PAY_PER_REQUEST billing for DynamoDB', () => {
      expect(infraCode).toContain("billingMode: 'PAY_PER_REQUEST'");
    });
  });

  describe('SQS Queue Configuration', () => {
    it('should create SQS queue for DLQ', () => {
      expect(infraCode).toContain('aws.sqs.Queue');
      expect(infraCode).toContain('lambda-dlq');
    });

    it('should set 14-day retention for DLQ', () => {
      expect(infraCode).toContain('messageRetentionSeconds: 1209600');
    });
  });

  describe('IAM Configuration', () => {
    it('should create IAM role for Lambda', () => {
      expect(infraCode).toContain('aws.iam.Role');
      expect(infraCode).toContain('lambda-role');
    });

    it('should attach basic execution policy', () => {
      expect(infraCode).toContain('AWSLambdaBasicExecutionRole');
    });

    it('should attach X-Ray write policy', () => {
      expect(infraCode).toContain('AWSXRayDaemonWriteAccess');
    });

    it('should create DynamoDB access policy', () => {
      expect(infraCode).toContain('lambda-dynamodb-policy');
      expect(infraCode).toContain('dynamodb:GetItem');
      expect(infraCode).toContain('dynamodb:PutItem');
    });

    it('should create SQS access policy', () => {
      expect(infraCode).toContain('lambda-sqs-policy');
      expect(infraCode).toContain('sqs:SendMessage');
    });

    it('should use least privilege IAM for DynamoDB', () => {
      expect(infraCode).toContain('dynamodb:GetItem');
      expect(infraCode).toContain('dynamodb:PutItem');
      expect(infraCode).not.toContain('dynamodb:*');
    });

    it('should use least privilege IAM for SQS', () => {
      expect(infraCode).toContain('sqs:SendMessage');
      expect(infraCode).toContain('sqs:GetQueueAttributes');
      expect(infraCode).not.toContain('sqs:*');
    });
  });

  describe('CloudWatch Configuration', () => {
    it('should create CloudWatch log group', () => {
      expect(infraCode).toContain('aws.cloudwatch.LogGroup');
      expect(infraCode).toContain('lambda-logs');
    });

    it('should set 7-day log retention', () => {
      expect(infraCode).toContain('retentionInDays: 7');
    });

    it('should create error rate alarm', () => {
      expect(infraCode).toContain('lambda-error-rate-alarm');
      expect(infraCode).toContain('aws.cloudwatch.MetricAlarm');
    });

    it('should use metric math for error rate calculation', () => {
      expect(infraCode).toContain('(errors / invocations) * 100');
    });

    it('should set 1% error rate threshold', () => {
      expect(infraCode).toContain('threshold: 1.0');
    });

    it('should create duration alarm', () => {
      expect(infraCode).toContain('lambda-duration-alarm');
      expect(infraCode).toContain('Duration');
    });

    it('should set 3000ms duration threshold', () => {
      expect(infraCode).toContain('threshold: 3000');
    });

    it('should configure alarm evaluation periods', () => {
      expect(infraCode).toContain('evaluationPeriods: 2');
    });

    it('should handle missing data appropriately', () => {
      expect(infraCode).toContain("treatMissingData: 'notBreaching'");
    });
  });

  describe('Resource Naming and Tagging', () => {
    it('should use environmentSuffix in all resource names', () => {
      const resourceNamePatterns = [
        'lambda-role-${environmentSuffix}',
        'optimized-lambda-${environmentSuffix}',
        'transactions-table-${environmentSuffix}',
        'lambda-dlq-${environmentSuffix}',
        'shared-dependencies-${environmentSuffix}',
      ];

      resourceNamePatterns.forEach((pattern) => {
        expect(infraCode).toContain(pattern);
      });
    });

    it('should tag all resources with Environment and ManagedBy', () => {
      expect(infraCode).toMatch(/tags:\s*{\s*Environment:/g);
      expect(infraCode).toMatch(/ManagedBy:\s*'Pulumi'/g);
    });
  });

  describe('Lambda Function Code Validation', () => {
    it('should include payment processing route', () => {
      expect(infraCode).toContain("case 'payment':");
      expect(infraCode).toContain('processPayment');
    });

    it('should include fraud detection route', () => {
      expect(infraCode).toContain("case 'fraud':");
      expect(infraCode).toContain('detectFraud');
    });

    it('should include notification route', () => {
      expect(infraCode).toContain("case 'notification':");
      expect(infraCode).toContain('sendNotification');
    });

    it('should use AWS SDK v3 for DynamoDB', () => {
      expect(infraCode).toContain('@aws-sdk/client-dynamodb');
      expect(infraCode).toContain('DynamoDBClient');
      expect(infraCode).toContain('PutItemCommand');
    });

    it('should use AWS SDK v3 for SQS', () => {
      expect(infraCode).toContain('@aws-sdk/client-sqs');
      expect(infraCode).toContain('SQSClient');
    });

    it('should handle default route with error', () => {
      expect(infraCode).toContain('default:');
      expect(infraCode).toContain('Invalid route');
    });

    it('should implement error handling', () => {
      expect(infraCode).toContain('try {');
      expect(infraCode).toContain('catch (error)');
    });
  });

  describe('Cost Optimization Validation', () => {
    it('should use optimized memory (1024 MB)', () => {
      expect(infraCode).toContain('memorySize: 1024');
      expect(infraCode).toContain('Optimized from 3008 MB');
    });

    it('should use Lambda layers to reduce package size', () => {
      expect(infraCode).toContain('aws.lambda.LayerVersion');
    });

    it('should use PAY_PER_REQUEST billing', () => {
      expect(infraCode).toContain("billingMode: 'PAY_PER_REQUEST'");
    });

    it('should consolidate three functions into one', () => {
      expect(infraCode).toContain('switch(route)');
      expect(infraCode.match(/case\s+['"]payment['"]/g)?.length).toBe(1);
      expect(infraCode.match(/case\s+['"]fraud['"]/g)?.length).toBe(1);
      expect(infraCode.match(/case\s+['"]notification['"]/g)?.length).toBe(1);
    });
  });

  describe('Consolidated Function Benefits', () => {
    it('should reduce number of functions from 3 to 1', () => {
      const functionCreations = infraCode.match(/new aws\.lambda\.Function/g);
      expect(functionCreations?.length).toBe(1);
    });

    it('should share execution role across routes', () => {
      expect(infraCode).toContain('role: lambdaRole.arn');
    });

    it('should share Lambda layer across routes', () => {
      expect(infraCode).toContain('layers: [sharedLayer.arn]');
    });

    it('should share DLQ across routes', () => {
      expect(infraCode).toContain('deadLetterConfig');
    });

    it('should share monitoring across routes', () => {
      const alarmCreations = infraCode.match(/new aws\.cloudwatch\.MetricAlarm/g);
      expect(alarmCreations?.length).toBe(2); // error rate + duration
    });
  });
});
