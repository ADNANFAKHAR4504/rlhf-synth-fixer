# CloudFormation Template Requirements

This document outlines the requirements for creating a secure multi-tier AWS CloudFormation template. The infrastructure should include an S3 data lake, EC2 compute instances, RDS database, and proper IAM access controls.

## Architecture Components

The template needs to provision the following components:

- S3 buckets for data lake storage
- EC2 instances for application compute layer
- RDS instance for relational database needs
- IAM roles and policies for access management

## Security Requirements

### S3 Security

All S3 buckets must use server-side encryption with AWS KMS. The template should create a custom KMS key specifically for S3 encryption rather than using the default AWS managed key.

### IAM Access Control

IAM roles must follow least privilege principles. Create specific policies that restrict S3 access to designated roles and users only. These policies should be designed to prevent unauthorized detachment once applied.

### Network Configuration

EC2 instances should be deployed within a VPC that uses proper subnet segmentation:

- Public subnets for NAT gateways and API Gateway access points
- Private subnets for application servers and database instances

Security groups need to restrict inbound traffic to specific IP CIDR ranges. All EC2 instances should have CloudWatch detailed monitoring enabled and be configured for Amazon Inspector scanning.

### Audit and Logging

CloudTrail must be enabled with logs stored in an encrypted S3 bucket. This provides audit capability for all API calls within the account.

### Database Security

RDS instances require encryption at rest using KMS keys. Additionally, enforce TLS encryption for all database connections in transit.

### Key Management

Use custom-managed KMS keys for all encryption needs. Enable automatic key rotation with annual rotation schedules.

### Public Access Controls

Internal services should not have direct public access. All public traffic must route through API Gateway endpoints only.

## Implementation Notes

The final CloudFormation template should be production-ready and follow AWS best practices for security and compliance. Consider using parameters for environment-specific values and organize resources logically for maintainability.
