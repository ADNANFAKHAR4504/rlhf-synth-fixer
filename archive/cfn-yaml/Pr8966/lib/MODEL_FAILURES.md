# Model Failures

## IAM Role - Overly Permissive Wildcard

Model used `arn:aws:logs:*:*:*` for the IAM policy Resource, which grants access to all log groups in all regions and accounts. This violates least privilege.

Wrong:
```yaml
Resource: arn:aws:logs:*:*:*
```

Should be scoped to the specific Lambda log group:
```yaml
Resource: !Sub arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/${FunctionName}:*
```

## Missing Metadata and Parameter Grouping

No CloudFormation interface metadata for grouping parameters. This makes the stack harder to use in the console, especially for multi-environment deployments.

Add:
```yaml
Metadata:
  AWS::CloudFormation::Interface:
    ParameterGroups:
      - Label:
          default: 'Environment Configuration'
        Parameters:
          - EnvironmentSuffix
```

## Missing EnvironmentSuffix Parameter

Model didn't include an environment parameter (dev, staging, prod), making it impossible to run multiple isolated environments in the same account.

Fix: Add EnvironmentSuffix parameter and use it in resource naming and tags.

## Outdated Runtime Default

Model used `nodejs14.x` as default runtime, which is deprecated and no longer supported by AWS.

Should use `nodejs18.x` with AllowedValues for validation:
```yaml
Default: nodejs18.x
AllowedValues:
  - nodejs18.x
  - python3.11
  - java17
  - go1.x
```

## Missing Lambda Timeout

Lambda timeout wasn't specified, defaulting to 3 seconds. This is too short for most real workloads and makes debugging timeouts harder.

Fix: Set explicit timeout:
```yaml
Timeout: 10
```

## Missing Resource Tags

No tags on any resources. Makes cost tracking, compliance, and automation nearly impossible.

All resources should have tags:
```yaml
Tags:
  - Key: Name
    Value: projectXLambdaFunction
  - Key: Project
    Value: projectX
  - Key: Environment
    Value: !Ref EnvironmentSuffix
```

## Incomplete Outputs

Model only provided API URL and Lambda ARN. Missing other important outputs like function name, API Gateway ID, integration ID, and log group name.

These are needed for integration tests and CI/CD pipelines.

Fixed by adding:
- LambdaFunctionName
- ApiGatewayId
- ApiIntegrationId
- LambdaLogGroupName
