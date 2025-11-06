#!/usr/bin/env python3
"""
Integration tests for Terraform migration orchestration infrastructure.
Tests validate both structure and functionality of the generated code.
"""

import unittest
import os
import re
import json
from pathlib import Path


class TestTerraformStructure(unittest.TestCase):
    """Test Terraform file structure and organization"""

    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        cls.lib_dir = Path(__file__).parent.parent / "lib"
        cls.required_files = [
            "backend.tf",
            "provider.tf",
            "variables.tf",
            "locals.tf",
            "vpc.tf",
            "vpc-peering.tf",
            "security-groups.tf",
            "alb.tf",
            "auto-scaling.tf",
            "dms.tf",
            "route53.tf",
            "parameter-store.tf",
            "cloudwatch.tf",
            "outputs.tf"
        ]

    def test_required_files_exist(self):
        """Test that all required Terraform files exist"""
        for filename in self.required_files:
            file_path = self.lib_dir / filename
            self.assertTrue(
                file_path.exists(),
                f"Required file {filename} not found in lib/"
            )

    def test_terraform_block_location(self):
        """Test that terraform block is in provider.tf"""
        provider_file = self.lib_dir / "provider.tf"
        self.assertTrue(provider_file.exists())

        content = provider_file.read_text()
        self.assertIn("terraform {", content, "terraform block not found in provider.tf")
        self.assertIn("required_version", content)
        self.assertIn("required_providers", content)

    def test_provider_block_location(self):
        """Test that provider block exists in provider.tf"""
        provider_file = self.lib_dir / "provider.tf"
        content = provider_file.read_text()

        self.assertIn("provider \"aws\"", content, "AWS provider block not found")
        self.assertIn("region =", content)
        self.assertIn("default_tags", content)


class TestBackendConfiguration(unittest.TestCase):
    """Test backend configuration correctness"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_backend_exists(self):
        """Test that backend configuration exists"""
        backend_file = self.lib_dir / "backend.tf"
        self.assertTrue(backend_file.exists())

        content = backend_file.read_text()
        self.assertIn("backend \"s3\"", content)

    def test_backend_no_variables(self):
        """Test that backend block does not use variable interpolation"""
        backend_file = self.lib_dir / "backend.tf"
        content = backend_file.read_text()

        # Extract backend block
        backend_match = re.search(r'backend\s+"s3"\s+\{([^}]+)\}', content, re.DOTALL)
        self.assertIsNotNone(backend_match, "Backend block not found")

        backend_content = backend_match.group(1)

        # Check for variable usage (should NOT be present)
        self.assertNotIn("var.", backend_content, "Backend block contains variable interpolation - this is not allowed in Terraform")
        self.assertNotIn("${var.", backend_content, "Backend block contains variable interpolation - this is not allowed in Terraform")

    def test_backend_has_required_fields(self):
        """Test that backend has key and region"""
        backend_file = self.lib_dir / "backend.tf"
        content = backend_file.read_text()

        self.assertIn("key", content)
        self.assertIn("region", content)


class TestVariables(unittest.TestCase):
    """Test variable definitions"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_variables_file_exists(self):
        """Test that variables.tf exists"""
        variables_file = self.lib_dir / "variables.tf"
        self.assertTrue(variables_file.exists())

    def test_environment_suffix_variable(self):
        """Test that environment_suffix variable is defined"""
        variables_file = self.lib_dir / "variables.tf"
        content = variables_file.read_text()

        self.assertIn("variable \"environment_suffix\"", content)
        self.assertIn("type", content)

    def test_required_variables_defined(self):
        """Test that all required variables are defined"""
        variables_file = self.lib_dir / "variables.tf"
        content = variables_file.read_text()

        required_vars = [
            "aws_region",
            "environment_suffix",
            "legacy_vpc_cidr",
            "production_vpc_cidr",
            "db_username",
            "db_password",
            "route53_zone_name",
            "legacy_traffic_weight",
            "production_traffic_weight"
        ]

        for var_name in required_vars:
            self.assertIn(
                f'variable "{var_name}"',
                content,
                f"Required variable {var_name} not defined"
            )


class TestVPCConfiguration(unittest.TestCase):
    """Test VPC configuration"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_vpc_resource_exists(self):
        """Test that VPC resource is defined"""
        vpc_file = self.lib_dir / "vpc.tf"
        self.assertTrue(vpc_file.exists())

        content = vpc_file.read_text()
        self.assertIn("resource \"aws_vpc\" \"main\"", content)

    def test_multiple_public_subnets(self):
        """Test that multiple public subnets are created (required for ALB)"""
        vpc_file = self.lib_dir / "vpc.tf"
        content = vpc_file.read_text()

        # Check for count in public subnet resource
        public_subnet_match = re.search(
            r'resource\s+"aws_subnet"\s+"public"\s+\{[^}]*count\s*=',
            content,
            re.DOTALL
        )
        self.assertIsNotNone(
            public_subnet_match,
            "Public subnets must use count to create multiple subnets for ALB"
        )

    def test_public_subnet_configuration(self):
        """Test that public subnets are properly configured"""
        locals_file = self.lib_dir / "locals.tf"
        content = locals_file.read_text()

        # Check that public_subnet_cidrs is an array (not single string)
        self.assertIn("public_subnet_cidrs", content)

        # Should be array format like ["10.0.1.0/24", "10.0.2.0/24"]
        # Not single value like "10.0.1.0/24"
        public_subnet_pattern = r'public_subnet_cidrs\s*=\s*\['
        self.assertRegex(
            content,
            public_subnet_pattern,
            "public_subnet_cidrs should be an array for multiple subnets"
        )

    def test_nat_gateway_exists(self):
        """Test that NAT Gateway is configured"""
        vpc_file = self.lib_dir / "vpc.tf"
        content = vpc_file.read_text()

        self.assertIn("resource \"aws_nat_gateway\" \"main\"", content)
        self.assertIn("resource \"aws_eip\" \"nat\"", content)

    def test_nat_gateway_in_route_table(self):
        """Test that private route table routes through NAT Gateway"""
        vpc_file = self.lib_dir / "vpc.tf"
        content = vpc_file.read_text()

        # Check for private route table with NAT gateway route
        private_rt_match = re.search(
            r'resource\s+"aws_route_table"\s+"private".*?nat_gateway_id',
            content,
            re.DOTALL
        )
        self.assertIsNotNone(
            private_rt_match,
            "Private route table should have route to NAT Gateway"
        )

    def test_vpc_flow_logs_enabled(self):
        """Test that VPC Flow Logs are configured"""
        vpc_file = self.lib_dir / "vpc.tf"
        content = vpc_file.read_text()

        self.assertIn("resource \"aws_flow_log\" \"main\"", content)
        self.assertIn("resource \"aws_cloudwatch_log_group\" \"flow_logs\"", content)
        self.assertIn("resource \"aws_iam_role\" \"flow_logs\"", content)

    def test_flow_logs_retention(self):
        """Test that Flow Logs have retention configured"""
        vpc_file = self.lib_dir / "vpc.tf"
        content = vpc_file.read_text()

        self.assertIn("retention_in_days", content)


class TestVPCPeering(unittest.TestCase):
    """Test VPC peering configuration"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_vpc_peering_resource_exists(self):
        """Test that VPC peering resource is defined"""
        peering_file = self.lib_dir / "vpc-peering.tf"
        self.assertTrue(peering_file.exists())

        content = peering_file.read_text()
        self.assertIn("resource \"aws_vpc_peering_connection\" \"main\"", content)

    def test_peering_routes_configured(self):
        """Test that peering routes are configured for both directions"""
        peering_file = self.lib_dir / "vpc-peering.tf"
        content = peering_file.read_text()

        self.assertIn("resource \"aws_route\" \"to_legacy\"", content)
        self.assertIn("resource \"aws_route\" \"to_production\"", content)


class TestALBConfiguration(unittest.TestCase):
    """Test ALB configuration"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_alb_resource_exists(self):
        """Test that ALB resource is defined"""
        alb_file = self.lib_dir / "alb.tf"
        self.assertTrue(alb_file.exists())

        content = alb_file.read_text()
        self.assertIn("resource \"aws_lb\" \"main\"", content)

    def test_alb_uses_multiple_subnets(self):
        """Test that ALB is configured with multiple subnets"""
        alb_file = self.lib_dir / "alb.tf"
        content = alb_file.read_text()

        # Look for subnets = aws_subnet.public[*].id or similar pattern
        alb_match = re.search(
            r'resource\s+"aws_lb"\s+"main".*?subnets\s*=\s*aws_subnet\.public\[\*\]\.id',
            content,
            re.DOTALL
        )
        self.assertIsNotNone(
            alb_match,
            "ALB must use all public subnets with [*] splat operator"
        )

    def test_alb_access_logs(self):
        """Test that ALB access logging is enabled"""
        alb_file = self.lib_dir / "alb.tf"
        content = alb_file.read_text()

        self.assertIn("access_logs", content)
        self.assertIn("resource \"aws_s3_bucket\" \"alb_logs\"", content)

    def test_alb_logs_bucket_encryption(self):
        """Test that ALB logs bucket has encryption enabled"""
        alb_file = self.lib_dir / "alb.tf"
        content = alb_file.read_text()

        self.assertIn("aws_s3_bucket_server_side_encryption_configuration", content)
        self.assertIn("sse_algorithm", content)

    def test_alb_logs_bucket_policy(self):
        """Test that ALB logs bucket has proper policy"""
        alb_file = self.lib_dir / "alb.tf"
        content = alb_file.read_text()

        self.assertIn("resource \"aws_s3_bucket_policy\" \"alb_logs\"", content)
        self.assertIn("data \"aws_elb_service_account\" \"main\"", content)

    def test_target_group_exists(self):
        """Test that target group is defined"""
        alb_file = self.lib_dir / "alb.tf"
        content = alb_file.read_text()

        self.assertIn("resource \"aws_lb_target_group\" \"main\"", content)
        self.assertIn("health_check", content)


class TestAutoScaling(unittest.TestCase):
    """Test Auto Scaling configuration"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_launch_template_exists(self):
        """Test that launch template is defined"""
        asg_file = self.lib_dir / "auto-scaling.tf"
        self.assertTrue(asg_file.exists())

        content = asg_file.read_text()
        self.assertIn("resource \"aws_launch_template\" \"app\"", content)

    def test_autoscaling_group_exists(self):
        """Test that Auto Scaling Group is defined"""
        asg_file = self.lib_dir / "auto-scaling.tf"
        content = asg_file.read_text()

        self.assertIn("resource \"aws_autoscaling_group\" \"app\"", content)

    def test_asg_uses_private_subnets(self):
        """Test that ASG uses private subnets"""
        asg_file = self.lib_dir / "auto-scaling.tf"
        content = asg_file.read_text()

        asg_match = re.search(
            r'resource\s+"aws_autoscaling_group".*?vpc_zone_identifier\s*=\s*aws_subnet\.private',
            content,
            re.DOTALL
        )
        self.assertIsNotNone(
            asg_match,
            "ASG should use private subnets for instances"
        )

    def test_iam_role_for_instances(self):
        """Test that IAM role and instance profile are defined"""
        asg_file = self.lib_dir / "auto-scaling.tf"
        content = asg_file.read_text()

        self.assertIn("resource \"aws_iam_role\" \"instance\"", content)
        self.assertIn("resource \"aws_iam_instance_profile\" \"instance\"", content)


class TestDMSConfiguration(unittest.TestCase):
    """Test DMS configuration"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_dms_replication_instance_exists(self):
        """Test that DMS replication instance is defined"""
        dms_file = self.lib_dir / "dms.tf"
        self.assertTrue(dms_file.exists())

        content = dms_file.read_text()
        self.assertIn("resource \"aws_dms_replication_instance\" \"main\"", content)

    def test_dms_endpoints_exist(self):
        """Test that DMS source and target endpoints are defined"""
        dms_file = self.lib_dir / "dms.tf"
        content = dms_file.read_text()

        self.assertIn("resource \"aws_dms_endpoint\" \"source\"", content)
        self.assertIn("resource \"aws_dms_endpoint\" \"target\"", content)

    def test_dms_replication_task_exists(self):
        """Test that DMS replication task is defined"""
        dms_file = self.lib_dir / "dms.tf"
        content = dms_file.read_text()

        self.assertIn("resource \"aws_dms_replication_task\" \"main\"", content)
        self.assertIn("full-load-and-cdc", content)

    def test_aurora_cluster_exists(self):
        """Test that Aurora cluster is defined"""
        dms_file = self.lib_dir / "dms.tf"
        content = dms_file.read_text()

        self.assertIn("resource \"aws_rds_cluster\" \"aurora\"", content)
        self.assertIn("aurora-postgresql", content)


class TestRoute53Configuration(unittest.TestCase):
    """Test Route 53 configuration"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_route53_zone_exists(self):
        """Test that Route 53 hosted zone is defined"""
        route53_file = self.lib_dir / "route53.tf"
        self.assertTrue(route53_file.exists())

        content = route53_file.read_text()
        self.assertIn("resource \"aws_route53_zone\" \"main\"", content)

    def test_weighted_routing_configured(self):
        """Test that weighted routing policy is configured"""
        route53_file = self.lib_dir / "route53.tf"
        content = route53_file.read_text()

        self.assertIn("weighted_routing_policy", content)
        self.assertIn("weight", content)

    def test_multiple_route53_records(self):
        """Test that records for both legacy and production exist"""
        route53_file = self.lib_dir / "route53.tf"
        content = route53_file.read_text()

        # Should have at least 2 record resources (one for legacy, one for production)
        record_count = len(re.findall(r'resource\s+"aws_route53_record"', content))
        self.assertGreaterEqual(
            record_count,
            2,
            "Should have at least 2 Route 53 records for weighted routing"
        )


class TestParameterStore(unittest.TestCase):
    """Test Parameter Store configuration"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_parameter_store_file_exists(self):
        """Test that parameter-store.tf exists"""
        param_file = self.lib_dir / "parameter-store.tf"
        self.assertTrue(param_file.exists())

    def test_required_parameters_defined(self):
        """Test that required parameters are defined"""
        param_file = self.lib_dir / "parameter-store.tf"
        content = param_file.read_text()

        required_params = ["db_endpoint", "alb_dns", "migration_status"]

        for param_name in required_params:
            self.assertIn(
                f'resource "aws_ssm_parameter" "{param_name}"',
                content,
                f"Required parameter {param_name} not defined"
            )

    def test_parameter_workspace_naming(self):
        """Test that parameters use workspace-based naming"""
        param_file = self.lib_dir / "parameter-store.tf"
        content = param_file.read_text()

        # Parameters should use /${terraform.workspace}/... naming
        self.assertIn("terraform.workspace", content)


class TestCloudWatch(unittest.TestCase):
    """Test CloudWatch configuration"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_cloudwatch_dashboard_exists(self):
        """Test that CloudWatch dashboard is defined"""
        cw_file = self.lib_dir / "cloudwatch.tf"
        self.assertTrue(cw_file.exists())

        content = cw_file.read_text()
        self.assertIn("resource \"aws_cloudwatch_dashboard\" \"migration\"", content)

    def test_dashboard_has_widgets(self):
        """Test that dashboard has widget configuration"""
        cw_file = self.lib_dir / "cloudwatch.tf"
        content = cw_file.read_text()

        self.assertIn("widgets", content)
        self.assertIn("AWS/DMS", content)
        self.assertIn("AWS/ApplicationELB", content)

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are defined"""
        cw_file = self.lib_dir / "cloudwatch.tf"
        content = cw_file.read_text()

        self.assertIn("resource \"aws_cloudwatch_metric_alarm\"", content)


class TestOutputs(unittest.TestCase):
    """Test output definitions"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_outputs_file_exists(self):
        """Test that outputs.tf exists"""
        outputs_file = self.lib_dir / "outputs.tf"
        self.assertTrue(outputs_file.exists())

    def test_required_outputs_defined(self):
        """Test that required outputs are defined"""
        outputs_file = self.lib_dir / "outputs.tf"
        content = outputs_file.read_text()

        required_outputs = [
            "vpc_id",
            "alb_dns_name",
            "nat_gateway_id",
            "flow_logs_group",
            "alb_logs_bucket",
            "workspace",
            "migration_commands",
            "traffic_shifting_instructions"
        ]

        for output_name in required_outputs:
            self.assertIn(
                f'output "{output_name}"',
                content,
                f"Required output {output_name} not defined"
            )


class TestResourceNaming(unittest.TestCase):
    """Test resource naming conventions"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_environment_suffix_usage(self):
        """Test that resources use environment_suffix in names"""
        files_to_check = ["vpc.tf", "alb.tf", "auto-scaling.tf", "dms.tf"]

        for filename in files_to_check:
            file_path = self.lib_dir / filename
            if file_path.exists():
                content = file_path.read_text()
                self.assertIn(
                    "environment_suffix",
                    content,
                    f"{filename} should use environment_suffix in resource names"
                )

    def test_workspace_naming(self):
        """Test that resources use workspace in names"""
        files_to_check = ["vpc.tf", "alb.tf", "auto-scaling.tf"]

        for filename in files_to_check:
            file_path = self.lib_dir / filename
            if file_path.exists():
                content = file_path.read_text()
                self.assertIn(
                    "terraform.workspace",
                    content,
                    f"{filename} should use terraform.workspace in resource names"
                )


class TestSecurityGroups(unittest.TestCase):
    """Test security group configuration"""

    @classmethod
    def setUpClass(cls):
        cls.lib_dir = Path(__file__).parent.parent / "lib"

    def test_security_groups_file_exists(self):
        """Test that security-groups.tf exists"""
        sg_file = self.lib_dir / "security-groups.tf"
        self.assertTrue(sg_file.exists())

    def test_required_security_groups(self):
        """Test that required security groups are defined"""
        sg_file = self.lib_dir / "security-groups.tf"
        content = sg_file.read_text()

        required_sgs = ["alb", "app", "dms"]

        for sg_name in required_sgs:
            self.assertIn(
                f'resource "aws_security_group" "{sg_name}"',
                content,
                f"Security group {sg_name} not defined"
            )

    def test_security_group_rules(self):
        """Test that security groups have ingress and egress rules"""
        sg_file = self.lib_dir / "security-groups.tf"
        content = sg_file.read_text()

        self.assertIn("ingress {", content)
        self.assertIn("egress {", content)


def run_tests():
    """Run all tests and return results"""
    loader = unittest.TestLoader()
    suite = loader.loadTestsFromModule(__import__(__name__))
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)

    # Print summary
    print("\n" + "="*70)
    print("Test Results:")
    print(f"- Total: {result.testsRun}")
    print(f"- Passed: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"- Failed: {len(result.failures) + len(result.errors)}")

    if result.wasSuccessful():
        print(f"- Pass Rate: 100.0%")
        print("\nAll tests passed!")
    else:
        pass_rate = ((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun) * 100
        print(f"- Pass Rate: {pass_rate:.1f}%")

    print("="*70)

    return result


if __name__ == "__main__":
    result = run_tests()
    exit(0 if result.wasSuccessful() else 1)
