# ECS Fargate Cost Optimization Project

Hey team,

We've got an ECS Fargate deployment that's been running in production for a few months now, and our AWS bill is higher than it should be. After reviewing the current setup, I found we're over-provisioning resources and missing some critical CloudWatch configurations. The application is working fine, but we're essentially paying for capacity we don't need.

I need your help to refactor and optimize this deployment. We're using **Pulumi with TypeScript** for our infrastructure, and the goal is to reduce costs while maintaining the same level of performance and reliability. The business has asked us to cut infrastructure costs by at least 40% without impacting the application.

## What we need to build

Create an optimized ECS Fargate deployment using **Pulumi with TypeScript** that addresses the current over-provisioning issues while maintaining application performance.

### Core Optimization Requirements

1. **Resource Right-Sizing**
   - Reduce ECS task CPU allocation from 2048 units down to 512 units
   - Reduce memory allocation from 4096 MB down to 1024 MB
   - Ensure application performance remains stable with these changes

2. **ECR Repository Integration**
   - Fix the task definition to properly reference ECR repository URIs using Pulumi outputs
   - Remove hardcoded string references that break when repositories are recreated
   - Use proper resource references for maintainability

3. **CloudWatch Log Management**
   - Add missing CloudWatch log retention policy set to 7 days
   - This will prevent infinite log storage costs that are currently accumulating
   - Configure proper log group cleanup

4. **IAM Security Improvements**
   - Replace the overly permissive IAM task execution role that currently uses AdministratorAccess
   - Implement proper IAM role with minimal required permissions
   - Follow principle of least privilege for ECS task execution

5. **Auto-Scaling Configuration**
   - Configure ECS service auto-scaling with target tracking
   - Set CPU utilization threshold at 70%
   - Allow the service to scale based on actual demand

6. **Health Check Corrections**
   - Fix the broken health check configuration
   - Update from incorrect port 8080 to the correct port 3000
   - Ensure ALB can properly monitor application health

7. **Resource Tagging for Cost Allocation**
   - Add comprehensive resource tagging: Environment, Team, and CostCenter
   - Enable proper cost tracking and allocation across teams
   - Support chargebacks to appropriate business units

8. **Stack Output Configuration**
   - Implement Pulumi stack outputs for the service URL
   - Export task definition ARN for downstream consumers
   - Make critical resource identifiers available to other systems

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **Amazon ECS Fargate** for container orchestration
- Use **Amazon ECR** for container image storage
- Use **CloudWatch Logs** with 7-day retention
- Use **Application Load Balancer** with proper health checks on port 3000
- Use **Application Auto Scaling** for ECS service scaling
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-{environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable with no Retain policies

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: All resource names MUST include an environmentSuffix parameter to ensure uniqueness across multiple deployments. Use the format: `{resource-name}-{environmentSuffix}` (e.g., `ecs-cluster-dev123`, `log-group-dev123`)
- **No Retention Policies**: Do NOT use RemovalPolicy.RETAIN or DeletionProtection. All resources must be fully destroyable
- **Service-Specific Requirements**:
  - IAM roles must follow least privilege principle with only required permissions
  - CloudWatch log groups must have 7-day retention period
  - ECS task definitions must use Pulumi output references, not hardcoded strings
  - Health checks must use port 3000 (not 8080)

### Constraints

- Maintain application performance with reduced resource allocations
- Ensure zero downtime during optimization deployment
- Keep existing VPC and networking configuration unchanged
- Auto-scaling must respond within 5 minutes of threshold breach
- All IAM changes must maintain existing application functionality
- Cost reduction target: minimum 40% savings on ECS-related costs

## Success Criteria

- **Resource Optimization**: ECS tasks running with CPU=512 and memory=1024 MB
- **ECR Integration**: Task definitions use Pulumi output references correctly
- **Log Management**: CloudWatch logs have 7-day retention policy configured
- **IAM Security**: Task execution role has minimal required permissions only
- **Auto-Scaling**: Service scales automatically at 70% CPU utilization
- **Health Checks**: ALB health checks use port 3000 successfully
- **Resource Tagging**: All resources tagged with Environment, Team, CostCenter
- **Stack Outputs**: Service URL and task definition ARN exported correctly
- **Code Quality**: Clean TypeScript code, well-organized, properly documented
- **Deployability**: Infrastructure deploys successfully without manual intervention

## What to deliver

- Complete Pulumi TypeScript implementation in lib/ directory
- ECS Fargate cluster with optimized task definitions
- Application Load Balancer with corrected health checks
- ECR repository with proper output references
- CloudWatch log groups with retention policies
- IAM roles following least privilege
- Application Auto Scaling policies
- Comprehensive resource tagging
- Stack outputs for service URL and task ARN
- Unit tests for all components
- Documentation with deployment instructions
