from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    aws_lambda as _lambda,
    aws_logs as logs,
    aws_iam as iam,
    aws_apigateway as apigateway,
    aws_events as events,
    aws_events_targets as targets,
    aws_ssm as ssm,
    aws_budgets as budgets,
    RemovalPolicy,
    CfnOutput
)

from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Properties for TapStack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        """Initialize TapStackProps."""
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """Main CDK stack for the serverless Tap platform."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        """Initialize TapStack."""
        super().__init__(scope, construct_id, **kwargs)

        # Determine environment suffix
        self.environment_suffix = (
                (props.environment_suffix if props else None)
                or self.node.try_get_context('environmentSuffix')
                or 'dev'
        )


        self.log_group = logs.LogGroup(
            self,
            'ServerlessLogGroup',
            log_group_name=f'/aws/lambda/serverless-platform-{self.environment_suffix}',
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

    
        # Lambda execution role
        self.lambda_execution_role = self._create_lambda_execution_role()

        # Sample Lambda function
        self.sample_function = self._create_sample_lambda_function()

        # Monitoring Lambda function
        self.monitoring_function = self._create_monitoring_lambda_function()

        # API Gateway
        self.api_gateway = self._create_api_gateway()

        # EventBridge rule for monitoring
        self._create_monitoring_schedule()

        # SSM parameters
        self._create_ssm_parameters()

        # Outputs
        self._create_outputs()

    def _create_lambda_execution_role(self) -> iam.Role:
        """Create IAM role for Lambda execution."""
        role = iam.Role(
            self,
            'LambdaExecutionRole',
            assumed_by=iam.ServicePrincipal('lambda.amazonaws.com'),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    'service-role/AWSLambdaBasicExecutionRole'
                )
            ]
        )

        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    'logs:CreateLogStream',
                    'logs:PutLogEvents',
                    'logs:DescribeLogGroups',
                    'logs:DescribeLogStreams'
                ],
                resources=[self.log_group.log_group_arn + '*']
            )
        )

        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    'cloudwatch:PutMetricData',
                    'cloudwatch:GetMetricStatistics',
                    'cloudwatch:ListMetrics'
                ],
                resources=['*']
            )
        )

        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    'ssm:GetParameter',
                    'ssm:GetParameters'
                ],
                resources=[
                    f'arn:aws:ssm:{self.region}:{self.account}:parameter/serverless-platform/*'
                ]
            )
        )

        return role

    def _create_sample_lambda_function(self) -> _lambda.Function:
        # Check if running on LocalStack
        is_localstack = "localhost" in str(self.node.try_get_context('AWS_ENDPOINT_URL') or "")

        lambda_props = {
            "runtime": _lambda.Runtime.PYTHON_3_9,
            "handler": "index.lambda_handler",
            "code": _lambda.Code.from_inline("def lambda_handler(event, context): return 'ok'"),
            "role": self.lambda_execution_role,
            "memory_size": 512,
            "timeout": cdk.Duration.minutes(1),
            "environment": {
                "LOG_LEVEL": "INFO",
                "POWERTOOLS_SERVICE_NAME": "sample-service",
                "POWERTOOLS_METRICS_NAMESPACE": "ServerlessPlatform"
            }
        }

        # Only use ARM64 architecture on AWS, not LocalStack
        if not is_localstack:
            lambda_props["architecture"] = _lambda.Architecture.ARM_64

        self.sample_function = _lambda.Function(
            self,
            "SampleFunction",
            **lambda_props
        )

        # Publish a new version
        version = self.sample_function.current_version

        # Attach alias without provisioned concurrency for LocalStack compatibility
        _lambda.Alias(
            self,
            "SampleFunctionAlias",
            alias_name="prod",
            version=version
        )

        return self.sample_function




    def _create_monitoring_lambda_function(self) -> _lambda.Function:
        # Check if running on LocalStack
        is_localstack = "localhost" in str(self.node.try_get_context('AWS_ENDPOINT_URL') or "")

        lambda_props = {
            "runtime": _lambda.Runtime.PYTHON_3_9,
            "handler": "index.lambda_handler",
            "code": _lambda.Code.from_inline("def lambda_handler(event, context): return 'ok'"),
            "role": self.lambda_execution_role,
            "memory_size": 512,
            "timeout": cdk.Duration.seconds(60),
            "log_group": self.log_group,
            "environment": {
                "DATADOG_API_KEY_PARAM": "/serverless-platform/datadog/api-key",
                "SAMPLE_FUNCTION_NAME": "SampleFunction"
            },
            "description": "Monitoring function for third-party integration"
        }

        # Only use ARM64 architecture on AWS, not LocalStack
        if not is_localstack:
            lambda_props["architecture"] = _lambda.Architecture.ARM_64

        return _lambda.Function(
            self,
            "MonitoringFunction",
            **lambda_props
        )

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway for serverless functions."""
        api = apigateway.RestApi(
            self,
            'ServerlessAPI',
            rest_api_name=f'Serverless Platform API-{self.environment_suffix}',
            description='API Gateway for serverless platform functions',
            deploy_options=apigateway.StageOptions(
                stage_name='prod',
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigateway.MethodLoggingLevel.ERROR,
                data_trace_enabled=False,
                metrics_enabled=True
            )
        )

        lambda_integration = apigateway.LambdaIntegration(
            self.sample_function,
            request_templates={'application/json': '{ "statusCode": "200" }'}
        )

        sample_resource = api.root.add_resource('sample')
        sample_resource.add_method('GET', lambda_integration)
        sample_resource.add_method('POST', lambda_integration)

        return api

    def _create_monitoring_schedule(self) -> None:
        """Create EventBridge rule to trigger monitoring Lambda."""
        rule = events.Rule(
            self,
            'MonitoringScheduleRule',
            schedule=events.Schedule.rate(cdk.Duration.minutes(1)),  # changed to 1 min
            description="Trigger monitoring function every 1 minute"
        )
        rule.add_target(targets.LambdaFunction(self.monitoring_function))

    def _create_ssm_parameters(self) -> None:
        """Create SSM parameters."""
        ssm.StringParameter(
            self,
            'DatadogApiKeyParameter',
            parameter_name='/serverless-platform/datadog/api-key',
            string_value='PLACEHOLDER_DATADOG_API_KEY',
            description='Datadog API key for monitoring integration',
            tier=ssm.ParameterTier.STANDARD
        )

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs."""
        CfnOutput(
            self,
            'ApiGatewayUrl',
            value=self.api_gateway.url,
            description='API Gateway endpoint URL'
        )
        CfnOutput(
            self,
            'SampleFunctionName',
            value=self.sample_function.function_name,
            description='Sample Lambda function name'
        )
        CfnOutput(
            self,
            'LogGroupName',
            value=self.log_group.log_group_name,
            description='CloudWatch Log Group name'
        )

        # Budget alert for $1000/month (AWS only - not supported in LocalStack)
        is_localstack = "localhost" in str(self.node.try_get_context('AWS_ENDPOINT_URL') or "")
        if not is_localstack:
            budget = budgets.CfnBudget(
                self,
                "ServerlessBudget",
                budget={
                    "budgetName": f"ServerlessPlatform-{self.environment_suffix}-Budget",
                    "budgetLimit": {"amount": 1000, "unit": "USD"},
                    "timeUnit": "MONTHLY",
                    "budgetType": "COST"
                },
                notifications_with_subscribers=[{
                    "notification": {
                        "notificationType": "FORECASTED",
                        "comparisonOperator": "GREATER_THAN",
                        "threshold": 80  # triggers at 80% usage
                    },
                    "subscribers": [{
                        "subscriptionType": "EMAIL",
                        "address": "admin@company.com"
                    }]
                }]
            )
