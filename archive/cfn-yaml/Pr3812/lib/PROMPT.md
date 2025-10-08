# Appointment Booking Notification System

I need to build a serverless appointment booking notification system on AWS that handles 1,900 daily scheduling requests with automated email and SMS reminders.

## Requirements

Build a CloudFormation template that creates:

1. A DynamoDB table to store appointments with the following attributes:
   - appointmentId (primary key)
   - customerEmail
   - customerPhone
   - appointmentTime
   - status
   - notificationSent

2. Lambda functions using Node.js 18 runtime for:
   - Processing appointment notifications
   - Sending email via SES
   - Sending SMS via SNS

3. EventBridge rules to trigger notifications:
   - Schedule rule to check for upcoming appointments
   - Target the Step Functions workflow

4. Step Functions state machine that:
   - Retrieves appointment details from DynamoDB
   - Uses parallel execution to send SMS and email simultaneously
   - Implements retry logic with 3 attempts for failed notifications
   - Updates appointment status in DynamoDB after successful delivery

5. SNS topic for SMS delivery

6. SES configuration for sending email notifications

7. IAM roles and policies that grant:
   - Lambda execution permissions
   - DynamoDB read/write access
   - SNS publish permissions
   - SES send email permissions
   - EventBridge invoke permissions
   - Step Functions execution permissions

8. CloudWatch log groups for monitoring Lambda functions and Step Functions

## Additional Requirements

- Use EventBridge Pipes for connecting DynamoDB Streams to Step Functions for real-time notification triggering
- Configure Lambda functions with appropriate timeout and memory settings
- Include exponential backoff in retry logic
- Set up proper error handling in Step Functions
- Use environment variables for Lambda configuration
- Deploy in us-west-2 region

Please provide the complete CloudFormation YAML template and any Lambda function code needed. Each file should be in its own code block.
