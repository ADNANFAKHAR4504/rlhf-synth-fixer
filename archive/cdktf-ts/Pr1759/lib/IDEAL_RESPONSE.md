## lib/modules.ts

```typescript
import { Construct } from 'constructs';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { cloudtrail } from '@cdktf/provider-aws';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule as AwsSecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule'; // Renamed to avoid conflict
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { Password } from '@cdktf/provider-random/lib/password';

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
    this.instance = new Instance(this, 'instance', {
      ami: ami.id,
      instanceType: props.instanceType,
      subnetId: props.subnetId,
      vpcSecurityGroupIds: props.securityGroupIds,
      iamInstanceProfile: props.instanceProfile.name,
      keyName: props.keyName,
      userData: `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
`,
      tags: {
        Name: `${props.project}-${props.environment}-instance`,
        Project: props.project,
        Environment: props.environment,
      },
    });
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

```

## lib/tap-stack.ts

```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { RandomProvider } from '@cdktf/provider-random/lib/provider'; // Add this line
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { Construct } from 'constructs';

// Import your modules
import {
  KmsModule,
  S3Module,
  CloudTrailModule,
  IamModule,
  VpcModule,
  SecurityGroupModule,
  Ec2Module,
  RdsModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
  // Add this for testing - allows overriding the region override
  _regionOverrideForTesting?: string | null;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.
const AWS_REGION_OVERRIDE = 'us-east-1';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Use the testing override if provided, otherwise use the constant
    const regionOverride =
      props?._regionOverrideForTesting !== undefined
        ? props._regionOverrideForTesting
        : AWS_REGION_OVERRIDE;

    const awsRegion = regionOverride
      ? regionOverride
      : props?.awsRegion || 'us-east-1';

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider - this expects AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to be set in the environment
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Add Random Provider - ADD THIS
    new RandomProvider(this, 'random');

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

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

    // Instantiate your modules here
    const project = 'tap-project'; // You can make this configurable

    // Create KMS key for encryption
    const kmsModule = new KmsModule(this, 'kms', {
      project,
      environment: environmentSuffix,
      description: `KMS key for ${project} ${environmentSuffix} environment`,
      accountId: current.accountId, // Add this
    });

    // Create S3 bucket for application data
    const s3Module = new S3Module(this, 's3-app-data', {
      project,
      environment: environmentSuffix,
      bucketName: `${project}-${environmentSuffix}-app-data`,
      kmsKey: kmsModule.key,
    });

    // Create CloudTrail for auditing
    const cloudTrailModule = new CloudTrailModule(this, 'cloudtrail', {
      project,
      environment: environmentSuffix,
      kmsKey: kmsModule.key,
      accountId: current.accountId, // Add this
      region: awsRegion, // Add this
    });

    // Create IAM role and instance profile for EC2
    const iamModule = new IamModule(this, 'iam', {
      project,
      environment: environmentSuffix,
      appDataBucketArn: s3Module.bucket.arn,
    });

    // Create VPC with public and private subnets
    const vpcModule = new VpcModule(this, 'vpc', {
      project,
      environment: environmentSuffix,
      cidrBlock: '10.0.0.0/16',
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`], // Adjust based on your region
    });

    // Create security group for EC2 instances
    const ec2SecurityGroup = new SecurityGroupModule(this, 'ec2-sg', {
      project,
      environment: environmentSuffix,
      name: 'ec2',
      description: 'Security group for EC2 instances',
      vpcId: vpcModule.vpc.id,
      rules: [
        {
          type: 'ingress',
          fromPort: 22,
          toPort: 22,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'], // Consider restricting this in production
        },
        {
          type: 'egress',
          fromPort: 0,
          toPort: 65535,
          protocol: 'tcp',
          cidrBlocks: ['0.0.0.0/0'],
        },
      ],
    });

    // Create security group for RDS
    const rdsSecurityGroup = new SecurityGroupModule(this, 'rds-sg', {
      project,
      environment: environmentSuffix,
      name: 'rds',
      description: 'Security group for RDS instances',
      vpcId: vpcModule.vpc.id,
      rules: [
        {
          type: 'ingress',
          fromPort: 3306,
          toPort: 3306,
          protocol: 'tcp',
          sourceSecurityGroupId: ec2SecurityGroup.securityGroup.id,
        },
      ],
    });

    // Create EC2 instance
    const ec2Module = new Ec2Module(this, 'ec2', {
      project,
      environment: environmentSuffix,
      instanceType: 't3.micro',
      subnetId: vpcModule.privateSubnets[0].id, // Deploy in private subnet
      securityGroupIds: [ec2SecurityGroup.securityGroup.id],
      instanceProfile: iamModule.instanceProfile,
      keyName: 'compute-key', // Uncomment and set if you have a key pair
    });

    // Update the RDS module instantiation
    const rdsModule = new RdsModule(this, 'rds', {
      project,
      environment: environmentSuffix,
      engine: 'mysql',
      engineVersion: '8.0',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: 'appdb',
      username: 'admin',
      password: '', // This will be ignored since we're generating it in the module
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [rdsSecurityGroup.securityGroup.id],
      kmsKey: kmsModule.key,
    });

    // Outputs for reference
    new TerraformOutput(this, 'vpc-id', {
      value: vpcModule.vpc.id,
      description: 'VPC ID',
    });

    new TerraformOutput(this, 'public-subnet-ids', {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: 'Public subnet IDs',
    });

    new TerraformOutput(this, 'private-subnet-ids', {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: 'Private subnet IDs',
    });

    new TerraformOutput(this, 'ec2-instance-id', {
      value: ec2Module.instance.id,
      description: 'EC2 instance ID',
    });

    new TerraformOutput(this, 'ec2-private-ip', {
      value: ec2Module.instance.privateIp,
      description: 'EC2 instance private IP address',
    });

    new TerraformOutput(this, 's3-bucket-name', {
      value: s3Module.bucket.bucket,
      description: 'S3 bucket name for application data',
    });

    new TerraformOutput(this, 'cloudtrail-s3-bucket-name', {
      value: cloudTrailModule.logsBucket.bucket,
      description: 'S3 bucket name for CloudTrail logs',
    });

    new TerraformOutput(this, 'ec2-security-group-id', {
      value: ec2SecurityGroup.securityGroup.id,
      description: 'EC2 Security Group ID',
    });

    new TerraformOutput(this, 'rds-security-group-id', {
      value: rdsSecurityGroup.securityGroup.id,
      description: 'RDS Security Group ID',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.key.keyId,
      description: 'KMS key ID',
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: kmsModule.key.arn,
      description: 'KMS key ARN',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });

    // Add output for the generated password
    new TerraformOutput(this, 'rds-password', {
      value: rdsModule.generatedPassword.result,
      description: 'RDS instance password',
      sensitive: true, // Mark as sensitive to hide in logs
    });

    // ? Add your stack instantiations here
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}

```
