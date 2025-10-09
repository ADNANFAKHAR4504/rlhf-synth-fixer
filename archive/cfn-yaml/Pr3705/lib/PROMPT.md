A media app needs to handle 1,500 daily video uploads efficiently while sending upload notifications to users. The system must be fully serverless, cost-efficient, and provide basic monitoring for operational visibility.

Create a processing system using CloudFormation with:

    •	Amazon S3 for secure video uploads and storage
    •	AWS Lambda (Node.js) to process videos on upload
    •	S3 Event Triggers to automatically invoke Lambda functions
    •	Amazon SNS to send upload status notifications
    •	Amazon CloudWatch for tracking metrics and performance
    •	AWS IAM for secure and role-based access control
