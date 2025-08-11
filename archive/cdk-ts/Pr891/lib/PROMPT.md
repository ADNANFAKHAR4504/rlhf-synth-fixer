I need to set up a complete CI/CD pipeline infrastructure on AWS using CDK with TypeScript. The solution should include:

1. A GitHub Actions workflow that triggers on push to main branch and pull requests
2. S3 buckets for storing build artifacts with versioning enabled and proper encryption
3. An RDS PostgreSQL database instance with appropriate security groups and backup retention
4. IAM roles and policies that follow least privilege principles for secure CI/CD operations
5. CloudWatch log groups for comprehensive logging and monitoring of the deployment process
6. Integration with AWS CodeCatalyst for enhanced developer productivity and modern CI/CD workflows
7. Use of AWS Application Composer integration patterns for visual infrastructure management

The infrastructure should support automated testing, secure deployments, and proper monitoring. Include CloudWatch metrics integration with CodePipeline for enhanced observability. Make sure all resources are properly tagged and follow AWS security best practices.

Please provide the complete infrastructure code with one code block per file.