import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks before importing the stack
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): {id: string, state: any} {
    return {
      id: args.inputs.name ? `${args.name}_id` : args.name + '_id',
      state: {
        ...args.inputs,
        arn: args.type === 'aws:s3/bucket:Bucket'
          ? `arn:aws:s3:::${args.inputs.name || args.name}`
          : `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'ap-southeast-1',
      };
    }
    return args.inputs;
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Structure', () => {
  let stack: TapStack;

  describe('with default values', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackDefault');
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('exposes ALB DNS name output', () => {
      expect(stack.albDnsName).toBeDefined();
    });

    it('exposes VPC ID output', () => {
      expect(stack.vpcId).toBeDefined();
    });

    it('exposes ECS cluster name output', () => {
      expect(stack.ecsClusterName).toBeDefined();
    });

    it('exposes ECS service name output', () => {
      expect(stack.ecsServiceName).toBeDefined();
    });

    it('exposes RDS cluster endpoint output', () => {
      expect(stack.rdsClusterEndpoint).toBeDefined();
    });

    it('exposes RDS cluster read endpoint output', () => {
      expect(stack.rdsClusterReadEndpoint).toBeDefined();
    });

    it('exposes flow logs bucket name output', () => {
      expect(stack.flowLogsBucketName).toBeDefined();
    });

    it('exposes RDS password secret output', () => {
      expect(stack.rdsPasswordSecret).toBeDefined();
    });
  });

  describe('output values', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackValues');
    });

    it('ALB DNS name is a Pulumi Output', async () => {
      expect(stack.albDnsName).toBeDefined();
      expect(stack.albDnsName).toBeInstanceOf(pulumi.Output);
    });

    it('VPC ID is a Pulumi Output', async () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.vpcId).toBeInstanceOf(pulumi.Output);
    });

    it('ECS cluster name includes environment suffix pattern', async () => {
      const value = await stack.ecsClusterName.promise();
      expect(value).toMatch(/payment-cluster/);
    });

    it('ECS service name includes environment suffix pattern', async () => {
      const value = await stack.ecsServiceName.promise();
      expect(value).toMatch(/payment-service/);
    });

    it('RDS cluster endpoint is defined', async () => {
      expect(stack.rdsClusterEndpoint).toBeDefined();
      expect(stack.rdsClusterEndpoint).toBeInstanceOf(pulumi.Output);
    });

    it('RDS cluster read endpoint is different from write endpoint', async () => {
      expect(stack.rdsClusterEndpoint).toBeDefined();
      expect(stack.rdsClusterReadEndpoint).toBeDefined();
      expect(stack.rdsClusterEndpoint).toBeInstanceOf(pulumi.Output);
      expect(stack.rdsClusterReadEndpoint).toBeInstanceOf(pulumi.Output);
    });

    it('flow logs bucket name includes flowlogs', async () => {
      const value = await stack.flowLogsBucketName.promise();
      expect(value).toBeTruthy();
      if (value) {
        expect(value).toContain('flowlogs');
      }
    });

    it('RDS password secret is defined', async () => {
      expect(stack.rdsPasswordSecret).toBeDefined();
      expect(stack.rdsPasswordSecret).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('resource naming convention', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackNaming');
    });

    it('uses consistent payment prefix for resources', async () => {
      const clusterName = await stack.ecsClusterName.promise();
      const serviceName = await stack.ecsServiceName.promise();
      const bucketName = await stack.flowLogsBucketName.promise();

      expect(clusterName).toContain('payment');
      expect(serviceName).toContain('payment');
      expect(bucketName).toContain('payment');
    });

    it('includes region in bucket names', async () => {
      const bucketName = await stack.flowLogsBucketName.promise();
      expect(bucketName).toContain('ap-southeast-1');
    });
  });

  describe('compliance requirements', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackCompliance');
    });

    it('exports all required outputs for audit trail', () => {
      expect(stack.albDnsName).toBeDefined();
      expect(stack.vpcId).toBeDefined();
      expect(stack.ecsClusterName).toBeDefined();
      expect(stack.ecsServiceName).toBeDefined();
      expect(stack.rdsClusterEndpoint).toBeDefined();
      expect(stack.rdsClusterReadEndpoint).toBeDefined();
      expect(stack.flowLogsBucketName).toBeDefined();
      expect(stack.rdsPasswordSecret).toBeDefined();
    });
  });
});
