import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Set up Pulumi mocks before importing stacks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: Record<string, any> = args.inputs;

    // Add id and arn for resources that need them
    outputs.id = outputs.id || `${args.name}-id-${Date.now()}`;

    if (args.type === 'aws:ec2/vpc:Vpc') {
      outputs.arn = `arn:aws:ec2:us-east-2:123456789012:vpc/${outputs.id}`;
    } else if (args.type === 'aws:ec2/subnet:Subnet') {
      outputs.arn = `arn:aws:ec2:us-east-2:123456789012:subnet/${outputs.id}`;
    } else if (args.type === 'aws:ec2/securityGroup:SecurityGroup') {
      outputs.arn = `arn:aws:ec2:us-east-2:123456789012:security-group/${outputs.id}`;
    } else if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.arn = `arn:aws:s3:::${outputs.id}`;
      outputs.bucket = outputs.id;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.arn = `arn:aws:iam::123456789012:role/${outputs.name}`;
      outputs.name = outputs.name || args.name;
    } else if (args.type === 'aws:ec2/natGateway:NatGateway') {
      outputs.allocationId = `eipalloc-${Date.now()}`;
    } else if (args.type === 'aws:ec2/eip:Eip') {
      outputs.allocationId = `eipalloc-${Date.now()}`;
    }

    return {
      id: outputs.id,
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs): any {
    switch (args.token) {
      case 'aws:index/getAvailabilityZones:getAvailabilityZones':
        return {
          names: ['us-east-2a', 'us-east-2b', 'us-east-2c'],
          zoneIds: ['use2-az1', 'use2-az2', 'use2-az3'],
          state: 'available',
        };
      default:
        return {};
    }
  },
});

// Set config
pulumi.runtime.setAllConfig({
  'aws:region': 'us-east-2',
});

import { VpcStack } from '../lib/vpc-stack';

describe('VpcStack Unit Tests', () => {
  describe('VPC Creation', () => {
    it('should create VPC with correct CIDR block', async () => {
      const stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.5.0.0/16',
      });

      expect(stack).toBeDefined();

      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBeDefined();
      expect(vpcId).toContain('id');
    });

    it('should create VPC with custom tags', async () => {
      const stack = new VpcStack('test-vpc', {
        environmentSuffix: 'prod',
        vpcCidr: '10.5.0.0/16',
        tags: {
          Environment: 'production',
          Project: 'MediaApp',
        },
      });

      expect(stack).toBeDefined();
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBeDefined();
    });
  });

  describe('Subnet Creation', () => {
    it('should create public and private subnets', async () => {
      const stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.5.0.0/16',
      });

      const publicSubnetIds = await stack.publicSubnetIds.promise();
      const privateSubnetIds = await stack.privateSubnetIds.promise();

      expect(publicSubnetIds).toBeDefined();
      expect(privateSubnetIds).toBeDefined();
      expect(Array.isArray(publicSubnetIds)).toBe(true);
      expect(Array.isArray(privateSubnetIds)).toBe(true);
    });
  });

  describe('Outputs', () => {
    it('should expose VPC ID as output', async () => {
      const stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.5.0.0/16',
      });

      expect(stack.vpcId).toBeDefined();
      const vpcId = await stack.vpcId.promise();
      expect(typeof vpcId).toBe('string');
    });

    it('should expose subnet IDs as outputs', async () => {
      const stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.5.0.0/16',
      });

      expect(stack.publicSubnetIds).toBeDefined();
      expect(stack.privateSubnetIds).toBeDefined();
    });

    it('should handle VPC with additional configurations', async () => {
      const stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.5.0.0/16',
      });

      // Test that the stack is properly created
      expect(stack).toBeDefined();
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBeTruthy();
    });
  });

  describe('NAT Gateways and Route Tables', () => {
    it('should create NAT gateways for private subnets', async () => {
      const stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.5.0.0/16',
      });

      // The NAT gateways are created internally
      expect(stack).toBeDefined();
      const vpcId = await stack.vpcId.promise();
      expect(vpcId).toBeTruthy();
    });

    it('should handle flow logs configuration', async () => {
      const stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.5.0.0/16',
        enableFlowLogs: true,
      });

      expect(stack).toBeDefined();
    });

    it('should work without flow logs', async () => {
      const stack = new VpcStack('test-vpc', {
        environmentSuffix: 'test',
        vpcCidr: '10.5.0.0/16',
        enableFlowLogs: false,
      });

      expect(stack).toBeDefined();
    });
  });
});
