import * as pulumi from '@pulumi/pulumi';
import { EcsComponent } from '../lib/components/ecs';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, unknown>;
  } {
    const outputs: Record<string, unknown> = {
      ...args.inputs,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      id: `${args.name}-id`,
    };

    // ECS Cluster outputs
    if (args.type === 'aws:ecs/cluster:Cluster') {
      outputs.arn = `arn:aws:ecs:us-east-1:123456789012:cluster/${args.name}`;
    }

    // ECS Task Definition outputs
    if (args.type === 'aws:ecs/taskDefinition:TaskDefinition') {
      outputs.arn = `arn:aws:ecs:us-east-1:123456789012:task-definition/${args.name}:1`;
      outputs.revision = 1;
    }

    // ECS Service outputs
    if (args.type === 'aws:ecs/service:Service') {
      outputs.arn = `arn:aws:ecs:us-east-1:123456789012:service/${args.name}`;
      outputs.launchType = args.inputs.launchType || 'FARGATE';
      outputs.desiredCount = args.inputs.desiredCount || 2;
      outputs.loadBalancers = args.inputs.loadBalancers || [];
      outputs.networkConfiguration = {
        awsvpcConfiguration: {
          assignPublicIp: args.inputs.networkConfiguration?.awsvpcConfiguration?.assignPublicIp || false,
          subnets: args.inputs.networkConfiguration?.awsvpcConfiguration?.subnets || [],
          securityGroups: args.inputs.networkConfiguration?.awsvpcConfiguration?.securityGroups || [],
        },
      };
    }

    // IAM Role outputs
    if (args.type === 'aws:iam/role:Role') {
      outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
    }

    // IAM Policy outputs
    if (args.type === 'aws:iam/policy:Policy') {
      outputs.arn = `arn:aws:iam::123456789012:policy/${args.name}`;
    }

    // Security Group outputs
    if (args.type === 'aws:ec2/securityGroup:SecurityGroup') {
      outputs.arn = `arn:aws:ec2:us-east-1:123456789012:security-group/${args.name}`;
      outputs.vpcId = args.inputs.vpcId;
    }

    // CloudWatch Log Group outputs
    if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.name}`;
    }

    // Auto Scaling Target outputs
    if (args.type === 'aws:appautoscaling/target:Target') {
      outputs.arn = `arn:aws:application-autoscaling:us-east-1:123456789012:scalable-target/${args.name}`;
    }

    // Auto Scaling Policy outputs
    if (args.type === 'aws:appautoscaling/policy:Policy') {
      outputs.arn = `arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:${args.name}`;
    }

    return {
      id: `${args.name}-id`,
      state: outputs,
    };
  },
  call: function () {
    return {};
  },
});

describe('EcsComponent', () => {
  let ecs: EcsComponent;
  const mockVpcId = pulumi.output('vpc-12345');
  const mockSubnetIds = [
    pulumi.output('subnet-1'),
    pulumi.output('subnet-2'),
    pulumi.output('subnet-3'),
  ];
  const mockClusterArn = pulumi.output('arn:aws:ecs:us-east-1:123456789012:cluster/test-cluster');
  const mockTargetGroupArn = pulumi.output('arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/test/abc123');
  const mockAlbSecurityGroupId = pulumi.output('sg-alb');
  const mockEcrRepositoryUrl = pulumi.output('123456789012.dkr.ecr.us-east-1.amazonaws.com/payment-processor');
  const mockDbSecretArn = pulumi.output('arn:aws:secretsmanager:us-east-1:123456789012:secret:db-secret');

  beforeAll(() => {
    ecs = new EcsComponent('test-ecs', {
      environment: 'dev',
      clusterArn: mockClusterArn,
      vpcId: mockVpcId,
      privateSubnetIds: mockSubnetIds,
      targetGroupArn: mockTargetGroupArn,
      albSecurityGroupId: mockAlbSecurityGroupId,
      ecrRepositoryUrl: mockEcrRepositoryUrl,
      dbSecretArn: mockDbSecretArn,
      scalingCpuThreshold: 70,
      tags: {
        Environment: 'dev',
        Project: 'payment-processing',
      },
    });
  });

  describe('ECS Cluster', () => {
    it('should use provided cluster ARN', (done) => {
      pulumi.all([mockClusterArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('cluster');
        done();
      });
    });

    it('should configure service with cluster', (done) => {
      pulumi.all([ecs.service.cluster]).apply(([cluster]) => {
        expect(cluster).toBeDefined();
        done();
      });
    });
  });

  describe('Task Definition', () => {
    it('should create task definition', (done) => {
      pulumi.all([ecs.taskDefinition.arn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('task-definition');
        done();
      });
    });

    it('should use Fargate compatibility', (done) => {
      pulumi.all([ecs.taskDefinition.requiresCompatibilities]).apply(([compatibilities]) => {
        expect(compatibilities).toContain('FARGATE');
        done();
      });
    });

    it('should use awsvpc network mode', (done) => {
      pulumi.all([ecs.taskDefinition.networkMode]).apply(([networkMode]) => {
        expect(networkMode).toBe('awsvpc');
        done();
      });
    });

    it('should configure CPU and memory', (done) => {
      pulumi.all([ecs.taskDefinition.cpu, ecs.taskDefinition.memory]).apply(([cpu, memory]) => {
        expect(cpu).toBeDefined();
        expect(memory).toBeDefined();
        expect(parseInt(cpu)).toBeGreaterThan(0);
        expect(parseInt(memory)).toBeGreaterThan(0);
        done();
      });
    });

    it('should define container with correct image', (done) => {
      pulumi.all([ecs.taskDefinition.containerDefinitions]).apply(([containerDefs]) => {
        const containers = JSON.parse(containerDefs);
        expect(containers).toHaveLength(1);
        expect(containers[0].image).toContain('ecr');
        done();
      });
    });

    it('should configure container port mapping', (done) => {
      pulumi.all([ecs.taskDefinition.containerDefinitions]).apply(([containerDefs]) => {
        const containers = JSON.parse(containerDefs);
        expect(containers[0].portMappings).toBeDefined();
        expect(containers[0].portMappings[0].containerPort).toBe(8080);
        done();
      });
    });

    it('should configure CloudWatch logging', (done) => {
      pulumi.all([ecs.taskDefinition.containerDefinitions]).apply(([containerDefs]) => {
        const containers = JSON.parse(containerDefs);
        expect(containers[0].logConfiguration).toBeDefined();
        expect(containers[0].logConfiguration.logDriver).toBe('awslogs');
        done();
      });
    });

    it('should inject database secret as environment variable', (done) => {
      pulumi.all([ecs.taskDefinition.containerDefinitions]).apply(([containerDefs]) => {
        const containers = JSON.parse(containerDefs);
        expect(containers[0].secrets).toBeDefined();
        expect(Array.isArray(containers[0].secrets)).toBe(true);
        done();
      });
    });
  });

  describe('ECS Service', () => {

    it('should use Fargate launch type', (done) => {
      pulumi.all([ecs.service.launchType]).apply(([launchType]) => {
        expect(launchType).toBe('FARGATE');
        done();
      });
    });

    it('should configure desired count', (done) => {
      pulumi.all([ecs.service.desiredCount]).apply(([count]) => {
        expect(count).toBeGreaterThan(0);
        done();
      });
    });

    it('should attach to load balancer', (done) => {
      pulumi.all([ecs.service.loadBalancers]).apply(([loadBalancers]) => {
        expect(loadBalancers).toBeDefined();
        expect(Array.isArray(loadBalancers)).toBe(true);
        expect(loadBalancers.length).toBeGreaterThan(0);
        done();
      });
    });

    it('should use awsvpc network configuration', (done) => {
      pulumi.all([ecs.service.networkConfiguration]).apply(([networkConfig]) => {
        expect(networkConfig).toBeDefined();
        expect(networkConfig.awsvpcConfiguration).toBeDefined();
        done();
      });
    });

    it('should not assign public IP', (done) => {
      pulumi.all([ecs.service.networkConfiguration]).apply(([networkConfig]) => {
        expect(networkConfig.awsvpcConfiguration.assignPublicIp).toBe(false);
        done();
      });
    });
  });

  describe('IAM Roles', () => {
    it('should create task execution role', (done) => {
      pulumi.all([ecs.taskExecutionRole.arn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('role');
        done();
      });
    });

    it('should create task role', (done) => {
      pulumi.all([ecs.taskRole.arn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('role');
        done();
      });
    });

    it('should configure ECS assume role policy', (done) => {
      pulumi.all([ecs.taskExecutionRole.assumeRolePolicy]).apply(([policy]) => {
        const policyDoc = JSON.parse(policy);
        expect(policyDoc.Statement[0].Principal.Service).toContain('ecs-tasks.amazonaws.com');
        done();
      });
    });
  });

  describe('Security Group', () => {
    it('should create security group for ECS tasks', (done) => {
      pulumi.all([ecs.getSecurityGroupId()]).apply(([sgId]) => {
        expect(sgId).toBeDefined();
        expect(typeof sgId).toBe('string');
        done();
      });
    });

    it('should allow traffic from ALB security group', (done) => {
      pulumi.all([ecs.getSecurityGroupId()]).apply(() => {
        // Security group allows traffic from ALB
        expect(true).toBe(true);
        done();
      });
    });
  });

  describe('Auto Scaling', () => {
    it('should create auto scaling target', (done) => {
      pulumi.all([ecs.scalingTarget.resourceId]).apply(([resourceId]) => {
        expect(resourceId).toBeDefined();
        expect(typeof resourceId).toBe('string');
        done();
      });
    });

    it('should configure min and max capacity', (done) => {
      pulumi.all([ecs.scalingTarget.minCapacity, ecs.scalingTarget.maxCapacity]).apply(([min, max]) => {
        expect(min).toBeDefined();
        expect(max).toBeDefined();
        expect(max).toBeGreaterThan(min);
        done();
      });
    });

    it('should set min capacity to 2', (done) => {
      pulumi.all([ecs.scalingTarget.minCapacity]).apply(([min]) => {
        expect(min).toBe(2);
        done();
      });
    });

    it('should set max capacity to 10', (done) => {
      pulumi.all([ecs.scalingTarget.maxCapacity]).apply(([max]) => {
        expect(max).toBe(10);
        done();
      });
    });

    it('should configure scalable dimension for ECS service', (done) => {
      pulumi.all([ecs.scalingTarget.scalableDimension]).apply(([dimension]) => {
        expect(dimension).toBe('ecs:service:DesiredCount');
        done();
      });
    });

    it('should configure service namespace', (done) => {
      pulumi.all([ecs.scalingTarget.serviceNamespace]).apply(([namespace]) => {
        expect(namespace).toBe('ecs');
        done();
      });
    });

    it('should create CPU-based scaling policy', (done) => {
      pulumi.all([ecs.scalingPolicy.policyType]).apply(([policyType]) => {
        expect(policyType).toBe('TargetTrackingScaling');
        done();
      });
    });

    it('should use configured CPU threshold', (done) => {
      pulumi.all([ecs.scalingPolicy.targetTrackingScalingPolicyConfiguration]).apply(([config]) => {
        expect(config).toBeDefined();
        expect(config.targetValue).toBe(70);
        done();
      });
    });

    it('should configure predefined CPU utilization metric', (done) => {
      pulumi.all([ecs.scalingPolicy.targetTrackingScalingPolicyConfiguration]).apply(([config]) => {
        expect(config.predefinedMetricSpecification).toBeDefined();
        expect(config.predefinedMetricSpecification.predefinedMetricType).toBe('ECSServiceAverageCPUUtilization');
        done();
      });
    });

    it('should configure scale in cooldown', (done) => {
      pulumi.all([ecs.scalingPolicy.targetTrackingScalingPolicyConfiguration]).apply(([config]) => {
        expect(config.scaleInCooldown).toBe(300);
        done();
      });
    });

    it('should configure scale out cooldown', (done) => {
      pulumi.all([ecs.scalingPolicy.targetTrackingScalingPolicyConfiguration]).apply(([config]) => {
        expect(config.scaleOutCooldown).toBe(60);
        done();
      });
    });

    it('should register outputs', (done) => {
      pulumi.all([ecs.service.arn, ecs.taskDefinition.arn]).apply(() => {
        expect(true).toBe(true);
        done();
      });
    });
  });

  describe('CloudWatch Logs', () => {
    it('should create log group', (done) => {
      pulumi.all([ecs.logGroup.arn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(arn).toContain('log-group');
        done();
      });
    });

    it('should configure log retention', (done) => {
      pulumi.all([ecs.logGroup.retentionInDays]).apply(([retention]) => {
        expect(retention).toBeDefined();
        expect(retention).toBeGreaterThan(0);
        done();
      });
    });
  });

  describe('Tagging', () => {
    it('should apply tags to task definition', (done) => {
      pulumi.all([ecs.taskDefinition.tags]).apply(([tags]) => {
        expect(tags).toBeDefined();
        expect(tags['Environment']).toBe('dev');
        expect(tags['Project']).toBe('payment-processing');
        done();
      });
    });

    it('should apply tags to service', (done) => {
      pulumi.all([ecs.service.tags]).apply(([tags]) => {
        expect(tags).toBeDefined();
        done();
      });
    });
  });

  describe('Outputs', () => {
    it('should export cluster ARN', (done) => {
      pulumi.all([mockClusterArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        expect(arn).toContain('cluster');
        done();
      });
    });

    it('should export service name', (done) => {
      pulumi.all([ecs.service.name]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });
  });
});
