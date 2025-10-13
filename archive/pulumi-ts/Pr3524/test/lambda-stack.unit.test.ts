import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { LambdaStack } from '../lib/lambda-stack';

jest.mock('@pulumi/pulumi');
jest.mock('@pulumi/aws');

describe('LambdaStack', () => {
  let stack: LambdaStack;

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock Pulumi core functions
    (pulumi as any).all = jest
      .fn()
      .mockImplementation((values) => ({
        apply: (fn: any) => fn(values)
      }));
    (pulumi as any).Output = jest.fn().mockImplementation(value => ({
      promise: () => Promise.resolve(value),
      apply: (fn: any) => fn(value),
    }));
    (pulumi as any).output = jest.fn().mockImplementation(value => value);
    (pulumi as any).asset = {
      AssetArchive: jest.fn(),
      StringAsset: jest.fn(),
    };
    (pulumi as any).ComponentResource = jest.fn();

    // Mock AWS resources
    const mockRole = { arn: 'arn:aws:iam::123456789012:role/mock-role' };
    const mockLambda = {
      arn: 'arn:aws:lambda:us-east-1:123456789012:function:mock-function',
      qualifiedArn: 'arn:aws:lambda:us-east-1:123456789012:function:mock-function:1',
      name: 'mock-function-name'
    };

    (aws.iam.Role as any) = jest.fn().mockImplementation(() => mockRole);
    (aws.iam.RolePolicyAttachment as any) = jest.fn();
    (aws.iam.RolePolicy as any) = jest.fn();
    (aws.lambda.Function as any) = jest.fn().mockImplementation(() => mockLambda);
  });

  describe('with required parameters', () => {
    beforeEach(() => {
      // Create mock outputs that have the apply method
      const createMockOutput = (value: any) => ({
        apply: (fn: any) => fn(value),
        promise: () => Promise.resolve(value)
      });

      stack = new LambdaStack('TestLambdaStack', {
        environmentSuffix: 'test',
        licensesTableArn: createMockOutput('arn:aws:dynamodb:us-east-1:123456789012:table/licenses') as any,
        analyticsTableArn: createMockOutput('arn:aws:dynamodb:us-east-1:123456789012:table/analytics') as any,
        logGroupArns: createMockOutput([
          'arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/test1',
          'arn:aws:logs:us-east-1:123456789012:log-group:/aws/lambda/test2',
        ]) as any,
        tags: {
          Environment: 'test',
        },
      });
    });

    it('should instantiate successfully', () => {
      expect(stack).toBeDefined();
    });

    it('should have expected outputs', () => {
      expect(stack.edgeLambdaQualifiedArn).toBeDefined();
      expect(stack.licenseApiLambdaArn).toBeDefined();
      expect(stack.licenseApiLambdaName).toBeDefined();
      expect(stack.usageTrackingLambdaArn).toBeDefined();
      expect(stack.usageTrackingLambdaName).toBeDefined();
      expect(stack.signedUrlLambdaArn).toBeDefined();
      expect(stack.signedUrlLambdaName).toBeDefined();
    });

    it('should create Edge Lambda IAM role', () => {
      expect(aws.iam.Role).toHaveBeenCalledWith(
        expect.stringContaining('edge-lambda-role'),
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining('edgelambda.amazonaws.com'),
        }),
        expect.any(Object)
      );
    });

    it('should create regular Lambda IAM role', () => {
      expect(aws.iam.Role).toHaveBeenCalledWith(
        expect.stringContaining('lambda-role'),
        expect.objectContaining({
          assumeRolePolicy: expect.stringContaining('lambda.amazonaws.com'),
        }),
        expect.any(Object)
      );
    });

    it('should create license verification Edge Lambda', () => {
      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.stringContaining('license-verify-edge'),
        expect.objectContaining({
          runtime: 'nodejs18.x',
          handler: 'index.handler',
          timeout: 5,
          memorySize: 128,
          publish: true,
        }),
        expect.any(Object)
      );
    });

    it('should create license API Lambda', () => {
      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.stringContaining('license-api'),
        expect.objectContaining({
          runtime: 'nodejs18.x',
          handler: 'index.handler',
          timeout: 10,
          memorySize: 256,
          environment: expect.objectContaining({
            variables: expect.objectContaining({
              LICENSES_TABLE: expect.stringContaining('licenses-test'),
            }),
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create usage tracking Lambda', () => {
      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.stringContaining('usage-tracking'),
        expect.objectContaining({
          runtime: 'nodejs18.x',
          handler: 'index.handler',
          timeout: 10,
          memorySize: 256,
          environment: expect.objectContaining({
            variables: expect.objectContaining({
              ANALYTICS_TABLE: expect.stringContaining('download-analytics-test'),
            }),
          }),
        }),
        expect.any(Object)
      );
    });

    it('should create signed URL generation Lambda', () => {
      expect(aws.lambda.Function).toHaveBeenCalledWith(
        expect.stringContaining('signed-url-generator'),
        expect.objectContaining({
          runtime: 'nodejs18.x',
          handler: 'index.handler',
          timeout: 30,
          memorySize: 512,
          environment: expect.objectContaining({
            variables: expect.objectContaining({
              DISTRIBUTION_DOMAIN: 'REPLACE_WITH_DISTRIBUTION_DOMAIN',
              CLOUDFRONT_KEY_PAIR_ID: 'REPLACE_WITH_KEY_PAIR_ID',
            }),
          }),
        }),
        expect.any(Object)
      );
    });

    it('should attach basic execution policies', () => {
      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        expect.stringContaining('edge-lambda-basic'),
        expect.objectContaining({
          policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        }),
        expect.any(Object)
      );

      expect(aws.iam.RolePolicyAttachment).toHaveBeenCalledWith(
        expect.stringContaining('lambda-basic'),
        expect.objectContaining({
          policyArn: 'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
        }),
        expect.any(Object)
      );
    });

    it('should create DynamoDB access policies', () => {
      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        expect.stringContaining('edge-lambda-dynamodb'),
        expect.objectContaining({
          policy: expect.any(String),
        }),
        expect.any(Object)
      );

      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        expect.stringContaining('lambda-dynamodb'),
        expect.objectContaining({
          policy: expect.any(String),
        }),
        expect.any(Object)
      );
    });
  });
});
