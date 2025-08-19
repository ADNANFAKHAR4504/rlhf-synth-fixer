import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { LambdaStack } from '../lib/lambda-stack';
import { ParameterStack } from '../lib/parameter-stack';
import { EventBridgeStack } from '../lib/eventbridge-stack';

// Mock Pulumi and AWS
(pulumi as any).runtime = {
  isDryRun: () => true,
  setMocks: () => {},
  registerStackTransformation: () => {},
} as any;

describe('LambdaStack', () => {
  let stack: LambdaStack;
  const mockLambda = {
    name: pulumi.Output.create('test-lambda'),
    arn: pulumi.Output.create(
      'arn:aws:lambda:us-west-2:123456789012:function:test-lambda'
    ),
  };
  const mockLogGroup = {
    name: pulumi.Output.create('/aws/lambda/test-lambda'),
  };
  const mockS3Object = {
    id: pulumi.Output.create('lambda-code-object'),
  };

  // Mock ParameterStack
  const mockParameterStack = {
    dbEndpointParam: {
      name: pulumi.Output.create('/tap/test/database/endpoint'),
    },
    dbUsernameParam: {
      name: pulumi.Output.create('/tap/test/database/username'),
    },
    dbPasswordParam: {
      name: pulumi.Output.create('/tap/test/database/password'),
    },
    dbNameParam: { name: pulumi.Output.create('/tap/test/database/name') },
  } as unknown as ParameterStack;

  // Mock EventBridgeStack
  const mockEventBridgeStack = {
    customEventBus: {
      name: pulumi.Output.create('tap-application-events-test'),
    },
  } as unknown as EventBridgeStack;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AWS resources
    jest
      .spyOn(aws.lambda, 'Function')
      .mockImplementation((() => mockLambda) as any);
    jest
      .spyOn(aws.cloudwatch, 'LogGroup')
      .mockImplementation((() => mockLogGroup) as any);
  });

  describe('constructor', () => {
    it('should create Lambda function with correct configuration', () => {
      const bucketName = pulumi.Output.create('test-bucket');
      const lambdaRoleArn = pulumi.Output.create(
        'arn:aws:iam::123456789012:role/lambda-role'
      );

      stack = new LambdaStack('test-lambda', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        bucketName,
        lambdaRoleArn,
        parameterStack: mockParameterStack,
        eventBridgeStack: mockEventBridgeStack,
      });

      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.stringContaining('tap-lambda-test'),
        expect.objectContaining({
          name: 'tap-lambda-test',
          role: lambdaRoleArn,
          handler: 'index.handler',
          runtime: 'nodejs18.x',
          s3Bucket: bucketName,
          s3Key: 'lambda-function.zip',
        }),
        expect.any(Object)
      );
    });

    it('should configure Lambda scaling settings', () => {
      const bucketName = pulumi.Output.create('test-bucket');
      const lambdaRoleArn = pulumi.Output.create(
        'arn:aws:iam::123456789012:role/lambda-role'
      );

      stack = new LambdaStack('test-lambda', {
        environmentSuffix: 'test',
        bucketName,
        lambdaRoleArn,
        parameterStack: mockParameterStack,
        eventBridgeStack: mockEventBridgeStack,
      });

      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          timeout: 30,
          memorySize: 128,
        }),
        expect.any(Object)
      );
    });

    it('should set environment variables', () => {
      const bucketName = pulumi.Output.create('test-bucket');
      const lambdaRoleArn = pulumi.Output.create(
        'arn:aws:iam::123456789012:role/lambda-role'
      );

      stack = new LambdaStack('test-lambda', {
        environmentSuffix: 'test',
        bucketName,
        lambdaRoleArn,
        parameterStack: mockParameterStack,
        eventBridgeStack: mockEventBridgeStack,
      });

      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          environment: {
            variables: expect.objectContaining({
              ENVIRONMENT: 'test',
              NODE_ENV: 'production',
            }),
          },
        }),
        expect.any(Object)
      );
    });

    it('should configure logging', () => {
      const bucketName = pulumi.Output.create('test-bucket');
      const lambdaRoleArn = pulumi.Output.create(
        'arn:aws:iam::123456789012:role/lambda-role'
      );

      stack = new LambdaStack('test-lambda', {
        environmentSuffix: 'test',
        bucketName,
        lambdaRoleArn,
        parameterStack: mockParameterStack,
        eventBridgeStack: mockEventBridgeStack,
      });

      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          loggingConfig: {
            logFormat: 'JSON',
            logGroup: '/aws/lambda/tap-lambda-test',
          },
        }),
        expect.any(Object)
      );
    });

    it('should create CloudWatch log group', () => {
      const bucketName = pulumi.Output.create('test-bucket');
      const lambdaRoleArn = pulumi.Output.create(
        'arn:aws:iam::123456789012:role/lambda-role'
      );

      stack = new LambdaStack('test-lambda', {
        environmentSuffix: 'test',
        bucketName,
        lambdaRoleArn,
        parameterStack: mockParameterStack,
        eventBridgeStack: mockEventBridgeStack,
      });

      expect(aws.cloudwatch.LogGroup).toHaveBeenCalledWith(
        expect.stringContaining('tap-lambda-logs-test'),
        expect.objectContaining({
          name: '/aws/lambda/tap-lambda-test',
          retentionInDays: 14,
        }),
        expect.any(Object)
      );
    });

    it('should add dependency on S3 object if provided', () => {
      const bucketName = pulumi.Output.create('test-bucket');
      const lambdaRoleArn = pulumi.Output.create(
        'arn:aws:iam::123456789012:role/lambda-role'
      );

      stack = new LambdaStack('test-lambda', {
        environmentSuffix: 'test',
        bucketName,
        lambdaRoleArn,
        lambdaCodeObject: mockS3Object as any,
        parameterStack: mockParameterStack,
        eventBridgeStack: mockEventBridgeStack,
      });

      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({
          dependsOn: expect.arrayContaining([mockS3Object]),
        })
      );
    });

    it('should expose Lambda function', () => {
      const bucketName = pulumi.Output.create('test-bucket');
      const lambdaRoleArn = pulumi.Output.create(
        'arn:aws:iam::123456789012:role/lambda-role'
      );

      stack = new LambdaStack('test-lambda', {
        environmentSuffix: 'test',
        bucketName,
        lambdaRoleArn,
        parameterStack: mockParameterStack,
        eventBridgeStack: mockEventBridgeStack,
      });

      expect(stack.lambdaFunction).toBeDefined();
      expect(stack.lambdaFunction).toBe(mockLambda);
    });

    it('should use default environment suffix when not provided', () => {
      const bucketName = pulumi.Output.create('test-bucket');
      const lambdaRoleArn = pulumi.Output.create(
        'arn:aws:iam::123456789012:role/lambda-role'
      );

      stack = new LambdaStack('test-lambda', {
        bucketName,
        lambdaRoleArn,
        parameterStack: mockParameterStack,
        eventBridgeStack: mockEventBridgeStack,
      });

      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.stringContaining('tap-lambda-dev'),
        expect.objectContaining({
          name: 'tap-lambda-dev',
        }),
        expect.any(Object)
      );
    });
  });
});
