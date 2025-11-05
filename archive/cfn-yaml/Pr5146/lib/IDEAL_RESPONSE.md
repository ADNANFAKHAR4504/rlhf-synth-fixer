# IDEAL RESPONSE - HIPAA-Compliant Event Processing Pipeline

The ideal response for this task should implement a complete, production-ready HIPAA-compliant event processing pipeline using CloudFormation with YAML. The infrastructure must demonstrate mastery of healthcare data security, real-time processing architecture, and AWS best practices.

## Expected Implementation Quality

### Platform and Language (CRITICAL)
- Must use CloudFormation with YAML exclusively
- No CDK, Terraform, Pulumi, or other platforms
- Pure CloudFormation syntax with !Ref, !Sub, !GetAtt intrinsic functions
- Proper YAML formatting and structure

### Required AWS Services (ALL 6 Must Be Present)
1. **Kinesis Data Streams** - For real-time vital signs ingestion
   - Appropriate shard count for 1000 events/sec
   - KMS encryption enabled
   - Proper retention period

2. **ECS Fargate Cluster** - For containerized data processing
   - Task definitions with proper resource allocation
   - IAM roles with least-privilege access
   - CloudWatch Logs integration
   - Multi-task deployment

3. **RDS Aurora Cluster** - For processed data storage
   - PostgreSQL engine with encryption enabled
   - Multi-AZ deployment (2+ instances)
   - Secrets Manager integration
   - CloudWatch Logs export enabled
   - No DeletionProtection

4. **ElastiCache Redis Cluster** - For temporary caching
   - Replication group with Multi-AZ
   - Encryption at rest and in transit
   - Automatic failover enabled

5. **AWS Secrets Manager** - For credential management
   - KMS encryption
   - Database credentials stored securely
   - Proper IAM access policies

6. **API Gateway** - For external system integration
   - REST API with proper authentication
   - CloudWatch Logs enabled
   - Secure endpoints

### Security and HIPAA Compliance Requirements
- Customer-managed KMS keys for all encryption
- All data encrypted at rest and in transit
- Least-privilege IAM roles and policies
- Security groups with minimal required access
- Private subnets for database and cache
- CloudWatch Logs for audit trails
- No public access to sensitive resources

### Network Architecture
- VPC with public and private subnets
- Multi-AZ deployment (2 availability zones minimum)
- Internet Gateway for public subnet connectivity
- Proper route tables and associations
- Security groups for each service tier

### Resource Naming Convention
- All resources must include EnvironmentSuffix parameter
- Consistent naming pattern: resource-type-${EnvironmentSuffix}
- Enables parallel deployments without conflicts
- Minimum 80% of resources should use environmentSuffix

### Destroyability Requirements
- No DeletionPolicy: Retain on any resources
- RDS: DeletionProtection disabled
- RDS: BackupRetentionPeriod set to minimum (1 day)
- All resources cleanly removable via stack deletion

### CloudFormation Best Practices
- Parameters for configurable values (VPC CIDRs, DB credentials, etc.)
- Comprehensive Outputs for integration points
- Proper DependsOn for resource ordering
- CloudFormation intrinsic functions (!Ref, !Sub, !GetAtt, !Select)
- Resource tagging with Name tags using EnvironmentSuffix
- Comments for major sections

### Expected Outputs
- VPC ID
- Kinesis Stream Name and ARN
- ECS Cluster Name and ARN
- Aurora Cluster Endpoint and Port
- Redis Endpoint and Port
- Secrets Manager Secret ARN
- API Gateway Endpoint URL
- KMS Key ID

## Training Quality Considerations

This task should score 8-9/10 for training quality because it:
- Requires multi-service integration (6 AWS services)
- Demonstrates HIPAA compliance patterns
- Implements comprehensive security (encryption, IAM, network isolation)
- Shows real-world architecture (event processing pipeline)
- Requires proper resource orchestration and dependencies
- Tests knowledge of CloudFormation advanced features

## Common Mistakes to Avoid
- Using CDK, Terraform, or Pulumi instead of CloudFormation
- Missing any of the 6 required AWS services
- Hardcoding resource names without EnvironmentSuffix
- Adding DeletionPolicy: Retain or DeletionProtection: true
- Missing encryption at rest or in transit
- Overly permissive IAM policies
- Database in public subnet
- Not using KMS customer-managed keys
- Missing CloudWatch Logs for audit trails