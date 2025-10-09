from aws_cdk import (
    aws_apigateway as apigateway,
    aws_logs as logs,
    aws_iam as iam,
    Duration,
    aws_wafv2 as waf,
)
from constructs import Construct


class ApiConstruct(Construct):
    def __init__(
        self,
        scope: Construct,
        id: str,
        lambda_functions: dict,
        env_name: str,
        **kwargs
    ) -> None:
        super().__init__(scope, id, **kwargs)

        # Create CloudWatch log group for API Gateway
        api_log_group = logs.LogGroup(
            self,
            "ApiLogGroup",
            log_group_name=f"/aws/apigateway/inventory-{env_name}",
            retention=logs.RetentionDays.ONE_WEEK if env_name == "dev" else logs.RetentionDays.ONE_MONTH
        )

        # Create REST API
        self.rest_api = apigateway.RestApi(
            self,
            "InventoryApi",
            rest_api_name=f"inventory-api-{env_name}",
            description=f"Inventory Management API - {env_name}",
            deploy_options=apigateway.StageOptions(
                stage_name=env_name,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                access_log_destination=apigateway.LogGroupLogDestination(api_log_group),
                access_log_format=apigateway.AccessLogFormat.json_with_standard_fields(
                    caller=True,
                    http_method=True,
                    ip=True,
                    protocol=True,
                    request_time=True,
                    resource_path=True,
                    response_length=True,
                    status=True,
                    user=True
                ),
                throttling_rate_limit=10000,  # requests per second
                throttling_burst_limit=5000,   # concurrent requests
                metrics_enabled=True,
                tracing_enabled=True,
                data_trace_enabled=False if env_name == "prod" else True
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["*"] if env_name == "dev" else ["https://yourdomain.com"],
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
                max_age=Duration.seconds(300)
            ),
            endpoint_types=[apigateway.EndpointType.REGIONAL]
        )

        # Create API key and usage plan for production
        if env_name == "prod":
            api_key = apigateway.ApiKey(
                self,
                "ApiKey",
                api_key_name=f"inventory-api-key-{env_name}",
                description="API key for inventory management"
            )

            usage_plan = apigateway.UsagePlan(
                self,
                "UsagePlan",
                name=f"inventory-usage-plan-{env_name}",
                api_stages=[apigateway.UsagePlanPerApiStage(
                    api=self.rest_api,
                    stage=self.rest_api.deployment_stage
                )],
                throttle=apigateway.ThrottleSettings(
                    rate_limit=10000,
                    burst_limit=5000
                ),
                quota=apigateway.QuotaSettings(
                    limit=1000000,  # 1M requests
                    period=apigateway.Period.MONTH
                )
            )
            usage_plan.add_api_key(api_key)

        # Request validator
        request_validator = apigateway.RequestValidator(
            self,
            "RequestValidator",
            rest_api=self.rest_api,
            validate_request_body=True,
            validate_request_parameters=True
        )

        # Create request/response models
        item_model = apigateway.Model(
            self,
            "ItemModel",
            rest_api=self.rest_api,
            content_type="application/json",
            model_name="ItemModel",
            schema=apigateway.JsonSchema(
                schema=apigateway.JsonSchemaVersion.DRAFT4,
                title="Item",
                type=apigateway.JsonSchemaType.OBJECT,
                required=["sku", "name", "quantity", "category"],
                properties={
                    "sku": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                    "name": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                    "description": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                    "quantity": apigateway.JsonSchema(type=apigateway.JsonSchemaType.INTEGER, minimum=0),
                    "price": apigateway.JsonSchema(type=apigateway.JsonSchemaType.NUMBER, minimum=0),
                    "category": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                    "status": apigateway.JsonSchema(
                        type=apigateway.JsonSchemaType.STRING,
                        enum=["available", "out_of_stock", "discontinued"]
                    )
                }
            )
        )

        # Create /items resource
        items_resource = self.rest_api.root.add_resource("items")
        item_resource = items_resource.add_resource("{item_id}")

        # POST /items - Create item
        items_resource.add_method(
            "POST",
            apigateway.LambdaIntegration(
                lambda_functions["create_item"],
                timeout=Duration.seconds(29)
            ),
            request_validator=request_validator,
            request_models={"application/json": item_model},
            api_key_required=True if env_name == "prod" else False
        )

        # GET /items - List items
        items_resource.add_method(
            "GET",
            apigateway.LambdaIntegration(
                lambda_functions["list_items"],
                timeout=Duration.seconds(29)
            ),
            request_parameters={
                "method.request.querystring.category": False,
                "method.request.querystring.status": False,
                "method.request.querystring.page_size": False,
                "method.request.querystring.last_evaluated_key": False
            },
            api_key_required=True if env_name == "prod" else False
        )

        # GET /items/{item_id} - Get item
        item_resource.add_method(
            "GET",
            apigateway.LambdaIntegration(
                lambda_functions["get_item"],
                timeout=Duration.seconds(29)
            ),
            request_parameters={
                "method.request.path.item_id": True,
                "method.request.querystring.sku": False
            },
            api_key_required=True if env_name == "prod" else False
        )

        # PUT /items/{item_id} - Update item
        item_resource.add_method(
            "PUT",
            apigateway.LambdaIntegration(
                lambda_functions["update_item"],
                timeout=Duration.seconds(29)
            ),
            request_validator=request_validator,
            request_models={"application/json": item_model},
            request_parameters={
                "method.request.path.item_id": True
            },
            api_key_required=True if env_name == "prod" else False
        )

        # DELETE /items/{item_id} - Delete item
        item_resource.add_method(
            "DELETE",
            apigateway.LambdaIntegration(
                lambda_functions["delete_item"],
                timeout=Duration.seconds(29)
            ),
            request_parameters={
                "method.request.path.item_id": True,
                "method.request.querystring.sku": True
            },
            api_key_required=True if env_name == "prod" else False
        )
