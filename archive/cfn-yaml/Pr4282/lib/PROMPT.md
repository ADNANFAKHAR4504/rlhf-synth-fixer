Prompt is as below
```
Please create a single, comprehensive AWS CloudFormation template in YAML format. This template must define and configure a suite of AWS resources to establish a secure and compliant environment based on the detailed requirements below.

Core Requirements:

You must create a CloudFormation template that implements the following ten security configurations precisely:

S3 Bucket Encryption: All S3 buckets defined in the template must have server-side encryption enabled by default to protect data at rest.

RDS Public Access: All Amazon RDS database instances must be configured with PubliclyAccessible set to false to prevent any access from the public internet.

Global CloudTrail Logging: Configure a CloudTrail trail that is enabled for all AWS regions (IsMultiRegionTrail: true) and logs all management events.

EC2 Least-Privilege Access: Implement a VPC-based security group for EC2 instances. This security group must follow the principle of least privilege, specifically by only allowing inbound SSH traffic (port 22) from a designated IP range. Use a parameter to make this IP range configurable.

IAM Least-Privilege Policies: Define IAM roles and policies with the minimum necessary permissions for their intended functions. Avoid using wildcards (*) in actions or resources where specific permissions can be granted.

AWS Config Monitoring: Set up AWS Config with a configuration recorder and a delivery channel to monitor resource configurations. Include at least one sample rule, such as s3-bucket-public-read-prohibited.

IAM User MFA: Implement a group-level IAM policy that enforces the use of multi-factor authentication (MFA) for all IAM users who are members of that group.

EBS Volume Encryption: Ensure that any Amazon Elastic Block Store (EBS) volumes attached to EC2 instances are encrypted at rest.

AWS Budget Alert: Create an AWS Budget to monitor monthly costs. Configure a budget alert that sends a notification to an SNS topic if the actual or forecasted costs exceed $10,000.

CloudWatch IAM Auditing: Configure a CloudWatch Log Group and a corresponding CloudTrail configuration to log all IAM API calls for detailed auditing and security analysis.

Constraints and Directives:

The output must be a single, valid YAML CloudFormation template.

Do not change or omit any of the ten core requirements.

Use parameters for configurable values, such as the SSH IP range and the email address for budget notifications, to make the template reusable.

Add descriptive comments (#) or Description fields where appropriate to explain the purpose of complex resources or sections.

Ensure the final template is well-structured, readable, and ready for deployment.
```