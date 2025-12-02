Hey team,

We have a fintech startup that needs to maintain identical infrastructure across their development, staging, and production environments. They're growing fast and need to ensure their testing and deployment workflows are rock-solid. The challenge is maintaining strict environment isolation while preventing configuration drift between environments. I've been asked to create this infrastructure using **Terraform with HCL**.

The company currently struggles with inconsistencies between their environments, which has led to production issues when code that worked in staging failed in production due to subtle infrastructure differences. They need a solution that guarantees environment parity while still allowing environment-specific tuning like different instance sizes and backup retention periods.

We're building this across three separate AWS accounts for dev, staging, and production environments, all in the us-east-1 region. Each environment needs its own isolated VPC with non-overlapping CIDR ranges to prevent any accidental cross-environment communication. The infrastructure includes compute resources in Auto Scaling Groups, PostgreSQL databases, storage buckets for application assets, and load balancers for traffic distribution.

## What we need to build

Create a multi-environment infrastructure solution using **Terraform with HCL** for a fintech application that maintains consistency across development, staging, and production environments.

### Core Requirements

1. **Modular Infrastructure Components**
   - Reusable Terraform modules for VPC networking
   - Compute module for EC2 Auto Scaling Groups
   - Database module for RDS PostgreSQL instances
   - Storage module for S3 buckets
   - Each module should be environment-agnostic and configurable

2. **Environment Separation**
   - Implement Terraform workspaces for environment management
   - Separate state files for each environment
   - Workspace-based resource naming and configuration selection
   - Three environments: development, staging, production

3. **Network Infrastructure**
   - VPC with environment-specific CIDR blocks
     - Development: 10.0.0.0/16
     - Staging: 10.1.0.0/16
     - Production: 10.2.0.0/16
   - Public and private subnets across multiple availability zones
   - Internet Gateway and NAT Gateway for connectivity
   - Route tables and security groups with appropriate rules

4. **Compute Resources**
   - EC2 instances managed by Auto Scaling Groups
   - Environment-specific scaling policies
     - Dev: 1-2 instances
     - Staging: 2-4 instances
     - Production: 3-10 instances
   - Application Load Balancer for traffic distribution
   - SSL certificates for staging and production ALBs
   - Health checks and target group configuration

5. **Database Infrastructure**
   - RDS PostgreSQL instances with Multi-AZ for staging and production
   - Environment-specific backup configuration
     - Dev: 1 day retention
     - Staging: 7 days retention
     - Production: 30 days retention
   - Automated backup windows
   - Security groups for database access
   - Parameter groups for PostgreSQL optimization

6. **Storage Resources**
   - S3 buckets for application assets
   - Versioning enabled for production environment only
   - Environment-specific lifecycle policies
   - Bucket policies and access controls
   - Server-side encryption enabled

7. **Configuration Management**
   - Environment-specific variable files
     - dev.tfvars with development configurations
     - staging.tfvars with staging configurations
     - prod.tfvars with production configurations
   - Different instance types per environment
   - Environment-specific feature flags and settings

8. **Tagging and Resource Organization**
   - Consistent tagging strategy across all resources
   - Required tags: Environment, Project, ManagedBy
   - Resource naming with environment prefixes
   - Tags for cost allocation and resource tracking

9. **Outputs and Documentation**
   - Environment-specific endpoints for each workspace
   - Resource identifiers and ARNs
   - Database connection strings
   - Load balancer DNS names
   - S3 bucket names and endpoints

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use VPC for network isolation
- Use EC2 with Auto Scaling Groups for compute
- Use RDS PostgreSQL for database
- Use S3 for object storage
- Use Application Load Balancer for traffic distribution
- Terraform version 1.5 or later
- AWS Provider version 5.x
- Resource names must include environmentSuffix for uniqueness across workspaces
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region
- Backend configuration for remote state management

### Deployment Requirements (CRITICAL)

- All resources must be destroyable with no Retain deletion policies
- Resources must include environmentSuffix variable in names for uniqueness
- Resources must be tagged with Environment for identification
- Cross-account IAM roles must be configured for deployment pipeline
- State files must be isolated per workspace
- Backend must support state locking to prevent concurrent modifications
- All RDS instances must use force_destroy = true for clean teardown
- S3 buckets must have force_destroy = true to allow deletion with objects

### Constraints

- Use Terraform workspaces to manage multiple environments from single configuration
- All environment-specific values must be in separate tfvars files
- Resource naming must include environment prefixes to prevent conflicts
- Production environment must have enhanced backup retention and monitoring
- Network CIDR blocks must not overlap between environments
- No hardcoded values in module code - all configurable via variables
- SSL certificates required for staging and production load balancers
- Database credentials must be stored securely using AWS Secrets Manager
- All resources must support clean destruction without manual intervention

## Success Criteria

- Functionality: Complete infrastructure stack deploys successfully to all three environments using workspace selection
- Consistency: All environments use identical module code with only configuration differences in tfvars files
- Isolation: Each environment has separate VPC with non-overlapping CIDR ranges and separate AWS accounts
- Configurability: Environment-specific settings properly applied from tfvars files
- Resource Naming: All resources include environment prefix and environmentSuffix for uniqueness
- Security: SSL enabled on load balancers for staging and production, database credentials secured
- Backup Strategy: Environment-appropriate backup retention periods configured
- Scalability: Auto Scaling Groups configured with environment-specific min/max capacities
- Code Quality: Modular HCL code, well-structured, fully tested, documented

## What to deliver

- Complete **Terraform with HCL** implementation
- Reusable modules: VPC, compute, database, storage
- Main configuration files: main.tf, variables.tf, outputs.tf, backend.tf
- Environment variable files: dev.tfvars, staging.tfvars, prod.tfvars
- Provider configuration with AWS provider 5.x
- VPC, EC2, RDS, S3, ALB, Auto Scaling Groups
- Unit tests for all modules with 100% coverage
- Integration tests validating workspace-based deployment
- README with deployment instructions for each environment
- Documentation covering workspace management and tfvars usage
