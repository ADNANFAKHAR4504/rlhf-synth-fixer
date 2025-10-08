Create infrastructure code using AWS CDK in Java for a URL shortener service that processes 7,100 daily short link creations. The infrastructure should be deployed in us-west-1 region.

Requirements:
- API Gateway REST API for URL shortening endpoints with /shorten (POST) and /{shortId} (GET) resources
- Lambda function in Java 17 runtime for URL generation logic with environment variables for DynamoDB table name
- DynamoDB table with shortId as partition key and TTL enabled on expiresAt attribute for automatic link expiration after 30 days
- CloudFront distribution for redirect caching with 1-hour TTL and custom error pages
- Lambda@Edge function for click tracking and geographic analytics at viewer-request event
- S3 bucket for storing analytics data with lifecycle policy to transition to Glacier after 90 days
- CloudWatch dashboard displaying API requests, Lambda invocations, DynamoDB throttles, and CloudFront cache hit ratio
- IAM roles with least privilege access for Lambda functions to access DynamoDB and S3
- Enable AWS X-Ray tracing for Lambda functions
- Use Application Insights for monitoring application performance
- AWS WAF WebACL attached to API Gateway with rate-based rules limiting 100 requests per 5 minutes per IP and geographic restrictions blocking high-risk countries
- EventBridge scheduled rule triggering every 6 hours to invoke a Step Functions state machine that orchestrates expired link cleanup, sends notifications via SNS when links expire, and archives analytics data

Provide the complete infrastructure code with one code block per file needed. Include proper error handling and resource tagging with Environment and Application tags.