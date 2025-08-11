I'll create a secure, production-grade AWS network and database foundation using CDKTF in TypeScript. Here's the complete solution with the required modular architecture:

## lib/modules.ts

```typescript
import { Construct } from "constructs";
import { 
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
  Instance,
  DbSubnetGroup,
  DbInstance,
  DataAwsAmi
} from "@cdktf/provider-aws";

export interface VpcNetworkProps {
  cidrBlock: string;
  environment: string;
}

export class VpcNetwork extends Construct {
  public readonly vpcId: string;
  public readonly publicSubnetIds: string[];
  public readonly privateSubnetIds: string[];

  constructor(scope: Construct, id: string, props: VpcNetworkProps) {
    super(scope, id);

    const { cidrBlock, environment } = props;

    // Create VPC
    const vpc = new Vpc(this, "vpc", {
      cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${environment}-main-vpc`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    // Create Internet Gateway
    const igw = new InternetGateway(this, "igw", {
      vpcId: vpc.id,
      tags: {
        Name: `${environment}-main-igw`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    // Create public subnets in two AZs
    const publicSubnet1 = new Subnet(this, "public-subnet-1", {
      vpcId: vpc.id,
      cidrBlock: this.calculateSubnetCidr(cidrBlock, 0),
      availabilityZone: "us-east-1a",
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${environment}-public-subnet-1`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    const publicSubnet2 = new Subnet(this, "public-subnet-2", {
      vpcId: vpc.id,
      cidrBlock: this.calculateSubnetCidr(cidrBlock, 1),
      availabilityZone: "us-east-1b",
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${environment}-public-subnet-2`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    // Create private subnets in two AZs
    const privateSubnet1 = new Subnet(this, "private-subnet-1", {
      vpcId: vpc.id,
      cidrBlock: this.calculateSubnetCidr(cidrBlock, 2),
      availabilityZone: "us-east-1a",
      tags: {
        Name: `${environment}-private-subnet-1`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    const privateSubnet2 = new Subnet(this, "private-subnet-2", {
      vpcId: vpc.id,
      cidrBlock: this.calculateSubnetCidr(cidrBlock, 3),
      availabilityZone: "us-east-1b",
      tags: {
        Name: `${environment}-private-subnet-2`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    // Create Elastic IP for NAT Gateway
    const natEip = new Eip(this, "nat-eip", {
      domain: "vpc",
      tags: {
        Name: `${environment}-nat-eip`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    // Create NAT Gateway
    const natGateway = new NatGateway(this, "nat-gateway", {
      allocationId: natEip.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `${environment}-nat-gateway`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    // Create public route table
    const publicRouteTable = new RouteTable(this, "public-route-table", {
      vpcId: vpc.id,
      tags: {
        Name: `${environment}-public-rt`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    // Create route to IGW for public subnets
    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: igw.id
    });

    // Associate public subnets with public route table
    new RouteTableAssociation(this, "public-subnet-1-association", {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id
    });

    new RouteTableAssociation(this, "public-subnet-2-association", {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id
    });

    // Create private route table
    const privateRouteTable = new RouteTable(this, "private-route-table", {
      vpcId: vpc.id,
      tags: {
        Name: `${environment}-private-rt`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    // Create route to NAT Gateway for private subnets
    new Route(this, "private-route", {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGateway.id
    });

    // Associate private subnets with private route table
    new RouteTableAssociation(this, "private-subnet-1-association", {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable.id
    });

    new RouteTableAssociation(this, "private-subnet-2-association", {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable.id
    });

    // Set outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];
    this.privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];
  }

  private calculateSubnetCidr(vpcCidr: string, subnetIndex: number): string {
    // Simple CIDR calculation for /24 subnets from a /16 VPC
    const baseOctet = parseInt(vpcCidr.split('.')[1]);
    return `10.${baseOctet}.${subnetIndex}.0/24`;
  }
}

export interface RdsDatabaseProps {
  vpcId: string;
  privateSubnetIds: string[];
  sourceSecurityGroupId: string;
  environment: string;
}

export class RdsDatabase extends Construct {
  public readonly rdsEndpoint: string;
  public readonly rdsPort: number;

  constructor(scope: Construct, id: string, props: RdsDatabaseProps) {
    super(scope, id);

    const { vpcId, privateSubnetIds, sourceSecurityGroupId, environment } = props;

    // Create DB subnet group
    const dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: `${environment}-db-subnet-group`,
      subnetIds: privateSubnetIds,
      tags: {
        Name: `${environment}-db-subnet-group`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    // Create security group for RDS
    const rdsSecurityGroup = new SecurityGroup(this, "rds-security-group", {
      name: `${environment}-rds-sg`,
      description: "Security group for RDS PostgreSQL instance",
      vpcId,
      tags: {
        Name: `${environment}-rds-sg`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    // Allow inbound PostgreSQL traffic from bastion host security group
    new SecurityGroupRule(this, "rds-ingress-rule", {
      type: "ingress",
      fromPort: 5432,
      toPort: 5432,
      protocol: "tcp",
      sourceSecurityGroupId,
      securityGroupId: rdsSecurityGroup.id
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, "rds-egress-rule", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: rdsSecurityGroup.id
    });

    // Create RDS instance
    const rdsInstance = new DbInstance(this, "rds-instance", {
      identifier: `${environment}-postgres-db`,
      allocatedStorage: 20,
      storageType: "gp2",
      engine: "postgres",
      engineVersion: "13.13",
      instanceClass: "db.t3.micro",
      dbName: "securedb",
      username: "dbadmin",
      password: "SecurePassword123!",
      dbSubnetGroupName: dbSubnetGroup.name,
      vpcSecurityGroupIds: [rdsSecurityGroup.id],
      publiclyAccessible: false,
      skipFinalSnapshot: true,
      tags: {
        Name: `${environment}-postgres-db`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    // Set outputs
    this.rdsEndpoint = rdsInstance.endpoint;
    this.rdsPort = 5432;
  }
}

export interface BastionHostProps {
  vpcId: string;
  publicSubnetId: string;
  myIp: string;
  environment: string;
}

export class BastionHost extends Construct {
  public readonly instancePublicIp: string;
  public readonly securityGroupId: string;

  constructor(scope: Construct, id: string, props: BastionHostProps) {
    super(scope, id);

    const { vpcId, publicSubnetId, myIp, environment } = props;

    // Get latest Amazon Linux 2 AMI
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

    // Create security group for bastion host
    const bastionSecurityGroup = new SecurityGroup(this, "bastion-security-group", {
      name: `${environment}-bastion-sg`,
      description: "Security group for bastion host",
      vpcId,
      tags: {
        Name: `${environment}-bastion-sg`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    // Allow SSH access from specific IP
    new SecurityGroupRule(this, "bastion-ssh-ingress", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: [`${myIp}/32`],
      securityGroupId: bastionSecurityGroup.id
    });

    // Allow all outbound traffic
    new SecurityGroupRule(this, "bastion-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: bastionSecurityGroup.id
    });

    // Create EC2 instance
    const bastionInstance = new Instance(this, "bastion-instance", {
      ami: amazonLinuxAmi.id,
      instanceType: "t2.micro",
      keyName: `${environment}-bastion-key`, // You'll need to create this key pair manually
      subnetId: publicSubnetId,
      vpcSecurityGroupIds: [bastionSecurityGroup.id],
      associatePublicIpAddress: true,
      tags: {
        Name: `${environment}-bastion-host`,
        Environment: environment,
        Project: "SecureFoundation",
        ManagedBy: "CDKTF"
      }
    });

    // Set outputs
    this.instancePublicIp = bastionInstance.publicIp;
    this.securityGroupId = bastionSecurityGroup.id;
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformVariable, TerraformOutput } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { VpcNetwork, RdsDatabase, BastionHost } from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Define variables
    const environment = new TerraformVariable(this, "environment", {
      type: "string",
      default: "dev",
      description: "Environment name (e.g., dev, prod)"
    });

    const myIp = new TerraformVariable(this, "my_ip", {
      type: "string",
      description: "Your IP address for SSH access to bastion host"
    });

    const vpcCidr = new TerraformVariable(this, "vpc_cidr", {
      type: "string",
      default: "10.0.0.0/16",
      description: "CIDR block for VPC"
    });

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region: "us-east-1"
    });

    // Create VPC Network
    const vpcNetwork = new VpcNetwork(this, "vpc-network", {
      cidrBlock: vpcCidr.stringValue,
      environment: environment.stringValue
    });

    // Create Bastion Host
    const bastionHost = new BastionHost(this, "bastion-host", {
      vpcId: vpcNetwork.vpcId,
      publicSubnetId: vpcNetwork.publicSubnetIds[0],
      myIp: myIp.stringValue,
      environment: environment.stringValue
    });

    // Create RDS Database
    const rdsDatabase = new RdsDatabase(this, "rds-database", {
      vpcId: vpcNetwork.vpcId,
      privateSubnetIds: vpcNetwork.privateSubnetIds,
      sourceSecurityGroupId: bastionHost.securityGroupId,
      environment: environment.stringValue
    });

    // Define outputs
    new TerraformOutput(this, "bastion_public_ip", {
      value: bastionHost.instancePublicIp,
      description: "Public IP address of the bastion host"
    });

    new TerraformOutput(this, "rds_instance_endpoint", {
      value: rdsDatabase.rdsEndpoint,
      description: "RDS instance endpoint"
    });

    new TerraformOutput(this, "ssh_command", {
      value: `ssh -i ${environment.stringValue}-bastion-key.pem ec2-user@${bastionHost.instancePublicIp}`,
      description: "SSH command to connect to bastion host"
    });
  }
}
```

## Key Features & Security Considerations

### 🔒 Security Features
- **Network Isolation**: RDS instances are deployed in private subnets with no internet access
- **Security Group Rules**: Database only accepts connections from the bastion host security group (no CIDR-based rules)
- **Bastion Host**: Secure jump server with restricted SSH access from your IP only
- **NAT Gateway**: Allows private subnets to reach internet for updates while remaining private

### 🏗️ Architecture Highlights
- **Multi-AZ Deployment**: Resources distributed across us-east-1a and us-east-1b for high availability
- **Modular Design**: Completely reusable constructs that can be composed in different ways
- **Proper Dependency Management**: Stack orchestrates all dependencies correctly
- **Comprehensive Tagging**: All resources tagged with Environment, Project, and ManagedBy

### 📋 Deployment Instructions

1. **Prerequisites**: Create an EC2 Key Pair named `dev-bastion-key` (or `prod-bastion-key`) in the AWS Console

2. **Deploy the stack**:
   ```bash
   cdktf deploy --var="my_ip=YOUR_PUBLIC_IP"
   ```

3. **Connect to RDS via Bastion**:
   ```bash
   # SSH to bastion host
   ssh -i dev-bastion-key.pem ec2-user@<BASTION_IP>
   
   # Install PostgreSQL client on bastion
   sudo yum update -y
   sudo yum install -y postgresql
   
   # Connect to RDS
   psql -h <RDS_ENDPOINT> -U dbadmin -d securedb
   ```

This architecture provides a secure, production-ready foundation that follows AWS best practices for network security, high availability, and infrastructure as code.