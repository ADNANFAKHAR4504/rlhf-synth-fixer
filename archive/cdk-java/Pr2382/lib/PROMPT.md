# AWS Financial Services Infrastructure

We need to set up a secure AWS infrastructure for a financial services company. The main focus is building a production-ready system that meets compliance requirements with proper security controls between all components.

## What needs to be built

Core Infrastructure:

VPC with proper network isolation.
EC2 instances with secure configurations.
RDS databases with encryption.
S3 buckets for storage and logs.
CloudTrail for audit logging.

Security Setup:

IAM roles (least privilege only - don't give permissions they don't need).
Security groups (lock down ports, no wide-open access).
KMS encryption for everything at rest.
TLS 1.2+ for all connections.

## Security requirements

Here's what we absolutely need:

IAM: Only grant the minimum permissions needed. No admin access unless absolutely required.
Encryption: Everything encrypted at rest (KMS) and in transit (TLS 1.2 minimum).
Security Groups: Lock down all ports except 80/443. No 0.0.0.0/0 access except for public web traffic.
CloudTrail: Log and encrypt the logs with KMS.
Password policies: 90-day rotation for IAM users.
S3: Server-side encryption with KMS, versioning turned on.

## Technical specs

Build this as AWS CDK in Java. The code needs to be:

Production-ready and deployable.
Well-commented (explain security decisions).
Following Java/CDK best practices.

Include these components:

IAM roles and policies (least privilege).
S3 buckets with encryption and versioning.
Security groups with proper port restrictions.
CloudTrail setup with encrypted logs.
TLS configuration for all resource communication.

The infrastructure should handle secure connections between all resources and be ready for compliance audits.
