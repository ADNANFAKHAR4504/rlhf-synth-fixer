Hey team,

We're planning a major migration of our legacy on-premises application to AWS. This is a complex, multi-phase project where we need to carefully manage resources across both legacy and cloud environments during the transition. I've been asked to create the infrastructure code in HCL using Terraform.

The business is particularly concerned about data loss and downtime, so we need to use Terraform workspaces to manage both environments simultaneously, import existing AWS resources we've already created manually, and set up proper state management with locking. We also need to configure DataSync for moving our file data from on-premises NFS to S3 without disruption.

This migration needs to support blue-green deployment patterns with a load balancer, and we have strict requirements to prevent anyone from accidentally destroying critical infrastructure during the transition. Everything needs to be modular and well-tagged so different teams can understand which resources belong to which phase of the migration.

## What we need to build

Create a modular Terraform configuration using **Terraform with HCL** to manage our legacy application migration to AWS across multiple environments.

### Core Requirements

1. **Workspace Management**
   - Define separate workspaces for 'legacy' and 'cloud' environments
   - Allow switching between environments without code duplication
   - Workspace-specific configuration and resource naming

2. **Import Existing Resources**
   - Import 3 existing AWS resources into Terraform state
   - Security Group: sg-0123456789abcdef
   - S3 Bucket: legacy-app-data-bucket
   - IAM Role: LegacyAppRole
   - Ensure proper state management after import

3. **State Backend Configuration**
   - Configure S3 backend for remote state storage
   - Enable DynamoDB state locking to prevent concurrent modifications
   - Support workspace-based state isolation

4. **Compute Infrastructure**
   - Deploy EC2 instances (t3.large) across 2 availability zones
   - Use for_each to create instances in multiple AZs
   - Attach 100GB gp3 EBS volumes to each instance
   - Support both legacy and cloud workspace deployments

5. **Data Migration Setup**
   - Configure AWS DataSync for migrating data from on-premises NFS to S3
   - Support continuous data synchronization during migration
   - Handle NFS source and S3 destination configuration

6. **Lifecycle Protection**
   - Apply prevent_destroy = true on critical resources
   - Prevent accidental deletion of production data
   - Protect state storage and imported resources

7. **Load Balancing**
   - Configure Application Load Balancer for high availability
   - Create target groups for blue-green deployment support
   - Register EC2 instances with appropriate target groups
   - Support health checks and traffic routing

8. **Outputs and Integration**
   - Export ALB DNS name for application access
   - Export S3 bucket ARN for reference by other systems
   - Output key resource identifiers for integration

9. **Resource Tagging**
   - Tag all resources with Environment (legacy/cloud) based on workspace
   - Tag all resources with MigrationPhase to track transition status
   - Consistent tagging for cost allocation and management

10. **Data Sources**
    - Use data sources to reference existing VPC (vpc-0a1b2c3d4e5f)
    - Use data sources to reference existing subnets (subnet-1a2b3c4d, subnet-5e6f7g8h)
    - No hardcoded IDs in resource definitions

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **EC2** for compute instances (t3.large)
- Use **EBS** for instance storage (100GB gp3 volumes)
- Use **ALB** (Application Load Balancer) for traffic distribution
- Use **DataSync** for file migration from on-premises to cloud
- Use **S3** for state backend and data storage
- Use **DynamoDB** for state locking
- Use **IAM** for roles and policies
- Use **VPC** resources (reference via data sources)
- Optionally use **RDS** if database migration is needed
- Use **Route53** for DNS management if required
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region
- Terraform version 1.5 or higher
- AWS provider version 5.x

### Constraints

- Must use Terraform workspaces for environment management
- Must import specified existing resources (Security Group, S3 bucket, IAM role)
- Must configure remote state backend with locking enabled
- Must implement data migration using AWS DataSync
- Must configure lifecycle rules to prevent resource deletion on critical resources
- Must use count or for_each for multi-AZ resource creation
- All resources must be tagged with Environment and MigrationPhase tags
- Must use data sources to reference existing VPC and subnets (no hardcoded IDs)
- All resources must be destroyable after testing (except where prevent_destroy is explicitly required)
- Include proper error handling and validation
- No hardcoded credentials or sensitive data

## Success Criteria

- **Functionality**: Successfully manage resources across both legacy and cloud workspaces
- **State Management**: Remote state with locking prevents concurrent modifications
- **Import Success**: All 3 existing resources properly imported into Terraform state
- **Data Migration**: DataSync configured for NFS to S3 migration
- **High Availability**: EC2 instances deployed across 2 AZs with load balancing
- **Protection**: Critical resources protected by prevent_destroy lifecycle rules
- **Deployment Pattern**: ALB and target groups support blue-green deployments
- **Resource Discovery**: VPC and subnets referenced via data sources, not hardcoded
- **Tagging**: All resources tagged with Environment and MigrationPhase
- **Outputs**: ALB DNS and S3 ARN exported for external integration
- **Resource Naming**: All resources include environmentSuffix for uniqueness
- **Code Quality**: HCL, modular structure, well-documented

## What to deliver

- Complete Terraform HCL implementation with modular structure
- Backend configuration file for S3 state storage with DynamoDB locking
- Workspace configuration for legacy and cloud environments
- Import configuration for existing Security Group, S3 bucket, and IAM role
- EC2 instance configuration with EBS volumes across multiple AZs
- DataSync configuration for NFS to S3 migration
- Application Load Balancer with target groups
- Data source definitions for VPC and subnet references
- Lifecycle rules with prevent_destroy on critical resources
- Output definitions for ALB DNS name and S3 bucket ARN
- Tagging configuration for Environment and MigrationPhase
- Variables file with environment_suffix parameter
- Documentation for workspace usage and resource import process