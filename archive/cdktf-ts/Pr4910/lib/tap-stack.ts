import { DataArchiveFile } from '@cdktf/provider-archive/lib/data-archive-file';
import { ArchiveProvider } from '@cdktf/provider-archive/lib/provider';
import { ApiGatewayDeployment } from '@cdktf/provider-aws/lib/api-gateway-deployment';
import { ApiGatewayIntegration } from '@cdktf/provider-aws/lib/api-gateway-integration';
import { ApiGatewayMethod } from '@cdktf/provider-aws/lib/api-gateway-method';
import { ApiGatewayResource } from '@cdktf/provider-aws/lib/api-gateway-resource';
import { ApiGatewayRestApi } from '@cdktf/provider-aws/lib/api-gateway-rest-api';
import { ApiGatewayStage } from '@cdktf/provider-aws/lib/api-gateway-stage';
import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { EcsCluster } from '@cdktf/provider-aws/lib/ecs-cluster';
import { EcsService } from '@cdktf/provider-aws/lib/ecs-service';
import { EcsTaskDefinition } from '@cdktf/provider-aws/lib/ecs-task-definition';
import { EfsFileSystem } from '@cdktf/provider-aws/lib/efs-file-system';
import { EfsMountTarget } from '@cdktf/provider-aws/lib/efs-mount-target';
import { ElasticacheReplicationGroup } from '@cdktf/provider-aws/lib/elasticache-replication-group';
import { ElasticacheSubnetGroup } from '@cdktf/provider-aws/lib/elasticache-subnet-group';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { KinesisStream } from '@cdktf/provider-aws/lib/kinesis-stream';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { LambdaFunction } from '@cdktf/provider-aws/lib/lambda-function';
import { LambdaPermission } from '@cdktf/provider-aws/lib/lambda-permission';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { RdsCluster } from '@cdktf/provider-aws/lib/rds-cluster';
import { RdsClusterInstance } from '@cdktf/provider-aws/lib/rds-cluster-instance';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretRotation } from '@cdktf/provider-aws/lib/secretsmanager-secret-rotation';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface TapStackProps {
  environmentSuffix?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    // Add timestamp to PR environments to avoid resource conflicts
    const baseSuffix = props?.environmentSuffix || 'dev';
    const environmentSuffix = baseSuffix.startsWith('pr')
      ? `${baseSuffix}-${Date.now().toString().slice(-6)}`
      : baseSuffix;
    // Force region to us-east-1 for consistent CI/CD deployment
    const awsRegion = 'us-east-1';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure Archive Provider
    new ArchiveProvider(this, 'archive');

    // Create VPC for the infrastructure
    const vpc = new Vpc(this, 'edu-vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `edu-vpc-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, 'edu-igw', {
      vpcId: vpc.id,
      tags: {
        Name: `edu-igw-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create Public Subnets in multiple AZs
    const publicSubnet1 = new Subnet(this, 'public-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `${awsRegion}a`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `edu-public-subnet-1-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const publicSubnet2 = new Subnet(this, 'public-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `${awsRegion}c`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `edu-public-subnet-2-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create Private Subnets
    const privateSubnet1 = new Subnet(this, 'private-subnet-1', {
      vpcId: vpc.id,
      cidrBlock: '10.0.11.0/24',
      availabilityZone: `${awsRegion}a`,
      tags: {
        Name: `edu-private-subnet-1-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const privateSubnet2 = new Subnet(this, 'private-subnet-2', {
      vpcId: vpc.id,
      cidrBlock: '10.0.12.0/24',
      availabilityZone: `${awsRegion}c`,
      tags: {
        Name: `edu-private-subnet-2-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Create Route Table for Public Subnets
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: vpc.id,
      tags: {
        Name: `edu-public-rt-${environmentSuffix}`,
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

    // Create KMS Keys for encryption
    const kmsKey = new KmsKey(this, 'edu-kms-key', {
      description: `EduTech encryption key for ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 10,
      tags: {
        Name: `edu-kms-key-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new KmsAlias(this, 'edu-kms-alias', {
      name: `alias/edutech-${environmentSuffix}`,
      targetKeyId: kmsKey.keyId,
    });

    // Security Groups
    const albSecurityGroup = new SecurityGroup(this, 'alb-sg', {
      name: `edu-alb-sg-${environmentSuffix}`,
      description: 'Security group for Application Load Balancer',
      vpcId: vpc.id,
      tags: {
        Name: `edu-alb-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecurityGroupRule(this, 'alb-ingress-http', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'alb-ingress-https', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'alb-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: albSecurityGroup.id,
    });

    const ecsSecurityGroup = new SecurityGroup(this, 'ecs-sg', {
      name: `edu-ecs-sg-${environmentSuffix}`,
      description: 'Security group for ECS tasks',
      vpcId: vpc.id,
      tags: {
        Name: `edu-ecs-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecurityGroupRule(this, 'ecs-ingress-alb', {
      type: 'ingress',
      fromPort: 8080,
      toPort: 8080,
      protocol: 'tcp',
      sourceSecurityGroupId: albSecurityGroup.id,
      securityGroupId: ecsSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'ecs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: ecsSecurityGroup.id,
    });

    const rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `edu-rds-sg-${environmentSuffix}`,
      description: 'Security group for RDS Aurora PostgreSQL',
      vpcId: vpc.id,
      tags: {
        Name: `edu-rds-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecurityGroupRule(this, 'rds-ingress-ecs', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: rdsSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'rds-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: rdsSecurityGroup.id,
    });

    const redisSecurityGroup = new SecurityGroup(this, 'redis-sg', {
      name: `edu-redis-sg-${environmentSuffix}`,
      description: 'Security group for ElastiCache Redis',
      vpcId: vpc.id,
      tags: {
        Name: `edu-redis-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecurityGroupRule(this, 'redis-ingress-ecs', {
      type: 'ingress',
      fromPort: 6379,
      toPort: 6379,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: redisSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'redis-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: redisSecurityGroup.id,
    });

    const efsSecurityGroup = new SecurityGroup(this, 'efs-sg', {
      name: `edu-efs-sg-${environmentSuffix}`,
      description: 'Security group for EFS',
      vpcId: vpc.id,
      tags: {
        Name: `edu-efs-sg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecurityGroupRule(this, 'efs-ingress-ecs', {
      type: 'ingress',
      fromPort: 2049,
      toPort: 2049,
      protocol: 'tcp',
      sourceSecurityGroupId: ecsSecurityGroup.id,
      securityGroupId: efsSecurityGroup.id,
    });

    new SecurityGroupRule(this, 'efs-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: efsSecurityGroup.id,
    });

    // 1. Kinesis Data Stream for data ingestion
    const kinesisStream = new KinesisStream(this, 'analytics-stream', {
      name: `edu-analytics-stream-${environmentSuffix}`,
      shardCount: 2,
      retentionPeriod: 24,
      encryptionType: 'KMS',
      kmsKeyId: kmsKey.arn,
      shardLevelMetrics: [
        'IncomingBytes',
        'IncomingRecords',
        'OutgoingBytes',
        'OutgoingRecords',
      ],
      tags: {
        Name: `edu-analytics-stream-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // 2. ElastiCache Redis for caching layer
    const redisSubnetGroup = new ElasticacheSubnetGroup(
      this,
      'redis-subnet-group',
      {
        name: `edu-redis-subnet-group-${environmentSuffix}`,
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        description: 'Subnet group for Redis cluster',
      }
    );

    const redisCluster = new ElasticacheReplicationGroup(
      this,
      'redis-cluster',
      {
        replicationGroupId: `edu-redis-${environmentSuffix}`,
        description: 'Redis cluster for student analytics caching',
        engine: 'redis',
        engineVersion: '7.1',
        nodeType: 'cache.t4g.micro',
        numCacheClusters: 2,
        automaticFailoverEnabled: true,
        multiAzEnabled: true,
        atRestEncryptionEnabled: 'true',
        transitEncryptionEnabled: true,
        kmsKeyId: kmsKey.arn,
        subnetGroupName: redisSubnetGroup.name,
        securityGroupIds: [redisSecurityGroup.id],
        snapshotRetentionLimit: 1,
        snapshotWindow: '03:00-05:00',
        maintenanceWindow: 'sun:05:00-sun:07:00',
        tags: {
          Name: `edu-redis-${environmentSuffix}`,
          Environment: environmentSuffix,
        },
      }
    );

    // 3. RDS Aurora PostgreSQL Serverless v2 for persistent storage
    const dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `edu-db-subnet-group-${environmentSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      description: 'Subnet group for Aurora PostgreSQL',
      tags: {
        Name: `edu-db-subnet-group-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const auroraCluster = new RdsCluster(this, 'aurora-cluster', {
      clusterIdentifier: `edu-aurora-${environmentSuffix}`,
      engine: 'aurora-postgresql',
      engineMode: 'provisioned',
      engineVersion: '16.2',
      databaseName: 'eduanalytics',
      masterUsername: 'dbadmin',
      masterPassword: `TempPassword123!-${environmentSuffix}`,
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      backupRetentionPeriod: 1,
      preferredBackupWindow: '02:00-03:00',
      preferredMaintenanceWindow: 'sun:03:00-sun:04:00',
      enabledCloudwatchLogsExports: ['postgresql'],
      skipFinalSnapshot: true,
      serverlessv2ScalingConfiguration: {
        minCapacity: 0.5,
        maxCapacity: 2,
      },
      tags: {
        Name: `edu-aurora-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new RdsClusterInstance(this, 'aurora-instance-1', {
      identifier: `edu-aurora-instance-1-${environmentSuffix}`,
      clusterIdentifier: auroraCluster.id,
      instanceClass: 'db.serverless',
      engine: auroraCluster.engine,
      engineVersion: auroraCluster.engineVersion,
      publiclyAccessible: false,
      tags: {
        Name: `edu-aurora-instance-1-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // 4. EFS for shared storage across ECS tasks
    const efsFileSystem = new EfsFileSystem(this, 'efs-storage', {
      encrypted: true,
      kmsKeyId: kmsKey.arn,
      performanceMode: 'generalPurpose',
      throughputMode: 'bursting',
      lifecyclePolicy: [
        {
          transitionToIa: 'AFTER_30_DAYS',
        },
      ],
      tags: {
        Name: `edu-efs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

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

    // 5. Secrets Manager for credential management
    const dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: `edu-db-credentials-${environmentSuffix}`,
      description: 'Database credentials for Aurora PostgreSQL',
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `edu-db-credentials-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecretsmanagerSecretVersion(this, 'db-secret-version', {
      secretId: dbSecret.id,
      secretString: JSON.stringify({
        username: 'dbadmin',
        password: `TempPassword123!-${environmentSuffix}`,
        engine: 'postgres',
        host: auroraCluster.endpoint,
        port: 5432,
        dbname: 'eduanalytics',
      }),
    });

    const redisSecret = new SecretsmanagerSecret(this, 'redis-secret', {
      name: `edu-redis-config-${environmentSuffix}`,
      description: 'Redis configuration and credentials',
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `edu-redis-config-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new SecretsmanagerSecretVersion(this, 'redis-secret-version', {
      secretId: redisSecret.id,
      secretString: JSON.stringify({
        host: redisCluster.primaryEndpointAddress,
        port: 6379,
        tls: true,
      }),
    });

    // Lambda function for secret rotation
    const rotationLambdaRole = new IamRole(this, 'rotation-lambda-role', {
      name: `edu-rotation-lambda-role-${environmentSuffix}`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: {
              Service: 'lambda.amazonaws.com',
            },
            Action: 'sts:AssumeRole',
          },
        ],
      }),
      tags: {
        Name: `edu-rotation-lambda-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'rotation-lambda-basic', {
      role: rotationLambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
    });

    new IamRolePolicyAttachment(this, 'rotation-lambda-vpc', {
      role: rotationLambdaRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
    });

    // Create a simple Lambda function with inline code
    const rotationLambdaZip = new DataArchiveFile(this, 'rotation-lambda-zip', {
      type: 'zip',
      source: [
        {
          content: `
def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'body': 'Secret rotation handler'
    }
`,
          filename: 'lambda_function.py',
        },
      ],
      outputPath: 'rotation-lambda.zip',
    });

    const rotationLambda = new LambdaFunction(this, 'rotation-lambda', {
      functionName: `edu-secret-rotation-${environmentSuffix}`,
      runtime: 'python3.11',
      handler: 'lambda_function.lambda_handler',
      role: rotationLambdaRole.arn,
      timeout: 30,
      vpcConfig: {
        subnetIds: [privateSubnet1.id, privateSubnet2.id],
        securityGroupIds: [ecsSecurityGroup.id],
      },
      environment: {
        variables: {
          SECRETS_MANAGER_ENDPOINT: `https://secretsmanager.${awsRegion}.amazonaws.com`,
        },
      },
      filename: rotationLambdaZip.outputPath,
      sourceCodeHash: rotationLambdaZip.outputBase64Sha256,
      tags: {
        Name: `edu-secret-rotation-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new LambdaPermission(this, 'rotation-lambda-permission', {
      statementId: 'AllowSecretsManagerInvoke',
      action: 'lambda:InvokeFunction',
      functionName: rotationLambda.functionName,
      principal: 'secretsmanager.amazonaws.com',
    });

    new SecretsmanagerSecretRotation(this, 'db-secret-rotation', {
      secretId: dbSecret.id,
      rotationLambdaArn: rotationLambda.arn,
      rotationRules: {
        automaticallyAfterDays: 30,
      },
    });

    // 6. ECS Fargate cluster for processing
    const ecsCluster = new EcsCluster(this, 'ecs-cluster', {
      name: `edu-ecs-cluster-${environmentSuffix}`,
      setting: [
        {
          name: 'containerInsights',
          value: 'enabled',
        },
      ],
      tags: {
        Name: `edu-ecs-cluster-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // CloudWatch Log Groups
    const ecsLogGroup = new CloudwatchLogGroup(this, 'ecs-log-group', {
      name: `/ecs/edu-analytics-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `edu-ecs-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // IAM Role for ECS Task Execution
    const ecsExecutionRole = new IamRole(this, 'ecs-execution-role', {
      name: `edu-ecs-execution-role-${environmentSuffix}`,
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
        Name: `edu-ecs-execution-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new IamRolePolicyAttachment(this, 'ecs-execution-policy', {
      role: ecsExecutionRole.name,
      policyArn:
        'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
    });

    const ecsSecretPolicy = new IamPolicy(this, 'ecs-secret-policy', {
      name: `edu-ecs-secret-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['secretsmanager:GetSecretValue', 'kms:Decrypt'],
            Resource: [dbSecret.arn, redisSecret.arn, kmsKey.arn],
          },
        ],
      }),
    });

    new IamRolePolicyAttachment(this, 'ecs-execution-secret-policy', {
      role: ecsExecutionRole.name,
      policyArn: ecsSecretPolicy.arn,
    });

    // IAM Role for ECS Task
    const ecsTaskRole = new IamRole(this, 'ecs-task-role', {
      name: `edu-ecs-task-role-${environmentSuffix}`,
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
        Name: `edu-ecs-task-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const ecsTaskPolicy = new IamPolicy(this, 'ecs-task-policy', {
      name: `edu-ecs-task-policy-${environmentSuffix}`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'kinesis:DescribeStream',
              'kinesis:GetRecords',
              'kinesis:GetShardIterator',
              'kinesis:ListShards',
              'kinesis:PutRecord',
              'kinesis:PutRecords',
            ],
            Resource: kinesisStream.arn,
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
    });

    new IamRolePolicyAttachment(this, 'ecs-task-policy-attach', {
      role: ecsTaskRole.name,
      policyArn: ecsTaskPolicy.arn,
    });

    // ECS Task Definition
    const ecsTaskDefinition = new EcsTaskDefinition(this, 'ecs-task-def', {
      family: `edu-analytics-task-${environmentSuffix}`,
      networkMode: 'awsvpc',
      requiresCompatibilities: ['FARGATE'],
      cpu: '512',
      memory: '1024',
      executionRoleArn: ecsExecutionRole.arn,
      taskRoleArn: ecsTaskRole.arn,
      containerDefinitions: JSON.stringify([
        {
          name: 'analytics-processor',
          image: 'nginx:latest',
          essential: true,
          portMappings: [
            {
              containerPort: 8080,
              protocol: 'tcp',
            },
          ],
          environment: [
            {
              name: 'AWS_REGION',
              value: awsRegion,
            },
            {
              name: 'KINESIS_STREAM_NAME',
              value: kinesisStream.name,
            },
            {
              name: 'ENVIRONMENT',
              value: environmentSuffix,
            },
          ],
          secrets: [
            {
              name: 'DB_CONFIG',
              valueFrom: dbSecret.arn,
            },
            {
              name: 'REDIS_CONFIG',
              valueFrom: redisSecret.arn,
            },
          ],
          logConfiguration: {
            logDriver: 'awslogs',
            options: {
              'awslogs-group': ecsLogGroup.name,
              'awslogs-region': awsRegion,
              'awslogs-stream-prefix': 'ecs',
            },
          },
          mountPoints: [
            {
              sourceVolume: 'efs-storage',
              containerPath: '/mnt/efs',
              readOnly: false,
            },
          ],
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
        Name: `edu-ecs-task-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Application Load Balancer
    const alb = new Lb(this, 'ecs-alb', {
      name: `edu-alb-${environmentSuffix}`,
      internal: false,
      loadBalancerType: 'application',
      securityGroups: [albSecurityGroup.id],
      subnets: [publicSubnet1.id, publicSubnet2.id],
      enableDeletionProtection: false,
      tags: {
        Name: `edu-alb-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const targetGroup = new LbTargetGroup(this, 'ecs-target-group', {
      name: `edu-tg-v2-${environmentSuffix}`,
      port: 80,
      protocol: 'HTTP',
      vpcId: vpc.id,
      targetType: 'ip',
      healthCheck: {
        enabled: true,
        path: '/',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 3,
        timeout: 5,
        interval: 30,
      },
      deregistrationDelay: '30',
      tags: {
        Name: `edu-tg-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    new LbListener(this, 'alb-listener', {
      loadBalancerArn: alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: targetGroup.arn,
        },
      ],
      tags: {
        Name: `edu-alb-listener-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // ECS Service
    new EcsService(this, 'ecs-service', {
      name: `edu-analytics-service-${environmentSuffix}`,
      cluster: ecsCluster.id,
      taskDefinition: ecsTaskDefinition.arn,
      desiredCount: 2,
      launchType: 'FARGATE',
      platformVersion: 'LATEST',
      networkConfiguration: {
        subnets: [privateSubnet1.id, privateSubnet2.id],
        securityGroups: [ecsSecurityGroup.id],
        assignPublicIp: false,
      },
      loadBalancer: [
        {
          targetGroupArn: targetGroup.arn,
          containerName: 'analytics-processor',
          containerPort: 8080,
        },
      ],
      healthCheckGracePeriodSeconds: 60,
      enableExecuteCommand: true,
      tags: {
        Name: `edu-ecs-service-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // 7. API Gateway for RESTful access
    const apiGateway = new ApiGatewayRestApi(this, 'analytics-api', {
      name: `edu-analytics-api-${environmentSuffix}`,
      description: 'API Gateway for student analytics platform',
      endpointConfiguration: {
        types: ['REGIONAL'],
      },
      tags: {
        Name: `edu-analytics-api-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    const apiLogGroup = new CloudwatchLogGroup(this, 'api-log-group', {
      name: `/aws/apigateway/edu-analytics-${environmentSuffix}`,
      retentionInDays: 7,
      tags: {
        Name: `edu-api-logs-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // API Resources and Methods
    const metricsResource = new ApiGatewayResource(this, 'metrics-resource', {
      restApiId: apiGateway.id,
      parentId: apiGateway.rootResourceId,
      pathPart: 'metrics',
    });

    const metricsMethod = new ApiGatewayMethod(this, 'metrics-method', {
      restApiId: apiGateway.id,
      resourceId: metricsResource.id,
      httpMethod: 'GET',
      authorization: 'NONE',
    });

    const metricsIntegration = new ApiGatewayIntegration(
      this,
      'metrics-integration',
      {
        restApiId: apiGateway.id,
        resourceId: metricsResource.id,
        httpMethod: metricsMethod.httpMethod,
        type: 'HTTP_PROXY',
        integrationHttpMethod: 'GET',
        uri: `http://${alb.dnsName}/metrics`,
        connectionType: 'INTERNET',
      }
    );

    const studentsResource = new ApiGatewayResource(this, 'students-resource', {
      restApiId: apiGateway.id,
      parentId: apiGateway.rootResourceId,
      pathPart: 'students',
    });

    const studentsMethod = new ApiGatewayMethod(this, 'students-method', {
      restApiId: apiGateway.id,
      resourceId: studentsResource.id,
      httpMethod: 'POST',
      authorization: 'NONE',
    });

    const studentsIntegration = new ApiGatewayIntegration(
      this,
      'students-integration',
      {
        restApiId: apiGateway.id,
        resourceId: studentsResource.id,
        httpMethod: studentsMethod.httpMethod,
        type: 'HTTP_PROXY',
        integrationHttpMethod: 'POST',
        uri: `http://${alb.dnsName}/students`,
        connectionType: 'INTERNET',
      }
    );

    // API Deployment and Stage
    const apiDeployment = new ApiGatewayDeployment(this, 'api-deployment', {
      restApiId: apiGateway.id,
      triggers: {
        redeployment: Date.now().toString(),
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
      dependsOn: [
        metricsMethod,
        studentsMethod,
        metricsIntegration,
        studentsIntegration,
      ],
    });

    new ApiGatewayStage(this, 'api-stage', {
      deploymentId: apiDeployment.id,
      restApiId: apiGateway.id,
      stageName: environmentSuffix,
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
      xrayTracingEnabled: true,
      tags: {
        Name: `edu-api-stage-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });
  }
}
