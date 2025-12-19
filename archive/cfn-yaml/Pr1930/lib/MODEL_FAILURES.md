# Model Response Analysis - Common Failures

## Overview

This document tracks common failures and issues identified when AI models attempt to generate CloudFormation templates for the infrastructure challenge.

## Identified Failure Patterns

### Template Syntax Issues

- Missing AWSTemplateFormatVersion: Models often forget to include the required format version
- Incorrect YAML Indentation: Inconsistent spacing leading to parsing errors
- Invalid CloudFormation Functions: Misuse of intrinsic functions like `!Ref`, `!GetAtt`
- Missing Required Properties: Omitting mandatory resource properties

### Security Misconfigurations

- Overly Permissive Security Groups:
  - SSH access from 0.0.0.0/0 instead of restricted CIDR
  - Missing egress rule specifications
- IAM Over-Permissions:
  - Using `*` for resource ARNs when specific resources should be referenced
  - Granting unnecessary permissions beyond S3 access
- Missing Encryption: Forgetting to enable S3 bucket encryption
- Public S3 Buckets: Not implementing proper bucket policies

### Networking Errors

- Incorrect CIDR Overlaps: Subnet CIDRs that don't fit within VPC CIDR
- Missing Route Tables: Forgetting to create or associate route tables
- No Internet Gateway: Missing internet connectivity for public subnets
- Wrong Availability Zone References: Hard-coding AZs instead of using `!GetAZs`

### Resource Configuration Issues

- Outdated AMI IDs: Using deprecated or region-specific AMI references
- Missing Key Pair: Not parameterizing or referencing EC2 key pairs
- Incorrect Instance Profiles: Forgetting to attach IAM roles to EC2 instances
- Missing Dependencies: Not properly defining resource dependencies with `DependsOn`

### Monitoring and Alerting Problems

- Incomplete CloudWatch Configuration:
  - Missing alarm dimensions
  - Incorrect metric namespaces
  - Wrong threshold operators
- No Alarm Actions: Creating alarms without specifying what actions to take
- Insufficient Monitoring: Not enabling detailed monitoring when required

### Tagging and Naming Inconsistencies

- Inconsistent Naming: Not following the specified naming convention
- Missing Environment Tags: Forgetting to tag resources with Environment: Development
- Hardcoded Names: Using static names instead of parameterized unique identifiers

### Output Definition Issues

- Missing Required Outputs: Not providing all specified outputs (VPC ID, Subnet IDs, etc.)
- Incorrect Output Values: Using wrong CloudFormation functions for output values
- Poor Output Descriptions: Vague or missing descriptions for outputs
