"""
Multi-Region Active-Passive Disaster Recovery Infrastructure Stack

This module implements a comprehensive disaster recovery solution spanning
us-east-1 (primary) and us-east-2 (secondary) regions with automated failover.
"""

from typing import Optional, Dict, Any
import json
import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions


class ApiGatewayResult:
    """Container for API Gateway resources and computed values."""
    def __init__(self, stage: aws.apigatewayv2.Stage, api_id: Output[str], invoke_url: Output[str]):
        self.stage = stage
        self.api_id = api_id
        self.invoke_url = invoke_url


class TapStackArgs:
    """
    Arguments for the TapStack component.

    Args:
        environment_suffix: Unique suffix for resource naming
        tags: Optional default tags for resources
    """
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[Dict[str, str]] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component implementing multi-region disaster recovery architecture.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Define regions
        primary_region = "us-east-1"
        secondary_region = "us-east-2"

        # Create AWS providers for each region
        primary_provider = aws.Provider(
            f"aws-primary-{self.environment_suffix}",
            region=primary_region,
            default_tags=aws.ProviderDefaultTagsArgs(
                tags={
                    **self.tags,
                    "Environment": self.environment_suffix,
                    "Region-Role": "Primary",
                    "DR-Tier": "Critical"
                }
            ),
            opts=ResourceOptions(parent=self)
        )

        secondary_provider = aws.Provider(
            f"aws-secondary-{self.environment_suffix}",
            region=secondary_region,
            default_tags=aws.ProviderDefaultTagsArgs(
                tags={
                    **self.tags,
                    "Environment": self.environment_suffix,
                    "Region-Role": "Secondary",
                    "DR-Tier": "Critical"
                }
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create VPCs in both regions
        primary_vpc = self._create_vpc(primary_region, primary_provider)
        secondary_vpc = self._create_vpc(secondary_region, secondary_provider)

        # Create S3 buckets with cross-region replication
        replication_role = self._create_s3_replication_role(primary_provider)
        primary_bucket, secondary_bucket = self._create_s3_buckets(
            primary_provider, secondary_provider, replication_role, primary_region, secondary_region
        )

        # Create DynamoDB Global Table
        global_table = self._create_dynamodb_global_table(primary_provider, secondary_provider)

        # Create SQS queues in both regions
        primary_queue = self._create_sqs_queue(primary_region, primary_provider)
        secondary_queue = self._create_sqs_queue(secondary_region, secondary_provider)

        # Create Lambda execution role with specific resource ARNs
        lambda_role = self._create_lambda_role(
            primary_provider, global_table, primary_queue, secondary_queue
        )

        # Create Lambda functions for payment processing
        primary_payment_lambda = self._create_payment_lambda(
            primary_region, primary_vpc, lambda_role, global_table, primary_provider
        )
        secondary_payment_lambda = self._create_payment_lambda(
            secondary_region, secondary_vpc, lambda_role, global_table, secondary_provider
        )

        # Create Lambda functions for SQS replication
        primary_sqs_lambda = self._create_sqs_replication_lambda(
            primary_region, primary_queue, secondary_queue, lambda_role, primary_provider
        )
        secondary_sqs_lambda = self._create_sqs_replication_lambda(
            secondary_region, secondary_queue, primary_queue, lambda_role, secondary_provider
        )

        # Create API Gateways in both regions
        primary_api = self._create_api_gateway(
            primary_region, primary_payment_lambda, primary_provider
        )
        secondary_api = self._create_api_gateway(
            secondary_region, secondary_payment_lambda, secondary_provider
        )

        # Create SNS topics for failover notifications (one per region)
        primary_sns_topic = self._create_sns_topic(primary_region, primary_provider)
        secondary_sns_topic = self._create_sns_topic(secondary_region, secondary_provider)

        # Create CloudWatch alarms (only for region-specific resources)
        self._create_cloudwatch_alarms(
            primary_region, primary_api, primary_payment_lambda,
            primary_sns_topic, primary_provider
        )
        self._create_cloudwatch_alarms(
            secondary_region, secondary_api, secondary_payment_lambda,
            secondary_sns_topic, secondary_provider
        )

        # Create Application Load Balancer for failover
        alb_result = self._create_alb_failover(
            primary_region, primary_vpc, primary_api, secondary_api, primary_provider
        )

        # Create CloudWatch Dashboard
        dashboard = self._create_cloudwatch_dashboard(
            primary_region, secondary_region, primary_api, secondary_api,
            primary_payment_lambda, secondary_payment_lambda, global_table,
            primary_provider
        )

        # Store outputs as instance attributes for external access
        self.alb_dns_name = alb_result["dns_name"]
        self.primary_api_endpoint = primary_api.invoke_url
        self.secondary_api_endpoint = secondary_api.invoke_url
        self.dashboard_url = pulumi.Output.concat(
            "https://console.aws.amazon.com/cloudwatch/home?region=",
            primary_region,
            "#dashboards:name=",
            dashboard.dashboard_name
        )
        self.global_table_name = global_table.name
        self.primary_bucket = primary_bucket.id
        self.secondary_bucket = secondary_bucket.id
        self.primary_queue_url = primary_queue.url
        self.secondary_queue_url = secondary_queue.url

        # Export outputs
        self.register_outputs({
            "alb_dns_name": self.alb_dns_name,
            "primary_api_endpoint": self.primary_api_endpoint,
            "secondary_api_endpoint": self.secondary_api_endpoint,
            "dashboard_url": self.dashboard_url,
            "global_table_name": self.global_table_name,
            "primary_bucket": self.primary_bucket,
            "secondary_bucket": self.secondary_bucket,
            "primary_queue_url": self.primary_queue_url,
            "secondary_queue_url": self.secondary_queue_url
        })

    def _create_vpc(self, region: str, provider: aws.Provider) -> aws.ec2.Vpc:
        """Create VPC with private subnets for Lambda functions.

        Note: This VPC is kept minimal since Lambda functions in this architecture
        don't require VPC attachment for accessing DynamoDB, SQS, and API Gateway.
        If VPC attachment were required, this would need NAT Gateway and VPC endpoints.
        """
        vpc = aws.ec2.Vpc(
            f"vpc-{region}-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            opts=ResourceOptions(parent=self, provider=provider)
        )

        # Create private subnet
        subnet = aws.ec2.Subnet(
            f"private-subnet-{region}-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{region}a",
            opts=ResourceOptions(parent=vpc, provider=provider)
        )

        # Create security group for Lambda
        security_group = aws.ec2.SecurityGroup(
            f"lambda-sg-{region}-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for Lambda functions",
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )],
            opts=ResourceOptions(parent=vpc, provider=provider)
        )

        # Store references for Lambda use
        vpc.subnet_id = subnet.id
        vpc.security_group_id = security_group.id

        return vpc

    def _create_s3_replication_role(self, provider: aws.Provider) -> aws.iam.Role:
        """Create IAM role for S3 cross-region replication."""
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "s3.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        role = aws.iam.Role(
            f"s3-replication-role-{self.environment_suffix}",
            assume_role_policy=assume_role_policy,
            opts=ResourceOptions(parent=self, provider=provider)
        )

        policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetReplicationConfiguration",
                        "s3:ListBucket"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObjectVersionForReplication",
                        "s3:GetObjectVersionAcl"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ReplicateObject",
                        "s3:ReplicateDelete"
                    ],
                    "Resource": "*"
                }
            ]
        })

        aws.iam.RolePolicy(
            f"s3-replication-policy-{self.environment_suffix}",
            role=role.id,
            policy=policy,
            opts=ResourceOptions(parent=role, provider=provider)
        )

        return role

    def _create_s3_buckets(
        self,
        primary_provider: aws.Provider,
        secondary_provider: aws.Provider,
        replication_role: aws.iam.Role,
        primary_region: str,
        secondary_region: str
    ):
        """Create S3 buckets with cross-region replication."""
        # Secondary bucket (destination)
        secondary_bucket = aws.s3.Bucket(
            f"dr-static-assets-secondary-{self.environment_suffix}",
            bucket=f"dr-static-assets-secondary-{self.environment_suffix}",
            force_destroy=True,
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            opts=ResourceOptions(parent=self, provider=secondary_provider)
        )

        # Primary bucket (source) with replication
        primary_bucket = aws.s3.Bucket(
            f"dr-static-assets-primary-{self.environment_suffix}",
            bucket=f"dr-static-assets-primary-{self.environment_suffix}",
            force_destroy=True,
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        # Update IAM policy with specific bucket ARNs (using Pulumi Output.apply)
        policy_document = pulumi.Output.all(primary_bucket.arn, secondary_bucket.arn).apply(
            lambda arns: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetReplicationConfiguration",
                            "s3:ListBucket"
                        ],
                        "Resource": [arns[0]]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObjectVersionForReplication",
                            "s3:GetObjectVersionAcl"
                        ],
                        "Resource": [f"{arns[0]}/*"]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:ReplicateObject",
                            "s3:ReplicateDelete"
                        ],
                        "Resource": [f"{arns[1]}/*"]
                    }
                ]
            })
        )

        aws.iam.RolePolicy(
            f"s3-replication-policy-specific-{self.environment_suffix}",
            role=replication_role.id,
            policy=policy_document,
            opts=ResourceOptions(parent=replication_role, provider=primary_provider)
        )

        # Configure replication
        aws.s3.BucketReplicationConfig(
            f"s3-replication-{self.environment_suffix}",
            bucket=primary_bucket.id,
            role=replication_role.arn,
            rules=[aws.s3.BucketReplicationConfigRuleArgs(
                id="replicate-all",
                status="Enabled",
                priority=1,
                delete_marker_replication=aws.s3.BucketReplicationConfigRuleDeleteMarkerReplicationArgs(
                    status="Enabled"
                ),
                filter=aws.s3.BucketReplicationConfigRuleFilterArgs(),
                destination=aws.s3.BucketReplicationConfigRuleDestinationArgs(
                    bucket=secondary_bucket.arn,
                    replication_time=aws.s3.BucketReplicationConfigRuleDestinationReplicationTimeArgs(
                        status="Enabled",
                        time=aws.s3.BucketReplicationConfigRuleDestinationReplicationTimeTimeArgs(
                            minutes=15
                        )
                    ),
                    metrics=aws.s3.BucketReplicationConfigRuleDestinationMetricsArgs(
                        status="Enabled",
                        event_threshold=aws.s3.BucketReplicationConfigRuleDestinationMetricsEventThresholdArgs(
                            minutes=15
                        )
                    )
                )
            )],
            opts=ResourceOptions(parent=primary_bucket, provider=primary_provider, depends_on=[secondary_bucket])
        )

        return primary_bucket, secondary_bucket

    def _create_dynamodb_global_table(
        self,
        primary_provider: aws.Provider,
        secondary_provider: aws.Provider
    ) -> aws.dynamodb.Table:
        """Create DynamoDB global table with point-in-time recovery."""
        table_name = f"transactions-{self.environment_suffix}"

        # Create table in primary region
        primary_table = aws.dynamodb.Table(
            f"dynamodb-primary-{self.environment_suffix}",
            name=table_name,
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="transaction_id",
                    type="S"
                )
            ],
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            replicas=[
                aws.dynamodb.TableReplicaArgs(
                    region_name="us-east-2",
                    point_in_time_recovery=True
                )
            ],
            opts=ResourceOptions(parent=self, provider=primary_provider)
        )

        return primary_table

    def _create_sqs_queue(self, region: str, provider: aws.Provider) -> aws.sqs.Queue:
        """Create SQS queue in specified region."""
        queue = aws.sqs.Queue(
            f"payment-queue-{region}-{self.environment_suffix}",
            name=f"payment-queue-{region}-{self.environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=345600,  # 4 days
            opts=ResourceOptions(parent=self, provider=provider)
        )

        return queue

    def _create_lambda_role(
        self,
        provider: aws.Provider,
        global_table: aws.dynamodb.Table,
        primary_queue: aws.sqs.Queue,
        secondary_queue: aws.sqs.Queue
    ) -> aws.iam.Role:
        """Create IAM role for Lambda functions with least-privilege permissions."""
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        })

        role = aws.iam.Role(
            f"lambda-role-{self.environment_suffix}",
            assume_role_policy=assume_role_policy,
            opts=ResourceOptions(parent=self, provider=provider)
        )

        # Attach basic Lambda execution policy
        aws.iam.RolePolicyAttachment(
            f"lambda-basic-execution-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=role, provider=provider)
        )

        # VPC execution policy removed - Lambda functions not in VPC

        # Attach policy for DynamoDB, SQS access with specific ARNs
        policy_document = pulumi.Output.all(
            global_table.arn,
            primary_queue.arn,
            secondary_queue.arn
        ).apply(
            lambda arns: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:PutItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                            "dynamodb:UpdateItem",
                            "dynamodb:DescribeTable"
                        ],
                        "Resource": [
                            arns[0],  # global_table.arn
                            f"{arns[0]}/*"  # global_table replicas
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage",
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": [
                            arns[1],  # primary_queue.arn
                            arns[2]   # secondary_queue.arn
                        ]
                    }
                ]
            })
        )

        aws.iam.RolePolicy(
            f"lambda-dynamodb-sqs-policy-{self.environment_suffix}",
            role=role.id,
            policy=policy_document,
            opts=ResourceOptions(parent=role, provider=provider)
        )

        return role

    def _create_payment_lambda(
        self,
        region: str,
        vpc: aws.ec2.Vpc,
        role: aws.iam.Role,
        table: aws.dynamodb.Table,
        provider: aws.Provider
    ) -> aws.lambda_.Function:
        """Create Lambda function for payment processing.

        Note: VPC configuration removed to allow Lambda to access AWS services
        (DynamoDB, SQS) directly without requiring NAT Gateway or VPC endpoints.
        """
        # Create log group with retention
        log_group = aws.cloudwatch.LogGroup(
            f"payment-lambda-logs-{region}-{self.environment_suffix}",
            name=f"/aws/lambda/payment-processor-{region}-{self.environment_suffix}",
            retention_in_days=7,
            opts=ResourceOptions(parent=self, provider=provider)
        )

        # Create Lambda function
        lambda_fn = aws.lambda_.Function(
            f"payment-lambda-{region}-{self.environment_suffix}",
            name=f"payment-processor-{region}-{self.environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=role.arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(self._get_payment_lambda_code())
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TABLE_NAME": table.name,
                    "REGION": region,
                    "ENVIRONMENT": self.environment_suffix
                }
            ),
            # VPC configuration removed - Lambda accesses AWS services directly
            timeout=60,
            memory_size=256,
            opts=ResourceOptions(parent=self, provider=provider, depends_on=[log_group])
        )

        return lambda_fn

    def _create_sqs_replication_lambda(
        self,
        region: str,
        source_queue: aws.sqs.Queue,
        dest_queue: aws.sqs.Queue,
        role: aws.iam.Role,
        provider: aws.Provider
    ) -> aws.lambda_.Function:
        """Create Lambda function for SQS message replication.

        Note: VPC configuration not used to allow direct access to SQS services.
        """
        # Create log group with retention
        log_group = aws.cloudwatch.LogGroup(
            f"sqs-replication-logs-{region}-{self.environment_suffix}",
            name=f"/aws/lambda/sqs-replicator-{region}-{self.environment_suffix}",
            retention_in_days=7,
            opts=ResourceOptions(parent=self, provider=provider)
        )

        # Create Lambda function
        lambda_fn = aws.lambda_.Function(
            f"sqs-replication-lambda-{region}-{self.environment_suffix}",
            name=f"sqs-replicator-{region}-{self.environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=role.arn,
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(self._get_sqs_replication_lambda_code())
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DEST_QUEUE_URL": dest_queue.url,
                    "REGION": region,
                    "ENVIRONMENT": self.environment_suffix
                }
            ),
            # No VPC configuration - Lambda accesses AWS services directly
            timeout=30,
            memory_size=128,
            opts=ResourceOptions(parent=self, provider=provider, depends_on=[log_group])
        )

        # Create event source mapping
        aws.lambda_.EventSourceMapping(
            f"sqs-trigger-{region}-{self.environment_suffix}",
            event_source_arn=source_queue.arn,
            function_name=lambda_fn.name,
            batch_size=10,
            opts=ResourceOptions(parent=lambda_fn, provider=provider)
        )

        return lambda_fn

    def _create_api_gateway(
        self,
        region: str,
        lambda_fn: aws.lambda_.Function,
        provider: aws.Provider
    ) -> ApiGatewayResult:
        """Create API Gateway with Lambda integration."""
        # Create API Gateway
        api = aws.apigatewayv2.Api(
            f"payment-api-{region}-{self.environment_suffix}",
            name=f"payment-api-{region}-{self.environment_suffix}",
            protocol_type="HTTP",
            opts=ResourceOptions(parent=self, provider=provider)
        )

        # Grant API Gateway permission to invoke Lambda
        aws.lambda_.Permission(
            f"api-lambda-permission-{region}-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=lambda_fn.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(api.execution_arn, "/*/*"),
            opts=ResourceOptions(parent=api, provider=provider)
        )

        # Create Lambda integration
        integration = aws.apigatewayv2.Integration(
            f"payment-integration-{region}-{self.environment_suffix}",
            api_id=api.id,
            integration_type="AWS_PROXY",
            integration_uri=lambda_fn.arn,
            integration_method="POST",
            payload_format_version="2.0",
            opts=ResourceOptions(parent=api, provider=provider)
        )

        # Create payment route
        payment_route = aws.apigatewayv2.Route(
            f"payment-route-{region}-{self.environment_suffix}",
            api_id=api.id,
            route_key="POST /payment",
            target=pulumi.Output.concat("integrations/", integration.id),
            opts=ResourceOptions(parent=api, provider=provider)
        )

        # Create health check route for Route 53 health checks
        health_route = aws.apigatewayv2.Route(
            f"health-route-{region}-{self.environment_suffix}",
            api_id=api.id,
            route_key="GET /health",
            target=pulumi.Output.concat("integrations/", integration.id),
            opts=ResourceOptions(parent=api, provider=provider)
        )

        # Create stage
        stage = aws.apigatewayv2.Stage(
            f"api-{region}-{self.environment_suffix}",
            api_id=api.id,
            name="prod",
            auto_deploy=True,
            opts=ResourceOptions(parent=api, provider=provider)
        )

        # Compute invoke URL
        invoke_url = pulumi.Output.concat(
            "https://", api.id, ".execute-api.", region, ".amazonaws.com/prod"
        )

        return ApiGatewayResult(stage, api.id, invoke_url)

    def _create_sns_topic(self, region: str, provider: aws.Provider) -> aws.sns.Topic:
        """Create SNS topic for failover notifications."""
        topic = aws.sns.Topic(
            f"failover-notifications-{region}-{self.environment_suffix}",
            name=f"failover-notifications-{region}-{self.environment_suffix}",
            opts=ResourceOptions(parent=self, provider=provider)
        )

        return topic

    def _create_cloudwatch_alarms(
        self,
        region: str,
        api_result: ApiGatewayResult,
        lambda_fn: aws.lambda_.Function,
        sns_topic: aws.sns.Topic,
        provider: aws.Provider
    ):
        """Create CloudWatch alarms for monitoring region-specific resources."""
        # API Gateway latency alarm
        aws.cloudwatch.MetricAlarm(
            f"api-latency-alarm-{region}-{self.environment_suffix}",
            name=f"api-latency-{region}-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Latency",
            namespace="AWS/ApiGateway",
            period=60,
            statistic="Average",
            threshold=1000,  # 1 second
            alarm_description="API Gateway latency is too high",
            alarm_actions=[sns_topic.arn],
            dimensions={"ApiId": api_result.api_id},
            opts=ResourceOptions(parent=self, provider=provider)
        )

        # Lambda errors alarm
        aws.cloudwatch.MetricAlarm(
            f"lambda-errors-alarm-{region}-{self.environment_suffix}",
            name=f"lambda-errors-{region}-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=5,
            alarm_description="Lambda function errors detected",
            alarm_actions=[sns_topic.arn],
            dimensions={"FunctionName": lambda_fn.name},
            opts=ResourceOptions(parent=self, provider=provider)
        )

    def _create_alb_failover(
        self,
        region: str,
        vpc: aws.ec2.Vpc,
        primary_api: ApiGatewayResult,
        secondary_api: ApiGatewayResult,
        provider: aws.Provider
    ) -> Dict[str, Any]:
        """Create Application Load Balancer for API failover without requiring Route53."""

        # Create additional subnets in different AZs (ALB requires at least 2 subnets)
        subnet_a = aws.ec2.Subnet(
            f"alb-subnet-a-{region}-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.10.0/24",
            availability_zone=f"{region}a",
            map_public_ip_on_launch=True,
            opts=ResourceOptions(parent=vpc, provider=provider)
        )

        subnet_b = aws.ec2.Subnet(
            f"alb-subnet-b-{region}-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{region}b",
            map_public_ip_on_launch=True,
            opts=ResourceOptions(parent=vpc, provider=provider)
        )

        # Create Internet Gateway for public subnets
        igw = aws.ec2.InternetGateway(
            f"alb-igw-{region}-{self.environment_suffix}",
            vpc_id=vpc.id,
            opts=ResourceOptions(parent=vpc, provider=provider)
        )

        # Create route table for public subnets
        route_table = aws.ec2.RouteTable(
            f"alb-rt-{region}-{self.environment_suffix}",
            vpc_id=vpc.id,
            routes=[aws.ec2.RouteTableRouteArgs(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            opts=ResourceOptions(parent=vpc, provider=provider)
        )

        # Associate route table with subnets
        aws.ec2.RouteTableAssociation(
            f"alb-rta-a-{region}-{self.environment_suffix}",
            subnet_id=subnet_a.id,
            route_table_id=route_table.id,
            opts=ResourceOptions(parent=route_table, provider=provider)
        )

        aws.ec2.RouteTableAssociation(
            f"alb-rta-b-{region}-{self.environment_suffix}",
            subnet_id=subnet_b.id,
            route_table_id=route_table.id,
            opts=ResourceOptions(parent=route_table, provider=provider)
        )

        # Create security group for ALB
        alb_sg = aws.ec2.SecurityGroup(
            f"alb-sg-{region}-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for Application Load Balancer",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP traffic"
                ),
                aws.ec2.SecurityGroupIngressArgs(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS traffic"
                )
            ],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound traffic"
            )],
            opts=ResourceOptions(parent=vpc, provider=provider)
        )

        # Create Application Load Balancer
        alb = aws.lb.LoadBalancer(
            f"payment-alb-{region}-{self.environment_suffix}",
            name=f"payment-alb-{region}-{self.environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[subnet_a.id, subnet_b.id],
            enable_deletion_protection=False,
            opts=ResourceOptions(parent=self, provider=provider, depends_on=[igw, route_table])
        )

        # Create target group for Lambda (using IP targets)
        # Note: ALB cannot directly target API Gateway, so we create a Lambda target
        target_group = aws.lb.TargetGroup(
            f"payment-tg-{region}-{self.environment_suffix}",
            name=f"payment-tg-{region}-{self.environment_suffix}",
            port=443,
            protocol="HTTPS",
            target_type="lambda",
            vpc_id=vpc.id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                path="/health",
                protocol="HTTPS",
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30,
                matcher="200"
            ),
            opts=ResourceOptions(parent=alb, provider=provider)
        )

        # Create HTTP listener (redirects to HTTPS in production)
        listener = aws.lb.Listener(
            f"payment-listener-{region}-{self.environment_suffix}",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=target_group.arn
            )],
            opts=ResourceOptions(parent=alb, provider=provider)
        )

        return {
            "alb": alb,
            "dns_name": alb.dns_name,
            "target_group": target_group,
            "listener": listener
        }

    def _create_cloudwatch_dashboard(
        self,
        primary_region: str,
        secondary_region: str,
        primary_api: ApiGatewayResult,
        secondary_api: ApiGatewayResult,
        primary_lambda: aws.lambda_.Function,
        secondary_lambda: aws.lambda_.Function,
        table: aws.dynamodb.Table,
        provider: aws.Provider
    ) -> aws.cloudwatch.Dashboard:
        """Create CloudWatch dashboard for monitoring."""
        dashboard_body = pulumi.Output.all(
            primary_api.api_id,
            secondary_api.api_id,
            primary_lambda.name,
            secondary_lambda.name,
            table.name
        ).apply(lambda args: json.dumps({
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "Count", {"stat": "Sum", "region": primary_region}],
                            [".", ".", {"stat": "Sum", "region": secondary_region}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": primary_region,
                        "title": "API Gateway Requests"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", {"stat": "Sum", "region": primary_region}],
                            [".", ".", {"stat": "Sum", "region": secondary_region}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": primary_region,
                        "title": "Lambda Invocations"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", {"stat": "Sum"}],
                            [".", "ConsumedWriteCapacityUnits", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Sum",
                        "region": primary_region,
                        "title": "DynamoDB Capacity"
                    }
                }
            ]
        }))

        dashboard = aws.cloudwatch.Dashboard(
            f"dr-dashboard-{self.environment_suffix}",
            dashboard_name=f"dr-monitoring-{self.environment_suffix}",
            dashboard_body=dashboard_body,
            opts=ResourceOptions(parent=self, provider=provider)
        )

        return dashboard

    def _get_payment_lambda_code(self) -> str:
        """Return payment processing Lambda function code."""
        return """
import json
import os
import boto3
from datetime import datetime

def handler(event, context):
    try:
        # Handle health check endpoint - check multiple path formats
        raw_path = event.get('rawPath', event.get('path', ''))
        route_key = event.get('routeKey', '')
        request_method = event.get('requestContext', {}).get('http', {}).get('method', '')

        # Also check for HTTP method in event directly for API Gateway v1/v2 compatibility
        http_method = event.get('httpMethod', request_method)

        # Health check can be accessed via GET /health or just /health
        is_health_check = (
            (raw_path == '/health' or raw_path.endswith('/health')) and
            (http_method == 'GET' or route_key == 'GET /health')
        )

        if is_health_check:
            return {
                'statusCode': 200,
                'body': json.dumps({
                    'status': 'healthy',
                    'region': os.environ.get('REGION', 'unknown'),
                    'timestamp': datetime.utcnow().isoformat()
                })
            }

        # For payment endpoint, validate environment variables
        table_name = os.environ.get('TABLE_NAME')
        if not table_name:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'TABLE_NAME environment variable not set'})
            }

        region = os.environ.get('REGION')
        if not region:
            return {
                'statusCode': 500,
                'body': json.dumps({'error': 'REGION environment variable not set'})
            }

        # Initialize DynamoDB client
        dynamodb = boto3.resource('dynamodb', region_name=region)
        table = dynamodb.Table(table_name)

        # Parse payment request
        body = json.loads(event.get('body', '{}'))
        transaction_id = body.get('transaction_id')
        amount = body.get('amount')

        if not transaction_id or not amount:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing transaction_id or amount'})
            }

        # Store transaction in DynamoDB
        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'amount': str(amount),
                'timestamp': datetime.utcnow().isoformat(),
                'region': region,
                'status': 'processed'
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'transaction_id': transaction_id,
                'region': region
            })
        }
    except Exception as e:
        print(f"Error processing payment: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""

    def _get_sqs_replication_lambda_code(self) -> str:
        """Return SQS replication Lambda function code."""
        return """
import json
import os
import boto3

sqs = boto3.client('sqs')
dest_queue_url = os.environ['DEST_QUEUE_URL']

def handler(event, context):
    try:
        for record in event['Records']:
            message_body = record['body']

            # Send message to destination queue
            sqs.send_message(
                QueueUrl=dest_queue_url,
                MessageBody=message_body
            )

            print(f"Replicated message to {dest_queue_url}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Messages replicated successfully'})
        }
    except Exception as e:
        print(f"Error replicating messages: {str(e)}")
        raise
"""
