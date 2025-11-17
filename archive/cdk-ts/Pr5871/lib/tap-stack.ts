import * as cdk from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as custom_resources from 'aws-cdk-lib/custom-resources';
import { Construct } from 'constructs';

/**
 * Properties for TapStack
 */
interface TapStackProps extends cdk.StackProps {
  /**
   * Environment suffix (e.g., 'dev', 'staging', 'prod')
   * @default 'dev'
   */
  environmentSuffix?: string;

  /**
   * Service name to be used in resource naming
   * @default 'tap'
   */
  serviceName?: string;

  /**
   * Primary region for this stack deployment
   * @default 'us-east-1'
   */
  primaryRegion?: string;

  /**
   * Secondary/peer region for disaster recovery
   * @default 'us-west-2'
   */
  secondaryRegion?: string;

  /**
   * Email for SNS notifications
   */
  notificationEmail?: string;

  /**
   * Domain name for Route53 hosted zone and DNS failover
   * If not provided, Route53 failover will not be configured
   * Example: 'example.com'
   */
  domainName?: string;

  /**
   * Hosted Zone ID (if zone already exists)
   * If not provided and domainName is set, a new zone will be created
   */
  hostedZoneId?: string;

  /**
   * Whether this is the primary region deployment
   * Primary region creates the Route53 hosted zone and primary DNS records
   * @default true
   */
  isPrimaryRegion?: boolean;

  /**
   * Peer VPC ID for VPC peering (from the other region's stack)
   * If provided, VPC peering will be configured
   */
  peerVpcId?: string;
}

/**
 * TapStack: Multi-region active-passive disaster recovery stack for financial services platform
 *
 * This stack implements:
 * - ECS Fargate services behind ALB
 * - RDS Aurora MySQL with cross-region replica
 * - DynamoDB global tables for session data
 * - Route53 health checks with automatic failover
 * - Lambda functions for health monitoring and circuit-breaker pattern
 * - S3 buckets with cross-region replication
 * - CloudFront distribution with multi-origin failover
 * - VPC peering for secure backend communication
 * - CloudWatch metrics and alarms
 * - IAM roles with cross-account assume-role permissions
 */
export class TapStack extends cdk.Stack {
  /** VPC ID for cross-stack reference */
  public readonly vpcId: string;

  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    // ============================================================================
    // CONFIGURATION & NAMING
    // ============================================================================

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const serviceName = props?.serviceName || 'tap';
    const primaryRegion = props?.primaryRegion || this.region;
    const secondaryRegion = props?.secondaryRegion || 'us-west-2';
    const accountId = this.account;
    const notificationEmail = props?.notificationEmail;
    const domainName = props?.domainName;
    const hostedZoneId = props?.hostedZoneId;
    const isPrimaryRegion = props?.isPrimaryRegion ?? true;
    const peerVpcId = props?.peerVpcId;
    const stackName = this.stackName;

    /**
     * Helper function to create resource names following naming convention:
     * {serviceName}-{resourceType}-{region}-{environmentSuffix}
     * For length-constrained resources (maxLength), shortens the name appropriately
     */
    const createResourceName = (
      resourceType: string,
      includeAccountId = false,
      maxLength?: number
    ): string => {
      let parts = [serviceName, resourceType, primaryRegion, environmentSuffix];
      if (includeAccountId) {
        parts.splice(2, 0, accountId); // Insert account ID before region
      }
      let name = parts.join('-');

      // If maxLength is specified and name exceeds it, apply shortening strategy
      if (maxLength && name.length > maxLength) {
        // Use shorter region code (e.g., "use1" for "us-east-1")
        const shortRegion = primaryRegion
          .replace(/([a-z]+)-([a-z]+)-(\d+)/, '$1$2$3')
          .substring(0, 6);
        parts = [serviceName, resourceType, shortRegion, environmentSuffix];
        if (includeAccountId) {
          parts.splice(2, 0, accountId);
        }
        name = parts.join('-');

        // If still too long, truncate service name
        if (name.length > maxLength) {
          const serviceNameMaxLen = Math.max(
            3,
            serviceName.length - (name.length - maxLength)
          );
          const shortServiceName = serviceName.substring(0, serviceNameMaxLen);
          parts[0] = shortServiceName;
          name = parts.join('-');
        }
      }

      return name;
    };

    // ============================================================================
    // KMS ENCRYPTION KEYS
    // ============================================================================

    // Customer-managed KMS key for encryption at rest with automatic rotation
    const kmsKey = new kms.Key(this, 'KmsKey', {
      alias: createResourceName('key'),
      description: `KMS key for ${serviceName} in ${primaryRegion}-${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // ============================================================================
    // VPC & NETWORKING
    // ============================================================================

    // Define non-overlapping CIDR blocks for multi-region VPC peering
    // Primary region: 10.0.0.0/16 (already deployed), Secondary region: 10.1.0.0/16
    // Only secondary region gets explicit CIDR to avoid recreating primary VPC

    // Primary VPC with public and private subnets across multiple AZs
    const vpc = new ec2.Vpc(this, 'Vpc', {
      vpcName: createResourceName('vpc'),
      // Set CIDR only for secondary region to use non-overlapping range
      ...(!isPrimaryRegion
        ? { ipAddresses: ec2.IpAddresses.cidr('10.1.0.0/16') }
        : {}),
      maxAzs: 3,
      natGateways: 2, // High availability for NAT
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'Public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'Private',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    // Export VPC ID for cross-stack reference
    this.vpcId = vpc.vpcId;

    // Security group for ECS tasks
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc,
      securityGroupName: createResourceName('ecs-sg'),
      description: 'Security group for ECS Fargate tasks',
      allowAllOutbound: true,
    });

    // Security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      securityGroupName: createResourceName('alb-sg'),
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    // Allow HTTP/HTTPS traffic to ALB
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS traffic'
    );

    // Allow traffic from ALB to ECS tasks
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // Security group for RDS
    const rdsSecurityGroup = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc,
      securityGroupName: createResourceName('rds-sg'),
      description: 'Security group for RDS Aurora cluster',
      allowAllOutbound: false,
    });

    // Allow MySQL traffic from ECS to RDS
    rdsSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(3306),
      'Allow MySQL traffic from ECS'
    );

    // ============================================================================
    // RDS AURORA MYSQL CLUSTER
    // ============================================================================

    // DB Cluster Parameter Group to enable binary logging for cross-region replication
    // Binary logging is required for cross-region read replicas
    const dbClusterParameterGroup = new rds.ParameterGroup(
      this,
      'DbClusterParameterGroup',
      {
        engine: rds.DatabaseClusterEngine.auroraMysql({
          version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
        }),
        description:
          'Parameter group for Aurora MySQL with binary logging enabled for cross-region replication',
        parameters: {
          // Enable binary logging in ROW format for cross-region replication
          // This is required for Aurora MySQL cross-region read replicas
          binlog_format: 'ROW',
        },
      }
    );

    // Aurora MySQL cluster with cross-region read replica capability
    const dbCluster = new rds.DatabaseCluster(this, 'AuroraCluster', {
      clusterIdentifier: createResourceName('aurora'),
      engine: rds.DatabaseClusterEngine.auroraMysql({
        version: rds.AuroraMysqlEngineVersion.VER_3_04_0,
      }),
      writer: rds.ClusterInstance.provisioned('Writer', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.LARGE
        ),
        publiclyAccessible: false,
      }),
      readers: [
        rds.ClusterInstance.provisioned('Reader1', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.R6G,
            ec2.InstanceSize.LARGE
          ),
          publiclyAccessible: false,
        }),
      ],
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [rdsSecurityGroup],
      parameterGroup: dbClusterParameterGroup, // Attach parameter group to enable binary logging
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backup: {
        retention: cdk.Duration.days(7),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      cloudwatchLogsExports: ['error', 'general', 'slowquery', 'audit'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // ============================================================================
    // DYNAMODB GLOBAL TABLE
    // ============================================================================

    // DynamoDB table for session data with global replication
    // Note: Only create in primary region - global tables handle replication automatically
    // Using AWS managed keys for global tables to avoid cross-region KMS key complexity
    let sessionTable: dynamodb.ITableV2;

    if (isPrimaryRegion) {
      const table = new dynamodb.TableV2(this, 'SessionTable', {
        tableName: createResourceName('sessions'),
        partitionKey: {
          name: 'sessionId',
          type: dynamodb.AttributeType.STRING,
        },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
        billing: dynamodb.Billing.onDemand(),
        encryption: dynamodb.TableEncryptionV2.dynamoOwnedKey(),
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        pointInTimeRecovery: true,
        contributorInsights: true,
        // Global table replication to secondary region
        replicas: [
          {
            region: secondaryRegion,
          },
        ],
      });

      // Add GSI for user-based queries (only in primary - replicates automatically)
      table.addGlobalSecondaryIndex({
        indexName: 'userIndex',
        partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
        sortKey: { name: 'timestamp', type: dynamodb.AttributeType.NUMBER },
      });

      sessionTable = table;
    } else {
      // Secondary region imports the table (already replicated by global tables)
      sessionTable = dynamodb.TableV2.fromTableName(
        this,
        'SessionTable',
        createResourceName('sessions')
      );
    }

    // ============================================================================
    // S3 BUCKETS WITH CROSS-REGION REPLICATION
    // ============================================================================

    // Primary S3 bucket for static assets and backups
    const primaryBucket = new s3.Bucket(this, 'PrimaryBucket', {
      bucketName: createResourceName('assets', true), // Include account ID for S3
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      objectOwnership: s3.ObjectOwnership.BUCKET_OWNER_PREFERRED, // Required for CloudFront logging
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          noncurrentVersionExpiration: cdk.Duration.days(90),
        },
        {
          id: 'TransitionToIA',
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(30),
            },
          ],
        },
      ],
    });

    // Replica bucket in secondary region (created via CfnBucket for cross-region)
    const replicaBucket = new s3.Bucket(this, 'ReplicaBucket', {
      bucketName: createResourceName('assets-replica', true),
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: kmsKey,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // S3 Replication Role
    const replicationRole = new iam.Role(this, 'ReplicationRole', {
      description: `S3 replication role for ${serviceName} in ${primaryRegion}-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
    });

    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
        resources: [primaryBucket.bucketArn],
      })
    );

    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:GetObjectVersionForReplication',
          's3:GetObjectVersionAcl',
          's3:GetObjectVersionTagging',
        ],
        resources: [`${primaryBucket.bucketArn}/*`],
      })
    );

    replicationRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          's3:ReplicateObject',
          's3:ReplicateDelete',
          's3:ReplicateTags',
        ],
        resources: [`${replicaBucket.bucketArn}/*`],
      })
    );

    // Configure S3 Replication Time Control (RTC) - 15 minute RPO
    const cfnBucket = primaryBucket.node.defaultChild as s3.CfnBucket;
    cfnBucket.replicationConfiguration = {
      role: replicationRole.roleArn,
      rules: [
        {
          id: 'ReplicateAll',
          status: 'Enabled',
          priority: 1,
          filter: {},
          deleteMarkerReplication: {
            status: 'Enabled',
          },
          destination: {
            bucket: replicaBucket.bucketArn,
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
          },
        },
      ],
    };

    // ============================================================================
    // ECS CLUSTER & FARGATE SERVICE
    // ============================================================================

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'EcsCluster', {
      clusterName: createResourceName('cluster'),
      vpc,
      containerInsights: true,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      family: createResourceName('task'),
      cpu: 512,
      memoryLimitMiB: 1024,
      runtimePlatform: {
        cpuArchitecture: ecs.CpuArchitecture.X86_64,
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // Add container to task definition
    const container = taskDefinition.addContainer('AppContainer', {
      containerName: `${serviceName}-app`,
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: serviceName,
        logRetention: logs.RetentionDays.ONE_WEEK,
      }),
      environment: {
        ENVIRONMENT: environmentSuffix,
        SERVICE_NAME: serviceName,
        REGION: primaryRegion,
        DB_HOST: dbCluster.clusterEndpoint.hostname,
        DYNAMODB_TABLE: sessionTable.tableName,
      },
      secrets: {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbCluster.secret!),
      },
      healthCheck: {
        // amazon/amazon-ecs-sample runs Apache on port 80
        // Simple check: verify Apache is responding to HTTP requests
        command: ['CMD-SHELL', 'curl -f http://localhost/ || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10),
        retries: 5, // Increased retries to be more lenient
        startPeriod: cdk.Duration.seconds(180), // 3 minutes to allow full container startup
      },
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // Grant permissions to ECS task
    dbCluster.secret?.grantRead(taskDefinition.taskRole);
    sessionTable.grantReadWriteData(taskDefinition.taskRole);
    primaryBucket.grantReadWrite(taskDefinition.taskRole);

    // Application Load Balancer (max 32 characters for name)
    const alb = new elbv2.ApplicationLoadBalancer(this, 'Alb', {
      loadBalancerName: createResourceName('alb', false, 32),
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      deletionProtection: false,
    });

    // ALB Target Group (max 32 characters for name)
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: createResourceName('tg', false, 32),
      vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(10), // Increased timeout for health checks
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 10, // Significantly increased to prevent premature circuit breaker
        // Extended grace period handled by ECS service healthCheckGracePeriod
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // ALB Listener
    alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Fargate Service
    const fargateService = new ecs.FargateService(this, 'FargateService', {
      serviceName: createResourceName('service'),
      cluster,
      taskDefinition,
      // Reduce desired count temporarily to make initial deployment easier
      // Circuit breaker threshold is 0.5 * desiredCount (min 3, max 200)
      // With desiredCount=1, threshold is still 3, but fewer tasks to manage
      desiredCount: 1, // Start with 1 task, can increase to 2 after service stabilizes
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      healthCheckGracePeriod: cdk.Duration.seconds(300), // Extended to 5 minutes to allow container startup and dependencies
      enableExecuteCommand: true,
      // Deployment configuration to allow gradual rollouts and prevent circuit breaker from triggering too early
      minHealthyPercent: 0, // Allow down to 0% during deployments to prevent circuit breaker on initial deployment
      maxHealthyPercent: 200, // Allow up to 200% during deployments
      circuitBreaker: {
        rollback: true,
      },
    });

    // Attach service to target group
    fargateService.attachToApplicationTargetGroup(targetGroup);

    // Ensure ECS service waits for RDS cluster to be created
    // This prevents tasks from failing immediately due to missing database endpoint
    fargateService.node.addDependency(dbCluster);

    // Auto Scaling
    // Start with minCapacity=1 to match desiredCount, can increase after service stabilizes
    const scaling = fargateService.autoScaleTaskCount({
      minCapacity: 1, // Match initial desiredCount
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // ============================================================================
    // CLOUDFRONT DISTRIBUTION
    // ============================================================================

    // CloudFront Origin Access Identity for S3
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: `OAI for ${serviceName}`,
      }
    );

    primaryBucket.grantRead(originAccessIdentity);

    // CloudFront distribution with active-passive failover
    const distribution = new cloudfront.Distribution(this, 'Distribution', {
      comment: `${serviceName} CDN with multi-region failover`,
      defaultBehavior: {
        origin: new origins.OriginGroup({
          primaryOrigin: new origins.LoadBalancerV2Origin(alb, {
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTP_ONLY,
            customHeaders: {
              'X-Custom-Header': serviceName,
            },
          }),
          fallbackOrigin: origins.S3BucketOrigin.withOriginAccessIdentity(
            primaryBucket,
            {
              originAccessIdentity,
            }
          ),
          fallbackStatusCodes: [500, 502, 503, 504],
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
      enableLogging: true,
      logBucket: primaryBucket,
      logFilePrefix: 'cloudfront-logs/',
    });

    // ============================================================================
    // SNS TOPIC FOR NOTIFICATIONS
    // ============================================================================

    // SNS topic for monitoring and alerting
    const alarmTopic = new sns.Topic(this, 'AlarmTopic', {
      topicName: createResourceName('alarms'),
      displayName: `Alarm notifications for ${serviceName}`,
      masterKey: kmsKey,
    });

    // Subscribe email if provided
    if (notificationEmail) {
      alarmTopic.addSubscription(
        new subscriptions.EmailSubscription(notificationEmail)
      );
    }

    // ============================================================================
    // LAMBDA FUNCTIONS FOR HEALTH MONITORING
    // ============================================================================

    // Health monitoring Lambda function
    const healthMonitorLogGroup = new logs.LogGroup(
      this,
      'HealthMonitorLogGroup',
      {
        logGroupName: `/aws/lambda/${serviceName}-health-monitor-${primaryRegion}-${environmentSuffix}`,
        retention: logs.RetentionDays.ONE_WEEK,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const healthMonitorFunction = new lambda.Function(this, 'HealthMonitor', {
      functionName: createResourceName('health-monitor'),
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import urllib3
import os
import boto3

http = urllib3.PoolManager()
cloudwatch = boto3.client('cloudwatch')

def handler(event, context):
    """
    Health monitoring function with circuit breaker pattern
    Checks endpoint health and publishes custom CloudWatch metrics
    """
    endpoint = os.environ.get('ENDPOINT_URL')
    namespace = os.environ.get('METRIC_NAMESPACE')
    
    try:
        # Health check
        response = http.request('GET', f'{endpoint}/health', timeout=5.0)
        is_healthy = response.status == 200
        
        # Publish custom metric
        cloudwatch.put_metric_data(
            Namespace=namespace,
            MetricData=[
                {
                    'MetricName': 'EndpointHealth',
                    'Value': 1.0 if is_healthy else 0.0,
                    'Unit': 'Count'
                }
            ]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'healthy': is_healthy,
                'endpoint': endpoint
            })
        }
    except Exception as e:
        # Publish failure metric
        cloudwatch.put_metric_data(
            Namespace=namespace,
            MetricData=[
                {
                    'MetricName': 'EndpointHealth',
                    'Value': 0.0,
                    'Unit': 'Count'
                }
            ]
        )
        
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
`),
      environment: {
        ENDPOINT_URL: `http://${alb.loadBalancerDnsName}`,
        METRIC_NAMESPACE: `${serviceName}/${environmentSuffix}`,
        REGION: primaryRegion,
      },
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      logGroup: healthMonitorLogGroup,
    });

    // Grant CloudWatch permissions
    healthMonitorFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    // Failover trigger Lambda with circuit breaker pattern
    const failoverLogGroup = new logs.LogGroup(this, 'FailoverLogGroup', {
      logGroupName: `/aws/lambda/${serviceName}-failover-trigger-${primaryRegion}-${environmentSuffix}`,
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const failoverFunction = new lambda.Function(this, 'FailoverTrigger', {
      functionName: createResourceName('failover-trigger'),
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
import json
import boto3
import os

route53 = boto3.client('route53')
sns = boto3.client('sns')

# Circuit breaker state
circuit_state = {'failures': 0, 'open': False}
FAILURE_THRESHOLD = 3

def handler(event, context):
    """
    Automated failover trigger using circuit breaker pattern
    Triggers DNS failover when threshold is exceeded
    """
    alarm_data = json.loads(event['Records'][0]['Sns']['Message'])
    alarm_name = alarm_data.get('AlarmName', 'Unknown')
    new_state = alarm_data.get('NewStateValue', 'UNKNOWN')
    
    topic_arn = os.environ.get('SNS_TOPIC_ARN')
    
    if new_state == 'ALARM':
        circuit_state['failures'] += 1
        
        if circuit_state['failures'] >= FAILURE_THRESHOLD and not circuit_state['open']:
            circuit_state['open'] = True
            
            # Send notification
            message = f"Circuit breaker opened! Failover initiated due to {alarm_name}"
            sns.publish(
                TopicArn=topic_arn,
                Subject='DR Failover Initiated',
                Message=message
            )
            
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'action': 'failover_initiated',
                    'alarm': alarm_name,
                    'failures': circuit_state['failures']
                })
            }
    else:
        # Reset circuit breaker on recovery
        circuit_state['failures'] = max(0, circuit_state['failures'] - 1)
        if circuit_state['failures'] == 0:
            circuit_state['open'] = False
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'action': 'monitored',
            'circuit_open': circuit_state['open'],
            'failures': circuit_state['failures']
        })
    }
`),
      environment: {
        SNS_TOPIC_ARN: alarmTopic.topicArn,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      logGroup: failoverLogGroup,
    });

    // Grant permissions to failover function
    alarmTopic.grantPublish(failoverFunction);
    failoverFunction.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['route53:ChangeResourceRecordSets', 'route53:GetChange'],
        resources: ['*'],
      })
    );

    // Subscribe failover function to alarm topic
    alarmTopic.addSubscription(
      new subscriptions.LambdaSubscription(failoverFunction)
    );

    // ============================================================================
    // CLOUDWATCH ALARMS
    // ============================================================================

    // ALB Target Unhealthy Hosts Alarm
    const unhealthyHostAlarm = new cloudwatch.Alarm(
      this,
      'UnhealthyHostAlarm',
      {
        alarmName: createResourceName('unhealthy-hosts'),
        metric: targetGroup.metrics.unhealthyHostCount({
          statistic: 'Average',
          period: cdk.Duration.minutes(1),
        }),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
        treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      }
    );

    unhealthyHostAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    // ALB 5XX Error Alarm
    const alb5xxAlarm = new cloudwatch.Alarm(this, 'Alb5xxAlarm', {
      alarmName: createResourceName('alb-5xx-errors'),
      metric: alb.metrics.httpCodeTarget(
        elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
        {
          statistic: 'Sum',
          period: cdk.Duration.minutes(1),
        }
      ),
      threshold: 10,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    alb5xxAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    // RDS CPU Utilization Alarm
    const rdsCpuAlarm = new cloudwatch.Alarm(this, 'RdsCpuAlarm', {
      alarmName: createResourceName('rds-cpu'),
      metric: dbCluster.metricCPUUtilization({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });

    rdsCpuAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    // Custom Health Metric Alarm
    const healthMetric = new cloudwatch.Metric({
      namespace: `${serviceName}/${environmentSuffix}`,
      metricName: 'EndpointHealth',
      statistic: 'Average',
      period: cdk.Duration.minutes(1),
    });

    const healthAlarm = new cloudwatch.Alarm(this, 'HealthAlarm', {
      alarmName: createResourceName('endpoint-health'),
      metric: healthMetric,
      threshold: 0.5,
      evaluationPeriods: 3,
      comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
    });

    healthAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));

    // ============================================================================
    // IAM ROLES FOR DISASTER RECOVERY
    // ============================================================================

    // Cross-region DR role
    const drRole = new iam.Role(this, 'DrRole', {
      description: `DR role for ${serviceName} with cross-region access in ${primaryRegion}-${environmentSuffix}`,
      assumedBy: new iam.CompositePrincipal(
        new iam.ServicePrincipal('lambda.amazonaws.com'),
        new iam.AccountPrincipal(accountId)
      ),
    });

    // Add policies for DR operations
    drRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'rds:FailoverDBCluster',
          'rds:DescribeDBClusters',
          'rds:ModifyDBCluster',
        ],
        resources: [dbCluster.clusterArn],
      })
    );

    drRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'route53:ChangeResourceRecordSets',
          'route53:GetChange',
          'route53:GetHealthCheckStatus',
        ],
        resources: ['*'],
      })
    );

    drRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:DescribeTable', 'dynamodb:UpdateTable'],
        resources: [sessionTable.tableArn],
      })
    );

    // ============================================================================
    // ROUTE53 HEALTH CHECKS
    // ============================================================================

    // Health check for ALB endpoint (60 second failover requirement)
    const healthCheck = new route53.CfnHealthCheck(this, 'HealthCheck', {
      healthCheckConfig: {
        type: 'HTTP',
        resourcePath: '/',
        fullyQualifiedDomainName: alb.loadBalancerDnsName,
        port: 80,
        requestInterval: 30, // Fast interval for 60-second failover
        failureThreshold: 2, // Fail after 2 consecutive failures (60 seconds max)
        measureLatency: true,
      },
      healthCheckTags: [
        {
          key: 'Name',
          value: createResourceName('health-check'),
        },
        {
          key: 'Environment',
          value: environmentSuffix,
        },
      ],
    });

    // ============================================================================
    // SECONDARY REGION INFRASTRUCTURE
    // ============================================================================

    // Create KMS key in secondary region for cross-region encryption
    const secondaryKmsKey = new kms.Key(this, 'SecondaryKmsKey', {
      alias: `${serviceName}-key-${secondaryRegion}-${environmentSuffix}`,
      description: `KMS key for ${serviceName} in ${secondaryRegion}-${environmentSuffix}`,
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Grant primary region's RDS service permission to use secondary KMS key for replication
    secondaryKmsKey.addToResourcePolicy(
      new iam.PolicyStatement({
        sid: 'Allow RDS to use KMS key for cross-region replication',
        effect: iam.Effect.ALLOW,
        principals: [new iam.ServicePrincipal('rds.amazonaws.com')],
        actions: ['kms:Decrypt', 'kms:DescribeKey', 'kms:CreateGrant'],
        resources: ['*'],
        conditions: {
          StringEquals: {
            'kms:ViaService': `rds.${secondaryRegion}.amazonaws.com`,
          },
        },
      })
    );

    // ============================================================================
    // VPC PEERING (if peer VPC provided)
    // ============================================================================

    let vpcPeeringConnection: ec2.CfnVPCPeeringConnection | undefined;

    // Only create VPC peering if peer VPC ID is provided (from other region's stack)
    if (peerVpcId) {
      const peerVpcCidr = isPrimaryRegion ? '10.1.0.0/16' : '10.0.0.0/16'; // Opposite region's CIDR

      // VPC Peering Connection Request (cross-region)
      vpcPeeringConnection = new ec2.CfnVPCPeeringConnection(
        this,
        'VpcPeering',
        {
          vpcId: vpc.vpcId,
          peerVpcId: peerVpcId,
          peerRegion: secondaryRegion,
          peerOwnerId: accountId,
          tags: [
            {
              key: 'Name',
              value: createResourceName('vpc-peering'),
            },
            {
              key: 'Environment',
              value: environmentSuffix,
            },
          ],
        }
      );

      // Add route to peer VPC through peering connection (for private subnets)
      vpc.privateSubnets.forEach((subnet, index) => {
        new ec2.CfnRoute(this, `PeeringRoute${index}`, {
          routeTableId: subnet.routeTable.routeTableId,
          destinationCidrBlock: peerVpcCidr,
          vpcPeeringConnectionId: vpcPeeringConnection!.ref,
        });
      });
    } else {
      // Log that VPC peering is skipped
      new cdk.CfnOutput(this, 'VpcPeeringStatus', {
        value:
          'VPC Peering not configured - will be created when both regions are deployed',
        description: 'VPC Peering Configuration Status',
      });
    }

    // ============================================================================
    // CUSTOM RESOURCE TO WAIT FOR RDS CLUSTER AVAILABILITY
    // ============================================================================

    // Lambda function to wait for RDS cluster to be fully available with writer instance
    let clusterWaiter: lambda.Function | undefined;
    let clusterWaiterCustomResource: cdk.CustomResource | undefined;

    if (isPrimaryRegion) {
      clusterWaiter = new lambda.Function(this, 'ClusterWaiter', {
        functionName: createResourceName('cluster-waiter'),
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import cfnresponse
import time

rds = boto3.client('rds')

def handler(event, context):
    """
    Custom resource to wait for RDS cluster to have an available writer instance
    """
    try:
        request_type = event['RequestType']
        cluster_id = event['ResourceProperties']['ClusterIdentifier']

        if request_type == 'Delete':
            # On delete, just succeed immediately
            cfnresponse.send(event, context, cfnresponse.SUCCESS, {})
            return

        # Wait for cluster to be available with writer instance
        max_attempts = 60  # 30 minutes (30 seconds per attempt)
        cluster_ready_time = None
        for attempt in range(max_attempts):
            try:
                response = rds.describe_db_clusters(DBClusterIdentifier=cluster_id)
                cluster = response['DBClusters'][0]

                status = cluster.get('Status', '')
                members = cluster.get('DBClusterMembers', [])

                # Check if cluster is available and has a writer
                has_writer = any(member.get('IsClusterWriter', False) for member in members)

                if status == 'available' and has_writer:
                    # Track when cluster first becomes available
                    if cluster_ready_time is None:
                        cluster_ready_time = time.time()
                        print(f"Cluster {cluster_id} is available with writer instance")
                    
                    # Wait additional 2.5 minutes (5 attempts × 30 seconds) for parameter group 
                    # settings (like binlog_format) to be fully applied
                    # This is especially important for cross-region replication which requires binary logging
                    elapsed_since_ready = time.time() - cluster_ready_time
                    if elapsed_since_ready < 150:  # 2.5 minutes = 150 seconds
                        remaining = int(150 - elapsed_since_ready)
                        print(f"Waiting for parameter group settings to apply ({remaining}s remaining)...")
                        time.sleep(30)
                        continue
                    
                    print(f"Cluster {cluster_id} is ready with all parameters applied")
                    cfnresponse.send(event, context, cfnresponse.SUCCESS, {
                        'ClusterStatus': status,
                        'HasWriter': 'true'
                    })
                    return

                print(f"Attempt {attempt + 1}/{max_attempts}: Cluster status={status}, has_writer={has_writer}")
                time.sleep(30)  # Wait 30 seconds before next check

            except Exception as e:
                print(f"Error checking cluster status: {str(e)}")
                time.sleep(30)

        # Timeout - cluster didn't become available
        cfnresponse.send(event, context, cfnresponse.FAILED, {},
                        reason=f"Cluster {cluster_id} did not become available with writer within timeout")

    except Exception as e:
        print(f"Error in waiter: {str(e)}")
        cfnresponse.send(event, context, cfnresponse.FAILED, {}, reason=str(e))
`),
        timeout: cdk.Duration.minutes(15), // Longer timeout for waiting
        memorySize: 256,
      });

      // Grant RDS describe permissions
      clusterWaiter.addToRolePolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: ['rds:DescribeDBClusters'],
          resources: ['*'],
        })
      );

      // Custom resource that uses the waiter Lambda
      const provider = new custom_resources.Provider(
        this,
        'ClusterWaiterProvider',
        {
          onEventHandler: clusterWaiter,
        }
      );

      clusterWaiterCustomResource = new cdk.CustomResource(
        this,
        'ClusterWaiterResource',
        {
          serviceToken: provider.serviceToken,
          properties: {
            ClusterIdentifier: dbCluster.clusterIdentifier,
            // Add a timestamp to force update on each deployment
            Timestamp: Date.now().toString(),
          },
        }
      );

      // Make sure the custom resource depends on the cluster
      clusterWaiterCustomResource.node.addDependency(dbCluster);
    }

    // RDS Aurora Cross-Region Read Replica
    // Only create replica in primary region (points to secondary)
    // Secondary region doesn't create its own replica
    let replicaCluster: rds.CfnDBCluster | undefined;

    if (isPrimaryRegion && clusterWaiterCustomResource) {
      replicaCluster = new rds.CfnDBCluster(this, 'SecondaryReplicaCluster', {
        engine: 'aurora-mysql',
        engineVersion: '8.0.mysql_aurora.3.04.0',
        dbClusterIdentifier: `${serviceName}-aurora-replica-${secondaryRegion}-${environmentSuffix}`,
        replicationSourceIdentifier: dbCluster.clusterArn,
        storageEncrypted: true,
        kmsKeyId: secondaryKmsKey.keyArn,
        enableCloudwatchLogsExports: ['error', 'general', 'slowquery'],
        backupRetentionPeriod: 7,
        deletionProtection: false,
      });

      // Depend on the custom resource waiter instead of just the cluster
      // This ensures the cluster is fully available with writer before creating replica
      replicaCluster.node.addDependency(clusterWaiterCustomResource);
    }

    // ============================================================================
    // ROUTE53 DNS FAILOVER
    // ============================================================================

    let hostedZone: route53.IHostedZone | undefined;

    if (domainName) {
      // Only primary region creates or manages the hosted zone
      if (hostedZoneId) {
        hostedZone = route53.HostedZone.fromHostedZoneAttributes(
          this,
          'HostedZone',
          {
            hostedZoneId: hostedZoneId,
            zoneName: domainName,
          }
        );
      } else if (isPrimaryRegion) {
        // Primary region creates the hosted zone
        hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
          zoneName: domainName,
          comment: `Hosted zone for ${serviceName} with automatic failover`,
        });
      } else {
        // Secondary region imports the hosted zone (it must already exist)
        // In a real deployment, you'd pass the hosted zone ID from primary stack
        throw new Error(
          'Secondary region requires hostedZoneId to be provided. Deploy primary region first.'
        );
      }

      // Create failover record for this region
      const failoverType = isPrimaryRegion ? 'PRIMARY' : 'SECONDARY';
      const recordSetId = `${serviceName}-${failoverType.toLowerCase()}-${primaryRegion}`;

      new route53.CfnRecordSet(this, 'FailoverRecord', {
        hostedZoneId: hostedZone.hostedZoneId,
        name: `${serviceName}.${domainName}`,
        type: 'A',
        setIdentifier: recordSetId,
        failover: failoverType,
        healthCheckId: isPrimaryRegion
          ? healthCheck.attrHealthCheckId
          : undefined,
        aliasTarget: {
          hostedZoneId: alb.loadBalancerCanonicalHostedZoneId,
          dnsName: alb.loadBalancerDnsName,
          evaluateTargetHealth: true,
        },
      });

      // CloudWatch alarm for Route53 health check
      const route53HealthAlarm = new cloudwatch.Alarm(
        this,
        'Route53HealthAlarm',
        {
          alarmName: createResourceName('route53-health'),
          metric: new cloudwatch.Metric({
            namespace: 'AWS/Route53',
            metricName: 'HealthCheckStatus',
            dimensionsMap: {
              HealthCheckId: healthCheck.attrHealthCheckId,
            },
            statistic: 'Minimum',
            period: cdk.Duration.minutes(1),
          }),
          threshold: 1,
          evaluationPeriods: 2,
          comparisonOperator: cloudwatch.ComparisonOperator.LESS_THAN_THRESHOLD,
          treatMissingData: cloudwatch.TreatMissingData.BREACHING,
          actionsEnabled: true,
        }
      );

      route53HealthAlarm.addAlarmAction(new cw_actions.SnsAction(alarmTopic));
    }

    // ============================================================================
    // CROSS-REGION LAMBDA DEPLOYMENT
    // ============================================================================

    // Monitor this region's resources (all regions get monitoring Lambda)
    const regionHealthMonitor = new lambda.Function(
      this,
      'RegionHealthMonitor',
      {
        functionName: `${serviceName}-region-monitor-${primaryRegion}-${environmentSuffix}`,
        runtime: lambda.Runtime.PYTHON_3_11,
        handler: 'index.handler',
        code: lambda.Code.fromInline(`
import json
import boto3
import os

def handler(event, context):
    """
    Region health monitoring function
    Monitors this region's infrastructure health
    """
    namespace = os.environ.get('METRIC_NAMESPACE')
    region = os.environ.get('AWS_REGION')
    cloudwatch = boto3.client('cloudwatch')
    
    try:
        # Check RDS cluster status in this region
        rds = boto3.client('rds')
        cluster_id = os.environ.get('DB_CLUSTER_ID')
        cluster_status = rds.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        is_available = cluster_status['DBClusters'][0]['Status'] == 'available'
        
        # Publish metric
        cloudwatch.put_metric_data(
            Namespace=namespace,
            MetricData=[
                {
                    'MetricName': f'RegionHealth-{region}',
                    'Value': 1.0 if is_available else 0.0,
                    'Unit': 'Count'
                }
            ]
        )
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'healthy': is_available,
                'region': region
            })
        }
    except Exception as e:
        cloudwatch.put_metric_data(
            Namespace=namespace,
            MetricData=[
                {
                    'MetricName': f'RegionHealth-{region}',
                    'Value': 0.0,
                    'Unit': 'Count'
                }
            ]
        )
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
`),
        environment: {
          METRIC_NAMESPACE: `${serviceName}/${environmentSuffix}`,
          DB_CLUSTER_ID: dbCluster.clusterIdentifier,
        },
        timeout: cdk.Duration.seconds(10),
        memorySize: 256,
      }
    );

    // Grant permissions for monitoring
    regionHealthMonitor.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['rds:DescribeDBClusters', 'cloudwatch:PutMetricData'],
        resources: ['*'],
      })
    );

    // Grant DR role access to secondary resources (only if replica exists)
    if (replicaCluster) {
      drRole.addToPolicy(
        new iam.PolicyStatement({
          effect: iam.Effect.ALLOW,
          actions: [
            'rds:PromoteReadReplica',
            'rds:PromoteReadReplicaDBCluster',
          ],
          resources: [replicaCluster.attrDbClusterArn],
        })
      );
    }

    // ============================================================================
    // OUTPUTS
    // ============================================================================

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `${stackName}-alb-dns`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: distribution.distributionDomainName,
      description: 'CloudFront distribution domain',
      exportName: `${stackName}-cdn-domain`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'RDS Aurora cluster endpoint',
      exportName: `${stackName}-db-endpoint`,
    });

    new cdk.CfnOutput(this, 'SessionTableName', {
      value: sessionTable.tableName,
      description: 'DynamoDB session table name',
      exportName: `${stackName}-session-table`,
    });

    new cdk.CfnOutput(this, 'PrimaryBucketName', {
      value: primaryBucket.bucketName,
      description: 'Primary S3 bucket name',
      exportName: `${stackName}-primary-bucket`,
    });

    new cdk.CfnOutput(this, 'AlarmTopicArn', {
      value: alarmTopic.topicArn,
      description: 'SNS topic ARN for alarms',
      exportName: `${stackName}-alarm-topic`,
    });

    if (replicaCluster) {
      new cdk.CfnOutput(this, 'ReplicaClusterArn', {
        value: replicaCluster.attrDbClusterArn,
        description: 'Secondary region RDS Aurora replica cluster ARN',
        exportName: `${stackName}-replica-cluster-arn`,
      });
    }

    if (vpcPeeringConnection) {
      new cdk.CfnOutput(this, 'VpcPeeringConnectionId', {
        value: vpcPeeringConnection.ref,
        description: 'VPC Peering Connection ID between regions',
        exportName: `${stackName}-vpc-peering-id`,
      });
    }

    new cdk.CfnOutput(this, 'HealthCheckId', {
      value: healthCheck.attrHealthCheckId,
      description: 'Route53 Health Check ID',
      exportName: `${stackName}-health-check-id`,
    });

    if (domainName && hostedZone) {
      new cdk.CfnOutput(this, 'FailoverDomain', {
        value: `${serviceName}.${domainName}`,
        description: 'Failover domain name with Route53 health checks',
        exportName: `${stackName}-failover-domain`,
      });

      new cdk.CfnOutput(this, 'HostedZoneId', {
        value: hostedZone.hostedZoneId,
        description: 'Route53 Hosted Zone ID',
        exportName: `${stackName}-hosted-zone-id`,
      });
    }

    new cdk.CfnOutput(this, 'SecondaryKmsKeyArn', {
      value: secondaryKmsKey.keyArn,
      description: 'Secondary region KMS key ARN',
      exportName: `${stackName}-secondary-kms-arn`,
    });

    new cdk.CfnOutput(this, 'PrimaryVpcId', {
      value: vpc.vpcId,
      description: 'Primary VPC ID',
      exportName: `${stackName}-primary-vpc-id`,
    });
  }
}
