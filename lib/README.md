# CI/CD Pipeline Infrastructure

This infrastructure provides a complete CI/CD pipeline solution using AWS CDK with Go.

## Architecture

The solution includes:

- **CodePipeline**: Main orchestration pipeline with Source, Build, and Deploy stages
- **CodeBuild**: Build automation project with CloudWatch Logs integration
- **S3 Bucket**: Encrypted artifact storage with versioning
- **SNS Topic**: Notification system for pipeline events
- **IAM Roles**: Least-privilege service roles for CodePipeline and CodeBuild
- **CloudWatch Logs**: Centralized logging for build activities

## Prerequisites

- Go 1.21 or later
- AWS CDK CLI v2.100.0 or later
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions

## Installation

1. Install dependencies:
```bash
go mod download
```

2. Bootstrap CDK (if not already done):
```bash
cdk bootstrap aws://ACCOUNT-ID/us-east-1
```

## Deployment

Deploy with default environment suffix (dev):
```bash
cdk deploy
```

Deploy with custom environment suffix:
```bash
cdk deploy -c environmentSuffix=prod
```

Or using environment variable:
```bash
export ENVIRONMENT_SUFFIX=staging
cdk deploy
```

## Configuration

### Environment Suffix

The environment suffix is used to create unique resource names across different environments. You can set it via:

1. CDK context: `cdk deploy -c environmentSuffix=myenv`
2. Environment variable: `export ENVIRONMENT_SUFFIX=myenv`
3. Default: `dev`

### AWS Region

The stack is configured to deploy to `us-east-1` by default. To change the region, modify the `Region` field in `bin/tap.go`.

## Outputs

After deployment, the stack outputs:

- **PipelineArn**: ARN of the CI/CD pipeline
- **BuildProjectName**: Name of the CodeBuild project
- **ArtifactBucketName**: Name of the S3 artifact bucket
- **NotificationTopicArn**: ARN of the SNS notification topic

## Usage

### Triggering the Pipeline

The pipeline is configured with an S3 source that polls for changes. To trigger the pipeline:

1. Upload a `source.zip` file to the artifact bucket:
```bash
aws s3 cp source.zip s3://cicd-artifacts-{environmentSuffix}/source.zip
```

The pipeline will automatically detect the change and start execution.

### Monitoring

- **Pipeline Execution**: View pipeline status in AWS CodePipeline console
- **Build Logs**: Check CloudWatch Logs group `/aws/codebuild/build-project-{environmentSuffix}`
- **Notifications**: Subscribe to the SNS topic for pipeline event notifications

### Subscribing to Notifications

Subscribe an email to receive pipeline notifications:
```bash
aws sns subscribe \
  --topic-arn arn:aws:sns:us-east-1:ACCOUNT-ID:pipeline-notifications-{environmentSuffix} \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Testing

Run unit tests:
```bash
go test ./tests/... -v
```

Run integration tests (requires deployed stack):
```bash
go test ./tests/integration/... -v
```

## Customization

### Modify Build Specification

Edit the `BuildSpec` in `lib/tap_stack.go` to customize build commands:

```go
BuildSpec: awscodebuild.BuildSpec_FromObject(&map[string]interface{}{
    "version": "0.2",
    "phases": map[string]interface{}{
        "build": map[string]interface{}{
            "commands": []string{
                "your-build-command",
            },
        },
    },
}),
```

### Add Deploy Stage Actions

Replace the manual approval action with actual deployment actions:

```go
{
    StageName: jsii.String("Deploy"),
    Actions: &[]awscodepipeline.IAction{
        // Add your deployment action here
        // e.g., CloudFormation, CodeDeploy, ECS deployment
    },
}
```

## Security

- All artifacts are encrypted at rest using S3 server-side encryption
- IAM roles follow least-privilege principle
- S3 bucket blocks all public access
- CloudWatch Logs are retained for 7 days by default

## Cleanup

To destroy all resources:
```bash
cdk destroy
```

This will remove all infrastructure including:
- CodePipeline
- CodeBuild project
- S3 bucket and all artifacts (auto-delete enabled)
- SNS topic
- IAM roles
- CloudWatch Logs group

## Troubleshooting

### Pipeline Fails to Start

- Verify `source.zip` exists in the artifact bucket
- Check IAM permissions for CodePipeline role
- Review CloudWatch Logs for errors

### Build Failures

- Check build logs in CloudWatch Logs group
- Verify buildspec.yml syntax
- Ensure build environment has required dependencies

### Permission Issues

- Verify IAM roles have correct trust relationships
- Check service role policies include necessary permissions
- Ensure cross-service permissions are properly configured

## Support

For issues or questions:
- Review AWS CodePipeline documentation
- Check AWS CDK Go documentation
- Review CloudWatch Logs for detailed error messages
