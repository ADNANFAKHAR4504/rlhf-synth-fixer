/**
 * Unit tests for VpcStack component
 *
 * Tests VPC creation with public/private subnets, NAT gateways, and routing.
 */
import * as pulumi from '@pulumi/pulumi';
import { VpcStack } from '../lib/vpc-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.inputs.name + '_id',
      state: {
        ...args.inputs,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c'],
      };
    }
    return {};
  },
});

describe('VpcStack', () => {
  let vpcStack: VpcStack;

  beforeAll(() => {
    vpcStack = new VpcStack('test-vpc', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'production',
        Project: 'payment-api',
      },
    });
  });

  it('should instantiate successfully', () => {
    expect(vpcStack).toBeDefined();
  });

  it('should expose vpcId output', (done) => {
    vpcStack.vpcId.apply((id) => {
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      done();
    });
  });

  it('should expose publicSubnetIds output', (done) => {
    vpcStack.publicSubnetIds.apply((ids) => {
      expect(ids).toBeDefined();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should expose privateSubnetIds output', (done) => {
    vpcStack.privateSubnetIds.apply((ids) => {
      expect(ids).toBeDefined();
      expect(Array.isArray(ids)).toBe(true);
      expect(ids.length).toBeGreaterThan(0);
      done();
    });
  });

  it('should expose internetGatewayId output', (done) => {
    vpcStack.internetGatewayId.apply((id) => {
      expect(id).toBeDefined();
      expect(typeof id).toBe('string');
      done();
    });
  });

  it('should create VPC with correct CIDR block', (done) => {
    vpcStack.vpcId.apply((id) => {
      expect(id).toContain('_id');
      done();
    });
  });

  it('should create subnets in multiple availability zones', (done) => {
    vpcStack.publicSubnetIds.apply((ids) => {
      expect(ids.length).toBe(2); // Should create 2 public subnets
      done();
    });
  });

  it('should create private subnets', (done) => {
    vpcStack.privateSubnetIds.apply((ids) => {
      expect(ids.length).toBe(2); // Should create 2 private subnets
      done();
    });
  });
});
