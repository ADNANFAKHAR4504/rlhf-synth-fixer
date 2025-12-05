# ECS Infrastructure Refactoring Task

Hey team,

We've got an ECS deployment that's hemorrhaging money and has zero visibility into what's happening. The current setup is using massive m5.2xlarge instances for containers that barely need any resources, health checks are timing out, and someone thought it was a good idea to store database passwords as plain text environment variables. We need to fix this mess.

I've been asked to refactor this using **AWS CDK with TypeScript** to address all the issues in one go. The business is tired of the high AWS bills and the operations team can't troubleshoot anything because monitoring was never set up properly.

The current deployment has three separate task definitions that are literally running the same container image with identical configurations. There's no cost allocation tagging, so finance has no idea which team is responsible for what spend. The ALB health checks keep failing because they're pointing at the wrong path. And the CloudWatch logs are set to never expire, so we're paying for years of useless log data.

## What we need to build

Refactor the existing ECS infrastructure using **AWS CDK with TypeScript** to fix all 10 critical issues and optimize resource usage.

### Core Requirements

1. **Right-size ECS Resources**
   - Replace oversized m5.2xlarge instances with properly sized capacity
   - Containers only need 512MB RAM and 0.25 vCPU
   - Switch to Fargate or appropriately sized EC2 instances

2. **Dynamic Capacity Provider**
   - Remove hardcoded capacity provider settings
   - Implement auto-scaling based on actual CPU and memory utilization
   - Scale up/down based on demand patterns

3. **Cost Allocation Tags**
   - Add mandatory tags to all resources: Environment, Team, Application, CostCenter
   - Enable cost tracking and showback reporting
   - Ensure consistent tagging across the stack

4. **Container Insights**
   - Enable CloudWatch Container Insights for ECS cluster
   - Provide visibility into container-level metrics
   - Monitor task CPU, memory, network performance

5. **ALB Health Check Fix**
   - Correct the health check target path
   - Configure appropriate timeout and interval values
   - Ensure health checks pass consistently

6. **Consolidate Task Definitions**
   - Replace three separate task definitions with single reusable construct
   - Use parameters to differentiate when needed
   - Reduce duplication and maintenance overhead

7. **IAM Role Boundaries**
   - Implement permission boundaries for all IAM roles
   - Prevent overly permissive policies
   - Follow least privilege principle

8. **Task Placement Strategy**
   - Configure placement strategy to optimize for memory utilization
   - Replace random placement with binpack strategy
   - Maximize resource efficiency

9. **Log Retention Policy**
   - Fix CloudWatch logs set to never expire
   - Set retention to 14 days for cost optimization
   - Maintain sufficient history for troubleshooting

10. **Secrets Management**
    - Move database credentials from plain text environment variables to AWS Secrets Manager
    - Implement secure secret rotation
    - Use ECS task IAM roles to access secrets

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use Amazon ECS with Fargate or right-sized EC2 capacity
- Application Load Balancer for traffic distribution
- CloudWatch for logging and monitoring with Container Insights enabled
- AWS Secrets Manager for credential storage
- IAM roles with permission boundaries
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region

### AWS Services Required

- Amazon ECS (Elastic Container Service)
- AWS Fargate or EC2 (right-sized instances)
- Application Load Balancer (ALB)
- CloudWatch Logs and Container Insights
- AWS Secrets Manager
- IAM (Identity and Access Management)
- VPC (Virtual Private Cloud)
- EC2 Security Groups

### Constraints

- All 10 issues must be addressed in the implementation
- Maintain application availability during refactoring
- No downtime for the running services
- Cost must be significantly reduced (target: 60% reduction)
- All resources must be destroyable (no Retain policies)
- Security must be improved, not degraded
- Include proper error handling and logging

### Deployment Requirements (CRITICAL)

- Resource names MUST include **environmentSuffix** to prevent conflicts
- Use pattern: `resource-name-${environmentSuffix}` for all named resources
- All resources must be fully destroyable (RemovalPolicy.DESTROY, deletionProtection: false)
- No RemovalPolicy.RETAIN allowed
- ECS tasks must use Secrets Manager, NOT environment variables for sensitive data
- CloudWatch log groups must have explicit retention periods (14 days recommended)
- IAM roles must include permission boundaries

## Success Criteria

- **Cost Optimization**: Infrastructure costs reduced by at least 60%
- **Right-sizing**: Containers running with 512MB RAM and 0.25 vCPU allocation
- **Visibility**: Container Insights enabled and showing metrics
- **Consolidation**: Single reusable task definition construct instead of three separate definitions
- **Security**: Database credentials stored in Secrets Manager with proper IAM access
- **Monitoring**: All resources tagged for cost allocation
- **Health Checks**: ALB health checks passing consistently
- **Placement**: Tasks using binpack strategy for memory optimization
- **Log Management**: CloudWatch logs with 14-day retention
- **IAM Security**: Permission boundaries applied to all roles
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: TypeScript, well-structured CDK constructs, fully tested

## What to deliver

- Complete AWS CDK TypeScript implementation addressing all 10 issues
- ECS cluster with right-sized capacity and Container Insights
- Application Load Balancer with corrected health checks
- Secrets Manager integration for database credentials
- IAM roles with permission boundaries
- Cost allocation tags on all resources
- Dynamic auto-scaling configuration
- CloudWatch logs with proper retention
- Unit tests for all components
- Documentation explaining the refactoring approach
