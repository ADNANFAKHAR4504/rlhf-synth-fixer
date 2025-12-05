# CI/CD Pipeline for Python Applications

This AWS CDK stack creates a complete CI/CD pipeline for deploying containerized Python applications to ECS Fargate with blue-green deployment strategy.

## Architecture Overview

The pipeline includes:

- **CodeCommit**: Source repository for application code
- **CodeBuild**: Builds Docker images, runs pytest and bandit security scanning
- **ECR**: Docker image registry with lifecycle policy (retains last 10 images)
- **ECS Fargate**: Container hosting with blue-green deployment
- **Application Load Balancer**: Traffic routing with two target groups
- **CodeDeploy**: Orchestrates blue-green deployments
- **CodePipeline**: End-to-end automation
- **CloudWatch Logs**: 30-day retention for all pipeline stages
- **SNS**: Pipeline failure notifications
- **Parameter Store**: Docker credentials management

## Prerequisites

- AWS CDK 2.x installed
- Python 3.9 or higher
- AWS CLI configured with appropriate credentials
- Docker installed locally (for testing)

## Deployment Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Environment Suffix

The stack uses an environment suffix for resource naming. You can set it via CDK context:

```bash
export ENVIRONMENT_SUFFIX="dev"
```

Or pass it during deployment:

```bash
cdk deploy --context environmentSuffix=dev
```

### 3. Configure Notification Email

Set your email for pipeline failure notifications:

```bash
cdk deploy --context notificationEmail=your-email@example.com
```

### 4. Deploy the Stack

```bash
# Synthesize CloudFormation template
cdk synth

# Deploy the stack
cdk deploy --context environmentSuffix=dev --context notificationEmail=devops@example.com

# Approve IAM role creation when prompted
```

### 5. Update Docker Hub Credentials

After deployment, update the Parameter Store values with your actual Docker Hub credentials:

```bash
aws ssm put-parameter --name "/app/dev/docker/username" --value "your-docker-username" --type String --overwrite
aws ssm put-parameter --name "/app/dev/docker/password" --value "your-docker-password" --type String --overwrite
```

### 6. Push Sample Application to CodeCommit

The stack creates a CodeCommit repository. Push the sample application:

```bash
# Get the repository URL from stack outputs
REPO_URL=$(aws cloudformation describe-stacks --stack-name TapStack-dev --query "Stacks[0].Outputs[?OutputKey=='CodeCommitRepoUrl-dev'].OutputValue" --output text)

# Clone the repository
git clone $REPO_URL
cd python-app-dev

# Copy sample application files
cp -r lib/sample-app/* .

# Commit and push
git add .
git commit -m "Initial application commit"
git push origin main
```

## Pipeline Workflow

1. **Source Stage**: CodeCommit detects changes and triggers the pipeline
2. **Build Stage**: CodeBuild executes:
   - Installs Python dependencies
   - Runs pytest unit tests
   - Runs bandit security scanner
   - Builds Docker image
   - Pushes image to ECR
   - Creates deployment artifacts
3. **Deploy Stage**: CodeDeploy performs blue-green deployment:
   - Deploys to green target group
   - Runs health checks
   - Gradually shifts traffic
   - Automatic rollback on failure

## Monitoring

### View Pipeline Status

```bash
aws codepipeline get-pipeline-state --name app-pipeline-dev
```

### View Build Logs

```bash
# CloudWatch Logs
aws logs tail /codebuild/app-dev --follow
```

### View ECS Service

```bash
aws ecs describe-services --cluster app-cluster-dev --services app-service-dev
```

### Access Application

The Application Load Balancer DNS name is output after deployment:

```bash
# Get ALB DNS
ALB_DNS=$(aws cloudformation describe-stacks --stack-name TapStack-dev --query "Stacks[0].Outputs[?OutputKey=='LoadBalancerDns-dev'].OutputValue" --output text)

# Test the application
curl http://$ALB_DNS/
```

## Resource Naming Convention

All resources include the environment suffix for isolation:

- VPC: `vpc-{environmentSuffix}`
- ECR Repository: `python-app-{environmentSuffix}`
- ECS Cluster: `app-cluster-{environmentSuffix}`
- Pipeline: `app-pipeline-{environmentSuffix}`
- Load Balancer: `app-alb-{environmentSuffix}`

## Cost Optimization

- VPC uses NAT Gateways = 0 (uses VPC endpoints)
- ECS Fargate: 256 CPU, 512 MB memory
- ECR lifecycle policy: Retains only last 10 images
- CloudWatch Logs: 30-day retention

## Cleanup

To destroy all resources:

```bash
cdk destroy --context environmentSuffix=dev
```

Note: The S3 bucket for pipeline artifacts will be automatically emptied and deleted.

## Security Features

- **Least Privilege IAM**: Separate roles for pipeline, build, and deployment
- **Encrypted Artifacts**: S3 bucket with server-side encryption
- **Security Scanning**: Bandit SAST analysis in build stage
- **Private Subnets**: ECS tasks run in private subnets
- **Secret Management**: Docker credentials in Parameter Store
- **SSL Enforcement**: S3 bucket enforces SSL

## Troubleshooting

### Pipeline Fails at Build Stage

Check CodeBuild logs:

```bash
aws logs tail /codebuild/app-dev --follow
```

### Deployment Fails

Check CodeDeploy deployment status:

```bash
aws deploy list-deployments --application-name app-deploy-dev
```

### ECS Tasks Not Starting

Check ECS service events:

```bash
aws ecs describe-services --cluster app-cluster-dev --services app-service-dev --query "services[0].events[0:5]"
```

## Multi-Environment Support

Deploy to multiple environments:

```bash
# Development
cdk deploy --context environmentSuffix=dev

# Staging
cdk deploy --context environmentSuffix=staging

# Production
cdk deploy --context environmentSuffix=prod
```

## CI/CD Integration

The stack includes a GitHub Actions workflow template in `lib/ci-cd.yml` for automated deployments across environments with OIDC authentication.

## Stack Outputs

- **PipelineArn**: ARN of the CodePipeline
- **ECRRepositoryUri**: URI of the ECR repository
- **CodeCommitRepoUrl**: Clone URL for CodeCommit repository
- **LoadBalancerDns**: DNS name of the Application Load Balancer

## License

This infrastructure code is provided as-is for educational purposes.
