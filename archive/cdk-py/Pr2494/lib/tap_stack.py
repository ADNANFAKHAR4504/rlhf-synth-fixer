"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It creates a secure multi-tier web application infrastructure following AWS best practices.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from aws_cdk import aws_ec2 as ec2
from aws_cdk import aws_rds as rds
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_iam as iam
from aws_cdk import aws_kms as kms
from aws_cdk import aws_logs as logs
from aws_cdk import aws_dynamodb as dynamodb

from constructs import Construct


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
    Secure multi-tier web application infrastructure stack following AWS best practices.
    
    Features:
    - VPC with public/private/isolated subnets across multiple AZs
    - Secure RDS instance with encryption and automated backups
    - S3 bucket with server-side encryption and security policies
    - DynamoDB table with encryption at rest
    - IAM roles following principle of least privilege
    - Security groups with restricted access
    - KMS encryption for all sensitive data
    - EC2 launch template with proper IAM roles
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, 
            props: Optional[TapStackProps] = None, 
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Configuration parameters
        self.trusted_ip_range = "203.0.113.0/24"  # Replace with your actual IP range
        self.db_name = f"webapp_db_{self.environment_suffix}"
        self.db_username = "admin"

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()
        
        # Create VPC with public, private, and isolated subnets
        self.vpc = self._create_vpc()
        
        # Create security groups
        self.web_sg, self.db_sg = self._create_security_groups()
        
        # Create RDS instance
        self.rds_instance = self._create_rds_instance()
        
        # Create S3 bucket with encryption
        self.s3_bucket = self._create_s3_bucket()
        
        # Create DynamoDB table
        self.dynamodb_table = self._create_dynamodb_table()
        
        # Create IAM roles for EC2 instances
        self.ec2_role = self._create_ec2_iam_role()
        
        # Create launch template for EC2 instances
        self.launch_template = self._create_launch_template()
        
        # Create outputs
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """Create a KMS key for encryption with proper key policy."""
        key = kms.Key(
            self, "WebAppKMSKey",
            description=f"KMS key for multi-tier web application encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY  # Use RETAIN for production
        )

        # Add key alias for easier reference
        kms.Alias(
            self, "WebAppKMSKeyAlias",
            alias_name=f"alias/webapp-key-{self.environment_suffix}",
            target_key=key
        )

        # Add key policy to allow the account root to manage the key
        key.add_to_resource_policy(
            iam.PolicyStatement(
                sid="Enable IAM User Permissions",
                effect=iam.Effect.ALLOW,
                principals=[iam.AccountRootPrincipal()],
                actions=["kms:*"],
                resources=["*"]
            )
        )

        # Add tags
        cdk.Tags.of(key).add("Environment", self.environment_suffix)
        cdk.Tags.of(key).add("Service", "TapStack")
        cdk.Tags.of(key).add("Component", "Encryption")

        return key

    def _create_vpc(self) -> ec2.Vpc:
        """Create VPC with public, private, and isolated subnets across multiple AZs."""
        vpc = ec2.Vpc(
            self, "WebAppVPC",
            ip_addresses=ec2.IpAddresses.cidr("10.0.0.0/16"),
            max_azs=2,
            nat_gateways=2,  # One NAT gateway per AZ for high availability
            subnet_configuration=[
                # Public subnets for load balancers and NAT gateways
                ec2.SubnetConfiguration(
                    name="PublicSubnet",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                ),
                # Private subnets for application servers
                ec2.SubnetConfiguration(
                    name="PrivateSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                # Isolated subnets for database
                ec2.SubnetConfiguration(
                    name="DatabaseSubnet",
                    subnet_type=ec2.SubnetType.PRIVATE_ISOLATED,
                    cidr_mask=24
                )
            ],
            enable_dns_hostnames=True,
            enable_dns_support=True
        )

        # Create CloudWatch Log Group for VPC Flow Logs
        log_group = logs.LogGroup(
            self, "VPCFlowLogGroup",
            log_group_name=f"/aws/vpc/flowlogs-{self.environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create IAM role for VPC Flow Logs with correct policy
        flow_log_role = iam.Role(
            self, "VPCFlowLogRole",
            assumed_by=iam.ServicePrincipal("vpc-flow-logs.amazonaws.com"),
            inline_policies={
                "VPCFlowLogsPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "logs:CreateLogGroup",
                                "logs:CreateLogStream",
                                "logs:PutLogEvents",
                                "logs:DescribeLogGroups",
                                "logs:DescribeLogStreams"
                            ],
                            resources=[
                                f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/vpc/flowlogs-{self.environment_suffix}",
                                f"arn:aws:logs:{self.region}:{self.account}:log-group:/aws/vpc/flowlogs-{self.environment_suffix}:*"
                            ]
                        )
                    ]
                )
            }
        )

        # Add VPC Flow Logs for security monitoring
        vpc.add_flow_log(
            "VPCFlowLog",
            destination=ec2.FlowLogDestination.to_cloud_watch_logs(
                log_group=log_group,
                iam_role=flow_log_role
            )
        )

        # Add tags
        cdk.Tags.of(vpc).add("Environment", self.environment_suffix)
        cdk.Tags.of(vpc).add("Service", "TapStack")
        cdk.Tags.of(vpc).add("Component", "Network")

        return vpc

    def _create_security_groups(self) -> tuple[ec2.SecurityGroup, ec2.SecurityGroup]:
        """Create security groups for web tier and database tier."""
        
        # Security group for web servers
        web_sg = ec2.SecurityGroup(
            self, "WebServerSecurityGroup",
            vpc=self.vpc,
            description="Security group for web servers",
            allow_all_outbound=False  # Explicitly control outbound traffic
        )

        # Allow HTTPS traffic from anywhere
        web_sg.add_ingress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow HTTPS traffic from anywhere"
        )

        # Allow SSH only from trusted IP range
        web_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.trusted_ip_range),
            connection=ec2.Port.tcp(22),
            description="Allow SSH from trusted IP range only"
        )

        # Allow outbound HTTPS for updates and API calls
        web_sg.add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(443),
            description="Allow outbound HTTPS"
        )

        # Allow outbound HTTP for package updates
        web_sg.add_egress_rule(
            peer=ec2.Peer.any_ipv4(),
            connection=ec2.Port.tcp(80),
            description="Allow outbound HTTP"
        )

        # Security group for RDS database
        db_sg = ec2.SecurityGroup(
            self, "DatabaseSecurityGroup",
            vpc=self.vpc,
            description="Security group for RDS database",
            allow_all_outbound=False
        )

        # Allow database access only from web servers
        db_sg.add_ingress_rule(
            peer=web_sg,
            connection=ec2.Port.tcp(3306),  # MySQL/Aurora port
            description="Allow database access from web servers only"
        )

        # Add tags
        cdk.Tags.of(web_sg).add("Environment", self.environment_suffix)
        cdk.Tags.of(web_sg).add("Service", "TapStack")
        cdk.Tags.of(web_sg).add("Component", "Security")

        cdk.Tags.of(db_sg).add("Environment", self.environment_suffix)
        cdk.Tags.of(db_sg).add("Service", "TapStack")
        cdk.Tags.of(db_sg).add("Component", "Security")

        return web_sg, db_sg

    def _create_rds_instance(self) -> rds.DatabaseInstance:
        """Create RDS instance with encryption and automated backups."""
        
        # Create subnet group for RDS in isolated subnets
        subnet_group = rds.SubnetGroup(
            self, "DatabaseSubnetGroup",
            description="Subnet group for RDS database",
            vpc=self.vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_ISOLATED
            )
        )

        # Create parameter group for enhanced security
        parameter_group = rds.ParameterGroup(
            self, "DatabaseParameterGroup",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_37
            ),
            description="Parameter group with security enhancements",
            parameters={
                "slow_query_log": "1",
                "general_log": "1",
                "log_queries_not_using_indexes": "1"
            }
        )

        # Create RDS instance
        rds_instance = rds.DatabaseInstance(
            self, "WebAppDatabase",
            engine=rds.DatabaseInstanceEngine.mysql(
                version=rds.MysqlEngineVersion.VER_8_0_37
            ),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO
            ),
            vpc=self.vpc,
            subnet_group=subnet_group,
            security_groups=[self.db_sg],
            database_name=self.db_name,
            credentials=rds.Credentials.from_generated_secret(
                self.db_username,
                secret_name=f"webapp-db-credentials-{self.environment_suffix}",
                encryption_key=self.kms_key
            ),
            # Encryption settings
            storage_encrypted=True,
            storage_encryption_key=self.kms_key,
            # Security settings
            deletion_protection=False,  # Set to True for production
            multi_az=False,  # Set to True for production
            allocated_storage=20,
            max_allocated_storage=100,  # Enable storage autoscaling
            delete_automated_backups=False,
            removal_policy=RemovalPolicy.DESTROY  # Create snapshot before deletion
        )

        # Add tags
        cdk.Tags.of(rds_instance).add("Environment", self.environment_suffix)
        cdk.Tags.of(rds_instance).add("Service", "TapStack")
        cdk.Tags.of(rds_instance).add("Component", "Database")

        return rds_instance

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with server-side encryption and security settings."""
        bucket = s3.Bucket(
            self, "WebAppS3Bucket",
            # Encryption settings
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            bucket_key_enabled=True,  # Reduce KMS costs
            # Security settings
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            enforce_ssl=True,
            # Versioning and lifecycle
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteIncompleteMultipartUploads",
                    abort_incomplete_multipart_upload_after=Duration.days(1)
                ),
                s3.LifecycleRule(
                    id="TransitionToIA",
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        ),
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(90)
                        )
                    ]
                )
            ],
            # Cleanup settings for development
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # Add tags
        cdk.Tags.of(bucket).add("Environment", self.environment_suffix)
        cdk.Tags.of(bucket).add("Service", "TapStack")
        cdk.Tags.of(bucket).add("Component", "Storage")

        return bucket

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with encryption."""
        table = dynamodb.Table(
            self, "WebAppDynamoDBTable",
            table_name=f"webapp-sessions-{self.environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="session_id", 
                type=dynamodb.AttributeType.STRING
            ),
            # Encryption
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.kms_key,
            # Billing and performance
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            point_in_time_recovery=True,
            # TTL for session management
            time_to_live_attribute="expires_at",
            # Cleanup settings for development
            removal_policy=RemovalPolicy.DESTROY
        )

        # Add tags
        cdk.Tags.of(table).add("Environment", self.environment_suffix)
        cdk.Tags.of(table).add("Service", "TapStack")
        cdk.Tags.of(table).add("Component", "Database")

        return table

    def _create_ec2_iam_role(self) -> iam.Role:
        """Create IAM role for EC2 instances following principle of least privilege."""
        
        # Create the role
        role = iam.Role(
            self, "WebAppEC2Role",
            role_name=f"webapp-ec2-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("ec2.amazonaws.com"),
            description="IAM role for web application EC2 instances"
        )

        # Add managed policies for basic EC2 functionality
        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "AmazonSSMManagedInstanceCore"  # For Systems Manager
            )
        )

        role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name(
                "CloudWatchAgentServerPolicy"  # For CloudWatch monitoring
            )
        )

        # Create custom policy for S3 access (least privilege)
        s3_policy = iam.Policy(
            self, "WebAppS3Policy",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    resources=[f"{self.s3_bucket.bucket_arn}/*"]
                ),
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=["s3:ListBucket"],
                    resources=[self.s3_bucket.bucket_arn]
                )
            ]
        )

        # Create custom policy for DynamoDB access (least privilege)
        dynamodb_policy = iam.Policy(
            self, "WebAppDynamoDBPolicy",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    resources=[self.dynamodb_table.table_arn]
                )
            ]
        )

        # Create custom policy for KMS access
        kms_policy = iam.Policy(
            self, "WebAppKMSPolicy",
            statements=[
                iam.PolicyStatement(
                    effect=iam.Effect.ALLOW,
                    actions=[
                        "kms:Decrypt",
                        "kms:DescribeKey",
                        "kms:Encrypt",
                        "kms:GenerateDataKey"
                    ],
                    resources=[self.kms_key.key_arn]
                )
            ]
        )

        # Attach policies to role
        role.attach_inline_policy(s3_policy)
        role.attach_inline_policy(dynamodb_policy)
        role.attach_inline_policy(kms_policy)

        # Add tags
        cdk.Tags.of(role).add("Environment", self.environment_suffix)
        cdk.Tags.of(role).add("Service", "TapStack")
        cdk.Tags.of(role).add("Component", "IAM")

        return role

    def _create_launch_template(self) -> ec2.LaunchTemplate:
        """Create launch template for EC2 instances."""
        
        # User data script for instance initialization
        user_data = ec2.UserData.for_linux()
        user_data.add_commands(
            "#!/bin/bash",
            "yum update -y",
            "yum install -y amazon-cloudwatch-agent",
            "yum install -y amazon-ssm-agent",
            "systemctl enable amazon-ssm-agent",
            "systemctl start amazon-ssm-agent",
            # Add your application-specific setup here
            f"echo 'Environment: {self.environment_suffix}' >> /var/log/setup.log"
        )

        # Create launch template
        launch_template = ec2.LaunchTemplate(
            self, "WebAppLaunchTemplate",
            launch_template_name=f"webapp-launch-template-{self.environment_suffix}",
            machine_image=ec2.MachineImage.latest_amazon_linux2(),
            instance_type=ec2.InstanceType.of(
                ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO
            ),
            security_group=self.web_sg,
            role=self.ec2_role,
            user_data=user_data,
            # Enable detailed monitoring
            detailed_monitoring=True,
            # Disable IMDSv1 for security
            require_imdsv2=True
        )

        # Add tags
        cdk.Tags.of(launch_template).add("Environment", self.environment_suffix)
        cdk.Tags.of(launch_template).add("Service", "TapStack")
        cdk.Tags.of(launch_template).add("Component", "Compute")

        return launch_template

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs for important resources."""
        
        CfnOutput(
            self, "VPCId",
            value=self.vpc.vpc_id,
            description="VPC ID for the multi-tier application",
            export_name=f"{self.stack_name}-VPCId"
        )

        CfnOutput(
            self, "DatabaseEndpoint",
            value=self.rds_instance.instance_endpoint.hostname,
            description="RDS instance endpoint",
            export_name=f"{self.stack_name}-DatabaseEndpoint"
        )

        CfnOutput(
            self, "DatabaseSecretArn",
            value=self.rds_instance.secret.secret_arn,
            description="ARN of the database credentials secret",
            export_name=f"{self.stack_name}-DatabaseSecretArn"
        )

        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 bucket name for application storage",
            export_name=f"{self.stack_name}-S3BucketName"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB table name for session management",
            export_name=f"{self.stack_name}-DynamoDBTableName"
        )

        CfnOutput(
            self, "KMSKeyId",
            value=self.kms_key.key_id,
            description="KMS key ID for encryption",
            export_name=f"{self.stack_name}-KMSKeyId"
        )

        CfnOutput(
            self, "LaunchTemplateId",
            value=self.launch_template.launch_template_id,
            description="EC2 Launch Template ID",
            export_name=f"{self.stack_name}-LaunchTemplateId"
        )

        CfnOutput(
            self, "WebSecurityGroupId",
            value=self.web_sg.security_group_id,
            description="Web servers security group ID",
            export_name=f"{self.stack_name}-WebSecurityGroupId"
        )

        CfnOutput(
            self, "DatabaseSecurityGroupId",
            value=self.db_sg.security_group_id,
            description="Database security group ID",
            export_name=f"{self.stack_name}-DatabaseSecurityGroupId"
        )
