# Payment Infrastructure Migration to Production

Hey team,

We need to migrate our payment processing infrastructure from development to production. The fintech startup has been running their payment system in dev for testing, and now they're ready to go live. I've been asked to create this migration using **Pulumi with TypeScript**. The business wants a complete replication of the dev environment but with production-grade security, monitoring, and performance enhancements.

The current dev setup uses S3 for storing payment documents and receipts, DynamoDB tables for transaction records, and Lambda functions behind API Gateway for processing payments. The migration needs to preserve all data schemas and API contracts while adding enterprise-level features like automated backups, comprehensive monitoring, and enhanced security controls.

The production environment will be in the eu-west-1 region and needs to support the same payment processing workflows but with higher reliability, better security posture, and complete observability. We need to ensure the migration process validates that all dev resources exist before attempting to create production equivalents.

## What we need to build

Create a migration system using **Pulumi with TypeScript** that reads existing development environment configurations and creates equivalent production resources with enhanced security and monitoring.

### Core Requirements

1. **Configuration Management**
   - Read dev environment configurations from JSON file containing S3 bucket names, DynamoDB schemas, and Lambda settings
   - Use Pulumi stack references to avoid hardcoding resource names
   - Validate all dev resources exist before creating production equivalents
   - Resource names must include **environmentSuffix** for uniqueness

2. **S3 Storage Migration**
   - Create production S3 buckets matching dev bucket structure
   - Enable versioning on all production buckets
   - Implement lifecycle policies to move objects older than 90 days to Glacier
   - Configure server-side encryption using AWS KMS customer-managed keys
   - Lambda function code must be packaged as zip files and uploaded to production S3 before deployment

3. **DynamoDB Migration**
   - Set up production DynamoDB tables matching dev schemas
   - Configure on-demand billing mode
   - Enable point-in-time recovery on all tables
   - Schedule automated backups daily at 3 AM UTC
   - Preserve all data schemas from dev environment

4. **Lambda Function Deployment**
   - Deploy Lambda functions with Node.js 18.x runtime
   - Set production-specific environment variables
   - Increase memory allocation to minimum 512MB
   - Configure reserved concurrent executions to prevent throttling
   - Enable AWS X-Ray tracing for all functions
   - CloudWatch log retention set to 30 days

5. **API Gateway Configuration**
   - Create API Gateway REST APIs matching dev endpoints
   - Configure custom domain mapping
   - Set request throttling to 1000 requests per second
   - Implement AWS WAF web ACL for protection against common attacks
   - Enable X-Ray tracing
   - CloudWatch log retention set to 30 days
   - Preserve all API contracts from dev environment

6. **Monitoring and Alerting**
   - Implement CloudWatch alarms for DynamoDB throttling events
   - Set up alarms for Lambda errors exceeding 1 percent threshold
   - Create alarms for API Gateway 4xx and 5xx error rates
   - Build CloudWatch dashboard displaying key metrics from all migrated services

7. **Security and Access Control**
   - Apply production-grade IAM policies with least privilege access
   - Include explicit deny statements for actions outside eu-west-1 region
   - Use KMS customer-managed keys for all encryption needs
   - Configure WAF for API Gateway protection

8. **Resource Tagging**
   - Tag all resources with Environment=production
   - Add MigratedFrom=dev tag
   - Include MigrationDate tag on all resources
   - Use **environmentSuffix** in resource naming convention: resource-type-environment-suffix

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use AWS S3 for storage with KMS encryption and Glacier lifecycle
- Use AWS DynamoDB with on-demand billing and point-in-time recovery
- Use AWS Lambda with Node.js 18.x runtime and X-Ray tracing
- Use API Gateway REST APIs with WAF and custom domains
- Use CloudWatch for monitoring, alarms, and dashboards
- Use IAM for access control with region restrictions
- Use KMS for encryption key management
- Use WAF for API protection
- Use X-Ray for distributed tracing
- Deploy to **eu-west-1** region
- Resource names must include **environmentSuffix** for uniqueness
- Follow naming convention: resource-type-environment-suffix
- All resources must be destroyable without Retain policies
- Include proper error handling and logging throughout

### Constraints

- Must preserve all data schemas and API contracts from dev during migration
- Lambda code must be packaged as zip files and uploaded to S3 before function deployment
- DynamoDB backups must be scheduled daily at 3 AM UTC
- S3 buckets must use server-side encryption with KMS customer-managed keys
- API Gateway must have WAF web ACL configured for attack protection
- CloudWatch log retention must be 30 days for both Lambda and API Gateway
- Must use Pulumi stack references to avoid hardcoding resource names
- Production Lambda functions must have reserved concurrent executions configured
- All IAM roles must include explicit deny for actions outside eu-west-1 region
- Migration must validate dev resources exist before creating production equivalents
- All resources must be destroyable and not use Retain policies

## Success Criteria

- **Functionality**: All dev resources successfully replicated in production with enhanced features
- **Performance**: API Gateway throttling at 1000 rps, Lambda minimum 512MB memory
- **Reliability**: Automated daily backups, point-in-time recovery enabled, reserved concurrency configured
- **Security**: KMS encryption, WAF protection, least privilege IAM, region restrictions
- **Monitoring**: CloudWatch alarms for throttling/errors, comprehensive dashboard, X-Ray tracing
- **Resource Naming**: All resources include environmentSuffix following resource-type-environment-suffix pattern
- **Code Quality**: TypeScript implementation with proper error handling and documentation

## What to deliver

- Complete Pulumi TypeScript implementation
- S3 buckets with versioning, Glacier lifecycle, and KMS encryption
- DynamoDB tables with on-demand billing, PITR, and automated backups
- Lambda functions with Node.js 18.x, increased memory, reserved concurrency, and X-Ray
- API Gateway with custom domains, throttling, WAF, and X-Ray
- CloudWatch alarms for DynamoDB throttling, Lambda errors, and API Gateway errors
- CloudWatch dashboard with key metrics from all services
- IAM policies with least privilege and region restrictions
- KMS customer-managed keys for encryption
- WAF web ACL for API Gateway
- Resource tagging with Environment, MigratedFrom, and MigrationDate
- Configuration reading from dev environment JSON
- Stack references implementation
- Dev resource validation logic
- Output of created resource ARNs and migration summary report
- Unit tests for all components
- Documentation and deployment instructions