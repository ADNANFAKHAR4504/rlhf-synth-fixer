# ❌ model_failure.md

This document outlines CloudFormation template failures that do not meet required security and structural standards.

## 🔴 Failed Modules & Issues

---

### ❌ S3 Bucket: Missing Public Access Blocking
```yaml
Resources:
  MyBucket:
    Type: AWS::S3::Bucket
    Properties:
      AccessControl: PublicRead  # ❌ insecure
```
📛 **Issue**: Public access is enabled.
✅ **Fix**: Use `PublicAccessBlockConfiguration` with all four properties set to `true`.

---

### ❌ S3 Bucket: Missing Encryption
```yaml
Resources:
  InsecureBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: my-bucket
      # Missing BucketEncryption
```
📛 **Issue**: No encryption at rest.
✅ **Fix**: Add `BucketEncryption` using `AES256`.

---

### ❌ EC2 Instance: Missing Security Group
```yaml
Resources:
  EC2Instance:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      # Missing SecurityGroupIds
```
📛 **Issue**: No firewall rules applied.
✅ **Fix**: Attach a `SecurityGroup` via `SecurityGroupIds`.

---

### ❌ EC2 Instance: Invalid or Missing AMI
```yaml
Resources:
  MyEC2:
    Type: AWS::EC2::Instance
    Properties:
      ImageId: ami-12345678  # ❌ wrong or outdated
```
📛 **Issue**: Hardcoded or region-invalid AMI.
✅ **Fix**: Use SSM parameter for dynamic Amazon Linux 2 AMI.

---

### ❌ IAM Role: Wildcard Permissions
```yaml
Resources:
  MyRole:
    Type: AWS::IAM::Role
    Properties:
      Policies:
        - PolicyName: Admin
          PolicyDocument:
            Statement:
              - Effect: Allow
                Action: "*"
                Resource: "*"
```
📛 **Issue**: Over-permissive policy.
✅ **Fix**: Use scoped managed policies like `AmazonS3ReadOnlyAccess`.

---

### ❌ EC2 Instance: Missing Tags
```yaml
Resources:
  MyEC2:
    Type: AWS::EC2::Instance
    Properties:
      InstanceType: t2.micro
      # Missing Tags
```
📛 **Issue**: No `Environment` or `Project` tagging.
✅ **Fix**: Add standard tags for cost tracking and governance.