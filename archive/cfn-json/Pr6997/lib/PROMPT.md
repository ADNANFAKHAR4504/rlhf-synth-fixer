Hey team,

We need to build a serverless credit scoring web application for a fintech startup that needs to handle sensitive financial data with strict compliance requirements. The company is looking for a secure, production-ready solution that can process real-time credit decisions while maintaining complete audit trails for regulatory purposes.

I've been asked to create this infrastructure using **CloudFormation with JSON** format to provision the entire stack. The business requires that we deploy all infrastructure in us-east-1 and follow enterprise security standards including encryption at rest, proper IAM controls, and comprehensive logging.

The core challenge here is building a serverless architecture that handles traffic from an Application Load Balancer through Lambda functions, with Aurora Serverless v2 PostgreSQL providing the primary data storage. The infrastructure needs to span 3 availability zones for resilience, with proper network segmentation between public-facing components and private backend services.

## What we need to build

Create a serverless credit scoring web application using **CloudFormation with JSON** that provisions a complete infrastructure stack including networking, compute, database, security, and monitoring components.

### Core Requirements

1. **Application Load Balancer Configuration**
   - Configure ALB with HTTPS listener using ACM certificate
   - Deploy in public subnets across 3 availability zones
   - Integrate with Lambda function URL using target groups
   - Enforce TLS 1.2 minimum for all HTTPS connections

2. **Lambda Function Deployment**
   - Deploy Lambda function with Node.js 18 runtime for credit scoring logic
   - Implement Lambda function URL with IAM authentication for ALB integration
   - Configure reserved concurrent executions to prevent throttling
   - Set up least-privilege IAM roles with specific Aurora permissions
   - Deploy in private subnets with VPC configuration

3. **Aurora Serverless v2 PostgreSQL Database**
   - Create Aurora Serverless v2 cluster with PostgreSQL engine
   - Enable encryption at rest using customer-managed KMS key
   - Configure automatic backups with 30-day retention period
   - Deploy in private subnets across 3 availability zones
   - Enable automated minor version patching

4. **VPC and Network Architecture**
   - Configure VPC spanning 3 availability zones
   - Create public subnets for Application Load Balancer
   - Create private subnets for Lambda functions and Aurora database
   - Set up NAT gateways for Lambda outbound connectivity (one NAT gateway for cost optimization)
   - Configure Internet Gateway for public subnet access
   - Establish proper security groups and network ACLs

5. **Security and Encryption**
   - Create KMS customer-managed key with automatic rotation enabled
   - Encrypt Aurora database at rest
   - Implement least-privilege IAM policies for all components
   - Configure security groups restricting access between components
   - Use AWS Certificate Manager for TLS certificates

6. **Monitoring and Logging**
   - Set up CloudWatch Logs groups for Lambda, ALB, and Aurora
   - Configure 365-day retention for all log groups (compliance requirement)
   - Implement CloudWatch alarms for critical metrics
   - Enable ALB access logging to S3

7. **Compliance and Governance**
   - Apply required tags to every resource: CostCenter, Environment, DataClassification
   - Follow naming convention with environmentSuffix for all named resources
   - Ensure all resources are destroyable (no DeletionPolicy: Retain)
   - Maintain audit trails through CloudWatch Logs

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use **Application Load Balancer** for HTTPS traffic distribution
- Use **Lambda** (Node.js 18) for credit scoring application logic
- Use **Aurora Serverless v2 PostgreSQL** for primary data storage
- Use **VPC** with 3 AZs, public and private subnets
- Use **CloudWatch Logs** with 365-day retention
- Use **KMS** customer-managed key with rotation for encryption
- Use **ACM** for TLS certificate management
- Use **IAM** roles with least-privilege permissions
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to **us-east-1** region
- All resources must be destroyable (no DeletionPolicy: Retain policies)

### Constraints

- All data must be encrypted at rest using AWS KMS customer managed keys
- Application logs must be retained for exactly 365 days for compliance
- Database backups must occur daily with 30-day retention period
- All resources must be tagged with CostCenter, Environment, and DataClassification
- RDS instances must use encrypted storage with automated minor version patching
- Application Load Balancer must enforce TLS 1.2 minimum and use AWS Certificate Manager
- Lambda functions must have reserved concurrent executions set to prevent throttling
- All resources must include environmentSuffix in their names
- No retention policies allowed on any resources (must be fully destroyable)

### Deployment Requirements (CRITICAL)

**IMPORTANT**: This infrastructure must be deployable and destroyable for testing purposes. The following requirements are MANDATORY:

1. **environmentSuffix Parameter**: ALL named resources must include an environmentSuffix parameter in their names to ensure uniqueness across parallel deployments. Use the CloudFormation !Sub function to concatenate resource names with the environmentSuffix parameter.

2. **Destroyability**: All resources must be configured to allow deletion. Do NOT use DeletionPolicy: Retain on any resources. Aurora clusters must have SkipFinalSnapshot enabled for test deployments.

3. **Lambda Node.js 18+ Compatibility**: For Lambda functions using Node.js 18 runtime, AWS SDK v2 is not available by default. Either use AWS SDK v3 (@aws-sdk/client-*) or extract required data directly from Lambda event objects rather than making SDK calls.

4. **NAT Gateway Cost Optimization**: Use only ONE NAT gateway instead of one per availability zone to minimize costs for this synthetic task. Production deployments would use multiple NAT gateways for high availability.

5. **Aurora Serverless Configuration**: Use Aurora Serverless v2 (not provisioned instances) for faster deployment and auto-scaling capabilities. Configure minimal capacity units for cost efficiency.

## Success Criteria

- **Functionality**: Complete serverless credit scoring application infrastructure operational
- **Performance**: Application Load Balancer routing to Lambda with sub-second response times
- **Reliability**: Multi-AZ deployment with automatic failover for database
- **Security**: Encryption at rest using KMS, least-privilege IAM, network segmentation
- **Compliance**: 365-day log retention, 30-day backup retention, comprehensive tagging
- **Resource Naming**: All named resources include environmentSuffix parameter
- **Monitoring**: CloudWatch Logs and alarms for all critical components
- **Code Quality**: Valid CloudFormation JSON, well-structured, comprehensive parameters

## What to deliver

- Complete CloudFormation JSON template implementing all requirements
- Application Load Balancer with HTTPS listener and ACM certificate
- Lambda function with Node.js 18 runtime, function URL, and IAM authentication
- Aurora Serverless v2 PostgreSQL cluster with encryption and backups
- VPC with 3 AZs, public subnets (ALB), private subnets (Lambda, RDS)
- NAT gateway for Lambda outbound connectivity
- KMS customer-managed key with rotation enabled
- CloudWatch Logs groups with 365-day retention for Lambda, ALB, Aurora
- IAM roles and policies with least-privilege access
- Security groups controlling traffic between components
- Proper tagging and naming conventions throughout
- Parameters for environment-specific configuration (environmentSuffix, etc.)
- Outputs for key resource identifiers (ALB DNS, Lambda ARN, Aurora endpoint)
