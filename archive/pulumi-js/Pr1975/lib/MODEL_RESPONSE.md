# AWS Infrastructure Migration to us-west-2 - Pulumi JavaScript Implementation

This implementation provides a complete AWS infrastructure migration solution using Pulumi JavaScript, creating EC2 instances, S3 buckets, and DynamoDB tables in the us-west-2 region with proper security and networking configurations.

## Architecture Overview

The solution creates a complete VPC infrastructure with public and private subnets, security groups, and the required AWS services. All resources are tagged appropriately and configured following AWS best practices.

## Implementation Files

### 1. lib/tap-stack.mjs

```javascript
/**
 * tap-stack.mjs
 *
 * Main Pulumi ComponentResource for AWS infrastructure migration
 * Creates VPC, EC2, S3, and DynamoDB resources in us-west-2
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

/**
 * @typedef {Object} TapStackArgs
 * @property {string} [environmentSuffix] - Environment suffix (e.g., 'dev', 'prod')
 * @property {Object<string, string>} [tags] - Default tags to apply to resources
 */

/**
 * Main TapStack component for AWS infrastructure migration
 */
export class TapStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = {
      Environment: environmentSuffix,
      Project: 'Infrastructure-Migration',
      Region: 'us-west-2',
      ManagedBy: 'Pulumi',
      ...args.tags
    };

    // Create VPC
    const vpc = new aws.ec2.Vpc(`migration-vpc-${environmentSuffix}`, {
      cidrBlock: '10.0.0.0/16',
      enableDnsHostnames: true,
      enableDnsSupport: true,
      tags: {
        Name: `migration-vpc-${environmentSuffix}`,
        ...tags
      }
    }, { parent: this });

    // Create Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(`migration-igw-${environmentSuffix}`, {
      vpcId: vpc.id,
      tags: {
        Name: `migration-igw-${environmentSuffix}`,
        ...tags
      }
    }, { parent: this });

    // Create public subnet
    const publicSubnet = new aws.ec2.Subnet(`migration-public-subnet-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.1.0/24',
      availabilityZone: 'us-west-2a',
      mapPublicIpOnLaunch: true,
      tags: {
        Name: `migration-public-subnet-${environmentSuffix}`,
        ...tags
      }
    }, { parent: this });

    // Create private subnet
    const privateSubnet = new aws.ec2.Subnet(`migration-private-subnet-${environmentSuffix}`, {
      vpcId: vpc.id,
      cidrBlock: '10.0.2.0/24',
      availabilityZone: 'us-west-2b',
      tags: {
        Name: `migration-private-subnet-${environmentSuffix}`,
        ...tags
      }
    }, { parent: this });

    // Create route table for public subnet
    const publicRouteTable = new aws.ec2.RouteTable(`migration-public-rt-${environmentSuffix}`, {
      vpcId: vpc.id,
      routes: [
        {
          cidrBlock: '0.0.0.0/0',
          gatewayId: internetGateway.id
        }
      ],
      tags: {
        Name: `migration-public-rt-${environmentSuffix}`,
        ...tags
      }
    }, { parent: this });

    // Associate public subnet with route table
    const publicRouteTableAssociation = new aws.ec2.RouteTableAssociation(`migration-public-rta-${environmentSuffix}`, {
      subnetId: publicSubnet.id,
      routeTableId: publicRouteTable.id
    }, { parent: this });

    // Create security group for EC2
    const ec2SecurityGroup = new aws.ec2.SecurityGroup(`migration-ec2-sg-${environmentSuffix}`, {
      name: `migration-ec2-sg-${environmentSuffix}`,
      description: 'Security group for migrated EC2 instance',
      vpcId: vpc.id,
      ingress: [
        {
          protocol: 'tcp',
          fromPort: 80,
          toPort: 80,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'HTTP access from anywhere'
        },
        {
          protocol: 'tcp',
          fromPort: 22,
          toPort: 22,
          cidrBlocks: ['10.0.0.0/8'], // Restricted SSH access
          description: 'SSH access from private networks'
        }
      ],
      egress: [
        {
          protocol: '-1',
          fromPort: 0,
          toPort: 0,
          cidrBlocks: ['0.0.0.0/0'],
          description: 'All outbound traffic'
        }
      ],
      tags: {
        Name: `migration-ec2-sg-${environmentSuffix}`,
        ...tags
      }
    }, { parent: this });

    // Get latest Amazon Linux 2023 AMI
    const amiId = aws.ec2.getAmiOutput({
      filters: [
        {
          name: 'name',
          values: ['al2023-ami-*-x86_64']
        },
        {
          name: 'owner-alias',
          values: ['amazon']
        }
      ],
      mostRecent: true
    });

    // Create IAM role for EC2
    const ec2Role = new aws.iam.Role(`migration-ec2-role-${environmentSuffix}`, {
      assumeRolePolicy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: {
              Service: 'ec2.amazonaws.com'
            }
          }
        ]
      }),
      tags: {
        Name: `migration-ec2-role-${environmentSuffix}`,
        ...tags
      }
    }, { parent: this });

    // Create instance profile
    const ec2InstanceProfile = new aws.iam.InstanceProfile(`migration-ec2-profile-${environmentSuffix}`, {
      role: ec2Role.name
    }, { parent: this });

    // Create EC2 instance
    const ec2Instance = new aws.ec2.Instance(`migration-ec2-${environmentSuffix}`, {
      ami: amiId.id,
      instanceType: 'c6i.large',
      subnetId: publicSubnet.id,
      vpcSecurityGroupIds: [ec2SecurityGroup.id],
      iamInstanceProfile: ec2InstanceProfile.name,
      monitoring: true,
      tags: {
        Name: `migration-ec2-${environmentSuffix}`,
        ...tags
      }
    }, { parent: this });

    // Create S3 bucket
    const s3Bucket = new aws.s3.Bucket(`migration-bucket-${environmentSuffix}-${Math.random().toString(36).substring(7)}`, {
      tags: {
        Name: `migration-bucket-${environmentSuffix}`,
        ...tags
      }
    }, { parent: this });

    // Configure S3 bucket versioning
    const bucketVersioning = new aws.s3.BucketVersioning(`migration-bucket-versioning-${environmentSuffix}`, {
      bucket: s3Bucket.id,
      versioningConfiguration: {
        status: 'Enabled'
      }
    }, { parent: this });

    // Configure S3 bucket encryption
    const bucketEncryption = new aws.s3.BucketServerSideEncryptionConfiguration(`migration-bucket-encryption-${environmentSuffix}`, {
      bucket: s3Bucket.id,
      rules: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256'
          }
        }
      ]
    }, { parent: this });

    // Configure S3 lifecycle policy
    const bucketLifecycle = new aws.s3.BucketLifecycleConfiguration(`migration-bucket-lifecycle-${environmentSuffix}`, {
      bucket: s3Bucket.id,
      rules: [
        {
          id: 'transition-to-ia',
          status: 'Enabled',
          transitions: [
            {
              days: 30,
              storageClass: 'STANDARD_IA'
            },
            {
              days: 90,
              storageClass: 'GLACIER'
            }
          ]
        }
      ]
    }, { parent: this });

    // Create DynamoDB table
    const dynamoTable = new aws.dynamodb.Table(`migration-table-${environmentSuffix}`, {
      name: `migration-table-${environmentSuffix}`,
      billingMode: 'ON_DEMAND',
      hashKey: 'id',
      rangeKey: 'sortKey',
      attributes: [
        {
          name: 'id',
          type: 'S'
        },
        {
          name: 'sortKey',
          type: 'S'
        }
      ],
      pointInTimeRecovery: {
        enabled: true
      },
      tags: {
        Name: `migration-table-${environmentSuffix}`,
        ...tags
      }
    }, { parent: this });

    // Store outputs
    this.vpcId = vpc.id;
    this.ec2InstanceId = ec2Instance.id;
    this.ec2PublicIp = ec2Instance.publicIp;
    this.bucketName = s3Bucket.bucket;
    this.dynamoTableName = dynamoTable.name;

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      ec2InstanceId: this.ec2InstanceId,
      ec2PublicIp: this.ec2PublicIp,
      bucketName: this.bucketName,
      dynamoTableName: this.dynamoTableName
    });
  }
}
```

## Key Features Implemented

### VPC and Networking
- Complete VPC with public and private subnets in us-west-2
- Internet Gateway for public internet access
- Route tables with proper routing configuration
- Security groups with restricted SSH and open HTTP access

### EC2 Instance
- Uses c6i.large instance type (current generation)
- Amazon Linux 2023 AMI (latest)
- Deployed in public subnet for accessibility
- Enhanced monitoring enabled
- Proper IAM role and instance profile

### S3 Bucket
- Globally unique bucket name with random suffix
- Versioning enabled for data history preservation
- Server-side encryption (SSE-S3)
- Lifecycle policies for cost optimization

### DynamoDB Table
- On-demand billing for flexible scaling
- Point-in-time recovery enabled
- Composite primary key (id + sortKey)
- Proper attribute configuration

### Security and Best Practices
- Restricted SSH access (10.0.0.0/8 CIDR block)
- Open HTTP access for web traffic
- Comprehensive resource tagging
- IAM roles with least privilege principles
- Enhanced monitoring and logging capabilities

## Deployment

This infrastructure can be deployed using standard Pulumi commands:

```bash
pulumi up
```

All resources will be created in the us-west-2 region as specified, with proper dependencies and configurations for a production-ready migration environment.