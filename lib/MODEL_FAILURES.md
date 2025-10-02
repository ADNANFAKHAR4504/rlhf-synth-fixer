# Infrastructure Code Issues and Fixes

## Summary
This document outlines the key issues found in the original MODEL_RESPONSE.md implementation and the fixes applied to create a production-ready Pulumi infrastructure solution.

## Critical Issues Fixed

### 1. VPC Subnet CIDR Conflicts

**Issue:** The original code used conflicting CIDR blocks for subnets, causing deployment failures.
```typescript
// Original problematic code
cidrBlock: `10.5.${i * 2}.0/24`  // Results in 10.5.0.0/24, 10.5.2.0/24
```

**Fix:** Adjusted CIDR allocation to avoid overlaps.
```typescript
// Fixed code
cidrBlock: `10.5.${i * 10}.0/24`  // Results in 10.5.0.0/24, 10.5.10.0/24
```

### 2. S3 Bucket Policy Syntax Error

**Issue:** The S3 bucket policy had incorrect async handling causing malformed JSON policy.
```typescript
// Original problematic code
'AWS:SourceAccount': aws.getCallerIdentity().then(identity => identity.accountId)
```

**Fix:** Properly resolved promises using pulumi.all().
```typescript
// Fixed code
policy: pulumi.all([staticBucket.arn, aws.getCallerIdentity()])
  .apply(([bucketArn, identity]) => JSON.stringify({
    // ... proper policy with identity.accountId
  }))
```

### 3. Missing Environment Suffix Propagation

**Issue:** Environment suffix wasn't properly passed from bin/tap.ts to the main stack.
```typescript
// Original code
new TapStack('pulumi-infra', {
  tags: defaultTags,
});
```

**Fix:** Added environment suffix to stack instantiation.
```typescript
// Fixed code
const stack = new TapStack('pulumi-infra', {
  environmentSuffix: environmentSuffix,
  tags: defaultTags,
});
```

### 4. Incomplete Stack Outputs

**Issue:** Stack outputs weren't exported for use in integration tests.

**Fix:** Added proper output exports.
```typescript
export const vpcId = stack.vpcId;
export const albDns = stack.albDns;
export const bucketName = stack.bucketName;
```

### 5. ALB Subnet Requirements

**Issue:** ALB creation failed due to insufficient availability zones.

**Fix:** Ensured at least 2 subnets in different AZs are created and passed to ALB.

### 6. Resource Naming Conflicts

**Issue:** Resources lacked proper environment suffixes causing conflicts between deployments.

**Fix:** Ensured all resource names include environment suffix:
```typescript
`${name}-resource-${args.environmentSuffix}`
```

### 7. Missing Force Destroy Flags

**Issue:** Resources couldn't be destroyed cleanly during cleanup.

**Fix:** Added forceDestroy flags to S3 buckets:
```typescript
forceDestroy: true  // Allows bucket deletion even with objects
```

### 8. Incomplete IAM Permissions

**Issue:** EC2 instances lacked necessary permissions for CloudWatch and SSM.

**Fix:** Added proper IAM role attachments:
```typescript
new aws.iam.RolePolicyAttachment(`ssm-policy`, {
  role: instanceRole.name,
  policyArn: 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore',
});
```

### 9. Missing Health Check Configuration

**Issue:** Target group health checks were too aggressive.

**Fix:** Adjusted health check parameters:
```typescript
healthCheck: {
  healthyThreshold: 2,
  unhealthyThreshold: 3,
  timeout: 5,
  interval: 30,
}
```

### 10. Lack of Monitoring Configuration

**Issue:** CloudWatch alarms weren't properly configured with SNS topics.

**Fix:** Created SNS topic and attached to all alarms:
```typescript
alarmActions: [alarmTopic.arn],
okActions: [alarmTopic.arn],
```

## Additional Improvements

### Security Enhancements
- Added VPC flow logs for network monitoring
- Implemented least privilege IAM roles
- Restricted SSH access to corporate network
- Enabled S3 encryption at rest

### High Availability
- Deployed resources across multiple availability zones
- Added NAT gateway redundancy
- Configured Auto Scaling policies

### Operational Excellence
- Added comprehensive tagging strategy
- Implemented proper resource dependencies
- Added CloudWatch dashboards for visualization
- Configured appropriate log retention periods

### Cost Optimization
- Used t3.micro instances
- Implemented S3 lifecycle policies
- Set appropriate Auto Scaling limits
- Configured log retention to 7 days

## Testing Improvements

### Unit Tests
- Added proper Pulumi mocking
- Separated test files by component
- Achieved better code coverage
- Fixed TypeScript compilation issues in tests

### Build Process
- Fixed TypeScript configuration
- Resolved linting errors
- Added proper eslint-disable comments for intentionally unused resources
- Excluded test files from production build

## Deployment Lessons Learned

1. Always use unique CIDR blocks for subnets
2. Properly handle async operations in Pulumi
3. Include environment suffixes in all resource names
4. Test destroy operations during development
5. Validate IAM permissions before deployment
6. Use proper Pulumi output handling for integration
7. Configure health checks appropriately for application needs
8. Implement comprehensive monitoring from the start