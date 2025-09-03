Overview

This document contains the CloudFormation solution for provisioning a secure, multi-tier AWS infrastructure that follows security-as-code principles. The output is a single YAML template named secure_infrastructure.yaml, which provisions secure networking, IAM, encryption, monitoring, and compliance resources across multiple regions and accounts.

The template is designed for production-grade deployments, ensuring strict access control, encryption, logging, and tagging to meet compliance and operational best practices.

Key Features
1. Networking

Two VPCs with public and private subnets across multiple AZs.

Route tables and associations for each subnet.

VPC Peering for secure inter-VPC communication.

Security Groups tightly scoped to specific services.

Network ACLs to add a second layer of traffic control.

2. Identity & Access Management (IAM)

IAM Roles and Policies implementing the principle of least privilege.

Service-specific roles for Lambda, EC2, and RDS with limited actions.

Policies scoped to exact resource ARNs instead of wildcards.

3. Encryption & Secrets

AWS KMS CMKs for encryption at rest (S3, RDS, CloudTrail).

S3 Buckets with:

Server-side encryption (SSE-KMS).

Block public access enabled.

Strict bucket policies.

RDS Instance encrypted at rest.

AWS Secrets Manager for database and app credentials.

AWS Systems Manager Parameter Store for configuration parameters.

4. Monitoring & Logging

AWS CloudTrail enabled with logs encrypted in S3.

AWS Config to track resource changes with CIS AWS Foundations rules.

AWS GuardDuty for anomaly detection and continuous monitoring.

AWS Shield Advanced for DDoS protection.

AWS WAF for application-level threat prevention.

CloudWatch Alarms for operational visibility.

5. High Security Standards

TLS-enabled ELB listeners for secure communication.

Multi-AZ deployments for subnets, RDS, and redundancy.

AWS Backup configured for cross-region resilience.

Automated remediation via AWS Config where possible.

6. Tagging & Naming

Enforced resource tagging:

Environment, Project, Owner, CostCenter, Compliance

Standardized naming convention for all security and networking resources.

Parameters & Reusability

EnvironmentName (e.g., dev, stage, prod)

VpcCidrA and VpcCidrB for custom VPC CIDR ranges.

KmsKeyAlias for flexible encryption key usage.

Region parameter to support multi-region deployments.

Designed for multi-account architecture, supporting cross-account roles.

Expected Outputs

The stack outputs the following values for integration and future references:

VPC IDs (for both VPCs).

Subnet IDs (public/private).

VPC Peering Connection ID.

KMS Key ARN.

S3 Logging Bucket ARN.

RDS Endpoint.

Secrets Manager ARN for sensitive credentials.