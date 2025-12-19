Serverless Image Processing System using AWS CloudFormation with YAML (single file)

A media app needs to handle 1,000 daily image uploads efficiently and store essential metadata for quick retrieval. The system must be fully serverless, offer basic monitoring, and maintain secure access controls.

Create a processing system using CloudFormation with:

    •	Amazon S3 for image uploads and secure storage
    •	AWS Lambda (Python 3.9) to process images automatically upon upload
    •	S3 Event Triggers to invoke Lambda functions when new images are added
    •	Amazon DynamoDB to store and manage image metadata
    •	Amazon CloudWatch for monitoring performance and metrics
    •	AWS IAM for secure, role-based access management
