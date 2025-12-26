Media Storage System using AWS CloudFormation with YAML

Need a serverless media storage system for a client handling 2,000 daily image uploads. The setup should be cost-efficient and fully automated.

**Architecture Flow:**

User uploads an image to S3 bucket, which has EventBridge notifications turned on. When S3 receives a new object, EventBridge automatically fires an event. This event triggers the ImageProcessor Lambda function that reads the image metadata from S3 and writes structured records to DynamoDB. The table has a GSI on uploadedBy and uploadDate so users can quickly find all their uploads.

There's also an ImageRetriever Lambda that generates pre-signed S3 URLs when someone wants to view images. It queries DynamoDB by user ID or image ID and returns URLs that expire after an hour.

CloudWatch dashboard shows bucket metrics and Lambda invocation counts. Set up alarms that trigger if the Lambda error rate spikes.

**IAM Setup:**

Lambda role needs least-privilege access - just GetObject and PutObject for S3, plus PutItem and Query for DynamoDB. No wildcard permissions. S3 bucket policy allows the Lambda role to access uploaded objects.

**Technical Requirements:**
- Single CloudFormation YAML template  
- EventBridge integration for S3 object creation events
- DynamoDB GSI for efficient user-based queries
- Lambda functions using Node.js 20.x with inline code
- CORS on the bucket for web uploads
- S3 lifecycle rule to move to Infrequent Access after 90 days
- EnvironmentSuffix parameter for dev/test/prod deployments
- DeletionPolicy on all resources for LocalStack cleanup

Stack should deploy cleanly to LocalStack for local testing before AWS.
