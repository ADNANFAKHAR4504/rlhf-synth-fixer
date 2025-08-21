You are tasked with designing a secure AWS infrastructure using CloudFormation in YAML format. The goal is to implement Security Configuration as Code, ensuring that security best practices are consistently applied across the environment.

Your implementation must meet the following requirements:

    1.	All S3 buckets created within the stack must enforce server-side encryption using AES-256 to protect against unauthorized data access.
    2.	IAM roles should follow the principle of least privilege, granting only the specific permissions required for the application’s operation (read and write as defined by the application needs).
    3.	CloudWatch logging must be enabled for all AWS resources defined in the stack, ensuring that access and configuration changes are monitored and auditable.
    4.	VPC Security Groups must be configured to restrict both inbound and outbound traffic to a predefined set of IP addresses, thereby strengthening network security controls.

Expected Output:
Provide a CloudFormation YAML template that defines this infrastructure. The template should be deployable as-is via the AWS CloudFormation console or CLI and must ensure compliance with all the requirements listed above.
