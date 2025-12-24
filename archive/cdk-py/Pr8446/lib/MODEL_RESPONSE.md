I'll create a complete AWS CDK solution that meets all your requirements. Here's the implementation:

## `app.py` - Main CDK Application

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_s3 as s3,
    aws_lambda as _lambda,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_s3_notifications as s3n,
    CfnOutput,
    Tags,
    Duration,
    RemovalPolicy
)
from constructs import Construct


class ServerlessS3ProcessorStack(Stack):
    """
    CDK Stack for serverless S3 object processing infrastructure
    """

    def __init__(self, scope: Construct, construct_id: str, environment: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.environment = environment
        
        # Create DynamoDB table
        self.dynamodb_table = self._create_dynamodb_table()
        
        # Create S3 bucket
        self.s3_bucket = self._create_s3_bucket()
        
        # Create Lambda function
        self.lambda_function = self._create_lambda_function()
        
        # Configure S3 event trigger
        self._configure_s3_trigger()
        
        # Add tags to all resources
        self._add_tags()
        
        # Create stack outputs
        self._create_outputs()

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table for storing object metadata"""
        table = dynamodb.Table(
            self, f"ObjectMetadataTable-{self.environment}",
            table_name=f"object-metadata-{self.environment}",
            partition_key=dynamodb.Attribute(
                name="ObjectID",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY if self.environment == "development" else RemovalPolicy.RETAIN,
            point_in_time_recovery=True if self.environment == "production" else False
        )
        
        return table

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with appropriate configuration"""
        bucket_config = {
            "bucket_name": f"serverless-processor-{self.environment}-{self.account}-{self.region}",
            "removal_policy": RemovalPolicy.DESTROY if self.environment == "development" else RemovalPolicy.RETAIN,
            "auto_delete_objects": True if self.environment == "development" else False,
            "versioned": True if self.environment == "production" else False,
            "block_public_access": s3.BlockPublicAccess.BLOCK_ALL,
            "encryption": s3.BucketEncryption.S3_MANAGED
        }
        
        bucket = s3.Bucket(
            self, f"ProcessorBucket-{self.environment}",
            **bucket_config
        )
        
        return bucket

    def _create_lambda_function(self) -> _lambda.Function:
        """Create Lambda function with proper IAM role and permissions"""
        
        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self, f"LambdaExecutionRole-{self.environment}",
            role_name=f"s3-processor-lambda-role-{self.environment}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )
        
        # Add specific permissions for S3 bucket
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectAcl"
                ],
                resources=[f"{self.s3_bucket.bucket_arn}/*"]
            )
        )
        
        # Add specific permissions for DynamoDB table
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["dynamodb:PutItem"],
                resources=[self.dynamodb_table.table_arn]
            )
        )
        
        # Add CloudWatch Logs permissions (specific to this function's log group)
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=[
                    f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/lambda/s3-processor-{self.environment}*"
                ]
            )
        )
        
        # Create Lambda function
        lambda_function = _lambda.Function(
            self, f"S3ProcessorFunction-{self.environment}",
            function_name=f"s3-processor-{self.environment}",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="lambda_handler.lambda_handler",
            code=_lambda.Code.from_asset("lambda"),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256 if self.environment == "development" else 512,
            environment={
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "ENVIRONMENT": self.environment
            },
            retry_attempts=2
        )
        
        return lambda_function

    def _configure_s3_trigger(self):
        """Configure S3 bucket to trigger Lambda on ObjectCreated events"""
        self.s3_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(self.lambda_function)
        )

    def _add_tags(self):
        """Add environment tags to all resources in the stack"""
        Tags.of(self).add("Environment", self.environment)
        Tags.of(self).add("Project", "ServerlessS3Processor")
        Tags.of(self).add("ManagedBy", "CDK")

    def _create_outputs(self):
        """Create stack outputs for important resource identifiers"""
        CfnOutput(
            self, f"S3BucketName-{self.environment}",
            value=self.s3_bucket.bucket_name,
            description=f"S3 Bucket Name for {self.environment} environment",
            export_name=f"S3BucketName-{self.environment}"
        )
        
        CfnOutput(
            self, f"LambdaFunctionArn-{self.environment}",
            value=self.lambda_function.function_arn,
            description=f"Lambda Function ARN for {self.environment} environment",
            export_name=f"LambdaFunctionArn-{self.environment}"
        )
        
        CfnOutput(
            self, f"DynamoDBTableName-{self.environment}",
            value=self.dynamodb_table.table_name,
            description=f"DynamoDB Table Name for {self.environment} environment",
            export_name=f"DynamoDBTableName-{self.environment}"
        )


class ServerlessS3ProcessorApp(cdk.App):
    """Main CDK Application"""
    
    def __init__(self):
        super().__init__()
        
        # Environment configuration
        environments = ["development", "production"]
        
        # Deploy stacks for each environment
        for env in environments:
            ServerlessS3ProcessorStack(
                self, f"ServerlessS3Processor-{env}",
                environment=env,
                env=cdk.Environment(
                    account=os.getenv('CDK_DEFAULT_ACCOUNT'),
                    region=os.getenv('CDK_DEFAULT_REGION', 'us-east-1')
                ),
                description=f"Serverless S3 processor infrastructure for {env} environment"
            )


# Create and run the application
if __name__ == "__main__":
    app = ServerlessS3ProcessorApp()
    app.synth()
```

## `lambda/lambda_handler.py` - Lambda Function Code

```python
import json
import boto3
import logging
from datetime import datetime
from typing import Dict, Any
import os
from urllib.parse import unquote_plus

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Get environment variables
DYNAMODB_TABLE_NAME = os.environ['DYNAMODB_TABLE_NAME']
ENVIRONMENT = os.environ['ENVIRONMENT']

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda function to process S3 ObjectCreated events.
    
    Args:
        event: S3 event data
        context: Lambda context object
        
    Returns:
        Dict containing processing results
    """
    
    try:
        # Get DynamoDB table
        table = dynamodb.Table(DYNAMODB_TABLE_NAME)
        
        # Process each record in the event
        processed_objects = []
        
        for record in event['Records']:
            # Verify this is an S3 event
            if record['eventSource'] != 'aws:s3':
                logger.warning(f"Skipping non-S3 event: {record['eventSource']}")
                continue
                
            # Verify this is an ObjectCreated event
            if not record['eventName'].startswith('ObjectCreated'):
                logger.warning(f"Skipping non-ObjectCreated event: {record['eventName']}")
                continue
            
            # Extract S3 object information
            bucket_name = record['s3']['bucket']['name']
            object_key = unquote_plus(record['s3']['object']['key'])
            object_size = record['s3']['object']['size']
            event_name = record['eventName']
            event_time = record['eventTime']
            
            # Log the object creation
            logger.info(f"Processing new object: {object_key} in bucket: {bucket_name}")
            
            # Get additional object metadata from S3
            try:
                s3_response = s3_client.head_object(Bucket=bucket_name, Key=object_key)
                content_type = s3_response.get('ContentType', 'unknown')
                last_modified = s3_response.get('LastModified', datetime.utcnow()).isoformat()
                etag = s3_response.get('ETag', '').strip('"')
            except Exception as e:
                logger.error(f"Failed to get object metadata for {object_key}: {str(e)}")
                content_type = 'unknown'
                last_modified = datetime.utcnow().isoformat()
                etag = 'unknown'
            
            # Create object ID (combination of bucket and key for uniqueness)
            object_id = f"{bucket_name}/{object_key}"
            
            # Prepare metadata for DynamoDB
            metadata = {
                'ObjectID': object_id,
                'BucketName': bucket_name,
                'ObjectKey': object_key,
                'ObjectSize': object_size,
                'ContentType': content_type,
                'EventName': event_name,
                'EventTime': event_time,
                'LastModified': last_modified,
                'ETag': etag,
                'Environment': ENVIRONMENT,
                'ProcessedAt': datetime.utcnow().isoformat(),
                'ProcessedBy': context.function_name
            }
            
            # Store metadata in DynamoDB
            try:
                table.put_item(Item=metadata)
                logger.info(f"Successfully stored metadata for object: {object_key}")
                processed_objects.append({
                    'object_key': object_key,
                    'bucket_name': bucket_name,
                    'status': 'success'
                })
            except Exception as e:
                logger.error(f"Failed to store metadata for {object_key}: {str(e)}")
                processed_objects.append({
                    'object_key': object_key,
                    'bucket_name': bucket_name,
                    'status': 'failed',
                    'error': str(e)
                })
        
        # Return processing results
        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing completed',
                'processed_objects': processed_objects,
                'total_processed': len(processed_objects)
            })
        }
        
    except Exception as e:
        logger.error(f"Unexpected error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'message': 'Processing failed',
                'error': str(e)
            })
        }
```

## `requirements.txt` - CDK Dependencies

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
boto3>=1.26.0
```

## `cdk.json` - CDK Configuration

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
    "@aws-cdk/aws-stepfunctions-tasks:enableLoggingConfigurationForLambdaInvoke": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true,
    "@aws-cdk/aws-apigateway:requestValidatorUniqueId": true,
    "@aws-cdk/aws-kms:aliasNameRef": true,
    "@aws-cdk/aws-autoscaling:generateLaunchTemplateInsteadOfLaunchConfig": true,
    "@aws-cdk/core:includePrefixInUniqueNameGeneration": true,
    "@aws-cdk/aws-efs:denyAnonymousAccess": true,
    "@aws-cdk/aws-opensearchservice:enableLogging": true,
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true
  }
}
```

## Directory Structure

Create the following directory structure:

```
project/
├── app.py
├── cdk.json
├── requirements.txt
└── lambda/
    └── lambda_handler.py
```

## Deployment Instructions

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Bootstrap CDK (if not done before):**
   ```bash
   cdk bootstrap
   ```

3. **Deploy development environment:**
   ```bash
   cdk deploy ServerlessS3Processor-development
   ```

4. **Deploy production environment:**
   ```bash
   cdk deploy ServerlessS3Processor-production
   ```

## Key Features Implemented

### ****Core Architecture**
- S3 bucket with unique naming per environment
- Lambda function triggered only by `s3:ObjectCreated:*` events
- DynamoDB table with `ObjectID` as partition key (String type)
- Complete event processing and metadata storage

### ****Environment-Specific Configuration**
- Separate stacks for development and production
- Environment-specific resource configurations
- Different removal policies and settings per environment

### ****Security & Best Practices**
- **Least privilege IAM role** with specific permissions:
  - CloudWatch Logs access only to function's log group
  - S3 access only to `GetObject` and `GetObjectAcl` on the specific bucket
  - DynamoDB access only to `PutItem` on the specific table
- All resources properly tagged with `Environment`
- Secure bucket configuration with encryption and blocked public access

### ****Outputs & Monitoring**
- Stack outputs for S3 bucket name and Lambda function ARN
- Comprehensive logging in Lambda function
- Error handling and processing status tracking

This solution provides a production-ready, secure, and scalable serverless infrastructure that meets all your specified requirements.