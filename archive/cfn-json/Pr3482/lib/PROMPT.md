# Appointment Scheduler Infrastructure

Create CloudFormation infrastructure code in JSON format for an appointment scheduling service.

## Requirements

Build an appointment scheduling system that handles 3,500 daily calendar appointments with conflict detection and reminder notifications. The system should be deployed in us-east-1 region.

## Architecture Components

1. **API Gateway**: REST API to handle appointment booking requests
2. **Lambda Functions**:
   - Conflict detection function (Python 3.11) to check for appointment overlaps
   - Reminder notification function (Python 3.11) to send appointment reminders
3. **DynamoDB Table**: Store appointments with conditional writes to prevent double-booking
4. **EventBridge**: Schedule rules for appointment reminders (24-hour and 1-hour before appointments)
5. **SNS Topic**: Send notification messages to users
6. **CloudWatch**: Monitor booking metrics and system performance
7. **IAM Roles**: Service permissions for Lambda functions to access DynamoDB, EventBridge, and SNS.

## Technical Specifications

- Use DynamoDB conditional writes to ensure no double-booking occurs
- Implement EventBridge rules that dynamically schedule reminders for each appointment
- Configure two reminder notifications: 24 hours before and 1 hour before each appointment
- Include CloudWatch metrics for tracking booking success/failure rates
- Ensure Lambda functions have appropriate IAM permissions for all required services

## Implementation Details

Please provide infrastructure code that includes:
- CloudFormation template in JSON format (file: TapStack.json)
- Lambda function code for conflict detection (file: conflict_detector.py)
- Lambda function code for reminder sender (file: reminder_sender.py)

The infrastructure should be production-ready with proper error handling and monitoring capabilities.
