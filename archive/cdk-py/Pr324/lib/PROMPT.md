# Secure S3 Storage Infrastructure

Create a secure AWS S3 bucket infrastructure using AWS CDK (Python) that implements the following requirements:

## Core Requirements

1. **Secure S3 Bucket with KMS Encryption**
   - Create a customer-managed KMS key specifically for S3 encryption
   - Enable automatic key rotation for the KMS key
   - Configure the S3 bucket to use this KMS key for server-side encryption
   - Enable versioning on the S3 bucket
   - Block all public access to the bucket

2. **Security Policies**
   - Implement bucket policies that deny unencrypted uploads
   - Ensure only the specified KMS key can be used for encryption
   - Create least-privilege IAM policies for accessing the bucket
   - Support configurable list of allowed principals (IAM users/roles)

3. **Infrastructure Configuration**
   - Support environment-based naming (dev, staging, prod, etc.)
   - Make the solution parameterizable through props
   - Use CDK best practices for resource organization
   - Include proper resource tagging for governance

4. **Security Best Practices**
   - No Retain policies (all resources must be destroyable for testing)
   - Implement defense-in-depth security controls
   - Use principle of least privilege for all access policies

## Technical Specifications

- **Platform**: AWS CDK (Python)
- **Bucket naming**: `secure-{environment}-data-bucket-1`
- **KMS key alias**: `alias/secure-s3-key-1`
- **Default environment**: `dev`
- **Resource cleanup**: All resources must be destroyable (RemovalPolicy.DESTROY)

## Expected Outputs

The stack should provide CloudFormation outputs for:
- S3 bucket name and ARN
- KMS key ARN

## Integration Requirements

- The stack should be instantiable from a CDK app
- Support passing allowed principals as a parameter
- Gracefully handle missing parameters with sensible defaults
- Follow standard CDK patterns for stack organization