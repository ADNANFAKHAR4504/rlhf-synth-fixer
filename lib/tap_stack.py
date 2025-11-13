"""
tap_stack.py

This module defines the TapStack class for deploying a serverless transaction
processing system with Pulumi Python. The stack includes VPC, Lambda functions,
API Gateway, DynamoDB, SQS, SNS, CloudWatch, and AWS WAF for PCI-compliant
transaction processing.
"""

from typing import Optional
import json

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output

class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Suffix for resource naming (required for uniqueness)
        tags (Optional[dict]): Default tags to apply to resources
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Serverless Transaction Processing System using Pulumi Python

    Creates a complete serverless architecture for processing financial transactions
    with fraud detection, deployed entirely within a VPC with private subnets.

    Features:
    - API Gateway with WAF protection
    - 3 Lambda functions (validation, fraud detection, failed transaction handling)
    - VPC with 3 private subnets across 3 AZs
    - VPC endpoints for AWS services (no internet routing)
    - DynamoDB for merchant configs and transaction storage
    - SQS with DLQ for message queuing
    - SNS for fraud alerts
    - CloudWatch monitoring with alarms and dashboard
    - X-Ray tracing
    - KMS encryption for all data at rest
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {**args.tags, 'PulumiOutputVersion': 'v2'}  # Force stack update to regenerate outputs
        self.region = 'us-east-1'  # Deployment region
        self.stage_name = self.environment_suffix  # API Gateway stage name

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()

        # Create VPC infrastructure
        self.vpc = self._create_vpc()
        self.private_subnets = self._create_private_subnets()
        self.vpc_endpoints = self._create_vpc_endpoints()

        # Create IAM roles
        self.lambda_role = self._create_lambda_role()

        # Create DynamoDB tables
        self.merchant_table = self._create_merchant_table()
        self.transaction_table = self._create_transaction_table()

        # Create SQS queues
        self.dlq = self._create_dead_letter_queue()
        self.transaction_queue = self._create_transaction_queue()

        # Create SNS topic for fraud alerts
        self.fraud_alert_topic = self._create_sns_topic()

        # Create Lambda functions
        self.validation_lambda = self._create_validation_lambda()
        self.fraud_detection_lambda = self._create_fraud_detection_lambda()
        self.failed_transaction_lambda = self._create_failed_transaction_lambda()

        # Create API Gateway
        self.api_gateway = self._create_api_gateway()
        self.api_key = self._create_api_key()

        # Create AWS WAF Web ACL
        self.waf_web_acl = self._create_waf_web_acl()

        # Associate WAF with API Gateway
        self.waf_association = self._associate_waf_with_api()

        # Create CloudWatch alarms
        self.cloudwatch_alarms = self._create_cloudwatch_alarms()

        # Create CloudWatch dashboard
        self.dashboard = self._create_cloudwatch_dashboard()

        # Register outputs
        self.register_outputs({
            'api_endpoint': pulumi.Output.all(
                self.api_gateway.id,
                self.region,
                self.stage_name
            ).apply(
                lambda args: f"https://{args[0]}.execute-api.{args[1]}.amazonaws.com/{args[2]}"
            ),
            'dashboard_url': self.dashboard.dashboard_name.apply(
                lambda name: (
                    f"https://console.aws.amazon.com/cloudwatch/home?"
                    f"region={self.region}#dashboards:name={name}"
                )
            ),
            'merchant_table_name': self.merchant_table.name,
            'transaction_table_name': self.transaction_table.name,
            'queue_url': self.transaction_queue.url,
            'sns_topic_arn': self.fraud_alert_topic.arn,
            'validation_lambda_arn': self.validation_lambda.arn,
            'fraud_detection_lambda_arn': self.fraud_detection_lambda.arn,
            'failed_transaction_lambda_arn': self.failed_transaction_lambda.arn,
        })

    def _create_kms_key(self):
        """Create KMS key for encrypting all data at rest"""
        import json

        # KMS key policy that allows CloudWatch Logs to use the key
        kms_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{aws.get_caller_identity().account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow CloudWatch Logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": f"logs.{self.region}.amazonaws.com"
                    },
                    "Action": [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:CreateGrant",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "ArnLike": {
                            "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.region}:{aws.get_caller_identity().account_id}:log-group:*"
                        }
                    }
                }
            ]
        }

        key = aws.kms.Key(
            f"transaction-kms-key-{self.environment_suffix}",
            description="KMS key for transaction processing system encryption",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            policy=json.dumps(kms_policy),
            tags={**self.tags, 'Name': f'transaction-kms-key-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        aws.kms.Alias(
            f"transaction-kms-alias-{self.environment_suffix}",
            name=f"alias/transaction-processing-{self.environment_suffix}",
            target_key_id=key.id,
            opts=ResourceOptions(parent=key)
        )

        return key

    def _create_vpc(self):
        """Create VPC for Lambda functions"""
        vpc = aws.ec2.Vpc(
            f"transaction-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, 'Name': f'transaction-vpc-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )
        return vpc

    def _create_private_subnets(self):
        """Create 3 private subnets across 3 AZs"""
        availability_zones = [f'{self.region}a', f'{self.region}b', f'{self.region}c']
        subnets = []

        for i, az in enumerate(availability_zones):
            subnet = aws.ec2.Subnet(
                f"transaction-private-subnet-{i+1}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={**self.tags, 'Name': f'transaction-private-subnet-{i+1}-{self.environment_suffix}'},
                opts=ResourceOptions(parent=self.vpc)
            )
            subnets.append(subnet)

        # Create route table for private subnets
        route_table = aws.ec2.RouteTable(
            f"transaction-private-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, 'Name': f'transaction-private-rt-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Associate subnets with route table
        for i, subnet in enumerate(subnets):
            aws.ec2.RouteTableAssociation(
                f"transaction-rt-assoc-{i+1}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(parent=route_table)
            )

        return subnets

    def _create_vpc_endpoints(self):
        """Create VPC endpoints for AWS services (no NAT gateway needed)"""

        # Security group for VPC endpoints
        endpoint_sg = aws.ec2.SecurityGroup(
            f"vpc-endpoint-sg-{self.environment_suffix}",
            description="Security group for VPC endpoints",
            vpc_id=self.vpc.id,
            ingress=[{
                'protocol': 'tcp',
                'from_port': 443,
                'to_port': 443,
                'cidr_blocks': ['10.0.0.0/16'],
                'description': 'Allow HTTPS from VPC'
            }],
            egress=[{
                'protocol': '-1',
                'from_port': 0,
                'to_port': 0,
                'cidr_blocks': ['0.0.0.0/0'],
                'description': 'Allow all outbound'
            }],
            tags={**self.tags, 'Name': f'vpc-endpoint-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        subnet_ids = [s.id for s in self.private_subnets]
        endpoints = {}

        # Interface endpoints (require ENIs in subnets)
        interface_services = [
            'lambda',
            'sqs',
            'sns',
            'logs',
            'kms',
            'xray'
        ]

        for service in interface_services:
            endpoints[service] = aws.ec2.VpcEndpoint(
                f"vpce-{service}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                service_name=f"com.amazonaws.{self.region}.{service}",
                vpc_endpoint_type="Interface",
                subnet_ids=subnet_ids,
                security_group_ids=[endpoint_sg.id],
                private_dns_enabled=True,
                tags={**self.tags, 'Name': f'vpce-{service}-{self.environment_suffix}'},
                opts=ResourceOptions(parent=self.vpc)
            )

        # Gateway endpoints (route table based, no ENIs)
        gateway_services = ['dynamodb']

        for service in gateway_services:
            endpoints[service] = aws.ec2.VpcEndpoint(
                f"vpce-{service}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                service_name=f"com.amazonaws.{self.region}.{service}",
                vpc_endpoint_type="Gateway",
                tags={**self.tags, 'Name': f'vpce-{service}-{self.environment_suffix}'},
                opts=ResourceOptions(parent=self.vpc)
            )

        return endpoints

    def _create_lambda_role(self):
        """Create IAM role for Lambda functions with least-privilege permissions"""

        assume_role_policy = aws.iam.get_policy_document(
            statements=[{
                'effect': 'Allow',
                'principals': [{
                    'type': 'Service',
                    'identifiers': ['lambda.amazonaws.com']
                }],
                'actions': ['sts:AssumeRole']
            }]
        )

        role = aws.iam.Role(
            f"transaction-lambda-role-{self.environment_suffix}",
            assume_role_policy=assume_role_policy.json,
            tags={**self.tags, 'Name': f'transaction-lambda-role-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # VPC execution policy
        aws.iam.RolePolicyAttachment(
            f"lambda-vpc-policy-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=role)
        )

        # X-Ray policy
        aws.iam.RolePolicyAttachment(
            f"lambda-xray-policy-{self.environment_suffix}",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=ResourceOptions(parent=role)
        )

        # Custom policy for DynamoDB, SQS, SNS, KMS
        custom_policy = aws.iam.Policy(
            f"lambda-custom-policy-{self.environment_suffix}",
            policy=pulumi.Output.all(
                self.kms_key.arn
            ).apply(lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'dynamodb:GetItem',
                            'dynamodb:PutItem',
                            'dynamodb:Query',
                            'dynamodb:Scan'
                        ],
                        'Resource': f'arn:aws:dynamodb:{self.region}:*:table/*-{self.environment_suffix}'
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'sqs:SendMessage',
                            'sqs:ReceiveMessage',
                            'sqs:DeleteMessage',
                            'sqs:GetQueueAttributes'
                        ],
                        'Resource': f'arn:aws:sqs:{self.region}:*:*-{self.environment_suffix}'
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'sns:Publish'
                        ],
                        'Resource': f'arn:aws:sns:{self.region}:*:*-{self.environment_suffix}'
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'kms:Decrypt',
                            'kms:Encrypt',
                            'kms:GenerateDataKey'
                        ],
                        'Resource': args[0]
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'logs:CreateLogGroup',
                            'logs:CreateLogStream',
                            'logs:PutLogEvents'
                        ],
                        'Resource': 'arn:aws:logs:*:*:*'
                    },
                    {
                        'Effect': 'Allow',
                        'Action': [
                            'cloudwatch:PutMetricData'
                        ],
                        'Resource': '*'
                    }
                ]
            })),
            opts=ResourceOptions(parent=role)
        )

        aws.iam.RolePolicyAttachment(
            f"lambda-custom-policy-attach-{self.environment_suffix}",
            role=role.name,
            policy_arn=custom_policy.arn,
            opts=ResourceOptions(parent=role)
        )

        return role

    def _create_merchant_table(self):
        """Create DynamoDB table for merchant configurations"""
        table = aws.dynamodb.Table(
            f"merchant-config-{self.environment_suffix}",
            name=f"merchant-config-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="merchant_id",
            attributes=[{
                'name': 'merchant_id',
                'type': 'S'
            }],
            point_in_time_recovery={'enabled': True},
            server_side_encryption={
                'enabled': True,
                'kms_key_arn': self.kms_key.arn
            },
            tags={**self.tags, 'Name': f'merchant-config-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )
        return table

    def _create_transaction_table(self):
        """Create DynamoDB table for processed transactions"""
        table = aws.dynamodb.Table(
            f"processed-transactions-{self.environment_suffix}",
            name=f"processed-transactions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attributes=[
                {
                    'name': 'transaction_id',
                    'type': 'S'
                },
                {
                    'name': 'timestamp',
                    'type': 'S'
                }
            ],
            point_in_time_recovery={'enabled': True},
            server_side_encryption={
                'enabled': True,
                'kms_key_arn': self.kms_key.arn
            },
            tags={**self.tags, 'Name': f'processed-transactions-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )
        return table

    def _create_dead_letter_queue(self):
        """Create SQS Dead Letter Queue"""
        dlq = aws.sqs.Queue(
            f"transaction-dlq-{self.environment_suffix}",
            name=f"transaction-dlq-{self.environment_suffix}",
            visibility_timeout_seconds=360,  # Must be >= 6 * Lambda timeout (60s)
            message_retention_seconds=1209600,  # 14 days
            kms_master_key_id=self.kms_key.id,
            kms_data_key_reuse_period_seconds=300,
            tags={**self.tags, 'Name': f'transaction-dlq-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )
        return dlq

    def _create_transaction_queue(self):
        """Create SQS queue for valid transactions"""
        queue = aws.sqs.Queue(
            f"transaction-queue-{self.environment_suffix}",
            name=f"transaction-queue-{self.environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=345600,  # 4 days
            kms_master_key_id=self.kms_key.id,
            kms_data_key_reuse_period_seconds=300,
            redrive_policy=self.dlq.arn.apply(
                lambda arn: json.dumps({
                    'deadLetterTargetArn': arn,
                    'maxReceiveCount': 3
                })
            ),
            tags={**self.tags, 'Name': f'transaction-queue-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, depends_on=[self.dlq])
        )
        return queue

    def _create_sns_topic(self):
        """Create SNS topic for fraud detection alerts"""
        topic = aws.sns.Topic(
            f"fraud-alerts-{self.environment_suffix}",
            name=f"fraud-alerts-{self.environment_suffix}",
            kms_master_key_id=self.kms_key.id,
            tags={**self.tags, 'Name': f'fraud-alerts-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Add email subscription (placeholder - would be configured with actual email)
        aws.sns.TopicSubscription(
            f"fraud-alerts-email-{self.environment_suffix}",
            topic=topic.arn,
            protocol="email",
            endpoint="fraud-alerts@example.com",  # Placeholder email
            opts=ResourceOptions(parent=topic)
        )

        return topic

    def _create_validation_lambda(self):
        """Create Lambda function for transaction validation"""

        # Security group for Lambda
        lambda_sg = aws.ec2.SecurityGroup(
            f"validation-lambda-sg-{self.environment_suffix}",
            description="Security group for validation Lambda",
            vpc_id=self.vpc.id,
            egress=[{
                'protocol': '-1',
                'from_port': 0,
                'to_port': 0,
                'cidr_blocks': ['0.0.0.0/0'],
                'description': 'Allow all outbound'
            }],
            tags={**self.tags, 'Name': f'validation-lambda-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # CloudWatch Log Group
        log_group = aws.cloudwatch.LogGroup(
            f"validation-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/validation-lambda-{self.environment_suffix}",
            retention_in_days=30,
            kms_key_id=self.kms_key.arn,
            tags={**self.tags, 'Name': f'validation-lambda-logs-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Lambda function
        lambda_func = aws.lambda_.Function(
            f"validation-lambda-{self.environment_suffix}",
            name=f"validation-lambda-{self.environment_suffix}",
            runtime="python3.11",
            handler="validation_handler.lambda_handler",
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive('./lambda')
            }),
            timeout=60,
            memory_size=512,
            reserved_concurrent_executions=100,  # Reserved capacity for burst traffic
            environment={
                'variables': {
                    'MERCHANT_TABLE_NAME': self.merchant_table.name,
                    'QUEUE_URL': self.transaction_queue.url,
                }
            },
            vpc_config={
                'subnet_ids': [s.id for s in self.private_subnets],
                'security_group_ids': [lambda_sg.id]
            },
            tracing_config={
                'mode': 'Active'
            },
            kms_key_arn=self.kms_key.arn,
            tags={**self.tags, 'Name': f'validation-lambda-{self.environment_suffix}'},
            opts=ResourceOptions(
                parent=self,
                depends_on=[log_group, self.merchant_table, self.transaction_queue]
            )
        )

        return lambda_func

    def _create_fraud_detection_lambda(self):
        """Create Lambda function for fraud detection"""

        # Security group for Lambda
        lambda_sg = aws.ec2.SecurityGroup(
            f"fraud-lambda-sg-{self.environment_suffix}",
            description="Security group for fraud detection Lambda",
            vpc_id=self.vpc.id,
            egress=[{
                'protocol': '-1',
                'from_port': 0,
                'to_port': 0,
                'cidr_blocks': ['0.0.0.0/0'],
                'description': 'Allow all outbound'
            }],
            tags={**self.tags, 'Name': f'fraud-lambda-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # CloudWatch Log Group
        log_group = aws.cloudwatch.LogGroup(
            f"fraud-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/fraud-detection-lambda-{self.environment_suffix}",
            retention_in_days=30,
            kms_key_id=self.kms_key.arn,
            tags={**self.tags, 'Name': f'fraud-lambda-logs-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Lambda function
        lambda_func = aws.lambda_.Function(
            f"fraud-detection-lambda-{self.environment_suffix}",
            name=f"fraud-detection-lambda-{self.environment_suffix}",
            runtime="python3.11",
            handler="fraud_detection_handler.lambda_handler",
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive('./lambda')
            }),
            timeout=60,
            memory_size=512,
            environment={
                'variables': {
                    'TRANSACTION_TABLE_NAME': self.transaction_table.name,
                    'SNS_TOPIC_ARN': self.fraud_alert_topic.arn,
                }
            },
            vpc_config={
                'subnet_ids': [s.id for s in self.private_subnets],
                'security_group_ids': [lambda_sg.id]
            },
            tracing_config={
                'mode': 'Active'
            },
            kms_key_arn=self.kms_key.arn,
            tags={**self.tags, 'Name': f'fraud-detection-lambda-{self.environment_suffix}'},
            opts=ResourceOptions(
                parent=self,
                depends_on=[log_group, self.transaction_table, self.fraud_alert_topic]
            )
        )

        # SQS trigger for Lambda
        aws.lambda_.EventSourceMapping(
            f"fraud-lambda-sqs-trigger-{self.environment_suffix}",
            event_source_arn=self.transaction_queue.arn,
            function_name=lambda_func.name,
            batch_size=10,
            opts=ResourceOptions(parent=lambda_func)
        )

        return lambda_func

    def _create_failed_transaction_lambda(self):
        """Create Lambda function for failed transaction handling"""

        # Security group for Lambda
        lambda_sg = aws.ec2.SecurityGroup(
            f"failed-lambda-sg-{self.environment_suffix}",
            description="Security group for failed transaction Lambda",
            vpc_id=self.vpc.id,
            egress=[{
                'protocol': '-1',
                'from_port': 0,
                'to_port': 0,
                'cidr_blocks': ['0.0.0.0/0'],
                'description': 'Allow all outbound'
            }],
            tags={**self.tags, 'Name': f'failed-lambda-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # CloudWatch Log Group
        log_group = aws.cloudwatch.LogGroup(
            f"failed-lambda-logs-{self.environment_suffix}",
            name=f"/aws/lambda/failed-transaction-lambda-{self.environment_suffix}",
            retention_in_days=30,
            kms_key_id=self.kms_key.arn,
            tags={**self.tags, 'Name': f'failed-lambda-logs-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Lambda function
        lambda_func = aws.lambda_.Function(
            f"failed-transaction-lambda-{self.environment_suffix}",
            name=f"failed-transaction-lambda-{self.environment_suffix}",
            runtime="python3.11",
            handler="failed_transaction_handler.lambda_handler",
            role=self.lambda_role.arn,
            code=pulumi.AssetArchive({
                '.': pulumi.FileArchive('./lambda')
            }),
            timeout=60,
            memory_size=512,
            environment={
                'variables': {
                    'TRANSACTION_TABLE_NAME': self.transaction_table.name,
                    'SNS_TOPIC_ARN': self.fraud_alert_topic.arn,
                }
            },
            vpc_config={
                'subnet_ids': [s.id for s in self.private_subnets],
                'security_group_ids': [lambda_sg.id]
            },
            tracing_config={
                'mode': 'Active'
            },
            kms_key_arn=self.kms_key.arn,
            tags={**self.tags, 'Name': f'failed-transaction-lambda-{self.environment_suffix}'},
            opts=ResourceOptions(
                parent=self,
                depends_on=[log_group, self.transaction_table, self.fraud_alert_topic]
            )
        )

        # DLQ trigger for Lambda
        aws.lambda_.EventSourceMapping(
            f"failed-lambda-dlq-trigger-{self.environment_suffix}",
            event_source_arn=self.dlq.arn,
            function_name=lambda_func.name,
            batch_size=10,
            opts=ResourceOptions(parent=lambda_func)
        )

        return lambda_func

    def _create_api_gateway(self):
        """Create API Gateway REST API"""

        # Create REST API
        api = aws.apigateway.RestApi(
            f"transaction-api-{self.environment_suffix}",
            name=f"transaction-api-{self.environment_suffix}",
            description="API Gateway for transaction processing",
            tags={**self.tags, 'Name': f'transaction-api-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Enable X-Ray tracing for API Gateway
        self.api_stage = aws.apigateway.Stage(
            f"transaction-api-stage-{self.environment_suffix}",
            rest_api=api.id,
            deployment=aws.apigateway.Deployment(
                f"transaction-api-deployment-{self.environment_suffix}",
                rest_api=api.id,
                opts=ResourceOptions(parent=api, depends_on=[self._create_api_gateway_resources(api)])
            ).id,
            stage_name=self.stage_name,
            xray_tracing_enabled=True,
            tags={**self.tags, 'Name': f'transaction-api-stage-{self.environment_suffix}'},
            opts=ResourceOptions(parent=api)
        )

        return api

    def _create_api_gateway_resources(self, api):
        """Create API Gateway resources and methods"""

        # Create /transaction resource
        transaction_resource = aws.apigateway.Resource(
            f"transaction-resource-{self.environment_suffix}",
            rest_api=api.id,
            parent_id=api.root_resource_id,
            path_part="transaction",
            opts=ResourceOptions(parent=api)
        )

        # Create POST method
        method = aws.apigateway.Method(
            f"transaction-post-method-{self.environment_suffix}",
            rest_api=api.id,
            resource_id=transaction_resource.id,
            http_method="POST",
            authorization="NONE",
            api_key_required=True,
            opts=ResourceOptions(parent=transaction_resource)
        )

        # Lambda integration
        integration = aws.apigateway.Integration(
            f"transaction-lambda-integration-{self.environment_suffix}",
            rest_api=api.id,
            resource_id=transaction_resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.validation_lambda.invoke_arn,
            opts=ResourceOptions(parent=method)
        )

        # Lambda permission for API Gateway
        aws.lambda_.Permission(
            f"api-gateway-lambda-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=self.validation_lambda.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.all(api.execution_arn, api.id).apply(
                lambda args: f"{args[0]}/*/*/*"
            ),
            opts=ResourceOptions(parent=self.validation_lambda)
        )

        return integration

    def _create_api_key(self):
        """Create API key for authentication"""

        api_key = aws.apigateway.ApiKey(
            f"transaction-api-key-{self.environment_suffix}",
            name=f"transaction-api-key-{self.environment_suffix}",
            enabled=True,
            tags={**self.tags, 'Name': f'transaction-api-key-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.api_gateway)
        )

        # Create usage plan
        usage_plan = aws.apigateway.UsagePlan(
            f"transaction-usage-plan-{self.environment_suffix}",
            name=f"transaction-usage-plan-{self.environment_suffix}",
            api_stages=[{
                'api_id': self.api_gateway.id,
                'stage': self.stage_name
            }],
            quota_settings={
                'limit': 10000,
                'period': 'DAY'
            },
            throttle_settings={
                'burst_limit': 1000,
                'rate_limit': 500
            },
            tags={**self.tags, 'Name': f'transaction-usage-plan-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.api_gateway, depends_on=[self.api_stage])
        )

        # Associate API key with usage plan
        aws.apigateway.UsagePlanKey(
            f"transaction-usage-plan-key-{self.environment_suffix}",
            key_id=api_key.id,
            key_type="API_KEY",
            usage_plan_id=usage_plan.id,
            opts=ResourceOptions(parent=usage_plan)
        )

        return api_key

    def _create_waf_web_acl(self):
        """Create AWS WAF Web ACL with managed rule sets"""

        web_acl = aws.wafv2.WebAcl(
            f"transaction-waf-{self.environment_suffix}",
            name=f"transaction-waf-{self.environment_suffix}",
            scope="REGIONAL",
            default_action={'allow': {}},
            rules=[
                {
                    'name': 'AWS-AWSManagedRulesCommonRuleSet',
                    'priority': 1,
                    'override_action': {'none': {}},
                    'statement': {
                        'managed_rule_group_statement': {
                            'vendor_name': 'AWS',
                            'name': 'AWSManagedRulesCommonRuleSet'
                        }
                    },
                    'visibility_config': {
                        'sampled_requests_enabled': True,
                        'cloudwatch_metrics_enabled': True,
                        'metric_name': 'CommonRuleSetMetric'
                    }
                },
                {
                    'name': 'AWS-AWSManagedRulesKnownBadInputsRuleSet',
                    'priority': 2,
                    'override_action': {'none': {}},
                    'statement': {
                        'managed_rule_group_statement': {
                            'vendor_name': 'AWS',
                            'name': 'AWSManagedRulesKnownBadInputsRuleSet'
                        }
                    },
                    'visibility_config': {
                        'sampled_requests_enabled': True,
                        'cloudwatch_metrics_enabled': True,
                        'metric_name': 'KnownBadInputsMetric'
                    }
                }
            ],
            visibility_config={
                'sampled_requests_enabled': True,
                'cloudwatch_metrics_enabled': True,
                'metric_name': f'transaction-waf-{self.environment_suffix}'
            },
            tags={**self.tags, 'Name': f'transaction-waf-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        return web_acl

    def _associate_waf_with_api(self):
        """Associate WAF Web ACL with API Gateway stage"""

        association = aws.wafv2.WebAclAssociation(
            f"waf-api-association-{self.environment_suffix}",
            resource_arn=pulumi.Output.all(
                self.api_gateway.id,
                self.api_gateway.execution_arn
            ).apply(
                lambda args: f"arn:aws:apigateway:{self.region}::/restapis/{args[0]}/stages/{self.stage_name}"
            ),
            web_acl_arn=self.waf_web_acl.arn,
            opts=ResourceOptions(parent=self.waf_web_acl, depends_on=[self.api_gateway, self.api_stage])
        )

        return association

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for Lambda errors"""
        alarms = []

        lambda_functions = [
            (self.validation_lambda, 'validation-lambda'),
            (self.fraud_detection_lambda, 'fraud-detection-lambda'),
            (self.failed_transaction_lambda, 'failed-transaction-lambda')
        ]

        for lambda_func, name in lambda_functions:
            alarm = aws.cloudwatch.MetricAlarm(
                f"{name}-error-alarm-{self.environment_suffix}",
                name=f"{name}-error-alarm-{self.environment_suffix}",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                metric_name="Errors",
                namespace="AWS/Lambda",
                period=300,
                statistic="Average",
                threshold=1.0,  # 1% error rate
                alarm_description=f"Alarm when {name} error rate exceeds 1%",
                dimensions={
                    'FunctionName': lambda_func.name
                },
                alarm_actions=[self.fraud_alert_topic.arn],
                tags={**self.tags, 'Name': f'{name}-error-alarm-{self.environment_suffix}'},
                opts=ResourceOptions(parent=lambda_func)
            )
            alarms.append(alarm)

        return alarms

    def _create_cloudwatch_dashboard(self):
        """Create CloudWatch dashboard for monitoring"""

        dashboard_body = pulumi.Output.all(
            self.validation_lambda.name,
            self.fraud_detection_lambda.name,
            self.failed_transaction_lambda.name,
            self.transaction_queue.name,
            self.dlq.name
        ).apply(lambda args: json.dumps({
            'widgets': [
                {
                    'type': 'metric',
                    'properties': {
                        'metrics': [
                            ['AWS/Lambda', 'Invocations', {'stat': 'Sum', 'label': 'Validation Lambda'}],
                            ['.', '.', {'stat': 'Sum', 'label': 'Fraud Detection Lambda'}],
                            ['.', '.', {'stat': 'Sum', 'label': 'Failed Transaction Lambda'}]
                        ],
                        'period': 300,
                        'stat': 'Sum',
                        'region': self.region,
                        'title': 'Lambda Invocations',
                        'yAxis': {'left': {'label': 'Count'}}
                    }
                },
                {
                    'type': 'metric',
                    'properties': {
                        'metrics': [
                            ['AWS/Lambda', 'Errors', {'stat': 'Sum', 'label': args[0]}],
                            ['.', '.', {'stat': 'Sum', 'label': args[1]}],
                            ['.', '.', {'stat': 'Sum', 'label': args[2]}]
                        ],
                        'period': 300,
                        'stat': 'Sum',
                        'region': self.region,
                        'title': 'Lambda Errors',
                        'yAxis': {'left': {'label': 'Count'}}
                    }
                },
                {
                    'type': 'metric',
                    'properties': {
                        'metrics': [
                            ['AWS/Lambda', 'Duration', {'stat': 'Average', 'label': args[0]}],
                            ['.', '.', {'stat': 'Average', 'label': args[1]}],
                            ['.', '.', {'stat': 'Average', 'label': args[2]}]
                        ],
                        'period': 300,
                        'stat': 'Average',
                        'region': self.region,
                        'title': 'Lambda Duration',
                        'yAxis': {'left': {'label': 'Milliseconds'}}
                    }
                },
                {
                    'type': 'metric',
                    'properties': {
                        'metrics': [
                            ['AWS/SQS', 'NumberOfMessagesSent', {'stat': 'Sum', 'label': args[3]}],
                            ['.', 'NumberOfMessagesReceived', {'stat': 'Sum', 'label': args[3]}],
                            ['.', 'NumberOfMessagesSent', {'stat': 'Sum', 'label': args[4] + ' (DLQ)'}]
                        ],
                        'period': 300,
                        'stat': 'Sum',
                        'region': self.region,
                        'title': 'SQS Queue Metrics',
                        'yAxis': {'left': {'label': 'Count'}}
                    }
                }
            ]
        }))

        dashboard = aws.cloudwatch.Dashboard(
            f"transaction-dashboard-{self.environment_suffix}",
            dashboard_name=f"transaction-dashboard-{self.environment_suffix}",
            dashboard_body=dashboard_body,
            opts=ResourceOptions(parent=self)
        )

        return dashboard
