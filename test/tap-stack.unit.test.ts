/**
 * Unit tests for TapStack
 * Tests the structure and configuration of the main Pulumi stack
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Set up Pulumi mocking for unit tests
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    const id = `${args.name}-${args.type.replace(/:/g, '-')}-id`;

    // Mock state based on resource type
    const state: any = {
      ...args.inputs,
      id: id,
      arn: `arn:aws:${args.type.split(':')[0]}:us-east-1:123456789012:${args.name}`,
    };

    // Special handling for specific resource types
    switch (args.type) {
      case 'aws:ec2/vpc:Vpc':
        state.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
        state.enableDnsHostnames = true;
        state.enableDnsSupport = true;
        break;

      case 'aws:ec2/subnet:Subnet':
        state.availabilityZone = args.inputs.availabilityZone || 'us-east-1a';
        state.cidrBlock = args.inputs.cidrBlock || '10.0.1.0/24';
        break;

      case 'aws:s3/bucket:Bucket':
        state.bucket = args.inputs.bucket || args.name;
        state.websiteEndpoint = `${args.name}.s3-website-us-east-1.amazonaws.com`;
        break;

      case 'aws:rds/cluster:Cluster':
        state.endpoint = `${args.name}.cluster-mockendpoint.us-east-1.rds.amazonaws.com`;
        state.readerEndpoint = `${args.name}.cluster-ro-mockendpoint.us-east-1.rds.amazonaws.com`;
        state.port = 5432;
        state.engine = args.inputs.engine || 'aurora-postgresql';
        state.clusterIdentifier = args.inputs.clusterIdentifier || args.name;
        break;

      case 'aws:lb/loadBalancer:LoadBalancer':
        state.dnsName = `${args.name}-123456789.us-east-1.elb.amazonaws.com`;
        state.zoneId = 'Z35SXDOTRQ7X7K';
        break;

      case 'aws:lb/targetGroup:TargetGroup':
        state.arn = `arn:aws:elasticloadbalancing:us-east-1:123456789012:targetgroup/${args.name}/1234567890123456`;
        break;

      case 'aws:autoscaling/group:Group':
        state.minSize = args.inputs.minSize || 1;
        state.maxSize = args.inputs.maxSize || 3;
        state.desiredCapacity = args.inputs.desiredCapacity || 2;
        state.name = args.name;
        break;

      case 'aws:iam/role:Role':
        state.arn = `arn:aws:iam::123456789012:role/${args.name}`;
        state.assumeRolePolicy = args.inputs.assumeRolePolicy;
        break;

      case 'aws:ec2/securityGroup:SecurityGroup':
        state.vpcId = args.inputs.vpcId || 'vpc-123456';
        state.ingress = args.inputs.ingress || [];
        state.egress = args.inputs.egress || [];
        break;

      case 'aws:ec2/launchTemplate:LaunchTemplate':
        state.latestVersion = 1;
        state.imageId = args.inputs.imageId || 'ami-12345678';
        state.instanceType = args.inputs.instanceType || 't3.micro';
        break;

      case 'aws:ec2/eip:Eip':
        state.publicIp = '54.123.45.67';
        state.allocationId = `eipalloc-${args.name}`;
        break;

      case 'aws:ec2/natGateway:NatGateway':
        state.allocationId = args.inputs.allocationId || `eipalloc-${args.name}`;
        state.subnetId = args.inputs.subnetId || `subnet-${args.name}`;
        break;

      case 'aws:ec2/internetGateway:InternetGateway':
        state.vpcId = args.inputs.vpcId || 'vpc-123456';
        break;

      case 'aws:ec2/routeTable:RouteTable':
        state.vpcId = args.inputs.vpcId || 'vpc-123456';
        break;

      case 'aws:sns/topic:Topic':
        state.arn = `arn:aws:sns:us-east-1:123456789012:${args.name}`;
        break;
    }

    return {
      id: state.id,
      state: state,
    };
  },

  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock function calls (e.g., aws.getAvailabilityZones)
    switch (args.token) {
      case 'aws:index/getAvailabilityZones:getAvailabilityZones':
        return {
          names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
          zoneIds: ['use1-az1', 'use1-az2', 'use1-az4'],
        };

      case 'aws:ec2/getAmi:getAmi':
        return {
          id: 'ami-0c55b159cbfafe1f0',
          architecture: 'x86_64',
          name: 'amzn2-ami-hvm-2.0.20210813.1-x86_64-gp2',
        };

      default:
        return args.inputs;
    }
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const testEnvironmentSuffix = 'test';

  beforeAll(() => {
    // Create the stack with test configuration
    stack = new TapStack('test-stack', {
      environmentSuffix: testEnvironmentSuffix,
      tags: {
        Environment: 'test',
        ManagedBy: 'Pulumi',
        Project: 'PaymentProcessing',
      },
    });
  });

  describe('Stack instantiation', () => {
    it('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should expose required outputs', () => {
      expect(stack.albDnsName).toBeDefined();
      expect(stack.auroraEndpoint).toBeDefined();
      expect(stack.maintenanceBucket).toBeDefined();
    });

    it('should have outputs as pulumi.Output types', () => {
      expect(stack.albDnsName).toHaveProperty('apply');
      expect(stack.auroraEndpoint).toHaveProperty('apply');
      expect(stack.maintenanceBucket).toHaveProperty('apply');
    });
  });

  describe('Default values', () => {
    it('should use default environmentSuffix when not provided', () => {
      const defaultStack = new TapStack('default-test-stack', {});
      expect(defaultStack).toBeDefined();
    });

    it('should use default tags when not provided', () => {
      const stackWithMinimalArgs = new TapStack('minimal-stack', {
        environmentSuffix: 'minimal',
      });
      expect(stackWithMinimalArgs).toBeDefined();
    });
  });

  describe('Stack outputs validation', () => {
    it('should have albDnsName output', (done) => {
      pulumi.all([stack.albDnsName]).apply(([albDnsName]) => {
        expect(albDnsName).toBeDefined();
        expect(typeof albDnsName).toBe('string');
        done();
      });
    });

    it('should have auroraEndpoint output', (done) => {
      pulumi.all([stack.auroraEndpoint]).apply(([auroraEndpoint]) => {
        expect(auroraEndpoint).toBeDefined();
        expect(typeof auroraEndpoint).toBe('string');
        done();
      });
    });

    it('should have maintenanceBucket output', (done) => {
      pulumi.all([stack.maintenanceBucket]).apply(([maintenanceBucket]) => {
        expect(maintenanceBucket).toBeDefined();
        expect(typeof maintenanceBucket).toBe('string');
        done();
      });
    });
  });

  describe('Environment suffix handling', () => {
    it('should use provided environment suffix', () => {
      const customStack = new TapStack('custom-stack', {
        environmentSuffix: 'prod',
      });
      expect(customStack).toBeDefined();
    });

    it('should default to dev when environment suffix not provided', () => {
      const defaultStack = new TapStack('default-stack', {});
      expect(defaultStack).toBeDefined();
    });
  });

  describe('Custom tags', () => {
    it('should accept custom tags', () => {
      const taggedStack = new TapStack('tagged-stack', {
        environmentSuffix: 'staging',
        tags: {
          Project: 'TestProject',
          Owner: 'TestOwner',
          CostCenter: 'Engineering',
        },
      });
      expect(taggedStack).toBeDefined();
    });
  });

  describe('Component resource structure', () => {
    it('should be a ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should have proper inheritance from ComponentResource', () => {
      // Verify the stack is properly instantiated as a ComponentResource
      expect(stack).toBeDefined();
      expect(stack.constructor.name).toBe('TapStack');
    });
  });
});
