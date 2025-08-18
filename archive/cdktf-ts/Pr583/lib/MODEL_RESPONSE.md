I'll create a well-structured CDKTF TypeScript solution with proper modular organization. Here are the two files:

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
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { Instance } from "@cdktf/provider-aws/lib/instance";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { EipAssociation } from "@cdktf/provider-aws/lib/eip-association";
import { DataAwsAmi } from "@cdktf/provider-aws/lib/data-aws-ami";
import { DataAwsAvailabilityZones } from "@cdktf/provider-aws/lib/data-aws-availability-zones";

export interface NetworkingModuleConfig {
  vpcCidr: string;
  availabilityZones: string[];
}

export interface SecurityGroupModuleConfig {
  vpcId: string;
  allowedCidr: string;
}

export interface ComputeModuleConfig {
  subnetIds: string[];
  securityGroupId: string;
  instanceType?: string;
}

export class NetworkingModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly routeTable: RouteTable;

  constructor(scope: Construct, id: string, config: NetworkingModuleConfig) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: config.vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: "iacProject-vpc",
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: "iacProject-igw",
      },
    });

    // Create public subnets
    this.publicSubnets = config.availabilityZones.map((az, index) => {
      return new Subnet(this, `public-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          Name: `iacProject-public-subnet-${index + 1}`,
        },
      });
    });

    // Create Route Table
    this.routeTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: "iacProject-public-rt",
      },
    });

    // Create route to Internet Gateway
    new Route(this, "public-route", {
      routeTableId: this.routeTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Associate route table with public subnets
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rt-association-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: this.routeTable.id,
      });
    });
  }
}

export class SecurityGroupModule extends Construct {
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: SecurityGroupModuleConfig) {
    super(scope, id);

    this.securityGroup = new SecurityGroup(this, "sg", {
      name: "iacProject-sg",
      description: "Security group for iacProject instances",
      vpcId: config.vpcId,
      
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: [config.allowedCidr],
          description: "SSH access",
        },
        {
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: [config.allowedCidr],
          description: "HTTP access",
        },
      ],
      
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
          description: "All outbound traffic",
        },
      ],
      
      tags: {
        Name: "iacProject-sg",
      },
    });
  }
}

export class ComputeModule extends Construct {
  public readonly instances: Instance[];
  public readonly elasticIps: Eip[];

  constructor(scope: Construct, id: string, config: ComputeModuleConfig) {
    super(scope, id);

    // Get Amazon Linux 2 AMI
    const amazonLinux2Ami = new DataAwsAmi(this, "amazon-linux-2", {
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

    // Create EC2 instances
    this.instances = config.subnetIds.map((subnetId, index) => {
      return new Instance(this, `instance-${index + 1}`, {
        ami: amazonLinux2Ami.id,
        instanceType: config.instanceType || "t3.micro",
        subnetId: subnetId,
        vpcSecurityGroupIds: [config.securityGroupId],
        associatePublicIpAddress: true,
        tags: {
          Name: `iacProject-instance-${index + 1}`,
        },
      });
    });

    // Create and associate Elastic IPs
    this.elasticIps = this.instances.map((instance, index) => {
      const eip = new Eip(this, `eip-${index + 1}`, {
        domain: "vpc",
        tags: {
          Name: `iacProject-eip-${index + 1}`,
        },
      });

      new EipAssociation(this, `eip-association-${index + 1}`, {
        instanceId: instance.id,
        allocationId: eip.id,
      });

      return eip;
    });
  }
}

export class ProviderModule extends Construct {
  public readonly awsProvider: AwsProvider;
  public readonly availabilityZones: DataAwsAvailabilityZones;

  constructor(scope: Construct, id: string, region: string = "us-east-1") {
    super(scope, id);

    this.awsProvider = new AwsProvider(this, "aws", {
      region: region,
    });

    this.availabilityZones = new DataAwsAvailabilityZones(this, "available", {
      state: "available",
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import { 
  ProviderModule, 
  NetworkingModule, 
  SecurityGroupModule, 
  ComputeModule 
} from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Initialize AWS Provider and get availability zones
    const providerModule = new ProviderModule(this, "provider", "us-east-1");

    // Create networking infrastructure
    const networkingModule = new NetworkingModule(this, "networking", {
      vpcCidr: "10.0.0.0/16",
      availabilityZones: [
        "us-east-1a",
        "us-east-1b"
      ],
    });

    // Create security group
    const securityGroupModule = new SecurityGroupModule(this, "security", {
      vpcId: networkingModule.vpc.id,
      allowedCidr: "203.0.113.0/24",
    });

    // Create compute resources
    const computeModule = new ComputeModule(this, "compute", {
      subnetIds: networkingModule.publicSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroupModule.securityGroup.id,
      instanceType: "t3.micro",
    });

    // Add dependencies to ensure proper resource creation order
    securityGroupModule.node.addDependency(networkingModule);
    computeModule.node.addDependency(securityGroupModule);
  }
}
```

## Key Features of This Implementation:

### **Modular Design**
- **`modules.ts`**: Contains reusable, typed classes for each infrastructure component
- **`tap-stack.ts`**: Orchestrates the modules and defines dependencies

### **Proper Resource Organization**
- **ProviderModule**: Manages AWS provider and availability zone data
- **NetworkingModule**: Handles VPC, subnets, IGW, and routing
- **SecurityGroupModule**: Manages security group with specified rules
- **ComputeModule**: Creates EC2 instances with Elastic IPs

### **Best Practices Implemented**
- ✅ TypeScript interfaces for configuration
- ✅ Proper dependency management
- ✅ Consistent naming with `iacProject-` prefix
- ✅ Resource tagging
- ✅ Clean separation of concerns
- ✅ Reusable and extensible modules

### **Infrastructure Created**
- VPC with 10.0.0.0/16 CIDR
- 2 public subnets in different AZs
- Internet Gateway with proper routing
- Security group allowing SSH/HTTP from 203.0.113.0/24
- 2 EC2 instances with Elastic IPs
- All resources properly named and tagged

This structure allows for easy testing, maintenance, and extension of the infrastructure code while following CDKTF and TypeScript best practices.
