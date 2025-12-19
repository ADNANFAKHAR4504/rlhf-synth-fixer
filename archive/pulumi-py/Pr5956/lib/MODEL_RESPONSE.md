### Reasoning Trace

---

Let's break down the task:

1. We need to build a CI/CD pipeline using Pulumi with Python
2. The pipeline will automate the deployment of an AWS Lambda function
3. It will use AWS CodePipeline and AWS CodeBuild for the build and deployment
4. The trigger for deployments will be changes in an S3 bucket where source code archives are stored
5. We need to define IAM roles and policies with least privilege principles
6. Configure CloudWatch for logging and monitoring
7. Encrypt Lambda environment variables with KMS
8. Store versioned build artifacts in S3
9. Enable automatic rollback on deployment failure
10. All infrastructure as code using Pulumi + Python

I'll structure the Pulumi program in a modular way:

1. Define S3 buckets (source code and build artifacts)
2. Create KMS key for encryption
3. Define IAM roles and policies for the Lambda function and pipeline components
4. Create the Lambda function
5. Set up CloudWatch monitoring for the Lambda function
6. Create the CodeBuild project
7. Set up the CodePipeline pipeline
8. Configure automatic rollback mechanisms
9. Export relevant outputs

Let's start coding the Pulumi program:

```python
import pulumi
import pulumi_aws as aws
import json
import os

# Configuration
config = pulumi.Config()
lambda_name = config.get("lambdaName") or "sample-lambda"
lambda_runtime = "python3.8"
lambda_handler = "main.lambda_handler"
env_variables = config.get_object("lambdaEnvVariables") or {}

# Create S3 buckets for source code and artifacts
source_bucket = aws.s3.Bucket("lambda-source-bucket",
    acl="private",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True,
    ),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256",
            ),
        ),
    ),
    lifecycle_rules=[aws.s3.BucketLifecycleRuleArgs(
        enabled=True,
        expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
            days=90,
        ),
        noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
            days=30,
        ),
    )],
)

artifacts_bucket = aws.s3.Bucket("lambda-artifacts-bucket",
    acl="private",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True,
    ),
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256",
            ),
        ),
    ),
    lifecycle_rules=[aws.s3.BucketLifecycleRuleArgs(
        enabled=True,
        expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
            days=90,
        ),
        noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
            days=30,
        ),
    )],
)

# Create KMS key for encrypting Lambda environment variables
lambda_kms_key = aws.kms.Key("lambda-kms-key",
    description="KMS key for encrypting Lambda environment variables",
    deletion_window_in_days=30,
    enable_key_rotation=True,
    policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Sid": "Allow administration of the key",
                "Effect": "Allow",
                "Principal": {
                    "AWS": "arn:aws:iam::{}:root".format(aws.get_caller_identity().account_id)
                },
                "Action": "kms:*",
                "Resource": "*"
            }
        ]
    }),
)

lambda_kms_alias = aws.kms.Alias("lambda-kms-alias",
    name=pulumi.Output.concat("alias/", lambda_name, "-key"),
    target_key_id=lambda_kms_key.id,
)

# Create IAM role for Lambda function
lambda_role = aws.iam.Role("lambda-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com",
            },
        }],
    }),
)

# Attach basic Lambda execution policy to the Lambda role
lambda_policy = aws.iam.RolePolicy("lambda-policy",
    role=lambda_role.id,
    policy=json.dumps({
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
                    "kms:Decrypt"
                ],
                "Resource": lambda_kms_key.arn
            }
        ]
    }),
)

# Create CloudWatch log group for Lambda
lambda_log_group = aws.cloudwatch.LogGroup("lambda-log-group",
    name=pulumi.Output.concat("/aws/lambda/", lambda_name),
    retention_in_days=30,
)

# Create Lambda function (initial placeholder)
lambda_function = aws.lambda_.Function("lambda-function",
    name=lambda_name,
    role=lambda_role.arn,
    handler=lambda_handler,
    runtime=lambda_runtime,
    timeout=30,
    memory_size=128,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            key: value for key, value in env_variables.items()
        },
    ),
    kms_key_arn=lambda_kms_key.arn,
    # Initially we'll use a placeholder code as the actual code will come from the pipeline
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./placeholder_lambda")
    }),
    publish=True,  # Enable versioning
)

# Create CloudWatch alarm for Lambda errors
lambda_error_alarm = aws.cloudwatch.MetricAlarm("lambda-error-alarm",
    alarm_name=pulumi.Output.concat(lambda_name, "-errors"),
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=1,
    metric_name="Errors",
    namespace="AWS/Lambda",
    period=60,
    statistic="Sum",
    threshold=0,
    alarm_description="This metric monitors lambda function errors",
    dimensions={
        "FunctionName": lambda_function.name,
    },
    alarm_actions=[],  # You can add SNS topic ARNs here for notifications
)

# IAM roles for CodeBuild and CodePipeline
codebuild_role = aws.iam.Role("codebuild-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "codebuild.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    }),
)

codepipeline_role = aws.iam.Role("codepipeline-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {
                "Service": "codepipeline.amazonaws.com"
            },
            "Action": "sts:AssumeRole"
        }]
    }),
)

# IAM policies for CodeBuild
codebuild_policy = aws.iam.RolePolicy("codebuild-policy",
    role=codebuild_role.id,
    policy=pulumi.Output.all(source_bucket.arn, artifacts_bucket.arn).apply(
        lambda arns: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Resource": [
                        f"{arns[0]}",
                        f"{arns[0]}/*",
                        f"{arns[1]}",
                        f"{arns[1]}/*",
                    ],
                    "Action": [
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:PutObject"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Resource": [
                        f"arn:aws:logs:*:*:*"
                    ],
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Resource": [
                        lambda_function.arn
                    ],
                    "Action": [
                        "lambda:UpdateFunctionCode",
                        "lambda:GetFunction",
                        "lambda:PublishVersion",
                        "lambda:UpdateAlias",
                        "lambda:GetAlias",
                        "lambda:CreateAlias"
                    ]
                }
            ]
        })
    )
)

# IAM policies for CodePipeline
codepipeline_policy = aws.iam.RolePolicy("codepipeline-policy",
    role=codepipeline_role.id,
    policy=pulumi.Output.all(source_bucket.arn, artifacts_bucket.arn).apply(
        lambda arns: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Resource": [
                        f"{arns[0]}",
                        f"{arns[0]}/*",
                        f"{arns[1]}",
                        f"{arns[1]}/*",
                    ],
                    "Action": [
                        "s3:GetObject",
                        "s3:GetObjectVersion",
                        "s3:GetBucketVersioning",
                        "s3:PutObject"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Resource": "*",
                    "Action": [
                        "codebuild:BatchGetBuilds",
                        "codebuild:StartBuild"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Resource": [
                        lambda_function.arn
                    ],
                    "Action": [
                        "lambda:InvokeFunction",
                        "lambda:ListVersionsByFunction",
                        "lambda:GetFunction"
                    ]
                }
            ]
        })
    )
)

# Create a production alias for the Lambda function
lambda_prod_alias = aws.lambda_.Alias("lambda-prod-alias",
    name="production",
    function_name=lambda_function.name,
    function_version=lambda_function.version,
)

# Create CodeBuild project
build_project = aws.codebuild.Project("lambda-build-project",
    name=pulumi.Output.concat(lambda_name, "-build"),
    service_role=codebuild_role.arn,
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
        buildspec="""version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.8
  pre_build:
    commands:
      - echo Logging in to Amazon ECR...
      - echo Installing dependencies...
      - pip install -r requirements.txt -t .
  build:
    commands:
      - echo Build started on `date`
      - echo Packaging the Lambda function...
      - zip -r function.zip .
  post_build:
    commands:
      - echo Build completed on `date`
artifacts:
  files:
    - function.zip
    - appspec.yml
  base-directory: '.'
""",
    ),
)

# Create deployment testing project
test_project = aws.codebuild.Project("lambda-test-project",
    name=pulumi.Output.concat(lambda_name, "-test"),
    service_role=codebuild_role.arn,
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
        buildspec=pulumi.Output.all(lambda_function.name).apply(lambda name: f"""version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.8
  pre_build:
    commands:
      - echo Installing test dependencies...
      - pip install -r test-requirements.txt
  build:
    commands:
      - echo Running tests on `date`
      - python -m pytest
      - echo Invoking lambda function for smoke test...
      - aws lambda invoke --function-name {name} --payload '{{}}' response.json
      - cat response.json
  post_build:
    commands:
      - echo Tests completed on `date`
artifacts:
  files:
    - response.json
  base-directory: '.'
"""),
    ),
)

# Create CodePipeline
pipeline = aws.codepipeline.Pipeline("lambda-pipeline",
    name=pulumi.Output.concat(lambda_name, "-pipeline"),
    role_arn=codepipeline_role.arn,
    artifact_store=aws.codepipeline.PipelineArtifactStoreArgs(
        location=artifacts_bucket.bucket,
        type="S3",
    ),
    stages=[
        # Source stage - get source from S3
        aws.codepipeline.PipelineStageArgs(
            name="Source",
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name="Source",
                    category="Source",
                    owner="AWS",
                    provider="S3",
                    version="1",
                    output_artifacts=["SourceCode"],
                    configuration={
                        "S3Bucket": source_bucket.bucket,
                        "S3ObjectKey": "source.zip",
                        "PollForSourceChanges": "true",  # Trigger pipeline on S3 changes
                    },
                )
            ],
        ),
        # Build stage - build and package Lambda code
        aws.codepipeline.PipelineStageArgs(
            name="Build",
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name="BuildAction",
                    category="Build",
                    owner="AWS",
                    provider="CodeBuild",
                    input_artifacts=["SourceCode"],
                    output_artifacts=["BuildOutput"],
                    version="1",
                    configuration={
                        "ProjectName": build_project.name,
                    },
                )
            ],
        ),
        # Test stage - run tests on the Lambda function
        aws.codepipeline.PipelineStageArgs(
            name="Test",
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name="TestAction",
                    category="Test",
                    owner="AWS",
                    provider="CodeBuild",
                    input_artifacts=["BuildOutput"],
                    output_artifacts=["TestOutput"],
                    version="1",
                    configuration={
                        "ProjectName": test_project.name,
                    },
                )
            ],
        ),
        # Deploy stage - update Lambda function code
        aws.codepipeline.PipelineStageArgs(
            name="Deploy",
            actions=[
                aws.codepipeline.PipelineStageActionArgs(
                    name="DeployAction",
                    category="Deploy",
                    owner="AWS",
                    provider="Lambda",
                    input_artifacts=["BuildOutput"],
                    version="1",
                    configuration={
                        "FunctionName": lambda_function.name,
                        "DeploymentType": "Canary10Percent10Minutes",  # Progressive deployment with automatic rollback
                    },
                )
            ],
        ),
    ],
)

# CloudWatch log group for CodePipeline
pipeline_log_group = aws.cloudwatch.LogGroup("pipeline-log-group",
    name=pulumi.Output.concat("/aws/codepipeline/", pipeline.name),
    retention_in_days=30,
)

# CloudWatch alarm for pipeline failures
pipeline_failure_alarm = aws.cloudwatch.MetricAlarm("pipeline-failure-alarm",
    alarm_name=pulumi.Output.concat(pipeline.name, "-failures"),
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=1,
    metric_name="FailedPipelines",
    namespace="AWS/CodePipeline",
    period=300,
    statistic="Sum",
    threshold=0,
    alarm_description="This metric monitors pipeline failures",
    dimensions={
        "PipelineName": pipeline.name,
    },
    alarm_actions=[],  # You can add SNS topic ARNs here for notifications
)

# Create EventBridge rule for automatic rollbacks
rollback_rule = aws.cloudwatch.EventRule("lambda-deployment-failure-rule",
    description="Detect Lambda deployment failures and initiate rollback",
    event_pattern=json.dumps({
        "source": ["aws.codedeploy"],
        "detail-type": ["CodeDeploy Deployment State-change Notification"],
        "detail": {
            "state": ["FAILURE"],
            "application": [f"AppName-{lambda_function.name}"]
        }
    }),
)

# IAM role for the rollback function
rollback_role = aws.iam.Role("rollback-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "lambda.amazonaws.com",
            },
        }],
    }),
)

# Policy for rollback Lambda
rollback_policy = aws.iam.RolePolicy("rollback-policy",
    role=rollback_role.id,
    policy=json.dumps({
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
                    "lambda:UpdateFunctionCode",
                    "lambda:UpdateAlias",
                    "lambda:GetFunction",
                    "lambda:GetAlias",
                    "lambda:ListVersionsByFunction"
                ],
                "Resource": lambda_function.arn
            }
        ]
    }),
)

# Create Lambda function for handling rollbacks
rollback_function = aws.lambda_.Function("rollback-function",
    role=rollback_role.arn,
    runtime="python3.8",
    handler="index.handler",
    timeout=60,
    code=pulumi.AssetArchive({
        ".": pulumi.StringAsset("""
import boto3
import json
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

lambda_client = boto3.client('lambda')

def handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")

    # Extract the function name from the CodeDeploy event
    deployment_id = event['detail']['deploymentId']
    application_name = event['detail']['application']
    function_name = application_name.split('-')[1]  # Assumes format: "AppName-{lambda_function.name}"

    logger.info(f"Initiating rollback for Lambda function: {function_name}")

    try:
        # Get the current production alias
        alias_response = lambda_client.get_alias(
            FunctionName=function_name,
            Name='production'
        )

        # Get all versions
        versions_response = lambda_client.list_versions_by_function(
            FunctionName=function_name
        )

        # Find the previous stable version (not the failed one and not $LATEST)
        versions = versions_response['Versions']
        versions = [v for v in versions if v['Version'] != '$LATEST']
        versions.sort(key=lambda x: int(x['Version']), reverse=True)

        current_version = alias_response['FunctionVersion']

        # Find the previous version
        previous_version = None
        for version in versions:
            if version['Version'] != current_version:
                previous_version = version['Version']
                break

        if not previous_version:
            logger.error("No previous version found for rollback")
            return {
                'statusCode': 500,
                'body': json.dumps('No previous version found for rollback')
            }

        # Update the alias to point to the previous version
        lambda_client.update_alias(
            FunctionName=function_name,
            Name='production',
            FunctionVersion=previous_version
        )

        logger.info(f"Successfully rolled back {function_name} to version {previous_version}")

        return {
            'statusCode': 200,
            'body': json.dumps(f"Successfully rolled back to version {previous_version}")
        }

    except Exception as e:
        logger.error(f"Error during rollback: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps(f"Error during rollback: {str(e)}")
        }
""")
    }),
)

# Connect EventBridge rule to rollback Lambda function
rollback_target = aws.cloudwatch.EventTarget("rollback-target",
    rule=rollback_rule.name,
    arn=rollback_function.arn,
)

# Lambda permission to allow EventBridge to invoke the rollback function
rollback_permission = aws.lambda_.Permission("rollback-permission",
    action="lambda:InvokeFunction",
    function=rollback_function.name,
    principal="events.amazonaws.com",
    source_arn=rollback_rule.arn,
)

# Export important outputs
pulumi.export("lambda_function_name", lambda_function.name)
pulumi.export("lambda_function_arn", lambda_function.arn)
pulumi.export("lambda_prod_alias", lambda_prod_alias.name)
pulumi.export("source_bucket_name", source_bucket.bucket)
pulumi.export("artifacts_bucket_name", artifacts_bucket.bucket)
pulumi.export("pipeline_name", pipeline.name)
```

This Pulumi program provides a complete CI/CD pipeline for Lambda deployments. Let me walk through the components:

1. **S3 Buckets**: We create two buckets - one for source code and one for build artifacts. Both are versioned and encrypted.

2. **KMS Key**: For encrypting Lambda environment variables.

3. **IAM Roles & Policies**: Defined with least privilege principle for Lambda, CodeBuild, CodePipeline, and the rollback function.

4. **Lambda Function**: The target function that will be deployed via the pipeline.

5. **CloudWatch Monitoring**: Log groups for Lambda and the pipeline with alarms for errors.

6. **CodeBuild Projects**: One for building/packaging the Lambda code and another for testing.

7. **CodePipeline**: Four-stage pipeline (Source → Build → Test → Deploy) that gets triggered by changes in the S3 source bucket.

8. **Automatic Rollback**: Using EventBridge to detect deployment failures and a Lambda function to handle rollbacks.

9. **Lambda Alias**: For safely managing function versions in production.

Let me review what's here to see if anything is missing or can be improved:

The program covers all the requirements:

- Integrates AWS CodePipeline and CodeBuild for Lambda deployments
- Triggers deployments from S3 bucket changes
- Defines strict IAM roles and policies
- Configures CloudWatch for logging and monitoring
- Encrypts Lambda environment variables with KMS
- Stores versioned artifacts in S3
- Enables rollback capability
- Defined completely in Pulumi with Python

However, I noticed a few things we can improve:

1. **Lambda Deployment**: The deployment type "Canary10Percent10Minutes" may not be fully supported in the Lambda deployment action. We should consider using AWS CodeDeploy explicitly for proper canary deployments of Lambda.

2. **Structure**: We should make the code more modular by breaking it into logical components.

3. **Security**: We could enhance the bucket policies to ensure stricter access control.

Let me revise the program with these improvements:

```python
import pulumi
import pulumi_aws as aws
import json
import os

# Configuration
config = pulumi.Config()
lambda_name = config.get("lambdaName") or "sample-lambda"
lambda_runtime = "python3.8"
lambda_handler = "main.lambda_handler"
env_variables = config.get_object("lambdaEnvVariables") or {}
stack = pulumi.get_stack()
project = pulumi.get_project()

# Define tags that will be applied to all resources
tags = {
    "Environment": stack,
    "Project": project,
    "ManagedBy": "Pulumi"
}

class SecurityModule:
    def __init__(self, name_prefix):
        self.name_prefix = name_prefix
        # Create KMS key for encrypting Lambda environment variables
        self.lambda_kms_key = aws.kms.Key(f"{name_prefix}-kms-key",
            description="KMS key for encrypting Lambda environment variables",
            deletion_window_in_days=30,
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Allow administration of the key",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{aws.get_caller_identity().account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    }
                ]
            }),
            tags=tags,
        )

        self.lambda_kms_alias = aws.kms.Alias(f"{name_prefix}-kms-alias",
            name=pulumi.Output.concat("alias/", name_prefix, "-key"),
            target_key_id=self.lambda_kms_key.id,
        )

class StorageModule:
    def __init__(self, name_prefix):
        self.name_prefix = name_prefix
        # Create S3 buckets for source code and artifacts
        self.source_bucket = aws.s3.Bucket(f"{name_prefix}-source-bucket",
            acl="private",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True,
            ),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256",
                    ),
                ),
            ),
            lifecycle_rules=[aws.s3.BucketLifecycleRuleArgs(
                enabled=True,
                expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                    days=90,
                ),
                noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
                    days=30,
                ),
            )],
            tags=tags,
        )

        self.source_bucket_policy = aws.s3.BucketPolicy(f"{name_prefix}-source-bucket-policy",
            bucket=self.source_bucket.id,
            policy=self.source_bucket.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "DenyUnencryptedObjectUploads",
                        "Effect": "Deny",
                        "Principal": "*",
                        "Action": "s3:PutObject",
                        "Resource": f"{arn}/*",
                        "Condition": {
                            "StringNotEquals": {
                                "s3:x-amz-server-side-encryption": "AES256"
                            }
                        }
                    },
                    {
                        "Sid": "DenyInsecureConnections",
                        "Effect": "Deny",
                        "Principal": "*",
                        "Action": "s3:*",
                        "Resource": f"{arn}/*",
                        "Condition": {
                            "Bool": {
                                "aws:SecureTransport": "false"
                            }
                        }
                    }
                ]
            })),
        )

        self.artifacts_bucket = aws.s3.Bucket(f"{name_prefix}-artifacts-bucket",
            acl="private",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True,
            ),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256",
                    ),
                ),
            ),
            lifecycle_rules=[aws.s3.BucketLifecycleRuleArgs(
                enabled=True,
                expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                    days=90,
                ),
                noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
                    days=30,
                ),
            )],
            tags=tags,
        )

        self.artifacts_bucket_policy = aws.s3.BucketPolicy(f"{name_prefix}-artifacts-bucket-policy",
            bucket=self.artifacts_bucket.id,
            policy=self.artifacts_bucket.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "DenyUnencryptedObjectUploads",
                        "Effect": "Deny",
                        "Principal": "*",
                        "Action": "s3:PutObject",
                        "Resource": f"{arn}/*",
                        "Condition": {
                            "StringNotEquals": {
                                "s3:x-amz-server-side-encryption": "AES256"
                            }
                        }
                    },
                    {
                        "Sid": "DenyInsecureConnections",
                        "Effect": "Deny",
                        "Principal": "*",
                        "Action": "s3:*",
                        "Resource": f"{arn}/*",
                        "Condition": {
                            "Bool": {
                                "aws:SecureTransport": "false"
                            }
                        }
                    }
                ]
            })),
        )

class IAMModule:
    def __init__(self, name_prefix, kms_key_arn, lambda_arn=None, source_bucket_arn=None, artifacts_bucket_arn=None):
        self.name_prefix = name_prefix

        # Create IAM role for Lambda function
        self.lambda_role = aws.iam.Role(f"{name_prefix}-lambda-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com",
                    },
                }],
            }),
            tags=tags,
        )

        # Attach basic Lambda execution policy to the Lambda role
        self.lambda_policy = aws.iam.RolePolicy(f"{name_prefix}-lambda-policy",
            role=self.lambda_role.id,
            policy=json.dumps({
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
                            "kms:Decrypt"
                        ],
                        "Resource": kms_key_arn
                    }
                ]
            }),
        )

        # IAM roles for CodeBuild
        self.codebuild_role = aws.iam.Role(f"{name_prefix}-codebuild-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "codebuild.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=tags,
        )

        # IAM roles for CodePipeline
        self.codepipeline_role = aws.iam.Role(f"{name_prefix}-codepipeline-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "codepipeline.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=tags,
        )

        # IAM role for CodeDeploy
        self.codedeploy_role = aws.iam.Role(f"{name_prefix}-codedeploy-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "codedeploy.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=tags,
        )

        # Attach AWS managed policy for CodeDeploy
        self.codedeploy_policy_attachment = aws.iam.RolePolicyAttachment(f"{name_prefix}-codedeploy-policy",
            role=self.codedeploy_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda",
        )

        # We can only create these policies if we have the resource ARNs
        if lambda_arn and source_bucket_arn and artifacts_bucket_arn:
            # IAM policies for CodeBuild
            self.codebuild_policy = aws.iam.RolePolicy(f"{name_prefix}-codebuild-policy",
                role=self.codebuild_role.id,
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Resource": [
                                source_bucket_arn,
                                f"{source_bucket_arn}/*",
                                artifacts_bucket_arn,
                                f"{artifacts_bucket_arn}/*",
                            ],
                            "Action": [
                                "s3:GetObject",
                                "s3:GetObjectVersion",
                                "s3:PutObject"
                            ]
                        },
                        {
                            "Effect": "Allow",
                            "Resource": [
                                "arn:aws:logs:*:*:*"
                            ],
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ]
                        },
                        {
                            "Effect": "Allow",
                            "Resource": [
                                lambda_arn,
                                f"{lambda_arn}:*"  # For version-specific operations
                            ],
                            "Action": [
                                "lambda:UpdateFunctionCode",
                                "lambda:GetFunction",
                                "lambda:PublishVersion",
                                "lambda:UpdateAlias",
                                "lambda:GetAlias",
                                "lambda:CreateAlias"
                            ]
                        }
                    ]
                }),
            )

            # IAM policies for CodePipeline
            self.codepipeline_policy = aws.iam.RolePolicy(f"{name_prefix}-codepipeline-policy",
                role=self.codepipeline_role.id,
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Resource": [
                                source_bucket_arn,
                                f"{source_bucket_arn}/*",
                                artifacts_bucket_arn,
                                f"{artifacts_bucket_arn}/*",
                            ],
                            "Action": [
                                "s3:GetObject",
                                "s3:GetObjectVersion",
                                "s3:GetBucketVersioning",
                                "s3:PutObject"
                            ]
                        },
                        {
                            "Effect": "Allow",
                            "Resource": "*",
                            "Action": [
                                "codebuild:BatchGetBuilds",
                                "codebuild:StartBuild"
                            ]
                        },
                        {
                            "Effect": "Allow",
                            "Resource": "*",
                            "Action": [
                                "codedeploy:CreateDeployment",
                                "codedeploy:GetDeployment",
                                "codedeploy:GetDeploymentConfig",
                                "codedeploy:GetApplication",
                                "codedeploy:GetApplicationRevision",
                                "codedeploy:RegisterApplicationRevision"
                            ]
                        },
                        {
                            "Effect": "Allow",
                            "Resource": [
                                lambda_arn,
                                f"{lambda_arn}:*"
                            ],
                            "Action": [
                                "lambda:InvokeFunction",
                                "lambda:ListVersionsByFunction",
                                "lambda:GetFunction"
                            ]
                        }
                    ]
                }),
            )

class LambdaModule:
    def __init__(self, name, role_arn, kms_key_arn, env_variables=None, runtime="python3.8", handler="main.lambda_handler"):
        self.name = name
        self.runtime = runtime
        self.handler = handler

        # Create CloudWatch log group for Lambda
        self.log_group = aws.cloudwatch.LogGroup(f"{name}-log-group",
            name=f"/aws/lambda/{name}",
            retention_in_days=30,
            tags=tags,
        )

        # Create Lambda function (initial placeholder)
        self.function = aws.lambda_.Function(f"{name}-function",
            name=name,
            role=role_arn,
            handler=handler,
            runtime=runtime,
            timeout=30,
            memory_size=128,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables=env_variables or {},
            ),
            kms_key_arn=kms_key_arn,
            # Initially we'll use a placeholder code
            code=pulumi.AssetArchive({
                ".": pulumi.StringAsset("""
def lambda_handler(event, context):
    print("Placeholder Lambda function")
    return {
        "statusCode": 200,
        "body": "Placeholder Lambda function"
    }
""")
            }),
            publish=True,  # Enable versioning
            tags=tags,
        )

        # Create a production alias for the Lambda function
        self.prod_alias = aws.lambda_.Alias(f"{name}-prod-alias",
            name="production",
            function_name=self.function.name,
            function_version=self.function.version,
            routing_config=aws.lambda_.AliasRoutingConfigArgs(
                additional_version_weights={
                    # Initially we don't route to any other version
                }
            ),
        )

        # Create CloudWatch alarm for Lambda errors
        self.error_alarm = aws.cloudwatch.MetricAlarm(f"{name}-error-alarm",
            alarm_name=f"{name}-errors",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=0,
            alarm_description="This metric monitors lambda function errors",
            dimensions={
                "FunctionName": self.function.name,
            },
            alarm_actions=[],  # Add SNS topic ARNs here for notifications
            tags=tags,
        )

        # Create CloudWatch dashboard for Lambda monitoring
        self.dashboard = aws.cloudwatch.Dashboard(f"{name}-dashboard",
            dashboard_name=f"{name}-monitoring",
            dashboard_body=pulumi.Output.all(name=self.function.name).apply(
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
                                    ["AWS/Lambda", "Invocations", "FunctionName", args["name"]],
                                    ["AWS/Lambda", "Errors", "FunctionName", args["name"]],
                                    ["AWS/Lambda", "Throttles", "FunctionName", args["name"]]
                                ],
                                "period": 300,
                                "stat": "Sum",
                                "region": aws.get_region().name,
                                "title": "Lambda Invocations, Errors, and Throttles"
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
                                    ["AWS/Lambda", "Duration", "FunctionName", args["name"], {"stat": "Average"}],
                                    ["AWS/Lambda", "Duration", "FunctionName", args["name"], {"stat": "Maximum"}],
                                    ["AWS/Lambda", "Duration", "FunctionName", args["name"], {"stat": "Minimum"}]
                                ],
                                "period": 300,
                                "stat": "Average",
                                "region": aws.get_region().name,
                                "title": "Lambda Duration"
                            }
                        }
                    ]
                })
            ),
        )

class PipelineModule:
    def __init__(self,
                 name_prefix,
                 source_bucket_name,
                 artifacts_bucket_name,
                 lambda_function_name,
                 codebuild_role_arn,
                 codepipeline_role_arn,
                 codedeploy_role_arn):

        self.name_prefix = name_prefix

        # Create CodeBuild project for building the Lambda package
        self.build_project = aws.codebuild.Project(f"{name_prefix}-build-project",
            name=f"{name_prefix}-build",
            service_role=codebuild_role_arn,
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
                buildspec="""version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.8
  pre_build:
    commands:
      - echo Installing dependencies...
      - pip install -r requirements.txt -t .
  build:
    commands:
      - echo Build started on `date`
      - echo Packaging the Lambda function...
      - zip -r function.zip .
  post_build:
    commands:
      - echo Build completed on `date`
      # Create appspec.yml for CodeDeploy
      - |
        cat > appspec.yml <<EOL
        version: 0.0
        Resources:
          - MyFunction:
              Type: AWS::Lambda::Function
              Properties:
                Name: ${lambda_function_name}
                Alias: production
                CurrentVersion: !Ref Version
                TargetVersion: !Ref TargetVersion
        Hooks:
          BeforeAllowTraffic: !Ref BeforeAllowTrafficHook
          AfterAllowTraffic: !Ref AfterAllowTrafficHook
        EOL
artifacts:
  files:
    - function.zip
    - appspec.yml
  base-directory: '.'
""",
            ),
            tags=tags,
        )

        # Create testing project
        self.test_project = aws.codebuild.Project(f"{name_prefix}-test-project",
            name=f"{name_prefix}-test",
            service_role=codebuild_role_arn,
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
                buildspec=f"""version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.8
  pre_build:
    commands:
      - echo Installing test dependencies...
      - pip install pytest
  build:
    commands:
      - echo Running tests on `date`
      - echo "Run your tests here"
      - echo "For demonstration, we'll just create a simple test that passes"
      - |
        cat > test_lambda.py <<EOL
        def test_simple():
            assert True
        EOL
      - python -m pytest
      - echo Tests passed!
  post_build:
    commands:
      - echo Tests completed on `date`
artifacts:
  files:
    - function.zip
    - appspec.yml
  base-directory: '.'
""",
            ),
            tags=tags,
        )

        # Create CodeDeploy application for Lambda
        self.codedeploy_app = aws.codedeploy.Application(f"{name_prefix}-deploy-app",
            name=f"{name_prefix}-app",
            compute_platform="Lambda",
            tags=tags,
        )

        # Create CodeDeploy deployment group
        self.deployment_group = aws.codedeploy.DeploymentGroup(f"{name_prefix}-deploy-group",
            app_name=self.codedeploy_app.name,
            deployment_group_name=f"{name_prefix}-deploy-group",
            service_role_arn=codedeploy_role_arn,
            deployment_config_name="CodeDeployDefault.LambdaCanary10Percent10Minutes",  # Canary deployment
            deployment_style=aws.codedeploy.DeploymentGroupDeploymentStyleArgs(
                deployment_option="WITH_TRAFFIC_CONTROL",
                deployment_type="BLUE_GREEN",
            ),
            auto_rollback_configuration=aws.codedeploy.DeploymentGroupAutoRollbackConfigurationArgs(
                enabled=True,
                events=["DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"],
            ),
            alarm_configuration=aws.codedeploy.DeploymentGroupAlarmConfigurationArgs(
                enabled=True,
                alarms=[aws.codedeploy.DeploymentGroupAlarmConfigurationAlarmArgs(
                    name=f"{name_prefix}-errors"
                )],
            ),
            tags=tags,
        )

        # Create CodePipeline
        self.pipeline = aws.codepipeline.Pipeline(f"{name_prefix}-pipeline",
            name=f"{name_prefix}-pipeline",
            role_arn=codepipeline_role_arn,
            artifact_store=aws.codepipeline.PipelineArtifactStoreArgs(
                location=artifacts_bucket_name,
                type="S3",
            ),
            stages=[
                # Source stage - get source from S3
                aws.codepipeline.PipelineStageArgs(
                    name="Source",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Source",
                            category="Source",
                            owner="AWS",
                            provider="S3",
                            version="1",
                            output_artifacts=["SourceCode"],
                            configuration={
                                "S3Bucket": source_bucket_name,
                                "S3ObjectKey": "source.zip",
                                "PollForSourceChanges": "true",  # Trigger pipeline on S3 changes
                            },
                        )
                    ],
                ),
                # Build stage - build and package Lambda code
                aws.codepipeline.PipelineStageArgs(
                    name="Build",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="BuildAction",
                            category="Build",
                            owner="AWS",
                            provider="CodeBuild",
                            input_artifacts=["SourceCode"],
                            output_artifacts=["BuildOutput"],
                            version="1",
                            configuration={
                                "ProjectName": self.build_project.name,
                            },
                        )
                    ],
                ),
                # Test stage - run tests on the Lambda function
                aws.codepipeline.PipelineStageArgs(
                    name="Test",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="TestAction",
                            category="Test",
                            owner="AWS",
                            provider="CodeBuild",
                            input_artifacts=["BuildOutput"],
                            output_artifacts=["TestOutput"],
                            version="1",
                            configuration={
                                "ProjectName": self.test_project.name,
                            },
                        )
                    ],
                ),
                # Deploy stage - update Lambda function code
                aws.codepipeline.PipelineStageArgs(
                    name="Deploy",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="DeployAction",
                            category="Deploy",
                            owner="AWS",
                            provider="CodeDeploy",
                            input_artifacts=["TestOutput"],
                            version="1",
                            configuration={
                                "ApplicationName": self.codedeploy_app.name,
                                "DeploymentGroupName": self.deployment_group.deployment_group_name,
                            },
                        )
                    ],
                ),
            ],
            tags=tags,
        )

        # CloudWatch log group for CodePipeline
        self.pipeline_log_group = aws.cloudwatch.LogGroup(f"{name_prefix}-pipeline-log-group",
            name=f"/aws/codepipeline/{self.pipeline.name}",
            retention_in_days=30,
            tags=tags,
        )

        # CloudWatch alarm for pipeline failures
        self.pipeline_failure_alarm = aws.cloudwatch.MetricAlarm(f"{name_prefix}-pipeline-failure-alarm",
            alarm_name=f"{name_prefix}-pipeline-failures",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="FailedPipelines",
            namespace="AWS/CodePipeline",
            period=300,
            statistic="Sum",
            threshold=0,
            alarm_description="This metric monitors pipeline failures",
            dimensions={
                "PipelineName": self.pipeline.name,
            },
            alarm_actions=[],  # Add SNS topic ARNs here for notifications
            tags=tags,
        )

# Main program

# Create security resources
security = SecurityModule(lambda_name)

# Create storage resources
storage = StorageModule(lambda_name)

# Create IAM roles without resource policies (we'll add those later)
iam = IAMModule(lambda_name, security.lambda_kms_key.arn)

# Create Lambda function
lambda_module = LambdaModule(
    lambda_name,
    iam.lambda_role.arn,
    security.lambda_kms_key.arn,
    env_variables
)

# Now that we have the Lambda ARN, we can add the resource-specific policies
resource_iam = IAMModule(
    f"{lambda_name}-resources",
    security.lambda_kms_key.arn,
    lambda_module.function.arn,
    storage.source_bucket.arn,
    storage.artifacts_bucket.arn
)

# Create pipeline
pipeline_module = PipelineModule(
    lambda_name,
    storage.source_bucket.bucket,
    storage.artifacts_bucket.bucket,
    lambda_module.function.name,
    resource_iam.codebuild_role.arn,
    resource_iam.codepipeline_role.arn,
    resource_iam.codedeploy_role.arn
)

# Export important outputs
pulumi.export("lambda_function_name", lambda_module.function.name)
pulumi.export("lambda_function_arn", lambda_module.function.arn)
pulumi.export("lambda_prod_alias", lambda_module.prod_alias.name)
pulumi.export("source_bucket_name", storage.source_bucket.bucket)
pulumi.export("artifacts_bucket_name", storage.artifacts_bucket.bucket)
pulumi.export("pipeline_name", pipeline_module.pipeline.name)
pulumi.export("kms_key_id", security.lambda_kms_key.id)
```

This revised version of the Pulumi program improves on the original in several ways:

1. **Modular Structure**: I've organized the code into classes representing different logical components (Security, Storage, IAM, Lambda, and Pipeline).

2. **Better Security**:
   - Enhanced bucket policies that enforce encryption and HTTPS
   - More precise IAM permissions
   - Better separation of concerns in the IAM module

3. **Proper CodeDeploy Integration**:
   - Uses AWS CodeDeploy explicitly for Lambda deployments
   - Configures canary deployments properly
   - Automatic rollback on deployment failures or alarms

4. **Improved Monitoring**:
   - Added a CloudWatch dashboard for Lambda monitoring
   - Better alarm configuration

5. **Better Resource Organization**:
   - Consistent naming conventions
   - Tags on all resources
   - Better management of dependencies between resources

Overall, this revised program should meet all the requirements while being more maintainable, secure, and following best practices.

It's worth noting a few design decisions:

1. We're using a placeholder Lambda function initially, since the actual code will come from the S3 bucket through the pipeline.

2. For CodeDeploy, we're using the "LambdaCanary10Percent10Minutes" deployment configuration, which routes 10% of traffic to the new version for 10 minutes before routing all traffic if no issues are detected.

3. We've set up automatic rollbacks based on both deployment failures and CloudWatch alarms.

4. All sensitive data is encrypted using KMS.

This solution provides a complete CI/CD pipeline for Lambda deployments that's triggered by changes to an S3 bucket, with proper security, monitoring, and rollback capabilities.

### Answer

---

# Complete AWS Lambda CI/CD Pipeline with Pulumi

I'll create a comprehensive CI/CD pipeline that automates Lambda deployments based on your requirements. This solution uses Pulumi with Python to define a secure and robust deployment workflow.

## Solution Architecture

The pipeline will work as follows:

1. Code updates are uploaded to an S3 bucket (source bucket)
2. This triggers AWS CodePipeline to start the deployment process
3. AWS CodeBuild builds and tests the Lambda code
4. AWS CodeDeploy performs a safe canary deployment with rollback capability
5. CloudWatch monitors the Lambda function and pipeline for any issues

Let's build this with a modular approach:

## Pulumi Program

```python
import pulumi
import pulumi_aws as aws
import json

# Configuration
config = pulumi.Config()
lambda_name = config.get("lambdaName") or "sample-lambda"
lambda_runtime = "python3.8"
lambda_handler = "main.lambda_handler"
env_variables = config.get_object("lambdaEnvVariables") or {"ENVIRONMENT": "production"}
stack = pulumi.get_stack()
project = pulumi.get_project()

# Common tags for all resources
tags = {
    "Environment": stack,
    "Project": project,
    "ManagedBy": "Pulumi"
}

class SecurityModule:
    """Manages security resources like KMS keys"""
    def __init__(self, name_prefix):
        self.name_prefix = name_prefix

        # Create KMS key for Lambda environment variable encryption
        self.lambda_kms_key = aws.kms.Key(f"{name_prefix}-kms-key",
            description="KMS key for encrypting Lambda environment variables",
            deletion_window_in_days=30,
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Allow administration of the key",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{aws.get_caller_identity().account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    }
                ]
            }),
            tags=tags,
        )

        self.lambda_kms_alias = aws.kms.Alias(f"{name_prefix}-kms-alias",
            name=pulumi.Output.concat("alias/", name_prefix, "-key"),
            target_key_id=self.lambda_kms_key.id,
        )

class StorageModule:
    """Manages S3 buckets for source code and artifacts"""
    def __init__(self, name_prefix):
        self.name_prefix = name_prefix

        # Create source code bucket with versioning enabled
        self.source_bucket = aws.s3.Bucket(f"{name_prefix}-source-bucket",
            acl="private",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True,
            ),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256",
                    ),
                ),
            ),
            lifecycle_rules=[aws.s3.BucketLifecycleRuleArgs(
                enabled=True,
                noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
                    days=30,
                ),
            )],
            tags=tags,
        )

        # Enforce encryption and HTTPS for source bucket
        self.source_bucket_policy = aws.s3.BucketPolicy(f"{name_prefix}-source-bucket-policy",
            bucket=self.source_bucket.id,
            policy=self.source_bucket.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "DenyUnencryptedObjectUploads",
                        "Effect": "Deny",
                        "Principal": "*",
                        "Action": "s3:PutObject",
                        "Resource": f"{arn}/*",
                        "Condition": {
                            "StringNotEquals": {
                                "s3:x-amz-server-side-encryption": "AES256"
                            }
                        }
                    },
                    {
                        "Sid": "DenyInsecureConnections",
                        "Effect": "Deny",
                        "Principal": "*",
                        "Action": "s3:*",
                        "Resource": f"{arn}/*",
                        "Condition": {
                            "Bool": {
                                "aws:SecureTransport": "false"
                            }
                        }
                    }
                ]
            })),
        )

        # Create artifacts bucket with versioning and encryption
        self.artifacts_bucket = aws.s3.Bucket(f"{name_prefix}-artifacts-bucket",
            acl="private",
            versioning=aws.s3.BucketVersioningArgs(
                enabled=True,
            ),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="AES256",
                    ),
                ),
            ),
            lifecycle_rules=[aws.s3.BucketLifecycleRuleArgs(
                enabled=True,
                noncurrent_version_expiration=aws.s3.BucketLifecycleRuleNoncurrentVersionExpirationArgs(
                    days=30,
                ),
            )],
            tags=tags,
        )

class IAMModule:
    """Manages IAM roles and policies for all components"""
    def __init__(self, name_prefix, kms_key_arn, lambda_arn=None, source_bucket_arn=None, artifacts_bucket_arn=None):
        self.name_prefix = name_prefix

        # Create Lambda execution role with minimal permissions
        self.lambda_role = aws.iam.Role(f"{name_prefix}-lambda-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com",
                    },
                }],
            }),
            tags=tags,
        )

        # Lambda policy for CloudWatch logs and KMS decryption
        self.lambda_policy = aws.iam.RolePolicy(f"{name_prefix}-lambda-policy",
            role=self.lambda_role.id,
            policy=json.dumps({
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
                            "kms:Decrypt"
                        ],
                        "Resource": kms_key_arn
                    }
                ]
            }),
        )

        # CodeBuild role
        self.codebuild_role = aws.iam.Role(f"{name_prefix}-codebuild-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "codebuild.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=tags,
        )

        # CodePipeline role
        self.codepipeline_role = aws.iam.Role(f"{name_prefix}-codepipeline-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "codepipeline.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=tags,
        )

        # CodeDeploy role
        self.codedeploy_role = aws.iam.Role(f"{name_prefix}-codedeploy-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "codedeploy.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=tags,
        )

        # Attach AWS managed policy for CodeDeploy
        self.codedeploy_policy_attachment = aws.iam.RolePolicyAttachment(f"{name_prefix}-codedeploy-policy",
            role=self.codedeploy_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSCodeDeployRoleForLambda",
        )

        # Add resource-specific policies if we have the necessary ARNs
        if lambda_arn and source_bucket_arn and artifacts_bucket_arn:
            # CodeBuild policy with least-privilege permissions
            self.codebuild_policy = aws.iam.RolePolicy(f"{name_prefix}-codebuild-policy",
                role=self.codebuild_role.id,
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Resource": [
                                source_bucket_arn,
                                f"{source_bucket_arn}/*",
                                artifacts_bucket_arn,
                                f"{artifacts_bucket_arn}/*",
                            ],
                            "Action": [
                                "s3:GetObject",
                                "s3:GetObjectVersion",
                                "s3:PutObject"
                            ]
                        },
                        {
                            "Effect": "Allow",
                            "Resource": [
                                "arn:aws:logs:*:*:*"
                            ],
                            "Action": [
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ]
                        },
                        {
                            "Effect": "Allow",
                            "Resource": [
                                lambda_arn,
                                f"{lambda_arn}:*"  # For version-specific operations
                            ],
                            "Action": [
                                "lambda:UpdateFunctionCode",
                                "lambda:GetFunction",
                                "lambda:PublishVersion",
                                "lambda:InvokeFunction"
                            ]
                        }
                    ]
                }),
            )

            # CodePipeline policy with least-privilege permissions
            self.codepipeline_policy = aws.iam.RolePolicy(f"{name_prefix}-codepipeline-policy",
                role=self.codepipeline_role.id,
                policy=json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Resource": [
                                source_bucket_arn,
                                f"{source_bucket_arn}/*",
                                artifacts_bucket_arn,
                                f"{artifacts_bucket_arn}/*",
                            ],
                            "Action": [
                                "s3:GetObject",
                                "s3:GetObjectVersion",
                                "s3:GetBucketVersioning",
                                "s3:PutObject"
                            ]
                        },
                        {
                            "Effect": "Allow",
                            "Resource": "*",
                            "Action": [
                                "codebuild:BatchGetBuilds",
                                "codebuild:StartBuild"
                            ]
                        },
                        {
                            "Effect": "Allow",
                            "Resource": "*",
                            "Action": [
                                "codedeploy:CreateDeployment",
                                "codedeploy:GetDeployment",
                                "codedeploy:GetDeploymentConfig",
                                "codedeploy:GetApplication",
                                "codedeploy:RegisterApplicationRevision"
                            ]
                        }
                    ]
                }),
            )

class LambdaModule:
    """Manages the Lambda function, alias, and monitoring"""
    def __init__(self, name, role_arn, kms_key_arn, env_variables=None, runtime="python3.8", handler="main.lambda_handler"):
        self.name = name

        # Create CloudWatch log group for Lambda with retention policy
        self.log_group = aws.cloudwatch.LogGroup(f"{name}-log-group",
            name=f"/aws/lambda/{name}",
            retention_in_days=30,
            tags=tags,
        )

        # Create Lambda function with placeholder code
        self.function = aws.lambda_.Function(f"{name}-function",
            name=name,
            role=role_arn,
            handler=handler,
            runtime=runtime,
            timeout=30,
            memory_size=128,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables=env_variables or {},
            ),
            kms_key_arn=kms_key_arn,
            # Initially use placeholder code
            code=pulumi.AssetArchive({
                ".": pulumi.StringAsset("""
def lambda_handler(event, context):
    print("Placeholder Lambda function")
    return {
        "statusCode": 200,
        "body": "Placeholder Lambda function"
    }
""")
            }),
            publish=True,  # Enable versioning for safe deployments
            tags=tags,
        )

        # Create a production alias for the Lambda function
        self.prod_alias = aws.lambda_.Alias(f"{name}-prod-alias",
            name="production",
            function_name=self.function.name,
            function_version=self.function.version,
            # Support for routing configuration when doing canary deployments
            routing_config=aws.lambda_.AliasRoutingConfigArgs(
                additional_version_weights={}
            ),
        )

        # CloudWatch alarm for Lambda errors
        self.error_alarm = aws.cloudwatch.MetricAlarm(f"{name}-error-alarm",
            alarm_name=f"{name}-errors",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=0,
            alarm_description="Monitors Lambda function errors",
            dimensions={
                "FunctionName": self.function.name,
            },
            tags=tags,
        )

        # Create comprehensive CloudWatch dashboard for Lambda monitoring
        self.dashboard = aws.cloudwatch.Dashboard(f"{name}-dashboard",
            dashboard_name=f"{name}-monitoring",
            dashboard_body=pulumi.Output.all(name=self.function.name).apply(
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
                                    ["AWS/Lambda", "Invocations", "FunctionName", args["name"]],
                                    ["AWS/Lambda", "Errors", "FunctionName", args["name"]],
                                    ["AWS/Lambda", "Throttles", "FunctionName", args["name"]]
                                ],
                                "period": 300,
                                "stat": "Sum",
                                "region": aws.get_region().name,
                                "title": "Lambda Invocations, Errors, and Throttles"
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
                                    ["AWS/Lambda", "Duration", "FunctionName", args["name"], {"stat": "Average"}],
                                    ["AWS/Lambda", "Duration", "FunctionName", args["name"], {"stat": "Maximum"}]
                                ],
                                "period": 300,
                                "region": aws.get_region().name,
                                "title": "Lambda Duration"
                            }
                        }
                    ]
                })
            ),
        )

class PipelineModule:
    """Manages the CI/CD pipeline components"""
    def __init__(self,
                 name_prefix,
                 source_bucket_name,
                 artifacts_bucket_name,
                 lambda_function_name,
                 codebuild_role_arn,
                 codepipeline_role_arn,
                 codedeploy_role_arn):

        # Create CodeBuild project for building the Lambda package
        self.build_project = aws.codebuild.Project(f"{name_prefix}-build-project",
            name=f"{name_prefix}-build",
            service_role=codebuild_role_arn,
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
                buildspec="""version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.8
  pre_build:
    commands:
      - echo Installing dependencies...
      - pip install -r requirements.txt -t .
  build:
    commands:
      - echo Build started on `date`
      - echo Packaging the Lambda function...
      - zip -r function.zip .
  post_build:
    commands:
      - echo Build completed on `date`
      - echo Creating appspec.yml for CodeDeploy
      - |
        cat > appspec.yml <<EOL
        version: 0.0
        Resources:
          - MyFunction:
              Type: AWS::Lambda::Function
              Properties:
                Name: ${lambda_function_name}
                Alias: production
                CurrentVersion: !Ref CurrentVersion
                TargetVersion: !Ref TargetVersion
EOL
artifacts:
  files:
    - function.zip
    - appspec.yml
  base-directory: '.'
""",
            ),
            tags=tags,
        )

        # Create testing project for validating the Lambda function
        self.test_project = aws.codebuild.Project(f"{name_prefix}-test-project",
            name=f"{name_prefix}-test",
            service_role=codebuild_role_arn,
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
                buildspec=f"""version: 0.2
phases:
  install:
    runtime-versions:
      python: 3.8
  pre_build:
    commands:
      - echo Installing test dependencies...
      - pip install pytest
  build:
    commands:
      - echo Running tests on `date`
      - if [ -f "test_requirements.txt" ]; then pip install -r test_requirements.txt; fi
      - if [ -d "tests" ]; then python -m pytest tests/; else echo "No tests to run"; fi
  post_build:
    commands:
      - echo Tests completed on `date`
artifacts:
  files:
    - function.zip
    - appspec.yml
  base-directory: '.'
""",
            ),
            tags=tags,
        )

        # Create CodeDeploy application for Lambda
        self.codedeploy_app = aws.codedeploy.Application(f"{name_prefix}-deploy-app",
            name=f"{name_prefix}-app",
            compute_platform="Lambda",
            tags=tags,
        )

        # Create CodeDeploy deployment group with rollback configuration
        self.deployment_group = aws.codedeploy.DeploymentGroup(f"{name_prefix}-deploy-group",
            app_name=self.codedeploy_app.name,
            deployment_group_name=f"{name_prefix}-deploy-group",
            service_role_arn=codedeploy_role_arn,
            deployment_config_name="CodeDeployDefault.LambdaCanary10Percent10Minutes",  # Canary deployment
            deployment_style=aws.codedeploy.DeploymentGroupDeploymentStyleArgs(
                deployment_option="WITH_TRAFFIC_CONTROL",
                deployment_type="BLUE_GREEN",
            ),
            auto_rollback_configuration=aws.codedeploy.DeploymentGroupAutoRollbackConfigurationArgs(
                enabled=True,
                events=["DEPLOYMENT_FAILURE", "DEPLOYMENT_STOP_ON_ALARM"],
            ),
            # Connect alarm for automatic rollbacks on error spikes
            alarm_configuration=aws.codedeploy.DeploymentGroupAlarmConfigurationArgs(
                enabled=True,
                alarms=[aws.codedeploy.DeploymentGroupAlarmConfigurationAlarmArgs(
                    name=f"{name_prefix}-errors"
                )],
            ),
            tags=tags,
        )

        # Create CodePipeline with four stages: Source, Build, Test, and Deploy
        self.pipeline = aws.codepipeline.Pipeline(f"{name_prefix}-pipeline",
            name=f"{name_prefix}-pipeline",
            role_arn=codepipeline_role_arn,
            artifact_store=aws.codepipeline.PipelineArtifactStoreArgs(
                location=artifacts_bucket_name,
                type="S3",
            ),
            stages=[
                # Source stage - get source from S3 bucket
                aws.codepipeline.PipelineStageArgs(
                    name="Source",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Source",
                            category="Source",
                            owner="AWS",
                            provider="S3",
                            version="1",
                            output_artifacts=["SourceCode"],
                            configuration={
                                "S3Bucket": source_bucket_name,
                                "S3ObjectKey": "source.zip",
                                "PollForSourceChanges": "true",  # Trigger pipeline on S3 changes
                            },
                        )
                    ],
                ),
                # Build stage - build and package Lambda code
                aws.codepipeline.PipelineStageArgs(
                    name="Build",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="BuildAction",
                            category="Build",
                            owner="AWS",
                            provider="CodeBuild",
                            input_artifacts=["SourceCode"],
                            output_artifacts=["BuildOutput"],
                            version="1",
                            configuration={
                                "ProjectName": self.build_project.name,
                            },
                        )
                    ],
                ),
                # Test stage - run tests on the Lambda code
                aws.codepipeline.PipelineStageArgs(
                    name="Test",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="TestAction",
                            category="Test",
                            owner="AWS",
                            provider="CodeBuild",
                            input_artifacts=["BuildOutput"],
                            output_artifacts=["TestOutput"],
                            version="1",
                            configuration={
                                "ProjectName": self.test_project.name,
                            },
                        )
                    ],
                ),
                # Deploy stage - safely deploy to Lambda using CodeDeploy
                aws.codepipeline.PipelineStageArgs(
                    name="Deploy",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="DeployAction",
                            category="Deploy",
                            owner="AWS",
                            provider="CodeDeploy",
                            input_artifacts=["TestOutput"],
                            version="1",
                            configuration={
                                "ApplicationName": self.codedeploy_app.name,
                                "DeploymentGroupName": self.deployment_group.deployment_group_name,
                            },
                        )
                    ],
                ),
            ],
            tags=tags,
        )

        # CloudWatch log group for pipeline logs
        self.pipeline_log_group = aws.cloudwatch.LogGroup(f"{name_prefix}-pipeline-log-group",
            name=f"/aws/codepipeline/{self.pipeline.name}",
            retention_in_days=30,
            tags=tags,
        )

        # CloudWatch alarm for pipeline failures
        self.pipeline_failure_alarm = aws.cloudwatch.MetricAlarm(f"{name_prefix}-pipeline-failure-alarm",
            alarm_name=f"{name_prefix}-pipeline-failures",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="FailedPipelines",
            namespace="AWS/CodePipeline",
            period=300,
            statistic="Sum",
            threshold=0,
            alarm_description="This metric monitors pipeline failures",
            dimensions={
                "PipelineName": self.pipeline.name,
            },
            tags=tags,
        )

# Main program execution
def main():
    # Create security resources
    security = SecurityModule(lambda_name)

    # Create storage resources
    storage = StorageModule(lambda_name)

    # Create IAM roles without resource-specific policies
    iam = IAMModule(lambda_name, security.lambda_kms_key.arn)

    # Create Lambda function
    lambda_module = LambdaModule(
        lambda_name,
        iam.lambda_role.arn,
        security.lambda_kms_key.arn,
        env_variables
    )

    # Create IAM roles with resource-specific policies
    resource_iam = IAMModule(
        f"{lambda_name}-resources",
        security.lambda_kms_key.arn,
        lambda_module.function.arn,
        storage.source_bucket.arn,
        storage.artifacts_bucket.arn
    )

    # Create CI/CD pipeline
    pipeline_module = PipelineModule(
        lambda_name,
        storage.source_bucket.bucket,
        storage.artifacts_bucket.bucket,
        lambda_module.function.name,
        resource_iam.codebuild_role.arn,
        resource_iam.codepipeline_role.arn,
        resource_iam.codedeploy_role.arn
    )

    # Export important outputs
    pulumi.export("lambda_function_name", lambda_module.function.name)
    pulumi.export("lambda_function_arn", lambda_module.function.arn)
    pulumi.export("lambda_prod_alias", lambda_module.prod_alias.name)
    pulumi.export("source_bucket_name", storage.source_bucket.bucket)
    pulumi.export("artifacts_bucket_name", storage.artifacts_bucket.bucket)
    pulumi.export("pipeline_name", pipeline_module.pipeline.name)
    pulumi.export("kms_key_id", security.lambda_kms_key.id)

main()
```

## Key Security Features

1. **Least Privilege IAM Policies**: All IAM roles are configured with minimal permissions needed for their specific tasks.

2. **Encrypted S3 Buckets**: Both source and artifacts buckets enforce encryption and secure transport.

3. **KMS-Encrypted Environment Variables**: Lambda environment variables are encrypted using a dedicated KMS key.

4. **Secure Artifact Handling**: Build artifacts are stored in a versioned S3 bucket with encryption.

## Deployment Strategy

1. **Canary Deployment**: The pipeline uses CodeDeploy to perform canary deployments, initially routing 10% of traffic to the new version for 10 minutes.

2. **Automated Rollback**: Configured to automatically roll back in case of:
   - Deployment failures
   - CloudWatch alarms indicating Lambda errors

3. **Version Control**: The Lambda function is published with versioning, and a "production" alias provides stable routing.

## Monitoring and Observability

1. **CloudWatch Log Groups**: Configured for both Lambda function and CodePipeline with 30-day retention.

2. **Lambda Error Alarms**: Triggers when the Lambda function reports errors.

3. **Pipeline Failure Alarms**: Monitors for failures in the CI/CD pipeline.

4. **Comprehensive Dashboard**: Displays key metrics for Lambda performance including invocations, errors, throttles, and duration.

## How to Use the Pipeline

1. **Initial Setup**:

   ```bash
   pulumi up
   ```

2. **Deploy New Code**:
   - Zip your Lambda code (including requirements.txt)
   - Upload to the source S3 bucket as `source.zip`

   ```bash
   aws s3 cp ./your-lambda-code.zip s3://$(pulumi stack output source_bucket_name)/source.zip
   ```

3. **Monitor Deployment**:
   ```bash
   aws codepipeline get-pipeline-state --name $(pulumi stack output pipeline_name)
   ```

This CI/CD pipeline provides a secure, automated deployment workflow for your Lambda functions with proper monitoring and automatic rollbacks for high availability.
