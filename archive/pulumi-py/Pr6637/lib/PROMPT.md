Hey team,

We've got a critical refactoring task on our hands for a financial services infrastructure project. The existing Pulumi codebase was built during a rapid proof-of-concept phase and it's now showing its age. Deployment times have ballooned to over 15 minutes, the code is riddled with hardcoded values, and we're missing proper error handling throughout. The engineering leadership wants this cleaned up before we move to production.

The current infrastructure runs in AWS us-east-1 and includes EC2 Auto Scaling Groups, an RDS MySQL database, S3 buckets, and load balancers. The code works, but it's become a maintenance nightmare. Values like AMI IDs and bucket names are scattered throughout the code, there's no centralized configuration management, and when things fail, we get cryptic error messages that don't help anyone debug the issue.

We need to refactor this infrastructure code while maintaining backward compatibility with our existing stack state. This isn't a greenfield project - we need to keep everything running while we improve the codebase underneath.

## What we need to build

Create a refactored infrastructure using **Pulumi with Python** that improves performance, maintainability, and reliability for a financial services application.

### Core Requirements

1. **Configuration Management**
   - Extract all hardcoded values (AMI IDs, instance types, bucket names, database settings) into Pulumi.Config
   - Implement proper validation for all configuration values
   - Support environment-specific configurations
   - Configuration should be type-safe and well-documented

2. **Error Handling**
   - Wrap all boto3 calls in try-except blocks with meaningful error messages
   - Add proper exception handling for AWS resource creation operations
   - Implement graceful failure handling that provides actionable debugging information
   - Log errors appropriately for production monitoring

3. **ComponentResource Architecture**
   - Create a custom ComponentResource class for the web tier
   - The web tier ComponentResource should encapsulate Application Load Balancer, Target Group, and Auto Scaling Group
   - Follow Pulumi best practices for component resource design
   - Ensure proper parent-child relationships for resource organization

4. **Performance Optimization**
   - Implement parallel resource creation to reduce deployment time from 15+ minutes to under 9 minutes
   - Use Pulumi's depends_on sparingly - only where truly necessary
   - Identify and eliminate unnecessary sequential dependencies
   - Optimize resource creation order for maximum parallelism

5. **Type Safety**
   - Add Python type hints to all functions using the typing module
   - Include AWS resource types in function signatures
   - Provide proper return type annotations
   - Ensure IDE support and better code documentation through types

6. **Resource Tagging**
   - Create a centralized tagging function that applies mandatory tags to all resources
   - Required tags: Environment, Owner, CostCenter, Project
   - Apply tags consistently across all AWS resources
   - Support additional custom tags per resource

7. **Stack Outputs**
   - Export ALB DNS name for application access
   - Export RDS endpoint for database connections
   - Export S3 bucket ARNs for cross-stack references
   - Ensure outputs are properly typed and documented

8. **IAM Security**
   - Refactor existing IAM policies to remove all wildcard permissions
   - Implement least-privilege access for all resources
   - Ensure IAM roles and policies follow AWS security best practices
   - Document why each permission is needed

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **VPC** with 3 availability zones (public and private subnets)
- Use **EC2** instances in Auto Scaling Groups for compute
- Use **Application Load Balancer** for traffic distribution
- Use **Target Groups** for ALB routing
- Use **RDS MySQL** for database (encryption at rest enabled)
- Use **S3** buckets with SSE-S3 encryption
- Use **IAM** for access control (least-privilege policies)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{environment-suffix}`
- Deploy to **us-east-1** region
- Python 3.9+ required
- Pulumi 3.x required

### Constraints

- Must maintain backward compatibility with existing Pulumi stack state
- No breaking changes to deployed resources
- All resources must be destroyable (no Retain deletion policies)
- Follow AWS Well-Architected Framework best practices
- Code must be production-ready with comprehensive error handling
- Must achieve at least 40% reduction in deployment time
- All configuration must be externalized (no hardcoded values)

### Success Criteria

- **Configuration**: All hardcoded values replaced with Pulumi.Config
- **Error Handling**: Try-except blocks around all AWS API operations
- **Architecture**: ComponentResource pattern for web tier
- **Performance**: Deployment time reduced to under 9 minutes (40%+ improvement)
- **Type Safety**: Type hints on all function signatures and return values
- **Tagging**: Centralized tagging strategy applied to all resources
- **Outputs**: ALB DNS, RDS endpoint, and S3 ARNs exported as stack outputs
- **Resource Naming**: All resources include environmentSuffix parameter

## What to deliver

- Complete Pulumi Python implementation with improved architecture
- VPC spanning 3 availability zones with public and private subnets
- EC2 Auto Scaling Groups with proper configuration management
- Application Load Balancer and Target Groups
- RDS MySQL database with encryption at rest
- S3 buckets with SSE-S3 encryption
- IAM roles and policies following least-privilege principles
- Custom ComponentResource for web tier
- Centralized configuration using Pulumi.Config
- Comprehensive error handling throughout
- Type hints for all functions
- Centralized tagging function
- Stack outputs for cross-stack integration
- CloudWatch logging where applicable
