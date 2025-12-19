import * as pulumi from '@pulumi/pulumi';
import { EnvironmentMigrationStack } from '../lib/environmentMigrationStack';

jest.setTimeout(15000);

pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    const { type, name, inputs } = args;
    return {
      id: `${name}-id`,
      state: {
        ...inputs,
        name: inputs.name || name,
        arn: `arn:aws:${type}:us-east-1:123456789012:${name}`,
        endpoint: `${name}.amazonaws.com`,
        dnsName: `${name}.elb.amazonaws.com`,
        domainName: `${name}.cloudfront.net`,
        bucket: `${name}-bucket`,
        arnSuffix: `app/${name}/1234567890`,
        keyId: `${name}-key-id`,
        bucketDomainName: `${name}.s3.amazonaws.com`,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:ec2/getAvailabilityZones:getAvailabilityZones') {
      return Promise.resolve({ names: ['us-east-1a', 'us-east-1b'] });
    }
    if (args.token === 'aws:ec2/getAmi:getAmi') {
      return Promise.resolve({ id: 'ami-12345678' });
    }
    return Promise.resolve(args);
  },
});

describe('EnvironmentMigrationStack', () => {
  let stack: EnvironmentMigrationStack;

  beforeAll(() => {
    stack = new EnvironmentMigrationStack('us-east-1', 'test', { Project: 'test' });
  });

  describe('getAvailabilityZone Function', () => {
    it('should return fallback when names is undefined', () => {
      const result = stack.getAvailabilityZone(undefined, 0);
      expect(result).toBe('us-east-1a');
    });

    it('should return fallback when names is null', () => {
      const result = stack.getAvailabilityZone(null, 1);
      expect(result).toBe('us-east-1b');
    });

    it('should return fallback when names is empty array', () => {
      const result = stack.getAvailabilityZone([], 0);
      expect(result).toBe('us-east-1a');
    });

    it('should return AZ name when available', () => {
      const result = stack.getAvailabilityZone(['us-east-1a', 'us-east-1b'], 0);
      expect(result).toBe('us-east-1a');
    });

    it('should use modulo for index wrapping', () => {
      const result = stack.getAvailabilityZone(['us-east-1a', 'us-east-1b'], 2);
      expect(result).toBe('us-east-1a');
    });

    it('should return fallback when array element is undefined', () => {
      const sparseArray = ['us-east-1a'];
      sparseArray[1] = undefined as any;
      const result = stack.getAvailabilityZone(sparseArray, 1);
      expect(result).toBe('us-east-1b');
    });

    it('should return fallback when array element is null', () => {
      const arrayWithNull = ['us-east-1a', null as any];
      const result = stack.getAvailabilityZone(arrayWithNull, 1);
      expect(result).toBe('us-east-1b');
    });

    it('should return fallback when array element is empty string', () => {
      const arrayWithEmpty = ['us-east-1a', ''];
      const result = stack.getAvailabilityZone(arrayWithEmpty, 1);
      expect(result).toBe('us-east-1b');
    });
  });

  describe('Stack Creation', () => {
    it('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.outputs).toBeDefined();
    });
  });
});