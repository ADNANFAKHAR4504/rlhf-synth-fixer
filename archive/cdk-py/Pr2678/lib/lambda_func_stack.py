"""lambda_func_stack.py
This module defines the LambdaFuncStack class for the TAP project's Lambda functions.
It creates Lambda functions with their associated IAM roles and configurations.
This stack depends on resources from TapStack.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Duration,
    CfnOutput,
    RemovalPolicy,
    Tags,
    aws_lambda as _lambda,
    aws_iam as iam,
    aws_logs as logs,
    aws_ec2 as ec2,
    Fn,
)
from constructs import Construct


class LambdaFuncStackProps(cdk.StackProps):
    """
    Properties for the LambdaFuncStack.
    
    Args:
        environment_suffix (Optional[str]): Environment suffix for resource naming
    """
    
    def __init__(
        self, 
        environment_suffix: Optional[str] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class LambdaFuncStack(cdk.Stack):
    """
    Stack for Lambda functions and related resources.
    
    This stack creates Lambda functions with appropriate IAM roles,
    environment variables, and VPC configurations. It imports necessary
    resources from TapStack using CloudFormation exports.
    """
    
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[LambdaFuncStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)
        
        # Get properties
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'
        
        # ============================================
        # Import Resources from TapStack using Exports
        # ============================================
        
        # Import VPC
        vpc_id = Fn.import_value(f"VPCId-{environment_suffix}")
        vpc = ec2.Vpc.from_vpc_attributes(
            self, f"ImportedVPC{environment_suffix}",
            vpc_id=vpc_id,
            availability_zones=Fn.split(",", Fn.import_value(f"VPCAvailabilityZones-{environment_suffix}")),
            private_subnet_ids=Fn.split(",", Fn.import_value(f"VPCPrivateSubnetIds-{environment_suffix}")),
        )
        
        # Import Security Group
        lambda_security_group_id = Fn.import_value(f"LambdaSecurityGroupId-{environment_suffix}")
        lambda_security_group = ec2.SecurityGroup.from_security_group_id(
            self, f"ImportedLambdaSG{environment_suffix}",
            lambda_security_group_id
        )
        
        # Import DynamoDB Table
        dynamodb_table_name = Fn.import_value(f"DynamoDBTableName-{environment_suffix}")
        dynamodb_table_arn = Fn.import_value(f"DynamoDBTableArn-{environment_suffix}")
        
        # Import S3 Bucket
        s3_bucket_name = Fn.import_value(f"S3BucketName-{environment_suffix}")
        s3_bucket_arn = Fn.import_value(f"S3BucketArn-{environment_suffix}")
        
        # ============================================
        # IAM Role for Lambda
        # ============================================
        lambda_role = iam.Role(
            self, f"LambdaExecutionRole{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        )
        
        # DynamoDB permissions
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
                    dynamodb_table_arn,
                    f"{dynamodb_table_arn}/index/*"
                ]
            )
        )
        
        # S3 permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject"
                ],
                resources=[f"{s3_bucket_arn}/*"]
            )
        )
        
        # SSM permissions
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
        
        # CloudWatch metrics permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["cloudwatch:PutMetricData"],
                resources=["*"]
            )
        )
        
        # ============================================
        # Lambda Function Code (Embedded)
        # ============================================
        lambda_code = '''import json
import boto3
import logging
import os
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import time
from botocore.exceptions import ClientError

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
ssm_client = boto3.client('ssm')
cloudwatch = boto3.client('cloudwatch')

TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')
S3_BUCKET = os.environ.get('S3_BUCKET_NAME')
PARAMETER_NAME = os.environ.get('CONFIG_PARAMETER_NAME', '/serverless/config/api-settings')
table = dynamodb.Table(TABLE_NAME) if TABLE_NAME else None

def get_configuration() -> Dict[str, Any]:
    try:
        response = ssm_client.get_parameter(Name=PARAMETER_NAME, WithDecryption=True)
        return json.loads(response['Parameter']['Value'])
    except Exception as e:
        logger.error(f"Failed to retrieve configuration: {str(e)}")
        return {"timeout": 30, "retry_attempts": 3, "log_level": "INFO"}

def log_to_s3(log_data: Dict[str, Any]) -> None:
    try:
        timestamp = datetime.now(timezone.utc).isoformat()
        key = f"logs/{datetime.now(timezone.utc).strftime('%Y/%m/%d')}/{uuid.uuid4()}.json"
        s3_client.put_object(
            Bucket=S3_BUCKET, 
            Key=key, 
            Body=json.dumps({"timestamp": timestamp, "data": log_data}), 
            ContentType='application/json'
        )
        logger.info(f"Logged to S3: {key}")
    except Exception as e:
        logger.error(f"Failed to log to S3: {str(e)}")

def put_custom_metric(metric_name: str, value: float, unit: str = 'Count') -> None:
    try:
        cloudwatch.put_metric_data(
            Namespace='ServerlessApp',
            MetricData=[{
                'MetricName': metric_name, 
                'Value': value, 
                'Unit': unit, 
                'Timestamp': datetime.now(timezone.utc)
            }]
        )
    except Exception as e:
        logger.error(f"Failed to put metric {metric_name}: {str(e)}")

def retry_operation(operation, max_retries: int = 3, backoff_factor: float = 1.0):
    for attempt in range(max_retries):
        try:
            return operation()
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code in ['ProvisionedThroughputExceededException', 'ThrottlingException']:
                if attempt < max_retries - 1:
                    wait_time = backoff_factor * (2 ** attempt)
                    time.sleep(wait_time)
                    continue
            raise e

def create_item(data: Dict[str, Any]) -> Dict[str, Any]:
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
    retry_operation(lambda: table.put_item(Item=item))
    log_to_s3({'operation': 'CREATE', 'item_id': item_id, 'status': 'success'})
    put_custom_metric('ItemsCreated', 1)
    return item

def get_item(item_id: str) -> Optional[Dict[str, Any]]:
    response = retry_operation(lambda: table.query(
        KeyConditionExpression='pk = :pk',
        ExpressionAttributeValues={':pk': f"ITEM#{item_id}"},
        ScanIndexForward=False,
        Limit=1
    ))
    if response['Items']:
        item = response['Items'][0]
        log_to_s3({'operation': 'READ', 'item_id': item_id, 'status': 'success'})
        put_custom_metric('ItemsRetrieved', 1)
        return item
    return None

def update_item(item_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    existing_item = get_item(item_id)
    if not existing_item:
        raise ValueError(f"Item {item_id} not found")
    timestamp = datetime.now(timezone.utc).isoformat()
    response = retry_operation(lambda: table.update_item(
        Key={'pk': existing_item['pk'], 'sk': existing_item['sk']},
        UpdateExpression='SET #data = :data, updated_at = :updated_at',
        ExpressionAttributeNames={'#data': 'data'},
        ExpressionAttributeValues={':data': data, ':updated_at': timestamp},
        ReturnValues='ALL_NEW'
    ))
    log_to_s3({'operation': 'UPDATE', 'item_id': item_id, 'status': 'success'})
    put_custom_metric('ItemsUpdated', 1)
    return response['Attributes']

def delete_item(item_id: str) -> bool:
    existing_item = get_item(item_id)
    if not existing_item:
        return False
    retry_operation(lambda: table.delete_item(
        Key={'pk': existing_item['pk'], 'sk': existing_item['sk']}
    ))
    log_to_s3({'operation': 'DELETE', 'item_id': item_id, 'status': 'success'})
    put_custom_metric('ItemsDeleted', 1)
    return True

def list_items(limit: int = 10, status: str = None) -> Dict[str, Any]:
    if status:
        response = retry_operation(lambda: table.query(
            IndexName='StatusIndex',
            KeyConditionExpression='#status = :status',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={':status': status},
            Limit=limit,
            ScanIndexForward=False
        ))
    else:
        response = retry_operation(lambda: table.scan(
            FilterExpression='begins_with(pk, :prefix)',
            ExpressionAttributeValues={':prefix': 'ITEM#'},
            Limit=limit
        ))
    items = response.get('Items', [])
    log_to_s3({'operation': 'LIST', 'count': len(items), 'status': 'success'})
    put_custom_metric('ItemsListed', len(items))
    return {
        'items': items, 
        'count': len(items), 
        'last_evaluated_key': response.get('LastEvaluatedKey')
    }

def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    start_time = time.time()
    try:
        config = get_configuration()
        logger.setLevel(getattr(logging, config.get('log_level', 'INFO')))
        logger.info(f"Processing request: {json.dumps(event)}")
        
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        query_parameters = event.get('queryStringParameters') or {}
        body = {}
        
        if event.get('body'):
            try:
                body = json.loads(event['body'])
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON in request body")
        
        # Route handling
        if path == '/items' and http_method == 'POST':
            if not body:
                raise ValueError("Request body is required")
            result = create_item(body)
            status_code = 201
        elif path == '/items' and http_method == 'GET':
            limit = int(query_parameters.get('limit', 10))
            status = query_parameters.get('status')
            result = list_items(limit=limit, status=status)
            status_code = 200
        elif path.startswith('/items/') and http_method == 'GET':
            item_id = path.split('/')[-1]
            result = get_item(item_id)
            status_code = 404 if result is None else 200
            if result is None:
                result = {'error': 'Item not found'}
        elif path.startswith('/items/') and http_method == 'PUT':
            item_id = path.split('/')[-1]
            if not body:
                raise ValueError("Request body is required")
            result = update_item(item_id, body)
            status_code = 200
        elif path.startswith('/items/') and http_method == 'DELETE':
            item_id = path.split('/')[-1]
            success = delete_item(item_id)
            result = {'message': 'Item deleted successfully'} if success else {'error': 'Item not found'}
            status_code = 200 if success else 404
        else:
            result = {'error': f'Method {http_method} not allowed for path {path}'}
            status_code = 405
        
        processing_time = (time.time() - start_time) * 1000
        put_custom_metric('ProcessingTime', processing_time, 'Milliseconds')
        put_custom_metric('SuccessfulRequests', 1)
        
        return {
            'statusCode': status_code,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
                'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
            },
            'body': json.dumps(result)
        }
    except Exception as e:
        processing_time = (time.time() - start_time) * 1000
        logger.error(f"Error processing request: {str(e)}")
        put_custom_metric('FailedRequests', 1)
        put_custom_metric('ProcessingTime', processing_time, 'Milliseconds')
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
        }'''
        
        # ============================================
        # Lambda Function
        # ============================================
        self.lambda_function = _lambda.Function(
            self, f"DataProcessingFunction{environment_suffix}",
            function_name=f"serverless-data-processor-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.lambda_handler",
            code=_lambda.Code.from_inline(lambda_code),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "DYNAMODB_TABLE_NAME": dynamodb_table_name,
                "S3_BUCKET_NAME": s3_bucket_name,
                "CONFIG_PARAMETER_NAME": f"/serverless/config/api-settings-{environment_suffix}",
                "AWS_NODEJS_CONNECTION_REUSE_ENABLED": "1"
            },
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[lambda_security_group],
            # Removed reserved_concurrent_executions to avoid account limit issues
            dead_letter_queue_enabled=True,
            retry_attempts=2
        )
        
        # CloudWatch Log Group - Removed to avoid conflicts
        # Lambda will automatically create its own log group
        
        # Tags
        Tags.of(self.lambda_function).add("Environment", environment_suffix)
        Tags.of(self.lambda_function).add("Project", "TAP")
        
        # Outputs - Export for other stacks to use
        CfnOutput(
            self, "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Lambda Function Name",
            export_name=f"LambdaFunctionName-{environment_suffix}"
        )
        
        CfnOutput(
            self, "LambdaFunctionArn",
            value=self.lambda_function.function_arn,
            description="Lambda Function ARN",
            export_name=f"LambdaFunctionArn-{environment_suffix}"
        )