# CI/CD Pipeline Infrastructure

This Pulumi TypeScript project creates a complete CI/CD pipeline for Node.js applications using AWS native services.

## Architecture

The infrastructure includes:

- **CodeCommit Repository**: Source code storage with main branch as default
- **S3 Bucket**: Versioned artifact storage with encryption
- **CodeBuild Project**: Build environment using aws/codebuild/standard:5.0
- **CodePipeline**: Three-stage pipeline (Source -> Build -> Deploy)
- **IAM Roles**: Separate least-privilege roles for CodeBuild and CodePipeline
- **CloudWatch Logs**: 30-day retention for build logs

## Prerequisites

- Node.js 18+ installed
- Pulumi CLI installed
- AWS credentials configured
- Access to AWS account with appropriate permissions

## Configuration

Set the required configuration:

```bash
pulumi config set environmentSuffix <your-unique-suffix>
```

## Deployment

Deploy the infrastructure:

```bash
npm install
pulumi up
```

## Outputs

After deployment, the following values are exported:

- `pipelineArn`: ARN of the CodePipeline
- `artifactBucketName`: Name of the S3 artifacts bucket
- `repositoryCloneUrl`: HTTP clone URL for the CodeCommit repository

## Pipeline Workflow

1. **Source Stage**: Monitors CodeCommit repository for changes on main branch
2. **Build Stage**: Executes CodeBuild project with buildspec:
   - Runs `npm install` to install dependencies
   - Runs `npm test` to execute tests
   - Runs `npm run build` to build application
3. **Deploy Stage**: Stores build artifacts in S3 bucket

## Security

- IAM roles use least privilege principle
- S3 bucket has server-side encryption enabled
- CloudWatch Logs capture all build activity
- All resources tagged for organization

## Resource Naming

All resources include the `environmentSuffix` parameter to prevent naming conflicts:
- Repository: `nodeapp-repo-{suffix}`
- Bucket: `nodeapp-artifacts-{suffix}`
- Build Project: `nodeapp-build-{suffix}`
- Pipeline: `nodeapp-pipeline-{suffix}`

## Cleanup

To remove all resources:

```bash
pulumi destroy
```

All resources are configured to be fully deletable with no retention policies.
