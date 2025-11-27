"""Cross-Region Migration Stack for Payment Processing Infrastructure."""

import json
import base64
from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.rds_global_cluster import RdsGlobalCluster
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener
from cdktf_cdktf_provider_aws.acm_certificate import AcmCertificate
from cdktf_cdktf_provider_aws.route53_zone import Route53Zone
from cdktf_cdktf_provider_aws.route53_record import Route53Record
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sfn_state_machine import SfnStateMachine
from cdktf_cdktf_provider_aws.vpc_peering_connection import VpcPeeringConnection
from cdktf_cdktf_provider_aws.vpc_peering_connection_accepter import VpcPeeringConnectionAccepterA
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias


class TapStack(TerraformStack):
    """CDKTF Python stack for cross-region migration infrastructure."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        **kwargs
    ):
        """Initialize the migration stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get('environment_suffix', 'dev')
        primary_region = kwargs.get('primary_region', 'us-east-1')
        secondary_region = kwargs.get('secondary_region', 'eu-west-1')
        state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
        state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
        default_tags = kwargs.get('default_tags', {})

        # Configure AWS Provider for secondary region (eu-west-1)
        aws_provider = AwsProvider(
            self,
            "aws",
            region=secondary_region,
            default_tags=[default_tags],
        )

        # Configure AWS Provider for primary region (us-east-1)
        aws_provider_primary = AwsProvider(
            self,
            "aws_primary",
            region=primary_region,
            default_tags=[default_tags],
            alias="primary"
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

        # Get current AWS account info
        current_account = DataAwsCallerIdentity(self, "current")

        # Get availability zones for secondary region
        azs = DataAwsAvailabilityZones(
            self,
            "azs",
            state="available"
        )

        # 1. VPC Infrastructure in eu-west-1 (Requirement 1)
        vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.1.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"vpc-migration-{environment_suffix}"}
        )

        # Create 3 public subnets
        public_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"public_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.1.{i}.0/24",
                availability_zone=Fn.element(azs.names, i),
                map_public_ip_on_launch=True,
                tags={"Name": f"public-subnet-{i}-{environment_suffix}"}
            )
            public_subnets.append(subnet)

        # Create 3 private subnets
        private_subnets = []
        for i in range(3):
            subnet = Subnet(
                self,
                f"private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.1.{i+10}.0/24",
                availability_zone=Fn.element(azs.names, i),
                tags={"Name": f"private-subnet-{i}-{environment_suffix}"}
            )
            private_subnets.append(subnet)

        # Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=vpc.id,
            tags={"Name": f"igw-migration-{environment_suffix}"}
        )

        # Public route table with route to IGW (inline route)
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=vpc.id,
            route=[{
                "cidrBlock": "0.0.0.0/0",
                "gatewayId": igw.id
            }],
            tags={"Name": f"public-rt-{environment_suffix}"}
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self,
                f"public_rta_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # NAT Gateways (one per AZ) with EIPs
        nat_gateways = []
        for i in range(3):
            eip = Eip(
                self,
                f"nat_eip_{i}",
                domain="vpc",
                tags={"Name": f"nat-eip-{i}-{environment_suffix}"}
            )
            nat = NatGateway(
                self,
                f"nat_{i}",
                allocation_id=eip.id,
                subnet_id=public_subnets[i].id,
                tags={"Name": f"nat-{i}-{environment_suffix}"},
                depends_on=[igw]
            )
            nat_gateways.append(nat)

        # Private route tables (one per AZ) with routes to NAT gateways
        for i in range(3):
            private_rt = RouteTable(
                self,
                f"private_rt_{i}",
                vpc_id=vpc.id,
                route=[{
                    "cidrBlock": "0.0.0.0/0",
                    "natGatewayId": nat_gateways[i].id
                }],
                tags={"Name": f"private-rt-{i}-{environment_suffix}"}
            )
            RouteTableAssociation(
                self,
                f"private_rta_{i}",
                subnet_id=private_subnets[i].id,
                route_table_id=private_rt.id
            )

        # 10. KMS Key for encryption (Requirement 10)
        kms_key = KmsKey(
            self,
            "kms_key",
            description=f"KMS key for cross-region migration {environment_suffix}",
            enable_key_rotation=True,
            deletion_window_in_days=7,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{current_account.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow cross-region replication",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "rds.amazonaws.com"
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:CreateGrant",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "StringEquals": {
                                "kms:ViaService": [
                                    f"rds.{primary_region}.amazonaws.com",
                                    f"rds.{secondary_region}.amazonaws.com"
                                ]
                            }
                        }
                    }
                ]
            }),
            tags={"Name": f"kms-migration-{environment_suffix}"}
        )

        KmsAlias(
            self,
            "kms_alias",
            name=f"alias/migration-{environment_suffix}",
            target_key_id=kms_key.id
        )

        # Security Groups (Requirement 1)
        # ALB Security Group (dictionary-based ingress/egress)
        alb_sg = SecurityGroup(
            self,
            "alb_sg",
            name=f"alb-sg-{environment_suffix}",
            description="Security group for Application Load Balancer",
            vpc_id=vpc.id,
            ingress=[
                {
                    "from_port": 443,
                    "to_port": 443,
                    "protocol": "tcp",
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "HTTPS from internet"
                },
                {
                    "from_port": 80,
                    "to_port": 80,
                    "protocol": "tcp",
                    "cidr_blocks": ["0.0.0.0/0"],
                    "description": "HTTP from internet"
                }
            ],
            egress=[{
                "from_port": 0,
                "to_port": 0,
                "protocol": "-1",
                "cidr_blocks": ["0.0.0.0/0"],
                "description": "All outbound traffic"
            }],
            tags={"Name": f"alb-sg-{environment_suffix}"}
        )

        # EC2 Security Group
        ec2_sg = SecurityGroup(
            self,
            "ec2_sg",
            name=f"ec2-sg-{environment_suffix}",
            description="Security group for EC2 instances",
            vpc_id=vpc.id,
            ingress=[
                {
                    "from_port": 443,
                    "to_port": 443,
                    "protocol": "tcp",
                    "security_groups": [alb_sg.id],
                    "description": "HTTPS from ALB"
                },
                {
                    "from_port": 8080,
                    "to_port": 8080,
                    "protocol": "tcp",
                    "security_groups": [alb_sg.id],
                    "description": "App port from ALB"
                }
            ],
            egress=[{
                "from_port": 0,
                "to_port": 0,
                "protocol": "-1",
                "cidr_blocks": ["0.0.0.0/0"],
                "description": "All outbound traffic"
            }],
            tags={"Name": f"ec2-sg-{environment_suffix}"}
        )

        # Aurora Security Group
        aurora_sg = SecurityGroup(
            self,
            "aurora_sg",
            name=f"aurora-sg-{environment_suffix}",
            description="Security group for Aurora cluster",
            vpc_id=vpc.id,
            ingress=[{
                "from_port": 3306,
                "to_port": 3306,
                "protocol": "tcp",
                "security_groups": [ec2_sg.id],
                "description": "MySQL from EC2"
            }],
            egress=[{
                "from_port": 0,
                "to_port": 0,
                "protocol": "-1",
                "cidr_blocks": ["0.0.0.0/0"],
                "description": "All outbound traffic"
            }],
            tags={"Name": f"aurora-sg-{environment_suffix}"}
        )

        # 2. Aurora Global Database Cluster (Requirement 2)
        global_cluster = RdsGlobalCluster(
            self,
            "global_cluster",
            global_cluster_identifier=f"payment-global-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.05.2",
            database_name="payments",
            storage_encrypted=True
        )

        # Aurora secondary cluster in eu-west-1
        aurora_cluster = RdsCluster(
            self,
            "aurora_cluster",
            cluster_identifier=f"payment-cluster-{environment_suffix}",
            engine="aurora-mysql",
            engine_version="8.0.mysql_aurora.3.05.2",
            database_name="payments",
            master_username="admin",
            master_password="ChangeMe123!",  # In production, use AWS Secrets Manager
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            db_subnet_group_name=None,  # Will create inline
            vpc_security_group_ids=[aurora_sg.id],
            global_cluster_identifier=global_cluster.id,
            storage_encrypted=True,
            kms_key_id=kms_key.arn,
            skip_final_snapshot=True,
            depends_on=[global_cluster],
            tags={"Name": f"aurora-cluster-{environment_suffix}"}
        )

        # Aurora instances (writer and reader)
        aurora_instances = []
        for i in range(2):
            instance = RdsClusterInstance(
                self,
                f"aurora_instance_{i}",
                identifier=f"payment-instance-{i}-{environment_suffix}",
                cluster_identifier=aurora_cluster.id,
                instance_class="db.r5.large",
                engine="aurora-mysql",
                engine_version="8.0.mysql_aurora.3.05.2",
                publicly_accessible=False,
                tags={"Name": f"aurora-instance-{i}-{environment_suffix}"}
            )
            aurora_instances.append(instance)

        # 3. IAM Role for EC2 instances (Requirement 3)
        ec2_role = IamRole(
            self,
            "ec2_role",
            name=f"ec2-payment-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"ec2-role-{environment_suffix}"}
        )

        # Attach policies for ECR and CloudWatch access
        IamRolePolicyAttachment(
            self,
            "ec2_ecr_policy",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
        )

        IamRolePolicyAttachment(
            self,
            "ec2_cloudwatch_policy",
            role=ec2_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
        )

        # IAM Instance Profile
        instance_profile = IamInstanceProfile(
            self,
            "instance_profile",
            name=f"ec2-payment-profile-{environment_suffix}",
            role=ec2_role.name
        )

        # Get Amazon Linux 2 AMI
        ami = DataAwsAmi(
            self,
            "amazon_linux_2",
            most_recent=True,
            owners=["amazon"],
            filter=[
                {
                    "name": "name",
                    "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
                },
                {
                    "name": "virtualization-type",
                    "values": ["hvm"]
                }
            ]
        )

        # User data script for payment processor
        user_data = base64.b64encode("""#!/bin/bash
yum update -y
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -aG docker ec2-user

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Pull and run payment processor container (placeholder)
docker run -d -p 8080:8080 --name payment-processor nginx:latest
""".encode()).decode()

        # 3. Launch Template (Requirement 3) - Dictionary-based iam_instance_profile
        launch_template = LaunchTemplate(
            self,
            "launch_template",
            name=f"payment-lt-{environment_suffix}",
            image_id=ami.id,
            instance_type="t3.medium",
            user_data=user_data,
            iam_instance_profile={
                "name": instance_profile.name
            },
            vpc_security_group_ids=[ec2_sg.id],
            monitoring={"enabled": True},
            metadata_options={
                "http_endpoint": "enabled",
                "http_tokens": "required",
                "http_put_response_hop_limit": 1
            },
            tag_specifications=[{
                "resource_type": "instance",
                "tags": {"Name": f"payment-processor-{environment_suffix}"}
            }]
        )

        # 4. Application Load Balancer (Requirement 4)
        alb = Lb(
            self,
            "alb",
            name=f"payment-alb-{environment_suffix}",
            internal=False,
            load_balancer_type="application",
            security_groups=[alb_sg.id],
            subnets=[s.id for s in public_subnets],
            enable_deletion_protection=False,
            enable_cross_zone_load_balancing=True,
            tags={"Name": f"payment-alb-{environment_suffix}"}
        )

        # Self-signed certificate for HTTPS (in production, use ACM with validated domain)
        certificate = AcmCertificate(
            self,
            "certificate",
            domain_name=f"payment.example-{environment_suffix}.com",
            validation_method="DNS",
            lifecycle={"create_before_destroy": True},
            tags={"Name": f"payment-cert-{environment_suffix}"}
        )

        # Target Group (dictionary-based health_check)
        target_group = LbTargetGroup(
            self,
            "target_group",
            name=f"payment-tg-{environment_suffix}",
            port=8080,
            protocol="HTTP",
            vpc_id=vpc.id,
            target_type="instance",
            deregistration_delay="30",
            health_check={
                "enabled": True,
                "path": "/health",
                "protocol": "HTTP",
                "port": "8080",
                "healthy_threshold": 2,
                "unhealthy_threshold": 3,
                "timeout": 5,
                "interval": 30,
                "matcher": "200"
            },
            tags={"Name": f"payment-tg-{environment_suffix}"}
        )

        # ALB Listener (dictionary-based default_action)
        LbListener(
            self,
            "alb_listener",
            load_balancer_arn=alb.arn,
            port=443,
            protocol="HTTPS",
            ssl_policy="ELBSecurityPolicy-TLS13-1-2-2021-06",
            certificate_arn=certificate.arn,
            default_action=[{
                "type": "forward",
                "target_group_arn": target_group.arn
            }]
        )

        # 3. Auto Scaling Group (Requirement 3) - Dictionary-based tag
        asg = AutoscalingGroup(
            self,
            "asg",
            name=f"payment-asg-{environment_suffix}",
            min_size=2,
            max_size=6,
            desired_capacity=2,
            health_check_type="ELB",
            health_check_grace_period=300,
            vpc_zone_identifier=[s.id for s in private_subnets],
            target_group_arns=[target_group.arn],
            launch_template={
                "id": launch_template.id,
                "version": "$Latest"
            },
            tag=[{
                "key": "Name",
                "value": f"payment-processor-{environment_suffix}",
                "propagateAtLaunch": True
            }],
            depends_on=[target_group]
        )

        # 5. Route 53 Hosted Zone and Weighted Routing (Requirement 5)
        hosted_zone = Route53Zone(
            self,
            "hosted_zone",
            name=f"payment-{environment_suffix}.example.com",
            force_destroy=True,
            tags={"Name": f"payment-zone-{environment_suffix}"}
        )

        # Weighted routing record for eu-west-1 (0% initially)
        Route53Record(
            self,
            "route53_record_eu",
            zone_id=hosted_zone.zone_id,
            name=f"api.payment-{environment_suffix}.example.com",
            type="A",
            weighted_routing_policy={
                "weight": 0
            },
            set_identifier=f"eu-west-1-{environment_suffix}",
            alias={
                "name": alb.dns_name,
                "zone_id": alb.zone_id,
                "evaluate_target_health": True
            }
        )

        # Weighted routing record for us-east-1 (100% initially)
        # Note: This assumes ALB exists in us-east-1
        Route53Record(
            self,
            "route53_record_us",
            zone_id=hosted_zone.zone_id,
            name=f"api.payment-{environment_suffix}.example.com",
            type="A",
            weighted_routing_policy={
                "weight": 100
            },
            set_identifier=f"us-east-1-{environment_suffix}",
            alias={
                "name": "primary-alb.example.com",  # Placeholder - would be actual us-east-1 ALB
                "zone_id": "Z35SXDOTRQ7X7K",  # Placeholder zone ID
                "evaluate_target_health": True
            }
        )

        # 6. CloudWatch Alarms (Requirement 6)
        # Replication lag alarm (dictionary-based dimensions)
        CloudwatchMetricAlarm(
            self,
            "replication_lag_alarm",
            alarm_name=f"aurora-replication-lag-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="AuroraGlobalDBReplicationLag",
            namespace="AWS/RDS",
            period=60,
            statistic="Average",
            threshold=1000,
            alarm_description="Alert when Aurora replication lag exceeds 1000ms",
            dimensions={
                "DBClusterIdentifier": aurora_cluster.cluster_identifier
            },
            tags={"Name": f"replication-lag-alarm-{environment_suffix}"}
        )

        # EC2 health alarm (dictionary-based dimensions)
        CloudwatchMetricAlarm(
            self,
            "ec2_health_alarm",
            alarm_name=f"target-health-{environment_suffix}",
            comparison_operator="LessThanThreshold",
            evaluation_periods=2,
            metric_name="HealthyHostCount",
            namespace="AWS/ApplicationELB",
            period=60,
            statistic="Average",
            threshold=2,
            alarm_description="Alert when healthy host count drops below 2",
            dimensions={
                "TargetGroup": Fn.element(Fn.split(":", target_group.arn_suffix), 0),
                "LoadBalancer": Fn.element(Fn.split(":", alb.arn_suffix), 0)
            },
            tags={"Name": f"ec2-health-alarm-{environment_suffix}"}
        )

        # 7. Step Functions State Machine (Requirement 7)
        sfn_role = IamRole(
            self,
            "sfn_role",
            name=f"sfn-migration-role-{environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "states.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={"Name": f"sfn-role-{environment_suffix}"}
        )

        # Attach Route53 policy for weight changes
        IamRolePolicyAttachment(
            self,
            "sfn_route53_policy",
            role=sfn_role.name,
            policy_arn="arn:aws:iam::aws:policy/AmazonRoute53FullAccess"
        )

        IamRolePolicyAttachment(
            self,
            "sfn_cloudwatch_policy",
            role=sfn_role.name,
            policy_arn="arn:aws:iam::aws:policy/CloudWatchReadOnlyAccess"
        )

        # State machine definition
        state_machine_def = json.dumps({
            "Comment": "Zero-downtime migration workflow",
            "StartAt": "VerifyDatabaseHealth",
            "States": {
                "VerifyDatabaseHealth": {
                    "Type": "Pass",
                    "Comment": "Verify secondary Aurora cluster is healthy",
                    "Next": "ShiftTraffic25Percent"
                },
                "ShiftTraffic25Percent": {
                    "Type": "Pass",
                    "Comment": "Update Route53 weights: us-east-1=75, eu-west-1=25",
                    "Next": "Wait5Minutes1"
                },
                "Wait5Minutes1": {
                    "Type": "Wait",
                    "Seconds": 300,
                    "Next": "CheckAlarms1"
                },
                "CheckAlarms1": {
                    "Type": "Choice",
                    "Choices": [{
                        "Variable": "$.alarmState",
                        "StringEquals": "OK",
                        "Next": "ShiftTraffic50Percent"
                    }],
                    "Default": "Rollback"
                },
                "ShiftTraffic50Percent": {
                    "Type": "Pass",
                    "Comment": "Update Route53 weights: us-east-1=50, eu-west-1=50",
                    "Next": "Wait5Minutes2"
                },
                "Wait5Minutes2": {
                    "Type": "Wait",
                    "Seconds": 300,
                    "Next": "CheckAlarms2"
                },
                "CheckAlarms2": {
                    "Type": "Choice",
                    "Choices": [{
                        "Variable": "$.alarmState",
                        "StringEquals": "OK",
                        "Next": "ShiftTraffic75Percent"
                    }],
                    "Default": "Rollback"
                },
                "ShiftTraffic75Percent": {
                    "Type": "Pass",
                    "Comment": "Update Route53 weights: us-east-1=25, eu-west-1=75",
                    "Next": "Wait5Minutes3"
                },
                "Wait5Minutes3": {
                    "Type": "Wait",
                    "Seconds": 300,
                    "Next": "CheckAlarms3"
                },
                "CheckAlarms3": {
                    "Type": "Choice",
                    "Choices": [{
                        "Variable": "$.alarmState",
                        "StringEquals": "OK",
                        "Next": "ShiftTraffic100Percent"
                    }],
                    "Default": "Rollback"
                },
                "ShiftTraffic100Percent": {
                    "Type": "Pass",
                    "Comment": "Update Route53 weights: us-east-1=0, eu-west-1=100",
                    "Next": "MigrationComplete"
                },
                "MigrationComplete": {
                    "Type": "Succeed"
                },
                "Rollback": {
                    "Type": "Pass",
                    "Comment": "Rollback to previous weight configuration",
                    "Next": "RollbackComplete"
                },
                "RollbackComplete": {
                    "Type": "Fail",
                    "Error": "MigrationFailed",
                    "Cause": "CloudWatch alarms triggered during migration"
                }
            }
        })

        state_machine = SfnStateMachine(
            self,
            "state_machine",
            name=f"migration-workflow-{environment_suffix}",
            role_arn=sfn_role.arn,
            definition=state_machine_def,
            tags={"Name": f"migration-sfn-{environment_suffix}"}
        )

        # 9. VPC Peering (Requirement 9)
        # Simulate us-east-1 VPC (in reality, this would be an existing VPC)
        vpc_primary = Vpc(
            self,
            "vpc_primary",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"vpc-primary-{environment_suffix}"},
            provider=aws_provider_primary
        )

        # VPC Peering Connection
        peering = VpcPeeringConnection(
            self,
            "vpc_peering",
            peer_vpc_id=vpc.id,
            vpc_id=vpc_primary.id,
            peer_region=secondary_region,
            auto_accept=False,
            tags={"Name": f"vpc-peering-{environment_suffix}"},
            provider=aws_provider_primary
        )

        # Accept peering connection in eu-west-1
        VpcPeeringConnectionAccepterA(
            self,
            "peering_accepter",
            vpc_peering_connection_id=peering.id,
            auto_accept=True,
            tags={"Name": f"vpc-peering-accepter-{environment_suffix}"}
        )

        # 8. Migration Runbook Output (Requirement 8)
        runbook = f"""
# Cross-Region Migration Runbook

## Environment: {environment_suffix}
## Primary Region: {primary_region}
## Secondary Region: {secondary_region}

## Pre-Migration Checklist
1. Verify Aurora secondary cluster is healthy and replication lag < 100ms
2. Verify all EC2 instances in ASG are healthy (minimum 2 running)
3. Verify ALB target health checks are passing
4. Take database backup snapshot
5. Notify stakeholders of migration window

## Migration Steps

### Phase 1: 25% Traffic Shift
```bash
aws route53 change-resource-record-sets --hosted-zone-id {hosted_zone.zone_id} --change-batch '{{
  "Changes": [
    {{
      "Action": "UPSERT",
      "ResourceRecordSet": {{
        "Name": "api.payment-{environment_suffix}.example.com",
        "Type": "A",
        "SetIdentifier": "us-east-1-{environment_suffix}",
        "Weight": 75,
        "AliasTarget": {{
          "HostedZoneId": "Z35SXDOTRQ7X7K",
          "DNSName": "primary-alb.example.com",
          "EvaluateTargetHealth": true
        }}
      }}
    }},
    {{
      "Action": "UPSERT",
      "ResourceRecordSet": {{
        "Name": "api.payment-{environment_suffix}.example.com",
        "Type": "A",
        "SetIdentifier": "eu-west-1-{environment_suffix}",
        "Weight": 25,
        "AliasTarget": {{
          "HostedZoneId": "{alb.zone_id}",
          "DNSName": "{alb.dns_name}",
          "EvaluateTargetHealth": true
        }}
      }}
    }}
  ]
}}'
```

Wait 5 minutes and monitor CloudWatch alarms.

### Phase 2: 50% Traffic Shift
```bash
# Update weights to 50/50
aws route53 change-resource-record-sets --hosted-zone-id {hosted_zone.zone_id} --change-batch '{{
  "Changes": [
    {{"Action": "UPSERT", "ResourceRecordSet": {{"Name": "api.payment-{environment_suffix}.example.com", "Type": "A", "SetIdentifier": "us-east-1-{environment_suffix}", "Weight": 50, "AliasTarget": {{"HostedZoneId": "Z35SXDOTRQ7X7K", "DNSName": "primary-alb.example.com", "EvaluateTargetHealth": true}}}}}},
    {{"Action": "UPSERT", "ResourceRecordSet": {{"Name": "api.payment-{environment_suffix}.example.com", "Type": "A", "SetIdentifier": "eu-west-1-{environment_suffix}", "Weight": 50, "AliasTarget": {{"HostedZoneId": "{alb.zone_id}", "DNSName": "{alb.dns_name}", "EvaluateTargetHealth": true}}}}}}
  ]
}}'
```

Wait 5 minutes and monitor CloudWatch alarms.

### Phase 3: 75% Traffic Shift
```bash
# Update weights to 25/75
aws route53 change-resource-record-sets --hosted-zone-id {hosted_zone.zone_id} --change-batch '{{
  "Changes": [
    {{"Action": "UPSERT", "ResourceRecordSet": {{"Name": "api.payment-{environment_suffix}.example.com", "Type": "A", "SetIdentifier": "us-east-1-{environment_suffix}", "Weight": 25, "AliasTarget": {{"HostedZoneId": "Z35SXDOTRQ7X7K", "DNSName": "primary-alb.example.com", "EvaluateTargetHealth": true}}}}}},
    {{"Action": "UPSERT", "ResourceRecordSet": {{"Name": "api.payment-{environment_suffix}.example.com", "Type": "A", "SetIdentifier": "eu-west-1-{environment_suffix}", "Weight": 75, "AliasTarget": {{"HostedZoneId": "{alb.zone_id}", "DNSName": "{alb.dns_name}", "EvaluateTargetHealth": true}}}}}}
  ]
}}'
```

Wait 5 minutes and monitor CloudWatch alarms.

### Phase 4: 100% Traffic Shift (Complete Migration)
```bash
# Update weights to 0/100
aws route53 change-resource-record-sets --hosted-zone-id {hosted_zone.zone_id} --change-batch '{{
  "Changes": [
    {{"Action": "UPSERT", "ResourceRecordSet": {{"Name": "api.payment-{environment_suffix}.example.com", "Type": "A", "SetIdentifier": "us-east-1-{environment_suffix}", "Weight": 0, "AliasTarget": {{"HostedZoneId": "Z35SXDOTRQ7X7K", "DNSName": "primary-alb.example.com", "EvaluateTargetHealth": true}}}}}},
    {{"Action": "UPSERT", "ResourceRecordSet": {{"Name": "api.payment-{environment_suffix}.example.com", "Type": "A", "SetIdentifier": "eu-west-1-{environment_suffix}", "Weight": 100, "AliasTarget": {{"HostedZoneId": "{alb.zone_id}", "DNSName": "{alb.dns_name}", "EvaluateTargetHealth": true}}}}}}
  ]
}}'
```

## Monitoring Commands

### Check Replication Lag
```bash
aws cloudwatch get-metric-statistics \\
  --namespace AWS/RDS \\
  --metric-name AuroraGlobalDBReplicationLag \\
  --dimensions Name=DBClusterIdentifier,Value={aurora_cluster.cluster_identifier} \\
  --start-time $(date -u -d '5 minutes ago' +%Y-%m-%dT%H:%M:%S) \\
  --end-time $(date -u +%Y-%m-%dT%H:%M:%S) \\
  --period 60 \\
  --statistics Average \\
  --region {secondary_region}
```

### Check Target Health
```bash
aws elbv2 describe-target-health \\
  --target-group-arn {target_group.arn} \\
  --region {secondary_region}
```

### Check CloudWatch Alarms
```bash
aws cloudwatch describe-alarms \\
  --alarm-names "aurora-replication-lag-{environment_suffix}" "target-health-{environment_suffix}" \\
  --region {secondary_region}
```

## Rollback Procedures

### Immediate Rollback (Shift back to 100% us-east-1)
```bash
aws route53 change-resource-record-sets --hosted-zone-id {hosted_zone.zone_id} --change-batch '{{
  "Changes": [
    {{"Action": "UPSERT", "ResourceRecordSet": {{"Name": "api.payment-{environment_suffix}.example.com", "Type": "A", "SetIdentifier": "us-east-1-{environment_suffix}", "Weight": 100, "AliasTarget": {{"HostedZoneId": "Z35SXDOTRQ7X7K", "DNSName": "primary-alb.example.com", "EvaluateTargetHealth": true}}}}}},
    {{"Action": "UPSERT", "ResourceRecordSet": {{"Name": "api.payment-{environment_suffix}.example.com", "Type": "A", "SetIdentifier": "eu-west-1-{environment_suffix}", "Weight": 0, "AliasTarget": {{"HostedZoneId": "{alb.zone_id}", "DNSName": "{alb.dns_name}", "EvaluateTargetHealth": true}}}}}}
  ]
}}'
```

### Database Failover (if needed)
```bash
aws rds failover-global-cluster \\
  --global-cluster-identifier {global_cluster.id} \\
  --target-db-cluster-identifier payment-cluster-primary-{environment_suffix} \\
  --region {primary_region}
```

## Post-Migration Tasks
1. Monitor application metrics for 24 hours
2. Update DNS TTLs to normal values
3. Document any issues encountered
4. Schedule decommissioning of us-east-1 resources (after validation period)
5. Update disaster recovery documentation
"""

        # Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="VPC ID in eu-west-1"
        )

        TerraformOutput(
            self,
            "vpc_cidr",
            value=vpc.cidr_block,
            description="VPC CIDR block"
        )

        TerraformOutput(
            self,
            "public_subnet_ids",
            value=Fn.jsonencode([s.id for s in public_subnets]),
            description="Public subnet IDs"
        )

        TerraformOutput(
            self,
            "private_subnet_ids",
            value=Fn.jsonencode([s.id for s in private_subnets]),
            description="Private subnet IDs"
        )

        TerraformOutput(
            self,
            "aurora_cluster_endpoint",
            value=aurora_cluster.endpoint,
            description="Aurora cluster writer endpoint"
        )

        TerraformOutput(
            self,
            "aurora_cluster_reader_endpoint",
            value=aurora_cluster.reader_endpoint,
            description="Aurora cluster reader endpoint"
        )

        TerraformOutput(
            self,
            "alb_dns_name",
            value=alb.dns_name,
            description="Application Load Balancer DNS name"
        )

        TerraformOutput(
            self,
            "asg_name",
            value=asg.name,
            description="Auto Scaling Group name"
        )

        TerraformOutput(
            self,
            "route53_zone_id",
            value=hosted_zone.zone_id,
            description="Route 53 Hosted Zone ID"
        )

        TerraformOutput(
            self,
            "state_machine_arn",
            value=state_machine.arn,
            description="Step Functions State Machine ARN"
        )

        TerraformOutput(
            self,
            "vpc_peering_id",
            value=peering.id,
            description="VPC Peering Connection ID"
        )

        TerraformOutput(
            self,
            "kms_key_id",
            value=kms_key.id,
            description="KMS Key ID"
        )

        TerraformOutput(
            self,
            "kms_key_arn",
            value=kms_key.arn,
            description="KMS Key ARN"
        )

        TerraformOutput(
            self,
            "migration_runbook",
            value=runbook,
            description="Migration runbook with commands"
        )
