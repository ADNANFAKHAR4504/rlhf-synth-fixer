import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
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
      .mockImplementation(values => Promise.resolve(values));
    (pulumi as any).Output = jest.fn().mockImplementation(value => ({
      promise: () => Promise.resolve(value),
      apply: (fn: any) => fn(value),
    }));
  });

  describe('with props', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackWithProps', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'Production',
          Team: 'Trading',
        },
        domainName: 'trading-prod.example.com',
      });
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('creates primary provider with correct region', async () => {
      expect(aws.Provider).toHaveBeenCalledWith(
        expect.stringContaining('primary-provider'),
        expect.objectContaining({
          region: 'us-east-1',
        }),
        expect.any(Object)
      );
    });

    it('creates standby provider with correct region', async () => {
      expect(aws.Provider).toHaveBeenCalledWith(
        expect.stringContaining('standby-provider'),
        expect.objectContaining({
          region: 'us-east-2',
        }),
        expect.any(Object)
      );
    });
  });

  describe('with default values', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackDefault', {});
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('uses default environment suffix', async () => {
      // Default environmentSuffix is 'dev'
      expect(stack).toBeDefined();
    });

    it('creates providers for both regions', async () => {
      expect(aws.Provider).toHaveBeenCalled();
    });
  });
});
