# ECS Fargate Batch Processing Infrastructure

Hey team,

We need to build a production-ready containerized batch processing system for our financial services client. They're modernizing their risk analysis workloads and need to move from legacy systems to a fully containerized, scalable infrastructure. I've been asked to create this using **CDKTF with Python** to give us the flexibility of Terraform with the expressiveness of Python code.

The business wants a system that can handle overnight batch processing of large datasets for risk analysis. Security is paramount since we're dealing with financial data, so everything needs to run in isolated private subnets with no direct internet exposure. They also need zero-downtime deployments to avoid disrupting their processing windows.

The current architecture they're running is brittle and doesn't scale well. We need to give them something that automatically adjusts to workload demands, supports blue-green deployments for safe rollouts, and provides comprehensive monitoring so they can sleep at night knowing their critical risk calculations are running smoothly.

## What we need to build

Create a production-grade container orchestration platform using **CDKTF with Python** for ECS Fargate batch processing workloads.

### Core Requirements

1. **Networking Foundation**
   - Create VPC with 3 public and 3 private subnets across different availability zones
   - Deploy NAT gateways in public subnets for outbound internet access from private subnets
   - Configure route tables and security groups for proper network isolation

2. **Container Registry**
   - Set up ECR repository with image scanning enabled on push
   - Implement lifecycle policy to retain only the last 10 images
   - Enable vulnerability scanning for security compliance

3. **ECS Cluster Configuration**
   - Create ECS cluster with container insights enabled for enhanced monitoring
   - Configure capacity providers for both FARGATE and FARGATE_SPOT
   - Enable execute command capability for debugging if needed

4. **Task Definition**
   - Define task with 2048 CPU units and 4096 MB memory
   - Configure batch processor container with appropriate environment variables
   - Specify resource limits and health check parameters

5. **ECS Service Deployment**
   - Deploy service with desired count of 3 tasks
   - Use 70% FARGATE_SPOT and 30% FARGATE capacity for cost optimization
   - Ensure tasks run only in private subnets with no direct internet access

6. **Load Balancer Setup**
   - Deploy Application Load Balancer in public subnets
   - Configure target group with health checks on /health endpoint
   - Set health check to mark unhealthy after 3 consecutive failures

7. **Auto-Scaling Configuration**
   - Implement target tracking scaling based on CPU utilization
   - Scale up when CPU exceeds 70%
   - Scale down when CPU drops below 30%
   - Set minimum 2 and maximum 10 tasks

8. **Logging Infrastructure**
   - Create CloudWatch log groups for each container
   - Enable KMS encryption for all log data
   - Set 30-day retention policy

9. **IAM Security**
   - Create task execution role with minimal permissions for ECR pull and CloudWatch logging
   - Create task role with permissions needed by the application
   - Follow least privilege principle throughout

10. **Blue-Green Deployment**
    - Enable blue-green deployment configuration
    - Configure 10-minute traffic shifting for gradual rollout
    - Set up proper termination wait time

11. **VPC Endpoints for Private Connectivity**
    - Create VPC endpoint for ECR API (com.amazonaws.us-east-1.ecr.api)
    - Create VPC endpoint for ECR Docker Registry (com.amazonaws.us-east-1.ecr.dkr)
    - Create VPC endpoint for ECS (com.amazonaws.us-east-1.ecs)
    - Create VPC endpoint for CloudWatch Logs (com.amazonaws.us-east-1.logs)
    - Create VPC gateway endpoint for S3 (com.amazonaws.us-east-1.s3)
    - Associate all endpoints with private subnets and appropriate security groups
    - Enable private DNS for interface endpoints

12. **Comprehensive CloudWatch Alarms**
    - Create alarms for ECS service: UnhealthyTaskCount, CPUUtilization, MemoryUtilization
    - Create alarms for ALB: UnHealthyHostCount, TargetResponseTime, HTTPCode_Target_5XX_Count
    - Create alarms for auto-scaling events to track scaling activities
    - Set up SNS topic for alarm notifications
    - Configure appropriate thresholds and evaluation periods for each alarm

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Deploy to **us-east-1** region
- Use **ECS Fargate** for serverless container management
- Use **Application Load Balancer** for traffic distribution
- Use **ECR** for container image storage
- Use **CloudWatch** for logging and monitoring
- Use **KMS** for encryption at rest
- Use **VPC Endpoints** to avoid NAT gateway traffic costs for AWS service communication
- Use **SNS** for alarm notifications
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- All resources must be tagged with Environment, Project, and CostCenter tags

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (RemovalPolicy must be DESTROY, no RETAIN policies)
- All resource names must include environmentSuffix parameter to prevent naming conflicts
- No hard-coded environment-specific values
- DeletionPolicy should allow cleanup (skip_final_snapshot=true for databases if any)

### Security Constraints

- ECS tasks must run in private subnets with no direct internet access
- Container images must be stored in ECR with vulnerability scanning enabled
- Task definitions must specify both memory and CPU hard limits
- Each container must have its own CloudWatch log group with KMS encryption
- Task execution role must have minimal permissions following least privilege principle
- VPC endpoints must be used to avoid exposing traffic to internet

### Cost Optimization

- ECS service must use FARGATE_SPOT for cost optimization with 70% spot capacity
- Use VPC endpoints to reduce NAT gateway data transfer costs
- Lifecycle policy on ECR to limit image retention
- CloudWatch log retention set to 30 days only

### Monitoring and Observability

- Container insights must be enabled on ECS cluster
- CloudWatch alarms must cover critical metrics for ECS service health
- CloudWatch alarms must cover ALB health and performance metrics
- SNS notifications must alert on alarm state changes
- All container logs must be centralized in CloudWatch

## Success Criteria

- **Functionality**: Complete ECS Fargate cluster with ALB, auto-scaling, and blue-green deployments
- **Performance**: Auto-scaling responds appropriately to CPU metrics
- **Reliability**: Tasks recover automatically on failure, alarms notify on issues
- **Security**: All tasks in private subnets, KMS encryption, least privilege IAM
- **Networking**: VPC endpoints reduce costs and improve security
- **Monitoring**: Comprehensive CloudWatch alarms provide visibility into system health
- **Resource Naming**: All resources include environmentSuffix for CI/CD compatibility
- **Code Quality**: Python code, 100% test coverage, well-documented
- **Cost Efficiency**: Spot capacity used where appropriate, endpoints reduce NAT costs

## What to deliver

- Complete CDKTF Python implementation with all 12 requirements
- VPC with public and private subnets across 3 AZs
- ECR repository with scanning and lifecycle policies
- ECS Fargate cluster with container insights
- ECS task definition with proper resource limits
- ECS service with mixed capacity providers (FARGATE and FARGATE_SPOT)
- Application Load Balancer with health checks
- Auto-scaling configuration based on CPU
- CloudWatch log groups with KMS encryption
- IAM roles following least privilege
- Blue-green deployment configuration
- VPC endpoints for ECR, ECS, CloudWatch Logs, and S3
- CloudWatch alarms for ECS service, ALB, and auto-scaling
- SNS topic for alarm notifications
- Unit tests for all components with 100% coverage
- Integration tests validating deployed resources
- Documentation and deployment instructions
