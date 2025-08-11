Prompt: Enterprise-Grade Secure Multi-Region Cloud Infrastructure using AWS CloudFormation (JSON)
Objective:
Design and implement a secure, scalable, compliant, and multi-region AWS infrastructure using a single CloudFormation template in JSON format. The setup must follow AWS best practices and enterprise security/compliance standards.

🔧 Core Requirements
Multi-Region and Multi-Environment Support:

Provision separate VPCs for Development, Test, and Production environments.

Deploy across multiple AWS regions (e.g., us-east-1, us-west-2).

IAM Configuration:

Define IAM roles using AWS Managed Policies where applicable.

MFA must be enabled for all IAM users.

Ensure roles follow the principle of least privilege.

Monitoring and Logging:

Enable AWS CloudTrail in all regions to record account activity.

Set up CloudWatch Alarms to monitor and alert on:

Unauthorized API calls

Changes to security groups or IAM configurations

Use AWS Config to enforce compliance and track configuration changes.

Security and Access Controls:

All EC2 instances must:

Launch inside a VPC.

Have public IPs disabled.

Use security groups and NACLs to restrict traffic:

Only open necessary ports.

Ensure RDS is not publicly accessible and enforces SSL-only connections.

Implement AWS WAF with CloudFront for web app protection.

Enable AWS Shield to guard against DDoS attacks.

All S3 buckets must:

Enforce encryption at rest and in transit using AWS KMS.

Deny public access via bucket policies.

Ensure RDS and S3 encryption using KMS-managed keys.

Compliance and Tagging:

Use AWS Config Rules to check for:

Public S3 buckets

Unencrypted RDS

Unrestricted security groups

Enforce tagging for all resources:

Environment, Owner, and CostCenter.

High Availability and Scalability:

Configure Auto Scaling Groups (ASG) for the web tier to handle traffic spikes.

Ensure deployment across multiple Availability Zones (AZs) for HA.

📦 Output Expectations
Submit a CloudFormation JSON template file named:
secure_infrastructure_setup.json

The template must:

Be fully deployable without manual intervention.

Comply with AWS Well-Architected Framework security and operational excellence pillars.

Avoid exposing any public endpoints unless explicitly required.

Include descriptive resource names and logical IDs.
