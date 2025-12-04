# CI/CD Pipeline Infrastructure for Payment Processing Microservices

Pulumi TypeScript infrastructure for a complete CI/CD pipeline supporting containerized microservices with blue-green deployments to Amazon ECS.

## Overview

This infrastructure implements a production-ready CI/CD pipeline for fintech payment processing microservices with automated testing, security scanning, Docker image builds, and blue-green deployments while maintaining PCI compliance requirements.

## Architecture

The pipeline implements a 5-stage workflow:

```
Source → Unit Tests → Docker Build → Manual Approval → ECS Deployment
```

### Key Components

- **CodePipeline**: Orchestrates the entire CI/CD workflow
- **CodeBuild Projects**: Separate projects for unit tests and Docker image builds
- **CodeDeploy**: Manages ECS blue-green deployments with automatic rollback
- **S3 Artifact Storage**: Encrypted bucket with versioning and lifecycle rules
- **SNS Notifications**: Email alerts for pipeline state changes and approvals
- **CloudWatch Logs**: Centralized logging with 30-day retention
- **IAM Roles**: Least privilege access for all pipeline components
- **Secrets Manager**: Secure storage for Docker registry credentials

## Resources Created

### Pipeline Infrastructure
- **CodePipeline**: `payment-service-pipeline-${environmentSuffix}`
- **CodeBuild Projects**:
  - `unit-test-project-${environmentSuffix}` - Unit test execution
  - `docker-build-project-${environmentSuffix}` - Docker image builds
- **CodeDeploy Application**: `payment-service-app-${environmentSuffix}`
- **CodeDeploy Deployment Group**: `payment-service-dg-${environmentSuffix}`

### Storage and Messaging
- **S3 Bucket**: `pipeline-artifacts-${environmentSuffix}` with AES256 encryption
- **SNS Topic**: `pipeline-notifications-${environmentSuffix}` with email subscription

### Logging and Monitoring
- **CloudWatch Log Groups**:
  - `/aws/codebuild/unit-test-${environmentSuffix}` - 30-day retention
  - `/aws/codebuild/docker-build-${environmentSuffix}` - 30-day retention
- **EventBridge Rules**: Pipeline failure notifications

### IAM Roles
- **CodePipeline Role**: `codepipeline-role-${environmentSuffix}`
- **CodeBuild Role**: `codebuild-role-${environmentSuffix}`
- **CodeDeploy Role**: `codedeploy-role-${environmentSuffix}`

## Prerequisites

1. **AWS Credentials**: Configure AWS CLI with appropriate permissions
2. **Pulumi CLI**: Version 3.x or later (`npm install -g pulumi`)
3. **Node.js**: Version 18 or later
4. **Docker Registry Credentials**: Stored in AWS Secrets Manager
5. **GitHub OAuth Token**: Stored in AWS Secrets Manager
6. **ECS Infrastructure**: Existing ECS cluster, service, and target groups

### Required Secrets

Create these secrets in AWS Secrets Manager before deploying:

```bash
# Docker registry credentials
aws secretsmanager create-secret \
  --name docker-registry-credentials-${ENVIRONMENT_SUFFIX} \
  --secret-string '{"username":"YOUR_USERNAME","password":"YOUR_PASSWORD","registry":"YOUR_REGISTRY_URL"}' \
  --region us-east-2

# GitHub OAuth token
aws secretsmanager create-secret \
  --name github-oauth-token-${ENVIRONMENT_SUFFIX} \
  --secret-string 'YOUR_GITHUB_TOKEN' \
  --region us-east-2
```

## Configuration

Create a Pulumi stack configuration file (`Pulumi.${ENVIRONMENT_SUFFIX}.yaml`):

```yaml
config:
  aws:region: us-east-2
  TapStack:environmentSuffix: dev
  TapStack:githubOwner: your-organization
  TapStack:githubRepo: payment-service
  TapStack:githubBranch: main
  TapStack:notificationEmail: devops@example.com
  TapStack:ecsClusterName: payment-cluster-dev
  TapStack:ecsServiceName: payment-service-dev
  TapStack:ecsBlueTargetGroupName: payment-blue-tg-dev
  TapStack:ecsGreenTargetGroupName: payment-green-tg-dev
  TapStack:albListenerArn: arn:aws:elasticloadbalancing:us-east-2:...
```

Or use environment variables:

```bash
export ENVIRONMENT_SUFFIX=dev
export AWS_REGION=us-east-2
export GITHUB_OWNER=your-organization
export GITHUB_REPO=payment-service
export NOTIFICATION_EMAIL=devops@example.com
```

## Deployment

### Quick Start

```bash
# Install dependencies
npm install

# Initialize Pulumi stack
pulumi stack init dev

# Configure stack
pulumi config set aws:region us-east-2
pulumi config set environmentSuffix dev
pulumi config set githubOwner your-org
pulumi config set githubRepo payment-service
pulumi config set notificationEmail devops@example.com

# Preview changes
pulumi preview

# Deploy infrastructure
pulumi up

# View outputs
pulumi stack output pipelineArn
pulumi stack output artifactBucketName
```

### Destroy Infrastructure

```bash
pulumi destroy --yes
```

## Stack Outputs

After deployment, the following outputs are available:

```
pipelineArn                : arn:aws:codepipeline:us-east-2:...
artifactBucketName         : pipeline-artifacts-dev
unitTestProjectArn         : arn:aws:codebuild:us-east-2:...
dockerBuildProjectArn      : arn:aws:codebuild:us-east-2:...
codeDeployApplicationArn   : arn:aws:codedeploy:us-east-2:...
snsTopicArn                : arn:aws:sns:us-east-2:...
```

## Pipeline Stages

### Stage 1: Source
- **Provider**: GitHub
- **Action**: Pull code from repository
- **Output**: SourceOutput artifact

### Stage 2: Unit Tests
- **Provider**: AWS CodeBuild
- **Project**: unit-test-project-${environmentSuffix}
- **Buildspec**: buildspec-test.yml
- **Actions**:
  - Install Node.js dependencies
  - Run linting and security checks
  - Execute unit tests
  - Generate coverage reports
- **Output**: UnitTestOutput artifact

### Stage 3: Docker Build
- **Provider**: AWS CodeBuild
- **Project**: docker-build-project-${environmentSuffix}
- **Buildspec**: buildspec-build.yml
- **Actions**:
  - Fetch Docker credentials from Secrets Manager
  - Login to Docker registry
  - Build Docker image
  - Tag with commit hash
  - Push to registry
  - Generate deployment artifacts (imagedefinitions.json, taskdef.json, appspec.yaml)
- **Output**: DockerBuildOutput artifact

### Stage 4: Manual Approval
- **Provider**: AWS Manual Approval
- **Action**: Request approval via email (SNS)
- **Purpose**: Gate for production deployments

### Stage 5: Deploy
- **Provider**: AWS CodeDeploy
- **Application**: payment-service-app-${environmentSuffix}
- **Deployment Type**: ECS Blue-Green
- **Features**:
  - Automatic traffic shifting
  - Health checks
  - Automatic rollback on failure
  - 5-minute termination wait for blue environment

## Buildspec Files

### buildspec-test.yml
Unit test execution with coverage reporting:
- Node.js 18 runtime
- npm dependency installation
- Linting and security audits
- Unit test execution
- Coverage report generation

### buildspec-build.yml
Docker image build and push:
- Secrets Manager integration for Docker credentials
- ECR/Docker registry authentication
- Docker image build and tagging
- Multi-tag push (commit hash + latest)
- Deployment artifact generation

## Security Features

### Encryption
- **S3 Artifacts**: AES256 server-side encryption
- **Secrets**: AWS Secrets Manager with automatic rotation support
- **Logs**: CloudWatch Logs encrypted at rest

### IAM Least Privilege
- Separate roles for CodePipeline, CodeBuild, and CodeDeploy
- Scoped policies with minimal required permissions
- No wildcard Resource ARNs except where AWS requires

### Network Security
- CodeBuild supports VPC configuration for private builds
- S3 bucket public access completely blocked
- HTTPS-only communication

### Compliance (PCI DSS)
- Encryption at rest and in transit
- Audit trails via CloudWatch Logs (30-day retention)
- Role-based access control
- Automated security scanning in build phase

## Monitoring and Notifications

### CloudWatch Logs
- `/aws/codebuild/unit-test-${environmentSuffix}` - Unit test logs
- `/aws/codebuild/docker-build-${environmentSuffix}` - Docker build logs
- 30-day retention for compliance

### SNS Notifications
Email notifications sent for:
- Pipeline execution failures
- Manual approval requests
- Deployment start/success/failure
- Automatic rollbacks

### EventBridge Rules
- Pipeline state changes (FAILED, SUCCEEDED)
- Formatted notifications with pipeline name, state, and execution ID

## Troubleshooting

### Common Issues

**Pipeline fails at Source stage**
```bash
# Verify GitHub token exists
aws secretsmanager get-secret-value --secret-id github-oauth-token-${ENVIRONMENT_SUFFIX}
```

**Docker build fails with permission denied**
- Ensure CodeBuild project has `privilegedMode: true`
- Check IAM role has ECR permissions

**Deployment fails at CodeDeploy**
```bash
# Verify ECS resources exist
aws ecs describe-clusters --clusters ${ECS_CLUSTER_NAME}
aws ecs describe-services --cluster ${ECS_CLUSTER_NAME} --services ${ECS_SERVICE_NAME}
```

**Manual approval emails not received**
- Check SNS subscription is confirmed
- Verify email address in configuration

### Debugging Commands

```bash
# View pipeline execution history
aws codepipeline list-pipeline-executions \
  --pipeline-name payment-service-pipeline-${ENVIRONMENT_SUFFIX}

# Tail CodeBuild logs
aws logs tail /aws/codebuild/unit-test-${ENVIRONMENT_SUFFIX} --follow

# Check CodeDeploy deployment status
aws deploy list-deployments \
  --application-name payment-service-app-${ENVIRONMENT_SUFFIX}

# List S3 artifacts
aws s3 ls s3://pipeline-artifacts-${ENVIRONMENT_SUFFIX}/
```

## Cost Optimization

### Estimated Monthly Costs (dev environment)
- **CodePipeline**: $1/month (1 active pipeline)
- **CodeBuild**: $0.005/build minute (~$2.50 for 100 builds @ 5 min each)
- **S3**: $0.023/GB (~$0.23 for 10 GB)
- **CloudWatch Logs**: $0.50/GB ingested (~$0.50 for 1 GB)
- **SNS**: Minimal (<$2 for 1000 emails)
- **CodeDeploy**: Free for ECS deployments

**Total**: ~$6-7/month for development environment

### Optimization Strategies
- Use build caching to reduce build times
- Lifecycle rules automatically delete old artifacts
- 30-day log retention prevents unbounded growth
- Serverless services scale to zero when idle

## Testing

### Unit Tests
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

Tests verify:
- Stack creation with all required resources
- IAM policies are correctly scoped
- S3 bucket encryption and versioning
- Pipeline has all 5 stages
- SNS topic has email subscription
- EventBridge rules are configured

## Maintenance

### Regular Tasks
- Monitor pipeline execution metrics
- Review CloudWatch Logs for errors
- Update buildspec files as needed
- Rotate secrets in Secrets Manager quarterly
- Review and optimize IAM policies

### Upgrades
```bash
# Update Pulumi providers
pulumi plugin install

# Update CodeBuild image version
# Edit lib/codebuild-stack.ts: image: 'aws/codebuild/standard:8.0'
```

## CI/CD Integration

See `lib/ci-cd.yml` for GitHub Actions workflow that demonstrates:
- OIDC authentication (no long-lived credentials)
- Multi-stage deployment (dev → staging → prod)
- Manual approval gates
- Security scanning integration
- Cross-account role assumptions

## Features Implemented

### Mandatory Constraints ✅
- ✅ Secrets Manager for Docker registry credentials
- ✅ CodeDeploy for ECS blue-green deployments with traffic shifting
- ✅ All resources tagged with Environment, Project, and CostCenter

### Optional Constraints ✅
- ✅ Manual approval action before production deployment
- ✅ IAM roles with least privilege for each component
- ✅ CloudWatch Logs for all CodeBuild projects (30-day retention)
- ✅ S3 artifact storage with versioning enabled
- ✅ Separate buildspec files for unit tests and Docker builds
- ✅ SNS notifications for pipeline state changes
- ✅ CodePipeline with 5 distinct stages

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
- Review IDEAL_RESPONSE.md for complete implementation details
- Check MODEL_FAILURES.md for common failure patterns
- Review CloudWatch Logs for runtime errors
- Check AWS service status: https://status.aws.amazon.com
