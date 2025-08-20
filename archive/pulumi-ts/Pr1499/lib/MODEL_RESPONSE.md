I'll provide you with a comprehensive, production-ready Pulumi TypeScript infrastructure setup that adheres to security best practices and is specifically configured for the `ap-south-1` region.

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

// Configure the AWS provider for ap-south-1 region
const provider = new aws.Provider('ap-south-1-provider', {
  region: 'ap-south-1',
});

// Common tags for all resources
const commonTags = {
  Environment: 'production',
  Project: 'secure-infrastructure',
  ManagedBy: 'pulumi',
  Region: 'ap-south-1',
};

// Get available availability zones in ap-south-1
const availabilityZones = aws.getAvailabilityZones(
  {
    state: 'available',
  },
  { provider }
);

/**
 * VPC Configuration
 * Creates a VPC with DNS support enabled for production workloads
 */
const vpc = new aws.ec2.Vpc(
  'main-vpc',
  {
    cidrBlock: '10.0.0.0/16',
    enableDnsHostnames: true,
    enableDnsSupport: true,
    tags: {
      ...commonTags,
      Name: 'main-vpc',
    },
  },
  { provider }
);

/**
 * Internet Gateway
 * Required for public subnet internet access
 */
const internetGateway = new aws.ec2.InternetGateway(
  'main-igw',
  {
    vpcId: vpc.id,
    tags: {
      ...commonTags,
      Name: 'main-igw',
    },
  },
  { provider }
);

/**
 * Public Subnets
 * Two public subnets in different AZs for high availability
 */
const publicSubnet1 = new aws.ec2.Subnet(
  'public-subnet-1',
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.1.0/24',
    availabilityZone: availabilityZones.then(az => az.names[0]),
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: 'public-subnet-1',
      Type: 'public',
    },
  },
  { provider }
);

const publicSubnet2 = new aws.ec2.Subnet(
  'public-subnet-2',
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.2.0/24',
    availabilityZone: availabilityZones.then(az => az.names[1]),
    mapPublicIpOnLaunch: true,
    tags: {
      ...commonTags,
      Name: 'public-subnet-2',
      Type: 'public',
    },
  },
  { provider }
);

/**
 * Route Table for Public Subnets
 * Routes traffic to the internet gateway
 */
const publicRouteTable = new aws.ec2.RouteTable(
  'public-route-table',
  {
    vpcId: vpc.id,
    routes: [
      {
        cidrBlock: '0.0.0.0/0',
        gatewayId: internetGateway.id,
      },
    ],
    tags: {
      ...commonTags,
      Name: 'public-route-table',
    },
  },
  { provider }
);

// Associate route table with public subnets
const publicSubnet1Association = new aws.ec2.RouteTableAssociation(
  'public-subnet-1-association',
  {
    subnetId: publicSubnet1.id,
    routeTableId: publicRouteTable.id,
  },
  { provider }
);

const publicSubnet2Association = new aws.ec2.RouteTableAssociation(
  'public-subnet-2-association',
  {
    subnetId: publicSubnet2.id,
    routeTableId: publicRouteTable.id,
  },
  { provider }
);

/**
 * Security Groups
 * Restrictive security groups following least privilege principle
 */
const webSecurityGroup = new aws.ec2.SecurityGroup(
  'web-security-group',
  {
    name: 'web-security-group',
    description: 'Security group for web servers with SSH and HTTP access',
    vpcId: vpc.id,

    // Inbound rules
    ingress: [
      {
        description: 'SSH access from internet',
        fromPort: 22,
        toPort: 22,
        protocol: 'tcp',
        cidrBlocks: ['0.0.0.0/0'],
      },
      {
        description: 'HTTP access from internet',
        fromPort: 80,
        toPort: 80,
        protocol: 'tcp',
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],

    // Outbound rules (explicit for security)
    egress: [
      {
        description: 'All outbound traffic',
        fromPort: 0,
        toPort: 0,
        protocol: '-1',
        cidrBlocks: ['0.0.0.0/0'],
      },
    ],

    tags: {
      ...commonTags,
      Name: 'web-security-group',
    },
  },
  { provider }
);

/**
 * KMS Key for Encryption
 * Used for encrypting S3 bucket and DynamoDB table
 */
const kmsKey = new aws.kms.Key(
  'infrastructure-kms-key',
  {
    description: 'KMS key for infrastructure encryption',
    keyUsage: 'ENCRYPT_DECRYPT',
    keySpec: 'SYMMETRIC_DEFAULT',

    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'Enable IAM User Permissions',
          Effect: 'Allow',
          Principal: {
            AWS: pulumi.interpolate`arn:aws:iam::${aws
              .getCallerIdentity({}, { provider })
              .then(id => id.accountId)}:root`,
          },
          Action: 'kms:*',
          Resource: '*',
        },
        {
          Sid: 'Allow CloudTrail to encrypt logs',
          Effect: 'Allow',
          Principal: {
            Service: 'cloudtrail.amazonaws.com',
          },
          Action: ['kms:GenerateDataKey*', 'kms:DescribeKey'],
          Resource: '*',
        },
      ],
    }),

    tags: {
      ...commonTags,
      Name: 'infrastructure-kms-key',
    },
  },
  { provider }
);

const kmsKeyAlias = new aws.kms.Alias(
  'infrastructure-kms-key-alias',
  {
    name: 'alias/infrastructure-key',
    targetKeyId: kmsKey.keyId,
  },
  { provider }
);

/**
 * S3 Bucket for CloudTrail Logs
 * Encrypted bucket with versioning and lifecycle policies
 */
const cloudtrailBucket = new aws.s3.Bucket(
  'cloudtrail-logs-bucket',
  {
    bucket: pulumi.interpolate`cloudtrail-logs-${aws
      .getCallerIdentity({}, { provider })
      .then(id => id.accountId)}-ap-south-1`,

    tags: {
      ...commonTags,
      Name: 'cloudtrail-logs-bucket',
      Purpose: 'CloudTrail logs storage',
    },
  },
  { provider }
);

// Enable versioning on the S3 bucket
const cloudtrailBucketVersioning = new aws.s3.BucketVersioningV2(
  'cloudtrail-bucket-versioning',
  {
    bucket: cloudtrailBucket.id,
    versioningConfiguration: {
      status: 'Enabled',
    },
  },
  { provider }
);

// Configure server-side encryption
const cloudtrailBucketEncryption =
  new aws.s3.BucketServerSideEncryptionConfigurationV2(
    'cloudtrail-bucket-encryption',
    {
      bucket: cloudtrailBucket.id,
      serverSideEncryptionConfiguration: {
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              kmsMasterKeyId: kmsKey.arn,
              sseAlgorithm: 'aws:kms',
            },
            bucketKeyEnabled: true,
          },
        ],
      },
    },
    { provider }
  );

// Block public access to the bucket
const cloudtrailBucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
  'cloudtrail-bucket-pab',
  {
    bucket: cloudtrailBucket.id,
    blockPublicAcls: true,
    blockPublicPolicy: true,
    ignorePublicAcls: true,
    restrictPublicBuckets: true,
  },
  { provider }
);

// S3 bucket policy for CloudTrail
const cloudtrailBucketPolicy = new aws.s3.BucketPolicy(
  'cloudtrail-bucket-policy',
  {
    bucket: cloudtrailBucket.id,
    policy: pulumi
      .all([cloudtrailBucket.arn, aws.getCallerIdentity({}, { provider })])
      .apply(([bucketArn, identity]) =>
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Sid: 'AWSCloudTrailAclCheck',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:GetBucketAcl',
              Resource: bucketArn,
            },
            {
              Sid: 'AWSCloudTrailWrite',
              Effect: 'Allow',
              Principal: {
                Service: 'cloudtrail.amazonaws.com',
              },
              Action: 's3:PutObject',
              Resource: `${bucketArn}/*`,
              Condition: {
                StringEquals: {
                  's3:x-amz-acl': 'bucket-owner-full-control',
                },
              },
            },
          ],
        })
      ),
  },
  { provider }
);

/**
 * CloudTrail Configuration
 * Logs all API calls for security monitoring
 */
const cloudTrail = new aws.cloudtrail.Trail(
  'main-cloudtrail',
  {
    name: 'main-cloudtrail',
    s3BucketName: cloudtrailBucket.bucket,
    includeGlobalServiceEvents: true,
    isMultiRegionTrail: true,
    enableLogFileValidation: true,
    kmsKeyId: kmsKey.arn,

    eventSelectors: [
      {
        readWriteType: 'All',
        includeManagementEvents: true,
        dataResources: [
          {
            type: 'AWS::S3::Object',
            values: ['arn:aws:s3:::*/*'],
          },
        ],
      },
    ],

    tags: {
      ...commonTags,
      Name: 'main-cloudtrail',
    },
  },
  {
    provider,
    dependsOn: [cloudtrailBucketPolicy],
  }
);

/**
 * IAM Role for EC2 Application Deployment
 * Follows principle of least privilege
 */
const ec2Role = new aws.iam.Role(
  'ec2-deployment-role',
  {
    name: 'ec2-deployment-role',
    description: 'IAM role for EC2 instances with minimal required permissions',

    assumeRolePolicy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'sts:AssumeRole',
          Effect: 'Allow',
          Principal: {
            Service: 'ec2.amazonaws.com',
          },
        },
      ],
    }),

    tags: {
      ...commonTags,
      Name: 'ec2-deployment-role',
    },
  },
  { provider }
);

// IAM policy for EC2 deployment actions only
const ec2DeploymentPolicy = new aws.iam.Policy(
  'ec2-deployment-policy',
  {
    name: 'ec2-deployment-policy',
    description:
      'Policy allowing only necessary EC2 actions for application deployment',

    policy: JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'ec2:DescribeInstances',
            'ec2:DescribeInstanceStatus',
            'ec2:DescribeInstanceAttribute',
            'ec2:DescribeTags',
            'ec2:CreateTags',
            'ec2:StartInstances',
            'ec2:StopInstances',
            'ec2:RebootInstances',
          ],
          Resource: '*',
          Condition: {
            StringEquals: {
              'ec2:Region': 'ap-south-1',
            },
          },
        },
        {
          Effect: 'Allow',
          Action: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogStreams',
          ],
          Resource: pulumi.interpolate`arn:aws:logs:ap-south-1:${aws
            .getCallerIdentity({}, { provider })
            .then(id => id.accountId)}:*`,
        },
      ],
    }),

    tags: {
      ...commonTags,
      Name: 'ec2-deployment-policy',
    },
  },
  { provider }
);

// Attach policy to role
const ec2RolePolicyAttachment = new aws.iam.RolePolicyAttachment(
  'ec2-role-policy-attachment',
  {
    role: ec2Role.name,
    policyArn: ec2DeploymentPolicy.arn,
  },
  { provider }
);

// Instance profile for EC2 instances
const ec2InstanceProfile = new aws.iam.InstanceProfile(
  'ec2-instance-profile',
  {
    name: 'ec2-deployment-instance-profile',
    role: ec2Role.name,

    tags: {
      ...commonTags,
      Name: 'ec2-instance-profile',
    },
  },
  { provider }
);

/**
 * DynamoDB Table with Provisioned Throughput
 * Encrypted at rest using KMS
 */
const dynamoTable = new aws.dynamodb.Table(
  'application-table',
  {
    name: 'application-data-table',

    // Provisioned billing mode for predictable workloads
    billingMode: 'PROVISIONED',
    readCapacity: 10, // Read capacity units for warm throughput
    writeCapacity: 5, // Write capacity units for warm throughput

    // Hash key (partition key)
    hashKey: 'id',

    attributes: [
      {
        name: 'id',
        type: 'S', // String type
      },
      {
        name: 'timestamp',
        type: 'N', // Number type for GSI
      },
    ],

    // Global Secondary Index for query flexibility
    globalSecondaryIndexes: [
      {
        name: 'timestamp-index',
        hashKey: 'timestamp',
        readCapacity: 5,
        writeCapacity: 2,
        projectionType: 'ALL',
      },
    ],

    // Enable encryption at rest
    serverSideEncryption: {
      enabled: true,
      kmsKeyArn: kmsKey.arn,
    },

    // Enable point-in-time recovery for production
    pointInTimeRecovery: {
      enabled: true,
    },

    // Enable deletion protection
    deletionProtectionEnabled: true,

    tags: {
      ...commonTags,
      Name: 'application-data-table',
      BackupRequired: 'true',
    },
  },
  { provider }
);

/**
 * Outputs for reference
 */
export const vpcId = vpc.id;
export const publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];
export const securityGroupId = webSecurityGroup.id;
export const iamRoleArn = ec2Role.arn;
export const instanceProfileName = ec2InstanceProfile.name;
export const dynamoTableName = dynamoTable.name;
export const kmsKeyId = kmsKey.keyId;
export const kmsKeyArn = kmsKey.arn;
export const cloudtrailArn = cloudTrail.arn;
export const s3BucketName = cloudtrailBucket.bucket;

// Export availability zones for reference
export const availableAZs = availabilityZones.then(az => az.names);
```

## Key Security Features Implemented

### 1. **Network Security**

- VPC with private CIDR block (10.0.0.0/16)
- Public subnets in separate AZs for high availability
- Security groups with minimal required access (ports 22 and 80 only)
- Explicit egress rules for better control

### 2. **Encryption**

- KMS key for encrypting all sensitive data
- S3 bucket encryption for CloudTrail logs
- DynamoDB encryption at rest
- Bucket key enabled for cost optimization

### 3. **IAM Best Practices**

- Principle of least privilege for EC2 role
- Region-specific permissions (ap-south-1 only)
- Specific resource ARNs where possible
- Separate policies for different functions

### 4. **Monitoring & Auditing**

- CloudTrail enabled for all regions
- Log file validation enabled
- S3 bucket with versioning for log retention
- Public access blocked on S3 bucket

### 5. **DynamoDB Configuration**

- Provisioned throughput mode for predictable workloads
- Point-in-time recovery enabled
- Deletion protection enabled
- Global Secondary Index for query flexibility

### 6. **Production Readiness**

- Comprehensive tagging strategy
- Resource dependencies properly managed
- Modular, commented code structure
- Error handling through Pulumi's dependency system

This infrastructure setup provides a secure, production-ready foundation in the ap-south-1 region with all the requested components while following AWS security best practices.
