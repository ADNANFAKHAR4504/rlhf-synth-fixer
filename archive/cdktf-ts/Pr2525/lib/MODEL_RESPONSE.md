## lib/modules.ts

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
  Instance,
  S3Bucket,
  S3BucketVersioning,
  S3BucketServerSideEncryptionConfiguration,
  S3BucketPublicAccessBlock,
  DbSubnetGroup,
  DbInstance,
  IamRole,
  IamRolePolicy,
  IamInstanceProfile,
  CloudtrailTrail,
  S3BucketPolicy,
  KmsKey,
  KmsAlias,
  DataAwsAmi,
  DataAwsAvailabilityZones,
} from "@cdktf/provider-aws";

// VPC Module - Creates secure network infrastructure
export class VpcModule extends Construct {
  public readonly vpc: Vpc;
  public readonly publicSubnet: Subnet;
  public readonly privateSubnet: Subnet;
  public readonly isolatedSubnet: Subnet;
  public readonly internetGateway: InternetGateway;
  public readonly natGateway: NatGateway;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Get availability zones for the region
    const azs = new DataAwsAvailabilityZones(this, "azs", {
      state: "available",
    });

    // Create VPC with DNS support
    this.vpc = new Vpc(this, "vpc", {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: "tap-vpc",
        Environment: "production",
      },
    });

    // Internet Gateway for public subnet
    this.internetGateway = new InternetGateway(this, "igw", {
      vpcId: this.vpc.id,
      tags: {
        Name: "tap-igw",
      },
    });

    // Public subnet for NAT Gateway
    this.publicSubnet = new Subnet(this, "public-subnet", {
      vpcId: this.vpc.id,
      cidrBlock: "10.0.1.0/24",
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      mapPublicIpOnLaunch: true,
      tags: {
        Name: "tap-public-subnet",
        Type: "public",
      },
    });

    // Private subnet for EC2
    this.privateSubnet = new Subnet(this, "private-subnet", {
      vpcId: this.vpc.id,
      cidrBlock: "10.0.2.0/24",
      availabilityZone: `\${${azs.fqn}.names[0]}`,
      tags: {
        Name: "tap-private-subnet",
        Type: "private",
      },
    });

    // Isolated subnet for RDS
    this.isolatedSubnet = new Subnet(this, "isolated-subnet", {
      vpcId: this.vpc.id,
      cidrBlock: "10.0.3.0/24",
      availabilityZone: `\${${azs.fqn}.names[1]}`,
      tags: {
        Name: "tap-isolated-subnet",
        Type: "isolated",
      },
    });

    // Additional isolated subnet for RDS Multi-AZ (required)
    const isolatedSubnet2 = new Subnet(this, "isolated-subnet-2", {
      vpcId: this.vpc.id,
      cidrBlock: "10.0.4.0/24",
      availabilityZone: `\${${azs.fqn}.names[2]}`,
      tags: {
        Name: "tap-isolated-subnet-2",
        Type: "isolated",
      },
    });

    // Elastic IP for NAT Gateway
    const natEip = new Eip(this, "nat-eip", {
      domain: "vpc",
      tags: {
        Name: "tap-nat-eip",
      },
    });

    // NAT Gateway in public subnet
    this.natGateway = new NatGateway(this, "nat-gateway", {
      allocationId: natEip.id,
      subnetId: this.publicSubnet.id,
      tags: {
        Name: "tap-nat-gateway",
      },
    });

    // Route table for public subnet
    const publicRouteTable = new RouteTable(this, "public-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: "tap-public-rt",
      },
    });

    // Route to internet gateway
    new Route(this, "public-route", {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: this.internetGateway.id,
    });

    // Associate public subnet with public route table
    new RouteTableAssociation(this, "public-rta", {
      subnetId: this.publicSubnet.id,
      routeTableId: publicRouteTable.id,
    });

    // Route table for private subnet
    const privateRouteTable = new RouteTable(this, "private-rt", {
      vpcId: this.vpc.id,
      tags: {
        Name: "tap-private-rt",
      },
    });

    // Route to NAT gateway for internet access
    new Route(this, "private-route", {
      routeTableId: privateRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: this.natGateway.id,
    });

    // Associate private subnet with private route table
    new RouteTableAssociation(this, "private-rta", {
      subnetId: this.privateSubnet.id,
      routeTableId: privateRouteTable.id,
    });

    // Create DB subnet group for RDS
    new DbSubnetGroup(this, "db-subnet-group", {
      name: "tap-db-subnet-group",
      subnetIds: [this.isolatedSubnet.id, isolatedSubnet2.id],
      tags: {
        Name: "tap-db-subnet-group",
      },
    });
  }
}

// Security Module - Creates security groups and IAM roles
export class SecurityModule extends Construct {
  public readonly ec2SecurityGroup: SecurityGroup;
  public readonly rdsSecurityGroup: SecurityGroup;
  public readonly ec2Role: IamRole;
  public readonly ec2InstanceProfile: IamInstanceProfile;

  constructor(scope: Construct, id: string, vpcId: string) {
    super(scope, id);

    // Security group for EC2 instance
    this.ec2SecurityGroup = new SecurityGroup(this, "ec2-sg", {
      name: "tap-ec2-sg",
      description: "Security group for EC2 instance",
      vpcId: vpcId,
      
      // Allow outbound traffic
      egress: [
        {
          fromPort: 0,
          toPort: 0,
          protocol: "-1",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],

      // Allow SSH from within VPC only
      ingress: [
        {
          fromPort: 22,
          toPort: 22,
          protocol: "tcp",
          cidrBlocks: ["10.0.0.0/16"],
        },
      ],

      tags: {
        Name: "tap-ec2-sg",
      },
    });

    // Security group for RDS
    this.rdsSecurityGroup = new SecurityGroup(this, "rds-sg", {
      name: "tap-rds-sg",
      description: "Security group for RDS database",
      vpcId: vpcId,

      // Allow MySQL access from EC2 security group only
      ingress: [
        {
          fromPort: 3306,
          toPort: 3306,
          protocol: "tcp",
          securityGroups: [this.ec2SecurityGroup.id],
        },
      ],

      tags: {
        Name: "tap-rds-sg",
      },
    });

    // IAM role for EC2 instance
    this.ec2Role = new IamRole(this, "ec2-role", {
      name: "tap-ec2-role",
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
        Name: "tap-ec2-role",
      },
    });

    // IAM policy for S3 access (least privilege)
    new IamRolePolicy(this, "ec2-s3-policy", {
      name: "tap-ec2-s3-policy",
      role: this.ec2Role.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Effect: "Allow",
            Action: [
              "s3:GetObject",
              "s3:GetObjectVersion",
              "s3:ListBucket",
            ],
            Resource: [
              "arn:aws:s3:::tap-secure-bucket-*",
              "arn:aws:s3:::tap-secure-bucket-*/*",
            ],
          },
        ],
      }),
    });

    // Instance profile for EC2
    this.ec2InstanceProfile = new IamInstanceProfile(this, "ec2-instance-profile", {
      name: "tap-ec2-instance-profile",
      role: this.ec2Role.name,
    });
  }
}

// S3 Module - Creates encrypted S3 bucket with versioning
export class S3Module extends Construct {
  public readonly bucket: S3Bucket;
  public readonly kmsKey: KmsKey;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // KMS key for S3 encryption
    this.kmsKey = new KmsKey(this, "s3-kms-key", {
      description: "KMS key for S3 bucket encryption",
      keyUsage: "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: "arn:aws:iam::*:root",
            },
            Action: "kms:*",
            Resource: "*",
          },
        ],
      }),
      tags: {
        Name: "tap-s3-kms-key",
      },
    });

    // KMS key alias
    new KmsAlias(this, "s3-kms-alias", {
      name: "alias/tap-s3-key",
      targetKeyId: this.kmsKey.keyId,
    });

    // S3 bucket with unique name
    this.bucket = new S3Bucket(this, "secure-bucket", {
      bucket: `tap-secure-bucket-\${random_id.bucket_suffix.hex}`,
      tags: {
        Name: "tap-secure-bucket",
        Environment: "production",
      },
    });

    // Enable versioning
    new S3BucketVersioning(this, "bucket-versioning", {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfiguration(this, "bucket-encryption", {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: this.kmsKey.arn,
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, "bucket-pab", {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}

// EC2 Module - Creates EC2 instance with IAM role
export class Ec2Module extends Construct {
  public readonly instance: Instance;

  constructor(
    scope: Construct,
    id: string,
    subnetId: string,
    securityGroupId: string,
    instanceProfile: string
  ) {
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

    // EC2 instance in private subnet
    this.instance = new Instance(this, "ec2-instance", {
      ami: ami.id,
      instanceType: "t3.micro",
      subnetId: subnetId,
      vpcSecurityGroupIds: [securityGroupId],
      iamInstanceProfile: instanceProfile,
      
      // User data to install SSM agent for secure access
      userData: `#!/bin/bash
yum update -y
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent`,

      tags: {
        Name: "tap-ec2-instance",
        Environment: "production",
      },
    });
  }
}

// RDS Module - Creates encrypted MySQL database with Multi-AZ
export class RdsModule extends Construct {
  public readonly database: DbInstance;
  public readonly kmsKey: KmsKey;

  constructor(scope: Construct, id: string, securityGroupId: string) {
    super(scope, id);

    // KMS key for RDS encryption
    this.kmsKey = new KmsKey(this, "rds-kms-key", {
      description: "KMS key for RDS encryption",
      keyUsage: "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: "arn:aws:iam::*:root",
            },
            Action: "kms:*",
            Resource: "*",
          },
        ],
      }),
      tags: {
        Name: "tap-rds-kms-key",
      },
    });

    // KMS key alias
    new KmsAlias(this, "rds-kms-alias", {
      name: "alias/tap-rds-key",
      targetKeyId: this.kmsKey.keyId,
    });

    // RDS MySQL instance
    this.database = new DbInstance(this, "mysql-db", {
      identifier: "tap-mysql-db",
      engine: "mysql",
      engineVersion: "8.0",
      instanceClass: "db.t3.micro",
      allocatedStorage: 20,
      storageType: "gp2",
      storageEncrypted: true,
      kmsKeyId: this.kmsKey.arn,
      
      // Database configuration
      dbName: "tapdb",
      username: "admin",
      managePassword: true, // AWS manages the password
      
      // High availability
      multiAz: true,
      
      // Backup configuration
      backupRetentionPeriod: 7,
      backupWindow: "03:00-04:00",
      maintenanceWindow: "sun:04:00-sun:05:00",
      
      // Network configuration
      dbSubnetGroupName: "tap-db-subnet-group",
      vpcSecurityGroupIds: [securityGroupId],
      
      // Security
      skipFinalSnapshot: false,
      finalSnapshotIdentifier: "tap-mysql-db-final-snapshot",
      deletionProtection: true,
      
      tags: {
        Name: "tap-mysql-db",
        Environment: "production",
      },
    });
  }
}

// CloudTrail Module - Enables logging and monitoring
export class CloudTrailModule extends Construct {
  public readonly trail: CloudtrailTrail;
  public readonly logsBucket: S3Bucket;
  public readonly kmsKey: KmsKey;

  constructor(scope: Construct, id: string) {
    super(scope, id);

    // KMS key for CloudTrail encryption
    this.kmsKey = new KmsKey(this, "cloudtrail-kms-key", {
      description: "KMS key for CloudTrail encryption",
      keyUsage: "ENCRYPT_DECRYPT",
      keySpec: "SYMMETRIC_DEFAULT",
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "Enable IAM User Permissions",
            Effect: "Allow",
            Principal: {
              AWS: "arn:aws:iam::*:root",
            },
            Action: "kms:*",
            Resource: "*",
          },
          {
            Sid: "Allow CloudTrail to encrypt logs",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com",
            },
            Action: [
              "kms:GenerateDataKey*",
              "kms:DescribeKey",
            ],
            Resource: "*",
          },
        ],
      }),
      tags: {
        Name: "tap-cloudtrail-kms-key",
      },
    });

    // KMS key alias
    new KmsAlias(this, "cloudtrail-kms-alias", {
      name: "alias/tap-cloudtrail-key",
      targetKeyId: this.kmsKey.keyId,
    });

    // S3 bucket for CloudTrail logs
    this.logsBucket = new S3Bucket(this, "cloudtrail-logs", {
      bucket: `tap-cloudtrail-logs-\${random_id.bucket_suffix.hex}`,
      tags: {
        Name: "tap-cloudtrail-logs",
        Environment: "production",
      },
    });

    // Enable versioning for logs bucket
    new S3BucketVersioning(this, "logs-bucket-versioning", {
      bucket: this.logsBucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    });

    // Enable encryption for logs bucket
    new S3BucketServerSideEncryptionConfiguration(this, "logs-bucket-encryption", {
      bucket: this.logsBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: this.kmsKey.arn,
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block public access for logs bucket
    new S3BucketPublicAccessBlock(this, "logs-bucket-pab", {
      bucket: this.logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Bucket policy for CloudTrail
    new S3BucketPolicy(this, "cloudtrail-bucket-policy", {
      bucket: this.logsBucket.id,
      policy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [
          {
            Sid: "AWSCloudTrailAclCheck",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com",
            },
            Action: "s3:GetBucketAcl",
            Resource: `arn:aws:s3:::${this.logsBucket.bucket}`,
          },
          {
            Sid: "AWSCloudTrailWrite",
            Effect: "Allow",
            Principal: {
              Service: "cloudtrail.amazonaws.com",
            },
            Action: "s3:PutObject",
            Resource: `arn:aws:s3:::${this.logsBucket.bucket}/*`,
            Condition: {
              StringEquals: {
                "s3:x-amz-acl": "bucket-owner-full-control",
              },
            },
          },
        ],
      }),
    });

    // CloudTrail
    this.trail = new CloudtrailTrail(this, "cloudtrail", {
      name: "tap-cloudtrail",
      s3BucketName: this.logsBucket.id,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogging: true,
      kmsKeyId: this.kmsKey.arn,
      
      eventSelector: [
        {
          readWriteType: "All",
          includeManagementEvents: true,
          dataResource: [
            {
              type: "AWS::S3::Object",
              values: ["arn:aws:s3:::*/*"],
            },
          ],
        },
      ],

      tags: {
        Name: "tap-cloudtrail",
        Environment: "production",
      },
    });
  }
}
```

## lib/tap-stack.ts

```typescript
import { Construct } from "constructs";
import { TerraformStack, TerraformOutput } from "cdktf";
import { AwsProvider, RandomProvider, RandomId } from "@cdktf/provider-aws";
import {
  VpcModule,
  SecurityModule,
  S3Module,
  Ec2Module,
  RdsModule,
  CloudTrailModule,
} from "./modules";

export class TapStack extends TerraformStack {
  constructor(scope: Construct, id: string) {
    super(scope, id);

    // Configure AWS Provider for us-west-2 region
    new AwsProvider(this, "aws", {
      region: "us-west-2",
      defaultTags: [
        {
          tags: {
            Project: "TAP",
            ManagedBy: "CDKTF",
            Environment: "production",
          },
        },
      ],
    });

    // Random provider for unique resource naming
    new RandomProvider(this, "random", {});

    // Generate random suffix for globally unique names
    const bucketSuffix = new RandomId(this, "bucket-suffix", {
      byteLength: 4,
    });

    // Deploy VPC and networking infrastructure
    const vpcModule = new VpcModule(this, "vpc");

    // Deploy security groups and IAM roles
    const securityModule = new SecurityModule(this, "security", vpcModule.vpc.id);

    // Deploy encrypted S3 bucket with versioning
    const s3Module = new S3Module(this, "s3");

    // Deploy EC2 instance in private subnet
    const ec2Module = new Ec2Module(
      this,
      "ec2",
      vpcModule.privateSubnet.id,
      securityModule.ec2SecurityGroup.id,
      securityModule.ec2InstanceProfile.name
    );

    // Deploy RDS MySQL database in isolated subnet
    const rdsModule = new RdsModule(
      this,
      "rds",
      securityModule.rdsSecurityGroup.id
    );

    // Deploy CloudTrail for monitoring and logging
    const cloudTrailModule = new CloudTrailModule(this, "cloudtrail");

    // Terraform Outputs for important resource information
    new TerraformOutput(this, "vpc-id", {
      value: vpcModule.vpc.id,
      description: "VPC ID",
    });

    new TerraformOutput(this, "ec2-instance-id", {
      value: ec2Module.instance.id,
      description: "EC2 Instance ID",
    });

    new TerraformOutput(this, "ec2-private-ip", {
      value: ec2Module.instance.privateIp,
      description: "EC2 Instance Private IP",
    });

    new TerraformOutput(this, "s3-bucket-name", {
      value: s3Module.bucket.bucket,
      description: "S3 Bucket Name",
    });

    new TerraformOutput(this, "rds-endpoint", {
      value: rdsModule.database.endpoint,
      description: "RDS Database Endpoint",
      sensitive: true,
    });

    new TerraformOutput(this, "cloudtrail-arn", {
      value: cloudTrailModule.trail.arn,
      description: "CloudTrail ARN",
    });

    new TerraformOutput(this, "nat-gateway-ip", {
      value: vpcModule.natGateway.publicIp,
      description: "NAT Gateway Public IP",
    });
  }
}
```

## Key Features Implemented

### 🔒 **Security**
- **IAM Roles**: EC2 uses IAM roles instead of hardcoded keys
- **Least Privilege**: Minimal permissions for S3 access
- **Security Groups**: Restrictive inbound/outbound rules
- **Encryption**: KMS encryption for S3, RDS, and CloudTrail
- **Private Networking**: EC2 in private subnet, RDS in isolated subnet

### 🌐 **Networking**
- **VPC**: Custom VPC with proper CIDR allocation
- **Three-tier Architecture**: Public, private, and isolated subnets
- **NAT Gateway**: Enables internet access for private subnet
- **Route Tables**: Proper routing configuration

### 💾 **Storage & Database**
- **S3**: Versioning, encryption, and public access blocking
- **RDS MySQL**: Multi-AZ, automated backups, encryption at rest
- **KMS Keys**: Separate keys for different services

### 📊 **Monitoring**
- **CloudTrail**: Multi-region trail with encryption
- **Logging**: S3 bucket for CloudTrail logs with proper permissions

### 🏗️ **Infrastructure**
- **Modular Design**: Reusable components in separate modules
- **Production Ready**: Follows AWS best practices
- **High Availability**: Multi-AZ RDS deployment
- **Scalable**: Designed for production workloads

## Deployment Instructions

1. **Install Dependencies**:
   ```bash
   npm install cdktf @cdktf/provider-aws constructs
   ```

2. **Initialize CDKTF**:
   ```bash
   cdktf init --template=typescript
   ```

3. **Replace generated files** with the provided `lib/tap-stack.ts` and `lib/modules.ts`

4. **Deploy**:
   ```bash
   cdktf deploy
   ```

This implementation provides a secure, scalable, and production-ready AWS infrastructure that meets all your requirements while following AWS best practices for security, monitoring, and high availability.