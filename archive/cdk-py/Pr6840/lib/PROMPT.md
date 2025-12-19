# Payment Processing Infrastructure Migration to AWS

Hey team,

We've got a critical project on our hands. Our fintech client needs to migrate their entire payment processing infrastructure from their legacy on-premises setup to AWS. This isn't a simple lift-and-shift - we're talking about a system that handles live credit card transactions with strict PCI compliance requirements, and they absolutely cannot afford any downtime during the migration.

The challenge here is maintaining continuous operation while we transition from their old infrastructure to a modern, cloud-native architecture. They're currently handling payment processing with traditional servers, and we need to move this to a fully managed AWS environment that can scale, maintain security compliance, and provide better disaster recovery capabilities.

The business has made it clear that this migration needs to happen seamlessly. They process transactions 24/7, and even a few minutes of downtime could cost them millions in revenue and damage their reputation with payment processors. For blue-green deployment, we'll use API Gateway stage variables with Lambda aliases to enable gradual traffic shifting during updates.

## What we need to build

Create a payment processing infrastructure using **AWS CDK with Python** for migrating a fintech company's credit card transaction system from on-premises to AWS with zero downtime.

### Core Requirements

1. **Network Infrastructure**
   - VPC spanning 3 availability zones for high availability
   - Each AZ must contain public, private, and database subnets
   - NAT Gateway for outbound internet access from private subnets (use single NAT for cost optimization)
   - Proper route tables and network ACLs for security segmentation

2. **Database Layer**
   - RDS Aurora PostgreSQL cluster for customer database with automated backups
   - Aurora Serverless v2 for cost optimization (skip_final_snapshot=True, backup_retention=1 day)
   - Read replicas for scalability and disaster recovery
   - DynamoDB tables for transaction records with global secondary indexes for efficient queries
   - Point-in-time recovery enabled on all DynamoDB tables
   - All databases must use encrypted storage with AWS KMS customer-managed keys

3. **Compute and Processing**
   - Lambda functions for payment validation logic
   - Lambda functions for fraud detection algorithms
   - Lambda functions for transaction processing
   - All Lambda functions must have VPC connectivity to access database resources
   - Avoid reserved concurrency unless specifically required (use default scaling)

4. **API and Integration**
   - API Gateway REST API with request validation for external-facing APIs
   - Direct Lambda integration for all endpoints (validate, fraud-check, process)
   - No VPC Link required - API Gateway connects directly to Lambda functions
   - Blue-green deployment can be achieved using API Gateway stage variables with Lambda aliases

5. **Storage and Compliance**
   - S3 buckets for audit logs with versioning enabled
   - 90-day retention policy with automatic compliance archival to Glacier
   - Lifecycle policies for cost optimization
   - All S3 buckets must have auto_delete_objects=True for destroyability

6. **Monitoring and Observability**
   - CloudWatch dashboards displaying real-time API response times (p99 and p50)
   - Dashboards showing error rates and transaction failures
   - Database performance metrics (CPU, connections, query latency)
   - CloudWatch alarms monitoring API latency with 99th percentile metrics
   - CloudWatch alarms for API errors, Lambda errors, and Aurora CPU utilization
   - SNS topics for alerting operations team on failed transactions and system errors

7. **Security and Secrets Management**
   - AWS Secrets Manager for database credentials
   - Automated credential rotation using Lambda rotation function
   - IAM roles with least privilege access following security best practices
   - AWS Systems Manager Parameter Store for all configuration values
   - No hardcoded credentials or configuration in code

### Technical Requirements

- All infrastructure defined using **AWS CDK with Python**
- Use **AWS CDK v2** with Python 3.9 or higher
- Deploy to region specified by `CDK_DEFAULT_REGION` environment variable (defaults to us-east-1)
- Stack name format: `TapStack{environmentSuffix}` (no hyphen between TapStack and suffix)
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `resource-name-{environmentSuffix}`
- All resources must be destroyable (RemovalPolicy.DESTROY, no DeletionPolicy.Retain)
- Use boto3 and AWS CLI compatibility
- Proper tagging for cost allocation and resource organization

### Deployment Requirements (CRITICAL)

- **environmentSuffix Requirement**: Every resource name must include an environmentSuffix parameter passed at deployment time. This ensures unique resource names across multiple deployments (e.g., `payment-api-{environmentSuffix}`, `transaction-db-{environmentSuffix}`). This is MANDATORY for all resources.
- **Destroyability**: All resources must be fully destroyable without manual intervention. Use RemovalPolicy.DESTROY for databases, auto_delete_objects=True for S3 buckets, and skip_final_snapshot=True for RDS. NO retention policies allowed.
- **Cost Optimization**: Use Aurora Serverless v2 instead of provisioned instances, single NAT Gateway instead of per-AZ, avoid Lambda reserved concurrency unless required.
- **No Hardcoded Values**: Do not hardcode environment names (prod, dev, stage) or AWS account IDs. Use CDK context or parameters.

### Constraints

- PCI compliance requirements must be maintained throughout migration
- Zero downtime during migration phase using API Gateway stage variables with Lambda aliases for blue-green deployment
- All databases encrypted at rest using customer-managed KMS keys
- All data in transit must be encrypted using TLS 1.2 or higher
- S3 buckets must have versioning and lifecycle policies configured
- Point-in-time recovery required for all DynamoDB tables
- API Gateway uses direct Lambda integration (no VPC Link or ALB required)
- All Lambda functions must handle cold starts gracefully
- CloudWatch alarms must use 99th percentile for latency metrics (not average)
- Include proper error handling and retry logic in all Lambda functions
- CloudFormation outputs must include key resource identifiers for operations team

## Success Criteria

- **Functionality**: Complete payment processing pipeline from API Gateway through Lambda to databases with proper validation and fraud detection
- **Performance**: API response times under 200ms at 99th percentile, Lambda cold starts minimized through VPC optimization
- **Reliability**: Multi-AZ deployment with automatic failover, API Gateway stage variables enable zero-downtime updates
- **Security**: All data encrypted at rest and in transit, secrets managed through Secrets Manager with rotation, IAM least privilege, PCI compliance maintained
- **Resource Naming**: All resources include environmentSuffix parameter for unique identification across deployments
- **Destroyability**: All resources can be completely torn down without manual intervention or orphaned resources
- **Monitoring**: Complete observability through CloudWatch dashboards and alarms with proper alerting via SNS
- **Code Quality**: Clean Python code following CDK best practices, well-documented with inline comments, proper stack organization

## What to deliver

- Complete AWS CDK Python implementation with proper stack structure
- VPC with 3 AZs containing public, private, and database subnets
- RDS Aurora PostgreSQL Serverless v2 cluster with encryption and read replicas
- DynamoDB tables with global secondary indexes and point-in-time recovery
- Lambda functions for payment validation, fraud detection, and transaction processing
- API Gateway REST API with direct Lambda integration and request validation
- S3 buckets for audit logs with versioning and lifecycle policies
- CloudWatch dashboards and alarms for comprehensive monitoring
- SNS topics for operational alerting
- AWS Secrets Manager with Lambda rotation function for credentials
- AWS KMS customer-managed keys for encryption
- AWS Systems Manager Parameter Store integration
- IAM roles and policies following least privilege principle
- CloudFormation outputs for key resource identifiers
- Comprehensive inline documentation and deployment instructions
- README with setup requirements and deployment steps
