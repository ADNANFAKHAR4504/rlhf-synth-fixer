I need to deploy a podcast hosting platform on AWS using CDK with TypeScript in the us-west-2 region. The platform serves around 6,900 daily listeners and needs to handle audio streaming with subscription management.

Here are the requirements:

1. S3 bucket for storing audio files with requester pays enabled to transfer bandwidth costs to subscribers
2. CloudFront distribution with signed cookies for subscriber authentication and content delivery
3. CloudFront KeyValueStore for caching subscriber authentication data at the edge to reduce DynamoDB calls
4. Lambda@Edge function for authorizing subscriber access that checks KeyValueStore first, then falls back to DynamoDB
5. Route 53 hosted zone for domain management
6. MediaConvert job template for transcoding audio files to multiple bitrates (64kbps, 128kbps, 256kbps)
7. EventBridge Scheduler to automate MediaConvert job submissions for scheduled podcast transcoding
8. DynamoDB table to store subscriber information with email as partition key and DynamoDB Streams enabled
9. EventBridge Scheduler rules for periodic subscriber status checks and automated cleanup of expired subscriptions
10. CloudWatch dashboard to monitor streaming metrics like request counts and bandwidth
11. IAM roles and policies for proper access control across all services

Additional requirements:
- Use CloudFront ECDSA signed cookies for better performance
- Configure S3 Intelligent-Tiering to optimize storage costs
- Create separate IAM roles for Lambda@Edge execution, MediaConvert job execution, and EventBridge Scheduler
- Set up CloudWatch alarms for high error rates
- Update the Lambda@Edge function to query CloudFront KeyValueStore first for subscriber validation before falling back to DynamoDB
- Configure DynamoDB Streams to trigger EventBridge events when subscription status changes
- Create EventBridge Scheduler schedules for automated transcoding jobs and subscription expiration handling
- Ensure EventBridge Scheduler has proper IAM permissions to invoke MediaConvert and access DynamoDB

Please provide the complete infrastructure code with one code block per file.
