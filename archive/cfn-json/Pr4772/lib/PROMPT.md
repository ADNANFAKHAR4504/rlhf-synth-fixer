Application Deployment

CRITICAL: Use cloudformation with json. No exceptions.
Platform: cloudformation
Language: json
Region: ap-southeast-1

Background

Infrastructure task for CloudFormation. Need to set up educational content platform.

Problem

Design and implement CloudFormation template for educational content delivery platform.

Requirements:
- Secure infrastructure
- Educational data handling compliance
- Cloud security best practices

Constraints

- Must use CloudFormation with JSON
- Must deploy to ap-southeast-1
- Must be fully destroyable

Setup

Standard CloudFormation environment

Implementation

Platform:
- Use cloudformation framework
- Write in json
- Follow cloudformation best practices
- Use environmentSuffix variable for naming

Security:
- Encrypt data at rest with AWS KMS
- Use TLS/SSL for transit
- Least privilege IAM
- Enable CloudWatch logging
- Tag all resources

Testing:
- Unit tests with good coverage
- Integration tests validate end-to-end workflows
- Load outputs from cfn-outputs/flat-outputs.json

Resources:
- Infrastructure fully destroyable for CI/CD
- Fetch secrets from Secrets Manager, don't create new ones
- Avoid DeletionPolicy: Retain

Success Criteria

- Infrastructure deploys
- Security and compliance met
- Tests pass
- Resources tagged and named correctly
- Clean destruction works
