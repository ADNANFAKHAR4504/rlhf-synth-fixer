/**
 * Unit tests for index.ts module
 *
 * Tests validate the main entry point and exported stack functionality.
 */

describe('Index Module', () => {
  test('Index module exports are defined', () => {
    const indexModule = require('../lib/index');

    expect(indexModule).toBeDefined();
  });

  test('Index module exports vpcId', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.vpcId).toBeDefined();
  });

  test('Index module exports publicSubnetIds', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.publicSubnetIds).toBeDefined();
    expect(Array.isArray(indexModule.publicSubnetIds)).toBe(true);
  });

  test('Index module exports privateSubnetIds', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.privateSubnetIds).toBeDefined();
    expect(Array.isArray(indexModule.privateSubnetIds)).toBe(true);
  });

  test('Index module exports ecsClusterName', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.ecsClusterName).toBeDefined();
  });

  test('Index module exports ecsClusterArn', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.ecsClusterArn).toBeDefined();
  });

  test('Index module exports ecsServiceName', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.ecsServiceName).toBeDefined();
  });

  test('Index module exports albDnsName', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.albDnsName).toBeDefined();
  });

  test('Index module exports albArn', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.albArn).toBeDefined();
  });

  test('Index module exports auroraEndpoint', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.auroraEndpoint).toBeDefined();
  });

  test('Index module exports auroraReaderEndpoint', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.auroraReaderEndpoint).toBeDefined();
  });

  test('Index module exports auroraClusterId', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.auroraClusterId).toBeDefined();
  });

  test('Index module exports snsTopicArn', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.snsTopicArn).toBeDefined();
  });

  test('Index module exports dashboardName', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.dashboardName).toBeDefined();
  });

  test('Index module creates infrastructure components', () => {
    const indexModule = require('../lib/index');

    // Verify that components were instantiated by checking exports
    expect(indexModule.vpcId).toBeDefined();
    expect(indexModule.ecsClusterName).toBeDefined();
    expect(indexModule.auroraEndpoint).toBeDefined();
  });

  test('Index module outputs are Pulumi Outputs', () => {
    const indexModule = require('../lib/index');
    const pulumi = require('@pulumi/pulumi');

    // Check that exports are Pulumi Output objects
    expect(indexModule.vpcId).toBeDefined();
    expect(typeof indexModule.vpcId.apply).toBe('function');
  });

  test('Index module subnet arrays are populated', () => {
    const indexModule = require('../lib/index');

    expect(indexModule.publicSubnetIds).toBeDefined();
    expect(indexModule.publicSubnetIds.length).toBeGreaterThan(0);

    expect(indexModule.privateSubnetIds).toBeDefined();
    expect(indexModule.privateSubnetIds.length).toBeGreaterThan(0);
  });

  test('Index module exports match expected types', () => {
    const indexModule = require('../lib/index');

    // VPC outputs
    expect(indexModule.vpcId).toBeDefined();
    expect(indexModule.publicSubnetIds).toBeDefined();
    expect(indexModule.privateSubnetIds).toBeDefined();

    // ECS outputs
    expect(indexModule.ecsClusterName).toBeDefined();
    expect(indexModule.ecsClusterArn).toBeDefined();
    expect(indexModule.ecsServiceName).toBeDefined();

    // ALB outputs
    expect(indexModule.albDnsName).toBeDefined();
    expect(indexModule.albArn).toBeDefined();

    // Aurora outputs
    expect(indexModule.auroraEndpoint).toBeDefined();
    expect(indexModule.auroraReaderEndpoint).toBeDefined();
    expect(indexModule.auroraClusterId).toBeDefined();

    // Monitoring outputs
    expect(indexModule.snsTopicArn).toBeDefined();
    expect(indexModule.dashboardName).toBeDefined();
  });
});
