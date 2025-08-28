```python
import pulumi
import pulumi_aws as aws
import json
from typing import Dict, Any

# Project configuration
project_name = "iac-aws-nova-model-breaking"
environment = pulumi.get_stack()

# Create S3 bucket for artifacts and source code
artifacts_bucket = aws.s3.Bucket(
    f"{project_name}-artifacts",
    bucket=f"{project_name}-artifacts-{environment}",
    versioning=aws.s3.BucketVersioningArgs(enabled=True),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256"
            )
        )
    ),
    public_access_block=aws.s3.BucketPublicAccessBlockArgs(
        block_public_acls=True,
        block_public_policy=True,
        ignore_public_acls=True,
        restrict_public_buckets=True,
    ),
    tags={"Environment": environment, "Project": project_name}
)

# Create CodeCommit repository for source control
codecommit_repo = aws.codecommit.Repository(
    f"{project_name}-repo",
    repository_name=f"{project_name}-repo",
    repository_description="Source repository for Nova Model Breaking application",
    tags={"Environment": environment, "Project": project_name}
)

# IAM role for CodeBuild
codebuild_role = aws.iam.Role(
    f"{project_name}-codebuild-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "codebuild.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }),
    tags={"Environment": environment, "Project": project_name}
)

# IAM policy for CodeBuild with minimal required permissions
codebuild_policy = aws.iam.RolePolicy(
    f"{project_name}-codebuild-policy",
    role=codebuild_role.id,
    policy=pulumi.Output.all(artifacts_bucket.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "arn:aws:logs:*:*:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:PutObject"
                    ],
                    "Resource": [f"{args[0]}/*"]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "lambda:UpdateFunctionCode",
                        "lambda:UpdateFunctionConfiguration",
                        "lambda:PublishVersion",
                        "lambda:UpdateAlias",
                        "lambda:GetFunction",
                        "lambda:CreateAlias"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "apigateway:*"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "cloudformation:*"
                    ],
                    "Resource": "*"
                }
            ]
        })
    )
)

# IAM role for Lambda function
lambda_role = aws.iam.Role(
    f"{project_name}-lambda-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "lambda.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }),
    managed_policy_arns=[
        "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    ],
    tags={"Environment": environment, "Project": project_name}
)

# Lambda function for the application
lambda_function = aws.lambda_.Function(
    f"{project_name}-function",
    function_name=f"{project_name}-function-{environment}",
    role=lambda_role.arn,
    handler="index.handler",
    runtime="python3.9",
    code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset("""
import json
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': 'Hello from Nova Model Breaking API!',
            'version': '1.0.0',
            'environment': 'production'
        })
    }
""")
    }),
    timeout=30,
    memory_size=128,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "ENVIRONMENT": environment,
            "PROJECT_NAME": project_name
        }
    ),
    tags={"Environment": environment, "Project": project_name}
)

# Lambda alias for blue-green deployments
lambda_alias = aws.lambda_.Alias(
    f"{project_name}-alias",
    function_name=lambda_function.name,
    function_version="$LATEST",
    name="live",
    routing_config=aws.lambda_.AliasRoutingConfigArgs(
        additional_version_weights={}
    )
)

# CloudWatch Log Group for Lambda
lambda_log_group = aws.cloudwatch.LogGroup(
    f"{project_name}-lambda-logs",
    name=lambda_function.name.apply(lambda name: f"/aws/lambda/{name}"),
    retention_in_days=14,
    tags={"Environment": environment, "Project": project_name}
)

# API Gateway REST API
api_gateway = aws.apigateway.RestApi(
    f"{project_name}-api",
    name=f"{project_name}-api-{environment}",
    description="API Gateway for Nova Model Breaking application",
    endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
        types="REGIONAL"
    ),
    tags={"Environment": environment, "Project": project_name}
)

# API Gateway resource
api_resource = aws.apigateway.Resource(
    f"{project_name}-api-resource",
    rest_api=api_gateway.id,
    parent_id=api_gateway.root_resource_id,
    path_part="nova"
)

# API Gateway method
api_method = aws.apigateway.Method(
    f"{project_name}-api-method",
    rest_api=api_gateway.id,
    resource_id=api_resource.id,
    http_method="GET",
    authorization="NONE"
)

# API Gateway integration
api_integration = aws.apigateway.Integration(
    f"{project_name}-api-integration",
    rest_api=api_gateway.id,
    resource_id=api_resource.id,
    http_method=api_method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=lambda_alias.arn.apply(
        lambda arn: f"arn:aws:apigateway:{aws.get_region().name}:lambda:path/2015-03-31/functions/{arn}/invocations"
    )
)

# API Gateway method response
api_method_response = aws.apigateway.MethodResponse(
    f"{project_name}-api-method-response",
    rest_api=api_gateway.id,
    resource_id=api_resource.id,
    http_method=api_method.http_method,
    status_code="200",
    response_models={
        "application/json": "Empty"
    }
)

# API Gateway integration response
api_integration_response = aws.apigateway.IntegrationResponse(
    f"{project_name}-api-integration-response",
    rest_api=api_gateway.id,
    resource_id=api_resource.id,
    http_method=api_method.http_method,
    status_code=api_method_response.status_code,
    response_templates={
        "application/json": ""
    },
    opts=pulumi.ResourceOptions(depends_on=[api_integration])
)

# API Gateway deployment
api_deployment = aws.apigateway.Deployment(
    f"{project_name}-api-deployment",
    rest_api=api_gateway.id,
    stage_name=environment,
    opts=pulumi.ResourceOptions(depends_on=[
        api_method,
        api_integration,
        api_method_response,
        api_integration_response
    ])
)

# Lambda permission for API Gateway
lambda_permission = aws.lambda_.Permission(
    f"{project_name}-lambda-permission",
    statement_id="AllowExecutionFromAPIGateway",
    action="lambda:InvokeFunction",
    function=lambda_alias.arn,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.all(api_gateway.execution_arn, environment).apply(
        lambda args: f"{args[0]}/*/*"
    )
)

# CloudWatch Log Group for API Gateway
api_log_group = aws.cloudwatch.LogGroup(
    f"{project_name}-api-logs",
    name=f"API-Gateway-Execution-Logs_{api_gateway.id}/{environment}",
    retention_in_days=14,
    tags={"Environment": environment, "Project": project_name}
)

# CodeBuild project for building and deploying
codebuild_project = aws.codebuild.Project(
    f"{project_name}-build",
    name=f"{project_name}-build-{environment}",
    description="Build project for Nova Model Breaking application",
    service_role=codebuild_role.arn,
    artifacts=aws.codebuild.ProjectArtifactsArgs(
        type="CODEPIPELINE"
    ),
    environment=aws.codebuild.ProjectEnvironmentArgs(
        compute_type="BUILD_GENERAL1_SMALL",
        image="aws/codebuild/amazonlinux2-x86_64-standard:3.0",
        type="LINUX_CONTAINER",
        environment_variables=[
            aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                name="LAMBDA_FUNCTION_NAME",
                value=lambda_function.function_name
            ),
            aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                name="LAMBDA_ALIAS_NAME",
                value=lambda_alias.name
            ),
            aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                name="ENVIRONMENT",
                value=environment
            )
        ]
    ),
    source=aws.codebuild.ProjectSourceArgs(
        type="CODEPIPELINE",
        buildspec="""
version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.9
    commands:
      - echo Installing dependencies...
      - pip install boto3
  pre_build:
    commands:
      - echo Pre-build phase started on `date`
      - echo Logging in to Amazon ECR...
  build:
    commands:
      - echo Build started on `date`
      - echo Creating deployment package...
      - zip -r deployment-package.zip index.py
      - echo Updating Lambda function code...
      - aws lambda update-function-code --function-name $LAMBDA_FUNCTION_NAME --zip-file fileb://deployment-package.zip
      - echo Publishing new version...
      - NEW_VERSION=$(aws lambda publish-version --function-name $LAMBDA_FUNCTION_NAME --query 'Version' --output text)
      - echo "New version: $NEW_VERSION"
      - echo Updating alias with traffic shifting...
      - aws lambda update-alias --function-name $LAMBDA_FUNCTION_NAME --name $LAMBDA_ALIAS_NAME --function-version $NEW_VERSION --routing-config AdditionalVersionWeights={}
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Deployment successful
artifacts:
  files:
    - '**/*'
"""
    ),
    tags={"Environment": environment, "Project": project_name}
)

# IAM role for CodePipeline
codepipeline_role = aws.iam.Role(
    f"{project_name}-codepipeline-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "codepipeline.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }),
    tags={"Environment": environment, "Project": project_name}
)

# IAM policy for CodePipeline
codepipeline_policy = aws.iam.RolePolicy(
    f"{project_name}-codepipeline-policy",
    role=codepipeline_role.id,
    policy=pulumi.Output.all(
        artifacts_bucket.arn,
        codecommit_repo.arn,
        codebuild_project.arn
    ).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetBucketVersioning",
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:PutObject"
                    ],
                    "Resource": [args[0], f"{args[0]}/*"]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "codecommit:CancelUploadArchive",
                        "codecommit:GetBranch",
                        "codecommit:GetCommit",
                        "codecommit:GetRepository",
                        "codecommit:ListBranches",
                        "codecommit:ListRepositories"
                    ],
                    "Resource": args[1]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "codebuild:BatchGetBuilds",
                        "codebuild:StartBuild"
                    ],
                    "Resource": args[2]
                }
            ]
        })
    )
)

# CodePipeline
codepipeline = aws.codepipeline.Pipeline(
    f"{project_name}-pipeline",
    name=f"{project_name}-pipeline-{environment}",
    role_arn=codepipeline_role.arn,
    artifact_store=aws.codepipeline.PipelineArtifactStoreArgs(
        location=artifacts_bucket.bucket,
        type="S3"
    ),
    stages=[
        # Source stage
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
                        "RepositoryName": codecommit_repo.repository_name,
                        "BranchName": "main"
                    }
                )
            ]
        ),
        # Build stage
        aws.codepipeline.PipelineStageArgs(
            name="Build",
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name="Build",
                    category="Build",
                    owner="AWS",
                    provider="CodeBuild",
                    version="1",
                    input_artifacts=["source_output"],
                    output_artifacts=["build_output"],
                    configuration={
                        "ProjectName": codebuild_project.name
                    }
                )
            ]
        )
    ],
    tags={"Environment": environment, "Project": project_name}
)

# CloudWatch Dashboard for monitoring
dashboard = aws.cloudwatch.Dashboard(
    f"{project_name}-dashboard",
    dashboard_name=f"{project_name}-dashboard-{environment}",
    dashboard_body=pulumi.Output.all(
        lambda_function.function_name,
        api_gateway.name,
        codepipeline.name
    ).apply(
        lambda args: json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "x": 0,
                    "y": 0,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Duration", "FunctionName", args[0]],
                            [".", "Errors", ".", "."],
                            [".", "Invocations", ".", "."]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws.get_region().name,
                        "title": "Lambda Metrics"
                    }
                },
                {
                    "type": "metric",
                    "x": 0,
                    "y": 6,
                    "width": 12,
                    "height": 6,
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "Count", "ApiName", args[1]],
                            [".", "Latency", ".", "."],
                            [".", "4XXError", ".", "."],
                            [".", "5XXError", ".", "."]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": aws.get_region().name,
                        "title": "API Gateway Metrics"
                    }
                },
                {
                    "type": "log",
                    "x": 0,
                    "y": 12,
                    "width": 24,
                    "height": 6,
                    "properties": {
                        "query": f"SOURCE '/aws/lambda/{args[0]}'\n| fields @timestamp, @message\n| sort @timestamp desc\n| limit 100",
                        "region": aws.get_region().name,
                        "title": "Lambda Logs"
                    }
                }
            ]
        })
    )
)

# CloudWatch Alarms for monitoring
lambda_error_alarm = aws.cloudwatch.MetricAlarm(
    f"{project_name}-lambda-error-alarm",
    alarm_name=f"{project_name}-lambda-errors-{environment}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="Errors",
    namespace="AWS/Lambda",
    period=300,
    statistic="Sum",
    threshold=5,
    alarm_description="This metric monitors lambda errors",
    dimensions={
        "FunctionName": lambda_function.function_name
    },
    tags={"Environment": environment, "Project": project_name}
)

api_error_alarm = aws.cloudwatch.MetricAlarm(
    f"{project_name}-api-error-alarm",
    alarm_name=f"{project_name}-api-errors-{environment}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="5XXError",
    namespace="AWS/ApiGateway",
    period=300,
    statistic="Sum",
    threshold=5,
    alarm_description="This metric monitors API Gateway 5XX errors",
    dimensions={
        "ApiName": api_gateway.name
    },
    tags={"Environment": environment, "Project": project_name}
)

# Output important information
pulumi.export("codecommit_repo_clone_url_http", codecommit_repo.clone_url_http)
pulumi.export("codecommit_repo_clone_url_ssh", codecommit_repo.clone_url_ssh)
pulumi.export("api_gateway_url", pulumi.Output.concat(
    "https://",
    api_gateway.id,
    ".execute-api.",
    aws.get_region().name,
    ".amazonaws.com/",
    environment,
    "/nova"
))
pulumi.export("lambda_function_name", lambda_function.function_name)
pulumi.export("codepipeline_name", codepipeline.name)
pulumi.export("dashboard_url", pulumi.Output.concat(
    "https://console.aws.amazon.com/cloudwatch/home?region=",
    aws.get_region().name,
    "#dashboards:name=",
    dashboard.dashboard_name
))
pulumi.export("artifacts_bucket", artifacts_bucket.bucket)

# Export security and monitoring information
pulumi.export("lambda_role_arn", lambda_role.arn)
pulumi.export("codebuild_role_arn", codebuild_role.arn)
pulumi.export("codepipeline_role_arn", codepipeline_role.arn)
pulumi.export("lambda_log_group", lambda_log_group.name)
pulumi.export("api_log_group", api_log_group.name)
```
