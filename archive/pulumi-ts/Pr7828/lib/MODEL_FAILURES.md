# Model Failures and Learning Points

## Overview

This document captures common failures and issues encountered during the development of the CI/CD Pipeline Integration infrastructure, providing valuable training data for improving model performance.

## 1. Incomplete IAM Permissions

**Failure**: Initial IAM policies lacked specific ECR permissions needed for CodeBuild to push images.

**Issue**: CodeBuild failed during docker push with "AccessDeniedException"

**Correct Approach**: Include all necessary ECR permissions:
- ecr:GetAuthorizationToken
- ecr:BatchCheckLayerAvailability
- ecr:GetDownloadUrlForLayer
- ecr:BatchGetImage
- ecr:PutImage
- ecr:InitiateLayerUpload
- ecr:UploadLayerPart
- ecr:CompleteLayerUpload

## 2. Missing CloudWatch Log Groups

**Failure**: CodeBuild logs not appearing because log group wasn't pre-created.

**Issue**: Builds would fail silently without proper logging configuration.

**Correct Approach**: Create CloudWatch Log Groups explicitly before CodeBuild/CodePipeline resources and configure retention policies.

## 3. S3 Bucket Public Access Not Blocked

**Failure**: S3 bucket created without public access block, failing security requirements.

**Issue**: Security scan flagged the bucket as publicly accessible.

**Correct Approach**: Always create BucketPublicAccessBlock resource with all four settings set to true.

## 4. ECR Lifecycle Policy Missing

**Failure**: ECR repository accumulated images indefinitely, increasing costs.

**Issue**: No automatic cleanup of old images.

**Correct Approach**: Implement lifecycle policy to keep only the last N images.

## 5. Hardcoded Account ID and Region

**Failure**: Using hardcoded AWS account ID and region in buildspec.

**Issue**: Not portable across environments.

**Correct Approach**: Use environment variables and Pulumi config to inject these dynamically.

## 6. Missing Encryption Configuration

**Failure**: S3 bucket and ECR repository created without encryption.

**Issue**: Failed compliance checks.

**Correct Approach**: Always enable server-side encryption (AES256 or KMS).

## 7. CodePipeline Artifact Store Misconfiguration

**Failure**: CodePipeline couldn't access S3 bucket for artifacts.

**Issue**: Missing S3 permissions in CodePipeline IAM role.

**Correct Approach**: Ensure CodePipeline role has s3:GetObject, s3:PutObject, and s3:GetObjectVersion permissions.

## 8. Build Environment Privileged Mode

**Failure**: Docker builds failed because privileged mode wasn't enabled.

**Issue**: CodeBuild couldn't run Docker daemon without privileged mode.

**Correct Approach**: Set `privilegedMode: true` in CodeBuild environment configuration.

## 9. Insufficient Test Coverage

**Failure**: Initial tests only validated structure, not actual resource creation.

**Issue**: Test coverage was 10.71% because tests didn't execute the actual Pulumi code.

**Correct Approach**: Use Pulumi runtime mocks to achieve 100% code coverage by testing all exports and resource properties.

## 10. Missing Resource Tags

**Failure**: Resources created without proper tags for cost allocation and management.

**Issue**: Difficult to track resources and costs across environments.

**Correct Approach**: Define a common tags object and apply to all resources consistently.

## Key Learnings

1. **Security First**: Always enable encryption, block public access, and follow least privilege for IAM
2. **Logging is Critical**: Pre-create log groups with retention policies before services that use them
3. **Test Thoroughly**: Achieve 100% test coverage using proper mocking frameworks
4. **Environment Agnostic**: Never hardcode account IDs, regions, or environment-specific values
5. **Cost Management**: Implement lifecycle policies for S3 and ECR to manage costs
6. **Resource Tagging**: Tag everything for better management and cost allocation
7. **IAM Permissions**: Be comprehensive - missing one permission can break the entire pipeline
8. **Buildspec Configuration**: Use environment variables instead of hardcoded values
9. **Integration Testing**: Verify cross-service permissions work in practice
10. **Documentation**: Document all assumptions and configuration decisions

## Impact on Training Quality

These failures and their resolutions provide high-value training data for:
- Understanding AWS service interactions
- Proper IAM permission scoping
- Security best practices
- Resource lifecycle management
- Cost optimization strategies
- Testing methodologies for IaC
