## modules.ts

```typescript

import { Construct } from 'constructs';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';

import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';

import { Instance } from '@cdktf/provider-aws/lib/instance';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { Cloudtrail } from '@cdktf/provider-aws/lib/cloudtrail';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { IamPolicy } from '@cdktf/provider-aws/lib/iam-policy';

import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
// KMS Module
interface KmsModuleProps {
  project: string;
  environment: string;
  description: string;
  accountId: string;
}

export class KmsModule extends Construct {
  public readonly key: KmsKey;
  public readonly alias: KmsAlias;

  constructor(scope: Construct, id: string, props: KmsModuleProps) {
    super(scope, id);

    const { project, environment, description, accountId } = props;

    // Create KMS key
    this.key = new KmsKey(this, 'key', {
      description,
      keyUsage: 'ENCRYPT_DECRYPT',
      customerMasterKeySpec: 'SYMMETRIC_DEFAULT', // Fixed: use customerMasterKeySpec instead of keySpec
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
        Name: `${project}-${environment}-kms-key`,
        Project: project,
        Environment: environment,
      },
    });

    // Create KMS alias
    this.alias = new KmsAlias(this, 'alias', {
      name: `alias/${project}-${environment}-key`,
      targetKeyId: this.key.keyId,
    });
  }
}

interface S3ModuleProps {
  project: string;
  environment: string;
  bucketName: string;
  kmsKey: KmsKey;
  isPublic?: boolean;
}

// S3 Module - Updated version
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    const {
      project,
      environment,
      bucketName,
      kmsKey,
      isPublic = false,
    } = props;

    // Create S3 bucket
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: bucketName,
      tags: {
        Name: bucketName,
        Project: project,
        Environment: environment,
      },
    });

    // Enable versioning
    new S3BucketVersioningA(this, 'versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Configure server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: kmsKey.arn,
            sseAlgorithm: 'aws:kms',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Configure public access block FIRST
    const publicAccessBlock = new S3BucketPublicAccessBlock(
      this,
      'public-access-block',
      {
        bucket: this.bucket.id,
        blockPublicAcls: !isPublic,
        blockPublicPolicy: !isPublic, // This is the key setting
        ignorePublicAcls: !isPublic,
        restrictPublicBuckets: !isPublic,
      }
    );

    // If public bucket, add public read policy AFTER public access block
    if (isPublic) {
      new S3BucketPolicy(this, 'public-policy', {
        bucket: this.bucket.id,
        dependsOn: [publicAccessBlock], // Ensure proper ordering
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'PublicReadGetObject',
              Effect: 'Allow',
              Principal: '*',
              Action: 's3:GetObject',
              Resource: `${this.bucket.arn}/*`,
            },
          ],
        }),
      });
    }
  }
}

// CloudTrail Module
interface CloudTrailModuleProps {
  project: string;
  environment: string;
  kmsKey: KmsKey;
  accountId: string;
  region: string;
}

export class CloudTrailModule extends Construct {
  public readonly logsBucket: S3Bucket;
  public readonly trail: Cloudtrail;

  constructor(scope: Construct, id: string, props: CloudTrailModuleProps) {
    super(scope, id);

    const { project, environment, kmsKey } = props;

    // Create S3 bucket for CloudTrail logs
    this.logsBucket = new S3Bucket(this, 'logs-bucket', {
      bucket: `${project}-${environment}-cloudtrail-logs`,
      tags: {
        Name: `${project}-${environment}-cloudtrail-logs`,
        Project: project,
        Environment: environment,
      },
    });

    // CloudTrail bucket policy
    new S3BucketPolicy(this, 'logs-bucket-policy', {
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
              },
            },
          },
        ],
      }),
    });

    // Create CloudTrail
    this.trail = new Cloudtrail(this, 'trail', {
      name: `${project}-${environment}-cloudtrail`,
      s3BucketName: this.logsBucket.bucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogging: true,
      kmsKeyId: kmsKey.arn,
      tags: {
        Name: `${project}-${environment}-cloudtrail`,
        Project: project,
        Environment: environment,
      },
    });
  }
}

// IAM Module
interface IamModuleProps {
  project: string;
  environment: string;
  appDataBucketArn: string;
}

export class IamModule extends Construct {
  public readonly role: IamRole;
  public readonly instanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: IamModuleProps) {
    super(scope, id);

    const { project, environment, appDataBucketArn } = props;

    // Create IAM role for EC2
    this.role = new IamRole(this, 'ec2-role', {
      name: `${project}-${environment}-ec2-role`,
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
        Name: `${project}-${environment}-ec2-role`,
        Project: project,
        Environment: environment,
      },
    });

    // Create custom policy for S3 access
    const s3Policy = new IamPolicy(this, 's3-policy', {
      name: `${project}-${environment}-s3-policy`,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: [
              's3:GetObject',
              's3:PutObject',
              's3:DeleteObject',
              's3:ListBucket',
            ],
            Resource: [appDataBucketArn, `${appDataBucketArn}/*`],
          },
        ],
      }),
    });

    // Attach policies to role
    new IamRolePolicyAttachment(this, 'ssm-policy-attachment', {
      role: this.role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    new IamRolePolicyAttachment(this, 's3-policy-attachment', {
      role: this.role.name,
      policyArn: s3Policy.arn,
    });

    // Create instance profile
    this.instanceProfile = new IamInstanceProfile(this, 'instance-profile', {
      name: `${project}-${environment}-instance-profile`,
      role: this.role.name,
    });
  }
}

// VPC Module
interface VpcModuleProps {
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
  public readonly natGateways: NatGateway[];

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    const { project, environment, cidrBlock, availabilityZones } = props;

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${project}-${environment}-vpc`,
        Project: project,
        Environment: environment,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${project}-${environment}-igw`,
        Project: project,
        Environment: environment,
      },
    });

    // Create public subnets
    this.publicSubnets = availabilityZones.map((az, index) => {
      return new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${project}-${environment}-public-subnet-${index + 1}`,
          Project: project,
          Environment: environment,
          Type: 'Public',
        },
      });
    });

    // Create private subnets
    this.privateSubnets = availabilityZones.map((az, index) => {
      return new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 10}.0/24`,
        availabilityZone: az,
        tags: {
          Name: `${project}-${environment}-private-subnet-${index + 1}`,
          Project: project,
          Environment: environment,
          Type: 'Private',
        },
      });
    });

    // Create Elastic IPs for NAT Gateways
    const eips = this.publicSubnets.map((_, index) => {
      return new Eip(this, `nat-eip-${index}`, {
        domain: 'vpc',
        tags: {
          Name: `${project}-${environment}-nat-eip-${index + 1}`,
          Project: project,
          Environment: environment,
        },
      });
    });

    // Create NAT Gateways
    this.natGateways = this.publicSubnets.map((subnet, index) => {
      return new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eips[index].id,
        subnetId: subnet.id,
        tags: {
          Name: `${project}-${environment}-nat-gateway-${index + 1}`,
          Project: project,
          Environment: environment,
        },
      });
    });

    // Create route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${project}-${environment}-public-rt`,
        Project: project,
        Environment: environment,
      },
    });

    // Add route to internet gateway
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

    // Create route tables for private subnets
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `${project}-${environment}-private-rt-${index + 1}`,
          Project: project,
          Environment: environment,
        },
      });

      // Add route to NAT gateway
      new Route(this, `private-route-${index}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[index].id,
      });

      // Associate private subnet with private route table
      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}

// Security Group Module
interface CustomSecurityGroupRule {
  // Fixed: renamed interface to avoid conflict
  type: 'ingress' | 'egress';
  fromPort: number;
  toPort: number;
  protocol: string;
  cidrBlocks?: string[];
  sourceSecurityGroupId?: string;
}

interface SecurityGroupModuleProps {
  project: string;
  environment: string;
  name: string;
  description: string;
  vpcId: string;
  rules: CustomSecurityGroupRule[];
}

export class SecurityGroupModule extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupModuleProps) {
    super(scope, id);

    const { project, environment, name, description, vpcId, rules } = props;

    // Create security group
    this.securityGroup = new SecurityGroup(this, 'sg', {
      name: `${project}-${environment}-${name}-sg`,
      description,
      vpcId,
      tags: {
        Name: `${project}-${environment}-${name}-sg`,
        Project: project,
        Environment: environment,
      },
    });

    // Create security group rules
    rules.forEach((rule, index) => {
      new SecurityGroupRule(this, `rule-${index}`, {
        // Fixed: use aliased import
        type: rule.type,
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        sourceSecurityGroupId: rule.sourceSecurityGroupId,
        securityGroupId: this.securityGroup.id,
      });
    });
  }
}

// EC2 Module
interface Ec2ModuleProps {
  project: string;
  environment: string;
  instanceType: string;
  subnetId: string;
  securityGroupIds: string[];
  instanceProfile: IamInstanceProfile;
  keyName?: string;
  userData?: string;
}

export class Ec2Module extends Construct {
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
    super(scope, id);

    const {
      project,
      environment,
      instanceType,
      subnetId,
      securityGroupIds,
      instanceProfile,
      keyName,
      userData,
    } = props;

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, 'ami', {
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
      instanceType,
      subnetId,
      vpcSecurityGroupIds: securityGroupIds,
      iamInstanceProfile: instanceProfile.name,
      keyName,
      userData,
      tags: {
        Name: `${project}-${environment}-${id}`,
        Project: project,
        Environment: environment,
      },
    });
  }
}

// RDS Module
interface RdsModuleProps {
  project: string;
  environment: string;
  engine: string;
  instanceClass: string;
  allocatedStorage: number;
  dbName: string;
  username: string;
  password: string;
  vpcId: string;
  subnetIds: string[];
  securityGroupIds: string[];
  kmsKey: KmsKey;
}

export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly subnetGroup: DbSubnetGroup;

  constructor(scope: Construct, id: string, props: RdsModuleProps) {
    super(scope, id);

    const {
      project,
      environment,
      engine,
      instanceClass,
      allocatedStorage,
      dbName,
      username,
      password,
      vpcId,
      subnetIds,
      securityGroupIds,
      kmsKey,
    } = props;

    // const vpcShortId = vpcId.substring(4, 12);
    const subnetGroupName = 'dev-db-sg';

    // Create DB subnet group
    this.subnetGroup = new DbSubnetGroup(this, 'subnet-group', {
      name: subnetGroupName,
      subnetIds,
      description: `Database subnet group for ${project} ${environment} in VPC ${vpcId}`,
      tags: {
        Name: 'dev-db-subnet-group',
        Project: project,
        Environment: environment,
        VpcId: vpcId,
      },
    });

    this.subnetGroup.addOverride('lifecycle', {
      create_before_destroy: true,
      prevent_destroy: false,
    });

    // Create RDS instance SECOND, depending on subnet group
    this.dbInstance = new DbInstance(this, 'db-instance', {
      identifier: `${project}-${environment}-db`,
      engine,
      instanceClass,
      allocatedStorage,
      dbName,
      username,
      password,
      dbSubnetGroupName: this.subnetGroup.name,
      vpcSecurityGroupIds: securityGroupIds,
      storageEncrypted: true,
      kmsKeyId: kmsKey.arn,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: true,
      deletionProtection: false,
      applyImmediately: true,
      tags: {
        Name: `${project}-${environment}-db`,
        Project: project,
        Environment: environment,
      },
      dependsOn: [this.subnetGroup], // RDS depends on subnet group
    });

    // Add lifecycle management to RDS instance
    this.dbInstance.addOverride('lifecycle', {
      prevent_destroy: false,
    });

    // REMOVED: The circular dependency line that was causing the issue
    // this.subnetGroup.addOverride('depends_on', [
    //   `aws_db_instance.${this.dbInstance.friendlyUniqueId}`,
    // ]);
  }
}
```

## tapstack.ts

```typescript

// tapstack.ts

import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import { S3Backend, TerraformStack, TerraformOutput } from 'cdktf';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

import { Construct } from 'constructs';

// Import your modules (you'll need to create these based on your requirements)
import {
  KmsModule,
  S3Module,
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
}

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Handle AWS_REGION_OVERRIDE environment variable
    const awsRegionOverride = process.env.AWS_REGION_OVERRIDE;
    const awsRegion =
      awsRegionOverride && awsRegionOverride.trim() !== ''
        ? awsRegionOverride.trim()
        : props?.awsRegion || 'us-east-1';

    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

    // Configure S3 Backend with native state locking
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });

    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // Instantiate your modules here
    const project = 'tap-project';

    // Create KMS key for encryption
    const kmsModule = new KmsModule(this, 'kms', {
      project,
      environment: environmentSuffix,
      description: `KMS key for ${project} ${environmentSuffix} environment`,
      accountId: current.accountId,
    });

    // Create S3 bucket for application data
    const s3Module = new S3Module(this, 's3-app-data', {
      project,
      environment: environmentSuffix,
      bucketName: `${project}-${environmentSuffix}-app-data`,
      kmsKey: kmsModule.key,
    });

    // Generate a random password for RDS - in production, use AWS Secrets Manager
    // For testing, we'll create a simple password that meets RDS requirements
    const dbPassword = `TempPass${environmentSuffix}123!`;

    // Create CloudTrail for auditing
    // const cloudTrailModule = new CloudTrailModule(this, 'cloudtrail', {
    //   project,
    //   environment: environmentSuffix,
    //   kmsKey: kmsModule.key,
    //   accountId: current.accountId,
    //   region: awsRegion,
    // });

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
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`],
    });

    // Create security group for public EC2 instances
    const publicEc2SecurityGroup = new SecurityGroupModule(
      this,
      'public-ec2-sg',
      {
        project,
        environment: environmentSuffix,
        name: 'public-ec2',
        description: 'Security group for public EC2 instances',
        vpcId: vpcModule.vpc.id,
        rules: [
          {
            type: 'ingress',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['203.0.113.0/24'], // SSH access from trusted IP range
          },
          {
            type: 'egress',
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
      }
    );

    // Create security group for private EC2 instances
    const privateEc2SecurityGroup = new SecurityGroupModule(
      this,
      'private-ec2-sg',
      {
        project,
        environment: environmentSuffix,
        name: 'private-ec2',
        description: 'Security group for private EC2 instances',
        vpcId: vpcModule.vpc.id,
        rules: [
          {
            type: 'ingress',
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            sourceSecurityGroupId: publicEc2SecurityGroup.securityGroup.id,
          },
          {
            type: 'egress',
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
          },
        ],
      }
    );

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
          fromPort: 5432,
          toPort: 5432,
          protocol: 'tcp',
          sourceSecurityGroupId: privateEc2SecurityGroup.securityGroup.id,
        },
      ],
    });

    // Create public S3 bucket for app assets
    const publicS3Module = new S3Module(this, 's3-public-assets', {
      project,
      environment: environmentSuffix,
      bucketName: `${project}-${environmentSuffix}-public-assets`,
      kmsKey: kmsModule.key,
      isPublic: true,
    });

    // Create private S3 bucket for internal data
    const privateS3Module = new S3Module(this, 's3-private-data', {
      project,
      environment: environmentSuffix,
      bucketName: `${project}-${environmentSuffix}-private-data`,
      kmsKey: kmsModule.key,
      isPublic: false,
    });

    // Create public EC2 instance
    const publicEc2Module = new Ec2Module(this, 'public-ec2', {
      project,
      environment: environmentSuffix,
      instanceType: 't3.micro',
      subnetId: vpcModule.publicSubnets[0].id,
      securityGroupIds: [publicEc2SecurityGroup.securityGroup.id],
      instanceProfile: iamModule.instanceProfile,
      // keyName: 'turing-key', // Optional: Replace with your key pair name if needed
      userData: `#!/bin/bash
        yum update -y
        # Add your initialization scripts here
      `,
    });

    // Create private EC2 instance
    const privateEc2Module = new Ec2Module(this, 'private-ec2', {
      project,
      environment: environmentSuffix,
      instanceType: 't3.micro',
      subnetId: vpcModule.privateSubnets[0].id,
      securityGroupIds: [privateEc2SecurityGroup.securityGroup.id],
      instanceProfile: iamModule.instanceProfile,
      // keyName: 'turing-key', // Optional: Replace with your key pair name if needed
    });

    // Create RDS instance
    const rdsModule = new RdsModule(this, 'rds', {
      project,
      environment: environmentSuffix,
      engine: 'postgres',
      instanceClass: 'db.t3.micro',
      allocatedStorage: 20,
      dbName: 'appdb',
      username: 'dbadmin',
      password: dbPassword,
      vpcId: vpcModule.vpc.id,
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

    new TerraformOutput(this, 'public-ec2-instance-id', {
      value: publicEc2Module.instance.id,
      description: 'Public EC2 instance ID',
    });

    new TerraformOutput(this, 'public-ec2-public-ip', {
      value: publicEc2Module.instance.publicIp,
      description: 'Public EC2 instance public IP address',
    });

    new TerraformOutput(this, 'private-ec2-instance-id', {
      value: privateEc2Module.instance.id,
      description: 'Private EC2 instance ID',
    });

    new TerraformOutput(this, 'private-ec2-private-ip', {
      value: privateEc2Module.instance.privateIp,
      description: 'Private EC2 instance private IP address',
    });

    new TerraformOutput(this, 'public-s3-bucket-name', {
      value: publicS3Module.bucket.bucket,
      description: 'Public S3 bucket name for app assets',
    });

    new TerraformOutput(this, 'private-s3-bucket-name', {
      value: privateS3Module.bucket.bucket,
      description: 'Private S3 bucket name for internal data',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.key.keyId,
      description: 'KMS key ID',
    });

    new TerraformOutput(this, 'aws-account-id', {
      value: current.accountId,
      description: 'Current AWS Account ID',
    });
  }
}
```