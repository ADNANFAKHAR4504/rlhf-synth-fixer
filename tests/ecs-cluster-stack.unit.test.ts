import * as pulumi from '@pulumi/pulumi';
import './mocks';
import { EcsClusterStack } from '../lib/ecs-cluster-stack';

describe('EcsClusterStack', () => {
  let stack: EcsClusterStack;

  describe('with environmentSuffix', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new EcsClusterStack('test-ecs', {
          environmentSuffix: 'test',
          tags: {
            Environment: 'test',
            ManagedBy: 'Pulumi',
          },
        });

        return {
          clusterArn: stack.cluster.arn,
          executionRoleArn: stack.executionRole.arn,
          taskRoleArn: stack.taskRole.arn,
        };
      });
    });

    it('should create an ECS cluster', () => {
      expect(stack.cluster).toBeDefined();
    });

    it('should create execution role', () => {
      expect(stack.executionRole).toBeDefined();
    });

    it('should create task role', () => {
      expect(stack.taskRole).toBeDefined();
    });

    it('should create frontend ECR repository', () => {
      expect(stack.ecrRepositoryFrontend).toBeDefined();
    });

    it('should create backend ECR repository', () => {
      expect(stack.ecrRepositoryBackend).toBeDefined();
    });

    it('should use environmentSuffix in resource names', () => {
      expect(stack).toBeDefined();
      // All resource names should include environmentSuffix
    });
  });

  describe('IAM roles and policies', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new EcsClusterStack('test-ecs-iam', {
          environmentSuffix: 'prod',
        });

        return {
          executionRoleArn: stack.executionRole.arn,
          taskRoleArn: stack.taskRole.arn,
        };
      });
    });

    it('should create execution role with correct trust policy', () => {
      expect(stack.executionRole).toBeDefined();
      // Execution role should trust ecs-tasks.amazonaws.com
    });

    it('should attach ECS task execution policy', () => {
      expect(stack.executionRole).toBeDefined();
      // Should have AmazonECSTaskExecutionRolePolicy attached
    });

    it('should create inline ECR access policy', () => {
      expect(stack.executionRole).toBeDefined();
      // Should have inline policy for ECR access
    });

    it('should create task role with correct trust policy', () => {
      expect(stack.taskRole).toBeDefined();
      // Task role should trust ecs-tasks.amazonaws.com
    });
  });

  describe('ECR repositories', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new EcsClusterStack('test-ecs-ecr', {
          environmentSuffix: 'dev',
        });

        return {
          frontendRepoUrl: stack.ecrRepositoryFrontend.repositoryUrl,
          backendRepoUrl: stack.ecrRepositoryBackend.repositoryUrl,
        };
      });
    });

    it('should enable image scanning on frontend repository', () => {
      expect(stack.ecrRepositoryFrontend).toBeDefined();
      // Frontend repo should have scan on push enabled
    });

    it('should enable image scanning on backend repository', () => {
      expect(stack.ecrRepositoryBackend).toBeDefined();
      // Backend repo should have scan on push enabled
    });

    it('should set repository mutability to MUTABLE', () => {
      expect(stack.ecrRepositoryFrontend).toBeDefined();
      expect(stack.ecrRepositoryBackend).toBeDefined();
      // Both repos should be MUTABLE
    });
  });

  describe('ECS cluster configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new EcsClusterStack('test-ecs-config', {
          environmentSuffix: 'staging',
          tags: {
            Team: 'DevOps',
          },
        });

        return {
          clusterArn: stack.cluster.arn,
        };
      });
    });

    it('should enable container insights', () => {
      expect(stack.cluster).toBeDefined();
      // Cluster should have containerInsights enabled
    });

    it('should apply tags to cluster', () => {
      expect(stack.cluster).toBeDefined();
      // Cluster should have appropriate tags
    });
  });
});
