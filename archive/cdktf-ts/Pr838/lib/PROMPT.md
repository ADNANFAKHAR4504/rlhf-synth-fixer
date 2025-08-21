# CDKTF Enterprise AWS Infrastructure Project

## Overview

Create a CDK for Terraform (CDKTF) project using TypeScript or Python, implementing all resources and configurations in a single file named main.ts or main.py. This script should deploy a secure AWS cloud environment for an enterprise application, following strict security best practices and organizational standards.

## Environment Configuration

- **Region**: us-east-1
- **VPC**: Includes both public and private subnets.
- **Resource Naming**: All resources must be prefixed with prod-sec.
- **Terraform Backend**: Use an existing remote backend for state management (e.g., S3 + DynamoDB) with encryption enabled.
- **Project Name**: IaC AWS Nova Model Breaking

## Security and Compliance Requirements

### IAM Users and Roles

- Create IAM users with least privilege policies.
- Enforce Multi-Factor Authentication (MFA).
- Avoid wildcard "\*" permissions unless absolutely necessary and justified.
- Apply least privilege in all IAM policies and roles.

### VPC and Networking

- Create a VPC with public subnets in at least 2 Availability Zones.
- Define Security Groups to allow only necessary inbound/outbound traffic.
- Ensure secure access to resources and isolation between environments.

### Terraform State Management

- Use secure S3 backend with server-side encryption and state locking via DynamoDB.
- Prevent unauthorized access through IAM policies and S3 bucket policies.

### Data Encryption and Secrets Management

- Use AWS KMS for encryption at rest (for S3, EBS, RDS, etc.).
- Manage secrets using AWS Secrets Manager or SSM Parameter Store, with encryption enabled.

### Logging and Monitoring

- Configure CloudWatch logs and alarms for application monitoring.
- Ensure S3 buckets are private by default and enable access logging.
- Optionally configure AWS Config rules if no existing configuration recorder exists.

### Security Controls and Safeguards

- Prevent unauthorized data exfiltration (e.g., restrict outbound internet access).
- Enforce environment isolation using networking and IAM boundaries.
- Include automated checks for security posture (e.g., GuardDuty, CloudWatch alarms).
- Optionally include CloudTrail for audit logging if not managed externally.

## Infrastructure Implementation Style

- Implement all resources in a single file (main.ts or main.py).
- Follow CDKTF best practices while maintaining readability and structure within the single file.
- Apply tags to all resources: Environment=Production, Project=IaC-AWS-Nova.

## Expected Output

A single file CDKTF script (main.ts or main.py) that:

- Implements all infrastructure and security configurations as described.
- Successfully runs with cdktf synth and cdktf deploy.
- Passes manual review and automated compliance checks.
- Uses CDKTF constructs and logic but keeps everything in one file for simplicity.