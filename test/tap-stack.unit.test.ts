import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import { S3Stack } from '../lib/s3-stack';
import { VpcStack } from '../lib/vpc-stack';
import { RdsStack } from '../lib/rds-stack';
import { IamStack } from '../lib/iam-stack';
import { LambdaStack } from '../lib/lambda-stack';

// Mock Pulumi runtime
(pulumi as any).runtime = {
  isDryRun: () => true,
  setMocks: () => {},
  registerStackTransformation: () => {},
} as any;

// Mock child stacks
jest.mock('../lib/s3-stack');
jest.mock('../lib/vpc-stack');
jest.mock('../lib/rds-stack');
jest.mock('../lib/iam-stack');
jest.mock('../lib/lambda-stack');

describe('TapStack', () => {
  let stack: TapStack;
  const mockBucketName = pulumi.Output.create('test-bucket');
  const mockDbEndpoint = pulumi.Output.create('db.example.com:3306');
  const mockLambdaArn = pulumi.Output.create(
    'arn:aws:lambda:us-west-2:123456789012:function:test'
  );
  const mockVpcId = pulumi.Output.create('vpc-123');
  const mockDbInstance = { id: pulumi.Output.create('db-123') };
  const mockLambdaFunction = {
    arn: mockLambdaArn,
    name: pulumi.Output.create('test-lambda'),
  };
  const mockVpc = { id: mockVpcId };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock S3Stack
    (S3Stack as unknown as jest.Mock).mockImplementation(() => ({
      bucketName: mockBucketName,
      bucket: { arn: pulumi.Output.create('arn:aws:s3:::test-bucket') },
      lambdaCodeObject: {},
    }));

    // Mock VpcStack
    (VpcStack as unknown as jest.Mock).mockImplementation(() => ({
      vpc: mockVpc,
      dbSubnetGroup: { name: pulumi.Output.create('subnet-group') },
      dbSecurityGroup: { id: pulumi.Output.create('sg-123') },
    }));

    // Mock RdsStack
    (RdsStack as unknown as jest.Mock).mockImplementation(() => ({
      dbEndpoint: mockDbEndpoint,
      dbInstance: mockDbInstance,
    }));

    // Mock IamStack
    (IamStack as unknown as jest.Mock).mockImplementation(() => ({
      lambdaRoleArn: pulumi.Output.create(
        'arn:aws:iam::123456789012:role/lambda'
      ),
    }));

    // Mock LambdaStack
    (LambdaStack as unknown as jest.Mock).mockImplementation(() => ({
      lambdaFunction: mockLambdaFunction,
    }));
  });

  describe('constructor', () => {
    it('should create all child stacks in correct order', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(S3Stack).toHaveBeenCalledWith(
        'tap-s3',
        expect.objectContaining({
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
        }),
        expect.any(Object)
      );

      expect(VpcStack).toHaveBeenCalledWith(
        'tap-vpc',
        expect.objectContaining({
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
        }),
        expect.any(Object)
      );

      expect(RdsStack).toHaveBeenCalledWith(
        'tap-rds',
        expect.objectContaining({
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
          vpcStack: expect.any(Object),
        }),
        expect.any(Object)
      );

      expect(IamStack).toHaveBeenCalledWith(
        'tap-iam',
        expect.objectContaining({
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
          bucketArn: expect.any(Object),
        }),
        expect.any(Object)
      );

      expect(LambdaStack).toHaveBeenCalledWith(
        'tap-lambda',
        expect.objectContaining({
          environmentSuffix: 'test',
          tags: { Environment: 'test' },
          bucketName: mockBucketName,
          lambdaRoleArn: expect.any(Object),
          lambdaCodeObject: expect.any(Object),
        }),
        expect.any(Object)
      );
    });

    it('should expose all required outputs', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(stack.bucketName).toBeDefined();
      expect(stack.bucketName).toBe(mockBucketName);
      expect(stack.dbEndpoint).toBeDefined();
      expect(stack.dbEndpoint).toBe(mockDbEndpoint);
      expect(stack.lambdaFunctionArn).toBeDefined();
      expect(stack.lambdaFunctionArn).toBe(mockLambdaArn);
      expect(stack.vpcId).toBeDefined();
      expect(stack.vpcId).toBe(mockVpcId);
    });

    it('should use default environment suffix when not provided', () => {
      stack = new TapStack('test-stack', {});

      expect(S3Stack).toHaveBeenCalledWith(
        'tap-s3',
        expect.objectContaining({
          environmentSuffix: 'dev',
        }),
        expect.any(Object)
      );
    });

    it('should pass tags to all child stacks', () => {
      const tags = { Environment: 'prod', Project: 'tap', Owner: 'team' };
      stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
        tags,
      });

      expect(S3Stack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ tags }),
        expect.any(Object)
      );
      expect(VpcStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ tags }),
        expect.any(Object)
      );
      expect(RdsStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ tags }),
        expect.any(Object)
      );
      expect(IamStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ tags }),
        expect.any(Object)
      );
      expect(LambdaStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ tags }),
        expect.any(Object)
      );
    });

    it('should create all stacks as child resources', () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      // Verify all stacks are created with parent option
      expect(S3Stack).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ parent: stack })
      );
      expect(VpcStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ parent: stack })
      );
      expect(RdsStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ parent: stack })
      );
      expect(IamStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ parent: stack })
      );
      expect(LambdaStack).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(Object),
        expect.objectContaining({ parent: stack })
      );
    });
  });
});
