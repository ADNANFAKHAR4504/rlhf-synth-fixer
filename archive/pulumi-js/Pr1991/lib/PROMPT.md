# AWS Serverless Infrastructure with Pulumi JavaScript

I need to create a serverless infrastructure using Pulumi JavaScript for AWS. The system should consist of multiple Lambda functions that are triggered by S3 bucket events and exposed through API Gateway.

## Requirements

1. **Region**: Deploy all resources in us-east-1
2. **S3 Integration**: Create an S3 bucket that triggers Lambda functions on object creation events
3. **Lambda Functions**: Create at least 2-3 Lambda functions with different purposes (e.g., image processing, data validation, notification)
4. **API Gateway**: Set up API Gateway to expose Lambda functions as REST endpoints
5. **IAM Roles**: Configure proper IAM roles and policies for Lambda execution and S3 access
6. **Environment Variables**: Set runtime configuration through environment variables
7. **Resource Tagging**: Tag all resources for cost tracking and management
8. **Fault Tolerance**: Implement retry mechanisms and dead letter queues for Lambda functions
9. **CloudWatch Logs**: Enable logging and monitoring for all Lambda functions
10. **Outputs**: Provide clear outputs for API endpoint URLs and Lambda function ARNs

## Latest AWS Features to Include

- Use Lambda response streaming capabilities for functions that might return larger payloads
- Configure CloudWatch Application Signals for enhanced monitoring and observability

## Architecture Goals

- Cost-effective and scalable design
- Follow AWS serverless best practices
- Implement proper error handling and monitoring
- Use minimal resource configuration to reduce deployment time

Please provide the complete Pulumi JavaScript infrastructure code. Structure the code with one file per logical component and ensure all resources are properly configured for a production-ready serverless application.