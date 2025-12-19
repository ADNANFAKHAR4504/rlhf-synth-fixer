# Referral Management System Infrastructure

Create infrastructure code for a referral program that processes 4,100 daily sign-ups with reward calculations and monthly payout processing.

## Requirements

Build a serverless referral management system in us-east-2 region with the following components:

1. **API Gateway** - REST API endpoint to receive sign-up events with referral codes
2. **Lambda Function (Reward Calculator)** - Node.js 20 function to calculate rewards based on referral tiers
3. **DynamoDB Table** - Store referral data with transactions for atomic reward updates
4. **EventBridge Scheduled Rule** - Trigger monthly payout processing on the 1st of each month
5. **Lambda Function (Payout Processor)** - Node.js 20 function to process monthly payouts with idempotency
6. **SNS Topic** - Send notifications when rewards are credited or payouts are processed
7. **S3 Bucket** - Store monthly payout reports in CSV format
8. **CloudWatch Dashboard** - Monitor sign-ups, rewards calculated, and payouts processed
9. **IAM Roles** - Least privilege access for Lambda functions

## Implementation Details

- DynamoDB table should have a partition key for user_id and sort key for referral_timestamp
- Use DynamoDB transactions to ensure atomic updates when calculating rewards
- Implement idempotency in the payout processor using a DynamoDB table to track processed payouts
- Lambda functions should use AWS SDK v3 for better performance
- Enable X-Ray tracing on Lambda functions for debugging
- Use CloudWatch Logs retention of 7 days to minimize costs
- S3 bucket should have lifecycle policy to transition reports to Glacier after 90 days

## AWS Features to Include

- Use Lambda SnapStart for Java functions to reduce cold start latency (if applicable)
- Implement API Gateway request validation to ensure proper input format

Provide the complete infrastructure code in CDKTF TypeScript format with all necessary Lambda function code included.