# Infrastructure Refactoring and Cost Optimization

Hey team,

We've got a challenging situation with our financial services infrastructure. The current Terraform setup has grown organically over the past couple of years, and now we're dealing with serious performance issues and cost overruns. Our monthly AWS bill has hit over $15,000, and management is asking us to cut that by 40% while maintaining the same functionality. The kicker is that our infrastructure spans dev, staging, and production environments with a ton of duplicated code, and we're still using local state files which is causing collaboration headaches.

CloudWatch metrics are showing we're only averaging 20% CPU utilization on our EC2 instances, so we're clearly over-provisioned. We're currently running 12 m5.xlarge instances when we could probably get away with much smaller instance types. Plus, our state management is a mess with no locking mechanism, which has led to a few scary conflicts when multiple team members try to make changes.

I've been asked to completely refactor this setup using Terraform best practices. We need to move to a proper module structure, implement remote state management with locking, and optimize our resource usage to bring costs down significantly.

## What we need to build

Create a refactored Terraform infrastructure using **Terraform with HCL** for a financial services production environment. This is a complete overhaul of the existing setup to reduce costs while maintaining identical functionality.

### Core Requirements

1. **Modular Structure**
   - Create separate reusable modules for compute, database, and networking components
   - Eliminate code duplication across environments
   - Use module outputs for cross-module references

2. **State Management**
   - Implement S3 backend configuration with encryption
   - Add state locking using DynamoDB table named 'terraform-state-lock'
   - Prevent concurrent modifications that have been causing issues

3. **Compute Optimization**
   - Replace 12 m5.xlarge EC2 instances with t3.large instances
   - Maintain the same 12-instance count
   - Deploy across 3 availability zones in us-east-1

4. **Database Configuration**
   - Configure RDS Aurora MySQL cluster
   - Set deletion protection to disabled (for testing purposes)
   - Configure backup retention of 7 days

5. **IAM and Security**
   - Use aws_iam_policy_document data sources for all IAM policies
   - No inline policies
   - Include explicit deny statements for dangerous actions

6. **Variable Validation**
   - Implement validation for instance_type variable
   - Only allow t3.medium, t3.large, or t3.xlarge
   - Move all variable defaults to terraform.tfvars

7. **Tagging Strategy**
   - Create locals block consolidating common tags
   - Required tags: Environment, ManagedBy, CostCenter, LastModified
   - Use merge() function for consistent resource labeling

8. **Data Sources**
   - Replace hardcoded subnet IDs with data source lookups
   - Filter by Name tags for VPC and subnet references
   - No hardcoded resource IDs

9. **Resource Management**
   - Use for_each instead of count for better resource tracking
   - Implement lifecycle rules to prevent accidental deletion
   - Use depends_on only where implicit dependencies don't exist

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use **EC2** for compute (t3.large instances)
- Use **RDS** Aurora MySQL for database
- Use **S3** for state storage with encryption
- Use **DynamoDB** for state locking (table: terraform-state-lock)
- Use **ALB** for load balancing
- Use **VPC** with existing network (CIDR 10.0.0.0/16)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-name-${var.environment_suffix}`
- Deploy to **us-east-1** region
- Terraform 1.5+ required
- AWS provider 5.x required

### Constraints

- Refactor to eliminate code duplication across dev, staging, production
- Must support remote state with locking to prevent conflicts
- All VPC and subnet references must use data sources
- All IAM policies must use aws_iam_policy_document
- Must use for_each instead of count for all resources
- Implement proper tagging with merge() function
- All resources must be destroyable (no Retain policies)
- Include proper error handling and validation
- Target 40% cost reduction from baseline

### Deployment Requirements (CRITICAL)

- **Resource Naming:** ALL resources MUST include `var.environment_suffix` parameter to ensure unique naming across parallel test deployments
- **Destroyability:** NO deletion protection, NO retention policies - all resources must be cleanable after testing
- **State Locking:** DynamoDB table must be named exactly 'terraform-state-lock'
- **Cost Optimization:** Use t3.large (not m5.xlarge) to achieve 40% cost reduction target

## Success Criteria

- **Functionality:** All existing functionality maintained with new optimized resources
- **Performance:** Infrastructure supports same load with smaller instance types
- **Cost Reduction:** 40% reduction in monthly AWS costs (from $15,000+ baseline)
- **State Management:** S3 backend with DynamoDB locking prevents conflicts
- **Modularity:** Reusable modules eliminate code duplication
- **Security:** IAM policies use policy documents with explicit deny statements
- **Resource Naming:** All resources include environmentSuffix for uniqueness
- **Code Quality:** Well-structured HCL, validated variables, comprehensive tagging
- **Best Practices:** DRY principles, for_each usage, lifecycle rules, proper dependencies

## What to deliver

- Complete Terraform HCL implementation with modular structure
- Backend configuration for S3 state storage with DynamoDB locking
- Modules for compute (EC2, ALB), database (RDS Aurora), and networking (VPC, subnets)
- Data sources for existing VPC and subnet lookups
- IAM policy documents with security best practices
- Variable definitions with validation blocks
- terraform.tfvars with environment-specific defaults
- Locals block with standardized tagging
- Documentation showing how the refactoring achieves 40% cost reduction
