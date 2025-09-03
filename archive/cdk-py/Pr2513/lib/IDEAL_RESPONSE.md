``````python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    CfnParameter,
    CfnOutput,
    Tags,
    NestedStack,
    Duration,
    RemovalPolicy,
    Environment,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_s3 as s3,
    aws_cloudwatch_actions as cw_actions,
    aws_cloudfront as cloudfront,
    aws_cloudfront_origins as origins,
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    aws_sns_subscriptions as sns_subscriptions,
    aws_logs as logs,
)
from constructs import Construct
import json


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    """

    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties, 
      CDK context, or defaults to 'dev'.
    Note:
      - Do NOT create AWS resources directly in this stack.
      - Instead, instantiate separate stacks for each resource type within this stack.

    Args:
      scope (Construct): The parent construct.
      construct_id (str): The unique identifier for this stack.
      props (Optional[TapStackProps]): Optional properties for configuring the 
        stack, including environment suffix.
      **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
      environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        # Ensure the stack uses us-west-2 region
        if 'env' not in kwargs:
            kwargs['env'] = cdk.Environment(region='us-west-2')
        elif not kwargs['env'].region:
            kwargs['env'] = cdk.Environment(
                account=kwargs['env'].account if 'account' in kwargs['env'].__dict__ else None,
                region='us-west-2'
            )
        
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        Tags.of(self).add("Project", "CloudMigration")
        Tags.of(self).add("Environment", self.environment_suffix)
        Tags.of(self).add("ManagedBy", "CDK")
        Tags.of(self).add("CostCenter", "IT-Infrastructure")

        # Initialize all components
        self._create_parameters()
        self._create_vpc()
        self._create_s3_bucket()
        self._create_security_groups()
        self._create_iam_roles()
        self._create_ec2_instance()
        self._create_cloudfront_distribution()
        self._create_monitoring()
        self._create_outputs()

    def _create_parameters(self):
        """Create CloudFormation parameters for customization."""
        
        self.instance_type_param = CfnParameter(
            self, "InstanceType",
            type="String",
            default="t3.micro",
            allowed_values=["t3.micro", "t3.small", "t3.medium", "t3.large"],
            description="EC2 instance type for web server"
        )
        
        self.key_pair_param = CfnParameter(
            self, "KeyPairName",
            type="String",
            default="cloudmigration-cdkpy-task",
            description="EC2 Key Pair name for SSH access",
            min_length=1
        )
        
        self.ssh_ip_param = CfnParameter(
            self, "AllowedSSHIP",
            type="String",
            default="192.168.1.1/32",
            description="Allowed IP for SSH access (CIDR format)",
            allowed_pattern=r"^(\d{1,3}\.){3}\d{1,3}/\d{1,2}$"
        )
        
        self.notification_email_param = CfnParameter(
            self, "NotificationEmail",
            type="String",
            description="Email for CloudWatch alarm notifications",
            default="admin@admin.com",
            allowed_pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$"
        )
        
        self.cpu_threshold_param = CfnParameter(
            self, "CPUThreshold",
            type="Number",
            default=80,
            min_value=1,
            max_value=100,
            description="CPU utilization alarm threshold (%)"
        )

    def _create_vpc(self):
        """Create VPC with public and private subnets."""
        
        # Create VPC - Fixed to ensure proper subnet creation
        self.vpc = ec2.Vpc(
            self, "CloudMigrationVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            enable_dns_hostnames=True,
            enable_dns_support=True,
            max_azs=2,
            nat_gateways=1,  # For private subnet internet access
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
            ]
        )
        
        # Create VPC Flow Logs
        flow_log_role = iam.Role(
            self, "VPCFlowLogRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com")
        )
        
        # Add inline policy with correct permissions for VPC Flow Logs
        flow_log_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                ],
                resources=["*"]
            )
        )
        
        flow_log_group = logs.LogGroup(
            self, "VPCFlowLogGroup",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        ec2.FlowLog(
            self, "VPCFlowLog",
            resource_type=ec2.FlowLogResourceType.from_vpc(self.vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                flow_log_group, flow_log_role
            )
        )

    def _create_s3_bucket(self):
        """Create S3 bucket with security and lifecycle policies."""
        
        # Access logging bucket
        self.access_log_bucket = s3.Bucket(
            self, "AccessLogBucket",
            bucket_name=f"cloudmigration699-acc-logs-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    enabled=True,
                    expiration=Duration.days(90)
                )
            ]
        )
        
        # Main S3 bucket
        self.s3_bucket = s3.Bucket(
            self, "CloudMigrationS3Bucket",
            bucket_name="cloudmigration-s3-tap",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            server_access_logs_bucket=self.access_log_bucket,
            server_access_logs_prefix="main-bucket-logs/",
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="LogsLifecycle",
                    enabled=True,
                    prefix="logs/",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ],
                    expiration=Duration.days(365)
                ),
                s3.LifecycleRule(
                    id="AbortIncompleteMultipart",
                    enabled=True,
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ]
        )
        
        # CloudFront logs bucket - with ACLs enabled for CloudFront
        self.cloudfront_log_bucket = s3.Bucket(
            self, "CloudFrontLogBucket",
            bucket_name=f"cloudmigration-cf-logs-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.S3_MANAGED,
            object_ownership=s3.ObjectOwnership.BUCKET_OWNER_PREFERRED,
            access_control=s3.BucketAccessControl.LOG_DELIVERY_WRITE,
            block_public_access=s3.BlockPublicAccess(
                block_public_acls=False,
                block_public_policy=True,
                ignore_public_acls=False,
                restrict_public_buckets=True
            ),
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldCloudFrontLogs",
                    enabled=True,
                    expiration=Duration.days(90)
                )
            ]
        )

    def _create_security_groups(self):
        """Create security groups for web and SSH access."""
        
        # Web traffic security group
        self.web_sg = ec2.SecurityGroup(
            self, "WebSecurityGroup",
            vpc=self.vpc,
            description="Allow HTTP/HTTPS traffic",
            allow_all_outbound=True
        )
        
        self.web_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="HTTP from anywhere"
        )
        
        self.web_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="HTTPS from anywhere"
        )
        
        # SSH security group
        self.ssh_sg = ec2.SecurityGroup(
            self, "SSHSecurityGroup",
            vpc=self.vpc,
            description="SSH access from specific IP",
            allow_all_outbound=True
        )
        
        self.ssh_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.ssh_ip_param.value_as_string),
            connection=ec2.Port.tcp(22),
            description="SSH from allowed IP"
        )

    def _create_iam_roles(self):
        """Create IAM roles with least privilege access."""
        
        # EC2 instance role
        self.ec2_role = iam.Role(
            self, "EC2Role",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("CloudWatchAgentServerPolicy"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
            ]
        )
        
        # S3 access policy (least privilege)
        self.ec2_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:PutObject",
                    "s3:GetObject",
                    "s3:ListBucket"
                ],
                resources=[
                    self.s3_bucket.bucket_arn,
                    f"{self.s3_bucket.bucket_arn}/*"
                ]
            )
        )
        
        # CloudWatch permissions
        self.ec2_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "cloudwatch:PutMetricData",
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=["*"]
            )
        )

    def _create_ec2_instance(self):
        """Create EC2 instance with Apache and monitoring."""
        
        # Create key pair   
        self.key_pair = ec2.KeyPair(
            self, "EC2KeyPair",
            key_pair_name=f"cloudmigration-keypair-{self.environment_suffix}",
            type=ec2.KeyPairType.RSA,
            format=ec2.KeyPairFormat.PEM
        )
        
        # User data script
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y httpd",
            "systemctl start httpd",
            "systemctl enable httpd",
            
            # Create custom index.html
            "cat > /var/www/html/index.html << 'EOF'",
            "<!DOCTYPE html>",
            "<html>",
            "<head><title>CloudMigration Web Server</title></head>",
            "<body>",
            "<h1>🚀 CloudMigration Web Server</h1>",
            "<h2>Instance Information</h2>",
            "<p><strong>Instance ID:</strong> <span id='instance-id'>Loading...</span></p>",
            "<p><strong>Instance Type:</strong> <span id='instance-type'>Loading...</span></p>",
            "<p><strong>Availability Zone:</strong> <span id='az'>Loading...</span></p>",
            "<p><strong>Public IP:</strong> <span id='public-ip'>Loading...</span></p>",
            "<p><strong>Server Time:</strong> <span id='time'>Loading...</span></p>",
            "<script>",
            "fetch('http://169.254.169.254/latest/api/token', {",
            "method: 'PUT',",
            "headers: {'X-aws-ec2-metadata-token-ttl-seconds': '21600'}",
            "}).then(response => response.text()).then(token => {",
            "const headers = {'X-aws-ec2-metadata-token': token};",
            "Promise.all([",
            "fetch('http://169.254.169.254/latest/meta-data/instance-id', {headers}).then(r => r.text()),",
            "fetch('http://169.254.169.254/latest/meta-data/instance-type', {headers}).then(r => r.text()),",
            "fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone', {headers}).then(r => r.text()),",
            "fetch('http://169.254.169.254/latest/meta-data/public-ipv4', {headers}).then(r => r.text())",
            "]).then(([id, type, az, ip]) => {",
            "document.getElementById('instance-id').textContent = id;",
            "document.getElementById('instance-type').textContent = type;",
            "document.getElementById('az').textContent = az;",
            "document.getElementById('public-ip').textContent = ip;",
            "});});",
            "setInterval(() => {",
            "document.getElementById('time').textContent = new Date().toLocaleString();",
            "}, 1000);",
            "</script>",
            "</body>",
            "</html>",
            "EOF",
            
            # Install CloudWatch agent
            "wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm",
            "rpm -U ./amazon-cloudwatch-agent.rpm",
            
            # Configure CloudWatch agent
            "cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'",
            json.dumps({
                "agent": {
                    "metrics_collection_interval": 60
                },
                "metrics": {
                    "namespace": "CloudMigration/EC2",
                    "metrics_collected": {
                        "cpu": {
                            "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"],
                            "metrics_collection_interval": 60
                        },
                        "disk": {
                            "measurement": ["used_percent"],
                            "metrics_collection_interval": 60,
                            "resources": ["*"]
                        },
                        "mem": {
                            "measurement": ["mem_used_percent"],
                            "metrics_collection_interval": 60
                        }
                    }
                },
                "logs": {
                    "logs_collected": {
                        "files": {
                            "collect_list": [
                                {
                                    "file_path": "/var/log/httpd/access_log",
                                    "log_group_name": "/aws/ec2/apache/access",
                                    "log_stream_name": "{instance_id}"
                                },
                                {
                                    "file_path": "/var/log/httpd/error_log",
                                    "log_group_name": "/aws/ec2/apache/error",
                                    "log_stream_name": "{instance_id}"
                                }
                            ]
                        }
                    }
                }
            }),
            "EOF",
            
            # Start CloudWatch agent
            "/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s",
            
            # Create log upload script
            f"cat > /usr/local/bin/upload-logs.sh << 'EOF'",
            "#!/bin/bash",
            f"aws s3 sync /var/log/httpd/ s3://{self.s3_bucket.bucket_name}/logs/apache/$(curl -s http://169.254.169.254/latest/meta-data/instance-id)/",
            "EOF",
            "chmod +x /usr/local/bin/upload-logs.sh",
            
            # Schedule log uploads
            "echo '0 2 * * * root /usr/local/bin/upload-logs.sh' >> /etc/crontab"
        )
        
        # Create EC2 instance - FIXED subnet selection
        self.ec2_instance = ec2.Instance(
            self, "WebServer",
            instance_type=ec2.InstanceType(self.instance_type_param.value_as_string),
            machine_image=ec2.MachineImage.latest_amazon_linux2023(),
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC  # Use subnet type instead of specific subnets
            ),
            security_group=self.web_sg,
            role=self.ec2_role,
            key_pair=self.key_pair,
            user_data=user_data,
            require_imdsv2=True,
            detailed_monitoring=True,
            block_devices=[
                ec2.BlockDevice(
                    device_name="/dev/xvda",
                    volume=ec2.BlockDeviceVolume.ebs(
                        volume_size=20,
                        volume_type=ec2.EbsDeviceVolumeType.GP3,
                        encrypted=True,
                        delete_on_termination=True
                    )
                )
            ]
        )
        self.ec2_instance.add_security_group(self.ssh_sg)

    def _create_cloudfront_distribution(self):
        """Create CloudFront distribution with S3 origin."""
        
        # Use Origin Access Identity instead of OAC
        oai = cloudfront.OriginAccessIdentity(
            self, "S3OAI",
            comment=f"OAI for {self.s3_bucket.bucket_name}"
        )
        
        # Grant read permissions to OAI
        self.s3_bucket.grant_read(oai)
        
        # CloudFront distribution
        self.cloudfront_distribution = cloudfront.Distribution(
            self, "CloudFrontDistribution",
            default_behavior=cloudfront.BehaviorOptions(
                origin=origins.S3Origin(
                    self.s3_bucket,
                    origin_access_identity=oai
                ),
                viewer_protocol_policy=cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                allowed_methods=cloudfront.AllowedMethods.ALLOW_GET_HEAD,
                cached_methods=cloudfront.CachedMethods.CACHE_GET_HEAD,
                cache_policy=cloudfront.CachePolicy.CACHING_OPTIMIZED,
                compress=True
            ),
            price_class=cloudfront.PriceClass.PRICE_CLASS_100,
            enabled=True,
            comment="CloudMigration CDN Distribution",
            default_root_object="index.html",
            enable_logging=True,
            log_bucket=self.cloudfront_log_bucket,
            log_file_prefix="cloudfront-logs/"
        )
        
        # Grant CloudFront access to S3 bucket
        self.s3_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                principals=[iam.ServicePrincipal("cloudfront.amazonaws.com")],
                actions=["s3:GetObject"],
                resources=[f"{self.s3_bucket.bucket_arn}/*"],
                conditions={
                    "StringEquals": {
                        "AWS:SourceArn": f"arn:aws:cloudfront::{self.account}:distribution/{self.cloudfront_distribution.distribution_id}"
                    }
                }
            )
        )

    def _create_monitoring(self):
        """Create comprehensive monitoring and alerting."""
        
        # SNS topic for alerts
        self.sns_topic = sns.Topic(
            self, "AlertsTopic",
            display_name="CloudMigration Alerts"
        )
        
        # Subscribe email to SNS topic
        self.sns_topic.add_subscription(
            sns_subscriptions.EmailSubscription(
                self.notification_email_param.value_as_string
            )
        )
        
        # CloudWatch Dashboard
        self.dashboard = cloudwatch.Dashboard(
            self, "CloudMigrationDashboard",
            dashboard_name="CloudMigration-Infrastructure"
        )
        
        # Add widgets to dashboard
        self.dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="EC2 CPU Utilization",
                left=[
                    cloudwatch.Metric(
                        namespace="AWS/EC2",
                        metric_name="CPUUtilization",
                        dimensions_map={"InstanceId": self.ec2_instance.instance_id},
                        statistic="Average"
                    )
                ],
                width=12,
                height=6
            ),
            cloudwatch.GraphWidget(
                title="Custom Metrics",
                left=[
                    cloudwatch.Metric(
                        namespace="CloudMigration/EC2",
                        metric_name="mem_used_percent",
                        dimensions_map={"InstanceId": self.ec2_instance.instance_id},
                        statistic="Average"
                    ),
                    cloudwatch.Metric(
                        namespace="CloudMigration/EC2",
                        metric_name="disk_used_percent",
                        dimensions_map={"InstanceId": self.ec2_instance.instance_id},
                        statistic="Average"
                    )
                ],
                width=12,
                height=6
            )
        )
        
        # CloudWatch Alarms
        
        # CPU Utilization Alarm
        cpu_alarm = cloudwatch.Alarm(
            self, "HighCPUAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="CPUUtilization",
                dimensions_map={"InstanceId": self.ec2_instance.instance_id},
                statistic="Average"
            ),
            threshold=self.cpu_threshold_param.value_as_number,
            evaluation_periods=2,
            datapoints_to_alarm=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description=f"CPU utilization exceeds {self.cpu_threshold_param.value_as_string}%"
        )
        cpu_alarm.add_alarm_action(
            cw_actions.SnsAction(self.sns_topic)
        )
        
        # Instance Status Check Alarm
        status_alarm = cloudwatch.Alarm(
            self, "InstanceStatusAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/EC2",
                metric_name="StatusCheckFailed",
                dimensions_map={"InstanceId": self.ec2_instance.instance_id},
                statistic="Maximum"
            ),
            threshold=1,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
            alarm_description="Instance status check failed"
        )
        status_alarm.add_alarm_action(
            cw_actions.SnsAction(self.sns_topic)
        )
        
        # Memory Usage Alarm (custom metric)
        memory_alarm = cloudwatch.Alarm(
            self, "HighMemoryAlarm",
            metric=cloudwatch.Metric(
                namespace="CloudMigration/EC2",
                metric_name="mem_used_percent",
                dimensions_map={"InstanceId": self.ec2_instance.instance_id},
                statistic="Average"
            ),
            threshold=90,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Memory utilization exceeds 90%"
        )
        memory_alarm.add_alarm_action(
            cw_actions.SnsAction(self.sns_topic)
        )
        
        # Disk Usage Alarm (custom metric)
        disk_alarm = cloudwatch.Alarm(
            self, "HighDiskUsageAlarm",
            metric=cloudwatch.Metric(
                namespace="CloudMigration/EC2",
                metric_name="disk_used_percent",
                dimensions_map={"InstanceId": self.ec2_instance.instance_id},
                statistic="Average"
            ),
            threshold=80,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
            alarm_description="Disk usage exceeds 80% (less than 20% free)"
        )
        disk_alarm.add_alarm_action(
            cw_actions.SnsAction(self.sns_topic)
        )

    def _create_outputs(self):
        """Create CloudFormation outputs."""
        CfnOutput(
            self, "DeploymentRegion",
            value=self.region,
            description="AWS Region where stack is deployed",
            export_name=f"{self.stack_name}-DeploymentRegion"
        )
        CfnOutput(self, "VPCId", value=self.vpc.vpc_id, description="VPC ID")
        
        # Fixed outputs to handle subnet arrays properly
        if self.vpc.public_subnets:
            CfnOutput(self, "PublicSubnetId", 
                     value=self.vpc.public_subnets[0].subnet_id, 
                     description="Public Subnet ID")
        
        if self.vpc.private_subnets:
            CfnOutput(self, "PrivateSubnetId", 
                     value=self.vpc.private_subnets[0].subnet_id, 
                     description="Private Subnet ID")
        
        CfnOutput(self, "EC2InstanceId", value=self.ec2_instance.instance_id, description="EC2 Instance ID")
        CfnOutput(self, "EC2PublicIP", value=self.ec2_instance.instance_public_ip, description="EC2 Public IP")
        CfnOutput(self, "EC2PublicDNS", value=self.ec2_instance.instance_public_dns_name, description="EC2 Public DNS")
        
        CfnOutput(self, "S3BucketName", value=self.s3_bucket.bucket_name, description="S3 Bucket Name")
        CfnOutput(self, "S3BucketArn", value=self.s3_bucket.bucket_arn, description="S3 Bucket ARN")
        
        CfnOutput(self, "CloudFrontDomainName", 
                 value=self.cloudfront_distribution.distribution_domain_name, 
                 description="CloudFront Domain Name")
        CfnOutput(self, "CloudFrontDistributionId", 
                 value=self.cloudfront_distribution.distribution_id, 
                 description="CloudFront Distribution ID")
        
        CfnOutput(self, "SNSTopicArn", value=self.sns_topic.topic_arn, description="SNS Topic ARN")
        
        CfnOutput(self, "WebSecurityGroupId", value=self.web_sg.security_group_id, description="Web Security Group ID")
        CfnOutput(self, "SSHSecurityGroupId", value=self.ssh_sg.security_group_id, description="SSH Security Group ID")
        
        CfnOutput(self, "IAMRoleArn", value=self.ec2_role.role_arn, description="EC2 IAM Role ARN")
        
        CfnOutput(
            self, "DashboardURL",
            value=f"https://{self.region}.console.aws.amazon.com/cloudwatch/home?region={self.region}#dashboards:name={self.dashboard.dashboard_name}",
            description="CloudWatch Dashboard URL"
        )
        
        CfnOutput(
            self, "WebsiteURL",
            value=f"http://{self.ec2_instance.instance_public_ip}",
            description="Website URL"
        )