I need help setting up a complete CI/CD pipeline for a microservices application using Terraform in the us-west-2 region. The pipeline should use GitHub Actions to automatically deploy to AWS whenever code changes are pushed.

Here are my requirements:

1. Create infrastructure for a sample microservices application with these components:
   - A few Lambda functions for different services (user service, order service, notification service)
   - API Gateway to route requests to the Lambda functions
   - DynamoDB tables for data storage
   - S3 bucket for static assets and deployment artifacts

2. Set up CI/CD pipeline infrastructure including:
   - CodePipeline for orchestrating the deployment process
   - CodeBuild projects for building and testing the application
   - CodeDeploy for deploying to Lambda functions
   - Use AWS CodeCatalyst integration if possible for unified development experience

3. Include monitoring and observability:
   - CloudWatch for logging and monitoring
   - X-Ray for distributed tracing across microservices
   - SNS for notifications about deployment status

4. Security and compliance:
   - IAM roles and policies with least privilege access
   - KMS keys for encrypting sensitive data
   - VPC endpoints for secure service communication

5. Use some of the latest AWS features:
   - AWS Infrastructure Composer integration for visual architecture management
   - CloudFormation optimistic stabilization for faster deployments

The GitHub Actions workflow should trigger the AWS CodePipeline and include automated testing steps before deployment. Make sure all resources are properly configured for the us-west-2 region and follow AWS best practices for scalability and security.

Please provide the complete Terraform infrastructure code with all necessary files.