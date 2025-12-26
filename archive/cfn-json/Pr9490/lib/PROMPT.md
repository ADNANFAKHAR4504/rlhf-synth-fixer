Create infrastructure code in CloudFormation JSON format for a healthcare appointment reminder system that sends SMS notifications to patients.

Requirements:
1. Set up an SNS topic configured for SMS messaging that connects to Lambda for sending appointment reminders to 2500 patients daily
2. Create a Lambda function in Python 3.9 that reads appointment data, triggers SMS notifications through SNS, and writes delivery logs to DynamoDB
3. Implement a DynamoDB table that stores all SMS delivery attempts with fields for patient ID, phone number, message content, delivery status, timestamp, and retry count
4. Configure CloudWatch metrics that integrate with Lambda and SNS to track SMS delivery success rates with alarms when failure rate exceeds 5%
5. Set up SES integrated with Lambda for email fallback when SMS delivery fails after 3 retry attempts
6. Create IAM roles that grant Lambda access to SNS for messaging, DynamoDB for logging, CloudWatch for metrics, and SES for email fallback
7. Include CloudWatch query alarms to monitor individual SMS delivery metrics
8. Add AWS End User Messaging SMS integration for enhanced SMS resource management and centralized billing

Technical requirements:
- Use us-west-1 region
- Lambda function should handle batch processing of appointments
- DynamoDB table should use on-demand billing mode
- Include error handling and retry logic in Lambda
- Set up CloudWatch logs for Lambda function debugging
- Configure SNS SMS preferences for transactional messages
- Create SES email template for fallback notifications

Provide the complete infrastructure code with one code block per file:
1. CloudFormation template in TapStack.json
2. Lambda function code in notification_handler.py