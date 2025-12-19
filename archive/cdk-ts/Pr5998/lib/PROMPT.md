Hey team,

We need to build a payment processing infrastructure that maintains exact parity across development, staging, and production environments. A fintech startup has been struggling with configuration drift where manual changes in production aren't replicated to lower environments, causing testing failures and deployment issues. They need a solution that ensures consistency across all environments while respecting environment-specific configurations.

The business wants a multi-environment AWS infrastructure that spans three separate accounts (dev: 123456789012, staging: 123456789013, prod: 123456789014) all deployed to the eu-central-2 region. Each environment needs its own VPC with consistent CIDR blocks, an RDS Aurora PostgreSQL cluster, Lambda functions for payment validation, API Gateway endpoints with custom domains, S3 buckets for transaction logs, and SQS queues for async processing. The challenge is making sure these resources scale appropriately for each environment without duplicating code or creating configuration drift.

I've been asked to create this infrastructure using **AWS CDK with TypeScript**. The approach needs to use a base stack class that can be instantiated for each environment, with environment-specific parameters controlling things like instance sizes, memory allocations, retention policies, and resource limits. The key is ensuring that when we make changes to the infrastructure, those changes propagate consistently across all three environments while still allowing for environment-specific tuning.

## What we need to build

Create a multi-environment payment processing infrastructure using **AWS CDK with TypeScript** that maintains exact parity across development, staging, and production environments while supporting environment-specific configurations.

### Core Requirements

1. **Base Infrastructure Stack**
   - Define a reusable stack class that can be instantiated for each environment
   - Support environment-specific parameters passed via CDK context
   - Use environment prefixes for all resource names (dev-vpc, staging-vpc, prod-vpc)
   - All resource names must include **environmentSuffix** parameter for uniqueness

2. **Networking Layer**
   - Create VPC with consistent CIDR blocks across environments
   - Deploy 2 private subnets and 2 public subnets across 2 availability zones
   - Configure appropriate routing and security groups per environment
   - Use VPC endpoints where possible to minimize NAT Gateway costs

3. **Database Infrastructure**
   - Deploy RDS Aurora PostgreSQL Multi-AZ cluster
   - Environment-specific instance sizes: dev (t3.medium), staging (t3.large), prod (r5.large)
   - Store database passwords in AWS Secrets Manager with automatic rotation enabled
   - Enable encryption at rest and in transit
   - Configure automated backups with environment-specific retention periods

4. **Compute Layer**
   - Deploy Lambda functions for payment validation logic
   - Environment-specific memory allocations: dev (512MB), staging (1024MB), prod (2048MB)
   - Use Lambda aliases for environment-specific deployments
   - Configure appropriate timeout and concurrency limits per environment

5. **API Gateway Configuration**
   - Set up REST API with environment-specific stages
   - Configure custom domain names: api-dev.payments.company.com, api-staging.payments.company.com, api-prod.payments.company.com
   - Implement request validation and throttling appropriate for each environment
   - Enable API Gateway logging to CloudWatch

6. **Storage Layer**
   - Create S3 buckets for transaction logs with versioning enabled
   - Environment-specific retention policies: dev (7 days), staging (30 days), prod (90 days)
   - **CRITICAL S3 LIFECYCLE REQUIREMENT**: Use S3 Intelligent-Tiering storage class instead of STANDARD_IA transitions because AWS requires minimum 30 days before transitioning to STANDARD_IA, but dev environment needs 7-day retention
   - Alternative approach: Use expiration-only lifecycle rules for environments with less than 30 days retention
   - Enable encryption at rest using SSE-S3
   - Configure bucket policies following least-privilege principles

7. **Message Queuing**
   - Set up SQS queues for asynchronous payment processing
   - Environment-specific visibility timeouts and message retention periods
   - Configure dead-letter queues for failed message handling
   - Implement appropriate queue policies and encryption

8. **Monitoring and Observability**
   - Create CloudWatch dashboards aggregating metrics from all components per environment
   - Configure environment-specific CloudWatch alarms with appropriate thresholds
   - Enable Lambda function logging with appropriate retention periods
   - Set up X-Ray tracing for distributed transaction monitoring

9. **Deployment Automation**
   - Use CDK pipelines to automate deployment across environments
   - Implement manual approval stage before production deployments
   - Configure cross-account deployment using assume role permissions
   - Ensure deployment ordering respects resource dependencies

10. **Infrastructure Testing**
    - Implement automated infrastructure validation tests
    - Verify consistency of resource configurations across environments
    - Test IAM permissions and security group rules
    - Validate networking connectivity between components

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript** (CDK 2.x)
- Use **VPC** for network isolation with 2 AZs
- Use **RDS Aurora PostgreSQL** for database with Multi-AZ deployment
- Use **AWS Lambda** for serverless compute
- Use **API Gateway** (REST API) for HTTP endpoints
- Use **S3** for object storage with **Intelligent-Tiering** or expiration-only lifecycle policies
- Use **SQS** for message queuing
- Use **CloudWatch** for dashboards and alarms
- Use **AWS Secrets Manager** for secure credential storage
- Use **IAM** roles and policies following least-privilege principles
- Use **CDK Pipelines** for deployment automation
- Resource names must include **environmentSuffix** for uniqueness across parallel deployments
- Follow naming convention: `{resource-type}-${environmentSuffix}`
- Deploy to **eu-central-2** region
- Node.js 18+ runtime for Lambda functions
- AWS CLI configured with cross-account assume role permissions

### Constraints

- Use CDK context variables to manage environment-specific values without hardcoding
- All IAM roles must follow least-privilege principles with environment-specific naming
- Database passwords must be stored in AWS Secrets Manager with automatic rotation enabled
- Use CDK stack dependencies to ensure resources are created in the correct order
- Implement CDK aspects to enforce tagging standards across all resources
- Lambda functions must use environment-specific aliases for deployment
- API Gateway stages must correspond to the deployment environment
- CloudWatch alarms must have environment-specific thresholds
- S3 buckets must have versioning enabled
- **S3 lifecycle policies must work with ALL retention periods including 7 days for dev environment**
- All resources must be destroyable with no Retain deletion policies
- Include proper error handling and logging throughout
- Prefer serverless and managed services for cost optimization
- Avoid slow-provisioning resources like NAT Gateways where possible

## Success Criteria

- **Functionality**: All three environments (dev, staging, prod) deploy successfully with appropriate resource configurations
- **Consistency**: Infrastructure code changes propagate uniformly across environments while respecting environment-specific parameters
- **Security**: All IAM roles follow least privilege, secrets stored in Secrets Manager, encryption enabled on all storage resources
- **Monitoring**: CloudWatch dashboards provide visibility into all components per environment
- **Automation**: CDK pipelines successfully deploy changes with manual approval for production
- **Resource Naming**: All resources include environmentSuffix parameter to prevent deployment conflicts
- **Storage Lifecycle**: S3 buckets use Intelligent-Tiering or expiration-only policies that work with 7-day retention for dev
- **Testing**: Automated tests validate infrastructure consistency and resource connectivity
- **Cost Efficiency**: Infrastructure uses serverless and managed services where appropriate
- **Code Quality**: TypeScript code is well-structured, properly typed, and includes comprehensive error handling

## What to deliver

- Complete AWS CDK TypeScript application with multi-environment support
- Base stack class that accepts environment-specific parameters
- VPC with subnets, routing tables, and security groups
- RDS Aurora PostgreSQL cluster with Secrets Manager integration
- Lambda functions for payment validation with environment-specific configurations
- API Gateway REST API with custom domain support
- S3 buckets with Intelligent-Tiering lifecycle policies (to support 7-day dev retention)
- SQS queues with dead-letter queue configuration
- CloudWatch dashboards and alarms per environment
- CDK pipeline definition with cross-account deployment support
- IAM roles and policies for all services
- Unit tests validating infrastructure consistency
- Integration tests verifying resource connectivity
- Documentation explaining environment-specific configurations and deployment process
