=== lib/tap_stack.py ===

```python
import pulumi
import pulumi_aws as aws
from typing import Dict, Any, Optional
import json

class TapStack:
    """
    AWS Serverless application stack with multi-region migration capabilities.
    Supports blue-green deployment and canary release strategies.
    """
    
    def __init__(self, stack_name: str):
        self.config = pulumi.Config()
        self.stack_name = stack_name
        
        # Validate required configuration
        self._validate_config()
        
        # Configuration values
        self.team_name = self.config.require("team_name")
        self.environment = self.config.require("environment")
        self.source_region = self.config.require("source_region")
        self.target_region = self.config.require("target_region")
        self.allowed_cidr = self.config.require("allowed_cidr")
        
        # Optional configuration with defaults
        self.traffic_shift_percentage = self.config.get_int("traffic_shift_percentage") or 10
        self.traffic_shift_interval = self.config.get_int("traffic_shift_interval") or 10
        self.enable_canary = self.config.get_bool("enable_canary") or False
        
        # Common tags
        self.common_tags = {
            "Owner": self.team_name,
            "Purpose": "ServerlessApp",
            "Environment": self.environment,
            "ManagedBy": "Pulumi"
        }
        
        # Create resources
        self._create_iam_roles()
        self._create_dynamodb_table()
        self._create_s3_bucket()
        self._create_lambda_function()
        self._create_api_gateway()
        self._create_monitoring()
        self._setup_cross_region_replication()
        
    def _validate_config(self):
        """Validate required configuration parameters"""
        required_configs = ["team_name", "environment", "source_region", "target_region", "allowed_cidr"]
        for config_key in required_configs:
            if not self.config.get(config_key):
                raise ValueError(f"Required configuration '{config_key}' is missing")
    
    def _get_resource_name(self, service_name: str) -> str:
        """Generate resource name following naming convention"""
        return f"{self.team_name}-{self.environment}-{service_name}"
    
    def _create_iam_roles(self):
        """Create IAM roles following least privilege principle"""
        
        # Lambda execution role
        lambda_assume_role_policy = {
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
        }
        
        self.lambda_role = aws.iam.Role(
            f"{self._get_resource_name('lambda')}-role",
            assume_role_policy=json.dumps(lambda_assume_role_policy),
            tags=self.common_tags
        )
        
        # Lambda policy for DynamoDB and CloudWatch
        lambda_policy = aws.iam.Policy(
            f"{self._get_resource_name('lambda')}-policy",
            policy=pulumi.Output.all(
                table_arn=lambda: self.dynamodb_table.arn if hasattr(self, 'dynamodb_table') else "*"
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": [
                            args["table_arn"] if args["table_arn"] != "*" else "*",
                            f"{args['table_arn']}/index/*" if args["table_arn"] != "*" else "*"
                        ]
                    }
                ]
            })),
            tags=self.common_tags
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self._get_resource_name('lambda')}-policy-attachment",
            role=self.lambda_role.name,
            policy_arn=lambda_policy.arn
        )
        
        # API Gateway CloudWatch role
        api_gateway_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "apigateway.amazonaws.com"
                    }
                }
            ]
        }
        
        self.api_gateway_role = aws.iam.Role(
            f"{self._get_resource_name('apigateway')}-role",
            assume_role_policy=json.dumps(api_gateway_assume_role_policy),
            tags=self.common_tags
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self._get_resource_name('apigateway')}-policy-attachment",
            role=self.api_gateway_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
        )
    
    def _create_dynamodb_table(self):
        """Create DynamoDB table with cross-region replication"""
        
        self.dynamodb_table = aws.dynamodb.Table(
            self._get_resource_name("dynamodb"),
            attributes=[
                {
                    "name": "id",
                    "type": "S"
                }
            ],
            hash_key="id",
            billing_mode="PAY_PER_REQUEST",
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery_enabled=True,
            tags=self.common_tags
        )
        
        # Create global table for cross-region replication
        self.dynamodb_global_table = aws.dynamodb.GlobalTable(
            self._get_resource_name("dynamodb-global"),
            billing_mode="PAY_PER_REQUEST",
            replicas=[
                {
                    "region_name": self.source_region,
                    "point_in_time_recovery": True
                },
                {
                    "region_name": self.target_region,
                    "point_in_time_recovery": True
                }
            ],
            tags=self.common_tags,
            opts=pulumi.ResourceOptions(depends_on=[self.dynamodb_table])
        )
    
    def _create_s3_bucket(self):
        """Create S3 bucket with cross-region replication"""
        
        # Source bucket
        self.s3_bucket = aws.s3.Bucket(
            self._get_resource_name("assets"),
            versioning={
                "enabled": True
            },
            tags=self.common_tags
        )
        
        # Target region bucket for replication
        target_provider = aws.Provider(
            f"target-{self.target_region}",
            region=self.target_region
        )
        
        self.s3_bucket_target = aws.s3.Bucket(
            f"{self._get_resource_name('assets')}-target",
            versioning={
                "enabled": True
            },
            tags=self.common_tags,
            opts=pulumi.ResourceOptions(provider=target_provider)
        )
        
        # Replication role
        replication_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "s3.amazonaws.com"
                    }
                }
            ]
        }
        
        self.s3_replication_role = aws.iam.Role(
            f"{self._get_resource_name('s3-replication')}-role",
            assume_role_policy=json.dumps(replication_assume_role_policy),
            tags=self.common_tags
        )
        
        # Replication policy
        s3_replication_policy = aws.iam.Policy(
            f"{self._get_resource_name('s3-replication')}-policy",
            policy=pulumi.Output.all(
                source_bucket_arn=self.s3_bucket.arn,
                target_bucket_arn=self.s3_bucket_target.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObjectVersionForReplication",
                            "s3:GetObjectVersionAcl"
                        ],
                        "Resource": f"{args['source_bucket_arn']}/*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ListBucket"
                        ],
                        "Resource": args["source_bucket_arn"]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ReplicateObject",
                            "s3:ReplicateDelete"
                        ],
                        "Resource": f"{args['target_bucket_arn']}/*"
                    }
                ]
            })),
            tags=self.common_tags
        )
        
        aws.iam.RolePolicyAttachment(
            f"{self._get_resource_name('s3-replication')}-policy-attachment",
            role=self.s3_replication_role.name,
            policy_arn=s3_replication_policy.arn
        )
        
        # Bucket replication configuration
        self.s3_bucket_replication = aws.s3.BucketReplication(
            f"{self._get_resource_name('assets')}-replication",
            bucket=self.s3_bucket.id,
            role=self.s3_replication_role.arn,
            rules=[
                {
                    "id": "ReplicateEverything",
                    "status": "Enabled",
                    "destination": {
                        "bucket": self.s3_bucket_target.arn,
                        "storage_class": "STANDARD"
                    }
                }
            ],
            opts=pulumi.ResourceOptions(depends_on=[self.s3_replication_role])
        )
        
        # Public read policy for static website hosting
        bucket_policy = aws.s3.BucketPolicy(
            f"{self._get_resource_name('assets')}-policy",
            bucket=self.s3_bucket.id,
            policy=self.s3_bucket.arn.apply(lambda arn: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "PublicReadGetObject",
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": "s3:GetObject",
                        "Resource": f"{arn}/*"
                    }
                ]
            }))
        )
        
        # Website configuration
        self.s3_bucket_website = aws.s3.BucketWebsite(
            f"{self._get_resource_name('assets')}-website",
            bucket=self.s3_bucket.id,
            index_document="index.html",
            error_document="error.html"
        )
    
    def _create_lambda_function(self):
        """Create Lambda function"""
        
        # Sample Lambda code
        lambda_code = """
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

def lambda_handler(event, context):
    try:
        # Handle different HTTP methods
        http_method = event.get('httpMethod', 'GET')
        
        if http_method == 'GET':
            # Get all items
            response = table.scan()
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps(response.get('Items', []))
            }
        
        elif http_method == 'POST':
            # Create new item
            body = json.loads(event.get('body', '{}'))
            item = {
                'id': body.get('id', str(datetime.now().timestamp())),
                'data': body.get('data', ''),
                'timestamp': datetime.now().isoformat()
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
        
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
"""
        
        self.lambda_function = aws.lambda_.Function(
            self._get_resource_name("lambda"),
            runtime="python3.9",
            code=pulumi.AssetArchive({
                "lambda_function.py": pulumi.StringAsset(lambda_code)
            }),
            handler="lambda_function.lambda_handler",
            role=self.lambda_role.arn,
            environment={
                "variables": {
                    "DYNAMODB_TABLE": self.dynamodb_table.name
                }
            },
            timeout=30,
            memory_size=128,
            tags=self.common_tags,
            opts=pulumi.ResourceOptions(depends_on=[self.lambda_role, self.dynamodb_table])
        )
        
        # Lambda log group
        self.lambda_log_group = aws.cloudwatch.LogGroup(
            f"{self._get_resource_name('lambda')}-logs",
            name=pulumi.Output.concat("/aws/lambda/", self.lambda_function.name),
            retention_in_days=14,
            tags=self.common_tags
        )
    
    def _create_api_gateway(self):
        """Create API Gateway with Lambda integration"""
        
        # REST API
        self.api_gateway = aws.apigateway.RestApi(
            self._get_resource_name("api"),
            description="Serverless API with multi-region support",
            endpoint_configuration={
                "types": "REGIONAL"
            },
            tags=self.common_tags
        )
        
        # Resource
        self.api_resource = aws.apigateway.Resource(
            f"{self._get_resource_name('api')}-resource",
            rest_api=self.api_gateway.id,
            parent_id=self.api_gateway.root_resource_id,
            path_part="items"
        )
        
        # Methods
        self.api_method_get = aws.apigateway.Method(
            f"{self._get_resource_name('api')}-method-get",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method="GET",
            authorization="NONE"
        )
        
        self.api_method_post = aws.apigateway.Method(
            f"{self._get_resource_name('api')}-method-post",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method="POST",
            authorization="NONE"
        )
        
        # Lambda integrations
        self.api_integration_get = aws.apigateway.Integration(
            f"{self._get_resource_name('api')}-integration-get",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method_get.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_function.invoke_arn
        )
        
        self.api_integration_post = aws.apigateway.Integration(
            f"{self._get_resource_name('api')}-integration-post",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method_post.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_function.invoke_arn
        )
        
        # Lambda permissions
        self.lambda_permission = aws.lambda_.Permission(
            f"{self._get_resource_name('lambda')}-permission",
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function=self.lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(
                self.api_gateway.execution_arn, "/*/*"
            )
        )
        
        # Deployment
        self.api_deployment = aws.apigateway.Deployment(
            f"{self._get_resource_name('api')}-deployment",
            rest_api=self.api_gateway.id,
            opts=pulumi.ResourceOptions(depends_on=[
                self.api_integration_get,
                self.api_integration_post
            ])
        )
        
        # Stage
        self.api_stage = aws.apigateway.Stage(
            f"{self._get_resource_name('api')}-stage",
            deployment=self.api_deployment.id,
            rest_api=self.api_gateway.id,
            stage_name=self.environment,
            access_log_destination=self.api_log_group.arn,
            access_log_format=json.dumps({
                "requestId": "$context.requestId",
                "ip": "$context.identity.sourceIp",
                "caller": "$context.identity.caller",
                "user": "$context.identity.user",
                "requestTime": "$context.requestTime",
                "httpMethod": "$context.httpMethod",
                "resourcePath": "$context.resourcePath",
                "status": "$context.status",
                "protocol": "$context.protocol",
                "responseLength": "$context.responseLength"
            }),
            tags=self.common_tags
        )
        
        # API Gateway log group
        self.api_log_group = aws.cloudwatch.LogGroup(
            f"{self._get_resource_name('api')}-logs",
            name=f"API-Gateway-Execution-Logs_{self.api_gateway.id}/{self.environment}",
            retention_in_days=14,
            tags=self.common_tags
        )
        
        # Account settings for CloudWatch logs
        self.api_account = aws.apigateway.Account(
            f"{self._get_resource_name('api')}-account",
            cloudwatch_role_arn=self.api_gateway_role.arn
        )
        
        # Canary deployment settings if enabled
        if self.enable_canary:
            self.api_stage_canary = aws.apigateway.Stage(
                f"{self._get_resource_name('api')}-stage-canary",
                deployment=self.api_deployment.id,
                rest_api=self.api_gateway.id,
                stage_name=f"{self.environment}-canary",
                canary_settings={
                    "percent_traffic": self.traffic_shift_percentage,
                    "use_stage_cache": False
                },
                tags=self.common_tags
            )
    
    def _create_monitoring(self):
        """Create CloudWatch alarms and monitoring"""
        
        # Lambda error alarm
        self.lambda_error_alarm = aws.cloudwatch.MetricAlarm(
            f"{self._get_resource_name('lambda')}-error-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Lambda function error rate",
            dimensions={
                "FunctionName": self.lambda_function.name
            },
            tags=self.common_tags
        )
        
        # Lambda duration alarm
        self.lambda_duration_alarm = aws.cloudwatch.MetricAlarm(
            f"{self._get_resource_name('lambda')}-duration-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Duration",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=10000,  # 10 seconds
            alarm_description="Lambda function duration",
            dimensions={
                "FunctionName": self.lambda_function.name
            },
            tags=self.common_tags
        )
        
        # API Gateway 4XX error alarm
        self.api_4xx_alarm = aws.cloudwatch.MetricAlarm(
            f"{self._get_resource_name('api')}-4xx-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="API Gateway 4XX errors",
            dimensions={
                "ApiName": self.api_gateway.name,
                "Stage": self.api_stage.stage_name
            },
            tags=self.common_tags
        )
        
        # API Gateway 5XX error alarm
        self.api_5xx_alarm = aws.cloudwatch.MetricAlarm(
            f"{self._get_resource_name('api')}-5xx-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="API Gateway 5XX errors",
            dimensions={
                "ApiName": self.api_gateway.name,
                "Stage": self.api_stage.stage_name
            },
            tags=self.common_tags
        )
        
        # API Gateway latency alarm
        self.api_latency_alarm = aws.cloudwatch.MetricAlarm(
            f"{self._get_resource_name('api')}-latency-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Latency",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Average",
            threshold=5000,  # 5 seconds
            alarm_description="API Gateway latency",
            dimensions={
                "ApiName": self.api_gateway.name,
                "Stage": self.api_stage.stage_name
            },
            tags=self.common_tags
        )
        
        # DynamoDB throttle alarm
        self.dynamodb_throttle_alarm = aws.cloudwatch.MetricAlarm(
            f"{self._get_resource_name('dynamodb')}-throttle-alarm",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ThrottledRequests",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=0,
            alarm_description="DynamoDB throttled requests",
            dimensions={
                "TableName": self.dynamodb_table.name
            },
            tags=self.common_tags
        )
    
    def _setup_cross_region_replication(self):
        """Setup cross-region replication and traffic management"""
        
        # Route53 health check for the API endpoint
        self.health_check = aws.route53.HealthCheck(
            f"{self._get_resource_name('api')}-health-check",
            fqdn=pulumi.Output.concat(
                self.api_gateway.id, ".execute-api.", 
                aws.get_region().name, ".amazonaws.com"
            ),
            port=443,
            type="HTTPS",
            resource_path=f"/{self.environment}/items",
            failure_threshold=3,
            request_interval=30,
            tags=self.common_tags
        )
        
        # Export important values for cross-stack references
        pulumi.export("api_gateway_url", pulumi.Output.concat(
            "https://", self.api_gateway.id, ".execute-api.", 
            aws.get_region().name, ".amazonaws.com/", self.environment
        ))
        pulumi.export("s3_bucket_name", self.s3_bucket.id)
        pulumi.export("s3_website_url", self.s3_bucket_website.website_endpoint)
        pulumi.export("dynamodb_table_name", self.dynamodb_table.name)
        pulumi.export("lambda_function_name", self.lambda_function.name)
        pulumi.export("health_check_id", self.health_check.id)

"""
CI/CD Pipeline Example for Blue-Green Deployment:

# .github/workflows/deploy.yml or similar CI/CD configuration

stages:
  1. Deploy to new region (green):
     ```bash
     pulumi config set target_region us-east-1
     pulumi config set environment green
     pulumi up --stack green-deployment
     ```
  
  2. Wait for data replication to sync:
     ```bash
     # Monitor DynamoDB global table replication lag
     aws cloudwatch get-metric-statistics \
       --namespace AWS/DynamoDB \
       --metric-name ReplicationLatency \
       --dimensions Name=TableName,Value=<table-name> Name=ReceivingRegion,Value=us-east-1 \
       --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \
       --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
       --period 300 \
       --statistics Average
     ```
  
  3. Gradually shift traffic using Route53 weighted routing:
     ```bash
     # Start with 10% traffic to new region
     aws route53 change-resource-record-sets \
       --hosted-zone-id <zone-id> \
       --change-batch file://traffic-shift-10.json
     
     # Monitor metrics for 10 minutes
     sleep 600
     
     # If healthy, increase to 50%
     aws route53 change-resource-record-sets \
       --hosted-zone-id <zone-id> \
       --change-batch file://traffic-shift-50.json
     
     # Continue monitoring and gradually increase to 100%
     ```
  
  4. Monitor key metrics during shift:
     ```bash
     # Check API Gateway error rates
     aws cloudwatch get-metric-statistics \
       --namespace AWS/ApiGateway \
       --metric-name 5XXError \
       --dimensions Name=ApiName,Value=<api-name> \
       --start-time $(date -u -d '10 minutes ago' +%Y-%m-%dT%H:%M:%S) \
       --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \
       --period 300 \
       --statistics Sum
     ```
  
  5. Rollback procedure if issues detected:
     ```bash
     # Immediate rollback - shift 100% traffic back to source region
     aws route53 change-resource-record-sets \
       --hosted-zone-id <zone-id> \
       --change-batch file://traffic-rollback.json
     
     # Or use Pulumi rollback
     pulumi stack select source-deployment
     pulumi up --refresh
     ```
  
  6. Final cutover:
     ```bash
     # After successful validation, update DNS to point 100% to new region
     aws route53 change-resource-record-sets \
       --hosted-zone-id <zone-id> \
       --change-batch file://traffic-cutover.json
     
     # Clean up old region resources
     pulumi destroy --stack old-deployment
     ```

Traffic shift JSON examples:

traffic-shift-10.json:
{
  "Changes": [{
    "Action": "UPSERT",
    "ResourceRecordSet": {
      "Name": "api.example.com",
      "Type": "CNAME",
      "SetIdentifier": "new-region",
      "Weight": 10,
      "TTL": 60,
      "ResourceRecords": [{"Value": "<new-region-api-gateway-url>"}]
    }
  }]
}

Monitoring commands for deployment validation:
- API Gateway latency: aws cloudwatch get-metric-statistics --namespace AWS/ApiGateway --metric-name Latency
- Lambda errors: aws cloudwatch get-metric-statistics --namespace AWS/Lambda --metric-name Errors  
- DynamoDB throttles: aws cloudwatch get-metric-statistics --namespace AWS/DynamoDB --metric-name ThrottledRequests
- Health check status: aws route53 get-health-check-status --health-check-id <id>
"""
```

=== tests/unit/test_tap_stack.py ===

```python
import pytest
import pulumi
from unittest.mock import Mock, patch
import json

# Set up Pulumi mocks
class MockResourceArgs:
    def __init__(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)

class MockResource:
    def __init__(self, resource_type, name, args=None, opts=None):
        self.resource_type = resource_type
        self.name = name
        self.args = args or {}
        
        # Mock common attributes
        self.id = f"mock-{name}"
        self.arn = f"arn:aws:service:us-west-2:123456789012:{resource_type.split('::')[-1].lower()}/{name}"
        
        # Resource-specific mocks
        if "dynamodb" in resource_type.lower():
            self.name = name
            self.stream_arn = f"{self.arn}/stream/2023-01-01T00:00:00.000"
        elif "lambda" in resource_type.lower():
            self.name = name
            self.invoke_arn = f"arn:aws:apigateway:us-west-2:lambda:path/2015-03-31/functions/{self.arn}/invocations"
        elif "apigateway" in resource_type.lower() and "RestApi" in resource_type:
            self.root_resource_id = f"root-{name}"
            self.execution_arn = f"arn:aws:execute-api:us-west-2:123456789012:{self.id}"
        elif "s3" in resource_type.lower() and "Bucket" in resource_type:
            self.website_endpoint = f"{name}.s3-website-us-west-2.amazonaws.com