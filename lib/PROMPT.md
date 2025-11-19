# Task: Document Management System Migration to AWS

## Platform and Language Requirements
**MANDATORY CONSTRAINTS - DO NOT DEVIATE:**
- All infrastructure code MUST be written using **CloudFormation with YAML**
- **Platform**: CloudFormation (cfn)
- **Language**: YAML

## Background

Your company is migrating a legacy on-premises document processing system to AWS. The system handles sensitive financial documents requiring strict compliance and audit trails. The migration must be completed with zero downtime and full data integrity preserved.

## Environment

Production environment migration in us-east-1 region spanning 3 availability zones. Requires VPC with public and private subnets, NAT gateways for outbound connectivity. Core services include RDS Aurora MySQL cluster as target database, EFS for shared file storage, DMS replication instance for database migration, DataSync agents for file transfer. AWS Config and CloudWatch for compliance and monitoring. All resources must support encryption with customer-managed KMS keys. Migration staging area in private subnets with controlled access.

## Requirements

Create a CloudFormation template to orchestrate a phased migration of an on-premises document management system to AWS.

### MANDATORY REQUIREMENTS (Must complete):

1. **DMS Replication Instance** (CORE: DMS)
   - Create DMS replication instance with 'dms.r5.large' instance type
   - Deploy in private subnet with appropriate security groups

2. **DataSync Task** (CORE: DataSync)
   - Configure DataSync task for EFS file migration with verification enabled
   - Set up source and destination locations

3. **RDS Aurora MySQL Cluster**
   - Deploy target RDS Aurora MySQL cluster with 2 read replicas
   - Configure across multiple availability zones
   - Enable encryption at rest using customer-managed KMS key

4. **EFS File System**
   - Set up EFS file system with lifecycle policy for IA transition after 30 days
   - Configure mount targets in all availability zones
   - Enable encryption at rest and in transit

5. **DMS Migration Task**
   - Create DMS migration task with full load and CDC for ongoing replication
   - Configure appropriate replication settings

6. **DataSync Locations**
   - Configure DataSync locations for source NFS and target EFS
   - Set up proper IAM roles and policies

7. **CloudWatch Dashboard**
   - Implement CloudWatch dashboard showing migration metrics
   - Display DMS replication lag, DataSync transfer progress

8. **SSM Parameters**
   - Create SSM parameters for database endpoints and migration status
   - Use SecureString type for sensitive values

9. **SNS Topic**
   - Set up SNS topic for migration alerts with email subscription
   - Configure CloudWatch alarms to publish to this topic

10. **Security Groups**
    - Configure all security groups with least privilege access
    - Separate security groups for DMS, RDS, EFS, and DataSync

### OPTIONAL ENHANCEMENTS (If time permits):

- **Lambda Function** (OPTIONAL: Lambda) - Add AWS Lambda function for post-migration validation to automate data integrity checks
- **AWS Backup** (OPTIONAL: Backup) - Implement AWS Backup for automated EFS and RDS backups to ensure data protection
- **CloudTrail** (OPTIONAL: CloudTrail) - Configure AWS CloudTrail for audit logging to provide compliance trail

## Constraints

- Use AWS Database Migration Service (DMS) for continuous data replication
- Implement AWS DataSync for file system migration with validation
- Configure all resources with encryption at rest using AWS KMS
- Use AWS Systems Manager Parameter Store for configuration management
- Deploy resources across exactly 3 availability zones
- Tag all resources with Environment, MigrationPhase, and DataClassification
- Configure AWS Config rules for compliance monitoring
- Set up CloudWatch alarms for migration progress tracking

## Expected Output

A complete CloudFormation template that deploys all migration infrastructure with proper dependencies, enabling a controlled migration from on-premises to AWS with real-time monitoring and rollback capabilities.

## Deliverables

1. CloudFormation YAML template with all required resources
2. Proper parameter definitions for environment configuration
3. Output values for key resource identifiers (RDS endpoint, EFS ID, DMS ARN, etc.)
4. Comprehensive resource tagging strategy
5. IAM roles and policies following least-privilege principle

## Important Notes

- **Environment Suffix**: ALL named resources (S3 buckets, DynamoDB tables, Lambda functions, RDS instances, EFS file systems, etc.) MUST include `!Ref EnvironmentSuffix` or `!Sub 'name-${EnvironmentSuffix}'` in their names to support parallel deployments
- **Destroyability**: Do NOT use `DeletionPolicy: Retain` or `UpdateReplacePolicy: Retain` - all resources must be destroyable for testing
- **Region**: Deploy to us-east-1 region
- **Resource Dependencies**: Use `DependsOn` to ensure proper resource creation order
- **KMS Keys**: Create customer-managed KMS keys for encryption requirements
- **VPC Configuration**: Include VPC, subnets (public and private), NAT gateways, Internet Gateway
- **Security**: Follow AWS security best practices for all resources
