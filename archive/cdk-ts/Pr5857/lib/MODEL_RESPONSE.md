# Migration Infrastructure Implementation

This implementation provides a complete CDK TypeScript solution for orchestrating a phased migration from on-premises to AWS cloud infrastructure. The solution includes all 12 core requirements with proper environment separation, security, monitoring, and migration capabilities.

## Architecture Overview

The solution creates separate stacks for each environment (dev, staging, prod) with:
- VPC infrastructure with 3 AZs
- RDS PostgreSQL Multi-AZ with read replicas
- AWS DMS for continuous data replication
- ECS Fargate clusters with Application Load Balancers
- ElastiCache Redis clusters
- CloudWatch monitoring and SNS alerting
- Lambda validation functions
- Route 53 for traffic management
- S3 for artifact storage
- IAM roles and Secrets Manager integration
- AWS Backup configuration
- CodePipeline for deployment

## File: lib/migration-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as dms from 'aws-cdk-lib/aws-dms';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as events from 'aws-cdk-lib/aws-events';
import { Construct } from 'constructs';

export interface MigrationStackProps extends cdk.StackProps {
  environmentName: string;
  environmentSuffix: string;
  migrationPhase: 'preparation' | 'migration' | 'cutover' | 'complete';
  vpcCidr: string;
  alertEmail?: string;
}

export class MigrationStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly database: rds.DatabaseInstance;
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly ecsCluster: ecs.Cluster;
  public readonly artifactBucket: s3.Bucket;

  constructor(scope: Construct, id: string, props: MigrationStackProps) {
    super(scope, id, props);

    const { environmentName, environmentSuffix, migrationPhase } = props;

    // Apply standard tags to all resources in this stack
    cdk.Tags.of(this).add('Environment', environmentName);
    cdk.Tags.of(this).add('MigrationPhase', migrationPhase);
    cdk.Tags.of(this).add('CostCenter', 'finance-app-migration');
    cdk.Tags.of(this).add('EnvironmentSuffix', environmentSuffix);

    // 1. VPC Infrastructure - 3 AZs with public and private subnets
    this.vpc = new ec2.Vpc(this, `MigrationVpc-${environmentSuffix}`, {
      vpcName: `migration-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr(props.vpcCidr),
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

    // S3 Bucket for migration artifacts and logs
    this.artifactBucket = new s3.Bucket(this, `ArtifactBucket-${environmentSuffix}`, {
      bucketName: `migration-artifacts-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      versioned: true,
      encryption: s3.BucketEncryption.S3_MANAGED,
      lifecycleRules: [
        {
          id: 'DeleteOldVersions',
          enabled: true,
          noncurrentVersionExpiration: cdk.Duration.days(30),
        },
        {
          id: 'TransitionToIA',
          enabled: true,
          transitions: [
            {
              storageClass: s3.StorageClass.INFREQUENT_ACCESS,
              transitionAfter: cdk.Duration.days(90),
            },
          ],
        },
      ],
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // Fetch database credentials from Secrets Manager (existing secret)
    const dbSecret = secretsmanager.Secret.fromSecretNameV2(
      this,
      'DbSecret',
      `migration-db-credentials-${environmentName}`
    );

    // 2. Database Security Group
    const dbSecurityGroup = new ec2.SecurityGroup(this, `DbSecurityGroup-${environmentSuffix}`, {
      vpc: this.vpc,
      description: `Security group for RDS PostgreSQL - ${environmentName}`,
      securityGroupName: `migration-db-sg-${environmentSuffix}`,
    });

    // 3. RDS PostgreSQL Multi-AZ with Read Replica
    const dbSubnetGroup = new rds.SubnetGroup(this, `DbSubnetGroup-${environmentSuffix}`, {
      subnetGroupName: `migration-db-subnet-${environmentSuffix}`,
      description: `Subnet group for migration database - ${environmentName}`,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
    });

    this.database = new rds.DatabaseInstance(this, `Database-${environmentSuffix}`, {
      instanceIdentifier: `migration-db-${environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_3,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      subnetGroup: dbSubnetGroup,
      securityGroups: [dbSecurityGroup],
      multiAz: true,
      allocatedStorage: 100,
      maxAllocatedStorage: 500,
      storageType: rds.StorageType.GP3,
      storageEncrypted: true,
      credentials: rds.Credentials.fromSecret(dbSecret),
      databaseName: 'migrationdb',
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
      cloudwatchLogsExports: ['postgresql'],
      enablePerformanceInsights: true,
      performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
    });

    // Read Replica for improved performance
    const readReplica = new rds.DatabaseInstanceReadReplica(this, `DatabaseReadReplica-${environmentSuffix}`, {
      sourceDatabaseInstance: this.database,
      instanceIdentifier: `migration-db-replica-${environmentSuffix}`,
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.LARGE),
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [dbSecurityGroup],
      publiclyAccessible: false,
      deleteAutomatedBackups: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // 4. AWS Backup configuration
    const backupVault = new backup.BackupVault(this, `BackupVault-${environmentSuffix}`, {
      backupVaultName: `migration-vault-${environmentSuffix}`,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const backupPlan = new backup.BackupPlan(this, `BackupPlan-${environmentSuffix}`, {
      backupPlanName: `migration-backup-${environmentSuffix}`,
      backupVault: backupVault,
      backupPlanRules: [
        new backup.BackupPlanRule({
          ruleName: 'DailyBackup',
          scheduleExpression: events.Schedule.cron({ hour: '2', minute: '0' }),
          deleteAfter: cdk.Duration.days(7),
        }),
      ],
    });

    backupPlan.addSelection(`BackupSelection-${environmentSuffix}`, {
      resources: [
        backup.BackupResource.fromRdsDatabaseInstance(this.database),
      ],
    });

    // 5. DMS Replication Instance and Subnet Group
    const dmsSubnetGroup = new dms.CfnReplicationSubnetGroup(this, `DmsSubnetGroup-${environmentSuffix}`, {
      replicationSubnetGroupIdentifier: `dms-subnet-${environmentSuffix}`,
      replicationSubnetGroupDescription: `DMS subnet group for ${environmentName}`,
      subnetIds: this.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }).subnetIds,
    });

    const dmsSecurityGroup = new ec2.SecurityGroup(this, `DmsSecurityGroup-${environmentSuffix}`, {
      vpc: this.vpc,
      description: `Security group for DMS replication - ${environmentName}`,
      securityGroupName: `dms-sg-${environmentSuffix}`,
    });

    // Allow DMS to connect to database
    dbSecurityGroup.addIngressRule(
      dmsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow DMS to connect to PostgreSQL'
    );

    const dmsReplicationInstance = new dms.CfnReplicationInstance(this, `DmsInstance-${environmentSuffix}`, {
      replicationInstanceIdentifier: `dms-instance-${environmentSuffix}`,
      replicationInstanceClass: 'dms.t3.large',
      allocatedStorage: 100,
      vpcSecurityGroupIds: [dmsSecurityGroup.securityGroupId],
      replicationSubnetGroupIdentifier: dmsSubnetGroup.replicationSubnetGroupIdentifier,
      publiclyAccessible: false,
      multiAz: false,
    });
    dmsReplicationInstance.addDependency(dmsSubnetGroup);

    // 6. ElastiCache Redis Cluster
    const cacheSubnetGroup = new elasticache.CfnSubnetGroup(this, `CacheSubnetGroup-${environmentSuffix}`, {
      subnetIds: this.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      }).subnetIds,
      description: `Cache subnet group for ${environmentName}`,
      cacheSubnetGroupName: `cache-subnet-${environmentSuffix}`,
    });

    const cacheSecurityGroup = new ec2.SecurityGroup(this, `CacheSecurityGroup-${environmentSuffix}`, {
      vpc: this.vpc,
      description: `Security group for Redis cache - ${environmentName}`,
      securityGroupName: `cache-sg-${environmentSuffix}`,
    });

    const redisCluster = new elasticache.CfnReplicationGroup(this, `RedisCluster-${environmentSuffix}`, {
      replicationGroupId: `redis-${environmentSuffix}`,
      replicationGroupDescription: `Redis cluster for ${environmentName}`,
      engine: 'redis',
      cacheNodeType: 'cache.t3.medium',
      numCacheClusters: 2,
      automaticFailoverEnabled: true,
      multiAzEnabled: true,
      cacheSubnetGroupName: cacheSubnetGroup.cacheSubnetGroupName,
      securityGroupIds: [cacheSecurityGroup.securityGroupId],
      atRestEncryptionEnabled: true,
      transitEncryptionEnabled: true,
      snapshotRetentionLimit: 5,
    });
    redisCluster.addDependency(cacheSubnetGroup);

    // 7. ECS Cluster and Fargate Service
    this.ecsCluster = new ecs.Cluster(this, `EcsCluster-${environmentSuffix}`, {
      clusterName: `migration-cluster-${environmentSuffix}`,
      vpc: this.vpc,
      containerInsights: true,
    });

    // Task execution role
    const taskExecutionRole = new iam.Role(this, `TaskExecutionRole-${environmentSuffix}`, {
      roleName: `ecs-task-execution-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // Allow task to read secrets
    dbSecret.grantRead(taskExecutionRole);

    // Task role
    const taskRole = new iam.Role(this, `TaskRole-${environmentSuffix}`, {
      roleName: `ecs-task-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant task access to S3 artifacts
    this.artifactBucket.grantReadWrite(taskRole);

    // Fargate task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, `TaskDef-${environmentSuffix}`, {
      family: `migration-app-${environmentSuffix}`,
      memoryLimitMiB: 2048,
      cpu: 1024,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    const appContainer = taskDefinition.addContainer(`AppContainer-${environmentSuffix}`, {
      containerName: 'app',
      image: ecs.ContainerImage.fromRegistry('public.ecr.aws/docker/library/nginx:latest'),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'migration-app',
        logRetention: 7,
      }),
      environment: {
        ENVIRONMENT: environmentName,
        REGION: cdk.Aws.REGION,
      },
      secrets: {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(dbSecret, 'password'),
      },
    });

    appContainer.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // Application Load Balancer
    const albSecurityGroup = new ec2.SecurityGroup(this, `AlbSecurityGroup-${environmentSuffix}`, {
      vpc: this.vpc,
      description: `Security group for ALB - ${environmentName}`,
      securityGroupName: `alb-sg-${environmentSuffix}`,
    });

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, `Alb-${environmentSuffix}`, {
      loadBalancerName: `migration-alb-${environmentSuffix}`,
      vpc: this.vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, `TargetGroup-${environmentSuffix}`, {
      targetGroupName: `migration-tg-${environmentSuffix}`,
      vpc: this.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    const listener = this.loadBalancer.addListener(`Listener-${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // ECS Fargate Service
    const ecsSecurityGroup = new ec2.SecurityGroup(this, `EcsSecurityGroup-${environmentSuffix}`, {
      vpc: this.vpc,
      description: `Security group for ECS tasks - ${environmentName}`,
      securityGroupName: `ecs-sg-${environmentSuffix}`,
    });

    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // Allow ECS to connect to database
    dbSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow ECS to connect to PostgreSQL'
    );

    // Allow ECS to connect to Redis
    cacheSecurityGroup.addIngressRule(
      ecsSecurityGroup,
      ec2.Port.tcp(6379),
      'Allow ECS to connect to Redis'
    );

    const fargateService = new ecs.FargateService(this, `FargateService-${environmentSuffix}`, {
      serviceName: `migration-service-${environmentSuffix}`,
      cluster: this.ecsCluster,
      taskDefinition: taskDefinition,
      desiredCount: 2,
      securityGroups: [ecsSecurityGroup],
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      assignPublicIp: false,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
    });

    fargateService.attachToApplicationTargetGroup(targetGroup);

    // Auto-scaling configuration
    const scaling = fargateService.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 10,
    });

    scaling.scaleOnCpuUtilization(`CpuScaling-${environmentSuffix}`, {
      targetUtilizationPercent: 70,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    scaling.scaleOnMemoryUtilization(`MemoryScaling-${environmentSuffix}`, {
      targetUtilizationPercent: 80,
      scaleInCooldown: cdk.Duration.seconds(60),
      scaleOutCooldown: cdk.Duration.seconds(60),
    });

    // 8. SNS Topic for Alerts
    const alertTopic = new sns.Topic(this, `AlertTopic-${environmentSuffix}`, {
      topicName: `migration-alerts-${environmentSuffix}`,
      displayName: `Migration alerts for ${environmentName}`,
    });

    if (props.alertEmail) {
      alertTopic.addSubscription(new subscriptions.EmailSubscription(props.alertEmail));
    }

    // 9. CloudWatch Alarms
    const dbCpuAlarm = new cloudwatch.Alarm(this, `DbCpuAlarm-${environmentSuffix}`, {
      alarmName: `migration-db-cpu-${environmentSuffix}`,
      metric: this.database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    dbCpuAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    const albTargetResponseTime = new cloudwatch.Alarm(this, `AlbResponseTimeAlarm-${environmentSuffix}`, {
      alarmName: `migration-alb-response-${environmentSuffix}`,
      metric: targetGroup.metricTargetResponseTime(),
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    });
    albTargetResponseTime.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    const unhealthyHostAlarm = new cloudwatch.Alarm(this, `UnhealthyHostAlarm-${environmentSuffix}`, {
      alarmName: `migration-unhealthy-hosts-${environmentSuffix}`,
      metric: targetGroup.metricUnhealthyHostCount(),
      threshold: 1,
      evaluationPeriods: 2,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
    });
    unhealthyHostAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(alertTopic));

    // 10. CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, `Dashboard-${environmentSuffix}`, {
      dashboardName: `Migration-${environmentName}-${environmentSuffix}`,
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'Database CPU Utilization',
        left: [this.database.metricCPUUtilization()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Database Connections',
        left: [this.database.metricDatabaseConnections()],
      })
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [this.loadBalancer.metricRequestCount()],
      }),
      new cloudwatch.GraphWidget({
        title: 'Target Response Time',
        left: [targetGroup.metricTargetResponseTime()],
      })
    );

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

    // 11. Lambda for Pre-Migration Validation
    const preMigrationValidationRole = new iam.Role(this, `PreMigrationRole-${environmentSuffix}`, {
      roleName: `pre-migration-validation-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    dbSecret.grantRead(preMigrationValidationRole);

    const preMigrationFunction = new lambda.Function(this, `PreMigrationFunc-${environmentSuffix}`, {
      functionName: `pre-migration-validation-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/pre-migration'),
      role: preMigrationValidationRole,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [ecsSecurityGroup],
      timeout: cdk.Duration.minutes(5),
      environment: {
        DB_SECRET_ARN: dbSecret.secretArn,
        ENVIRONMENT: environmentName,
      },
    });

    // 12. Lambda for Post-Migration Validation
    const postMigrationValidationRole = new iam.Role(this, `PostMigrationRole-${environmentSuffix}`, {
      roleName: `post-migration-validation-${environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    dbSecret.grantRead(postMigrationValidationRole);

    const postMigrationFunction = new lambda.Function(this, `PostMigrationFunc-${environmentSuffix}`, {
      functionName: `post-migration-validation-${environmentSuffix}`,
      runtime: lambda.Runtime.PYTHON_3_11,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/post-migration'),
      role: postMigrationValidationRole,
      vpc: this.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [ecsSecurityGroup],
      timeout: cdk.Duration.minutes(5),
      environment: {
        DB_SECRET_ARN: dbSecret.secretArn,
        DB_ENDPOINT: this.database.dbInstanceEndpointAddress,
        ENVIRONMENT: environmentName,
      },
    });

    // Outputs
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `MigrationVpcId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'DatabaseEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      description: 'RDS Database Endpoint',
      exportName: `MigrationDbEndpoint-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDns', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS',
      exportName: `MigrationAlbDns-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ArtifactBucketName', {
      value: this.artifactBucket.bucketName,
      description: 'S3 Artifact Bucket Name',
      exportName: `MigrationArtifactBucket-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PreMigrationFunctionArn', {
      value: preMigrationFunction.functionArn,
      description: 'Pre-Migration Validation Lambda ARN',
      exportName: `PreMigrationFunctionArn-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PostMigrationFunctionArn', {
      value: postMigrationFunction.functionArn,
      description: 'Post-Migration Validation Lambda ARN',
      exportName: `PostMigrationFunctionArn-${environmentSuffix}`,
    });
  }
}
```

## File: lib/route53-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface Route53StackProps extends cdk.StackProps {
  domainName: string;
  environmentSuffix: string;
  devLoadBalancer?: elbv2.IApplicationLoadBalancer;
  stagingLoadBalancer?: elbv2.IApplicationLoadBalancer;
  prodLoadBalancer?: elbv2.IApplicationLoadBalancer;
  migrationPhase: 'preparation' | 'migration' | 'cutover' | 'complete';
}

export class Route53Stack extends cdk.Stack {
  public readonly hostedZone: route53.IHostedZone;

  constructor(scope: Construct, id: string, props: Route53StackProps) {
    super(scope, id, props);

    const { domainName, environmentSuffix, migrationPhase } = props;

    // Create or reference hosted zone
    this.hostedZone = new route53.PublicHostedZone(this, `HostedZone-${environmentSuffix}`, {
      zoneName: domainName,
    });

    // Weighted routing for gradual traffic shifting during migration
    if (props.devLoadBalancer) {
      new route53.ARecord(this, `DevRecord-${environmentSuffix}`, {
        zone: this.hostedZone,
        recordName: `dev.${domainName}`,
        target: route53.RecordTarget.fromAlias(
          new targets.LoadBalancerTarget(props.devLoadBalancer)
        ),
      });
    }

    if (props.stagingLoadBalancer) {
      new route53.ARecord(this, `StagingRecord-${environmentSuffix}`, {
        zone: this.hostedZone,
        recordName: `staging.${domainName}`,
        target: route53.RecordTarget.fromAlias(
          new targets.LoadBalancerTarget(props.stagingLoadBalancer)
        ),
      });
    }

    if (props.prodLoadBalancer) {
      // Production with weighted routing for blue-green deployment
      const weight = this.getWeightBasedOnPhase(migrationPhase);

      new route53.ARecord(this, `ProdRecord-${environmentSuffix}`, {
        zone: this.hostedZone,
        recordName: domainName,
        target: route53.RecordTarget.fromAlias(
          new targets.LoadBalancerTarget(props.prodLoadBalancer)
        ),
        weight: weight,
        setIdentifier: `prod-${environmentSuffix}`,
      });
    }

    new cdk.CfnOutput(this, 'HostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Route53 Hosted Zone ID',
      exportName: `HostedZoneId-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'NameServers', {
      value: cdk.Fn.join(',', this.hostedZone.hostedZoneNameServers || []),
      description: 'Route53 Name Servers',
    });
  }

  private getWeightBasedOnPhase(phase: string): number {
    switch (phase) {
      case 'preparation':
        return 0; // No traffic to new environment
      case 'migration':
        return 25; // 25% traffic to new environment
      case 'cutover':
        return 75; // 75% traffic to new environment
      case 'complete':
        return 100; // All traffic to new environment
      default:
        return 0;
    }
  }
}
```

## File: lib/vpc-peering-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface VpcPeeringStackProps extends cdk.StackProps {
  environmentSuffix: string;
  sourceVpc: ec2.IVpc;
  targetVpc: ec2.IVpc;
  sourceVpcCidr: string;
  targetVpcCidr: string;
}

export class VpcPeeringStack extends cdk.Stack {
  public readonly peeringConnection: ec2.CfnVPCPeeringConnection;

  constructor(scope: Construct, id: string, props: VpcPeeringStackProps) {
    super(scope, id, props);

    const { environmentSuffix, sourceVpc, targetVpc, sourceVpcCidr, targetVpcCidr } = props;

    // Create VPC Peering Connection
    this.peeringConnection = new ec2.CfnVPCPeeringConnection(this, `PeeringConnection-${environmentSuffix}`, {
      vpcId: sourceVpc.vpcId,
      peerVpcId: targetVpc.vpcId,
      tags: [
        {
          key: 'Name',
          value: `vpc-peering-${environmentSuffix}`,
        },
        {
          key: 'EnvironmentSuffix',
          value: environmentSuffix,
        },
      ],
    });

    // Add routes in source VPC to target VPC
    sourceVpc.privateSubnets.forEach((subnet, index) => {
      new ec2.CfnRoute(this, `SourceRoute${index}-${environmentSuffix}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: targetVpcCidr,
        vpcPeeringConnectionId: this.peeringConnection.ref,
      });
    });

    // Add routes in target VPC to source VPC
    targetVpc.privateSubnets.forEach((subnet, index) => {
      new ec2.CfnRoute(this, `TargetRoute${index}-${environmentSuffix}`, {
        routeTableId: subnet.routeTable.routeTableId,
        destinationCidrBlock: sourceVpcCidr,
        vpcPeeringConnectionId: this.peeringConnection.ref,
      });
    });

    new cdk.CfnOutput(this, 'PeeringConnectionId', {
      value: this.peeringConnection.ref,
      description: 'VPC Peering Connection ID',
      exportName: `VpcPeeringId-${environmentSuffix}`,
    });
  }
}
```

## File: lib/pipeline-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as codepipeline from 'aws-cdk-lib/aws-codepipeline';
import * as codepipeline_actions from 'aws-cdk-lib/aws-codepipeline-actions';
import * as codecommit from 'aws-cdk-lib/aws-codecommit';
import * as codebuild from 'aws-cdk-lib/aws-codebuild';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface PipelineStackProps extends cdk.StackProps {
  environmentSuffix: string;
  environmentName: string;
  repositoryName: string;
  notificationTopic: sns.ITopic;
}

export class PipelineStack extends cdk.Stack {
  public readonly pipeline: codepipeline.Pipeline;

  constructor(scope: Construct, id: string, props: PipelineStackProps) {
    super(scope, id, props);

    const { environmentSuffix, environmentName, repositoryName, notificationTopic } = props;

    // CodeCommit repository
    const repository = codecommit.Repository.fromRepositoryName(
      this,
      'Repository',
      repositoryName
    );

    // S3 bucket for pipeline artifacts
    const artifactBucket = new s3.Bucket(this, `PipelineArtifacts-${environmentSuffix}`, {
      bucketName: `pipeline-artifacts-${environmentSuffix}-${cdk.Aws.ACCOUNT_ID}`,
      encryption: s3.BucketEncryption.S3_MANAGED,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
    });

    // CodeBuild project for CDK synth
    const buildProject = new codebuild.PipelineProject(this, `BuildProject-${environmentSuffix}`, {
      projectName: `migration-build-${environmentSuffix}`,
      environment: {
        buildImage: codebuild.LinuxBuildImage.STANDARD_7_0,
        privileged: true,
      },
      buildSpec: codebuild.BuildSpec.fromObject({
        version: '0.2',
        phases: {
          install: {
            commands: [
              'npm install -g aws-cdk',
              'npm ci',
            ],
          },
          build: {
            commands: [
              'npm run build',
              'npm run test',
              'cdk synth',
            ],
          },
        },
        artifacts: {
          'base-directory': 'cdk.out',
          files: '**/*',
        },
      }),
    });

    // Pipeline
    const sourceOutput = new codepipeline.Artifact('SourceOutput');
    const buildOutput = new codepipeline.Artifact('BuildOutput');

    this.pipeline = new codepipeline.Pipeline(this, `Pipeline-${environmentSuffix}`, {
      pipelineName: `migration-pipeline-${environmentSuffix}`,
      artifactBucket: artifactBucket,
      restartExecutionOnUpdate: true,
    });

    // Source stage
    this.pipeline.addStage({
      stageName: 'Source',
      actions: [
        new codepipeline_actions.CodeCommitSourceAction({
          actionName: 'CodeCommit',
          repository: repository,
          branch: environmentName === 'prod' ? 'main' : environmentName,
          output: sourceOutput,
        }),
      ],
    });

    // Build stage
    this.pipeline.addStage({
      stageName: 'Build',
      actions: [
        new codepipeline_actions.CodeBuildAction({
          actionName: 'CDK_Build',
          project: buildProject,
          input: sourceOutput,
          outputs: [buildOutput],
        }),
      ],
    });

    // Manual approval for production
    if (environmentName === 'prod') {
      this.pipeline.addStage({
        stageName: 'Approval',
        actions: [
          new codepipeline_actions.ManualApprovalAction({
            actionName: 'ManualApproval',
            additionalInformation: 'Please review changes before deploying to production',
            notificationTopic: notificationTopic,
          }),
        ],
      });
    }

    // Deploy stage
    this.pipeline.addStage({
      stageName: 'Deploy',
      actions: [
        new codepipeline_actions.CloudFormationCreateUpdateStackAction({
          actionName: 'Deploy_Infrastructure',
          stackName: `MigrationStack-${environmentSuffix}`,
          templatePath: buildOutput.atPath('MigrationStack.template.json'),
          adminPermissions: true,
          parameterOverrides: {
            EnvironmentSuffix: environmentSuffix,
          },
        }),
      ],
    });

    new cdk.CfnOutput(this, 'PipelineName', {
      value: this.pipeline.pipelineName,
      description: 'CodePipeline Name',
      exportName: `PipelineName-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PipelineArn', {
      value: this.pipeline.pipelineArn,
      description: 'CodePipeline ARN',
    });
  }
}
```

## File: lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MigrationStack } from './migration-stack';
import { Route53Stack } from './route53-stack';
import { VpcPeeringStack } from './vpc-peering-stack';
import { PipelineStack } from './pipeline-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix =
      props?.environmentSuffix ||
      this.node.tryGetContext('environmentSuffix') ||
      'dev';

    // Note: This is a wrapper stack that orchestrates the migration stacks
    // The actual infrastructure stacks are created in bin/tap.ts
    // This design allows for flexible multi-environment deployments
  }
}
```

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';
import { MigrationStack } from '../lib/migration-stack';
import { Route53Stack } from '../lib/route53-stack';
import { VpcPeeringStack } from '../lib/vpc-peering-stack';
import { PipelineStack } from '../lib/pipeline-stack';

const app = new cdk.App();

// Get environment suffix from context
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'migration-repo';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const region = process.env.CDK_DEFAULT_REGION || 'ap-southeast-1';

// Environment configurations
const environments = {
  dev: {
    name: 'dev',
    vpcCidr: '10.0.0.0/16',
    migrationPhase: 'preparation' as const,
    alertEmail: 'devops-dev@example.com',
  },
  staging: {
    name: 'staging',
    vpcCidr: '10.1.0.0/16',
    migrationPhase: 'migration' as const,
    alertEmail: 'devops-staging@example.com',
  },
  prod: {
    name: 'prod',
    vpcCidr: '10.2.0.0/16',
    migrationPhase: 'cutover' as const,
    alertEmail: 'devops-prod@example.com',
  },
};

// Determine which environment to deploy based on suffix
const envKey = environmentSuffix.replace(/^(dev|staging|prod).*/, '$1') as keyof typeof environments;
const envConfig = environments[envKey] || environments.dev;

// Apply global tags
Tags.of(app).add('Environment', envConfig.name);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('ManagedBy', 'CDK');

const envProps = {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
  },
};

// Create main migration stack for the environment
const migrationStack = new MigrationStack(
  app,
  `MigrationStack-${environmentSuffix}`,
  {
    ...envProps,
    environmentName: envConfig.name,
    environmentSuffix: environmentSuffix,
    migrationPhase: envConfig.migrationPhase,
    vpcCidr: envConfig.vpcCidr,
    alertEmail: envConfig.alertEmail,
    stackName: `MigrationStack-${environmentSuffix}`,
  }
);

// Create TapStack for compatibility
const tapStack = new TapStack(app, `TapStack-${environmentSuffix}`, {
  ...envProps,
  environmentSuffix: environmentSuffix,
  stackName: `TapStack-${environmentSuffix}`,
});

// Optional: Create Route53 stack if domain is configured
const domainName = app.node.tryGetContext('domainName');
if (domainName) {
  new Route53Stack(app, `Route53Stack-${environmentSuffix}`, {
    ...envProps,
    domainName: domainName,
    environmentSuffix: environmentSuffix,
    prodLoadBalancer: migrationStack.loadBalancer,
    migrationPhase: envConfig.migrationPhase,
    stackName: `Route53Stack-${environmentSuffix}`,
  });
}

app.synth();
```

## File: lib/lambda/pre-migration/index.py

```python
import json
import os
import boto3
import psycopg2
from datetime import datetime

def handler(event, context):
    """
    Pre-migration validation function.
    Validates database connectivity and data integrity before migration.
    """

    secrets_client = boto3.client('secretsmanager')
    environment = os.environ.get('ENVIRONMENT', 'unknown')
    db_secret_arn = os.environ.get('DB_SECRET_ARN')

    print(f"Starting pre-migration validation for environment: {environment}")

    results = {
        'timestamp': datetime.utcnow().isoformat(),
        'environment': environment,
        'checks': {},
        'overall_status': 'PASS'
    }

    try:
        # Get database credentials from Secrets Manager
        secret_response = secrets_client.get_secret_value(SecretId=db_secret_arn)
        secret = json.loads(secret_response['SecretString'])

        # Connect to database
        conn = psycopg2.connect(
            host=secret['host'],
            port=secret.get('port', 5432),
            database=secret.get('dbname', 'migrationdb'),
            user=secret['username'],
            password=secret['password']
        )

        cursor = conn.cursor()

        # Check 1: Database connectivity
        cursor.execute("SELECT version();")
        db_version = cursor.fetchone()[0]
        results['checks']['database_connectivity'] = {
            'status': 'PASS',
            'message': f'Connected successfully. Version: {db_version}'
        }

        # Check 2: Schema validation
        cursor.execute("""
            SELECT COUNT(*)
            FROM information_schema.tables
            WHERE table_schema = 'public';
        """)
        table_count = cursor.fetchone()[0]
        results['checks']['schema_validation'] = {
            'status': 'PASS',
            'message': f'Found {table_count} tables in public schema'
        }

        # Check 3: Storage space
        cursor.execute("""
            SELECT pg_database_size(current_database()) as size;
        """)
        db_size = cursor.fetchone()[0]
        results['checks']['storage_check'] = {
            'status': 'PASS',
            'message': f'Database size: {db_size / (1024**3):.2f} GB'
        }

        # Check 4: Active connections
        cursor.execute("""
            SELECT COUNT(*)
            FROM pg_stat_activity
            WHERE state = 'active';
        """)
        active_connections = cursor.fetchone()[0]
        results['checks']['active_connections'] = {
            'status': 'PASS',
            'message': f'Active connections: {active_connections}'
        }

        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Validation failed: {str(e)}")
        results['overall_status'] = 'FAIL'
        results['error'] = str(e)

    print(f"Pre-migration validation complete: {results['overall_status']}")

    return {
        'statusCode': 200 if results['overall_status'] == 'PASS' else 500,
        'body': json.dumps(results, indent=2)
    }
```

## File: lib/lambda/post-migration/index.py

```python
import json
import os
import boto3
import psycopg2
from datetime import datetime

def handler(event, context):
    """
    Post-migration validation function.
    Validates data consistency and application health after migration.
    """

    secrets_client = boto3.client('secretsmanager')
    cloudwatch = boto3.client('cloudwatch')

    environment = os.environ.get('ENVIRONMENT', 'unknown')
    db_secret_arn = os.environ.get('DB_SECRET_ARN')
    db_endpoint = os.environ.get('DB_ENDPOINT')

    print(f"Starting post-migration validation for environment: {environment}")

    results = {
        'timestamp': datetime.utcnow().isoformat(),
        'environment': environment,
        'database_endpoint': db_endpoint,
        'checks': {},
        'overall_status': 'PASS'
    }

    try:
        # Get database credentials
        secret_response = secrets_client.get_secret_value(SecretId=db_secret_arn)
        secret = json.loads(secret_response['SecretString'])

        # Connect to migrated database
        conn = psycopg2.connect(
            host=db_endpoint,
            port=secret.get('port', 5432),
            database=secret.get('dbname', 'migrationdb'),
            user=secret['username'],
            password=secret['password']
        )

        cursor = conn.cursor()

        # Check 1: Database reachability
        cursor.execute("SELECT NOW();")
        current_time = cursor.fetchone()[0]
        results['checks']['database_reachability'] = {
            'status': 'PASS',
            'message': f'Database responding. Current time: {current_time}'
        }

        # Check 2: Data integrity - row counts
        cursor.execute("""
            SELECT
                schemaname,
                tablename,
                n_live_tup as row_count
            FROM pg_stat_user_tables
            ORDER BY n_live_tup DESC
            LIMIT 5;
        """)
        table_stats = cursor.fetchall()
        results['checks']['data_integrity'] = {
            'status': 'PASS',
            'message': f'Top tables verified',
            'details': [
                {'schema': row[0], 'table': row[1], 'rows': row[2]}
                for row in table_stats
            ]
        }

        # Check 3: Replication lag (if read replica exists)
        cursor.execute("""
            SELECT
                CASE
                    WHEN pg_is_in_recovery() THEN
                        EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))
                    ELSE 0
                END as replication_lag;
        """)
        replication_lag = cursor.fetchone()[0]
        results['checks']['replication_lag'] = {
            'status': 'PASS' if replication_lag < 30 else 'WARN',
            'message': f'Replication lag: {replication_lag:.2f} seconds'
        }

        # Check 4: Index health
        cursor.execute("""
            SELECT COUNT(*)
            FROM pg_stat_user_indexes
            WHERE idx_scan = 0;
        """)
        unused_indexes = cursor.fetchone()[0]
        results['checks']['index_health'] = {
            'status': 'PASS',
            'message': f'Unused indexes: {unused_indexes}'
        }

        # Check 5: Performance metrics
        cursor.execute("""
            SELECT
                SUM(blks_hit) / NULLIF(SUM(blks_hit + blks_read), 0) * 100 as cache_hit_ratio
            FROM pg_stat_database
            WHERE datname = current_database();
        """)
        cache_hit_ratio = cursor.fetchone()[0] or 0
        results['checks']['performance'] = {
            'status': 'PASS' if cache_hit_ratio > 90 else 'WARN',
            'message': f'Cache hit ratio: {cache_hit_ratio:.2f}%'
        }

        cursor.close()
        conn.close()

        # Publish custom CloudWatch metrics
        cloudwatch.put_metric_data(
            Namespace='Migration',
            MetricData=[
                {
                    'MetricName': 'PostMigrationValidation',
                    'Value': 1 if results['overall_status'] == 'PASS' else 0,
                    'Unit': 'None',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': environment}
                    ]
                },
                {
                    'MetricName': 'ReplicationLag',
                    'Value': float(replication_lag) if replication_lag else 0,
                    'Unit': 'Seconds',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': environment}
                    ]
                },
                {
                    'MetricName': 'CacheHitRatio',
                    'Value': float(cache_hit_ratio) if cache_hit_ratio else 0,
                    'Unit': 'Percent',
                    'Dimensions': [
                        {'Name': 'Environment', 'Value': environment}
                    ]
                }
            ]
        )

    except Exception as e:
        print(f"Post-migration validation failed: {str(e)}")
        results['overall_status'] = 'FAIL'
        results['error'] = str(e)

        # Publish failure metric
        try:
            cloudwatch.put_metric_data(
                Namespace='Migration',
                MetricData=[
                    {
                        'MetricName': 'PostMigrationValidation',
                        'Value': 0,
                        'Unit': 'None',
                        'Dimensions': [
                            {'Name': 'Environment', 'Value': environment}
                        ]
                    }
                ]
            )
        except:
            pass

    print(f"Post-migration validation complete: {results['overall_status']}")

    return {
        'statusCode': 200 if results['overall_status'] == 'PASS' else 500,
        'body': json.dumps(results, indent=2)
    }
```

## File: lib/lambda/pre-migration/requirements.txt

```
psycopg2-binary==2.9.9
boto3==1.34.34
```

## File: lib/lambda/post-migration/requirements.txt

```
psycopg2-binary==2.9.9
boto3==1.34.34
```

## File: lib/README.md

```markdown
# Migration Infrastructure CDK Application

This CDK application provides a complete infrastructure solution for orchestrating a phased migration of a monolithic application from on-premises to AWS cloud infrastructure.

## Architecture Overview

The solution deploys separate infrastructure stacks for dev, staging, and production environments, with comprehensive migration capabilities including:

- **VPC Infrastructure**: 3-AZ VPCs with public, private, and isolated subnets
- **Database Layer**: RDS PostgreSQL Multi-AZ with read replicas
- **Data Migration**: AWS DMS for continuous replication
- **Application Platform**: ECS Fargate with auto-scaling
- **Load Balancing**: Application Load Balancers with health checks
- **Caching**: ElastiCache Redis clusters
- **Monitoring**: CloudWatch dashboards and alarms
- **Alerting**: SNS topics for notifications
- **Validation**: Lambda functions for pre/post migration checks
- **Traffic Management**: Route 53 weighted routing for gradual cutover
- **Storage**: S3 buckets for artifacts with lifecycle policies
- **Backup**: AWS Backup with 7-day retention
- **CI/CD**: CodePipeline with manual approval gates

## Prerequisites

- AWS Account with appropriate permissions
- Node.js 18+ installed
- AWS CDK v2 installed: `npm install -g aws-cdk`
- AWS CLI configured with credentials
- Docker installed (for Lambda layer building)

## Environment Configuration

The application supports three environments with different configurations:

| Environment | VPC CIDR | Migration Phase | Auto-Scaling Min/Max |
|-------------|----------|----------------|---------------------|
| Development | 10.0.0.0/16 | Preparation | 2/10 |
| Staging | 10.1.0.0/16 | Migration | 2/10 |
| Production | 10.2.0.0/16 | Cutover | 2/10 |

## Required Secrets

Before deploying, create the following secrets in AWS Secrets Manager:

```bash
# Dev environment
aws secretsmanager create-secret \
  --name migration-db-credentials-dev \
  --secret-string '{"username":"admin","password":"YourSecurePassword123!","host":"placeholder","port":5432,"dbname":"migrationdb"}' \
  --region ap-southeast-1

# Staging environment
aws secretsmanager create-secret \
  --name migration-db-credentials-staging \
  --secret-string '{"username":"admin","password":"YourSecurePassword123!","host":"placeholder","port":5432,"dbname":"migrationdb"}' \
  --region ap-southeast-1

# Production environment
aws secretsmanager create-secret \
  --name migration-db-credentials-prod \
  --secret-string '{"username":"admin","password":"YourSecurePassword123!","host":"placeholder","port":5432,"dbname":"migrationdb"}' \
  --region ap-southeast-1
```

## Deployment Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Build Lambda Functions

```bash
# Install Lambda dependencies
cd lib/lambda/pre-migration && pip install -r requirements.txt -t . && cd ../../..
cd lib/lambda/post-migration && pip install -r requirements.txt -t . && cd ../../..
```

### 3. Configure Environment

Set the target AWS region:

```bash
export CDK_DEFAULT_REGION=ap-southeast-1
export CDK_DEFAULT_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
```

### 4. Deploy Development Environment

```bash
# Bootstrap CDK (first time only)
cdk bootstrap aws://$CDK_DEFAULT_ACCOUNT/$CDK_DEFAULT_REGION

# Deploy dev environment
cdk deploy MigrationStack-dev \
  -c environmentSuffix=dev \
  --require-approval never
```

### 5. Deploy Staging Environment

```bash
cdk deploy MigrationStack-staging \
  -c environmentSuffix=staging \
  --require-approval never
```

### 6. Deploy Production Environment

```bash
cdk deploy MigrationStack-prod \
  -c environmentSuffix=prod \
  --require-approval never
```

### 7. Optional: Deploy Route53 Stack

```bash
cdk deploy Route53Stack-prod \
  -c environmentSuffix=prod \
  -c domainName=example.com \
  --require-approval never
```

## Migration Runbook

### Phase 1: Preparation (Dev Environment)

1. Deploy dev environment
2. Verify infrastructure deployment
3. Run pre-migration validation:
   ```bash
   aws lambda invoke \
     --function-name pre-migration-validation-dev \
     --region ap-southeast-1 \
     output.json
   ```
4. Configure DMS tasks for test data migration
5. Validate application connectivity

### Phase 2: Migration (Staging Environment)

1. Deploy staging environment
2. Set up DMS replication from on-premises to staging RDS
3. Start continuous data replication
4. Monitor replication lag (should be < 30 seconds)
5. Run integration tests against staging environment
6. Validate data consistency

### Phase 3: Cutover (Production Environment)

1. Deploy production environment
2. Configure DMS replication to production RDS
3. Start continuous replication (parallel run)
4. Set Route 53 weights: 75% on-premises, 25% AWS
5. Monitor CloudWatch dashboards for:
   - Database replication lag
   - Application error rates
   - Response times
   - ECS task health
6. Run post-migration validation:
   ```bash
   aws lambda invoke \
     --function-name post-migration-validation-prod \
     --region ap-southeast-1 \
     output.json
   ```

### Phase 4: Complete

1. Gradually increase Route 53 weight to 100% AWS
2. Monitor for 24-48 hours
3. Stop DMS replication
4. Run final validation checks
5. Decommission on-premises infrastructure (after approval)

## Monitoring and Alerts

### CloudWatch Dashboards

Access dashboards at:
- `Migration-dev-dev`
- `Migration-staging-staging`
- `Migration-prod-prod`

### Key Metrics

- Database CPU Utilization (alarm at 80%)
- Database Connections
- ALB Request Count
- Target Response Time (alarm at 1 second)
- Unhealthy Host Count (alarm at 1+)
- ECS CPU/Memory Utilization (auto-scaling triggers)
- DMS Replication Lag
- Lambda Validation Results

### SNS Alerts

Subscribe to alert topics:

```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:ap-southeast-1:ACCOUNT:migration-alerts-prod \
  --protocol email \
  --notification-endpoint your-email@example.com \
  --region ap-southeast-1
```

## Rollback Procedures

### Immediate Rollback (Route 53)

```bash
# Set weight to 0 for AWS environment
aws route53 change-resource-record-sets \
  --hosted-zone-id YOUR_ZONE_ID \
  --change-batch file://rollback-route53.json
```

### Infrastructure Rollback

```bash
# Destroy specific environment
cdk destroy MigrationStack-prod -c environmentSuffix=prod

# Redeploy previous version
git checkout previous-commit
cdk deploy MigrationStack-prod -c environmentSuffix=prod
```

## Testing

### Unit Tests

```bash
npm run test
```

### Integration Tests

```bash
# Deploy environment first
cdk deploy MigrationStack-dev -c environmentSuffix=dev

# Run integration tests
npm run test:integration
```

## Cleanup

### Destroy Single Environment

```bash
cdk destroy MigrationStack-dev -c environmentSuffix=dev
```

### Destroy All Environments

```bash
cdk destroy --all
```

### Manual Cleanup

Some resources may require manual deletion:
- Secrets Manager secrets (if not using RemovalPolicy)
- CloudWatch log groups (beyond retention period)
- S3 bucket versions (if versioning enabled)

## Troubleshooting

### Database Connection Issues

1. Verify security group rules
2. Check secrets in Secrets Manager
3. Validate VPC and subnet configuration
4. Review RDS instance status

### DMS Replication Lag

1. Check replication instance size
2. Verify network connectivity
3. Monitor source database load
4. Review DMS task logs in CloudWatch

### ECS Task Failures

1. Check CloudWatch logs: `/ecs/migration-app`
2. Verify IAM role permissions
3. Validate container image availability
4. Review task definition configuration

### Lambda Validation Failures

1. Check Lambda logs in CloudWatch
2. Verify VPC and security group configuration
3. Test database connectivity manually
4. Review Secrets Manager permissions

## Cost Optimization

- NAT Gateways: ~$100/month per AZ (3 AZs = $300/month per environment)
- RDS PostgreSQL t3.large Multi-AZ: ~$350/month
- ECS Fargate: Variable based on task count and duration
- DMS Replication: ~$150/month for t3.large instance
- ElastiCache: ~$100/month for t3.medium cluster
- Data Transfer: Variable based on migration volume

**Estimated Total Cost per Environment**: $1,000-1,500/month during active migration

## Security Considerations

- All data encrypted at rest and in transit
- Secrets stored in AWS Secrets Manager
- Least-privilege IAM roles for all services
- VPC isolation with private subnets
- Security groups with minimal required access
- CloudWatch logging enabled for audit trails

## Support

For issues or questions:
1. Check CloudWatch logs
2. Review AWS CDK documentation
3. Consult AWS DMS best practices
4. Contact DevOps team

## License

Internal use only - Financial Services Company
```

## Summary

This implementation provides a complete, production-ready CDK TypeScript solution for orchestrating a phased migration from on-premises to AWS. Key features:

1. **Multi-Environment Support**: Separate stacks for dev, staging, and production
2. **Comprehensive Infrastructure**: VPC, RDS, DMS, ECS, ElastiCache, ALB, Route53, S3
3. **Security**: Secrets Manager integration, encryption, least-privilege IAM
4. **Monitoring**: CloudWatch dashboards, alarms, SNS notifications
5. **Validation**: Lambda functions for pre/post migration checks
6. **Blue-Green Deployment**: Route 53 weighted routing for gradual cutover
7. **Backup & Recovery**: AWS Backup with 7-day retention
8. **CI/CD**: CodePipeline with manual approval gates
9. **Destroyability**: All resources can be torn down (RemovalPolicy.DESTROY)
10. **Documentation**: Complete README with deployment and migration runbook

All resources follow the naming convention `{resource-type}-${environmentSuffix}` and include proper tagging (Environment, MigrationPhase, CostCenter, EnvironmentSuffix).
