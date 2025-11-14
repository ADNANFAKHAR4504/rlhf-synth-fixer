# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy a payment processing environment in AWS. The configuration must: 1. Set up a VPC with CIDR 10.0.0.0/16 across 3 availability zones with both public and private subnets. 2. Deploy an API Gateway REST API with Lambda proxy integration for a payments endpoint. 3. Create three Lambda functions: payment-validator, payment-processor, and payment-notifier with 512MB memory and 30-second timeout. 4. Configure a DynamoDB table named 'transactions' with partition key 'transactionId' (String) and sort key 'timestamp' (Number). 5. Set up an S3 bucket for audit logs with server-side encryption using AWS-managed keys. 6. Create CloudWatch Log Groups for each Lambda function with 7-day retention. 7. Implement SNS topic for payment notifications with email subscription endpoint. 8. Configure NAT Gateways in each public subnet for Lambda outbound connectivity. 9. Set up VPC endpoints for S3 and DynamoDB to keep traffic within AWS network. 10. Create CloudWatch dashboard displaying Lambda invocations, errors, and DynamoDB read/write capacity metrics. Expected output: A complete Pulumi program that exports the API Gateway URL, S3 bucket name, DynamoDB table name, and CloudWatch dashboard URL. The program should use Pulumi's Component Resource pattern to organize related resources and implement proper tagging with Environment, Project, and ManagedBy tags.

---

## Additional Context

### Background
A financial services startup is expanding to the Asia-Pacific region and needs to establish a new cloud environment for their payment processing system. The infrastructure must comply with PCI DSS requirements and support high-throughput transaction processing with sub-second latency.

### Constraints and Requirements
- [All compute resources must run in private subnets with no direct internet access, CloudWatch alarms must trigger SNS notifications for any Lambda errors exceeding 1%, Lambda functions must have reserved concurrent executions set to prevent cold starts, DynamoDB tables must use on-demand billing mode with point-in-time recovery enabled, API Gateway must implement request throttling at 10,000 requests per minute, S3 buckets must have versioning enabled and lifecycle policies for 90-day archival, VPC flow logs must be enabled and sent to CloudWatch Logs, All IAM roles must use session policies with maximum session duration of 1 hour, Database backups must be encrypted with customer-managed KMS keys, All security groups must follow least-privilege principle with explicit port definitions]

### Environment Setup
New AWS environment in us-east-2 (Singapore) region for payment processing infrastructure. Requires Pulumi 3.x with TypeScript, Node.js 18+, and AWS CLI v2 configured with appropriate credentials. The setup includes VPC with 3 availability zones, private subnets for compute resources, public subnets for NAT gateways, API Gateway for external API access, Lambda functions for transaction processing, DynamoDB for transaction storage, S3 for audit logs, and CloudWatch for monitoring. Network architecture uses Transit Gateway for future multi-region connectivity.

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
All resources should be deployed to: **ap-southeast-1**
