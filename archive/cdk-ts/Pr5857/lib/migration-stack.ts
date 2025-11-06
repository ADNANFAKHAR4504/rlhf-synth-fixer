import * as cdk from 'aws-cdk-lib';
import * as backup from 'aws-cdk-lib/aws-backup';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dms from 'aws-cdk-lib/aws-dms';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as events from 'aws-cdk-lib/aws-events';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
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
    this.artifactBucket = new s3.Bucket(
      this,
      `ArtifactBucket-${environmentSuffix}`,
      {
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
      }
    );

    // Generate database credentials for CI/CD testing
    // In production, replace with Secret.fromSecretNameV2() to use existing secrets
    const dbSecret = new secretsmanager.Secret(
      this,
      `DbSecret-${environmentSuffix}`,
      {
        secretName: `migration-db-credentials-${environmentSuffix}`,
        description: `Database credentials for ${environmentName} environment`,
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: 'dbadmin',
          }),
          generateStringKey: 'password',
          excludePunctuation: true,
          passwordLength: 32,
        },
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // 2. Database Security Group
    const dbSecurityGroup = new ec2.SecurityGroup(
      this,
      `DbSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for RDS PostgreSQL - ${environmentName}`,
        securityGroupName: `migration-db-sg-${environmentSuffix}`,
      }
    );

    // 3. RDS PostgreSQL Multi-AZ with Read Replica
    const dbSubnetGroup = new rds.SubnetGroup(
      this,
      `DbSubnetGroup-${environmentSuffix}`,
      {
        subnetGroupName: `migration-db-subnet-${environmentSuffix}`,
        description: `Subnet group for migration database - ${environmentName}`,
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      }
    );

    this.database = new rds.DatabaseInstance(
      this,
      `Database-${environmentSuffix}`,
      {
        instanceIdentifier: `migration-db-${environmentSuffix}`,
        engine: rds.DatabaseInstanceEngine.postgres({
          version: rds.PostgresEngineVersion.VER_15_7,
        }),
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.LARGE
        ),
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
        credentials: rds.Credentials.fromPassword(
          dbSecret.secretValueFromJson('username').unsafeUnwrap(),
          dbSecret.secretValueFromJson('password')
        ),
        databaseName: 'migrationdb',
        backupRetention: cdk.Duration.days(7),
        deleteAutomatedBackups: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
        deletionProtection: false,
        cloudwatchLogsExports: ['postgresql'],
        enablePerformanceInsights: true,
        performanceInsightRetention: rds.PerformanceInsightRetention.DEFAULT,
      }
    );

    // Read Replica for improved performance
    new rds.DatabaseInstanceReadReplica(
      this,
      `DatabaseReadReplica-${environmentSuffix}`,
      {
        sourceDatabaseInstance: this.database,
        instanceIdentifier: `migration-db-replica-${environmentSuffix}`,
        instanceType: ec2.InstanceType.of(
          ec2.InstanceClass.T3,
          ec2.InstanceSize.LARGE
        ),
        vpc: this.vpc,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
        securityGroups: [dbSecurityGroup],
        publiclyAccessible: false,
        deleteAutomatedBackups: true,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    // 4. AWS Backup configuration
    const backupVault = new backup.BackupVault(
      this,
      `BackupVault-${environmentSuffix}`,
      {
        backupVaultName: `migration-vault-${environmentSuffix}`,
        removalPolicy: cdk.RemovalPolicy.DESTROY,
      }
    );

    const backupPlan = new backup.BackupPlan(
      this,
      `BackupPlan-${environmentSuffix}`,
      {
        backupPlanName: `migration-backup-${environmentSuffix}`,
        backupVault: backupVault,
        backupPlanRules: [
          new backup.BackupPlanRule({
            ruleName: 'DailyBackup',
            scheduleExpression: events.Schedule.cron({
              hour: '2',
              minute: '0',
            }),
            deleteAfter: cdk.Duration.days(7),
          }),
        ],
      }
    );

    backupPlan.addSelection(`BackupSelection-${environmentSuffix}`, {
      resources: [backup.BackupResource.fromRdsDatabaseInstance(this.database)],
    });

    // 5. DMS Replication Instance and Subnet Group
    const dmsSubnetGroup = new dms.CfnReplicationSubnetGroup(
      this,
      `DmsSubnetGroup-${environmentSuffix}`,
      {
        replicationSubnetGroupIdentifier: `dms-subnet-${environmentSuffix}`,
        replicationSubnetGroupDescription: `DMS subnet group for ${environmentName}`,
        subnetIds: this.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }).subnetIds,
      }
    );

    const dmsSecurityGroup = new ec2.SecurityGroup(
      this,
      `DmsSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for DMS replication - ${environmentName}`,
        securityGroupName: `dms-sg-${environmentSuffix}`,
      }
    );

    // Allow DMS to connect to database
    dbSecurityGroup.addIngressRule(
      dmsSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow DMS to connect to PostgreSQL'
    );

    const dmsReplicationInstance = new dms.CfnReplicationInstance(
      this,
      `DmsInstance-${environmentSuffix}`,
      {
        replicationInstanceIdentifier: `dms-instance-${environmentSuffix}`,
        replicationInstanceClass: 'dms.t3.large',
        allocatedStorage: 100,
        vpcSecurityGroupIds: [dmsSecurityGroup.securityGroupId],
        replicationSubnetGroupIdentifier:
          dmsSubnetGroup.replicationSubnetGroupIdentifier,
        publiclyAccessible: false,
        multiAz: false,
      }
    );
    dmsReplicationInstance.addDependency(dmsSubnetGroup);

    // 6. ElastiCache Redis Cluster
    const cacheSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      `CacheSubnetGroup-${environmentSuffix}`,
      {
        subnetIds: this.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        }).subnetIds,
        description: `Cache subnet group for ${environmentName}`,
        cacheSubnetGroupName: `cache-subnet-${environmentSuffix}`,
      }
    );

    const cacheSecurityGroup = new ec2.SecurityGroup(
      this,
      `CacheSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for Redis cache - ${environmentName}`,
        securityGroupName: `cache-sg-${environmentSuffix}`,
      }
    );

    const redisCluster = new elasticache.CfnReplicationGroup(
      this,
      `RedisCluster-${environmentSuffix}`,
      {
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
      }
    );
    redisCluster.addDependency(cacheSubnetGroup);

    // 7. ECS Cluster and Fargate Service
    this.ecsCluster = new ecs.Cluster(this, `EcsCluster-${environmentSuffix}`, {
      clusterName: `migration-cluster-${environmentSuffix}`,
      vpc: this.vpc,
      containerInsights: true,
    });

    // Task execution role
    const taskExecutionRole = new iam.Role(
      this,
      `TaskExecutionRole-${environmentSuffix}`,
      {
        roleName: `ecs-task-execution-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AmazonECSTaskExecutionRolePolicy'
          ),
        ],
      }
    );

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
    const taskDefinition = new ecs.FargateTaskDefinition(
      this,
      `TaskDef-${environmentSuffix}`,
      {
        family: `migration-app-${environmentSuffix}`,
        memoryLimitMiB: 2048,
        cpu: 1024,
        executionRole: taskExecutionRole,
        taskRole: taskRole,
      }
    );

    const appContainer = taskDefinition.addContainer(
      `AppContainer-${environmentSuffix}`,
      {
        containerName: 'app',
        image: ecs.ContainerImage.fromRegistry(
          'public.ecr.aws/docker/library/nginx:latest'
        ),
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
      }
    );

    appContainer.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // Application Load Balancer
    const albSecurityGroup = new ec2.SecurityGroup(
      this,
      `AlbSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for ALB - ${environmentName}`,
        securityGroupName: `alb-sg-${environmentSuffix}`,
      }
    );

    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    this.loadBalancer = new elbv2.ApplicationLoadBalancer(
      this,
      `Alb-${environmentSuffix}`,
      {
        loadBalancerName: `migration-alb-${environmentSuffix}`,
        vpc: this.vpc,
        internetFacing: true,
        securityGroup: albSecurityGroup,
        vpcSubnets: {
          subnetType: ec2.SubnetType.PUBLIC,
        },
      }
    );

    const targetGroup = new elbv2.ApplicationTargetGroup(
      this,
      `TargetGroup-${environmentSuffix}`,
      {
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
      }
    );

    this.loadBalancer.addListener(`Listener-${environmentSuffix}`, {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // ECS Fargate Service
    const ecsSecurityGroup = new ec2.SecurityGroup(
      this,
      `EcsSecurityGroup-${environmentSuffix}`,
      {
        vpc: this.vpc,
        description: `Security group for ECS tasks - ${environmentName}`,
        securityGroupName: `ecs-sg-${environmentSuffix}`,
      }
    );

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

    const fargateService = new ecs.FargateService(
      this,
      `FargateService-${environmentSuffix}`,
      {
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
      }
    );

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
      alertTopic.addSubscription(
        new subscriptions.EmailSubscription(props.alertEmail)
      );
    }

    // 9. CloudWatch Alarms
    const dbCpuAlarm = new cloudwatch.Alarm(
      this,
      `DbCpuAlarm-${environmentSuffix}`,
      {
        alarmName: `migration-db-cpu-${environmentSuffix}`,
        metric: this.database.metricCPUUtilization(),
        threshold: 80,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    dbCpuAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alertTopic)
    );

    const albTargetResponseTime = new cloudwatch.Alarm(
      this,
      `AlbResponseTimeAlarm-${environmentSuffix}`,
      {
        alarmName: `migration-alb-response-${environmentSuffix}`,
        metric: targetGroup.metricTargetResponseTime(),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      }
    );
    albTargetResponseTime.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alertTopic)
    );

    const unhealthyHostAlarm = new cloudwatch.Alarm(
      this,
      `UnhealthyHostAlarm-${environmentSuffix}`,
      {
        alarmName: `migration-unhealthy-hosts-${environmentSuffix}`,
        metric: targetGroup.metricUnhealthyHostCount(),
        threshold: 1,
        evaluationPeriods: 2,
        comparisonOperator:
          cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      }
    );
    unhealthyHostAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(alertTopic)
    );

    // 10. CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(
      this,
      `Dashboard-${environmentSuffix}`,
      {
        dashboardName: `Migration-${environmentName}-${environmentSuffix}`,
      }
    );

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
    const preMigrationValidationRole = new iam.Role(
      this,
      `PreMigrationRole-${environmentSuffix}`,
      {
        roleName: `pre-migration-validation-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
      }
    );

    dbSecret.grantRead(preMigrationValidationRole);

    const preMigrationFunction = new lambda.Function(
      this,
      `PreMigrationFunc-${environmentSuffix}`,
      {
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
      }
    );

    // 12. Lambda for Post-Migration Validation
    const postMigrationValidationRole = new iam.Role(
      this,
      `PostMigrationRole-${environmentSuffix}`,
      {
        roleName: `post-migration-validation-${environmentSuffix}`,
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
        managedPolicies: [
          iam.ManagedPolicy.fromAwsManagedPolicyName(
            'service-role/AWSLambdaVPCAccessExecutionRole'
          ),
        ],
      }
    );

    dbSecret.grantRead(postMigrationValidationRole);

    const postMigrationFunction = new lambda.Function(
      this,
      `PostMigrationFunc-${environmentSuffix}`,
      {
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
      }
    );

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
