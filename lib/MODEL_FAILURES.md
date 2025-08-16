# Model Response Failures

## 1. Deprecated S3 Resource Usage

**Issue Type**: Deprecation Issue
**Description**: Model used deprecated S3 resources that will cause build failures and warnings.

**Model Code**:
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

**Correct Code**:
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

## 2. KMS Policy Implementation Issue

**Issue Type**: IAM/Security Issue
**Description**: Model used incorrect pulumi.interpolate syntax for KMS policy that would cause runtime errors.

**Model Code**:
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

**Correct Code**:
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

## 3. S3 Bucket Naming Syntax Error

**Issue Type**: Build Failure
**Description**: Model used incorrect pulumi.interpolate syntax for S3 bucket naming that would cause build failures.

**Model Code**:
```typescript
const cloudtrailBucket = new aws.s3.Bucket(
  'cloudtrail-logs-bucket',
  {
    bucket: pulumi.interpolate`cloudtrail-logs-${aws
      .getCallerIdentity({}, { provider })
      .then(id => id.accountId)}-ap-south-1`,
    // ...
  },
  { provider }
);
```

**Correct Code**:
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
    // ...
  },
  { provider, parent: this }
);
```

## 4. CloudTrail S3 Bucket Policy Security Issue

**Issue Type**: Security Issue
**Description**: Model's CloudTrail S3 bucket policy was missing critical security conditions and source ARN validation.

**Model Code**:
```typescript
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
          ],
        })
      ),
  },
  { provider }
);
```

**Correct Code**:
```typescript
const cloudtrailBucketPolicy = new aws.s3.BucketPolicy(
  `cloudtrail-bucket-policy-${args.environment}`,
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
          ],
        })
      ),
  },
  { provider, parent: this }
);
```

## 5. IAM Policy Resource Scope Issue

**Issue Type**: IAM/Security Issue
**Description**: Model's IAM policy used incorrect pulumi.interpolate syntax and had overly broad resource scope.

**Model Code**:
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

**Correct Code**:
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

## 6. Missing Component Architecture Pattern

**Issue Type**: Architecture Issue
**Description**: Model used flat resource structure instead of Pulumi ComponentResource pattern, making it non-reusable and hard to manage.

**Model Code**:
```typescript
// Flat structure with exports at the end
const vpc = new aws.ec2.Vpc(/*...*/);
const publicSubnet1 = new aws.ec2.Subnet(/*...*/);
// ... more resources

export const vpcId = vpc.id;
export const publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];
// ... more exports
```

**Correct Code**:
```typescript
export interface SecureInfrastructureArgs {
  environment: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class SecureInfrastructure extends pulumi.ComponentResource {
  public readonly vpcId: pulumi.Output<string>;
  public readonly publicSubnetIds: pulumi.Output<string>[];
  // ... more outputs

  constructor(
    name: string,
    args: SecureInfrastructureArgs,
    opts?: ResourceOptions
  ) {
    super('tap:infrastructure:SecureInfrastructure', name, args, opts);

    // Resources created with proper parent relationship
    const vpc = new aws.ec2.Vpc(
      `main-vpc-${args.environment}`,
      {/*...*/},
      { provider, parent: this }
    );

    // Set outputs
    this.vpcId = vpc.id;
    this.publicSubnetIds = [publicSubnet1.id, publicSubnet2.id];

    // Register outputs
    this.registerOutputs({
      vpcId: this.vpcId,
      publicSubnetIds: this.publicSubnetIds,
      // ... more outputs
    });
  }
}
```

## 18. SSH Access Security Vulnerability

**Issue**: Model included SSH access (port 22) from the internet, which is a major security risk.

**Model Code**:

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

**What We Added**:

```typescript
// NO SSH ACCESS - Following security best practices
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

## 2. Missing Private Subnets and Multi-Tier Architecture

**Issue**: Model only created public subnets, missing private subnets for database tier and secure architecture.

**Model Code**: Only had public subnets:

```typescript
const publicSubnet1 = new aws.ec2.Subnet(/*...*/);
const publicSubnet2 = new aws.ec2.Subnet(/*...*/);
```

**What We Added**:

```typescript
// Private subnets for database and internal services
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

// NAT Gateway for secure outbound access
const natGateway = new aws.ec2.NatGateway(/*...*/);
```

## 3. Missing Database Security Group

**Issue**: Model only had one security group, missing database tier isolation.

**Model Code**: Only had `webSecurityGroup`.

**What We Added**:

```typescript
const dbSecurityGroup = new aws.ec2.SecurityGroup(
  `database-security-group-${args.environment}`,
  {
    name: `database-security-group-${args.environment}`,
    description:
      'Security group for database tier - only accessible from web tier',
    vpcId: vpc.id,
    // Only allow access from web security group
    ingress: [
      {
        description: 'MySQL/Aurora access from web tier',
        fromPort: 3306,
        toPort: 3306,
        protocol: 'tcp',
        securityGroups: [webSecurityGroup.id],
      },
    ],
    // No outbound rules - database should not initiate connections
    egress: [],
  },
  { provider, parent: this }
);
```

## 4. Missing Environment Suffix Implementation

**Issue**: Model had no environment-specific naming, preventing multi-environment deployments.

**Model Code**: Hard-coded resource names:

```typescript
const vpc = new aws.ec2.Vpc('main-vpc' /*...*/);
const dynamoTable = new aws.dynamodb.Table('application-table' /*...*/);
```

**What We Added**:

```typescript
const vpc = new aws.ec2.Vpc(
  `main-vpc-${args.environment}`
  /*...*/
);
const dynamoTable = new aws.dynamodb.Table(
  `application-table-${args.environment}`,
  {
    name: `application-data-table-${args.environment}`,
    /*...*/
  }
);
```

## 5. Missing Security Monitoring

**Issue**: Model lacked comprehensive security monitoring and threat detection.

**Model Code**: No GuardDuty, Config, or CloudWatch alarms.

**What We Added**:

```typescript
// GuardDuty for threat detection
const guardDutyDetector = pulumi.output(existingDetectorId).apply(id => {
  if (id) {
    return aws.guardduty.Detector.get(/*...*/);
  }
  return new aws.guardduty.Detector(/*...*/);
});

// AWS Config for compliance monitoring
const configRecorder = new aws.cfg.Recorder(/*...*/);
const configDeliveryChannel = new aws.cfg.DeliveryChannel(/*...*/);

// CloudWatch alarms for monitoring
void (new aws.cloudwatch.MetricAlarm(/*...*/));
```

## 6. Missing SNS Alerting System

**Issue**: Model had no centralized alerting mechanism for security events.

**Model Code**: No SNS topic or alerting.

**What We Added**:

```typescript
const securityAlertsTopic = new aws.sns.Topic(
  `security-alerts-topic-${args.environment}`,
  {
    name: `security-alerts-topic-${args.environment}`,
    displayName: 'Security Alerts and Monitoring',
  },
  { provider, parent: this }
);
```

## 18. Insufficient IAM Least Privilege Implementation

**Issue**: Model's IAM policy was too permissive, allowing dangerous EC2 actions.

**Model Code**:

```typescript
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
```

**What We Added**:

```typescript
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
// Separate statement for CreateTags with specific conditions
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
```

## 18. Missing VPC Endpoints for Secure Access

**Issue**: Model had no VPC endpoints, requiring internet access for AWS services.

**Model Code**: No VPC endpoints.

**What We Added**:

```typescript
// SSM VPC Endpoints for secure instance access without SSH
void new aws.ec2.VpcEndpoint(
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

## 18. Missing S3 Lifecycle and Security Configurations

**Issue**: Model's S3 bucket lacked lifecycle policies and comprehensive security settings.

**Model Code**: Basic S3 bucket with minimal configuration.

**What We Added**:

```typescript
// S3 lifecycle configuration for cost optimization
void new aws.s3.BucketLifecycleConfiguration(
  `cloudtrail-bucket-lifecycle-${args.environment}`,
  {
    bucket: cloudtrailBucket.id,
    rules: [
      {
        id: 'cloudtrail-logs-lifecycle',
        status: 'Enabled',
        transitions: [
          { days: 30, storageClass: 'STANDARD_IA' },
          { days: 90, storageClass: 'GLACIER' },
          { days: 365, storageClass: 'DEEP_ARCHIVE' },
        ],
        expiration: { days: 2555 }, // 7 years retention
      },
    ],
  },
  { provider, parent: this }
);

// S3 bucket notification configuration
void (new aws.s3.BucketNotification(/*...*/));
```

## 18. Missing DynamoDB Security Features

**Issue**: Model's DynamoDB table lacked point-in-time recovery and deletion protection.

**Model Code**: Basic DynamoDB table without advanced security features.

**What We Added**:

```typescript
// Enable point-in-time recovery for production
pointInTimeRecovery: {
  enabled: true,
},

// Enable deletion protection
deletionProtectionEnabled: true,
```

## 18. Missing Explicit Egress Rules

**Issue**: Model used implicit egress rules, violating security best practices.

**Model Code**:

```typescript
egress: [
  {
    description: 'All outbound traffic',
    fromPort: 0,
    toPort: 0,
    protocol: '-1',
    cidrBlocks: ['0.0.0.0/0'],
  },
],
```

**What We Added**:

```typescript
// Explicit outbound rules for security
egress: [
  {
    description: 'HTTPS outbound for package updates',
    fromPort: 443,
    toPort: 443,
    protocol: 'tcp',
    cidrBlocks: ['0.0.0.0/0'],
  },
  {
    description: 'HTTP outbound for package updates',
    fromPort: 80,
    toPort: 80,
    protocol: 'tcp',
    cidrBlocks: ['0.0.0.0/0'],
  },
  {
    description: 'DNS outbound',
    fromPort: 53,
    toPort: 53,
    protocol: 'udp',
    cidrBlocks: ['0.0.0.0/0'],
  },
  {
    description: 'NTP outbound',
    fromPort: 123,
    toPort: 123,
    protocol: 'udp',
    cidrBlocks: ['0.0.0.0/0'],
  },
],
```

## 18. Missing Critical Security Monitoring Components

**Issue Type**: Security/Compliance Issue
**Description**: Model completely missed essential security monitoring components required for production environments.

**Model Code**: No GuardDuty, AWS Config, CloudWatch Alarms, or SNS alerting.

**What We Added**:
```typescript
// GuardDuty for threat detection
const guardDutyDetector = pulumi.output(existingDetectorId).apply(id => {
  if (id) {
    return aws.guardduty.Detector.get(/*...*/);
  }
  return new aws.guardduty.Detector(/*...*/);
});

// AWS Config for compliance monitoring
const configRecorder = new aws.cfg.Recorder(/*...*/);
const configDeliveryChannel = new aws.cfg.DeliveryChannel(/*...*/);
const configBucket = new aws.s3.Bucket(/*...*/);

// CloudWatch alarms for proactive monitoring
void new aws.cloudwatch.MetricAlarm(
  `dynamodb-read-throttle-alarm-${args.environment}`,
  {
    name: `dynamodb-read-throttle-alarm-${args.environment}`,
    comparisonOperator: 'GreaterThanOrEqualToThreshold',
    evaluationPeriods: 2,
    metricName: 'ReadThrottledEvents',
    namespace: 'AWS/DynamoDB',
    period: 300,
    statistic: 'Sum',
    threshold: 1,
    alarmActions: [securityAlertsTopic.arn],
    dimensions: {
      TableName: dynamoTable.name,
    },
  },
  { provider, parent: this }
);

// SNS topic for centralized alerting
const securityAlertsTopic = new aws.sns.Topic(
  `security-alerts-topic-${args.environment}`,
  {
    name: `security-alerts-topic-${args.environment}`,
    displayName: 'Security Alerts and Monitoring',
  },
  { provider, parent: this }
);
```

## 19. Missing S3 Lifecycle and Cost Optimization

**Issue Type**: Cost Optimization/Compliance Issue
**Description**: Model's S3 bucket lacked lifecycle policies for cost optimization and compliance retention requirements.

**Model Code**: Basic S3 bucket with no lifecycle management.

**What We Added**:
```typescript
// S3 lifecycle configuration for cost optimization
void new aws.s3.BucketLifecycleConfiguration(
  `cloudtrail-bucket-lifecycle-${args.environment}`,
  {
    bucket: cloudtrailBucket.id,
    rules: [
      {
        id: 'cloudtrail-logs-lifecycle',
        status: 'Enabled',
        transitions: [
          { days: 30, storageClass: 'STANDARD_IA' },
          { days: 90, storageClass: 'GLACIER' },
          { days: 365, storageClass: 'DEEP_ARCHIVE' },
        ],
        expiration: { days: 2555 }, // 7 years retention for compliance
      },
    ],
  },
  { provider, parent: this }
);

// S3 bucket notification configuration for monitoring
void new aws.s3.BucketNotification(
  `cloudtrail-bucket-notification-${args.environment}`,
  {
    bucket: cloudtrailBucket.id,
  },
  { provider, parent: this }
);
```

**Issue**: Model relied on insecure SSH access from the internet instead of secure SSM Session Manager.

**Model Code**: Included SSH access:

```typescript
ingress: [
  {
    description: 'SSH access from internet',
    fromPort: 22,
    toPort: 22,
    protocol: 'tcp',
    cidrBlocks: ['0.0.0.0/0'],
  },
  // ...
],
```

**What We Added**: Removed SSH and added SSM Session Manager:

```typescript
// Attach AWS managed policy for SSM Session Manager (secure alternative to SSH)
void new aws.iam.RolePolicyAttachment(
  `ec2-ssm-policy-attachment-${args.environment}`,
  {
    role: ec2Role.name,
    policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  },
  { provider, parent: this }
);

// VPC Endpoints for SSM Session Manager (secure access without internet)
void new aws.ec2.VpcEndpoint(
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

## 20. Added SSM Session Manager to Replace SSH Access

**Issue Type**: Security Enhancement
**Description**: Model relied on insecure SSH access from the internet instead of secure SSM Session Manager.

**Model Code**: Included SSH access:

```typescript
ingress: [
  {
    description: 'SSH access from internet',
    fromPort: 22,
    toPort: 22,
    protocol: 'tcp',
    cidrBlocks: ['0.0.0.0/0'],
  },
  // ...
],
```

**What We Added**: Removed SSH and added SSM Session Manager:

```typescript
// Attach AWS managed policy for SSM Session Manager (secure alternative to SSH)
void new aws.iam.RolePolicyAttachment(
  `ec2-ssm-policy-attachment-${args.environment}`,
  {
    role: ec2Role.name,
    policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
  },
  { provider, parent: this }
);

// VPC Endpoints for SSM Session Manager (secure access without internet)
void new aws.ec2.VpcEndpoint(
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
