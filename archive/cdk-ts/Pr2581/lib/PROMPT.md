Write a single TypeScript file using the AWS CDK that defines a CloudFormation stack to provision a secure and scalable infrastructure. The solution should be deployable in the us-east-1 region and must include the following components and security measures:

    1.	A custom VPC where EC2 instances are launched.
    2.	EC2 instances that assume an IAM role with least-privilege permissions.
    3.	An Auto Scaling Group for EC2 instances to handle variable load.
    4.	An S3 bucket configured with server-side encryption using SSE-S3 and public access blocked.
    5.	An RDS database instance with encryption enabled, automated backups turned on, and deletion protection enabled.
    6.	Parameter Store entries for storing and retrieving sensitive configuration data.
    7.	An SNS topic for application log publishing.
    8.	A CloudWatch alarm that monitors security group changes and sends notifications to the SNS topic.
    9.	An IAM account policy that enforces MFA for console users.
    10.	A Lambda function with its own execution role, restricted with an inline IAM policy written in JSON, granting only the runtime permissions it needs.
    11.	All IAM policies authored in JSON (not inline helper constructs).

Deliverable
• A single TypeScript file that defines the full CDK stack with all of the above resources.
• Inline comments explaining the security best practices applied.
• The stack must be directly deployable with cdk deploy.
