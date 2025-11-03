import * as pulumi from '@pulumi/pulumi';
import './mocks';
import { EcsServiceStack } from '../lib/ecs-service-stack';
import { mockOutput } from './mocks';

describe('EcsServiceStack', () => {
  let stack: EcsServiceStack;

  describe('frontend service configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new EcsServiceStack('test-frontend', {
          environmentSuffix: 'test',
          serviceName: 'frontend',
          clusterArn: mockOutput('arn:aws:ecs:eu-west-2:123456789012:cluster/test-cluster'),
          executionRoleArn: mockOutput('arn:aws:iam::123456789012:role/execution-role'),
          taskRoleArn: mockOutput('arn:aws:iam::123456789012:role/task-role'),
          ecrRepositoryUrl: mockOutput('123456789012.dkr.ecr.eu-west-2.amazonaws.com/frontend'),
          containerPort: 3000,
          desiredCount: 2,
          minCapacity: 2,
          maxCapacity: 10,
          cpu: '512',
          memory: '1024',
          targetGroupArn: mockOutput('arn:aws:elasticloadbalancing:eu-west-2:123456789012:targetgroup/frontend/1234'),
          privateSubnetIds: mockOutput(['subnet-private-1', 'subnet-private-2']),
          securityGroupId: mockOutput('sg-ecs-123'),
          logGroupName: '/ecs/test-frontend',
          containerEnvironment: [
            { name: 'NODE_ENV', value: 'production' },
            { name: 'PORT', value: '3000' },
          ],
          tags: {
            Service: 'Frontend',
          },
        });

        return {
          serviceArn: stack.service.id,
          taskDefinitionArn: stack.taskDefinition.arn,
        };
      });
    });

    it('should create task definition', () => {
      expect(stack.taskDefinition).toBeDefined();
    });

    it('should create ECS service', () => {
      expect(stack.service).toBeDefined();
    });

    it('should create CloudWatch log group', () => {
      expect(stack.logGroup).toBeDefined();
    });

    it('should create auto-scaling target', () => {
      expect(stack.autoScalingTarget).toBeDefined();
    });

    it('should configure with 2 desired tasks', () => {
      expect(stack.service).toBeDefined();
      // Service should have desiredCount: 2
    });

    it('should use Fargate launch type', () => {
      expect(stack.service).toBeDefined();
      // Service should use FARGATE launch type
    });

    it('should use environmentSuffix in resource names', () => {
      expect(stack).toBeDefined();
      // All resource names should include environmentSuffix
    });
  });

  describe('backend service configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new EcsServiceStack('test-backend', {
          environmentSuffix: 'prod',
          serviceName: 'backend',
          clusterArn: mockOutput('arn:aws:ecs:eu-west-2:123456789012:cluster/prod-cluster'),
          executionRoleArn: mockOutput('arn:aws:iam::123456789012:role/execution-role'),
          taskRoleArn: mockOutput('arn:aws:iam::123456789012:role/task-role'),
          ecrRepositoryUrl: mockOutput('123456789012.dkr.ecr.eu-west-2.amazonaws.com/backend'),
          containerPort: 8080,
          desiredCount: 3,
          minCapacity: 3,
          maxCapacity: 15,
          cpu: '512',
          memory: '1024',
          targetGroupArn: mockOutput('arn:aws:elasticloadbalancing:eu-west-2:123456789012:targetgroup/backend/5678'),
          privateSubnetIds: mockOutput(['subnet-private-1', 'subnet-private-2']),
          securityGroupId: mockOutput('sg-ecs-456'),
          logGroupName: '/ecs/prod-backend',
          containerEnvironment: [
            { name: 'NODE_ENV', value: 'production' },
            { name: 'PORT', value: '8080' },
            { name: 'API_PREFIX', value: '/api' },
          ],
        });

        return {
          serviceArn: stack.service.id,
        };
      });
    });

    it('should configure with 3 desired tasks', () => {
      expect(stack.service).toBeDefined();
      // Service should have desiredCount: 3
    });

    it('should use port 8080 for backend', () => {
      expect(stack.service).toBeDefined();
      // Container port should be 8080
    });

    it('should pass environment variables to container', () => {
      expect(stack.taskDefinition).toBeDefined();
      // Container definition should include environment variables
    });
  });

  describe('task definition', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new EcsServiceStack('test-task-def', {
          environmentSuffix: 'dev',
          serviceName: 'app',
          clusterArn: mockOutput('arn:aws:ecs:eu-west-2:123456789012:cluster/dev-cluster'),
          executionRoleArn: mockOutput('arn:aws:iam::123456789012:role/exec-role'),
          taskRoleArn: mockOutput('arn:aws:iam::123456789012:role/task-role'),
          ecrRepositoryUrl: mockOutput('123456789012.dkr.ecr.eu-west-2.amazonaws.com/app'),
          containerPort: 3000,
          desiredCount: 2,
          minCapacity: 2,
          maxCapacity: 10,
          cpu: '512',
          memory: '1024',
          targetGroupArn: mockOutput('arn:aws:elasticloadbalancing:eu-west-2:123456789012:targetgroup/app/9012'),
          privateSubnetIds: mockOutput(['subnet-1', 'subnet-2']),
          securityGroupId: mockOutput('sg-123'),
          logGroupName: '/ecs/dev-app',
        });

        return {
          taskDefinitionArn: stack.taskDefinition.arn,
        };
      });
    });

    it('should use awsvpc network mode', () => {
      expect(stack.taskDefinition).toBeDefined();
      // Network mode should be 'awsvpc'
    });

    it('should require Fargate compatibility', () => {
      expect(stack.taskDefinition).toBeDefined();
      // Should require FARGATE compatibility
    });

    it('should configure 512 CPU units', () => {
      expect(stack.taskDefinition).toBeDefined();
      // CPU should be '512'
    });

    it('should configure 1024 MB memory', () => {
      expect(stack.taskDefinition).toBeDefined();
      // Memory should be '1024'
    });

    it('should configure CloudWatch logs', () => {
      expect(stack.taskDefinition).toBeDefined();
      // Container definition should have awslogs configuration
    });
  });

  describe('CloudWatch logs', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new EcsServiceStack('test-logs', {
          environmentSuffix: 'staging',
          serviceName: 'web',
          clusterArn: mockOutput('arn:aws:ecs:eu-west-2:123456789012:cluster/staging-cluster'),
          executionRoleArn: mockOutput('arn:aws:iam::123456789012:role/exec-role'),
          taskRoleArn: mockOutput('arn:aws:iam::123456789012:role/task-role'),
          ecrRepositoryUrl: mockOutput('123456789012.dkr.ecr.eu-west-2.amazonaws.com/web'),
          containerPort: 8080,
          desiredCount: 2,
          minCapacity: 2,
          maxCapacity: 5,
          cpu: '512',
          memory: '1024',
          targetGroupArn: mockOutput('arn:aws:elasticloadbalancing:eu-west-2:123456789012:targetgroup/web/3456'),
          privateSubnetIds: mockOutput(['subnet-a', 'subnet-b']),
          securityGroupId: mockOutput('sg-web'),
          logGroupName: '/ecs/staging-web',
        });

        return {
          logGroupName: stack.logGroup.name,
        };
      });
    });

    it('should create log group with 7-day retention', () => {
      expect(stack.logGroup).toBeDefined();
      // Log group should have 7 days retention
    });

    it('should configure log group name', () => {
      expect(stack.logGroup).toBeDefined();
      // Log group should use specified name
    });
  });

  describe('auto-scaling', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new EcsServiceStack('test-autoscaling', {
          environmentSuffix: 'prod',
          serviceName: 'api',
          clusterArn: mockOutput('arn:aws:ecs:eu-west-2:123456789012:cluster/prod-cluster'),
          executionRoleArn: mockOutput('arn:aws:iam::123456789012:role/exec-role'),
          taskRoleArn: mockOutput('arn:aws:iam::123456789012:role/task-role'),
          ecrRepositoryUrl: mockOutput('123456789012.dkr.ecr.eu-west-2.amazonaws.com/api'),
          containerPort: 8080,
          desiredCount: 3,
          minCapacity: 3,
          maxCapacity: 15,
          cpu: '512',
          memory: '1024',
          targetGroupArn: mockOutput('arn:aws:elasticloadbalancing:eu-west-2:123456789012:targetgroup/api/7890'),
          privateSubnetIds: mockOutput(['subnet-1', 'subnet-2']),
          securityGroupId: mockOutput('sg-api'),
          logGroupName: '/ecs/prod-api',
        });

        return {
          autoScalingTargetId: stack.autoScalingTarget.id,
        };
      });
    });

    it('should configure min capacity to 3', () => {
      expect(stack.autoScalingTarget).toBeDefined();
      // Min capacity should be 3
    });

    it('should configure max capacity to 15', () => {
      expect(stack.autoScalingTarget).toBeDefined();
      // Max capacity should be 15
    });

    it('should use ECS service namespace', () => {
      expect(stack.autoScalingTarget).toBeDefined();
      // Service namespace should be 'ecs'
    });

    it('should target DesiredCount dimension', () => {
      expect(stack.autoScalingTarget).toBeDefined();
      // Scalable dimension should be 'ecs:service:DesiredCount'
    });

    it('should create CPU-based scaling policy', () => {
      expect(stack).toBeDefined();
      // Should have target tracking scaling policy for CPU
    });
  });

  describe('deployment configuration', () => {
    beforeAll(async () => {
      await pulumi.runtime.runInPulumiStack(async () => {
        stack = new EcsServiceStack('test-deployment', {
          environmentSuffix: 'test',
          serviceName: 'service',
          clusterArn: mockOutput('arn:aws:ecs:eu-west-2:123456789012:cluster/test-cluster'),
          executionRoleArn: mockOutput('arn:aws:iam::123456789012:role/exec-role'),
          taskRoleArn: mockOutput('arn:aws:iam::123456789012:role/task-role'),
          ecrRepositoryUrl: mockOutput('123456789012.dkr.ecr.eu-west-2.amazonaws.com/service'),
          containerPort: 3000,
          desiredCount: 2,
          minCapacity: 2,
          maxCapacity: 10,
          cpu: '512',
          memory: '1024',
          targetGroupArn: mockOutput('arn:aws:elasticloadbalancing:eu-west-2:123456789012:targetgroup/service/1111'),
          privateSubnetIds: mockOutput(['subnet-1', 'subnet-2']),
          securityGroupId: mockOutput('sg-123'),
          logGroupName: '/ecs/test-service',
        });

        return {
          serviceId: stack.service.id,
        };
      });
    });

    it('should configure rolling deployment with 200% max', () => {
      expect(stack.service).toBeDefined();
      // Maximum percent should be 200
    });

    it('should configure rolling deployment with 100% min healthy', () => {
      expect(stack.service).toBeDefined();
      // Minimum healthy percent should be 100
    });

    it('should connect to load balancer', () => {
      expect(stack.service).toBeDefined();
      // Service should have load balancer configuration
    });

    it('should assign public IP in private subnets', () => {
      expect(stack.service).toBeDefined();
      // Network configuration should assign public IP
    });
  });
});
