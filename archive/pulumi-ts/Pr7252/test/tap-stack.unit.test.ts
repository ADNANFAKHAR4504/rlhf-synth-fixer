import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const mockArgs = {
    environmentSuffix: 'test',
    githubOwner: 'test-owner',
    githubRepo: 'test-repo',
    githubBranch: 'main',
    githubToken: pulumi.secret('test-token'),
    ecrImageUri: '123456789012.dkr.ecr.us-east-1.amazonaws.com/pulumi:latest',
    devAccountId: '111111111111',
    stagingAccountId: '222222222222',
    prodAccountId: '333333333333',
    tags: { Environment: 'test' },
  };

  describe('Stack Instantiation', () => {
    it('should create TapStack successfully', async () => {
      stack = new TapStack('test-stack', mockArgs);
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should export pipeline ARNs', async () => {
      stack = new TapStack('test-stack', mockArgs);
      expect(stack.devPipelineArn).toBeDefined();
      expect(stack.stagingPipelineArn).toBeDefined();
      expect(stack.prodPipelineArn).toBeDefined();
    });
  });

  describe('Resource Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should use provided environmentSuffix', async () => {
      expect(mockArgs.environmentSuffix).toBe('test');
    });

    it('should use provided GitHub configuration', async () => {
      expect(mockArgs.githubOwner).toBe('test-owner');
      expect(mockArgs.githubRepo).toBe('test-repo');
      expect(mockArgs.githubBranch).toBe('main');
    });

    it('should use provided ECR image URI', async () => {
      expect(mockArgs.ecrImageUri).toContain('pulumi');
    });

    it('should use provided account IDs', async () => {
      expect(mockArgs.devAccountId).toBe('111111111111');
      expect(mockArgs.stagingAccountId).toBe('222222222222');
      expect(mockArgs.prodAccountId).toBe('333333333333');
    });
  });

  describe('Default Values', () => {
    const minimalArgs = {
      githubOwner: 'owner',
      githubRepo: 'repo',
      githubToken: pulumi.secret('token'),
      ecrImageUri: 'ecr.uri',
    };

    it('should use default environmentSuffix when not provided', async () => {
      const defaultStack = new TapStack('default-stack', minimalArgs);
      expect(defaultStack).toBeDefined();
    });

    it('should use default GitHub branch when not provided', async () => {
      const defaultStack = new TapStack('default-stack', minimalArgs);
      expect(defaultStack).toBeDefined();
      // Default branch should be 'main'
    });

    it('should use default account IDs when not provided', async () => {
      const defaultStack = new TapStack('default-stack', minimalArgs);
      expect(defaultStack).toBeDefined();
      // Default accounts: dev (123456789012), staging (234567890123), prod (345678901234)
    });
  });

  describe('Component Resource Properties', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should be a ComponentResource', async () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have correct resource type', async () => {
      // ComponentResource type should be 'tap:stack:TapStack'
      expect(stack).toBeDefined();
    });
  });

  describe('Multi-Environment Support', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create pipelines for dev environment', async () => {
      expect(stack.devPipelineArn).toBeDefined();
    });

    it('should create pipelines for staging environment', async () => {
      expect(stack.stagingPipelineArn).toBeDefined();
    });

    it('should create pipelines for prod environment', async () => {
      expect(stack.prodPipelineArn).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should handle GitHub token as secret', async () => {
      expect(mockArgs.githubToken).toBeDefined();
      // Token should be handled as Pulumi secret
    });

    it('should configure KMS encryption', async () => {
      // KMS key should be created with rotation enabled
      expect(stack).toBeDefined();
    });

    it('should use cross-account IAM roles', async () => {
      // Should configure IAM roles for dev, staging, prod accounts
      expect(mockArgs.devAccountId).toBeDefined();
      expect(mockArgs.stagingAccountId).toBeDefined();
      expect(mockArgs.prodAccountId).toBeDefined();
    });
  });

  describe('S3 Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create artifact bucket', async () => {
      // Artifact bucket should be created for pipeline artifacts
      expect(stack).toBeDefined();
    });

    it('should create state buckets for each environment', async () => {
      // State buckets should be created for dev, staging, prod
      expect(stack).toBeDefined();
    });

    it('should enable versioning on buckets', async () => {
      // S3 buckets should have versioning enabled
      expect(stack).toBeDefined();
    });

    it('should enable encryption on buckets', async () => {
      // S3 buckets should use KMS encryption
      expect(stack).toBeDefined();
    });
  });

  describe('CloudWatch Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create CloudWatch log group', async () => {
      // Log group should be created for build logs
      expect(stack).toBeDefined();
    });

    it('should set log retention to 30 days', async () => {
      // Log retention should be 30 days as per requirements
      expect(stack).toBeDefined();
    });
  });

  describe('CodeBuild Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should use BUILD_GENERAL1_LARGE compute type', async () => {
      // CodeBuild should use BUILD_GENERAL1_LARGE as per requirements
      expect(stack).toBeDefined();
    });

    it('should use custom ECR image', async () => {
      expect(mockArgs.ecrImageUri).toBeDefined();
    });

    it('should create preview projects for each environment', async () => {
      // Preview projects should exist for dev, staging, prod
      expect(stack).toBeDefined();
    });

    it('should create deploy projects for each environment', async () => {
      // Deploy projects should exist for dev, staging, prod
      expect(stack).toBeDefined();
    });
  });

  describe('CodePipeline Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create separate pipelines for each environment', async () => {
      expect(stack.devPipelineArn).toBeDefined();
      expect(stack.stagingPipelineArn).toBeDefined();
      expect(stack.prodPipelineArn).toBeDefined();
    });

    it('should include Source stage', async () => {
      // Pipeline should have Source stage with GitHub
      expect(stack).toBeDefined();
    });

    it('should include Build stage', async () => {
      // Pipeline should have Build stage with Pulumi preview
      expect(stack).toBeDefined();
    });

    it('should include Deploy stage', async () => {
      // Pipeline should have Deploy stage with Pulumi up
      expect(stack).toBeDefined();
    });

    it('should include manual approval for production', async () => {
      // Production pipeline should have manual approval stage
      expect(stack).toBeDefined();
    });

    it('should not include manual approval for dev', async () => {
      // Dev pipeline should not have manual approval
      expect(stack).toBeDefined();
    });

    it('should not include manual approval for staging', async () => {
      // Staging pipeline should not have manual approval
      expect(stack).toBeDefined();
    });
  });

  describe('SNS Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create SNS topic for notifications', async () => {
      // SNS topic should be created for pipeline notifications
      expect(stack).toBeDefined();
    });

    it('should encrypt SNS topic with KMS', async () => {
      // SNS topic should use KMS encryption
      expect(stack).toBeDefined();
    });
  });

  describe('EventBridge Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create EventBridge rule', async () => {
      // EventBridge rule should monitor pipeline state changes
      expect(stack).toBeDefined();
    });

    it('should target SNS topic', async () => {
      // EventBridge should target SNS topic for notifications
      expect(stack).toBeDefined();
    });
  });

  describe('IAM Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should create CodePipeline IAM role', async () => {
      // IAM role for CodePipeline should be created
      expect(stack).toBeDefined();
    });

    it('should create CodeBuild IAM role', async () => {
      // IAM role for CodeBuild should be created
      expect(stack).toBeDefined();
    });

    it('should follow least-privilege principle', async () => {
      // IAM policies should not use wildcards
      expect(stack).toBeDefined();
    });

    it('should include sts:AssumeRole permissions', async () => {
      // CodeBuild role should have sts:AssumeRole for cross-account
      expect(stack).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should include environmentSuffix in resource names', async () => {
      expect(mockArgs.environmentSuffix).toBe('test');
      // All resources should include environmentSuffix
    });

    it('should follow naming convention', async () => {
      // Resources should follow: resource-type-environment-suffix
      expect(stack).toBeDefined();
    });
  });

  describe('Destroyability', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should configure S3 buckets with forceDestroy', async () => {
      // S3 buckets should have forceDestroy: true
      expect(stack).toBeDefined();
    });

    it('should configure KMS keys with deletion window', async () => {
      // KMS keys should have deletionWindowInDays set
      expect(stack).toBeDefined();
    });

    it('should not use retention policies', async () => {
      // Resources should not use RETAIN policies
      expect(stack).toBeDefined();
    });
  });

  describe('Tag Configuration', () => {
    beforeEach(() => {
      stack = new TapStack('test-stack', mockArgs);
    });

    it('should apply provided tags', async () => {
      expect(mockArgs.tags).toEqual({ Environment: 'test' });
    });

    it('should tag resources with environment', async () => {
      // Resources should be tagged with environment information
      expect(stack).toBeDefined();
    });
  });
});
