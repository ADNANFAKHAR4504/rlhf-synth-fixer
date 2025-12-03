# CI/CD Pipeline Infrastructure

This Pulumi TypeScript program deploys a comprehensive CI/CD pipeline infrastructure on AWS.

## Architecture

The infrastructure includes:

1. **S3 Artifact Bucket**: Stores pipeline artifacts with versioning and lifecycle management
2. **ECR Repository**: Container registry with scanning and lifecycle policies
3. **CodeBuild Project**: Builds Docker images, runs tests, pushes to ECR
4. **CodePipeline**: Three-stage pipeline (Source → Build → Deploy)
5. **Lambda Function**: Handles deployment notifications
6. **IAM Roles**: Least-privilege roles for all services
7. **CloudWatch Events**: Monitors pipeline state changes
8. **SNS Topic**: Sends notifications on pipeline failures

## Prerequisites

- Pulumi CLI installed
- AWS CLI configured with appropriate credentials
- Node.js 18+ installed
- GitHub repository with Dockerfile

## Configuration

Set the following Pulumi configuration values:

```bash
pulumi config set environmentSuffix dev
pulumi config set githubOwner your-github-username
pulumi config set githubRepo your-repo-name
pulumi config set githubBranch main
pulumi config set --secret githubToken your-github-oauth-token
```

## Deployment

```bash
# Install dependencies
npm install

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output
```

## Outputs

After deployment, the following outputs are available:

- `pipelineUrl`: Console URL for the pipeline
- `pipelineArn`: Pipeline ARN
- `ecrRepositoryUri`: ECR repository URI for pushing images
- `artifactBucketName`: S3 bucket name for artifacts
- `lambdaFunctionArn`: Lambda function ARN
- `snsTopicArn`: SNS topic ARN for notifications

## GitHub OAuth Token

To create a GitHub OAuth token:

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate new token (classic)
3. Select scopes: `repo` and `admin:repo_hook`
4. Copy the token and set it using:
   ```bash
   pulumi config set --secret githubToken <your-token>
   ```

## Resource Naming

All resources include the `environmentSuffix` in their names to support parallel deployments:
- S3 Bucket: `pipeline-artifacts-${environmentSuffix}`
- ECR Repository: `app-repo-${environmentSuffix}`
- CodeBuild Project: `build-project-${environmentSuffix}`
- CodePipeline: `cicd-pipeline-${environmentSuffix}`
- Lambda Function: `deploy-handler-${environmentSuffix}`

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources are configured to be cleanly destroyable, including S3 buckets (with `forceDestroy: true`).

## Customization

### BuildSpec

The CodeBuild buildspec is embedded in the Pulumi program. To customize the build process:
1. Edit the `buildspec` property in the CodeBuild project
2. Add environment variables as needed
3. Update Docker build commands

### Lambda Function

The deployment Lambda function can be extended to:
- Trigger ECS deployments
- Update configuration in Parameter Store
- Send notifications to Slack/Teams
- Integrate with external deployment systems

### Notifications

Add email subscriptions to the SNS topic:

```bash
aws sns subscribe \
  --topic-arn $(pulumi stack output snsTopicArn) \
  --protocol email \
  --notification-endpoint your-email@example.com
```

## Security

This implementation follows AWS security best practices:

- Least-privilege IAM policies with specific actions
- Encryption at rest for S3 and ECR
- Image scanning enabled on ECR
- CloudWatch logging for all services
- No wildcard permissions in IAM policies

## Monitoring

Pipeline events are captured by CloudWatch Events and sent to SNS:
- Pipeline execution started
- Pipeline execution succeeded
- Pipeline execution failed

Subscribe to the SNS topic to receive notifications.
