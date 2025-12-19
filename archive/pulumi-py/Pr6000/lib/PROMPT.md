Hey team,

We're working with a fintech company that needs to migrate their payment processing infrastructure from development to production. Right now they have a basic dev setup with minimal security and single-instance deployments, but production needs enterprise-grade reliability, compliance controls, and proper scaling. The business is concerned about maintaining consistency while applying appropriate security and performance configurations for each environment.

The challenge is that their infrastructure requirements are significantly different between dev and prod. Development needs to be cost-effective and fast to iterate, while production requires multi-AZ high availability, enhanced security with encryption at rest, and the ability to handle production-level traffic. They process financial transactions, so PCI DSS compliance considerations are important, especially around encryption and access controls.

We need to build this infrastructure in a way that supports both environments from a single codebase, with environment-specific configurations applied automatically based on which stage we're deploying to.

## What we need to build

Create a multi-environment payment processing infrastructure using **Pulumi with Python** that supports both development and production deployments with environment-specific configurations.

### Core Requirements

1. **Base Configuration Architecture**
   - Define a configuration class that can be extended for different environments
   - Support environment-specific settings for instance sizes, encryption, retention policies
   - Allow environment suffix to be passed for resource naming

2. **Network Infrastructure**
   - Create isolated VPCs for each environment with different CIDR blocks
   - Development VPC: 10.0.0.0/16 CIDR range
   - Production VPC: 10.1.0.0/16 CIDR range
   - Deploy public and private subnets across 2 availability zones
   - Configure appropriate routing and internet connectivity

3. **Database Layer**
   - Deploy RDS PostgreSQL instances for transaction data
   - Development: t3.small instance, basic configuration
   - Production: m5.large instance with encryption enabled using KMS
   - Configure appropriate backup retention and security groups
   - Store database credentials in Secrets Manager

4. **Compute and Application Layer**
   - Deploy Lambda functions for payment processing logic
   - Development: standard concurrency settings
   - Production: reserved concurrency of 100 units minimum
   - Configure appropriate IAM roles with least-privilege access
   - Set up environment-specific environment variables

5. **API Layer**
   - Configure API Gateway REST endpoints for payment APIs
   - Apply stage-specific configurations
   - Production only: set up custom domain with ACM certificate
   - Configure API keys and usage plans per environment
   - Enable CloudWatch logging for API access

6. **Data Storage**
   - Create DynamoDB tables for session management
   - Development: provisioned billing mode with minimal capacity
   - Production: on-demand billing mode for auto-scaling
   - Configure encryption at rest for production tables

7. **Document Storage**
   - Deploy S3 buckets for document and receipt storage
   - Development: basic bucket with standard storage class
   - Production: enable versioning and lifecycle rules for 90-day retention
   - Configure bucket encryption and access policies
   - Use customer-managed KMS keys for production

8. **Security and Compliance**
   - Create customer-managed KMS keys for encryption
   - Configure IAM roles following least-privilege principles
   - Set up security groups with minimal required access
   - Store all credentials in Secrets Manager
   - Apply environment-specific tags for cost tracking

9. **Monitoring and Logging**
   - Create CloudWatch log groups for all services
   - Development: 7-day log retention
   - Production: 30-day log retention
   - Configure log streaming from Lambda and API Gateway
   - Set up basic CloudWatch alarms for production

10. **Resource Tagging and Outputs**
    - Apply environment-specific tags to all resources
    - Tag production resources with Environment and CostCenter tags
    - Export API endpoint URLs for client configuration
    - Export database connection strings for application use
    - Include all resource ARNs in stack outputs

### Technical Requirements

- All infrastructure defined using **Pulumi with Python**
- Deploy to **us-east-1** region
- Use **VPC** with isolated network for each environment
- Use **RDS PostgreSQL** for transactional database
- Use **Lambda** for serverless compute
- Use **API Gateway** for REST endpoints
- Use **DynamoDB** for session data
- Use **S3** for document storage
- Use **KMS** for encryption keys
- Use **CloudWatch** for logging and monitoring
- Use **Secrets Manager** for credential storage
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable (no Retain policies)

### Constraints

- All RDS instances must use encrypted storage with customer-managed KMS keys
- Production requires different instance sizes than development
- API Gateway must use custom domain with ACM certificate in production only
- Lambda functions require reserved concurrent executions of 100 units in production
- Production S3 buckets must enable versioning and lifecycle policies
- CloudWatch log groups must have 30-day retention in prod, 7-day in dev
- Production DynamoDB must use on-demand billing, development uses provisioned
- All production resources must be tagged with Environment=prod and CostCenter tags
- Development environment should prioritize cost-effectiveness
- All resources must support parallel deployments through environmentSuffix

## Success Criteria

- **Functionality**: Both dev and prod environments deploy successfully with appropriate configurations
- **Performance**: Production infrastructure supports reserved Lambda concurrency and appropriate database sizing
- **Reliability**: Production uses Multi-AZ deployment where applicable, development uses single-AZ for cost savings
- **Security**: All encryption requirements met, credentials stored in Secrets Manager, IAM follows least privilege
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Code Quality**: Python code following Pulumi best practices, modular component design, well-documented
- **Compliance**: Production configuration supports PCI DSS requirements for payment processing

## What to deliver

- Complete Pulumi Python implementation with environment-specific configurations
- VPC infrastructure with isolated networks per environment
- RDS PostgreSQL with appropriate sizing and encryption
- Lambda functions with environment-specific concurrency settings
- API Gateway with custom domain support for production
- DynamoDB tables with environment-specific billing modes
- S3 buckets with versioning and lifecycle policies
- KMS keys for encryption management
- CloudWatch log groups with environment-specific retention
- Secrets Manager integration for credential storage
- Comprehensive unit tests for all infrastructure components
- Integration tests validating deployed resource configuration
- Documentation covering deployment process and environment differences
