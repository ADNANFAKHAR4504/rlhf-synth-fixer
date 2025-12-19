# Serverless Fintech API Infrastructure

Create Terraform infrastructure code for a serverless API that processes financial transactions. The API should handle 2,000 daily transactions with secure data handling and performance monitoring.

## Requirements

Build a serverless API infrastructure with the following components:

1. **API Gateway HTTP API** - Use HTTP API instead of REST API for cost optimization. Configure with proper CORS settings and integrate with Lambda functions for transaction processing.

2. **Lambda Functions** - Create Lambda functions using Node.js 20 runtime for transaction processing. Include environment variables for configuration and proper error handling. Functions should process POST requests for new transactions and GET requests for transaction status.

3. **DynamoDB Table** - Set up a DynamoDB table for storing transaction data with:
   - Point-in-time recovery enabled
   - On-demand billing mode for cost optimization
   - Partition key: transaction_id (String)
   - Sort key: timestamp (Number)
   - Global secondary index for querying by customer_id

4. **IAM Roles and Policies** - Implement least privilege IAM roles for:
   - Lambda execution role with DynamoDB access
   - API Gateway invoke permissions for Lambda
   - CloudWatch Logs permissions

5. **CloudWatch Monitoring** - Configure:
   - Log groups for Lambda functions
   - Custom metrics for API latency
   - Alarms for error rates exceeding 1%
   - Dashboard for monitoring transaction volume

6. **Parameter Store** - Store sensitive configuration:
   - API keys as SecureString parameters
   - Database connection strings
   - Third-party service endpoints

7. **AWS Lambda Powertools** - Leverage AWS Lambda Powertools for Node.js to add structured logging, metrics, and tracing capabilities to Lambda functions for enhanced observability.

8. **EventBridge Scheduler** - Implement EventBridge Scheduler to run daily transaction summary reports and cleanup old transaction records older than 90 days.

9. **AWS X-Ray** - Implement distributed tracing across the serverless stack:
   - Enable X-Ray tracing for API Gateway to track end-to-end request flow
   - Configure Lambda functions with X-Ray SDK for detailed performance insights
   - Set up service map visualization for understanding dependencies
   - Create custom segments for business-critical operations
   - Implement AWS X-Ray's Adaptive Sampling feature (September 2025) for automatic sampling rate adjustment during anomalies

10. **AWS WAF** - Deploy Web Application Firewall for API security:
   - Create WAF WebACL with rate limiting rules (2000 requests per 5 minutes per IP)
   - Configure AWS Managed Rules for common vulnerabilities (OWASP Top 10)
   - Implement geo-blocking for high-risk countries
   - Add custom rules for SQL injection and XSS protection
   - Enable AWS WAF Bot Control with Targeted protection level (2025 enhancement) for AI bot detection
   - Set up logging to CloudWatch for security monitoring

## Implementation Details

- Region: us-west-2
- Use consistent naming convention: fintech-api-{resource}
- Add tags: Environment=Production, Project=FintechAPI, ManagedBy=Terraform
- Enable encryption at rest for all data stores
- Configure Lambda functions with 512MB memory and 30-second timeout
- Set up proper error responses and retry logic

Provide complete Terraform code including:
- main.tf with all resource definitions
- variables.tf with configurable parameters
- outputs.tf with important resource identifiers
- lambda/index.js with basic transaction processing logic