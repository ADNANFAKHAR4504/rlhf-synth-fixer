# lib/components/backend.py

import pulumi
import pulumi_aws as aws
import json

class BackendInfrastructure(pulumi.ComponentResource):
  def __init__(self, name: str, vpc_id: pulumi.Output, private_subnet_ids: list,
               vpc_endpoint_sg_id: pulumi.Output, sns_topic_arn: pulumi.Output,
               tags: dict, opts=None):
    super().__init__("custom:backend:Infrastructure", name, None, opts)

    self.table = aws.dynamodb.Table(
      f"{name}-table",
      name=f"{name}-app-data",
      billing_mode="PAY_PER_REQUEST",
      hash_key="id",
      attributes=[
        aws.dynamodb.TableAttributeArgs(
          name="id",
          type="S"
        )
      ],
      tags=tags,
      opts=pulumi.ResourceOptions(parent=self, retain_on_delete=False)
    )

    self.lambda_role = aws.iam.Role(
      f"{name}-lambda-role",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
              "Service": "lambda.amazonaws.com"
            }
          }
        ]
      }),
      tags=tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    aws.iam.RolePolicyAttachment(
      f"{name}-lambda-vpc-policy",
      role=self.lambda_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
      opts=pulumi.ResourceOptions(parent=self)
    )

    lambda_policy = pulumi.Output.all(
      self.table.arn,
      sns_topic_arn
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "dynamodb:PutItem",
            "dynamodb:GetItem",
            "dynamodb:UpdateItem",
            "dynamodb:DeleteItem",
            "dynamodb:Query",
            "dynamodb:Scan"
          ],
          "Resource": args[0]
        },
        {
          "Effect": "Allow",
          "Action": "sns:Publish",
          "Resource": args[1]
        },
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          "Resource": "*"
        }
      ]
    }))

    aws.iam.RolePolicy(
      f"{name}-lambda-policy",
      role=self.lambda_role.id,
      policy=lambda_policy,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Enhanced Lambda function with better functionality
    lambda_code = self._get_lambda_code()

    self.lambda_function = aws.lambda_.Function(
      f"{name}-function",
      name=f"{name}-function",
      runtime="python3.9",
      code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset(lambda_code)
      }),
      handler="index.lambda_handler",
      role=self.lambda_role.arn,
      timeout=30,
      memory_size=256,
      vpc_config=aws.lambda_.FunctionVpcConfigArgs(
        subnet_ids=private_subnet_ids,
        security_group_ids=[vpc_endpoint_sg_id]
      ),
      environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
          "TABLE_NAME": self.table.name,
          "SNS_TOPIC_ARN": sns_topic_arn
        }
      ),
      tags=tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # API Gateway REST API
    self.api_gateway = aws.apigateway.RestApi(
      f"{name}-api",
      name=f"{name}-api",
      description="Multi-tier web application API",
      endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
        types="REGIONAL"
      ),
      tags=tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # API Gateway resource for /items
    self.api_resource = aws.apigateway.Resource(
      f"{name}-api-resource",
      rest_api=self.api_gateway.id,
      parent_id=self.api_gateway.root_resource_id,
      path_part="items",
      opts=pulumi.ResourceOptions(parent=self)
    )

    # API Gateway resource for /items/{id}
    self.api_resource_id = aws.apigateway.Resource(
      f"{name}-api-resource-id",
      rest_api=self.api_gateway.id,
      parent_id=self.api_resource.id,
      path_part="{id}",
      opts=pulumi.ResourceOptions(parent=self)
    )

    # GET method for /items
    self.get_method = aws.apigateway.Method(
      f"{name}-get-method",
      rest_api=self.api_gateway.id,
      resource_id=self.api_resource.id,
      http_method="GET",
      authorization="NONE",
      opts=pulumi.ResourceOptions(parent=self)
    )

    # POST method for /items
    self.post_method = aws.apigateway.Method(
      f"{name}-post-method",
      rest_api=self.api_gateway.id,
      resource_id=self.api_resource.id,
      http_method="POST",
      authorization="NONE",
      opts=pulumi.ResourceOptions(parent=self)
    )

    # GET method for /items/{id}
    self.get_item_method = aws.apigateway.Method(
      f"{name}-get-item-method",
      rest_api=self.api_gateway.id,
      resource_id=self.api_resource_id.id,
      http_method="GET",
      authorization="NONE",
      request_parameters={
        "method.request.path.id": True
      },
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Lambda integrations
    self._create_lambda_integrations(name)

    # API Gateway deployment (without stage_name for pulumi-aws >= 7.0)
    self.api_deployment = aws.apigateway.Deployment(
      f"{name}-api-deployment",
      rest_api=self.api_gateway.id,
      opts=pulumi.ResourceOptions(
        parent=self,
        depends_on=[
          self.get_method,
          self.post_method,
          self.get_item_method,
          self.get_integration,
          self.post_integration,
          self.get_item_integration
        ]
      )
    )

    # API Gateway Stage (separate resource in pulumi-aws >= 7.0)
    self.api_stage = aws.apigateway.Stage(
      f"{name}-api-stage",
      rest_api=self.api_gateway.id,
      deployment=self.api_deployment.id,
      stage_name="v1",
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Lambda permission for API Gateway
    aws.lambda_.Permission(
      f"{name}-api-lambda-permission",
      action="lambda:InvokeFunction",
      function=self.lambda_function.name,
      principal="apigateway.amazonaws.com",
      source_arn=pulumi.Output.concat(
        self.api_gateway.execution_arn,
        "/*/*"
      ),
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.register_outputs({
      "table_name": self.table.name,
      "lambda_function_name": self.lambda_function.name,
      "api_gateway_url": pulumi.Output.concat(
        "https://",
        self.api_gateway.id,
        ".execute-api.",
        aws.get_region().name,
        ".amazonaws.com/v1"
      ),
      "api_gateway_id": self.api_gateway.id
    })

  def _create_lambda_integrations(self, name: str):
    """Create API Gateway Lambda integrations"""
    
    # GET /items integration
    self.get_integration = aws.apigateway.Integration(
      f"{name}-get-integration",
      rest_api=self.api_gateway.id,
      resource_id=self.api_resource.id,
      http_method=self.get_method.http_method,
      integration_http_method="POST",
      type="AWS_PROXY",
      uri=self.lambda_function.invoke_arn,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # POST /items integration
    self.post_integration = aws.apigateway.Integration(
      f"{name}-post-integration",
      rest_api=self.api_gateway.id,
      resource_id=self.api_resource.id,
      http_method=self.post_method.http_method,
      integration_http_method="POST",
      type="AWS_PROXY",
      uri=self.lambda_function.invoke_arn,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # GET /items/{id} integration
    self.get_item_integration = aws.apigateway.Integration(
      f"{name}-get-item-integration",
      rest_api=self.api_gateway.id,
      resource_id=self.api_resource_id.id,
      http_method=self.get_item_method.http_method,
      integration_http_method="POST",
      type="AWS_PROXY",
      uri=self.lambda_function.invoke_arn,
      opts=pulumi.ResourceOptions(parent=self)
    )

  def _get_lambda_code(self):
    """Returns enhanced Lambda function code for API operations"""
    return """
import json
import boto3
import os
import uuid
from datetime import datetime

# LocalStack endpoint configuration
endpoint_url = os.environ.get('AWS_ENDPOINT_URL')
config_kwargs = {}
if endpoint_url:
  config_kwargs['endpoint_url'] = endpoint_url

dynamodb = boto3.resource('dynamodb', **config_kwargs)
sns = boto3.client('sns', **config_kwargs)

table_name = os.environ.get('TABLE_NAME')
sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')
table = dynamodb.Table(table_name)

def lambda_handler(event, context):
  print(f"Received event: {json.dumps(event)}")
  
  try:
    http_method = event['httpMethod']
    path = event['path']
    
    if http_method == 'GET' and path == '/items':
      return get_all_items()
    elif http_method == 'POST' and path == '/items':
      return create_item(event)
    elif http_method == 'GET' and '/items/' in path:
      item_id = event['pathParameters']['id']
      return get_item(item_id)
    else:
      return {
        'statusCode': 404,
        'headers': {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'message': 'Endpoint not found'})
      }
      
  except Exception as e:
    print(f"Error: {str(e)}")
    # Send error notification
    try:
      sns.publish(
        TopicArn=sns_topic_arn,
        Message=f"Lambda function error: {str(e)}",
        Subject="Backend API Error"
      )
    except:
      pass
      
    return {
      'statusCode': 500,
      'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      'body': json.dumps({'message': 'Internal server error'})
    }

def get_all_items():
  try:
    response = table.scan()
    items = response.get('Items', [])
    
    return {
      'statusCode': 200,
      'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      'body': json.dumps({
        'items': items,
        'count': len(items)
      })
    }
  except Exception as e:
    print(f"Error getting items: {str(e)}")
    raise

def create_item(event):
  try:
    body = json.loads(event['body'])
    item_id = str(uuid.uuid4())
    
    item = {
      'id': item_id,
      'name': body.get('name', ''),
      'description': body.get('description', ''),
      'created_at': str(datetime.now()),
      'updated_at': str(datetime.now())
    }
    
    table.put_item(Item=item)
    
    return {
      'statusCode': 201,
      'headers': {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      'body': json.dumps(item)
    }
  except Exception as e:
    print(f"Error creating item: {str(e)}")
    raise

def get_item(item_id):
  try:
    response = table.get_item(Key={'id': item_id})
    
    if 'Item' in response:
      return {
        'statusCode': 200,
        'headers': {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(response['Item'])
      }
    else:
      return {
        'statusCode': 404,
        'headers': {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'message': 'Item not found'})
      }
  except Exception as e:
    print(f"Error getting item: {str(e)}")
    raise
"""

