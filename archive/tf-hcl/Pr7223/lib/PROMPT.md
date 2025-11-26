# Multi-Environment Payment Processing Infrastructure

Hey team,

We need to set up consistent infrastructure for our payment processing system across three environments: development, staging, and production. The finance team has been pushing for this for months because they need identical configurations between environments to avoid compliance issues and deployment surprises. Right now, every time we promote code from dev to prod, we're discovering configuration differences that cause incidents.

The main challenge here is maintaining strict consistency while still allowing necessary variations like instance sizes and database capacity. We're dealing with financial services compliance requirements, so any drift between environments could cause serious audit problems. I've been asked to create this using Terraform with HCL, and we need to use workspaces to manage all three environments from a single configuration.

Each environment needs to be completely isolated in its own AWS account linked through AWS Organizations, and they'll be deployed to different regions - production in us-east-1, staging in us-west-2, and development in eu-west-1. The business wants us to use modules to enforce consistency and validation scripts to catch any drift before it becomes a problem.

## What we need to build

Create a multi-environment infrastructure deployment using **Terraform with HCL** that maintains strict consistency across development, staging, and production environments while allowing controlled environment-specific variations.

### Core Infrastructure Requirements

1. **Network Infrastructure**
   - VPC per environment with 3 availability zones
   - Private and public subnets in each AZ
   - NAT gateways for private subnet internet access
   - Environment-specific CIDR blocks that don't overlap (verified via data sources)

2. **Database Layer**
   - Aurora PostgreSQL 13.7 clusters with encryption at rest
   - Reusable module structure for consistent deployment
   - Environment-specific capacity and instance sizes
   - Database passwords stored in Parameter Store with environment-specific paths

3. **Compute and Application Layer**
   - Lambda functions with Python 3.9 runtime
   - Identical function code across all environments
   - Process data from S3 buckets
   - Application Load Balancers with identical listener rules

4. **Storage**
   - Three S3 buckets per environment using count or for_each
   - Consistent naming patterns with environment prefixes
   - Versioning enabled on all buckets
   - Environment-specific naming conventions

5. **Observability**
   - CloudWatch Log Groups with environment-specific retention
   - Development: 7 days retention
   - Staging: 30 days retention
   - Production: 90 days retention
   - SNS topics for alerts with identical subscription filters

6. **IAM and Security**
   - IAM roles with identical permission boundaries
   - Environment-specific trust policies
   - Consistent security group rules enforced via custom validation module

### Environment Management

- Use **Terraform workspaces** to manage all three environments from single configuration
- Workspace-based variable files: dev.tfvars, staging.tfvars, prod.tfvars
- Locals block mapping environment names to specific instance types and sizes
- Remote state data sources to reference resources between environments

### Region Configuration

- Production: us-east-1
- Staging: us-west-2
- Development: eu-west-1
- Each environment deployed to separate AWS account
- State files in environment-specific backends with DynamoDB table locking

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Terraform version 1.5 or higher
- AWS provider version 5.x
- Use Aurora PostgreSQL for database layer
- Use Lambda for compute processing
- Use S3 for data storage
- Use Application Load Balancer for traffic distribution

### Validation and Consistency

- Create validation script that compares resource configurations between workspaces
- Custom validation module enforcing identical security group rules across environments
- Data sources to verify VPC CIDR blocks don't overlap
- Lambda runtime versions must be identical across all environments

### Resource Tagging

- Include environment name in all resource tags
- Include shared project identifier in all resource tags
- Use for_each loops to create IAM roles with environment-specific name prefixes

### Constraints

- All environments managed from single Terraform configuration using workspaces
- Database passwords must never be in code, only in Parameter Store
- S3 buckets require versioning and environment-specific naming
- Security group rules must be identical across all environments
- Lambda functions must use identical Python 3.9 runtime
- All resources must support clean destroy operations
- No manual configuration allowed - everything must be in Terraform

### Optional Enhancements (if time permits)

- AWS Config rules to monitor configuration drift
- CodePipeline for orchestrating cross-environment deployments
- EventBridge rules for automated environment synchronization

## Deployment Requirements (CRITICAL)

These requirements are mandatory for successful deployment and testing:

1. **Resource Naming with environmentSuffix**
   - All resources MUST include an environmentSuffix parameter for uniqueness
   - Follow naming convention: resource-type-environment-suffix
   - Example: payment-vpc-dev, payment-db-staging, payment-alb-prod
   - This prevents naming conflicts when deploying multiple instances

2. **Destroyability Requirement**
   - All resources MUST be destroyable with no Retain policies
   - Do NOT use lifecycle prevent_destroy = true
   - Do NOT configure deletion protection on databases
   - This is required for automated testing and cleanup

3. **Lambda Runtime Considerations**
   - Use Python 3.9 runtime as specified
   - Ensure Lambda functions have proper IAM execution roles
   - Include CloudWatch Logs permissions for function logging

4. **Database Security**
   - Aurora clusters must use encryption at rest
   - Store database passwords in AWS Systems Manager Parameter Store
   - Never hardcode credentials in Terraform code
   - Use environment-specific parameter paths

5. **State Management**
   - Configure remote state backend with S3
   - Enable DynamoDB state locking
   - Use environment-specific state file paths
   - Never commit terraform.tfstate to version control

## Success Criteria

- Functionality: All three environments deploy successfully with identical infrastructure configurations
- Consistency: Validation scripts confirm no drift in security rules or core configurations
- Isolation: Each environment operates in separate AWS account with no cross-environment dependencies
- Security: Database credentials stored securely in Parameter Store, all Aurora clusters encrypted
- Resource Naming: All resources include environmentSuffix for uniqueness
- Destroyability: All resources can be cleanly destroyed with terraform destroy
- Compliance: Identical configurations meet financial services compliance requirements
- Maintainability: Single Terraform configuration managed via workspaces
- Code Quality: Well-structured HCL, properly modularized, fully documented

## What to deliver

- Complete Terraform HCL implementation with workspace support
- Reusable modules for VPC, Aurora, Lambda, and shared components
- Three workspace variable files: dev.tfvars, staging.tfvars, prod.tfvars
- Custom validation module for security group consistency
- Validation script comparing configurations between workspaces
- Backend configuration for remote state with DynamoDB locking
- IAM roles and policies with environment-specific variations
- Documentation covering workspace usage and deployment process
- Clean destroy support for all resources
