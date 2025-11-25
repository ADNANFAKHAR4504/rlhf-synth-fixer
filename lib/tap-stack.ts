import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import * as random from '@pulumi/random';

const config = new pulumi.Config();
// Get configuration - prioritize environment variables, then Pulumi config, then default to 'dev'
// This matches the pattern from Pr6886 and allows the deploy script to set ENVIRONMENT_SUFFIX
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('environmentSuffix') || 'dev';

// Common tags for all resources
const commonTags = {
  Environment: 'production',
  DisasterRecovery: 'enabled',
  ManagedBy: 'Pulumi',
};

// Generate random password for database
const dbPassword = new random.RandomPassword(
  `db-password-${environmentSuffix}`,
  {
    length: 32,
    special: true,
    overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
  }
);

// Store password in AWS Secrets Manager
const dbSecret = new aws.secretsmanager.Secret(
  `db-secret-${environmentSuffix}`,
  {
    name: `aurora-db-password-${environmentSuffix}`,
    description: 'Aurora MySQL database password',
    recoveryWindowInDays: 0, // Allow immediate deletion for testing
    tags: {
      ...commonTags,
      Name: `db-secret-${environmentSuffix}`,
      Purpose: 'DatabasePassword',
    },
  }
);

// Store the password in the secret
new aws.secretsmanager.SecretVersion(`db-secret-version-${environmentSuffix}`, {
  secretId: dbSecret.id,
  secretString: pulumi.interpolate`{"username":"admin","password":"${dbPassword.result}"}`,
});

// Export the secret ARN for reference
export const dbSecretArn = dbSecret.arn;

// Primary region provider (us-east-1)
const primaryProvider = new aws.Provider('primary-provider', {
  region: 'us-east-1',
});

// Secondary region provider (eu-west-1)
const secondaryProvider = new aws.Provider('secondary-provider', {
  region: 'eu-west-1',
});

// ================== PRIMARY REGION (us-east-1) ==================

// VPC for primary region
const primaryVpc = new aws.ec2.Vpc(
  `primary-vpc-${environmentSuffix}`,
  {
    cidrBlock: '10.0.0.0/16',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      ...commonTags,
      Name: `primary-vpc-${environmentSuffix}`,
      Region: 'us-east-1',
    },
  },
  { provider: primaryProvider }
);

// Private subnets for RDS in primary region
const primaryPrivateSubnet1 = new aws.ec2.Subnet(
  `primary-private-subnet-1-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.1.0/24',
    availabilityZone: 'us-east-1a',
    tags: {
      ...commonTags,
      Name: `primary-private-subnet-1-${environmentSuffix}`,
      Type: 'Private',
    },
  },
  { provider: primaryProvider }
);

const primaryPrivateSubnet2 = new aws.ec2.Subnet(
  `primary-private-subnet-2-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.2.0/24',
    availabilityZone: 'us-east-1b',
    tags: {
      ...commonTags,
      Name: `primary-private-subnet-2-${environmentSuffix}`,
      Type: 'Private',
    },
  },
  { provider: primaryProvider }
);

// Public subnets for ALB in primary region
const primaryPublicSubnet1 = new aws.ec2.Subnet(
  `primary-public-subnet-1-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.101.0/24',
    availabilityZone: 'us-east-1a',
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: `primary-public-subnet-1-${environmentSuffix}`,
      Type: 'Public',
    },
  },
  { provider: primaryProvider }
);

const primaryPublicSubnet2 = new aws.ec2.Subnet(
  `primary-public-subnet-2-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    cidrBlock: '10.0.102.0/24',
    availabilityZone: 'us-east-1b',
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: `primary-public-subnet-2-${environmentSuffix}`,
      Type: 'Public',
    },
  },
  { provider: primaryProvider }
);

// Internet Gateway for primary VPC
const primaryIgw = new aws.ec2.InternetGateway(
  `primary-igw-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    tags: {
      ...commonTags,
      Name: `primary-igw-${environmentSuffix}`,
    },
  },
  { provider: primaryProvider }
);

// Route table for public subnets in primary region
const primaryPublicRouteTable = new aws.ec2.RouteTable(
  `primary-public-rt-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    routes: [
      {
        cidrBlock: '0.0.0.0/0',
        gatewayId: primaryIgw.id,
      },
    ],
    tags: {
      ...commonTags,
      Name: `primary-public-rt-${environmentSuffix}`,
    },
  },
  { provider: primaryProvider }
);

// Associate public subnets with route table
new aws.ec2.RouteTableAssociation(
  `primary-public-rta-1-${environmentSuffix}`,
  {
    subnetId: primaryPublicSubnet1.id,
    routeTableId: primaryPublicRouteTable.id,
  },
  { provider: primaryProvider }
);

new aws.ec2.RouteTableAssociation(
  `primary-public-rta-2-${environmentSuffix}`,
  {
    subnetId: primaryPublicSubnet2.id,
    routeTableId: primaryPublicRouteTable.id,
  },
  { provider: primaryProvider }
);

// ================== SECONDARY REGION (eu-west-1) ==================

// VPC for secondary region
const secondaryVpc = new aws.ec2.Vpc(
  `secondary-vpc-${environmentSuffix}`,
  {
    cidrBlock: '10.1.0.0/16',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      ...commonTags,
      Name: `secondary-vpc-${environmentSuffix}`,
      Region: 'eu-west-1',
    },
  },
  { provider: secondaryProvider }
);

// Private subnets for RDS in secondary region
const secondaryPrivateSubnet1 = new aws.ec2.Subnet(
  `secondary-private-subnet-1-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    cidrBlock: '10.1.1.0/24',
    availabilityZone: 'eu-west-1a',
    tags: {
      ...commonTags,
      Name: `secondary-private-subnet-1-${environmentSuffix}`,
      Type: 'Private',
    },
  },
  { provider: secondaryProvider }
);

const secondaryPrivateSubnet2 = new aws.ec2.Subnet(
  `secondary-private-subnet-2-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    cidrBlock: '10.1.2.0/24',
    availabilityZone: 'eu-west-1b',
    tags: {
      ...commonTags,
      Name: `secondary-private-subnet-2-${environmentSuffix}`,
      Type: 'Private',
    },
  },
  { provider: secondaryProvider }
);

// Public subnets for ALB in secondary region
const secondaryPublicSubnet1 = new aws.ec2.Subnet(
  `secondary-public-subnet-1-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    cidrBlock: '10.1.101.0/24',
    availabilityZone: 'eu-west-1a',
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: `secondary-public-subnet-1-${environmentSuffix}`,
      Type: 'Public',
    },
  },
  { provider: secondaryProvider }
);

const secondaryPublicSubnet2 = new aws.ec2.Subnet(
  `secondary-public-subnet-2-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    cidrBlock: '10.1.102.0/24',
    availabilityZone: 'eu-west-1b',
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: `secondary-public-subnet-2-${environmentSuffix}`,
      Type: 'Public',
    },
  },
  { provider: secondaryProvider }
);

// Internet Gateway for secondary VPC
const secondaryIgw = new aws.ec2.InternetGateway(
  `secondary-igw-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    tags: {
      ...commonTags,
      Name: `secondary-igw-${environmentSuffix}`,
    },
  },
  { provider: secondaryProvider }
);

// Route table for public subnets in secondary region
const secondaryPublicRouteTable = new aws.ec2.RouteTable(
  `secondary-public-rt-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    routes: [
      {
        cidrBlock: '0.0.0.0/0',
        gatewayId: secondaryIgw.id,
      },
    ],
    tags: {
      ...commonTags,
      Name: `secondary-public-rt-${environmentSuffix}`,
    },
  },
  { provider: secondaryProvider }
);

// Associate public subnets with route table
new aws.ec2.RouteTableAssociation(
  `secondary-public-rta-1-${environmentSuffix}`,
  {
    subnetId: secondaryPublicSubnet1.id,
    routeTableId: secondaryPublicRouteTable.id,
  },
  { provider: secondaryProvider }
);

new aws.ec2.RouteTableAssociation(
  `secondary-public-rta-2-${environmentSuffix}`,
  {
    subnetId: secondaryPublicSubnet2.id,
    routeTableId: secondaryPublicRouteTable.id,
  },
  { provider: secondaryProvider }
);

// ================== VPC PEERING ==================

// VPC Peering Connection
const vpcPeering = new aws.ec2.VpcPeeringConnection(
  `vpc-peering-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    peerVpcId: secondaryVpc.id,
    peerRegion: 'eu-west-1',
    autoAccept: false,
    tags: {
      ...commonTags,
      Name: `vpc-peering-${environmentSuffix}`,
    },
  },
  { provider: primaryProvider }
);

// Accept VPC Peering Connection in secondary region
const vpcPeeringAccepter = new aws.ec2.VpcPeeringConnectionAccepter(
  `vpc-peering-accepter-${environmentSuffix}`,
  {
    vpcPeeringConnectionId: vpcPeering.id,
    autoAccept: true,
    tags: {
      ...commonTags,
      Name: `vpc-peering-accepter-${environmentSuffix}`,
    },
  },
  { provider: secondaryProvider }
);

// Add routes for VPC peering in primary region
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const primaryPeeringRoute = new aws.ec2.Route(
  `primary-peering-route-${environmentSuffix}`,
  {
    routeTableId: primaryPublicRouteTable.id,
    destinationCidrBlock: '10.1.0.0/16',
    vpcPeeringConnectionId: vpcPeering.id,
  },
  { provider: primaryProvider, dependsOn: [vpcPeeringAccepter] }
);

// Add routes for VPC peering in secondary region
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const secondaryPeeringRoute = new aws.ec2.Route(
  `secondary-peering-route-${environmentSuffix}`,
  {
    routeTableId: secondaryPublicRouteTable.id,
    destinationCidrBlock: '10.0.0.0/16',
    vpcPeeringConnectionId: vpcPeering.id,
  },
  { provider: secondaryProvider, dependsOn: [vpcPeeringAccepter] }
);

// ================== RDS AURORA GLOBAL DATABASE ==================

// KMS key for primary region RDS encryption
const primaryKmsKey = new aws.kms.Key(
  `primary-rds-kms-${environmentSuffix}`,
  {
    description: `KMS key for RDS encryption in primary region - ${environmentSuffix}`,
    enableKeyRotation: true,
    deletionWindowInDays: 7,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'Enable IAM User Permissions',
          Effect: 'Allow',
          Principal: {
            AWS: '*',
          },
          Action: 'kms:*',
          Resource: '*',
        },
        {
          Sid: 'Allow RDS service to use the key',
          Effect: 'Allow',
          Principal: {
            Service: 'rds.amazonaws.com',
          },
          Action: [
            'kms:Decrypt',
            'kms:DescribeKey',
            'kms:CreateGrant',
            'kms:Encrypt',
            'kms:GenerateDataKey',
          ],
          Resource: '*',
        },
      ],
    }),
    tags: {
      ...commonTags,
      Name: `primary-rds-kms-${environmentSuffix}`,
      Region: 'us-east-1',
    },
  },
  { provider: primaryProvider }
);

// KMS alias for primary region
new aws.kms.Alias(
  `primary-rds-kms-alias-${environmentSuffix}`,
  {
    name: `alias/rds-primary-${environmentSuffix}`,
    targetKeyId: primaryKmsKey.keyId,
  },
  { provider: primaryProvider }
);

// KMS key for secondary region RDS encryption
const secondaryKmsKey = new aws.kms.Key(
  `secondary-rds-kms-${environmentSuffix}`,
  {
    description: `KMS key for RDS encryption in secondary region - ${environmentSuffix}`,
    enableKeyRotation: true,
    deletionWindowInDays: 7,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'Enable IAM User Permissions',
          Effect: 'Allow',
          Principal: {
            AWS: '*',
          },
          Action: 'kms:*',
          Resource: '*',
        },
        {
          Sid: 'Allow RDS service to use the key',
          Effect: 'Allow',
          Principal: {
            Service: 'rds.amazonaws.com',
          },
          Action: [
            'kms:Decrypt',
            'kms:DescribeKey',
            'kms:CreateGrant',
            'kms:Encrypt',
            'kms:GenerateDataKey',
          ],
          Resource: '*',
        },
      ],
    }),
    tags: {
      ...commonTags,
      Name: `secondary-rds-kms-${environmentSuffix}`,
      Region: 'eu-west-1',
    },
  },
  { provider: secondaryProvider }
);

// KMS alias for secondary region
new aws.kms.Alias(
  `secondary-rds-kms-alias-${environmentSuffix}`,
  {
    name: `alias/rds-secondary-${environmentSuffix}`,
    targetKeyId: secondaryKmsKey.keyId,
  },
  { provider: secondaryProvider }
);

// DB subnet group for primary region
const primaryDbSubnetGroup = new aws.rds.SubnetGroup(
  `primary-db-subnet-group-${environmentSuffix}`,
  {
    subnetIds: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
    tags: {
      ...commonTags,
      Name: `primary-db-subnet-group-${environmentSuffix}`,
    },
  },
  { provider: primaryProvider }
);

// DB subnet group for secondary region
const secondaryDbSubnetGroup = new aws.rds.SubnetGroup(
  `secondary-db-subnet-group-${environmentSuffix}`,
  {
    subnetIds: [secondaryPrivateSubnet1.id, secondaryPrivateSubnet2.id],
    tags: {
      ...commonTags,
      Name: `secondary-db-subnet-group-${environmentSuffix}`,
    },
  },
  { provider: secondaryProvider }
);

// Security group for RDS in primary region
const primaryRdsSg = new aws.ec2.SecurityGroup(
  `primary-rds-sg-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    description: 'Security group for primary RDS Aurora cluster',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        cidrBlocks: ['10.0.0.0/16', '10.1.0.0/16'], // Allow from both VPCs
      },
    ],
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      ...commonTags,
      Name: `primary-rds-sg-${environmentSuffix}`,
    },
  },
  { provider: primaryProvider }
);

// Security group for RDS in secondary region
const secondaryRdsSg = new aws.ec2.SecurityGroup(
  `secondary-rds-sg-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    description: 'Security group for secondary RDS Aurora cluster',
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        cidrBlocks: ['10.0.0.0/16', '10.1.0.0/16'], // Allow from both VPCs
      },
    ],
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      ...commonTags,
      Name: `secondary-rds-sg-${environmentSuffix}`,
    },
  },
  { provider: secondaryProvider }
);

// Global Database Cluster
const globalCluster = new aws.rds.GlobalCluster(
  `global-cluster-${environmentSuffix}`,
  {
    globalClusterIdentifier: `global-cluster-${environmentSuffix}`,
    engine: 'aurora-mysql',
    engineVersion: '8.0.mysql_aurora.3.04.0',
    databaseName: 'tradingdb',
    storageEncrypted: true,
  },
  { provider: primaryProvider }
);

// Primary RDS Aurora Cluster
const primaryCluster = new aws.rds.Cluster(
  `primary-cluster-${environmentSuffix}`,
  {
    clusterIdentifier: `primary-cluster-${environmentSuffix}`,
    engine: 'aurora-mysql',
    engineVersion: '8.0.mysql_aurora.3.04.0',
    databaseName: 'tradingdb',
    masterUsername: 'admin',
    masterPassword: dbPassword.result,
    dbSubnetGroupName: primaryDbSubnetGroup.name,
    vpcSecurityGroupIds: [primaryRdsSg.id],
    globalClusterIdentifier: globalCluster.id,
    backupRetentionPeriod: 7,
    preferredBackupWindow: '03:00-04:00',
    storageEncrypted: true,
    kmsKeyId: primaryKmsKey.arn,
    skipFinalSnapshot: true,
    enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
    tags: {
      ...commonTags,
      Name: `primary-cluster-${environmentSuffix}`,
      Role: 'Primary',
    },
  },
  { provider: primaryProvider }
);

// Primary cluster instance
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const primaryClusterInstance = new aws.rds.ClusterInstance(
  `primary-instance-${environmentSuffix}`,
  {
    identifier: `primary-instance-${environmentSuffix}`,
    clusterIdentifier: primaryCluster.id,
    instanceClass: 'db.r6g.large',
    engine: 'aurora-mysql',
    engineVersion: '8.0.mysql_aurora.3.04.0',
    performanceInsightsEnabled: true,
    publiclyAccessible: false,
    tags: {
      ...commonTags,
      Name: `primary-instance-${environmentSuffix}`,
    },
  },
  { provider: primaryProvider }
);

// Secondary RDS Aurora Cluster
const secondaryCluster = new aws.rds.Cluster(
  `secondary-cluster-${environmentSuffix}`,
  {
    clusterIdentifier: `secondary-cluster-${environmentSuffix}`,
    engine: 'aurora-mysql',
    engineVersion: '8.0.mysql_aurora.3.04.0',
    dbSubnetGroupName: secondaryDbSubnetGroup.name,
    vpcSecurityGroupIds: [secondaryRdsSg.id],
    globalClusterIdentifier: globalCluster.id,
    storageEncrypted: true,
    kmsKeyId: secondaryKmsKey.arn, // Required for cross-region encrypted replicas
    skipFinalSnapshot: true,
    enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
    tags: {
      ...commonTags,
      Name: `secondary-cluster-${environmentSuffix}`,
      Role: 'Secondary',
    },
  },
  { provider: secondaryProvider, dependsOn: [primaryCluster] }
);

// Secondary cluster instance
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const secondaryClusterInstance = new aws.rds.ClusterInstance(
  `secondary-instance-${environmentSuffix}`,
  {
    identifier: `secondary-instance-${environmentSuffix}`,
    clusterIdentifier: secondaryCluster.id,
    instanceClass: 'db.r6g.large',
    engine: 'aurora-mysql',
    engineVersion: '8.0.mysql_aurora.3.04.0',
    performanceInsightsEnabled: true,
    publiclyAccessible: false,
    tags: {
      ...commonTags,
      Name: `secondary-instance-${environmentSuffix}`,
    },
  },
  { provider: secondaryProvider }
);

// ================== S3 BUCKETS WITH CROSS-REGION REPLICATION ==================

// Primary S3 bucket for backups
const primaryBucket = new aws.s3.Bucket(
  `primary-backup-bucket-${environmentSuffix}`,
  {
    bucket: `primary-backup-bucket-${environmentSuffix}`,
    versioning: {
      enabled: true,
    },
    lifecycleRules: [
      {
        enabled: true,
        expiration: {
          days: 30,
        },
      },
    ],
    tags: {
      ...commonTags,
      Name: `primary-backup-bucket-${environmentSuffix}`,
      Region: 'us-east-1',
    },
  },
  { provider: primaryProvider }
);

// Secondary S3 bucket for backups
const secondaryBucket = new aws.s3.Bucket(
  `secondary-backup-bucket-${environmentSuffix}`,
  {
    bucket: `secondary-backup-bucket-${environmentSuffix}`,
    versioning: {
      enabled: true,
    },
    lifecycleRules: [
      {
        enabled: true,
        expiration: {
          days: 30,
        },
      },
    ],
    tags: {
      ...commonTags,
      Name: `secondary-backup-bucket-${environmentSuffix}`,
      Region: 'eu-west-1',
    },
  },
  { provider: secondaryProvider }
);

// IAM role for S3 replication
const replicationRole = new aws.iam.Role(
  `s3-replication-role-${environmentSuffix}`,
  {
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 's3.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    tags: {
      ...commonTags,
      Name: `s3-replication-role-${environmentSuffix}`,
    },
  }
);

// IAM policy for S3 replication
const replicationPolicy = new aws.iam.RolePolicy(
  `s3-replication-policy-${environmentSuffix}`,
  {
    role: replicationRole.id,
    policy: pulumi
      .all([primaryBucket.arn, secondaryBucket.arn])
      .apply(([primaryArn, secondaryArn]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
              Resource: [primaryArn],
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
              ],
              Resource: [`${primaryArn}/*`],
            },
            {
              Effect: 'Allow',
              Action: ['s3:ReplicateObject', 's3:ReplicateDelete'],
              Resource: [`${secondaryArn}/*`],
            },
          ],
        })
      ),
  }
);

// S3 bucket replication configuration
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const replicationConfig = new aws.s3.BucketReplicationConfig(
  `bucket-replication-${environmentSuffix}`,
  {
    bucket: primaryBucket.id,
    role: replicationRole.arn,
    rules: [
      {
        id: 'replicate-all',
        status: 'Enabled',
        destination: {
          bucket: secondaryBucket.arn,
          storageClass: 'STANDARD',
        },
      },
    ],
  },
  { provider: primaryProvider, dependsOn: [replicationPolicy] }
);

// ================== LAMBDA FUNCTIONS FOR CONNECTIVITY TESTING ==================

// IAM role for Lambda functions
const lambdaRole = new aws.iam.Role(`lambda-role-${environmentSuffix}`, {
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
    ...commonTags,
    Name: `lambda-role-${environmentSuffix}`,
  },
});

// Attach basic Lambda execution policy
new aws.iam.RolePolicyAttachment(
  `lambda-basic-execution-${environmentSuffix}`,
  {
    role: lambdaRole.name,
    policyArn:
      'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole',
  }
);

// Attach VPC execution policy
new aws.iam.RolePolicyAttachment(`lambda-vpc-execution-${environmentSuffix}`, {
  role: lambdaRole.name,
  policyArn:
    'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
});

// IAM policy for Lambda to assume role cross-region
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const lambdaCrossRegionPolicy = new aws.iam.RolePolicy(
  `lambda-cross-region-policy-${environmentSuffix}`,
  {
    role: lambdaRole.id,
    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: ['sts:AssumeRole'],
          Resource: '*',
        },
      ],
    }),
  }
);

// Security group for Lambda in primary region
const primaryLambdaSg = new aws.ec2.SecurityGroup(
  `primary-lambda-sg-${environmentSuffix}`,
  {
    vpcId: primaryVpc.id,
    description:
      'Security group for Lambda connectivity testing in primary region',
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      ...commonTags,
      Name: `primary-lambda-sg-${environmentSuffix}`,
    },
  },
  { provider: primaryProvider }
);

// Security group for Lambda in secondary region
const secondaryLambdaSg = new aws.ec2.SecurityGroup(
  `secondary-lambda-sg-${environmentSuffix}`,
  {
    vpcId: secondaryVpc.id,
    description:
      'Security group for Lambda connectivity testing in secondary region',
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],
    tags: {
      ...commonTags,
      Name: `secondary-lambda-sg-${environmentSuffix}`,
    },
  },
  { provider: secondaryProvider }
);

// Lambda function code for connectivity testing
const lambdaCode = `
exports.handler = async (event) => {
    const mysql = require('mysql2/promise');

    const dbHost = process.env.DB_HOST;
    const dbUser = process.env.DB_USER;
    const dbPassword = process.env.DB_PASSWORD;
    const dbName = process.env.DB_NAME;

    try {
        const connection = await mysql.createConnection({
            host: dbHost,
            user: dbUser,
            password: dbPassword,
            database: dbName,
            connectTimeout: 5000
        });

        await connection.execute('SELECT 1');
        await connection.end();

        return {
            statusCode: 200,
            body: JSON.stringify({
                status: 'healthy',
                message: 'Database connection successful',
                timestamp: new Date().toISOString()
            })
        };
    } catch (error) {
        console.error('Database connection failed:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({
                status: 'unhealthy',
                message: 'Database connection failed',
                error: error.message,
                timestamp: new Date().toISOString()
            })
        };
    }
};
`;

// Primary Lambda function
const primaryLambda = new aws.lambda.Function(
  `primary-connectivity-test-${environmentSuffix}`,
  {
    name: `primary-connectivity-test-${environmentSuffix}`,
    runtime: 'nodejs18.x',
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 30,
    vpcConfig: {
      subnetIds: [primaryPrivateSubnet1.id, primaryPrivateSubnet2.id],
      securityGroupIds: [primaryLambdaSg.id],
    },
    environment: {
      variables: {
        DB_HOST: primaryCluster.endpoint,
        DB_USER: 'admin',
        DB_PASSWORD: dbPassword.result,
        DB_NAME: 'tradingdb',
      },
    },
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(lambdaCode),
    }),
    tags: {
      ...commonTags,
      Name: `primary-connectivity-test-${environmentSuffix}`,
      Region: 'us-east-1',
    },
  },
  { provider: primaryProvider }
);

// Secondary Lambda function
const secondaryLambda = new aws.lambda.Function(
  `secondary-connectivity-test-${environmentSuffix}`,
  {
    name: `secondary-connectivity-test-${environmentSuffix}`,
    runtime: 'nodejs18.x',
    handler: 'index.handler',
    role: lambdaRole.arn,
    timeout: 30,
    vpcConfig: {
      subnetIds: [secondaryPrivateSubnet1.id, secondaryPrivateSubnet2.id],
      securityGroupIds: [secondaryLambdaSg.id],
    },
    environment: {
      variables: {
        DB_HOST: secondaryCluster.endpoint,
        DB_USER: 'admin',
        DB_PASSWORD: dbPassword.result,
        DB_NAME: 'tradingdb',
      },
    },
    code: new pulumi.asset.AssetArchive({
      'index.js': new pulumi.asset.StringAsset(lambdaCode),
    }),
    tags: {
      ...commonTags,
      Name: `secondary-connectivity-test-${environmentSuffix}`,
      Region: 'eu-west-1',
    },
  },
  { provider: secondaryProvider }
);

// EventBridge rule to trigger Lambda periodically (every 5 minutes)
const primaryEventRule = new aws.cloudwatch.EventRule(
  `primary-event-rule-${environmentSuffix}`,
  {
    scheduleExpression: 'rate(5 minutes)',
    tags: {
      ...commonTags,
      Name: `primary-event-rule-${environmentSuffix}`,
    },
  },
  { provider: primaryProvider }
);

const secondaryEventRule = new aws.cloudwatch.EventRule(
  `secondary-event-rule-${environmentSuffix}`,
  {
    scheduleExpression: 'rate(5 minutes)',
    tags: {
      ...commonTags,
      Name: `secondary-event-rule-${environmentSuffix}`,
    },
  },
  { provider: secondaryProvider }
);

// Event target for primary Lambda
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const primaryEventTarget = new aws.cloudwatch.EventTarget(
  `primary-event-target-${environmentSuffix}`,
  {
    rule: primaryEventRule.name,
    arn: primaryLambda.arn,
  },
  { provider: primaryProvider }
);

// Event target for secondary Lambda
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const secondaryEventTarget = new aws.cloudwatch.EventTarget(
  `secondary-event-target-${environmentSuffix}`,
  {
    rule: secondaryEventRule.name,
    arn: secondaryLambda.arn,
  },
  { provider: secondaryProvider }
);

// Lambda permission for EventBridge in primary region
new aws.lambda.Permission(
  `primary-lambda-permission-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: primaryLambda.name,
    principal: 'events.amazonaws.com',
    sourceArn: primaryEventRule.arn,
  },
  { provider: primaryProvider }
);

// Lambda permission for EventBridge in secondary region
new aws.lambda.Permission(
  `secondary-lambda-permission-${environmentSuffix}`,
  {
    action: 'lambda:InvokeFunction',
    function: secondaryLambda.name,
    principal: 'events.amazonaws.com',
    sourceArn: secondaryEventRule.arn,
  },
  { provider: secondaryProvider }
);

// ================== CLOUDWATCH ALARMS ==================

// CloudWatch alarm for replication lag in primary region
const replicationLagAlarm = new aws.cloudwatch.MetricAlarm(
  `replication-lag-alarm-${environmentSuffix}`,
  {
    name: `replication-lag-alarm-${environmentSuffix}`,
    comparisonOperator: 'GreaterThanThreshold',
    evaluationPeriods: 2,
    metricName: 'AuroraGlobalDBReplicationLag',
    namespace: 'AWS/RDS',
    period: 60,
    statistic: 'Average',
    threshold: 5000, // 5 seconds in milliseconds
    alarmDescription: 'Alarm when replication lag exceeds 5 seconds',
    dimensions: {
      DBClusterIdentifier: primaryCluster.clusterIdentifier,
    },
    tags: {
      ...commonTags,
      Name: `replication-lag-alarm-${environmentSuffix}`,
    },
  },
  { provider: primaryProvider }
);

// CloudWatch alarm for primary database connections
const primaryConnectionAlarm = new aws.cloudwatch.MetricAlarm(
  `primary-connection-alarm-${environmentSuffix}`,
  {
    name: `primary-connection-alarm-${environmentSuffix}`,
    comparisonOperator: 'LessThanThreshold',
    evaluationPeriods: 2,
    metricName: 'DatabaseConnections',
    namespace: 'AWS/RDS',
    period: 60,
    statistic: 'Average',
    threshold: 1,
    alarmDescription: 'Alarm when primary database has no connections',
    dimensions: {
      DBClusterIdentifier: primaryCluster.clusterIdentifier,
    },
    tags: {
      ...commonTags,
      Name: `primary-connection-alarm-${environmentSuffix}`,
    },
  },
  { provider: primaryProvider }
);

// ================== ROUTE 53 HEALTH CHECKS AND FAILOVER ==================

// Route 53 hosted zone
const hostedZone = new aws.route53.Zone(`hosted-zone-${environmentSuffix}`, {
  name: `tradingdb-${environmentSuffix}.test.local`,
  comment: 'Hosted zone for disaster recovery failover',
  tags: {
    ...commonTags,
    Name: `hosted-zone-${environmentSuffix}`,
  },
});

// Health check for primary database
const primaryHealthCheck = new aws.route53.HealthCheck(
  `primary-health-check-${environmentSuffix}`,
  {
    type: 'CLOUDWATCH_METRIC',
    cloudwatchAlarmName: replicationLagAlarm.name,
    cloudwatchAlarmRegion: 'us-east-1',
    insufficientDataHealthStatus: 'Healthy',
    tags: {
      ...commonTags,
      Name: `primary-health-check-${environmentSuffix}`,
    },
  }
);

// Health check for secondary database
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const secondaryHealthCheck = new aws.route53.HealthCheck(
  `secondary-health-check-${environmentSuffix}`,
  {
    type: 'CLOUDWATCH_METRIC',
    cloudwatchAlarmName: primaryConnectionAlarm.name,
    cloudwatchAlarmRegion: 'us-east-1',
    insufficientDataHealthStatus: 'Healthy',
    tags: {
      ...commonTags,
      Name: `secondary-health-check-${environmentSuffix}`,
    },
  }
);

// Primary DNS record with failover routing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const primaryDnsRecord = new aws.route53.Record(
  `primary-dns-record-${environmentSuffix}`,
  {
    zoneId: hostedZone.zoneId,
    name: `db.tradingdb-${environmentSuffix}.test.local`,
    type: 'CNAME',
    ttl: 60,
    records: [primaryCluster.endpoint],
    setIdentifier: 'Primary',
    failoverRoutingPolicies: [
      {
        type: 'PRIMARY',
      },
    ],
    healthCheckId: primaryHealthCheck.id,
  }
);

// Secondary DNS record with failover routing
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const secondaryDnsRecord = new aws.route53.Record(
  `secondary-dns-record-${environmentSuffix}`,
  {
    zoneId: hostedZone.zoneId,
    name: `db.tradingdb-${environmentSuffix}.test.local`,
    type: 'CNAME',
    ttl: 60,
    records: [secondaryCluster.endpoint],
    setIdentifier: 'Secondary',
    failoverRoutingPolicies: [
      {
        type: 'SECONDARY',
      },
    ],
  }
);

// ================== EXPORTS ==================

export const primaryDatabaseEndpoint = primaryCluster.endpoint;
export const secondaryDatabaseEndpoint = secondaryCluster.endpoint;
export const primaryBucketName = primaryBucket.id;
export const secondaryBucketName = secondaryBucket.id;
export const route53HostedZoneId = hostedZone.zoneId;
export const route53DnsName = `db.tradingdb-${environmentSuffix}.test.local`;
export const primaryVpcId = primaryVpc.id;
export const secondaryVpcId = secondaryVpc.id;
export const vpcPeeringConnectionId = vpcPeering.id;
export const primaryLambdaArn = primaryLambda.arn;
export const secondaryLambdaArn = secondaryLambda.arn;
