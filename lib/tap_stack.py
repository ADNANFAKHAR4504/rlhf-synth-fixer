"""TAP Stack module for CDKTF Python infrastructure."""

from cdktf import TerraformStack, S3Backend, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
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
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument, DataAwsIamPolicyDocumentStatement
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion


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
        
        # Get AWS account ID
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
        tap_bucket = S3Bucket(
            self,
            "tap_bucket",
            bucket=f"tap-bucket-{environment_suffix}-{construct_id.lower()}",
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
        rds_monitoring_assume_role = DataAwsIamPolicyDocument(
            self,
            "rds_monitoring_assume_role",
            statement=[
                DataAwsIamPolicyDocumentStatement(
                    effect="Allow",
                    principals=[{
                        "type": "Service",
                        "identifiers": ["monitoring.rds.amazonaws.com"]
                    }],
                    actions=["sts:AssumeRole"]
                )
            ]
        )
        
        rds_monitoring_role = IamRole(
            self,
            "rds_monitoring_role",
            name=f"rds-monitoring-role-{environment_suffix}",
            assume_role_policy=rds_monitoring_assume_role.json,
            tags={
                "Name": f"rds-monitoring-role-{environment_suffix}",
                "Environment": environment_suffix
            }
        )
        
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

        # Create Secrets Manager secret for database password
        db_secret = SecretsmanagerSecret(
            self,
            "aurora_master_secret",
            name=f"aurora-postgres-{environment_suffix}-master-password",
            description="Master password for Aurora PostgreSQL cluster",
            recovery_window_in_days=7,
            tags={
                "Name": f"aurora-postgres-{environment_suffix}-master-password"
            }
        )
        
        # Generate secure random password using Terraform's random provider via escape hatch
        # The password will be generated by Terraform and stored securely in Secrets Manager
        self.add_override("resource.random_password.aurora_master_password", {
            "length": 32,
            "special": True,
            "override_special": "!#$%&*()-_=+[]{}<>:?"
        })
        
        # Store the generated password in Secrets Manager
        db_secret_version = SecretsmanagerSecretVersion(
            self,
            "aurora_master_secret_version",
            secret_id=db_secret.id,
            secret_string="${random_password.aurora_master_password.result}"
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
            master_password="${random_password.aurora_master_password.result}",
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
            depends_on=[db_secret_version],
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

        # Export stack outputs to JSON file for integration tests
        from cdktf import TerraformOutput
        import os
        
        # VPC and Networking Outputs
        TerraformOutput(
            self,
            "vpc_id",
            value=vpc.id,
            description="VPC ID for Aurora cluster"
        )
        
        TerraformOutput(
            self,
            "vpc_cidr",
            value=vpc.cidr_block,
            description="VPC CIDR block"
        )
        
        TerraformOutput(
            self,
            "subnet_1_id",
            value=subnet_1.id,
            description="First subnet ID"
        )
        
        TerraformOutput(
            self,
            "subnet_2_id",
            value=subnet_2.id,
            description="Second subnet ID"
        )
        
        TerraformOutput(
            self,
            "db_subnet_group_name",
            value=db_subnet_group.name,
            description="Database subnet group name"
        )
        
        # Security Group Outputs
        TerraformOutput(
            self,
            "aurora_security_group_id",
            value=aurora_sg.id,
            description="Aurora security group ID"
        )
        
        # Aurora Cluster Outputs
        TerraformOutput(
            self,
            "aurora_cluster_id",
            value=aurora_cluster.id,
            description="Aurora cluster identifier"
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
            "aurora_cluster_port",
            value=aurora_cluster.port,
            description="Aurora cluster port"
        )
        
        TerraformOutput(
            self,
            "aurora_cluster_arn",
            value=aurora_cluster.arn,
            description="Aurora cluster ARN"
        )
        
        TerraformOutput(
            self,
            "aurora_database_name",
            value=aurora_cluster.database_name,
            description="Aurora database name"
        )
        
        TerraformOutput(
            self,
            "aurora_master_username",
            value=aurora_cluster.master_username,
            description="Aurora master username"
        )
        
        TerraformOutput(
            self,
            "aurora_engine_version",
            value=aurora_cluster.engine_version,
            description="Aurora PostgreSQL engine version"
        )
        
        # S3 Bucket Outputs
        TerraformOutput(
            self,
            "s3_bucket_name",
            value=tap_bucket.bucket,
            description="S3 bucket name"
        )
        
        TerraformOutput(
            self,
            "s3_bucket_arn",
            value=tap_bucket.arn,
            description="S3 bucket ARN"
        )
        
        TerraformOutput(
            self,
            "s3_bucket_region",
            value=tap_bucket.region,
            description="S3 bucket region"
        )
        
        # IAM Outputs
        TerraformOutput(
            self,
            "rds_monitoring_role_arn",
            value=rds_monitoring_role.arn,
            description="RDS Enhanced Monitoring IAM role ARN"
        )
        
        TerraformOutput(
            self,
            "rds_monitoring_role_name",
            value=rds_monitoring_role.name,
            description="RDS Enhanced Monitoring IAM role name"
        )
        
        # Parameter Group Outputs
        TerraformOutput(
            self,
            "cluster_parameter_group_name",
            value=cluster_parameter_group.name,
            description="Aurora cluster parameter group name"
        )
        
        TerraformOutput(
            self,
            "db_parameter_group_name",
            value=db_parameter_group.name,
            description="Aurora DB parameter group name"
        )
        
        # Secrets Manager Outputs
        TerraformOutput(
            self,
            "db_secret_arn",
            value=db_secret.arn,
            description="Database password secret ARN"
        )
        
        TerraformOutput(
            self,
            "db_secret_name",
            value=db_secret.name,
            description="Database password secret name"
        )
        
        # AWS Account and Region Outputs
        TerraformOutput(
            self,
            "aws_account_id",
            value=caller_identity.account_id,
            description="AWS Account ID"
        )
        
        TerraformOutput(
            self,
            "aws_region",
            value=aws_region,
            description="AWS Region"
        )
        
        TerraformOutput(
            self,
            "environment_suffix",
            value=environment_suffix,
            description="Environment suffix for resource naming"
        )
        
        # Availability Zones Output
        TerraformOutput(
            self,
            "availability_zones",
            value=azs.names,
            description="Available AWS availability zones"
        )

