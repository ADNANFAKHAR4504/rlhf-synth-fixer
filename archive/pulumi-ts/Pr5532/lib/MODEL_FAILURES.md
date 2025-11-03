# Model Failures Documentation

This document describes the intentional errors and omissions in the MODEL_RESPONSE.md implementation for training purposes.

## Critical Security Issues

### 1. CloudWatch Log Group Missing Encryption (Line 50-54)

**Location**: `lib/tap-stack.ts` - CloudWatch LogGroup creation

**Error**: The CloudWatch log group is created without the `kmsKeyId` property, failing to encrypt logs at rest.

**Requirement Violated**: "CloudWatch logs must be encrypted at rest using the same KMS key"

**Impact**: Compliance violation - audit logs are stored in plaintext, exposing sensitive access patterns.

**Fix Required**: Add `kmsKeyId: kmsKey.keyId` to the LogGroup resource.

---

### 2. S3 Bucket Versioning Missing MFA Delete (Line 63-68)

**Location**: `lib/tap-stack.ts` - BucketVersioningV2 configuration

**Error**: The versioning configuration does not include `mfaDelete: 'Enabled'`.

**Requirement Violated**: "Enable MFA delete protection on the S3 bucket"

**Impact**: Critical security gap - objects can be permanently deleted without multi-factor authentication, violating financial services compliance requirements.

**Fix Required**: Add `mfaDelete: 'Enabled'` to the versioningConfiguration.

---

### 3. S3 Lifecycle Missing Abort Incomplete Multipart Uploads (Line 100-114)

**Location**: `lib/tap-stack.ts` - BucketLifecycleConfigurationV2

**Error**: The lifecycle configuration only includes Glacier transition but missing the rule to abort incomplete multipart uploads.

**Requirement Violated**: "S3 lifecycle rules must include abort incomplete multipart uploads after 7 days"

**Impact**: Cost inefficiency - incomplete multipart uploads consume storage indefinitely, leading to unnecessary costs.

**Fix Required**: Add another rule with `abortIncompleteMultipartUpload: { daysAfterInitiation: 7 }`.

---

### 4. DataAnalyst Role Missing maxSessionDuration (Line 117-132)

**Location**: `lib/tap-stack.ts` - DataAnalyst IAM Role

**Error**: The DataAnalyst role is created without the `maxSessionDuration` property.

**Requirement Violated**: "Each IAM role must have a maximum session duration of 1 hour (3600 seconds)"

**Impact**: Security risk - role sessions could last up to 12 hours (AWS default), increasing exposure window if credentials are compromised.

**Fix Required**: Add `maxSessionDuration: 3600` to the role configuration.

---

### 5. DataAnalyst Policy Uses Wildcards for KMS Resources (Line 135-157)

**Location**: `lib/tap-stack.ts` - DataAnalyst IAM Policy

**Error**: The KMS Decrypt action uses `Resource: '*'` instead of explicit KMS key ARN.

**Requirement Violated**: "IAM policies must use explicit ARNs without wildcards for production resources"

**Impact**: Excessive permissions - the role can decrypt data from any KMS key in the account, violating least-privilege principle.

**Fix Required**: Change `Resource: '*'` to `Resource: keyArn` with explicit KMS key ARN.

---

### 6. DataEngineer Policy Missing Source IP Conditions (Line 179-205)

**Location**: `lib/tap-stack.ts` - DataEngineer IAM Policy

**Error**: The policy statements do not include `Condition` blocks with source IP restrictions.

**Requirement Violated**: "All IAM policies must include conditions for source IP restrictions"

**Impact**: Security gap - the role can be assumed and used from any IP address, increasing risk of unauthorized access.

**Fix Required**: Add Condition blocks with `IpAddress: { 'aws:SourceIp': ['10.0.0.0/8'] }` to all policy statements.

---

### 7. DataAnalyst Policy Missing Source IP Conditions (Line 135-157)

**Location**: `lib/tap-stack.ts` - DataAnalyst IAM Policy

**Error**: The DataAnalyst policy also lacks source IP restriction conditions.

**Requirement Violated**: "All IAM policies must include conditions for source IP restrictions"

**Impact**: Same as #6 - role can be used from any location.

**Fix Required**: Add Condition blocks with source IP restrictions to all policy statements.

---

### 8. S3 Bucket Policy Missing HTTPS Enforcement (Line 257-274)

**Location**: `lib/tap-stack.ts` - S3 BucketPolicy

**Error**: The bucket policy only denies unencrypted uploads but does not enforce HTTPS/TLS for all operations.

**Requirement Violated**: "All S3 operations must use HTTPS endpoints only" and "Configure S3 bucket policies that enforce encryption in transit (HTTPS only)"

**Impact**: Critical security vulnerability - data can be transmitted in plaintext over HTTP, exposing sensitive financial data to interception.

**Fix Required**: Add a statement that denies all S3 actions when `aws:SecureTransport` condition is false.

---

## Summary of Errors

| # | Error Type | Severity | Component | Line |
|---|------------|----------|-----------|------|
| 1 | Missing encryption | High | CloudWatch LogGroup | 50-54 |
| 2 | Missing MFA delete | Critical | S3 Versioning | 63-68 |
| 3 | Missing lifecycle rule | Medium | S3 Lifecycle | 100-114 |
| 4 | Missing session duration | High | DataAnalyst Role | 117-132 |
| 5 | Wildcard in resource ARN | High | DataAnalyst Policy | 135-157 |
| 6 | Missing IP restrictions | High | DataEngineer Policy | 179-205 |
| 7 | Missing IP restrictions | High | DataAnalyst Policy | 135-157 |
| 8 | Missing HTTPS enforcement | Critical | S3 Bucket Policy | 257-274 |

**Total Errors**: 8
**Critical**: 2
**High**: 5
**Medium**: 1

## Training Value

These errors represent common security misconfigurations in production IaC:

1. **Encryption gaps**: Forgetting to encrypt audit logs
2. **MFA protection**: Overlooking MFA delete for critical data
3. **Cost optimization**: Missing lifecycle rules for multipart uploads
4. **Session management**: Using default session durations
5. **Least privilege**: Using wildcards instead of explicit ARNs
6. **Network security**: Missing IP-based access controls
7. **Transport security**: Incomplete HTTPS enforcement

The IDEAL_RESPONSE.md will demonstrate the correct implementation with all security requirements properly configured.
