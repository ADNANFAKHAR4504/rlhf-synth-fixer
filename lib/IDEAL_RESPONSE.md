# Appointment Booking Notification System - CloudFormation Solution

Complete CloudFormation solution implementing a serverless appointment booking notification system with DynamoDB, Lambda, Step Functions, EventBridge, SNS, and SES. The system uses ScanCommand in the AppointmentProcessor Lambda function to properly query appointments with filtering expressions.

See `lib/TapStack.yml` for the complete infrastructure-as-code implementation. All resources are properly configured with environment suffix support, comprehensive IAM roles, error handling with retry logic, and CloudWatch logging.
