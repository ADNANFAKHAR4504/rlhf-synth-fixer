# Serverless Infrastructure with API Gateway, Lambda, and DynamoDB

I need to create a serverless infrastructure on AWS using Pulumi with TypeScript. The solution should implement a complete serverless API with the following components:

## Requirements

1. **API Gateway**: Create an HTTP API Gateway to serve REST requests with proper CORS configuration
2. **Lambda Function**: Deploy a Lambda function that handles HTTP requests from API Gateway, with runtime optimizations
3. **DynamoDB Table**: Set up a DynamoDB table for data storage with on-demand billing and warm throughput capabilities
4. **IAM Security**: Implement secure IAM roles following least privilege principles

## Technical Specifications

- **Region**: us-east-1
- **Platform**: Pulumi with TypeScript
- **Lambda Runtime**: Node.js 20.x latest supported version
- **DynamoDB**: Use on-demand billing mode with warm throughput for performance optimization
- **API Gateway**: Use HTTP API v2 for better performance and cost efficiency

## Security Requirements

- Lambda execution role with minimal DynamoDB permissions: GetItem, PutItem, UpdateItem, and DeleteItem
- API Gateway integration role to invoke Lambda function
- All IAM policies should follow least privilege principle
- No wildcard permissions allowed

## Performance Considerations

- Configure DynamoDB with warm throughput to handle traffic spikes effectively
- Use Lambda Application Signals for performance monitoring
- Implement proper error handling and logging

## Code Structure

Please provide infrastructure code with one code block per file. The solution should be production-ready and include:
- Complete Pulumi TypeScript infrastructure code
- Proper resource naming and tagging
- Lambda function source code included inline
- All necessary IAM roles and policies
- API Gateway integration with Lambda
- DynamoDB table configuration

The infrastructure should be ready to deploy and handle basic CRUD operations on the DynamoDB table through the API Gateway endpoints.