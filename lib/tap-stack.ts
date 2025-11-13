import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface TapStackProps {
  environmentSuffix: string;
}

export class TapStack extends Construct {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly database: rds.DatabaseCluster;
  public readonly frontendBucket: s3.Bucket;
  public readonly distribution: cloudfront.Distribution;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // KMS Key for encryption
    const encryptionKey = new kms.Key(this, 'EncryptionKey', {
      alias: `payment-app-key-${environmentSuffix}`,
      description: 'KMS key for payment application encryption',
      enableKeyRotation: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // VPC with 3 AZs and 3 subnet tiers
    this.vpc = new ec2.Vpc(this, 'PaymentVpc', {
      vpcName: `payment-vpc-${environmentSuffix}`,
      maxAzs: 3,
      natGateways: 3,
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
          name: 'Isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          cidrMask: 24,
        },
      ],
    });

    // Database Credentials in Secrets Manager
    const dbCredentials = new secretsmanager.Secret(this, 'DbCredentials', {
      secretName: `payment-db-credentials-${environmentSuffix}`,
      description: 'Database credentials for payment application',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'paymentadmin' }),
        generateStringKey: 'password',
        excludePunctuation: true,
        includeSpace: false,
      },
      encryptionKey: encryptionKey,
    });

    // RDS Aurora PostgreSQL Cluster
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS Aurora cluster',
      allowAllOutbound: false,
    });

    this.database = new rds.DatabaseCluster(this, 'PaymentDatabase', {
      clusterIdentifier: `payment-db-${environmentSuffix}`,
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_12,
      }),
      credentials: rds.Credentials.fromSecret(dbCredentials),
      instanceProps: {
        vpc: this.vpc,
        vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.MEDIUM
        ),
        securityGroups: [dbSecurityGroup],
      },
      instances: 2,
      backup: {
        retention: Duration.days(7),
      },
      storageEncrypted: true,
      storageEncryptionKey: encryptionKey,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    // Note: Automatic rotation omitted due to Lambda function name length constraints
    // in deployment with environmentSuffix. In production, configure rotation manually
    // or use shorter stack/resource names.

    // ECS Cluster
    this.cluster = new ecs.Cluster(this, 'PaymentCluster', {
      clusterName: `payment-cluster-${environmentSuffix}`,
      vpc: this.vpc,
      containerInsights: true,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'ApiTaskDef', {
      family: `payment-api-${environmentSuffix}`,
      memoryLimitMiB: 512,
      cpu: 256,
    });

    // Container Definition
    const container = taskDefinition.addContainer('ApiContainer', {
      image: ecs.ContainerImage.fromRegistry('amazon/amazon-ecs-sample'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'payment-api',
        logRetention: logs.RetentionDays.THREE_MONTHS,
      }),
      environment: {
        DB_HOST: this.database.clusterEndpoint.hostname,
        DB_PORT: this.database.clusterEndpoint.port.toString(),
      },
      secrets: {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbCredentials, 'password'),
        DB_USERNAME: ecs.Secret.fromSecretsManager(dbCredentials, 'username'),
      },
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'PaymentALB', {
      loadBalancerName: `payment-alb-${environmentSuffix}`,
      vpc: this.vpc,
      internetFacing: true,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    const listener = this.alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
    });

    // ECS Fargate Service
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ECS tasks',
    });

    const fargateService = new ecs.FargateService(this, 'PaymentApiService', {
      serviceName: `payment-api-${environmentSuffix}`,
      cluster: this.cluster,
      taskDefinition,
      desiredCount: 2,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [ecsSecurityGroup],
      deploymentController: {
        type: ecs.DeploymentControllerType.ECS,
      },
      circuitBreaker: {
        rollback: true,
      },
    });

    // Allow ECS to connect to database
    dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow ECS tasks to access database'
    );

    // Target Group with health checks
    const targetGroup = listener.addTargets('EcsTarget', {
      targetGroupName: `payment-api-tg-${environmentSuffix}`,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targets: [fargateService],
      healthCheck: {
        path: '/',
        interval: Duration.seconds(30),
        unhealthyThresholdCount: 2,
        healthyThresholdCount: 2,
      },
      deregistrationDelay: Duration.seconds(30),
    });

    // Auto Scaling
    const scaling = fargateService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    // S3 Bucket for Frontend
    this.frontendBucket = new s3.Bucket(this, 'FrontendBucket', {
      bucketName: `payment-frontend-${environmentSuffix}`,
      encryption: s3.BucketEncryption.KMS,
      encryptionKey: encryptionKey,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CloudFront Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: `OAI for payment frontend ${environmentSuffix}`,
      }
    );

    this.frontendBucket.grantRead(originAccessIdentity);

    // CloudFront Distribution (WAF requires us-east-1 deployment - omitted for regional deployment)
    this.distribution = new cloudfront.Distribution(
      this,
      'FrontendDistribution',
      {
        comment: `Payment frontend distribution ${environmentSuffix}`,
        defaultBehavior: {
          origin: new origins.S3Origin(this.frontendBucket, {
            originAccessIdentity,
          }),
          viewerProtocolPolicy:
            cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
        },
        defaultRootObject: 'index.html',
        // Note: WAF would require separate us-east-1 stack for CloudFront integration
      }
    );

    // SNS Topic for Alerts
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `payment-alerts-${environmentSuffix}`,
      displayName: 'Payment Application Alerts',
    });

    // CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'PaymentDashboard', {
      dashboardName: `payment-dashboard-${environmentSuffix}`,
    });

    // ALB Metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'API Latency',
        left: [
          this.alb.metricTargetResponseTime({
            statistic: 'Average',
          }),
          this.alb.metricTargetResponseTime({
            statistic: 'p99',
          }),
        ],
      }),
      new cloudwatch.GraphWidget({
        title: 'Request Count',
        left: [
          this.alb.metricRequestCount({
            statistic: 'Sum',
          }),
        ],
      })
    );

    // ECS Metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ECS CPU Utilization',
        left: [fargateService.metricCpuUtilization()],
      }),
      new cloudwatch.GraphWidget({
        title: 'ECS Memory Utilization',
        left: [fargateService.metricMemoryUtilization()],
      })
    );

    // Database Metrics
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database Connections',
        left: [this.database.metricDatabaseConnections()],
      })
    );

    // Error Rate Alarm
    const errorMetric = new cloudwatch.MathExpression({
      expression: '(m1/m2)*100',
      usingMetrics: {
        m1: targetGroup.metricHttpCodeTarget(
          elbv2.HttpCodeTarget.TARGET_5XX_COUNT,
          {
            statistic: 'Sum',
          }
        ),
        m2: this.alb.metricRequestCount({
          statistic: 'Sum',
        }),
      },
      period: Duration.minutes(5),
    });

    const errorAlarm = new cloudwatch.Alarm(this, 'HighErrorRateAlarm', {
      alarmName: `payment-high-error-rate-${environmentSuffix}`,
      metric: errorMetric,
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    errorAlarm.addAlarmAction({
      bind: () => ({ alarmActionArn: alertTopic.topicArn }),
    });

    // Outputs
    new cdk.CfnOutput(this, 'LoadBalancerDNS', {
      value: this.alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
      exportName: `PaymentALBDns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CloudFrontDomain', {
      value: this.distribution.distributionDomainName,
      description: 'CloudFront distribution domain',
      exportName: `PaymentCloudfrontDomain-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.clusterEndpoint.hostname,
      description: 'Database cluster endpoint',
      exportName: `PaymentDbEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'FrontendBucketName', {
      value: this.frontendBucket.bucketName,
      description: 'Frontend S3 bucket name',
      exportName: `PaymentFrontendBucket-${environmentSuffix}`,
    });
  }
}
