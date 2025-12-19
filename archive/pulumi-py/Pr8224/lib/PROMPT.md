# Multi-Environment Infrastructure Consistency

Hey team,

We've got a critical situation on our hands. Our data processing application runs across three different AWS accounts - dev, staging, and prod - and the infrastructure has drifted significantly between them. We're seeing deployment failures and inconsistent behavior because the environments aren't aligned anymore. Management wants this fixed immediately, and we need to ensure all environments have identical configurations while still maintaining environment-specific parameters.

The core problem is that we need a reliable way to deploy and maintain consistent infrastructure across all three environments. Each environment has its own AWS account and region (dev in us-east-2, staging in us-west-1, prod in us-east-1), but the infrastructure components should be identical in structure. We're dealing with S3 buckets for data storage, Lambda functions for processing, DynamoDB tables for metadata, SNS topics for notifications, and SQS queues for task management.

This isn't just about creating infrastructure - it's about creating a repeatable pattern that guarantees consistency across environments while allowing for environment-specific tuning like memory sizes and notification endpoints. The application deployment pipelines depend on these resource ARNs and endpoints, so everything needs to be properly exported.

## What we need to build

Create a multi-environment infrastructure management solution using **Pulumi with Python** that deploys consistent infrastructure across dev, staging, and production environments.

### Core Requirements

1. **Base Infrastructure Class**
   - Define a reusable infrastructure class encapsulating all components
   - Include S3 buckets, Lambda functions, DynamoDB tables, SNS topics, and SQS queues
   - Support environment-specific configuration through Pulumi config files

2. **S3 Bucket Configuration**
   - Enable versioning on all buckets
   - Configure server-side encryption
   - Implement 30-day lifecycle policies for non-current versions
   - Resource names must include environmentSuffix for uniqueness

3. **Lambda Function Deployment**
   - Use Python 3.9 runtime consistently across all environments
   - Configure 512MB memory for dev and staging environments
   - Configure 1GB memory for production environment
   - Pass environment variables from Pulumi configuration
   - Deploy functions with proper IAM roles

4. **DynamoDB Table Provisioning**
   - Use on-demand billing mode
   - Create global secondary index on timestamp attribute
   - Enable point-in-time recovery
   - Ensure identical table structure across environments

5. **SNS and SQS Configuration**
   - Set up SNS topics with environment-specific email subscriptions from config
   - Configure SQS queues with 14-day message retention
   - Implement dead letter queues after 3 retries
   - Maintain same retention policies across environments

6. **IAM Role Management**
   - Create IAM roles with least privilege policies
   - Scope policies to environment-specific resource ARNs using Pulumi interpolation
   - Support Lambda execution with appropriate permissions

7. **Configuration Validation**
   - Implement validation function to compare configurations across stacks
   - Ensure consistency of infrastructure components
   - Verify environment-specific parameters are properly applied

8. **Resource Exports**
   - Export critical resource ARNs for application deployment
   - Export endpoints for integration with deployment pipelines
   - Use Pulumi stack outputs for cross-stack references

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Use **S3** for data storage buckets
- Use **Lambda** for data processing functions
- Use **DynamoDB** for metadata storage with GSI
- Use **SNS** for notification topics
- Use **SQS** for task queue management
- Use **IAM** for role and policy management
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Primary deployment to **us-east-1** region (with multi-region support)
- Use Pulumi configuration files for environment-specific values

### Constraints

- All S3 buckets must have versioning enabled and lifecycle policies
- Lambda functions must use identical runtime version (Python 3.9) across environments
- DynamoDB tables must have identical indexes and capacity settings
- SNS topics and SQS queues must maintain same retention policies
- IAM roles must follow least privilege with environment-specific resource ARNs
- Use Pulumi stack references to share outputs between environments
- All resources must be destroyable (no RemovalPolicy.RETAIN or deletion protection)
- Include proper error handling and logging
- No resources should use RETAIN deletion policies

### Deployment Requirements (CRITICAL)

- All resource names MUST include environmentSuffix parameter
- Resources must be fully destroyable without manual intervention
- No RemovalPolicy.RETAIN or deletionProtection: true allowed
- Use DeletionPolicy: Delete or RemovalPolicy.DESTROY for all resources
- Follow Pulumi Python best practices for resource naming

## Success Criteria

- Functionality: Identical infrastructure deployed across all three environments
- Configuration: Environment-specific parameters properly applied from Pulumi config
- Consistency: Validation confirms infrastructure parity across environments
- Security: IAM roles follow least privilege with environment-scoped ARNs
- Reliability: All resources include proper error handling and monitoring hooks
- Resource Naming: All resources include environmentSuffix in their names
- Code Quality: Well-structured Python code with proper type hints and documentation
- Destroyability: All resources can be cleanly destroyed without leaving orphaned resources

## What to deliver

- Complete Pulumi Python implementation in lib/tap_stack.py
- S3 buckets with versioning, encryption, and lifecycle policies
- Lambda functions with Python 3.9 runtime and environment-specific memory
- DynamoDB tables with GSI and point-in-time recovery
- SNS topics with email subscription configuration
- SQS queues with dead letter queue setup
- IAM roles with least privilege policies
- Configuration validation logic
- Comprehensive unit tests for all components
- Documentation with deployment instructions and configuration examples
