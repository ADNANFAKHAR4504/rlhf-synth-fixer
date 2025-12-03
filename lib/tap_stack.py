"""Multi-Region Disaster Recovery Payment Processing Stack."""

from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable, DynamodbTableAttribute, DynamodbTableReplica
from cdktf_cdktf_provider_aws.api_gateway_rest_api import ApiGatewayRestApi
from cdktf_cdktf_provider_aws.api_gateway_resource import ApiGatewayResource
from cdktf_cdktf_provider_aws.api_gateway_method import ApiGatewayMethod
from cdktf_cdktf_provider_aws.api_gateway_integration import ApiGatewayIntegration
from cdktf_cdktf_provider_aws.api_gateway_deployment import ApiGatewayDeployment
from cdktf_cdktf_provider_aws.api_gateway_stage import ApiGatewayStage
from cdktf_cdktf_provider_aws.api_gateway_domain_name import ApiGatewayDomainName
from cdktf_cdktf_provider_aws.api_gateway_base_path_mapping import ApiGatewayBasePathMapping
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction, LambdaFunctionEnvironment
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record
from cdktf_cdktf_provider_aws.route53_health_check import Route53HealthCheck
from cdktf_cdktf_provider_aws.acm_certificate import AcmCertificate
from cdktf_cdktf_provider_aws.acm_certificate_validation import AcmCertificateValidation
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupEgress
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
import json
import hashlib
import os


class TapStack(TerraformStack):
    """Multi-Region Disaster Recovery Payment Processing Stack."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the multi-region disaster recovery stack."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Define both regions
        primary_region = 'us-east-1'
        secondary_region = 'us-east-2'

        # Configure primary AWS Provider
        primary_provider = AwsProvider(
            self,
            "aws-primary",
            region=primary_region,
            default_tags=[default_tags],
            alias="primary"
        )

        # Configure secondary AWS Provider
        secondary_provider = AwsProvider(
            self,
            "aws-secondary",
            region=secondary_region,
            default_tags=[default_tags],
            alias="secondary"
        )

        # Configure S3 Backend with native state locking
        # NOTE: S3 backend commented out for worktree deployment - using local backend
        # S3Backend(
        #     self,
        #     bucket=state_bucket,
        #     key=f"{environment_suffix}/{construct_id}.tfstate",
        #     region=state_bucket_region,
        #     encrypt=True,
        # )

        # Add S3 state locking using escape hatch
        # self.add_override("terraform.backend.s3.use_lockfile", True)

        # Create DynamoDB Global Table for transactions
        transactions_table = self._create_global_dynamodb_table(
            environment_suffix,
            primary_provider,
            secondary_provider
        )

        # Create VPC and networking in both regions
        primary_vpc_resources = self._create_vpc_resources(
            environment_suffix,
            primary_region,
            primary_provider
        )

        secondary_vpc_resources = self._create_vpc_resources(
            environment_suffix,
            secondary_region,
            secondary_provider
        )

        # Create IAM roles for Lambda functions
        lambda_role = self._create_lambda_execution_role(
            environment_suffix,
            transactions_table.name,
            primary_provider
        )

        # Create SQS queues in both regions
        primary_sqs_resources = self._create_sqs_queues(
            environment_suffix,
            primary_region,
            primary_provider
        )

        secondary_sqs_resources = self._create_sqs_queues(
            environment_suffix,
            secondary_region,
            secondary_provider
        )

        # Create SNS topics in both regions
        primary_sns_topic = self._create_sns_topic(
            environment_suffix,
            primary_region,
            primary_provider
        )

        secondary_sns_topic = self._create_sns_topic(
            environment_suffix,
            secondary_region,
            secondary_provider
        )

        # Create Lambda functions in primary region
        primary_lambdas = self._create_lambda_functions(
            environment_suffix,
            primary_region,
            lambda_role,
            transactions_table,
            primary_sqs_resources,
            primary_sns_topic,
            primary_vpc_resources,
            primary_provider
        )

        # Create Lambda functions in secondary region
        secondary_lambdas = self._create_lambda_functions(
            environment_suffix,
            secondary_region,
            lambda_role,
            transactions_table,
            secondary_sqs_resources,
            secondary_sns_topic,
            secondary_vpc_resources,
            secondary_provider
        )

        # Create API Gateway in both regions
        primary_api = self._create_api_gateway(
            environment_suffix,
            primary_region,
            primary_lambdas,
            primary_provider
        )

        secondary_api = self._create_api_gateway(
            environment_suffix,
            secondary_region,
            secondary_lambdas,
            secondary_provider
        )

        # Create Route 53 hosted zone and health checks
        hosted_zone = self._create_route53_resources(
            environment_suffix,
            primary_api,
            secondary_api,
            primary_provider
        )

        # Create CloudWatch alarms in both regions
        self._create_cloudwatch_alarms(
            environment_suffix,
            primary_region,
            primary_api,
            primary_lambdas,
            transactions_table,
            primary_sns_topic,
            primary_provider
        )

        self._create_cloudwatch_alarms(
            environment_suffix,
            secondary_region,
            secondary_api,
            secondary_lambdas,
            transactions_table,
            secondary_sns_topic,
            secondary_provider
        )

        # Create CloudWatch dashboards
        self._create_cloudwatch_dashboard(
            environment_suffix,
            primary_region,
            primary_api,
            primary_lambdas,
            transactions_table,
            primary_provider
        )

        self._create_cloudwatch_dashboard(
            environment_suffix,
            secondary_region,
            secondary_api,
            secondary_lambdas,
            transactions_table,
            secondary_provider
        )

        # Create failover orchestration Lambda
        self._create_failover_lambda(
            environment_suffix,
            lambda_role,
            hosted_zone,
            primary_sns_topic,
            primary_region,
            secondary_region,
            primary_provider
        )

        # Outputs
        TerraformOutput(
            self,
            "primary_api_endpoint",
            value=primary_api['deployment'].invoke_url,
            description="Primary region API Gateway endpoint"
        )

        TerraformOutput(
            self,
            "secondary_api_endpoint",
            value=secondary_api['deployment'].invoke_url,
            description="Secondary region API Gateway endpoint"
        )

        TerraformOutput(
            self,
            "transactions_table_name",
            value=transactions_table.name,
            description="DynamoDB global table name"
        )

        TerraformOutput(
            self,
            "hosted_zone_id",
            value=hosted_zone.zone_id,
            description="Route 53 hosted zone ID"
        )

    def _create_global_dynamodb_table(self, environment_suffix, primary_provider, secondary_provider):
        """Create DynamoDB global table with replication."""
        table_name = f"v2-payment-transactions-{environment_suffix}"

        # Create DynamoDB table with global table configuration
        table = DynamodbTable(
            self,
            "transactions-table",
            name=table_name,
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            stream_enabled=True,
            stream_view_type="NEW_AND_OLD_IMAGES",
            point_in_time_recovery={
                "enabled": True
            },
            attribute=[
                DynamodbTableAttribute(
                    name="transaction_id",
                    type="S"
                )
            ],
            replica=[
                DynamodbTableReplica(
                    region_name="us-east-2",
                    point_in_time_recovery=True
                )
            ],
            tags={
                "Name": table_name,
                "Environment": environment_suffix,
                "Region": "global"
            },
            provider=primary_provider
        )

        return table

    def _create_vpc_resources(self, environment_suffix, region, provider):
        """Create VPC and networking resources."""
        # Get availability zones
        azs = DataAwsAvailabilityZones(
            self,
            f"azs-{region}",
            state="available",
            provider=provider
        )

        # Create VPC
        vpc = Vpc(
            self,
            f"vpc-{region}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region
            },
            provider=provider
        )

        # Create private subnets
        private_subnets = []
        for i in range(2):
            subnet = Subnet(
                self,
                f"private-subnet-{region}-{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=Fn.element(azs.names, i),
                tags={
                    "Name": f"payment-private-subnet-{environment_suffix}-{region}-{i+1}",
                    "Environment": environment_suffix,
                    "Region": region
                },
                provider=provider
            )
            private_subnets.append(subnet)

        # Create security group for Lambda
        lambda_sg = SecurityGroup(
            self,
            f"lambda-sg-{region}",
            name=f"v2-payment-lambda-sg-{environment_suffix}-{region}",
            description="Security group for Lambda functions",
            vpc_id=vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={
                "Name": f"payment-lambda-sg-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region
            },
            provider=provider
        )

        return {
            "vpc": vpc,
            "private_subnets": private_subnets,
            "lambda_security_group": lambda_sg
        }

    def _create_lambda_execution_role(self, environment_suffix, table_name, provider):
        """Create IAM role for Lambda execution with least privilege."""
        # Create assume role policy
        assume_role_policy = DataAwsIamPolicyDocument(
            self,
            "lambda-assume-role-policy",
            statement=[
                {
                    "effect": "Allow",
                    "principals": [
                        {
                            "type": "Service",
                            "identifiers": ["lambda.amazonaws.com"]
                        }
                    ],
                    "actions": ["sts:AssumeRole"]
                }
            ],
            provider=provider
        )

        # Create IAM role
        role = IamRole(
            self,
            "lambda-execution-role",
            name=f"v2-payment-lambda-role-{environment_suffix}",
            assume_role_policy=assume_role_policy.json,
            tags={
                "Name": f"payment-lambda-role-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=provider
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            "lambda-basic-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            provider=provider
        )

        # Attach VPC execution policy
        IamRolePolicyAttachment(
            self,
            "lambda-vpc-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            provider=provider
        )

        # Create inline policy for DynamoDB, SQS, SNS access
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": [
                        f"arn:aws:dynamodb:*:*:table/v2-payment-transactions-{environment_suffix}"
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
                        f"arn:aws:sqs:*:*:v2-payment-processing-queue-{environment_suffix}-*",
                        f"arn:aws:sqs:*:*:v2-payment-dlq-{environment_suffix}-*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "sns:Publish"
                    ],
                    "Resource": [
                        f"arn:aws:sns:*:*:v2-payment-alerts-{environment_suffix}-*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "cloudwatch:PutMetricData"
                    ],
                    "Resource": "*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "route53:GetHealthCheck",
                        "route53:GetHealthCheckStatus",
                        "route53:ChangeResourceRecordSets"
                    ],
                    "Resource": "*"
                }
            ]
        }

        IamRolePolicy(
            self,
            "lambda-inline-policy",
            role=role.id,
            policy=json.dumps(policy_document),
            provider=provider
        )

        return role

    def _create_sqs_queues(self, environment_suffix, region, provider):
        """Create SQS queues with dead letter queues."""
        # Create dead letter queue
        dlq = SqsQueue(
            self,
            f"payment-dlq-{region}",
            name=f"v2-payment-dlq-{environment_suffix}-{region}",
            message_retention_seconds=1209600,  # 14 days
            tags={
                "Name": f"payment-dlq-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region
            },
            provider=provider
        )

        # Create processing queue with DLQ
        processing_queue = SqsQueue(
            self,
            f"processing-queue-{region}",
            name=f"v2-payment-processing-queue-{environment_suffix}-{region}",
            visibility_timeout_seconds=300,
            message_retention_seconds=345600,  # 4 days
            redrive_policy=json.dumps({
                "deadLetterTargetArn": dlq.arn,
                "maxReceiveCount": 3
            }),
            tags={
                "Name": f"payment-processing-queue-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region
            },
            provider=provider
        )

        return {
            "processing_queue": processing_queue,
            "dlq": dlq
        }

    def _create_sns_topic(self, environment_suffix, region, provider):
        """Create SNS topic for alerts."""
        topic = SnsTopic(
            self,
            f"alerts-topic-{region}",
            name=f"v2-payment-alerts-{environment_suffix}-{region}",
            tags={
                "Name": f"payment-alerts-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region
            },
            provider=provider
        )

        return topic

    def _create_lambda_functions(self, environment_suffix, region, role, table, sqs_resources, sns_topic, vpc_resources, provider):
        """Create Lambda functions for payment processing."""
        # Read Lambda function code
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")

        # Create payment validation Lambda
        with open(os.path.join(lambda_dir, "payment_validation.py"), "r") as f:
            validation_code = f.read()

        validation_lambda = LambdaFunction(
            self,
            f"validation-lambda-{region}",
            function_name=f"v2-payment-validation-{environment_suffix}-{region}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=role.arn,
            timeout=30,
            memory_size=256,
            environment=LambdaFunctionEnvironment(
                variables={
                    "TRANSACTIONS_TABLE_NAME": table.name,
                    "PROCESSING_QUEUE_URL": sqs_resources['processing_queue'].url,
                    "DEPLOYMENT_REGION": region
                }
            ),
            vpc_config={
                "subnet_ids": [subnet.id for subnet in vpc_resources['private_subnets']],
                "security_group_ids": [vpc_resources['lambda_security_group'].id]
            },
            filename="../../../lib/lambda_validation.zip",
            source_code_hash=Fn.filebase64sha256("../../../lib/lambda_validation.zip"),
            tags={
                "Name": f"payment-validation-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region
            },
            provider=provider
        )

        # Create payment processing Lambda
        with open(os.path.join(lambda_dir, "payment_processing.py"), "r") as f:
            processing_code = f.read()

        processing_lambda = LambdaFunction(
            self,
            f"processing-lambda-{region}",
            function_name=f"v2-payment-processing-{environment_suffix}-{region}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=role.arn,
            timeout=60,
            memory_size=512,
            environment=LambdaFunctionEnvironment(
                variables={
                    "TRANSACTIONS_TABLE_NAME": table.name,
                    "ALERTS_TOPIC_ARN": sns_topic.arn,
                    "DEPLOYMENT_REGION": region
                }
            ),
            vpc_config={
                "subnet_ids": [subnet.id for subnet in vpc_resources['private_subnets']],
                "security_group_ids": [vpc_resources['lambda_security_group'].id]
            },
            filename="../../../lib/lambda_processing.zip",
            source_code_hash=Fn.filebase64sha256("../../../lib/lambda_processing.zip"),
            tags={
                "Name": f"payment-processing-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region
            },
            provider=provider
        )

        # Create SQS event source mapping for processing Lambda
        LambdaEventSourceMapping(
            self,
            f"processing-lambda-sqs-trigger-{region}",
            event_source_arn=sqs_resources['processing_queue'].arn,
            function_name=processing_lambda.function_name,
            batch_size=10,
            maximum_batching_window_in_seconds=5,
            provider=provider
        )

        return {
            "validation": validation_lambda,
            "processing": processing_lambda
        }

    def _create_api_gateway(self, environment_suffix, region, lambdas, provider):
        """Create API Gateway with custom domain."""
        # Create REST API
        api = ApiGatewayRestApi(
            self,
            f"payment-api-{region}",
            name=f"v2-payment-api-{environment_suffix}-{region}",
            description=f"Payment Processing API - {region}",
            tags={
                "Name": f"payment-api-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region
            },
            provider=provider
        )

        # Create /validate resource
        validate_resource = ApiGatewayResource(
            self,
            f"validate-resource-{region}",
            rest_api_id=api.id,
            parent_id=api.root_resource_id,
            path_part="validate",
            provider=provider
        )

        # Create POST method for /validate
        validate_method = ApiGatewayMethod(
            self,
            f"validate-method-{region}",
            rest_api_id=api.id,
            resource_id=validate_resource.id,
            http_method="POST",
            authorization="NONE",
            provider=provider
        )

        # Create Lambda integration for /validate
        validate_integration = ApiGatewayIntegration(
            self,
            f"validate-integration-{region}",
            rest_api_id=api.id,
            resource_id=validate_resource.id,
            http_method=validate_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambdas['validation'].invoke_arn,
            provider=provider
        )

        # Grant API Gateway permission to invoke Lambda
        LambdaPermission(
            self,
            f"api-lambda-permission-{region}",
            statement_id="AllowAPIGatewayInvoke",
            action="lambda:InvokeFunction",
            function_name=lambdas['validation'].function_name,
            principal="apigateway.amazonaws.com",
            source_arn=f"{api.execution_arn}/*/*",
            provider=provider
        )

        # Create deployment
        deployment = ApiGatewayDeployment(
            self,
            f"api-deployment-{region}",
            rest_api_id=api.id,
            depends_on=[validate_integration],
            lifecycle={
                "create_before_destroy": True
            },
            provider=provider
        )

        # Create stage
        stage = ApiGatewayStage(
            self,
            f"api-stage-{region}",
            deployment_id=deployment.id,
            rest_api_id=api.id,
            stage_name="prod",
            tags={
                "Name": f"payment-api-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region
            },
            provider=provider
        )

        return {
            "api": api,
            "deployment": stage,
            "validate_resource": validate_resource
        }

    def _create_route53_resources(self, environment_suffix, primary_api, secondary_api, provider):
        """Create Route 53 hosted zone with health checks and failover routing."""
        # Create hosted zone
        hosted_zone = Route53Zone(
            self,
            "payment-hosted-zone",
            name=f"v2-payment-api-{environment_suffix}.testing.internal",
            comment=f"Hosted zone for payment API - {environment_suffix}",
            tags={
                "Name": f"payment-hosted-zone-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=provider
        )

        # Create health check for primary API
        primary_health_check = Route53HealthCheck(
            self,
            "primary-health-check",
            fqdn=f"{primary_api['api'].id}.execute-api.us-east-1.amazonaws.com",
            port=443,
            type="HTTPS",
            resource_path="/prod/validate",
            failure_threshold=3,
            request_interval=30,
            measure_latency=True,
            tags={
                "Name": f"payment-api-primary-health-{environment_suffix}",
                "Environment": environment_suffix,
                "Region": "us-east-1"
            },
            provider=provider
        )

        # Create health check for secondary API
        secondary_health_check = Route53HealthCheck(
            self,
            "secondary-health-check",
            fqdn=f"{secondary_api['api'].id}.execute-api.us-east-2.amazonaws.com",
            port=443,
            type="HTTPS",
            resource_path="/prod/validate",
            failure_threshold=3,
            request_interval=30,
            measure_latency=True,
            tags={
                "Name": f"payment-api-secondary-health-{environment_suffix}",
                "Environment": environment_suffix,
                "Region": "us-east-2"
            },
            provider=provider
        )

        # Create primary failover record
        Route53Record(
            self,
            "primary-failover-record",
            zone_id=hosted_zone.zone_id,
            name=f"api.v2-payment-api-{environment_suffix}.testing.internal",
            type="CNAME",
            ttl=60,
            records=[f"{primary_api['api'].id}.execute-api.us-east-1.amazonaws.com"],
            set_identifier="primary",
            failover_routing_policy={
                "type": "PRIMARY"
            },
            health_check_id=primary_health_check.id,
            provider=provider
        )

        # Create secondary failover record
        Route53Record(
            self,
            "secondary-failover-record",
            zone_id=hosted_zone.zone_id,
            name=f"api.v2-payment-api-{environment_suffix}.testing.internal",
            type="CNAME",
            ttl=60,
            records=[f"{secondary_api['api'].id}.execute-api.us-east-2.amazonaws.com"],
            set_identifier="secondary",
            failover_routing_policy={
                "type": "SECONDARY"
            },
            health_check_id=secondary_health_check.id,
            provider=provider
        )

        return hosted_zone

    def _create_cloudwatch_alarms(self, environment_suffix, region, api, lambdas, table, sns_topic, provider):
        """Create CloudWatch alarms for monitoring."""
        # API Gateway latency alarm
        CloudwatchMetricAlarm(
            self,
            f"api-latency-alarm-{region}",
            alarm_name=f"v2-payment-api-latency-{environment_suffix}-{region}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Latency",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Average",
            threshold=1000,  # 1 second
            alarm_description="API Gateway latency is too high",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "ApiName": api['api'].name
            },
            tags={
                "Name": f"payment-api-latency-alarm-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region
            },
            provider=provider
        )

        # Lambda validation errors alarm
        CloudwatchMetricAlarm(
            self,
            f"validation-lambda-errors-alarm-{region}",
            alarm_name=f"v2-payment-validation-errors-{environment_suffix}-{region}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Validation Lambda errors threshold exceeded",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "FunctionName": lambdas['validation'].function_name
            },
            tags={
                "Name": f"payment-validation-errors-alarm-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region
            },
            provider=provider
        )

        # Lambda processing errors alarm
        CloudwatchMetricAlarm(
            self,
            f"processing-lambda-errors-alarm-{region}",
            alarm_name=f"v2-payment-processing-errors-{environment_suffix}-{region}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="Processing Lambda errors threshold exceeded",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "FunctionName": lambdas['processing'].function_name
            },
            tags={
                "Name": f"payment-processing-errors-alarm-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region
            },
            provider=provider
        )

        # DynamoDB throttle alarm
        CloudwatchMetricAlarm(
            self,
            f"dynamodb-throttle-alarm-{region}",
            alarm_name=f"v2-payment-dynamodb-throttle-{environment_suffix}-{region}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UserErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="DynamoDB throttling events detected",
            alarm_actions=[sns_topic.arn],
            dimensions={
                "TableName": table.name
            },
            tags={
                "Name": f"payment-dynamodb-throttle-alarm-{environment_suffix}-{region}",
                "Environment": environment_suffix,
                "Region": region
            },
            provider=provider
        )

    def _create_cloudwatch_dashboard(self, environment_suffix, region, api, lambdas, table, provider):
        """Create CloudWatch dashboard for monitoring."""
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApiGateway", "Latency", "ApiName", api['api'].name],
                            ["AWS/ApiGateway", "Count", "ApiName", api['api'].name],
                            ["AWS/ApiGateway", "4XXError", "ApiName", api['api'].name],
                            ["AWS/ApiGateway", "5XXError", "ApiName", api['api'].name]
                        ],
                        "view": "timeSeries",
                        "region": region,
                        "title": f"API Gateway Metrics - {region}",
                        "period": 300
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", "FunctionName", lambdas['validation'].function_name],
                            ["AWS/Lambda", "Errors", "FunctionName", lambdas['validation'].function_name],
                            ["AWS/Lambda", "Duration", "FunctionName", lambdas['validation'].function_name],
                            ["AWS/Lambda", "Throttles", "FunctionName", lambdas['validation'].function_name]
                        ],
                        "view": "timeSeries",
                        "region": region,
                        "title": f"Validation Lambda Metrics - {region}",
                        "period": 300
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/Lambda", "Invocations", "FunctionName", lambdas['processing'].function_name],
                            ["AWS/Lambda", "Errors", "FunctionName", lambdas['processing'].function_name],
                            ["AWS/Lambda", "Duration", "FunctionName", lambdas['processing'].function_name],
                            ["AWS/Lambda", "Throttles", "FunctionName", lambdas['processing'].function_name]
                        ],
                        "view": "timeSeries",
                        "region": region,
                        "title": f"Processing Lambda Metrics - {region}",
                        "period": 300
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", "TableName", table.name],
                            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", "TableName", table.name],
                            ["AWS/DynamoDB", "UserErrors", "TableName", table.name],
                            ["AWS/DynamoDB", "SystemErrors", "TableName", table.name]
                        ],
                        "view": "timeSeries",
                        "region": region,
                        "title": f"DynamoDB Metrics - {region}",
                        "period": 300
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            f"payment-dashboard-{region}",
            dashboard_name=f"v2-payment-dashboard-{environment_suffix}-{region}",
            dashboard_body=json.dumps(dashboard_body),
            provider=provider
        )

    def _create_failover_lambda(self, environment_suffix, role, hosted_zone, sns_topic, primary_region, secondary_region, provider):
        """Create failover orchestration Lambda."""
        lambda_dir = os.path.join(os.path.dirname(__file__), "lambda")

        with open(os.path.join(lambda_dir, "failover_orchestration.py"), "r") as f:
            failover_code = f.read()

        failover_lambda = LambdaFunction(
            self,
            "failover-orchestration-lambda",
            function_name=f"v2-payment-failover-orchestration-{environment_suffix}",
            runtime="python3.11",
            handler="index.lambda_handler",
            role=role.arn,
            timeout=60,
            memory_size=256,
            environment=LambdaFunctionEnvironment(
                variables={
                    "HOSTED_ZONE_ID": hosted_zone.zone_id,
                    "PRIMARY_RECORD_NAME": f"api.v2-payment-api-{environment_suffix}.testing.internal",
                    "ALERTS_TOPIC_ARN": sns_topic.arn,
                    "PRIMARY_REGION": primary_region,
                    "SECONDARY_REGION": secondary_region
                }
            ),
            filename="../../../lib/lambda_failover.zip",
            source_code_hash=Fn.filebase64sha256("../../../lib/lambda_failover.zip"),
            tags={
                "Name": f"payment-failover-orchestration-{environment_suffix}",
                "Environment": environment_suffix
            },
            provider=provider
        )

        # Subscribe failover Lambda to SNS topic
        SnsTopicSubscription(
            self,
            "failover-lambda-subscription",
            topic_arn=sns_topic.arn,
            protocol="lambda",
            endpoint=failover_lambda.arn,
            provider=provider
        )

        # Grant SNS permission to invoke Lambda
        LambdaPermission(
            self,
            "sns-lambda-permission",
            statement_id="AllowSNSInvoke",
            action="lambda:InvokeFunction",
            function_name=failover_lambda.function_name,
            principal="sns.amazonaws.com",
            source_arn=sns_topic.arn,
            provider=provider
        )

        return failover_lambda
