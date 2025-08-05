"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

Implements a production-grade Multi-AZ RDS setup following AWS best practices.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
import pulumi_aws as aws


class TapStackArgs:
    """
    Input arguments for TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Environment identifier (e.g., 'dev', 'prod').
        tags (Optional[dict]): Default tags to apply to resources.
    """
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component resource for TAP project.

    Creates a Multi-AZ RDS setup with required networking, IAM, and security configurations.
    """
    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        env = args.environment_suffix
        tags = args.tags

        # Pulumi config
        config = pulumi.Config()
        db_username = config.require("dbUsername")
        db_password = config.require_secret("dbPassword")

        # Get AZs
        azs = aws.get_availability_zones(state="available")

        # VPC
        vpc = aws.ec2.Vpc(f"tap-vpc-{env}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**tags, "Name": f"tap-vpc-{env}", "Environment": env},
            opts=ResourceOptions(parent=self))
        pulumi.export("vpc_id", vpc.id)

        # Internet Gateway
        igw = aws.ec2.InternetGateway(f"tap-igw-{env}",
            vpc_id=vpc.id,
            tags={**tags, "Name": f"tap-igw-{env}"},
            opts=ResourceOptions(parent=self))
        pulumi.export("internet_gateway_id", igw.id)

        # Private Subnets (Multi-AZ)
        private_subnets = []
        for i, az in enumerate(azs.names[:3]):
            subnet = aws.ec2.Subnet(f"tap-private-subnet-{i}-{env}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={**tags, "Name": f"tap-private-subnet-{az}-{env}", "Environment": env, "Type": "Private"},
                opts=ResourceOptions(parent=self))
            private_subnets.append(subnet)
            pulumi.export(f"private_subnet_{i}_id", subnet.id)

        # DB Subnet Group
        db_subnet_group = aws.rds.SubnetGroup(f"tap-db-subnet-group-{env}",
            name=f"tap-db-subnet-group-{env}",
            subnet_ids=[s.id for s in private_subnets],
            tags={**tags, "Name": f"tap-db-subnet-group-{env}", "Environment": env},
            opts=ResourceOptions(parent=self))
        pulumi.export("db_subnet_group_name", db_subnet_group.name)

        # Security Group
        rds_sg = aws.ec2.SecurityGroup(f"tap-rds-sg-{env}",
            description="Security group for RDS PostgreSQL instance",
            vpc_id=vpc.id,
            ingress=[aws.ec2.SecurityGroupIngressArgs(
                description="PostgreSQL access from VPC",
                from_port=5432,
                to_port=5432,
                protocol="tcp",
                cidr_blocks=[vpc.cidr_block]
            )],
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol="-1",
                cidr_blocks=["0.0.0.0/0"]
            )],
            tags={**tags, "Name": f"tap-rds-sg-{env}", "Environment": env},
            opts=ResourceOptions(parent=self))
        pulumi.export("rds_security_group_id", rds_sg.id)

        # IAM Role for Enhanced Monitoring
        rds_monitoring_role = aws.iam.Role(f"tap-rds-monitoring-role-{env}",
            assume_role_policy="""{
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "monitoring.rds.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }""",
            tags={**tags, "Name": f"tap-rds-monitoring-role-{env}"},
            opts=ResourceOptions(parent=self))
        aws.iam.RolePolicyAttachment(f"tap-rds-monitoring-policy-{env}",
            role=rds_monitoring_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole",
            opts=ResourceOptions(parent=self))
        pulumi.export("rds_monitoring_role_arn", rds_monitoring_role.arn)

        # Parameter Group
        db_param_group = aws.rds.ParameterGroup(f"tap-postgres-params-{env}",
            family="postgres15",
            parameters=[
                aws.rds.ParameterGroupParameterArgs(name="shared_preload_libraries", value="pg_stat_statements"),
                aws.rds.ParameterGroupParameterArgs(name="log_statement", value="all")
            ],
            tags={**tags, "Name": f"tap-postgres-params-{env}", "Environment": env},
            opts=ResourceOptions(parent=self))
        pulumi.export("db_parameter_group_name", db_param_group.name)

        # RDS Multi-AZ Instance
        rds_instance = aws.rds.Instance(f"tap-postgres-ha-{env}",
            identifier=f"tap-postgres-ha-{env}",
            engine="postgres",
            engine_version="15.4",
            instance_class="db.t3.medium",
            allocated_storage=100,
            max_allocated_storage=1000,
            storage_type="gp3",
            storage_encrypted=True,
            multi_az=True,
            db_name="tapdb",
            username=db_username,
            password=db_password,
            port=5432,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[rds_sg.id],
            publicly_accessible=False,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            monitoring_interval=60,
            monitoring_role_arn=rds_monitoring_role.arn,
            enabled_cloudwatch_logs_exports=["postgresql"],
            parameter_group_name=db_param_group.name,
            deletion_protection=True,
            skip_final_snapshot=False,
            final_snapshot_identifier=f"tap-postgres-ha-{env}-final-snapshot",
            tags={**tags, "Name": f"tap-postgres-ha-{env}", "Environment": env},
            opts=ResourceOptions(parent=self))
        pulumi.export("rds_endpoint", rds_instance.endpoint)
        pulumi.export("rds_port", rds_instance.port)
        pulumi.export("rds_availability_zone", rds_instance.availability_zone)
        pulumi.export("rds_multi_az", rds_instance.multi_az)

        # Register component outputs
        self.register_outputs({})
