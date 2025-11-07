# Security, Compliance, and Governance

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with py**
> 
> Platform: **pulumi**  
> Language: **py**  
> Region: **us-east-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi Python program to deploy a secure payment processing API infrastructure. The configuration must: 1. Create a VPC with 3 private and 3 public subnets across different AZs. 2. Set up an API Gateway with mutual TLS authentication and integrate it with Lambda functions. 3. Deploy Lambda functions in private subnets with VPC endpoints for AWS services access. 4. Configure S3 buckets with server-side encryption using customer-managed KMS keys, versioning, and public access blocking. 5. Implement a Web Application Firewall (WAF) with OWASP Top 10 rule set attached to the API Gateway. 6. Create IAM roles for Lambda execution with least privilege policies and explicit deny statements for destructive actions. 7. Set up CloudWatch Log Groups with encryption and 90-day retention for all Lambda functions. 8. Configure KMS keys with automatic rotation for encrypting S3, CloudWatch Logs, and DynamoDB. 9. Create a DynamoDB table with point-in-time recovery and encryption at rest. 10. Ensure all resources are tagged with mandatory compliance tags. Expected output: A Pulumi stack that provisions a fully secured payment API infrastructure with defense-in-depth security controls, meeting PCI-DSS requirements for encryption, network isolation, and access management.

---

## Additional Context

### Background
A financial services company needs to implement strict security controls for their payment processing infrastructure. The security team has mandated encryption at all layers, network isolation, and comprehensive access controls to meet PCI-DSS compliance requirements.

### Constraints and Requirements
- [All data must be encrypted at rest using customer-managed KMS keys with automatic rotation enabled, Network traffic must flow through a Web Application Firewall (WAF) with OWASP Top 10 protection rules, Lambda functions must run in private subnets with no direct internet access, S3 buckets must have versioning enabled and block all public access, API Gateway must enforce mutual TLS authentication for all endpoints, CloudWatch Logs must be encrypted and retention set to 90 days for compliance, IAM roles must follow least privilege principle with explicit deny statements for sensitive actions, All resources must be tagged with 'Environment', 'DataClassification', and 'ComplianceScope' tags]

### Environment Setup
Payment processing infrastructure deployed in us-east-1 across 3 availability zones. Uses API Gateway for REST APIs, Lambda for compute, S3 for encrypted document storage, and DynamoDB for transaction records. Requires Pulumi 3.x with Python 3.9+, AWS CLI configured with appropriate permissions. VPC with private subnets for Lambda execution, public subnets for ALB/WAF. KMS for encryption key management, CloudWatch for logging and monitoring. Security Hub enabled for compliance scanning.

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
