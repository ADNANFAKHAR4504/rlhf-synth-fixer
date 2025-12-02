# CI/CD Pipeline Infrastructure

Complete AWS CI/CD pipeline infrastructure using Pulumi TypeScript with CodePipeline, CodeBuild, S3, ECR, and CloudWatch.

## Architecture

This infrastructure creates:

- S3 bucket for pipeline artifacts (versioned, 30-day lifecycle)
- ECR repository for Docker images (scan on push enabled)
- CodeBuild project using aws/codebuild/standard:5.0
- CodePipeline with 3 stages: Source, Build, Manual Approval
- IAM roles and policies with least-privilege permissions
- CloudWatch Logs for build output (7-day retention)

## Prerequisites

- Node.js 18+ and npm
- Pulumi CLI installed
- AWS credentials configured
- AWS account with appropriate permissions

## Configuration

1. Install dependencies:
```bash
npm install
```

2. Set environment suffix:
```bash
pulumi config set environmentSuffix <your-unique-suffix>
```

3. For GitHub integration (optional):
   - Store GitHub OAuth token in AWS Secrets Manager with name `github-token`
   - Update GitHub owner/repo in lib/tap-stack.ts

## Deployment

Deploy the infrastructure:
```bash
pulumi up
```

Review the plan and confirm to create resources.

## Outputs

After deployment, you'll get:
- `pipelineArn`: ARN of the CodePipeline
- `artifactBucketName`: Name of the S3 artifact bucket

## Resource Naming

All resources include the environmentSuffix in their names:
- S3 bucket: `pipeline-artifacts-{environmentSuffix}`
- ECR repository: `app-repository-{environmentSuffix}`
- CodeBuild project: `build-project-{environmentSuffix}`
- CodePipeline: `cicd-pipeline-{environmentSuffix}`
- IAM roles: `codebuild-role-{environmentSuffix}`, `pipeline-role-{environmentSuffix}`

## Security

- S3 bucket encrypted with AES256
- Public access blocked on artifact bucket
- ECR image scanning enabled on push
- Least-privilege IAM policies
- CloudWatch logs for audit trail

## Cost Optimization

- S3 lifecycle rule deletes artifacts after 30 days
- CloudWatch logs retained for 7 days only
- Small compute type for CodeBuild (BUILD_GENERAL1_SMALL)

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

All resources are configured to be fully destroyable.

## Testing

After deployment:
1. Configure GitHub source in pipeline (update configuration)
2. Add GitHub token to Secrets Manager
3. Create a test repository with Dockerfile
4. Pipeline will trigger on commits to main branch
5. Review build in CloudWatch Logs
6. Approve manual approval stage
