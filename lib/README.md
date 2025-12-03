# CI/CD Build Environment - Pulumi TypeScript

This Pulumi program deploys a complete CI/CD build environment using AWS CodeBuild for Node.js applications.

## Architecture

The infrastructure includes:

- **S3 Bucket**: Stores build artifacts with versioning enabled and public access blocked
- **CodeBuild Project**: Builds Node.js 18 applications from GitHub with 15-minute timeout
- **IAM Role**: Provides least-privilege access to S3 and CloudWatch Logs
- **CloudWatch Logs**: Captures build output with 7-day retention
- **Build Cache**: Local caching for faster builds

## Prerequisites

- Node.js 18 or higher
- Pulumi CLI installed
- AWS credentials configured
- AWS account with appropriate permissions

## Project Structure

```
.
├── bin/
│   └── tap.ts              # Pulumi entry point
├── lib/
│   ├── tap-stack.ts        # Main stack component
│   ├── cicd-stack.ts       # CI/CD infrastructure
│   ├── PROMPT.md           # Requirements document
│   ├── MODEL_RESPONSE.md   # Implementation documentation
│   └── README.md           # This file
├── Pulumi.yaml             # Pulumi project configuration
├── package.json            # Node.js dependencies
└── tsconfig.json           # TypeScript configuration
```

## Configuration

The stack requires the `ENVIRONMENT_SUFFIX` environment variable for unique resource naming:

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-1
```

Optional environment variables:
- `REPOSITORY`: Repository name for tagging
- `COMMIT_AUTHOR`: Commit author for tagging
- `PR_NUMBER`: Pull request number for tagging
- `TEAM`: Team name for tagging

## Installation

Install Node.js dependencies:

```bash
npm install
```

## Deployment

Deploy the stack:

```bash
export ENVIRONMENT_SUFFIX=<unique-suffix>
pulumi up
```

Review the changes and confirm deployment.

## Stack Outputs

After deployment, the following outputs are available:

- `codeBuildProjectName`: Name of the CodeBuild project
- `artifactBucketArn`: ARN of the artifact storage bucket

View outputs:

```bash
pulumi stack output
pulumi stack output codeBuildProjectName
pulumi stack output artifactBucketArn
```

## Build Configuration

The CodeBuild project is configured with:

- **Runtime**: Node.js 18 on AWS Linux 2 (standard:7.0 image)
- **Timeout**: 15 minutes build timeout, 30 minutes queue timeout
- **Compute**: BUILD_GENERAL1_SMALL (cost-optimized)
- **Environment Variables**:
  - `NODE_ENV`: production
  - `BUILD_NUMBER`: From CodeBuild built-in variable
- **Artifacts**: Stored in S3 under `builds/` prefix with BUILD_ID namespace
- **Logs**: CloudWatch Logs with 7-day retention
- **Cache**: Local source and custom cache for faster builds

### Buildspec

The project includes an inline buildspec that:

1. Installs Node.js 18 runtime
2. Runs `npm ci --only=production` to install dependencies
3. Executes `npm run build` to build the application
4. Packages all files as artifacts

You can customize the buildspec by modifying the `source.buildspec` in `lib/cicd-stack.ts`.

## Starting a Build

Start a build manually using AWS CLI:

```bash
PROJECT_NAME=$(pulumi stack output codeBuildProjectName)
aws codebuild start-build --project-name $PROJECT_NAME
```

View build logs:

```bash
LOG_GROUP=$(pulumi stack output --show-secrets | jq -r '.logGroupName // empty')
aws logs tail $LOG_GROUP --follow
```

## Resource Naming

All resources include the `environmentSuffix` for uniqueness:

- S3 Bucket: `codebuild-artifacts-{environmentSuffix}`
- CodeBuild Project: `nodejs-build-{environmentSuffix}`
- IAM Role: `codebuild-role-{environmentSuffix}`
- Log Group: `/aws/codebuild/nodejs-build-{environmentSuffix}`

## Tags

All resources are tagged with:

- `Environment`: Set from ENVIRONMENT_SUFFIX
- `Team`: Set from TEAM environment variable
- `Repository`: Set from REPOSITORY environment variable
- `Author`: Set from COMMIT_AUTHOR environment variable
- `PRNumber`: Set from PR_NUMBER environment variable
- `CreatedAt`: Timestamp of deployment

Additionally, CodeBuild project has:
- `Environment`: production
- `Team`: engineering

## Security Features

- IAM role follows least-privilege principle
- S3 bucket has public access blocked
- S3 bucket access limited to CodeBuild role
- CloudWatch Logs access limited to CodeBuild role
- Versioning enabled for artifact history
- Force destroy enabled for testing (can be disabled for production)

## Cost Optimization

- Uses `BUILD_GENERAL1_SMALL` compute type
- CloudWatch Logs retention limited to 7 days
- Local build cache reduces build times
- Shallow git clone (depth 1) for faster checkouts
- `npm ci --only=production` for minimal dependencies

## Cleanup

To destroy all resources:

```bash
pulumi destroy
```

Confirm the deletion when prompted. All resources are configured to be destroyable without retention policies. The S3 bucket has `forceDestroy: true` to allow deletion even with objects inside.

## Troubleshooting

**Build fails to start**:
- Ensure IAM role has necessary permissions
- Check CodeBuild project exists: `aws codebuild list-projects`

**Artifacts not uploaded**:
- Verify S3 bucket permissions
- Check artifact configuration in CodeBuild project
- Ensure `npm run build` succeeds and creates output

**Logs not visible**:
- Check CloudWatch Logs group exists
- Verify IAM role has logs:CreateLogStream and logs:PutLogEvents permissions

**GitHub source fails**:
- Ensure GitHub repository URL is accessible
- For private repositories, configure GitHub credentials in CodeBuild

**Deployment fails with bucket already exists**:
- Change ENVIRONMENT_SUFFIX to a unique value
- S3 bucket names must be globally unique

## Development

To modify the infrastructure:

1. Edit TypeScript files in `lib/` or `bin/`
2. Run `npm run build` to compile
3. Run `pulumi preview` to see changes
4. Run `pulumi up` to apply changes

## Testing

The infrastructure can be tested by:

1. Starting a manual build
2. Verifying build completes successfully
3. Checking artifacts in S3 bucket
4. Reviewing logs in CloudWatch

## Support

For issues or questions, refer to:
- Pulumi documentation: https://www.pulumi.com/docs/
- AWS CodeBuild documentation: https://docs.aws.amazon.com/codebuild/
- Task ID: h3d7h7q5
