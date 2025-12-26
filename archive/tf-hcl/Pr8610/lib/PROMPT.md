I need to build a serverless infrastructure using Terraform for microservice applications. The requirements are:

1. Deploy AWS Lambda functions written in Python 3.8 for handling various microservice tasks
2. Create AWS API Gateway endpoints that trigger these Lambda functions via HTTP requests
3. Deploy everything in AWS us-east-1 region
4. Use secure secrets management for API keys and sensitive configuration data
5. Make the deployment repeatable and extendable for future microservices

For the Lambda functions, I want to include at least 2-3 basic microservices like:
- A health check service that returns system status
- A user management service for basic CRUD operations  
- A notification service for sending messages

Please use the latest 2025 AWS features where possible, specifically:
- API Gateway dynamic routing rules for better traffic management
- Enhanced Lambda logging capabilities with CloudWatch integration

The infrastructure should be production-ready with proper IAM roles, error handling, and security best practices. Please provide the complete Terraform infrastructure code with one code block per file.