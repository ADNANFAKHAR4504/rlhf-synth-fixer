# Shipment Tracking System Infrastructure

I need help building a serverless shipment tracking system on AWS using CDK with TypeScript. The system needs to handle about 5,900 daily shipment status updates and send real-time notifications to customers.

## Architecture Requirements

The system should include:

1. A REST API endpoint that receives shipment status updates
2. A Lambda function (Node.js 18) to process incoming status updates and store them in DynamoDB
3. DynamoDB table with Streams enabled to capture all changes
4. A Lambda function that processes the DynamoDB Stream events
5. SNS topic for sending customer notifications (both SMS and email)
6. SQS queue to buffer notification requests before sending
7. WebSocket API for real-time tracking updates to customers
8. CloudWatch alarms to monitor notification delivery metrics
9. All necessary IAM roles and permissions

## Specific Requirements

- Deploy everything in us-east-1 region
- Use DynamoDB on-demand billing mode for cost efficiency
- Enable DynamoDB Streams with NEW_AND_OLD_IMAGES view type
- Configure the stream processing Lambda with an S3 failure destination for better error handling
- The WebSocket API should have routes for $connect, $disconnect, and $default
- Set up CloudWatch alarms for SQS queue depth and SNS delivery failures
- Make sure Lambda functions have proper environment variables for the resources they need to access
- Include X-Ray tracing for observability

## Code Structure

Please provide the infrastructure code in separate files:
- Main stack implementation
- Lambda function code for processing status updates
- Lambda function code for processing DynamoDB streams
- Lambda function code for WebSocket connection management

Each code block should be complete and ready to use.
