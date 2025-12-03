import * as pulumi from '@pulumi/pulumi';

// Track created resources for verification
const createdResources: Map<string, { type: string; inputs: any }> = new Map();

pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    // Store resource for later verification
    createdResources.set(args.name, {
      type: args.type,
      inputs: args.inputs,
    });

    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:ec2/getVpc:getVpc') {
      return { id: 'vpc-12345678' };
    }
    if (args.token === 'aws:ec2/getSubnets:getSubnets') {
      return { ids: ['subnet-12345678', 'subnet-87654321'] };
    }
    return {};
  },
});

describe('TapStack', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const stack = require('../lib/tap-stack') as typeof import('../lib/tap-stack');

  beforeEach(() => {
    createdResources.clear();
  });

  describe('TapStack Resource Creation', () => {
    it('should create TapStack with default values', async () => {
      const tapStack = new stack.TapStack('test-stack-default', {
        environmentSuffix: 'test',
      });

      expect(tapStack).toBeDefined();
      expect(tapStack.clusterArn).toBeDefined();
      expect(tapStack.serviceArn).toBeDefined();
      expect(tapStack.taskDefinitionArn).toBeDefined();
    });

    it('should create TapStack with custom configuration', async () => {
      const tapStack = new stack.TapStack('test-stack-custom', {
        environmentSuffix: 'prod',
        containerImageUri: 'my-registry/my-app:v1.0.0',
        s3BucketName: 'custom-bucket',
        desiredCount: 3,
        tags: {
          Environment: 'prod',
          Team: 'platform',
          CostCenter: 'engineering',
        },
      });

      expect(tapStack).toBeDefined();
    });

    it('should create TapStack with provided VPC and subnets', async () => {
      const tapStack = new stack.TapStack('test-stack-vpc', {
        environmentSuffix: 'staging',
        vpcId: 'vpc-custom123',
        subnetIds: ['subnet-a', 'subnet-b', 'subnet-c'],
      });

      expect(tapStack).toBeDefined();
    });

    it('should expose all required outputs', async () => {
      const tapStack = new stack.TapStack('test-stack-outputs', {
        environmentSuffix: 'test',
      });

      // Verify all outputs are defined
      expect(tapStack.clusterArn).toBeDefined();
      expect(tapStack.serviceArn).toBeDefined();
      expect(tapStack.taskDefinitionArn).toBeDefined();
      expect(tapStack.cpuAlarmName).toBeDefined();
      expect(tapStack.memoryAlarmName).toBeDefined();
      expect(tapStack.logGroupName).toBeDefined();

      // Await and verify output values
      const clusterArn = await tapStack.clusterArn;
      const serviceArn = await tapStack.serviceArn;
      const taskDefinitionArn = await tapStack.taskDefinitionArn;
      const cpuAlarmName = await tapStack.cpuAlarmName;
      const memoryAlarmName = await tapStack.memoryAlarmName;
      const logGroupName = await tapStack.logGroupName;

      expect(clusterArn).toBeDefined();
      expect(serviceArn).toBeDefined();
      expect(taskDefinitionArn).toBeDefined();
      expect(cpuAlarmName).toBeDefined();
      expect(memoryAlarmName).toBeDefined();
      expect(logGroupName).toBeDefined();
    });

    it('should use default environment suffix when not provided', async () => {
      const tapStack = new stack.TapStack('test-stack-no-suffix', {});

      expect(tapStack).toBeDefined();
    });
  });

  describe('Resource Configuration Validation', () => {
    it('should create ECS cluster with Container Insights enabled', async () => {
      new stack.TapStack('test-insights', {
        environmentSuffix: 'unit',
      });

      // Find the cluster resource
      const clusterResource = Array.from(createdResources.entries()).find(
        ([name, resource]) => resource.type === 'aws:ecs/cluster:Cluster'
      );

      expect(clusterResource).toBeDefined();
      if (clusterResource) {
        const [, resource] = clusterResource;
        expect(resource.inputs.settings).toBeDefined();
        const containerInsightsSetting = resource.inputs.settings.find(
          (s: { name: string; value: string }) => s.name === 'containerInsights'
        );
        expect(containerInsightsSetting).toBeDefined();
        expect(containerInsightsSetting.value).toBe('enabled');
      }
    });

    it('should create task definition with optimized CPU allocation (512)', async () => {
      new stack.TapStack('test-cpu', {
        environmentSuffix: 'unit',
      });

      const taskDefResource = Array.from(createdResources.entries()).find(
        ([name, resource]) =>
          resource.type === 'aws:ecs/taskDefinition:TaskDefinition'
      );

      expect(taskDefResource).toBeDefined();
      if (taskDefResource) {
        const [, resource] = taskDefResource;
        expect(resource.inputs.cpu).toBe('512');
      }
    });

    it('should create task definition with 1024 MB memory', async () => {
      new stack.TapStack('test-memory', {
        environmentSuffix: 'unit',
      });

      const taskDefResource = Array.from(createdResources.entries()).find(
        ([name, resource]) =>
          resource.type === 'aws:ecs/taskDefinition:TaskDefinition'
      );

      expect(taskDefResource).toBeDefined();
      if (taskDefResource) {
        const [, resource] = taskDefResource;
        expect(resource.inputs.memory).toBe('1024');
      }
    });

    it('should create autoscaling target with minCapacity 1 and maxCapacity 4', async () => {
      new stack.TapStack('test-autoscaling', {
        environmentSuffix: 'unit',
      });

      const scalingTarget = Array.from(createdResources.entries()).find(
        ([name, resource]) =>
          resource.type === 'aws:appautoscaling/target:Target'
      );

      expect(scalingTarget).toBeDefined();
      if (scalingTarget) {
        const [, resource] = scalingTarget;
        expect(resource.inputs.minCapacity).toBe(1);
        expect(resource.inputs.maxCapacity).toBe(4);
      }
    });

    it('should create CPU alarm with 80% threshold', async () => {
      new stack.TapStack('test-cpu-alarm', {
        environmentSuffix: 'unit',
      });

      const cpuAlarm = Array.from(createdResources.entries()).find(
        ([name, resource]) =>
          resource.type === 'aws:cloudwatch/metricAlarm:MetricAlarm' &&
          name.includes('cpu-alarm')
      );

      expect(cpuAlarm).toBeDefined();
      if (cpuAlarm) {
        const [, resource] = cpuAlarm;
        expect(resource.inputs.threshold).toBe(80);
        expect(resource.inputs.metricName).toBe('CPUUtilization');
        expect(resource.inputs.comparisonOperator).toBe('GreaterThanThreshold');
      }
    });

    it('should create memory alarm with 90% threshold', async () => {
      new stack.TapStack('test-memory-alarm', {
        environmentSuffix: 'unit',
      });

      const memoryAlarm = Array.from(createdResources.entries()).find(
        ([name, resource]) =>
          resource.type === 'aws:cloudwatch/metricAlarm:MetricAlarm' &&
          name.includes('memory-alarm')
      );

      expect(memoryAlarm).toBeDefined();
      if (memoryAlarm) {
        const [, resource] = memoryAlarm;
        expect(resource.inputs.threshold).toBe(90);
        expect(resource.inputs.metricName).toBe('MemoryUtilization');
        expect(resource.inputs.comparisonOperator).toBe('GreaterThanThreshold');
      }
    });

    it('should create CloudWatch log group with 7 day retention', async () => {
      new stack.TapStack('test-log-group', {
        environmentSuffix: 'unit',
      });

      const logGroup = Array.from(createdResources.entries()).find(
        ([name, resource]) =>
          resource.type === 'aws:cloudwatch/logGroup:LogGroup'
      );

      expect(logGroup).toBeDefined();
      if (logGroup) {
        const [, resource] = logGroup;
        expect(resource.inputs.retentionInDays).toBe(7);
      }
    });

    it('should create S3 policy with least privilege (GetObject only)', async () => {
      new stack.TapStack('test-s3-policy', {
        environmentSuffix: 'unit',
        s3BucketName: 'test-bucket',
      });

      const s3Policy = Array.from(createdResources.entries()).find(
        ([name, resource]) =>
          resource.type === 'aws:iam/policy:Policy' &&
          name.includes('s3-policy')
      );

      expect(s3Policy).toBeDefined();
      if (s3Policy) {
        const [, resource] = s3Policy;
        expect(resource.inputs.description).toContain('GetObject only');
      }
    });

    it('should create ECS service with FARGATE launch type', async () => {
      new stack.TapStack('test-fargate', {
        environmentSuffix: 'unit',
      });

      const ecsService = Array.from(createdResources.entries()).find(
        ([name, resource]) => resource.type === 'aws:ecs/service:Service'
      );

      expect(ecsService).toBeDefined();
      if (ecsService) {
        const [, resource] = ecsService;
        expect(resource.inputs.launchType).toBe('FARGATE');
      }
    });

    it('should create security group with egress rules', async () => {
      new stack.TapStack('test-sg', {
        environmentSuffix: 'unit',
      });

      const securityGroup = Array.from(createdResources.entries()).find(
        ([name, resource]) =>
          resource.type === 'aws:ec2/securityGroup:SecurityGroup'
      );

      expect(securityGroup).toBeDefined();
      if (securityGroup) {
        const [, resource] = securityGroup;
        expect(resource.inputs.egress).toBeDefined();
        expect(resource.inputs.egress.length).toBeGreaterThan(0);
      }
    });

    it('should create IAM roles for task execution and task', async () => {
      new stack.TapStack('test-iam', {
        environmentSuffix: 'unit',
      });

      const iamRoles = Array.from(createdResources.entries()).filter(
        ([name, resource]) => resource.type === 'aws:iam/role:Role'
      );

      // Should have at least 2 roles: task execution role and task role
      expect(iamRoles.length).toBeGreaterThanOrEqual(2);
    });

    it('should create autoscaling policy with target tracking', async () => {
      new stack.TapStack('test-scaling-policy', {
        environmentSuffix: 'unit',
      });

      const scalingPolicy = Array.from(createdResources.entries()).find(
        ([name, resource]) =>
          resource.type === 'aws:appautoscaling/policy:Policy'
      );

      expect(scalingPolicy).toBeDefined();
      if (scalingPolicy) {
        const [, resource] = scalingPolicy;
        expect(resource.inputs.policyType).toBe('TargetTrackingScaling');
      }
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environment suffix with j7 in resource names', async () => {
      new stack.TapStack('test-naming', {
        environmentSuffix: 'myenv',
      });

      // Check that resources include the environment suffix with -j7
      const clusterResource = Array.from(createdResources.entries()).find(
        ([name, resource]) => resource.type === 'aws:ecs/cluster:Cluster'
      );

      expect(clusterResource).toBeDefined();
      if (clusterResource) {
        const [name] = clusterResource;
        expect(name).toContain('myenv-j7');
      }
    });
  });
});
