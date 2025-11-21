# ECS Fargate Platform Optimization

Hey team,

We've got a situation with our production ECS cluster that needs immediate attention. A financial services client is bleeding about $3,000 monthly due to inefficient resource allocation and poor auto-scaling configuration. Their microservices platform keeps experiencing task failures, and the existing Terraform setup was clearly thrown together without much thought about optimization.

The current state is rough. They're running 12 microservices on ECS Fargate in us-east-1 with an ALB fronting everything. The problem is that resources are massively over-provisioned, the auto-scaling policies are causing flapping, and there's no proper circuit breaker configuration. Tasks are failing during deployments because health checks aren't realistic, and the deregistration delays aren't giving containers enough time to shut down gracefully.

I've been asked to create optimized infrastructure using **Terraform with HCL** that fixes these issues while maintaining production stability. The business wants this running efficiently without breaking existing services.

## What we need to build

Create an optimized ECS Fargate deployment using **Terraform with HCL** that addresses cost overruns and performance issues in a production microservices platform.

### Core Requirements

1. **Optimized ECS Task Definitions**
   - Define right-sized task definitions for three services: api (256 CPU/512 memory), worker (512 CPU/1024 memory), and scheduler (256 CPU/512 memory)
   - Use exact CPU/memory combinations that match Fargate supported configurations
   - All task definitions must have proper IAM roles for execution and task-level permissions

2. **Application Load Balancer Configuration**
   - Configure ALB with optimized health check settings: interval=15s, timeout=10s, healthy_threshold=2
   - Set proper deregistration_delay on target groups: 30 seconds for api service, 60 seconds for worker service
   - Target groups must use appropriate health check paths based on service type

3. **ECS Service Auto Scaling**
   - Implement step scaling policies based on both CPU and memory utilization
   - Auto-scaling policies must have proper cooldown periods to prevent flapping
   - Configure realistic minimum, maximum, and desired counts for each service

4. **Deployment Safety Features**
   - Configure circuit breaker on all ECS services with rollback enabled
   - Use lifecycle ignore_changes for task definition to prevent unnecessary redeployments
   - Ensure rolling update deployment strategy with proper minimum healthy percent

5. **CloudWatch Logging and Monitoring**
   - Implement proper CloudWatch log group retention: 7 days for debug, 30 days for production
   - Configure CloudWatch alarms for critical metrics
   - Set up log groups for each service with appropriate naming

6. **Service Discovery**
   - Use Cloud Map for internal service discovery between microservices
   - Configure proper namespace and service discovery settings

7. **Cost Optimization**
   - Add cost allocation tags including Environment, Service, and CostCenter
   - Optimize resource allocation to reduce the current $3,000/month waste
   - Use appropriate retention periods to control logging costs

### Optional Enhancements

- Container Insights for deeper performance metrics
- X-Ray tracing for request flow analysis
- EventBridge rules for task state changes

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **ECS Fargate** for container orchestration
- Use **Application Load Balancer** for traffic distribution
- Use **ECS Service Auto Scaling** for dynamic capacity management
- Use **CloudWatch** for logging and monitoring
- Use **Cloud Map** for service discovery
- Use **IAM** for security roles and policies
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: ecs-service-name-environment-suffix
- All resources must be fully destroyable (no Retain deletion policies)

### Constraints

- Task definitions must use exact CPU/memory combinations that match Fargate supported configurations
- Auto-scaling policies must have proper cooldown periods to prevent flapping
- All ECS services must use rolling update deployment with circuit breaker enabled
- Container health checks must have realistic timing parameters based on actual startup times
- Target group deregistration delay must be optimized for graceful shutdowns
- CloudWatch log groups must use appropriate retention periods to control costs
- VPC configuration spans 3 availability zones with private subnets for ECS tasks and public subnets for ALB
- Terraform 1.5+ with AWS provider 5.x required
- Include proper error handling and validation
- All resources must support cost allocation tagging

## Success Criteria

- **Functionality**: All three services (api, worker, scheduler) deploy successfully with proper health checks
- **Performance**: Auto-scaling responds appropriately to load without flapping
- **Reliability**: Circuit breakers prevent cascading failures during deployments
- **Security**: Proper IAM roles with least privilege access
- **Cost Optimization**: Resource right-sizing reduces monthly waste by targeting $3,000 savings
- **Resource Naming**: All resources include environmentSuffix for multi-environment support
- **Destroyability**: Complete infrastructure can be destroyed without manual intervention
- **Code Quality**: Well-structured HCL with proper variable definitions and outputs

## Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix parameter
- Format: ecs-service-api-${var.environment_suffix}
- No deletion protection or retain policies on any resources
- Infrastructure must be completely destroyable via terraform destroy
- Use proper variable validation for required inputs
- Include comprehensive outputs for service endpoints and ARNs
- ALB should not enable deletion_protection
- CloudWatch log groups should use appropriate retention (7 or 30 days)
- All IAM roles must include environment_suffix in naming

## What to deliver

- Complete Terraform HCL implementation with modular structure
- ECS Fargate task definitions for api, worker, and scheduler services
- Application Load Balancer with target groups and listeners
- ECS Service Auto Scaling policies with CloudWatch alarms
- CloudWatch log groups with appropriate retention
- Cloud Map service discovery configuration
- IAM roles and policies for ECS tasks
- Variable definitions with validation rules
- Outputs for key resource identifiers
- Unit tests for all Terraform modules
- Documentation for deployment and configuration
