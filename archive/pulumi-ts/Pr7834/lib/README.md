# CI/CD Pipeline Infrastructure

This Pulumi TypeScript infrastructure creates a complete multi-stage CI/CD pipeline using AWS CodePipeline.

## Architecture

The infrastructure deploys:

- **S3 Artifact Bucket**: Stores pipeline artifacts with versioning and encryption
- **CodePipeline**: Three-stage pipeline (Source, Build, Deploy) with manual approval
- **CodeBuild Projects**: Build stage (runs tests) and Deploy stage (deploys to Lambda)
- **Lambda Function**: Application deployment target
- **Secrets Manager**: Secure storage of GitHub OAuth token
- **CloudWatch Events**: Pipeline triggers and failure monitoring
- **SNS Topic**: Email notifications for pipeline failures
- **IAM Roles**: Least privilege roles for CodePipeline, CodeBuild, and Lambda

## Pipeline Stages

1. **Source Stage**: Pulls code from GitHub repository using OAuth token
2. **Build Stage**: Runs npm tests and builds application using CodeBuild
3. **Approval Stage**: Manual approval gate before deployment
4. **Deploy Stage**: Deploys application to Lambda using CodeBuild

## Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI installed
- Node.js 18+ installed
- GitHub OAuth token (for pipeline source integration)

## Environment Variables

Set these before deployment:

```bash
export ENVIRONMENT_SUFFIX="dev"         # Required for unique resource naming
export GITHUB_OWNER="your-org"          # GitHub repository owner
export GITHUB_REPO="your-repo"          # GitHub repository name
export GITHUB_BRANCH="main"             # Branch to monitor
export NOTIFICATION_EMAIL="your@email"  # Email for SNS notifications
export AWS_REGION="us-east-1"          # AWS deployment region
```

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Preview changes:
   ```bash
   pulumi preview
   ```

3. Deploy infrastructure:
   ```bash
   pulumi up
   ```

4. Update GitHub OAuth token in Secrets Manager:
   ```bash
   aws secretsmanager put-secret-value \
     --secret-id github-oauth-token-${ENVIRONMENT_SUFFIX} \
     --secret-string '{"token":"your-github-oauth-token"}'
   ```

5. Confirm SNS email subscription (check your email)

## Resource Naming

All resources include the `environmentSuffix` variable for uniqueness:
- S3 Bucket: `pipeline-artifacts-${environmentSuffix}`
- CodePipeline: `cicd-pipeline-${environmentSuffix}`
- Lambda Function: `app-function-${environmentSuffix}`
- IAM Roles: `codepipeline-role-${environmentSuffix}`, etc.

## Destroyability

All resources are fully destroyable:
- S3 bucket has `forceDestroy: true`
- No retention policies applied
- No deletion protection enabled

## Security Features

- S3 bucket encryption at rest (AES256)
- IAM roles follow least privilege principle
- GitHub OAuth token stored in Secrets Manager
- CloudWatch logging enabled for CodeBuild
- Proper IAM policies for service-to-service access

## Monitoring

- CloudWatch Events monitor pipeline execution state
- SNS notifications sent on pipeline failures
- CodeBuild logs stored in CloudWatch Logs

## Testing

Unit tests and integration tests are handled by the QA trainer agent in Phase 3.

## Outputs

After deployment, these outputs are available:

- `pipelineArn`: ARN of the CodePipeline
- `artifactBucketName`: Name of the S3 artifact bucket
- `lambdaFunctionArn`: ARN of the deployed Lambda function

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

All resources will be removed without manual intervention.

## Notes

- GitHub OAuth token must be manually updated after initial deployment
- Email subscription requires manual confirmation
- Pipeline will trigger automatically on GitHub repository changes
- Manual approval is required between Build and Deploy stages
- Lambda function code is placeholder - actual code deployed via pipeline
