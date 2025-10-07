Create infrastructure code in CDKTF Python for a container registry system in AWS us-east-2 region that handles 8,900 daily image pushes.

Requirements:
- ECR repository with image scanning enabled on push
- Lambda function to process ECR scan results and extract vulnerability data
- EventBridge rule to capture ECR scan completion events and trigger Lambda
- SNS topic for security alerts when critical vulnerabilities are detected
- DynamoDB table to store image metadata including scan results and push timestamps
- CloudWatch dashboard to monitor registry metrics like push count and scan status
- IAM roles and policies for Lambda to access ECR, DynamoDB, and SNS
- ECR lifecycle policy to retain only the last 30 images per repository

The Lambda function should:
- Parse ECR scan results from EventBridge events
- Store image metadata and vulnerability counts in DynamoDB
- Send SNS notifications for images with critical vulnerabilities

Use AWS EventBridge Scheduler for periodic cleanup tasks and consider implementing ECR pull through cache rules for commonly used base images to optimize pull performance.

Provide the complete infrastructure code with all resources properly configured and connected.