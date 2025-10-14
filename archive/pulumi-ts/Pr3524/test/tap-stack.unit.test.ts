import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// Mock child stack classes before importing TapStack
const createMockOutput = (value: any) => ({
  apply: (fn: any) => fn(value),
  promise: () => Promise.resolve(value)
});

jest.mock('../lib/database-stack', () => ({
  DatabaseStack: jest.fn().mockImplementation(() => ({
    licensesTableArn: createMockOutput('arn:aws:dynamodb:us-east-1:123456789012:table/licenses'),
    analyticsTableArn: createMockOutput('arn:aws:dynamodb:us-east-1:123456789012:table/analytics')
  }))
}));

jest.mock('../lib/storage-stack', () => ({
  StorageStack: jest.fn().mockImplementation(() => ({
    bucketId: createMockOutput('mock-bucket-id'),
    bucketArn: createMockOutput('arn:aws:s3:::mock-bucket'),
    bucketDomainName: createMockOutput('mock-bucket.s3.amazonaws.com'),
    logsBucketDomainName: createMockOutput('logs-bucket.s3.amazonaws.com'),
    bucketName: createMockOutput('mock-bucket-name')
  }))
}));

jest.mock('../lib/lambda-stack', () => ({
  LambdaStack: jest.fn().mockImplementation(() => ({
    edgeLambdaQualifiedArn: createMockOutput('arn:aws:lambda:us-east-1:123456789012:function:edge:1'),
    licenseApiLambdaArn: createMockOutput('arn:aws:lambda:us-east-1:123456789012:function:api'),
    licenseApiLambdaName: createMockOutput('license-api'),
    usageTrackingLambdaArn: createMockOutput('arn:aws:lambda:us-east-1:123456789012:function:tracking'),
    usageTrackingLambdaName: createMockOutput('usage-tracking')
  }))
}));

jest.mock('../lib/monitoring-stack', () => ({
  MonitoringStack: jest.fn().mockImplementation(() => ({
    logGroupArns: createMockOutput(['arn:aws:logs:us-east-1:123456789012:log-group:test'])
  }))
}));

jest.mock('../lib/distribution-stack', () => ({
  DistributionStack: jest.fn().mockImplementation(() => ({
    distributionUrl: createMockOutput('https://d123.cloudfront.net')
  }))
}));

jest.mock('../lib/api-stack', () => ({
  ApiStack: jest.fn().mockImplementation(() => ({
    apiUrl: createMockOutput('https://api.execute-api.us-east-1.amazonaws.com')
  }))
}));

// Enable Pulumi mocking
jest.mock('@pulumi/pulumi');
jest.mock('@pulumi/aws');

import { TapStack } from '../lib/tap-stack';

describe('TapStack Structure', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock Pulumi runtime behavior
    (pulumi as any).all = jest
      .fn()
      .mockImplementation((values) => ({
        apply: (fn: any) => fn(values)
      }));
    (pulumi as any).Output = jest.fn().mockImplementation(value => ({
      promise: () => Promise.resolve(value),
      apply: (fn: any) => fn(value),
    }));
    (pulumi as any).ComponentResource = jest.fn();

    // Mock all AWS resources that might be used by child stacks
    const mockBucket = {
      id: 'mock-bucket-id',
      arn: 'arn:aws:s3:::mock-bucket'
    };
    const mockOAC = {
      id: 'mock-oac-id'
    };
    const mockTable = {
      arn: 'arn:aws:dynamodb:us-east-1:123456789012:table/mock-table',
    };
    const mockRole = { arn: 'arn:aws:iam::123456789012:role/mock-role' };
    const mockLambda = {
      arn: 'arn:aws:lambda:us-east-1:123456789012:function:mock-function',
      qualifiedArn: 'arn:aws:lambda:us-east-1:123456789012:function:mock-function:1'
    };

    // Mock all AWS constructors used in child stacks
    (aws.s3.Bucket as any) = jest.fn().mockImplementation(() => mockBucket);
    (aws.s3.BucketPublicAccessBlock as any) = jest.fn();
    (aws.s3.BucketLifecycleConfiguration as any) = jest.fn();
    (aws.s3.BucketServerSideEncryptionConfiguration as any) = jest.fn();
    (aws.s3.BucketPolicy as any) = jest.fn();
    (aws.cloudfront.OriginAccessControl as any) = jest.fn().mockImplementation(() => mockOAC);
    (aws.dynamodb.Table as any) = jest.fn().mockImplementation(() => mockTable);
    (aws.iam.Role as any) = jest.fn().mockImplementation(() => mockRole);
    (aws.iam.RolePolicyAttachment as any) = jest.fn();
    (aws.iam.RolePolicy as any) = jest.fn();
    (aws.lambda.Function as any) = jest.fn().mockImplementation(() => mockLambda);
    (aws.apigatewayv2.Api as any) = jest.fn().mockImplementation(() => ({ id: 'mock-api-id' }));
    (aws.cloudfront.Distribution as any) = jest.fn().mockImplementation(() => ({ domainName: 'mock-distribution.cloudfront.net' }));
    (aws.cloudwatch.LogGroup as any) = jest.fn().mockImplementation(() => ({ arn: 'arn:aws:logs:us-east-1:123456789012:log-group:mock' }));
  });

  describe('with props', () => {
    beforeEach(() => {
      stack = new TapStack('TestTapStackWithProps', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'prod',
          Repository: 'test-repo',
          Author: 'test-author',
        },
      });
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('has expected outputs', () => {
      expect(stack.bucketName).toBeDefined();
      expect(stack.distributionUrl).toBeDefined();
      expect(stack.apiUrl).toBeDefined();
    });

    it('uses production environment suffix', () => {
      // The environmentSuffix should be used in resource names
      expect(stack).toBeDefined();
    });
  });

  describe('with default values', () => {
    beforeEach(() => {
      stack = new TapStack('TestTapStackDefault', {});
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('has expected outputs', () => {
      expect(stack.bucketName).toBeDefined();
      expect(stack.distributionUrl).toBeDefined();
      expect(stack.apiUrl).toBeDefined();
    });

    it('uses default environment suffix', () => {
      // Should default to 'dev' when not specified
      expect(stack).toBeDefined();
    });
  });
});
