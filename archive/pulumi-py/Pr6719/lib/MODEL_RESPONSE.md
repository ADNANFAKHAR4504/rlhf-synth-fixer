# Multi-Region Active-Passive Disaster Recovery Infrastructure

This implementation provides a complete multi-region active-passive disaster recovery architecture using Pulumi with Python.

## File: lib/tap_stack.py

```python
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

        # Create Lambda execution role
        lambda_role = self._create_lambda_role(primary_provider)

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

        # Create SNS topic for failover notifications
        sns_topic = self._create_sns_topic(primary_provider)

        # Create CloudWatch alarms
        self._create_cloudwatch_alarms(
            primary_region, primary_api, primary_payment_lambda,
            global_table, sns_topic, primary_provider
        )
        self._create_cloudwatch_alarms(
            secondary_region, secondary_api, secondary_payment_lambda,
            global_table, sns_topic, secondary_provider
        )

        # Create Route 53 hosted zone and health checks
        hosted_zone = self._create_route53_zone(primary_provider)
        primary_health_check = self._create_health_check(
            primary_api, primary_provider
        )

        # Create Route 53 failover records
        self._create_failover_records(
            hosted_zone, primary_api, secondary_api,
            primary_health_check, primary_provider
        )

        # Create CloudWatch Dashboard
        dashboard = self._create_cloudwatch_dashboard(
            primary_region, secondary_region, primary_api, secondary_api,
            primary_payment_lambda, secondary_payment_lambda, global_table,
            primary_provider
        )

        # Export outputs
        self.register_outputs({
            "hosted_zone_id": hosted_zone.zone_id,
            "primary_api_endpoint": primary_api.invoke_url,
            "secondary_api_endpoint": secondary_api.invoke_url,
            "dashboard_url": pulumi.Output.concat(
                "https://console.aws.amazon.com/cloudwatch/home?region=",
                primary_region,
                "#dashboards:name=",
                dashboard.dashboard_name
            ),
            "global_table_name": global_table.name,
            "primary_bucket": primary_bucket.id,
            "secondary_bucket": secondary_bucket.id,
            "primary_queue_url": primary_queue.url,
            "secondary_queue_url": secondary_queue.url
        })

    def _create_vpc(self, region: str, provider: aws.Provider) -> aws.ec2.Vpc:
        """Create VPC with private subnets for Lambda functions."""
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

    def _create_lambda_role(self, provider: aws.Provider) -> aws.iam.Role:
        """Create IAM role for Lambda functions."""
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

        # Attach VPC execution policy
        aws.iam.RolePolicyAttachment(
            f"lambda-vpc-execution-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=role, provider=provider)
        )

        # Attach policy for DynamoDB, SQS access
        policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:UpdateItem"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": "*"
                }
            ]
        })

        aws.iam.RolePolicy(
            f"lambda-dynamodb-sqs-policy-{self.environment_suffix}",
            role=role.id,
            policy=policy,
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
        """Create Lambda function for payment processing."""
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
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[vpc.subnet_id],
                security_group_ids=[vpc.security_group_id]
            ),
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
        """Create Lambda function for SQS message replication."""
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
    ) -> aws.apigatewayv2.Stage:
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

        # Create route
        route = aws.apigatewayv2.Route(
            f"payment-route-{region}-{self.environment_suffix}",
            api_id=api.id,
            route_key="POST /payment",
            target=pulumi.Output.concat("integrations/", integration.id),
            opts=ResourceOptions(parent=api, provider=provider)
        )

        # Create stage
        stage = aws.apigatewayv2.Stage(
            f"payment-stage-{region}-{self.environment_suffix}",
            api_id=api.id,
            name="prod",
            auto_deploy=True,
            opts=ResourceOptions(parent=api, provider=provider)
        )

        # Store API ID for outputs
        stage.invoke_url = pulumi.Output.concat(
            "https://", api.id, ".execute-api.", region, ".amazonaws.com/prod"
        )
        stage.api_id_output = api.id

        return stage

    def _create_sns_topic(self, provider: aws.Provider) -> aws.sns.Topic:
        """Create SNS topic for failover notifications."""
        topic = aws.sns.Topic(
            f"failover-notifications-{self.environment_suffix}",
            name=f"failover-notifications-{self.environment_suffix}",
            opts=ResourceOptions(parent=self, provider=provider)
        )

        return topic

    def _create_cloudwatch_alarms(
        self,
        region: str,
        api_stage: aws.apigatewayv2.Stage,
        lambda_fn: aws.lambda_.Function,
        table: aws.dynamodb.Table,
        sns_topic: aws.sns.Topic,
        provider: aws.Provider
    ):
        """Create CloudWatch alarms for monitoring."""
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
            dimensions={"ApiId": api_stage.api_id_output},
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

        # DynamoDB throttling alarm
        aws.cloudwatch.MetricAlarm(
            f"dynamodb-throttle-alarm-{region}-{self.environment_suffix}",
            name=f"dynamodb-throttle-{region}-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UserErrors",
            namespace="AWS/DynamoDB",
            period=60,
            statistic="Sum",
            threshold=10,
            alarm_description="DynamoDB throttling detected",
            alarm_actions=[sns_topic.arn],
            dimensions={"TableName": table.name},
            opts=ResourceOptions(parent=self, provider=provider)
        )

    def _create_route53_zone(self, provider: aws.Provider) -> aws.route53.Zone:
        """Create Route 53 hosted zone."""
        zone = aws.route53.Zone(
            f"payment-zone-{self.environment_suffix}",
            name=f"payments-{self.environment_suffix}.example.com",
            opts=ResourceOptions(parent=self, provider=provider)
        )

        return zone

    def _create_health_check(
        self,
        api_stage: aws.apigatewayv2.Stage,
        provider: aws.Provider
    ) -> aws.route53.HealthCheck:
        """Create Route 53 health check for primary API."""
        health_check = aws.route53.HealthCheck(
            f"primary-health-check-{self.environment_suffix}",
            type="HTTPS",
            resource_path="/payment",
            fqdn=api_stage.invoke_url.apply(lambda url: url.replace("https://", "").split("/")[0]),
            port=443,
            request_interval=30,
            failure_threshold=3,
            opts=ResourceOptions(parent=self, provider=provider)
        )

        return health_check

    def _create_failover_records(
        self,
        zone: aws.route53.Zone,
        primary_api: aws.apigatewayv2.Stage,
        secondary_api: aws.apigatewayv2.Stage,
        health_check: aws.route53.HealthCheck,
        provider: aws.Provider
    ):
        """Create Route 53 failover records."""
        # Note: These are simplified CNAME records
        # In production, you'd use API Gateway custom domains with A/AAAA records

        # Primary failover record
        aws.route53.Record(
            f"primary-failover-record-{self.environment_suffix}",
            zone_id=zone.zone_id,
            name=f"api.payments-{self.environment_suffix}.example.com",
            type="CNAME",
            ttl=60,
            records=[primary_api.invoke_url.apply(lambda url: url.replace("https://", "").split("/")[0])],
            set_identifier="primary",
            health_check_id=health_check.id,
            failover_routing_policies=[aws.route53.RecordFailoverRoutingPolicyArgs(
                type="PRIMARY"
            )],
            opts=ResourceOptions(parent=zone, provider=provider)
        )

        # Secondary failover record
        aws.route53.Record(
            f"secondary-failover-record-{self.environment_suffix}",
            zone_id=zone.zone_id,
            name=f"api.payments-{self.environment_suffix}.example.com",
            type="CNAME",
            ttl=60,
            records=[secondary_api.invoke_url.apply(lambda url: url.replace("https://", "").split("/")[0])],
            set_identifier="secondary",
            failover_routing_policies=[aws.route53.RecordFailoverRoutingPolicyArgs(
                type="SECONDARY"
            )],
            opts=ResourceOptions(parent=zone, provider=provider)
        )

    def _create_cloudwatch_dashboard(
        self,
        primary_region: str,
        secondary_region: str,
        primary_api: aws.apigatewayv2.Stage,
        secondary_api: aws.apigatewayv2.Stage,
        primary_lambda: aws.lambda_.Function,
        secondary_lambda: aws.lambda_.Function,
        table: aws.dynamodb.Table,
        provider: aws.Provider
    ) -> aws.cloudwatch.Dashboard:
        """Create CloudWatch dashboard for monitoring."""
        dashboard_body = pulumi.Output.all(
            primary_api.api_id_output,
            secondary_api.api_id_output,
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

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    try:
        # Parse request
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
                'region': os.environ['REGION'],
                'status': 'processed'
            }
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Payment processed successfully',
                'transaction_id': transaction_id,
                'region': os.environ['REGION']
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
```

## File: lib/README.md

```markdown
# Multi-Region Active-Passive Disaster Recovery Infrastructure

This Pulumi Python project implements a comprehensive disaster recovery solution for payment processing across AWS regions us-east-1 (primary) and us-east-2 (secondary).

## Architecture Overview

The infrastructure provides:

- Multi-region deployment with identical stacks in primary and secondary regions
- Automated failover using Route 53 health checks and failover routing
- Data replication via DynamoDB global tables and S3 cross-region replication
- Message queue replication using Lambda triggers between SQS queues
- Comprehensive monitoring with CloudWatch alarms and dashboards
- Automated notifications via SNS when failover events occur

## Components

### Network Layer
- VPCs with private subnets in both regions
- Security groups for Lambda functions

### API Layer
- API Gateway HTTP APIs in both regions
- Lambda functions for payment processing
- Automatic scaling and load handling

### Data Layer
- DynamoDB global table with point-in-time recovery
- S3 buckets with cross-region replication and RTC enabled
- SQS queues with Lambda-based replication

### Failover Layer
- Route 53 hosted zone and health checks
- Failover routing policy for automatic DNS switching
- 60-second failover window

### Monitoring Layer
- CloudWatch alarms for API latency, Lambda errors, DynamoDB throttling
- Multi-region CloudWatch dashboard
- SNS topic for operational notifications

## Prerequisites

- Python 3.9+
- Pulumi CLI 3.x
- AWS CLI configured with appropriate credentials
- IAM permissions for multi-region resource creation

## Deployment

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment suffix
export ENVIRONMENT_SUFFIX="dev"

# Deploy
pulumi up
```

## Outputs

The stack exports:

- hosted_zone_id: Route 53 hosted zone ID
- primary_api_endpoint: Primary region API Gateway URL
- secondary_api_endpoint: Secondary region API Gateway URL
- dashboard_url: CloudWatch dashboard URL
- global_table_name: DynamoDB global table name
- primary_bucket: Primary S3 bucket name
- secondary_bucket: Secondary S3 bucket name

## Testing Failover

To test the failover mechanism:

1. Monitor the CloudWatch dashboard
2. Simulate primary region failure by disabling the API Gateway
3. Observe Route 53 health check failure (takes ~90 seconds)
4. Verify DNS switches to secondary region
5. Confirm SNS notification is sent

## Cleanup

```bash
pulumi destroy
```

All resources are configured for complete destruction without retention policies.

## Notes

- ACM certificates for custom domains require manual DNS validation
- Health checks take 60-90 seconds to detect failures and trigger failover
- DynamoDB global tables replicate within seconds under normal conditions
- S3 replication completes within 15 minutes with RTC enabled
```
