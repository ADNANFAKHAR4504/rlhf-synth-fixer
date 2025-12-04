# CI/CD Pipeline for Containerized Applications

This CDK application creates a complete CI/CD pipeline for building, scanning, and deploying containerized applications to Amazon ECR.

## Architecture

The pipeline consists of 5 stages:

1. **Source Stage**: Pulls code from GitHub repository using OAuth token authentication
2. **Build Stage**: Builds Docker images using CodeBuild and the provided buildspec.yml
3. **Security Scan Stage**: Scans images with Trivy for vulnerabilities
4. **Manual Approval Stage**: Requires manual approval before deployment
5. **Deploy Stage**: Tags images with semantic versioning and pushes to ECR

## Prerequisites

- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS CLI configured with appropriate credentials
- GitHub OAuth token stored in AWS Secrets Manager with name `github-oauth-token`
- Docker installed (for local testing)

## Configuration

Before deploying, update the following values in `lib/tap-stack.ts`:

- GitHub repository owner (line 213)
- GitHub repository name (line 214)
- GitHub branch (line 215)

## Deployment

```bash
# Install dependencies
npm install

# Synthesize CloudFormation template
cdk synth

# Deploy the stack
cdk deploy --context environmentSuffix=dev

# Deploy with custom DevOps email
cdk deploy --context environmentSuffix=dev --parameters DevOpsEmail=your-email@example.com
```

## Environment Suffix

The `environmentSuffix` context variable is used to make resource names unique. This allows multiple instances of the pipeline to coexist in the same AWS account.

```bash
cdk deploy --context environmentSuffix=prod
```

## Secrets Manager Setup

Create the GitHub OAuth token in Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name github-oauth-token \
  --secret-string "your-github-oauth-token" \
  --region us-east-1
```

## Pipeline Execution

The pipeline triggers automatically when changes are pushed to the configured GitHub repository. You can also trigger it manually from the AWS Console.

### Manual Approval

When the pipeline reaches the ManualApproval stage, you'll receive an SNS notification. Review the security scan results and approve or reject the deployment via the AWS Console.

## Monitoring

- **CloudWatch Logs**: All CodeBuild projects write logs to CloudWatch
- **SNS Notifications**: Pipeline failures trigger SNS notifications to the configured email
- **ECR Image Scanning**: Images are automatically scanned on push to ECR

## Security Features

- S3 artifacts are encrypted at rest
- GitHub OAuth token stored securely in Secrets Manager
- IAM roles follow least privilege principle
- Trivy security scanning for container vulnerabilities
- Manual approval required before production deployment

## Cleanup

To destroy all resources:

```bash
cdk destroy --context environmentSuffix=dev
```

## Outputs

After deployment, the stack outputs the following values:

- `BucketName`: S3 bucket name for artifacts
- `TopicArn`: SNS topic ARN for notifications
- `EcrRepositoryUri`: ECR repository URI
- `PipelineName`: CodePipeline name
- `BuildProjectName`: CodeBuild project name for builds
- `SecurityScanProjectName`: CodeBuild project name for security scanning

## Customization

### Buildspec.yml

The `buildspec.yml` file defines the Docker build process. Modify it to match your application's build requirements.

### Semantic Versioning

The current implementation uses a placeholder semantic version (1.0.0). Implement proper semantic versioning by:

1. Parsing git commit messages for version bumps
2. Using git tags to track versions
3. Calculating versions based on commit history

### Lifecycle Policies

- Artifact S3 bucket: 30-day retention
- ECR repository: Keeps last 10 images

Adjust these values in `lib/tap-stack.ts` based on your requirements.
