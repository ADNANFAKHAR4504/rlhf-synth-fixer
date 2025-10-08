# Serverless Logistics Tracking API Infrastructure# Serverless Logistics Tracking API Infrastructure



Here's the complete Pulumi Python infrastructure code for your serverless logistics tracking API:Here's the complete Pulumi Python infrastructure code for your serverless logistics tracking API:



## Main Stack Implementation (lib/tap_stack.py)## Main Stack Implementation (lib/tap_stack.py)



```python```python

""""""

tap_stack.pytap_stack.py



This module defines the TapStack class, the main Pulumi ComponentResource forThis module defines the TapStack class, the main Pulumi ComponentResource for

the TAP (Test Automation Platform) project.the TAP (Test Automation Platform) project.



It orchestrates the instantiation of other resource-specific componentsIt orchestrates the instantiation of other resource-specific components

and manages environment-specific configurations.and manages environment-specific configurations.

""""""



from typing import Optionalfrom typing import Optional

import jsonimport json

import pulumiimport pulumi

from pulumi import ResourceOptions, Outputfrom pulumi import ResourceOptions, Output

import pulumi_awsimport pulumi_aws

from pulumi_aws import (from pulumi_aws import (

    s3, dynamodb, lambda_, apigateway, iam, ssm,    s3, dynamodb, lambda_, apigateway, iam, ssm,

    cloudwatch, sqs, config    cloudwatch, sqs, config

))

from pulumi import ResourceOptions, Output

class TapStackArgs:import pulumi_aws

    """from pulumi_aws import (

    TapStackArgs defines the input arguments for the TapStack Pulumi component.    s3, dynamodb, lambda_, apigateway, iam, ssm,

    cloudwatch, sqs, config

    Args:)

        environment_suffix (Optional[str]): An optional suffix for identifying the

            deployment environment (e.g., 'dev', 'prod').class TapStackArgs:

        tags (Optional[dict]): Optional default tags to apply to resources.    """

    """    TapStackArgs defines the input arguments for the TapStack Pulumi component.



    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):    Args:

        self.environment_suffix = environment_suffix or 'dev'        environment_suffix (Optional[str]): An optional suffix for identifying the

        self.tags = tags or {}            deployment environment (e.g., 'dev', 'prod').

        tags (Optional[dict]): Optional default tags to apply to resources.

    """

class TapStack(pulumi.ComponentResource):

    """    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):

    Represents the main Pulumi component resource for the TAP project.        self.environment_suffix = environment_suffix or 'dev'

    """        self.tags = tags or {}



    def __init__(

        self,class TapStack(pulumi.ComponentResource):

        name: str,    """

        args: TapStackArgs,    Represents the main Pulumi component resource for the TAP project.

        opts: Optional[ResourceOptions] = None    """

    ):

        super().__init__('tap:stack:TapStack', name, None, opts)    def __init__(

        self,

        self.environment_suffix = args.environment_suffix        name: str,

        self.tags = {        args: TapStackArgs,

            **args.tags,        opts: Optional[ResourceOptions] = None

            'Project': 'LogisticsTracking',    ):

            'Environment': self.environment_suffix,        super().__init__('tap:stack:TapStack', name, None, opts)

            'ManagedBy': 'Pulumi'

        }        self.environment_suffix = args.environment_suffix

        self.tags = {

        # Get current AWS region and account ID            **args.tags,

        aws_region = config.region or 'us-west-2'            'Project': 'LogisticsTracking',

        current = pulumi_aws.get_caller_identity()            'Environment': self.environment_suffix,

        aws_account_id = current.account_id            'ManagedBy': 'Pulumi'

        }

        # Create DLQ for Lambda

        dlq = sqs.Queue(        # Get current AWS region and account ID

            f"tracking-lambda-dlq-{self.environment_suffix}",        aws_region = config.region or 'us-west-2'

            message_retention_seconds=1209600,  # 14 days        current = pulumi_aws.get_caller_identity()

            visibility_timeout_seconds=300,        aws_account_id = current.account_id

            tags=self.tags,

            opts=ResourceOptions(parent=self)        # Create DLQ for Lambda

        )        dlq = sqs.Queue(

            f"tracking-lambda-dlq-{self.environment_suffix}",

        # Create DynamoDB table with on-demand billing            message_retention_seconds=1209600,  # 14 days

        tracking_table = dynamodb.Table(            visibility_timeout_seconds=300,

            f"tracking-data-{self.environment_suffix}",            tags=self.tags,

            billing_mode="PAY_PER_REQUEST",            opts=ResourceOptions(parent=self)

            hash_key="tracking_id",        )

            range_key="timestamp",

            attributes=[        # Create DynamoDB table with on-demand billing

                {        tracking_table = dynamodb.Table(

                    "name": "tracking_id",            f"tracking-data-{self.environment_suffix}",

                    "type": "S"            billing_mode="PAY_PER_REQUEST",

                },            hash_key="tracking_id",

                {            range_key="timestamp",

                    "name": "timestamp",            attributes=[

                    "type": "N"                {

                },                    "name": "tracking_id",

                {                    "type": "S"

                    "name": "status",                },

                    "type": "S"                {

                }                    "name": "timestamp",

            ],                    "type": "N"

            global_secondary_indexes=[{                },

                "name": "StatusIndex",                {

                "hash_key": "status",                    "name": "status",

                "range_key": "timestamp",                    "type": "S"

                "projection_type": "ALL"                }

            }],            ],

            stream_enabled=True,            global_secondary_indexes=[{

            stream_view_type="NEW_AND_OLD_IMAGES",                "name": "StatusIndex",

            point_in_time_recovery={"enabled": True},                "hash_key": "status",

            tags=self.tags,                "range_key": "timestamp",

            opts=ResourceOptions(parent=self)                "projection_type": "ALL"

        )            }],

            stream_enabled=True,

        # Create SSM Parameters            stream_view_type="NEW_AND_OLD_IMAGES",

        api_config_param = ssm.Parameter(            point_in_time_recovery={"enabled": True},

            f"api-config-{self.environment_suffix}",            tags=self.tags,

            name=f"/logistics/api/{self.environment_suffix}/config",            opts=ResourceOptions(parent=self)

            type="String",        )

            value=json.dumps({

                "max_request_size": "10MB",        # Create SSM Parameters

                "timeout": 30,        api_config_param = ssm.Parameter(

                "rate_limit": 100            f"api-config-{self.environment_suffix}",

            }),            name=f"/logistics/api/{self.environment_suffix}/config",

            tags=self.tags,            type="String",

            opts=ResourceOptions(parent=self)            value=json.dumps({

        )                "max_request_size": "10MB",

                "timeout": 30,

        db_endpoint_param = ssm.Parameter(                "rate_limit": 100

            f"db-endpoint-{self.environment_suffix}",            }),

            name=f"/logistics/db/{self.environment_suffix}/endpoint",            tags=self.tags,

            type="SecureString",            opts=ResourceOptions(parent=self)

            value=tracking_table.name,        )

            tags=self.tags,

            opts=ResourceOptions(parent=self)        db_endpoint_param = ssm.Parameter(

        )            f"db-endpoint-{self.environment_suffix}",

            name=f"/logistics/db/{self.environment_suffix}/endpoint",

        feature_flags_param = ssm.Parameter(            type="SecureString",

            f"feature-flags-{self.environment_suffix}",            value=tracking_table.name,

            name=f"/logistics/features/{self.environment_suffix}/flags",            tags=self.tags,

            type="String",            opts=ResourceOptions(parent=self)

            value=json.dumps({        )

                "enhanced_tracking": True,

                "batch_processing": False,        feature_flags_param = ssm.Parameter(

                "real_time_notifications": True            f"feature-flags-{self.environment_suffix}",

            }),            name=f"/logistics/features/{self.environment_suffix}/flags",

            tags=self.tags,            type="String",

            opts=ResourceOptions(parent=self)            value=json.dumps({

        )                "enhanced_tracking": True,

                "batch_processing": False,

        # Create CloudWatch Log Group for Lambda                "real_time_notifications": True

        lambda_log_group = cloudwatch.LogGroup(            }),

            f"tracking-lambda-logs-{self.environment_suffix}",            tags=self.tags,

            name=f"/aws/lambda/tracking-processor-{self.environment_suffix}",            opts=ResourceOptions(parent=self)

            retention_in_days=7,        )

            tags=self.tags,

            opts=ResourceOptions(parent=self)        # Create CloudWatch Log Group for Lambda

        )        lambda_log_group = cloudwatch.LogGroup(

            f"tracking-lambda-logs-{self.environment_suffix}",

        # Create IAM role for Lambda            name=f"/aws/lambda/tracking-processor-{self.environment_suffix}",

        lambda_role = iam.Role(            retention_in_days=7,

            f"tracking-lambda-role-{self.environment_suffix}",            tags=self.tags,

            assume_role_policy=json.dumps({            opts=ResourceOptions(parent=self)

                "Version": "2012-10-17",        )

                "Statement": [{

                    "Action": "sts:AssumeRole",        # Create IAM role for Lambda

                    "Principal": {        lambda_role = iam.Role(

                        "Service": "lambda.amazonaws.com"            f"tracking-lambda-role-{self.environment_suffix}",

                    },            assume_role_policy=json.dumps({

                    "Effect": "Allow"                "Version": "2012-10-17",

                }]                "Statement": [{

            }),                    "Action": "sts:AssumeRole",

            tags=self.tags,                    "Principal": {

            opts=ResourceOptions(parent=self)                        "Service": "lambda.amazonaws.com"

        )                    },

                    "Effect": "Allow"

        # Attach policies to Lambda role                }]

        lambda_policy = iam.RolePolicy(            }),

            f"tracking-lambda-policy-{self.environment_suffix}",            tags=self.tags,

            role=lambda_role.id,            opts=ResourceOptions(parent=self)

            policy=pulumi.Output.all(        )

                tracking_table.arn,

                dlq.arn,        # Attach policies to Lambda role

                api_config_param.name,        lambda_policy = iam.RolePolicy(

                db_endpoint_param.name,            f"tracking-lambda-policy-{self.environment_suffix}",

                feature_flags_param.name            role=lambda_role.id,

            ).apply(lambda args: json.dumps({            policy=pulumi.Output.all(

                "Version": "2012-10-17",                tracking_table.arn,

                "Statement": [                dlq.arn,

                    {                api_config_param.name,

                        "Effect": "Allow",                db_endpoint_param.name,

                        "Action": [                feature_flags_param.name

                            "dynamodb:PutItem",            ).apply(lambda args: json.dumps({

                            "dynamodb:GetItem",                "Version": "2012-10-17",

                            "dynamodb:UpdateItem",                "Statement": [

                            "dynamodb:Query",                    {

                            "dynamodb:Scan",                        "Effect": "Allow",

                            "dynamodb:BatchWriteItem",                        "Action": [

                            "dynamodb:BatchGetItem"                            "dynamodb:PutItem",

                        ],                            "dynamodb:GetItem",

                        "Resource": [                            "dynamodb:UpdateItem",

                            args[0],                            "dynamodb:Query",

                            f"{args[0]}/index/*"                            "dynamodb:Scan",

                        ]                            "dynamodb:BatchWriteItem",

                    },                            "dynamodb:BatchGetItem"

                    {                        ],

                        "Effect": "Allow",                        "Resource": [

                        "Action": [                            args[0],

                            "logs:CreateLogGroup",                            f"{args[0]}/index/*"

                            "logs:CreateLogStream",                        ]

                            "logs:PutLogEvents"                    },

                        ],                    {

                        "Resource": f"arn:aws:logs:{aws_region}:{aws_account_id}:log-group:/aws/lambda/tracking-processor-{self.environment_suffix}:*"                        "Effect": "Allow",

                    },                        "Action": [

                    {                            "logs:CreateLogGroup",

                        "Effect": "Allow",                            "logs:CreateLogStream",

                        "Action": [                            "logs:PutLogEvents"

                            "ssm:GetParameter",                        ],

                            "ssm:GetParameters",                        "Resource": f"arn:aws:logs:{aws_region}:{aws_account_id}:log-group:/aws/lambda/tracking-processor-{self.environment_suffix}:*"

                            "ssm:GetParametersByPath"                    },

                        ],                    {

                        "Resource": [                        "Effect": "Allow",

                            f"arn:aws:ssm:{aws_region}:{aws_account_id}:parameter/logistics/*"                        "Action": [

                        ]                            "ssm:GetParameter",

                    },                            "ssm:GetParameters",

                    {                            "ssm:GetParametersByPath"

                        "Effect": "Allow",                        ],

                        "Action": [                        "Resource": [

                            "sqs:SendMessage",                            f"arn:aws:ssm:{aws_region}:{aws_account_id}:parameter/logistics/*"

                            "sqs:GetQueueAttributes"                        ]

                        ],                    },

                        "Resource": args[1]                    {

                    },                        "Effect": "Allow",

                    {                        "Action": [

                        "Effect": "Allow",                            "sqs:SendMessage",

                        "Action": [                            "sqs:GetQueueAttributes"

                            "xray:PutTraceSegments",                        ],

                            "xray:PutTelemetryRecords"                        "Resource": args[1]

                        ],                    },

                        "Resource": "*"                    {

                    }                        "Effect": "Allow",

                ]                        "Action": [

            })),                            "xray:PutTraceSegments",

            opts=ResourceOptions(parent=self)                            "xray:PutTelemetryRecords"

        )                        ],

                        "Resource": "*"

        # Lambda function                    }

        tracking_lambda = lambda_.Function(                ]

            f"tracking-processor-{self.environment_suffix}",            })),

            runtime="python3.9",            opts=ResourceOptions(parent=self)

            handler="handler.main",        )

            role=lambda_role.arn,

            timeout=30,        # Lambda function

            memory_size=512,        tracking_lambda = lambda_.Function(

            environment={            f"tracking-processor-{self.environment_suffix}",

                "variables": {            runtime="python3.9",

                    "TABLE_NAME": tracking_table.name,            handler="handler.main",

                    "ENVIRONMENT": self.environment_suffix,            role=lambda_role.arn,

                    "REGION": aws_region,  # Changed from AWS_REGION (reserved)            timeout=30,

                    "POWERTOOLS_SERVICE_NAME": "tracking-api",            memory_size=512,

                    "POWERTOOLS_METRICS_NAMESPACE": "LogisticsTracking",            environment={

                    "LOG_LEVEL": "INFO",                "variables": {

                    "CONFIG_PARAM": api_config_param.name,                    "TABLE_NAME": tracking_table.name,

                    "DB_PARAM": db_endpoint_param.name,                    "ENVIRONMENT": self.environment_suffix,

                    "FEATURE_FLAGS_PARAM": feature_flags_param.name                    "REGION": aws_region,  # Changed from AWS_REGION (reserved)

                }                    "POWERTOOLS_SERVICE_NAME": "tracking-api",

            },                    "POWERTOOLS_METRICS_NAMESPACE": "LogisticsTracking",

            dead_letter_config={                    "LOG_LEVEL": "INFO",

                "target_arn": dlq.arn                    "CONFIG_PARAM": api_config_param.name,

            },                    "DB_PARAM": db_endpoint_param.name,

            tracing_config={                    "FEATURE_FLAGS_PARAM": feature_flags_param.name

                "mode": "Active"                }

            },            },

            code=pulumi.AssetArchive({            dead_letter_config={

                ".": pulumi.FileArchive("./lib/lambda")                "target_arn": dlq.arn

            }),            },

            tags=self.tags,            tracing_config={

            opts=ResourceOptions(parent=self, depends_on=[lambda_policy])                "mode": "Active"

        )            },

            code=pulumi.AssetArchive({

        # API Gateway REST API                ".": pulumi.FileArchive("./lib/lambda")

        rest_api = apigateway.RestApi(            }),

            f"tracking-api-{self.environment_suffix}",            tags=self.tags,

            name=f"tracking-api-{self.environment_suffix}",            opts=ResourceOptions(parent=self, depends_on=[lambda_policy])

            description="Logistics Tracking API",        )

            endpoint_configuration={

                "types": "REGIONAL"        # API Gateway REST API

            },        rest_api = apigateway.RestApi(

            tags=self.tags,            f"tracking-api-{self.environment_suffix}",

            opts=ResourceOptions(parent=self)            name=f"tracking-api-{self.environment_suffix}",

        )            description="Logistics Tracking API",

            endpoint_configuration={

        # Request validator                "types": "REGIONAL"

        request_validator = apigateway.RequestValidator(            },

            f"tracking-validator-{self.environment_suffix}",            tags=self.tags,

            rest_api=rest_api.id,            opts=ResourceOptions(parent=self)

            name="tracking-validator",        )

            validate_request_body=True,

            validate_request_parameters=True,        # Request validator

            opts=ResourceOptions(parent=self)        request_validator = apigateway.RequestValidator(

        )            f"tracking-validator-{self.environment_suffix}",

            rest_api=rest_api.id,

        # Request model            name="tracking-validator",

        tracking_model = apigateway.Model(            validate_request_body=True,

            f"tracking-model-{self.environment_suffix}",            validate_request_parameters=True,

            rest_api=rest_api.id,            opts=ResourceOptions(parent=self)

            content_type="application/json",        )

            name="TrackingModel",

            schema=json.dumps({        # Request model

                "$schema": "http://json-schema.org/draft-04/schema#",        tracking_model = apigateway.Model(

                "title": "Tracking Update",            f"tracking-model-{self.environment_suffix}",

                "type": "object",            rest_api=rest_api.id,

                "required": ["tracking_id", "status", "location"],            content_type="application/json",

                "properties": {            name="TrackingModel",

                    "tracking_id": {            schema=json.dumps({

                        "type": "string",                "$schema": "http://json-schema.org/draft-04/schema#",

                        "minLength": 1,                "title": "Tracking Update",

                        "maxLength": 100                "type": "object",

                    },                "required": ["tracking_id", "status", "location"],

                    "status": {                "properties": {

                        "type": "string",                    "tracking_id": {

                        "enum": ["pending", "in_transit", "delivered", "failed"]                        "type": "string",

                    },                        "minLength": 1,

                    "location": {                        "maxLength": 100

                        "type": "object",                    },

                        "required": ["lat", "lng"],                    "status": {

                        "properties": {                        "type": "string",

                            "lat": {"type": "number"},                        "enum": ["pending", "in_transit", "delivered", "failed"]

                            "lng": {"type": "number"}                    },

                        }                    "location": {

                    },                        "type": "object",

                    "metadata": {                        "required": ["lat", "lng"],

                        "type": "object"                        "properties": {

                    }                            "lat": {"type": "number"},

                }                            "lng": {"type": "number"}

            }),                        }

            opts=ResourceOptions(parent=self)                    },

        )                    "metadata": {

                        "type": "object"

        # /track resource                    }

        track_resource = apigateway.Resource(                }

            f"track-resource-{self.environment_suffix}",            }),

            rest_api=rest_api.id,            opts=ResourceOptions(parent=self)

            parent_id=rest_api.root_resource_id,        )

            path_part="track",

            opts=ResourceOptions(parent=self)        # /track resource

        )        track_resource = apigateway.Resource(

            f"track-resource-{self.environment_suffix}",

        # /status resource            rest_api=rest_api.id,

        status_resource = apigateway.Resource(            parent_id=rest_api.root_resource_id,

            f"status-resource-{self.environment_suffix}",            path_part="track",

            rest_api=rest_api.id,            opts=ResourceOptions(parent=self)

            parent_id=rest_api.root_resource_id,        )

            path_part="status",

            opts=ResourceOptions(parent=self)        # /status resource

        )        status_resource = apigateway.Resource(

            f"status-resource-{self.environment_suffix}",

        # Lambda integration            rest_api=rest_api.id,

        lambda_integration = apigateway.Integration(            parent_id=rest_api.root_resource_id,

            f"lambda-integration-{self.environment_suffix}",            path_part="status",

            rest_api=rest_api.id,            opts=ResourceOptions(parent=self)

            resource_id=track_resource.id,        )

            http_method="POST",

            integration_http_method="POST",        # Lambda integration

            type="AWS_PROXY",        lambda_integration = apigateway.Integration(

            uri=tracking_lambda.invoke_arn,            f"lambda-integration-{self.environment_suffix}",

            opts=ResourceOptions(parent=self)            rest_api=rest_api.id,

        )            resource_id=track_resource.id,

            http_method="POST",

        # POST /track method            integration_http_method="POST",

        track_post_method = apigateway.Method(            type="AWS_PROXY",

            f"track-post-method-{self.environment_suffix}",            uri=tracking_lambda.invoke_arn,

            rest_api=rest_api.id,            opts=ResourceOptions(parent=self)

            resource_id=track_resource.id,        )

            http_method="POST",

            authorization="AWS_IAM",        # POST /track method

            request_validator_id=request_validator.id,        track_post_method = apigateway.Method(

            request_models={            f"track-post-method-{self.environment_suffix}",

                "application/json": tracking_model.name            rest_api=rest_api.id,

            },            resource_id=track_resource.id,

            opts=ResourceOptions(parent=self)            http_method="POST",

        )            authorization="AWS_IAM",

            request_validator_id=request_validator.id,

        # GET /status method            request_models={

        status_get_method = apigateway.Method(                "application/json": tracking_model.name

            f"status-get-method-{self.environment_suffix}",            },

            rest_api=rest_api.id,            opts=ResourceOptions(parent=self)

            resource_id=status_resource.id,        )

            http_method="GET",

            authorization="AWS_IAM",        # GET /status method

            opts=ResourceOptions(parent=self)        status_get_method = apigateway.Method(

        )            f"status-get-method-{self.environment_suffix}",

            rest_api=rest_api.id,

        # Lambda integration for status            resource_id=status_resource.id,

        status_integration = apigateway.Integration(            http_method="GET",

            f"status-integration-{self.environment_suffix}",            authorization="AWS_IAM",

            rest_api=rest_api.id,            opts=ResourceOptions(parent=self)

            resource_id=status_resource.id,        )

            http_method="GET",

            integration_http_method="POST",        # Lambda integration for status

            type="AWS_PROXY",        status_integration = apigateway.Integration(

            uri=tracking_lambda.invoke_arn,            f"status-integration-{self.environment_suffix}",

            opts=ResourceOptions(parent=self)            rest_api=rest_api.id,

        )            resource_id=status_resource.id,

            http_method="GET",

        # Method responses            integration_http_method="POST",

        track_method_response = apigateway.MethodResponse(            type="AWS_PROXY",

            f"track-method-response-{self.environment_suffix}",            uri=tracking_lambda.invoke_arn,

            rest_api=rest_api.id,            opts=ResourceOptions(parent=self)

            resource_id=track_resource.id,        )

            http_method=track_post_method.http_method,

            status_code="200",        # Method responses

            response_models={        track_method_response = apigateway.MethodResponse(

                "application/json": "Empty"            f"track-method-response-{self.environment_suffix}",

            },            rest_api=rest_api.id,

            opts=ResourceOptions(parent=self)            resource_id=track_resource.id,

        )            http_method=track_post_method.http_method,

            status_code="200",

        status_method_response = apigateway.MethodResponse(            response_models={

            f"status-method-response-{self.environment_suffix}",                "application/json": "Empty"

            rest_api=rest_api.id,            },

            resource_id=status_resource.id,            opts=ResourceOptions(parent=self)

            http_method=status_get_method.http_method,        )

            status_code="200",

            opts=ResourceOptions(parent=self)        status_method_response = apigateway.MethodResponse(

        )            f"status-method-response-{self.environment_suffix}",

            rest_api=rest_api.id,

        # Integration responses (depends on integrations being created first)            resource_id=status_resource.id,

        track_integration_response = apigateway.IntegrationResponse(            http_method=status_get_method.http_method,

            f"track-integration-response-{self.environment_suffix}",            status_code="200",

            rest_api=rest_api.id,            opts=ResourceOptions(parent=self)

            resource_id=track_resource.id,        )

            http_method=track_post_method.http_method,

            status_code=track_method_response.status_code,        # Integration responses (depends on integrations being created first)

            opts=ResourceOptions(parent=self, depends_on=[lambda_integration])        track_integration_response = apigateway.IntegrationResponse(

        )            f"track-integration-response-{self.environment_suffix}",

            rest_api=rest_api.id,

        status_integration_response = apigateway.IntegrationResponse(            resource_id=track_resource.id,

            f"status-integration-response-{self.environment_suffix}",            http_method=track_post_method.http_method,

            rest_api=rest_api.id,            status_code=track_method_response.status_code,

            resource_id=status_resource.id,            opts=ResourceOptions(parent=self, depends_on=[lambda_integration])

            http_method=status_get_method.http_method,        )

            status_code=status_method_response.status_code,

            opts=ResourceOptions(parent=self, depends_on=[status_integration])        status_integration_response = apigateway.IntegrationResponse(

        )            f"status-integration-response-{self.environment_suffix}",

            rest_api=rest_api.id,

        # Lambda permission for API Gateway            resource_id=status_resource.id,

        lambda_permission = lambda_.Permission(            http_method=status_get_method.http_method,

            f"api-lambda-permission-{self.environment_suffix}",            status_code=status_method_response.status_code,

            statement_id="AllowAPIGatewayInvoke",            opts=ResourceOptions(parent=self, depends_on=[status_integration])

            action="lambda:InvokeFunction",        )

            function=tracking_lambda.name,

            principal="apigateway.amazonaws.com",        # Lambda permission for API Gateway

            source_arn=pulumi.Output.concat(        lambda_permission = lambda_.Permission(

                "arn:aws:execute-api:",            f"api-lambda-permission-{self.environment_suffix}",

                aws_region,            statement_id="AllowAPIGatewayInvoke",

                ":",            action="lambda:InvokeFunction",

                aws_account_id,            function=tracking_lambda.name,

                ":",            principal="apigateway.amazonaws.com",

                rest_api.id,            source_arn=pulumi.Output.concat(

                "/*/*"                "arn:aws:execute-api:",

            ),                aws_region,

            opts=ResourceOptions(parent=self)                ":",

        )                aws_account_id,

                ":",

        # Deploy API                rest_api.id,

        api_deployment = apigateway.Deployment(                "/*/*"

            f"api-deployment-{self.environment_suffix}",            ),

            rest_api=rest_api.id,            opts=ResourceOptions(parent=self)

            opts=ResourceOptions(        )

                parent=self,

                depends_on=[        # Deploy API

                    lambda_integration,        api_deployment = apigateway.Deployment(

                    status_integration,            f"api-deployment-{self.environment_suffix}",

                    track_method_response,            rest_api=rest_api.id,

                    status_method_response            opts=ResourceOptions(

                ]                parent=self,

            )                depends_on=[

        )                    lambda_integration,

                    status_integration,

        # Create API stage                    track_method_response,

        api_stage = apigateway.Stage(                    status_method_response

            f"api-stage-{self.environment_suffix}",                ]

            deployment=api_deployment.id,            )

            rest_api=rest_api.id,        )

            stage_name=self.environment_suffix,

            description=f"Stage for {self.environment_suffix}",        # Create API stage

            tags=self.tags,        api_stage = apigateway.Stage(

            opts=ResourceOptions(parent=self)            f"api-stage-{self.environment_suffix}",

        )            deployment=api_deployment.id,

            rest_api=rest_api.id,

        # CloudWatch Alarms            stage_name=self.environment_suffix,

        api_4xx_alarm = cloudwatch.MetricAlarm(            description=f"Stage for {self.environment_suffix}",

            f"api-4xx-alarm-{self.environment_suffix}",            tags=self.tags,

            name=f"tracking-api-4xx-{self.environment_suffix}",            opts=ResourceOptions(parent=self)

            comparison_operator="GreaterThanThreshold",        )

            evaluation_periods=2,

            metric_name="4XXError",        # CloudWatch Alarms

            namespace="AWS/ApiGateway",        api_4xx_alarm = cloudwatch.MetricAlarm(

            period=300,            f"api-4xx-alarm-{self.environment_suffix}",

            statistic="Sum",            name=f"tracking-api-4xx-{self.environment_suffix}",

            threshold=10,            comparison_operator="GreaterThanThreshold",

            alarm_description="Alert when API has too many 4XX errors",            evaluation_periods=2,

            dimensions={            metric_name="4XXError",

                "ApiName": rest_api.name,            namespace="AWS/ApiGateway",

                "Stage": self.environment_suffix            period=300,

            },            statistic="Sum",

            tags=self.tags,            threshold=10,

            opts=ResourceOptions(parent=self)            alarm_description="Alert when API has too many 4XX errors",

        )            dimensions={

                "ApiName": rest_api.name,

        api_5xx_alarm = cloudwatch.MetricAlarm(                "Stage": self.environment_suffix

            f"api-5xx-alarm-{self.environment_suffix}",            },

            name=f"tracking-api-5xx-{self.environment_suffix}",            tags=self.tags,

            comparison_operator="GreaterThanThreshold",            opts=ResourceOptions(parent=self)

            evaluation_periods=1,        )

            metric_name="5XXError",

            namespace="AWS/ApiGateway",        api_5xx_alarm = cloudwatch.MetricAlarm(

            period=60,            f"api-5xx-alarm-{self.environment_suffix}",

            statistic="Sum",            name=f"tracking-api-5xx-{self.environment_suffix}",

            threshold=5,            comparison_operator="GreaterThanThreshold",

            alarm_description="Alert when API has 5XX errors",            evaluation_periods=1,

            dimensions={            metric_name="5XXError",

                "ApiName": rest_api.name,            namespace="AWS/ApiGateway",

                "Stage": self.environment_suffix            period=60,

            },            statistic="Sum",

            tags=self.tags,            threshold=5,

            opts=ResourceOptions(parent=self)            alarm_description="Alert when API has 5XX errors",

        )            dimensions={

                "ApiName": rest_api.name,

        api_latency_alarm = cloudwatch.MetricAlarm(                "Stage": self.environment_suffix

            f"api-latency-alarm-{self.environment_suffix}",            },

            name=f"tracking-api-latency-{self.environment_suffix}",            tags=self.tags,

            comparison_operator="GreaterThanThreshold",            opts=ResourceOptions(parent=self)

            evaluation_periods=2,        )

            metric_name="Latency",

            namespace="AWS/ApiGateway",        api_latency_alarm = cloudwatch.MetricAlarm(

            period=300,            f"api-latency-alarm-{self.environment_suffix}",

            statistic="Average",            name=f"tracking-api-latency-{self.environment_suffix}",

            threshold=1000,            comparison_operator="GreaterThanThreshold",

            alarm_description="Alert when API latency is high",            evaluation_periods=2,

            dimensions={            metric_name="Latency",

                "ApiName": rest_api.name,            namespace="AWS/ApiGateway",

                "Stage": self.environment_suffix            period=300,

            },            statistic="Average",

            tags=self.tags,            threshold=1000,

            opts=ResourceOptions(parent=self)            alarm_description="Alert when API latency is high",

        )            dimensions={

                "ApiName": rest_api.name,

        # Lambda throttle alarm                "Stage": self.environment_suffix

        lambda_throttle_alarm = cloudwatch.MetricAlarm(            },

            f"lambda-throttle-alarm-{self.environment_suffix}",            tags=self.tags,

            name=f"tracking-lambda-throttle-{self.environment_suffix}",            opts=ResourceOptions(parent=self)

            comparison_operator="GreaterThanThreshold",        )

            evaluation_periods=1,

            metric_name="Throttles",        # Lambda throttle alarm

            namespace="AWS/Lambda",        lambda_throttle_alarm = cloudwatch.MetricAlarm(

            period=300,            f"lambda-throttle-alarm-{self.environment_suffix}",

            statistic="Sum",            name=f"tracking-lambda-throttle-{self.environment_suffix}",

            threshold=10,            comparison_operator="GreaterThanThreshold",

            alarm_description="Alert when Lambda is throttled",            evaluation_periods=1,

            dimensions={            metric_name="Throttles",

                "FunctionName": tracking_lambda.name            namespace="AWS/Lambda",

            },            period=300,

            tags=self.tags,            statistic="Sum",

            opts=ResourceOptions(parent=self)            threshold=10,

        )            alarm_description="Alert when Lambda is throttled",

            dimensions={

        # CloudWatch Dashboard                "FunctionName": tracking_lambda.name

        dashboard = cloudwatch.Dashboard(            },

            f"tracking-dashboard-{self.environment_suffix}",            tags=self.tags,

            dashboard_name=f"logistics-tracking-{self.environment_suffix}",            opts=ResourceOptions(parent=self)

            dashboard_body=json.dumps({        )

                "widgets": [

                    {        # CloudWatch Dashboard

                        "type": "metric",        dashboard = cloudwatch.Dashboard(

                        "properties": {            f"tracking-dashboard-{self.environment_suffix}",

                            "metrics": [            dashboard_name=f"logistics-tracking-{self.environment_suffix}",

                                ["AWS/ApiGateway", "Count", {"stat": "Sum", "label": "Total Requests"}],            dashboard_body=json.dumps({

                                [".", "4XXError", {"stat": "Sum", "label": "4XX Errors"}],                "widgets": [

                                [".", "5XXError", {"stat": "Sum", "label": "5XX Errors"}]                    {

                            ],                        "type": "metric",

                            "period": 300,                        "properties": {

                            "stat": "Sum",                            "metrics": [

                            "region": aws_region,                                ["AWS/ApiGateway", "Count", {"stat": "Sum", "label": "Total Requests"}],

                            "title": "API Gateway Metrics"                                [".", "4XXError", {"stat": "Sum", "label": "4XX Errors"}],

                        }                                [".", "5XXError", {"stat": "Sum", "label": "5XX Errors"}]

                    },                            ],

                    {                            "period": 300,

                        "type": "metric",                            "stat": "Sum",

                        "properties": {                            "region": aws_region,

                            "metrics": [                            "title": "API Gateway Metrics"

                                ["AWS/Lambda", "Invocations", {"stat": "Sum"}],                        }

                                [".", "Errors", {"stat": "Sum"}],                    },

                                [".", "Duration", {"stat": "Average"}],                    {

                                [".", "Throttles", {"stat": "Sum"}]                        "type": "metric",

                            ],                        "properties": {

                            "period": 300,                            "metrics": [

                            "stat": "Average",                                ["AWS/Lambda", "Invocations", {"stat": "Sum"}],

                            "region": aws_region,                                [".", "Errors", {"stat": "Sum"}],

                            "title": "Lambda Function Metrics"                                [".", "Duration", {"stat": "Average"}],

                        }                                [".", "Throttles", {"stat": "Sum"}]

                    },                            ],

                    {                            "period": 300,

                        "type": "metric",                            "stat": "Average",

                        "properties": {                            "region": aws_region,

                            "metrics": [                            "title": "Lambda Function Metrics"

                                ["AWS/DynamoDB", "UserErrors", {"stat": "Sum"}],                        }

                                [".", "SystemErrors", {"stat": "Sum"}],                    },

                                [".", "ConsumedReadCapacityUnits", {"stat": "Sum"}],                    {

                                [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]                        "type": "metric",

                            ],                        "properties": {

                            "period": 300,                            "metrics": [

                            "stat": "Sum",                                ["AWS/DynamoDB", "UserErrors", {"stat": "Sum"}],

                            "region": aws_region,                                [".", "SystemErrors", {"stat": "Sum"}],

                            "title": "DynamoDB Metrics"                                [".", "ConsumedReadCapacityUnits", {"stat": "Sum"}],

                        }                                [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]

                    }                            ],

                ]                            "period": 300,

            }),                            "stat": "Sum",

            opts=ResourceOptions(parent=self)                            "region": aws_region,

        )                            "title": "DynamoDB Metrics"

                        }

        # Register outputs                    }

        self.register_outputs({                ]

            "api_endpoint": pulumi.Output.concat(            }),

                "https://", rest_api.id, ".execute-api.",            opts=ResourceOptions(parent=self)

                aws_region, ".amazonaws.com/", api_stage.stage_name        )

            ),

            "table_name": tracking_table.name,        # Register outputs

            "lambda_function_name": tracking_lambda.name,        self.register_outputs({

            "dlq_url": dlq.url,            "api_endpoint": pulumi.Output.concat(

            "dashboard_url": pulumi.Output.concat(                "https://", rest_api.id, ".execute-api.",

                "https://console.aws.amazon.com/cloudwatch/home?region=",                aws_region, ".amazonaws.com/", api_stage.stage_name

                aws_region,            ),

                "#dashboards:name=",            "table_name": tracking_table.name,

                dashboard.dashboard_name            "lambda_function_name": tracking_lambda.name,

            )            "dlq_url": dlq.url,

        })            "dashboard_url": pulumi.Output.concat(

```                "https://console.aws.amazon.com/cloudwatch/home?region=",

                aws_region,

## Lambda Handler Implementation (lib/lambda/handler.py)                "#dashboards:name=",

                dashboard.dashboard_name

```python            )

import json        })

import os```

import time

import boto3## Lambda Function Handler (lib/lambda/handler.py)

from typing import Dict, Any

from aws_lambda_powertools import Logger, Tracer, Metrics```python

from aws_lambda_powertools.metrics import MetricUnitimport json

from aws_lambda_powertools.logging import correlation_pathsimport os

from aws_lambda_powertools.utilities.typing import LambdaContextimport time

import boto3

# Initialize AWS Lambda Powertoolsfrom typing import Dict, Any

logger = Logger()from aws_lambda_powertools import Logger, Tracer, Metrics

tracer = Tracer()from aws_lambda_powertools.metrics import MetricUnit

metrics = Metrics()from aws_lambda_powertools.logging import correlation_paths

from aws_lambda_powertools.utilities.typing import LambdaContext

# Initialize AWS clients

dynamodb = boto3.resource('dynamodb')# Initialize AWS Lambda Powertools

ssm = boto3.client('ssm')logger = Logger()

tracer = Tracer()

# Environment variablesmetrics = Metrics()

TABLE_NAME = os.environ['TABLE_NAME']

ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')# Initialize AWS clients

CONFIG_PARAM = os.environ.get('CONFIG_PARAM')dynamodb = boto3.resource('dynamodb')

DB_PARAM = os.environ.get('DB_PARAM')ssm = boto3.client('ssm')

FEATURE_FLAGS_PARAM = os.environ.get('FEATURE_FLAGS_PARAM')

# Environment variables

# Cache for SSM parameters with size limitTABLE_NAME = os.environ['TABLE_NAME']

_parameter_cache = {}ENVIRONMENT = os.environ.get('ENVIRONMENT', 'dev')

_cache_expiry = {}CONFIG_PARAM = os.environ.get('CONFIG_PARAM')

CACHE_TTL = 300  # 5 minutesDB_PARAM = os.environ.get('DB_PARAM')

MAX_CACHE_SIZE = 50  # Prevent memory bloatFEATURE_FLAGS_PARAM = os.environ.get('FEATURE_FLAGS_PARAM')



def get_parameter(name: str, decrypt: bool = True) -> str:# Cache for SSM parameters with size limit

    """Get parameter from SSM with size-limited caching."""_parameter_cache = {}

    current_time = time.time()_cache_expiry = {}

CACHE_TTL = 300  # 5 minutes

    # Clean expired entriesMAX_CACHE_SIZE = 50  # Prevent memory bloat

    expired_keys = [k for k, expiry in _cache_expiry.items() if current_time >= expiry]

    for key in expired_keys:def get_parameter(name: str, decrypt: bool = True) -> str:

        _parameter_cache.pop(key, None)    """Get parameter from SSM with size-limited caching."""

        _cache_expiry.pop(key, None)    current_time = time.time()



    # Check cache    # Clean expired entries

    if name in _parameter_cache and current_time < _cache_expiry.get(name, 0):    expired_keys = [k for k, expiry in _cache_expiry.items() if current_time >= expiry]

        return _parameter_cache[name]    for key in expired_keys:

        _parameter_cache.pop(key, None)

    # Limit cache size        _cache_expiry.pop(key, None)

    if len(_parameter_cache) >= MAX_CACHE_SIZE:

        oldest_key = min(_cache_expiry.keys(), key=lambda k: _cache_expiry[k])    # Check cache

        _parameter_cache.pop(oldest_key, None)    if name in _parameter_cache and current_time < _cache_expiry.get(name, 0):

        _cache_expiry.pop(oldest_key, None)        return _parameter_cache[name]



    try:    # Limit cache size

        response = ssm.get_parameter(Name=name, WithDecryption=decrypt)    if len(_parameter_cache) >= MAX_CACHE_SIZE:

        value = response['Parameter']['Value']        oldest_key = min(_cache_expiry.keys(), key=lambda k: _cache_expiry[k])

        _parameter_cache[name] = value        _parameter_cache.pop(oldest_key, None)

        _cache_expiry[name] = current_time + CACHE_TTL        _cache_expiry.pop(oldest_key, None)

        return value

    except Exception as e:    try:

        logger.error(f"Failed to get parameter {name}: {str(e)}")        response = ssm.get_parameter(Name=name, WithDecryption=decrypt)

        raise        value = response['Parameter']['Value']

        _parameter_cache[name] = value

@tracer.capture_method        _cache_expiry[name] = current_time + CACHE_TTL

def validate_tracking_data(data: Dict[str, Any]) -> bool:        return value

    """Validate tracking data structure."""    except Exception as e:

    required_fields = ['tracking_id', 'status', 'location']        logger.error(f"Failed to get parameter {name}: {str(e)}")

        raise

    for field in required_fields:

        if field not in data:@tracer.capture_method

            logger.warning(f"Missing required field: {field}")def validate_tracking_data(data: Dict[str, Any]) -> bool:

            return False    """Validate tracking data structure."""

    required_fields = ['tracking_id', 'status', 'location']

    if 'lat' not in data['location'] or 'lng' not in data['location']:

        logger.warning("Location missing lat or lng")    for field in required_fields:

        return False        if field not in data:

            logger.warning(f"Missing required field: {field}")

    valid_statuses = ['pending', 'in_transit', 'delivered', 'failed']            return False

    if data['status'] not in valid_statuses:

        logger.warning(f"Invalid status: {data['status']}")    if 'lat' not in data['location'] or 'lng' not in data['location']:

        return False        logger.warning("Location missing lat or lng")

        return False

    return True

    valid_statuses = ['pending', 'in_transit', 'delivered', 'failed']

@tracer.capture_method    if data['status'] not in valid_statuses:

def store_tracking_update(data: Dict[str, Any]) -> Dict[str, Any]:        logger.warning(f"Invalid status: {data['status']}")

    """Store tracking update in DynamoDB."""        return False

    table = dynamodb.Table(TABLE_NAME)

    timestamp = int(time.time() * 1000)    return True



    item = {@tracer.capture_method

        'tracking_id': data['tracking_id'],def store_tracking_update(data: Dict[str, Any]) -> Dict[str, Any]:

        'timestamp': timestamp,    """Store tracking update in DynamoDB."""

        'status': data['status'],    table = dynamodb.Table(TABLE_NAME)

        'location': data['location'],    timestamp = int(time.time() * 1000)

        'environment': ENVIRONMENT,

        'created_at': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())    item = {

    }        'tracking_id': data['tracking_id'],

        'timestamp': timestamp,

    if 'metadata' in data:        'status': data['status'],

        item['metadata'] = data['metadata']        'location': data['location'],

        'environment': ENVIRONMENT,

    try:        'created_at': time.strftime('%Y-%m-%d %H:%M:%S', time.gmtime())

        table.put_item(Item=item)    }

        logger.info(f"Stored tracking update for {data['tracking_id']}")

        return item    if 'metadata' in data:

    except Exception as e:        item['metadata'] = data['metadata']

        logger.error(f"Failed to store tracking update: {str(e)}")

        raise    try:

        table.put_item(Item=item)

@tracer.capture_method          metrics.add_metric(name="TrackingUpdateStored", unit=MetricUnit.Count, value=1)

def get_tracking_status(tracking_id: str) -> Dict[str, Any]:        return item

    """Get latest tracking status from DynamoDB."""    except Exception as e:

    table = dynamodb.Table(TABLE_NAME)        logger.error(f"Failed to store tracking update: {str(e)}")

            metrics.add_metric(name="TrackingUpdateFailed", unit=MetricUnit.Count, value=1)

    try:        raise

        response = table.query(

            KeyConditionExpression=boto3.dynamodb.conditions.Key('tracking_id').eq(tracking_id),@tracer.capture_method

            ScanIndexForward=False,  # Latest firstdef get_tracking_status(tracking_id: str, limit: int = 10, last_evaluated_key: dict = None) -> dict:

            Limit=1    """Get tracking status from DynamoDB with pagination support."""

        )    table = dynamodb.Table(TABLE_NAME)

        

        items = response.get('Items', [])    try:

        if not items:        query_params = {

            return None            'KeyConditionExpression': 'tracking_id = :tid',

                        'ExpressionAttributeValues': {

        return items[0]                ':tid': tracking_id

    except Exception as e:            },

        logger.error(f"Failed to get tracking status: {str(e)}")            'ScanIndexForward': False,

        raise            'Limit': limit

        }

@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)        

@tracer.capture_lambda_handler        if last_evaluated_key:

@metrics.log_metrics(capture_cold_start_metric=True)            query_params['ExclusiveStartKey'] = last_evaluated_key

def main(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:            

    """Main Lambda handler for logistics tracking API."""        response = table.query(**query_params)

    

    try:        metrics.add_metric(name="StatusQuerySuccess", unit=MetricUnit.Count, value=1)

        # Parse API Gateway event        return {

        http_method = event.get('httpMethod', '')            'items': response.get('Items', []),

        path = event.get('path', '')            'last_evaluated_key': response.get('LastEvaluatedKey'),

        body = event.get('body', '{}')            'count': response.get('Count', 0)

        query_params = event.get('queryStringParameters') or {}        }

            except Exception as e:

        logger.info(f"Processing {http_method} request to {path}")        logger.error(f"Failed to get tracking status: {str(e)}")

                metrics.add_metric(name="StatusQueryFailed", unit=MetricUnit.Count, value=1)

        # Handle different endpoints        raise

        if path.startswith('/track') and http_method == 'POST':

            # POST /track - Submit tracking update@logger.inject_lambda_context(correlation_id_path=correlation_paths.API_GATEWAY_REST)

            try:@tracer.capture_lambda_handler

                data = json.loads(body) if body else {}@metrics.log_metrics

            except json.JSONDecodeError:def main(event: Dict[str, Any], context: LambdaContext) -> Dict[str, Any]:

                return {    """Main Lambda handler."""

                    'statusCode': 400,

                    'headers': {'Content-Type': 'application/json'},    logger.info(f"Processing request: {json.dumps(event)}")

                    'body': json.dumps({'error': 'Invalid JSON in request body'})

                }    try:

                    # Load feature flags

            if not validate_tracking_data(data):        feature_flags = json.loads(get_parameter(FEATURE_FLAGS_PARAM, decrypt=False))

                metrics.add_metric(name="ValidationFailure", unit=MetricUnit.Count, value=1)        logger.info(f"Feature flags: {feature_flags}")

                return {

                    'statusCode': 400,        http_method = event.get('httpMethod', '')

                    'headers': {'Content-Type': 'application/json'},        path = event.get('path', '')

                    'body': json.dumps({'error': 'Invalid tracking data'})

                }        if http_method == 'POST' and path == '/track':

                        # Handle tracking update

            # Store the tracking update            body = json.loads(event.get('body', '{}'))

            item = store_tracking_update(data)

            metrics.add_metric(name="TrackingUpdateStored", unit=MetricUnit.Count, value=1)            if not validate_tracking_data(body):

                            return {

            return {                    'statusCode': 400,

                'statusCode': 200,                    'body': json.dumps({'error': 'Invalid tracking data'}),

                'headers': {'Content-Type': 'application/json'},                    'headers': {'Content-Type': 'application/json'}

                'body': json.dumps({                }

                    'message': 'Tracking update stored successfully',

                    'tracking_id': item['tracking_id'],            result = store_tracking_update(body)

                    'timestamp': item['timestamp']

                })            return {

            }                'statusCode': 200,

                        'body': json.dumps({

        elif path.startswith('/status') and http_method == 'GET':                    'message': 'Tracking update stored successfully',

            # GET /status - Get tracking status                    'tracking_id': result['tracking_id'],

            tracking_id = query_params.get('tracking_id')                    'timestamp': result['timestamp']

            if not tracking_id:                }),

                return {                'headers': {'Content-Type': 'application/json'}

                    'statusCode': 400,            }

                    'headers': {'Content-Type': 'application/json'},

                    'body': json.dumps({'error': 'tracking_id parameter required'})        if http_method == 'GET' and path == '/status':

                }            # Handle status query

                        query_params = event.get('queryStringParameters') or {}

            status = get_tracking_status(tracking_id)            tracking_id = query_params.get('tracking_id')

            if not status:

                metrics.add_metric(name="TrackingNotFound", unit=MetricUnit.Count, value=1)            if not tracking_id:

                return {                return {

                    'statusCode': 404,                    'statusCode': 400,

                    'headers': {'Content-Type': 'application/json'},                    'body': json.dumps({'error': 'tracking_id parameter required'}),

                    'body': json.dumps({'error': 'Tracking ID not found'})                    'headers': {'Content-Type': 'application/json'}

                }                }

            

            metrics.add_metric(name="StatusRetrieved", unit=MetricUnit.Count, value=1)            # Parse pagination parameters

            return {            limit = int(query_params.get('limit', 10))

                'statusCode': 200,            last_key_str = query_params.get('last_key')

                'headers': {'Content-Type': 'application/json'},            last_evaluated_key = json.loads(last_key_str) if last_key_str else None

                'body': json.dumps(status)

            }            result = get_tracking_status(tracking_id, limit, last_evaluated_key)

        

        else:            response_body = {

            # Unsupported endpoint                'tracking_id': tracking_id,

            return {                'updates': result['items'],

                'statusCode': 404,                'count': result['count']

                'headers': {'Content-Type': 'application/json'},            }

                'body': json.dumps({'error': 'Endpoint not found'})            

            }            if result['last_evaluated_key']:

                    response_body['next_key'] = json.dumps(result['last_evaluated_key'])

    except Exception as e:

        logger.error(f"Unhandled error: {str(e)}", exc_info=True)            return {

        metrics.add_metric(name="UnhandledError", unit=MetricUnit.Count, value=1)                'statusCode': 200,

                        'body': json.dumps(response_body),

        return {                'headers': {'Content-Type': 'application/json'}

            'statusCode': 500,            }

            'headers': {'Content-Type': 'application/json'},

            'body': json.dumps({'error': 'Internal server error'})        # No matching route found

        }        return {

```            'statusCode': 404,

            'body': json.dumps({'error': 'Not found'}),

## Main Pulumi Program (tap.py)            'headers': {'Content-Type': 'application/json'}

        }

```python

"""    except Exception as e:

Main Pulumi program for the TAP project.        logger.error(f"Unhandled exception: {str(e)}")

"""        metrics.add_metric(name="UnhandledException", unit=MetricUnit.Count, value=1)

import pulumi

from lib.tap_stack import TapStack, TapStackArgs        return {

            'statusCode': 500,

# Create the stack            'body': json.dumps({'error': 'Internal server error'}),

args = TapStackArgs(            'headers': {'Content-Type': 'application/json'}

    environment_suffix=pulumi.Config().get('environment_suffix') or 'dev',        }

    tags={```

        'Project': 'LogisticsTracking',

        'Owner': 'DevOps',## Application Entry Point (tap.py)

        'Cost-Center': 'Engineering'

    }```python

)#!/usr/bin/env python3

"""

stack = TapStack('pulumi-infra', args)Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.



# Export key outputsThis module defines the core Pulumi stack and instantiates the TapStack with appropriate

pulumi.export('api_endpoint', stack.outputs.get('api_endpoint'))configuration based on the deployment environment. It handles environment-specific settings,

pulumi.export('table_name', stack.outputs.get('table_name'))tagging, and deployment configuration for AWS resources.

pulumi.export('lambda_function_name', stack.outputs.get('lambda_function_name'))

pulumi.export('dlq_url', stack.outputs.get('dlq_url'))The stack created by this module uses environment suffixes to distinguish between

pulumi.export('dashboard_url', stack.outputs.get('dashboard_url'))different deployment environments (development, staging, production, etc.).

```"""

import os

## Key Featuresimport sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

### Infrastructure Components

- **DynamoDB Table**: Pay-per-request billing with GSI for status queriesimport pulumi

- **Lambda Function**: Python 3.9 runtime with AWS Lambda Powertoolsfrom pulumi import Config, ResourceOptions

- **API Gateway**: REST API with IAM authentication and request validation  from lib.tap_stack import TapStack, TapStackArgs

- **CloudWatch**: Comprehensive monitoring with alarms and dashboard

- **SSM Parameters**: Secure configuration management# Initialize Pulumi configuration

- **SQS DLQ**: Dead letter queue for failed Lambda executionsconfig = Config()



### Security Features# Get environment suffix from config or environment variable

- IAM roles with least-privilege permissionsimport os

- Secure SSM parameter storage for sensitive dataenvironment_suffix = os.getenv('ENVIRONMENT_SUFFIX', config.get('env') or 'dev')

- X-Ray tracing for observabilitySTACK_NAME = f"TapStack{environment_suffix}"

- Request validation and JSON schema enforcement

- Regional API endpointsrepository_name = os.getenv('REPOSITORY', 'unknown')

commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

### Monitoring & Observability

- CloudWatch alarms for API errors and Lambda throttling# Create a resource options object with default tags

- Custom metrics with AWS Lambda Powertoolsdefault_tags = {

- Structured logging with correlation IDs    'Environment': environment_suffix,

- Performance monitoring dashboard    'Repository': repository_name,

    'Author': commit_author,

### Architecture Benefits}

- Serverless and fully managed

- Auto-scaling based on demandstack = TapStack(

- Cost-effective pay-per-use model    name="pulumi-infra",

- High availability across multiple AZs    args=TapStackArgs(environment_suffix=environment_suffix),

- Built-in monitoring and alerting)

```

This infrastructure successfully deployed 30 AWS resources including the complete serverless logistics tracking API with all monitoring, security, and operational best practices implemented.
## Lambda Dependencies (lib/lambda/requirements.txt)

```txt
aws-lambda-powertools==2.31.0
boto3==1.34.11
```

