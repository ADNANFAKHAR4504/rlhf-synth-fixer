/**
 * TapStack – Multi-environment financial trading platform
 *
 * Deployment reference:
 *  1. Validate config       → ./scripts/lint.sh
 *  2. Build & synth         → ./scripts/build.sh && ./scripts/synth.sh
 *  3. Deploy (per env)      → ./scripts/deploy.sh
 *  4. Unit / integration    → ./scripts/unit-tests.sh && ./scripts/integration-tests.sh
 *  5. Cleanup / rollback    → ./scripts/destroy.sh (automated rollback occurs via ChangeSets)
 *
 * Required context keys (tapConfig):
 *  - serviceName, costCenter, deploymentDate, kmsAliasBase, lambdaFamilies
 *  - replicationMap[prod|staging|dev]
 *  - environments[prod|staging|dev] (region, vpcCidr, lambda, lifecycle, api, alarms, emails)
 *
 * The stack keeps all constructs within this file and enforces JSON-schema validation
 * before any resources are synthesized, ensuring deterministic, multi-region ready
 * deployments for Production (us-east-1), Staging (eu-west-1), and Development (ap-southeast-1).
 */

import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as stepfunctions from 'aws-cdk-lib/aws-stepfunctions';
import * as tasks from 'aws-cdk-lib/aws-stepfunctions-tasks';
import { Construct } from 'constructs';

type EnvironmentKey = 'prod' | 'staging' | 'dev';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

interface LambdaSizing {
  memory: number;
  timeout: number;
  concurrency: number;
  canaryWeight: number;
}

interface LifecycleRuleConfig {
  transitionAfterDays: number;
  expireAfterDays: number;
}

interface ApiGatewayConfig {
  name: string;
  stageName: string;
  throttleBurst: number;
  throttleRate: number;
}

interface AlarmThresholds {
  lambdaErrors: number;
  apiLatencyMs: number;
  rdsConnections: number;
}

interface EnvironmentSettings {
  region: string;
  vpcCidr: string;
  lambda: LambdaSizing;
  lifecycle: LifecycleRuleConfig;
  api: ApiGatewayConfig;
  emails: string[];
  webhookUrls: string[];
  snapshotSchedule: string;
  logRetentionDays: number;
  alarmThresholds: AlarmThresholds;
  stateBucketPrefix: string;
}

interface TapStackConfig {
  serviceName: string;
  costCenter: string;
  deploymentDate: string;
  kmsAliasBase: string;
  environmentSuffix: string;
  lambdaFamilies: string[];
  replicationMap: Record<EnvironmentKey, EnvironmentKey[]>;
  stageVariables: Record<string, string>;
  environments: Record<EnvironmentKey, EnvironmentSettings>;
  deployEnvironments?: string; // 'all', 'dev', 'staging', 'prod', or comma-separated
}

interface EnvironmentArtifacts {
  vpc: ec2.Vpc;
  kmsKey: kms.Key;
  dataBucket: s3.Bucket;
  stateBucket: s3.Bucket;
  replicationRole: iam.Role;
  auroraCluster: rds.DatabaseCluster;
  snapshotStateMachine: stepfunctions.StateMachine;
  lambdaFunctions: Record<string, lambda.Function>;
  lambdaAliases: Record<string, lambda.Alias>;
  apiGateway: apigateway.RestApi;
  snsTopic: sns.Topic;
}

type JsonSchemaType = 'object' | 'string' | 'number' | 'array';

interface JsonSchema {
  type: JsonSchemaType;
  properties?: Record<string, JsonSchema>;
  required?: string[];
  enum?: string[];
  pattern?: string;
  minimum?: number;
  items?: JsonSchema;
}

const ENVIRONMENT_ORDER: EnvironmentKey[] = ['prod', 'staging', 'dev'];
const TODAY = new Date().toISOString().split('T')[0];

const ENVIRONMENT_SCHEMA: JsonSchema = {
  type: 'object',
  required: [
    'region',
    'vpcCidr',
    'lambda',
    'lifecycle',
    'api',
    'emails',
    'snapshotSchedule',
    'logRetentionDays',
    'alarmThresholds',
    'stateBucketPrefix',
  ],
  properties: {
    region: { type: 'string' },
    vpcCidr: { type: 'string', pattern: '^\\d{1,3}(\\.\\d{1,3}){3}/\\d{1,2}$' },
    lambda: {
      type: 'object',
      required: ['memory', 'timeout', 'concurrency', 'canaryWeight'],
      properties: {
        memory: { type: 'number', minimum: 128 },
        timeout: { type: 'number', minimum: 3 },
        concurrency: { type: 'number', minimum: 1 },
        canaryWeight: { type: 'number', minimum: 0 },
      },
    },
    lifecycle: {
      type: 'object',
      required: ['transitionAfterDays', 'expireAfterDays'],
      properties: {
        transitionAfterDays: { type: 'number', minimum: 1 },
        expireAfterDays: { type: 'number', minimum: 30 },
      },
    },
    api: {
      type: 'object',
      required: ['name', 'stageName', 'throttleBurst', 'throttleRate'],
      properties: {
        name: { type: 'string' },
        stageName: { type: 'string' },
        throttleBurst: { type: 'number', minimum: 10 },
        throttleRate: { type: 'number', minimum: 10 },
      },
    },
    emails: {
      type: 'array',
      items: { type: 'string' },
    },
    webhookUrls: {
      type: 'array',
      items: { type: 'string' },
    },
    snapshotSchedule: { type: 'string' },
    logRetentionDays: { type: 'number', minimum: 1 },
    alarmThresholds: {
      type: 'object',
      required: ['lambdaErrors', 'apiLatencyMs', 'rdsConnections'],
      properties: {
        lambdaErrors: { type: 'number', minimum: 1 },
        apiLatencyMs: { type: 'number', minimum: 100 },
        rdsConnections: { type: 'number', minimum: 1 },
      },
    },
    stateBucketPrefix: { type: 'string' },
  },
};

const CONFIG_SCHEMA: JsonSchema = {
  type: 'object',
  required: [
    'serviceName',
    'costCenter',
    'deploymentDate',
    'kmsAliasBase',
    'environmentSuffix',
    'lambdaFamilies',
    'replicationMap',
    'stageVariables',
    'environments',
  ],
  properties: {
    serviceName: { type: 'string', pattern: '^[a-z0-9-]+$' },
    costCenter: { type: 'string' },
    deploymentDate: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    kmsAliasBase: { type: 'string', pattern: '^alias/' },
    environmentSuffix: { type: 'string', pattern: '^[a-z0-9-]+$' },
    lambdaFamilies: { type: 'array', items: { type: 'string' } },
    replicationMap: {
      type: 'object',
      properties: {
        prod: { type: 'array', items: { type: 'string' } },
        staging: { type: 'array', items: { type: 'string' } },
        dev: { type: 'array', items: { type: 'string' } },
      },
      required: ['prod', 'staging', 'dev'],
    },
    stageVariables: { type: 'object' },
    environments: {
      type: 'object',
      properties: {
        prod: ENVIRONMENT_SCHEMA,
        staging: ENVIRONMENT_SCHEMA,
        dev: ENVIRONMENT_SCHEMA,
      },
      required: ['prod', 'staging', 'dev'],
    },
  },
};

const DEFAULT_CONFIG: TapStackConfig = {
  serviceName: 'trading-platform',
  costCenter: 'FINANCE',
  deploymentDate: TODAY,
  kmsAliasBase: 'alias/trading-platform',
  environmentSuffix: 'dev',
  lambdaFamilies: ['processor', 'ingester', 'worker'],
  stageVariables: {
    featureFlag: 'stable',
  },
  replicationMap: {
    prod: ['staging', 'dev'],
    staging: ['dev'],
    dev: [],
  },
  environments: {
    prod: {
      region: 'us-east-1',
      vpcCidr: '10.10.0.0/16',
      lambda: {
        memory: 3072,
        timeout: 300,
        concurrency: 1000,
        canaryWeight: 0.1,
      },
      lifecycle: { transitionAfterDays: 45, expireAfterDays: 365 },
      api: {
        name: 'trading-platform-prod-api',
        stageName: 'prod',
        throttleBurst: 5000,
        throttleRate: 10000,
      },
      emails: ['prod-ops@example.com'],
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
        name: 'trading-platform-staging-api',
        stageName: 'staging',
        throttleBurst: 1500,
        throttleRate: 3000,
      },
      emails: ['staging-ops@example.com'],
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
        name: 'trading-platform-dev-api',
        stageName: 'dev',
        throttleBurst: 500,
        throttleRate: 1000,
      },
      emails: ['dev-ops@example.com'],
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
};

export class TapStack extends cdk.Stack {
  private readonly config: TapStackConfig;
  private readonly artifacts: Record<EnvironmentKey, EnvironmentArtifacts> =
    {} as Record<EnvironmentKey, EnvironmentArtifacts>;
  private readonly dashboard: cloudwatch.Dashboard;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Allow deploying only specific environments
    // Set to 'all' to deploy all environments, or specify: 'dev', 'staging', 'prod'
    const deployEnvironments =
      this.node.tryGetContext('deployEnvironments') || 'dev'; // Default: deploy only dev environment for test deployments

    this.config = this.prepareConfig(environmentSuffix);
    this.config.deployEnvironments = deployEnvironments;
    this.dashboard = new cloudwatch.Dashboard(this, 'TapDashboard', {
      dashboardName: `${this.config.serviceName}-${environmentSuffix}-dashboard`,
    });
    this.dashboard.node.children.forEach(child => {
      if (child instanceof cdk.CfnResource) {
        child.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      }
    });

    this.applyGlobalTags();
    this.createEnvironments();
    this.configureCrossRegionReplication();
    this.createPeeringMesh();
    this.buildDashboardsAndAlarms();
    this.emitOutputs();
  }

  private prepareConfig(environmentSuffix: string): TapStackConfig {
    const ctx = this.node.tryGetContext('tapConfig');
    const ctxObject: Partial<TapStackConfig> =
      typeof ctx === 'string' ? JSON.parse(ctx) : ctx || {};
    const merged = deepMerge(DEFAULT_CONFIG, ctxObject);
    merged.environmentSuffix = environmentSuffix;
    validateAgainstSchema(CONFIG_SCHEMA, merged, 'root', []);
    this.performInvariantChecks(merged);
    return merged;
  }

  private performInvariantChecks(config: TapStackConfig): void {
    const errors: string[] = [];
    if (!config.lambdaFamilies.length) {
      errors.push('lambdaFamilies must contain at least one function family');
    }
    ENVIRONMENT_ORDER.forEach(env => {
      const targets = config.replicationMap[env] || [];
      if (!targets.length && env === 'prod') {
        errors.push(
          'replicationMap for prod must include at least one replica target'
        );
      }
      targets.forEach(target => {
        if (!ENVIRONMENT_ORDER.includes(target as EnvironmentKey)) {
          errors.push(
            `replicationMap for ${env} references unknown environment ${target}`
          );
        }
        if (target === env) {
          errors.push(`replicationMap for ${env} cannot reference itself`);
        }
        const reverseTargets = config.replicationMap[target as EnvironmentKey];
        if (reverseTargets?.includes(env)) {
          errors.push(
            `replicationMap cannot contain bidirectional replication between ${env} and ${target}`
          );
        }
      });
      if (config.environments[env].lambda.canaryWeight >= 0.5) {
        errors.push(
          `${env}.lambda.canaryWeight must be < 0.5 for safe routing`
        );
      }
    });
    const aliasPattern = /^alias\//;
    if (!aliasPattern.test(config.kmsAliasBase)) {
      errors.push('kmsAliasBase must start with alias/');
    }
    if (errors.length) {
      throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
    }
  }

  private applyGlobalTags(): void {
    cdk.Tags.of(this).add('Service', this.config.serviceName);
    cdk.Tags.of(this).add('CostCenter', this.config.costCenter);
    cdk.Tags.of(this).add('DeploymentDate', this.config.deploymentDate);
    cdk.Tags.of(this).add('EnvironmentSuffix', this.config.environmentSuffix);
  }

  private createEnvironments(): void {
    // Determine which environments to deploy (default: only 'dev' for test environments)
    // Set deployEnvironments context to 'all' or 'prod,staging,dev' for multi-env deployment
    const deployEnv = this.config.deployEnvironments || 'dev';
    const envsToCreate =
      deployEnv === 'all'
        ? ENVIRONMENT_ORDER
        : deployEnv.split(',').map(e => e.trim() as EnvironmentKey);

    envsToCreate.forEach(envKey => {
      const settings = this.config.environments[envKey];
      if (!settings) {
        throw new Error(`Environment "${envKey}" not found in configuration`);
      }
      const kmsKey = new kms.Key(this, `${envKey}KmsKey`, {
        alias:
          `${this.config.kmsAliasBase}-${envKey}-${this.config.environmentSuffix}`.toLowerCase(),
        description: `KMS key for ${envKey} data`,
        enableKeyRotation: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pendingWindow: cdk.Duration.days(7),
      });
      kmsKey.addToResourcePolicy(
        new iam.PolicyStatement({
          sid: `${envKey}CrossRegionReplication`,
          principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
          actions: [
            'kms:Decrypt',
            'kms:Encrypt',
            'kms:GenerateDataKey*',
            'kms:DescribeKey',
          ],
          resources: ['*'],
        })
      );

      const vpc = new ec2.Vpc(this, `${envKey}Vpc`, {
        vpcName: this.formatName(envKey, 'vpc'),
        ipAddresses: ec2.IpAddresses.cidr(settings.vpcCidr),
        maxAzs: 3,
        natGateways: envKey === 'prod' ? 2 : 1,
        subnetConfiguration: [
          { name: 'public', subnetType: ec2.SubnetType.PUBLIC, cidrMask: 24 },
          {
            name: 'private',
            subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
            cidrMask: 24,
          },
          {
            name: 'database',
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
            cidrMask: 24,
          },
        ],
        restrictDefaultSecurityGroup: false,
      });
      // Ensure VPC and all child resources are deleted
      vpc.node.children.forEach(child => {
        if (child instanceof cdk.CfnResource) {
          child.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
        }
      });
      const s3Endpoint = vpc.addGatewayEndpoint(`${envKey}S3Endpoint`, {
        service: ec2.GatewayVpcEndpointAwsService.S3,
      });
      const cwLogsEndpoint = vpc.addInterfaceEndpoint(
        `${envKey}CloudWatchLogsEndpoint`,
        {
          service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
          privateDnsEnabled: true,
        }
      );
      const rdsEndpoint = vpc.addInterfaceEndpoint(`${envKey}RDSEndpoint`, {
        service: ec2.InterfaceVpcEndpointAwsService.RDS,
      });
      const secretsEndpoint = vpc.addInterfaceEndpoint(
        `${envKey}SecretsManagerEndpoint`,
        {
          service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        }
      );
      // Apply removal policy to endpoints
      [s3Endpoint, cwLogsEndpoint, rdsEndpoint, secretsEndpoint].forEach(
        endpoint => {
          endpoint.node.children.forEach(child => {
            if (child instanceof cdk.CfnResource) {
              child.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
            }
          });
        }
      );

      const replicationRole = new iam.Role(this, `${envKey}ReplicationRole`, {
        // roleName removed to let CloudFormation auto-generate (avoids conflicts)
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      });
      replicationRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

      const dataBucket = new s3.Bucket(this, `${envKey}DataBucket`, {
        // bucketName removed to let CloudFormation auto-generate (avoids conflicts on re-deploy)
        versioned: true,
        encryption: s3.BucketEncryption.KMS,
        encryptionKey: kmsKey,
        enforceSSL: true,
        blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
        lifecycleRules: [
          {
            transitions: [
              {
                storageClass: s3.StorageClass.INTELLIGENT_TIERING,
                transitionAfter: cdk.Duration.days(
                  settings.lifecycle.transitionAfterDays
                ),
              },
            ],
            expiration: cdk.Duration.days(settings.lifecycle.expireAfterDays),
          },
        ],
      });
      dataBucket.addToResourcePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.DENY,
          principals: [new iam.AnyPrincipal()],
          actions: ['s3:*'],
          resources: [dataBucket.bucketArn, dataBucket.arnForObjects('*')],
          conditions: { Bool: { 'aws:SecureTransport': 'false' } },
        })
      );

      const stateBucket = new s3.Bucket(this, `${envKey}StateBucket`, {
        // bucketName removed to let CloudFormation auto-generate (avoids conflicts on re-deploy)
        versioned: true,
        encryption: s3.BucketEncryption.S3_MANAGED,
        enforceSSL: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        autoDeleteObjects: true,
      });

      const databaseSecurityGroup = new ec2.SecurityGroup(
        this,
        `${envKey}DatabaseSg`,
        {
          vpc,
          description: `${envKey} Aurora access`,
          allowAllOutbound: true,
        }
      );
      databaseSecurityGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      databaseSecurityGroup.addIngressRule(
        ec2.Peer.ipv4(settings.vpcCidr),
        ec2.Port.tcp(3306),
        'allow VPC MySQL access'
      );

      const lambdaSecurityGroup = new ec2.SecurityGroup(
        this,
        `${envKey}LambdaSg`,
        {
          vpc,
          description: `${envKey} Lambda access`,
          allowAllOutbound: true,
        }
      );
      lambdaSecurityGroup.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      databaseSecurityGroup.addIngressRule(
        lambdaSecurityGroup,
        ec2.Port.tcp(3306),
        'Lambda access to Aurora'
      );

      const subnetGroup = new rds.SubnetGroup(this, `${envKey}RdsSubnetGroup`, {
        vpc,
        description: `${envKey} database subnet group`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      });

      const auroraCluster = new rds.DatabaseCluster(this, `${envKey}Aurora`, {
        // clusterIdentifier removed to let CloudFormation auto-generate (avoids conflicts)
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_3_04_1,
        }),
        credentials: rds.Credentials.fromGeneratedSecret('admin'),
        defaultDatabaseName: 'tradingdb',
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        instances: envKey === 'prod' ? 3 : 1,
        subnetGroup,
        instanceProps: {
          vpc,
          vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
          securityGroups: [databaseSecurityGroup],
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R5,
            ec2.InstanceSize.LARGE
          ),
        },
        backup: {
          retention: cdk.Duration.days(envKey === 'prod' ? 30 : 7),
          preferredWindow: '02:00-03:00',
        },
        cloudwatchLogsExports: ['error', 'slowquery'],
        cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        deletionProtection: false,
      });
      auroraCluster.secret?.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

      const snapshotStateMachine = this.createSnapshotAutomation(
        envKey,
        auroraCluster,
        kmsKey,
        settings
      );

      const lambdaArtifacts = this.createWorkloadLambdas(
        envKey,
        settings,
        vpc,
        lambdaSecurityGroup,
        dataBucket,
        auroraCluster,
        kmsKey
      );

      const kmsAlias =
        `${this.config.kmsAliasBase}-${envKey}-${this.config.environmentSuffix}`.toLowerCase();
      const apiGateway = this.createApiGateway(
        envKey,
        settings,
        lambdaArtifacts.lambdaAliases,
        dataBucket.bucketName,
        kmsAlias
      );

      const snsTopic = this.createNotificationTopic(envKey, settings, kmsKey);

      this.artifacts[envKey] = {
        vpc,
        kmsKey,
        dataBucket,
        stateBucket,
        replicationRole,
        auroraCluster,
        snapshotStateMachine,
        lambdaFunctions: lambdaArtifacts.lambdaFunctions,
        lambdaAliases: lambdaArtifacts.lambdaAliases,
        apiGateway,
        snsTopic,
      };
    });
  }

  private createSnapshotAutomation(
    envKey: EnvironmentKey,
    cluster: rds.DatabaseCluster,
    key: kms.Key,
    settings: EnvironmentSettings
  ): stepfunctions.StateMachine {
    const handlerRole = new iam.Role(this, `${envKey}SnapshotHandlerRole`, {
      // roleName removed to let CloudFormation auto-generate (avoids conflicts)
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaBasicExecutionRole'
        ),
      ],
    });
    handlerRole.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    handlerRole.addToPolicy(
      new iam.PolicyStatement({
        actions: [
          'rds:DescribeDBClusterSnapshots',
          'rds:CopyDBClusterSnapshot',
          'rds:AddTagsToResource',
        ],
        resources: ['*'],
      })
    );
    key.grantEncryptDecrypt(handlerRole);

    const handler = new lambda.Function(this, `${envKey}SnapshotHandler`, {
      // functionName removed to let CloudFormation auto-generate (avoids conflicts)
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        exports.handler = async () => {
          const rds = new AWS.RDS();
          const clusterId = process.env.CLUSTER_ID;
          const kmsKeyId = process.env.KMS_KEY_ID;
          const targets = JSON.parse(process.env.TARGETS);
          const snapshots = await rds.describeDBClusterSnapshots({
            DBClusterIdentifier: clusterId,
            SnapshotType: 'automatic'
          }).promise();
          if (!snapshots.DBClusterSnapshots.length) {
            return { status: 'NO_SNAPSHOTS' };
          }
          const latest = snapshots.DBClusterSnapshots.sort(
            (a, b) => new Date(b.SnapshotCreateTime) - new Date(a.SnapshotCreateTime)
          )[0];
          await Promise.all(targets.map(async (target) => {
            const targetRds = new AWS.RDS({ region: target });
            await targetRds.copyDBClusterSnapshot({
              SourceDBClusterSnapshotIdentifier: latest.DBClusterSnapshotArn,
              TargetDBClusterSnapshotIdentifier: \`\${latest.DBClusterSnapshotIdentifier}-\${target}-\${Date.now()}\`,
              CopyTags: true,
              KmsKeyId: kmsKeyId
            }).promise();
          }));
          return { status: 'COPIED', snapshot: latest.DBClusterSnapshotIdentifier };
        };
      `),
      handler: 'index.handler',
      runtime: lambda.Runtime.NODEJS_20_X,
      timeout: cdk.Duration.minutes(15),
      role: handlerRole,
      environment: {
        CLUSTER_ID: cluster.clusterIdentifier,
        KMS_KEY_ID: key.keyArn,
        TARGETS: JSON.stringify(
          this.config.replicationMap[envKey].map(
            t => this.config.environments[t].region
          )
        ),
      },
    });

    const lambdaTask = new tasks.LambdaInvoke(this, `${envKey}SnapshotTask`, {
      lambdaFunction: handler,
      outputPath: '$.Payload',
    });
    const definition = lambdaTask.next(
      new stepfunctions.Succeed(this, `${envKey}SnapshotSuccess`)
    );

    const stateMachine = new stepfunctions.StateMachine(
      this,
      `${envKey}SnapshotStateMachine`,
      {
        definition,
        // stateMachineName removed to let CloudFormation auto-generate (avoids conflicts)
        timeout: cdk.Duration.hours(1),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const snapshotSchedule = new events.Rule(
      this,
      `${envKey}SnapshotSchedule`,
      {
        description: `${envKey} snapshot replication schedule`,
        schedule: events.Schedule.expression(settings.snapshotSchedule),
        targets: [new targets.SfnStateMachine(stateMachine)],
      }
    );
    snapshotSchedule.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);

    return stateMachine;
  }

  private createWorkloadLambdas(
    envKey: EnvironmentKey,
    settings: EnvironmentSettings,
    vpc: ec2.Vpc,
    lambdaSecurityGroup: ec2.SecurityGroup,
    bucket: s3.Bucket,
    cluster: rds.DatabaseCluster,
    key: kms.Key
  ): {
    lambdaAliases: Record<string, lambda.Alias>;
    lambdaFunctions: Record<string, lambda.Function>;
  } {
    const lambdaAliases: Record<string, lambda.Alias> = {};
    const lambdaFunctions: Record<string, lambda.Function> = {};

    this.config.lambdaFamilies.forEach(family => {
      const fn = new lambda.Function(this, `${envKey}${family}Fn`, {
        // functionName removed to let CloudFormation auto-generate (avoids conflicts)
        runtime: lambda.Runtime.NODEJS_20_X,
        handler: 'index.handler',
        vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
        securityGroups: [lambdaSecurityGroup],
        timeout: cdk.Duration.seconds(settings.lambda.timeout),
        memorySize: settings.lambda.memory,
        environment: {
          ENVIRONMENT: envKey,
          BUCKET_NAME: bucket.bucketName,
          CLUSTER_ENDPOINT: cluster.clusterEndpoint.hostname,
          CLUSTER_SECRET_ARN: cluster.secret?.secretArn ?? '',
        },
        logRetention: logs.RetentionDays.ONE_MONTH,
        code: lambda.Code.fromInline(`
          exports.handler = async (event) => {
            const payload = typeof event === 'string' ? JSON.parse(event) : event;
            const response = {
              status: 'OK',
              env: process.env.ENVIRONMENT,
              routedAt: new Date().toISOString(),
              bucket: process.env.BUCKET_NAME,
              requestId: payload?.requestId || Math.random().toString(36).substring(2, 12)
            };
            return { statusCode: 200, body: JSON.stringify(response) };
          };
        `),
        tracing: lambda.Tracing.ACTIVE,
        ...(envKey !== 'dev'
          ? { reservedConcurrentExecutions: settings.lambda.concurrency }
          : {}),
      });
      fn.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      bucket.grantReadWrite(fn);
      key.grantEncryptDecrypt(fn);
      cluster.secret?.grantRead(fn);

      const stableVersion = new lambda.Version(
        this,
        `${envKey}${family}StableVersion`,
        {
          lambda: fn,
          removalPolicy: cdk.RemovalPolicy.DESTROY,
        }
      );

      const alias = new lambda.Alias(this, `${envKey}${family}Alias`, {
        aliasName: envKey,
        version: stableVersion,
        description: `${envKey} alias for ${family}`,
      });

      lambdaAliases[family] = alias;
      lambdaFunctions[family] = fn;
    });

    return { lambdaAliases, lambdaFunctions };
  }

  private createApiGateway(
    envKey: EnvironmentKey,
    settings: EnvironmentSettings,
    lambdaAliases: Record<string, lambda.Alias>,
    bucketName: string,
    kmsAlias: string
  ): apigateway.RestApi {
    const api = new apigateway.RestApi(this, `${envKey}Api`, {
      restApiName: settings.api.name,
      deployOptions: {
        stageName: settings.api.stageName,
        metricsEnabled: true,
        dataTraceEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO,
        throttlingBurstLimit: settings.api.throttleBurst,
        throttlingRateLimit: settings.api.throttleRate,
        variables: {
          ...this.config.stageVariables,
          environment: envKey,
          bucketName,
          kmsAlias,
          featureFlag: envKey === 'dev' ? 'enable-new-risk-engine' : 'stable',
        },
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
      cloudWatchRole: true,
    });
    api.node.children.forEach(child => {
      if (child instanceof cdk.CfnResource) {
        child.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      }
    });

    const usagePlan = api.addUsagePlan(`${envKey}UsagePlan`, {
      name: this.formatName(envKey, 'usage-plan'),
      throttle: {
        rateLimit: settings.api.throttleRate,
        burstLimit: settings.api.throttleBurst,
      },
    });
    usagePlan.addApiStage({ stage: api.deploymentStage });

    Object.entries(lambdaAliases).forEach(([family, alias]) => {
      const resource = api.root.addResource(family);
      resource.addMethod('GET', new apigateway.LambdaIntegration(alias));
      resource.addMethod('POST', new apigateway.LambdaIntegration(alias));
    });

    return api;
  }

  private createNotificationTopic(
    envKey: EnvironmentKey,
    settings: EnvironmentSettings,
    key: kms.Key
  ): sns.Topic {
    const topic = new sns.Topic(this, `${envKey}DeploymentTopic`, {
      // topicName removed to let CloudFormation auto-generate (avoids conflicts)
      displayName: `${envKey.toUpperCase()} deployment notifications`,
      masterKey: key,
    });
    topic.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
    const emails = settings.emails.length
      ? settings.emails
      : ['alerts@example.com'];
    emails.forEach(email => {
      topic.addSubscription(
        new subscriptions.EmailSubscription(email, {
          json: true,
        })
      );
    });
    settings.webhookUrls?.forEach((url, index) => {
      topic.addSubscription(
        new subscriptions.UrlSubscription(url, {
          protocol: url.startsWith('https')
            ? sns.SubscriptionProtocol.HTTPS
            : sns.SubscriptionProtocol.HTTP,
          rawMessageDelivery: index === 0,
        })
      );
    });
    return topic;
  }

  private configureCrossRegionReplication(): void {
    // Only configure replication for created environments
    const createdEnvs = Object.keys(this.artifacts) as EnvironmentKey[];
    createdEnvs.forEach(envKey => {
      const sourceArtifacts = this.artifacts[envKey];
      const targets = this.config.replicationMap[envKey] || [];
      if (!targets.length) {
        return;
      }
      // Filter targets to only include created environments
      const validTargets = targets.filter(t => this.artifacts[t]);
      if (!validTargets.length) {
        return;
      }
      const rules = validTargets.map((targetKey, index) => {
        const targetBucket = this.artifacts[targetKey].dataBucket;
        const targetKeyArn = this.artifacts[targetKey].kmsKey.keyArn;
        sourceArtifacts.replicationRole.addToPolicy(
          new iam.PolicyStatement({
            actions: [
              's3:GetReplicationConfiguration',
              's3:ListBucket',
              's3:GetObjectVersion',
              's3:GetObjectVersionAcl',
              's3:GetObjectVersionForReplication',
              's3:GetObjectLegalHold',
              's3:GetObjectRetention',
            ],
            resources: [
              sourceArtifacts.dataBucket.bucketArn,
              sourceArtifacts.dataBucket.arnForObjects('*'),
            ],
          })
        );
        sourceArtifacts.replicationRole.addToPolicy(
          new iam.PolicyStatement({
            actions: [
              's3:ReplicateObject',
              's3:ReplicateDelete',
              's3:ReplicateTags',
              's3:GetObjectVersionTagging',
            ],
            resources: [targetBucket.arnForObjects('*')],
          })
        );
        this.artifacts[targetKey].kmsKey.grantEncryptDecrypt(
          sourceArtifacts.replicationRole
        );
        this.artifacts[envKey].kmsKey.grantEncryptDecrypt(
          sourceArtifacts.replicationRole
        );
        return {
          Destination: {
            Bucket: targetBucket.bucketArn,
            StorageClass: 'STANDARD',
            EncryptionConfiguration: {
              ReplicaKmsKeyID: targetKeyArn,
            },
          },
          Id: `${envKey}-to-${targetKey}`,
          Status: 'Enabled',
          DeleteMarkerReplication: { Status: 'Enabled' },
          SourceSelectionCriteria: {
            SseKmsEncryptedObjects: { Status: 'Enabled' },
          },
          Priority: index + 1,
        };
      });
      if (rules.length) {
        const cfnBucket = sourceArtifacts.dataBucket.node
          .defaultChild as s3.CfnBucket;
        cfnBucket.addPropertyOverride('ReplicationConfiguration', {
          Role: sourceArtifacts.replicationRole.roleArn,
          Rules: rules,
        });
      }
    });
  }

  private createPeeringMesh(): void {
    // Only create peering between actually created environments
    const createdEnvs = Object.keys(this.artifacts) as EnvironmentKey[];
    for (let i = 0; i < createdEnvs.length; i += 1) {
      for (let j = i + 1; j < createdEnvs.length; j += 1) {
        const envA = createdEnvs[i];
        const envB = createdEnvs[j];
        const vpcA = this.artifacts[envA].vpc;
        const vpcB = this.artifacts[envB].vpc;
        const peering = new ec2.CfnVPCPeeringConnection(
          this,
          `${envA}${envB}Peering`,
          {
            vpcId: vpcA.vpcId,
            peerVpcId: vpcB.vpcId,
            peerRegion: this.config.environments[envB].region,
            tags: [
              {
                key: 'Name',
                value: `${this.config.serviceName}-${envA}-${envB}-peering`,
              },
            ],
          }
        );
        peering.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      }
    }
  }

  private buildDashboardsAndAlarms(): void {
    this.dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown:
          '# Trading Platform Observability\nAll environments aggregated.',
        width: 24,
        height: 2,
      })
    );

    // Only add widgets/alarms for created environments
    const createdEnvs = Object.keys(this.artifacts) as EnvironmentKey[];
    createdEnvs.forEach(envKey => {
      const artifacts = this.artifacts[envKey];
      const settings = this.config.environments[envKey];
      const alarmTopic = artifacts.snsTopic;

      Object.entries(artifacts.lambdaFunctions).forEach(([family, fn]) => {
        const alarm = new cloudwatch.Alarm(
          this,
          `${envKey}${family}ErrorAlarm`,
          {
            metric: fn.metricErrors(),
            threshold: settings.alarmThresholds.lambdaErrors,
            evaluationPeriods: 1,
            datapointsToAlarm: 1,
            alarmName: this.formatName(envKey, `${family}-errors`),
          }
        );
        alarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
        alarm.addAlarmAction(new cloudwatchActions.SnsAction(alarmTopic));
      });

      const apiLatencyAlarm = new cloudwatch.Alarm(
        this,
        `${envKey}ApiLatencyAlarm`,
        {
          metric: artifacts.apiGateway.metricLatency(),
          threshold: settings.alarmThresholds.apiLatencyMs,
          evaluationPeriods: 1,
          datapointsToAlarm: 1,
          alarmName: this.formatName(envKey, 'api-latency'),
        }
      );
      apiLatencyAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      apiLatencyAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alarmTopic)
      );

      const rdsConnectionsAlarm = new cloudwatch.Alarm(
        this,
        `${envKey}RdsConnectionsAlarm`,
        {
          metric: new cloudwatch.Metric({
            namespace: 'AWS/RDS',
            metricName: 'DatabaseConnections',
            dimensionsMap: {
              DBClusterIdentifier: artifacts.auroraCluster.clusterIdentifier,
            },
            statistic: 'Average',
            period: cdk.Duration.minutes(5),
          }),
          threshold: settings.alarmThresholds.rdsConnections,
          evaluationPeriods: 1,
          datapointsToAlarm: 1,
          alarmName: this.formatName(envKey, 'rds-connections'),
        }
      );
      rdsConnectionsAlarm.applyRemovalPolicy(cdk.RemovalPolicy.DESTROY);
      rdsConnectionsAlarm.addAlarmAction(
        new cloudwatchActions.SnsAction(alarmTopic)
      );

      this.dashboard.addWidgets(
        new cloudwatch.GraphWidget({
          title: `${envKey.toUpperCase()} – Lambda traffic`,
          width: 12,
          left: Object.values(artifacts.lambdaFunctions).map(fn =>
            fn.metricInvocations()
          ),
          right: Object.values(artifacts.lambdaFunctions).map(fn =>
            fn.metricErrors()
          ),
        }),
        new cloudwatch.GraphWidget({
          title: `${envKey.toUpperCase()} – API latency`,
          width: 12,
          left: [artifacts.apiGateway.metricLatency()],
          right: [artifacts.apiGateway.metricCount()],
        }),
        new cloudwatch.GraphWidget({
          title: `${envKey.toUpperCase()} – Aurora health`,
          width: 24,
          left: [
            new cloudwatch.Metric({
              namespace: 'AWS/RDS',
              metricName: 'CPUUtilization',
              dimensionsMap: {
                DBClusterIdentifier: artifacts.auroraCluster.clusterIdentifier,
              },
            }),
          ],
          right: [
            new cloudwatch.Metric({
              namespace: 'AWS/RDS',
              metricName: 'FreeableMemory',
              dimensionsMap: {
                DBClusterIdentifier: artifacts.auroraCluster.clusterIdentifier,
              },
            }),
          ],
        })
      );
    });
  }

  private emitOutputs(): void {
    // Only emit outputs for created environments
    const createdEnvs = Object.keys(this.artifacts) as EnvironmentKey[];
    createdEnvs.forEach(envKey => {
      const artifacts = this.artifacts[envKey];
      const prefix = envKey.charAt(0).toUpperCase() + envKey.slice(1);
      new cdk.CfnOutput(this, `${prefix}DataBucketName`, {
        value: artifacts.dataBucket.bucketName,
        description: `${envKey} data bucket`,
      });
      new cdk.CfnOutput(this, `${prefix}ReplicationRoleArn`, {
        value: artifacts.replicationRole.roleArn,
        description: `${envKey} replication role`,
      });
      new cdk.CfnOutput(this, `${prefix}AuroraClusterArn`, {
        value: artifacts.auroraCluster.clusterArn,
        description: `${envKey} Aurora cluster`,
      });
      new cdk.CfnOutput(this, `${prefix}SnapshotStateMachineArn`, {
        value: artifacts.snapshotStateMachine.stateMachineArn,
        description: `${envKey} snapshot orchestrator`,
      });
      Object.entries(artifacts.lambdaAliases).forEach(([family, alias]) => {
        new cdk.CfnOutput(this, `${prefix}${family}AliasArn`, {
          value: alias.functionArn,
          description: `${envKey} ${family} alias`,
        });
      });
      new cdk.CfnOutput(this, `${prefix}ApiEndpoint`, {
        value: artifacts.apiGateway.url,
        description: `${envKey} API endpoint`,
      });
      new cdk.CfnOutput(this, `${prefix}SnsTopicArn`, {
        value: artifacts.snsTopic.topicArn,
        description: `${envKey} notification topic`,
      });
      new cdk.CfnOutput(this, `${prefix}KmsKeyArn`, {
        value: artifacts.kmsKey.keyArn,
        description: `${envKey} KMS key`,
      });
      new cdk.CfnOutput(this, `${prefix}StateBucketName`, {
        value: artifacts.stateBucket.bucketName,
        description: `${envKey} state bucket`,
      });
      new cdk.CfnOutput(this, `${prefix}Region`, {
        value: this.config.environments[envKey].region,
        description: `${envKey} target region`,
      });
    });

    new cdk.CfnOutput(this, 'ObservabilityDashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${this.dashboard.dashboardName}`,
      description: 'Unified dashboard URL',
    });

    new cdk.CfnOutput(this, 'DeploymentGuide', {
      description: 'CI-friendly command summary',
      value: [
        'Lint: ./scripts/lint.sh',
        'Build: ./scripts/build.sh',
        'Synth: ./scripts/synth.sh',
        'Unit tests: ./scripts/unit-tests.sh',
        'Integration tests: ./scripts/integration-tests.sh',
        'Deploy: ./scripts/deploy.sh',
        'Destroy: ./scripts/destroy.sh',
      ].join(' | '),
    });
  }

  private formatName(envKey: EnvironmentKey, suffix: string): string {
    return [
      this.config.serviceName,
      envKey,
      suffix,
      this.config.environmentSuffix,
    ]
      .join('-')
      .toLowerCase();
  }

  private roleName(envKey: EnvironmentKey, purpose: string): string {
    const region = this.config.environments[envKey].region;
    return `${this.config.serviceName}-${envKey}-${region}-${purpose}-role`
      .replace(/[^a-z0-9-]/gi, '-')
      .toLowerCase()
      .slice(0, 63);
  }
}

function deepMerge<T>(target: T, source: Partial<T>): T {
  if (!source) {
    return target;
  }
  const output: any = Array.isArray(target)
    ? [...(target as any)]
    : { ...(target as any) };
  Object.keys(source).forEach(key => {
    const typedKey = key as keyof T;
    const sourceValue = (source as any)[typedKey];
    if (sourceValue === undefined) {
      return;
    }
    const targetValue = (output as any)[typedKey];
    if (Array.isArray(sourceValue)) {
      output[typedKey] = [...sourceValue];
    } else if (
      typeof sourceValue === 'object' &&
      sourceValue !== null &&
      typeof targetValue === 'object' &&
      targetValue !== null &&
      !Array.isArray(sourceValue)
    ) {
      output[typedKey] = deepMerge(targetValue, sourceValue);
    } else {
      output[typedKey] = sourceValue;
    }
  });
  return output;
}

function validateAgainstSchema(
  schema: JsonSchema,
  data: any,
  path: string,
  topLevelErrors: string[]
): void {
  const errors = topLevelErrors;
  const location = path || 'root';
  if (schema.type === 'object') {
    if (typeof data !== 'object' || data === null || Array.isArray(data)) {
      errors.push(`${location} must be an object`);
      return;
    }
    schema.required?.forEach(key => {
      if (!(key in data)) {
        errors.push(`${location}.${key} is required`);
      }
    });
    Object.entries(schema.properties || {}).forEach(([key, value]) => {
      if (data[key] !== undefined) {
        validateAgainstSchema(value, data[key], `${location}.${key}`, errors);
      }
    });
  } else if (schema.type === 'string') {
    if (typeof data !== 'string') {
      errors.push(`${location} must be a string`);
      return;
    }
    if (schema.pattern && !new RegExp(schema.pattern).test(data)) {
      errors.push(`${location} must match pattern ${schema.pattern}`);
    }
    if (schema.enum && !schema.enum.includes(data)) {
      errors.push(`${location} must be one of ${schema.enum.join(', ')}`);
    }
  } else if (schema.type === 'number') {
    if (typeof data !== 'number') {
      errors.push(`${location} must be a number`);
      return;
    }
    if (schema.minimum !== undefined && data < schema.minimum) {
      errors.push(`${location} must be >= ${schema.minimum}`);
    }
  } else if (schema.type === 'array') {
    if (!Array.isArray(data)) {
      errors.push(`${location} must be an array`);
      return;
    }
    data.forEach((item, index) => {
      if (schema.items) {
        validateAgainstSchema(
          schema.items,
          item,
          `${location}[${index}]`,
          errors
        );
      }
    });
  }
  if (path === 'root' && errors.length) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
}
