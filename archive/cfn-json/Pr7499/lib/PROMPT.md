Hey team,

We have a critical requirement from our financial services company. They need to maintain identical database schemas and reference data across their development, staging, and production environments. The challenge is that they need automated synchronization of non-sensitive configuration data while ensuring production data remains completely isolated.

The current situation is that their teams are manually applying schema changes and reference data updates across environments, which is error-prone and time-consuming. They've had incidents where dev and staging environments fell out of sync with production, causing integration test failures. We need to build a robust multi-environment database replication system that automates this synchronization while maintaining strict environment boundaries.

Our infrastructure lead wants this implemented using **CloudFormation with JSON** so it integrates with their existing CloudFormation-based infrastructure pipeline. The system needs to support three completely separate AWS accounts representing dev, staging, and prod environments, all deployed in the us-east-1 region.

## What we need to build

Create a multi-environment database replication infrastructure using **CloudFormation with JSON** that establishes automated synchronization of database schemas and reference data across dev, staging, and production environments while maintaining production data isolation.

### Core Requirements

1. **Aurora MySQL Database Clusters**
   - Deploy RDS Aurora MySQL clusters in three separate VPCs representing dev, staging, and prod environments
   - Use db.r5.large instances minimum for consistent performance
   - Configure automated backups with 7-day retention for all Aurora clusters
   - Enable encryption at rest using AWS KMS with separate keys per environment

2. **Lambda-Based Synchronization**
   - Implement Lambda functions to synchronize schema changes and reference data between environments
   - Lambda functions must complete synchronization within 5-minute timeout
   - Lambda functions must log all synchronization activities to CloudWatch Logs
   - Use Python 3.9 runtime for Lambda functions

3. **S3 Migration Script Storage**
   - Create S3 buckets for storing database migration scripts with versioning enabled
   - S3 buckets must have lifecycle policies to delete migration scripts older than 30 days
   - Enable encryption for all S3 buckets

4. **Cross-Account Access**
   - Configure cross-account assume roles for Lambda to access resources in different environments
   - Cross-account roles must follow least-privilege principle with explicit resource ARNs
   - Database passwords must be generated using Secrets Manager with automatic rotation

5. **VPC Peering Connections**
   - Set up VPC peering connections between environments with appropriate route tables
   - VPC peering connections must restrict traffic to MySQL port 3306 only
   - VPC CIDR blocks: dev (10.1.0.0/16), staging (10.2.0.0/16), prod (10.3.0.0/16)

6. **Monitoring and Alarms**
   - Implement CloudWatch alarms for replication lag exceeding 60 seconds
   - Monitor synchronization Lambda function failures

7. **Secrets and Parameter Management**
   - Use Systems Manager Parameter Store for storing database connection strings
   - Parameter Store values must be encrypted using KMS customer managed keys

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **RDS Aurora MySQL** for database clusters
- Use **Lambda** with Python 3.9 for synchronization functions
- Use **S3** for migration script storage with versioning
- Use **VPC** with private subnets across 2 AZs per environment
- Use **KMS** for encryption with separate keys per environment
- Use **Systems Manager Parameter Store** for database connection strings
- Use **CloudWatch** for monitoring and alarms
- Use **Secrets Manager** for database password management with rotation
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- Template must use Conditions to handle environment-specific configurations

### Optional Enhancements

If time permits, consider adding:
- EventBridge rules to trigger sync on schedule for automated synchronization
- SNS notifications for sync failures to improve incident response
- Step Functions for orchestrating complex multi-step migrations

### Constraints

- Aurora clusters must use db.r5.large instances minimum for consistent performance
- Lambda functions must complete synchronization within 5-minute timeout
- VPC peering connections must restrict traffic to MySQL port 3306 only
- S3 buckets must have lifecycle policies to delete migration scripts older than 30 days
- Parameter Store values must be encrypted using KMS customer managed keys
- Lambda functions must log all synchronization activities to CloudWatch Logs
- Database passwords must be generated using Secrets Manager with automatic rotation
- Cross-account roles must follow least-privilege principle with explicit resource ARNs
- Template must use Conditions to handle environment-specific configurations
- All resources must be destroyable (no Retain policies, no deletion protection)
- Include proper error handling and logging

### Environment Details

Multi-environment AWS deployment across three separate accounts (dev, staging, prod) in us-east-1 region. Each environment requires its own VPC with private subnets across 2 AZs, RDS Aurora MySQL 5.7 compatible clusters, Lambda functions with Python 3.9 runtime, and S3 buckets for migration artifacts. VPC CIDR blocks: dev (10.1.0.0/16), staging (10.2.0.0/16), prod (10.3.0.0/16). Requires AWS CLI configured with cross-account access, CloudFormation StackSets permissions. KMS keys must be created separately in each account before deployment.

## Deployment Requirements (CRITICAL)

### environmentSuffix Requirement
All named resources MUST include the environmentSuffix parameter for uniqueness. This prevents resource conflicts during parallel deployments and testing. Use CloudFormation's !Sub or !Join functions to incorporate the EnvironmentSuffix parameter into resource names.

Example pattern: !Sub 'resource-name-${EnvironmentSuffix}'

### Destroyability Requirement
All resources must be fully destroyable after testing. This means:
- NO RemovalPolicy: Retain on any resources
- NO DeletionProtection: true flags
- RDS clusters must have SkipFinalSnapshot: true
- S3 buckets should allow deletion (this is a synthetic task, not production)

### Service-Specific Warnings

**Secrets Manager**: Use automatic password rotation configuration for RDS credentials. Ensure Lambda rotation function has proper permissions.

**VPC Peering**: Peering connections require acceptance in cross-account scenarios. Document manual acceptance steps in deployment notes.

**Aurora Clusters**: Provisioning can take 15-20 minutes per cluster. Budget adequate timeout for stack creation.

**Cross-Account Roles**: Trust relationships must specify account IDs explicitly. Document the required AWS account IDs for dev, staging, and prod.

## Success Criteria

- Functionality: Three isolated VPCs with Aurora clusters, automated synchronization via Lambda, secure cross-environment access
- Performance: Lambda synchronization completes within 5 minutes, replication lag monitored
- Reliability: CloudWatch alarms detect failures, automatic retries for transient errors
- Security: KMS encryption for data at rest, Secrets Manager for credentials, least-privilege IAM roles
- Resource Naming: All resources include environmentSuffix
- Code Quality: Valid CloudFormation JSON, well-documented, follows AWS best practices

## What to deliver

- Complete CloudFormation JSON template
- RDS Aurora MySQL 5.7 clusters in three VPCs
- Lambda functions for schema and data synchronization
- S3 buckets with versioning and lifecycle policies
- VPC peering connections with security groups
- KMS keys for encryption
- Systems Manager Parameter Store configuration
- CloudWatch alarms for monitoring
- Secrets Manager for database credentials
- Cross-account IAM roles
- Unit tests for all components
- Documentation and deployment instructions
