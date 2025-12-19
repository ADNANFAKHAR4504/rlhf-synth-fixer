Build a push notification system infrastructure for a mobile backend supporting 14,700 daily active users across iOS and Android platforms in us-east-2.

The system needs to handle platform-specific push notifications with SNS for managing APNS and FCM endpoints, Amazon Pinpoint for advanced user segmentation and campaign management, Lambda functions to process notifications with retry logic for failed deliveries, DynamoDB to store device tokens and user preferences, EventBridge Scheduler for automated campaign scheduling, CloudWatch for monitoring delivery metrics and success rates, S3 for storing campaign analytics data, and IAM roles with least privilege access for all services.

Requirements:
- Configure SNS platform applications for APNS (iOS) and FCM (Android) with proper authentication
- Set up Pinpoint project with segments for user targeting based on device type and preferences
- Create Lambda function with exponential backoff retry logic for failed notification deliveries
- Design DynamoDB table with device tokens, user IDs, platform type, and notification preferences
- Implement EventBridge Scheduler rules for recurring campaign notifications
- Configure CloudWatch dashboard with delivery metrics, failure rates, and latency monitoring
- Create S3 bucket with lifecycle policies for campaign analytics storage
- Set up IAM roles and policies following least privilege principle for service interactions
- Include CloudWatch Logs for Lambda function debugging
- Add SNS dead letter queue for handling failed notifications
- Implement EventBridge Pipes to connect DynamoDB streams with SNS for real-time updates
- Use optimistic stabilization for faster stack deployment

Generate the complete CloudFormation template in JSON format with all resources properly configured and connected.