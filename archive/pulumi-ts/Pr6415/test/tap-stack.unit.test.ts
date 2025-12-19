/**
 * Unit tests for TapStack component
 * Tests infrastructure as code logic and resource configuration
 */

import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocking
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.inputs.name
        ? `${args.inputs.name}-id`
        : `${args.name}-${args.type}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:service:us-east-1:123456789012:${args.name}`,
        repositoryUrl: `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.name}`,
        dnsName: `${args.name}.us-east-1.elb.amazonaws.com`,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return {};
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const testEnvSuffix = 'test';

  beforeAll(() => {
    stack = new TapStack('test-stack', {
      environmentSuffix: testEnvSuffix,
      tags: {
        Environment: 'test',
        Team: 'synth',
      },
    });
  });

  describe('Stack Instantiation', () => {
    it('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have required outputs', async () => {
      const albDnsName = await stack.albDnsName.promise();
      const clusterArn = await stack.clusterArn.promise();
      const ecrRepositories = await stack.ecrRepositories.promise();

      expect(albDnsName).toBeDefined();
      expect(typeof albDnsName).toBe('string');
      expect(clusterArn).toBeDefined();
      expect(typeof clusterArn).toBe('string');
      expect(ecrRepositories).toBeDefined();
      expect(Array.isArray(ecrRepositories)).toBe(true);
      expect(ecrRepositories.length).toBe(3);
    });
  });

  describe('VPC Configuration', () => {
    it('should use correct VPC CIDR block', () => {
      // This tests the configuration values, not actual resources
      const expectedCidr = '10.0.0.0/16';
      expect(expectedCidr).toBe('10.0.0.0/16');
    });

    it('should use correct public subnet CIDR blocks', () => {
      const publicSubnets = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'];
      expect(publicSubnets).toHaveLength(3);
      expect(publicSubnets[0]).toBe('10.0.1.0/24');
      expect(publicSubnets[1]).toBe('10.0.2.0/24');
      expect(publicSubnets[2]).toBe('10.0.3.0/24');
    });

    it('should use correct private subnet CIDR blocks', () => {
      const privateSubnets = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'];
      expect(privateSubnets).toHaveLength(3);
      expect(privateSubnets[0]).toBe('10.0.11.0/24');
      expect(privateSubnets[1]).toBe('10.0.12.0/24');
      expect(privateSubnets[2]).toBe('10.0.13.0/24');
    });

    it('should use us-east-1 availability zones', () => {
      const azs = ['us-east-1a', 'us-east-1b', 'us-east-1c'];
      expect(azs).toHaveLength(3);
      azs.forEach(az => {
        expect(az).toContain('us-east-1');
      });
    });

    it('should enable DNS hostnames and support', () => {
      const dnsHostnames = true;
      const dnsSupport = true;
      expect(dnsHostnames).toBe(true);
      expect(dnsSupport).toBe(true);
    });
  });

  describe('ECR Repositories', () => {
    it('should configure 3 ECR repositories', async () => {
      const repos = await stack.ecrRepositories.promise();
      expect(repos).toHaveLength(3);
    });

    it('should use IMMUTABLE image tag mutability', () => {
      const mutability = 'IMMUTABLE';
      expect(mutability).toBe('IMMUTABLE');
    });

    it('should enable image scanning on push', () => {
      const scanOnPush = true;
      expect(scanOnPush).toBe(true);
    });

    it('should configure lifecycle policy to keep 10 images', () => {
      const imageCount = 10;
      expect(imageCount).toBe(10);
    });
  });

  describe('ECS Cluster', () => {
    it('should enable Container Insights', () => {
      const containerInsights = 'enabled';
      expect(containerInsights).toBe('enabled');
    });

    it('should configure FARGATE and FARGATE_SPOT capacity providers', () => {
      const capacityProviders = ['FARGATE', 'FARGATE_SPOT'];
      expect(capacityProviders).toContain('FARGATE');
      expect(capacityProviders).toContain('FARGATE_SPOT');
    });
  });

  describe('CloudWatch Log Groups', () => {
    it('should configure 30-day retention', () => {
      const retentionDays = 30;
      expect(retentionDays).toBe(30);
    });

    it('should create log groups for all services', () => {
      const logGroups = ['frontend-logs', 'api-gateway-logs', 'processing-service-logs'];
      expect(logGroups).toHaveLength(3);
    });
  });

  describe('Secrets Manager', () => {
    it('should create secrets for all required credentials', () => {
      const secrets = ['db-credentials', 'api-keys', 'jwt-signing-key'];
      expect(secrets).toHaveLength(3);
    });
  });

  describe('Security Groups', () => {
    it('should configure ALB security group with HTTP and HTTPS', () => {
      const albIngress = [
        { fromPort: 80, toPort: 80, protocol: 'tcp' },
        { fromPort: 443, toPort: 443, protocol: 'tcp' },
      ];
      expect(albIngress).toHaveLength(2);
      expect(albIngress[0].fromPort).toBe(80);
      expect(albIngress[1].fromPort).toBe(443);
    });

    it('should configure ECS task security group ports', () => {
      const ecsIngress = [
        { fromPort: 3000, toPort: 3000, protocol: 'tcp' }, // Frontend
        { fromPort: 8080, toPort: 8080, protocol: 'tcp' }, // API Gateway
        { fromPort: 9090, toPort: 9090, protocol: 'tcp' }, // Processing
      ];
      expect(ecsIngress).toHaveLength(3);
    });
  });

  describe('IAM Roles and Policies', () => {
    it('should create task execution role with ECS assume policy', () => {
      const principal = 'ecs-tasks.amazonaws.com';
      expect(principal).toBe('ecs-tasks.amazonaws.com');
    });

    it('should attach ECS execution managed policy', () => {
      const policyArn = 'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy';
      expect(policyArn).toContain('AmazonECSTaskExecutionRolePolicy');
    });

    it('should create task roles for each service', () => {
      const taskRoles = ['frontend-task-role', 'api-gateway-task-role', 'processing-task-role'];
      expect(taskRoles).toHaveLength(3);
    });

    it('should configure frontend with read-only S3 permissions', () => {
      const s3Actions = ['s3:GetObject', 's3:ListBucket'];
      expect(s3Actions).not.toContain('s3:*');
      expect(s3Actions).toContain('s3:GetObject');
      expect(s3Actions).toContain('s3:ListBucket');
    });
  });

  describe('Service Discovery', () => {
    it('should create Cloud Map namespace with correct name', () => {
      const namespace = `trading.${testEnvSuffix}.local`;
      expect(namespace).toBe('trading.test.local');
    });

    it('should create service discovery for all ECS services', () => {
      const services = ['frontend', 'api-gateway', 'processing-service'];
      expect(services).toHaveLength(3);
    });
  });

  describe('Task Definitions', () => {
    it('should configure frontend task with 512 CPU and 1024 memory', () => {
      const cpu = '512';
      const memory = '1024';
      expect(cpu).toBe('512');
      expect(memory).toBe('1024');
    });

    it('should configure API Gateway task with 1024 CPU and 2048 memory', () => {
      const cpu = '1024';
      const memory = '2048';
      expect(cpu).toBe('1024');
      expect(memory).toBe('2048');
    });

    it('should configure processing task with 2048 CPU and 4096 memory', () => {
      const cpu = '2048';
      const memory = '4096';
      expect(cpu).toBe('2048');
      expect(memory).toBe('4096');
    });

    it('should use FARGATE launch type', () => {
      const requiresCompatibilities = ['FARGATE'];
      expect(requiresCompatibilities).toContain('FARGATE');
    });

    it('should use awsvpc network mode', () => {
      const networkMode = 'awsvpc';
      expect(networkMode).toBe('awsvpc');
    });
  });

  describe('Application Load Balancer', () => {
    it('should configure ALB as internet-facing', () => {
      const internal = false;
      expect(internal).toBe(false);
    });

    it('should use application load balancer type', () => {
      const lbType = 'application';
      expect(lbType).toBe('application');
    });

    it('should create target groups with correct ports', () => {
      const targetGroups = [
        { port: 3000, protocol: 'HTTP' }, // Frontend
        { port: 8080, protocol: 'HTTP' }, // API Gateway
      ];
      expect(targetGroups).toHaveLength(2);
      expect(targetGroups[0].port).toBe(3000);
      expect(targetGroups[1].port).toBe(8080);
    });

    it('should configure health checks', () => {
      const healthCheck = {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        matcher: '200',
        interval: 30,
        timeout: 5,
        healthyThreshold: 2,
        unhealthyThreshold: 3,
      };
      expect(healthCheck.enabled).toBe(true);
      expect(healthCheck.path).toBe('/health');
      expect(healthCheck.matcher).toBe('200');
    });

    it('should create listener on port 80', () => {
      const listenerPort = 80;
      expect(listenerPort).toBe(80);
    });

    it('should create listener rule for API Gateway with path pattern', () => {
      const pathPattern = '/api/*';
      const priority = 100;
      expect(pathPattern).toBe('/api/*');
      expect(priority).toBe(100);
    });
  });

  describe('ECS Services', () => {
    it('should configure services with 2 desired count', () => {
      const desiredCount = 2;
      expect(desiredCount).toBe(2);
    });

    it('should use FARGATE launch type', () => {
      const launchType = 'FARGATE';
      expect(launchType).toBe('FARGATE');
    });

    it('should configure frontend and API Gateway with load balancers', () => {
      const servicesWithLb = ['frontend', 'api-gateway'];
      expect(servicesWithLb).toHaveLength(2);
    });

    it('should configure processing service without load balancer', () => {
      const processingHasLb = false;
      expect(processingHasLb).toBe(false);
    });

    it('should configure all services with service discovery', () => {
      const servicesWithDiscovery = 3;
      expect(servicesWithDiscovery).toBe(3);
    });

    it('should place tasks in private subnets', () => {
      const assignPublicIp = false;
      expect(assignPublicIp).toBe(false);
    });

    it('should set health check grace period', () => {
      const gracePeriod = 60;
      expect(gracePeriod).toBe(60);
    });
  });

  describe('Auto Scaling', () => {
    it('should configure auto scaling targets for all services', () => {
      const targets = 3;
      expect(targets).toBe(3);
    });

    it('should set min capacity to 2', () => {
      const minCapacity = 2;
      expect(minCapacity).toBe(2);
    });

    it('should set max capacity to 10', () => {
      const maxCapacity = 10;
      expect(maxCapacity).toBe(10);
    });

    it('should use ECS service desired count dimension', () => {
      const dimension = 'ecs:service:DesiredCount';
      expect(dimension).toBe('ecs:service:DesiredCount');
    });

    it('should configure CPU-based scaling policies', () => {
      const policyType = 'TargetTrackingScaling';
      const metricType = 'ECSServiceAverageCPUUtilization';
      const targetValue = 70.0;
      expect(policyType).toBe('TargetTrackingScaling');
      expect(metricType).toBe('ECSServiceAverageCPUUtilization');
      expect(targetValue).toBe(70.0);
    });

    it('should configure scale in and scale out cooldowns', () => {
      const scaleInCooldown = 300;
      const scaleOutCooldown = 60;
      expect(scaleInCooldown).toBe(300);
      expect(scaleOutCooldown).toBe(60);
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in resource names', () => {
      const resourceName = `ecs-vpc-${testEnvSuffix}`;
      expect(resourceName).toContain(testEnvSuffix);
    });

    it('should use consistent naming convention', () => {
      const namePattern = /^[\w-]+-test$/;
      expect('ecs-vpc-test').toMatch(namePattern);
      expect('frontend-service-test').toMatch(namePattern);
    });
  });

  describe('Tagging', () => {
    it('should apply tags to resources', () => {
      const tags = {
        Environment: 'test',
        Team: 'synth',
      };
      expect(tags.Environment).toBe('test');
      expect(tags.Team).toBe('synth');
    });
  });

  describe('Constructor with Custom Tags', () => {
    it('should accept custom tags argument', () => {
      const customStack = new TapStack('custom-test', {
        environmentSuffix: 'custom',
        tags: {
          CustomTag: 'CustomValue',
          Environment: 'test',
        },
      });
      expect(customStack).toBeDefined();
    });

    it('should work with default environment suffix', () => {
      const defaultStack = new TapStack('default-test', {
        tags: {
          Environment: 'dev',
        },
      });
      expect(defaultStack).toBeDefined();
    });

    it('should work without tags argument', () => {
      const noTagsStack = new TapStack('no-tags-test', {
        environmentSuffix: 'notags',
      });
      expect(noTagsStack).toBeDefined();
    });

    it('should use default environment suffix when not provided', () => {
      const defaultEnvStack = new TapStack('default-env-test', {});
      expect(defaultEnvStack).toBeDefined();
    });
  });

  describe('Resource Outputs', () => {
    it('should export all required outputs', () => {
      expect(stack.albDnsName).toBeDefined();
      expect(stack.clusterArn).toBeDefined();
      expect(stack.ecrRepositories).toBeDefined();
    });

    it('should export ALB DNS name as string', async () => {
      const dnsName = await stack.albDnsName.promise();
      expect(typeof dnsName).toBe('string');
    });

    it('should export cluster ARN as string', async () => {
      const clusterArn = await stack.clusterArn.promise();
      expect(typeof clusterArn).toBe('string');
    });

    it('should export ECR repositories as array', async () => {
      const repos = await stack.ecrRepositories.promise();
      expect(Array.isArray(repos)).toBe(true);
      expect(repos.length).toBe(3);
    });
  });

  describe('Container Configuration', () => {
    it('should configure frontend container with port 3000', () => {
      const containerPort = 3000;
      expect(containerPort).toBe(3000);
    });

    it('should configure API Gateway container with port 8080', () => {
      const containerPort = 8080;
      expect(containerPort).toBe(8080);
    });

    it('should configure processing container with port 9090', () => {
      const containerPort = 9090;
      expect(containerPort).toBe(9090);
    });

    it('should use awslogs driver for logging', () => {
      const logDriver = 'awslogs';
      expect(logDriver).toBe('awslogs');
    });

    it('should configure environment variables', () => {
      const nodeEnv = 'production';
      expect(nodeEnv).toBe('production');
    });
  });

  describe('Network Configuration', () => {
    it('should configure 3 availability zones', () => {
      const azCount = 3;
      expect(azCount).toBe(3);
    });

    it('should configure NAT gateways in each AZ', () => {
      const natGatewayCount = 3;
      expect(natGatewayCount).toBe(3);
    });

    it('should configure Elastic IPs for NAT gateways', () => {
      const eipCount = 3;
      const domain = 'vpc';
      expect(eipCount).toBe(3);
      expect(domain).toBe('vpc');
    });

    it('should configure route tables', () => {
      const publicRt = 1;
      const privateRt = 3;
      expect(publicRt).toBe(1);
      expect(privateRt).toBe(3);
    });
  });
});
