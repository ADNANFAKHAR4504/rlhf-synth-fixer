# Credit Scoring Application Infrastructure

Hey team,

We need to build the infrastructure for a new credit scoring web application that will handle sensitive financial data for our fintech startup. The application needs to process real-time credit decisions while maintaining strict compliance and audit requirements. I've been asked to create this using **CloudFormation with JSON**. The business wants a highly available, secure architecture that can scale automatically while keeping costs under control.

The application will serve credit scoring requests through an Application Load Balancer that routes traffic to serverless Lambda functions. We need to store customer data and credit scores in Aurora Serverless v2 PostgreSQL with encryption enabled. The entire stack needs to span multiple availability zones for resilience and must meet regulatory requirements for data retention and audit trails.

Performance is critical since we're processing real-time credit decisions. We also need to ensure all data is encrypted at rest and in transit, with proper IAM roles limiting access to only what each component needs. The architecture should be cost-effective by leveraging serverless technologies and automatic scaling.

## What we need to build

Create a serverless credit scoring application infrastructure using **CloudFormation with JSON** for production deployment in us-east-2.

### Core Requirements

1. **Application Load Balancer Configuration**
   - Configure ALB with HTTPS listener using AWS Certificate Manager
   - Set up target groups for Lambda integration
   - Deploy in public subnets across 3 availability zones
   - Enforce TLS 1.2 minimum security policy

2. **Lambda Function Deployment**
   - Deploy Lambda function with Node.js 18 runtime for credit scoring logic
   - Implement Lambda function URL with IAM authentication for ALB integration
   - Configure reserved concurrent executions to prevent throttling
   - Deploy in private subnets with access to Aurora database
   - Set up least-privilege IAM roles with specific Aurora permissions

3. **Aurora Serverless v2 PostgreSQL Database**
   - Create Aurora Serverless v2 PostgreSQL cluster with encryption enabled
   - Use KMS customer managed key for encryption at rest
   - Deploy in private subnets across multiple availability zones
   - Configure automatic backups with 30-day retention period
   - Enable automated minor version patching

4. **VPC Network Architecture**
   - Configure VPC spanning 3 availability zones
   - Create public subnets for Application Load Balancer
   - Create private subnets for Lambda functions and RDS database
   - Set up internet gateway for public subnet access
   - Configure NAT gateways for Lambda outbound connectivity

5. **CloudWatch Logging and Monitoring**
   - Create CloudWatch Logs groups for ALB, Lambda, and database
   - Set retention period to exactly 365 days for compliance
   - Enable query logging and access logs

6. **Encryption and Key Management**
   - Create KMS customer managed key for database encryption
   - Enable automatic key rotation
   - Configure proper key policies for service access

7. **Resource Tagging**
   - Add CostCenter, Environment, and DataClassification tags to every resource
   - Ensure consistent tagging across all components

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Application Load Balancer** (ELB) for traffic distribution
- Use **AWS Lambda** with Node.js 18 runtime for application logic
- Use **Aurora Serverless v2 PostgreSQL** for database
- Use **VPC** with public and private subnets across 3 AZs
- Use **CloudWatch Logs** with 365-day retention
- Use **KMS** for encryption key management with rotation enabled
- Use **IAM** for least-privilege access control
- Use **ACM** for TLS certificate management
- Deploy to **us-east-2** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: `{resource-type}-${environmentSuffix}`

### Deployment Requirements (CRITICAL)

- All resources must be destroyable - use RemovalPolicy: DELETE or DeletionPolicy: Delete
- FORBIDDEN: RemovalPolicy: RETAIN, DeletionPolicy: Retain, or Snapshot policies
- Lambda functions in Node.js 18+ do NOT have aws-sdk pre-installed - must include it in dependencies or use AWS SDK v3
- Include environmentSuffix as a CloudFormation parameter for resource naming
- Use proper security groups to control traffic flow between components
- Include proper error handling and logging configuration

### Constraints

- All data must be encrypted at rest using AWS KMS customer managed keys
- Application logs must be retained for exactly 365 days for compliance
- Database backups must occur daily with 30-day retention period
- All resources must be tagged with CostCenter, Environment, and DataClassification
- RDS instances must use encrypted storage with automated minor version patching
- Application Load Balancer must enforce TLS 1.2 minimum and use AWS Certificate Manager
- Lambda functions must have reserved concurrent executions set to prevent throttling
- All resources must be destroyable (no Retain or Snapshot policies)

## Success Criteria

- **Functionality**: Complete serverless credit scoring application infrastructure
- **Performance**: Aurora Serverless v2 automatically scales based on load
- **Reliability**: Multi-AZ deployment with automatic failover
- **Security**: Encryption at rest and in transit, least-privilege IAM roles
- **Compliance**: 365-day log retention, 30-day backup retention, proper tagging
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: All resources can be cleanly deleted without manual intervention
- **Code Quality**: Valid JSON CloudFormation template, well-documented

## What to deliver

- Complete CloudFormation JSON template with all required resources
- Application Load Balancer with HTTPS listener and target groups
- Lambda function with Node.js 18 runtime and function URL
- Aurora Serverless v2 PostgreSQL cluster with encryption
- VPC with 3 AZs, public/private subnets, NAT gateways
- KMS key for database encryption with rotation
- CloudWatch Logs groups with 365-day retention
- IAM roles with least-privilege permissions
- Proper security groups and network ACLs
- Parameters for environment-specific configuration including environmentSuffix
- Outputs for key resource identifiers (ALB DNS, Lambda ARN, database endpoint)
- All resources properly tagged
- Documentation on deployment and configuration
