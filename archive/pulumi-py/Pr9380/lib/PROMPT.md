# CI/CD Pipeline Integration - Task 291351

Set up a CI/CD pipeline using Pulumi with Python that automatically deploys and tests a web application when code is pushed to the main branch.

The pipeline should work like this:

- S3 bucket stores deployment artifacts with versioning enabled
- CodeBuild project runs inside a VPC in private subnets to build and test the code
- CodeBuild pulls source from GitHub, runs tests, and uploads artifacts to the S3 bucket
- CodePipeline orchestrates the workflow, triggering CodeBuild on commits to main branch
- IAM roles connect CodeBuild to S3 with least-privilege policies limited to GetObject and PutObject actions
- VPC security groups allow CodeBuild outbound internet access for package downloads
- All resources tagged according to company policy with Environment, Project, ManagedBy, and Owner tags

Network setup:
- VPC with public and private subnets across two availability zones in us-east-1a and us-east-1b
- Internet Gateway for public subnets
- CodeBuild runs in private subnets for security

The infrastructure should be deployable to both AWS and LocalStack. For LocalStack compatibility, include conditional logic to skip CodeBuild and CodePipeline since they're Pro-only features while keeping core infrastructure functional.
