Create infrastructure code using Pulumi Python for an image optimization service in AWS us-west-1 region.

The service needs to handle 7,800 daily image uploads with automatic format conversion and compression.

Requirements:
- Create S3 buckets for raw uploads and optimized images storage with separate buckets for WebP, JPEG, and PNG formats
- Deploy a Lambda function using Python 3.11 runtime to process images
- Configure S3 event notifications on the upload bucket to trigger the Lambda function
- Set up CloudFront distribution for optimized image delivery with 30-day cache TTL
- Create a DynamoDB table to store image metadata including original filename, upload timestamp, file sizes, and conversion status
- Implement CloudWatch metrics for monitoring processing times and success rates
- Configure IAM roles and policies for Lambda to access S3, DynamoDB, and CloudWatch

The Lambda function should:
- Receive S3 PUT event notifications
- Download the original image from S3
- Generate optimized versions in WebP, JPEG, and PNG formats
- Upload optimized versions to their respective S3 buckets
- Record metadata in DynamoDB
- Log metrics to CloudWatch

Include AWS Lambda Snapstart for reduced cold starts and S3 Transfer Acceleration on the upload bucket for faster uploads.

Provide the infrastructure code in separate Python files following Pulumi best practices.