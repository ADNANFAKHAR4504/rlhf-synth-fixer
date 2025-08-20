# Prompt
# Terraform Infrastructure Task High Availability & Disaster Recovery

Objective:
Design and implement a resilient infrastructure using Terraform (HCL)
that ensures high availability and data integrity in a multi-AZ AWS environment. 
This infrastructure will support disaster recovery through automated failover and backup strategies.


# Requirements

You are to build the following components using Terraform:

Failover with Route 53:

Configure DNS-based failover between two EC2 instances, each deployed in a different Availability Zone within us-east-1.

Implement health checks to monitor the primary instance and fail over to the secondary in case of failure.

Backup Storage with S3:

Create an S3 bucket with versioning enabled to store backups reliably and prevent accidental data loss.

Monitoring & Alerting:

Set up a CloudWatch alarm to monitor a critical system health metric (e.g., EC2 instance status checks or CPU utilization).

Configure the alarm to trigger an SNS topic notification when thresholds are breached.

Resource Tagging:

Tag all AWS resources according to your organizations standard tagging policy.

Resource names must follow the corp- naming convention.

IAM & Access Control:

Use IAM roles and policies to grant only the minimal permissions required.

All access controls must adhere to the principle of least privilege.


# The configuration should be designed to work within the AWS us-east-1 region,
using existing AWS accounts. 
The organizational naming convention requires resource names to start with `corp-`,
and all workflows must include disaster recovery plans.