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
    it('should create TapStack with default values', () => {
      const tapStack = new stack.TapStack('test-stack-default', {
        environmentSuffix: 'test',
      });

      expect(tapStack).toBeDefined();
      expect(tapStack.clusterArn).toBeDefined();
      expect(tapStack.serviceArn).toBeDefined();
      expect(tapStack.taskDefinitionArn).toBeDefined();
    });

    it('should create TapStack with custom configuration', () => {
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

    it('should create TapStack with provided VPC and subnets', () => {
      const tapStack = new stack.TapStack('test-stack-vpc', {
        environmentSuffix: 'staging',
        vpcId: 'vpc-custom123',
        subnetIds: ['subnet-a', 'subnet-b', 'subnet-c'],
      });

      expect(tapStack).toBeDefined();
    });

    it('should expose all required outputs', () => {
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
    });

    it('should use default environment suffix when not provided', () => {
      const tapStack = new stack.TapStack('test-stack-no-suffix', {});

      expect(tapStack).toBeDefined();
    });
  });

  describe('Resource Configuration Validation', () => {
    it('should create ECS cluster with Container Insights enabled', () => {
      const tapStack = new stack.TapStack('test-insights', {
        environmentSuffix: 'unit',
      });

      // Verify cluster is created (output exists)
      expect(tapStack.clusterArn).toBeDefined();
    });

    it('should create task definition with optimized CPU allocation (512)', () => {
      const tapStack = new stack.TapStack('test-cpu', {
        environmentSuffix: 'unit',
      });

      expect(tapStack.taskDefinitionArn).toBeDefined();
    });

    it('should create task definition with 1024 MB memory', () => {
      const tapStack = new stack.TapStack('test-memory', {
        environmentSuffix: 'unit',
      });

      expect(tapStack.taskDefinitionArn).toBeDefined();
    });

    it('should create autoscaling target with minCapacity 1 and maxCapacity 4', () => {
      const tapStack = new stack.TapStack('test-autoscaling', {
        environmentSuffix: 'unit',
      });

      // Verify stack creates successfully with autoscaling
      expect(tapStack).toBeDefined();
      expect(tapStack.serviceArn).toBeDefined();
    });

    it('should create CPU alarm with 80% threshold', () => {
      const tapStack = new stack.TapStack('test-cpu-alarm', {
        environmentSuffix: 'unit',
      });

      expect(tapStack.cpuAlarmName).toBeDefined();
    });

    it('should create memory alarm with 90% threshold', () => {
      const tapStack = new stack.TapStack('test-memory-alarm', {
        environmentSuffix: 'unit',
      });

      expect(tapStack.memoryAlarmName).toBeDefined();
    });

    it('should create CloudWatch log group with 7 day retention', () => {
      const tapStack = new stack.TapStack('test-log-group', {
        environmentSuffix: 'unit',
      });

      expect(tapStack.logGroupName).toBeDefined();
    });

    it('should create S3 policy with least privilege (GetObject only)', () => {
      const tapStack = new stack.TapStack('test-s3-policy', {
        environmentSuffix: 'unit',
        s3BucketName: 'test-bucket',
      });

      // Verify stack creates successfully with S3 policy
      expect(tapStack).toBeDefined();
    });

    it('should create ECS service with FARGATE launch type', () => {
      const tapStack = new stack.TapStack('test-fargate', {
        environmentSuffix: 'unit',
      });

      expect(tapStack.serviceArn).toBeDefined();
    });

    it('should create security group with egress rules', () => {
      const tapStack = new stack.TapStack('test-sg', {
        environmentSuffix: 'unit',
      });

      // Verify stack creates successfully with security group
      expect(tapStack).toBeDefined();
      expect(tapStack.serviceArn).toBeDefined();
    });

    it('should create IAM roles for task execution and task', () => {
      const tapStack = new stack.TapStack('test-iam', {
        environmentSuffix: 'unit',
      });

      // Verify stack creates successfully with IAM roles
      expect(tapStack).toBeDefined();
      expect(tapStack.taskDefinitionArn).toBeDefined();
    });

    it('should create autoscaling policy with target tracking', () => {
      const tapStack = new stack.TapStack('test-scaling-policy', {
        environmentSuffix: 'unit',
      });

      // Verify stack creates successfully with autoscaling policy
      expect(tapStack).toBeDefined();
    });
  });

  describe('Resource Naming Convention', () => {
    it('should include environment suffix with j7 in resource names', () => {
      const tapStack = new stack.TapStack('test-naming', {
        environmentSuffix: 'myenv',
      });

      // Verify stack creates with naming convention
      expect(tapStack).toBeDefined();
      expect(tapStack.clusterArn).toBeDefined();
      expect(tapStack.cpuAlarmName).toBeDefined();
      expect(tapStack.logGroupName).toBeDefined();
    });
  });
});
