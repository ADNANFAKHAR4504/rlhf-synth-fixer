# Pulumi Python Infrastructure Code

This file contains the complete Pulumi Python infrastructure code from the lib folder.

## __init__.py

```python
```

## tap_stack.py

```python
# lib/tap_stack.py

from typing import Optional
import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions
from .components.network import NetworkInfrastructure
from .components.frontend import FrontendInfrastructure
from .components.backend import BackendInfrastructure
from .components.data_processing import DataProcessingInfrastructure
from .components.monitoring import MonitoringInfrastructure

"""
This module defines the TapStack class, the main Pulumi ComponentResource for
the Multi-Tiered Web Application project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

class TapStackArgs:
  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags

class TapStack(pulumi.ComponentResource):
  def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
    super().__init__('tap:stack:TapStack', name, None, opts)
    self.environment_suffix = args.environment_suffix
    self.tags = args.tags or {}

    self.network = NetworkInfrastructure(
      name=f"{name}-network",
      environment=self.environment_suffix,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    self.monitoring = MonitoringInfrastructure(
      name=f"{name}-monitoring",
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    self.backend = BackendInfrastructure(
      name=f"{name}-backend",
      vpc_id=self.network.vpc.id,
      private_subnet_ids=self.network.private_subnet_ids,
      vpc_endpoint_sg_id=self.network.vpc_endpoint_security_group.id,
      sns_topic_arn=self.monitoring.sns_topic.arn,
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.network, self.monitoring])
    )

    self.data_processing = DataProcessingInfrastructure(
      name=f"{name}-data",
      vpc_id=self.network.vpc.id,
      private_subnet_ids=self.network.private_subnet_ids,
      vpc_endpoint_sg_id=self.network.vpc_endpoint_security_group.id,
      sns_topic_arn=self.monitoring.sns_topic.arn,
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.network, self.monitoring])
    )

    self.frontend = FrontendInfrastructure(
      name=f"{name}-frontend",
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.backend])
    )

    self.monitoring.setup_alarms(
      lambda_function_names=[
        self.backend.lambda_function.name,
        self.data_processing.kinesis_processor.name
      ],
      kinesis_stream_name=self.data_processing.kinesis_stream.name,
      cloudfront_distribution_id=self.frontend.cloudfront_distribution.id,
      opts=ResourceOptions(parent=self)
    )

    self.register_outputs({
      "vpc_id": self.network.vpc.id,
      "cloudfront_domain": self.frontend.cloudfront_distribution.domain_name,
      "kinesis_stream_name": self.data_processing.kinesis_stream.name,
      "sns_topic_arn": self.monitoring.sns_topic.arn,
    })

    # Export outputs at stack level
    pulumi.export("vpc_id", self.network.vpc.id)
    pulumi.export("cloudfront_domain", self.frontend.cloudfront_distribution.domain_name)  
    pulumi.export("kinesis_stream_name", self.data_processing.kinesis_stream.name)
    pulumi.export("sns_topic_arn", self.monitoring.sns_topic.arn)```

## components/__init__.py

```python
```

## components/backend.py

```python
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
      opts=pulumi.ResourceOptions(parent=self)
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

    # API Gateway deployment
    self.api_deployment = aws.apigateway.Deployment(
      f"{name}-api-deployment",
      rest_api=self.api_gateway.id,
      stage_name="v1",
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

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

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
```

## components/data_processing.py

```python
"""
Data Processing Infrastructure Component
Creates Amazon Kinesis Data Stream, an AWS Lambda consumer, and an S3 bucket for processed data.
"""

#data_processing

import pulumi
import pulumi_aws as aws
import json

class DataProcessingInfrastructure(pulumi.ComponentResource):
  def __init__(self, name: str, vpc_id: pulumi.Output, private_subnet_ids: list,
               vpc_endpoint_sg_id: pulumi.Output, sns_topic_arn: pulumi.Output,
               tags: dict, opts=None):
    super().__init__("custom:data_processing:Infrastructure", name, None, opts)

    self.kinesis_stream = aws.kinesis.Stream(
      f"{name}-stream",
      name=f"{name}-realtime-events",
      shard_count=1, # For demonstration; adjust for production scale
      retention_period=24, # 24 hours
      tags=tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.processed_data_bucket = aws.s3.Bucket(
      f"{name}-processed-data", # Pulumi resource name
      # Let AWS auto-generate a unique bucket name
      acl="private",
      server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
          apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="AES256",
          ),
        ),
      ),
      tags=tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.kinesis_processor_role = aws.iam.Role(
      f"{name}-processor-role",
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
      f"{name}-processor-vpc-policy",
      role=self.kinesis_processor_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
      opts=pulumi.ResourceOptions(parent=self)
    )

    kinesis_processor_policy = pulumi.Output.all(
      self.kinesis_stream.arn,
      self.processed_data_bucket.arn,
      sns_topic_arn
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "kinesis:GetRecords",
            "kinesis:GetShardIterator",
            "kinesis:DescribeStream",
            "kinesis:ListStreams"
          ],
          "Resource": args[0]
        },
        {
          "Effect": "Allow",
          "Action": [
            "s3:PutObject",
            "s3:GetObject" # Added GetObject for potential read-back or validation
          ],
          "Resource": f"{args[1]}/*"
        },
        {
          "Effect": "Allow",
          "Action": [
            "sns:Publish"
          ],
          "Resource": args[2]
        },
        {
          "Effect": "Allow",
          "Action": [
            "logs:CreateLogGroup",
            "logs:CreateLogStream",
            "logs:PutLogEvents"
          ],
          "Resource": "arn:aws:logs:*:*:*"
        }
      ]
    }))

    aws.iam.RolePolicy(
      f"{name}-processor-policy",
      role=self.kinesis_processor_role.id,
      policy=kinesis_processor_policy,
      opts=pulumi.ResourceOptions(parent=self)
    )

    kinesis_processor_code = self._get_kinesis_processor_code()

    self.kinesis_processor = aws.lambda_.Function(
      f"{name}-processor-function",
      name=f"{name}-kinesis-processor",
      runtime="python3.9",
      code=pulumi.AssetArchive({
        "kinesis_processor.py": pulumi.StringAsset(kinesis_processor_code)
      }),
      handler="kinesis_processor.lambda_handler",
      role=self.kinesis_processor_role.arn,
      timeout=60,
      memory_size=256,
      vpc_config=aws.lambda_.FunctionVpcConfigArgs(
        subnet_ids=private_subnet_ids,
        security_group_ids=[vpc_endpoint_sg_id]
      ),
      environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
          "PROCESSED_DATA_BUCKET": self.processed_data_bucket.id,
          "SNS_TOPIC_ARN": sns_topic_arn
        }
      ),
      tags=tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.kinesis_event_source_mapping = aws.lambda_.EventSourceMapping(
      f"{name}-kinesis-esm",
      event_source_arn=self.kinesis_stream.arn,
      function_name=self.kinesis_processor.arn,
      starting_position="LATEST",
      batch_size=100,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.register_outputs({
      "kinesis_stream_name": self.kinesis_stream.name,
      "processed_data_bucket_name": self.processed_data_bucket.id,
      "kinesis_processor_function_name": self.kinesis_processor.name
    })

  def _get_kinesis_processor_code(self):
    """
    Returns the Python code for the Kinesis processing Lambda function.
    """
    return """
import json
import os
import base64
import boto3
from datetime import datetime

s3_client = boto3.client('s3')
sns_client = boto3.client('sns')
processed_data_bucket = os.environ.get('PROCESSED_DATA_BUCKET')
sns_topic_arn = os.environ.get('SNS_TOPIC_ARN')

def lambda_handler(event, context):
  print(f"Received Kinesis event: {json.dumps(event)}")
  records_processed = 0
  
  try:
    for record in event['Records']:
      # Kinesis data is base64 encoded
      payload = base64.b64decode(record['kinesis']['data']).decode('utf-8')
      data = json.loads(payload)
      
      # Add processing timestamp
      data['processed_at'] = str(datetime.now())
      
      # Define S3 key (e.g., year/month/day/hour/lambda_request_id_record_sequence_number.json)
      current_time = datetime.now()
      s3_key = (f"{current_time.year}/{current_time.month:02d}/{current_time.day:02d}/"
                f"{current_time.hour:02d}/{context.aws_request_id}_{record['kinesis']['sequenceNumber']}.json")
      
      s3_client.put_object(
        Bucket=processed_data_bucket,
        Key=s3_key,
        Body=json.dumps(data),
        ContentType='application/json'
      )
      print(f"Successfully processed record and saved to s3://{processed_data_bucket}/{s3_key}")
      records_processed += 1

  except Exception as e:
    print(f"Error processing Kinesis record: {e}")
    # Publish an alert to SNS
    sns_client.publish(
      TopicArn=sns_topic_arn,
      Message=f"Error in Kinesis processor Lambda: {e}",
      Subject="Kinesis Processor Error Alert"
    )
    raise # Re-raise to indicate failure to Kinesis, allowing retries

  return {
    'statusCode': 200,
    'body': json.dumps(f'Successfully processed {records_processed} records.')
  }
"""```

## components/frontend.py

```python
# lib/components/frontend.py

import pulumi
import pulumi_aws as aws
import json

"""
Frontend Infrastructure Component
Creates S3 bucket, CloudFront distribution, and related resources
"""

class FrontendInfrastructure(pulumi.ComponentResource):
  def __init__(self, name: str, tags: dict, opts=None):
    super().__init__("custom:frontend:Infrastructure", name, None, opts)

    # S3 bucket for static website content
    self.bucket = aws.s3.Bucket(
      f"{name}-website",
      website=aws.s3.BucketWebsiteArgs(
        index_document="index.html",
        error_document="error.html"
      ),
      acl="private",
      tags={**tags, "Name": f"{name}-website"},
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Block public access to the S3 bucket
    aws.s3.BucketPublicAccessBlock(
      f"{name}-website-pab",
      bucket=self.bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Origin Access Control for CloudFront to access S3
    self.oac = aws.cloudfront.OriginAccessControl(
      f"{name}-oac",
      name=f"{name}-oac",
      description="OAC for S3 bucket access",
      origin_access_control_origin_type="s3",
      signing_behavior="always",
      signing_protocol="sigv4",
      opts=pulumi.ResourceOptions(parent=self)
    )

    # CloudFront distribution with S3 origin
    self.cloudfront_distribution = aws.cloudfront.Distribution(
      f"{name}-distribution",
      origins=[
        aws.cloudfront.DistributionOriginArgs(
          domain_name=self.bucket.bucket_domain_name,
          origin_id=f"{name}-s3-origin",
          origin_access_control_id=self.oac.id,
        )
      ],
      enabled=True,
      is_ipv6_enabled=True,
      default_root_object="index.html",
      default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
        allowed_methods=["GET", "HEAD", "OPTIONS"],
        cached_methods=["GET", "HEAD"],
        target_origin_id=f"{name}-s3-origin",
        compress=True,
        viewer_protocol_policy="redirect-to-https",
        forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
          query_string=False,
          cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
            forward="none"
          ),
        ),
        min_ttl=0,
        default_ttl=3600,
        max_ttl=86400,
      ),
      custom_error_responses=[
        aws.cloudfront.DistributionCustomErrorResponseArgs(
          error_code=404,
          response_code=200,
          response_page_path="/index.html",
          error_caching_min_ttl=300,
        ),
        aws.cloudfront.DistributionCustomErrorResponseArgs(
          error_code=403,
          response_code=200,
          response_page_path="/index.html",
          error_caching_min_ttl=300,
        )
      ],
      restrictions=aws.cloudfront.DistributionRestrictionsArgs(
        geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
          restriction_type="none",
        ),
      ),
      viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
        cloudfront_default_certificate=True,
      ),
      price_class="PriceClass_100",
      tags={**tags, "Name": f"{name}-distribution"},
      opts=pulumi.ResourceOptions(parent=self)
    )

    # S3 bucket policy to allow CloudFront access
    bucket_policy = pulumi.Output.all(
      self.bucket.arn,
      self.cloudfront_distribution.arn
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Sid": "AllowCloudFrontServicePrincipal",
          "Effect": "Allow",
          "Principal": {
            "Service": "cloudfront.amazonaws.com"
          },
          "Action": "s3:GetObject",
          "Resource": f"{args[0]}/*",
          "Condition": {
            "StringEquals": {
              "AWS:SourceArn": args[1]
            }
          }
        }
      ]
    }))

    aws.s3.BucketPolicy(
      f"{name}-bucket-policy",
      bucket=self.bucket.id,
      policy=bucket_policy,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self._upload_sample_files(name)

    self.register_outputs({
      "bucket_name": self.bucket.id,
      "cloudfront_domain": self.cloudfront_distribution.domain_name,
      "cloudfront_distribution_id": self.cloudfront_distribution.id
    })

  def _upload_sample_files(self, name: str):
    """Upload sample HTML, CSS, and JS files"""

    index_html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Multi-Tier Web Application</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Multi-Tier Web Application</h1>
    <p>This is a sample frontend for the multi-tier web application.</p>
    <div id="api-test">
      <button onclick="testAPI()">Test Backend API</button>
      <div id="api-result"></div>
    </div>
  </div>
  <script src="app.js"></script>
</body>
</html>"""

    aws.s3.BucketObject(
      f"{name}-index-html",
      bucket=self.bucket.id,
      key="index.html",
      content=index_html,
      content_type="text/html",
      opts=pulumi.ResourceOptions(parent=self)
    )

    css_content = """
body {
  font-family: Arial, sans-serif;
  margin: 0;
  padding: 20px;
  background-color: #f5f5f5;
}

.container {
  max-width: 800px;
  margin: 0 auto;
  background-color: white;
  padding: 30px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h1 {
  color: #333;
  text-align: center;
}

button {
  background-color: #007bff;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;
}

button:hover {
  background-color: #0056b3;
}

#api-result {
  margin-top: 20px;
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 4px;
  min-height: 50px;
}
"""

    aws.s3.BucketObject(
      f"{name}-css",
      bucket=self.bucket.id,
      key="styles.css",
      content=css_content,
      content_type="text/css",
      opts=pulumi.ResourceOptions(parent=self)
    )

    js_content = """
async function testAPI() {
  const resultDiv = document.getElementById('api-result');
  resultDiv.innerHTML = 'Testing API...';

  try {
    // Placeholder for API testing
    const response = await fetch('/api/test', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      resultDiv.innerHTML = `<strong>API Response:</strong> ${JSON.stringify(data, null, 2)}`;
    } else {
      resultDiv.innerHTML = `<strong>Error:</strong> ${response.status} - ${response.statusText}`;
    }
  } catch (error) {
    resultDiv.innerHTML = `<strong>Error:</strong> ${error.message}`;
  }
}
"""

    aws.s3.BucketObject(
      f"{name}-js",
      bucket=self.bucket.id,
      key="app.js",
      content=js_content,
      content_type="application/javascript",
      opts=pulumi.ResourceOptions(parent=self)
    )

    error_html = """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Page Not Found</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="container">
    <h1>Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <a href="/">Go back to home</a>
  </div>
</body>
</html>"""

    aws.s3.BucketObject(
      f"{name}-error-html",
      bucket=self.bucket.id,
      key="error.html",
      content=error_html,
      content_type="text/html",
      opts=pulumi.ResourceOptions(parent=self)
    )
```

## components/monitoring.py

```python
# lib/components/monitoring.py

import pulumi
import pulumi_aws as aws
import json
from typing import List, Optional

"""
Monitoring Infrastructure Component
Creates Amazon SNS Topic and configures CloudWatch Alarms for various services.
"""

class MonitoringInfrastructure(pulumi.ComponentResource):
  def __init__(self, name: str, tags: dict, opts=None):
    super().__init__("custom:monitoring:Infrastructure", name, None, opts)

    self.sns_topic = aws.sns.Topic(
      f"{name}-alerts-topic",
      name=f"{name}-alerts",
      tags=tags,
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.sns_topic_subscription = aws.sns.TopicSubscription(
      f"{name}-email-subscription",
      topic=self.sns_topic.arn,
      protocol="email",
      endpoint="your-alert-email@example.com",
      opts=pulumi.ResourceOptions(parent=self, depends_on=[self.sns_topic])
    )

    self.register_outputs({
      "sns_topic_arn": self.sns_topic.arn,
      "sns_topic_name": self.sns_topic.name
    })

  def setup_alarms(self,
                   lambda_function_names: List[pulumi.Output],
                   kinesis_stream_name: pulumi.Output,
                   cloudfront_distribution_id: pulumi.Output,
                   opts: Optional[pulumi.ResourceOptions] = None):
    """
    Configures CloudWatch Alarms for various deployed services.
    """
    if opts is None:
      opts = pulumi.ResourceOptions(parent=self)

    # Lambda Error Alarms
    for lambda_name_output in lambda_function_names:
      lambda_name_output.apply(lambda name:
        aws.cloudwatch.MetricAlarm(
          f"{self._name}-{name.replace('-', '')}-errors-alarm",
          name=f"{self._name}-{name}-errors",  # Fixed: Use 'name' instead of 'alarm_name'
          comparison_operator="GreaterThanOrEqualToThreshold",
          evaluation_periods=1,
          metric_name="Errors",
          namespace="AWS/Lambda",
          period=60,
          statistic="Sum",
          threshold=1,
          dimensions={
            "FunctionName": name
          },
          alarm_description=f"Alarm when Lambda function {name} reports errors",
          alarm_actions=[self.sns_topic.arn],
          ok_actions=[self.sns_topic.arn],
          opts=opts
        )
      )

    # Kinesis PutRecord.Errors Alarm
    aws.cloudwatch.MetricAlarm(
      f"{self._name}-kinesis-put-errors-alarm",
      name=f"{self._name}-kinesis-put-record-errors",  # Fixed: Use 'name'
      comparison_operator="GreaterThanOrEqualToThreshold",
      evaluation_periods=1,
      metric_name="PutRecord.Errors",
      namespace="AWS/Kinesis",
      period=60,
      statistic="Sum",
      threshold=1,
      dimensions={
        "StreamName": kinesis_stream_name
      },
      alarm_description="Alarm when Kinesis PutRecord operations experience errors",
      alarm_actions=[self.sns_topic.arn],
      ok_actions=[self.sns_topic.arn],
      opts=opts
    )

    # CloudFront Error Rate Alarm
    aws.cloudwatch.MetricAlarm(
      f"{self._name}-cloudfront-error-rate-alarm",
      name=f"{self._name}-cloudfront-error-rate",  # Fixed: Use 'name'
      comparison_operator="GreaterThanOrEqualToThreshold",
      evaluation_periods=1,
      metric_name="4xxErrorRate",
      namespace="AWS/CloudFront",
      period=300,
      statistic="Average",
      threshold=1.0,
      dimensions={
        "DistributionId": cloudfront_distribution_id,
        "Region": "Global"
      },
      alarm_description="Alarm when CloudFront error rate is high",
      alarm_actions=[self.sns_topic.arn],
      ok_actions=[self.sns_topic.arn],
      opts=opts
    )
```

## components/network.py

```python
"""
Network Infrastructure Component
Creates VPC, subnets, security groups, NAT gateways, and VPC endpoints
"""

#lib/components/network.py

import pulumi
import pulumi_aws as aws
from typing import List

class NetworkInfrastructure(pulumi.ComponentResource):
  def __init__(self, name: str, environment: str, tags: dict, opts=None):
    super().__init__("custom:network:Infrastructure", name, None, opts)

    self.vpc = aws.ec2.Vpc(
      f"{name}-vpc",
      cidr_block="10.0.0.0/16",
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={**tags, "Name": f"{name}-vpc"},
      opts=pulumi.ResourceOptions(parent=self) # UNCOMMENTED: Ensure opts is passed
    )

    self.igw = aws.ec2.InternetGateway(
      f"{name}-igw",
      vpc_id=self.vpc.id,
      tags={**tags, "Name": f"{name}-igw"},
      opts=pulumi.ResourceOptions(parent=self)
    )

    # Diagnostic print to see what get_availability_zones returns
    azs = aws.get_availability_zones(state="available")
    print(f"DEBUG: get_availability_zones returned: {azs.names}") # Add this diagnostic print

    self.public_subnets = []
    self.public_subnet_ids = []

    for i, az in enumerate(azs.names[:2]): # Use first 2 AZs
      subnet = aws.ec2.Subnet(
        f"{name}-public-subnet-{i+1}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={**tags, "Name": f"{name}-public-subnet-{i+1}", "Type": "Public"},
        opts=pulumi.ResourceOptions(parent=self)
      )
      self.public_subnets.append(subnet)
      self.public_subnet_ids.append(subnet.id)

    self.private_subnets = []
    self.private_subnet_ids = []

    for i, az in enumerate(azs.names[:2]):
      subnet = aws.ec2.Subnet(
        f"{name}-private-subnet-{i+1}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        tags={**tags, "Name": f"{name}-private-subnet-{i+1}", "Type": "Private"},
        opts=pulumi.ResourceOptions(parent=self)
      )
      self.private_subnets.append(subnet)
      self.private_subnet_ids.append(subnet.id)

    self.nat_eips = []
    for i in range(len(self.public_subnets)):
      eip = aws.ec2.Eip(
        f"{name}-nat-eip-{i+1}",
        domain="vpc",
        tags={**tags, "Name": f"{name}-nat-eip-{i+1}"},
        opts=pulumi.ResourceOptions(parent=self, depends_on=[self.igw])
      )
      self.nat_eips.append(eip)

    self.nat_gateways = []
    for i, (subnet, eip) in enumerate(zip(self.public_subnets, self.nat_eips)):
      nat = aws.ec2.NatGateway(
        f"{name}-nat-{i+1}",
        allocation_id=eip.id,
        subnet_id=subnet.id,
        tags={**tags, "Name": f"{name}-nat-{i+1}"},
        opts=pulumi.ResourceOptions(parent=self)
      )
      self.nat_gateways.append(nat)

    self.public_route_table = aws.ec2.RouteTable(
      f"{name}-public-rt",
      vpc_id=self.vpc.id,
      tags={**tags, "Name": f"{name}-public-rt"},
      opts=pulumi.ResourceOptions(parent=self)
    )

    aws.ec2.Route(
      f"{name}-public-route",
      route_table_id=self.public_route_table.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=self.igw.id,
      opts=pulumi.ResourceOptions(parent=self)
    )

    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
        f"{name}-public-rta-{i+1}",
        subnet_id=subnet.id,
        route_table_id=self.public_route_table.id,
        opts=pulumi.ResourceOptions(parent=self)
      )

    self.private_route_tables = []
    for i, (subnet, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
      rt = aws.ec2.RouteTable(
        f"{name}-private-rt-{i+1}",
        vpc_id=self.vpc.id,
        tags={**tags, "Name": f"{name}-private-rt-{i+1}"},
        opts=pulumi.ResourceOptions(parent=self)
      )

      aws.ec2.Route(
        f"{name}-private-route-{i+1}",
        route_table_id=rt.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat.id,
        opts=pulumi.ResourceOptions(parent=self)
      )

      aws.ec2.RouteTableAssociation(
        f"{name}-private-rta-{i+1}",
        subnet_id=subnet.id,
        route_table_id=rt.id,
        opts=pulumi.ResourceOptions(parent=self)
      )

      self.private_route_tables.append(rt)

    self.lambda_security_group = aws.ec2.SecurityGroup(
      f"{name}-lambda-sg",
      name=f"{name}-lambda-sg",
      description="Security group for Lambda functions",
      vpc_id=self.vpc.id,
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          from_port=443,
          to_port=443,
          protocol="tcp",
          cidr_blocks=["0.0.0.0/0"],
          description="HTTPS outbound"
        ),
        aws.ec2.SecurityGroupEgressArgs(
          from_port=80,
          to_port=80,
          protocol="tcp",
          cidr_blocks=["0.0.0.0/0"],
          description="HTTP outbound"
        )
      ],
      tags={**tags, "Name": f"{name}-lambda-sg"},
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.vpc_endpoint_security_group = aws.ec2.SecurityGroup(
      f"{name}-vpc-endpoint-sg",
      name=f"{name}-vpc-endpoint-sg",
      description="Security group for VPC endpoints",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          from_port=443,
          to_port=443,
          protocol="tcp",
          security_groups=[self.lambda_security_group.id],
          description="HTTPS from Lambda"
        )
      ],
      tags={**tags, "Name": f"{name}-vpc-endpoint-sg"},
      opts=pulumi.ResourceOptions(parent=self)
    )

    self._create_vpc_endpoints(name, tags)

    self.register_outputs({
      "vpc_id": self.vpc.id,
      "public_subnet_ids": self.public_subnet_ids,
      "private_subnet_ids": self.private_subnet_ids,
      "lambda_security_group_id": self.lambda_security_group.id,
      "vpc_endpoint_security_group_id": self.vpc_endpoint_security_group.id
    })

  def _create_vpc_endpoints(self, name: str, tags: dict):
    """Create VPC endpoints for AWS services"""

    self.dynamodb_endpoint = aws.ec2.VpcEndpoint(
      f"{name}-dynamodb-endpoint",
      vpc_id=self.vpc.id,
      # Diagnostic print for get_region
      service_name=f"com.amazonaws.{aws.get_region().name}.dynamodb",
      vpc_endpoint_type="Gateway",
      route_table_ids=[rt.id for rt in self.private_route_tables],
      tags={**tags, "Name": f"{name}-dynamodb-endpoint"},
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.s3_endpoint = aws.ec2.VpcEndpoint(
      f"{name}-s3-endpoint",
      vpc_id=self.vpc.id,
      service_name=f"com.amazonaws.{aws.get_region().name}.s3",
      vpc_endpoint_type="Gateway",
      route_table_ids=[rt.id for rt in self.private_route_tables],
      tags={**tags, "Name": f"{name}-s3-endpoint"},
      opts=pulumi.ResourceOptions(parent=self)
    )

    self.kinesis_endpoint = aws.ec2.VpcEndpoint(
      f"{name}-kinesis-endpoint",
      vpc_id=self.vpc.id,
      service_name=f"com.amazonaws.{aws.get_region().name}.kinesis-streams",
      vpc_endpoint_type="Interface",
      subnet_ids=self.private_subnet_ids,
      security_group_ids=[self.vpc_endpoint_security_group.id],
      private_dns_enabled=True,
      tags={**tags, "Name": f"{name}-kinesis-endpoint"},
      opts=pulumi.ResourceOptions(parent=self)
    )
```
