I'll generate the complete CDK (Python) code based on your specifications. Here's the production-grade implementation:

## `tap.py` (CDK App Entry Point)

```python
#!/usr/bin/env python3
"""
CDK App entry point for Nova Security Tap Stack.
Synthesizes to a single CloudFormation template in us-west-1.
"""

import aws_cdk as cdk
from lib.tap_stack import TapStack

app = cdk.App()

# Get context values with defaults
environment_name = app.node.try_get_context("EnvironmentName") or "dev"
vpc_cidr = app.node.try_get_context("VpcCidr") or "10.0.0.0/16"
allowed_ssh_cidrs = app.node.try_get_context("AllowedSshCidrs") or []
enable_bastion = app.node.try_get_context("EnableBastion") or False
alb_certificate_arn = app.node.try_get_context("AlbCertificateArn")
alarm_email = app.node.try_get_context("AlarmEmail")
enable_rds = app.node.try_get_context("EnableRds") or False
app_param_path = app.node.try_get_context("AppParamPath") or f"/nova/{environment_name}/app/"
app_secret_name = app.node.try_get_context("AppSecretName") or f"nova/{environment_name}/app/secret"

# Stack configuration
stack_name = f"Nova{environment_name.capitalize()}SecurityTapStack"
project_name = "IaC-NovaModelBreaking"

# Create the stack
TapStack(
    app,
    stack_name,
    environment_name=environment_name,
    vpc_cidr=vpc_cidr,
    allowed_ssh_cidrs=allowed_ssh_cidrs,
    enable_bastion=enable_bastion,
    alb_certificate_arn=alb_certificate_arn,
    alarm_email=alarm_email,
    enable_rds=enable_rds,
    app_param_path=app_param_path,
    app_secret_name=app_secret_name,
    project_name=project_name,
    env=cdk.Environment(region="us-west-1")
)

app.synth()

# To synthesize to a single YAML file, run:
# cdk synth "NovaDevSecurityTapStack" > cloudformation_security.yml
```

## `lib/tap_stack.py` (Main CDK Stack)

```python
"""
Nova Security Tap Stack - Production-grade secure web application infrastructure.
Implements least-privilege IAM, encryption at rest, controlled network access, and full observability.
"""

from typing import List, Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    aws_ec2 as ec2,
    aws_elbv2 as elbv2,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_ssm as ssm,
    aws_secretsmanager as secretsmanager,
    aws_cloudtrail as cloudtrail,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_kms as kms,
    aws_rds as rds,
    aws_autoscaling as autoscaling,
    CfnOutput,
    RemovalPolicy,
    Duration,
    Tags
)
from constructs import Construct


class TapStack(Stack):
    """
    Main CDK stack implementing secure, scalable web-app environment.
    
    Architecture:
    - VPC with public/private subnets across 2 AZs
    - ALB in public subnets
    - EC2 app instances in private subnets
    - S3, DynamoDB, Parameter Store, Secrets Manager
    - CloudTrail, CloudWatch monitoring
    - Least-privilege IAM throughout
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_name: str,
        vpc_cidr: str,
        allowed_ssh_cidrs: List[str],
        enable_bastion: bool,
        alb_certificate_arn: Optional[str],
        alarm_email: Optional[str],
        enable_rds: bool,
        app_param_path: str,
        app_secret_name: str,
        project_name: str,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Configuration constants
        self.environment_name = environment_name
        self.project_name = project_name
        self.app_port = 8080
        self.single_nat = True  # Cost-aware: single NAT Gateway
        
        # Apply consistent tags to all resources
        self._apply_tags()
        
        # Create KMS keys for encryption
        self.kms_key = self._create_kms_key()
        
        # Create VPC and networking
        self.vpc = self._create_vpc(vpc_cidr)
        
        # Create security groups
        self.security_groups = self._create_security_groups(allowed_ssh_cidrs, enable_bastion)
        
        # Create S3 buckets
        self.app_bucket, self.logs_bucket = self._create_s3_buckets()
        
        # Create DynamoDB table
        self.dynamo_table = self._create_dynamodb_table()
        
        # Create Parameter Store and Secrets Manager
        self.parameters = self._create_parameters(app_param_path)
        self.secret = self._create_secret(app_secret_name)
        
        # Create IAM role for EC2 instances
        self.instance_role = self._create_instance_role()
        
        # Create CloudWatch Log Group
        self.log_group = self._create_log_group()
        
        # Create ALB
        self.alb = self._create_alb(alb_certificate_arn)
        
        # Create EC2 instances (ASG)
        self.asg = self._create_auto_scaling_group()
        
        # Create bastion host if enabled
        self.bastion = self._create_bastion() if enable_bastion else None
        
        # Create RDS if enabled (or just the security group for demonstration)
        self.rds_instance = self._create_rds() if enable_rds else None
        
        # Create CloudTrail
        self.trail = self._create_cloudtrail()
        
        # Create CloudWatch alarms and SNS
        self.alarm, self.sns_topic = self._create_monitoring(alarm_email)
        
        # Create stack outputs
        self._create_outputs()

    def _apply_tags(self) -> None:
        """Apply consistent tags to all resources in the stack."""
        Tags.of(self).add("Project", self.project_name)
        Tags.of(self).add("Environment", self.environment_name)
        Tags.of(self).add("Owner", "CDK")
        Tags.of(self).add("CostCenter", "Engineering")
        Tags.of(self).add("SecurityTier", "Production")

    def _create_kms_key(self) -> kms.Key:
        """Create KMS key for encryption with proper key policy."""
        key = kms.Key(
            self,
            "NovaKmsKey",
            description=f"Nova {self.environment_name} encryption key",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY  # For demo; use RETAIN in production
        )
        
        # Allow CloudTrail to use the key
        key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AllowCloudTrailEncryption",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=[
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ],
                resources=["*"]
            )
        )
        
        return key

    def _create_vpc(self, vpc_cidr: str) -> ec2.Vpc:
        """Create VPC with public and private subnets across 2 AZs."""
        return ec2.Vpc(
            self,
            "NovaVpc",
            ip_addresses=ec2.IpAddresses.cidr(vpc_cidr),
            max_azs=2,
            nat_gateways=1 if self.single_nat else 2,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

    def _create_security_groups(self, allowed_ssh_cidrs: List[str], enable_bastion: bool) -> dict:
        """Create security groups with least-privilege access."""
        # ALB Security Group
        alb_sg = ec2.SecurityGroup(
            self,
            "NovaAlbSecurityGroup",
            vpc=self.vpc,
            description="Security group for Nova ALB",
            allow_all_outbound=True
        )
        
        # Allow HTTP from anywhere
        alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow HTTP from anywhere"
        )
        
        # Allow HTTPS from anywhere (will be used if certificate is provided)
        alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS from anywhere"
        )
        
        # App Security Group
        app_sg = ec2.SecurityGroup(
            self,
            "NovaAppSecurityGroup",
            vpc=self.vpc,
            description="Security group for Nova application instances",
            allow_all_outbound=True
        )
        
        # Allow app port from ALB only
        app_sg.add_ingress_rule(
            peer=alb_sg,
            connection=ec2.Port.tcp(self.app_port),
            description=f"Allow app port {self.app_port} from ALB"
        )
        
        # Allow SSH from specified CIDRs
        for cidr in allowed_ssh_cidrs:
            app_sg.add_ingress_rule(
                peer=ec2.Peer.ipv4(cidr),
                connection=ec2.Port.tcp(22),
                description=f"Allow SSH from {cidr}"
            )
        
        # Bastion Security Group (if enabled)
        bastion_sg = None
        if enable_bastion:
            bastion_sg = ec2.SecurityGroup(
                self,
                "NovaBastionSecurityGroup",
                vpc=self.vpc,
                description="Security group for Nova bastion host",
                allow_all_outbound=True
            )
            
            # Allow SSH from specified CIDRs to bastion
            for cidr in allowed_ssh_cidrs:
                bastion_sg.add_ingress_rule(
                    peer=ec2.Peer.ipv4(cidr),
                    connection=ec2.Port.tcp(22),
                    description=f"Allow SSH to bastion from {cidr}"
                )
            
            # Allow SSH from bastion to app instances
            app_sg.add_ingress_rule(
                peer=bastion_sg,
                connection=ec2.Port.tcp(22),
                description="Allow SSH from bastion"
            )
        
        # RDS Security Group (created regardless of enable_rds for demonstration)
        rds_sg = ec2.SecurityGroup(
            self,
            "NovaRdsSecurityGroup",
            vpc=self.vpc,
            description="Security group for Nova RDS - accepts from App SG only",
            allow_all_outbound=False
        )
        
        # Allow database port from app security group only
        rds_sg.add_ingress_rule(
            peer=app_sg,
            connection=ec2.Port.tcp(5432),  # PostgreSQL port
            description="Allow PostgreSQL from app instances only"
        )
        
        return {
            "alb": alb_sg,
            "app": app_sg,
            "bastion": bastion_sg,
            "rds": rds_sg
        }

    def _create_s3_buckets(self) -> tuple:
        """Create S3 buckets with encryption and security policies."""
        # Application data bucket
        app_bucket = s3.Bucket(
            self,
            "NovaAppBucket",
            bucket_name=f"nova-{self.environment_name}-app-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # For demo; use RETAIN in production
            auto_delete_objects=True  # For demo; remove in production
        )
        
        # Bucket policy to deny unencrypted uploads and non-TLS requests
        app_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyUnencryptedObjectUploads",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:PutObject"],
                resources=[app_bucket.arn_for_objects("*")],
                conditions={
                    "StringNotEquals": {
                        "s3:x-amz-server-side-encryption": "aws:kms"
                    }
                }
            )
        )
        
        app_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyNonTLSRequests",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[app_bucket.bucket_arn, app_bucket.arn_for_objects("*")],
                conditions={
                    "Bool": {
                        "aws:SecureTransport": "false"
                    }
                }
            )
        )
        
        # CloudTrail logs bucket
        logs_bucket = s3.Bucket(
            self,
            "NovaLogsBucket",
            bucket_name=f"nova-{self.environment_name}-logs-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # For demo
            auto_delete_objects=True  # For demo
        )
        
        # CloudTrail bucket policy
        logs_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="AWSCloudTrailAclCheck",
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=["s3:GetBucketAcl"],
                resources=[logs_bucket.bucket_arn]
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
                    "StringEquals": {
                        "s3:x-amz-acl": "bucket-owner-full-control"
                    }
                }
            )
        )
        
        return app_bucket, logs_bucket

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with encryption and on-demand billing."""
        return dynamodb.Table(
            self,
            "NovaDynamoTable",
            table_name=f"nova-{self.environment_name}-data",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            removal_policy=RemovalPolicy.DESTROY  # For demo
        )

    def _create_parameters(self, app_param_path: str) -> List[ssm.StringParameter]:
        """Create Parameter Store parameters."""
        parameters = []
        
        param_configs = [
            ("APP_ENV", self.environment_name),
            ("API_URL", f"https://api-{self.environment_name}.nova.example.com"),
            ("LOG_LEVEL", "INFO"),
            ("REGION", self.region)
        ]
        
        for param_name, param_value in param_configs:
            param = ssm.StringParameter(
                self,
                f"NovaParam{param_name}",
                parameter_name=f"{app_param_path}{param_name}",
                string_value=param_value,
                description=f"Nova {param_name} parameter for {self.environment_name}"
            )
            parameters.append(param)
        
        return parameters

    def _create_secret(self, app_secret_name: str) -> secretsmanager.Secret:
        """Create Secrets Manager secret."""
        return secretsmanager.Secret(
            self,
            "NovaAppSecret",
            secret_name=app_secret_name,
            description=f"Nova application secrets for {self.environment_name}",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username": "admin"}',
                generate_string_key="password",
                exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\\\"@"
            )
        )

    def _create_instance_role(self) -> iam.Role:
        """Create IAM role for EC2 instances with least-privilege permissions."""
        role = iam.Role(
            self,
            "NovaInstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for Nova application instances"
        )
        
        # SSM managed instance core for Session Manager
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
        )
        
        # CloudWatch Agent permissions
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy")
        )
        
        # Parameter Store read permissions (scoped to app path)
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                    "ssm:GetParametersByPath"
                ],
                resources=[
                    f"arn:aws:ssm:{self.region}:{self.account}:parameter{self.parameters[0].parameter_name.rsplit('/', 1)[0]}/*"
                ]
            )
        )
        
        # Secrets Manager read permissions (scoped to specific secret)
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["secretsmanager:GetSecretValue"],
                resources=[self.secret.secret_arn]
            )
        )
        
        # S3 app bucket permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                resources=[
                    self.app_bucket.bucket_arn,
                    self.app_bucket.arn_for_objects("*")
                ]
            )
        )
        
        # CloudWatch Logs permissions (scoped to specific log group)
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=[
                    f"arn:aws:logs:{self.region}:{self.account}:log-group:/nova/{self.environment_name}/app:*"
                ]
            )
        )
        
        return role

    def _create_log_group(self) -> logs.LogGroup:
        """Create CloudWatch Log Group for application logs."""
        return logs.LogGroup(
            self,
            "NovaAppLogGroup",
            log_group_name=f"/nova/{self.environment_name}/app",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

    def _create_alb(self, certificate_arn: Optional[str]) -> elbv2.ApplicationLoadBalancer:
        """Create Application Load Balancer with listeners."""
        alb = elbv2.ApplicationLoadBalancer(
            self,
            "NovaAlb",
            vpc=self.vpc,
            internet_facing=True,
            security_group=self.security_groups["alb"],
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC)
        )
        
        # Create target group
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
                unhealthy_threshold_count=3
            )
        )
        
        # HTTP listener
        http_listener = alb.add_listener(
            "NovaHttpListener",
            port=80,
            protocol=elbv2.ApplicationProtocol.HTTP,
            default_target_groups=[target_group]
        )
        
        # HTTPS listener if certificate is provided
        if certificate_arn:
            certificate = elbv2.ListenerCertificate.from_arn(certificate_arn)
            
            alb.add_listener(
                "NovaHttpsListener",
                port=443,
                protocol=elbv2.ApplicationProtocol.HTTPS,
                certificates=[certificate],
                default_target_groups=[target_group]
            )
            
            # Redirect HTTP to HTTPS
            http_listener.add_action(
                "RedirectToHttps",
                action=elbv2.ListenerAction.redirect(
                    protocol="HTTPS",
                    port="443",
                    permanent=True
                )
            )
        
        self.target_group = target_group
        return alb

    def _create_auto_scaling_group(self) -> autoscaling.AutoScalingGroup:
        """Create Auto Scaling Group with EC2 instances in private subnets."""
        # Get latest Amazon Linux 2023 AMI via SSM Parameter
        ami = ec2.MachineImage.from_ssm_parameter(
            "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
        )
        
        # User data script
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            
            # Install and configure CloudWatch agent
            f"""cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{{
  "logs": {{
    "logs_collected": {{
      "files": {{
        "collect_list": [
          {{
            "file_path": "/var/log/messages",
            "log_group_name": "{self.log_group.log_group_name}",
            "log_stream_name": "{{instance_id}}/messages"
          }}
        ]
      }}
    }}
  }},
  "metrics": {{
    "namespace": "Nova/{self.environment_name}",
    "metrics_collected": {{
      "cpu": {{
        "measurement": [
          "cpu_usage_idle",
          "cpu_usage_iowait",
          "cpu_usage_user",
          "cpu_usage_system"
        ],
        "metrics_collection_interval": 60
      }},
      "disk": {{
        "measurement": [
          "used_percent"
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "*"
        ]
      }},
      "mem": {{
        "measurement": [
          "mem_used_percent"
        ],
        "metrics_collection_interval": 60
      }}
    }}
  }}
}}
EOF""",
            
            # Start CloudWatch agent
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s",
            
            # Install application (placeholder)
            "yum install -y python3 python3-pip",
            f"echo 'Application will run on port {self.app_port}' > /var/log/app-setup.log",
            
            # Create simple health check endpoint
            f"""cat > /tmp/health_server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver

class HealthHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'text/plain')
            self.end_headers()
            self.wfile.write(b'OK')
        else:
            self.send_response(404)
            self.end_headers()

with socketserver.TCPServer(("", {self.app_port}), HealthHandler) as httpd:
    httpd.serve_forever()
EOF""",
            
            "chmod +x /tmp/health_server.py",
            "nohup python3 /tmp/health_server.py &"
        )
        
        # Launch template
        launch_template = ec2.LaunchTemplate(
            self,
            "NovaLaunchTemplate",
            machine_image=ami,
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            role=self.instance_role,
            security_group=self.security_groups["app"],
            user_data=user_data
        )
        
        # Auto Scaling Group
        asg = autoscaling.AutoScalingGroup(
            self,
            "NovaAutoScalingGroup",
            vpc=self.vpc,
            launch_template=launch_template,
            min_capacity=1,
            max_capacity=3,
            desired_capacity=1,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
        )
        
        # Attach to target group
        self.target_group.add_target(asg)
        
        return asg

    def _create_bastion(self) -> Optional[ec2.Instance]:
        """Create bastion host in public subnet if enabled."""
        ami = ec2.MachineImage.from_ssm_parameter(
            "/aws/service/ami-amazon-linux-latest/al2023-ami-kernel-6.1-x86_64"
        )
        
        return ec2.Instance(
            self,
            "NovaBastionHost",
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.NANO),
            machine_image=ami,
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PUBLIC),
            security_group=self.security_groups["bastion"],
            role=self.instance_role  # Reuse the same role for simplicity
        )

    def _create_rds(self) -> Optional[rds.DatabaseInstance]:
        """Create RDS instance in private subnets if enabled."""
        if not hasattr(self, 'rds_subnet_group'):
            self.rds_subnet_group = rds.SubnetGroup(
                self,
                "NovaRdsSubnetGroup",
                description="Subnet group for Nova RDS",
                vpc=self.vpc,
                vpc_subnets=ec2.SubnetSelection(subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS)
            )
        
        return rds.DatabaseInstance(
            self,
            "NovaRdsInstance",
            engine=rds.DatabaseInstanceEngine.postgres(
                version=rds.PostgresEngineVersion.VER_15_4
            ),
            instance_type=ec2.InstanceType.of(ec2.InstanceClass.T3, ec2.InstanceSize.MICRO),
            vpc=self.vpc,
            subnet_group=self.rds_subnet_group,
            security_groups=[self.security_groups["rds"]],
            database_name="novadb",
            credentials=rds.Credentials.from_generated_secret("dbadmin"),
            storage_encrypted=True,
            backup_retention=Duration.days(7),
            deletion_protection=False,  # For demo
            removal_policy=RemovalPolicy.DESTROY  # For demo
        )

    def _create_cloudtrail(self) -> cloudtrail.Trail:
        """Create CloudTrail for audit logging."""
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
            cloud_watch_logs_retention=logs.RetentionDays.ONE_MONTH
        )

    def _create_monitoring(self, alarm_email: Optional[str]) -> tuple:
        """Create CloudWatch alarms and SNS topic."""
        # SNS Topic for alarms
        sns_topic = None
        if alarm_email:
            sns_topic = sns.Topic(
                self,
                "NovaAlarmTopic",
                topic_name=f"nova-{self.environment_name}-alarms",
                display_name=f"Nova {self.environment_name} Alarms"
            )
            
            sns_topic.add_subscription(
                sns_subscriptions.EmailSubscription(alarm_email)
            )
        
        # CPU Utilization Alarm
        alarm = cloudwatch