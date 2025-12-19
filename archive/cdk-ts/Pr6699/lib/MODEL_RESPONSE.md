# CDK TypeScript Infrastructure - Three-Tier Application Migration

This solution implements a production-ready three-tier application infrastructure with VPC, RDS PostgreSQL, ECS Fargate, ElastiCache Redis, and supporting services.

## Architecture Overview

The infrastructure is organized into multiple stacks:
- **NetworkStack**: VPC with public/private subnets, NAT Gateway, Route 53
- **DatabaseStack**: RDS PostgreSQL Multi-AZ, ElastiCache Redis
- **ComputeStack**: ECS Fargate, Application Load Balancer, Auto Scaling
- **MonitoringStack**: CloudWatch Logs, SNS Alerts

## File: bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { NetworkStack } from '../lib/network-stack';
import { DatabaseStack } from '../lib/database-stack';
import { ComputeStack } from '../lib/compute-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';
const prNumber = process.env.PR_NUMBER || 'unknown';
const team = process.env.TEAM || 'unknown';
const createdAt = new Date().toISOString();

// Apply global tags
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);
Tags.of(app).add('PRNumber', prNumber);
Tags.of(app).add('Team', team);
Tags.of(app).add('CreatedAt', createdAt);

// Network Stack
const networkStack = new NetworkStack(app, `NetworkStack-${environmentSuffix}`, {
  stackName: `NetworkStack-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

// Monitoring Stack
const monitoringStack = new MonitoringStack(app, `MonitoringStack-${environmentSuffix}`, {
  stackName: `MonitoringStack-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});

// Database Stack
const databaseStack = new DatabaseStack(app, `DatabaseStack-${environmentSuffix}`, {
  stackName: `DatabaseStack-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  vpc: networkStack.vpc,
  alertTopic: monitoringStack.alertTopic,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
databaseStack.addDependency(networkStack);
databaseStack.addDependency(monitoringStack);

// Compute Stack
const computeStack = new ComputeStack(app, `ComputeStack-${environmentSuffix}`, {
  stackName: `ComputeStack-${environmentSuffix}`,
  environmentSuffix: environmentSuffix,
  vpc: networkStack.vpc,
  database: databaseStack.database,
  redisCluster: databaseStack.redisCluster,
  alertTopic: monitoringStack.alertTopic,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
  },
});
computeStack.addDependency(databaseStack);

app.synth();
```

## File: lib/network-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as route53 from 'aws-cdk-lib/aws-route53';
import { Construct } from 'constructs';

export interface NetworkStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class NetworkStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly hostedZone: route53.PrivateHostedZone;

  constructor(scope: Construct, id: string, props: NetworkStackProps) {
    super(scope, id, props);

    // VPC with 3 AZs, public and private subnets
    this.vpc = new ec2.Vpc(this, 'ProductionVPC', {
      vpcName: `production-vpc-${props.environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 3,
      natGateways: 1, // Using 1 NAT Gateway for cost optimization
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
      ],
    });

    // Private hosted zone for internal service discovery
    this.hostedZone = new route53.PrivateHostedZone(this, 'PrivateZone', {
      zoneName: `internal.${props.environmentSuffix}.local`,
      vpc: this.vpc,
    });

    // Output VPC ID
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID',
      exportName: `VpcId-${props.environmentSuffix}`,
    });

    // Output Private Hosted Zone ID
    new cdk.CfnOutput(this, 'PrivateHostedZoneId', {
      value: this.hostedZone.hostedZoneId,
      description: 'Private Hosted Zone ID',
      exportName: `PrivateHostedZoneId-${props.environmentSuffix}`,
    });
  }
}
```

## File: lib/database-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  alertTopic: sns.ITopic;
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.IDatabaseInstance;
  public readonly redisCluster: elasticache.CfnCacheCluster;
  public readonly migrationLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: true,
    });

    // Security group for Redis
    const redisSecurityGroup = new ec2.SecurityGroup(this, 'RedisSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for ElastiCache Redis',
      allowAllOutbound: true,
    });

    // RDS subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      description: 'Subnet group for RDS',
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // RDS PostgreSQL Instance
    this.database = new rds.DatabaseInstance(this, 'PostgresDB', {
      instanceIdentifier: `trading-db-${props.environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15_4,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.R6G,
        ec2.InstanceSize.LARGE
      ),
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
      subnetGroup: dbSubnetGroup,
      multiAz: true,
      allocatedStorage: 100,
      storageType: rds.StorageType.GP3,
      backupRetention: cdk.Duration.days(7),
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.SNAPSHOT, // ISSUE: Should be DESTROY
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Redis subnet group
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(this, 'RedisSubnetGroup', {
      description: 'Subnet group for Redis',
      subnetIds: props.vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }).subnetIds,
      cacheSubnetGroupName: `redis-subnet-${props.environmentSuffix}`,
    });

    // ElastiCache Redis Cluster
    this.redisCluster = new elasticache.CfnCacheCluster(this, 'RedisCluster', {
      cacheNodeType: 'cache.t3.micro',
      engine: 'redis',
      numCacheNodes: 1,
      clusterName: `trading-redis-${props.environmentSuffix}`,
      vpcSecurityGroupIds: [redisSecurityGroup.securityGroupId],
      cacheSubnetGroupName: redisSubnetGroup.cacheSubnetGroupName,
      engineVersion: '7.0',
    });
    this.redisCluster.addDependency(redisSubnetGroup);

    // Migration Lambda Function
    const migrationLambdaRole = new iam.Role(this, 'MigrationLambdaRole', {
      roleName: `migration-lambda-role-${props.environmentSuffix}`, // ISSUE: Missing in some places
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaVPCAccessExecutionRole'),
      ],
    });

    // Grant RDS access
    migrationLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'rds:DescribeDBInstances',
        'rds:DescribeDBClusters',
      ],
      resources: ['*'],
    }));

    // Grant Secrets Manager access for database credentials
    migrationLambdaRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'secretsmanager:GetSecretValue',
      ],
      resources: [
        this.database.secret?.secretArn || '*',
      ],
    }));

    this.migrationLambda = new lambda.Function(this, 'MigrationFunction', {
      functionName: `db-migration-${props.environmentSuffix}`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset('lib/lambda/migration'),
      role: migrationLambdaRole,
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [dbSecurityGroup],
      timeout: cdk.Duration.minutes(15),
      environment: {
        DB_SECRET_ARN: this.database.secret?.secretArn || '',
        TARGET_DB_ENDPOINT: this.database.dbInstanceEndpointAddress,
        STAGING_DB_ENDPOINT: 'staging-db.example.com', // Placeholder
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Allow Lambda to connect to RDS
    dbSecurityGroup.addIngressRule(
      dbSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to RDS'
    );

    // Allow ECS to connect to Redis
    redisSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow VPC traffic to Redis'
    );

    // CloudWatch Alarm for RDS CPU
    const cpuAlarm = new cdk.aws_cloudwatch.Alarm(this, 'DBCPUAlarm', {
      metric: this.database.metricCPUUtilization(),
      threshold: 80,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      alarmDescription: 'RDS CPU utilization is high',
    });
    cpuAlarm.addAlarmAction(new cdk.aws_cloudwatch_actions.SnsAction(props.alertTopic));

    // Outputs
    new cdk.CfnOutput(this, 'RDSEndpoint', {
      value: this.database.dbInstanceEndpointAddress,
      description: 'RDS PostgreSQL Endpoint',
      exportName: `RDSEndpoint-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'RedisEndpoint', {
      value: this.redisCluster.attrRedisEndpointAddress,
      description: 'Redis Cluster Endpoint',
      exportName: `RedisEndpoint-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'MigrationLambdaArn', {
      value: this.migrationLambda.functionArn,
      description: 'Migration Lambda Function ARN',
      exportName: `MigrationLambdaArn-${props.environmentSuffix}`,
    });
  }
}
```

## File: lib/compute-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cw_actions from 'aws-cdk-lib/aws-cloudwatch-actions';
import { Construct } from 'constructs';

export interface ComputeStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  database: rds.IDatabaseInstance;
  redisCluster: elasticache.CfnCacheCluster;
  alertTopic: sns.ITopic;
}

export class ComputeStack extends cdk.Stack {
  public readonly loadBalancer: elbv2.ApplicationLoadBalancer;
  public readonly fargateService: ecs.FargateService;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // ECS Cluster
    const cluster = new ecs.Cluster(this, 'TradingCluster', {
      clusterName: `trading-cluster-${props.environmentSuffix}`,
      vpc: props.vpc,
      containerInsights: true,
    });

    // ECS Task Execution Role
    const taskExecutionRole = new iam.Role(this, 'TaskExecutionRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AmazonECSTaskExecutionRolePolicy'),
      ],
    });

    // ECS Task Role
    const taskRole = new iam.Role(this, 'TaskRole', {
      roleName: `ecs-task-role-prod`, // ISSUE: Hardcoded 'prod' instead of environmentSuffix
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });

    // Grant access to RDS
    taskRole.addToPolicy(new iam.PolicyStatement({
      actions: [
        'rds:DescribeDBInstances',
      ],
      resources: ['*'], // ISSUE: Too broad, should be specific
    }));

    // Grant access to Secrets Manager for DB credentials
    if (props.database.secret) {
      props.database.secret.grantRead(taskRole);
    }

    // CloudWatch Log Group for ECS
    const logGroup = new logs.LogGroup(this, 'ECSLogGroup', {
      logGroupName: `/ecs/trading-api-${props.environmentSuffix}`,
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Task Definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TaskDef', {
      family: `trading-api-${props.environmentSuffix}`,
      cpu: 512,
      memoryLimitMiB: 1024,
      executionRole: taskExecutionRole,
      taskRole: taskRole,
    });

    // Container Definition
    const container = taskDefinition.addContainer('ApiContainer', {
      containerName: 'trading-api',
      image: ecs.ContainerImage.fromRegistry('nginxdemos/hello'), // Placeholder image
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'ecs',
        logGroup: logGroup,
      }),
      environment: {
        DB_ENDPOINT: props.database.dbInstanceEndpointAddress,
        REDIS_ENDPOINT: props.redisCluster.attrRedisEndpointAddress,
        ENVIRONMENT: props.environmentSuffix,
      },
      secrets: props.database.secret ? {
        DB_PASSWORD: ecs.Secret.fromSecretsManager(props.database.secret, 'password'),
        DB_USERNAME: ecs.Secret.fromSecretsManager(props.database.secret, 'username'),
      } : undefined,
    });

    container.addPortMappings({
      containerPort: 80,
      protocol: ecs.Protocol.TCP,
    });

    // Application Load Balancer
    this.loadBalancer = new elbv2.ApplicationLoadBalancer(this, 'ALB', {
      loadBalancerName: `trading-alb-${props.environmentSuffix}`,
      vpc: props.vpc,
      internetFacing: true,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PUBLIC,
      },
    });

    // ALB Target Group
    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'TargetGroup', {
      targetGroupName: `trading-tg-${props.environmentSuffix}`,
      vpc: props.vpc,
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/health',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
      deregistrationDelay: cdk.Duration.seconds(30),
    });

    // ALB Listener
    this.loadBalancer.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    // Security group for ALB
    const albSecurityGroup = new ec2.SecurityGroup(this, 'ALBSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for ALB',
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(80),
      'Allow HTTP traffic'
    );

    // Security group for ECS tasks
    const ecsSecurityGroup = new ec2.SecurityGroup(this, 'ECSSecurityGroup', {
      vpc: props.vpc,
      description: 'Security group for ECS tasks',
      allowAllOutbound: true,
    });
    ecsSecurityGroup.addIngressRule(
      albSecurityGroup,
      ec2.Port.tcp(80),
      'Allow traffic from ALB'
    );

    // Fargate Service
    this.fargateService = new ecs.FargateService(this, 'FargateService', {
      serviceName: `trading-service-${props.environmentSuffix}`,
      cluster: cluster,
      taskDefinition: taskDefinition,
      desiredCount: 2,
      minHealthyPercent: 50,
      maxHealthyPercent: 200,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      securityGroups: [ecsSecurityGroup],
      assignPublicIp: false,
    });

    // Attach service to target group
    this.fargateService.attachToApplicationTargetGroup(targetGroup);

    // Auto Scaling
    const scaling = this.fargateService.autoScaleTaskCount({
      minCapacity: 2,
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

    // CloudWatch Alarms
    const unhealthyHostAlarm = new cloudwatch.Alarm(this, 'UnhealthyHostAlarm', {
      metric: targetGroup.metrics.unhealthyHostCount(),
      threshold: 1,
      evaluationPeriods: 2,
      datapointsToAlarm: 2,
      alarmDescription: 'Unhealthy hosts detected in target group',
    });
    unhealthyHostAlarm.addAlarmAction(new cw_actions.SnsAction(props.alertTopic));

    // Outputs
    new cdk.CfnOutput(this, 'ALBDnsName', {
      value: this.loadBalancer.loadBalancerDnsName,
      description: 'Application Load Balancer DNS Name',
      exportName: `ALBDnsName-${props.environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.fargateService.serviceName,
      description: 'ECS Service Name',
      exportName: `ServiceName-${props.environmentSuffix}`,
    });
  }
}
```

## File: lib/monitoring-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  environmentSuffix: string;
}

export class MonitoringStack extends cdk.Stack {
  public readonly alertTopic: sns.Topic;

  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    // SNS Topic for alerts
    this.alertTopic = new sns.Topic(this, 'AlertTopic', {
      topicName: `critical-alerts-${props.environmentSuffix}`,
      displayName: 'Critical Infrastructure Alerts',
    });

    // Email subscription (placeholder - should be configured via parameter)
    // In production, this would come from a parameter or context
    const alertEmail = this.node.tryGetContext('alertEmail') || 'alerts@example.com';

    this.alertTopic.addSubscription(
      new subscriptions.EmailSubscription(alertEmail)
    );

    // Output
    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: this.alertTopic.topicArn,
      description: 'SNS Alert Topic ARN',
      exportName: `AlertTopicArn-${props.environmentSuffix}`,
    });
  }
}
```

## File: lib/lambda/migration/index.ts

```typescript
import { Handler } from 'aws-lambda';

// Migration Lambda placeholder
// In production, this would use pg client to connect to source and target databases
export const handler: Handler = async (event, context) => {
  console.log('Migration Lambda triggered');
  console.log('Event:', JSON.stringify(event, null, 2));

  const dbSecretArn = process.env.DB_SECRET_ARN;
  const targetDbEndpoint = process.env.TARGET_DB_ENDPOINT;
  const stagingDbEndpoint = process.env.STAGING_DB_ENDPOINT;

  console.log('Target DB Endpoint:', targetDbEndpoint);
  console.log('Staging DB Endpoint:', stagingDbEndpoint);

  // TODO: Implement actual migration logic
  // 1. Retrieve credentials from Secrets Manager
  // 2. Connect to staging database
  // 3. Connect to production database
  // 4. Copy data tables
  // 5. Verify data integrity

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Migration lambda placeholder - implement actual migration logic',
      targetEndpoint: targetDbEndpoint,
      stagingEndpoint: stagingDbEndpoint,
    }),
  };
};
```

## File: lib/lambda/migration/package.json

```json
{
  "name": "migration-lambda",
  "version": "1.0.0",
  "description": "Database migration lambda",
  "main": "index.js",
  "dependencies": {
    "pg": "^8.11.3"
  }
}
```

## File: cdk.json

```json
{
  "app": "npx ts-node --prefer-ts-exts bin/tap.ts",
  "watch": {
    "include": [
      "**"
    ],
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
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
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

## File: lib/README.md

```markdown
# Three-Tier Application Infrastructure

This CDK application deploys a production-ready three-tier application infrastructure for migrating a financial services trading platform.

## Architecture

- **Network Stack**: VPC with 3 AZs, public/private subnets, NAT Gateway, Route 53 private hosted zone
- **Database Stack**: RDS PostgreSQL Multi-AZ, ElastiCache Redis, Migration Lambda
- **Compute Stack**: ECS Fargate with Application Load Balancer, Auto Scaling (2-10 tasks)
- **Monitoring Stack**: CloudWatch Logs, SNS alerts for critical events

## Prerequisites

- Node.js 18+
- AWS CLI configured
- AWS CDK CLI installed (`npm install -g aws-cdk`)
- Docker (for Lambda function packaging)

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Bootstrap CDK (if not already done):
```bash
cdk bootstrap
```

3. Deploy all stacks:
```bash
cdk deploy --all --context environmentSuffix=<your-suffix>
```

4. To trigger the migration Lambda:
```bash
aws lambda invoke --function-name db-migration-<suffix> response.json
```

## Outputs

After deployment, the following outputs will be available:
- ALB DNS Name
- RDS PostgreSQL Endpoint
- Redis Endpoint
- Migration Lambda ARN

## Cost Optimization

- Single NAT Gateway instead of one per AZ
- db.r6g.large RDS instance type
- cache.t3.micro Redis instance
- Fargate Spot can be enabled for cost savings

## Clean Up

```bash
cdk destroy --all --context environmentSuffix=<your-suffix>
```
```
