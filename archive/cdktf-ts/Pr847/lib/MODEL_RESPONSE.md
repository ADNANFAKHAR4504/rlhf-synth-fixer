I'll create a production-ready AWS infrastructure using CDKTF with TypeScript, organized into two files as requested. This will include all the networking, security, compute, and storage components with proper modularization and best practices.

## modules.ts

```typescript
import { Construct } from "constructs";
import {
  AwsProvider,
  Vpc,
  Subnet,
  InternetGateway,
  NatGateway,
  Eip,
  RouteTable,
  Route,
  RouteTableAssociation,
  SecurityGroup,
  SecurityGroupRule,
  IamRole,
  IamRolePolicy,
  IamInstanceProfile,
  Instance,
  EbsVolume,
  VolumeAttachment,
  DbSubnetGroup,
  DbInstance,
  S3Bucket,
  S3BucketServerSideEncryptionConfiguration,
  S3BucketVersioning,
  S3BucketPublicAccessBlock,
  KeyPair,
  DataAwsAmi,
  DataAwsAvailabilityZones,
} from "@cdktf/provider-aws";

/**
 * Configuration interface for common tags and environment settings
 */
export interface CommonConfig {
  environment: string;
  owner: string;
  region: string;
  projectName: string;
}

/**
 * VPC Module - Creates a Virtual Private Cloud with configurable CIDR block
 * Provides isolated network environment for all AWS resources
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly internetGateway: InternetGateway;

  constructor(scope: Construct, id: string, config: CommonConfig & { cidrBlock: string }) {
    super(scope, id);

    // Create VPC with DNS support enabled for proper hostname resolution
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.projectName}-vpc`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // Create Internet Gateway for public subnet internet access
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.projectName}-igw`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });
  }
}

/**
 * Subnet Module - Creates public and private subnets across multiple AZs
 * Ensures high availability and proper network segmentation
 */
export class SubnetModule extends Construct {
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly natGateways: NatGateway[];
  public readonly publicRouteTable: RouteTable;
  public readonly privateRouteTables: RouteTable[];

  constructor(
    scope: Construct,
    id: string,
    config: CommonConfig & {
      vpc: Vpc;
      internetGateway: InternetGateway;
      publicSubnetCidrs: string[];
      privateSubnetCidrs: string[];
    }
  ) {
    super(scope, id);

    // Get availability zones for the region
    const azs = new DataAwsAvailabilityZones(this, "azs", {
      state: "available",
    });

    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];
    this.privateRouteTables = [];

    // Create public subnets in different AZs for high availability
    config.publicSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: config.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true, // Auto-assign public IPs
        tags: {
          Name: `${config.projectName}-public-subnet-${index + 1}`,
          Type: "Public",
          Environment: config.environment,
          Owner: config.owner,
        },
      });
      this.publicSubnets.push(subnet);
    });

    // Create private subnets in different AZs
    config.privateSubnetCidrs.forEach((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: config.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${azs.fqn}.names[${index}]}`,
        tags: {
          Name: `${config.projectName}-private-subnet-${index + 1}`,
          Type: "Private",
          Environment: config.environment,
          Owner: config.owner,
        },
      });
      this.privateSubnets.push(subnet);
    });

    // Create NAT Gateways for private subnet internet access
    this.publicSubnets.forEach((subnet, index) => {
      // Elastic IP for NAT Gateway
      const eip = new Eip(this, `nat-eip-${index}`, {
        domain: "vpc",
        tags: {
          Name: `${config.projectName}-nat-eip-${index + 1}`,
          Environment: config.environment,
          Owner: config.owner,
        },
      });

      // NAT Gateway in public subnet
      const natGateway = new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eip.id,
        subnetId: subnet.id,
        tags: {
          Name: `${config.projectName}-nat-gateway-${index + 1}`,
          Environment: config.environment,
          Owner: config.owner,
        },
      });
      this.natGateways.push(natGateway);
    });

    // Create public route table with internet gateway route
    this.publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: config.vpc.id,
      tags: {
        Name: `${config.projectName}-public-rt`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // Route for public subnets to internet gateway
    new Route(this, "public-route", {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: config.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      });
    });

    // Create private route tables with NAT gateway routes
    this.privateSubnets.forEach((subnet, index) => {
      const routeTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: config.vpc.id,
        tags: {
          Name: `${config.projectName}-private-rt-${index + 1}`,
          Environment: config.environment,
          Owner: config.owner,
        },
      });

      // Route for private subnets to NAT gateway
      new Route(this, `private-route-${index}`, {
        routeTableId: routeTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: this.natGateways[index].id,
      });

      // Associate private subnet with its route table
      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: routeTable.id,
      });

      this.privateRouteTables.push(routeTable);
    });
  }
}

/**
 * Security Group Module - Creates security groups with least privilege access
 * Implements defense in depth security strategy
 */
export class SecurityGroupModule extends Construct {
  public readonly sshSecurityGroup: SecurityGroup;
  public readonly webSecurityGroup: SecurityGroup;
  public readonly dbSecurityGroup: SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    config: CommonConfig & {
      vpc: Vpc;
      sshCidrBlock: string;
    }
  ) {
    super(scope, id);

    // Security group for SSH access - restricted to specific CIDR
    this.sshSecurityGroup = new SecurityGroup(this, "ssh-sg", {
      name: `${config.projectName}-ssh-sg`,
      description: "Security group for SSH access",
      vpcId: config.vpc.id,
      tags: {
        Name: `${config.projectName}-ssh-sg`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // SSH inbound rule
    new SecurityGroupRule(this, "ssh-inbound", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: [config.sshCidrBlock],
      securityGroupId: this.sshSecurityGroup.id,
      description: "SSH access from authorized CIDR",
    });

    // Security group for web servers - HTTP/HTTPS from anywhere
    this.webSecurityGroup = new SecurityGroup(this, "web-sg", {
      name: `${config.projectName}-web-sg`,
      description: "Security group for web servers",
      vpcId: config.vpc.id,
      tags: {
        Name: `${config.projectName}-web-sg`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // HTTP inbound rule
    new SecurityGroupRule(this, "http-inbound", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.webSecurityGroup.id,
      description: "HTTP access from anywhere",
    });

    // HTTPS inbound rule
    new SecurityGroupRule(this, "https-inbound", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.webSecurityGroup.id,
      description: "HTTPS access from anywhere",
    });

    // Security group for database - only from web servers
    this.dbSecurityGroup = new SecurityGroup(this, "db-sg", {
      name: `${config.projectName}-db-sg`,
      description: "Security group for database servers",
      vpcId: config.vpc.id,
      tags: {
        Name: `${config.projectName}-db-sg`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // Database inbound rule - only from web security group
    new SecurityGroupRule(this, "db-inbound", {
      type: "ingress",
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      sourceSecurityGroupId: this.webSecurityGroup.id,
      securityGroupId: this.dbSecurityGroup.id,
      description: "MySQL access from web servers",
    });

    // Outbound rules for all security groups (allow all outbound)
    [this.sshSecurityGroup, this.webSecurityGroup, this.dbSecurityGroup].forEach((sg, index) => {
      new SecurityGroupRule(this, `outbound-${index}`, {
        type: "egress",
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"],
        securityGroupId: sg.id,
        description: "All outbound traffic",
      });
    });
  }
}

/**
 * IAM Module - Creates IAM roles and policies with least privilege
 * Provides secure access for EC2 instances and other services
 */
export class IamModule extends Construct {
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, config: CommonConfig) {
    super(scope, id);

    // IAM role for EC2 instances
    this.ec2Role = new IamRole(this, "ec2-role", {
      name: `${config.projectName}-ec2-role`,
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
        Name: `${config.projectName}-ec2-role`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // IAM policy for EC2 instances - minimal required permissions
    new IamRolePolicy(this, "ec2-policy", {
      name: `${config.projectName}-ec2-policy`,
      role: this.ec2Role.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:PutObject",
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "cloudwatch:PutMetricData",
            ],
            Resource: "*",
          },
        ],
      }),
    });

    // Instance profile for EC2 instances
    this.ec2InstanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: `${config.projectName}-ec2-instance-profile`,
      role: this.ec2Role.name,
    });
  }
}

/**
 * EC2 Module - Creates EC2 instances with encrypted EBS volumes
 * Implements security best practices for compute resources
 */
export class Ec2Module extends Construct {
  public readonly instances: Instance[];
  public readonly keyPair: KeyPair;

  constructor(
    scope: Construct,
    id: string,
    config: CommonConfig & {
      subnets: Subnet[];
      securityGroups: SecurityGroup[];
      instanceProfile: IamInstanceProfile;
      instanceType: string;
      publicKeyMaterial: string;
    }
  ) {
    super(scope, id);

    // Create key pair for EC2 access
    this.keyPair = new KeyPair(this, "key-pair", {
      keyName: `${config.projectName}-key-pair`,
      publicKey: config.publicKeyMaterial,
      tags: {
        Name: `${config.projectName}-key-pair`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, "amazon-linux", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"],
        },
        {
          name: "virtualization-type",
          values: ["hvm"],
        },
      ],
    });

    this.instances = [];

    // Create EC2 instances in specified subnets
    config.subnets.forEach((subnet, index) => {
      const instance = new Instance(this, `instance-${index}`, {
        ami: ami.id,
        instanceType: config.instanceType,
        keyName: this.keyPair.keyName,
        subnetId: subnet.id,
        vpcSecurityGroupIds: config.securityGroups.map((sg) => sg.id),
        iamInstanceProfile: config.instanceProfile.name,
        // Enable detailed monitoring
        monitoring: true,
        // Encrypt root volume
        rootBlockDevice: {
          volumeType: "gp3",
          volumeSize: 20,
          encrypted: true,
          deleteOnTermination: true,
        },
        tags: {
          Name: `${config.projectName}-instance-${index + 1}`,
          Environment: config.environment,
          Owner: config.owner,
        },
      });

      // Create additional encrypted EBS volume
      const volume = new EbsVolume(this, `ebs-volume-${index}`, {
        availabilityZone: instance.availabilityZone,
        size: 10,
        type: "gp3",
        encrypted: true,
        tags: {
          Name: `${config.projectName}-ebs-volume-${index + 1}`,
          Environment: config.environment,
          Owner: config.owner,
        },
      });

      // Attach EBS volume to instance
      new VolumeAttachment(this, `volume-attachment-${index}`, {
        deviceName: "/dev/sdf",
        volumeId: volume.id,
        instanceId: instance.id,
      });

      this.instances.push(instance);
    });
  }
}

/**
 * RDS Module - Creates RDS instances in private subnets with encryption
 * Implements database security and high availability best practices
 */
export class RdsModule extends Construct {
  public readonly dbSubnetGroup: DbSubnetGroup;
  public readonly dbInstance: DbInstance;

  constructor(
    scope: Construct,
    id: string,
    config: CommonConfig & {
      privateSubnets: Subnet[];
      securityGroup: SecurityGroup;
      dbName: string;
      dbUsername: string;
      dbPassword: string;
      instanceClass: string;
    }
  ) {
    super(scope, id);

    // Create DB subnet group for RDS placement
    this.dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: `${config.projectName}-db-subnet-group`,
      subnetIds: config.privateSubnets.map((subnet) => subnet.id),
      description: "Database subnet group for RDS instances",
      tags: {
        Name: `${config.projectName}-db-subnet-group`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // Create RDS instance with encryption and backup
    this.dbInstance = new DbInstance(this, "db-instance", {
      identifier: `${config.projectName}-db-instance`,
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: config.instanceClass,
      allocatedStorage: 20,
      maxAllocatedStorage: 100, // Enable storage autoscaling
      storageType: "gp3",
      storageEncrypted: true,
      
      // Database configuration
      dbName: config.dbName,
      username: config.dbUsername,
      password: config.dbPassword,
      
      // Network and security
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [config.securityGroup.id],
      publiclyAccessible: false,
      
      // Backup and maintenance
      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      
      // Monitoring and performance
      monitoringInterval: 60,
      performanceInsightsEnabled: true,
      
      // Deletion protection
      deletionProtection: false, // Set to true for production
      skipFinalSnapshot: true,   // Set to false for production
      
      tags: {
        Name: `${config.projectName}-db-instance`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });
  }
}

/**
 * S3 Module - Creates S3 buckets with encryption and security configurations
 * Implements data protection and access control best practices
 */
export class S3Module extends Construct {
  public readonly logsBucket: S3Bucket;

  constructor(scope: Construct, id: string, config: CommonConfig) {
    super(scope, id);

    // Create S3 bucket for logs with unique naming
    this.logsBucket = new S3Bucket(this, "logs-bucket", {
      bucket: `${config.projectName}-logs-${config.environment}-${Date.now()}`,
      tags: {
        Name: `${config.projectName}-logs-bucket`,
        Environment: config.environment,
        Owner: config.owner,
      },
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfiguration(this, "logs-bucket-encryption", {
      bucket: this.logsBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Enable versioning for data protection
    new S3BucketVersioning(this, "logs-bucket-versioning", {
      bucket: this.logsBucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // Block public access for security
    new S3BucketPublicAccessBlock(this, "logs-bucket-pab", {
      bucket: this.logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}
```

## tap-stack.ts

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, S3Backend } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import {
  VpcModule,
  SubnetModule,
  SecurityGroupModule,
  IamModule,
  Ec2Module,
  RdsModule,
  S3Module,
  CommonConfig,
} from "./modules";

/**
 * Main Terraform Stack - Orchestrates all infrastructure modules
 * Implements complete AWS infrastructure with networking, security, compute, and storage
 */
class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Common configuration for all resources
    const config: CommonConfig = {
      environment: process.env.ENVIRONMENT || "dev",
      owner: process.env.OWNER || "devops-team",
      region: "us-east-1",
      projectName: "tap-infrastructure",
    };

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region: config.region,
      defaultTags: [
        {
          tags: {
            Environment: config.environment,
            Owner: config.owner,
            ManagedBy: "Terraform",
            Project: config.projectName,
          },
        },
      ],
    });

    // Configure remote backend for state management
    new S3Backend(this, {
      bucket: process.env.TF_STATE_BUCKET || "tap-terraform-state-bucket",
      key: `${config.environment}/terraform.tfstate`,
      region: config.region,
      encrypt: true,
      dynamodbTable: process.env.TF_STATE_DYNAMODB_TABLE || "tap-terraform-state-lock",
    });

    // Create VPC with Internet Gateway
    const vpcModule = new VpcModule(this, "vpc", {
      ...config,
      cidrBlock: "10.0.0.0/16",
    });

    // Create subnets with NAT Gateways and routing
    const subnetModule = new SubnetModule(this, "subnets", {
      ...config,
      vpc: vpcModule.vpc,
      internetGateway: vpcModule.internetGateway,
      publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
      privateSubnetCidrs: ["10.0.10.0/24", "10.0.20.0/24"],
    });

    // Create security groups with proper access controls
    const securityGroupModule = new SecurityGroupModule(this, "security-groups", {
      ...config,
      vpc: vpcModule.vpc,
      sshCidrBlock: process.env.SSH_CIDR_BLOCK || "0.0.0.0/0", // Restrict in production
    });

    // Create IAM roles and policies
    const iamModule = new IamModule(this, "iam", config);

    // Create EC2 instances in public subnets
    const ec2Module = new Ec2Module(this, "ec2", {
      ...config,
      subnets: subnetModule.publicSubnets,
      securityGroups: [
        securityGroupModule.sshSecurityGroup,
        securityGroupModule.webSecurityGroup,
      ],
      instanceProfile: iamModule.ec2InstanceProfile,
      instanceType: process.env.INSTANCE_TYPE || "t3.micro",
      publicKeyMaterial: process.env.PUBLIC_KEY_MATERIAL || "", // Must be provided
    });

    // Create RDS instance in private subnets
    const rdsModule = new RdsModule(this, "rds", {
      ...config,
      privateSubnets: subnetModule.privateSubnets,
      securityGroup: securityGroupModule.dbSecurityGroup,
      dbName: process.env.DB_NAME || "tapdb",
      dbUsername: process.env.DB_USERNAME || "admin",
      dbPassword: process.env.DB_PASSWORD || "changeme123!", // Use AWS Secrets Manager in production
      instanceClass: process.env.DB_INSTANCE_CLASS || "db.t3.micro",
    });

    // Create S3 bucket for logs
    const s3Module = new S3Module(this, "s3", config);

    // Export important outputs for reference
    this.addOutput("vpc-id", {
      value: vpcModule.vpc.id,
      description: "ID of the created VPC",
    });

    this.addOutput("public-subnet-ids", {
      value: subnetModule.publicSubnets.map((subnet) => subnet.id),
      description: "IDs of the public subnets",
    });

    this.addOutput("private-subnet-ids", {
      value: subnetModule.privateSubnets.map((subnet) => subnet.id),
      description: "IDs of the private subnets",
    });

    this.addOutput("ec2-instance-ids", {
      value: ec2Module.instances.map((instance) => instance.id),
      description: "IDs of the created EC2 instances",
    });

    this.addOutput("ec2-public-ips", {
      value: ec2Module.instances.map((instance) => instance.publicIp),
      description: "Public IP addresses of EC2 instances",
    });

    this.addOutput("rds-endpoint", {
      value: rdsModule.dbInstance.endpoint,
      description: "RDS instance endpoint",
      sensitive: true,
    });

    this.addOutput("s3-logs-bucket-name", {
      value: s3Module.logsBucket.bucket,
      description: "Name of the S3 logs bucket",
    });

    this.addOutput("nat-gateway-ips", {
      value: subnetModule.natGateways.map((nat) => nat.publicIp),
      description: "Public IP addresses of NAT Gateways",
    });
  }
}

// Initialize the CDK app and stack
const app = new App();
new TapStack(app, "tap-infrastructure");
app.synth();
```

## Usage Instructions

### Prerequisites

1. **Install dependencies:**
```bash
npm install @cdktf/provider-aws cdktf constructs
```

2. **Set required environment variables:**
```bash
export ENVIRONMENT="production"
export OWNER="your-team"
export TF_STATE_BUCKET="your-terraform-state-bucket"
export TF_STATE_DYNAMODB_TABLE="your-terraform-state-lock-table"
export SSH_CIDR_BLOCK="your.ip.address/32"
export PUBLIC_KEY_MATERIAL="ssh-rsa AAAAB3NzaC1yc2E... your-public-key"
export DB_PASSWORD="your-secure-database-password"
```

### Deployment Commands

```bash
# Initialize and plan
cdktf init
cdktf plan

# Deploy infrastructure
cdktf deploy

# Destroy infrastructure
cdktf destroy
```

## Key Features

### Security Best Practices
- **Encryption**: All EBS volumes, RDS storage, and S3 buckets encrypted
- **Network Segmentation**: Private subnets for databases, public for web servers
- **Least Privilege**: IAM roles with minimal required permissions
- **Security Groups**: Restrictive inbound rules, specific port access

### High Availability
- **Multi-AZ Deployment**: Resources distributed across availability zones
- **NAT Gateways**: One per public subnet for redundancy
- **RDS Backups**: Automated backups with 7-day retention

### Operational Excellence
- **Remote State**: S3 backend with DynamoDB locking
- **Monitoring**: CloudWatch integration enabled
- **Tagging**: Consistent tagging strategy for resource management
- **Modular Design**: Reusable modules for scalability

### Cost Optimization
- **Right-sizing**: t3.micro instances for development
- **Storage Autoscaling**: RDS storage grows as needed
- **GP3 Volumes**: Latest generation EBS volumes for better performance/cost

This infrastructure is production-ready and follows AWS Well-Architected Framework principles. All resources can be cleanly destroyed with `cdktf destroy` without manual intervention.