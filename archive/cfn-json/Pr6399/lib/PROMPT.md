# Infrastructure Template Optimization

Hey team,

We need to fix a CloudFormation template that's been causing problems in our financial transaction processing system. The current template works, but it has serious issues that are failing security audits and making it hard to manage across environments. I've been asked to refactor this using **CloudFormation with JSON** format.

The business has been running this transaction processing infrastructure for a while now, handling over 50,000 transactions daily. But the template has hardcoded values everywhere, overly permissive IAM policies, and no proper parameterization for different environments. The security team flagged it, and we need to bring it up to production standards while keeping everything running smoothly.

This is production infrastructure in us-east-1, so we need to be careful. We can't break existing functionality, but we need to make it maintainable, secure, and compliant with financial services regulations.

## What we need to build

Refactor the existing transaction processing infrastructure template using **CloudFormation with JSON** to implement IaC best practices and security improvements.

### Core Requirements

1. **Parameter Management**
   - Replace hardcoded Lambda memory size (currently 3008MB) with a parameter
   - Parameter must have allowed values: 512, 1024, 2048, 3008
   - Add parameters for mandatory tags: Environment, CostCenter, Application
   - Parameterize any other hardcoded values found in the template

2. **IAM Security Fixes**
   - Fix the Lambda execution role that currently allows dynamodb:* on all resources
   - Restrict to specific DynamoDB actions (GetItem, PutItem, UpdateItem, Query, Scan)
   - Scope permissions to specific table resources only
   - Follow least-privilege principle throughout

3. **Resource Protection**
   - Add DeletionPolicy: Retain to the DynamoDB table storing transaction records
   - Ensure stateful resources are protected from accidental deletion
   - Keep S3 buckets protected as they store audit logs

4. **Environment Configuration**
   - Create Mappings section for environment-specific settings
   - Configure CloudWatch log retention: dev (7 days), staging (30 days), prod (90 days)
   - Support multi-environment deployment with appropriate configurations

5. **Conditional Resources**
   - Implement Conditions to deploy S3 lifecycle policies only in production
   - Use condition functions to handle environment-specific resource creation
   - Ensure proper evaluation of conditions throughout the template

6. **Dependency Management**
   - Fix circular dependency between Lambda function and execution role
   - Use explicit DependsOn attributes where needed
   - Ensure proper resource creation order

7. **Outputs Section**
   - Export Lambda function ARN for cross-stack references
   - Export DynamoDB table name for application configuration
   - Export S3 bucket name for audit log access
   - Include any other critical resource identifiers

8. **Resource Tagging**
   - Apply mandatory tags to all resources: Environment, CostCenter, Application
   - Use parameter values for tag consistency
   - Ensure compliance with tagging best practices

### Technical Requirements

- All infrastructure defined using **CloudFormation with JSON**
- Use AWS Lambda for transaction processing logic
- Use Amazon DynamoDB for transaction record storage
- Use Amazon S3 for audit log storage
- Use AWS IAM for access control with least-privilege policies
- Use Amazon VPC for network isolation of Lambda functions
- Resource names must include environmentSuffix for uniqueness
- Follow naming convention: resource-type-environment-suffix
- Deploy to us-east-1 region
- Template must be deployable via AWS CLI or Console

### Constraints

- Preserve ALL existing functionality during refactoring
- No breaking changes to deployed resources
- All resources must be destroyable except those with Retain policy
- IAM policies must use specific actions, no wildcard permissions
- Support dev, staging, and production environments from single template
- Template must pass AWS CloudFormation linter validation
- Follow financial services compliance requirements
- Include proper error handling in Lambda execution role policies
- CloudWatch logging must be configured for all Lambda functions

## Success Criteria

- Functionality: All existing transaction processing capabilities maintained
- Security: IAM policies follow least-privilege with no wildcards on actions
- Parameterization: No hardcoded values, all configurable via parameters or mappings
- Multi-environment: Single template supports dev, staging, prod with appropriate configs
- Resource Protection: DeletionPolicy: Retain applied to stateful resources
- Outputs: All critical resources exposed for reference and integration
- Dependencies: No circular dependencies, proper DependsOn usage
- Tagging: Consistent tags applied to all resources using parameters
- Code Quality: Valid CloudFormation JSON, well-documented, production-ready

## What to deliver

- Complete CloudFormation JSON template with all optimizations
- Parameters section with LambdaMemorySize, Environment, CostCenter, Application, environmentSuffix
- Mappings section for environment-specific CloudWatch log retention
- Conditions section for production-only S3 lifecycle policies
- Resources section with Lambda function, DynamoDB table, S3 bucket, IAM roles
- Outputs section exposing Lambda ARN, table name, bucket name
- Proper DeletionPolicy on DynamoDB table
- Fixed IAM policies with specific actions and resource scoping
- Complete documentation in code comments
- Template ready for multi-environment deployment
