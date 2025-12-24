# Multi-Stage CI/CD Pipeline Infrastructure

This CloudFormation solution deploys a comprehensive CI/CD pipeline with cross-account deployment capabilities, security scanning, artifact encryption, and monitoring.

## Architecture Overview

The pipeline consists of the following stages:

1. **Source**: Pulls code from AWS CodeCommit
2. **Build**: Runs unit tests using CodeBuild
3. **Test**: Performs security scanning using CodeBuild
4. **Deploy to Staging**: Deploys to staging account using cross-account role
5. **Manual Approval**: Requires manual approval before production
6. **Deploy to Production**: Deploys to production account using cross-account role

## Features

- **Cross-Account Deployment**: Supports deploying to separate staging and production AWS accounts
- **Artifact Encryption**: All artifacts encrypted using KMS with automatic key rotation
- **Security Scanning**: Mandatory security scanning before any deployment
- **Monitoring**: EventBridge rules for pipeline state changes and failures
- **Manual Approval**: Production deployments require manual approval
- **Lifecycle Management**: Automatic cleanup of old artifacts
- **Notifications**: SNS topic for pipeline events

## Prerequisites

1. AWS CodeCommit repository created
2. Access to staging and production AWS accounts
3. AWS CLI configured with appropriate credentials
4. Valid account IDs for staging and production environments

## Deployment Instructions

### Step 1: Deploy Cross-Account Roles (in Staging and Production Accounts)

First, deploy the cross-account role in both staging and production accounts:

```bash
# Deploy in staging account
aws cloudformation create-stack \
  --stack-name pipeline-cross-account-role-staging \
  --template-body file://cross-account-role.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=PipelineAccountId,ParameterValue=<PIPELINE_ACCOUNT_ID> \
    ParameterKey=ArtifactBucketName,ParameterValue=pipeline-artifacts-dev-<PIPELINE_ACCOUNT_ID> \
    ParameterKey=KMSKeyArn,ParameterValue=<KMS_KEY_ARN> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --profile staging

# Deploy in production account
aws cloudformation create-stack \
  --stack-name pipeline-cross-account-role-production \
  --template-body file://cross-account-role.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=PipelineAccountId,ParameterValue=<PIPELINE_ACCOUNT_ID> \
    ParameterKey=ArtifactBucketName,ParameterValue=pipeline-artifacts-dev-<PIPELINE_ACCOUNT_ID> \
    ParameterKey=KMSKeyArn,ParameterValue=<KMS_KEY_ARN> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1 \
  --profile production
```

**Note**: You'll need to deploy the pipeline first to get the KMS key ARN, then update the cross-account roles, or create the KMS key separately first.

### Step 2: Deploy the Pipeline (in Pipeline Account)

Deploy the main pipeline stack:

```bash
aws cloudformation create-stack \
  --stack-name cicd-pipeline-stack \
  --template-body file://pipeline.yaml \
  --parameters \
    ParameterKey=EnvironmentSuffix,ParameterValue=dev \
    ParameterKey=StagingAccountId,ParameterValue=<STAGING_ACCOUNT_ID> \
    ParameterKey=ProductionAccountId,ParameterValue=<PRODUCTION_ACCOUNT_ID> \
    ParameterKey=SourceRepositoryName,ParameterValue=my-application \
    ParameterKey=SourceBranchName,ParameterValue=main \
    ParameterKey=ArtifactRetentionDays,ParameterValue=30 \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Step 3: Update Cross-Account Roles with KMS Key ARN

After the pipeline stack is created, get the KMS Key ARN from outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name cicd-pipeline-stack \
  --query 'Stacks[0].Outputs[?OutputKey==`KMSKeyId`].OutputValue' \
  --output text
```

Then update the cross-account role stacks in staging and production with the actual KMS Key ARN.

## Parameters

| Parameter | Description | Default | Required |
|-----------|-------------|---------|----------|
| EnvironmentSuffix | Suffix for resource naming | dev | Yes |
| StagingAccountId | AWS Account ID for staging | - | Yes |
| ProductionAccountId | AWS Account ID for production | - | Yes |
| SourceRepositoryName | CodeCommit repository name | my-application | Yes |
| SourceBranchName | Branch to monitor | main | Yes |
| ArtifactRetentionDays | Days to retain artifacts | 30 | No |

## Resource Naming Convention

All resources include the `EnvironmentSuffix` parameter:

- Pipeline: `cicd-pipeline-{EnvironmentSuffix}`
- Artifact Bucket: `pipeline-artifacts-{EnvironmentSuffix}-{AccountId}`
- KMS Key Alias: `alias/pipeline-artifacts-{EnvironmentSuffix}`
- CodeBuild Projects: `unit-test-project-{EnvironmentSuffix}`, `security-scan-project-{EnvironmentSuffix}`
- IAM Roles: `codepipeline-service-role-{EnvironmentSuffix}`, `codebuild-service-role-{EnvironmentSuffix}`

## Testing

### Test Pipeline Execution

1. Push code to the CodeCommit repository:
```bash
git push origin main
```

2. Monitor pipeline execution:
```bash
aws codepipeline get-pipeline-state \
  --name cicd-pipeline-dev \
  --region us-east-1
```

3. Check pipeline execution history:
```bash
aws codepipeline list-pipeline-executions \
  --pipeline-name cicd-pipeline-dev \
  --region us-east-1
```

### Test Manual Approval

1. Wait for pipeline to reach approval stage
2. Approve through console or CLI:
```bash
aws codepipeline put-approval-result \
  --pipeline-name cicd-pipeline-dev \
  --stage-name ApprovalForProduction \
  --action-name ManualApproval \
  --result summary="Approved",status=Approved \
  --token <TOKEN_FROM_GET_PIPELINE_STATE> \
  --region us-east-1
```

### Verify Notifications

Check SNS topic for notifications:
```bash
aws sns list-subscriptions-by-topic \
  --topic-arn <TOPIC_ARN> \
  --region us-east-1
```

## Monitoring and Troubleshooting

### View Pipeline Logs

Check CodeBuild logs:
```bash
# Unit test logs
aws logs tail /aws/codebuild/unit-test-dev --follow --region us-east-1

# Security scan logs
aws logs tail /aws/codebuild/security-scan-dev --follow --region us-east-1
```

### Check EventBridge Rules

List all rules:
```bash
aws events list-rules --region us-east-1
```

View rule targets:
```bash
aws events list-targets-by-rule \
  --rule pipeline-state-change-dev \
  --region us-east-1
```

### Common Issues

**Issue**: Pipeline fails at cross-account deployment
- **Solution**: Verify cross-account role has correct trust relationship and permissions

**Issue**: KMS encryption errors
- **Solution**: Ensure KMS key policy allows access from staging/production accounts

**Issue**: CodeBuild fails
- **Solution**: Check buildspec.yaml in your repository and verify build commands

## Cleanup

To delete all resources:

```bash
# Delete pipeline stack
aws cloudformation delete-stack \
  --stack-name cicd-pipeline-stack \
  --region us-east-1

# Delete cross-account roles in staging
aws cloudformation delete-stack \
  --stack-name pipeline-cross-account-role-staging \
  --region us-east-1 \
  --profile staging

# Delete cross-account roles in production
aws cloudformation delete-stack \
  --stack-name pipeline-cross-account-role-production \
  --region us-east-1 \
  --profile production

# Empty and delete artifact bucket (if not automatically deleted)
aws s3 rb s3://pipeline-artifacts-dev-<ACCOUNT_ID> --force --region us-east-1
```

## Security Considerations

1. **Encryption**: All artifacts encrypted at rest using KMS
2. **Least Privilege**: IAM roles follow least privilege principle
3. **Cross-Account**: Separate accounts for staging and production
4. **Scanning**: Mandatory security scanning before deployment
5. **Approval**: Manual approval required for production deployments
6. **Monitoring**: All state changes tracked via EventBridge

## Cost Optimization

- Artifacts automatically deleted after 30 days (configurable)
- Old versions of artifacts deleted after 7 days
- CodeBuild uses small compute instances
- EventBridge rules filter only relevant events

## Additional Resources

- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [Cross-Account Deployment](https://docs.aws.amazon.com/codepipeline/latest/userguide/pipelines-create-cross-account.html)
- [KMS Key Policies](https://docs.aws.amazon.com/kms/latest/developerguide/key-policies.html)
