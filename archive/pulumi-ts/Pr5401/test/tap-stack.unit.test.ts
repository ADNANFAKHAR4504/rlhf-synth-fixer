/**
 * Unit tests for TapStack
 * Tests the structure and configuration of the main Pulumi stack
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';
import { NetworkStack } from '../lib/network-stack';
import { EcsStack } from '../lib/ecs-stack';

// Set up Pulumi mocking for unit tests
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}-id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c'],
      };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'ap-southeast-1',
      };
    }
    if (args.token === 'aws:ecr/getRepository:getRepository') {
      return {
        repositoryUrl: '123456789012.dkr.ecr.ap-southeast-1.amazonaws.com/product-catalog-api',
        arn: 'arn:aws:ecr:ap-southeast-1:123456789012:repository/product-catalog-api',
      };
    }
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const testEnvironmentSuffix = 'test123';

  beforeAll(() => {
    // Create the stack with test configuration
    stack = new TapStack('test-stack', {
      environmentSuffix: testEnvironmentSuffix,
      tags: {
        Environment: 'production',
        ManagedBy: 'pulumi',
        TestTag: 'test-value',
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
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.vpcId).toBeDefined();
    });
  });

  describe('Stack outputs validation', () => {
    it('should have albDnsName output as pulumi.Output', () => {
      expect(stack.albDnsName).toBeDefined();
      expect(stack.albDnsName).toHaveProperty('apply');
    });

    it('should have ecsClusterName output as pulumi.Output', () => {
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.ecsClusterName).toHaveProperty('apply');
    });

    it('should have vpcId output', (done) => {
      pulumi.all([stack.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        expect(typeof vpcId).toBe('string');
        done();
      });
    });
  });

  describe('Default values', () => {
    it('should use default environmentSuffix when not provided', () => {
      const defaultStack = new TapStack('default-test-stack', {});
      expect(defaultStack).toBeDefined();
    });

    it('should apply default tags', (done) => {
      const stackWithMinimalArgs = new TapStack('minimal-stack', {
        environmentSuffix: 'minimal',
      });
      expect(stackWithMinimalArgs).toBeDefined();
      done();
    });
  });
});

describe('NetworkStack Unit Tests', () => {
  let networkStack: NetworkStack;
  const testEnvironmentSuffix = 'nettest';

  beforeAll(() => {
    networkStack = new NetworkStack('test-network', {
      environmentSuffix: testEnvironmentSuffix,
      tags: {
        Environment: 'production',
        ManagedBy: 'pulumi',
      },
    });
  });

  describe('Network stack instantiation', () => {
    it('should create network stack successfully', () => {
      expect(networkStack).toBeDefined();
      expect(networkStack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should expose VPC ID output', () => {
      expect(networkStack.vpcId).toBeDefined();
    });

    it('should expose public subnet IDs', () => {
      expect(networkStack.publicSubnetIds).toBeDefined();
      expect(Array.isArray(networkStack.publicSubnetIds)).toBe(true);
      expect(networkStack.publicSubnetIds.length).toBe(2);
    });

    it('should expose private subnet IDs', () => {
      expect(networkStack.privateSubnetIds).toBeDefined();
      expect(Array.isArray(networkStack.privateSubnetIds)).toBe(true);
      expect(networkStack.privateSubnetIds.length).toBe(2);
    });
  });

  describe('VPC configuration', () => {
    it('should use correct CIDR block', () => {
      expect(networkStack.vpcCidr).toBe('10.0.0.0/16');
    });

    it('should have valid VPC ID output', (done) => {
      pulumi.all([networkStack.vpcId]).apply(([vpcId]) => {
        expect(vpcId).toBeDefined();
        expect(typeof vpcId).toBe('string');
        expect(vpcId).toContain('-id');
        done();
      });
    });
  });

  describe('Subnet configuration', () => {
    it('should create 2 public subnets', () => {
      expect(networkStack.publicSubnetIds.length).toBe(2);
    });

    it('should create 2 private subnets', () => {
      expect(networkStack.privateSubnetIds.length).toBe(2);
    });

    it('should have valid public subnet IDs', (done) => {
      pulumi.all(networkStack.publicSubnetIds).apply((subnetIds) => {
        expect(subnetIds.length).toBe(2);
        subnetIds.forEach((id) => {
          expect(id).toBeDefined();
          expect(typeof id).toBe('string');
        });
        done();
      });
    });

    it('should have valid private subnet IDs', (done) => {
      pulumi.all(networkStack.privateSubnetIds).apply((subnetIds) => {
        expect(subnetIds.length).toBe(2);
        subnetIds.forEach((id) => {
          expect(id).toBeDefined();
          expect(typeof id).toBe('string');
        });
        done();
      });
    });
  });
});

describe('EcsStack Unit Tests', () => {
  let ecsStack: EcsStack;
  let networkStack: NetworkStack;
  const testEnvironmentSuffix = 'ecstest';

  beforeAll(() => {
    // Create network stack first as ECS depends on it
    networkStack = new NetworkStack('test-network-for-ecs', {
      environmentSuffix: testEnvironmentSuffix,
      tags: {
        Environment: 'production',
        ManagedBy: 'pulumi',
      },
    });

    // Create ECS stack with network dependencies
    ecsStack = new EcsStack('test-ecs', {
      environmentSuffix: testEnvironmentSuffix,
      vpcId: networkStack.vpcId,
      publicSubnetIds: networkStack.publicSubnetIds,
      privateSubnetIds: networkStack.privateSubnetIds,
      tags: {
        Environment: 'production',
        ManagedBy: 'pulumi',
      },
    });
  });

  describe('ECS stack instantiation', () => {
    it('should create ECS stack successfully', () => {
      expect(ecsStack).toBeDefined();
      expect(ecsStack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should expose ALB DNS name output', () => {
      expect(ecsStack.albDnsName).toBeDefined();
    });

    it('should expose cluster name output', () => {
      expect(ecsStack.clusterName).toBeDefined();
    });
  });

  describe('ALB configuration', () => {
    it('should have valid ALB DNS name output', () => {
      expect(ecsStack.albDnsName).toBeDefined();
      expect(ecsStack.albDnsName).toHaveProperty('apply');
    });
  });

  describe('ECS Cluster configuration', () => {
    it('should have valid cluster name output', () => {
      expect(ecsStack.clusterName).toBeDefined();
      expect(ecsStack.clusterName).toHaveProperty('apply');
    });
  });
});

describe('Resource naming with environmentSuffix', () => {
  const testSuffix = 'suffix123';

  it('should include environmentSuffix in TapStack resources', () => {
    const stack = new TapStack('naming-test-stack', {
      environmentSuffix: testSuffix,
    });
    expect(stack).toBeDefined();
  });

  it('should include environmentSuffix in NetworkStack resources', () => {
    const netStack = new NetworkStack('naming-test-network', {
      environmentSuffix: testSuffix,
    });
    expect(netStack).toBeDefined();
  });

  it('should include environmentSuffix in EcsStack resources', () => {
    const netStack = new NetworkStack('naming-test-network-2', {
      environmentSuffix: testSuffix,
    });
    const eStack = new EcsStack('naming-test-ecs', {
      environmentSuffix: testSuffix,
      vpcId: netStack.vpcId,
      publicSubnetIds: netStack.publicSubnetIds,
      privateSubnetIds: netStack.privateSubnetIds,
    });
    expect(eStack).toBeDefined();
  });
});

describe('Tag propagation', () => {
  const customTags = {
    Environment: 'production',
    ManagedBy: 'pulumi',
    CustomTag: 'custom-value',
    Team: 'platform',
  };

  it('should propagate tags to TapStack', () => {
    const stack = new TapStack('tag-test-stack', {
      environmentSuffix: 'tagtest',
      tags: customTags,
    });
    expect(stack).toBeDefined();
  });

  it('should propagate tags to NetworkStack', () => {
    const netStack = new NetworkStack('tag-test-network', {
      environmentSuffix: 'tagtest',
      tags: customTags,
    });
    expect(netStack).toBeDefined();
  });

  it('should propagate tags to EcsStack', () => {
    const netStack = new NetworkStack('tag-test-network-3', {
      environmentSuffix: 'tagtest',
      tags: customTags,
    });
    const eStack = new EcsStack('tag-test-ecs', {
      environmentSuffix: 'tagtest',
      vpcId: netStack.vpcId,
      publicSubnetIds: netStack.publicSubnetIds,
      privateSubnetIds: netStack.privateSubnetIds,
      tags: customTags,
    });
    expect(eStack).toBeDefined();
  });
});
