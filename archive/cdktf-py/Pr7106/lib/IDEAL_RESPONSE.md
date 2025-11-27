# Building a Production CI/CD Pipeline with CDKTF Python

Welcome! In this tutorial, you'll learn how to build a complete CI/CD pipeline for microservices using CDKTF with Python. By the end, you'll have a production-ready pipeline with automated builds, testing, and blue-green deployments.

## What We're Building

We're creating a 5-stage pipeline that:
- Automatically builds 3 microservices in parallel
- Runs integration tests
- Deploys to staging with health checks
- Requires manual approval for production
- Automatically rolls back if problems are detected

## Prerequisites

Before starting, make sure you have:
- AWS account with appropriate permissions
- Python 3.9 or higher installed
- Node.js and npm installed (for CDKTF)
- AWS CLI configured with credentials
- Basic understanding of Docker and containers

## Step 1: Project Setup

First, let's set up our CDKTF project:

```bash
# Install CDKTF CLI globally
npm install -g cdktf-cli

# Install Python dependencies
pipenv install cdktf-cdktf-provider-aws boto3 pytest

# Set environment variables
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="your-state-bucket"
```

## Step 2: Understanding the Architecture

Our pipeline consists of these key components:

### Networking Layer
- VPC with public and private subnets across 3 availability zones
- Application Load Balancer in public subnets
- ECS tasks in private subnets
- Security groups controlling traffic flow

### Container Registry
- ECR repositories for each microservice
- Automatic image scanning for vulnerabilities
- Lifecycle policies to clean up old images

### Build Pipeline
- CodeCommit for source control
- CodeBuild for parallel builds (one per microservice)
- S3 for storing build artifacts
- Separate test project for integration tests

### Deployment Infrastructure
- ECS Fargate clusters (staging and production)
- Task definitions with different resource allocations
- Blue-green deployment support with target groups
- CloudWatch monitoring and alarms

### Automation
- Lambda function for health validation
- Automatic rollback on health check failures
- SNS notifications for pipeline events

## Step 3: Deploy the Infrastructure

Let's deploy our infrastructure step by step:

### Initialize CDKTF

```bash
# Generate provider bindings
cdktf get

# This downloads the AWS provider and creates Python bindings
# It may take a few minutes on first run
```

### Review the Configuration

The main stack is in `lib/tap_stack.py`. Key sections:

1. **VPC Setup** (lines 85-160): Creates networking infrastructure
2. **ECR Repositories** (lines 245-270): Sets up container registries
3. **CodeBuild Projects** (lines 430-520): Configures build jobs
4. **ECS Clusters** (lines 560-750): Creates container orchestration
5. **CodePipeline** (lines 920-1050): Orchestrates the entire flow

### Synthesize and Verify

```bash
# Generate Terraform configuration
cdktf synth

# This creates a cdktf.out directory with Terraform files
# Review the generated configuration if needed
```

### Deploy

```bash
# Deploy the stack
cdktf deploy

# Terraform will show the execution plan
# Review changes and type "yes" to approve
```

Deployment takes approximately 10-15 minutes. You'll see resources created in this order:
1. VPC and networking (2-3 minutes)
2. Security groups and ALB (1-2 minutes)
3. ECR repositories (1 minute)
4. IAM roles and policies (1 minute)
5. ECS clusters and services (3-5 minutes)
6. CodeBuild projects (1 minute)
7. CodePipeline (2-3 minutes)

## Step 4: Prepare Your Application

### Repository Structure

Your CodeCommit repository should have this structure:

```
microservices-monorepo/
├── services/
│   ├── api-service/
│   │   ├── Dockerfile
│   │   ├── app.py
│   │   └── requirements.txt
│   ├── auth-service/
│   │   ├── Dockerfile
│   │   ├── app.py
│   │   └── requirements.txt
│   └── notification-service/
│       ├── Dockerfile
│       ├── app.py
│       └── requirements.txt
└── tests/
    ├── requirements.txt
    └── test_integration.py
```

### Sample Dockerfile

Each service needs a Dockerfile. Here's a basic example:

```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install -r requirements.txt

COPY app.py .

# Health check endpoint required for ALB
EXPOSE 80

CMD ["python", "app.py"]
```

### Sample Application

Your application must expose a `/health` endpoint for ALB health checks:

```python
from flask import Flask, jsonify

app = Flask(__name__)

@app.route('/health')
def health():
    return jsonify({"status": "healthy"}), 200

@app.route('/')
def hello():
    return jsonify({"message": "Hello from API service"}), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=80)
```

## Step 5: Push Code and Trigger Pipeline

### Clone Repository

After deployment, get the repository URL from outputs:

```bash
# Get repository URL
aws codecommit get-repository \
  --repository-name microservices-monorepo-dev \
  --query 'repositoryMetadata.cloneUrlHttp' \
  --output text

# Clone repository
git clone <repository-url>
cd microservices-monorepo-dev
```

### Add Your Code

```bash
# Create directory structure
mkdir -p services/{api-service,auth-service,notification-service}
mkdir -p tests

# Add your Dockerfiles and application code
# (Use the examples above)

# Commit and push
git add .
git commit -m "Initial microservices implementation"
git push origin main
```

### Monitor Pipeline Execution

The push automatically triggers the pipeline. Monitor progress:

```bash
# Get pipeline URL from stack outputs
# Or use AWS Console: CodePipeline > Pipelines

# View pipeline status
aws codepipeline get-pipeline-state \
  --name microservices-pipeline-dev
```

## Step 6: Understanding Each Pipeline Stage

### Stage 1: Source

- Triggered automatically on push to main branch
- Downloads source code from CodeCommit
- Packages as artifact for next stages

### Stage 2: Build

Three parallel CodeBuild projects run simultaneously:
- Each builds its respective microservice
- Docker images pushed to ECR
- imagedefinitions.json created for deployment

To view build logs:
```bash
aws codebuild batch-get-builds \
  --ids <build-id> \
  --query 'builds[0].logs.deepLink'
```

### Stage 3: Test

Integration tests run against your code:
- Uses pytest framework
- Generates JUnit XML reports
- Must pass before proceeding to staging

### Stage 4: Staging

Deploys to staging environment:
- All three services deployed to ECS
- Lambda function validates health
- Checks CloudWatch alarms
- Automatically rolls back if unhealthy

Monitor staging deployment:
```bash
aws ecs describe-services \
  --cluster staging-cluster-dev \
  --services staging-api-service-dev
```

### Stage 5: Production

Production deployment with safety checks:
1. Manual approval required (you receive SNS notification)
2. Review staging deployment performance
3. Approve in AWS Console
4. Services deploy to production ECS cluster
5. Lambda validates health
6. Automatic rollback on failure

## Step 7: Monitoring and Observability

### CloudWatch Dashboards

View metrics for your services:
```bash
# Get service endpoints from stack outputs
# Access services via ALB DNS name

# Example for api-service in staging:
curl http://<alb-dns-name>:80/health
```

### CloudWatch Alarms

Three types of alarms monitor each service:

1. **Task Count Alarm**: Alerts if running tasks < 1
2. **5XX Error Alarm**: Alerts if error rate > 10 per 5 minutes
3. **Target Health Alarm**: Alerts if healthy targets < 1

View alarm status:
```bash
aws cloudwatch describe-alarms \
  --alarm-name-prefix staging-api-service
```

### Service Logs

Access logs for debugging:
```bash
# View ECS task logs
aws logs tail /ecs/staging/api-service-dev --follow

# View CodeBuild logs
aws logs tail /aws/codebuild/api-service-build-dev --follow
```

## Step 8: Handling Deployments

### Blue-Green Deployment

The infrastructure supports blue-green deployments:

1. **Blue** = Current production (active traffic)
2. **Green** = New deployment (testing)

Process:
1. New version deploys to green target group
2. ECS starts tasks in green group
3. Health checks validate green deployment
4. Traffic switches from blue to green
5. Blue tasks drain and terminate

### Manual Rollback

If you need to roll back manually:

```bash
# Update ECS service to previous task definition
aws ecs update-service \
  --cluster production-cluster-dev \
  --service production-api-service-dev \
  --task-definition <previous-task-def-arn>
```

### Automatic Rollback

The Lambda function automatically rolls back if:
- CloudWatch alarms breach thresholds
- ECS task count drops below desired
- ALB reports unhealthy targets
- 5XX error rate exceeds limits

Check Lambda logs:
```bash
aws logs tail /aws/lambda/health-check-dev --follow
```

## Step 9: Configuration Management

### Parameter Store

Configuration stored in Parameter Store:

```bash
# View parameter
aws ssm get-parameter \
  --name /pipeline/staging/api-service/config

# Update parameter
aws ssm put-parameter \
  --name /pipeline/staging/api-service/config \
  --value '{"environment":"staging","log_level":"DEBUG"}' \
  --overwrite
```

### Environment Variables

Services receive environment variables from task definitions:
- `ENVIRONMENT`: staging or production
- `SERVICE_NAME`: name of the microservice

Access in your application:
```python
import os

environment = os.environ.get('ENVIRONMENT', 'dev')
service_name = os.environ.get('SERVICE_NAME', 'unknown')
```

## Step 10: Testing Your Deployment

### Run Unit Tests

```bash
# Run unit tests locally
pipenv run pytest tests/unit/ -v

# Tests verify infrastructure configuration
```

### Run Integration Tests

```bash
# Run integration tests against deployed infrastructure
pipenv run pytest tests/integration/ -v

# Tests verify all resources exist and are configured correctly
```

### Manual Testing

Test each service endpoint:

```bash
# Get ALB DNS from outputs
ALB_DNS=$(aws elbv2 describe-load-balancers \
  --names cicd-alb-dev \
  --query 'LoadBalancers[0].DNSName' \
  --output text)

# Test api-service (port 80)
curl http://$ALB_DNS:80/health

# Test auth-service (port 81)
curl http://$ALB_DNS:81/health

# Test notification-service (port 82)
curl http://$ALB_DNS:82/health
```

## Step 11: Scaling Your Services

### Horizontal Scaling

Update desired count in task definition:

```python
# In tap_stack.py, find EcsService definition
EcsService(
    self,
    f"ecs_service_{env}_{service}",
    # ...
    desired_count=4,  # Change from 2 to 4
    # ...
)
```

Redeploy:
```bash
cdktf deploy
```

### Vertical Scaling

Update CPU and memory in task definition:

```python
# For production
cpu = "1024"  # Change from 512
memory = "2048"  # Change from 1024
```

## Step 12: Troubleshooting Common Issues

### Build Failures

**Problem**: CodeBuild fails to build Docker image

**Solution**:
1. Check Dockerfile exists at correct path
2. Verify buildspec.yaml syntax
3. Review CodeBuild logs in CloudWatch
4. Ensure ECR permissions are correct

```bash
# View build logs
aws codebuild batch-get-builds --ids <build-id>
```

### Deployment Failures

**Problem**: ECS service fails to start tasks

**Solution**:
1. Check task definition is valid
2. Verify ECR image exists
3. Review ECS service events
4. Check IAM task execution role

```bash
# View service events
aws ecs describe-services \
  --cluster staging-cluster-dev \
  --services staging-api-service-dev \
  --query 'services[0].events'
```

### Health Check Failures

**Problem**: ALB health checks failing

**Solution**:
1. Verify application exposes /health endpoint
2. Check security group allows ALB → ECS traffic
3. Review application logs
4. Ensure health endpoint returns 200 status

```bash
# Test health endpoint from within VPC
aws ecs execute-command \
  --cluster staging-cluster-dev \
  --task <task-id> \
  --command "curl localhost:80/health"
```

## Step 13: Cost Optimization

### Monitor Costs

Your monthly costs will approximately be:

- ECS Fargate: $30-50 (based on task size and count)
- ALB: $20-25
- CodeBuild: $1-5 (pay per build minute)
- ECR: $1-3 (per GB stored)
- Data Transfer: Variable
- **Total**: ~$60-90/month

### Reduce Costs

1. **Use smaller task sizes**: Adjust CPU/memory if sufficient
2. **Reduce task count**: Use 1 task in staging
3. **Cleanup old images**: ECR lifecycle policies already configured
4. **Delete unused resources**: Run `cdktf destroy` when not needed

## Step 14: Production Best Practices

### Security

1. **Use Secrets Manager** for sensitive data:
```python
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret

secret = SecretsmanagerSecret(
    self, "db_password",
    name=f"database-password-{environment_suffix}"
)
```

2. **Enable VPC Flow Logs** for network monitoring
3. **Use AWS WAF** with ALB for additional protection
4. **Implement least privilege** IAM policies

### High Availability

1. **Increase task count** to 3+ per service
2. **Use Auto Scaling** based on CPU/memory metrics
3. **Implement Circuit Breakers** in application code
4. **Add CloudFront** for global distribution

### Monitoring

1. **Create CloudWatch Dashboards** for visualization
2. **Set up X-Ray** for distributed tracing
3. **Configure detailed logging** in applications
4. **Use CloudWatch Insights** for log analysis

## Step 15: Cleanup

When you're done testing, destroy the infrastructure:

```bash
# Destroy all resources
cdktf destroy

# Terraform will show resources to be destroyed
# Type "yes" to confirm
```

**Warning**: This deletes everything including:
- ECS services and tasks
- ECR repositories and images
- CodePipeline and CodeBuild projects
- ALB and target groups
- VPC and networking components

## What's Next?

Now that you have a working CI/CD pipeline, consider:

1. **Add more services**: Extend the microservices list
2. **Implement caching**: Add ElastiCache for better performance
3. **Add database**: Include RDS or DynamoDB
4. **Multi-region**: Deploy to additional regions
5. **Custom domains**: Add Route53 and ACM certificates
6. **API Gateway**: Add API management layer
7. **Service Mesh**: Implement AWS App Mesh

## Additional Resources

- [CDKTF Documentation](https://developer.hashicorp.com/terraform/cdktf)
- [AWS ECS Best Practices](https://docs.aws.amazon.com/AmazonECS/latest/bestpracticesguide/)
- [CodePipeline User Guide](https://docs.aws.amazon.com/codepipeline/)
- [Blue-Green Deployments](https://docs.aws.amazon.com/whitepapers/latest/blue-green-deployments/)

## Conclusion

You now have a production-ready CI/CD pipeline that automatically builds, tests, and deploys microservices with comprehensive monitoring and automatic rollback capabilities. This infrastructure follows AWS best practices and can scale with your application needs.

Happy deploying!
