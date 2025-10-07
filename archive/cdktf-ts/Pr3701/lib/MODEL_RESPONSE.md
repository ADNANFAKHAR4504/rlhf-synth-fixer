## lib/modules.ts

```typescript
import { Construct } from "constructs";
import { TerraformOutput } from "cdktf";
import { Vpc } from "@cdktf/provider-aws/lib/vpc";
import { Subnet } from "@cdktf/provider-aws/lib/subnet";
import { InternetGateway } from "@cdktf/provider-aws/lib/internet-gateway";
import { RouteTable } from "@cdktf/provider-aws/lib/route-table";
import { Route } from "@cdktf/provider-aws/lib/route";
import { RouteTableAssociation } from "@cdktf/provider-aws/lib/route-table-association";
import { NatGateway } from "@cdktf/provider-aws/lib/nat-gateway";
import { Eip } from "@cdktf/provider-aws/lib/eip";
import { SecurityGroup } from "@cdktf/provider-aws/lib/security-group";
import { SecurityGroupRule } from "@cdktf/provider-aws/lib/security-group-rule";
import { DbInstance } from "@cdktf/provider-aws/lib/db-instance";
import { DbSubnetGroup } from "@cdktf/provider-aws/lib/db-subnet-group";

export interface NetworkModuleConfig {
  projectName: string;
  environment: string;
  vpcCidr: string;
  publicSubnetCidrs: string[];
  privateSubnetCidrs: string[];
  azs: string[];
  owner: string;
  sshAllowedCidr: string;
}

export interface RdsModuleConfig {
  projectName: string;
  environment: string;
  dbName: string;
  dbInstanceClass: string;
  dbStorageGb: number;
  backupRetentionDays: number;
  enableDeletionProtection: boolean;
  owner: string;
  vpcId: string;
  privateSubnetIds: string[];
  ingressSecurityGroupId: string;
}

export interface CommonTags {
  Name: string;
  Project: string;
  Environment: string;
  Owner: string;
  ManagedBy: string;
}

// Helper function to create common tags
export function createCommonTags(
  name: string,
  projectName: string,
  environment: string,
  owner: string
): CommonTags {
  return {
    Name: name,
    Project: projectName,
    Environment: environment,
    Owner: owner,
    ManagedBy: "cdktf",
  };
}

// Network Module (VPC, Subnets, IGW, NAT)
export class NetworkModule extends Construct {
  public vpc: Vpc;
  public publicSubnets: Subnet[];
  public privateSubnets: Subnet[];
  public internetGateway: InternetGateway;
  public natGateway: NatGateway;
  public natEip: Eip;
  public publicRouteTable: RouteTable;
  public privateRouteTable: RouteTable;
  public publicSecurityGroup: SecurityGroup;
  public privateSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: NetworkModuleConfig) {
    super(scope, id);

    const { projectName, environment, vpcCidr, publicSubnetCidrs, privateSubnetCidrs, azs, owner, sshAllowedCidr } = config;

    // Create VPC
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: vpcCidr,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...createCommonTags(`${projectName}-${environment}-vpc`, projectName, environment, owner),
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        ...createCommonTags(`${projectName}-${environment}-igw`, projectName, environment, owner),
      },
    });

    // Create public route table
    this.publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        ...createCommonTags(`${projectName}-${environment}-public-rt`, projectName, environment, owner),
      },
    });

    // Create route to Internet Gateway
    new Route(this, "public-route", {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Create NAT Gateway EIP
    this.natEip = new Eip(this, "nat-eip", {
      vpc: true,
      tags: {
        ...createCommonTags(`${projectName}-${environment}-nat-eip`, projectName, environment, owner),
      },
    });

    // Create public subnets
    this.publicSubnets = publicSubnetCidrs.map((cidr, index) => {
      const subnet = new Subnet(this, `public-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: azs[index % azs.length],
        mapPublicIpOnLaunch: true,
        tags: {
          ...createCommonTags(`${projectName}-${environment}-public-subnet-${index + 1}`, projectName, environment, owner),
          "SubnetType": "public",
        },
      });

      // Associate with public route table
      new RouteTableAssociation(this, `public-rt-assoc-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: this.publicRouteTable.id,
      });

      return subnet;
    });

    // Create NAT Gateway in first public subnet
    this.natGateway = new NatGateway(this, "nat-gw", {
      allocationId: this.natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        ...createCommonTags(`${projectName}-${environment}-nat-gw`, projectName, environment, owner),
      },
    });

    // Create private route table
    this.privateRouteTable = new RouteTable(this, "private-rt", {
      vpcId: this.vpc.id,
      tags: {
        ...createCommonTags(`${projectName}-${environment}-private-rt`, projectName, environment, owner),
      },
    });

    // Create route to NAT Gateway
    new Route(this, "private-route", {
      routeTableId: this.privateRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: this.natGateway.id,
    });

    // Create private subnets
    this.privateSubnets = privateSubnetCidrs.map((cidr, index) => {
      const subnet = new Subnet(this, `private-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: cidr,
        availabilityZone: azs[index % azs.length],
        tags: {
          ...createCommonTags(`${projectName}-${environment}-private-subnet-${index + 1}`, projectName, environment, owner),
          "SubnetType": "private",
        },
      });

      // Associate with private route table
      new RouteTableAssociation(this, `private-rt-assoc-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: this.privateRouteTable.id,
      });

      return subnet;
    });

    // Create public security group (allow HTTP, HTTPS from anywhere, SSH from specific CIDR)
    this.publicSecurityGroup = new SecurityGroup(this, "public-sg", {
      name: `${projectName}-${environment}-public-sg`,
      description: "Security group for public instances",
      vpcId: this.vpc.id,
      tags: {
        ...createCommonTags(`${projectName}-${environment}-public-sg`, projectName, environment, owner),
      },
    });

    // Allow HTTP inbound
    new SecurityGroupRule(this, "public-sg-http-in", {
      type: "ingress",
      fromPort: 80,
      toPort: 80,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.publicSecurityGroup.id,
    });

    // Allow HTTPS inbound
    new SecurityGroupRule(this, "public-sg-https-in", {
      type: "ingress",
      fromPort: 443,
      toPort: 443,
      protocol: "tcp",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.publicSecurityGroup.id,
    });

    // Allow SSH inbound from specific CIDR
    new SecurityGroupRule(this, "public-sg-ssh-in", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: [sshAllowedCidr],
      securityGroupId: this.publicSecurityGroup.id,
    });

    // Allow all outbound
    new SecurityGroupRule(this, "public-sg-out", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.publicSecurityGroup.id,
    });

    // Create private security group (for instances in private subnets)
    this.privateSecurityGroup = new SecurityGroup(this, "private-sg", {
      name: `${projectName}-${environment}-private-sg`,
      description: "Security group for private instances",
      vpcId: this.vpc.id,
      tags: {
        ...createCommonTags(`${projectName}-${environment}-private-sg`, projectName, environment, owner),
      },
    });

    // Allow all outbound traffic from private instances
    new SecurityGroupRule(this, "private-sg-out", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.privateSecurityGroup.id,
    });
  }
}

// RDS Module
export class RdsModule extends Construct {
  public rdsInstance: DbInstance;
  public rdsSecurityGroup: SecurityGroup;
  public dbSubnetGroup: DbSubnetGroup;

  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    const {
      projectName,
      environment,
      dbName,
      dbInstanceClass,
      dbStorageGb,
      backupRetentionDays,
      enableDeletionProtection,
      owner,
      vpcId,
      privateSubnetIds,
      ingressSecurityGroupId,
    } = config;

    // Create RDS security group
    this.rdsSecurityGroup = new SecurityGroup(this, "rds-sg", {
      name: `${projectName}-${environment}-rds-sg`,
      description: "Security group for RDS instance",
      vpcId: vpcId,
      tags: {
        ...createCommonTags(`${projectName}-${environment}-rds-sg`, projectName, environment, owner),
      },
    });

    // Allow MySQL/Aurora (3306) inbound from private instances
    new SecurityGroupRule(this, "rds-sg-mysql-in", {
      type: "ingress",
      fromPort: 3306,
      toPort: 3306,
      protocol: "tcp",
      sourceSecurityGroupId: ingressSecurityGroupId,
      securityGroupId: this.rdsSecurityGroup.id,
    });

    // Create DB subnet group
    this.dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: `${projectName}-${environment}-db-subnet-group`,
      subnetIds: privateSubnetIds,
      description: `${projectName}-${environment} RDS subnet group`,
      tags: {
        ...createCommonTags(`${projectName}-${environment}-db-subnet-group`, projectName, environment, owner),
      },
    });

    // Create RDS instance
    this.rdsInstance = new DbInstance(this, "rds-instance", {
      identifier: `${projectName}-${environment}-mysql`,
      engine: "mysql",
      engineVersion: "8.0.28",
      instanceClass: dbInstanceClass,
      allocatedStorage: dbStorageGb,
      dbName: dbName,
      username: "admin", // AWS will manage the password
      manageMainUserPassword: true, // Use AWS-managed credentials
      multiAz: true, // Enable Multi-AZ deployment for high availability
      backupRetentionPeriod: backupRetentionDays,
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.rdsSecurityGroup.id],
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${projectName}-${environment}-mysql-final-snapshot`,
      deletionProtection: enableDeletionProtection,
      storageType: "gp2",
      storageEncrypted: true,
      tags: {
        ...createCommonTags(`${projectName}-${environment}-mysql`, projectName, environment, owner),
      },
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput, TerraformVariable, TerraformVariableConfig } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws/lib/provider";
import { NetworkModule, RdsModule } from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, name: string) {
    super(scope, name);

    // Define variables
    const projectName = new TerraformVariable(this, "projectName", {
      type: "string",
      description: "Name of the project",
    });

    const environment = new TerraformVariable(this, "environment", {
      type: "string",
      description: "Deployment environment (e.g., dev, staging, prod)",
    });

    const region = new TerraformVariable(this, "region", {
      type: "string",
      description: "AWS region to deploy resources",
      default: "us-east-1",
    });

    const sshAllowedCidr = new TerraformVariable(this, "sshAllowedCidr", {
      type: "string",
      description: "CIDR block allowed to SSH into public instances",
    });

    const dbInstanceClass = new TerraformVariable(this, "dbInstanceClass", {
      type: "string",
      description: "RDS instance class",
      default: "db.t3.medium",
    });

    const dbStorageGb = new TerraformVariable(this, "dbStorageGb", {
      type: "number",
      description: "RDS allocated storage in GB",
      default: 20,
    });

    const dbBackupRetentionDays = new TerraformVariable(this, "dbBackupRetentionDays", {
      type: "number",
      description: "Number of days to retain RDS backups",
      default: 7,
    });

    const enableDeletionProtection = new TerraformVariable(this, "enableDeletionProtection", {
      type: "bool",
      description: "Enable RDS deletion protection",
      default: true,
    });

    const owner = new TerraformVariable(this, "owner", {
      type: "string",
      description: "Owner of the resources (e.g., team name, person name)",
    });

    // Configure AWS Provider
    new AwsProvider(this, "aws", {
      region: region.stringValue,
    });

    // Create Network Module
    const network = new NetworkModule(this, "network", {
      projectName: projectName.stringValue,
      environment: environment.stringValue,
      vpcCidr: "10.0.0.0/16",
      publicSubnetCidrs: ["10.0.1.0/24", "10.0.2.0/24"],
      privateSubnetCidrs: ["10.0.3.0/24", "10.0.4.0/24"],
      azs: ["us-east-1a", "us-east-1b"],
      owner: owner.stringValue,
      sshAllowedCidr: sshAllowedCidr.stringValue,
    });

    // Create RDS Module
    const rds = new RdsModule(this, "rds", {
      projectName: projectName.stringValue,
      environment: environment.stringValue,
      dbName: `${projectName.stringValue}${environment.stringValue}db`.replace(/[^a-zA-Z0-9]/g, ""),
      dbInstanceClass: dbInstanceClass.stringValue,
      dbStorageGb: dbStorageGb.numberValue,
      backupRetentionDays: dbBackupRetentionDays.numberValue,
      enableDeletionProtection: enableDeletionProtection.booleanValue,
      owner: owner.stringValue,
      vpcId: network.vpc.id,
      privateSubnetIds: network.privateSubnets.map(subnet => subnet.id),
      ingressSecurityGroupId: network.privateSecurityGroup.id,
    });

    // Define outputs
    new TerraformOutput(this, "vpc_id", {
      value: network.vpc.id,
      description: "VPC ID",
    });

    new TerraformOutput(this, "public_subnet_ids", {
      value: network.publicSubnets.map(subnet => subnet.id),
      description: "Public Subnet IDs",
    });

    new TerraformOutput(this, "private_subnet_ids", {
      value: network.privateSubnets.map(subnet => subnet.id),
      description: "Private Subnet IDs",
    });

    new TerraformOutput(this, "public_route_table_id", {
      value: network.publicRouteTable.id,
      description: "Public Route Table ID",
    });

    new TerraformOutput(this, "private_route_table_id", {
      value: network.privateRouteTable.id,
      description: "Private Route Table ID",
    });

    new TerraformOutput(this, "nat_gateway_id", {
      value: network.natGateway.id,
      description: "NAT Gateway ID",
    });

    new TerraformOutput(this, "nat_eip", {
      value: network.natEip.publicIp,
      description: "NAT Gateway Elastic IP",
    });

    new TerraformOutput(this, "public_security_group_id", {
      value: network.publicSecurityGroup.id,
      description: "Public Security Group ID",
    });

    new TerraformOutput(this, "private_security_group_id", {
      value: network.privateSecurityGroup.id,
      description: "Private Security Group ID",
    });

    new TerraformOutput(this, "rds_security_group_id", {
      value: rds.rdsSecurityGroup.id,
      description: "RDS Security Group ID",
    });

    new TerraformOutput(this, "rds_endpoint", {
      value: rds.rdsInstance.endpoint,
      description: "RDS Instance Endpoint",
    });

    new TerraformOutput(this, "rds_arn", {
      value: rds.rdsInstance.arn,
      description: "RDS Instance ARN",
    });
  }
}
```