Serverless Image Upload Processing System using AWS CloudFormation with YAML (single file)

A media app needs to handle 2,000 daily image uploads efficiently while notifying users when uploads are processed. The system must be fully serverless, cost-effective, and include basic monitoring for visibility.

Create a processing system using CloudFormation with:

    •	Amazon S3 for secure and scalable image storage
    •	AWS Lambda (Node.js 18) to process uploaded images automatically
    •	S3 Event Triggers to invoke Lambda functions upon image upload
    •	Amazon SNS to send user notifications after processing
    •	Amazon CloudWatch for system metrics and performance tracking
    •	AWS IAM for secure, least-privilege access management
