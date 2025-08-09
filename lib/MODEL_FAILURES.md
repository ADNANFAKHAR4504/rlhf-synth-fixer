# Model Response Implementation Issues

## Build Errors (TypeScript Compilation)

### 1. KMS Key Policy Property Error

**Issue**: The model used `keyPolicy` property which doesn't exist in the CDK `KeyProps` interface. The correct property is `policy`.

**Original Code**:

```typescript
const kmsKey = new kms.Key(this, `tf-encryption-key-${environment}`, {
  alias: `tf-encryption-key-${environment}`,
  description: `KMS key for encrypting resources in ${environment} environment`,
  enableKeyRotation: true,
  rotationPeriod: cdk.Duration.days(365),
  keyPolicy: new iam.PolicyDocument({
    // Invalid property name
    statements: [
      // ... policy statements
    ],
  }),
});
```

**Fixed Code**:

```typescript
const kmsKey = new kms.Key(this, `tf-encryption-key-${environment}`, {
  alias: `tf-encryption-key-${environment}`,
  description: `KMS key for encrypting resources in ${environment} environment`,
  enableKeyRotation: true,
  rotationPeriod: cdk.Duration.days(365),
  policy: new iam.PolicyDocument({
    // Changed from keyPolicy to policy
    statements: [
      // ... policy statements
    ],
  }),
});
```

### 2. CDK UpdatePolicy Method Error - Rolling Update Configuration

**Issue**: The model used `rollingUpdatePolicy` which doesn't exist in the CDK AutoScaling UpdatePolicy class. The correct method is `rollingUpdate`.

**Original Code**:

```typescript
const asg = new autoscaling.AutoScalingGroup(this, `tf-asg-${environment}`, {
  // ... other properties
  updatePolicy: autoscaling.UpdatePolicy.rollingUpdatePolicy({
    // Invalid method name
    maxBatchSize: 1,
    minInstancesInService: 1,
  }),
});
```

**Fixed Code**:

```typescript
const asg = new autoscaling.AutoScalingGroup(this, `tf-asg-${environment}`, {
  // ... other properties
  updatePolicy: autoscaling.UpdatePolicy.rollingUpdate({
    // Changed from rollingUpdatePolicy to rollingUpdate
    maxBatchSize: 1,
    minInstancesInService: 1,
  }),
});
```

### 3. Auto Scaling Group Metric Method Error - CPU Utilization Alarm

**Issue**: The model used `asg.metricCpuUtilization()` method which doesn't exist on the AutoScalingGroup class. CloudWatch metrics must be created explicitly.

**Original Code**:

```typescript
const highCpuAlarm = new cloudwatch.Alarm(
  this,
  `tf-high-cpu-alarm-${environment}`,
  {
    alarmName: `tf-high-cpu-alarm-${environment}`,
    metric: asg.metricCpuUtilization({
      // Invalid method - doesn't exist
      period: cdk.Duration.minutes(5),
    }),
    threshold: 80,
    evaluationPeriods: 2,
    comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    alarmDescription: 'High CPU utilization in ASG',
  }
);
```

**Fixed Code**:

```typescript
const highCpuAlarm = new cloudwatch.Alarm(
  this,
  `tf-high-cpu-alarm-${environment}`,
  {
    alarmName: `tf-high-cpu-alarm-${environment}`,
    metric: new cloudwatch.Metric({
      // Changed to explicit CloudWatch Metric creation
      namespace: 'AWS/EC2',
      metricName: 'CPUUtilization',
      dimensionsMap: {
        AutoScalingGroupName: asg.autoScalingGroupName,
      },
      statistic: 'Average',
      period: cdk.Duration.minutes(5),
    }),
    threshold: 80,
    evaluationPeriods: 2,
    comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
    alarmDescription: 'High CPU utilization in ASG',
  }
);
```

### 4. Auto Scaling Group Metric Method Error - Scale Up Policy

**Issue**: The model used `asg.metricCpuUtilization()` method in scaling policies which doesn't exist on the AutoScalingGroup class.

**Original Code**:

```typescript
const scaleUpPolicy = asg.scaleOnMetric(`tf-scale-up-policy-${environment}`, {
  metric: asg.metricCpuUtilization({
    // Invalid method - doesn't exist
    period: cdk.Duration.minutes(5),
  }),
  scalingSteps: [
    { upper: 70, change: +1 },
    { lower: 85, change: +2 },
  ],
  adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
  cooldown: cdk.Duration.minutes(5),
});
```

**Fixed Code**:

```typescript
asg.scaleOnMetric(`tf-scale-up-policy-${environment}`, {
  // Removed unused variable assignment
  metric: new cloudwatch.Metric({
    // Changed to explicit CloudWatch Metric creation
    namespace: 'AWS/EC2',
    metricName: 'CPUUtilization',
    dimensionsMap: {
      AutoScalingGroupName: asg.autoScalingGroupName,
    },
    statistic: 'Average',
    period: cdk.Duration.minutes(5),
  }),
  scalingSteps: [
    { upper: 70, change: +1 },
    { lower: 85, change: +2 },
  ],
  adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
  cooldown: cdk.Duration.minutes(5),
});
```

### 5. Auto Scaling Group Metric Method Error - Scale Down Policy

**Issue**: The model used `asg.metricCpuUtilization()` method in scaling policies which doesn't exist on the AutoScalingGroup class.

**Original Code**:

```typescript
const scaleDownPolicy = asg.scaleOnMetric(
  `tf-scale-down-policy-${environment}`,
  {
    metric: asg.metricCpuUtilization({
      // Invalid method - doesn't exist
      period: cdk.Duration.minutes(5),
    }),
    scalingSteps: [{ upper: 30, change: -1 }],
    adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
    cooldown: cdk.Duration.minutes(10),
  }
);
```

**Fixed Code**:

```typescript
asg.scaleOnMetric(`tf-scale-down-policy-${environment}`, {
  // Removed unused variable assignment
  metric: new cloudwatch.Metric({
    // Changed to explicit CloudWatch Metric creation
    namespace: 'AWS/EC2',
    metricName: 'CPUUtilization',
    dimensionsMap: {
      AutoScalingGroupName: asg.autoScalingGroupName,
    },
    statistic: 'Average',
    period: cdk.Duration.minutes(5),
  }),
  scalingSteps: [{ upper: 30, change: -1 }],
  adjustmentType: autoscaling.AdjustmentType.CHANGE_IN_CAPACITY,
  cooldown: cdk.Duration.minutes(10),
});
```

## Lint Errors (ESLint) - ALL RESOLVED

### 6. Missing Dependency Error

**Issue**: The model imported 'source-map-support' which is not listed in the project's dependencies and is not necessary for this implementation.

**Original Code**:

```typescript
#!/usr/bin/env node
import 'source-map-support/register'; // Unnecessary import causing lint error
import * as cdk from 'aws-cdk-lib';
import { SecureWebAppStack } from '../lib/secure-web-app-stack';
```

**Fixed Code**:

```typescript
#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib'; // Removed source-map-support import
import { SecureWebAppStack } from '../lib/secure-web-app-stack';
```

### 7. Unused Variable Error - Common Tags

**Issue**: The model defined `commonTags` variable but never used it in the code.

**Original Code**:

```typescript
const { environment } = props;
const allowedCidrBlocks = props.allowedCidrBlocks || ['10.0.0.0/8'];

// Common tags
const commonTags = {
  // Variable defined but never used
  Environment: 'Production',
  Project: 'SecureWebApp',
  ManagedBy: 'CDK',
};

// Apply tags to the stack
cdk.Tags.of(this).add('Environment', 'Production');
```

**Fixed Code**:

```typescript
const { environment } = props;
const allowedCidrBlocks = props.allowedCidrBlocks || ['10.0.0.0/8'];

// Apply tags to the stack  // Removed unused commonTags variable
cdk.Tags.of(this).add('Environment', 'Production');
```

### 8. Unused Parameter Error - ForEach Index

**Issue**: The model used `index` parameter in forEach callback but never referenced it.

**Original Code**:

```typescript
// Allow HTTP and HTTPS from allowed CIDR blocks
allowedCidrBlocks.forEach((cidr, index) => {
  // index parameter unused
  albSecurityGroup.addIngressRule(
    ec2.Peer.ipv4(cidr),
    ec2.Port.tcp(80),
    `Allow HTTP from ${cidr}`
  );
  // ... more rules
});
```

**Fixed Code**:

```typescript
// Allow HTTP and HTTPS from allowed CIDR blocks
allowedCidrBlocks.forEach(cidr => {
  // Removed unused index parameter
  albSecurityGroup.addIngressRule(
    ec2.Peer.ipv4(cidr),
    ec2.Port.tcp(80),
    `Allow HTTP from ${cidr}`
  );
  // ... more rules
});
```

### 9. Unused Variable Error - ALB Listener

**Issue**: The model assigned the ALB listener to a variable but never used it.

**Original Code**:

```typescript
const listener = alb.addListener(`tf-listener-${environment}`, {
  // Variable assigned but never used
  port: 80,
  protocol: elbv2.ApplicationProtocol.HTTP,
  defaultTargetGroups: [targetGroup],
});
```

**Fixed Code**:

```typescript
alb.addListener(`tf-listener-${environment}`, {
  // Removed unused variable assignment
  port: 80,
  protocol: elbv2.ApplicationProtocol.HTTP,
  defaultTargetGroups: [targetGroup],
});
```

### 10. Unused Variable Error - Scale Up Policy

**Issue**: The model assigned the scale up policy to a variable but never used it.

**Original Code**:

```typescript
const scaleUpPolicy = asg.scaleOnMetric(
  // Variable assigned but never used
  `tf-scale-up-policy-${environment}`,
  {
    // ... scaling configuration
  }
);
```

**Fixed Code**:

```typescript
asg.scaleOnMetric(`tf-scale-up-policy-${environment}`, {
  // Removed unused variable assignment
  // ... scaling configuration
});
```

### 11. Unused Variable Error - Scale Down Policy

**Issue**: The model assigned the scale down policy to a variable but never used it.

**Original Code**:

```typescript
const scaleDownPolicy = asg.scaleOnMetric(
  // Variable assigned but never used
  `tf-scale-down-policy-${environment}`,
  {
    // ... scaling configuration
  }
);
```

**Fixed Code**:

```typescript
asg.scaleOnMetric(`tf-scale-down-policy-${environment}`, {
  // Removed unused variable assignment
  // ... scaling configuration
});
```

## Formatting Issues (Prettier) - ALL RESOLVED

### 12. Code Formatting Errors

**Issue**: Multiple prettier/prettier formatting errors including incorrect indentation, spacing, and line breaks.

**Fix Applied**: Used `npm run lint -- --fix` to automatically resolve all 32 formatting issues.

## Security Issues Fixed

### 13. Open Internet Access - Default CIDR Configuration

**Issue**: The model response defaulted to allowing access from the entire internet (`0.0.0.0/0`) to the Application Load Balancer.

**Original Code**:

```typescript
// Get allowed CIDR blocks from context or use default
const allowedCidrBlocks = app.node.tryGetContext('allowedCidrBlocks') || [
  '0.0.0.0/0', // Allows entire internet access - major security risk
];
```

**Fixed Code**:

```typescript
// Get allowed CIDR blocks from context or use restrictive default
const allowedCidrBlocks = app.node.tryGetContext('allowedCidrBlocks') || [
  '10.0.0.0/8', // Changed from 0.0.0.0/0 to private network range
  '172.16.0.0/12', // RFC 1918 private ranges only
  '192.168.0.0/16',
];
```

### 14. Overprivileged EC2 Role - S3 Permissions

**Issue**: The model gave EC2 instances unnecessary delete permissions and access to all objects in the S3 bucket.

**Original Code**:

```typescript
actions: [
  's3:GetObject',
  's3:PutObject',
  's3:DeleteObject',  // Unnecessary delete permission
  's3:ListBucket',
],
resources: [
  `arn:aws:s3:::tf-backend-storage-${environment}`,
  `arn:aws:s3:::tf-backend-storage-${environment}/*`,  // Access to all objects
],
```

**Fixed Code**:

```typescript
actions: [
  's3:GetObject',
  's3:PutObject',
  's3:ListBucket',
  // Removed s3:DeleteObject - not needed for typical web app operations
],
resources: [
  `arn:aws:s3:::tf-backend-storage-${environment}`,
  `arn:aws:s3:::tf-backend-storage-${environment}/logs/*`, // Restricted to logs path only
],
conditions: {
  StringEquals: {
    's3:ExistingObjectTag/Environment': environment, // Added condition for tagged objects only
  },
},
```

### 15. Broad Outbound Internet Access - EC2 Security Group

**Issue**: The model allowed EC2 instances to connect to any destination on the internet.

**Original Code**:

```typescript
// Allow HTTPS outbound for package updates and SSM
ec2SecurityGroup.addEgressRule(
  ec2.Peer.anyIpv4(), // Allows connection to any IP address
  ec2.Port.tcp(443),
  'Allow HTTPS outbound'
);

// Allow HTTP outbound for package updates
ec2SecurityGroup.addEgressRule(
  ec2.Peer.anyIpv4(), // Allows connection to any IP address
  ec2.Port.tcp(80),
  'Allow HTTP outbound'
);
```

**Fixed Code**:

```typescript
// Allow HTTPS outbound for package updates and SSM - restricted to specific endpoints
ec2SecurityGroup.addEgressRule(
  ec2.Peer.prefixList('pl-63a5400a'), // S3 prefix list for us-west-2
  ec2.Port.tcp(443),
  'Allow HTTPS to S3 endpoints'
);

// Allow HTTPS to AWS service endpoints only
ec2SecurityGroup.addEgressRule(
  ec2.Peer.ipv4('169.254.169.254/32'), // EC2 metadata service
  ec2.Port.tcp(80),
  'Allow HTTP to EC2 metadata service'
);

// Allow DNS resolution
ec2SecurityGroup.addEgressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.udp(53),
  'Allow DNS resolution'
);
```

### 16. Inappropriate Role Assignment - S3 Notifications

**Issue**: The model incorrectly assigned the EC2 role to handle S3 notifications, which violates service principal boundaries.

**Original Code**:

```typescript
const s3Bucket = new s3.Bucket(this, `tf-backend-storage-${environment}`, {
  // ... other properties
  serverAccessLogsPrefix: 'access-logs/',
  notificationsHandlerRole: ec2Role, // Wrong role for S3 notifications
});
```

**Fixed Code**:

```typescript
const s3Bucket = new s3.Bucket(this, `tf-backend-storage-${environment}`, {
  // ... other properties
  serverAccessLogsPrefix: 'access-logs/',
  // Removed notificationsHandlerRole: ec2Role - inappropriate role assignment
});
```

### 17. Excessive KMS Permissions - EC2 Role

**Issue**: The model granted overprivileged KMS permissions with wildcards and unnecessary actions.

**Original Code**:

```typescript
new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    'kms:Encrypt',
    'kms:Decrypt',
    'kms:ReEncrypt*',      // Unnecessary re-encryption permissions
    'kms:GenerateDataKey*', // Wildcard allows all variants
    'kms:DescribeKey',
  ],
  resources: [kmsKey.keyArn],
}),
```

**Fixed Code**:

```typescript
new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  actions: [
    'kms:Encrypt',
    'kms:Decrypt',
    'kms:GenerateDataKey', // Removed wildcard - only specific action needed
    'kms:DescribeKey',
    // Removed kms:ReEncrypt* - not needed for typical operations
  ],
  resources: [kmsKey.keyArn],
  conditions: {
    StringEquals: {
      'kms:ViaService': [
        `s3.${this.region}.amazonaws.com`,
        `logs.${this.region}.amazonaws.com`,
      ], // Added ViaService condition to restrict usage
    },
  },
}),
```

### 18. Resource Naming Predictability

**Issue**: The model used predictable resource names that could aid in reconnaissance attacks.

**Original Code**:

```typescript
const s3Bucket = new s3.Bucket(this, `tf-backend-storage-${environment}`, {
  bucketName: `tf-backend-storage-${environment}`, // Predictable name
  // ... other properties
});

const ec2Role = new iam.Role(this, `tf-ec2-role-${environment}`, {
  roleName: `tf-ec2-role-${environment}`, // Predictable name
  // ... other properties
});
```

**Fixed Code**:

```typescript
const s3Bucket = new s3.Bucket(this, `tf-backend-storage-${environment}`, {
  bucketName: `tf-backend-storage-${environment}-${cdk.Aws.ACCOUNT_ID}`, // Added account ID for uniqueness
  // ... other properties
});

const ec2Role = new iam.Role(this, `tf-ec2-role-${environment}`, {
  roleName: `tf-ec2-role-${environment}-${cdk.Aws.ACCOUNT_ID}`, // Added account ID for uniqueness
  // ... other properties
});
```

## Security Issues NOT Fixed (As Requested)

### 19. KMS Key Policy Wildcard Permissions - NOT FIXED

**Issue**: The model response grants the root account wildcard permissions (`kms:*`) on all resources (`*`), which violates the principle of least privilege.

**Current Code (Unchanged)**:

```typescript
new iam.PolicyStatement({
  sid: 'Enable IAM User Permissions',
  effect: iam.Effect.ALLOW,
  principals: [new iam.AccountRootPrincipal()],
  actions: ['kms:*'],  // Still allows ALL KMS permissions - CRITICAL VULNERABILITY
  resources: ['*'],    // Still allows ALL resources - NO RESTRICTIONS
}),
```

**Risk Level**: CRITICAL - This remains the most significant security vulnerability in the infrastructure.

## Security Issues That Should Have Been Included

### Missing Security Controls in Model Response

#### 1. Missing HTTPS/TLS Configuration - NOT IMPLEMENTED

**Issue**: The model response only configured HTTP (port 80) without HTTPS/TLS encryption.

**What Should Have Been Added**:

```typescript
// SSL Certificate for HTTPS
const certificate = new acm.Certificate(this, `tf-ssl-cert-${environment}`, {
  domainName: `app-${environment}.example.com`,
  validation: acm.CertificateValidation.fromDns(),
});

// HTTPS Listener
alb.addListener(`tf-https-listener-${environment}`, {
  port: 443,
  protocol: elbv2.ApplicationProtocol.HTTPS,
  certificates: [certificate],
  defaultTargetGroups: [targetGroup],
});

// Redirect HTTP to HTTPS
alb.addRedirect({
  sourceProtocol: elbv2.ApplicationProtocol.HTTP,
  sourcePort: 80,
  targetProtocol: elbv2.ApplicationProtocol.HTTPS,
  targetPort: 443,
});
```

#### 2. Missing VPC Endpoints for AWS Services - NOT IMPLEMENTED

**Issue**: EC2 instances communicate with AWS services over the internet instead of private VPC endpoints.

**What Should Have Been Added**:

```typescript
// VPC Endpoints for secure AWS service communication
const s3Endpoint = vpc.addGatewayEndpoint('S3Endpoint', {
  service: ec2.GatewayVpcEndpointAwsService.S3,
});

const ssmEndpoint = vpc.addInterfaceEndpoint('SSMEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.SSM,
  privateDnsEnabled: true,
});

const cloudwatchEndpoint = vpc.addInterfaceEndpoint('CloudWatchEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.CLOUDWATCH_LOGS,
  privateDnsEnabled: true,
});
```

#### 3. Missing Network ACLs for Defense in Depth - NOT IMPLEMENTED

**Issue**: Only security groups were configured, missing network-level access control lists.

**What Should Have Been Added**:

```typescript
// Network ACLs for additional network security
const privateNetworkAcl = new ec2.NetworkAcl(
  this,
  `tf-private-nacl-${environment}`,
  {
    vpc,
    networkAclName: `tf-private-nacl-${environment}`,
  }
);

// Allow inbound HTTP from ALB subnets only
privateNetworkAcl.addEntry('AllowHttpFromALB', {
  ruleNumber: 100,
  protocol: ec2.AclProtocol.tcp(),
  ruleAction: ec2.AclTrafficDirection.INGRESS,
  cidr: ec2.AclCidr.ipv4('10.0.0.0/24'), // ALB subnet CIDR
  portRange: { from: 80, to: 80 },
});
```

#### 4. Missing WAF Geo-blocking and IP Reputation Rules - NOT IMPLEMENTED

**Issue**: WAF configuration lacks geographic restrictions and IP reputation filtering.

**What Should Have Been Added**:

```typescript
// Geo-blocking rule
{
  name: 'GeoBlockingRule',
  priority: 4,
  action: { block: {} },
  statement: {
    geoMatchStatement: {
      countryCodes: ['CN', 'RU', 'KP'], // Block high-risk countries
    },
  },
  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudWatchMetricsEnabled: true,
    metricName: 'GeoBlockingRule',
  },
},

// IP Reputation rule
{
  name: 'AWSManagedRulesAmazonIpReputationList',
  priority: 5,
  overrideAction: { none: {} },
  statement: {
    managedRuleGroupStatement: {
      vendorName: 'AWS',
      name: 'AWSManagedRulesAmazonIpReputationList',
    },
  },
  visibilityConfig: {
    sampledRequestsEnabled: true,
    cloudWatchMetricsEnabled: true,
    metricName: 'IpReputationRule',
  },
},
```

#### 5. Missing Secrets Manager for Sensitive Configuration - NOT IMPLEMENTED

**Issue**: No secure storage mechanism for application secrets and configuration.

**What Should Have Been Added**:

```typescript
// Secrets Manager for application secrets
const appSecrets = new secretsmanager.Secret(
  this,
  `tf-app-secrets-${environment}`,
  {
    secretName: `tf-app-secrets-${environment}`,
    description: 'Application secrets and configuration',
    encryptionKey: kmsKey,
    generateSecretString: {
      secretStringTemplate: JSON.stringify({ username: 'admin' }),
      generateStringKey: 'password',
      excludeCharacters: '"@/\\',
    },
  }
);

// Grant EC2 role access to secrets
appSecrets.grantRead(ec2Role);
```

#### 6. Missing CloudTrail for Audit Logging - NOT IMPLEMENTED

**Issue**: No audit trail for API calls and resource access.

**What Should Have Been Added**:

```typescript
// CloudTrail for audit logging
const cloudTrail = new cloudtrail.Trail(this, `tf-cloudtrail-${environment}`, {
  trailName: `tf-cloudtrail-${environment}`,
  bucket: new s3.Bucket(this, `tf-cloudtrail-logs-${environment}`, {
    bucketName: `tf-cloudtrail-logs-${environment}`,
    encryption: s3.BucketEncryption.KMS,
    encryptionKey: kmsKey,
    blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
  }),
  includeGlobalServiceEvents: true,
  isMultiRegionTrail: true,
  enableFileValidation: true,
});
```

#### 7. Missing GuardDuty for Threat Detection - NOT IMPLEMENTED

**Issue**: No threat detection and monitoring service configured.

**What Should Have Been Added**:

```typescript
// GuardDuty for threat detection
const guardDuty = new guardduty.CfnDetector(
  this,
  `tf-guardduty-${environment}`,
  {
    enable: true,
    findingPublishingFrequency: 'FIFTEEN_MINUTES',
    dataSources: {
      s3Logs: { enable: true },
      kubernetesAuditLogs: { enable: true },
      malwareProtection: { enable: true },
    },
  }
);
```

#### 8. Missing Config Rules for Compliance Monitoring - NOT IMPLEMENTED

**Issue**: No automated compliance checking and configuration monitoring.

**What Should Have Been Added**:

```typescript
// Config rules for compliance
const configRule = new config.ManagedRule(
  this,
  `tf-config-rule-${environment}`,
  {
    identifier:
      config.ManagedRuleIdentifiers.S3_BUCKET_PUBLIC_ACCESS_PROHIBITED,
    description: 'Ensure S3 buckets do not allow public access',
  }
);
```

## Initial Model Response (Suboptimal)

```typescript
// Allow HTTPS outbound for package updates and AWS services
ec2SecurityGroup.addEgressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(443),
  'Allow HTTPS outbound for AWS services and package updates'
);
```

**Problems with this approach:**

- Opens broad internet access (security risk)
- Requires NAT Gateway for internet connectivity (cost)
- Traffic goes over public internet (performance/security)
- Doesn't follow AWS Well-Architected principles

## Better Solution (Implemented)

**This is much better than the initial response:**

```typescript
// ✅ BETTER SOLUTION - VPC Endpoints (Best Practice)
// VPC Gateway Endpoint for S3 (best practice for secure S3 access)
vpc.addGatewayEndpoint('S3Endpoint', {
  service: ec2.GatewayVpcEndpointAwsService.S3,
  subnets: [{ subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS }],
});

// VPC Interface Endpoint for SSM (for EC2 management)
vpc.addInterfaceEndpoint('SSMEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.SSM,
  subnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
});

// No broad HTTPS egress rule needed!
```
