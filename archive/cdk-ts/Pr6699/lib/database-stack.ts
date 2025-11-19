import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as sns from 'aws-cdk-lib/aws-sns';
import { Construct } from 'constructs';

export interface DatabaseStackProps extends cdk.StackProps {
  environmentSuffix: string;
  vpc: ec2.IVpc;
  alertTopic: sns.ITopic;
  credentials?: rds.Credentials; // Add this line
}

export class DatabaseStack extends cdk.Stack {
  public readonly database: rds.DatabaseInstance;
  public readonly redisCluster: elasticache.CfnCacheCluster;
  public readonly migrationLambda: lambda.Function;

  constructor(scope: Construct, id: string, props: DatabaseStackProps) {
    super(scope, id, props);

    // Security group for RDS
    const dbSecurityGroup = new ec2.SecurityGroup(this, 'DBSecurityGroup', {
      securityGroupName: `db-sg-${props.environmentSuffix}`,
      vpc: props.vpc,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: true,
    });

    // Security group for Redis
    const redisSecurityGroup = new ec2.SecurityGroup(
      this,
      'RedisSecurityGroup',
      {
        securityGroupName: `redis-sg-${props.environmentSuffix}`,
        vpc: props.vpc,
        description: 'Security group for ElastiCache Redis',
        allowAllOutbound: true,
      }
    );

    // RDS subnet group
    const dbSubnetGroup = new rds.SubnetGroup(this, 'DBSubnetGroup', {
      subnetGroupName: `db-subnet-group-${props.environmentSuffix}`,
      description: 'Subnet group for RDS',
      vpc: props.vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      },
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // RDS PostgreSQL Instance - CORRECTED with proper removal policies
    this.database = new rds.DatabaseInstance(this, 'PostgresDB', {
      instanceIdentifier: `trading-db-${props.environmentSuffix}`,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.of('15.15', '15'),
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
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      cloudwatchLogsExports: ['postgresql'],
      cloudwatchLogsRetention: logs.RetentionDays.ONE_MONTH,
      ...(props.credentials && { credentials: props.credentials }), // Add this line
    });

    // Configure deletion behavior - no final snapshot will be created on deletion
    const cfnDatabase = this.database.node.defaultChild as rds.CfnDBInstance;
    cfnDatabase.addPropertyOverride('DeleteAutomatedBackups', true);

    // Redis subnet group
    const redisSubnetGroup = new elasticache.CfnSubnetGroup(
      this,
      'RedisSubnetGroup',
      {
        description: 'Subnet group for Redis',
        subnetIds: props.vpc.selectSubnets({
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        }).subnetIds,
        cacheSubnetGroupName: `redis-subnet-${props.environmentSuffix}`,
      }
    );

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
      roleName: `migration-lambda-role-${props.environmentSuffix}`,
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName(
          'service-role/AWSLambdaVPCAccessExecutionRole'
        ),
      ],
    });

    // Grant RDS access with specific resource ARN
    migrationLambdaRole.addToPolicy(
      new iam.PolicyStatement({
        actions: ['rds:DescribeDBInstances', 'rds:DescribeDBClusters'],
        resources: [this.database.instanceArn],
      })
    );

    // Grant Secrets Manager access for database credentials
    if (this.database.secret) {
      this.database.secret.grantRead(migrationLambdaRole);
    }

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
        STAGING_DB_ENDPOINT: 'staging-db.example.com', // Placeholder - configure via context
      },
      logRetention: logs.RetentionDays.ONE_MONTH,
    });

    // Allow Lambda to connect to RDS
    dbSecurityGroup.addIngressRule(
      dbSecurityGroup,
      ec2.Port.tcp(5432),
      'Allow Lambda to connect to RDS'
    );

    // Allow ECS to connect to RDS (will be added by compute stack)
    dbSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(5432),
      'Allow VPC traffic to RDS'
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
    cpuAlarm.addAlarmAction(
      new cdk.aws_cloudwatch_actions.SnsAction(props.alertTopic)
    );

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
