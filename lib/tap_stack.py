import os
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    aws_ec2 as ec2,
    aws_iam as iam,
    aws_s3 as s3,
    aws_rds as rds,
    aws_kms as kms,
    aws_logs as logs,
    aws_cloudtrail as cloudtrail,
    aws_secretsmanager as secretsmanager,
    CfnOutput
)
from constructs import Construct
from typing import Optional

# Check if running in LocalStack environment
IS_LOCALSTACK = os.environ.get('AWS_ENDPOINT_URL', '').startswith('http://localhost') or \
                                os.environ.get('LOCALSTACK_HOSTNAME') is not None

class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix

class TapStack(cdk.Stack):
    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'
        self.environment_suffix = environment_suffix

        # VPC with public, private, and database subnets
        # Use PRIVATE_ISOLATED instead of PRIVATE_WITH_EGRESS for LocalStack
        # (LocalStack Community doesn't fully support NAT Gateways with EIP)
        private_subnet_type = ec2.SubnetType.PRIVATE_ISOLATED if IS_LOCALSTACK else ec2.SubnetType.PRIVATE_WITH_EGRESS
        
        vpc = ec2.Vpc(
            self, "SecureVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            nat_gateways=0 if IS_LOCALSTACK else None,  # Disable NAT for LocalStack
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=private_subnet_type,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name="DatabaseSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # VPC Flow Logs
        vpc_flow_log_group = logs.LogGroup(
            self, "VPCFlowLogGroup",
            log_group_name=f"/aws/vpc/flowlogs/{environment_suffix}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )
        flow_log_role = iam.Role(
            self, "VPCFlowLogRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            inline_policies={
                "FlowLogPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=[
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogGroups",
                                "logs:DescribeLogStreams"
                            ],
                            resources=["*"]
                        )
                    ]
                )
            }
        )
        ec2.FlowLog(
            self, "VPCFlowLogs",
            resource_type=ec2.FlowLogResourceType.from_vpc(vpc),
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                vpc_flow_log_group, flow_log_role
            ),
            traffic_type=ec2.FlowLogTrafficType.ALL
        )

        # Security Groups
        bastion_sg = ec2.SecurityGroup(
            self, "BastionSecurityGroup",
            vpc=vpc,
            description="Security group for bastion host",
            allow_all_outbound=True
        )
        bastion_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4("203.0.113.0/24"),
            connection=ec2.Port.tcp(22),
            description="SSH access from office network"
        )
        alb_sg = ec2.SecurityGroup(
            self, "ALBSecurityGroup",
            vpc=vpc,
            description="Security group for Application Load Balancer",
            allow_all_outbound=True
        )
        alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="HTTP access from internet"
        )
        alb_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="HTTPS access from internet"
        )
        app_server_sg = ec2.SecurityGroup(
            self, "AppServerSecurityGroup",
            vpc=vpc,
            description="Security group for application servers",
            allow_all_outbound=True
        )
        app_server_sg.add_ingress_rule(
            peer=ec2.Peer.security_group_id(bastion_sg.security_group_id),
            connection=ec2.Port.tcp(22),
            description="SSH access from bastion host"
        )
        app_server_sg.add_ingress_rule(
            peer=ec2.Peer.security_group_id(alb_sg.security_group_id),
            connection=ec2.Port.tcp(80),
            description="HTTP access from ALB"
        )
        rds_sg = ec2.SecurityGroup(
            self, "RDSSecurityGroup",
            vpc=vpc,
            description="Security group for RDS database",
            allow_all_outbound=True
        )
        rds_sg.add_ingress_rule(
            peer=ec2.Peer.security_group_id(app_server_sg.security_group_id),
            connection=ec2.Port.tcp(3306),
            description="MySQL access from application servers"
        )

        # IAM Roles & Instance Profiles
        ec2_role = iam.Role(
            self, "EC2InstanceRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for EC2 application servers"
        )
        ec2_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
        )
        instance_profile = iam.InstanceProfile(
            self, "EC2InstanceProfile",
            role=ec2_role
        )
        bastion_role = iam.Role(
            self, "BastionHostRole",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for bastion host"
        )
        bastion_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("AmazonSSMManagedInstanceCore")
        )
        bastion_instance_profile = iam.InstanceProfile(
            self, "BastionInstanceProfile",
            role=bastion_role
        )

        # KMS Keys
        s3_kms_key = kms.Key(
            self, "S3KMSKey",
            description="KMS key for S3 bucket encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
        rds_kms_key = kms.Key(
            self, "RDSKMSKey",
            description="KMS key for RDS encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
        cloudtrail_kms_key = kms.Key(
            self, "CloudTrailKMSKey",
            description="KMS key for CloudTrail encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )
        cloudtrail_kms_key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Enable CloudTrail Encryption",
                principals=[iam.ServicePrincipal("cloudtrail.amazonaws.com")],
                actions=[
                    "kms:GenerateDataKey*",
                    "kms:DescribeKey"
                ],
                resources=["*"]
            )
        )

        # S3 Buckets
        app_data_bucket = s3.Bucket(
            self, "AppDataBucket",
            bucket_name=f"secure-app-data-{self.account}-{self.region}-{environment_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=s3_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )
        cloudtrail_bucket = s3.Bucket(
            self, "CloudTrailLogsBucket",
            bucket_name=f"secure-cloudtrail-logs-{self.account}-{self.region}-{environment_suffix}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=cloudtrail_kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )
        app_data_bucket.grant_read_write(ec2_role)

        # Secrets Manager
        db_secret = secretsmanager.Secret(
            self, "DatabaseSecret",
            description="Database credentials for RDS instance",
            generate_secret_string=secretsmanager.SecretStringGenerator(
                secret_string_template='{"username":"admin"}',
                generate_string_key="password",
                exclude_characters=" %+~`#$&*()|[]{}:;<>?!'/\"\\",
                include_space=False,
                password_length=32
            )
        )
        db_secret.grant_read(ec2_role)

        # RDS Instance
        # LocalStack Community has limited RDS support - skip entirely
        if IS_LOCALSTACK:
            # Skip RDS creation in LocalStack as the waiter times out
            database = None
            db_subnet_group = None
        else:
            # RDS Subnet Group
            db_subnet_group = rds.SubnetGroup(
                self, "DatabaseSubnetGroup",
                description="Subnet group for RDS database",
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
                )
            )

            database = rds.DatabaseInstance(
                self, "SecureDatabase",
                engine=rds.DatabaseInstanceEngine.mysql(
                    version=rds.MysqlEngineVersion.VER_8_0
                ),
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MEDIUM
                ),
                credentials=rds.Credentials.from_secret(db_secret),
                vpc=vpc,
                subnet_group=db_subnet_group,
                security_groups=[rds_sg],
                multi_az=True,
                storage_encrypted=True,
                storage_encryption_key=rds_kms_key,
                backup_retention=Duration.days(7),
                deletion_protection=False,
                delete_automated_backups=True,
                removal_policy=RemovalPolicy.DESTROY,
                allocated_storage=20,
                max_allocated_storage=100,
                enable_performance_insights=True,
                monitoring_interval=Duration.seconds(60),
                auto_minor_version_upgrade=True
            )

        # CloudTrail
        # LocalStack Community has limited CloudTrail support
        if IS_LOCALSTACK:
            # Skip CloudTrail in LocalStack as it's not fully supported
            trail = None
        else:
            trail = cloudtrail.Trail(
                self, "SecureCloudTrail",
                bucket=cloudtrail_bucket,
                encryption_key=cloudtrail_kms_key,
                include_global_service_events=True,
                is_multi_region_trail=True,
                enable_file_validation=True,
                send_to_cloud_watch_logs=True,
                cloud_watch_logs_retention=logs.RetentionDays.ONE_MONTH
            )
            trail.add_s3_event_selector(
                read_write_type=cloudtrail.ReadWriteType.ALL,
                include_management_events=True,
                s3_selector=[
                    cloudtrail.S3EventSelector(
                        bucket=app_data_bucket,
                        object_prefix=""
                    )
                ]
            )

        # Bastion Host
        amzn_linux = ec2.MachineImage.latest_amazon_linux(
            generation=ec2.AmazonLinuxGeneration.AMAZON_LINUX_2,
            edition=ec2.AmazonLinuxEdition.STANDARD,
            virtualization=ec2.AmazonLinuxVirt.HVM,
            storage=ec2.AmazonLinuxStorage.GENERAL_PURPOSE
        )
        bastion_user_data = ec2.UserData.for_linux()
        bastion_user_data.add_commands(
            "yum update -y",
            "yum install -y amazon-ssm-agent",
            "systemctl enable amazon-ssm-agent",
            "systemctl start amazon-ssm-agent"
        )
        bastion_host = ec2.Instance(
            self, "BastionHost",
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3,
                ec2.InstanceSize.MICRO
            ),
            machine_image=amzn_linux,
            vpc=vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PUBLIC
            ),
            security_group=bastion_sg,
            role=bastion_role,
            user_data=bastion_user_data,
            detailed_monitoring=True
        )

        # Application Servers
        app_user_data = ec2.UserData.for_linux()
        app_user_data.add_commands(
            "yum update -y",
            "yum install -y amazon-ssm-agent httpd",
            "systemctl enable amazon-ssm-agent",
            "systemctl start amazon-ssm-agent",
            "systemctl enable httpd",
            "systemctl start httpd",
            "echo '<h1>Secure Application Server</h1>' > /var/www/html/index.html"
        )
        for i in range(2):
            ec2.Instance(
                self, f"AppServer{i+1}",
                instance_type=ec2.InstanceType.of(
                    ec2.InstanceClass.BURSTABLE3,
                    ec2.InstanceSize.MICRO
                ),
                machine_image=amzn_linux,
                vpc=vpc,
                vpc_subnets=ec2.SubnetSelection(
                    subnet_type=private_subnet_type
                ),
                security_group=app_server_sg,
                role=ec2_role,
                user_data=app_user_data,
                detailed_monitoring=True
            )

        # Outputs
        CfnOutput(self, "VpcId", value=vpc.vpc_id, description="VPC ID")
        CfnOutput(
            self, "BastionHostId",
            value=bastion_host.instance_id,
            description="Bastion Host Instance ID"
        )
        CfnOutput(
            self, "DatabaseEndpoint",
            value=database.instance_endpoint.hostname,
            description="RDS Database Endpoint"
        )
        CfnOutput(
            self, "AppDataBucketName",
            value=app_data_bucket.bucket_name,
            description="Application Data S3 Bucket Name"
        )
        CfnOutput(
            self, "DatabaseSecretArn",
            value=db_secret.secret_arn,
            description="Database Secret ARN"
        )
