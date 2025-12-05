# AWS Infrastructure Security Audit Tool

A comprehensive security audit tool for AWS infrastructure managed by Pulumi. This tool uses Pulumi's Automation API and AWS SDK v3 to analyze existing resources and generate detailed security reports aligned with AWS Well-Architected Framework security pillar.

## Features

- **Comprehensive Security Checks**: Analyzes EC2, RDS, S3, IAM, Security Groups, and VPC configurations
- **Compliance Scoring**: Calculates compliance scores based on finding severity and count
- **Multiple Report Formats**: Generates both JSON (machine-readable) and HTML (human-readable) reports
- **Remediation Guidance**: Provides Pulumi TypeScript code snippets for fixing identified issues
- **Stack Discovery**: Automatically discovers and analyzes all Pulumi stacks in the AWS account
- **Performance Optimized**: Completes analysis within 5 minutes for infrastructures with up to 500 resources

## Security Checks

### EC2 Instances
- IMDSv2 enforcement
- Unencrypted EBS volumes
- Instances with public IPs

### RDS Instances
- Encryption at rest
- Backup retention period
- Multi-AZ deployment
- Deletion protection

### S3 Buckets
- Public access configuration
- Server-side encryption
- Versioning status
- Content sensitivity assessment

### IAM Roles and Policies
- Overly permissive wildcard actions
- Administrator access policies
- Unrestricted resource access

### Security Groups
- Unrestricted inbound rules (0.0.0.0/0)
- Open high-risk ports
- Overly permissive outbound rules

### VPC Configuration
- Network segmentation
- Resource placement in private/public subnets

## Installation
