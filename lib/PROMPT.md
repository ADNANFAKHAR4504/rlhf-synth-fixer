# ECS Fargate Optimization Project

Hey team,

We've got an existing ECS Fargate deployment that's running fine but costing more than it should. The current setup has some oversized task definitions and we're not getting the most out of autoscaling. I need to refactor this to be more cost-effective while maintaining reliability.

Looking at the CloudWatch metrics, we're only hitting about 30% average utilization on our tasks, which means we're overpaying for resources we don't need. The current configuration also has some inefficiencies around deployment speed and monitoring that we should address while we're at it.

I've been asked to create this optimization using **Pulumi with TypeScript**. The goal is to right-size everything, add proper autoscaling, and implement better monitoring without breaking what's already working.

## What we need to build

Create an optimized ECS Fargate deployment using **Pulumi with TypeScript** that demonstrates infrastructure optimization best practices.

### Core Requirements

1. **Right-Sized ECS Task Definitions**
   - Analyze current usage showing 30% average utilization
   - Configure appropriate CPU/memory combinations based on actual metrics
   - Replace oversized baseline configurations with optimized values

2. **Target Tracking Autoscaling**
   - Implement autoscaling based on ALB request count metrics
   - Configure appropriate scaling thresholds and policies
   - Set minimum and maximum task counts

3. **Dynamic ECR Repository References**
   - Replace any hardcoded container image references
   - Use dynamic ECR repository lookups
   - Enable flexible image management

4. **Resource Tagging Strategy**
   - Add comprehensive tags for cost tracking
   - Tag resources for both development and production environments
   - Include owner, project, and environment tags

5. **Health Check Configuration**
   - Implement proper health check intervals
   - Set appropriate timeout and threshold values
   - Configure health checks for ALB target groups

6. **CloudWatch Container Insights**
   - Enable Container Insights for enhanced monitoring
   - Configure log retention periods appropriately
   - Avoid excessive log retention to control costs

7. **ALB Configuration Optimization**
   - Reduce target group deregistration delay from 300s to 30s
   - Speed up deployment cycles
   - Maintain connection draining safety

8. **IAM Least-Privilege Permissions**
   - Create task execution role with minimal required permissions
   - Create task role following least-privilege principles
   - Separate concerns between execution and runtime permissions

9. **ECS Service Circuit Breaker**
   - Configure circuit breaker to prevent failed deployment loops
   - Enable rollback on deployment failures
   - Protect production stability

10. **Stack Outputs**
    - Export service endpoints for easy access
    - Export CloudWatch dashboard URLs
    - Export ALB DNS name and other key resources

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Amazon ECS** with Fargate launch type
- Use **Application Load Balancer** for traffic distribution
- Use **Amazon ECR** for container image storage
- Use **CloudWatch** for metrics, logs, and Container Insights
- Use **IAM** roles and policies for security
- Use **Auto Scaling** for dynamic task management
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region

### Deployment Requirements (CRITICAL)

- All resources must be destroyable (no Retain policies)
- Use RemovalPolicy.DESTROY or equivalent for all resources
- FORBIDDEN: RemovalPolicy.RETAIN on any resource
- All resource names must include environmentSuffix parameter
- Infrastructure must support clean teardown for testing

### Constraints

- Follow AWS Well-Architected Framework best practices
- Implement security best practices (encryption at rest and in transit)
- Use cost-optimized configurations where appropriate
- Ensure high availability across multiple availability zones
- All resources must support dynamic environment provisioning
- Include proper error handling and logging
- Must be production-ready and maintainable

## Success Criteria

- **Functionality**: ECS service deploys successfully with optimized task definitions
- **Performance**: Autoscaling responds appropriately to load changes
- **Reliability**: Circuit breaker prevents failed deployment loops
- **Security**: IAM roles follow least-privilege principles
- **Monitoring**: Container Insights enabled with appropriate log retention
- **Cost Optimization**: Right-sized resources with faster deployments (30s deregistration)
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Code Quality**: TypeScript, well-tested, comprehensive inline documentation

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- ECS cluster with Fargate launch type
- Optimized task definitions with right-sized CPU/memory
- Application Load Balancer with optimized target group settings
- ECR repository with dynamic references
- Auto Scaling policies based on request count
- CloudWatch Container Insights configuration
- IAM roles with least-privilege permissions
- Service circuit breaker configuration
- Comprehensive resource tagging
- Stack outputs for endpoints and dashboards
- Unit tests for all infrastructure components
- Clear documentation and deployment instructions
