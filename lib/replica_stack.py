"""
Multi-region PostgreSQL read replica infrastructure for disaster recovery.
This stack creates the eu-west-1 replica infrastructure.
"""
from aws_cdk import (
    Stack,
    aws_rds as rds,
    aws_ec2 as ec2,
    aws_logs as logs,
    RemovalPolicy,
    Duration,
    CfnOutput,
)
from constructs import Construct


class ReplicaStackProps:
    """Properties for ReplicaStack"""
    def __init__(self, environment_suffix: str, source_db_arn: str):
        self.environment_suffix = environment_suffix
        self.source_db_arn = source_db_arn


class ReplicaStack(Stack):
    """Cross-region read replica stack for disaster recovery"""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: ReplicaStackProps,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        env_suffix = props.environment_suffix

        # Create VPC in eu-west-1 for replica
        self.replica_vpc = ec2.Vpc(
            self, f"ReplicaVpc-{env_suffix}",
            vpc_name=f"replica-vpc-{env_suffix}",
            ip_addresses=ec2.IpAddresses.cidr("10.1.0.0/16"),
            max_azs=3,
            nat_gateways=1,
            subnet_configuration=[
                ec2.SubnetConfiguration(
                    name=f"replica-private-{env_suffix}",
                    subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS,
                    cidr_mask=24
                ),
                ec2.SubnetConfiguration(
                    name=f"replica-public-{env_suffix}",
                    subnet_type=ec2.SubnetType.PUBLIC,
                    cidr_mask=24
                )
            ]
        )

        # Security group for replica database
        self.replica_db_sg = ec2.SecurityGroup(
            self, f"ReplicaDbSg-{env_suffix}",
            security_group_name=f"replica-db-sg-{env_suffix}",
            vpc=self.replica_vpc,
            description="Security group for replica PostgreSQL database",
            allow_all_outbound=True
        )

        # Allow PostgreSQL access within VPC
        self.replica_db_sg.add_ingress_rule(
            peer=ec2.Peer.ipv4(self.replica_vpc.vpc_cidr_block),
            connection=ec2.Port.tcp(5432),
            description="Allow PostgreSQL access from VPC"
        )

        # Create subnet group for replica database
        self.replica_subnet_group = rds.SubnetGroup(
            self, f"ReplicaSubnetGroup-{env_suffix}",
            subnet_group_name=f"replica-subnet-group-{env_suffix}",
            description="Subnet group for replica PostgreSQL database",
            vpc=self.replica_vpc,
            vpc_subnets=ec2.SubnetSelection(
                subnet_type=ec2.SubnetType.PRIVATE_WITH_EGRESS
            ),
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create cross-region read replica using CfnDBInstance
        # Note: CDK doesn't have high-level construct for cross-region replicas
        self.replica_db = rds.CfnDBInstance(
            self, f"ReplicaDatabase-{env_suffix}",
            db_instance_identifier=f"replica-db-{env_suffix}",
            db_instance_class="db.r6g.large",
            source_db_instance_identifier=props.source_db_arn,
            # Replica inherits engine and version from source
            vpc_security_groups=[self.replica_db_sg.security_group_id],
            db_subnet_group_name=self.replica_subnet_group.subnet_group_name,
            publicly_accessible=False,
            storage_encrypted=True,
            # Enable automated backups independently on replica
            backup_retention_period=7,
            copy_tags_to_snapshot=True,
            deletion_protection=False,
            enable_cloudwatch_logs_exports=["postgresql"],
            # Important: Set this to prevent deletion issues
            delete_automated_backups=True,
            auto_minor_version_upgrade=False,
            tags=[
                {
                    "key": "Name",
                    "value": f"replica-db-{env_suffix}"
                },
                {
                    "key": "Environment",
                    "value": env_suffix
                }
            ]
        )

        # Ensure subnet group is created before the database instance
        self.replica_db.node.add_dependency(self.replica_subnet_group)

        # Outputs
        CfnOutput(
            self, "ReplicaDatabaseEndpoint",
            value=self.replica_db.attr_endpoint_address,
            description="Replica database endpoint in eu-west-1",
            export_name=f"ReplicaDbEndpoint-{env_suffix}"
        )

        CfnOutput(
            self, "ReplicaDatabaseIdentifier",
            value=self.replica_db.ref,
            description="Replica database instance identifier",
            export_name=f"ReplicaDbIdentifier-{env_suffix}"
        )

        CfnOutput(
            self, "ReplicaVpcId",
            value=self.replica_vpc.vpc_id,
            description="VPC ID for replica infrastructure",
            export_name=f"ReplicaVpcId-{env_suffix}"
        )
