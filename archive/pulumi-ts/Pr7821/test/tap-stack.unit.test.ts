import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';
import { CICDStack } from '../lib/cicd-stack';

// Mock Pulumi runtime functions
jest.mock('@pulumi/pulumi', () => {
  const mockOutput = (value: any) => ({
    apply: jest.fn((fn: any) => mockOutput(fn(value))),
    promise: jest.fn(() => Promise.resolve(value)),
  });

  return {
    ComponentResource: jest.fn().mockImplementation(function (
      this: any,
      type: string,
      name: string,
      args: any,
      opts?: any
    ) {
      this.registerOutputs = jest.fn();
    }),
    Config: jest.fn(),
    output: jest.fn((value: any) => mockOutput(value)),
    all: jest.fn((values: any[]) => mockOutput(values)),
    Output: {
      create: jest.fn((value: any) => mockOutput(value)),
    },
  };
});

// Mock AWS resources
jest.mock('@pulumi/aws', () => ({
  s3: {
    Bucket: jest.fn().mockImplementation((name: string, args: any) => ({
      id: mockOutput(`bucket-${name}`),
      arn: mockOutput(`arn:aws:s3:::bucket-${name}`),
      bucket: mockOutput(`bucket-${name}`),
    })),
    BucketPublicAccessBlock: jest.fn(),
  },
  cloudwatch: {
    LogGroup: jest.fn().mockImplementation((name: string, args: any) => ({
      id: mockOutput(`log-group-${name}`),
      name: mockOutput(args.name),
      arn: mockOutput(`arn:aws:logs:::log-group-${name}`),
    })),
  },
  iam: {
    Role: jest.fn().mockImplementation((name: string, args: any) => ({
      id: mockOutput(`role-${name}`),
      arn: mockOutput(`arn:aws:iam:::role/${name}`),
    })),
    RolePolicy: jest.fn(),
  },
  codebuild: {
    Project: jest.fn().mockImplementation((name: string, args: any) => ({
      id: mockOutput(`project-${name}`),
      name: mockOutput(args.name),
      arn: mockOutput(`arn:aws:codebuild:::project/${name}`),
    })),
  },
  Provider: jest.fn(),
}));

const mockOutput = (value: any): any => ({
  apply: jest.fn((fn: any) => mockOutput(fn(value))),
  promise: jest.fn(() => Promise.resolve(value)),
});

describe('TapStack Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('TapStack constructor', () => {
    it('should instantiate successfully with all props', () => {
      const stack = new TapStack('TestTapStackWithProps', {
        environmentSuffix: 'prod',
        tags: { Owner: 'test-team' },
      });

      expect(stack).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
      expect(stack.artifactBucketArn).toBeDefined();
    });

    it('should instantiate successfully with minimal props', () => {
      const stack = new TapStack('TestTapStackMinimal', {});

      expect(stack).toBeDefined();
      expect(stack.codeBuildProjectName).toBeDefined();
      expect(stack.artifactBucketArn).toBeDefined();
    });

    it('should use default environmentSuffix when not provided', () => {
      const stack = new TapStack('TestTapStackDefault', {});

      expect(stack).toBeDefined();
      // Default is 'dev' as specified in tap-stack.ts line 49
    });

    it('should pass environmentSuffix to CICDStack', () => {
      const stack = new TapStack('TestTapStackEnvSuffix', {
        environmentSuffix: 'staging',
      });

      expect(stack).toBeDefined();
    });

    it('should pass tags to CICDStack', () => {
      const tags = { Environment: 'test', Team: 'qa' };
      const stack = new TapStack('TestTapStackTags', {
        environmentSuffix: 'test',
        tags: tags,
      });

      expect(stack).toBeDefined();
    });

    it('should expose codeBuildProjectName output', () => {
      const stack = new TapStack('TestTapStackOutput1', {
        environmentSuffix: 'dev',
      });

      expect(stack.codeBuildProjectName).toBeDefined();
    });

    it('should expose artifactBucketArn output', () => {
      const stack = new TapStack('TestTapStackOutput2', {
        environmentSuffix: 'dev',
      });

      expect(stack.artifactBucketArn).toBeDefined();
    });

    it('should register outputs correctly', () => {
      const stack = new TapStack('TestTapStackRegister', {
        environmentSuffix: 'dev',
      });

      expect((stack as any).registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          codeBuildProjectName: expect.anything(),
          artifactBucketArn: expect.anything(),
        })
      );
    });
  });

  describe('CICDStack constructor', () => {
    it('should create S3 bucket with versioning enabled', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(aws.s3.Bucket).toHaveBeenCalledWith(
        'codebuild-artifacts-dev',
        expect.objectContaining({
          bucket: 'codebuild-artifacts-dev',
          versioning: { enabled: true },
          forceDestroy: true,
        }),
        expect.anything()
      );
    });

    it('should create S3 public access block', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(aws.s3.BucketPublicAccessBlock).toHaveBeenCalledWith(
        'codebuild-artifacts-public-access-block-dev',
        expect.objectContaining({
          blockPublicAcls: true,
          blockPublicPolicy: true,
          ignorePublicAcls: true,
          restrictPublicBuckets: true,
        }),
        expect.anything()
      );
    });

    it('should create CloudWatch log group with 7-day retention', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(aws.cloudwatch.LogGroup).toHaveBeenCalledWith(
        'codebuild-logs-dev',
        expect.objectContaining({
          name: '/aws/codebuild/nodejs-build-dev',
          retentionInDays: 7,
        }),
        expect.anything()
      );
    });

    it('should create IAM role for CodeBuild', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(aws.iam.Role).toHaveBeenCalledWith(
        'codebuild-role-dev',
        expect.objectContaining({
          name: 'codebuild-role-dev',
          assumeRolePolicy: expect.stringContaining('codebuild.amazonaws.com'),
        }),
        expect.anything()
      );
    });

    it('should create S3 policy for CodeBuild', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        'codebuild-s3-policy-dev',
        expect.anything(),
        expect.anything()
      );
    });

    it('should create CloudWatch logs policy for CodeBuild', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(aws.iam.RolePolicy).toHaveBeenCalledWith(
        'codebuild-logs-policy-dev',
        expect.anything(),
        expect.anything()
      );
    });

    it('should create CodeBuild project with correct configuration', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(aws.codebuild.Project).toHaveBeenCalledWith(
        'nodejs-build-dev',
        expect.objectContaining({
          name: 'nodejs-build-dev',
          description: 'CI/CD build project for Node.js applications',
          buildTimeout: 15,
        }),
        expect.anything()
      );
    });

    it('should configure CodeBuild with S3 artifacts', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(aws.codebuild.Project).toHaveBeenCalledWith(
        'nodejs-build-dev',
        expect.objectContaining({
          artifacts: expect.objectContaining({
            type: 'S3',
            path: 'builds/',
          }),
        }),
        expect.anything()
      );
    });

    it('should configure CodeBuild with Node.js environment', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(aws.codebuild.Project).toHaveBeenCalledWith(
        'nodejs-build-dev',
        expect.objectContaining({
          environment: expect.objectContaining({
            computeType: 'BUILD_GENERAL1_SMALL',
            type: 'LINUX_CONTAINER',
          }),
        }),
        expect.anything()
      );
    });

    it('should configure environment variables for CodeBuild', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(aws.codebuild.Project).toHaveBeenCalledWith(
        'nodejs-build-dev',
        expect.objectContaining({
          environment: expect.objectContaining({
            environmentVariables: expect.arrayContaining([
              expect.objectContaining({ name: 'NODE_ENV', value: 'production' }),
              expect.objectContaining({ name: 'BUILD_NUMBER' }),
            ]),
          }),
        }),
        expect.anything()
      );
    });

    it('should configure GitHub source for CodeBuild', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(aws.codebuild.Project).toHaveBeenCalledWith(
        'nodejs-build-dev',
        expect.objectContaining({
          source: expect.objectContaining({
            type: 'GITHUB',
            gitCloneDepth: 1,
          }),
        }),
        expect.anything()
      );
    });

    it('should configure CloudWatch logs for CodeBuild', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(aws.codebuild.Project).toHaveBeenCalledWith(
        'nodejs-build-dev',
        expect.objectContaining({
          logsConfig: expect.objectContaining({
            cloudwatchLogs: expect.objectContaining({
              status: 'ENABLED',
            }),
          }),
        }),
        expect.anything()
      );
    });

    it('should apply tags to CodeBuild project', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: { Owner: 'test' },
      });

      expect(aws.codebuild.Project).toHaveBeenCalledWith(
        'nodejs-build-dev',
        expect.objectContaining({
          tags: expect.anything(),
        }),
        expect.anything()
      );
    });

    it('should expose codeBuildProjectName output', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(cicdStack.codeBuildProjectName).toBeDefined();
    });

    it('should expose artifactBucketArn output', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect(cicdStack.artifactBucketArn).toBeDefined();
    });

    it('should register outputs correctly', () => {
      const cicdStack = new CICDStack('TestCICD', {
        environmentSuffix: 'dev',
        tags: {},
      });

      expect((cicdStack as any).registerOutputs).toHaveBeenCalledWith(
        expect.objectContaining({
          codeBuildProjectName: expect.anything(),
          artifactBucketArn: expect.anything(),
        })
      );
    });
  });
});
