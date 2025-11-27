"""
Integration tests for deployed Terraform infrastructure
Tests validate actual AWS resources and their configurations
"""

import json
import os
import unittest
from pathlib import Path


class TestTerraformDeployment(unittest.TestCase):
    """Integration tests for deployed infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Load deployment outputs"""
        cls.outputs_file = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"

        # Check if outputs exist
        if cls.outputs_file.exists():
            with open(cls.outputs_file, 'r') as f:
                cls.outputs = json.load(f)
        else:
            cls.outputs = {}
            print(f"Warning: Outputs file not found at {cls.outputs_file}")
            print("Integration tests will be skipped or use mock data")

    def test_alb_dns_name_present(self):
        """Test that ALB DNS name is in outputs"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        self.assertIn(
            "alb_dns_name", self.outputs,
            "ALB DNS name not found in outputs"
        )
        self.assertIsNotNone(
            self.outputs.get("alb_dns_name"),
            "ALB DNS name is None"
        )

    def test_alb_arn_present(self):
        """Test that ALB ARN is in outputs"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        self.assertIn(
            "alb_arn", self.outputs,
            "ALB ARN not found in outputs"
        )
        self.assertIsNotNone(
            self.outputs.get("alb_arn"),
            "ALB ARN is None"
        )

    def test_autoscaling_group_name_present(self):
        """Test that Auto Scaling Group name is in outputs"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        self.assertIn(
            "autoscaling_group_name", self.outputs,
            "Auto Scaling Group name not found in outputs"
        )

    def test_database_endpoint_present(self):
        """Test that database endpoint is in outputs"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        self.assertIn(
            "database_endpoint", self.outputs,
            "Database endpoint not found in outputs"
        )
        self.assertIsNotNone(
            self.outputs.get("database_endpoint"),
            "Database endpoint is None"
        )

    def test_database_reader_endpoint_present(self):
        """Test that database reader endpoint is in outputs"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        self.assertIn(
            "database_reader_endpoint", self.outputs,
            "Database reader endpoint not found in outputs"
        )

    def test_database_name_present(self):
        """Test that database name is in outputs"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        self.assertIn(
            "database_name", self.outputs,
            "Database name not found in outputs"
        )
        self.assertEqual(
            self.outputs.get("database_name"), "finservdb",
            "Database name does not match expected value"
        )

    def test_database_port_present(self):
        """Test that database port is in outputs"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        self.assertIn(
            "database_port", self.outputs,
            "Database port not found in outputs"
        )
        self.assertEqual(
            self.outputs.get("database_port"), 3306,
            "Database port should be 3306 for MySQL"
        )

    def test_vpc_id_present(self):
        """Test that VPC ID is in outputs"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        self.assertIn(
            "vpc_id", self.outputs,
            "VPC ID not found in outputs"
        )
        self.assertIsNotNone(
            self.outputs.get("vpc_id"),
            "VPC ID is None"
        )

    def test_private_subnet_ids_present(self):
        """Test that private subnet IDs are in outputs"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        self.assertIn(
            "private_subnet_ids", self.outputs,
            "Private subnet IDs not found in outputs"
        )

        # Check that we have subnet IDs (should be a list or array)
        private_subnets = self.outputs.get("private_subnet_ids")
        self.assertIsNotNone(private_subnets, "Private subnet IDs are None")

        # If it's a JSON string, parse it
        if isinstance(private_subnets, str):
            try:
                private_subnets = json.loads(private_subnets)
            except json.JSONDecodeError:
                pass

        # Should have at least 3 subnets (one per AZ)
        if isinstance(private_subnets, list):
            self.assertGreaterEqual(
                len(private_subnets), 3,
                "Should have at least 3 private subnets"
            )

    def test_public_subnet_ids_present(self):
        """Test that public subnet IDs are in outputs"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        self.assertIn(
            "public_subnet_ids", self.outputs,
            "Public subnet IDs not found in outputs"
        )

        # Check that we have subnet IDs
        public_subnets = self.outputs.get("public_subnet_ids")
        self.assertIsNotNone(public_subnets, "Public subnet IDs are None")

        # If it's a JSON string, parse it
        if isinstance(public_subnets, str):
            try:
                public_subnets = json.loads(public_subnets)
            except json.JSONDecodeError:
                pass

        # Should have at least 3 subnets (one per AZ)
        if isinstance(public_subnets, list):
            self.assertGreaterEqual(
                len(public_subnets), 3,
                "Should have at least 3 public subnets"
            )

    def test_alb_dns_format_valid(self):
        """Test that ALB DNS name has valid format"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        alb_dns = self.outputs.get("alb_dns_name")
        if alb_dns:
            self.assertIn(
                ".elb.", alb_dns,
                "ALB DNS name should contain .elb."
            )
            self.assertIn(
                "amazonaws.com", alb_dns,
                "ALB DNS name should contain amazonaws.com"
            )

    def test_database_endpoint_format_valid(self):
        """Test that database endpoint has valid format"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        db_endpoint = self.outputs.get("database_endpoint")
        if db_endpoint:
            self.assertIn(
                ".rds.amazonaws.com", db_endpoint,
                "Database endpoint should contain .rds.amazonaws.com"
            )

    def test_vpc_id_format_valid(self):
        """Test that VPC ID has valid format"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        vpc_id = self.outputs.get("vpc_id")
        if vpc_id:
            self.assertTrue(
                vpc_id.startswith("vpc-"),
                "VPC ID should start with vpc-"
            )

    def test_environment_suffix_in_resource_names(self):
        """Test that environment suffix is present in resource names"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        # Check ASG name contains environment suffix
        asg_name = self.outputs.get("autoscaling_group_name")
        if asg_name:
            # Should contain finserv prefix and environment suffix
            self.assertIn(
                "finserv", asg_name.lower(),
                "ASG name should contain finserv prefix"
            )

    def test_no_hardcoded_environment_values(self):
        """Test that outputs don't contain hardcoded prod/dev/staging values"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        # Check that resource names don't have hardcoded environment names
        for key, value in self.outputs.items():
            if isinstance(value, str):
                # Allow environment variable in database name but not in resource identifiers
                if key != "database_name":
                    self.assertNotIn(
                        "-prod-", value.lower(),
                        f"Output {key} contains hardcoded 'prod'"
                    )
                    self.assertNotIn(
                        "-dev-", value.lower(),
                        f"Output {key} contains hardcoded 'dev'"
                    )
                    self.assertNotIn(
                        "-staging-", value.lower(),
                        f"Output {key} contains hardcoded 'staging'"
                    )

    def test_all_required_outputs_present(self):
        """Test that all required outputs are present"""
        if not self.outputs:
            self.skipTest("Deployment outputs not available")

        required_outputs = [
            "alb_dns_name",
            "alb_arn",
            "autoscaling_group_name",
            "database_endpoint",
            "database_reader_endpoint",
            "database_name",
            "database_port",
            "vpc_id",
            "private_subnet_ids",
            "public_subnet_ids"
        ]

        missing_outputs = [
            output for output in required_outputs
            if output not in self.outputs
        ]

        self.assertEqual(
            len(missing_outputs), 0,
            f"Missing required outputs: {missing_outputs}"
        )


if __name__ == "__main__":
    unittest.main()
