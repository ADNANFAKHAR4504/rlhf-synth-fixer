Create infrastructure code for a price monitoring service that tracks 5,300 daily product prices from multiple retailers in us-east-1.

The system should have the following components:

1. Scheduled price scraping using EventBridge rules that trigger every 6 hours
2. Lambda function in Python 3.10 for web scraping with exponential backoff retry logic
3. DynamoDB table to store current prices and price history with DynamoDB Streams enabled
4. Lambda function to process DynamoDB Streams and detect price changes
5. SNS topic for sending price drop notifications
6. SQS queue for managing scraping jobs with visibility timeout and dead letter queue
7. S3 bucket for storing historical price data archives
8. CloudWatch metrics for monitoring scraping success rates and price change frequency
9. IAM roles with least privilege access for Lambda functions

Include the following AWS features:
- Use EventBridge Scheduler for more flexible scheduling options introduced in 2022
- Enable DynamoDB Point-in-time Recovery for data protection

The infrastructure should handle 5,300 products efficiently with proper error handling and monitoring.

Generate the complete infrastructure code using CDKTF with TypeScript. Provide one code block per file including all Lambda function implementations.