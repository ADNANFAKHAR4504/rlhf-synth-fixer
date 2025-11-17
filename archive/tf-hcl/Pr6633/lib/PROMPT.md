Hey team,

We've got a critical refactoring project for our fintech startup's Terraform infrastructure. Over the past 18 months, our codebase has grown organically and we're now dealing with massive code duplication, hardcoded values everywhere, and inefficient module structures. The DevOps team is struggling with deployment times and maintainability. We need to refactor this entire setup while ensuring zero downtime during the transition.

The current situation is pretty messy. We're managing three environments (dev, staging, prod) through completely separate directories with significant code duplication. We've got 47 duplicate security group rules scattered across files, three nearly identical RDS PostgreSQL database definitions, and hardcoded EC2 instance configurations that should have been modules from day one. We're also still using local state files instead of remote state, and we've got 12 redundant provider blocks that are slowing everything down.

This refactoring needs to happen using **Terraform with HCL** for our AWS multi-account setup. We're deploying across us-east-1 and us-west-2 regions, but our primary target for this refactor is ap-southeast-1. The existing infrastructure includes EC2 instances in Auto Scaling Groups behind ALBs, RDS PostgreSQL Multi-AZ deployments, and VPCs with public/private subnet tiers.

## What we need to build

Create a refactored Terraform infrastructure using **Terraform with HCL** that optimizes our existing multi-tier application while maintaining zero downtime and backward compatibility.

### Core Refactoring Requirements

1. **Modularize EC2 Infrastructure**
   - Convert hardcoded EC2 instance configurations into reusable modules
   - Add variable inputs for instance types, AMI IDs, and subnet assignments
   - Support Auto Scaling Groups with configurable parameters
   - Integrate with existing ALB configurations

2. **Consolidate Database Modules**
   - Take our three separate RDS PostgreSQL database definitions and create one parameterized module
   - Support different environments (dev, staging, prod) through variables
   - Maintain Multi-AZ deployment capabilities
   - Preserve existing database names to prevent recreation

3. **Eliminate Security Group Duplication**
   - Replace 47 duplicate security group rules with dynamic blocks
   - Use for_each loops for efficient rule management
   - Maintain existing security posture
   - Support variable-driven rule definitions

4. **Implement Workspace-Based Environment Management**
   - Replace separate folder structure with Terraform workspaces
   - Configure workspace-based environment separation
   - Maintain environment-specific configurations through workspace variables
   - Support dev, staging, and prod environments

5. **Standardize Resource Tagging**
   - Implement merge() functions to combine default and environment-specific tags
   - Include environmentSuffix in all resource names for uniqueness
   - Use consistent naming pattern: `{resource-type}-${var.environment_suffix}`
   - Add standard tags for cost tracking and environment identification

6. **Configure Remote State Management**
   - Set up S3 backend for state storage with encryption at rest
   - Configure DynamoDB table for state locking
   - Enable versioning on state bucket
   - Migrate from local state files without destroying resources

7. **Optimize Provider Configuration**
   - Remove 12 redundant provider blocks
   - Use provider aliases for multi-region support
   - Configure providers for us-east-1, us-west-2, and ap-southeast-1
   - Pin provider versions for reproducibility

8. **Dynamic Resource Discovery**
   - Replace hardcoded VPC and subnet IDs with data sources
   - Implement dynamic lookup for existing network resources
   - Use filters to find resources by tags or names
   - Support multiple regions and accounts

9. **Zero-Downtime Update Strategy**
   - Add lifecycle rules with create_before_destroy
   - Implement proper resource dependencies
   - Configure appropriate timeouts for updates
   - Prevent resource recreation where possible

10. **Secure Output Management**
    - Create outputs that expose only necessary values
    - Use sensitive flags for database passwords and connection strings
    - Export resource IDs for cross-stack references
    - Document output values clearly

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **EC2** with Auto Scaling Groups for compute
- Use **RDS PostgreSQL** Multi-AZ for databases
- Use **ALB** for load balancing
- Use **VPC** with public/private subnets for networking
- Use **Security Groups** with dynamic blocks for access control
- Use **S3** for state backend storage
- Use **DynamoDB** for state locking
- Deploy to **ap-southeast-1** region
- Require Terraform 1.5+ with AWS provider 5.x
- Resource names must include **environmentSuffix** variable for uniqueness
- Follow naming convention: `resource-name-${var.environment_suffix}`

### Constraints

- Must maintain backward compatibility with existing resource names to prevent recreation
- State migration must be performed without any resource destruction or downtime
- Module versions must be pinned to ensure reproducible deployments
- All sensitive values must be managed through Terraform variables, not hardcoded
- Remote state configuration must include encryption at rest and versioning enabled
- Refactored code must pass terraform fmt and terraform validate checks
- Resource dependencies must be explicitly defined to prevent race conditions
- All resources must be destroyable (no Retain policies or deletion protection)
- Include proper error handling and validation
- Use existing AWS Secrets Manager entries for credentials, do not create new secrets

## Success Criteria

- **Code Reduction**: Achieve at least 60% reduction in code duplication
- **Modularity**: All major resource types (EC2, RDS, Security Groups) in reusable modules
- **State Management**: Remote state with locking successfully configured and migrated
- **Environment Management**: Workspace-based separation working for all three environments
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Provider Optimization**: Down to necessary provider blocks with proper aliasing
- **Dynamic Discovery**: No hardcoded resource IDs, all fetched dynamically
- **Zero Downtime**: Lifecycle rules prevent resource recreation
- **Security**: Sensitive outputs properly flagged, encryption at rest enabled
- **Validation**: Code passes terraform fmt, terraform validate, and terraform plan

## What to deliver

- Complete **Terraform HCL** implementation with modular structure
- Reusable modules for EC2 (with Auto Scaling), RDS, and Security Groups
- Backend configuration for S3 and DynamoDB state management
- Provider configuration optimized with aliases for multi-region support
- Data sources for dynamic VPC and subnet discovery
- Variables file supporting all three environments (dev, staging, prod)
- Outputs with appropriate sensitive flags
- Workspace configuration examples
- Documentation covering:
  - State migration procedure
  - Workspace usage
  - Module structure and usage
  - Variable definitions
  - Deployment instructions
- Unit tests validating module behavior
- Integration tests for deployed resources
