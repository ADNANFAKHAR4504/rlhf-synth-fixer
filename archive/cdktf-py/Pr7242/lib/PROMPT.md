Hey team,

We need to build infrastructure automation to migrate our payment processing system from development to production. This is a critical migration for our fintech company - we've been running and validating the dev environment for 6 months, and now we need to replicate everything in production with enhanced security and monitoring to meet compliance requirements.

The development environment is running smoothly with a complete payment infrastructure stack including Lambda functions for payment processing, RDS Aurora PostgreSQL for transaction storage, DynamoDB for session management, and S3 for audit logs. We need to automate the migration to production while ensuring we don't miss any configurations and maintain the ability to rollback if needed.

The business is particularly concerned about getting this right. They want automated validation reports comparing dev and production configurations, blue-green deployment capability for zero-downtime updates, and comprehensive monitoring with CloudWatch dashboards and alarms. We also need to handle the parameter migration carefully - copying non-sensitive parameters from /dev/* to /prod/* paths without exposing secrets.

## What we need to build

Create an infrastructure automation system using **CDKTF with Python** to migrate payment processing infrastructure from development to production environment in us-east-1.

### Core Requirements

1. **VPC Configuration**
   - Import existing development VPC configuration from vpc-0a1b2c3d4e5f
   - Create production VPC with identical CIDR blocks but different tags
   - Use 3 availability zones with private subnets for compute resources
   - Include VPC endpoints for S3 and DynamoDB to avoid internet gateway charges

2. **Database Replication**
   - Replicate RDS Aurora PostgreSQL cluster from development snapshot
   - Enable Multi-AZ deployment with automated failover
   - Use encrypted storage with customer-managed KMS keys
   - Set backup retention period to minimum (1 day) for faster provisioning
   - Configure skip_final_snapshot for destroyability

3. **Session Management**
   - Create DynamoDB tables for session management
   - Replicate schema from development including global secondary indexes
   - Enable point-in-time recovery
   - Configure appropriate read/write capacity or on-demand billing

4. **Lambda Deployment**
   - Deploy Lambda functions from existing development packages
   - Configure production-specific environment variables
   - Set reserved concurrent executions to prevent throttling
   - Use Python 3.9+ runtime (ensure compatibility with AWS SDK)

5. **Audit Logging with Cross-Region Replication**
   - Create S3 buckets for audit logging
   - Enable versioning on all buckets
   - Configure cross-region replication to us-west-2
   - Implement lifecycle policies for 90-day transition to Glacier
   - Enable SSE-S3 encryption

6. **Monitoring and Dashboards**
   - Set up CloudWatch dashboards replicating development metrics
   - Configure production-specific thresholds
   - Create alarms for RDS CPU usage over 80%
   - Create alarms for Lambda error rates over 1%
   - Include SNS topics for alarm notifications

7. **Parameter Migration**
   - Create script or Lambda to copy non-sensitive parameters from /dev/* to /prod/* paths in Systems Manager Parameter Store
   - Validate parameter values during migration
   - Exclude sensitive parameters that need manual migration

8. **Blue-Green Deployment**
   - Implement Application Load Balancer with target group switching capability
   - Configure health checks for target groups
   - Enable connection draining for graceful failover
   - Set up security groups for ALB and compute resources

9. **Validation and Comparison**
   - Generate migration validation report comparing dev and production
   - Compare resource configurations, tags, security settings
   - Verify all required resources are created
   - Document any differences or missing components

10. **IAM and Security**
    - Follow least-privilege principle for all IAM roles
    - No wildcard actions in IAM policies
    - All roles must have specific resource ARNs where possible
    - Use KMS customer-managed keys for encryption

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **RDS Aurora PostgreSQL** for database
- Use **DynamoDB** with global secondary indexes
- Use **Lambda** functions with reserved concurrency
- Use **S3** with cross-region replication
- Use **CloudWatch** for dashboards and alarms
- Use **Application Load Balancer** for blue-green deployment
- Use **Systems Manager Parameter Store** for parameter migration
- Use **KMS** for encryption keys
- Use **VPC Endpoints** for S3 and DynamoDB
- Deploy to **us-east-1** region (primary) and **us-west-2** (S3 replication)
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-{environmentSuffix}
- Include proper error handling and retry logic

### Deployment Requirements (CRITICAL)

- ALL resource names MUST include environmentSuffix variable
- NO deletion_protection or prevent_destroy policies
- NO RemovalPolicy.RETAIN on any resources
- RDS instances must use skip_final_snapshot for destroyability
- S3 buckets must be empty-able and destroyable
- All resources must be tagged with Environment='production' and CostCenter='payments'
- GuardDuty should NOT be created (account-level service, one detector per account)
- If using AWS Config, use correct IAM managed policy: service-role/AWS_ConfigRole

### Constraints

- All production resources must be tagged with Environment='production' and CostCenter='payments'
- RDS instances must use encrypted storage with customer-managed KMS keys
- Lambda functions must have reserved concurrent executions set to prevent throttling
- DynamoDB tables must have point-in-time recovery enabled
- All IAM roles must follow least-privilege principle with no wildcard actions
- S3 buckets must have versioning enabled and lifecycle policies for 90-day transition to Glacier
- VPC endpoints must be used for S3 and DynamoDB to avoid internet gateway charges
- Prefer serverless options (Aurora Serverless v2) for cost optimization
- Avoid creating NAT Gateways when VPC endpoints can be used instead

## Success Criteria

- **Functionality**: Complete migration automation from dev to production
- **Data Integrity**: Database replicated correctly from snapshot with all schemas
- **High Availability**: Multi-AZ deployment with automated failover capability
- **Security**: Encryption at rest, least-privilege IAM, KMS-managed keys
- **Monitoring**: CloudWatch dashboards with alarms for CPU and error rates
- **Blue-Green**: ALB configured for target group switching
- **Validation**: Automated report comparing dev vs production configurations
- **Destroyability**: All resources can be destroyed without manual intervention
- **Resource Naming**: All resources include environmentSuffix
- **Cost Optimization**: Use of serverless and VPC endpoints where possible
- **Code Quality**: Well-structured Python code with proper error handling

## What to deliver

- Complete CDKTF Python implementation with modular stack design
- VPC configuration with import of existing dev VPC
- RDS Aurora PostgreSQL cluster creation from snapshot
- DynamoDB tables with global secondary indexes
- Lambda functions with production configuration
- S3 buckets with cross-region replication to us-west-2
- CloudWatch dashboards and alarms
- ALB configuration for blue-green deployment
- Parameter migration logic for SSM Parameter Store
- Validation script comparing dev and production
- KMS keys for encryption
- IAM roles following least-privilege
- VPC endpoints for S3 and DynamoDB
- Comprehensive documentation with deployment instructions
- Unit tests for all infrastructure components
