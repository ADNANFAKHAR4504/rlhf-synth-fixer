Develop a Terraform file that establishes secure and compliant infrastructure configurations as code, adhering to rigorous security standards. The terraform code must be reusable, modularized.

Please produce the terraform templates that fulfills all the requirements
## Requirements

For the IAM with least privilege:
Definition of IAM policies granting least privilege necessary, such as read-only access to specific services like S3.  

Ensure all IAM roles require MFA for console access.  

Implement an IAM user with permissions limited strictly to the creation of Terraform stacks.

VPC setup:
Configure Virtual Private Clouds (VPCs) with dedicated public and private subnets across multiple availability zones for high availability.  

Create a VPC with two public subnets and two private subnets distributed across two availability zones.

Security measures:
Implement a security group that allows inbound SSH traffic only from a specific IP address.  

Use a Network ACL to block all inbound traffic except on port 80 and 443.  

Ensure encryption at rest for all EBS volumes in the template.
Monitoring & compliance:
Automation of security monitoring and compliance checks utilizing AWS services such as CloudTrail, CloudWatch, GuardDuty, and AWS Config.  

Use CloudTrail to log all API activity across the account.  

Define a CloudWatch alarm that triggers when there are more than 10 login attempts in a 5-minute window.  

Configure Amazon GuardDuty to monitor the account and generate findings.  

Set up AWS Config to continuously check for changes in security configurations, producing alerts for non-compliance.

For the Encryption:
Integration of encryption protocols for data at rest and in transit using AWS KMS and default encryption for S3 buckets.  

Create an S3 bucket with server-side encryption enabled by default.  

Incorporate AWS KMS for customer-managed key usage for encrypting S3 data.

For the Tagging:
Ensure resources are tagged with `Project: SecurityConfiguration`.

Proposed statement:
The environment is a multi-region AWS setup with focus on high-security standards.  

All configurations must be written in Terraform and are expected to be reusable, modularized and scalable, supporting at least two availability zones per VPC.  

Naming conventions should include `SecConfig-` as a prefix for easy identification in AWS Management Console.