# Model Failures Documentation

This document details the critical issues found in the initial code generation and their fixes.

## Critical Issue #1: KMS Key Policy Missing CloudWatch Logs Service Principal

### Symptom

Deployment fails when creating CloudWatch Log Group with KMS encryption:

```
Error: creating CloudWatch Logs Log Group (/aws/lambda/rotation-function-dev-001):
InvalidParameterException: User is not authorized to perform kms:CreateGrant on resource
arn:aws:kms:us-east-1:123456789012:key/abcd1234-5678-90ab-cdef-EXAMPLE11111
```

### Root Cause

The KMS key policy for CloudWatch Logs encryption was incomplete. It only included IAM user permissions but lacked:
1. Service principal for `logs.{region}.amazonaws.com`
2. Required KMS actions for CloudWatch Logs service
3. Encryption context condition for log group ARN

### Buggy Code

```typescript
const logsKmsKey = new aws.kms.Key(
  `logs-kms-key-${environmentSuffix}`,
  {
    description: `KMS key for CloudWatch Logs encryption - ${environmentSuffix}`,
    enableKeyRotation: true,
    policy: pulumi.interpolate`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${accountId}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    }
  ]
}`,
    tags,
  },
  { parent: this }
);
```

### Fix Applied

Added comprehensive policy statement for CloudWatch Logs service:

```typescript
const logsKmsKey = new aws.kms.Key(
  `logs-kms-key-${environmentSuffix}`,
  {
    description: `KMS key for CloudWatch Logs encryption - ${environmentSuffix}`,
    enableKeyRotation: true,
    policy: pulumi.interpolate`{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "Enable IAM User Permissions",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::${accountId}:root"
      },
      "Action": "kms:*",
      "Resource": "*"
    },
    {
      "Sid": "Allow CloudWatch Logs",
      "Effect": "Allow",
      "Principal": {
        "Service": "logs.${region}.amazonaws.com"
      },
      "Action": [
        "kms:Encrypt",
        "kms:Decrypt",
        "kms:ReEncrypt*",
        "kms:GenerateDataKey*",
        "kms:CreateGrant",
        "kms:DescribeKey"
      ],
      "Resource": "*",
      "Condition": {
        "ArnEquals": {
          "kms:EncryptionContext:aws:logs:arn": "arn:aws:logs:${region}:${accountId}:log-group:/aws/lambda/rotation-function-${environmentSuffix}"
        }
      }
    }
  ]
}`,
    tags,
  },
  { parent: this }
);
```

### Why This Matters

1. **Security**: CloudWatch Logs needs explicit permission to use customer-managed KMS keys
2. **Encryption Context**: AWS requires specific encryption context conditions for log group encryption
3. **Service Principal**: The service principal must match the region: `logs.{region}.amazonaws.com`
4. **Actions**: CloudWatch Logs needs CreateGrant permission for cross-service operations

### References

- AWS Documentation: [Encrypt log data in CloudWatch Logs using AWS KMS](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/encrypt-log-data-kms.html)
- Required KMS Actions: Encrypt, Decrypt, ReEncrypt*, GenerateDataKey*, CreateGrant, DescribeKey
- Encryption context must include: `kms:EncryptionContext:aws:logs:arn`

---

## Critical Issue #2: Aurora Instance Class Incompatibility

### Symptom

Deployment fails when creating Aurora cluster instance:

```
Error: creating RDS Cluster Instance (aurora-instance-dev-001): InvalidParameterCombination:
DB instance class db.t3.small does not support the following features: Aurora MySQL version 8.0
```

### Root Cause

Aurora MySQL 8.0.mysql_aurora.3.04.0 requires minimum instance class of `db.t3.medium`. The `db.t3.small` instance class is not compatible with Aurora MySQL 8.0.

### Buggy Code

```typescript
const dbInstance = new aws.rds.ClusterInstance(
  `aurora-instance-${environmentSuffix}`,
  {
    clusterIdentifier: dbCluster.id,
    instanceClass: "db.t3.small", // INCOMPATIBLE with Aurora MySQL 8.0
    engine: "aurora-mysql",
    engineVersion: "8.0.mysql_aurora.3.04.0",
    publiclyAccessible: false,
    tags: { ...tags, Name: `aurora-instance-${environmentSuffix}` },
  },
  { parent: this }
);
```

### Fix Applied

Changed instance class to `db.t3.medium`:

```typescript
const dbInstance = new aws.rds.ClusterInstance(
  `aurora-instance-${environmentSuffix}`,
  {
    clusterIdentifier: dbCluster.id,
    instanceClass: "db.t3.medium", // FIXED: Compatible with Aurora MySQL 8.0
    engine: "aurora-mysql",
    engineVersion: "8.0.mysql_aurora.3.04.0",
    publiclyAccessible: false,
    tags: { ...tags, Name: `aurora-instance-${environmentSuffix}` },
  },
  { parent: this }
);
```

### Why This Matters

1. **Compatibility**: Aurora MySQL 8.0 requires more memory and compute than older versions
2. **Performance**: db.t3.medium provides sufficient resources for secrets rotation workload
3. **Cost**: While db.t3.medium costs more than db.t3.small, it's the minimum viable option
4. **Regional Availability**: db.t3.medium is available in all regions supporting Aurora MySQL 8.0

### Compatible Instance Classes for Aurora MySQL 8.0

- **T3 Family**: db.t3.medium, db.t3.large
- **R5 Family**: db.r5.large, db.r5.xlarge, db.r5.2xlarge, etc.
- **R6g Family**: db.r6g.large, db.r6g.xlarge, etc.

**NOT Compatible**:
- db.t3.small
- db.t3.micro
- db.t2.* (any size)

### References

- AWS Documentation: [DB instance classes for Aurora MySQL](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Concepts.DBInstanceClass.html)
- Aurora MySQL 8.0 minimum requirements
- Instance class compatibility matrix

---

## Validation Testing

Both fixes have been validated through:

1. **Static Analysis**: Code review and pattern matching
2. **Deployment Testing**: Successful infrastructure deployment
3. **Integration Testing**: Secrets rotation functional testing
4. **Compliance Check**: Security and encryption requirements met

## Prevention Strategies

To prevent these issues in future code generation:

### For KMS Key Policies

1. Always include service principal when encrypting AWS service resources
2. Include encryption context conditions for CloudWatch Logs
3. Grant full KMS action set: Encrypt, Decrypt, ReEncrypt*, GenerateDataKey*, CreateGrant, DescribeKey
4. Use region-specific service principal: `logs.{region}.amazonaws.com`

### For Aurora Instance Classes

1. Check AWS documentation for engine version compatibility
2. Use db.t3.medium as minimum for Aurora MySQL 8.0
3. Consider performance requirements for production workloads
4. Test in non-production environment before production deployment

## Impact Analysis

### Issue #1 Impact

- **Severity**: CRITICAL (blocks deployment)
- **Scope**: All CloudWatch Logs with KMS encryption
- **Detection**: Deploy-time error
- **Recovery**: Update KMS key policy, recreate resources

### Issue #2 Impact

- **Severity**: CRITICAL (blocks deployment)
- **Scope**: Aurora MySQL 8.0 cluster instances
- **Detection**: Deploy-time error
- **Recovery**: Update instance class parameter, recreate cluster instance

## Lessons Learned

1. **KMS Policies**: Always comprehensive, include service principals
2. **Instance Sizing**: Verify compatibility with specific engine versions
3. **Documentation**: AWS docs are authoritative for compatibility matrices
4. **Testing**: Deploy-time validation catches configuration errors early
5. **Cost vs. Compatibility**: Sometimes higher-cost resources are necessary for compatibility

## Related Issues

- Similar KMS policy issues may occur with:
  - S3 bucket encryption
  - SNS topic encryption
  - SQS queue encryption
  - RDS encrypted backups

- Similar instance class issues may occur with:
  - RDS MySQL/PostgreSQL version upgrades
  - Aurora PostgreSQL version compatibility
  - Reserved instance purchase validation
