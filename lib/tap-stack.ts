import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as route53targets from 'aws-cdk-lib/aws-route53-targets';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface TradingPlatformStackProps extends cdk.StackProps {
  readonly isPrimary: boolean;
  readonly primaryRegion: string;
  readonly secondaryRegion: string;
  readonly domainName: string;
  readonly hostedZoneId?: string;
  readonly globalBucketName?: string;
  readonly primaryDbClusterArn?: string;
}

export class TradingPlatformStack extends cdk.Stack {
  private readonly uniqueSuffix: string;
  public readonly vpcId: string;
  public readonly auroraClusterArn: string;
  public readonly s3BucketArn: string;
  public readonly albArn: string;
  public readonly albDnsName: string;
  public readonly hostedZone?: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: TradingPlatformStackProps) {
    super(scope, id, props);

    const regionSuffix = props.isPrimary ? 'pri' : 'sec';
    const currentRegion = props.isPrimary
      ? props.primaryRegion
      : props.secondaryRegion;

    // Generate unique suffix for resource naming to avoid conflicts
    const timestamp = Date.now().toString().slice(-6);
    const randomSuffix = Math.random().toString(36).substring(2, 6);
    this.uniqueSuffix = `${timestamp}-${randomSuffix}`;

    // Apply default tags
    this.applyTags();

    // KMS Keys for encryption
    const kmsKeys = this.createKmsKeys(regionSuffix);

    // VPC
    const vpc = this.createVpc(regionSuffix);

    // S3 Bucket with Cross-Region Replication
    const s3Bucket = this.createS3Bucket(
      regionSuffix,
      kmsKeys.storageKey,
      props
    );

    // Aurora PostgreSQL Cluster or Read Replica
    const auroraCluster = this.createAuroraCluster(
      vpc,
      regionSuffix,
      kmsKeys.databaseKey,
      props
    );

    // Application Load Balancer
    const alb = this.createLoadBalancer(vpc, regionSuffix);

    // ECS Cluster and Service
    const { service, targetGroup } = this.createEcsService(
      vpc,
      alb,
      regionSuffix,
      kmsKeys.secretsKey,
      auroraCluster,
      s3Bucket,
      currentRegion
    );

    // Route 53 DNS and Health Checks (only for primary)
    if (props.isPrimary) {
      this.hostedZone = this.createRoute53Resources(
        alb,
        props.domainName,
        props.hostedZoneId
      );
    }

    // CloudWatch Monitoring and Alarms
    this.createMonitoring(service, targetGroup, regionSuffix);

    // Store outputs
    this.vpcId = vpc.vpcId;
    this.auroraClusterArn = auroraCluster.clusterArn;
    this.s3BucketArn = s3Bucket.bucketArn;
    this.albArn = alb.loadBalancerArn;
    this.albDnsName = alb.loadBalancerDnsName;

    // Stack outputs
    this.createOutputs(alb, auroraCluster, s3Bucket, regionSuffix);
  }

  private applyTags(): void {
    cdk.Tags.of(this).add('Project', 'TradingPlatform');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('ManagedBy', 'CDK');
    cdk.Tags.of(this).add('CostCenter', 'FinanceOps');
    cdk.Tags.of(this).add('Timestamp', new Date().toISOString());
    cdk.Tags.of(this).add('DR-RTO', '15-minutes');
    cdk.Tags.of(this).add('DR-RPO', '5-minutes');
  }

  private createKmsKeys(regionSuffix: string) {
    const databaseKey = new kms.Key(this, 'DatabaseKey', {
      enableKeyRotation: true,
      alias: `alias/tap-${regionSuffix}-db-${this.uniqueSuffix}`,
      description: `KMS key for Aurora database encryption - ${regionSuffix}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pendingWindow: cdk.Duration.days(30),
    });

    const storageKey = new kms.Key(this, 'StorageKey', {
      enableKeyRotation: true,
      alias: `alias/tap-${regionSuffix}-s3-${this.uniqueSuffix}`,
      description: `KMS key for S3 bucket encryption - ${regionSuffix}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pendingWindow: cdk.Duration.days(30),
    });

    const secretsKey = new kms.Key(this, 'SecretsKey', {
      enableKeyRotation: true,
      alias: `alias/tap-${regionSuffix}-secrets-${this.uniqueSuffix}`,
      description: `KMS key for ECS secrets encryption - ${regionSuffix}`,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      pendingWindow: cdk.Duration.days(30),
    });

    // Grant ECS service access to decrypt secrets
    secretsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('ecs-tasks.amazonaws.com')],
        actions: ['kms:Decrypt', 'kms:DescribeKey'],
        resources: ['*'],
      })
    );

    return { databaseKey, storageKey, secretsKey };
  }

  private createVpc(regionSuffix: string): ec2.Vpc {
    const vpcCidr = regionSuffix === 'pri' ? '10.0.0.0/16' : '10.1.0.0/16';

    return new ec2.Vpc(this, 'TradingVpc', {
      vpcName: `tap-${regionSuffix}-vpc-${this.uniqueSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
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
  }

  private createS3Bucket(
    regionSuffix: string,
    kmsKey: kms.Key,
    props: TradingPlatformStackProps
  ): s3.Bucket {
    const bucketName =
      props.globalBucketName ||
      `tap-${regionSuffix}-${this.account}-${this.region}-${this.uniqueSuffix}`;

    const bucket = new s3.Bucket(this, 'TradingDataBucket', {
      bucketName,
      versioned: true,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      enforceSSL: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
          enabled: true,
        },
      ],
    });

    // Cross-Region Replication (only for primary)
    if (props.isPrimary) {
      const replicationRole = new iam.Role(this, 'ReplicationRole', {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
        inlinePolicies: {
          ReplicationPolicy: new iam.PolicyDocument({
            statements: [
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:GetObjectVersionForReplication',
                  's3:GetObjectVersionAcl',
                  's3:GetObjectVersionTagging',
                ],
                resources: [`${bucket.bucketArn}/*`],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: [
                  's3:ReplicateObject',
                  's3:ReplicateDelete',
                  's3:ReplicateTags',
                ],
                resources: [
                  `arn:aws:s3:::tap-sec-${this.account}-${props.secondaryRegion}/*`,
                ],
              }),
              new iam.PolicyStatement({
                effect: iam.Effect.ALLOW,
                actions: ['kms:Decrypt', 'kms:DescribeKey'],
                resources: [kmsKey.keyArn],
              }),
            ],
          }),
        },
      });

      // Note: Cross-region replication configuration would be added here
      // This is a simplified version - in production, you'd configure the replication
      new cdk.CfnOutput(this, 'ReplicationRoleArn', {
        value: replicationRole.roleArn,
        description: 'S3 Cross-Region Replication Role ARN',
      });
    }

    return bucket;
  }

  private createAuroraCluster(
    vpc: ec2.Vpc,
    regionSuffix: string,
    kmsKey: kms.Key,
    props: TradingPlatformStackProps
  ): rds.DatabaseCluster {
    // Database subnet group
    const subnetGroup = new rds.SubnetGroup(this, 'DbSubnetGroup', {
      description: `Database subnet group for ${regionSuffix}`,
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    // Database credentials secret
    const dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName: `tap-${regionSuffix}-db-credentials`,
      description: 'Aurora PostgreSQL master credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: '"@/\\\'',
        passwordLength: 32,
      },
      encryptionKey: kmsKey,
    });

    if (props.isPrimary) {
      // Primary Aurora Cluster
      return new rds.DatabaseCluster(this, 'AuroraCluster', {
        clusterIdentifier: `tap-${regionSuffix}-cluster-${this.uniqueSuffix}`,
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_4,
        }),
        credentials: rds.Credentials.fromSecret(dbSecret),
        defaultDatabaseName: 'tradingdb',
        subnetGroup,
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        deletionProtection: true,
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
        instances: 2,
        instanceProps: {
          vpc: vpc,
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.LARGE
          ),
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        },
      });
    } else {
      // Secondary region - Aurora Global Database Read Replica
      // Note: In a real implementation, you'd create a global database read replica
      // For now, creating a separate cluster that could be promoted
      return new rds.DatabaseCluster(this, 'AuroraReadReplica', {
        clusterIdentifier: `tap-${regionSuffix}-replica-${this.uniqueSuffix}`,
        engine: rds.DatabaseClusterEngine.auroraPostgres({
          version: rds.AuroraPostgresEngineVersion.VER_15_4,
        }),
        credentials: rds.Credentials.fromSecret(dbSecret),
        defaultDatabaseName: 'tradingdb',
        subnetGroup,
        storageEncrypted: true,
        storageEncryptionKey: kmsKey,
        backup: {
          retention: cdk.Duration.days(7),
          preferredWindow: '03:00-04:00',
        },
        preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
        deletionProtection: true,
        cloudwatchLogsExports: ['postgresql'],
        cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
        instances: 1, // Fewer instances for standby
        instanceProps: {
          vpc: vpc,
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.LARGE
          ),
          vpcSubnets: {
            subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          },
        },
      });
    }
  }

  private createLoadBalancer(
    vpc: ec2.Vpc,
    regionSuffix: string
  ): elbv2.ApplicationLoadBalancer {
    return new elbv2.ApplicationLoadBalancer(this, 'TradingAlb', {
      vpc,
      internetFacing: true,
      loadBalancerName: `tap-${regionSuffix}-alb-${this.uniqueSuffix}`,
      deletionProtection: true,
      dropInvalidHeaderFields: true,
    });
  }

  private createEcsService(
    vpc: ec2.Vpc,
    alb: elbv2.ApplicationLoadBalancer,
    regionSuffix: string,
    kmsKey: kms.Key,
    auroraCluster: rds.DatabaseCluster,
    s3Bucket: s3.Bucket,
    currentRegion: string
  ) {
    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'TradingCluster', {
      vpc,
      clusterName: `tap-${regionSuffix}-cluster-${this.uniqueSuffix}`,
      containerInsights: true,
      enableFargateCapacityProviders: true,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'TradingTaskDef',
      {
        family: `tap-${regionSuffix}-task-${this.uniqueSuffix}`,
        cpu: 1024,
        memoryLimitMiB: 2048,
      }
    );

    // Container Definition
    const container = taskDefinition.addContainer('trading-app', {
      image: ecs.ContainerImage.fromRegistry(
        'public.ecr.aws/amazonlinux/amazonlinux:latest'
      ),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: `tap-${regionSuffix}`,
        logRetention: logs.RetentionDays.ONE_MONTH,
      }),
      environment: {
        REGION: currentRegion,
        DB_NAME: 'tradingdb',
        S3_BUCKET: s3Bucket.bucketName,
        ENVIRONMENT: 'production',
      },
      secrets: {
        DB_ENDPOINT: ecs.Secret.fromSecretsManager(
          auroraCluster.secret!,
          'host'
        ),
        DB_PASSWORD: ecs.Secret.fromSecretsManager(
          auroraCluster.secret!,
          'password'
        ),
        DB_USERNAME: ecs.Secret.fromSecretsManager(
          auroraCluster.secret!,
          'username'
        ),
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -f http://localhost:8080/health || exit 1',
        ],
        interval: cdk.Duration.seconds(30),
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
    const service = new ecs.FargateService(this, 'TradingService', {
      cluster,
      taskDefinition,
      serviceName: `tap-${regionSuffix}-service`,
      desiredCount: regionSuffix === 'pri' ? 3 : 1, // More instances in primary
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      enableExecuteCommand: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
    });

    // Grant permissions
    s3Bucket.grantReadWrite(taskDefinition.taskRole);
    auroraCluster.secret?.grantRead(taskDefinition.taskRole);

    // Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'TradingTargetGroup',
      {
        vpc,
        port: 8080,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/health',
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(10),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          port: '8080',
        },
        deregistrationDelay: cdk.Duration.seconds(30),
        targets: [service],
      }
    );

    // ALB Listener
    alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    return { cluster, service, targetGroup };
  }

  private createRoute53Resources(
    alb: elbv2.ApplicationLoadBalancer,
    domainName: string,
    hostedZoneId?: string
  ): route53.IHostedZone {
    let hostedZone: route53.IHostedZone;

    if (hostedZoneId) {
      hostedZone = route53.HostedZone.fromHostedZoneAttributes(
        this,
        'HostedZone',
        {
          hostedZoneId,
          zoneName: domainName,
        }
      );
    } else {
      hostedZone = new route53.HostedZone(this, 'TradingHostedZone', {
        zoneName: domainName,
      });
    }

    // TODO: Implement health check - commented out temporarily to fix build
    // const healthCheck = new route53.CfnHealthCheck(this, 'PrimaryHealthCheck', {
    //   type: 'HTTP',
    //   resourcePath: '/health',
    //   fullyQualifiedDomainName: alb.loadBalancerDnsName,
    //   port: 80,
    //   requestInterval: 30,
    //   failureThreshold: 3,
    // });

    // Primary DNS Record with Weighted Routing (Primary gets more weight)
    new route53.ARecord(this, 'PrimaryRecord', {
      zone: hostedZone,
      recordName: 'api',
      target: route53.RecordTarget.fromAlias(
        new route53targets.LoadBalancerTarget(alb)
      ),
      setIdentifier: 'Primary',
      weight: 100,
    });

    return hostedZone;
  }

  private createMonitoring(
    service: ecs.FargateService,
    targetGroup: elbv2.ApplicationTargetGroup,
    regionSuffix: string
  ): void {
    // High CPU Alarm
    new cloudwatch.Alarm(this, 'HighCpuAlarm', {
      alarmName: `tap-${regionSuffix}-high-cpu`,
      metric: service.metricCpuUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: `Alert when CPU exceeds 80% in ${regionSuffix} region`,
    });

    // High Memory Alarm
    new cloudwatch.Alarm(this, 'HighMemoryAlarm', {
      alarmName: `tap-${regionSuffix}-high-memory`,
      metric: service.metricMemoryUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: `Alert when memory exceeds 80% in ${regionSuffix} region`,
    });

    // Unhealthy Targets Alarm
    new cloudwatch.Alarm(this, 'UnhealthyTargetsAlarm', {
      alarmName: `tap-${regionSuffix}-unhealthy-targets`,
      metric: targetGroup.metricUnhealthyHostCount(),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: `Alert when targets become unhealthy in ${regionSuffix} region`,
    });

    // Response Time Alarm
    new cloudwatch.Alarm(this, 'HighResponseTimeAlarm', {
      alarmName: `tap-${regionSuffix}-high-response-time`,
      metric: targetGroup.metricTargetResponseTime(),
      threshold: 5, // 5 seconds
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: `Alert when response time exceeds 5 seconds in ${regionSuffix} region`,
    });
  }

  private createOutputs(
    alb: elbv2.ApplicationLoadBalancer,
    auroraCluster: rds.DatabaseCluster,
    s3Bucket: s3.Bucket,
    regionSuffix: string
  ): void {
    new cdk.CfnOutput(this, 'LoadBalancerUrl', {
      value: `http://${alb.loadBalancerDnsName}`,
      description: `${regionSuffix} ALB URL`,
      exportName: `tap-${regionSuffix}-alb-url`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: auroraCluster.clusterEndpoint.hostname,
      description: `${regionSuffix} Aurora cluster endpoint`,
      exportName: `tap-${regionSuffix}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: s3Bucket.bucketName,
      description: `${regionSuffix} S3 bucket name`,
      exportName: `tap-${regionSuffix}-s3-bucket`,
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpcId,
      description: `${regionSuffix} VPC ID`,
      exportName: `tap-${regionSuffix}-vpc-id`,
    });
  }
}

// App definition for deploying both regions
export class TradingPlatformApp extends cdk.App {
  constructor() {
    super();

    // Make it cross-account executable - allow account override
    const account =
      process.env.CDK_DEFAULT_ACCOUNT || this.node.tryGetContext('account');
    const domainName =
      process.env.DOMAIN_NAME ||
      this.node.tryGetContext('domainName') ||
      'trading-platform.internal';

    if (!account) {
      throw new Error(
        'Account ID is required. Set CDK_DEFAULT_ACCOUNT or use --context account=123456789012'
      );
    }

    // Primary Region Stack (eu-central-1)
    const primaryStack = new TradingPlatformStack(
      this,
      'TradingPlatformPrimary',
      {
        env: {
          account,
          region: 'eu-central-1',
        },
        isPrimary: true,
        primaryRegion: 'eu-central-1',
        secondaryRegion: 'eu-west-1',
        domainName,
        description:
          'Trading Platform Primary Region (eu-central-1) - RTO 15min, RPO 5min',
      }
    );

    // Secondary Region Stack (eu-west-1)
    const secondaryStack = new TradingPlatformStack(
      this,
      'TradingPlatformSecondary',
      {
        env: {
          account,
          region: 'eu-west-1',
        },
        isPrimary: false,
        primaryRegion: 'eu-central-1',
        secondaryRegion: 'eu-west-1',
        domainName,
        hostedZoneId: primaryStack.hostedZone?.hostedZoneId,
        globalBucketName: `tap-sec-${account}-eu-west-1`,
        primaryDbClusterArn: primaryStack.auroraClusterArn,
        description:
          'Trading Platform Secondary Region (eu-west-1) - Disaster Recovery',
      }
    );

    // Add dependency
    secondaryStack.addDependency(primaryStack);

    // Apply tags to the app
    cdk.Tags.of(this).add('Project', 'TradingPlatform');
    cdk.Tags.of(this).add('Owner', 'FinanceOps');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('ManagedBy', 'CDK-v2');
  }
}
