# Security, Compliance, and Governance

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
> 
> Platform: **pulumi**  
> Language: **ts**  
> Region: **ap-southeast-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to implement a secure S3 access control system using IAM roles and policies. The configuration must: 1. Create three S3 buckets for different data classifications (public, internal, confidential) 2. Generate a KMS key for encrypting the confidential bucket 3. Define IAM roles for developers, analysts, and admins with assume role policies 4. Implement least-privilege IAM policies allowing developers read-only access to public and internal buckets 5. Grant analysts read/write access to internal buckets and read-only to confidential 6. Provide admins full access to all buckets with ability to manage bucket policies 7. Enable S3 access logging to a dedicated audit bucket 8. Configure bucket policies that enforce encryption in transit (HTTPS) 9. Set up cross-account access for a trusted auditor role from account 123456789012 10. Tag all resources with Environment, Team, and DataClassification tags. Expected output: A Pulumi stack that creates all IAM roles with proper trust relationships, S3 buckets with appropriate encryption and access policies, and outputs the role ARNs that users can assume for temporary access.

---

## Additional Context

### Background
A financial services company needs to establish strict security boundaries for their development teams accessing S3 buckets containing sensitive customer data. The security team requires role-based access control with temporary credentials and comprehensive audit logging.

### Constraints and Requirements
- [Use aws.iam.getPolicyDocument for all IAM policies instead of inline JSON, All S3 buckets must have versioning enabled, Implement bucket lifecycle rules to transition objects older than 90 days to Glacier, Use Pulumi's stack references to avoid hardcoding bucket names, Apply default encryption to all buckets using SSE-S3 for public/internal and SSE-KMS for confidential, Configure MFA delete protection on the confidential bucket, Set up bucket public access block configuration on all buckets, Use separate Pulumi components for IAM roles and S3 buckets for better organization]

### Environment Setup
AWS

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
