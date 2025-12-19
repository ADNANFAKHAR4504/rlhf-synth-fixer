# Build a Production-Ready Serverless API with AWS CDK (Python)

Hi, cloud expert. You did not finish the output of the infrastructure creation and in our initial conversation, you stopped at creating serverless compute stack and did not complete it. Rememeber, you are tasked with creating and deploying a complete serverless architecture that demonstrates enterprise-level best practices with aws-cdk python. You'll create a Python-based Lambda function that serves as the backbone of a data processing system, complete with API exposure, database integration, and comprehensive monitoring.
## What to do:
Create a RESTful API service that handles CRUD operations with the following architecture:
- **API Gateway** → **Lambda (Python)** → **DynamoDB**
- Everything deployed via **CDK Python** in **us-east-1**
- Full monitoring with **CloudWatch** and **S3** log storage

## Key Requirements

### Infrastructure (CDK Stack)
- VPC with 2+ subnets across availability zones
- Lambda function with VPC access for network isolation
- DynamoDB table with on-demand billing
- API Gateway with REST endpoints and CORS enabled
- S3 bucket for log archival
- Parameter Store for secrets/config
- CloudWatch alarms and dashboard

### Lambda Function
Write a Python handler that:
- Processes API Gateway events (GET, POST, PUT, DELETE)
- Performs DynamoDB CRUD operations with retry logic
- Uses environment variables (table name, bucket name)
- Implements proper error handling and logging
- Retrieves sensitive data from Parameter Store

### Security & Best Practices
- IAM roles with least privilege
- Encryption at rest for all storage (DynamoDB, S3)
- VPC security groups properly configured
- API Gateway caching enabled
- CloudWatch alarm when errors exceed threshold
- S3 lifecycle policies for log retention

### Monitoring Setup
- CloudWatch Logs with appropriate retention
- Custom metrics for business logic
- Dashboard with key performance indicators
- Error rate alarms with SNS notifications

Ensure to output all resources created.