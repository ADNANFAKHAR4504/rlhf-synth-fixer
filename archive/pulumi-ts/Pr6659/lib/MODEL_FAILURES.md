# Model Response Failures Analysis

The initial MODEL_RESPONSE had several issues that were corrected during the QA process. This document captures those failures for training improvement.

## Critical Failures

### 1. AWS Naming Restrictions Violation

**Impact Level**: Critical (Deployment blocker)

**MODEL_RESPONSE Issue**: Security group names started with "sg-" prefix
```typescript
const primaryAlbSg = new aws.ec2.SecurityGroup(`sg-primary-alb-${environmentSuffix}`, ...);
```

**IDEAL_RESPONSE Fix**: Moved prefix to middle/end of name
```typescript
const primaryAlbSg = new aws.ec2.SecurityGroup(`alb-primary-sg-${environmentSuffix}`, ...);
```

**Root Cause**: Model was unaware of AWS restriction that security group names cannot begin with "sg-" (reserved prefix)

**AWS Documentation Reference**: https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/working-with-security-groups.html

**Cost/Security/Performance Impact**: Deployment blocker - would fail immediately on resource creation

---

### 2. Incorrect Pulumi AWS Class Name

**Impact Level**: Critical (Build blocker)

**MODEL_RESPONSE Issue**: Used non-existent class name
```typescript
const bucketReplication = new aws.s3.BucketReplicationConfiguration(...);
```

**IDEAL_RESPONSE Fix**: Corrected to actual Pulumi AWS class
```typescript
const bucketReplication = new aws.s3.BucketReplicationConfig(...);
```

**Root Cause**: Model used CloudFormation/Terraform naming convention instead of Pulumi-specific class names

**Cost/Security/Performance Impact**: Build failure - TypeScript compilation error

---

### 3. Incorrect S3 Replication Property Structure

**Impact Level**: High (Type error)

**MODEL_RESPONSE Issue**: Flat property structure
```typescript
destination: {
  bucket: secondaryBucket.arn,
  replicaKmsKeyId: secondaryKmsKey.arn,
}
```

**IDEAL_RESPONSE Fix**: Nested encryption configuration
```typescript
destination: {
  bucket: secondaryBucket.arn,
  encryptionConfiguration: {
    replicaKmsKeyId: secondaryKmsKey.arn,
  },
}
```

**Root Cause**: Model confused S3 bucket replication API structure across AWS SDKs

**Cost/Security/Performance Impact**: Type error preventing compilation

---

## Medium Failures

### 4. Excessive NAT Gateway Cost

**Impact Level**: Medium (Cost optimization)

**MODEL_RESPONSE Issue**: Created 3 NAT Gateways in primary region (one per AZ)
```typescript
const primaryNatEips = [0, 1, 2].map(i => new aws.ec2.Eip(...));
const primaryNatGateways = primaryNatEips.map((eip, i) => new aws.ec2.NatGateway(...));
```

**IDEAL_RESPONSE Fix**: Reduced to single NAT Gateway
```typescript
const primaryNatEip = new aws.ec2.Eip(...);
const primaryNatGateway = new aws.ec2.NatGateway(...);
```

**Root Cause**: Model prioritized high availability over cost optimization without considering the trade-off was explicitly mentioned in requirements

**Cost/Security/Performance Impact**: ~$96/month savings (2 fewer NAT Gateways at $0.045/hour each)

---

### 5. TypeScript Unused Variable Warnings

**Impact Level**: Low (Code quality)

**MODEL_RESPONSE Issue**: Resources assigned to const but never referenced, causing lint errors

**IDEAL_RESPONSE Fix**: Added void statements to mark resources as intentionally unused (created for infrastructure side effects)
```typescript
void secondaryClusterInstance;
void bucketReplication;
// ... etc
```

**Root Cause**: Model didn't account for ESLint no-unused-vars rule in infrastructure-as-code context where resources are created for side effects

**Cost/Security/Performance Impact**: Lint failures blocking PR creation

---

## Summary

- Total failures: 3 Critical, 1 High, 1 Medium
- Primary knowledge gaps:
  1. AWS service-specific naming restrictions
  2. Pulumi provider-specific API differences from CloudFormation/Terraform
  3. TypeScript/ESLint conventions in IaC context
- Training value: High - These are common pitfalls when generating multi-cloud IaC that require platform-specific knowledge
- Training quality score: 8/10 - Core infrastructure design was correct, but implementation details needed refinement
