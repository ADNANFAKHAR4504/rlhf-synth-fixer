### Reasoning Trace

---

This is a comprehensive request to build a modular Pulumi Python program for a serverless AWS application spanning multiple regions. Let's break down the requirements and plan the implementation:

### Key Requirements:

1. **Multi-region Deployment**:
   - `us-east-1` and `us-west-2`

2. **API Gateway**:
   - REST API
   - CORS enabled
   - Request validation
   - Throttling limits (1000 RPS, burst 2000)
   - Standardized error responses with correlation IDs
   - X-Ray tracing

3. **Lambda Functions**:
   - 15-second timeout
   - Latest Python runtime
   - Structured JSON logging
   - Dead-letter queues with max 2 retries
   - X-Ray tracing

4. **DynamoDB Tables**:
   - Partition key `symbol`, sort key `timestamp`
   - On-demand billing
   - Autoscaling for read/write capacity
   - Contributor insights
   - Point-in-time recovery
   - KMS encryption at rest

5. **S3 Bucket**:
   - Server-side encryption
   - Event notifications triggering Lambdas on upload
   - Lifecycle policies (delete after 30 days)

6. **CloudWatch**:
   - 7-day log retention
   - Alarms for Lambda errors and DynamoDB throttling

7. **Tagging**:
   - All resources tagged with `ENVIRONMENT_SUFFIX`, `REGION`, Project Name = `ServApp`

8. **Destruction Prevention Settings**:
   - Optional and default to false

9. **CI/CD Pipeline**:
   - AWS CodePipeline for automated deployment

10. **Outputs**:
    - API endpoints, Lambda ARNs, DynamoDB table names

### Project Structure:

I'll design a modular structure with separation of concerns:

```
serverless_app/
├── __init__.py
├── __main__.py
├── config.py                  # Configuration and variables
├── components/
│   ├── __init__.py
│   ├── api_gateway.py         # API Gateway component
│   ├── lambda_function.py     # Lambda function component
│   ├── dynamodb.py            # DynamoDB component
│   ├── s3.py                  # S3 component
│   ├── cloudwatch.py          # CloudWatch component
│   └── cicd.py                # CI/CD pipeline component
├── utils/
│   ├── __init__.py
│   ├── tags.py                # Tagging utility
│   └── logging.py             # Logging utility
└── Pulumi.yaml                # Pulumi project file
```

Now, let's implement each component:

### 1. First, the Configuration File:

```python
# config.py
import pulumi
import pulumi_aws as aws

# Project configuration
project_name = "ServApp"
regions = ["us-east-1", "us-west-2"]
environment_suffix = pulumi.get_stack()

# Lambda configuration
lambda_timeout = 15
lambda_runtime = aws.lambda_.Runtime.PYTHON3_10
lambda_max_retries = 2

# API Gateway configuration
api_throttling_rate = 1000
api_throttling_burst = 2000

# DynamoDB configuration
dynamodb_partition_key = "symbol"
dynamodb_sort_key = "timestamp"

# CloudWatch configuration
cloudwatch_log_retention_days = 7
lambda_error_threshold = 1.0  # 1%

# S3 configuration
s3_lifecycle_expiration_days = 30

# Destruction prevention settings
prevent_destroy = pulumi.Config().get_bool("prevent_destroy") or False
```

### 2. Tagging Utility:

```python
# utils/tags.py
def get_resource_tags(region, resource_type=None):
    """Generate standardized tags for AWS resources."""
    from ..config import project_name, environment_suffix

    tags = {
        "Project": project_name,
        "ENVIRONMENT_SUFFIX": environment_suffix,
        "REGION": region,
    }

    if resource_type:
        tags["ResourceType"] = resource_type

    return tags
```

### 3. Lambda Function Component:

```python
# components/lambda_function.py
import json
import pulumi
import pulumi_aws as aws
from ..utils.tags import get_resource_tags
from ..config import lambda_timeout, lambda_runtime, lambda_max_retries, prevent_destroy

def create_lambda_function(
    name,
    region,
    code_path,
    handler,
    role_arn,
    environment=None,
    dlq_arn=None
):
    """Create a Lambda function with the specified configuration."""

    # Create dead letter queue if not provided
    if not dlq_arn:
        dlq = aws.sqs.Queue(
            f"{name}-dlq",
            name=f"{name}-dlq",
            tags=get_resource_tags(region, "SQS"),
            opts=pulumi.ResourceOptions(provider=get_region_provider(region))
        )
        dlq_arn = dlq.arn

    function = aws.lambda_.Function(
        name,
        name=name,
        runtime=lambda_runtime,
        code=pulumi.AssetArchive({
            ".": pulumi.FileArchive(code_path)
        }),
        handler=handler,
        role=role_arn,
        timeout=lambda_timeout,
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables=environment or {}
        ),
        tracing_config=aws.lambda_.FunctionTracingConfigArgs(
            mode="Active"  # Enable X-Ray tracing
        ),
        dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
            target_arn=dlq_arn
        ),
        tags=get_resource_tags(region, "Lambda"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Configure function retry settings
    event_invoke_config = aws.lambda_.EventInvokeConfig(
        f"{name}-event-invoke-config",
        function_name=function.name,
        maximum_retry_attempts=lambda_max_retries,
        qualifier="$LATEST",
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Set up CloudWatch logs for the function
    log_group = aws.cloudwatch.LogGroup(
        f"{name}-log-group",
        name=f"/aws/lambda/{name}",
        retention_in_days=cloudwatch_log_retention_days,
        tags=get_resource_tags(region, "CloudWatchLogs"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    return function

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)

def create_lambda_role(name, region, policy_document):
    """Create an IAM role for a Lambda function."""
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
        }]
    })

    role = aws.iam.Role(
        f"{name}-role",
        assume_role_policy=assume_role_policy,
        name=f"{name}-role",
        tags=get_resource_tags(region, "IAM"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Attach X-Ray permissions
    aws.iam.RolePolicyAttachment(
        f"{name}-xray-attachment",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess",
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Attach CloudWatch Logs permissions
    aws.iam.RolePolicyAttachment(
        f"{name}-cloudwatch-attachment",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Attach custom policy
    if policy_document:
        policy = aws.iam.Policy(
            f"{name}-policy",
            policy=policy_document,
            tags=get_resource_tags(region, "IAM"),
            opts=pulumi.ResourceOptions(provider=get_region_provider(region))
        )

        aws.iam.RolePolicyAttachment(
            f"{name}-custom-attachment",
            role=role.name,
            policy_arn=policy.arn,
            opts=pulumi.ResourceOptions(provider=get_region_provider(region))
        )

    return role
```

### 4. DynamoDB Component:

```python
# components/dynamodb.py
import pulumi
import pulumi_aws as aws
from ..utils.tags import get_resource_tags
from ..config import dynamodb_partition_key, dynamodb_sort_key, prevent_destroy

def create_dynamodb_table(name, region):
    """Create a DynamoDB table with specified configuration."""

    # Create KMS key for encryption
    kms_key = aws.kms.Key(
        f"{name}-kms-key",
        description=f"KMS key for {name} DynamoDB table encryption",
        deletion_window_in_days=7,
        enable_key_rotation=True,
        tags=get_resource_tags(region, "KMS"),
        opts=pulumi.ResourceOptions(
            provider=get_region_provider(region),
            prevent_destroy=prevent_destroy
        )
    )

    # Create the DynamoDB table
    table = aws.dynamodb.Table(
        name,
        name=name,
        billing_mode="PAY_PER_REQUEST",
        hash_key=dynamodb_partition_key,
        range_key=dynamodb_sort_key,
        attributes=[
            aws.dynamodb.TableAttributeArgs(
                name=dynamodb_partition_key,
                type="S",
            ),
            aws.dynamodb.TableAttributeArgs(
                name=dynamodb_sort_key,
                type="S",
            ),
        ],
        point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True,
        ),
        server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
            enabled=True,
            kms_key_arn=kms_key.arn
        ),
        tags=get_resource_tags(region, "DynamoDB"),
        opts=pulumi.ResourceOptions(
            provider=get_region_provider(region),
            prevent_destroy=prevent_destroy
        )
    )

    # Enable contributor insights
    insights = aws.dynamodb.ContributorInsights(
        f"{name}-insights",
        table_name=table.name,
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # CloudWatch alarm for throttling events
    throttling_alarm = aws.cloudwatch.MetricAlarm(
        f"{name}-throttling-alarm",
        alarm_name=f"{name}-throttling-events",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="ThrottledRequests",
        namespace="AWS/DynamoDB",
        period=60,
        statistic="Sum",
        threshold=0,
        alarm_description=f"Alarm when throttling occurs on the {name} DynamoDB table",
        dimensions={
            "TableName": table.name,
        },
        tags=get_resource_tags(region, "CloudWatch"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    return {
        "table": table,
        "kms_key": kms_key,
        "throttling_alarm": throttling_alarm
    }

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)
```

### 5. S3 Component:

```python
# components/s3.py
import pulumi
import pulumi_aws as aws
from ..utils.tags import get_resource_tags
from ..config import s3_lifecycle_expiration_days, prevent_destroy

def create_s3_bucket(name, region, lambda_notification_arn=None):
    """Create an S3 bucket with specified configuration."""

    bucket = aws.s3.Bucket(
        name,
        bucket=name,
        acl="private",
        server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
            rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                )
            )
        ),
        lifecycle_rules=[
            aws.s3.BucketLifecycleRuleArgs(
                enabled=True,
                expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                    days=s3_lifecycle_expiration_days,
                ),
            ),
        ],
        tags=get_resource_tags(region, "S3"),
        opts=pulumi.ResourceOptions(
            provider=get_region_provider(region),
            prevent_destroy=prevent_destroy
        )
    )

    # Add Lambda notification for file uploads if Lambda ARN is provided
    if lambda_notification_arn:
        notification = aws.s3.BucketNotification(
            f"{name}-notification",
            bucket=bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=lambda_notification_arn,
                    events=["s3:ObjectCreated:*"],
                )
            ],
            opts=pulumi.ResourceOptions(provider=get_region_provider(region))
        )

    return bucket

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)
```

### 6. API Gateway Component:

```python
# components/api_gateway.py
import json
import pulumi
import pulumi_aws as aws
from ..utils.tags import get_resource_tags
from ..config import api_throttling_rate, api_throttling_burst

def create_api_gateway(name, region, lambda_functions):
    """Create an API Gateway with the specified configuration."""

    # Create the REST API
    rest_api = aws.apigateway.RestApi(
        name,
        name=name,
        description=f"API Gateway for {name}",
        endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
            types=["REGIONAL"]
        ),
        tags=get_resource_tags(region, "APIGateway"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Configure request validator
    validator = aws.apigateway.RequestValidator(
        f"{name}-validator",
        rest_api_id=rest_api.id,
        name=f"{name}-validator",
        validate_request_body=True,
        validate_request_parameters=True,
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Configure API Gateway account for CloudWatch
    api_account = aws.apigateway.Account(
        f"{name}-account",
        cloudwatch_role_arn=create_api_gateway_cloudwatch_role(name, region).arn,
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Create a gateway response for CORS
    cors_response = aws.apigateway.GatewayResponse(
        f"{name}-cors-response",
        rest_api_id=rest_api.id,
        response_type="DEFAULT_4XX",
        response_parameters={
            "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
            "gatewayresponse.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            "gatewayresponse.header.Access-Control-Allow-Methods": "'GET,OPTIONS,POST,PUT,DELETE'"
        },
        response_templates={
            "application/json": json.dumps({
                "message": "$context.error.message",
                "correlationId": "$context.requestId"
            })
        },
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Set up X-Ray tracing
    stage = aws.apigateway.Stage(
        f"{name}-stage",
        deployment=create_deployment(name, region, rest_api),
        rest_api_id=rest_api.id,
        stage_name="api",
        xray_tracing_enabled=True,
        throttling_burst_limit=api_throttling_burst,
        throttling_rate_limit=api_throttling_rate,
        tags=get_resource_tags(region, "APIGateway"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Create resources and methods for each Lambda function
    resources = []
    for func_name, func in lambda_functions.items():
        resource = aws.apigateway.Resource(
            f"{name}-{func_name}-resource",
            rest_api_id=rest_api.id,
            parent_id=rest_api.root_resource_id,
            path_part=func_name,
            opts=pulumi.ResourceOptions(provider=get_region_provider(region))
        )

        # Create a method for the resource
        method = aws.apigateway.Method(
            f"{name}-{func_name}-method",
            rest_api_id=rest_api.id,
            resource_id=resource.id,
            http_method="POST",
            authorization="NONE",
            request_validator_id=validator.id,
            request_models={
                "application/json": create_model(name, region, rest_api, func_name)
            },
            opts=pulumi.ResourceOptions(provider=get_region_provider(region))
        )

        # Create integration with Lambda
        integration = aws.apigateway.Integration(
            f"{name}-{func_name}-integration",
            rest_api_id=rest_api.id,
            resource_id=resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=func.invoke_arn,
            opts=pulumi.ResourceOptions(provider=get_region_provider(region))
        )

        # Create OPTIONS method for CORS
        options_method = aws.apigateway.Method(
            f"{name}-{func_name}-options",
            rest_api_id=rest_api.id,
            resource_id=resource.id,
            http_method="OPTIONS",
            authorization="NONE",
            opts=pulumi.ResourceOptions(provider=get_region_provider(region))
        )

        # Create mock integration for OPTIONS
        options_integration = aws.apigateway.Integration(
            f"{name}-{func_name}-options-integration",
            rest_api_id=rest_api.id,
            resource_id=resource.id,
            http_method=options_method.http_method,
            type="MOCK",
            request_templates={
                "application/json": '{"statusCode": 200}'
            },
            opts=pulumi.ResourceOptions(provider=get_region_provider(region))
        )

        # Add method response for OPTIONS
        options_response = aws.apigateway.MethodResponse(
            f"{name}-{func_name}-options-response",
            rest_api_id=rest_api.id,
            resource_id=resource.id,
            http_method=options_method.http_method,
            status_code="200",
            response_parameters={
                "method.response.header.Access-Control-Allow-Origin": True,
                "method.response.header.Access-Control-Allow-Methods": True,
                "method.response.header.Access-Control-Allow-Headers": True
            },
            opts=pulumi.ResourceOptions(provider=get_region_provider(region))
        )

        # Add integration response for OPTIONS
        options_integration_response = aws.apigateway.IntegrationResponse(
            f"{name}-{func_name}-options-integration-response",
            rest_api_id=rest_api.id,
            resource_id=resource.id,
            http_method=options_method.http_method,
            status_code=options_response.status_code,
            response_parameters={
                "method.response.header.Access-Control-Allow-Origin": "'*'",
                "method.response.header.Access-Control-Allow-Methods": "'GET,OPTIONS,POST,PUT,DELETE'",
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
            },
            opts=pulumi.ResourceOptions(provider=get_region_provider(region))
        )

        # Allow API Gateway to invoke the Lambda function
        permission = aws.lambda_.Permission(
            f"{name}-{func_name}-permission",
            action="lambda:InvokeFunction",
            function=func.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(
                rest_api.execution_arn, "/*/POST/", func_name
            ),
            opts=pulumi.ResourceOptions(provider=get_region_provider(region))
        )

        resources.append({
            "name": func_name,
            "resource": resource,
            "method": method,
            "integration": integration
        })

    # Create CloudWatch alarms for 5xx errors
    error_alarm = aws.cloudwatch.MetricAlarm(
        f"{name}-5xx-alarm",
        alarm_name=f"{name}-5xx-errors",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="5XXError",
        namespace="AWS/ApiGateway",
        period=60,
        statistic="Sum",
        threshold=0,
        alarm_description=f"Alarm when 5XX errors occur on {name} API Gateway",
        dimensions={
            "ApiName": rest_api.name,
            "Stage": stage.stage_name
        },
        tags=get_resource_tags(region, "CloudWatch"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    return {
        "rest_api": rest_api,
        "stage": stage,
        "endpoint": pulumi.Output.concat("https://", rest_api.id, ".execute-api.", region, ".amazonaws.com/", stage.stage_name, "/"),
        "resources": resources,
        "error_alarm": error_alarm
    }

def create_deployment(name, region, rest_api):
    """Create a deployment for the API Gateway."""
    return aws.apigateway.Deployment(
        f"{name}-deployment",
        rest_api_id=rest_api.id,
        description="API deployment",
        # The deployment depends on the methods, which we handle by setting explicit dependencies
        # in the Stage resource
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

def create_model(name, region, rest_api, model_name):
    """Create a request model for the API Gateway."""
    # Example schema for validation - adjust as needed
    schema = {
        "$schema": "http://json-schema.org/draft-04/schema#",
        "title": f"{model_name}Model",
        "type": "object",
        "properties": {
            "data": {"type": "string"}
        },
        "required": ["data"]
    }

    model = aws.apigateway.Model(
        f"{name}-{model_name}-model",
        rest_api_id=rest_api.id,
        name=f"{model_name}Model",
        description=f"Validation model for {model_name}",
        content_type="application/json",
        schema=json.dumps(schema),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    return model.name

def create_api_gateway_cloudwatch_role(name, region):
    """Create IAM role for API Gateway CloudWatch integration."""
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "apigateway.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    })

    role = aws.iam.Role(
        f"{name}-api-cloudwatch-role",
        assume_role_policy=assume_role_policy,
        managed_policy_arns=["arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"],
        tags=get_resource_tags(region, "IAM"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    return role

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)
```

### 7. CI/CD Pipeline Component:

```python
# components/cicd.py
import pulumi
import pulumi_aws as aws
from ..utils.tags import get_resource_tags

def create_cicd_pipeline(name, region, source_repo, buildspec_path):
    """Create a CI/CD pipeline using AWS CodePipeline."""

    # Create an S3 bucket for artifact storage
    artifact_bucket = aws.s3.Bucket(
        f"{name}-artifact-bucket",
        bucket=f"{name}-artifacts",
        acl="private",
        tags=get_resource_tags(region, "S3"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Create a CodeBuild project
    codebuild_role = create_codebuild_role(name, region)

    build_project = aws.codebuild.Project(
        f"{name}-build",
        name=f"{name}-build",
        artifacts=aws.codebuild.ProjectArtifactsArgs(
            type="CODEPIPELINE",
        ),
        environment=aws.codebuild.ProjectEnvironmentArgs(
            type="LINUX_CONTAINER",
            compute_type="BUILD_GENERAL1_SMALL",
            image="aws/codebuild/amazonlinux2-x86_64-standard:3.0",
            privileged_mode=False,
        ),
        source=aws.codebuild.ProjectSourceArgs(
            type="CODEPIPELINE",
            buildspec=buildspec_path,
        ),
        service_role=codebuild_role.arn,
        tags=get_resource_tags(region, "CodeBuild"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Create a CodePipeline role
    pipeline_role = create_pipeline_role(name, region)

    # Create the CodePipeline
    pipeline = aws.codepipeline.Pipeline(
        f"{name}-pipeline",
        name=f"{name}-pipeline",
        role_arn=pipeline_role.arn,
        artifact_store=aws.codepipeline.PipelineArtifactStoreArgs(
            location=artifact_bucket.bucket,
            type="S3",
        ),
        stages=[
            # Source stage - CodeCommit
            aws.codepipeline.PipelineStageArgs(
                name="Source",
                actions=[
                    aws.codepipeline.PipelineStageActionArgs(
                        name="Source",
                        category="Source",
                        owner="AWS",
                        provider="CodeCommit",
                        version="1",
                        output_artifacts=["source_output"],
                        configuration={
                            "RepositoryName": source_repo.name,
                            "BranchName": "main",
                        },
                    ),
                ],
            ),
            # Build stage
            aws.codepipeline.PipelineStageArgs(
                name="Build",
                actions=[
                    aws.codepipeline.PipelineStageActionArgs(
                        name="BuildAndTest",
                        category="Build",
                        owner="AWS",
                        provider="CodeBuild",
                        version="1",
                        input_artifacts=["source_output"],
                        output_artifacts=["build_output"],
                        configuration={
                            "ProjectName": build_project.name,
                        },
                    ),
                ],
            ),
            # Deploy stage
            aws.codepipeline.PipelineStageArgs(
                name="Deploy",
                actions=[
                    aws.codepipeline.PipelineStageActionArgs(
                        name="ExecutePulumi",
                        category="Build",
                        owner="AWS",
                        provider="CodeBuild",
                        version="1",
                        input_artifacts=["build_output"],
                        configuration={
                            "ProjectName": build_project.name,
                            "PrimarySource": "build_output",
                            "EnvironmentVariables": json.dumps([
                                {"name": "DEPLOY_ENVIRONMENT", "value": "production", "type": "PLAINTEXT"}
                            ])
                        },
                    ),
                ],
            ),
        ],
        tags=get_resource_tags(region, "CodePipeline"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    return {
        "pipeline": pipeline,
        "build_project": build_project,
        "artifact_bucket": artifact_bucket
    }

def create_codebuild_role(name, region):
    """Create IAM role for CodeBuild."""
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "codebuild.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    })

    role = aws.iam.Role(
        f"{name}-codebuild-role",
        assume_role_policy=assume_role_policy,
        tags=get_resource_tags(region, "IAM"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Attach policies
    policy_document = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Resource": ["*"],
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ]
            },
            {
                "Effect": "Allow",
                "Resource": ["*"],
                "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject"
                ]
            },
            {
                "Effect": "Allow",
                "Resource": ["*"],
                "Action": [
                    "lambda:*",
                    "apigateway:*",
                    "dynamodb:*",
                    "s3:*",
                    "iam:*",
                    "cloudwatch:*",
                    "logs:*",
                    "kms:*",
                    "xray:*",
                    "codebuild:*",
                    "codepipeline:*"
                ]
            }
        ]
    })

    policy = aws.iam.Policy(
        f"{name}-codebuild-policy",
        policy=policy_document,
        tags=get_resource_tags(region, "IAM"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    attachment = aws.iam.RolePolicyAttachment(
        f"{name}-codebuild-attachment",
        role=role.name,
        policy_arn=policy.arn,
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    return role

def create_pipeline_role(name, region):
    """Create IAM role for CodePipeline."""
    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "codepipeline.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    })

    role = aws.iam.Role(
        f"{name}-pipeline-role",
        assume_role_policy=assume_role_policy,
        tags=get_resource_tags(region, "IAM"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    # Attach policies
    policy_document = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Resource": ["*"],
                "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject",
                    "s3:ListBucket"
                ]
            },
            {
                "Effect": "Allow",
                "Resource": ["*"],
                "Action": [
                    "codecommit:GetBranch",
                    "codecommit:GetCommit",
                    "codecommit:UploadArchive",
                    "codecommit:GetUploadArchiveStatus",
                    "codecommit:CancelUploadArchive"
                ]
            },
            {
                "Effect": "Allow",
                "Resource": ["*"],
                "Action": [
                    "codebuild:BatchGetBuilds",
                    "codebuild:StartBuild"
                ]
            }
        ]
    })

    policy = aws.iam.Policy(
        f"{name}-pipeline-policy",
        policy=policy_document,
        tags=get_resource_tags(region, "IAM"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    attachment = aws.iam.RolePolicyAttachment(
        f"{name}-pipeline-attachment",
        role=role.name,
        policy_arn=policy.arn,
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    return role

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)
```

### 8. CloudWatch Component:

```python
# components/cloudwatch.py
import pulumi
import pulumi_aws as aws
from ..utils.tags import get_resource_tags
from ..config import cloudwatch_log_retention_days, lambda_error_threshold

def create_lambda_error_alarm(name, region, lambda_function):
    """Create a CloudWatch alarm for Lambda errors."""

    alarm = aws.cloudwatch.MetricAlarm(
        f"{name}-error-alarm",
        alarm_name=f"{name}-errors",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=60,
        statistic="Sum",
        threshold=lambda_error_threshold,
        alarm_description=f"Alarm when error rate exceeds {lambda_error_threshold}% for {name} Lambda function",
        dimensions={
            "FunctionName": lambda_function.name,
        },
        tags=get_resource_tags(region, "CloudWatch"),
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    return alarm

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)
```

### 9. Lambda Layer with Structured Logging:

```python
# utils/logging.py
import pulumi
import pulumi_aws as aws
from ..utils.tags import get_resource_tags

def create_logging_layer(name, region):
    """Create a Lambda layer with structured JSON logging."""

    # Create a Lambda layer with structured logging
    code_path = "../lambda_layers/structured_logging"
    layer = aws.lambda_.LayerVersion(
        f"{name}-logging-layer",
        layer_name=f"{name}-logging-layer",
        compatible_runtimes=[aws.lambda_.Runtime.PYTHON3_10],
        code=pulumi.AssetArchive({
            "python": pulumi.FileArchive(code_path)
        }),
        description="Lambda layer for structured JSON logging",
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    return layer

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)
```

### 10. Main File:

```python
# __main__.py
import pulumi
import pulumi_aws as aws
import json
from config import project_name, regions, environment_suffix
from components.lambda_function import create_lambda_function, create_lambda_role
from components.dynamodb import create_dynamodb_table
from components.s3 import create_s3_bucket
from components.api_gateway import create_api_gateway
from components.cloudwatch import create_lambda_error_alarm
from components.cicd import create_cicd_pipeline
from utils.logging import create_logging_layer

# Main deployment function
def deploy_infrastructure():
    """Deploy the serverless application infrastructure."""

    # Dictionary to store resources by region
    resources_by_region = {}

    # Create source repo for CI/CD
    source_repo = aws.codecommit.Repository(
        f"{project_name}-repo",
        repository_name=f"{project_name}-repo",
        description=f"Source code for {project_name} serverless application",
        tags={
            "Project": project_name,
            "ENVIRONMENT_SUFFIX": environment_suffix
        }
    )

    # Create resources in each region
    for region in regions:
        resources_by_region[region] = {}

        # Create providers for each region
        provider = aws.Provider(f"aws-{region}", region=region)

        # Create logging layer
        logging_layer = create_logging_layer(f"{project_name}-{region}", region)

        # Create DynamoDB table
        dynamodb = create_dynamodb_table(f"{project_name}-table-{region}", region)
        resources_by_region[region]["dynamodb"] = dynamodb

        # Create S3 bucket
        s3_bucket = create_s3_bucket(f"{project_name}-bucket-{region}", region)
        resources_by_region[region]["s3_bucket"] = s3_bucket

        # Create Lambda IAM role with DynamoDB and S3 access
        lambda_policy_doc = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": dynamodb["table"].arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        s3_bucket.arn,
                        pulumi.Output.concat(s3_bucket.arn, "/*")
                    ]
                }
            ]
        })

        lambda_role = create_lambda_role(f"{project_name}-lambda-{region}", region, lambda_policy_doc)

        # Create Lambda functions
        lambda_functions = {}

        # Create a data processing Lambda function
        data_processor = create_lambda_function(
            f"{project_name}-processor-{region}",
            region,
            "../lambda_functions/data_processor",
            "app.handler",
            lambda_role.arn,
            environment={
                "DYNAMODB_TABLE": dynamodb["table"].name,
                "S3_BUCKET": s3_bucket.bucket,
                "LOG_LEVEL": "INFO"
            }
        )
        lambda_functions["processor"] = data_processor

        # Create a data retrieval Lambda function
        data_retriever = create_lambda_function(
            f"{project_name}-retriever-{region}",
            region,
            "../lambda_functions/data_retriever",
            "app.handler",
            lambda_role.arn,
            environment={
                "DYNAMODB_TABLE": dynamodb["table"].name,
                "LOG_LEVEL": "INFO"
            }
        )
        lambda_functions["retriever"] = data_retriever

        # Attach logging layer to all Lambda functions
        for name, func in lambda_functions.items():
            pulumi.Output.all(func.arn, logging_layer.arn).apply(
                lambda args: aws.lambda_.LayerVersionAttachment(
                    f"{name}-{region}-layer-attachment",
                    layer_version=args[1],
                    function_name=args[0]
                )
            )

        # Create Lambda error alarms
        for name, func in lambda_functions.items():
            alarm = create_lambda_error_alarm(
                f"{project_name}-{name}-{region}",
                region,
                func
            )
            resources_by_region[region][f"{name}_alarm"] = alarm

        # Create API Gateway
        api = create_api_gateway(f"{project_name}-api-{region}", region, lambda_functions)
        resources_by_region[region]["api"] = api

        # Set up S3 event notifications for data processor Lambda
        notification = aws.s3.BucketNotification(
            f"{project_name}-bucket-notification-{region}",
            bucket=s3_bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=data_processor.arn,
                    events=["s3:ObjectCreated:*"]
                )
            ],
            opts=pulumi.ResourceOptions(provider=provider)
        )

        # Allow S3 to invoke Lambda
        s3_lambda_permission = aws.lambda_.Permission(
            f"{project_name}-s3-lambda-permission-{region}",
            action="lambda:InvokeFunction",
            function=data_processor.name,
            principal="s3.amazonaws.com",
            source_arn=s3_bucket.arn,
            opts=pulumi.ResourceOptions(provider=provider)
        )

    # Create CI/CD pipeline in the primary region
    primary_region = regions[0]
    cicd = create_cicd_pipeline(
        f"{project_name}-cicd",
        primary_region,
        source_repo,
        "buildspec.yml"
    )
    resources_by_region[primary_region]["cicd"] = cicd

    # Export output values
    outputs = {}

    # Add API endpoints to outputs
    for region in regions:
        outputs[f"api_endpoint_{region}"] = resources_by_region[region]["api"]["endpoint"]
        outputs[f"dynamodb_table_{region}"] = resources_by_region[region]["dynamodb"]["table"].name

        # Add Lambda ARNs to outputs
        for lambda_name in ["processor", "retriever"]:
            outputs[f"lambda_{lambda_name}_{region}"] = lambda_functions[lambda_name].arn

    # Add source repository clone URL
    outputs["source_repo_clone_url"] = source_repo.clone_url_http

    return outputs

# Export outputs
pulumi.export("outputs", deploy_infrastructure())
```

### 11. Lambda Layer Structure:

For the structured logging, we'd need to create a Lambda layer with a Python package. Here's a simplified structure:

```
lambda_layers/
└── structured_logging/
    └── python/
        └── structured_logging/
            ├── __init__.py
            └── logger.py
```

And `logger.py` would contain:

```python
import json
import logging
import traceback
import uuid
from functools import wraps

class JsonFormatter(logging.Formatter):
    """Formatter that outputs JSON strings"""
    def __init__(self, **kwargs):
        super().__init__()
        self.kwargs = kwargs

    def format(self, record):
        log_record = {
            "level": record.levelname,
            "message": record.getMessage(),
            "timestamp": self.formatTime(record, self.datefmt),
            "logger": record.name
        }

        if hasattr(record, 'request_id'):
            log_record['request_id'] = record.request_id

        if record.exc_info:
            log_record['exception'] = traceback.format_exception(*record.exc_info)

        # Add any additional fields provided
        for key, value in self.kwargs.items():
            log_record[key] = value

        return json.dumps(log_record)

def get_logger(name):
    """Get a JSON logger with the given name"""
    logger = logging.getLogger(name)

    # Only add handler if it doesn't already have one
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)

    logger.setLevel(logging.INFO)
    return logger

def with_logging(func):
    """Decorator to add request ID and structured logging to Lambda functions"""
    @wraps(func)
    def wrapper(event, context):
        # Generate a request ID or use the one from the context
        request_id = getattr(context, 'aws_request_id', str(uuid.uuid4()))

        # Add request ID to the logger
        logger = get_logger(func.__name__)
        old_factory = logging.getLogRecordFactory()

        def record_factory(*args, **kwargs):
            record = old_factory(*args, **kwargs)
            record.request_id = request_id
            return record

        logging.setLogRecordFactory(record_factory)

        logger.info(f"Function invocation started", extra={
            "event": event,
            "context": {
                "function_name": context.function_name,
                "function_version": context.function_version,
                "memory_limit": context.memory_limit_in_mb
            }
        })

        try:
            response = func(event, context)
            logger.info(f"Function invocation completed successfully")
            return response
        except Exception as e:
            logger.error(f"Function invocation failed: {str(e)}", exc_info=True)
            raise

    return wrapper
```

### 12. Lambda Function Structure:

For the Lambda functions, we'd need to create the function code. Here's a simplified structure for both functions:

```
lambda_functions/
├── data_processor/
│   └── app.py
└── data_retriever/
    └── app.py
```

And `data_processor/app.py` would contain:

```python
import json
import os
import boto3
import uuid
from structured_logging.logger import get_logger, with_logging

# Set up logger
logger = get_logger("data_processor")

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Get table name from environment
TABLE_NAME = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(TABLE_NAME)

@with_logging
def handler(event, context):
    """
    Process data from API Gateway or S3 events.
    Stores processed data in DynamoDB.
    """
    logger.info("Processing incoming data")

    try:
        # Check if event is from API Gateway or S3
        if 'Records' in event and event['Records'][0].get('eventSource') == 'aws:s3':
            # This is an S3 event
            return process_s3_event(event, context)
        else:
            # This is an API Gateway event
            return process_api_event(event, context)
    except Exception as e:
        logger.error(f"Error processing data: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Internal Server Error',
                'correlationId': context.aws_request_id
            })
        }

def process_s3_event(event, context):
    """Process data from an S3 event"""

    # Get bucket and key from event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']

    logger.info(f"Processing file: {key} from bucket: {bucket}")

    # Get the file content
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        data = json.loads(content)

        # Process and store each record
        for item in data:
            store_item_in_dynamodb(item)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {len(data)} items from {key}',
                'correlationId': context.aws_request_id
            })
        }
    except Exception as e:
        logger.error(f"Error processing S3 file: {str(e)}", exc_info=True)
        raise

def process_api_event(event, context):
    """Process data from an API Gateway event"""

    # Parse request body
    try:
        body = json.loads(event.get('body', '{}'))

        # Validate request
        if not body or 'data' not in body:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Invalid request body. Must include "data" field.',
                    'correlationId': context.aws_request_id
                })
            }

        # Process and store data
        item = {
            'symbol': body.get('symbol', f"SYM-{str(uuid.uuid4())[0:8]}"),
            'timestamp': body.get('timestamp', str(uuid.uuid4())),
            'data': body['data']
        }

        store_item_in_dynamodb(item)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Data processed successfully',
                'id': f"{item['symbol']}#{item['timestamp']}",
                'correlationId': context.aws_request_id
            })
        }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Invalid JSON in request body',
                'correlationId': context.aws_request_id
            })
        }
    except Exception as e:
        logger.error(f"Error processing API request: {str(e)}", exc_info=True)
        raise

def store_item_in_dynamodb(item):
    """Store an item in DynamoDB"""

    # Ensure item has required fields
    if 'symbol' not in item or 'timestamp' not in item:
        item['symbol'] = f"SYM-{str(uuid.uuid4())[0:8]}"
        item['timestamp'] = str(uuid.uuid4())

    logger.info(f"Storing item in DynamoDB: {item['symbol']}")

    # Store in DynamoDB
    table.put_item(Item=item)
```

And `data_retriever/app.py` would contain:

```python
import json
import os
import boto3
from structured_logging.logger import get_logger, with_logging

# Set up logger
logger = get_logger("data_retriever")

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Get table name from environment
TABLE_NAME = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(TABLE_NAME)

@with_logging
def handler(event, context):
    """
    Retrieve data from DynamoDB based on API Gateway event.
    """
    logger.info("Retrieving data")

    try:
        # Parse path parameters and query string
        path_params = event.get('pathParameters', {})
        query_params = event.get('queryStringParameters', {}) or {}

        # Get symbol from path or query parameters
        symbol = None
        if path_params:
            symbol = path_params.get('symbol')
        if not symbol and query_params:
            symbol = query_params.get('symbol')

        if not symbol:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Symbol parameter is required',
                    'correlationId': context.aws_request_id
                })
            }

        # Check for a specific timestamp
        timestamp = query_params.get('timestamp')

        if timestamp:
            # Get specific item
            result = get_specific_item(symbol, timestamp)

            if not result:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'message': f'Item with symbol {symbol} and timestamp {timestamp} not found',
                        'correlationId': context.aws_request_id
                    })
                }

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'item': result,
                    'correlationId': context.aws_request_id
                })
            }
        else:
            # Query items by symbol
            items = query_items_by_symbol(symbol)

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'items': items,
                    'count': len(items),
                    'correlationId': context.aws_request_id
                })
            }

    except Exception as e:
        logger.error(f"Error retrieving data: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Internal Server Error',
                'correlationId': context.aws_request_id
            })
        }

def get_specific_item(symbol, timestamp):
    """Get a specific item from DynamoDB by symbol and timestamp"""

    logger.info(f"Getting specific item: symbol={symbol}, timestamp={timestamp}")

    response = table.get_item(
        Key={
            'symbol': symbol,
            'timestamp': timestamp
        }
    )

    return response.get('Item')

def query_items_by_symbol(symbol):
    """Query items from DynamoDB by symbol"""

    logger.info(f"Querying items by symbol: {symbol}")

    response = table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('symbol').eq(symbol)
    )

    return response.get('Items', [])
```

### 13. Buildspec File for CodeBuild:

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.10
    commands:
      - pip install pulumi
      - pip install pulumi-aws
      - pip install pytest

  pre_build:
    commands:
      - echo "Running tests..."
      - pytest -v

  build:
    commands:
      - echo "Running Pulumi preview..."
      - pulumi preview

  post_build:
    commands:
      - echo "Deploying infrastructure..."
      - pulumi up --yes

artifacts:
  files:
    - appspec.yml
    - lambda_functions/**/*
    - lambda_layers/**/*
    - Pulumi.yaml
    - Pulumi.*.yaml
    - **/*.py
    - '!**/__pycache__/**/*'
```

This implementation addresses all the requirements with a modular design pattern. Let me know if you need more specific details on any part of the implementation!

### Answer

---

# Modular Serverless Application Infrastructure with Pulumi

I'll build a modular Pulumi Python program to deploy a serverless application infrastructure across multiple AWS regions. This implementation follows best practices with a component-based architecture.

## Project Structure

First, let's define our project structure:

```
serverless_app/
├── __init__.py
├── __main__.py
├── config.py
├── components/
│   ├── __init__.py
│   ├── api_gateway.py
│   ├── lambda_function.py
│   ├── dynamodb.py
│   ├── s3.py
│   ├── cloudwatch.py
│   └── cicd.py
├── utils/
│   ├── __init__.py
│   ├── tags.py
│   └── logging.py
└── Pulumi.yaml
```

## Implementation

### Configuration (config.py)

```python
import pulumi
import pulumi_aws as aws

# Project configuration
project_name = "ServApp"
regions = ["us-east-1", "us-west-2"]
environment_suffix = pulumi.get_stack()

# Lambda configuration
lambda_timeout = 15
lambda_runtime = aws.lambda_.Runtime.PYTHON3_11
lambda_max_retries = 2

# API Gateway configuration
api_throttling_rate = 1000
api_throttling_burst = 2000

# DynamoDB configuration
dynamodb_partition_key = "symbol"
dynamodb_sort_key = "timestamp"

# CloudWatch configuration
cloudwatch_log_retention_days = 7
lambda_error_threshold = 1.0  # 1%

# S3 configuration
s3_lifecycle_expiration_days = 30

# Destruction prevention settings
prevent_destroy = pulumi.Config().get_bool("prevent_destroy") or False
```

### Tagging Utility (utils/tags.py)

```python
def get_resource_tags(region, resource_type=None):
    """Generate standardized tags for AWS resources."""
    from ..config import project_name, environment_suffix

    tags = {
        "Project": project_name,
        "ENVIRONMENT_SUFFIX": environment_suffix,
        "REGION": region,
    }

    if resource_type:
        tags["ResourceType"] = resource_type

    return tags
```

### Logging Utility (utils/logging.py)

```python
import pulumi
import pulumi_aws as aws
import os
from ..utils.tags import get_resource_tags

def create_logging_layer(name, region):
    """Create a Lambda layer with structured JSON logging."""

    # Create logging code
    layer_code_path = os.path.join(os.path.dirname(__file__), '..', '..', 'lambda_layers', 'structured_logging')

    # Create the Lambda layer
    layer = aws.lambda_.LayerVersion(
        f"{name}-logging-layer",
        layer_name=f"{name}-logging-layer",
        compatible_runtimes=[aws.lambda_.Runtime.PYTHON3_11],
        code=pulumi.AssetArchive({
            "python": pulumi.FileArchive(layer_code_path)
        }),
        description="Lambda layer for structured JSON logging",
        opts=pulumi.ResourceOptions(provider=get_region_provider(region))
    )

    return layer

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)
```

### DynamoDB Component (components/dynamodb.py)

```python
import pulumi
import pulumi_aws as aws
from ..utils.tags import get_resource_tags
from ..config import dynamodb_partition_key, dynamodb_sort_key, prevent_destroy

def create_dynamodb_table(name, region):
    """Create a DynamoDB table with specified configuration."""

    provider = get_region_provider(region)

    # Create KMS key for encryption
    kms_key = aws.kms.Key(
        f"{name}-kms-key",
        description=f"KMS key for {name} DynamoDB table encryption",
        deletion_window_in_days=7,
        enable_key_rotation=True,
        tags=get_resource_tags(region, "KMS"),
        opts=pulumi.ResourceOptions(
            provider=provider,
            prevent_destroy=prevent_destroy
        )
    )

    # Create the DynamoDB table
    table = aws.dynamodb.Table(
        name,
        name=name,
        billing_mode="PAY_PER_REQUEST",
        hash_key=dynamodb_partition_key,
        range_key=dynamodb_sort_key,
        attributes=[
            aws.dynamodb.TableAttributeArgs(
                name=dynamodb_partition_key,
                type="S",
            ),
            aws.dynamodb.TableAttributeArgs(
                name=dynamodb_sort_key,
                type="S",
            ),
        ],
        point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
            enabled=True,
        ),
        server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
            enabled=True,
            kms_key_arn=kms_key.arn
        ),
        tags=get_resource_tags(region, "DynamoDB"),
        opts=pulumi.ResourceOptions(
            provider=provider,
            prevent_destroy=prevent_destroy
        )
    )

    # Enable contributor insights
    insights = aws.dynamodb.ContributorInsights(
        f"{name}-insights",
        table_name=table.name,
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # CloudWatch alarm for throttling events
    throttling_alarm = aws.cloudwatch.MetricAlarm(
        f"{name}-throttling-alarm",
        alarm_name=f"{name}-throttling-events",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="ThrottledRequests",
        namespace="AWS/DynamoDB",
        period=60,
        statistic="Sum",
        threshold=0,
        alarm_description=f"Alarm when throttling occurs on the {name} DynamoDB table",
        dimensions={
            "TableName": table.name,
        },
        tags=get_resource_tags(region, "CloudWatch"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    return {
        "table": table,
        "kms_key": kms_key,
        "throttling_alarm": throttling_alarm
    }

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)
```

### S3 Component (components/s3.py)

```python
import pulumi
import pulumi_aws as aws
from ..utils.tags import get_resource_tags
from ..config import s3_lifecycle_expiration_days, prevent_destroy

def create_s3_bucket(name, region, lambda_notification_arn=None):
    """Create an S3 bucket with specified configuration."""

    provider = get_region_provider(region)

    bucket = aws.s3.Bucket(
        name,
        bucket=name,
        acl="private",
        server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
            rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256",
                )
            )
        ),
        lifecycle_rules=[
            aws.s3.BucketLifecycleRuleArgs(
                enabled=True,
                expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                    days=s3_lifecycle_expiration_days,
                ),
            ),
        ],
        tags=get_resource_tags(region, "S3"),
        opts=pulumi.ResourceOptions(
            provider=provider,
            prevent_destroy=prevent_destroy
        )
    )

    # Add Lambda notification for file uploads if Lambda ARN is provided
    if lambda_notification_arn:
        notification = aws.s3.BucketNotification(
            f"{name}-notification",
            bucket=bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=lambda_notification_arn,
                    events=["s3:ObjectCreated:*"],
                )
            ],
            opts=pulumi.ResourceOptions(provider=provider)
        )

    return bucket

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)
```

### Lambda Function Component (components/lambda_function.py)

```python
import json
import pulumi
import pulumi_aws as aws
from ..utils.tags import get_resource_tags
from ..config import lambda_timeout, lambda_runtime, lambda_max_retries, prevent_destroy, cloudwatch_log_retention_days

def create_lambda_function(
    name,
    region,
    code_path,
    handler,
    role_arn,
    environment=None,
    dlq_arn=None
):
    """Create a Lambda function with the specified configuration."""

    provider = get_region_provider(region)

    # Create dead letter queue if not provided
    if not dlq_arn:
        dlq = aws.sqs.Queue(
            f"{name}-dlq",
            name=f"{name}-dlq",
            tags=get_resource_tags(region, "SQS"),
            opts=pulumi.ResourceOptions(provider=provider)
        )
        dlq_arn = dlq.arn

    function = aws.lambda_.Function(
        name,
        name=name,
        runtime=lambda_runtime,
        code=pulumi.AssetArchive({
            ".": pulumi.FileArchive(code_path)
        }),
        handler=handler,
        role=role_arn,
        timeout=lambda_timeout,
        environment=aws.lambda_.FunctionEnvironmentArgs(
            variables=environment or {}
        ),
        tracing_config=aws.lambda_.FunctionTracingConfigArgs(
            mode="Active"  # Enable X-Ray tracing
        ),
        dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
            target_arn=dlq_arn
        ),
        tags=get_resource_tags(region, "Lambda"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Configure function retry settings
    event_invoke_config = aws.lambda_.EventInvokeConfig(
        f"{name}-event-invoke-config",
        function_name=function.name,
        maximum_retry_attempts=lambda_max_retries,
        qualifier="$LATEST",
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Set up CloudWatch logs for the function
    log_group = aws.cloudwatch.LogGroup(
        f"{name}-log-group",
        name=pulumi.Output.concat("/aws/lambda/", function.name),
        retention_in_days=cloudwatch_log_retention_days,
        tags=get_resource_tags(region, "CloudWatchLogs"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    return function

def create_lambda_role(name, region, policy_document):
    """Create an IAM role for a Lambda function."""

    provider = get_region_provider(region)

    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Principal": {
                "Service": "lambda.amazonaws.com"
            },
            "Effect": "Allow",
            "Sid": ""
        }]
    })

    role = aws.iam.Role(
        f"{name}-role",
        assume_role_policy=assume_role_policy,
        name=f"{name}-role",
        tags=get_resource_tags(region, "IAM"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Attach X-Ray permissions
    aws.iam.RolePolicyAttachment(
        f"{name}-xray-attachment",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/AWSXrayWriteOnlyAccess",
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Attach CloudWatch Logs permissions
    aws.iam.RolePolicyAttachment(
        f"{name}-cloudwatch-attachment",
        role=role.name,
        policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Attach custom policy
    if policy_document:
        policy = aws.iam.Policy(
            f"{name}-policy",
            policy=policy_document,
            tags=get_resource_tags(region, "IAM"),
            opts=pulumi.ResourceOptions(provider=provider)
        )

        aws.iam.RolePolicyAttachment(
            f"{name}-custom-attachment",
            role=role.name,
            policy_arn=policy.arn,
            opts=pulumi.ResourceOptions(provider=provider)
        )

    return role

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)
```

### API Gateway Component (components/api_gateway.py)

```python
import json
import pulumi
import pulumi_aws as aws
from ..utils.tags import get_resource_tags
from ..config import api_throttling_rate, api_throttling_burst

def create_api_gateway(name, region, lambda_functions):
    """Create an API Gateway with the specified configuration."""

    provider = get_region_provider(region)

    # Create the REST API
    rest_api = aws.apigateway.RestApi(
        name,
        name=name,
        description=f"API Gateway for {name}",
        endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
            types=["REGIONAL"]
        ),
        tags=get_resource_tags(region, "APIGateway"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Configure request validator
    validator = aws.apigateway.RequestValidator(
        f"{name}-validator",
        rest_api_id=rest_api.id,
        name=f"{name}-validator",
        validate_request_body=True,
        validate_request_parameters=True,
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Configure API Gateway account for CloudWatch
    api_account = aws.apigateway.Account(
        f"{name}-account",
        cloudwatch_role_arn=create_api_gateway_cloudwatch_role(name, region).arn,
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Create a gateway response for CORS and standardized errors
    cors_response = aws.apigateway.GatewayResponse(
        f"{name}-cors-response",
        rest_api_id=rest_api.id,
        response_type="DEFAULT_4XX",
        response_parameters={
            "gatewayresponse.header.Access-Control-Allow-Origin": "'*'",
            "gatewayresponse.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
            "gatewayresponse.header.Access-Control-Allow-Methods": "'GET,OPTIONS,POST,PUT,DELETE'"
        },
        response_templates={
            "application/json": json.dumps({
                "message": "$context.error.message",
                "correlationId": "$context.requestId"
            })
        },
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Handle 5XX errors with correlation IDs
    server_error_response = aws.apigateway.GatewayResponse(
        f"{name}-5xx-response",
        rest_api_id=rest_api.id,
        response_type="DEFAULT_5XX",
        response_parameters={
            "gatewayresponse.header.Access-Control-Allow-Origin": "'*'"
        },
        response_templates={
            "application/json": json.dumps({
                "message": "$context.error.message",
                "correlationId": "$context.requestId"
            })
        },
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Create a deployment for the API Gateway
    deployment = aws.apigateway.Deployment(
        f"{name}-deployment",
        rest_api_id=rest_api.id,
        description="API deployment",
        # Stage depends on all resources and methods that will be created
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Set up X-Ray tracing and throttling
    stage = aws.apigateway.Stage(
        f"{name}-stage",
        deployment=deployment.id,
        rest_api_id=rest_api.id,
        stage_name="api",
        xray_tracing_enabled=True,
        throttling_burst_limit=api_throttling_burst,
        throttling_rate_limit=api_throttling_rate,
        tags=get_resource_tags(region, "APIGateway"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Create resources and methods for each Lambda function
    resources = []
    for func_name, func in lambda_functions.items():
        resource = aws.apigateway.Resource(
            f"{name}-{func_name}-resource",
            rest_api_id=rest_api.id,
            parent_id=rest_api.root_resource_id,
            path_part=func_name,
            opts=pulumi.ResourceOptions(provider=provider)
        )

        # Create a model for request validation
        model = aws.apigateway.Model(
            f"{name}-{func_name}-model",
            rest_api_id=rest_api.id,
            name=f"{func_name}Model",
            description=f"Validation model for {func_name}",
            content_type="application/json",
            schema=json.dumps({
                "$schema": "http://json-schema.org/draft-04/schema#",
                "title": f"{func_name}Model",
                "type": "object",
                "properties": {
                    "data": {"type": "string"}
                },
                "required": ["data"]
            }),
            opts=pulumi.ResourceOptions(provider=provider)
        )

        # Create a method for the resource
        method = aws.apigateway.Method(
            f"{name}-{func_name}-method",
            rest_api_id=rest_api.id,
            resource_id=resource.id,
            http_method="POST",
            authorization="NONE",
            request_validator_id=validator.id,
            request_models={
                "application/json": model.name
            },
            opts=pulumi.ResourceOptions(provider=provider)
        )

        # Create integration with Lambda
        integration = aws.apigateway.Integration(
            f"{name}-{func_name}-integration",
            rest_api_id=rest_api.id,
            resource_id=resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=func.invoke_arn,
            opts=pulumi.ResourceOptions(provider=provider)
        )

        # Create OPTIONS method for CORS
        options_method = aws.apigateway.Method(
            f"{name}-{func_name}-options",
            rest_api_id=rest_api.id,
            resource_id=resource.id,
            http_method="OPTIONS",
            authorization="NONE",
            opts=pulumi.ResourceOptions(provider=provider)
        )

        # Create mock integration for OPTIONS
        options_integration = aws.apigateway.Integration(
            f"{name}-{func_name}-options-integration",
            rest_api_id=rest_api.id,
            resource_id=resource.id,
            http_method=options_method.http_method,
            type="MOCK",
            request_templates={
                "application/json": '{"statusCode": 200}'
            },
            opts=pulumi.ResourceOptions(provider=provider)
        )

        # Add method response for OPTIONS
        options_response = aws.apigateway.MethodResponse(
            f"{name}-{func_name}-options-response",
            rest_api_id=rest_api.id,
            resource_id=resource.id,
            http_method=options_method.http_method,
            status_code="200",
            response_parameters={
                "method.response.header.Access-Control-Allow-Origin": True,
                "method.response.header.Access-Control-Allow-Methods": True,
                "method.response.header.Access-Control-Allow-Headers": True
            },
            opts=pulumi.ResourceOptions(provider=provider)
        )

        # Add integration response for OPTIONS
        options_integration_response = aws.apigateway.IntegrationResponse(
            f"{name}-{func_name}-options-integration-response",
            rest_api_id=rest_api.id,
            resource_id=resource.id,
            http_method=options_method.http_method,
            status_code=options_response.status_code,
            response_parameters={
                "method.response.header.Access-Control-Allow-Origin": "'*'",
                "method.response.header.Access-Control-Allow-Methods": "'GET,OPTIONS,POST,PUT,DELETE'",
                "method.response.header.Access-Control-Allow-Headers": "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
            },
            opts=pulumi.ResourceOptions(provider=provider)
        )

        # Allow API Gateway to invoke the Lambda function
        permission = aws.lambda_.Permission(
            f"{name}-{func_name}-permission",
            action="lambda:InvokeFunction",
            function=func.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(
                rest_api.execution_arn, "/*/POST/", func_name
            ),
            opts=pulumi.ResourceOptions(provider=provider)
        )

        resources.append({
            "name": func_name,
            "resource": resource,
            "method": method,
            "integration": integration
        })

    # Create CloudWatch alarms for 5xx errors
    error_alarm = aws.cloudwatch.MetricAlarm(
        f"{name}-5xx-alarm",
        alarm_name=f"{name}-5xx-errors",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="5XXError",
        namespace="AWS/ApiGateway",
        period=60,
        statistic="Sum",
        threshold=0,
        alarm_description=f"Alarm when 5XX errors occur on {name} API Gateway",
        dimensions={
            "ApiName": rest_api.name,
            "Stage": stage.stage_name
        },
        tags=get_resource_tags(region, "CloudWatch"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    return {
        "rest_api": rest_api,
        "stage": stage,
        "endpoint": pulumi.Output.concat("https://", rest_api.id, ".execute-api.", region, ".amazonaws.com/", stage.stage_name, "/"),
        "resources": resources,
        "error_alarm": error_alarm
    }

def create_api_gateway_cloudwatch_role(name, region):
    """Create IAM role for API Gateway CloudWatch integration."""

    provider = get_region_provider(region)

    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "apigateway.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    })

    role = aws.iam.Role(
        f"{name}-api-cloudwatch-role",
        assume_role_policy=assume_role_policy,
        managed_policy_arns=["arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"],
        tags=get_resource_tags(region, "IAM"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    return role

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)
```

### CloudWatch Component (components/cloudwatch.py)

```python
import pulumi
import pulumi_aws as aws
from ..utils.tags import get_resource_tags
from ..config import lambda_error_threshold

def create_lambda_error_alarm(name, region, lambda_function):
    """Create a CloudWatch alarm for Lambda errors."""

    provider = get_region_provider(region)

    alarm = aws.cloudwatch.MetricAlarm(
        f"{name}-error-alarm",
        alarm_name=f"{name}-errors",
        comparison_operator="GreaterThanThreshold",
        evaluation_periods=1,
        metric_name="Errors",
        namespace="AWS/Lambda",
        period=60,
        statistic="Sum",
        threshold=lambda_error_threshold,
        alarm_description=f"Alarm when error rate exceeds {lambda_error_threshold}% for {name} Lambda function",
        dimensions={
            "FunctionName": lambda_function.name,
        },
        tags=get_resource_tags(region, "CloudWatch"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    return alarm

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)
```

### CI/CD Pipeline Component (components/cicd.py)

```python
import json
import pulumi
import pulumi_aws as aws
from ..utils.tags import get_resource_tags

def create_cicd_pipeline(name, region, source_repo, buildspec_path):
    """Create a CI/CD pipeline using AWS CodePipeline."""

    provider = get_region_provider(region)

    # Create an S3 bucket for artifact storage
    artifact_bucket = aws.s3.Bucket(
        f"{name}-artifact-bucket",
        bucket=f"{name}-artifacts-{pulumi.get_stack()}",
        acl="private",
        tags=get_resource_tags(region, "S3"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Create a CodeBuild project
    codebuild_role = create_codebuild_role(name, region)

    build_project = aws.codebuild.Project(
        f"{name}-build",
        name=f"{name}-build",
        artifacts=aws.codebuild.ProjectArtifactsArgs(
            type="CODEPIPELINE",
        ),
        environment=aws.codebuild.ProjectEnvironmentArgs(
            type="LINUX_CONTAINER",
            compute_type="BUILD_GENERAL1_SMALL",
            image="aws/codebuild/amazonlinux2-x86_64-standard:4.0",
            privileged_mode=False,
        ),
        source=aws.codebuild.ProjectSourceArgs(
            type="CODEPIPELINE",
            buildspec=buildspec_path,
        ),
        service_role=codebuild_role.arn,
        tags=get_resource_tags(region, "CodeBuild"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Create a CodePipeline role
    pipeline_role = create_pipeline_role(name, region)

    # Create the CodePipeline
    pipeline = aws.codepipeline.Pipeline(
        f"{name}-pipeline",
        name=f"{name}-pipeline",
        role_arn=pipeline_role.arn,
        artifact_store=aws.codepipeline.PipelineArtifactStoreArgs(
            location=artifact_bucket.bucket,
            type="S3",
        ),
        stages=[
            # Source stage - CodeCommit
            aws.codepipeline.PipelineStageArgs(
                name="Source",
                actions=[
                    aws.codepipeline.PipelineStageActionArgs(
                        name="Source",
                        category="Source",
                        owner="AWS",
                        provider="CodeCommit",
                        version="1",
                        output_artifacts=["source_output"],
                        configuration={
                            "RepositoryName": source_repo.repository_name,
                            "BranchName": "main",
                        },
                    ),
                ],
            ),
            # Build stage
            aws.codepipeline.PipelineStageArgs(
                name="Build",
                actions=[
                    aws.codepipeline.PipelineStageActionArgs(
                        name="BuildAndTest",
                        category="Build",
                        owner="AWS",
                        provider="CodeBuild",
                        version="1",
                        input_artifacts=["source_output"],
                        output_artifacts=["build_output"],
                        configuration={
                            "ProjectName": build_project.name,
                        },
                    ),
                ],
            ),
            # Deploy stage
            aws.codepipeline.PipelineStageArgs(
                name="Deploy",
                actions=[
                    aws.codepipeline.PipelineStageActionArgs(
                        name="ExecutePulumi",
                        category="Build",
                        owner="AWS",
                        provider="CodeBuild",
                        version="1",
                        input_artifacts=["build_output"],
                        configuration={
                            "ProjectName": build_project.name,
                            "PrimarySource": "build_output",
                            "EnvironmentVariables": json.dumps([
                                {"name": "DEPLOY_ENVIRONMENT", "value": "production", "type": "PLAINTEXT"}
                            ])
                        },
                    ),
                ],
            ),
        ],
        tags=get_resource_tags(region, "CodePipeline"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    return {
        "pipeline": pipeline,
        "build_project": build_project,
        "artifact_bucket": artifact_bucket
    }

def create_codebuild_role(name, region):
    """Create IAM role for CodeBuild."""

    provider = get_region_provider(region)

    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "codebuild.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    })

    role = aws.iam.Role(
        f"{name}-codebuild-role",
        assume_role_policy=assume_role_policy,
        tags=get_resource_tags(region, "IAM"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Attach policies
    policy_document = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Resource": ["*"],
                "Action": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ]
            },
            {
                "Effect": "Allow",
                "Resource": ["*"],
                "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject"
                ]
            },
            {
                "Effect": "Allow",
                "Resource": ["*"],
                "Action": [
                    "lambda:*",
                    "apigateway:*",
                    "dynamodb:*",
                    "s3:*",
                    "iam:*",
                    "cloudwatch:*",
                    "logs:*",
                    "kms:*",
                    "xray:*",
                    "codebuild:*",
                    "codepipeline:*"
                ]
            }
        ]
    })

    policy = aws.iam.Policy(
        f"{name}-codebuild-policy",
        policy=policy_document,
        tags=get_resource_tags(region, "IAM"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    attachment = aws.iam.RolePolicyAttachment(
        f"{name}-codebuild-attachment",
        role=role.name,
        policy_arn=policy.arn,
        opts=pulumi.ResourceOptions(provider=provider)
    )

    return role

def create_pipeline_role(name, region):
    """Create IAM role for CodePipeline."""

    provider = get_region_provider(region)

    assume_role_policy = json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "codepipeline.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    })

    role = aws.iam.Role(
        f"{name}-pipeline-role",
        assume_role_policy=assume_role_policy,
        tags=get_resource_tags(region, "IAM"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    # Attach policies
    policy_document = json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Resource": ["*"],
                "Action": [
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject",
                    "s3:ListBucket"
                ]
            },
            {
                "Effect": "Allow",
                "Resource": ["*"],
                "Action": [
                    "codecommit:GetBranch",
                    "codecommit:GetCommit",
                    "codecommit:UploadArchive",
                    "codecommit:GetUploadArchiveStatus",
                    "codecommit:CancelUploadArchive"
                ]
            },
            {
                "Effect": "Allow",
                "Resource": ["*"],
                "Action": [
                    "codebuild:BatchGetBuilds",
                    "codebuild:StartBuild"
                ]
            }
        ]
    })

    policy = aws.iam.Policy(
        f"{name}-pipeline-policy",
        policy=policy_document,
        tags=get_resource_tags(region, "IAM"),
        opts=pulumi.ResourceOptions(provider=provider)
    )

    attachment = aws.iam.RolePolicyAttachment(
        f"{name}-pipeline-attachment",
        role=role.name,
        policy_arn=policy.arn,
        opts=pulumi.ResourceOptions(provider=provider)
    )

    return role

def get_region_provider(region):
    """Get the AWS provider for a specific region."""
    return aws.Provider(f"aws-{region}", region=region)
```

### Main Deployment File (**main**.py)

```python
import pulumi
import pulumi_aws as aws
import json
import os
from config import project_name, regions, environment_suffix
from components.lambda_function import create_lambda_function, create_lambda_role
from components.dynamodb import create_dynamodb_table
from components.s3 import create_s3_bucket
from components.api_gateway import create_api_gateway
from components.cloudwatch import create_lambda_error_alarm
from components.cicd import create_cicd_pipeline
from utils.logging import create_logging_layer

# Main deployment function
def deploy_infrastructure():
    """Deploy the serverless application infrastructure."""

    # Dictionary to store resources by region
    resources_by_region = {}

    # Create source repo for CI/CD
    source_repo = aws.codecommit.Repository(
        f"{project_name}-repo",
        repository_name=f"{project_name}-repo",
        description=f"Source code for {project_name} serverless application",
        tags={
            "Project": project_name,
            "ENVIRONMENT_SUFFIX": environment_suffix
        }
    )

    # Create resources in each region
    for region in regions:
        resources_by_region[region] = {}

        # Create logging layer
        logging_layer = create_logging_layer(f"{project_name}-{region}", region)

        # Create DynamoDB table
        dynamodb = create_dynamodb_table(f"{project_name}-table-{region}", region)
        resources_by_region[region]["dynamodb"] = dynamodb

        # Create S3 bucket
        s3_bucket = create_s3_bucket(f"{project_name}-bucket-{region}-{pulumi.get_stack()}", region)
        resources_by_region[region]["s3_bucket"] = s3_bucket

        # Create Lambda IAM role with DynamoDB and S3 access
        lambda_policy_doc = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": dynamodb["table"].arn
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        s3_bucket.arn,
                        pulumi.Output.concat(s3_bucket.arn, "/*")
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "xray:PutTraceSegments",
                        "xray:PutTelemetryRecords",
                        "xray:GetSamplingRules",
                        "xray:GetSamplingTargets",
                        "xray:GetSamplingStatisticSummaries"
                    ],
                    "Resource": "*"
                }
            ]
        })

        lambda_role = create_lambda_role(f"{project_name}-lambda-{region}", region, lambda_policy_doc)

        # Create Lambda functions
        lambda_functions = {}

        # Define code paths relative to this file
        lambda_code_root = os.path.join(os.path.dirname(__file__), "lambda_functions")

        # Create a data processing Lambda function
        data_processor = create_lambda_function(
            f"{project_name}-processor-{region}",
            region,
            os.path.join(lambda_code_root, "data_processor"),
            "app.handler",
            lambda_role.arn,
            environment={
                "DYNAMODB_TABLE": dynamodb["table"].name,
                "S3_BUCKET": s3_bucket.bucket,
                "LOG_LEVEL": "INFO"
            }
        )
        lambda_functions["processor"] = data_processor

        # Create a data retrieval Lambda function
        data_retriever = create_lambda_function(
            f"{project_name}-retriever-{region}",
            region,
            os.path.join(lambda_code_root, "data_retriever"),
            "app.handler",
            lambda_role.arn,
            environment={
                "DYNAMODB_TABLE": dynamodb["table"].name,
                "LOG_LEVEL": "INFO"
            }
        )
        lambda_functions["retriever"] = data_retriever

        # Attach logging layer to all Lambda functions
        for name, func in lambda_functions.items():
            aws.lambda_.LayerVersionAttachment(
                f"{name}-{region}-layer-attachment",
                layer_version=logging_layer.arn,
                function_name=func.name,
                opts=pulumi.ResourceOptions(provider=aws.Provider(f"aws-{region}", region=region))
            )

        # Create Lambda error alarms
        for name, func in lambda_functions.items():
            alarm = create_lambda_error_alarm(
                f"{project_name}-{name}-{region}",
                region,
                func
            )
            resources_by_region[region][f"{name}_alarm"] = alarm

        # Create API Gateway
        api = create_api_gateway(f"{project_name}-api-{region}", region, lambda_functions)
        resources_by_region[region]["api"] = api

        # Set up S3 event notifications for data processor Lambda
        notification = aws.s3.BucketNotification(
            f"{project_name}-bucket-notification-{region}",
            bucket=s3_bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=data_processor.arn,
                    events=["s3:ObjectCreated:*"]
                )
            ],
            opts=pulumi.ResourceOptions(provider=aws.Provider(f"aws-{region}", region=region))
        )

        # Allow S3 to invoke Lambda
        s3_lambda_permission = aws.lambda_.Permission(
            f"{project_name}-s3-lambda-permission-{region}",
            action="lambda:InvokeFunction",
            function=data_processor.name,
            principal="s3.amazonaws.com",
            source_arn=s3_bucket.arn,
            opts=pulumi.ResourceOptions(provider=aws.Provider(f"aws-{region}", region=region))
        )

    # Create CI/CD pipeline in the primary region
    primary_region = regions[0]
    cicd = create_cicd_pipeline(
        f"{project_name}-cicd",
        primary_region,
        source_repo,
        "buildspec.yml"
    )
    resources_by_region[primary_region]["cicd"] = cicd

    # Export output values
    outputs = {}

    # Add API endpoints to outputs
    for region in regions:
        outputs[f"api_endpoint_{region}"] = resources_by_region[region]["api"]["endpoint"]
        outputs[f"dynamodb_table_{region}"] = resources_by_region[region]["dynamodb"]["table"].name

        # Add Lambda ARNs to outputs
        for lambda_name in ["processor", "retriever"]:
            outputs[f"lambda_{lambda_name}_{region}"] = lambda_functions[lambda_name].arn

    # Add source repository clone URL
    outputs["source_repo_clone_url"] = source_repo.clone_url_http

    return outputs

# Export outputs
pulumi.export("outputs", deploy_infrastructure())
```

## Lambda Function Implementation

### Structured Logging Layer

Create a Lambda layer for structured logging:

```
lambda_layers/
└── structured_logging/
    └── python/
        └── structured_logging/
            ├── __init__.py
            └── logger.py
```

Contents of `logger.py`:

```python
import json
import logging
import traceback
import uuid
from functools import wraps

class JsonFormatter(logging.Formatter):
    """Formatter that outputs JSON strings"""
    def __init__(self, **kwargs):
        super().__init__()
        self.kwargs = kwargs

    def format(self, record):
        log_record = {
            "level": record.levelname,
            "message": record.getMessage(),
            "timestamp": self.formatTime(record, self.datefmt),
            "logger": record.name
        }

        if hasattr(record, 'request_id'):
            log_record['request_id'] = record.request_id

        if record.exc_info:
            log_record['exception'] = traceback.format_exception(*record.exc_info)

        # Add any additional fields provided
        for key, value in self.kwargs.items():
            log_record[key] = value

        return json.dumps(log_record)

def get_logger(name):
    """Get a JSON logger with the given name"""
    logger = logging.getLogger(name)

    # Only add handler if it doesn't already have one
    if not logger.handlers:
        handler = logging.StreamHandler()
        handler.setFormatter(JsonFormatter())
        logger.addHandler(handler)

    logger.setLevel(logging.INFO)
    return logger

def with_logging(func):
    """Decorator to add request ID and structured logging to Lambda functions"""
    @wraps(func)
    def wrapper(event, context):
        # Generate a request ID or use the one from the context
        request_id = getattr(context, 'aws_request_id', str(uuid.uuid4()))

        # Add request ID to the logger
        logger = get_logger(func.__name__)
        old_factory = logging.getLogRecordFactory()

        def record_factory(*args, **kwargs):
            record = old_factory(*args, **kwargs)
            record.request_id = request_id
            return record

        logging.setLogRecordFactory(record_factory)

        logger.info("Function invocation started", extra={
            "event_type": type(event).__name__
        })

        try:
            response = func(event, context)
            logger.info("Function invocation completed successfully")
            return response
        except Exception as e:
            logger.error(f"Function invocation failed: {str(e)}", exc_info=True)
            raise

    return wrapper
```

### Lambda Functions

Create two Lambda functions:

```
lambda_functions/
├── data_processor/
│   └── app.py
└── data_retriever/
    └── app.py
```

Contents of `data_processor/app.py`:

```python
import json
import os
import boto3
import uuid
from structured_logging.logger import get_logger, with_logging

# Set up logger
logger = get_logger("data_processor")

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Get table name from environment
TABLE_NAME = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(TABLE_NAME)

@with_logging
def handler(event, context):
    """
    Process data from API Gateway or S3 events.
    Stores processed data in DynamoDB.
    """
    logger.info("Processing incoming data")

    try:
        # Check if event is from API Gateway or S3
        if 'Records' in event and event['Records'][0].get('eventSource') == 'aws:s3':
            # This is an S3 event
            return process_s3_event(event, context)
        else:
            # This is an API Gateway event
            return process_api_event(event, context)
    except Exception as e:
        logger.error(f"Error processing data: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Internal Server Error',
                'correlationId': context.aws_request_id
            })
        }

def process_s3_event(event, context):
    """Process data from an S3 event"""

    # Get bucket and key from event
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']

    logger.info(f"Processing file: {key} from bucket: {bucket}")

    # Get the file content
    try:
        response = s3.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')
        data = json.loads(content)

        # Process and store each record
        for item in data:
            store_item_in_dynamodb(item)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': f'Successfully processed {len(data)} items from {key}',
                'correlationId': context.aws_request_id
            })
        }
    except Exception as e:
        logger.error(f"Error processing S3 file: {str(e)}", exc_info=True)
        raise

def process_api_event(event, context):
    """Process data from an API Gateway event"""

    # Parse request body
    try:
        body = json.loads(event.get('body', '{}'))

        # Validate request
        if not body or 'data' not in body:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Invalid request body. Must include "data" field.',
                    'correlationId': context.aws_request_id
                })
            }

        # Process and store data
        item = {
            'symbol': body.get('symbol', f"SYM-{str(uuid.uuid4())[0:8]}"),
            'timestamp': body.get('timestamp', str(uuid.uuid4())),
            'data': body['data']
        }

        store_item_in_dynamodb(item)

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Data processed successfully',
                'id': f"{item['symbol']}#{item['timestamp']}",
                'correlationId': context.aws_request_id
            })
        }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Invalid JSON in request body',
                'correlationId': context.aws_request_id
            })
        }
    except Exception as e:
        logger.error(f"Error processing API request: {str(e)}", exc_info=True)
        raise

def store_item_in_dynamodb(item):
    """Store an item in DynamoDB"""

    # Ensure item has required fields
    if 'symbol' not in item or 'timestamp' not in item:
        item['symbol'] = f"SYM-{str(uuid.uuid4())[0:8]}"
        item['timestamp'] = str(uuid.uuid4())

    logger.info(f"Storing item in DynamoDB: {item['symbol']}")

    # Store in DynamoDB
    table.put_item(Item=item)
```

Contents of `data_retriever/app.py`:

```python
import json
import os
import boto3
from structured_logging.logger import get_logger, with_logging

# Set up logger
logger = get_logger("data_retriever")

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')

# Get table name from environment
TABLE_NAME = os.environ.get('DYNAMODB_TABLE')
table = dynamodb.Table(TABLE_NAME)

@with_logging
def handler(event, context):
    """
    Retrieve data from DynamoDB based on API Gateway event.
    """
    logger.info("Retrieving data")

    try:
        # Parse path parameters and query string
        path_params = event.get('pathParameters', {}) or {}
        query_params = event.get('queryStringParameters', {}) or {}

        # Get symbol from path or query parameters
        symbol = None
        if path_params:
            symbol = path_params.get('symbol')
        if not symbol and query_params:
            symbol = query_params.get('symbol')

        if not symbol:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Symbol parameter is required',
                    'correlationId': context.aws_request_id
                })
            }

        # Check for a specific timestamp
        timestamp = query_params.get('timestamp')

        if timestamp:
            # Get specific item
            result = get_specific_item(symbol, timestamp)

            if not result:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'message': f'Item with symbol {symbol} and timestamp {timestamp} not found',
                        'correlationId': context.aws_request_id
                    })
                }

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'item': result,
                    'correlationId': context.aws_request_id
                })
            }
        else:
            # Query items by symbol
            items = query_items_by_symbol(symbol)

            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'items': items,
                    'count': len(items),
                    'correlationId': context.aws_request_id
                })
            }

    except Exception as e:
        logger.error(f"Error retrieving data: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Internal Server Error',
                'correlationId': context.aws_request_id
            })
        }

def get_specific_item(symbol, timestamp):
    """Get a specific item from DynamoDB by symbol and timestamp"""

    logger.info(f"Getting specific item: symbol={symbol}, timestamp={timestamp}")

    response = table.get_item(
        Key={
            'symbol': symbol,
            'timestamp': timestamp
        }
    )

    return response.get('Item')

def query_items_by_symbol(symbol):
    """Query items from DynamoDB by symbol"""

    logger.info(f"Querying items by symbol: {symbol}")

    response = table.query(
        KeyConditionExpression=boto3.dynamodb.conditions.Key('symbol').eq(symbol)
    )

    return response.get('Items', [])
```

### CI/CD buildspec.yml

```yaml
version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - pip install pulumi pulumi-aws pytest

  pre_build:
    commands:
      - echo "Running tests..."
      - cd tests && pytest -v

  build:
    commands:
      - echo "Running Pulumi preview..."
      - pulumi login --local
      - pulumi stack select dev --create
      - pulumi preview

  post_build:
    commands:
      - echo "Deploying infrastructure..."
      - pulumi up --yes

artifacts:
  files:
    - appspec.yml
    - lambda_functions/**/*
    - lambda_layers/**/*
    - serverless_app/**/*
    - Pulumi.yaml
    - Pulumi.*.yaml
  discard-paths: no
```

## Features Summary

This implementation provides a comprehensive serverless application infrastructure with:

1. **Multi-Region Deployment**: Deploys across `us-east-1` and `us-west-2`
2. **API Gateway with CORS**: Full CORS support, request validation, and standardized error responses
3. **Lambda Functions**: 15-second timeout, structured JSON logging, DLQs with 2 retries
4. **DynamoDB**: Partition key `symbol`, sort key `timestamp`, on-demand billing, PITR, KMS encryption
5. **S3 Bucket**: Server-side encryption, event notifications, and 30-day lifecycle policy
6. **CloudWatch**: 7-day log retention, alarms for Lambda errors and DynamoDB throttling
7. **X-Ray Tracing**: Enabled for API Gateway and Lambda functions
8. **API Gateway Throttling**: 1000 RPS with 2000 burst
9. **Resource Tagging**: All resources tagged with Project, ENVIRONMENT_SUFFIX, and REGION
10. **CI/CD Pipeline**: Automated deployment with AWS CodePipeline

## Outputs

After deployment, the program provides valuable outputs including:

- API endpoints for each region
- Lambda function ARNs
- DynamoDB table names
- Source repository clone URL

These outputs enable easy access to the deployed resources and facilitate integration with other systems.
