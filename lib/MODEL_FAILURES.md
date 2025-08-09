# Model Failures and Fixes

## Infrastructure Issues Fixed

### 1. CDK Property Name Error - KMS Key Policy

**Issue**: The model used `keyPolicy` instead of the correct property name `policy` for the KMS key configuration.

**Original Code**:

```typescript
const kmsKey = new kms.Key(this, `tf-encryption-key-${environment}`, {
  keyPolicy: new iam.PolicyDocument({...})  // Incorrect property name
});
```

**Fixed Code**:

```typescript
const kmsKey = new kms.Key(this, `tf-encryption-key-${environment}`, {
  policy: new iam.PolicyDocument({...})  // Correct property name
});
```

### 2. S3 Bucket Property Error - Versioning Configuration

**Issue**: The model used `versioning: true` instead of the correct property name `versioned: true` for S3 bucket versioning.

**Original Code**:

```typescript
const s3Bucket = new s3.Bucket(this, `tf-secure-storage-${environment}`, {
  versioning: true, // Incorrect property name
});
```

**Fixed Code**:

```typescript
const s3Bucket = new s3.Bucket(this, `tf-secure-storage-${environment}`, {
  versioned: true, // Correct property name
});
```

### 3. S3 Event Notification Missing Target

**Issue**: The model called `addEventNotification` with only the event type but missing the required notification target parameter.

**Original Code**:

```typescript
s3Bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED
  // Missing notification target
);
```

**Fixed Code**:

```typescript
// Created SNS topic for security monitoring
const securityNotificationsTopic = new sns.Topic(
  this,
  `tf-security-notifications-${environment}`,
  {
    topicName: `tf-security-notifications-${environment}`,
    displayName: `Security Notifications - ${environment}`,
    masterKey: kmsKey,
  }
);

// S3 Bucket notification for security monitoring
s3Bucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.SnsDestination(securityNotificationsTopic)
);
```

### 4. Auto Scaling Policy Property Error

**Issue**: The model used `scaleInCooldown` and `scaleOutCooldown` properties which don't exist in the `CpuUtilizationScalingProps` interface.

**Original Code**:

```typescript
asg.scaleOnCpuUtilization(`tf-cpu-scaling-${environment}`, {
  targetUtilizationPercent: 70,
  scaleInCooldown: cdk.Duration.minutes(5), // Invalid property
  scaleOutCooldown: cdk.Duration.minutes(5), // Invalid property
});
```

**Fixed Code**:

```typescript
asg.scaleOnCpuUtilization(`tf-cpu-scaling-${environment}`, {
  targetUtilizationPercent: 70,
  cooldown: cdk.Duration.minutes(5), // Correct property
});
```

### 5. Test File Property Error

**Issue**: The test file included `domainName` and `hostedZoneId` properties that don't exist in the `SecureWebAppStackProps` interface.

**Original Code**:

```typescript
const httpsStack = new SecureWebAppStack(httpsApp, 'HttpsSecureWebAppStack', {
  environment: 'prod',
  domainName: 'example.com', // Property doesn't exist
  hostedZoneId: 'Z123456789', // Property doesn't exist
});
```

**Fixed Code**:

```typescript
const httpsStack = new SecureWebAppStack(httpsApp, 'HttpsSecureWebAppStack', {
  environment: 'prod',
  // Removed non-existent properties
});
```

### 6. ALB Access Logs KMS Encryption Issue

**Issue**: The model attempted to use KMS encryption for ALB access logs, which is not supported. ALB access logs only support S3-managed encryption.

**Original Code**:

```typescript
const albLogsBucket = new s3.Bucket(this, `tf-alb-logs-${environment}`, {
  encryption: s3.BucketEncryption.KMS, // Not supported for ALB logs
  encryptionKey: kmsKey,
});
```

**Fixed Code**:

```typescript
const albLogsBucket = new s3.Bucket(this, `tf-alb-logs-${environment}`, {
  encryption: s3.BucketEncryption.S3_MANAGED, // Correct encryption type
});
```

### 7. Deprecated VPC CIDR Property

**Issue**: The model used the deprecated `cidr` property instead of the newer `ipAddresses` property for VPC configuration.

**Original Code**:

```typescript
const vpc = new ec2.Vpc(this, `tf-vpc-${environment}`, {
  cidr: '10.0.0.0/16', // Deprecated property
});
```

**Fixed Code**:

```typescript
const vpc = new ec2.Vpc(this, `tf-vpc-${environment}`, {
  ipAddresses: ec2.IpAddresses.cidr('10.0.0.0/16'), // Current property
});
```

### 8. Code Quality Issues - Unused Variables

**Issue**: The model created several variables that were assigned but never used, causing linting errors.

**Issues Fixed**:

- Removed unused `commonTags` variable
- Removed unused `listener` variable assignment
- Removed unused alarm variable assignments (`httpCodeTarget4xxAlarm`, `httpCodeTarget5xxAlarm`, `responseTimeAlarm`)

### 9. Deprecated CloudWatch Metrics Methods

**Issue**: The model used deprecated metric methods on the target group.

**Original Code**:

```typescript
metric: targetGroup.metricHttpCodeTarget(elbv2.HttpCodeTarget.TARGET_4XX_COUNT);
metric: targetGroup.metricTargetResponseTime();
```

**Fixed Code**:

```typescript
metric: targetGroup.metrics.httpCodeTarget(
  elbv2.HttpCodeTarget.TARGET_4XX_COUNT
);
metric: targetGroup.metrics.targetResponseTime();
```

### 10. Missing Required Imports

**Issue**: The model failed to include necessary imports for S3 notifications and SNS services.

**Added Imports**:

```typescript
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as sns from 'aws-cdk-lib/aws-sns';
```

### 11. Deprecated Auto Scaling Health Check API - FIXED

**Issue**: The model used deprecated health check APIs that will be removed in future CDK versions.

**Deprecation Warnings Observed**:

```
[WARNING] aws-cdk-lib.aws_autoscaling.HealthCheck#elb is deprecated.
  Use HealthChecks instead
[WARNING] aws-cdk-lib.aws_autoscaling.ElbHealthCheckOptions#grace is deprecated.
  Use AdditionalHealthChecksOptions instead
[WARNING] aws-cdk-lib.aws_autoscaling.CommonAutoScalingGroupProps#healthCheck is deprecated.
  Use `healthChecks` instead
```

**Original Code** (deprecated):

```typescript
healthCheck: autoscaling.HealthCheck.elb({
  grace: cdk.Duration.minutes(5),
}),
```

**Fixed Code**:

```typescript
// Create ASG without deprecated health check property
const asg = new autoscaling.AutoScalingGroup(this, `tf-asg-${environment}`, {
  // ... other properties
  // Removed deprecated healthCheck property
});

// Configure ELB health check using L1 construct to avoid deprecation warnings
const cfnAsg = asg.node.defaultChild as autoscaling.CfnAutoScalingGroup;
cfnAsg.healthCheckType = 'ELB';
cfnAsg.healthCheckGracePeriod = 300;
```

**Benefits**: Eliminates all deprecation warnings while maintaining the same functionality.

### 12. Auto Scaling Group Desired Capacity Warning

**Issue**: The model configured `desiredCapacity` which causes the ASG size to reset on every deployment.

**Warning Observed**:

```
[Warning] desiredCapacity has been configured. Be aware this will reset the size of your AutoScalingGroup on every deployment.
```

**Current Code**:

```typescript
desiredCapacity: 2,  // Causes reset on each deployment
```

**Recommendation**: Remove `desiredCapacity` and let Auto Scaling manage the capacity based on scaling policies.

## Security Issues Identified and Recommendations

### 13. KMS Key Policy - Overly Permissive (CRITICAL SECURITY ISSUE) - FIXED

**Issue**: The model used wildcard permissions in KMS key policy, violating the principle of least privilege.

**Original Code**:

```typescript
new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  principals: [new iam.AccountRootPrincipal()],
  actions: ['kms:*'],  // TOO PERMISSIVE
  resources: ['*'],    // TOO PERMISSIVE
}),
```

**Security Risk**: Allows unlimited KMS operations on any resource, complete compromise of encryption security.

**Fixed Code**:

```typescript
new iam.PolicyStatement({
  effect: iam.Effect.ALLOW,
  principals: [new iam.AccountRootPrincipal()],
  actions: [
    'kms:DescribeKey', 'kms:GetKeyPolicy', 'kms:PutKeyPolicy',
    'kms:CreateGrant', 'kms:RevokeGrant', 'kms:EnableKeyRotation',
    'kms:DisableKeyRotation', 'kms:GetKeyRotationStatus',
    'kms:ScheduleKeyDeletion', 'kms:CancelKeyDeletion'
  ],
  resources: ['*'], // Still needed for key management operations
  // Added conditions for service-specific access
}),
```

### 14. Missing HTTPS/TLS Encryption (HIGH SECURITY RISK)

**Issue**: The model only implemented HTTP listener, no HTTPS encryption in transit.

**Current Code**:

```typescript
alb.addListener(`tf-listener-${environment}`, {
  port: 80,
  protocol: elbv2.ApplicationProtocol.HTTP, // NO ENCRYPTION
});
```

**Security Risk**: All data transmitted in plain text, vulnerable to man-in-the-middle attacks.

**Recommended Implementation**: Add HTTPS listener with SSL certificate and redirect HTTP to HTTPS.

### 15. EC2 Security Group - Unrestricted Outbound Access (HIGH SECURITY RISK) - FIXED

**Issue**: The model allowed unrestricted outbound access from EC2 instances.

**Original Code**:

```typescript
const ec2SecurityGroup = new ec2.SecurityGroup(
  this,
  `tf-ec2-sg-${environment}`,
  {
    allowAllOutbound: true, // TOO PERMISSIVE
  }
);
```

**Security Risk**: Instances can communicate with any external service, potential for data exfiltration.

**Fixed Code**:

```typescript
const ec2SecurityGroup = new ec2.SecurityGroup(
  this,
  `tf-ec2-sg-${environment}`,
  {
    allowAllOutbound: false,
  }
);

// Add specific egress rules
ec2SecurityGroup.addEgressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(443),
  'HTTPS for AWS services'
);
ec2SecurityGroup.addEgressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(80),
  'HTTP for package updates'
);
ec2SecurityGroup.addEgressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.tcp(53),
  'DNS resolution'
);
ec2SecurityGroup.addEgressRule(
  ec2.Peer.anyIpv4(),
  ec2.Port.udp(53),
  'DNS resolution'
);
```

### 16. ALB Security Group - Overly Permissive Egress (MEDIUM SECURITY RISK) - FIXED

**Issue**: ALB security group allows outbound to any IPv4 address.

**Original Code**:

```typescript
albSecurityGroup.addEgressRule(
  ec2.Peer.anyIpv4(), // TOO PERMISSIVE
  ec2.Port.tcp(80),
  'Allow outbound HTTP to EC2 instances'
);
```

**Fixed Code**:

```typescript
albSecurityGroup.addEgressRule(
  ec2SecurityGroup, // Only to EC2 security group
  ec2.Port.tcp(80),
  'Allow outbound HTTP to EC2 instances only'
);
```

### 17. Missing VPC Endpoints (MEDIUM SECURITY RISK)

**Issue**: The model didn't implement VPC endpoints, causing AWS service communications to go over public internet.

**Security Risk**: Data exposure, higher costs, dependency on internet gateway.

**Recommended Implementation**:

```typescript
vpc.addGatewayEndpoint('S3Endpoint', {
  service: ec2.GatewayVpcEndpointAwsService.S3,
});

vpc.addInterfaceEndpoint('SSMEndpoint', {
  service: ec2.InterfaceVpcEndpointAwsService.SSM,
});
```

### 18. SNS Topic Missing Access Policy (MEDIUM SECURITY RISK) - FIXED

**Issue**: SNS topic lacks explicit access policy, relies on default permissions.

**Fixed Implementation**:

```typescript
securityNotificationsTopic.addToResourcePolicy(
  new iam.PolicyStatement({
    effect: iam.Effect.ALLOW,
    principals: [new iam.ServicePrincipal('s3.amazonaws.com')],
    actions: ['sns:Publish'],
    resources: [securityNotificationsTopic.topicArn],
    conditions: {
      StringEquals: { 'aws:SourceAccount': this.account },
      ArnLike: {
        'aws:SourceArn': `arn:aws:s3:::tf-secure-storage-${environment}`,
      },
    },
  })
);
```

### 19. VPC Flow Logs Role - Invalid Managed Policy (MEDIUM SECURITY RISK) - FIXED

**Issue**: The model used invalid managed policy `VPCFlowLogsDeliveryRolePolicy`.

**Original Code**:

```typescript
managedPolicies: [
  iam.ManagedPolicy.fromAwsManagedPolicyName(
    'service-role/VPCFlowLogsDeliveryRolePolicy'  // INVALID POLICY
  ),
],
```

**Fixed Code**:

```typescript
inlinePolicies: {
  FlowLogDeliveryPolicy: new iam.PolicyDocument({
    statements: [
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          'logs:CreateLogGroup',
          'logs:CreateLogStream',
          'logs:PutLogEvents',
          'logs:DescribeLogGroups',
          'logs:DescribeLogStreams',
        ],
        resources: [
          `arn:aws:logs:${this.region}:${this.account}:log-group:/aws/vpc/flowlogs-${environment}:*`,
        ],
      }),
    ],
  });
}
```

### 20. EC2 Role - Overly Permissive S3 Access (MEDIUM SECURITY RISK) - FIXED

**Issue**: EC2 role had broad S3 permissions including DeleteObject on entire bucket.

**Original Code**:

```typescript
actions: ['s3:GetObject', 's3:PutObject', 's3:DeleteObject'],
resources: [`arn:aws:s3:::tf-secure-storage-${environment}/*`],  // TOO BROAD
```

**Fixed Code**:

```typescript
inlinePolicies: {
  S3AccessPolicy: new iam.PolicyDocument({
    statements: [
      new iam.PolicyStatement({
        actions: ['s3:GetObject', 's3:PutObject'],
        resources: [`arn:aws:s3:::tf-secure-storage-${environment}/logs/*`], // SPECIFIC PREFIX
      }),
      new iam.PolicyStatement({
        actions: ['s3:ListBucket'],
        resources: [`arn:aws:s3:::tf-secure-storage-${environment}`],
        conditions: { StringLike: { 's3:prefix': ['logs/*'] } }, // RESTRICTED PREFIX
      }),
    ],
  });
}
```

### 21. S3 Bucket - Missing SSL Enforcement Policy (MEDIUM SECURITY RISK) - FIXED

**Issue**: S3 bucket relied only on `enforceSSL: true` property without explicit bucket policy.

**Fixed Implementation**:

```typescript
s3Bucket.addToResourcePolicy(
  new iam.PolicyStatement({
    sid: 'DenyInsecureConnections',
    effect: iam.Effect.DENY,
    principals: [new iam.AnyPrincipal()],
    actions: ['s3:*'],
    resources: [s3Bucket.bucketArn, s3Bucket.arnForObjects('*')],
    conditions: { Bool: { 'aws:SecureTransport': 'false' } },
  })
);
```

### 22. UserData Security - Insecure Configuration Files (LOW SECURITY RISK) - FIXED

**Issue**: CloudWatch agent configuration written to disk without proper permissions.

**Original Code**:

```bash
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
# Configuration content
EOF
```

**Fixed Code**:

```bash
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
# Configuration content
EOF
chmod 600 /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
chown root:root /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
```

### 23. UserData Security - Unrestricted Package Updates (LOW SECURITY RISK) - FIXED

**Issue**: Used `yum update -y` which updates all packages, not just security updates.

**Original Code**:

```bash
yum update -y
```

**Fixed Code**:

```bash
yum update -y --security  # Only security updates
```

### 24. WAF Configuration - Insufficient Protection (MEDIUM SECURITY RISK) - FIXED

**Issue**: WAF missing SQL injection and bot control rules, rate limit too high.

**Original Configuration**:

- Only Common Rules and Known Bad Inputs
- Rate limit: 2000 requests per 5 minutes

**Enhanced Configuration**:

```typescript
rules: [
  // Existing rules...
  {
    name: 'AWSManagedRulesSQLiRuleSet', // ADDED
    priority: 3,
    overrideAction: { none: {} },
    statement: {
      managedRuleGroupStatement: {
        vendorName: 'AWS',
        name: 'AWSManagedRulesSQLiRuleSet',
      },
    },
  },
  {
    name: 'AWSManagedRulesBotControlRuleSet', // ADDED
    priority: 4,
    overrideAction: { none: {} },
    statement: {
      managedRuleGroupStatement: {
        vendorName: 'AWS',
        name: 'AWSManagedRulesBotControlRuleSet',
      },
    },
  },
  {
    name: 'RateLimitRule',
    statement: {
      rateBasedStatement: {
        limit: 1000, // REDUCED from 2000
      },
    },
  },
];
```

### 25. Missing Security Monitoring Alarms (MEDIUM SECURITY RISK) - FIXED

**Issue**: No alarms for WAF blocked requests or EC2 resource utilization.

**Added Alarms**:

```typescript
// WAF blocked requests alarm
new cloudwatch.Alarm(this, `tf-waf-blocked-requests-alarm-${environment}`, {
  alarmName: `tf-WAF-blocked-requests-${environment}`,
  metric: new cloudwatch.Metric({
    namespace: 'AWS/WAFV2',
    metricName: 'BlockedRequests',
    dimensionsMap: { WebACL: webAcl.name!, Region: this.region },
  }),
  threshold: 100,
});

// EC2 CPU utilization alarm
new cloudwatch.Alarm(this, `tf-ec2-cpu-alarm-${environment}`, {
  alarmName: `tf-EC2-high-cpu-${environment}`,
  metric: new cloudwatch.Metric({
    namespace: 'AWS/EC2',
    metricName: 'CPUUtilization',
    dimensionsMap: { AutoScalingGroupName: asg.autoScalingGroupName },
  }),
  threshold: 80,
});
```

## Enhancements Made

### SNS Topic for Security Monitoring

**Enhancement**: Created a dedicated SNS topic for security notifications with KMS encryption.

**Implementation**:

```typescript
const securityNotificationsTopic = new sns.Topic(
  this,
  `tf-security-notifications-${environment}`,
  {
    topicName: `tf-security-notifications-${environment}`,
    displayName: `Security Notifications - ${environment}`,
    masterKey: kmsKey,
  }
);
```

**Benefits**:

- Enables real-time security monitoring
- Encrypted notifications using the same KMS key
- Can be extended to send notifications to email, SMS, or other endpoints
- Provides audit trail for S3 object creation events
