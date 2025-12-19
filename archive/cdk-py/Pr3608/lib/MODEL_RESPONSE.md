```python

### Reasoning Trace
---

The user wants a CDK Python project that creates a serverless stack with:

1. S3 bucket with versioning enabled
2. Lambda function that:
   - Gets triggered when JSON files are uploaded to S3
   - Can also be triggered via API Gateway
   - Reads JSON files
   - Processes contents
   - Handles bad/corrupt JSON gracefully
   - Logs to CloudWatch
   - Writes results back to S3 bucket
3. API Gateway with:
   - Usage plan
   - API key for access control
4. IAM roles/policies that are locked down:
   - Lambda should only have permissions to write to S3 bucket and read from it
   - CloudWatch logs permissions
5. Tags for cost allocation (Environment=Production, Department=IT)

I need to create:
- main.py with the CDK stack
- Lambda function code (as inline code or separate file)
- Proper IAM policies
- S3 bucket with versioning
- API Gateway with usage plan and API key
- Event notification from S3 to Lambda
- All resources properly tagged

Let me structure this properly.
### Answer 
---

I'll create a comprehensive CDK Python project that sets up your serverless stack. Here's the complete implementation:

## Project Structure

```
cdk-serverless-json-processor/
├── app.py
├── main.py
├── lambda_function.py
├── requirements.txt
└── cdk.json
```

## 1. First, let's create the `app.py` file (CDK app entry point):

```python
#!/usr/bin/env python3
import aws_cdk as cdk
from main import ServerlessJsonProcessorStack

app = cdk.App()

# Create the stack with tags
ServerlessJsonProcessorStack(
    app, 
    "ServerlessJsonProcessorStack",
    env=cdk.Environment(
        account=app.account,
        region=app.region
    ),
    tags={
        "Environment": "Production",
        "Department": "IT"
    }
)

app.synth()
```

## 2. The main stack implementation in `main.py`:

```python
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_apigateway as apigateway,
    aws_logs as logs,
    aws_s3_notifications as s3_notifications,
    RemovalPolicy,
    Duration
)
from constructs import Construct
import os

class ServerlessJsonProcessorStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create S3 bucket with versioning enabled
        json_bucket = s3.Bucket(
            self, "JsonProcessorBucket",
            bucket_name=f"json-processor-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # For dev/test - change for production
            auto_delete_objects=True,  # For dev/test - change for production
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30)
                )
            ]
        )

        # Create IAM role for Lambda with minimal permissions
        lambda_role = iam.Role(
            self, "JsonProcessorLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for JSON processor Lambda function"
        )

        # Add CloudWatch Logs permissions
        lambda_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
        )

        # Add specific S3 permissions - only for this bucket
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                ],
                resources=[
                    json_bucket.arn_for_objects("*")
                ]
            )
        )

        # Add S3 list bucket permission
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:ListBucket"
                ],
                resources=[json_bucket.bucket_arn]
            )
        )

        # Read Lambda function code
        with open("lambda_function.py", "r") as f:
            lambda_code = f.read()

        # Create Lambda function
        json_processor_lambda = lambda_.Function(
            self, "JsonProcessorFunction",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_inline(lambda_code),
            handler="index.lambda_handler",
            role=lambda_role,
            timeout=Duration.seconds(60),
            memory_size=512,
            environment={
                "BUCKET_NAME": json_bucket.bucket_name,
                "LOG_LEVEL": "INFO"
            },
            description="Processes JSON files uploaded to S3",
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Add S3 event notification for JSON files
        json_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3_notifications.LambdaDestination(json_processor_lambda),
            s3.NotificationKeyFilter(suffix=".json")
        )

        # Create API Gateway
        api = apigateway.RestApi(
            self, "JsonProcessorApi",
            rest_api_name="JSON Processor API",
            description="API for processing JSON files",
            deploy_options={
                "stage_name": "prod",
                "throttling_rate_limit": 100,
                "throttling_burst_limit": 200,
                "logging_level": apigateway.MethodLoggingLevel.INFO,
                "data_trace_enabled": True
            },
            cloud_watch_role=True
        )

        # Create usage plan
        usage_plan = api.add_usage_plan(
            "JsonProcessorUsagePlan",
            name="JSON Processor Usage Plan",
            description="Usage plan for JSON processor API",
            throttle={
                "rate_limit": 100,
                "burst_limit": 200
            },
            quota={
                "limit": 10000,
                "period": apigateway.Period.MONTH
            }
        )

        # Create API key
        api_key = api.add_api_key(
            "JsonProcessorApiKey",
            api_key_name="json-processor-api-key",
            description="API key for JSON processor"
        )

        # Associate API key with usage plan
        usage_plan.add_api_key(api_key)

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            json_processor_lambda,
            request_templates={
                "application/json": '{ "statusCode": "200" }'
            }
        )

        # Add POST method to process JSON
        process_resource = api.root.add_resource("process")
        process_method = process_resource.add_method(
            "POST",
            lambda_integration,
            api_key_required=True,
            method_responses=[
                {
                    "statusCode": "200",
                    "responseParameters": {
                        "method.response.header.Content-Type": True
                    }
                },
                {
                    "statusCode": "400",
                    "responseParameters": {
                        "method.response.header.Content-Type": True
                    }
                },
                {
                    "statusCode": "500",
                    "responseParameters": {
                        "method.response.header.Content-Type": True
                    }
                }
            ]
        )

        # Associate usage plan with API stage
        usage_plan.add_api_stage(
            stage=api.deployment_stage
        )

        # Output important values
        cdk.CfnOutput(
            self, "BucketName",
            value=json_bucket.bucket_name,
            description="Name of the S3 bucket for JSON files"
        )

        cdk.CfnOutput(
            self, "ApiEndpoint",
            value=api.url + "process",
            description="API Gateway endpoint URL"
        )

        cdk.CfnOutput(
            self, "ApiKeyId",
            value=api_key.key_id,
            description="API Key ID (retrieve actual key from console)"
        )

        cdk.CfnOutput(
            self, "LambdaFunctionName",
            value=json_processor_lambda.function_name,
            description="Name of the Lambda function"
        )
```

## 3. The Lambda function code in `lambda_function.py`:

```python
import json
import boto3
import os
import logging
from datetime import datetime
import traceback
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize S3 client
s3_client = boto3.client('s3')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process JSON files from S3 or API Gateway triggers.
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Check if triggered by S3 or API Gateway
        if 'Records' in event and event['Records']:
            # S3 trigger
            return handle_s3_event(event)
        else:
            # API Gateway trigger
            return handle_api_event(event)
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            }),
            'headers': {
                'Content-Type': 'application/json'
            }
        }

def handle_s3_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle S3 event notifications."""
    results = []
    
    for record in event['Records']:
        # Extract bucket and key information
        bucket_name = record['s3']['bucket']['name']
        object_key = record['s3']['object']['key']
        
        logger.info(f"Processing S3 object: s3://{bucket_name}/{object_key}")
        
        result = process_json_file(bucket_name, object_key)
        results.append(result)
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'S3 files processed successfully',
            'results': results
        })
    }

def handle_api_event(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle API Gateway requests."""
    try:
        # Parse request body
        if 'body' not in event:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'No request body provided'}),
                'headers': {'Content-Type': 'application/json'}
            }
        
        # Handle base64 encoding from API Gateway
        body = event['body']
        if event.get('isBase64Encoded', False):
            import base64
            body = base64.b64decode(body).decode('utf-8')
        
        # Parse JSON
        try:
            json_data = json.loads(body)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in request body: {str(e)}")
            return {
                'statusCode': 400,
                'body': json.dumps({
                    'error': 'Invalid JSON',
                    'message': str(e)
                }),
                'headers': {'Content-Type': 'application/json'}
            }
        
        # Process the JSON data
        bucket_name = os.environ['BUCKET_NAME']
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        object_key = f"api-uploads/json_{timestamp}.json"
        
        # Upload to S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=object_key,
            Body=json.dumps(json_data, indent=2),
            ContentType='application/json'
        )
        
        # Process the file
        result = process_json_file(bucket_name, object_key)
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'JSON processed successfully',
                'result': result
            }),
            'headers': {'Content-Type': 'application/json'}
        }
        
    except Exception as e:
        logger.error(f"Error handling API request: {str(e)}")
        logger.error(traceback.format_exc())
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Processing failed',
                'message': str(e)
            }),
            'headers': {'Content-Type': 'application/json'}
        }

def process_json_file(bucket_name: str, object_key: str) -> Dict[str, Any]:
    """Process a JSON file from S3."""
    try:
        # Read file from S3
        logger.info(f"Reading file from S3: s3://{bucket_name}/{object_key}")
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        content = response['Body'].read().decode('utf-8')
        
        # Parse JSON
        try:
            json_data = json.loads(content)
            logger.info(f"Successfully parsed JSON with {len(json_data) if isinstance(json_data, (list, dict)) else 1} items")
            
            # Process the JSON (example processing)
            processing_result = {
                'original_file': object_key,
                'timestamp': datetime.now().isoformat(),
                'status': 'success',
                'data_type': type(json_data).__name__,
                'item_count': len(json_data) if isinstance(json_data, (list, dict)) else 1
            }
            
            # If it's a dict, add some metadata
            if isinstance(json_data, dict):
                processing_result['keys'] = list(json_data.keys())
            
            # Write results back to S3
            result_key = f"processed/{object_key.replace('.json', '')}_result.json"
            s3_client.put_object(
                Bucket=bucket_name,
                Key=result_key,
                Body=json.dumps(processing_result, indent=2),
                ContentType='application/json'
            )
            
            logger.info(f"Results written to s3://{bucket_name}/{result_key}")
            
            return {
                'status': 'success',
                'input_file': object_key,
                'output_file': result_key,
                'processing_result': processing_result
            }
            
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON in file {object_key}: {str(e)}")
            
            # Write error report to S3
            error_result = {
                'original_file': object_key,
                'timestamp': datetime.now().isoformat(),
                'status': 'error',
                'error_type': 'JSONDecodeError',
                'error_message': str(e),
                'error_position': f"Line {e.lineno}, Column {e.colno}" if hasattr(e, 'lineno') else "Unknown"
            }
            
            error_key = f"errors/{object_key.replace('.json', '')}_error.json"
            s3_client.put_object(
                Bucket=bucket_name,
                Key=error_key,
                Body=json.dumps(error_result, indent=2),
                ContentType='application/json'
            )
            
            return {
                'status': 'error',
                'input_file': object_key,
                'error_file': error_key,
                'error': 'Invalid JSON format',
                'details': str(e)
            }
            
    except Exception as e:
        logger.error(f"Error processing file {object_key}: {str(e)}")
        logger.error(traceback.format_exc())
        
        return {
            'status': 'error',
            'input_file': object_key,
            'error': str(e)
        }
```

## 4. The `requirements.txt` file:

```txt
aws-cdk-lib==2.110.0
constructs>=10.0.0,<11.0.0
```

## 5. The `cdk.json` configuration file:

```json
{
  "app": "python3 app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__init__.py",
      "python/__pycache__",
      "tests"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:preventDefaultSecurityGroupRules": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-s3:serverAccessLogsUseBucketPolicy": true
  }
}
```

## How to Deploy

1. **Initialize the project:**
```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize CDK (if not done before)
cdk bootstrap
```

2. **Deploy the stack:**
```bash
# Synthesize CloudFormation template
cdk synth

# Deploy the stack
cdk deploy
```

3. **Test the deployment:**

**Via S3 upload:**
```bash
# Create a test JSON file
echo '{"message": "Hello, World!", "timestamp": "'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}' > test.json

# Upload to S3 (replace bucket name with output from deployment)
aws s3 cp test.json s3://json-processor-<account>-<region>/test.json
```

**Via API Gateway:**
```bash
# Get API key value from AWS Console (CDK output shows key ID)
# Then make a request:
curl -X POST https://<api-id>.execute-api.<region>.amazonaws.com/prod/process \
  -H "x-api-key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello from API", "data": [1,2,3]}'
```

## Key Features Implemented

1. **S3 Bucket:**
   - Versioning enabled
   - Encryption at rest
   - Lifecycle rules for old versions
   - Event notifications for .json files

2. **Lambda Function:**
   - Handles both S3 and API Gateway triggers
   - Graceful error handling for invalid JSON
   - Comprehensive logging to CloudWatch
   - Writes results back to S3

3. **API Gateway:**
   - REST API with usage plan
   - API key authentication
   - Rate limiting (100 req/sec)
   - Monthly quota (10,000 requests)

4. **IAM Security:**
   - Principle of least privilege
   - Lambda can only access the specific S3 bucket
   - No unnecessary permissions

5. **Cost Allocation Tags:**
   - All resources tagged with Environment=Production
   - All resources tagged with Department=IT

The Lambda function will create three folders in your S3 bucket:
- `api-uploads/` - JSON files uploaded via API
- `processed/` - Successfully processed results
- `errors/` - Error reports for invalid JSON files

```