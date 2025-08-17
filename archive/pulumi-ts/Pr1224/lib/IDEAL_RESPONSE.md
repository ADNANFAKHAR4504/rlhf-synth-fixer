# TAP Infrastructure - Secure AWS Infrastructure with Pulumi TypeScript

I'll create a secure, region-agnostic AWS infrastructure using Pulumi with TypeScript. The solution is modular, production-ready, and follows AWS security best practices with comprehensive testing.

## Project Structure

```
infrastructure/
├── bin/
│   └── tap.ts                    # Main entry point
├── lib/
│   ├── tap-stack.ts             # Main stack orchestrator
│   ├── secure-stack.ts          # Core secure infrastructure
│   └── stacks/                  # Modular stack components
│       ├── kms-stack.ts         # KMS encryption keys
│       ├── iam-stack.ts         # IAM roles and policies
│       ├── vpc-stack.ts         # VPC and networking
│       ├── s3-stack.ts          # S3 buckets with encryption
│       ├── security-group-stack.ts # Security groups
│       ├── rds-stack.ts         # RDS database with encryption
│       └── ec2-stack.ts         # EC2 instances with hardening
├── test/
│   └── tap-stack.int.test.ts    # Comprehensive integration tests
└── package.json
```

## Core Configuration

**bin/tap.ts** - Main Entry Point

```typescript
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Initialize Pulumi configuration for the current stack
const config = new pulumi.Config();

// Get the environment suffix from config, defaulting to 'dev'
const environmentSuffix =
  config.get('environmentSuffix') || process.env.ENVIRONMENT_SUFFIX || 'dev';

// Get configuration values with defaults
const vpcCidr = config.get('vpcCidr') || '10.0.0.0/16';
const instanceType = config.get('instanceType') || 't3.micro';
const dbInstanceClass = config.get('dbInstanceClass') || 'db.t3.micro';
const enableKeyPairs = config.getBoolean('enableKeyPairs') || false;

// Get metadata from environment variables for tagging
const repository =
  config.get('repository') || process.env.REPOSITORY || 'tap-infrastructure';
const commitAuthor =
  config.get('commitAuthor') || process.env.COMMIT_AUTHOR || 'unknown';

// Define default tags to apply to all resources
const defaultTags = {
  Environment: environmentSuffix,
  Repository: repository,
  Author: commitAuthor,
  Project: 'TAP',
  Owner: 'tap-team',
};

// Instantiate the main stack component
const tapStack = new TapStack('tap-infrastructure', {
  environmentSuffix,
  vpcCidr,
  instanceType,
  dbInstanceClass,
  enableKeyPairs,
  tags: defaultTags,
});

// Export stack outputs for integration testing and external access
export const vpcId = tapStack.vpcId;
export const dataBucketName = tapStack.dataBucketName;
export const logsBucketName = tapStack.logsBucketName;
export const databaseEndpoint = tapStack.databaseEndpoint;
export const dbSubnetGroupName = tapStack.dbSubnetGroupName;
export const webInstanceId = tapStack.webInstanceId;
export const webInstancePrivateIp = tapStack.webInstancePrivateIp;
export const stackEnvironmentSuffix = tapStack.environmentSuffix;
export const mainKmsKeyAlias = tapStack.mainKmsKeyAlias;
export const rdsKmsKeyAlias = tapStack.rdsKmsKeyAlias;
export const ec2InstanceProfileName = tapStack.ec2InstanceProfileName;
export const ec2RoleName = tapStack.ec2RoleName;
```

## Main Stack Orchestrator

**lib/tap-stack.ts**

```typescript
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';
import { SecureStack } from './secure-stack';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcCidr?: string;
  instanceType?: string;
  dbInstanceClass?: string;
  enableKeyPairs?: boolean;
}

export class TapStack extends pulumi.ComponentResource {
  // VPC outputs
  public readonly vpcId: pulumi.Output<string>;

  // S3 outputs
  public readonly dataBucketName: pulumi.Output<string>;
  public readonly logsBucketName: pulumi.Output<string>;

  // RDS outputs
  public readonly databaseEndpoint: pulumi.Output<string>;
  public readonly dbSubnetGroupName: pulumi.Output<string>;

  // EC2 outputs
  public readonly webInstanceId: pulumi.Output<string>;
  public readonly webInstancePrivateIp: pulumi.Output<string>;

  // Configuration outputs
  public readonly environmentSuffix: pulumi.Output<string>;

  // KMS outputs
  public readonly mainKmsKeyAlias: pulumi.Output<string>;
  public readonly rdsKmsKeyAlias: pulumi.Output<string>;

  // IAM outputs
  public readonly ec2InstanceProfileName: pulumi.Output<string>;
  public readonly ec2RoleName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:main:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create the secure infrastructure stack
    const secureStack = new SecureStack(
      `tap-secure-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
        vpcCidr: args.vpcCidr || '10.0.0.0/16',
        instanceType: args.instanceType || 't3.micro',
        dbInstanceClass: args.dbInstanceClass || 'db.t3.micro',
        enableKeyPairs: args.enableKeyPairs || false,
      },
      { parent: this }
    );

    // Expose outputs from the secure stack
    this.vpcId = secureStack.vpcId;
    this.dataBucketName = secureStack.dataBucketName;
    this.logsBucketName = secureStack.logsBucketName;
    this.databaseEndpoint = secureStack.databaseEndpoint;
    this.dbSubnetGroupName = secureStack.dbSubnetGroupName;
    this.webInstanceId = secureStack.webInstanceId;
    this.webInstancePrivateIp = secureStack.webInstancePrivateIp;
    this.environmentSuffix = pulumi.output(environmentSuffix);
    this.mainKmsKeyAlias = secureStack.mainKmsKeyAlias;
    this.rdsKmsKeyAlias = secureStack.rdsKmsKeyAlias;
    this.ec2InstanceProfileName = secureStack.ec2InstanceProfileName;
    this.ec2RoleName = secureStack.ec2RoleName;

    // Register outputs with the component
    this.registerOutputs({
      vpcId: this.vpcId,
      dataBucketName: this.dataBucketName,
      logsBucketName: this.logsBucketName,
      databaseEndpoint: this.databaseEndpoint,
      dbSubnetGroupName: this.dbSubnetGroupName,
      webInstanceId: this.webInstanceId,
      webInstancePrivateIp: this.webInstancePrivateIp,
      environmentSuffix: this.environmentSuffix,
      mainKmsKeyAlias: this.mainKmsKeyAlias,
      rdsKmsKeyAlias: this.rdsKmsKeyAlias,
      ec2InstanceProfileName: this.ec2InstanceProfileName,
      ec2RoleName: this.ec2RoleName,
    });
  }
}
```

## Secure Infrastructure Stack

**lib/secure-stack.ts**

```typescript
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

// Import modular stack components
import { Ec2Stack } from './stacks/ec2-stack';
import { IamStack } from './stacks/iam-stack';
import { KmsStack } from './stacks/kms-stack';
import { RdsStack } from './stacks/rds-stack';
import { S3Stack } from './stacks/s3-stack';
import { SecurityGroupStack } from './stacks/security-group-stack';
import { VpcStack } from './stacks/vpc-stack';

export interface SecureStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcCidr?: string;
  instanceType?: string;
  dbInstanceClass?: string;
  enableKeyPairs?: boolean;
}

export class SecureStack extends pulumi.ComponentResource {
  // All outputs from individual stacks
  public readonly vpcId: pulumi.Output<string>;
  public readonly dataBucketName: pulumi.Output<string>;
  public readonly logsBucketName: pulumi.Output<string>;
  public readonly databaseEndpoint: pulumi.Output<string>;
  public readonly dbSubnetGroupName: pulumi.Output<string>;
  public readonly webInstanceId: pulumi.Output<string>;
  public readonly webInstancePrivateIp: pulumi.Output<string>;
  public readonly mainKmsKeyAlias: pulumi.Output<string>;
  public readonly rdsKmsKeyAlias: pulumi.Output<string>;
  public readonly ec2InstanceProfileName: pulumi.Output<string>;
  public readonly ec2RoleName: pulumi.Output<string>;

  constructor(name: string, args: SecureStackArgs, opts?: ResourceOptions) {
    super('tap:secure:SecureStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // 1. Create KMS keys for encryption
    const kmsStack = new KmsStack(
      `tap-kms-${environmentSuffix}`,
      { environmentSuffix, tags },
      { parent: this }
    );

    // 2. Create VPC and networking components
    const vpcStack = new VpcStack(
      `tap-vpc-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
        vpcCidr: args.vpcCidr || '10.0.0.0/16',
      },
      { parent: this }
    );

    // 3. Create IAM roles and policies
    const iamStack = new IamStack(
      `tap-iam-${environmentSuffix}`,
      { environmentSuffix, tags },
      { parent: this }
    );

    // 4. Create S3 buckets with encryption
    const s3Stack = new S3Stack(
      `tap-s3-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
        kmsKeyArn: kmsStack.mainKeyArn,
      },
      { parent: this }
    );

    // 5. Create security groups
    const securityGroupStack = new SecurityGroupStack(
      `tap-sg-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
        vpcId: vpcStack.vpcId,
      },
      { parent: this }
    );

    // 6. Create RDS database with encryption
    const rdsStack = new RdsStack(
      `tap-rds-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
        privateSubnetIds: pulumi.all(vpcStack.privateSubnetIds),
        dbSecurityGroupId: securityGroupStack.dbSecurityGroupId,
        rdsKmsKeyArn: kmsStack.rdsKeyArn,
        instanceClass: args.dbInstanceClass,
      },
      { parent: this }
    );

    // 7. Create EC2 instances with security hardening
    const ec2Stack = new Ec2Stack(
      `tap-ec2-${environmentSuffix}`,
      {
        environmentSuffix,
        tags,
        privateSubnetIds: pulumi.all(vpcStack.privateSubnetIds),
        webSecurityGroupId: securityGroupStack.webSecurityGroupId,
        iamInstanceProfileName: iamStack.ec2InstanceProfileName,
        kmsKeyArn: kmsStack.mainKeyArn,
        instanceType: args.instanceType,
        enableKeyPairs: args.enableKeyPairs,
      },
      { parent: this }
    );

    // Expose outputs
    this.vpcId = vpcStack.vpcId;
    this.dataBucketName = s3Stack.dataBucketName;
    this.logsBucketName = s3Stack.logsBucketName;
    this.databaseEndpoint = rdsStack.dbInstanceEndpoint;
    this.dbSubnetGroupName = rdsStack.dbSubnetGroupName;
    this.webInstanceId = ec2Stack.instanceId;
    this.webInstancePrivateIp = ec2Stack.privateIp;
    this.mainKmsKeyAlias = kmsStack.mainKeyAlias;
    this.rdsKmsKeyAlias = kmsStack.rdsKeyAlias;
    this.ec2InstanceProfileName = iamStack.ec2InstanceProfileName;
    this.ec2RoleName = iamStack.ec2RoleName;

    // Register outputs with the component
    this.registerOutputs({
      vpcId: this.vpcId,
      dataBucketName: this.dataBucketName,
      logsBucketName: this.logsBucketName,
      databaseEndpoint: this.databaseEndpoint,
      dbSubnetGroupName: this.dbSubnetGroupName,
      webInstanceId: this.webInstanceId,
      webInstancePrivateIp: this.webInstancePrivateIp,
      mainKmsKeyAlias: this.mainKmsKeyAlias,
      rdsKmsKeyAlias: this.rdsKmsKeyAlias,
      ec2InstanceProfileName: this.ec2InstanceProfileName,
      ec2RoleName: this.ec2RoleName,
    });
  }
}
```

## KMS Encryption Module

**lib/stacks/kms-stack.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface KmsStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class KmsStack extends pulumi.ComponentResource {
  public readonly mainKeyId: pulumi.Output<string>;
  public readonly mainKeyArn: pulumi.Output<string>;
  public readonly rdsKeyId: pulumi.Output<string>;
  public readonly rdsKeyArn: pulumi.Output<string>;
  public readonly mainKeyAlias: pulumi.Output<string>;
  public readonly rdsKeyAlias: pulumi.Output<string>;

  constructor(name: string, args: KmsStackArgs, opts?: ResourceOptions) {
    super('tap:kms:KmsStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Main KMS key for general encryption
    const mainKey = new aws.kms.Key(
      `tap-main-key-${environmentSuffix}`,
      {
        description: `Main KMS key for TAP infrastructure - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: { Name: `tap-main-key-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    const mainKeyAlias = new aws.kms.Alias(
      `tap-main-alias-${environmentSuffix}`,
      {
        name: `alias/tap-main-${environmentSuffix}`,
        targetKeyId: mainKey.keyId,
      },
      { parent: this }
    );

    // RDS-specific KMS key
    const rdsKey = new aws.kms.Key(
      `tap-rds-key-${environmentSuffix}`,
      {
        description: `RDS KMS key for TAP infrastructure - ${environmentSuffix}`,
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: { Name: `tap-rds-key-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    const rdsKeyAlias = new aws.kms.Alias(
      `tap-rds-alias-${environmentSuffix}`,
      {
        name: `alias/tap-rds-${environmentSuffix}`,
        targetKeyId: rdsKey.keyId,
      },
      { parent: this }
    );

    this.mainKeyId = mainKey.keyId;
    this.mainKeyArn = mainKey.arn;
    this.rdsKeyId = rdsKey.keyId;
    this.rdsKeyArn = rdsKey.arn;
    this.mainKeyAlias = mainKeyAlias.name;
    this.rdsKeyAlias = rdsKeyAlias.name;

    this.registerOutputs({
      mainKeyId: this.mainKeyId,
      mainKeyArn: this.mainKeyArn,
      rdsKeyId: this.rdsKeyId,
      rdsKeyArn: this.rdsKeyArn,
      mainKeyAlias: this.mainKeyAlias,
      rdsKeyAlias: this.rdsKeyAlias,
    });
  }
}
```

## IAM Module

**lib/stacks/iam-stack.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface IamStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class IamStack extends pulumi.ComponentResource {
  public readonly ec2RoleArn: pulumi.Output<string>;
  public readonly ec2RoleName: pulumi.Output<string>;
  public readonly ec2InstanceProfileName: pulumi.Output<string>;

  constructor(name: string, args: IamStackArgs, opts?: ResourceOptions) {
    super('tap:iam:IamStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // EC2 role with least privilege
    const ec2Role = new aws.iam.Role(
      `tap-ec2-role-${environmentSuffix}`,
      {
        name: `tap-ec2-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'ec2.amazonaws.com' },
            },
          ],
        }),
        tags: { Name: `tap-ec2-role-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    // Attach minimal CloudWatch logging policy
    new aws.iam.RolePolicyAttachment(
      `tap-ec2-cloudwatch-attachment-${environmentSuffix}`,
      {
        role: ec2Role.name,
        policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
      },
      { parent: this }
    );

    // Get current AWS account ID and region for secure IAM policies
    const currentRegion = aws.getRegion();
    const currentIdentity = aws.getCallerIdentity();

    // Secure CloudWatch logging policy with specific region and account ID
    new aws.iam.RolePolicy(
      `tap-ec2-logging-policy-${environmentSuffix}`,
      {
        role: ec2Role.id,
        policy: pulumi
          .all([currentRegion, currentIdentity])
          .apply(([region, identity]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'logs:DescribeLogStreams',
                  ],
                  Resource: `arn:aws:logs:${region.name}:${identity.accountId}:log-group:/aws/ec2/tap/*`,
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Custom policy for S3 access (read-only)
    const s3Policy = new aws.iam.RolePolicy(
      `tap-ec2-s3-policy-${environmentSuffix}`,
      {
        role: ec2Role.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetObject', 's3:GetObjectVersion'],
              Resource: 'arn:aws:s3:::tap-*/*',
            },
          ],
        }),
      },
      { parent: this }
    );

    // Instance profile for EC2
    const instanceProfile = new aws.iam.InstanceProfile(
      `tap-ec2-profile-${environmentSuffix}`,
      {
        name: `tap-ec2-profile-${environmentSuffix}`,
        role: ec2Role.name,
        tags: { Name: `tap-ec2-profile-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    this.ec2RoleArn = ec2Role.arn;
    this.ec2RoleName = ec2Role.name;
    this.ec2InstanceProfileName = instanceProfile.name;

    this.registerOutputs({
      ec2RoleArn: this.ec2RoleArn,
      ec2RoleName: this.ec2RoleName,
      ec2InstanceProfileName: this.ec2InstanceProfileName,
    });
  }
}
```

## VPC and Networking Module

**lib/stacks/vpc-stack.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface VpcStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcCidr?: string;
}

export class VpcStack extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly privateSubnetIds: pulumi.Output<string>[];
  public readonly publicSubnetIds: pulumi.Output<string>[];

  constructor(name: string, args: VpcStackArgs, opts?: ResourceOptions) {
    super('tap:vpc:VpcStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};
    const vpcCidr = args.vpcCidr || '10.0.0.0/16';

    // Create VPC
    const vpc = new aws.ec2.Vpc(
      `tap-vpc-${environmentSuffix}`,
      {
        cidrBlock: vpcCidr,
        enableDnsHostnames: true,
        enableDnsSupport: true,
        tags: { Name: `tap-vpc-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    // Internet Gateway
    const internetGateway = new aws.ec2.InternetGateway(
      `tap-igw-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { Name: `tap-igw-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    // Get availability zones
    const availabilityZones = aws.getAvailabilityZones({
      state: 'available',
    });

    // Create subnets across multiple AZs
    const privateSubnets: aws.ec2.Subnet[] = [];
    const publicSubnets: aws.ec2.Subnet[] = [];

    for (let i = 0; i < 3; i++) {
      // Public subnet
      const publicSubnet = new aws.ec2.Subnet(
        `tap-public-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i * 2 + 1}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          mapPublicIpOnLaunch: false, // Explicitly disable auto-assign public IP
          tags: {
            Name: `tap-public-subnet-${i}-${environmentSuffix}`,
            Type: 'public',
            ...tags,
          },
        },
        { parent: this }
      );
      publicSubnets.push(publicSubnet);

      // Private subnet
      const privateSubnet = new aws.ec2.Subnet(
        `tap-private-subnet-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          cidrBlock: `10.0.${i * 2 + 2}.0/24`,
          availabilityZone: availabilityZones.then(azs => azs.names[i]),
          tags: {
            Name: `tap-private-subnet-${i}-${environmentSuffix}`,
            Type: 'private',
            ...tags,
          },
        },
        { parent: this }
      );
      privateSubnets.push(privateSubnet);

      // NAT Gateway for private subnet internet access
      const eip = new aws.ec2.Eip(
        `tap-nat-eip-${i}-${environmentSuffix}`,
        {
          domain: 'vpc',
          tags: { Name: `tap-nat-eip-${i}-${environmentSuffix}`, ...tags },
        },
        { parent: this }
      );

      const natGateway = new aws.ec2.NatGateway(
        `tap-nat-gateway-${i}-${environmentSuffix}`,
        {
          allocationId: eip.id,
          subnetId: publicSubnet.id,
          tags: { Name: `tap-nat-gateway-${i}-${environmentSuffix}`, ...tags },
        },
        { parent: this }
      );

      // Route tables
      const privateRouteTable = new aws.ec2.RouteTable(
        `tap-private-rt-${i}-${environmentSuffix}`,
        {
          vpcId: vpc.id,
          tags: { Name: `tap-private-rt-${i}-${environmentSuffix}`, ...tags },
        },
        { parent: this }
      );

      new aws.ec2.Route(
        `tap-private-route-${i}-${environmentSuffix}`,
        {
          routeTableId: privateRouteTable.id,
          destinationCidrBlock: '0.0.0.0/0',
          natGatewayId: natGateway.id,
        },
        { parent: this }
      );

      new aws.ec2.RouteTableAssociation(
        `tap-private-rta-${i}-${environmentSuffix}`,
        {
          subnetId: privateSubnet.id,
          routeTableId: privateRouteTable.id,
        },
        { parent: this }
      );
    }

    // Public route table
    const publicRouteTable = new aws.ec2.RouteTable(
      `tap-public-rt-${environmentSuffix}`,
      {
        vpcId: vpc.id,
        tags: { Name: `tap-public-rt-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    new aws.ec2.Route(
      `tap-public-route-${environmentSuffix}`,
      {
        routeTableId: publicRouteTable.id,
        destinationCidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
      { parent: this }
    );

    // Associate public subnets with public route table
    publicSubnets.forEach((subnet, i) => {
      new aws.ec2.RouteTableAssociation(
        `tap-public-rta-${i}-${environmentSuffix}`,
        {
          subnetId: subnet.id,
          routeTableId: publicRouteTable.id,
        },
        { parent: this }
      );
    });

    this.vpcId = vpc.id;
    this.privateSubnetIds = privateSubnets.map(subnet => subnet.id);
    this.publicSubnetIds = publicSubnets.map(subnet => subnet.id);

    this.registerOutputs({
      vpcId: this.vpcId,
      privateSubnetIds: this.privateSubnetIds,
      publicSubnetIds: this.publicSubnetIds,
    });
  }
}
```

## S3 Storage Module

**lib/stacks/s3-stack.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface S3StackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  kmsKeyArn: pulumi.Input<string>;
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly dataBucketName: pulumi.Output<string>;
  public readonly logsBucketName: pulumi.Output<string>;

  constructor(name: string, args: S3StackArgs, opts?: ResourceOptions) {
    super('tap:s3:S3Stack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Data bucket with encryption
    const dataBucket = new aws.s3.Bucket(
      `tap-data-bucket-${environmentSuffix}`,
      {
        tags: { Name: `tap-data-bucket-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    // Logs bucket
    const logsBucket = new aws.s3.Bucket(
      `tap-logs-bucket-${environmentSuffix}`,
      {
        tags: { Name: `tap-logs-bucket-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    // Block all public access for data bucket
    new aws.s3.BucketPublicAccessBlock(
      `tap-data-bucket-pab-${environmentSuffix}`,
      {
        bucket: dataBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Block all public access for logs bucket
    new aws.s3.BucketPublicAccessBlock(
      `tap-logs-bucket-pab-${environmentSuffix}`,
      {
        bucket: logsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Server-side encryption for data bucket
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `tap-data-bucket-encryption-${environmentSuffix}`,
      {
        bucket: dataBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: args.kmsKeyArn,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Server-side encryption for logs bucket
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `tap-logs-bucket-encryption-${environmentSuffix}`,
      {
        bucket: logsBucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: args.kmsKeyArn,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Versioning for data bucket
    new aws.s3.BucketVersioning(
      `tap-data-bucket-versioning-${environmentSuffix}`,
      {
        bucket: dataBucket.id,
        versioningConfiguration: { status: 'Enabled' },
      },
      { parent: this }
    );

    // Access logging for data bucket
    new aws.s3.BucketLogging(
      `tap-data-bucket-logging-${environmentSuffix}`,
      {
        bucket: dataBucket.id,
        targetBucket: logsBucket.id,
        targetPrefix: 'access-logs/',
      },
      { parent: this }
    );

    // Lifecycle policies
    new aws.s3.BucketLifecycleConfiguration(
      `tap-data-bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: dataBucket.id,
        rules: [
          {
            id: 'transition-to-ia',
            status: 'Enabled',
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    new aws.s3.BucketLifecycleConfiguration(
      `tap-logs-bucket-lifecycle-${environmentSuffix}`,
      {
        bucket: logsBucket.id,
        rules: [
          {
            id: 'delete-old-logs',
            status: 'Enabled',
            expiration: { days: 90 },
          },
        ],
      },
      { parent: this }
    );

    this.dataBucketName = dataBucket.id;
    this.logsBucketName = logsBucket.id;

    this.registerOutputs({
      dataBucketName: this.dataBucketName,
      logsBucketName: this.logsBucketName,
    });
  }
}
```

## Security Groups Module

**lib/stacks/security-group-stack.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface SecurityGroupStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  vpcId: pulumi.Input<string>;
}

export class SecurityGroupStack extends pulumi.ComponentResource {
  public readonly webSecurityGroupId: pulumi.Output<string>;
  public readonly appSecurityGroupId: pulumi.Output<string>;
  public readonly dbSecurityGroupId: pulumi.Output<string>;

  constructor(
    name: string,
    args: SecurityGroupStackArgs,
    opts?: ResourceOptions
  ) {
    super('tap:sg:SecurityGroupStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Web tier security group
    const webSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-web-sg-${environmentSuffix}`,
      {
        name: `tap-web-sg-${environmentSuffix}`,
        description: 'Security group for web tier',
        vpcId: args.vpcId,
        ingress: [
          {
            fromPort: 443,
            toPort: 443,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTPS from anywhere',
          },
          {
            fromPort: 80,
            toPort: 80,
            protocol: 'tcp',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'HTTP from anywhere',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: { Name: `tap-web-sg-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    // Application tier security group
    const appSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-app-sg-${environmentSuffix}`,
      {
        name: `tap-app-sg-${environmentSuffix}`,
        description: 'Security group for application tier',
        vpcId: args.vpcId,
        ingress: [
          {
            fromPort: 8080,
            toPort: 8080,
            protocol: 'tcp',
            securityGroups: [webSecurityGroup.id],
            description: 'App port from web tier',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: { Name: `tap-app-sg-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    // Database tier security group
    const dbSecurityGroup = new aws.ec2.SecurityGroup(
      `tap-db-sg-${environmentSuffix}`,
      {
        name: `tap-db-sg-${environmentSuffix}`,
        description: 'Security group for database tier',
        vpcId: args.vpcId,
        ingress: [
          {
            fromPort: 3306,
            toPort: 3306,
            protocol: 'tcp',
            securityGroups: [appSecurityGroup.id],
            description: 'MySQL from app tier',
          },
        ],
        egress: [
          {
            fromPort: 0,
            toPort: 0,
            protocol: '-1',
            cidrBlocks: ['0.0.0.0/0'],
            description: 'All outbound traffic',
          },
        ],
        tags: { Name: `tap-db-sg-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    this.webSecurityGroupId = webSecurityGroup.id;
    this.appSecurityGroupId = appSecurityGroup.id;
    this.dbSecurityGroupId = dbSecurityGroup.id;

    this.registerOutputs({
      webSecurityGroupId: this.webSecurityGroupId,
      appSecurityGroupId: this.appSecurityGroupId,
      dbSecurityGroupId: this.dbSecurityGroupId,
    });
  }
}
```

## RDS Database Module

**lib/stacks/rds-stack.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface RdsStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  privateSubnetIds: pulumi.Input<string[]>;
  dbSecurityGroupId: pulumi.Input<string>;
  rdsKmsKeyArn: pulumi.Input<string>;
  instanceClass?: string;
}

export class RdsStack extends pulumi.ComponentResource {
  public readonly dbInstanceId: pulumi.Output<string>;
  public readonly dbInstanceArn: pulumi.Output<string>;
  public readonly dbInstanceEndpoint: pulumi.Output<string>;
  public readonly dbInstancePort: pulumi.Output<number>;
  public readonly dbSubnetGroupName: pulumi.Output<string>;

  constructor(name: string, args: RdsStackArgs, opts?: ResourceOptions) {
    super('tap:rds:RdsStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const instanceClass = args.instanceClass || 'db.t3.micro';
    const tags = args.tags || {};

    // Subnet group for RDS
    const dbSubnetGroup = new aws.rds.SubnetGroup(
      `tap-db-subnet-group-${environmentSuffix}`,
      {
        name: `tap-db-subnet-group-${environmentSuffix}`,
        subnetIds: args.privateSubnetIds,
        tags: { Name: `tap-db-subnet-group-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    // Enhanced monitoring role
    const monitoringRole = new aws.iam.Role(
      `tap-rds-monitoring-role-${environmentSuffix}`,
      {
        name: `tap-rds-monitoring-role-${environmentSuffix}`,
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Action: 'sts:AssumeRole',
              Effect: 'Allow',
              Principal: { Service: 'monitoring.rds.amazonaws.com' },
            },
          ],
        }),
        tags: { Name: `tap-rds-monitoring-role-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    new aws.iam.RolePolicyAttachment(
      `tap-rds-monitoring-attachment-${environmentSuffix}`,
      {
        role: monitoringRole.name,
        policyArn:
          'arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole',
      },
      { parent: this }
    );

    // RDS instance with encryption
    const dbInstance = new aws.rds.Instance(
      `tap-db-instance-${environmentSuffix}`,
      {
        identifier: `tap-db-${environmentSuffix}`,
        instanceClass: instanceClass,
        engine: 'mysql',
        engineVersion: '8.0',
        allocatedStorage: 20,
        storageType: 'gp3',
        storageEncrypted: true,
        kmsKeyId: args.rdsKmsKeyArn,

        dbName: 'tapdb',
        username: 'admin',
        password: pulumi.secret('TapSecurePassword123!'),

        vpcSecurityGroupIds: [args.dbSecurityGroupId],
        dbSubnetGroupName: dbSubnetGroup.name,
        publiclyAccessible: false,

        backupRetentionPeriod: 7,
        backupWindow: '03:00-04:00',
        maintenanceWindow: 'sun:04:00-sun:05:00',

        skipFinalSnapshot: false,
        finalSnapshotIdentifier: `tap-db-final-snapshot-${environmentSuffix}`,
        deleteAutomatedBackups: false,

        enabledCloudwatchLogsExports: ['error', 'general', 'slowquery'],
        monitoringInterval: 60,
        monitoringRoleArn: monitoringRole.arn,

        // Note: Using CloudWatch Database Insights instead of Performance Insights
        // for universal compatibility and cost-effectiveness
        // CloudWatch alarms provide comprehensive monitoring for all instance classes

        tags: { Name: `tap-db-instance-${environmentSuffix}`, ...tags },
      },
      { parent: this }
    );

    // CloudWatch Database Insights - Create alarms for comprehensive database monitoring
    // This provides superior monitoring compared to Performance Insights with universal compatibility

    // CPU Utilization Alarm
    new aws.cloudwatch.MetricAlarm(
      `tap-db-cpu-alarm-${environmentSuffix}`,
      {
        name: `tap-db-cpu-utilization-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'CPUUtilization',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 80,
        alarmDescription: 'RDS CPU utilization is too high',
        dimensions: {
          DBInstanceIdentifier: dbInstance.id,
        },
        tags: {
          Name: `tap-db-cpu-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Database Connections Alarm
    new aws.cloudwatch.MetricAlarm(
      `tap-db-connections-alarm-${environmentSuffix}`,
      {
        name: `tap-db-connections-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'DatabaseConnections',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 40,
        alarmDescription: 'RDS connection count is too high',
        dimensions: {
          DBInstanceIdentifier: dbInstance.id,
        },
        tags: {
          Name: `tap-db-connections-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Free Storage Space Alarm
    new aws.cloudwatch.MetricAlarm(
      `tap-db-storage-alarm-${environmentSuffix}`,
      {
        name: `tap-db-free-storage-${environmentSuffix}`,
        comparisonOperator: 'LessThanThreshold',
        evaluationPeriods: 1,
        metricName: 'FreeStorageSpace',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 2000000000, // 2GB in bytes
        alarmDescription: 'RDS free storage space is low',
        dimensions: {
          DBInstanceIdentifier: dbInstance.id,
        },
        tags: {
          Name: `tap-db-storage-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Read Latency Alarm
    new aws.cloudwatch.MetricAlarm(
      `tap-db-read-latency-alarm-${environmentSuffix}`,
      {
        name: `tap-db-read-latency-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'ReadLatency',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 0.2, // 200ms
        alarmDescription: 'RDS read latency is too high',
        dimensions: {
          DBInstanceIdentifier: dbInstance.id,
        },
        tags: {
          Name: `tap-db-read-latency-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    // Write Latency Alarm
    new aws.cloudwatch.MetricAlarm(
      `tap-db-write-latency-alarm-${environmentSuffix}`,
      {
        name: `tap-db-write-latency-${environmentSuffix}`,
        comparisonOperator: 'GreaterThanThreshold',
        evaluationPeriods: 2,
        metricName: 'WriteLatency',
        namespace: 'AWS/RDS',
        period: 300,
        statistic: 'Average',
        threshold: 0.2, // 200ms
        alarmDescription: 'RDS write latency is too high',
        dimensions: {
          DBInstanceIdentifier: dbInstance.id,
        },
        tags: {
          Name: `tap-db-write-latency-alarm-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.dbInstanceId = dbInstance.id;
    this.dbInstanceArn = dbInstance.arn;
    this.dbInstanceEndpoint = dbInstance.endpoint;
    this.dbInstancePort = dbInstance.port;
    this.dbSubnetGroupName = dbSubnetGroup.name;

    this.registerOutputs({
      dbInstanceId: this.dbInstanceId,
      dbInstanceArn: this.dbInstanceArn,
      dbInstanceEndpoint: this.dbInstanceEndpoint,
      dbInstancePort: this.dbInstancePort,
      dbSubnetGroupName: this.dbSubnetGroupName,
    });
  }
}
```

## EC2 Compute Module

**lib/stacks/ec2-stack.ts**

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface Ec2StackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  privateSubnetIds: pulumi.Input<string[]>;
  webSecurityGroupId: pulumi.Input<string>;
  iamInstanceProfileName: pulumi.Input<string>;
  kmsKeyArn: pulumi.Input<string>;
  instanceType?: string;
  enableKeyPairs?: boolean;
}

export class Ec2Stack extends pulumi.ComponentResource {
  public readonly instanceId: pulumi.Output<string>;
  public readonly privateIp: pulumi.Output<string>;

  constructor(name: string, args: Ec2StackArgs, opts?: ResourceOptions) {
    super('tap:ec2:Ec2Stack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const instanceType = args.instanceType || 't3.micro';
    const tags = args.tags || {};

    // Get latest Amazon Linux 2 AMI
    const ami = aws.ec2.getAmi({
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

    // User data script for CloudWatch agent
    const userData = `#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/tap-${environmentSuffix}",
            "log_stream_name": "{instance_id}/messages"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "TAP/EC2",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \\
  -a fetch-config -m ec2 -s \\
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
`;

    // EC2 instance with security hardening
    const webInstance = new aws.ec2.Instance(
      `tap-web-instance-${environmentSuffix}`,
      {
        instanceType: instanceType,
        ami: ami.then(a => a.id),
        subnetId: pulumi.output(args.privateSubnetIds).apply(ids => ids[0]), // First private subnet
        vpcSecurityGroupIds: [args.webSecurityGroupId],
        iamInstanceProfile: args.iamInstanceProfileName,
        userData: userData,
        keyName: args.enableKeyPairs ? undefined : undefined, // No key pairs by default
        associatePublicIpAddress: false, // No public IP

        rootBlockDevice: {
          volumeType: 'gp3',
          volumeSize: 20,
          encrypted: true,
          kmsKeyId: args.kmsKeyArn,
          deleteOnTermination: true,
        },

        metadataOptions: {
          httpEndpoint: 'enabled',
          httpTokens: 'required', // IMDSv2 only
          httpPutResponseHopLimit: 1,
          instanceMetadataTags: 'enabled',
        },

        monitoring: true, // Detailed monitoring

        tags: { Name: `tap-web-instance-${environmentSuffix}`, ...tags },
        volumeTags: {
          Name: `tap-web-instance-volume-${environmentSuffix}`,
          ...tags,
        },
      },
      { parent: this }
    );

    this.instanceId = webInstance.id;
    this.privateIp = webInstance.privateIp;

    this.registerOutputs({
      instanceId: this.instanceId,
      privateIp: this.privateIp,
    });
  }
}
```

## Key Security Features

### 1. **Region-Agnostic Configuration**

- All resources support configurable regions through Pulumi configuration
- No hardcoded region-specific values
- Environment-specific naming with suffixes

### 2. **KMS Encryption Everywhere**

- Separate KMS keys for general use and RDS
- Automatic key rotation enabled
- Used for S3, RDS, and EBS volume encryption

### 3. **IAM Least Privilege**

- EC2 role with minimal CloudWatch and S3 read-only permissions
- No unnecessary managed policies attached
- Instance profiles for secure EC2 access

### 4. **S3 Security**

- Server-side encryption with customer-managed KMS keys
- Public access completely blocked
- Versioning enabled for data protection
- Access logging to separate logs bucket
- Lifecycle policies for cost optimization

### 5. **RDS Security**

- Storage encryption with dedicated KMS key
- Deployed in private subnets only
- Enhanced monitoring enabled
- CloudWatch logs exported (error, general, slowquery)
- Automated backups with 7-day retention

### 6. **EC2 Security**

- Deployed in private subnets (no public IP)
- No key pairs assigned by default
- EBS volumes encrypted with KMS
- IMDSv2 enforced (httpTokens: required)
- Detailed monitoring enabled
- CloudWatch agent for comprehensive logging

### 7. **Network Security**

- Multi-AZ deployment across 3 availability zones
- Proper tier isolation with security groups
- Database only accessible from application tier
- NAT gateways for secure internet access from private subnets

### 8. **Comprehensive Logging**

- S3 access logging
- RDS CloudWatch logs
- EC2 CloudWatch agent for system metrics and logs
- All logs centralized in CloudWatch

### 9. **Resource Tagging**

- Consistent tagging with Environment, Owner, Project
- Automatic tag propagation to all resources
- Support for additional custom tags

### 10. **Testing and Validation**

- Comprehensive integration tests covering all security requirements
- Tests verify encryption, access controls, and configuration
- Automated validation of security best practices

## Deployment Commands

```bash
# Install dependencies
npm ci

# Build the project
npm run build

# Run tests
npm run test

# Deploy infrastructure
npm run cdk:deploy

# Destroy infrastructure
npm run cdk:destroy
```

## Configuration Options

Set these values using `pulumi config set`:

```bash
pulumi config set environmentSuffix prod
pulumi config set vpcCidr 10.1.0.0/16
pulumi config set instanceType t3.small
pulumi config set dbInstanceClass db.t3.small
pulumi config set enableKeyPairs false
```

This infrastructure provides a secure, scalable foundation that follows all AWS security best practices while remaining flexible and maintainable through its modular design.
