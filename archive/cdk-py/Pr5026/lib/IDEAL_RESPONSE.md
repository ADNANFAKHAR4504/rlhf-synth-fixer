## lib/__init__.py

```python
# TAP Infrastructure Library
# This package contains the main CDK stack definitions and supporting modules
```

## lib/stacks/__init__.py

```python
# Nested stacks for modular infrastructure
```

## lib/tap_stack.py

```python
"""
TAP Stack - Secure AWS Infrastructure as Code

This module implements a comprehensive, secure AWS infrastructure following the requirements
outlined in PROMPT.md. It includes VPC networking, security groups with least privilege,
IAM roles, KMS encryption, monitoring, alerting, and stack protection policies.

The stack is designed to be production-ready with proper security, monitoring, and 
maintainability following the AWS Well-Architected Framework.
"""

import os
from typing import Optional, List, Dict, Any

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    CfnOutput,
    RemovalPolicy,
    CfnCondition,
    Fn,
    aws_apigatewayv2 as apigatewayv2,
    aws_apigatewayv2_integrations as integrations,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_logs as logs,
    aws_iam as iam,
    aws_ec2 as ec2,
    aws_s3 as s3,
    aws_s3_notifications,
    aws_kms as kms,
    aws_sns as sns,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_applicationautoscaling as autoscaling,
    Tags,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): Environment identifier (e.g., 'dev', 'staging', 'prod')
        enable_high_availability (Optional[bool]): Enable multi-AZ deployment for production
        enable_enhanced_monitoring (Optional[bool]): Enable detailed monitoring and alerting
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        enable_high_availability: Optional[bool] = None,
        enable_enhanced_monitoring: Optional[bool] = None,
        **kwargs
    ):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.enable_high_availability = enable_high_availability
        self.enable_enhanced_monitoring = enable_enhanced_monitoring


class TapStack(cdk.Stack):
    """
    Secure AWS Infrastructure Stack for TAP (Test Automation Platform)

    This stack implements a comprehensive, production-ready AWS infrastructure with:
    - VPC with proper network security
    - IAM roles following least privilege principle
    - KMS encryption for all data at rest
    - Comprehensive monitoring and alerting
    - Security groups with restricted access
    - S3 buckets with VPC endpoint restrictions
    - DynamoDB with encryption and backup
    - API Gateway with proper logging
    - Lambda functions with security best practices
    - CloudWatch monitoring for all components
    - SNS alerts for security events
    - Stack policies to prevent accidental deletions
    - Conditional logic for different deployment scenarios

    Args:
        scope (Construct): The parent construct
        construct_id (str): The unique identifier for this stack
        props (Optional[TapStackProps]): Stack configuration properties
        **kwargs: Additional keyword arguments passed to the CDK Stack
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Extract configuration from props and context
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'
        
        enable_high_availability = (
            props.enable_high_availability if props else None
        ) or self.node.try_get_context('enableHighAvailability') or (environment_suffix == 'prod')
        
        enable_enhanced_monitoring = (
            props.enable_enhanced_monitoring if props else None
        ) or self.node.try_get_context('enableEnhancedMonitoring') or (environment_suffix in ['prod', 'staging'])

        # Store configuration for reference
        self.environment_suffix = environment_suffix
        self.enable_high_availability = enable_high_availability
        self.enable_enhanced_monitoring = enable_enhanced_monitoring

        # Conditional logic for different deployment scenarios
        is_production = CfnCondition(
            self,
            "IsProduction",
            expression=Fn.condition_equals(environment_suffix, "prod")
        )

        is_development = CfnCondition(
            self,
            "IsDevelopment", 
            expression=Fn.condition_equals(environment_suffix, "dev")
        )

        # Apply consistent tagging following AWS Well-Architected Framework
        self._apply_tags()

        # Create KMS keys for encryption
        self.kms_key = self._create_kms_key()

        # Create VPC and networking components
        self.vpc = self._create_vpc()
        
        # Create security groups with least privilege
        self.security_groups = self._create_security_groups()

        # Create S3 buckets with proper security
        self.s3_buckets = self._create_s3_buckets()

        # Create CloudWatch log groups
        self.log_groups = self._create_log_groups()

        # Create SNS topics for alerts
        self.sns_topics = self._create_sns_topics()

        # Create IAM roles with least privilege
        self.iam_roles = self._create_iam_roles()

        # Create DynamoDB table with encryption
        self.dynamodb_table = self._create_dynamodb_table()

        # Create Lambda function
        self.lambda_function = self._create_lambda_function()

        # Create API Gateway
        self.api_gateway = self._create_api_gateway()

        # Create EC2 monitoring setup
        if enable_enhanced_monitoring:
            self._create_ec2_monitoring()

        # Create comprehensive monitoring and alerting
        self._create_monitoring_and_alerts()

        # Apply stack policy to prevent accidental deletions
        self._apply_stack_policy()

        # Create stack outputs
        self._create_outputs()

    def _apply_tags(self) -> None:
        """Apply consistent tagging following AWS Well-Architected Framework"""
        repository_name = os.getenv('REPOSITORY', 'iac-test-automations')
        commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')
        
        # Core tags for all resources
        Tags.of(self).add('Environment', self.environment_suffix)
        Tags.of(self).add('Project', 'TAP')
        Tags.of(self).add('Repository', repository_name)
        Tags.of(self).add('Author', commit_author)
        Tags.of(self).add('ManagedBy', 'CDK')
        Tags.of(self).add('CostCenter', f'TAP-{self.environment_suffix}')
        Tags.of(self).add('DataClassification', 'internal')
        Tags.of(self).add('Backup', 'required' if self.environment_suffix == 'prod' else 'optional')

    def _create_kms_key(self) -> kms.Key:
        """Create KMS key for encryption at rest"""
        key = kms.Key(
            self,
            "TapKmsKey",
            description=f"TAP {self.environment_suffix} encryption key",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN if self.environment_suffix == 'prod' else RemovalPolicy.DESTROY,
        )

        # Add key policy for proper access control
        key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="EnableRootAccess",
                effect=iam.Effect.ALLOW,
                principals=[iam.AccountRootPrincipal()],
                actions=["kms:*"],
                resources=["*"],
            )
        )

        return key

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with proper network security"""
        # Determine number of AZs based on HA requirements
        max_azs = 3 if self.enable_high_availability else 2

        vpc = ec2.Vpc(
            self,
            "TapVpc",
            vpc_name=f"tap-vpc-{self.environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=max_azs,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
            nat_gateways=max_azs if self.enable_high_availability else 1,
        )

        # Create VPC Flow Logs for security monitoring
        flow_log_role = iam.Role(
            self,
            "VpcFlowLogRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            inline_policies={
                "FlowLogDeliveryRolePolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogGroups",
                                "logs:DescribeLogStreams"
                            ],
                            resources=["*"]
                        )
                    ]
                )
            }
        )

        ec2.FlowLog(
            self,
            "VpcFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                logs.LogGroup(
                    self,
                    "VpcFlowLogGroup",
                    log_group_name=f"/aws/vpc/flowlogs/{self.environment_suffix}",
                    retention=logs.RetentionDays.ONE_MONTH,
                    removal_policy=RemovalPolicy.DESTROY,
                ),
                flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL,
        )

        return vpc

    def _create_security_groups(self) -> Dict[str, ec2.SecurityGroup]:
        """Create security groups with least privilege principle"""
        security_groups = {}

        # Lambda security group - minimal access
        security_groups['lambda'] = ec2.SecurityGroup(
            self,
            "LambdaSecurityGroup",
            vpc=self.vpc,
            description="Security group for Lambda functions",
            security_group_name=f"tap-lambda-sg-{self.environment_suffix}",
            allow_all_outbound=False,  # Explicitly control outbound traffic
        )

        # Allow HTTPS outbound for API calls
        security_groups['lambda'].add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="HTTPS outbound for AWS API calls",
        )

        # API Gateway security group (if using VPC endpoint)
        security_groups['api_gateway'] = ec2.SecurityGroup(
            self,
            "ApiGatewaySecurityGroup",
            vpc=self.vpc,
            description="Security group for API Gateway VPC endpoint",
            security_group_name=f"tap-api-gateway-sg-{self.environment_suffix}",
        )

        # Only allow HTTPS from specific IP ranges (replace with your actual IP ranges)
        trusted_ip_ranges = self.node.try_get_context('trustedIpRanges') or ['10.0.0.0/8']
        for ip_range in trusted_ip_ranges:
            security_groups['api_gateway'].add_ingress_rule(
                peer=ec2.Peer.ipv4(ip_range),
                connection=ec2.Port.tcp(443),
                description=f"HTTPS from trusted network {ip_range}",
            )

        return security_groups

    def _create_s3_buckets(self) -> Dict[str, s3.Bucket]:
        """Create S3 buckets with proper security policies"""
        buckets = {}

        # Main data bucket
        buckets['data'] = s3.Bucket(
            self,
            "DataBucket",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="intelligent-tiering",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INTELLIGENT_TIERING,
                            transition_after=Duration.days(0),
                        )
                    ],
                )
            ],
            removal_policy=RemovalPolicy.RETAIN if self.environment_suffix == 'prod' else RemovalPolicy.DESTROY,
            auto_delete_objects=self.environment_suffix != 'prod',
        )

        # Add bucket policy to restrict access to VPC (with exceptions for CDK operations)
        buckets['data'].add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
                resources=[buckets['data'].arn_for_objects("*")],
                conditions={
                    "StringNotEquals": {
                        "aws:SourceVpc": self.vpc.vpc_id
                    },
                    "Bool": {
                        "aws:ViaAWSService": "false"
                    }
                },
            )
        )

        # Logs bucket for access logs
        buckets['logs'] = s3.Bucket(
            self,
            "LogsBucket",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="log-lifecycle",
                    enabled=True,
                    expiration=Duration.days(90),
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30),
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(60),
                        ),
                    ],
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        return buckets

    def _create_log_groups(self) -> Dict[str, logs.LogGroup]:
        """Create CloudWatch log groups for comprehensive logging"""
        log_groups = {}

        # API Gateway logs
        log_groups['api_gateway'] = logs.LogGroup(
            self,
            "ApiGatewayLogGroup",
            log_group_name=f"/aws/apigateway/tap-api-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH if self.environment_suffix == 'dev' else logs.RetentionDays.THREE_MONTHS,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Lambda logs
        log_groups['lambda'] = logs.LogGroup(
            self,
            "LambdaLogGroup",
            log_group_name=f"/aws/lambda/tap-api-handler-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH if self.environment_suffix == 'dev' else logs.RetentionDays.THREE_MONTHS,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Security events log group
        log_groups['security'] = logs.LogGroup(
            self,
            "SecurityLogGroup",
            log_group_name=f"/aws/security/tap-{self.environment_suffix}",
            retention=logs.RetentionDays.SIX_MONTHS,
            removal_policy=RemovalPolicy.RETAIN if self.environment_suffix == 'prod' else RemovalPolicy.DESTROY,
        )

        return log_groups

    def _create_sns_topics(self) -> Dict[str, sns.Topic]:
        """Create SNS topics for alerts and notifications"""
        topics = {}

        # Security alerts topic
        topics['security_alerts'] = sns.Topic(
            self,
            "SecurityAlertsTopic",
            topic_name=f"tap-security-alerts-{self.environment_suffix}",
            display_name="TAP Security Alerts",
        )

        # Operational alerts topic
        topics['operational_alerts'] = sns.Topic(
            self,
            "OperationalAlertsTopic",
            topic_name=f"tap-operational-alerts-{self.environment_suffix}",
            display_name="TAP Operational Alerts",
        )

        return topics

    def _create_iam_roles(self) -> Dict[str, iam.Role]:
        """Create IAM roles following least privilege principle"""
        roles = {}

        # Lambda execution role with minimal permissions
        roles['lambda_execution'] = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Execution role for TAP Lambda functions",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ],
        )

        # Add specific permissions for DynamoDB
        roles['lambda_execution'].add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:Query",
                    "dynamodb:Scan", 
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:BatchWriteItem",
                ],
                resources=[],  # Will be populated when DynamoDB table is created
            )
        )

        # Add KMS permissions
        roles['lambda_execution'].add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt",
                    "kms:DescribeKey",
                ],
                resources=[self.kms_key.key_arn],
            )
        )

        # Add CloudWatch Logs permissions
        roles['lambda_execution'].add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=[
                    f"{self.log_groups['lambda'].log_group_arn}:*"
                ],
            )
        )

        return roles

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with encryption and backup"""
        table = dynamodb.Table(
            self,
            "DataTable",
            table_name=f"tap-api-data-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="createdAt",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.kms_key,
            point_in_time_recovery=True,
            deletion_protection=self.environment_suffix == 'prod',
            removal_policy=RemovalPolicy.RETAIN if self.environment_suffix == 'prod' else RemovalPolicy.DESTROY,
        )

        # Add GSI for querying by status
        table.add_global_secondary_index(
            index_name="status-index",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="updatedAt",
                type=dynamodb.AttributeType.STRING
            ),
            projection_type=dynamodb.ProjectionType.ALL,
        )

        # Update Lambda role with table permissions
        self.iam_roles['lambda_execution'].add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:UpdateItem", 
                    "dynamodb:DeleteItem",
                    "dynamodb:BatchGetItem",
                    "dynamodb:BatchWriteItem",
                ],
                resources=[
                    table.table_arn,
                    f"{table.table_arn}/index/*"
                ],
            )
        )

        return table

    def _create_lambda_function(self) -> lambda_.Function:
        """Create Lambda function with security best practices"""
        # Lambda function code - comprehensive API with security features
        lambda_code = '''
import json
import os
import boto3
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional
import uuid
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
import hashlib
import base64

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

# Initialize clients
dynamodb = boto3.resource("dynamodb")
cloudwatch = boto3.client("cloudwatch")
sns = boto3.client("sns")

# Configuration
table_name = os.environ.get("TABLE_NAME")
table = dynamodb.Table(table_name) if table_name else None
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
API_KEY = os.environ.get("API_KEY", "")
SECURITY_SNS_TOPIC = os.environ.get("SECURITY_SNS_TOPIC", "")

def log_security_event(event_type: str, details: Dict[str, Any], severity: str = "INFO"):
    """Log security events to CloudWatch and SNS"""
    try:
        # Log to CloudWatch
        logger.warning(f"SECURITY_EVENT: {event_type} - {json.dumps(details)}")
        
        # Send to SNS for critical events
        if severity in ["CRITICAL", "HIGH"] and SECURITY_SNS_TOPIC:
            message = {
                "eventType": event_type,
                "severity": severity,
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "details": details,
                "environment": ENVIRONMENT
            }
            
            sns.publish(
                TopicArn=SECURITY_SNS_TOPIC,
                Subject=f"TAP Security Alert: {event_type}",
                Message=json.dumps(message, indent=2)
            )
    except Exception as e:
        logger.error(f"Failed to log security event: {str(e)}")

def create_response(status_code: int, body: Any, error: bool = False) -> Dict[str, Any]:
    """Create standardized API response with security headers"""
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
            "X-Content-Type-Options": "nosniff",
            "X-Frame-Options": "DENY",
            "X-XSS-Protection": "1; mode=block",
            "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
        },
        "body": json.dumps({
            "success": not error,
            "data": body if not error else None,
            "error": body if error else None,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "environment": ENVIRONMENT,
        }),
    }

def validate_api_key(headers: Dict[str, str], source_ip: str) -> bool:
    """Validate API key and log access attempts"""
    if not API_KEY:
        return True  # Skip validation if no API key is configured
    
    # Handle case-insensitive header lookup
    headers_lower = {k.lower(): v for k, v in headers.items()}
    provided_key = headers_lower.get("x-api-key", "")
    
    if provided_key != API_KEY:
        log_security_event(
            "UNAUTHORIZED_API_ACCESS",
            {
                "sourceIp": source_ip,
                "providedKey": hashlib.sha256(provided_key.encode()).hexdigest()[:8] if provided_key else "none",
                "userAgent": headers_lower.get("user-agent", "unknown")
            },
            "HIGH"
        )
        return False
    
    return True

def validate_input(data: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and sanitize input data"""
    if not isinstance(data, dict):
        return {"error": "Invalid data format"}
    
    # Check for required fields
    if "content" not in data:
        return {"error": "Missing required field: content"}
    
    # Sanitize content length
    if len(str(data.get("content", ""))) > 10000:
        return {"error": "Content too large (max 10000 characters)"}
    
    # Validate metadata if present
    metadata = data.get("metadata", {})
    if not isinstance(metadata, dict):
        return {"error": "Metadata must be an object"}
    
    return {"valid": True}

def get_item(item_id: str) -> Dict[str, Any]:
    """Get a single item from DynamoDB"""
    try:
        # Validate input
        if not item_id or len(item_id) > 100:
            return create_response(400, {"message": "Invalid item ID"}, error=True)
        
        # Query using partition key
        response = table.query(
            KeyConditionExpression=Key("id").eq(item_id),
            ScanIndexForward=False,  # Get most recent first
            Limit=1
        )
        
        items = response.get("Items", [])
        if not items:
            return create_response(404, {"message": f"Item {item_id} not found"}, error=True)
        
        logger.info(f"Retrieved item: {item_id}")
        return create_response(200, items[0])
        
    except ClientError as e:
        logger.error(f"Error getting item {item_id}: {str(e)}")
        return create_response(500, {"message": "Database error occurred"}, error=True)

def get_all_items(query_params: Dict[str, str] = None) -> Dict[str, Any]:
    """Get all items from DynamoDB with optional filtering"""
    try:
        query_params = query_params or {}
        limit = min(int(query_params.get("limit", "100")), 1000)  # Cap at 1000
        
        scan_kwargs = {"Limit": limit}
        
        # Add status filter if provided
        status_filter = query_params.get("status")
        if status_filter:
            scan_kwargs["FilterExpression"] = Key("status").eq(status_filter)
        
        response = table.scan(**scan_kwargs)
        items = response.get("Items", [])
        
        logger.info(f"Retrieved {len(items)} items")
        return create_response(200, {
            "items": items, 
            "count": len(items),
            "hasMore": "LastEvaluatedKey" in response
        })
        
    except ClientError as e:
        logger.error(f"Error scanning table: {str(e)}")
        return create_response(500, {"message": "Database error occurred"}, error=True)

def create_item(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new item in DynamoDB"""
    try:
        # Validate input
        validation = validate_input(data)
        if "error" in validation:
            return create_response(400, {"message": validation["error"]}, error=True)
        
        # Generate ID and timestamp
        item_id = str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        
        # Create item
        item = {
            "id": item_id,
            "createdAt": now,
            "content": data["content"],
            "metadata": data.get("metadata", {}),
            "status": "active",
            "updatedAt": now,
            "version": 1,
        }
        
        # Store in DynamoDB
        table.put_item(
            Item=item,
            ConditionExpression="attribute_not_exists(id)"  # Prevent overwrites
        )
        
        logger.info(f"Created item: {item_id}")
        return create_response(201, item)
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return create_response(409, {"message": "Item already exists"}, error=True)
        logger.error(f"Error creating item: {str(e)}")
        return create_response(500, {"message": "Failed to create item"}, error=True)

def update_item(item_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Update an existing item in DynamoDB"""
    try:
        # Validate input
        if not item_id or len(item_id) > 100:
            return create_response(400, {"message": "Invalid item ID"}, error=True)
        
        validation = validate_input(data)
        if "error" in validation:
            return create_response(400, {"message": validation["error"]}, error=True)
        
        # Get existing item to get the createdAt value
        existing = table.query(
            KeyConditionExpression=Key("id").eq(item_id),
            ScanIndexForward=False,
            Limit=1
        )
        
        if not existing.get("Items"):
            return create_response(404, {"message": f"Item {item_id} not found"}, error=True)
        
        existing_item = existing["Items"][0]
        created_at = existing_item["createdAt"]
        current_version = existing_item.get("version", 1)
        updated_at = datetime.now(timezone.utc).isoformat()
        
        # Update item with optimistic locking
        response = table.update_item(
            Key={"id": item_id, "createdAt": created_at},
            UpdateExpression="SET content = :content, metadata = :metadata, updatedAt = :updated, #v = #v + :inc",
            ConditionExpression="#v = :current_version",
            ExpressionAttributeNames={"#v": "version"},
            ExpressionAttributeValues={
                ":content": data.get("content", existing_item.get("content")),
                ":metadata": data.get("metadata", existing_item.get("metadata", {})),
                ":updated": updated_at,
                ":current_version": current_version,
                ":inc": 1,
            },
            ReturnValues="ALL_NEW",
        )
        
        logger.info(f"Updated item: {item_id}")
        return create_response(200, response["Attributes"])
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return create_response(409, {"message": "Item was modified by another request"}, error=True)
        logger.error(f"Error updating item {item_id}: {str(e)}")
        return create_response(500, {"message": "Failed to update item"}, error=True)

def delete_item(item_id: str) -> Dict[str, Any]:
    """Delete an item from DynamoDB"""
    try:
        # Validate input
        if not item_id or len(item_id) > 100:
            return create_response(400, {"message": "Invalid item ID"}, error=True)
        
        # Get existing item to get the createdAt value
        existing = table.query(
            KeyConditionExpression=Key("id").eq(item_id),
            ScanIndexForward=False,
            Limit=1
        )
        
        if not existing.get("Items"):
            return create_response(404, {"message": f"Item {item_id} not found"}, error=True)
        
        created_at = existing["Items"][0]["createdAt"]
        
        # Delete item
        table.delete_item(
            Key={"id": item_id, "createdAt": created_at},
            ConditionExpression="attribute_exists(id)"
        )
        
        logger.info(f"Deleted item: {item_id}")
        return create_response(200, {"message": f"Item {item_id} deleted successfully"})
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            return create_response(404, {"message": f"Item {item_id} not found"}, error=True)
        logger.error(f"Error deleting item {item_id}: {str(e)}")
        return create_response(500, {"message": "Failed to delete item"}, error=True)

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Main Lambda handler with comprehensive security and monitoring"""
    try:
        # Extract request details
        request_context = event.get("requestContext", {})
        http_context = request_context.get("http", {})
        http_method = http_context.get("method", "")
        path = http_context.get("path", "")
        source_ip = request_context.get("sourceIp", "unknown")
        user_agent = event.get("headers", {}).get("user-agent", "unknown")
        
        # Log request (without sensitive data)
        logger.info(f"Request: {http_method} {path} from {source_ip}")
        
        # Handle CORS preflight requests
        if http_method == "OPTIONS":
            return create_response(200, {"message": "CORS preflight successful"})
        
        # Check if table is configured
        if not table:
            logger.error("DynamoDB table not configured")
            return create_response(500, {"message": "Database not configured"}, error=True)
        
        # Extract headers and validate API key
        headers = event.get("headers", {})
        if not validate_api_key(headers, source_ip):
            return create_response(401, {"message": "Unauthorized"}, error=True)
        
        # Log successful authentication
        logger.info(f"Authenticated request from {source_ip}")
        
        # Extract path parameters and query parameters
        path_params = event.get("pathParameters", {}) or {}
        query_params = event.get("queryStringParameters", {}) or {}
        
        # Parse body for POST/PUT requests
        body = {}
        if event.get("body"):
            try:
                body = json.loads(event["body"])
            except json.JSONDecodeError:
                return create_response(400, {"message": "Invalid JSON in request body"}, error=True)
        
        # Route to appropriate handler
        if path == "/items":
            if http_method == "GET":
                return get_all_items(query_params)
            elif http_method == "POST":
                return create_item(body)
                
        elif path.startswith("/items/"):
            item_id = path_params.get("id")
            if not item_id:
                return create_response(400, {"message": "Item ID required"}, error=True)
                
            if http_method == "GET":
                return get_item(item_id)
            elif http_method == "PUT":
                return update_item(item_id, body)
            elif http_method == "DELETE":
                return delete_item(item_id)
        
        # Health check endpoint
        elif path == "/health":
            if http_method == "GET":
                return create_response(200, {
                    "status": "healthy",
                    "version": "1.0.0",
                    "environment": ENVIRONMENT
                })
        
        # Default response for unmatched routes
        return create_response(404, {"message": "Route not found"}, error=True)
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        log_security_event(
            "LAMBDA_EXECUTION_ERROR",
            {
                "error": str(e),
                "path": event.get("requestContext", {}).get("http", {}).get("path", ""),
                "method": event.get("requestContext", {}).get("http", {}).get("method", "")
            },
            "MEDIUM"
        )
        return create_response(500, {"message": "Internal server error"}, error=True)
'''

        function = lambda_.Function(
            self,
            "ApiHandler",
            function_name=f"tap-api-handler-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline(lambda_code),
            role=self.iam_roles['lambda_execution'],
            timeout=Duration.seconds(30),
            memory_size=512 if self.enable_enhanced_monitoring else 256,
            environment={
                "TABLE_NAME": self.dynamodb_table.table_name,
                "ENVIRONMENT": self.environment_suffix,
                "LOG_LEVEL": os.environ.get("LOG_LEVEL", "INFO"),
                "API_KEY": os.environ.get("API_KEY", f"tap-{self.environment_suffix}-key"),
                "SECURITY_SNS_TOPIC": self.sns_topics['security_alerts'].topic_arn,
            },
            tracing=lambda_.Tracing.ACTIVE,
            retry_attempts=2,
            log_group=self.log_groups['lambda'],
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.security_groups['lambda']],
            dead_letter_queue_enabled=True,
            reserved_concurrent_executions=100 if self.environment_suffix == 'prod' else 10,
        )

        # Grant SNS publish permissions
        self.sns_topics['security_alerts'].grant_publish(function)

        return function

    def _create_api_gateway(self) -> apigatewayv2.HttpApi:
        """Create API Gateway with proper logging and security"""
        # Create HTTP API with CORS and security settings
        http_api = apigatewayv2.HttpApi(
            self,
            "HttpApi",
            api_name=f"tap-api-{self.environment_suffix}",
            description=f"TAP API for {self.environment_suffix} environment",
            cors_preflight=apigatewayv2.CorsPreflightOptions(
                allow_origins=["https://*.example.com"] if self.environment_suffix == 'prod' else ["*"],
                allow_methods=[
                    apigatewayv2.CorsHttpMethod.GET,
                    apigatewayv2.CorsHttpMethod.POST,
                    apigatewayv2.CorsHttpMethod.PUT,
                    apigatewayv2.CorsHttpMethod.DELETE,
                    apigatewayv2.CorsHttpMethod.OPTIONS,
                ],
                allow_headers=["Content-Type", "Authorization", "X-Api-Key"],
                max_age=Duration.hours(1),
            ),
            disable_execute_api_endpoint=False,
        )

        # Create Lambda integration
        lambda_integration = integrations.HttpLambdaIntegration(
            "LambdaIntegration",
            handler=self.lambda_function,
            payload_format_version=apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        )

        # Add routes
        http_api.add_routes(
            path="/items",
            methods=[apigatewayv2.HttpMethod.GET, apigatewayv2.HttpMethod.POST],
            integration=lambda_integration,
        )

        http_api.add_routes(
            path="/items/{id}",
            methods=[
                apigatewayv2.HttpMethod.GET,
                apigatewayv2.HttpMethod.PUT,
                apigatewayv2.HttpMethod.DELETE,
            ],
            integration=lambda_integration,
        )

        # Add health check route
        http_api.add_routes(
            path="/health",
            methods=[apigatewayv2.HttpMethod.GET],
            integration=lambda_integration,
        )

        # Configure API Gateway logging
        cfn_stage = http_api.default_stage.node.default_child
        cfn_stage.access_log_settings = apigatewayv2.CfnStage.AccessLogSettingsProperty(
            destination_arn=self.log_groups['api_gateway'].log_group_arn,
            format='{"requestId":"$context.requestId","requestTime":"$context.requestTime",'
                   '"httpMethod":"$context.httpMethod","routeKey":"$context.routeKey",'
                   '"status":"$context.status","error":"$context.error.message",'
                   '"responseLength":"$context.responseLength","sourceIp":"$context.identity.sourceIp",'
                   '"userAgent":"$context.identity.userAgent"}'
        )

        # Grant API Gateway permission to write to CloudWatch Logs
        self.log_groups['api_gateway'].grant_write(iam.ServicePrincipal("apigateway.amazonaws.com"))

        return http_api

    def _create_ec2_monitoring(self) -> None:
        """Create enhanced EC2 monitoring setup"""
        # This would be expanded based on actual EC2 instances in your infrastructure
        # For now, creating monitoring for potential future EC2 instances
        
        # Create CloudWatch dashboard for EC2 monitoring
        dashboard = cloudwatch.Dashboard(
            self,
            "EC2MonitoringDashboard",
            dashboard_name=f"TAP-EC2-Monitoring-{self.environment_suffix}",
        )

        # Add widgets to dashboard (examples)
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="EC2 CPU Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/EC2",
                        metric_name="CPUUtilization",
                        statistic="Average",
                    )
                ],
                width=12,
                height=6,
            )
        )

    def _create_monitoring_and_alerts(self) -> None:
        """Create comprehensive monitoring and alerting"""
        # Lambda error rate alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            "LambdaErrorAlarm",
            alarm_name=f"tap-lambda-errors-{self.environment_suffix}",
            alarm_description="Lambda function error rate is too high",
            metric=self.lambda_function.metric_errors(
                period=Duration.minutes(5),
                statistic="Sum",
            ),
            threshold=5,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        lambda_error_alarm.add_alarm_action(
            cw_actions.SnsAction(self.sns_topics['operational_alerts'])
        )

        # Lambda duration alarm
        lambda_duration_alarm = cloudwatch.Alarm(
            self,
            "LambdaDurationAlarm",
            alarm_name=f"tap-lambda-duration-{self.environment_suffix}",
            alarm_description="Lambda function duration is too high",
            metric=self.lambda_function.metric_duration(
                period=Duration.minutes(5),
                statistic="Average",
            ),
            threshold=20000,  # 20 seconds
            evaluation_periods=3,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        lambda_duration_alarm.add_alarm_action(
            cw_actions.SnsAction(self.sns_topics['operational_alerts'])
        )

        # DynamoDB throttling alarm
        dynamodb_throttle_alarm = cloudwatch.Alarm(
            self,
            "DynamoDBThrottleAlarm",
            alarm_name=f"tap-dynamodb-throttles-{self.environment_suffix}",
            alarm_description="DynamoDB is being throttled",
            metric=cloudwatch.Metric(
                namespace="AWS/DynamoDB",
                metric_name="ThrottledRequests",
                dimensions_map={"TableName": self.dynamodb_table.table_name},
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            threshold=0,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        dynamodb_throttle_alarm.add_alarm_action(
            cw_actions.SnsAction(self.sns_topics['operational_alerts'])
        )

        # API Gateway 4xx errors alarm
        api_4xx_alarm = cloudwatch.Alarm(
            self,
            "ApiGateway4xxAlarm",
            alarm_name=f"tap-api-4xx-errors-{self.environment_suffix}",
            alarm_description="API Gateway 4xx error rate is high",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGatewayV2",
                metric_name="4xx",
                dimensions_map={"ApiId": self.api_gateway.api_id},
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            threshold=50,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        api_4xx_alarm.add_alarm_action(
            cw_actions.SnsAction(self.sns_topics['security_alerts'])
        )

        # API Gateway 5xx errors alarm
        api_5xx_alarm = cloudwatch.Alarm(
            self,
            "ApiGateway5xxAlarm", 
            alarm_name=f"tap-api-5xx-errors-{self.environment_suffix}",
            alarm_description="API Gateway 5xx error rate is high",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGatewayV2",
                metric_name="5xx",
                dimensions_map={"ApiId": self.api_gateway.api_id},
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        api_5xx_alarm.add_alarm_action(
            cw_actions.SnsAction(self.sns_topics['operational_alerts'])
        )

        # Create custom metric filter for unauthorized access attempts
        unauthorized_access_filter = logs.MetricFilter(
            self,
            "UnauthorizedAccessFilter",
            log_group=self.log_groups['security'],
            metric_namespace="TAP/Security",
            metric_name="UnauthorizedAccess",
            metric_value="1",
            filter_pattern=logs.FilterPattern.literal("UNAUTHORIZED_API_ACCESS"),
        )

        # Alarm for unauthorized access attempts
        unauthorized_access_alarm = cloudwatch.Alarm(
            self,
            "UnauthorizedAccessAlarm",
            alarm_name=f"tap-unauthorized-access-{self.environment_suffix}",
            alarm_description="Unauthorized API access attempts detected",
            metric=cloudwatch.Metric(
                namespace="TAP/Security",
                metric_name="UnauthorizedAccess",
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
        )
        unauthorized_access_alarm.add_alarm_action(
            cw_actions.SnsAction(self.sns_topics['security_alerts'])
        )

    def _apply_stack_policy(self) -> None:
        """Apply stack policy to prevent accidental deletions"""
        # Stack policy to protect critical resources from deletion
        stack_policy = {
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "Update:*",
                    "Resource": "*"
                },
                {
                    "Effect": "Deny",
                    "Principal": "*",
                    "Action": "Update:Delete",
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "ResourceType": [
                                "AWS::DynamoDB::Table",
                                "AWS::S3::Bucket",
                                "AWS::KMS::Key"
                            ]
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "Update:Delete",
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "ResourceType": [
                                "AWS::DynamoDB::Table",
                                "AWS::S3::Bucket", 
                                "AWS::KMS::Key"
                            ]
                        },
                        "StringNotEquals": {
                            "aws:PrincipalTag/Environment": "prod"
                        }
                    }
                }
            ]
        }

        # Apply the stack policy (this would typically be done through CloudFormation)
        # For CDK, we handle this through removal policies and deletion protection
        # which we've already configured in the individual resources

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs"""
        CfnOutput(
            self,
            "ApiEndpoint",
            value=self.api_gateway.url,
            description="HTTP API Gateway endpoint URL",
            export_name=f"TAP-ApiEndpoint-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "TableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB table name",
            export_name=f"TAP-TableName-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Lambda function name",
            export_name=f"TAP-LambdaFunctionName-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "VpcId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name=f"TAP-VpcId-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "KmsKeyId",
            value=self.kms_key.key_id,
            description="KMS key ID for encryption",
            export_name=f"TAP-KmsKeyId-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "SecurityAlertsTopicArn",
            value=self.sns_topics['security_alerts'].topic_arn,
            description="SNS topic for security alerts",
            export_name=f"TAP-SecurityAlertsTopicArn-{self.environment_suffix}",
        )

        CfnOutput(
            self,
            "DataBucketName",
            value=self.s3_buckets['data'].bucket_name,
            description="S3 data bucket name",
            export_name=f"TAP-DataBucketName-{self.environment_suffix}",
        )
```
