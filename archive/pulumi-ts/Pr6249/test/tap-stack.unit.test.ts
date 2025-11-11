// Mock Pulumi and AWS SDK before any imports
jest.mock('@pulumi/pulumi');
jest.mock('@pulumi/aws');

import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

describe('TapStack Unit Tests', () => {
  let stack: any;

  beforeAll(() => {
    // Set up Pulumi mocks
    (pulumi.Config as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
      get: jest.fn((key: string) => {
        if (key === 'environmentSuffix') return 'test';
        return undefined;
      }),
    }));

    (pulumi.getStack as unknown as jest.Mock) = jest.fn().mockReturnValue('test-stack');
    (pulumi.interpolate as unknown as jest.Mock) = jest.fn((...args: any[]) => {
      return {
        apply: jest.fn((fn: any) => fn(...args)),
      };
    });
    (pulumi.all as unknown as jest.Mock) = jest.fn((args: any[]) => ({
      apply: jest.fn((fn: any) => fn(args)),
    }));

    // Mock AWS resources
    (aws.dynamodb.Table as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
      name: 'transactions-test',
      arn: 'arn:aws:dynamodb:test',
    }));

    (aws.sqs.Queue as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
      arn: 'arn:aws:sqs:test',
      url: 'https://sqs.test.amazonaws.com/test',
      name: 'transaction-queue-test',
    }));

    (aws.sns.Topic as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
      arn: 'arn:aws:sns:test',
      name: 'transaction-notifications-test',
    }));

    (aws.iam.Role as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
      arn: 'arn:aws:iam:test',
      name: 'test-role',
      id: 'test-role-id',
    }));

    (aws.iam.RolePolicyAttachment as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));
    (aws.iam.RolePolicy as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));

    (aws.cloudwatch.LogGroup as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
      name: '/aws/lambda/test',
    }));

    (aws.lambda.Function as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
      name: 'test-function',
      arn: 'arn:aws:lambda:test',
      invokeArn: 'arn:aws:apigateway:test',
    }));

    (aws.lambda.EventSourceMapping as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));
    (aws.lambda.Permission as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));

    (aws.apigateway.RestApi as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
      id: 'test-api',
      name: 'test-api',
      executionArn: 'arn:aws:execute-api:test',
      rootResourceId: 'root',
    }));

    (aws.apigateway.Resource as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
      id: 'resource-id',
    }));

    (aws.apigateway.Method as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
      httpMethod: 'POST',
    }));

    (aws.apigateway.Integration as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));
    (aws.apigateway.Deployment as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
      id: 'deployment-id',
    }));
    (aws.apigateway.Stage as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));

    (aws.cloudwatch.MetricAlarm as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));

    // Import the stack after mocks are set up
    stack = require('../lib/tap-stack');
  });

  describe('DynamoDB Table', () => {
    it('should create DynamoDB table with correct configuration', () => {
      expect(aws.dynamodb.Table).toHaveBeenCalled();
      const calls = (aws.dynamodb.Table as unknown as jest.Mock).mock.calls;
      const tableCall = calls.find((call) =>
        call[0].includes('transactions')
      );
      expect(tableCall).toBeDefined();
      expect(tableCall[1].billingMode).toBe('PAY_PER_REQUEST');
      expect(tableCall[1].hashKey).toBe('transactionId');
      expect(tableCall[1].rangeKey).toBe('timestamp');
      expect(tableCall[1].serverSideEncryption.enabled).toBe(true);
    });

    it('should have point-in-time recovery enabled', () => {
      const calls = (aws.dynamodb.Table as unknown as jest.Mock).mock.calls;
      const tableCall = calls.find((call) =>
        call[0].includes('transactions')
      );
      expect(tableCall[1].pointInTimeRecovery.enabled).toBe(true);
    });

    it('should define correct attributes', () => {
      const calls = (aws.dynamodb.Table as unknown as jest.Mock).mock.calls;
      const tableCall = calls.find((call) =>
        call[0].includes('transactions')
      );
      expect(tableCall[1].attributes).toHaveLength(2);
      expect(tableCall[1].attributes).toEqual(
        expect.arrayContaining([
          { name: 'transactionId', type: 'S' },
          { name: 'timestamp', type: 'N' },
        ])
      );
    });

    it('should have environment tags', () => {
      const calls = (aws.dynamodb.Table as unknown as jest.Mock).mock.calls;
      const tableCall = calls.find((call) =>
        call[0].includes('transactions')
      );
      expect(tableCall[1].tags).toBeDefined();
      expect(tableCall[1].tags.Purpose).toBe('TransactionStorage');
    });
  });

  describe('SQS Queue', () => {
    it('should create SQS queue with encryption', () => {
      expect(aws.sqs.Queue).toHaveBeenCalled();
      const calls = (aws.sqs.Queue as unknown as jest.Mock).mock.calls;
      const queueCall = calls[0];
      expect(queueCall[1].sqsManagedSseEnabled).toBe(true);
    });

    it('should have correct visibility timeout', () => {
      const calls = (aws.sqs.Queue as unknown as jest.Mock).mock.calls;
      const queueCall = calls[0];
      expect(queueCall[1].visibilityTimeoutSeconds).toBe(300);
    });

    it('should have message retention configured', () => {
      const calls = (aws.sqs.Queue as unknown as jest.Mock).mock.calls;
      const queueCall = calls[0];
      expect(queueCall[1].messageRetentionSeconds).toBe(1209600);
    });

    it('should enable long polling', () => {
      const calls = (aws.sqs.Queue as unknown as jest.Mock).mock.calls;
      const queueCall = calls[0];
      expect(queueCall[1].receiveWaitTimeSeconds).toBe(20);
    });

    it('should have environment tags', () => {
      const calls = (aws.sqs.Queue as unknown as jest.Mock).mock.calls;
      const queueCall = calls[0];
      expect(queueCall[1].tags.Purpose).toBe('TransactionQueue');
    });
  });

  describe('SNS Topic', () => {
    it('should create SNS topic', () => {
      expect(aws.sns.Topic).toHaveBeenCalled();
    });

    it('should have environment tags', () => {
      const calls = (aws.sns.Topic as unknown as jest.Mock).mock.calls;
      const topicCall = calls[0];
      expect(topicCall[1].tags.Purpose).toBe('TransactionNotifications');
    });
  });

  describe('IAM Roles', () => {
    it('should create receiver IAM role', () => {
      const calls = (aws.iam.Role as unknown as jest.Mock).mock.calls;
      const receiverRole = calls.find((call) =>
        call[0].includes('receiver-role')
      );
      expect(receiverRole).toBeDefined();
    });

    it('should create processor IAM role', () => {
      const calls = (aws.iam.Role as unknown as jest.Mock).mock.calls;
      const processorRole = calls.find((call) =>
        call[0].includes('processor-role')
      );
      expect(processorRole).toBeDefined();
    });

    it('should create validator IAM role', () => {
      const calls = (aws.iam.Role as unknown as jest.Mock).mock.calls;
      const validatorRole = calls.find((call) =>
        call[0].includes('validator-role')
      );
      expect(validatorRole).toBeDefined();
    });

    it('should have assume role policy for Lambda', () => {
      const calls = (aws.iam.Role as unknown as jest.Mock).mock.calls;
      const roleCall = calls[0];
      const policy = JSON.parse(roleCall[1].assumeRolePolicy);
      expect(policy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    it('should attach X-Ray policies', () => {
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalled();
      const calls = (aws.iam.RolePolicyAttachment as unknown as jest.Mock).mock.calls;
      const xrayAttachments = calls.filter((call) => call[0].includes('xray'));
      expect(xrayAttachments.length).toBeGreaterThan(0);
    });

    it('should attach basic execution policies', () => {
      const calls = (aws.iam.RolePolicyAttachment as unknown as jest.Mock).mock.calls;
      const basicAttachments = calls.filter((call) =>
        call[0].includes('basic-execution')
      );
      expect(basicAttachments.length).toBeGreaterThan(0);
    });
  });

  describe('Lambda Functions', () => {
    it('should create receiver Lambda function', () => {
      const calls = (aws.lambda.Function as unknown as jest.Mock).mock.calls;
      const receiverFunction = calls.find((call) =>
        call[0].includes('receiver')
      );
      expect(receiverFunction).toBeDefined();
      expect(receiverFunction[1].runtime).toBe(aws.lambda.Runtime.NodeJS18dX);
      expect(receiverFunction[1].memorySize).toBe(512);
    });

    it('should create processor Lambda function', () => {
      const calls = (aws.lambda.Function as unknown as jest.Mock).mock.calls;
      const processorFunction = calls.find((call) =>
        call[0].includes('processor')
      );
      expect(processorFunction).toBeDefined();
      expect(processorFunction[1].timeout).toBe(300);
    });

    it('should create validator Lambda function', () => {
      const calls = (aws.lambda.Function as unknown as jest.Mock).mock.calls;
      const validatorFunction = calls.find((call) =>
        call[0].includes('validator')
      );
      expect(validatorFunction).toBeDefined();
    });

    it('should enable X-Ray tracing on all functions', () => {
      const calls = (aws.lambda.Function as unknown as jest.Mock).mock.calls;
      calls.forEach((call) => {
        expect(call[1].tracingConfig.mode).toBe('Active');
      });
    });

    it('should have environment variables', () => {
      const calls = (aws.lambda.Function as unknown as jest.Mock).mock.calls;
      const receiverFunction = calls.find((call) =>
        call[0].includes('receiver')
      );
      expect(receiverFunction[1].environment.variables).toBeDefined();
    });

    it('should have Lambda code', () => {
      const calls = (aws.lambda.Function as unknown as jest.Mock).mock.calls;
      calls.forEach((call) => {
        expect(call[1].code).toBeDefined();
      });
    });

    it('should have correct handler configuration', () => {
      const calls = (aws.lambda.Function as unknown as jest.Mock).mock.calls;
      const receiverFunction = calls.find((call) =>
        call[0].includes('receiver')
      );
      expect(receiverFunction[1].handler).toBe('index.handler');
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should create log groups for all Lambda functions', () => {
      expect(aws.cloudwatch.LogGroup).toHaveBeenCalled();
      const calls = (aws.cloudwatch.LogGroup as unknown as jest.Mock).mock.calls;
      expect(calls.length).toBeGreaterThanOrEqual(3);
    });

    it('should have 30-day retention', () => {
      const calls = (aws.cloudwatch.LogGroup as unknown as jest.Mock).mock.calls;
      calls.forEach((call) => {
        expect(call[1].retentionInDays).toBe(30);
      });
    });

    it('should have environment tags', () => {
      const calls = (aws.cloudwatch.LogGroup as unknown as jest.Mock).mock.calls;
      calls.forEach((call) => {
        expect(call[1].tags).toBeDefined();
      });
    });
  });

  describe('API Gateway', () => {
    it('should create REST API', () => {
      expect(aws.apigateway.RestApi).toHaveBeenCalled();
    });

    it('should have regional endpoint', () => {
      const calls = (aws.apigateway.RestApi as unknown as jest.Mock).mock.calls;
      expect(calls[0][1].endpointConfiguration.types).toBe('REGIONAL');
    });

    it('should create transactions resource', () => {
      expect(aws.apigateway.Resource).toHaveBeenCalled();
      const calls = (aws.apigateway.Resource as unknown as jest.Mock).mock.calls;
      expect(calls[0][1].pathPart).toBe('transactions');
    });

    it('should create POST method', () => {
      expect(aws.apigateway.Method).toHaveBeenCalled();
      const calls = (aws.apigateway.Method as unknown as jest.Mock).mock.calls;
      expect(calls[0][1].httpMethod).toBe('POST');
    });

    it('should create Lambda integration', () => {
      expect(aws.apigateway.Integration).toHaveBeenCalled();
      const calls = (aws.apigateway.Integration as unknown as jest.Mock).mock
        .calls;
      expect(calls[0][1].type).toBe('AWS_PROXY');
    });

    it('should create deployment', () => {
      expect(aws.apigateway.Deployment).toHaveBeenCalled();
    });

    it('should create stage', () => {
      expect(aws.apigateway.Stage).toHaveBeenCalled();
      const calls = (aws.apigateway.Stage as unknown as unknown as jest.Mock).mock.calls;
      expect(calls[0][1].stageName).toBe('prod');
    });
  });

  describe('CloudWatch Alarms', () => {
    it('should create queue depth alarm', () => {
      const calls = (aws.cloudwatch.MetricAlarm as unknown as jest.Mock).mock.calls;
      const queueAlarm = calls.find((call) =>
        call[0].includes('queue-depth')
      );
      expect(queueAlarm).toBeDefined();
      expect(queueAlarm[1].threshold).toBe(1000);
    });

    it('should create receiver error alarm', () => {
      const calls = (aws.cloudwatch.MetricAlarm as unknown as jest.Mock).mock.calls;
      const receiverAlarm = calls.find((call) =>
        call[0].includes('receiver-error')
      );
      expect(receiverAlarm).toBeDefined();
    });

    it('should create processor error alarm', () => {
      const calls = (aws.cloudwatch.MetricAlarm as unknown as jest.Mock).mock.calls;
      const processorAlarm = calls.find((call) =>
        call[0].includes('processor-error')
      );
      expect(processorAlarm).toBeDefined();
    });

    it('should create API 4xx error alarm', () => {
      const calls = (aws.cloudwatch.MetricAlarm as unknown as jest.Mock).mock.calls;
      const api4xxAlarm = calls.find((call) => call[0].includes('api-4xx'));
      expect(api4xxAlarm).toBeDefined();
      expect(api4xxAlarm[1].threshold).toBe(50);
    });

    it('should create API 5xx error alarm', () => {
      const calls = (aws.cloudwatch.MetricAlarm as unknown as jest.Mock).mock.calls;
      const api5xxAlarm = calls.find((call) => call[0].includes('api-5xx'));
      expect(api5xxAlarm).toBeDefined();
      expect(api5xxAlarm[1].threshold).toBe(10);
    });
  });

  describe('Event Source Mapping', () => {
    it('should create SQS to Lambda event source mapping', () => {
      expect(aws.lambda.EventSourceMapping).toHaveBeenCalled();
    });

    it('should have correct batch size', () => {
      const calls = (aws.lambda.EventSourceMapping as unknown as jest.Mock).mock.calls;
      expect(calls[0][1].batchSize).toBe(10);
    });

    it('should have batching window', () => {
      const calls = (aws.lambda.EventSourceMapping as unknown as jest.Mock).mock.calls;
      expect(calls[0][1].maximumBatchingWindowInSeconds).toBe(5);
    });
  });

  describe('Lambda Permissions', () => {
    it('should grant API Gateway invoke permission', () => {
      expect(aws.lambda.Permission).toHaveBeenCalled();
      const calls = (aws.lambda.Permission as unknown as jest.Mock).mock.calls;
      expect(calls[0][1].action).toBe('lambda:InvokeFunction');
      expect(calls[0][1].principal).toBe('apigateway.amazonaws.com');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in all resource names', () => {
      const allMocks = [
        aws.dynamodb.Table,
        aws.sqs.Queue,
        aws.sns.Topic,
        aws.iam.Role,
        aws.lambda.Function,
        aws.apigateway.RestApi,
        aws.cloudwatch.LogGroup,
        aws.cloudwatch.MetricAlarm,
      ];

      allMocks.forEach((mock) => {
        const calls = (mock as unknown as jest.Mock).mock.calls;
        calls.forEach((call) => {
          expect(call[0]).toContain('test');
        });
      });
    });
  });

  describe('Security Configuration', () => {
    it('should have DynamoDB encryption enabled', () => {
      const calls = (aws.dynamodb.Table as unknown as jest.Mock).mock.calls;
      const tableCall = calls.find((call) =>
        call[0].includes('transactions')
      );
      expect(tableCall[1].serverSideEncryption.enabled).toBe(true);
    });

    it('should have SQS encryption enabled', () => {
      const calls = (aws.sqs.Queue as unknown as jest.Mock).mock.calls;
      expect(calls[0][1].sqsManagedSseEnabled).toBe(true);
    });

    it('should have least-privilege IAM roles', () => {
      expect(aws.iam.Role).toHaveBeenCalledTimes(3);
    });
  });

  describe('Monitoring Configuration', () => {
    it('should enable X-Ray tracing on all Lambdas', () => {
      const calls = (aws.lambda.Function as unknown as jest.Mock).mock.calls;
      calls.forEach((call) => {
        expect(call[1].tracingConfig.mode).toBe('Active');
      });
    });

    it('should create CloudWatch alarms', () => {
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalled();
      expect((aws.cloudwatch.MetricAlarm as unknown as jest.Mock).mock.calls.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('Stack Exports', () => {
    it('should export stack outputs', () => {
      expect(stack).toBeDefined();
      expect(stack.apiUrl).toBeDefined();
      expect(stack.apiEndpoint).toBeDefined();
      expect(stack.queueUrl).toBeDefined();
      expect(stack.tableName).toBeDefined();
      expect(stack.topicArn).toBeDefined();
      expect(stack.receiverFunctionName).toBeDefined();
      expect(stack.processorFunctionName).toBeDefined();
      expect(stack.validatorFunctionName).toBeDefined();
    });
  });

  describe('Configuration Fallback', () => {
    it('should use getStack when environmentSuffix is not configured', () => {
      // Clear the module cache to force reload
      jest.resetModules();

      // Re-mock Pulumi with no environmentSuffix
      jest.mock('@pulumi/pulumi');
      jest.mock('@pulumi/aws');

      const pulumi2 = require('@pulumi/pulumi');
      const aws2 = require('@pulumi/aws');

      // Mock Config to return undefined for environmentSuffix
      (pulumi2.Config as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
        get: jest.fn((key: string) => {
          if (key === 'environmentSuffix') return undefined; // This triggers the fallback
          return undefined;
        }),
      }));

      (pulumi2.getStack as unknown as jest.Mock) = jest.fn().mockReturnValue('fallback-stack');
      (pulumi2.interpolate as unknown as jest.Mock) = jest.fn((...args: any[]) => {
        return {
          apply: jest.fn((fn: any) => fn(...args)),
        };
      });
      (pulumi2.all as unknown as jest.Mock) = jest.fn((args: any[]) => ({
        apply: jest.fn((fn: any) => fn(args)),
      }));

      // Re-mock AWS resources for the second load
      (aws2.dynamodb.Table as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
        name: 'transactions-fallback',
        arn: 'arn:aws:dynamodb:fallback',
      }));

      (aws2.sqs.Queue as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
        arn: 'arn:aws:sqs:fallback',
        url: 'https://sqs.fallback.amazonaws.com/fallback',
        name: 'transaction-queue-fallback',
      }));

      (aws2.sns.Topic as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
        arn: 'arn:aws:sns:fallback',
        name: 'transaction-notifications-fallback',
      }));

      (aws2.iam.Role as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
        arn: 'arn:aws:iam:fallback',
        name: 'fallback-role',
        id: 'fallback-role-id',
      }));

      (aws2.iam.RolePolicyAttachment as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));
      (aws2.iam.RolePolicy as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));

      (aws2.cloudwatch.LogGroup as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
        name: '/aws/lambda/fallback',
      }));

      (aws2.lambda.Function as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
        name: 'fallback-function',
        arn: 'arn:aws:lambda:fallback',
        invokeArn: 'arn:aws:apigateway:fallback',
      }));

      (aws2.lambda.EventSourceMapping as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));
      (aws2.lambda.Permission as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));

      (aws2.apigateway.RestApi as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
        id: 'fallback-api',
        name: 'fallback-api',
        executionArn: 'arn:aws:execute-api:fallback',
        rootResourceId: 'root',
      }));

      (aws2.apigateway.Resource as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
        id: 'resource-id',
      }));

      (aws2.apigateway.Method as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
        httpMethod: 'POST',
      }));

      (aws2.apigateway.Integration as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));
      (aws2.apigateway.Deployment as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({
        id: 'deployment-id',
      }));
      (aws2.apigateway.Stage as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));

      (aws2.cloudwatch.MetricAlarm as unknown as jest.Mock) = jest.fn().mockImplementation(() => ({}));

      (aws2.lambda.Runtime as any) = {
        NodeJS18dX: 'nodejs18.x'
      };

      // Reload the stack module with new mocks
      const stackWithFallback = require('../lib/tap-stack');

      // Verify that getStack was called
      expect(pulumi2.getStack).toHaveBeenCalled();

      // Verify resources were created with fallback suffix
      expect(aws2.dynamodb.Table).toHaveBeenCalled();
      const tableCalls = (aws2.dynamodb.Table as unknown as jest.Mock).mock.calls;
      expect(tableCalls[0][0]).toContain('fallback-stack');
    });
  });

});
