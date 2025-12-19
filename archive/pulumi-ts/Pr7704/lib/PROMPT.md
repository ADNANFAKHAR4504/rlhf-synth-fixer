Hey team,

We need to optimize an existing ECS Fargate service deployment. The current setup is running but it's not cost-effective and lacks some important production features. I've been tasked with creating an optimization solution using **Pulumi with TypeScript**.

The business wants us to create a baseline ECS Fargate infrastructure first, then build an optimization script that can tune the deployed resources to reduce costs while maintaining performance. We're looking at things like rightsizing task definitions, implementing auto-scaling, adding better monitoring, and making sure we have proper deployment safety mechanisms in place.

This is an optimization task, so we'll deploy baseline infrastructure with standard configurations, then use a Python script to optimize the live AWS resources after deployment. The optimization should demonstrate measurable cost savings while improving reliability.

## What we need to build

Create an ECS Fargate optimization system using **Pulumi with TypeScript** for infrastructure deployment and Python for runtime optimization.

### Baseline Infrastructure Requirements

Deploy ECS Fargate infrastructure with these baseline configurations:

1. **ECS Task Definitions**
   - Development environment: CPU=512, Memory=1024
   - Production environment: CPU=1024, Memory=2048
   - Task execution role and task role with appropriate permissions
   - Container definitions with logging configuration

2. **ECS Services**
   - Fargate launch type
   - Service with 3 desired tasks (baseline - will be optimized down)
   - Load balancer integration
   - Health check configuration with 300 second grace period
   - Service circuit breaker enabled for safe deployments

3. **Auto Scaling Configuration**
   - Target tracking scaling policies for CPU utilization
   - Target tracking scaling policies for memory utilization
   - Min capacity: 2, Max capacity: 6 (baseline values)

4. **Networking**
   - VPC with public and private subnets
   - Security groups for ECS tasks and load balancer
   - Application Load Balancer for traffic distribution

5. **Container Registry**
   - ECR repository for container images
   - Lifecycle policies to manage image retention (keep last 10 images baseline)

6. **Monitoring and Logging**
   - CloudWatch Container Insights enabled on ECS cluster
   - CloudWatch log groups for container logs
   - CloudWatch alarms for service health and performance
   - Alarms for high CPU utilization, high memory utilization, unhealthy task count

7. **IAM Roles and Permissions**
   - ECS task execution role with ECR pull permissions
   - ECS task role with least-privilege access to required AWS services
   - CloudWatch logs write permissions

8. **Resource Tagging**
   - Cost allocation tags on all resources
   - Environment tags for resource organization

### Optimization Script Requirements (CRITICAL)

Create `lib/optimize.py` that performs runtime optimization on deployed resources:

1. **Resource Discovery**
   - Read `ENVIRONMENT_SUFFIX` from environment variable
   - Find ECS resources using naming pattern: `{resource-name}-{environmentSuffix}`
   - Locate ECS services, task definitions, auto-scaling policies, ECR repositories

2. **ECS Task Definition Optimization**
   - Analyze current task definition CPU/memory allocations
   - Reduce resource allocations for cost savings:
     - Dev environment: CPU=256, Memory=512 (50% reduction)
     - Prod environment: CPU=512, Memory=1024 (50% reduction)
   - Create new task definition revision with optimized values
   - Update ECS service to use new task definition

3. **Service Scaling Optimization**
   - Reduce desired task count from 3 to 2 tasks
   - Adjust auto-scaling min capacity to 1 (from 2)
   - Keep max capacity at 6 for burst handling

4. **ECR Lifecycle Policy Optimization**
   - Update lifecycle policy to keep only last 5 images (from 10)
   - Reduce storage costs for unused container images

5. **CloudWatch Alarm Threshold Adjustment**
   - Update alarm thresholds based on optimized resource allocations
   - Adjust CPU alarm threshold to account for smaller task sizes

6. **Cost Savings Calculation**
   - Calculate monthly cost savings from:
     - Reduced ECS task CPU/memory allocations
     - Lower task count (3 to 2)
     - Reduced ECR storage
   - Display estimated monthly savings in dollars
   - Include breakdown by optimization category

7. **Script Requirements**
   - Use boto3 to interact with AWS APIs
   - Include proper error handling and retry logic
   - Use waiters to ensure resources are in correct state
   - Support `--dry-run` mode for testing without changes
   - Log all changes with timestamps
   - Exit with appropriate status codes

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **ECS Fargate** for serverless container orchestration
- Use **Application Load Balancer** for traffic distribution
- Use **CloudWatch Container Insights** for enhanced monitoring
- Use **ECR** for container image storage
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies, no deletion protection)

### Deployment Requirements (CRITICAL)

1. **Resource Naming**: ALL resources must include environmentSuffix
   - Example: `ecs-cluster-{environmentSuffix}`, `ecs-service-{environmentSuffix}`
   - This ensures unique naming across parallel deployments

2. **Destroyability**: All resources must be fully destroyable
   - FORBIDDEN: RemovalPolicy.RETAIN or DeletionPolicy: Retain
   - FORBIDDEN: deletionProtection: true
   - ECR repositories should allow deletion when empty
   - Load balancers should have deletion protection disabled

3. **Service-Specific Considerations**
   - ECS services may take time to stabilize during deployment
   - Health check grace period prevents premature task termination
   - Circuit breaker enables automatic rollback on deployment failure
   - Task definitions are immutable - optimizations create new revisions

### Constraints

- Use Fargate launch type (no EC2 instances to manage)
- Container images should use standard nginx or httpd for demonstration
- Implement least-privilege IAM roles (no wildcard permissions)
- Enable encryption at rest where applicable
- All logs should have retention periods set (7 days for cost optimization)
- Security groups should follow least-privilege network access
- Circuit breaker should prevent continuous deployment failures

## Success Criteria

- **Functionality**: Complete ECS Fargate deployment with all specified features
- **Performance**: Services start successfully and pass health checks
- **Reliability**: Circuit breaker and auto-scaling work correctly
- **Security**: Least-privilege IAM roles, encryption enabled
- **Monitoring**: Container Insights and CloudWatch alarms functional
- **Resource Naming**: All resources include environmentSuffix
- **Optimization**: Python script successfully reduces resource allocations and calculates savings
- **Cost Savings**: Measurable reduction in resource usage (tasks, CPU/memory, ECR storage)
- **Code Quality**: TypeScript code is well-structured, tested, and documented

## What to deliver

- Complete **Pulumi TypeScript** implementation in lib/
- ECS Fargate cluster with task definitions and services
- Application Load Balancer with target groups
- Auto-scaling policies based on CPU and memory metrics
- CloudWatch Container Insights configuration
- ECR repository with lifecycle policies
- IAM roles and security groups
- CloudWatch alarms for service monitoring
- Python optimization script (lib/optimize.py) that optimizes deployed resources
- Unit tests for all Pulumi components
- Integration tests that verify optimization works
- Documentation and deployment instructions
- Cost savings calculation and reporting
