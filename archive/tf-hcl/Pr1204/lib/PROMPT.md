I need help setting up a secure data storage environment on AWS using Terraform HCL. This infrastructure needs to be deployed in the us-west-2 region and must follow strict security guidelines.

The environment should include:
- S3 buckets with AES-256 encryption enabled
- Access restricted to specific IP address ranges only
- CloudTrail logging for all AWS API calls
- IAM roles instead of hardcoded access keys
- Minimal necessary permissions following least privilege principle
- S3 bucket versioning enabled for data history
- CloudWatch alarms that trigger on IAM permission changes
- SNS topic to notify security team of IAM role changes

Please include these latest AWS features in the solution:
- AWS Security Hub integration for centralized security monitoring
- CloudWatch AI-powered observability features for enhanced monitoring

Generate the complete Terraform infrastructure code. Provide one code block per file that needs to be created.