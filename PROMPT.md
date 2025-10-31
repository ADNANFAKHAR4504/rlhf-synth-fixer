# Security, Compliance, and Governance

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **eu-north-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to implement security infrastructure for a data processing application. The configuration must: 1. Create a KMS key with automatic rotation enabled for encrypting application secrets. 2. Set up IAM roles with least-privilege policies for EC2 instances and Lambda functions. 3. Configure AWS Secrets Manager to store database credentials with automatic rotation every 30 days. 4. Implement cross-account access roles with external ID validation for third-party auditors. 5. Create CloudWatch Log groups with KMS encryption for audit trails. 6. Set up IAM policies that enforce MFA for sensitive operations. 7. Configure service control policies to restrict resource creation to specific regions. 8. Implement resource tags for security compliance tracking. Expected output: A Pulumi stack that deploys all security components with proper dependencies, outputs the KMS key ARN, IAM role ARNs, and Secrets Manager secret ARN for application integration.

---

## Additional Context

### Background
A financial services company needs to establish strict security controls for their data processing application. They require encryption at rest, role-based access controls, and automated secret rotation to meet compliance requirements.

### Constraints and Requirements
- [KMS key must have a key policy allowing only specific IAM roles to use it, All IAM policies must follow least-privilege principle with explicit deny statements, Secrets Manager rotation Lambda must run in a private subnet, CloudWatch Log retention must be set to 365 days for compliance, IAM roles must use session policies with maximum 1-hour duration, External ID for cross-account access must be at least 32 characters, All resources must have mandatory tags: Environment, Owner, and SecurityLevel, KMS key deletion window must be set to 30 days minimum, IAM policies must include conditions for source IP restrictions, Secrets rotation Lambda must use a customer-managed KMS key for environment variables]

### Environment Setup
Deployed in eu-north-1 region with KMS for encryption keys, IAM for access management, Secrets Manager for credential storage, and CloudWatch Logs for audit trails. Requires Pulumi CLI 3.x, Node.js 16+, TypeScript 4.x, and AWS CLI configured with appropriate permissions. Infrastructure spans a single region with cross-account access capabilities for external audit requirements.

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
All resources should be deployed to: **eu-north-1**
