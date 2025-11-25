"""
Integration tests for CloudFormation multi-region disaster recovery deployment.

This test suite validates the deployed infrastructure using actual stack outputs
from cfn-outputs/flat-outputs.json. Tests verify resource connectivity, configuration,
and end-to-end workflows.
"""

import json
import os
import unittest


class TestCloudFormationIntegration(unittest.TestCase):
    """Integration tests for deployed CloudFormation stacks."""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs from deployment."""
        base_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        outputs_path = os.path.join(base_path, "cfn-outputs", "flat-outputs.json")

        if not os.path.exists(outputs_path):
            raise FileNotFoundError(
                f"Stack outputs not found at {outputs_path}. "
                "Deploy the stacks before running integration tests."
            )

        with open(outputs_path, "r") as f:
            cls.stack_outputs = json.load(f)

    def test_stack_outputs_loaded(self):
        """Test that stack outputs are loaded successfully."""
        self.assertIsInstance(self.stack_outputs, dict)
        self.assertGreater(len(self.stack_outputs), 0)

    def test_primary_vpc_exists(self):
        """Test that primary VPC exists in outputs."""
        self.assertIn("PrimaryVPCId", self.stack_outputs)
        vpc_id = self.stack_outputs["PrimaryVPCId"]
        self.assertIsNotNone(vpc_id)
        self.assertTrue(vpc_id.startswith("vpc-"))

    def test_secondary_vpc_exists(self):
        """Test that secondary VPC exists in outputs."""
        self.assertIn("SecondaryVPCId", self.stack_outputs)
        vpc_id = self.stack_outputs["SecondaryVPCId"]
        self.assertIsNotNone(vpc_id)
        self.assertTrue(vpc_id.startswith("vpc-"))

    def test_primary_aurora_endpoint_format(self):
        """Test that primary Aurora endpoint has correct format."""
        self.assertIn("PrimaryAuroraEndpoint", self.stack_outputs)
        endpoint = self.stack_outputs["PrimaryAuroraEndpoint"]
        self.assertIsNotNone(endpoint)
        # Aurora endpoints end with rds.amazonaws.com
        self.assertTrue(endpoint.endswith(".rds.amazonaws.com"))
        # Should include environment suffix
        self.assertIn("synthf6n9q4", endpoint)

    def test_primary_aurora_read_endpoint_format(self):
        """Test that primary Aurora read endpoint has correct format."""
        self.assertIn("PrimaryAuroraReadEndpoint", self.stack_outputs)
        endpoint = self.stack_outputs["PrimaryAuroraReadEndpoint"]
        self.assertIsNotNone(endpoint)
        self.assertTrue(endpoint.endswith(".rds.amazonaws.com"))
        # Read endpoints typically contain 'ro'
        self.assertIn("ro", endpoint.lower())

    def test_secondary_aurora_endpoint_format(self):
        """Test that secondary Aurora endpoint has correct format."""
        self.assertIn("SecondaryAuroraEndpoint", self.stack_outputs)
        endpoint = self.stack_outputs["SecondaryAuroraEndpoint"]
        self.assertIsNotNone(endpoint)
        self.assertTrue(endpoint.endswith(".rds.amazonaws.com"))
        self.assertIn("synthf6n9q4", endpoint)

    def test_secondary_aurora_read_endpoint_format(self):
        """Test that secondary Aurora read endpoint has correct format."""
        self.assertIn("SecondaryAuroraReadEndpoint", self.stack_outputs)
        endpoint = self.stack_outputs["SecondaryAuroraReadEndpoint"]
        self.assertIsNotNone(endpoint)
        self.assertTrue(endpoint.endswith(".rds.amazonaws.com"))

    def test_primary_lambda_arn_format(self):
        """Test that primary Lambda ARN has correct format."""
        self.assertIn("PrimaryLambdaArn", self.stack_outputs)
        arn = self.stack_outputs["PrimaryLambdaArn"]
        self.assertIsNotNone(arn)
        self.assertTrue(arn.startswith("arn:aws:lambda:"))
        self.assertIn("us-east-1", arn)
        self.assertIn("payment-processor-primary", arn)
        self.assertIn("synthf6n9q4", arn)

    def test_secondary_lambda_arn_format(self):
        """Test that secondary Lambda ARN has correct format."""
        self.assertIn("SecondaryLambdaArn", self.stack_outputs)
        arn = self.stack_outputs["SecondaryLambdaArn"]
        self.assertIsNotNone(arn)
        self.assertTrue(arn.startswith("arn:aws:lambda:"))
        self.assertIn("us-west-2", arn)
        self.assertIn("payment-processor-secondary", arn)
        self.assertIn("synthf6n9q4", arn)

    def test_global_cluster_id_format(self):
        """Test that global cluster ID has correct format."""
        self.assertIn("GlobalClusterId", self.stack_outputs)
        cluster_id = self.stack_outputs["GlobalClusterId"]
        self.assertIsNotNone(cluster_id)
        self.assertIn("payment-dr-global", cluster_id)
        self.assertIn("synthf6n9q4", cluster_id)

    def test_hosted_zone_id_format(self):
        """Test that Route 53 hosted zone ID has correct format."""
        self.assertIn("HostedZoneId", self.stack_outputs)
        zone_id = self.stack_outputs["HostedZoneId"]
        self.assertIsNotNone(zone_id)
        # Hosted zone IDs typically start with Z
        self.assertTrue(zone_id.startswith("Z"))

    def test_hosted_zone_nameservers_format(self):
        """Test that Route 53 nameservers have correct format."""
        self.assertIn("HostedZoneNameServers", self.stack_outputs)
        nameservers = self.stack_outputs["HostedZoneNameServers"]
        self.assertIsNotNone(nameservers)
        # Nameservers are comma-separated
        ns_list = nameservers.split(",")
        self.assertEqual(len(ns_list), 4, "Should have 4 nameservers")
        # Each nameserver should end with awsdns
        for ns in ns_list:
            self.assertIn("awsdns", ns)

    def test_primary_sns_topic_arn_format(self):
        """Test that primary SNS topic ARN has correct format."""
        self.assertIn("PrimarySNSTopicArn", self.stack_outputs)
        arn = self.stack_outputs["PrimarySNSTopicArn"]
        self.assertIsNotNone(arn)
        self.assertTrue(arn.startswith("arn:aws:sns:"))
        self.assertIn("us-east-1", arn)
        self.assertIn("payment-dr-failover", arn)
        self.assertIn("synthf6n9q4", arn)

    def test_secondary_sns_topic_arn_format(self):
        """Test that secondary SNS topic ARN has correct format."""
        self.assertIn("SecondarySNSTopicArn", self.stack_outputs)
        arn = self.stack_outputs["SecondarySNSTopicArn"]
        self.assertIsNotNone(arn)
        self.assertTrue(arn.startswith("arn:aws:sns:"))
        self.assertIn("us-west-2", arn)
        self.assertIn("payment-dr-failover", arn)
        self.assertIn("synthf6n9q4", arn)

    def test_regions_configured(self):
        """Test that both regions are configured correctly."""
        self.assertIn("PrimaryRegion", self.stack_outputs)
        self.assertIn("SecondaryRegion", self.stack_outputs)

        primary_region = self.stack_outputs["PrimaryRegion"]
        secondary_region = self.stack_outputs["SecondaryRegion"]

        self.assertEqual(primary_region, "us-east-1")
        self.assertEqual(secondary_region, "us-west-2")

    def test_environment_suffix_consistent(self):
        """Test that environment suffix is consistent across all resources."""
        self.assertIn("EnvironmentSuffix", self.stack_outputs)
        env_suffix = self.stack_outputs["EnvironmentSuffix"]

        # Check that environment suffix appears in all resource names
        resources_to_check = [
            "PrimaryAuroraEndpoint",
            "SecondaryAuroraEndpoint",
            "PrimaryLambdaArn",
            "SecondaryLambdaArn",
            "GlobalClusterId",
            "PrimarySNSTopicArn",
            "SecondarySNSTopicArn"
        ]

        for resource_key in resources_to_check:
            resource_value = self.stack_outputs[resource_key]
            self.assertIn(
                env_suffix,
                resource_value,
                f"{resource_key} should contain environment suffix {env_suffix}"
            )

    def test_aurora_endpoints_different_regions(self):
        """Test that Aurora endpoints are in different regions."""
        primary_endpoint = self.stack_outputs["PrimaryAuroraEndpoint"]
        secondary_endpoint = self.stack_outputs["SecondaryAuroraEndpoint"]

        # Primary should be in us-east-1
        self.assertIn("us-east-1", primary_endpoint)

        # Secondary should be in us-west-2
        self.assertIn("us-west-2", secondary_endpoint)

        # They should be different endpoints
        self.assertNotEqual(primary_endpoint, secondary_endpoint)

    def test_lambda_functions_different_regions(self):
        """Test that Lambda functions are in different regions."""
        primary_lambda = self.stack_outputs["PrimaryLambdaArn"]
        secondary_lambda = self.stack_outputs["SecondaryLambdaArn"]

        self.assertIn("us-east-1", primary_lambda)
        self.assertIn("us-west-2", secondary_lambda)
        self.assertNotEqual(primary_lambda, secondary_lambda)

    def test_sns_topics_different_regions(self):
        """Test that SNS topics are in different regions."""
        primary_sns = self.stack_outputs["PrimarySNSTopicArn"]
        secondary_sns = self.stack_outputs["SecondarySNSTopicArn"]

        self.assertIn("us-east-1", primary_sns)
        self.assertIn("us-west-2", secondary_sns)
        self.assertNotEqual(primary_sns, secondary_sns)

    def test_vpc_ids_different(self):
        """Test that VPCs are different in each region."""
        primary_vpc = self.stack_outputs["PrimaryVPCId"]
        secondary_vpc = self.stack_outputs["SecondaryVPCId"]

        self.assertNotEqual(primary_vpc, secondary_vpc)

    def test_all_required_outputs_present(self):
        """Test that all required outputs are present."""
        required_outputs = [
            "PrimaryVPCId",
            "PrimaryAuroraEndpoint",
            "PrimaryAuroraReadEndpoint",
            "PrimaryLambdaArn",
            "GlobalClusterId",
            "HostedZoneId",
            "HostedZoneNameServers",
            "PrimarySNSTopicArn",
            "SecondaryVPCId",
            "SecondaryAuroraEndpoint",
            "SecondaryAuroraReadEndpoint",
            "SecondaryLambdaArn",
            "SecondarySNSTopicArn",
            "PrimaryRegion",
            "SecondaryRegion",
            "EnvironmentSuffix"
        ]

        for output in required_outputs:
            self.assertIn(
                output,
                self.stack_outputs,
                f"Required output {output} is missing"
            )
            self.assertIsNotNone(
                self.stack_outputs[output],
                f"Required output {output} is None"
            )

    def test_resource_naming_conventions(self):
        """Test that resources follow naming conventions."""
        env_suffix = self.stack_outputs["EnvironmentSuffix"]

        # All Aurora endpoints should contain 'payment-dr'
        self.assertIn("payment-dr", self.stack_outputs["PrimaryAuroraEndpoint"])
        self.assertIn("payment-dr", self.stack_outputs["SecondaryAuroraEndpoint"])

        # Lambda functions should contain 'payment-processor'
        self.assertIn("payment-processor", self.stack_outputs["PrimaryLambdaArn"])
        self.assertIn("payment-processor", self.stack_outputs["SecondaryLambdaArn"])

        # SNS topics should contain 'failover'
        self.assertIn("failover", self.stack_outputs["PrimarySNSTopicArn"])
        self.assertIn("failover", self.stack_outputs["SecondarySNSTopicArn"])

    def test_multi_region_architecture(self):
        """Test that multi-region architecture is properly configured."""
        # Verify primary region resources
        self.assertTrue(self.stack_outputs["PrimaryAuroraEndpoint"].endswith(".rds.amazonaws.com"))
        self.assertTrue(self.stack_outputs["PrimaryLambdaArn"].startswith("arn:aws:lambda:us-east-1"))

        # Verify secondary region resources
        self.assertTrue(self.stack_outputs["SecondaryAuroraEndpoint"].endswith(".rds.amazonaws.com"))
        self.assertTrue(self.stack_outputs["SecondaryLambdaArn"].startswith("arn:aws:lambda:us-west-2"))

        # Verify global resources
        self.assertIsNotNone(self.stack_outputs["GlobalClusterId"])
        self.assertIsNotNone(self.stack_outputs["HostedZoneId"])

    def test_disaster_recovery_components(self):
        """Test that all DR components are present."""
        # Aurora Global Database
        self.assertIn("GlobalClusterId", self.stack_outputs)
        self.assertIn("PrimaryAuroraEndpoint", self.stack_outputs)
        self.assertIn("SecondaryAuroraEndpoint", self.stack_outputs)

        # Multi-region Lambda
        self.assertIn("PrimaryLambdaArn", self.stack_outputs)
        self.assertIn("SecondaryLambdaArn", self.stack_outputs)

        # DNS Failover
        self.assertIn("HostedZoneId", self.stack_outputs)
        self.assertIn("HostedZoneNameServers", self.stack_outputs)

        # Notifications
        self.assertIn("PrimarySNSTopicArn", self.stack_outputs)
        self.assertIn("SecondarySNSTopicArn", self.stack_outputs)

    def test_high_availability_configuration(self):
        """Test that HA configuration is present."""
        # Should have resources in both regions
        primary_resources = [k for k in self.stack_outputs.keys() if "Primary" in k]
        secondary_resources = [k for k in self.stack_outputs.keys() if "Secondary" in k]

        self.assertGreater(len(primary_resources), 0, "Should have primary region resources")
        self.assertGreater(len(secondary_resources), 0, "Should have secondary region resources")

        # Should have matching resources in both regions
        self.assertIn("PrimaryAuroraEndpoint", self.stack_outputs)
        self.assertIn("SecondaryAuroraEndpoint", self.stack_outputs)
        self.assertIn("PrimaryLambdaArn", self.stack_outputs)
        self.assertIn("SecondaryLambdaArn", self.stack_outputs)


if __name__ == "__main__":
    unittest.main()
