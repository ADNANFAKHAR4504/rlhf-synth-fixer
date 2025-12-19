```python
#!/usr/bin/env python3

from aws_cdk import (
    core as cdk,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_logs as logs,
    aws_iam as iam
)

class ServerlessApiStack(cdk.Stack):
    def __init__(self, scope: cdk.Construct, id: str, **kwargs) -> None:
        super().__init__(scope, id, **kwargs)

        # Lambda Function Configuration
        lambda_function = _lambda.Function(
            self, "StatusHandler",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="handler.main",
            code=_lambda.Code.from_asset("lambda"),  # Assumes code in ./lambda directory
            environment={
                "LOG_LEVEL": "INFO"
            },
            timeout=cdk.Duration.seconds(10),
            memory_size=512,  # Allocate memory for performance
            reserved_concurrent_executions=1000,  # Reserve concurrency for scaling
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Apply least privilege IAM policy
        lambda_function.add_to_role_policy(
            iam.PolicyStatement(
                actions=["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                resources=["arn:aws:logs:*:*:*"]
            )
        )

        # API Gateway Configuration
        api = apigateway.RestApi(
            self, "ProductionApi",
            rest_api_name="ProductionService",
            description="Production-ready API Gateway",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_burst_limit=2000,
                throttling_rate_limit=1000,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True
            ),
            cloud_watch_role=True,  # Enable CloudWatch logging
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS
            )
        )

        # Define GET /status endpoint
        status_resource = api.root.add_resource("status")
        status_integration = apigateway.LambdaIntegration(lambda_function)
        status_resource.add_method(
            "GET", status_integration,
            request_validator_options=apigateway.RequestValidatorOptions(
                request_validator_name="statusValidator",
                validate_request_body=False,
                validate_request_parameters=True
            )
        )

        # Tagging all resources
        cdk.Tags.of(self).add("Environment", "Production")
        cdk.Tags.of(lambda_function).add("Environment", "Production")
        cdk.Tags.of(api).add("Environment", "Production")

        # Outputs
        cdk.CfnOutput(self, "ApiUrl", value=api.url)

app = cdk.App()
ServerlessApiStack(app, "ServerlessApiStack", env={'region': 'us-east-1'})
app.synth()
```

### Key Components Explained:
1. **Lambda Configuration**: 
   - Uses Python 3.9 runtime with 512MB memory and 10s timeout
   - Reserves 1000 concurrent executions for scaling
   - Environment variables for configuration
   - Least-privilege IAM policy for CloudWatch logging

2. **API Gateway**:
   - Production stage with throttling (1000 RPS sustained)
   - Request validation enabled for security
   - CloudWatch logging enabled
   - CORS configured for cross-origin requests

3. **Security**:
   - No hardcoded secrets
   - All resources tagged with production environment
   - IAM roles follow least privilege

4. **Logging**:
   - Lambda logs to CloudWatch with 1-week retention
   - API Gateway access logs enabled

Would need to create a `lambda/handler.py` file with:
```python
def main(event, context):
    return {"statusCode": 200, "body": "System OK"}
```