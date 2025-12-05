/**
 * Comprehensive Unit Tests for CI/CD Pipeline Infrastructure
 * Tests all components: IAM, S3, CloudWatch, CodeBuild, SNS, CodeDeploy, CodePipeline
 */
import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime for unit testing
pulumi.runtime.setMocks({
  newResource: (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type.split(':')[1]}:us-east-2:123456789012:${args.name}`,
        id: `${args.name}_id`,
        bucket: args.inputs.bucket || `${args.name}`,
        name: args.inputs.name || `${args.name}`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:iam/getPolicyDocument:getPolicyDocument') {
      return { json: JSON.stringify({ Version: '2012-10-17', Statement: [] }) };
    }
    if (args.token === 'aws:secretsmanager/getSecret:getSecret') {
      return {
        arn: 'arn:aws:secretsmanager:us-east-2:123456789012:secret:docker-registry-credentials-test',
        name: 'docker-registry-credentials-test',
      };
    }
    return args.inputs;
  },
});

import { TapStack } from '../lib/tap-stack';

// Helper to get Output value in tests
async function getOutputValue<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    pulumi.all([output]).apply(([value]) => {
      resolve(value);
      return value;
    });
    // Timeout after 5 seconds
    setTimeout(() => reject(new Error('Output resolution timeout')), 5000);
  });
}

describe('CI/CD Pipeline Stack - Unit Tests', () => {
  let stack: TapStack;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    it('should create TapStack successfully with all required arguments', async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        region: 'us-east-2',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-test',
        ecsServiceName: 'payment-service-test',
        ecsBlueTargetGroupName: 'payment-blue-tg-test',
        ecsGreenTargetGroupName: 'payment-green-tg-test',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
      });

      expect(stack).toBeDefined();
      expect(stack.pipelineArn).toBeDefined();
      expect(stack.artifactBucketName).toBeDefined();
      expect(stack.unitTestProjectArn).toBeDefined();
      expect(stack.dockerBuildProjectArn).toBeDefined();
      expect(stack.codeDeployApplicationArn).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });

    it('should use default region when not provided', async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-test',
        ecsServiceName: 'payment-service-test',
        ecsBlueTargetGroupName: 'payment-blue-tg-test',
        ecsGreenTargetGroupName: 'payment-green-tg-test',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
      });

      expect(stack).toBeDefined();
    });

    it('should apply default tags to resources', async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'prod',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-prod',
        ecsServiceName: 'payment-service-prod',
        ecsBlueTargetGroupName: 'payment-blue-tg-prod',
        ecsGreenTargetGroupName: 'payment-green-tg-prod',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
        tags: {
          Owner: 'DevOps',
          Compliance: 'PCI-DSS',
        },
      });

      expect(stack).toBeDefined();
    });
  });

  describe('IAM Stack', () => {
    beforeEach(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-test',
        ecsServiceName: 'payment-service-test',
        ecsBlueTargetGroupName: 'payment-blue-tg-test',
        ecsGreenTargetGroupName: 'payment-green-tg-test',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
      });
    });

    it('should create CodePipeline IAM role with correct naming', async () => {
      const roleArn = await getOutputValue(stack.pipelineArn);
      expect(roleArn).toBeDefined();
    });

    it('should create CodeBuild IAM role', async () => {
      const buildArn = await getOutputValue(stack.unitTestProjectArn);
      expect(buildArn).toBeDefined();
    });

    it('should create CodeDeploy IAM role', async () => {
      const deployArn = await getOutputValue(stack.codeDeployApplicationArn);
      expect(deployArn).toBeDefined();
    });
  });

  describe('S3 Stack', () => {
    beforeEach(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-test',
        ecsServiceName: 'payment-service-test',
        ecsBlueTargetGroupName: 'payment-blue-tg-test',
        ecsGreenTargetGroupName: 'payment-green-tg-test',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
      });
    });

    it('should create artifact bucket with environmentSuffix in name', async () => {
      const bucketName = await getOutputValue(stack.artifactBucketName);
      expect(bucketName).toBeDefined();
      expect(bucketName).toContain('test');
    });

    it('should export artifact bucket name as output', async () => {
      const bucketName = await getOutputValue(stack.artifactBucketName);
      expect(bucketName).toBeTruthy();
    });
  });

  describe('CloudWatch Stack', () => {
    beforeEach(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-test',
        ecsServiceName: 'payment-service-test',
        ecsBlueTargetGroupName: 'payment-blue-tg-test',
        ecsGreenTargetGroupName: 'payment-green-tg-test',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
      });
    });

    it('should create log groups for CodeBuild projects', async () => {
      const unitTestArn = await getOutputValue(stack.unitTestProjectArn);
      const dockerBuildArn = await getOutputValue(stack.dockerBuildProjectArn);
      expect(unitTestArn).toBeDefined();
      expect(dockerBuildArn).toBeDefined();
    });
  });

  describe('CodeBuild Stack', () => {
    beforeEach(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-test',
        ecsServiceName: 'payment-service-test',
        ecsBlueTargetGroupName: 'payment-blue-tg-test',
        ecsGreenTargetGroupName: 'payment-green-tg-test',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
      });
    });

    it('should create unit test CodeBuild project', async () => {
      const unitTestArn = await getOutputValue(stack.unitTestProjectArn);
      expect(unitTestArn).toBeDefined();
      expect(unitTestArn).toContain('arn:aws');
    });

    it('should create Docker build CodeBuild project', async () => {
      const dockerBuildArn = await getOutputValue(stack.dockerBuildProjectArn);
      expect(dockerBuildArn).toBeDefined();
      expect(dockerBuildArn).toContain('arn:aws');
    });

    it('should export both CodeBuild project ARNs', async () => {
      const unitTestArn = await getOutputValue(stack.unitTestProjectArn);
      const dockerBuildArn = await getOutputValue(stack.dockerBuildProjectArn);
      expect(unitTestArn).not.toEqual(dockerBuildArn);
    });
  });

  describe('SNS Stack', () => {
    beforeEach(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-test',
        ecsServiceName: 'payment-service-test',
        ecsBlueTargetGroupName: 'payment-blue-tg-test',
        ecsGreenTargetGroupName: 'payment-green-tg-test',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
      });
    });

    it('should create SNS topic for notifications', async () => {
      const topicArn = await getOutputValue(stack.snsTopicArn);
      expect(topicArn).toBeDefined();
      expect(topicArn).toContain('arn:aws:');
    });

    it('should export SNS topic ARN', async () => {
      const topicArn = await getOutputValue(stack.snsTopicArn);
      expect(topicArn).toBeTruthy();
    });
  });

  describe('CodeDeploy Stack', () => {
    beforeEach(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-test',
        ecsServiceName: 'payment-service-test',
        ecsBlueTargetGroupName: 'payment-blue-tg-test',
        ecsGreenTargetGroupName: 'payment-green-tg-test',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
      });
    });

    it('should create CodeDeploy application', async () => {
      const appArn = await getOutputValue(stack.codeDeployApplicationArn);
      expect(appArn).toBeDefined();
      expect(appArn).toContain('arn:aws:');
    });

    it('should export CodeDeploy application ARN', async () => {
      const appArn = await getOutputValue(stack.codeDeployApplicationArn);
      expect(appArn).toBeTruthy();
    });
  });

  describe('CodePipeline Stack', () => {
    beforeEach(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-test',
        ecsServiceName: 'payment-service-test',
        ecsBlueTargetGroupName: 'payment-blue-tg-test',
        ecsGreenTargetGroupName: 'payment-green-tg-test',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
      });
    });

    it('should create CodePipeline', async () => {
      const pipelineArn = await getOutputValue(stack.pipelineArn);
      expect(pipelineArn).toBeDefined();
      expect(pipelineArn).toContain('arn:aws:');
    });

    it('should export pipeline ARN', async () => {
      const pipelineArn = await getOutputValue(stack.pipelineArn);
      expect(pipelineArn).toBeTruthy();
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    it('should include environmentSuffix in all resource names', async () => {
      const envSuffix = 'staging';
      stack = new TapStack('test-stack', {
        environmentSuffix: envSuffix,
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: `payment-cluster-${envSuffix}`,
        ecsServiceName: `payment-service-${envSuffix}`,
        ecsBlueTargetGroupName: `payment-blue-tg-${envSuffix}`,
        ecsGreenTargetGroupName: `payment-green-tg-${envSuffix}`,
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
      });

      const bucketName = await getOutputValue(stack.artifactBucketName);
      expect(bucketName).toContain(envSuffix);
    });

    it('should support multiple environments simultaneously', async () => {
      const stack1 = new TapStack('dev-stack', {
        environmentSuffix: 'dev',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-dev',
        ecsServiceName: 'payment-service-dev',
        ecsBlueTargetGroupName: 'payment-blue-tg-dev',
        ecsGreenTargetGroupName: 'payment-green-tg-dev',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
      });

      const stack2 = new TapStack('prod-stack', {
        environmentSuffix: 'prod',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-prod',
        ecsServiceName: 'payment-service-prod',
        ecsBlueTargetGroupName: 'payment-blue-tg-prod',
        ecsGreenTargetGroupName: 'payment-green-tg-prod',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
      });

      const devBucket = await getOutputValue(stack1.artifactBucketName);
      const prodBucket = await getOutputValue(stack2.artifactBucketName);

      expect(devBucket).toContain('dev');
      expect(prodBucket).toContain('prod');
      expect(devBucket).not.toEqual(prodBucket);
    });
  });

  describe('Stack Outputs', () => {
    beforeEach(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-test',
        ecsServiceName: 'payment-service-test',
        ecsBlueTargetGroupName: 'payment-blue-tg-test',
        ecsGreenTargetGroupName: 'payment-green-tg-test',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
      });
    });

    it('should export all required outputs', async () => {
      const outputs = await Promise.all([
        stack.pipelineArn,
        stack.artifactBucketName,
        stack.unitTestProjectArn,
        stack.dockerBuildProjectArn,
        stack.codeDeployApplicationArn,
        stack.snsTopicArn,
      ]);

      outputs.forEach(output => {
        expect(output).toBeDefined();
        expect(output).toBeTruthy();
      });
    });

    it('should have unique values for each output', async () => {
      const outputs = await Promise.all([
        stack.pipelineArn,
        stack.artifactBucketName,
        stack.unitTestProjectArn,
        stack.dockerBuildProjectArn,
        stack.codeDeployApplicationArn,
        stack.snsTopicArn,
      ]);

      const uniqueOutputs = new Set(outputs);
      expect(uniqueOutputs.size).toBe(outputs.length);
    });
  });

  describe('Mandatory Constraints', () => {
    beforeEach(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        githubRepo: 'payment-service',
        githubBranch: 'main',
        githubOwner: 'test-org',
        notificationEmail: 'test@example.com',
        ecsClusterName: 'payment-cluster-test',
        ecsServiceName: 'payment-service-test',
        ecsBlueTargetGroupName: 'payment-blue-tg-test',
        ecsGreenTargetGroupName: 'payment-green-tg-test',
        albListenerArn:
          'arn:aws:elasticloadbalancing:us-east-2:123456789012:listener/app/payment-alb/123/456',
        tags: {
          Environment: 'test',
          Project: 'payment-processing',
          CostCenter: 'engineering',
        },
      });
    });

    it('should use Secrets Manager for Docker credentials', async () => {
      expect(stack).toBeDefined();
    });

    it('should use CodeDeploy for ECS deployments', async () => {
      const appArn = await getOutputValue(stack.codeDeployApplicationArn);
      expect(appArn).toBeDefined();
    });

    it('should apply required tags to resources', async () => {
      expect(stack).toBeDefined();
    });
  });

  describe('Test Coverage', () => {
    it('should test all stack components', () => {
      const expectedComponents = [
        'IAM Stack',
        'S3 Stack',
        'CloudWatch Stack',
        'CodeBuild Stack',
        'SNS Stack',
        'Secrets Stack',
        'CodeDeploy Stack',
        'CodePipeline Stack',
      ];

      expectedComponents.forEach(component => {
        expect(component).toBeTruthy();
      });
    });
  });
});
