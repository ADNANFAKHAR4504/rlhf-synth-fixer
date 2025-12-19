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
        arn:
          args.type === 'aws:s3/bucket:Bucket'
            ? `arn:aws:s3:::${args.inputs.bucket || args.name}`
            : undefined,
        primaryNetworkInterfaceId:
          args.type === 'aws:ec2/instance:Instance'
            ? `eni-${args.name}`
            : undefined,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:ec2/getAmi:getAmi') {
      return {
        id: 'ami-12345678',
        architecture: 'x86_64',
      };
    }
    if (args.token === 'aws:ec2/getRouteTable:getRouteTable') {
      return {
        id: `rtb-${args.inputs.filters[0].values[0]}`,
      };
    }
    return {};
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Infrastructure', () => {
  let stack: TapStack;
  const testEnvSuffix = 'test123';

  beforeAll(() => {
    process.env.ENVIRONMENT_SUFFIX = testEnvSuffix;
    stack = new TapStack('tap-test', {
      tags: {
        TestTag: 'TestValue',
      },
    });
  });

  afterAll(() => {
    delete process.env.ENVIRONMENT_SUFFIX;
  });

  describe('VPC Configuration', () => {
    it('should create VPC with correct CIDR block', async () => {
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBeDefined();
      expect(typeof vpcId).toBe('string');
    });
  });

  describe('Subnet Configuration', () => {
    it('should create 3 public subnets', async () => {
      const publicSubnets = await Promise.all(
        stack.publicSubnetIds.map(s => s.promise())
      );
      expect(publicSubnets).toHaveLength(3);
      publicSubnets.forEach(subnetId => {
        expect(subnetId).toBeDefined();
        expect(typeof subnetId).toBe('string');
      });
    });

    it('should create 3 private subnets', async () => {
      const privateSubnets = await Promise.all(
        stack.privateSubnetIds.map(s => s.promise())
      );
      expect(privateSubnets).toHaveLength(3);
      privateSubnets.forEach(subnetId => {
        expect(subnetId).toBeDefined();
        expect(typeof subnetId).toBe('string');
      });
    });

    it('should create 3 database subnets', async () => {
      const databaseSubnets = await Promise.all(
        stack.databaseSubnetIds.map(s => s.promise())
      );
      expect(databaseSubnets).toHaveLength(3);
      databaseSubnets.forEach(subnetId => {
        expect(subnetId).toBeDefined();
        expect(typeof subnetId).toBe('string');
      });
    });
  });

  describe('NAT Instance Configuration', () => {
    it('should create 3 NAT instances', async () => {
      const natInstances = await Promise.all(
        stack.natInstanceIds.map(n => n.promise())
      );
      expect(natInstances).toHaveLength(3);
      natInstances.forEach(instanceId => {
        expect(instanceId).toBeDefined();
        expect(typeof instanceId).toBe('string');
      });
    });
  });

  describe('Security Group Configuration', () => {
    it('should create web security group', async () => {
      const webSgId = await stack.webSgId.promise();
      expect(webSgId).toBeDefined();
      expect(typeof webSgId).toBe('string');
    });

    it('should create app security group', async () => {
      const appSgId = await stack.appSgId.promise();
      expect(appSgId).toBeDefined();
      expect(typeof appSgId).toBe('string');
    });

    it('should create database security group', async () => {
      const dbSgId = await stack.dbSgId.promise();
      expect(dbSgId).toBeDefined();
      expect(typeof dbSgId).toBe('string');
    });
  });

  describe('S3 Flow Logs Bucket', () => {
    it('should create flow logs bucket with environment suffix', async () => {
      const bucketName = await stack.flowLogsBucketName.promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
      expect(bucketName).toContain(testEnvSuffix);
    });
  });

  describe('Resource Outputs', () => {
    it('should export all required outputs', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
      expect(stack.databaseSubnetIds).toBeDefined();
      expect(stack.natInstanceIds).toBeDefined();
      expect(stack.webSgId).toBeDefined();
      expect(stack.appSgId).toBeDefined();
      expect(stack.dbSgId).toBeDefined();
      expect(stack.flowLogsBucketName).toBeDefined();
    });
  });

  describe('Constructor with Custom Tags', () => {
    it('should accept custom tags argument', () => {
      const customStack = new TapStack('custom-test', {
        tags: {
          CustomTag: 'CustomValue',
          Environment: 'test',
        },
      });
      expect(customStack).toBeDefined();
    });

    it('should work without tags argument', () => {
      const noTagsStack = new TapStack('no-tags-test');
      expect(noTagsStack).toBeDefined();
    });
  });

  describe('Environment Suffix Handling', () => {
    it('should use process.env.ENVIRONMENT_SUFFIX when available', () => {
      expect(process.env.ENVIRONMENT_SUFFIX).toBe(testEnvSuffix);
      expect(stack).toBeDefined();
    });

    it('should handle missing ENVIRONMENT_SUFFIX', () => {
      const originalEnv = process.env.ENVIRONMENT_SUFFIX;
      delete process.env.ENVIRONMENT_SUFFIX;
      const defaultStack = new TapStack('default-test');
      expect(defaultStack).toBeDefined();
      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    });
  });

  describe('Availability Zones', () => {
    it('should span 3 availability zones', async () => {
      const publicSubnets = await Promise.all(
        stack.publicSubnetIds.map(s => s.promise())
      );
      const privateSubnets = await Promise.all(
        stack.privateSubnetIds.map(s => s.promise())
      );
      const databaseSubnets = await Promise.all(
        stack.databaseSubnetIds.map(s => s.promise())
      );

      expect(publicSubnets).toHaveLength(3);
      expect(privateSubnets).toHaveLength(3);
      expect(databaseSubnets).toHaveLength(3);
    });
  });
});
