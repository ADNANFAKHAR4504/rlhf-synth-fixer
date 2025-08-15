import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Enable Pulumi mocking
jest.mock('@pulumi/pulumi');
jest.mock('@pulumi/aws');

describe('TapStack Structure', () => {
  let stack: TapStack;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();

    // Mock Pulumi runtime behavior
    (pulumi as any).all = jest
      .fn()
      .mockImplementation(values => ({
        apply: (fn: any) => fn(values),
        promise: () => Promise.resolve(values),
      }));
    (pulumi as any).Output = jest.fn().mockImplementation(value => ({
      promise: () => Promise.resolve(value),
      apply: (fn: any) => fn(value),
    }));
    (pulumi as any).output = jest.fn().mockImplementation(value => ({
      promise: () => Promise.resolve(value),
      apply: (fn: any) => fn(value),
    }));
    (pulumi as any).getStack = jest.fn().mockReturnValue('test-stack');

    // Mock AWS functions
    (aws as any).getAvailabilityZones = jest.fn().mockReturnValue({
      then: (callback: any) => callback({
        names: ['us-west-2a', 'us-west-2b', 'us-west-2c']
      })
    });

    // Mock IAM policy document
    (aws.iam as any).getPolicyDocument = jest.fn().mockReturnValue({
      then: (callback: any) => callback({
        json: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
            Action: 'sts:AssumeRole'
          }]
        })
      })
    });

    // Mock Pulumi Config
    (pulumi.Config as any) = jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue('test-value'),
      require: jest.fn().mockReturnValue('test-value'),
    }));
  });

  describe('with props', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackWithProps', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'prod',
          TestTag: 'test-value',
        },
      });
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('creates AWS provider with correct region', async () => {
      expect(aws.Provider).toHaveBeenCalledWith(
        'aws',
        expect.objectContaining({
          region: 'us-west-2',
        })
      );
    });

    it('uses custom state bucket name', async () => {
      expect(pulumi.Config).toHaveBeenCalledWith('tapstack');
      // Add assertions for your state bucket configuration
    });
  });

  describe('with default values', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackDefault', {});
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('uses default AWS region', async () => {
      expect(aws.Provider).toHaveBeenCalledWith(
        'aws',
        expect.objectContaining({
          region: expect.any(String), // Your default region
        })
      );
    });
  });
});
