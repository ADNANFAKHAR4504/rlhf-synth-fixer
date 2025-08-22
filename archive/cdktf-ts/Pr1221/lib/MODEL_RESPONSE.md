I'll create a complete, production-ready CDKTF project with a modular VPC setup. Here's the implementation:

## lib/modules.ts

```typescript
import { Construct } from 'constructs';
import { 
  Vpc, 
  Subnet, 
  InternetGateway, 
  VpcAttachment, 
  RouteTable, 
  Route, 
  RouteTableAssociation,
  Eip,
  NatGateway,
  SecurityGroup,
  SecurityGroupRule
} from '@cdktf/provider-aws/lib/vpc';
import { DataAwsAvailabilityZones } from '@cdktf/provider-aws/lib/data-aws-availability-zones';

/**
 * Configuration interface for the VPC module
 */
export interface VpcModuleConfig {
  /**
   * The CIDR block for the VPC
   */
  vpcCidr: string;
  
  /**
   * CIDR blocks for public subnets
   */
  publicSubnetCidrs: string[];
  
  /**
   * CIDR blocks for private subnets
   */
  privateSubnetCidrs: string[];
  
  /**
   * Tags to apply to all resources
   */
  tags: { [key: string]: string };
  
  /**
   * Name prefix for resources
   */
  namePrefix: string;
}

/**
 * VpcModule - A reusable L3 construct that creates a complete VPC infrastructure
 * 
 * This module creates:
 * - VPC with configurable CIDR
 * - Public and private subnets across multiple AZs
 * - Internet Gateway for public internet access
 * - NAT Gateway for private subnet internet access
 * - Route tables with appropriate routing
 * - Security groups for web and SSH access
 */
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateway: NatGateway;
  public readonly webSecurityGroup: SecurityGroup;
  public readonly sshSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // Get availability zones for the region
    const availabilityZones = new DataAwsAvailabilityZones(this, 'availability-zones', {
      state: 'available'
    });

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${config.namePrefix}-vpc`,
        ...config.tags
      }
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'internet-gateway', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.namePrefix}-igw`,
        ...config.tags
      }
    });

    // Create public subnets
    this.publicSubnets = config.publicSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `public-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${availabilityZones.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: true, // Auto-assign public IPs
        tags: {
          Name: `${config.namePrefix}-public-subnet-${index + 1}`,
          Type: 'Public',
          ...config.tags
        }
      });
    });

    // Create private subnets
    this.privateSubnets = config.privateSubnetCidrs.map((cidr, index) => {
      return new Subnet(this, `private-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: `\${${availabilityZones.fqn}.names[${index}]}`,
        mapPublicIpOnLaunch: false, // No public IPs for private subnets
        tags: {
          Name: `${config.namePrefix}-private-subnet-${index + 1}`,
          Type: 'Private',
          ...config.tags
        }
      });
    });

    // Create Elastic IP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        Name: `${config.namePrefix}-nat-eip`,
        ...config.tags
      }
    });

    // Create NAT Gateway in the first public subnet
    this.natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        Name: `${config.namePrefix}-nat-gateway`,
        ...config.tags
      },
      // Ensure NAT Gateway is created after Internet Gateway
      dependsOn: [this.internetGateway]
    });

    // Create public route table
    const publicRouteTable = new RouteTable(this, 'public-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.namePrefix}-public-rt`,
        ...config.tags
      }
    });

    // Create route to Internet Gateway for public subnets
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-subnet-association-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id
      });
    });

    // Create private route table
    const privateRouteTable = new RouteTable(this, 'private-route-table', {
      vpcId: this.vpc.id,
      tags: {
        Name: `${config.namePrefix}-private-rt`,
        ...config.tags
      }
    });

    // Create route to NAT Gateway for private subnets
    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-subnet-association-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id
      });
    });

    // Create Web Security Group
    this.webSecurityGroup = new SecurityGroup(this, 'web-security-group', {
      name: 'production-web-sg',
      description: 'Security group for web servers allowing HTTP and HTTPS traffic',
      vpcId: this.vpc.id,
      tags: {
        Name: 'production-web-sg',
        ...config.tags
      }
    });

    // Web Security Group - HTTP Ingress Rule
    new SecurityGroupRule(this, 'web-sg-http-ingress', {
      type: 'ingress',
      fromPort: 80,
      toPort: 80,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
      description: 'Allow HTTP traffic from anywhere'
    });

    // Web Security Group - HTTPS Ingress Rule
    new SecurityGroupRule(this, 'web-sg-https-ingress', {
      type: 'ingress',
      fromPort: 443,
      toPort: 443,
      protocol: 'tcp',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
      description: 'Allow HTTPS traffic from anywhere'
    });

    // Web Security Group - All Egress Rule
    new SecurityGroupRule(this, 'web-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.webSecurityGroup.id,
      description: 'Allow all outbound traffic'
    });

    // Create SSH Security Group
    this.sshSecurityGroup = new SecurityGroup(this, 'ssh-security-group', {
      name: 'production-ssh-sg',
      description: 'Security group for SSH access from specific CIDR block',
      vpcId: this.vpc.id,
      tags: {
        Name: 'production-ssh-sg',
        ...config.tags
      }
    });

    // SSH Security Group - SSH Ingress Rule (restricted to specific CIDR)
    new SecurityGroupRule(this, 'ssh-sg-ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: ['203.0.113.0/24'],
      securityGroupId: this.sshSecurityGroup.id,
      description: 'Allow SSH traffic from 203.0.113.0/24'
    });

    // SSH Security Group - All Egress Rule
    new SecurityGroupRule(this, 'ssh-sg-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.sshSecurityGroup.id,
      description: 'Allow all outbound traffic'
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { VpcModule } from './modules';

/**
 * TapStack - Main infrastructure stack that composes the VPC module
 * 
 * This stack:
 * - Configures the AWS provider for us-west-2 region
 * - Instantiates the VpcModule with production-ready configuration
 * - Applies consistent tagging across all resources
 */
export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider for us-west-2 region
    new AwsProvider(this, 'aws', {
      region: 'us-west-2',
      // Apply default tags to all resources created by this provider
      defaultTags: [{
        tags: {
          Environment: 'Production',
          ManagedBy: 'CDKTF',
          Project: 'TapStack'
        }
      }]
    });

    // Instantiate the VPC Module with production configuration
    const vpcModule = new VpcModule(this, 'production-vpc', {
      // VPC CIDR block as specified
      vpcCidr: '10.0.0.0/16',
      
      // Public subnet CIDRs in different AZs
      publicSubnetCidrs: [
        '10.0.1.0/24',   // us-west-2a
        '10.0.2.0/24'    // us-west-2b
      ],
      
      // Private subnet CIDRs in different AZs
      privateSubnetCidrs: [
        '10.0.101.0/24', // us-west-2a
        '10.0.102.0/24'  // us-west-2b
      ],
      
      // Resource naming prefix
      namePrefix: 'production',
      
      // Tags applied to all resources
      tags: {
        Environment: 'Production',
        Stack: 'TapStack',
        CreatedBy: 'CDKTF'
      }
    });

    // The VPC module is now instantiated and will create all required resources:
    // - VPC with 10.0.0.0/16 CIDR
    // - 2 public subnets with auto-assigned public IPs
    // - 2 private subnets 
    // - Internet Gateway for public internet access
    // - NAT Gateway with Elastic IP for private subnet internet access
    // - Route tables with appropriate routing
    // - Security groups for web (HTTP/HTTPS) and SSH access
  }
}
```

## Key Features and Design Decisions

### 1. **Modular Architecture**
- The `VpcModule` is a reusable L3 construct that encapsulates all networking resources
- Clean separation between module definition (`lib/modules.ts`) and stack composition (`lib/tap-stack.ts`)
- Configuration-driven approach with the `VpcModuleConfig` interface

### 2. **Production-Ready Security**
- Security groups with least-privilege access patterns
- SSH access restricted to specific CIDR block (203.0.113.0/24)
- Web traffic allowed from anywhere for public-facing services
- All egress traffic allowed (can be further restricted based on requirements)

### 3. **High Availability**
- Resources deployed across multiple Availability Zones
- Dynamic AZ selection using `DataAwsAvailabilityZones`
- NAT Gateway for private subnet internet access

### 4. **Proper Resource Dependencies**
- NAT Gateway depends on Internet Gateway
- Route tables properly associated with subnets
- Elastic IP allocated before NAT Gateway creation

### 5. **Comprehensive Tagging**
- Environment tags applied at provider level
- Resource-specific tags for better organization
- Consistent naming convention with prefixes

### 6. **Network Architecture**
- Public subnets (10.0.1.0/24, 10.0.2.0/24) with auto-assigned public IPs
- Private subnets (10.0.101.0/24, 10.0.102.0/24) for backend services
- Internet Gateway for public internet access
- NAT Gateway for private subnet outbound connectivity

This implementation is ready for `cdktf synth` and `terraform apply` commands and follows AWS best practices for production networking infrastructure.