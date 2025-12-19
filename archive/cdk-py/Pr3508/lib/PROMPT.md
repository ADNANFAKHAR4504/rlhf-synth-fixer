Create AWS infrastructure code using CDK Python for a gift card redemption platform in us-west-2 region.

The platform needs to handle 3,900 daily gift card redemptions with balance tracking and fraud detection capabilities.

Requirements:
- API Gateway REST API endpoint for gift card redemption requests
- Lambda function using Python 3.11 runtime to process redemptions
- DynamoDB table configured with transactions enabled for atomic balance updates
- AWS Fraud Detector integration for real-time transaction validation
- SNS topic to send notifications for successful redemptions
- CloudWatch metrics and alarms to monitor transaction volumes and errors
- Secrets Manager to store encryption keys for sensitive data
- IAM roles and policies with least privilege access

Technical specifications:
- Implement idempotency tokens in the redemption API to prevent duplicate processing
- Use DynamoDB transactions to ensure atomic balance updates
- Configure auto-scaling for Lambda concurrency based on load
- Set up CloudWatch dashboard for monitoring key metrics
- Enable API Gateway request validation and throttling
- Include DynamoDB global secondary index for querying by customer ID

Additional features:
- Use AWS AppConfig for feature flags to enable/disable fraud detection
- Implement AWS X-Ray tracing for end-to-end request monitoring

Generate infrastructure code for lib/tap_stack.py including all AWS resources and their configurations. Also create Lambda handler code for gift card redemption logic in lib/lambda/redemption_handler.py.