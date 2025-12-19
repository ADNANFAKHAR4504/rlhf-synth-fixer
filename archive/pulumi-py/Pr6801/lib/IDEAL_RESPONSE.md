# IDEAL_RESPONSE.md - Corrected Pulumi Python Implementation

This document contains the corrected implementation addressing all 22 issues identified in MODEL_FAILURES.md.

## File: lib/tap_stack.py

```python
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
            tags={
                "Name": f"validator-logs-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        fraud_detector_log_group = aws.cloudwatch.LogGroup(
            f"fraud-detector-logs-{self.environment_suffix}",
            name=f"/aws/lambda/fraud-detector-{self.environment_suffix}",
            retention_in_days=30,
            tags={
                "Name": f"fraud-detector-logs-{self.environment_suffix}"
            },
            opts=ResourceOptions(parent=self)
        )

        failed_handler_log_group = aws.cloudwatch.LogGroup(
            f"failed-handler-logs-{self.environment_suffix}",
            name=f"/aws/lambda/failed-transaction-handler-{self.environment_suffix}",
            retention_in_days=30,
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
                                ["AWS/Lambda", "Invocations", {"stat": "Sum", "label": "Validator"}, {"dimensions": {"FunctionName": names[0]}}],
                                ["...", {"stat": "Sum", "label": "Fraud Detector"}, {"dimensions": {"FunctionName": names[1]}}],
                                ["...", {"stat": "Sum", "label": "Failed Handler"}, {"dimensions": {"FunctionName": names[2]}}]
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
                                ["AWS/Lambda", "Errors", {"stat": "Sum", "label": "Validator", "color": "#d62728"}, {"dimensions": {"FunctionName": names[0]}}],
                                ["...", {"stat": "Sum", "label": "Fraud Detector", "color": "#ff7f0e"}, {"dimensions": {"FunctionName": names[1]}}],
                                ["...", {"stat": "Sum", "label": "Failed Handler", "color": "#e377c2"}, {"dimensions": {"FunctionName": names[2]}}]
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
                                ["AWS/Lambda", "Duration", {"stat": "Average", "label": "Validator"}, {"dimensions": {"FunctionName": names[0]}}],
                                ["...", {"stat": "Average", "label": "Fraud Detector"}, {"dimensions": {"FunctionName": names[1]}}],
                                ["...", {"stat": "Average", "label": "Failed Handler"}, {"dimensions": {"FunctionName": names[2]}}]
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
                                ["AWS/SQS", "NumberOfMessagesSent", {"dimensions": {"QueueName": f"valid-transactions-queue-{self.environment_suffix}"}}],
                                [".", "NumberOfMessagesReceived", {"dimensions": {"QueueName": f"valid-transactions-queue-{self.environment_suffix}"}}],
                                [".", "ApproximateNumberOfMessagesVisible", {"dimensions": {"QueueName": f"valid-transactions-queue-{self.environment_suffix}"}}]
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
            metrics=[
                aws.cloudwatch.MetricAlarmMetricArgs(
                    id="e1",
                    expression="(m2/m1)*100",
                    label="Error Rate",
                    return_data=True
                ),
                aws.cloudwatch.MetricAlarmMetricArgs(
                    id="m1",
                    metric=aws.cloudwatch.MetricAlarmMetricMetricArgs(
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
                aws.cloudwatch.MetricAlarmMetricArgs(
                    id="m2",
                    metric=aws.cloudwatch.MetricAlarmMetricMetricArgs(
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
            metrics=[
                aws.cloudwatch.MetricAlarmMetricArgs(
                    id="e1",
                    expression="(m2/m1)*100",
                    label="Error Rate",
                    return_data=True
                ),
                aws.cloudwatch.MetricAlarmMetricArgs(
                    id="m1",
                    metric=aws.cloudwatch.MetricAlarmMetricMetricArgs(
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
                aws.cloudwatch.MetricAlarmMetricArgs(
                    id="m2",
                    metric=aws.cloudwatch.MetricAlarmMetricMetricArgs(
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
            metrics=[
                aws.cloudwatch.MetricAlarmMetricArgs(
                    id="e1",
                    expression="(m2/m1)*100",
                    label="Error Rate",
                    return_data=True
                ),
                aws.cloudwatch.MetricAlarmMetricArgs(
                    id="m1",
                    metric=aws.cloudwatch.MetricAlarmMetricMetricArgs(
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
                aws.cloudwatch.MetricAlarmMetricArgs(
                    id="m2",
                    metric=aws.cloudwatch.MetricAlarmMetricMetricArgs(
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
        pulumi.export("merchant_table_name", merchant_table.name)
        pulumi.export("transaction_table_name", transaction_table.name)
        pulumi.export("transaction_queue_url", transaction_queue.url)
        pulumi.export("fraud_topic_arn", fraud_topic.arn)
        pulumi.export("waf_web_acl_arn", waf_web_acl.arn)
        pulumi.export("vpc_id", vpc.id)
        pulumi.export("kms_key_id", kms_key.id)

        self.register_outputs({})
```

## File: lib/lambda/validator/index.py

```python
import json
import os
import boto3
from datetime import datetime

# X-Ray instrumentation (FIX #12)
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all
patch_all()

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

MERCHANT_TABLE = os.environ['MERCHANT_TABLE']
TRANSACTION_QUEUE_URL = os.environ['TRANSACTION_QUEUE_URL']

merchant_table = dynamodb.Table(MERCHANT_TABLE)


def handler(event, context):
    """
    Validates incoming transactions against merchant configurations.
    Enhanced with X-Ray tracing and better error handling.
    """
    try:
        body = json.loads(event['body'])

        merchant_id = body.get('merchant_id')
        transaction_id = body.get('transaction_id')
        amount = body.get('amount')

        # Validate required fields
        if not all([merchant_id, transaction_id, amount]):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Missing required fields: merchant_id, transaction_id, amount'})
            }

        # Validate amount is numeric
        try:
            amount_float = float(amount)
            if amount_float <= 0:
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json'
                    },
                    'body': json.dumps({'error': 'Amount must be greater than zero'})
                }
        except ValueError:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Invalid amount format'})
            }

        # Check merchant configuration with X-Ray subsegment
        with xray_recorder.capture('get_merchant_config'):
            response = merchant_table.get_item(Key={'merchant_id': merchant_id})

        if 'Item' not in response:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({'error': 'Merchant not found'})
            }

        merchant = response['Item']

        # Validate transaction amount against merchant limits
        max_amount = float(merchant.get('max_transaction_amount', 10000))
        if amount_float > max_amount:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json'
                },
                'body': json.dumps({
                    'error': 'Transaction amount exceeds merchant limit',
                    'max_allowed': max_amount
                })
            }

        # Send valid transaction to SQS with X-Ray subsegment
        message = {
            'transaction_id': transaction_id,
            'merchant_id': merchant_id,
            'amount': amount_float,
            'timestamp': datetime.utcnow().isoformat(),
            'status': 'validated'
        }

        with xray_recorder.capture('send_to_sqs'):
            sqs.send_message(
                QueueUrl=TRANSACTION_QUEUE_URL,
                MessageBody=json.dumps(message)
            )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({
                'message': 'Transaction validated successfully',
                'transaction_id': transaction_id,
                'status': 'validated'
            })
        }

    except Exception as e:
        print(f"Error processing transaction: {str(e)}")
        xray_recorder.current_subsegment().put_annotation('error', str(e))
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
```

## File: lib/lambda/validator/requirements.txt

```txt
aws-xray-sdk==2.12.0
```

## File: lib/lambda/fraud_detector/index.py

```python
import json
import os
import boto3
from datetime import datetime, timedelta
from decimal import Decimal

# X-Ray instrumentation (FIX #12)
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all
patch_all()

dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

TRANSACTION_TABLE = os.environ['TRANSACTION_TABLE']
FRAUD_TOPIC_ARN = os.environ['FRAUD_TOPIC_ARN']

transaction_table = dynamodb.Table(TRANSACTION_TABLE)


def handler(event, context):
    """
    Processes transactions from SQS and performs fraud detection.
    Enhanced with improved fraud detection logic using GSI. (FIX #13)
    """
    try:
        for record in event['Records']:
            message = json.loads(record['body'])

            transaction_id = message['transaction_id']
            merchant_id = message['merchant_id']
            amount = Decimal(str(message['amount']))
            timestamp = int(datetime.utcnow().timestamp())

            # Simple fraud detection logic
            is_fraud = False
            fraud_score = 0
            fraud_reasons = []

            # Check for high amount transactions
            if amount > Decimal('5000'):
                fraud_score += 30
                fraud_reasons.append('High transaction amount')

            # Check for very high amount transactions
            if amount > Decimal('10000'):
                fraud_score += 30
                fraud_reasons.append('Very high transaction amount')

            # Check for rapid transactions from same merchant (FIX #13)
            # Use GSI to query by merchant_id
            with xray_recorder.capture('query_merchant_transactions'):
                one_hour_ago = timestamp - 3600
                response = transaction_table.query(
                    IndexName='MerchantIndex',
                    KeyConditionExpression='merchant_id = :mid AND #ts > :time',
                    ExpressionAttributeNames={
                        '#ts': 'timestamp'
                    },
                    ExpressionAttributeValues={
                        ':mid': merchant_id,
                        ':time': one_hour_ago
                    },
                    Limit=20
                )

            # Check if there are too many transactions in the last hour
            recent_transaction_count = response.get('Count', 0)
            if recent_transaction_count > 10:
                fraud_score += 40
                fraud_reasons.append(f'High frequency: {recent_transaction_count} transactions in last hour')

            # Calculate total amount in last hour
            total_amount = sum(Decimal(str(item.get('amount', 0))) for item in response.get('Items', []))
            if total_amount > Decimal('20000'):
                fraud_score += 20
                fraud_reasons.append(f'High volume: ${total_amount} in last hour')

            # Determine if fraud
            if fraud_score >= 50:
                is_fraud = True

            # Store transaction in DynamoDB with X-Ray subsegment
            with xray_recorder.capture('store_transaction'):
                transaction_table.put_item(
                    Item={
                        'transaction_id': transaction_id,
                        'timestamp': timestamp,
                        'merchant_id': merchant_id,
                        'amount': amount,
                        'is_fraud': is_fraud,
                        'fraud_score': fraud_score,
                        'fraud_reasons': fraud_reasons if is_fraud else [],
                        'status': 'fraud_detected' if is_fraud else 'processed',
                        'processed_at': datetime.utcnow().isoformat()
                    }
                )

            # Send fraud alert if detected
            if is_fraud:
                with xray_recorder.capture('send_fraud_alert'):
                    sns.publish(
                        TopicArn=FRAUD_TOPIC_ARN,
                        Subject=f'Fraud Alert - Transaction {transaction_id}',
                        Message=json.dumps({
                            'transaction_id': transaction_id,
                            'merchant_id': merchant_id,
                            'amount': str(amount),
                            'fraud_score': fraud_score,
                            'fraud_reasons': fraud_reasons,
                            'timestamp': timestamp,
                            'detected_at': datetime.utcnow().isoformat()
                        }, indent=2)
                    )
                print(f"FRAUD DETECTED: Transaction {transaction_id}, Score: {fraud_score}")

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Transactions processed successfully'})
        }

    except Exception as e:
        print(f"Error in fraud detection: {str(e)}")
        xray_recorder.current_subsegment().put_annotation('error', str(e))
        raise
```

## File: lib/lambda/fraud_detector/requirements.txt

```txt
aws-xray-sdk==2.12.0
```

## File: lib/lambda/failed_handler/index.py

```python
import json
import os
import boto3
from datetime import datetime

# X-Ray instrumentation (FIX #12)
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all
patch_all()

dynamodb = boto3.resource('dynamodb')

TRANSACTION_TABLE = os.environ['TRANSACTION_TABLE']

transaction_table = dynamodb.Table(TRANSACTION_TABLE)


def handler(event, context):
    """
    Handles failed transactions from DLQ.
    Enhanced with X-Ray tracing and better error handling. (FIX #15)
    """
    try:
        failed_count = 0
        for record in event['Records']:
            try:
                message = json.loads(record['body'])

                transaction_id = message.get('transaction_id', 'unknown')
                timestamp = int(datetime.utcnow().timestamp())

                # Extract additional metadata
                approximate_receive_count = record.get('attributes', {}).get('ApproximateReceiveCount', 'unknown')

                # Log failed transaction with X-Ray subsegment
                with xray_recorder.capture('log_failed_transaction'):
                    transaction_table.put_item(
                        Item={
                            'transaction_id': f"failed-{transaction_id}",
                            'timestamp': timestamp,
                            'merchant_id': message.get('merchant_id', 'unknown'),
                            'amount': message.get('amount', 0),
                            'original_message': json.dumps(message),
                            'status': 'failed',
                            'failure_reason': 'Max retries exceeded',
                            'retry_count': approximate_receive_count,
                            'failed_at': datetime.utcnow().isoformat()
                        }
                    )

                print(f"Logged failed transaction: {transaction_id} (retries: {approximate_receive_count})")
                failed_count += 1

            except Exception as item_error:
                print(f"Error processing individual DLQ record: {str(item_error)}")
                # Continue processing other records
                continue

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Failed transactions logged',
                'count': failed_count
            })
        }

    except Exception as e:
        print(f"Error handling failed transaction: {str(e)}")
        xray_recorder.current_subsegment().put_annotation('error', str(e))
        raise
```

## File: lib/lambda/failed_handler/requirements.txt

```txt
aws-xray-sdk==2.12.0
```

## File: lib/README.md

```markdown
# Serverless Transaction Processing System

A comprehensive serverless architecture for processing financial transactions with fraud detection capabilities, WAF protection, and full observability.

## Architecture Overview

This system implements a fully serverless transaction processing pipeline with the following components:

### Core Services
- **API Gateway**: REST API with `/transaction` POST endpoint
  - Protected by API key authentication
  - Integrated with AWS WAF for security
  - X-Ray tracing enabled
  - Access logging to CloudWatch
- **Lambda Functions** (all deployed in VPC with X-Ray tracing):
  - **Transaction Validator**: Validates transactions against merchant configurations (512MB, 60s timeout, 100 reserved concurrency)
  - **Fraud Detector**: Performs fraud detection using pattern analysis (512MB, 60s timeout)
  - **Failed Transaction Handler**: Processes failed transactions from DLQ (512MB, 60s timeout)
- **DynamoDB Tables**:
  - **Merchant Configurations**: Stores merchant settings and limits
  - **Transactions**: Stores processed transactions with fraud analysis (includes GSI for merchant queries)
- **SQS Queues**:
  - Valid Transactions Queue (300s visibility timeout, 14-day retention)
  - Dead Letter Queue (14-day retention)
- **SNS Topic**: Fraud detection alerts with email subscription
- **CloudWatch**: Comprehensive monitoring, logging, and alerting
- **AWS WAF**: WebACL with managed rule sets protecting API Gateway
- **VPC Infrastructure**: Private subnets across 3 AZs with VPC endpoints (no NAT gateway)
- **KMS**: Customer-managed keys for all data at rest encryption

## Prerequisites

- Pulumi CLI 3.x or later
- Python 3.9 or later
- AWS CLI configured with appropriate credentials
- AWS account with permissions to create the required resources

## Deployment

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set environment variables:
```bash
export ENVIRONMENT_SUFFIX="your-unique-suffix"
export AWS_REGION="us-east-2"
```

3. Deploy the stack:
```bash
pulumi up
```

4. Note the outputs:
   - `api_endpoint`: Use this endpoint for API requests
   - `api_key_id`: Retrieve API key value for authentication
   - `dashboard_url`: Access CloudWatch dashboard

## Configuration

The stack uses the following configuration values:

- `environmentSuffix`: Unique suffix for resource naming (required)
- `region`: AWS region for deployment (default: us-east-2)

## API Usage

### Submit Transaction

```bash
# Get API key value
aws apigateway get-api-key --api-key <api_key_id> --include-value

# Submit transaction
curl -X POST https://<api_id>.execute-api.us-east-2.amazonaws.com/api/transaction \
  -H "x-api-key: <api_key_value>" \
  -H "Content-Type: application/json" \
  -d '{
    "merchant_id": "merchant123",
    "transaction_id": "txn456",
    "amount": "150.00"
  }'
```

### Sample Transaction Format

```json
{
  "merchant_id": "string (required)",
  "transaction_id": "string (required, unique)",
  "amount": "number (required, positive)"
}
```

## Testing

Run the test suite:
```bash
pytest tests/
```

## Fraud Detection Logic

The system performs multi-factor fraud detection:

1. **High Amount Check**: Transactions over $5,000 get +30 points, over $10,000 get +60 points
2. **Frequency Check**: More than 10 transactions per merchant in 1 hour gets +40 points
3. **Volume Check**: Total transaction volume over $20,000 in 1 hour gets +20 points
4. **Threshold**: Fraud score >= 50 triggers fraud alert

## Monitoring

### CloudWatch Dashboard

Access the dashboard URL from stack outputs to view:
- Lambda invocations by function
- Error rates by function
- Function durations
- SQS queue metrics

### CloudWatch Alarms

Three alarms monitor Lambda error rates:
- Validator error alarm: Triggers if error rate exceeds 1%
- Fraud detector error alarm: Triggers if error rate exceeds 1%
- Failed handler error alarm: Triggers if error rate exceeds 1%

### X-Ray Tracing

All components have X-Ray tracing enabled:
- View distributed traces in AWS X-Ray console
- Track requests from API Gateway through all Lambda functions
- Monitor downstream service calls (DynamoDB, SQS, SNS)

## Security

- **VPC Isolation**: All Lambda functions run in private subnets
- **VPC Endpoints**: Interface endpoints for AWS services (no internet routing)
- **KMS Encryption**: All data at rest encrypted with customer-managed keys
- **API Protection**: AWS WAF with managed rule sets and rate limiting
- **API Authentication**: API key required for all requests
- **X-Ray Tracing**: Full observability of request flows
- **Least-Privilege IAM**: IAM roles follow principle of least privilege

## Network Architecture

```
API Gateway (WAF Protected)
    ↓
Lambda Validator (VPC Private Subnet)
    ↓ (via VPC Endpoint)
DynamoDB (Merchant Table) + SQS (Transaction Queue)
    ↓
Lambda Fraud Detector (VPC Private Subnet)
    ↓ (via VPC Endpoint)
DynamoDB (Transaction Table) + SNS (Fraud Alerts)
```

## Troubleshooting

### Lambda Functions Not Connecting

- Verify VPC endpoints are properly configured
- Check security group rules allow HTTPS (443) traffic
- Ensure private subnets have route tables associated

### API Gateway 403 Errors

- Verify API key is included in `x-api-key` header
- Check WAF rules aren't blocking legitimate requests
- Review API Gateway access logs

### Fraud Detection Not Working

- Verify SNS email subscription is confirmed
- Check CloudWatch logs for Lambda errors
- Review X-Ray traces for failed service calls

## Cost Optimization

This architecture is optimized for cost:
- Serverless (Lambda, API Gateway) - pay per use
- DynamoDB on-demand billing
- No NAT Gateway (using VPC endpoints)
- CloudWatch log retention limited to 30 days

## Cleanup

To destroy all resources:
```bash
pulumi destroy
```

Note: Confirm the destruction when prompted.

## Architecture Compliance

This implementation meets all requirements:
- ✓ API Gateway REST API with API key authentication
- ✓ AWS WAF integration with managed rule sets
- ✓ Three Lambda functions with correct specifications
- ✓ VPC deployment with private subnets across 3 AZs
- ✓ VPC endpoints for all AWS services
- ✓ Two DynamoDB tables with PITR and KMS encryption
- ✓ SQS queue with DLQ (14-day retention)
- ✓ SNS topic with email subscription
- ✓ CloudWatch Logs (30-day retention)
- ✓ CloudWatch Dashboard with function-specific metrics
- ✓ CloudWatch Alarms for all Lambda functions (1% error rate)
- ✓ X-Ray tracing for all Lambda functions and API Gateway
- ✓ KMS customer-managed keys for all data at rest
```

## File: requirements.txt

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
boto3>=1.26.0
```
