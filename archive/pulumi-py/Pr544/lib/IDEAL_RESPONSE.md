```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

import json
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, Config, ResourceOptions

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack

class TapStackArgs:
  """Arguments for TapStack ComponentResource"""

  def __init__(
      self,
      environment_suffix: Optional[str] = None,
      tags: Optional[dict] = None,
      lambda_memory_size: int = 256,
      lambda_timeout: int = 30,
      api_stage_name: str = "$default"
  ):  # pylint: disable=too-many-arguments,too-many-positional-arguments
    self.environment_suffix = environment_suffix  or 'dev'
    self.tags = tags or {}
    self.lambda_memory_size = lambda_memory_size
    self.lambda_timeout = lambda_timeout
    self.api_stage_name = api_stage_name




class TapStack(ComponentResource):
  """
  TapStack ComponentResource that provisions AWS serverless infrastructure
  for the Nova Model Breaking project.

  This stack creates:
  - Lambda functions for HTTP request handling
  - API Gateway for REST endpoints
  - S3 bucket for data storage
  - IAM roles with least-privilege permissions
  - CloudWatch alarms for monitoring
  """

  def __init__(
      self,
      name: str,
      args: TapStackArgs,
      opts: Optional[ResourceOptions] = None
  ):
    super().__init__("custom:TapStack", name, {}, opts)

    # Store configuration
    self.name = name
    self.args = args
    self.config = Config()
    self.environment_suffix = args.environment_suffix
    self.tags = {
      "Environment": self.environment_suffix,
      "Project": "nova-model-breaking",
      "ManagedBy": "pulumi",
      **args.tags
    }

    # Resource references
    self.lambda_function = None
    self.api_gateway = None
    self.s3_bucket = None
    self.lambda_role = None
    self.cloudwatch_alarm = None
    self.sns_topic = None

    # Create infrastructure components
    self._create_iam_role()
    self._create_s3_bucket()
    self._create_lambda_function()
    self._create_api_gateway()
    self._create_cloudwatch_alarms()

    # Register outputs
    self.register_outputs({
      "lambda_function_name": self.lambda_function.name,
      "lambda_function_arn": self.lambda_function.arn,
      "api_gateway_url": self.api_gateway.api_endpoint,
      "s3_bucket_name": self.s3_bucket.bucket,
      "lambda_role_arn": self.lambda_role.arn,
      "sns_topic_arn": self.sns_topic.arn
    })

  def _create_iam_role(self) -> None:
    """
    Create IAM role and policies for Lambda execution with least-privilege permissions.

    The role allows Lambda to:
    - Write logs to CloudWatch
    - Access S3 bucket for data operations
    - Execute within VPC if needed
    """
    # Lambda execution role trust policy
    lambda_assume_role_policy = json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Principal": {
            "Service": "lambda.amazonaws.com"
          },
          "Action": "sts:AssumeRole"
        }
      ]
    })

    # Create IAM role for Lambda execution
    self.lambda_role = aws.iam.Role(
      f"prod-lambda-role-{self.environment_suffix}",
      assume_role_policy=lambda_assume_role_policy,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # Attach basic Lambda execution policy for CloudWatch logging
    aws.iam.RolePolicyAttachment(
      f"prod-lambda-basic-execution-{self.environment_suffix}",
      role=self.lambda_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      opts=ResourceOptions(parent=self)
    )

    # Create custom policy for S3 access
    s3_policy_document = pulumi.Output.all(
      bucket_name=f"prod-nova-data-{self.environment_suffix}"
    ).apply(lambda args: json.dumps({
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:ListBucket"
          ],
          "Resource": [
            f"arn:aws:s3:::{args['bucket_name']}",
            f"arn:aws:s3:::{args['bucket_name']}/*"
          ]
        }
      ]
    }))

    # Create S3 access policy
    s3_access_policy = aws.iam.Policy(
      f"prod-lambda-s3-policy-{self.environment_suffix}",
      policy=s3_policy_document,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # Attach S3 policy to Lambda role
    aws.iam.RolePolicyAttachment(
      f"prod-lambda-s3-attachment-{self.environment_suffix}",
      role=self.lambda_role.name,
      policy_arn=s3_access_policy.arn,
      opts=ResourceOptions(parent=self)
    )

  def _create_s3_bucket(self) -> None:
    """
    Create a private S3 bucket for data storage with security best practices.

    Features:
    - Versioning enabled for data protection
    - Server-side encryption with AES256
    - Public access blocked for security
    - Lifecycle policies for cost optimization
    """
    bucket_name = f"prod-nova-data-{self.environment_suffix}"

    # Create S3 bucket
    self.s3_bucket = aws.s3.Bucket(
      f"prod-s3-bucket-{self.environment_suffix}",
      bucket=bucket_name,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # Enable versioning on the bucket
    aws.s3.BucketVersioningV2(
      f"prod-s3-versioning-{self.environment_suffix}",
      bucket=self.s3_bucket.id,
      versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
      ),
      opts=ResourceOptions(parent=self)
    )

    # Configure server-side encryption
    aws.s3.BucketServerSideEncryptionConfigurationV2(
      f"prod-s3-encryption-{self.environment_suffix}",
      bucket=self.s3_bucket.id,
      rules=[aws.s3.BucketServerSideEncryptionConfigurationV2RuleArgs(
        apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationV2RuleApplyServerSideEncryptionByDefaultArgs(  # pylint: disable=line-too-long
          sse_algorithm="AES256"
        ),
        bucket_key_enabled=True
      )],
      opts=ResourceOptions(parent=self)
    )

    # Block all public access
    aws.s3.BucketPublicAccessBlock(
      f"prod-s3-public-access-block-{self.environment_suffix}",
      bucket=self.s3_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True,
      opts=ResourceOptions(parent=self)
    )

  def _create_lambda_function(self) -> None:
    """
    Create Lambda function for handling HTTP requests with proper configuration.

    Features:
    - Python 3.9 runtime (or latest supported)
    - Environment variables from Pulumi config
    - CloudWatch logging enabled
    - Proper error handling and monitoring
    """
    # Get configuration values
    lambda_code = self.config.get("lambda_code") or self._get_default_lambda_code()

    # Environment variables for Lambda
    lambda_environment = {
      "ENVIRONMENT": self.environment_suffix,
      "S3_BUCKET_NAME": self.s3_bucket.bucket,
      "LOG_LEVEL": self.config.get("log_level") or "INFO",
      "API_VERSION": "1.0"
    }

    # Add any additional environment variables from config
    config_env_vars = self.config.get_object("lambda_environment_variables") or {}
    lambda_environment.update(config_env_vars)

    # Create Lambda function
    self.lambda_function = aws.lambda_.Function(
      f"prod-lambda-function-{self.environment_suffix}",
      role=self.lambda_role.arn,
      code=pulumi.AssetArchive({
        "index.py": pulumi.StringAsset(lambda_code)
      }),
      handler="index.handler",
      runtime="python3.9",
      memory_size=self.args.lambda_memory_size,
      timeout=self.args.lambda_timeout,
      environment=aws.lambda_.FunctionEnvironmentArgs(
        variables=lambda_environment
      ),
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[self.lambda_role])
    )

    # Create CloudWatch Log Group with retention policy
    aws.cloudwatch.LogGroup(
      f"prod-lambda-logs-{self.environment_suffix}",
      name=self.lambda_function.name.apply(lambda name: f"/aws/lambda/{name}"),
      retention_in_days=14,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  def _create_api_gateway(self) -> None:
    """
    Create API Gateway HTTP API v2 with Lambda integration.

    Features:
    - HTTP API v2 for better performance and lower cost
    - Integration with Lambda function
    - Basic routes (/, /health)
    - CORS configuration
    - Proper stage management
    """
    # Create HTTP API
    self.api_gateway = aws.apigatewayv2.Api(
      f"prod-api-gateway-{self.environment_suffix}",
      protocol_type="HTTP",
      cors_configuration=aws.apigatewayv2.ApiCorsConfigurationArgs(
        allow_credentials=False,
        allow_headers=["content-type", "x-amz-date", "authorization", "x-api-key"],
        allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allow_origins=["*"],
        max_age=86400
      ),
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # Create Lambda integration
    lambda_integration = aws.apigatewayv2.Integration(
      f"prod-api-integration-{self.environment_suffix}",
      api_id=self.api_gateway.id,
      integration_type="AWS_PROXY",
      integration_uri=self.lambda_function.arn,
      payload_format_version="2.0",
      opts=ResourceOptions(parent=self)
    )

    # Create routes
    # Root route
    aws.apigatewayv2.Route(
      f"prod-api-route-root-{self.environment_suffix}",
      api_id=self.api_gateway.id,
      route_key="GET /",
      target=lambda_integration.id.apply(lambda id: f"integrations/{id}"),
      opts=ResourceOptions(parent=self)
    )

    # Health check route
    aws.apigatewayv2.Route(
      f"prod-api-route-health-{self.environment_suffix}",
      api_id=self.api_gateway.id,
      route_key="GET /health",
      target=lambda_integration.id.apply(lambda id: f"integrations/{id}"),
      opts=ResourceOptions(parent=self)
    )

    # Data endpoint route
    aws.apigatewayv2.Route(
      f"prod-api-route-data-{self.environment_suffix}",
      api_id=self.api_gateway.id,
      route_key="POST /data",
      target=lambda_integration.id.apply(lambda id: f"integrations/{id}"),
      opts=ResourceOptions(parent=self)
    )

    # Catch-all route for other methods
    aws.apigatewayv2.Route(
      f"prod-api-route-catchall-{self.environment_suffix}",
      api_id=self.api_gateway.id,
      route_key="ANY /{proxy+}",
      target=lambda_integration.id.apply(lambda id: f"integrations/{id}"),
      opts=ResourceOptions(parent=self)
    )

    # Create stage
    aws.apigatewayv2.Stage(
      f"prod-api-stage-{self.environment_suffix}",
      api_id=self.api_gateway.id,
      name=self.args.api_stage_name,
      auto_deploy=True,
      access_log_settings=aws.apigatewayv2.StageAccessLogSettingsArgs(
        destination_arn=self._create_api_log_group().arn,
        format=json.dumps({
          "requestId": "$context.requestId",
          "ip": "$context.identity.sourceIp",
          "requestTime": "$context.requestTime",
          "httpMethod": "$context.httpMethod",
          "routeKey": "$context.routeKey",
          "status": "$context.status",
          "protocol": "$context.protocol",
          "responseLength": "$context.responseLength"
        })
      ),
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # Grant API Gateway permission to invoke Lambda
    aws.lambda_.Permission(
      f"prod-lambda-permission-{self.environment_suffix}",
      statement_id="AllowExecutionFromAPIGateway",
      action="lambda:InvokeFunction",
      function=self.lambda_function.arn,
      principal="apigateway.amazonaws.com",
      source_arn=pulumi.Output.concat(
        self.api_gateway.execution_arn, "/*/*"
      ),
      opts=ResourceOptions(parent=self)
    )

  def _create_api_log_group(self) -> aws.cloudwatch.LogGroup:
    """Create CloudWatch Log Group for API Gateway access logs"""
    return aws.cloudwatch.LogGroup(
      f"prod-api-logs-{self.environment_suffix}",
      name=f"/aws/apigateway/prod-api-{self.environment_suffix}",
      retention_in_days=14,
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

  def _create_cloudwatch_alarms(self) -> None:
    """
    Create CloudWatch alarms for monitoring Lambda function errors with SNS notifications.

    Features:
    - Monitor Lambda errors and duration metrics
    - Alert when thresholds are exceeded
    - SNS topic for notifications to external systems
    - Proper alarm naming and tagging
    """
    # Create SNS topic for CloudWatch alarm notifications
    sns_topic = aws.sns.Topic(
      f"prod-cloudwatch-alerts-{self.environment_suffix}",
      display_name=f"CloudWatch Alerts - {self.environment_suffix}",
      tags=self.tags,
      opts=ResourceOptions(parent=self)
    )

    # Create SNS topic policy to allow CloudWatch to publish
    sns_topic_policy = aws.sns.TopicPolicy(
      f"prod-cloudwatch-alerts-policy-{self.environment_suffix}",
      arn=sns_topic.arn,
      policy=pulumi.Output.all(
        topic_arn=sns_topic.arn
      ).apply(lambda args: json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Principal": {
              "Service": "cloudwatch.amazonaws.com"
            },
            "Action": [
              "sns:Publish"
            ],
            "Resource": args["topic_arn"],
            "Condition": {
              "StringEquals": {
                "aws:SourceAccount": pulumi.get_stack()
              }
            }
          }
        ]
      })),
      opts=ResourceOptions(parent=self)
    )

    # Create CloudWatch alarm for Lambda errors
    self.cloudwatch_alarm = aws.cloudwatch.MetricAlarm(
      f"prod-lambda-errors-alarm-{self.environment_suffix}",
      name=f"prod-lambda-errors-{self.environment_suffix}",
      alarm_description=f"Lambda function errors for {self.lambda_function.name} - Environment: {self.environment_suffix}",  # pylint: disable=line-too-long
      metric_name="Errors",
      namespace="AWS/Lambda",
      statistic="Sum",
      period=300,  # 5 minutes
      evaluation_periods=1,
      threshold=1,
      comparison_operator="GreaterThanOrEqualToThreshold",
      dimensions={
        "FunctionName": self.lambda_function.name
      },
      alarm_actions=[sns_topic.arn],
      ok_actions=[sns_topic.arn],
      treat_missing_data="notBreaching",
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[sns_topic_policy])
    )

    # Create alarm for Lambda duration
    aws.cloudwatch.MetricAlarm(
      f"prod-lambda-duration-alarm-{self.environment_suffix}",
      name=f"prod-lambda-duration-{self.environment_suffix}",
      alarm_description=f"Lambda function duration alarm for {self.lambda_function.name} - Environment: {self.environment_suffix}",  # pylint: disable=line-too-long
      metric_name="Duration",
      namespace="AWS/Lambda",
      statistic="Average",
      period=300,
      evaluation_periods=2,
      threshold=self.args.lambda_timeout * 1000 * 0.8,  # 80% of timeout in ms
      comparison_operator="GreaterThanThreshold",
      dimensions={
        "FunctionName": self.lambda_function.name
      },
      alarm_actions=[sns_topic.arn],
      ok_actions=[sns_topic.arn],
      treat_missing_data="notBreaching",
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[sns_topic_policy])
    )

    # Create alarm for Lambda throttles (optional but recommended)
    aws.cloudwatch.MetricAlarm(
      f"prod-lambda-throttles-alarm-{self.environment_suffix}",
      name=f"prod-lambda-throttles-{self.environment_suffix}",
      alarm_description=f"Lambda function throttles for {self.lambda_function.name} - Environment: {self.environment_suffix}",  # pylint: disable=line-too-long
      metric_name="Throttles",
      namespace="AWS/Lambda",
      statistic="Sum",
      period=300,
      evaluation_periods=1,
      threshold=1,
      comparison_operator="GreaterThanOrEqualToThreshold",
      dimensions={
        "FunctionName": self.lambda_function.name
      },
      alarm_actions=[sns_topic.arn],
      ok_actions=[sns_topic.arn],
      treat_missing_data="notBreaching",
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[sns_topic_policy])
    )

    # Create alarm for API Gateway 4XX errors
    aws.cloudwatch.MetricAlarm(
      f"prod-api-4xx-errors-alarm-{self.environment_suffix}",
      name=f"prod-api-4xx-errors-{self.environment_suffix}",
      alarm_description=f"API Gateway 4XX errors - Environment: {self.environment_suffix}",
      metric_name="4XXError",
      namespace="AWS/ApiGateway",
      statistic="Sum",
      period=300,
      evaluation_periods=2,
      threshold=10,  # Alert if more than 10 4XX errors in 10 minutes
      comparison_operator="GreaterThanThreshold",
      dimensions={
        "ApiName": self.api_gateway.name
      },
      alarm_actions=[sns_topic.arn],
      ok_actions=[sns_topic.arn],
      treat_missing_data="notBreaching",
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[sns_topic_policy])
    )

    # Create alarm for API Gateway 5XX errors
    aws.cloudwatch.MetricAlarm(
      f"prod-api-5xx-errors-alarm-{self.environment_suffix}",
      name=f"prod-api-5xx-errors-{self.environment_suffix}",
      alarm_description=f"API Gateway 5XX errors - Environment: {self.environment_suffix}",
      metric_name="5XXError",
      namespace="AWS/ApiGateway",
      statistic="Sum",
      period=300,
      evaluation_periods=1,
      threshold=1,  # Alert on any 5XX error
      comparison_operator="GreaterThanOrEqualToThreshold",
      dimensions={
        "ApiName": self.api_gateway.name
      },
      alarm_actions=[sns_topic.arn],
      ok_actions=[sns_topic.arn],
      treat_missing_data="notBreaching",
      tags=self.tags,
      opts=ResourceOptions(parent=self, depends_on=[sns_topic_policy])
    )

    # Store SNS topic reference for outputs
    self.sns_topic = sns_topic

  def _get_default_lambda_code(self) -> str:
    """
    Provide default Lambda function code with sophisticated error handling.

    Returns:
      str: Python code for Lambda function with enhanced error handling
    """
    return '''
import json
import logging
import os
import traceback
import uuid
from datetime import datetime
from typing import Dict, Any, Optional, Tuple
import boto3
from botocore.exceptions import ClientError, BotoCoreError

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize AWS clients with error handling
try:
  s3_client = boto3.client('s3')
  cloudwatch_client = boto3.client('cloudwatch')
except Exception as e:
  logger.error(f"Failed to initialize AWS clients: {str(e)}")
  s3_client = None
  cloudwatch_client = None

# Error types for structured error handling
class APIError(Exception):
  """Base API error class"""
  def __init__(self, message: str, status_code: int = 500, error_code: str = "INTERNAL_ERROR"):
    self.message = message
    self.status_code = status_code
    self.error_code = error_code
    super().__init__(self.message)

class ValidationError(APIError):
  """Validation error"""
  def __init__(self, message: str):
    super().__init__(message, 400, "VALIDATION_ERROR")

class NotFoundError(APIError):
  """Not found error"""
  def __init__(self, message: str):
    super().__init__(message, 404, "NOT_FOUND")

class ExternalServiceError(APIError):
  """External service error"""
  def __init__(self, message: str):
    super().__init__(message, 502, "EXTERNAL_SERVICE_ERROR")

def generate_correlation_id() -> str:
  """Generate unique correlation ID for request tracking"""
  return str(uuid.uuid4())

def log_metric(metric_name: str, value: float, unit: str = 'Count') -> None:
  """Log custom metrics to CloudWatch"""
  try:
    if cloudwatch_client:
      cloudwatch_client.put_metric_data(
        Namespace='Lambda/TapStack',
        MetricData=[
          {
            'MetricName': metric_name,
            'Value': value,
            'Unit': unit,
            'Timestamp': datetime.utcnow()
          }
        ]
      )
  except Exception as e:
    logger.warning(f"Failed to log metric {metric_name}: {str(e)}")

def validate_request(event: Dict[str, Any]) -> Tuple[str, str, Optional[Dict]]:
  """Validate and extract request information"""
  try:
    request_context = event.get('requestContext', {})
    http_context = request_context.get('http', {})

    method = http_context.get('method')
    path = http_context.get('path')

    if not method:
      raise ValidationError("Missing HTTP method in request")
    if not path:
      raise ValidationError("Missing path in request")

    # Parse body if present
    body = None
    if event.get('body'):
      try:
        body = json.loads(event['body'])
      except json.JSONDecodeError:
        raise ValidationError("Invalid JSON in request body")

    return method, path, body

  except APIError:
    raise
  except Exception as e:
    raise ValidationError(f"Invalid request format: {str(e)}")

def create_response(status_code: int, body: Dict[str, Any],
                   correlation_id: Optional[str] = None) -> Dict[str, Any]:
  """Create standardized API response"""
  headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  }

  if correlation_id:
    headers['X-Correlation-Id'] = correlation_id
    body['correlationId'] = correlation_id

  body['timestamp'] = datetime.utcnow().isoformat()

  return {
    'statusCode': status_code,
    'headers': headers,
    'body': json.dumps(body, default=str)
  }

def create_error_response(error: APIError, correlation_id: str) -> Dict[str, Any]:
  """Create standardized error response"""
  return create_response(
    error.status_code,
    {
      'error': error.error_code,
      'message': error.message,
      'success': False
    },
    correlation_id
  )

def handle_s3_operation(bucket_name: str, operation: str, **kwargs) -> Dict[str, Any]:
  """Handle S3 operations with proper error handling"""
  try:
    if not s3_client:
      raise ExternalServiceError("S3 client not initialized")

    if operation == 'list_objects':
      response = s3_client.list_objects_v2(Bucket=bucket_name, MaxKeys=10)
      return {
        'objects': [obj['Key'] for obj in response.get('Contents', [])],
        'count': response.get('KeyCount', 0)
      }
    elif operation == 'put_object':
      key = kwargs.get('key')
      content = kwargs.get('content', '')
      if not key:
        raise ValidationError("Missing 'key' parameter for S3 put operation")

      s3_client.put_object(
        Bucket=bucket_name,
        Key=key,
        Body=content,
        ContentType='application/json'
      )
      return {'key': key, 'status': 'uploaded'}
    else:
      raise ValidationError(f"Unsupported S3 operation: {operation}")

  except ClientError as e:
    error_code = e.response.get('Error', {}).get('Code', 'Unknown')
    if error_code == 'NoSuchBucket':
      raise ExternalServiceError(f"S3 bucket '{bucket_name}' does not exist")
    elif error_code == 'AccessDenied':
      raise ExternalServiceError("Access denied to S3 bucket")
    else:
      raise ExternalServiceError(f"S3 operation failed: {error_code}")
  except BotoCoreError as e:
    raise ExternalServiceError(f"AWS service error: {str(e)}")

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
  """
  Enhanced Lambda function handler with sophisticated error handling and logging.

  Args:
    event: API Gateway event
    context: Lambda context

  Returns:
    Dict containing HTTP response with proper error handling
  """
  correlation_id = generate_correlation_id()
  start_time = datetime.utcnow()

  # Configure correlation ID in logs
  logger.info(f"Request started - Correlation ID: {correlation_id}")

  try:
    # Log request details
    logger.info(f"Event received: {json.dumps({
      'correlation_id': correlation_id,
      'event_keys': list(event.keys()),
      'method': event.get('requestContext', {}).get('http', {}).get('method'),
      'path': event.get('requestContext', {}).get('http', {}).get('path')
    })}")

    # Validate request
    method, path, body = validate_request(event)

    # Log successful validation
    logger.info(f"Request validated - Method: {method}, Path: {path}")

    # Route to appropriate handler
    response_body = None

    if path == '/health':
      response_body = handle_health_check(correlation_id)
    elif path == '/':
      response_body = handle_root_request(method, event, correlation_id)
    elif path.startswith('/s3'):
      response_body = handle_s3_endpoint(method, body, correlation_id)
    else:
      response_body = handle_generic_request(method, path, event, correlation_id)

    # Log success metrics
    duration = (datetime.utcnow() - start_time).total_seconds() * 1000
    log_metric('RequestDuration', duration, 'Milliseconds')
    log_metric('SuccessfulRequests', 1)

    logger.info(f"Request completed successfully - Correlation ID: {correlation_id}, Duration: {duration}ms")

    return create_response(200, response_body, correlation_id)

  except APIError as e:
    # Log known API errors
    logger.warning(f"API Error - Correlation ID: {correlation_id}, Error: {e.error_code}, Message: {e.message}")
    log_metric(f'Error_{e.error_code}', 1)
    return create_error_response(e, correlation_id)

  except Exception as e:
    # Log unexpected errors with full traceback
    error_details = {
      'correlation_id': correlation_id,
      'error': str(e),
      'type': type(e).__name__,
      'traceback': traceback.format_exc()
    }
    logger.error(f"Unexpected error: {json.dumps(error_details)}")

    # Log error metrics
    log_metric('UnexpectedErrors', 1)

    # Return generic error response (don't expose internal details)
    api_error = APIError("An unexpected error occurred", 500, "INTERNAL_ERROR")
    return create_error_response(api_error, correlation_id)

def handle_health_check(correlation_id: str) -> Dict[str, Any]:
  """Enhanced health check with system status"""
  try:
    # Perform basic health checks
    health_status = {
      'status': 'healthy',
      'environment': os.environ.get('ENVIRONMENT', 'unknown'),
      'version': os.environ.get('API_VERSION', '1.0'),
      'checks': {
        's3_client': s3_client is not None,
        'cloudwatch_client': cloudwatch_client is not None
      }
    }

    # Check S3 bucket accessibility
    bucket_name = os.environ.get('S3_BUCKET_NAME')
    if bucket_name and s3_client:
      try:
        s3_client.head_bucket(Bucket=bucket_name)
        health_status['checks']['s3_bucket'] = True
      except:
        health_status['checks']['s3_bucket'] = False
        health_status['status'] = 'degraded'

    return health_status

  except Exception as e:
    logger.error(f"Health check failed: {str(e)}")
    raise APIError("Health check failed", 503, "SERVICE_UNAVAILABLE")

def handle_root_request(method: str, event: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
  """Handle root path requests"""
  return {
    'message': 'Welcome to Nova Model Breaking API - Enhanced Edition',
    'method': method,
    'environment': os.environ.get('ENVIRONMENT', 'unknown'),
    'features': ['error_handling', 'correlation_tracking', 'metrics', 's3_integration'],
    'documentation': '/health for health check, /s3/* for S3 operations'
  }

def handle_s3_endpoint(method: str, body: Optional[Dict], correlation_id: str) -> Dict[str, Any]:
  """Handle S3-related endpoints"""
  bucket_name = os.environ.get('S3_BUCKET_NAME')
  if not bucket_name:
    raise ValidationError("S3_BUCKET_NAME environment variable not set")

  if method == 'GET':
    return handle_s3_operation(bucket_name, 'list_objects')
  elif method == 'POST':
    if not body or 'key' not in body:
      raise ValidationError("POST to /s3 requires 'key' in request body")

    return handle_s3_operation(
      bucket_name,
      'put_object',
      key=body['key'],
      content=json.dumps(body.get('content', {}))
    )
  else:
    raise ValidationError(f"Method {method} not supported for S3 endpoint")

def handle_generic_request(method: str, path: str, event: Dict[str, Any], correlation_id: str) -> Dict[str, Any]:
  """Handle generic requests with enhanced information"""
  return {
    'message': f'Enhanced handler processed {method} request to {path}',
    'path': path,
    'method': method,
    'environment': os.environ.get('ENVIRONMENT', 'unknown'),
    'capabilities': ['structured_logging', 'error_boundaries', 'request_validation'],
    'note': 'This is an enhanced Lambda function with sophisticated error handling'
  }
'''
```
