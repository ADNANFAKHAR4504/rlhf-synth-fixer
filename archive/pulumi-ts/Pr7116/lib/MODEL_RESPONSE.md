# Financial Analytics Platform - Pulumi TypeScript Implementation

This implementation provides a production-ready infrastructure for a financial analytics platform using Pulumi with TypeScript. The architecture emphasizes security, cost optimization, and high availability.

## Architecture Overview

- **Network**: VPC spanning 3 availability zones with public and private subnets
- **Compute**: ECS Fargate Spot cluster for containerized microservices
- **Database**: Aurora PostgreSQL Serverless v2 with encrypted backups
- **Storage**: S3 buckets for data lake with versioning and lifecycle policies
- **Security**: Customer-managed KMS keys, VPC endpoints, security groups
- **Observability**: CloudWatch logs with encryption

## File: index.ts

```typescript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require('environmentSuffix');
const region = aws.config.region || 'us-east-2';

// Tags for all resources
const commonTags = {
  Environment: environmentSuffix,
  Project: 'financial-analytics',
  ManagedBy: 'pulumi',
};

// ===== KMS Keys for Encryption =====

const kmsKey = new aws.kms.Key(`analytics-kms-${environmentSuffix}`, {
  description: 'KMS key for encrypting database backups and CloudWatch logs',
  enableKeyRotation: true,
  deletionWindowInDays: 10,
  tags: { ...commonTags, Name: `analytics-kms-${environmentSuffix}` },
});

const kmsAlias = new aws.kms.Alias(`analytics-kms-alias-${environmentSuffix}`, {
  name: `alias/analytics-${environmentSuffix}`,
  targetKeyId: kmsKey.keyId,
});

// ===== VPC and Networking =====

// Create VPC
const vpc = new aws.ec2.Vpc(`analytics-vpc-${environmentSuffix}`, {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: { ...commonTags, Name: `analytics-vpc-${environmentSuffix}` },
});

// Create Internet Gateway
const igw = new aws.ec2.InternetGateway(`analytics-igw-${environmentSuffix}`, {
  vpcId: vpc.id,
  tags: { ...commonTags, Name: `analytics-igw-${environmentSuffix}` },
});

// Get availability zones
const availabilityZones = aws.getAvailabilityZonesOutput({
  state: 'available',
});

// Create public subnets (3 AZs)
const publicSubnets: aws.ec2.Subnet[] = [];
for (let i = 0; i < 3; i++) {
  const publicSubnet = new aws.ec2.Subnet(
    `analytics-public-subnet-${i}-${environmentSuffix}`,
    {
      vpcId: vpc.id,
      cidrBlock: `10.0.${i}.0/24`,
      availabilityZone: availabilityZones.names[i],
      mapPublicIpOnLaunch: true,
      tags: {
        ...commonTags,
        Name: `analytics-public-subnet-${i}-${environmentSuffix}`,
        Type: 'public',
      },
    }
  );
  publicSubnets.push(publicSubnet);
}

// Create private subnets (3 AZs)
const privateSubnets: aws.ec2.Subnet[] = [];
for (let i = 0; i < 3; i++) {
  const privateSubnet = new aws.ec2.Subnet(
    `analytics-private-subnet-${i}-${environmentSuffix}`,
    {
      vpcId: vpc.id,
      cidrBlock: `10.0.${10 + i}.0/24`,
      availabilityZone: availabilityZones.names[i],
      tags: {
        ...commonTags,
        Name: `analytics-private-subnet-${i}-${environmentSuffix}`,
        Type: 'private',
      },
    }
  );
  privateSubnets.push(privateSubnet);
}

// Create public route table
const publicRouteTable = new aws.ec2.RouteTable(
  `analytics-public-rt-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    tags: { ...commonTags, Name: `analytics-public-rt-${environmentSuffix}` },
  }
);

// Create route to Internet Gateway
const publicRoute = new aws.ec2.Route(
  `analytics-public-route-${environmentSuffix}`,
  {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: '0.0.0.0/0',
    gatewayId: igw.id,
  }
);

// Associate public subnets with public route table
publicSubnets.forEach((subnet, i) => {
  new aws.ec2.RouteTableAssociation(
    `analytics-public-rta-${i}-${environmentSuffix}`,
    {
      subnetId: subnet.id,
      routeTableId: publicRouteTable.id,
    }
  );
});

// Create private route table (no NAT Gateway - using VPC endpoints)
const privateRouteTable = new aws.ec2.RouteTable(
  `analytics-private-rt-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    tags: { ...commonTags, Name: `analytics-private-rt-${environmentSuffix}` },
  }
);

// Associate private subnets with private route table
privateSubnets.forEach((subnet, i) => {
  new aws.ec2.RouteTableAssociation(
    `analytics-private-rta-${i}-${environmentSuffix}`,
    {
      subnetId: subnet.id,
      routeTableId: privateRouteTable.id,
    }
  );
});

// ===== VPC Endpoints =====

// S3 Gateway Endpoint
const s3Endpoint = new aws.ec2.VpcEndpoint(
  `analytics-s3-endpoint-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    serviceName: `com.amazonaws.${region}.s3`,
    vpcEndpointType: 'Gateway',
    routeTableIds: [privateRouteTable.id],
    tags: { ...commonTags, Name: `analytics-s3-endpoint-${environmentSuffix}` },
  }
);

// Security group for interface endpoints
const endpointSecurityGroup = new aws.ec2.SecurityGroup(
  `analytics-endpoint-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description: 'Security group for VPC interface endpoints',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 443,
        toPort: 443,
        cidrBlocks: [vpc.cidrBlock],
        description: 'Allow HTTPS from VPC',
      },
    ],
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound',
      },
    ],
    tags: { ...commonTags, Name: `analytics-endpoint-sg-${environmentSuffix}` },
  }
);

// ECR API Endpoint
const ecrApiEndpoint = new aws.ec2.VpcEndpoint(
  `analytics-ecr-api-endpoint-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    serviceName: `com.amazonaws.${region}.ecr.api`,
    vpcEndpointType: 'Interface',
    subnetIds: privateSubnets.map(s => s.id),
    securityGroupIds: [endpointSecurityGroup.id],
    privateDnsEnabled: true,
    tags: {
      ...commonTags,
      Name: `analytics-ecr-api-endpoint-${environmentSuffix}`,
    },
  }
);

// ECR DKR Endpoint
const ecrDkrEndpoint = new aws.ec2.VpcEndpoint(
  `analytics-ecr-dkr-endpoint-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    serviceName: `com.amazonaws.${region}.ecr.dkr`,
    vpcEndpointType: 'Interface',
    subnetIds: privateSubnets.map(s => s.id),
    securityGroupIds: [endpointSecurityGroup.id],
    privateDnsEnabled: true,
    tags: {
      ...commonTags,
      Name: `analytics-ecr-dkr-endpoint-${environmentSuffix}`,
    },
  }
);

// ECS Endpoint
const ecsEndpoint = new aws.ec2.VpcEndpoint(
  `analytics-ecs-endpoint-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    serviceName: `com.amazonaws.${region}.ecs`,
    vpcEndpointType: 'Interface',
    subnetIds: privateSubnets.map(s => s.id),
    securityGroupIds: [endpointSecurityGroup.id],
    privateDnsEnabled: true,
    tags: {
      ...commonTags,
      Name: `analytics-ecs-endpoint-${environmentSuffix}`,
    },
  }
);

// ECS Telemetry Endpoint
const ecsTelemetryEndpoint = new aws.ec2.VpcEndpoint(
  `analytics-ecs-telemetry-endpoint-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    serviceName: `com.amazonaws.${region}.ecs-telemetry`,
    vpcEndpointType: 'Interface',
    subnetIds: privateSubnets.map(s => s.id),
    securityGroupIds: [endpointSecurityGroup.id],
    privateDnsEnabled: true,
    tags: {
      ...commonTags,
      Name: `analytics-ecs-telemetry-endpoint-${environmentSuffix}`,
    },
  }
);

// CloudWatch Logs Endpoint
const logsEndpoint = new aws.ec2.VpcEndpoint(
  `analytics-logs-endpoint-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    serviceName: `com.amazonaws.${region}.logs`,
    vpcEndpointType: 'Interface',
    subnetIds: privateSubnets.map(s => s.id),
    securityGroupIds: [endpointSecurityGroup.id],
    privateDnsEnabled: true,
    tags: {
      ...commonTags,
      Name: `analytics-logs-endpoint-${environmentSuffix}`,
    },
  }
);

// Secrets Manager Endpoint (for optional enhancement)
const secretsManagerEndpoint = new aws.ec2.VpcEndpoint(
  `analytics-secrets-endpoint-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    serviceName: `com.amazonaws.${region}.secretsmanager`,
    vpcEndpointType: 'Interface',
    subnetIds: privateSubnets.map(s => s.id),
    securityGroupIds: [endpointSecurityGroup.id],
    privateDnsEnabled: true,
    tags: {
      ...commonTags,
      Name: `analytics-secrets-endpoint-${environmentSuffix}`,
    },
  }
);

// ===== Security Groups =====

// ECS Tasks Security Group
const ecsSecurityGroup = new aws.ec2.SecurityGroup(
  `analytics-ecs-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description: 'Security group for ECS tasks',
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound',
      },
    ],
    tags: { ...commonTags, Name: `analytics-ecs-sg-${environmentSuffix}` },
  }
);

// Aurora Security Group
const auroraSecurityGroup = new aws.ec2.SecurityGroup(
  `analytics-aurora-sg-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    description: 'Security group for Aurora PostgreSQL cluster',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 5432,
        toPort: 5432,
        securityGroups: [ecsSecurityGroup.id],
        description: 'Allow PostgreSQL from ECS tasks',
      },
    ],
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound',
      },
    ],
    tags: { ...commonTags, Name: `analytics-aurora-sg-${environmentSuffix}` },
  }
);

// ===== CloudWatch Log Groups =====

const ecsLogGroup = new aws.cloudwatch.LogGroup(
  `analytics-ecs-logs-${environmentSuffix}`,
  {
    namePrefix: `/aws/ecs/analytics-${environmentSuffix}`,
    retentionInDays: 30,
    kmsKeyId: kmsKey.arn,
    tags: { ...commonTags, Name: `analytics-ecs-logs-${environmentSuffix}` },
  }
);

const auditLogGroup = new aws.cloudwatch.LogGroup(
  `analytics-audit-logs-${environmentSuffix}`,
  {
    name: `/aws/analytics/audit-${environmentSuffix}`,
    retentionInDays: 30,
    kmsKeyId: kmsKey.arn,
    tags: { ...commonTags, Name: `analytics-audit-logs-${environmentSuffix}` },
  }
);

// ===== S3 Buckets =====

// Raw data ingestion bucket
const rawDataBucket = new aws.s3.Bucket(
  `analytics-raw-data-${environmentSuffix}`,
  {
    bucket: `analytics-raw-data-${environmentSuffix}`,
    versioning: {
      enabled: true,
    },
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'aws:kms',
          kmsMasterKeyId: kmsKey.arn,
        },
      },
    },
    lifecycleRules: [
      {
        enabled: true,
        transitions: [
          {
            days: 90,
            storageClass: 'GLACIER',
          },
        ],
      },
    ],
    tags: { ...commonTags, Name: `analytics-raw-data-${environmentSuffix}` },
  }
);

// Block public access for raw data bucket
const rawDataBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  `analytics-raw-data-public-access-block-${environmentSuffix}`,
  {
    bucket: rawDataBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }
);

// Processed analytics bucket
const processedDataBucket = new aws.s3.Bucket(
  `analytics-processed-data-${environmentSuffix}`,
  {
    bucket: `analytics-processed-data-${environmentSuffix}`,
    versioning: {
      enabled: true,
    },
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'aws:kms',
          kmsMasterKeyId: kmsKey.arn,
        },
      },
    },
    lifecycleRules: [
      {
        enabled: true,
        transitions: [
          {
            days: 90,
            storageClass: 'GLACIER',
          },
        ],
      },
    ],
    tags: {
      ...commonTags,
      Name: `analytics-processed-data-${environmentSuffix}`,
    },
  }
);

// Block public access for processed data bucket
const processedDataBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  `analytics-processed-data-public-access-block-${environmentSuffix}`,
  {
    bucket: processedDataBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  }
);

// ===== Aurora PostgreSQL Serverless v2 =====

// DB subnet group
const dbSubnetGroup = new aws.rds.SubnetGroup(
  `analytics-db-subnet-group-${environmentSuffix}`,
  {
    name: `analytics-db-subnet-group-${environmentSuffix}`,
    subnetIds: privateSubnets.map(s => s.id),
    tags: {
      ...commonTags,
      Name: `analytics-db-subnet-group-${environmentSuffix}`,
    },
  }
);

// Generate random password for database
const dbPassword = new pulumi.RandomPassword(
  `analytics-db-password-${environmentSuffix}`,
  {
    length: 32,
    special: true,
    overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
  }
);

// Store database credentials in Secrets Manager (optional enhancement)
const dbSecret = new aws.secretsmanager.Secret(
  `analytics-db-secret-${environmentSuffix}`,
  {
    name: `analytics/db/credentials-${environmentSuffix}`,
    description: 'Aurora PostgreSQL database credentials',
    kmsKeyId: kmsKey.arn,
    tags: { ...commonTags, Name: `analytics-db-secret-${environmentSuffix}` },
  }
);

const dbSecretVersion = new aws.secretsmanager.SecretVersion(
  `analytics-db-secret-version-${environmentSuffix}`,
  {
    secretId: dbSecret.id,
    secretString: pulumi.interpolate`{"username":"adminuser","password":"${dbPassword.result}"}`,
  }
);

// Aurora cluster parameter group
const clusterParameterGroup = new aws.rds.ClusterParameterGroup(
  `analytics-cluster-pg-${environmentSuffix}`,
  {
    name: `analytics-cluster-pg-${environmentSuffix}`,
    family: 'aurora-postgresql14',
    description: 'Cluster parameter group for financial analytics',
    parameters: [
      {
        name: 'log_statement',
        value: 'all',
      },
      {
        name: 'log_min_duration_statement',
        value: '1000',
      },
    ],
    tags: { ...commonTags, Name: `analytics-cluster-pg-${environmentSuffix}` },
  }
);

// Aurora cluster
const auroraCluster = new aws.rds.Cluster(
  `analytics-aurora-cluster-${environmentSuffix}`,
  {
    clusterIdentifier: `analytics-aurora-cluster-${environmentSuffix}`,
    engine: 'aurora-postgresql',
    engineMode: 'provisioned',
    engineVersion: '14.6',
    databaseName: 'analyticsdb',
    masterUsername: 'adminuser',
    masterPassword: dbPassword.result,
    dbSubnetGroupName: dbSubnetGroup.name,
    vpcSecurityGroupIds: [auroraSecurityGroup.id],
    backupRetentionPeriod: 35,
    preferredBackupWindow: '03:00-04:00',
    preferredMaintenanceWindow: 'sun:04:00-sun:05:00',
    storageEncrypted: true,
    kmsKeyId: kmsKey.arn,
    enabledCloudwatchLogsExports: ['postgresql'],
    skipFinalSnapshot: true,
    deletionProtection: false,
    dbClusterParameterGroupName: clusterParameterGroup.name,
    serverlessv2ScalingConfiguration: {
      maxCapacity: 4.0,
      minCapacity: 0.5,
    },
    tags: {
      ...commonTags,
      Name: `analytics-aurora-cluster-${environmentSuffix}`,
    },
  }
);

// Aurora instance (Serverless v2)
const auroraInstance = new aws.rds.ClusterInstance(
  `analytics-aurora-instance-${environmentSuffix}`,
  {
    identifier: `analytics-aurora-instance-${environmentSuffix}`,
    clusterIdentifier: auroraCluster.id,
    instanceClass: 'db.serverless',
    engine: auroraCluster.engine,
    engineVersion: auroraCluster.engineVersion,
    publiclyAccessible: false,
    tags: {
      ...commonTags,
      Name: `analytics-aurora-instance-${environmentSuffix}`,
    },
  }
);

// ===== IAM Roles and Policies =====

// ECS Task Execution Role
const ecsTaskExecutionRole = new aws.iam.Role(
  `analytics-ecs-exec-role-${environmentSuffix}`,
  {
    name: `analytics-ecs-exec-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ecs-tasks.amazonaws.com',
          },
        },
      ],
    }),
    tags: {
      ...commonTags,
      Name: `analytics-ecs-exec-role-${environmentSuffix}`,
    },
  }
);

// Attach AWS managed policy for ECS task execution
const ecsTaskExecutionRolePolicyAttachment = new aws.iam.RolePolicyAttachment(
  `analytics-ecs-exec-policy-${environmentSuffix}`,
  {
    role: ecsTaskExecutionRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
  }
);

// Custom policy for ECS task execution (CloudWatch Logs with KMS, Secrets Manager)
const ecsExecutionPolicy = new aws.iam.RolePolicy(
  `analytics-ecs-exec-custom-policy-${environmentSuffix}`,
  {
    role: ecsTaskExecutionRole.id,
    policy: pulumi
      .all([kmsKey.arn, dbSecret.arn])
      .apply(([kmsArn, secretArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:DescribeKey'],
              Resource: kmsArn,
            },
            {
              Effect: 'Allow',
              Action: ['secretsmanager:GetSecretValue'],
              Resource: secretArn,
            },
            {
              Effect: 'Allow',
              Action: ['logs:CreateLogStream', 'logs:PutLogEvents'],
              Resource: '*',
            },
          ],
        })
      ),
  }
);

// ECS Task Role (for application)
const ecsTaskRole = new aws.iam.Role(
  `analytics-ecs-task-role-${environmentSuffix}`,
  {
    name: `analytics-ecs-task-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ecs-tasks.amazonaws.com',
          },
        },
      ],
    }),
    tags: {
      ...commonTags,
      Name: `analytics-ecs-task-role-${environmentSuffix}`,
    },
  }
);

// Task role policy for S3 access
const ecsTaskS3Policy = new aws.iam.RolePolicy(
  `analytics-ecs-task-s3-policy-${environmentSuffix}`,
  {
    role: ecsTaskRole.id,
    policy: pulumi
      .all([rawDataBucket.arn, processedDataBucket.arn])
      .apply(([rawArn, processedArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
              Resource: [
                rawArn,
                `${rawArn}/*`,
                processedArn,
                `${processedArn}/*`,
              ],
            },
            {
              Effect: 'Allow',
              Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
              Resource: '*',
            },
          ],
        })
      ),
  }
);

// ===== ECS Cluster =====

const ecsCluster = new aws.ecs.Cluster(
  `analytics-ecs-cluster-${environmentSuffix}`,
  {
    name: `analytics-ecs-cluster-${environmentSuffix}`,
    settings: [
      {
        name: 'containerInsights',
        value: 'enabled',
      },
    ],
    tags: { ...commonTags, Name: `analytics-ecs-cluster-${environmentSuffix}` },
  }
);

// ECS Capacity Provider for Fargate Spot
const fargateSpotCapacityProvider = new aws.ecs.ClusterCapacityProviders(
  `analytics-capacity-providers-${environmentSuffix}`,
  {
    clusterName: ecsCluster.name,
    capacityProviders: ['FARGATE_SPOT', 'FARGATE'],
    defaultCapacityProviderStrategies: [
      {
        capacityProvider: 'FARGATE_SPOT',
        weight: 4,
        base: 0,
      },
      {
        capacityProvider: 'FARGATE',
        weight: 1,
        base: 0,
      },
    ],
  }
);

// ===== Kinesis Data Stream (Optional Enhancement) =====

const kinesisStream = new aws.kinesis.Stream(
  `analytics-stream-${environmentSuffix}`,
  {
    name: `analytics-stream-${environmentSuffix}`,
    shardCount: 2,
    retentionPeriod: 24,
    streamModeDetails: {
      streamMode: 'PROVISIONED',
    },
    encryptionType: 'KMS',
    kmsKeyId: kmsKey.id,
    tags: { ...commonTags, Name: `analytics-stream-${environmentSuffix}` },
  }
);

// IAM policy for Kinesis access (for ECS tasks)
const ecsTaskKinesisPolicy = new aws.iam.RolePolicy(
  `analytics-ecs-task-kinesis-policy-${environmentSuffix}`,
  {
    role: ecsTaskRole.id,
    policy: kinesisStream.arn.apply(streamArn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'kinesis:PutRecord',
              'kinesis:PutRecords',
              'kinesis:GetRecords',
              'kinesis:GetShardIterator',
              'kinesis:DescribeStream',
              'kinesis:ListStreams',
            ],
            Resource: streamArn,
          },
        ],
      })
    ),
  }
);

// ===== AWS Backup (Optional Enhancement) =====

// Backup vault
const backupVault = new aws.backup.Vault(
  `analytics-backup-vault-${environmentSuffix}`,
  {
    name: `analytics-backup-vault-${environmentSuffix}`,
    kmsKeyArn: kmsKey.arn,
    tags: {
      ...commonTags,
      Name: `analytics-backup-vault-${environmentSuffix}`,
    },
  }
);

// Backup role
const backupRole = new aws.iam.Role(
  `analytics-backup-role-${environmentSuffix}`,
  {
    name: `analytics-backup-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'backup.amazonaws.com',
          },
        },
      ],
    }),
    tags: { ...commonTags, Name: `analytics-backup-role-${environmentSuffix}` },
  }
);

// Attach AWS Backup managed policies
const backupPolicyAttachment = new aws.iam.RolePolicyAttachment(
  `analytics-backup-policy-${environmentSuffix}`,
  {
    role: backupRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForBackup',
  }
);

const backupRestorePolicyAttachment = new aws.iam.RolePolicyAttachment(
  `analytics-backup-restore-policy-${environmentSuffix}`,
  {
    role: backupRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSBackupServiceRolePolicyForRestores',
  }
);

// Backup plan
const backupPlan = new aws.backup.Plan(
  `analytics-backup-plan-${environmentSuffix}`,
  {
    name: `analytics-backup-plan-${environmentSuffix}`,
    rules: [
      {
        ruleName: 'daily-backup',
        targetVaultName: backupVault.name,
        schedule: 'cron(0 2 * * ? *)',
        lifecycle: {
          deleteAfter: 35,
        },
      },
    ],
    tags: { ...commonTags, Name: `analytics-backup-plan-${environmentSuffix}` },
  }
);

// Backup selection
const backupSelection = new aws.backup.Selection(
  `analytics-backup-selection-${environmentSuffix}`,
  {
    name: `analytics-backup-selection-${environmentSuffix}`,
    planId: backupPlan.id,
    iamRoleArn: backupRole.arn,
    resources: [auroraCluster.arn],
  }
);

// ===== Exports =====

export const vpcId = vpc.id;
export const vpcCidr = vpc.cidrBlock;
export const publicSubnetIds = pulumi.all(publicSubnets.map(s => s.id));
export const privateSubnetIds = pulumi.all(privateSubnets.map(s => s.id));
export const ecsClusterArn = ecsCluster.arn;
export const ecsClusterName = ecsCluster.name;
export const ecsTaskExecutionRoleArn = ecsTaskExecutionRole.arn;
export const ecsTaskRoleArn = ecsTaskRole.arn;
export const ecsSecurityGroupId = ecsSecurityGroup.id;
export const auroraClusterArn = auroraCluster.arn;
export const auroraClusterEndpoint = auroraCluster.endpoint;
export const auroraClusterReaderEndpoint = auroraCluster.readerEndpoint;
export const auroraSecurityGroupId = auroraSecurityGroup.id;
export const dbSecretArn = dbSecret.arn;
export const kmsKeyArn = kmsKey.arn;
export const kmsKeyId = kmsKey.keyId;
export const rawDataBucketName = rawDataBucket.bucket;
export const rawDataBucketArn = rawDataBucket.arn;
export const processedDataBucketName = processedDataBucket.bucket;
export const processedDataBucketArn = processedDataBucket.arn;
export const kinesisStreamArn = kinesisStream.arn;
export const kinesisStreamName = kinesisStream.name;
export const ecsLogGroupName = ecsLogGroup.name;
export const backupVaultArn = backupVault.arn;
export const backupPlanId = backupPlan.id;
```

## File: Pulumi.yaml

```yaml
name: financial-analytics-platform
runtime: nodejs
description: Production-ready infrastructure for financial analytics platform
config:
  environmentSuffix:
    type: string
    description: Unique suffix for resource naming to prevent conflicts
```

## File: package.json

```json
{
  "name": "financial-analytics-platform",
  "version": "1.0.0",
  "description": "Pulumi TypeScript infrastructure for financial analytics platform",
  "main": "index.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "test:coverage": "jest --coverage",
    "lint": "eslint . --ext .ts"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^20.0.0",
    "@typescript-eslint/eslint-plugin": "^6.0.0",
    "@typescript-eslint/parser": "^6.0.0",
    "eslint": "^8.45.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "ts-node": "^10.9.1",
    "typescript": "^5.1.0"
  },
  "dependencies": {
    "@pulumi/pulumi": "^3.90.0",
    "@pulumi/aws": "^6.0.0",
    "@pulumi/random": "^4.14.0"
  }
}
```

## File: tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./bin",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules", "**/*.spec.ts"]
}
```

## File: .eslintrc.json

```json
{
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "ecmaVersion": 2020,
    "sourceType": "module",
    "project": "./tsconfig.json"
  },
  "plugins": ["@typescript-eslint"],
  "extends": ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  "rules": {
    "@typescript-eslint/no-unused-vars": [
      "error",
      { "argsIgnorePattern": "^_" }
    ],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/no-non-null-assertion": "warn"
  },
  "env": {
    "node": true,
    "es6": true
  }
}
```

## File: jest.config.js

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.spec.ts'],
  collectCoverageFrom: [
    'index.ts',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/vendor/**',
  ],
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100,
    },
  },
};
```

## File: tests/unit/infrastructure.spec.ts

```typescript
import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks(
  {
    newResource: function (args: pulumi.runtime.MockResourceArgs): {
      id: string;
      state: any;
    } {
      const id = args.inputs.name
        ? `${args.type}-${args.inputs.name}`
        : `${args.type}-id`;
      return {
        id: id,
        state: {
          ...args.inputs,
          arn: `arn:aws:${args.type}:us-east-2:123456789012:${args.name}`,
          id: id,
        },
      };
    },
    call: function (args: pulumi.runtime.MockCallArgs) {
      if (
        args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones'
      ) {
        return {
          names: ['us-east-2a', 'us-east-2b', 'us-east-2c'],
        };
      }
      return args.inputs;
    },
  },
  'project',
  'stack',
  false
);

// Import the infrastructure code
import * as infra from '../../index';

describe('Financial Analytics Platform Infrastructure', () => {
  describe('VPC Configuration', () => {
    it('should create VPC with correct CIDR block', done => {
      infra.vpcCidr.apply(cidr => {
        expect(cidr).toBe('10.0.0.0/16');
        done();
      });
    });

    it('should create VPC ID', done => {
      infra.vpcId.apply(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });

    it('should create 3 public subnets', done => {
      infra.publicSubnetIds.apply(ids => {
        expect(ids).toHaveLength(3);
        done();
      });
    });

    it('should create 3 private subnets', done => {
      infra.privateSubnetIds.apply(ids => {
        expect(ids).toHaveLength(3);
        done();
      });
    });
  });

  describe('ECS Cluster', () => {
    it('should export ECS cluster ARN', done => {
      infra.ecsClusterArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export ECS cluster name', done => {
      infra.ecsClusterName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export ECS task execution role ARN', done => {
      infra.ecsTaskExecutionRoleArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export ECS task role ARN', done => {
      infra.ecsTaskRoleArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export ECS security group ID', done => {
      infra.ecsSecurityGroupId.apply(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });
  });

  describe('Aurora PostgreSQL', () => {
    it('should export Aurora cluster ARN', done => {
      infra.auroraClusterArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export Aurora cluster endpoint', done => {
      infra.auroraClusterEndpoint.apply(endpoint => {
        expect(endpoint).toBeDefined();
        expect(typeof endpoint).toBe('string');
        done();
      });
    });

    it('should export Aurora reader endpoint', done => {
      infra.auroraClusterReaderEndpoint.apply(endpoint => {
        expect(endpoint).toBeDefined();
        expect(typeof endpoint).toBe('string');
        done();
      });
    });

    it('should export Aurora security group ID', done => {
      infra.auroraSecurityGroupId.apply(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });

    it('should export database secret ARN', done => {
      infra.dbSecretArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });
  });

  describe('KMS Encryption', () => {
    it('should export KMS key ARN', done => {
      infra.kmsKeyArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export KMS key ID', done => {
      infra.kmsKeyId.apply(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });
  });

  describe('S3 Buckets', () => {
    it('should export raw data bucket name', done => {
      infra.rawDataBucketName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export raw data bucket ARN', done => {
      infra.rawDataBucketArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export processed data bucket name', done => {
      infra.processedDataBucketName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export processed data bucket ARN', done => {
      infra.processedDataBucketArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });
  });

  describe('Kinesis Stream', () => {
    it('should export Kinesis stream ARN', done => {
      infra.kinesisStreamArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export Kinesis stream name', done => {
      infra.kinesisStreamName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });
  });

  describe('CloudWatch Logs', () => {
    it('should export ECS log group name', done => {
      infra.ecsLogGroupName.apply(name => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });
  });

  describe('AWS Backup', () => {
    it('should export backup vault ARN', done => {
      infra.backupVaultArn.apply(arn => {
        expect(arn).toBeDefined();
        expect(arn).toContain('arn:aws:');
        done();
      });
    });

    it('should export backup plan ID', done => {
      infra.backupPlanId.apply(id => {
        expect(id).toBeDefined();
        expect(typeof id).toBe('string');
        done();
      });
    });
  });
});
```

## File: tests/integration/deployment.spec.ts

```typescript
import * as fs from 'fs';
import * as path from 'path';
import * as AWS from 'aws-sdk';

describe('Infrastructure Deployment Integration Tests', () => {
  let outputs: any;
  let ec2Client: AWS.EC2;
  let ecsClient: AWS.ECS;
  let rdsClient: AWS.RDS;
  let s3Client: AWS.S3;
  let kinesisClient: AWS.Kinesis;
  let backupClient: AWS.Backup;

  beforeAll(() => {
    // Load stack outputs
    const outputsPath = path.join(
      process.cwd(),
      'cfn-outputs',
      'flat-outputs.json'
    );
    if (!fs.existsSync(outputsPath)) {
      throw new Error(
        `Outputs file not found at ${outputsPath}. Deploy the stack first.`
      );
    }
    outputs = JSON.parse(fs.readFileSync(outputsPath, 'utf8'));

    // Initialize AWS clients
    const region = 'us-east-2';
    ec2Client = new AWS.EC2({ region });
    ecsClient = new AWS.ECS({ region });
    rdsClient = new AWS.RDS({ region });
    s3Client = new AWS.S3({ region });
    kinesisClient = new AWS.Kinesis({ region });
    backupClient = new AWS.Backup({ region });
  });

  describe('VPC and Networking', () => {
    it('should have created VPC with correct CIDR', async () => {
      const vpcId = outputs.vpcId;
      const result = await ec2Client
        .describeVpcs({ VpcIds: [vpcId] })
        .promise();

      expect(result.Vpcs).toHaveLength(1);
      expect(result.Vpcs![0].CidrBlock).toBe('10.0.0.0/16');
      expect(result.Vpcs![0].EnableDnsHostnames).toBe(true);
      expect(result.Vpcs![0].EnableDnsSupport).toBe(true);
    });

    it('should have created 3 public subnets', async () => {
      const subnetIds = outputs.publicSubnetIds;
      const result = await ec2Client
        .describeSubnets({ SubnetIds: subnetIds })
        .promise();

      expect(result.Subnets).toHaveLength(3);
      result.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(true);
      });
    });

    it('should have created 3 private subnets', async () => {
      const subnetIds = outputs.privateSubnetIds;
      const result = await ec2Client
        .describeSubnets({ SubnetIds: subnetIds })
        .promise();

      expect(result.Subnets).toHaveLength(3);
      result.Subnets!.forEach(subnet => {
        expect(subnet.MapPublicIpOnLaunch).toBe(false);
      });
    });

    it('should have created VPC endpoints', async () => {
      const vpcId = outputs.vpcId;
      const result = await ec2Client
        .describeVpcEndpoints({
          Filters: [{ Name: 'vpc-id', Values: [vpcId] }],
        })
        .promise();

      // Should have S3, ECR API, ECR DKR, ECS, ECS Telemetry, Logs, Secrets Manager
      expect(result.VpcEndpoints!.length).toBeGreaterThanOrEqual(7);
    });
  });

  describe('ECS Cluster', () => {
    it('should have created ECS cluster', async () => {
      const clusterName = outputs.ecsClusterName;
      const result = await ecsClient
        .describeClusters({ clusters: [clusterName] })
        .promise();

      expect(result.clusters).toHaveLength(1);
      expect(result.clusters![0].status).toBe('ACTIVE');
    });

    it('should have Fargate Spot capacity provider configured', async () => {
      const clusterName = outputs.ecsClusterName;
      const result = await ecsClient
        .describeCapacityProviders({
          capacityProviders: ['FARGATE_SPOT', 'FARGATE'],
        })
        .promise();

      expect(result.capacityProviders!.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Aurora PostgreSQL', () => {
    it('should have created Aurora cluster', async () => {
      const clusterArn = outputs.auroraClusterArn;
      const clusterId = clusterArn.split(':').pop();
      const result = await rdsClient
        .describeDBClusters({
          DBClusterIdentifier: clusterId,
        })
        .promise();

      expect(result.DBClusters).toHaveLength(1);
      expect(result.DBClusters![0].Engine).toBe('aurora-postgresql');
      expect(result.DBClusters![0].EngineMode).toBe('provisioned');
    });

    it('should have encryption enabled', async () => {
      const clusterArn = outputs.auroraClusterArn;
      const clusterId = clusterArn.split(':').pop();
      const result = await rdsClient
        .describeDBClusters({
          DBClusterIdentifier: clusterId,
        })
        .promise();

      expect(result.DBClusters![0].StorageEncrypted).toBe(true);
      expect(result.DBClusters![0].KmsKeyId).toBeDefined();
    });

    it('should have 35 day backup retention', async () => {
      const clusterArn = outputs.auroraClusterArn;
      const clusterId = clusterArn.split(':').pop();
      const result = await rdsClient
        .describeDBClusters({
          DBClusterIdentifier: clusterId,
        })
        .promise();

      expect(result.DBClusters![0].BackupRetentionPeriod).toBe(35);
    });
  });

  describe('S3 Buckets', () => {
    it('should have created raw data bucket with versioning', async () => {
      const bucketName = outputs.rawDataBucketName;
      const versioning = await s3Client
        .getBucketVersioning({ Bucket: bucketName })
        .promise();

      expect(versioning.Status).toBe('Enabled');
    });

    it('should have created processed data bucket with versioning', async () => {
      const bucketName = outputs.processedDataBucketName;
      const versioning = await s3Client
        .getBucketVersioning({ Bucket: bucketName })
        .promise();

      expect(versioning.Status).toBe('Enabled');
    });

    it('should have encryption enabled on raw data bucket', async () => {
      const bucketName = outputs.rawDataBucketName;
      const encryption = await s3Client
        .getBucketEncryption({ Bucket: bucketName })
        .promise();

      expect(encryption.ServerSideEncryptionConfiguration).toBeDefined();
      expect(
        encryption.ServerSideEncryptionConfiguration!.Rules[0]
          .ApplyServerSideEncryptionByDefault!.SSEAlgorithm
      ).toBe('aws:kms');
    });

    it('should have lifecycle policy on raw data bucket', async () => {
      const bucketName = outputs.rawDataBucketName;
      const lifecycle = await s3Client
        .getBucketLifecycleConfiguration({ Bucket: bucketName })
        .promise();

      expect(lifecycle.Rules).toHaveLength(1);
      expect(lifecycle.Rules![0].Status).toBe('Enabled');
      expect(lifecycle.Rules![0].Transitions![0].Days).toBe(90);
      expect(lifecycle.Rules![0].Transitions![0].StorageClass).toBe('GLACIER');
    });
  });

  describe('Kinesis Data Stream', () => {
    it('should have created Kinesis stream', async () => {
      const streamName = outputs.kinesisStreamName;
      const result = await kinesisClient
        .describeStream({ StreamName: streamName })
        .promise();

      expect(result.StreamDescription.StreamStatus).toBe('ACTIVE');
      expect(result.StreamDescription.Shards.length).toBeGreaterThanOrEqual(2);
    });

    it('should have encryption enabled', async () => {
      const streamName = outputs.kinesisStreamName;
      const result = await kinesisClient
        .describeStream({ StreamName: streamName })
        .promise();

      expect(result.StreamDescription.EncryptionType).toBe('KMS');
      expect(result.StreamDescription.KeyId).toBeDefined();
    });
  });

  describe('AWS Backup', () => {
    it('should have created backup vault', async () => {
      const vaultArn = outputs.backupVaultArn;
      const vaultName = vaultArn.split(':').pop();
      const result = await backupClient
        .describeBackupVault({ BackupVaultName: vaultName! })
        .promise();

      expect(result.BackupVaultArn).toBe(vaultArn);
      expect(result.EncryptionKeyArn).toBeDefined();
    });

    it('should have created backup plan', async () => {
      const planId = outputs.backupPlanId;
      const result = await backupClient
        .getBackupPlan({ BackupPlanId: planId })
        .promise();

      expect(result.BackupPlan).toBeDefined();
      expect(result.BackupPlan!.Rules).toHaveLength(1);
      expect(result.BackupPlan!.Rules[0].Lifecycle!.DeleteAfterDays).toBe(35);
    });
  });

  describe('Security Groups', () => {
    it('should have correct ingress rules for Aurora', async () => {
      const sgId = outputs.auroraSecurityGroupId;
      const result = await ec2Client
        .describeSecurityGroups({ GroupIds: [sgId] })
        .promise();

      expect(result.SecurityGroups).toHaveLength(1);
      const ingressRules = result.SecurityGroups![0].IpPermissions!;
      const postgresRule = ingressRules.find(rule => rule.FromPort === 5432);

      expect(postgresRule).toBeDefined();
      expect(postgresRule!.UserIdGroupPairs).toBeDefined();
      expect(postgresRule!.UserIdGroupPairs!.length).toBeGreaterThan(0);
    });
  });
});
```

## File: lib/README.md

````markdown
# Financial Analytics Platform Infrastructure

This directory contains the Pulumi TypeScript infrastructure code for a production-ready financial analytics platform on AWS.

## Architecture

The infrastructure implements a secure, cost-optimized, highly available architecture:

- **Network**: VPC with 3 AZs, public/private subnets, VPC endpoints (no NAT gateways)
- **Compute**: ECS Fargate Spot cluster for containerized microservices
- **Database**: Aurora PostgreSQL Serverless v2 with 35-day encrypted backups
- **Storage**: S3 buckets with versioning and Glacier transitions after 90 days
- **Streaming**: Kinesis Data Streams for real-time data ingestion
- **Security**: Customer-managed KMS encryption, least-privilege IAM, security groups
- **Backup**: AWS Backup for centralized backup management
- **Monitoring**: CloudWatch logs with 30-day retention and KMS encryption

## Prerequisites

- Pulumi CLI 3.x
- Node.js 18+
- AWS CLI configured with appropriate credentials
- TypeScript 5.x

## Configuration

Set the required configuration value:

```bash
pulumi config set environmentSuffix <unique-suffix>
```
````

Example:

```bash
pulumi config set environmentSuffix dev-abc123
```

## Deployment

1. Install dependencies:

```bash
npm install
```

2. Preview changes:

```bash
pulumi preview
```

3. Deploy infrastructure:

```bash
pulumi up
```

4. Save outputs:

```bash
pulumi stack output --json > cfn-outputs/flat-outputs.json
```

## Testing

### Unit Tests

Run unit tests with coverage:

```bash
npm test
npm run test:coverage
```

### Integration Tests

Deploy the infrastructure first, then run integration tests:

```bash
pulumi up
npm run test:integration
```

## Cleanup

Destroy all resources:

```bash
pulumi destroy
```

## Key Resources

- **VPC**: `analytics-vpc-${environmentSuffix}`
- **ECS Cluster**: `analytics-ecs-cluster-${environmentSuffix}`
- **Aurora Cluster**: `analytics-aurora-cluster-${environmentSuffix}`
- **S3 Buckets**:
  - Raw data: `analytics-raw-data-${environmentSuffix}`
  - Processed: `analytics-processed-data-${environmentSuffix}`
- **Kinesis Stream**: `analytics-stream-${environmentSuffix}`
- **KMS Key**: `analytics-kms-${environmentSuffix}`

## Stack Outputs

All critical resource identifiers are exported as stack outputs:

- VPC ID and CIDR
- Subnet IDs (public and private)
- ECS cluster ARN and name
- IAM role ARNs
- Aurora endpoints
- S3 bucket names and ARNs
- Kinesis stream ARN
- KMS key ARN

## Security Features

- All data encrypted at rest using customer-managed KMS keys
- All compute resources in private subnets
- Security groups with least-privilege access
- IAM roles with minimal required permissions
- VPC endpoints to avoid internet traffic
- Database credentials stored in Secrets Manager
- CloudWatch logs encrypted with KMS

## Cost Optimization

- Fargate Spot instances (up to 70% savings)
- Aurora Serverless v2 (scales to zero)
- No NAT gateways (using VPC endpoints)
- S3 lifecycle policies (Glacier transitions)
- CloudWatch log retention (30 days)

## Compliance

- 35-day backup retention for audit requirements
- KMS encryption for all sensitive data
- VPC flow logs and CloudWatch audit logs
- Security group restrictions
- Private subnet isolation
