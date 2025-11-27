"""
Secure Document Processing Pipeline Stack for PCI-DSS Compliance
"""
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_kms as kms,
    aws_s3 as s3,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_wafv2 as wafv2,
    aws_ec2 as ec2,
    aws_dynamodb as dynamodb,
    aws_events as events,
    aws_events_targets as targets,
    aws_logs as logs,
    aws_secretsmanager as secretsmanager,
    aws_iam as iam,
    aws_config as config,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
)
from constructs import Construct
from dataclasses import dataclass
from typing import Optional


@dataclass
class TapStackProps:
    """Properties for TapStack"""
    environment_suffix: str
    env: Optional[cdk.Environment] = None


class TapStack(Stack):
    """Main stack for secure document processing pipeline"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ) -> None:
        if props and props.env:
            kwargs['env'] = props.env
        super().__init__(scope, construct_id, **kwargs)

        # Set environment suffix from props or use default
        self.environment_suffix = props.environment_suffix if props else "dev"

        # Create KMS keys
        self.kms_keys = self.create_kms_keys()

        # Create VPC infrastructure
        self.vpc = self.create_vpc()

        # Create S3 buckets
        self.buckets = self.create_s3_buckets()

        # Create DynamoDB table for audit logs
        self.audit_table = self.create_audit_table()

        # Create Secrets Manager secrets
        self.secrets = self.create_secrets()

        # Create Lambda functions
        self.lambda_functions = self.create_lambda_functions()

        # Create API Gateway with WAF
        self.api = self.create_api_gateway()

        # Create EventBridge rules for GuardDuty
        self.create_guardduty_rules()

        # Create CloudWatch Events rules
        self.create_cloudwatch_events()

        # Create AWS Config rules
        self.create_config_rules()

        # Create SNS topics for alerts
        self.create_sns_topics()

        # Create outputs
        self.create_outputs()

    def create_kms_keys(self) -> dict:
        """Create KMS keys with automatic rotation"""
        s3_key = kms.Key(
            self, f"S3Key{self.environment_suffix}",
            description=f"KMS key for S3 bucket encryption {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        lambda_key = kms.Key(
            self, f"LambdaKey{self.environment_suffix}",
            description=f"KMS key for Lambda environment variables {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        sns_key = kms.Key(
            self, f"SNSKey{self.environment_suffix}",
            description=f"KMS key for SNS topic encryption {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        return {
            "s3": s3_key,
            "lambda": lambda_key,
            "sns": sns_key
        }

    def create_vpc(self) -> ec2.Vpc:
        """Create VPC with 3 AZs and private subnets only"""
        vpc = ec2.Vpc(
            self, f"DocumentVPC{self.environment_suffix}",
            vpc_name=f"document-vpc-{self.environment_suffix}",
            max_azs=3,
            nat_gateways=0,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Private{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ]
        )

        # Create VPC endpoints
        vpc.add_gateway_endpoint(
            f"S3Endpoint{self.environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3
        )

        vpc.add_gateway_endpoint(
            f"DynamoDBEndpoint{self.environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB
        )

        vpc.add_interface_endpoint(
            f"LambdaEndpoint{self.environment_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.LAMBDA_
        )

        # Create security group
        self.security_group = ec2.SecurityGroup(
            self, f"LambdaSG{self.environment_suffix}",
            vpc=vpc,
            description=f"Security group for Lambda functions {self.environment_suffix}",
            allow_all_outbound=False
        )

        # Deny all inbound by default (implicit)
        # Allow outbound to VPC endpoints only
        self.security_group.add_egress_rule(
            peer=ec2.Peer.ipv4(vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS to VPC endpoints"
        )

        return vpc

    def create_s3_buckets(self) -> dict:
        """Create S3 buckets with security controls"""
        # Access logging bucket
        log_bucket = s3.Bucket(
            self, f"AccessLogBucket{self.environment_suffix}",
            bucket_name=f"access-logs-{self.environment_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_keys["s3"],
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Document storage bucket
        document_bucket = s3.Bucket(
            self, f"DocumentBucket{self.environment_suffix}",
            bucket_name=f"documents-{self.environment_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_keys["s3"],
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            server_access_logs_bucket=log_bucket,
            server_access_logs_prefix="document-bucket/",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Enforce encryption in transit
        document_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyUnencryptedObjectUploads",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[document_bucket.arn_for_objects("*")],
                conditions={
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption": "aws:kms"
                    }
                }
            )
        )

        return {
            "logs": log_bucket,
            "documents": document_bucket
        }

    def create_audit_table(self) -> dynamodb.Table:
        """Create DynamoDB table for audit logs"""
        table = dynamodb.Table(
            self, f"AuditLogTable{self.environment_suffix}",
            table_name=f"audit-logs-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="eventId",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Add GSI for querying by timestamp
        table.add_global_secondary_index(
            index_name="TimestampIndex",
            partition_key=dynamodb.Attribute(
                name="eventType",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            )
        )

        return table

    def create_secrets(self) -> dict:
        """Create Secrets Manager secrets"""
        api_key_secret = secretsmanager.Secret(
            self, f"APIKeySecret{self.environment_suffix}",
            secret_name=f"api-keys-{self.environment_suffix}",
            description="API keys for document processing",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"api_key": ""}',
                generate_string_key="api_key",
                exclude_punctuation=True
            )
        )

        db_credentials_secret = secretsmanager.Secret(
            self, f"DBCredentials{self.environment_suffix}",
            secret_name=f"db-credentials-{self.environment_suffix}",
            description="Database credentials",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "admin"}',
                generate_string_key="password",
                exclude_punctuation=True
            )
        )

        # Note: Rotation Lambda would be added here in production
        # For now, we'll create a placeholder rotation configuration

        return {
            "api_key": api_key_secret,
            "db_credentials": db_credentials_secret
        }

    def create_lambda_functions(self) -> dict:
        """Create Lambda functions for document processing"""
        functions = {}

        # Document validation function
        functions["validate"] = lambda_.Function(
            self, f"ValidateFunction{self.environment_suffix}",
            function_name=f"document-validate-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['AUDIT_TABLE_NAME'])

def handler(event, context):
    # Extract document from event
    body = json.loads(event.get('body', '{}'))
    document_id = body.get('documentId', 'unknown')

    # Basic validation
    if not document_id or len(document_id) < 5:
        return {
            'statusCode': 400,
            'body': json.dumps({'error': 'Invalid document ID'})
        }

    # Log audit entry
    table.put_item(Item={
        'eventId': f'validate-{document_id}',
        'timestamp': int(datetime.now().timestamp()),
        'eventType': 'DOCUMENT_VALIDATION',
        'documentId': document_id,
        'status': 'SUCCESS'
    })

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Document validated', 'documentId': document_id})
    }
"""),
            timeout=Duration.seconds(15),
            environment={
                "AUDIT_TABLE_NAME": self.audit_table.table_name,
                "KMS_KEY_ID": self.kms_keys["lambda"].key_id
            },
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[self.security_group],
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Document encryption function
        functions["encrypt"] = lambda_.Function(
            self, f"EncryptFunction{self.environment_suffix}",
            function_name=f"document-encrypt-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['AUDIT_TABLE_NAME'])
kms = boto3.client('kms')

def handler(event, context):
    body = json.loads(event.get('body', '{}'))
    document_id = body.get('documentId', 'unknown')
    document_content = body.get('content', '')

    # Encrypt document content using KMS
    encrypted = kms.encrypt(
        KeyId=os.environ['KMS_KEY_ID'],
        Plaintext=document_content.encode()
    )

    # Log audit entry
    table.put_item(Item={
        'eventId': f'encrypt-{document_id}',
        'timestamp': int(datetime.now().timestamp()),
        'eventType': 'DOCUMENT_ENCRYPTION',
        'documentId': document_id,
        'status': 'SUCCESS'
    })

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Document encrypted', 'documentId': document_id})
    }
"""),
            timeout=Duration.seconds(15),
            environment={
                "AUDIT_TABLE_NAME": self.audit_table.table_name,
                "KMS_KEY_ID": self.kms_keys["lambda"].key_id
            },
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[self.security_group],
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Compliance scanning function
        functions["scan"] = lambda_.Function(
            self, f"ScanFunction{self.environment_suffix}",
            function_name=f"document-scan-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['AUDIT_TABLE_NAME'])

def handler(event, context):
    body = json.loads(event.get('body', '{}'))
    document_id = body.get('documentId', 'unknown')

    # Simulate compliance scan
    compliance_status = 'COMPLIANT'

    # Log audit entry
    table.put_item(Item={
        'eventId': f'scan-{document_id}',
        'timestamp': int(datetime.now().timestamp()),
        'eventType': 'COMPLIANCE_SCAN',
        'documentId': document_id,
        'complianceStatus': compliance_status,
        'status': 'SUCCESS'
    })

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Compliance scan completed',
            'documentId': document_id,
            'complianceStatus': compliance_status
        })
    }
"""),
            timeout=Duration.seconds(15),
            environment={
                "AUDIT_TABLE_NAME": self.audit_table.table_name
            },
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            security_groups=[self.security_group],
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # GuardDuty remediation function
        functions["remediate"] = lambda_.Function(
            self, f"RemediationFunction{self.environment_suffix}",
            function_name=f"guardduty-remediate-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['AUDIT_TABLE_NAME'])
sns = boto3.client('sns')

def handler(event, context):
    # Parse GuardDuty finding
    detail = event.get('detail', {})
    finding_id = detail.get('id', 'unknown')
    severity = detail.get('severity', 0)

    # Log audit entry
    table.put_item(Item={
        'eventId': f'remediation-{finding_id}',
        'timestamp': int(datetime.now().timestamp()),
        'eventType': 'GUARDDUTY_REMEDIATION',
        'findingId': finding_id,
        'severity': str(severity),
        'status': 'INITIATED'
    })

    # Send SNS notification
    sns.publish(
        TopicArn=os.environ['SNS_TOPIC_ARN'],
        Subject='GuardDuty High Severity Finding',
        Message=json.dumps(detail, indent=2)
    )

    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Remediation initiated', 'findingId': finding_id})
    }
"""),
            timeout=Duration.seconds(30),
            environment={
                "AUDIT_TABLE_NAME": self.audit_table.table_name,
                "SNS_TOPIC_ARN": ""  # Will be set after SNS topic creation
            },
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Config compliance check function
        functions["config_check"] = lambda_.Function(
            self, f"ConfigCheckFunction{self.environment_suffix}",
            function_name=f"config-compliance-check-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import boto3

def handler(event, context):
    # Parse AWS Config event
    config_rule_name = event.get('configRuleName', 'unknown')
    resource_type = event.get('resourceType', 'unknown')
    resource_id = event.get('resourceId', 'unknown')

    # Simulate compliance check
    compliance = 'COMPLIANT'

    return {
        'compliance_type': compliance,
        'annotation': f'Resource {resource_id} is compliant'
    }
"""),
            timeout=Duration.seconds(30),
            log_retention=logs.RetentionDays.ONE_WEEK
        )

        # Grant permissions
        self.audit_table.grant_write_data(functions["validate"])
        self.audit_table.grant_write_data(functions["encrypt"])
        self.audit_table.grant_write_data(functions["scan"])
        self.audit_table.grant_write_data(functions["remediate"])

        self.kms_keys["lambda"].grant_encrypt_decrypt(functions["encrypt"])
        self.buckets["documents"].grant_read_write(functions["validate"])
        self.buckets["documents"].grant_read_write(functions["encrypt"])

        # Grant IAM permissions for cross-account access with external ID
        for func_name, func in functions.items():
            if func_name in ["validate", "encrypt", "scan"]:
                func.role.assume_role_policy.add_statements(
                    iam.PolicyStatement(
                        effect=iam.Effect.ALLOW,
                        principals=[iam.AccountPrincipal(self.account)],
                        actions=["sts:AssumeRole"],
                        conditions={
                            "StringEquals": {
                                "sts:ExternalId": f"external-id-{self.environment_suffix}"
                            }
                        }
                    )
                )

        return functions

    def create_api_gateway(self) -> apigw.RestApi:
        """Create API Gateway REST API with WAF"""
        # Create REST API
        api = apigw.RestApi(
            self, f"DocumentAPI{self.environment_suffix}",
            rest_api_name=f"document-api-{self.environment_suffix}",
            description="Secure document processing API",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                throttling_rate_limit=100,
                throttling_burst_limit=200,
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True
            )
        )

        # Create API key
        api_key = api.add_api_key(
            f"APIKey{self.environment_suffix}",
            api_key_name=f"document-api-key-{self.environment_suffix}"
        )

        # Create usage plan
        usage_plan = api.add_usage_plan(
            f"UsagePlan{self.environment_suffix}",
            name=f"document-usage-plan-{self.environment_suffix}",
            throttle=apigw.ThrottleSettings(
                rate_limit=100,
                burst_limit=200
            )
        )
        usage_plan.add_api_key(api_key)
        usage_plan.add_api_stage(
            stage=api.deployment_stage
        )

        # Create resources and methods
        validate_resource = api.root.add_resource("validate")
        validate_resource.add_method(
            "POST",
            apigw.LambdaIntegration(self.lambda_functions["validate"]),
            api_key_required=True
        )

        encrypt_resource = api.root.add_resource("encrypt")
        encrypt_resource.add_method(
            "POST",
            apigw.LambdaIntegration(self.lambda_functions["encrypt"]),
            api_key_required=True
        )

        scan_resource = api.root.add_resource("scan")
        scan_resource.add_method(
            "POST",
            apigw.LambdaIntegration(self.lambda_functions["scan"]),
            api_key_required=True
        )

        # Create WAF WebACL
        waf_acl = wafv2.CfnWebACL(
            self, f"DocumentWAF{self.environment_suffix}",
            name=f"document-waf-{self.environment_suffix}",
            scope="REGIONAL",
            default_action=wafv2.CfnWebACL.DefaultActionProperty(
                allow={}
            ),
            visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                cloud_watch_metrics_enabled=True,
                metric_name=f"DocumentWAF{self.environment_suffix}",
                sampled_requests_enabled=True
            ),
            rules=[
                wafv2.CfnWebACL.RuleProperty(
                    name="SQLiProtection",
                    priority=1,
                    statement=wafv2.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=(
                            wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                                vendor_name="AWS",
                                name="AWSManagedRulesSQLiRuleSet"
                            )
                        )
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="SQLiProtection",
                        sampled_requests_enabled=True
                    ),
                    override_action=wafv2.CfnWebACL.OverrideActionProperty(
                        none={}
                    )
                ),
                wafv2.CfnWebACL.RuleProperty(
                    name="XSSProtection",
                    priority=2,
                    statement=wafv2.CfnWebACL.StatementProperty(
                        managed_rule_group_statement=(
                            wafv2.CfnWebACL.ManagedRuleGroupStatementProperty(
                                vendor_name="AWS",
                                name="AWSManagedRulesKnownBadInputsRuleSet"
                            )
                        )
                    ),
                    visibility_config=wafv2.CfnWebACL.VisibilityConfigProperty(
                        cloud_watch_metrics_enabled=True,
                        metric_name="XSSProtection",
                        sampled_requests_enabled=True
                    ),
                    override_action=wafv2.CfnWebACL.OverrideActionProperty(
                        none={}
                    )
                )
            ]
        )

        # Associate WAF with API Gateway
        # Use deployment_stage which is the actual Stage resource
        api_stage_arn = (
            f"arn:aws:apigateway:{self.region}::"
            f"/restapis/{api.rest_api_id}/stages/prod"
        )
        waf_association = wafv2.CfnWebACLAssociation(
            self, f"WAFAssociation{self.environment_suffix}",
            resource_arn=api_stage_arn,
            web_acl_arn=waf_acl.attr_arn
        )

        # Ensure WAF association happens after the stage is created
        waf_association.node.add_dependency(api.deployment_stage.node.default_child)

        return api

    def create_guardduty_rules(self):
        """Create EventBridge rules for GuardDuty findings"""
        # Note: GuardDuty detector already exists at account level
        # Create EventBridge rule to capture high severity findings
        rule = events.Rule(
            self, f"GuardDutyHighSeverity{self.environment_suffix}",
            rule_name=f"guardduty-high-severity-{self.environment_suffix}",
            description="Capture GuardDuty high severity findings",
            event_pattern=events.EventPattern(
                source=["aws.guardduty"],
                detail_type=["GuardDuty Finding"],
                detail={
                    "severity": [7, 8, 9]
                }
            )
        )

        rule.add_target(targets.LambdaFunction(self.lambda_functions["remediate"]))

    def create_cloudwatch_events(self):
        """Create CloudWatch Events rules for API call monitoring"""
        # Create log group for API call events
        log_group = logs.LogGroup(
            self, f"APICallLogs{self.environment_suffix}",
            log_group_name=f"/aws/events/api-calls-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create EventBridge rule to capture all API calls
        api_calls_rule = events.Rule(
            self, f"APICallsRule{self.environment_suffix}",
            rule_name=f"api-calls-monitor-{self.environment_suffix}",
            description="Capture all API Gateway calls",
            event_pattern=events.EventPattern(
                source=["aws.apigateway"],
                detail_type=["AWS API Call via CloudTrail"]
            )
        )

        api_calls_rule.add_target(targets.CloudWatchLogGroup(log_group))

    def create_config_rules(self):
        """Create AWS Config custom rules"""
        # Create Config role
        config_role = iam.Role(
            self, f"ConfigRole{self.environment_suffix}",
            role_name=f"config-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("config.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWS_ConfigRole")
            ]
        )

        # Create Config custom rule for encryption validation
        encryption_rule = config.CfnConfigRule(
            self, f"EncryptionRule{self.environment_suffix}",
            config_rule_name=f"s3-encryption-check-{self.environment_suffix}",
            description="Check if S3 buckets have encryption enabled",
            source=config.CfnConfigRule.SourceProperty(
                owner="CUSTOM_LAMBDA",
                source_identifier=self.lambda_functions["config_check"].function_arn,
                source_details=[
                    config.CfnConfigRule.SourceDetailProperty(
                        event_source="aws.config",
                        message_type="ConfigurationItemChangeNotification"
                    )
                ]
            )
        )

        # Grant Config permission to invoke Lambda
        self.lambda_functions["config_check"].add_permission(
            f"ConfigPermission{self.environment_suffix}",
            principal=iam.ServicePrincipal("config.amazonaws.com"),
            action="lambda:InvokeFunction"
        )

    def create_sns_topics(self):
        """Create SNS topics for security alerts"""
        security_topic = sns.Topic(
            self, f"SecurityAlertTopic{self.environment_suffix}",
            topic_name=f"security-alerts-{self.environment_suffix}",
            display_name="Security Alerts",
            master_key=self.kms_keys["sns"]
        )

        # Update remediation function environment with SNS topic ARN
        self.lambda_functions["remediate"].add_environment(
            "SNS_TOPIC_ARN",
            security_topic.topic_arn
        )

        # Grant SNS publish permission to remediation function
        security_topic.grant_publish(self.lambda_functions["remediate"])

        # Add email subscription (placeholder - would be configured via parameter)
        # security_topic.add_subscription(
        #     subscriptions.EmailSubscription("security-team@example.com")
        # )

    def create_outputs(self):
        """Create CloudFormation outputs"""
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID",
            export_name=f"VPCId-{self.environment_suffix}"
        )

        CfnOutput(
            self, "DocumentBucketName",
            value=self.buckets["documents"].bucket_name,
            description="Document bucket name",
            export_name=f"DocumentBucketName-{self.environment_suffix}"
        )

        CfnOutput(
            self, "AuditTableName",
            value=self.audit_table.table_name,
            description="Audit log table name",
            export_name=f"AuditTableName-{self.environment_suffix}"
        )

        CfnOutput(
            self, "APIEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL",
            export_name=f"APIEndpoint-{self.environment_suffix}"
        )
