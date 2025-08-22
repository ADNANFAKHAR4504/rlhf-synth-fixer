We need a CloudFormation template for a secure AWS logging infrastructure.

Requirements:

Create an S3 bucket for storing confidential logs. The bucket must block all public access and encrypt all objects using S3 server-side encryption (SSE-S3).

Set up a Lambda function to process the logs from the S3 bucket. This function needs minimal IAM permissions - only what's required for S3 access and basic Lambda execution.

Deploy an RDS MySQL database to store the processed log data. The database cannot be accessible from the internet and must use KMS encryption for data at rest. Access should be restricted through VPC security groups.

All resources must be tagged with Project: SecurityConfig.

Deploy everything in the us-east-1 region within a dedicated VPC using the 10.0.0.0/16 CIDR block.

The final deliverable should be a working CloudFormation template named TapStack.yml.
