# AWS Region Migration Project

We have a critical infrastructure migration for our production application currently running in AWS us-west-1. The application needs to migrate to us-west-2 for business continuity and latency optimization. This migration requires zero data loss, minimal downtime, and preservation of all resource identities, network configurations, and security group rules.

The migration uses Terraform with HCL. AWS resource IDs are region-scoped, preventing simple provider configuration changes. We need proper state migration strategy, careful resource recreation with ID mapping, and a solid cutover plan that minimizes risk.

Preserving logical identity is critical - all resource names, tags, and network topology must remain consistent. Comprehensive documentation is required for the DevOps team to execute this migration, including rollback procedures if anything goes wrong during cutover.

## What we need to build

Create a complete migration toolkit using Terraform with HCL for moving an AWS application from us-west-1 to us-west-2. The infrastructure includes VPC networking that connects to EC2 compute instances, with RDS database connectivity from the EC2 layer, and S3 storage integrated with the application tier.

### Core Requirements

1. **Infrastructure Configuration Files**
   - Complete main.tf with provider configuration for both source and target regions
   - VPC networking connects to public and private subnets across availability zones
   - Security groups control traffic flow between web tier, application tier, and database tier
   - EC2 instances in application tier connect to RDS database in private subnet
   - S3 bucket integrates with EC2 instances for data storage and retrieval
   - Modular structure supporting reusable components
   - All resources must include environmentSuffix variable for unique naming

2. **Variable Management**
   - Define variables.tf with all necessary parameters
   - Include environment_suffix for resource naming uniqueness
   - Region parameters for source us-west-1 and target us-west-2
   - Network configuration variables for CIDR blocks and availability zones
   - Default values where appropriate

3. **State Management**
   - Create backend.tf with S3 backend configuration
   - Use placeholder values for bucket names and state file paths
   - Support for workspace-based organization with separate workspaces per region
   - DynamoDB state locking configuration

4. **Migration Documentation**
   - Generate state-migration.md with step-by-step Terraform CLI commands
   - Include exact commands for workspace creation, selection, and switching
   - Terraform import commands for bringing existing resources under management
   - State verification and validation steps
   - Commands for state file backup and recovery

5. **ID Mapping**
   - Produce id-mapping.csv with sample data showing old-to-new ID translation
   - Headers: resource, address, old_id, new_id, notes
   - Examples for common AWS resources like VPC, subnets, security groups, and instances
   - Demonstrate how region-scoped IDs change during migration

6. **Operational Runbook**
   - Create runbook.md with complete cutover plan
   - Pre-migration checklist and preparation steps
   - Detailed execution timeline with rollback decision points
   - DNS cutover strategy with TTL considerations
   - Validation checks to verify successful migration
   - Rollback procedures for each major step

### Technical Requirements

- All infrastructure defined using Terraform with HCL
- Use AWS provider version 5.x or later
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-west-2 region as target
- Source region: us-west-1
- Support VPC, EC2, RDS, S3, Security Groups, and IAM
- Security groups must use least-privilege rules restricting traffic to only required ports
- RDS instances must be in private subnets with no public IP addresses
- S3 buckets must have encryption enabled and block public access
- No hardcoded values - use variables for all configurable parameters

### Constraints

- Preserve logical identity: keep the same names, tags, and network topology
- Resource IDs are region-scoped and will change - provide mapping strategy
- Zero data loss during state migration
- Preserve all security group rules and network configuration semantics
- Minimize downtime with DNS cutover strategy
- All resources must be destroyable with no DeletionProtection or Retain policies
- Include proper error handling and validation steps
- Terraform state must be migrated safely without corruption

## Success Criteria

- **Functionality**: Complete Terraform configuration that can provision infrastructure in target region
- **State Migration**: Zero-loss migration plan with exact CLI commands
- **Documentation**: Clear runbook that operations team can follow step-by-step
- **ID Mapping**: Comprehensive mapping showing old vs new resource identifiers
- **Naming Convention**: All resources include environmentSuffix parameter
- **Rollback Capability**: Documented procedures to revert if migration fails
- **Validation**: Automated checks to verify migration success
- **Code Quality**: Clean HCL code following Terraform best practices
- **Security**: Least-privilege security groups, private subnets for databases, encrypted storage

## What to deliver

- Complete Terraform with HCL implementation
- main.tf with providers, resources, and module structure showing service connectivity
- variables.tf with all parameters including environment_suffix
- backend.tf for state management with S3 backend
- state-migration.md with exact Terraform CLI commands
- id-mapping.csv sample showing resource ID translation
- runbook.md with cutover plan and rollback procedures
- MODEL_RESPONSE.md documenting implementation approach
