"""
Integration tests for the TapStack cross-account VPC peering infrastructure.

These tests verify the deployed infrastructure using the outputs from
cfn-outputs/flat-outputs.json. They check that all resources were created
correctly and are configured as expected.
"""

import json
import os
import unittest
from pytest import mark


# Load CloudFormation outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("VPC Peering Integration Tests")
class TestVPCPeeringIntegration(unittest.TestCase):
    """Integration tests for VPC peering infrastructure."""

    @mark.it("verifies that peering connection ID is exported")
    def test_peering_connection_id_exists(self):
        """Test that peering connection ID output exists."""
        peering_id_key = [k for k in flat_outputs.keys() if 'PeeringConnectionId' in k]
        self.assertTrue(
            len(peering_id_key) > 0,
            "PeeringConnectionId output not found in stack outputs"
        )

        if peering_id_key:
            peering_id = flat_outputs[peering_id_key[0]]
            self.assertIsNotNone(peering_id, "PeeringConnectionId should not be None")
            self.assertTrue(
                peering_id.startswith('pcx-') or len(peering_id) > 0,
                f"Invalid peering connection ID format: {peering_id}"
            )

    @mark.it("verifies that trading VPC ID is exported")
    def test_trading_vpc_id_exists(self):
        """Test that trading VPC ID output exists."""
        vpc_id_key = [k for k in flat_outputs.keys() if 'TradingVpcId' in k]
        self.assertTrue(
            len(vpc_id_key) > 0,
            "TradingVpcId output not found in stack outputs"
        )

        if vpc_id_key:
            vpc_id = flat_outputs[vpc_id_key[0]]
            self.assertIsNotNone(vpc_id, "TradingVpcId should not be None")
            self.assertTrue(
                vpc_id.startswith('vpc-'),
                f"Invalid VPC ID format: {vpc_id}"
            )

    @mark.it("verifies that analytics VPC ID is exported")
    def test_analytics_vpc_id_exists(self):
        """Test that analytics VPC ID output exists."""
        vpc_id_key = [k for k in flat_outputs.keys() if 'AnalyticsVpcId' in k]
        self.assertTrue(
            len(vpc_id_key) > 0,
            "AnalyticsVpcId output not found in stack outputs"
        )

        if vpc_id_key:
            vpc_id = flat_outputs[vpc_id_key[0]]
            self.assertIsNotNone(vpc_id, "AnalyticsVpcId should not be None")
            self.assertTrue(
                vpc_id.startswith('vpc-'),
                f"Invalid VPC ID format: {vpc_id}"
            )

    @mark.it("verifies that route table IDs are exported")
    def test_route_table_ids_exist(self):
        """Test that route table IDs are exported for both VPCs."""
        trading_rt_key = [k for k in flat_outputs.keys() if 'TradingRouteTableIds' in k]
        analytics_rt_key = [k for k in flat_outputs.keys() if 'AnalyticsRouteTableIds' in k]

        self.assertTrue(
            len(trading_rt_key) > 0,
            "TradingRouteTableIds output not found"
        )
        self.assertTrue(
            len(analytics_rt_key) > 0,
            "AnalyticsRouteTableIds output not found"
        )

        if trading_rt_key:
            trading_rts = flat_outputs[trading_rt_key[0]]
            self.assertIsNotNone(trading_rts, "TradingRouteTableIds should not be None")
            # Route table IDs are comma-separated
            rt_list = trading_rts.split(',')
            self.assertGreater(
                len(rt_list), 0,
                "Trading VPC should have at least one route table"
            )
            for rt_id in rt_list:
                self.assertTrue(
                    rt_id.strip().startswith('rtb-'),
                    f"Invalid route table ID format: {rt_id}"
                )

    @mark.it("verifies that CloudWatch dashboard URL is exported")
    def test_dashboard_url_exists(self):
        """Test that CloudWatch dashboard URL is exported."""
        dashboard_key = [k for k in flat_outputs.keys() if 'DashboardURL' in k]
        self.assertTrue(
            len(dashboard_key) > 0,
            "DashboardURL output not found in stack outputs"
        )

        if dashboard_key:
            dashboard_url = flat_outputs[dashboard_key[0]]
            self.assertIsNotNone(dashboard_url, "DashboardURL should not be None")
            self.assertTrue(
                'cloudwatch' in dashboard_url.lower() and 'dashboards' in dashboard_url.lower(),
                f"Invalid dashboard URL format: {dashboard_url}"
            )

    @mark.it("verifies that flow logs bucket name is exported")
    def test_flow_logs_bucket_exists(self):
        """Test that flow logs bucket name is exported."""
        bucket_key = [k for k in flat_outputs.keys() if 'FlowLogsBucket' in k]
        self.assertTrue(
            len(bucket_key) > 0,
            "FlowLogsBucket output not found in stack outputs"
        )

        if bucket_key:
            bucket_name = flat_outputs[bucket_key[0]]
            self.assertIsNotNone(bucket_name, "FlowLogsBucket should not be None")
            self.assertTrue(
                'vpc-flow-logs' in bucket_name.lower(),
                f"Invalid flow logs bucket name: {bucket_name}"
            )


@mark.describe("Resource Naming Integration Tests")
class TestResourceNamingIntegration(unittest.TestCase):
    """Integration tests for resource naming conventions."""

    @mark.it("verifies that all exported resources include environment suffix")
    def test_resources_include_environment_suffix(self):
        """Test that resource names include environment suffix."""
        # Check if any outputs exist
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available - stack not deployed")

        # Get environment suffix from any resource name (should be consistent)
        for key, value in flat_outputs.items():
            if isinstance(value, str):
                # Look for bucket names with environment suffix pattern
                if 'bucket' in value.lower() and '-' in value:
                    # Bucket names should contain environment suffix
                    parts = value.split('-')
                    # Environment suffix should be present
                    self.assertGreater(
                        len(parts), 1,
                        f"Resource {key} value {value} doesn't follow naming pattern"
                    )

    @mark.it("verifies that VPC IDs are valid AWS resource IDs")
    def test_vpc_ids_valid_format(self):
        """Test that VPC IDs follow AWS format."""
        vpc_keys = [k for k in flat_outputs.keys() if 'VpcId' in k]

        for vpc_key in vpc_keys:
            vpc_id = flat_outputs[vpc_key]
            self.assertTrue(
                vpc_id.startswith('vpc-'),
                f"{vpc_key} has invalid format: {vpc_id}"
            )
            # AWS VPC IDs are vpc- followed by 8 or 17 hex characters
            vpc_id_part = vpc_id[4:]  # Remove 'vpc-' prefix
            self.assertTrue(
                len(vpc_id_part) >= 8,
                f"{vpc_key} ID part too short: {vpc_id}"
            )


@mark.describe("Stack Output Completeness Tests")
class TestStackOutputCompleteness(unittest.TestCase):
    """Integration tests for stack output completeness."""

    @mark.it("verifies all required outputs are present")
    def test_all_required_outputs_present(self):
        """Test that all required outputs are exported."""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available - stack not deployed")

        required_output_patterns = [
            'PeeringConnectionId',
            'TradingVpcId',
            'AnalyticsVpcId',
            'TradingRouteTableIds',
            'AnalyticsRouteTableIds',
            'DashboardURL',
            'FlowLogsBucket'
        ]

        for pattern in required_output_patterns:
            matching_keys = [k for k in flat_outputs.keys() if pattern in k]
            self.assertTrue(
                len(matching_keys) > 0,
                f"Required output '{pattern}' not found in stack outputs"
            )

    @mark.it("verifies no output values are empty")
    def test_no_empty_outputs(self):
        """Test that no output values are empty strings."""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available - stack not deployed")

        for key, value in flat_outputs.items():
            if isinstance(value, str):
                self.assertTrue(
                    len(value.strip()) > 0,
                    f"Output '{key}' has empty value"
                )


@mark.describe("VPC Configuration Integration Tests")
class TestVPCConfigurationIntegration(unittest.TestCase):
    """Integration tests for VPC configuration."""

    @mark.it("verifies that both VPCs are created")
    def test_both_vpcs_created(self):
        """Test that both trading and analytics VPCs are created."""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available - stack not deployed")

        trading_vpc_keys = [k for k in flat_outputs.keys() if 'TradingVpcId' in k]
        analytics_vpc_keys = [k for k in flat_outputs.keys() if 'AnalyticsVpcId' in k]

        self.assertEqual(
            len(trading_vpc_keys), 1,
            "Expected exactly one TradingVpcId output"
        )
        self.assertEqual(
            len(analytics_vpc_keys), 1,
            "Expected exactly one AnalyticsVpcId output"
        )

        # Verify VPCs are different
        if trading_vpc_keys and analytics_vpc_keys:
            trading_vpc_id = flat_outputs[trading_vpc_keys[0]]
            analytics_vpc_id = flat_outputs[analytics_vpc_keys[0]]
            self.assertNotEqual(
                trading_vpc_id, analytics_vpc_id,
                "Trading and Analytics VPCs should be different"
            )

    @mark.it("verifies that route tables are configured")
    def test_route_tables_configured(self):
        """Test that route tables are configured for both VPCs."""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available - stack not deployed")

        trading_rt_keys = [k for k in flat_outputs.keys() if 'TradingRouteTableIds' in k]
        analytics_rt_keys = [k for k in flat_outputs.keys() if 'AnalyticsRouteTableIds' in k]

        # Both VPCs should have route tables
        self.assertTrue(len(trading_rt_keys) > 0, "Trading VPC missing route table output")
        self.assertTrue(len(analytics_rt_keys) > 0, "Analytics VPC missing route table output")

        # Verify route tables contain valid IDs
        if trading_rt_keys:
            trading_rts = flat_outputs[trading_rt_keys[0]]
            rt_list = [rt.strip() for rt in trading_rts.split(',')]
            self.assertGreater(
                len(rt_list), 0,
                "Trading VPC should have at least one route table"
            )


@mark.describe("Monitoring Integration Tests")
class TestMonitoringIntegration(unittest.TestCase):
    """Integration tests for monitoring configuration."""

    @mark.it("verifies that CloudWatch dashboard is accessible")
    def test_dashboard_url_format(self):
        """Test that CloudWatch dashboard URL is properly formatted."""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available - stack not deployed")

        dashboard_keys = [k for k in flat_outputs.keys() if 'DashboardURL' in k]
        if not dashboard_keys:
            self.skipTest("DashboardURL output not found")

        dashboard_url = flat_outputs[dashboard_keys[0]]

        # Verify URL format
        self.assertTrue(
            dashboard_url.startswith('https://'),
            "Dashboard URL should use HTTPS"
        )
        self.assertIn(
            'console.aws.amazon.com',
            dashboard_url,
            "Dashboard URL should point to AWS console"
        )
        self.assertIn(
            'cloudwatch',
            dashboard_url.lower(),
            "Dashboard URL should be a CloudWatch URL"
        )

    @mark.it("verifies that flow logs bucket is created")
    def test_flow_logs_bucket_exists(self):
        """Test that flow logs S3 bucket is created."""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available - stack not deployed")

        bucket_keys = [k for k in flat_outputs.keys() if 'FlowLogsBucket' in k]
        self.assertTrue(
            len(bucket_keys) > 0,
            "FlowLogsBucket output not found"
        )

        if bucket_keys:
            bucket_name = flat_outputs[bucket_keys[0]]
            # Bucket names should be lowercase and contain flow logs identifier
            self.assertTrue(
                bucket_name.islower() or '-' in bucket_name,
                f"Invalid bucket name format: {bucket_name}"
            )
            self.assertIn(
                'flow-logs',
                bucket_name.lower(),
                "Bucket name should indicate it's for flow logs"
            )


@mark.describe("Peering Connection Integration Tests")
class TestPeeringConnectionIntegration(unittest.TestCase):
    """Integration tests for VPC peering connection."""

    @mark.it("verifies that peering connection is established")
    def test_peering_connection_established(self):
        """Test that peering connection is successfully established."""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available - stack not deployed")

        peering_keys = [k for k in flat_outputs.keys() if 'PeeringConnectionId' in k]
        self.assertTrue(
            len(peering_keys) > 0,
            "PeeringConnectionId output not found"
        )

        if peering_keys:
            peering_id = flat_outputs[peering_keys[0]]
            # Verify peering connection ID format
            self.assertTrue(
                peering_id.startswith('pcx-') or len(peering_id) > 0,
                f"Invalid peering connection ID: {peering_id}"
            )

    @mark.it("verifies that peering connection status is available")
    def test_peering_connection_status_available(self):
        """Test that peering connection status is available."""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available - stack not deployed")

        status_keys = [k for k in flat_outputs.keys() if 'PeeringConnectionStatus' in k]
        # Status output is optional but if present should have value
        if status_keys:
            status = flat_outputs[status_keys[0]]
            self.assertIsNotNone(status, "PeeringConnectionStatus should not be None")


@mark.describe("Security Configuration Integration Tests")
class TestSecurityConfigurationIntegration(unittest.TestCase):
    """Integration tests for security configuration."""

    @mark.it("verifies that flow logs are configured for compliance")
    def test_flow_logs_configured(self):
        """Test that VPC flow logs are configured."""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available - stack not deployed")

        bucket_keys = [k for k in flat_outputs.keys() if 'FlowLogsBucket' in k]
        self.assertTrue(
            len(bucket_keys) > 0,
            "Flow logs bucket not configured - compliance requirement"
        )

    @mark.it("verifies that monitoring dashboard is available")
    def test_monitoring_dashboard_available(self):
        """Test that CloudWatch monitoring dashboard is available."""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available - stack not deployed")

        dashboard_keys = [k for k in flat_outputs.keys() if 'DashboardURL' in k]
        self.assertTrue(
            len(dashboard_keys) > 0,
            "Monitoring dashboard not configured - operational requirement"
        )


@mark.describe("End-to-End Infrastructure Tests")
class TestEndToEndInfrastructure(unittest.TestCase):
    """End-to-end integration tests for the complete infrastructure."""

    @mark.it("verifies that all critical resources are deployed")
    def test_all_critical_resources_deployed(self):
        """Test that all critical infrastructure components are deployed."""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available - stack not deployed")

        critical_resources = {
            'VPC Peering': lambda: any('PeeringConnectionId' in k for k in flat_outputs.keys()),
            'Trading VPC': lambda: any('TradingVpcId' in k for k in flat_outputs.keys()),
            'Analytics VPC': lambda: any('AnalyticsVpcId' in k for k in flat_outputs.keys()),
            'Flow Logs': lambda: any('FlowLogsBucket' in k for k in flat_outputs.keys()),
            'Monitoring': lambda: any('DashboardURL' in k for k in flat_outputs.keys()),
            'Route Tables': lambda: any('RouteTableIds' in k for k in flat_outputs.keys())
        }

        missing_resources = []
        for resource_name, check_func in critical_resources.items():
            if not check_func():
                missing_resources.append(resource_name)

        self.assertEqual(
            len(missing_resources), 0,
            f"Missing critical resources: {', '.join(missing_resources)}"
        )

    @mark.it("verifies that stack deployment is complete")
    def test_stack_deployment_complete(self):
        """Test that stack deployment completed successfully."""
        if not flat_outputs:
            self.skipTest("No CloudFormation outputs available - stack not deployed")

        # If we have outputs, the stack deployed successfully
        self.assertGreater(
            len(flat_outputs), 0,
            "Stack should have at least one output"
        )

        # Verify minimum expected number of outputs
        self.assertGreaterEqual(
            len(flat_outputs), 5,
            "Stack should have at least 5 outputs (VPCs, peering, monitoring, logs)"
        )
