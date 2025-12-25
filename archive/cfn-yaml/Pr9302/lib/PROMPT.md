# CloudFormation IAM MFA Enforcement Template

Need a CloudFormation YAML template that enforces Multi-Factor Authentication for user access to our application data. The setup has users assuming IAM roles to write data to S3, which then gets processed by Lambda functions that store results in DynamoDB. All these operations require MFA authentication - no access without it.

## What's Needed

Create a CloudFormation template with:

1. DynamoDB table for storing processed application data
2. IAM admin role that can modify S3 buckets and Lambda functions, but only when MFA is present
3. IAM developer role with limited permissions to read from S3 and DynamoDB, write to development resources - also requires MFA
4. IAM policies that deny all S3, Lambda, and DynamoDB operations unless the user has active MFA authentication
5. Region-agnostic design - works in both us-east-1 and us-west-1 without changes

## Technical Requirements

- CloudFormation YAML format
- IAM condition statements to enforce MFA authentication
- Roles require MFA for assume role actions
- Proper trust policies for the IAM roles
- Resource naming with environment suffix support

## Security Constraints

The IAM policies need to protect resource access:
- Deny DynamoDB, S3, and Lambda access when MFA is not present using aws:MultiFactorAuthPresent condition
- Include time-based MFA age restrictions with aws:MultiFactorAuthAge for resource operations
- Support virtual MFA devices and FIDO2 security keys - the latest 2025 AWS features
- Include IAM Identity Center integration for centralized MFA management across all AWS services

## Additional Setup

- Parameter for environment suffix like dev, staging, prod
- Outputs for role ARNs and policy references
- Metadata section for CloudFormation interface
- Production-ready with AWS security best practices
- Support latest AWS IAM MFA features from 2025

Provide infrastructure code with one file per code block. The main template should be comprehensive with all resources for MFA-enforced IAM roles.
