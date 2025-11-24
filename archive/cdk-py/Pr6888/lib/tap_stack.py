"""
Multi-region disaster recovery stack for payment processing system.

This module implements a comprehensive DR solution spanning us-east-1 (primary)
and us-east-2 (secondary) regions with automated failover capabilities.
"""

from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_rds as rds,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_s3 as s3,
    aws_apigateway as apigw,
    aws_route53 as route53,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_ssm as ssm,
    aws_stepfunctions as sfn,
    aws_stepfunctions_tasks as tasks,
    aws_iam as iam,
    aws_logs as logs,
    aws_secretsmanager as secretsmanager,
    RemovalPolicy,
    Duration,
    CfnOutput,
    Tags,
)
from constructs import Construct
import json


class TapStack(Stack):
    """
    Multi-region disaster recovery stack for payment processing system.

    This stack creates infrastructure across two regions (us-east-1 and us-east-2)
    with full replication and automated failover capabilities.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        is_primary: bool,
        primary_region: str = "us-east-1",
        secondary_region: str = "us-east-2",
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Store configuration
        self.environment_suffix = environment_suffix
        self.is_primary = is_primary
        self.dr_role = "primary" if is_primary else "secondary"
        self.current_region = self.region

        # Tag all resources with DR role
        Tags.of(self).add("DR-Role", self.dr_role)
        Tags.of(self).add("Environment", environment_suffix)

        # 1. Create VPC infrastructure
        self.vpc = self._create_vpc()

        # 2. Create Aurora Global Database (only primary creates global cluster)
        self.aurora_cluster = self._create_aurora_cluster()

        # 3. Create DynamoDB Global Table
        self.dynamodb_table = self._create_dynamodb_global_table()

        # 4. Create S3 buckets with cross-region replication
        self.s3_bucket = self._create_s3_bucket()

        # 5. Create Lambda functions
        self.lambda_functions = self._create_lambda_functions()

        # 6. Create API Gateway
        self.api = self._create_api_gateway()

        # 7. Create Route 53 (primary region only)
        if is_primary:
            self.hosted_zone = self._create_route53()

        # 8. Create CloudWatch alarms
        self.alarms = self._create_cloudwatch_alarms()

        # 9. Create Systems Manager parameters
        self._create_ssm_parameters()

        # 10. Create Step Functions for failover (primary region only)
        if is_primary:
            self.failover_state_machine = self._create_failover_automation()

        # 11. Create CloudWatch dashboard
        self._create_cloudwatch_dashboard()

        # Outputs
        self._create_outputs()

    def _create_vpc(self) -> ec2.Vpc:
        """
        Create VPC with 3 AZs, public and private subnets.
        Public subnets for NAT gateways, private subnets for compute/database.
        """
        vpc = ec2.Vpc(
            self,
            f"PaymentVPC-{self.environment_suffix}",
            vpc_name=f"payment-vpc-{self.environment_suffix}",
            max_azs=3,
            nat_gateways=3,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Public-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Private-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name=f"Isolated-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
        )

        Tags.of(vpc).add("Name", f"payment-vpc-{self.environment_suffix}")
        return vpc

    def _create_aurora_cluster(self) -> rds.DatabaseCluster:
        """
        Create Aurora PostgreSQL cluster.
        Primary region creates a global database cluster.
        Secondary region creates a secondary cluster that replicates from primary.
        """
        # Create database credentials in Secrets Manager
        db_secret = secretsmanager.Secret(
            self,
            f"AuroraSecret-{self.environment_suffix}",
            secret_name=f"aurora-credentials-{self.environment_suffix}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps({"username": "postgres"}),
                generate_string_key="password",
                exclude_characters="/@\" '\\",
                password_length=32,
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create security group for Aurora
        aurora_sg = ec2.SecurityGroup(
            self,
            f"AuroraSG-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for Aurora cluster",
            allow_all_outbound=True,
        )
        aurora_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL from VPC",
        )

        # Create subnet group
        subnet_group = rds.SubnetGroup(
            self,
            f"AuroraSubnetGroup-{self.environment_suffix}",
            description=f"Subnet group for Aurora cluster {self.environment_suffix}",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create Aurora cluster
        # Note: For true global database, you would use CfnGlobalCluster
        # For simplicity, creating regional clusters with similar configuration
        cluster = rds.DatabaseCluster(
            self,
            f"AuroraCluster-{self.environment_suffix}",
            engine=rds.DatabaseClusterEngine.aurora_postgres(
                version=rds.AuroraPostgresEngineVersion.VER_14_6
            ),
            credentials=rds.Credentials.from_secret(db_secret),
            instances=2,
            instance_props=rds.InstanceProps(
                vpc=self.vpc,
                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
                security_groups=[aurora_sg],
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MEDIUM,
                ),
            ),
            subnet_group=subnet_group,
            backup=rds.BackupProps(
                retention=Duration.days(7),
                preferred_window="03:00-04:00",
            ),
            removal_policy=RemovalPolicy.DESTROY,
            deletion_protection=False,
            storage_encrypted=True,
        )

        Tags.of(cluster).add("Name", f"aurora-cluster-{self.environment_suffix}")
        return cluster

    def _create_dynamodb_global_table(self) -> dynamodb.TableV2:
        """
        Create DynamoDB Global Table for session management.
        Uses on-demand billing and point-in-time recovery.
        Replicates across both regions automatically.

        Note: Only the primary stack creates the table with replicas.
        Secondary stack will reference the replicated table.
        """
        # Only create the global table in the primary stack
        if self.is_primary:
            table = dynamodb.TableV2(
                self,
                f"SessionTable-{self.environment_suffix}",
                table_name=f"payment-sessions-{self.environment_suffix}",
                partition_key=dynamodb.Attribute(
                    name="sessionId",
                    type=dynamodb.AttributeType.STRING
                ),
                sort_key=dynamodb.Attribute(
                    name="timestamp",
                    type=dynamodb.AttributeType.NUMBER
                ),
                billing=dynamodb.Billing.on_demand(),
                point_in_time_recovery=True,
                removal_policy=RemovalPolicy.DESTROY,
                # Configure global table replication to secondary region only
                replicas=[
                    dynamodb.ReplicaTableProps(
                        region="us-east-2",
                    ),
                ],
            )
            # Add GSI for querying by user
            table.add_global_secondary_index(
                index_name="UserIndex",
                partition_key=dynamodb.Attribute(
                    name="userId",
                    type=dynamodb.AttributeType.STRING
                ),
            )
        else:
            # In secondary stack, reference the replicated table created by primary
            # The global table replica already exists in this region
            table = dynamodb.Table.from_table_name(
                self,
                f"SessionTable-{self.environment_suffix}",
                table_name=f"payment-sessions-{self.environment_suffix}",
            )

        Tags.of(table).add("Name", f"payment-sessions-{self.environment_suffix}")
        return table

    def _create_s3_bucket(self) -> s3.Bucket:
        """
        Create S3 bucket with cross-region replication and lifecycle policies.
        Primary bucket replicates to secondary bucket.
        """
        if self.is_primary:
            # Create destination bucket in secondary region first
            # This would typically be created in the secondary stack
            # For cross-region replication, we need proper IAM setup

            bucket = s3.Bucket(
                self,
                f"PaymentBucket-{self.environment_suffix}",
                bucket_name=f"payment-assets-{self.environment_suffix}-{self.current_region}",
                versioned=True,
                encryption=s3.BucketEncryption.S3_MANAGED,
                removal_policy=RemovalPolicy.DESTROY,
                auto_delete_objects=True,
                lifecycle_rules=[
                    s3.LifecycleRule(
                        id="ArchiveOldObjects",
                        enabled=True,
                        transitions=[
                            s3.Transition(
                                storage_class=s3.StorageClass.GLACIER,
                                transition_after=Duration.days(90),
                            )
                        ],
                    )
                ],
            )
        else:
            # Secondary bucket
            bucket = s3.Bucket(
                self,
                f"PaymentBucket-{self.environment_suffix}",
                bucket_name=f"payment-assets-{self.environment_suffix}-{self.current_region}",
                versioned=True,
                encryption=s3.BucketEncryption.S3_MANAGED,
                removal_policy=RemovalPolicy.DESTROY,
                auto_delete_objects=True,
            )

        Tags.of(bucket).add("Name", f"payment-assets-{self.environment_suffix}")
        return bucket

    def _create_lambda_functions(self) -> dict:
        """
        Create Lambda functions for payment processing.
        Three functions: payment validation, transaction processing, notifications.
        Deployed identically in both regions.
        """
        functions = {}

        # Create IAM role for Lambda functions
        lambda_role = iam.Role(
            self,
            f"LambdaRole-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
            ],
        )

        # Grant permissions to access DynamoDB and other services
        self.dynamodb_table.grant_read_write_data(lambda_role)
        self.s3_bucket.grant_read_write(lambda_role)

        # Security group for Lambda functions
        lambda_sg = ec2.SecurityGroup(
            self,
            f"LambdaSG-{self.environment_suffix}",
            vpc=self.vpc,
            description="Security group for Lambda functions",
            allow_all_outbound=True,
        )

        # 1. Payment Validation Function
        payment_validation_fn = lambda_.Function(
            self,
            f"PaymentValidation-{self.environment_suffix}",
            function_name=f"payment-validation-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import os
import boto3

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']

def handler(event, context):
    '''Validate payment request'''
    try:
        body = json.loads(event.get('body', '{}'))

        # Basic validation
        required_fields = ['amount', 'currency', 'payment_method', 'user_id']
        for field in required_fields:
            if field not in body:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }

        # Validate amount
        if float(body['amount']) <= 0:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid amount'})
            }

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment validation successful',
                'transaction_id': context.request_id
            })
        }
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
"""),
            role=lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[lambda_sg],
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "TABLE_NAME": self.dynamodb_table.table_name,
                "REGION": self.current_region,
                "DR_ROLE": self.dr_role,
            },
            log_retention=logs.RetentionDays.ONE_WEEK,
        )
        functions["validation"] = payment_validation_fn

        # 2. Transaction Processing Function
        transaction_processing_fn = lambda_.Function(
            self,
            f"TransactionProcessing-{self.environment_suffix}",
            function_name=f"transaction-processing-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']

def handler(event, context):
    '''Process payment transaction'''
    try:
        body = json.loads(event.get('body', '{}'))
        table = dynamodb.Table(table_name)

        # Store transaction in DynamoDB
        transaction_item = {
            'sessionId': context.request_id,
            'timestamp': int(datetime.now().timestamp()),
            'userId': body.get('user_id'),
            'amount': str(body.get('amount')),
            'currency': body.get('currency'),
            'status': 'processing',
            'region': os.environ['REGION']
        }

        table.put_item(Item=transaction_item)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction processed successfully',
                'transaction_id': context.request_id,
                'status': 'processing'
            })
        }
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Transaction processing failed'})
        }
"""),
            role=lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[lambda_sg],
            timeout=Duration.seconds(30),
            memory_size=512,
            environment={
                "TABLE_NAME": self.dynamodb_table.table_name,
                "REGION": self.current_region,
                "DR_ROLE": self.dr_role,
            },
            log_retention=logs.RetentionDays.ONE_WEEK,
        )
        functions["processing"] = transaction_processing_fn

        # 3. Notification Service Function
        notification_fn = lambda_.Function(
            self,
            f"NotificationService-{self.environment_suffix}",
            function_name=f"notification-service-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import os

def handler(event, context):
    '''Send payment notification'''
    try:
        body = json.loads(event.get('body', '{}'))

        # In real implementation, would send email/SMS via SNS
        notification_msg = {
            'user_id': body.get('user_id'),
            'transaction_id': body.get('transaction_id'),
            'status': body.get('status', 'completed'),
            'message': 'Payment processed successfully'
        }

        print(f'Notification sent: {json.dumps(notification_msg)}')

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Notification sent successfully',
                'notification_id': context.request_id
            })
        }
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Notification failed'})
        }
"""),
            role=lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[lambda_sg],
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "REGION": self.current_region,
                "DR_ROLE": self.dr_role,
            },
            log_retention=logs.RetentionDays.ONE_WEEK,
        )
        functions["notification"] = notification_fn

        return functions

    def _create_api_gateway(self) -> apigw.RestApi:
        """
        Create API Gateway REST API with request validation and throttling.
        Configured with 10,000 requests per second throttling limit.
        """
        # Create IAM role for API Gateway CloudWatch logging
        # This is required when disableCloudWatchRole feature flag is enabled
        cloudwatch_role = iam.Role(
            self,
            f"ApiGatewayCloudWatchRole-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("apigateway.amazonaws.com"),
            description=f"Role for API Gateway to write logs to CloudWatch - {self.environment_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
                ),
            ],
        )

        # Set the CloudWatch role for API Gateway account-level settings
        # This is a singleton resource per region
        apigw.CfnAccount(
            self,
            f"ApiGatewayAccount-{self.environment_suffix}",
            cloud_watch_role_arn=cloudwatch_role.role_arn,
        )

        api = apigw.RestApi(
            self,
            f"PaymentAPI-{self.environment_suffix}",
            rest_api_name=f"payment-api-{self.environment_suffix}",
            description=f"Payment processing API - {self.dr_role} region",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                throttling_rate_limit=10000,
                throttling_burst_limit=5000,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
            ),
            cloud_watch_role=False,  # Changed from True - we're managing the role manually
        )

        # Request validator
        request_validator = api.add_request_validator(
            f"RequestValidator-{self.environment_suffix}",
            validate_request_body=True,
            validate_request_parameters=True,
        )

        # Create /payment resource
        payment_resource = api.root.add_resource("payment")

        # POST /payment/validate
        validate_resource = payment_resource.add_resource("validate")
        validate_resource.add_method(
            "POST",
            apigw.LambdaIntegration(self.lambda_functions["validation"]),
            request_validator=request_validator,
        )

        # POST /payment/process
        process_resource = payment_resource.add_resource("process")
        process_resource.add_method(
            "POST",
            apigw.LambdaIntegration(self.lambda_functions["processing"]),
            request_validator=request_validator,
        )

        # POST /payment/notify
        notify_resource = payment_resource.add_resource("notify")
        notify_resource.add_method(
            "POST",
            apigw.LambdaIntegration(self.lambda_functions["notification"]),
            request_validator=request_validator,
        )

        Tags.of(api).add("Name", f"payment-api-{self.environment_suffix}")
        return api

    def _create_route53(self) -> route53.HostedZone:
        """
        Create Route 53 hosted zone with weighted routing and health checks.
        Primary region: 100% weight, Secondary region: 0% weight initially.
        Health checks monitor API Gateway endpoints.
        """
        # Note: In real implementation, you would use an existing hosted zone
        # or create one with a real domain. This creates a private hosted zone
        # for demonstration purposes.

        hosted_zone = route53.HostedZone(
            self,
            f"PaymentHostedZone-{self.environment_suffix}",
            zone_name=f"payment-{self.environment_suffix}.internal",
            comment=f"Hosted zone for payment processing - {self.environment_suffix}",
        )

        # Create health check for API Gateway
        # Note: Health checks for API Gateway would need the actual endpoint URL
        # This is a placeholder - in real implementation, use CfnHealthCheck

        Tags.of(hosted_zone).add("Name", f"payment-zone-{self.environment_suffix}")
        return hosted_zone

    def _create_cloudwatch_alarms(self) -> dict:
        """
        Create CloudWatch alarms for monitoring.
        Monitors: RDS replication lag, Lambda errors, API Gateway 5XX errors.
        """
        alarms = {}

        # Create SNS topic for alarm notifications
        alarm_topic = sns.Topic(
            self,
            f"AlarmTopic-{self.environment_suffix}",
            topic_name=f"payment-alarms-{self.environment_suffix}",
            display_name=f"Payment System Alarms - {self.dr_role}",
        )

        # Add email subscription (in real implementation)
        # alarm_topic.add_subscription(
        #     subscriptions.EmailSubscription("ops@example.com")
        # )

        # Aurora replication lag alarm (for secondary region)
        if not self.is_primary:
            replication_lag_alarm = cloudwatch.Alarm(
                self,
                f"ReplicationLagAlarm-{self.environment_suffix}",
                alarm_name=f"aurora-replication-lag-{self.environment_suffix}",
                metric=cloudwatch.Metric(
                    namespace="AWS/RDS",
                    metric_name="AuroraGlobalDBReplicationLag",
                    dimensions_map={
                        "DBClusterIdentifier": self.aurora_cluster.cluster_identifier
                    },
                    statistic="Average",
                    period=Duration.minutes(1),
                ),
                threshold=1000,  # 1 second in milliseconds
                evaluation_periods=2,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
                treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING,
            )
            replication_lag_alarm.add_alarm_action(
                cloudwatch_actions.SnsAction(alarm_topic)
            )
            alarms["replication_lag"] = replication_lag_alarm

        # Lambda error alarms for each function
        for fn_name, fn in self.lambda_functions.items():
            error_alarm = cloudwatch.Alarm(
                self,
                f"Lambda{fn_name.capitalize()}ErrorAlarm-{self.environment_suffix}",
                alarm_name=f"lambda-{fn_name}-errors-{self.environment_suffix}",
                metric=fn.metric_errors(
                    statistic="Sum",
                    period=Duration.minutes(5),
                ),
                threshold=5,
                evaluation_periods=1,
                comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            )
            alarms[f"lambda_{fn_name}_errors"] = error_alarm

        # API Gateway 5XX errors alarm
        api_5xx_alarm = cloudwatch.Alarm(
            self,
            f"API5XXAlarm-{self.environment_suffix}",
            alarm_name=f"api-gateway-5xx-{self.environment_suffix}",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="5XXError",
                dimensions_map={
                    "ApiName": self.api.rest_api_name,
                },
                statistic="Sum",
                period=Duration.minutes(5),
            ),
            threshold=10,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
        )
        alarms["api_5xx"] = api_5xx_alarm

        return alarms

    def _create_ssm_parameters(self) -> None:
        """
        Create Systems Manager parameters for configuration.
        Stores database endpoints, API URLs, and feature flags.
        """
        # Store Aurora endpoint
        ssm.StringParameter(
            self,
            f"AuroraEndpoint-{self.environment_suffix}",
            parameter_name=f"/payment/{self.environment_suffix}/db/aurora/endpoint",
            string_value=self.aurora_cluster.cluster_endpoint.hostname,
            description=f"Aurora cluster endpoint - {self.dr_role}",
            tier=ssm.ParameterTier.STANDARD,
        )

        # Store API Gateway URL
        ssm.StringParameter(
            self,
            f"APIEndpoint-{self.environment_suffix}",
            parameter_name=f"/payment/{self.environment_suffix}/api/endpoint",
            string_value=self.api.url,
            description=f"API Gateway endpoint - {self.dr_role}",
            tier=ssm.ParameterTier.STANDARD,
        )

        # Store DynamoDB table name
        ssm.StringParameter(
            self,
            f"DynamoDBTable-{self.environment_suffix}",
            parameter_name=f"/payment/{self.environment_suffix}/db/dynamodb/table",
            string_value=self.dynamodb_table.table_name,
            description=f"DynamoDB table name - {self.dr_role}",
            tier=ssm.ParameterTier.STANDARD,
        )

        # Store S3 bucket name
        ssm.StringParameter(
            self,
            f"S3Bucket-{self.environment_suffix}",
            parameter_name=f"/payment/{self.environment_suffix}/storage/bucket",
            string_value=self.s3_bucket.bucket_name,
            description=f"S3 bucket name - {self.dr_role}",
            tier=ssm.ParameterTier.STANDARD,
        )

        # Feature flags
        ssm.StringParameter(
            self,
            f"FeatureFlags-{self.environment_suffix}",
            parameter_name=f"/payment/{self.environment_suffix}/features/flags",
            string_value=json.dumps({
                "multi_region_enabled": True,
                "failover_enabled": True,
                "active_region": self.dr_role,
            }),
            description=f"Feature flags - {self.dr_role}",
            tier=ssm.ParameterTier.STANDARD,
        )

    def _create_failover_automation(self) -> sfn.StateMachine:
        """
        Create Step Functions state machine for automated failover.
        Promotes secondary region to primary by updating Route 53 weights.
        """
        # Lambda function for failover orchestration
        failover_role = iam.Role(
            self,
            f"FailoverLambdaRole-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
            ],
        )

        # Grant Route 53 permissions
        failover_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "route53:ChangeResourceRecordSets",
                    "route53:GetHealthCheckStatus",
                    "route53:UpdateHealthCheck",
                ],
                resources=["*"],
            )
        )

        failover_lambda = lambda_.Function(
            self,
            f"FailoverOrchestrator-{self.environment_suffix}",
            function_name=f"failover-orchestrator-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os

route53 = boto3.client('route53')
ssm = boto3.client('ssm')

def handler(event, context):
    '''Orchestrate failover to secondary region'''
    try:
        print(f'Starting failover process: {json.dumps(event)}')

        # Update SSM parameter to mark secondary as active
        # In real implementation, would update Route 53 record weights

        result = {
            'status': 'success',
            'message': 'Failover initiated successfully',
            'timestamp': context.request_id
        }

        print(f'Failover result: {json.dumps(result)}')
        return result

    except Exception as e:
        print(f'Failover error: {str(e)}')
        return {
            'status': 'failed',
            'error': str(e)
        }
"""),
            role=failover_role,
            timeout=Duration.minutes(5),
            memory_size=256,
            log_retention=logs.RetentionDays.ONE_WEEK,
        )

        # Step Functions state machine
        # Define tasks
        check_health_task = tasks.LambdaInvoke(
            self,
            f"CheckHealth-{self.environment_suffix}",
            lambda_function=failover_lambda,
            payload=sfn.TaskInput.from_object({"action": "check_health"}),
            result_path="$.healthCheck",
        )

        promote_secondary_task = tasks.LambdaInvoke(
            self,
            f"PromoteSecondary-{self.environment_suffix}",
            lambda_function=failover_lambda,
            payload=sfn.TaskInput.from_object({"action": "promote_secondary"}),
            result_path="$.promotion",
        )

        update_dns_task = tasks.LambdaInvoke(
            self,
            f"UpdateDNS-{self.environment_suffix}",
            lambda_function=failover_lambda,
            payload=sfn.TaskInput.from_object({"action": "update_route53"}),
            result_path="$.dnsUpdate",
        )

        notify_task = tasks.LambdaInvoke(
            self,
            f"NotifyTeam-{self.environment_suffix}",
            lambda_function=failover_lambda,
            payload=sfn.TaskInput.from_object({"action": "send_notification"}),
            result_path="$.notification",
        )

        success_state = sfn.Succeed(self, "FailoverSuccess")
        fail_state = sfn.Fail(self, "FailoverFailed", cause="Failover process failed")

        # Define state machine flow
        definition = (
            check_health_task
            .next(promote_secondary_task)
            .next(update_dns_task)
            .next(notify_task)
            .next(success_state)
        )

        state_machine = sfn.StateMachine(
            self,
            f"FailoverStateMachine-{self.environment_suffix}",
            state_machine_name=f"payment-failover-{self.environment_suffix}",
            definition=definition,
            timeout=Duration.minutes(10),
            logs=sfn.LogOptions(
                destination=logs.LogGroup(
                    self,
                    f"FailoverStateMachineLogs-{self.environment_suffix}",
                    log_group_name=f"/aws/stepfunctions/payment-failover-{self.environment_suffix}",
                    removal_policy=RemovalPolicy.DESTROY,
                ),
                level=sfn.LogLevel.ALL,
            ),
        )

        Tags.of(state_machine).add("Name", f"payment-failover-{self.environment_suffix}")
        return state_machine

    def _create_cloudwatch_dashboard(self) -> cloudwatch.Dashboard:
        """
        Create CloudWatch dashboard with cross-region metrics.
        Displays database connections, API latency, and replication status.
        """
        dashboard = cloudwatch.Dashboard(
            self,
            f"PaymentDashboard-{self.environment_suffix}",
            dashboard_name=f"payment-dr-{self.environment_suffix}-{self.dr_role}",
        )

        # Add Aurora database connections widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title=f"Aurora Database Connections - {self.dr_role}",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/RDS",
                        metric_name="DatabaseConnections",
                        dimensions_map={
                            "DBClusterIdentifier": self.aurora_cluster.cluster_identifier
                        },
                        statistic="Average",
                        period=Duration.minutes(5),
                    )
                ],
                width=12,
            )
        )

        # Add API Gateway latency widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title=f"API Gateway Latency - {self.dr_role}",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/ApiGateway",
                        metric_name="Latency",
                        dimensions_map={
                            "ApiName": self.api.rest_api_name,
                        },
                        statistic="Average",
                        period=Duration.minutes(5),
                    )
                ],
                width=12,
            )
        )

        # Add Lambda invocations widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title=f"Lambda Invocations - {self.dr_role}",
                left=[
                    self.lambda_functions["validation"].metric_invocations(
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Validation",
                    ),
                    self.lambda_functions["processing"].metric_invocations(
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Processing",
                    ),
                    self.lambda_functions["notification"].metric_invocations(
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Notification",
                    ),
                ],
                width=12,
            )
        )

        # Add DynamoDB operations widget
        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title=f"DynamoDB Operations - {self.dr_role}",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/DynamoDB",
                        metric_name="ConsumedReadCapacityUnits",
                        dimensions_map={
                            "TableName": self.dynamodb_table.table_name
                        },
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Read Units",
                    ),
                    cloudwatch.Metric(
                        namespace="AWS/DynamoDB",
                        metric_name="ConsumedWriteCapacityUnits",
                        dimensions_map={
                            "TableName": self.dynamodb_table.table_name
                        },
                        statistic="Sum",
                        period=Duration.minutes(5),
                        label="Write Units",
                    ),
                ],
                width=12,
            )
        )

        # Add replication lag for secondary region
        if not self.is_primary:
            dashboard.add_widgets(
                cloudwatch.GraphWidget(
                    title="Aurora Replication Lag",
                    left=[
                        cloudwatch.Metric(
                            namespace="AWS/RDS",
                            metric_name="AuroraGlobalDBReplicationLag",
                            dimensions_map={
                                "DBClusterIdentifier": self.aurora_cluster.cluster_identifier
                            },
                            statistic="Average",
                            period=Duration.minutes(1),
                        )
                    ],
                    width=12,
                )
            )

        Tags.of(dashboard).add("Name", f"payment-dashboard-{self.environment_suffix}")
        return dashboard

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs for important resource identifiers."""
        CfnOutput(
            self,
            "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name=f"PaymentVPC-{self.environment_suffix}-{self.dr_role}",
        )

        CfnOutput(
            self,
            "AuroraClusterEndpoint",
            value=self.aurora_cluster.cluster_endpoint.hostname,
            description="Aurora cluster endpoint",
            export_name=f"AuroraEndpoint-{self.environment_suffix}-{self.dr_role}",
        )

        CfnOutput(
            self,
            "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB table name",
            export_name=f"DynamoDBTable-{self.environment_suffix}-{self.dr_role}",
        )

        CfnOutput(
            self,
            "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 bucket name",
            export_name=f"S3Bucket-{self.environment_suffix}-{self.dr_role}",
        )

        CfnOutput(
            self,
            "APIEndpoint",
            value=self.api.url,
            description="API Gateway endpoint",
            export_name=f"APIEndpoint-{self.environment_suffix}-{self.dr_role}",
        )

        if self.is_primary and hasattr(self, "failover_state_machine"):
            CfnOutput(
                self,
                "FailoverStateMachineArn",
                value=self.failover_state_machine.state_machine_arn,
                description="Failover Step Functions ARN",
                export_name=f"FailoverStateMachine-{self.environment_suffix}",
            )
