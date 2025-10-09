Create infrastructure code using CDKTF with TypeScript for a loyalty program system in AWS us-west-2 region.

The system should include:

1. API Gateway REST API to handle loyalty transactions from partners
2. Lambda function using Node.js 20 runtime for calculating loyalty points based on transaction amounts
3. DynamoDB table for storing member accounts with Global Secondary Index for email lookups
4. DynamoDB transactions for atomic updates when adding or deducting points
5. DynamoDB Streams enabled on the member table to track changes
6. Lambda function to process stream records and check for tier upgrades
7. SNS topic for member notifications with email and SMS subscriptions
8. CloudWatch dashboard to monitor transaction volumes and point redemptions
9. IAM roles with least privilege for Lambda functions and partner API access

Requirements:
- DynamoDB table should have partition key as memberId and sort key as transactionId
- Use DynamoDB transactions to ensure atomic updates for point balance changes
- Stream processing Lambda should trigger when point balance crosses tier thresholds
- Implement EventBridge Scheduler for periodic tier review process
- SNS should support both email and SMS protocols
- API Gateway should have request validation and throttling configured
- Include CloudWatch alarms for high transaction volumes and failed transactions

Please provide the complete infrastructure code as separate code blocks for each file needed.