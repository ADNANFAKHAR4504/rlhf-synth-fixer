Hey team,

We're building infrastructure for a financial services company that processes payments across multiple environments. They need complete consistency across dev, staging, and production environments with identical security configurations, resource naming conventions, and network setups. The challenge is maintaining this consistency while allowing environment-specific scaling parameters to handle different load requirements.

This is critical infrastructure - we're talking payment processing systems where any configuration drift between environments could introduce bugs or security vulnerabilities. The company has learned the hard way that manual infrastructure management leads to environment-specific issues that are hard to debug and even harder to fix in production.

The business requirement is clear: deploy the same architecture pattern three times with environment-specific tuning. They want to define it once and apply it consistently, which is exactly what infrastructure as code excels at.

## What we need to build

Create a multi-environment payment processing infrastructure using **Pulumi with TypeScript** that deploys consistent architecture across dev, staging, and production environments.

### Core Requirements

1. **Reusable Component Architecture**
   - Build a component that accepts environment-specific parameters
   - Enforce consistency in security configurations across all environments
   - Allow environment-based scaling parameters (concurrency, retention periods, thresholds)
   - Use the component pattern to eliminate code duplication

2. **Network Infrastructure**
   - Deploy VPCs with 10.0.0.0/16 CIDR in each environment
   - Create 3 private subnets per VPC for multi-AZ deployment
   - Ensure proper subnet isolation and routing
   - All network resources must include environmentSuffix for uniqueness

3. **Database Layer**
   - Deploy RDS PostgreSQL instances in each environment
   - Enable encryption at rest using environment-specific KMS keys
   - Use Aurora Serverless v2 if possible for faster provisioning and cost efficiency
   - Configure skip_final_snapshot for destroyability
   - Set backup_retention_period to 1 day (minimum) for faster creation

4. **Compute Layer**
   - Deploy Lambda functions with 512MB memory allocation (consistent across environments)
   - Configure reserved concurrency based on environment: dev (10), staging (50), prod (200)
   - Lambda runtime should be compatible with AWS SDK (Node.js 18+ requires SDK v3)
   - Ensure proper IAM permissions with least-privilege access

5. **API Layer**
   - Set up API Gateway with custom domains
   - Follow domain pattern: api-{env}.payments.internal
   - Integrate AWS WAF for production environment only
   - Configure appropriate throttling and rate limiting

6. **Data Storage**
   - Create DynamoDB tables for transaction logs
   - Enable on-demand billing mode for cost efficiency
   - Enable point-in-time recovery (PITR) in all environments
   - Configure appropriate indexes for query patterns

7. **Audit and Compliance**
   - Set up S3 buckets for audit trails
   - Enable versioning on all audit buckets
   - Implement lifecycle policies based on environment requirements
   - Follow naming convention: payments-{env}-{purpose}-${environmentSuffix}

8. **Security and Access Control**
   - Implement IAM roles and policies with least-privilege access
   - Prefix all IAM roles with environment name: {env}-{role-name}
   - Create environment-specific KMS keys for encryption
   - Ensure no hardcoded credentials or secrets

9. **Monitoring and Logging**
   - Configure CloudWatch log groups with environment-specific retention
   - Dev environment: 7 days retention
   - Staging environment: 30 days retention
   - Production environment: 90 days retention
   - Set up CloudWatch alarms for RDS CPU usage with environment-specific thresholds

10. **Cross-Stack Integration**
    - Export all resource ARNs as stack outputs
    - Export endpoint URLs for API Gateway
    - Export VPC IDs and subnet IDs for potential cross-stack references
    - Enable easy integration with other stacks or services

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use **VPC** for network isolation
- Use **RDS PostgreSQL** (Aurora Serverless v2 preferred) for database
- Use **Lambda** for compute (Node.js runtime)
- Use **API Gateway** for REST APIs
- Use **DynamoDB** for transaction logs with on-demand billing
- Use **S3** for audit trails with versioning and lifecycle policies
- Use **KMS** for encryption keys
- Use **IAM** for access control with environment prefixes
- Use **CloudWatch** for logging and monitoring
- Resource names must include **environmentSuffix** for uniqueness across parallel deployments
- Follow naming convention: {resource-type}-{environment}-suffix or {resource-type}-${environmentSuffix}
- Deploy to **us-east-1** region (primary)

### Deployment Requirements (CRITICAL)

- All resources must include environmentSuffix in their names for parallel deployment safety
- Pattern: {resourceName}-${environmentSuffix} or {resourceName}-${props.environmentSuffix}
- All resources must be destroyable (no Retain policies, no deletion protection)
- RDS: Set skip_final_snapshot to true and deletion_protection to false
- S3 buckets: Do not set RemovalPolicy to RETAIN
- DynamoDB: Do not set deletion protection
- All named resources (IAM roles, Lambda functions, API Gateway, etc.) must use environmentSuffix
- Use Aurora Serverless v2 for faster provisioning and lower costs
- Lambda functions using Node.js 18+ must use AWS SDK v3 (not v2)

### Constraints

- All IAM roles must be prefixed with environment name for clear identification
- All environments must use identical VPC CIDR blocks (10.0.0.0/16)
- Subnets must have non-overlapping ranges within the VPC
- CloudWatch log retention must be 7 days for dev, 30 days for staging, 90 days for production
- RDS instances must use encrypted storage with environment-specific KMS keys
- API Gateway must use custom domain names following pattern: api-{env}.payments.internal
- Lambda memory must be 512MB across all environments (consistent)
- Lambda concurrency must be environment-based: dev (10), staging (50), prod (200)
- S3 buckets must follow naming: payments-{env}-{purpose}-${environmentSuffix}
- DynamoDB tables must have PITR enabled in all environments
- All resources must be destroyable (no Retain policies for synthetic task deployment)
- No hardcoded environment values (use parameters/config)

### Multi-Environment Configuration

The solution must support three distinct environments with these specific configurations:

- **Development**: Minimal resources, 7-day log retention, 10 Lambda concurrency, lower alarm thresholds
- **Staging**: Medium resources, 30-day log retention, 50 Lambda concurrency, moderate alarm thresholds
- **Production**: Full resources, 90-day log retention, 200 Lambda concurrency, strict alarm thresholds, WAF enabled

## Success Criteria

- **Functionality**: All three environments deploy successfully with consistent architecture
- **Consistency**: Security configurations, network setup, and resource types identical across environments
- **Scalability**: Environment-specific parameters (concurrency, retention) properly configured
- **Security**: Encryption enabled, IAM least-privilege, environment-specific KMS keys
- **Monitoring**: CloudWatch logs and alarms configured with environment-appropriate settings
- **Resource Naming**: All resources include environmentSuffix to prevent conflicts
- **Destroyability**: All resources can be destroyed cleanly (no Retain policies)
- **Code Quality**: TypeScript, well-structured, reusable components, comprehensive error handling

## What to deliver

- Complete Pulumi TypeScript implementation with reusable components
- VPC with 3 private subnets per environment
- RDS PostgreSQL (Aurora Serverless v2 preferred) with encryption
- Lambda functions with environment-based concurrency
- API Gateway with custom domains and conditional WAF
- DynamoDB tables with on-demand billing and PITR
- S3 buckets with versioning and lifecycle policies
- IAM roles with environment prefixes and least-privilege
- CloudWatch log groups with environment-specific retention
- CloudWatch alarms for RDS monitoring
- Stack outputs exporting all ARNs and endpoints
- Unit tests for all components
- Documentation and deployment instructions