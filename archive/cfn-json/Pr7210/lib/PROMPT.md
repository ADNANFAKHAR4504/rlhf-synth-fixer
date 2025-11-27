# Transaction Processing Infrastructure Optimization

Hey team,

We have a production transaction processing system that's been giving us headaches with deployment timeouts and failed stack updates. The current setup is a monolithic CloudFormation template that takes over 30 minutes to deploy and frequently fails during updates with circular dependency errors. The business needs this fixed ASAP because we can't afford these long deployment windows, especially when we're trying to push critical fixes to production.

The infrastructure spans two regions (us-east-1 and eu-west-1) and handles real-time transaction validation for our payment processing system. We're seeing deployment failures when updating Lambda functions that depend on RDS Aurora clusters, and the whole stack has to roll back, which takes another 20+ minutes. This is killing our velocity and creating risk in production deployments.

I've been asked to completely refactor this into a proper nested stack architecture using **CloudFormation with JSON** that can deploy reliably in under 15 minutes with proper rollback capabilities. The solution needs to work consistently across both regions and handle updates gracefully without the circular dependency nightmares we're experiencing now.

## What we need to build

Refactor and optimize our transaction processing infrastructure using **CloudFormation with JSON** to eliminate deployment timeouts and circular dependencies while enabling reliable multi-region deployments.

### Core Requirements

1. **Nested Stack Architecture**
   - Split monolithic template into separate nested stacks
   - Create dedicated stacks for networking, compute, database, and monitoring
   - Each nested stack should be independently updatable
   - Implement proper stack dependencies using DependsOn attributes
   - Stack boundaries must align with AWS service categories

2. **Multi-Region Deployment**
   - Use CloudFormation StackSets for consistent deployment across us-east-1 and eu-west-1
   - Implement cross-region S3 bucket replication for audit logs
   - Configure Route 53 for multi-region failover
   - Ensure parameter consistency across regions

3. **Circular Dependency Resolution**
   - Fix circular dependencies between RDS Aurora clusters and Lambda functions
   - Lambda functions cannot directly reference RDS endpoint in environment variables
   - Use Systems Manager Parameter Store to store RDS endpoints
   - Lambda functions read endpoints from SSM at runtime
   - Proper DependsOn configuration to ensure correct resource creation order

4. **Lambda Container Image Deployment**
   - Convert all Lambda functions from inline code to container images
   - Create ECR repositories in both regions
   - Lambda functions must reference ECR image URIs
   - Include Dockerfile for Lambda container builds
   - Placeholder Python code for transaction validator Lambda

5. **Rollback Triggers and Monitoring**
   - Configure CloudWatch alarms for RDS connection count thresholds
   - Configure CloudWatch alarms for Lambda error rate monitoring
   - Implement automatic rollback triggers on alarm breach
   - Set appropriate alarm thresholds for production workload

6. **Database Schema Migration Custom Resource**
   - Create Lambda-backed custom resource for database migrations
   - Configure 5-minute timeout for migration operations
   - Implement proper error handling and retry logic
   - Custom resource should be idempotent
   - Handle both Create and Update events

7. **Optimized Update Strategy**
   - Use CloudFormation Conditions to skip unchanged resources
   - Implement parameter-driven conditional resource creation
   - Minimize update scope to only changed components

8. **Data Protection and Retention**
   - RDS Aurora: DeletionPolicy set to Snapshot with 30-day retention
   - All other resources: DeletionPolicy set to Delete for clean teardown
   - RDS instances must have DeletionProtection set to false for testing
   - S3 buckets: Enable versioning for audit logs
   - Implement lifecycle policies for S3 cost optimization

9. **Stack Outputs and Cross-Stack References**
   - Export all resource ARNs needed by other stacks
   - VPC and subnet IDs exported from NetworkStack
   - RDS cluster endpoint exported from DatabaseStack
   - Lambda function ARNs exported from ComputeStack
   - Use Export/ImportValue for cross-stack references

10. **Parameter Validation and Security**
    - Define parameters with AllowedValues for environment types
    - **Use AWS Secrets Manager for database passwords** (do not use NoEcho parameters)
    - Implement automatic password generation in Secrets Manager
    - Use CloudFormation dynamic references to retrieve secrets
    - Implement constraint descriptions for all parameters
    - Validate parameter formats using AllowedPatterns where applicable

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **RDS Aurora MySQL** for transaction database with Multi-AZ configuration
- Use **Lambda** functions for transaction validation with container images
- Use **DynamoDB** tables for session management with on-demand capacity
- Use **S3** buckets for audit logs with cross-region replication
- Use **ECR** repositories for Lambda container images
- Use **VPC** with 3 availability zones per region
- Use **Systems Manager Parameter Store** for RDS endpoint storage
- Use **AWS Secrets Manager** for database password storage and automatic generation
- Use **Route 53** for multi-region DNS failover
- Use **CloudWatch** alarms for monitoring and rollback triggers
- Deploy to **us-east-1** (primary) and **eu-west-1** (secondary) regions
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable except RDS snapshots (30-day retention)

### Deployment Requirements (CRITICAL)

- All named resources MUST include ${EnvironmentSuffix} parameter in their names
- Example: "audit-logs-${EnvironmentSuffix}" for S3 buckets
- NO "Retain" DeletionPolicy except for RDS Aurora (must use "Snapshot")
- RDS instances: DeletionProtection must be false to allow test teardown
- Stack updates must complete within 15 minutes
- Use CloudFormation Drift Detection compatible resources only
- Implement proper timeout configurations for custom resources
- All CloudFormation templates must be valid JSON format

### Constraints

- Stack deployment time must not exceed 15 minutes
- Use only CloudFormation Drift Detection compatible resources
- Lambda functions must use container images, not inline code or S3 packages
- **Database credentials must be stored in AWS Secrets Manager** (not passed via Parameters)
- **Use CloudFormation dynamic references** to retrieve secrets (resolves cfn-lint W1011)
- VPC must use private subnets for RDS Aurora clusters
- Security groups must follow least privilege principle
- All resources must support tagging for cost allocation
- CloudFormation StackSets for multi-region consistency
- No hardcoded values - all configuration via Parameters or mappings

## Success Criteria

- **Deployment Time**: Complete stack deployment in under 15 minutes
- **Update Reliability**: Stack updates succeed without circular dependency errors
- **Rollback Capability**: Automatic rollback on CloudWatch alarm breach
- **Multi-Region**: Consistent deployment across us-east-1 and eu-west-1
- **Resource Naming**: All resources include environmentSuffix parameter
- **Data Protection**: RDS snapshots retained for 30 days after deletion
- **Lambda Deployment**: All functions use ECR container images
- **Monitoring**: CloudWatch alarms configured for RDS and Lambda
- **Code Quality**: Valid JSON, well-documented, follows CloudFormation best practices
- **Security**: Database passwords stored in Secrets Manager, not in parameters
- **Linting**: All templates validate successfully with cfn-lint (zero warnings)
- **Testing**: Unit and integration tests validate template structure and deployment outputs

## What to deliver

- Complete CloudFormation JSON nested stack implementation
- Main stack: TapStack.json (root template)
- NetworkStack.json for VPC, subnets, security groups, VPC endpoints
- DatabaseStack.json for RDS Aurora MySQL clusters
- ComputeStack.json for Lambda functions and ECR repositories
- MonitoringStack.json for CloudWatch alarms and rollback triggers
- Lambda function code in lib/lambda/validator.py (placeholder)
- Dockerfile for Lambda container image in lib/lambda/Dockerfile
- Systems Manager Parameter Store resources for RDS endpoint storage
- AWS Secrets Manager secret for database password (automatic generation)
- SecretTargetAttachment for enabling password rotation
- CloudFormation StackSet configuration for multi-region deployment
- Comprehensive parameter definitions with validation
- Stack outputs for all cross-stack references
- Unit tests validating template structure and resource configuration
- Documentation in MODEL_RESPONSE.md showing all generated templates
