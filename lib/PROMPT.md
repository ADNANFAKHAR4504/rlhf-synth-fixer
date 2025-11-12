# Multi-Region Payment Infrastructure Migration

Hey team,

We need to migrate our payment processing infrastructure from us-east-1 to eu-west-1 to support our European expansion. The business wants a complete infrastructure setup in both regions with secure VPC peering between them. I've been asked to create this infrastructure using **CDKTF with Python**.

The current payment system handles transaction processing, customer data storage, and API endpoints. We need to replicate this setup in the EU region while maintaining connectivity to the US infrastructure during the migration phase. The business requires full encryption for data at rest and in transit, along with comprehensive monitoring capabilities.

Our compliance team has mandated strict security controls including least-privilege IAM policies, KMS encryption for databases, and proper resource tagging for cost allocation and governance. All infrastructure components must be created from scratch in both regions with no dependencies on existing resources.

## What we need to build

Create a **CDKTF with Python** implementation for multi-region payment infrastructure spanning us-east-1 (source) and eu-west-1 (target) regions.

### Core Requirements

1. **Multi-Region VPC Architecture**
   - Create complete VPC infrastructure in us-east-1 with CIDR 10.0.0.0/16
   - Create complete VPC infrastructure in eu-west-1 with CIDR 10.1.0.0/16
   - Public and private subnets across multiple availability zones
   - VPC peering connection between us-east-1 and eu-west-1
   - Route tables configured for cross-region communication
   - Internet gateways and NAT gateways for connectivity

2. **Database Infrastructure**
   - RDS PostgreSQL in target region with KMS encryption
   - Use customer-managed KMS keys for encryption at rest
   - Multi-AZ deployment for high availability
   - Automated backups enabled
   - DynamoDB tables with point-in-time recovery enabled
   - DynamoDB global secondary indexes for query optimization

3. **Compute and API Layer**
   - Lambda functions for payment processing with inline code
   - Reserved concurrent executions set to 10 per Lambda function
   - API Gateway HTTP API endpoints (no custom domain required)
   - Lambda IAM roles with least-privilege policies

4. **Storage and Replication**
   - S3 buckets in both regions with versioning enabled
   - AES-256 encryption for all S3 buckets
   - Cross-region replication from us-east-1 to eu-west-1
   - Lifecycle policies for cost optimization

5. **Monitoring and Logging**
   - CloudWatch dashboards for infrastructure metrics
   - CloudWatch log groups with 30-day retention period
   - Alarms for critical infrastructure components
   - Logging for all API Gateway requests and Lambda executions

### Technical Requirements

- All infrastructure defined using **CDKTF with Python**
- Use **AWS Provider** configured for both us-east-1 and eu-west-1
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `{resource-type}-{purpose}-{environmentSuffix}`
- Deploy primary infrastructure to **us-east-1** region
- Deploy target infrastructure to **eu-west-1** region
- VPC peering must use auto_accept=False for cross-region connections
- All resources must be destroyable (no Retain deletion policies)

### Security and Compliance Constraints

- S3 versioning enabled with AES-256 encryption
- IAM policies must follow least-privilege principle with explicit denies
- All resources tagged with: Environment, Region, MigrationBatch
- RDS encryption with customer-managed KMS keys
- Lambda reserved concurrent executions = 10 per function
- CloudWatch log retention = 30 days
- DynamoDB point-in-time recovery enabled
- No hardcoded credentials or secrets
- Private subnets for databases and Lambda functions
- Security groups with minimal required access

### Infrastructure Naming

All resources must include environmentSuffix in their names:
- VPC: `payment-vpc-{region}-{environmentSuffix}`
- RDS: `payment-db-{environmentSuffix}`
- DynamoDB: `payment-transactions-{environmentSuffix}`
- Lambda: `payment-processor-{environmentSuffix}`
- S3: `payment-data-{region}-{environmentSuffix}`
- API Gateway: `payment-api-{environmentSuffix}`

## Success Criteria

- **Functionality**: Complete infrastructure in both regions with working VPC peering
- **Security**: All encryption requirements met, least-privilege IAM policies implemented
- **Compliance**: All resources properly tagged, 30-day log retention configured
- **Performance**: Lambda reserved concurrency set to 10, multi-AZ databases
- **Reliability**: Point-in-time recovery enabled, automated backups configured
- **Resource Naming**: All resources include environmentSuffix
- **Code Quality**: Clean Python code, well-tested, properly documented

## What to deliver

- Complete CDKTF Python implementation in lib/tap_stack.py
- AWS provider configurations for us-east-1 and eu-west-1
- VPC infrastructure with peering and route tables
- RDS PostgreSQL with KMS encryption
- DynamoDB tables with PITR and GSIs
- Lambda functions with inline code and reserved concurrency
- API Gateway HTTP API endpoints
- S3 buckets with cross-region replication and encryption
- CloudWatch dashboards and log groups with proper retention
- IAM roles and policies following least-privilege
- KMS keys for encryption
- Comprehensive documentation in README
- Unit tests for infrastructure components