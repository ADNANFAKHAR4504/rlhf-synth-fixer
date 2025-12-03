# Transaction Processing Infrastructure Optimization

Hey team,

We need to address a critical production issue with our CloudFormation-based transaction processing system. A financial services company deployed their infrastructure using CloudFormation, but they're experiencing deployment timeouts, template update failures, and significant resource drift. Current deployments take over 45 minutes and frequently timeout during updates, causing major production deployment delays that are impacting their business operations.

The core problem is a monolithic template that tries to manage all resources in one massive stack. The complexity leads to timeout issues, makes troubleshooting nearly impossible, and creates circular dependencies between resources. We need to redesign this architecture using CloudFormation nested stacks, optimize deployment patterns, and implement proper rollback mechanisms.

## What we need to build

Create a transaction processing infrastructure using **CloudFormation with JSON** that optimizes an existing monolithic deployment by splitting it into modular nested stacks, implementing proper dependency management, and ensuring deployments complete in under 15 minutes.

### Core Requirements

1. **Nested Stack Architecture**
   - Split monolithic template into separate nested stacks with clear separation of concerns
   - Network stack for VPC, subnets, security groups, and VPC endpoints
   - Database stack for RDS Aurora MySQL clusters with proper configuration
   - Compute stack for Lambda functions using container images
   - Storage stack for DynamoDB tables and S3 buckets
   - Each nested stack must have clear inputs and outputs for cross-stack references

2. **Multi-Region Deployment with StackSets**
   - Implement CloudFormation StackSets for consistent deployments across us-east-1 and eu-west-1
   - Configure StackSet execution with proper IAM roles and permissions
   - Enable automatic deployment to multiple regions
   - Ensure configuration consistency across regions

3. **Circular Dependency Resolution**
   - Fix circular dependencies between RDS Aurora and Lambda functions
   - Use proper DependsOn logic to establish correct resource creation order
   - Implement CloudFormation conditions to handle optional dependencies
   - Ensure Lambda functions can reference Aurora endpoints without creating cycles

4. **Container-Based Lambda Deployment**
   - Convert all Lambda deployment packages to container images stored in ECR
   - Create ECR repositories with lifecycle policies for image management
   - Configure Lambda functions to use container images for faster updates
   - Include sample Lambda container with transaction validation logic

5. **Rollback Triggers and Monitoring**
   - Add CloudFormation rollback triggers monitoring RDS connection count
   - Monitor Lambda error rates with CloudWatch alarms as rollback triggers
   - Set appropriate thresholds for automatic rollback on failures
   - Implement CloudWatch alarms for key infrastructure metrics

6. **Custom Resources for Schema Migration**
   - Implement custom resources with Lambda backend for database schema migrations
   - Configure 5-minute timeouts for migration operations
   - Include proper error handling and logging
   - Ensure idempotent migration logic

7. **Conditional Resource Updates**
   - Use CloudFormation conditions to skip unchanged resources during updates
   - Implement parameter-driven conditions for optional resources
   - Reduce update time by only modifying changed components
   - Document condition patterns for future maintenance

8. **Deletion Policies for Data Retention**
   - Configure deletion policies to retain RDS snapshots for 30 days
   - Apply retention policies to Aurora clusters and instances
   - Ensure S3 audit log buckets are protected but destroyable for testing
   - Balance data protection with infrastructure destroyability for synthetic task requirements

9. **Comprehensive CloudFormation Outputs**
   - Add outputs for all resource ARNs needed by other stacks
   - Export VPC IDs, subnet IDs, security group IDs from network stack
   - Export Aurora endpoints, database names from database stack
   - Export Lambda function ARNs, DynamoDB table names, S3 bucket names
   - Use CloudFormation exports for cross-stack references

10. **Parameter Validation**
    - Implement parameter validation using AllowedValues constraints
    - Add constraint descriptions for all parameters
    - Validate environment suffix format, region names, instance types
    - Provide clear parameter descriptions and default values

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON** format
- Use **RDS Aurora MySQL** for transaction database with proper sizing
- Use **Lambda** functions with container images for transaction validation
- Use **DynamoDB** for session management with on-demand capacity
- Use **S3** for audit log storage with versioning enabled
- Use **ECR** for Lambda container image storage
- Use **Systems Manager Parameter Store** for sensitive configuration values
- Use **CloudWatch** for monitoring, alarms, and rollback triggers
- Use **VPC** with 3 availability zones per region for high availability
- Configure private subnets for databases and VPC endpoints for AWS services
- Deploy to **us-east-1** and **eu-west-1** regions using StackSets
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-${EnvironmentSuffix}`
- All resources must be destroyable (no permanent Retain policies, but 30-day RDS snapshot retention allowed)
- Include proper error handling and logging throughout

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: ALL named resources MUST include the EnvironmentSuffix parameter to ensure uniqueness across parallel deployments. Use CloudFormation Sub intrinsic function: `!Sub 'resource-name-${EnvironmentSuffix}'`
- **Destroyability**: All resources must be destroyable for synthetic task requirements. RDS snapshots can be retained for 30 days (use DeletionPolicy: Snapshot on Aurora clusters), but avoid permanent Retain policies
- **No GuardDuty Detectors**: Do NOT create GuardDuty detectors in CloudFormation. GuardDuty is account-level, only one detector per account/region allowed
- **AWS Config IAM Policy**: If using AWS Config, the correct managed policy is `service-role/AWS_ConfigRole`, not `AWS_ConfigRole` or `ConfigRole`
- **Lambda Container Images**: All Lambda functions MUST use ECR container images, not zip file deployments. This is a critical requirement for fast updates
- **Parameter Store for Secrets**: All sensitive values (database passwords, API keys) must be stored in Systems Manager Parameter Store as SecureString type
- **Stack Update Time**: Target deployment time is under 15 minutes. Use Aurora Serverless v2 if possible to reduce provisioning time
- **Rollback Triggers Required**: Every nested stack should have appropriate rollback triggers to fail fast on deployment issues

### Constraints

- Must use JSON format for all CloudFormation templates
- Stack updates must complete within 15 minutes (design for speed)
- Use CloudFormation StackSets for multi-region deployments
- Implement proper DependsOn attributes to prevent circular dependencies
- All Lambda functions must use container images stored in ECR
- RDS snapshots retained for 30 days after stack deletion (DeletionPolicy: Snapshot)
- Use only CloudFormation Drift Detection compatible resources
- Implement rollback triggers for failed deployments
- Parameter Store must be used for all sensitive configuration values
- Custom resources must have proper timeout (5 minutes) and error handling
- Include proper IAM roles with least privilege permissions
- Enable encryption at rest for RDS, DynamoDB, and S3
- Configure VPC endpoints to avoid NAT Gateway costs
- All Lambda functions should use Node.js 18.x or Python 3.11 runtimes

## Success Criteria

- **Functionality**: Nested stack architecture deploys successfully with all AWS services operational
- **Performance**: Stack deployment time reduced from 45+ minutes to under 15 minutes
- **Reliability**: No circular dependencies between resources, proper rollback triggers catch failures early
- **Security**: All sensitive values in Parameter Store, encryption enabled, IAM least privilege
- **Multi-Region**: StackSets deploy infrastructure consistently to both us-east-1 and eu-west-1
- **Resource Naming**: All resources include environmentSuffix for uniqueness across deployments
- **Code Quality**: JSON formatted CloudFormation templates, well-tested with unit and integration tests, comprehensive documentation
- **Destroyability**: All resources can be destroyed (with 30-day RDS snapshot retention)
- **Lambda Container Images**: All Lambda functions use ECR container images for fast updates
- **Monitoring**: CloudWatch alarms and rollback triggers properly configured

## What to deliver

- Complete CloudFormation nested stack implementation in JSON format
- Main TapStack.json orchestrating all nested stacks
- network-stack.json with VPC, subnets, security groups, VPC endpoints
- database-stack.json with RDS Aurora MySQL configuration
- compute-stack.json with Lambda functions using ECR container images
- storage-stack.json with DynamoDB tables and S3 buckets
- Sample Lambda container code for transaction validation
- CloudFormation StackSet configuration for multi-region deployment
- Custom resource Lambda for database schema migration
- Systems Manager Parameter Store parameters for sensitive values
- CloudWatch alarms and rollback triggers
- Unit tests for all nested stack templates
- Integration tests that validate complete deployment
- Comprehensive documentation and deployment instructions in lib/README.md
