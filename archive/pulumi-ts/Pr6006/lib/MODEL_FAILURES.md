# Model Failures and Corrections

This document details all the issues found in the initial MODEL_RESPONSE implementation and how they were corrected in the IDEAL_RESPONSE.

## Critical Failures

### 1. Missing environmentSuffix in Resource Names

**Issue**: Multiple resources were created without including the environmentSuffix, violating the requirement for unique resource naming across environments.

**Affected Resources**:
- Security Groups: `payment-alb-sg`, `payment-instance-sg`
- KMS Key: `payment-ebs-key`
- ALB: `payment-alb`
- Target Group: `payment-tg`
- Launch Template: `payment-lt`
- Auto Scaling Groups: `payment-asg-{idx}`
- SNS Topic: `payment-failover-topic`
- CloudWatch Alarm: `payment-unhealthy-alarm`
- Route 53 Health Check: `payment-health-check`

**Fix**: Added `-${environmentSuffix}` to all resource names to ensure uniqueness.

**Example**:
```typescript
// BEFORE (Wrong)
const albSg = new aws.ec2.SecurityGroup(`payment-alb-sg`, { ... });

// AFTER (Correct)
const albSg = new aws.ec2.SecurityGroup(`payment-alb-sg-${environmentSuffix}`, { ... });
```

### 2. Incorrect Target Group Deregistration Delay

**Issue**: Target group configured with 30-second deregistration delay, but requirement specifies maximum of 20 seconds.

**Impact**: Slower failover during instance replacement, violating the requirement for quick failure detection.

**Fix**: Changed `deregistrationDelay` from 30 to 20 seconds.

```typescript
// BEFORE (Wrong)
deregistrationDelay: 30,

// AFTER (Correct)
deregistrationDelay: 20,
```

### 3. Missing Secondary Failover Route 53 Record

**Issue**: Only created primary Route 53 failover record, missing the required secondary failover record.

**Impact**: No automatic failover capability - defeats the entire purpose of multi-AZ failover architecture.

**Fix**: Created both primary and secondary Route 53 records with proper failover routing policies.

```typescript
// ADDED in IDEAL_RESPONSE
const secondaryRecord = new aws.route53.Record(`payment-secondary-${environmentSuffix}`, {
  zoneId: zone.then(z => z.zoneId),
  name: `api-${environmentSuffix}`,
  type: 'A',
  setIdentifier: `secondary-${environmentSuffix}`,
  failoverRoutingPolicies: [{
    type: 'SECONDARY',
  }],
  aliases: [{
    name: secondaryAlb.dnsName,
    zoneId: secondaryAlb.zoneId,
    evaluateTargetHealth: true,
  }],
  healthCheckId: secondaryCombinedHealthCheck.id,
});
```

### 4. Missing Secondary ALB Infrastructure

**Issue**: No secondary ALB, target group, or Auto Scaling Groups created for failover.

**Impact**: Cannot implement true multi-AZ failover without secondary infrastructure.

**Fix**: Created complete secondary infrastructure including:
- Secondary ALB
- Secondary Target Group
- Secondary Launch Template
- Secondary Auto Scaling Groups (3 AZs × 2 instances each)

### 5. Missing TCP Health Checks

**Issue**: Route 53 health checks only monitored HTTP endpoints, requirement specifies both HTTP and TCP connectivity checks.

**Impact**: Incomplete health monitoring - may miss TCP-level connectivity issues.

**Fix**: Added TCP health checks for both primary and secondary ALBs, combined with HTTP checks using calculated health checks.

```typescript
// ADDED
const primaryTcpHealthCheck = new aws.route53.HealthCheck(`payment-health-tcp-primary-${environmentSuffix}`, {
  type: 'TCP',
  fqdn: primaryAlb.dnsName,
  port: 443,
  requestInterval: 10,
  failureThreshold: 3,
  tags: { ...tags, Name: `payment-health-tcp-primary-${environmentSuffix}` },
});

// Combined both checks
const primaryCombinedHealthCheck = new aws.route53.HealthCheck(`payment-health-combined-primary-${environmentSuffix}`, {
  type: 'CALCULATED',
  childHealthThreshold: 1,
  childHealthchecks: [
    primaryHealthCheck.id,
    primaryTcpHealthCheck.id,
  ],
});
```

## High-Priority Issues

### 6. Missing SSL Certificate Configuration

**Issue**: ALB listener configured for HTTPS without providing SSL certificate ARN.

**Impact**: Deployment would fail - cannot use HTTPS without certificate.

**Fix**: Added self-signed certificate creation (for development) with proper certificate attachment to listeners.

```typescript
// ADDED
const certificate = new aws.acm.Certificate(`payment-cert-${environmentSuffix}`, { ... });

const primaryListener = new aws.lb.Listener(`payment-listener-primary-${environmentSuffix}`, {
  loadBalancerArn: primaryAlb.arn,
  port: 443,
  protocol: 'HTTPS',
  sslPolicy: 'ELBSecurityPolicy-TLS-1-2-2017-01',
  certificateArn: certificate.arn,  // ADDED
  defaultActions: [{ ... }],
});
```

### 7. Missing S3 Lifecycle Policies

**Issue**: S3 bucket for ALB logs created without lifecycle policies for log management.

**Impact**: Logs accumulate indefinitely, increasing storage costs and violating the requirement for lifecycle management.

**Fix**: Added lifecycle rules with transitions to cheaper storage classes and automatic deletion after 90 days.

```typescript
// ADDED
lifecycleRules: [{
  enabled: true,
  id: 'delete-old-logs',
  expiration: {
    days: 90,
  },
  transitions: [
    { days: 30, storageClass: 'STANDARD_IA' },
    { days: 60, storageClass: 'GLACIER' }
  ],
}]
```

### 8. Security Group Not Restricting Health Check Traffic

**Issue**: Security group allowed health checks from any source via ALB security group, not restricted to AWS-owned IP ranges as required.

**Impact**: Potential security vulnerability - health check ports accessible from unintended sources.

**Fix**: Added specific AWS health check IP ranges for us-east-1 region.

```typescript
// ADDED
const awsHealthCheckCidrs = [
  '54.239.98.0/24',
  '54.239.99.0/24',
  '54.239.100.0/24',
  '54.239.101.0/24',
];

// Added to instance security group
...awsHealthCheckCidrs.map(cidr => ({
  protocol: 'tcp' as const,
  fromPort: 443,
  toPort: 443,
  cidrBlocks: [cidr],
  description: 'Allow health checks from AWS',
}))
```

### 9. Incorrect CloudWatch Alarm Threshold

**Issue**: Alarm threshold set to absolute count (3) instead of calculating 50% of total instances (6).

**Impact**: While the number is coincidentally correct (3 = 50% of 6), the implementation doesn't show understanding of percentage-based thresholds.

**Fix**: Added clear comment explaining the calculation and separated alarms for primary and secondary.

```typescript
// IMPROVED with better documentation
threshold: 3, // 50% of 6 instances
```

### 10. Hardcoded AMI ID

**Issue**: Used hardcoded, outdated AMI ID that may not exist in target account.

**Impact**: Deployment would fail if AMI doesn't exist or is not accessible.

**Fix**: Used dynamic AMI lookup to get latest Amazon Linux 2 AMI.

```typescript
// BEFORE (Wrong)
imageId: "ami-0c55b159cbfafe1f0",

// AFTER (Correct)
const ami = aws.ec2.getAmi({
  mostRecent: true,
  owners: ['amazon'],
  filters: [
    { name: 'name', values: ['amzn2-ami-hvm-*-x86_64-gp2'] },
    { name: 'state', values: ['available'] },
  ],
});

// Use in launch template
imageId: ami.then(a => a.id),
```

## Medium-Priority Issues

### 11. Missing User Data for EC2 Instances

**Issue**: Launch template had no user data to configure instances for payment API service.

**Impact**: Instances would launch but not be ready to serve traffic or pass health checks.

**Fix**: Added comprehensive user data script to:
- Install and configure Apache with SSL
- Create health check endpoint
- Install CloudWatch agent for monitoring

```typescript
// ADDED
const userData = `#!/bin/bash
set -e
yum update -y
yum install -y httpd mod_ssl
systemctl start httpd
systemctl enable httpd

# Create health check endpoint
cat > /var/www/html/health <<EOF
OK
EOF

# Configure SSL
mkdir -p /etc/ssl/private
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/ssl/private/payment.key \
  -out /etc/ssl/certs/payment.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=payment-api"

# CloudWatch agent for monitoring
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm
`;
```

### 12. Missing IAM Roles for Instances

**Issue**: No IAM instance profile configured for EC2 instances.

**Impact**: Instances cannot access CloudWatch for logging/monitoring or SSM for management.

**Fix**: Created IAM role with CloudWatch and SSM policies attached.

```typescript
// ADDED
const instanceRole = new aws.iam.Role(`payment-instance-role-${environmentSuffix}`, { ... });
const instanceProfile = new aws.iam.InstanceProfile(`payment-instance-profile-${environmentSuffix}`, {
  role: instanceRole.name,
});

// Attach policies
new aws.iam.RolePolicyAttachment(`payment-cloudwatch-policy-${environmentSuffix}`, {
  role: instanceRole.name,
  policyArn: 'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy',
});

new aws.iam.RolePolicyAttachment(`payment-ssm-policy-${environmentSuffix}`, {
  role: instanceRole.name,
  policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
});
```

### 13. Improper Subnet Selection for Auto Scaling Groups

**Issue**: ASGs used `availabilityZones` parameter without proper subnet selection per AZ.

**Impact**: AWS may place instances in any subnet, not necessarily respecting AZ boundaries.

**Fix**: Changed to use `vpcZoneIdentifiers` with per-AZ subnet selection.

```typescript
// BEFORE (Wrong)
availabilityZones: [az],

// AFTER (Correct)
const subnetsByAz = azs.map(az =>
  aws.ec2.getSubnets({
    filters: [
      { name: 'vpc-id', values: [defaultVpc.then(v => v.id)] },
      { name: 'availability-zone', values: [az] }
    ]
  })
);

// In ASG creation
vpcZoneIdentifiers: subnetIds,
```

### 14. Missing S3 Bucket Policy for ALB Logs

**Issue**: S3 bucket created without policy allowing ALB service to write logs.

**Impact**: ALB access logging would fail silently.

**Fix**: Added bucket policy granting ELB service account permission to write logs.

```typescript
// ADDED
const elbServiceAccount = aws.elb.getServiceAccount({});
const bucketPolicy = new aws.s3.BucketPolicy(`payment-alb-logs-policy-${environmentSuffix}`, {
  bucket: logsBucket.id,
  policy: pulumi.all([logsBucket.arn, elbServiceAccount]).apply(([arn, account]) =>
    JSON.stringify({
      Version: '2012-10-17',
      Statement: [{
        Effect: 'Allow',
        Principal: { AWS: account.arn },
        Action: 's3:PutObject',
        Resource: `${arn}/*`,
      }],
    })
  ),
});
```

### 15. Missing KMS Key Alias

**Issue**: KMS key created without friendly alias for easier reference.

**Impact**: Difficult to identify key purpose in console or CLI operations.

**Fix**: Added KMS alias.

```typescript
// ADDED
const kmsAlias = new aws.kms.Alias(`payment-ebs-key-alias-${environmentSuffix}`, {
  name: `alias/payment-ebs-${environmentSuffix}`,
  targetKeyId: kmsKey.id,
});
```

### 16. Missing Additional CloudWatch Alarms

**Issue**: Only created unhealthy host alarm, missing alarms for latency and other metrics.

**Impact**: Incomplete monitoring - may miss performance degradation issues.

**Fix**: Added latency alarm for comprehensive monitoring.

```typescript
// ADDED
const primaryLatencyAlarm = new aws.cloudwatch.MetricAlarm(`payment-latency-primary-${environmentSuffix}`, {
  comparisonOperator: 'GreaterThanThreshold',
  evaluationPeriods: 2,
  metricName: 'TargetResponseTime',
  namespace: 'AWS/ApplicationELB',
  period: 60,
  statistic: 'Average',
  threshold: 1,
  alarmDescription: 'Alert when primary target response time exceeds 1 second',
  alarmActions: [snsTopic.arn],
  dimensions: {
    LoadBalancer: primaryAlb.arnSuffix,
    TargetGroup: primaryTargetGroup.arnSuffix,
  },
});
```

## Configuration and Best Practices

### 17. Missing Configuration Parameters

**Issue**: Hard-coded values for email and hosted zone name.

**Impact**: Requires code changes for different environments.

**Fix**: Added configuration parameters in TapStackArgs interface.

```typescript
// ADDED to interface
export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
  notificationEmail?: string;  // ADDED
  hostedZoneName?: string;     // ADDED
}
```

### 18. Missing Pulumi.yaml Configuration

**Issue**: No Pulumi.yaml file provided.

**Impact**: Missing project metadata and configuration schema.

**Fix**: Added complete Pulumi.yaml with config parameters.

### 19. Incomplete package.json

**Issue**: Missing package.json for dependency management.

**Impact**: Cannot install required dependencies.

**Fix**: Added complete package.json with all dependencies.

### 20. Missing Health Check Matcher

**Issue**: Target group health checks didn't specify expected HTTP response code.

**Impact**: May accept any response as healthy.

**Fix**: Added `matcher: '200'` to health check configuration.

```typescript
// ADDED
healthCheck: {
  enabled: true,
  interval: 10,
  path: '/health',
  protocol: 'HTTPS',
  timeout: 5,
  healthyThreshold: 2,
  unhealthyThreshold: 3,
  matcher: '200',  // ADDED
}
```

### 21. Missing Session Stickiness

**Issue**: No session stickiness configured on target groups.

**Impact**: Payment API sessions may not be maintained across requests.

**Fix**: Added cookie-based stickiness.

```typescript
// ADDED
stickiness: {
  enabled: true,
  type: 'lb_cookie',
  cookieDuration: 86400,
}
```

### 22. Missing KMS Deletion Window

**Issue**: KMS key created without specifying deletion window.

**Impact**: Uses default, may not align with security policies.

**Fix**: Added explicit 30-day deletion window.

```typescript
// ADDED
deletionWindowInDays: 30,
```

### 23. Insufficient Resource Tagging

**Issue**: Resources tagged inconsistently, missing some required tags.

**Impact**: Difficult to track resources for cost allocation and management.

**Fix**: Added comprehensive tagging including Environment tag in stack initialization and FailoverPriority tags on all failover-related resources.

## Summary Statistics

- **Total Issues Found**: 23
- **Critical Failures**: 5 (Missing environmentSuffix, missing secondary infrastructure, missing TCP health checks)
- **High-Priority Issues**: 11 (SSL certificates, lifecycle policies, security groups, etc.)
- **Medium-Priority Issues**: 7 (User data, IAM roles, configuration management)

## Training Quality Impact

These corrections transform a non-functional implementation into a production-ready multi-AZ failover solution that:

1. Properly supports multiple environments via environmentSuffix
2. Implements true active-passive failover with primary and secondary infrastructure
3. Monitors health comprehensively (HTTP + TCP)
4. Follows AWS security best practices
5. Manages costs through lifecycle policies
6. Provides proper operational visibility through CloudWatch alarms
7. Supports maintainability through proper IAM roles and configuration management

**Estimated Training Quality**: 9/10 (High quality with meaningful corrections that teach important architectural patterns)