/* eslint-disable @typescript-eslint/no-unused-vars */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';

// Get configuration from environment variables
const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';
const region = process.env.AWS_REGION || 'us-east-2';

// Tags for all resources
const commonTags = {
  Environment: environmentSuffix,
  Project: 'financial-analytics',
  ManagedBy: 'pulumi',
};

// ===== KMS Keys for Encryption =====

// Get current AWS caller identity and region for KMS policy
const current = aws.getCallerIdentityOutput({});
const currentRegion = aws.getRegionOutput({});

const kmsKey = new aws.kms.Key(`analytics-kms-${environmentSuffix}`, {
  description: 'KMS key for encrypting database backups and CloudWatch logs',
  enableKeyRotation: true,
  deletionWindowInDays: 10,
  policy: pulumi
    .all([current.accountId, currentRegion.name])
    .apply(([accountId, regionName]) =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs',
            Effect: 'Allow',
            Principal: {
              Service: `logs.${regionName}.amazonaws.com`,
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            Resource: '*',
            Condition: {
              ArnLike: {
                'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${regionName}:${accountId}:log-group:*`,
              },
            },
          },
        ],
      })
    ),
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
const dbPassword = new random.RandomPassword(
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
    engine: aws.rds.EngineType.AuroraPostgresql,
    engineMode: aws.rds.EngineMode.Provisioned,
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
    engine: aws.rds.EngineType.AuroraPostgresql,
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
