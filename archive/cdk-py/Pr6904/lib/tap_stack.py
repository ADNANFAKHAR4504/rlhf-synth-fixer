"""tap_stack.py
Secure Document Processing Pipeline Stack for PCI-DSS compliance.
"""

from typing import Optional
import json

from aws_cdk import (
    Stack,
    CfnOutput,
    RemovalPolicy,
    Duration,
    aws_s3 as s3,
    aws_kms as kms,
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_ec2 as ec2,
    aws_dynamodb as dynamodb,
    aws_events as events,
    aws_events_targets as targets,
    aws_logs as logs,
    aws_secretsmanager as secretsmanager,
    aws_iam as iam,
    aws_sns as sns,
    aws_wafv2 as wafv2,
)
from constructs import Construct


class TapStackProps:
    """Properties for TapStack."""

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        self.environment_suffix = environment_suffix
        self.env = kwargs.get('env')


class TapStack(Stack):
    """Main CDK stack for secure document processing pipeline."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # 1. KMS Keys with automatic rotation
        self.kms_key = self._create_kms_key()

        # 2. S3 Buckets
        self.access_log_bucket, self.document_bucket = self._create_s3_buckets()

        # 3. VPC with private subnets and endpoints
        self.vpc = self._create_vpc()

        # 4. DynamoDB for audit logs
        self.audit_table = self._create_dynamodb_table()

        # 5. Secrets Manager
        self.api_secret, self.db_secret = self._create_secrets()

        # 6. Lambda functions
        self.validation_lambda = self._create_validation_lambda()
        self.encryption_lambda = self._create_encryption_lambda()
        self.compliance_lambda = self._create_compliance_lambda()
        self.remediation_lambda = self._create_remediation_lambda()

        # 7. API Gateway with WAF
        self.api = self._create_api_gateway()
        self.waf_acl = self._create_waf()

        # 8. CloudWatch Events and Logs
        self._create_cloudwatch_monitoring()

        # 9. GuardDuty monitoring
        self._create_guardduty_monitoring()

        # 10. SNS for security alerts
        self.alert_topic = self._create_sns_alerts()

        # Outputs
        self._create_outputs()
    
    def _get_unique_name(self, base_name: str) -> str:
        """Generate a unique resource name using stack name and environment."""
        stack_name = self.stack_name.lower().replace('_', '-')
        return f"{base_name}-{stack_name}-{self.environment_suffix}"

    def _create_kms_key(self) -> kms.Key:
        """Create KMS key with automatic rotation."""
        key = kms.Key(
            self,
            f"DocumentKmsKey-{self.environment_suffix}",
            description=f"KMS key for document encryption {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        key.add_alias(f"alias/document-processing-{self.environment_suffix}")

        return key

    def _create_s3_buckets(self) -> tuple:
        """Create S3 buckets with security configurations."""
        # Access log bucket
        access_log_bucket = s3.Bucket(
            self,
            f"AccessLogBucket-{self.environment_suffix}",
            bucket_name=self._get_unique_name("access-logs"),
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # Document bucket
        document_bucket = s3.Bucket(
            self,
            f"DocumentBucket-{self.environment_suffix}",
            bucket_name=self._get_unique_name("documents"),
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            server_access_logs_bucket=access_log_bucket,
            server_access_logs_prefix="document-bucket/",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        return access_log_bucket, document_bucket

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with private subnets and VPC endpoints."""
        vpc = ec2.Vpc(
            self,
            f"DocumentVpc-{self.environment_suffix}",
            max_azs=3,
            nat_gateways=0,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"Private-{self.environment_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                )
            ],
        )

        # VPC Endpoints for AWS services
        vpc.add_gateway_endpoint(
            f"S3Endpoint-{self.environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.S3,
        )

        # DynamoDB uses Gateway endpoint, not Interface endpoint
        vpc.add_gateway_endpoint(
            f"DynamoDBEndpoint-{self.environment_suffix}",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
        )

        vpc.add_interface_endpoint(
            f"LambdaEndpoint-{self.environment_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.LAMBDA_,
        )

        vpc.add_interface_endpoint(
            f"SecretsManagerEndpoint-{self.environment_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.SECRETS_MANAGER,
        )

        vpc.add_interface_endpoint(
            f"KmsEndpoint-{self.environment_suffix}",
            service=ec2.InterfaceVpcEndpointAwsService.KMS,
        )

        return vpc

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table for audit logs."""
        table = dynamodb.Table(
            self,
            f"AuditTable-{self.environment_suffix}",
            table_name=self._get_unique_name("audit-logs"),
            partition_key=dynamodb.Attribute(
                name="requestId",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.STRING,
            ),
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.kms_key,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        return table

    def _create_secrets(self) -> tuple:
        """Create Secrets Manager secrets."""
        api_secret = secretsmanager.Secret(
            self,
            f"ApiKeySecret-{self.environment_suffix}",
            secret_name=self._get_unique_name("api-keys"),
            description="API keys for document processing",
            encryption_key=self.kms_key,
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps({"api_key": ""}),
                generate_string_key="api_key",
                password_length=32,
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        db_secret = secretsmanager.Secret(
            self,
            f"DbCredentialsSecret-{self.environment_suffix}",
            secret_name=self._get_unique_name("db-credentials"),
            description="Database credentials for document processing",
            encryption_key=self.kms_key,
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps({
                    "username": "dbadmin",
                    "password": "",
                }),
                generate_string_key="password",
                password_length=32,
                exclude_characters='/@"\\',
            ),
            removal_policy=RemovalPolicy.DESTROY,
        )

        return api_secret, db_secret

    def _create_validation_lambda(self) -> lambda_.Function:
        """Create document validation Lambda."""
        role = iam.Role(
            self,
            f"ValidationLambdaRole-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
            ],
        )

        role.add_to_policy(
            iam.PolicyStatement(
                actions=["s3:GetObject", "s3:PutObject"],
                resources=[f"{self.document_bucket.bucket_arn}/*"],
            )
        )

        role.add_to_policy(
            iam.PolicyStatement(
                actions=["dynamodb:PutItem"],
                resources=[self.audit_table.table_arn],
            )
        )

        role.add_to_policy(
            iam.PolicyStatement(
                actions=["kms:Decrypt", "kms:GenerateDataKey"],
                resources=[self.kms_key.key_arn],
            )
        )

        function = lambda_.Function(
            self,
            f"ValidationLambda-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="validation.handler",
            code=lambda_.Code.from_asset("lib/lambda/validation"),
            role=role,
            timeout=Duration.seconds(15),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            environment={
                "AUDIT_TABLE": self.audit_table.table_name,
                "DOCUMENT_BUCKET": self.document_bucket.bucket_name,
                "KMS_KEY_ID": self.kms_key.key_id,
            },
        )

        return function

    def _create_encryption_lambda(self) -> lambda_.Function:
        """Create document encryption Lambda."""
        role = iam.Role(
            self,
            f"EncryptionLambdaRole-{self.environment_suffix}",
            role_name=f"encryption-lambda-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
            ],
        )

        role.add_to_policy(
            iam.PolicyStatement(
                actions=["s3:GetObject", "s3:PutObject"],
                resources=[f"{self.document_bucket.bucket_arn}/*"],
            )
        )

        role.add_to_policy(
            iam.PolicyStatement(
                actions=["kms:Encrypt", "kms:Decrypt", "kms:GenerateDataKey"],
                resources=[self.kms_key.key_arn],
            )
        )

        function = lambda_.Function(
            self,
            f"EncryptionLambda-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="encryption.handler",
            code=lambda_.Code.from_asset("lib/lambda/encryption"),
            role=role,
            timeout=Duration.seconds(15),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            environment={
                "DOCUMENT_BUCKET": self.document_bucket.bucket_name,
                "KMS_KEY_ID": self.kms_key.key_id,
            },
        )

        return function

    def _create_compliance_lambda(self) -> lambda_.Function:
        """Create compliance scanning Lambda."""
        role = iam.Role(
            self,
            f"ComplianceLambdaRole-{self.environment_suffix}",
            role_name=f"compliance-lambda-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
            ],
        )

        role.add_to_policy(
            iam.PolicyStatement(
                actions=["s3:GetObject"],
                resources=[f"{self.document_bucket.bucket_arn}/*"],
            )
        )

        role.add_to_policy(
            iam.PolicyStatement(
                actions=["dynamodb:PutItem"],
                resources=[self.audit_table.table_arn],
            )
        )

        role.add_to_policy(
            iam.PolicyStatement(
                actions=["secretsmanager:GetSecretValue"],
                resources=[self.api_secret.secret_arn],
            )
        )

        role.add_to_policy(
            iam.PolicyStatement(
                actions=["kms:Decrypt"],
                resources=[self.kms_key.key_arn],
            )
        )

        function = lambda_.Function(
            self,
            f"ComplianceLambda-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="compliance.handler",
            code=lambda_.Code.from_asset("lib/lambda/compliance"),
            role=role,
            timeout=Duration.seconds(15),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
            environment={
                "AUDIT_TABLE": self.audit_table.table_name,
                "DOCUMENT_BUCKET": self.document_bucket.bucket_name,
                "API_SECRET_ARN": self.api_secret.secret_arn,
            },
        )

        return function

    def _create_remediation_lambda(self) -> lambda_.Function:
        """Create GuardDuty remediation Lambda."""
        role = iam.Role(
            self,
            f"RemediationLambdaRole-{self.environment_suffix}",
            role_name=f"remediation-lambda-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaVPCAccessExecutionRole"
                ),
            ],
        )

        role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "ec2:RevokeSecurityGroupIngress",
                    "ec2:RevokeSecurityGroupEgress",
                    "iam:AttachUserPolicy",
                    "iam:DetachUserPolicy",
                ],
                resources=["*"],
                conditions={
                    "StringEquals": {
                        "aws:RequestedRegion": self.region,
                    }
                },
            )
        )

        role.add_to_policy(
            iam.PolicyStatement(
                actions=["sns:Publish"],
                resources=["*"],
            )
        )

        function = lambda_.Function(
            self,
            f"RemediationLambda-{self.environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="remediation.handler",
            code=lambda_.Code.from_asset("lib/lambda/remediation"),
            role=role,
            timeout=Duration.seconds(60),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            ),
        )

        return function

    def _create_api_gateway(self) -> apigw.RestApi:
        """Create API Gateway with security controls."""
        log_group = logs.LogGroup(
            self,
            f"ApiGatewayLogs-{self.environment_suffix}",
            log_group_name=f"/aws/apigateway/document-api-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY,
        )

        api = apigw.RestApi(
            self,
            f"DocumentApi-{self.environment_suffix}",
            rest_api_name=f"document-processing-api-{self.environment_suffix}",
            description="Secure document processing API",
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                logging_level=apigw.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                access_log_destination=apigw.LogGroupLogDestination(log_group),
                access_log_format=apigw.AccessLogFormat.json_with_standard_fields(
                    caller=True,
                    http_method=True,
                    ip=True,
                    protocol=True,
                    request_time=True,
                    resource_path=True,
                    response_length=True,
                    status=True,
                    user=True,
                ),
                throttling_rate_limit=100,
                throttling_burst_limit=50,
            ),
        )

        api_key = api.add_api_key(
            f"ApiKey-{self.environment_suffix}",
            api_key_name=f"document-api-key-{self.environment_suffix}",
        )

        usage_plan = api.add_usage_plan(
            f"UsagePlan-{self.environment_suffix}",
            name=f"document-api-usage-{self.environment_suffix}",
            throttle=apigw.ThrottleSettings(
                rate_limit=100,
                burst_limit=50,
            ),
            quota=apigw.QuotaSettings(
                limit=10000,
                period=apigw.Period.DAY,
            ),
        )

        usage_plan.add_api_key(api_key)
        usage_plan.add_api_stage(stage=api.deployment_stage)

        documents = api.root.add_resource("documents")

        upload = documents.add_resource("upload")
        upload.add_method(
            "POST",
            apigw.LambdaIntegration(self.validation_lambda),
            api_key_required=True,
        )

        encrypt = documents.add_resource("encrypt")
        encrypt.add_method(
            "POST",
            apigw.LambdaIntegration(self.encryption_lambda),
            api_key_required=True,
        )

        scan = documents.add_resource("scan")
        scan.add_method(
            "POST",
            apigw.LambdaIntegration(self.compliance_lambda),
            api_key_required=True,
        )

        return api

    def _create_waf(self) -> wafv2.CfnWebACL:
        """Create WAF rules for API Gateway."""
        waf_rules = [
            {
                "name": f"SQLInjectionRule-{self.environment_suffix}",
                "priority": 1,
                "statement": {
                    "managedRuleGroupStatement": {
                        "vendorName": "AWS",
                        "name": "AWSManagedRulesSQLiRuleSet",
                    }
                },
                "overrideAction": {"none": {}},
                "visibilityConfig": {
                    "sampledRequestsEnabled": True,
                    "cloudWatchMetricsEnabled": True,
                    "metricName": f"SQLInjectionRule-{self.environment_suffix}",
                },
            },
            {
                "name": f"XSSRule-{self.environment_suffix}",
                "priority": 2,
                "statement": {
                    "managedRuleGroupStatement": {
                        "vendorName": "AWS",
                        "name": "AWSManagedRulesKnownBadInputsRuleSet",
                    }
                },
                "overrideAction": {"none": {}},
                "visibilityConfig": {
                    "sampledRequestsEnabled": True,
                    "cloudWatchMetricsEnabled": True,
                    "metricName": f"XSSRule-{self.environment_suffix}",
                },
            },
        ]

        web_acl = wafv2.CfnWebACL(
            self,
            f"WebAcl-{self.environment_suffix}",
            name=f"document-api-waf-{self.environment_suffix}",
            scope="REGIONAL",
            default_action={"allow": {}},
            rules=waf_rules,
            visibility_config={
                "sampledRequestsEnabled": True,
                "cloudWatchMetricsEnabled": True,
                "metricName": f"DocumentApiWaf-{self.environment_suffix}",
            },
        )

        # Get the deployment stage from the API
        # The deployment is created automatically when methods are added
        stage = self.api.deployment_stage

        # Create WAF association with explicit dependency on stage
        waf_association = wafv2.CfnWebACLAssociation(
            self,
            f"WebAclAssociation-{self.environment_suffix}",
            resource_arn=f"arn:aws:apigateway:{self.region}::/restapis/{self.api.rest_api_id}/stages/{stage.stage_name}",
            web_acl_arn=web_acl.attr_arn,
        )

        # Ensure WAF association depends on the API deployment stage
        waf_association.node.add_dependency(stage)

        return web_acl

    def _create_cloudwatch_monitoring(self):
        """Create CloudWatch Events and Logs for API monitoring."""
        api_call_log_group = logs.LogGroup(
            self,
            f"ApiCallLogs-{self.environment_suffix}",
            log_group_name=f"/aws/events/api-calls-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY,
        )

        api_call_rule = events.Rule(
            self,
            f"ApiCallRule-{self.environment_suffix}",
            rule_name=f"capture-api-calls-{self.environment_suffix}",
            description="Capture all API Gateway calls",
            event_pattern=events.EventPattern(
                source=["aws.apigateway"],
                detail_type=["AWS API Call via CloudTrail"],
            ),
        )

        api_call_rule.add_target(
            targets.CloudWatchLogGroup(api_call_log_group)
        )

    def _create_guardduty_monitoring(self):
        """Create GuardDuty monitoring and remediation."""
        guardduty_rule = events.Rule(
            self,
            f"GuardDutyRule-{self.environment_suffix}",
            rule_name=f"guardduty-findings-{self.environment_suffix}",
            description=(
                "Trigger remediation for high-severity GuardDuty findings"
            ),
            event_pattern=events.EventPattern(
                source=["aws.guardduty"],
                detail_type=["GuardDuty Finding"],
                detail={
                    "severity": [
                        7, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9,
                        8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9
                    ],
                },
            ),
        )

        guardduty_rule.add_target(
            targets.LambdaFunction(self.remediation_lambda)
        )

    def _create_sns_alerts(self) -> sns.Topic:
        """Create SNS topic for security alerts."""
        topic = sns.Topic(
            self,
            f"SecurityAlertTopic-{self.environment_suffix}",
            topic_name=f"security-alerts-{self.environment_suffix}",
            display_name="Security Alerts",
            master_key=self.kms_key,
        )

        topic.grant_publish(self.remediation_lambda)

        return topic

    def _create_outputs(self):
        """Create CloudFormation outputs."""
        CfnOutput(
            self,
            "ApiEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL",
        )

        CfnOutput(
            self,
            "DocumentBucketName",
            value=self.document_bucket.bucket_name,
            description="Document storage bucket name",
        )

        CfnOutput(
            self,
            "AccessLogBucketName",
            value=self.access_log_bucket.bucket_name,
            description="Access log bucket name",
        )

        CfnOutput(
            self,
            "AuditTableName",
            value=self.audit_table.table_name,
            description="Audit logs DynamoDB table name",
        )

        CfnOutput(
            self,
            "KmsKeyId",
            value=self.kms_key.key_id,
            description="KMS key ID for encryption",
        )

        CfnOutput(
            self,
            "SecurityAlertTopicArn",
            value=self.alert_topic.topic_arn,
            description="SNS topic ARN for security alerts",
        )

        # display lambda function names
        CfnOutput(
            self,
            "ValidationLambdaName",
            value=self.validation_lambda.function_name,
            description="Validation Lambda function name",
        )
        
        CfnOutput(
            self,
            "EncryptionLambdaName",
            value=self.encryption_lambda.function_name,
            description="Encryption Lambda function name",
        )
        
        CfnOutput(
            self,
            "ComplianceLambdaName",
            value=self.compliance_lambda.function_name,
            description="Compliance Lambda function name",
        )
        
        CfnOutput(
            self,
            "RemediationLambdaName",
            value=self.remediation_lambda.function_name,
            description="Remediation Lambda function name",
        )