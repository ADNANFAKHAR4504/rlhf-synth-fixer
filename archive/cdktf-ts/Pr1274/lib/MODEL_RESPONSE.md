I'll create a production-ready CDKTF TypeScript project that meets all your specifications. Here's the complete implementation:

## Project Structure

```
├── cdktf.json
├── package.json
├── tsconfig.json
├── lib/
│   ├── tap-stack.ts
│   └── modules.ts
└── main.ts
```

## Configuration Files

### `package.json`
```json
{
  "name": "tap-infrastructure",
  "version": "1.0.0",
  "description": "Production-ready AWS infrastructure using CDKTF",
  "main": "main.js",
  "scripts": {
    "get": "cdktf get",
    "build": "tsc",
    "synth": "cdktf synth",
    "deploy": "cdktf deploy",
    "destroy": "cdktf destroy"
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

### `cdktf.json`
```json
{
  "language": "typescript",
  "app": "npx ts-node main.ts",
  "projectId": "tap-infrastructure",
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

### `tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "declaration": true,
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": false,
    "noUnusedParameters": false,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": false,
    "inlineSourceMap": true,
    "inlineSources": true,
    "experimentalDecorators": true,
    "strictPropertyInitialization": false,
    "typeRoots": ["./node_modules/@types"],
    "skipLibCheck": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": [
    "**/*.ts"
  ],
  "exclude": [
    "node_modules",
    "cdktf.out"
  ]
}
```

### `main.ts`
```typescript
import { App } from "cdktf";
import { TapStack } from "./lib/tap-stack";

const app = new App();
new TapStack(app, "tap-production");
app.synth();
```

## Core Implementation Files

### `lib/modules.ts`
```typescript
import { Construct } from "constructs";
import {
  AwsProvider,
  Vpc,
  Subnet,
  InternetGateway,
  RouteTable,
  Route,
  RouteTableAssociation,
  NatGateway,
  Eip,
  SecurityGroup,
  SecurityGroupRule,
  Instance,
  DbInstance,
  DbSubnetGroup,
  KeyPair,
  DataAwsAmi,
  EbsEncryptionByDefault,
} from "@cdktf/provider-aws";

export interface CommonTags {
  Environment: string;
  Owner: string;
  Project?: string;
}

export interface VpcModuleConfig {
  cidrBlock: string;
  publicSubnetCidr: string;
  privateSubnetCidr: string;
  availabilityZone: string;
  tags: CommonTags;
}

export interface Ec2ModuleConfig {
  instanceType: string;
  keyName: string;
  allowedSshCidr: string;
  subnetId: string;
  vpcId: string;
  tags: CommonTags;
}

export interface RdsModuleConfig {
  engine: string;
  engineVersion: string;
  instanceClass: string;
  allocatedStorage: number;
  dbName: string;
  username: string;
  password: string;
  subnetIds: string[];
  vpcId: string;
  backupRetentionPeriod: number;
  tags: CommonTags;
}

export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;
  public readonly internetGateway: InternetGateway;
  public readonly natGateway: NatGateway;
  public readonly publicRouteTable: RouteTable;
  public readonly privateRouteTable: RouteTable;

  constructor(scope: Construct, id: string, config: VpcModuleConfig) {
    super(scope, id);

    // VPC
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: config.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `${id}-vpc`,
        ...config.tags,
      },
    });

    // Public Subnet
    this.publicSubnet = new Subnet(this, "public-subnet", {
      vpcId: this.vpc.id,
      cidrBlock: config.publicSubnetCidr,
      availabilityZone: config.availabilityZone,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `${id}-public-subnet`,
        Type: "Public",
        ...config.tags,
      },
    });

    // Private Subnet
    this.privateSubnet = new Subnet(this, "private-subnet", {
      vpcId: this.vpc.id,
      cidrBlock: config.privateSubnetCidr,
      availabilityZone: config.availabilityZone,
      tags: {
        Name: `${id}-private-subnet`,
        Type: "Private",
        ...config.tags,
      },
    });

    // Internet Gateway
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${id}-igw`,
        ...config.tags,
      },
    });

    // Elastic IP for NAT Gateway
    const natEip = new Eip(this, "nat-eip", {
      domain: "vpc",
      tags: {
        Name: `${id}-nat-eip`,
        ...config.tags,
      },
      dependsOn: [this.internetGateway],
    });

    // NAT Gateway
    this.natGateway = new NatGateway(this, "nat-gateway", {
      allocationId: natEip.id,
      subnetId: this.publicSubnet.id,
      tags: {
        Name: `${id}-nat-gateway`,
        ...config.tags,
      },
    });

    // Public Route Table
    this.publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${id}-public-rt`,
        ...config.tags,
      },
    });

    // Public Route to Internet Gateway
    new Route(this, "public-route", {
      routeTableId: this.publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Associate Public Subnet with Public Route Table
    new RouteTableAssociation(this, "public-rt-association", {
      subnetId: this.publicSubnet.id,
      routeTableId: this.publicRouteTable.id,
    });

    // Private Route Table
    this.privateRouteTable = new RouteTable(this, "private-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: `${id}-private-rt`,
        ...config.tags,
      },
    });

    // Private Route to NAT Gateway
    new Route(this, "private-route", {
      routeTableId: this.privateRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: this.natGateway.id,
    });

    // Associate Private Subnet with Private Route Table
    new RouteTableAssociation(this, "private-rt-association", {
      subnetId: this.privateSubnet.id,
      routeTableId: this.privateRouteTable.id,
    });
  }
}

export class Ec2Module extends Construct {
  public readonly instance: Instance;
  public readonly securityGroup: SecurityGroup;
  public readonly keyPair: KeyPair;

  constructor(scope: Construct, id: string, config: Ec2ModuleConfig) {
    super(scope, id);

    // Enable EBS encryption by default
    new EbsEncryptionByDefault(this, "ebs-encryption", {
      enabled: true,
    });

    // Key Pair for EC2 instance
    this.keyPair = new KeyPair(this, "key-pair", {
      keyName: config.keyName,
      tags: {
        Name: `${id}-key-pair`,
        ...config.tags,
      },
    });

    // Security Group for EC2
    this.securityGroup = new SecurityGroup(this, "ec2-sg", {
      name: `${id}-ec2-sg`,
      description: "Security group for EC2 instance",
      vpcId: config.vpcId,
      tags: {
        Name: `${id}-ec2-sg`,
        ...config.tags,
      },
    });

    // SSH access from specific IP
    new SecurityGroupRule(this, "ssh-ingress", {
      type: "ingress",
      fromPort: 22,
      toPort: 22,
      protocol: "tcp",
      cidrBlocks: [config.allowedSshCidr],
      securityGroupId: this.securityGroup.id,
      description: "SSH access from office IP",
    });

    // All outbound traffic
    new SecurityGroupRule(this, "all-egress", {
      type: "egress",
      fromPort: 0,
      toPort: 0,
      protocol: "-1",
      cidrBlocks: ["0.0.0.0/0"],
      securityGroupId: this.securityGroup.id,
      description: "All outbound traffic",
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

    // EC2 Instance
    this.instance = new Instance(this, "instance", {
      ami: ami.id,
      instanceType: config.instanceType,
      keyName: this.keyPair.keyName,
      subnetId: config.subnetId,
      vpcSecurityGroupIds: [this.securityGroup.id],
      associatePublicIpAddress: true,
      
      // Enable encryption at rest
      rootBlockDevice: {
        volumeType: "gp3",
        volumeSize: 20,
        encrypted: true,
        deleteOnTermination: true,
      },

      // User data for basic setup
      userData: `#!/bin/bash
yum update -y
yum install -y postgresql
`,

      tags: {
        Name: `${id}-instance`,
        ...config.tags,
      },
    });
  }
}

export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;
  public readonly securityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, config: RdsModuleConfig) {
    super(scope, id);

    // DB Subnet Group
    this.dbSubnetGroup = new DbSubnetGroup(this, "db-subnet-group", {
      name: `${id}-db-subnet-group`,
      subnetIds: config.subnetIds,
      tags: {
        Name: `${id}-db-subnet-group`,
        ...config.tags,
      },
    });

    // Security Group for RDS
    this.securityGroup = new SecurityGroup(this, "rds-sg", {
      name: `${id}-rds-sg`,
      description: "Security group for RDS PostgreSQL instance",
      vpcId: config.vpcId,
      tags: {
        Name: `${id}-rds-sg`,
        ...config.tags,
      },
    });

    // PostgreSQL access from VPC
    new SecurityGroupRule(this, "postgres-ingress", {
      type: "ingress",
      fromPort: 5432,
      toPort: 5432,
      protocol: "tcp",
      cidrBlocks: ["10.0.0.0/16"],
      securityGroupId: this.securityGroup.id,
      description: "PostgreSQL access from VPC",
    });

    // RDS Instance
    this.dbInstance = new DbInstance(this, "db-instance", {
      identifier: `${id}-postgres`,
      engine: config.engine,
      engineVersion: config.engineVersion,
      instanceClass: config.instanceClass,
      allocatedStorage: config.allocatedStorage,
      storageType: "gp3",
      storageEncrypted: true,
      
      dbName: config.dbName,
      username: config.username,
      password: config.password,
      
      dbSubnetGroupName: this.dbSubnetGroup.name,
      vpcSecurityGroupIds: [this.securityGroup.id],
      
      // Backup configuration
      backupRetentionPeriod: config.backupRetentionPeriod,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      
      // Security settings
      deletionProtection: true,
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: `${id}-final-snapshot`,
      
      // Performance and monitoring
      performanceInsightsEnabled: true,
      monitoringInterval: 60,
      
      tags: {
        Name: `${id}-postgres`,
        ...config.tags,
      },
    });
  }
}
```

### `lib/tap-stack.ts`
```typescript
import { Construct } from "constructs";
import { TerraformStack } from "cdktf";
import { AwsProvider } from "@cdktf/provider-aws";
import { VpcModule, Ec2Module, RdsModule, CommonTags } from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Common tags for all resources
    const commonTags: CommonTags = {
      Environment: "Production",
      Owner: "DevOpsTeam",
      Project: "TAP-Infrastructure",
    };

    // AWS Provider
    new AwsProvider(this, "aws", {
      region: "us-west-2",
      defaultTags: {
        tags: commonTags,
      },
    });

    // VPC Module
    const vpcModule = new VpcModule(this, "tap-vpc", {
      cidrBlock: "10.0.0.0/16",
      publicSubnetCidr: "10.0.1.0/24",
      privateSubnetCidr: "10.0.2.0/24",
      availabilityZone: "us-west-2a",
      tags: commonTags,
    });

    // EC2 Module
    const ec2Module = new Ec2Module(this, "tap-ec2", {
      instanceType: "t3.medium",
      keyName: "tap-production-key",
      allowedSshCidr: "YOUR_OFFICE_IP/32", // Replace with your actual office IP
      subnetId: vpcModule.publicSubnet.id,
      vpcId: vpcModule.vpc.id,
      tags: commonTags,
    });

    // Create a second private subnet in different AZ for RDS (Multi-AZ requirement)
    const privateSubnet2 = new (require("@cdktf/provider-aws").Subnet)(this, "private-subnet-2", {
      vpcId: vpcModule.vpc.id,
      cidrBlock: "10.0.3.0/24",
      availabilityZone: "us-west-2b",
      tags: {
        Name: "tap-private-subnet-2",
        Type: "Private",
        ...commonTags,
      },
    });

    // Associate second private subnet with private route table
    new (require("@cdktf/provider-aws").RouteTableAssociation)(this, "private-rt-association-2", {
      subnetId: privateSubnet2.id,
      routeTableId: vpcModule.privateRouteTable.id,
    });

    // RDS Module
    const rdsModule = new RdsModule(this, "tap-rds", {
      engine: "postgres",
      engineVersion: "15.4",
      instanceClass: "db.t3.micro",
      allocatedStorage: 20,
      dbName: "tapdb",
      username: "tapuser",
      password: "ChangeMe123!", // In production, use AWS Secrets Manager
      subnetIds: [vpcModule.privateSubnet.id, privateSubnet2.id],
      vpcId: vpcModule.vpc.id,
      backupRetentionPeriod: 7,
      tags: commonTags,
    });

    // Outputs
    this.addOverride("output", {
      vpc_id: {
        value: vpcModule.vpc.id,
        description: "VPC ID",
      },
      public_subnet_id: {
        value: vpcModule.publicSubnet.id,
        description: "Public Subnet ID",
      },
      private_subnet_id: {
        value: vpcModule.privateSubnet.id,
        description: "Private Subnet ID",
      },
      ec2_instance_id: {
        value: ec2Module.instance.id,
        description: "EC2 Instance ID",
      },
      ec2_public_ip: {
        value: ec2Module.instance.publicIp,
        description: "EC2 Public IP",
      },
      rds_endpoint: {
        value: rdsModule.dbInstance.endpoint,
        description: "RDS Endpoint",
        sensitive: true,
      },
      rds_port: {
        value: rdsModule.dbInstance.port,
        description: "RDS Port",
      },
    });
  }
}
```

## Deployment Instructions

1. **Initialize the project:**
```bash
npm install
cdktf get
```

2. **Configure your office IP:**
   - Replace `YOUR_OFFICE_IP/32` in `lib/tap-stack.ts` with your actual office IP address

3. **Build and deploy:**
```bash
npm run build
cdktf plan
cdktf deploy
```

## Key Features Implemented

### ✅ **Infrastructure Components**
- **VPC**: 10.0.0.0/16 CIDR block in us-west-2
- **Subnets**: Public (10.0.1.0/24) and Private (10.0.2.0/24, 10.0.3.0/24)
- **Networking**: Internet Gateway, NAT Gateway with Elastic IP
- **EC2**: t3.medium instance with EBS encryption enabled
- **RDS**: PostgreSQL 15.4 with encryption, 7-day backups

### ✅ **Security & Compliance**
- **Hardened Security Groups**: SSH only from specified IP, PostgreSQL only from VPC
- **Encryption**: EBS encryption by default, RDS storage encryption
- **Network Isolation**: RDS in private subnets only
- **Resource Tagging**: Environment=Production, Owner=DevOpsTeam

### ✅ **Best Practices**
- **Modular Design**: Reusable modules in `modules.ts`
- **Type Safety**: Full TypeScript implementation
- **Production Ready**: Deletion protection, automated backups, monitoring
- **Cost Optimization**: GP3 storage, appropriate instance sizes

### ✅ **CDKTF Requirements**
- **Two-file structure**: `tap-stack.ts` and `modules.ts`
- **Terraform 1.0+ compatible**
- **Idempotent**: Can be applied multiple times safely

## Security Notes

🔐 **Important**: Replace the hardcoded RDS password with AWS Secrets Manager in production:

```typescript
// Add to RDS module for production
const dbSecret = new SecretsmanagerSecret(this, "db-secret", {
  name: `${id}-db-credentials`,
  generateSecretString: {
    secretStringTemplate: JSON.stringify({ username: config.username }),
    generateStringKey: "password",
    excludeCharacters: '"@/\\',
    passwordLength: 32,
  },
});
```

This infrastructure provides a solid foundation for production workloads with proper security, monitoring, and backup strategies in place.