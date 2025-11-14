from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, S3Backend, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_vpc import DataAwsVpc
from cdktf_cdktf_provider_aws.data_aws_subnets import DataAwsSubnets
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret import DataAwsSecretsmanagerSecret
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret_version import DataAwsSecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate, LaunchTemplateIamInstanceProfile, LaunchTemplateTagSpecifications
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup, AutoscalingGroupTag
from cdktf_cdktf_provider_aws.autoscaling_attachment import AutoscalingAttachment
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA, S3BucketVersioningVersioningConfiguration
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
import json


class MultiEnvStack(TerraformStack):
    def __init__(self, scope: Construct, stack_id: str, environment: str,
                 environment_suffix: str, config: dict):  # pylint: disable=too-many-positional-arguments
        super().__init__(scope, stack_id)

        self.environment = environment
        self.environment_suffix = environment_suffix
        self.config = config
        region = config.get('region', 'us-east-1')

        # Common tags for all resources
        common_tags = {
            "Environment": environment,
            "Project": "multi-env-infrastructure",
            "ManagedBy": "CDKTF",
            "EnvironmentSuffix": environment_suffix
        }

        # AWS Provider
        AwsProvider(self, "aws",
            region=region,
            default_tags=[{
                "tags": common_tags
            }]
        )

        # Get existing VPC
        vpc_data = DataAwsVpc(self, "vpc",
            default=True
        )

        # Get subnets (excluding us-east-1e which doesn't support t3.micro)
        subnets = DataAwsSubnets(self, "subnets",
            filter=[
                {
                    "name": "vpc-id",
                    "values": [vpc_data.id]
                },
                {
                    "name": "availability-zone",
                    "values": ["us-east-1a", "us-east-1b", "us-east-1c", "us-east-1d", "us-east-1f"]
                }
            ]
        )

        # Get database password from Secrets Manager
        db_secret = DataAwsSecretsmanagerSecret(self, "db_secret",
            name=f"rds-password-{environment_suffix}"
        )

        db_secret_version = DataAwsSecretsmanagerSecretVersion(self, "db_secret_version",
            secret_id=db_secret.id
        )

        # Database security group with restricted access
        db_sg = SecurityGroup(self, "db_sg",
            name=f"db-sg-{environment_suffix}",
            description=f"Security group for RDS PostgreSQL {environment}",
            vpc_id=vpc_data.id,
            ingress=[SecurityGroupIngress(
                description="PostgreSQL access from application tier",
                from_port=5432,
                to_port=5432,
                protocol="tcp",
                cidr_blocks=config.get('allowed_cidrs', ['10.0.0.0/8'])
            )],
            egress=[SecurityGroupEgress(
                description="Allow all outbound traffic",
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={
                **common_tags,
                "Name": f"db-sg-{environment_suffix}"
            }
        )

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(self, "db_subnet_group",
            name=f"db-subnet-group-{environment_suffix}",
            subnet_ids=subnets.ids,
            tags={
                **common_tags,
                "Name": f"db-subnet-group-{environment_suffix}"
            }
        )

        # RDS PostgreSQL with proper configuration
        db_config = config.get('database', {})
        db = DbInstance(self, "postgres",
            identifier=f"postgres-{environment_suffix}",
            engine="postgres",
            engine_version="15.8",
            instance_class=db_config.get('instance_class', 'db.t3.micro'),
            allocated_storage=20,
            storage_encrypted=True,
            username="dbadmin",
            password=db_secret_version.secret_string,
            multi_az=db_config.get('multi_az', False),
            vpc_security_group_ids=[db_sg.id],
            db_subnet_group_name=db_subnet_group.name,
            skip_final_snapshot=True,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="Mon:04:00-Mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            tags={
                **common_tags,
                "Name": f"postgres-{environment_suffix}"
            }
        )

        # EC2 security group with proper restrictions
        ec2_sg = SecurityGroup(self, "ec2_sg",
            name=f"ec2-sg-{environment_suffix}",
            description=f"Security group for EC2 instances {environment}",
            vpc_id=vpc_data.id,
            ingress=[
                SecurityGroupIngress(
                    description="HTTP from ALB",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[]  # Will be updated after ALB SG creation
                ),
                SecurityGroupIngress(
                    description="HTTPS from ALB",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    security_groups=[]  # Will be updated after ALB SG creation
                )
            ],
            egress=[SecurityGroupEgress(
                description="Allow all outbound traffic",
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={
                **common_tags,
                "Name": f"ec2-sg-{environment_suffix}"
            }
        )

        # IAM role for EC2 instances
        ec2_role = IamRole(self, "ec2_role",
            name=f"ec2-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                **common_tags,
                "Name": f"ec2-role-{environment_suffix}"
            }
        )

        # Attach managed policies
        IamRolePolicyAttachment(self, "ec2_ssm_policy",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )

        IamRolePolicyAttachment(self, "ec2_cloudwatch_policy",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        )

        # Instance profile
        instance_profile = IamInstanceProfile(self, "instance_profile",
            name=f"ec2-profile-{environment_suffix}",
            role=ec2_role.name,
            tags={
                **common_tags,
                "Name": f"ec2-profile-{environment_suffix}"
            }
        )

        # Launch template with proper configuration
        asg_config = config.get('autoscaling', {})
        launch_template = LaunchTemplate(self, "launch_template",
            name=f"launch-template-{environment_suffix}",
            description=f"Launch template for {environment} environment",
            image_id=config.get('ami_id', 'ami-0cae6d6fe6048ca2c'),  # Amazon Linux 2023 us-east-1
            instance_type=config.get('instance_type', 't3.micro'),
            vpc_security_group_ids=[ec2_sg.id],
            iam_instance_profile=LaunchTemplateIamInstanceProfile(
                name=instance_profile.name
            ),
            metadata_options={
                "http_tokens": "required",
                "http_put_response_hop_limit": 1
            },
            tag_specifications=[
                LaunchTemplateTagSpecifications(
                    resource_type="instance",
                    tags={
                        **common_tags,
                        "Name": f"ec2-instance-{environment_suffix}"
                    }
                ),
                LaunchTemplateTagSpecifications(
                    resource_type="volume",
                    tags={
                        **common_tags,
                        "Name": f"ec2-volume-{environment_suffix}"
                    }
                )
            ],
            tags={
                **common_tags,
                "Name": f"launch-template-{environment_suffix}"
            }
        )

        # ALB security group
        alb_sg = SecurityGroup(self, "alb_sg",
            name=f"alb-sg-{environment_suffix}",
            description=f"Security group for ALB {environment}",
            vpc_id=vpc_data.id,
            ingress=[
                SecurityGroupIngress(
                    description="HTTP from internet",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=config.get('alb_allowed_cidrs', ['0.0.0.0/0'])
                ),
                SecurityGroupIngress(
                    description="HTTPS from internet",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=config.get('alb_allowed_cidrs', ['0.0.0.0/0'])
                )
            ],
            egress=[SecurityGroupEgress(
                description="Allow all outbound traffic",
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={
                **common_tags,
                "Name": f"alb-sg-{environment_suffix}"
            }
        )

        # Application Load Balancer
        alb = Lb(self, "alb",
            name=f"alb-{environment_suffix}",
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=subnets.ids,
            enable_deletion_protection=False,
            enable_http2=True,
            idle_timeout=60,
            tags={
                **common_tags,
                "Name": f"alb-{environment_suffix}"
            }
        )

        # Target group with proper health checks
        tg = LbTargetGroup(self, "tg",
            name=f"tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc_data.id,
            target_type="instance",
            deregistration_delay="30",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                interval=30,
                timeout=5,
                healthy_threshold=2,
                unhealthy_threshold=2,
                matcher="200"
            ),
            tags={
                **common_tags,
                "Name": f"tg-{environment_suffix}"
            }
        )

        # Auto Scaling Group with proper configuration
        asg = AutoscalingGroup(self, "asg",
            name=f"asg-{environment_suffix}",
            min_size=asg_config.get('min_size', 1),
            max_size=asg_config.get('max_size', 2),
            desired_capacity=asg_config.get('desired', 1),
            vpc_zone_identifier=subnets.ids,
            health_check_type="ELB",
            health_check_grace_period=300,
            launch_template={
                "id": launch_template.id,
                "version": "$Latest"
            },
            tag=[
                AutoscalingGroupTag(
                    key="Name",
                    value=f"asg-instance-{environment_suffix}",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="Environment",
                    value=environment,
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="Project",
                    value="multi-env-infrastructure",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="ManagedBy",
                    value="CDKTF",
                    propagate_at_launch=True
                )
            ]
        )

        # Attach ASG to target group
        AutoscalingAttachment(self, "asg_attachment",
            autoscaling_group_name=asg.name,
            lb_target_group_arn=tg.arn
        )

        # ALB Listener
        LbListener(self, "listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=tg.arn
            )],
            tags={
                **common_tags,
                "Name": f"alb-listener-{environment_suffix}"
            }
        )

        # S3 bucket with encryption and versioning
        bucket = S3Bucket(self, "bucket",
            bucket=f"app-data-{environment_suffix}",
            force_destroy=True,
            tags={
                **common_tags,
                "Name": f"app-data-{environment_suffix}"
            }
        )

        # Block public access
        S3BucketPublicAccessBlock(self, "bucket_public_access_block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Server-side encryption
        encryption_default = S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
            sse_algorithm="AES256"
        )
        S3BucketServerSideEncryptionConfigurationA(self, "bucket_encryption",
            bucket=bucket.id,
            rule=[S3BucketServerSideEncryptionConfigurationRuleA(
                apply_server_side_encryption_by_default=encryption_default,
                bucket_key_enabled=True
            )]
        )

        # Enable versioning based on environment
        storage_config = config.get('storage', {})
        if storage_config.get('versioning', False):
            S3BucketVersioningA(self, "bucket_versioning",
                bucket=bucket.id,
                versioning_configuration=S3BucketVersioningVersioningConfiguration(
                    status="Enabled"
                )
            )

        # Outputs
        TerraformOutput(self, "db_endpoint",
            value=db.endpoint,
            description="RDS PostgreSQL endpoint"
        )

        TerraformOutput(self, "db_address",
            value=db.address,
            description="RDS PostgreSQL address"
        )

        TerraformOutput(self, "alb_dns",
            value=alb.dns_name,
            description="Application Load Balancer DNS name"
        )

        TerraformOutput(self, "alb_arn",
            value=alb.arn,
            description="Application Load Balancer ARN"
        )

        TerraformOutput(self, "bucket_name",
            value=bucket.id,
            description="S3 bucket name"
        )

        TerraformOutput(self, "bucket_arn",
            value=bucket.arn,
            description="S3 bucket ARN"
        )

        TerraformOutput(self, "asg_name",
            value=asg.name,
            description="Auto Scaling Group name"
        )

        TerraformOutput(self, "vpc_id",
            value=vpc_data.id,
            description="VPC ID"
        )
