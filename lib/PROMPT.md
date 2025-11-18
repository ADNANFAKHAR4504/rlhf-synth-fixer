Hey team,

We need to build a multi-environment infrastructure deployment system that provisions identical infrastructure across three environments: dev, staging, and prod. The business wants to maintain consistency across all environments while allowing for environment-specific variations like instance sizes and scaling configurations.

Right now we're managing each environment manually, which leads to configuration drift and deployment inconsistencies. We need an automated approach that guarantees the same infrastructure topology across all three environments but with the flexibility to tune parameters per environment. This is for a web application that needs to run in all three environments with proper isolation and consistent behavior.

The infrastructure needs to be defined once and deployed three times with environment-specific parameters. We're dealing with compute, networking, and storage resources that need to be consistent in structure but different in scale. For example, dev might use smaller instances while prod uses larger ones, but the overall architecture should be identical.

## What we need to build

Create a multi-environment infrastructure deployment system using **Terraform with HCL** that provisions identical infrastructure across dev, staging, and prod environments.

### Core Requirements

1. **Multi-Environment Structure**
   - Deploy identical infrastructure topology to dev, staging, and prod environments
   - Use Terraform workspaces or modules to manage environment separation
   - Ensure complete isolation between environments
   - Resources should not interfere across environments

2. **Infrastructure Components**
   - VPC with public and private subnets across multiple availability zones
   - EC2 instances for application hosting with environment-specific sizing
   - RDS database with environment-appropriate instance types
   - S3 buckets for application storage
   - Application Load Balancer for traffic distribution
   - Security groups with proper ingress/egress rules

3. **Environment-Specific Variations**
   - Dev: t3.micro instances, minimal RDS, single AZ where possible
   - Staging: t3.small instances, moderate RDS, multi-AZ for testing
   - Prod: t3.medium or larger instances, production-grade RDS with multi-AZ, full redundancy

4. **Configuration Management**
   - Environment-specific variable files (dev.tfvars, staging.tfvars, prod.tfvars)
   - Centralized variable definitions with environment overrides
   - Clear distinction between shared and environment-specific configurations

5. **Resource Naming and Tagging**
   - All resources must include **environmentSuffix** for uniqueness
   - Follow naming convention: resource-environment-suffix format
   - Consistent tagging strategy: Environment, Project, ManagedBy tags
   - Tags should clearly identify which environment each resource belongs to

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **EC2** for compute resources with Auto Scaling groups
- Use **RDS** (PostgreSQL or MySQL) for database with appropriate backup strategies
- Use **VPC** with proper network segmentation (public/private subnets)
- Use **ALB** for load balancing with health checks
- Use **S3** for object storage with lifecycle policies
- Resource names must include **environmentSuffix** for uniqueness
- Deploy to **us-east-1** region
- All resources must be destroyable (no Retain policies or deletion protection)

### Constraints

- Infrastructure topology must be identical across all three environments
- Only scale/size parameters should differ between environments
- No hardcoded values; use variables for all environment-specific settings
- Proper security group rules: restrict access appropriately per environment
- Enable CloudWatch monitoring for all resources
- Include proper IAM roles and policies for EC2 instances
- Database credentials should be managed securely (use AWS Secrets Manager or Parameter Store)
- All resources must be destroyable for testing purposes

### Deployment Requirements (CRITICAL)

- Resources must be deployable and destroyable multiple times
- No DeletionProtection or Retain policies allowed
- All resources must include environment suffix to avoid naming conflicts
- Use data sources where appropriate instead of hardcoding values
- Support for terraform destroy without errors

## Success Criteria

- **Functionality**: Successfully deploy identical infrastructure to all three environments
- **Consistency**: Infrastructure topology is identical across dev, staging, prod
- **Flexibility**: Environment-specific parameters (instance types, scaling) work correctly
- **Isolation**: Complete separation between environments with no cross-environment dependencies
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Security**: Proper security groups, IAM roles, and network segmentation
- **Destroyability**: terraform destroy completes successfully for all environments
- **Code Quality**: Clean HCL code with proper variable usage and documentation

## What to deliver

- Complete Terraform HCL implementation with module or workspace-based structure
- Variable definitions file (variables.tf) with all configurable parameters
- Environment-specific tfvars files: dev.tfvars, staging.tfvars, prod.tfvars
- Provider configuration (provider.tf) with AWS provider setup
- Main infrastructure code (tap_stack.tf or main.tf) with all resources
- Documentation explaining the multi-environment approach and deployment process
- Clear instructions for deploying to each environment
