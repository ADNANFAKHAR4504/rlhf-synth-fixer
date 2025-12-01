# CI/CD Pipeline Infrastructure

Multi-stage CI/CD pipeline using AWS CodePipeline, CodeBuild, and ECR for automated Docker deployments.

## Architecture

The infrastructure creates:

- **S3 Bucket**: Stores pipeline artifacts with versioning and encryption
- **ECR Repository**: Stores Docker images with lifecycle policies (keeps last 10 images)
- **CodeBuild Project**: Builds Docker images from source code
- **CodePipeline**: Orchestrates CI/CD workflow with 4 stages:
  1. Source (GitHub integration)
  2. Build (CodeBuild)
  3. Approval (Manual approval gate)
  4. Deploy (ECS deployment)
- **IAM Roles**: Least-privilege roles for CodePipeline, CodeBuild, and CloudWatch Events
- **CloudWatch Events**: Automatic pipeline triggering on code commits

## Prerequisites

- Pulumi CLI installed
- AWS credentials configured
- GitHub OAuth token
- Node.js 18+ and npm

## Configuration

Set the following Pulumi configuration values:

```bash
pulumi config set environmentSuffix <unique-suffix>
pulumi config set githubOwner <github-owner>
pulumi config set githubRepo <repo-name>
pulumi config set githubBranch <branch-name>
pulumi config set --secret githubToken <github-oauth-token>
```

## Deployment

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Pulumi stack (see Configuration section above)

3. Deploy infrastructure:
   ```bash
   pulumi up
   ```

4. Review outputs:
   ```bash
   pulumi stack output
   ```

## Branch-Based Deployments

The pipeline supports branch-based deployments:

- **main branch**: Deploys to production environment (with manual approval)
- **develop branch**: Deploys to staging environment (with manual approval)

Create separate Pulumi stacks for each environment and configure the appropriate `githubBranch`.

## Resource Naming

All resources include the `environmentSuffix` parameter to enable parallel deployments without conflicts:

- S3 Bucket: `artifact-bucket-{environmentSuffix}`
- ECR Repository: `app-repo-{environmentSuffix}`
- CodeBuild Project: `build-project-{environmentSuffix}`
- CodePipeline: `pipeline-{environmentSuffix}`
- IAM Roles: `codebuild-role-{environmentSuffix}`, `codepipeline-role-{environmentSuffix}`, `event-role-{environmentSuffix}`

## Security

- **IAM Least Privilege**: Each service role has minimal required permissions
- **S3 Encryption**: Artifact bucket uses AES256 server-side encryption
- **ECR Scanning**: Docker images scanned on push
- **Secret Management**: GitHub token stored as Pulumi secret

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

## Outputs

The following outputs are exported:

- `artifactBucketName`: S3 bucket name for artifacts
- `ecrRepositoryUrl`: ECR repository URL
- `codeBuildProjectName`: CodeBuild project name
- `pipelineName`: CodePipeline name
- `pipelineArn`: CodePipeline ARN
