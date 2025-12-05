# CI/CD Pipeline for ECS Fargate Deployment

We need to build a complete CI/CD pipeline infrastructure using Pulumi with TypeScript. The pipeline should automate the build, test, and deployment of containerized applications to ECS Fargate with an Application Load Balancer.

## Requirements

### Platform Specifications
- Infrastructure as Code: Pulumi
- Language: TypeScript
- Target Region: us-east-1
- All resources must include the environment suffix in their names (use `ENVIRONMENT_SUFFIX` environment variable)

### Pipeline Architecture

Create a CodePipeline with the following stages:

1. **Source Stage**
   - Connect to GitHub repository using CodeStar connection
   - Trigger pipeline on pushes to main branch
   - Enable automatic triggering

2. **Build Stage**
   - Use CodeBuild with BUILD_GENERAL1_MEDIUM compute type
   - Build Docker images and push to ECR
   - Run Trivy vulnerability scanning on the container image
   - Enable S3 caching for faster builds
   - Generate image definitions file for ECS deployment

3. **Test Stage**
   - Use CodeBuild with BUILD_GENERAL1_SMALL compute type
   - Run unit and integration tests
   - Generate JUnit test reports
   - Enable local caching

4. **Manual Approval Stage**
   - Require manual approval before production deployment
   - Send notification to SNS topic when approval is pending
   - Set timeout to 24 hours (1440 minutes)

5. **Deploy Stage**
   - Deploy to ECS Fargate service using rolling update
   - Configure minimum healthy percent at 50%
   - Configure maximum percent at 200%

### Infrastructure Components

The pipeline needs these supporting resources:

**Networking**
- VPC with CIDR 10.0.0.0/16
- Two public subnets (10.0.1.0/24, 10.0.2.0/24) for ALB
- Two private subnets (10.0.10.0/24, 10.0.11.0/24) for ECS tasks
- Internet Gateway for public subnet internet access
- Single NAT Gateway for private subnet outbound traffic (cost optimization)
- Route tables with proper associations

**Container Registry**
- ECR repository with image scanning enabled
- Lifecycle policy to keep maximum 10 images

**ECS Cluster**
- Fargate launch type
- Container Insights enabled
- Task definition with 1 vCPU and 2GB memory
- Service running 2 tasks across private subnets

**Load Balancing**
- Application Load Balancer in public subnets
- Target group with IP target type
- Health check on root path with 30 second interval
- Listener on port 80
- Idle timeout set to 30 seconds
- Deregistration delay of 30 seconds

**Security Groups**
- ALB security group allowing HTTP (80) and HTTPS (443) from anywhere
- ECS task security group allowing traffic only from ALB security group

**Monitoring and Alerting**
- CloudWatch Log Group with 7-day retention
- CloudWatch alarms for:
  - ECS CPU utilization above 80%
  - ECS Memory utilization above 80%
  - Pipeline execution failures
- CloudWatch Dashboard showing CPU, memory, and ALB metrics
- SNS topic for deployment notifications

**IAM Roles**
- CodePipeline service role with permissions for S3, CodeBuild, ECS
- CodeBuild service role with ECR and CloudWatch Logs permissions
- ECS task execution role with ECR pull and CloudWatch Logs permissions
- ECS task role for application-specific permissions

**Artifact Storage**
- S3 bucket for pipeline artifacts with 30-day lifecycle policy
- S3 bucket for Docker build cache

### Resource Tagging

All resources must have these tags:
- Environment: value from environmentSuffix
- Team: platform
- CostCenter: engineering
- ManagedBy: Pulumi

### Stack Outputs

Export the following values:
- ALB DNS name for accessing the application
- CloudWatch Dashboard URL for monitoring
- VPC ID
- ECS Cluster ID
- ECS Service ID

### Important Constraints

- All resources must be destroyable for CI/CD cleanup (no deletion protection)
- Use environment suffix variable for all resource names
- Keep costs optimized (single NAT gateway, appropriate compute sizes, lifecycle policies)
- Follow least privilege principle for all IAM roles
- Enable encryption at rest and in transit where applicable

### Testing Requirements

- Unit tests should cover the infrastructure components
- Integration tests should validate the pipeline executes successfully
- Test coverage should be comprehensive

## Deliverables

A working Pulumi TypeScript program that deploys:
1. Complete VPC networking infrastructure
2. ECS Fargate cluster with ALB
3. CodePipeline with all stages configured
4. Supporting resources (ECR, S3, IAM, CloudWatch)
5. Proper monitoring and alerting setup
