# AWS Region Migration: us-west-1 to us-west-2

## Context

You are performing a critical business application migration from AWS us-west-1 to us-west-2 region using Terraform as the Infrastructure as Code (IaC) platform. This migration involves moving existing infrastructure while maintaining operational continuity and preserving all resource configurations.

## Current Environment

- **Source Region**: us-west-1
- **Target Region**: us-west-2
- **Project Name**: IaC - AWS Nova Model Breaking
- **Infrastructure**: Single Terraform file (`tap_stack.tf`) containing all resources
- **Provider Configuration**: `provider.tf` with S3 backend (do not modify unless provider/backend changes required)

## Critical Requirements

### 1. Resource Preservation
- **Maintain existing resource names and IDs** throughout the migration
- **Preserve VPC IDs, Security Group IDs, and EC2 instance IDs**
- **Keep all resource tags and metadata intact**

### 2. State Management
- **Migrate Terraform state to new environment without data loss**
- **Ensure state file integrity and consistency**
- **Maintain state locking during migration process**

### 3. Network Security
- **All security groups must remain intact**
- **Network configurations must be preserved**
- **VPC peering and routing tables must be maintained**

### 4. Operational Continuity
- **Minimize operational disruption during migration**
- **Ensure zero-downtime migration where possible**
- **Maintain application availability throughout the process**

## Technical Constraints

### Infrastructure Structure
- All infrastructure code exists in single file: `tap_stack.tf`
- Provider configuration in `provider.tf` (S3 backend)
- **Do not modify `provider.tf` unless provider/backend changes are required**

### Current Resources (from tap_stack.tf)
- VPC with CIDR block 10.0.0.0/16
- Public subnets (10.0.1.0/24, 10.0.2.0/24)
- Private subnets (10.0.10.0/24, 10.0.20.0/24)
- RDS MySQL instance
- S3 bucket with test object
- Security groups (web, app, database)
- Data sources for existing resources

### Migration Approach
1. **State Migration**: Use `terraform state mv` commands to update resource locations
2. **Resource Recreation**: Recreate resources in new region while maintaining IDs
3. **Data Migration**: Migrate data from source to target region
4. **Validation**: Ensure all tests pass after migration

## Expected Deliverables

### Required Files
1. **Updated `tap_stack.tf`** - Modified for us-west-2 region
2. **Updated `variables.tf`** - Region-specific variable configurations
3. **Updated `terraform.tfstate`** - Migrated state file
4. **Migration script** - Step-by-step migration commands

### Validation Criteria
- All existing tests must pass
- No resource ID changes
- All security groups intact
- Network connectivity verified
- Application functionality confirmed

## Migration Steps

### Phase 1: Preparation
1. Backup current Terraform state
2. Document all existing resource IDs
3. Prepare target region environment
4. Update region variable in Terraform configuration

### Phase 2: State Migration
1. Initialize Terraform in target region
2. Migrate state using `terraform state mv` commands
3. Verify state file integrity
4. Validate resource mappings

### Phase 3: Resource Migration
1. Apply Terraform configuration in target region
2. Migrate data between regions
3. Update DNS and routing configurations
4. Verify application functionality

### Phase 4: Validation
1. Run all integration tests
2. Verify security group configurations
3. Test network connectivity
4. Confirm application performance

## Success Criteria

- ✅ All resources successfully migrated to us-west-2
- ✅ No changes to resource names or IDs
- ✅ Terraform state properly migrated without data loss
- ✅ All security groups and network configurations intact
- ✅ Zero operational disruption during migration
- ✅ All tests passing in new environment
- ✅ Application fully functional in target region

## Risk Mitigation

- **Rollback Plan**: Maintain ability to revert to us-west-1 if issues arise
- **Monitoring**: Continuous monitoring during migration process
- **Testing**: Comprehensive testing at each migration phase
- **Documentation**: Detailed documentation of all changes and procedures

## Notes

- The `provider.tf` file contains the AWS provider configuration and S3 backend
- This file should only be modified if provider or backend changes are necessary
- All infrastructure modifications should be made in `tap_stack.tf`
- Ensure proper state locking during migration to prevent conflicts
