I need help setting up AWS infrastructure for a healthcare application that processes patient data. The application needs to work across multiple regions for high availability.

I want to deploy several Lambda functions that handle patient data processing, send notifications, and run analytics. The system should use DynamoDB for data storage and include SNS for notifications and SQS for queuing background tasks.

Could you create CDK TypeScript infrastructure code that includes:

1. Lambda functions for processing patient data, notifications, and analytics
2. DynamoDB tables for storing healthcare data  
3. SNS topics for sending notifications
4. SQS queues for background task processing
5. Proper IAM roles with minimal permissions for each service
6. Support for deploying to multiple AWS regions

I want to use some of the newer AWS features like Lambda Response Streaming for better performance and EventBridge Scheduler for coordinating tasks.

The infrastructure needs to follow healthcare compliance best practices and be ready for production use. Please provide the complete CDK TypeScript code to deploy this serverless architecture.