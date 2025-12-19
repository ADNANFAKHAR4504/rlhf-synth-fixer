``````python
"""
infrastructure/vpc_stack.py
"""
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    CfnOutput,
    Tags
)
from constructs import Construct

class VpcStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Create VPC with public and private subnets across 2 AZs
        self.vpc = ec2.Vpc(
            self, "ServerlessVPC",
            vpc_name="serverless-vpc",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )
        
        # Security group for Lambda functions
        self.lambda_security_group = ec2.SecurityGroup(
            self, "LambdaSecurityGroup",
            vpc=self.vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True
        )
        
        # VPC Endpoints for AWS services (cost optimization and security)
        self.vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        )
        
        self.vpc.add_gateway_endpoint(
            "DynamoDBEndpoint",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)]
        )
        
        # Add tags
        Tags.of(self.vpc).add("Environment", "production")
        Tags.of(self.vpc).add("Project", "serverless-infrastructure")
        
        # Outputs
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID"
        )
        
        CfnOutput(
            self, "PrivateSubnetIds",
            value=",".join([subnet.subnet_id for subnet in self.vpc.private_subnets]),
            description="Private Subnet IDs"
        )

"""
infrastructure/database_stack.py
"""
from aws_cdk import (
    Stack,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_ssm as ssm,
    RemovalPolicy,
    CfnOutput,
    Duration,
    Tags
)
from constructs import Construct

class DatabaseStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = vpc
        
        # DynamoDB Table for data storage
        self.dynamodb_table = dynamodb.Table(
            self, "DataProcessingTable",
            table_name="serverless-data-processing",
            partition_key=dynamodb.Attribute(
                name="pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="sk",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.ON_DEMAND,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            point_in_time_recovery=True,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )
        
        # Global Secondary Index for querying by status
        self.dynamodb_table.add_global_secondary_index(
            index_name="StatusIndex",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            )
        )
        
        # S3 Bucket for log storage and data archival
        self.s3_bucket = s3.Bucket(
            self, "LogStorageBucket",
            bucket_name=f"serverless-logs-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="LogRetentionRule",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ],
                    expiration=Duration.days(365)
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )
        
        # Parameter Store for configuration
        self.api_config_parameter = ssm.StringParameter(
            self, "ApiConfigParameter",
            parameter_name="/serverless/config/api-settings",
            string_value='{"timeout": 30, "retry_attempts": 3, "log_level": "INFO"}',
            description="API configuration settings",
            tier=ssm.ParameterTier.STANDARD
        )
        
        # Store sensitive configuration
        self.db_config_parameter = ssm.StringParameter(
            self, "DatabaseConfigParameter",
            parameter_name="/serverless/config/database",
            string_value=f'{{"table_name": "{self.dynamodb_table.table_name}", "region": "{self.region}"}}',
            description="Database configuration",
            tier=ssm.ParameterTier.STANDARD
        )
        
        # Add tags
        Tags.of(self.dynamodb_table).add("Environment", "production")
        Tags.of(self.s3_bucket).add("Environment", "production")
        Tags.of(self.dynamodb_table).add("Project", "serverless-infrastructure")
        Tags.of(self.s3_bucket).add("Project", "serverless-infrastructure")
        
        # Outputs
        CfnOutput(
            self, "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB Table Name"
        )
        
        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 Bucket Name"
        )
        
        CfnOutput(
            self, "DynamoDBTableArn",
            value=self.dynamodb_table.table_arn,
            description="DynamoDB Table ARN"
        )

"""
lambda/handler.py
"""
import json
import boto3
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import time
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
ssm_client = boto3.client('ssm')
cloudwatch = boto3.client('cloudwatch')

# Environment variables
TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')
S3_BUCKET = os.environ.get('S3_BUCKET_NAME')
PARAMETER_NAME = os.environ.get('CONFIG_PARAMETER_NAME', '/serverless/config/api-settings')

# Initialize DynamoDB table
table = dynamodb.Table(TABLE_NAME) if TABLE_NAME else None

def get_configuration() -> Dict[str, Any]:
    """Retrieve configuration from Parameter Store with caching."""
    try:
        response = ssm_client.get_parameter(
            Name=PARAMETER_NAME,
            WithDecryption=True
        )
        return json.loads(response['Parameter']['Value'])
    except Exception as e:
        logger.error(f"Failed to retrieve configuration: {str(e)}")
        # Return default configuration
        return {
            "timeout": 30,
            "retry_attempts": 3,
            "log_level": "INFO"
        }

def log_to_s3(log_data: Dict[str, Any]) -> None:
    """Log operation data to S3 for long-term storage."""
    try:
        timestamp = datetime.now(timezone.utc).isoformat()
        key = f"logs/{datetime.now(timezone.utc).strftime('%Y/%m/%d')}/{uuid.uuid4()}.json"
        
        log_entry = {
            "timestamp": timestamp,
            "data": log_data
        }
        
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=key,
            Body=json.dumps(log_entry),
            ContentType='application/json'
        )
        logger.info(f"Logged to S3: {key}")
    except Exception as e:
        logger.error(f"Failed to log to S3: {str(e)}")

def put_custom_metric(metric_name: str, value: float, unit: str = 'Count') -> None:
    """Put custom metric to CloudWatch."""
    try:
        cloudwatch.put_metric_data(
            Namespace='ServerlessApp',
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.now(timezone.utc)
                }
            ]
        )
    except Exception as e:
        logger.error(f"Failed to put metric {metric_name}: {str(e)}")

def retry_operation(operation, max_retries: int = 3, backoff_factor: float = 1.0):
    """Retry decorator for DynamoDB operations."""
    for attempt in range(max_retries):
        try:
            return operation()
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code in ['ProvisionedThroughputExceededException', 'ThrottlingException']:
                if attempt < max_retries - 1:
                    wait_time = backoff_factor * (2 ** attempt)
                    logger.warning(f"Retrying operation after {wait_time}s due to {error_code}")
                    time.sleep(wait_time)
                    continue
            raise e
        except Exception as e:
            if attempt < max_retries - 1:
                wait_time = backoff_factor * (2 ** attempt)
                logger.warning(f"Retrying operation after {wait_time}s due to {str(e)}")
                time.sleep(wait_time)
                continue
            raise e
    
def create_item(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new item in DynamoDB."""
    item_id = str(uuid.uuid4())
    timestamp = datetime.now(timezone.utc).isoformat()
    
    item = {
        'pk': f"ITEM#{item_id}",
        'sk': f"METADATA#{timestamp}",
        'id': item_id,
        'created_at': timestamp,
        'updated_at': timestamp,
        'status': 'active',
        'data': data
    }
    
    def _put_item():
        return table.put_item(Item=item)
    
    retry_operation(_put_item)
    
    # Log operation
    log_to_s3({
        'operation': 'CREATE',
        'item_id': item_id,
        'status': 'success'
    })
    
    # Custom metric
    put_custom_metric('ItemsCreated', 1)
    
    return item

def get_item(item_id: str) -> Optional[Dict[str, Any]]:
    """Retrieve an item from DynamoDB."""
    def _get_item():
        response = table.query(
            KeyConditionExpression='pk = :pk',
            ExpressionAttributeValues={':pk': f"ITEM#{item_id}"},
            ScanIndexForward=False,
            Limit=1
        )
        return response
    
    response = retry_operation(_get_item)
    
    if response['Items']:
        item = response['Items'][0]
        # Log operation
        log_to_s3({
            'operation': 'READ',
            'item_id': item_id,
            'status': 'success'
        })
        put_custom_metric('ItemsRetrieved', 1)
        return item
    
    return None

def update_item(item_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Update an existing item in DynamoDB."""
    # First, get the current item to find the sort key
    existing_item = get_item(item_id)
    if not existing_item:
        raise ValueError(f"Item {item_id} not found")
    
    timestamp = datetime.now(timezone.utc).isoformat()
    
    def _update_item():
        return table.update_item(
            Key={
                'pk': existing_item['pk'],
                'sk': existing_item['sk']
            },
            UpdateExpression='SET #data = :data, updated_at = :updated_at',
            ExpressionAttributeNames={'#data': 'data'},
            ExpressionAttributeValues={
                ':data': data,
                ':updated_at': timestamp
            },
            ReturnValues='ALL_NEW'
        )
    
    response = retry_operation(_update_item)
    updated_item = response['Attributes']
    
    # Log operation
    log_to_s3({
        'operation': 'UPDATE',
        'item_id': item_id,
        'status': 'success'
    })
    
    put_custom_metric('ItemsUpdated', 1)
    
    return updated_item

def delete_item(item_id: str) -> bool:
    """Delete an item from DynamoDB."""
    existing_item = get_item(item_id)
    if not existing_item:
        return False
    
    def _delete_item():
        return table.delete_item(
            Key={
                'pk': existing_item['pk'],
                'sk': existing_item['sk']
            }
        )
    
    retry_operation(_delete_item)
    
    # Log operation
    log_to_s3({
        'operation': 'DELETE',
        'item_id': item_id,
        'status': 'success'
    })
    
    put_custom_metric('ItemsDeleted', 1)
    
    return True

def list_items(limit: int = 10, status: str = None) -> Dict[str, Any]:
    """List items with optional filtering."""
    if status:
        # Use GSI to filter by status
        def _query_by_status():
            return table.query(
                IndexName='StatusIndex',
                KeyConditionExpression='#status = :status',
                ExpressionAttributeNames={'#status': 'status'},
                ExpressionAttributeValues={':status': status},
                Limit=limit,
                ScanIndexForward=False
            )
        response = retry_operation(_query_by_status)
    else:
        # Scan all items
        def _scan_items():
            return table.scan(
                FilterExpression='begins_with(pk, :prefix)',
                ExpressionAttributeValues={':prefix': 'ITEM#'},
                Limit=limit
            )
        response = retry_operation(_scan_items)
    
    items = response.get('Items', [])
    
    # Log operation
    log_to_s3({
        'operation': 'LIST',
        'count': len(items),
        'status': 'success'
    })
    
    put_custom_metric('ItemsListed', len(items))
    
    return {
        'items': items,
        'count': len(items),
        'last_evaluated_key': response.get('LastEvaluatedKey')
    }

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """Main Lambda handler function."""
    start_time = time.time()
    
    try:
        # Get configuration
        config = get_configuration()
        logger.setLevel(getattr(logging, config.get('log_level', 'INFO')))
        
        logger.info(f"Processing request: {json.dumps(event)}")
        
        # Extract HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        
        # Parse request body
        body = {}
        if event.get('body'):
            try:
                body = json.loads(event['body'])
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON in request body")
        
        # Route requests
        if path == '/items' and http_method == 'POST':
            # Create item
            if not body:
                raise ValueError("Request body is required for creating items")
            result = create_item(body)
            status_code = 201
            
        elif path == '/items' and http_method == 'GET':
            # List items
            limit = int(query_parameters.get('limit', 10))
            status = query_parameters.get('status')
            result = list_items(limit=limit, status=status)
            status_code = 200
            
        elif path.startswith('/items/') and http_method == 'GET':
            # Get specific item
            item_id = path.split('/')[-1]
            result = get_item(item_id)
            if result is None:
                status_code = 404
                result = {'error': 'Item not found'}
            else:
                status_code = 200
                
        elif path.startswith('/items/') and http_method == 'PUT':
            # Update item
            item_id = path.split('/')[-1]
            if not body:
                raise ValueError("Request body is required for updating items")
            result = update_item(item_id, body)
            status_code = 200
            
        elif path.startswith('/items/') and http_method == 'DELETE':
            # Delete item
            item_id = path.split('/')[-1]
            success = delete_item(item_id)
            if success:
                result = {'message': 'Item deleted successfully'}
                status_code = 200
            else:
                result = {'error': 'Item not found'}
                status_code = 404
                
        else:
            # Method not allowed or path not found
            result = {'error': f'Method {http_method} not allowed for path {path}'}
            status_code = 405
        
        # Calculate processing time
        processing_time = (time.time() - start_time) * 1000  # Convert to milliseconds
        put_custom_metric('ProcessingTime', processing_time, 'Milliseconds')
        put_custom_metric('SuccessfulRequests', 1)
        
        response = {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps(result)
        }
        
        logger.info(f"Request processed successfully in {processing_time:.2f}ms")
        return response
        
    except Exception as e:
        # Calculate processing time for failed requests too
        processing_time = (time.time() - start_time) * 1000
        
        logger.error(f"Error processing request: {str(e)}")
        put_custom_metric('FailedRequests', 1)
        put_custom_metric('ProcessingTime', processing_time, 'Milliseconds')
        
        # Log error to S3
        log_to_s3({
            'operation': 'ERROR',
            'error': str(e),
            'event': event,
            'status': 'failed'
        })
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

"""
infrastructure/serverless_stack.py
"""
from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_logs as logs,
    Duration,
    CfnOutput,
    Tags
)
from constructs import Construct

class ServerlessStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, vpc, dynamodb_table, s3_bucket, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.vpc = vpc
        self.dynamodb_table = dynamodb_table
        self.s3_bucket = s3_bucket
        
        # IAM role for Lambda function
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        )
        
        # Add permissions for DynamoDB
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan"
                ],
                resources=[
                    self.dynamodb_table.table_arn,
                    f"{self.dynamodb_table.table_arn}/index/*"
                ]
            )
        )
        
        # Add permissions for S3
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                resources=[f"{self.s3_bucket.bucket_arn}/*"]
            )
        )
        
        # Add permissions for Parameter Store
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ssm:GetParameter",
                    "ssm:GetParameters"
                ],
                resources=[f"arn:aws:ssm:{self.region}:{self.account}:parameter/serverless/*"]
            )
        )
        
        # Add permissions for CloudWatch metrics
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudwatch:PutMetricData"
                ],
                resources=["*"]
            )
        )
        
        # Lambda function
        self.lambda_function = _lambda.Function(
            self, "DataProcessingFunction",
            function_name="serverless-data-processor",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("lambda"),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "S3_BUCKET_NAME": self.s3_bucket.bucket_name,
                "CONFIG_PARAMETER_NAME": "/serverless/config/api-settings",
                "AWS_NODEJS_CONNECTION_REUSE_ENABLED": "1"
            },
            vpc=self.vpc,
            vpc_subnets={"subnet_type": ec2.SubnetType.PRIVATE_WITH_EGRESS},
            