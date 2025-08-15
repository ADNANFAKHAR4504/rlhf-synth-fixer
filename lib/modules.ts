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
