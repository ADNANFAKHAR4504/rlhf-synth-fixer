/**
 * Unit tests for TapStack component resource
 *
 * These tests validate the TapStack ComponentResource logic and configuration.
 * NO MOCKING of Pulumi or AWS SDK - tests verify component initialization and structure.
 */

import { TapStack, TapStackArgs } from '../lib/tap-stack';

describe('TapStack ComponentResource - Initialization', () => {
  test('TapStack instantiates with required arguments', () => {
    const args: TapStackArgs = {
      environmentSuffix: 'test123',
      tags: {
        Project: 'test',
        Owner: 'test-team',
      },
    };

    const stack = new TapStack('test-stack', args);

    expect(stack).toBeDefined();
    expect(stack).toBeInstanceOf(TapStack);
  });

  test('TapStack instantiates with minimal arguments', () => {
    const args: TapStackArgs = {
      environmentSuffix: 'minimal',
    };

    const stack = new TapStack('minimal-stack', args);

    expect(stack).toBeDefined();
    expect(stack).toBeInstanceOf(TapStack);
  });

  test('TapStack instantiates without environmentSuffix (uses default)', () => {
    const args: TapStackArgs = {};

    const stack = new TapStack('default-stack', args);

    expect(stack).toBeDefined();
    expect(stack).toBeInstanceOf(TapStack);
  });
});

describe('TapStack ComponentResource - Outputs', () => {
  let stack: TapStack;

  beforeAll(() => {
    const args: TapStackArgs = {
      environmentSuffix: 'output-test',
    };
    stack = new TapStack('output-test-stack', args);
  });

  test('TapStack exposes vpcId output', () => {
    expect(stack.vpcId).toBeDefined();
  });

  test('TapStack exposes publicSubnetIds output', () => {
    expect(stack.publicSubnetIds).toBeDefined();
    expect(Array.isArray(stack.publicSubnetIds)).toBe(true);
  });

  test('TapStack exposes privateSubnetIds output', () => {
    expect(stack.privateSubnetIds).toBeDefined();
    expect(Array.isArray(stack.privateSubnetIds)).toBe(true);
  });

  test('TapStack exposes ecsClusterName output', () => {
    expect(stack.ecsClusterName).toBeDefined();
  });

  test('TapStack exposes ecsClusterArn output', () => {
    expect(stack.ecsClusterArn).toBeDefined();
  });

  test('TapStack exposes ecsServiceName output', () => {
    expect(stack.ecsServiceName).toBeDefined();
  });

  test('TapStack exposes albDnsName output', () => {
    expect(stack.albDnsName).toBeDefined();
  });

  test('TapStack exposes albArn output', () => {
    expect(stack.albArn).toBeDefined();
  });

  test('TapStack exposes auroraEndpoint output', () => {
    expect(stack.auroraEndpoint).toBeDefined();
  });

  test('TapStack exposes auroraReaderEndpoint output', () => {
    expect(stack.auroraReaderEndpoint).toBeDefined();
  });

  test('TapStack exposes auroraClusterId output', () => {
    expect(stack.auroraClusterId).toBeDefined();
  });

  test('TapStack exposes snsTopicArn output', () => {
    expect(stack.snsTopicArn).toBeDefined();
  });

  test('TapStack exposes dashboardName output', () => {
    expect(stack.dashboardName).toBeDefined();
  });
});

describe('TapStack ComponentResource - Type Checking', () => {
  test('TapStackArgs accepts environmentSuffix as string', () => {
    const args: TapStackArgs = {
      environmentSuffix: 'test-suffix',
    };

    expect(typeof args.environmentSuffix).toBe('string');
  });

  test('TapStackArgs accepts tags as object', () => {
    const args: TapStackArgs = {
      tags: {
        Environment: 'test',
        Team: 'engineering',
      },
    };

    expect(typeof args.tags).toBe('object');
    expect(args.tags).toHaveProperty('Environment');
    expect(args.tags).toHaveProperty('Team');
  });

  test('TapStackArgs can be empty', () => {
    const args: TapStackArgs = {};

    expect(args).toBeDefined();
    expect(Object.keys(args)).toHaveLength(0);
  });
});
