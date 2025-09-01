# Fix Terraform Deployment Errors for AWS CI/CD Pipeline

I'm trying to deploy a CI/CD pipeline infrastructure using Terraform on AWS, but I'm getting several deployment errors that need to be fixed. The deployment is failing with multiple issues related to Elastic Beanstalk, Secrets Manager, CloudWatch Logs, and CloudTrail.

## Current Issues

During `terraform apply`, I'm encountering these specific errors:

### 1. Elastic Beanstalk Solution Stack Error

```
Error: creating Elastic Beanstalk Environment (beanstalk-env-your-app-name-prod):
operation error Elastic Beanstalk: CreateEnvironment, https response error StatusCode: 400,
api error InvalidParameterValue: No Solution Stack named '64bit Amazon Linux 2 v5.8.4 running Node.js 18' found.
```

**Issue:** The solution stack name appears to be invalid or outdated.

### 2. Secrets Manager Replica Region Error

```
Error: creating Secrets Manager Secret (ci-pipeline/app-secrets):
operation error Secrets Manager: CreateSecret, https response error StatusCode: 400,
InvalidParameterException: Invalid replica region.
```

**Issue:** There's a problem with the replica region configuration in Secrets Manager.

### 3. CloudWatch Logs KMS Key Error

```
Error: creating CloudWatch Logs Log Group (/aws/codebuild/ci-pipeline-build):
operation error CloudWatch Logs: CreateLogGroup, https response error StatusCode: 400,
api error AccessDeniedException: The specified KMS key does not exist or is not allowed to be used
```

**Issue:** KMS key permissions or configuration issue with CloudWatch Logs.

### 4. CloudTrail S3/KMS Permissions Error

```
Error: creating CloudTrail Trail (ci-pipeline-trail):
operation error CloudTrail: CreateTrail, https response error StatusCode: 400,
InsufficientEncryptionPolicyException: Insufficient permissions to access S3 bucket or KMS key.
```

**Issue:** CloudTrail doesn't have proper permissions to access the S3 bucket or KMS key.

## What I Need

Please help me fix these Terraform configuration issues:

1. **Update the Elastic Beanstalk solution stack** to use a valid, current stack name for Node.js applications
2. **Fix the Secrets Manager replica configuration** to work properly with the target region
3. **Resolve the CloudWatch Logs KMS permissions** issue so the log group can be created
4. **Fix the CloudTrail permissions** for S3 bucket and KMS key access

## Context

- Deploying to `us-east-1` region
- Using a single main.tf file with all resources
- KMS key is defined and should be used for encryption across services
- S3 buckets are created with proper encryption and access controls

Please provide the specific configuration changes needed to resolve these deployment errors.
