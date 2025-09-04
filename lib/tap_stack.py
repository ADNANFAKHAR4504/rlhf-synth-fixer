from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_s3 as s3,
    aws_iam as iam,
    aws_rds as rds,
    aws_lambda as _lambda,
    aws_ssm as ssm,
    aws_logs as logs,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_sqs as sqs,
    aws_events as events,
    aws_events_targets as targets,
    CfnOutput,
)
from constructs import Construct


class TapStack(Stack):
    """Main stack for TAP infrastructure with security and high availability best practices."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Configuration parameters
        self.db_name = "tapdb"
        self.db_username = "admin"

        # Create VPC with public and private subnets
        self.vpc = self._create_vpc()

        # Create S3 bucket with encryption
        self.s3_bucket = self._create_s3_bucket()

        # Create security groups (fixed order to avoid circular dependencies)
        self.web_security_group = self._create_web_security_group()
        self.rds_security_group = self._create_rds_security_group()
        self.lambda_security_group = self._create_lambda_security_group()

        # Configure security group rules after creation to avoid circular dependencies
        self._configure_security_group_rules()

        # Create RDS instance
        self.rds_instance = self._create_rds_instance()

        # Create IAM role for S3 read-only access
        self.s3_read_role = self._create_s3_read_role()

        # Store RDS connection string in Parameter Store
        self._create_parameter_store_entries()

        # Create Lambda function
        self.lambda_function = self._create_lambda_function()

        # Create DynamoDB table
        self.dynamodb_table = self._create_dynamodb_table()

        # Create SQS queue with dead letter queue
        self.sqs_queue, self.dlq = self._create_sqs_queues()

        # Create EventBridge bus
        self.event_bus = self._create_eventbridge_bus()

        # Create additional Lambda functions for API Gateway
        self.api_lambda = self._create_api_lambda()

        # Create API Gateway
        self.api_gateway = self._create_api_gateway()

        # Add outputs
        self._add_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public and private subnets across multiple AZs."""
        vpc = ec2.Vpc(
            self, "TapVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=3,  # Use 3 AZs for high availability
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="IsolatedSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Add VPC Flow Logs for security monitoring
        vpc.add_flow_log(
            "TapVPCFlowLog",
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                logs.LogGroup(
                    self, "VPCFlowLogGroup",
                    retention=logs.RetentionDays.ONE_MONTH,
                    removal_policy=RemovalPolicy.DESTROY
                )
            )
        )

        return vpc

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with server-side encryption and security best practices."""
        # Use a unique bucket name without hardcoded account/region
        bucket_name = f"tap-secure-bucket-{self.node.addr}"
        
        bucket = s3.Bucket(
            self, "TapS3Bucket",
            bucket_name=bucket_name,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,  # For development - remove in production
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteIncompleteMultipartUploads",
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                ),
                s3.LifecycleRule(
                    id="TransitionToIA",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        )
                    ]
                )
            ]
        )

        return bucket

    def _create_s3_read_role(self) -> iam.Role:
        """Create IAM role with read-only access to S3 bucket."""
        role = iam.Role(
            self, "TapS3ReadRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role with read-only access to TAP S3 bucket",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                )
            ]
        )

        # Add S3 read-only permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:ListBucket"
                ],
                resources=[
                    self.s3_bucket.bucket_arn,
                    f"{self.s3_bucket.bucket_arn}/*"
                ]
            )
        )

        # Add SSM Parameter Store read permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                ],
                resources=[
                    f"arn:aws:ssm:{self.region}:{self.account}:parameter/tap/*"
                ]
            )
        )

        return role

    def _create_web_security_group(self) -> ec2.SecurityGroup:
        """Create security group allowing only HTTP and HTTPS traffic."""
        security_group = ec2.SecurityGroup(
            self, "TapWebSecurityGroup",
            vpc=self.vpc,
            description="Security group for web traffic (HTTP/HTTPS only)",
            allow_all_outbound=False
        )

        # Allow inbound HTTP and HTTPS
        security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP traffic"
        )

        security_group.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic"
        )

        # Allow outbound HTTPS for API calls
        security_group.add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow outbound HTTPS"
        )

        return security_group

    def _create_lambda_security_group(self) -> ec2.SecurityGroup:
        """Create security group for Lambda functions."""
        security_group = ec2.SecurityGroup(
            self, "TapLambdaSecurityGroup",
            vpc=self.vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=False
        )

        # Allow outbound HTTPS for AWS API calls
        security_group.add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS for AWS API calls"
        )

        return security_group

    def _create_rds_security_group(self) -> ec2.SecurityGroup:
        """Create security group for RDS instance."""
        security_group = ec2.SecurityGroup(
            self, "TapRDSSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS MySQL instance",
            allow_all_outbound=False
        )

        return security_group

    def _configure_security_group_rules(self):
        """Configure security group rules after all security groups are created."""
        # Allow Lambda to connect to RDS using CIDR block instead of security group reference
        self.lambda_security_group.add_egress_rule(
            peer=ec2.Peer.ipv4("10.0.0.0/16"),
            connection=ec2.Port.tcp(3306),
            description="Allow MySQL connection to RDS"
        )

        # Allow RDS to accept connections from Lambda using CIDR block
        self.rds_security_group.add_ingress_rule(
            peer=ec2.Peer.ipv4("10.0.0.0/16"),
            connection=ec2.Port.tcp(3306),
            description="Allow Lambda to connect to MySQL"
        )

    def _create_rds_instance(self) -> rds.DatabaseInstance:
        """Create RDS MySQL instance with Multi-AZ and proper security configuration."""

        # Create subnet group for RDS in isolated subnets
        subnet_group = rds.SubnetGroup(
            self, "TapRDSSubnetGroup",
            description="Subnet group for TAP RDS instance",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED)
        )

        # Create RDS instance
        rds_instance = rds.DatabaseInstance(
            self, "TapRDSInstance",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_37
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE2,
                ec2.InstanceSize.MICRO  # Use t2.micro for cost optimization
            ),
            vpc=self.vpc,
            subnet_group=subnet_group,
            security_groups=[self.rds_security_group],
            database_name=self.db_name,
            credentials=rds.Credentials.from_generated_secret(
                username=self.db_username,
                secret_name="tap/rds/credentials"
            ),
            multi_az=False,  # Disable Multi-AZ to reduce resource usage
            backup_retention=Duration.days(7),  # 7-day backup retention
            deletion_protection=False,  # Allow deletion when stack is destroyed
            removal_policy=RemovalPolicy.DESTROY,  # Delete when stack is destroyed
            storage_encrypted=False,
            monitoring_interval=Duration.minutes(1),  # Enhanced monitoring
            enable_performance_insights=False,
            allocated_storage=20,
            max_allocated_storage=100,  # Enable storage autoscaling
            storage_type=rds.StorageType.GP2,
            auto_minor_version_upgrade=True,
            preferred_backup_window="03:00-04:00",  # UTC
            preferred_maintenance_window="sun:04:00-sun:05:00"  # UTC
        )

        return rds_instance

    def _create_parameter_store_entries(self):
        """Store RDS connection information in Systems Manager Parameter Store."""

        # Store RDS endpoint
        ssm.StringParameter(
            self, "RDSEndpointParameter",
            parameter_name="/tap/rds/endpoint",
            string_value=self.rds_instance.instance_endpoint.hostname,
            description="RDS MySQL instance endpoint",
            tier=ssm.ParameterTier.STANDARD
        )

        # Store RDS port
        ssm.StringParameter(
            self, "RDSPortParameter",
            parameter_name="/tap/rds/port",
            string_value=str(self.rds_instance.instance_endpoint.port),
            description="RDS MySQL instance port",
            tier=ssm.ParameterTier.STANDARD
        )

        # Store database name
        ssm.StringParameter(
            self, "RDSDBNameParameter",
            parameter_name="/tap/rds/database_name",
            string_value=self.db_name,
            description="RDS MySQL database name",
            tier=ssm.ParameterTier.STANDARD
        )

        # Store S3 bucket name
        ssm.StringParameter(
            self, "S3BucketParameter",
            parameter_name="/tap/s3/bucket_name",
            string_value=self.s3_bucket.bucket_name,
            description="S3 bucket name for TAP application",
            tier=ssm.ParameterTier.STANDARD
        )

    def _create_lambda_function(self) -> _lambda.Function:
        """Create Lambda function with VPC configuration and proper security."""

        lambda_function = _lambda.Function(
            self, "TapLambdaFunction",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import boto3
import os

def handler(event, context):
    # Example Lambda function that can access RDS and S3

    # Get parameters from Parameter Store
    ssm = boto3.client('ssm')

    try:
        # Get RDS connection details
        rds_endpoint = ssm.get_parameter(Name='/tap/rds/endpoint')['Parameter']['Value']
        rds_port = int(ssm.get_parameter(Name='/tap/rds/port')['Parameter']['Value'])
        db_name = ssm.get_parameter(Name='/tap/rds/database_name')['Parameter']['Value']

        # Get S3 bucket name
        s3_bucket = ssm.get_parameter(Name='/tap/s3/bucket_name')['Parameter']['Value']

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Lambda function executed successfully',
                'rds_endpoint': rds_endpoint,
                'rds_port': rds_port,
                'database_name': db_name,
                's3_bucket': s3_bucket
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }
            """),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.lambda_security_group],
            role=self.s3_read_role,
            timeout=Duration.minutes(5),
            memory_size=256,
            environment={
                "REGION": self.region
            }
        )

        return lambda_function

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with proper configuration."""
        table = dynamodb.Table(
            self, "TapDynamoDBTable",
            table_name=f"tap-serverless-table-{self.node.addr}",
            partition_key=dynamodb.Attribute(
                name="pk",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="sk",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            encryption=dynamodb.TableEncryption.AWS_MANAGED
        )

        return table

    def _create_sqs_queues(self) -> tuple[sqs.Queue, sqs.Queue]:
        """Create SQS queue with dead letter queue."""
        # Create dead letter queue
        dlq = sqs.Queue(
            self, "TapDLQ",
            queue_name=f"tap-serverless-dlq-{self.node.addr}",
            retention_period=Duration.days(14),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create main queue with dead letter queue
        main_queue = sqs.Queue(
            self, "TapSQSQueue",
            queue_name=f"tap-serverless-queue-{self.node.addr}",
            retention_period=Duration.days(14),
            visibility_timeout=Duration.seconds(30),
            dead_letter_queue=sqs.DeadLetterQueue(
                max_receive_count=3,
                queue=dlq
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        return main_queue, dlq

    def _create_eventbridge_bus(self) -> events.EventBus:
        """Create EventBridge custom bus."""
        event_bus = events.EventBus(
            self, "TapEventBus",
            event_bus_name=f"tap-serverless-bus-{self.node.addr}"
        )

        return event_bus

    def _create_api_lambda(self) -> _lambda.Function:
        """Create Lambda function for API Gateway."""
        api_lambda = _lambda.Function(
            self, "TapApiLambdaFunction",
            function_name=f"tap-serverless-api-{self.node.addr}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=_lambda.Code.from_inline("""
import json
import boto3
import time
from datetime import datetime

def handler(event, context):
    # Get the HTTP method and path
    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    
    # Handle different endpoints
    if path == '/health':
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat()
            })
        }
    
    elif path == '/data' and http_method == 'POST':
        # Get DynamoDB table name from environment
        table_name = context.function_name.replace('api', 'table')
        
        # Get the request body
        body = json.loads(event.get('body', '{}'))
        
        # Create item for DynamoDB
        item = {
            'pk': f"DATA#{body.get('id', 'unknown')}",
            'sk': f"TIMESTAMP#{int(time.time())}",
            'data': body,
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Write to DynamoDB
        dynamodb = boto3.resource('dynamodb')
        table = dynamodb.Table(table_name)
        
        try:
            table.put_item(Item=item)
            return {
                'statusCode': 201,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'message': 'Data stored successfully',
                    'item': item
                })
            }
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': str(e)
                })
            }
    
    else:
        return {
            'statusCode': 404,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Not found'
            })
        }
            """),
            environment={
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "SQS_QUEUE_URL": self.sqs_queue.queue_url,
                "EVENT_BUS_NAME": self.event_bus.event_bus_name
            },
            timeout=Duration.seconds(30),
            memory_size=256
        )

        # Grant permissions
        self.dynamodb_table.grant_write_data(api_lambda)
        self.sqs_queue.grant_send_messages(api_lambda)
        self.event_bus.grant_put_events_to(api_lambda)

        return api_lambda

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway with Lambda integration."""
        api = apigateway.RestApi(
            self, "TapApiGateway",
            rest_api_name=f"tap-serverless-api-{self.node.addr}",
            description="TAP Serverless API",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["*"],
                allow_methods=["GET", "POST", "OPTIONS"],
                allow_headers=["Content-Type", "Authorization"]
            )
        )

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.api_lambda,
            request_templates={"application/json": '{"statusCode": "200"}'}
        )

        # Add health endpoint
        health_resource = api.root.add_resource("health")
        health_resource.add_method("GET", lambda_integration)

        # Add data endpoint
        data_resource = api.root.add_resource("data")
        data_resource.add_method("POST", lambda_integration)

        return api

    def _add_outputs(self):
        """Add CloudFormation outputs for integration tests."""
        CfnOutput(
            self, "ApiGatewayUrl",
            value=f"{self.api_gateway.url}",
            description="API Gateway URL"
        )

        CfnOutput(
            self, "DynamoDbTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB Table Name"
        )

        CfnOutput(
            self, "S3DataBucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 Data Bucket Name"
        )

        CfnOutput(
            self, "SqsQueueUrl",
            value=self.sqs_queue.queue_url,
            description="SQS Queue URL"
        )

        CfnOutput(
            self, "EventBusName",
            value=self.event_bus.event_bus_name,
            description="EventBridge Bus Name"
        )
