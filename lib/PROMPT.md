Please create IAC code in CloudFormation YAML with the following details:

Constraints:

Use AWS CloudFormation YAML syntax for the setup. | Everything should be provisioned in the 'us-west-2' region. | S3 buckets must have encryption enabled with AWS Managed Keys. | EC2 instances should automatically get IAM roles attached for access control. | All S3 buckets should have versioning turned on. | CloudWatch should be used for logging and monitoring across resources. | Security groups should be configured with least privilege access. | Communication between resources should be secured with SSL/TLS. | Alerts should be set up for any unauthorized API activity or unexpected infrastructure changes. | A VPC should be created with both public and private subnets for proper segmentation. | RDS instances should have automated backups enabled. | AWS Config should be used to track configuration changes and ensure compliance.

Environment:

You need to build a secure AWS environment using CloudFormation YAML in the 'us-west-2' region. The requirements include: encrypting S3 bucket data with AWS managed keys, attaching IAM roles to EC2 instances for controlled access, enabling S3 versioning, setting up CloudWatch for monitoring, keeping security groups restricted to least privilege, enforcing SSL/TLS for communications, setting up alerts for unauthorized API calls, creating a VPC with public and private subnets, enabling automated backups for RDS, and using AWS Config for tracking changes. The output should be a deployable YAML file that follows these rules and meets compliance needs.

It should also include this metadata:
Metadata:
AWS::CloudFormation::Interface:
ParameterGroups: - Label:
default: 'Environment Configuration'
Parameters: - EnvironmentSuffix

and this parameter:
Parameters:
EnvironmentSuffix:
Type: String
Default: 'dev'
Description: 'Environment suffix for resource naming (e.g., dev, staging, prod)'
AllowedPattern: '^[a-zA-Z0-9]+$'
ConstraintDescription: 'Must contain only alphanumeric characters'

Proposed Statement:

You are setting up a secure AWS environment for a regulated application to meet compliance standards, with focus on encryption, monitoring, and proper access control, specifically in the 'us-west-2' region.
