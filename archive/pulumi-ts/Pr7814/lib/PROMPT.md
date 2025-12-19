# Optimize ECS Fargate Deployment Configuration

Hey team,

We have an existing ECS Fargate deployment that's working but needs some optimization work. The current setup has several configuration issues that are affecting cost, security, and reliability. I need someone to help refactor this deployment to follow AWS best practices.

The infrastructure is currently running but has accumulated technical debt over time. The team has identified several areas that need attention, from resource sizing to security policies and operational concerns like log retention. This is a good opportunity to improve the quality and efficiency of our deployment.

## What we need to build

Refactor an existing ECS Fargate deployment using **Pulumi with TypeScript** to address configuration issues and optimize the infrastructure. The deployment runs a containerized API service behind an Application Load Balancer.

### Core Requirements

1. **ECS Task Definition Optimization**
   - Fix CPU and memory combinations to use proper values (512 CPU units / 1024 MiB memory)
   - Current configuration may be using incompatible or non-optimal combinations
   - Container should reference image using SHA256 digest instead of 'latest' tag for better version control

2. **Application Load Balancer Health Checks**
   - Fix the health check timeout configuration on the ALB target group
   - Current timeout is too short causing false negatives
   - Adjust health check interval, timeout, and threshold values appropriately

3. **IAM and Security**
   - Refactor task role permissions to follow least-privilege principle
   - Remove overly broad permissions
   - Grant only the specific permissions needed for the task's functionality

4. **Cost Management**
   - Implement CloudWatch log retention policies to prevent unlimited log storage costs
   - Add proper tagging strategy for cost allocation across dev and staging environments
   - Tags should include Environment, Owner, Project, and CostCenter keys

5. **ALB Listener Configuration**
   - Optimize ALB listener rules to reduce unnecessary target group attachments
   - Simplify routing configuration where possible

6. **Error Handling**
   - Add proper error handling for Pulumi resource creation failures
   - Include meaningful error messages and resource dependencies

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **AWS ECS Fargate** for container orchestration
- Use **Application Load Balancer** for traffic distribution
- Use **CloudWatch** for logging with retention policies
- Resource names must include **environmentSuffix** for multi-environment support
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain deletion policies)

### Deployment Requirements (CRITICAL)

- **Environment Suffix**: All resource names MUST include environmentSuffix parameter for uniqueness across deployments
- **Destroyability**: All resources must use DELETE removal policy (no RETAIN policies)
- **Resource Naming**: Follow pattern `{service-name}-{resource-type}-{environmentSuffix}`

### Constraints

- Maintain high availability configuration for ECS service
- Preserve existing VPC and networking setup
- Ensure zero downtime during configuration changes
- Follow AWS Well-Architected Framework principles
- Security groups must follow least-privilege network access
- All changes must be auditable through proper tagging

## Success Criteria

- **Task Definition**: Correct CPU/memory combination (512/1024), SHA digest image reference
- **Health Checks**: Appropriate timeout and interval values that eliminate false positives
- **IAM Permissions**: Task role uses least-privilege with specific AWS service permissions
- **Cost Optimization**: CloudWatch logs have 7-day retention, proper cost allocation tags applied
- **ALB Configuration**: Simplified listener rules with optimal target group usage
- **Error Handling**: All Pulumi resources have proper error handling and dependencies
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: TypeScript code with proper typing, well-tested, documented

## What to deliver

- Complete **Pulumi TypeScript** implementation with optimized configuration
- ECS Fargate service with corrected task definition
- Application Load Balancer with fixed health check configuration
- IAM roles with least-privilege permissions
- CloudWatch log groups with retention policies
- Proper resource tagging for cost allocation
- Unit tests covering all components
- Documentation explaining the optimizations made
