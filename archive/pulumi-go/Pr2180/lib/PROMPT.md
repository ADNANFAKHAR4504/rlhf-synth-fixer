# Task: Secure S3 Bucket Configuration - Expert Level

## Problem Description
Create a Pulumi program using Go to deploy an S3 bucket with strict security configurations in the us-west-2 region. This task focuses on implementing comprehensive security measures for S3 bucket management, including encryption, access control, versioning, and compliance features.

## Requirements
The S3 bucket infrastructure must include the following configurations:

1. **Bucket Naming**: The bucket must be named according to the pattern 'secure-data-<unique-id>'
2. **KMS Encryption**: Use an AWS KMS key for server-side encryption of the bucket
3. **HTTPS Only**: Only allow access to the bucket via HTTPS
4. **Encryption Policy**: Implement a bucket policy that denies unencrypted uploads
5. **Versioning**: Use versioning to maintain multiple versions of an object
6. **Logging**: Enable logging to track all requests to the bucket
7. **Deletion Protection**: Ensure all bucket artifacts are protected against accidental deletion
8. **Cross-Account Access**: Allow cross-account access to specific AWS accounts defined in the configuration

## Environment
- **Platform**: Pulumi with Go
- **Target Region**: AWS us-west-2
- **Compliance Focus**: Strict adherence to organizational compliance policies for encryption and access control
- **Best Practices**: Use appropriate naming conventions and architectural best practices

## Constraints (8 Total)
1. The bucket must be named according to the pattern 'secure-data-<unique-id>'
2. Use an AWS KMS key for server-side encryption of the bucket
3. Only allow access to the bucket via HTTPS
4. Implement a bucket policy that denies unencrypted uploads
5. Use versioning to maintain multiple versions of an object
6. Logging must be enabled to track requests to the bucket
7. Ensure all bucket artifacts are protected against accidental deletion
8. Allow cross-account access to specific AWS accounts defined in the configuration

## Expected Output
A complete Pulumi Go program that:
- Defines all necessary AWS resources using Pulumi's Go SDK
- Implements all 8 security constraints
- Follows Go best practices and idiomatic code patterns
- Includes proper error handling and resource dependencies
- Can be deployed successfully using `pulumi up`
- Passes all security compliance checks

## Implementation Requirements
- Use Pulumi's Go SDK (github.com/pulumi/pulumi-aws/sdk/v6/go/aws)
- Implement comprehensive S3 security configurations
- Create KMS keys with appropriate key policies
- Configure bucket policies for encryption enforcement
- Set up access logging to a separate logging bucket
- Implement cross-account access controls
- Use lifecycle rules for deletion protection
- Follow AWS security best practices

## Additional Considerations
- The solution should be modular and reusable
- Include proper tagging for resource management
- Implement least privilege access principles
- Consider compliance requirements (HIPAA, PCI-DSS, etc.)
- Ensure all data is encrypted at rest and in transit
- Document the security measures implemented