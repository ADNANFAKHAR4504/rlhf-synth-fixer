I'll design and implement a production-ready, event-driven serverless architecture using AWS CDK with Python. This solution will handle automatic processing, notification, and tracking of S3 object uploads.

##  Project Structure

```
serverless-s3-processor/
 app.py                 # CDK app entry point
 serverless_s3_processor/
    __init__.py
    stack.py           # Main CDK stack
    lambda_functions/
        __init__.py
        processor/
            __init__.py
            handler.py # Lambda function code
 requirements.txt
 cdk.json
```

##  Implementation

### 1. CDK App Entry Point (`app.py`)

```python
#!/usr/bin/env python3
import aws_cdk as cdk
from serverless_s3_processor.stack import ServerlessS3ProcessorStack

app = cdk.App()

# Get environment suffix from context or default to 'dev'
env_suffix = app.node.try_get_context("env_suffix") or "dev"
email_address = app.node.try_get_context("email_address") or "admin@example.com"

ServerlessS3ProcessorStack(
    app, 
    f"ServerlessS3ProcessorStack-{env_suffix}",
    env_suffix=env_suffix,
    email_address=email_address,
    env=cdk.Environment(region="us-east-1")
)

app.synth()
```

### 2. Main CDK Stack (`serverless_s3_processor/stack.py`)

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_dynamodb as dynamodb,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_s3_notifications as s3n,
    aws_logs as logs,
    CfnOutput,
    Tags
)
from constructs import Construct
import os


class ServerlessS3ProcessorStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, env_suffix: str, email_address: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.env_suffix = env_suffix
        self.email_address = email_address
        
        # Apply tags to all resources in this stack
        Tags.of(self).add("env", env_suffix)
        
        # Create VPC for Lambda
        self.vpc = self._create_vpc()
        
        # Create DynamoDB table
        self.dynamodb_table = self._create_dynamodb_table()
        
        # Create SNS topic
        self.sns_topic = self._create_sns_topic()
        
        # Create S3 bucket
        self.s3_bucket = self._create_s3_bucket()
        
        # Create Lambda function
        self.lambda_function = self._create_lambda_function()
        
        # Create API Gateway
        self.api_gateway = self._create_api_gateway()
        
        # Set up S3 event notification
        self._setup_s3_notification()
        
        # Create outputs
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC for Lambda function"""
        vpc = ec2.Vpc(
            self, f"ProcessorVPC-{self.env_suffix}",
            max_azs=2,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="private-subnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="public-subnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ]
        )
        return vpc

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table for storing object metadata"""
        table = dynamodb.Table(
            self, f"ObjectMetadataTable-{self.env_suffix}",
            table_name=f"s3-object-metadata-{self.env_suffix}",
            partition_key=dynamodb.Attribute(
                name="objectKey",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="uploadTime",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True
        )
        return table

    def _create_sns_topic(self) -> sns.Topic:
        """Create SNS topic for notifications"""
        topic = sns.Topic(
            self, f"S3ProcessorTopic-{self.env_suffix}",
            topic_name=f"s3-processor-notifications-{self.env_suffix}",
            display_name=f"S3 Object Processor Notifications ({self.env_suffix})"
        )
        
        # Subscribe email to the topic
        topic.add_subscription(
            sns_subscriptions.EmailSubscription(self.email_address)
        )
        
        return topic

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with AES-256 encryption"""
        bucket = s3.Bucket(
            self, f"ProcessorBucket-{self.env_suffix}",
            bucket_name=f"s3-processor-bucket-{self.env_suffix}-{self.account}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,  # For development/testing
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL
        )
        return bucket

    def _create_lambda_function(self) -> _lambda.Function:
        """Create Lambda function with proper IAM permissions"""
        
        # Create Lambda execution role
        lambda_role = iam.Role(
            self, f"LambdaExecutionRole-{self.env_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ]
        )
        
        # Add specific permissions following least-privilege principle
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion"
                ],
                resources=[f"{self.s3_bucket.bucket_arn}/*"]
            )
        )
        
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem"
                ],
                resources=[self.dynamodb_table.table_arn]
            )
        )
        
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["sns:Publish"],
                resources=[self.sns_topic.topic_arn]
            )
        )
        
        # Create Lambda function
        lambda_function = _lambda.Function(
            self, f"S3ProcessorFunction-{self.env_suffix}",
            function_name=f"s3-processor-{self.env_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="handler.lambda_handler",
            code=_lambda.Code.from_asset("serverless_s3_processor/lambda_functions/processor"),
            role=lambda_role,
            vpc=self.vpc,
            timeout=Duration.seconds(30),
            reserved_concurrent_executions=10,  # Based on historical usage
            environment={
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "SNS_TOPIC_ARN": self.sns_topic.topic_arn,
                "TIMEOUT_SECONDS": "30",
                "ENV_SUFFIX": self.env_suffix
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )
        
        return lambda_function

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway for HTTP access to Lambda"""
        api = apigateway.RestApi(
            self, f"S3ProcessorAPI-{self.env_suffix}",
            rest_api_name=f"s3-processor-api-{self.env_suffix}",
            description=f"API for S3 Processor Lambda ({self.env_suffix})",
            endpoint_configuration=apigateway.EndpointConfiguration(
                types=[apigateway.EndpointType.REGIONAL]
            )
        )
        
        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.lambda_function,
            request_templates={"application/json": '{ "statusCode": "200" }'}
        )
        
        # Add resource and method
        process_resource = api.root.add_resource("process")
        process_resource.add_method("POST", lambda_integration)
        
        return api

    def _setup_s3_notification(self):
        """Setup S3 event notification to trigger Lambda"""
        self.s3_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.lambda_function),
            s3.NotificationKeyFilter(prefix="uploads/")  # Optional: filter by prefix
        )

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="Name of the S3 bucket"
        )
        
        CfnOutput(
            self, "APIGatewayURL",
            value=self.api_gateway.url,
            description="API Gateway endpoint URL"
        )
        
        CfnOutput(
            self, "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Name of the Lambda function"
        )
        
        CfnOutput(
            self, "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="Name of the DynamoDB table"
        )
        
        CfnOutput(
            self, "SNSTopicArn",
            value=self.sns_topic.topic_arn,
            description="ARN of the SNS topic"
        )
```

### 3. Lambda Function Code (`serverless_s3_processor/lambda_functions/processor/handler.py`)

```python
import json
import boto3
import os
import logging
from datetime import datetime
from typing import Dict, Any
from urllib.parse import unquote_plus

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')
s3 = boto3.client('s3')

# Environment variables
DYNAMODB_TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
SNS_TOPIC_ARN = os.environ['SNS_TOPIC_ARN']
ENV_SUFFIX = os.environ.get('ENV_SUFFIX', 'dev')

# Initialize DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE_NAME)


def lambda_handler(event: Dict[str, Any], context) -> Dict[str, Any]:
    """
    Lambda handler for processing S3 events and API Gateway requests
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Determine event source
        if 'Records' in event:
            # S3 event
            return handle_s3_event(event, context)
        elif 'httpMethod' in event:
            # API Gateway event
            return handle_api_gateway_event(event, context)
        else:
            logger.warning("Unknown event source")
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Unknown event source'})
            }
            
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }


def handle_s3_event(event: Dict[str, Any], context) -> Dict[str, Any]:
    """Handle S3 object creation events"""
    processed_objects = []
    
    for record in event['Records']:
        if record['eventSource'] == 'aws:s3':
            bucket_name = record['s3']['bucket']['name']
            object_key = unquote_plus(record['s3']['object']['key'])
            object_size = record['s3']['object']['size']
            event_time = record['eventTime']
            
            logger.info(f"Processing S3 object: {object_key} in bucket: {bucket_name}")
            
            # Get additional object metadata
            try:
                s3_response = s3.head_object(Bucket=bucket_name, Key=object_key)
                content_type = s3_response.get('ContentType', 'unknown')
                last_modified = s3_response.get('LastModified')
                etag = s3_response.get('ETag', '').strip('"')
            except Exception as e:
                logger.error(f"Error getting S3 object metadata: {str(e)}")
                content_type = 'unknown'
                last_modified = None
                etag = 'unknown'
            
            # Store metadata in DynamoDB
            metadata = {
                'objectKey': object_key,
                'uploadTime': event_time,
                'bucketName': bucket_name,
                'objectSize': object_size,
                'contentType': content_type,
                'etag': etag,
                'processedAt': datetime.utcnow().isoformat(),
                'environment': ENV_SUFFIX
            }
            
            if last_modified:
                metadata['lastModified'] = last_modified.isoformat()
            
            try:
                table.put_item(Item=metadata)
                logger.info(f"Stored metadata for {object_key} in DynamoDB")
            except Exception as e:
                logger.error(f"Error storing metadata in DynamoDB: {str(e)}")
                raise
            
            # Send SNS notification
            try:
                message = {
                    'event': 'S3 Object Processed',
                    'bucket': bucket_name,
                    'objectKey': object_key,
                    'objectSize': object_size,
                    'contentType': content_type,
                    'processedAt': metadata['processedAt'],
                    'environment': ENV_SUFFIX
                }
                
                sns.publish(
                    TopicArn=SNS_TOPIC_ARN,
                    Subject=f'S3 Object Processed - {ENV_SUFFIX}',
                    Message=json.dumps(message, indent=2)
                )
                logger.info(f"Sent SNS notification for {object_key}")
            except Exception as e:
                logger.error(f"Error sending SNS notification: {str(e)}")
                # Don't raise here as we don't want to fail the entire process
            
            processed_objects.append({
                'objectKey': object_key,
                'bucketName': bucket_name,
                'status': 'processed'
            })
    
    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'S3 objects processed successfully',
            'processedObjects': processed_objects
        })
    }


def handle_api_gateway_event(event: Dict[str, Any], context) -> Dict[str, Any]:
    """Handle API Gateway requests"""
    http_method = event['httpMethod']
    path = event['path']
    
    logger.info(f"API Gateway request: {http_method} {path}")
    
    if http_method == 'POST' and path == '/process':
        # Manual trigger - could process specific objects or return status
        try:
            # Get request body if present
            body = {}
            if event.get('body'):
                body = json.loads(event['body'])
            
            # Return system status
            response_data = {
                'message': 'S3 Processor is running',
                'environment': ENV_SUFFIX,
                'timestamp': datetime.utcnow().isoformat(),
                'functionName': context.function_name,
                'requestId': context.aws_request_id
            }
            
            # If specific bucket/key provided, could process that object
            if body.get('bucket') and body.get('key'):
                # Simulate processing a specific object
                response_data['manualProcessing'] = {
                    'bucket': body['bucket'],
                    'key': body['key'],
                    'status': 'triggered'
                }
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(response_data)
            }
            
        except Exception as e:
            logger.error(f"Error handling API Gateway request: {str(e)}")
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': str(e)})
            }
    
    return {
        'statusCode': 404,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({'error': 'Not found'})
    }
```

### 4. Requirements (`requirements.txt`)

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
boto3>=1.28.0
```

### 5. CDK Configuration (`cdk.json`)

```json
{
  "app": "python app.py",
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
      "**/*.pyc"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": [
      "aws",
      "aws-cn"
    ],
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": true,
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
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfiguration": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-nordicapis-northamerica:includeApiGatewayAccountIdInStackName": true,
    "@aws-cdk/aws-ec2:ebsDefaultGp3Volume": true,
    "@aws-cdk/aws-ecs-patterns:removeDefaultDesiredCount": true,
    "@aws-cdk/aws-rds:preventRenderingDeprecatedCredentials": true,
    "@aws-cdk/aws-codepipeline-actions:useNewDefaultBranchForCodeCommitSource": true,
    "@aws-cdk/aws-cloudwatch-actions:changeLambdaPermissionLogicalIdForLambdaAction": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeysDefaultValueToFalse": true,
    "@aws-cdk/aws-codepipeline:defaultPipelineTypeToV2": true,
    "@aws-cdk/aws-kms:reduceCrossAccountRegionPolicyScope": true,
    "@aws-cdk/aws-eks:nodegroupNameAttribute": true,
    "@aws-cdk/aws-ec2:attributeDefaultInstanceTenancy": true,
    "@aws-cdk/aws-rds:setCorrectValueForDatabaseInstanceReadReplicaInstanceResourceId": true,
    "@aws-cdk/aws-route53-resolver:removeEmptyDnsFirewallRuleTargets": true,
    "@aws-cdk/aws-lambda:useCodeSigningConfigResource": true
  }
}
```

##  Deployment Instructions

### 1. Setup Environment

```bash
# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install CDK CLI if not already installed
npm install -g aws-cdk
```

### 2. Deploy the Stack

```bash
# Bootstrap CDK (first time only)
cdk bootstrap aws://ACCOUNT-NUMBER/us-east-1

# Deploy with custom parameters
cdk deploy -c env_suffix=prod -c email_address=your-email@example.com

# Or deploy with default values
cdk deploy
```

### 3. Test the Deployment

```bash
# Upload a test file to S3
aws s3 cp test-file.txt s3://s3-processor-bucket-prod-ACCOUNT-NUMBER/uploads/

# Test API Gateway endpoint
curl -X POST https://your-api-id.execute-api.us-east-1.amazonaws.com/prod/process \
  -H "Content-Type: application/json" \
  -d '{"bucket": "your-bucket", "key": "test-file.txt"}'
```

##  Key Features Implemented

###  **Architecture Requirements Met**

1. **S3 Bucket**: AES-256 encryption, proper tagging
2. **Lambda Function**: Python, VPC deployment, 30s timeout, proper IAM permissions
3. **SNS Topic**: Email notifications for S3 events
4. **API Gateway**: REST API for HTTP access to Lambda
5. **DynamoDB**: Metadata storage with partition and sort keys
6. **IAM Roles**: Least-privilege permissions

###  **Security Best Practices**

- **Least-privilege IAM roles** with scoped permissions
- **VPC deployment** for Lambda isolation
- **S3 bucket encryption** with server-side encryption
- **Block public access** on S3 bucket
- **Proper error handling** and logging

###  **Monitoring & Observability**

- **CloudWatch Logs** integration
- **Structured logging** in Lambda
- **Error handling** with proper status codes
- **CloudFormation outputs** for resource references

###  **Scalability & Performance**

- **Reserved concurrent executions** for Lambda
- **DynamoDB on-demand billing** for automatic scaling
- **Regional API Gateway** for better performance
- **Proper timeout configuration**

This architecture provides a robust, production-ready solution for processing S3 events with proper monitoring, security, and scalability considerations.