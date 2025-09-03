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
import { SecurityGroupRule as AwsSecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Construct } from 'constructs';

/* =========================
   KMS Module
   ========================= */
export interface KmsModuleProps {
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

    this.key = new KmsKey(this, 'kms-key', {
      description: props.description,
      keyUsage: 'ENCRYPT_DECRYPT',
      deletionWindowInDays: 7,
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: { AWS: `arn:aws:iam::${props.accountId}:root` },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudTrail to encrypt logs',
            Effect: 'Allow',
            Principal: { Service: 'cloudtrail.amazonaws.com' },
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

    this.alias = new KmsAlias(this, 'kms-alias', {
      name: `alias/${props.project}-${props.environment}-key`,
      targetKeyId: this.key.keyId,
    });
  }
}

/* =========================
   S3 Module
   ========================= */
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

    this.bucket = new S3Bucket(this, 's3-bucket', {
      bucket: props.bucketName,
      tags: {
        Name: props.bucketName,
        Project: props.project,
        Environment: props.environment,
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 's3-encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            kmsMasterKeyId: props.kmsKey.arn,
            sseAlgorithm: 'aws:kms',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, 's3-public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketVersioningA(this, 's3-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });
  }
}

/* =========================
   CloudTrail Module
   ========================= */
export interface CloudTrailModuleProps {
  project: string;
  environment: string;
  kmsKey: KmsKey;
  accountId: string;
  region: string;
  logsBucketName?: string; // optional pre-set name
}

export class CloudTrailModule extends Construct {
  public readonly trail: cloudtrail.Cloudtrail;
  public readonly logsBucket: S3Bucket;

  constructor(scope: Construct, id: string, props: CloudTrailModuleProps) {
    super(scope, id);

    // Deterministic, globally-unique-ish name: project-env-cloudtrail-region-account
    const derivedName =
      `${props.project}-${props.environment}-cloudtrail-${props.region}-${props.accountId}`
        .toLowerCase()
        .replace(/[^a-z0-9.-]/g, '')
        .slice(0, 63)
        .replace(/^[.-]+|[.-]+$/g, '');

    const logsBucketName = props.logsBucketName || derivedName;

    this.logsBucket = new S3Bucket(this, 'cloudtrail-logs-bucket', {
      bucket: logsBucketName,
      forceDestroy: true, // <-- critical fix so bucket can be destroyed when non-empty
      tags: {
        Name: logsBucketName,
        Project: props.project,
        Environment: props.environment,
      },
    });

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

    new S3BucketPublicAccessBlock(this, 'logs-bucket-public-access-block', {
      bucket: this.logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    const bucketPolicy = new S3BucketPolicy(this, 'cloudtrail-bucket-policy', {
      bucket: this.logsBucket.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'AWSCloudTrailAclCheck',
            Effect: 'Allow',
            Principal: { Service: 'cloudtrail.amazonaws.com' },
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
            Principal: { Service: 'cloudtrail.amazonaws.com' },
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
            Principal: { Service: 'cloudtrail.amazonaws.com' },
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
      dependsOn: [bucketPolicy],
    });
  }
}

/* =========================
   IAM Module
   ========================= */
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

    // Use namePrefix to avoid collisions (Terraform appends a unique suffix)
    this.role = new IamRole(this, 'ec2-role', {
      namePrefix: `${props.project}-${props.environment}-ec2-role-`,
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' },
          },
        ],
      }),
      tags: {
        Name: `${props.project}-${props.environment}-ec2-role`,
        Project: props.project,
        Environment: props.environment,
      },
    });

    new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
      role: this.role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

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

    // Use namePrefix here too
    this.instanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        namePrefix: `${props.project}-${props.environment}-ec2-profile-`,
        role: this.role.name,
      }
    );
  }
}

/* =========================
   VPC Module
   ========================= */
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

    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.project}-${props.environment}-igw`,
        Project: props.project,
        Environment: props.environment,
      },
    });

    this.publicSubnets = [];
    this.privateSubnets = [];

    props.availabilityZones.forEach((az, index) => {
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

    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });
  }
}

/* =========================
   Security Group Module
   ========================= */
export interface SecurityGroupRuleConfig {
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

    props.rules.forEach((rule, index) => {
      new AwsSecurityGroupRule(this, `sg-rule-${index}`, {
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

/* =========================
   EC2 Module
   ========================= */
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

    const ami = new DataAwsAmi(this, 'amazon-linux', {
      mostRecent: true,
      owners: ['amazon'],
      filter: [
        { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
        { name: 'virtualization-type', values: ['hvm'] },
      ],
    });

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

/* =========================
   RDS Module
   ========================= */
export interface RdsModuleProps {
  project: string;
  environment: string;
  engine: string;
  engineVersion: string;
  instanceClass: string;
  allocatedStorage: number;
  dbName: string;
  username: string;
  password: string; // ensure ≤ 41 chars; handled in stack
  subnetIds: string[];
  securityGroupIds: string[];
  kmsKey: KmsKey;
}

export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly subnetGroup: DbSubnetGroup;

  constructor(scope: Construct, id: string, props: RdsModuleProps) {
    super(scope, id);

    this.subnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${props.project}-${props.environment}-db-subnet-group`,
      subnetIds: props.subnetIds,
      tags: {
        Name: `${props.project}-${props.environment}-db-subnet-group`,
        Project: props.project,
        Environment: props.environment,
      },
    });

    this.dbInstance = new DbInstance(this, 'db-instance', {
      identifier: `${props.project}-${props.environment}-db`,
      engine: props.engine,
      engineVersion: props.engineVersion,
      instanceClass: props.instanceClass,
      allocatedStorage: props.allocatedStorage,
      dbName: props.dbName,
      username: props.username,
      password: props.password,
      dbSubnetGroupName: this.subnetGroup.name,
      vpcSecurityGroupIds: props.securityGroupIds,
      storageEncrypted: true,
      kmsKeyId: props.kmsKey.arn,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${props.project}-${props.environment}-db-final-snapshot`,
      deletionProtection: true,
      publiclyAccessible: false,
      tags: {
        Name: `${props.project}-${props.environment}-db`,
        Project: props.project,
        Environment: props.environment,
      },
    });
  }
}
