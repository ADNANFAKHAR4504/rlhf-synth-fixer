Generate infrastructure code for a software distribution platform that serves 11,300 daily downloads.

Requirements:
- Platform: Pulumi with TypeScript
- Region: us-east-1
- Purpose: Secure software distribution with usage analytics

Core Components:

1. Storage and Distribution:
   - Create an S3 bucket for binary file storage with versioning enabled
   - Configure CloudFront distribution with signed URLs for secure access
   - Set signed URL expiration to 15 minutes
   - Enable CloudFront access logs for monitoring

2. Authentication and Authorization:
   - Implement Lambda@Edge function for license verification at viewer-request event
   - Create DynamoDB table for license validation with partition key (licenseKey) and sort key (customerId)
   - Configure IAM roles for Lambda functions with least privilege access

3. API and Usage Tracking:
   - Setup API Gateway REST API for license validation endpoints
   - Create Lambda function to handle license API requests
   - Implement Lambda function for download usage tracking
   - Store download analytics in DynamoDB table with attributes: downloadId, timestamp, customerId, fileName, region

4. Monitoring:
   - Configure CloudWatch log groups for all Lambda functions
   - Create CloudWatch metrics for download counts and API requests
   - Set retention period to 7 days for logs

5. Security:
   - Use CloudFront Origin Access Control for S3 bucket access
   - Configure S3 bucket policies to allow only CloudFront access
   - Enable S3 Block Public Access settings
   - Use AWS Secrets Manager for storing CloudFront signing keys

Additional Features:
- Implement S3 Intelligent-Tiering for cost optimization on stored binaries
- Use DynamoDB Global Tables for multi-region license validation if needed in future

Generate complete Pulumi TypeScript infrastructure code that creates all these resources with proper error handling and resource dependencies. Include separate code files for each major component following Pulumi best practices.