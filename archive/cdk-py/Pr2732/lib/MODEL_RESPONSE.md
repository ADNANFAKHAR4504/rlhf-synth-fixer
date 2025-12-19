### Reasoning Trace
---

The user wants a complete CDK setup with Python that includes:

1. A Lambda function
2. API Gateway REST API that triggers the Lambda
3. S3 bucket with versioning enabled
4. Lambda function can write to S3 bucket
5. Everything in us-west-2 region
6. Proper tagging for cost tracking
7. Environment variables for Lambda
8. Logging enabled for both API Gateway and Lambda
9. IAM role for Lambda with S3 write permissions
10. AWS best practices for naming and security
11. CloudFormation intrinsic functions for dynamic values
12. Single stack in main.py

Let me structure this:

1. Create the CDK app and stack
2. Create S3 bucket with versioning
3. Create Lambda function with environment variables
4. Create IAM role for Lambda with S3 permissions
5. Create API Gateway REST API
6. Enable logging for both services
7. Add proper tags
8. Use dynamic values where appropriate

I'll need to import the necessary CDK constructs and follow best practices.
### Answer 
---

I'll help you create a comprehensive CDK setup for your serverless infrastructure. Here's a complete solution that addresses all your requirements:

## Project Structure

```
your-project/
├── main.py
├── lambda/
│   └── handler.py
├── requirements.txt
└── cdk.json
```

## main.py

```python
#!/usr/bin/env python3
import os
from aws_cdk import (
    App,
    Stack,
    Environment,
    Duration,
    RemovalPolicy,
    CfnOutput,
    Tags,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
)
from constructs import Construct


class ServerlessInfrastructureStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Stack-level tags for cost tracking
        Tags.of(self).add("Environment", "production")
        Tags.of(self).add("Project", "serverless-api")
        Tags.of(self).add("Owner", "your-team")
        Tags.of(self).add("CostCenter", "engineering")

        # S3 Bucket with versioning enabled
        self.data_bucket = s3.Bucket(
            self, 
            "DataBucket",
            bucket_name=f"serverless-data-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,  # Best practice for data buckets
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="delete-old-versions",
                    enabled=True,
                    noncurrent_version_expiration=Duration.days(30),
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ]
        )

        # CloudWatch Log Group for Lambda function
        lambda_log_group = logs.LogGroup(
            self,
            "LambdaLogGroup",
            log_group_name=f"/aws/lambda/serverless-api-handler",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        # IAM Role for Lambda function
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
            inline_policies={
                "S3WritePolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:PutObject",
                                "s3:PutObjectAcl",
                                "s3:GetObject",
                                "s3:GetObjectVersion",
                                "s3:DeleteObject"
                            ],
                            resources=[
                                self.data_bucket.bucket_arn,
                                f"{self.data_bucket.bucket_arn}/*"
                            ]
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            resources=[lambda_log_group.log_group_arn]
                        )
                    ]
                )
            }
        )

        # Lambda function
        self.api_handler = lambda_.Function(
            self,
            "ApiHandler",
            function_name="serverless-api-handler",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="handler.lambda_handler",
            code=lambda_.Code.from_asset("lambda"),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "BUCKET_NAME": self.data_bucket.bucket_name,
                "REGION": self.region,
                "LOG_LEVEL": "INFO",
                "STAGE": "prod"
            },
            log_group=lambda_log_group,
            description="Lambda function to handle API requests and write to S3"
        )

        # API Gateway CloudWatch Log Group
        api_log_group = logs.LogGroup(
            self,
            "ApiGatewayLogGroup", 
            log_group_name=f"/aws/apigateway/serverless-api",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        # API Gateway REST API
        self.api = apigateway.RestApi(
            self,
            "ServerlessApi",
            rest_api_name="serverless-data-api",
            description="REST API for serverless data processing",
            endpoint_configuration=apigateway.EndpointConfiguration(
                types=[apigateway.EndpointType.REGIONAL]
            ),
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
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
                )
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
            )
        )

        # Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.api_handler,
            proxy=True,
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                )
            ]
        )

        # API Gateway resources and methods
        data_resource = self.api.root.add_resource("data")
        
        # POST method for creating data
        data_resource.add_method(
            "POST",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )

        # GET method for retrieving data
        data_resource.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                )
            ]
        )

        # Health check endpoint
        health_resource = self.api.root.add_resource("health")
        health_resource.add_method("GET", lambda_integration)

        # CloudFormation Outputs with dynamic values
        CfnOutput(
            self,
            "ApiEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL",
            export_name=f"{self.stack_name}-ApiEndpoint"
        )

        CfnOutput(
            self,
            "BucketName",
            value=self.data_bucket.bucket_name,
            description="S3 bucket name for data storage",
            export_name=f"{self.stack_name}-BucketName"
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.api_handler.function_name,
            description="Lambda function name",
            export_name=f"{self.stack_name}-LambdaFunction"
        )

        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=self.api_handler.function_arn,
            description="Lambda function ARN",
            export_name=f"{self.stack_name}-LambdaArn"
        )


# CDK App
app = App()

# Deploy to us-west-2 region as specified
ServerlessInfrastructureStack(
    app, 
    "ServerlessInfrastructureStack",
    env=Environment(region="us-west-2"),
    description="Serverless infrastructure with API Gateway, Lambda, and S3"
)

app.synth()
```

## lambda/handler.py

```python
import json
import boto3
import os
import logging
from datetime import datetime
from typing import Dict, Any
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))

# Initialize AWS clients
s3_client = boto3.client('s3')
bucket_name = os.getenv('BUCKET_NAME')
region = os.getenv('REGION')
stage = os.getenv('STAGE', 'dev')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function handler for API Gateway requests
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        http_method = event.get('httpMethod')
        path = event.get('path')
        
        # CORS headers
        cors_headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
            'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
        }
        
        # Health check endpoint
        if path == '/health':
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'status': 'healthy',
                    'timestamp': datetime.utcnow().isoformat(),
                    'region': region,
                    'stage': stage
                })
            }
        
        # Handle data operations
        if path == '/data':
            if http_method == 'POST':
                return handle_post_data(event, cors_headers)
            elif http_method == 'GET':
                return handle_get_data(event, cors_headers)
        
        # Default response for unhandled paths
        return {
            'statusCode': 404,
            'headers': cors_headers,
            'body': json.dumps({
                'error': 'Not Found',
                'message': f'Path {path} not found'
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'error': 'Internal Server Error',
                'message': str(e)
            })
        }


def handle_post_data(event: Dict[str, Any], cors_headers: Dict[str, str]) -> Dict[str, Any]:
    """Handle POST requests to store data in S3"""
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Generate unique file key
        timestamp = datetime.utcnow().strftime('%Y/%m/%d/%H')
        file_id = str(uuid.uuid4())
        s3_key = f"data/{timestamp}/{file_id}.json"
        
        # Add metadata
        data_with_metadata = {
            'id': file_id,
            'timestamp': datetime.utcnow().isoformat(),
            'data': body,
            'source': 'api-gateway',
            'stage': stage
        }
        
        # Store in S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=json.dumps(data_with_metadata, indent=2),
            ContentType='application/json',
            Metadata={
                'source': 'lambda-api',
                'timestamp': str(int(datetime.utcnow().timestamp())),
                'stage': stage
            }
        )
        
        logger.info(f"Successfully stored data in S3: {s3_key}")
        
        return {
            'statusCode': 201,
            'headers': cors_headers,
            'body': json.dumps({
                'message': 'Data stored successfully',
                'id': file_id,
                's3_key': s3_key,
                'bucket': bucket_name
            })
        }
        
    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({
                'error': 'Bad Request',
                'message': 'Invalid JSON in request body'
            })
        }


def handle_get_data(event: Dict[str, Any], cors_headers: Dict[str, str]) -> Dict[str, Any]:
    """Handle GET requests to retrieve data from S3"""
    try:
        query_params = event.get('queryStringParameters') or {}
        
        # List recent objects
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix='data/',
            MaxKeys=10
        )
        
        objects = []
        if 'Contents' in response:
            for obj in response['Contents']:
                objects.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'].isoformat()
                })
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'message': 'Data retrieved successfully',
                'bucket': bucket_name,
                'objects': objects,
                'count': len(objects)
            })
        }
        
    except Exception as e:
        logger.error(f"Error retrieving data: {str(e)}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': 'Internal Server Error',
                'message': 'Failed to retrieve data'
            })
        }
```

## requirements.txt

```txt
aws-cdk-lib>=2.0.0
constructs>=10.0.0
boto3>=1.26.0
```

## cdk.json

```json
{
  "app": "python main.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__pycache__",
      "**/.venv/**"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target": "aws-cdk-lib",
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true,
    "@aws-cdk/aws-iam:importedRoleStackSafeDefaultPolicyName": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true,
    "@aws-cdk/aws-route53-patters:useCertificate": true,
    "@aws-cdk/customresources:installLatestAwsSdkDefault": false,
    "@aws-cdk/aws-rds:databaseProxyUniqueResourceName": true,
    "@aws-cdk/aws-codedeploy:removeAlarmsFromDeploymentGroup": true,
    "@aws-cdk/aws-apigateway:authorizerChangeDeploymentLogicalId": true,
    "@aws-cdk/aws-ec2:launchTemplateDefaultUserData": true,
    "@aws-cdk/aws-secretsmanager:useAttachedSecretResourcePolicyForSecretTargetAttachments": true,
    "@aws-cdk/aws-redshift:columnId": true,
    "@aws-cdk/aws-stepfunctions-tasks:enableLogging": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-efs:mountTargetOrderInsensitiveLogicalId": true,
    "@aws-cdk/aws-rds:auroraClusterChangeScopeOfInstanceParameterGroupWithEachParameters": true,
    "@aws-cdk/aws-appsync:useArnForSourceApiAssociationIdentifier": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForSourceAction": true
  }
}
```

## Deployment Instructions

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Bootstrap CDK (if not done before):**
```bash
cdk bootstrap aws://ACCOUNT-NUMBER/us-west-2
```

3. **Deploy the stack:**
```bash
cdk deploy
```

## Key Features Implemented

✅ **Serverless Architecture**: Lambda + API Gateway + S3
✅ **Regional Deployment**: Everything deployed to us-west-2
✅ **S3 Versioning**: Enabled with lifecycle rules for old versions
✅ **Comprehensive Logging**: CloudWatch logs for both API Gateway and Lambda
✅ **Cost Tracking Tags**: Applied at stack level
✅ **Security Best Practices**: 
- IAM roles with least privilege
- S3 bucket with encryption and blocked public access
- CORS configuration
✅ **Environment Variables**: Configurable Lambda runtime
✅ **Dynamic Values**: Using CloudFormation intrinsic functions
✅ **Monitoring**: API Gateway metrics and access logs enabled
✅ **Error Handling**: Comprehensive error handling in Lambda

## API Endpoints

- **POST /data**: Store data in S3
- **GET /data**: List recent objects in S3  
- **GET /health**: Health check endpoint

The infrastructure follows AWS best practices and is production-ready!