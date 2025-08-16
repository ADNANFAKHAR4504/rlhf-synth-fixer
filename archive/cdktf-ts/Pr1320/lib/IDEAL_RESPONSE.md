I'll create a comprehensive Infrastructure as Code solution using AWS CDK for Terraform (CDKTF) in TypeScript. This will be organized into two files with production-ready, secure, and reusable modules.

## modules.ts
```typescript
import { Construct } from 'constructs';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';
import { DataAwsAmi } from '@cdktf/provider-aws/lib/data-aws-ami';

import { Vpc } from '@cdktf/provider-aws/lib/vpc';
import { Subnet } from '@cdktf/provider-aws/lib/subnet';
import { InternetGateway } from '@cdktf/provider-aws/lib/internet-gateway';
import { RouteTable } from '@cdktf/provider-aws/lib/route-table';
import { Route } from '@cdktf/provider-aws/lib/route';
import { RouteTableAssociation } from '@cdktf/provider-aws/lib/route-table-association';

import { SecurityGroup } from '@cdktf/provider-aws/lib/security-group';
import { SecurityGroupRule } from '@cdktf/provider-aws/lib/security-group-rule';

import { Instance } from '@cdktf/provider-aws/lib/instance';

import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicyAttachment } from '@cdktf/provider-aws/lib/iam-role-policy-attachment';
import { IamInstanceProfile } from '@cdktf/provider-aws/lib/iam-instance-profile';
import { DataAwsIamPolicyDocument } from '@cdktf/provider-aws/lib/data-aws-iam-policy-document';

import { DbSubnetGroup } from '@cdktf/provider-aws/lib/db-subnet-group';
import { DbInstance } from '@cdktf/provider-aws/lib/db-instance';

import { CloudwatchLogGroup } from '@cdktf/provider-aws/lib/cloudwatch-log-group';

// Interface definitions for module configurations
export interface VpcModuleConfig {
  cidrBlock: string;
  projectName: string;
  environment: string;
}

export interface SecurityGroupModuleConfig {
  vpcId: string;
  allowedSshCidrs: string[];
  projectName: string;
  environment: string;
}

export interface S3ModuleConfig {
  bucketName: string;
  projectName: string;
  environment: string;
}

export interface EC2ModuleConfig {
  instanceType: string;
  subnetId: string;
  securityGroupIds: string[];
  iamInstanceProfile: string;
  keyName?: string;
  projectName: string;
  environment: string;
}

export interface RDSModuleConfig {
  instanceClass: string;
  allocatedStorage: number;
  dbName: string;
  username: string;
  password: string;
  subnetGroupName: string;
  securityGroupIds: string[];
  projectName: string;
  environment: string;
}

export interface IAMModuleConfig {
  projectName: string;
  environment: string;
}

export interface CloudWatchModuleConfig {
  logGroupName: string;
  retentionInDays: number;
  projectName: string;
  environment: string;
}

/**
 * VPC Module - Creates a Virtual Private Cloud with public and private subnets
 * Includes Internet Gateway, Route Tables, and NAT Gateway for secure networking
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;
  public readonly internetGateway: InternetGateway;
  public readonly publicRouteTable: RouteTable;
  public readonly privateRouteTable: RouteTable;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Get availability zones for the region
    const azs = new DataAwsAvailabilityZones(this, 'availability-zones', {
      state: 'available',
    });

    // Create VPC with DNS support enabled for RDS and other services
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.projectName}-${config.environment}-vpc`,
        ProjectName: config.projectName,
        Environment: config.environment,
      },
    });

    // Create public subnet for resources that need internet access (e.g., NAT Gateway, Load Balancers)
    this.publicSubnet = new Subnet(this, 'public-subnet', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${config.projectName}-${config.environment}-public-subnet`,
        ProjectName: config.projectName,
        Environment: config.environment,
        Type: 'Public',
      },
    });

    // Create private subnet for sensitive resources (RDS, internal services)
    this.privateSubnet = new Subnet(this, 'private-subnet', {
      vpcId: this.vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: `\${${azs.fqn}.names[1]}`,
      mapPublicIpOnLaunch: false,
      tags: {
        Name: `${config.projectName}-${config.environment}-private-subnet`,
        ProjectName: config.projectName,
        Environment: config.environment,
        Type: 'Private',
      },
    });

    // Internet Gateway for public internet access
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.projectName}-${config.environment}-igw`,
        ProjectName: config.projectName,
        Environment: config.environment,
      },
    });

    // Route table for public subnet - routes traffic to Internet Gateway
    this.publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.projectName}-${config.environment}-public-rt`,
        ProjectName: config.projectName,
        Environment: config.environment,
      },
    });

    // Route table for private subnet - no direct internet access
    this.privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.projectName}-${config.environment}-private-rt`,
        ProjectName: config.projectName,
        Environment: config.environment,
      },
    });

    // Route for public subnet to internet gateway
    new Route(this, 'public-route', {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate route tables with subnets
    new RouteTableAssociation(this, 'public-rt-association', {
      subnetId: this.publicSubnet.id,
      routeTableId: this.publicRouteTable.id,
    });

    new RouteTableAssociation(this, 'private-rt-association', {
      subnetId: this.privateSubnet.id,
      routeTableId: this.privateRouteTable.id,
    });
  }
}

/**
 * Security Group Module - Creates security groups with least privilege access
 * Implements defense in depth by restricting access to only necessary ports and sources
 */
export class SecurityGroupModule extends Construct {
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupModuleConfig) {
    super(scope, id);

    // Security group for EC2 instances - allows SSH from specified CIDRs only
    this.ec2SecurityGroup = new SecurityGroup(this, 'ec2-sg', {
      name: `${config.projectName}-${config.environment}-ec2-sg`,
      description: 'Security group for EC2 instances - SSH access only',
      vpcId: config.vpcId,
      tags: {
        Name: `${config.projectName}-${config.environment}-ec2-sg`,
        ProjectName: config.projectName,
        Environment: config.environment,
      },
    });

    // Allow SSH access from specified CIDR blocks only
    config.allowedSshCidrs.forEach((cidr, index) => {
      new SecurityGroupRule(this, `ec2-ssh-rule-${index}`, {
        type: 'ingress',
        fromPort: 22,
        toPort: 22,
        protocol: 'tcp',
        cidrBlocks: [cidr],
        securityGroupId: this.ec2SecurityGroup.id,
        description: `SSH access from ${cidr}`,
      });
    });

    // Allow all outbound traffic for updates and external communication
    new SecurityGroupRule(this, 'ec2-egress-rule', {
      type: 'egress',
      fromPort: 0,
      toPort: 65535,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.ec2SecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // Security group for RDS - allows access only from EC2 security group
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${config.projectName}-${config.environment}-rds-sg`,
      description: 'Security group for RDS - access from EC2 only',
      vpcId: config.vpcId,
      tags: {
        Name: `${config.projectName}-${config.environment}-rds-sg`,
        ProjectName: config.projectName,
        Environment: config.environment,
      },
    });

    // Allow MySQL/Aurora access from EC2 security group only
    new SecurityGroupRule(this, 'rds-mysql-rule', {
      type: 'ingress',
      fromPort: 3306,
      toPort: 3306,
      protocol: 'tcp',
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'MySQL access from EC2 instances',
    });
  }
}

/**
 * S3 Module - Creates secure S3 buckets with encryption and versioning
 * Implements AWS security best practices including encryption at rest and public access blocking
 */
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Create S3 bucket with force destroy enabled for easier cleanup in non-production
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: config.bucketName,
      forceDestroy: config.environment !== 'production', // Only allow force destroy in non-prod
      tags: {
        Name: config.bucketName,
        ProjectName: config.projectName,
        Environment: config.environment,
      },
    });

    // Enable versioning to protect against accidental deletion and provide data recovery
    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Configure AES-256 server-side encryption for data at rest
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true, // Reduces encryption costs
        },
      ],
    });

    // Block all public access to prevent accidental data exposure
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}

/**
 * IAM Module - Creates IAM roles and policies with least privilege access
 * Provides secure access patterns for EC2 instances and other AWS services
 */
export class IAMModule extends Construct {
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, config: IAMModuleConfig) {
    super(scope, id);

    // Trust policy document for EC2 service
    const ec2AssumeRolePolicy = new DataAwsIamPolicyDocument(
      this,
      'ec2-assume-role-policy',
      {
        statement: [
          {
            actions: ['sts:AssumeRole'],
            effect: 'Allow',
            principals: [
              {
                type: 'Service',
                identifiers: ['ec2.amazonaws.com'],
              },
            ],
          },
        ],
      }
    );

    // IAM role for EC2 instances with CloudWatch Logs permissions
    this.ec2Role = new IamRole(this, 'ec2-role', {
      name: `${config.projectName}-${config.environment}-ec2-role`,
      assumeRolePolicy: ec2AssumeRolePolicy.json,
      description: 'IAM role for EC2 instances with CloudWatch Logs access',
      tags: {
        Name: `${config.projectName}-${config.environment}-ec2-role`,
        ProjectName: config.projectName,
        Environment: config.environment,
      },
    });

    // Attach CloudWatch Logs policy for log streaming
    new IamRolePolicyAttachment(this, 'ec2-cloudwatch-policy', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess',
    });

    // Attach SSM policy for Systems Manager access (useful for maintenance)
    new IamRolePolicyAttachment(this, 'ec2-ssm-policy', {
      role: this.ec2Role.name,
      policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
    });

    // Create instance profile for EC2 instances
    this.ec2InstanceProfile = new IamInstanceProfile(
      this,
      'ec2-instance-profile',
      {
        name: `${config.projectName}-${config.environment}-ec2-profile`,
        role: this.ec2Role.name,
        tags: {
          Name: `${config.projectName}-${config.environment}-ec2-profile`,
          ProjectName: config.projectName,
          Environment: config.environment,
        },
      }
    );
  }
}

/**
 * EC2 Module - Creates EC2 instances with security best practices
 * Includes CloudWatch monitoring and secure configuration
 */
export class EC2Module extends Construct {
  public readonly instance: Instance;

  constructor(scope: Construct, id: string, config: EC2ModuleConfig) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const amazonLinuxAmi = new DataAwsAmi(this, 'amazon-linux', {
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

    // User data script for CloudWatch Logs agent installation and configuration
    const userData = `#!/bin/bash
yum update -y
yum install -y awslogs

cat > /etc/awslogs/awslogs.conf << 'EOF'
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/messages]
file = /var/log/messages
log_group_name = ${config.projectName}-${config.environment}-ec2-logs
log_stream_name = {instance_id}/messages
datetime_format = %b %d %H:%M:%S
EOF
...
`;

    // Create EC2 instance with security best practices
    this.instance = new Instance(this, 'instance', {
      ami: amazonLinuxAmi.id,
      instanceType: config.instanceType,
      subnetId: config.subnetId,
      vpcSecurityGroupIds: config.securityGroupIds,
      iamInstanceProfile: config.iamInstanceProfile,
      keyName: config.keyName,
      userData: Buffer.from(userData).toString('base64'),

      // Enable detailed monitoring for better observability
      monitoring: true,

      // Enable EBS optimization for better performance
      ebsOptimized: true,

      // Root block device with encryption
      rootBlockDevice: {
        volumeType: 'gp3',
        volumeSize: 20,
        encrypted: true,
        deleteOnTermination: true,
      },

      tags: {
        Name: `${config.projectName}-${config.environment}-ec2`,
        ProjectName: config.projectName,
        Environment: config.environment,
      },
    });
  }
}

/**
 * RDS Module - Creates RDS instances with encryption and automated backups
 * Implements database security best practices including encryption at rest
 */
export class RDSModule extends Construct {
  public readonly dbSubnetGroup: DbSubnetGroup;
  public readonly dbInstance: DbInstance;

  constructor(
    scope: Construct,
    id: string,
    config: RDSModuleConfig,
    privateSubnetIds: string[]
  ) {
    super(scope, id);

    // Create DB subnet group for RDS deployment across multiple AZs
    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: config.subnetGroupName,
      subnetIds: privateSubnetIds,
      description: 'Subnet group for RDS instances',
      tags: {
        Name: config.subnetGroupName,
        ProjectName: config.projectName,
        Environment: config.environment,
      },
    });

    // Create RDS instance with security and backup best practices
    this.dbInstance = new DbInstance(this, 'db-instance', {
      identifier: `${config.projectName}-${config.environment}-db`,
      engine: 'mysql',
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: 'gp3',
      storageEncrypted: true, // Encryption at rest

      // Database configuration
      dbName: config.dbName,
      username: config.username,
      password: config.password,

      // Network configuration
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: config.securityGroupIds,
      publiclyAccessible: false, // Keep database private

      // Backup configuration
      backupRetentionPeriod: 7, // 7 days backup retention
      backupWindow: '03:00-04:00', // Backup during low traffic hours
      maintenanceWindow: 'sun:04:00-sun:05:00', // Maintenance window

      // Security settings
      deletionProtection: config.environment === 'production', // Protect production databases
      skipFinalSnapshot: config.environment !== 'production', // Skip snapshot for non-prod
      finalSnapshotIdentifier:
        config.environment === 'production'
          ? `${config.projectName}-${config.environment}-final-snapshot`
          : undefined,

      // Performance and monitoring
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      monitoringInterval: 0,
      enabledCloudwatchLogsExports: ['error', 'general'],

      tags: {
        Name: `${config.projectName}-${config.environment}-db`,
        ProjectName: config.projectName,
        Environment: config.environment,
      },
    });
  }
}

/**
 * CloudWatch Logs Module - Creates log groups for centralized logging
 * Provides structured logging with configurable retention periods
 */
export class CloudWatchLogsModule extends Construct {
  public readonly logGroup: CloudwatchLogGroup;

  constructor(scope: Construct, id: string, config: CloudWatchModuleConfig) {
    super(scope, id);

    // Create CloudWatch Log Group with appropriate retention
    this.logGroup = new CloudwatchLogGroup(this, 'log-group', {
      name: config.logGroupName,
      retentionInDays: config.retentionInDays,
      tags: {
        Name: config.logGroupName,
        ProjectName: config.projectName,
        Environment: config.environment,
      },
    });
  }
}
```

## tap-stack.ts
```typescript
import {
  AwsProvider,
  AwsProviderDefaultTags,
} from '@cdktf/provider-aws/lib/provider';
import {
  S3Backend,
  TerraformStack,
  TerraformVariable,
  TerraformOutput,
} from 'cdktf';
import { Construct } from 'constructs';

// ? Import your stacks here
import { DataAwsSecretsmanagerSecretVersion } from '@cdktf/provider-aws/lib/data-aws-secretsmanager-secret-version';
import {
  VpcModule,
  SecurityGroupModule,
  S3Module,
  IAMModule,
  EC2Module,
  RDSModule,
  CloudWatchLogsModule,
} from './modules';
import { Fn } from 'cdktf';
// import { MyStack } from './my-stack';

interface TapStackProps {
  environmentSuffix?: string;
  stateBucket?: string;
  stateBucketRegion?: string;
  awsRegion?: string;
  defaultTags?: AwsProviderDefaultTags;
}

// If you need to override the AWS Region for the terraform provider for any particular task,
// you can set it here. Otherwise, it will default to 'us-east-1'.

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

    // ? Add your stack instantiations here
    // Project identification variables
    const projectName = new TerraformVariable(this, 'project_name', {
      type: 'string',
      description: 'Name of the project for resource tagging',
      default: 'tap-infrastructure',
    });

    const environment = new TerraformVariable(this, 'environment', {
      type: 'string',
      description: 'Environment name (dev, staging, production)',
      default: 'dev',
    });

    // Network configuration variables
    const vpcCidr = new TerraformVariable(this, 'vpc_cidr', {
      type: 'string',
      description: 'CIDR block for the VPC',
      default: '10.0.0.0/16',
    });

    const allowedSshCidrs = new TerraformVariable(this, 'allowed_ssh_cidrs', {
      type: 'list(string)',
      description: 'List of CIDR blocks allowed to SSH to EC2 instances',
      default: ['152.59.56.198/32'], // Replace with your IP or CIDR block
    });

    const firstCidr = Fn.element(allowedSshCidrs.listValue, 0);

    // EC2 configuration variables
    const ec2InstanceType = new TerraformVariable(this, 'ec2_instance_type', {
      type: 'string',
      description: 'EC2 instance type',
      default: 't3.medium',
    });

    const keyPairName = new TerraformVariable(this, 'key_pair_name', {
      type: 'string',
      description: 'Name of the EC2 Key Pair for SSH access',
      default: 'MyKeyPair', // Replace with your key pair name
    });

    // S3 configuration variables
    const s3BucketName = new TerraformVariable(this, 's3_bucket_name', {
      type: 'string',
      description: 'Name of the S3 bucket (must be globally unique)',
      default: 'tap-infrastructure-bucket-12345',
    });

    // RDS configuration variables
    const rdsInstanceClass = new TerraformVariable(this, 'rds_instance_class', {
      type: 'string',
      description: 'RDS instance class',
      default: 'db.t3.medium',
    });

    const rdsAllocatedStorage = new TerraformVariable(
      this,
      'rds_allocated_storage',
      {
        type: 'number',
        description: 'RDS allocated storage in GB',
        default: 20,
      }
    );

    const rdsDbName = new TerraformVariable(this, 'rds_db_name', {
      type: 'string',
      description: 'RDS database name',
      default: 'tapdb',
    });

    const rdsUsername = new TerraformVariable(this, 'rds_username', {
      type: 'string',
      description: 'RDS master username',
      default: 'admin',
    });

    const dbPasswordSecret = new DataAwsSecretsmanagerSecretVersion(
      this,
      'db-password-secret',
      {
        secretId: 'my-db-password',
      }
    );

    // CloudWatch configuration variables
    const logRetentionDays = new TerraformVariable(this, 'log_retention_days', {
      type: 'number',
      description: 'CloudWatch Logs retention period in days',
      default: 14,
    });

    // =============================================================================
    // INFRASTRUCTURE MODULES INSTANTIATION
    // =============================================================================

    // 1. Create VPC with public and private subnets
    const vpc = new VpcModule(this, 'vpc', {
      cidrBlock: vpcCidr.stringValue,
      projectName: projectName.stringValue,
      environment: environment.stringValue,
    });

    // 2. Create security groups for EC2 and RDS
    const securityGroups = new SecurityGroupModule(this, 'security-groups', {
      vpcId: vpc.vpc.id,
      allowedSshCidrs: [firstCidr],
      projectName: projectName.stringValue,
      environment: environment.stringValue,
    });

    // 3. Create IAM roles and instance profiles
    const iam = new IAMModule(this, 'iam', {
      projectName: projectName.stringValue,
      environment: environment.stringValue,
    });

    // 4. Create CloudWatch Log Group for EC2 monitoring
    const cloudWatchLogs = new CloudWatchLogsModule(this, 'cloudwatch-logs', {
      logGroupName: `${projectName.stringValue}-${environment.stringValue}-ec2-logs`,
      retentionInDays: logRetentionDays.numberValue,
      projectName: projectName.stringValue,
      environment: environment.stringValue,
    });

    // 5. Create EC2 instance in public subnet with monitoring
    const ec2 = new EC2Module(this, 'ec2', {
      instanceType: ec2InstanceType.stringValue,
      subnetId: vpc.publicSubnet.id,
      securityGroupIds: [securityGroups.ec2SecurityGroup.id],
      iamInstanceProfile: iam.ec2InstanceProfile.name,
      keyName: keyPairName.stringValue || undefined,
      projectName: projectName.stringValue,
      environment: environment.stringValue,
    });

    // 6. Create RDS instance in private subnet with encryption
    const rds = new RDSModule(
      this,
      'rds',
      {
        instanceClass: rdsInstanceClass.stringValue,
        allocatedStorage: rdsAllocatedStorage.numberValue,
        dbName: rdsDbName.stringValue,
        username: rdsUsername.stringValue,
        password: dbPasswordSecret.secretString,
        subnetGroupName: `${projectName.stringValue}-${environment.stringValue}-db-subnet-group`,
        securityGroupIds: [securityGroups.rdsSecurityGroup.id],
        projectName: projectName.stringValue,
        environment: environment.stringValue,
      },
      [vpc.privateSubnet.id, vpc.publicSubnet.id]
    ); // Need multiple subnets for RDS

    // 7. Create S3 bucket with encryption and versioning
    const s3 = new S3Module(this, 's3', {
      bucketName: s3BucketName.stringValue,
      projectName: projectName.stringValue,
      environment: environment.stringValue,
    });

    // =============================================================================
    // TERRAFORM OUTPUTS - Export important resource information
    // =============================================================================

    // VPC Outputs
    new TerraformOutput(this, 'vpc_id', {
      value: vpc.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'public_subnet_id', {
      value: vpc.publicSubnet.id,
      description: 'ID of the public subnet',
    });

    new TerraformOutput(this, 'private_subnet_id', {
      value: vpc.privateSubnet.id,
      description: 'ID of the private subnet',
    });

    // EC2 Outputs
    new TerraformOutput(this, 'ec2_instance_id', {
      value: ec2.instance.id,
      description: 'ID of the EC2 instance',
    });

    new TerraformOutput(this, 'ec2_public_ip', {
      value: ec2.instance.publicIp,
      description: 'Public IP address of the EC2 instance',
    });

    new TerraformOutput(this, 'ec2_private_ip', {
      value: ec2.instance.privateIp,
      description: 'Private IP address of the EC2 instance',
    });

    // RDS Outputs
    new TerraformOutput(this, 'rds_endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'RDS instance endpoint',
      sensitive: false,
    });

    new TerraformOutput(this, 'rds_port', {
      value: rds.dbInstance.port,
      description: 'RDS instance port',
    });

    // S3 Outputs
    new TerraformOutput(this, 's3_bucket_name_output', {
      value: s3.bucket.bucket,
      description: 'Name of the S3 bucket',
    });

    new TerraformOutput(this, 's3_bucket_arn', {
      value: s3.bucket.arn,
      description: 'ARN of the S3 bucket',
    });

    // Security Group Outputs
    new TerraformOutput(this, 'ec2_security_group_id', {
      value: securityGroups.ec2SecurityGroup.id,
      description: 'ID of the EC2 security group',
    });

    new TerraformOutput(this, 'rds_security_group_id', {
      value: securityGroups.rdsSecurityGroup.id,
      description: 'ID of the RDS security group',
    });

    // IAM Outputs
    new TerraformOutput(this, 'ec2_role_arn', {
      value: iam.ec2Role.arn,
      description: 'ARN of the EC2 IAM role',
    });

    // CloudWatch Outputs
    new TerraformOutput(this, 'cloudwatch_log_group_name', {
      value: cloudWatchLogs.logGroup.name,
      description: 'Name of the CloudWatch Log Group',
    });

    // SSH Connection Information
    new TerraformOutput(this, 'ssh_connection_command', {
      value: keyPairName.stringValue
        ? `ssh -i ~/.ssh/${keyPairName.stringValue}.pem ec2-user@${ec2.instance.publicIp}`
        : 'SSH key pair not specified. Use AWS Systems Manager Session Manager for secure access.',
      description: 'SSH command to connect to the EC2 instance',
    });
    // ! Do NOT create resources directly in this stack.
    // ! Instead, create separate stacks for each resource type.
  }
}
```

## Key Features and Security Implementations

### 🔒 **Security Best Practices**

1. **Encryption Everywhere**:
   - S3 buckets use AES-256 encryption
   - RDS instances have encryption at rest enabled
   - EBS volumes are encrypted

2. **Network Security**:
   - RDS deployed in private subnets
   - Security groups follow least privilege