# Multi-Environment Consistency & Replication

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using pulumi with ts**
>
> Platform: **pulumi**
> Language: **ts**
> Region: **eu-west-1**
>
> **Do not substitute or change the platform or language.** All infrastructure code must be written using the specified platform and language combination.

---

Create a Pulumi TypeScript program to deploy consistent static content hosting infrastructure across multiple environments. The configuration must: 1. Accept an environment parameter (dev/staging/prod) to control resource naming and configuration 2. Create an S3 bucket with versioning enabled and environment-specific naming (e.g., myapp-dev-content) 3. Configure bucket policies that restrict access to CloudFront Origin Access Identity only 4. Deploy a CloudFront distribution with custom error pages for 403 and 404 errors 5. Set up appropriate cache behaviors with TTL values based on environment (dev: 60s, staging: 300s, prod: 86400s) 6. Create or use an existing ACM certificate for the domain (*.myapp.com) 7. Configure Route53 records mapping environment-specific subdomains (dev.myapp.com, staging.myapp.com, myapp.com) 8. Tag all resources with Environment, Project, and ManagedBy tags 9. Export the CloudFront distribution URL and S3 bucket name for each environment 10. Implement proper IAM roles and policies for cross-environment access. Expected output: A reusable Pulumi component that can be instantiated for each environment with minimal configuration changes, ensuring all three environments maintain identical infrastructure patterns while allowing for environment-specific customizations.

---

## Additional Context

### Background
A media company needs to deploy identical content delivery infrastructure across development, staging, and production environments. Each environment requires the same S3 bucket configuration, CloudFront distribution settings, and DNS records, but with environment-specific naming and access controls.

### Constraints and Requirements
- S3 bucket names must follow the pattern: {project}-{environment}-content
- CloudFront cache TTLs must vary by environment as specified in requirements
- All resources must be tagged with mandatory tags: Environment, Project, ManagedBy
- Route53 hosted zone for myapp.com must already exist
- ACM certificate validation must complete before CloudFront distribution creation

### Environment Setup
AWS multi-environment setup in eu-west-1 for ACM certificate compatibility with CloudFront. Deploys S3 buckets for static content, CloudFront distributions for global content delivery, and Route53 for DNS management. Requires Pulumi 3.x with TypeScript, AWS CLI configured with appropriate permissions. Uses Origin Access Identity for secure S3-CloudFront integration.

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
