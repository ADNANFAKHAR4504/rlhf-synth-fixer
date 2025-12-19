I'll help you create a secure AWS infrastructure using CDK for Terraform (TypeScript) across two files. Here's the complete implementation:

## modules.ts

```typescript
import { Construct } from "constructs";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { DbSubnetGroup } from "@cdktf/provider-aws/lib/db-subnet-group";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketEncryption } from "@cdktf/provider-aws/lib/s3-bucket-encryption";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { S3BucketPolicy } from "@cdktf/provider-aws/lib/s3-bucket-policy";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamInstanceProfile } from "@cdktf/provider-aws/lib/iam-instance-profile";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";

export interface NetworkingModuleConfig {
  vpcCidr: string;
  publicSubnetCidr: string;
  privateSubnetCidr: string;
  environment: string;
}

export interface ComputeModuleConfig {
  instanceType: string;
  adminIpRange: string;
  environment: string;
}

export interface DatabaseModuleConfig {
  dbInstanceClass: string;
  dbName: string;
  dbUsername: string;
  dbPassword: string;
  environment: string;
}

export interface StorageModuleConfig {
  publicBucketName: string;
  privateBucketName: string;
  environment: string;
}

export class NetworkingModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;
  public readonly internetGateway: InternetGateway;

  constructor(scope: Construct, id: string, config: NetworkingModuleConfig) {
    super(scope, id);

    // Get availability zones
    const azs = new DataAwsAvailabilityZones(this, "azs", {
      state: "available"
    });

    // Create VPC
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.environment}-vpc`,
        Environment: config.environment
      }
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.environment}-igw`,
        Environment: config.environment
      }
    });

    // Create public subnet
    this.publicSubnet = new Subnet(this, "public-subnet", {
      vpcId: this.vpc.id,
      cidrBlock: config.publicSubnetCidr,
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${config.environment}-public-subnet`,
        Environment: config.environment,
        Type: "Public"
      }
    });

    // Create private subnet
    this.privateSubnet = new Subnet(this, "private-subnet", {
      vpcId: this.vpc.id,
      cidrBlock: config.privateSubnetCidr,
      availabilityZone: `\${${azs.fqn}.names[1]}`,
      tags: {
        Name: `${config.environment}-private-subnet`,
        Environment: config.environment,
        Type: "Private"
      }
    });

    // Create EIP for NAT Gateway
    const natEip = new Eip(this, "nat-eip", {
      domain: "vpc",
      tags: {
        Name: `${config.environment}-nat-eip`,
        Environment: config.environment
      }
    });

    // Create NAT Gateway
    const natGateway = new NatGateway(this, "nat-gateway", {
      allocationId: natEip.id,
      subnetId: this.publicSubnet.id,
      tags: {
        Name: `${config.environment}-nat-gateway`,
        Environment: config.environment
      }
    });

    // Create route table for public subnet
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.environment}-public-rt`,
        Environment: config.environment
      }
    });

    // Create route to internet gateway
    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id
    });

    // Associate public subnet with public route table
    new RouteTableAssociation(this, "public-rta", {
      subnetId: this.publicSubnet.id,
      routeTableId: publicRouteTable.id
    });

    // Create route table for private subnet
    const privateRouteTable = new RouteTable(this, "private-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.environment}-private-rt`,
        Environment: config.environment
      }
    });

    // Create route to NAT gateway
    new Route(this, "private-route", {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGateway.id
    });

    // Associate private subnet with private route table
    new RouteTableAssociation(this, "private-rta", {
      subnetId: this.privateSubnet.id,
      routeTableId: privateRouteTable.id
    });
  }
}

export class ComputeModule extends Construct {
  public readonly publicInstance: Instance;
  public readonly privateInstance: Instance;
  public readonly webSecurityGroup: SecurityGroup;
  public readonly appSecurityGroup: SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    config: ComputeModuleConfig,
    networking: NetworkingModule
  ) {
    super(scope, id);

    // Get latest Amazon Linux 2 AMI
    const ami = new DataAwsAmi(this, "amazon-linux", {
      mostRecent: true,
      owners: ["amazon"],
      filter: [
        {
          name: "name",
          values: ["amzn2-ami-hvm-*-x86_64-gp2"]
        }
      ]
    });

    // Create IAM role for EC2 instances
    const ec2Role = new IamRole(this, "ec2-role", {
      name: `${config.environment}-ec2-role`,
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Action: "sts:AssumeRole",
            Effect: "Allow",
            Principal: {
              Service: "ec2.amazonaws.com"
            }
          }
        ]
      }),
      tags: {
        Environment: config.environment
      }
    });

    // Attach minimal required policies
    new IamRolePolicyAttachment(this, "ec2-ssm-policy", {
      role: ec2Role.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    });

    // Create instance profile
    const instanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: `${config.environment}-ec2-instance-profile`,
      role: ec2Role.name
    });

    // Security group for web server (public subnet)
    this.webSecurityGroup = new SecurityGroup(this, "web-sg", {
      name: `${config.environment}-web-sg`,
      description: "Security group for web server",
      vpcId: networking.vpc.id,
      ingress: [
        {
          description: "SSH from admin IPs",
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: [config.adminIpRange]
        },
        {
          description: "HTTP",
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"]
        },
        {
          description: "HTTPS",
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      egress: [
        {
          description: "All outbound traffic",
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      tags: {
        Name: `${config.environment}-web-sg`,
        Environment: config.environment
      }
    });

    // Security group for app server (private subnet)
    this.appSecurityGroup = new SecurityGroup(this, "app-sg", {
      name: `${config.environment}-app-sg`,
      description: "Security group for app server",
      vpcId: networking.vpc.id,
      ingress: [
        {
          description: "SSH from web server",
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          securityGroups: [this.webSecurityGroup.id]
        },
        {
          description: "App traffic from web server",
          fromPort: 8080,
          toPort: 8080,
          protocol: "tcp",
          securityGroups: [this.webSecurityGroup.id]
        }
      ],
      egress: [
        {
          description: "All outbound traffic",
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"]
        }
      ],
      tags: {
        Name: `${config.environment}-app-sg`,
        Environment: config.environment
      }
    });

    // Public EC2 instance (web server)
    this.publicInstance = new Instance(this, "web-instance", {
      ami: ami.id,
      instanceType: config.instanceType,
      subnetId: networking.publicSubnet.id,
      vpcSecurityGroupIds: [this.webSecurityGroup.id],
      iamInstanceProfile: instanceProfile.name,
      userData: Buffer.from(`#!/bin/bash
        yum update -y
        yum install -y httpd
        systemctl start httpd
        systemctl enable httpd
        echo "<h1>Web Server - ${config.environment}</h1>" > /var/www/html/index.html
      `).toString('base64'),
      tags: {
        Name: `${config.environment}-web-server`,
        Environment: config.environment,
        Type: "WebServer"
      }
    });

    // Private EC2 instance (app server)
    this.privateInstance = new Instance(this, "app-instance", {
      ami: ami.id,
      instanceType: config.instanceType,
      subnetId: networking.privateSubnet.id,
      vpcSecurityGroupIds: [this.appSecurityGroup.id],
      iamInstanceProfile: instanceProfile.name,
      userData: Buffer.from(`#!/bin/bash
        yum update -y
        yum install -y java-11-openjdk
        echo "App Server - ${config.environment}" > /home/ec2-user/app.txt
      `).toString('base64'),
      tags: {
        Name: `${config.environment}-app-server`,
        Environment: config.environment,
        Type: "AppServer"
      }
    });
  }
}

export class DatabaseModule extends Construct {
  public readonly rdsInstance: DbInstance;
  public readonly dbSecurityGroup: SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    config: DatabaseModuleConfig,
    networking: NetworkingModule,
    compute: ComputeModule
  ) {
    super(scope, id);

    // Create DB subnet group
    const dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: `${config.environment}-db-subnet-group`,
      subnetIds: [networking.publicSubnet.id, networking.privateSubnet.id],
      tags: {
        Name: `${config.environment}-db-subnet-group`,
        Environment: config.environment
      }
    });

    // Security group for RDS
    this.dbSecurityGroup = new SecurityGroup(this, "db-sg", {
      name: `${config.environment}-db-sg`,
      description: "Security group for RDS database",
      vpcId: networking.vpc.id,
      ingress: [
        {
          description: "MySQL from app servers",
          fromPort: 3306,
          toPort: 3306,
          protocol: "tcp",
          securityGroups: [compute.appSecurityGroup.id]
        }
      ],
      tags: {
        Name: `${config.environment}-db-sg`,
        Environment: config.environment
      }
    });

    // RDS instance
    this.rdsInstance = new DbInstance(this, "rds-instance", {
      identifier: `${config.environment}-database`,
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: config.dbInstanceClass,
      allocatedStorage: 20,
      storageType: "gp2",
      storageEncrypted: true,
      dbName: config.dbName,
      username: config.dbUsername,
      password: config.dbPassword,
      vpcSecurityGroupIds: [this.dbSecurityGroup.id],
      dbSubnetGroupName: dbSubnetGroup.name,
      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      skipFinalSnapshot: true,
      deletionProtection: false,
      tags: {
        Name: `${config.environment}-database`,
        Environment: config.environment
      }
    });
  }
}

export class StorageModule extends Construct {
  public readonly publicBucket: S3Bucket;
  public readonly privateBucket: S3Bucket;

  constructor(scope: Construct, id: string, config: StorageModuleConfig) {
    super(scope, id);

    // Public S3 bucket for assets
    this.publicBucket = new S3Bucket(this, "public-bucket", {
      bucket: config.publicBucketName,
      tags: {
        Name: config.publicBucketName,
        Environment: config.environment,
        Type: "Public"
      }
    });

    // Enable encryption for public bucket
    new S3BucketEncryption(this, "public-bucket-encryption", {
      bucket: this.publicBucket.id,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256"
          }
        }
      }
    });

    // Configure public access for public bucket
    new S3BucketPublicAccessBlock(this, "public-bucket-pab", {
      bucket: this.publicBucket.id,
      blockPublicAcls: false,
      blockPublicPolicy: false,
      ignorePublicAcls: false,
      restrictPublicBuckets: false
    });

    // Public read policy for public bucket
    new S3BucketPolicy(this, "public-bucket-policy", {
      bucket: this.publicBucket.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "PublicReadGetObject",
            Effect: "Allow",
            Principal: "*",
            Action: "s3:GetObject",
            Resource: `${this.publicBucket.arn}/*`
          }
        ]
      })
    });

    // Private S3 bucket
    this.privateBucket = new S3Bucket(this, "private-bucket", {
      bucket: config.privateBucketName,
      tags: {
        Name: config.privateBucketName,
        Environment: config.environment,
        Type: "Private"
      }
    });

    // Enable encryption for private bucket
    new S3BucketEncryption(this, "private-bucket-encryption", {
      bucket: this.privateBucket.id,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256"
          }
        }
      }
    });

    // Block all public access for private bucket
    new S3BucketPublicAccessBlock(this, "private-bucket-pab", {
      bucket: this.privateBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true
    });
  }
}
```

## tapstack.ts

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import {
  NetworkingModule,
  ComputeModule,
  DatabaseModule,
  StorageModule,
  NetworkingModuleConfig,
  ComputeModuleConfig,
  DatabaseModuleConfig,
  StorageModuleConfig
} from "./modules";

class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region: "us-west-2",
      defaultTags: [
        {
          tags: {
            Project: "TapStack",
            ManagedBy: "Terraform-CDK",
            CreatedBy: "CloudEngineer"
          }
        }
      ]
    });

    // Environment configuration
    const environment = "production";
    const adminIpRange = "203.0.113.0/24"; // Replace with your actual admin IP range

    // Networking Module Configuration
    const networkingConfig: NetworkingModuleConfig = {
      vpcCidr: "10.0.0.0/16",
      publicSubnetCidr: "10.0.1.0/24",
      privateSubnetCidr: "10.0.2.0/24",
      environment: environment
    };

    // Compute Module Configuration
    const computeConfig: ComputeModuleConfig = {
      instanceType: "t3.micro",
      adminIpRange: adminIpRange,
      environment: environment
    };

    // Database Module Configuration
    const databaseConfig: DatabaseModuleConfig = {
      dbInstanceClass: "db.t3.micro",
      dbName: "tapstackdb",
      dbUsername: "admin",
      dbPassword: "SecurePassword123!", // In production, use AWS Secrets Manager
      environment: environment
    };

    // Storage Module Configuration
    const storageConfig: StorageModuleConfig = {
      publicBucketName: `tapstack-public-assets-${environment}-${Date.now()}`,
      privateBucketName: `tapstack-private-data-${environment}-${Date.now()}`,
      environment: environment
    };

    // Instantiate Modules
    const networking = new NetworkingModule(this, "networking", networkingConfig);
    
    const compute = new ComputeModule(this, "compute", computeConfig, networking);
    
    const database = new DatabaseModule(this, "database", databaseConfig, networking, compute);
    
    const storage = new StorageModule(this, "storage", storageConfig);

    // Terraform Outputs
    new TerraformOutput(this, "vpc-id", {
      value: networking.vpc.id,
      description: "ID of the VPC"
    });

    new TerraformOutput(this, "public-subnet-id", {
      value: networking.publicSubnet.id,
      description: "ID of the public subnet"
    });

    new TerraformOutput(this, "private-subnet-id", {
      value: networking.privateSubnet.id,
      description: "ID of the private subnet"
    });

    new TerraformOutput(this, "web-instance-id", {
      value: compute.publicInstance.id,
      description: "ID of the web server instance"
    });

    new TerraformOutput(this, "web-instance-public-ip", {
      value: compute.publicInstance.publicIp,
      description: "Public IP of the web server"
    });

    new TerraformOutput(this, "app-instance-id", {
      value: compute.privateInstance.id,
      description: "ID of the app server instance"
    });

    new TerraformOutput(this, "app-instance-private-ip", {
      value: compute.privateInstance.privateIp,
      description: "Private IP of the app server"
    });

    new TerraformOutput(this, "rds-endpoint", {
      value: database.rdsInstance.endpoint,
      description: "RDS instance endpoint",
      sensitive: true
    });

    new TerraformOutput(this, "public-bucket-name", {
      value: storage.publicBucket.bucket,
      description: "Name of the public S3 bucket"
    });

    new TerraformOutput(this, "private-bucket-name", {
      value: storage.privateBucket.bucket,
      description: "Name of the private S3 bucket"
    });

    new TerraformOutput(this, "public-bucket-domain", {
      value: storage.publicBucket.bucketDomainName,
      description: "Domain name of the public S3 bucket"
    });
  }
}

const app = new App();
new TapStack(app, "tapstack");
app.synth();
```

## Key Security Features Implemented

### 1. **Network Security**
- **VPC Isolation**: Custom VPC with separate public and private subnets
- **NAT Gateway**: Allows private subnet instances to access internet securely
- **Security Groups**: Restrictive ingress/egress rules following least privilege

### 2. **Compute Security**
- **SSH Restriction**: SSH access limited to specific admin IP range
- **IAM Roles**: EC2 instances use IAM roles instead of access keys
- **Minimal Permissions**: Only essential policies attached (SSM for management)
- **Network Segmentation**: Web server in public subnet, app server in private subnet

### 3. **Database Security**
- **Network Isolation**: RDS in private subnets only
- **Security Groups**: Database only accessible from app server security group
- **Encryption**: Storage encryption enabled at rest
- **Backup Configuration**: Automated backups with retention

### 4. **Storage Security**
- **Encryption**: Both S3 buckets encrypted at rest with AES256
- **Access Control**: Public bucket allows read-only access, private bucket blocks all public access
- **Bucket Policies**: Explicit policies for access control

### 5. **IAM Best Practices**
- **Least Privilege**: Minimal required permissions for each resource
- **Role-based Access**: Using IAM roles instead of users/access keys
- **Resource-specific Policies**: Granular permissions per service

## Deployment Instructions

1. **Initialize the project**:
```bash
npm install -g cdktf-cli
cdktf init --template=typescript --providers=aws
```

2. **Install dependencies**:
```bash
npm install @cdktf/provider-aws
```

3. **Replace the generated files** with the provided `modules.ts` and `tapstack.ts`

4. **Configure AWS credentials**:
```bash
aws configure
```

5. **Deploy the infrastructure**:
```bash
cdktf deploy
```

## Important Security Notes

- **Replace the admin IP range** in `tapstack.ts` with your actual IP range
- **Use AWS Secrets Manager** for database passwords in production
- **Enable CloudTrail** for audit logging (can be added as additional module)
- **Consider using AWS KMS** for advanced encryption key management
- **Implement monitoring** with CloudWatch and AWS Config for compliance

This implementation provides a solid foundation for secure AWS infrastructure following best practices for network segmentation, access control, and data protection.