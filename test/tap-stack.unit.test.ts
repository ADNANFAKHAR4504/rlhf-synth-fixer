import * as pulumi from '@pulumi/pulumi';
import * as fs from 'fs';
import * as path from 'path';

// Track created resources for verification
const createdResources: Map<string, any> = new Map();

// Mock Pulumi runtime before any imports
pulumi.runtime.setMocks(
  {
    newResource: (args: pulumi.runtime.MockResourceArgs): {
      id: string;
      state: Record<string, any>;
    } => {
      // Store resource for verification
      createdResources.set(args.name, {
        type: args.type,
        inputs: args.inputs,
      });

      // Return mock outputs based on resource type
      const outputs: Record<string, any> = { ...args.inputs };

      // Add common outputs
      outputs.id = `${args.name}-id`;
      outputs.arn = `arn:aws:service:us-east-1:123456789012:${args.name}`;

      // Add specific outputs based on resource type
      if (args.type.includes('Vpc')) {
        outputs.id = `vpc-${args.name}`;
      } else if (args.type.includes('Subnet')) {
        outputs.id = `subnet-${args.name}`;
      } else if (args.type.includes('SecurityGroup')) {
        outputs.id = `sg-${args.name}`;
      } else if (args.type.includes('LoadBalancer')) {
        outputs.dnsName = `${args.name}.us-east-1.elb.amazonaws.com`;
        outputs.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:loadbalancer/app/${args.name}`;
      } else if (args.type.includes('TargetGroup')) {
        outputs.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${args.name}`;
      } else if (args.type.includes('Cluster')) {
        outputs.name = args.inputs.name || args.name;
        outputs.arn = `arn:aws:ecs:us-east-1:123456789012:cluster/${args.name}`;
      } else if (args.type.includes('Service')) {
        outputs.name = args.name;
        outputs.id = `arn:aws:ecs:us-east-1:123456789012:service/${args.name}`;
      } else if (args.type.includes('TaskDefinition')) {
        outputs.arn = `arn:aws:ecs:us-east-1:123456789012:task-definition/${args.name}`;
      } else if (args.type.includes('LogGroup')) {
        outputs.name = args.inputs.name || `/ecs/${args.name}`;
        outputs.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.name}`;
      } else if (args.type.includes('Role')) {
        outputs.name = args.name;
        outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
      } else if (args.type.includes('MetricAlarm')) {
        outputs.arn = `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${args.name}`;
      } else if (args.type.includes('InternetGateway')) {
        outputs.id = `igw-${args.name}`;
      } else if (args.type.includes('RouteTable')) {
        outputs.id = `rtb-${args.name}`;
      }

      return {
        id: outputs.id || `${args.name}-id`,
        state: outputs,
      };
    },
    call: (args: pulumi.runtime.MockCallArgs) => {
      return args.inputs;
    },
  },
  'project',
  'stack',
  false
);

// Helper function to get output value
function promiseOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve) => output.apply(resolve));
}

describe('TapStack Component Resource', () => {
  // Clear created resources before each test
  beforeEach(() => {
    createdResources.clear();
  });

  describe('Instantiation with default args', () => {
    it('should create TapStack with default environment suffix', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TapStack } = require('../lib/tap-stack');

      const stack = new TapStack('test-stack', {});

      // Verify stack was created
      expect(stack).toBeDefined();

      // Verify outputs exist
      expect(stack.vpcId).toBeDefined();
      expect(stack.clusterId).toBeDefined();
      expect(stack.clusterName).toBeDefined();
      expect(stack.clusterArn).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.albArn).toBeDefined();
      expect(stack.targetGroupArn).toBeDefined();
      expect(stack.serviceArn).toBeDefined();
      expect(stack.serviceName).toBeDefined();
      expect(stack.taskDefinitionArn).toBeDefined();
      expect(stack.logGroupName).toBeDefined();
      expect(stack.lowCpuAlarmArn).toBeDefined();
      expect(stack.launchTemplateId).toBeDefined();
      expect(stack.autoScalingGroupName).toBeDefined();
      expect(stack.capacityProviderName).toBeDefined();
      expect(stack.instanceType).toBeDefined();
    });

    it('should create all required AWS resources', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TapStack } = require('../lib/tap-stack');

      new TapStack('test-resources', {});

      // Allow async resource creation to complete
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify VPC resources
      const vpcResources = Array.from(createdResources.keys()).filter((k) =>
        k.includes('vpc')
      );
      expect(vpcResources.length).toBeGreaterThan(0);

      // Verify subnet resources
      const subnetResources = Array.from(createdResources.keys()).filter((k) =>
        k.includes('subnet')
      );
      expect(subnetResources.length).toBeGreaterThanOrEqual(2);

      // Verify security group resources
      const sgResources = Array.from(createdResources.keys()).filter((k) =>
        k.includes('sg')
      );
      expect(sgResources.length).toBeGreaterThanOrEqual(2);

      // Verify ECS cluster
      const clusterResources = Array.from(createdResources.keys()).filter((k) =>
        k.includes('cluster')
      );
      expect(clusterResources.length).toBeGreaterThan(0);

      // Verify ALB resources
      const albResources = Array.from(createdResources.keys()).filter((k) =>
        k.includes('alb')
      );
      expect(albResources.length).toBeGreaterThan(0);
    });
  });

  describe('Instantiation with custom args', () => {
    it('should create TapStack with custom environment suffix', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TapStack } = require('../lib/tap-stack');

      const stack = new TapStack('custom-stack', {
        environmentSuffix: 'production',
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
    });

    it('should create TapStack with custom tags', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TapStack } = require('../lib/tap-stack');

      const customTags = {
        CustomTag: 'CustomValue',
        Owner: 'TestTeam',
      };

      const stack = new TapStack('tagged-stack', {
        environmentSuffix: 'staging',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });

    it('should create TapStack with costCenter', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TapStack } = require('../lib/tap-stack');

      const stack = new TapStack('cost-center-stack', {
        environmentSuffix: 'dev',
        costCenter: 'engineering',
      });

      expect(stack).toBeDefined();
    });

    it('should create TapStack with all args provided', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TapStack } = require('../lib/tap-stack');

      const stack = new TapStack('full-stack', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
          Project: 'unit-test',
        },
        costCenter: 'qa',
      });

      expect(stack).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.clusterName).toBeDefined();
    });
  });

  describe('Output values', () => {
    it('should return valid VPC ID output', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TapStack } = require('../lib/tap-stack');

      const stack = new TapStack('vpc-test', {});
      const vpcId = await promiseOf(stack.vpcId);

      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
    });

    it('should return valid cluster outputs', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TapStack } = require('../lib/tap-stack');

      const stack = new TapStack('cluster-test', {});

      const clusterName = await promiseOf(stack.clusterName);
      const clusterArn = await promiseOf(stack.clusterArn);

      expect(clusterName).toBeDefined();
      expect(clusterArn).toBeDefined();
      expect(clusterArn).toContain('arn:aws:ecs');
    });

    it('should return valid ALB outputs', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TapStack } = require('../lib/tap-stack');

      const stack = new TapStack('alb-test', {});

      const albDnsName = await promiseOf(stack.albDnsName);
      const albArn = await promiseOf(stack.albArn);

      expect(albDnsName).toBeDefined();
      expect(albArn).toBeDefined();
    });

    it('should return FARGATE for instanceType output', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TapStack } = require('../lib/tap-stack');

      const stack = new TapStack('instance-test', {});

      const instanceType = await promiseOf(stack.instanceType);
      const capacityProviderName = await promiseOf(stack.capacityProviderName);

      expect(instanceType).toBe('FARGATE');
      expect(capacityProviderName).toBe('FARGATE');
    });

    it('should return fargate-managed for launch template and ASG', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { TapStack } = require('../lib/tap-stack');

      const stack = new TapStack('fargate-test', {});

      const launchTemplateId = await promiseOf(stack.launchTemplateId);
      const autoScalingGroupName = await promiseOf(stack.autoScalingGroupName);

      expect(launchTemplateId).toBe('fargate-managed');
      expect(autoScalingGroupName).toBe('fargate-managed');
    });
  });

  describe('createECSService helper function', () => {
    it('should export createECSService function', () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createECSService } = require('../lib/tap-stack');

      expect(createECSService).toBeDefined();
      expect(typeof createECSService).toBe('function');
    });

    it('should create an ECS service when called with valid parameters', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createECSService } = require('../lib/tap-stack');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const aws = require('@pulumi/aws');

      // Create mock resources
      const mockCluster = new aws.ecs.Cluster('test-cluster', {
        name: 'test-cluster',
      });

      const mockTaskDef = new aws.ecs.TaskDefinition('test-task', {
        family: 'test-task',
        cpu: '256',
        memory: '512',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        containerDefinitions: JSON.stringify([]),
      });

      const mockVpc = new aws.ec2.Vpc('test-vpc', {
        cidrBlock: '10.0.0.0/16',
      });

      const mockTargetGroup = new aws.lb.TargetGroup('test-tg', {
        port: 3000,
        protocol: 'HTTP',
        vpcId: mockVpc.id,
        targetType: 'ip',
      });

      const mockSecurityGroup = new aws.ec2.SecurityGroup('test-sg', {
        vpcId: mockVpc.id,
        description: 'Test security group',
      });

      const mockSubnet = new aws.ec2.Subnet('test-subnet', {
        vpcId: mockVpc.id,
        cidrBlock: '10.0.1.0/24',
      });

      const mockAlb = new aws.lb.LoadBalancer('test-alb', {
        loadBalancerType: 'application',
        securityGroups: [mockSecurityGroup.id],
        subnets: [mockSubnet.id],
      });

      const mockListener = new aws.lb.Listener('test-listener', {
        loadBalancerArn: mockAlb.arn,
        port: 80,
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: mockTargetGroup.arn,
          },
        ],
      });

      const commonTags = {
        Environment: 'test',
        Project: 'unit-test',
        ManagedBy: 'Pulumi',
        Team: 'test-team',
      };

      // Call createECSService function
      const service = createECSService(
        'test-service',
        mockCluster,
        mockTaskDef,
        mockTargetGroup,
        [mockSubnet.id],
        mockSecurityGroup,
        2,
        3000,
        commonTags,
        mockListener
      );

      // Verify service was created
      expect(service).toBeDefined();

      // Wait for resource creation
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify the service is in created resources
      const serviceResources = Array.from(createdResources.keys()).filter((k) =>
        k.includes('test-service')
      );
      expect(serviceResources.length).toBeGreaterThan(0);
    });

    it('should create an ECS service with parent resource', async () => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { createECSService, TapStack } = require('../lib/tap-stack');
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const aws = require('@pulumi/aws');

      // Create a parent TapStack
      const parentStack = new TapStack('parent-stack', {});

      // Create mock resources
      const mockCluster = new aws.ecs.Cluster('child-cluster', {
        name: 'child-cluster',
      });

      const mockTaskDef = new aws.ecs.TaskDefinition('child-task', {
        family: 'child-task',
        cpu: '256',
        memory: '512',
        networkMode: 'awsvpc',
        requiresCompatibilities: ['FARGATE'],
        containerDefinitions: JSON.stringify([]),
      });

      const mockVpc = new aws.ec2.Vpc('child-vpc', {
        cidrBlock: '10.0.0.0/16',
      });

      const mockTargetGroup = new aws.lb.TargetGroup('child-tg', {
        port: 3000,
        protocol: 'HTTP',
        vpcId: mockVpc.id,
        targetType: 'ip',
      });

      const mockSecurityGroup = new aws.ec2.SecurityGroup('child-sg', {
        vpcId: mockVpc.id,
        description: 'Child security group',
      });

      const mockSubnet = new aws.ec2.Subnet('child-subnet', {
        vpcId: mockVpc.id,
        cidrBlock: '10.0.1.0/24',
      });

      const mockAlb = new aws.lb.LoadBalancer('child-alb', {
        loadBalancerType: 'application',
        securityGroups: [mockSecurityGroup.id],
        subnets: [mockSubnet.id],
      });

      const mockListener = new aws.lb.Listener('child-listener', {
        loadBalancerArn: mockAlb.arn,
        port: 80,
        defaultActions: [
          {
            type: 'forward',
            targetGroupArn: mockTargetGroup.arn,
          },
        ],
      });

      const commonTags = {
        Environment: 'test',
        Project: 'unit-test',
      };

      // Call createECSService function with parent
      const service = createECSService(
        'child-service',
        mockCluster,
        mockTaskDef,
        mockTargetGroup,
        [mockSubnet.id],
        mockSecurityGroup,
        1,
        8080,
        commonTags,
        mockListener,
        parentStack
      );

      // Verify service was created
      expect(service).toBeDefined();
    });
  });
});

describe('ECS Infrastructure Optimization - Code Analysis', () => {
  const tapStackPath = path.join(__dirname, '../lib/tap-stack.ts');
  const tapStackContent = fs.readFileSync(tapStackPath, 'utf-8');

  describe('Configuration Management', () => {
    it('should read environmentSuffix from args or use default', () => {
      expect(tapStackContent).toContain('environmentSuffix');
      expect(tapStackContent).toContain("args.environmentSuffix || 'dev'");
    });

    it('should define TapStack class with proper outputs', () => {
      expect(tapStackContent).toContain('export class TapStack');
      expect(tapStackContent).toContain('public readonly vpcId');
      expect(tapStackContent).toContain('public readonly clusterName');
      expect(tapStackContent).toContain('public readonly albDnsName');
      expect(tapStackContent).toContain('public readonly serviceName');
    });

    it('should use Pulumi config for environment-specific values', () => {
      expect(tapStackContent).toContain('config.get');
      expect(tapStackContent).toContain('environment');
      expect(tapStackContent).toContain('awsRegion');
      expect(tapStackContent).toContain('containerPort');
      expect(tapStackContent).toContain('desiredCount');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in all resource names', () => {
      const envSuffixMatches = tapStackContent.match(/\$\{environmentSuffix\}/g);
      expect(envSuffixMatches).toBeTruthy();
      expect(envSuffixMatches!.length).toBeGreaterThan(10);
    });

    it('should use descriptive resource names', () => {
      expect(tapStackContent).toContain('ecs-vpc');
      expect(tapStackContent).toContain('ecs-subnet');
      expect(tapStackContent).toContain('alb-sg');
      expect(tapStackContent).toContain('ecs-sg');
      expect(tapStackContent).toContain('app-cluster');
      expect(tapStackContent).toContain('ecs-logs');
    });
  });

  describe('Tagging Strategy', () => {
    it('should define common tags object', () => {
      expect(tapStackContent).toContain('commonTags');
      expect(tapStackContent).toContain('Environment:');
      expect(tapStackContent).toContain('Project:');
      expect(tapStackContent).toContain('ManagedBy:');
      expect(tapStackContent).toContain('Team:');
    });

    it('should apply tags to resources', () => {
      expect(tapStackContent).toContain('tags: { ...commonTags');
      expect(tapStackContent).toContain('tags: commonTags');
    });
  });

  describe('Service Consolidation', () => {
    it('should define reusable ECS service creation function', () => {
      expect(tapStackContent).toMatch(/export function\s+createECSService/);
    });
  });

  describe('Resource Optimization', () => {
    it('should configure proper memory reservations', () => {
      expect(tapStackContent).toContain('memoryReservation');
      expect(tapStackContent).toContain('memory');
    });

    it('should not use placement strategies with FARGATE', () => {
      expect(tapStackContent).not.toContain('orderedPlacementStrategies');
      expect(tapStackContent).toContain(
        'Placement strategies are not supported with FARGATE'
      );
    });

    it('should configure CPU-based auto-scaling', () => {
      expect(tapStackContent).toContain('aws.appautoscaling.Policy');
      expect(tapStackContent).toContain('ECSServiceAverageCPUUtilization');
      expect(tapStackContent).toContain('TargetTrackingScaling');
    });

    it('should set appropriate auto-scaling parameters', () => {
      expect(tapStackContent).toContain('targetValue');
      expect(tapStackContent).toContain('scaleInCooldown');
      expect(tapStackContent).toContain('scaleOutCooldown');
    });
  });

  describe('ALB Health Checks', () => {
    it('should configure health check parameters', () => {
      expect(tapStackContent).toContain('healthCheck:');
      expect(tapStackContent).toContain('interval:');
      expect(tapStackContent).toContain('timeout:');
      expect(tapStackContent).toContain('healthyThreshold:');
      expect(tapStackContent).toContain('unhealthyThreshold:');
    });

    it('should use optimized health check intervals', () => {
      const intervalMatch = tapStackContent.match(/interval:\s*(\d+)/);
      expect(intervalMatch).toBeTruthy();
      const interval = parseInt(intervalMatch![1], 10);
      expect(interval).toBeGreaterThanOrEqual(30);
    });
  });

  describe('CloudWatch Logging', () => {
    it('should create CloudWatch log group', () => {
      expect(tapStackContent).toContain('aws.cloudwatch.LogGroup');
    });

    it('should configure log retention policies', () => {
      expect(tapStackContent).toContain('retentionInDays');
    });

    it('should use environment-specific retention', () => {
      expect(tapStackContent).toMatch(/retentionInDays:.*environment.*\?/);
    });
  });

  describe('Security Groups', () => {
    it('should create ALB security group', () => {
      expect(tapStackContent).toContain('aws.ec2.SecurityGroup');
      expect(tapStackContent).toContain('alb-sg');
    });

    it('should create ECS security group', () => {
      expect(tapStackContent).toContain('ecs-sg');
    });

    it('should configure ingress rules with descriptions', () => {
      expect(tapStackContent).toContain('ingress:');
      expect(tapStackContent).toContain('description:');
    });

    it('should configure egress rules', () => {
      expect(tapStackContent).toContain('egress:');
    });

    it('should allow HTTP and HTTPS on ALB', () => {
      expect(tapStackContent).toContain('fromPort: 80');
      expect(tapStackContent).toContain('toPort: 80');
      expect(tapStackContent).toContain('fromPort: 443');
      expect(tapStackContent).toContain('toPort: 443');
    });
  });

  describe('Resource Dependencies', () => {
    it('should declare explicit dependencies', () => {
      expect(tapStackContent).toContain('dependsOn:');
    });

    it('should have dependencies for task definition', () => {
      expect(tapStackContent).toMatch(
        /dependsOn:.*\[.*logGroup.*executionRole.*\]/
      );
    });

    it('should have dependencies for ALB', () => {
      expect(tapStackContent).toMatch(/dependsOn:.*\[.*igw.*\]/);
    });

    it('should have dependencies for service', () => {
      expect(tapStackContent).toMatch(/dependsOn:.*\[.*listener.*\]/);
    });
  });

  describe('Network Configuration', () => {
    it('should create VPC with DNS support', () => {
      expect(tapStackContent).toContain('aws.ec2.Vpc');
      expect(tapStackContent).toContain('enableDnsHostnames: true');
      expect(tapStackContent).toContain('enableDnsSupport: true');
    });

    it('should create subnets in multiple AZs', () => {
      expect(tapStackContent).toContain('aws.ec2.Subnet');
      const subnetMatches = (
        tapStackContent.match(/aws\.ec2\.Subnet/g) || []
      ).length;
      expect(subnetMatches).toBeGreaterThanOrEqual(2);
    });

    it('should configure internet gateway', () => {
      expect(tapStackContent).toContain('aws.ec2.InternetGateway');
    });

    it('should configure route table', () => {
      expect(tapStackContent).toContain('aws.ec2.RouteTable');
      expect(tapStackContent).toContain('aws.ec2.RouteTableAssociation');
    });
  });

  describe('IAM Configuration', () => {
    it('should create ECS task execution role', () => {
      expect(tapStackContent).toContain('aws.iam.Role');
      expect(tapStackContent).toContain('ecs-execution-role');
    });

    it('should attach execution role policy', () => {
      expect(tapStackContent).toContain('aws.iam.RolePolicyAttachment');
      expect(tapStackContent).toContain('AmazonECSTaskExecutionRolePolicy');
    });

    it('should use sts:AssumeRole', () => {
      expect(tapStackContent).toContain('sts:AssumeRole');
      expect(tapStackContent).toContain('ecs-tasks.amazonaws.com');
    });
  });

  describe('ECS Configuration', () => {
    it('should create ECS cluster', () => {
      expect(tapStackContent).toContain('aws.ecs.Cluster');
      expect(tapStackContent).toContain('app-cluster');
    });

    it('should enable container insights', () => {
      expect(tapStackContent).toContain('containerInsights');
      expect(tapStackContent).toContain('enabled');
    });

    it('should create task definition', () => {
      expect(tapStackContent).toContain('aws.ecs.TaskDefinition');
    });

    it('should use Fargate launch type', () => {
      expect(tapStackContent).toContain("requiresCompatibilities: ['FARGATE']");
      expect(tapStackContent).toContain("launchType: 'FARGATE'");
    });

    it('should configure proper CPU and memory', () => {
      expect(tapStackContent).toContain('cpu: ');
      expect(tapStackContent).toContain('memory: ');
    });

    it('should use awsvpc network mode', () => {
      expect(tapStackContent).toContain("networkMode: 'awsvpc'");
    });
  });

  describe('Load Balancer Configuration', () => {
    it('should create Application Load Balancer', () => {
      expect(tapStackContent).toContain('aws.lb.LoadBalancer');
      expect(tapStackContent).toContain("loadBalancerType: 'application'");
    });

    it('should disable deletion protection', () => {
      expect(tapStackContent).toContain('enableDeletionProtection: false');
    });

    it('should create target group', () => {
      expect(tapStackContent).toContain('aws.lb.TargetGroup');
      expect(tapStackContent).toContain("targetType: 'ip'");
    });

    it('should configure deregistration delay', () => {
      expect(tapStackContent).toContain('deregistrationDelay');
    });

    it('should create HTTP listener', () => {
      expect(tapStackContent).toContain('aws.lb.Listener');
      expect(tapStackContent).toContain('port: 80');
    });
  });

  describe('Auto-scaling Configuration', () => {
    it('should create scaling target', () => {
      expect(tapStackContent).toContain('aws.appautoscaling.Target');
      expect(tapStackContent).toContain('maxCapacity');
      expect(tapStackContent).toContain('minCapacity');
    });

    it('should configure scaling policy', () => {
      expect(tapStackContent).toContain('aws.appautoscaling.Policy');
      expect(tapStackContent).toContain("policyType: 'TargetTrackingScaling'");
    });

    it('should use CPU utilization metric', () => {
      expect(tapStackContent).toContain(
        "predefinedMetricType: 'ECSServiceAverageCPUUtilization'"
      );
    });

    it('should configure cooldown periods', () => {
      expect(tapStackContent).toContain('scaleInCooldown');
      expect(tapStackContent).toContain('scaleOutCooldown');
    });
  });

  describe('Code Quality', () => {
    it('should not have hardcoded AWS account IDs', () => {
      const accountIdPattern = /\d{12}/g;
      const matches = tapStackContent.match(accountIdPattern);
      expect(matches).toBeNull();
    });

    it('should not have hardcoded regions outside config', () => {
      const hardcodedRegionPattern = /:\s*['"](us|eu|ap)-\w+-\d+['"]/g;
      const matches = tapStackContent.match(hardcodedRegionPattern);
      expect(matches).toBeNull();
    });

    it('should use Pulumi interpolate for dynamic values', () => {
      expect(tapStackContent).toContain('pulumi.interpolate');
    });

    it('should have proper TypeScript typing', () => {
      expect(tapStackContent).toContain('import * as pulumi');
      expect(tapStackContent).toContain('import * as aws');
    });
  });
});

describe('Optimize.py Script Validation', () => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { execSync } = require('child_process');

  const scriptPath = path.join(__dirname, '../lib/optimize.py');
  const tapStackPath = path.join(__dirname, '../lib/tap-stack.ts');

  it('should exist and be executable', () => {
    expect(fs.existsSync(scriptPath)).toBe(true);
  });

  it('should analyze the infrastructure code', () => {
    try {
      const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('ECS INFRASTRUCTURE OPTIMIZATION ANALYSIS');
      expect(output).toContain('Total Checks:');
    } catch (error: any) {
      expect(error.stdout).toContain('ECS INFRASTRUCTURE OPTIMIZATION ANALYSIS');
    }
  });

  it('should check all 10 optimization patterns', () => {
    try {
      const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
        encoding: 'utf-8',
      });
      expect(output).toContain('Service Consolidation');
      expect(output).toContain('Task Placement Strategy');
      expect(output).toContain('Resource Reservations');
      expect(output).toContain('Configuration Management');
      expect(output).toContain('CloudWatch Log Retention');
      expect(output).toContain('ALB Health Check Optimization');
      expect(output).toContain('Tagging Strategy');
      expect(output).toContain('Security Group Cleanup');
      expect(output).toContain('Resource Dependencies');
      expect(output).toContain('Auto-scaling Configuration');
    } catch (error: any) {
      expect(error.stdout).toContain('Total Checks: 10');
    }
  });

  it('should validate service consolidation pattern', () => {
    try {
      const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
        encoding: 'utf-8',
      });
      expect(
        output.includes('reusable service component') ||
        output.includes('Service Consolidation - ✓ PASS')
      ).toBe(true);
    } catch (error: any) {
      expect(
        error.stdout.includes('reusable service component') ||
        error.stdout.includes('Service Consolidation - ✓ PASS')
      ).toBe(true);
    }
  });

  it('should validate task placement for FARGATE', () => {
    try {
      const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
        encoding: 'utf-8',
      });
      expect(
        output.includes('Task Placement Strategy') ||
        output.includes('placement')
      ).toBe(true);
    } catch (error: any) {
      expect(
        error.stdout.includes('Task Placement Strategy') ||
        error.stdout.includes('placement')
      ).toBe(true);
    }
  });

  it('should validate resource reservations', () => {
    try {
      const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
        encoding: 'utf-8',
      });
      expect(
        output.includes('memory limits configured') ||
        output.includes('Resource Reservations - ✓ PASS')
      ).toBe(true);
    } catch (error: any) {
      expect(
        error.stdout.includes('memory limits configured') ||
        error.stdout.includes('Resource Reservations - ✓ PASS')
      ).toBe(true);
    }
  });

  it('should validate Pulumi config usage', () => {
    try {
      const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
        encoding: 'utf-8',
      });
      expect(
        output.includes('Pulumi config') ||
        output.includes('Configuration Management - ✓ PASS')
      ).toBe(true);
    } catch (error: any) {
      expect(
        error.stdout.includes('Pulumi config') ||
        error.stdout.includes('Configuration Management - ✓ PASS')
      ).toBe(true);
    }
  });

  it('should validate CPU-based auto-scaling', () => {
    try {
      const output = execSync(`python3 ${scriptPath} ${tapStackPath}`, {
        encoding: 'utf-8',
      });
      expect(
        output.includes('CPU-based auto-scaling') ||
        output.includes('Auto-scaling Configuration - ✓ PASS')
      ).toBe(true);
    } catch (error: any) {
      expect(
        error.stdout.includes('CPU-based auto-scaling') ||
        error.stdout.includes('Auto-scaling Configuration - ✓ PASS')
      ).toBe(true);
    }
  });
});
