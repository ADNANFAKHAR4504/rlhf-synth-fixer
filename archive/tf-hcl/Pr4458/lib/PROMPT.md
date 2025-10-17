You are tasked with implementing a secure and compliant AWS production infrastructure using Terraform instead of CloudFormation.
The result must be a single-file Terraform configuration (main.tf), deployable directly via terraform apply, following AWS and enterprise security standards.

Problem Context

Design a secure, production-grade AWS environment using Terraform that adheres strictly to security best practices, encryption policies, and least-privilege IAM access.
The environment will be deployed in us-west-2 and must ensure compliance, encryption, monitoring, and auditability across networking, compute, database, and storage layers.

All resources must be fully managed by Terraform, focusing on data protection, network isolation, governance, and infrastructure compliance.
The architecture should replicate CloudFormation’s capabilities using Terraform Infrastructure as Code principles.

Core Implementation Requirements
1. Networking and VPC Setup

Create a VPC with public and private subnets across multiple Availability Zones.

Configure Internet Gateway, NAT Gateway, and Route Tables for proper routing.

Implement Security Groups and Network ACLs with least-access rules.

Ensure that RDS and private instances are not publicly accessible.

2. IAM and Access Control

Create IAM roles and policies for all services: EC2, RDS, CloudTrail, CloudFront, WAF, and ACM.

Apply least privilege for all IAM entities.

Enforce Multi-Factor Authentication (MFA) for IAM users and privileged access.

Use resource-based IAM policies with scoped permissions (no hardcoded credentials).

3. Data Encryption and Key Management

Use AWS KMS (CMK) to encrypt all data at rest for:

S3

RDS

CloudTrail

Secrets Manager

Enforce TLS/SSL for data in transit across all endpoints.

Configure KMS key policies with fine-grained control and logging.

4. Storage, Logging, and Auditing

Create a secure S3 bucket for centralized log storage:

Enable block public access, versioning, and lifecycle policies.

Enforce server-side encryption (KMS) for all objects.

Set up AWS CloudTrail to log all management and data events to this S3 bucket.

Enable CloudWatch Logs for EC2, ALB, and RDS.

Configure CloudTrail with log validation and encryption enabled.

5. Compute and Load Balancing

Deploy EC2 instances in private subnets within Auto Scaling Groups (ASG).

Create an Application Load Balancer (ALB) in public subnets for routing traffic.

Integrate AWS Certificate Manager (ACM) for SSL termination at the ALB.

Protect the ALB with AWS WAF, using managed rules for OWASP Top 10 and DDoS protection.

6. Database Layer (RDS)

Deploy a RDS (MySQL/PostgreSQL) instance inside private subnets only.

Enable:

Storage encryption (KMS)

Automated backups

Performance Insights

SSL enforcement

Restrict RDS access using VPC Security Groups and private networking only.

7. Secrets and Configuration Management

Use AWS Secrets Manager to securely store sensitive credentials.

Encrypt all secrets using KMS.

Configure automatic rotation of credentials.

Allow EC2 instances and Lambda functions to retrieve secrets via IAM roles only.

8. Content Delivery and Web Security

Configure AWS CloudFront for secure HTTPS-based content delivery.

Use CloudFront origins pointing to the ALB or S3 bucket.

Attach AWS WAF to CloudFront for additional global protection.

Ensure all connections use TLS v1.2 or higher.

9. Monitoring and Compliance

Enable CloudWatch Alarms for:

Unauthorized API calls

Root account usage

RDS performance metrics

Create SNS Topics for alert notifications.

Deploy AWS Config with managed compliance rules:

Enforce encryption

Prevent public access

Ensure MFA is enabled

Verify CloudTrail is active

10. Tagging and Governance

Apply consistent tagging for all resources:

Project = SecureApp

Environment = Production

Ensure tag propagation across all Terraform resources and subcomponents.

Constraints

All Terraform code must be contained in one single file named main.tf.

Use Terraform HCL syntax only — no YAML, modules, or separate files.

All resources must be deployed in the us-west-2 region.

Use AWS provider with version pinning and proper backend configuration.

Ensure no public access, least privilege IAM, and KMS encryption are enforced.

Configuration must pass terraform validate and follow terraform fmt formatting.

Expected Output

Produce a complete Terraform configuration (main.tf) that includes:

Provider block

VPC and subnet definitions

Security Groups and routing setup

IAM roles and least-privilege policies

KMS key creation and encryption for all services

Encrypted S3 bucket for logs

CloudTrail and CloudWatch configuration

EC2 Auto Scaling and ALB with SSL termination

WAF configuration

RDS instance (private) with encryption and backups

Secrets Manager for sensitive data

CloudFront distribution for secure content delivery

Systems Manager integration for EC2 management

The output must be syntactically valid, deployable, and compliant with AWS security and governance standards.

Output Instructions

Produce only the Terraform HCL code for the complete configuration.

The entire environment must be within a single file (main.tf).

Do not include explanations, YAML, or commentary.

Include all dependencies, encryption configurations, and tagging as part of the final Terraform file.