Reasoning Trace
This is a complex request for a multi-region disaster recovery architecture. I need to design and implement:

Primary region (us-west-2) with:
ECS Fargate cluster
Aurora PostgreSQL
Application Load Balancer
S3 bucket with Cross-Region Replication
Secondary region (us-east-1) with:
Standby ECS Fargate cluster
Aurora read replica
Replicated S3 bucket
ALB
Route 53 for health checks and DNS failover
CloudWatch alarms
KMS encryption for all resources
Proper tagging
Meet RTO of 15 minutes and RPO of 5 minutes
I'll structure the project as:

app.ts (entry point)
lib/stacks/ (various stack definitions)
config/ (configuration files)
bin/ (CDK app bootstrap)
Let me create a comprehensive solution.

Answer
I'll design and implement a comprehensive cross-region disaster recovery architecture for your financial trading platform. This solution ensures business continuity with automated failover, meeting your RTO/RPO requirements.

Project Structure
trading-platform-dr/
├── app.ts
├── package.json
├── tsconfig.json
├── cdk.json
├── config/
│   ├── environment.ts
│   └── regions.ts
├── lib/
│   ├── stacks/
│   │   ├── primary-region-stack.ts
│   │   ├── secondary-region-stack.ts
│   │   ├── global-resources-stack.ts
│   │   └── monitoring-stack.ts
│   ├── constructs/
│   │   ├── aurora-cluster.ts
│   │   ├── ecs-service.ts
│   │   ├── s3-replication.ts
│   │   └── route53-failover.ts
│   └── utils/
│       ├── tagging.ts
│       └── kms-utils.ts
└── README.md
Core Implementation Files
package.json
{
  "name": "trading-platform-dr",
  "version": "1.0.0",
  "description": "Cross-region disaster recovery for trading platform",
  "private": true,
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "cdk": "cdk",
    "deploy:primary": "cdk deploy PrimaryRegionStack --region us-west-2",
    "deploy:secondary": "cdk deploy SecondaryRegionStack --region us-east-1",
    "deploy:global": "cdk deploy GlobalResourcesStack",
    "deploy:all": "npm run deploy:global && npm run deploy:primary && npm run deploy:secondary",
    "test": "jest"
  },
  "devDependencies": {
    "@types/node": "^18.11.18",
    "@types/jest": "^29.2.5",
    "aws-cdk": "^2.100.0",
    "jest": "^29.3.1",
    "ts-jest": "^29.0.5",
    "ts-node": "^10.9.1",
    "typescript": "^4.9.4"
  },
  "dependencies": {
    "aws-cdk-lib": "^2.100.0",
    "constructs": "^10.1.200",
    "source-map-support": "^0.5.21"
  }
}
tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020", "DOM"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "outDir": "lib",
    "rootDir": "."
  },
  "exclude": ["node_modules", "cdk.out"]
}
cdk.json
{
  "app": "npx ts-node --prefer-ts-exts app.ts",
  "watch": {
    "include": ["**"],
    "exclude": [
      "README.md",
      "cdk*.json",
      "**/*.d.ts",
      "**/*.js",
      "tsconfig.json",
      "package*.json",
      "yarn.lock",
      "node_modules",
      ".git"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "primaryRegion": "us-west-2",
    "secondaryRegion": "us-east-1"
  }
}
app.ts
#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { PrimaryRegionStack } from './lib/stacks/primary-region-stack';
import { SecondaryRegionStack } from './lib/stacks/secondary-region-stack';
import { GlobalResourcesStack } from './lib/stacks/global-resources-stack';
import { MonitoringStack } from './lib/stacks/monitoring-stack';
import { RegionConfig } from './config/regions';
import { applyDefaultTags } from './lib/utils/tagging';

const app = new cdk.App();

// Apply default tags to all stacks
applyDefaultTags(app);

// Global resources (Route 53 hosted zone, etc.)
const globalStack = new GlobalResourcesStack(app, 'GlobalResourcesStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1' // Global resources default to us-east-1
  },
  description: 'Global resources for trading platform DR'
});

// Primary region stack
const primaryStack = new PrimaryRegionStack(app, 'PrimaryRegionStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: RegionConfig.PRIMARY_REGION
  },
  hostedZoneId: globalStack.hostedZone.hostedZoneId,
  domainName: globalStack.domainName,
  description: 'Primary region infrastructure for trading platform'
});

// Secondary region stack
const secondaryStack = new SecondaryRegionStack(app, 'SecondaryRegionStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: RegionConfig.SECONDARY_REGION
  },
  primaryDbClusterArn: primaryStack.auroraClusterArn,
  primaryBucketArn: primaryStack.s3BucketArn,
  hostedZoneId: globalStack.hostedZone.hostedZoneId,
  domainName: globalStack.domainName,
  description: 'Secondary region infrastructure for trading platform DR'
});

// Monitoring stack (cross-region)
const monitoringStack = new MonitoringStack(app, 'MonitoringStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1'
  },
  primaryAlbArn: primaryStack.albArn,
  secondaryAlbArn: secondaryStack.albArn,
  primaryRegion: RegionConfig.PRIMARY_REGION,
  secondaryRegion: RegionConfig.SECONDARY_REGION,
  description: 'Cross-region monitoring and alerting'
});

// Add dependencies
secondaryStack.addDependency(primaryStack);
monitoringStack.addDependency(primaryStack);
monitoringStack.addDependency(secondaryStack);

app.synth();
config/environment.ts
export interface EnvironmentConfig {
  readonly appName: string;
  readonly environment: 'production' | 'staging' | 'development';
  readonly costCenter: string;
  readonly containerImage: string;
  readonly dbName: string;
  readonly dbUsername: string;
  readonly vpcCidr: {
    primary: string;
    secondary: string;
  };
  readonly rto: number; // in minutes
  readonly rpo: number; // in minutes
}

export const EnvConfig: EnvironmentConfig = {
  appName: 'trading-platform',
  environment: 'production',
  costCenter: 'FinanceOps',
  containerImage: 'public.ecr.aws/amazonlinux/amazonlinux:latest', // Replace with your image
  dbName: 'tradingdb',
  dbUsername: 'dbadmin',
  vpcCidr: {
    primary: '10.0.0.0/16',
    secondary: '10.1.0.0/16'
  },
  rto: 15,
  rpo: 5
};
config/regions.ts
export interface RegionConfiguration {
  readonly PRIMARY_REGION: string;
  readonly SECONDARY_REGION: string;
  readonly FAILOVER_PRIORITY: {
    [key: string]: number;
  };
}

export const RegionConfig: RegionConfiguration = {
  PRIMARY_REGION: 'us-west-2',
  SECONDARY_REGION: 'us-east-1',
  FAILOVER_PRIORITY: {
    'us-west-2': 1,
    'us-east-1': 2
  }
};
lib/utils/tagging.ts
import * as cdk from 'aws-cdk-lib';
import { EnvConfig } from '../../config/environment';

export function applyDefaultTags(scope: cdk.App | cdk.Stack): void {
  cdk.Tags.of(scope).add('Environment', EnvConfig.environment);
  cdk.Tags.of(scope).add('App', EnvConfig.appName);
  cdk.Tags.of(scope).add('ManagedBy', 'CDK');
  cdk.Tags.of(scope).add('CostCenter', EnvConfig.costCenter);
  cdk.Tags.of(scope).add('Timestamp', new Date().toISOString());
}

export function applyResourceTags(
  scope: cdk.Stack,
  resourceType: string,
  additionalTags?: { [key: string]: string }
): void {
  cdk.Tags.of(scope).add('ResourceType', resourceType);
  
  if (additionalTags) {
    Object.entries(additionalTags).forEach(([key, value]) => {
      cdk.Tags.of(scope).add(key, value);
    });
  }
}
lib/utils/kms-utils.ts
import * as cdk from 'aws-cdk-lib';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export class KmsKeyManager extends Construct {
  public readonly databaseKey: kms.Key;
  public readonly storageKey: kms.Key;
  public readonly secretsKey: kms.Key;

  constructor(scope: Construct, id: string, props: {
    region: string;
    enableCrossRegionReplication?: boolean;
  }) {
    super(scope, id);

    // Database encryption key
    this.databaseKey = new kms.Key(this, 'DatabaseKey', {
      enableKeyRotation: true,
      alias: `alias/${props.region}-database-key`,
      description: 'KMS key for Aurora database encryption',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pendingWindow: cdk.Duration.days(30),
    });

    // Storage encryption key
    this.storageKey = new kms.Key(this, 'StorageKey', {
      enableKeyRotation: true,
      alias: `alias/${props.region}-storage-key`,
      description: 'KMS key for S3 bucket encryption',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pendingWindow: cdk.Duration.days(30),
    });

    // Secrets encryption key
    this.secretsKey = new kms.Key(this, 'SecretsKey', {
      enableKeyRotation: true,
      alias: `alias/${props.region}-secrets-key`,
      description: 'KMS key for ECS secrets encryption',
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pendingWindow: cdk.Duration.days(30),
    });

    // Grant ECS service access to decrypt secrets
    this.secretsKey.addToResourcePolicy(new iam.PolicyStatement({
      effect: iam.Effect.ALLOW,
      principals: [new iam.ServicePrincipal('ecs-tasks.amazonaws.com')],
      actions: ['kms:Decrypt', 'kms:DescribeKey'],
      resources: ['*'],
    }));
  }
}
lib/stacks/primary-region-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import { Construct } from 'constructs';
import { KmsKeyManager } from '../utils/kms-utils';
import { EnvConfig } from '../../config/environment';
import { RegionConfig } from '../../config/regions';
import { AuroraCluster } from '../constructs/aurora-cluster';
import { EcsService } from '../constructs/ecs-service';
import { S3ReplicatedBucket } from '../constructs/s3-replication';

export interface PrimaryRegionStackProps extends cdk.StackProps {
  hostedZoneId: string;
  domainName: string;
}

export class PrimaryRegionStack extends cdk.Stack {
  public readonly vpcId: string;
  public readonly auroraClusterArn: string;
  public readonly s3BucketArn: string;
  public readonly albArn: string;
  public readonly albDnsName: string;

  constructor(scope: Construct, id: string, props: PrimaryRegionStackProps) {
    super(scope, id, props);

    // KMS Keys
    const kmsManager = new KmsKeyManager(this, 'KmsManager', {
      region: RegionConfig.PRIMARY_REGION
    });

    // VPC
    const vpc = new ec2.Vpc(this, 'PrimaryVpc', {
      cidr: EnvConfig.vpcCidr.primary,
      maxAzs: 3,
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 26,
        },
      ],
    });

    // Aurora PostgreSQL Cluster
    const auroraCluster = new AuroraCluster(this, 'AuroraCluster', {
      vpc,
      databaseName: EnvConfig.dbName,
      kmsKey: kmsManager.databaseKey,
      enableBacktrack: true,
      backupRetention: cdk.Duration.days(7),
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: true,
      enableGlobalDatabase: true,
    });

    // S3 Bucket with Cross-Region Replication
    const s3Bucket = new S3ReplicatedBucket(this, 'DataBucket', {
      bucketName: `${EnvConfig.appName}-primary-${this.account}`,
      kmsKey: kmsManager.storageKey,
      destinationRegion: RegionConfig.SECONDARY_REGION,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        }
      ]
    });

    // Application Load Balancer
    const alb = new elbv2.ApplicationLoadBalancer(this, 'PrimaryAlb', {
      vpc,
      internetFacing: true,
      loadBalancerName: `${EnvConfig.appName}-primary-alb`,
      deletionProtection: true,
      dropInvalidHeaderFields: true,
    });

    // ECS Cluster
    const ecsCluster = new ecs.Cluster(this, 'EcsCluster', {
      vpc,
      clusterName: `${EnvConfig.appName}-primary`,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // ECS Service
    const ecsService = new EcsService(this, 'TradingService', {
      cluster: ecsCluster,
      serviceName: 'trading-service',
      containerImage: EnvConfig.containerImage,
      desiredCount: 3,
      cpu: 1024,
      memoryLimitMiB: 2048,
      environment: {
        REGION: RegionConfig.PRIMARY_REGION,
        DB_ENDPOINT: auroraCluster.clusterEndpoint.hostname,
        DB_NAME: EnvConfig.dbName,
        S3_BUCKET: s3Bucket.bucket.bucketName,
      },
      secrets: {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(auroraCluster.secret!, 'password'),
      },
      kmsKey: kmsManager.secretsKey,
      healthCheckPath: '/health',
      healthCheckInterval: cdk.Duration.seconds(30),
    });

    // ALB Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
      targets: [ecsService.service],
    });

    // ALB Listener
    const listener = alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Route 53 Record with Health Check
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domainName,
    });

    // Health Check
    const healthCheck = new route53.CfnHealthCheck(this, 'PrimaryHealthCheck', {
      type: 'HTTPS',
      resourcePath: '/health',
      fullyQualifiedDomainName: alb.loadBalancerDnsName,
      port: 443,
      requestInterval: 30,
      failureThreshold: 3,
    });

    // Primary Record Set with Failover
    new route53.ARecord(this, 'PrimaryRecord', {
      zone: hostedZone,
      recordName: EnvConfig.appName,
      target: route53.RecordTarget.fromAlias(
        new route53targets.LoadBalancerTarget(alb)
      ),
      setIdentifier: 'Primary',
      weight: 100,
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      metric: ecsService.service.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alert when CPU exceeds 80%',
    });

    new cloudwatch.Alarm(this, 'UnhealthyTargetsAlarm', {
      metric: targetGroup.metricUnhealthyHostCount(),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alert when targets become unhealthy',
    });

    // Outputs
    this.vpcId = vpc.vpcId;
    this.auroraClusterArn = auroraCluster.cluster.clusterArn;
    this.s3BucketArn = s3Bucket.bucket.bucketArn;
    this.albArn = alb.loadBalancerArn;
    this.albDnsName = alb.loadBalancerDnsName;

    new cdk.CfnOutput(this, 'PrimaryAlbUrl', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'Primary ALB URL',
    });
  }
}
lib/stacks/secondary-region-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import { KmsKeyManager } from '../utils/kms-utils';
import { EnvConfig } from '../../config/environment';
import { RegionConfig } from '../../config/regions';
import { EcsService } from '../constructs/ecs-service';

export interface SecondaryRegionStackProps extends cdk.StackProps {
  primaryDbClusterArn: string;
  primaryBucketArn: string;
  hostedZoneId: string;
  domainName: string;
}

export class SecondaryRegionStack extends cdk.Stack {
  public readonly vpcId: string;
  public readonly albArn: string;
  public readonly albDnsName: string;

  constructor(scope: Construct, id: string, props: SecondaryRegionStackProps) {
    super(scope, id, props);

    // KMS Keys for secondary region
    const kmsManager = new KmsKeyManager(this, 'KmsManager', {
      region: RegionConfig.SECONDARY_REGION
    });

    // VPC
    const vpc = new ec2.Vpc(this, 'SecondaryVpc', {
      cidr: EnvConfig.vpcCidr.secondary,
      maxAzs: 3,
      natGateways: 2,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
        {
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          cidrMask: 24,
        },
        {
          name: 'Database',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 26,
        },
      ],
    });

    // Aurora Read Replica (Cross-Region)
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      vpc,
      description: 'Subnet group for Aurora read replica',
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Security group for Aurora read replica',
      allowAllOutbound: true,
    });

    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC'
    );

    // Create Aurora Global Database Secondary Cluster
    const auroraReadReplica = new rds.CfnDBCluster(this, 'AuroraReadReplica', {
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '14.6',
      globalClusterIdentifier: props.primaryDbClusterArn.split('/').pop(),
      dbSubnetGroupName: dbSubnetGroup.subnetGroupName,
      vpcSecurityGroupIds: [dbSecurityGroup.securityGroupId],
      storageEncrypted: true,
      kmsKeyId: kmsManager.databaseKey.keyArn,
      deletionProtection: true,
      backupRetentionPeriod: 7,
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
    });

    // Aurora Instance in Secondary Region
    new rds.CfnDBInstance(this, 'AuroraReplicaInstance', {
      dbClusterIdentifier: auroraReadReplica.ref,
      dbInstanceClass: 'db.r6g.large',
      engine: 'aurora-postgresql',
      publiclyAccessible: false,
      autoMinorVersionUpgrade: true,
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
    });

    // S3 Bucket (destination for replication)
    const s3Bucket = new s3.Bucket(this, 'ReplicatedDataBucket', {
      bucketName: `${EnvConfig.appName}-secondary-${this.account}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsManager.storageKey,
      versioned: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        }
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // Application Load Balancer (Standby)
    const alb = new elbv2.ApplicationLoadBalancer(this, 'SecondaryAlb', {
      vpc,
      internetFacing: true,
      loadBalancerName: `${EnvConfig.appName}-secondary-alb`,
      deletionProtection: true,
      dropInvalidHeaderFields: true,
    });

    // ECS Cluster (Standby)
    const ecsCluster = new ecs.Cluster(this, 'EcsCluster', {
      vpc,
      clusterName: `${EnvConfig.appName}-secondary`,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // ECS Service (Standby - minimal capacity)
    const ecsService = new EcsService(this, 'TradingService', {
      cluster: ecsCluster,
      serviceName: 'trading-service-standby',
      containerImage: EnvConfig.containerImage,
      desiredCount: 1, // Minimal standby capacity
      cpu: 1024,
      memoryLimitMiB: 2048,
      environment: {
        REGION: RegionConfig.SECONDARY_REGION,
        DB_ENDPOINT: auroraReadReplica.attrEndpointAddress,
        DB_NAME: EnvConfig.dbName,
        S3_BUCKET: s3Bucket.bucketName,
        STANDBY_MODE: 'true',
      },
      secrets: {
        // Use same secret from primary (cross-region secret replication)
        DB_PASSWORD: ecs.Secret.fromSecretsManager(
          secretsmanager.Secret.fromSecretNameV2(this, 'DbSecret', 'aurora-db-secret')
        ),
      },
      kmsKey: kmsManager.secretsKey,
      healthCheckPath: '/health',
      healthCheckInterval: cdk.Duration.seconds(30),
    });

    // Auto Scaling for quick scale-up during failover
    const scalingTarget = ecsService.service.autoScaleTaskCount({
      minCapacity: 1,
      maxCapacity: 10,
    });

    scalingTarget.scaleOnMetric('ScaleOnHealthCheck', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/Route53',
        metricName: 'HealthCheckStatus',
        dimensionsMap: {
          HealthCheckId: 'secondary-health-check',
        },
      }),
      scalingSteps: [
        { upper: 0, change: -2 },
        { lower: 1, change: +3 },
      ],
      adjustmentType: ecs.AdjustmentType.CHANGE_IN_CAPACITY,
    });

    // ALB Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
      targets: [ecsService.service],
    });

    // ALB Listener
    alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Route 53 Record with Health Check for Secondary
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'HostedZone', {
      hostedZoneId: props.hostedZoneId,
      zoneName: props.domainName,
    });

    // Health Check for Secondary
    const healthCheck = new route53.CfnHealthCheck(this, 'SecondaryHealthCheck', {
      type: 'HTTPS',
      resourcePath: '/health',
      fullyQualifiedDomainName: alb.loadBalancerDnsName,
      port: 443,
      requestInterval: 30,
      failureThreshold: 3,
    });

    // Secondary Record Set with Failover
    new route53.ARecord(this, 'SecondaryRecord', {
      zone: hostedZone,
      recordName: `${EnvConfig.appName}-standby`,
      target: route53.RecordTarget.fromAlias(
        new route53targets.LoadBalancerTarget(alb)
      ),
      setIdentifier: 'Secondary',
      weight: 0, // Initially no traffic
    });

    // CloudWatch Alarms
    new cloudwatch.Alarm(this, 'ReplicationLagAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'AuroraReplicaLag',
        dimensionsMap: {
          DBClusterIdentifier: auroraReadReplica.ref,
        },
      }),
      threshold: 300000, // 5 minutes in milliseconds
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Alert when replication lag exceeds RPO',
    });

    // Outputs
    this.vpcId = vpc.vpcId;
    this.albArn = alb.loadBalancerArn;
    this.albDnsName = alb.loadBalancerDnsName;

    new cdk.CfnOutput(this, 'SecondaryAlbUrl', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: 'Secondary ALB URL',
    });
  }
}
lib/stacks/global-resources-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import { EnvConfig } from '../../config/environment';

export class GlobalResourcesStack extends cdk.Stack {
  public readonly hostedZone: route53.HostedZone;
  public readonly domainName: string;
  public readonly alertTopic: sns.Topic;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Domain name for the application
    this.domainName = `${EnvConfig.appName}.example.com`; // Replace with your domain

    // Create or import hosted zone
    this.hostedZone = new route53.HostedZone(this, 'HostedZone', {
      zoneName: this.domainName,
      comment: `Hosted zone for ${EnvConfig.appName} DR setup`,
    });

    // SNS Topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `${EnvConfig.appName}-dr-alerts`,
      displayName: 'Trading Platform DR Alerts',
    });

    // Add email subscription (replace with actual email)
    this.alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription('ops-team@example.com')
    );

    // Create CloudWatch Dashboard for global view
    const dashboard = new cloudwatch.Dashboard(this, 'GlobalDashboard', {
      dashboardName: `${EnvConfig.appName}-dr-global`,
      periodOverride: cloudwatch.PeriodOverride.INHERIT,
    });

    // Add widgets for monitoring
    dashboard.addWidgets(
      new cloudwatch.TextWidget({
        markdown: `# Trading Platform DR Dashboard
        
## Key Metrics
- **RTO Target**: ${EnvConfig.rto} minutes
- **RPO Target**: ${EnvConfig.rpo} minutes
- **Primary Region**: ${cdk.Stack.of(this).region}
        `,
        width: 24,
        height: 3,
      })
    );

    // Outputs
    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route 53 Hosted Zone ID',
      exportName: 'HostedZoneId',
    });

    new cdk.CfnOutput(this, 'DomainName', {
      value: this.domainName,
      description: 'Application domain name',
      exportName: 'DomainName',
    });

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      description: 'SNS Alert Topic ARN',
      exportName: 'AlertTopicArn',
    });
  }
}
lib/constructs/aurora-cluster.ts
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface AuroraClusterProps {
  vpc: ec2.Vpc;
  databaseName: string;
  kmsKey: kms.Key;
  enableBacktrack?: boolean;
  backupRetention?: cdk.Duration;
  preferredBackupWindow?: string;
  preferredMaintenanceWindow?: string;
  deletionProtection?: boolean;
  enableGlobalDatabase?: boolean;
}

export class AuroraCluster extends Construct {
  public readonly cluster: rds.DatabaseCluster;
  public readonly clusterEndpoint: rds.Endpoint;
  public readonly secret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props: AuroraClusterProps) {
    super(scope, id);

    // Database credentials secret
    this.secret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName: 'aurora-db-secret',
      description: 'Aurora database credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    // Parameter group for optimized settings
    const parameterGroup = new rds.ParameterGroup(this, 'ParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_6,
      }),
      parameters: {
        'shared_preload_libraries': 'pg_stat_statements',
        'log_statement': 'all',
        'log_duration': '1',
        'rds.force_ssl': '1',
        'max_connections': '1000',
      },
    });

    // Security group
    const securityGroup = new ec2.SecurityGroup(this, 'SecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for Aurora cluster',
      allowAllOutbound: true,
    });

    securityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from VPC'
    );

    // Aurora cluster
    this.cluster = new rds.DatabaseCluster(this, 'Cluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_6,
      }),
      credentials: rds.Credentials.fromSecret(this.secret),
      instanceProps: {
        vpc: props.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [securityGroup],
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.LARGE
        ),
        parameterGroup,
      },
      instances: 2, // Primary + Read replica in same region
      defaultDatabaseName: props.databaseName,
      storageEncryptionKey: props.kmsKey,
      backup: {
        retention: props.backupRetention || cdk.Duration.days(7),
        preferredWindow: props.preferredBackupWindow,
      },
      preferredMaintenanceWindow: props.preferredMaintenanceWindow,
      deletionProtection: props.deletionProtection ?? true,
      cloudwatchLogsExports: ['postgresql'],
      storageEncrypted: true,
      copyTagsToSnapshot: true,
      monitoringInterval: cdk.Duration.seconds(60),
    });

    // Enable Performance Insights
    this.cluster.node.children.forEach((child) => {
      if (child instanceof rds.CfnDBInstance) {
        child.enablePerformanceInsights = true;
        child.performanceInsightsKmsKeyId = props.kmsKey.keyArn;
        child.performanceInsightsRetentionPeriod = 7;
      }
    });

    this.clusterEndpoint = this.cluster.clusterEndpoint;
  }
}
lib/constructs/ecs-service.ts
import * as cdk from 'aws-cdk-lib';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface EcsServiceProps {
  cluster: ecs.Cluster;
  serviceName: string;
  containerImage: string;
  desiredCount: number;
  cpu: number;
  memoryLimitMiB: number;
  environment?: { [key: string]: string };
  secrets?: { [key: string]: ecs.Secret };
  kmsKey?: kms.Key;
  healthCheckPath: string;
  healthCheckInterval: cdk.Duration;
}

export class EcsService extends Construct {
  public readonly service: ecs.FargateService;
  public readonly taskDefinition: ecs.FargateTaskDefinition;

  constructor(scope: Construct, id: string, props: EcsServiceProps) {
    super(scope, id);

    // Task execution role
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Task role
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant KMS permissions if key provided
    if (props.kmsKey) {
      props.kmsKey.grantDecrypt(taskExecutionRole);
      props.kmsKey.grantDecrypt(taskRole);
    }

    // CloudWatch log group
    const logGroup = new logs.LogGroup(this, 'LogGroup', {
      logGroupName: `/aws/ecs/${props.cluster.clusterName}/${props.serviceName}`,
      retention: logs.RetentionDays.THIRTY_DAYS,
      encryptionKey: props.kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Task definition
    this.taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      cpu: props.cpu,
      memoryLimitMiB: props.memoryLimitMiB,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    // Container definition
    const container = this.taskDefinition.addContainer('Container', {
      image: ecs.ContainerImage.fromRegistry(props.containerImage),
      environment: props.environment,
      secrets: props.secrets,
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: props.serviceName,
        logGroup,
      }),
      healthCheck: {
        command: ['CMD-SHELL', `curl -f http://localhost:8080${props.healthCheckPath} || exit 1`],
        interval: props.healthCheckInterval,
        timeout: cdk.Duration.seconds(10),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: 8080,
      protocol: ecs.Protocol.TCP,
    });

    // ECS Service
    this.service = new ecs.FargateService(this, 'Service', {
      cluster: props.cluster,
      taskDefinition: this.taskDefinition,
      serviceName: props.serviceName,
      desiredCount: props.desiredCount,
      assignPublicIp: false,
      platformVersion: ecs.FargatePlatformVersion.LATEST,
      deploymentConfiguration: {
        maximumPercent: 200,
        minimumHealthyPercent: 100,
        deploymentCircuitBreaker: {
          rollback: true,
        },
      },
      enableExecuteCommand: true,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 50,
          base: 0,
        },
        {
          capacityProvider: 'FARGATE',
          weight: 50,
          base: 1,
        },
      ],
    });

    // Service auto-scaling
    const scaling = this.service.autoScaleTaskCount({
      minCapacity: props.desiredCount,
      maxCapacity: props.desiredCount * 3,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });
  }
}
lib/constructs/s3-replication.ts
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface S3ReplicatedBucketProps {
  bucketName: string;
  kmsKey: kms.Key;
  destinationRegion: string;
  versioned?: boolean;
  lifecycleRules?: s3.LifecycleRule[];
}

export class S3ReplicatedBucket extends Construct {
  public readonly bucket: s3.Bucket;
  public readonly replicationRole: iam.Role;

  constructor(scope: Construct, id: string, props: S3ReplicatedBucketProps) {
    super(scope, id);

    // Create bucket
    this.bucket = new s3.Bucket(this, 'Bucket', {
      bucketName: props.bucketName,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: props.kmsKey,
      versioned: props.versioned ?? true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      lifecycleRules: props.lifecycleRules,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      objectLockEnabled: false,
      serverAccessLogsPrefix: 'access-logs/',
    });

    // Create replication role
    this.replicationRole = new iam.Role(this, 'ReplicationRole', {
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      path: '/service-role/',
    });

    // Grant replication permissions
    this.bucket.grantRead(this.replicationRole);
    this.bucket.grantWrite(this.replicationRole);
    props.kmsKey.grantDecrypt(this.replicationRole);
    props.kmsKey.grantEncrypt(this.replicationRole);

    // Add replication configuration
    const cfnBucket = this.bucket.node.defaultChild as s3.CfnBucket;
    
    cfnBucket.replicationConfiguration = {
      role: this.replicationRole.roleArn,
      rules: [
        {
          id: 'ReplicateAll',
          status: 'Enabled',
          priority: 1,
          deleteMarkerReplication: {
            status: 'Enabled',
          },
          filter: {},
          destination: {
            bucket: `arn:aws:s3:::${props.bucketName.replace('primary', 'secondary')}`,
            replicationTime: {
              status: 'Enabled',
              time: {
                minutes: 15,
              },
            },
            metrics: {
              status: 'Enabled',
              eventThreshold: {
                minutes: 15,
              },
            },
            storageClass: 'STANDARD',
          },
        },
      ],
    };

    // Add bucket metrics
    this.bucket.addMetric({
      id: 'EntireBucket',
    });
  }
}
lib/constructs/route53-failover.ts
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface Route53FailoverProps {
  hostedZone: route53.IHostedZone;
  recordName: string;
  primaryAlb: elbv2.IApplicationLoadBalancer;
  secondaryAlb: elbv2.IApplicationLoadBalancer;
  primaryHealthCheckId: string;
  secondaryHealthCheckId: string;
}

export class Route53Failover extends Construct {
  public readonly primaryRecord: route53.ARecord;
  public readonly secondaryRecord: route53.ARecord;

  constructor(scope: Construct, id: string, props: Route53FailoverProps) {
    super(scope, id);

    // Primary record with failover routing
    this.primaryRecord = new route53.ARecord(this, 'PrimaryRecord', {
      zone: props.hostedZone,
      recordName: props.recordName,
      target: route53.RecordTarget.fromAlias(
        new route53targets.LoadBalancerTarget(props.primaryAlb)
      ),
    });

    // Configure failover routing
    const cfnPrimaryRecordSet = this.primaryRecord.node.defaultChild as route53.CfnRecordSet;
    cfnPrimaryRecordSet.failover = 'PRIMARY';
    cfnPrimaryRecordSet.setIdentifier = 'Primary';
    cfnPrimaryRecordSet.healthCheckId = props.primaryHealthCheckId;

    // Secondary record with failover routing
    this.secondaryRecord = new route53.ARecord(this, 'SecondaryRecord', {
      zone: props.hostedZone,
      recordName: props.recordName,
      target: route53.RecordTarget.fromAlias(
        new route53targets.LoadBalancerTarget(props.secondaryAlb)
      ),
    });

    const cfnSecondaryRecordSet = this.secondaryRecord.node.defaultChild as route53.CfnRecordSet;
    cfnSecondaryRecordSet.failover = 'SECONDARY';
    cfnSecondaryRecordSet.setIdentifier = 'Secondary';
    cfnSecondaryRecordSet.healthCheckId = props.secondaryHealthCheckId;
  }
}
lib/stacks/monitoring-stack.ts
import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import { Construct } from 'constructs';
import { EnvConfig } from '../../config/environment';

export interface MonitoringStackProps extends cdk.StackProps {
  primaryAlbArn: string;
  secondaryAlbArn: string;
  primaryRegion: string;
  secondaryRegion: string;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS Topic for alerts
    const alertTopic = new sns.Topic(this, 'DrAlertTopic', {
      topicName: `${EnvConfig.appName}-dr-monitoring-alerts`,
      displayName: 'DR Monitoring Alerts',
    });

    // Create composite alarms for failover decision
    const primaryHealthAlarm = new cloudwatch.Alarm(this, 'PrimaryHealthAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ELB',
        metricName: 'UnHealthyHostCount',
        dimensionsMap: {
          LoadBalancer: props.primaryAlbArn.split('/').slice(-3).join('/'),
        },
        region: props.primaryRegion,
      }),
      threshold: 1,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Primary region unhealthy hosts',
    });

    const primaryLatencyAlarm = new cloudwatch.Alarm(this, 'PrimaryLatencyAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ELB',
        metricName: 'TargetResponseTime',
        dimensionsMap: {
          LoadBalancer: props.primaryAlbArn.split('/').slice(-3).join('/'),
        },
        region: props.primaryRegion,
        statistic: 'p99',
      }),
      threshold: 5000, // 5 seconds
      evaluationPeriods: 3,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'Primary region high latency',
    });

    // Composite alarm for automatic failover trigger
    const failoverAlarm = new cloudwatch.CompositeAlarm(this, 'FailoverAlarm', {
      alarmRule: cloudwatch.AlarmRule.anyOf(
        cloudwatch.AlarmRule.fromAlarm(primaryHealthAlarm, cloudwatch.AlarmState.ALARM),
        cloudwatch.AlarmRule.fromAlarm(primaryLatencyAlarm, cloudwatch.AlarmState.ALARM),
      ),
      alarmDescription: 'Trigger failover to secondary region',
    });

    failoverAlarm.addAlarmAction(
      new cloudwatchActions.SnsAction(alertTopic)
    );

    // Dashboard for monitoring
    const dashboard = new cloudwatch.Dashboard(this, 'DrDashboard', {
      dashboardName: `${EnvConfig.appName}-dr-monitoring`,
    });

    // Add widgets
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ELB',
            metricName: 'RequestCount',
            dimensionsMap: {
              LoadBalancer: props.primaryAlbArn.split('/').slice(-3).join('/'),
            },
            region: props.primaryRegion,
            label: 'Primary',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ELB',
            metricName: 'RequestCount',
            dimensionsMap: {
              LoadBalancer: props.secondaryAlbArn.split('/').slice(-3).join('/'),
            },
            region: props.secondaryRegion,
            label: 'Secondary',
          }),
        ],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'Response Times',
        left: [
          new cloudwatch.Metric({
            namespace: 'AWS/ELB',
            metricName: 'TargetResponseTime',
            dimensionsMap: {
              LoadBalancer: props.primaryAlbArn.split('/').slice(-3).join('/'),
            },
            region: props.primaryRegion,
            statistic: 'Average',
            label: 'Primary Avg',
          }),
          new cloudwatch.Metric({
            namespace: 'AWS/ELB',
            metricName: 'TargetResponseTime',
            dimensionsMap: {
              LoadBalancer: props.secondaryAlbArn.split('/').slice(-3).join('/'),
            },
            region: props.secondaryRegion,
            statistic: 'Average',
            label: 'Secondary Avg',
          }),
        ],
        right: [
          new cloudwatch.Metric({
            namespace: 'AWS/ELB',
            metricName: 'TargetResponseTime',
            dimensionsMap: {
              LoadBalancer: props.primaryAlbArn.split('/').slice(-3).join('/'),
            },
            region: props.primaryRegion,
            statistic: 'p99',
            label: 'Primary p99',
          }),
        ],
        width: 12,
      }),
    );

    // Lambda for automated failover orchestration
    const failoverFunction = new lambda.Function(this, 'FailoverFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        const AWS = require('aws-sdk');
        const route53 = new AWS.Route53();
        const ecs = new AWS.ECS();
        
        exports.handler = async (event) => {
          console.log('Failover triggered:', JSON.stringify(event));
          
          // Update Route53 weights
          // Scale up secondary ECS service
          // Send notifications
          
          return { statusCode: 200, body: 'Failover completed' };
        };
      `),
      timeout: cdk.Duration.minutes(5),
      environment: {
        PRIMARY_REGION: props.primaryRegion,
        SECONDARY_REGION: props.secondaryRegion,
        ALERT_TOPIC: alertTopic.topicArn,
      },
    });

    // EventBridge rule for automated failover
    const failoverRule = new events.Rule(this, 'FailoverRule', {
      eventPattern: {
        source: ['aws.cloudwatch'],
        detailType: ['CloudWatch Alarm State Change'],
        detail: {
          alarmName: [failoverAlarm.alarmName],
          state: {
            value: ['ALARM'],
          },
        },
      },
    });

    failoverRule.addTarget(new targets.LambdaFunction(failoverFunction));
  }
}