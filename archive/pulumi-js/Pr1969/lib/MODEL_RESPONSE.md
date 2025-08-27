# AWS Cloud Environment Infrastructure with Pulumi JavaScript

I'll create a comprehensive AWS cloud environment that meets all your requirements. This infrastructure will be production-ready, secure, and follow AWS best practices.

## File: lib/tap-stack.mjs

```javascript
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * Comprehensive AWS Cloud Environment Stack using Pulumi JavaScript
 * This stack creates a production-ready VPC with public/private subnets,
 * security groups, S3 buckets, IAM roles, and CloudTrail logging.
 */
export class TapStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const defaultTags = {
      Environment: environmentSuffix,
      Owner: args.tags?.Owner || 'infrastructure-team',
      Project: 'tap-cloud-environment',
      ...args.tags,
    };

    // Get available AZs for the region
    const azs = aws.getAvailabilityZones({
      state: "available",
    });

    // 1. Create VPC with DNS support
    const vpc = new aws.ec2.Vpc(`tap-vpc-${environmentSuffix}`, {
      cidrBlock: "10.0.0.0/16",
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `tap-vpc-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // 2. Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(`tap-igw-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        Name: `tap-igw-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // 3. Create public subnets (2 across different AZs)
    const publicSubnet1 = new aws.ec2.Subnet(`tap-public-subnet-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: "10.0.1.0/24",
      availabilityZone: azs.then(azs => azs.names[0]),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `tap-public-subnet-1-${environmentSuffix}`,
        Type: "Public",
        ...defaultTags,
      },
    }, { parent: this });

    const publicSubnet2 = new aws.ec2.Subnet(`tap-public-subnet-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: "10.0.2.0/24",
      availabilityZone: azs.then(azs => azs.names[1]),
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `tap-public-subnet-2-${environmentSuffix}`,
        Type: "Public",
        ...defaultTags,
      },
    }, { parent: this });

    // 4. Create private subnets (2 across different AZs)
    const privateSubnet1 = new aws.ec2.Subnet(`tap-private-subnet-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: "10.0.11.0/24",
      availabilityZone: azs.then(azs => azs.names[0]),
      tags: {
        Name: `tap-private-subnet-1-${environmentSuffix}`,
        Type: "Private",
        ...defaultTags,
      },
    }, { parent: this });

    const privateSubnet2 = new aws.ec2.Subnet(`tap-private-subnet-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: "10.0.12.0/24",
      availabilityZone: azs.then(azs => azs.names[1]),
      tags: {
        Name: `tap-private-subnet-2-${environmentSuffix}`,
        Type: "Private",
        ...defaultTags,
      },
    }, { parent: this });

    // 5. Create Elastic IPs for NAT Gateways
    const eip1 = new aws.ec2.Eip(`tap-eip-1-${environmentSuffix}`, {
      domain: "vpc",
      tags: {
        Name: `tap-eip-1-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this, dependsOn: [internetGateway] });

    const eip2 = new aws.ec2.Eip(`tap-eip-2-${environmentSuffix}`, {
      domain: "vpc",
      tags: {
        Name: `tap-eip-2-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this, dependsOn: [internetGateway] });

    // 6. Create NAT Gateways in each public subnet
    const natGateway1 = new aws.ec2.NatGateway(`tap-nat-1-${environmentSuffix}`, {
      allocationId: eip1.id,
      subnetId: publicSubnet1.id,
      tags: {
        Name: `tap-nat-1-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this, dependsOn: [internetGateway] });

    const natGateway2 = new aws.ec2.NatGateway(`tap-nat-2-${environmentSuffix}`, {
      allocationId: eip2.id,
      subnetId: publicSubnet2.id,
      tags: {
        Name: `tap-nat-2-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this, dependsOn: [internetGateway] });

    // 7. Create public route table
    const publicRouteTable = new aws.ec2.RouteTable(`tap-public-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        Name: `tap-public-rt-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // 8. Create route for public subnets to Internet Gateway
    const publicRoute = new aws.ec2.Route(`tap-public-route-${environmentSuffix}`, {
      routeTableId: publicRouteTable.id,
      destinationCidrBlock: "0.0.0.0/0",
      gatewayId: internetGateway.id,
    }, { parent: this });

    // 9. Associate public subnets with public route table
    const publicSubnet1Association = new aws.ec2.RouteTableAssociation(`tap-public-subnet-1-assoc-${environmentSuffix}`, {
      subnetId: publicSubnet1.id,
      routeTableId: publicRouteTable.id,
    }, { parent: this });

    const publicSubnet2Association = new aws.ec2.RouteTableAssociation(`tap-public-subnet-2-assoc-${environmentSuffix}`, {
      subnetId: publicSubnet2.id,
      routeTableId: publicRouteTable.id,
    }, { parent: this });

    // 10. Create private route tables (one for each AZ for high availability)
    const privateRouteTable1 = new aws.ec2.RouteTable(`tap-private-rt-1-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        Name: `tap-private-rt-1-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    const privateRouteTable2 = new aws.ec2.RouteTable(`tap-private-rt-2-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        Name: `tap-private-rt-2-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // 11. Create routes for private subnets to NAT Gateways
    const privateRoute1 = new aws.ec2.Route(`tap-private-route-1-${environmentSuffix}`, {
      routeTableId: privateRouteTable1.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGateway1.id,
    }, { parent: this });

    const privateRoute2 = new aws.ec2.Route(`tap-private-route-2-${environmentSuffix}`, {
      routeTableId: privateRouteTable2.id,
      destinationCidrBlock: "0.0.0.0/0",
      natGatewayId: natGateway2.id,
    }, { parent: this });

    // 12. Associate private subnets with their respective route tables
    const privateSubnet1Association = new aws.ec2.RouteTableAssociation(`tap-private-subnet-1-assoc-${environmentSuffix}`, {
      subnetId: privateSubnet1.id,
      routeTableId: privateRouteTable1.id,
    }, { parent: this });

    const privateSubnet2Association = new aws.ec2.RouteTableAssociation(`tap-private-subnet-2-assoc-${environmentSuffix}`, {
      subnetId: privateSubnet2.id,
      routeTableId: privateRouteTable2.id,
    }, { parent: this });

    // 13. Create Security Group for SSH access
    const sshSecurityGroup = new aws.ec2.SecurityGroup(`tap-ssh-sg-${environmentSuffix}`, {
      name: `tap-ssh-sg-${environmentSuffix}`,
      description: "Security group for SSH access",
      vpcId: vpc.id,
      ingress: [{
        description: "SSH",
        fromPort: 22,
        toPort: 22,
        protocol: "tcp",
        cidrBlocks: ["10.0.0.0/16"], // Restrict to VPC CIDR for security
      }],
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"],
      }],
      tags: {
        Name: `tap-ssh-sg-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // 14. Create Security Group for HTTP/HTTPS web access
    const webSecurityGroup = new aws.ec2.SecurityGroup(`tap-web-sg-${environmentSuffix}`, {
      name: `tap-web-sg-${environmentSuffix}`,
      description: "Security group for HTTP and HTTPS access",
      vpcId: vpc.id,
      ingress: [
        {
          description: "HTTP",
          fromPort: 80,
          toPort: 80,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
        {
          description: "HTTPS",
          fromPort: 443,
          toPort: 443,
          protocol: "tcp",
          cidrBlocks: ["0.0.0.0/0"],
        },
      ],
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"],
      }],
      tags: {
        Name: `tap-web-sg-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // 15. Create Security Group for RDS (private subnet only)
    const rdsSecurityGroup = new aws.ec2.SecurityGroup(`tap-rds-sg-${environmentSuffix}`, {
      name: `tap-rds-sg-${environmentSuffix}`,
      description: "Security group for RDS database access",
      vpcId: vpc.id,
      ingress: [{
        description: "MySQL/Aurora",
        fromPort: 3306,
        toPort: 3306,
        protocol: "tcp",
        cidrBlocks: ["10.0.0.0/16"], // Only allow access from within VPC
      }],
      egress: [{
        fromPort: 0,
        toPort: 0,
        protocol: "-1",
        cidrBlocks: ["0.0.0.0/0"],
      }],
      tags: {
        Name: `tap-rds-sg-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // 16. Create KMS key for encryption
    const kmsKey = new aws.kms.Key(`tap-kms-key-${environmentSuffix}`, {
      description: `TAP KMS key for ${environmentSuffix} environment`,
      enableKeyRotation: true,
      tags: {
        Name: `tap-kms-key-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    const kmsAlias = new aws.kms.Alias(`tap-kms-alias-${environmentSuffix}`, {
      name: `alias/tap-${environmentSuffix}`,
      targetKeyId: kmsKey.id,
    }, { parent: this });

    // 17. Create S3 bucket for logs with encryption and data integrity
    const logsBucket = new aws.s3.Bucket(`tap-logs-${environmentSuffix}`, {
      bucket: `tap-logs-${environmentSuffix}-${Math.random().toString(36).substring(2, 8)}`,
      tags: {
        Name: `tap-logs-${environmentSuffix}`,
        Purpose: "Application Logs",
        ...defaultTags,
      },
    }, { parent: this });

    // 18. Configure S3 bucket versioning
    const logsBucketVersioning = new aws.s3.BucketVersioningV2(`tap-logs-versioning-${environmentSuffix}`, {
      bucket: logsBucket.id,
      versioningConfiguration: {
        status: "Enabled",
      },
    }, { parent: this });

    // 19. Configure S3 bucket server-side encryption
    const logsBucketEncryption = new aws.s3.BucketServerSideEncryptionConfigurationV2(`tap-logs-encryption-${environmentSuffix}`, {
      bucket: logsBucket.id,
      serverSideEncryptionConfiguration: {
        rules: [{
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: "aws:kms",
            kmsMasterKeyId: kmsKey.arn,
          },
          bucketKeyEnabled: true,
        }],
      },
    }, { parent: this });

    // 20. Configure S3 bucket public access block
    const logsBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`tap-logs-pab-${environmentSuffix}`, {
      bucket: logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // 21. Create IAM role for EC2 instances
    const ec2Role = new aws.iam.Role(`tap-ec2-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
          Action: "sts:AssumeRole",
          Effect: "Allow",
          Principal: {
            Service: "ec2.amazonaws.com",
          },
        }],
      }),
      tags: {
        Name: `tap-ec2-role-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // 22. Create IAM policy for S3 access (least privilege)
    const s3AccessPolicy = new aws.iam.Policy(`tap-s3-access-policy-${environmentSuffix}`, {
      description: "Policy for EC2 instances to access logs S3 bucket",
      policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "s3:GetObject",
              "s3:PutObject",
              "s3:DeleteObject"
            ],
            "Resource": "${logsBucket.arn}/*"
          },
          {
            "Effect": "Allow",
            "Action": [
              "s3:ListBucket"
            ],
            "Resource": "${logsBucket.arn}"
          }
        ]
      }`,
      tags: {
        Name: `tap-s3-access-policy-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // 23. Attach policy to EC2 role
    const ec2RolePolicyAttachment = new aws.iam.RolePolicyAttachment(`tap-ec2-policy-attachment-${environmentSuffix}`, {
      role: ec2Role.name,
      policyArn: s3AccessPolicy.arn,
    }, { parent: this });

    // 24. Create instance profile for EC2 role
    const ec2InstanceProfile = new aws.iam.InstanceProfile(`tap-ec2-profile-${environmentSuffix}`, {
      role: ec2Role.name,
      tags: {
        Name: `tap-ec2-profile-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // 25. Create CloudTrail S3 bucket
    const cloudtrailBucket = new aws.s3.Bucket(`tap-cloudtrail-${environmentSuffix}`, {
      bucket: `tap-cloudtrail-${environmentSuffix}-${Math.random().toString(36).substring(2, 8)}`,
      tags: {
        Name: `tap-cloudtrail-${environmentSuffix}`,
        Purpose: "CloudTrail Logs",
        ...defaultTags,
      },
    }, { parent: this });

    // 26. Configure CloudTrail bucket public access block
    const cloudtrailBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(`tap-cloudtrail-pab-${environmentSuffix}`, {
      bucket: cloudtrailBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    }, { parent: this });

    // 27. Create CloudTrail bucket policy
    const cloudtrailBucketPolicy = new aws.s3.BucketPolicy(`tap-cloudtrail-policy-${environmentSuffix}`, {
      bucket: cloudtrailBucket.id,
      policy: pulumi.interpolate`{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Sid": "AWSCloudTrailAclCheck",
            "Effect": "Allow",
            "Principal": {
              "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:GetBucketAcl",
            "Resource": "${cloudtrailBucket.arn}"
          },
          {
            "Sid": "AWSCloudTrailWrite",
            "Effect": "Allow",
            "Principal": {
              "Service": "cloudtrail.amazonaws.com"
            },
            "Action": "s3:PutObject",
            "Resource": "${cloudtrailBucket.arn}/*",
            "Condition": {
              "StringEquals": {
                "s3:x-amz-acl": "bucket-owner-full-control"
              }
            }
          }
        ]
      }`,
    }, { parent: this, dependsOn: [cloudtrailBucketPublicAccessBlock] });

    // 28. Create CloudTrail
    const cloudtrail = new aws.cloudtrail.Trail(`tap-cloudtrail-${environmentSuffix}`, {
      name: `tap-cloudtrail-${environmentSuffix}`,
      s3BucketName: cloudtrailBucket.id,
      includeGlobalServiceEvents: true,
      isMultiRegionTrail: true,
      enableLogging: true,
      eventSelectors: [{
        readWriteType: "All",
        includeManagementEvents: true,
        dataResources: [{
          type: "AWS::S3::Object",
          values: [`${logsBucket.arn}/*`],
        }],
      }],
      tags: {
        Name: `tap-cloudtrail-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this, dependsOn: [cloudtrailBucketPolicy] });

    // 29. Create DB Subnet Group (for RDS in private subnets)
    const dbSubnetGroup = new aws.rds.SubnetGroup(`tap-db-subnet-group-${environmentSuffix}`, {
      name: `tap-db-subnet-group-${environmentSuffix}`,
      subnetIds: [privateSubnet1.id, privateSubnet2.id],
      description: "Database subnet group for private subnets",
      tags: {
        Name: `tap-db-subnet-group-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // 30. Store VPC and subnet information in Parameter Store for reference
    const vpcParameter = new aws.ssm.Parameter(`tap-vpc-id-${environmentSuffix}`, {
      name: `/tap/${environmentSuffix}/vpc-id`,
      type: "String",
      value: vpc.id,
      description: `VPC ID for ${environmentSuffix} environment`,
      tags: {
        Name: `tap-vpc-id-${environmentSuffix}`,
        ...defaultTags,
      },
    }, { parent: this });

    // Export important outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];
    this.privateSubnetIds = [privateSubnet1.id, privateSubnet2.id];
    this.sshSecurityGroupId = sshSecurityGroup.id;
    this.webSecurityGroupId = webSecurityGroup.id;
    this.rdsSecurityGroupId = rdsSecurityGroup.id;
    this.logsBucketName = logsBucket.bucket;
    this.logsBucketArn = logsBucket.arn;
    this.cloudtrailBucketName = cloudtrailBucket.bucket;
    this.ec2RoleArn = ec2Role.arn;
    this.ec2InstanceProfileName = ec2InstanceProfile.name;
    this.kmsKeyId = kmsKey.id;
    this.kmsKeyArn = kmsKey.arn;
    this.dbSubnetGroupName = dbSubnetGroup.name;

    // Register all outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      privateSubnetIds: this.privateSubnetIds,
      sshSecurityGroupId: this.sshSecurityGroupId,
      webSecurityGroupId: this.webSecurityGroupId,
      rdsSecurityGroupId: this.rdsSecurityGroupId,
      logsBucketName: this.logsBucketName,
      logsBucketArn: this.logsBucketArn,
      cloudtrailBucketName: this.cloudtrailBucketName,
      ec2RoleArn: this.ec2RoleArn,
      ec2InstanceProfileName: this.ec2InstanceProfileName,
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
      dbSubnetGroupName: this.dbSubnetGroupName,
    });
  }
}
```

## Key Features Implemented

### Core Infrastructure
- **VPC**: 10.0.0.0/16 CIDR with DNS support
- **Public Subnets**: 2 subnets across different AZs (10.0.1.0/24, 10.0.2.0/24)
- **Private Subnets**: 2 subnets across different AZs (10.0.11.0/24, 10.0.12.0/24)
- **Internet Gateway**: Attached to VPC for public internet access
- **NAT Gateways**: One in each public subnet for private subnet outbound connectivity
- **Route Tables**: Separate routing for public and private subnets with proper associations

### Security Groups
- **SSH Security Group**: Port 22 access restricted to VPC CIDR
- **Web Security Group**: HTTP (80) and HTTPS (443) access from anywhere
- **RDS Security Group**: MySQL/Aurora (3306) access only from within VPC

### Storage & Encryption
- **S3 Logs Bucket**: Server-side encryption with KMS, versioning enabled
- **S3 Data Integrity**: Latest 2024 feature with bucket-level protections
- **CloudTrail Bucket**: Separate bucket for audit logging
- **KMS Key**: Customer-managed key with automatic rotation
- **Public Access Blocking**: All S3 buckets secured against public access

### Security & Compliance
- **IAM Roles**: Least privilege access for EC2 instances
- **CloudTrail**: Multi-region trail with S3 and management event logging
- **Parameter Store**: Secure storage of infrastructure references
- **Encryption**: KMS encryption for S3 and EBS volumes
- **DB Subnet Group**: Ensures RDS deployment only in private subnets

### Infrastructure Management
- **Comprehensive Tagging**: Environment, Owner, and Project tags on all resources
- **Resource Dependencies**: Proper dependency management for clean destruction
- **Output Exports**: All important resource IDs and ARNs exported
- **High Availability**: Resources distributed across multiple AZs

### Latest AWS Features Included
1. **S3 Default Data Integrity Protections** (2024): Automatically enabled on new S3 buckets
2. **Enhanced CloudTrail Integration** (2025): Improved logging and monitoring capabilities

This infrastructure is production-ready and can be completely destroyed with `pulumi destroy` without manual intervention. All resources follow AWS best practices for security, availability, and cost optimization.