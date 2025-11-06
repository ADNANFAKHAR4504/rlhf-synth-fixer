import { cloudtrail } from '@cdktf/provider-aws';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule as AwsSecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule'; // Renamed to avoid conflict
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Password } from '@cdktf/provider-random/lib/password';
import { Construct } from 'constructs';

// KMS Module - Creates customer-managed KMS key
export interface KmsModuleProps {
  project: string;
  environment: string;
  description: string;
  accountId: string; // Add this
}

export class KmsModule extends Construct {
  public readonly key: KmsKey;
  public readonly alias: KmsAlias;

  constructor(scope: Construct, id: string, props: KmsModuleProps) {
    super(scope, id);

    // Create KMS key
    this.key = new KmsKey(this, 'kms-key', {
      description: props.description,
      keyUsage: 'ENCRYPT_DECRYPT',
      // Removed keySpec as it doesn't exist in KmsKeyConfig
      deletionWindowInDays: 7,
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${props.accountId}:root`,
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
            Action: [
              'kms:GenerateDataKey*',
              'kms:DescribeKey',
              'kms:Encrypt',
              'kms:ReEncrypt*',
              'kms:Decrypt',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${props.project}-${props.environment}-kms-key`,
        Project: props.project,
        Environment: props.environment,
      },
    });

    // Create KMS alias
    this.alias = new KmsAlias(this, 'kms-alias', {
      name: `alias/${props.project}-${props.environment}-key`,
      targetKeyId: this.key.keyId,
    });
  }
}

// S3 Module - Creates encrypted S3 bucket
export interface S3ModuleProps {
  project: string;
  environment: string;
  bucketName: string;
  kmsKey: KmsKey;
}

export class S3Module extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    // Create S3 bucket
    this.bucket = new S3Bucket(this, 's3-bucket', {
      bucket: props.bucketName,
      tags: {
        Name: props.bucketName,
        Project: props.project,
        Environment: props.environment,
      },
    });

    // Configure bucket encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 's3-encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: props.kmsKey.arn, // Changed from kmsKeyId to kmsMasterKeyId
            sseAlgorithm: 'aws:kms',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, 's3-public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Enable versioning
    new S3BucketVersioningA(this, 's3-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });
  }
}

// CloudTrail Module - Creates CloudTrail with encrypted logging
export interface CloudTrailModuleProps {
  project: string;
  environment: string;
  kmsKey: KmsKey;
  accountId: string; // Add account ID
  region: string; // Add region
}

export class CloudTrailModule extends Construct {
  public readonly trail: cloudtrail.Cloudtrail;
  public readonly logsBucket: S3Bucket;

  constructor(scope: Construct, id: string, props: CloudTrailModuleProps) {
    super(scope, id);

    // Create S3 bucket for CloudTrail logs
    const logsBucketName = `${props.project}-${props.environment}-cloudtrail-logs`;

    this.logsBucket = new S3Bucket(this, 'cloudtrail-logs-bucket', {
      bucket: logsBucketName,
      tags: {
        Name: logsBucketName,
        Project: props.project,
        Environment: props.environment,
      },
    });

    // Configure logs bucket encryption
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'logs-bucket-encryption',
      {
        bucket: this.logsBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              kmsMasterKeyId: props.kmsKey.arn,
              sseAlgorithm: 'aws:kms',
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Block public access for logs bucket
    new S3BucketPublicAccessBlock(this, 'logs-bucket-public-access-block', {
      bucket: this.logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // **FIXED: Create proper bucket policy for CloudTrail**
    const bucketPolicy = new S3BucketPolicy(this, 'cloudtrail-bucket-policy', {
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
            Resource: this.logsBucket.arn,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': `arn:aws:cloudtrail:${props.region}:${props.accountId}:trail/${props.project}-${props.environment}-trail`,
              },
            },
          },
          {
            Sid: 'AWSCloudTrailWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `${this.logsBucket.arn}/*`,
            Condition: {
              StringEquals: {
                's3:x-amz-acl': 'bucket-owner-full-control',
                'AWS:SourceArn': `arn:aws:cloudtrail:${props.region}:${props.accountId}:trail/${props.project}-${props.environment}-trail`,
              },
            },
          },
          {
            Sid: 'AWSCloudTrailGetBucketLocation',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:GetBucketLocation',
            Resource: this.logsBucket.arn,
            Condition: {
              StringEquals: {
                'AWS:SourceArn': `arn:aws:cloudtrail:${props.region}:${props.accountId}:trail/${props.project}-${props.environment}-trail`,
              },
            },
          },
        ],
      }),
    });

    // Create CloudTrail - ensure it depends on the bucket policy
    this.trail = new cloudtrail.Cloudtrail(this, 'cloudtrail', {
      name: `${props.project}-${props.environment}-trail`,
      s3BucketName: this.logsBucket.id,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogFileValidation: true,
      kmsKeyId: props.kmsKey.arn,
      tags: {
        Name: `${props.project}-${props.environment}-trail`,
        Project: props.project,
        Environment: props.environment,
      },
      dependsOn: [bucketPolicy], // Ensure bucket policy is created first
    });
  }
}

// IAM Module - Creates IAM role and policies for EC2
export interface IamModuleProps {
  project: string;
  environment: string;
  appDataBucketArn: string;
}

export class IamModule extends Construct {
  public readonly role: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);

    // Create IAM role for EC2
    this.role = new IamRole(this, 'ec2-role', {
      name: `${props.project}-${props.environment}-ec2-role`,
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
        Name: `${props.project}-${props.environment}-ec2-role`,
        Project: props.project,
        Environment: props.environment,
      },
    });

    // Attach basic EC2 permissions
    new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
      role: this.role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    // Create inline policy for S3 access
    new IamRolePolicy(this, 's3-access-policy', {
      name: `${props.project}-${props.environment}-s3-access`,
      role: this.role.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
            Resource: `${props.appDataBucketArn}/*`,
          },
        ],
      }),
    });

    // Create instance profile
    this.instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${props.project}-${props.environment}-ec2-profile`,
        role: this.role.name,
      }
    );
  }
}

// VPC Module - Creates VPC with public and private subnets
export interface VpcModuleProps {
  project: string;
  environment: string;
  cidrBlock: string;
  availabilityZones: string[];
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${props.project}-${props.environment}-vpc`,
        Project: props.project,
        Environment: props.environment,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.project}-${props.environment}-igw`,
        Project: props.project,
        Environment: props.environment,
      },
    });

    // Create public subnets
    this.publicSubnets = [];
    this.privateSubnets = [];

    props.availabilityZones.forEach((az, index) => {
      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index * 2 + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${props.project}-${props.environment}-public-subnet-${index + 1}`,
          Project: props.project,
          Environment: props.environment,
          Type: 'Public',
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index * 2 + 2}.0/24`,
        availabilityZone: az,
        tags: {
          Name: `${props.project}-${props.environment}-private-subnet-${index + 1}`,
          Project: props.project,
          Environment: props.environment,
          Type: 'Private',
        },
      });
      this.privateSubnets.push(privateSubnet);

      // Create NAT Gateway for private subnet
      const eip = new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          Name: `${props.project}-${props.environment}-nat-eip-${index + 1}`,
          Project: props.project,
          Environment: props.environment,
        },
      });

      const natGateway = new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `${props.project}-${props.environment}-nat-${index + 1}`,
          Project: props.project,
          Environment: props.environment,
        },
      });

      // Private route table
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `${props.project}-${props.environment}-private-rt-${index + 1}`,
          Project: props.project,
          Environment: props.environment,
        },
      });

      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: natGateway.id,
      });

      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        subnetId: privateSubnet.id,
        routeTableId: privateRouteTable.id,
      });
    });

    // Public route table
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.project}-${props.environment}-public-rt`,
        Project: props.project,
        Environment: props.environment,
      },
    });

    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });
  }
}

// Security Group Module - Creates security groups with configurable rules
export interface SecurityGroupRuleConfig {
  // Renamed to avoid conflict
  type: 'ingress' | 'egress';
  fromPort: number;
  toPort: number;
  protocol: string;
  cidrBlocks?: string[];
  sourceSecurityGroupId?: string;
}

export interface SecurityGroupModuleProps {
  project: string;
  environment: string;
  name: string;
  description: string;
  vpcId: string;
  rules: SecurityGroupRuleConfig[];
}

export class SecurityGroupModule extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupModuleProps) {
    super(scope, id);

    // Create security group
    this.securityGroup = new SecurityGroup(this, 'sg', {
      name: `${props.project}-${props.environment}-${props.name}-sg`,
      description: props.description,
      vpcId: props.vpcId,
      tags: {
        Name: `${props.project}-${props.environment}-${props.name}-sg`,
        Project: props.project,
        Environment: props.environment,
      },
    });

    // Create security group rules
    props.rules.forEach((rule, index) => {
      new AwsSecurityGroupRule(this, `sg-rule-${index}`, {
        // Using renamed import
        type: rule.type,
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        securityGroupId: this.securityGroup.id,
        cidrBlocks: rule.cidrBlocks,
        sourceSecurityGroupId: rule.sourceSecurityGroupId,
      });
    });
  }
}

// EC2 Module - Creates EC2 instances
export interface Ec2ModuleProps {
  project: string;
  environment: string;
  instanceType: string;
  subnetId: string;
  securityGroupIds: string[];
  instanceProfile: IamInstanceProfile;
  keyName?: string;
}

export class Ec2Module extends Construct {
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
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

    // Create EC2 instance
    const instanceConfig: any = {
      ami: ami.id,
      instanceType: props.instanceType,
      subnetId: props.subnetId,
      vpcSecurityGroupIds: props.securityGroupIds,
      iamInstanceProfile: props.instanceProfile.name,
      userData: `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
`,
      tags: {
        Name: `${props.project}-${props.environment}-instance`,
        Project: props.project,
        Environment: props.environment,
      },
    };

    // Only add keyName if provided
    if (props.keyName) {
      instanceConfig.keyName = props.keyName;
    }

    this.instance = new Instance(this, 'instance', instanceConfig);
  }
}

// RDS Module - Creates encrypted RDS instance
export interface RdsModuleProps {
  project: string;
  environment: string;
  engine: string;
  engineVersion: string;
  instanceClass: string;
  allocatedStorage: number;
  dbName: string;
  username: string;
  password: string;
  subnetIds: string[];
  securityGroupIds: string[];
  kmsKey: KmsKey;
}

export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly subnetGroup: DbSubnetGroup;
  public readonly generatedPassword: Password; // Add this

  constructor(scope: Construct, id: string, props: RdsModuleProps) {
    super(scope, id);

    // Generate a random password that meets AWS requirements
    this.generatedPassword = new Password(this, 'db-password', {
      length: 16,
      special: true,
      // Exclude forbidden characters: /, @, ", and space
      overrideSpecial: '!#$%&*()-_=+[]{}<>:?',
      minLower: 1,
      minUpper: 1,
      minNumeric: 1,
      minSpecial: 1,
    });

    // Create DB subnet group
    this.subnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${props.project}-${props.environment}-db-subnet-group-v2`,
      subnetIds: props.subnetIds,
      tags: {
        Name: `${props.project}-${props.environment}-db-subnet-group`,
        Project: props.project,
        Environment: props.environment,
      },
    });

    this.dbInstance = new DbInstance(this, 'db-instance', {
      identifier: `${props.project}-${props.environment}-db-ts`,
      engine: props.engine,
      engineVersion: props.engineVersion,
      instanceClass: props.instanceClass,
      allocatedStorage: props.allocatedStorage,
      dbName: props.dbName,
      username: props.username,
      password: this.generatedPassword.result, // Use generated password
      dbSubnetGroupName: this.subnetGroup.name,
      vpcSecurityGroupIds: props.securityGroupIds,
      storageEncrypted: true,
      kmsKeyId: props.kmsKey.arn,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      deletionProtection: false,
      publiclyAccessible: false,
      tags: {
        Name: `${props.project}-${props.environment}-db`,
        Project: props.project,
        Environment: props.environment,
      },
    });
  }
}
