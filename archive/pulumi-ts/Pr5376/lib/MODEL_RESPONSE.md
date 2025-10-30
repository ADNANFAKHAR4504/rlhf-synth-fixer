# AWS Environment Migration Infrastructure - Pulumi TypeScript Implementation

I'll create a comprehensive Pulumi TypeScript solution for migrating your development environment with enhanced security configurations.

## File: lib/index.ts

```typescript
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// Get configuration
const config = new pulumi.Config();
const environmentSuffix = config.require("environmentSuffix");
const region = aws.config.region || "us-east-1";

// Get current date for tagging
const migrationDate = new Date().toISOString().split('T')[0];

// Common tags for all resources
const commonTags = {
    Environment: "dev",
    MigrationDate: migrationDate,
};

// VPC Configuration
const vpc = new aws.ec2.Vpc(`migration-vpc-${environmentSuffix}`, {
    cidrBlock: "10.0.0.0/16",
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
        ...commonTags,
        Name: `migration-vpc-${environmentSuffix}`,
    },
});

// Get availability zones
const availabilityZones = aws.getAvailabilityZonesOutput({
    state: "available",
});

// Public Subnets (for NAT Gateway)
const publicSubnet1 = new aws.ec2.Subnet(`public-subnet-1-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    availabilityZone: availabilityZones.names[0],
    mapPublicIpOnLaunch: true,
    tags: {
        ...commonTags,
        Name: `public-subnet-1-${environmentSuffix}`,
        Type: "public",
    },
});

const publicSubnet2 = new aws.ec2.Subnet(`public-subnet-2-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.2.0/24",
    availabilityZone: availabilityZones.names[1],
    mapPublicIpOnLaunch: true,
    tags: {
        ...commonTags,
        Name: `public-subnet-2-${environmentSuffix}`,
        Type: "public",
    },
});

// Private Subnets (for RDS and EC2)
const privateSubnet1 = new aws.ec2.Subnet(`private-subnet-1-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.11.0/24",
    availabilityZone: availabilityZones.names[0],
    tags: {
        ...commonTags,
        Name: `private-subnet-1-${environmentSuffix}`,
        Type: "private",
    },
});

const privateSubnet2 = new aws.ec2.Subnet(`private-subnet-2-${environmentSuffix}`, {
    vpcId: vpc.id,
    cidrBlock: "10.0.12.0/24",
    availabilityZone: availabilityZones.names[1],
    tags: {
        ...commonTags,
        Name: `private-subnet-2-${environmentSuffix}`,
        Type: "private",
    },
});

// Internet Gateway
const igw = new aws.ec2.InternetGateway(`migration-igw-${environmentSuffix}`, {
    vpcId: vpc.id,
    tags: {
        ...commonTags,
        Name: `migration-igw-${environmentSuffix}`,
    },
});

// Elastic IP for NAT Gateway
const natEip = new aws.ec2.Eip(`nat-eip-${environmentSuffix}`, {
    domain: "vpc",
    tags: {
        ...commonTags,
        Name: `nat-eip-${environmentSuffix}`,
    },
}, { dependsOn: [igw] });

// NAT Gateway in first public subnet
const natGateway = new aws.ec2.NatGateway(`nat-gateway-${environmentSuffix}`, {
    subnetId: publicSubnet1.id,
    allocationId: natEip.id,
    tags: {
        ...commonTags,
        Name: `nat-gateway-${environmentSuffix}`,
    },
}, { dependsOn: [igw] });

// Route Table for Public Subnets
const publicRouteTable = new aws.ec2.RouteTable(`public-rt-${environmentSuffix}`, {
    vpcId: vpc.id,
    tags: {
        ...commonTags,
        Name: `public-rt-${environmentSuffix}`,
    },
});

const publicRoute = new aws.ec2.Route(`public-route-${environmentSuffix}`, {
    routeTableId: publicRouteTable.id,
    destinationCidrBlock: "0.0.0.0/0",
    gatewayId: igw.id,
});

const publicRtAssoc1 = new aws.ec2.RouteTableAssociation(`public-rt-assoc-1-${environmentSuffix}`, {
    subnetId: publicSubnet1.id,
    routeTableId: publicRouteTable.id,
});

const publicRtAssoc2 = new aws.ec2.RouteTableAssociation(`public-rt-assoc-2-${environmentSuffix}`, {
    subnetId: publicSubnet2.id,
    routeTableId: publicRouteTable.id,
});

// Route Table for Private Subnets
const privateRouteTable = new aws.ec2.RouteTable(`private-rt-${environmentSuffix}`, {
    vpcId: vpc.id,
    tags: {
        ...commonTags,
        Name: `private-rt-${environmentSuffix}`,
    },
});

const privateRoute = new aws.ec2.Route(`private-route-${environmentSuffix}`, {
    routeTableId: privateRouteTable.id,
    destinationCidrBlock: "0.0.0.0/0",
    natGatewayId: natGateway.id,
});

const privateRtAssoc1 = new aws.ec2.RouteTableAssociation(`private-rt-assoc-1-${environmentSuffix}`, {
    subnetId: privateSubnet1.id,
    routeTableId: privateRouteTable.id,
});

const privateRtAssoc2 = new aws.ec2.RouteTableAssociation(`private-rt-assoc-2-${environmentSuffix}`, {
    subnetId: privateSubnet2.id,
    routeTableId: privateRouteTable.id,
});

// VPC Endpoint for S3 (Gateway type)
const s3VpcEndpoint = new aws.ec2.VpcEndpoint(`s3-endpoint-${environmentSuffix}`, {
    vpcId: vpc.id,
    serviceName: `com.amazonaws.${region}.s3`,
    vpcEndpointType: "Gateway",
    routeTableIds: [privateRouteTable.id],
    tags: {
        ...commonTags,
        Name: `s3-endpoint-${environmentSuffix}`,
    },
});

// Security Group for EC2 Instances
const ec2SecurityGroup = new aws.ec2.SecurityGroup(`ec2-sg-${environmentSuffix}`, {
    name: `ec2-sg-${environmentSuffix}`,
    description: "Security group for EC2 application instances",
    vpcId: vpc.id,
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
        description: "Allow all outbound traffic",
    }],
    tags: {
        ...commonTags,
        Name: `ec2-sg-${environmentSuffix}`,
    },
});

// Security Group for RDS
const rdsSecurityGroup = new aws.ec2.SecurityGroup(`rds-sg-${environmentSuffix}`, {
    name: `rds-sg-${environmentSuffix}`,
    description: "Security group for RDS MySQL instance",
    vpcId: vpc.id,
    ingress: [{
        protocol: "tcp",
        fromPort: 3306,
        toPort: 3306,
        securityGroups: [ec2SecurityGroup.id],
        description: "Allow MySQL traffic from EC2 instances",
    }],
    egress: [{
        protocol: "-1",
        fromPort: 0,
        toPort: 0,
        cidrBlocks: ["0.0.0.0/0"],
        description: "Allow all outbound traffic",
    }],
    tags: {
        ...commonTags,
        Name: `rds-sg-${environmentSuffix}`,
    },
});

// DB Subnet Group
const dbSubnetGroup = new aws.rds.SubnetGroup(`db-subnet-group-${environmentSuffix}`, {
    name: `db-subnet-group-${environmentSuffix}`,
    subnetIds: [privateSubnet1.id, privateSubnet2.id],
    tags: {
        ...commonTags,
        Name: `db-subnet-group-${environmentSuffix}`,
    },
});

// RDS MySQL Instance
const rdsInstance = new aws.rds.Instance(`migration-db-${environmentSuffix}`, {
    identifier: `migration-db-${environmentSuffix}`,
    engine: "mysql",
    engineVersion: "8.0",
    instanceClass: "db.t3.micro",
    allocatedStorage: 20,
    storageType: "gp2",
    storageEncrypted: true,
    dbSubnetGroupName: dbSubnetGroup.name,
    vpcSecurityGroupIds: [rdsSecurityGroup.id],
    dbName: "migrationdb",
    username: "admin",
    password: config.requireSecret("dbPassword"),
    backupRetentionPeriod: 7,
    skipFinalSnapshot: true,
    publiclyAccessible: false,
    tags: {
        ...commonTags,
        Name: `migration-db-${environmentSuffix}`,
    },
});

// IAM Role for EC2 Instances
const ec2Role = new aws.iam.Role(`ec2-role-${environmentSuffix}`, {
    name: `ec2-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: {
                Service: "ec2.amazonaws.com",
            },
            Action: "sts:AssumeRole",
        }],
    }),
    tags: {
        ...commonTags,
        Name: `ec2-role-${environmentSuffix}`,
    },
});

// S3 Bucket for migration
const migrationBucket = new aws.s3.Bucket(`migration-bucket-${environmentSuffix}`, {
    bucket: `migration-bucket-${environmentSuffix}`,
    versioning: {
        enabled: true,
    },
    serverSideEncryptionConfiguration: {
        rule: {
            applyServerSideEncryptionByDefault: {
                sseAlgorithm: "AES256",
            },
        },
    },
    tags: {
        ...commonTags,
        Name: `migration-bucket-${environmentSuffix}`,
    },
});

// IAM Policy for EC2 S3 Access
const ec2S3Policy = new aws.iam.RolePolicy(`ec2-s3-policy-${environmentSuffix}`, {
    name: `ec2-s3-policy-${environmentSuffix}`,
    role: ec2Role.id,
    policy: migrationBucket.arn.apply(bucketArn => JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Action: [
                "s3:GetObject",
                "s3:PutObject",
                "s3:ListBucket",
            ],
            Resource: [
                bucketArn,
                `${bucketArn}/*`,
            ],
        }],
    })),
});

// IAM Instance Profile
const ec2InstanceProfile = new aws.iam.InstanceProfile(`ec2-instance-profile-${environmentSuffix}`, {
    name: `ec2-instance-profile-${environmentSuffix}`,
    role: ec2Role.name,
});

// Get latest Amazon Linux 2 AMI
const amiId = aws.ec2.getAmiOutput({
    mostRecent: true,
    owners: ["amazon"],
    filters: [
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

// EC2 Instance 1
const ec2Instance1 = new aws.ec2.Instance(`app-instance-1-${environmentSuffix}`, {
    ami: amiId.id,
    instanceType: "t3.medium",
    subnetId: privateSubnet1.id,
    vpcSecurityGroupIds: [ec2SecurityGroup.id],
    iamInstanceProfile: ec2InstanceProfile.name,
    associatePublicIpAddress: false,
    tags: {
        ...commonTags,
        Name: `app-instance-1-${environmentSuffix}`,
    },
});

// EC2 Instance 2
const ec2Instance2 = new aws.ec2.Instance(`app-instance-2-${environmentSuffix}`, {
    ami: amiId.id,
    instanceType: "t3.medium",
    subnetId: privateSubnet2.id,
    vpcSecurityGroupIds: [ec2SecurityGroup.id],
    iamInstanceProfile: ec2InstanceProfile.name,
    associatePublicIpAddress: false,
    tags: {
        ...commonTags,
        Name: `app-instance-2-${environmentSuffix}`,
    },
});

// IAM Role for S3 Replication
const replicationRole = new aws.iam.Role(`s3-replication-role-${environmentSuffix}`, {
    name: `s3-replication-role-${environmentSuffix}`,
    assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: {
                Service: "s3.amazonaws.com",
            },
            Action: "sts:AssumeRole",
        }],
    }),
    tags: {
        ...commonTags,
        Name: `s3-replication-role-${environmentSuffix}`,
    },
});

// Replication Policy
const replicationPolicy = new aws.iam.RolePolicy(`s3-replication-policy-${environmentSuffix}`, {
    name: `s3-replication-policy-${environmentSuffix}`,
    role: replicationRole.id,
    policy: migrationBucket.arn.apply(bucketArn => JSON.stringify({
        Version: "2012-10-17",
        Statement: [
            {
                Effect: "Allow",
                Action: [
                    "s3:GetReplicationConfiguration",
                    "s3:ListBucket",
                ],
                Resource: bucketArn,
            },
            {
                Effect: "Allow",
                Action: [
                    "s3:GetObjectVersionForReplication",
                    "s3:GetObjectVersionAcl",
                ],
                Resource: `${bucketArn}/*`,
            },
            {
                Effect: "Allow",
                Action: [
                    "s3:ReplicateObject",
                    "s3:ReplicateDelete",
                ],
                Resource: `${bucketArn}/*`,
            },
        ],
    })),
});

// Exports
export const vpcId = vpc.id;
export const publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];
export const privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];
export const rdsEndpoint = rdsInstance.endpoint;
export const rdsAddress = rdsInstance.address;
export const ec2Instance1PrivateIp = ec2Instance1.privateIp;
export const ec2Instance2PrivateIp = ec2Instance2.privateIp;
export const s3BucketName = migrationBucket.bucket;
export const s3BucketArn = migrationBucket.arn;
export const natGatewayPublicIp = natEip.publicIp;
export const s3VpcEndpointId = s3VpcEndpoint.id;
```

## File: lib/Pulumi.yaml

```yaml
name: migration-infrastructure
runtime: nodejs
description: AWS Environment Migration Infrastructure with Pulumi TypeScript
config:
  aws:region:
    description: AWS region for deployment
    default: us-east-1
  environmentSuffix:
    description: Environment suffix for resource naming
```

## File: lib/Pulumi.dev.yaml

```yaml
config:
  migration-infrastructure:environmentSuffix: dev
  migration-infrastructure:dbPassword:
    secure: AAABAMm7p8xC5JvZ9...
```

## Implementation Notes

This Pulumi TypeScript implementation provides:

1. **Complete VPC setup** with public and private subnets across 2 AZs
2. **RDS MySQL 8.0** in private subnets with encryption and automated backups
3. **Two EC2 instances** (t3.medium) in separate AZs without public IPs
4. **Security groups** with least-privilege access (RDS only accessible from EC2)
5. **S3 bucket** with versioning and AES256 encryption
6. **VPC endpoint** for S3 to keep traffic within AWS network
7. **IAM roles** for EC2 S3 access and replication
8. **Proper tagging** with Environment and MigrationDate
9. **Complete exports** for all required outputs

All resources include the `environmentSuffix` in their names and are fully destroyable with `skipFinalSnapshot: true` on RDS.

For database snapshot import from source account, you would use AWS CLI or console to share the snapshot with the target account, then modify the RDS resource to use `snapshotIdentifier` instead of creating a new database.

The S3 replication configuration would need to be set up via the AWS console or CLI after both source and destination buckets are ready, as it requires the source bucket information.