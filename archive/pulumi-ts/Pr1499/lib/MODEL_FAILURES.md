# Model Response Failures

## Prompt Requirement Violations

### 1. Security Issue: Insufficient Security Architecture Beyond Basic Requirements

**What model did wrong**: Only implemented basic prompt requirements without adding production-ready security enhancements.

**What was the issue**: Prompt asked for "production-ready" and "strict security" but model didn't go beyond minimum requirements to add essential security features.

**Wrong code generated**:

```typescript
// Only basic requirements implemented:
// - VPC with public subnets only
// - Basic security group
// - Basic IAM role
// - CloudTrail and S3
// - DynamoDB
// Missing: Private subnets, NAT Gateway, database security group, monitoring, etc.
```

**Correct code**:

```typescript
// Should have added production security features:
// - Private subnets for database tier
// - NAT Gateway for secure outbound access
// - Database security group
// - GuardDuty threat detection
// - AWS Config compliance monitoring
// - CloudWatch alarms and SNS alerting
// - VPC endpoints for secure AWS service access
```

### 2. Code Issue: Missing Pulumi Best Practices Implementation

**What model did wrong**: Used flat code structure instead of implementing Pulumi ComponentResource best practices as requested.

**What was the issue**: Prompt specifically asked for "Pulumi best practices for maintainability and clarity" but model provided flat, non-reusable code.

**Wrong code generated**:

```typescript
// Flat structure with direct exports
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

const provider = new aws.Provider(/*...*/);
const vpc = new aws.ec2.Vpc(/*...*/);
// ... more resources

export const vpcId = vpc.id;
export const publicSubnetIds = [
  /*...*/
];
```

**Correct code**:

```typescript
// ComponentResource pattern for maintainability
export class SecureInfrastructure extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: SecureInfrastructureArgs,
    opts?: ResourceOptions
  ) {
    super('tap:infrastructure:SecureInfrastructure', name, args, opts);
    // Proper encapsulation and reusability
  }
}
```

### 3. Code Issue: Inadequate Commenting and Documentation

**What model did wrong**: Provided basic comments but missed comprehensive documentation for production maintainability.

**What was the issue**: Prompt asked for "commented infrastructure code" but model's comments were insufficient for production maintenance.

**Wrong code generated**:

```typescript
// Basic comments like:
/**
 * VPC Configuration
 * Creates a VPC with DNS support enabled for production workloads
 */
const vpc = new aws.ec2.Vpc(/*...*/);
```

**Correct code**:

```typescript
/**
 * SecureInfrastructure component that creates a complete AWS infrastructure
 * with VPC, security groups, IAM roles, CloudTrail, and DynamoDB.
 *
 * This component follows AWS Well-Architected Framework principles:
 * - Security: Multi-tier architecture with private subnets
 * - Reliability: Multi-AZ deployment with proper monitoring
 * - Performance: Provisioned DynamoDB with appropriate capacity
 * - Cost Optimization: S3 lifecycle policies for log retention
 * - Operational Excellence: Comprehensive monitoring and alerting
 */
```

## Implementation Failures

## 1. Deprecation Issue: Deprecated S3 Resource Usage

**What model did wrong**: Used deprecated S3 resources that will cause build failures and warnings.

**What was the issue**: Model used BucketVersioningV2 and BucketServerSideEncryptionConfigurationV2 instead of the current versions.

**Wrong code generated**:

```typescript
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
```

**Correct code**:

```typescript
void new aws.s3.BucketVersioning(
  `cloudtrail-bucket-versioning-${args.environment}`,
  {
    bucket: cloudtrailBucket.id,
    versioningConfiguration: {
      status: 'Enabled',
    },
  },
  { provider, parent: this }
);

void new aws.s3.BucketServerSideEncryptionConfiguration(
  `cloudtrail-bucket-encryption-${args.environment}`,
  {
    bucket: cloudtrailBucket.id,
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
  { provider, parent: this }
);
```

## 2. Build Issue: KMS Policy Implementation Error

**What model did wrong**: Used incorrect pulumi.interpolate syntax for KMS policy that would cause runtime errors.

**What was the issue**: Incorrect async handling in policy JSON generation causing build failures.

**Wrong code generated**:

```typescript
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
  ],
}),
```

**Correct code**:

```typescript
policy: pulumi
  .all([aws.getCallerIdentity({}, { provider })])
  .apply(([identity]) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'Enable IAM User Permissions',
          Effect: 'Allow',
          Principal: {
            AWS: `arn:aws:iam::${identity.accountId}:root`,
          },
          Action: 'kms:*',
          Resource: '*',
        },
      ],
    })
  ),
```

## 3. Build Issue: S3 Bucket Naming Syntax Error

**What model did wrong**: Used incorrect pulumi.interpolate syntax for S3 bucket naming that would cause build failures.

**What was the issue**: Improper async handling in bucket name generation.

**Wrong code generated**:

```typescript
const cloudtrailBucket = new aws.s3.Bucket(
  'cloudtrail-logs-bucket',
  {
    bucket: pulumi.interpolate`cloudtrail-logs-${aws
      .getCallerIdentity({}, { provider })
      .then(id => id.accountId)}-ap-south-1`,
  },
  { provider }
);
```

**Correct code**:

```typescript
const cloudtrailBucket = new aws.s3.Bucket(
  `cloudtrail-logs-bucket-${args.environment}`,
  {
    bucket: pulumi
      .all([aws.getCallerIdentity({}, { provider })])
      .apply(
        ([identity]) =>
          `cloudtrail-logs-${identity.accountId}-ap-south-1-${args.environment}`
      ),
  },
  { provider, parent: this }
);
```

## 4. Security Issue: SSH Access Vulnerability

**What model did wrong**: Allowed SSH access (port 22) from the internet, creating a major security vulnerability.

**What was the issue**: Exposed SSH port to 0.0.0.0/0 violating security best practices.

**Wrong code generated**:

```typescript
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
```

**Correct code**:

```typescript
ingress: [
  {
    description: 'HTTP access from internet',
    fromPort: 80,
    toPort: 80,
    protocol: 'tcp',
    cidrBlocks: ['0.0.0.0/0'],
  },
  {
    description: 'HTTPS access from internet',
    fromPort: 443,
    toPort: 443,
    protocol: 'tcp',
    cidrBlocks: ['0.0.0.0/0'],
  },
],
```

## 5. Security Issue: Missing Private Subnets Architecture

**What model did wrong**: Only created public subnets, missing private subnets for secure database and application tiers.

**What was the issue**: No network segmentation for database tier security.

**Wrong code generated**:

```typescript
const publicSubnet1 = new aws.ec2.Subnet('public-subnet-1', {
  cidrBlock: '10.0.1.0/24',
  mapPublicIpOnLaunch: true,
});

const publicSubnet2 = new aws.ec2.Subnet('public-subnet-2', {
  cidrBlock: '10.0.2.0/24',
  mapPublicIpOnLaunch: true,
});
```

**Correct code**:

```typescript
const privateSubnet1 = new aws.ec2.Subnet(
  `private-subnet-1-${args.environment}`,
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.10.0/24',
    availabilityZone: availabilityZones.then(az => az.names[0]),
    mapPublicIpOnLaunch: false,
    tags: {
      ...commonTags,
      Name: `private-subnet-1-${args.environment}`,
      Type: 'private',
    },
  },
  { provider, parent: this }
);

const privateSubnet2 = new aws.ec2.Subnet(
  `private-subnet-2-${args.environment}`,
  {
    vpcId: vpc.id,
    cidrBlock: '10.0.11.0/24',
    availabilityZone: availabilityZones.then(az => az.names[1]),
    mapPublicIpOnLaunch: false,
    tags: {
      ...commonTags,
      Name: `private-subnet-2-${args.environment}`,
      Type: 'private',
    },
  },
  { provider, parent: this }
);
```

## 6. Security Issue: Missing Database Security Group

**What model did wrong**: Only created web security group, missing dedicated database security group with restricted access.

**What was the issue**: No network isolation for database tier.

**Wrong code generated**:

```typescript
const webSecurityGroup = new aws.ec2.SecurityGroup('web-security-group', {
  // ... only web security group created
});
```

**Correct code**:

```typescript
const dbSecurityGroup = new aws.ec2.SecurityGroup(
  `database-security-group-${args.environment}`,
  {
    name: `database-security-group-${args.environment}`,
    description:
      'Security group for database tier - only accessible from web tier',
    vpcId: vpc.id,
    ingress: [
      {
        description: 'MySQL/Aurora access from web tier',
        fromPort: 3306,
        toPort: 3306,
        protocol: 'tcp',
        securityGroups: [webSecurityGroup.id],
      },
      {
        description: 'PostgreSQL access from web tier',
        fromPort: 5432,
        toPort: 5432,
        protocol: 'tcp',
        securityGroups: [webSecurityGroup.id],
      },
    ],
    egress: [],
    tags: {
      ...commonTags,
      Name: `database-security-group-${args.environment}`,
    },
  },
  { provider, parent: this }
);
```

## 7. Security Missed: CloudTrail S3 Bucket Policy Missing Security Conditions

**What model did wrong**: CloudTrail S3 bucket policy was missing critical security conditions and source ARN validation.

**What was the issue**: Missing AWS:SourceArn conditions allowing potential unauthorized access.

**Wrong code generated**:

```typescript
{
  Sid: 'AWSCloudTrailAclCheck',
  Effect: 'Allow',
  Principal: {
    Service: 'cloudtrail.amazonaws.com',
  },
  Action: 's3:GetBucketAcl',
  Resource: bucketArn,
  // Missing Condition for source ARN validation
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
      // Missing AWS:SourceArn condition
    },
  },
},
```

**Correct code**:

```typescript
{
  Sid: 'AWSCloudTrailAclCheck',
  Effect: 'Allow',
  Principal: {
    Service: 'cloudtrail.amazonaws.com',
  },
  Action: 's3:GetBucketAcl',
  Resource: bucketArn,
  Condition: {
    StringEquals: {
      'AWS:SourceArn': `arn:aws:cloudtrail:ap-south-1:${identity.accountId}:trail/main-cloudtrail-${args.environment}`,
    },
  },
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
      'AWS:SourceArn': `arn:aws:cloudtrail:ap-south-1:${identity.accountId}:trail/main-cloudtrail-${args.environment}`,
    },
  },
},
```

## 8. Least Privilege Issue: Overly Permissive IAM Policy

**What model did wrong**: IAM policy used incorrect syntax and had overly broad resource scope with excessive permissions.

**What was the issue**: Granted StartInstances, StopInstances, RebootInstances permissions violating least privilege principle.

**Wrong code generated**:

```typescript
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
        'ec2:StartInstances',    // Too permissive
        'ec2:StopInstances',     // Too permissive
        'ec2:RebootInstances',   // Too permissive
      ],
      Resource: '*',  // Too broad
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
        .then(id => id.accountId)}:*`,  // Incorrect syntax
    },
  ],
}),
```

**Correct code**:

```typescript
policy: pulumi
  .all([aws.getCallerIdentity({}, { provider })])
  .apply(([identity]) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Action: [
            'ec2:DescribeInstances',
            'ec2:DescribeInstanceStatus',
            'ec2:DescribeInstanceAttribute',
            'ec2:DescribeTags',
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
          Action: ['ec2:CreateTags'],
          Resource: [
            'arn:aws:ec2:ap-south-1:*:instance/*',
            'arn:aws:ec2:ap-south-1:*:volume/*',
          ],
          Condition: {
            StringEquals: {
              'ec2:CreateAction': ['RunInstances', 'CreateVolume'],
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
          Resource: `arn:aws:logs:ap-south-1:${identity.accountId}:log-group:/aws/ec2/*`,
        },
      ],
    })
  ),
```

## 9. Least Privilege Issue: Missing DynamoDB IAM Permissions

**What model did wrong**: Failed to include DynamoDB permissions in IAM policy for application deployment role.

**What was the issue**: EC2 instances would not be able to access DynamoDB table for application functionality.

**Wrong code generated**:

```typescript
// Missing DynamoDB permissions in IAM policy
policy: JSON.stringify({
  Version: '2012-10-17',
  Statement: [
    {
      Effect: 'Allow',
      Action: [
        'ec2:DescribeInstances',
        // ... EC2 actions only, no DynamoDB
      ],
    },
  ],
}),
```

**Correct code**:

```typescript
{
  Effect: 'Allow',
  Action: [
    'dynamodb:GetItem',
    'dynamodb:PutItem',
    'dynamodb:UpdateItem',
    'dynamodb:DeleteItem',
    'dynamodb:Query',
    'dynamodb:Scan',
  ],
  Resource: `arn:aws:dynamodb:ap-south-1:${identity.accountId}:table/application-data-table-${args.environment}`,
},
{
  Effect: 'Allow',
  Action: ['dynamodb:Query', 'dynamodb:Scan'],
  Resource: `arn:aws:dynamodb:ap-south-1:${identity.accountId}:table/application-data-table-${args.environment}/index/*`,
},
```

## 10. Code Issue: Missing Component Architecture Pattern

**What model did wrong**: Used flat infrastructure code without proper Pulumi ComponentResource pattern.

**What was the issue**: Created non-reusable, hard-to-manage infrastructure without proper encapsulation.

**Wrong code generated**:

```typescript
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

const provider = new aws.Provider('ap-south-1-provider', {
  region: 'ap-south-1',
});

const vpc = new aws.ec2.Vpc('main-vpc', {
  // ... direct resource creation
});

export const vpcId = vpc.id;
export const publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];
```

**Correct code**:

```typescript
export interface SecureInfrastructureArgs {
  environment: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class SecureInfrastructure extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];

  constructor(
    name: string,
    args: SecureInfrastructureArgs,
    opts?: ResourceOptions
  ) {
    super('tap:infrastructure:SecureInfrastructure', name, args, opts);

    const provider = new aws.Provider(
      `ap-south-1-provider-${args.environment}`,
      { region: 'ap-south-1' },
      { parent: this }
    );

    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
    });
  }
}
```

## 11. Security Missed: Missing SSM Session Manager Support

**What model did wrong**: Failed to implement SSM Session Manager for secure instance access without SSH.

**What was the issue**: No secure access mechanism provided after removing SSH access.

**Wrong code generated**:

```typescript
// No SSM Session Manager implementation
// Relies on SSH for instance access
```

**Correct code**:

```typescript
// Attach SSM managed instance core policy
void new aws.iam.RolePolicyAttachment(
  `ec2-ssm-policy-attachment-${args.environment}`,
  {
    role: ec2Role.name,
    policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  },
  { provider, parent: this }
);

// VPC Endpoints for SSM
const ssmEndpoint = new aws.ec2.VpcEndpoint(
  `ssm-endpoint-${args.environment}`,
  {
    vpcId: vpc.id,
    serviceName: 'com.amazonaws.ap-south-1.ssm',
    vpcEndpointType: 'Interface',
    subnetIds: [privateSubnet1.id, privateSubnet2.id],
    securityGroupIds: [ssmEndpointSecurityGroup.id],
    privateDnsEnabled: true,
  },
  { provider, parent: this }
);
```

## 12. Security Missed: Missing Security Monitoring and Alerting

**What model did wrong**: Failed to implement comprehensive security monitoring with SNS topics, CloudWatch alarms, and GuardDuty.

**What was the issue**: No threat detection or security event alerting capabilities.

**Wrong code generated**:

```typescript
// No security monitoring implementation
// No SNS topics for alerts
// No CloudWatch alarms
// No GuardDuty threat detection
```

**Correct code**:

```typescript
const securityAlertsTopic = new aws.sns.Topic(
  `security-alerts-topic-${args.environment}`,
  {
    name: `security-alerts-topic-${args.environment}`,
    displayName: 'Security Alerts and Monitoring',
  },
  { provider, parent: this }
);

const guardDutyDetector = new aws.guardduty.Detector(
  `main-guardduty-detector-${args.environment}`,
  {
    enable: true,
    findingPublishingFrequency: 'FIFTEEN_MINUTES',
  },
  { provider, parent: this }
);

void new aws.cloudwatch.MetricAlarm(
  `dynamodb-read-throttle-alarm-${args.environment}`,
  {
    name: `dynamodb-read-throttle-alarm-${args.environment}`,
    metricName: 'ReadThrottledEvents',
    namespace: 'AWS/DynamoDB',
    statistic: 'Sum',
    period: 300,
    evaluationPeriods: 2,
    threshold: 1,
    comparisonOperator: 'GreaterThanOrEqualToThreshold',
    dimensions: {
      TableName: dynamoTable.name,
    },
    alarmActions: [securityAlertsTopic.arn],
  },
  { provider, parent: this }
);
```

## 13. Security Missed: Missing AWS Config Compliance Monitoring

**What model did wrong**: Failed to implement AWS Config for compliance monitoring and configuration drift detection.

**What was the issue**: No compliance monitoring or configuration change tracking.

**Wrong code generated**:

```typescript
// No AWS Config implementation
// No compliance rules
// No configuration monitoring
```

**Correct code**:

```typescript
const configRecorder = new aws.cfg.Recorder(
  `config-recorder-${args.environment}`,
  {
    name: `config-recorder-${args.environment}`,
    roleArn: configRole.arn,
    recordingGroup: {
      allSupported: true,
      includeGlobalResourceTypes: true,
    },
  },
  { provider, parent: this }
);

void new aws.cfg.Rule(
  `encrypted-volumes-rule-${args.environment}`,
  {
    name: `encrypted-volumes-rule-${args.environment}`,
    source: {
      owner: 'AWS',
      sourceIdentifier: 'ENCRYPTED_VOLUMES',
    },
  },
  { provider, parent: this }
);
```

## 14. Missing S3 Lifecycle Management

**What model did wrong**: Failed to implement S3 lifecycle policies for cost optimization and compliance retention.

**What was the issue**: No cost optimization for CloudTrail logs storage.

**Wrong code generated**:

```typescript
// No S3 lifecycle configuration
// No cost optimization for CloudTrail logs
```

**Correct code**:

```typescript
void new aws.s3.BucketLifecycleConfiguration(
  `cloudtrail-bucket-lifecycle-${args.environment}`,
  {
    bucket: cloudtrailBucket.id,
    rules: [
      {
        id: 'cloudtrail-logs-lifecycle',
        status: 'Enabled',
        transitions: [
          {
            days: 30,
            storageClass: 'STANDARD_IA',
          },
          {
            days: 90,
            storageClass: 'GLACIER',
          },
          {
            days: 365,
            storageClass: 'DEEP_ARCHIVE',
          },
        ],
        expiration: {
          days: 2555, // 7 years retention
        },
      },
    ],
  },
  { provider, parent: this }
);
```

## 15. Missing NAT Gateway for Private Subnets

**What model did wrong**: Failed to implement NAT Gateway for secure outbound internet access from private subnets.

**What was the issue**: Private subnets would have no internet access for updates and external API calls.

**Wrong code generated**:

```typescript
// No NAT Gateway implementation
// Private subnets would have no internet access
```

**Correct code**:

```typescript
const natEip = new aws.ec2.Eip(
  `nat-eip-${args.environment}`,
  {
    domain: 'vpc',
    tags: {
      ...commonTags,
      Name: `nat-eip-${args.environment}`,
    },
  },
  { provider, parent: this }
);

const natGateway = new aws.ec2.NatGateway(
  `nat-gateway-${args.environment}`,
  {
    allocationId: natEip.id,
    subnetId: publicSubnet1.id,
    tags: {
      ...commonTags,
      Name: `nat-gateway-${args.environment}`,
    },
  },
  { provider, parent: this }
);
```

## 16. Code Issue: Missing Environment Parameterization

**What model did wrong**: Created hardcoded infrastructure without environment parameterization, preventing proper multi-environment deployments.

**What was the issue**: No way to deploy the same infrastructure to different environments.

**Wrong code generated**:

```typescript
const commonTags = {
  Environment: 'production', // Hardcoded
  Project: 'secure-infrastructure',
};
```

**Correct code**:

```typescript
export interface SecureInfrastructureArgs {
  environment: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

const commonTags = {
  Environment: args.environment, // Parameterized
  Project: 'secure-infrastructure',
  ...args.tags,
};
```

## 17. Code Issue: Missing Output Registration

**What model did wrong**: Used simple exports instead of proper Pulumi ComponentResource output registration.

**What was the issue**: Outputs not properly managed within component resource pattern.

**Wrong code generated**:

```typescript
// Simple exports without proper output registration
export const vpcId = vpc.id;
export const publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];
```

**Correct code**:

```typescript
// Proper output registration in ComponentResource
this.registerOutputs({
  vpcId: this.vpcId,
  publicSubnetIds: this.publicSubnetIds,
  privateSubnetIds: this.privateSubnetIds,
  // ... all outputs
});
```
