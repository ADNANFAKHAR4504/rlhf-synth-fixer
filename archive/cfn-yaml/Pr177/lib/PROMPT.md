You have been tasked with setting up a secure AWS infrastructure using AWS CloudFormation. The goal is to ensure all security configurations align with the AWS CIS Foundations Benchmark. Specifically, your task includes:

1. Create an S3 bucket for logs, ensuring that the bucket access is private, versioning is enabled, and default encryption is applied.
2. Set up an IAM role for EC2, granting only the necessary permissions to write logs to the S3 bucket.
3. Configure CloudTrail to log to the S3 bucket you create. Ensure that the CloudTrail is in multi-region mode and log file validation is enabled.
4. Deploy a VPC with subnets across at least two availability zones, ensuring public, private, and isolated subnets.
5. Implement security groups that restrict traffic as per CIS benchmarks, particularly ensuring SSH access is only allowed from a limited IP range.

Expected output: A YAML-formatted CloudFormation template (named 'security_cis_benchmark.yaml') that successfully creates all defined resources and configurations when deployed. The template should pass validation tests and conform to the latest AWS best practices for security and resource naming conventions.