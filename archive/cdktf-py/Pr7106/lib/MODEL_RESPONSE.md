# CI/CD Pipeline for Microservices Deployment - Implementation

This document provides a comprehensive implementation of a multi-stage CI/CD pipeline for microservices deployment using CDKTF with Python.

## Overview

This infrastructure creates a production-grade CI/CD pipeline with the following key features:

- 5-stage CodePipeline (Source, Build, Test, Staging, Production)
- Parallel builds for 3 microservices (api-service, auth-service, notification-service)
- Blue-green deployments on ECS Fargate
- Automated health validation and rollback
- Comprehensive monitoring and alerting

## Architecture Components

### 1. Networking Infrastructure

**VPC Configuration:**
- CIDR: 10.0.0.0/16
- 3 Availability Zones (us-east-1a, us-east-1b, us-east-1c)
- 3 Public Subnets (10.0.0.0/24, 10.0.1.0/24, 10.0.2.0/24) for ALB
- 3 Private Subnets (10.0.10.0/24, 10.0.11.0/24, 10.0.12.0/24) for ECS tasks
- Internet Gateway for public subnet routing

**Security Groups:**
- ALB Security Group: Allows HTTP (80) and HTTPS (443) from internet
- ECS Security Group: Allows all TCP traffic from ALB only

**Application Load Balancer:**
- Type: Application (Layer 7)
- Scheme: Internet-facing
- Target Groups: Blue/Green for each service in each environment
- Health Checks: /health endpoint, 30-second intervals

### 2. Container Registry (ECR)

**Repositories Created:**
- `api-service-{environment_suffix}`
- `auth-service-{environment_suffix}`
- `notification-service-{environment_suffix}`

**Features:**
- Image scanning on push enabled
- Lifecycle policy: Remove untagged images after 7 days
- Mutable tags for development flexibility
- Force delete enabled for destroyability

### 3. Source Control

**CodeCommit Repository:**
- Name: `microservices-monorepo-{environment_suffix}`
- Contains monorepo structure with services under `services/` directory
- Branch: main (default)

### 4. Build Infrastructure

**CodeBuild Projects:**

1. **Service Build Projects** (3 projects, one per microservice):
   - Compute: BUILD_GENERAL1_SMALL
   - Image: aws/codebuild/standard:7.0
   - Privileged mode: Enabled (for Docker)
   - Build Process:
     - Login to ECR
     - Build Docker image from `services/{service}/Dockerfile`
     - Tag with commit hash
     - Push to ECR
     - Generate imagedefinitions.json

2. **Integration Test Project:**
   - Runs pytest tests from `tests/` directory
   - Generates JUnit XML reports
   - Validates application functionality

**Build Artifacts:**
- Stored in S3 bucket: `cicd-artifacts-{environment_suffix}-{region}`
- Versioning enabled
- 30-day lifecycle retention policy
- Encrypted at rest

### 5. ECS Infrastructure

**Clusters:**
- Staging Cluster: `staging-cluster-{environment_suffix}`
- Production Cluster: `production-cluster-{environment_suffix}`

**Task Definitions:**

Staging:
- CPU: 256
- Memory: 512 MB
- Network Mode: awsvpc (Fargate requirement)

Production:
- CPU: 512
- Memory: 1024 MB
- Network Mode: awsvpc

**Container Configuration:**
- Port Mapping: Container port 80
- Log Driver: awslogs
- Log Groups: `/ecs/{environment}/{service}-{environment_suffix}`
- Log Retention: 14 days

**ECS Services:**
- Desired Count: 2 tasks per service
- Launch Type: FARGATE
- Deployment Controller: CODE_DEPLOY (for blue-green)
- Network: Private subnets with ALB connectivity
- Load Balancer: Integrated with blue target group

### 6. CI/CD Pipeline

**Stage 1: Source**
- Provider: CodeCommit
- Branch: main
- Output: SourceOutput artifact

**Stage 2: Build**
- Parallel builds for all 3 microservices
- Each service uses dedicated CodeBuild project
- Outputs: api-serviceBuildOutput, auth-serviceBuildOutput, notification-serviceBuildOutput

**Stage 3: Test**
- Integration tests via CodeBuild
- pytest with JUnit XML output
- Output: TestOutput artifact

**Stage 4: Staging**
- Deploy all services to staging ECS cluster
- Health validation via Lambda function
- Checks CloudWatch alarms for task count
- Automatic rollback on failure

**Stage 5: Production**
- Manual approval required (SNS notification sent)
- Deploy all services to production ECS cluster
- Health validation via Lambda function
- Comprehensive alarm checks
- Automatic rollback on failure

### 7. Health Validation and Rollback

**Lambda Function: health-check-{environment_suffix}**

Runtime: Python 3.9
Timeout: 300 seconds
Memory: 256 MB

**Functionality:**
1. Receives deployment parameters from CodePipeline
2. Checks CloudWatch alarms:
   - ECS task count alarms
   - ALB 5XX error alarms
   - Target health alarms
3. If alarms breached:
   - Publishes SNS notification
   - Reports failure to CodePipeline
   - Triggers automatic rollback
4. If healthy:
   - Reports success to CodePipeline
   - Deployment proceeds

**IAM Permissions:**
- CloudWatch: Describe alarms, get metrics
- ECS: Describe services, update service
- CodePipeline: Put job success/failure result
- SNS: Publish notifications

### 8. Monitoring and Alerting

**CloudWatch Alarms (per service, per environment):**

1. **Task Count Alarm:**
   - Metric: ECS RunningTaskCount
   - Threshold: < 1
   - Evaluation: 2 periods of 60 seconds
   - Action: SNS notification

2. **5XX Error Alarm:**
   - Metric: ALB HTTPCode_Target_5XX_Count
   - Threshold: > 10
   - Evaluation: 2 periods of 300 seconds
   - Action: SNS notification

3. **Target Health Alarm:**
   - Metric: ALB HealthyHostCount
   - Threshold: < 1
   - Evaluation: 2 periods of 60 seconds
   - Action: SNS notification

**SNS Topic:**
- Name: `pipeline-notifications-{environment_suffix}`
- Subscribers: Email (configured externally)
- Notifications for:
  - Pipeline state changes
  - Manual approval requests
  - Health check failures
  - Alarm breaches

### 9. Configuration Management

**Parameter Store:**

Path structure: `/pipeline/{stage}/{service}/config`

Example parameters:
- `/pipeline/staging/api-service/config`
- `/pipeline/staging/auth-service/config`
- `/pipeline/production/api-service/config`

Configuration format:
```json
{
  "environment": "staging|production",
  "service": "service-name",
  "log_level": "INFO|DEBUG"
}
```

### 10. Blue-Green Deployment

**Target Groups:**

Each service in each environment has two target groups:
- Blue: Active production traffic
- Green: New deployment for validation

**Deployment Process:**
1. New task definition deployed to green target group
2. ECS starts new tasks in green group
3. Health checks validate green deployment
4. Traffic switched from blue to green (manual or automated)
5. Blue tasks drained and terminated
6. Green becomes new blue for next deployment

**Benefits:**
- Zero-downtime deployments
- Instant rollback capability
- Production validation before traffic switch
- Reduced deployment risk

## Infrastructure Outputs

The stack exports the following outputs for operational use:

1. **pipeline_url**: Direct link to CodePipeline console
2. **codecommit_repo_url**: Repository clone URL
3. **ecr_*_uri**: ECR repository URIs for each microservice
4. **alb_dns_name**: Load balancer DNS for accessing services
5. **ecs_*_endpoint**: Service endpoints (ALB DNS + port)
6. **sns_topic_arn**: Notification topic ARN
7. **artifacts_bucket**: S3 bucket for build artifacts

## Deployment Instructions

### Prerequisites

1. Install CDKTF CLI:
```bash
npm install -g cdktf-cli
```

2. Install Python dependencies:
```bash
pipenv install
```

3. Configure AWS credentials:
```bash
aws configure
```

4. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX="dev"
export AWS_REGION="us-east-1"
export TERRAFORM_STATE_BUCKET="your-state-bucket"
```

### Deploy Infrastructure

1. Initialize CDKTF:
```bash
cdktf get
```

2. Synthesize Terraform configuration:
```bash
cdktf synth
```

3. Deploy stack:
```bash
cdktf deploy
```

4. Confirm deployment when prompted

### Verify Deployment

Run integration tests:
```bash
pipenv run pytest tests/integration/ -v
```

### Trigger Pipeline

1. Clone CodeCommit repository (URL from outputs)
2. Push code to main branch
3. Pipeline automatically starts
4. Monitor in CodePipeline console

### Destroy Infrastructure

```bash
cdktf destroy
```

## Cost Optimization

This implementation includes several cost optimization strategies:

1. **Serverless where possible:**
   - Lambda for validation (pay per execution)
   - Fargate for ECS (no EC2 management)

2. **Right-sizing:**
   - Staging: 256/512 CPU/Memory
   - Production: 512/1024 CPU/Memory
   - CodeBuild: SMALL instances

3. **Resource cleanup:**
   - ECR lifecycle policies
   - S3 30-day retention
   - CloudWatch Logs 14-day retention

4. **Efficient networking:**
   - Single Internet Gateway
   - Private subnets for ECS (no NAT Gateway in this implementation)

## Security Considerations

1. **Least Privilege IAM:**
   - Separate roles for CodeBuild, CodePipeline, ECS, Lambda
   - Minimal permissions for each role

2. **Network Isolation:**
   - ECS tasks in private subnets
   - ALB in public subnets
   - Security groups restrict traffic

3. **Encryption:**
   - S3 artifacts encrypted at rest
   - CloudWatch Logs encrypted
   - ECS task definition supports encryption

4. **Audit Logging:**
   - CloudWatch Logs for all services
   - CodePipeline execution history
   - ECS task logs

## Troubleshooting

### Pipeline Failures

1. **Build Stage Fails:**
   - Check CodeBuild logs in CloudWatch
   - Verify Dockerfile exists at `services/{service}/Dockerfile`
   - Ensure ECR permissions are correct

2. **Test Stage Fails:**
   - Review test output in CodeBuild logs
   - Check test dependencies in `tests/requirements.txt`
   - Verify pytest configuration

3. **Staging/Production Deploy Fails:**
   - Check ECS service events
   - Verify task definition is valid
   - Ensure target group health checks pass
   - Review Lambda validation logs

### Health Check Failures

1. **Alarm Breached:**
   - Check CloudWatch metrics for the service
   - Review ECS task logs
   - Verify application health endpoint

2. **Lambda Timeout:**
   - Increase Lambda timeout (currently 300s)
   - Check Lambda CloudWatch Logs
   - Verify Lambda IAM permissions

### ECS Service Issues

1. **Tasks Not Starting:**
   - Check ECS service events
   - Verify IAM task execution role
   - Check ECR image exists
   - Review task definition configuration

2. **Target Health Check Failing:**
   - Verify application exposes /health endpoint
   - Check security group allows ALB → ECS traffic
   - Review application logs for errors

## Testing

### Unit Tests

```bash
pipenv run pytest tests/unit/ -v
```

Tests stack synthesis and resource validation using CDKTF Testing framework.

### Integration Tests

```bash
pipenv run pytest tests/integration/ -v
```

Tests deployed resources in AWS:
- Verifies all resources exist
- Checks configuration matches expectations
- Validates service connectivity
- Tests alarm configuration

## Maintenance

### Updating Services

1. Push code changes to CodeCommit
2. Pipeline automatically triggers
3. Monitor deployment progress
4. Validate health checks pass

### Scaling Services

Update desired count in ECS service:
```python
desired_count=4  # Change from 2
```

Redeploy infrastructure:
```bash
cdktf deploy
```

### Adding New Services

1. Add service to `microservices` list in `tap_stack.py`
2. Create ECR repository
3. Add CodeBuild project
4. Add ECS task definition and service
5. Update pipeline stages

## Performance Considerations

1. **Parallel Builds:** All microservices build concurrently
2. **Fargate Scaling:** ECS auto-scales based on demand
3. **ALB Distribution:** Traffic distributed across AZs
4. **Health Checks:** Fast health validation (30s intervals)

## Compliance

This implementation supports compliance requirements:

1. **Audit Trail:**
   - CloudWatch Logs retention
   - CodePipeline execution history
   - ECS deployment history

2. **Change Control:**
   - Manual approval for production
   - Automated testing before deployment
   - Rollback capability

3. **High Availability:**
   - Multi-AZ deployment
   - Auto-scaling ECS services
   - ALB health checks

## Known Limitations

1. **Blue-Green Deployment:**
   - Requires manual traffic switching in this implementation
   - Consider AWS CodeDeploy for automated switching

2. **Database Migrations:**
   - Not included in this implementation
   - Add separate migration stage if needed

3. **Secrets Management:**
   - Uses Parameter Store for configuration
   - Consider AWS Secrets Manager for sensitive data

4. **Cross-Region Deployment:**
   - Single region implementation
   - Requires additional configuration for multi-region

## Conclusion

This implementation provides a robust, production-ready CI/CD pipeline for microservices deployment with comprehensive monitoring, automated rollback, and blue-green deployment capabilities. The infrastructure is cost-optimized, secure, and follows AWS best practices.
