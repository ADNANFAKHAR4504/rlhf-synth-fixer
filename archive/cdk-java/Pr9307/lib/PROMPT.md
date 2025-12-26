# Serverless Web Application Infrastructure

I need to build a complete serverless infrastructure for a web application using AWS CDK in Java. The solution needs to be production-ready and deployed in the us-west-2 region.

## Requirements

1. **Lambda Function**: Create a backend processing Lambda function with proper error handling
2. **API Gateway**: Set up REST API Gateway that triggers the Lambda function via HTTP requests
3. **DynamoDB**: Configure a DynamoDB table with provisioned capacity mode for application data storage
4. **IAM Roles**: Implement least-privilege IAM roles for Lambda execution
5. **CloudWatch**: Set up CloudWatch Logs for Lambda monitoring and alarms for error rates exceeding 1%
6. **VPC Configuration**: Deploy Lambda in private subnets within a custom VPC
7. **Environment Parameters**: Use environment-specific configuration for easy management
8. **Tagging Strategy**: Tag all resources with Environment and Project tags

## Service Connectivity

The infrastructure needs these service integration patterns:

- **API Gateway → Lambda**: REST API Gateway receives HTTP requests and invokes the Lambda function synchronously. The Lambda integration allows API Gateway to pass request data to the Lambda and return the response to clients.

- **Lambda → DynamoDB**: Lambda function connects to DynamoDB to read and write application data. The Lambda is granted specific IAM permissions for GetItem, PutItem, UpdateItem, DeleteItem, Query, and Scan operations on the table.

- **Lambda → VPC**: Lambda runs inside private subnets of the VPC, requiring VPC configuration with security groups and proper egress routes. The Lambda uses HTTPS outbound connections to access DynamoDB and other AWS services through VPC endpoints or NAT gateway.

- **Lambda → CloudWatch**: Lambda automatically sends logs to CloudWatch Logs in a dedicated log group. CloudWatch alarms monitor Lambda error metrics and trigger notifications when error rates exceed thresholds.

## Technical Specifications

- All resources must be deployed in us-west-2 region
- Lambda function should use Java 21 runtime with at least 512MB memory
- DynamoDB table should use provisioned capacity mode instead of on-demand
- API Gateway should be REST API type instead of HTTP API
- CloudWatch alarms should trigger on Lambda error rates above 1%
- VPC should have both public and private subnets across multiple AZs
- Lambda function should run in private subnets only
- Include AWS Application Insights for enhanced monitoring
- Use AWS Config for compliance monitoring

The infrastructure should be scalable and follow AWS best practices. Please provide complete CDK Java code with proper error handling and resource naming conventions.

Make sure to include stack outputs for API Gateway URL, DynamoDB table name, and Lambda function ARN for integration testing purposes.
