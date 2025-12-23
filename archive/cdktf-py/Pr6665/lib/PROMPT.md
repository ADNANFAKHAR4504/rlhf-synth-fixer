Hey team,

We have a critical infrastructure drift problem across our development, staging, and production environments. Recent incidents have shown significant configuration differences causing deployment failures and security vulnerabilities. Management needs us to implement a unified infrastructure-as-code solution that maintains consistency while allowing controlled environment-specific variations.

I've been asked to build this using **CDKTF with Python** for better programmatic control and type safety. The business wants a reusable multi-environment setup that can provision identical infrastructure patterns across three AWS accounts while maintaining appropriate isolation.

Our microservices platform runs across three separate AWS accounts (dev: 123456789012, staging: 234567890123, prod: 345678901234) in us-east-1 and us-east-2 regions. Each environment needs its own VPC with proper subnet segmentation, RDS PostgreSQL databases, ECS Fargate clusters for containerized workloads, load balancers, and S3 storage. The challenge is ensuring these environments stay consistent while allowing production to have enhanced features like multi-AZ redundancy.

## What we need to build

Create a multi-environment infrastructure solution using **CDKTF with Python** that provisions consistent AWS resources across development, staging, and production environments while allowing controlled variations.

### Core Requirements

1. **Multi-Environment Structure**
   - Root module structure with separate configurations for dev, staging, and prod
   - Shared common modules for reusability across environments
   - Each environment deployed to separate AWS account with cross-account IAM role assumption
   - Separate Terraform state files per environment (no workspaces)

2. **VPC Module**
   - Accept CIDR ranges as variables (10.0.0.0/16 for dev, 10.1.0.0/16 for staging, 10.2.0.0/16 for prod)
   - Create 3 public subnets and 3 private subnets across availability zones
   - Non-overlapping CIDR allocation strategy
   - Standard VPC components: internet gateway, NAT gateways, route tables

3. **RDS Module**
   - PostgreSQL 14 database instances
   - Conditional multi-AZ enablement based on environment type
   - Production: multi-AZ with automated backups enabled
   - Dev and staging: single-AZ for cost optimization
   - Proper subnet groups and security groups

4. **ECS Module**
   - Fargate service deployments for containerized applications
   - Environment-specific task counts based on load requirements
   - Environment-specific CPU and memory allocations
   - Application Load Balancer integration
   - Task definitions with proper IAM roles

5. **Remote State Configuration Module**
   - S3 buckets for Terraform state storage per environment
   - DynamoDB tables for state locking per environment
   - Proper versioning and encryption for state buckets
   - Hierarchical state file organization

6. **Provider Configuration**
   - AWS provider setup with assume_role blocks for cross-account deployment
   - Support for multiple regions (us-east-1 and us-east-2)
   - Proper credentials and role assumption configuration

7. **Naming Module**
   - Consistent resource naming following pattern: {env}-{region}-{service}-{resource}
   - Generate standardized names for all resources
   - Include environmentSuffix parameter for resource uniqueness
   - Support for different resource types and services

8. **Outputs Module**
   - Write critical infrastructure IDs to SSM Parameter Store
   - Hierarchical parameter paths: /{env}/vpc/id, /{env}/rds/endpoint, etc.
   - Enable cross-stack references between infrastructure components
   - Export VPC ID, subnet IDs, RDS endpoints, ECS cluster names, ALB ARNs

9. **Environment Configuration**
   - Separate configuration files for each environment with clear variable separation
   - Common values shared across environments
   - Environment-specific overrides for instance sizes, backup policies, high availability
   - Version locking for module consistency

10. **Data Sources**
    - Reference existing Route53 hosted zones for DNS management
    - Reference existing ACM certificates for SSL/TLS
    - Lookup availability zones dynamically

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use AWS provider version 5.x
- Requires Terraform 1.5+ compatibility
- Deploy to us-east-1 region by default with us-east-2 support
- Use S3 for remote state storage with DynamoDB for locking
- Use SSM Parameter Store for exporting outputs
- Use VPC for network isolation
- Use RDS PostgreSQL 14 for database layer
- Use ECS Fargate for container orchestration
- Use Application Load Balancers for traffic distribution
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: {env}-{region}-{service}-{resource}

### Deployment Requirements (CRITICAL)

- All resources must be destroyable without retention policies
- RemovalPolicy must be DESTROY (not RETAIN or SNAPSHOT)
- No DeletionProtection enabled on any resources
- RDS instances must allow deletion without final snapshots for dev/staging
- S3 buckets must allow force deletion
- Resource naming must include environmentSuffix parameter
- All module outputs must be exported to SSM Parameter Store

### Constraints

- Environment-specific variables loaded from separate configuration without hardcoding
- All environments must use identical module versions
- Resource naming must strictly follow: {env}-{region}-{service}-{resource}
- Shared CIDR allocation strategy with non-overlapping ranges
- Production requires multi-AZ RDS with automated backups
- Dev and staging use single-AZ RDS for cost savings
- Separate AWS accounts per environment with cross-account IAM roles
- Module outputs exported to SSM Parameter Store for cross-stack references
- Terraform workspaces are prohibited
- Separate state files required per environment
- State files stored in environment-specific S3 buckets with DynamoDB locking
- All resources must support clean destruction for testing

## Success Criteria

- Functionality: Complete infrastructure provisioning across three environments with proper isolation
- Consistency: Identical infrastructure patterns enforced across all environments
- Flexibility: Controlled variations for environment-specific requirements like HA settings
- Performance: RDS read replicas in production, right-sized compute resources per environment
- Reliability: Multi-AZ configuration for production, automated backups, state locking
- Security: Cross-account role assumption, VPC isolation, security groups, encrypted state
- Resource Naming: All resources follow {env}-{region}-{service}-{resource} pattern with environmentSuffix
- Destroyability: All resources can be cleanly destroyed without retention
- Code Quality: Python, modular design, well-tested, comprehensive documentation
- State Management: Separate state files per environment with S3 backend and DynamoDB locking

## What to deliver

- Complete CDKTF Python implementation with modular structure
- VPC module with configurable CIDR ranges and subnet creation
- RDS module with conditional multi-AZ support
- ECS module with Fargate service deployments
- Remote state configuration module with S3 and DynamoDB
- Naming module for consistent resource naming
- Outputs module with SSM Parameter Store integration
- Provider configuration with cross-account role assumption
- Environment-specific configuration management
- Data source references for Route53 and ACM
- Unit tests for all components
- Documentation covering deployment process and module usage
- README with setup instructions and architecture overview
