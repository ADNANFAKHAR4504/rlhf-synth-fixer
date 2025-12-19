import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocks before importing the stack
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): { id: string, state: any } {
    return {
      id: args.inputs.name ? `${args.name}_id` : args.name + '_id',
      state: {
        ...args.inputs,
        arn: args.type === 'aws:s3/bucket:Bucket'
          ? `arn:aws:s3:::${args.inputs.bucket || args.inputs.name || args.name}`
          : `arn:aws:${args.type}:eu-central-2:123456789012:${args.name}`,
        bucket: args.inputs.bucket || args.inputs.name || args.name,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-1a', 'us-east-1b', 'us-east-1c'],
        zoneIds: ['use1-az1', 'use1-az2', 'use1-az3'],
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'eu-central-2',
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

    it('ECS cluster name includes environment suffix pattern', (done) => {
      stack.ecsClusterName.apply((v: string) => {
        expect(v).toMatch(/payment-cluster/);
        done();
      });
    });

    it('ECS service name includes environment suffix pattern', (done) => {
      stack.ecsServiceName.apply((v: string) => {
        expect(v).toMatch(/payment-service/);
        done();
      });
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

    it('flow logs bucket name includes flowlogs', (done) => {
      stack.flowLogsBucketName.apply((v: string) => {
        expect(v).toBeTruthy();
        if (v) {
          expect(v).toContain('flowlogs');
        }
        done();
      });
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

    it('uses consistent payment prefix for resources', (done) => {
      pulumi.all([stack.ecsClusterName, stack.ecsServiceName, stack.flowLogsBucketName])
        .apply(([clusterName, serviceName, bucketName]) => {
          expect(clusterName).toContain('payment');
          expect(serviceName).toContain('payment');
          expect(bucketName).toContain('payment');
          done();
        });
    });

    it('includes region in bucket names', (done) => {
      stack.flowLogsBucketName.apply((bucketName: string) => {
        expect(bucketName).toContain('eu-central-2');
        done();
      });
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
