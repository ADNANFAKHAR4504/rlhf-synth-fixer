# CI/CD Pipeline Infrastructure

This Pulumi program creates a production-ready CI/CD pipeline for automated infrastructure deployment using AWS CodePipeline, CodeBuild, and related services.

## Architecture

The infrastructure includes:
- **S3 Bucket**: Stores pipeline artifacts with versioning and 30-day lifecycle policy
- **CodeBuild Project**: Executes Pulumi commands for infrastructure deployment
- **CodePipeline**: Orchestrates the CI/CD workflow with multiple stages
- **IAM Roles**: Separate roles for CodePipeline and CodeBuild with least privilege
- **CloudWatch Logs**: Comprehensive logging with 7-day retention

## Pipeline Stages

1. **Source**: Fetches code from GitHub repository
2. **Build**: Runs Pulumi preview and deployment
3. **Approval**: Manual approval gate before production
4. **Deploy**: Final deployment to production environment

## Prerequisites

1. AWS account with appropriate permissions
2. Pulumi CLI installed (v3.x or later)
3. Node.js 18+ and npm
4. GitHub repository with OAuth token
5. Pulumi access token stored in AWS Secrets Manager

## Configuration

### Required Secrets

Store the following secrets in AWS Secrets Manager:

```bash
# Pulumi access token
aws secretsmanager create-secret \
  --name pulumi-token \
  --secret-string "pul-xxxxxxxxxxxxx" \
  --region us-east-1

# GitHub OAuth token
aws secretsmanager create-secret \
  --name github-token \
  --secret-string "ghp_xxxxxxxxxxxxx" \
  --region us-east-1
```

### Stack Configuration

Set the following configuration values:

```bash
pulumi config set githubOwner <your-github-username>
pulumi config set githubRepo <your-repo-name>
pulumi config set githubTokenArn <github-token-secret-arn>
pulumi config set pulumiTokenArn <pulumi-token-secret-arn>
pulumi config set environmentSuffix <dev|staging|prod>
pulumi config set awsRegion us-east-1
```

## Deployment

```bash
# Install dependencies
npm install

# Select or create stack
pulumi stack select dev

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up
```

## Resources Created

| Resource Type | Name Pattern | Purpose |
|--------------|--------------|---------|
| S3 Bucket | `pipeline-artifacts-{environmentSuffix}` | Stores pipeline artifacts |
| CodeBuild Project | `pulumi-deploy-{environmentSuffix}` | Executes Pulumi commands |
| CodePipeline | `infrastructure-pipeline-{environmentSuffix}` | Orchestrates CI/CD workflow |
| IAM Role | `codepipeline-role-{environmentSuffix}` | Pipeline service role |
| IAM Role | `codebuild-role-{environmentSuffix}` | Build service role |
| CloudWatch Log Group | `/aws/codebuild/pulumi-deploy-{environmentSuffix}` | Build execution logs |

## Cost Optimization

- **CodeBuild**: Uses `BUILD_GENERAL1_SMALL` compute type (~$0.005/min)
- **S3 Lifecycle**: Automatically deletes artifacts after 30 days
- **CloudWatch Logs**: 7-day retention to minimize storage costs
- **Build Timeout**: 20-minute maximum to prevent runaway costs

## Security Features

- **Encryption**: S3 bucket encrypted at rest with AES256
- **Least Privilege**: IAM policies scoped to specific resources
- **Secrets Management**: Sensitive tokens stored in AWS Secrets Manager
- **Audit Logging**: CloudWatch Logs capture all build activity
- **Manual Approval**: Production deployments require explicit approval

## Monitoring

### CloudWatch Metrics

Monitor pipeline health using these metrics:
- `AWS/CodePipeline` - Pipeline execution status
- `AWS/CodeBuild` - Build duration and success rate

### CloudWatch Logs

View build logs:
```bash
aws logs tail /aws/codebuild/pulumi-deploy-{environmentSuffix} --follow
```

## Troubleshooting

### Common Issues

1. **Pipeline fails at Source stage**
   - Verify GitHub OAuth token is valid
   - Check repository owner and name configuration

2. **Build fails with Pulumi authentication error**
   - Verify Pulumi token in Secrets Manager
   - Check CodeBuild role has `secretsmanager:GetSecretValue` permission

3. **Insufficient IAM permissions**
   - Review CodeBuild role policy
   - Ensure deployment permissions match infrastructure needs

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

This will remove:
- CodePipeline and all execution history
- CodeBuild project and logs (after retention period)
- S3 bucket and all artifacts (forceDestroy enabled)
- IAM roles and policies

## Best Practices

1. **Branch Protection**: Enable branch protection on main branch
2. **Approval Process**: Require manual approval for production deployments
3. **Cost Monitoring**: Set up billing alerts for CodeBuild usage
4. **Regular Updates**: Keep CodeBuild image and Pulumi CLI updated
5. **Secret Rotation**: Rotate access tokens regularly

## References

- [AWS CodePipeline Documentation](https://docs.aws.amazon.com/codepipeline/)
- [AWS CodeBuild Documentation](https://docs.aws.amazon.com/codebuild/)
- [Pulumi AWS Provider](https://www.pulumi.com/registry/packages/aws/)
