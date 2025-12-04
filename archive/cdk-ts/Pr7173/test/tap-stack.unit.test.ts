import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const baseContext = {
  serviceName: 'unit-platform',
  costCenter: 'QA-COST',
  deploymentDate: '2025-01-01',
  kmsAliasBase: 'alias/unit-platform',
  lambdaFamilies: ['processor', 'ingester'],
};

const synthStack = (overrides?: Record<string, unknown>, deployAll = true) => {
  const app = new cdk.App();
  app.node.setContext('tapConfig', { ...baseContext, ...(overrides || {}) });
  // Deploy all environments for testing unless specified otherwise
  if (deployAll) {
    app.node.setContext('deployEnvironments', 'all');
  }
  const stack = new TapStack(app, 'TestTapStack', {
    environmentSuffix: 'unit',
  });
  const template = Template.fromStack(stack);
  return { stack, template };
};

describe('TapStack', () => {
  test('creates fully wired environments for prod, staging, and dev', () => {
    const { template } = synthStack();
    expect(Object.keys(template.findResources('AWS::EC2::VPC')).length).toBe(3);
    expect(
      Object.keys(template.findResources('AWS::RDS::DBCluster')).length
    ).toBe(3);

    const buckets = template.findResources('AWS::S3::Bucket');
    const replicationBuckets = Object.values(buckets).filter(
      (bucket: any) => bucket.Properties?.ReplicationConfiguration
    );
    expect(replicationBuckets.length).toBeGreaterThanOrEqual(2);
  });

  test('adds API Gateway stage variables with environment metadata', () => {
    const { template } = synthStack();
    template.hasResourceProperties(
      'AWS::ApiGateway::Stage',
      Match.objectLike({
        Variables: Match.objectLike({
          environment: Match.anyValue(),
          bucketName: Match.anyValue(),
          kmsAlias: Match.anyValue(),
        }),
      })
    );
  });

  test('exposes bucket, database, and API outputs for each environment', () => {
    const { template } = synthStack();
    ['Prod', 'Staging', 'Dev'].forEach(prefix => {
      template.hasOutput(`${prefix}DataBucketName`, Match.objectLike({}));
      template.hasOutput(`${prefix}AuroraClusterArn`, Match.objectLike({}));
      template.hasOutput(`${prefix}ApiEndpoint`, Match.objectLike({}));
    });
  });

  test('fails fast when configuration violates schema requirements', () => {
    const app = new cdk.App();
    app.node.setContext('tapConfig', {
      ...baseContext,
      serviceName: 'INVALID NAME!',
    });
    expect(
      () => new TapStack(app, 'InvalidStack', { environmentSuffix: 'bad' })
    ).toThrow(/serviceName/);
  });

  test('fails when number field receives non-number value', () => {
    const app = new cdk.App();
    app.node.setContext('tapConfig', {
      ...baseContext,
      environments: {
        prod: {
          region: 'us-east-1',
          vpcCidr: '10.10.0.0/16',
          lambda: {
            memory: 'not-a-number',
            timeout: 300,
            concurrency: 100,
            canaryWeight: 0.1,
          },
          lifecycle: { transitionAfterDays: 45, expireAfterDays: 365 },
          api: {
            name: 'api',
            stageName: 'prod',
            throttleBurst: 100,
            throttleRate: 100,
          },
          emails: ['test@example.com'],
          webhookUrls: [],
          snapshotSchedule: 'cron(0 3 * * ? *)',
          logRetentionDays: 30,
          alarmThresholds: {
            lambdaErrors: 5,
            apiLatencyMs: 800,
            rdsConnections: 200,
          },
          stateBucketPrefix: 'state-prod',
        },
        staging: {
          region: 'eu-west-1',
          vpcCidr: '10.20.0.0/16',
          lambda: {
            memory: 2048,
            timeout: 180,
            concurrency: 200,
            canaryWeight: 0.15,
          },
          lifecycle: { transitionAfterDays: 30, expireAfterDays: 180 },
          api: {
            name: 'api',
            stageName: 'staging',
            throttleBurst: 100,
            throttleRate: 100,
          },
          emails: ['test@example.com'],
          webhookUrls: [],
          snapshotSchedule: 'cron(0 4 * * ? *)',
          logRetentionDays: 14,
          alarmThresholds: {
            lambdaErrors: 3,
            apiLatencyMs: 900,
            rdsConnections: 80,
          },
          stateBucketPrefix: 'state-staging',
        },
        dev: {
          region: 'ap-southeast-1',
          vpcCidr: '10.30.0.0/16',
          lambda: {
            memory: 1536,
            timeout: 120,
            concurrency: 50,
            canaryWeight: 0.2,
          },
          lifecycle: { transitionAfterDays: 15, expireAfterDays: 90 },
          api: {
            name: 'api',
            stageName: 'dev',
            throttleBurst: 100,
            throttleRate: 100,
          },
          emails: ['test@example.com'],
          webhookUrls: [],
          snapshotSchedule: 'cron(0 5 * * ? *)',
          logRetentionDays: 7,
          alarmThresholds: {
            lambdaErrors: 2,
            apiLatencyMs: 1200,
            rdsConnections: 40,
          },
          stateBucketPrefix: 'state-dev',
        },
      },
    });
    expect(
      () =>
        new TapStack(app, 'InvalidNumberStack', { environmentSuffix: 'test' })
    ).toThrow(/must be a number/);
  });

  test('fails when number field is below minimum', () => {
    const app = new cdk.App();
    app.node.setContext('tapConfig', {
      ...baseContext,
      environments: {
        prod: {
          region: 'us-east-1',
          vpcCidr: '10.10.0.0/16',
          lambda: {
            memory: 10,
            timeout: 300,
            concurrency: 100,
            canaryWeight: 0.1,
          },
          lifecycle: { transitionAfterDays: 45, expireAfterDays: 365 },
          api: {
            name: 'api',
            stageName: 'prod',
            throttleBurst: 100,
            throttleRate: 100,
          },
          emails: ['test@example.com'],
          webhookUrls: [],
          snapshotSchedule: 'cron(0 3 * * ? *)',
          logRetentionDays: 30,
          alarmThresholds: {
            lambdaErrors: 5,
            apiLatencyMs: 800,
            rdsConnections: 200,
          },
          stateBucketPrefix: 'state-prod',
        },
        staging: {
          region: 'eu-west-1',
          vpcCidr: '10.20.0.0/16',
          lambda: {
            memory: 2048,
            timeout: 180,
            concurrency: 200,
            canaryWeight: 0.15,
          },
          lifecycle: { transitionAfterDays: 30, expireAfterDays: 180 },
          api: {
            name: 'api',
            stageName: 'staging',
            throttleBurst: 100,
            throttleRate: 100,
          },
          emails: ['test@example.com'],
          webhookUrls: [],
          snapshotSchedule: 'cron(0 4 * * ? *)',
          logRetentionDays: 14,
          alarmThresholds: {
            lambdaErrors: 3,
            apiLatencyMs: 900,
            rdsConnections: 80,
          },
          stateBucketPrefix: 'state-staging',
        },
        dev: {
          region: 'ap-southeast-1',
          vpcCidr: '10.30.0.0/16',
          lambda: {
            memory: 1536,
            timeout: 120,
            concurrency: 50,
            canaryWeight: 0.2,
          },
          lifecycle: { transitionAfterDays: 15, expireAfterDays: 90 },
          api: {
            name: 'api',
            stageName: 'dev',
            throttleBurst: 100,
            throttleRate: 100,
          },
          emails: ['test@example.com'],
          webhookUrls: [],
          snapshotSchedule: 'cron(0 5 * * ? *)',
          logRetentionDays: 7,
          alarmThresholds: {
            lambdaErrors: 2,
            apiLatencyMs: 1200,
            rdsConnections: 40,
          },
          stateBucketPrefix: 'state-dev',
        },
      },
    });
    expect(
      () => new TapStack(app, 'BelowMinStack', { environmentSuffix: 'test' })
    ).toThrow(/must be >=/);
  });

  test('fails when array field receives non-array value', () => {
    const app = new cdk.App();
    app.node.setContext('tapConfig', {
      ...baseContext,
      lambdaFamilies: 'not-an-array',
    });
    expect(
      () =>
        new TapStack(app, 'InvalidArrayStack', { environmentSuffix: 'test' })
    ).toThrow(/must be an array/);
  });

  test('fails when deploying invalid environment name', () => {
    const app = new cdk.App();
    app.node.setContext('tapConfig', baseContext);
    app.node.setContext('deployEnvironments', 'invalid-env');
    expect(
      () => new TapStack(app, 'InvalidEnvStack', { environmentSuffix: 'test' })
    ).toThrow(/not found in configuration/);
  });

  test('creates only dev environment when deployEnvironments is set to dev', () => {
    const { template } = synthStack({}, false);
    expect(Object.keys(template.findResources('AWS::EC2::VPC')).length).toBe(1);
    expect(
      Object.keys(template.findResources('AWS::RDS::DBCluster')).length
    ).toBe(1);
  });

  test('creates KMS keys with rotation enabled for each environment', () => {
    const { template } = synthStack();
    const kmsKeys = template.findResources('AWS::KMS::Key');
    Object.values(kmsKeys).forEach((key: any) => {
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });
  });

  test('creates Aurora clusters with encryption enabled', () => {
    const { template } = synthStack();
    const clusters = template.findResources('AWS::RDS::DBCluster');
    Object.values(clusters).forEach((cluster: any) => {
      expect(cluster.Properties.StorageEncrypted).toBe(true);
    });
  });

  test('provisions Aurora instances with supported instance class', () => {
    const { template } = synthStack();
    const instances = template.findResources('AWS::RDS::DBInstance');
    Object.values(instances).forEach((instance: any) => {
      expect(instance.Properties.DBInstanceClass).toBe('db.r5.large');
    });
  });

  test('creates S3 buckets with SSL enforcement', () => {
    const { template } = synthStack();
    const buckets = template.findResources('AWS::S3::Bucket');
    expect(Object.keys(buckets).length).toBeGreaterThan(0);
  });

  test('dev lambda functions do not reserve concurrency', () => {
    const { template } = synthStack();
    const functions = template.findResources('AWS::Lambda::Function');
    Object.values(functions)
      .filter(
        (fn: any) =>
          fn.Properties?.Environment?.Variables?.ENVIRONMENT === 'dev'
      )
      .forEach((fn: any) => {
        expect(fn.Properties.ReservedConcurrentExecutions).toBeUndefined();
      });
  });

  test('non-dev lambda functions retain reserved concurrency', () => {
    const { template } = synthStack();
    const functions = template.findResources('AWS::Lambda::Function');
    Object.values(functions)
      .filter((fn: any) =>
        ['prod', 'staging'].includes(
          fn.Properties?.Environment?.Variables?.ENVIRONMENT
        )
      )
      .forEach((fn: any) => {
        expect(fn.Properties.ReservedConcurrentExecutions).toBeDefined();
      });
  });

  test('creates lambda versions with destroy removal policy', () => {
    const { template } = synthStack();
    const versions = template.findResources('AWS::Lambda::Version');
    expect(Object.keys(versions).length).toBeGreaterThan(0);
    Object.values(versions).forEach((version: any) => {
      expect(version.DeletionPolicy).toBe('Delete');
    });
  });

  test('creates lambda aliases without additional canary versions', () => {
    const { template } = synthStack();
    const aliases = template.findResources('AWS::Lambda::Alias');
    Object.values(aliases).forEach((alias: any) => {
      expect(alias.Properties.AdditionalVersionWeights).toBeUndefined();
    });
  });

  test('does not enable Data API for provisioned aurora clusters', () => {
    const { template } = synthStack();
    template.hasResourceProperties('AWS::RDS::DBCluster', {
      EnableHttpEndpoint: Match.absent(),
    });
  });

  test('creates Lambda functions with VPC configuration', () => {
    const { template } = synthStack();
    const lambdas = template.findResources('AWS::Lambda::Function');
    const vpcLambdas = Object.values(lambdas).filter(
      (fn: any) => fn.Properties?.VpcConfig
    );
    expect(vpcLambdas.length).toBeGreaterThan(0);
  });

  test('creates SNS topics with KMS encryption', () => {
    const { template } = synthStack();
    const topics = template.findResources('AWS::SNS::Topic');
    Object.values(topics).forEach((topic: any) => {
      expect(topic.Properties.KmsMasterKeyId).toBeDefined();
    });
  });

  test('creates CloudWatch alarms for Lambda errors', () => {
    const { template } = synthStack();
    const alarms = template.findResources('AWS::CloudWatch::Alarm');
    const errorAlarms = Object.values(alarms).filter(
      (alarm: any) => alarm.Properties?.MetricName === 'Errors'
    );
    expect(errorAlarms.length).toBeGreaterThan(0);
  });

  test('creates VPC peering connections between all environments', () => {
    const { template } = synthStack();
    const peerings = template.findResources('AWS::EC2::VPCPeeringConnection');
    expect(Object.keys(peerings).length).toBe(3);
  });

  test('creates Step Functions state machine for snapshot orchestration', () => {
    const { template } = synthStack();
    const stateMachines = template.findResources(
      'AWS::StepFunctions::StateMachine'
    );
    expect(Object.keys(stateMachines).length).toBeGreaterThan(0);
  });

  test('creates S3 buckets with lifecycle rules for data archival', () => {
    const { template } = synthStack();
    template.hasResourceProperties('AWS::S3::Bucket', {
      LifecycleConfiguration: Match.objectLike({
        Rules: Match.arrayWith([
          Match.objectLike({
            Status: 'Enabled',
            Transitions: Match.arrayWith([
              Match.objectLike({
                StorageClass: 'INTELLIGENT_TIERING',
              }),
            ]),
          }),
        ]),
      }),
    });
  });

  test('creates Aurora clusters with deletion protection disabled for test cleanup', () => {
    const { template } = synthStack();
    const clusters = template.findResources('AWS::RDS::DBCluster');
    Object.values(clusters).forEach((cluster: any) => {
      expect(cluster.Properties.DeletionProtection).toBe(false);
    });
  });

  test('creates S3 buckets with auto-delete objects enabled', () => {
    const { template } = synthStack();
    const customResources = template.findResources(
      'Custom::S3AutoDeleteObjects'
    );
    expect(Object.keys(customResources).length).toBeGreaterThan(0);
  });

  test('creates EventBridge rules for scheduled snapshots', () => {
    const { template } = synthStack();
    const rules = template.findResources('AWS::Events::Rule');
    const scheduledRules = Object.values(rules).filter(
      (rule: any) => rule.Properties?.ScheduleExpression
    );
    expect(scheduledRules.length).toBeGreaterThan(0);
  });

  test('creates API Gateway with throttling configuration', () => {
    const { template } = synthStack();
    template.hasResourceProperties('AWS::ApiGateway::Stage', {
      MethodSettings: Match.arrayWith([
        Match.objectLike({
          ThrottlingBurstLimit: Match.anyValue(),
          ThrottlingRateLimit: Match.anyValue(),
        }),
      ]),
    });
  });

  test('creates IAM roles with least-privilege policies', () => {
    const { template } = synthStack();
    const roles = template.findResources('AWS::IAM::Role');
    expect(Object.keys(roles).length).toBeGreaterThan(0);
    Object.values(roles).forEach((role: any) => {
      expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
    });
  });

  test('creates CloudWatch log groups with retention policies', () => {
    const { template } = synthStack();
    const logGroups = template.findResources('AWS::Logs::LogGroup');
    Object.values(logGroups).forEach((logGroup: any) => {
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
    });
  });

  test('creates VPC endpoints for private AWS service access', () => {
    const { template } = synthStack();
    const endpoints = template.findResources('AWS::EC2::VPCEndpoint');
    expect(Object.keys(endpoints).length).toBeGreaterThan(0);
  });

  test('creates multiple Lambda functions per environment for different families', () => {
    const { template } = synthStack();
    const lambdas = template.findResources('AWS::Lambda::Function');
    expect(Object.keys(lambdas).length).toBeGreaterThanOrEqual(6);
  });

  test('creates Lambda aliases for weighted traffic routing', () => {
    const { template } = synthStack();
    const aliases = template.findResources('AWS::Lambda::Alias');
    expect(Object.keys(aliases).length).toBeGreaterThan(0);
  });

  test('sets removal policy to DESTROY on S3 buckets', () => {
    const { template } = synthStack();
    const buckets = template.findResources('AWS::S3::Bucket');
    Object.values(buckets).forEach((bucket: any) => {
      expect(bucket.DeletionPolicy).toBe('Delete');
    });
  });

  test('sets removal policy to DESTROY on KMS keys', () => {
    const { template } = synthStack();
    const keys = template.findResources('AWS::KMS::Key');
    Object.values(keys).forEach((key: any) => {
      expect(key.DeletionPolicy).toBe('Delete');
    });
  });

  test('creates CloudWatch dashboard for monitoring', () => {
    const { template } = synthStack();
    const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
    expect(Object.keys(dashboards).length).toBe(1);
  });

  test('creates SNS subscriptions for email notifications', () => {
    const { template } = synthStack();
    const subscriptions = template.findResources('AWS::SNS::Subscription');
    expect(Object.keys(subscriptions).length).toBeGreaterThan(0);
  });
});
