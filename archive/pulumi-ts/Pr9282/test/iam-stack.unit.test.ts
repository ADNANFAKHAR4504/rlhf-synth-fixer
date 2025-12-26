import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { IamStack } from '../lib/iam-stack';

// Mock Pulumi and AWS
(pulumi as any).runtime = {
  isDryRun: () => true,
  setMocks: () => {},
  registerStackTransformation: () => {},
} as any;

describe('IamStack', () => {
  let stack: IamStack;
  const mockRole = {
    name: pulumi.Output.create('test-role'),
    arn: pulumi.Output.create('arn:aws:iam::123456789012:role/test-role'),
  };
  const mockPolicy = {
    arn: pulumi.Output.create('arn:aws:iam::123456789012:policy/test-policy'),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock AWS IAM resources
    jest.spyOn(aws.iam, 'Role').mockImplementation((() => mockRole) as any);
    jest.spyOn(aws.iam, 'Policy').mockImplementation((() => mockPolicy) as any);
    jest
      .spyOn(aws.iam, 'RolePolicyAttachment')
      .mockImplementation((() => ({})) as any);
  });

  describe('constructor', () => {
    it('should create Lambda IAM role with correct trust policy', () => {
      const bucketArn = pulumi.Output.create('arn:aws:s3:::test-bucket');
      const eventBusArn = pulumi.Output.create(
        'arn:aws:events:us-west-2:123456789012:event-bus/test-bus'
      );
      stack = new IamStack('test-iam', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
        bucketArn,
        eventBusArn,
      });

      expect(aws.iam.Role).toHaveBeenCalledWith(
        expect.stringContaining('tap-lambda-role-test'),
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining('lambda.amazonaws.com'),
          tags: expect.objectContaining({ Environment: 'test' }),
        }),
        expect.any(Object)
      );
    });

    it('should attach basic Lambda execution policy', () => {
      const bucketArn = pulumi.Output.create('arn:aws:s3:::test-bucket');
      const eventBusArn = pulumi.Output.create(
        'arn:aws:events:us-west-2:123456789012:event-bus/test-bus'
      );
      stack = new IamStack('test-iam', {
        environmentSuffix: 'test',
        bucketArn,
        eventBusArn,
      });

      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        expect.stringContaining('tap-lambda-basic-execution-test'),
        expect.objectContaining({
          role: mockRole.name,
          policyArn:
            'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        }),
        expect.any(Object)
      );
    });

    it('should create custom S3 access policy', () => {
      const bucketArn = pulumi.Output.create('arn:aws:s3:::test-bucket');
      const eventBusArn = pulumi.Output.create(
        'arn:aws:events:us-west-2:123456789012:event-bus/test-bus'
      );
      stack = new IamStack('test-iam', {
        environmentSuffix: 'test',
        bucketArn,
        eventBusArn,
      });

      expect(aws.iam.Policy).toHaveBeenCalledWith(
        expect.stringContaining('tap-lambda-s3-policy-test'),
        expect.objectContaining({
          description: 'Policy for Lambda to access S3 bucket',
        }),
        expect.any(Object)
      );
    });

    it('should attach S3 policy to Lambda role', () => {
      const bucketArn = pulumi.Output.create('arn:aws:s3:::test-bucket');
      const eventBusArn = pulumi.Output.create(
        'arn:aws:events:us-west-2:123456789012:event-bus/test-bus'
      );
      stack = new IamStack('test-iam', {
        environmentSuffix: 'test',
        bucketArn,
        eventBusArn,
      });

      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        expect.stringContaining('tap-lambda-s3-policy-attachment-test'),
        expect.objectContaining({
          role: mockRole.name,
          policyArn: mockPolicy.arn,
        }),
        expect.any(Object)
      );
    });

    it('should expose Lambda role ARN', () => {
      const bucketArn = pulumi.Output.create('arn:aws:s3:::test-bucket');
      const eventBusArn = pulumi.Output.create(
        'arn:aws:events:us-west-2:123456789012:event-bus/test-bus'
      );
      stack = new IamStack('test-iam', {
        environmentSuffix: 'test',
        bucketArn,
        eventBusArn,
      });

      expect(stack.lambdaRoleArn).toBeDefined();
      expect(stack.lambdaRoleArn).toBe(mockRole.arn);
    });

    it('should expose Lambda role', () => {
      const bucketArn = pulumi.Output.create('arn:aws:s3:::test-bucket');
      const eventBusArn = pulumi.Output.create(
        'arn:aws:events:us-west-2:123456789012:event-bus/test-bus'
      );
      stack = new IamStack('test-iam', {
        environmentSuffix: 'test',
        bucketArn,
        eventBusArn,
      });

      expect(stack.lambdaRole).toBeDefined();
      expect(stack.lambdaRole).toBe(mockRole);
    });

    it('should use default environment suffix when not provided', () => {
      const bucketArn = pulumi.Output.create('arn:aws:s3:::test-bucket');
      const eventBusArn = pulumi.Output.create(
        'arn:aws:events:us-west-2:123456789012:event-bus/test-bus'
      );
      stack = new IamStack('test-iam', {
        bucketArn,
        eventBusArn,
      });

      expect(aws.iam.Role).toHaveBeenCalledWith(
        expect.stringContaining('tap-lambda-role-dev'),
        expect.any(Object),
        expect.any(Object)
      );
    });

    it('should create two policy attachments', () => {
      const bucketArn = pulumi.Output.create('arn:aws:s3:::test-bucket');
      const eventBusArn = pulumi.Output.create(
        'arn:aws:events:us-west-2:123456789012:event-bus/test-bus'
      );
      stack = new IamStack('test-iam', {
        environmentSuffix: 'test',
        bucketArn,
        eventBusArn,
      });

      // Should have 4 policy attachments: Basic execution, S3, Parameter Store, EventBridge
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledTimes(4);
    });
  });
});
