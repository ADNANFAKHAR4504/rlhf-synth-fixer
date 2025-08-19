I'll create a production-ready Terraform CDK infrastructure with TypeScript that meets all your security requirements and follows the specified modular structure.

## lib/modules.ts

```typescript
import { Construct } from 'constructs';
import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';
import { Instance } from '@cdktf/provider-aws/lib/instance';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';
import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { cloudtrail } from '@cdktf/provider-aws';
import { S3BucketPolicy } from '@cdktf/provider-aws/lib/s3-bucket-policy';
import { Lb } from '@cdktf/provider-aws/lib/lb';
import { LbTargetGroup } from '@cdktf/provider-aws/lib/lb-target-group';
import { LbListener } from '@cdktf/provider-aws/lib/lb-listener';
import { LbTargetGroupAttachment } from '@cdktf/provider-aws/lib/lb-target-group-attachment';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';
import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';
import { NatGateway } from '@cdktf/provider-aws/lib/nat-gateway';
import { Eip } from '@cdktf/provider-aws/lib/eip';

// Interface definitions for module configurations
export interface VpcModuleConfig {
  name: string;
  cidrBlock: string;
  enableDnsHostnames: boolean;
  enableDnsSupport: boolean;
  availabilityZones: string[]; // Add this field
}

export interface SecurityGroupModuleConfig {
  name: string;
  description: string;
  vpcId: string;
  ingressRules: Array<{
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrBlocks?: string[];
    sourceSecurityGroupId?: string;
    description: string;
  }>;
  egressRules: Array<{
    fromPort: number;
    toPort: number;
    protocol: string;
    cidrBlocks?: string[];
    description: string;
  }>;
}

export interface KmsModuleConfig {
  name: string;
  description: string;
  enableKeyRotation: boolean;
  accountId: string;
}

export interface S3ModuleConfig {
  bucketName: string;
  enableVersioning: boolean;
  kmsKeyId: string;
}

export interface RdsModuleConfig {
  identifier: string;
  engine: string;
  engineVersion: string;
  instanceClass: string;
  allocatedStorage: number;
  dbName: string;
  username: string;
  password: string;
  vpcSecurityGroupIds: string[];
  dbSubnetGroupName: string;
  kmsKeyId: string;
  backupRetentionPeriod: number;
  storageEncrypted: boolean;
}

export interface Ec2ModuleConfig {
  name: string;
  instanceType: string;
  subnetId: string;
  securityGroupIds: string[];
  userData?: string;
  keyName?: string;
}

export interface AlbModuleConfig {
  name: string;
  subnets: string[];
  securityGroups: string[];
  targetGroupName: string;
  targetGroupPort: number;
  vpcId: string;
}

export interface CloudTrailModuleConfig {
  name: string;
  s3BucketName: string;
  includeGlobalServiceEvents: boolean;
  isMultiRegionTrail: boolean;
}

/**
 * VPC Module - Creates VPC with public and private subnets
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateways: NatGateway[];

  constructor(
    scope: Construct,
    id: string,
    config: VpcModuleConfig & { availabilityZones: string[] }
  ) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: config.enableDnsHostnames,
      enableDnsSupport: config.enableDnsSupport,
      tags: {
        Name: config.name,
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-igw`,
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      },
    });

    // Create public subnets (2 AZs)
    this.publicSubnets = [];
    const publicSubnetCidrs = ['10.0.1.0/24', '10.0.2.0/24'];

    for (let i = 0; i < 2; i++) {
      const publicSubnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: publicSubnetCidrs[i],
        availabilityZone: config.availabilityZones[i], // Use hardcoded AZ
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `${config.name}-public-subnet-${i + 1}`,
          Type: 'Public',
          Environment: 'production',
          ManagedBy: 'terraform-cdk',
        },
      });
      this.publicSubnets.push(publicSubnet);
    }

    // Create private subnets (2 AZs)
    this.privateSubnets = [];
    const privateSubnetCidrs = ['10.0.10.0/24', '10.0.20.0/24'];

    for (let i = 0; i < 2; i++) {
      const privateSubnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: privateSubnetCidrs[i],
        availabilityZone: config.availabilityZones[i], // Use hardcoded AZ
        mapPublicIpOnLaunch: false,
        tags: {
          Name: `${config.name}-private-subnet-${i + 1}`,
          Type: 'Private',
          Environment: 'production',
          ManagedBy: 'terraform-cdk',
        },
      });
      this.privateSubnets.push(privateSubnet);
    }

    // Create Elastic IPs for NAT Gateways
    const eips = [];
    for (let i = 0; i < 2; i++) {
      const eip = new Eip(this, `nat-eip-${i}`, {
        domain: 'vpc',
        tags: {
          Name: `${config.name}-nat-eip-${i + 1}`,
          Environment: 'production',
          ManagedBy: 'terraform-cdk',
        },
      });
      eips.push(eip);
    }

    // Create NAT Gateways
    this.natGateways = [];
    for (let i = 0; i < 2; i++) {
      const natGateway = new NatGateway(this, `nat-gateway-${i}`, {
        allocationId: eips[i].id,
        subnetId: this.publicSubnets[i].id,
        tags: {
          Name: `${config.name}-nat-gateway-${i + 1}`,
          Environment: 'production',
          ManagedBy: 'terraform-cdk',
        },
      });
      this.natGateways.push(natGateway);
    }

    // Create route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.name}-public-rt`,
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      },
    });

    // Create route to internet gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    for (let i = 0; i < this.publicSubnets.length; i++) {
      new RouteTableAssociation(this, `public-rt-association-${i}`, {
        subnetId: this.publicSubnets[i].id,
        routeTableId: publicRouteTable.id,
      });
    }

    // Create route tables for private subnets
    for (let i = 0; i < this.privateSubnets.length; i++) {
      const privateRouteTable = new RouteTable(this, `private-rt-${i}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `${config.name}-private-rt-${i + 1}`,
          Environment: 'production',
          ManagedBy: 'terraform-cdk',
        },
      });

      // Create route to NAT gateway
      new Route(this, `private-route-${i}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        natGatewayId: this.natGateways[i].id,
      });

      // Associate private subnet with private route table
      new RouteTableAssociation(this, `private-rt-association-${i}`, {
        subnetId: this.privateSubnets[i].id,
        routeTableId: privateRouteTable.id,
      });
    }
  }
}

/**
 * KMS Module - Creates customer-managed KMS key with automatic rotation
 */
export class KmsModule extends Construct {
  public readonly kmsKey: KmsKey;
  public readonly kmsAlias: KmsAlias;

  constructor(scope: Construct, id: string, config: KmsModuleConfig) {
    super(scope, id);

    // Create KMS key with automatic rotation
    this.kmsKey = new KmsKey(this, 'kms-key', {
      description: config.description,
      enableKeyRotation: config.enableKeyRotation,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${config.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: config.name,
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      },
    });

    // Create KMS alias for easier reference
    this.kmsAlias = new KmsAlias(this, 'kms-alias', {
      name: `alias/${config.name}`,
      targetKeyId: this.kmsKey.keyId,
    });
  }
}

/**
 * Security Group Module - Creates security groups with strict ingress/egress rules
 */
export class SecurityGroupModule extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupModuleConfig) {
    super(scope, id);

    // Create security group
    this.securityGroup = new SecurityGroup(this, 'security-group', {
      name: config.name,
      description: config.description,
      vpcId: config.vpcId,
      tags: {
        Name: config.name,
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      },
    });

    // Create ingress rules
    config.ingressRules.forEach((rule, index) => {
      new SecurityGroupRule(this, `ingress-rule-${index}`, {
        type: 'ingress',
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        sourceSecurityGroupId: rule.sourceSecurityGroupId,
        securityGroupId: this.securityGroup.id,
        description: rule.description,
      });
    });

    // Create egress rules
    config.egressRules.forEach((rule, index) => {
      new SecurityGroupRule(this, `egress-rule-${index}`, {
        type: 'egress',
        fromPort: rule.fromPort,
        toPort: rule.toPort,
        protocol: rule.protocol,
        cidrBlocks: rule.cidrBlocks,
        securityGroupId: this.securityGroup.id,
        description: rule.description,
      });
    });
  }
}

/**
 * S3 Module - Creates encrypted S3 bucket with versioning and public access blocked
 */
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketEncryption: S3BucketServerSideEncryptionConfigurationA;
  public readonly bucketVersioning: S3BucketVersioningA;
  public readonly bucketPublicAccessBlock: S3BucketPublicAccessBlock;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Create S3 bucket
    this.bucket = new S3Bucket(this, 's3-bucket', {
      bucket: config.bucketName,
      tags: {
        Name: config.bucketName,
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      },
    });

    // Configure server-side encryption with KMS
    this.bucketEncryption = new S3BucketServerSideEncryptionConfigurationA(
      this,
      'bucket-encryption',
      {
        bucket: this.bucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: config.kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Enable versioning if specified
    if (config.enableVersioning) {
      this.bucketVersioning = new S3BucketVersioningA(
        this,
        'bucket-versioning',
        {
          bucket: this.bucket.id,
          versioningConfiguration: {
            status: 'Enabled',
          },
        }
      );
    }

    // Block public access
    this.bucketPublicAccessBlock = new S3BucketPublicAccessBlock(
      this,
      'bucket-public-access-block',
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      }
    );
  }
}

/**
 * RDS Module - Creates encrypted RDS instance in private subnet
 */
export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;

  constructor(
    scope: Construct,
    id: string,
    config: RdsModuleConfig,
    subnetIds: string[]
  ) {
    super(scope, id);

    // Create DB subnet group
    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: config.dbSubnetGroupName,
      subnetIds: subnetIds,
      tags: {
        Name: config.dbSubnetGroupName,
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      },
    });

    // Create RDS instance with encryption
    this.dbInstance = new DbInstance(this, 'db-instance', {
      identifier: config.identifier,
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      dbName: config.dbName,
      username: config.username,
      password: config.password,
      vpcSecurityGroupIds: config.vpcSecurityGroupIds,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      storageEncrypted: config.storageEncrypted,
      kmsKeyId: config.kmsKeyId,
      backupRetentionPeriod: config.backupRetentionPeriod,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${config.identifier}-final-snapshot-${Date.now()}`,
      deletionProtection: true,
      tags: {
        Name: config.identifier,
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      },
    });
  }
}

/**
 * EC2 Module - Creates EC2 instances in private subnets without public IPs
 */
export class Ec2Module extends Construct {
  public readonly instance: Instance;
  private readonly ami: DataAwsAmi;

  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    this.ami = new DataAwsAmi(this, 'amazon-linux-ami', {
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

    // Create EC2 instance in private subnet (no public IP)
    this.instance = new Instance(this, 'ec2-instance', {
      ami: this.ami.id,
      instanceType: config.instanceType,
      subnetId: config.subnetId,
      vpcSecurityGroupIds: config.securityGroupIds,
      associatePublicIpAddress: false,
      userData: config.userData,
      keyName: config.keyName,
      tags: {
        Name: config.name,
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      },
    });
  }
}

/**
 * Application Load Balancer Module
 */
export class AlbModule extends Construct {
  public readonly alb: Lb;
  public readonly targetGroup: LbTargetGroup;
  public readonly listener: LbListener;

  constructor(scope: Construct, id: string, config: AlbModuleConfig) {
    super(scope, id);

    // Create Application Load Balancer
    this.alb = new Lb(this, 'alb', {
      name: config.name,
      loadBalancerType: 'application',
      subnets: config.subnets,
      securityGroups: config.securityGroups,
      enableDeletionProtection: true,
      tags: {
        Name: config.name,
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      },
    });

    // Create target group
    this.targetGroup = new LbTargetGroup(this, 'target-group', {
      name: config.targetGroupName,
      port: config.targetGroupPort,
      protocol: 'HTTP',
      vpcId: config.vpcId,
      healthCheck: {
        enabled: true,
        path: '/health',
        protocol: 'HTTP',
        healthyThreshold: 2,
        unhealthyThreshold: 2,
        timeout: 5,
        interval: 30,
        matcher: '200',
      },
      tags: {
        Name: config.targetGroupName,
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
      },
    });

    // Create listener
    this.listener = new LbListener(this, 'listener', {
      loadBalancerArn: this.alb.arn,
      port: 80,
      protocol: 'HTTP',
      defaultAction: [
        {
          type: 'forward',
          targetGroupArn: this.targetGroup.arn,
        },
      ],
    });
  }

  public attachTarget(targetId: string, port: number): LbTargetGroupAttachment {
    return new LbTargetGroupAttachment(this, `target-attachment-${targetId}`, {
      targetGroupArn: this.targetGroup.arn,
      targetId: targetId,
      port: port,
    });
  }
}

/**
 * CloudTrail Module - Creates CloudTrail for audit logging
 */
export class CloudTrailModule extends Construct {
  public readonly cloudTrail: cloudtrail.Cloudtrail;
  public readonly s3BucketPolicy: S3BucketPolicy;

  constructor(scope: Construct, id: string, config: CloudTrailModuleConfig) {
    super(scope, id);

    // Create S3 bucket policy for CloudTrail
    this.s3BucketPolicy = new S3BucketPolicy(this, 'cloudtrail-bucket-policy', {
      bucket: config.s3BucketName,
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
            Resource: `arn:aws:s3:::${config.s3BucketName}`,
          },
          {
            Sid: 'AWSCloudTrailWrite',
            Effect: 'Allow',
            Principal: {
              Service: 'cloudtrail.amazonaws.com',
            },
            Action: 's3:PutObject',
            Resource: `arn:aws:s3:::${config.s3BucketName}/*`,
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
    this.cloudTrail = new cloudtrail.Cloudtrail(this, 'cloudtrail', {
      name: config.name,
      s3BucketName: config.s3BucketName,
      includeGlobalServiceEvents: config.includeGlobalServiceEvents,
      isMultiRegionTrail: config.isMultiRegionTrail,
      enableLogging: true,
      tags: {
        Name: config.name,
        Environment: 'production',
        ManagedBy: 'terraform-cdk',
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
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import { LbTargetGroupAttachment } from '@cdktf/provider-aws/lib/lb-target-group-attachment';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import {
  VpcModule,
  KmsModule,
  SecurityGroupModule,
  S3Module,
  RdsModule,
  Ec2Module,
  AlbModule,
  CloudTrailModule,
} from './modules';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

const AWS_REGION_OVERRIDE = '';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';
    const awsRegion = AWS_REGION_OVERRIDE
      ? AWS_REGION_OVERRIDE
      : props?.awsRegion || 'us-east-1';
    const stateBucketRegion = props?.stateBucketRegion || 'us-east-1';
    const stateBucket = props?.stateBucket || 'iac-rlhf-tf-states';
    const defaultTags = props?.defaultTags ? [props.defaultTags] : [];

    // Configure AWS Provider
    new AwsProvider(this, 'aws', {
      region: awsRegion,
      defaultTags: defaultTags,
    });

    // Get current AWS account information
    const current = new DataAwsCallerIdentity(this, 'current');

    // Configure S3 Backend
    new S3Backend(this, {
      bucket: stateBucket,
      key: `${environmentSuffix}/${id}.tfstate`,
      region: stateBucketRegion,
      encrypt: true,
    });
    this.addOverride('terraform.backend.s3.use_lockfile', true);

    // 1. Create VPC with public and private subnets
    const vpcModule = new VpcModule(this, 'vpc-module', {
      name: 'secure-app-vpc',
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      availabilityZones: [`${awsRegion}a`, `${awsRegion}b`], // Hardcoded AZs based on region
    });
    // 2. Create KMS Key for encryption with automatic rotation
    const kmsModule = new KmsModule(this, 'app-kms-module', {
      name: 'app-kms-key',
      description: 'KMS key for application encryption with automatic rotation',
      enableKeyRotation: true,
      accountId: current.accountId,
    });

    // 3. Create S3 bucket for CloudTrail logs
    const cloudTrailS3Module = new S3Module(this, 'cloudtrail-s3-module', {
      bucketName: `secure-app-cloudtrail-logs-${environmentSuffix}-${current.accountId}`,
      enableVersioning: true,
      kmsKeyId: kmsModule.kmsKey.arn,
    });

    // 4. Create S3 bucket for application data
    const appS3Module = new S3Module(this, 'app-s3-module', {
      bucketName: `secure-app-data-${environmentSuffix}-${current.accountId}`,
      enableVersioning: true,
      kmsKeyId: kmsModule.kmsKey.arn,
    });

    // 5. Create Security Group for ALB (allows HTTP/HTTPS from internet)
    const albSecurityGroupModule = new SecurityGroupModule(
      this,
      'alb-sg-module',
      {
        name: 'public-frontend-sg',
        description: 'Security group for Application Load Balancer',
        vpcId: vpcModule.vpc.id,
        ingressRules: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTP from internet',
          },
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow HTTPS from internet',
          },
        ],
        egressRules: [
          {
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
      }
    );

    // 6. Create Security Group for EC2 instances (allows traffic only from ALB)
    const ec2SecurityGroupModule = new SecurityGroupModule(
      this,
      'ec2-sg-module',
      {
        name: 'private-app-sg',
        description: 'Security group for EC2 application instances',
        vpcId: vpcModule.vpc.id,
        ingressRules: [
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            sourceSecurityGroupId: albSecurityGroupModule.securityGroup.id,
            description: 'Allow HTTP from ALB only',
          },
          {
            fromPort: 22,
            toPort: 22,
            protocol: 'tcp',
            cidrBlocks: ['10.0.0.0/16'],
            description: 'Allow SSH from VPC only',
          },
        ],
        egressRules: [
          {
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
      }
    );

    // 7. Create Security Group for RDS (allows traffic only from EC2)
    const rdsSecurityGroupModule = new SecurityGroupModule(
      this,
      'rds-sg-module',
      {
        name: 'private-database-sg',
        description: 'Security group for RDS database',
        vpcId: vpcModule.vpc.id,
        ingressRules: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            sourceSecurityGroupId: ec2SecurityGroupModule.securityGroup.id,
            description: 'Allow MySQL from EC2 instances only',
          },
        ],
        egressRules: [
          {
            fromPort: 0,
            toPort: 65535,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'Allow all outbound traffic',
          },
        ],
      }
    );

    // 8. Get database credentials from AWS Secrets Manager
    const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret',
      {
        secretId: 'my-db-password',
      }
    );

    // 9. Create RDS instance in private subnets with encryption
    const rdsModule = new RdsModule(
      this,
      'rds-module',
      {
        identifier: `secure-app-db-${environmentSuffix}`,
        engine: 'mysql',
        engineVersion: '8.0',
        instanceClass: 'db.t3.medium',
        allocatedStorage: 20,
        dbName: 'secureappdb',
        username: 'admin',
        password: dbPasswordSecret.secretString,
        vpcSecurityGroupIds: [rdsSecurityGroupModule.securityGroup.id],
        dbSubnetGroupName: `secure-app-db-subnet-group-${environmentSuffix}`,
        kmsKeyId: kmsModule.kmsKey.arn,
        backupRetentionPeriod: 7,
        storageEncrypted: true,
      },
      vpcModule.privateSubnets.map(subnet => subnet.id)
    );

    // 10. Create Application Load Balancer in public subnets
    const albModule = new AlbModule(this, 'alb-module', {
      name: `secure-app-alb-${environmentSuffix}`,
      subnets: vpcModule.publicSubnets.map(subnet => subnet.id),
      securityGroups: [albSecurityGroupModule.securityGroup.id],
      targetGroupName: `secure-app-tg-${environmentSuffix}`,
      targetGroupPort: 80,
      vpcId: vpcModule.vpc.id,
    });

    // 11. Create EC2 instances in private subnets
    const ec2Instances: Ec2Module[] = [];
    const userData = `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Secure Application Server</h1>" > /var/www/html/index.html
echo "<p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>" >> /var/www/html/index.html
echo "<p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>" >> /var/www/html/index.html

# Create health check endpoint
echo "OK" > /var/www/html/health

# Install CloudWatch agent for monitoring
yum install -y amazon-cloudwatch-agent
`;

    // Create one EC2 instance in each private subnet for high availability
    vpcModule.privateSubnets.forEach((subnet, index) => {
      const ec2Module = new Ec2Module(this, `ec2-module-${index}`, {
        name: `secure-app-instance-${index + 1}`,
        instanceType: 't3.micro',
        subnetId: subnet.id,
        securityGroupIds: [ec2SecurityGroupModule.securityGroup.id],
        userData: Buffer.from(userData).toString('base64'),
        keyName: 'turing-key', // Replace with your actual key pair name
      });

      ec2Instances.push(ec2Module);

      // Attach EC2 instances to ALB target group
      new LbTargetGroupAttachment(this, `target-attachment-${index}`, {
        targetGroupArn: albModule.targetGroup.arn,
        targetId: ec2Module.instance.id,
        port: 80,
      });
    });

    // 12. Create CloudTrail for audit logging
    const cloudTrailModule = new CloudTrailModule(this, 'cloudtrail-module', {
      name: `secure-app-cloudtrail-${environmentSuffix}`,
      s3BucketName: cloudTrailS3Module.bucket.bucket,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
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

    new TerraformOutput(this, 'alb-dns-name', {
      value: albModule.alb.dnsName,
      description: 'Application Load Balancer DNS name',
    });

    new TerraformOutput(this, 'alb-zone-id', {
      value: albModule.alb.zoneId,
      description: 'Application Load Balancer Zone ID',
    });

    new TerraformOutput(this, 'rds-endpoint', {
      value: rdsModule.dbInstance.endpoint,
      description: 'RDS database endpoint',
      sensitive: true,
    });

    new TerraformOutput(this, 'kms-key-id', {
      value: kmsModule.kmsKey.keyId,
      description: 'KMS Key ID',
    });

    new TerraformOutput(this, 'kms-key-arn', {
      value: kmsModule.kmsKey.arn,
      description: 'KMS Key ARN',
    });

    new TerraformOutput(this, 's3-app-bucket-name', {
      value: appS3Module.bucket.bucket,
      description: 'Application S3 bucket name',
    });

    new TerraformOutput(this, 's3-cloudtrail-bucket-name', {
      value: cloudTrailS3Module.bucket.bucket,
      description: 'CloudTrail S3 bucket name',
    });

    new TerraformOutput(this, 'ec2-instance-ids', {
      value: ec2Instances.map(instance => instance.instance.id),
      description: 'EC2 instance IDs',
    });

    new TerraformOutput(this, 'ec2-private-ips', {
      value: ec2Instances.map(instance => instance.instance.privateIp),
      description: 'EC2 instance private IP addresses',
    });

    new TerraformOutput(this, 'cloudtrail-arn', {
      value: cloudTrailModule.cloudTrail.arn,
      description: 'CloudTrail ARN',
    });

    new TerraformOutput(this, 'security-group-alb-id', {
      value: albSecurityGroupModule.securityGroup.id,
      description: 'ALB Security Group ID',
    });

    new TerraformOutput(this, 'security-group-ec2-id', {
      value: ec2SecurityGroupModule.securityGroup.id,
      description: 'EC2 Security Group ID',
    });

    new TerraformOutput(this, 'security-group-rds-id', {
      value: rdsSecurityGroupModule.securityGroup.id,
      description: 'RDS Security Group ID',
    });
  }
}

```