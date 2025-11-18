Hey team,

We've got a critical infrastructure challenge from a financial services company dealing with payment processing. They've been hit by some nasty production incidents caused by configuration drift between their development, staging, and production environments. Features work fine in staging, then mysteriously fail in production because the environments aren't actually identical. The business is rightfully frustrated, and we need to fix this structural issue.

The core problem is they need payment processing infrastructure that stays consistent across all three environments (dev, staging, and production). Right now, each environment is slightly different, and those subtle differences are causing real business impact. We're talking payment APIs, database connections, error handling, and monitoring all needing to be identical except for environment-specific resource names.

I've been asked to build this solution using **AWS CDK with TypeScript**. The business wants a single CDK application that can deploy to any environment just by changing a context variable, producing identical infrastructure every time. They're deploying across three separate AWS accounts (dev: 123456789012, staging: 234567890123, prod: 345678901234) all in us-east-1.

## What we need to build

Create a payment processing API infrastructure using **AWS CDK with TypeScript** that maintains exact parity across multiple environments.

### Core Requirements

1. **Single Parameterized Stack**
   - One CDK stack that accepts environment name through context variables
   - Deploy with syntax like `cdk deploy -c environment=dev`
   - No duplicate code for different environments

2. **API Gateway Integration**
   - REST API with Lambda proxy integration
   - Two endpoints: /payments and /refunds
   - Custom domains using AWS Certificate Manager certificates
   - Environment-specific naming for APIs

3. **Lambda Functions with Error Handling**
   - Lambda functions connecting to RDS PostgreSQL database
   - Functions deployed in private subnets
   - Dead letter queues specific to each environment
   - Lambda error handling and proper timeout configuration

4. **Database Configuration**
   - RDS PostgreSQL 14.7 instances in private subnets
   - Auto-generated passwords stored in AWS Secrets Manager
   - Environment-specific database instances
   - Connection string management

5. **S3 Storage**
   - Buckets for storing payment receipts
   - Environment-specific bucket naming
   - Proper encryption and access controls

6. **Monitoring and Alerting**
   - CloudWatch alarms for Lambda errors exceeding 5% error rate over 5 minutes
   - SNS topics per environment for alarm notifications
   - CloudWatch Logs with 14-day retention

7. **Network Infrastructure**
   - VPC with 2 public and 4 private subnets across 2 AZs
   - NAT Gateways in public subnets for Lambda internet access
   - Proper routing and security group configuration

8. **Configuration Validation**
   - CDK aspects to validate no hardcoded environment values
   - Verification that all resource names include environment identifiers
   - Cross-stack output exports for resource ARNs

### Technical Requirements

- All infrastructure defined using **AWS CDK with TypeScript**
- Use **VPC** for network isolation with proper subnet configuration
- Use **API Gateway** for RESTful endpoints
- Use **Lambda** for serverless compute with DLQ error handling
- Use **RDS PostgreSQL** for database in private subnets
- Use **S3** for receipt storage
- Use **CloudWatch** for monitoring and alarms
- Use **SNS** for alarm notifications
- Use **Secrets Manager** for database credentials
- Use **Certificate Manager** for custom domain certificates
- Use **IAM** for least privilege access policies
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: `resource-name-${environmentSuffix}`
- Deploy to **us-east-1** region
- Support CDK 2.110.0+, TypeScript 5.x, Node.js 18.x

### Deployment Requirements (CRITICAL)

All resources must be **completely destroyable** without manual intervention:
- No `RemovalPolicy.RETAIN` on any resources
- No `deletionProtection: true` settings
- RDS instances must have `skipFinalSnapshot: true`
- S3 buckets must have `autoDeleteObjects: true` and `removalPolicy: RemovalPolicy.DESTROY`
- All resources must include **environmentSuffix** parameter in names
- Pattern: `{resource-type}-${environmentSuffix}`
- Example: `payment-api-${environmentSuffix}`, `receipts-bucket-${environmentSuffix}`

### Multi-Environment Architecture

- Single CDK stack with environment passed via context
- Environment-specific configurations (account IDs, custom domains, etc.)
- Cross-account deployment with assume-role permissions
- No hardcoded values for accounts, regions, or environment names
- Resource tagging with environment identifier for cost allocation

### Security and Compliance

- Database passwords in AWS Secrets Manager (never hardcoded)
- Lambda functions in private subnets with NAT Gateway for internet access
- API Gateway custom domains with ACM certificates
- Encryption at rest for S3 and RDS
- Least privilege IAM policies
- Security groups properly configured

### Monitoring Requirements

- CloudWatch alarms for Lambda error rates (5% threshold, 5-minute evaluation)
- SNS topics for alarm notifications per environment
- Dead letter queues for Lambda failures
- CloudWatch Logs retention: 14 days
- Proper alarm naming with environment suffix

### Cost Optimization

- Prefer serverless options (Lambda, Aurora Serverless if appropriate)
- Set appropriate Lambda timeout values (not max defaults)
- Consider VPC endpoints if only AWS services accessed (reduces NAT Gateway costs)
- Tag all resources for cost allocation tracking
- Use RDS backup retention minimum (1 day for synthetic tasks)

### Known Service Limitations

**Lambda Runtime Consideration**: For Node.js 18.x+ runtimes, AWS SDK v2 is not included by default. Either use AWS SDK v3 (`@aws-sdk/client-*`) or extract data directly from event objects for simple cases.

**RDS Deployment**: Use Aurora Serverless v2 if compatible with requirements for faster provisioning. Enable `skipFinalSnapshot` for destroyability.

**CDK Best Practices**: Use Constructs (not Stack classes) for modularity. Single TapStack orchestrator in bin/tap.ts. Pass environmentSuffix as props to all constructs.

## Success Criteria

- **Functionality**: Infrastructure deploys successfully to any environment with `cdk deploy -c environment=<env>`
- **Consistency**: All resources created with proper environment-specific naming
- **Isolation**: No cross-environment resource conflicts
- **Performance**: CloudWatch alarms trigger correctly on error thresholds
- **Security**: All secrets in Secrets Manager, proper encryption enabled
- **Resource Naming**: All resources include environmentSuffix parameter
- **Destroyability**: Complete stack can be destroyed with `cdk destroy` without errors
- **Code Quality**: TypeScript code, 100% test coverage, well-documented
- **Validation**: CDK aspects verify no hardcoded environment values

## What to deliver

- Complete **AWS CDK with TypeScript** implementation
- VPC with proper subnet configuration (2 public, 4 private, 2 AZs)
- API Gateway REST API with custom domains and ACM certificates
- Lambda functions with DLQ and private subnet deployment
- RDS PostgreSQL 14.7 with Secrets Manager integration
- S3 buckets with environment-specific naming
- CloudWatch alarms and SNS topics for monitoring
- IAM roles and policies with least privilege
- CDK aspects for validation of environment values
- Unit tests with 100% coverage
- Integration tests for deployed resources
- Documentation covering deployment and configuration
- CloudFormation outputs for cross-stack references
