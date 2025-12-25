Create an AWS CloudFormation template in YAML (secure-setup.yml) that provisions a secure AWS environment for handling sensitive enterprise data. The template must meet the following requirements:

    1.	Define IAM roles and policies following the principle of least privilege.
    2.	Use AWS Key Management Service (KMS) for encrypting sensitive data across all applicable resources.
    3.	Configure all S3 buckets to be private by default and prevent any public access misconfigurations.
    4.	Enforce Multi-Factor Authentication (MFA) for IAM users when accessing resources.
    5.	Set up VPC endpoints with security groups that restrict access to corporate IP ranges only.
    6.	Enable AWS CloudTrail to capture all activity, ensuring logs are encrypted and securely stored.
    7.	Configure Amazon CloudWatch alarms to detect and alert on unauthorized access attempts, including failed MFA logins.

The expected output is a valid secure-setup.yml CloudFormation template. It should deploy without errors in a test AWS account and create resources that fully conform to the specified security and operational requirements.
