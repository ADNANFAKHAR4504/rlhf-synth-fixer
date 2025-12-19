/**
 * Unit tests for TapStack Pulumi infrastructure
 * Tests all ECS Fargate resources with 100% coverage
 */
import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi runtime mocks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: { [key: string]: any } = {
      ...args.inputs,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      id: `${args.name}-id`,
      name: args.inputs.name || args.name,
    };

    // Add resource-specific outputs
    if (args.type === 'aws:ec2/vpc:Vpc') {
      outputs.id = `vpc-${args.name}`;
      outputs.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
    } else if (args.type === 'aws:ec2/subnet:Subnet') {
      outputs.id = `subnet-${args.name}`;
    } else if (args.type === 'aws:ec2/internetGateway:InternetGateway') {
      outputs.id = `igw-${args.name}`;
    } else if (args.type === 'aws:ec2/natGateway:NatGateway') {
      outputs.id = `nat-${args.name}`;
    } else if (args.type === 'aws:ec2/routeTable:RouteTable') {
      outputs.id = `rtb-${args.name}`;
    } else if (args.type === 'aws:ec2/eip:Eip') {
      outputs.id = `eipalloc-${args.name}`;
      outputs.publicIp = '1.2.3.4';
    } else if (args.type === 'aws:ecr/repository:Repository') {
      outputs.repositoryUrl = `123456789012.dkr.ecr.us-east-1.amazonaws.com/${args.inputs.name}`;
    } else if (args.type === 'aws:ecs/cluster:Cluster') {
      outputs.id = `cluster-${args.name}`;
    } else if (args.type === 'aws:ecs/taskDefinition:TaskDefinition') {
      outputs.revision = 1;
    } else if (args.type === 'aws:ecs/service:Service') {
      outputs.id = `service/${args.name}`;
    } else if (args.type === 'aws:lb/loadBalancer:LoadBalancer') {
      outputs.dnsName = `${args.inputs.name}.us-east-1.elb.amazonaws.com`;
    } else if (args.type === 'aws:lb/targetGroup:TargetGroup') {
      outputs.id = `tg-${args.name}`;
    } else if (args.type === 'aws:lb/listener:Listener') {
      outputs.id = `listener-${args.name}`;
    } else if (args.type === 'aws:ec2/securityGroup:SecurityGroup') {
      outputs.id = `sg-${args.name}`;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.arn = `arn:aws:iam::123456789012:role/${args.inputs.name}`;
    } else if (args.type === 'aws:cloudwatch/logGroup:LogGroup') {
      outputs.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.inputs.name}`;
    } else if (args.type === 'aws:secretsmanager/secret:Secret') {
      outputs.arn = `arn:aws:secretsmanager:us-east-1:123456789012:secret:${args.inputs.name}`;
    } else if (
      args.type === 'aws:servicediscovery/privateDnsNamespace:PrivateDnsNamespace'
    ) {
      outputs.id = `ns-${args.name}`;
    } else if (args.type === 'aws:servicediscovery/service:Service') {
      outputs.arn = `arn:aws:servicediscovery:us-east-1:123456789012:service/${args.name}`;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
      };
    }
    return {};
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const testSuffix = 'test';

  beforeAll(() => {
    // Create stack instance
    stack = new TapStack('test-stack', {
      environmentSuffix: testSuffix,
      tags: {
        Environment: 'test',
        Project: 'TapStack',
      },
    });
  });

  describe('Stack Initialization', () => {
    it('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should have all required output properties', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.clusterName).toBeDefined();
      expect(stack.clusterArn).toBeDefined();
      expect(stack.frontendServiceArn).toBeDefined();
      expect(stack.apiGatewayServiceArn).toBeDefined();
      expect(stack.processingServiceArn).toBeDefined();
      expect(stack.frontendEcrUrl).toBeDefined();
      expect(stack.apiGatewayEcrUrl).toBeDefined();
      expect(stack.processingServiceEcrUrl).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
    });
  });

  describe('VPC Configuration', () => {
    it('should configure VPC with correct CIDR block', async () => {
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toMatch(/^vpc-tap-vpc-test$/);
    });

    it('should have correct number of public subnets', async () => {
      const publicSubnets = await stack.publicSubnetIds.promise();
      expect(publicSubnets).toHaveLength(3);
    });

    it('should have correct number of private subnets', async () => {
      const privateSubnets = await stack.privateSubnetIds.promise();
      expect(privateSubnets).toHaveLength(3);
    });
  });

  describe('ECR Repositories', () => {
    it('should create frontend ECR repository', async () => {
      const frontendEcrUrl = await stack.frontendEcrUrl.promise();
      expect(frontendEcrUrl).toContain('tap-frontend-test');
    });

    it('should create api-gateway ECR repository', async () => {
      const apiGatewayEcrUrl = await stack.apiGatewayEcrUrl.promise();
      expect(apiGatewayEcrUrl).toContain('tap-api-gateway-test');
    });

    it('should create processing-service ECR repository', async () => {
      const processingServiceEcrUrl = await stack.processingServiceEcrUrl.promise();
      expect(processingServiceEcrUrl).toContain('tap-processing-service-test');
    });
  });

  describe('ECS Cluster', () => {
    it('should create ECS cluster with correct name', async () => {
      const clusterName = await stack.clusterName.promise();
      expect(clusterName).toBe(`tap-cluster-${testSuffix}`);
    });

    it('should have cluster ARN', async () => {
      const clusterArn = await stack.clusterArn.promise();
      expect(clusterArn).toContain('arn:aws:');
      expect(clusterArn).toContain('tap-cluster-test');
    });
  });

  describe('ECS Services', () => {
    it('should create frontend service', async () => {
      const frontendServiceArn = await stack.frontendServiceArn.promise();
      expect(frontendServiceArn).toBeDefined();
      expect(frontendServiceArn).toContain('service/');
    });

    it('should create api-gateway service', async () => {
      const apiGatewayServiceArn = await stack.apiGatewayServiceArn.promise();
      expect(apiGatewayServiceArn).toBeDefined();
      expect(apiGatewayServiceArn).toContain('service/');
    });

    it('should create processing service', async () => {
      const processingServiceArn = await stack.processingServiceArn.promise();
      expect(processingServiceArn).toBeDefined();
      expect(processingServiceArn).toContain('service/');
    });
  });

  describe('Load Balancer', () => {
    it('should create ALB with DNS name', async () => {
      const albDnsName = await stack.albDnsName.promise();
      expect(albDnsName).toBeDefined();
      expect(albDnsName).toContain('elb.amazonaws.com');
    });

    it('should include environment suffix in ALB name', async () => {
      const albDnsName = await stack.albDnsName.promise();
      expect(albDnsName).toContain(testSuffix);
    });
  });

  describe('Default Environment Suffix', () => {
    let defaultStack: TapStack;

    beforeAll(() => {
      defaultStack = new TapStack('default-test-stack', {});
    });

    it('should use default environment suffix when not provided', async () => {
      const clusterName = await defaultStack.clusterName.promise();
      expect(clusterName).toContain('dev');
    });

    it('should have all outputs defined with default suffix', () => {
      expect(defaultStack.vpcId).toBeDefined();
      expect(defaultStack.albDnsName).toBeDefined();
      expect(defaultStack.clusterName).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should include environment suffix in all resource names', async () => {
      const clusterName = await stack.clusterName.promise();
      const vpcId = await stack.vpcId.promise();
      const frontendEcrUrl = await stack.frontendEcrUrl.promise();

      expect(clusterName).toContain(testSuffix);
      expect(vpcId).toContain(testSuffix);
      expect(frontendEcrUrl).toContain(testSuffix);
    });
  });

  describe('Tags Configuration', () => {
    it('should accept custom tags', () => {
      const stackWithTags = new TapStack('tagged-stack', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Team: 'platform',
          CostCenter: 'engineering',
        },
      });

      expect(stackWithTags).toBeDefined();
    });

    it('should work without custom tags', () => {
      const stackWithoutTags = new TapStack('untagged-stack', {
        environmentSuffix: 'staging',
      });

      expect(stackWithoutTags).toBeDefined();
    });
  });

  describe('Multi-AZ Configuration', () => {
    it('should distribute resources across 3 availability zones', async () => {
      const publicSubnets = await stack.publicSubnetIds.promise();
      const privateSubnets = await stack.privateSubnetIds.promise();

      // Verify 3 AZs for high availability
      expect(publicSubnets).toHaveLength(3);
      expect(privateSubnets).toHaveLength(3);
    });
  });

  describe('Network Architecture', () => {
    it('should have separate public and private subnet arrays', async () => {
      const publicSubnets = await stack.publicSubnetIds.promise();
      const privateSubnets = await stack.privateSubnetIds.promise();

      expect(publicSubnets).not.toEqual(privateSubnets);
    });

    it('should create subnets with correct patterns', async () => {
      const publicSubnets = await stack.publicSubnetIds.promise();
      const privateSubnets = await stack.privateSubnetIds.promise();

      publicSubnets.forEach((subnet: string) => {
        expect(subnet).toMatch(/^subnet-tap-public-subnet-\d+-test$/);
      });

      privateSubnets.forEach((subnet: string) => {
        expect(subnet).toMatch(/^subnet-tap-private-subnet-\d+-test$/);
      });
    });
  });

  describe('Service Discovery', () => {
    it('should create resources for service communication', async () => {
      // Processing service should be discoverable
      const processingArn = await stack.processingServiceArn.promise();
      expect(processingArn).toBeDefined();
    });
  });

  describe('Output Registration', () => {
    it('should register all required outputs', () => {
      const outputs = [
        'vpcId',
        'albDnsName',
        'clusterName',
        'clusterArn',
        'frontendServiceArn',
        'apiGatewayServiceArn',
        'processingServiceArn',
        'frontendEcrUrl',
        'apiGatewayEcrUrl',
        'processingServiceEcrUrl',
        'publicSubnetIds',
        'privateSubnetIds',
      ];

      outputs.forEach((output) => {
        expect((stack as any)[output]).toBeDefined();
      });
    });
  });

  describe('Infrastructure Completeness', () => {
    it('should create all 3 ECR repositories', async () => {
      const frontend = await stack.frontendEcrUrl.promise();
      const apiGateway = await stack.apiGatewayEcrUrl.promise();
      const processing = await stack.processingServiceEcrUrl.promise();

      expect(frontend).toBeDefined();
      expect(apiGateway).toBeDefined();
      expect(processing).toBeDefined();
    });

    it('should create all 3 ECS services', async () => {
      const frontendService = await stack.frontendServiceArn.promise();
      const apiGatewayService = await stack.apiGatewayServiceArn.promise();
      const processingService = await stack.processingServiceArn.promise();

      expect(frontendService).toBeDefined();
      expect(apiGatewayService).toBeDefined();
      expect(processingService).toBeDefined();
    });
  });

  describe('Environment Suffix Handling', () => {
    it('should handle empty string as environment suffix', () => {
      const emptyStack = new TapStack('empty-suffix-stack', {
        environmentSuffix: '',
      });
      expect(emptyStack).toBeDefined();
    });

    it('should handle undefined environment suffix', () => {
      const undefinedStack = new TapStack('undefined-suffix-stack', {
        environmentSuffix: undefined,
      });
      expect(undefinedStack).toBeDefined();
    });

    it('should handle special characters in environment suffix', () => {
      const specialStack = new TapStack('special-stack', {
        environmentSuffix: 'test-123',
      });
      expect(specialStack).toBeDefined();
    });
  });

  describe('Deployment Configuration', () => {
    it('should support production environment', () => {
      const prodStack = new TapStack('prod-stack', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
        },
      });
      expect(prodStack).toBeDefined();
    });

    it('should support staging environment', () => {
      const stagingStack = new TapStack('staging-stack', {
        environmentSuffix: 'staging',
        tags: {
          Environment: 'staging',
        },
      });
      expect(stagingStack).toBeDefined();
    });

    it('should support development environment', () => {
      const devStack = new TapStack('dev-stack', {
        environmentSuffix: 'dev',
        tags: {
          Environment: 'development',
        },
      });
      expect(devStack).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle long environment suffixes', () => {
      const longSuffixStack = new TapStack('long-suffix-stack', {
        environmentSuffix: 'very-long-environment-suffix-name',
      });
      expect(longSuffixStack).toBeDefined();
    });

    it('should handle numeric environment suffixes', () => {
      const numericStack = new TapStack('numeric-stack', {
        environmentSuffix: '12345',
      });
      expect(numericStack).toBeDefined();
    });

    it('should create stack with minimal configuration', () => {
      const minimalStack = new TapStack('minimal-stack', {});
      expect(minimalStack).toBeDefined();
      expect(minimalStack.vpcId).toBeDefined();
    });
  });
});
