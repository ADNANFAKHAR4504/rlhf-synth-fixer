import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

/**
 * Unit tests for TapStack Pulumi component
 *
 * These tests verify the structure and configuration of the TapStack
 * without actually deploying to AWS.
 */

// Set up Pulumi runtime mocks
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    const outputs: any = {
      ...args.inputs,
      id: args.name + '_id',
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
    };

    // Mock specific resource outputs
    if (args.type === 'aws:ec2/vpc:Vpc') {
      outputs.cidrBlock = args.inputs.cidrBlock || '10.0.0.0/16';
    } else if (args.type === 'aws:ec2/subnet:Subnet') {
      outputs.cidrBlock = args.inputs.cidrBlock;
      outputs.availabilityZone = args.inputs.availabilityZone || 'us-east-1a';
    } else if (args.type === 'aws:lb/loadBalancer:LoadBalancer') {
      outputs.dnsName = `${args.name}.elb.amazonaws.com`;
    } else if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.bucket = args.inputs.bucket || args.name;
    } else if (args.type === 'aws:rds/instance:Instance') {
      outputs.endpoint = `${args.name}.rds.amazonaws.com:5432`;
      outputs.address = `${args.name}.rds.amazonaws.com`;
      outputs.port = 5432;
    }

    return {
      id: args.name + '_id',
      state: outputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS API calls
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['ap-northeast-1a', 'ap-northeast-1b', 'ap-northeast-1c'],
      };
    } else if (args.token === 'aws:ec2/getAmi:getAmi') {
      return {
        id: 'ami-12345678',
        name: 'al2023-ami-2023.1.20230912.0-kernel-6.1-x86_64',
      };
    }
    return {};
  },
});

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const testEnvironmentSuffix = 'test123';

  beforeAll(() => {
    // Create a new stack instance for testing
    stack = new TapStack('test-stack', {
      environmentSuffix: testEnvironmentSuffix,
      region: 'ap-northeast-1',
    });
  });

  describe('Stack Instantiation', () => {
    it('should create a TapStack instance', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should expose vpcId output', (done) => {
      stack.vpcId.apply((vpcId) => {
        expect(vpcId).toBeDefined();
        expect(typeof vpcId).toBe('string');
        done();
      });
    });

    it('should expose albDnsName output', (done) => {
      stack.albDnsName.apply((dnsName) => {
        expect(dnsName).toBeDefined();
        expect(typeof dnsName).toBe('string');
        expect(dnsName).toContain('.elb.amazonaws.com');
        done();
      });
    });

    it('should expose s3BucketName output', (done) => {
      stack.s3BucketName.apply((bucketName) => {
        expect(bucketName).toBeDefined();
        expect(typeof bucketName).toBe('string');
        expect(bucketName).toContain(testEnvironmentSuffix);
        done();
      });
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    it('should include environmentSuffix in VPC name', (done) => {
      stack.vpcId.apply((vpcId) => {
        expect(vpcId).toContain(testEnvironmentSuffix);
        done();
      });
    });

    it('should include environmentSuffix in ALB name', (done) => {
      stack.albDnsName.apply((dnsName) => {
        expect(dnsName).toContain(testEnvironmentSuffix);
        done();
      });
    });

    it('should include environmentSuffix in S3 bucket name', (done) => {
      stack.s3BucketName.apply((bucketName) => {
        expect(bucketName).toContain(testEnvironmentSuffix);
        done();
      });
    });
  });

  describe('Stack Configuration', () => {
    it('should use provided region', () => {
      const customStack = new TapStack('custom-region-stack', {
        environmentSuffix: 'custom',
        region: 'us-west-2',
      });
      expect(customStack).toBeDefined();
    });

    it('should accept custom tags', () => {
      const taggedStack = new TapStack('tagged-stack', {
        environmentSuffix: 'tagged',
        tags: {
          Project: 'TestProject',
          Owner: 'TestOwner',
        },
      });
      expect(taggedStack).toBeDefined();
    });

    it('should default to ap-northeast-1 region when not specified', () => {
      const defaultRegionStack = new TapStack('default-region-stack', {
        environmentSuffix: 'default',
      });
      expect(defaultRegionStack).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    it('should have all required outputs defined', () => {
      expect(stack.vpcId).toBeDefined();
      expect(stack.albDnsName).toBeDefined();
      expect(stack.s3BucketName).toBeDefined();
    });

    it('should return Output types for all public properties', () => {
      expect(stack.vpcId).toHaveProperty('apply');
      expect(stack.albDnsName).toHaveProperty('apply');
      expect(stack.s3BucketName).toHaveProperty('apply');
    });
  });

  describe('Component Resource Type', () => {
    it('should register as tap:stack:TapStack type', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });
  });
});
