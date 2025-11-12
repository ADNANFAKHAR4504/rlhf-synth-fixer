#!/usr/bin/env python
import os
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, TerraformVariable, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate, LaunchTemplateTagSpecifications
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup, LbTargetGroupHealthCheck
from cdktf_cdktf_provider_aws.lb_listener import LbListener, LbListenerDefaultAction
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup, AutoscalingGroupTag
from cdktf_cdktf_provider_aws.dms_replication_subnet_group import DmsReplicationSubnetGroup
from cdktf_cdktf_provider_aws.dms_replication_instance import DmsReplicationInstance
from cdktf_cdktf_provider_aws.dms_endpoint import DmsEndpoint
from cdktf_cdktf_provider_aws.dms_replication_task import DmsReplicationTask
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record, Route53RecordWeightedRoutingPolicy
from cdktf_cdktf_provider_aws.cloudwatch_dashboard import CloudwatchDashboard
from cdktf_cdktf_provider_aws.data_aws_vpn_connection import DataAwsVpnConnection
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi, DataAwsAmiFilter
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret import DataAwsSecretsmanagerSecret
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret_version import DataAwsSecretsmanagerSecretVersion


class PaymentMigrationStack(TerraformStack):
    def __init__(self, scope: Construct, ns: str):
        super().__init__(scope, ns)

        # Variables
        environment_suffix = TerraformVariable(
            self, "environment_suffix",
            type="string",
            description="Unique suffix for resource naming",
            default="dev"
        )

        workspace = TerraformVariable(
            self, "workspace",
            type="string",
            description="Workspace name: legacy-sync or aws-production",
            default="aws-production"
        )

        traffic_weight = TerraformVariable(
            self, "traffic_weight",
            type="number",
            description="Traffic weight for Route53 weighted routing (0-100)",
            default=50
        )

        # Provider
        AwsProvider(self, "aws", region="us-east-1")

        # Common tags
        common_tags = {
            "Environment": environment_suffix.string_value,
            "Project": "PaymentMigration",
            "ManagedBy": "CDKTF",
            "Workspace": workspace.string_value
        }

        # Availability Zones
        azs = ["us-east-1a", "us-east-1b", "us-east-1c"]

        # KMS Key for encryption
        kms_key = KmsKey(
            self, "kms_key",
            description=f"KMS key for payment migration {environment_suffix.string_value}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            tags=common_tags
        )

        KmsAlias(
            self, "kms_alias",
            name=f"alias/payment-migration-{environment_suffix.string_value}",
            target_key_id=kms_key.key_id
        )

        # VPC
        vpc = Vpc(
            self, "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, "Name": f"payment-vpc-{environment_suffix.string_value}"}
        )

        # Internet Gateway
        igw = InternetGateway(
            self, "igw",
            vpc_id=vpc.id,
            tags={**common_tags, "Name": f"payment-igw-{environment_suffix.string_value}"}
        )

        # Public Subnets
        public_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self, f"public_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**common_tags, "Name": f"payment-public-{i}-{environment_suffix.string_value}"}
            )
            public_subnets.append(subnet)

        # Private Subnets
        private_subnets = []
        for i, az in enumerate(azs):
            subnet = Subnet(
                self, f"private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=False,
                tags={**common_tags, "Name": f"payment-private-{i}-{environment_suffix.string_value}"}
            )
            private_subnets.append(subnet)

        # NAT Gateways and EIPs
        nat_gateways = []
        for i, subnet in enumerate(public_subnets):
            eip = Eip(
                self, f"nat_eip_{i}",
                domain="vpc",
                tags={**common_tags, "Name": f"payment-nat-eip-{i}-{environment_suffix.string_value}"}
            )
            nat = NatGateway(
                self, f"nat_gateway_{i}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={**common_tags, "Name": f"payment-nat-{i}-{environment_suffix.string_value}"}
            )
            nat_gateways.append(nat)

        # Public Route Table
        public_rt = RouteTable(
            self, "public_rt",
            vpc_id=vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=igw.id
            )],
            tags={**common_tags, "Name": f"payment-public-rt-{environment_suffix.string_value}"}
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self, f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # Private Route Tables (one per AZ for NAT)
        for i, subnet in enumerate(private_subnets):
            private_rt = RouteTable(
                self, f"private_rt_{i}",
                vpc_id=vpc.id,
                route=[RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gateways[i].id
                )],
                tags={**common_tags, "Name": f"payment-private-rt-{i}-{environment_suffix.string_value}"}
            )
            RouteTableAssociation(
                self, f"private_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=private_rt.id
            )

        # Reference existing VPN connection (data source)
        vpn_connection = DataAwsVpnConnection(
            self, "vpn_connection",
            filter=[{
                "name": "tag:Purpose",
                "values": ["OnPremisesConnectivity"]
            }]
        )

        # Security Groups
        alb_sg = SecurityGroup(
            self, "alb_sg",
            name=f"payment-alb-sg-{environment_suffix.string_value}",
            description="Security group for ALB",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTP"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow HTTPS"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, "Name": f"payment-alb-sg-{environment_suffix.string_value}"}
        )

        app_sg = SecurityGroup(
            self, "app_sg",
            name=f"payment-app-sg-{environment_suffix.string_value}",
            description="Security group for application instances",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=8080,
                    to_port=8080,
                    protocol="tcp",
                    security_groups=[alb_sg.id],
                    description="Allow traffic from ALB"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, "Name": f"payment-app-sg-{environment_suffix.string_value}"}
        )

        rds_sg = SecurityGroup(
            self, "rds_sg",
            name=f"payment-rds-sg-{environment_suffix.string_value}",
            description="Security group for RDS Aurora",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    security_groups=[app_sg.id],
                    description="Allow MySQL from app"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, "Name": f"payment-rds-sg-{environment_suffix.string_value}"}
        )

        dms_sg = SecurityGroup(
            self, "dms_sg",
            name=f"payment-dms-sg-{environment_suffix.string_value}",
            description="Security group for DMS",
            vpc_id=vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=3306,
                    to_port=3306,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"],
                    description="Allow MySQL within VPC"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, "Name": f"payment-dms-sg-{environment_suffix.string_value}"}
        )

        # RDS Aurora Cluster
        db_subnet_group = DbSubnetGroup(
            self, "db_subnet_group",
            name=f"payment-db-subnet-{environment_suffix.string_value}",
            subnet_ids=[s.id for s in private_subnets],
            tags={**common_tags, "Name": f"payment-db-subnet-{environment_suffix.string_value}"}
        )

        # Fetch database credentials from Secrets Manager
        db_secret = DataAwsSecretsmanagerSecret(
            self, "db_secret",
            name="payment-db-credentials"
        )

        db_secret_version = DataAwsSecretsmanagerSecretVersion(
            self, "db_secret_version",
            secret_id=db_secret.id
        )

        aurora_cluster = RdsCluster(
            self, "aurora_cluster",
            cluster_identifier=f"payment-aurora-{environment_suffix.string_value}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.04.0",
            master_username="admin",
            master_password=Fn.lookup(Fn.jsondecode(db_secret_version.secret_string), "password"),
            database_name="payments",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["audit", "error", "general", "slowquery"],
            skip_final_snapshot=True,
            tags={**common_tags, "Name": f"payment-aurora-{environment_suffix.string_value}"}
        )

        # Aurora Instances (1 writer, 2 readers)
        cluster_instances = []
        instance_types = ["writer", "reader", "reader"]
        for i, instance_type in enumerate(instance_types):
            instance = RdsClusterInstance(
                self, f"aurora_instance_{i}",
                identifier=f"payment-aurora-{instance_type}-{i}-{environment_suffix.string_value}",
                cluster_identifier=aurora_cluster.id,
                instance_class="db.r6g.large",
                engine=aurora_cluster.engine,
                engine_version=aurora_cluster.engine_version,
                publicly_accessible=False,
                tags={**common_tags, "Name": f"payment-aurora-{instance_type}-{i}-{environment_suffix.string_value}"}
            )
            cluster_instances.append(instance)

        # Application Load Balancer
        alb = Lb(
            self, "alb",
            name=f"payment-alb-{environment_suffix.string_value}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[s.id for s in public_subnets],
            enable_deletion_protection=False,
            tags={**common_tags, "Name": f"payment-alb-{environment_suffix.string_value}"}
        )

        # Target Group
        target_group = LbTargetGroup(
            self, "target_group",
            name=f"payment-tg-{environment_suffix.string_value}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="instance",
            health_check=LbTargetGroupHealthCheck(
                enabled=True,
                path="/health",
                protocol="HTTP",
                healthy_threshold=2,
                unhealthy_threshold=2,
                timeout=5,
                interval=30
            ),
            tags={**common_tags, "Name": f"payment-tg-{environment_suffix.string_value}"}
        )

        # ALB Listener
        LbListener(
            self, "alb_listener",
            load_balancer_arn=alb.arn,
            port=80,
            protocol="HTTP",
            default_action=[LbListenerDefaultAction(
                type="forward",
                target_group_arn=target_group.arn
            )]
        )

        # IAM Role for EC2 instances
        ec2_role = IamRole(
            self, "ec2_role",
            name=f"payment-ec2-role-{environment_suffix.string_value}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }""",
            tags=common_tags
        )

        IamRolePolicyAttachment(
            self, "ec2_ssm_policy",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
        )

        IamRolePolicyAttachment(
            self, "ec2_cloudwatch_policy",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        )

        instance_profile = IamInstanceProfile(
            self, "instance_profile",
            name=f"payment-instance-profile-{environment_suffix.string_value}",
            role=ec2_role.name
        )

        # Get latest Amazon Linux 2 AMI
        ami = DataAwsAmi(
            self, "amazon_linux_2",
            most_recent=True,
            owners=["amazon"],
            filter=[
                DataAwsAmiFilter(
                    name="name",
                    values=["amzn2-ami-hvm-*-x86_64-gp2"]
                ),
                DataAwsAmiFilter(
                    name="virtualization-type",
                    values=["hvm"]
                )
            ]
        )

        # Launch Template
        user_data = """#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent
# Application setup would go here
"""

        launch_template = LaunchTemplate(
            self, "launch_template",
            name=f"payment-lt-{environment_suffix.string_value}",
            image_id=ami.id,
            instance_type="t3.medium",
            iam_instance_profile={"arn": instance_profile.arn},
            vpc_security_group_ids=[app_sg.id],
            user_data=Fn.base64encode(user_data),
            tag_specifications=[
                LaunchTemplateTagSpecifications(
                    resource_type="instance",
                    tags={**common_tags, "Name": f"payment-app-{environment_suffix.string_value}"}
                )
            ],
            tags={**common_tags, "Name": f"payment-lt-{environment_suffix.string_value}"}
        )

        # Auto Scaling Group
        asg = AutoscalingGroup(
            self, "asg",
            name=f"payment-asg-{environment_suffix.string_value}",
            min_size=3,
            max_size=9,
            desired_capacity=3,
            health_check_type="ELB",
            health_check_grace_period=300,
            vpc_zone_identifier=[s.id for s in private_subnets],
            target_group_arns=[target_group.arn],
            launch_template={
                "id": launch_template.id,
                "version": "$Latest"
            },
            tag=[AutoscalingGroupTag(
                key=k,
                value=v,
                propagate_at_launch=True
            ) for k, v in {**common_tags, "Name": f"payment-app-{environment_suffix.string_value}"}.items()]
        )

        # DMS Resources
        dms_subnet_group = DmsReplicationSubnetGroup(
            self, "dms_subnet_group",
            replication_subnet_group_id=f"payment-dms-subnet-{environment_suffix.string_value}",
            replication_subnet_group_description="DMS subnet group for payment migration",
            subnet_ids=[s.id for s in private_subnets],
            tags={**common_tags, "Name": f"payment-dms-subnet-{environment_suffix.string_value}"}
        )

        # IAM Role for DMS
        dms_role = IamRole(
            self, "dms_role",
            name=f"payment-dms-role-{environment_suffix.string_value}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Principal": {"Service": "dms.amazonaws.com"},
                    "Effect": "Allow"
                }]
            }""",
            tags=common_tags
        )

        IamRolePolicyAttachment(
            self, "dms_cloudwatch_policy",
            role=dms_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonDMSCloudWatchLogsRole"
        )

        dms_instance = DmsReplicationInstance(
            self, "dms_instance",
            replication_instance_id=f"payment-dms-{environment_suffix.string_value}",
            replication_instance_class="dms.t3.medium",
            allocated_storage=100,
            vpc_security_group_ids=[dms_sg.id],
            replication_subnet_group_id=dms_subnet_group.id,
            publicly_accessible=False,
            multi_az=False,
            engine_version="3.5.1",
            tags={**common_tags, "Name": f"payment-dms-{environment_suffix.string_value}"}
        )

        # DMS Source Endpoint (on-premises - example configuration)
        source_endpoint = DmsEndpoint(
            self, "dms_source_endpoint",
            endpoint_id=f"payment-source-{environment_suffix.string_value}",
            endpoint_type="source",
            engine_name="mysql",
            server_name="onprem.example.com",
            port=3306,
            database_name="payments",
            username="dms_user",
            password=Fn.lookup(Fn.jsondecode(db_secret_version.secret_string), "dms_password"),
            ssl_mode="none",
            tags={**common_tags, "Name": f"payment-source-{environment_suffix.string_value}"}
        )

        # DMS Target Endpoint (Aurora)
        target_endpoint = DmsEndpoint(
            self, "dms_target_endpoint",
            endpoint_id=f"payment-target-{environment_suffix.string_value}",
            endpoint_type="target",
            engine_name="aurora",
            server_name=aurora_cluster.endpoint,
            port=3306,
            database_name="payments",
            username="admin",
            password=Fn.lookup(Fn.jsondecode(db_secret_version.secret_string), "password"),
            ssl_mode="none",
            tags={**common_tags, "Name": f"payment-target-{environment_suffix.string_value}"}
        )

        # DMS Replication Task
        dms_task = DmsReplicationTask(
            self, "dms_task",
            replication_task_id=f"payment-replication-{environment_suffix.string_value}",
            migration_type="full-load-and-cdc",
            replication_instance_arn=dms_instance.replication_instance_arn,
            source_endpoint_arn=source_endpoint.endpoint_arn,
            target_endpoint_arn=target_endpoint.endpoint_arn,
            table_mappings="""{
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
            }""",
            replication_task_settings="""{
                "Logging": {
                    "EnableLogging": true,
                    "LogComponents": [{
                        "Id": "TRANSFORMATION",
                        "Severity": "LOGGER_SEVERITY_DEFAULT"
                    }]
                }
            }""",
            tags={**common_tags, "Name": f"payment-replication-{environment_suffix.string_value}"}
        )

        # Route 53 Zone (example - assumes zone exists or creates new)
        hosted_zone = Route53Zone(
            self, "hosted_zone",
            name="payment-migration.example.com",
            tags={**common_tags, "Name": f"payment-zone-{environment_suffix.string_value}"}
        )

        # Route 53 Weighted Records
        Route53Record(
            self, "route53_aws",
            zone_id=hosted_zone.zone_id,
            name="app.payment-migration.example.com",
            type="A",
            set_identifier=f"aws-{environment_suffix.string_value}",
            weighted_routing_policy=Route53RecordWeightedRoutingPolicy(
                weight=traffic_weight.number_value
            ),
            alias={
                "name": alb.dns_name,
                "zone_id": alb.zone_id,
                "evaluate_target_health": True
            }
        )

        # CloudWatch Dashboard
        dashboard_body = {
            "widgets": [
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/ApplicationELB", "TargetResponseTime", {"stat": "Average"}],
                            [".", "RequestCount", {"stat": "Sum"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-1",
                        "title": "ALB Metrics"
                    }
                },
                {
                    "type": "metric",
                    "properties": {
                        "metrics": [
                            ["AWS/RDS", "CPUUtilization", {"stat": "Average"}],
                            [".", "DatabaseConnections", {"stat": "Average"}]
                        ],
                        "period": 300,
                        "stat": "Average",
                        "region": "us-east-1",
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
                        "region": "us-east-1",
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
                        "region": "us-east-1",
                        "title": "EC2 Auto Scaling Metrics"
                    }
                }
            ]
        }

        CloudwatchDashboard(
            self, "cloudwatch_dashboard",
            dashboard_name=f"payment-migration-{environment_suffix.string_value}",
            dashboard_body=Fn.jsonencode(dashboard_body)
        )

        # Outputs
        TerraformOutput(
            self, "alb_dns_name",
            value=alb.dns_name,
            description="ALB DNS name for application access"
        )

        TerraformOutput(
            self, "rds_cluster_endpoint",
            value=aurora_cluster.endpoint,
            description="RDS Aurora cluster endpoint"
        )

        TerraformOutput(
            self, "rds_reader_endpoint",
            value=aurora_cluster.reader_endpoint,
            description="RDS Aurora reader endpoint"
        )

        TerraformOutput(
            self, "dms_replication_status",
            value=dms_task.status,
            description="DMS replication task status"
        )

        TerraformOutput(
            self, "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self, "vpn_connection_id",
            value=vpn_connection.vpn_connection_id,
            description="VPN connection ID for on-premises connectivity"
        )


app = App()
PaymentMigrationStack(app, "payment-migration")
app.synth()
