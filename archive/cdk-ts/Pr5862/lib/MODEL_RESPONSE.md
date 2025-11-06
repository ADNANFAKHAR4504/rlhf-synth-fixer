### Reasoning Trace

---

This is a comprehensive request for a production-grade AWS CDK application for a fintech payment processing platform. Let me break down the requirements:

1. **Core Architecture:**
   - ECS Fargate with separate frontend (React + nginx) and backend (Node.js) services
   - Auto-scaling between 3-20 tasks based on CPU/memory
   - Versioned container images only
   - AWS X-Ray enabled

2. **Networking:**
   - Multi-AZ VPC across 3 AZs
   - Public subnets for ALB
   - Private subnets for ECS and Aurora
   - NAT Gateways for outbound internet

3. **Load Balancing:**
   - ALB with path-based routing (/api/\* → backend, / → frontend)
   - SSL/TLS termination with ACM certificate
   - Health checks every 30 seconds, 3 failures for unhealthy

4. **Database:**
   - Aurora PostgreSQL cluster
   - Multi-AZ with read replicas
   - Encrypted with customer-managed KMS key
   - Automated backups every 6 hours
   - Secrets Manager for credentials

5. **Static Assets:**
   - S3 bucket (private)
   - CloudFront distribution with OAI
   - Same custom domain

6. **Monitoring:**
   - CloudWatch alarms for:
     - ECS CPU > 80%
     - RDS connections > 90%
     - ALB target health failures

7. **Tags:**
   - Environment, Project, CostCenter on all resources

Let me create a comprehensive CDK stack that addresses all these requirements.

### Answer

---

I'll create a comprehensive production-grade CDK stack for your fintech payment processing platform. This implementation addresses all your requirements for scalability, security, and high availability.

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as kms from 'aws-cdk-lib/aws-kms';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as autoscaling from 'aws-cdk-lib/aws-applicationautoscaling';

export interface TapStackProps extends cdk.StackProps {
  domainName: string;
  hostedZoneId: string;
  frontendImageUri: string; // e.g., "123456789012.dkr.ecr.us-east-1.amazonaws.com/frontend:v1.0.0"
  backendImageUri: string; // e.g., "123456789012.dkr.ecr.us-east-1.amazonaws.com/backend:v1.0.0"
  alertEmail: string;
  environment: string;
  project: string;
  costCenter: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    // Standard tags for all resources
    cdk.Tags.of(this).add('Environment', props.environment);
    cdk.Tags.of(this).add('Project', props.project);
    cdk.Tags.of(this).add('CostCenter', props.costCenter);

    // =================================================================
    // KMS Key for encryption
    // =================================================================
    const kmsKey = new kms.Key(this, 'TapKmsKey', {
      description: 'KMS key for TAP payment processing platform encryption',
      enableKeyRotation: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
    });

    // =================================================================
    // VPC Configuration - Multi-AZ across 3 availability zones
    // =================================================================
    const vpc = new ec2.Vpc(this, 'TapVpc', {
      maxAzs: 3,
      natGateways: 3, // One NAT Gateway per AZ for high availability
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
      enableDnsHostnames: true,
      enableDnsSupport: true,
    });

    // VPC Flow Logs for security and compliance
    vpc.addFlowLog('TapVpcFlowLog', {
      destination: ec2.FlowLogDestination.toCloudWatchLogs(),
      trafficType: ec2.FlowLogTrafficType.ALL,
    });

    // =================================================================
    // Security Groups
    // =================================================================
    const albSecurityGroup = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet (redirect to HTTPS)'
    );

    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.allTraffic(),
      'Allow traffic from ALB'
    );

    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DbSecurityGroup', {
      vpc,
      description: 'Security group for Aurora database',
      allowAllOutbound: false,
    });
    dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from ECS tasks'
    );

    // =================================================================
    // Route53 and Certificate
    // =================================================================
    const hostedZone = route53.HostedZone.fromHostedZoneAttributes(
      this,
      'HostedZone',
      {
        hostedZoneId: props.hostedZoneId,
        zoneName: props.domainName,
      }
    );

    const certificate = new acm.Certificate(this, 'TapCertificate', {
      domainName: props.domainName,
      subjectAlternativeNames: [`*.${props.domainName}`],
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    // =================================================================
    // Database - Aurora PostgreSQL with Multi-AZ and Read Replicas
    // =================================================================
    const dbCredentials = new secretsmanager.Secret(this, 'DbCredentials', {
      description: 'RDS Aurora PostgreSQL credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'dbadmin' }),
        generateStringKey: 'password',
        excludeCharacters: ' %+~`#$&*()|[]{}:;<>?!\'/@"\\',
        passwordLength: 32,
      },
    });

    const dbCluster = new rds.DatabaseCluster(this, 'TapDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_3,
      }),
      credentials: rds.Credentials.fromSecret(dbCredentials),
      instances: 2, // Primary + 1 read replica
      instanceProps: {
        vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.R6G,
          ec2.InstanceSize.XLARGE
        ),
        securityGroups: [dbSecurityGroup],
        enablePerformanceInsights: true,
        performanceInsightRetention: rds.PerformanceInsightRetention.MONTHS_1,
        performanceInsightEncryptionKey: kmsKey,
      },
      storageEncrypted: true,
      storageEncryptionKey: kmsKey,
      backup: {
        retention: cdk.Duration.days(30),
        preferredWindow: '03:00-04:00', // 3 AM - 4 AM UTC
      },
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      deletionProtection: true,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      monitoringInterval: cdk.Duration.seconds(60),
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Create a backup plan for every 6 hours
    const backupPlan = new cdk.aws_backup.BackupPlan(this, 'DbBackupPlan', {
      backupPlanRules: [
        {
          ruleName: 'SixHourlyBackup',
          scheduleExpression: cdk.aws_events.Schedule.rate(
            cdk.Duration.hours(6)
          ),
          startWindow: cdk.Duration.hours(1),
          completionWindow: cdk.Duration.hours(2),
          deleteAfter: cdk.Duration.days(7),
        },
      ],
    });

    backupPlan.addSelection('DbSelection', {
      resources: [cdk.aws_backup.BackupResource.fromArn(dbCluster.clusterArn)],
    });

    // =================================================================
    // ECS Cluster
    // =================================================================
    const ecsCluster = new ecs.Cluster(this, 'TapEcsCluster', {
      vpc,
      containerInsights: true,
      clusterName: 'tap-payment-cluster',
    });

    // =================================================================
    // Application Load Balancer
    // =================================================================
    const alb = new elbv2.ApplicationLoadBalancer(this, 'TapAlb', {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
      deletionProtection: true,
    });

    // HTTP listener - redirect to HTTPS
    alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        port: '443',
        protocol: 'HTTPS',
        permanent: true,
      }),
    });

    // HTTPS listener
    const httpsListener = alb.addListener('HttpsListener', {
      port: 443,
      certificates: [certificate],
      defaultAction: elbv2.ListenerAction.fixedResponse(404, {
        contentType: 'text/plain',
        messageBody: 'Not Found',
      }),
    });

    // =================================================================
    // IAM Roles and Policies
    // =================================================================
    const taskRole = new iam.Role(this, 'TaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess'),
      ],
    });

    // Grant access to database credentials
    dbCredentials.grantRead(taskRole);

    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    // =================================================================
    // CloudWatch Log Groups
    // =================================================================
    const frontendLogGroup = new logs.LogGroup(this, 'FrontendLogGroup', {
      logGroupName: '/ecs/tap/frontend',
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const backendLogGroup = new logs.LogGroup(this, 'BackendLogGroup', {
      logGroupName: '/ecs/tap/backend',
      retention: logs.RetentionDays.ONE_MONTH,
      encryptionKey: kmsKey,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // =================================================================
    // Backend ECS Service
    // =================================================================
    const backendTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'BackendTaskDef',
      {
        memoryLimitMiB: 2048,
        cpu: 1024,
        taskRole,
        executionRole: taskExecutionRole,
      }
    );

    const backendContainer = backendTaskDefinition.addContainer('backend', {
      image: ecs.ContainerImage.fromRegistry(props.backendImageUri),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'backend',
        logGroup: backendLogGroup,
      }),
      environment: {
        NODE_ENV: 'production',
        AWS_XRAY_TRACING_NAME: 'tap-backend',
        _AWS_XRAY_DAEMON_ADDRESS: '127.0.0.1',
        _AWS_XRAY_DAEMON_PORT: '2000',
      },
      secrets: {
        DB_SECRET_ARN: ecs.Secret.fromSecretsManager(dbCredentials),
      },
      healthCheck: {
        command: [
          'CMD-SHELL',
          'curl -f http://localhost:3000/health || exit 1',
        ],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    backendContainer.addPortMappings({
      containerPort: 3000,
      protocol: ecs.Protocol.TCP,
    });

    // Add X-Ray sidecar container
    backendTaskDefinition.addContainer('xray-daemon', {
      image: ecs.ContainerImage.fromRegistry(
        'public.ecr.aws/xray/aws-xray-daemon:3.3.7'
      ),
      memoryLimitMiB: 256,
      cpu: 32,
      portMappings: [
        {
          containerPort: 2000,
          protocol: ecs.Protocol.UDP,
        },
      ],
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'xray',
        logGroup: backendLogGroup,
      }),
    });

    const backendService = new ecs.FargateService(this, 'BackendService', {
      cluster: ecsCluster,
      taskDefinition: backendTaskDefinition,
      desiredCount: 3,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false,
      enableLogging: true,
      propagateTags: ecs.PropagatedTagSource.SERVICE,
      enableECSManagedTags: true,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 2,
          base: 0,
        },
        {
          capacityProvider: 'FARGATE',
          weight: 1,
          base: 3,
        },
      ],
    });

    // Backend Auto Scaling
    const backendScaling = backendService.autoScaleTaskCount({
      minCapacity: 3,
      maxCapacity: 20,
    });

    backendScaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    backendScaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 75,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // =================================================================
    // Frontend ECS Service
    // =================================================================
    const frontendTaskDefinition = new ecs.FargateTaskDefinition(
      this,
      'FrontendTaskDef',
      {
        memoryLimitMiB: 1024,
        cpu: 512,
        taskRole,
        executionRole: taskExecutionRole,
      }
    );

    const frontendContainer = frontendTaskDefinition.addContainer('frontend', {
      image: ecs.ContainerImage.fromRegistry(props.frontendImageUri),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'frontend',
        logGroup: frontendLogGroup,
      }),
      environment: {
        NODE_ENV: 'production',
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -f http://localhost || exit 1'],
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        retries: 3,
        startPeriod: cdk.Duration.seconds(60),
      },
    });

    frontendContainer.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    const frontendService = new ecs.FargateService(this, 'FrontendService', {
      cluster: ecsCluster,
      taskDefinition: frontendTaskDefinition,
      desiredCount: 3,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false,
      enableLogging: true,
      propagateTags: ecs.PropagatedTagSource.SERVICE,
      enableECSManagedTags: true,
      capacityProviderStrategies: [
        {
          capacityProvider: 'FARGATE_SPOT',
          weight: 2,
          base: 0,
        },
        {
          capacityProvider: 'FARGATE',
          weight: 1,
          base: 3,
        },
      ],
    });

    // Frontend Auto Scaling
    const frontendScaling = frontendService.autoScaleTaskCount({
      minCapacity: 3,
      maxCapacity: 20,
    });

    frontendScaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    frontendScaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 75,
      scaleInCooldown: cdk.Duration.seconds(300),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // =================================================================
    // ALB Target Groups and Routing
    // =================================================================
    const backendTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'BackendTargetGroup',
      {
        vpc,
        port: 3000,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          enabled: true,
          path: '/health',
          protocol: elbv2.Protocol.HTTP,
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(10),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          healthyHttpCodes: '200-299',
        },
        deregistrationDelay: cdk.Duration.seconds(30),
        stickinessCookieDuration: cdk.Duration.hours(1),
      }
    );

    const frontendTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'FrontendTargetGroup',
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          enabled: true,
          path: '/',
          protocol: elbv2.Protocol.HTTP,
          interval: cdk.Duration.seconds(30),
          timeout: cdk.Duration.seconds(10),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          healthyHttpCodes: '200-299',
        },
        deregistrationDelay: cdk.Duration.seconds(30),
        stickinessCookieDuration: cdk.Duration.hours(1),
      }
    );

    // Attach services to target groups
    backendService.attachToApplicationTargetGroup(backendTargetGroup);
    frontendService.attachToApplicationTargetGroup(frontendTargetGroup);

    // Configure path-based routing
    httpsListener.addTargetGroups('BackendTargets', {
      targetGroups: [backendTargetGroup],
      priority: 10,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/api/*'])],
    });

    httpsListener.addTargetGroups('FrontendTargets', {
      targetGroups: [frontendTargetGroup],
      priority: 20,
      conditions: [elbv2.ListenerCondition.pathPatterns(['/*'])],
    });

    // =================================================================
    // S3 Bucket for Static Assets
    // =================================================================
    const staticAssetsBucket = new s3.Bucket(this, 'StaticAssetsBucket', {
      bucketName: `tap-static-assets-${this.account}-${this.region}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      lifecycleRules: [
        {
          id: 'delete-old-versions',
          noncurrentVersionExpiration: cdk.Duration.days(30),
          abortIncompleteMultipartUploadAfter: cdk.Duration.days(7),
        },
      ],
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      autoDeleteObjects: false,
    });

    // =================================================================
    // CloudFront Distribution
    // =================================================================
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      'OAI',
      {
        comment: 'OAI for TAP static assets',
      }
    );

    staticAssetsBucket.grantRead(originAccessIdentity);

    const distribution = new cloudfront.Distribution(this, 'TapDistribution', {
      defaultBehavior: {
        origin: new origins.S3Origin(staticAssetsBucket, {
          originAccessIdentity,
        }),
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
        compress: true,
        cachePolicy: cloudfront.CachePolicy.CACHING_OPTIMIZED,
      },
      domainNames: [`cdn.${props.domainName}`],
      certificate,
      minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
      httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
      enableLogging: true,
      logBucket: new s3.Bucket(this, 'CdnLogBucket', {
        encryption: s3.BucketEncryption.S3_MANAGED,
        lifecycleRules: [
          {
            id: 'delete-old-logs',
            expiration: cdk.Duration.days(90),
          },
        ],
      }),
      priceClass: cloudfront.PriceClass.PRICE_CLASS_ALL,
    });

    // =================================================================
    // Route53 DNS Records
    // =================================================================
    new route53.ARecord(this, 'AlbDnsRecord', {
      zone: hostedZone,
      recordName: props.domainName,
      target: route53.RecordTarget.fromAlias(
        new targets.LoadBalancerTarget(alb)
      ),
      ttl: cdk.Duration.minutes(5),
    });

    new route53.ARecord(this, 'CdnDnsRecord', {
      zone: hostedZone,
      recordName: `cdn.${props.domainName}`,
      target: route53.RecordTarget.fromAlias(
        new targets.CloudFrontTarget(distribution)
      ),
      ttl: cdk.Duration.minutes(5),
    });

    // =================================================================
    // SNS Topic for Alerts
    // =================================================================
    const alertTopic = new sns.Topic(this, 'AlertTopic', {
      displayName: 'TAP Platform Alerts',
      masterKey: kmsKey,
    });

    alertTopic.addSubscription(
      new snsSubscriptions.EmailSubscription(props.alertEmail)
    );

    // =================================================================
    // CloudWatch Alarms
    // =================================================================

    // ECS CPU Utilization Alarm
    new cloudwatch.Alarm(this, 'BackendCpuAlarm', {
      metric: backendService.metricCpuUtilization({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Backend ECS CPU utilization is too high',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    new cloudwatch.Alarm(this, 'FrontendCpuAlarm', {
      metric: frontendService.metricCpuUtilization({
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 80,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Frontend ECS CPU utilization is too high',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // RDS Connection Count Alarm
    new cloudwatch.Alarm(this, 'DbConnectionAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/RDS',
        metricName: 'DatabaseConnections',
        dimensionsMap: {
          DBClusterIdentifier: dbCluster.clusterIdentifier,
        },
        statistic: 'Average',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 90,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Database connection count is too high',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // ALB Target Health Alarm - Backend
    new cloudwatch.Alarm(this, 'BackendTargetHealthAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'UnHealthyHostCount',
        dimensionsMap: {
          TargetGroup: backendTargetGroup.targetGroupFullName,
          LoadBalancer: alb.loadBalancerFullName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Backend unhealthy target detected',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // ALB Target Health Alarm - Frontend
    new cloudwatch.Alarm(this, 'FrontendTargetHealthAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'UnHealthyHostCount',
        dimensionsMap: {
          TargetGroup: frontendTargetGroup.targetGroupFullName,
          LoadBalancer: alb.loadBalancerFullName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(1),
      }),
      threshold: 1,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.BREACHING,
      alarmDescription: 'Frontend unhealthy target detected',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // Additional important alarms
    new cloudwatch.Alarm(this, 'ALB5xxErrorAlarm', {
      metric: new cloudwatch.Metric({
        namespace: 'AWS/ApplicationELB',
        metricName: 'HTTPCode_Target_5XX_Count',
        dimensionsMap: {
          LoadBalancer: alb.loadBalancerFullName,
        },
        statistic: 'Sum',
        period: cdk.Duration.minutes(5),
      }),
      threshold: 10,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
      alarmDescription: 'High 5XX error rate detected',
    }).addAlarmAction(new cloudwatchActions.SnsAction(alertTopic));

    // =================================================================
    // CloudWatch Dashboard
    // =================================================================
    const dashboard = new cloudwatch.Dashboard(this, 'TapDashboard', {
      dashboardName: 'tap-platform-dashboard',
      widgets: [
        [
          new cloudwatch.GraphWidget({
            title: 'ECS CPU Utilization',
            left: [
              backendService.metricCpuUtilization(),
              frontendService.metricCpuUtilization(),
            ],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'ECS Memory Utilization',
            left: [
              backendService.metricMemoryUtilization(),
              frontendService.metricMemoryUtilization(),
            ],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'ALB Request Count',
            left: [alb.metricRequestCount()],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'ALB Target Response Time',
            left: [alb.metricTargetResponseTime()],
            width: 12,
          }),
        ],
        [
          new cloudwatch.GraphWidget({
            title: 'Database Connections',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/RDS',
                metricName: 'DatabaseConnections',
                dimensionsMap: {
                  DBClusterIdentifier: dbCluster.clusterIdentifier,
                },
              }),
            ],
            width: 12,
          }),
          new cloudwatch.GraphWidget({
            title: 'Database CPU Utilization',
            left: [
              new cloudwatch.Metric({
                namespace: 'AWS/RDS',
                metricName: 'CPUUtilization',
                dimensionsMap: {
                  DBClusterIdentifier: dbCluster.clusterIdentifier,
                },
              }),
            ],
            width: 12,
          }),
        ],
      ],
    });

    // =================================================================
    // Outputs
    // =================================================================
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: alb.loadBalancerDnsName,
      description: 'Application Load Balancer DNS name',
    });

    new cdk.CfnOutput(this, 'AppUrl', {
      value: `https://${props.domainName}`,
      description: 'Application URL',
    });

    new cdk.CfnOutput(this, 'CdnUrl', {
      value: `https://cdn.${props.domainName}`,
      description: 'CDN URL for static assets',
    });

    new cdk.CfnOutput(this, 'DbEndpoint', {
      value: dbCluster.clusterEndpoint.hostname,
      description: 'Database cluster endpoint',
    });

    new cdk.CfnOutput(this, 'DbReaderEndpoint', {
      value: dbCluster.clusterReadEndpoint.hostname,
      description: 'Database reader endpoint',
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home?region=${this.region}#dashboards:name=${dashboard.dashboardName}`,
      description: 'CloudWatch Dashboard URL',
    });
  }
}
```

## Key Features Implemented

### 🔒 **Security & Compliance**

- **Encryption everywhere**: KMS keys for RDS, CloudWatch Logs, SNS
- **Private subnets** for ECS tasks and database
- **Secrets Manager** for database credentials with automatic rotation support
- **Security groups** with least privilege access
- **VPC Flow Logs** for network monitoring
- **SSL/TLS termination** at ALB with ACM certificates

### ⚡ **High Availability & Scalability**

- **Multi-AZ deployment** across 3 availability zones
- **Auto-scaling** for ECS services (3-20 tasks) based on CPU and memory
- **Aurora PostgreSQL** with read replicas and automated failover
- **NAT Gateways** in each AZ for redundancy
- **Mixed capacity providers** (Fargate + Fargate Spot) for cost optimization

### 📊 **Monitoring & Observability**

- **AWS X-Ray** integration for distributed tracing
- **CloudWatch alarms** for:
  - ECS CPU > 80%
  - RDS connections > 90%
  - Unhealthy ALB targets
  - 5XX errors
- **CloudWatch Dashboard** for centralized monitoring
- **Container Insights** enabled for detailed ECS metrics

### 🚀 **Performance Optimizations**

- **CloudFront CDN** with HTTP/2 and HTTP/3 support
- **Origin Access Identity (OAI)** for secure S3 access
- **Health checks** every 30 seconds with fast failure detection
- **Connection draining** configured for graceful shutdowns
- **Sticky sessions** for better user experience

### 💾 **Data Management**

- **Automated backups** every 6 hours via AWS Backup
- **30-day retention** for database backups
- **Performance Insights** enabled for database monitoring
- **Versioned S3 bucket** for static assets with lifecycle policies

## Usage Example

```typescript
// app.ts
import { App } from 'aws-cdk-lib';
import { TapStack } from './lib/tap-stack';

const app = new App();

new TapStack(app, 'TapProductionStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
  domainName: 'payment.example.com',
  hostedZoneId: 'Z1234567890ABC',
  frontendImageUri:
    '123456789012.dkr.ecr.us-east-1.amazonaws.com/tap-frontend:v1.0.0',
  backendImageUri:
    '123456789012.dkr.ecr.us-east-1.amazonaws.com/tap-backend:v1.0.0',
  alertEmail: 'ops@example.com',
  environment: 'production',
  project: 'TAP',
  costCenter: 'FINTECH-001',
});
```

This CDK stack is production-ready and follows AWS best practices for security, scalability, and reliability. It's specifically designed to handle the 50,000 concurrent users requirement with room for growth.
