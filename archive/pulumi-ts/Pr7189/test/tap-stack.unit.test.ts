/**
 * Unit Tests for TapStack Infrastructure
 *
 * This file contains unit tests for the infrastructure components.
 * Tests validate module exports, configuration, and structure.
 * Uses Pulumi mocking to test without actual AWS resources.
 */

import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi mocking for tests
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, any>;
  } => {
    return {
      id: args.name + '_id',
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
        id: 'us-east-1',
      };
    }
    return args.inputs;
  },
});

// Set required Pulumi configuration for tests
// This must be set before importing the tap-stack module
// In test mode, Pulumi uses "project" as the default namespace when Pulumi.yaml isn't loaded
// We set both namespaces to ensure compatibility
pulumi.runtime.setConfig('TapStack:environmentSuffix', 'test');

// Note: dbPassword is now handled via AWS Secrets Manager, so no config needed

// Helper function to reset modules and set environment variable
function resetModulesAndSetEnv(envSuffix?: string) {
  // Reset all modules - this is the key to forcing re-evaluation
  jest.resetModules();

  // Set or delete environment variable AFTER resetting modules
  if (envSuffix !== undefined) {
    process.env.ENVIRONMENT_SUFFIX = envSuffix;
  } else {
    delete process.env.ENVIRONMENT_SUFFIX;
  }
}

// ============================================================================
// Module Exports Tests
// ============================================================================

describe('TapStack Module - Exports', () => {
  const originalEnv = process.env.ENVIRONMENT_SUFFIX;

  beforeEach(() => {
    // Reset modules and set a consistent env var for export tests
    resetModulesAndSetEnv('test');
  });

  afterEach(() => {
    // Restore original env
    if (originalEnv) {
      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    } else {
      delete process.env.ENVIRONMENT_SUFFIX;
    }
  });

  test('Module exports primaryDatabaseEndpoint', () => {
    const tapStack = require('../lib/tap-stack');
    expect(tapStack.primaryDatabaseEndpoint).toBeDefined();
  });

  test('Module exports secondaryDatabaseEndpoint', () => {
    const tapStack = require('../lib/tap-stack');
    expect(tapStack.secondaryDatabaseEndpoint).toBeDefined();
  });

  test('Module exports primaryBucketName', () => {
    const tapStack = require('../lib/tap-stack');
    expect(tapStack.primaryBucketName).toBeDefined();
  });

  test('Module exports secondaryBucketName', () => {
    const tapStack = require('../lib/tap-stack');
    expect(tapStack.secondaryBucketName).toBeDefined();
  });

  test('Module exports route53HostedZoneId', () => {
    const tapStack = require('../lib/tap-stack');
    expect(tapStack.route53HostedZoneId).toBeDefined();
  });

  test('Module exports route53DnsName', () => {
    const tapStack = require('../lib/tap-stack');
    expect(tapStack.route53DnsName).toBeDefined();
    expect(typeof tapStack.route53DnsName).toBe('string');
    // Should contain the environment suffix from beforeEach
    expect(tapStack.route53DnsName).toContain('test');
  });

  test('Module exports primaryVpcId', () => {
    const tapStack = require('../lib/tap-stack');
    expect(tapStack.primaryVpcId).toBeDefined();
  });

  test('Module exports secondaryVpcId', () => {
    const tapStack = require('../lib/tap-stack');
    expect(tapStack.secondaryVpcId).toBeDefined();
  });

  test('Module exports vpcPeeringConnectionId', () => {
    const tapStack = require('../lib/tap-stack');
    expect(tapStack.vpcPeeringConnectionId).toBeDefined();
  });

  test('Module exports primaryLambdaArn', () => {
    const tapStack = require('../lib/tap-stack');
    expect(tapStack.primaryLambdaArn).toBeDefined();
  });

  test('Module exports secondaryLambdaArn', () => {
    const tapStack = require('../lib/tap-stack');
    expect(tapStack.secondaryLambdaArn).toBeDefined();
  });

  test('Module exports dbSecretArn', () => {
    const tapStack = require('../lib/tap-stack');
    expect(tapStack.dbSecretArn).toBeDefined();
    // Secret ARN should be a Pulumi Output (from Secrets Manager)
    expect(tapStack.dbSecretArn).toBeDefined();
    // Verify it's exported (not undefined)
    expect(tapStack.dbSecretArn).not.toBeUndefined();
  });
});

// ============================================================================
// Environment Suffix Configuration Tests
// ============================================================================

describe('TapStack Module - Environment Suffix Configuration', () => {
  const originalEnv = process.env.ENVIRONMENT_SUFFIX;

  afterEach(() => {
    // Restore original env after each test
    if (originalEnv) {
      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    } else {
      delete process.env.ENVIRONMENT_SUFFIX;
    }
  });

  test('Uses ENVIRONMENT_SUFFIX from environment variable', () => {
    // Reset modules, set env var, THEN require
    resetModulesAndSetEnv('test-env-123');
    const tapStack = require('../lib/tap-stack');

    // Verify route53DnsName contains the environment suffix
    expect(tapStack.route53DnsName).toBe('db.tradingdb-test-env-123.test.local');
    expect(tapStack.route53DnsName).toContain('test-env-123');
  });

  test('Falls back to default when ENVIRONMENT_SUFFIX is not set', () => {
    // Reset modules, delete env var, THEN require
    resetModulesAndSetEnv(undefined);
    const tapStack = require('../lib/tap-stack');

    // Should use default 'dev' (from line 10 of tap-stack.ts)
    expect(tapStack.route53DnsName).toBeDefined();
    expect(typeof tapStack.route53DnsName).toBe('string');
    expect(tapStack.route53DnsName).toBe('db.tradingdb-dev.test.local');
    expect(tapStack.route53DnsName).toContain('dev');
  });

  test('Handles different environment suffix values', () => {
    const testSuffixes = ['dev', 'staging', 'prod', 'pr1234', 'test-env'];

    testSuffixes.forEach(suffix => {
      // Reset modules, set env var, THEN require for each suffix
      resetModulesAndSetEnv(suffix);
      const tapStack = require('../lib/tap-stack');

      // Verify the exact format matches implementation
      const expectedDnsName = `db.tradingdb-${suffix}.test.local`;
      expect(tapStack.route53DnsName).toBe(expectedDnsName);
      expect(tapStack.route53DnsName).toContain(suffix);
    });
  });

  test('Handles numeric environment suffix', () => {
    // Reset modules, set env var, THEN require
    resetModulesAndSetEnv('12345');
    const tapStack = require('../lib/tap-stack');

    expect(tapStack.route53DnsName).toBe('db.tradingdb-12345.test.local');
    expect(tapStack.route53DnsName).toContain('12345');
  });

  test('Handles long environment suffix', () => {
    const longSuffix = 'very-long-environment-suffix-for-testing';
    // Reset modules, set env var, THEN require
    resetModulesAndSetEnv(longSuffix);
    const tapStack = require('../lib/tap-stack');

    expect(tapStack.route53DnsName).toBe(`db.tradingdb-${longSuffix}.test.local`);
    expect(tapStack.route53DnsName).toContain(longSuffix);
  });
});

// ============================================================================
// Output Type Tests
// ============================================================================

describe('TapStack Module - Output Types', () => {
  const originalEnv = process.env.ENVIRONMENT_SUFFIX;

  afterEach(() => {
    if (originalEnv) {
      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    } else {
      delete process.env.ENVIRONMENT_SUFFIX;
    }
  });

  test('All exports are Pulumi Outputs or strings', () => {
    resetModulesAndSetEnv('test');
    const tapStack = require('../lib/tap-stack');

    // Database endpoints should be Pulumi Outputs (from cluster.endpoint)
    expect(tapStack.primaryDatabaseEndpoint).toBeDefined();
    expect(tapStack.secondaryDatabaseEndpoint).toBeDefined();

    // Bucket names should be Pulumi Outputs (from bucket.id)
    expect(tapStack.primaryBucketName).toBeDefined();
    expect(tapStack.secondaryBucketName).toBeDefined();

    // VPC IDs should be Pulumi Outputs (from vpc.id)
    expect(tapStack.primaryVpcId).toBeDefined();
    expect(tapStack.secondaryVpcId).toBeDefined();

    // Route53 DNS name should be a string (from line 1096: template literal)
    expect(typeof tapStack.route53DnsName).toBe('string');
    expect(tapStack.route53DnsName).toBe('db.tradingdb-test.test.local');

    // Route53 Hosted Zone ID should be Pulumi Output (from zone.zoneId)
    expect(tapStack.route53HostedZoneId).toBeDefined();

    // Lambda ARNs should be Pulumi Outputs (from lambda.arn)
    expect(tapStack.primaryLambdaArn).toBeDefined();
    expect(tapStack.secondaryLambdaArn).toBeDefined();

    // VPC Peering Connection ID should be Pulumi Output (from peering.id)
    expect(tapStack.vpcPeeringConnectionId).toBeDefined();
  });

  test('Route53 DNS name follows expected format', () => {
    // Reset modules, set env var, THEN require
    resetModulesAndSetEnv('format-test');
    const tapStack = require('../lib/tap-stack');

    // Verify format matches implementation: `db.tradingdb-${environmentSuffix}.test.local`
    expect(tapStack.route53DnsName).toMatch(/^db\.tradingdb-.*\.test\.local$/);
    expect(tapStack.route53DnsName).toBe('db.tradingdb-format-test.test.local');
  });
});

// ============================================================================
// Module Structure Tests
// ============================================================================

describe('TapStack Module - Structure', () => {
  const originalEnv = process.env.ENVIRONMENT_SUFFIX;

  afterEach(() => {
    if (originalEnv) {
      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    } else {
      delete process.env.ENVIRONMENT_SUFFIX;
    }
  });

  test('Module can be imported without errors', () => {
    resetModulesAndSetEnv('test');
    expect(() => {
      require('../lib/tap-stack');
    }).not.toThrow();
  });

  test('Module exports all expected resources', () => {
    resetModulesAndSetEnv('test');
    const tapStack = require('../lib/tap-stack');

    const expectedExports = [
      'primaryDatabaseEndpoint',
      'secondaryDatabaseEndpoint',
      'primaryBucketName',
      'secondaryBucketName',
      'route53HostedZoneId',
      'route53DnsName',
      'primaryVpcId',
      'secondaryVpcId',
      'vpcPeeringConnectionId',
      'primaryLambdaArn',
      'secondaryLambdaArn',
      'dbSecretArn',
    ];

    expectedExports.forEach(exportName => {
      expect(tapStack).toHaveProperty(exportName);
      expect(tapStack[exportName]).toBeDefined();
    });
  });

  test('Module handles multiple imports', () => {
    resetModulesAndSetEnv('test');

    const tapStack1 = require('../lib/tap-stack');
    const tapStack2 = require('../lib/tap-stack');

    // Both should have the same exports (cached after first require)
    expect(tapStack1.primaryVpcId).toBeDefined();
    expect(tapStack2.primaryVpcId).toBeDefined();
    expect(tapStack1.route53DnsName).toBe(tapStack2.route53DnsName);
  });
});

// ============================================================================
// Resource Naming Tests
// ============================================================================

describe('TapStack Module - Resource Naming', () => {
  const originalEnv = process.env.ENVIRONMENT_SUFFIX;

  afterEach(() => {
    // Restore original env after each test
    if (originalEnv) {
      process.env.ENVIRONMENT_SUFFIX = originalEnv;
    } else {
      delete process.env.ENVIRONMENT_SUFFIX;
    }
  });

  test('Route53 DNS name includes environment suffix', () => {
    // Reset modules, set env var, THEN require
    resetModulesAndSetEnv('naming-test');
    const tapStack = require('../lib/tap-stack');

    // Verify exact format from implementation (line 1096)
    expect(tapStack.route53DnsName).toBe('db.tradingdb-naming-test.test.local');
    expect(tapStack.route53DnsName).toContain('naming-test');
  });

  test('Route53 DNS name format is consistent', () => {
    const suffixes = ['dev', 'staging', 'prod'];

    suffixes.forEach(suffix => {
      // Reset modules, set env var, THEN require for each suffix
      resetModulesAndSetEnv(suffix);
      const tapStack = require('../lib/tap-stack');

      // Verify format matches implementation: `db.tradingdb-${environmentSuffix}.test.local`
      expect(tapStack.route53DnsName).toMatch(/^db\.tradingdb-.*\.test\.local$/);
      expect(tapStack.route53DnsName).toBe(`db.tradingdb-${suffix}.test.local`);
    });
  });

  test('Route53 DNS name uses environment suffix in all cases', () => {
    // Test that the DNS name always includes the environment suffix
    const testCases = [
      { suffix: 'pr123', expected: 'db.tradingdb-pr123.test.local' },
      { suffix: 'qa', expected: 'db.tradingdb-qa.test.local' },
      { suffix: 'prod-us-east-1', expected: 'db.tradingdb-prod-us-east-1.test.local' },
    ];

    testCases.forEach(({ suffix, expected }) => {
      resetModulesAndSetEnv(suffix);
      const tapStack = require('../lib/tap-stack');

      expect(tapStack.route53DnsName).toBe(expected);
    });
  });
});
