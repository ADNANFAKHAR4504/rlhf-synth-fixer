# CI/CD Pipeline Infrastructure

This Pulumi TypeScript program creates a complete CI/CD pipeline using AWS CodePipeline, CodeBuild, S3, IAM, and CloudWatch Logs.

## Architecture

The infrastructure includes:

- **S3 Artifact Bucket**: Stores pipeline artifacts with versioning enabled
- **S3 Deploy Bucket**: Target for deployments, configured for static website hosting
- **CodeBuild Project**: Builds the application using Node.js 18 runtime
- **CodePipeline**: Three-stage pipeline (Source → Build → Deploy)
- **IAM Roles**: Least-privilege roles for CodePipeline and CodeBuild
- **CloudWatch Logs**: Build logs with 30-day retention
- **GitHub Webhook**: Automatic triggering on repository changes

## Prerequisites

1. AWS account with appropriate permissions
2. Pulumi CLI installed
3. Node.js 18+ installed
4. GitHub repository with a Node.js application
5. GitHub OAuth token with repo permissions

## Configuration

Set the following configuration values:

```bash
pulumi config set environmentSuffix dev
pulumi config set githubOwner your-github-username
pulumi config set githubRepo your-repo-name
pulumi config set githubBranch main
pulumi config set --secret githubToken ghp_your_github_token
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

- `artifactBucket`: S3 bucket name for pipeline artifacts
- `deployBucket`: S3 bucket name for deployment target
- `codeBuildProject`: CodeBuild project name
- `pipelineExecutionUrl`: URL to view pipeline execution history
- `s3WebsiteEndpoint`: S3 static website endpoint for deployed application

## Build Process

The CodeBuild project executes:

1. `npm install` - Install dependencies
2. `npm test` - Run tests
3. `npm run build` - Build application

Build output from the `build/` directory is deployed to the S3 website bucket.

## Pipeline Stages

1. **Source**: Pulls code from GitHub repository
2. **Build**: Runs CodeBuild project with Node.js 18 environment
3. **Deploy**: Deploys build artifacts to S3 bucket

## Security

- IAM roles follow least-privilege principle
- CodeBuild can only access artifact bucket and CloudWatch Logs
- CodePipeline can only access artifact/deploy buckets and start builds
- GitHub webhook uses HMAC authentication
- All resources are tagged for tracking

## Cleanup

```bash
pulumi destroy
```

All resources are configured with `forceDestroy: true` to enable complete cleanup.

## Monitoring

- CloudWatch Logs: `/aws/codebuild/build-project-{environmentSuffix}`
- Log retention: 30 days
- Pipeline execution history available in AWS Console

## Notes

- Build environment uses AWS Standard Linux 5.0 image
- Node.js 18 runtime is configured
- S3 website hosting is enabled on deploy bucket
- GitHub webhook triggers pipeline on branch commits
