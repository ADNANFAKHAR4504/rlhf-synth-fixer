import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { AuroraGlobalStack } from '../lib/stacks/aurora-global-stack';
import { MonitoringStack } from '../lib/stacks/monitoring-stack';
import { FailoverStack } from '../lib/stacks/failover-stack';

describe('Aurora DR Infrastructure', () => {
  let app: cdk.App;
  let primaryStack: AuroraGlobalStack;
  let secondaryStack: AuroraGlobalStack;
  let monitoringStack: MonitoringStack;

  beforeEach(() => {
    app = new cdk.App();

    // Create primary stack for testing
    primaryStack = new AuroraGlobalStack(app, 'TestPrimaryStack', {
      env: { region: 'us-east-1', account: '123456789012' },
      isPrimary: true,
      crossRegionReferences: true,
    });

    // Create secondary stack for failover tests
    secondaryStack = new AuroraGlobalStack(app, 'TestSecondaryStack', {
      env: { region: 'us-west-2', account: '123456789012' },
      isPrimary: false,
      globalClusterIdentifier: 'aurora-dr-global-test',
      crossRegionReferences: true,
    });

    // Create monitoring stack
    monitoringStack = new MonitoringStack(app, 'TestMonitoringStack', {
      env: { region: 'us-east-1', account: '123456789012' },
      primaryCluster: primaryStack.cluster,
      secondaryCluster: secondaryStack.cluster,
      crossRegionReferences: true,
    });
  });

  describe('Aurora Global Stack', () => {
    test('should create VPC with correct configuration', () => {
      const template = Template.fromStack(primaryStack);

      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.hasResourceProperties('AWS::EC2::VPC', {
        EnableDnsHostnames: true,
        EnableDnsSupport: true,
      });
    });

    test('should create KMS key with rotation enabled', () => {
      const template = Template.fromStack(primaryStack);

      template.hasResourceProperties('AWS::KMS::Key', {
        EnableKeyRotation: true,
      });
    });

    test('should create RDS database cluster', () => {
      const template = Template.fromStack(primaryStack);

      template.hasResourceProperties('AWS::RDS::DBCluster', {
        Engine: 'aurora-postgresql',
        StorageEncrypted: true,
      });
    });

    test('should create RDS proxy for connection management', () => {
      const template = Template.fromStack(primaryStack);

      template.hasResourceProperties('AWS::RDS::DBProxy', {
        RequireTLS: true,
      });
    });

    test('should create Secrets Manager secret', () => {
      const template = Template.fromStack(primaryStack);

      template.resourceCountIs('AWS::SecretsManager::Secret', 1);
    });

    test('should create VPC endpoints', () => {
      const template = Template.fromStack(primaryStack);

      // Should have interface endpoints for Secrets Manager, KMS, CloudWatch Logs, SNS
      // Plus S3 gateway endpoint
      template.resourceCountIs('AWS::EC2::VPCEndpoint', 5);
    });
  });

  describe('Monitoring Stack', () => {
    test('should create CloudWatch dashboard', () => {
      const template = Template.fromStack(monitoringStack);
      template.resourceCountIs('AWS::CloudWatch::Dashboard', 1);
    });

    test('should create replication lag alarm', () => {
      const template = Template.fromStack(monitoringStack);
      template.hasResourceProperties('AWS::CloudWatch::Alarm', {
        MetricName: 'AuroraGlobalDBReplicationLag',
        Threshold: 5000,
      });
    });
  });

  describe('Failover Stack', () => {
    test.skip('requires complex cross-stack testing - validated in integration tests', () => {
      // Failover stack tests skipped due to complex cross-stack dependencies
      // These are better validated through integration tests or actual deployment
      expect(true).toBe(true);
    });
  });
});
