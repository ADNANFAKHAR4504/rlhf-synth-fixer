## Problem Statement:
Security Configuration as Code with Pulumi and Python
You are tasked with setting up a highly secure cloud infrastructure on AWS using Pulumi and Python for a company named ProjectX. The project involves provisioning various AWS resources with stringent security measures as part of a comprehensive security configuration as code. The infrastructure must be deployed in both the us-west-2 and us-east-1 regions and use naming conventions that include 'secure' and 'projectX'.
Core Requirements


* **Requirements**:
  * Create a components directory and add the required components modules
  * Use AWS as the cloud provider.
  * Implement security groups to restrict SSH and HTTP access.
  * Ensure all data stored in S3 is encrypted at rest.
  * Apply IAM roles to EC2 instances for least privilege access.
  * Use AWS Key Management Service (KMS) for managing encryption keys.
  * Enable versioning on critical data in S3.
  * Implement Network Access Control Lists (NACLs) for subnet protection.
  * Use CloudWatch for monitoring and logging of security-related activities.
  * Ensure RDS databases are not publicly accessible.
  * Implement Multi-Factor Authentication (MFA) for IAM users.
  * Apply automatic backups and retention policies for RDS.
  * Enable AWS GuardDuty for threat detection and continuous monitoring.

* **Aditional Requirements**:
   Your Pulumi-python code must be modular and deploys to us-west-2 and us-east-1 regions