I'll create two TypeScript files for AWS CDK for Terraform (CDKTF) that implement a production-ready VPC with public and private subnets following AWS best practices.

## modules.ts

```typescript
import { Construct } from "constructs";
import {
  AwsProvider,
  DataAwsAvailabilityZones,
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  NatGateway,
  Eip,
} from "@cdktf/provider-aws";

export interface VpcModuleProps {
  vpcCidr: string;
  publicSubnetCidr: string;
  privateSubnetCidr: string;
  availabilityZone: string;
  tags: { [key: string]: string };
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;
  public readonly internetGateway: InternetGateway;
  public readonly natGateway: NatGateway;
  public readonly publicRouteTable: RouteTable;
  public readonly privateRouteTable: RouteTable;
  public readonly natEip: Eip;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: props.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.tags,
        Name: `${id}-vpc`,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${id}-igw`,
      },
    });

    // Create Public Subnet
    this.publicSubnet = new Subnet(this, "public-subnet", {
      vpcId: this.vpc.id,
      cidrBlock: props.publicSubnetCidr,
      availabilityZone: props.availabilityZone,
      mapPublicIpOnLaunch: true,
      tags: {
        ...props.tags,
        Name: `${id}-public-subnet`,
        Type: "Public",
      },
    });

    // Create Private Subnet
    this.privateSubnet = new Subnet(this, "private-subnet", {
      vpcId: this.vpc.id,
      cidrBlock: props.privateSubnetCidr,
      availabilityZone: props.availabilityZone,
      mapPublicIpOnLaunch: false,
      tags: {
        ...props.tags,
        Name: `${id}-private-subnet`,
        Type: "Private",
      },
    });

    // Create Elastic IP for NAT Gateway
    this.natEip = new Eip(this, "nat-eip", {
      domain: "vpc",
      dependsOn: [this.internetGateway],
      tags: {
        ...props.tags,
        Name: `${id}-nat-eip`,
      },
    });

    // Create NAT Gateway in Public Subnet
    this.natGateway = new NatGateway(this, "nat-gateway", {
      allocationId: this.natEip.id,
      subnetId: this.publicSubnet.id,
      dependsOn: [this.internetGateway],
      tags: {
        ...props.tags,
        Name: `${id}-nat-gateway`,
      },
    });

    // Create Public Route Table
    this.publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${id}-public-rt`,
      },
    });

    // Create route to Internet Gateway for Public Route Table
    new Route(this, "public-route", {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Associate Public Subnet with Public Route Table
    new RouteTableAssociation(this, "public-rta", {
      subnetId: this.publicSubnet.id,
      routeTableId: this.publicRouteTable.id,
    });

    // Create Private Route Table
    this.privateRouteTable = new RouteTable(this, "private-rt", {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${id}-private-rt`,
      },
    });

    // Create route to NAT Gateway for Private Route Table
    new Route(this, "private-route", {
      routeTableId: this.privateRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: this.natGateway.id,
    });

    // Associate Private Subnet with Private Route Table
    new RouteTableAssociation(this, "private-rta", {
      subnetId: this.privateSubnet.id,
      routeTableId: this.privateRouteTable.id,
    });
  }
}

export interface NetworkingStackProps {
  region: string;
  environment: string;
  vpcCidr?: string;
  publicSubnetCidr?: string;
  privateSubnetCidr?: string;
}

export class NetworkingStack extends Construct {
  public readonly vpcModule: VpcModule;
  public readonly availabilityZones: DataAwsAvailabilityZones;

  constructor(scope: Construct, id: string, props: NetworkingStackProps) {
    super(scope, id);

    // Get available AZs for the region
    this.availabilityZones = new DataAwsAvailabilityZones(this, "azs", {
      state: "available",
    });

    const commonTags = {
      Environment: props.environment,
      ManagedBy: "Terraform",
      Project: "TAP-Infrastructure",
    };

    // Create VPC Module
    this.vpcModule = new VpcModule(this, "networking", {
      vpcCidr: props.vpcCidr || "10.0.0.0/16",
      publicSubnetCidr: props.publicSubnetCidr || "10.0.1.0/24",
      privateSubnetCidr: props.privateSubnetCidr || "10.0.2.0/24",
      availabilityZone: `${props.region}a`,
      tags: commonTags,
    });
  }
}
```

## tap-stack.ts

```typescript
import { Construct } from "constructs";
import { App, TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import { NetworkingStack } from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region: "us-west-2",
      defaultTags: [
        {
          tags: {
            Environment: "Production",
            ManagedBy: "Terraform-CDKTF",
            Project: "TAP-Infrastructure",
          },
        },
      ],
    });

    // Create Networking Stack
    const networking = new NetworkingStack(this, "tap-networking", {
      region: "us-west-2",
      environment: "Production",
      vpcCidr: "10.0.0.0/16",
      publicSubnetCidr: "10.0.1.0/24",
      privateSubnetCidr: "10.0.2.0/24",
    });

    // Export VPC Outputs
    new TerraformOutput(this, "vpc-id", {
      description: "ID of the VPC",
      value: networking.vpcModule.vpc.id,
    });

    new TerraformOutput(this, "vpc-cidr-block", {
      description: "CIDR block of the VPC",
      value: networking.vpcModule.vpc.cidrBlock,
    });

    new TerraformOutput(this, "vpc-arn", {
      description: "ARN of the VPC",
      value: networking.vpcModule.vpc.arn,
    });

    // Export Public Subnet Outputs
    new TerraformOutput(this, "public-subnet-id", {
      description: "ID of the public subnet",
      value: networking.vpcModule.publicSubnet.id,
    });

    new TerraformOutput(this, "public-subnet-cidr", {
      description: "CIDR block of the public subnet",
      value: networking.vpcModule.publicSubnet.cidrBlock,
    });

    new TerraformOutput(this, "public-subnet-arn", {
      description: "ARN of the public subnet",
      value: networking.vpcModule.publicSubnet.arn,
    });

    new TerraformOutput(this, "public-subnet-az", {
      description: "Availability Zone of the public subnet",
      value: networking.vpcModule.publicSubnet.availabilityZone,
    });

    // Export Private Subnet Outputs
    new TerraformOutput(this, "private-subnet-id", {
      description: "ID of the private subnet",
      value: networking.vpcModule.privateSubnet.id,
    });

    new TerraformOutput(this, "private-subnet-cidr", {
      description: "CIDR block of the private subnet",
      value: networking.vpcModule.privateSubnet.cidrBlock,
    });

    new TerraformOutput(this, "private-subnet-arn", {
      description: "ARN of the private subnet",
      value: networking.vpcModule.privateSubnet.arn,
    });

    new TerraformOutput(this, "private-subnet-az", {
      description: "Availability Zone of the private subnet",
      value: networking.vpcModule.privateSubnet.availabilityZone,
    });

    // Export Internet Gateway Outputs
    new TerraformOutput(this, "internet-gateway-id", {
      description: "ID of the Internet Gateway",
      value: networking.vpcModule.internetGateway.id,
    });

    new TerraformOutput(this, "internet-gateway-arn", {
      description: "ARN of the Internet Gateway",
      value: networking.vpcModule.internetGateway.arn,
    });

    // Export NAT Gateway Outputs
    new TerraformOutput(this, "nat-gateway-id", {
      description: "ID of the NAT Gateway",
      value: networking.vpcModule.natGateway.id,
    });

    new TerraformOutput(this, "nat-gateway-public-ip", {
      description: "Public IP address of the NAT Gateway",
      value: networking.vpcModule.natEip.publicIp,
    });

    new TerraformOutput(this, "nat-gateway-private-ip", {
      description: "Private IP address of the NAT Gateway",
      value: networking.vpcModule.natGateway.privateIp,
    });

    // Export Route Table Outputs
    new TerraformOutput(this, "public-route-table-id", {
      description: "ID of the public route table",
      value: networking.vpcModule.publicRouteTable.id,
    });

    new TerraformOutput(this, "private-route-table-id", {
      description: "ID of the private route table",
      value: networking.vpcModule.privateRouteTable.id,
    });

    // Export Availability Zones
    new TerraformOutput(this, "availability-zones", {
      description: "List of availability zones used",
      value: networking.availabilityZones.names,
    });
  }
}

// Initialize the CDK App
const app = new App();
new TapStack(app, "tap-production-stack");
app.synth();
```

## Key Features and Best Practices Implemented:

### Security & Production Readiness:
1. **Network Segmentation**: Separate public and private subnets with proper routing
2. **NAT Gateway**: Provides secure outbound internet access for private subnet
3. **No Direct Internet Access**: Private subnet has no direct route to IGW
4. **DNS Support**: Enabled DNS hostnames and resolution in VPC

### Infrastructure Best Practices:
1. **Modular Design**: Reusable VpcModule that can be instantiated multiple times
2. **Type Safety**: Full TypeScript interfaces and proper typing
3. **Resource Dependencies**: Proper dependency management (NAT depends on IGW)
4. **Tagging Strategy**: Consistent tagging across all resources
5. **Default Tags**: Applied at provider level for consistency

### CDKTF Best Practices:
1. **Clean Separation**: Logic in modules.ts, instantiation in tap-stack.ts
2. **Comprehensive Outputs**: All important resource attributes exported
3. **Proper Imports**: Only necessary imports from CDKTF providers
4. **Resource Naming**: Clear, consistent naming convention

### AWS Networking Best Practices:
1. **Single AZ Deployment**: Uses us-west-2a for both subnets (can be extended to multi-AZ)
2. **CIDR Planning**: Non-overlapping subnets within VPC CIDR
3. **Route Tables**: Separate route tables for public and private subnets
4. **Elastic IP**: Dedicated EIP for NAT Gateway for consistent outbound IP

This infrastructure provides a solid foundation for deploying applications that require both internet-accessible (public subnet) and secure backend (private subnet) components.