Hey team,

We've got an exciting project on our hands. A financial services startup is launching their first production environment for a new trading analytics platform. They're building something that will process real-time market data and deliver insights to institutional clients through a web dashboard. This is serious business - we're talking financial data, institutional clients, and regulatory compliance requirements like PCI-DSS. The infrastructure needs to be rock solid but also cost-effective since they're a startup.

I've been tasked with creating the AWS infrastructure foundation using AWS CDK with TypeScript. The business has been pretty specific about what they need, and honestly, the requirements are pretty comprehensive. They want everything from networking and databases to API management and compliance monitoring. They're planning to deploy in us-east-1 across three availability zones for high availability.

The interesting part is they want to balance cost with reliability. They've asked for Aurora Serverless v2 instead of traditional RDS, Lambda functions on Graviton2 processors for better price-performance, and they're serious about keeping costs down during low-traffic periods. At the same time, they can't compromise on security or compliance since this is financial data we're dealing with.

## What we need to build

Create a production-ready AWS infrastructure environment using **AWS CDK with TypeScript** for a financial trading analytics platform. This will serve as the foundation for processing real-time market data and delivering insights to institutional clients.

### Core Infrastructure Requirements

1. **Networking Foundation**
   - VPC with CIDR 10.0.0.0/16
   - Deploy across exactly 3 availability zones
   - Public subnets in each AZ for NAT gateways and external-facing resources
   - Private subnets in each AZ for compute and database resources
   - Proper routing tables and network ACLs

2. **Database Layer**
   - Aurora Serverless v2 PostgreSQL cluster deployed in private subnets
   - Automated backups enabled
   - Encryption at rest using AWS KMS customer-managed keys
   - High availability across multiple AZs
   - DynamoDB tables for user sessions with on-demand billing
   - DynamoDB tables for API keys with on-demand billing
   - Point-in-time recovery enabled for all DynamoDB tables

3. **Storage Infrastructure**
   - S3 bucket for raw data ingestion
   - S3 bucket for processed analytics results
   - S3 bucket for long-term archival
   - Versioning enabled on all buckets
   - Lifecycle policies to transition objects to archival storage after 90 days
   - Encryption at rest using AWS KMS customer-managed keys

4. **Compute and Processing**
   - Lambda functions for data processing pipelines
   - All Lambda functions must use ARM-based Graviton2 processors (ARM64 architecture)
   - Environment-specific configuration support
   - Proper IAM roles with least-privilege access
   - CloudWatch Logs integration with 30-day retention

5. **API Management**
   - API Gateway REST API for client access
   - Usage plans configured for rate limiting
   - API keys for client authentication
   - Request throttling set to 1000 requests per second per API key
   - Proper CORS configuration if needed
   - CloudWatch logging enabled

6. **Observability and Logging**
   - CloudWatch Log Groups for all services
   - 30-day retention period for all log groups
   - Subscription filters for alerting on critical events
   - Centralized logging architecture

7. **Security and Encryption**
   - KMS keys for database encryption
   - KMS keys for S3 bucket encryption
   - KMS keys for Lambda environment variable encryption
   - IAM roles and policies following least-privilege principle
   - Regional restrictions in IAM policies to prevent resource creation in unused regions
   - Proper encryption in transit and at rest

8. **Compliance and Governance**
   - AWS Config enabled with recorder
   - AWS Config rules for PCI-DSS compliance checking
   - Rules to validate encryption at rest for databases and storage
   - Rules to validate access logging is enabled
   - Rules to validate proper tagging
   - Automated compliance monitoring

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use AWS CDK 2.x with Node.js 18 or higher
- Deploy to **us-east-1** region
- Resource names must include **environmentSuffix** for uniqueness across environments
- Follow naming convention: `resource-type-environment-suffix` (e.g., `trading-db-dev`, `analytics-bucket-prod`)
- Use **Aurora Serverless v2** for cost optimization during low-traffic periods
- Use **Lambda ARM64 runtime** (Graviton2) for all Lambda functions
- Use **DynamoDB on-demand billing** mode for cost efficiency
- Ensure all resources are fully destroyable (no Retain deletion policies)
- Include proper error handling and CloudWatch logging throughout
- Type-safe TypeScript implementation with proper interfaces and types

### Constraints and Requirements

- All S3 buckets must have versioning enabled
- All S3 buckets must have lifecycle policies transitioning objects to archival storage after 90 days
- All data must be encrypted at rest using AWS KMS customer-managed keys
- All IAM roles must follow least-privilege principle with explicit deny for unused AWS regions
- CloudWatch Logs retention must be set to 30 days for all log groups
- Lambda functions must use ARM-based Graviton2 processors (ARM64 architecture)
- RDS must use Aurora Serverless v2 to optimize costs during low-traffic periods
- Infrastructure must include AWS Config rules for PCI-DSS compliance monitoring
- DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled
- API Gateway must implement request throttling at 1000 requests per second per API key
- VPC must span exactly 3 availability zones with CIDR 10.0.0.0/16
- All resources must include appropriate tags: Environment, CostCenter, Compliance, DataClassification
- No resources should use Retain deletion policy - everything must be destroyable
- Include comprehensive CloudFormation outputs for VPC ID, database endpoint, API Gateway URL, and S3 bucket names

### Tagging Strategy

All resources must be tagged with:
- **Environment**: Environment identifier (dev, staging, prod)
- **CostCenter**: For cost allocation and tracking
- **Compliance**: Compliance framework (PCI-DSS)
- **DataClassification**: Data sensitivity level (Confidential, Internal, Public)

## Success Criteria

- **Functionality**: All AWS services deployed correctly with proper configuration and integration
- **Performance**: API Gateway throttling at 1000 RPS, Lambda functions using Graviton2 for cost-performance
- **Reliability**: High availability across 3 AZs, automated backups, point-in-time recovery enabled
- **Security**: All data encrypted at rest and in transit, least-privilege IAM policies, regional restrictions enforced
- **Compliance**: AWS Config rules monitoring PCI-DSS compliance requirements
- **Resource Naming**: All resources include environmentSuffix for environment isolation
- **Cost Optimization**: Aurora Serverless v2, Lambda Graviton2, DynamoDB on-demand billing
- **Code Quality**: Type-safe TypeScript, well-structured CDK code, comprehensive tests, complete documentation
- **Destroyability**: All resources can be deleted without manual intervention

## What to deliver

- Complete AWS CDK TypeScript implementation with proper stack organization
- VPC with public and private subnets across 3 availability zones
- Aurora Serverless v2 PostgreSQL cluster with encryption and backups
- DynamoDB tables for sessions and API keys with on-demand billing and PITR
- S3 buckets for ingestion, processing, and archival with lifecycle policies
- Lambda functions with Graviton2 processors for data processing
- API Gateway REST API with usage plans and throttling
- CloudWatch Log Groups with 30-day retention for all services
- KMS keys for encryption of databases, S3, and Lambda environment variables
- IAM roles and policies with least-privilege and regional restrictions
- AWS Config with PCI-DSS compliance rules
- Comprehensive resource tagging for cost allocation and compliance
- CloudFormation outputs for VPC ID, database endpoint, API Gateway URL, and S3 bucket names
- Unit tests validating resource configuration and properties
- Documentation with deployment instructions and architecture overview
- README with setup steps, deployment commands, and operational guidance
