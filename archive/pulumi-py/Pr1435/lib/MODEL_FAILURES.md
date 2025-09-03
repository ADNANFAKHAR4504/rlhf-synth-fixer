# Model Failures

### 1. SNS Topic Policy Assignment Error

**Component**: `lib/components/sns_topic.py`  
**Severity**: CRITICAL  
**Line**: 51

**Problem**: 
```python
policy=self.topic.arn,  # Incorrect - should be policy document
```

**Impact**: Complete deployment failure - CloudFormation expects JSON policy document, not ARN string.

**Root Cause**: Model confusion between policy ARN reference and policy document content.

**Resolution Applied**:
```python
policy=self.topic.arn.apply(lambda arn: _create_topic_policy(arn)),
```

**Prevention**: Validate all AWS resource parameter types against official documentation before implementation.

---

## High Priority Security Issues

### 2. KMS Key Security Vulnerabilities

**Component**: `lib/components/kms_key.py`  
**Severity**: HIGH

#### Issue 2.1: Insufficient Key Deletion Protection
**Line**: 52  
**Problem**: 7-day deletion window too short for production  
**Risk**: Accidental permanent key deletion leading to data loss  
**Resolution**: Increased to 30-day minimum deletion window

#### Issue 2.2: Overly Permissive KMS Policy
**Lines**: 21-22  
**Problem**: 
```python
"Action": "kms:*",
"Resource": "*"
```
**Risk**: Violates principle of least privilege, allows unrestricted KMS access  
**Resolution**: Restricted to specific required actions with service-based conditions:
```python
"Action": [
  "kms:Decrypt",
  "kms:GenerateDataKey",
  "kms:GenerateDataKeyWithoutPlaintext",
  "kms:ReEncrypt*",
  "kms:CreateGrant",
  "kms:DescribeKey"
],
"Resource": "*",
"Condition": {
  "StringEquals": {
    "kms:ViaService": ["s3.*.amazonaws.com", "sns.*.amazonaws.com"]
  }
}
```

### 3. Infrastructure Governance Gaps

**Severity**: HIGH  
**Components**: All

#### Issue 3.1: Missing Resource Tagging Strategy
**Impact**: Poor resource management, cost allocation difficulties, compliance issues  
**Resolution**: Implemented standardized tagging across all components:
- Name, Component, Purpose, Stack tags
- Configurable additional tags per component

#### Issue 3.2: Insufficient Error Handling
**Impact**: Unclear deployment failures, difficult troubleshooting  
**Resolution**: Added validation functions and meaningful error messages

---

## Medium Priority Issues

### 4. S3 Bucket Security Enhancements

**Component**: `lib/components/s3_bucket.py`  
**Severity**: MEDIUM

#### Issue 4.1: Missing MFA Delete Protection
**Problem**: No MFA requirement for versioned object deletion  
**Risk**: Accidental data deletion without multi-factor authentication  
**Resolution**: Added configurable MFA delete protection:
```python
enable_mfa_delete: bool = False  # Configuration option
```

#### Issue 4.2: Predictable Bucket Naming
**Line**: 22  
**Problem**: Deterministic bucket naming pattern  
**Risk**: Bucket enumeration attacks, name conflicts  
**Resolution**: Added 8-character random suffix to bucket names

### 5. IAM Role Flexibility Issues

**Component**: `lib/components/iam_role.py`  
**Severity**: MEDIUM

#### Issue 5.1: Hardcoded Service Principal
**Lines**: 64-65  
**Problem**: Role limited to EC2 service only  
**Impact**: Reduces reusability across AWS services  
**Resolution**: Made service principals configurable with defaults

#### Issue 5.2: Missing IAM Best Practices
**Problem**: No role path, permissions boundary options  
**Impact**: Less organized IAM structure, no additional security guardrails  
**Resolution**: Added configurable path and permissions boundary support

### 6. CloudWatch Alarm Configuration Issues

**Component**: `lib/components/cloudwatch_alarm.py`  
**Severity**: MEDIUM

#### Issue 6.1: Invalid FilterId Usage
**Lines**: 27-30, 51-54  
**Problem**: Hardcoded "EntireBucket" FilterId not valid for S3 metrics  
**Impact**: Potential alarm malfunction  
**Resolution**: Removed invalid FilterId, simplified dimensions to bucket name only

#### Issue 6.2: Static Threshold Values
**Lines**: 25, 49  
**Problem**: Hardcoded thresholds unsuitable for all environments  
**Impact**: False positives or missed alerts  
**Resolution**: Made thresholds configurable with sensible defaults

---

## Low Priority Issues

### 7. Operational and Documentation Issues

#### Issue 7.1: Missing Resource Descriptions
**Components**: Multiple  
**Impact**: Poor documentation, difficult auditing  
**Resolution**: Added descriptions to all IAM resources and components

#### Issue 7.2: Lifecycle Policy Validation Gap
**Component**: `lib/components/s3_bucket.py`  
**Lines**: 82-84  
**Problem**: No validation for transition day ordering  
**Risk**: Lifecycle policy deployment failures  
**Status**: Documented for future enhancement