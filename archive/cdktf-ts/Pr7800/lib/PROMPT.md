# Financial Trading Analytics Platform - AWS Infrastructure

Hey team,

We need to build the AWS infrastructure for a new financial trading analytics platform. This is for a financial services startup that's launching their first production environment - they'll be processing real-time market data and providing insights to institutional clients through a web dashboard. The business is really focused on security and compliance since we're dealing with financial data, but they also want to keep costs reasonable while maintaining good performance.

I've been asked to create this using **CDKTF with TypeScript**. The platform needs to handle real-time market data ingestion, store transactional data securely, process analytics workloads, and expose everything through secure APIs. The business wants a production-ready environment that meets PCI-DSS requirements but uses cost-effective AWS services where possible.

The architecture needs to be distributed across 3 availability zones for high availability, with private networking for sensitive resources. We're deploying to us-east-1, and everything needs proper encryption, monitoring, and compliance tracking.

## What we need to build

Create a production-ready AWS environment using **CDKTF with TypeScript** for a financial trading analytics platform. The infrastructure must support real-time data processing, secure storage, API access, and full compliance monitoring.

### Core Infrastructure Requirements

1. **Network Architecture**
   - VPC with CIDR 10.0.0.0/16 spanning exactly 3 availability zones
   - Public and private subnets in each AZ
   - NAT Gateway for private subnet internet access (single gateway for cost optimization)
   - Security groups with least-privilege access rules

2. **Database Layer**
   - Aurora Serverless v2 PostgreSQL cluster for transactional data
   - Deploy in private subnets for security
   - Automated backups enabled
   - Encryption at rest using AWS KMS customer-managed keys
   - Multi-AZ deployment for high availability

3. **NoSQL Data Storage**
   - DynamoDB table for user sessions with on-demand billing
   - DynamoDB table for API keys with on-demand billing
   - Point-in-time recovery enabled on both tables
   - Encryption at rest using KMS

4. **Object Storage**
   - S3 bucket for raw data ingestion
   - S3 bucket for processed analytics
   - S3 bucket for long-term archival
   - Versioning enabled on all buckets
   - Lifecycle policies to transition data to Glacier after 90 days
   - Server-side encryption using KMS customer-managed keys
   - Block public access on all buckets

5. **Compute Layer**
   - Lambda functions using Graviton2 processors (ARM64 architecture) for cost optimization
   - Functions for data processing pipelines
   - Environment-specific configuration support
   - Proper IAM execution roles with least-privilege permissions
   - VPC integration for private resource access

6. **API Gateway**
   - REST API for client access
   - Usage plans with API keys for client authentication
   - Request throttling at 1000 requests per second per API key
   - CloudWatch logging enabled
   - Integration with Lambda functions

7. **Monitoring and Logging**
   - CloudWatch Log Groups for all services
   - 30-day retention period for all logs
   - Subscription filters configured for alerting
   - Log encryption using KMS

8. **Encryption and Key Management**
   - KMS customer-managed key for database encryption
   - KMS customer-managed key for S3 bucket encryption
   - KMS customer-managed key for Lambda environment variables
   - Key rotation enabled

9. **Identity and Access Management**
   - IAM roles for Lambda execution with least-privilege policies
   - IAM roles for Aurora database access
   - Explicit regional restrictions (deny access to unused regions)
   - Service-specific policies with resource-level permissions

10. **Compliance Monitoring**
    - AWS Config with recorder and delivery channel
    - Config rules for PCI-DSS compliance checking
    - Encryption validation rules
    - Access logging validation rules
    - S3 bucket for Config snapshots and history

### Technical Requirements

- All infrastructure defined using **CDKTF with TypeScript**
- Use VPC for network isolation (10.0.0.0/16, 3 AZs)
- Use Aurora Serverless v2 for database (PostgreSQL)
- Use DynamoDB for session and API key management
- Use S3 for data storage with lifecycle policies
- Use Lambda with Graviton2 (ARM64) for compute
- Use API Gateway for REST API exposure
- Use CloudWatch for logging and monitoring
- Use KMS for encryption key management
- Use IAM for least-privilege access control
- Use AWS Config for compliance monitoring
- Resource names must include **environmentSuffix** for uniqueness across deployments
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **us-east-1** region
- All resources must be destroyable (use skip_final_snapshot for RDS, no deletion protection)

### Deployment Requirements (CRITICAL)

- **environmentSuffix Parameter**: ALL named resources MUST include environmentSuffix variable to prevent naming conflicts in CI/CD
- **Destroyability**: All resources must use DESTROY removal policy (no RETAIN policies, skip_final_snapshot: true for databases, deletion_protection: false)
- **AWS Config IAM Role**: Use the correct managed policy `arn:aws:iam::aws:policy/service-role/AWS_ConfigRole` (service-role prefix required)
- **Lambda Architecture**: Use ARM64 architecture for Graviton2 processors (not X86_64)
- **Aurora Configuration**: Use Serverless v2, set backup_retention_period to 1 day (minimum), skip_final_snapshot to true
- **NAT Gateway**: Create only 1 NAT Gateway (not per AZ) for cost optimization in synthetic tasks
- **Node.js Runtime**: If using Node.js 18+, Lambda functions cannot use AWS SDK v2 - use SDK v3 or extract data from event objects

### Constraints

- All S3 buckets must have versioning enabled and lifecycle policies for 90-day archival to Glacier
- All data must be encrypted at rest using AWS KMS customer-managed keys
- All IAM roles must follow least-privilege principle with explicit deny for unused AWS regions
- CloudWatch Logs retention must be set to 30 days for all log groups
- Lambda functions must use ARM64 architecture (Graviton2) for cost optimization
- Aurora must use Serverless v2 for cost efficiency during low-traffic periods
- AWS Config rules must validate PCI-DSS compliance requirements
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- API Gateway must implement request throttling at 1000 requests per second per API key
- VPC must span exactly 3 availability zones with CIDR 10.0.0.0/16
- No GuardDuty detectors (account-level resource, only one allowed per account)

## Success Criteria

- **Functionality**: All 11 AWS services deployed and integrated correctly
- **Network Security**: VPC with private subnets, security groups, NAT Gateway properly configured
- **Data Security**: All data encrypted at rest with KMS, least-privilege IAM policies
- **High Availability**: Resources distributed across 3 AZs
- **Cost Optimization**: Serverless services, Graviton2 processors, minimal NAT Gateways
- **Compliance**: AWS Config rules validate PCI-DSS requirements
- **Monitoring**: CloudWatch logs with 30-day retention, subscription filters configured
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Destroyability**: All resources can be deleted without errors (no retention policies)
- **Code Quality**: Clean TypeScript code, proper types, well-organized stacks

## What to deliver

- Complete CDKTF TypeScript implementation
- VPC with 3-AZ network architecture
- Aurora Serverless v2 PostgreSQL cluster
- DynamoDB tables for sessions and API keys
- S3 buckets with lifecycle policies and encryption
- Lambda functions with Graviton2 architecture
- API Gateway with usage plans and throttling
- CloudWatch Log Groups with 30-day retention
- KMS keys for encryption
- IAM roles with least-privilege policies
- AWS Config with PCI-DSS compliance rules
- Infrastructure code outputs: VPC ID, Aurora endpoint, API Gateway URL, S3 bucket names
- Deployment instructions
- All code in lib/ directory (stacks, constructs, Lambda functions in lib/lambda/)
