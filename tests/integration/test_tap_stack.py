"""
test_tap_stack_integration.py

Integration tests for RDS MySQL optimization infrastructure.
Tests deployed AWS resources and optimization script functionality.
"""

import json
import os
import unittest

import boto3
from botocore.exceptions import ClientError


class TestRDSOptimizationIntegration(unittest.TestCase):
    """Integration tests for deployed RDS MySQL infrastructure and optimization."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures for all tests."""
        cls.environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
        cls.aws_region = os.getenv("AWS_REGION", "us-east-1")
        cls.rds_client = boto3.client("rds", region_name=cls.aws_region)
        cls.cloudwatch_client = boto3.client("cloudwatch", region_name=cls.aws_region)

        # Load outputs from deployment
        cls.outputs = cls._load_deployment_outputs()

    @classmethod
    def _load_deployment_outputs(cls):
        """Load deployment outputs from cfn-outputs/flat-outputs.json."""
        try:
            with open("cfn-outputs/flat-outputs.json", "r", encoding="utf-8") as f:
                return json.load(f)
        except FileNotFoundError:
            print("⚠️ Warning: cfn-outputs/flat-outputs.json not found")
            return {}

    def test_rds_instance_exists(self):
        """Test that RDS instance was created successfully."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")

        instance_id = self.outputs.get("db_instance_identifier")
        self.assertIsNotNone(instance_id, "DB instance identifier should be in outputs")

        try:
            response = self.rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )
            instances = response["DBInstances"]
            self.assertEqual(len(instances), 1, "Should find exactly one RDS instance")

            instance = instances[0]
            self.assertEqual(instance["Engine"], "mysql")
            self.assertTrue(instance["EngineVersion"].startswith("8.0"))

        except ClientError as e:
            self.fail(f"RDS instance not found: {e}")

    def test_rds_instance_has_correct_configuration(self):
        """Test that RDS instance has correct configuration settings."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")

        instance_id = self.outputs.get("db_instance_identifier")

        try:
            response = self.rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )
            instance = response["DBInstances"][0]

            # Check storage type
            self.assertEqual(instance["StorageType"], "gp3", "Should use GP3 storage")

            # Check IOPS
            self.assertEqual(instance["Iops"], 3000, "Should have 3000 IOPS")

            # Check backup retention
            self.assertEqual(
                instance["BackupRetentionPeriod"], 7, "Should have 7 day backup retention"
            )

            # Check engine
            self.assertEqual(instance["Engine"], "mysql")

        except ClientError as e:
            self.fail(f"Error checking RDS configuration: {e}")

    def test_rds_parameter_group_has_performance_settings(self):
        """Test that parameter group has correct performance settings."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")

        instance_id = self.outputs.get("db_instance_identifier")

        try:
            # Get instance to find parameter group
            response = self.rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )
            instance = response["DBInstances"][0]
            param_groups = instance["DBParameterGroups"]
            self.assertGreater(len(param_groups), 0, "Should have parameter group")

            param_group_name = param_groups[0]["DBParameterGroupName"]

            # Get parameters
            params_response = self.rds_client.describe_db_parameters(
                DBParameterGroupName=param_group_name
            )

            parameters = params_response["Parameters"]
            param_dict = {p["ParameterName"]: p.get("ParameterValue") for p in parameters}

            # Check performance_schema
            if "performance_schema" in param_dict:
                self.assertIn(
                    param_dict["performance_schema"].lower(),
                    ["on", "1"],
                    "performance_schema should be ON",
                )

            # Check slow_query_log
            if "slow_query_log" in param_dict:
                self.assertIn(
                    param_dict["slow_query_log"].lower(),
                    ["on", "1"],
                    "slow_query_log should be ON",
                )

        except ClientError as e:
            self.fail(f"Error checking parameter group: {e}")

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms were created for monitoring."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")

        instance_id = self.outputs.get("db_instance_identifier")

        try:
            # List all alarms
            response = self.cloudwatch_client.describe_alarms(MaxRecords=100)
            alarms = response["MetricAlarms"]

            # Filter alarms for this RDS instance
            rds_alarms = [
                a
                for a in alarms
                if a.get("Dimensions")
                and any(
                    d.get("Name") == "DBInstanceIdentifier"
                    and d.get("Value") == instance_id
                    for d in a.get("Dimensions", [])
                )
            ]

            self.assertGreaterEqual(
                len(rds_alarms), 2, "Should have at least 2 CloudWatch alarms"
            )

            # Check for CPU alarm
            cpu_alarms = [
                a for a in rds_alarms if a.get("MetricName") == "CPUUtilization"
            ]
            self.assertGreater(len(cpu_alarms), 0, "Should have CPU alarm")

            # Check for storage alarm
            storage_alarms = [
                a for a in rds_alarms if a.get("MetricName") == "FreeStorageSpace"
            ]
            self.assertGreater(len(storage_alarms), 0, "Should have storage alarm")

        except ClientError as e:
            self.fail(f"Error checking CloudWatch alarms: {e}")

    def test_deployment_outputs_are_valid(self):
        """Test that deployment outputs contain all required fields."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")

        required_outputs = [
            "db_endpoint",
            "db_port",
            "db_resource_id",
            "db_instance_identifier",
            "db_instance_class",
            "allocated_storage",
        ]

        for output in required_outputs:
            self.assertIn(
                output, self.outputs, f"Output '{output}' should be present"
            )
            self.assertIsNotNone(
                self.outputs[output], f"Output '{output}' should not be None"
            )

    def test_baseline_configuration_before_optimization(self):
        """Test that baseline configuration has higher allocations (before optimization)."""
        if not self.outputs:
            self.skipTest("No deployment outputs available")

        # This test verifies the BASELINE configuration
        # After running lib/optimize.py, these values will be reduced
        instance_class = self.outputs.get("db_instance_class")
        allocated_storage = self.outputs.get("allocated_storage")

        # Baseline should have higher allocations
        self.assertIn(
            instance_class,
            ["db.t4g.xlarge", "db.t4g.large"],
            "Instance class should be t4g series",
        )

        self.assertGreaterEqual(
            int(allocated_storage),
            100,
            "Storage should be at least 100GB",
        )


if __name__ == "__main__":
    unittest.main()
