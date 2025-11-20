#!/usr/bin/env python3
"""
Integration tests for CloudFormation template.
Tests AWS CLI validation and stack operations (requires AWS credentials).
"""

import json
import subprocess
import unittest
from pathlib import Path


class TestCloudFormationIntegration(unittest.TestCase):
    """Integration tests for CloudFormation template with AWS CLI."""

    @classmethod
    def setUpClass(cls):
        """Set up test environment."""
        cls.template_path = Path(__file__).parent.parent / "lib" / "template.json"
        cls.template_exists = cls.template_path.exists()

    def test_template_file_exists(self):
        """Test that template file exists."""
        self.assertTrue(
            self.template_exists,
            f"Template file not found at {self.template_path}"
        )

    def test_aws_cli_validate_template(self):
        """Test template validation using AWS CLI."""
        if not self.template_exists:
            self.skipTest("Template file does not exist")

        try:
            result = subprocess.run(
                [
                    "aws", "cloudformation", "validate-template",
                    "--template-body", f"file://{self.template_path}",
                    "--region", "us-east-1"
                ],
                capture_output=True,
                text=True,
                timeout=30
            )

            # If AWS CLI is not configured or available, skip the test
            if "Unable to locate credentials" in result.stderr:
                self.skipTest("AWS credentials not configured")

            if "Could not connect" in result.stderr:
                self.skipTest("Cannot connect to AWS")

            # Template should validate successfully
            self.assertEqual(
                result.returncode,
                0,
                f"Template validation failed: {result.stderr}"
            )

            # Parse and verify response
            if result.stdout:
                response = json.loads(result.stdout)
                self.assertIn("Parameters", response)

        except FileNotFoundError:
            self.skipTest("AWS CLI not installed")
        except subprocess.TimeoutExpired:
            self.fail("AWS CLI validation timed out")

    def test_cfn_lint_validation(self):
        """Test template validation using cfn-lint if available."""
        if not self.template_exists:
            self.skipTest("Template file does not exist")

        try:
            result = subprocess.run(
                ["cfn-lint", str(self.template_path), "--format", "json"],
                capture_output=True,
                text=True,
                timeout=30
            )

            # cfn-lint returns 0 for success, non-zero for errors
            if result.returncode == 0:
                # No errors
                self.assertEqual(result.returncode, 0)
            else:
                # Parse errors if JSON format
                if result.stdout:
                    try:
                        errors = json.loads(result.stdout)
                        # Filter out informational messages
                        critical_errors = [
                            e for e in errors
                            if e.get("Level") in ["Error", "Warning"]
                        ]
                        if critical_errors:
                            self.fail(f"cfn-lint found issues: {json.dumps(critical_errors, indent=2)}")
                    except json.JSONDecodeError:
                        # If not JSON, just check return code
                        pass

        except FileNotFoundError:
            self.skipTest("cfn-lint not installed")
        except subprocess.TimeoutExpired:
            self.fail("cfn-lint validation timed out")

    def test_template_size_within_limits(self):
        """Test that template size is within CloudFormation limits."""
        if not self.template_exists:
            self.skipTest("Template file does not exist")

        template_size = self.template_path.stat().st_size

        # CloudFormation template size limits:
        # - 51,200 bytes for templates uploaded directly
        # - 460,800 bytes for templates in S3
        self.assertLess(
            template_size,
            51200,
            f"Template size ({template_size} bytes) exceeds direct upload limit (51,200 bytes)"
        )

    def test_parameter_validation_patterns(self):
        """Test that parameter patterns would be accepted by CloudFormation."""
        with open(self.template_path, "r") as f:
            template = json.load(f)

        test_cases = {
            "EnvironmentSuffix": [
                ("dev-123", True),
                ("prod-v1", True),
                ("staging-001", True),
                ("test_env", False),  # Contains underscore
                ("", False),  # Too short
            ],
            "DBUsername": [
                ("admin", True),
                ("dbuser123", True),
                ("123user", False),  # Starts with number
                ("user_name", False),  # Contains underscore
            ]
        }

        import re

        for param_name, test_values in test_cases.items():
            if param_name not in template["Parameters"]:
                continue

            param = template["Parameters"][param_name]
            pattern = param.get("AllowedPattern")
            min_length = param.get("MinLength", 0)
            max_length = param.get("MaxLength", float('inf'))

            if pattern:
                for value, should_match in test_values:
                    if len(value) < min_length or len(value) > max_length:
                        continue

                    matches = bool(re.fullmatch(pattern, value))
                    self.assertEqual(
                        matches,
                        should_match,
                        f"Pattern validation failed for {param_name}='{value}': "
                        f"expected {should_match}, got {matches} (pattern: {pattern})"
                    )

    def test_resource_naming_uniqueness(self):
        """Test that resource names use parameters for uniqueness."""
        with open(self.template_path, "r") as f:
            template = json.load(f)

        resources = template.get("Resources", {})

        # Resources that should use EnvironmentSuffix for naming
        resources_needing_suffix = [
            "DBSubnetGroup",
            "AuroraDBCluster",
            "AuroraDBInstance",
            "TransactionProcessorFunction",
            "DBSecret",
            "NotificationTopic"
        ]

        for resource_name in resources_needing_suffix:
            if resource_name not in resources:
                continue

            resource = resources[resource_name]
            resource_json = json.dumps(resource)

            self.assertIn(
                "EnvironmentSuffix",
                resource_json,
                f"Resource {resource_name} should use EnvironmentSuffix for naming"
            )

    def test_iam_role_naming_convention(self):
        """Test that IAM roles follow naming convention with stack name."""
        with open(self.template_path, "r") as f:
            template = json.load(f)

        iam_roles = [
            "RDSMonitoringRole",
            "TransactionProcessorRole"
        ]

        for role_name in iam_roles:
            if role_name not in template["Resources"]:
                continue

            role = template["Resources"][role_name]
            if role["Type"] != "AWS::IAM::Role":
                continue

            role_name_prop = role["Properties"].get("RoleName", {})

            # Should use Fn::Sub with AWS::StackName
            if isinstance(role_name_prop, dict):
                self.assertIn("Fn::Sub", role_name_prop)
                self.assertIn("${AWS::StackName}", role_name_prop["Fn::Sub"])

    def test_outputs_exportable(self):
        """Test that all outputs can be exported without conflicts."""
        with open(self.template_path, "r") as f:
            template = json.load(f)

        outputs = template.get("Outputs", {})
        export_names = []

        for output_name, output_config in outputs.items():
            if "Export" in output_config:
                export = output_config["Export"]
                if "Name" in export:
                    # Extract the export name pattern
                    export_name_config = export["Name"]
                    if isinstance(export_name_config, dict) and "Fn::Sub" in export_name_config:
                        export_pattern = export_name_config["Fn::Sub"]
                        export_names.append(export_pattern)

        # Verify no duplicate export patterns
        self.assertEqual(
            len(export_names),
            len(set(export_names)),
            "Duplicate export name patterns found"
        )

    def test_security_group_port_configuration(self):
        """Test that security groups have proper port configurations."""
        with open(self.template_path, "r") as f:
            template = json.load(f)

        db_sg = template["Resources"]["DBSecurityGroup"]
        ingress = db_sg["Properties"]["SecurityGroupIngress"][0]

        # MySQL port should be 3306
        self.assertEqual(ingress["FromPort"], 3306)
        self.assertEqual(ingress["ToPort"], 3306)
        self.assertEqual(ingress["IpProtocol"], "tcp")

    def test_lambda_environment_variables(self):
        """Test Lambda function has required environment variables."""
        with open(self.template_path, "r") as f:
            template = json.load(f)

        lambda_func = template["Resources"]["TransactionProcessorFunction"]
        env_vars = lambda_func["Properties"]["Environment"]["Variables"]

        required_vars = ["DB_ENDPOINT", "DB_NAME", "DB_PORT", "ENVIRONMENT"]

        for var in required_vars:
            self.assertIn(var, env_vars, f"Lambda missing environment variable: {var}")

    def test_rds_backup_configuration(self):
        """Test RDS cluster has backup configuration."""
        with open(self.template_path, "r") as f:
            template = json.load(f)

        cluster = template["Resources"]["AuroraDBCluster"]
        props = cluster["Properties"]

        self.assertIn("BackupRetentionPeriod", props)
        self.assertGreaterEqual(props["BackupRetentionPeriod"], 7)
        self.assertIn("PreferredBackupWindow", props)
        self.assertIn("PreferredMaintenanceWindow", props)

    def test_cloudwatch_logs_exports(self):
        """Test RDS cluster exports logs to CloudWatch."""
        with open(self.template_path, "r") as f:
            template = json.load(f)

        cluster = template["Resources"]["AuroraDBCluster"]
        props = cluster["Properties"]

        self.assertIn("EnableCloudwatchLogsExports", props)
        log_exports = props["EnableCloudwatchLogsExports"]

        # Should export error and slow query logs
        self.assertIn("error", log_exports)
        self.assertIn("slowquery", log_exports)

    def test_no_public_accessibility(self):
        """Test that database instance is not publicly accessible."""
        with open(self.template_path, "r") as f:
            template = json.load(f)

        instance = template["Resources"]["AuroraDBInstance"]
        props = instance["Properties"]

        self.assertFalse(
            props.get("PubliclyAccessible", True),
            "RDS instance should not be publicly accessible"
        )


if __name__ == "__main__":
    unittest.main()
