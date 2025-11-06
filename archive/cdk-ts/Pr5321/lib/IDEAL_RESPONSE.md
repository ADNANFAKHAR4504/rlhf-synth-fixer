# IDEAL_RESPONSE

## bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Multi-region configuration
const deployRegion =
  app.node.tryGetContext('region') ||
  process.env.CDK_DEFAULT_REGION ||
  'us-east-1';
const isPrimary = deployRegion === 'us-east-1';
const primaryRegion = 'us-east-1';
const drRegion = 'eu-west-1';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Create the primary or DR stack based on the deployment region
const stackName = `TapStack${environmentSuffix}`;
new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  isPrimary: isPrimary,
  primaryRegion: primaryRegion,
  drRegion: drRegion,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: deployRegion,
  },
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as wafv2 from 'aws-cdk-lib/aws-wafv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
  isPrimary: boolean;
  primaryRegion: string;
  drRegion: string;
}

export class TapStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly cluster: ecs.Cluster;
  public readonly alb: elbv2.ApplicationLoadBalancer;
  public readonly dbCluster: rds.DatabaseCluster;
  public readonly blueTargetGroup: elbv2.ApplicationTargetGroup;
  public readonly greenTargetGroup: elbv2.ApplicationTargetGroup;
  public readonly ecsService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Context values
    const vpcCidr = this.node.tryGetContext('vpc-cidr') || '10.0.0.0/16';
    const containerImage =
      this.node.tryGetContext('container-image') ||
      'public.ecr.aws/docker/library/nginx:latest';
    const containerCpu = this.node.tryGetContext('container-cpu') || 1024;
    const containerMemory = this.node.tryGetContext('container-memory') || 2048;
    const desiredTasks = this.node.tryGetContext('desired-tasks') || 3;
    const maxTasks = this.node.tryGetContext('max-tasks') || 10;
    const dbUsername = this.node.tryGetContext('db-username') || 'paymentadmin';
    const dbName = this.node.tryGetContext('db-name') || 'payments';
    const dbPort = this.node.tryGetContext('db-port') || 5432;
    const dbBackupRetentionDays =
      this.node.tryGetContext('db-backup-retention-days') || 35;
    const wafRateLimit = this.node.tryGetContext('waf-rate-limit') || 2000;

    // VPC with 3 AZs
    this.vpc = new ec2.Vpc(this, 'PaymentVPC', {
      ipAddresses: ec2.IpAddresses.cidr(vpcCidr),
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

    // Security Groups with least privilege
    const albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });
    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(443),
      'Allow HTTPS from internet'
    );
    albSg.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP from internet (redirect to HTTPS)'
    );

    const ecsSg = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });
    ecsSg.addIngressRule(albSg, ec2.Port.tcp(80), 'Allow traffic from ALB');

    const dbSg = new ec2.SecurityGroup(this, 'DatabaseSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Aurora PostgreSQL',
      allowAllOutbound: false,
    });
    dbSg.addIngressRule(
      ecsSg,
      ec2.Port.tcp(dbPort),
      'Allow PostgreSQL from ECS tasks'
    );

    // VPC Endpoints for PrivateLink
    this.vpc.addGatewayEndpoint('S3Endpoint', {
      service: ec2.GatewayVpcEndpointAwsService.S3,
    });

    this.vpc.addInterfaceEndpoint('ECRDkrEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR_DOCKER,
      securityGroups: [ecsSg],
    });

    this.vpc.addInterfaceEndpoint('ECRApiEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.ECR,
      securityGroups: [ecsSg],
    });

    this.vpc.addInterfaceEndpoint('CloudWatchLogsEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
      securityGroups: [ecsSg],
    });

    this.vpc.addInterfaceEndpoint('SecretsManagerEndpoint', {
      service: ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
      securityGroups: [ecsSg],
    });

    // Database credentials secret
    const dbCredentialsSecret = new secretsmanager.Secret(
      this,
      'DBCredentials',
      {
        secretName: `${id}-db-credentials-${environmentSuffix}`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({ username: dbUsername }),
          excludePunctuation: true,
          includeSpace: false,
          generateStringKey: 'password',
        },
        removalPolicy: RemovalPolicy.DESTROY,
      }
    );

    // Database parameter group with SSL enforcement
    const dbParameterGroup = new rds.ParameterGroup(this, 'DBParameterGroup', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_4,
      }),
      parameters: {
        'rds.force_ssl': '1',
      },
    });

    // Aurora PostgreSQL cluster with Multi-AZ
    this.dbCluster = new rds.DatabaseCluster(this, 'PaymentDatabase', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_4,
      }),
      credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
      writer: rds.ClusterInstance.provisioned('writer', {
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T4G,
          ec2.InstanceSize.MEDIUM
        ),
      }),
      readers: [
        rds.ClusterInstance.provisioned('reader1', {
          instanceType: ec2.InstanceType.of(
            ec2.InstanceClass.T4G,
            ec2.InstanceSize.MEDIUM
          ),
        }),
      ],
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSg],
      parameterGroup: dbParameterGroup,
      storageEncrypted: true,
      backup: {
        retention: Duration.days(dbBackupRetentionDays),
      },
      deletionProtection: false,
      removalPolicy: RemovalPolicy.DESTROY,
      defaultDatabaseName: dbName,
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.TWO_WEEKS,
    });

    // Secret rotation for database credentials (30-day schedule)
    new secretsmanager.SecretRotation(this, 'DBCredentialRotation', {
      secret: dbCredentialsSecret,
      application:
        secretsmanager.SecretRotationApplication.POSTGRES_ROTATION_SINGLE_USER,
      vpc: this.vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      target: this.dbCluster,
      automaticallyAfter: Duration.days(30),
    });

    // S3 bucket for PCI data
    const pciBucket = new s3.Bucket(this, 'PCIDataBucket', {
      bucketName: `pci-payments-data-${this.account}-${this.region}-${environmentSuffix}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      enforceSSL: true,
    });

    // Application Load Balancer
    this.alb = new elbv2.ApplicationLoadBalancer(this, 'PaymentALB', {
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSg,
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    });

    // HTTP to HTTPS redirect
    this.alb.addListener('HttpListener', {
      port: 80,
      defaultAction: elbv2.ListenerAction.redirect({
        port: '443',
        protocol: 'HTTPS',
        permanent: true,
      }),
    });

    // HTTPS Listener (without certificate for test environment)
    const httpsListener = this.alb.addListener('HttpsListener', {
      port: 443,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultAction: elbv2.ListenerAction.fixedResponse(503, {
        contentType: 'text/plain',
        messageBody: 'Service Unavailable',
      }),
    });

    // AWS WAF for ALB
    const wafAcl = new wafv2.CfnWebACL(this, 'PaymentWAF', {
      defaultAction: { allow: {} },
      scope: 'REGIONAL',
      visibilityConfig: {
        cloudWatchMetricsEnabled: true,
        metricName: 'PaymentWAF',
        sampledRequestsEnabled: true,
      },
      rules: [
        {
          name: 'APIRateLimit',
          priority: 0,
          action: { block: {} },
          statement: {
            rateBasedStatement: {
              limit: wafRateLimit,
              aggregateKeyType: 'IP',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'APIRateLimit',
            sampledRequestsEnabled: true,
          },
        },
        {
          name: 'SQLiProtection',
          priority: 1,
          overrideAction: { none: {} },
          statement: {
            managedRuleGroupStatement: {
              vendorName: 'AWS',
              name: 'AWSManagedRulesSQLiRuleSet',
            },
          },
          visibilityConfig: {
            cloudWatchMetricsEnabled: true,
            metricName: 'SQLiProtection',
            sampledRequestsEnabled: true,
          },
        },
      ],
    });

    new wafv2.CfnWebACLAssociation(this, 'PaymentWafAssociation', {
      resourceArn: this.alb.loadBalancerArn,
      webAclArn: wafAcl.attrArn,
    });

    // Blue and Green Target Groups for blue-green deployment
    this.blueTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'BlueTargetGroup',
      {
        vpc: this.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: Duration.seconds(30),
          timeout: Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          healthyHttpCodes: '200,301,302',
        },
        deregistrationDelay: Duration.seconds(30),
      }
    );

    this.greenTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      'GreenTargetGroup',
      {
        vpc: this.vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
        healthCheck: {
          path: '/',
          interval: Duration.seconds(30),
          timeout: Duration.seconds(5),
          healthyThresholdCount: 2,
          unhealthyThresholdCount: 3,
          healthyHttpCodes: '200,301,302',
        },
        deregistrationDelay: Duration.seconds(30),
      }
    );

    // Initially route 100% traffic to blue target group
    httpsListener.addAction('DefaultAction', {
      action: elbv2.ListenerAction.forward([this.blueTargetGroup]),
    });

    // ECS Cluster with Container Insights
    this.cluster = new ecs.Cluster(this, 'PaymentCluster', {
      vpc: this.vpc,
      containerInsights: true,
    });

    // Task execution role
    const taskExecutionRole = new iam.Role(this, 'EcsTaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AmazonECSTaskExecutionRolePolicy'
        ),
      ],
    });

    dbCredentialsSecret.grantRead(taskExecutionRole);

    // Permission boundary for task role
    const permissionsBoundary = new iam.ManagedPolicy(
      this,
      'TaskPermissionsBoundary',
      {
        statements: [
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
            resources: [pciBucket.bucketArn, `${pciBucket.bucketArn}/*`],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            resources: [dbCredentialsSecret.secretArn],
          }),
          new iam.PolicyStatement({
            effect: iam.Effect.ALLOW,
            actions: ['cloudwatch:PutMetricData'],
            resources: ['*'],
          }),
        ],
      }
    );

    // Task role with permission boundary
    const taskRole = new iam.Role(this, 'EcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      description: 'Role for Payment Processing ECS Tasks',
      permissionsBoundary: permissionsBoundary,
    });

    pciBucket.grantReadWrite(taskRole);
    dbCredentialsSecret.grantRead(taskRole);

    // ECS Task Definition with ARM64 Graviton2
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      'PaymentTaskDef',
      {
        memoryLimitMiB: containerMemory,
        cpu: containerCpu,
        runtimePlatform: {
          cpuArchitecture: ecs.CpuArchitecture.ARM64,
          operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        },
        taskRole: taskRole,
        executionRole: taskExecutionRole,
      }
    );

    // Container definition
    const container = taskDefinition.addContainer('PaymentContainer', {
      image: ecs.ContainerImage.fromRegistry(containerImage),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'payment-service',
        logRetention: logs.RetentionDays.TWO_WEEKS,
      }),
      environment: {
        DATABASE_HOST: this.dbCluster.clusterEndpoint.hostname,
        DATABASE_PORT: this.dbCluster.clusterEndpoint.port.toString(),
        DATABASE_NAME: dbName,
        AWS_REGION: this.region,
        S3_BUCKET_NAME: pciBucket.bucketName,
      },
      secrets: {
        DATABASE_CREDENTIALS:
          ecs.Secret.fromSecretsManager(dbCredentialsSecret),
      },
      healthCheck: {
        command: ['CMD-SHELL', 'curl -fsS http://localhost/ || exit 1'],
        interval: Duration.seconds(30),
        timeout: Duration.seconds(5),
        retries: 3,
        startPeriod: Duration.seconds(60),
      },
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // ECS Fargate Service
    this.ecsService = new ecs.FargateService(this, 'PaymentService', {
      cluster: this.cluster,
      taskDefinition: taskDefinition,
      securityGroups: [ecsSg],
      desiredCount: desiredTasks,
      minHealthyPercent: 100,
      maxHealthyPercent: 200,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      assignPublicIp: false,
      healthCheckGracePeriod: Duration.seconds(60),
      circuitBreaker: { rollback: true },
      enableExecuteCommand: true,
    });

    this.ecsService.attachToApplicationTargetGroup(this.blueTargetGroup);

    // Auto Scaling
    const scaling = this.ecsService.autoScaleTaskCount({
      minCapacity: desiredTasks,
      maxCapacity: maxTasks,
    });

    scaling.scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization('MemoryScaling', {
      targetUtilizationPercent: 70,
      scaleInCooldown: Duration.seconds(60),
      scaleOutCooldown: Duration.seconds(60),
    });

    // CloudWatch Alarms for 5xx errors
    const http5xxMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'HTTPCode_Target_5XX_Count',
      dimensionsMap: {
        LoadBalancer: this.alb.loadBalancerFullName,
        TargetGroup: this.blueTargetGroup.targetGroupFullName,
      },
      statistic: 'Sum',
      period: Duration.minutes(1),
    });

    const requestCountMetric = new cloudwatch.Metric({
      namespace: 'AWS/ApplicationELB',
      metricName: 'RequestCount',
      dimensionsMap: {
        LoadBalancer: this.alb.loadBalancerFullName,
        TargetGroup: this.blueTargetGroup.targetGroupFullName,
      },
      statistic: 'Sum',
      period: Duration.minutes(1),
    });

    new cloudwatch.MathExpression({
      expression: 'IF(m2 > 0, (m1/m2)*100, 0)',
      usingMetrics: {
        m1: http5xxMetric,
        m2: requestCountMetric,
      },
      period: Duration.minutes(1),
    }).createAlarm(this, 'Http5xxAlarm', {
      threshold: 1,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'HTTP 5XX errors exceeded 1%',
      alarmName: `${id}-${environmentSuffix}-5xx-error-rate`,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Custom metric for transaction latency
    const transactionLatencyMetric = new cloudwatch.Metric({
      namespace: 'PaymentService',
      metricName: 'TransactionLatency',
      dimensionsMap: {
        Service: 'PaymentProcessing',
      },
      statistic: 'Average',
      period: Duration.minutes(1),
    });

    transactionLatencyMetric.createAlarm(this, 'LatencyAlarm', {
      threshold: 500,
      evaluationPeriods: 3,
      datapointsToAlarm: 2,
      alarmDescription: 'Transaction latency exceeded 500ms',
      alarmName: `${id}-${environmentSuffix}-transaction-latency`,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Route53 Health Check
    const healthCheck = new route53.CfnHealthCheck(
      this,
      'FailoverHealthCheck',
      {
        healthCheckConfig: {
          type: 'HTTP',
          fullyQualifiedDomainName: this.alb.loadBalancerDnsName,
          port: 80,
          resourcePath: '/health',
          requestInterval: 30,
          failureThreshold: 3,
        },
      }
    );

    // Outputs for cross-region references
    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      exportName: `${id}-AlbDnsName`,
      description: 'ALB DNS name for cross-region failover',
    });

    new cdk.CfnOutput(this, 'AlbCanonicalHostedZoneId', {
      value: this.alb.loadBalancerCanonicalHostedZoneId,
      exportName: `${id}-AlbCanonicalHostedZoneId`,
      description: 'ALB hosted zone ID for Route53',
    });

    new cdk.CfnOutput(this, 'HealthCheckId', {
      value: healthCheck.attrHealthCheckId,
      exportName: `${id}-HealthCheckId`,
      description: 'Route53 health check ID',
    });

    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: this.cluster.clusterName,
      description: 'ECS Cluster name',
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.ecsService.serviceName,
      description: 'ECS Service name',
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.dbCluster.clusterEndpoint.hostname,
      description: 'Aurora database endpoint',
    });

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: pciBucket.bucketName,
      description: 'PCI data S3 bucket name',
    });

    new cdk.CfnOutput(this, 'BlueTargetGroupArn', {
      value: this.blueTargetGroup.targetGroupArn,
      description: 'Blue target group ARN',
    });

    new cdk.CfnOutput(this, 'GreenTargetGroupArn', {
      value: this.greenTargetGroup.targetGroupArn,
      description: 'Green target group ARN',
    });
  }
}
```

## cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
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
      "test"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableEmrServicePolicyV2": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableOpensearchMultiAzWithStandby": true,
    "@aws-cdk/aws-lambda-nodejs:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs:removeDefaultDeploymentAlarm": true,
    "@aws-cdk/custom-resources:logApiResponseDataPropertyTrueDefault": false,
    "@aws-cdk/aws-s3:keepNotificationInImportedBucket": false,
    "@aws-cdk/aws-ecs:enableImdsBlockingDeprecatedFeature": false,
    "@aws-cdk/aws-ecs:disableEcsImdsBlocking": true,
    "@aws-cdk/aws-ecs:reduceEc2FargateCloudWatchPermissions": true,
    "@aws-cdk/aws-dynamodb:resourcePolicyPerReplica": true,
    "@aws-cdk/aws-ec2:ec2SumTImeoutEnabled": true,
    "@aws-cdk/aws-appsync:appSyncGraphQLAPIScopeLambdaPermission": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/core:cfnIncludeRejectComplexResourceUpdateCreatePolicyIntrinsics": true,
    "@aws-cdk/aws-lambda-nodejs:sdkV3ExcludeSmithyPackages": true,
    "@aws-cdk/aws-stepfunctions-tasks:fixRunEcsTaskPolicy": true,
    "@aws-cdk/aws-ec2:bastionHostUseAmazonLinux2023ByDefault": true,
    "@aws-cdk/aws-route53-targets:userPoolDomainNameMethodWithoutCustomResource": true,
    "@aws-cdk/aws-elasticloadbalancingV2:albDualstackWithoutPublicIpv4SecurityGroupRulesDefault": true,
    "@aws-cdk/aws-iam:oidcRejectUnauthorizedConnections": true,
    "@aws-cdk/core:enableAdditionalMetadataCollection": true,
    "@aws-cdk/aws-lambda:createNewPoliciesWithAddToRolePolicy": false,
    "@aws-cdk/aws-s3:setUniqueReplicationRoleName": true,
    "@aws-cdk/aws-events:requireEventBusPolicySid": true,
    "@aws-cdk/core:aspectPrioritiesMutating": true,
    "@aws-cdk/aws-dynamodb:retainTableReplica": true,
    "@aws-cdk/aws-stepfunctions:useDistributedMapResultWriterV2": true,
    "@aws-cdk/s3-notifications:addS3TrustKeyPolicyForSnsSubscriptions": true,
    "@aws-cdk/aws-ec2:requirePrivateSubnetsForEgressOnlyInternetGateway": true,
    "@aws-cdk/aws-s3:publicAccessBlockedByDefault": true,
    "@aws-cdk/aws-lambda:useCdkManagedLogGroup": true
  }
}
```
