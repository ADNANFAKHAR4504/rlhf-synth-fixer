# Model Response Failures

## 1. SSH Access Security Vulnerability

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

## 7. Insufficient IAM Least Privilege Implementation

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

## 8. Missing VPC Endpoints for Secure Access

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

## 9. Missing S3 Lifecycle and Security Configurations

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

## 10. Missing DynamoDB Security Features

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

## 11. Missing Explicit Egress Rules

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

## 12. Added SSM Session Manager to Replace SSH Access

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
