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
