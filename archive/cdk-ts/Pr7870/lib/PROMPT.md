# ECS Fargate Service Optimization

Hey team,

We have an existing ECS Fargate service that's been experiencing some serious issues in production. The service keeps crashing under load, we're seeing unpredictable deployment failures, and honestly, the operational costs are higher than they should be. I need help refactoring this to be production-ready and cost-efficient.

The current setup was thrown together quickly and has a bunch of problems that are causing real pain. Container crashes from improper resource allocation, no auto-scaling when traffic spikes, missing health checks that leave failing containers running, and logs that never expire eating into our CloudWatch budget. The deployment process is also brittle without any safety mechanisms.

I've identified exactly 10 issues that need to be fixed. Some are critical bugs causing downtime, others are operational inefficiencies costing us money every month. The team wants this rebuilt properly using modern best practices while keeping it cost-effective for our use case.

## What we need to build

Create a production-ready ECS Fargate service deployment using **CDK with TypeScript**. This refactors an existing Node.js API service that's currently misconfigured and unreliable.

### Core Requirements - All 10 Must Be Implemented

1. **Fix improper CPU/memory allocation causing container crashes**
   - Current configuration: 256 CPU units, 512 MiB memory
   - This is completely insufficient for a Node.js API and causes OOM kills
   - Implement proper sizing: minimum 512 CPU units (0.5 vCPU) and 1024 MiB (1 GB) memory
   - Use proper Fargate CPU/memory combinations per AWS specifications

2. **Implement auto-scaling based on CPU utilization**
   - Configure Application Auto Scaling for the ECS service
   - Minimum capacity: 1 task
   - Maximum capacity: 5 tasks
   - Scale out when average CPU exceeds 70% for 2 consecutive evaluation periods
   - Scale in when average CPU drops below 30% for 2 consecutive evaluation periods
   - Use step scaling or target tracking policy

3. **Add proper health checks**
   - Configure health checks for the Application Load Balancer target group
   - Interval: 30 seconds
   - Timeout: 5 seconds
   - Healthy threshold: 2 consecutive successes
   - Unhealthy threshold: 3 consecutive failures
   - Health check path: /health (or appropriate endpoint)

4. **Configure CloudWatch Container Insights for monitoring**
   - Enable Container Insights on the ECS cluster
   - This provides detailed metrics for CPU, memory, network, and disk I/O
   - Set containerInsights property to enabled on the cluster

5. **Set up log retention to 7 days instead of indefinite retention**
   - Configure CloudWatch Logs log group with explicit retention policy
   - Set retention period to 7 days (RetentionDays.ONE_WEEK)
   - This prevents unbounded log storage costs

6. **Use Fargate Spot for development environment tasks**
   - Configure ECS capacity providers for the cluster
   - Add FARGATE_SPOT capacity provider with weight 1 for dev workloads
   - Add FARGATE capacity provider with weight 0 as fallback
   - Use capacity provider strategy on the service
   - Note: Determine environment from context or default to spot for cost savings

7. **Fix missing task execution role permissions for ECR access**
   - Create proper IAM task execution role
   - Add managed policy: AmazonECSTaskExecutionRolePolicy
   - This grants permissions to pull images from ECR and write to CloudWatch Logs
   - Task execution role is different from task role

8. **Implement proper tagging strategy for cost allocation**
   - Apply consistent tags to all resources
   - Required tags:
     - Environment: based on environmentSuffix
     - Service: ecs-api or similar service identifier
     - ManagedBy: cdk
     - CostCenter: development (or appropriate value)
   - Use CDK Tags.of() to apply tags at stack level

9. **Add circuit breaker deployment configuration**
   - Enable ECS deployment circuit breaker on the service
   - Set rollback on failure to true
   - This automatically rolls back failed deployments
   - Prevents bad deployments from taking down the entire service

10. **Configure proper networking with service discovery**
    - Create VPC with public and private subnets across 2 availability zones
    - Deploy ECS tasks in private subnets
    - Create Application Load Balancer in public subnets
    - Configure AWS Cloud Map service discovery namespace
    - Register service with Cloud Map for DNS-based service discovery
    - Use private DNS namespace for internal service-to-service communication

### Technical Requirements

- All infrastructure defined using **CDK with TypeScript**
- Target AWS region: us-east-1
- Use **ECS Fargate** launch type (not EC2)
- Use **VPC** construct with proper subnet configuration
- Use **Application Load Balancer** for external access
- Use **CloudWatch Logs** for centralized logging
- Use **Cloud Map** for service discovery
- Use **Application Auto Scaling** for dynamic scaling
- Task execution role must have **ECR pull permissions**
- All resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-{environmentSuffix}
- Set **RemovalPolicy.DESTROY** for all resources to ensure clean teardown

### Deployment Requirements (CRITICAL)

- **Resource Naming**: ALL resources must include environmentSuffix parameter
  - ECS cluster: ecs-cluster-{environmentSuffix}
  - ECS service: api-service-{environmentSuffix}
  - Load balancer: api-alb-{environmentSuffix}
  - Target group: api-targets-{environmentSuffix}
  - Log group: /ecs/api-{environmentSuffix}
  - VPC: api-vpc-{environmentSuffix}
  - Cloud Map namespace: service-discovery-{environmentSuffix}.local

- **Destroyability**: All resources MUST use RemovalPolicy.DESTROY
  - ECS cluster
  - VPC (including subnets, route tables, internet gateway)
  - Load balancer and target groups
  - CloudWatch log groups
  - Cloud Map namespace and service
  - This is MANDATORY - no Retain policies allowed

### Constraints

- Use L2 constructs where available (aws-ecs patterns recommended)
- Container image can reference a placeholder ECR URI or public image for testing
- No hardcoded values for environment or region
- Include comprehensive inline documentation explaining each optimization
- Follow AWS Well-Architected Framework best practices
- Ensure all 10 requirements are addressed in the implementation
- Code must be production-ready with proper error handling

## Success Criteria

- **Functionality**: All 10 optimization requirements fully implemented
- **Resource Sizing**: Proper CPU/memory allocation (512 CPU, 1024 MiB minimum)
- **Auto-Scaling**: Dynamic scaling between 1-5 tasks based on CPU metrics
- **Health Checks**: ALB health checks configured (30s interval, 3 retries)
- **Monitoring**: Container Insights enabled on cluster
- **Log Management**: 7-day retention policy on CloudWatch Logs
- **Cost Optimization**: Fargate Spot configured for dev workloads
- **Security**: Task execution role with proper ECR permissions
- **Operational Excellence**: Tagging strategy and circuit breaker deployments
- **Networking**: VPC, ALB, and Cloud Map service discovery properly configured
- **Resource Naming**: All resources include environmentSuffix
- **Destroyability**: All resources use RemovalPolicy.DESTROY
- **Code Quality**: TypeScript, well-commented, tested, production-grade

## What to deliver

- Complete CDK TypeScript implementation in lib/synth-q9n9u3x6-stack.ts
- All 10 optimizations properly configured:
  - Proper Fargate task definition with 512 CPU / 1024 MiB memory
  - Application Auto Scaling configuration (1-5 tasks, CPU-based)
  - ALB health checks (30s interval, 3 retries)
  - Container Insights enabled
  - CloudWatch Logs with 7-day retention
  - Fargate Spot capacity provider
  - Task execution role with ECR permissions
  - Comprehensive resource tagging
  - Circuit breaker deployment configuration
  - VPC, ALB, and Cloud Map service discovery
- Unit tests validating stack synthesis and resource properties
- Integration tests verifying deployed service functionality
- Inline documentation explaining each optimization and its benefits
- README with deployment instructions and architecture overview
