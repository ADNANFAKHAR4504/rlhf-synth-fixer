I'll create production-ready CDKTF code that meets all your requirements. Here's the complete implementation:

## lib/modules.ts

```typescript
import { Construct } from "constructs";
import { 
  Vpc, 
  Subnet, 
  InternetGateway, 
  RouteTable, 
  Route, 
  RouteTableAssociation,
  Instance,
  SecurityGroup,
  SecurityGroupRule
} from "@cdktf/provider-aws/lib";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";

/**
 * Properties interface for VpcModule
 */
export interface VpcModuleProps {
  /** CIDR block for the VPC */
  vpcCidr: string;
  /** Name prefix for all VPC resources */
  namePrefix: string;
}

/**
 * VpcModule - Creates a VPC with public and private subnets across multiple AZs
 * 
 * This module provisions:
 * - A VPC with DNS hostname and DNS resolution enabled
 * - 2 public subnets in different AZs with auto-assign public IP
 * - 1 private subnet in one of the AZs
 * - Internet Gateway for public internet access
 * - Route tables and associations for proper traffic routing
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnet: Subnet;
  public readonly internetGateway: InternetGateway;
  public readonly publicRouteTable: RouteTable;
  public readonly privateRouteTable: RouteTable;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    // Get available AZs in the region
    const availabilityZones = new DataAwsAvailabilityZones(this, "availability-zones", {
      state: "available",
    });

    // Create VPC with DNS support enabled for proper hostname resolution
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${props.namePrefix}-vpc`,
        Environment: "production",
        ManagedBy: "cdktf"
      }
    });

    // Create Internet Gateway for public subnet internet access
    this.internetGateway = new InternetGateway(this, "internet-gateway", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.namePrefix}-igw`,
        Environment: "production",
        ManagedBy: "cdktf"
      }
    });

    // Create public subnets in different AZs for high availability
    this.publicSubnets = [];
    
    // Public Subnet 1 - us-east-1a
    const publicSubnet1 = new Subnet(this, "public-subnet-1", {
      vpcId: this.vpc.id,
      cidrBlock: this.calculateSubnetCidr(props.vpcCidr, 0), // First subnet
      availabilityZone: availabilityZones.names.get(0), // us-east-1a
      mapPublicIpOnLaunch: true, // Auto-assign public IPs
      tags: {
        Name: `${props.namePrefix}-public-subnet-1`,
        Type: "public",
        Environment: "production",
        ManagedBy: "cdktf"
      }
    });
    this.publicSubnets.push(publicSubnet1);

    // Public Subnet 2 - us-east-1b
    const publicSubnet2 = new Subnet(this, "public-subnet-2", {
      vpcId: this.vpc.id,
      cidrBlock: this.calculateSubnetCidr(props.vpcCidr, 1), // Second subnet
      availabilityZone: availabilityZones.names.get(1), // us-east-1b
      mapPublicIpOnLaunch: true, // Auto-assign public IPs
      tags: {
        Name: `${props.namePrefix}-public-subnet-2`,
        Type: "public",
        Environment: "production",
        ManagedBy: "cdktf"
      }
    });
    this.publicSubnets.push(publicSubnet2);

    // Private Subnet - us-east-1a
    this.privateSubnet = new Subnet(this, "private-subnet", {
      vpcId: this.vpc.id,
      cidrBlock: this.calculateSubnetCidr(props.vpcCidr, 2), // Third subnet
      availabilityZone: availabilityZones.names.get(0), // us-east-1a
      mapPublicIpOnLaunch: false, // No public IPs for private subnet
      tags: {
        Name: `${props.namePrefix}-private-subnet`,
        Type: "private",
        Environment: "production",
        ManagedBy: "cdktf"
      }
    });

    // Create public route table with internet gateway route
    this.publicRouteTable = new RouteTable(this, "public-route-table", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.namePrefix}-public-rt`,
        Type: "public",
        Environment: "production",
        ManagedBy: "cdktf"
      }
    });

    // Route all traffic (0.0.0.0/0) to Internet Gateway for public subnets
    new Route(this, "public-route", {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id
    });

    // Associate public subnets with public route table
    new RouteTableAssociation(this, "public-subnet-1-association", {
      subnetId: publicSubnet1.id,
      routeTableId: this.publicRouteTable.id
    });

    new RouteTableAssociation(this, "public-subnet-2-association", {
      subnetId: publicSubnet2.id,
      routeTableId: this.publicRouteTable.id
    });

    // Create private route table (no internet gateway route)
    this.privateRouteTable = new RouteTable(this, "private-route-table", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${props.namePrefix}-private-rt`,
        Type: "private",
        Environment: "production",
        ManagedBy: "cdktf"
      }
    });

    // Associate private subnet with private route table
    new RouteTableAssociation(this, "private-subnet-association", {
      subnetId: this.privateSubnet.id,
      routeTableId: this.privateRouteTable.id
    });
  }

  /**
   * Calculate subnet CIDR blocks based on VPC CIDR
   * Assumes /24 subnets from a /16 VPC CIDR
   */
  private calculateSubnetCidr(vpcCidr: string, subnetIndex: number): string {
    const vpcBase = vpcCidr.split('/')[0];
    const octets = vpcBase.split('.');
    return `${octets[0]}.${octets[1]}.${subnetIndex}.0/24`;
  }
}

/**
 * Properties interface for Ec2Module
 */
export interface Ec2ModuleProps {
  /** VPC ID where resources will be created */
  vpcId: string;
  /** Array of public subnet IDs where EC2 instances will be launched */
  publicSubnetIds: string[];
  /** Name of the SSH key pair for EC2 instance access */
  sshKeyName: string;
  /** Name prefix for all EC2 resources */
  namePrefix: string;
}

/**
 * Ec2Module - Creates EC2 instances and security groups
 * 
 * This module provisions:
 * - A security group allowing SSH access from anywhere
 * - EC2 instances in each public subnet using the latest Amazon Linux 2 AMI
 * - Proper tagging for resource management
 */
export class Ec2Module extends Construct {
  public readonly securityGroup: SecurityGroup;
  public readonly instances: Instance[];

  constructor(scope: Construct, id: string, props: Ec2ModuleProps) {
    super(scope, id);

    // Get the latest Amazon Linux 2 AMI
    const amazonLinuxAmi = new DataAwsAmi(this, "amazon-linux-ami", {
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

    // Create security group for EC2 instances
    this.securityGroup = new SecurityGroup(this, "ec2-security-group", {
      name: `${props.namePrefix}-ec2-sg`,
      description: "Security group for EC2 instances allowing SSH access",
      vpcId: props.vpcId,
      tags: {
        Name: `${props.namePrefix}-ec2-sg`,
        Environment: "production",
        ManagedBy: "cdktf"
      }
    });

    // Allow inbound SSH (port 22) from anywhere
    // Note: In production, consider restricting this to specific IP ranges
    new SecurityGroupRule(this, "ssh-ingress-rule", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.securityGroup.id,
      description: "Allow SSH access from anywhere"
    });

    // Allow all outbound traffic (default behavior, but explicit for clarity)
    new SecurityGroupRule(this, "all-egress-rule", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.securityGroup.id,
      description: "Allow all outbound traffic"
    });

    // Create EC2 instances in each public subnet
    this.instances = [];
    
    props.publicSubnetIds.forEach((subnetId, index) => {
      const instance = new Instance(this, `ec2-instance-${index + 1}`, {
        ami: amazonLinuxAmi.id,
        instanceType: "t3.medium", // As specified in requirements
        keyName: props.sshKeyName,
        subnetId: subnetId,
        vpcSecurityGroupIds: [this.securityGroup.id],
        
        // Enable detailed monitoring for production workloads
        monitoring: true,
        
        // Associate public IP (should be automatic due to subnet config, but explicit)
        associatePublicIpAddress: true,
        
        // Root volume configuration for production use
        rootBlockDevice: {
          volumeType: "gp3",
          volumeSize: 20,
          encrypted: true,
          deleteOnTermination: true,
          tags: {
            Name: `${props.namePrefix}-ec2-${index + 1}-root-volume`,
            Environment: "production",
            ManagedBy: "cdktf"
          }
        },
        
        tags: {
          Name: `${props.namePrefix}-ec2-instance-${index + 1}`,
          Environment: "production",
          ManagedBy: "cdktf",
          SubnetIndex: `${index + 1}`
        }
      });
      
      this.instances.push(instance);
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformVariable, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { VpcModule, Ec2Module } from "./modules";

/**
 * TapStack - Main infrastructure stack
 * 
 * This stack orchestrates the creation of the complete AWS infrastructure including:
 * - VPC with public and private subnets across multiple AZs
 * - EC2 instances in public subnets with proper security groups
 * - All necessary networking components (IGW, Route Tables, etc.)
 */
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider for us-east-1 region
    new AwsProvider(this, "aws", {
      region: "us-east-1",
      // Default tags applied to all resources created by this provider
      defaultTags: [
        {
          tags: {
            Project: "tap-infrastructure",
            ManagedBy: "cdktf",
            Environment: "production"
          }
        }
      ]
    });

    // Define Terraform variable for SSH key name
    // This allows the SSH key to be specified at deployment time
    const sshKeyName = new TerraformVariable(this, "ssh_key_name", {
      type: "string",
      description: "Name of the AWS EC2 Key Pair to use for SSH access to instances",
      validation: [
        {
          condition: "${length(var.ssh_key_name) > 0}",
          errorMessage: "SSH key name cannot be empty"
        }
      ]
    });

    // Create VPC module with networking infrastructure
    const vpcModule = new VpcModule(this, "vpc-module", {
      vpcCidr: "10.0.0.0/16", // Provides 65,536 IP addresses
      namePrefix: "tap-prod"
    });

    // Create EC2 module with compute infrastructure
    // Pass the public subnet IDs from VPC module to EC2 module
    const ec2Module = new Ec2Module(this, "ec2-module", {
      vpcId: vpcModule.vpc.id,
      publicSubnetIds: vpcModule.publicSubnets.map(subnet => subnet.id),
      sshKeyName: sshKeyName.stringValue,
      namePrefix: "tap-prod"
    });

    // Output important resource information for reference
    new TerraformOutput(this, "vpc_id", {
      description: "ID of the created VPC",
      value: vpcModule.vpc.id
    });

    new TerraformOutput(this, "public_subnet_ids", {
      description: "IDs of the public subnets",
      value: vpcModule.publicSubnets.map(subnet => subnet.id)
    });

    new TerraformOutput(this, "private_subnet_id", {
      description: "ID of the private subnet",
      value: vpcModule.privateSubnet.id
    });

    new TerraformOutput(this, "ec2_instance_ids", {
      description: "IDs of the created EC2 instances",
      value: ec2Module.instances.map(instance => instance.id)
    });

    new TerraformOutput(this, "ec2_public_ips", {
      description: "Public IP addresses of the EC2 instances",
      value: ec2Module.instances.map(instance => instance.publicIp)
    });

    new TerraformOutput(this, "security_group_id", {
      description: "ID of the EC2 security group",
      value: ec2Module.securityGroup.id
    });

    new TerraformOutput(this, "ssh_connection_commands", {
      description: "SSH commands to connect to the instances",
      value: ec2Module.instances.map((instance, index) => 
        `ssh -i ~/.ssh/${sshKeyName.stringValue}.pem ec2-user@${instance.publicIp} # Instance ${index + 1}`
      )
    });
  }
}
```

## Key Features and Production Considerations

### 🏗️ **Architecture Overview**
- **VPC**: 10.0.0.0/16 CIDR with DNS resolution enabled
- **Subnets**: 
  - 2 public subnets (10.0.0.0/24, 10.0.1.0/24) across different AZs
  - 1 private subnet (10.0.2.0/24)
- **High Availability**: Resources distributed across us-east-1a and us-east-1b

### 🔒 **Security Features**
- Security group with SSH access (consider restricting in production)
- Encrypted EBS root volumes
- Private subnet for sensitive workloads
- Proper egress rules defined

### 📊 **Production Ready Elements**
- Comprehensive tagging strategy
- Detailed monitoring enabled
- GP3 storage for better performance
- Input validation for variables
- Extensive outputs for operational visibility

### 🚀 **Deployment Instructions**

1. **Initialize CDKTF project** (if not already done):
```bash
cdktf init --template=typescript --local
```

2. **Install dependencies**:
```bash
npm install @cdktf/provider-aws
```

3. **Deploy with SSH key**:
```bash
cdktf deploy --var="ssh_key_name=your-existing-key-pair-name"
```

4. **Connect to instances**:
```bash
# Use the output SSH commands or:
ssh -i ~/.ssh/your-key.pem ec2-user@<public-ip>
```

### 🔧 **Customization Options**
- Modify VPC CIDR in `tap-stack.ts`
- Adjust instance types in `modules.ts`
- Add additional security group rules as needed
- Extend with NAT Gateway for private subnet internet access

This implementation provides a solid foundation for AWS infrastructure with proper separation of concerns, comprehensive documentation, and production-ready configurations.