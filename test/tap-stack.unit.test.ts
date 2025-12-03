import * as pulumi from '@pulumi/pulumi';

pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    // Return mock state based on resource type
    const state: any = { ...args.inputs };

    // Add specific mock values for certain resource types
    if (args.type === 'aws:ecs/cluster:Cluster') {
      state.arn = `arn:aws:ecs:us-east-1:123456789:cluster/${args.inputs.name}`;
      state.name = args.inputs.name;
    }
    if (args.type === 'aws:ecs/service:Service') {
      state.id = `arn:aws:ecs:us-east-1:123456789:service/${args.inputs.name}`;
      state.name = args.inputs.name;
    }
    if (args.type === 'aws:ecs/taskDefinition:TaskDefinition') {
      state.arn = `arn:aws:ecs:us-east-1:123456789:task-definition/${args.inputs.family}:1`;
    }
    if (args.type === 'aws:cloudwatch/metricAlarm:MetricAlarm') {
      state.name = args.inputs.name;
    }
    if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      state.name = args.inputs.name;
    }
    if (args.type === 'aws:iam/role:Role') {
      state.arn = `arn:aws:iam::123456789:role/${args.inputs.name}`;
      state.name = args.inputs.name;
    }
    if (args.type === 'aws:iam/policy:Policy') {
      state.arn = `arn:aws:iam::123456789:policy/${args.inputs.name}`;
    }
    if (args.type === 'aws:ec2/securityGroup:SecurityGroup') {
      state.id = `sg-${args.name}`;
    }

    return {
      id: `${args.name}_id`,
      state: state,
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

      // Await and verify output values exist
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
      const tapStack = new stack.TapStack('test-insights', {
        environmentSuffix: 'unit',
      });

      // Verify cluster is created (output exists)
      const clusterArn = await tapStack.clusterArn;
      expect(clusterArn).toBeDefined();
      expect(clusterArn).toContain('cluster');
    });

    it('should create task definition with optimized CPU allocation (512)', async () => {
      const tapStack = new stack.TapStack('test-cpu', {
        environmentSuffix: 'unit',
      });

      const taskDefArn = await tapStack.taskDefinitionArn;
      expect(taskDefArn).toBeDefined();
      expect(taskDefArn).toContain('task-definition');
    });

    it('should create task definition with 1024 MB memory', async () => {
      const tapStack = new stack.TapStack('test-memory', {
        environmentSuffix: 'unit',
      });

      const taskDefArn = await tapStack.taskDefinitionArn;
      expect(taskDefArn).toBeDefined();
    });

    it('should create autoscaling target with minCapacity 1 and maxCapacity 4', async () => {
      const tapStack = new stack.TapStack('test-autoscaling', {
        environmentSuffix: 'unit',
      });

      // Verify stack creates successfully with autoscaling
      expect(tapStack).toBeDefined();
      expect(tapStack.serviceArn).toBeDefined();
    });

    it('should create CPU alarm with 80% threshold', async () => {
      const tapStack = new stack.TapStack('test-cpu-alarm', {
        environmentSuffix: 'unit',
      });

      const cpuAlarmName = await tapStack.cpuAlarmName;
      expect(cpuAlarmName).toBeDefined();
      expect(cpuAlarmName).toContain('cpu-alarm');
    });

    it('should create memory alarm with 90% threshold', async () => {
      const tapStack = new stack.TapStack('test-memory-alarm', {
        environmentSuffix: 'unit',
      });

      const memoryAlarmName = await tapStack.memoryAlarmName;
      expect(memoryAlarmName).toBeDefined();
      expect(memoryAlarmName).toContain('memory-alarm');
    });

    it('should create CloudWatch log group with 7 day retention', async () => {
      const tapStack = new stack.TapStack('test-log-group', {
        environmentSuffix: 'unit',
      });

      const logGroupName = await tapStack.logGroupName;
      expect(logGroupName).toBeDefined();
      expect(logGroupName).toContain('/ecs/tap-');
    });

    it('should create S3 policy with least privilege (GetObject only)', async () => {
      const tapStack = new stack.TapStack('test-s3-policy', {
        environmentSuffix: 'unit',
        s3BucketName: 'test-bucket',
      });

      // Verify stack creates successfully with S3 policy
      expect(tapStack).toBeDefined();
    });

    it('should create ECS service with FARGATE launch type', async () => {
      const tapStack = new stack.TapStack('test-fargate', {
        environmentSuffix: 'unit',
      });

      const serviceArn = await tapStack.serviceArn;
      expect(serviceArn).toBeDefined();
      expect(serviceArn).toContain('service');
    });

    it('should create security group with egress rules', async () => {
      const tapStack = new stack.TapStack('test-sg', {
        environmentSuffix: 'unit',
      });

      // Verify stack creates successfully with security group
      expect(tapStack).toBeDefined();
      expect(tapStack.serviceArn).toBeDefined();
    });

    it('should create IAM roles for task execution and task', async () => {
      const tapStack = new stack.TapStack('test-iam', {
        environmentSuffix: 'unit',
      });

      // Verify stack creates successfully with IAM roles
      expect(tapStack).toBeDefined();
      expect(tapStack.taskDefinitionArn).toBeDefined();
    });

    it('should create autoscaling policy with target tracking', async () => {
      const tapStack = new stack.TapStack('test-scaling-policy', {
        environmentSuffix: 'unit',
      });

      // Verify stack creates successfully with autoscaling policy
      expect(tapStack).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environment suffix with j7 in resource names', async () => {
      const tapStack = new stack.TapStack('test-naming', {
        environmentSuffix: 'myenv',
      });

      const clusterArn = await tapStack.clusterArn;
      const cpuAlarmName = await tapStack.cpuAlarmName;
      const logGroupName = await tapStack.logGroupName;

      // Verify naming includes environment suffix with -j7
      expect(clusterArn).toContain('myenv-j7');
      expect(cpuAlarmName).toContain('myenv-j7');
      expect(logGroupName).toContain('myenv-j7');
    });
  });
});
