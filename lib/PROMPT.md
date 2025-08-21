Create an AWS CloudFormation template in YAML that provisions a secure and compliant infrastructure with the following requirements:

    1.	All resources must be deployed in the us-west-2 region and use custom VPC configurations.
    2.	Define IAM roles that follow the principle of least privilege.
    3.	Configure security groups to allow inbound traffic only from trusted IP ranges.
    4.	Enforce server-side encryption (AES-256) for all S3 buckets.
    5.	Enable logging across all services using AWS CloudTrail.
    6.	Configure RDS instances with Multi-AZ deployments for high availability.
    7.	Ensure that all EC2 instances use IMDSv2 exclusively.
    8.	Encrypt all RDS data at rest.
    9.	Apply the tags Environment and Owner to every resource for management and auditing.
    10.	Create CloudWatch alarms to monitor CPU utilization for all EC2 instances.
    11.	Ensure Lambda functions run without requiring public internet access.

The final output should be a valid CloudFormation template in YAML format that correctly implements all the above requirements. The solution should be verifiable, passing compliance checks and infrastructure tests without errors.
