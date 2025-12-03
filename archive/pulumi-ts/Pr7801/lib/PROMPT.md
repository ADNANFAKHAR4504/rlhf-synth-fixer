# CI/CD Pipeline Integration

Create a Pulumi TypeScript program to set up a CI/CD pipeline for infrastructure validation.

## Requirements

The configuration must:

1. Create a CodeCommit repository to store Pulumi infrastructure code.
2. Set up a CodeBuild project that runs on every commit to validate Pulumi stack configurations.
3. Configure the build project to use a custom Docker image with Pulumi CLI pre-installed.
4. Create an S3 bucket to store build artifacts and Pulumi state files with versioning enabled.
5. Implement IAM roles with least-privilege permissions for CodeBuild to access required AWS services.
6. Set up CloudWatch log groups to capture build logs with 7-day retention.
7. Configure build notifications to an SNS topic for failed builds.
8. Add environment variables for Pulumi access tokens and stack configuration.
9. Create a buildspec that runs pulumi preview and policy checks.
10. Tag all resources with Environment=CI and Project=InfraValidation.

## Platform and Language

- **Platform**: Pulumi
- **Language**: TypeScript
- **Region**: us-east-1
- **Complexity**: hard

## Implementation Guidelines

- Use Pulumi AWS Native or Classic providers
- Follow AWS best practices for security and compliance
- Implement proper error handling and logging
- Use descriptive resource names following naming conventions
- Ensure all resources are properly tagged
- Implement least-privilege IAM policies
- Enable encryption at rest where applicable
- Configure appropriate retention policies
