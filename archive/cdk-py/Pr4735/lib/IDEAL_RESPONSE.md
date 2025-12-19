## Ideal response

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

import os
from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
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


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the 
    deployment environment (e.g., 'dev', 'prod').
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack creates a comprehensive serverless e-commerce application with:
  - API Gateway for HTTP endpoints
  - Lambda functions for CRUD operations
  - DynamoDB for product data storage
  - S3 bucket for product images
  - SNS for inventory notifications
  - CloudFront for caching
  - Proper security, encryption, and monitoring

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the 
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    
    
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Define common tags as per model response requirements
    self.common_tags = {
        "Name": f"ServerlessEcommerce-{environment_suffix}",
        "Environment": environment_suffix,
        "Owner": "DevOps Team"
    }
    
    # Apply tags to entire stack
    for key, value in self.common_tags.items():
        Tags.of(self).add(key, value)

    # Create DynamoDB table for products
    products_table = self.create_dynamodb_table(environment_suffix)
    
    # Create S3 bucket for product images
    images_bucket = self.create_s3_bucket(environment_suffix)
    
    # Create SNS topic for inventory notifications
    inventory_topic = self.create_sns_topic(environment_suffix)
    
    # Create Lambda functions for CRUD operations
    lambda_functions = self.create_lambda_functions(
        products_table, 
        images_bucket, 
        inventory_topic,
        environment_suffix
    )
    
    # Create API Gateway with validation and CORS
    api = self.create_api_gateway(lambda_functions, environment_suffix)
    
    # Create CloudFront distribution for caching
    distribution = self.create_cloudfront_distribution(api, environment_suffix)
    
    # Store important attributes
    self.products_table = products_table
    self.images_bucket = images_bucket
    self.inventory_topic = inventory_topic
    self.lambda_functions = lambda_functions
    self.api = api
    self.distribution = distribution
    self.environment_suffix = environment_suffix
    
    # Create outputs
    self.create_outputs(api, distribution, images_bucket, products_table)

  def create_dynamodb_table(self, environment_suffix: str):
    """Create DynamoDB table for product storage with encryption"""
    table = dynamodb.Table(
        self, 
        "ProductsTable",
        table_name=f"ecommerce-products-{environment_suffix}",
        partition_key=dynamodb.Attribute(
            name="product_id",
            type=dynamodb.AttributeType.STRING
        ),
        billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
        encryption=dynamodb.TableEncryption.AWS_MANAGED,
        point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
            point_in_time_recovery_enabled=True
        ),
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

  def create_s3_bucket(self, environment_suffix: str):
    """Create S3 bucket for product images with encryption and security"""
    bucket = s3.Bucket(
        self,
        "ProductImagesBucket",
        bucket_name=f"ecommerce-product-images-{environment_suffix}-{self.account}-{self.region}",
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

  def create_sns_topic(self, environment_suffix: str):
    """Create SNS topic for inventory notifications"""
    topic = sns.Topic(
        self,
        "InventoryNotificationTopic",
        topic_name=f"ecommerce-inventory-alerts-{environment_suffix}",
        display_name=f"E-commerce Inventory Alerts ({environment_suffix})"
    )
    
    # Add email subscription (replace with actual email)
    topic.add_subscription(
        subscriptions.EmailSubscription(os.environ.get("ADMIN_EMAIL", "admin@example.com"))
    )
    
    return topic

  def create_lambda_functions(self, table, bucket, topic, environment_suffix: str):
    """Create Lambda functions for CRUD operations with inline code"""
    
    # Common Lambda environment variables (removed AWS_REGION as it's reserved)
    common_env = {
        "PRODUCTS_TABLE_NAME": table.table_name,
        "IMAGES_BUCKET_NAME": bucket.bucket_name,
        "SNS_TOPIC_ARN": topic.topic_arn,
        "LOG_LEVEL": "INFO",
        "ENVIRONMENT": environment_suffix
    }
    
    # Create IAM role for Lambda functions with least privilege
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
    
    # Lambda function code for Create Product (fixed import statement)
    create_product_code = """
import json
import boto3
import logging
import uuid
import os
from datetime import datetime
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
s3 = boto3.client('s3')

def handler(event, context):
    try:
        table_name = os.environ['PRODUCTS_TABLE_NAME']
        bucket_name = os.environ['IMAGES_BUCKET_NAME']
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']
        
        table = dynamodb.Table(table_name)
        
        # Parse request body
        body = json.loads(event['body'])
        
        # Generate product ID
        product_id = str(uuid.uuid4())
        
        # Create product item
        product = {
            'product_id': product_id,
            'name': body['name'],
            'description': body.get('description', ''),
            'price': Decimal(str(body['price'])),
            'category': body['category'],
            'inventory': int(body['inventory']),
            'image_url': body.get('image_url', ''),
            'created_at': datetime.utcnow().isoformat(),
            'updated_at': datetime.utcnow().isoformat()
        }
        
        # Save to DynamoDB
        table.put_item(Item=product)
        
        # Send SNS notification for new product
        sns.publish(
            TopicArn=sns_topic_arn,
            Message=f"New product created: {product['name']} with inventory: {product['inventory']}",
            Subject="New Product Added"
        )
        
        logger.info(f"Created product: {product_id}")
        
        return {
            'statusCode': 201,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(product, default=str)
        }
        
    except Exception as e:
        logger.error(f"Error creating product: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
"""

    # Lambda function code for Read Product
    read_product_code = """
import json
import boto3
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    try:
        table_name = os.environ['PRODUCTS_TABLE_NAME']
        table = dynamodb.Table(table_name)
        
        # Get product ID from path parameters
        product_id = event['pathParameters']['product_id']
        
        # Get product from DynamoDB
        response = table.get_item(Key={'product_id': product_id})
        
        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Product not found'})
            }
        
        product = response['Item']
        logger.info(f"Retrieved product: {product_id}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(product, default=str)
        }
        
    except Exception as e:
        logger.error(f"Error reading product: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
"""

    # Lambda function code for Update Product
    update_product_code = """
import json
import boto3
import logging
import os
from datetime import datetime
from decimal import Decimal

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def handler(event, context):
    try:
        table_name = os.environ['PRODUCTS_TABLE_NAME']
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']
        table = dynamodb.Table(table_name)
        
        # Get product ID from path parameters
        product_id = event['pathParameters']['product_id']
        
        # Parse request body
        body = json.loads(event['body'])
        
        # Get existing product
        existing_response = table.get_item(Key={'product_id': product_id})
        if 'Item' not in existing_response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Product not found'})
            }
        
        existing_product = existing_response['Item']
        old_inventory = existing_product.get('inventory', 0)
        new_inventory = int(body.get('inventory', old_inventory))
        
        # Update product
        update_expression = "SET "
        expression_values = {}
        
        if 'name' in body:
            update_expression += "name = :name, "
            expression_values[':name'] = body['name']
        
        if 'description' in body:
            update_expression += "description = :desc, "
            expression_values[':desc'] = body['description']
        
        if 'price' in body:
            update_expression += "price = :price, "
            expression_values[':price'] = Decimal(str(body['price']))
        
        if 'category' in body:
            update_expression += "category = :category, "
            expression_values[':category'] = body['category']
        
        if 'inventory' in body:
            update_expression += "inventory = :inventory, "
            expression_values[':inventory'] = new_inventory
        
        update_expression += "updated_at = :updated"
        expression_values[':updated'] = datetime.utcnow().isoformat()
        
        # Update in DynamoDB
        response = table.update_item(
            Key={'product_id': product_id},
            UpdateExpression=update_expression,
            ExpressionAttributeValues=expression_values,
            ReturnValues='ALL_NEW'
        )
        
        # Send SNS notification if inventory changed
        if old_inventory != new_inventory:
            sns.publish(
                TopicArn=sns_topic_arn,
                Message=f"Inventory updated for {response['Attributes']['name']}: {old_inventory} -> {new_inventory}",
                Subject="Inventory Level Changed"
            )
        
        logger.info(f"Updated product: {product_id}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response['Attributes'], default=str)
        }
        
    except Exception as e:
        logger.error(f"Error updating product: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
"""

    # Lambda function code for Delete Product
    delete_product_code = """
import json
import boto3
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

def handler(event, context):
    try:
        table_name = os.environ['PRODUCTS_TABLE_NAME']
        sns_topic_arn = os.environ['SNS_TOPIC_ARN']
        table = dynamodb.Table(table_name)
        
        # Get product ID from path parameters
        product_id = event['pathParameters']['product_id']
        
        # Get product before deletion for notification
        existing_response = table.get_item(Key={'product_id': product_id})
        if 'Item' not in existing_response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Product not found'})
            }
        
        product_name = existing_response['Item']['name']
        
        # Delete product from DynamoDB
        table.delete_item(Key={'product_id': product_id})
        
        # Send SNS notification
        sns.publish(
            TopicArn=sns_topic_arn,
            Message=f"Product deleted: {product_name}",
            Subject="Product Deleted"
        )
        
        logger.info(f"Deleted product: {product_id}")
        
        return {
            'statusCode': 204,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            }
        }
        
    except Exception as e:
        logger.error(f"Error deleting product: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
"""

    # Lambda function code for List Products
    list_products_code = """
import json
import boto3
import logging
import os

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    try:
        table_name = os.environ['PRODUCTS_TABLE_NAME']
        table = dynamodb.Table(table_name)
        
        # Get query parameters
        query_params = event.get('queryStringParameters') or {}
        category = query_params.get('category')
        
        if category:
            # Query by category using GSI
            response = table.query(
                IndexName='CategoryIndex',
                KeyConditionExpression='category = :category',
                ExpressionAttributeValues={':category': category}
            )
        else:
            # Scan all products
            response = table.scan()
        
        products = response['Items']
        logger.info(f"Retrieved {len(products)} products")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'products': products,
                'count': len(products)
            }, default=str)
        }
        
    except Exception as e:
        logger.error(f"Error listing products: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
"""
    
    # Create Lambda functions
    functions = {}
    
    # Create Product Lambda
    functions['create'] = lambda_.Function(
        self,
        "CreateProductFunction",
        function_name=f"ecommerce-create-product-{environment_suffix}",
        runtime=lambda_.Runtime.PYTHON_3_11,
        code=lambda_.Code.from_inline(create_product_code),
        handler="index.handler",
        environment=common_env,
        timeout=Duration.seconds(30),
        memory_size=256,
        role=lambda_role,
        log_retention=logs.RetentionDays.ONE_WEEK,
        tracing=lambda_.Tracing.ACTIVE,
        retry_attempts=2
    )
    
    # Read Product Lambda
    functions['read'] = lambda_.Function(
        self,
        "ReadProductFunction",
        function_name=f"ecommerce-read-product-{environment_suffix}",
        runtime=lambda_.Runtime.PYTHON_3_11,
        code=lambda_.Code.from_inline(read_product_code),
        handler="index.handler",
        environment=common_env,
        timeout=Duration.seconds(10),
        memory_size=128,
        role=lambda_role,
        log_retention=logs.RetentionDays.ONE_WEEK,
        tracing=lambda_.Tracing.ACTIVE
    )
    
    # Update Product Lambda
    functions['update'] = lambda_.Function(
        self,
        "UpdateProductFunction",
        function_name=f"ecommerce-update-product-{environment_suffix}",
        runtime=lambda_.Runtime.PYTHON_3_11,
        code=lambda_.Code.from_inline(update_product_code),
        handler="index.handler",
        environment=common_env,
        timeout=Duration.seconds(30),
        memory_size=256,
        role=lambda_role,
        log_retention=logs.RetentionDays.ONE_WEEK,
        tracing=lambda_.Tracing.ACTIVE,
        retry_attempts=2
    )
    
    # Delete Product Lambda
    functions['delete'] = lambda_.Function(
        self,
        "DeleteProductFunction",
        function_name=f"ecommerce-delete-product-{environment_suffix}",
        runtime=lambda_.Runtime.PYTHON_3_11,
        code=lambda_.Code.from_inline(delete_product_code),
        handler="index.handler",
        environment=common_env,
        timeout=Duration.seconds(15),
        memory_size=128,
        role=lambda_role,
        log_retention=logs.RetentionDays.ONE_WEEK,
        tracing=lambda_.Tracing.ACTIVE
    )
    
    # List Products Lambda
    functions['list'] = lambda_.Function(
        self,
        "ListProductsFunction",
        function_name=f"ecommerce-list-products-{environment_suffix}",
        runtime=lambda_.Runtime.PYTHON_3_11,
        code=lambda_.Code.from_inline(list_products_code),
        handler="index.handler",
        environment=common_env,
        timeout=Duration.seconds(15),
        memory_size=256,
        role=lambda_role,
        log_retention=logs.RetentionDays.ONE_WEEK,
        tracing=lambda_.Tracing.ACTIVE
    )
    
    # Grant permissions to Lambda functions
    for func in functions.values():
        table.grant_read_write_data(func)
        bucket.grant_read_write(func)
        topic.grant_publish(func)
    
    return functions

  def create_api_gateway(self, lambda_functions, environment_suffix: str):
    """Create API Gateway with validation and CORS"""
    
    # Create API Gateway
    api = apigateway.RestApi(
        self,
        "EcommerceAPI",
        rest_api_name=f"ecommerce-api-{environment_suffix}",
        description=f"E-commerce Serverless API ({environment_suffix})",
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
    
    # Create request validator
    request_validator = apigateway.RequestValidator(
        self,
        "RequestValidator",
        rest_api=api,
        validate_request_body=True,
        validate_request_parameters=True
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
            proxy=True
        )
    )
    
    # POST /products - Create product
    products.add_method(
        "POST",
        apigateway.LambdaIntegration(
            lambda_functions['create'],
            proxy=True
        ),
        request_models={
            "application/json": product_model
        },
        request_validator=request_validator
    )
    
    # GET /products/{product_id} - Get single product
    product.add_method(
        "GET",
        apigateway.LambdaIntegration(
            lambda_functions['read'],
            proxy=True
        ),
        request_parameters={
            'method.request.path.product_id': True
        }
    )
    
    # PUT /products/{product_id} - Update product
    product.add_method(
        "PUT",
        apigateway.LambdaIntegration(
            lambda_functions['update'],
            proxy=True
        ),
        request_models={
            "application/json": product_model
        },
        request_parameters={
            'method.request.path.product_id': True
        },
        request_validator=request_validator
    )
    
    # DELETE /products/{product_id} - Delete product
    product.add_method(
        "DELETE",
        apigateway.LambdaIntegration(
            lambda_functions['delete'],
            proxy=True
        ),
        request_parameters={
            'method.request.path.product_id': True
        }
    )
    
    return api

  def create_cloudfront_distribution(self, api, environment_suffix: str):
    """Create CloudFront distribution for API caching"""
    
    # Create CloudFront distribution
    distribution = cloudfront.Distribution(
        self,
        "EcommerceDistribution",
        default_behavior=cloudfront.BehaviorOptions(
            origin=origins.RestApiOrigin(api),
            viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
            allowed_methods=cloudfront.AllowedMethods.ALLOW_ALL,
            cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD_OPTIONS,
            compress=True
        ),
        comment=f"E-commerce API CloudFront Distribution ({environment_suffix})",
        enabled=True,
        price_class=cloudfront.PriceClass.PRICE_CLASS_100,
        geo_restriction=cloudfront.GeoRestriction.allowlist("US", "CA", "GB", "DE")
    )
    
    return distribution

  def create_outputs(self, api, distribution, bucket, table):
    """Create CloudFormation outputs"""
    
    CfnOutput(
        self,
        "ApiEndpoint",
        value=api.url,
        description="API Gateway endpoint URL"
    )
    
    CfnOutput(
        self,
        "CloudFrontUrl",
        value=f"https://{distribution.distribution_domain_name}",
        description="CloudFront distribution URL"
    )
    
    CfnOutput(
        self,
        "S3BucketName",
        value=bucket.bucket_name,
        description="S3 bucket for product images"
    )
    
    CfnOutput(
        self,
        "DynamoDBTableName",
        value=table.table_name,
        description="DynamoDB table for products"
    )
    
    CfnOutput(
        self,
        "Environment",
        value=self.environment_suffix,
        description="Environment suffix"
    )


```