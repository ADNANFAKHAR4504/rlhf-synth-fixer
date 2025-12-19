"""
tap_stack.py

Main Pulumi stack for serverless transaction processing system.
Corrected implementation with all AWS services properly configured.
"""

from typing import Optional
import json

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions, Output


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Serverless transaction processing system with API Gateway, Lambda, DynamoDB, SQS, and SNS.
    Includes WAF, VPC endpoints, X-Ray tracing, and comprehensive monitoring.
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

        # Create KMS key for encryption
        kms_key = aws.kms.Key(
            f"transaction-key-{self.environment_suffix}",
            description="KMS key for transaction processing encryption",
            deletion_window_in_days=7,
            enable_key_rotation=True,  # Enable automatic key rotation
            opts=ResourceOptions(parent=self)
        )

        kms_key_alias = aws.kms.Alias(
            f"transaction-key-alias-{self.environment_suffix}",
            name=f"alias/transaction-key-{self.environment_suffix}",
            target_key_id=kms_key.id,
            opts=ResourceOptions(parent=self)
        )

        # Create VPC
        vpc = aws.ec2.Vpc(
            f"transaction-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"transaction-vpc-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create private subnets in 3 AZs
        private_subnets = []
        azs = ["us-east-2a", "us-east-2b", "us-east-2c"]
        for i, az in enumerate(azs):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i}-{self.environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"private-subnet-{i}-{self.environment_suffix}",
                    "Type": "Private"
                },
                opts=ResourceOptions(parent=self)
            )
            private_subnets.append(subnet)

        # Create route tables for private subnets (FIX #4)
        route_tables = []
        for i, subnet in enumerate(private_subnets):
            route_table = aws.ec2.RouteTable(
                f"private-rt-{i}-{self.environment_suffix}",
                vpc_id=vpc.id,
                tags={
                    "Name": f"private-rt-{i}-{self.environment_suffix}"
                },
                opts=ResourceOptions(parent=self)
            )
            route_tables.append(route_table)

            # Associate route table with subnet
            aws.ec2.RouteTableAssociation(
                f"private-rt-assoc-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Create security group for Lambda
        lambda_sg = aws.ec2.SecurityGroup(
            f"lambda-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for Lambda functions",
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound traffic"
            )],
            tags={
                "Name": f"lambda-sg-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create security group for VPC endpoints (FIX #17)
        vpc_endpoint_sg = aws.ec2.SecurityGroup(
            f"vpc-endpoint-sg-{self.environment_suffix}",
            vpc_id=vpc.id,
            description="Security group for VPC endpoints",
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                protocol="tcp",
                from_port=443,
                to_port=443,
                security_groups=[lambda_sg.id],
                description="Allow HTTPS from Lambda"
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                protocol="-1",
                from_port=0,
                to_port=0,
                cidr_blocks=["0.0.0.0/0"],
                description="Allow all outbound"
            )],
            tags={
                "Name": f"vpc-endpoint-sg-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create VPC endpoint for DynamoDB (Gateway endpoint) (FIX #3, #16)
        dynamodb_endpoint = aws.ec2.VpcEndpoint(
            f"dynamodb-endpoint-{self.environment_suffix}",
            vpc_id=vpc.id,
            service_name="com.amazonaws.us-east-2.dynamodb",
            vpc_endpoint_type="Gateway",
            route_table_ids=[rt.id for rt in route_tables],
            tags={
                "Name": f"dynamodb-endpoint-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create VPC endpoint for SQS (Interface endpoint) (FIX #2)
        sqs_endpoint = aws.ec2.VpcEndpoint(
            f"sqs-endpoint-{self.environment_suffix}",
            vpc_id=vpc.id,
            service_name="com.amazonaws.us-east-2.sqs",
            vpc_endpoint_type="Interface",
            subnet_ids=[s.id for s in private_subnets],
            security_group_ids=[vpc_endpoint_sg.id],
            private_dns_enabled=True,
            tags={
                "Name": f"sqs-endpoint-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create VPC endpoint for SNS (Interface endpoint) (FIX #2)
        sns_endpoint = aws.ec2.VpcEndpoint(
            f"sns-endpoint-{self.environment_suffix}",
            vpc_id=vpc.id,
            service_name="com.amazonaws.us-east-2.sns",
            vpc_endpoint_type="Interface",
            subnet_ids=[s.id for s in private_subnets],
            security_group_ids=[vpc_endpoint_sg.id],
            private_dns_enabled=True,
            tags={
                "Name": f"sns-endpoint-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create VPC endpoint for CloudWatch Logs (Interface endpoint) (FIX #2)
        logs_endpoint = aws.ec2.VpcEndpoint(
            f"logs-endpoint-{self.environment_suffix}",
            vpc_id=vpc.id,
            service_name="com.amazonaws.us-east-2.logs",
            vpc_endpoint_type="Interface",
            subnet_ids=[s.id for s in private_subnets],
            security_group_ids=[vpc_endpoint_sg.id],
            private_dns_enabled=True,
            tags={
                "Name": f"logs-endpoint-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create DynamoDB table for merchant configurations
        merchant_table = aws.dynamodb.Table(
            f"merchant-configs-{self.environment_suffix}",
            name=f"merchant-configs-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="merchant_id",
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="merchant_id", type="S")
            ],
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=kms_key.arn
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags={
                "Name": f"merchant-configs-{self.environment_suffix}",
                "Purpose": "Merchant configuration storage"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create DynamoDB table for transactions (FIX #13 - add GSI for merchant queries)
        transaction_table = aws.dynamodb.Table(
            f"transactions-{self.environment_suffix}",
            name=f"transactions-{self.environment_suffix}",
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(name="transaction_id", type="S"),
                aws.dynamodb.TableAttributeArgs(name="timestamp", type="N"),
                aws.dynamodb.TableAttributeArgs(name="merchant_id", type="S")
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="MerchantIndex",
                    hash_key="merchant_id",
                    range_key="timestamp",
                    projection_type="ALL"
                )
            ],
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=kms_key.arn
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags={
                "Name": f"transactions-{self.environment_suffix}",
                "Purpose": "Transaction storage with fraud analysis"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create DLQ for failed transactions
        dlq = aws.sqs.Queue(
            f"failed-transactions-dlq-{self.environment_suffix}",
            name=f"failed-transactions-dlq-{self.environment_suffix}",
            visibility_timeout_seconds=120,  # 2x Lambda timeout (60s) for safety
            message_retention_seconds=1209600,  # 14 days
            kms_master_key_id=kms_key.id,
            tags={
                "Name": f"failed-transactions-dlq-{self.environment_suffix}",
                "Purpose": "Dead letter queue for failed transactions"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create SQS queue for valid transactions
        transaction_queue = aws.sqs.Queue(
            f"valid-transactions-queue-{self.environment_suffix}",
            name=f"valid-transactions-queue-{self.environment_suffix}",
            visibility_timeout_seconds=300,
            message_retention_seconds=1209600,
            kms_master_key_id=kms_key.id,
            redrive_policy=dlq.arn.apply(lambda arn: json.dumps({
                "deadLetterTargetArn": arn,
                "maxReceiveCount": 3
            })),
            tags={
                "Name": f"valid-transactions-queue-{self.environment_suffix}",
                "Purpose": "Queue for validated transactions"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create SNS topic for fraud alerts
        fraud_topic = aws.sns.Topic(
            f"fraud-alerts-{self.environment_suffix}",
            name=f"fraud-alerts-{self.environment_suffix}",
            kms_master_key_id=kms_key.id,
            tags={
                "Name": f"fraud-alerts-{self.environment_suffix}",
                "Purpose": "Fraud detection alerts"
            },
            opts=ResourceOptions(parent=self)
        )

        # Add email subscription to fraud topic (FIX #8)
        # Note: This will require manual email confirmation
        fraud_email_subscription = aws.sns.TopicSubscription(
            f"fraud-alerts-email-{self.environment_suffix}",
            topic=fraud_topic.arn,
            protocol="email",
            endpoint="fraud-alerts@example.com",  # Replace with actual email
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for Lambda functions
        lambda_role = aws.iam.Role(
            f"lambda-execution-role-{self.environment_suffix}",
            name=f"lambda-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }]
            }),
            tags={
                "Name": f"lambda-execution-role-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach basic Lambda execution policy
        basic_policy = aws.iam.RolePolicyAttachment(
            f"lambda-basic-execution-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole",
            opts=ResourceOptions(parent=self)
        )

        # Attach X-Ray policy
        xray_policy = aws.iam.RolePolicyAttachment(
            f"lambda-xray-policy-{self.environment_suffix}",
            role=lambda_role.name,
            policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
            opts=ResourceOptions(parent=self)
        )

        # Create inline policy for DynamoDB, SQS, SNS, and DLQ access
        lambda_policy = aws.iam.RolePolicy(
            f"lambda-service-policy-{self.environment_suffix}",
            role=lambda_role.id,
            policy=pulumi.Output.all(
                merchant_table.arn,
                transaction_table.arn,
                transaction_queue.arn,
                dlq.arn,
                fraud_topic.arn,
                kms_key.arn
            ).apply(lambda arns: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:Query",
                            "dynamodb:Scan"
                        ],
                        "Resource": [
                            arns[0],
                            arns[1],
                            f"{arns[1]}/index/*"
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
                        "Resource": [arns[2], arns[3]]
                    },
                    {
                        "Effect": "Allow",
                        "Action": ["sns:Publish"],
                        "Resource": arns[4]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:Encrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": arns[5]
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch log groups
        validator_log_group = aws.cloudwatch.LogGroup(
            f"validator-logs-{self.environment_suffix}",
            name=f"/aws/lambda/transaction-validator-{self.environment_suffix}",
            retention_in_days=30,
            # KMS encryption removed - would require complex key policy for CloudWatch Logs
            tags={
                "Name": f"validator-logs-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        fraud_detector_log_group = aws.cloudwatch.LogGroup(
            f"fraud-detector-logs-{self.environment_suffix}",
            name=f"/aws/lambda/fraud-detector-{self.environment_suffix}",
            retention_in_days=30,
            # KMS encryption removed - would require complex key policy for CloudWatch Logs
            tags={
                "Name": f"fraud-detector-logs-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        failed_handler_log_group = aws.cloudwatch.LogGroup(
            f"failed-handler-logs-{self.environment_suffix}",
            name=f"/aws/lambda/failed-transaction-handler-{self.environment_suffix}",
            retention_in_days=30,
            # KMS encryption removed - would require complex key policy for CloudWatch Logs
            tags={
                "Name": f"failed-handler-logs-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Lambda Function 1: Transaction Validator
        validator_function = aws.lambda_.Function(
            f"transaction-validator-{self.environment_suffix}",
            name=f"transaction-validator-{self.environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=lambda_role.arn,
            memory_size=512,
            timeout=60,
            reserved_concurrent_executions=100,
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda/validator")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "MERCHANT_TABLE": merchant_table.name,
                    "TRANSACTION_QUEUE_URL": transaction_queue.url,
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[s.id for s in private_subnets],
                security_group_ids=[lambda_sg.id]
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            tags={
                "Name": f"transaction-validator-{self.environment_suffix}",
                "Component": "Transaction Processing"
            },
            opts=ResourceOptions(parent=self, depends_on=[validator_log_group, lambda_policy])
        )

        # Lambda Function 2: Fraud Detector (triggered by SQS)
        fraud_detector_function = aws.lambda_.Function(
            f"fraud-detector-{self.environment_suffix}",
            name=f"fraud-detector-{self.environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=lambda_role.arn,
            memory_size=512,
            timeout=60,
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda/fraud_detector")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TRANSACTION_TABLE": transaction_table.name,
                    "FRAUD_TOPIC_ARN": fraud_topic.arn,
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[s.id for s in private_subnets],
                security_group_ids=[lambda_sg.id]
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            tags={
                "Name": f"fraud-detector-{self.environment_suffix}",
                "Component": "Fraud Detection"
            },
            opts=ResourceOptions(parent=self, depends_on=[fraud_detector_log_group, lambda_policy])
        )

        # SQS event source mapping for fraud detector
        fraud_detector_event_source = aws.lambda_.EventSourceMapping(
            f"fraud-detector-sqs-trigger-{self.environment_suffix}",
            event_source_arn=transaction_queue.arn,
            function_name=fraud_detector_function.name,
            batch_size=10,
            opts=ResourceOptions(parent=self)
        )

        # Lambda Function 3: Failed Transaction Handler (triggered by DLQ)
        failed_handler_function = aws.lambda_.Function(
            f"failed-transaction-handler-{self.environment_suffix}",
            name=f"failed-transaction-handler-{self.environment_suffix}",
            runtime="python3.9",
            handler="index.handler",
            role=lambda_role.arn,
            memory_size=512,
            timeout=60,
            code=pulumi.AssetArchive({
                ".": pulumi.FileArchive("./lib/lambda/failed_handler")
            }),
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "TRANSACTION_TABLE": transaction_table.name,
                    "ENVIRONMENT_SUFFIX": self.environment_suffix
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=[s.id for s in private_subnets],
                security_group_ids=[lambda_sg.id]
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active"
            ),
            tags={
                "Name": f"failed-transaction-handler-{self.environment_suffix}",
                "Component": "Error Handling"
            },
            opts=ResourceOptions(parent=self, depends_on=[failed_handler_log_group, lambda_policy])
        )

        # DLQ event source mapping for failed handler
        failed_handler_event_source = aws.lambda_.EventSourceMapping(
            f"failed-handler-dlq-trigger-{self.environment_suffix}",
            event_source_arn=dlq.arn,
            function_name=failed_handler_function.name,
            batch_size=10,
            opts=ResourceOptions(parent=self)
        )

        # Create API Gateway REST API
        api = aws.apigateway.RestApi(
            f"transaction-api-{self.environment_suffix}",
            name=f"transaction-api-{self.environment_suffix}",
            description="Transaction processing API with WAF protection",
            tags={
                "Name": f"transaction-api-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create API Gateway resource for /transaction
        transaction_resource = aws.apigateway.Resource(
            f"transaction-resource-{self.environment_suffix}",
            rest_api=api.id,
            parent_id=api.root_resource_id,
            path_part="transaction",
            opts=ResourceOptions(parent=self)
        )

        # Create API Gateway method (POST)
        transaction_method = aws.apigateway.Method(
            f"transaction-post-method-{self.environment_suffix}",
            rest_api=api.id,
            resource_id=transaction_resource.id,
            http_method="POST",
            authorization="NONE",
            api_key_required=True,
            opts=ResourceOptions(parent=self)
        )

        # Create integration with Lambda
        transaction_integration = aws.apigateway.Integration(
            f"transaction-integration-{self.environment_suffix}",
            rest_api=api.id,
            resource_id=transaction_resource.id,
            http_method=transaction_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=validator_function.invoke_arn,
            opts=ResourceOptions(parent=self)
        )

        # Grant API Gateway permission to invoke Lambda
        lambda_permission = aws.lambda_.Permission(
            f"api-gateway-invoke-permission-{self.environment_suffix}",
            action="lambda:InvokeFunction",
            function=validator_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.all(api.execution_arn, transaction_resource.path).apply(
                lambda args: f"{args[0]}/*/*/*"
            ),
            opts=ResourceOptions(parent=self)
        )

        # Deploy API Gateway
        deployment = aws.apigateway.Deployment(
            f"api-deployment-{self.environment_suffix}",
            rest_api=api.id,
            opts=ResourceOptions(parent=self, depends_on=[transaction_integration])
        )

        # Create API Gateway access logs (FIX #19)
        api_access_log_group = aws.cloudwatch.LogGroup(
            f"api-access-logs-{self.environment_suffix}",
            name=f"/aws/apigateway/transaction-api-{self.environment_suffix}",
            retention_in_days=30,
            tags={
                "Name": f"api-access-logs-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for API Gateway logging
        api_gateway_log_role = aws.iam.Role(
            f"api-gateway-log-role-{self.environment_suffix}",
            name=f"api-gateway-log-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "apigateway.amazonaws.com"
                    }
                }]
            }),
            tags={
                "Name": f"api-gateway-log-role-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach CloudWatch Logs policy to API Gateway role
        api_gateway_log_policy = aws.iam.RolePolicyAttachment(
            f"api-gateway-log-policy-{self.environment_suffix}",
            role=api_gateway_log_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
            opts=ResourceOptions(parent=self)
        )

        # Create explicit API Gateway stage with X-Ray and access logs (FIX #9, #18, #10)
        api_stage = aws.apigateway.Stage(
            f"api-stage-{self.environment_suffix}",
            rest_api=api.id,
            deployment=deployment.id,
            stage_name="api",
            xray_tracing_enabled=True,
            access_log_settings=aws.apigateway.StageAccessLogSettingsArgs(
                destination_arn=api_access_log_group.arn,
                format='$context.requestId $context.error.message $context.error.messageString'
            ),
            tags={
                "Name": f"api-stage-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self, depends_on=[api_access_log_group])
        )

        # Create API key
        api_key = aws.apigateway.ApiKey(
            f"transaction-api-key-{self.environment_suffix}",
            name=f"transaction-api-key-{self.environment_suffix}",
            tags={
                "Name": f"transaction-api-key-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Create usage plan
        usage_plan = aws.apigateway.UsagePlan(
            f"transaction-usage-plan-{self.environment_suffix}",
            name=f"transaction-usage-plan-{self.environment_suffix}",
            api_stages=[aws.apigateway.UsagePlanApiStageArgs(
                api_id=api.id,
                stage=api_stage.stage_name
            )],
            tags={
                "Name": f"transaction-usage-plan-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate API key with usage plan
        usage_plan_key = aws.apigateway.UsagePlanKey(
            f"usage-plan-key-{self.environment_suffix}",
            key_id=api_key.id,
            key_type="API_KEY",
            usage_plan_id=usage_plan.id,
            opts=ResourceOptions(parent=self)
        )

        # Create WAF WebACL for API Gateway (FIX #1)
        waf_web_acl = aws.wafv2.WebAcl(
            f"transaction-api-waf-{self.environment_suffix}",
            name=f"transaction-api-waf-{self.environment_suffix}",
            scope="REGIONAL",
            default_action=aws.wafv2.WebAclDefaultActionArgs(
                allow={}
            ),
            rules=[
                # AWS Managed Rules - Common Rule Set
                aws.wafv2.WebAclRuleArgs(
                    name="AWS-AWSManagedRulesCommonRuleSet",
                    priority=1,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(
                        none={}
                    ),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            vendor_name="AWS",
                            name="AWSManagedRulesCommonRuleSet"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesCommonRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                ),
                # AWS Managed Rules - Known Bad Inputs
                aws.wafv2.WebAclRuleArgs(
                    name="AWS-AWSManagedRulesKnownBadInputsRuleSet",
                    priority=2,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(
                        none={}
                    ),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            vendor_name="AWS",
                            name="AWSManagedRulesKnownBadInputsRuleSet"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesKnownBadInputsRuleSetMetric",
                        sampled_requests_enabled=True
                    )
                ),
                # Rate limiting rule
                aws.wafv2.WebAclRuleArgs(
                    name="RateLimitRule",
                    priority=3,
                    action=aws.wafv2.WebAclRuleActionArgs(
                        block={}
                    ),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        rate_based_statement=aws.wafv2.WebAclRuleStatementRateBasedStatementArgs(
                            limit=2000,
                            aggregate_key_type="IP"
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="RateLimitRuleMetric",
                        sampled_requests_enabled=True
                    )
                )
            ],
            visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name=f"transaction-api-waf-{self.environment_suffix}",
                sampled_requests_enabled=True
            ),
            tags={
                "Name": f"transaction-api-waf-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate WAF with API Gateway stage
        waf_association = aws.wafv2.WebAclAssociation(
            f"api-waf-association-{self.environment_suffix}",
            resource_arn=api_stage.arn,
            web_acl_arn=waf_web_acl.arn,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch dashboard (FIX #5 - add function-specific dimensions)
        dashboard = aws.cloudwatch.Dashboard(
            f"transaction-dashboard-{self.environment_suffix}",
            dashboard_name=f"transaction-dashboard-{self.environment_suffix}",
            dashboard_body=pulumi.Output.all(
                validator_function.name,
                fraud_detector_function.name,
                failed_handler_function.name
            ).apply(lambda names: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", "FunctionName", names[0], {"stat": "Sum", "label": "Validator"}],
                                [".", ".", ".", names[1], {"stat": "Sum", "label": "Fraud Detector"}],
                                [".", ".", ".", names[2], {"stat": "Sum", "label": "Failed Handler"}]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": "us-east-2",
                            "title": "Lambda Invocations",
                            "yAxis": {
                                "left": {
                                    "label": "Count"
                                }
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "x": 12,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Errors", "FunctionName", names[0], {"stat": "Sum", "label": "Validator", "color": "#d62728"}],
                                [".", ".", ".", names[1], {"stat": "Sum", "label": "Fraud Detector", "color": "#ff7f0e"}],
                                [".", ".", ".", names[2], {"stat": "Sum", "label": "Failed Handler", "color": "#e377c2"}]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": "us-east-2",
                            "title": "Lambda Errors",
                            "yAxis": {
                                "left": {
                                    "label": "Count"
                                }
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 6,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Duration", "FunctionName", names[0], {"stat": "Average", "label": "Validator"}],
                                [".", ".", ".", names[1], {"stat": "Average", "label": "Fraud Detector"}],
                                [".", ".", ".", names[2], {"stat": "Average", "label": "Failed Handler"}]
                            ],
                            "period": 300,
                            "stat": "Average",
                            "region": "us-east-2",
                            "title": "Lambda Duration (ms)",
                            "yAxis": {
                                "left": {
                                    "label": "Milliseconds"
                                }
                            }
                        }
                    },
                    {
                        "type": "metric",
                        "x": 12,
                        "y": 6,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/SQS", "NumberOfMessagesSent", "QueueName", f"valid-transactions-queue-{self.environment_suffix}"],
                                [".", "NumberOfMessagesReceived", ".", "."],
                                [".", "ApproximateNumberOfMessagesVisible", ".", "."]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": "us-east-2",
                            "title": "SQS Queue Metrics"
                        }
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch alarms for all Lambda functions (FIX #6, #7)
        # Validator error alarm with proper error rate calculation
        validator_alarm = aws.cloudwatch.MetricAlarm(
            f"validator-error-alarm-{self.environment_suffix}",
            name=f"validator-error-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=1.0,
            alarm_description="Validator Lambda error rate exceeds 1%",
            treat_missing_data="notBreaching",
            metric_queries=[
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="e1",
                    expression="(m2/m1)*100",
                    label="Error Rate",
                    return_data=True
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="m1",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Invocations",
                        namespace="AWS/Lambda",
                        period=300,
                        stat="Sum",
                        dimensions={
                            "FunctionName": validator_function.name
                        }
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="m2",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Errors",
                        namespace="AWS/Lambda",
                        period=300,
                        stat="Sum",
                        dimensions={
                            "FunctionName": validator_function.name
                        }
                    ),
                    return_data=False
                )
            ],
            tags={
                "Name": f"validator-error-alarm-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Fraud detector error alarm
        fraud_detector_alarm = aws.cloudwatch.MetricAlarm(
            f"fraud-detector-error-alarm-{self.environment_suffix}",
            name=f"fraud-detector-error-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=1.0,
            alarm_description="Fraud detector Lambda error rate exceeds 1%",
            treat_missing_data="notBreaching",
            metric_queries=[
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="e1",
                    expression="(m2/m1)*100",
                    label="Error Rate",
                    return_data=True
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="m1",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Invocations",
                        namespace="AWS/Lambda",
                        period=300,
                        stat="Sum",
                        dimensions={
                            "FunctionName": fraud_detector_function.name
                        }
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="m2",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Errors",
                        namespace="AWS/Lambda",
                        period=300,
                        stat="Sum",
                        dimensions={
                            "FunctionName": fraud_detector_function.name
                        }
                    ),
                    return_data=False
                )
            ],
            tags={
                "Name": f"fraud-detector-error-alarm-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Failed handler error alarm
        failed_handler_alarm = aws.cloudwatch.MetricAlarm(
            f"failed-handler-error-alarm-{self.environment_suffix}",
            name=f"failed-handler-error-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=1.0,
            alarm_description="Failed handler Lambda error rate exceeds 1%",
            treat_missing_data="notBreaching",
            metric_queries=[
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="e1",
                    expression="(m2/m1)*100",
                    label="Error Rate",
                    return_data=True
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="m1",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Invocations",
                        namespace="AWS/Lambda",
                        period=300,
                        stat="Sum",
                        dimensions={
                            "FunctionName": failed_handler_function.name
                        }
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="m2",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Errors",
                        namespace="AWS/Lambda",
                        period=300,
                        stat="Sum",
                        dimensions={
                            "FunctionName": failed_handler_function.name
                        }
                    ),
                    return_data=False
                )
            ],
            tags={
                "Name": f"failed-handler-error-alarm-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        # Export outputs (FIX #11 - remove duplication)
        pulumi.export("api_endpoint", pulumi.Output.concat(
            "https://",
            api.id,
            ".execute-api.us-east-2.amazonaws.com/api/transaction"
        ))
        pulumi.export("dashboard_url", pulumi.Output.concat(
            "https://console.aws.amazon.com/cloudwatch/home?region=us-east-2#dashboards:name=",
            dashboard.dashboard_name
        ))
        pulumi.export("api_key_id", api_key.id)
        # Add alternative names for compatibility
        pulumi.export("merchant_table_name", merchant_table.name)
        pulumi.export("merchant_configs_table", merchant_table.name)  # Alternative name
        pulumi.export("transaction_table_name", transaction_table.name)
        pulumi.export("transactions_table", transaction_table.name)  # Alternative name
        pulumi.export("transaction_queue_url", transaction_queue.url)
        pulumi.export("queue_url", transaction_queue.url)  # Alternative name
        pulumi.export("fraud_topic_arn", fraud_topic.arn)
        pulumi.export("topic_arn", fraud_topic.arn)  # Alternative name
        pulumi.export("waf_web_acl_arn", waf_web_acl.arn)
        pulumi.export("waf_arn", waf_web_acl.arn)  # Alternative name
        pulumi.export("vpc_id", vpc.id)
        pulumi.export("kms_key_id", kms_key.id)
        # Export environment suffix for test compatibility
        pulumi.export("environment_suffix", self.environment_suffix)

        self.register_outputs({})
