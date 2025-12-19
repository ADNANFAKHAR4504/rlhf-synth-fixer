"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of AWS resources for a secure and scalable cloud environment.
"""

from typing import Optional
import json

import aws_cdk as cdk
from aws_cdk import (
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_ssm as ssm,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_elasticloadbalancingv2 as elbv2,
    aws_elasticloadbalancingv2_targets as elbv2_targets,  # Add this import
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_iam as iam,
    aws_logs as logs,
    Duration,
    RemovalPolicy,
    CfnOutput,
    Tags  # Add this import
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack creates a comprehensive AWS cloud environment including:
    - Lambda function for data processing
    - API Gateway for triggering Lambda
    - S3 bucket with encryption and versioning
    - DynamoDB table for structured data
    - Parameter Store for sensitive configuration
    - VPC with public/private subnets and NAT Gateway
    - RDS instance in private subnet
    - Application Load Balancer with EC2 instances
    - SNS topic for notifications
    - IAM roles with least privilege access
    - CloudWatch logging for all services

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the 
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, 
            props: Optional[TapStackProps] = None, 
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Common tags for all resources
        common_tags = {
            'Environment': self.environment_suffix,
            'Service': 'TapStack',
            'ManagedBy': 'CDK'
        }

        # Apply tags to the stack
        for key, value in common_tags.items():
            Tags.of(self).add(key, value)  # Fix: Use Tags import

        # 1. Create VPC with public and private subnets
        self.vpc = self._create_vpc()

        # 2. Create Parameter Store parameters for sensitive configuration
        self.parameters = self._create_parameter_store()

        # 3. Create S3 bucket with encryption and versioning
        self.s3_bucket = self._create_s3_bucket()

        # 4. Create DynamoDB table with primary key and sort key
        self.dynamodb_table = self._create_dynamodb_table()

        # 5. Create SNS topic for notifications
        self.sns_topic = self._create_sns_topic()

        # 6. Create IAM roles with least privilege access
        self.lambda_role = self._create_lambda_role()
        self.ec2_role = self._create_ec2_role()

        # 7. Create Lambda function for data processing
        self.lambda_function = self._create_lambda_function()

        # 8. Create API Gateway to trigger Lambda
        self.api_gateway = self._create_api_gateway()

        # 9. Create RDS instance in private subnet
        self.rds_instance = self._create_rds_instance()

        # 10. Create EC2 instances and Application Load Balancer
        self.ec2_instances = self._create_ec2_instances()
        self.alb = self._create_application_load_balancer()

        # 11. Create CloudFormation outputs
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets and NAT Gateway"""
        vpc = ec2.Vpc(
            self, f"TapVPC-{self.environment_suffix}",
            vpc_name=f"tap-vpc-{self.environment_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PUBLIC,
                    name="PublicSubnet",
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    name="PrivateSubnet",
                    cidr_mask=24
                )
            ],
            nat_gateways=1,
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Enable VPC Flow Logs to CloudWatch
        vpc_flow_log_role = iam.Role(
            self, f"VPCFlowLogRole-{self.environment_suffix}",
            role_name=f"vpc-flow-log-role-{self.environment_suffix}",
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

        # Create CloudWatch Log Group for VPC Flow Logs
        flow_log_group = logs.LogGroup(
            self, f"VPCFlowLogGroup-{self.environment_suffix}",
            log_group_name=f"/aws/vpc/flowlogs-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create VPC Flow Logs
        ec2.FlowLog(
            self, f"VPCFlowLog-{self.environment_suffix}",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                flow_log_group, vpc_flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

        return vpc

    def _create_parameter_store(self) -> dict:
        """Create Parameter Store parameters for sensitive configuration"""
        parameters = {}

        # Database password parameter
        db_password = ssm.StringParameter(
            self, f"DBPassword-{self.environment_suffix}",
            parameter_name=f"/tap/{self.environment_suffix}/database/password",
            string_value="temp-password-change-me",  # This should be updated after deployment
            description="Database password for RDS instance",
            # Remove deprecated type parameter
            tier=ssm.ParameterTier.STANDARD
        )
        parameters['db_password'] = db_password

        # API key parameter
        api_key = ssm.StringParameter(
            self, f"APIKey-{self.environment_suffix}",
            parameter_name=f"/tap/{self.environment_suffix}/api/key",
            string_value="temp-api-key-change-me",  # This should be updated after deployment
            description="API key for external service integration",
            # Remove deprecated type parameter
            tier=ssm.ParameterTier.STANDARD
        )
        parameters['api_key'] = api_key

        # Database connection string
        db_connection = ssm.StringParameter(
            self, f"DBConnection-{self.environment_suffix}",
            parameter_name=f"/tap/{self.environment_suffix}/database/connection",
            string_value="postgresql://admin:password@localhost:5432/tapdb",  # Placeholder
            description="Database connection string",
            # Remove deprecated type parameter
            tier=ssm.ParameterTier.STANDARD
        )
        parameters['db_connection'] = db_connection

        return parameters

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with server-side encryption and versioning"""
        bucket = s3.Bucket(
            self, f"TapS3Bucket-{self.environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="TransitionToIA",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                ),
                s3.LifecycleRule(
                    id="DeleteIncompleteMultipartUploads",
                    enabled=True,
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ]
        )

        # Add bucket policy to enforce SSL
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyInsecureConnections",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[bucket.bucket_arn, bucket.arn_for_objects("*")],
                conditions={
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                }
            )
        )

        # Fix: Add ALB access logs policy
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AllowALBAccessLogs",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("elasticloadbalancing.amazonaws.com")],
                actions=["s3:PutObject"],
                resources=[bucket.arn_for_objects(f"alb-logs/{self.environment_suffix}/*")],
                conditions={
                    "StringEquals": {
                        "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                }
            )
        )

        # Allow ALB service to write to the bucket
        bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AllowALBAccessLogsCheck",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("elasticloadbalancing.amazonaws.com")],
                actions=["s3:PutObject"],
                resources=[bucket.bucket_arn, bucket.arn_for_objects("*")]
            )
        )

        return bucket

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with primary key and sort key"""
        table = dynamodb.Table(
            self, f"TapDynamoDBTable-{self.environment_suffix}",
            table_name=f"tap-data-table-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="sk",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),  # Fix: Use the new parameter name
            removal_policy=RemovalPolicy.DESTROY,
            time_to_live_attribute="ttl",
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )

        # Add Global Secondary Index
        table.add_global_secondary_index(
            index_name="GSI1",
            partition_key=dynamodb.Attribute(
                name="gsi1pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="gsi1sk",
                type=dynamodb.AttributeType.STRING
            )
        )

        return table

    def _create_sns_topic(self) -> sns.Topic:
        """Create SNS topic for notifications"""
        topic = sns.Topic(
            self, f"TapSNSTopic-{self.environment_suffix}",
            topic_name=f"tap-notifications-{self.environment_suffix}",
            display_name=f"TAP Notifications - {self.environment_suffix.upper()}",
            fifo=False
        )

        # Add CloudWatch alarms subscription (example)
        topic.add_subscription(
            sns_subscriptions.EmailSubscription("veerasolaiyappan@gmail.com")  # Fix: Use the correct import
        )

        return topic

    def _create_lambda_role(self) -> iam.Role:
        """Create IAM role for Lambda function with least privilege access"""
        lambda_role = iam.Role(
            self, f"LambdaExecutionRole-{self.environment_suffix}",
            role_name=f"lambda-execution-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ],
            inline_policies={
                "DynamoDBPolicy": iam.PolicyDocument(
                    statements=[
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
                            resources=[self.dynamodb_table.table_arn, f"{self.dynamodb_table.table_arn}/index/*"]
                        )
                    ]
                ),
                "S3Policy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject"
                            ],
                            resources=[f"{self.s3_bucket.bucket_arn}/*"]
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["s3:ListBucket"],
                            resources=[self.s3_bucket.bucket_arn]
                        )
                    ]
                ),
                "ParameterStorePolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "ssm:GetParameter",
                                "ssm:GetParameters",
                                "ssm:GetParametersByPath"
                            ],
                            resources=[f"arn:aws:ssm:{self.region}:{self.account}:parameter/tap/{self.environment_suffix}/*"]
                        )
                    ]
                ),
                "SNSPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=["sns:Publish"],
                            resources=[self.sns_topic.topic_arn]
                        )
                    ]
                )
            }
        )

        return lambda_role

    def _create_ec2_role(self) -> iam.Role:
        """Create IAM role for EC2 instances with least privilege access"""
        ec2_role = iam.Role(
            self, f"EC2InstanceRole-{self.environment_suffix}",
            role_name=f"ec2-instance-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ],
            inline_policies={
                "S3AccessPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:GetObject",
                                "s3:PutObject"
                            ],
                            resources=[f"{self.s3_bucket.bucket_arn}/*"]
                        )
                    ]
                ),
                "ParameterStoreReadPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "ssm:GetParameter",
                                "ssm:GetParameters"
                            ],
                            resources=[f"arn:aws:ssm:{self.region}:{self.account}:parameter/tap/{self.environment_suffix}/*"]
                        )
                    ]
                )
            }
        )

        # Create instance profile
        instance_profile = iam.InstanceProfile(
            self, f"EC2InstanceProfile-{self.environment_suffix}",
            instance_profile_name=f"ec2-instance-profile-{self.environment_suffix}",
            role=ec2_role
        )

        return ec2_role

    def _create_lambda_function(self) -> _lambda.Function:
        """Create Lambda function for processing incoming data streams"""
        # Create CloudWatch Log Group for Lambda
        lambda_log_group = logs.LogGroup(
            self, f"LambdaLogGroup-{self.environment_suffix}",
            log_group_name=f"/aws/lambda/tap-data-processor-{self.environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY
        )

        lambda_function = _lambda.Function(
            self, f"TapDataProcessor-{self.environment_suffix}",
            function_name=f"tap-data-processor-{self.environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import boto3
import os
from datetime import datetime

def handler(event, context):
    print(f"Processing event: {json.dumps(event)}")
    
    # Initialize AWS clients
    dynamodb = boto3.resource('dynamodb')
    s3 = boto3.client('s3')
    sns = boto3.client('sns')
    
    # Get environment variables
    table_name = os.environ['DYNAMODB_TABLE']
    bucket_name = os.environ['S3_BUCKET']
    sns_topic = os.environ['SNS_TOPIC']
    
    try:
        # Process the incoming data
        timestamp = datetime.utcnow().isoformat()
        
        # Store data in DynamoDB
        table = dynamodb.Table(table_name)
        table.put_item(
            Item={
                'pk': f"DATA#{timestamp}",
                'sk': f"PROCESS#{context.aws_request_id}",
                'timestamp': timestamp,
                'data': event.get('body', ''),
                'request_id': context.aws_request_id,
                'ttl': int((datetime.utcnow().timestamp() + 86400))  # 24 hours TTL
            }
        )
        
        # Optionally store in S3
        if event.get('body'):
            s3.put_object(
                Bucket=bucket_name,
                Key=f"processed-data/{timestamp}-{context.aws_request_id}.json",
                Body=json.dumps(event),
                ContentType='application/json'
            )
        
        # Send notification
        sns.publish(
            TopicArn=sns_topic,
            Message=f"Data processed successfully at {timestamp}",
            Subject="TAP Data Processing Notification"
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Data processed successfully',
                'timestamp': timestamp,
                'request_id': context.aws_request_id
            })
        }
        
    except Exception as e:
        print(f"Error processing data: {str(e)}")
        
        # Send error notification
        sns.publish(
            TopicArn=sns_topic,
            Message=f"Error processing data: {str(e)}",
            Subject="TAP Data Processing Error"
        )
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
            """),
            role=self.lambda_role,
            timeout=Duration.seconds(60),
            memory_size=256,
            environment={
                'DYNAMODB_TABLE': self.dynamodb_table.table_name,
                'S3_BUCKET': self.s3_bucket.bucket_name,
                'SNS_TOPIC': self.sns_topic.topic_arn,
                'ENVIRONMENT': self.environment_suffix
            },
            log_group=lambda_log_group,
            dead_letter_queue_enabled=True,
            retry_attempts=2
        )

        return lambda_function

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway to trigger Lambda function"""
        # Create CloudWatch Log Group for API Gateway
        api_log_group = logs.LogGroup(
            self, f"APIGatewayLogGroup-{self.environment_suffix}",
            log_group_name=f"/aws/apigateway/tap-api-{self.environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY
        )

        api = apigateway.RestApi(
            self, f"TapAPI-{self.environment_suffix}",
            rest_api_name=f"tap-api-{self.environment_suffix}",
            description=f"TAP API Gateway for {self.environment_suffix} environment",
            endpoint_configuration=apigateway.EndpointConfiguration(
                types=[apigateway.EndpointType.REGIONAL]
            ),
            deploy_options=apigateway.StageOptions(
                stage_name=self.environment_suffix,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                access_log_destination=apigateway.LogGroupLogDestination(api_log_group),
                # Fix: Use a simpler access log format
                access_log_format=apigateway.AccessLogFormat.clf()
            ),
            cloud_watch_role=True
        )

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.lambda_function,
            request_templates={
                "application/json": json.dumps({
                    "body": "$input.json('$')",
                    "headers": {
                        "#foreach($header in $input.params().header.keySet())": 
                        "\"$header\": \"$util.escapeJavaScript($input.params().header.get($header))\""
                    },
                    "method": "$context.httpMethod",
                    "params": {
                        "#foreach($param in $input.params().path.keySet())":
                        "\"$param\": \"$util.escapeJavaScript($input.params().path.get($param))\""
                    },
                    "query": {
                        "#foreach($queryParam in $input.params().querystring.keySet())":
                        "\"$queryParam\": \"$util.escapeJavaScript($input.params().querystring.get($queryParam))\""
                    }
                })
            }
        )

        # Create resources and methods
        data_resource = api.root.add_resource("data")
        process_resource = data_resource.add_resource("process")
        
        process_resource.add_method(
            "POST", 
            lambda_integration,
            api_key_required=True,
            authorization_type=apigateway.AuthorizationType.NONE
        )

        # Add CORS support
        process_resource.add_cors_preflight(
            allow_origins=["*"],
            allow_methods=["POST", "OPTIONS"],
            allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
        )

        # Create API Key and Usage Plan
        api_key = api.add_api_key(
            f"TapAPIKey-{self.environment_suffix}",
            api_key_name=f"tap-api-key-{self.environment_suffix}",
            description=f"API Key for TAP {self.environment_suffix} environment"
        )

        usage_plan = api.add_usage_plan(
            f"TapUsagePlan-{self.environment_suffix}",
            name=f"tap-usage-plan-{self.environment_suffix}",
            description=f"Usage plan for TAP {self.environment_suffix} environment",
            throttle=apigateway.ThrottleSettings(
                rate_limit=1000,
                burst_limit=2000
            ),
            quota=apigateway.QuotaSettings(
                limit=10000,
                period=apigateway.Period.DAY
            ),
            api_stages=[
                apigateway.UsagePlanPerApiStage(
                    api=api,
                    stage=api.deployment_stage
                )
            ]
        )

        usage_plan.add_api_key(api_key)

        return api

    def _create_rds_instance(self) -> rds.DatabaseInstance:
        """Create RDS instance in private subnet for data management"""
        # Create security group for RDS
        rds_security_group = ec2.SecurityGroup(
            self, f"RDSSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )

        # Use the EC2 security group that will be created later
        # We'll configure the RDS access after EC2 instances are created
        
        # Create subnet group for RDS
        subnet_group = rds.SubnetGroup(
            self, f"RDSSubnetGroup-{self.environment_suffix}",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            )
        )

        # Create parameter group for enhanced security
        parameter_group = rds.ParameterGroup(
            self, f"RDSParameterGroup-{self.environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            description="Parameter group with security enhancements",
            parameters={
                "log_statement": "all",
                "log_min_duration_statement": "1000",
                "shared_preload_libraries": "pg_stat_statements"
            }
        )

        # Create RDS instance
        rds_instance = rds.DatabaseInstance(
            self, f"TapRDSInstance-{self.environment_suffix}",
            instance_identifier=f"tap-db-{self.environment_suffix}",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_8
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            credentials=rds.Credentials.from_generated_secret(
                username="dbadmin",
                secret_name=f"tap-db-credentials-{self.environment_suffix}",
                exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\"\\@"
            ),
            vpc=self.vpc,
            subnet_group=subnet_group,
            security_groups=[rds_security_group],
            database_name="tapdb",
            allocated_storage=20,
            max_allocated_storage=100,
            storage_encrypted=True,
            multi_az=False,
            auto_minor_version_upgrade=True,
            backup_retention=Duration.days(7),
            deletion_protection=False,
            delete_automated_backups=True,
            parameter_group=parameter_group,
            cloudwatch_logs_exports=["postgresql"],
            monitoring_interval=Duration.seconds(60),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Store the RDS security group for later configuration
        self.rds_security_group = rds_security_group

        return rds_instance

    def _create_ec2_instances(self) -> list:
        """Create EC2 instances for the application"""
        # Create security group for EC2 instances
        ec2_security_group = ec2.SecurityGroup(
            self, f"EC2WebSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for EC2 web instances",
            allow_all_outbound=True
        )

        # Allow HTTP traffic from ALB
        ec2_security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from ALB"
        )

        # Allow HTTPS traffic from ALB
        ec2_security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic from ALB"
        )

        # Allow SSH access for management
        ec2_security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.0.0.0/16"),
            connection=ec2.Port.tcp(22),
            description="Allow SSH access from VPC"
        )

        # Now configure RDS to allow access from EC2 instances
        if hasattr(self, 'rds_security_group'):
            self.rds_security_group.add_ingress_rule(
                peer=ec2_security_group,
                connection=ec2.Port.tcp(5432),
                description="Allow EC2 instances to access PostgreSQL"
            )

        # Store the EC2 security group for ALB configuration
        self.ec2_security_group = ec2_security_group

        # Fix: Correct CloudWatch agent configuration JSON
        cloudwatch_config = {
            "logs": {
                "logs_collected": {
                    "files": {
                        "collect_list": [
                            {
                                "file_path": "/var/log/httpd/access_log",
                                "log_group_name": f"/aws/ec2/httpd-access-{self.environment_suffix}",
                                "log_stream_name": "{instance_id}"
                            },
                            {
                                "file_path": "/var/log/httpd/error_log",
                                "log_group_name": f"/aws/ec2/httpd-error-{self.environment_suffix}",
                                "log_stream_name": "{instance_id}"
                            }
                        ]
                    }
                }
            },
            "metrics": {
                "namespace": f"TAP/{self.environment_suffix}",
                "metrics_collected": {
                    "cpu": {
                        "measurement": ["cpu_usage_idle", "cpu_usage_iowait"]
                    },
                    "disk": {
                        "measurement": ["used_percent"],
                        "metrics_collection_interval": 60,
                        "resources": ["*"]
                    },
                    "mem": {
                        "measurement": ["mem_used_percent"]
                    }
                }
            }
        }

        # Create user data script
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            f"echo '<h1>TAP Application Server</h1>' > /var/www/html/index.html",
            f"echo '<p>Environment: {self.environment_suffix}</p>' >> /var/www/html/index.html",
            "echo '<p>Instance ID: ' $(curl -s http://169.254.169.254/latest/meta-data/instance-id) '</p>' >> /var/www/html/index.html",
            
            # Install CloudWatch agent
            "yum install -y amazon-cloudwatch-agent",
            f"cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'",
            json.dumps(cloudwatch_config, indent=2),  # Fix: Proper JSON formatting
            "EOF",
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s"
        )

        # Use latest_amazon_linux2
        amazon_linux = ec2.MachineImage.latest_amazon_linux2(
            edition=ec2.AmazonLinuxEdition.STANDARD,
            virtualization=ec2.AmazonLinuxVirt.HVM,
            storage=ec2.AmazonLinuxStorage.GENERAL_PURPOSE
        )

        # Create EC2 instances
        instances = []
        for i in range(2):  # Create 2 instances for redundancy
            instance = ec2.Instance(
                self, f"TapEC2Instance{i+1}-{self.environment_suffix}",
                instance_name=f"tap-instance-{i+1}-{self.environment_suffix}",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MICRO
                ),
                machine_image=amazon_linux,
                vpc=self.vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
                ),
                security_group=ec2_security_group,
                role=self.ec2_role,
                user_data=user_data,
                detailed_monitoring=True
            )
            instances.append(instance)

        return instances

    def _create_application_load_balancer(self) -> elbv2.ApplicationLoadBalancer:
        """Create Application Load Balancer to distribute traffic to EC2 instances"""
        # Create security group for ALB
        alb_security_group = ec2.SecurityGroup(
            self, f"ALBSecurityGroup-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )

        # Allow HTTP traffic from internet
        alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic from internet"
        )

        # Allow HTTPS traffic from internet
        alb_security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic from internet"
        )

        # Create Application Load Balancer
        alb = elbv2.ApplicationLoadBalancer(
            self, f"TapALB-{self.environment_suffix}",
            load_balancer_name=f"tap-alb-{self.environment_suffix}",
            vpc=self.vpc,
            internet_facing=True,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            security_group=alb_security_group
        )

        # Create target group
        target_group = elbv2.ApplicationTargetGroup(
            self, f"TapTargetGroup-{self.environment_suffix}",
            target_group_name=f"tap-targets-{self.environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=self.vpc,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                path="/",
                port="80",
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                interval=Duration.seconds(30),
                healthy_threshold_count=2,
                unhealthy_threshold_count=3
            )
        )

        # Fix: Add EC2 instances to target group using the correct import
        for instance in self.ec2_instances:
            target_group.add_target(
                elbv2_targets.InstanceTarget(instance, port=80)
            )

        # Create listener
        listener = alb.add_listener(
            f"TapALBListener-{self.environment_suffix}",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_action=elbv2.ListenerAction.forward([target_group])
        )

        return alb

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        # VPC Output
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID for the TAP application",
            export_name=f"TapVPCId-{self.environment_suffix}"
        )

        # S3 Bucket Output
        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 bucket name for TAP data storage",
            export_name=f"TapS3BucketName-{self.environment_suffix}"
        )

        # DynamoDB Table Output
        CfnOutput(
            self, "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB table name for TAP data",
            export_name=f"TapDynamoDBTableName-{self.environment_suffix}"
        )

        # Lambda Function Output
        CfnOutput(
            self, "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Lambda function name for data processing",
            export_name=f"TapLambdaFunctionName-{self.environment_suffix}"
        )

        # API Gateway Output
        CfnOutput(
            self, "APIGatewayURL",
            value=self.api_gateway.url,
            description="API Gateway URL for TAP application",
            export_name=f"TapAPIGatewayURL-{self.environment_suffix}"
        )

        # RDS Instance Output
        CfnOutput(
            self, "RDSEndpoint",
            value=self.rds_instance.instance_endpoint.hostname,
            description="RDS instance endpoint",
            export_name=f"TapRDSEndpoint-{self.environment_suffix}"
        )

        # ALB Output
        CfnOutput(
            self, "ALBDNSName",
            value=self.alb.load_balancer_dns_name,
            description="Application Load Balancer DNS name",
            export_name=f"TapALBDNSName-{self.environment_suffix}"
        )

        # SNS Topic Output
        CfnOutput(
            self, "SNSTopicArn",
            value=self.sns_topic.topic_arn,
            description="SNS topic ARN for notifications",
            export_name=f"TapSNSTopicArn-{self.environment_suffix}"
        )
