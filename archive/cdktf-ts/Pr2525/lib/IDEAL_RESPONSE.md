## lib/modules.ts

```typescript
import { Construct } from 'constructs';

// VPC & Networking
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';

// Security Groups
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';

// EC2
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { Instance } from '@cdktf/provider-aws/lib/instance';

// S3
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';

// RDS
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';

// IAM
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

// CloudTrail
import { cloudtrail } from '@cdktf/provider-aws';

// KMS
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';

// Secrets Manager
import { SecretsmanagerSecret } from '@cdktf/provider-aws/lib/secretsmanager-secret';
import { SecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/secretsmanager-secret-version';

// Random Provider
import { Password } from '@cdktf/provider-random/lib/password';

// VPC Module - Creates secure network infrastructure
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;
  public readonly isolatedSubnet: Subnet;
  public readonly internetGateway: InternetGateway;
  public readonly natGateway: NatGateway;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Get availability zones for the region
    const azs = new DataAwsAvailabilityZones(this, 'azs', {
      state: 'available',
    });

    // Create VPC with DNS support
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: 'tap-vpc',
        Environment: 'production',
      },
    });

    // Internet Gateway for public subnet
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'tap-igw',
      },
    });

    // Public subnet for NAT Gateway
    this.publicSubnet = new Subnet(this, 'public-subnet', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: 'tap-public-subnet',
        Type: 'public',
      },
    });

    // Private subnet for EC2
    this.privateSubnet = new Subnet(this, 'private-subnet', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      tags: {
        Name: 'tap-private-subnet',
        Type: 'private',
      },
    });

    // Isolated subnet for RDS
    this.isolatedSubnet = new Subnet(this, 'isolated-subnet', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.3.0/24',
      availabilityZone: `\${${azs.fqn}.names[1]}`,
      tags: {
        Name: 'tap-isolated-subnet',
        Type: 'isolated',
      },
    });

    // Additional isolated subnet for RDS Multi-AZ (required)
    const isolatedSubnet2 = new Subnet(this, 'isolated-subnet-2', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.4.0/24',
      availabilityZone: `\${${azs.fqn}.names[2]}`,
      tags: {
        Name: 'tap-isolated-subnet-2',
        Type: 'isolated',
      },
    });

    // Elastic IP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: 'tap-nat-eip',
      },
    });

    // NAT Gateway in public subnet
    this.natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnet.id,
      tags: {
        Name: 'tap-nat-gateway',
      },
    });

    // Route table for public subnet
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'tap-public-rt',
      },
    });

    // Route to internet gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnet with public route table
    new RouteTableAssociation(this, 'public-rta', {
      subnetId: this.publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // Route table for private subnet
    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: 'tap-private-rt',
      },
    });

    // Route to NAT gateway for internet access
    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate private subnet with private route table
    new RouteTableAssociation(this, 'private-rta', {
      subnetId: this.privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });

    // Create DB subnet group for RDS
    new DbSubnetGroup(this, 'db-subnet-group', {
      name: 'tap-db-subnet-group',
      subnetIds: [this.isolatedSubnet.id, isolatedSubnet2.id],
      tags: {
        Name: 'tap-db-subnet-group',
      },
    });
  }
}

// Security Module - Creates security groups and IAM roles
export class SecurityModule extends Construct {
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, vpcId: string) {
    super(scope, id);

    // Security group for EC2 instance
    this.ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: 'tap-ec2-sg',
      description: 'Security group for EC2 instance',
      vpcId: vpcId,

      // Allow outbound traffic
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: '-1',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],

      // Allow SSH from within VPC only
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['10.0.0.0/16'],
        },
      ],

      tags: {
        Name: 'tap-ec2-sg',
      },
    });

    // Security group for RDS
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: 'tap-rds-sg',
      description: 'Security group for RDS database',
      vpcId: vpcId,

      // Allow MySQL access from EC2 security group only
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          securityGroups: [this.ec2SecurityGroup.id],
        },
      ],

      tags: {
        Name: 'tap-rds-sg',
      },
    });

    // IAM role for EC2 instance
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: 'tap-ec2-role',
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com',
            },
          },
        ],
      }),
      tags: {
        Name: 'tap-ec2-role',
      },
    });

    // IAM policy for S3 access (least privilege)
    new IamRolePolicy(this, 'ec2-s3-policy', {
      name: 'tap-ec2-s3-policy',
      role: this.ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:GetObjectVersion', 's3:ListBucket'],
            Resource: [
              'arn:aws:s3:::tap-secure-bucket-*',
              'arn:aws:s3:::tap-secure-bucket-*/*',
            ],
          },
        ],
      }),
    });

    // Instance profile for EC2
    this.ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: 'tap-ec2-instance-profile',
        role: this.ec2Role.name,
      }
    );
  }
}

// S3 Module - Creates encrypted S3 bucket with versioning
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly kmsKey: KmsKey;

  constructor(
    scope: Construct,
    id: string,
    bucketSuffix: string,
    accountId: string
  ) {
    super(scope, id);

    // KMS key for S3 encryption
    this.kmsKey = new KmsKey(this, 's3-kms-key', {
      description: 'KMS key for S3 bucket encryption',
      keyUsage: 'ENCRYPT_DECRYPT',
      policy: JSON.stringify({
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
        ],
      }),
      tags: {
        Name: 'tap-s3-kms-key',
      },
    });

    // KMS key alias
    new KmsAlias(this, 's3-kms-alias', {
      name: 'alias/tap-s3-key',
      targetKeyId: this.kmsKey.keyId,
    });

    // S3 bucket with unique name
    this.bucket = new S3Bucket(this, 'secure-bucket', {
      bucket: `tap-secure-bucket-${bucketSuffix}`,
      tags: {
        Name: 'tap-secure-bucket',
        Environment: 'production',
      },
    });

    // Enable versioning
    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: this.kmsKey.arn,
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}

// Secrets Manager Module - Creates and manages database credentials
export class SecretsManagerModule extends Construct {
  public readonly dbSecret: SecretsmanagerSecret;
  public readonly dbSecretVersion: SecretsmanagerSecretVersion;
  public readonly dbPassword: Password;

  constructor(scope: Construct, id: string, kmsKeyId: string) {
    super(scope, id);

    // Generate a secure random password
    this.dbPassword = new Password(this, 'db-password', {
      length: 16,
      special: true,
      upper: true,
      lower: true,
      numeric: true,
      minSpecial: 2,
      minUpper: 2,
      minLower: 2,
      minNumeric: 2,
      overrideSpecial: '!@#$%^&*()-_=+[]{}|;:,.<>?',
    });

    // Create the secret
    this.dbSecret = new SecretsmanagerSecret(this, 'db-secret', {
      name: 'tap/rds/mysql/credentials',
      description: 'RDS MySQL database credentials',
      kmsKeyId: kmsKeyId,
      tags: {
        Name: 'tap-db-secret',
        Environment: 'production',
      },
    });

    // Store the credentials in the secret
    this.dbSecretVersion = new SecretsmanagerSecretVersion(
      this,
      'db-secret-version',
      {
        secretId: this.dbSecret.id,
        secretString: JSON.stringify({
          username: 'admin',
          password: this.dbPassword.result,
          engine: 'mysql',
          host: '', // Will be populated after RDS creation
          port: 3306,
          dbname: 'tapdb',
        }),
      }
    );
  }
}

// EC2 Module - Creates EC2 instance with IAM role
export class Ec2Module extends Construct {
  public readonly instance: Instance;

  constructor(
    scope: Construct,
    id: string,
    subnetId: string,
    securityGroupId: string,
    instanceProfile: string
  ) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        {
          name: 'name',
          values: ['amzn2-ami-hvm-*-x86_64-gp2'],
        },
        {
          name: 'virtualization-type',
          values: ['hvm'],
        },
      ],
    });

    // EC2 instance in private subnet
    this.instance = new Instance(this, 'ec2-instance', {
      ami: ami.id,
      instanceType: 't3.micro',
      subnetId: subnetId,
      vpcSecurityGroupIds: [securityGroupId],
      iamInstanceProfile: instanceProfile,

      // User data to install SSM agent for secure access
      userData: `#!/bin/bash
yum update -y
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent`,

      tags: {
        Name: 'tap-ec2-instance',
        Environment: 'production',
      },
    });
  }
}

// RDS Module - Creates encrypted MySQL database with Multi-AZ using Secrets Manager
export class RdsModule extends Construct {
  public readonly database: DbInstance;
  public readonly kmsKey: KmsKey;
  public readonly secretsManager: SecretsManagerModule;

  constructor(
    scope: Construct,
    id: string,
    securityGroupId: string,
    accountId: string
  ) {
    super(scope, id);

    // KMS key for RDS encryption
    this.kmsKey = new KmsKey(this, 'rds-kms-key', {
      description: 'KMS key for RDS encryption',
      keyUsage: 'ENCRYPT_DECRYPT',
      policy: JSON.stringify({
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
            Sid: 'Allow Secrets Manager to use the key',
            Effect: 'Allow',
            Principal: {
              Service: 'secretsmanager.amazonaws.com',
            },
            Action: ['kms:Decrypt', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: 'tap-rds-kms-key',
      },
    });

    // KMS key alias
    new KmsAlias(this, 'rds-kms-alias', {
      name: 'alias/tap-rds-key',
      targetKeyId: this.kmsKey.keyId,
    });

    // Create Secrets Manager module for database credentials
    this.secretsManager = new SecretsManagerModule(
      this,
      'secrets',
      this.kmsKey.keyId
    );

    // RDS MySQL instance using Secrets Manager for credentials
    this.database = new DbInstance(this, 'mysql-db', {
      identifier: 'tap-mysql-db',
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      storageType: 'gp2',
      storageEncrypted: true,
      kmsKeyId: this.kmsKey.arn,

      // Database configuration using Secrets Manager
      dbName: 'tapdb',
      username: 'admin',
      password: this.secretsManager.dbPassword.result,

      // High availability
      multiAz: true,

      // Backup configuration
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',

      // Network configuration
      dbSubnetGroupName: 'tap-db-subnet-group',
      vpcSecurityGroupIds: [securityGroupId],

      // Security
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: 'tap-mysql-db-final-snapshot',
      deletionProtection: true,

      tags: {
        Name: 'tap-mysql-db',
        Environment: 'production',
      },
    });
  }
}

// CloudTrail Module - Enables logging and monitoring
export class CloudTrailModule extends Construct {
  public readonly trail: cloudtrail.Cloudtrail;
  public readonly logsBucket: S3Bucket;
  public readonly kmsKey: KmsKey;

  constructor(
    scope: Construct,
    id: string,
    bucketSuffix: string,
    accountId: string
  ) {
    super(scope, id);

    // KMS key for CloudTrail encryption
    // KMS key for CloudTrail encryption
    this.kmsKey = new KmsKey(this, 'cloudtrail-kms-key', {
      description: 'KMS key for CloudTrail encryption',
      keyUsage: 'ENCRYPT_DECRYPT',
      policy: JSON.stringify({
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
            Sid: 'Allow CloudTrail to encrypt logs',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: 'tap-cloudtrail-kms-key',
      },
    });

    // KMS key alias
    new KmsAlias(this, 'cloudtrail-kms-alias', {
      name: 'alias/tap-cloudtrail-key',
      targetKeyId: this.kmsKey.keyId,
    });

    // S3 bucket for CloudTrail logs
    this.logsBucket = new S3Bucket(this, 'cloudtrail-logs', {
      bucket: `tap-cloudtrail-logs-${bucketSuffix}`,
      tags: {
        Name: 'tap-cloudtrail-logs',
        Environment: 'production',
      },
    });

    // Enable versioning for logs bucket
    new S3BucketVersioningA(this, 'logs-bucket-versioning', {
      bucket: this.logsBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable encryption for logs bucket
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'logs-bucket-encryption',
      {
        bucket: this.logsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: this.kmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block public access for logs bucket
    new S3BucketPublicAccessBlock(this, 'logs-bucket-pab', {
      bucket: this.logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Bucket policy for CloudTrail
    new S3BucketPolicy(this, 'cloudtrail-bucket-policy', {
      bucket: this.logsBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSCloudTrailAclCheck',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:GetBucketAcl',
            Resource: `arn:aws:s3:::${this.logsBucket.bucket}`,
          },
          {
            Sid: 'AWSCloudTrailWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `arn:aws:s3:::${this.logsBucket.bucket}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
              },
            },
          },
        ],
      }),
    });

    // CloudTrail - FIXED: Removed problematic event selector
    this.trail = new cloudtrail.Cloudtrail(this, 'cloudtrail', {
      name: 'tap-cloudtrail',
      s3BucketName: this.logsBucket.id,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogging: true,
      kmsKeyId: this.kmsKey.arn,

      // OPTION 1: Remove event selector entirely (recommended for basic setup)
      // This will log all management events by default

      tags: {
        Name: 'tap-cloudtrail',
        Environment: 'production',
      },
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { Construct } from 'constructs';
import { Id } from '@cdktf/provider-random/lib/id';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { RandomProvider } from '@cdktf/provider-random/lib/provider';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

// Import your stacks here
import {
  VpcModule,
  SecurityModule,
  S3Module,
  Ec2Module,
  RdsModule,
  CloudTrailModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Region selection with us-west-2 as deployment region
    const awsRegion = props?.awsRegion || 'us-west-2';

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure Random Provider for unique resource naming
    new RandomProvider(this, 'random');

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    // Using an escape hatch instead of S3Backend construct - CDKTF still does not support S3 state locking natively
    // ref - https://developer.hashicorp.com/terraform/cdktf/concepts/resources#escape-hatch
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Generate random suffix for unique resource naming
    const bucketSuffix = new Id(this, 'bucket-suffix', {
      byteLength: 4,
    });

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

    // Add your stack instantiations here
    // Do NOT create resources directly in this stack.
    // Instead, create separate stacks for each resource type.

    // Create VPC infrastructure
    const vpcModule = new VpcModule(this, 'vpc');

    // Create security groups and IAM roles
    const securityModule = new SecurityModule(
      this,
      'security',
      vpcModule.vpc.id
    );

    // Create encrypted S3 bucket (passing accountId as fourth parameter)
    const s3Module = new S3Module(
      this,
      's3',
      bucketSuffix.hex,
      current.accountId
    );

    // Create EC2 instance
    const ec2Module = new Ec2Module(
      this,
      'ec2',
      vpcModule.privateSubnet.id,
      securityModule.ec2SecurityGroup.id,
      securityModule.ec2InstanceProfile.name
    );

    // Create RDS database with Secrets Manager (passing accountId as fourth parameter)
    const rdsModule = new RdsModule(
      this,
      'rds',
      securityModule.rdsSecurityGroup.id,
      current.accountId
    );

    // Add IAM policy for EC2 to access Secrets Manager
    new IamRolePolicy(this, 'ec2-secrets-policy', {
      name: 'tap-ec2-secrets-policy',
      role: securityModule.ec2Role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              'secretsmanager:GetSecretValue',
              'secretsmanager:DescribeSecret',
            ],
            Resource: [
              `arn:aws:secretsmanager:${awsRegion}:${current.accountId}:secret:tap/rds/mysql/credentials*`,
            ],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt', 'kms:GenerateDataKey*', 'kms:DescribeKey'],
            Resource: [rdsModule.kmsKey.arn],
          },
        ],
      }),
    });

    // Create CloudTrail module (passing accountId as fourth parameter)
    const cloudTrailModule = new CloudTrailModule(
      this,
      'cloudtrail',
      bucketSuffix.hex,
      current.accountId
    );

    // Terraform Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-id', {
      value: vpcModule.publicSubnet.id,
      description: 'Public subnet ID',
    });

    new TerraformOutput(this, 'private-subnet-id', {
      value: vpcModule.privateSubnet.id,
      description: 'Private subnet ID',
    });

    new TerraformOutput(this, 'isolated-subnet-id', {
      value: vpcModule.isolatedSubnet.id,
      description: 'Isolated subnet ID',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'S3 bucket name',
    });

    new TerraformOutput(this, 's3-bucket-arn', {
      value: s3Module.bucket.arn,
      description: 'S3 bucket ARN',
    });

    new TerraformOutput(this, 's3-kms-key-id', {
      value: s3Module.kmsKey.keyId,
      description: 'S3 KMS key ID',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: securityModule.ec2SecurityGroup.id,
      description: 'EC2 Security Group ID',
    });

    new TerraformOutput(this, 'rds-security-group-id', {
      value: securityModule.rdsSecurityGroup.id,
      description: 'RDS Security Group ID',
    });

    new TerraformOutput(this, 'ec2-iam-role-arn', {
      value: securityModule.ec2Role.arn,
      description: 'EC2 IAM Role ARN',
    });

    new TerraformOutput(this, 'ec2-iam-role-name', {
      value: securityModule.ec2Role.name,
      description: 'EC2 IAM Role name',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Module.instance.id,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 'ec2-instance-private-ip', {
      value: ec2Module.instance.privateIp,
      description: 'EC2 instance private IP',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.database.endpoint,
      description: 'RDS database endpoint',
    });

    new TerraformOutput(this, 'rds-kms-key-id', {
      value: rdsModule.kmsKey.keyId,
      description: 'RDS KMS key ID',
    });

    new TerraformOutput(this, 'db-secret-arn', {
      value: rdsModule.secretsManager.dbSecret.arn,
      description: 'Database credentials secret ARN',
    });

    new TerraformOutput(this, 'db-secret-name', {
      value: rdsModule.secretsManager.dbSecret.name,
      description: 'Database credentials secret name',
    });

    new TerraformOutput(this, 'cloudtrail-arn', {
      value: cloudTrailModule.trail.arn,
      description: 'CloudTrail ARN',
    });

    new TerraformOutput(this, 'cloudtrail-logs-bucket', {
      value: cloudTrailModule.logsBucket.bucket,
      description: 'CloudTrail logs bucket name',
    });

    new TerraformOutput(this, 'cloudtrail-kms-key-id', {
      value: cloudTrailModule.kmsKey.keyId,
      description: 'CloudTrail KMS key ID',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    new TerraformOutput(this, 'nat-gateway-id', {
      value: vpcModule.natGateway.id,
      description: 'NAT Gateway ID',
    });

    new TerraformOutput(this, 'internet-gateway-id', {
      value: vpcModule.internetGateway.id,
      description: 'Internet Gateway ID',
    });
  }
}
```