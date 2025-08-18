I'll create a secure AWS infrastructure using CDKTF in TypeScript that meets all your requirements. Here are the two required files:

## lib/modules.ts

```typescript
import { Construct } from 'constructs';
import { TerraformOutput } from 'cdktf';
import {
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
  DbSubnetGroup,
  DbInstance,
  S3Bucket,
  S3BucketVersioning,
  S3BucketServerSideEncryptionConfiguration,
  S3BucketPublicAccessBlock,
} from '@cdktf/provider-aws/lib';

// Common props interface
interface BaseProps {
  projectName: string;
  environment: string;
  tags: { [key: string]: string };
}

// VPC Module Props
export interface VpcModuleProps extends BaseProps {
  cidrBlock: string;
  availabilityZones: string[];
}

// Security Groups Module Props
export interface SecurityGroupsModuleProps extends BaseProps {
  vpcId: string;
  vpcCidrBlock: string;
  bastionAllowedCidr: string;
}

// RDS Module Props
export interface RdsModuleProps extends BaseProps {
  vpcId: string;
  privateSubnetIds: string[];
  securityGroupId: string;
  dbInstanceClass: string;
  engine: string;
  engineVersion: string;
  allocatedStorage: number;
  dbName: string;
  username: string;
  password: string;
}

// S3 Module Props
export interface S3ModuleProps extends BaseProps {
  bucketName: string;
}

// VPC Module
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnets: Subnet[];
  public readonly privateSubnets: Subnet[];
  public readonly internetGateway: InternetGateway;
  public readonly natGateway: NatGateway;

  constructor(scope: Construct, id: string, props: VpcModuleProps) {
    super(scope, id);

    // Create VPC
    this.vpc = new Vpc(this, 'vpc', {
      cidrBlock: props.cidrBlock,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-main-vpc`,
      },
    });

    // Create Internet Gateway
    this.internetGateway = new InternetGateway(this, 'igw', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-igw`,
      },
    });

    // Create public subnets
    this.publicSubnets = props.availabilityZones.map((az, index) => {
      return new Subnet(this, `public-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 1}.0/24`,
        availabilityZone: az,
        mapPublicIpOnLaunch: true,
        tags: {
          ...props.tags,
          Name: `${props.projectName}-${props.environment}-public-subnet-${index + 1}`,
          Type: 'Public',
        },
      });
    });

    // Create private subnets
    this.privateSubnets = props.availabilityZones.map((az, index) => {
      return new Subnet(this, `private-subnet-${index + 1}`, {
        vpcId: this.vpc.id,
        cidrBlock: `10.0.${index + 10}.0/24`,
        availabilityZone: az,
        tags: {
          ...props.tags,
          Name: `${props.projectName}-${props.environment}-private-subnet-${index + 1}`,
          Type: 'Private',
        },
      });
    });

    // Create Elastic IP for NAT Gateway
    const natEip = new Eip(this, 'nat-eip', {
      domain: 'vpc',
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-nat-eip`,
      },
    });

    // Create NAT Gateway in first public subnet
    this.natGateway = new NatGateway(this, 'nat-gateway', {
      allocationId: natEip.id,
      subnetId: this.publicSubnets[0].id,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-nat-gateway`,
      },
    });

    // Create route table for public subnets
    const publicRouteTable = new RouteTable(this, 'public-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-public-rt`,
      },
    });

    // Create route to internet gateway
    new Route(this, 'public-route', {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnets with public route table
    this.publicSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `public-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: publicRouteTable.id,
      });
    });

    // Create route table for private subnets
    const privateRouteTable = new RouteTable(this, 'private-rt', {
      vpcId: this.vpc.id,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-private-rt`,
      },
    });

    // Create route to NAT gateway
    new Route(this, 'private-route', {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: '0.0.0.0/0',
      natGatewayId: this.natGateway.id,
    });

    // Associate private subnets with private route table
    this.privateSubnets.forEach((subnet, index) => {
      new RouteTableAssociation(this, `private-rta-${index + 1}`, {
        subnetId: subnet.id,
        routeTableId: privateRouteTable.id,
      });
    });
  }
}

// Security Groups Module
export class SecurityGroupsModule extends Construct {
  public readonly bastionSecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;

  constructor(scope: Construct, id: string, props: SecurityGroupsModuleProps) {
    super(scope, id);

    // Bastion Host Security Group
    this.bastionSecurityGroup = new SecurityGroup(this, 'bastion-sg', {
      name: `${props.projectName}-${props.environment}-bastion-sg`,
      description: 'Security group for bastion host',
      vpcId: props.vpcId,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-bastion-sg`,
      },
    });

    // Allow SSH from specific IP range
    new SecurityGroupRule(this, 'bastion-ssh-ingress', {
      type: 'ingress',
      fromPort: 22,
      toPort: 22,
      protocol: 'tcp',
      cidrBlocks: [props.bastionAllowedCidr],
      securityGroupId: this.bastionSecurityGroup.id,
      description: 'Allow SSH from authorized IP range',
    });

    // Allow all outbound traffic for bastion
    new SecurityGroupRule(this, 'bastion-egress', {
      type: 'egress',
      fromPort: 0,
      toPort: 0,
      protocol: '-1',
      cidrBlocks: ['0.0.0.0/0'],
      securityGroupId: this.bastionSecurityGroup.id,
      description: 'Allow all outbound traffic',
    });

    // RDS Security Group
    this.rdsSecurityGroup = new SecurityGroup(this, 'rds-sg', {
      name: `${props.projectName}-${props.environment}-rds-sg`,
      description: 'Security group for RDS PostgreSQL instance',
      vpcId: props.vpcId,
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-rds-sg`,
      },
    });

    // Allow PostgreSQL access from VPC CIDR
    new SecurityGroupRule(this, 'rds-postgres-ingress', {
      type: 'ingress',
      fromPort: 5432,
      toPort: 5432,
      protocol: 'tcp',
      cidrBlocks: [props.vpcCidrBlock],
      securityGroupId: this.rdsSecurityGroup.id,
      description: 'Allow PostgreSQL access from VPC',
    });

    // No explicit egress rules needed for RDS (default allows all outbound)
  }
}

// RDS Module
export class RdsModule extends Construct {
  public readonly dbInstance: DbInstance;
  public readonly dbSubnetGroup: DbSubnetGroup;

  constructor(scope: Construct, id: string, props: RdsModuleProps) {
    super(scope, id);

    // Create DB Subnet Group
    this.dbSubnetGroup = new DbSubnetGroup(this, 'db-subnet-group', {
      name: `${props.projectName}-${props.environment}-db-subnet-group`,
      subnetIds: props.privateSubnetIds,
      description: 'Database subnet group for RDS instance',
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-db-subnet-group`,
      },
    });

    // Create RDS Instance
    this.dbInstance = new DbInstance(this, 'db-instance', {
      identifier: `${props.projectName}-${props.environment}-postgres-db`,
      allocatedStorage: props.allocatedStorage,
      storageType: 'gp2',
      engine: props.engine,
      engineVersion: props.engineVersion,
      instanceClass: props.dbInstanceClass,
      dbName: props.dbName,
      username: props.username,
      password: props.password,
      vpcSecurityGroupIds: [props.securityGroupId],
      dbSubnetGroupName: this.dbSubnetGroup.name,
      storageEncrypted: true,
      publiclyAccessible: false,
      skipFinalSnapshot: true,
      backupRetentionPeriod: 7,
      backupWindow: '03:00-04:00',
      maintenanceWindow: 'sun:04:00-sun:05:00',
      tags: {
        ...props.tags,
        Name: `${props.projectName}-${props.environment}-postgres-db`,
      },
    });
  }
}

// S3 Module
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3ModuleProps) {
    super(scope, id);

    // Create S3 Bucket
    this.bucket = new S3Bucket(this, 'log-bucket', {
      bucket: props.bucketName,
      tags: {
        ...props.tags,
        Name: props.bucketName,
      },
    });

    // Enable versioning
    new S3BucketVersioning(this, 'bucket-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfiguration(this, 'bucket-encryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    // Block all public access
    new S3BucketPublicAccessBlock(this, 'bucket-pab', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from 'constructs';
import { TerraformStack, TerraformOutput } from 'cdktf';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import {
  VpcModule,
  SecurityGroupsModule,
  RdsModule,
  S3Module,
} from './modules';

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configuration
    const projectName = 'aurora';
    const environment = 'prod';
    const region = 'us-west-2';
    const availabilityZones = ['us-west-2a', 'us-west-2b'];

    // Common tags
    const commonTags = {
      Environment: environment,
      Owner: 'CloudEngineering',
    };

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: region,
    });

    // Create VPC
    const vpc = new VpcModule(this, 'vpc', {
      projectName,
      environment,
      cidrBlock: '10.0.0.0/16',
      availabilityZones,
      tags: commonTags,
    });

    // Create Security Groups
    const securityGroups = new SecurityGroupsModule(this, 'security-groups', {
      projectName,
      environment,
      vpcId: vpc.vpc.id,
      vpcCidrBlock: '10.0.0.0/16',
      bastionAllowedCidr: '203.0.113.0/24',
      tags: commonTags,
    });

    // Create RDS Instance
    const rds = new RdsModule(this, 'rds', {
      projectName,
      environment,
      vpcId: vpc.vpc.id,
      privateSubnetIds: vpc.privateSubnets.map(subnet => subnet.id),
      securityGroupId: securityGroups.rdsSecurityGroup.id,
      dbInstanceClass: 'db.t3.micro',
      engine: 'postgres',
      engineVersion: '13.13',
      allocatedStorage: 20,
      dbName: 'auroradb',
      username: 'dbadmin',
      password: 'ChangeMe123!', // In production, use AWS Secrets Manager
      tags: commonTags,
    });

    // Create S3 Bucket for Logging
    const s3 = new S3Module(this, 's3', {
      projectName,
      environment,
      bucketName: `${projectName}-${environment}-logs-${Date.now()}`,
      tags: commonTags,
    });

    // Stack Outputs
    new TerraformOutput(this, 'vpc-id', {
      value: vpc.vpc.id,
      description: 'ID of the VPC',
    });

    new TerraformOutput(this, 'rds-instance-endpoint', {
      value: rds.dbInstance.endpoint,
      description: 'RDS instance endpoint',
    });

    new TerraformOutput(this, 'log-bucket-name', {
      value: s3.bucket.bucket,
      description: 'Name of the S3 logging bucket',
    });
  }
}
```

## Key Features Implemented

### Security Best Practices

- **VPC Isolation**: All resources are deployed in a private VPC with proper subnet segmentation
- **Network Security**: NAT Gateway provides controlled outbound internet access for private subnets
- **Security Groups**: Implement least privilege access with specific port and CIDR restrictions
- **Encryption**: RDS storage encryption and S3 server-side encryption enabled
- **Private Database**: RDS instance is not publicly accessible and placed in private subnets

### Infrastructure Components

1. **VPC Module**: Creates a complete network infrastructure with public/private subnets, IGW, and NAT Gateway
2. **Security Groups Module**: Implements bastion host and RDS security groups with proper access controls
3. **RDS Module**: Deploys an encrypted PostgreSQL instance in private subnets with backup configuration
4. **S3 Module**: Creates a secure logging bucket with versioning and public access blocking

### Compliance Features

- **Naming Convention**: All resources follow the `aurora-prod-{resource-name}` pattern
- **Tagging**: Consistent tagging with Environment and Owner tags
- **Region**: All resources deployed in us-west-2
- **Modularity**: Clean separation of concerns with reusable constructs

### Usage

To deploy this infrastructure:

```bash
# Initialize and install dependencies
npm install

# Synthesize the Terraform configuration
cdktf synth

# Deploy the infrastructure
cdktf deploy
```

The stack outputs will provide the VPC ID, RDS endpoint, and S3 bucket name for use by applications and other infrastructure components.
