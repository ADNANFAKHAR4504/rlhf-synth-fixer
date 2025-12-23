import { Construct } from 'constructs';
import { Fn, TerraformOutput } from 'cdktf';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { KinesisStream } from '@cdktf/provider-aws/lib/kinesis-stream';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { ElasticacheReplicationGroup } from '@cdktf/provider-aws/lib/elasticache-replication-group';
import { ElasticacheSubnetGroup } from '@cdktf/provider-aws/lib/elasticache-subnet-group';
import { EfsFileSystem } from '@cdktf/provider-aws/lib/efs-file-system';
import { EfsMountTarget } from '@cdktf/provider-aws/lib/efs-mount-target';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { CloudwatchMetricAlarm } from '@cdktf/provider-aws/lib/cloudwatch-metric-alarm';
import { XrayGroup } from '@cdktf/provider-aws/lib/xray-group';
import { XraySamplingRule } from '@cdktf/provider-aws/lib/xray-sampling-rule';
import { AppautoscalingTarget } from '@cdktf/provider-aws/lib/appautoscaling-target';
import { AppautoscalingPolicy } from '@cdktf/provider-aws/lib/appautoscaling-policy';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

export interface ManufacturingStackProps {
  environmentSuffix: string;
  region: string;
}

export class ManufacturingStack extends Construct {
  public readonly vpcId: string;
  public readonly kinesisStreamName: string;
  public readonly ecsClusterName: string;

  constructor(scope: Construct, id: string, props: ManufacturingStackProps) {
    super(scope, id);

    const { environmentSuffix, region } = props;

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // ====================
    // 1. KMS - Encryption Key Management
    // ====================
    const kmsKey = new KmsKey(this, 'kms-key', {
      description: `Manufacturing pipeline encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      tags: {
        Name: `manufacturing-kms-key-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new KmsAlias(this, 'kms-alias', {
      name: `alias/manufacturing-${environmentSuffix}`,
      targetKeyId: kmsKey.id,
    });

    // ====================
    // 2. VPC - Network Isolation
    // ====================
    const vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `manufacturing-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.vpcId = vpc.id;

    // Internet Gateway for public subnets
    const igw = new InternetGateway(this, 'igw', {
      vpcId: vpc.id,
      tags: {
        Name: `manufacturing-igw-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Public Subnets (for API Gateway VPC endpoints, ECS tasks with public access)
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: Fn.element(azs.names, 0),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `manufacturing-public-subnet-1-${environmentSuffix}`,
        Environment: environmentSuffix,
        Tier: 'public',
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: Fn.element(azs.names, 1),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `manufacturing-public-subnet-2-${environmentSuffix}`,
        Environment: environmentSuffix,
        Tier: 'public',
      },
    });

    // Private Subnets (for RDS, ElastiCache, ECS tasks)
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: Fn.element(azs.names, 0),
      tags: {
        Name: `manufacturing-private-subnet-1-${environmentSuffix}`,
        Environment: environmentSuffix,
        Tier: 'private',
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.12.0/24',
      availabilityZone: Fn.element(azs.names, 1),
      tags: {
        Name: `manufacturing-private-subnet-2-${environmentSuffix}`,
        Environment: environmentSuffix,
        Tier: 'private',
      },
    });

    // Route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `manufacturing-public-rt-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: igw.id,
    });

    new RouteTableAssociation(this, 'public-rta-1', {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'public-rta-2', {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    });

    // ====================
    // 3. Security Groups
    // ====================
    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      name: `manufacturing-ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS Fargate tasks',
      vpcId: vpc.id,
      tags: {
        Name: `manufacturing-ecs-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // ECS can make outbound connections
    new SecurityGroupRule(this, 'ecs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSecurityGroup.id,
    });

    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `manufacturing-rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS Aurora',
      vpcId: vpc.id,
      tags: {
        Name: `manufacturing-rds-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Allow ECS to connect to RDS
    new SecurityGroupRule(this, 'rds-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: rdsSecurityGroup.id,
    });

    const redisSecurityGroup = new SecurityGroup(this, 'redis-sg', {
      name: `manufacturing-redis-sg-${environmentSuffix}`,
      description: 'Security group for ElastiCache Redis',
      vpcId: vpc.id,
      tags: {
        Name: `manufacturing-redis-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Allow ECS to connect to Redis
    new SecurityGroupRule(this, 'redis-ingress', {
      type: 'ingress',
      fromPort: 6379,
      toPort: 6379,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: redisSecurityGroup.id,
    });

    const efsSecurityGroup = new SecurityGroup(this, 'efs-sg', {
      name: `manufacturing-efs-sg-${environmentSuffix}`,
      description: 'Security group for EFS',
      vpcId: vpc.id,
      tags: {
        Name: `manufacturing-efs-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Allow ECS to connect to EFS
    new SecurityGroupRule(this, 'efs-ingress', {
      type: 'ingress',
      fromPort: 2049,
      toPort: 2049,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: efsSecurityGroup.id,
    });

    // ====================
    // 4. CloudWatch - Logging
    // ====================
    const ecsLogGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/aws/ecs/manufacturing-${environmentSuffix}`,
      retentionInDays: 365, // 1 year minimum for compliance
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `manufacturing-ecs-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const apiLogGroup = new CloudwatchLogGroup(this, 'api-log-group', {
      name: `/aws/apigateway/manufacturing-${environmentSuffix}`,
      retentionInDays: 365, // 1 year minimum for compliance
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `manufacturing-api-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // ====================
    // 5. X-Ray - Distributed Tracing
    // ====================
    new XrayGroup(this, 'xray-group', {
      groupName: `manufacturing-${environmentSuffix}`,
      filterExpression: 'service("manufacturing-api")',
      tags: {
        Name: `manufacturing-xray-group-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new XraySamplingRule(this, 'xray-sampling-rule', {
      ruleName: `manufacturing-${environmentSuffix}`,
      priority: 1000,
      version: 1,
      reservoirSize: 1,
      fixedRate: 0.05,
      urlPath: '*',
      host: '*',
      httpMethod: '*',
      serviceName: 'manufacturing-api',
      serviceType: '*',
      resourceArn: '*',
      tags: {
        Name: `manufacturing-xray-rule-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // ====================
    // 6. Kinesis Data Streams - Data Ingestion
    // ====================
    const kinesisStream = new KinesisStream(this, 'kinesis-stream', {
      name: `manufacturing-data-stream-${environmentSuffix}`,
      shardCount: 10, // 10 shards to handle 100k events/sec (10k per shard)
      retentionPeriod: 168, // 7 days retention
      encryptionType: 'KMS',
      kmsKeyId: kmsKey.id,
      shardLevelMetrics: [
        'IncomingBytes',
        'IncomingRecords',
        'OutgoingBytes',
        'OutgoingRecords',
        'WriteProvisionedThroughputExceeded',
        'ReadProvisionedThroughputExceeded',
        'IteratorAgeMilliseconds',
      ],
      tags: {
        Name: `manufacturing-data-stream-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.kinesisStreamName = kinesisStream.name;

    // ====================
    // 7. SecretsManager - Credential Management
    // ====================
    const dbPassword = new SecretsmanagerSecret(this, 'db-password', {
      name: `manufacturing-db-password-${environmentSuffix}`,
      description: 'RDS Aurora PostgreSQL password',
      kmsKeyId: kmsKey.id,
      recoveryWindowInDays: 7,
      tags: {
        Name: `manufacturing-db-password-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecretsmanagerSecretVersion(this, 'db-password-version', {
      secretId: dbPassword.id,
      secretString: JSON.stringify({
        username: 'dbadmin',
        password: `ManufacturingDB${environmentSuffix}${Math.random().toString(36).substring(2, 15)}`,
        engine: 'postgres',
        host: '', // Will be updated after RDS creation
        port: 5432,
        dbname: 'manufacturing',
      }),
    });

    // ====================
    // 8. RDS Aurora PostgreSQL - Storage Layer
    // ====================
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `manufacturing-db-subnet-group-${environmentSuffix}`,
      description: 'Subnet group for RDS Aurora',
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        Name: `manufacturing-db-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const auroraCluster = new RdsCluster(this, 'aurora-cluster', {
      clusterIdentifier: `manufacturing-aurora-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '15.3',
      databaseName: 'manufacturing',
      masterUsername: 'dbadmin',
      masterPassword: `ManufacturingDB${environmentSuffix}${Math.random().toString(36).substring(2, 15)}`,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      backupRetentionPeriod: 35, // AWS RDS maximum (35 days) - use AWS Backup for longer retention
      preferredBackupWindow: '03:00-04:00',
      preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
      enabledCloudwatchLogsExports: ['postgresql'],
      skipFinalSnapshot: true, // For destroyability
      deletionProtection: false, // For destroyability
      applyImmediately: true,
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 2,
      },
      tags: {
        Name: `manufacturing-aurora-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Aurora Serverless v2 instances
    new RdsClusterInstance(this, 'aurora-instance-1', {
      identifier: `manufacturing-aurora-1-${environmentSuffix}`,
      clusterIdentifier: auroraCluster.id,
      instanceClass: 'db.serverless',
      engine: 'aurora-postgresql',
      engineVersion: '15.3',
      publiclyAccessible: false,
      tags: {
        Name: `manufacturing-aurora-1-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new RdsClusterInstance(this, 'aurora-instance-2', {
      identifier: `manufacturing-aurora-2-${environmentSuffix}`,
      clusterIdentifier: auroraCluster.id,
      instanceClass: 'db.serverless',
      engine: 'aurora-postgresql',
      engineVersion: '15.3',
      publiclyAccessible: false,
      tags: {
        Name: `manufacturing-aurora-2-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // ====================
    // 9. ElastiCache Redis - Caching Layer
    // ====================
    const redisSubnetGroup = new ElasticacheSubnetGroup(
      this,
      'redis-subnet-group',
      {
        name: `manufacturing-redis-subnet-${environmentSuffix}`,
        description: 'Subnet group for ElastiCache Redis',
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        tags: {
          Name: `manufacturing-redis-subnet-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      }
    );

    const redisCluster = new ElasticacheReplicationGroup(
      this,
      'redis-cluster',
      {
        replicationGroupId: `manufacturing-redis-${environmentSuffix}`,
        description: 'Redis cluster for manufacturing analytics',
        engine: 'redis',
        engineVersion: '7.0',
        nodeType: 'cache.t3.micro',
        numCacheClusters: 2, // Multi-AZ with automatic failover
        port: 6379,
        parameterGroupName: 'default.redis7',
        subnetGroupName: redisSubnetGroup.name,
        securityGroupIds: [redisSecurityGroup.id],
        atRestEncryptionEnabled: 'true',
        transitEncryptionEnabled: true,
        transitEncryptionMode: 'preferred',
        kmsKeyId: kmsKey.arn,
        automaticFailoverEnabled: true,
        multiAzEnabled: true,
        snapshotRetentionLimit: 5,
        snapshotWindow: '03:00-05:00',
        maintenanceWindow: 'sun:05:00-sun:07:00',
        autoMinorVersionUpgrade: 'true',
        applyImmediately: true,
        tags: {
          Name: `manufacturing-redis-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      }
    );

    // ====================
    // 10. EFS - Shared File Storage
    // ====================
    const efsFileSystem = new EfsFileSystem(this, 'efs', {
      encrypted: true,
      kmsKeyId: kmsKey.id,
      performanceMode: 'generalPurpose',
      throughputMode: 'bursting',
      lifecyclePolicy: [
        {
          transitionToIa: 'AFTER_30_DAYS',
        },
      ],
      tags: {
        Name: `manufacturing-efs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Mount targets in private subnets
    new EfsMountTarget(this, 'efs-mount-1', {
      fileSystemId: efsFileSystem.id,
      subnetId: privateSubnet1.id,
      securityGroups: [efsSecurityGroup.id],
    });

    new EfsMountTarget(this, 'efs-mount-2', {
      fileSystemId: efsFileSystem.id,
      subnetId: privateSubnet2.id,
      securityGroups: [efsSecurityGroup.id],
    });

    // ====================
    // 11. IAM Roles for ECS
    // ====================
    const ecsTaskExecutionRole = new IamRole(this, 'ecs-task-execution-role', {
      name: `manufacturing-ecs-exec-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `manufacturing-ecs-exec-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'ecs-task-execution-policy', {
      role: ecsTaskExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    const ecsTaskRole = new IamRole(this, 'ecs-task-role', {
      name: `manufacturing-ecs-task-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'ecs-tasks.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `manufacturing-ecs-task-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Policy for ECS tasks to access Kinesis, Secrets, CloudWatch, X-Ray
    const ecsTaskPolicy = new IamPolicy(this, 'ecs-task-policy', {
      name: `manufacturing-ecs-task-policy-${environmentSuffix}`,
      description: 'Policy for ECS tasks to access AWS services',
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'kinesis:GetRecords',
              'kinesis:GetShardIterator',
              'kinesis:DescribeStream',
              'kinesis:ListShards',
              'kinesis:PutRecord',
              'kinesis:PutRecords',
            ],
            Resource: kinesisStream.arn,
          },
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue'],
            Resource: dbPassword.arn,
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:DescribeKey'],
            Resource: kmsKey.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              'logs:CreateLogStream',
              'logs:PutLogEvents',
              'logs:CreateLogGroup',
            ],
            Resource: `${ecsLogGroup.arn}:*`,
          },
          {
            Effect: 'Allow',
            Action: [
              'xray:PutTraceSegments',
              'xray:PutTelemetryRecords',
              'xray:GetSamplingRules',
              'xray:GetSamplingTargets',
            ],
            Resource: '*',
          },
          {
            Effect: 'Allow',
            Action: [
              'elasticfilesystem:ClientMount',
              'elasticfilesystem:ClientWrite',
              'elasticfilesystem:DescribeFileSystems',
            ],
            Resource: efsFileSystem.arn,
          },
        ],
      }),
      tags: {
        Name: `manufacturing-ecs-task-policy-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'ecs-task-policy-attachment', {
      role: ecsTaskRole.name,
      policyArn: ecsTaskPolicy.arn,
    });

    // ====================
    // 12. ECS Fargate - Processing Layer
    // ====================
    const ecsCluster = new EcsCluster(this, 'ecs-cluster', {
      name: `manufacturing-cluster-${environmentSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `manufacturing-cluster-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.ecsClusterName = ecsCluster.name;

    const taskDefinition = new EcsTaskDefinition(this, 'ecs-task-definition', {
      family: `manufacturing-processor-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '1024', // 1 vCPU
      memory: '2048', // 2GB
      executionRoleArn: ecsTaskExecutionRole.arn,
      taskRoleArn: ecsTaskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'processor',
          image: 'public.ecr.aws/docker/library/nginx:alpine', // Placeholder image
          essential: true,
          portMappings: [
            {
              containerPort: 80,
              protocol: 'tcp',
            },
          ],
          environment: [
            {
              name: 'KINESIS_STREAM_NAME',
              value: kinesisStream.name,
            },
            {
              name: 'DB_SECRET_ARN',
              value: dbPassword.arn,
            },
            {
              name: 'REDIS_ENDPOINT',
              value: redisCluster.configurationEndpointAddress,
            },
            {
              name: 'AWS_REGION',
              value: region,
            },
            {
              name: 'AWS_XRAY_DAEMON_ADDRESS',
              value: 'xray-daemon:2000',
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': ecsLogGroup.name,
              'awslogs-region': region,
              'awslogs-stream-prefix': 'processor',
            },
          },
        },
        {
          name: 'xray-daemon',
          image: 'public.ecr.aws/xray/aws-xray-daemon:latest',
          essential: false,
          cpu: 32,
          memoryReservation: 256,
          portMappings: [
            {
              containerPort: 2000,
              protocol: 'udp',
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': ecsLogGroup.name,
              'awslogs-region': region,
              'awslogs-stream-prefix': 'xray',
            },
          },
        },
      ]),
      volume: [
        {
          name: 'efs-storage',
          efsVolumeConfiguration: {
            fileSystemId: efsFileSystem.id,
            transitEncryption: 'ENABLED',
          },
        },
      ],
      tags: {
        Name: `manufacturing-task-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const ecsService = new EcsService(this, 'ecs-service', {
      name: `manufacturing-service-${environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: taskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      platformVersion: 'LATEST',
      enableExecuteCommand: true,
      enableEcsManagedTags: true,
      networkConfiguration: {
        subnets: [publicSubnet1.id, publicSubnet2.id],
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: true,
      },
      tags: {
        Name: `manufacturing-service-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // ====================
    // 13. Auto Scaling for ECS
    // ====================
    const scalingTarget = new AppautoscalingTarget(this, 'ecs-scaling-target', {
      maxCapacity: 20,
      minCapacity: 2,
      resourceId: `service/${ecsCluster.name}/${ecsService.name}`,
      scalableDimension: 'ecs:service:DesiredCount',
      serviceNamespace: 'ecs',
    });

    // Scale based on Kinesis iterator age (processing lag)
    new AppautoscalingPolicy(this, 'ecs-scaling-policy', {
      name: `manufacturing-scaling-${environmentSuffix}`,
      policyType: 'TargetTrackingScaling',
      resourceId: scalingTarget.resourceId,
      scalableDimension: scalingTarget.scalableDimension,
      serviceNamespace: scalingTarget.serviceNamespace,
      targetTrackingScalingPolicyConfiguration: {
        targetValue: 500, // Keep iterator age under 500ms
        customizedMetricSpecification: {
          metricName: 'IteratorAgeMilliseconds',
          namespace: 'AWS/Kinesis',
          statistic: 'Average',
          dimensions: [
            {
              name: 'StreamName',
              value: kinesisStream.name,
            },
          ],
        },
        scaleInCooldown: 300,
        scaleOutCooldown: 60,
      },
    });

    // ====================
    // 14. API Gateway - External Integrations
    // ====================
    const api = new ApiGatewayRestApi(this, 'api-gateway', {
      name: `manufacturing-api-${environmentSuffix}`,
      description: 'Manufacturing data pipeline API',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: {
        Name: `manufacturing-api-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const dataResource = new ApiGatewayResource(this, 'api-data-resource', {
      restApiId: api.id,
      parentId: api.rootResourceId,
      pathPart: 'data',
    });

    const dataMethod = new ApiGatewayMethod(this, 'api-data-method', {
      restApiId: api.id,
      resourceId: dataResource.id,
      httpMethod: 'POST',
      authorization: 'AWS_IAM',
    });

    new ApiGatewayIntegration(this, 'api-integration', {
      restApiId: api.id,
      resourceId: dataResource.id,
      httpMethod: dataMethod.httpMethod,
      integrationHttpMethod: 'POST',
      type: 'AWS',
      uri: `arn:aws:apigateway:${region}:kinesis:action/PutRecord`,
      credentials: ecsTaskRole.arn,
      requestTemplates: {
        'application/json': JSON.stringify({
          StreamName: kinesisStream.name,
          Data: '$util.base64Encode($input.json("$.data"))',
          PartitionKey: '$input.path("$.partitionKey")',
        }),
      },
    });

    const deployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: api.id,
      triggers: {
        redeployment: Date.now().toString(),
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
      dependsOn: [dataMethod],
    });

    new ApiGatewayStage(this, 'api-stage', {
      restApiId: api.id,
      stageName: environmentSuffix,
      deploymentId: deployment.id,
      xrayTracingEnabled: true,
      accessLogSettings: {
        destinationArn: apiLogGroup.arn,
        format: JSON.stringify({
          requestId: '$context.requestId',
          ip: '$context.identity.sourceIp',
          requestTime: '$context.requestTime',
          httpMethod: '$context.httpMethod',
          routeKey: '$context.routeKey',
          status: '$context.status',
          protocol: '$context.protocol',
          responseLength: '$context.responseLength',
        }),
      },
      tags: {
        Name: `manufacturing-api-stage-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // ====================
    // 15. CloudWatch Alarms
    // ====================
    new CloudwatchMetricAlarm(this, 'kinesis-iterator-age-alarm', {
      alarmName: `manufacturing-kinesis-iterator-age-${environmentSuffix}`,
      alarmDescription: 'Triggers when Kinesis processing falls behind',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'IteratorAgeMilliseconds',
      namespace: 'AWS/Kinesis',
      period: 60,
      statistic: 'Average',
      threshold: 600000, // 10 minutes
      dimensions: {
        StreamName: kinesisStream.name,
      },
      tags: {
        Name: `manufacturing-kinesis-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new CloudwatchMetricAlarm(this, 'ecs-cpu-alarm', {
      alarmName: `manufacturing-ecs-cpu-${environmentSuffix}`,
      alarmDescription: 'Triggers when ECS CPU is high',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/ECS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      dimensions: {
        ClusterName: ecsCluster.name,
        ServiceName: ecsService.name,
      },
      tags: {
        Name: `manufacturing-ecs-cpu-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new CloudwatchMetricAlarm(this, 'aurora-cpu-alarm', {
      alarmName: `manufacturing-aurora-cpu-${environmentSuffix}`,
      alarmDescription: 'Triggers when Aurora CPU is high',
      comparisonOperator: 'GreaterThanThreshold',
      evaluationPeriods: 2,
      metricName: 'CPUUtilization',
      namespace: 'AWS/RDS',
      period: 300,
      statistic: 'Average',
      threshold: 80,
      dimensions: {
        DBClusterIdentifier: auroraCluster.clusterIdentifier,
      },
      tags: {
        Name: `manufacturing-aurora-cpu-alarm-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // ====================
    // 16. Outputs
    // ====================
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'kinesis-stream-name', {
      value: kinesisStream.name,
      description: 'Kinesis stream name',
    });

    new TerraformOutput(this, 'ecs-cluster-name', {
      value: ecsCluster.name,
      description: 'ECS cluster name',
    });

    new TerraformOutput(this, 'aurora-endpoint', {
      value: auroraCluster.endpoint,
      description: 'Aurora cluster endpoint',
    });

    new TerraformOutput(this, 'redis-endpoint', {
      value: redisCluster.configurationEndpointAddress,
      description: 'Redis configuration endpoint',
    });

    new TerraformOutput(this, 'efs-id', {
      value: efsFileSystem.id,
      description: 'EFS file system ID',
    });

    new TerraformOutput(this, 'api-gateway-url', {
      value: `https://${api.id}.execute-api.${region}.amazonaws.com/${environmentSuffix}`,
      description: 'API Gateway endpoint URL',
    });

    new TerraformOutput(this, 'db-secret-arn', {
      value: dbPassword.arn,
      description: 'Database credentials secret ARN',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsKey.id,
      description: 'KMS key ID',
    });
  }
}
