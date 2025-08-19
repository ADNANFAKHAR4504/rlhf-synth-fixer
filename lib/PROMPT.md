# AWS Infrastructure Requirements

We're building a secure cloud infrastructure for our application. This document outlines what we need to deploy in AWS using Terraform.

## Core Security Requirements

Our application handles sensitive data, so we need strong encryption everywhere. All S3 buckets should use KMS encryption with customer-managed keys - not the default AWS ones. This gives us better control over key rotation and access.

For IAM, we're following least privilege. Users and services get only the permissions they absolutely need. No wildcards or overly broad policies.

## Naming and Region

Everything follows our standard naming: myapp-component-environment. So production storage becomes myapp-storage-prod, IAM roles become myapp-role-prod, etc. Keeps things organized when we have multiple environments.

We're standardizing on us-east-1 for now to keep costs down and latency consistent.

## Monitoring and Compliance

GuardDuty needs to be enabled with Extended Threat Detection. We've had some suspicious activity alerts in the past and want comprehensive monitoring.

Amazon Macie should scan our S3 buckets automatically for any sensitive data that might accidentally get stored there. Better to catch it early than deal with compliance issues later.

## Technical Notes

Make sure everything passes `terraform validate` before deployment. We've had issues with syntax errors breaking our CI/CD pipeline.