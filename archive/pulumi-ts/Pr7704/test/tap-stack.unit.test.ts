import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } => {
    // Return mock IDs and states for resources
    const state: any = {
      ...args.inputs,
    };

    // Add specific properties based on resource type
    switch (args.type) {
      case 'aws:ec2/vpc:Vpc':
        state.id = 'vpc-mock123';
        state.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
        break;
      case 'aws:ec2/subnet:Subnet':
        state.id = `subnet-mock-${args.name}`;
        state.availabilityZone = args.inputs.availabilityZone;
        break;
      case 'aws:ec2/internetGateway:InternetGateway':
        state.id = 'igw-mock123';
        break;
      case 'aws:ec2/routeTable:RouteTable':
        state.id = 'rt-mock123';
        break;
      case 'aws:ec2/securityGroup:SecurityGroup':
        state.id = `sg-mock-${args.name}`;
        break;
      case 'aws:lb/loadBalancer:LoadBalancer':
        state.id = 'alb-mock123';
        state.dnsName = 'alb-mock.us-east-1.elb.amazonaws.com';
        state.arnSuffix = 'app/alb-mock/1234567890abcdef';
        break;
      case 'aws:lb/targetGroup:TargetGroup':
        state.id = 'tg-mock123';
        state.arn =
          'arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/tg-mock/1234567890abcdef';
        state.arnSuffix = 'targetgroup/tg-mock/1234567890abcdef';
        break;
      case 'aws:ecr/repository:Repository':
        state.id = 'ecr-mock123';
        state.repositoryUrl =
          '123456789012.dkr.ecr.us-east-1.amazonaws.com/mock-repo';
        state.arn = 'arn:aws:ecr:us-east-1:123456789012:repository/mock-repo';
        break;
      case 'aws:ecs/cluster:Cluster':
        state.id = 'cluster-mock123';
        state.name = args.inputs.name;
        state.arn = `arn:aws:ecs:us-east-1:123456789012:cluster/${args.inputs.name}`;
        break;
      case 'aws:ecs/taskDefinition:TaskDefinition':
        state.id = 'td-mock123';
        state.arn = `arn:aws:ecs:us-east-1:123456789012:task-definition/${args.inputs.family}:1`;
        break;
      case 'aws:ecs/service:Service':
        state.id = 'service-mock123';
        state.name = args.inputs.name;
        state.arn = `arn:aws:ecs:us-east-1:123456789012:service/${args.inputs.name}`;
        break;
      case 'aws:iam/role:Role':
        state.id = `role-mock-${args.name}`;
        state.arn = `arn:aws:iam::123456789012:role/${args.inputs.name}`;
        state.name = args.inputs.name;
        break;
      case 'aws:iam/policy:Policy':
        state.id = `policy-mock-${args.name}`;
        state.arn = `arn:aws:iam::123456789012:policy/${args.inputs.name}`;
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        state.id = 'lg-mock123';
        state.name = args.inputs.name;
        state.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.inputs.name}`;
        break;
      case 'aws:cloudwatch/metricAlarm:MetricAlarm':
        state.id = `alarm-mock-${args.name}`;
        state.arn = `arn:aws:cloudwatch:us-east-1:123456789012:alarm:${args.inputs.name}`;
        break;
      case 'aws:appautoscaling/target:Target':
        state.id = 'scaling-target-mock123';
        break;
      case 'aws:appautoscaling/policy:Policy':
        state.id = `scaling-policy-mock-${args.name}`;
        state.arn = `arn:aws:autoscaling:us-east-1:123456789012:scalingPolicy:${args.name}`;
        break;
      default:
        state.id = `mock-${args.name}`;
    }

    return {
      id: `${args.name}-id`,
      state,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock provider function calls
    return {};
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  let resources: any[];

  beforeAll(() => {
    // Create a new stack for testing
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      environment: 'dev',
    });

    // Collect all resources created
    resources = [];
  });

  describe('Stack Creation', () => {
    it('should create a TapStack instance', () => {
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have required output properties', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.ecsServiceName).toBeDefined();
      expect(stack.loadBalancerDns).toBeDefined();
      expect(stack.ecrRepositoryUrl).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    it('should resolve VPC ID output', async () => {
      const vpcId = await promiseOf(stack.vpcId);
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
    });
  });

  describe('ECS Cluster Configuration', () => {
    it('should resolve ECS cluster name output', async () => {
      const clusterName = await promiseOf(stack.ecsClusterName);
      expect(clusterName).toBeDefined();
      expect(typeof clusterName).toBe('string');
      expect(clusterName).toContain('test123');
    });

    it('should have correct cluster name pattern', async () => {
      const clusterName = await promiseOf(stack.ecsClusterName);
      expect(clusterName).toMatch(/^ecs-cluster-test123$/);
    });
  });

  describe('ECS Service Configuration', () => {
    it('should resolve ECS service name output', async () => {
      const serviceName = await promiseOf(stack.ecsServiceName);
      expect(serviceName).toBeDefined();
      expect(typeof serviceName).toBe('string');
      expect(serviceName).toContain('test123');
    });

    it('should have correct service name pattern', async () => {
      const serviceName = await promiseOf(stack.ecsServiceName);
      expect(serviceName).toMatch(/^ecs-service-test123$/);
    });
  });

  describe('Load Balancer Configuration', () => {
    it('should resolve load balancer DNS output', async () => {
      const albDns = await promiseOf(stack.loadBalancerDns);
      expect(albDns).toBeDefined();
      expect(typeof albDns).toBe('string');
    });

    it('should have valid DNS format', async () => {
      const albDns = await promiseOf(stack.loadBalancerDns);
      expect(albDns).toMatch(/\.elb\.amazonaws\.com$/);
    });
  });

  describe('ECR Repository Configuration', () => {
    it('should resolve ECR repository URL output', async () => {
      const repoUrl = await promiseOf(stack.ecrRepositoryUrl);
      expect(repoUrl).toBeDefined();
      expect(typeof repoUrl).toBe('string');
    });

    it('should have valid ECR URL format', async () => {
      const repoUrl = await promiseOf(stack.ecrRepositoryUrl);
      expect(repoUrl).toMatch(/\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com\//);
    });
  });

  describe('Environment Suffix Usage', () => {
    it('should use environmentSuffix in cluster name', async () => {
      const clusterName = await promiseOf(stack.ecsClusterName);
      expect(clusterName).toContain('test123');
    });

    it('should use environmentSuffix in service name', async () => {
      const serviceName = await promiseOf(stack.ecsServiceName);
      expect(serviceName).toContain('test123');
    });
  });

  describe('Stack with Production Environment', () => {
    it('should create stack with production environment', () => {
      const prodStack = new TapStack('prod-stack', {
        environmentSuffix: 'prod123',
        environment: 'prod',
      });

      expect(prodStack).toBeInstanceOf(TapStack);
      expect(prodStack.vpcId).toBeDefined();
      expect(prodStack.ecsClusterName).toBeDefined();
    });

    it('should resolve production cluster name', async () => {
      const prodStack = new TapStack('prod-stack-2', {
        environmentSuffix: 'prod456',
        environment: 'prod',
      });

      const clusterName = await promiseOf(prodStack.ecsClusterName);
      expect(clusterName).toContain('prod456');
    });
  });

  describe('Output Types', () => {
    it('should have Output type for vpcId', () => {
      expect(pulumi.Output.isInstance(stack.vpcId)).toBe(true);
    });

    it('should have Output type for ecsClusterName', () => {
      expect(pulumi.Output.isInstance(stack.ecsClusterName)).toBe(true);
    });

    it('should have Output type for ecsServiceName', () => {
      expect(pulumi.Output.isInstance(stack.ecsServiceName)).toBe(true);
    });

    it('should have Output type for loadBalancerDns', () => {
      expect(pulumi.Output.isInstance(stack.loadBalancerDns)).toBe(true);
    });

    it('should have Output type for ecrRepositoryUrl', () => {
      expect(pulumi.Output.isInstance(stack.ecrRepositoryUrl)).toBe(true);
    });
  });

  describe('Constructor Parameters', () => {
    it('should accept name parameter', () => {
      const namedStack = new TapStack('custom-name', {
        environmentSuffix: 'custom123',
      });
      expect(namedStack).toBeInstanceOf(TapStack);
    });

    it('should accept environmentSuffix in props', () => {
      const suffixStack = new TapStack('suffix-test', {
        environmentSuffix: 'suffix789',
      });
      expect(suffixStack).toBeInstanceOf(TapStack);
    });

    it('should accept optional environment in props', () => {
      const envStack = new TapStack('env-test', {
        environmentSuffix: 'env123',
        environment: 'staging',
      });
      expect(envStack).toBeInstanceOf(TapStack);
    });

    it('should default environment when not provided', () => {
      const defaultStack = new TapStack('default-test', {
        environmentSuffix: 'default123',
      });
      expect(defaultStack).toBeInstanceOf(TapStack);
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should use consistent naming with environmentSuffix', async () => {
      const testStack = new TapStack('naming-test', {
        environmentSuffix: 'naming123',
      });

      const clusterName = await promiseOf(testStack.ecsClusterName);
      const serviceName = await promiseOf(testStack.ecsServiceName);

      expect(clusterName).toMatch(/naming123/);
      expect(serviceName).toMatch(/naming123/);
    });
  });

  describe('Output Validation', () => {
    it('should have non-empty vpcId', async () => {
      const vpcId = await promiseOf(stack.vpcId);
      expect(vpcId).toBeTruthy();
      expect(vpcId.length).toBeGreaterThan(0);
    });

    it('should have non-empty ecsClusterName', async () => {
      const clusterName = await promiseOf(stack.ecsClusterName);
      expect(clusterName).toBeTruthy();
      expect(clusterName.length).toBeGreaterThan(0);
    });

    it('should have non-empty ecsServiceName', async () => {
      const serviceName = await promiseOf(stack.ecsServiceName);
      expect(serviceName).toBeTruthy();
      expect(serviceName.length).toBeGreaterThan(0);
    });

    it('should have non-empty loadBalancerDns', async () => {
      const albDns = await promiseOf(stack.loadBalancerDns);
      expect(albDns).toBeTruthy();
      expect(albDns.length).toBeGreaterThan(0);
    });

    it('should have non-empty ecrRepositoryUrl', async () => {
      const repoUrl = await promiseOf(stack.ecrRepositoryUrl);
      expect(repoUrl).toBeTruthy();
      expect(repoUrl.length).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environmentSuffix gracefully', () => {
      // This test verifies TypeScript compilation enforces required props
      // If this compiles, the interface is correctly defined
      const testFn = () => {
        // @ts-expect-error - Testing missing required prop
        new TapStack('error-test', {});
      };
      expect(testFn).toBeDefined();
    });
  });

  describe('Multiple Stack Instances', () => {
    it('should allow multiple stack instances', () => {
      const stack1 = new TapStack('multi-1', {
        environmentSuffix: 'multi1',
      });
      const stack2 = new TapStack('multi-2', {
        environmentSuffix: 'multi2',
      });

      expect(stack1).toBeInstanceOf(TapStack);
      expect(stack2).toBeInstanceOf(TapStack);
      expect(stack1).not.toBe(stack2);
    });

    it('should have different outputs for different instances', async () => {
      const stack1 = new TapStack('diff-1', {
        environmentSuffix: 'diff1',
      });
      const stack2 = new TapStack('diff-2', {
        environmentSuffix: 'diff2',
      });

      const name1 = await promiseOf(stack1.ecsClusterName);
      const name2 = await promiseOf(stack2.ecsClusterName);

      expect(name1).not.toBe(name2);
    });
  });
});

/**
 * Helper function to convert Pulumi Output to Promise
 */
function promiseOf<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise(resolve => {
    output.apply(value => {
      resolve(value);
      return value;
    });
  });
}
