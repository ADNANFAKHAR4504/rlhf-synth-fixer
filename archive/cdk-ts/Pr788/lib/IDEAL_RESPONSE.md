I'll help you create the AWS infrastructure using CDK TypeScript for your migration setup. This solution implements all requirements with production-ready best practices.

## Project Structure

Here's the complete infrastructure code organized into modular stacks:

## bin/tap.ts

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { Tags } from 'aws-cdk-lib';
import { TapStack } from '../lib/tap-stack';

const app = new cdk.App();

// Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
const environmentSuffix = app.node.tryGetContext('environmentSuffix') || 'dev';
const stackName = `TapStack${environmentSuffix}`;

const repositoryName = process.env.REPOSITORY || 'unknown';
const commitAuthor = process.env.COMMIT_AUTHOR || 'unknown';

// Apply tags to all stacks in this app
Tags.of(app).add('Environment', environmentSuffix);
Tags.of(app).add('Repository', repositoryName);
Tags.of(app).add('Author', commitAuthor);

// Set the region from AWS_REGION file or environment variable
const region =
  process.env.AWS_DEFAULT_REGION ||
  process.env.CDK_DEFAULT_REGION ||
  'us-west-2';

new TapStack(app, stackName, {
  stackName: stackName,
  environmentSuffix: environmentSuffix,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: region,
  },
});
```

## lib/tap-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { MigrationVpcStack } from './migration-vpc-stack';
import { MigrationStorageStack } from './migration-storage-stack';
import { MigrationComputeStack } from './migration-compute-stack';

interface TapStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class TapStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: TapStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC infrastructure stack
    const vpcStack = new MigrationVpcStack(this, 'MigrationVpcStack', {
      environmentSuffix,
      env: props?.env,
    });

    // Create storage infrastructure stack
    const storageStack = new MigrationStorageStack(
      this,
      'MigrationStorageStack',
      {
        environmentSuffix,
        env: props?.env,
      }
    );

    // Create compute infrastructure stack (depends on VPC)
    const computeStack = new MigrationComputeStack(
      this,
      'MigrationComputeStack',
      {
        vpc: vpcStack.vpc,
        sshSecurityGroup: vpcStack.sshSecurityGroup,
        environmentSuffix,
        env: props?.env,
      }
    );

    // Add dependencies
    storageStack.addDependency(vpcStack);
    computeStack.addDependency(vpcStack);

    // Apply global tags
    cdk.Tags.of(this).add('Project', 'Migration');
    cdk.Tags.of(this).add('Environment', 'Production');

    // Export all outputs from nested stacks at the parent level for easy access
    new cdk.CfnOutput(this, 'VpcId', {
      value: vpcStack.vpc.vpcId,
      description: 'VPC ID for migration infrastructure',
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: vpcStack.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs',
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: vpcStack.sshSecurityGroup.securityGroupId,
      description: 'SSH Security Group ID',
    });

    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: storageStack.backupBucket.bucketName,
      description: 'S3 bucket name for migration backups',
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: storageStack.backupBucket.bucketArn,
      description: 'S3 bucket ARN for migration backups',
    });

    new cdk.CfnOutput(this, 'EnvironmentSuffix', {
      value: environmentSuffix,
      description: 'Environment suffix used for resource naming',
    });
  }
}
```

## lib/migration-vpc-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

export interface MigrationVpcStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class MigrationVpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly publicSubnets: ec2.ISubnet[];
  public readonly sshSecurityGroup: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: MigrationVpcStackProps) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Create VPC with public subnets across multiple AZs
    this.vpc = new ec2.Vpc(this, 'MigrationVpc', {
      vpcName: `migration-vpc-${environmentSuffix}`,
      ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'),
      maxAzs: 2,
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
          cidrMask: 24,
        },
      ],
      natGateways: 0, // No NAT gateways needed for public-only setup
    });

    // Store public subnets for reference
    this.publicSubnets = this.vpc.publicSubnets;

    // Create security group for SSH access (temporary migration exception)
    this.sshSecurityGroup = new ec2.SecurityGroup(this, 'MigrationSshSg', {
      vpc: this.vpc,
      securityGroupName: `migration-ssh-sg-${environmentSuffix}`,
      description:
        'Security group allowing SSH access for migration (temporary exception)',
      allowAllOutbound: true,
    });

    // Add SSH inbound rule from anywhere (temporary exception)
    this.sshSecurityGroup.addIngressRule(
      ec2.Peer.anyIpv4(),
      ec2.Port.tcp(22),
      'Allow SSH access from anywhere (temporary migration exception)'
    );

    // Apply tags to all resources in this stack
    cdk.Tags.of(this).add('Project', 'Migration');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Component', 'Network');

    // Output important values
    new cdk.CfnOutput(this, 'VpcId', {
      value: this.vpc.vpcId,
      description: 'VPC ID for migration infrastructure',
      exportName: `migration-vpc-id-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'PublicSubnetIds', {
      value: this.publicSubnets.map(subnet => subnet.subnetId).join(','),
      description: 'Public subnet IDs',
      exportName: `migration-public-subnet-ids-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'SecurityGroupId', {
      value: this.sshSecurityGroup.securityGroupId,
      description: 'SSH Security Group ID',
      exportName: `migration-ssh-sg-id-${environmentSuffix}`,
    });
  }
}
```

## lib/migration-storage-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as s3 from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';

export interface MigrationStorageStackProps extends cdk.StackProps {
  environmentSuffix?: string;
}

export class MigrationStorageStack extends cdk.Stack {
  public readonly backupBucket: s3.Bucket;

  constructor(
    scope: Construct,
    id: string,
    props?: MigrationStorageStackProps
  ) {
    super(scope, id, props);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // Generate unique suffix for bucket name
    const uniqueSuffix = Math.random().toString(36).substring(2, 15);

    // Create S3 bucket for migration backups
    this.backupBucket = new s3.Bucket(this, 'MigrationBackupBucket', {
      bucketName: `migration-backup-${environmentSuffix}-${uniqueSuffix}`,
      versioned: true, // Enable versioning for backup data
      encryption: s3.BucketEncryption.S3_MANAGED,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Allow destruction for testing
      autoDeleteObjects: true, // Automatically delete objects when bucket is destroyed
    });

    // Apply tags
    cdk.Tags.of(this).add('Project', 'Migration');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Component', 'Storage');

    // Output bucket name
    new cdk.CfnOutput(this, 'BackupBucketName', {
      value: this.backupBucket.bucketName,
      description: 'S3 bucket name for migration backups',
      exportName: `migration-backup-bucket-name-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'BackupBucketArn', {
      value: this.backupBucket.bucketArn,
      description: 'S3 bucket ARN for migration backups',
      exportName: `migration-backup-bucket-arn-${environmentSuffix}`,
    });
  }
}
```

## lib/migration-compute-stack.ts

```typescript
import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elasticache from 'aws-cdk-lib/aws-elasticache';
import { Construct } from 'constructs';

export interface MigrationComputeStackProps extends cdk.StackProps {
  vpc: ec2.IVpc;
  sshSecurityGroup: ec2.ISecurityGroup;
  environmentSuffix?: string;
}

export class MigrationComputeStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MigrationComputeStackProps) {
    super(scope, id, props);

    const environmentSuffix = props.environmentSuffix || 'dev';

    // Create security group for ElastiCache
    const cacheSecurityGroup = new ec2.SecurityGroup(
      this,
      'CacheSecurityGroup',
      {
        vpc: props.vpc,
        securityGroupName: `migration-cache-sg-${environmentSuffix}`,
        description: 'Security group for ElastiCache cluster',
        allowAllOutbound: false,
      }
    );

    // Allow Redis access from VPC
    cacheSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(props.vpc.vpcCidrBlock),
      ec2.Port.tcp(6379),
      'Allow Redis access from VPC'
    );

    // Create subnet group for ElastiCache
    new elasticache.CfnSubnetGroup(this, 'CacheSubnetGroup', {
      description: 'Subnet group for ElastiCache cluster',
      subnetIds: props.vpc.publicSubnets.map(subnet => subnet.subnetId),
      cacheSubnetGroupName: `migration-cache-subnet-group-${environmentSuffix}`,
    });

    // Create ElastiCache Serverless for Redis (latest AWS feature)
    const cacheCluster = new elasticache.CfnServerlessCache(
      this,
      'MigrationCache',
      {
        engine: 'redis',
        serverlessCacheName: `migration-cache-${environmentSuffix}`,
        description: 'Serverless Redis cache for migration workloads',
        securityGroupIds: [cacheSecurityGroup.securityGroupId],
        subnetIds: props.vpc.publicSubnets.map(subnet => subnet.subnetId),
        cacheUsageLimits: {
          dataStorage: {
            maximum: 10,
            unit: 'GB',
          },
          ecpuPerSecond: {
            maximum: 5000,
          },
        },
      }
    );

    // Apply tags
    cdk.Tags.of(this).add('Project', 'Migration');
    cdk.Tags.of(this).add('Environment', 'Production');
    cdk.Tags.of(this).add('Component', 'Compute');

    // Output cache endpoint and port
    new cdk.CfnOutput(this, 'CacheEndpointAddress', {
      value: cacheCluster.attrEndpointAddress || 'N/A',
      description: 'ElastiCache Serverless endpoint address',
      exportName: `migration-cache-endpoint-address-${environmentSuffix}`,
    });

    new cdk.CfnOutput(this, 'CacheEndpointPort', {
      value: cacheCluster.attrEndpointPort || 'N/A',
      description: 'ElastiCache Serverless endpoint port',
      exportName: `migration-cache-endpoint-port-${environmentSuffix}`,
    });
  }
}
```

## Key Features Implemented

### 1. VPC Infrastructure
- **CIDR Block**: 10.0.0.0/16 as specified
- **Public Subnets**: Created across 2 availability zones for high availability
- **Internet Gateway**: Automatically attached with proper routing
- **No NAT Gateways**: Cost-optimized for public-only infrastructure

### 2. S3 Storage
- **Unique Naming**: `migration-backup-${environmentSuffix}-${random}` pattern
- **Versioning**: Enabled for data protection
- **Encryption**: S3-managed encryption (AES256)
- **Public Access**: Completely blocked for security
- **Auto-deletion**: Objects deleted when stack is destroyed (for testing)

### 3. Security Configuration
- **SSH Security Group**: Allows port 22 from 0.0.0.0/0 (temporary migration exception)
- **ElastiCache Security**: Redis access restricted to VPC CIDR only
- **Outbound Rules**: Carefully controlled for ElastiCache

### 4. ElastiCache Serverless
- **Engine**: Redis for high-performance caching
- **Auto-scaling**: Serverless configuration for automatic scaling
- **Resource Limits**: 10GB storage, 5000 ECPU/second
- **Subnet Group**: Configured for multi-AZ deployment

### 5. Resource Management
- **Environment Suffix**: All resources include suffix for multi-environment support
- **Removal Policy**: Set to DESTROY for clean teardown
- **Tags**: Consistent tagging across all resources
- **Dependencies**: Proper stack dependencies ensure correct deployment order

### 6. Best Practices
- **Modular Design**: Separated into logical stacks (VPC, Storage, Compute)
- **Type Safety**: Full TypeScript with proper interfaces
- **Context-driven**: Uses CDK context for environment configuration
- **CI/CD Ready**: Environment suffix from context/environment variables
- **Export Outputs**: All important values exported for cross-stack references

### 7. Production Considerations
- **High Availability**: Resources spread across multiple AZs
- **Security**: Least privilege access, encrypted storage
- **Cost Optimization**: No unnecessary NAT gateways, serverless compute
- **Monitoring Ready**: All resources properly tagged for tracking
- **Disaster Recovery**: S3 versioning for backup protection

## Deployment

```bash
# Install dependencies
npm install

# Bootstrap CDK (first time only)
npm run cdk:bootstrap

# Deploy infrastructure
npm run cdk:deploy

# Destroy infrastructure
npm run cdk:destroy
```

This infrastructure provides a robust, scalable, and secure foundation for your migration workloads while following AWS and CDK best practices.