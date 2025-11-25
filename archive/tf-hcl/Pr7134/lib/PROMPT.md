# Multi-Environment Infrastructure Deployment

Hey team,

We need to build a robust multi-environment infrastructure deployment system for a fintech company. They're looking to maintain identical infrastructure patterns across development, staging, and production environments to ensure consistent testing and deployment workflows. I've been asked to create this using **Terraform with HCL**. The business wants to eliminate configuration drift between environments while allowing environment-specific tuning for cost optimization and performance requirements.

The challenge here is that they currently deploy infrastructure manually for each environment, leading to inconsistencies and deployment errors. They need a modular, reusable approach that can scale as they add new services. The solution needs to handle environment isolation properly using Terraform workspaces and provide clear separation through environment-specific variable files.

## What we need to build

Create a modular multi-environment infrastructure system using **Terraform with HCL** for deploying identical infrastructure patterns across three environments (development, staging, production) with environment-specific configurations.

### Core Requirements

1. **Module Architecture**
   - Create reusable Terraform module structure with modules/vpc, modules/database, and modules/compute directories
   - Each module must be self-contained with proper input variables and outputs
   - Modules must support environment-specific parameter overrides

2. **Database Infrastructure**
   - Deploy RDS Aurora PostgreSQL clusters with environment-specific instance sizes
   - Development: db.t3.micro instances
   - Staging: db.t3.small instances
   - Production: db.m5.large instances
   - Implement environment-specific backup retention periods
   - Set skip_final_snapshot = true for destroyability

3. **Serverless Compute**
   - Create Lambda functions with Python 3.11 runtime
   - Environment-variable memory allocation: 128MB (dev), 256MB (staging), 512MB (prod)
   - Configure appropriate timeout and retry settings

4. **NoSQL Storage**
   - Implement DynamoDB tables with on-demand billing for all environments
   - Configure consistent table schema across environments

5. **Network Infrastructure**
   - Implement VPC with 2 public and 2 private subnets per environment
   - Use consistent CIDR patterns: 10.0.0.0/16 (dev), 10.1.0.0/16 (staging), 10.2.0.0/16 (prod)
   - Deploy across 2 availability zones in us-east-1
   - Configure NAT Gateways for private subnet internet access

6. **Environment Isolation**
   - Use Terraform workspaces to manage environment isolation
   - Prefix all resource names with workspace identifier
   - Implement workspace-based state file separation

7. **Configuration Management**
   - Create tfvars files for each environment: dev.tfvars, staging.tfvars, prod.tfvars
   - Define appropriate variable overrides for instance sizes, memory allocations, and retention periods

8. **Remote State Management**
   - Configure S3 remote backend with workspace-based state file separation
   - Implement DynamoDB for state locking
   - Use consistent bucket naming with environment_suffix

9. **Resource Tagging**
   - Implement consistent tagging strategy across all resources using merge() function
   - Include Environment, ManagedBy, Project tags as minimum
   - Allow module-specific tag additions

10. **IAM Security**
    - Set up least-privilege IAM roles for Lambda functions
    - Create environment-specific policies where necessary
    - Follow principle of least privilege for all service roles

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **RDS Aurora PostgreSQL** for database tier
- Use **AWS Lambda** with Python 3.11 runtime for compute
- Use **DynamoDB** with on-demand billing for NoSQL storage
- Use **VPC** with public and private subnet architecture
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-${var.environment_suffix}`
- Deploy to **us-east-1** region
- Terraform version 1.5 or higher
- AWS provider version 5.x

### Deployment Requirements (CRITICAL)

- All resources must be fully destroyable without manual intervention
- RDS clusters: MUST set skip_final_snapshot = true (FORBIDDEN: deletion_protection)
- S3 buckets: MUST set force_destroy = true
- DynamoDB tables: MUST be deletable without retain policies
- NO RemovalPolicy.RETAIN or DeletionPolicy: Retain allowed
- All resource names MUST include environment_suffix parameter for uniqueness
- Backend S3 bucket must support workspace-based state separation

### Constraints

- Multi-environment deployment across us-east-1 region
- Each environment requires isolated VPC with 2 availability zones
- Specific CIDR blocks: 10.0.0.0/16 (dev), 10.1.0.0/16 (staging), 10.2.0.0/16 (prod)
- Environment-specific instance sizing for cost optimization
- State management using S3 backend with DynamoDB locking
- Module-based architecture for code reusability
- All resources must include proper error handling and logging configurations

## Success Criteria

- **Functionality**: Successfully deploy identical infrastructure patterns to all three environments
- **Environment Isolation**: Complete separation using Terraform workspaces with no cross-environment contamination
- **Configuration Management**: Clear tfvars file structure with environment-specific overrides
- **Module Reusability**: Modules can be imported and configured for any environment
- **Resource Naming**: All resources include environmentSuffix and follow consistent naming conventions
- **State Management**: Remote state properly isolated per workspace with locking enabled
- **Destroyability**: All infrastructure can be destroyed cleanly without manual intervention
- **Security**: IAM roles follow least-privilege principles with appropriate policy restrictions
- **Code Quality**: HCL code properly formatted, well-documented, with clear variable definitions

## What to deliver

- Complete **Terraform with HCL** implementation with modular structure
- Root configuration files: main.tf, variables.tf, outputs.tf, backend.tf, provider.tf
- Module directories: modules/vpc, modules/database, modules/compute with complete implementations
- Environment-specific tfvars files: dev.tfvars, staging.tfvars, prod.tfvars
- RDS Aurora PostgreSQL cluster configuration with environment-specific sizing
- Lambda function implementations with Python 3.11 runtime
- DynamoDB table definitions with on-demand billing
- VPC networking with public and private subnets across 2 AZs
- IAM roles and policies for Lambda execution
- S3 backend configuration with DynamoDB state locking
- Comprehensive README.md with deployment instructions and workspace usage
- Documentation covering module usage and environment-specific configurations
