```python
# lib/tap_stack.py
"""
TapStack: secure baseline stack for web apps (VPC, ALB, ASG, RDS, S3, API, Lambda).
CDK v2 compatible, no deprecated APIs, synths with or without ACM cert ARN.
"""

from __future__ import annotations

import json
from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    RemovalPolicy,
    Stack,
    CfnOutput,
    Tags,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_s3 as s3,
    aws_rds as rds,
    aws_secretsmanager as secretsmanager,
    aws_iam as iam,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_autoscaling as autoscaling,
    aws_certificatemanager as acm,
    aws_logs as logs,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Optional props for TapStack."""
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs) -> None:
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(Stack):
    """Main secure stack."""
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ---- Context / Parameters with sane defaults ----
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix")

        self.env_name: str = (
            self.node.try_get_context("env_name")
            or environment_suffix
            or "dev"
        )
        self.owner: str = self.node.try_get_context("owner") or "PlatformTeam"
        self.allowed_office_cidr: str = self.node.try_get_context("allowed_office_cidr") or ""
        self.db_username: str = self.node.try_get_context("db_username") or "appuser"
        self.db_allocated_storage: int = int(self.node.try_get_context("db_allocated_storage") or 50)
        self.instance_type: str = self.node.try_get_context("instance_type") or "t3.micro"
        self.lambda_memory_mb: int = int(self.node.try_get_context("lambda_memory_mb") or 256)
        self.acm_cert_arn: str = self.node.try_get_context("acm_cert_arn") or ""

        # Apply global tags automatically
        self._apply_global_tags()

        # ---- Build resources ----
        self.create_vpc_and_subnets()
        self.create_security_groups()
        self.create_s3_buckets()
        self.create_vpc_endpoints()
        self.create_iam_resources()
        self.create_database()
        self.create_bastion_host()
        self.create_application_tier()
        self.create_lambda_function()
        self.create_api_gateway()
        self.create_outputs()

    # --------------------------
    # Helpers / Builders
    # --------------------------

    def _apply_global_tags(self) -> None:
        Tags.of(self).add("Environment", self.env_name)
        Tags.of(self).add("Owner", self.owner)

    def create_vpc_and_subnets(self) -> None:
        """3-tier VPC."""
        self.vpc = ec2.Vpc(
            self,
            "VPC",
            vpc_name=f"tap-vpc-{self.env_name}",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            nat_gateways=2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="PrivateWithEgress",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Isolated",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24,
                ),
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

    def create_security_groups(self) -> None:
        """Least-privilege SGs."""
        # ALB: 443 from internet (and possibly 80 if no cert; see app tier)
        self.alb_sg = ec2.SecurityGroup(
            self,
            "ALBSecurityGroup",
            vpc=self.vpc,
            description="ALB SG",
            security_group_name=f"tap-alb-sg-{self.env_name}",
        )
        self.alb_sg.add_ingress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(443), "HTTPS from internet"
        )

        # App: 8080 from ALB only
        self.app_sg = ec2.SecurityGroup(
            self,
            "AppSecurityGroup",
            vpc=self.vpc,
            description="App SG (from ALB)",
            security_group_name=f"tap-app-sg-{self.env_name}",
        )
        self.app_sg.add_ingress_rule(
            ec2.Peer.security_group_id(self.alb_sg.security_group_id),
            ec2.Port.tcp(8080),
            "App port from ALB",
        )

        # Lambda: egress 443 only
        self.lambda_sg = ec2.SecurityGroup(
            self,
            "LambdaSecurityGroup",
            vpc=self.vpc,
            description="Lambda SG (egress 443)",
            security_group_name=f"tap-lambda-sg-{self.env_name}",
        )
        self.lambda_sg.add_egress_rule(
            ec2.Peer.any_ipv4(), ec2.Port.tcp(443), "HTTPS outbound"
        )

        # DB: 5432 from App + Lambda
        self.db_sg = ec2.SecurityGroup(
            self,
            "DatabaseSecurityGroup",
            vpc=self.vpc,
            description="DB SG (5432 from App/Lambda)",
            security_group_name=f"tap-db-sg-{self.env_name}",
        )
        self.db_sg.add_ingress_rule(
            ec2.Peer.security_group_id(self.app_sg.security_group_id),
            ec2.Port.tcp(5432),
            "Postgres from App",
        )
        self.db_sg.add_ingress_rule(
            ec2.Peer.security_group_id(self.lambda_sg.security_group_id),
            ec2.Port.tcp(5432),
            "Postgres from Lambda",
        )

        # Bastion: 22 from allowed CIDR (if provided); otherwise SSM only
        self.bastion_sg = ec2.SecurityGroup(
            self,
            "BastionSecurityGroup",
            vpc=self.vpc,
            description="Bastion SG",
            security_group_name=f"tap-bastion-sg-{self.env_name}",
        )
        if self.allowed_office_cidr:
            if "/" not in self.allowed_office_cidr:
                raise ValueError("allowed_office_cidr must be a valid CIDR (e.g., 1.2.3.4/32).")
            self.bastion_sg.add_ingress_rule(
                ec2.Peer.ipv4(self.allowed_office_cidr),
                ec2.Port.tcp(22),
                "SSH from office",
            )

    def create_s3_buckets(self) -> None:
        """S3 with logging and TLS-only. Avoid explicit names to bypass token validation."""
        self.logging_bucket = s3.Bucket(
            self,
            "LoggingBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(id="ExpireOldLogs", expiration=Duration.days(90), enabled=True)
            ],
        )

        self.data_bucket = s3.Bucket(
            self,
            "DataBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            enforce_ssl=True,
            server_access_logs_bucket=self.logging_bucket,
            server_access_logs_prefix="data-bucket-logs/",
        )

        # TLS-only bucket policies
        for b in (self.logging_bucket, self.data_bucket):
            b.add_to_resource_policy(
                iam.PolicyStatement(
                    sid="DenyInsecureTransport",
                    effect=iam.Effect.DENY,
                    principals=[iam.AnyPrincipal()],
                    actions=["s3:*"],
                    resources=[b.arn_for_objects("*"), b.bucket_arn],
                    conditions={"Bool": {"aws:SecureTransport": "false"}},
                )
            )

    def create_vpc_endpoints(self) -> None:
        """Gateway endpoints for S3 & DynamoDB, interface endpoints for SSM family."""
        self.vpc.add_gateway_endpoint(
            "S3Endpoint",
            service=ec2.GatewayVpcEndpointAwsService.S3,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)],
        )
        self.vpc.add_gateway_endpoint(
            "DynamoDBEndpoint",
            service=ec2.GatewayVpcEndpointAwsService.DYNAMODB,
            subnets=[ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)],
        )
        for name, svc in [
            ("SSMEndpoint", ec2.InterfaceVpcEndpointAwsService.SSM),
            ("SSMMessagesEndpoint", ec2.InterfaceVpcEndpointAwsService.SSM_MESSAGES),
            ("EC2MessagesEndpoint", ec2.InterfaceVpcEndpointAwsService.EC2_MESSAGES),
        ]:
            self.vpc.add_interface_endpoint(
                name, service=svc, subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
            )

    def create_iam_resources(self) -> None:
        """MFA policy + roles with least privilege."""
        mfa_policy_doc = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowViewAccountInfo",
                    "Effect": "Allow",
                    "Action": ["iam:GetAccountPasswordPolicy", "iam:ListVirtualMFADevices"],
                    "Resource": "*",
                },
                {
                    "Sid": "AllowManageOwnPasswords",
                    "Effect": "Allow",
                    "Action": ["iam:ChangePassword", "iam:GetUser"],
                    "Resource": "arn:aws:iam::*:user/${aws:username}",
                },
                {
                    "Sid": "AllowManageOwnMFA",
                    "Effect": "Allow",
                    "Action": [
                        "iam:CreateVirtualMFADevice",
                        "iam:DeleteVirtualMFADevice",
                        "iam:ListMFADevices",
                        "iam:EnableMFADevice",
                        "iam:ResyncMFADevice",
                    ],
                    "Resource": [
                        "arn:aws:iam::*:mfa/${aws:username}",
                        "arn:aws:iam::*:user/${aws:username}",
                    ],
                },
                {
                    "Sid": "DenyAllExceptForMFASetupIfNoMFA",
                    "Effect": "Deny",
                    "NotAction": [
                        "iam:CreateVirtualMFADevice",
                        "iam:EnableMFADevice",
                        "iam:GetUser",
                        "iam:ListMFADevices",
                        "iam:ListVirtualMFADevices",
                        "iam:ResyncMFADevice",
                        "sts:GetSessionToken",
                    ],
                    "Resource": "*",
                    "Condition": {"BoolIfExists": {"aws:MultiFactorAuthPresent": "false"}},
                },
            ],
        }

        mfa_policy = iam.Policy(
            self,
            "MFAPolicy",
            document=iam.PolicyDocument.from_json(mfa_policy_doc),
            policy_name=f"tap-mfa-policy-{self.env_name}",
        )

        self.mfa_group = iam.Group(self, "MFARequiredGroup", group_name=f"MFARequired-{self.env_name}")
        self.mfa_group.attach_inline_policy(mfa_policy)

        # Bastion role: SSM only
        self.bastion_role = iam.Role(
            self,
            "BastionRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ],
            role_name=f"tap-bastion-role-{self.env_name}",
        )

        # App role: minimal S3 + Secrets + logs
        self.app_role = iam.Role(
            self,
            "AppRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            role_name=f"tap-app-role-{self.env_name}",
        )
        self.app_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["s3:GetObject", "s3:PutObject"],
                resources=[f"{self.data_bucket.bucket_arn}/*"],
            )
        )
        self.app_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["secretsmanager:GetSecretValue"],
                resources=[
                    f"arn:aws:secretsmanager:{self.region}:{self.account}:secret:tap-db-secret-{self.env_name}-*"
                ],
            )
        )
        self.app_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["logs:CreateLogGroup", "logs:CreateLogStream", "logs:PutLogEvents"],
                resources=[f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/ec2/tap-app-{self.env_name}*"],
            )
        )

        # Lambda role: VPC access, S3 scoped, secret read, logs
        self.lambda_role = iam.Role(
            self,
            "LambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaVPCAccessExecutionRole")
            ],
            role_name=f"tap-lambda-role-{self.env_name}",
        )
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["s3:GetObject", "s3:PutObject"],
                resources=[f"{self.data_bucket.bucket_arn}/*"],
            )
        )
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["secretsmanager:GetSecretValue"],
                resources=[
                    f"arn:aws:secretsmanager:{self.region}:{self.account}:secret:tap-db-secret-{self.env_name}-*"
                ],
            )
        )

    def create_database(self) -> None:
        """RDS PostgreSQL 15 in isolated subnets (encrypted)."""
        db_subnet_group = rds.SubnetGroup(
            self,
            "DatabaseSubnetGroup",
            description="Subnet group for RDS",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_ISOLATED),
            subnet_group_name=f"tap-db-subnet-group-{self.env_name}",
        )

        self.db_secret = secretsmanager.Secret(
            self,
            "DatabaseSecret",
            description="DB credentials",
            secret_name=f"tap-db-secret-{self.env_name}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template=json.dumps({"username": self.db_username}),
                generate_string_key="password",
                exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\"\\@",
                password_length=32,
            ),
        )

        self.database = rds.DatabaseInstance(
            self,
            "Database",
            engine=rds.DatabaseInstanceEngine.postgres(version=rds.PostgresEngineVersion.VER_15),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
            vpc=self.vpc,
            subnet_group=db_subnet_group,
            security_groups=[self.db_sg],
            credentials=rds.Credentials.from_secret(self.db_secret),
            database_name="tapdb",
            allocated_storage=self.db_allocated_storage,
            storage_encrypted=True,
            backup_retention=Duration.days(7),
            delete_automated_backups=True,
            deletion_protection=False,
            publicly_accessible=False,
            multi_az=False,  # set True for prod
            removal_policy=RemovalPolicy.RETAIN,
        )

    def create_bastion_host(self) -> None:
        """Public bastion (SSM by default; SSH only if CIDR provided)."""
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "yum update -y",
            "systemctl enable amazon-ssm-agent || true",
            "systemctl start amazon-ssm-agent || true",
        )

        self.bastion = ec2.Instance(
            self,
            "BastionHost",
            instance_type=ec2.InstanceType(self.instance_type),
            machine_image=ec2.MachineImage.latest_amazon_linux2023(),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            security_group=self.bastion_sg,
            role=self.bastion_role,
            user_data=user_data,
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=20,
                        encrypted=True,
                        delete_on_termination=True,
                        volume_type=ec2.EbsDeviceVolumeType.GP3,
                    ),
                )
            ],
        )
        Tags.of(self.bastion).add("Name", f"tap-bastion-{self.env_name}")

    def create_application_tier(self) -> None:
        """ALB (HTTPS if cert provided; otherwise HTTP with 503 notice) + ASG (private)."""
        self.alb = elbv2.ApplicationLoadBalancer(
            self,
            "ApplicationLoadBalancer",
            vpc=self.vpc,
            internet_facing=True,
            load_balancer_name=f"tap-alb-{self.env_name}",
            security_group=self.alb_sg,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        # User data for app
        app_user_data = ec2.UserData.for_linux()
        app_user_data.add_commands(
            "yum update -y",
            "yum install -y docker",
            "systemctl enable docker",
            "systemctl start docker",
            "systemctl enable amazon-ssm-agent || true",
            "systemctl start amazon-ssm-agent || true",
            "docker run -d -p 8080:80 nginx:alpine",
        )

        launch_template = ec2.LaunchTemplate(
            self,
            "AppLaunchTemplate",
            launch_template_name=f"tap-app-template-{self.env_name}",
            instance_type=ec2.InstanceType(self.instance_type),
            machine_image=ec2.MachineImage.latest_amazon_linux2023(),
            security_group=self.app_sg,
            role=self.app_role,
            user_data=app_user_data,
            require_imdsv2=True,
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=20,
                        encrypted=True,
                        delete_on_termination=True,
                        volume_type=ec2.EbsDeviceVolumeType.GP3,
                    ),
                )
            ],
        )

        self.asg = autoscaling.AutoScalingGroup(
            self,
            "AppAutoScalingGroup",
            auto_scaling_group_name=f"tap-asg-{self.env_name}",
            vpc=self.vpc,
            launch_template=launch_template,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            min_capacity=1,
            max_capacity=3,
            desired_capacity=2,
            # No deprecated healthCheck usage; ALB target group health checks are defined below.
        )

        # Listener(s)
        if self.acm_cert_arn:
            certificate = acm.Certificate.from_certificate_arn(self, "AlbCert", self.acm_cert_arn)
            https_listener = self.alb.add_listener(
                "HTTPSListener",
                port=443,
                protocol=elbv2.ApplicationProtocol.HTTPS,
                certificates=[certificate],
                ssl_policy=elbv2.SslPolicy.TLS12_EXT,
                open=True,
            )
            https_listener.add_targets(
                "AppFleet",
                port=8080,
                protocol=elbv2.ApplicationProtocol.HTTP,
                targets=[self.asg],
                health_check=elbv2.HealthCheck(
                    enabled=True,
                    healthy_http_codes="200",
                    interval=Duration.seconds(30),
                    path="/",
                    port="8080",
                    timeout=Duration.seconds(5),
                    unhealthy_threshold_count=5,
                ),
            )
        else:
            # Synth/deploy fallback without certificate:
            # Expose port 80 with a fixed 503 response instructing to provide a cert.
            http_listener = self.alb.add_listener(
                "HTTPListener",
                port=80,
                protocol=elbv2.ApplicationProtocol.HTTP,
                open=True,
            )
            http_listener.add_action(
                "NoTLSConfigured",
                action=elbv2.ListenerAction.fixed_response(
                    status_code=503,
                    content_type="text/plain",
                    message_body="ALB requires TLS certificate. Re-deploy stack with -c acm_cert_arn=<arn>.",
                ),
            )

    def create_lambda_function(self) -> None:
        """Lambda in VPC with least-privilege role."""
        inline_code = """import json, os
def lambda_handler(event, context):
    return {
        "statusCode": 200,
        "body": json.dumps({
            "message": "Hello from secure Lambda!",
            "environment": os.environ.get("ENV_NAME", "unknown")
        })
    }"""

        # Use dedicated LogGroup (no deprecated 'log_retention')
        lg = logs.LogGroup(
            self,
            "ApiFunctionLogs",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY,
        )

        self.lambda_function = lambda_.Function(
            self,
            "ApiFunction",
            function_name=f"tap-api-{self.env_name}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline(inline_code),
            role=self.lambda_role,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS),
            security_groups=[self.lambda_sg],
            memory_size=self.lambda_memory_mb,
            timeout=Duration.seconds(30),
            environment={"ENV_NAME": self.env_name, "DATA_BUCKET": self.data_bucket.bucket_name},
            log_group=lg,
        )

    def create_api_gateway(self) -> None:
        """Regional API with TLS-only policy, Lambda integration."""
        deny_insecure = iam.PolicyStatement(
            effect=iam.Effect.DENY,
            principals=[iam.AnyPrincipal()],
            actions=["execute-api:Invoke"],
            resources=["*"],
            conditions={"Bool": {"aws:SecureTransport": "false"}},
        )
        allow_all_secure = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            principals=[iam.AnyPrincipal()],
            actions=["execute-api:Invoke"],
            resources=["*"],
        )

        self.api = apigateway.RestApi(
            self,
            "TapApi",
            rest_api_name=f"tap-api-{self.env_name}",
            description="Secure API",
            endpoint_configuration=apigateway.EndpointConfiguration(types=[apigateway.EndpointType.REGIONAL]),
            policy=iam.PolicyDocument(statements=[deny_insecure, allow_all_secure]),
        )

        integration = apigateway.LambdaIntegration(self.lambda_function)
        hello = self.api.root.add_resource("api").add_resource("v1").add_resource("hello")
        hello.add_method("GET", integration)

    def create_outputs(self) -> None:
        """Key outputs."""
        CfnOutput(self, "ALBDnsName", value=self.alb.load_balancer_dns_name, description="ALB DNS")
        CfnOutput(self, "APIEndpointURL", value=self.api.url, description="API base URL")
        CfnOutput(self, "DatabaseEndpoint", value=self.database.instance_endpoint.hostname, description="RDS endpoint")
        CfnOutput(self, "DataBucketName", value=self.data_bucket.bucket_name, description="Data bucket")
        CfnOutput(self, "LoggingBucketName", value=self.logging_bucket.bucket_name, description="Logs bucket")
        CfnOutput(self, "VPCId", value=self.vpc.vpc_id, description="VPC ID")
        CfnOutput(
            self,
            "PrivateSubnetIds",
            value=",".join([s.subnet_id for s in self.vpc.private_subnets]),
            description="Private subnet IDs",
        )

```