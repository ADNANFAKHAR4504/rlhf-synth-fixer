"""TAP Stack module for CDKTF Python infrastructure with Aurora PostgreSQL 16.9."""

from cdktf import TerraformStack, S3Backend, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfigurationA,
    S3BucketServerSideEncryptionConfigurationRuleA,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.rds_cluster_parameter_group import RdsClusterParameterGroup, RdsClusterParameterGroupParameter
from cdktf_cdktf_provider_aws.db_parameter_group import DbParameterGroup, DbParameterGroupParameter
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.rds_cluster_instance import RdsClusterInstance
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment


class TapStack(TerraformStack):
    """CDKTF Python stack for TAP infrastructure with Aurora PostgreSQL 16.9."""

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
        
        # Get AWS account ID (for future use)
        caller_identity = DataAwsCallerIdentity(self, "current")

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

        # Create S3 bucket for demonstration
        # Bucket name must be lowercase, no underscores, and globally unique
        bucket_name = f"tap-bucket-{environment_suffix.lower()}-{construct_id.lower()}".replace('_', '-')
        
        tap_bucket = S3Bucket(
            self,
            "tap_bucket",
            bucket=bucket_name,
            tags={
                "Name": f"tap-bucket-{environment_suffix}"
            }
        )
        
        # Enable versioning on S3 bucket
        S3BucketVersioningA(
            self,
            "tap_bucket_versioning",
            bucket=tap_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )
        
        # Enable server-side encryption on S3 bucket (separate resource)
        S3BucketServerSideEncryptionConfigurationA(
            self,
            "tap_bucket_encryption",
            bucket=tap_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRuleA(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
                        sse_algorithm="AES256"
                    )
                )
            ]
        )

        # Get availability zones
        azs = DataAwsAvailabilityZones(
            self,
            "available_azs",
            state="available"
        )

        # Create VPC for Aurora
        vpc = Vpc(
            self,
            "aurora_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"aurora-vpc-{environment_suffix}"
            }
        )

        # Create subnets in different availability zones
        subnet_1 = Subnet(
            self,
            "aurora_subnet_1",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=Fn.element(azs.names, 0),
            map_public_ip_on_launch=False,
            tags={
                "Name": f"aurora-subnet-1-{environment_suffix}"
            }
        )

        subnet_2 = Subnet(
            self,
            "aurora_subnet_2",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=Fn.element(azs.names, 1),
            map_public_ip_on_launch=False,
            tags={
                "Name": f"aurora-subnet-2-{environment_suffix}"
            }
        )

        # Create DB Subnet Group
        db_subnet_group = DbSubnetGroup(
            self,
            "aurora_subnet_group",
            name=f"aurora-subnet-group-{environment_suffix}",
            subnet_ids=[subnet_1.id, subnet_2.id],
            tags={
                "Name": f"aurora-subnet-group-{environment_suffix}"
            }
        )

        # Create Security Group for Aurora
        aurora_sg = SecurityGroup(
            self,
            "aurora_security_group",
            name=f"aurora-sg-{environment_suffix}",
            description="Security group for Aurora PostgreSQL cluster",
            vpc_id=vpc.id,
            tags={
                "Name": f"aurora-sg-{environment_suffix}"
            }
        )
        
        # Add ingress rule for PostgreSQL
        SecurityGroupRule(
            self,
            "aurora_sg_ingress",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"],
            security_group_id=aurora_sg.id,
            description="Allow PostgreSQL traffic from VPC"
        )
        
        # Add egress rule
        SecurityGroupRule(
            self,
            "aurora_sg_egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=aurora_sg.id,
            description="Allow all outbound traffic"
        )

        # Create IAM Role for RDS Enhanced Monitoring
        # Must be created with proper trust policy and permissions
        rds_monitoring_role = IamRole(
            self,
            "rds_monitoring_role",
            name=f"rds-monitoring-role-{environment_suffix}",
            assume_role_policy="""{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "monitoring.rds.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}""",
            tags={
                "Name": f"rds-monitoring-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )
        
        # Attach the AWS managed policy for RDS Enhanced Monitoring
        IamRolePolicyAttachment(
            self,
            "rds_monitoring_policy_attachment",
            role=rds_monitoring_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
        )
        
        # Create RDS Cluster Parameter Group for Aurora PostgreSQL 16.9
        cluster_parameter_group = RdsClusterParameterGroup(
            self,
            "aurora_cluster_parameter_group",
            name=f"aurora-postgres16-cluster-pg-{environment_suffix}",
            family="aurora-postgresql16",
            description="Custom cluster parameter group for Aurora PostgreSQL 16.9",
            parameter=[
                RdsClusterParameterGroupParameter(
                    name="shared_preload_libraries",
                    value="pg_stat_statements,auto_explain",
                    apply_method="pending-reboot"
                ),
                RdsClusterParameterGroupParameter(
                    name="log_statement",
                    value="all",
                    apply_method="immediate"
                ),
                RdsClusterParameterGroupParameter(
                    name="log_min_duration_statement",
                    value="1000",
                    apply_method="immediate"
                ),
                RdsClusterParameterGroupParameter(
                    name="rds.force_ssl",
                    value="1",
                    apply_method="immediate"
                )
            ],
            tags={
                "Name": f"aurora-postgres16-cluster-pg-{environment_suffix}"
            }
        )

        # Create DB Parameter Group for Aurora PostgreSQL 16.9 instances
        db_parameter_group = DbParameterGroup(
            self,
            "aurora_db_parameter_group",
            name=f"aurora-postgres16-db-pg-{environment_suffix}",
            family="aurora-postgresql16",
            description="Custom DB parameter group for Aurora PostgreSQL 16.9 instances",
            parameter=[
                DbParameterGroupParameter(
                    name="track_activity_query_size",
                    value="4096",
                    apply_method="pending-reboot"
                ),
                DbParameterGroupParameter(
                    name="pg_stat_statements.track",
                    value="all",
                    apply_method="immediate"
                ),
                DbParameterGroupParameter(
                    name="pg_stat_statements.max",
                    value="10000",
                    apply_method="pending-reboot"
                ),
                DbParameterGroupParameter(
                    name="track_io_timing",
                    value="1",
                    apply_method="immediate"
                ),
                DbParameterGroupParameter(
                    name="log_lock_waits",
                    value="1",
                    apply_method="immediate"
                ),
                DbParameterGroupParameter(
                    name="log_temp_files",
                    value="0",
                    apply_method="immediate"
                ),
                DbParameterGroupParameter(
                    name="auto_explain.log_min_duration",
                    value="1000",
                    apply_method="immediate"
                ),
                DbParameterGroupParameter(
                    name="auto_explain.log_analyze",
                    value="1",
                    apply_method="immediate"
                )
            ],
            tags={
                "Name": f"aurora-postgres16-db-pg-{environment_suffix}"
            }
        )

        # Create Aurora PostgreSQL 16.9 Cluster
        # Database name must start with a letter and contain only alphanumeric characters
        db_name = f"tapdb{environment_suffix.replace('-', '').replace('_', '')}"
        
        aurora_cluster = RdsCluster(
            self,
            "aurora_postgres_cluster",
            cluster_identifier=f"aurora-postgres-{environment_suffix}",
            engine="aurora-postgresql",
            engine_version="16.9",
            database_name=db_name,
            master_username="postgres",
            master_password="ChangeMe123!",  # In production, use Secrets Manager
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[aurora_sg.id],
            db_cluster_parameter_group_name=cluster_parameter_group.name,
            storage_encrypted=True,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            skip_final_snapshot=True,
            apply_immediately=True,
            tags={
                "Name": f"aurora-postgres-{environment_suffix}"
            }
        )

        # Create Aurora PostgreSQL 16.9 Cluster Instance (Writer)
        RdsClusterInstance(
            self,
            "aurora_postgres_instance_1",
            identifier=f"aurora-postgres-{environment_suffix}-instance-1",
            cluster_identifier=aurora_cluster.id,
            instance_class="db.r6g.large",
            engine="aurora-postgresql",
            engine_version="16.9",
            db_parameter_group_name=db_parameter_group.name,
            publicly_accessible=False,
            performance_insights_enabled=True,
            performance_insights_retention_period=7,
            monitoring_interval=60,
            monitoring_role_arn=rds_monitoring_role.arn,
            tags={
                "Name": f"aurora-postgres-{environment_suffix}-instance-1"
            }
        )

        # ? Add your stack instantiations here
        # ! Do NOT create resources directly in this stack.
        # ! Instead, create separate stacks for each resource type.
