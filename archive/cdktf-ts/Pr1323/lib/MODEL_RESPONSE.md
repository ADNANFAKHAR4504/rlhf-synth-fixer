I'll generate a comprehensive CDKTF Infrastructure as Code solution. Since you didn't specify the exact provider and resources, I'll create an AWS example with common infrastructure components that demonstrates all the requested constraints and best practices.

## CDKTF Infrastructure as Code Solution

### Project Structure
```
cdktf-infrastructure/
├── main.ts
├── constructs/
│   ├── networking.ts
│   ├── compute.ts
│   ├── storage.ts
│   └── security.ts
├── config/
│   └── environment.ts
├── package.json
└── cdktf.json
```

### 1. Main Infrastructure Stack

```typescript
// main.ts
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { NetworkingConstruct } from "./constructs/networking";
import { ComputeConstruct } from "./constructs/compute";
import { StorageConstruct } from "./constructs/storage";
import { SecurityConstruct } from "./constructs/security";
import { EnvironmentConfig } from "./config/environment";

/**
 * Main infrastructure stack that orchestrates all resources
 * Follows modular design pattern for reusability and maintainability
 */
class InfrastructureStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Load environment configuration
    const config = new EnvironmentConfig();

    // Configure AWS Provider with region from environment
    new AwsProvider(this, "aws", {
      region: config.region,
      defaultTags: [
        {
          tags: config.defaultTags,
        },
      ],
    });

    // Create networking infrastructure (VPC, subnets, gateways)
    const networking = new NetworkingConstruct(this, "networking", {
      environment: config.environment,
      region: config.region,
      availabilityZones: config.availabilityZones,
      vpcCidr: config.vpcCidr,
      tags: config.defaultTags,
    });

    // Create security groups and IAM roles
    const security = new SecurityConstruct(this, "security", {
      vpc: networking.vpc,
      environment: config.environment,
      tags: config.defaultTags,
    });

    // Create storage resources (S3 buckets)
    const storage = new StorageConstruct(this, "storage", {
      environment: config.environment,
      tags: config.defaultTags,
    });

    // Create compute resources (EC2 instances)
    const compute = new ComputeConstruct(this, "compute", {
      vpc: networking.vpc,
      privateSubnets: networking.privateSubnets,
      publicSubnets: networking.publicSubnets,
      securityGroups: security.securityGroups,
      iamRole: security.ec2Role,
      environment: config.environment,
      instanceType: config.instanceType,
      keyPairName: config.keyPairName,
      tags: config.defaultTags,
    });

    // Output important resource identifiers and connection details
    this.createOutputs(networking, compute, storage, security);
  }

  /**
   * Create Terraform outputs for resource identifiers and connection details
   */
  private createOutputs(
    networking: NetworkingConstruct,
    compute: ComputeConstruct,
    storage: StorageConstruct,
    security: SecurityConstruct
  ) {
    // VPC and Networking Outputs
    new TerraformOutput(this, "vpc_id", {
      value: networking.vpc.id,
      description: "ID of the VPC",
    });

    new TerraformOutput(this, "public_subnet_ids", {
      value: networking.publicSubnets.map(subnet => subnet.id),
      description: "IDs of the public subnets",
    });

    new TerraformOutput(this, "private_subnet_ids", {
      value: networking.privateSubnets.map(subnet => subnet.id),
      description: "IDs of the private subnets",
    });

    // Compute Outputs
    new TerraformOutput(this, "web_server_public_ips", {
      value: compute.webServers.map(instance => instance.publicIp),
      description: "Public IP addresses of web servers",
    });

    new TerraformOutput(this, "app_server_private_ips", {
      value: compute.appServers.map(instance => instance.privateIp),
      description: "Private IP addresses of application servers",
    });

    // Storage Outputs
    new TerraformOutput(this, "s3_bucket_names", {
      value: {
        app_data: storage.appDataBucket.bucket,
        logs: storage.logsBucket.bucket,
      },
      description: "S3 bucket names for application data and logs",
    });

    // Security Outputs
    new TerraformOutput(this, "security_group_ids", {
      value: {
        web: security.securityGroups.web.id,
        app: security.securityGroups.app.id,
        database: security.securityGroups.database.id,
      },
      description: "Security group IDs",
    });
  }
}

// Initialize the CDK app and stack
const app = new App();
new InfrastructureStack(app, "infrastructure");
app.synth();
```

### 2. Environment Configuration

```typescript
// config/environment.ts
/**
 * Environment configuration class that manages all environment-specific settings
 * Uses environment variables for sensitive data and configuration
 */
export class EnvironmentConfig {
  public readonly environment: string;
  public readonly region: string;
  public readonly availabilityZones: string[];
  public readonly vpcCidr: string;
  public readonly instanceType: string;
  public readonly keyPairName: string;
  public readonly defaultTags: { [key: string]: string };

  constructor() {
    // Load configuration from environment variables with defaults
    this.environment = process.env.ENVIRONMENT || "dev";
    this.region = process.env.AWS_REGION || "us-west-2";
    this.availabilityZones = process.env.AVAILABILITY_ZONES?.split(",") || [
      "us-west-2a",
      "us-west-2b",
      "us-west-2c",
    ];
    this.vpcCidr = process.env.VPC_CIDR || "10.0.0.0/16";
    this.instanceType = process.env.INSTANCE_TYPE || "t3.micro";
    this.keyPairName = process.env.KEY_PAIR_NAME || "default-key";

    // Standard resource tags for governance and cost tracking
    this.defaultTags = {
      Environment: this.environment,
      Project: process.env.PROJECT_NAME || "cdktf-infrastructure",
      Owner: process.env.OWNER || "platform-team",
      ManagedBy: "terraform",
      CreatedBy: "cdktf",
    };
  }
}
```

### 3. Networking Construct

```typescript
// constructs/networking.ts
import { Construct } from "constructs";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";

export interface NetworkingConstructProps {
  environment: string;
  region: string;
  availabilityZones: string[];
  vpcCidr: string;
  tags: { [key: string]: string };
}

/**
 * Networking construct that creates VPC, subnets, gateways, and routing
 * Implements multi-AZ architecture for high availability
 */
export class NetworkingConstruct extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[] = [];
  public readonly privateSubnets: Subnet[] = [];
  public readonly internetGateway: InternetGateway;

  constructor(scope: Construct, id: string, props: NetworkingConstructProps) {
    super(scope, id);

    // Create VPC with DNS support enabled
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.tags,
        Name: `${props.environment}-vpc`,
      },
    });

    // Create Internet Gateway for public subnet internet access
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.environment}-igw`,
      },
    });

    // Create public and private subnets across multiple AZs
    this.createSubnets(props);

    // Create NAT Gateways for private subnet internet access
    this.createNatGateways(props);

    // Configure routing tables
    this.configureRouting(props);
  }

  /**
   * Create public and private subnets across availability zones
   */
  private createSubnets(props: NetworkingConstructProps) {
    props.availabilityZones.forEach((az, index) => {
      // Calculate CIDR blocks for subnets
      const publicCidr = `10.0.${index * 2 + 1}.0/24`;
      const privateCidr = `10.0.${index * 2 + 2}.0/24`;

      // Create public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: publicCidr,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          ...props.tags,
          Name: `${props.environment}-public-subnet-${index + 1}`,
          Type: "public",
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Create private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${index}`, {
        vpcId: this.vpc.id,
        cidrBlock: privateCidr,
        availabilityZone: az,
        tags: {
          ...props.tags,
          Name: `${props.environment}-private-subnet-${index + 1}`,
          Type: "private",
        },
      });
      this.privateSubnets.push(privateSubnet);
    });
  }

  /**
   * Create NAT Gateways in public subnets for private subnet internet access
   */
  private createNatGateways(props: NetworkingConstructProps) {
    this.publicSubnets.forEach((subnet, index) => {
      // Create Elastic IP for NAT Gateway
      const eip = new Eip(this, `nat-eip-${index}`, {
        domain: "vpc",
        tags: {
          ...props.tags,
          Name: `${props.environment}-nat-eip-${index + 1}`,
        },
      });

      // Create NAT Gateway
      new NatGateway(this, `nat-gateway-${index}`, {
        allocationId: eip.id,
        subnetId: subnet.id,
        tags: {
          ...props.tags,
          Name: `${props.environment}-nat-gateway-${index + 1}`,
        },
      });
    });
  }

  /**
   * Configure routing tables for public and private subnets
   */
  private configureRouting(props: NetworkingConstructProps) {
    // Create and configure public route table
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.environment}-public-rt`,
      },
    });

    // Add route to Internet Gateway
    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create private route tables (one per AZ for NAT Gateway routing)
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-rt-${index}`, {
        vpcId: this.vpc.id,
        tags: {
          ...props.tags,
          Name: `${props.environment}-private-rt-${index + 1}`,
        },
      });

      // Associate private subnet with its route table
      new RouteTableAssociation(this, `private-rt-association-${index}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}
```

### 4. Security Construct

```typescript
// constructs/security.ts
import { Construct } from "constructs";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { SecurityGroupRule } from "@cdktf/provider-aws/lib/security-group-rule";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { IamRolePolicyAttachment } from "@cdktf/provider-aws/lib/iam-role-policy-attachment";
import { IamInstanceProfile } from "@cdktf/provider-aws/lib/iam-instance-profile";

export interface SecurityConstructProps {
  vpc: Vpc;
  environment: string;
  tags: { [key: string]: string };
}

export interface SecurityGroups {
  web: SecurityGroup;
  app: SecurityGroup;
  database: SecurityGroup;
}

/**
 * Security construct that creates security groups and IAM roles
 * Implements least privilege access principles
 */
export class SecurityConstruct extends Construct {
  public readonly securityGroups: SecurityGroups;
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, props: SecurityConstructProps) {
    super(scope, id);

    // Create security groups with proper access controls
    this.securityGroups = this.createSecurityGroups(props);

    // Create IAM roles for EC2 instances
    this.ec2Role = this.createEC2Role(props);
    this.ec2InstanceProfile = this.createInstanceProfile(props);
  }

  /**
   * Create security groups for different tiers (web, app, database)
   */
  private createSecurityGroups(props: SecurityConstructProps): SecurityGroups {
    // Web tier security group (public-facing)
    const webSg = new SecurityGroup(this, "web-sg", {
      name: `${props.environment}-web-sg`,
      description: "Security group for web servers",
      vpcId: props.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.environment}-web-sg`,
        Tier: "web",
      },
    });

    // Web tier rules - Allow HTTP/HTTPS from internet
    new SecurityGroupRule(this, "web-http-ingress", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: webSg.id,
      description: "Allow HTTP traffic from internet",
    });

    new SecurityGroupRule(this, "web-https-ingress", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: webSg.id,
      description: "Allow HTTPS traffic from internet",
    });

    new SecurityGroupRule(this, "web-ssh-ingress", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: ["10.0.0.0/16"],
      securityGroupId: webSg.id,
      description: "Allow SSH from VPC",
    });

    // Application tier security group
    const appSg = new SecurityGroup(this, "app-sg", {
      name: `${props.environment}-app-sg`,
      description: "Security group for application servers",
      vpcId: props.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.environment}-app-sg`,
        Tier: "application",
      },
    });

    // App tier rules - Allow traffic from web tier
    new SecurityGroupRule(this, "app-web-ingress", {
      type: "ingress",
      fromPort: 8080,
      toPort: 8080,
      protocol: "tcp",
      sourceSecurityGroupId: webSg.id,
      securityGroupId: appSg.id,
      description: "Allow traffic from web tier",
    });

    new SecurityGroupRule(this, "app-ssh-ingress", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: ["10.0.0.0/16"],
      securityGroupId: appSg.id,
      description: "Allow SSH from VPC",
    });

    // Database tier security group
    const dbSg = new SecurityGroup(this, "db-sg", {
      name: `${props.environment}-db-sg`,
      description: "Security group for database servers",
      vpcId: props.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.environment}-db-sg`,
        Tier: "database",
      },
    });

    // Database tier rules - Allow traffic from app tier only
    new SecurityGroupRule(this, "db-app-ingress", {
      type: "ingress",
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      sourceSecurityGroupId: appSg.id,
      securityGroupId: dbSg.id,
      description: "Allow MySQL traffic from app tier",
    });

    // Allow all outbound traffic for all security groups
    [webSg, appSg, dbSg].forEach((sg, index) => {
      new SecurityGroupRule(this, `${sg.name}-egress-${index}`, {
        type: "egress",
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"],
        securityGroupId: sg.id,
        description: "Allow all outbound traffic",
      });
    });

    return {
      web: webSg,
      app: appSg,
      database: dbSg,
    };
  }

  /**
   * Create IAM role for EC2 instances with necessary permissions
   */
  private createEC2Role(props: SecurityConstructProps): IamRole {
    const role = new IamRole(this, "ec2-role", {
      name: `${props.environment}-ec2-role`,
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
        ...props.tags,
        Name: `${props.environment}-ec2-role`,
      },
    });

    // Attach necessary managed policies
    new IamRolePolicyAttachment(this, "ec2-ssm-policy", {
      role: role.name,
      policyArn: "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
    });

    new IamRolePolicyAttachment(this, "ec2-cloudwatch-policy", {
      role: role.name,
      policyArn: "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
    });

    return role;
  }

  /**
   * Create IAM instance profile for EC2 instances
   */
  private createInstanceProfile(props: SecurityConstructProps): IamInstanceProfile {
    return new IamInstanceProfile(this, "ec2-instance-profile", {
      name: `${props.environment}-ec2-instance-profile`,
      role: this.ec2Role.name,
      tags: {
        ...props.tags,
        Name: `${props.environment}-ec2-instance-profile`,
      },
    });
  }
}
```

### 5. Storage Construct

```typescript
// constructs/storage.ts
import { Construct } from "constructs";
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketVersioning } from "@cdktf/provider-aws/lib/s3-bucket-versioning";
import { S3BucketEncryption } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";

export interface StorageConstructProps {
  environment: string;
  tags: { [key: string]: string };
}

/**
 * Storage construct that creates S3 buckets with security best practices
 * Implements encryption, versioning, and access controls
 */
export class StorageConstruct extends Construct {
  public readonly appDataBucket: S3Bucket;
  public readonly logsBucket: S3Bucket;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    // Create application data bucket
    this.appDataBucket = this.createSecureS3Bucket(
      "app-data-bucket",
      `${props.environment}-app-data-${Date.now()}`,
      props
    );

    // Create logs bucket
    this.logsBucket = this.createSecureS3Bucket(
      "logs-bucket",
      `${props.environment}-logs-${Date.now()}`,
      props
    );
  }

  /**
   * Create S3 bucket with security best practices applied
   */
  private createSecureS3Bucket(
    id: string,
    bucketName: string,
    props: StorageConstructProps
  ): S3Bucket {
    // Create S3 bucket
    const bucket = new S3Bucket(this, id, {
      bucket: bucketName,
      tags: {
        ...props.tags,
        Name: bucketName,
      },
    });

    // Enable versioning
    new S3BucketVersioning(this, `${id}-versioning`, {
      bucket: bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // Enable server-side encryption
    new S3BucketEncryption(this, `${id}-encryption`, {
      bucket: bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, `${id}-public-access-block`, {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    return bucket;
  }
}
```

### 6. Compute Construct

```typescript
// constructs/compute.ts
import { Construct } from "constructs";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { IamRole } from "@cdktf/provider-aws/lib/iam-role";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";

export interface ComputeConstructProps {
  vpc: Vpc;
  publicSubnets: Subnet[];
  privateSubnets: Subnet[];
  securityGroups: {
    web: SecurityGroup;
    app: SecurityGroup;
    database: SecurityGroup;
  };
  iamRole: IamRole;
  environment: string;
  instanceType: string;
  keyPairName: string;
  tags: { [key: string]: string };
}

/**
 * Compute construct that creates EC2 instances across multiple tiers
 * Implements multi-AZ deployment for high availability
 */
export class ComputeConstruct extends Construct {
  public readonly webServers: Instance[] = [];
  public readonly appServers: Instance[] = [];

  constructor(scope: Construct, id: string, props: ComputeConstructProps) {
    super(scope, id);

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

    // Create web servers in public subnets
    this.createWebServers(ami, props);

    // Create application servers in private subnets
    this.createAppServers(ami, props);
  }

  /**
   * Create web server instances in public subnets
   */
  private createWebServers(ami: DataAwsAmi, props: ComputeConstructProps) {
    props.publicSubnets.forEach((subnet, index) => {
      const webServer = new Instance(this, `web-server-${index}`, {
        ami: ami.id,
        instanceType: props.instanceType,
        keyName: props.keyPairName,
        subnetId: subnet.id,
        vpcSecurityGroupIds: [props.securityGroups.web.id],
        associatePublicIpAddress: true,
        
        // User data script for web server setup
        userData: this.getWebServerUserData(),
        
        tags: {
          ...props.tags,
          Name: `${props.environment}-web-server-${index + 1}`,
          Tier: "web",
          AZ: subnet.availabilityZone,
        },
      });

      this.webServers.push(webServer);
    });
  }

  /**
   * Create application server instances in private subnets
   */
  private createAppServers(ami: DataAwsAmi, props: ComputeConstructProps) {
    props.privateSubnets.forEach((subnet, index) => {
      const appServer = new Instance(this, `app-server-${index}`, {
        ami: ami.id,
        instanceType: props.instanceType,
        keyName: props.keyPairName,
        subnetId: subnet.id,
        vpcSecurityGroupIds: [props.securityGroups.app.id],
        
        // User data script for app server setup
        userData: this.getAppServerUserData(),
        
        tags: {
          ...props.tags,
          Name: `${props.environment}-app-server-${index + 1}`,
          Tier: "application",
          AZ: subnet.availabilityZone,
        },
      });

      this.appServers.push(appServer);
    });
  }

  /**
   * Get user data script for web servers
   */
  private getWebServerUserData(): string {
    return Buffer.from(`#!/bin/bash
      yum update -y
      yum install -y httpd
      systemctl start httpd
      systemctl enable httpd
      echo "<h1>Web Server - $(hostname -f)</h1>" > /var/www/html/index.html
      echo "<p>Environment: ${process.env.ENVIRONMENT || 'dev'}</p>" >> /var/www/html/index.html
    `).toString('base64');
  }

  /**
   * Get user data script for application servers
   */
  private getAppServerUserData(): string {
    return Buffer.from(`#!/bin/bash
      yum update -y
      yum install -y java-11-amazon-corretto
      echo "Application Server Setup Complete" > /tmp/setup.log
    `).toString('base64');
  }
}
```

### 7. Package Configuration

```json
// package.json
{
  "name": "cdktf-infrastructure",
  "version": "1.0.0",
  "description": "CDKTF Infrastructure as Code",
  "main": "main.js",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy",
    "diff": "cdktf diff"
  },
  "dependencies": {
    "@cdktf/provider-aws": "^19.0.0",
    "cdktf": "^0.20.0",
    "constructs": "^10.3.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### 8. CDKTF Configuration

```json
// cdktf.json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "cdktf-infrastructure",
  "sendCrashReports": "false",
  "terraformProviders": [
    "aws@~> 5.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

### 9. Environment Variables Example

```bash
# .env.example
ENVIRONMENT=dev
AWS_REGION=us-west-2
AVAILABILITY_ZONES=us-west-2a,us-west-2b,us-west-2c
VPC_CIDR=10.0.0.0/16
INSTANCE_TYPE=t3.micro
KEY_PAIR_NAME=my-key-pair
PROJECT_NAME=cdktf-infrastructure
OWNER=platform-team
```

### 10. Deployment Instructions

```bash
# Install dependencies
npm install

# Generate provider bindings
npm run get

# Build TypeScript
npm run build

# Plan deployment (equivalent to terraform plan)
npm run diff

# Deploy infrastructure
npm run deploy

# Destroy infrastructure (when needed)
npm run destroy
```

## Key Features Implemented

### ✅ **Constraints Adherence**
- **CDKTF Constructs**: All resources defined using CDKTF constructs
- **