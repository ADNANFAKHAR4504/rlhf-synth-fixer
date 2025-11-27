# Infrastructure as Code Task: Multi-Environment Database Replication System

## Platform and Language
**IMPORTANT**: This task MUST be implemented using **CloudFormation with JSON**.

## Task Description

Create a CloudFormation template to establish a multi-environment database replication system.

## Background

A financial services company needs to maintain identical database schemas and reference data across development, staging, and production environments. They require automated synchronization of non-sensitive configuration data while ensuring production data remains isolated.

## MANDATORY REQUIREMENTS (Must Complete)

1. **Deploy RDS Aurora MySQL clusters** in three separate VPCs representing dev, staging, and prod environments (CORE: RDS Aurora)
2. **Implement Lambda functions** to synchronize schema changes and reference data between environments (CORE: Lambda)
3. **Create S3 buckets** for storing database migration scripts with versioning enabled (CORE: S3)
4. **Configure cross-account assume roles** for Lambda to access resources in different environments
5. **Set up VPC peering connections** between environments with appropriate route tables
6. **Implement CloudWatch alarms** for replication lag exceeding 60 seconds
7. **Use Parameter Store** for storing database connection strings
8. **Enable encryption at rest** for all databases using AWS KMS with separate keys per environment
9. **Configure automated backups** with 7-day retention for all Aurora clusters

## OPTIONAL ENHANCEMENTS (If Time Permits)

- Add EventBridge rules to trigger sync on schedule (OPTIONAL: EventBridge) - enables automated synchronization
- Implement SNS notifications for sync failures (OPTIONAL: SNS) - improves incident response
- Add Step Functions for orchestrating complex migrations (OPTIONAL: Step Functions) - handles multi-step workflows

## Environment Details

Multi-environment AWS deployment across three separate accounts (dev, staging, prod) in us-east-1 region. Each environment requires its own VPC with private subnets across 2 AZs, RDS Aurora MySQL 5.7 compatible clusters, Lambda functions with Python 3.9 runtime, and S3 buckets for migration artifacts.

**VPC CIDR blocks:**
- dev: 10.1.0.0/16
- staging: 10.2.0.0/16
- prod: 10.3.0.0/16

**Prerequisites:**
- AWS CLI configured with cross-account access
- CloudFormation StackSets permissions
- KMS keys must be created separately in each account before deployment

## Constraints

1. Aurora clusters must use db.r5.large instances minimum for consistent performance
2. Lambda functions must complete synchronization within 5-minute timeout
3. VPC peering connections must restrict traffic to MySQL port 3306 only
4. S3 buckets must have lifecycle policies to delete migration scripts older than 30 days
5. Parameter Store values must be encrypted using KMS customer managed keys
6. Lambda functions must log all synchronization activities to CloudWatch Logs
7. Database passwords must be generated using AWS Secrets Manager with automatic rotation
8. Cross-account roles must follow least-privilege principle with explicit resource ARNs
9. Template must use Conditions to handle environment-specific configurations

## Expected Output

A CloudFormation template that deploys a complete multi-environment database replication infrastructure with automated synchronization capabilities while maintaining strict environment isolation.

## CRITICAL ARCHITECTURAL CONSIDERATIONS

**WARNING: Cross-Account Deployment Limitation**

This task requires deployment across three separate AWS accounts (dev, staging, prod). However, a single CloudFormation template CANNOT directly deploy resources across multiple AWS accounts.

**Resolution Approaches:**

1. **CloudFormation StackSets (Recommended)**: Use StackSets to deploy the same template across multiple accounts
   - Requires StackSets permissions in the master account
   - Requires trust relationships between accounts
   - Deploy networking, Aurora clusters, and account-specific resources per account
   - Use cross-account IAM roles for Lambda to access other accounts

2. **Single-Account Multi-Environment (Simplified)**: Deploy all three environments (dev/staging/prod) in a single AWS account
   - Use separate VPCs with distinct CIDR blocks
   - Simplifies cross-VPC communication (no cross-account complexity)
   - Still maintains environment isolation through VPC separation
   - More appropriate for synthetic training tasks

3. **Separate Templates (Manual)**: Create separate templates for each account
   - Deploy manually to each account
   - Use cross-account IAM roles for inter-environment communication
   - Not a single unified template

**Recommendation for this task**: Implement approach #2 (Single-Account Multi-Environment) to demonstrate the architecture while avoiding CloudFormation's cross-account limitations. Document the cross-account approach in comments as the "production" pattern.

## Infrastructure Code Requirements

### Resource Naming
- **ALL named resources MUST include `environmentSuffix`** parameter
- Example: `!Sub 'aurora-cluster-${EnvironmentSuffix}-${Environment}'`
- This is CRITICAL for avoiding conflicts in CI/CD parallel deployments

### Destroyability
- **NO DeletionPolicy: Retain** - all resources must be cleanly removable
- RDS: Set `DeletionProtection: false` and `SkipFinalSnapshot: true`
- S3: Buckets will be cleaned up after PR review (no special configuration needed)

### Best Practices
- Use KMS encryption for data at rest (Aurora, S3, Parameter Store)
- Implement least-privilege IAM roles
- Enable CloudWatch logging for all Lambda functions
- Use VPC security groups to restrict traffic
- Implement CloudWatch alarms for operational monitoring

### Known Issues to Avoid
1. **AWS Config IAM Role**: Use correct managed policy `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole`
2. **GuardDuty**: This is an account-level service - if required, document manual setup instead of template creation
3. **Lambda Node.js Runtime**: If using Node.js, ensure runtime 18.x+ uses AWS SDK v3 or extract data from event
4. **Aurora Multi-AZ**: Will increase deployment time (20-30 minutes) - acceptable for this complexity level

## Task Validation Requirements

Before considering this task complete, ensure:

1. Template synthesizes without errors
2. All mandatory requirements are implemented
3. Resource names include `environmentSuffix` parameter
4. No deletion protection or retain policies
5. Cross-account architecture is documented (even if implemented as single-account for practical deployment)
6. Logical consistency validated (no same-region "migration" contradictions)

## Difficulty Level

**Expert** - This task involves:
- Multi-environment architecture
- Cross-account IAM roles and trust policies
- Aurora database replication patterns
- Lambda-based data synchronization
- VPC peering and networking
- Multiple AWS services integration (8+ services)
- CloudFormation Conditions for environment-specific logic
