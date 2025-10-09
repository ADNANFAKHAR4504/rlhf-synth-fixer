Create a serverless polling system using AWS CDK with TypeScript for the us-west-2 region. The application needs to handle 4,200 daily votes with real-time result aggregation and fraud prevention.

Requirements:

1. API Gateway REST API with API keys and usage plans for rate limiting at 10 requests per minute per user
2. Lambda function using Python 3.11 runtime for processing vote submissions
3. DynamoDB table with conditional writes to prevent duplicate votes and enable point-in-time recovery
4. DynamoDB Streams on the votes table for real-time aggregation
5. Lambda function for processing stream records to calculate and aggregate voting results
6. S3 bucket to store periodic result snapshots with versioning enabled
7. CloudWatch alarms for monitoring vote submission rates and error rates
8. IAM roles and policies following least privilege principle

Technical specifications:

- Use ReturnValuesOnConditionCheckFailure parameter in DynamoDB conditional writes for better error handling
- Configure API Gateway usage plans with method-level throttling
- Enable DynamoDB point-in-time recovery for data protection
- Set up CloudWatch metrics for tracking vote counts and failed attempts
- Implement proper error handling and logging in Lambda functions
- Use environment variables for configuration values

The infrastructure should be production-ready with proper naming conventions and resource tagging.
