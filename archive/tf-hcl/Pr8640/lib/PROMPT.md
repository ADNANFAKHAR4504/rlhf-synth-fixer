Hey team,

We have a critical infrastructure modernization task ahead. Our current single-environment setup has served us well, but as the business scales, we need to migrate to a proper multi-environment architecture. The development team needs isolated environments for dev, staging, and production, with proper state management to prevent conflicts and enable parallel development.

I've been tasked with creating this infrastructure using Terraform with HCL. The main challenge is ensuring complete isolation between environments while maintaining consistent configurations and preventing any cross-environment resource conflicts. We need this to support our ECS workloads across all three environments.

The current setup has everything in a single state file with no environment separation, which is causing deployment bottlenecks and risk of production outages during testing. We need to fix this properly with remote state management and proper locking mechanisms.

## What we need to build

Create a multi-environment infrastructure setup using **Terraform with HCL** that provides complete isolation between dev, staging, and production environments with robust state management.

### Core Requirements

1. **Multi-Environment Architecture**
   - Three distinct environments: dev, staging, production
   - Complete resource isolation between environments
   - Consistent configuration patterns across all environments
   - Environment-specific variable management using terraform.tfvars files

2. **Remote State Management**
   - S3 backend for Terraform state storage
   - DynamoDB table for state locking to prevent concurrent modifications
   - State file isolation - each environment must have its own state file
   - Proper backend configuration with encryption at rest

3. **Network Isolation**
   - Separate VPC for each environment
   - Environment-specific CIDR blocks to prevent overlap
   - Proper subnet configuration per environment
   - Network ACLs and routing tables per environment

4. **Security Configuration**
   - Security groups configured per environment
   - IAM roles and policies for each environment
   - Principle of least privilege for all resources
   - Environment-specific access controls

5. **ECS Workload Support**
   - ECS cluster configuration for each environment
   - Task definitions and services per environment
   - Auto-scaling policies per environment
   - Proper IAM roles for ECS tasks and execution

6. **Resource Naming and Tagging**
   - All resource names must include environment identifier
   - Use environmentSuffix pattern for uniqueness
   - Consistent naming convention: resource-type-environment-suffix
   - Tags for environment identification and cost tracking

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **Amazon S3** for state file storage with versioning enabled
- Use **Amazon DynamoDB** for state locking with proper key schema
- Use **Amazon VPC** for network isolation per environment
- Use **Amazon ECS** as the primary compute service
- Use **AWS IAM** for roles and policies
- Use **Security Groups** for traffic control
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable with no Retain policies

### Deployment Requirements (CRITICAL)

- State backend must be configured before any resource creation
- Each environment must use separate state files
- DynamoDB table must have proper LockID attribute
- S3 bucket must have versioning and encryption enabled
- No hardcoded values - use variables for all environment-specific settings
- Support workspace-based or directory-based organization
- Include migration path documentation from single to multi-environment

### Constraints

- All resources must be destroyable - no RemovalPolicy RETAIN or DeletionPolicy Retain
- State files must never be stored in version control
- Backend configuration must be separated from resource definitions
- No resource name collisions between environments
- Cost optimization using serverless where possible
- Proper error handling and validation
- Comprehensive tagging strategy for cost allocation
- Documentation for deployment workflow and CI/CD integration

## Success Criteria

- Functionality: Three isolated environments deploy successfully without conflicts
- State Management: Remote state with locking prevents concurrent modifications
- Network Isolation: VPCs and security groups properly segregate traffic
- Resource Naming: All resources follow environmentSuffix convention
- Security: IAM roles follow least privilege principle
- Deployability: Infrastructure can be deployed and destroyed cleanly
- Code Quality: HCL code is well-structured, modular, and documented
- Validation: Tests verify proper isolation between environments

## What to deliver

- Complete Terraform HCL implementation with modular structure
- backend.tf for S3 and DynamoDB state management
- variables.tf with all environment-specific parameters
- outputs.tf for resource exports
- Environment-specific tfvars files (dev.tfvars, staging.tfvars, production.tfvars)
- Main configuration files for VPC, ECS, IAM, Security Groups
- Directory structure supporting either workspace or directory-based organization
- Unit tests validating environment isolation
- README.md with deployment instructions and migration guide
- Documentation for CI/CD integration patterns
