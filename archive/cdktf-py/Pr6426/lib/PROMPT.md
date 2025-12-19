# Multi-Environment Infrastructure Management

CRITICAL REQUIREMENT: This task MUST be implemented using **CDKTF with Python**

Platform: cdktf
Language: python
Region: us-east-1

## Background

A financial services company operates multiple AWS environments across different stages of their software delivery lifecycle. They have development, staging, and production environments deployed across multiple regions to meet regulatory compliance requirements. The company has been experiencing significant issues with infrastructure drift where staging and production environments have diverged from their intended state, causing deployment failures and inconsistent behavior.

The infrastructure team needs a solution that allows them to maintain consistency across all three environments while still enabling environment-specific customizations. Each environment has different scale requirements - development runs on minimal resources for cost optimization, staging mirrors production at a smaller scale for pre-deployment validation, and production requires full high-availability configuration to meet SLA requirements.

## Problem Statement

Create a comprehensive Terraform CDK configuration using **CDKTF with Python** to manage infrastructure consistently across development, staging, and production environments. The solution needs to handle the complexity of multiple environments with different configurations while maintaining a single source of truth for the infrastructure definition.

The system must support environment-specific configurations for database sizing, auto-scaling parameters, storage versioning policies, and security group rules. All of this needs to be managed through a reusable module structure that can be deployed to any environment with appropriate variable files.

## Requirements

### Core Infrastructure Components

1. **Database Layer**
   - Deploy RDS PostgreSQL instances with environment-appropriate sizing
   - Development uses t3.micro for cost optimization
   - Staging uses t3.small for realistic testing
   - Production uses t3.large for performance requirements
   - Enable Multi-AZ deployment only for production instances
   - Configure automated backups and maintenance windows

2. **Compute Layer**
   - Set up Auto Scaling Groups with environment-specific capacity
   - Configure minimum, maximum, and desired capacity based on environment
   - Development: min 1, max 2, desired 1
   - Staging: min 2, max 4, desired 2
   - Production: min 3, max 10, desired 5
   - Implement proper health check mechanisms

3. **Load Balancing**
   - Create Application Load Balancers for each environment
   - Configure target groups pointing to Auto Scaling Group instances
   - Set up health check endpoints and failure thresholds
   - Enable access logs for production environment

4. **Storage Infrastructure**
   - Create S3 buckets with environment-specific naming
   - Enable versioning only for production buckets
   - Configure appropriate lifecycle policies
   - Implement bucket encryption at rest

5. **Network Security**
   - Define security groups with environment-specific CIDR blocks
   - Implement least-privilege access rules
   - Allow traffic only from authorized IP ranges
   - Configure separate security rules for each environment tier

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Implement workspace-based environment separation
- Use remote state management with S3 backend
- Configure DynamoDB table for state locking
- Resource names must include environmentSuffix variable for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region by default
- Support region override through configuration

### Resource Management

- Implement proper tagging strategy with Environment, Project, and ManagedBy tags
- All resources must be tagged for cost allocation and governance
- Use conditional resource creation for environment-specific features
- Infrastructure should be fully destroyable for CI/CD workflows
- Avoid retention policies that prevent resource cleanup

### Module Structure

- Create a reusable module structure that works across all environments
- Define environment-specific .tfvars files for each environment
- Implement variable validation where appropriate
- Use data sources to reference existing VPC infrastructure
- Export important resource ARNs and endpoints as outputs

## Constraints

- Must work with pre-existing VPCs in each region (use data sources to reference)
- Terraform version must be 1.5 or higher
- AWS provider version must be 5.x
- All database passwords must be managed through AWS Secrets Manager
- Production resources require mandatory tags for compliance
- State file must be encrypted at rest
- Multi-AZ configuration only for production to control costs
- All resources must be created within specified VPC CIDR ranges

## Success Criteria

- **Consistency**: Same module code deploys to all three environments
- **Customization**: Environment-specific parameters work correctly
- **Naming**: All resources include environmentSuffix in their names
- **Tagging**: Every resource has required tags (Environment, Project, ManagedBy)
- **State Management**: Remote state works with locking mechanism
- **Outputs**: Key resource identifiers are available after deployment
- **Destroyability**: Infrastructure can be cleanly torn down
- **Multi-AZ**: Only production RDS instances use Multi-AZ deployment
- **Testing**: Unit tests validate module logic and resource creation
- **Documentation**: Clear instructions for deploying to each environment

## Deliverables

- Complete CDKTF Python implementation with stack definition
- Environment-specific variable files (dev.tfvars, staging.tfvars, prod.tfvars)
- Backend configuration for remote state management
- IAM roles and policies with least-privilege access
- Security groups with environment-appropriate rules
- Unit tests covering all stack components
- Integration tests validating multi-environment deployment
- README with deployment instructions and architecture overview
