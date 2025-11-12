# CloudFormation Template Optimization

> **⚠️ CRITICAL REQUIREMENT: This task MUST be implemented using CloudFormation with JSON**
>
> Platform: **CloudFormation (cfn)**
> Language: **JSON**
> Region: **us-east-1**

---

## Background
A financial services company has inherited a poorly-structured CloudFormation template that deploys their transaction processing system. The template works but has numerous anti-patterns including hardcoded values, missing parameters, no outputs, and overly permissive IAM policies that fail security audits.

## Problem Statement
AWS CloudFormation

## Constraints and Requirements
- AWS production environment in us-east-1 region hosting critical financial transaction processing infrastructure. Current setup includes Lambda functions for transaction processing, DynamoDB tables for transaction records, and S3 buckets for audit logs. VPC configuration with private subnets for Lambda functions. Requires AWS CLI configured with appropriate credentials. Template must support deployment across dev, staging, and production environments with different instance sizes and retention policies. Existing infrastructure processes 50,000+ transactions daily.

## Environment Setup
```json
{background: A financial services company has inherited a poorly-structured CloudFormation template that deploys their transaction processing system. The template works but has numerous anti-patterns including hardcoded values, missing parameters, no outputs, and overly permissive IAM policies that fail security audits., problem: Create a CloudFormation template to optimize and fix an existing transaction processing infrastructure template. The configuration must: 1. Refactor hardcoded Lambda function memory (currently 3008MB) into a parameter with allowed values [512, 1024, 2048, 3008]. 2. Fix overly permissive IAM role that currently allows 'dynamodb:*' on all resources - restrict to specific actions on specific tables. 3. Add missing DeletionPolicy: Retain to the DynamoDB table storing transaction records. 4. Create a Mappings section for environment-specific configurations (dev: 7 days logs, staging: 30 days, prod: 90 days). 5. Implement Conditions to deploy S3 lifecycle policies only in production environment. 6. Add proper Outputs section exposing Lambda function ARN, DynamoDB table name, and S3 bucket name. 7. Fix circular dependency between Lambda function and its execution role by using proper DependsOn. 8. Add mandatory tags (Environment, CostCenter, Application) to all resources using parameters. Expected output: An optimized CloudFormation YAML template that maintains all existing functionality while implementing infrastructure-as-code best practices, proper parameterization, and security improvements suitable for financial services compliance., environment: AWS production environment in us-east-1 region hosting critical financial transaction processing infrastructure. Current setup includes Lambda functions for transaction processing, DynamoDB tables for transaction records, and S3 buckets for audit logs. VPC configuration with private subnets for Lambda functions. Requires AWS CLI configured with appropriate credentials. Template must support deployment across dev, staging, and production environments with different instance sizes and retention policies. Existing infrastructure processes 50,000+ transactions daily., constraints: {count: 8, items: [Preserve all existing functionality while refactoring the template structure, Replace all hardcoded values with parameters or mappings, Implement least-privilege IAM policies with no wildcard actions, Add CloudFormation outputs for all critical resource ARNs and endpoints, Use condition functions to handle multi-environment deployments, Implement proper DependsOn attributes where implicit dependencies exist, Add deletion policies to protect stateful resources, Ensure all resources follow AWS tagging best practices]}, input_file: null}
```

---

## Implementation Guidelines

### Platform Requirements
- Use AWS CloudFormation as the IaC framework
- All code must be written in JSON format
- Follow CloudFormation best practices for resource organization
- Ensure all resources use the `EnvironmentSuffix` parameter for naming

### Security and Compliance
- Implement encryption at rest for all data stores using AWS KMS
- Enable encryption in transit using TLS/SSL
- Follow the principle of least privilege for IAM roles and policies
- Enable logging and monitoring using CloudWatch
- Tag all resources appropriately

### Testing
- Write unit tests with good coverage
- Integration tests must validate end-to-end workflows using deployed resources
- Load test outputs from `cfn-outputs/flat-outputs.json`

### Resource Management
- Infrastructure should be fully destroyable for CI/CD workflows
- **Important**: Secrets should be fetched from existing Secrets Manager entries, not created
- Avoid DeletionPolicy: Retain unless required

## Target Region
Deploy all resources to: **us-east-1**

## Success Criteria
- Infrastructure deploys successfully
- All security and compliance constraints are met
- Tests pass successfully
- Resources are properly tagged and named with environmentSuffix
- Infrastructure can be cleanly destroyed
