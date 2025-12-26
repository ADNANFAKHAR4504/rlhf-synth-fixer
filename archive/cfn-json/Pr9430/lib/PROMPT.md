Create infrastructure code in CloudFormation JSON format for a healthcare appointment reminder system that sends SMS notifications to patients.

Requirements:
1. Set up an SNS topic configured for SMS messaging to send appointment reminders to 2500 patients daily
2. Create a Lambda function in Python 3.9 that processes appointment data and publishes messages to SNS for SMS delivery
3. Implement a DynamoDB table where Lambda writes logs for all SMS delivery attempts with fields for patient ID, phone number, message content, delivery status, timestamp, and retry count
4. Configure CloudWatch metrics to track SMS delivery success rates and failures with alarms that trigger when failure rate exceeds 5%
5. Set up SES email template that Lambda invokes as fallback when SMS delivery fails after 3 retry attempts
6. Create IAM roles that grant Lambda specific permissions to publish to SNS, write to DynamoDB, put metric data to CloudWatch, and send templated emails via SES
7. Include CloudWatch query alarms to monitor individual SMS delivery metrics
8. Add AWS End User Messaging SMS integration for enhanced SMS resource management and centralized billing

Technical requirements:
- Use us-west-1 region
- Lambda function should handle batch processing of appointments
- DynamoDB table should use on-demand billing mode
- Include error handling and retry logic in Lambda
- Set up CloudWatch logs for Lambda function debugging
- Configure SNS SMS preferences for transactional messages

Provide the complete infrastructure code with one code block per file:
1. CloudFormation template - TapStack.json
2. Lambda function code - notification_handler.py