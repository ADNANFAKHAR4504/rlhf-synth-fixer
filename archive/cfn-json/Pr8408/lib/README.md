# CI/CD Pipeline for Educational Content Delivery Platform

## Overview

This CloudFormation template creates a complete CI/CD pipeline infrastructure for an educational content delivery platform. The infrastructure includes source control, build automation, pipeline orchestration, artifact storage, logging, and notifications.

## Architecture

The infrastructure consists of the following AWS services:

- AWS CodeCommit: Source code repository
- AWS CodeBuild: Build automation
- AWS CodePipeline: Pipeline orchestration
- Amazon S3: Artifact storage
- Amazon CloudWatch Logs: Build logs
- Amazon SNS: Pipeline notifications
- Amazon EventBridge: Event-driven notifications

## Resources Created

### Source Control

- **CodeCommit Repository**: Hosts the source code with HTTP and SSH clone URLs
  - Repository name includes environment suffix for multi-environment support

### Build Infrastructure

- **CodeBuild Project**: Automated build project
  - Linux container environment (aws/codebuild/standard:5.0)
  - Integrated with CloudWatch Logs
  - Environment variables for artifact bucket reference
  - Inline buildspec with pre-build, build, and post-build phases

- **CloudWatch Log Group**: Stores build logs
  - 7-day retention policy
  - Organized under `/aws/codebuild/` namespace

### Pipeline

- **CodePipeline**: Two-stage pipeline
  - **Source Stage**: Pulls code from CodeCommit on main branch
  - **Build Stage**: Executes CodeBuild project

### Storage

- **S3 Bucket**: Artifact storage
  - Server-side encryption (AES256)
  - Public access blocked
  - Used by pipeline for artifact management

### Notifications

- **SNS Topic**: Pipeline event notifications
  - Configured for pipeline state changes
  - EventBridge integration

- **EventBridge Rule**: Monitors pipeline executions
  - Triggers on pipeline state changes
  - Publishes to SNS topic

### IAM Roles

- **CodeBuild Service Role**: Permissions for CodeBuild
  - CloudWatch Logs access
  - S3 artifact access
  - Managed policy: AWSCodeBuildDeveloperAccess

- **CodePipeline Service Role**: Permissions for CodePipeline
  - S3 artifact access
  - CodeCommit access
  - CodeBuild execution
  - SNS publish

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Valid AWS account with permissions to create the resources

### Deploy Stack

```bash
aws cloudformation create-stack \
  --stack-name education-cicd-<suffix> \
  --template-body file://lib/TapStack.json \
  --parameters ParameterKey=EnvironmentSuffix,ParameterValue=<suffix> \
  --capabilities CAPABILITY_NAMED_IAM \
  --region us-east-1
```

### Validate Template

```bash
aws cloudformation validate-template \
  --template-body file://lib/TapStack.json \
  --region us-east-1
```

### Monitor Deployment

```bash
aws cloudformation describe-stack-events \
  --stack-name education-cicd-<suffix> \
  --region us-east-1
```

### Get Stack Outputs

```bash
aws cloudformation describe-stacks \
  --stack-name education-cicd-<suffix> \
  --region us-east-1 \
  --query 'Stacks[0].Outputs'
```

## Parameters

### EnvironmentSuffix (Required)

- **Type**: String
- **Description**: Unique suffix for resource naming to enable multiple deployments
- **Constraints**: Must contain only alphanumeric characters and hyphens
- **Pattern**: `[a-zA-Z0-9-]+`

This parameter allows multiple instances of the infrastructure to coexist in the same AWS account without naming conflicts.

## Outputs

The stack exports the following outputs:

1. **RepositoryCloneUrlHttp**: HTTP clone URL for the CodeCommit repository
2. **RepositoryCloneUrlSsh**: SSH clone URL for the CodeCommit repository
3. **BuildProjectName**: Name of the CodeBuild project
4. **PipelineName**: Name of the CodePipeline
5. **ArtifactBucketName**: Name of the S3 artifact bucket
6. **BuildLogGroupName**: Name of the CloudWatch log group
7. **NotificationTopicArn**: ARN of the SNS notification topic

All outputs are exported with cross-stack references in the format:
`${AWS::StackName}-<OutputName>`

## Security Features

### S3 Bucket Security

- Server-side encryption enabled (AES256)
- Public access completely blocked:
  - BlockPublicAcls: true
  - BlockPublicPolicy: true
  - IgnorePublicAcls: true
  - RestrictPublicBuckets: true

### IAM Security

- Service-specific IAM roles with least privilege
- Specific assume role policies
- Resource-specific permissions using CloudFormation references

### CloudWatch Logs

- Centralized build logs
- Retention policy to manage storage costs
- Organized namespace structure

## Multi-Environment Support

The infrastructure supports multiple environments through the EnvironmentSuffix parameter:

- Development: `dev`
- Staging: `staging`
- Production: `prod`
- Pull Request: `pr<number>`

Example resource names:
- Repository: `education-platform-dev`
- Pipeline: `education-pipeline-dev`
- Bucket: `cicd-artifacts-dev`

## Pipeline Workflow

1. **Source Stage**:
   - Monitors CodeCommit repository (main branch)
   - Triggers on code commits
   - Outputs source artifact

2. **Build Stage**:
   - Receives source artifact from previous stage
   - Executes buildspec commands:
     - Pre-build: Environment setup
     - Build: Application build (npm install, npm test)
     - Post-build: Completion tasks
   - Outputs build artifact

3. **Notifications**:
   - EventBridge rule monitors pipeline state changes
   - SNS topic receives notifications
   - Subscribers can be added for email/SMS alerts

## Testing

### Unit Tests

Unit tests validate the CloudFormation template structure:

```bash
npm run test:unit
```

Tests cover:
- Template format version
- Parameter definitions
- Resource types and properties
- Output definitions
- Security configurations
- Resource dependencies
- Naming conventions

### Integration Tests

Integration tests verify deployed resources:

```bash
npm run test:integration
```

Tests validate:
- Resource creation and accessibility
- Configuration accuracy
- Resource integrations
- Security settings (encryption, access blocks)
- Output values

### Run All Tests

```bash
npm test
```

## Cleanup

### Delete Stack

```bash
aws cloudformation delete-stack \
  --stack-name education-cicd-<suffix> \
  --region us-east-1
```

### Verify Deletion

```bash
aws cloudformation wait stack-delete-complete \
  --stack-name education-cicd-<suffix> \
  --region us-east-1
```

Note: The S3 bucket must be empty before stack deletion. If the bucket contains artifacts, delete them first:

```bash
aws s3 rm s3://cicd-artifacts-<suffix> --recursive
```

## Cost Optimization

- CodeCommit: Free tier includes 5 active users per month
- CodeBuild: Pay per build minute (general1.small: $0.005/minute)
- CodePipeline: $1 per active pipeline per month (first pipeline free)
- S3: Standard storage pricing
- CloudWatch Logs: $0.50 per GB ingested
- SNS: Free tier includes 1,000 notifications per month

## Troubleshooting

### Pipeline Not Triggering

- Verify EventBridge rule is enabled
- Check CodeCommit repository has commits on main branch
- Review CloudWatch Events for delivery failures

### Build Failures

- Check CloudWatch Logs for build output
- Verify buildspec syntax
- Ensure environment variables are correctly configured
- Confirm IAM role has necessary permissions

### Deployment Issues

- Validate template syntax before deployment
- Ensure CAPABILITY_NAMED_IAM is specified
- Check for resource naming conflicts (use unique suffix)
- Review CloudFormation events for detailed error messages

## Best Practices

1. **Environment Separation**: Use different suffixes for different environments
2. **Monitoring**: Subscribe to SNS topic for pipeline notifications
3. **Security**: Regularly review IAM policies and update as needed
4. **Logging**: Configure appropriate log retention based on compliance requirements
5. **Testing**: Run integration tests after deployment to verify functionality
6. **Documentation**: Keep README updated with infrastructure changes

## Additional Resources

- [AWS CodeCommit Documentation](https://docs.aws.amazon.com/codecommit/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [CloudFormation Best Practices](https://docs.aws.amazon.com/AWSCloudFormation/latest/UserGuide/best-practices.html)

## Support

For issues or questions:
1. Review CloudWatch Logs for build details
2. Check CloudFormation events for deployment issues
3. Verify AWS service quotas and limits
4. Consult AWS documentation for service-specific guidance
