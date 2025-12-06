Hey team,

We've got a situation with our fintech payment processing platform. The business has been running into production issues that weren't caught during staging, and the root cause is configuration drift between our development, staging, and production environments. Basically, we've been maintaining these three environments manually, and things have gotten out of sync over time.

I've been asked to create a proper multi-environment infrastructure using **Terraform with HCL** that keeps everything consistent. The goal is to have identical infrastructure patterns across all three environments, with environment-specific configurations cleanly separated out. This way, what we test in dev and staging will actually reflect what runs in production.

The business wants us to use Terraform workspaces to manage these environments properly. Each environment needs its own isolated infrastructure, but they should all follow the same patterns and configurations. We need to make sure there's no CIDR overlap between the VPCs, and we need proper resource naming that clearly identifies which environment each resource belongs to.

## What we need to build

Create a multi-environment infrastructure using **Terraform with HCL** that deploys consistent infrastructure across development, staging, and production environments for our payment processing platform.

### Core Requirements

1. **Workspace Management**
   - Configure three Terraform workspaces: 'dev', 'staging', and 'prod'
   - Each workspace manages its own isolated infrastructure
   - All workspaces use the same module structure for consistency

2. **Network Infrastructure**
   - Create VPCs with non-overlapping CIDR blocks:
     - Development: 10.0.0.0/16
     - Staging: 10.1.0.0/16
     - Production: 10.2.0.0/16
   - Deploy public and private subnets across 2 availability zones for each environment
   - Configure Internet Gateways and route tables appropriately

3. **Load Balancing**
   - Deploy Application Load Balancer in each environment
   - Configure appropriate security groups for ALB access
   - Set up target groups for application routing
   - Configure health checks for backend services

4. **Compute Infrastructure**
   - Set up Auto Scaling Groups with environment-appropriate instance types:
     - Development: t3.micro instances
     - Staging: t3.small instances
     - Production: t3.medium instances
   - Configure launch templates with proper instance configurations
   - Implement auto-scaling policies based on environment needs

5. **Database Infrastructure**
   - Provision RDS PostgreSQL instances with environment-specific configurations
   - Development: db.t3.micro
   - Staging: db.t3.small
   - Production: db.t3.medium with Multi-AZ enabled
   - Enable deletion protection ONLY for production
   - Set appropriate backup retention periods per environment

6. **Module Structure**
   - Define reusable module structure that can be instantiated for each environment
   - Use local modules to keep code DRY
   - Pass environment-specific values through module inputs

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **VPC** for network isolation
- Use **Application Load Balancer** for traffic distribution
- Use **Auto Scaling Groups** with EC2 instances for compute
- Use **RDS PostgreSQL** for database
- Use **S3** for state storage with workspace-specific paths
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming pattern: {project}-{environment}-{resource-type}
- Deploy to **us-east-1** region
- Configure remote state backend with S3 and DynamoDB locking
- Use separate tfvars files for each environment (dev.tfvars, staging.tfvars, prod.tfvars)

### Deployment Requirements (CRITICAL)

- All resources must include **environmentSuffix** in their names to prevent conflicts across parallel deployments
- Resource naming convention: {resource-type}-{environmentSuffix}
- All resources must be destroyable - no retention policies or deletion protection except for production RDS
- Production RDS must have deletion_protection = true
- Non-production RDS must have deletion_protection = false and skip_final_snapshot = true
- Use conditional logic to enable Multi-AZ and deletion protection only for production
- All database passwords must be passed as variables, never hardcoded

### Constraints

- Use Terraform workspaces for environment separation
- All environment-specific values defined in separate tfvars files
- Each environment must have its own state file with workspace-specific paths in S3
- Use data sources to reference shared resources if needed
- Implement consistent tagging across all resources with Environment, Project, and ManagedBy tags
- VPC CIDR blocks must not overlap between environments
- RDS instances in production must have deletion protection enabled
- Follow Terraform best practices for module design and state management

## Success Criteria

- **Functionality**: Infrastructure deploys successfully across all three workspaces
- **Consistency**: Same resources created in each environment with appropriate sizing
- **Isolation**: No resource conflicts between environments
- **Configuration Management**: Environment-specific values properly separated in tfvars files
- **State Management**: Separate state files per workspace stored in S3
- **Resource Naming**: All resources include environmentSuffix and follow naming pattern
- **Tagging**: Consistent tags applied across all resources
- **Conditional Logic**: Multi-AZ and deletion protection only enabled for production
- **Destroyability**: All resources can be destroyed except production RDS which has protection

## What to deliver

- Complete Terraform HCL implementation with modular structure
- Main configuration files (main.tf, variables.tf, outputs.tf)
- Backend configuration for S3 state storage with DynamoDB locking
- Separate tfvars files for each environment (dev.tfvars, staging.tfvars, prod.tfvars)
- VPC module with subnets, route tables, and security groups
- ALB module with target groups and listeners
- Auto Scaling Group module with launch templates
- RDS module with PostgreSQL configuration
- Locals for consistent tagging using merge functions
- Output values displaying key infrastructure endpoints for each environment
- Documentation explaining workspace usage and deployment process
