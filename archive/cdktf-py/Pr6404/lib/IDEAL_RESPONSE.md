## tap_stack.py

```python
"""TAP Stack module for CDKTF Python infrastructure - Asynchronous Transaction Processing System."""

from cdktf import TerraformStack, S3Backend, Fn, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.sqs_queue_policy import SqsQueuePolicy
from cdktf_cdktf_provider_aws.lambda_function import LambdaFunction
from cdktf_cdktf_provider_aws.lambda_event_source_mapping import LambdaEventSourceMapping
from cdktf_cdktf_provider_aws.lambda_permission import LambdaPermission
from cdktf_cdktf_provider_aws.sfn_state_machine import SfnStateMachine
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable
from cdktf_cdktf_provider_aws.cloudwatch_event_rule import CloudwatchEventRule
from cdktf_cdktf_provider_aws.cloudwatch_event_target import CloudwatchEventTarget
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.vpc_endpoint import VpcEndpoint
import json
import os


class TapStack(TerraformStack):
    """CDKTF Python stack for Asynchronous Transaction Processing System."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with transaction processing infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-2')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Merge default tags with required tags
        all_tags = {
            **default_tags.get('tags', {}),
            'Environment': environment_suffix,
            'Application': 'transaction-processing-system',
            'Project': 'async-transaction-pipeline'
        }

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[{"tags": all_tags}],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # Get availability zones
        azs = [f"{aws_region}a", f"{aws_region}b", f"{aws_region}c"]

        # Create VPC
        vpc = Vpc(
            self,
            f"vpc_{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={'Name': f"transaction-vpc-{environment_suffix}"}
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            f"igw_{environment_suffix}",
            vpc_id=vpc.id,
            tags={'Name': f"transaction-igw-{environment_suffix}"}
        )

        # Create private subnets for Lambda functions
        private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self,
                f"private_subnet_{i}_{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={'Name': f"transaction-private-subnet-{i}-{environment_suffix}"}
            )
            private_subnets.append(subnet)

        # Create public subnet for NAT Gateway
        public_subnet = Subnet(
            self,
            f"public_subnet_{environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.10.0/24",
            availability_zone=azs[0],
            map_public_ip_on_launch=True,
            tags={'Name': f"transaction-public-subnet-{environment_suffix}"}
        )

        # Create Elastic IP for NAT Gateway
        nat_eip = Eip(
            self,
            f"nat_eip_{environment_suffix}",
            domain="vpc",
            tags={'Name': f"transaction-nat-eip-{environment_suffix}"},
            depends_on=[igw]
        )

        # Create NAT Gateway
        nat_gateway = NatGateway(
            self,
            f"nat_gateway_{environment_suffix}",
            allocation_id=nat_eip.id,
            subnet_id=public_subnet.id,
            tags={'Name': f"transaction-nat-gateway-{environment_suffix}"},
            depends_on=[igw]
        )

        # Create public route table
        public_rt = RouteTable(
            self,
            f"public_rt_{environment_suffix}",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={'Name': f"transaction-public-rt-{environment_suffix}"}
        )

        # Associate public subnet with public route table
        RouteTableAssociation(
            self,
            f"public_rt_assoc_{environment_suffix}",
            subnet_id=public_subnet.id,
            route_table_id=public_rt.id
        )

        # Create private route table
        private_rt = RouteTable(
            self,
            f"private_rt_{environment_suffix}",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id
            )],
            tags={'Name': f"transaction-private-rt-{environment_suffix}"}
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(private_subnets):
            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i}_{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        # Create Lambda security group
        lambda_sg = SecurityGroup(
            self,
            f"lambda_sg_{environment_suffix}",
            name=f"transaction-lambda-sg-{environment_suffix}",
            description="Security group for transaction processing Lambda functions",
            vpc_id=vpc.id,
            tags={'Name': f"transaction-lambda-sg-{environment_suffix}"}
        )

        # Lambda security group rules
        SecurityGroupRule(
            self,
            f"lambda_sg_egress_{environment_suffix}",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=lambda_sg.id,
            description="Allow all outbound traffic"
        )

        # VPC Endpoints for AWS services (to avoid internet routing)
        vpc_endpoints = {}
        
        # SQS VPC Endpoint
        vpc_endpoints['sqs'] = VpcEndpoint(
            self,
            f"sqs_endpoint_{environment_suffix}",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.sqs",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in private_subnets],
            security_group_ids=[lambda_sg.id],
            private_dns_enabled=True,
            tags={'Name': f"transaction-sqs-endpoint-{environment_suffix}"}
        )

        # DynamoDB VPC Endpoint
        vpc_endpoints['dynamodb'] = VpcEndpoint(
            self,
            f"dynamodb_endpoint_{environment_suffix}",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.dynamodb",
            vpc_endpoint_type="Gateway",
            route_table_ids=[private_rt.id],
            tags={'Name': f"transaction-dynamodb-endpoint-{environment_suffix}"}
        )

        # Step Functions VPC Endpoint
        vpc_endpoints['stepfunctions'] = VpcEndpoint(
            self,
            f"stepfunctions_endpoint_{environment_suffix}",
            vpc_id=vpc.id,
            service_name=f"com.amazonaws.{aws_region}.states",
            vpc_endpoint_type="Interface",
            subnet_ids=[subnet.id for subnet in private_subnets],
            security_group_ids=[lambda_sg.id],
            private_dns_enabled=True,
            tags={'Name': f"transaction-stepfunctions-endpoint-{environment_suffix}"}
        )

        # Create SQS Dead Letter Queues
        dlq_high = SqsQueue(
            self,
            f"dlq_high_{environment_suffix}",
            name=f"transaction-dlq-high-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={'Name': f"transaction-dlq-high-{environment_suffix}", 'Priority': 'high'}
        )

        dlq_medium = SqsQueue(
            self,
            f"dlq_medium_{environment_suffix}",
            name=f"transaction-dlq-medium-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={'Name': f"transaction-dlq-medium-{environment_suffix}", 'Priority': 'medium'}
        )

        dlq_low = SqsQueue(
            self,
            f"dlq_low_{environment_suffix}",
            name=f"transaction-dlq-low-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={'Name': f"transaction-dlq-low-{environment_suffix}", 'Priority': 'low'}
        )

        # Create SQS Primary Queues with different configurations
        queue_high = SqsQueue(
            self,
            f"queue_high_{environment_suffix}",
            name=f"transaction-queue-high-{environment_suffix}",
            message_retention_seconds=86400,  # 1 day
            visibility_timeout_seconds=30,  # High priority: 30 seconds per PROMPT
            redrive_policy=json.dumps({
                "deadLetterTargetArn": dlq_high.arn,
                "maxReceiveCount": 3
            }),
            tags={'Name': f"transaction-queue-high-{environment_suffix}", 'Priority': 'high'}
        )

        queue_medium = SqsQueue(
            self,
            f"queue_medium_{environment_suffix}",
            name=f"transaction-queue-medium-{environment_suffix}",
            message_retention_seconds=259200,  # 3 days
            visibility_timeout_seconds=60,  # Medium priority: 60 seconds per PROMPT
            redrive_policy=json.dumps({
                "deadLetterTargetArn": dlq_medium.arn,
                "maxReceiveCount": 3
            }),
            tags={'Name': f"transaction-queue-medium-{environment_suffix}", 'Priority': 'medium'}
        )

        queue_low = SqsQueue(
            self,
            f"queue_low_{environment_suffix}",
            name=f"transaction-queue-low-{environment_suffix}",
            message_retention_seconds=604800,  # 7 days
            visibility_timeout_seconds=120,  # Low priority: 120 seconds per PROMPT
            redrive_policy=json.dumps({
                "deadLetterTargetArn": dlq_low.arn,
                "maxReceiveCount": 3
            }),
            tags={'Name': f"transaction-queue-low-{environment_suffix}", 'Priority': 'low'}
        )

        # Create DynamoDB table for transaction metadata
        dynamodb_table = DynamodbTable(
            self,
            f"transactions_table_{environment_suffix}",
            name=f"transactions-{environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transactionId",
            attribute=[
                {"name": "transactionId", "type": "S"},
            ],
            ttl={
                "attribute_name": "expirationTime",
                "enabled": True
            },
            tags={'Name': f"transactions-table-{environment_suffix}"}
        )

        # Create CloudWatch Log Groups
        log_groups = {}
        priorities = ['high', 'medium', 'low']
        
        for priority in priorities:
            log_groups[priority] = CloudwatchLogGroup(
                self,
                f"lambda_log_group_{priority}_{environment_suffix}",
                name=f"/aws/lambda/transaction-processor-{priority}-{environment_suffix}",
                retention_in_days=7,
                tags={'Name': f"transaction-processor-{priority}-log-group-{environment_suffix}"}
            )

        # Step Functions log group
        sf_log_group = CloudwatchLogGroup(
            self,
            f"stepfunctions_log_group_{environment_suffix}",
            name=f"/aws/vendedlogs/states/transaction-validation-{environment_suffix}",
            retention_in_days=7,
            tags={'Name': f"transaction-validation-sf-log-group-{environment_suffix}"}
        )

        # Create IAM roles and policies
        
        # Lambda execution role
        lambda_role = IamRole(
            self,
            f"lambda_execution_role_{environment_suffix}",
            name=f"transaction-lambda-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Effect": "Allow",
                    "Sid": ""
                }]
            }),
            tags={'Name': f"transaction-lambda-role-{environment_suffix}"}
        )

        # Attach basic Lambda execution policy
        IamRolePolicyAttachment(
            self,
            f"lambda_basic_execution_{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
        )

        # Attach X-Ray tracing policy
        IamRolePolicyAttachment(
            self,
            f"lambda_xray_policy_{environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
        )

        # Custom Lambda policy for SQS, DynamoDB, and Step Functions
        lambda_policy = IamPolicy(
            self,
            f"lambda_custom_policy_{environment_suffix}",
            name=f"transaction-lambda-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:ReceiveMessage",
                            "sqs:DeleteMessage",
                            "sqs:GetQueueAttributes",
                            "sqs:SendMessage"
                        ],
                        "Resource": [
                            queue_high.arn,
                            queue_medium.arn,
                            queue_low.arn,
                            dlq_high.arn,
                            dlq_medium.arn,
                            dlq_low.arn
                        ]
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
                        "Resource": dynamodb_table.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "states:StartExecution",
                            "states:DescribeExecution",
                            "states:StopExecution",
                            "states:SendTaskSuccess",
                            "states:SendTaskFailure"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "events:PutEvents"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        IamRolePolicyAttachment(
            self,
            f"lambda_custom_policy_attachment_{environment_suffix}",
            role=lambda_role.name,
            policy_arn=lambda_policy.arn
        )

        # Create Lambda functions for transaction processing
        lambda_functions = {}
        concurrency_limits = {'high': 100, 'medium': 50, 'low': 25}
        queues = {'high': queue_high, 'medium': queue_medium, 'low': queue_low}

        # Get absolute path to lambda package
        lambda_zip_path = os.path.join(os.getcwd(), "lib", "lambda_package.zip")

        for priority in priorities:
            lambda_functions[priority] = LambdaFunction(
                self,
                f"lambda_{priority}_{environment_suffix}",
                function_name=f"transaction-processor-{priority}-{environment_suffix}",
                runtime="python3.11",
                handler="lambda_function.handler",
                role=lambda_role.arn,
                filename=lambda_zip_path,
                timeout=20,  # Must be less than min visibility timeout (30s)
                memory_size=512,
                reserved_concurrent_executions=concurrency_limits[priority],
                vpc_config={
                    "subnet_ids": [subnet.id for subnet in private_subnets],
                    "security_group_ids": [lambda_sg.id]
                },
                environment={
                    "variables": {
                        "DYNAMODB_TABLE": dynamodb_table.name,
                        "PRIORITY": priority
                    }
                },
                tracing_config={"mode": "Active"},
                tags={'Name': f"transaction-processor-{priority}-{environment_suffix}", 'Priority': priority},
                depends_on=[log_groups[priority]]
            )

            # Create event source mapping for SQS to Lambda
            LambdaEventSourceMapping(
                self,
                f"lambda_sqs_mapping_{priority}_{environment_suffix}",
                event_source_arn=queues[priority].arn,
                function_name=lambda_functions[priority].function_name,
                batch_size=10,
                maximum_batching_window_in_seconds=5
            )

        # Step Functions role
        sf_role = IamRole(
            self,
            f"stepfunctions_role_{environment_suffix}",
            name=f"transaction-stepfunctions-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "states.amazonaws.com"
                    },
                    "Effect": "Allow",
                    "Sid": ""
                }]
            }),
            tags={'Name': f"transaction-stepfunctions-role-{environment_suffix}"}
        )

        # Step Functions policy
        sf_policy = IamPolicy(
            self,
            f"stepfunctions_policy_{environment_suffix}",
            name=f"transaction-stepfunctions-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "lambda:InvokeFunction"
                        ],
                        "Resource": [
                            lambda_functions['high'].arn,
                            lambda_functions['medium'].arn,
                            lambda_functions['low'].arn
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:UpdateItem"
                        ],
                        "Resource": dynamodb_table.arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogDelivery",
                            "logs:GetLogDelivery",
                            "logs:UpdateLogDelivery",
                            "logs:DeleteLogDelivery",
                            "logs:ListLogDeliveries",
                            "logs:PutResourcePolicy",
                            "logs:DescribeResourcePolicies",
                            "logs:DescribeLogGroups"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        IamRolePolicyAttachment(
            self,
            f"stepfunctions_policy_attachment_{environment_suffix}",
            role=sf_role.name,
            policy_arn=sf_policy.arn
        )

        # Create Step Functions state machine for transaction validation
        step_function = SfnStateMachine(
            self,
            f"transaction_validation_{environment_suffix}",
            name=f"transaction-validation-{environment_suffix}",
            role_arn=sf_role.arn,
            definition=json.dumps(self._get_step_function_definition(environment_suffix, lambda_functions)),
            logging_configuration={
                "log_destination": f"{sf_log_group.arn}:*",
                "include_execution_data": True,
                "level": "ALL"
            },
            tracing_configuration={
                "enabled": True
            },
            tags={'Name': f"transaction-validation-{environment_suffix}"}
        )

        # EventBridge role
        eventbridge_role = IamRole(
            self,
            f"eventbridge_role_{environment_suffix}",
            name=f"transaction-eventbridge-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "events.amazonaws.com"
                    },
                    "Effect": "Allow",
                    "Sid": ""
                }]
            }),
            tags={'Name': f"transaction-eventbridge-role-{environment_suffix}"}
        )

        # EventBridge policy
        eventbridge_policy = IamPolicy(
            self,
            f"eventbridge_policy_{environment_suffix}",
            name=f"transaction-eventbridge-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage",
                            "sqs:GetQueueAttributes"
                        ],
                        "Resource": [
                            queue_high.arn,
                            queue_medium.arn,
                            queue_low.arn
                        ]
                    }
                ]
            })
        )

        IamRolePolicyAttachment(
            self,
            f"eventbridge_policy_attachment_{environment_suffix}",
            role=eventbridge_role.name,
            policy_arn=eventbridge_policy.arn
        )

        # Create EventBridge rules for transaction routing
        event_rules = {}
        
        # High priority rule (>= $10,000)
        event_rules['high'] = CloudwatchEventRule(
            self,
            f"transaction_rule_high_{environment_suffix}",
            name=f"transaction-routing-high-{environment_suffix}",
            description="Route high-value transactions ($10k+) to high priority queue",
            event_pattern=json.dumps({
                "source": ["transaction.system"],
                "detail-type": ["Transaction Received"],
                "detail": {
                    "amount": [{"numeric": [">=", 10000]}]
                }
            }),
            tags={'Name': f"transaction-rule-high-{environment_suffix}"}
        )

        # Medium priority rule ($1,000 - $9,999)
        event_rules['medium'] = CloudwatchEventRule(
            self,
            f"transaction_rule_medium_{environment_suffix}",
            name=f"transaction-routing-medium-{environment_suffix}",
            description="Route medium-value transactions ($1k-$10k) to medium priority queue",
            event_pattern=json.dumps({
                "source": ["transaction.system"],
                "detail-type": ["Transaction Received"],
                "detail": {
                    "amount": [{"numeric": [">=", 1000, "<", 10000]}]
                }
            }),
            tags={'Name': f"transaction-rule-medium-{environment_suffix}"}
        )

        # Low priority rule (< $1,000)
        event_rules['low'] = CloudwatchEventRule(
            self,
            f"transaction_rule_low_{environment_suffix}",
            name=f"transaction-routing-low-{environment_suffix}",
            description="Route low-value transactions (<$1k) to low priority queue",
            event_pattern=json.dumps({
                "source": ["transaction.system"],
                "detail-type": ["Transaction Received"],
                "detail": {
                    "amount": [{"numeric": ["<", 1000]}]
                }
            }),
            tags={'Name': f"transaction-rule-low-{environment_suffix}"}
        )

        # Create EventBridge targets
        targets = {
            'high': (event_rules['high'], queue_high),
            'medium': (event_rules['medium'], queue_medium),
            'low': (event_rules['low'], queue_low)
        }

        for priority, (rule, queue) in targets.items():
            CloudwatchEventTarget(
                self,
                f"transaction_target_{priority}_{environment_suffix}",
                rule=rule.name,
                arn=queue.arn,
                role_arn=eventbridge_role.arn,
                sqs_target={
                    "message_group_id": f"transaction-{priority}"
                }
            )

        # Create CloudWatch alarms for queue monitoring
        alarm_thresholds = {'high': 1000, 'medium': 5000, 'low': 10000}
        
        for priority, threshold in alarm_thresholds.items():
            CloudwatchMetricAlarm(
                self,
                f"queue_depth_alarm_{priority}_{environment_suffix}",
                alarm_name=f"transaction-queue-depth-{priority}-{environment_suffix}",
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                metric_name="ApproximateNumberOfVisibleMessages",
                namespace="AWS/SQS",
                period=60,
                statistic="Average",
                threshold=threshold,
                alarm_description=f"Alarm when {priority} priority queue depth exceeds {threshold}",
                alarm_actions=[],  # Add SNS topic ARN here if needed
                dimensions={
                    "QueueName": queues[priority].name
                },
                tags={'Name': f"transaction-queue-alarm-{priority}-{environment_suffix}"}
            )

        # Create outputs
        TerraformOutput(
            self,
            f"vpc_id_{environment_suffix}",
            value=vpc.id,
            description="VPC ID for transaction processing system"
        )

        TerraformOutput(
            self,
            f"high_priority_queue_url_{environment_suffix}",
            value=queue_high.url,
            description="High priority SQS queue URL"
        )

        TerraformOutput(
            self,
            f"medium_priority_queue_url_{environment_suffix}",
            value=queue_medium.url,
            description="Medium priority SQS queue URL"
        )

        TerraformOutput(
            self,
            f"low_priority_queue_url_{environment_suffix}",
            value=queue_low.url,
            description="Low priority SQS queue URL"
        )

        TerraformOutput(
            self,
            f"dynamodb_table_name_{environment_suffix}",
            value=dynamodb_table.name,
            description="DynamoDB table name for transaction metadata"
        )

        TerraformOutput(
            self,
            f"step_function_arn_{environment_suffix}",
            value=step_function.arn,
            description="Step Functions state machine ARN for transaction validation"
        )

    def _get_step_function_definition(self, environment_suffix: str, lambda_functions: dict) -> dict:
        """Return the Step Functions state machine definition."""
        return {
            "Comment": "Transaction validation workflow with fraud checks, balance verification, and compliance screening",
            "StartAt": "FraudCheck",
            "States": {
                "FraudCheck": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": lambda_functions['high'].arn,
                        "Payload": {
                            "operation": "fraud_check",
                            "transactionId.$": "$.transactionId",
                            "amount.$": "$.amount"
                        }
                    },
                    "ResultPath": "$.fraudCheckResult",
                    "Next": "FraudCheckEvaluation",
                    "Retry": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "ValidationFailed",
                            "ResultPath": "$.error"
                        }
                    ]
                },
                "FraudCheckEvaluation": {
                    "Type": "Choice",
                    "Choices": [
                        {
                            "Variable": "$.fraudCheckResult.Payload.fraudDetected",
                            "BooleanEquals": True,
                            "Next": "FraudDetected"
                        }
                    ],
                    "Default": "BalanceVerification"
                },
                "FraudDetected": {
                    "Type": "Fail",
                    "Cause": "Fraud detected in transaction",
                    "Error": "FraudDetected"
                },
                "BalanceVerification": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": lambda_functions['medium'].arn,
                        "Payload": {
                            "operation": "balance_check",
                            "transactionId.$": "$.transactionId",
                            "amount.$": "$.amount"
                        }
                    },
                    "ResultPath": "$.balanceCheckResult",
                    "Next": "BalanceEvaluation",
                    "Retry": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "ValidationFailed",
                            "ResultPath": "$.error"
                        }
                    ]
                },
                "BalanceEvaluation": {
                    "Type": "Choice",
                    "Choices": [
                        {
                            "Variable": "$.balanceCheckResult.Payload.sufficientBalance",
                            "BooleanEquals": False,
                            "Next": "InsufficientBalance"
                        }
                    ],
                    "Default": "ComplianceScreening"
                },
                "InsufficientBalance": {
                    "Type": "Fail",
                    "Cause": "Insufficient balance for transaction",
                    "Error": "InsufficientBalance"
                },
                "ComplianceScreening": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": lambda_functions['low'].arn,
                        "Payload": {
                            "operation": "compliance_check",
                            "transactionId.$": "$.transactionId",
                            "amount.$": "$.amount"
                        }
                    },
                    "ResultPath": "$.complianceCheckResult",
                    "Next": "ComplianceEvaluation",
                    "Retry": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "IntervalSeconds": 2,
                            "MaxAttempts": 3,
                            "BackoffRate": 2.0
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "ValidationFailed",
                            "ResultPath": "$.error"
                        }
                    ]
                },
                "ComplianceEvaluation": {
                    "Type": "Choice",
                    "Choices": [
                        {
                            "Variable": "$.complianceCheckResult.Payload.requiresHumanReview",
                            "BooleanEquals": True,
                            "Next": "HumanApproval"
                        }
                    ],
                    "Default": "TransactionApproved"
                },
                "HumanApproval": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke.waitForTaskToken",
                    "Parameters": {
                        "FunctionName": lambda_functions['high'].arn,
                        "Payload": {
                            "operation": "request_human_approval",
                            "transactionId.$": "$.transactionId",
                            "amount.$": "$.amount",
                            "taskToken.$": "$$.Task.Token"
                        }
                    },
                    "ResultPath": "$.humanApprovalResult",
                    "Next": "HumanApprovalEvaluation",
                    "TimeoutSeconds": 3600,
                    "Catch": [
                        {
                            "ErrorEquals": ["States.Timeout"],
                            "Next": "ApprovalTimeout",
                            "ResultPath": "$.error"
                        }
                    ]
                },
                "HumanApprovalEvaluation": {
                    "Type": "Choice",
                    "Choices": [
                        {
                            "Variable": "$.humanApprovalResult.Payload.approved",
                            "BooleanEquals": True,
                            "Next": "TransactionApproved"
                        }
                    ],
                    "Default": "TransactionRejected"
                },
                "ApprovalTimeout": {
                    "Type": "Fail",
                    "Cause": "Human approval timeout",
                    "Error": "ApprovalTimeout"
                },
                "TransactionApproved": {
                    "Type": "Succeed"
                },
                "TransactionRejected": {
                    "Type": "Fail",
                    "Cause": "Transaction rejected by human reviewer",
                    "Error": "TransactionRejected"
                },
                "ValidationFailed": {
                    "Type": "Fail",
                    "Cause": "Validation process failed due to technical error",
                    "Error": "ValidationFailed"
                }
            }
        }

```
## lambda_function.py

```python
import json
import boto3
import os
import time
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
stepfunctions = boto3.client('stepfunctions')
sqs = boto3.client('sqs')

# Get environment variables
TABLE_NAME = os.environ.get('DYNAMODB_TABLE', 'transactions')
PRIORITY = os.environ.get('PRIORITY', 'medium')
STEP_FUNCTION_ARN = os.environ.get('STEP_FUNCTION_ARN', '')

table = dynamodb.Table(TABLE_NAME)

def handler(event, context):
    print(f"Processing {len(event.get('Records', []))} messages with {PRIORITY} priority")
    
    # Handle different types of invocations
    if 'Records' in event:
        # SQS trigger
        return handle_sqs_messages(event['Records'])
    elif 'operation' in event:
        # Direct invocation from Step Functions
        return handle_step_function_operation(event)
    else:
        return {
            'statusCode': 400,
            'body': json.dumps('Unknown event type')
        }

def handle_sqs_messages(records):
    for record in records:
        try:
            # Parse SQS message
            message_body = json.loads(record['body'])
            
            # Extract transaction details
            transaction_id = message_body.get('transactionId')
            amount = Decimal(str(message_body.get('amount', 0)))
            
            print(f"Processing transaction {transaction_id} with amount ${amount}")
            
            # Store transaction metadata in DynamoDB
            ttl_timestamp = int(time.time()) + (90 * 24 * 60 * 60)  # 90 days from now
            
            table.put_item(
                Item={
                    'transactionId': transaction_id,
                    'amount': amount,
                    'priority': PRIORITY,
                    'status': 'processing',
                    'timestamp': int(time.time()),
                    'expirationTime': ttl_timestamp
                }
            )
            
            # Start Step Functions execution for complex validation
            # Note: STEP_FUNCTION_ARN will be set via deployment scripts or environment
            step_function_arn = os.environ.get('STEP_FUNCTION_ARN')
            if step_function_arn:
                step_input = {
                    'transactionId': transaction_id,
                    'amount': float(amount),
                    'priority': PRIORITY,
                    'fraudCheck': True,
                    'balanceVerification': True,
                    'complianceScreening': True
                }
                
                sf_response = stepfunctions.start_execution(
                    stateMachineArn=step_function_arn,
                    name=f"{transaction_id}-{int(time.time())}",
                    input=json.dumps(step_input)
                )
                
                print(f"Started Step Functions execution: {sf_response['executionArn']}")
                
                # Update transaction status
                table.update_item(
                    Key={'transactionId': transaction_id},
                    UpdateExpression='SET #status = :status, executionArn = :arn',
                    ExpressionAttributeNames={'#status': 'status'},
                    ExpressionAttributeValues={
                        ':status': 'validation_started',
                        ':arn': sf_response['executionArn']
                    }
                )
            
        except Exception as e:
            print(f"Error processing message: {str(e)}")
            raise e
    
    return {
        'statusCode': 200,
        'body': json.dumps(f'Successfully processed {len(records)} messages')
    }

def handle_step_function_operation(event):
    operation = event.get('operation')
    transaction_id = event.get('transactionId')
    amount = event.get('amount', 0)
    
    print(f"Handling {operation} for transaction {transaction_id}")
    
    try:
        if operation == 'fraud_check':
            # Simulate fraud detection logic
            fraud_detected = amount > 50000  # Simple rule: flag transactions > $50k
            return {
                'fraudDetected': fraud_detected,
                'reason': 'High amount transaction' if fraud_detected else 'Normal transaction'
            }
        
        elif operation == 'balance_check':
            # Simulate balance verification
            # In real implementation, this would check account balance
            sufficient_balance = amount < 100000  # Simple rule: approve if < $100k
            return {
                'sufficientBalance': sufficient_balance,
                'reason': 'Insufficient funds' if not sufficient_balance else 'Sufficient balance'
            }
        
        elif operation == 'compliance_check':
            # Simulate compliance screening
            requires_review = amount > 10000  # Transactions > $10k need human review
            return {
                'requiresHumanReview': requires_review,
                'compliancePassed': True,
                'reason': 'Requires manual review' if requires_review else 'Auto-approved'
            }
        
        elif operation == 'request_human_approval':
            # In real implementation, this would trigger a human approval workflow
            # For demo purposes, we'll simulate approval based on amount
            task_token = event.get('taskToken')
            
            # Simulate human approval logic
            # In production, this would integrate with an approval system
            approved = amount < 75000  # Auto-approve transactions < $75k for demo
            
            # Send task success back to Step Functions
            if task_token:
                if approved:
                    stepfunctions.send_task_success(
                        taskToken=task_token,
                        output=json.dumps({'approved': True, 'reviewer': 'system-auto'})
                    )
                else:
                    stepfunctions.send_task_failure(
                        taskToken=task_token,
                        error='ApprovalRejected',
                        cause='Transaction amount exceeds auto-approval threshold'
                    )
            
            return {
                'approved': approved,
                'reviewer': 'system-auto'
            }
        
        else:
            raise ValueError(f"Unknown operation: {operation}")
    
    except Exception as e:
        print(f"Error in operation {operation}: {str(e)}")
        raise e
```