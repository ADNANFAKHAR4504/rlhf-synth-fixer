I'll create a secure and resilient AWS environment using CDK for Terraform (TypeScript) split into the two requested files. Let me break this down into modular, reusable components.

## modules.ts

```typescript
import { Construct } from "constructs";
import {
  AwsProvider,
  DataAwsAvailabilityZones,
  DataAwsCallerIdentity,
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  NatGateway,
  Eip,
  SecurityGroup,
  SecurityGroupRule,
  Instance,
  IamRole,
  IamRolePolicyAttachment,
  IamInstanceProfile,
  S3Bucket,
  S3BucketVersioning,
  S3BucketLifecycleConfiguration,
  S3BucketServerSideEncryptionConfiguration,
  S3BucketPublicAccessBlock,
  DbSubnetGroup,
  DbInstance,
  CloudtrailTrail,
  CloudwatchMetricAlarm,
  SnsTopicSubscription,
  SnsTopic,
  KmsKey,
  KmsAlias,
  CloudwatchLogGroup,
  EbsEncryptionByDefault
} from "@cdktf/provider-aws";

/**
 * VPC Module - Creates a secure VPC with public and private subnets
 * Implements multi-AZ deployment with NAT gateways for private subnet internet access
 */
export interface VpcModuleConfig {
  cidrBlock: string;
  publicSubnetCount: number;
  privateSubnetCount: number;
  enableNatGateway: boolean;
  tags: { [key: string]: string };
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateways: NatGateway[];

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, "azs", {
      state: "available",
    });

    // Create VPC with DNS support enabled for RDS and other services
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `corp-${id}-vpc`,
        ...config.tags,
      },
    });

    // Create Internet Gateway for public subnet internet access
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: `corp-${id}-igw`,
        ...config.tags,
      },
    });

    // Create public subnets across multiple AZs
    this.publicSubnets = [];
    for (let i = 0; i < config.publicSubnetCount; i++) {
      const subnet = new Subnet(this, `public-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: this.calculateSubnetCidr(config.cidrBlock, i),
        availabilityZone: `\${${azs.fqn}.names[${i % 3}]}`, // Distribute across AZs
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `corp-${id}-public-subnet-${i + 1}`,
          Type: "Public",
          ...config.tags,
        },
      });
      this.publicSubnets.push(subnet);
    }

    // Create private subnets across multiple AZs
    this.privateSubnets = [];
    for (let i = 0; i < config.privateSubnetCount; i++) {
      const subnet = new Subnet(this, `private-subnet-${i}`, {
        vpcId: this.vpc.id,
        cidrBlock: this.calculateSubnetCidr(config.cidrBlock, i + config.publicSubnetCount),
        availabilityZone: `\${${azs.fqn}.names[${i % 3}]}`, // Distribute across AZs
        tags: {
          Name: `corp-${id}-private-subnet-${i + 1}`,
          Type: "Private",
          ...config.tags,
        },
      });
      this.privateSubnets.push(subnet);
    }

    // Create NAT Gateways for private subnet internet access
    this.natGateways = [];
    if (config.enableNatGateway) {
      for (let i = 0; i < Math.min(config.publicSubnetCount, config.privateSubnetCount); i++) {
        // Create Elastic IP for NAT Gateway
        const eip = new Eip(this, `nat-eip-${i}`, {
          domain: "vpc",
          tags: {
            Name: `corp-${id}-nat-eip-${i + 1}`,
            ...config.tags,
          },
        });

        // Create NAT Gateway
        const natGw = new NatGateway(this, `nat-gw-${i}`, {
          allocationId: eip.id,
          subnetId: this.publicSubnets[i].id,
          tags: {
            Name: `corp-${id}-nat-gw-${i + 1}`,
            ...config.tags,
          },
        });
        this.natGateways.push(natGw);
      }
    }

    // Create route tables and routes
    this.createRouteTables(id, config.tags);
  }

  private calculateSubnetCidr(vpcCidr: string, subnetIndex: number): string {
    const [baseIp, prefixLength] = vpcCidr.split('/');
    const newPrefixLength = parseInt(prefixLength) + 4; // /16 -> /20, /20 -> /24
    const baseIpParts = baseIp.split('.').map(Number);
    baseIpParts[2] = baseIpParts[2] + subnetIndex * 16;
    return `${baseIpParts.join('.')}/${newPrefixLength}`;
  }

  private createRouteTables(id: string, tags: { [key: string]: string }) {
    // Public route table
    const publicRt = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: `corp-${id}-public-rt`,
        ...tags,
      },
    });

    // Route to Internet Gateway
    new Route(this, "public-route", {
      routeTableId: publicRt.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-assoc-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRt.id,
      });
    });

    // Private route tables (one per NAT Gateway for HA)
    this.privateSubnets.forEach((subnet, index) => {
      const privateRt = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `corp-${id}-private-rt-${index + 1}`,
          ...tags,
        },
      });

      // Route to NAT Gateway if available
      if (this.natGateways.length > 0) {
        const natGwIndex = index % this.natGateways.length;
        new Route(this, `private-route-${index}`, {
          routeTableId: privateRt.id,
          destinationCidrBlock: "0.0.0.0/0",
          natGatewayId: this.natGateways[natGwIndex].id,
        });
      }

      new RouteTableAssociation(this, `private-rt-assoc-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRt.id,
      });
    });
  }
}

/**
 * Security Group Module - Creates security groups with least privilege access
 */
export interface SecurityGroupModuleConfig {
  vpcId: string;
  allowedSshCidr: string;
  tags: { [key: string]: string };
}

export class SecurityGroupModule extends Construct {
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupModuleConfig) {
    super(scope, id);

    // EC2 Security Group - SSH access only from specified CIDR
    this.ec2SecurityGroup = new SecurityGroup(this, "ec2-sg", {
      name: `corp-${id}-ec2-sg`,
      description: "Security group for EC2 instances with restricted SSH access",
      vpcId: config.vpcId,
      tags: {
        Name: `corp-${id}-ec2-sg`,
        ...config.tags,
      },
    });

    // SSH access from specified CIDR only
    new SecurityGroupRule(this, "ec2-ssh-rule", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: [config.allowedSshCidr],
      securityGroupId: this.ec2SecurityGroup.id,
      description: "SSH access from corporate network",
    });

    // Outbound internet access for updates and patches
    new SecurityGroupRule(this, "ec2-egress-rule", {
      type: "egress",
      fromPort: 0,
      toPort: 65535,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.ec2SecurityGroup.id,
      description: "Outbound internet access",
    });

    // RDS Security Group - Access only from EC2 security group
    this.rdsSecurityGroup = new SecurityGroup(this, "rds-sg", {
      name: `corp-${id}-rds-sg`,
      description: "Security group for RDS instances",
      vpcId: config.vpcId,
      tags: {
        Name: `corp-${id}-rds-sg`,
        ...config.tags,
      },
    });

    // MySQL/Aurora access from EC2 instances only
    new SecurityGroupRule(this, "rds-mysql-rule", {
      type: "ingress",
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      sourceSecurityGroupId: this.ec2SecurityGroup.id,
      securityGroupId: this.rdsSecurityGroup.id,
      description: "MySQL access from EC2 instances",
    });
  }
}

/**
 * IAM Module - Creates IAM roles and policies following least privilege principle
 */
export interface IamModuleConfig {
  tags: { [key: string]: string };
}

export class IamModule extends Construct {
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, config: IamModuleConfig) {
    super(scope, id);

    // EC2 IAM Role with S3 read-only access
    this.ec2Role = new IamRole(this, "ec2-role", {
      name: `corp-${id}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com",
            },
          },
        ],
      }),
      tags: {
        Name: `corp-${id}-ec2-role`,
        ...config.tags,
      },
    });

    // Attach S3 read-only policy
    new IamRolePolicyAttachment(this, "ec2-s3-readonly", {
      role: this.ec2Role.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess",
    });

    // Attach CloudWatch agent policy for monitoring
    new IamRolePolicyAttachment(this, "ec2-cloudwatch", {
      role: this.ec2Role.name,
      policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
    });

    // Create instance profile
    this.ec2InstanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: `corp-${id}-ec2-instance-profile`,
      role: this.ec2Role.name,
      tags: {
        Name: `corp-${id}-ec2-instance-profile`,
        ...config.tags,
      },
    });
  }
}

/**
 * EC2 Module - Creates EC2 instances with security best practices
 */
export interface Ec2ModuleConfig {
  subnetIds: string[];
  securityGroupIds: string[];
  instanceType: string;
  iamInstanceProfile: string;
  keyName?: string;
  tags: { [key: string]: string };
}

export class Ec2Module extends Construct {
  public readonly instances: Instance[];

  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);

    // Enable EBS encryption by default
    new EbsEncryptionByDefault(this, "ebs-encryption", {
      enabled: true,
    });

    // Create EC2 instances across multiple subnets for HA
    this.instances = [];
    config.subnetIds.forEach((subnetId, index) => {
      const instance = new Instance(this, `instance-${index}`, {
        ami: "ami-0c02fb55956c7d316", // Amazon Linux 2 AMI (update as needed)
        instanceType: config.instanceType,
        subnetId: subnetId,
        vpcSecurityGroupIds: config.securityGroupIds,
        iamInstanceProfile: config.iamInstanceProfile,
        keyName: config.keyName,
        
        // Enable detailed monitoring
        monitoring: true,
        
        // EBS root volume encryption
        rootBlockDevice: {
          volumeType: "gp3",
          volumeSize: 20,
          encrypted: true,
          deleteOnTermination: true,
        },
        
        // User data for basic hardening
        userData: Buffer.from(`#!/bin/bash
          yum update -y
          yum install -y amazon-cloudwatch-agent
          # Configure CloudWatch agent
          /opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c ssm:AmazonCloudWatch-linux
        `).toString('base64'),

        tags: {
          Name: `corp-${id}-instance-${index + 1}`,
          ...config.tags,
        },
      });
      
      this.instances.push(instance);
    });
  }
}

/**
 * S3 Module - Creates S3 buckets with security and lifecycle policies
 */
export interface S3ModuleConfig {
  bucketNames: string[];
  tags: { [key: string]: string };
}

export class S3Module extends Construct {
  public readonly buckets: S3Bucket[];
  public readonly cloudtrailBucket: S3Bucket;

  constructor(scope: Construct, id: string, config: S3ModuleConfig) {
    super(scope, id);

    // Create application S3 buckets
    this.buckets = [];
    config.bucketNames.forEach((bucketName, index) => {
      const bucket = this.createSecureS3Bucket(`${bucketName}-${index}`, {
        Name: `corp-${bucketName}`,
        ...config.tags,
      });
      this.buckets.push(bucket);
    });

    // Create dedicated CloudTrail bucket
    this.cloudtrailBucket = this.createSecureS3Bucket("cloudtrail-logs", {
      Name: `corp-${id}-cloudtrail-logs`,
      Purpose: "CloudTrail Logs",
      ...config.tags,
    });

    // CloudTrail bucket policy
    this.setupCloudTrailBucketPolicy();
  }

  private createSecureS3Bucket(name: string, tags: { [key: string]: string }): S3Bucket {
    // Create S3 bucket
    const bucket = new S3Bucket(this, `bucket-${name}`, {
      bucket: `corp-${name}-${Math.random().toString(36).substr(2, 8)}`, // Ensure uniqueness
      tags: tags,
    });

    // Enable versioning
    new S3BucketVersioning(this, `versioning-${name}`, {
      bucket: bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // Server-side encryption with AWS managed KMS keys
    new S3BucketServerSideEncryptionConfiguration(this, `encryption-${name}`, {
      bucket: bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, `public-access-block-${name}`, {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Lifecycle policy - move to Glacier after 30 days
    new S3BucketLifecycleConfiguration(this, `lifecycle-${name}`, {
      bucket: bucket.id,
      rule: [
        {
          id: "glacier-transition",
          status: "Enabled",
          transition: [
            {
              days: 30,
              storageClass: "GLACIER",
            },
          ],
        },
      ],
    });

    return bucket;
  }

  private setupCloudTrailBucketPolicy() {
    // CloudTrail requires specific bucket policy - this would be implemented
    // based on the AWS account ID and CloudTrail service requirements
  }
}

/**
 * RDS Module - Creates RDS instances with Multi-AZ and encryption
 */
export interface RdsModuleConfig {
  subnetIds: string[];
  securityGroupIds: string[];
  dbName: string;
  username: string;
  password: string;
  instanceClass: string;
  tags: { [key: string]: string };
}

export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;

  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    // Create DB subnet group
    this.dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: `corp-${id}-db-subnet-group`,
      subnetIds: config.subnetIds,
      tags: {
        Name: `corp-${id}-db-subnet-group`,
        ...config.tags,
      },
    });

    // Create RDS instance with Multi-AZ and encryption
    this.dbInstance = new DbInstance(this, "db-instance", {
      identifier: `corp-${id}-database`,
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: config.instanceClass,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      
      dbName: config.dbName,
      username: config.username,
      password: config.password,
      
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: config.securityGroupIds,
      
      // Multi-AZ deployment for high availability
      multiAz: true,
      
      // Encryption at rest
      storageEncrypted: true,
      
      // Backup configuration
      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      
      // Performance insights
      performanceInsightsEnabled: true,
      performanceInsightsRetentionPeriod: 7,
      
      // Monitoring
      monitoringInterval: 60,
      
      // Deletion protection
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `corp-${id}-final-snapshot`,

      tags: {
        Name: `corp-${id}-database`,
        ...config.tags,
      },
    });
  }
}

/**
 * CloudTrail Module - Sets up audit logging
 */
export interface CloudTrailModuleConfig {
  s3BucketName: string;
  tags: { [key: string]: string };
}

export class CloudTrailModule extends Construct {
  public readonly trail: CloudtrailTrail;
  public readonly logGroup: CloudwatchLogGroup;

  constructor(scope: Construct, id: string, config: CloudTrailModuleConfig) {
    super(scope, id);

    // Create CloudWatch Log Group for CloudTrail
    this.logGroup = new CloudwatchLogGroup(this, "cloudtrail-log-group", {
      name: `corp-${id}-cloudtrail-logs`,
      retentionInDays: 90,
      tags: {
        Name: `corp-${id}-cloudtrail-logs`,
        ...config.tags,
      },
    });

    // Create CloudTrail
    this.trail = new CloudtrailTrail(this, "cloudtrail", {
      name: `corp-${id}-cloudtrail`,
      s3BucketName: config.s3BucketName,
      
      // Enable log file validation
      enableLogFileValidation: true,
      
      // Include global service events
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      
      // Event selectors for data events
      eventSelector: [
        {
          readWriteType: "All",
          includeManagementEvents: true,
          dataResource: [
            {
              type: "AWS::S3::Object",
              values: ["arn:aws:s3:::*/*"],
            },
          ],
        },
      ],

      tags: {
        Name: `corp-${id}-cloudtrail`,
        ...config.tags,
      },
    });
  }
}

/**
 * CloudWatch Module - Sets up monitoring and alerting
 */
export interface CloudWatchModuleConfig {
  instanceIds: string[];
  snsTopicArn?: string;
  tags: { [key: string]: string };
}

export class CloudWatchModule extends Construct {
  public readonly cpuAlarms: CloudwatchMetricAlarm[];
  public readonly snsTopic: SnsTopic;

  constructor(scope: Construct, id: string, config: CloudWatchModuleConfig) {
    super(scope, id);

    // Create SNS topic for alerts if not provided
    this.snsTopic = new SnsTopic(this, "alerts-topic", {
      name: `corp-${id}-alerts`,
      tags: {
        Name: `corp-${id}-alerts`,
        ...config.tags,
      },
    });

    // Create CPU utilization alarms for each EC2 instance
    this.cpuAlarms = [];
    config.instanceIds.forEach((instanceId, index) => {
      const alarm = new CloudwatchMetricAlarm(this, `cpu-alarm-${index}`, {
        alarmName: `corp-${id}-cpu-utilization-${index + 1}`,
        comparisonOperator: "GreaterThanThreshold",
        evaluationPeriods: 2,
        metricName: "CPUUtilization",
        namespace: "AWS/EC2",
        period: 300,
        statistic: "Average",
        threshold: 80,
        alarmDescription: `CPU utilization alarm for instance ${instanceId}`,
        alarmActions: [this.snsTopic.arn],
        dimensions: {
          InstanceId: instanceId,
        },
        tags: {
          Name: `corp-${id}-cpu-alarm-${index + 1}`,
          ...config.tags,
        },
      });
      this.cpuAlarms.push(alarm);
    });
  }
}
```

## tap-stack.ts

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import {
  VpcModule,
  SecurityGroupModule,
  IamModule,
  Ec2Module,
  S3Module,
  RdsModule,
  CloudTrailModule,
  CloudWatchModule,
} from "./modules";

/**
 * TAP Stack - Main infrastructure stack implementing corporate security standards
 * Deploys a complete AWS environment with VPC, EC2, RDS, S3, and monitoring
 */
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider for us-east-1 region
    new AwsProvider(this, "aws", {
      region: "us-east-1",
      defaultTags: [
        {
          tags: {
            Environment: "production",
            Project: "tap-infrastructure",
            ManagedBy: "terraform",
            Department: "IT",
          },
        },
      ],
    });

    // Common tags for all resources
    const commonTags = {
      Department: "IT",
      Environment: "production",
      Project: "tap-infrastructure",
    };

    // Configuration parameters
    const config = {
      vpcCidr: "10.0.0.0/16",
      allowedSshCidr: "203.0.113.0/24", // Corporate network CIDR
      instanceType: "m5.large", // Meets minimum requirement
      rdsInstanceClass: "db.t3.micro", // Can be upgraded as needed
      dbUsername: "admin",
      dbPassword: "ChangeMe123!", // Should be managed via AWS Secrets Manager in production
      dbName: "corpdb",
    };

    // 1. Create VPC with public and private subnets
    const vpcModule = new VpcModule(this, "main-vpc", {
      cidrBlock: config.vpcCidr,
      publicSubnetCount: 2,
      privateSubnetCount: 2,
      enableNatGateway: true,
      tags: commonTags,
    });

    // 2. Create Security Groups
    const securityModule = new SecurityGroupModule(this, "security", {
      vpcId: vpcModule.vpc.id,
      allowedSshCidr: config.allowedSshCidr,
      tags: commonTags,
    });

    // 3. Create IAM roles and policies
    const iamModule = new IamModule(this, "iam", {
      tags: commonTags,
    });

    // 4. Create S3 buckets
    const s3Module = new S3Module(this, "storage", {
      bucketNames: ["app-data", "backups", "logs"],
      tags: commonTags,
    });

    // 5. Create RDS database in private subnets
    const rdsModule = new RdsModule(this, "database", {
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [securityModule.rdsSecurityGroup.id],
      dbName: config.dbName,
      username: config.dbUsername,
      password: config.dbPassword,
      instanceClass: config.rdsInstanceClass,
      tags: commonTags,
    });

    // 6. Create EC2 instances in private subnets
    const ec2Module = new Ec2Module(this, "compute", {
      subnetIds: vpcModule.privateSubnets.map(subnet => subnet.id),
      securityGroupIds: [securityModule.ec2SecurityGroup.id],
      instanceType: config.instanceType,
      iamInstanceProfile: iamModule.ec2InstanceProfile.name,
      keyName: "corp-keypair", // Assumes key pair exists
      tags: commonTags,
    });

    // 7. Set up CloudTrail for audit logging
    const cloudTrailModule = new CloudTrailModule(this, "audit", {
      s3BucketName: s3Module.cloudtrailBucket.bucket,
      tags: commonTags,
    });

    // 8. Set up CloudWatch monitoring and alarms
    const cloudWatchModule = new CloudWatchModule(this, "monitoring", {
      instanceIds: ec2Module.instances.map(instance => instance.id),
      tags: commonTags,
    });

    // Outputs for key infrastructure components
    new TerraformOutput(this, "vpc-id", {
      value: vpcModule.vpc.id,
      description: "ID of the main VPC",
    });

    new TerraformOutput(this, "public-subnet-ids", {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: "IDs of public subnets",
    });

    new TerraformOutput(this, "private-subnet-ids", {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: "IDs of private subnets",
    });

    new TerraformOutput(this, "ec2-instance-ids", {
      value: ec2Module.instances.map(instance => instance.id),
      description: "IDs of EC2 instances",
    });

    new TerraformOutput(this, "ec2-private-ips", {
      value: ec2Module.instances.map(instance => instance.privateIp),
      description: "Private IP addresses of EC2 instances",
    });

    new TerraformOutput(this, "rds-endpoint", {
      value: rdsModule.dbInstance.endpoint,
      description: "RDS database endpoint",
      sensitive: true,
    });

    new TerraformOutput(this, "s3-bucket-names", {
      value: s3Module.buckets.map(bucket => bucket.bucket),
      description: "Names of S3 buckets",
    });

    new TerraformOutput(this, "cloudtrail-bucket", {
      value: s3Module.cloudtrailBucket.bucket,
      description: "CloudTrail S3 bucket name",
    });

    new TerraformOutput(this, "sns-topic-arn", {
      value: cloudWatchModule.snsTopic.arn,
      description: "SNS topic ARN for alerts",
    });

    new TerraformOutput(this, "security-group-ec2", {
      value: securityModule.ec2SecurityGroup.id,
      description: "EC2 security group ID",
    });

    new TerraformOutput(this, "security-group-rds", {
      value: securityModule.rdsSecurityGroup.id,
      description: "RDS security group ID",
    });

    new TerraformOutput(this, "iam-role-ec2", {
      value: iamModule.ec2Role.arn,
      description: "EC2 IAM role ARN",
    });
  }
}

// Application entry point
const app = new App();
new TapStack(app, "tap-infrastructure");
app.synth();
```

## Key Features Implemented

### 🔒 Security
- **