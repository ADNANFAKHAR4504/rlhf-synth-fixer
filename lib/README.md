# CI/CD Pipeline Infrastructure

This CDK application creates a complete CI/CD pipeline for Node.js applications using AWS services.

## Architecture

The infrastructure includes:

1. **CodeCommit Repository**: Source code repository for the Node.js application
2. **CodeBuild Project**: Automated build and test execution with Node.js 18 runtime
3. **CodePipeline**: Three-stage pipeline (Source -> Build -> Deploy)
4. **S3 Bucket**: Versioned artifact storage with encryption
5. **CloudWatch Logs**: Build logs with 7-day retention
6. **IAM Roles**: Least-privilege permissions for CodeBuild and CodePipeline

## Environment Variable

- `environmentSuffix`: Used to uniquely name resources (default: 'dev')

## Deployment

### Prerequisites

```bash
npm install
npm run build
```

### Deploy

```bash
# Deploy with default environment suffix
cdk deploy

# Deploy with custom environment suffix
cdk deploy -c environmentSuffix=prod
```

### Testing

```bash
npm test
```

## Pipeline Stages

### 1. Source Stage
- Monitors the CodeCommit repository
- Triggers automatically on commits to the main branch
- Downloads source code as artifacts

### 2. Build Stage
- Runs `npm install` to install dependencies
- Runs `npm test` to execute unit tests
- Runs `npm run build` to build the application
- Stores build artifacts in S3

### 3. Deploy Stage
- Deploys build artifacts to S3
- Can be extended to deploy to additional targets (ECS, Lambda, etc.)

## Build Environment

- **Runtime**: Node.js 18 (AWS CodeBuild Standard 7.0 image)
- **Environment Variables**:
  - `NODE_ENV`: Set to 'production'
  - `ARTIFACTS_BUCKET`: S3 bucket for artifacts

## Security Features

- S3 bucket encryption enabled (S3-managed keys)
- Block public access enabled on S3 bucket
- Least-privilege IAM policies
- CloudWatch Logs for audit trail

## Cost Optimization

- CloudWatch Logs retention: 7 days
- S3 versioning enabled but can be optimized with lifecycle policies
- CodeBuild compute: SMALL instance type

## Resource Naming

All resources include the `environmentSuffix` for uniqueness:
- Repository: `nodejs-app-{environmentSuffix}`
- Build Project: `nodejs-build-{environmentSuffix}`
- Pipeline: `nodejs-pipeline-{environmentSuffix}`
- S3 Bucket: `build-artifacts-{environmentSuffix}`

## Cleanup

```bash
cdk destroy
```

All resources are configured with `RemovalPolicy.DESTROY` for easy cleanup.

## Tags

All resources are tagged with:
- `Environment`: production
- `Team`: backend
