I need you to create CloudFormation infrastructure code in JSON format for a healthcare appointment notification system that sends 2,300 daily SMS confirmations in the us-west-1 region.

The system should include:

1. An SNS topic configured for SMS message delivery with appropriate settings for high volume messaging
2. A Lambda function in Python 3.10 that processes appointment data and sends notifications via SNS
3. A DynamoDB table to log all notification attempts with attributes for tracking delivery status, timestamps, and patient identifiers
4. CloudWatch metrics and alarms to monitor SMS delivery rates and Lambda errors
5. An SES configuration as a fallback mechanism for email notifications when SMS fails
6. IAM roles with least privilege access for Lambda to interact with SNS, DynamoDB, SES, and CloudWatch

Requirements:
- The Lambda should handle batch processing of appointments efficiently
- Include error handling and retry logic in the Lambda function
- DynamoDB should have on-demand billing mode for cost optimization
- Set up CloudWatch alarms for failed deliveries exceeding 5% threshold
- Configure SNS with appropriate spend limits and delivery status logging
- Use AWS EventBridge Lambda Insights for enhanced monitoring capabilities
- Implement SES domain verification placeholder for email fallback
- Include appropriate tags for resource management

Please provide the complete CloudFormation template in JSON format and a separate Python 3.10 Lambda function code that processes the notifications. Each file should be in its own code block.