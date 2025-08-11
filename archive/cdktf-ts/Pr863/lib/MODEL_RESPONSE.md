I'll create a complete, production-ready cdktf project for deploying a foundational web environment on AWS. Here are the two files as requested:

## lib/modules.ts

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
import { S3Bucket } from "@cdktf/provider-aws/lib/s3-bucket";
import { S3BucketServerSideEncryptionConfiguration } from "@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration";
import { S3BucketPublicAccessBlock } from "@cdktf/provider-aws/lib/s3-bucket-public-access-block";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";

/**
 * VPC Module - Creates a complete VPC infrastructure with public and private subnets
 * across two availability zones, including internet gateway and NAT gateways
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateways: NatGateway[];
  public readonly availabilityZones: DataAwsAvailabilityZones;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Get available AZs in the region
    this.availabilityZones = new DataAwsAvailabilityZones(this, "available-azs", {
      state: "available",
    });

    // Create VPC with specified CIDR block
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: "production-vpc",
        Environment: "Production",
      },
    });

    // Create Internet Gateway for public subnets
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: "production-igw",
        Environment: "Production",
      },
    });

    // Initialize arrays for subnets and NAT gateways
    this.publicSubnets = [];
    this.privateSubnets = [];
    this.natGateways = [];

    // Create public and private subnets across two AZs
    for (let i = 0; i < 2; i++) {
      // Public subnet
      const publicSubnet = new Subnet(this, `public-subnet-${i + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 1}.0/24`,
        availabilityZone: `\${${this.availabilityZones.fqn}.names[${i}]}`,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `production-public-subnet-${i + 1}`,
          Environment: "Production",
          Type: "Public",
        },
      });
      this.publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new Subnet(this, `private-subnet-${i + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${i + 10}.0/24`,
        availabilityZone: `\${${this.availabilityZones.fqn}.names[${i}]}`,
        tags: {
          Name: `production-private-subnet-${i + 1}`,
          Environment: "Production",
          Type: "Private",
        },
      });
      this.privateSubnets.push(privateSubnet);

      // Elastic IP for NAT Gateway
      const eip = new Eip(this, `nat-eip-${i + 1}`, {
        domain: "vpc",
        tags: {
          Name: `production-nat-eip-${i + 1}`,
          Environment: "Production",
        },
      });

      // NAT Gateway for private subnet internet access
      const natGateway = new NatGateway(this, `nat-gateway-${i + 1}`, {
        allocationId: eip.id,
        subnetId: publicSubnet.id,
        tags: {
          Name: `production-nat-gateway-${i + 1}`,
          Environment: "Production",
        },
      });
      this.natGateways.push(natGateway);
    }

    // Route table for public subnets
    const publicRouteTable = new RouteTable(this, "public-route-table", {
      vpcId: this.vpc.id,
      tags: {
        Name: "production-public-route-table",
        Environment: "Production",
      },
    });

    // Route for public subnets to internet gateway
    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-route-association-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create route tables and routes for private subnets
    this.privateSubnets.forEach((subnet, index) => {
      const privateRouteTable = new RouteTable(this, `private-route-table-${index + 1}`, {
        vpcId: this.vpc.id,
        tags: {
          Name: `production-private-route-table-${index + 1}`,
          Environment: "Production",
        },
      });

      // Route for private subnets to NAT gateway
      new Route(this, `private-route-${index + 1}`, {
        routeTableId: privateRouteTable.id,
        destinationCidrBlock: "0.0.0.0/0",
        natGatewayId: this.natGateways[index].id,
      });

      // Associate private subnet with its route table
      new RouteTableAssociation(this, `private-route-association-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}

/**
 * S3 Logging Bucket Module - Creates a secure S3 bucket for logging purposes
 * with server-side encryption and blocked public access
 */
export class S3LoggingBucketModule extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Create S3 bucket for logging
    this.bucket = new S3Bucket(this, "logging-bucket", {
      bucketPrefix: "production-logging-",
      tags: {
        Name: "production-logging-bucket",
        Environment: "Production",
        Purpose: "Logging",
      },
    });

    // Configure server-side encryption (SSE-S3)
    new S3BucketServerSideEncryptionConfiguration(this, "bucket-encryption", {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "AES256",
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block all public access to the bucket
    new S3BucketPublicAccessBlock(this, "bucket-public-access-block", {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}

/**
 * EC2 Instance Module - Creates a web server instance in a public subnet
 * with appropriate security groups for web traffic and SSH access
 */
export class Ec2InstanceModule extends Construct {
  public readonly instance: Instance;
  public readonly securityGroup: SecurityGroup;

  constructor(
    scope: Construct,
    id: string,
    config: {
      vpcId: string;
      subnetId: string;
    }
  ) {
    super(scope, id);

    // Get the latest Amazon Linux 2 AMI
    const amazonLinuxAmi = new DataAwsAmi(this, "amazon-linux-ami", {
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

    // Create security group for the web server
    this.securityGroup = new SecurityGroup(this, "web-server-sg", {
      name: "production-web-server-sg",
      description: "Security group for production web server",
      vpcId: config.vpcId,
      tags: {
        Name: "production-web-server-sg",
        Environment: "Production",
      },
    });

    // Allow HTTP traffic from anywhere
    this.securityGroup.addIngressRule({
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      description: "Allow HTTP traffic from anywhere",
    });

    // Allow HTTPS traffic from anywhere
    this.securityGroup.addIngressRule({
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      description: "Allow HTTPS traffic from anywhere",
    });

    // Allow SSH access from specific IP
    // NOTE: Replace YOUR_IP_HERE with your actual IP address
    this.securityGroup.addIngressRule({
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: ["YOUR_IP_HERE/32"], // REPLACE WITH YOUR ACTUAL IP
      description: "Allow SSH access from specific IP",
    });

    // Allow all outbound traffic
    this.securityGroup.addEgressRule({
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      description: "Allow all outbound traffic",
    });

    // Create EC2 instance
    this.instance = new Instance(this, "web-server", {
      ami: amazonLinuxAmi.id,
      instanceType: "t2.micro",
      subnetId: config.subnetId,
      vpcSecurityGroupIds: [this.securityGroup.id],
      associatePublicIpAddress: true,
      userData: `#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Production Web Server</h1><p>Server is running successfully!</p>" > /var/www/html/index.html
`,
      tags: {
        Name: "production-web-server",
        Environment: "Production",
        Type: "WebServer",
      },
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { TerraformOutput } from "cdktf";
import { VpcModule, S3LoggingBucketModule, Ec2InstanceModule } from "./modules";

/**
 * Main Terraform Stack - Orchestrates the deployment of all infrastructure components
 * This stack creates a complete web environment with VPC, S3 logging bucket, and EC2 web server
 */
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider for us-west-2 region
    new AwsProvider(this, "aws", {
      region: "us-west-2",
      defaultTags: [
        {
          tags: {
            Environment: "Production",
            ManagedBy: "Terraform-CDK",
            Project: "TAP-Foundation",
          },
        },
      ],
    });

    // Deploy VPC infrastructure with public and private subnets
    const vpcModule = new VpcModule(this, "vpc-module");

    // Deploy S3 logging bucket with encryption and security settings
    const s3LoggingModule = new S3LoggingBucketModule(this, "s3-logging-module");

    // Deploy EC2 web server in the first public subnet
    const ec2Module = new Ec2InstanceModule(this, "ec2-module", {
      vpcId: vpcModule.vpc.id,
      subnetId: vpcModule.publicSubnets[0].id, // Use first public subnet
    });

    // Output important resource information for reference
    new TerraformOutput(this, "vpc-id", {
      value: vpcModule.vpc.id,
      description: "ID of the created VPC",
    });

    new TerraformOutput(this, "public-subnet-ids", {
      value: vpcModule.publicSubnets.map(subnet => subnet.id),
      description: "IDs of the public subnets",
    });

    new TerraformOutput(this, "private-subnet-ids", {
      value: vpcModule.privateSubnets.map(subnet => subnet.id),
      description: "IDs of the private subnets",
    });

    new TerraformOutput(this, "s3-bucket-name", {
      value: s3LoggingModule.bucket.bucket,
      description: "Name of the S3 logging bucket",
    });

    new TerraformOutput(this, "web-server-public-ip", {
      value: ec2Module.instance.publicIp,
      description: "Public IP address of the web server",
    });

    new TerraformOutput(this, "web-server-public-dns", {
      value: ec2Module.instance.publicDns,
      description: "Public DNS name of the web server",
    });

    new TerraformOutput(this, "web-server-security-group-id", {
      value: ec2Module.securityGroup.id,
      description: "Security group ID for the web server",
    });

    new TerraformOutput(this, "web-server-url", {
      value: `http://\${${ec2Module.instance.fqn}.public_ip}`,
      description: "URL to access the web server",
    });
  }
}
```

## Key Features and Security Considerations

### Architecture Overview
- **VPC Module**: Creates a production-ready VPC with public/private subnets across 2 AZs
- **S3 Module**: Secure logging bucket with encryption and blocked public access
- **EC2 Module**: Web server with appropriate security groups and user data script

### Security Features
1. **Network Segmentation**: Separate public and private subnets
2. **NAT Gateways**: Secure outbound internet access for private subnets
3. **Security Groups**: Restrictive inbound rules with SSH limited to specific IP
4. **S3 Security**: Server-side encryption and public access blocking
5. **Default Tagging**: All resources tagged with Environment: Production

### Important Notes
- **SSH Access**: Replace `YOUR_IP_HERE` in the security group with your actual IP address
- **Region**: Configured for us-west-2 as required
- **Instance Type**: Uses t2.micro (free tier eligible)
- **AMI**: Automatically selects the latest Amazon Linux 2 AMI
- **User Data**: Installs and configures Apache web server automatically

### Usage
1. Replace the placeholder IP in the SSH security group rule
2. Run `cdktf deploy` to provision the infrastructure
3. Access the web server using the output URL
4. Monitor logs in the created S3 bucket

This infrastructure provides a solid foundation for a production web environment with proper security controls and scalability considerations.