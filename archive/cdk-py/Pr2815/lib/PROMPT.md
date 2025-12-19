## AWS CDK Serverless Infrastructure Challenge

As an AWS Cloud infrastructure expert, you're tasked with building a production-ready serverless application infrastructure on AWS using the CDK with Python. Your company needs an automated file processing system that triggers whenever new files are uploaded to cloud storage. The system must be secure, monitored, and follow infrastructure-as-code best practices. You'll be using AWS CDK in Python to programmatically define all the cloud resources needed.

### Core Requirements

**Infrastructure:**
- Build everything using AWS CDK with Python
- Deploy all resources to the us-east-1 region
- Tag every resource with 'Environment: Production' for cost tracking and governance

**The Processing Function:**
- Create a Lambda function running Python 3.8
- Set the function timeout to exactly 15 seconds (not the default 3 seconds)
- The function should activate automatically when files are uploaded to S3

**Storage Configuration:**
- Set up an S3 bucket for file storage
- Configure the bucket to send notifications to Lambda whenever someone uploads a new file (PUT events)
- Create a bucket policy that explicitly allows your Lambda function to read objects from this bucket

**Security & Permissions:**
- Design an IAM role for the Lambda function with these specific permissions:
  - Read access to objects in your S3 bucket
  - Write access to CloudWatch Logs for debugging and monitoring
- Nothing more, nothing less - follow the principle of least privilege

**Monitoring & Alerting:**
- Set up CloudWatch Alarms that watch for Lambda function errors
- When errors are detected, the alarm should trigger an SNS notification
- Configure the SNS topic with encryption using an AWS-managed CMK (Customer Master Key) for security compliance

### Technical Constraints
1. Must use AWS CDK-python
2. All IAM policies should be attached properly to the Lambda's execution role
3. The S3 event notification configuration must specifically filter for PUT events only
4. CloudWatch Alarms should monitor the Lambda's error metric specifically
5. SNS encryption must use AWS-managed keys, not customer-managed keys

Your solution should:
- Includes proper resource dependencies and relationships
- Sets up the entire event flow from S3 upload → Lambda trigger → CloudWatch logging → Error monitoring → SNS alerts
- Deploy all resources with correct configurations
- Have Lambda automatically trigger on file uploads to S3
- Send notifications through encrypted SNS when Lambda errors occur
- Pass validation that the bucket name is unique before creation
- Show all resources properly tagged in the AWS Console
- Outputs all resources created.