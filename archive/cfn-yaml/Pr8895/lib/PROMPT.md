You are tasked with designing a secure AWS infrastructure using CloudFormation in YAML format. The goal is to implement Security Configuration as Code, ensuring that security best practices are consistently applied across the environment.

Your implementation must create an integrated security infrastructure where:

1. S3 buckets enforce server-side encryption using AES-256 and connect to CloudWatch Logs for access logging, with a separate S3 bucket collecting access logs.

2. IAM roles follow the principle of least privilege and are attached to EC2 Instance Profiles, granting only specific S3 and CloudWatch permissions required for application operation.

3. CloudWatch Log Groups capture logs from VPC Flow Logs, S3 access patterns, CloudTrail API activity, and application events, with IAM roles providing write access to these log groups.

4. VPC Security Groups protect the network layer by restricting inbound and outbound traffic to predefined IP addresses, applied to resources within the VPC that connects to the S3 endpoints.

5. CloudTrail writes audit logs to the encrypted S3 bucket and streams events to CloudWatch Logs through an IAM role, enabling full API activity monitoring.

Expected Output:
Provide a CloudFormation YAML template that defines this integrated infrastructure where S3 connects to CloudWatch for logging, IAM roles enable resource access, VPC security groups protect network traffic, and CloudTrail monitors all API activity. The template should be deployable as-is via the AWS CloudFormation console or CLI.
