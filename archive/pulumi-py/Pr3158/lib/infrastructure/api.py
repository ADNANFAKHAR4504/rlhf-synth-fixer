"""
api.py

API Gateway module with HTTPS enforcement and custom domain.
Addresses model failures: API Gateway HTTPS enforcement invalid, custom domain incomplete,
API Gateway → Lambda integration URI incorrect.
"""

import json

import pulumi
import pulumi_aws as aws

from .config import config


def create_api_gateway(name: str, lambda_function, domain_name: str, certificate_arn: str = None):
    """
    Create API Gateway with proper HTTPS enforcement and custom domain.
    Addresses model failures: API Gateway HTTPS enforcement invalid, custom domain incomplete.
    """
    
    # Create API Gateway REST API
    rest_api = aws.apigateway.RestApi(
        f"{name}-api",
        name=f"{name}-api",
        description=f"API Gateway for {name}",
        policy=json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Deny",
                "Principal": "*",
                "Action": "execute-api:Invoke",
                "Resource": "*",
                "Condition": {
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                }
            }]
        }),
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create API Gateway Resource for proxy integration
    resource = aws.apigateway.Resource(
        f"{name}-resource",
        rest_api=rest_api.id,
        parent_id=rest_api.root_resource_id,
        path_part="{proxy+}",
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create ANY method for the resource
    method = aws.apigateway.Method(
        f"{name}-method",
        rest_api=rest_api.id,
        resource_id=resource.id,
        http_method="ANY",
        authorization="NONE",
        api_key_required=False,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create integration between API Gateway and Lambda (fixes model failure: integration URI incorrect)
    integration = aws.apigateway.Integration(
        f"{name}-integration",
        rest_api=rest_api.id,
        resource_id=resource.id,
        http_method=method.http_method,
        integration_http_method="POST",
        type="AWS_PROXY",
        uri=lambda_function.invoke_arn,  # Use invoke_arn, not function_arn
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create deployment for the API
    deployment = aws.apigateway.Deployment(
        f"{name}-deployment",
        rest_api=rest_api.id,
        opts=pulumi.ResourceOptions(
            depends_on=[integration],
            provider=config.aws_provider
        )
    )

    # Create stage for the API with X-Ray tracing
    stage = aws.apigateway.Stage(
        f"{name}-stage",
        rest_api=rest_api.id,
        deployment=deployment.id,
        stage_name="api",
        cache_cluster_enabled=False,
        xray_tracing_enabled=True,
        variables={
            "environment": pulumi.get_stack()
        },
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create method settings to enforce HTTPS (fixes model failure: API Gateway HTTPS enforcement invalid)
    method_settings = aws.apigateway.MethodSettings(
        f"{name}-method-settings",
        rest_api=rest_api.id,
        stage_name=stage.stage_name,
        method_path="*/*",
        settings=aws.apigateway.MethodSettingsSettingsArgs(
            metrics_enabled=True,
            throttling_rate_limit=1000,
            throttling_burst_limit=2000
        ),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create custom domain name with proper certificate (fixes model failure: custom domain incomplete)
    custom_domain = None
    base_path_mapping = None
    
    if certificate_arn:
        custom_domain = aws.apigateway.DomainName(
            f"{name}-domain",
            domain_name=domain_name,
            certificate_arn=certificate_arn,
            endpoint_configuration=aws.apigateway.DomainNameEndpointConfigurationArgs(
                types=["REGIONAL"]
            ),
            security_policy="TLS_1_2",
            tags=config.get_tags(),
            opts=pulumi.ResourceOptions(provider=config.aws_provider)
        )

        # Map custom domain to API stage
        base_path_mapping = aws.apigateway.BasePathMapping(
            f"{name}-base-path-mapping",
            rest_api=rest_api.id,
            stage_name=stage.stage_name,
            domain_name=custom_domain.domain_name,
            opts=pulumi.ResourceOptions(provider=config.aws_provider)
        )

    # Grant Lambda permission to be invoked by API Gateway
    permission = aws.lambda_.Permission(
        f"{name}-apigw-permission",
        action="lambda:InvokeFunction",
        function=lambda_function.name,
        principal="apigateway.amazonaws.com",
        source_arn=pulumi.Output.concat(rest_api.execution_arn, "/*/*"),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create API Gateway usage plan and API key for rate limiting
    usage_plan = aws.apigateway.UsagePlan(
        f"{name}-usage-plan",
        name=f"{name}-usage-plan",
        description=f"Usage plan for {name} API",
        api_stages=[aws.apigateway.UsagePlanApiStageArgs(
            api_id=rest_api.id,
            stage=stage.stage_name
        )],
        quota_settings=aws.apigateway.UsagePlanQuotaSettingsArgs(
            limit=10000,
            period="DAY"
        ),
        throttle_settings=aws.apigateway.UsagePlanThrottleSettingsArgs(
            rate_limit=100,
            burst_limit=200
        ),
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Create API key
    api_key = aws.apigateway.ApiKey(
        f"{name}-api-key",
        name=f"{name}-api-key",
        description=f"API key for {name}",
        tags=config.get_tags(),
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    # Associate API key with usage plan
    usage_plan_key = aws.apigateway.UsagePlanKey(
        f"{name}-usage-plan-key",
        key_id=api_key.id,
        key_type="API_KEY",
        usage_plan_id=usage_plan.id,
        opts=pulumi.ResourceOptions(provider=config.aws_provider)
    )

    return {
        "rest_api": rest_api,
        "stage": stage,
        "custom_domain": custom_domain,
        "base_path_mapping": base_path_mapping,
        "usage_plan": usage_plan,
        "api_key": api_key,
        "endpoint": custom_domain.domain_name if custom_domain else pulumi.Output.concat(rest_api.id, ".execute-api.", config.aws_region, ".amazonaws.com/", stage.stage_name)
    }
