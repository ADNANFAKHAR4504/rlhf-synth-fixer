# Payment Processing Infrastructure Deployment

Hey team,

We've got a critical infrastructure challenge from a fintech startup that needs our help. They've been burned by configuration drift between their development, staging, and production environments. Last month, they had a production incident where a payment processing feature worked perfectly in staging but failed in production due to subtle infrastructure differences. The business impact was significant, and they need a robust solution that ensures complete consistency across all their environments.

The core problem is that they're manually managing infrastructure across three environments, and despite their best efforts, configuration drift keeps creeping in. Different RDS instance sizes, inconsistent Lambda memory settings, varying backup policies - these small differences add up to big problems. They need a solution that makes it impossible for these environments to diverge.

We need to build a multi-environment payment processing infrastructure using **Pulumi with TypeScript** that guarantees consistency across dev, staging, and production while still allowing for appropriate environment-specific configurations like instance sizes.

## What we need to build

Create a multi-environment payment processing infrastructure using **Pulumi with TypeScript** that deploys identical infrastructure across three environments with strict consistency guarantees.

### Core Requirements

1. **Reusable Module Architecture**
   - Create a reusable TypeScript module that defines all resources for a single environment
   - Module should be parameterized to accept environment-specific configurations
   - Ensure the module enforces consistency in resource types and configurations
   - All resource names must include the environmentSuffix parameter for uniqueness

2. **Multi-Environment Deployment**
   - Deploy infrastructure to three environments: dev, staging, and production
   - Production environment in us-east-1
   - Staging environment in us-east-2
   - Development environment in us-east-1
   - Use Pulumi config files to manage environment-specific values

3. **VPC and Network Infrastructure**
   - Each environment requires its own VPC
   - Public and private subnets across 2 availability zones per environment
   - Use stack references to share VPC ID and subnet IDs from networking stack
   - Proper security group configurations for each component

4. **API Gateway Configuration**
   - API Gateway with Lambda integration
   - Two endpoints: /process-payment and /verify-payment
   - Request and response logging enabled on all API Gateway stages
   - Export API Gateway endpoint URLs as outputs

5. **Lambda Functions**
   - Payment processing Lambda functions with RDS integration
   - Environment variables for RDS connection strings
   - Identical memory and timeout settings across all environments
   - IAM roles with least privilege access to RDS, S3, and SQS
   - CloudWatch alarms for Lambda errors (threshold: 5 errors in 5 minutes)

6. **RDS PostgreSQL Database**
   - Production: db.r5.large instances
   - Staging and Dev: db.t3.medium instances
   - Automated backups: 7 days for production, 3 days for staging and dev
   - Encrypted storage using AWS-managed KMS keys
   - Deletion protection must be set to false (deletionProtection: false)
   - Export RDS endpoints as outputs

7. **S3 Audit Logging**
   - S3 buckets for audit logs with versioning enabled
   - Intelligent tiering for logs older than 30 days
   - Lifecycle policies configured
   - Force destroy enabled (forceDestroy: true) for clean teardown

8. **SQS Queue Configuration**
   - SQS queues for asynchronous payment processing
   - Dead Letter Queue (DLQ) for failed payment notifications
   - Proper IAM permissions for Lambda to send/receive messages

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS API Gateway for REST endpoints
- Use AWS Lambda for serverless compute
- Use Amazon RDS PostgreSQL for transaction data
- Use Amazon S3 for audit logs
- Use Amazon SQS for async processing
- Use AWS CloudWatch for monitoring and alarms
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 (production and dev) and us-east-2 (staging) regions

### Deployment Requirements (CRITICAL)

- All named resources MUST include environmentSuffix in their names for uniqueness
- All resources MUST be destroyable without manual intervention:
  - S3 buckets: forceDestroy: true
  - RDS instances: deletionProtection: false, skipFinalSnapshot: true
  - No Retain deletion policies allowed
- Implement stack references to share outputs between networking and application stacks
- Use Pulumi config for environment-specific values (not hardcoded)
- Validate all resource configurations before deployment
- Prevent accidental production deployments with explicit confirmation requirements

### Constraints

- API Gateway stages must have logging enabled for both requests and responses
- Lambda functions must have identical memory and timeout settings across environments
- All S3 buckets must have versioning enabled
- RDS instances must use encrypted storage with AWS-managed KMS keys
- IAM roles must follow least privilege principle
- All resources must be destroyable for clean environment teardown
- Stack references required for sharing VPC and subnet information
- Configuration drift prevention through reusable modules

## Success Criteria

- Functionality: Infrastructure deploys consistently across all three environments
- Consistency: Identical resource configurations except for explicitly parameterized values
- Performance: RDS backup and S3 lifecycle policies configured correctly
- Reliability: CloudWatch alarms trigger on Lambda errors
- Security: Encrypted storage, least privilege IAM, proper network segmentation
- Resource Naming: All resources include environmentSuffix parameter
- Destroyability: All resources can be cleanly destroyed without manual intervention
- Code Quality: Well-structured TypeScript, reusable modules, comprehensive configuration management

## What to deliver

- Complete Pulumi TypeScript implementation with reusable modules
- Stack configuration files for dev, staging, and production environments
- API Gateway with Lambda integration for payment endpoints
- RDS PostgreSQL with appropriate instance sizes and backup policies
- S3 buckets with versioning and lifecycle policies
- SQS queues with DLQ configuration
- Lambda functions with CloudWatch alarms
- IAM roles and policies with least privilege
- Stack references implementation for networking integration
- Unit tests for all components
- Documentation covering deployment process and configuration management
- README with deployment instructions and environment setup guide
