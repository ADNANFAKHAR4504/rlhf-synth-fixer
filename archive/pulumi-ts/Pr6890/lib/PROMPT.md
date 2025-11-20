Hey team,

We're working with a fintech startup that needs to standardize their infrastructure deployment across multiple environments. Right now they're struggling with configuration drift between dev, staging, and production, and they want to adopt proper GitOps practices with automated environment promotion. They've chosen Pulumi for infrastructure management and need us to build a robust multi-environment setup.

The company is growing fast and needs to ensure that what works in dev will work exactly the same way in staging and prod, but with appropriate scaling and configuration differences. They're particularly concerned about maintaining consistency while allowing controlled variations between environments. Think different database instance sizes, memory allocations for Lambda functions, and retention policies that make sense for each environment.

The infrastructure needs to support their application workloads which include data processing Lambda functions, API endpoints through API Gateway, PostgreSQL databases for application data, and S3 buckets for file storage. Each environment needs its own isolated VPC with proper networking setup including public and private subnets across multiple availability zones. They're committed to infrastructure as code and want everything managed through Pulumi with proper state management in Pulumi Cloud.

## What we need to build

Create a multi-environment infrastructure platform using **Pulumi with TypeScript** that deploys consistent infrastructure across dev, staging, and production environments with proper configuration management and reusable components.

### Core Requirements

1. **Custom VPC Component**
   - Build a reusable Pulumi component resource that creates a VPC with public and private subnets
   - Deploy subnets across 2 availability zones for high availability
   - Environment-specific CIDR blocks: dev (10.0.0.0/16), staging (10.1.0.0/16), prod (10.2.0.0/16)
   - Include NAT gateways for Lambda outbound connectivity

2. **Database Infrastructure**
   - RDS PostgreSQL instances with environment-specific instance types
   - Dev: t3.micro, Staging: t3.small, Prod: t3.medium
   - Automated backups enabled with point-in-time recovery
   - Encryption at rest for all environments
   - Multi-AZ deployment for staging and production

3. **Storage Layer**
   - S3 buckets with environment-specific naming conventions
   - Versioning enabled on all buckets
   - Lifecycle policies with environment-specific retention: dev (7 days), staging (30 days), prod (90 days)
   - Server-side encryption with AWS managed keys

4. **Compute Resources**
   - Lambda functions for data processing workloads
   - Environment-specific memory allocations: dev (128MB), staging (256MB), prod (512MB)
   - Environment-specific timeout values matching workload requirements
   - VPC integration for database access

5. **API Layer**
   - API Gateway REST APIs with Lambda integration
   - Proper IAM roles for Lambda invocation
   - Environment-specific API endpoints
   - CloudWatch logging enabled for all API requests

6. **Monitoring and Observability**
   - CloudWatch log groups with environment-specific retention periods
   - CloudWatch alarms for RDS CPU utilization with environment-specific thresholds
   - Centralized logging for all Lambda functions
   - Alarm notifications for critical metrics

7. **Configuration Management**
   - Environment-specific configurations stored in Pulumi config files
   - Configuration validation function to ensure required values are present
   - Stack outputs for critical resource IDs and endpoints
   - Pulumi stack references to enable cross-stack resource sharing

8. **Security and Access Control**
   - IAM roles and policies following least-privilege principles
   - Separate IAM roles for Lambda execution, RDS access, and API Gateway
   - Security group rules allowing only necessary traffic
   - Encryption for data at rest and in transit

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **VPC** for network isolation with custom CIDR blocks per environment
- Use **RDS** PostgreSQL with environment-specific instance types
- Use **S3** for object storage with versioning and lifecycle policies
- Use **Lambda** for serverless compute with VPC integration
- Use **API Gateway** REST APIs for HTTP endpoints
- Use **CloudWatch** for logging and monitoring
- Use **IAM** for access control with least-privilege policies
- Deploy to **us-east-1** region for all environments
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix pattern
- All resources must be destroyable with no DeletionProtection or Retain policies
- Implement proper error handling and rollback capabilities

### Deployment Requirements (CRITICAL)

- **Destroyability**: All resources must be fully destroyable. Do NOT use DeletionProtection, RETAIN policies, or any protection mechanisms that prevent resource deletion
- **Resource Naming**: All resources MUST include the environmentSuffix parameter in their names for uniqueness across deployments
- **Naming Pattern**: Use format like vpc-environmentSuffix, rds-environmentSuffix, lambda-processor-environmentSuffix
- **Stack Organization**: Create three separate Pulumi stacks (dev, staging, prod) with stack-specific configuration files
- **Component Resources**: Must implement custom Pulumi ComponentResource class for reusable VPC infrastructure

### Constraints

- Each environment must use resource tags with Environment, ManagedBy (Pulumi), and CostCenter keys
- All S3 buckets must have versioning enabled before applying lifecycle policies
- Lambda functions must be deployed within VPC private subnets for database access
- RDS instances must be in private subnets with security groups limiting access to Lambda
- API Gateway must use IAM authorization for Lambda invocation
- CloudWatch log retention must vary by environment to control costs
- Configuration validation must fail fast if required environment values are missing
- Infrastructure state stored in Pulumi Cloud with proper stack organization
- No hardcoded values - all environment-specific settings via Pulumi config

## Success Criteria

- **Functionality**: Infrastructure deploys successfully to all three environments with appropriate configuration differences
- **Consistency**: Identical topology across all environments with only controlled configuration variations
- **Configurability**: All environment-specific values managed through Pulumi config files
- **Reusability**: VPC infrastructure packaged as custom ComponentResource for reuse
- **Security**: All resources follow least-privilege access with proper IAM policies and security groups
- **Monitoring**: CloudWatch alarms and logging configured with environment-appropriate thresholds
- **Destroyability**: All resources can be destroyed cleanly with pulumi destroy command
- **Resource Naming**: All resources include environmentSuffix for deployment uniqueness
- **Code Quality**: TypeScript code with proper types, comprehensive tests, and clear documentation

## What to deliver

- Complete Pulumi TypeScript implementation with index.ts or tap-stack.ts entry point
- Custom ComponentResource class for reusable VPC infrastructure pattern
- Three Pulumi stack configuration files (Pulumi.dev.yaml, Pulumi.staging.yaml, Pulumi.prod.yaml)
- Configuration validation function ensuring all required environment values present
- VPC with public and private subnets across 2 AZs with NAT gateways
- RDS PostgreSQL instances with environment-specific instance types and encryption
- S3 buckets with versioning and environment-specific lifecycle policies
- Lambda functions with VPC integration and environment-specific memory and timeout
- API Gateway REST API with Lambda integration and IAM authorization
- IAM roles and policies for Lambda, RDS, and API Gateway with least-privilege access
- CloudWatch log groups with environment-specific retention and alarms for RDS CPU
- Stack outputs exporting VPC IDs, RDS endpoints, S3 bucket names, API Gateway URLs, and Lambda ARNs
- Comprehensive unit tests for all infrastructure components
- Documentation with deployment instructions and environment setup guide
