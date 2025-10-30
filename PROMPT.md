# Environment Migration

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **eu-west-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to migrate an existing payment processing infrastructure from development to production environments. The configuration must: 1. Read existing dev environment resource configurations from a JSON file containing S3 bucket names, DynamoDB table schemas, and Lambda function settings. 2. Create production S3 buckets with versioning enabled and lifecycle policies to move objects older than 90 days to Glacier. 3. Set up DynamoDB tables in production with on-demand billing and point-in-time recovery enabled. 4. Deploy Lambda functions with production-specific environment variables and increased memory allocation (512MB minimum). 5. Configure API Gateway with custom domain mapping and request throttling (1000 requests per second). 6. Implement CloudWatch alarms for DynamoDB throttling, Lambda errors exceeding 1%, and API Gateway 4xx/5xx rates. 7. Apply production-grade IAM policies with least privilege access for all resources. 8. Tag all resources with Environment=production, MigratedFrom=dev, and MigrationDate tags. 9. Enable AWS X-Ray tracing for Lambda functions and API Gateway. 10. Create a CloudWatch dashboard displaying key metrics from all migrated services. Expected output: A complete Pulumi program that reads dev configurations and creates equivalent production resources with enhanced security, monitoring, and performance settings. The program should output the ARNs of created resources and a migration summary report.

---

## Additional Context

### Background
A fintech startup needs to migrate their payment processing infrastructure from development to production. The existing dev environment uses S3 for document storage, DynamoDB for transaction records, and Lambda functions behind API Gateway. They need to replicate this setup in production with enhanced security and monitoring configurations.

### Constraints and Requirements
- [Must preserve all data schemas and API contracts from dev environment during migration, Lambda function code must be packaged as zip files and uploaded to production S3 bucket before deployment, DynamoDB tables must have automated backups scheduled daily at 3 AM UTC, All S3 buckets must have server-side encryption using AWS KMS customer-managed keys, API Gateway must use AWS WAF web ACL for protection against common attacks, CloudWatch log retention must be set to 30 days for Lambda and API Gateway logs, Must use Pulumi stack references to avoid hardcoding resource names, Production Lambda functions must have reserved concurrent executions set to prevent throttling, All IAM roles must include explicit deny statements for actions outside the eu-west-1 region, Migration process must validate that all dev resources exist before creating production equivalents]

### Environment Setup
AWS production environment in eu-west-1 region for payment processing infrastructure migration. Requires S3 buckets with Glacier lifecycle policies, DynamoDB tables with on-demand capacity, Lambda functions (Node.js 18.x runtime), and API Gateway REST APIs. Setup requires Pulumi CLI 3.x, Node.js 18+, TypeScript 5.x, and AWS CLI configured with appropriate credentials. Infrastructure spans single region with CloudWatch monitoring and X-Ray tracing enabled across all services.

## Project-Specific Conventions

### Resource Naming
- All resources must use the `environmentSuffix` variable in their names to support multiple PR environments
- Example: `myresource-${environmentSuffix}` or tagging with EnvironmentSuffix

### Testing Integration  
- Integration tests should load stack outputs from `cfn-outputs/flat-outputs.json`
- Tests should validate actual deployed resources

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Exception**: Secrets should be fetched from existing AWS Secrets Manager entries, not created by the stack
- Avoid using DeletionPolicy: Retain unless absolutely necessary

### Security Baseline
- Implement encryption at rest and in transit
- Follow principle of least privilege for IAM roles
- Use AWS Secrets Manager for credential management where applicable
- Enable appropriate logging and monitoring

## Target Region
All resources should be deployed to: **eu-west-1**
