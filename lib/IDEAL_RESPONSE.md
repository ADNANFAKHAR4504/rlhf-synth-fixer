# IDEAL_RESPONSE

## Overview
Includes modular CDKTF stacks for:

- **VPC**: CIDR-based layout with public, private, and database subnets, NAT Gateway, Internet Gateway, and VPC Flow Logs.
- **IAM**: EC2, S3, and CloudWatch roles with least privilege.
- **EC2**: Instance with dynamic AMI, secure security group, log groups, and user data.
- **S3**: Two buckets (main + access logs) with encryption, versioning, and lifecycle policies.
- **CloudWatch**: Dashboard, metric alarms, and log group.
- **TAP Stack**: Orchestrates the above across a dynamic environment.

## Compliance with Constraints
- **No hardcoding**: Uses environment variables and `Fn` functions.
- **Separate stacks** for each service.
- **DRY design** to avoid duplication.
- **Lifecycle rules** applied only in development and staging environments.
- **Logging, tagging, IAM policies, subnet/zone assignments, encryption** implemented according to requirements.
