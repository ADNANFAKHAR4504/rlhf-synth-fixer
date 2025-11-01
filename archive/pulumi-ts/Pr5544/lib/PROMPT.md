# S3 Access Control System Implementation

Hi team,

We need to build a secure S3 access control system for a financial services company handling sensitive customer data. The security team has specific requirements for role-based access control with temporary credentials and comprehensive audit logging. I've been asked to implement this using **Pulumi with TypeScript** in the ap-southeast-1 region.

The challenge here is establishing strict security boundaries for development teams accessing S3 buckets with different data classifications. We need to ensure that developers, analysts, and admins each have appropriate access levels aligned with least-privilege principles, while maintaining full audit capabilities for compliance purposes.

This is critical infrastructure that will handle public data, internal business data, and confidential customer information, so we need to get the security model right from the start.

## What we need to build

Create a secure S3 access control system using **Pulumi with TypeScript** that implements role-based access to S3 buckets with different data classifications. The system needs to provide IAM roles with proper trust relationships, encrypted storage for confidential data, and comprehensive audit logging.

### Core Requirements

1. **S3 Bucket Structure**
   - Create three S3 buckets for different data classifications: public, internal, and confidential
   - All buckets must have versioning enabled for data protection
   - Configure default encryption: SSE-S3 for public and internal buckets, SSE-KMS for confidential bucket

2. **Encryption Infrastructure**
   - Generate a KMS key specifically for encrypting the confidential bucket
   - Configure appropriate key policies for cross-service access

3. **IAM Role Definitions**
   - Define three IAM roles: developers, analysts, and admins
   - Implement proper assume role policies with trust relationships
   - Each role should support temporary credential access

4. **Developer Access Control**
   - Grant developers read-only access to public and internal buckets
   - Implement least-privilege IAM policies using specific S3 actions
   - No access to confidential data

5. **Analyst Access Control**
   - Provide analysts with read/write access to internal buckets
   - Grant read-only access to confidential bucket
   - Use precise IAM policy statements

6. **Admin Access Control**
   - Provide admins with full access to all buckets
   - Include ability to manage bucket policies and configurations
   - Support for administrative operations

7. **Audit Infrastructure**
   - Enable S3 access logging to a dedicated audit bucket
   - Configure logging for all three primary buckets
   - Ensure audit logs capture all access patterns

8. **Transport Security**
   - Configure bucket policies that enforce encryption in transit
   - Deny all requests that don't use HTTPS
   - Apply to all three data classification buckets

9. **Cross-Account Access**
   - Set up cross-account access for a trusted auditor role from account 123456789012
   - Configure appropriate trust policies and permissions
   - Maintain security while enabling external audit capabilities

10. **Resource Tagging**
    - Tag all resources with Environment, Team, and DataClassification tags
    - Ensure consistent tagging across all infrastructure components
    - Support cost allocation and resource management

### Technical Requirements

- All infrastructure defined using **Pulumi with TypeScript**
- Use Pulumi's AWS SDK for all resource creation
- Use aws.iam.getPolicyDocument for all IAM policies instead of inline JSON strings
- Deploy all resources to the **ap-southeast-1** region
- Resource names must include **environmentSuffix** parameter for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Output all role ARNs so users can assume them for temporary access

### Constraints and Best Practices

- Use aws.iam.getPolicyDocument for constructing all IAM policy documents
- All S3 buckets must have versioning enabled for compliance
- Implement bucket lifecycle rules to transition objects older than 90 days to Glacier storage class
- Use Pulumi's stack references to avoid hardcoding bucket names in code
- Apply default encryption to all buckets using SSE-S3 for public/internal and SSE-KMS for confidential
- Configure MFA delete protection on the confidential bucket for enhanced security
- Set up bucket public access block configuration on all buckets to prevent accidental exposure
- Use separate Pulumi components for IAM roles and S3 buckets for better code organization
- All resources must be destroyable without retention policies for testing purposes
- Include proper error handling and validation in the implementation

## Success Criteria

- **Functionality**: All three buckets created with proper encryption and access controls
- **Security**: Role-based access properly enforced with least-privilege principles
- **Compliance**: Comprehensive audit logging enabled and cross-account access configured
- **Performance**: Lifecycle policies implemented for cost optimization
- **Resource Naming**: All resources include environmentSuffix for deployment isolation
- **Code Quality**: TypeScript implementation with proper types and component organization
- **Testability**: All IAM policies use getPolicyDocument for better validation
- **Outputs**: Role ARNs exported for users to assume roles

## What to deliver

- Complete Pulumi TypeScript implementation with proper project structure
- Separate components for IAM roles and S3 bucket configurations
- All IAM policies created using aws.iam.getPolicyDocument
- KMS key for confidential bucket encryption
- Audit bucket with appropriate access logging configuration
- Bucket policies enforcing HTTPS-only access
- Cross-account trust relationship for auditor role
- Lifecycle rules for automatic transition to Glacier after 90 days
- MFA delete protection on confidential bucket
- Public access block settings on all buckets
- Comprehensive resource tagging with Environment, Team, and DataClassification
- Unit tests validating resource creation and policy configuration
- Documentation covering deployment instructions and role assumption process