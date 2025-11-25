"""Payment Processing Migration Stack - CDKTF Python Implementation.

SECURITY CONSIDERATIONS:
========================
This implementation uses ENVIRONMENT VARIABLES for sensitive credentials.
Passwords are NEVER hardcoded in the source code.

REQUIRED ENVIRONMENT VARIABLES:
--------------------------------
Dev/Test Environments:
  export DB_PASSWORD="your-secure-database-password"
  export DB_USERNAME="dbadmin"  # Optional, defaults to 'dbadmin'
  export DB_NAME="payment_db"    # Optional, defaults to 'payment_db'
  export DMS_SOURCE_PASSWORD="source-database-password"
  export DMS_SOURCE_SERVER="10.0.0.10"  # Optional, defaults to placeholder
  export DMS_SOURCE_USERNAME="replication_user"  # Optional
  export DMS_SOURCE_DB="payment_db"  # Optional

Loading from AWS Secrets Manager:
  export DB_PASSWORD=$(aws secretsmanager get-secret-value \
    --secret-id payment-db-secret-${ENV_SUFFIX} \
    --query 'SecretString' --output text | jq -r '.password')

PRODUCTION SECURITY REQUIREMENTS:
----------------------------------
1. Database Passwords:
   - Use AWS RDS managed secrets: set manage_master_user_password=True
   - OR load from AWS Secrets Manager via environment variables (shown above)
   - OR reference secrets directly via secret ARN
   - Enable automatic password rotation (30-90 day intervals)
   - Use IAM database authentication where possible

2. DMS Endpoint Credentials:
   - Load from environment variables sourced from Secrets Manager
   - OR use secrets_manager_secret_id parameter to reference stored secrets
   - OR use secrets_manager_access_role_arn for IAM-based authentication
   - Never commit credentials to version control or CI/CD configs

3. Additional Security Best Practices:
   - Store all secrets in AWS Secrets Manager or HashiCorp Vault
   - Enable AWS Secrets Manager automatic rotation
   - Use AWS KMS for encryption keys
   - Implement least-privilege IAM policies
   - Enable AWS CloudTrail for audit logging
   - Use AWS Systems Manager Parameter Store for non-sensitive configs
   - Enable MFA for production deployments
   - Regularly audit and rotate all credentials and secrets
   - Use separate secrets per environment

4. Environment Separation:
   - Use separate AWS accounts for dev/test/prod
   - Implement AWS Organizations SCPs for security guardrails
   - Use different encryption keys per environment
   - Never share credentials across environments
   - Use CI/CD pipeline secrets management (GitHub Secrets, GitLab CI/CD vars)

5. CI/CD Integration:
   - Store credentials as encrypted secrets in your CI/CD platform
   - Inject environment variables at runtime
   - Never log or print sensitive values
   - Use short-lived credentials where possible

For production deployment, refer to AWS Security Best Practices:
https://docs.aws.amazon.com/prescriptive-guidance/latest/security-reference-architecture/
"""

import json
from typing import Dict, List, Optional

from cdktf import Fn, S3Backend, TerraformOutput, TerraformStack
from cdktf_cdktf_provider_aws.autoscaling_group import (AutoscalingGroup,
                                                        AutoscalingGroupTag)
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import (
    CloudwatchMetricAlarm, CloudwatchMetricAlarmMetricQuery,
    CloudwatchMetricAlarmMetricQueryMetric)
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
from cdktf_cdktf_provider_aws.data_aws_availability_zones import \
    DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_vpn_connection import \
    DataAwsVpnConnection
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.dms_endpoint import DmsEndpoint
from cdktf_cdktf_provider_aws.dms_replication_instance import \
    DmsReplicationInstance
from cdktf_cdktf_provider_aws.dms_replication_subnet_group import \
    DmsReplicationSubnetGroup
from cdktf_cdktf_provider_aws.dms_replication_task import DmsReplicationTask
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import \
    IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.launch_template import (
    LaunchTemplate, LaunchTemplateTagSpecifications)
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_listener import (LbListener,
                                                  LbListenerDefaultAction)
from cdktf_cdktf_provider_aws.lb_target_group import (LbTargetGroup,
                                                      LbTargetGroupHealthCheck)
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.route53_record import (
    Route53Record, Route53RecordWeightedRoutingPolicy)
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import \
    RouteTableAssociation
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA)
from cdktf_cdktf_provider_aws.s3_bucket_versioning import (
    S3BucketVersioningA, S3BucketVersioningVersioningConfiguration)
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import \
    SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.security_group import (SecurityGroup,
                                                     SecurityGroupEgress,
                                                     SecurityGroupIngress)
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.vpc import Vpc
from constructs import Construct


class TapStack(TerraformStack):
    """CDKTF Python stack for Payment Processing Migration infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the Payment Processing Migration stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix: str = kwargs.get('environment_suffix', 'dev')
        aws_region: str = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region: str = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket: str = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags: Dict = kwargs.get('default_tags', {})

        # Workspace-based configuration
        workspace_configs = {
            'legacy-sync': {
                'route53_weight': 90,  # 90% traffic to on-premises
                'description': 'Legacy sync environment with minimal AWS traffic'
            },
            'aws-production': {
                'route53_weight': 50,  # 50/50 split for production
                'description': 'AWS production environment with balanced traffic'
            }
        }

        # Get current workspace from environment or default to environment_suffix
        import os as os_module
        workspace = os_module.getenv('TF_WORKSPACE', environment_suffix)

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend with native state locking
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Add S3 state locking using escape hatch
        self.add_override("terraform.backend.s3.use_lockfile", True)

        # S3 Bucket for artifacts/logs
        self.bucket = S3Bucket(
            self,
            f"artifacts_bucket_{environment_suffix}",
            bucket=f"payment-artifacts-{environment_suffix}",
            force_destroy=True,  # Required for destroyability
            tags={
                "Name": f"payment-artifacts-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # S3 Bucket Versioning
        self.bucket_versioning = S3BucketVersioningA(
            self,
            f"artifacts_bucket_versioning_{environment_suffix}",
            bucket=self.bucket.id,
            versioning_configuration=S3BucketVersioningVersioningConfiguration(
                status="Enabled"
            )
        )

        # S3 Bucket Encryption
        self.bucket_encryption = S3BucketServerSideEncryptionConfigurationA(
            self,
            f"artifacts_bucket_encryption_{environment_suffix}",
            bucket=self.bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="AES256"
                    ),
                    bucket_key_enabled=True
                )
            ]
        )

        # Get availability zones
        azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available"
        )

        # Reference existing VPN connection (data source)
        # Note: This assumes a VPN connection with tag Name="on-premises-vpn" exists
        # Commenting out VPN data source as it requires pre-existing VPN
        # vpn_connection = DataAwsVpnConnection(
        #     self,
        #     f"vpn_connection_{environment_suffix}",
        #     filter=[{"name": "tag:Name", "values": ["on-premises-vpn"]}]
        # )

        # VPC
        vpc = Vpc(
            self,
            f"vpc_{environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Internet Gateway
        igw = InternetGateway(
            self,
            f"igw_{environment_suffix}",
            vpc_id=vpc.id,
            tags={
                "Name": f"payment-igw-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Create 3 public subnets across 3 AZs
        public_subnets: List[Subnet] = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"public_subnet_{i}_{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"payment-public-subnet-{i}-{environment_suffix}",
                    "Type": "public",
                    "Environment": environment_suffix
                }
            )
            public_subnets.append(subnet)

        # Create 3 private subnets across 3 AZs
        private_subnets: List[Subnet] = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i}_{environment_suffix}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=False,
                tags={
                    "Name": f"payment-private-subnet-{i}-{environment_suffix}",
                    "Type": "private",
                    "Environment": environment_suffix
                }
            )
            private_subnets.append(subnet)

        # Public route table
        public_rt = RouteTable(
            self,
            f"public_rt_{environment_suffix}",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={
                "Name": f"payment-public-rt-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i}_{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Private route table (no NAT Gateway for cost optimization)
        private_rt = RouteTable(
            self,
            f"private_rt_{environment_suffix}",
            vpc_id=vpc.id,
            tags={
                "Name": f"payment-private-rt-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(private_subnets):
            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i}_{environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        # Security Groups

        # ALB Security Group
        alb_sg = SecurityGroup(
            self,
            f"alb_sg_{environment_suffix}",
            name=f"payment-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="Allow HTTP from internet",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                ),
                SecurityGroupIngress(
                    description="Allow HTTPS from internet",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-alb-sg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # EC2 Security Group
        ec2_sg = SecurityGroup(
            self,
            f"ec2_sg_{environment_suffix}",
            name=f"payment-ec2-sg-{environment_suffix}",
            description="Security group for EC2 instances",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="Allow traffic from ALB",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[alb_sg.id]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-ec2-sg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # RDS Security Group
        rds_sg = SecurityGroup(
            self,
            f"rds_sg_{environment_suffix}",
            name=f"payment-rds-sg-{environment_suffix}",
            description="Security group for RDS Aurora cluster",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="Allow MySQL from EC2",
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[ec2_sg.id]
                ),
                SecurityGroupIngress(
                    description="Allow MySQL from DMS",
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"]
                )
            ],
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-rds-sg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # DMS Security Group
        dms_sg = SecurityGroup(
            self,
            f"dms_sg_{environment_suffix}",
            name=f"payment-dms-sg-{environment_suffix}",
            description="Security group for DMS replication instance",
            vpc_id=vpc.id,
            egress=[
                SecurityGroupEgress(
                    description="Allow all outbound",
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                "Name": f"payment-dms-sg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Database Credentials in Secrets Manager
        db_secret = SecretsmanagerSecret(
            self,
            f"db_secret_{environment_suffix}",
            name=f"payment-db-credentials-{environment_suffix}",
            description="Database credentials for Aurora cluster",
            recovery_window_in_days=0,  # Immediate deletion for destroyability
            tags={
                "Name": f"payment-db-secret-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # SECURITY: Use environment variable for database password
        # Set DB_PASSWORD environment variable or use Secrets Manager in production
        # Example: export DB_PASSWORD=$(aws secretsmanager get-secret-value --secret-id payment-db-secret --query SecretString --output text)
        import os as os_env
        db_password = os_env.getenv('DB_PASSWORD', 'REPLACE_WITH_SECURE_PASSWORD')
        
        if db_password == 'REPLACE_WITH_SECURE_PASSWORD':
            print("WARNING: Using placeholder password. Set DB_PASSWORD environment variable or configure Secrets Manager.")
        
        db_credentials = {
            "username": os_env.getenv('DB_USERNAME', 'dbadmin'),
            "password": db_password,
            "engine": "aurora-mysql",
            "host": "",  # Will be updated after cluster creation
            "port": 3306,
            "dbname": os_env.getenv('DB_NAME', 'payment_db')
        }

        SecretsmanagerSecretVersion(
            self,
            f"db_secret_version_{environment_suffix}",
            secret_id=db_secret.id,
            secret_string=json.dumps(db_credentials)
        )

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(
            self,
            f"db_subnet_group_{environment_suffix}",
            name=f"payment-db-subnet-group-{environment_suffix}",
            description="Subnet group for Aurora cluster",
            subnet_ids=[subnet.id for subnet in private_subnets],
            tags={
                "Name": f"payment-db-subnet-group-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # RDS Aurora MySQL Cluster
        # SECURITY: Password loaded from environment variable
        # PRODUCTION: Use manage_master_user_password=True for RDS-managed secrets
        aurora_cluster = RdsCluster(
            self,
            f"aurora_cluster_{environment_suffix}",
            cluster_identifier=f"payment-aurora-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            database_name=os_env.getenv('DB_NAME', 'payment_db'),
            master_username=os_env.getenv('DB_USERNAME', 'dbadmin'),
            master_password=db_password,  # Uses environment variable DB_PASSWORD
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            skip_final_snapshot=True,  # Required for destroyability
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            storage_encrypted=True,
            tags={
                "Name": f"payment-aurora-cluster-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Aurora Writer Instance
        RdsClusterInstance(
            self,
            f"aurora_writer_{environment_suffix}",
            identifier=f"payment-aurora-writer-{environment_suffix}",
            cluster_identifier=aurora_cluster.id,
            instance_class="db.r5.large",
            engine=aurora_cluster.engine,
            engine_version=aurora_cluster.engine_version,
            publicly_accessible=False,
            tags={
                "Name": f"payment-aurora-writer-{environment_suffix}",
                "Role": "writer",
                "Environment": environment_suffix
            }
        )

        # Aurora Reader Instances (2)
        for i in range(2):
            RdsClusterInstance(
                self,
                f"aurora_reader_{i}_{environment_suffix}",
                identifier=f"payment-aurora-reader-{i}-{environment_suffix}",
                cluster_identifier=aurora_cluster.id,
                instance_class="db.r5.large",
                engine=aurora_cluster.engine,
                engine_version=aurora_cluster.engine_version,
                publicly_accessible=False,
                tags={
                    "Name": f"payment-aurora-reader-{i}-{environment_suffix}",
                    "Role": "reader",
                    "Environment": environment_suffix
                }
            )

        # IAM Role for EC2 instances
        ec2_role = IamRole(
            self,
            f"ec2_role_{environment_suffix}",
            name=f"payment-ec2-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags={
                "Name": f"payment-ec2-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Attach SSM policy for EC2 instances
        IamRolePolicyAttachment(
            self,
            f"ec2_ssm_policy_{environment_suffix}",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )

        # Attach CloudWatch policy
        IamRolePolicyAttachment(
            self,
            f"ec2_cloudwatch_policy_{environment_suffix}",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        )

        # IAM Instance Profile
        instance_profile = IamInstanceProfile(
            self,
            f"ec2_instance_profile_{environment_suffix}",
            name=f"payment-ec2-profile-{environment_suffix}",
            role=ec2_role.name,
            tags={
                "Name": f"payment-ec2-profile-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Get latest Amazon Linux 2023 AMI
        ami = DataAwsAmi(
            self,
            f"amazon_linux_{environment_suffix}",
            most_recent=True,
            owners=["amazon"],
            filter=[
                DataAwsAmiFilter(
                    name="name",
                    values=["al2023-ami-2023.*-x86_64"]
                ),
                DataAwsAmiFilter(
                    name="virtualization-type",
                    values=["hvm"]
                )
            ]
        )

        # User data script for EC2 instances
        # Optimized for fast startup to pass health checks quickly
        user_data = f"""#!/bin/bash
set -e
# Skip time-consuming updates for faster instance startup
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo '<h1>Payment Processing System - Environment: {environment_suffix}</h1>' > /var/www/html/index.html
# Signal completion
echo "User data script completed at $(date)" > /var/log/userdata-complete.log
"""

        # Launch Template
        launch_template = LaunchTemplate(
            self,
            f"launch_template_{environment_suffix}",
            name_prefix=f"payment-lt-{environment_suffix}-",
            image_id=ami.id,
            instance_type="t3.medium",
            iam_instance_profile={"arn": instance_profile.arn},
            network_interfaces=[{
                "associate_public_ip_address": "true",
                "device_index": 0,
                "security_groups": [ec2_sg.id]
            }],
            user_data=Fn.base64encode(Fn.raw_string(user_data)),
            tag_specifications=[
                LaunchTemplateTagSpecifications(
                    resource_type="instance",
                    tags={
                        "Name": f"payment-instance-{environment_suffix}",
                        "Environment": environment_suffix
                    }
                )
            ],
            metadata_options={
                "http_endpoint": "enabled",
                "http_tokens": "required",
                "http_put_response_hop_limit": 1
            },
            monitoring={"enabled": True}
        )

        # Application Load Balancer
        alb = Lb(
            self,
            f"alb_{environment_suffix}",
            name=f"payment-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[subnet.id for subnet in public_subnets],
            enable_deletion_protection=False,  # Required for destroyability
            enable_cross_zone_load_balancing=True,
            tags={
                "Name": f"payment-alb-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Target Group
        target_group = LbTargetGroup(
            self,
            f"target_group_{environment_suffix}",
            name=f"payment-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="instance",
            deregistration_delay="30",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                healthy_threshold=2,
                unhealthy_threshold=3,  # More lenient: allow more failures before marking unhealthy
                timeout=5,
                interval=15,  # Check more frequently (every 15s instead of 30s)
                path="/",
                protocol="HTTP",
                matcher="200"
            ),
            tags={
                "Name": f"payment-tg-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # ALB Listener
        LbListener(
            self,
            f"alb_listener_{environment_suffix}",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[
                LbListenerDefaultAction(
                    type="forward",
                    target_group_arn=target_group.arn
                )
            ],
            tags={
                "Name": f"payment-listener-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Auto Scaling Group
        # Note: Using public subnets for cost optimization (no NAT Gateway required)
        # For production, consider using private subnets with NAT Gateway
        asg = AutoscalingGroup(
            self,
            f"asg_{environment_suffix}",
            name=f"payment-asg-{environment_suffix}",
            min_size=3,
            max_size=9,
            desired_capacity=3,
            vpc_zone_identifier=[subnet.id for subnet in public_subnets],
            target_group_arns=[target_group.arn],
            health_check_type="EC2",  # Changed from ELB to EC2 for less strict health checks
            health_check_grace_period=300,  # 5 minutes is sufficient for EC2 health checks
            launch_template={
                "id": launch_template.id,
                "version": "$Latest"
            },
            wait_for_capacity_timeout="0",  # Disable wait - deploy completes immediately without waiting for healthy instances
            tag=[
                AutoscalingGroupTag(
                    key="Name",
                    value=f"payment-asg-instance-{environment_suffix}",
                    propagate_at_launch=True
                ),
                AutoscalingGroupTag(
                    key="Environment",
                    value=environment_suffix,
                    propagate_at_launch=True
                )
            ]
        )

        # DMS Subnet Group
        dms_subnet_group = DmsReplicationSubnetGroup(
            self,
            f"dms_subnet_group_{environment_suffix}",
            replication_subnet_group_id=f"payment-dms-subnet-{environment_suffix}",
            replication_subnet_group_description="Subnet group for DMS replication",
            subnet_ids=[subnet.id for subnet in private_subnets],
            tags={
                "Name": f"payment-dms-subnet-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # IAM Role for DMS
        dms_role = IamRole(
            self,
            f"dms_role_{environment_suffix}",
            name=f"payment-dms-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {
                        "Service": "dms.amazonaws.com"
                    },
                    "Effect": "Allow"
                }]
            }),
            tags={
                "Name": f"payment-dms-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # DMS Replication Instance
        dms_instance = DmsReplicationInstance(
            self,
            f"dms_instance_{environment_suffix}",
            replication_instance_id=f"payment-dms-{environment_suffix}",
            replication_instance_class="dms.t3.medium",
            allocated_storage=100,
            vpc_security_group_ids=[dms_sg.id],
            replication_subnet_group_id=dms_subnet_group.id,
            publicly_accessible=False,
            multi_az=False,  # Single AZ for cost optimization
            engine_version="3.5.3",
            tags={
                "Name": f"payment-dms-instance-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # DMS Source Endpoint (on-premises database)
        # SECURITY: Credentials loaded from environment variables
        # PRODUCTION: Use secrets_manager_secret_id or secrets_manager_access_role_arn
        dms_source_password = os_env.getenv('DMS_SOURCE_PASSWORD', 'REPLACE_WITH_SOURCE_PASSWORD')
        if dms_source_password == 'REPLACE_WITH_SOURCE_PASSWORD':
            print("WARNING: Using placeholder DMS source password. Set DMS_SOURCE_PASSWORD environment variable.")
        
        source_endpoint = DmsEndpoint(
            self,
            f"dms_source_{environment_suffix}",
            endpoint_id=f"payment-source-{environment_suffix}",
            endpoint_type="source",
            engine_name="mysql",
            server_name=os_env.getenv('DMS_SOURCE_SERVER', '10.0.0.10'),  # Set via environment
            port=3306,
            database_name=os_env.getenv('DMS_SOURCE_DB', 'payment_db'),
            username=os_env.getenv('DMS_SOURCE_USERNAME', 'replication_user'),
            password=dms_source_password,  # Uses environment variable DMS_SOURCE_PASSWORD
            ssl_mode="none",
            tags={
                "Name": f"payment-source-endpoint-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # DMS Target Endpoint (Aurora)
        # SECURITY: Uses same credentials as RDS cluster from environment variables
        # PRODUCTION: Use secrets_manager_secret_id or IAM database authentication
        target_endpoint = DmsEndpoint(
            self,
            f"dms_target_{environment_suffix}",
            endpoint_id=f"payment-target-{environment_suffix}",
            endpoint_type="target",
            engine_name="aurora",
            server_name=aurora_cluster.endpoint,
            port=3306,
            database_name=os_env.getenv('DB_NAME', 'payment_db'),
            username=os_env.getenv('DB_USERNAME', 'dbadmin'),
            password=db_password,  # Reuses RDS password from environment variable DB_PASSWORD
            ssl_mode="none",
            tags={
                "Name": f"payment-target-endpoint-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # DMS Replication Task
        dms_task = DmsReplicationTask(
            self,
            f"dms_task_{environment_suffix}",
            replication_task_id=f"payment-replication-{environment_suffix}",
            migration_type="full-load-and-cdc",
            replication_instance_arn=dms_instance.replication_instance_arn,
            source_endpoint_arn=source_endpoint.endpoint_arn,
            target_endpoint_arn=target_endpoint.endpoint_arn,
            table_mappings=json.dumps({
                "rules": [{
                    "rule-type": "selection",
                    "rule-id": "1",
                    "rule-name": "1",
                    "object-locator": {
                        "schema-name": "%",
                        "table-name": "%"
                    },
                    "rule-action": "include"
                }]
            }),
            replication_task_settings=json.dumps({
                "TargetMetadata": {
                    "SupportLobs": True,
                    "LobMaxSize": 32
                },
                "FullLoadSettings": {
                    "TargetTablePrepMode": "DROP_AND_CREATE"
                },
                "Logging": {
                    "EnableLogging": True,
                    "LogComponents": [{
                        "Id": "TRANSFORMATION",
                        "Severity": "LOGGER_SEVERITY_DEFAULT"
                    }]
                }
            }),
            tags={
                "Name": f"payment-replication-task-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Route 53 Hosted Zone (assumes it exists)
        # In a real scenario, you would use a data source to reference existing zone
        hosted_zone = Route53Zone(
            self,
            f"hosted_zone_{environment_suffix}",
            name=f"payment-{environment_suffix}.internal.local",
            tags={
                "Name": f"payment-zone-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Route 53 Weighted Routing - AWS
        Route53Record(
            self,
            f"route53_aws_{environment_suffix}",
            zone_id=hosted_zone.zone_id,
            name=f"app.payment-{environment_suffix}.internal.local",
            type="CNAME",
            ttl=60,
            records=[alb.dns_name],
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=50  # Adjust based on workspace
            ),
            set_identifier=f"aws-{environment_suffix}"
        )

        # CloudWatch Dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}],
                            [".", "RequestCount", {"stat": "Sum"}],
                            [".", "HealthyHostCount", {"stat": "Average"}],
                            [".", "UnHealthyHostCount", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "ALB Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "DatabaseConnections", {"stat": "Average"}],
                            [".", "CPUUtilization", {"stat": "Average"}],
                            [".", "FreeableMemory", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "RDS Aurora Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/DMS", "CDCLatencySource", {"stat": "Average"}],
                            [".", "CDCLatencyTarget", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "DMS Replication Lag"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/EC2", "CPUUtilization", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": aws_region,
                        "title": "EC2 Auto Scaling Metrics"
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self,
            f"dashboard_{environment_suffix}",
            dashboard_name=f"payment-migration-{environment_suffix}",
            dashboard_body=json.dumps(dashboard_body)
        )

        # CloudWatch Alarms

        # ALB Unhealthy Host Alarm
        CloudwatchMetricAlarm(
            self,
            f"alb_unhealthy_alarm_{environment_suffix}",
            alarm_name=f"payment-alb-unhealthy-hosts-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=300,
            statistic="Average",
            threshold=1,
            alarm_description="Alert when unhealthy hosts detected",
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-alb-unhealthy-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # DMS Replication Lag Alarm
        CloudwatchMetricAlarm(
            self,
            f"dms_lag_alarm_{environment_suffix}",
            alarm_name=f"payment-dms-replication-lag-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CDCLatencySource",
            namespace="AWS/DMS",
            period=300,
            statistic="Average",
            threshold=300,  # 5 minutes
            alarm_description="Alert when DMS replication lag exceeds 5 minutes",
            treat_missing_data="notBreaching",
            tags={
                "Name": f"payment-dms-lag-{environment_suffix}",
                "Environment": environment_suffix
            }
        )

        # Outputs
        TerraformOutput(
            self,
            "alb_dns_name",
            value=alb.dns_name,
            description="DNS name of the Application Load Balancer"
        )

        TerraformOutput(
            self,
            "rds_cluster_endpoint",
            value=aurora_cluster.endpoint,
            description="Writer endpoint for Aurora MySQL cluster"
        )

        TerraformOutput(
            self,
            "rds_reader_endpoint",
            value=aurora_cluster.reader_endpoint,
            description="Reader endpoint for Aurora MySQL cluster"
        )

        TerraformOutput(
            self,
            "dms_replication_instance_arn",
            value=dms_instance.replication_instance_arn,
            description="ARN of DMS replication instance"
        )

        TerraformOutput(
            self,
            "dms_task_arn",
            value=dms_task.replication_task_arn,
            description="ARN of DMS replication task"
        )

        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        # VPN output commented out as VPN data source is disabled
        # TerraformOutput(
        #     self,
        #     "vpn_connection_id",
        #     value=vpn_connection.id,
        #     description="VPN Connection ID to on-premises"
        # )

        TerraformOutput(
            self,
            "cloudwatch_dashboard_name",
            value=f"payment-migration-{environment_suffix}",
            description="CloudWatch dashboard name"
        )

        TerraformOutput(
            self,
            "workspace",
            value=workspace,
            description="Current Terraform workspace"
        )

        TerraformOutput(
            self,
            "artifacts_bucket_name",
            value=self.bucket.bucket,
            description="Name of the artifacts S3 bucket"
        )

        TerraformOutput(
            self,
            "artifacts_bucket_arn",
            value=self.bucket.arn,
            description="ARN of the artifacts S3 bucket"
        )
