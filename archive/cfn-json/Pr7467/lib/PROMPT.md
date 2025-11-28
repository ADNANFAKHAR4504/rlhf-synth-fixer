Create an AWS CloudFormation template in JSON for a comprehensive security configuration management solution in the us-west-1 region.

Here are the requirements for the setup:

VPC and Networking: Create a VPC with CIDR block 10.0.0.0/16. Set up public and private subnets. Configure Security Groups to allow ingress only from specified CIDR blocks. Enable VPC Flow Logs to monitor all traffic flows within the VPC.

S3 Storage: Create S3 buckets with server-side encryption enabled using KMS. Enable versioning on all S3 buckets for change tracking and secure backups.

EC2: Launch EC2 instances within the private subnets of the VPC. EC2 instances should have SSM agent installed for remote command execution.

Lambda: Create Lambda functions with public access disabled.

IAM and Security: Use IAM roles for allowing access to AWS services instead of hard-coded credentials. Define a strong password policy with minimum 12 characters requiring numbers and symbols. Ensure IAM policies do not grant full '*:*' administrative privileges. EC2 instances need an IAM role with permissions for CloudWatch, S3, and SSM.

Logging and Monitoring: Enable logging for all AWS CloudTrail trails for audit purposes. Set up CloudWatch Logs with a specified retention period.

Encryption: Use AWS KMS to manage all encryption keys for S3.

Please ensure the final JSON template is valid and would pass standard AWS CloudFormation validation tests.
