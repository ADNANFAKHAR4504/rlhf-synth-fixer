# CI/CD Pipeline for Node.js Application

This CDK application creates a complete CI/CD pipeline for deploying Node.js applications.

## Architecture

The pipeline consists of three stages:

1. **Source Stage**: CodeCommit repository triggers on commits to main branch
2. **Build Stage**: CodeBuild runs npm install, npm test, and npm build
3. **Deploy Stage**: CloudFormation deploys the application

## Resources Created

- **CodeCommit Repository**: Source code storage
- **CodeBuild Project**: Build and test automation
  - Build image: aws/codebuild/standard:6.0
  - Timeout: 15 minutes
  - Environment: NODE_ENV=production
- **CodePipeline**: Three-stage pipeline orchestration
- **S3 Bucket**: Artifact storage with versioning enabled
- **IAM Roles**: Least privilege roles for CodePipeline and CodeBuild
- **CloudWatch Logs**: Build logs with 7-day retention

## Deployment

### Prerequisites

- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS credentials configured
- Node.js 18+ installed

### Deploy

```bash
# Install dependencies
npm install

# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy with environment suffix
cdk deploy --context environmentSuffix=dev

# Deploy to different environment
cdk deploy --context environmentSuffix=prod
```

### Outputs

After deployment, the stack outputs:
- **RepositoryCloneUrl**: HTTP URL to clone the CodeCommit repository
- **PipelineArn**: ARN of the CodePipeline
- **ArtifactBucketName**: Name of the S3 bucket storing artifacts
- **BuildProjectName**: Name of the CodeBuild project

## Using the Repository

```bash
# Clone the repository
git clone <RepositoryCloneUrl>

# Add your Node.js application
cd nodejs-app-repo-dev

# Create a basic Node.js application structure
npm init -y
npm install express

# Create cloudformation-template.json for CloudFormation deploy stage
cat > cloudformation-template.json <<EOF
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Description": "Sample deployment template",
  "Resources": {
    "DummyResource": {
      "Type": "AWS::CloudFormation::WaitConditionHandle"
    }
  }
}
EOF

# Commit and push to trigger pipeline
git add .
git commit -m "Initial commit"
git push origin main
```

## Pipeline Behavior

1. Commits to the `main` branch automatically trigger the pipeline
2. CodeBuild runs:
   - `npm install` - Install dependencies
   - `npm test` - Run tests
   - `npm run build` - Build application
3. CloudFormation deploys using the generated cloudformation-template.json
4. All logs are captured in CloudWatch with 7-day retention

## Security

- All IAM roles follow least privilege principle
- S3 bucket uses encryption at rest
- CodeCommit repository is private by default
- Build logs are retained for compliance (7 days)

## Clean Up

```bash
# Delete the stack
cdk destroy --context environmentSuffix=dev
```

Note: The S3 bucket will be automatically emptied and deleted due to `autoDeleteObjects: true`.

## Monitoring

- View pipeline execution in AWS Console: CodePipeline
- View build logs in CloudWatch Logs: `/aws/codebuild/nodejs-build-{environmentSuffix}`
- Monitor build metrics in CodeBuild console
