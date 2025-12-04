# CI/CD Pipeline Implementation

This CDK TypeScript project implements a complete CI/CD pipeline for deploying Node.js applications using AWS native services.

## Architecture

The implementation creates a multi-stage CI/CD pipeline with the following components:

### Infrastructure Components

1. **S3 Artifact Bucket**
   - Stores pipeline artifacts with versioning enabled
   - Encrypted with S3-managed keys
   - Fully destroyable with auto-delete

2. **CodeCommit Repository**
   - Git repository for Node.js application source code
   - Triggers pipeline on commits to main branch

3. **CodeBuild Projects (3 projects)**
   - **Test Project**: Runs unit tests using Node.js 18
   - **Staging Deployment**: Deploys to staging environment
   - **Production Deployment**: Deploys to production environment
   - All projects log to CloudWatch with 7-day retention

4. **CodePipeline**
   - 5-stage pipeline orchestration
   - Source → Build → Deploy_Staging → Approval → Deploy_Production

5. **Manual Approval**
   - Requires manual review before production deployment
   - Sends notifications via SNS

6. **CloudWatch Logs**
   - 7-day retention for all CodeBuild project logs
   - Organized by project name

7. **EventBridge Rules**
   - Monitors pipeline failures
   - Sends notifications to SNS topic

8. **SNS Topic**
   - Receives pipeline failure notifications
   - Used for manual approval notifications

## Pipeline Flow

```
┌──────────┐     ┌────────┐     ┌─────────────┐     ┌──────────┐     ┌─────────────┐
│ Source   │────>│ Build  │────>│ Deploy      │────>│ Manual   │────>│ Deploy      │
│ (Main)   │     │ (Test) │     │ Staging     │     │ Approval │     │ Production  │
└──────────┘     └────────┘     └─────────────┘     └──────────┘     └─────────────┘
     │                                                      │
     └──> CodeCommit                                       └──> SNS Notification
```

## Deployment

### Prerequisites

- AWS CDK CLI installed (`npm install -g aws-cdk`)
- AWS credentials configured
- Node.js 18+ installed

### Deploy the Stack

```bash
# Install dependencies
npm install

# Synthesize CloudFormation template
cdk synth --context environmentSuffix=<your-suffix>

# Deploy to AWS
cdk deploy --context environmentSuffix=<your-suffix>
```

### Environment Suffix

The `environmentSuffix` parameter is **required** and ensures resource names are unique:

```bash
cdk deploy --context environmentSuffix=dev
```

All resources will be named with the suffix:
- `pipeline-artifacts-dev` (S3 bucket)
- `app-repo-dev` (CodeCommit repository)
- `app-pipeline-dev` (CodePipeline)
- etc.

## Resource Naming Convention

All resources follow this pattern:
```
<resource-type>-<environment-suffix>
```

Examples:
- S3 Bucket: `pipeline-artifacts-${environmentSuffix}`
- Repository: `app-repo-${environmentSuffix}`
- Pipeline: `app-pipeline-${environmentSuffix}`
- Projects: `test-project-${environmentSuffix}`, `staging-deploy-${environmentSuffix}`, etc.

## Testing

### Unit Tests

Run unit tests to verify CDK infrastructure:

```bash
npm test
```

Unit tests validate:
- All resources are created with correct properties
- Resource naming includes environment suffix
- Removal policies are set to DESTROY
- Node.js 18 runtime configuration
- CloudWatch Logs retention is 7 days
- Pipeline stages are in correct order

### Integration Tests

After deployment, run integration tests:

```bash
ENVIRONMENT_SUFFIX=<your-suffix> npm run test:int
```

Integration tests verify:
- All AWS resources exist and are accessible
- Configuration matches requirements
- Pipeline stages are properly configured
- Event rules target correct SNS topics

## Configuration Details

### Node.js Runtime

All CodeBuild projects use Node.js 18 runtime:

```typescript
buildSpec: codebuild.BuildSpec.fromObject({
  version: '0.2',
  phases: {
    install: {
      'runtime-versions': {
        nodejs: '18',
      },
    },
  },
})
```

### CloudWatch Logs

7-day retention for all CodeBuild logs:

```typescript
const logGroup = new logs.LogGroup(this, 'LogGroup', {
  retention: logs.RetentionDays.ONE_WEEK,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
});
```

### Pipeline Stages

1. **Source**: Pull from CodeCommit main branch
2. **Build**: Run unit tests
3. **Deploy_Staging**: Deploy to staging environment
4. **Approval**: Manual approval gate
5. **Deploy_Production**: Deploy to production environment

### IAM Permissions

The stack creates IAM roles with least-privilege permissions:
- CodePipeline role: Access to S3, CodeCommit, CodeBuild
- CodeBuild roles: Access to CloudWatch Logs, source repository
- EventBridge role: Publish to SNS topic

## Stack Outputs

After deployment, the following outputs are available:

- `RepositoryCloneUrlHttp`: CodeCommit repository clone URL
- `PipelineName`: CodePipeline name
- `ArtifactBucketName`: S3 bucket for artifacts
- `NotificationTopicArn`: SNS topic ARN for notifications

Access outputs:

```bash
aws cloudformation describe-stacks --stack-name TapStack<suffix> --query 'Stacks[0].Outputs'
```

## Cleanup

To destroy all resources:

```bash
cdk destroy --context environmentSuffix=<your-suffix>
```

All resources are configured with `RemovalPolicy.DESTROY`, ensuring complete cleanup.

## Cost Optimization

This implementation uses cost-effective services:
- S3 for artifact storage (minimal cost)
- CodeCommit (free for small repositories)
- CodeBuild (pay per build minute)
- CodePipeline (pay per pipeline execution)
- CloudWatch Logs (7-day retention limits costs)
- SNS (minimal notification costs)

## Monitoring and Alerts

### Pipeline Failures

EventBridge rule monitors pipeline state:
- Triggers on `FAILED` state
- Sends notification to SNS topic
- Subscribe to topic for email/SMS alerts

### CloudWatch Logs

All CodeBuild executions log to CloudWatch:
- Test project: `/aws/codebuild/test-project-${environmentSuffix}`
- Staging: `/aws/codebuild/staging-deploy-${environmentSuffix}`
- Production: `/aws/codebuild/production-deploy-${environmentSuffix}`

## Customization

### Modify Build Commands

Edit buildSpec in CodeBuild project definitions:

```typescript
buildSpec: codebuild.BuildSpec.fromObject({
  version: '0.2',
  phases: {
    build: {
      commands: ['npm run custom-command'],
    },
  },
})
```

### Change Branch

Modify source action configuration:

```typescript
branch: 'main',  // Change to different branch
```

### Add Environment Variables

Add to CodeBuild project environment:

```typescript
environmentVariables: {
  MY_VAR: { value: 'my-value' },
}
```

## Compliance

This implementation follows AWS best practices:
- ✓ Encryption at rest (S3)
- ✓ Least-privilege IAM roles
- ✓ CloudWatch logging enabled
- ✓ Event monitoring for failures
- ✓ Manual approval for production
- ✓ Version control integration

## Requirements Fulfilled

All 10 requirements from PROMPT.md are implemented:

1. ✓ S3 bucket with versioning
2. ✓ CodeBuild with Node.js 18
3. ✓ CodePipeline with multiple stages
4. ✓ Trigger on main branch
5. ✓ Manual approval action
6. ✓ Separate staging and production projects
7. ✓ CloudWatch Events for failures
8. ✓ Least-privilege IAM roles
9. ✓ Pipeline parameters
10. ✓ CloudWatch Logs with 7-day retention

## Support

For issues or questions, refer to:
- AWS CDK documentation: https://docs.aws.amazon.com/cdk/
- CodePipeline documentation: https://docs.aws.amazon.com/codepipeline/
- CodeBuild documentation: https://docs.aws.amazon.com/codebuild/
