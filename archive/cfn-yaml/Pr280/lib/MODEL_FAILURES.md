Overview

This document outlines potential failure points when deploying the CloudFormation template for projectX, which provisions two AWS Lambda functions along with their IAM roles and CloudWatch log groups.
Potential Failure Scenarios
1. IAM Role Creation Failures

Resource: ProjectXDataProcessorRole, ProjectXResponseHandlerRole
Causes:

    Role name already exists (RoleName must be unique across the account).

    Insufficient IAM permissions for the deploying user to create roles or attach policies.

Symptoms:

    CREATE_FAILED status with message like:
    EntityAlreadyExists: Role with name projectX-dataProcessor-role already exists

Resolution:

    Ensure RoleName values are unique, or remove RoleName property to let CloudFormation auto-generate.

    Check IAM permissions of the deploying user.

    Delete conflicting IAM roles manually if appropriate.

2. Lambda Function Creation Failures

Resources: ProjectXDataProcessorFunction, ProjectXResponseHandlerFunction
Causes:

    Referenced IAM Role (!GetAtt ProjectXDataProcessorRole.Arn) not available due to prior failure.

    Incorrect IAM role permissions (missing lambda.amazonaws.com trust relationship).

    Syntax errors in inline Lambda code.

    Unsupported or unavailable runtime (e.g., python3.12 in some regions).

Symptoms:

    CREATE_FAILED on Lambda function resources.

    Message like:
    InvalidParameterValueException: The role defined for the function cannot be assumed by Lambda.

Resolution:

    Ensure IAM roles are created successfully before Lambda function creation.

    Validate trust policy allows lambda.amazonaws.com.

    Verify runtime support in target region.

    Test Lambda code locally for syntax issues.

3. Log Group Creation Failures

Resources: DataProcessorLogGroup, ResponseHandlerLogGroup
Causes:

    Log group already exists with different configuration (e.g., different retention).

    Insufficient permissions to create or modify log groups.

Symptoms:

    CREATE_FAILED status on LogGroup resource.

    Message like:
    ResourceAlreadyExistsException: The specified log group already exists

Resolution:

    Check for existing log groups manually and update or delete if needed.

    Ensure CloudFormation stack has permission to manage logs (e.g., through IAM policies).

4. Output Resolution Failures

Resources: DataProcessorFunctionName, ResponseHandlerFunctionName
Causes:

    If Lambda function resources fail to create, outputs depending on them will also fail.

Symptoms:

    Stack rollback triggered due to output dependency errors.

Resolution:

    Focus on root-cause analysis of function creation failure, then reattempt deployment.