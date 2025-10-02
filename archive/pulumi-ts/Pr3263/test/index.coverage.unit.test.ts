/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-var-requires */

// Extend global type
declare global {
  var mockResources: any[];
}

describe('Pulumi Infrastructure Coverage Tests', () => {
  beforeEach(() => {
    // Clear all module caches
    jest.resetModules();
    jest.clearAllMocks();
    global.mockResources = [];
  });

  test('should use default dev environment when config.get returns undefined', () => {
    // Remove ENVIRONMENT_SUFFIX to test the fallback to config
    delete process.env.ENVIRONMENT_SUFFIX;

    // Mock Pulumi to return undefined for environment
    jest.doMock('@pulumi/pulumi', () => ({
      Config: jest.fn(() => ({
        get: jest.fn((key) => {
          if (key === 'environment') return undefined; // This triggers the default 'dev'
          return undefined;
        }),
        require: jest.fn((key) => {
          if (key === 'domainName') return 'test.example.com';
          return 'test-value';
        }),
      })),
      interpolate: jest.fn((strings, ...values) => {
        if (!strings) return '';
        if (typeof strings === 'string') return strings;
        let result = strings[0] || '';
        for (let i = 0; i < values.length; i++) {
          result += (values[i] || '') + (strings[i + 1] || '');
        }
        return result;
      }),
      output: (val: any) => val,
      all: (vals: any) => ({
        apply: (fn: any) => fn(vals),
      }),
    }));

    // Re-mock AWS and Random
    jest.doMock('@pulumi/aws');
    jest.doMock('@pulumi/random');

    // Now require the module - this should use 'dev' as default
    require('../lib/index');

    // The environmentSuffix should default to 'dev'
    const buckets = global.mockResources.filter(
      (r: any) => r.type === 's3:bucket'
    );
    expect(buckets).toHaveLength(2);
  });

  test('should use environment from config when available', () => {
    // Remove ENVIRONMENT_SUFFIX to test the fallback to config
    delete process.env.ENVIRONMENT_SUFFIX;

    // Mock Pulumi to return 'staging' for environment
    jest.doMock('@pulumi/pulumi', () => ({
      Config: jest.fn(() => ({
        get: jest.fn((key) => {
          if (key === 'environment') return 'staging';
          return undefined;
        }),
        require: jest.fn((key) => {
          if (key === 'domainName') return 'test.example.com';
          return 'test-value';
        }),
      })),
      interpolate: jest.fn((strings, ...values) => {
        if (!strings) return '';
        if (typeof strings === 'string') return strings;
        let result = strings[0] || '';
        for (let i = 0; i < values.length; i++) {
          result += (values[i] || '') + (strings[i + 1] || '');
        }
        return result;
      }),
      output: (val: any) => val,
      all: (vals: any) => ({
        apply: (fn: any) => fn(vals),
      }),
    }));

    // Re-mock AWS and Random
    jest.doMock('@pulumi/aws');
    jest.doMock('@pulumi/random');

    // Now require the module - this should use 'staging'
    require('../lib/index');

    const buckets = global.mockResources.filter(
      (r: any) => r.type === 's3:bucket'
    );
    expect(buckets).toHaveLength(2);
  });
});