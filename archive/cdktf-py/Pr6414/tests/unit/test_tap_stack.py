"""Unit tests for TAP Stack."""
import json
import pytest
from cdktf import Testing
from lib.tap_stack import TapStack


class TestTapStack:
    """Test suite for TapStack infrastructure."""

    @pytest.fixture
    def stack(self):
        """Create a stack instance for testing."""
        app = Testing.app()
        return TapStack(
            app,
            "test-tap-stack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-bucket",
            state_bucket_region="us-east-1",
            default_tags={"tags": {"Environment": "test"}}
        )

    @pytest.fixture
    def synthesized(self, stack):
        """Return synthesized Terraform configuration."""
        return json.loads(Testing.synth(stack))

    def test_stack_creation_with_defaults(self):
        """Test stack can be created with default values."""
        app = Testing.app()
        stack = TapStack(app, "default-test")
        assert stack is not None
        synth = Testing.synth(stack)
        assert synth is not None

    def test_stack_creation_with_custom_props(self):
        """Test stack can be created with custom properties."""
        app = Testing.app()
        stack = TapStack(
            app,
            "custom-test",
            environment_suffix="prod",
            aws_region="us-west-2",
            state_bucket="custom-bucket",
            state_bucket_region="us-west-2"
        )
        assert stack is not None
        config = json.loads(Testing.synth(stack))
        
        provider = config["provider"]["aws"][0] if isinstance(config["provider"]["aws"], list) else config["provider"]["aws"]
        assert provider["region"] == "us-west-2"
        
        backend = config["terraform"]["backend"]["s3"]
        assert backend["bucket"] == "custom-bucket"

    def test_aws_provider_configured(self, synthesized):
        """Test AWS provider is configured correctly."""
        assert "provider" in synthesized
        assert "aws" in synthesized["provider"]
        
        provider = synthesized["provider"]["aws"][0] if isinstance(synthesized["provider"]["aws"], list) else synthesized["provider"]["aws"]
        assert provider["region"] == "us-east-1"

    def test_s3_backend_configured(self, synthesized):
        """Test S3 backend is configured."""
        assert "terraform" in synthesized
        assert "backend" in synthesized["terraform"]
        assert "s3" in synthesized["terraform"]["backend"]
        
        backend = synthesized["terraform"]["backend"]["s3"]
        assert backend["bucket"] == "test-bucket"
        assert backend["region"] == "us-east-1"
        assert backend["encrypt"] is True

    def test_vpc_created(self, synthesized):
        """Test VPC is created with correct configuration."""
        resources = synthesized["resource"]
        assert "aws_vpc" in resources
        
        vpc = resources["aws_vpc"]["aurora_vpc"]
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True

    def test_subnets_created(self, synthesized):
        """Test subnets are created."""
        resources = synthesized["resource"]
        assert "aws_subnet" in resources
        
        assert "aurora_subnet_1" in resources["aws_subnet"]
        assert "aurora_subnet_2" in resources["aws_subnet"]
        
        subnet1 = resources["aws_subnet"]["aurora_subnet_1"]
        subnet2 = resources["aws_subnet"]["aurora_subnet_2"]
        
        assert subnet1["cidr_block"] == "10.0.1.0/24"
        assert subnet2["cidr_block"] == "10.0.2.0/24"
        assert subnet1["map_public_ip_on_launch"] is False
        assert subnet2["map_public_ip_on_launch"] is False

    def test_db_subnet_group_created(self, synthesized):
        """Test DB subnet group is created."""
        resources = synthesized["resource"]
        assert "aws_db_subnet_group" in resources
        
        subnet_group = resources["aws_db_subnet_group"]["aurora_subnet_group"]
        assert "subnet_ids" in subnet_group
        assert len(subnet_group["subnet_ids"]) == 2

    def test_security_group_created(self, synthesized):
        """Test security group is created."""
        resources = synthesized["resource"]
        assert "aws_security_group" in resources
        
        sg = resources["aws_security_group"]["aurora_security_group"]
        assert sg["name"] == "aurora-sg-test"
        assert "Aurora PostgreSQL" in sg["description"]

    def test_security_group_rules_created(self, synthesized):
        """Test security group rules are created."""
        resources = synthesized["resource"]
        assert "aws_security_group_rule" in resources
        
        rules = resources["aws_security_group_rule"]
        assert "aurora_sg_ingress" in rules
        assert "aurora_sg_egress" in rules
        
        ingress = rules["aurora_sg_ingress"]
        assert ingress["type"] == "ingress"
        assert ingress["from_port"] == 5432
        assert ingress["to_port"] == 5432
        assert ingress["protocol"] == "tcp"
        
        egress = rules["aurora_sg_egress"]
        assert egress["type"] == "egress"
        assert egress["protocol"] == "-1"

    def test_iam_role_created(self, synthesized):
        """Test IAM role for RDS monitoring is created."""
        resources = synthesized["resource"]
        assert "aws_iam_role" in resources
        
        role = resources["aws_iam_role"]["rds_monitoring_role"]
        assert role["name"] == "rds-monitoring-role-test"

    def test_iam_policy_attachment_created(self, synthesized):
        """Test IAM policy attachment is created."""
        resources = synthesized["resource"]
        assert "aws_iam_role_policy_attachment" in resources
        
        attachment = resources["aws_iam_role_policy_attachment"]["rds_monitoring_policy_attachment"]
        assert "AmazonRDSEnhancedMonitoringRole" in attachment["policy_arn"]

    def test_iam_policy_document_created(self, synthesized):
        """Test IAM policy document data source is created."""
        data_sources = synthesized.get("data", {})
        assert "aws_iam_policy_document" in data_sources
        
        policy_doc = data_sources["aws_iam_policy_document"]["rds_monitoring_assume_role"]
        assert "statement" in policy_doc

    def test_s3_bucket_created(self, synthesized):
        """Test S3 bucket is created."""
        resources = synthesized["resource"]
        assert "aws_s3_bucket" in resources
        
        bucket = resources["aws_s3_bucket"]["tap_bucket"]
        assert "tap-bucket-test" in bucket["bucket"]

    def test_s3_bucket_versioning(self, synthesized):
        """Test S3 bucket versioning is enabled."""
        resources = synthesized["resource"]
        assert "aws_s3_bucket_versioning" in resources
        
        versioning = resources["aws_s3_bucket_versioning"]["tap_bucket_versioning"]
        assert versioning["versioning_configuration"]["status"] == "Enabled"

    def test_cluster_parameter_group_created(self, synthesized):
        """Test RDS cluster parameter group is created."""
        resources = synthesized["resource"]
        assert "aws_rds_cluster_parameter_group" in resources
        
        pg = resources["aws_rds_cluster_parameter_group"]["aurora_cluster_parameter_group"]
        assert pg["family"] == "aurora-postgresql16"
        assert "parameter" in pg
        assert len(pg["parameter"]) == 4

    def test_db_parameter_group_created(self, synthesized):
        """Test DB parameter group is created."""
        resources = synthesized["resource"]
        assert "aws_db_parameter_group" in resources
        
        pg = resources["aws_db_parameter_group"]["aurora_db_parameter_group"]
        assert pg["family"] == "aurora-postgresql16"
        assert "parameter" in pg
        assert len(pg["parameter"]) == 8

    def test_aurora_cluster_created(self, synthesized):
        """Test Aurora PostgreSQL cluster is created."""
        resources = synthesized["resource"]
        assert "aws_rds_cluster" in resources
        
        cluster = resources["aws_rds_cluster"]["aurora_postgres_cluster"]
        assert cluster["engine"] == "aurora-postgresql"
        assert cluster["engine_version"] == "16.9"
        assert cluster["storage_encrypted"] is True
        assert cluster["backup_retention_period"] == 7

    def test_aurora_instance_created(self, synthesized):
        """Test Aurora cluster instance is created."""
        resources = synthesized["resource"]
        assert "aws_rds_cluster_instance" in resources
        
        instance = resources["aws_rds_cluster_instance"]["aurora_postgres_instance_1"]
        assert instance["engine"] == "aurora-postgresql"
        assert instance["engine_version"] == "16.9"
        assert instance["instance_class"] == "db.r6g.large"
        assert instance["publicly_accessible"] is False
        assert instance["performance_insights_enabled"] is True
        assert instance["monitoring_interval"] == 60

    def test_availability_zones_data_source(self, synthesized):
        """Test availability zones data source is created."""
        data_sources = synthesized.get("data", {})
        assert "aws_availability_zones" in data_sources
        
        azs = data_sources["aws_availability_zones"]["available_azs"]
        assert azs["state"] == "available"

    def test_caller_identity_data_source(self, synthesized):
        """Test caller identity data source is created."""
        data_sources = synthesized.get("data", {})
        assert "aws_caller_identity" in data_sources

    def test_environment_suffix_in_resources(self, synthesized):
        """Test environment suffix is applied to resource names."""
        resources = synthesized["resource"]
        
        vpc = resources["aws_vpc"]["aurora_vpc"]
        assert "test" in vpc["tags"]["Name"]
        
        bucket = resources["aws_s3_bucket"]["tap_bucket"]
        assert "test" in bucket["bucket"]

    def test_tagging_applied(self, synthesized):
        """Test resources are properly tagged."""
        resources = synthesized["resource"]
        
        vpc = resources["aws_vpc"]["aurora_vpc"]
        assert "tags" in vpc
        assert vpc["tags"]["Name"] == "aurora-vpc-test"
        
        cluster = resources["aws_rds_cluster"]["aurora_postgres_cluster"]
        assert "tags" in cluster
        assert cluster["tags"]["Name"] == "aurora-postgres-test"

    def test_cluster_parameters(self, synthesized):
        """Test cluster parameter group parameters."""
        resources = synthesized["resource"]
        pg = resources["aws_rds_cluster_parameter_group"]["aurora_cluster_parameter_group"]
        
        param_names = [p["name"] for p in pg["parameter"]]
        assert "shared_preload_libraries" in param_names
        assert "log_statement" in param_names
        assert "log_min_duration_statement" in param_names
        assert "rds.force_ssl" in param_names

    def test_db_parameters(self, synthesized):
        """Test DB parameter group parameters."""
        resources = synthesized["resource"]
        pg = resources["aws_db_parameter_group"]["aurora_db_parameter_group"]
        
        param_names = [p["name"] for p in pg["parameter"]]
        assert "track_activity_query_size" in param_names
        assert "pg_stat_statements.track" in param_names
        assert "track_io_timing" in param_names

    def test_database_name_sanitization(self, synthesized):
        """Test database name is properly sanitized."""
        resources = synthesized["resource"]
        cluster = resources["aws_rds_cluster"]["aurora_postgres_cluster"]
        
        db_name = cluster["database_name"]
        assert "-" not in db_name
        assert "_" not in db_name

    def test_cloudwatch_logs_enabled(self, synthesized):
        """Test CloudWatch logs are enabled for Aurora."""
        resources = synthesized["resource"]
        cluster = resources["aws_rds_cluster"]["aurora_postgres_cluster"]
        
        assert "enabled_cloudwatch_logs_exports" in cluster
        assert "postgresql" in cluster["enabled_cloudwatch_logs_exports"]

    def test_performance_insights_enabled(self, synthesized):
        """Test Performance Insights is enabled."""
        resources = synthesized["resource"]
        instance = resources["aws_rds_cluster_instance"]["aurora_postgres_instance_1"]
        
        assert instance["performance_insights_enabled"] is True
        assert instance["performance_insights_retention_period"] == 7

    def test_enhanced_monitoring_configured(self, synthesized):
        """Test enhanced monitoring is configured."""
        resources = synthesized["resource"]
        instance = resources["aws_rds_cluster_instance"]["aurora_postgres_instance_1"]
        
        assert instance["monitoring_interval"] == 60
        assert "monitoring_role_arn" in instance

    def test_backup_configuration(self, synthesized):
        """Test backup configuration."""
        resources = synthesized["resource"]
        cluster = resources["aws_rds_cluster"]["aurora_postgres_cluster"]
        
        assert cluster["backup_retention_period"] == 7
        assert cluster["preferred_backup_window"] == "03:00-04:00"

    def test_maintenance_window(self, synthesized):
        """Test maintenance window is configured."""
        resources = synthesized["resource"]
        cluster = resources["aws_rds_cluster"]["aurora_postgres_cluster"]
        
        assert cluster["preferred_maintenance_window"] == "mon:04:00-mon:05:00"

    def test_skip_final_snapshot(self, synthesized):
        """Test skip final snapshot is enabled."""
        resources = synthesized["resource"]
        cluster = resources["aws_rds_cluster"]["aurora_postgres_cluster"]
        
        assert cluster["skip_final_snapshot"] is True

    def test_apply_immediately(self, synthesized):
        """Test apply immediately is enabled."""
        resources = synthesized["resource"]
        cluster = resources["aws_rds_cluster"]["aurora_postgres_cluster"]
        
        assert cluster["apply_immediately"] is True

    def test_resource_count(self, synthesized):
        """Test expected number of resources are created."""
        resources = synthesized["resource"]
        
        resource_count = sum(len(resources[res_type]) for res_type in resources)
        assert resource_count >= 13
        assert resource_count <= 20

    def test_stack_synthesizes_without_errors(self, stack):
        """Test stack synthesizes without errors."""
        synth = Testing.synth(stack)
        assert synth is not None
        assert len(synth) > 0

    def test_valid_terraform_json(self, synthesized):
        """Test synthesized output is valid Terraform JSON."""
        assert isinstance(synthesized, dict)
        assert "resource" in synthesized
        assert "provider" in synthesized
        assert "terraform" in synthesized

    def test_vpc_cidr_block(self, synthesized):
        """Test VPC CIDR block is correct."""
        vpc = synthesized["resource"]["aws_vpc"]["aurora_vpc"]
        assert vpc["cidr_block"] == "10.0.0.0/16"

    def test_subnet_cidr_blocks(self, synthesized):
        """Test subnet CIDR blocks are correct."""
        subnets = synthesized["resource"]["aws_subnet"]
        
        subnet1 = subnets["aurora_subnet_1"]
        subnet2 = subnets["aurora_subnet_2"]
        
        assert subnet1["cidr_block"] == "10.0.1.0/24"
        assert subnet2["cidr_block"] == "10.0.2.0/24"

    def test_security_group_ingress_port(self, synthesized):
        """Test security group ingress port is PostgreSQL."""
        rules = synthesized["resource"]["aws_security_group_rule"]
        ingress = rules["aurora_sg_ingress"]
        
        assert ingress["from_port"] == 5432
        assert ingress["to_port"] == 5432

    def test_cluster_identifier_format(self, synthesized):
        """Test cluster identifier format."""
        cluster = synthesized["resource"]["aws_rds_cluster"]["aurora_postgres_cluster"]
        assert cluster["cluster_identifier"] == "aurora-postgres-test"

    def test_instance_identifier_format(self, synthesized):
        """Test instance identifier format."""
        instance = synthesized["resource"]["aws_rds_cluster_instance"]["aurora_postgres_instance_1"]
        assert instance["identifier"] == "aurora-postgres-test-instance-1"

    def test_storage_encryption_enabled(self, synthesized):
        """Test storage encryption is enabled."""
        cluster = synthesized["resource"]["aws_rds_cluster"]["aurora_postgres_cluster"]
        assert cluster["storage_encrypted"] is True

    def test_master_username(self, synthesized):
        """Test master username is set."""
        cluster = synthesized["resource"]["aws_rds_cluster"]["aurora_postgres_cluster"]
        assert cluster["master_username"] == "postgres"

    def test_parameter_group_family(self, synthesized):
        """Test parameter group family is correct."""
        resources = synthesized["resource"]
        
        cluster_pg = resources["aws_rds_cluster_parameter_group"]["aurora_cluster_parameter_group"]
        assert cluster_pg["family"] == "aurora-postgresql16"
        
        db_pg = resources["aws_db_parameter_group"]["aurora_db_parameter_group"]
        assert db_pg["family"] == "aurora-postgresql16"

    def test_subnet_group_name_format(self, synthesized):
        """Test subnet group name format."""
        subnet_group = synthesized["resource"]["aws_db_subnet_group"]["aurora_subnet_group"]
        assert subnet_group["name"] == "aurora-subnet-group-test"

    def test_security_group_vpc_association(self, synthesized):
        """Test security group is associated with VPC."""
        sg = synthesized["resource"]["aws_security_group"]["aurora_security_group"]
        assert "vpc_id" in sg

    def test_cluster_references_parameter_group(self, synthesized):
        """Test cluster references parameter group."""
        cluster = synthesized["resource"]["aws_rds_cluster"]["aurora_postgres_cluster"]
        assert "db_cluster_parameter_group_name" in cluster

    def test_instance_references_parameter_group(self, synthesized):
        """Test instance references parameter group."""
        instance = synthesized["resource"]["aws_rds_cluster_instance"]["aurora_postgres_instance_1"]
        assert "db_parameter_group_name" in instance

    def test_cluster_references_subnet_group(self, synthesized):
        """Test cluster references subnet group."""
        cluster = synthesized["resource"]["aws_rds_cluster"]["aurora_postgres_cluster"]
        assert "db_subnet_group_name" in cluster

    def test_cluster_references_security_group(self, synthesized):
        """Test cluster references security group."""
        cluster = synthesized["resource"]["aws_rds_cluster"]["aurora_postgres_cluster"]
        assert "vpc_security_group_ids" in cluster

    def test_instance_references_cluster(self, synthesized):
        """Test instance references cluster."""
        instance = synthesized["resource"]["aws_rds_cluster_instance"]["aurora_postgres_instance_1"]
        assert "cluster_identifier" in instance

    def test_s3_backend_key_format(self, synthesized):
        """Test S3 backend key format."""
        backend = synthesized["terraform"]["backend"]["s3"]
        assert "test/test-tap-stack.tfstate" == backend["key"]

    def test_default_tags_applied(self):
        """Test default tags are applied."""
        app = Testing.app()
        stack = TapStack(
            app,
            "tag-test",
            environment_suffix="prod",
            default_tags={"tags": {"Project": "TAP", "Owner": "Team"}}
        )
        config = json.loads(Testing.synth(stack))
        
        provider = config["provider"]["aws"][0] if isinstance(config["provider"]["aws"], list) else config["provider"]["aws"]
        assert "default_tags" in provider
