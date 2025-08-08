# Model Failure Scenarios & Edge Cases

## Common CloudFormation Template Failures

### 1. Template Validation Failures

#### Syntax Errors

```yaml
# ❌ INCORRECT - Invalid YAML syntax
Parameters
  Environment:
    Type: String
    # Missing colon after Parameters
```

**Expected Error**: `Template format error: YAML not well-formed`

**Fix**: Ensure proper YAML indentation and syntax

```yaml
# ✅ CORRECT
Parameters:
  Environment:
    Type: String
```

#### Invalid Resource Properties

```yaml
# ❌ INCORRECT - Invalid property for S3 bucket
Resources:
  FinApp-SecureDocuments:
    Type: AWS::S3::Bucket
    Properties:
      InvalidProperty: true
```

**Expected Error**: `Invalid template property or properties`

#### Missing Required Properties

```yaml
# ❌ INCORRECT - Missing AssumeRolePolicyDocument
Resources:
  FinApp-S3AccessRole:
    Type: AWS::IAM::Role
    Properties:
      RoleName: FinApp-Role
      # AssumeRolePolicyDocument is required but missing
```

### 2. Security Configuration Failures

#### Weak Encryption Settings

```yaml
# ❌ SECURITY FAILURE - No encryption specified
Resources:
  FinApp-SecureDocuments:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: finapp-documents
      # BucketEncryption missing - allows unencrypted data
```

**Security Risk**: High - Sensitive financial data stored unencrypted

#### Overprivileged IAM Policies

```yaml
# ❌ SECURITY FAILURE - Too broad permissions
Policies:
  - PolicyName: S3AccessPolicy
    PolicyDocument:
      Statement:
        - Effect: Allow
          Action: 's3:*' # Too broad!
          Resource: '*' # Too broad!
```

**Security Risk**: Critical - Violates least privilege principle

#### Missing Public Access Block

```yaml
# ❌ SECURITY FAILURE - No public access prevention
Resources:
  FinApp-SecureDocuments:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: finapp-documents
      # PublicAccessBlockConfiguration missing
```

**Security Risk**: Critical - Bucket could be made public

### 3. Deployment Failures

#### Resource Naming Conflicts

```yaml
# ❌ DEPLOYMENT FAILURE - Hardcoded bucket name
Resources:
  FinApp-SecureDocuments:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: 'finapp-documents' # Will fail if exists
```

**Expected Error**: `BucketAlreadyExists`

**Fix**: Use dynamic naming with parameters

```yaml
# ✅ CORRECT
BucketName: !Sub 'finapp-documents-${BucketNameSuffix}-${AWS::AccountId}'
```

#### Invalid Resource References

```yaml
# ❌ REFERENCE FAILURE - Incorrect Ref usage
Resources:
  FinApp-BucketPolicy:
    Type: AWS::S3::BucketPolicy
    Properties:
      Bucket: !Ref NonExistentResource # Resource doesn't exist
```

#### Circular Dependencies

```yaml
# ❌ CIRCULAR DEPENDENCY - Role depends on bucket, bucket depends on role
Resources:
  FinApp-S3AccessRole:
    Type: AWS::IAM::Role
    Properties:
      Policies:
        - PolicyDocument:
            Statement:
              - Resource: !GetAtt FinApp-SecureDocuments.Arn

  FinApp-SecureDocuments:
    Type: AWS::S3::Bucket
    Properties:
      NotificationConfiguration:
        LambdaConfigurations:
          - Function: !GetAtt FinApp-S3AccessRole.Arn # Invalid circular ref
```

### 4. Runtime Security Failures

#### SSL/TLS Not Enforced

```yaml
# ❌ RUNTIME SECURITY FAILURE - HTTP allowed
BucketPolicy:
  Statement:
    - Effect: Allow # Should be Deny for HTTP
      Principal: '*'
      Action: 's3:*'
      Resource: !Sub '${FinApp-SecureDocuments}/*'
      Condition:
        Bool:
          'aws:SecureTransport': 'false'
```

**Test Case**: HTTP requests should be rejected

```bash
# This should FAIL
curl -X PUT http://bucket-name.s3.amazonaws.com/test-file
```

#### Encryption Bypass

```yaml
# ❌ POLICY LOOPHOLE - Allows unencrypted uploads
Statement:
  - Effect: Allow
    Action: 's3:PutObject'
    Resource: !Sub '${FinApp-SecureDocuments}/*'
    # Missing condition to require encryption
```

**Test Case**: Unencrypted uploads should be blocked

```javascript
// This should FAIL
await s3Client.putObject({
  Bucket: bucketName,
  Key: 'test.txt',
  Body: 'content',
  // No ServerSideEncryption specified
});
```

### 5. Compliance Failures

#### Missing Audit Trails

```yaml
# ❌ COMPLIANCE FAILURE - No CloudTrail integration
Resources:
  # S3 bucket defined but no CloudTrail logging
  # Violates audit requirements for financial applications
```

#### Inadequate Data Retention

```yaml
# ❌ COMPLIANCE FAILURE - Insufficient retention period
LifecycleConfiguration:
  Rules:
    - Status: Enabled
      ExpirationInDays: 30 # Too short for financial records
```

**Regulatory Requirement**: Financial documents require 7+ years retention

### 6. Testing Failures

#### Integration Test Failures

```typescript
// ❌ TEST FAILURE - IAM permissions not working
describe('S3 Access Tests', () => {
  it('should allow authorized access', async () => {
    // This will fail if IAM role lacks permissions
    await expect(
      s3Client.getObject({
        Bucket: bucketName,
        Key: 'test-file',
      })
    ).resolves.toBeDefined();
  });
});
```

#### Unit Test Edge Cases

```typescript
// ❌ EDGE CASE - Empty bucket name parameter
it('should handle empty bucket name suffix', () => {
  const template = generateTemplate({ BucketNameSuffix: '' });
  // Should fail validation - bucket name too short
});

// ❌ EDGE CASE - Invalid character in bucket name
it('should reject invalid bucket naming', () => {
  const template = generateTemplate({
    BucketNameSuffix: 'UPPERCASE_INVALID',
  });
  // Should fail - S3 bucket names must be lowercase
});
```

### 7. Environment-Specific Failures

#### Cross-Region Issues

```yaml
# ❌ REGION FAILURE - Hardcoded region-specific resource
Resources:
  FinApp-VPCEndpoint:
    Type: AWS::EC2::VPCEndpoint
    Properties:
      VpcId: vpc-12345678 # Hardcoded - won't exist in other regions
```

#### Account-Specific Dependencies

```yaml
# ❌ ACCOUNT FAILURE - Hardcoded account ID
Statement:
  - Principal:
      AWS: 'arn:aws:iam::123456789012:root' # Won't work in other accounts
```

## Failure Detection Strategies

### Pre-Deployment Validation

```bash
# Template syntax validation
aws cloudformation validate-template --template-body file://TapStack.yml

# Security policy simulation
aws iam simulate-principal-policy --policy-source-arn <role-arn> --action-names s3:GetObject

# Resource naming validation
aws s3api head-bucket --bucket <bucket-name> 2>/dev/null && echo "Bucket exists"
```

### Post-Deployment Security Checks

```bash
# Verify encryption
aws s3api get-bucket-encryption --bucket <bucket-name>

# Check public access
aws s3api get-public-access-block --bucket <bucket-name>

# Validate IAM permissions
aws iam get-role-policy --role-name <role-name> --policy-name <policy-name>
```

### Automated Testing for Failure Scenarios

```typescript
describe('Failure Scenarios', () => {
  it('should reject public access attempts', async () => {
    await expect(
      s3Client.putBucketAcl({
        Bucket: bucketName,
        ACL: 'public-read',
      })
    ).rejects.toThrow('AccessDenied');
  });

  it('should require HTTPS', async () => {
    const httpUrl = `http://${bucketName}.s3.amazonaws.com/test`;
    await expect(fetch(httpUrl, { method: 'PUT' })).rejects.toThrow();
  });
});
```

## Recovery Procedures

### Template Rollback

```bash
# Automatic rollback on failure
aws cloudformation cancel-update-stack --stack-name FinApp-Security

# Manual rollback to previous version
aws cloudformation continue-update-rollback --stack-name FinApp-Security
```

### Security Incident Response

1. **Immediate**: Disable IAM role if compromised
2. **Assessment**: Review CloudTrail logs for unauthorized access
3. **Containment**: Apply additional bucket policies
4. **Recovery**: Rotate access keys and update policies
5. **Prevention**: Update template to address vulnerability

## Common Pitfalls & Prevention

| Failure Type      | Root Cause                     | Prevention                       |
| ----------------- | ------------------------------ | -------------------------------- |
| Naming Conflicts  | Hardcoded resource names       | Use parameters + account ID      |
| Permission Errors | Over/under-privileged policies | Follow least privilege principle |
| Encryption Gaps   | Missing encryption settings    | Mandatory encryption policies    |
| Public Exposure   | Incomplete access blocks       | Always block public access       |
| Audit Failures    | Missing logging                | Enable CloudTrail by default     |
