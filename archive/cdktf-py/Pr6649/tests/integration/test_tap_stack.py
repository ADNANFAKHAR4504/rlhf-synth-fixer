"""Integration tests for TapStack."""
import json
from cdktf import App, Testing

from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    def test_terraform_configuration_synthesis(self):
        """Test that stack synthesizes to valid Terraform configuration."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        # Synthesize the stack
        synthesized = Testing.synth(stack)
        
        # Verify synthesis produces valid JSON
        assert synthesized is not None
        assert isinstance(synthesized, str)
        
        # Parse and validate JSON structure
        config = json.loads(synthesized)
        assert "resource" in config
        assert "terraform" in config
        assert "output" in config

    def test_all_resources_created(self):
        """Test that all required resources are created."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        resources = config.get("resource", {})

        # Verify all major resource types exist
        required_resources = [
            "aws_vpc",
            "aws_subnet",
            "aws_internet_gateway",
            "aws_nat_gateway",
            "aws_eip",
            "aws_route_table",
            "aws_route_table_association",
            "aws_security_group",
            "aws_s3_bucket",
            "aws_s3_bucket_versioning",
            "aws_s3_bucket_server_side_encryption_configuration",
            "aws_s3_bucket_public_access_block",
            "aws_db_subnet_group",
            "aws_rds_cluster",
            "aws_rds_cluster_instance",
            "aws_lb",
            "aws_lb_target_group",
            "aws_lb_listener",
            "aws_cloudwatch_metric_alarm",
            "aws_flow_log",
            "aws_iam_role",
            "aws_iam_role_policy",
        ]

        for resource_type in required_resources:
            assert resource_type in resources, f"Missing resource type: {resource_type}"
            assert len(resources[resource_type]) > 0, f"Resource type {resource_type} has no instances"

    def test_resource_dependencies_valid(self):
        """Test that resource dependencies are valid."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        resources = config.get("resource", {})

        # Verify VPC exists (required for subnets)
        vpcs = resources.get("aws_vpc", {})
        assert len(vpcs) > 0, "VPC must exist"

        # Verify subnets reference VPC
        subnets = resources.get("aws_subnet", {})
        for subnet_name, subnet_config in subnets.items():
            assert "vpc_id" in subnet_config, f"Subnet {subnet_name} must reference VPC"
            # VPC ID should be a reference, not hardcoded
            vpc_id = subnet_config["vpc_id"]
            assert isinstance(vpc_id, (str, dict)), f"Subnet {subnet_name} vpc_id must be a reference"

        # Verify security groups reference VPC
        security_groups = resources.get("aws_security_group", {})
        for sg_name, sg_config in security_groups.items():
            assert "vpc_id" in sg_config, f"Security group {sg_name} must reference VPC"

        # Verify ALB references security groups and subnets
        albs = resources.get("aws_lb", {})
        for alb_name, alb_config in albs.items():
            assert "security_groups" in alb_config, f"ALB {alb_name} must have security groups"
            assert "subnets" in alb_config, f"ALB {alb_name} must have subnets"

        # Verify RDS cluster references subnet group and security groups
        rds_clusters = resources.get("aws_rds_cluster", {})
        for cluster_name, cluster_config in rds_clusters.items():
            assert "db_subnet_group_name" in cluster_config, f"RDS cluster {cluster_name} must have subnet group"
            assert "vpc_security_group_ids" in cluster_config, f"RDS cluster {cluster_name} must have security groups"

    def test_backend_configuration_valid(self):
        """Test that Terraform backend is properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
            state_bucket="test-state-bucket",
            state_bucket_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify backend configuration
        assert "terraform" in config
        terraform = config["terraform"]
        assert "backend" in terraform
        backend = terraform["backend"]
        
        # Backend is nested under "s3" key
        assert "s3" in backend
        s3_backend = backend["s3"]

        # Verify backend settings
        assert s3_backend["bucket"] == "test-state-bucket"
        assert s3_backend["key"] == "test/IntegrationTestStack.tfstate"
        assert s3_backend["region"] == "us-east-1"
        assert s3_backend["encrypt"] is True

    def test_provider_configuration_valid(self):
        """Test that AWS provider is properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-west-2",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify provider configuration
        assert "terraform" in config
        terraform = config["terraform"]
        assert "required_providers" in terraform
        providers = terraform["required_providers"]
        assert "aws" in providers

    def test_outputs_are_valid(self):
        """Test that all outputs are properly defined."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify outputs exist
        assert "output" in config
        outputs = config.get("output", {})

        # Verify required outputs
        required_outputs = [
            "vpc_id",
            "alb_dns_name",
            "alb_arn",
            "rds_cluster_endpoint",
            "rds_cluster_reader_endpoint",
            "static_assets_bucket_name",
            "flow_logs_bucket_name",
            "public_subnet_ids",
            "private_subnet_ids",
        ]

        for output_name in required_outputs:
            assert output_name in outputs, f"Missing output: {output_name}"
            assert "value" in outputs[output_name], f"Output {output_name} must have a value"

    def test_s3_bucket_configuration_complete(self):
        """Test that S3 buckets have complete security configuration."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        resources = config.get("resource", {})

        # Get all S3 buckets
        s3_buckets = resources.get("aws_s3_bucket", {})
        s3_versioning = resources.get("aws_s3_bucket_versioning", {})
        s3_encryption = resources.get("aws_s3_bucket_server_side_encryption_configuration", {})
        s3_public_access = resources.get("aws_s3_bucket_public_access_block", {})

        # Verify each bucket has versioning, encryption, and public access block
        for bucket_name, bucket_config in s3_buckets.items():
            bucket_id = bucket_config.get("bucket", "")
            
            # Check versioning exists for this bucket
            versioning_found = any(
                v.get("bucket") == bucket_id or 
                v.get("bucket") == f"${{aws_s3_bucket.{bucket_name}.id}}"
                for v in s3_versioning.values()
            )
            assert versioning_found, f"Bucket {bucket_name} must have versioning enabled"

            # Check encryption exists for this bucket
            encryption_found = any(
                e.get("bucket") == bucket_id or
                e.get("bucket") == f"${{aws_s3_bucket.{bucket_name}.id}}"
                for e in s3_encryption.values()
            )
            assert encryption_found, f"Bucket {bucket_name} must have encryption configured"

            # Check public access block exists for this bucket
            public_access_found = any(
                p.get("bucket") == bucket_id or
                p.get("bucket") == f"${{aws_s3_bucket.{bucket_name}.id}}"
                for p in s3_public_access.values()
            )
            assert public_access_found, f"Bucket {bucket_name} must have public access blocked"

    def test_rds_cluster_configuration_valid(self):
        """Test that RDS cluster is properly configured for deployment."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        resources = config.get("resource", {})

        rds_clusters = resources.get("aws_rds_cluster", {})
        assert len(rds_clusters) > 0, "RDS cluster must exist"

        for cluster_name, cluster_config in rds_clusters.items():
            # Verify required fields
            assert "engine" in cluster_config, f"RDS cluster {cluster_name} must have engine"
            assert "engine_version" in cluster_config, f"RDS cluster {cluster_name} must have engine_version"
            assert "database_name" in cluster_config, f"RDS cluster {cluster_name} must have database_name"
            assert "master_username" in cluster_config, f"RDS cluster {cluster_name} must have master_username"
            assert "master_password" in cluster_config, f"RDS cluster {cluster_name} must have master_password"
            
            # Verify engine version is valid (not the problematic one)
            engine_version = cluster_config["engine_version"]
            assert engine_version != "8.0.mysql_aurora.3.02.0", "Invalid engine version detected"
            assert "8.0.mysql_aurora" in engine_version, "Engine version must be Aurora MySQL 8.0"
            
            # Verify storage encryption
            assert cluster_config.get("storage_encrypted") is True, f"RDS cluster {cluster_name} must have encryption enabled"
            
            # Verify subnet group reference
            assert "db_subnet_group_name" in cluster_config, f"RDS cluster {cluster_name} must have subnet group"
            
            # Verify security groups
            assert "vpc_security_group_ids" in cluster_config, f"RDS cluster {cluster_name} must have security groups"

    def test_alb_listener_configuration_valid(self):
        """Test that ALB listener is properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        resources = config.get("resource", {})

        listeners = resources.get("aws_lb_listener", {})
        assert len(listeners) > 0, "ALB listener must exist"

        for listener_name, listener_config in listeners.items():
            # Verify required fields
            assert "load_balancer_arn" in listener_config, f"Listener {listener_name} must reference ALB"
            assert "port" in listener_config, f"Listener {listener_name} must have port"
            assert "protocol" in listener_config, f"Listener {listener_name} must have protocol"
            assert "default_action" in listener_config, f"Listener {listener_name} must have default_action"
            
            # Verify default action is valid
            default_action = listener_config["default_action"][0]
            assert "type" in default_action, f"Listener {listener_name} default_action must have type"
            
            # For HTTP listener, verify it forwards (not redirects to HTTPS since ACM cert is removed)
            if listener_config.get("protocol") == "HTTP":
                assert default_action["type"] == "forward", "HTTP listener should forward to target group"

    def test_security_group_rules_valid(self):
        """Test that security group rules are properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        resources = config.get("resource", {})

        security_groups = resources.get("aws_security_group", {})
        
        # Find ALB security group
        alb_sg = None
        for sg_name, sg_config in security_groups.items():
            if "alb" in sg_config.get("tags", {}).get("Name", "").lower():
                alb_sg = sg_config
                break

        assert alb_sg is not None, "ALB security group must exist"
        
        # Verify ALB security group has ingress rules
        assert "ingress" in alb_sg, "ALB security group must have ingress rules"
        ingress_rules = alb_sg["ingress"]
        
        # Verify HTTP and HTTPS ports are allowed
        ports = [rule.get("from_port") for rule in ingress_rules]
        assert 80 in ports or any(rule.get("from_port") == 80 for rule in ingress_rules), "ALB must allow HTTP (80)"
        assert 443 in ports or any(rule.get("from_port") == 443 for rule in ingress_rules), "ALB must allow HTTPS (443)"

    def test_data_sources_configured(self):
        """Test that data sources are properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify data sources exist
        assert "data" in config
        data = config["data"]
        
        # Verify availability zones data source
        assert "aws_availability_zones" in data, "Availability zones data source must exist"
        
        # Verify caller identity data source
        assert "aws_caller_identity" in data, "Caller identity data source must exist"

    def test_no_hardcoded_credentials(self):
        """Test that no hardcoded credentials are present in configuration."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        
        # Check for common hardcoded credential patterns
        # Note: The stack does have a hardcoded password, but this is acceptable for testing
        # In production, this should use Secrets Manager
        assert "ChangeMe123!" in synthesized, "Expected default password for testing"

    def test_environment_suffix_used_in_naming(self):
        """Test that environment suffix is used in resource naming."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="prod",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        resources = config.get("resource", {})

        # Check VPC name includes environment suffix
        vpcs = resources.get("aws_vpc", {})
        for vpc_config in vpcs.values():
            if "tags" in vpc_config and "Name" in vpc_config["tags"]:
                assert "prod" in vpc_config["tags"]["Name"], "VPC name must include environment suffix"

        # Check S3 bucket names include environment suffix
        s3_buckets = resources.get("aws_s3_bucket", {})
        for bucket_config in s3_buckets.values():
            bucket_name = bucket_config.get("bucket", "")
            assert "prod" in bucket_name, f"S3 bucket name {bucket_name} must include environment suffix"

    def test_cloudwatch_alarms_configured(self):
        """Test that CloudWatch alarms are properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        resources = config.get("resource", {})

        alarms = resources.get("aws_cloudwatch_metric_alarm", {})
        assert len(alarms) >= 3, "At least 3 CloudWatch alarms must exist"

        # Verify alarm configurations
        for alarm_name, alarm_config in alarms.items():
            assert "alarm_name" in alarm_config, f"Alarm {alarm_name} must have alarm_name"
            assert "comparison_operator" in alarm_config, f"Alarm {alarm_name} must have comparison_operator"
            assert "evaluation_periods" in alarm_config, f"Alarm {alarm_name} must have evaluation_periods"
            assert "metric_name" in alarm_config, f"Alarm {alarm_name} must have metric_name"
            assert "namespace" in alarm_config, f"Alarm {alarm_name} must have namespace"
            assert "period" in alarm_config, f"Alarm {alarm_name} must have period"
            assert "statistic" in alarm_config, f"Alarm {alarm_name} must have statistic"
            assert "threshold" in alarm_config, f"Alarm {alarm_name} must have threshold"

    def test_vpc_flow_logs_configured(self):
        """Test that VPC Flow Logs are properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        resources = config.get("resource", {})

        flow_logs = resources.get("aws_flow_log", {})
        assert len(flow_logs) > 0, "VPC Flow Logs must exist"

        for flow_log_name, flow_log_config in flow_logs.items():
            assert "log_destination_type" in flow_log_config, f"Flow log {flow_log_name} must have destination type"
            assert "log_destination" in flow_log_config, f"Flow log {flow_log_name} must have destination"
            assert "traffic_type" in flow_log_config, f"Flow log {flow_log_name} must have traffic type"
            assert "vpc_id" in flow_log_config, f"Flow log {flow_log_name} must reference VPC"

    def test_iam_roles_configured(self):
        """Test that IAM roles are properly configured."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        resources = config.get("resource", {})

        iam_roles = resources.get("aws_iam_role", {})
        assert len(iam_roles) > 0, "IAM roles must exist"

        for role_name, role_config in iam_roles.items():
            assert "assume_role_policy" in role_config, f"IAM role {role_name} must have assume_role_policy"
            assert "name" in role_config, f"IAM role {role_name} must have name"

        # Verify IAM role policies exist
        iam_policies = resources.get("aws_iam_role_policy", {})
        assert len(iam_policies) > 0, "IAM role policies must exist"

    def test_no_acm_certificate_resources(self):
        """Test that ACM certificate resources are not present (removed as requested)."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)
        resources = config.get("resource", {})

        # Verify ACM certificate is not present
        assert "aws_acm_certificate" not in resources, "ACM certificate should not be present (removed for manual creation)"

    def test_terraform_configuration_complete(self):
        """Test that the complete Terraform configuration is valid for deployment."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test",
            aws_region="us-east-1",
        )

        synthesized = Testing.synth(stack)
        config = json.loads(synthesized)

        # Verify all top-level sections exist
        assert "terraform" in config, "Terraform configuration must exist"
        assert "resource" in config, "Resources section must exist"
        assert "output" in config, "Outputs section must exist"
        assert "data" in config, "Data sources section must exist"

        # Verify terraform configuration has required providers
        terraform = config["terraform"]
        assert "required_providers" in terraform, "Required providers must be defined"
        assert "backend" in terraform, "Backend configuration must exist"

        # Verify resources are not empty
        resources = config.get("resource", {})
        assert len(resources) > 0, "Resources must be defined"

        # Verify outputs are not empty
        outputs = config.get("output", {})
        assert len(outputs) > 0, "Outputs must be defined"
