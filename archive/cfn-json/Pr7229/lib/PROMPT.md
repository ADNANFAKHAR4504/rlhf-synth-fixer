Hey team,

We need to build infrastructure for a new credit scoring web application that our fintech startup is launching. I've been asked to create this using **CloudFormation with JSON** format. The business is really pushing for this because we need to handle sensitive financial data and maintain strict audit trails for regulatory compliance.

The application processes real-time credit decisions, so performance and security are absolutely critical. We're talking about handling customer financial data, credit scores, and payment histories - all stuff that needs to be locked down tight. The compliance team has given us a detailed checklist of requirements that we need to meet, including specific encryption standards, logging retention periods, and backup policies.

This is a serverless architecture deployment, which makes sense for our use case since we expect variable traffic patterns and want to keep costs under control while maintaining high availability. The application will be publicly accessible via an Application Load Balancer, but all the backend components need to be in private subnets with proper security controls.

## What we need to build

Create a serverless credit scoring web application infrastructure using **CloudFormation with JSON** for production deployment in us-east-1 region.

### Core Requirements

1. **Application Load Balancer Configuration**
   - Configure Application Load Balancer with HTTPS listener
   - Use AWS Certificate Manager for TLS certificate management
   - Enforce TLS 1.2 minimum for all connections
   - Deploy in public subnets across multiple availability zones

2. **Lambda Function Deployment**
   - Deploy Lambda function with Node.js 18 runtime for credit scoring logic
   - Implement Lambda function URL with IAM authentication for ALB integration
   - Configure reserved concurrent executions to prevent throttling
   - Deploy in private subnets with VPC connectivity
   - Integrate with ALB via target groups

3. **Database Infrastructure**
   - Create Aurora Serverless v2 PostgreSQL cluster with encryption enabled
   - Use AWS KMS customer managed key for database encryption
   - Configure automatic backups with 30-day retention period
   - Enable automated minor version patching
   - Deploy in private subnets across 3 availability zones

4. **Network Architecture**
   - Configure VPC with 3 availability zones
   - Create public subnets for Application Load Balancer
   - Create private subnets for Lambda functions and RDS database
   - Deploy NAT gateways for outbound connectivity from private subnets
   - Configure Internet Gateway for public subnet access
   - Set up proper route tables for public and private subnet traffic

5. **Security and Encryption**
   - Create KMS customer managed key with automatic rotation enabled
   - All data must be encrypted at rest using the KMS key
   - Implement least-privilege IAM roles for Lambda with specific Aurora permissions
   - Configure security groups with minimal required access

6. **Logging and Monitoring**
   - Set up CloudWatch Logs groups for all components
   - Configure exactly 365-day retention for compliance requirements
   - Ensure all Lambda functions, ALB, and database logs are captured

7. **Resource Tagging**
   - Add required tags to every resource: CostCenter, Environment, DataClassification
   - Resource names must include **environmentSuffix** parameter for uniqueness
   - Follow naming convention: resource-type-environment-suffix

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Application Load Balancer** for traffic distribution
- Use **Lambda** with Node.js 18 runtime for application logic
- Use **Aurora Serverless v2 PostgreSQL** for primary data storage
- Use **VPC** with 3 availability zones, public and private subnets
- Use **CloudWatch Logs** for audit trails and monitoring
- Use **KMS** for encryption key management with rotation
- Use **IAM** roles and policies for least-privilege access
- Use **ACM** for TLS certificate management
- Use **Target Groups** for ALB to Lambda integration
- Resource names must include **environmentSuffix** for uniqueness
- Deploy to **us-east-1** region
- All resources must be parameterized for environment flexibility

### Deployment Requirements (CRITICAL)

- All resources must be destroyable - do NOT use RemovalPolicy: Retain or DeletionPolicy: Retain
- Use DeletionPolicy: Delete for all resources to ensure clean teardown
- Lambda function must handle Node.js 18 SDK properly - AWS SDK v3 is built-in, do not bundle aws-sdk
- Database must use service-role/AWS_ConfigRole for proper IAM permissions if using AWS Config

### Constraints

- All data encrypted at rest using AWS KMS customer managed keys
- Application logs retained for exactly 365 days for compliance
- Database backups occur daily with 30-day retention period
- All resources tagged with CostCenter, Environment, and DataClassification
- RDS instances use encrypted storage with automated minor version patching
- Application Load Balancer enforces TLS 1.2 minimum
- Lambda functions have reserved concurrent executions set to prevent throttling
- All resources must be destroyable (no Retain policies)
- Include proper error handling and logging

## Success Criteria

- **Functionality**: Complete serverless web application infrastructure deployed and operational
- **Performance**: Application Load Balancer distributes traffic, Lambda scales automatically, Aurora Serverless adjusts capacity
- **Reliability**: Multi-AZ deployment with automatic failover for database, redundant NAT gateways
- **Security**: All data encrypted, least-privilege IAM roles, private subnets for backend, TLS 1.2 enforcement
- **Compliance**: CloudWatch Logs with 365-day retention, database backups with 30-day retention, all required tags present
- **Resource Naming**: All resources include environmentSuffix parameter
- **Code Quality**: Valid JSON CloudFormation template, well-parameterized, properly documented

## What to deliver

- Complete CloudFormation JSON template implementation
- Application Load Balancer with HTTPS listener and ACM certificate
- Lambda function with Node.js 18 runtime and VPC configuration
- Aurora Serverless v2 PostgreSQL cluster with encryption
- VPC with 3 AZs, public subnets, private subnets, NAT gateways, Internet Gateway
- CloudWatch Logs groups with 365-day retention
- KMS customer managed key with rotation
- IAM roles and policies with least-privilege access
- Security groups for all components
- Target groups for ALB integration
- Parameters for environment-specific values (environment suffix, certificate ARN, etc.)
- Outputs for key resource identifiers (ALB DNS, Lambda ARN, database endpoint)
- Unit tests for template validation
- Documentation with deployment instructions
