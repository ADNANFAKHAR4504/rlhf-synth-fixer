A retail platform needs to deliver around 3,000 daily order notifications via both email and SMS. The system should be serverless, cost-efficient, and capable of tracking message delivery status.
Build a notification system using AWS CDK (TypeScript) with the following components in a single template file:

    •	SNS for message distribution and fan-out to different channels.
    •	Lambda (Node.js 18) for message formatting and event processing.
    •	SES for email notifications.
    •	DynamoDB for storing notification logs and delivery statuses.
    •	CloudWatch for tracking metrics and system performance.
    •	IAM for secure, least-privilege access control.

Ensure the system is fully serverless, easily deployable, and optimized for low operational costs.
