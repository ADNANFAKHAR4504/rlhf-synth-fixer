"""TAP Stack module for CDKTF Python infrastructure - Fintech Payment Processing."""

from cdktf import TerraformStack, S3Backend, Fn, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.security_group import (
    SecurityGroup,
    SecurityGroupIngress,
    SecurityGroupEgress
)
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
import json
import os


class TapStack(TerraformStack):
    """CDKTF Python stack for Fintech Payment Processing Infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        aws_region = kwargs.get('aws_region', 'us-east-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

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

        # Get current AWS account ID
        current = DataAwsCallerIdentity(self, "current")

        # Get availability zones
        azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available"
        )

        # ===========================
        # VPC and Networking
        # ===========================

        # Create VPC
        vpc = Vpc(
            self,
            "payment_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"payment-vpc-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "payment_igw",
            vpc_id=vpc.id,
            tags={
                "Name": f"payment-igw-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # Create public subnets in 3 AZs
        public_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"public_subnet_{i+1}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"payment-public-subnet-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Project": "PaymentProcessing",
                    "CostCenter": "Finance"
                }
            )
            public_subnets.append(subnet)

        # Create private subnets in 3 AZs
        private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i+1}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+11}.0/24",
                availability_zone=Fn.element(azs.names, i),
                tags={
                    "Name": f"payment-private-subnet-{i+1}-{environment_suffix}",
                    "Environment": environment_suffix,
                    "Project": "PaymentProcessing",
                    "CostCenter": "Finance"
                }
            )
            private_subnets.append(subnet)

        # Create single NAT Gateway in first public subnet (cost optimization)
        eip_nat = Eip(
            self,
            "nat_eip",
            domain="vpc",
            tags={
                "Name": f"payment-nat-eip-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        nat_gateway = NatGateway(
            self,
            "payment_nat",
            allocation_id=eip_nat.id,
            subnet_id=public_subnets[0].id,
            tags={
                "Name": f"payment-nat-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            },
            depends_on=[igw]
        )

        # Create public route table
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id
                )
            ],
            tags={
                "Name": f"payment-public-rt-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"public_rt_assoc_{i+1}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Create private route table
        private_rt = RouteTable(
            self,
            "private_rt",
            vpc_id=vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gateway.id
                )
            ],
            tags={
                "Name": f"payment-private-rt-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(private_subnets):
            RouteTableAssociation(
                self,
                f"private_rt_assoc_{i+1}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        # ===========================
        # Security Groups
        # ===========================

        # ALB Security Group
        alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=f"payment-alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="HTTPS from internet",
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"]
                ),
                SecurityGroupIngress(
                    description="HTTP from internet",
                    from_port=80,
                    to_port=80,
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
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # Application Security Group (EC2/ECS)
        app_sg = SecurityGroup(
            self,
            "app_sg",
            name=f"payment-app-sg-{environment_suffix}",
            description="Security group for application tier",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="HTTP from ALB",
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    security_groups=[alb_sg.id]
                ),
                SecurityGroupIngress(
                    description="App port from ALB",
                    from_port=8080,
                    to_port=8080,
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
                "Name": f"payment-app-sg-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # RDS Security Group
        rds_sg = SecurityGroup(
            self,
            "rds_sg",
            name=f"payment-rds-sg-{environment_suffix}",
            description="Security group for RDS Aurora MySQL",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    description="MySQL from application tier",
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[app_sg.id]
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
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # ===========================
        # S3 Buckets
        # ===========================

        # Static Assets Bucket
        assets_bucket = S3Bucket(
            self,
            "assets_bucket",
            bucket=f"payment-static-assets-{environment_suffix}",
            tags={
                "Name": f"payment-static-assets-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # Enable versioning on assets bucket
        S3BucketVersioningA(
            self,
            "assets_bucket_versioning",
            bucket=assets_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # Encrypt assets bucket
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "assets_bucket_encryption",
            bucket=assets_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=(
                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                            sse_algorithm="AES256"
                        )
                    )
                )
            ]
        )

        # Block public access to assets bucket
        S3BucketPublicAccessBlock(
            self,
            "assets_bucket_public_access_block",
            bucket=assets_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # VPC Flow Logs Bucket
        flow_logs_bucket = S3Bucket(
            self,
            "flow_logs_bucket",
            bucket=f"payment-vpc-flow-logs-{environment_suffix}",
            tags={
                "Name": f"payment-vpc-flow-logs-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # Enable versioning on flow logs bucket
        S3BucketVersioningA(
            self,
            "flow_logs_bucket_versioning",
            bucket=flow_logs_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )

        # Encrypt flow logs bucket
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "flow_logs_bucket_encryption",
            bucket=flow_logs_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=(
                        S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                            sse_algorithm="AES256"
                        )
                    )
                )
            ]
        )

        # Block public access to flow logs bucket
        S3BucketPublicAccessBlock(
            self,
            "flow_logs_bucket_public_access_block",
            bucket=flow_logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # Flow logs bucket policy
        flow_logs_bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AWSLogDeliveryWrite",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "delivery.logs.amazonaws.com"
                    },
                    "Action": "s3:PutObject",
                    "Resource": f"arn:aws:s3:::{flow_logs_bucket.bucket}/*",
                    "Condition": {
                        "StringEquals": {
                            "s3:x-amz-acl": "bucket-owner-full-control"
                        }
                    }
                },
                {
                    "Sid": "AWSLogDeliveryAclCheck",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "delivery.logs.amazonaws.com"
                    },
                    "Action": "s3:GetBucketAcl",
                    "Resource": f"arn:aws:s3:::{flow_logs_bucket.bucket}"
                }
            ]
        }

        S3BucketPolicy(
            self,
            "flow_logs_bucket_policy",
            bucket=flow_logs_bucket.id,
            policy=Fn.jsonencode(flow_logs_bucket_policy)
        )

        # ===========================
        # VPC Flow Logs
        # ===========================

        # IAM role for VPC Flow Logs
        flow_logs_role = IamRole(
            self,
            "flow_logs_role",
            name=f"payment-flow-logs-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "vpc-flow-logs.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                "Name": f"payment-flow-logs-role-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # IAM policy for VPC Flow Logs
        flow_logs_policy = IamRolePolicy(
            self,
            "flow_logs_policy",
            name=f"payment-flow-logs-policy-{environment_suffix}",
            role=flow_logs_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": "*"
                    }
                ]
            })
        )

        # Create VPC Flow Logs
        FlowLog(
            self,
            "vpc_flow_logs",
            log_destination_type="s3",
            log_destination=f"arn:aws:s3:::{flow_logs_bucket.bucket}",
            traffic_type="ALL",
            vpc_id=vpc.id,
            tags={
                "Name": f"payment-vpc-flow-logs-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # ===========================
        # RDS Aurora MySQL Cluster
        # ===========================

        # DB Subnet Group
        db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"payment-db-subnet-group-{environment_suffix}",
            subnet_ids=[subnet.id for subnet in private_subnets],
            description="Subnet group for RDS Aurora MySQL cluster",
            tags={
                "Name": f"payment-db-subnet-group-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # RDS Aurora Cluster (Serverless v2)
        aurora_cluster = RdsCluster(
            self,
            "aurora_cluster",
            cluster_identifier=f"payment-aurora-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",  # Updated to valid version
            engine_mode="provisioned",
            database_name="paymentdb",
            master_username="admin",
            master_password="ChangeMe123!",  # Note: In production, use Secrets Manager
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            storage_encrypted=True,
            backup_retention_period=35,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            skip_final_snapshot=True,
            deletion_protection=False,
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 2
            },
            tags={
                "Name": f"payment-aurora-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # RDS Cluster Instances (2 for multi-AZ)
        aurora_instance_1 = RdsClusterInstance(
            self,
            "aurora_instance_1",
            identifier=f"payment-aurora-instance-1-{environment_suffix}",
            cluster_identifier=aurora_cluster.id,
            instance_class="db.serverless",
            engine=aurora_cluster.engine,
            engine_version=aurora_cluster.engine_version,
            publicly_accessible=False,
            tags={
                "Name": f"payment-aurora-instance-1-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        aurora_instance_2 = RdsClusterInstance(
            self,
            "aurora_instance_2",
            identifier=f"payment-aurora-instance-2-{environment_suffix}",
            cluster_identifier=aurora_cluster.id,
            instance_class="db.serverless",
            engine=aurora_cluster.engine,
            engine_version=aurora_cluster.engine_version,
            publicly_accessible=False,
            tags={
                "Name": f"payment-aurora-instance-2-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # ===========================
        # Application Load Balancer
        # ===========================

        # ALB
        alb = Lb(
            self,
            "payment_alb",
            name=f"payment-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[subnet.id for subnet in public_subnets],
            enable_deletion_protection=False,
            tags={
                "Name": f"payment-alb-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # Target Group
        target_group = LbTargetGroup(
            self,
            "alb_target_group",
            name=f"payment-tg-{environment_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="ip",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher="200",
                path="/health",
                port="traffic-port",
                protocol="HTTP",
                timeout=5,
                unhealthy_threshold=2
            ),
            tags={
                "Name": f"payment-tg-{environment_suffix}",
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # HTTP Listener (redirect to HTTPS) - UPDATED to forward instead of redirect
        http_listener = LbListener(
            self,
            "alb_http_listener",
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
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # ===========================
        # CloudWatch Alarms
        # ===========================

        # ALB Target Unhealthy Hosts Alarm
        CloudwatchMetricAlarm(
            self,
            "alb_unhealthy_hosts_alarm",
            alarm_name=f"payment-alb-unhealthy-hosts-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="UnHealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=0,
            alarm_description="Alert when ALB has unhealthy targets",
            dimensions={
                "LoadBalancer": alb.arn_suffix,
                "TargetGroup": target_group.arn_suffix
            },
            tags={
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # RDS CPU Utilization Alarm
        CloudwatchMetricAlarm(
            self,
            "rds_cpu_alarm",
            alarm_name=f"payment-rds-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when RDS CPU utilization exceeds 80%",
            dimensions={
                "DBClusterIdentifier": aurora_cluster.cluster_identifier
            },
            tags={
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # RDS Database Connections Alarm
        CloudwatchMetricAlarm(
            self,
            "rds_connections_alarm",
            alarm_name=f"payment-rds-connections-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=100,
            alarm_description="Alert when RDS database connections exceed 100",
            dimensions={
                "DBClusterIdentifier": aurora_cluster.cluster_identifier
            },
            tags={
                "Environment": environment_suffix,
                "Project": "PaymentProcessing",
                "CostCenter": "Finance"
            }
        )

        # ===========================
        # Outputs
        # ===========================

        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=alb.dns_name,
            description="Application Load Balancer DNS name"
        )

        TerraformOutput(
            self,
            "alb_arn",
            value=alb.arn,
            description="Application Load Balancer ARN"
        )

        TerraformOutput(
            self,
            "rds_cluster_endpoint",
            value=aurora_cluster.endpoint,
            description="RDS Aurora cluster endpoint"
        )

        TerraformOutput(
            self,
            "rds_cluster_reader_endpoint",
            value=aurora_cluster.reader_endpoint,
            description="RDS Aurora cluster reader endpoint"
        )

        TerraformOutput(
            self,
            "static_assets_bucket_name",
            value=assets_bucket.bucket,
            description="S3 bucket for static assets"
        )

        TerraformOutput(
            self,
            "flow_logs_bucket_name",
            value=flow_logs_bucket.bucket,
            description="S3 bucket for VPC flow logs"
        )

        TerraformOutput(
            self,
            "public_subnet_ids",
            value=Fn.jsonencode([subnet.id for subnet in public_subnets]),
            description="Public subnet IDs"
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=Fn.jsonencode([subnet.id for subnet in private_subnets]),
            description="Private subnet IDs"
        )

        # Write outputs to flat file for integration tests
        self._write_outputs_to_file()

    def _write_outputs_to_file(self):
        """Write outputs to cfn-outputs/flat-outputs.json for integration tests."""
        outputs_dir = os.path.join(os.path.dirname(__file__), "..", "cfn-outputs")
        os.makedirs(outputs_dir, exist_ok=True)

        # Note: In CDKTF, outputs are only available after deployment
        # This is a placeholder for the expected structure
        outputs = {
            "vpc_id": "TBD after deployment",
            "alb_dns_name": "TBD after deployment",
            "alb_arn": "TBD after deployment",
            "rds_cluster_endpoint": "TBD after deployment",
            "rds_cluster_reader_endpoint": "TBD after deployment",
            "static_assets_bucket_name": "TBD after deployment",
            "flow_logs_bucket_name": "TBD after deployment",
            "public_subnet_ids": "TBD after deployment",
            "private_subnet_ids": "TBD after deployment"
        }

        output_file = os.path.join(outputs_dir, "flat-outputs.json")
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(outputs, f, indent=2)
