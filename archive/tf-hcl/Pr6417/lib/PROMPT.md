# Infrastructure Refactoring and Optimization

Hey team,

We've got an existing infrastructure codebase that needs some serious refactoring. The current setup has accumulated tech debt over time with hardcoded values scattered everywhere, sequential resource management that causes unnecessary recreation, and inconsistent tagging. I've been asked to create a comprehensive refactoring using **Terraform with HCL** that addresses these issues and brings our infrastructure up to modern best practices.

The business teams have been complaining about environment recreation issues when we modify our resource lists, and our operations team needs better cost tracking and resource management. This refactor will solve those problems while also improving our deployment reliability and making the codebase more maintainable for future changes.

We need to maintain all existing functionality while making these improvements, so this is essentially a lift-and-shift refactor that modernizes our approach without changing what we're actually deploying.

## What we need to build

Create a comprehensive infrastructure refactoring using **Terraform with HCL** that modernizes our existing AWS infrastructure codebase while maintaining all current functionality.

### Core Requirements

1. **Variable Extraction and Validation**
   - Extract all hardcoded values into proper variables with clear descriptions
   - Include instance types, regions, CIDR blocks, and any other hardcoded configuration
   - Add proper validation rules to prevent invalid configurations
   - Ensure all variables have appropriate defaults where sensible

2. **Resource Management Modernization**
   - Replace all count-based sequential resources with for_each loops
   - This prevents resource recreation when list order changes
   - Maintain existing resource naming patterns where possible
   - Ensure smooth migration path from current state

3. **Tagging Strategy Implementation**
   - Create a comprehensive tagging strategy using locals
   - Must include Environment, Project, ManagedBy, and CostCenter tags
   - Apply consistently across all taggable resources
   - Support tag inheritance for dependent resources

4. **Lifecycle Management**
   - Add lifecycle blocks with prevent_destroy = true for RDS instances
   - Implement create_before_destroy for ALB target groups
   - Ensure no accidental data loss during updates
   - Document any resources with special lifecycle requirements

5. **AMI Management**
   - Replace all hardcoded AMI IDs with dynamic data.aws_ami lookups
   - Filter for the latest Amazon Linux 2023 images
   - Ensure consistent AMI selection across environments
   - Add appropriate filters for architecture and virtualization type

6. **EC2 Module Creation**
   - Create a reusable module for EC2 instance provisioning
   - Accept instance configuration as input parameters
   - Include security group management within the module
   - Support both single instances and instance groups

7. **State Management Backend**
   - Configure S3 backend for remote state storage
   - Set up DynamoDB table for state locking
   - Enable encryption at rest for state files
   - Include proper bucket policies and versioning

8. **Output Values**
   - Implement comprehensive output values for all critical resources
   - Include resource IDs, endpoints, and connection strings
   - Structure outputs for easy consumption by other teams
   - Document what each output provides and how to use it

### Technical Requirements

- All infrastructure defined using **Terraform with HCL**
- Use AWS provider for all resource provisioning
- Resource names must include **environmentSuffix** variable for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy all resources to **ap-southeast-1** region
- Support multiple environment deployments without conflicts

### Constraints

- Follow AWS security best practices for all resources
- Implement encryption at rest and in transit where applicable
- Follow principle of least privilege for all IAM roles
- Use AWS Secrets Manager for credential management
- All resources must be fully destroyable for CI/CD workflows
- No DeletionPolicy Retain unless absolutely necessary
- Enable appropriate logging and monitoring for all services
- Maintain backward compatibility with existing resource references

## Success Criteria

- **Functionality**: All existing resources converted without service disruption
- **Maintainability**: Codebase uses variables instead of hardcoded values
- **Reliability**: Resource changes don't trigger unnecessary recreation
- **Security**: All resources follow AWS security best practices
- **Resource Naming**: All resources include environmentSuffix variable
- **Tagging**: Consistent tags applied across all resources
- **State Management**: Remote state with locking properly configured
- **Code Quality**: Clean HCL code, well-tested, fully documented

## What to deliver

- Complete Terraform HCL implementation with proper file structure
- Reusable EC2 module with comprehensive input variables
- variables.tf with all extracted variables and validation
- outputs.tf with all necessary resource outputs
- backend.tf configuration for S3 state with DynamoDB locking
- locals.tf with tagging strategy and common values
- Main infrastructure files for EC2, RDS, ALB resources
- data.tf with AMI lookup configuration
- Unit tests for all components using terraform validate
- Integration tests that verify deployed resources
- README.md with deployment instructions and architecture documentation
