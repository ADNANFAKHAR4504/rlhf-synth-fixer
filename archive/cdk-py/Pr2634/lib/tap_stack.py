"""tap_stack.py
Main CDK stack for the Nova (TAP) environment.

Creates a secure, scalable baseline with:
- VPC (public + private w/ NAT)
- ALB (public, HTTP only)
- ASG/EC2 (private) + least-privilege IAM (SSM-enabled; no SSH ingress)
- S3 (versioned, encrypted, public-blocked)
- DynamoDB (on-demand, encrypted)
- CloudTrail (multi-region) + encrypted S3
- CloudWatch logs + alarm (no SNS email)
- SSM Parameter Store + Secrets Manager
"""

from __future__ import annotations

from typing import Dict, List, Optional, Tuple

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    RemovalPolicy,
    Tags,
    aws_autoscaling as autoscaling,
    aws_cloudtrail as cloudtrail,
    aws_cloudwatch as cloudwatch,
    aws_dynamodb as dynamodb,
    aws_ec2 as ec2,
    aws_elasticloadbalancingv2 as elbv2,
    aws_iam as iam,
    aws_kms as kms,
    aws_logs as logs,
    aws_rds as rds,
    aws_s3 as s3,
    aws_secretsmanager as secretsmanager,
    aws_ssm as ssm,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """Properties for TapStack.

    Attributes:
        environment_suffix: Suffix for env naming, e.g., 'dev' or 'prod'.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs) -> None:
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """Main stack implementing the secure baseline."""

    _DEFAULT_PROJECT_NAME = "IaC - AWS Nova Model Breaking"
    _DEFAULT_APP_PORT = 8080
    _DEFAULT_VPC_CIDR = "10.0.0.0/16"

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs,
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Resolve environment + context
        self.environment_name: str = (
            (props.environment_suffix if props else None)
            or self.node.try_get_context("environmentSuffix")
            or "dev"
        )
        if cdk.Stack.of(self).region != "us-west-1":
            cdk.Annotations.of(self).add_warning(
                f"Stack region is {cdk.Stack.of(self).region}. "
                "Requirement is us-west-1."
            )

        self.project_name: str = self._DEFAULT_PROJECT_NAME
        self.app_port: int = self._DEFAULT_APP_PORT
        self.single_nat: bool = True  # cost-aware default

        # Context-driven inputs (kept minimal; no ACM/SSH CIDRs/AlarmEmail)
        self.vpc_cidr: str = (
            self.node.try_get_context("vpcCidr") or self._DEFAULT_VPC_CIDR
        )

        # Parameter/secret naming
        default_param_path = f"/nova/{self.environment_name}/app/"
        default_secret_name = f"nova/{self.environment_name}/app/secret"
        self.app_param_path: str = (
            self.node.try_get_context("appParamPath") or default_param_path
        )
        self.app_secret_name: str = (
            self.node.try_get_context("appSecretName") or default_secret_name
        )

        # Tagging
        self._apply_tags()

        # KMS for encryption
        self.kms_key: kms.Key = self._create_kms_key()

        # Networking
        self.vpc: ec2.Vpc = self._create_vpc(self.vpc_cidr)

        # Security Groups (no SSH ingress; SSM only)
        self.security_groups: Dict[str, ec2.SecurityGroup] = (
            self._create_security_groups()
        )

        # Storage / Data
        self.app_bucket, self.logs_bucket = self._create_s3_buckets()
        self.dynamo_table: dynamodb.Table = self._create_dynamodb_table()

        # Parameters & Secrets
        self.parameters: List[ssm.StringParameter] = self._create_parameters(
            self.app_param_path
        )
        self.secret: secretsmanager.Secret = self._create_secret(self.app_secret_name)

        # IAM for EC2
        self.instance_role: iam.Role = self._create_instance_role()

        # Logs
        self.log_group: logs.LogGroup = self._create_log_group()

        # ALB + Target Group (HTTP only)
        self.alb: elbv2.ApplicationLoadBalancer = self._create_alb()

        # Compute (ASG/EC2 in private subnets)
        self.asg: autoscaling.AutoScalingGroup = self._create_auto_scaling_group()

        # Optional RDS (guarded by SG accepting only App SG)
        self.enable_rds: bool = bool(self.node.try_get_context("enableRds") or False)
        self.rds_instance: Optional[rds.DatabaseInstance] = (
            self._create_rds() if self.enable_rds else None
        )

        # CloudTrail (multi-region)
        self.trail: cloudtrail.Trail = self._create_cloudtrail()

        # Monitoring / alarm (no SNS email)
        self.alarm: cloudwatch.Alarm = self._create_monitoring()

        # Outputs
        self._create_outputs()

    # ------------------------
    # Helpers / resource steps
    # ------------------------

    def _apply_tags(self) -> None:
        """Apply consistent tags."""
        Tags.of(self).add("Project", self.project_name)
        Tags.of(self).add("Environment", self.environment_name)
        Tags.of(self).add("Owner", "CDK")
        Tags.of(self).add("CostCenter", "Engineering")
        Tags.of(self).add("SecurityTier", "Production")

    def _create_kms_key(self) -> kms.Key:
        """KMS key with CloudTrail permissions; rotation on."""
        key = kms.Key(
            self,
            "NovaKmsKey",
            description=f"Nova {self.environment_name} encryption key",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY,  # change to RETAIN in prod
        )
        key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AllowCloudTrailEncryption",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["kms:GenerateDataKey*", "kms:DescribeKey"],
                resources=["*"],
            )
        )
        return key

    def _create_vpc(self, vpc_cidr: str) -> ec2.Vpc:
        """VPC split public/private (egress) over 2 AZs. Single NAT default."""
        return ec2.Vpc(
            self,
            "NovaVpc",
            ip_addresses=ec2.IpAddresses.cidr(vpc_cidr),
            max_azs=2,
            nat_gateways=1 if self.single_nat else 2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="Public",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24,
                ),
                ec2.SubnetConfiguration(
                    name="Private",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24,
                ),
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True,
        )

    def _create_security_groups(self) -> Dict[str, ec2.SecurityGroup]:
        """Create SGs: ALB, App, RDS (ingress from App only)."""
        alb_sg = ec2.SecurityGroup(
            self,
            "NovaAlbSecurityGroup",
            vpc=self.vpc,
            description="Security group for Nova ALB",
            allow_all_outbound=True,
        )
        alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP from anywhere",
        )

        app_sg = ec2.SecurityGroup(
            self,
            "NovaAppSecurityGroup",
            vpc=self.vpc,
            description="Security group for Nova application instances",
            allow_all_outbound=True,
        )
        app_sg.add_ingress_rule(
            peer=alb_sg,
            connection=ec2.Port.tcp(self.app_port),
            description=f"Allow app port {self.app_port} from ALB",
        )
        # NOTE: No SSH ingress. Access via SSM Session Manager only.

        rds_sg = ec2.SecurityGroup(
            self,
            "NovaRdsSecurityGroup",
            vpc=self.vpc,
            description="RDS SG allows only from App SG",
            allow_all_outbound=False,
        )
        rds_sg.add_ingress_rule(
            peer=app_sg,
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL from app only",
        )

        return {"alb": alb_sg, "app": app_sg, "rds": rds_sg}

    def _create_s3_buckets(self) -> Tuple[s3.Bucket, s3.Bucket]:
        """Create app bucket (versioned, KMS) and dedicated logs bucket."""
        app_bucket = s3.Bucket(
            self,
            "NovaAppBucket",
            bucket_name=(
                f"nova-{self.environment_name}-app-{self.account}-{self.region}"
            ),
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # change to RETAIN in prod
            auto_delete_objects=True,  # demo only
        )
        app_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyUnencryptedObjectUploads",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[app_bucket.arn_for_objects("*")],
                conditions={
                    "StringNotEquals": {"s3:x-amz-server-side-encryption": "aws:kms"}
                },
            )
        )
        app_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyNonTLSRequests",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[app_bucket.bucket_arn, app_bucket.arn_for_objects("*")],
                conditions={"Bool": {"aws:SecureTransport": "false"}},
            )
        )

        logs_bucket = s3.Bucket(
            self,
            "NovaLogsBucket",
            bucket_name=(
                f"nova-{self.environment_name}-logs-{self.account}-{self.region}"
            ),
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # demo
            auto_delete_objects=True,  # demo
        )
        logs_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSCloudTrailAclCheck",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:GetBucketAcl"],
                resources=[logs_bucket.bucket_arn],
            )
        )
        logs_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSCloudTrailWrite",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:PutObject"],
                resources=[logs_bucket.arn_for_objects("*")],
                conditions={
                    "StringEquals": {"s3:x-amz-acl": "bucket-owner-full-control"}
                },
            )
        )

        return app_bucket, logs_bucket

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """DynamoDB w/ PAY_PER_REQUEST + SSE."""
        return dynamodb.Table(
            self,
            "NovaDynamoTable",
            table_name=f"nova-{self.environment_name}-data",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            removal_policy=RemovalPolicy.DESTROY,  # demo
        )

    def _create_parameters(self, app_param_path: str) -> List[ssm.StringParameter]:
        """Create a few SSM parameters under the configured path."""
        prefix = app_param_path if app_param_path.endswith("/") else f"{app_param_path}/"

        param_defs = [
            ("APP_ENV", self.environment_name),
            ("API_URL", f"https://api-{self.environment_name}.nova.example.com"),
            ("LOG_LEVEL", "INFO"),
            ("REGION", self.region),
        ]
        created: List[ssm.StringParameter] = []
        for key, value in param_defs:
            created.append(
                ssm.StringParameter(
                    self,
                    f"NovaParam{key}",
                    parameter_name=f"{prefix}{key}",
                    string_value=value,
                    description=f"Nova {key} for {self.environment_name}",
                )
            )
        return created

    def _create_secret(self, app_secret_name: str) -> secretsmanager.Secret:
        """Create Secrets Manager secret with generated password."""
        return secretsmanager.Secret(
            self,
            "NovaAppSecret",
            secret_name=app_secret_name,
            description=f"Nova application secret for {self.environment_name}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "admin"}',
                generate_string_key="password",
                exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\\\"@",
            ),
        )

    def _create_instance_role(self) -> iam.Role:
        """Least-privilege EC2 instance role."""
        role = iam.Role(
            self,
            "NovaInstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for Nova application instances",
        )

        # SSM core (Session Manager)
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "AmazonSSMManagedInstanceCore"
            )
        )
        # CloudWatch Agent policy
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "CloudWatchAgentServerPolicy"
            )
        )

        # SSM Parameter Store (scoped to prefix)
        prefix = (
            self.app_param_path
            if self.app_param_path.endswith("/")
            else f"{self.app_param_path}/"
        )
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath",
                ],
                resources=[f"arn:aws:ssm:{self.region}:{self.account}:parameter{prefix}*"],
            )
        )

        # Secrets Manager (only this secret)
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["secretsmanager:GetSecretValue"],
                resources=[self.secret.secret_arn],
            )
        )

        # S3 app bucket (scoped)
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket",
                ],
                resources=[self.app_bucket.bucket_arn, self.app_bucket.arn_for_objects("*")],
            )
        )

        # CloudWatch Logs to the specific log group
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=[
                    f"arn:aws:logs:{self.region}:{self.account}:"
                    f"log-group:/nova/{self.environment_name}/app:*"
                ],
            )
        )

        return role

    def _create_log_group(self) -> logs.LogGroup:
        """Log group for application logs (30d retention)."""
        return logs.LogGroup(
            self,
            "NovaAppLogGroup",
            log_group_name=f"/nova/{self.environment_name}/app",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY,  # demo
        )

    def _create_alb(self) -> elbv2.ApplicationLoadBalancer:
        """ALB + HTTP (no HTTPS)."""
        alb = elbv2.ApplicationLoadBalancer(
            self,
            "NovaAlb",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.security_groups["alb"],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
        )

        # Target group
        target_group = elbv2.ApplicationTargetGroup(
            self,
            "NovaAppTargetGroup",
            port=self.app_port,
            protocol=elbv2.ApplicationProtocol.HTTP,
            vpc=self.vpc,
            target_type=elbv2.TargetType.INSTANCE,
            health_check=elbv2.HealthCheck(
                enabled=True,
                healthy_http_codes="200",
                interval=Duration.seconds(30),
                path="/health",
                port=str(self.app_port),
                protocol=elbv2.Protocol.HTTP,
                timeout=Duration.seconds(5),
                unhealthy_threshold_count=3,
            ),
        )

        # HTTP listener only
        alb.add_listener(
            "NovaHttpListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group],
        )

        self.target_group = target_group
        return alb

    def _create_auto_scaling_group(self) -> autoscaling.AutoScalingGroup:
        """ASG using AL2023 SSM parameter AMI in private subnets."""
        ami = ec2.MachineImage.from_ssm_parameter(
            parameter_name=(
                "/aws/service/ami-amazon-linux-latest/"
                "al2023-ami-kernel-6.1-x86_64"
            ),
            os=ec2.OperatingSystemType.LINUX,
        )

        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "set -euo pipefail",
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent python3 python3-pip",
            # CloudWatch Agent config
            "cat > /opt/aws/amazon-cloudwatch-agent/etc/"
            "amazon-cloudwatch-agent.json << 'EOF'",
            "{",
            '  "logs": {',
            '    "logs_collected": {',
            '      "files": {',
            '        "collect_list": [',
            "          {",
            '            "file_path": "/var/log/messages",',
            f'            "log_group_name": "/nova/{self.environment_name}/app",',
            '            "log_stream_name": "{instance_id}/messages"',
            "          }",
            "        ]",
            "      }",
            "    }",
            "  },",
            '  "metrics": {',
            f'    "namespace": "Nova/{self.environment_name}",',
            '    "metrics_collected": {',
            '      "cpu": {',
            '        "measurement": [',
            '          "cpu_usage_idle", "cpu_usage_iowait",',
            '          "cpu_usage_user", "cpu_usage_system"',
            "        ],",
            '        "metrics_collection_interval": 60',
            "      },",
            '      "disk": {',
            '        "measurement": ["used_percent"],',
            '        "metrics_collection_interval": 60,',
            '        "resources": ["*"]',
            "      },",
            '      "mem": {',
            '        "measurement": ["mem_used_percent"],',
            '        "metrics_collection_interval": 60',
            "      }",
            "    }",
            "  }",
            "}",
            "EOF",
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl "
            "-a fetch-config -m ec2 "
            "-c file:/opt/aws/amazon-cloudwatch-agent/etc/"
            "amazon-cloudwatch-agent.json -s",
            # Minimal HTTP health endpoint
            "cat > /tmp/health_server.py << 'EOF'",
            "#!/usr/bin/env python3",
            "import http.server",
            "import socketserver",
            "",
            "class HealthHandler(http.server.SimpleHTTPRequestHandler):",
            "    def do_GET(self):",
            "        if self.path == '/health':",
            "            self.send_response(200)",
            "            self.send_header('Content-type', 'text/plain')",
            "            self.end_headers()",
            "            self.wfile.write(b'OK')",
            "        else:",
            "            self.send_response(404)",
            "            self.end_headers()",
            "",
            f"with socketserver.TCPServer(('', {self.app_port}), "
            "HealthHandler) as httpd:",
            "    httpd.serve_forever()",
            "EOF",
            "chmod +x /tmp/health_server.py",
            "nohup python3 /tmp/health_server.py &",
        )

        launch_template = ec2.LaunchTemplate(
            self,
            "NovaLaunchTemplate",
            machine_image=ami,
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, ec2.InstanceSize.MICRO
            ),
            role=self.instance_role,
            security_group=self.security_groups["app"],
            user_data=user_data,
        )

        asg = autoscaling.AutoScalingGroup(
            self,
            "NovaAutoScalingGroup",
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=1,
            max_capacity=3,
            desired_capacity=1,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )

        self.target_group.add_target(asg)
        return asg

    def _create_rds(self) -> rds.DatabaseInstance:
        """Private RDS (PostgreSQL 15 pinned via L1 override) with App-only SG."""
        subnet_group = rds.SubnetGroup(
            self,
            "NovaRdsSubnetGroup",
            description="Subnet group for Nova RDS",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
        )
        db = rds.DatabaseInstance(
            self,
            "NovaRdsInstance",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.T3, ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=subnet_group,
            security_groups=[self.security_groups["rds"]],
            database_name="novadb",
            credentials=rds.Credentials.from_generated_secret("dbadmin"),
            storage_encrypted=True,
            backup_retention=Duration.days(7),
            deletion_protection=False,           # demo
            removal_policy=RemovalPolicy.DESTROY,  # demo
            auto_minor_version_upgrade=False,    # pin patch (see L1 override)
        )
        # L1 override to set exact patch version (e.g., 15.14)
        cfn_db = db.node.default_child
        if isinstance(cfn_db, rds.CfnDBInstance):
            cfn_db.engine_version = "15.14"
        return db

    def _create_cloudtrail(self) -> cloudtrail.Trail:
        """Organization/account audit trail (multi-region)."""
        return cloudtrail.Trail(
            self,
            "NovaCloudTrail",
            trail_name=f"nova-{self.environment_name}-trail",
            bucket=self.logs_bucket,
            encryption_key=self.kms_key,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_file_validation=True,
            send_to_cloud_watch_logs=True,
            cloud_watch_logs_retention=logs.RetentionDays.ONE_MONTH,
        )

    def _create_monitoring(self) -> cloudwatch.Alarm:
        """CPU alarm on ASG; no SNS actions."""
        # Some CDK versions do not expose asg.metric_cpu_utilization().
        # Use a direct CloudWatch metric instead.
        metric = cloudwatch.Metric(
            namespace="AWS/EC2",
            metric_name="CPUUtilization",
            dimensions_map={"AutoScalingGroupName": self.asg.auto_scaling_group_name},
            statistic="Average",
            period=Duration.minutes(5),
        )
        alarm = cloudwatch.Alarm(
            self,
            "NovaEc2CpuHigh",
            metric=metric,
            evaluation_periods=1,
            threshold=70,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            datapoints_to_alarm=1,
            alarm_description="EC2 ASG average CPU >= 70% for 5 minutes.",
        )
        return alarm

    def _create_outputs(self) -> None:
        """Key outputs for integration tests and operator visibility."""
        cdk.CfnOutput(self, "VpcId", value=self.vpc.vpc_id)
        cdk.CfnOutput(self, "AlbDnsName", value=self.alb.load_balancer_dns_name)
        cdk.CfnOutput(
            self,
            "AppSecurityGroupId",
            value=self.security_groups["app"].security_group_id,
        )
        cdk.CfnOutput(
            self,
            "AlbSecurityGroupId",
            value=self.security_groups["alb"].security_group_id,
        )

        private_ids = self.vpc.select_subnets(
            subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
        ).subnet_ids
        public_ids = self.vpc.select_subnets(
            subnet_type=ec2.SubnetType.PUBLIC
        ).subnet_ids

        cdk.CfnOutput(self, "PrivateSubnetIds", value=",".join(private_ids))
        cdk.CfnOutput(self, "PublicSubnetIds", value=",".join(public_ids))
        cdk.CfnOutput(self, "AppBucketName", value=self.app_bucket.bucket_name)
        cdk.CfnOutput(self, "DynamoTableName", value=self.dynamo_table.table_name)
        cdk.CfnOutput(self, "SecretArn", value=self.secret.secret_arn)
        cdk.CfnOutput(self, "ParamPath", value=self.app_param_path)
        cdk.CfnOutput(self, "TrailName", value=f"nova-{self.environment_name}-trail")
        cdk.CfnOutput(self, "AlarmName", value="NovaEc2CpuHigh")

        if self.rds_instance:
            cdk.CfnOutput(
                self,
                "RdsEndpoint",
                value=self.rds_instance.db_instance_endpoint_address,
            )
