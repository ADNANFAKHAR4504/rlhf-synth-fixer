**Functional scope (build everything new):**

Create a comprehensive CloudFormation template that establishes a zero-trust security baseline for a new AWS environment. The template must provision all security resources from scratch with no dependencies on existing infrastructure. All resources must include an environment suffix parameter to prevent naming conflicts across multiple deployments.

**Security Requirements:**

1. **IAM Roles & Policies**
   - Create least-privilege roles for EC2, Lambda, and ECS with explicit deny policies for sensitive actions
   - Implement IAM permission boundaries to restrict maximum privileges for developer roles
   - Establish cross-account assume roles with external ID validation for third-party access
   - Configure IAM password policy with 90-day rotation, MFA enforcement, and complexity requirements

2. **Encryption & Key Management**
   - Deploy KMS Customer Managed Keys for RDS, S3, and EBS with automatic rotation
   - Ensure KMS policies require MFA for administrative actions without deletion protection
   - Implement encryption for all sensitive data stores and logs

3. **Data Protection**
   - Create S3 bucket policies enforcing SSL/TLS access and blocking unencrypted uploads
   - Configure AWS Systems Manager Parameter Store with SecureString parameters
   - Set up AWS Secrets Manager for database credentials with 30-day automatic rotation

4. **Monitoring & Compliance**
   - Establish CloudWatch Log Groups with KMS encryption and 365-day retention
   - Implement AWS Config rules to monitor compliance with security baseline
   - Create Service Control Policies restricting root user actions and regional deployment

**Technical Constraints:**

- All IAM policies must use explicit resource ARNs (no wildcard resources)
- KMS key policies must require MFA for administration without deletion protection
- Use CloudFormation Conditions to restrict deployment to approved regions (us-east-1, us-west-2)
- Generate all passwords and secrets dynamically using CloudFormation functions
- Include proper resource dependencies and metadata tags for compliance tracking

**Deliverable:**

A complete `TapStack.yml` CloudFormation template that provisions all security resources with:
- Parameter declarations for environment configuration
- Condition checks for approved regions
- Dynamically generated secrets and credentials
- Output sections for role ARNs and KMS key IDs
- Resource naming incorporating environment suffixes
- AWS Config rules for continuous compliance monitoring
- Formal metadata tagging for audit and compliance purposes

The template must be self-contained and capable of deploying a complete security framework in a new AWS account without external dependencies.