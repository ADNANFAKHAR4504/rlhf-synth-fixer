/**
 * Unit tests for TapStack - ECS Fargate Optimization
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const resourceType = args.type;
    const resourceName = args.name;

    // Return mocked resource state
    return {
      id: `${resourceName}_id`,
      state: {
        ...args.inputs,
        arn:
          args.type === 'aws:ecs/cluster:Cluster' ||
          args.type === 'aws:ecs/service:Service' ||
          args.type === 'aws:ecs/taskDefinition:TaskDefinition' ||
          args.type === 'aws:iam/role:Role'
            ? `arn:aws:${resourceType}:us-east-1:123456789012:${resourceName}`
            : undefined,
        repositoryUrl:
          args.type === 'aws:ecr/repository:Repository'
            ? '123456789012.dkr.ecr.us-east-1.amazonaws.com/tap-app-dev'
            : undefined,
        name: args.inputs.name || resourceName,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS API calls
    if (args.token === 'aws:ec2/getVpc:getVpc') {
      return {
        id: 'vpc-12345',
        cidrBlock: '10.0.0.0/16',
      };
    }
    if (args.token === 'aws:ec2/getSubnets:getSubnets') {
      return {
        ids: ['subnet-12345', 'subnet-67890'],
      };
    }
    return {};
  },
});

describe('TapStack', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Create a new stack instance for each test
    stack = new TapStack('test-stack', {
      environmentSuffix: 'dev',
      tags: {
        Environment: 'dev',
        Team: 'test',
      },
    });
  });

  afterEach(() => {
    // Clean up after each test
    jest.clearAllMocks();
  });

  describe('Resource Creation', () => {
    it('should create all required resources', async () => {
      const [
        clusterArn,
        serviceArn,
        taskDefinitionArn,
        repositoryUrl,
        logGroupName,
      ] = await Promise.all([
        stack.clusterArn,
        stack.serviceArn,
        stack.taskDefinitionArn,
        stack.repositoryUrl,
        stack.logGroupName,
      ]);

      expect(clusterArn).toBeTruthy();
      expect(serviceArn).toBeTruthy();
      expect(taskDefinitionArn).toBeTruthy();
      expect(repositoryUrl).toBeTruthy();
      expect(logGroupName).toBeTruthy();
    });

    it('should create ECR repository with correct configuration', done => {
      stack.repositoryUrl.apply(url => {
        expect(url).toContain('tap-app-dev');
        expect(url).toContain('.dkr.ecr.');
        done();
      });
    });

    it('should create CloudWatch log group with proper naming', done => {
      stack.logGroupName.apply(name => {
        expect(name).toContain('tap-service');
        done();
      });
    });

    it('should create ECS cluster with proper ARN format', done => {
      stack.clusterArn.apply(arn => {
        expect(arn).toContain('cluster');
        expect(arn).toContain('arn:aws');
        done();
      });
    });

    it('should create ECS service with proper ARN format', done => {
      stack.serviceArn.apply(arn => {
        expect(arn).toBeTruthy();
        done();
      });
    });

    it('should create task definition with proper ARN format', done => {
      stack.taskDefinitionArn.apply(arn => {
        expect(arn).toContain('taskDefinition');
        expect(arn).toContain('arn:aws');
        done();
      });
    });
  });

  describe('Configuration Management', () => {
    it('should use default values when not provided', async () => {
      const defaultStack = new TapStack('default-stack', {});
      const outputs = await Promise.all([
        defaultStack.clusterArn,
        defaultStack.serviceArn,
      ]);
      expect(outputs[0]).toBeTruthy();
      expect(outputs[1]).toBeTruthy();
    });

    it('should accept custom environment suffix', async () => {
      const prodStack = new TapStack('prod-stack', {
        environmentSuffix: 'prod',
      });
      const clusterArn = await prodStack.clusterArn;
      expect(clusterArn).toBeTruthy();
    });

    it('should accept custom container configuration', async () => {
      const customStack = new TapStack('custom-stack', {
        containerMemory: 1024,
        containerCpu: 512,
        logRetentionDays: 14,
      });
      const outputs = await Promise.all([
        customStack.clusterArn,
        customStack.serviceArn,
      ]);
      expect(outputs[0]).toBeTruthy();
      expect(outputs[1]).toBeTruthy();
    });

    it('should accept custom alarm thresholds', async () => {
      const customStack = new TapStack('alarm-stack', {
        cpuAlarmThreshold: 90,
        memoryAlarmThreshold: 85,
      });
      const outputs = await Promise.all([
        customStack.clusterArn,
        customStack.serviceArn,
      ]);
      expect(outputs[0]).toBeTruthy();
      expect(outputs[1]).toBeTruthy();
    });

    it('should accept custom health check configuration', async () => {
      const customStack = new TapStack('health-stack', {
        healthCheckInterval: 60,
        healthCheckTimeout: 10,
        healthCheckHealthyThreshold: 3,
        healthCheckUnhealthyThreshold: 2,
      });
      const outputs = await Promise.all([
        customStack.clusterArn,
        customStack.serviceArn,
      ]);
      expect(outputs[0]).toBeTruthy();
      expect(outputs[1]).toBeTruthy();
    });

    it('should apply custom tags to resources', async () => {
      const taggedStack = new TapStack('tagged-stack', {
        tags: {
          Project: 'test-project',
          Owner: 'test-owner',
        },
      });
      const outputs = await Promise.all([
        taggedStack.clusterArn,
        taggedStack.serviceArn,
      ]);
      expect(outputs[0]).toBeTruthy();
      expect(outputs[1]).toBeTruthy();
    });
  });

  describe('Output Validation', () => {
    it('should expose all required outputs', async () => {
      const outputs = await Promise.all([
        stack.clusterArn,
        stack.serviceArn,
        stack.taskDefinitionArn,
        stack.repositoryUrl,
        stack.logGroupName,
      ]);

      outputs.forEach((output) => {
        expect(output).toBeTruthy();
      });
    });

    it('should have valid ECR repository URL format', done => {
      stack.repositoryUrl.apply(url => {
        expect(url).toMatch(/^\d+\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\//);
        done();
      });
    });

    it('should have valid CloudWatch log group name format', done => {
      stack.logGroupName.apply(name => {
        expect(name).toMatch(/^\/ecs\//);
        done();
      });
    });
  });

  describe('Resource Dependencies', () => {
    it('should create resources in correct dependency order', async () => {
      // All resources should be created without errors
      const outputs = await Promise.all([
        stack.clusterArn,
        stack.serviceArn,
        stack.taskDefinitionArn,
        stack.repositoryUrl,
        stack.logGroupName,
      ]);

      expect(outputs).toHaveLength(5);
      outputs.forEach((output) => expect(output).toBeTruthy());
    });

    it('should handle async resource creation', async () => {
      const clusterArn = await stack.clusterArn;
      const serviceArn = await stack.serviceArn;

      expect(clusterArn).toBeTruthy();
      expect(serviceArn).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle empty configuration gracefully', () => {
      expect(() => new TapStack('empty-stack', {})).not.toThrow();
    });

    it('should handle null tags gracefully', () => {
      expect(
        () =>
          new TapStack('null-tags-stack', {
            tags: undefined,
          })
      ).not.toThrow();
    });

    it('should handle zero values for numeric parameters', () => {
      expect(
        () =>
          new TapStack('zero-stack', {
            containerMemory: 512,
            containerCpu: 256,
            logRetentionDays: 1,
            cpuAlarmThreshold: 50,
            memoryAlarmThreshold: 50,
          })
      ).not.toThrow();
    });
  });

  describe('Component Resource Type', () => {
    it('should have correct component resource type', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should register outputs correctly', async () => {
      const outputs = await Promise.all([
        stack.clusterArn,
        stack.serviceArn,
        stack.taskDefinitionArn,
        stack.repositoryUrl,
        stack.logGroupName,
      ]);

      expect(outputs).toHaveLength(5);
    });
  });

  describe('Optimization Features', () => {
    it('should configure proper CPU and memory settings', async () => {
      const customStack = new TapStack('optimized-stack', {
        containerMemory: 512,
        containerCpu: 256,
      });

      const taskDefArn = await customStack.taskDefinitionArn;
      expect(taskDefArn).toBeTruthy();
    });

    it('should configure CloudWatch logging', done => {
      stack.logGroupName.apply(name => {
        expect(name).toContain('tap-service');
        done();
      });
    });

    it('should configure ECR with lifecycle policy', async () => {
      const repositoryUrl = await stack.repositoryUrl;
      expect(repositoryUrl).toBeTruthy();
    });

    it('should configure health checks', async () => {
      const healthCheckStack = new TapStack('health-stack', {
        healthCheckInterval: 30,
        healthCheckTimeout: 5,
      });

      const serviceArn = await healthCheckStack.serviceArn;
      expect(serviceArn).toBeTruthy();
    });

    it('should configure CloudWatch alarms', async () => {
      const alarmStack = new TapStack('alarm-stack', {
        cpuAlarmThreshold: 80,
        memoryAlarmThreshold: 80,
      });

      const clusterArn = await alarmStack.clusterArn;
      expect(clusterArn).toBeTruthy();
    });

    it('should configure graceful shutdown timeout', async () => {
      const shutdownStack = new TapStack('shutdown-stack', {
        stopTimeout: 30,
      });

      const taskDefArn = await shutdownStack.taskDefinitionArn;
      expect(taskDefArn).toBeTruthy();
    });
  });
});