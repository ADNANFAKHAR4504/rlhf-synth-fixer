# MODEL_FAILURES - Infrastructure Issues and Fixes

## Summary
This document details the issues found in the original CloudFormation template and the fixes applied to ensure successful deployment and compliance with best practices.

## Issues Found and Fixed

### 1. Missing EnvironmentSuffix Parameter
**Issue**: The original template did not include an EnvironmentSuffix parameter, which is critical for preventing resource naming conflicts when multiple stacks are deployed.

**Impact**: Resource naming conflicts would occur when deploying multiple environments or testing instances.

**Fix Applied**:
```yaml
Parameters:
  EnvironmentSuffix:
    Description: A suffix to append to resource names for uniqueness
    Type: String
    Default: dev
```

### 2. S3 Bucket Naming Issues
**Issue**: The S3 bucket name used mixed case characters (ScientificComputing-archival-) which violates S3 naming rules that require lowercase letters.

**Error**: `W1031: string [ScientificComputing-archival-...] does not match pattern '^[a-z0-9][a-z0-9.-]*[a-z0-9]$'`

**Fix Applied**:
```yaml
# Changed from:
BucketName: !Sub ${EnvironmentName}-archival-${AWS::AccountId}
# To:
BucketName: !Sub 'tap-archival-${EnvironmentSuffix}-${AWS::AccountId}'
```

### 3. Backup Vault Invalid Encryption Key
**Issue**: The BackupVault resource specified an invalid EncryptionKeyArn value of `alias/aws/backup` which is not a valid ARN format.

**Error**: `Invalid Key provided by the user (Status Code: 400)`

**Fix Applied**:
```yaml
# Removed the EncryptionKeyArn property to use the default AWS-managed key
BackupVault:
  Type: AWS::Backup::BackupVault
  Properties:
    BackupVaultName: !Sub tap-${EnvironmentSuffix}-backup-vault
    # EncryptionKeyArn removed
```

### 4. Lambda Function EFS Mount Timing Issue
**Issue**: The Lambda function attempted to mount EFS before the mount targets were fully available.

**Error**: `EFS file system has mount targets created in all availability zones... but not all are in the available life cycle state yet`

**Fix Applied**:
```yaml
CleanupLambdaFunction:
  Type: AWS::Lambda::Function
  DependsOn:
    - EFSMountTarget1
    - EFSMountTarget2
  Properties:
    # ... rest of properties
```

### 5. Backup Vault Name Length Violation
**Issue**: The concatenated BackupVaultName exceeded the 50-character limit.

**Error**: `string [ScientificComputing-synth82956104b-EFS-Backup-Vault] does not match pattern '^[a-zA-Z0-9\-\_]{2,50}$'`

**Fix Applied**:
```yaml
# Shortened all backup-related resource names:
BackupVaultName: !Sub tap-${EnvironmentSuffix}-backup-vault
BackupPlanName: !Sub tap-${EnvironmentSuffix}-backup-plan
SelectionName: !Sub tap-${EnvironmentSuffix}-efs-selection
```

### 6. Missing DeletionPolicy for Critical Resources
**Issue**: The original template did not explicitly set DeletionPolicy for resources like EFS and S3, which could prevent stack cleanup.

**Impact**: Resources might be retained after stack deletion, causing cleanup issues and unnecessary costs.

**Fix Applied**:
```yaml
EFSFileSystem:
  Type: AWS::EFS::FileSystem
  DeletionPolicy: Delete
  Properties:
    # ...

ArchivalBucket:
  Type: AWS::S3::Bucket
  DeletionPolicy: Delete
  Properties:
    # ...
```

### 7. Missing Resource Name Suffixes
**Issue**: Many resources did not include the EnvironmentSuffix in their names, risking naming conflicts.

**Fix Applied**: Updated all named resources to include ${EnvironmentSuffix}:
- VPC and Subnet tags
- Security Group tags
- EFS tags
- Lambda function name
- IAM role names
- CloudWatch alarm names
- DataSync task name
- Resource share name

## Deployment Statistics
- **Initial Deployment Attempts**: 3 failed
- **Issues Fixed**: 7
- **Final Deployment**: Successful on 4th attempt
- **Stack Name**: TapStacktap82956104
- **Region**: us-east-2
- **Resources Created**: 30+

## Verification Results
- ✅ CloudFormation template validation passed
- ✅ cfn-lint checks passed (after fixes)
- ✅ Stack deployed successfully
- ✅ All resources created as expected
- ✅ Outputs generated correctly
- ✅ Integration tests written to verify deployment

## Best Practices Applied
1. **Environment Isolation**: Added EnvironmentSuffix to prevent resource conflicts
2. **Resource Cleanup**: Added DeletionPolicy to ensure clean stack deletion
3. **Dependency Management**: Added explicit DependsOn for resources with timing dependencies
4. **Naming Conventions**: Enforced lowercase naming for S3 buckets
5. **Character Limits**: Respected AWS service-specific naming limitations
6. **Error Handling**: Fixed all deployment errors through iterative testing