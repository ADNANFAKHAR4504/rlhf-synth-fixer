# Infrastructure Failures in MODEL_RESPONSE

## Critical Infrastructure Issues

### 1. Over-Engineered VPC Configuration
**Problem**: Created VPC, subnets, internet gateway, route tables, and security groups for Lambda
**Fix**: Removed all VPC resources - Lambda doesn't need VPC to access S3, DynamoDB, SQS, or MediaConvert (all are regional AWS services)
**Impact**: Reduced complexity, cost, and deployment time

### 2. Missing MediaConvert IAM Role
**Problem**: No IAM role for MediaConvert service to access S3 buckets
**Fix**: Added `aws_iam_role.mediaconvert_role` with S3 read/write permissions
**Impact**: MediaConvert jobs would fail without this role

### 3. Missing PassRole Permission
**Problem**: Lambda cannot pass MediaConvert role when creating jobs
**Fix**: Added `lambda_iam_passrole` policy with `iam:PassRole` permission
**Impact**: Lambda would get permission denied when creating MediaConvert jobs

### 4. Wrong Lambda Runtime
**Problem**: Used `nodejs16.x` which is deprecated
**Fix**: Changed to `python3.11` and provided Python Lambda code
**Impact**: Prevents deprecation warnings and future runtime issues

### 5. Non-Deletable Resources
**Problem**: S3 buckets had `force_destroy = false`, KMS key had 10-day deletion window
**Fix**: Set `force_destroy = true` on buckets, reduced KMS deletion to 7 days
**Impact**: Stack can be destroyed in CI/CD without manual cleanup

### 6. Missing Environment Suffix
**Problem**: Hard-coded resource names without environment isolation
**Fix**: Added `var.environment_suffix` to all resource names
**Impact**: Multiple environments (PR branches) can coexist without conflicts

### 7. Hardcoded Region
**Problem**: Hardcoded "us-east-1" in provider and dashboard
**Fix**: Used `var.aws_region` variable throughout
**Impact**: Stack is now region-agnostic

### 8. Missing Lambda Packaging
**Problem**: Referenced `function.zip` file that doesn't exist
**Fix**: Added `archive_file` data source to create zip from `lambda_function.py`
**Impact**: Lambda deployment now works automatically

### 9. Incomplete Lambda Code
**Problem**: Lambda code placeholder couldn't actually process videos
**Fix**: Implemented complete handler with S3 event processing, MediaConvert job creation, and DynamoDB updates
**Impact**: Pipeline is now functional end-to-end

### 10. Missing Dependency Management
**Problem**: S3 notification could be created before SQS policy
**Fix**: Added `depends_on = [aws_sqs_queue_policy.processing_queue_policy]`
**Impact**: Prevents race conditions during deployment

### 11. Wrong KMS Key Reference
**Problem**: Inconsistent use of `aws_kms_key.media_encryption.id` vs `.arn`
**Fix**: Use `.id` for SQS, `.arn` for S3/DynamoDB/CloudWatch Logs
**Impact**: Proper encryption configuration

### 12. Missing MEDIACONVERT_ROLE Environment Variable
**Problem**: Lambda had no way to know which role to pass to MediaConvert
**Fix**: Added `MEDIACONVERT_ROLE` environment variable
**Impact**: Lambda can now create MediaConvert jobs successfully

### 13. Empty Alarm Actions
**Problem**: CloudWatch alarms had `alarm_actions = []`
**Fix**: Kept empty (acceptable) but documented that SNS topics can be added
**Impact**: Alarms now trigger without sending notifications (appropriate for testing)

## Summary

The MODEL_RESPONSE was over-engineered with unnecessary VPC networking while missing critical components (MediaConvert role, PassRole permission, proper Lambda code). The ideal solution removes VPC complexity, adds missing IAM permissions, makes resources deletable for CI/CD, and implements proper environment isolation.
