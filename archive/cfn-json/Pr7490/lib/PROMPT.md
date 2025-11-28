# ECS Batch Processing System for Transaction Reconciliation

Hey team,

We need to modernize our financial services client's transaction reconciliation system. Their current monolithic batch processing application is hitting bottlenecks during peak hours, and they need better resource isolation between different processing stages. I've been asked to create this infrastructure using CloudFormation with JSON templates. The business wants a containerized solution that can handle daily transaction volumes with high availability and proper monitoring.

The system needs to process transactions in three distinct stages: data ingestion from various sources, transaction processing for reconciliation logic, and report generation for compliance teams. Each stage needs to run independently with proper resource allocation and monitoring. The infrastructure must support their 24/7 operations with built-in redundancy and automatic recovery.

## What we need to build

Create a containerized batch processing system using **CloudFormation with JSON** for transaction reconciliation workloads.

### Core Requirements

1. **ECS Cluster Configuration**
   - ECS cluster with Container Insights enabled for monitoring
   - Fargate capacity providers configured
   - Task placement to spread across availability zones

2. **Task Definitions for Processing Stages**
   - data-ingestion task: 2GB memory, 1 vCPU
   - transaction-processing task: 2GB memory, 1 vCPU
   - report-generation task: 2GB memory, 1 vCPU
   - All tasks use awsvpc network mode
   - X-Ray daemon sidecar container in each task for distributed tracing
   - Container images from ECR repositories

3. **ECS Services**
   - One service per task definition (3 services total)
   - Exactly 2 running tasks per service for redundancy
   - Circuit breaker deployment configuration
   - Task placement constraints to spread across AZs

4. **Load Balancer Configuration**
   - Application Load Balancer for report-generation service only
   - Target groups with health checks
   - 30-second health check intervals
   - 3 retry attempts for health checks

5. **IAM Roles and Permissions**
   - Task execution role for pulling images and logging
   - Task IAM roles with Secrets Manager read access
   - S3 write permissions for all tasks
   - X-Ray write permissions for tracing

6. **Monitoring and Logging**
   - CloudWatch log groups per service with 30-day retention
   - Container Insights at cluster level
   - X-Ray integration for distributed tracing

7. **Auto Scaling**
   - Target tracking scaling policies based on CPU utilization
   - Scale up at 70% CPU utilization
   - Scale down at 30% CPU utilization
   - Minimum 2 tasks, maximum based on workload

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Amazon ECS** with Fargate launch type
- Use **Amazon ECR** for container images
- Use **Application Load Balancer** for traffic distribution
- Use **AWS Secrets Manager** for secrets injection
- Use **Amazon S3** for output storage
- Use **AWS X-Ray** for distributed tracing
- Use **Amazon CloudWatch** for logging and monitoring
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy to **us-east-2** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain deletion policies)
- Use DeletionPolicy: Delete or RemovalPolicy: DESTROY for all resources
- FORBIDDEN: DeletionPolicy: Retain or RemovalPolicy: RETAIN
- All resources must accept environmentSuffix parameter for unique naming
- VPC, subnets, and security groups should be parameterized (not created in template)

### Constraints

- FARGATE launch type only (no EC2 instances)
- Container images from ECR in same region (us-east-2)
- Exactly 2 tasks per service for redundancy
- awsvpc network mode required for all tasks
- Container Insights enabled at cluster level
- X-Ray sidecar containers required in all task definitions
- Secrets from AWS Secrets Manager (not environment variables)
- Private subnets for ECS tasks
- NAT gateways for outbound connectivity

## Success Criteria

- Functionality: All three processing stages deploy successfully with proper dependencies
- Performance: Auto-scaling responds to CPU metrics within defined thresholds
- Reliability: 2 tasks per service provide redundancy and zero-downtime deployments
- Security: Secrets injected from Secrets Manager, proper IAM role separation
- Monitoring: CloudWatch logs retained 30 days, X-Ray traces captured
- Resource Naming: All resources include environmentSuffix parameter
- Destroyability: All resources can be deleted when stack is destroyed
- Code Quality: Valid JSON CloudFormation template, well-structured, documented

## What to deliver

- Complete CloudFormation JSON template with all resources
- ECS cluster with Container Insights enabled
- Three task definitions (data-ingestion, transaction-processing, report-generation)
- Three ECS services with exactly 2 tasks each
- Application Load Balancer with target groups for report-generation
- Task IAM roles with Secrets Manager and S3 permissions
- X-Ray daemon sidecar containers in all tasks
- CloudWatch log groups with 30-day retention
- Auto-scaling policies (70% scale up, 30% scale down)
- Health checks (30 second intervals, 3 retries)
- Integration tests for all components
- Documentation and deployment instructions
