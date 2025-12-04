
# CI/CD Pipeline with Pulumi Infrastructure Automation

This Pulumi Go program deploys a complete CI/CD pipeline on AWS that automates Pulumi infrastructure deployments across multiple accounts with proper security controls and approval workflows.

## Architecture Overview

The solution creates:

1. **Pulumi State Management**: S3 bucket with versioning and KMS encryption for Pulumi state files
2. **Artifact Storage**: S3 bucket with lifecycle policies for pipeline artifacts
3. **CodeBuild Projects**: Four projects for build, test (preview), and deploy (dev/prod)
4. **CodePipeline**: 5-stage pipeline (Source → Build → Test → Deploy-Dev → Deploy-Prod)
5. **GitHub Integration**: CodeStar connection for source control
6. **Notifications**: SNS topic with email subscription for failure alerts
7. **Event-Driven Triggers**: EventBridge rules for Git tag-based deployments
8. **Security**: KMS encryption, SSM Parameter Store for secrets, least-privilege IAM roles
9. **Multi-Account**: Cross-account IAM roles for Dev and Prod deployments
10. **Observability**: CloudWatch Logs with 7-day retention for all CodeBuild projects

## Prerequisites

- AWS CLI configured with appropriate credentials
- Pulumi CLI 3.x installed
- Go 1.19+ installed
- AWS accounts: Shared Services (pipeline), Dev (123456789012), Prod (987654321098)
- GitHub repository for source code

## Environment Variables

The following environment variables are required:

- `ENVIRONMENT_SUFFIX`: Unique suffix for resource naming (default: "dev")
- `AWS_REGION`: AWS region for deployment (default: "us-east-1")
- `REPOSITORY`: Repository name for tagging
- `COMMIT_AUTHOR`: Commit author for tagging
- `PR_NUMBER`: Pull request number for tagging
- `TEAM`: Team name for tagging

## Deployment

1. Initialize Pulumi:
   ```bash
   pulumi login s3://your-pulumi-state-bucket
   pulumi stack init dev
   ```

2. Set required configuration:
   ```bash
   export ENVIRONMENT_SUFFIX="myenv"
   export AWS_REGION="us-east-1"
   ```

3. Deploy the infrastructure:
   ```bash
   pulumi up
   ```

4. After deployment, update SSM parameters:
   ```bash
   # Set your actual Pulumi access token
   aws ssm put-parameter \
     --name "/pulumi/access-token-myenv" \
     --value "pul-your-actual-token" \
     --type SecureString \
     --overwrite
   ```

5. Complete the CodeStar connection:
   ```bash
   # Get the connection ARN from outputs
   pulumi stack output codestarConnectionArn

   # Go to AWS Console → Developer Tools → Settings → Connections
   # Find the connection and complete the GitHub authentication
   ```

6. Update the pipeline source configuration:
   - Edit the Source stage in CodePipeline
   - Update `FullRepositoryId` to your GitHub repository (e.g., "myorg/myrepo")

## Pipeline Stages

1. **Source**: Pulls code from GitHub via CodeStar connection
2. **Build**: Compiles application code and prepares artifacts
3. **Test**: Runs `pulumi preview` to validate infrastructure changes
4. **Deploy-Dev**: Deploys to Dev account with `pulumi up`
5. **Deploy-Prod**: Manual approval followed by production deployment

## Multi-Account Setup

The pipeline runs in a shared services account and deploys to Dev and Prod accounts using cross-account IAM roles.

### Required IAM Roles in Target Accounts

Create the following IAM role in both Dev (123456789012) and Prod (987654321098) accounts:

**Role Name**: `pulumi-deploy-role`

**Trust Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::SHARED_SERVICES_ACCOUNT_ID:role/codebuild-role-{environmentSuffix}"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
