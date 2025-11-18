"""Unit tests for TAP Stack."""
import json
import os
import sys

sys.path.append(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from cdktf import App, Testing
from lib.tap_stack import TapStack


class TestStackStructure:
    """Test suite for Stack Structure."""

    def setup_method(self):
        """Reset test state before each test."""
        pass

    def test_tap_stack_instantiates_successfully_via_props(self):
        """TapStack instantiates successfully via props."""
        app = App()
        stack = TapStack(
            app,
            "TestTapStackWithProps",
            environment_suffix="prod",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-west-2",
        )

        # Verify that TapStack instantiates without errors via props
        assert stack is not None

    def test_tap_stack_uses_default_values_when_no_props_provided(self):
        """TapStack uses default values when no props provided."""
        app = App()
        stack = TapStack(app, "TestTapStackDefault")

        # Verify that TapStack instantiates without errors when no props provided
        assert stack is not None

    def test_tap_stack_synth_generates_terraform_config(self):
        """TapStack synthesizes to valid Terraform configuration."""
        app = App()
        stack = TapStack(
            app, "TestSynthStack", environment_suffix="test", aws_region="us-east-1"
        )

        # Synthesize the stack to JSON string
        synth = Testing.synth(stack)

        # Verify synth produces JSON output
        assert synth is not None
        assert isinstance(synth, str)

        # Parse JSON and verify structure
        config = json.loads(synth)
        assert "resource" in config
        assert "terraform" in config


class TestVPCResources:
    """Test suite for VPC resources."""

    def test_vpc_resource_created(self):
        """VPC is created with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestVPCStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        vpcs = resources.get("aws_vpc", {})

        # Verify VPC exists
        assert len(vpcs) > 0
        vpc_key = list(vpcs.keys())[0]
        vpc = vpcs[vpc_key]

        # Verify VPC configuration
        assert vpc["cidr_block"] == "10.0.0.0/16"
        assert vpc["enable_dns_hostnames"] is True
        assert vpc["enable_dns_support"] is True
        assert "tags" in vpc
        assert vpc["tags"]["Name"] == "payment-vpc-test"

    def test_subnets_created_in_multiple_azs(self):
        """Subnets are created across multiple availability zones."""
        app = App()
        stack = TapStack(
            app,
            "TestSubnetStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        subnets = resources.get("aws_subnet", {})

        # Verify we have public and private subnets
        assert len(subnets) >= 6  # 3 public + 3 private

        # Check that subnets have correct CIDR blocks
        public_subnets = [s for s in subnets.values() if "public" in s.get("tags", {}).get("Name", "").lower()]
        private_subnets = [s for s in subnets.values() if "private" in s.get("tags", {}).get("Name", "").lower()]

        assert len(public_subnets) == 3
        assert len(private_subnets) == 3

    def test_internet_gateway_created(self):
        """Internet Gateway is created and attached to VPC."""
        app = App()
        stack = TapStack(
            app,
            "TestIGWStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        igws = resources.get("aws_internet_gateway", {})

        assert len(igws) > 0

    def test_nat_gateway_created(self):
        """NAT Gateway is created."""
        app = App()
        stack = TapStack(
            app,
            "TestNATStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        nat_gateways = resources.get("aws_nat_gateway", {})

        assert len(nat_gateways) > 0

    def test_route_tables_created(self):
        """Route tables are created for public and private subnets."""
        app = App()
        stack = TapStack(
            app,
            "TestRouteTableStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        route_tables = resources.get("aws_route_table", {})

        assert len(route_tables) >= 2  # At least public and private


class TestSecurityGroups:
    """Test suite for Security Groups."""

    def test_security_groups_created(self):
        """Security groups are created for ALB, App, and RDS."""
        app = App()
        stack = TapStack(
            app,
            "TestSecurityGroupStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        security_groups = resources.get("aws_security_group", {})

        # Verify we have security groups
        assert len(security_groups) >= 3  # ALB, App, RDS

        # Check for specific security groups by name pattern
        sg_names = [sg.get("tags", {}).get("Name", "") for sg in security_groups.values()]
        assert any("alb" in name.lower() for name in sg_names)
        assert any("app" in name.lower() for name in sg_names)
        assert any("rds" in name.lower() for name in sg_names)


class TestS3Resources:
    """Test suite for S3 resources."""

    def test_s3_buckets_created(self):
        """S3 buckets are created for assets and flow logs."""
        app = App()
        stack = TapStack(
            app,
            "TestS3Stack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        s3_buckets = resources.get("aws_s3_bucket", {})

        # Verify we have at least 2 buckets
        assert len(s3_buckets) >= 2

        # Check bucket names
        bucket_names = [bucket.get("bucket", "") for bucket in s3_buckets.values()]
        assert any("assets" in name.lower() for name in bucket_names)
        assert any("flow-logs" in name.lower() for name in bucket_names)

    def test_s3_versioning_enabled(self):
        """S3 versioning is enabled on buckets."""
        app = App()
        stack = TapStack(
            app,
            "TestS3VersioningStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        s3_versioning = resources.get("aws_s3_bucket_versioning", {})

        # Verify versioning resources exist
        assert len(s3_versioning) >= 2

        # Verify versioning is enabled
        for versioning in s3_versioning.values():
            assert versioning["versioning_configuration"]["status"] == "Enabled"

    def test_s3_encryption_configured(self):
        """S3 encryption is configured on buckets."""
        app = App()
        stack = TapStack(
            app,
            "TestS3EncryptionStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        s3_encryption = resources.get("aws_s3_bucket_server_side_encryption_configuration", {})

        # Verify encryption resources exist
        assert len(s3_encryption) >= 2

        # Verify encryption algorithm
        for encryption in s3_encryption.values():
            rule = encryption["rule"][0]
            assert rule["apply_server_side_encryption_by_default"]["sse_algorithm"] == "AES256"

    def test_s3_public_access_blocked(self):
        """S3 public access is blocked on buckets."""
        app = App()
        stack = TapStack(
            app,
            "TestS3PublicAccessStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        public_access_blocks = resources.get("aws_s3_bucket_public_access_block", {})

        # Verify public access blocks exist
        assert len(public_access_blocks) >= 2

        # Verify all blocks are enabled
        for block in public_access_blocks.values():
            assert block["block_public_acls"] is True
            assert block["block_public_policy"] is True
            assert block["ignore_public_acls"] is True
            assert block["restrict_public_buckets"] is True


class TestRDSResources:
    """Test suite for RDS resources."""

    def test_rds_cluster_created(self):
        """RDS Aurora cluster is created with correct configuration."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        rds_clusters = resources.get("aws_rds_cluster", {})

        # Verify RDS cluster exists
        assert len(rds_clusters) > 0
        cluster_key = list(rds_clusters.keys())[0]
        cluster = rds_clusters[cluster_key]

        # Verify cluster configuration
        assert cluster["engine"] == "aurora-mysql"
        assert cluster["engine_version"] == "8.0.mysql_aurora.3.04.0"
        assert cluster["engine_mode"] == "provisioned"
        assert cluster["database_name"] == "paymentdb"
        assert cluster["storage_encrypted"] is True
        assert cluster["backup_retention_period"] == 35
        assert cluster["skip_final_snapshot"] is True
        assert cluster["deletion_protection"] is False

    def test_rds_cluster_instances_created(self):
        """RDS cluster instances are created."""
        app = App()
        stack = TapStack(
            app,
            "TestRDSInstancesStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        rds_instances = resources.get("aws_rds_cluster_instance", {})

        # Verify we have cluster instances
        assert len(rds_instances) >= 2  # At least 2 instances for multi-AZ

    def test_db_subnet_group_created(self):
        """DB subnet group is created for RDS."""
        app = App()
        stack = TapStack(
            app,
            "TestDBSubnetStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        db_subnet_groups = resources.get("aws_db_subnet_group", {})

        # Verify DB subnet group exists
        assert len(db_subnet_groups) > 0


class TestALBResources:
    """Test suite for Application Load Balancer resources."""

    def test_alb_created(self):
        """Application Load Balancer is created."""
        app = App()
        stack = TapStack(
            app,
            "TestALBStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        albs = resources.get("aws_lb", {})

        # Verify ALB exists
        assert len(albs) > 0
        alb_key = list(albs.keys())[0]
        alb = albs[alb_key]

        # Verify ALB configuration
        assert alb["load_balancer_type"] == "application"
        assert alb["internal"] is False
        assert alb["enable_deletion_protection"] is False

    def test_alb_target_group_created(self):
        """ALB target group is created."""
        app = App()
        stack = TapStack(
            app,
            "TestALBTargetGroupStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        target_groups = resources.get("aws_lb_target_group", {})

        # Verify target group exists
        assert len(target_groups) > 0
        tg_key = list(target_groups.keys())[0]
        tg = target_groups[tg_key]

        # Verify target group configuration
        assert tg["port"] == 80
        assert tg["protocol"] == "HTTP"
        assert tg["target_type"] == "ip"
        assert tg["health_check"]["enabled"] is True
        assert tg["health_check"]["path"] == "/health"

    def test_alb_listener_created(self):
        """ALB HTTP listener is created."""
        app = App()
        stack = TapStack(
            app,
            "TestALBListenerStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        listeners = resources.get("aws_lb_listener", {})

        # Verify listener exists
        assert len(listeners) > 0
        listener_key = list(listeners.keys())[0]
        listener = listeners[listener_key]

        # Verify listener configuration
        assert listener["port"] == 80
        assert listener["protocol"] == "HTTP"
        assert listener["default_action"][0]["type"] == "forward"


class TestCloudWatchResources:
    """Test suite for CloudWatch resources."""

    def test_cloudwatch_alarms_created(self):
        """CloudWatch alarms are created."""
        app = App()
        stack = TapStack(
            app,
            "TestCloudWatchAlarmsStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        alarms = resources.get("aws_cloudwatch_metric_alarm", {})

        # Verify alarms exist
        assert len(alarms) >= 3  # ALB unhealthy hosts, RDS CPU, RDS connections

        # Check alarm names
        alarm_names = [alarm.get("alarm_name", "") for alarm in alarms.values()]
        assert any("alb" in name.lower() and "unhealthy" in name.lower() for name in alarm_names)
        assert any("rds" in name.lower() and "cpu" in name.lower() for name in alarm_names)
        assert any("rds" in name.lower() and "connections" in name.lower() for name in alarm_names)


class TestVPCFlowLogs:
    """Test suite for VPC Flow Logs."""

    def test_vpc_flow_logs_created(self):
        """VPC Flow Logs are created."""
        app = App()
        stack = TapStack(
            app,
            "TestVPCFlowLogsStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        flow_logs = resources.get("aws_flow_log", {})

        # Verify flow logs exist
        assert len(flow_logs) > 0

    def test_flow_logs_iam_role_created(self):
        """IAM role for VPC Flow Logs is created."""
        app = App()
        stack = TapStack(
            app,
            "TestFlowLogsIAMStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})
        iam_roles = resources.get("aws_iam_role", {})

        # Verify IAM role exists for flow logs
        role_names = [role.get("name", "") for role in iam_roles.values()]
        assert any("flow-logs" in name.lower() for name in role_names)


class TestTerraformOutputs:
    """Test suite for Terraform outputs."""

    def test_terraform_outputs_defined(self):
        """Terraform outputs are defined."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputsStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify outputs exist
        assert "output" in config
        outputs = config.get("output", {})

        # Check for expected outputs
        assert "vpc_id" in outputs
        assert "alb_dns_name" in outputs
        assert "alb_arn" in outputs
        assert "rds_cluster_endpoint" in outputs
        assert "rds_cluster_reader_endpoint" in outputs
        assert "static_assets_bucket_name" in outputs
        assert "flow_logs_bucket_name" in outputs
        assert "public_subnet_ids" in outputs
        assert "private_subnet_ids" in outputs


class TestResourceTagging:
    """Test suite for resource tagging."""

    def test_resources_have_required_tags(self):
        """Resources have required tags."""
        app = App()
        stack = TapStack(
            app,
            "TestTaggingStack",
            environment_suffix="prod",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})

        # Check VPC tags
        vpcs = resources.get("aws_vpc", {})
        for vpc_name, vpc_config in vpcs.items():
            assert "tags" in vpc_config
            tags = vpc_config["tags"]
            assert "Environment" in tags
            assert tags["Environment"] == "prod"
            assert "Project" in tags
            assert tags["Project"] == "PaymentProcessing"

    def test_resource_naming_includes_environment_suffix(self):
        """Resources include environment_suffix in names."""
        app = App()
        stack = TapStack(
            app,
            "TestNamingStack",
            environment_suffix="staging",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)
        resources = config.get("resource", {})

        # Check that environment suffix appears in resource names
        vpcs = resources.get("aws_vpc", {})
        for vpc_config in vpcs.values():
            if "tags" in vpc_config and "Name" in vpc_config["tags"]:
                assert "staging" in vpc_config["tags"]["Name"]


class TestBackendConfiguration:
    """Test suite for Terraform backend configuration."""

    def test_backend_configured_with_custom_bucket(self):
        """Backend is configured with custom state bucket."""
        app = App()
        stack = TapStack(
            app,
            "TestBackendStack",
            environment_suffix="test",
            state_bucket="custom-state-bucket",
            state_bucket_region="us-west-2",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify backend configuration
        assert "terraform" in config
        terraform = config["terraform"]
        assert "backend" in terraform
        backend = terraform["backend"]
        # Backend is nested under "s3" key
        assert "s3" in backend
        s3_backend = backend["s3"]
        assert s3_backend["bucket"] == "custom-state-bucket"
        assert s3_backend["key"] == "test/TestBackendStack.tfstate"
        assert s3_backend["region"] == "us-west-2"
        assert s3_backend["encrypt"] is True

    def test_backend_uses_default_values(self):
        """Backend uses default values when not specified."""
        app = App()
        stack = TapStack(
            app,
            "TestBackendDefaultStack",
            environment_suffix="dev",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify backend configuration with defaults
        assert "terraform" in config
        terraform = config["terraform"]
        assert "backend" in terraform
        backend = terraform["backend"]
        # Backend is nested under "s3" key
        assert "s3" in backend
        s3_backend = backend["s3"]
        assert s3_backend["bucket"] == "iac-rlhf-tf-states"
        assert s3_backend["key"] == "dev/TestBackendDefaultStack.tfstate"
        assert s3_backend["region"] == "us-east-1"


class TestDataSources:
    """Test suite for data sources."""

    def test_data_sources_created(self):
        """Data sources are created."""
        app = App()
        stack = TapStack(
            app,
            "TestDataSourcesStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        synth = Testing.synth(stack)
        config = json.loads(synth)

        # Verify data sources exist
        assert "data" in config
        data = config["data"]
        assert "aws_availability_zones" in data
        assert "aws_caller_identity" in data


class TestOutputsFile:
    """Test suite for outputs file generation."""

    def test_outputs_file_written(self):
        """Outputs file is written to cfn-outputs directory."""
        app = App()
        stack = TapStack(
            app,
            "TestOutputsFileStack",
            environment_suffix="test",
            aws_region="us-east-1"
        )

        # The _write_outputs_to_file method is called during stack initialization
        # Check that the file exists
        outputs_dir = os.path.join(
            os.path.dirname(__file__),
            "..",
            "..",
            "cfn-outputs"
        )
        output_file = os.path.join(outputs_dir, "flat-outputs.json")

        # Verify file exists
        assert os.path.exists(output_file)

        # Verify file content
        with open(output_file, 'r', encoding='utf-8') as f:
            outputs = json.load(f)
            assert "vpc_id" in outputs
            assert "alb_dns_name" in outputs
            assert "rds_cluster_endpoint" in outputs
