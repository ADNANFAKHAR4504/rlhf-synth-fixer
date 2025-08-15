import { Construct } from "constructs";
import {
  AwsProvider,
  DataAwsAvailabilityZones,
  DataAwsAmi,
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  SecurityGroup,
  SecurityGroupRule,
  Instance,
  IamRole,
  IamRolePolicy,
  IamInstanceProfile,
  S3Bucket,
  S3BucketVersioning,
  S3BucketServerSideEncryptionConfiguration,
  S3BucketPublicAccessBlock,
  DbSubnetGroup,
  DbInstance,
  CloudwatchLogGroup,
  KeyPair
} from "@cdktf/provider-aws";

// Interface definitions for module configurations
export interface VpcModuleConfig {
  cidrBlock: string;
  projectName: string;
  environment: string;
}

export interface Ec2ModuleConfig {
  instanceType: string;
  keyPairName: string;
  allowedSshCidrs: string[];
  projectName: string;
  environment: string;
  vpcId: string;
  subnetId: string;
  iamInstanceProfileName: string;
}

export interface IamModuleConfig {
  projectName: string;
  environment: string;
  s3BucketArns: string[];
  cloudwatchLogGroupArn: string;
}

export interface S3ModuleConfig {
  bucketName: string;
  projectName: string;
  environment: string;
}

export interface RdsModuleConfig {
  instanceClass: string;
  allocatedStorage: number;
  dbName: string;
  username: string;
  projectName: string;
  environment: string;
  subnetIds: string[];
  vpcId: string;
}

export interface CloudWatchModuleConfig {
  logGroupName: string;
  retentionInDays: number;
  projectName: string;
  environment: string;
}

/**
 * VPC Module - Creates a complete VPC with public subnets, internet gateway, and routing
 * This provides the network foundation for all other resources
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly routeTable: RouteTable;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Get availability zones for the region
    const availabilityZones = new DataAwsAvailabilityZones(this, "availability-zones", {
      state: "available"
    });

    // Create VPC - This is the main network container for all resources
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true, // Required for RDS and other services
      enableDnsSupport: true,
      tags: {
        Name: `${config.projectName}-${config.environment}-vpc`,
        ProjectName: config.projectName,
        Environment: config.environment
      }
    });

    // Create Internet Gateway - Allows internet access for public subnets
    this.internetGateway = new InternetGateway(this, "internet-gateway", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.projectName}-${config.environment}-igw`,
        ProjectName: config.projectName,
        Environment: config.environment
      }
    });

    // Create public subnets in multiple AZs for high availability
    // RDS requires subnets in at least 2 AZs for Multi-AZ deployment
    this.publicSubnets = [];
    for (let i = 0; i < 2; i++) {
      const subnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`, // Creates 10.0.1.0/24, 10.0.2.0/24
        availabilityZone: `\${${availabilityZones.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true, // Auto-assign public IPs
        tags: {
          Name: `${config.projectName}-${config.environment}-public-subnet-${i + 1}`,
          ProjectName: config.projectName,
          Environment: config.environment
        }
      });
      this.publicSubnets.push(subnet);
    }

    // Create route table for public subnets
    this.routeTable = new RouteTable(this, "public-route-table", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.projectName}-${config.environment}-public-rt`,
        ProjectName: config.projectName,
        Environment: config.environment
      }
    });

    // Create route to internet gateway - enables internet access
    new Route(this, "public-route", {
      routeTableId: this.routeTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id
    });

    // Associate subnets with route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-route-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: this.routeTable.id
      });
    });
  }
}

/**
 * EC2 Module - Creates an EC2 instance with security group and CloudWatch monitoring
 * Security group follows least privilege principle - only allows SSH from specified CIDRs
 */
export class Ec2Module extends Construct {
  public readonly instance: Instance;
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, "amazon-linux", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"]
        },
        {
          name: "virtualization-type",
          values: ["hvm"]
        }
      ]
    });

    // Create security group with restrictive SSH access
    // Only allows SSH from specified IP ranges - follows security best practices
    this.securityGroup = new SecurityGroup(this, "ec2-security-group", {
      name: `${config.projectName}-${config.environment}-ec2-sg`,
      description: "Security group for EC2 instance - SSH access only from allowed CIDRs",
      vpcId: config.vpcId,
      tags: {
        Name: `${config.projectName}-${config.environment}-ec2-sg`,
        ProjectName: config.projectName,
        Environment: config.environment
      }
    });

    // Add SSH ingress rules for each allowed CIDR
    config.allowedSshCidrs.forEach((cidr, index) => {
      new SecurityGroupRule(this, `ssh-ingress-${index}`, {
        type: "ingress",
        fromPort: 22,
        toPort: 22,
        protocol: "tcp",
        cidrBlocks: [cidr],
        securityGroupId: this.securityGroup.id,
        description: `SSH access from ${cidr}`
      });
    });

    // Allow all outbound traffic - needed for package updates and CloudWatch agent
    new SecurityGroupRule(this, "all-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.securityGroup.id,
      description: "All outbound traffic"
    });

    // Create EC2 instance with CloudWatch monitoring enabled
    this.instance = new Instance(this, "ec2-instance", {
      ami: ami.id,
      instanceType: config.instanceType,
      keyName: config.keyPairName,
      subnetId: config.subnetId,
      vpcSecurityGroupIds: [this.securityGroup.id],
      iamInstanceProfile: config.iamInstanceProfileName,
      monitoring: true, // Enable detailed CloudWatch monitoring
      
      // User data script to install and configure CloudWatch agent
      userData: `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
`,

      tags: {
        Name: `${config.projectName}-${config.environment}-ec2`,
        ProjectName: config.projectName,
        Environment: config.environment
      }
    });
  }
}

/**
 * IAM Module - Creates IAM roles and policies following least privilege principle
 * EC2 instance gets minimal permissions needed for CloudWatch logging and S3 access
 */
export class IamModule extends Construct {
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, config: IamModuleConfig) {
    super(scope, id);

    // Create IAM role for EC2 instance
    // Trust policy allows EC2 service to assume this role
    this.ec2Role = new IamRole(this, "ec2-role", {
      name: `${config.projectName}-${config.environment}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com"
            },
            Action: "sts:AssumeRole"
          }
        ]
      }),
      tags: {
        ProjectName: config.projectName,
        Environment: config.environment
      }
    });

    // Create policy with minimal required permissions
    // CloudWatch Logs: write logs and create log streams
    // S3: read/write access to specific project buckets only
    const policyDocument = {
      Version: "2012-10-17",
      Statement: [
        {
          Effect: "Allow",
          Action: [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents",
            "logs:DescribeLogStreams",
            "logs:DescribeLogGroups"
          ],
          Resource: [
            config.cloudwatchLogGroupArn,
            `${config.cloudwatchLogGroupArn}:*`
          ]
        },
        {
          Effect: "Allow",
          Action: [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:ListBucket"
          ],
          Resource: [
            ...config.s3BucketArns,
            ...config.s3BucketArns.map(arn => `${arn}/*`)
          ]
        },
        {
          Effect: "Allow",
          Action: [
            "cloudwatch:PutMetricData",
            "ec2:DescribeVolumes",
            "ec2:DescribeTags"
          ],
          Resource: "*"
        }
      ]
    };

    new IamRolePolicy(this, "ec2-policy", {
      name: `${config.projectName}-${config.environment}-ec2-policy`,
      role: this.ec2Role.id,
      policy: JSON.stringify(policyDocument)
    });

    // Create instance profile to attach role to EC2 instance
    this.ec2InstanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: `${config.projectName}-${config.environment}-ec2-profile`,
      role: this.ec2Role.name,
      tags: {
        ProjectName: config.projectName,
        Environment: config.environment
      }
    });
  }
}

/**
 * S3 Module - Creates S3 bucket with security best practices
 * Encryption at rest, versioning enabled, public access blocked
 */
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Create S3 bucket with force_destroy for easy cleanup during development
    this.bucket = new S3Bucket(this, "s3-bucket", {
      bucket: config.bucketName,
      forceDestroy: true, // Allows terraform destroy to work even with objects in bucket
      tags: {
        Name: config.bucketName,
        ProjectName: config.projectName,
        Environment: config.environment
      }
    });

    // Enable versioning - protects against accidental deletion/modification
    new S3BucketVersioning(this, "s3-versioning", {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: "Enabled"
      }
    });

    // Enable AES-256 server-side encryption
    // All objects stored in bucket will be encrypted at rest
    new S3BucketServerSideEncryptionConfiguration(this, "s3-encryption", {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256"
          },
          bucketKeyEnabled: true // Reduces encryption costs
        }
      ]
    });

    // Block all public access - security best practice
    // Prevents accidental exposure of sensitive data
    new S3BucketPublicAccessBlock(this, "s3-public-access-block", {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });
  }
}

/**
 * RDS Module - Creates RDS instance with security and backup best practices
 * Encrypted at rest, automated backups, Multi-AZ for production
 */
export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    // Create DB subnet group - required for RDS in VPC
    // Must span multiple AZs for Multi-AZ deployment
    this.dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: `${config.projectName}-${config.environment}-db-subnet-group`,
      subnetIds: config.subnetIds,
      description: "Subnet group for RDS instance",
      tags: {
        Name: `${config.projectName}-${config.environment}-db-subnet-group`,
        ProjectName: config.projectName,
        Environment: config.environment
      }
    });

    // Create security group for RDS - only allows MySQL access from VPC
    this.securityGroup = new SecurityGroup(this, "rds-security-group", {
      name: `${config.projectName}-${config.environment}-rds-sg`,
      description: "Security group for RDS instance",
      vpcId: config.vpcId,
      tags: {
        Name: `${config.projectName}-${config.environment}-rds-sg`,
        ProjectName: config.projectName,
        Environment: config.environment
      }
    });

    // Allow MySQL access from VPC CIDR only
    new SecurityGroupRule(this, "mysql-ingress", {
      type: "ingress",
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      cidrBlocks: ["10.0.0.0/16"], // VPC CIDR block
      securityGroupId: this.securityGroup.id,
      description: "MySQL access from VPC"
    });

    // Create RDS instance with security best practices
    this.dbInstance = new DbInstance(this, "rds-instance", {
      identifier: `${config.projectName}-${config.environment}-db`,
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: "gp2",
      storageEncrypted: true, // Encryption at rest - required
      
      dbName: config.dbName,
      username: config.username,
      managePassword: true, // AWS manages password in Secrets Manager
      
      vpcSecurityGroupIds: [this.securityGroup.id],
      dbSubnetGroupName: this.dbSubnetGroup.name,
      
      // Backup configuration
      backupRetentionPeriod: 7, // Keep backups for 7 days
      backupWindow: "03:00-04:00", // UTC time
      maintenanceWindow: "sun:04:00-sun:05:00",
      
      // Security settings
      skipFinalSnapshot: true, // For development - set to false in production
      deletionProtection: false, // For development - set to true in production
      
      // Performance and monitoring
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      monitoringInterval: 60,
      enabledCloudwatchLogsExports: ["error", "general", "slowquery"],
      
      tags: {
        Name: `${config.projectName}-${config.environment}-db`,
        ProjectName: config.projectName,
        Environment: config.environment
      }
    });
  }
}

/**
 * CloudWatch Logs Module - Creates log group for application logging
 * Centralized logging with configurable retention period
 */
export class CloudWatchLogsModule extends Construct {
  public readonly logGroup: CloudwatchLogGroup;

  constructor(scope: Construct, id: string, config: CloudWatchModuleConfig) {
    super(scope, id);

    // Create CloudWatch Log Group for application logs
    // Retention period helps control costs
    this.logGroup = new CloudwatchLogGroup(this, "log-group", {
      name: config.logGroupName,
      retentionInDays: config.retentionInDays,
      tags: {
        Name: config.logGroupName,
        ProjectName: config.projectName,
        Environment: config.environment
      }
    });
  }
}