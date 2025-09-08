Create a production-grade AWS CloudFormation template in YAML that provisions a secure, compliant, and highly available infrastructure in us-east-1. The template must:

Security & IAM

Enforce least-privilege IAM roles and policies.

Restrict SSH access via Security Groups to a specified CIDR.

Encrypt all resources at rest with KMS keys (rotation enabled) and enforce TLS for in-transit encryption.

Networking

Provision a VPC (10.0.0.0/16) with public/private subnets across two AZs.

Attach an Internet Gateway and NAT Gateways for private subnet egress.

Ensure all EC2 instances run inside private subnets.

Compute & Scaling

Launch EC2 instances in an Auto Scaling Group (min 3).

Integrate with CloudWatch alarms for scaling and monitoring.

Deploy a bastion host for controlled administrative access.

Load Balancing & Traffic Management

Configure an Application Load Balancer (ALB) for HTTP/HTTPS traffic.

Integrate CloudFront for caching and distributing static S3 content.

Storage & Databases

Create S3 buckets with versioning, encryption, and logging enabled.

Deploy RDS (Postgres/MySQL) in multi-AZ mode with encryption at rest and automated backups.

Logging, Auditing & Compliance

Enable CloudTrail with logs stored in encrypted S3.

Configure AWS Config rules to detect non-compliant resources.

Apply patch management via Systems Manager.

Secrets & Parameters

Use SSM Parameter Store (secure string) for sensitive configuration data.

Ensure Lambda functions (if any) encrypt environment variables.

Tagging & Governance

Apply mandatory tags: Environment, Owner, Project across all resources.

Enforce compliance with best practices and CIS/AWS standards.

Resilience & Backup

Enable daily automated backups for RDS and critical resources.

The final YAML template must pass cfn-lint and aws cloudformation validate-template without errors.