### Reasoning Trace
---

The user wants a comprehensive serverless e-commerce application using AWS CDK in Python. Let me break down the requirements:

1. **Core Components:**
   - API Gateway with HTTP endpoints for product CRUD operations
   - Lambda functions (Python) for handling the logic
   - DynamoDB for product data storage
   - S3 bucket for product images
   - CloudWatch Logs for observability
   - SNS for inventory change notifications
   - CloudFront for caching API responses

2. **Security Requirements:**
   - Encryption for data at rest and in transit
   - Principle of least privilege for IAM roles
   - Secure S3 bucket (not public) but with presigned URLs for images
   - Environment variables for secure configuration

3. **Performance & Best Practices:**
   - CloudFront caching
   - API Gateway request validation
   - CORS enabled
   - Consistent tagging (Name, Environment, Owner)
   - Single stack deployment
   - Region: us-west-1

Let me create a comprehensive CDK stack that addresses all these requirements.
### Answer 
---

I'll help you create a comprehensive serverless e-commerce application using AWS CDK in Python. This solution will implement all your requirements with best practices for security, scalability, and performance.

## Complete CDK Stack Implementation

### main.py

```python
#!/usr/bin/env python3
import os
import json
from aws_cdk import (
    App,
    Stack,
    Duration,
    CfnOutput,
    Tags,
    RemovalPolicy,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_s3 as s3,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_logs as logs,
    aws_iam as iam,
)
from constructs import Construct


class ServerlessEcommerceStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        # Set region to us-west-1
        kwargs['env'] = {'region': 'us-west-1'}
        super().__init__(scope, construct_id, **kwargs)
        
        # Define common tags
        self.common_tags = {
            "Name": "ServerlessEcommerce",
            "Environment": "Production",
            "Owner": "DevOps Team"
        }
        
        # Apply tags to entire stack
        for key, value in self.common_tags.items():
            Tags.of(self).add(key, value)
        
        # Create DynamoDB table for products
        products_table = self.create_dynamodb_table()
        
        # Create S3 bucket for product images
        images_bucket = self.create_s3_bucket()
        
        # Create SNS topic for inventory notifications
        inventory_topic = self.create_sns_topic()
        
        # Create Lambda layers for shared dependencies
        lambda_layer = self.create_lambda_layer()
        
        # Create Lambda functions for CRUD operations
        lambda_functions = self.create_lambda_functions(
            products_table, 
            images_bucket, 
            inventory_topic,
            lambda_layer
        )
        
        # Create API Gateway with validation and CORS
        api = self.create_api_gateway(lambda_functions)
        
        # Create CloudFront distribution for caching
        distribution = self.create_cloudfront_distribution(api)
        
        # Outputs
        self.create_outputs(api, distribution, images_bucket, products_table)
    
    def create_dynamodb_table(self):
        """Create DynamoDB table for product storage with encryption"""
        table = dynamodb.Table(
            self, 
            "ProductsTable",
            table_name="ecommerce-products",
            partition_key=dynamodb.Attribute(
                name="product_id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,  # For dev/test only
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES  # For change tracking
        )
        
        # Add global secondary index for category searches
        table.add_global_secondary_index(
            index_name="CategoryIndex",
            partition_key=dynamodb.Attribute(
                name="category",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL
        )
        
        return table
    
    def create_s3_bucket(self):
        """Create S3 bucket for product images with encryption and security"""
        bucket = s3.Bucket(
            self,
            "ProductImagesBucket",
            bucket_name=f"ecommerce-product-images-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    noncurrent_version_expiration=Duration.days(30),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        )
                    ]
                )
            ],
            cors=[
                s3.CorsRule(
                    allowed_methods=[
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.DELETE,
                        s3.HttpMethods.HEAD
                    ],
                    allowed_origins=["*"],  # Restrict this in production
                    allowed_headers=["*"],
                    exposed_headers=["ETag"],
                    max_age=3000
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,  # For dev/test only
            auto_delete_objects=True  # For dev/test only
        )
        
        return bucket
    
    def create_sns_topic(self):
        """Create SNS topic for inventory notifications"""
        topic = sns.Topic(
            self,
            "InventoryNotificationTopic",
            topic_name="ecommerce-inventory-alerts",
            display_name="E-commerce Inventory Alerts"
        )
        
        # Add email subscription (replace with actual email)
        topic.add_subscription(
            subscriptions.EmailSubscription("admin@example.com")
        )
        
        return topic
    
    def create_lambda_layer(self):
        """Create Lambda layer for shared dependencies"""
        layer = lambda_.LayerVersion(
            self,
            "SharedDependenciesLayer",
            code=lambda_.Code.from_asset("lambda_layer"),
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_11],
            description="Shared dependencies for Lambda functions"
        )
        
        return layer
    
    def create_lambda_functions(self, table, bucket, topic, layer):
        """Create Lambda functions for CRUD operations"""
        
        # Common Lambda environment variables
        common_env = {
            "PRODUCTS_TABLE_NAME": table.table_name,
            "IMAGES_BUCKET_NAME": bucket.bucket_name,
            "SNS_TOPIC_ARN": topic.topic_arn,
            "LOG_LEVEL": "INFO",
            "AWS_REGION": self.region
        }
        
        # Create IAM role for Lambda functions
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )
        
        # Create Lambda functions for each operation
        functions = {}
        
        # Create Product Lambda
        functions['create'] = lambda_.Function(
            self,
            "CreateProductFunction",
            function_name="ecommerce-create-product",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_asset("lambda/create_product"),
            handler="index.handler",
            environment=common_env,
            timeout=Duration.seconds(30),
            memory_size=256,
            role=lambda_role,
            layers=[layer],
            log_retention=logs.RetentionDays.ONE_WEEK,
            tracing=lambda_.Tracing.ACTIVE,
            retry_attempts=2
        )
        
        # Read Product Lambda
        functions['read'] = lambda_.Function(
            self,
            "ReadProductFunction",
            function_name="ecommerce-read-product",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_asset("lambda/read_product"),
            handler="index.handler",
            environment=common_env,
            timeout=Duration.seconds(10),
            memory_size=128,
            role=lambda_role,
            layers=[layer],
            log_retention=logs.RetentionDays.ONE_WEEK,
            tracing=lambda_.Tracing.ACTIVE
        )
        
        # Update Product Lambda
        functions['update'] = lambda_.Function(
            self,
            "UpdateProductFunction",
            function_name="ecommerce-update-product",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_asset("lambda/update_product"),
            handler="index.handler",
            environment=common_env,
            timeout=Duration.seconds(30),
            memory_size=256,
            role=lambda_role,
            layers=[layer],
            log_retention=logs.RetentionDays.ONE_WEEK,
            tracing=lambda_.Tracing.ACTIVE,
            retry_attempts=2
        )
        
        # Delete Product Lambda
        functions['delete'] = lambda_.Function(
            self,
            "DeleteProductFunction",
            function_name="ecommerce-delete-product",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_asset("lambda/delete_product"),
            handler="index.handler",
            environment=common_env,
            timeout=Duration.seconds(15),
            memory_size=128,
            role=lambda_role,
            layers=[layer],
            log_retention=logs.RetentionDays.ONE_WEEK,
            tracing=lambda_.Tracing.ACTIVE
        )
        
        # List Products Lambda
        functions['list'] = lambda_.Function(
            self,
            "ListProductsFunction",
            function_name="ecommerce-list-products",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_asset("lambda/list_products"),
            handler="index.handler",
            environment=common_env,
            timeout=Duration.seconds(15),
            memory_size=256,
            role=lambda_role,
            layers=[layer],
            log_retention=logs.RetentionDays.ONE_WEEK,
            tracing=lambda_.Tracing.ACTIVE
        )
        
        # Grant permissions to Lambda functions
        for func in functions.values():
            table.grant_read_write_data(func)
            bucket.grant_read_write(func)
            topic.grant_publish(func)
        
        return functions
    
    def create_api_gateway(self, lambda_functions):
        """Create API Gateway with validation and CORS"""
        
        # Create request validators
        request_validator = apigateway.RequestValidator(
            self,
            "RequestValidator",
            rest_api=None,  # Will be set later
            validate_request_body=True,
            validate_request_parameters=True
        )
        
        # Create API Gateway
        api = apigateway.RestApi(
            self,
            "EcommerceAPI",
            rest_api_name="ecommerce-api",
            description="E-commerce Serverless API",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_burst_limit=5000,
                throttling_rate_limit=10000,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                cache_cluster_enabled=True,
                cache_cluster_size="0.5",
                cache_ttl=Duration.minutes(5)
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["*"],  # Restrict this in production
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=["Content-Type", "Authorization", "X-Amz-Date", 
                              "X-Api-Key", "X-Amz-Security-Token"],
                max_age=Duration.days(1)
            ),
            endpoint_types=[apigateway.EndpointType.REGIONAL]
        )
        
        # Create product model for validation
        product_model = api.add_model(
            "ProductModel",
            content_type="application/json",
            schema=apigateway.JsonSchema(
                type=apigateway.JsonSchemaType.OBJECT,
                properties={
                    "name": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                    "description": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                    "price": apigateway.JsonSchema(type=apigateway.JsonSchemaType.NUMBER),
                    "category": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING),
                    "inventory": apigateway.JsonSchema(type=apigateway.JsonSchemaType.INTEGER),
                    "image_url": apigateway.JsonSchema(type=apigateway.JsonSchemaType.STRING)
                },
                required=["name", "price", "category", "inventory"]
            )
        )
        
        # Products resource
        products = api.root.add_resource("products")
        product = products.add_resource("{product_id}")
        
        # GET /products - List all products
        products.add_method(
            "GET",
            apigateway.LambdaIntegration(
                lambda_functions['list'],
                proxy=True,
                integration_responses=[{
                    'statusCode': '200',
                    'responseParameters': {
                        'method.response.header.Access-Control-Allow-Origin': "'*'"
                    }
                }]
            ),
            method_responses=[{
                'statusCode': '200',
                'responseParameters': {
                    'method.response.header.Access-Control-Allow-Origin': True
                }
            }]
        )
        
        # POST /products - Create product
        products.add_method(
            "POST",
            apigateway.LambdaIntegration(
                lambda_functions['create'],
                proxy=True,
                integration_responses=[{
                    'statusCode': '201'
                }]
            ),
            request_models={
                "application/json": product_model
            },
            request_validator=request_validator,
            method_responses=[{
                'statusCode': '201'
            }]
        )
        
        # GET /products/{product_id} - Get single product
        product.add_method(
            "GET",
            apigateway.LambdaIntegration(
                lambda_functions['read'],
                proxy=True,
                integration_responses=[{
                    'statusCode': '200'
                }]
            ),
            request_parameters={
                'method.request.path.product_id': True
            },
            method_responses=[{
                'statusCode': '200'
            }]
        )
        
        # PUT /products/{product_id} - Update product
        product.add_method(
            "PUT",
            apigateway.LambdaIntegration(
                lambda_functions['update'],
                proxy=True,
                integration_responses=[{
                    'statusCode': '200'
                }]
            ),
            request_models={
                "application/json": product_model
            },
            request_parameters={
                'method.request.path.product_id': True
            },
            request_validator=request_validator,
            method_responses=[{
                'statusCode': '200'
            }]
        )
        
        # DELETE /products/{product_id} - Delete product
        product.add_method(
            "DELETE",
            apigateway.LambdaIntegration(
                lambda_functions['delete'],
                proxy=True,
                integration_responses=[{
                    'statusCode': '204'
                }]
            ),
            request_parameters={
                'method.request.path.product_id': True
            },
            method_responses=[{
                'statusCode': '204'
            }]
        )
        
        return api
    
    def create_cloudfront_distribution(self, api):
        """Create CloudFront distribution for API caching"""
        
        # Create CloudFront distribution
        distribution = cloudfront.Distribution(
            self