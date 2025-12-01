# CI/CD Pipeline Infrastructure

This Pulumi TypeScript program deploys a complete AWS CodePipeline infrastructure for building and deploying Node.js applications.

## Architecture

The infrastructure includes:

1. **S3 Artifact Bucket**: Stores pipeline artifacts with versioning and KMS encryption
2. **S3 Deployment Bucket**: Hosts the static website output from the build
3. **CodeBuild Project**: Builds Node.js application with Node.js 18.x runtime
4. **CodePipeline**: Orchestrates the CI/CD workflow with three stages:
   - Source: Pulls code from GitHub repository
   - Build: Runs npm install, test, and build commands
   - Deploy: Deploys built artifacts to S3 static website
5. **IAM Roles and Policies**: Least-privilege permissions for CodePipeline, CodeBuild, and CloudWatch Events
6. **CloudWatch Events**: Triggers pipeline on GitHub repository changes
7. **KMS Key**: Encrypts pipeline artifacts at rest

## Prerequisites

- AWS Account with appropriate permissions
- GitHub repository with a Node.js application
- GitHub personal access token (for GitHub source integration)
- Pulumi CLI installed
- Node.js 18.x or later
- AWS CLI configured

## Configuration

Set the following configuration values:

```bash
# Required: Set environment suffix
export ENVIRONMENT_SUFFIX="dev"

# Required: GitHub repository details
pulumi config set githubOwner <your-github-username-or-org>
pulumi config set githubRepo <your-repository-name>
pulumi config set githubBranch main

# Required: GitHub token (stored as secret)
pulumi config set --secret githubToken <your-github-token>

# Optional: AWS Region (defaults to us-east-1)
export AWS_REGION="us-east-1"
```

## Deployment

1. Install dependencies:
```bash
npm install
```

2. Configure your stack:
```bash
pulumi stack init dev
```

3. Set required configuration:
```bash
export ENVIRONMENT_SUFFIX="dev"
pulumi config set githubOwner myorg
pulumi config set githubRepo myrepo
pulumi config set --secret githubToken ghp_xxxxxxxxxxxxx
```

4. Preview changes:
```bash
pulumi preview
```

5. Deploy the stack:
```bash
pulumi up
```

## Usage

After deployment, the pipeline will automatically trigger when changes are pushed to the configured GitHub branch.

### Manual Pipeline Execution

To manually start the pipeline:

```bash
aws codepipeline start-pipeline-execution \
  --name nodejs-pipeline-${ENVIRONMENT_SUFFIX}
```

### View Pipeline Status

```bash
aws codepipeline get-pipeline-state \
  --name nodejs-pipeline-${ENVIRONMENT_SUFFIX}
```

### Access Deployment

The static website is available at the S3 website endpoint (exported as output):

```bash
pulumi stack output deploymentWebsiteUrl
```

## Stack Outputs

The stack exports the following outputs:

- `pipelineArn`: ARN of the CodePipeline
- `artifactBucketName`: Name of the S3 artifacts bucket
- `deploymentBucketName`: Name of the S3 deployment bucket
- `deploymentWebsiteUrl`: URL of the deployed static website
- `codebuildProjectName`: Name of the CodeBuild project

## Security Features

- **Encryption at Rest**: All S3 buckets use KMS encryption
- **Least Privilege IAM**: IAM roles follow the principle of least privilege
- **Secure Credentials**: GitHub token stored as Pulumi secret
- **Public Access Blocked**: Artifact bucket blocks all public access
- **CloudWatch Logging**: CodeBuild logs sent to CloudWatch for monitoring

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

This will remove all infrastructure components including S3 buckets (with force destroy enabled).

## Cost Optimization

This infrastructure uses cost-effective services:

- **CodeBuild**: Pay only for build time (no idle costs)
- **CodePipeline**: $1/month per active pipeline
- **S3**: Standard storage pricing
- **CloudWatch Logs**: 7-day retention to minimize costs
- **KMS**: Minimal key usage costs

## Troubleshooting

### Pipeline Fails on Source Stage

- Verify GitHub token is valid and has repo access
- Check GitHub owner and repository names are correct
- Ensure the specified branch exists

### Build Stage Fails

- Check CodeBuild logs in CloudWatch
- Verify buildspec commands match your project structure
- Ensure Node.js 18.x is compatible with your application

### Deploy Stage Fails

- Verify S3 bucket policy allows CodePipeline to write
- Check that build artifacts are in the expected format

## Node.js Application Requirements

Your Node.js application should:

1. Have a `package.json` with test and build scripts:
```json
{
  "scripts": {
    "test": "jest",
    "build": "webpack --mode production"
  }
}
```

2. Output built files to `dist/` directory (or modify buildspec accordingly)

3. Include an `index.html` in the build output for static website hosting

## Contributing

This infrastructure follows Pulumi and AWS best practices:

- Component resources for encapsulation
- Explicit dependencies where needed
- Comprehensive tagging strategy
- Environment suffix for multi-environment support
