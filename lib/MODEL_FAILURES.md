# Common Model Failures in Infrastructure Generation

## Template Structure Issues

- **Missing AWSTemplateFormatVersion**: Models often omit the required CloudFormation version
- **Incorrect Resource Naming**: Failure to apply environment suffixes consistently
- **Missing Metadata Section**: Omitting the AWS::CloudFormation::Interface metadata

## Parameter Configuration Errors

- **Invalid Default Values**: Setting inappropriate defaults for environment suffixes
- **Missing Constraints**: Not including AllowedPattern or ConstraintDescription
- **Type Mismatches**: Using incorrect parameter types (e.g., Number instead of String)

## Resource Definition Problems

- **Incorrect DynamoDB Configuration**:
  - Using provisioned billing instead of pay-per-request
  - Missing or incorrect attribute definitions
  - Wrong key schema configuration
  - Enabling deletion protection in dev environments

## Output Section Issues

- **Missing Critical Outputs**: Failing to export table name, ARN, or stack name
- **Incorrect Export Names**: Not following the proper naming convention
- **Missing Descriptions**: Omitting helpful descriptions for outputs

## Security and Best Practices

- **Overly Permissive Policies**: Creating IAM roles with excessive permissions
- **Missing Encryption**: Not enabling encryption at rest for sensitive data
- **Inadequate Tagging**: Missing or inconsistent resource tagging

## Environment and Context Issues

- **Hardcoded Values**: Using fixed resource names instead of parameterized ones
- **Region-Specific Resources**: Hardcoding region-specific values like AMI IDs
- **Cross-Stack Dependencies**: Not properly handling resource dependencies

## Syntax and Formatting

- **YAML/JSON Syntax Errors**: Incorrect indentation or bracket placement
- **CloudFormation Function Misuse**: Incorrect usage of intrinsic functions like !Ref, !Sub, !GetAtt
- **Template Size**: Exceeding CloudFormation template size limits

## Testing and Validation Failures

- **Incomplete Test Coverage**: Missing unit or integration tests
- **Invalid Resource Properties**: Using non-existent or deprecated properties
- **Circular Dependencies**: Creating resource dependency loops
