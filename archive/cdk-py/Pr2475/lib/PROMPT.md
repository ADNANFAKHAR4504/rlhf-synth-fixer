You need to design a serverless data processing pipeline using the AWS CDK in Python. The system should have:
An S3 bucket (with versioning turned on) that triggers a Lambda function when a new object is uploaded.
The Lambda processes the file and writes metadata into a DynamoDB table (use on-demand capacity mode).
The Lambda should use IAM roles with least-privilege access (read from S3, write to DynamoDB).
Pass DynamoDB table info to the Lambda via environment variables.
Enable CloudWatch logging, set the Lambda timeout to 15 seconds, and keep memory ≤ 256 MB.
Add resource tags: Environment=Production and Project=DataPipeline.
Output the S3 bucket name/URL as a stack output.
The entire stack must deploy to us-east-1 using CDK Python. Make sure the code follows best practices and synthesizes without errors.