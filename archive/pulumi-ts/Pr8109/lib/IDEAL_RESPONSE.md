# AWS Environment Migration Infrastructure - Pulumi TypeScript Implementation

This repository provides a comprehensive Pulumi TypeScript solution for migrating your development environment to AWS with enhanced security configurations.

## Architecture Overview

The infrastructure creates a complete VPC environment with the following components:

- **VPC**: 10.0.0.0/16 CIDR block with DNS support and hostnames enabled
- **Public Subnets**: 2 subnets (10.0.1.0/24, 10.0.2.0/24) across 2 availability zones
- **Private Subnets**: 2 subnets (10.0.11.0/24, 10.0.12.0/24) across 2 availability zones
- **Internet Gateway**: Provides internet connectivity for public subnets
- **NAT Gateway**: Enables internet access for resources in private subnets
- **VPC Endpoint**: Gateway endpoint for S3 to avoid internet traffic for S3 access
- **Security Groups**:
  - EC2 Security Group with all egress allowed
  - RDS Security Group allowing MySQL (3306) only from EC2 security group
- **RDS MySQL Instance**:
  - Engine: MySQL 8.0 (db.t3.micro)
  - Storage encryption enabled
  - Multi-AZ subnet group
  - 7-day automated backup retention
  - Not publicly accessible
- **EC2 Instances**:
  - 2 x t3.medium instances running Amazon Linux 2
  - Deployed in separate private subnets for high availability
  - IAM instance profile with S3 permissions
  - No public IP addresses
- **S3 Bucket**:
  - Versioning enabled
  - Server-side encryption (AES256)
  - IAM roles for EC2 access and replication
- **IAM Configuration**:
  - EC2 role with least-privilege S3 permissions
  - Instance profile for EC2
  - S3 replication role

## File: lib/index.ts

Complete implementation of the migration infrastructure:

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// Get configuration
const config = new pulumi.Config();
// Use environment variable, then Pulumi config, then default to 'dev'
const environmentSuffix =
  process.env.ENVIRONMENT_SUFFIX || config.get('environmentSuffix') || 'dev';
const region = aws.config.region || 'us-east-1';

// Detect LocalStack mode - RDS is not supported in LocalStack Community Edition
const isLocalStack =
  environmentSuffix === 'localstack' ||
  !!process.env.AWS_ENDPOINT_URL ||
  !!process.env.LOCALSTACK_HOSTNAME;

// Get current date for tagging
const migrationDate = new Date().toISOString().split('T')[0];

// Common tags for all resources
const commonTags = {
  Environment: 'dev',
  MigrationDate: migrationDate,
};

// VPC Configuration
const vpc = new aws.ec2.Vpc(`migration-vpc-${environmentSuffix}`, {
  cidrBlock: '10.0.0.0/16',
  enableDnsHostnames: true,
  enableDnsSupport: true,
  tags: {
    ...commonTags,
    Name: `migration-vpc-${environmentSuffix}`,
  },
});

// Get availability zones
const availabilityZones = aws.getAvailabilityZonesOutput({
  state: 'available',
});

// Public Subnets (for NAT Gateway)
const publicSubnet1 = new aws.ec2.Subnet(
  `public-subnet-1-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.1.0/24',
    availabilityZone: availabilityZones.names[0],
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: `public-subnet-1-${environmentSuffix}`,
      Type: 'public',
    },
  }
);

const publicSubnet2 = new aws.ec2.Subnet(
  `public-subnet-2-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.2.0/24',
    availabilityZone: availabilityZones.names[1],
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: `public-subnet-2-${environmentSuffix}`,
      Type: 'public',
    },
  }
);

// Private Subnets (for RDS and EC2)
const privateSubnet1 = new aws.ec2.Subnet(
  `private-subnet-1-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.11.0/24',
    availabilityZone: availabilityZones.names[0],
    tags: {
      ...commonTags,
      Name: `private-subnet-1-${environmentSuffix}`,
      Type: 'private',
    },
  }
);

const privateSubnet2 = new aws.ec2.Subnet(
  `private-subnet-2-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.12.0/24',
    availabilityZone: availabilityZones.names[1],
    tags: {
      ...commonTags,
      Name: `private-subnet-2-${environmentSuffix}`,
      Type: 'private',
    },
  }
);

// Internet Gateway
const igw = new aws.ec2.InternetGateway(`migration-igw-${environmentSuffix}`, {
  vpcId: vpc.id,
  tags: {
    ...commonTags,
    Name: `migration-igw-${environmentSuffix}`,
  },
});

// Elastic IP for NAT Gateway
const natEip = new aws.ec2.Eip(
  `nat-eip-${environmentSuffix}`,
  {
    domain: 'vpc',
    tags: {
      ...commonTags,
      Name: `nat-eip-${environmentSuffix}`,
    },
  },
  { dependsOn: [igw] }
);

// NAT Gateway in first public subnet
const natGateway = new aws.ec2.NatGateway(
  `nat-gateway-${environmentSuffix}`,
  {
    subnetId: publicSubnet1.id,
    allocationId: natEip.id,
    tags: {
      ...commonTags,
      Name: `nat-gateway-${environmentSuffix}`,
    },
  },
  { dependsOn: [igw] }
);

// Route Table for Public Subnets
const publicRouteTable = new aws.ec2.RouteTable(
  `public-rt-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: `public-rt-${environmentSuffix}`,
    },
  }
);

const _publicRoute = new aws.ec2.Route(`public-route-${environmentSuffix}`, {
  routeTableId: publicRouteTable.id,
  destinationCidrBlock: '0.0.0.0/0',
  gatewayId: igw.id,
});

const _publicRtAssoc1 = new aws.ec2.RouteTableAssociation(
  `public-rt-assoc-1-${environmentSuffix}`,
  {
    subnetId: publicSubnet1.id,
    routeTableId: publicRouteTable.id,
  }
);

const _publicRtAssoc2 = new aws.ec2.RouteTableAssociation(
  `public-rt-assoc-2-${environmentSuffix}`,
  {
    subnetId: publicSubnet2.id,
    routeTableId: publicRouteTable.id,
  }
);

// Route Table for Private Subnets
const privateRouteTable = new aws.ec2.RouteTable(
  `private-rt-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: `private-rt-${environmentSuffix}`,
    },
  }
);

const _privateRoute = new aws.ec2.Route(`private-route-${environmentSuffix}`, {
  routeTableId: privateRouteTable.id,
  destinationCidrBlock: '0.0.0.0/0',
  natGatewayId: natGateway.id,
});

const _privateRtAssoc1 = new aws.ec2.RouteTableAssociation(
  `private-rt-assoc-1-${environmentSuffix}`,
  {
    subnetId: privateSubnet1.id,
    routeTableId: privateRouteTable.id,
  }
);

const _privateRtAssoc2 = new aws.ec2.RouteTableAssociation(
  `private-rt-assoc-2-${environmentSuffix}`,
  {
    subnetId: privateSubnet2.id,
    routeTableId: privateRouteTable.id,
  }
);

// VPC Endpoint for S3 (Gateway type)
const s3VpcEndpoint = new aws.ec2.VpcEndpoint(
  `s3-endpoint-${environmentSuffix}`,
  {
    vpcId: vpc.id,
    serviceName: `com.amazonaws.${region}.s3`,
    vpcEndpointType: 'Gateway',
    routeTableIds: [privateRouteTable.id],
    tags: {
      ...commonTags,
      Name: `s3-endpoint-${environmentSuffix}`,
    },
  }
);

// Security Group for EC2 Instances
const ec2SecurityGroup = new aws.ec2.SecurityGroup(
  `ec2-sg-${environmentSuffix}`,
  {
    name: `ec2-sg-${environmentSuffix}`,
    description: 'Security group for EC2 application instances',
    vpcId: vpc.id,
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic',
      },
    ],
    tags: {
      ...commonTags,
      Name: `ec2-sg-${environmentSuffix}`,
    },
  }
);

// Security Group for RDS
const rdsSecurityGroup = new aws.ec2.SecurityGroup(
  `rds-sg-${environmentSuffix}`,
  {
    name: `rds-sg-${environmentSuffix}`,
    description: 'Security group for RDS MySQL instance',
    vpcId: vpc.id,
    ingress: [
      {
        protocol: 'tcp',
        fromPort: 3306,
        toPort: 3306,
        securityGroups: [ec2SecurityGroup.id],
        description: 'Allow MySQL traffic from EC2 instances',
      },
    ],
    egress: [
      {
        protocol: '-1',
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ['0.0.0.0/0'],
        description: 'Allow all outbound traffic',
      },
    ],
    tags: {
      ...commonTags,
      Name: `rds-sg-${environmentSuffix}`,
    },
  }
);

// RDS resources - only create when NOT running on LocalStack
// LocalStack Community Edition does not support RDS
let dbSubnetGroup: aws.rds.SubnetGroup | undefined;
let rdsInstance: aws.rds.Instance | undefined;

if (!isLocalStack) {
  // DB Subnet Group
  dbSubnetGroup = new aws.rds.SubnetGroup(
    `db-subnet-group-${environmentSuffix}`,
    {
      name: `db-subnet-group-${environmentSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      tags: {
        ...commonTags,
        Name: `db-subnet-group-${environmentSuffix}`,
      },
    }
  );

  // RDS MySQL Instance
  rdsInstance = new aws.rds.Instance(`migration-db-${environmentSuffix}`, {
    identifier: `migration-db-${environmentSuffix}`,
    engine: 'mysql',
    engineVersion: '8.0',
    instanceClass: 'db.t3.micro',
    allocatedStorage: 20,
    storageType: 'gp2',
    storageEncrypted: true,
    dbSubnetGroupName: dbSubnetGroup.name,
    vpcSecurityGroupIds: [rdsSecurityGroup.id],
    dbName: 'migrationdb',
    username: 'admin',
    password: config.requireSecret('dbPassword'),
    backupRetentionPeriod: 7,
    skipFinalSnapshot: true,
    publiclyAccessible: false,
    tags: {
      ...commonTags,
      Name: `migration-db-${environmentSuffix}`,
    },
  });
} else {
  pulumi.log.info(
    'Skipping RDS resources - LocalStack Community Edition does not support RDS'
  );
}

// IAM Role for EC2 Instances
const ec2Role = new aws.iam.Role(`ec2-role-${environmentSuffix}`, {
  name: `ec2-role-${environmentSuffix}`,
  assumeRolePolicy: JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: {
          Service: 'ec2.amazonaws.com',
        },
        Action: 'sts:AssumeRole',
      },
    ],
  }),
  tags: {
    ...commonTags,
    Name: `ec2-role-${environmentSuffix}`,
  },
});

// S3 Bucket for migration
const migrationBucket = new aws.s3.Bucket(
  `migration-bucket-${environmentSuffix}`,
  {
    bucket: `migration-bucket-${environmentSuffix}`,
    versioning: {
      enabled: true,
    },
    serverSideEncryptionConfiguration: {
      rule: {
        applyServerSideEncryptionByDefault: {
          sseAlgorithm: 'AES256',
        },
      },
    },
    tags: {
      ...commonTags,
      Name: `migration-bucket-${environmentSuffix}`,
    },
  }
);

// IAM Policy for EC2 S3 Access
const _ec2S3Policy = new aws.iam.RolePolicy(
  `ec2-s3-policy-${environmentSuffix}`,
  {
    name: `ec2-s3-policy-${environmentSuffix}`,
    role: ec2Role.id,
    policy: migrationBucket.arn.apply(bucketArn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
            Resource: [bucketArn, `${bucketArn}/*`],
          },
        ],
      })
    ),
  }
);

// IAM Instance Profile
const ec2InstanceProfile = new aws.iam.InstanceProfile(
  `ec2-instance-profile-${environmentSuffix}`,
  {
    name: `ec2-instance-profile-${environmentSuffix}`,
    role: ec2Role.name,
  }
);

// Get latest Amazon Linux 2 AMI
const amiId = aws.ec2.getAmiOutput({
  mostRecent: true,
  owners: ['amazon'],
  filters: [
    {
      name: 'name',
      values: ['amzn2-ami-hvm-*-x86_64-gp2'],
    },
    {
      name: 'virtualization-type',
      values: ['hvm'],
    },
  ],
});

// EC2 Instance 1
const ec2Instance1 = new aws.ec2.Instance(
  `app-instance-1-${environmentSuffix}`,
  {
    ami: amiId.id,
    instanceType: 't3.medium',
    subnetId: privateSubnet1.id,
    vpcSecurityGroupIds: [ec2SecurityGroup.id],
    iamInstanceProfile: ec2InstanceProfile.name,
    associatePublicIpAddress: false,
    tags: {
      ...commonTags,
      Name: `app-instance-1-${environmentSuffix}`,
    },
  }
);

// EC2 Instance 2
const ec2Instance2 = new aws.ec2.Instance(
  `app-instance-2-${environmentSuffix}`,
  {
    ami: amiId.id,
    instanceType: 't3.medium',
    subnetId: privateSubnet2.id,
    vpcSecurityGroupIds: [ec2SecurityGroup.id],
    iamInstanceProfile: ec2InstanceProfile.name,
    associatePublicIpAddress: false,
    tags: {
      ...commonTags,
      Name: `app-instance-2-${environmentSuffix}`,
    },
  }
);

// IAM Role for S3 Replication
const replicationRole = new aws.iam.Role(
  `s3-replication-role-${environmentSuffix}`,
  {
    name: `s3-replication-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            Service: 's3.amazonaws.com',
          },
          Action: 'sts:AssumeRole',
        },
      ],
    }),
    tags: {
      ...commonTags,
      Name: `s3-replication-role-${environmentSuffix}`,
    },
  }
);

// Replication Policy
const _replicationPolicy = new aws.iam.RolePolicy(
  `s3-replication-policy-${environmentSuffix}`,
  {
    name: `s3-replication-policy-${environmentSuffix}`,
    role: replicationRole.id,
    policy: migrationBucket.arn.apply(bucketArn =>
      JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
            Resource: bucketArn,
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObjectVersionForReplication',
              's3:GetObjectVersionAcl',
            ],
            Resource: `${bucketArn}/*`,
          },
          {
            Effect: 'Allow',
            Action: ['s3:ReplicateObject', 's3:ReplicateDelete'],
            Resource: `${bucketArn}/*`,
          },
        ],
      })
    ),
  }
);

// Exports
export const vpcId = vpc.id;
export const publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];
export const privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];
export const rdsEndpoint =
  rdsInstance?.endpoint ?? pulumi.output('localstack-mock-endpoint');
export const rdsAddress =
  rdsInstance?.address ?? pulumi.output('localstack-mock-address');
export const ec2Instance1PrivateIp = ec2Instance1.privateIp;
export const ec2Instance2PrivateIp = ec2Instance2.privateIp;
export const s3BucketName = migrationBucket.bucket;
export const s3BucketArn = migrationBucket.arn;
export const natGatewayPublicIp = natEip.publicIp;
export const s3VpcEndpointId = s3VpcEndpoint.id;
```

## File: bin/tap.ts

Entry point that imports and re-exports the infrastructure:

```typescript
/**
 * Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.
 *
 * This module imports and re-exports all infrastructure resources from lib/index.ts.
 * The actual infrastructure (VPC, EC2, RDS, S3, IAM) is defined in lib/index.ts.
 */

// Import and re-export all infrastructure resources and outputs from lib/index.ts
export * from '../lib/index';
```

## Configuration

Set the configuration values:

```bash
# Set the environment suffix (optional - can also use ENVIRONMENT_SUFFIX env var)
# Defaults to 'dev' if not set
pulumi config set environmentSuffix <your-suffix>

# Set the database password (required for AWS, not needed for LocalStack)
pulumi config set --secret dbPassword <your-secure-password>

# Set the AWS region (optional, defaults to us-east-1)
pulumi config set aws:region us-east-1
```

The `environmentSuffix` can be provided via:

1. `ENVIRONMENT_SUFFIX` environment variable (highest priority)
2. Pulumi config `environmentSuffix`
3. Default value `'dev'`

## Deployment

Deploy the infrastructure:

```bash
# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up --yes

# View outputs
pulumi stack output
```

## Stack Outputs

The stack exports the following outputs:

- `vpcId`: The ID of the created VPC
- `publicSubnetIds`: Array of public subnet IDs
- `privateSubnetIds`: Array of private subnet IDs
- `rdsEndpoint`: RDS MySQL instance endpoint (with port)
- `rdsAddress`: RDS MySQL instance address (without port)
- `ec2Instance1PrivateIp`: Private IP of first EC2 instance
- `ec2Instance2PrivateIp`: Private IP of second EC2 instance
- `s3BucketName`: Name of the migration S3 bucket
- `s3BucketArn`: ARN of the migration S3 bucket
- `natGatewayPublicIp`: Public IP address of the NAT Gateway
- `s3VpcEndpointId`: ID of the S3 VPC endpoint

## Key Features

1. **High Availability**: Multi-AZ deployment for subnets, EC2 instances, and RDS
2. **Security**:
   - All application resources deployed in private subnets
   - Security groups with least-privilege rules
   - VPC endpoint for S3 to avoid internet traffic
   - No public IP addresses on EC2 instances
3. **Encryption**:
   - Storage encryption enabled for RDS
   - Server-side encryption (AES256) for S3
4. **Backup**: 7-day automated backup retention for RDS
5. **IAM**: Least-privilege policies for EC2 S3 access
6. **Cost Optimization**:
   - db.t3.micro for RDS
   - t3.medium for EC2 instances
7. **Destroyability**:
   - `skipFinalSnapshot: true` for RDS
   - No retention policies blocking deletion
8. **LocalStack Compatibility**:
   - Automatic detection of LocalStack environment
   - RDS resources conditionally skipped (not supported in LocalStack Community Edition)
   - Mock endpoints provided for RDS outputs when running on LocalStack

## Resource Naming

All resources include the `environmentSuffix` parameter in their names:

- Pattern: `{resource-type}-{environmentSuffix}`
- Example: `migration-vpc-dev`, `app-instance-1-dev`
- This enables parallel deployments without conflicts

## Tagging Strategy

All resources are tagged with:

- `Environment`: "dev"
- `MigrationDate`: Current date (YYYY-MM-DD format)
- `Name`: Resource name with environment suffix

## Migration Notes

### Database Snapshot Import

To import an existing RDS snapshot:

1. Share the snapshot from the source account to the target account
2. Modify the RDS resource in `lib/index.ts` to include:
   ```typescript
   snapshotIdentifier: 'shared-snapshot-id',
   ```

### S3 Cross-Account Replication

To set up cross-account replication:

1. Use the replication role ARN in the source bucket configuration
2. Configure replication rules via AWS CLI or Console:
   ```bash
   aws s3api put-bucket-replication \
     --bucket source-bucket \
     --replication-configuration file://replication.json
   ```

## LocalStack Deployment

The infrastructure supports deployment to LocalStack for local testing:

### LocalStack Detection

The code automatically detects LocalStack mode using:

- `environmentSuffix === 'localstack'`
- `AWS_ENDPOINT_URL` environment variable
- `LOCALSTACK_HOSTNAME` environment variable

### LocalStack Limitations

LocalStack Community Edition does not support RDS. When running on LocalStack:

- RDS Subnet Group and RDS Instance are skipped
- Mock endpoints are provided for RDS outputs
- All other resources (VPC, EC2, S3, IAM) are created normally

### LocalStack Configuration

For LocalStack deployments, configuration is handled automatically:

- `AWS_ENDPOINT_URL` environment variable triggers LocalStack mode
- `ENVIRONMENT_SUFFIX` environment variable sets the resource naming suffix
- AWS credentials (`test`/`test`) are set by the CI/CD pipeline
- RDS resources are automatically skipped (not supported in LocalStack Community Edition)

## Cleanup

To destroy all resources:

```bash
pulumi destroy --yes
```

Note: The RDS instance is configured with `skipFinalSnapshot: true`, so it will be deleted without creating a final snapshot.
