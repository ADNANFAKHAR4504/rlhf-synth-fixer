// Mock utilities for Pulumi testing
import * as pulumi from '@pulumi/pulumi';

// Enhanced mock for Pulumi resources with more realistic AWS resource properties
export const setupPulumiMocks = () => {
  pulumi.runtime.setMocks({
    newResource: (args: pulumi.runtime.MockResourceArgs) => {
      const { type, name, inputs } = args;

      // Generate more realistic mock data based on resource type
      const mockState: any = {
        ...inputs,
        name: inputs.name || name,
        id: `${name}-mock-id`,
        arn: `arn:aws:${type.split(':')[1] || 'component'}:ap-south-1:123456789012:${name}`,
      };

      // Add type-specific properties
      if (type.includes('Vpc')) {
        mockState.cidrBlock = '10.0.0.0/16';
        mockState.enableDnsHostnames = true;
        mockState.enableDnsSupport = true;
      }

      if (type.includes('Subnet')) {
        mockState.availabilityZone = 'ap-south-1a';
        mockState.cidrBlock = inputs.cidrBlock || '10.0.1.0/24';
      }

      if (type.includes('LoadBalancer')) {
        mockState.dnsName = `${name}.ap-south-1.elb.amazonaws.com`;
        mockState.hostedZoneId = 'Z123456789';
      }

      if (type.includes('rds')) {
        mockState.endpoint = `${name}.cluster-xyz.ap-south-1.rds.amazonaws.com`;
        mockState.port = 3306;
      }

      if (type.includes('s3')) {
        mockState.bucket = `${name}-bucket-${Date.now()}`;
        mockState.region = 'ap-south-1';
      }

      if (type.includes('Eip')) {
        mockState.publicIp = '203.0.113.1';
        mockState.allocationId = 'eipalloc-12345678';
      }

      return {
        id: mockState.id,
        state: mockState,
      };
    },

    call: (args: pulumi.runtime.MockCallArgs) => {
      // Mock AWS API calls
      if (
        args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones'
      ) {
        return Promise.resolve({
          names: ['ap-south-1a', 'ap-south-1b', 'ap-south-1c'],
          zoneIds: ['aps1-az1', 'aps1-az2', 'aps1-az3'],
        });
      }

      if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
        return Promise.resolve({
          accountId: '123456789012',
          arn: 'arn:aws:iam::123456789012:user/test-user',
          userId: 'AIDACKCEVSQ6C2EXAMPLE',
        });
      }

      if (args.token === 'aws:ec2/getAmi:getAmi') {
        return Promise.resolve({
          id: 'ami-12345678',
          name: 'amzn2-ami-hvm-2.0.20231101.0-x86_64-gp2',
          ownerId: '137112412989',
        });
      }

      return args;
    },
  });
};

// Reset mocks between tests
export const resetPulumiMocks = () => {
  // Pulumi doesn't provide a direct reset method, but we can re-setup
  setupPulumiMocks();
};
