
You are tasked with developing a secure serverless infrastructure for an AWS Lambda application deployed inside a dedicated VPC. The deployment should meet the following security and logging requirements:

Logging Requirements:

Enable logging for every Lambda invocation.

Store the logs in Amazon CloudWatch Logs with a retention period of 15 days.

Persist the logs in an existing S3 bucket: lambda-logs-bucket.

IAM Security Requirements:

Review and refine IAM roles associated with the Lambda functions.

Ensure least privilege principle: IAM roles should not provide more permissions than required for their specific task.

Deployment Environment:

Deploy in the us-east-1 AWS region.

Use a pre-existing VPC with ID: vpc-123abcde.

Use the existing S3 bucket: lambda-logs-bucket.

Constraints Set CloudWatch Log retention to exactly 15 days.

Use only necessary permissions in IAM policies attached to Lambda roles.

Do not create unnecessary resources outside the scope of this security-focused setup.

Expected Output A single YAML file containing the complete CloudFormation template.

The template must:

Define all necessary resources to meet the requirements.

Reference the existing VPC and S3 bucket.

Include proper metadata, log groups, IAM roles/policies, and Lambda function definition.

Add inline comments to explain critical sections.

Provide deployment verification steps that confirm:

Logging to CloudWatch and S3 is working as intended.

IAM permissions are properly scoped and do not allow excessive access.
