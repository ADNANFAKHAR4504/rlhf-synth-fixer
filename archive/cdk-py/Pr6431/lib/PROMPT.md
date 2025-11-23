# Provisioning of Infrastructure Environments

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using cdk with py**
> 
> Platform: **cdk**  
> Language: **py**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a CDK Python program to migrate a payment processing system from on-premises to AWS while maintaining continuous operation. The configuration must: 1. Define a VPC with 3 availability zones, each containing public, private, and database subnets. 2. Create an RDS Aurora PostgreSQL cluster with automated backups and read replicas for the customer database. 3. Set up DynamoDB tables for transaction records with global secondary indexes for query optimization. 4. Deploy Lambda functions for payment validation, fraud detection, and transaction processing with VPC connectivity. 5. Configure API Gateway with request validation and VPC Link to private ALB. 6. Implement blue-green deployment using two target groups on the ALB with weighted routing. 7. Create S3 buckets for audit logs with 90-day retention and compliance archival. 8. Set up CloudWatch dashboards displaying API response times, error rates, and database performance metrics. 9. Configure SNS topics for alerting on failed transactions and system errors. 10. Implement AWS Secrets Manager rotation for database credentials with Lambda rotation function. Expected output: A complete CDK Python application with stack definitions for networking, compute, storage, and monitoring resources. The code should include proper tagging for cost allocation, IAM roles with least privilege access, and CloudFormation outputs for key resource identifiers needed by the operations team.

---

## Additional Context

### Background
A fintech company needs to migrate their payment processing infrastructure from a legacy on-premises setup to AWS. The existing system handles credit card transactions with strict PCI compliance requirements and must maintain zero downtime during the migration phase.

### Constraints and Requirements
- [All databases must use encrypted storage with AWS KMS customer-managed keys, All S3 buckets must use versioning and lifecycle policies, CloudWatch alarms must monitor API latency with 99th percentile metrics, DynamoDB tables must have point-in-time recovery enabled, Use AWS Systems Manager Parameter Store for all configuration values, Implement blue-green deployment strategy for zero-downtime migration, API Gateway must use VPC Link to connect to private ALB endpoints, Lambda functions must use reserved concurrency to prevent cold starts, Use AWS CDK v2 with Python 3.9 or higher]

### Environment Setup
Production-grade payment processing infrastructure deployed in us-east-1 with multi-AZ failover capabilities. Core services include API Gateway with VPC Link, ALB with target groups for blue-green deployments, Lambda functions for payment processing logic, DynamoDB for transaction records, S3 for audit logs, and RDS Aurora PostgreSQL for customer data. Requires AWS CDK 2.x with Python 3.9+, boto3, and AWS CLI configured with appropriate IAM permissions. VPC spans 3 availability zones with private subnets for compute resources and database subnets for RDS. NAT Gateways provide outbound internet access for Lambda functions in private subnets.

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
All resources should be deployed to: **us-east-1**
