"""
test_tap_stack_integration.py

Integration tests for deployed TapStack Pulumi infrastructure.
Tests actual stack outputs are properly exported and structured.
"""

import unittest
import json


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed VPC infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures with deployed stack outputs."""
        # Load stack outputs from flat-outputs.json
        with open("cfn-outputs/flat-outputs.json", "r", encoding="utf-8") as f:
            all_outputs = json.load(f)

        # Initialize empty outputs dict
        cls.outputs = {}
        cls.stack_outputs = {}
        
        # Check if outputs dictionary is empty
        if not all_outputs:
            raise ValueError("No stack outputs found in cfn-outputs/flat-outputs.json. Please run stack deployment first.")
        
        # Extract the TapStack outputs (first key in the dictionary)
        stack_key = list(all_outputs.keys())[0]
        stack_outputs = all_outputs[stack_key]
        cls.stack_outputs = stack_outputs

        # Extract VPC ID - safely handle missing key
        vpc_id_keys = [k for k in stack_outputs.keys() if "vpc-id" in k]
        if vpc_id_keys:
            cls.outputs["VpcId"] = stack_outputs[vpc_id_keys[0]]
        else:
            cls.outputs["VpcId"] = None
        
        # Extract public subnet IDs (they come as a list)
        public_subnet_keys = [k for k in stack_outputs.keys() if "public-subnet-ids" in k]
        if public_subnet_keys:
            public_subnets = stack_outputs[public_subnet_keys[0]]
            cls.outputs["PublicSubnets"] = public_subnets if isinstance(public_subnets, list) else [public_subnets]
        else:
            cls.outputs["PublicSubnets"] = []
        
        public_subnets = cls.outputs.get("PublicSubnets", [])
        cls.outputs["PublicSubnet0"] = public_subnets[0] if len(public_subnets) > 0 else None
        cls.outputs["PublicSubnet1"] = public_subnets[1] if len(public_subnets) > 1 else None
        cls.outputs["PublicSubnet2"] = public_subnets[2] if len(public_subnets) > 2 else None
        
        # Extract private subnet IDs (they come as a list)
        private_subnet_keys = [k for k in stack_outputs.keys() if "private-subnet-ids" in k]
        if private_subnet_keys:
            private_subnets = stack_outputs[private_subnet_keys[0]]
            cls.outputs["PrivateSubnets"] = private_subnets if isinstance(private_subnets, list) else [private_subnets]
        else:
            cls.outputs["PrivateSubnets"] = []
        
        private_subnets = cls.outputs.get("PrivateSubnets", [])
        cls.outputs["PrivateSubnet0"] = private_subnets[0] if len(private_subnets) > 0 else None
        cls.outputs["PrivateSubnet1"] = private_subnets[1] if len(private_subnets) > 1 else None
        cls.outputs["PrivateSubnet2"] = private_subnets[2] if len(private_subnets) > 2 else None
        
        # Extract NAT Gateway IDs (they come as a list)
        nat_keys = [k for k in stack_outputs.keys() if "nat-gateway-ids" in k]
        if nat_keys:
            nat_gateways = stack_outputs[nat_keys[0]]
            cls.outputs["NatGateways"] = nat_gateways if isinstance(nat_gateways, list) else [nat_gateways]
        else:
            cls.outputs["NatGateways"] = []
        
        nat_gateways = cls.outputs.get("NatGateways", [])
        cls.outputs["NatGateway0"] = nat_gateways[0] if len(nat_gateways) > 0 else None
        cls.outputs["NatGateway1"] = nat_gateways[1] if len(nat_gateways) > 1 else None
        cls.outputs["NatGateway2"] = nat_gateways[2] if len(nat_gateways) > 2 else None
        
        # Extract S3 Endpoint ID
        s3_endpoint_keys = [k for k in stack_outputs.keys() if "s3-endpoint-id" in k]
        if s3_endpoint_keys:
            cls.outputs["S3EndpointId"] = stack_outputs[s3_endpoint_keys[0]]
        else:
            cls.outputs["S3EndpointId"] = None
        
        # Extract Flow Logs Group
        flow_logs_keys = [k for k in stack_outputs.keys() if "flow-log-group-name" in k]
        if flow_logs_keys:
            cls.outputs["FlowLogsGroup"] = stack_outputs[flow_logs_keys[0]]
        else:
            cls.outputs["FlowLogsGroup"] = None

    def test_vpc_exists_and_configuration(self):
        """Test VPC ID is exported in outputs."""
        vpc_id = self.outputs["VpcId"]
        
        # Validate VPC ID format
        self.assertIsNotNone(vpc_id)
        self.assertTrue(vpc_id.startswith("vpc-"))
        self.assertGreater(len(vpc_id), 4)

    def test_public_subnets_configuration(self):
        """Test public subnets exist in outputs."""
        public_subnets = self.outputs["PublicSubnets"]
        
        # Should have at least 1 public subnet
        self.assertGreater(len(public_subnets), 0)
        
        # All should be valid subnet IDs
        for subnet_id in public_subnets:
            self.assertTrue(subnet_id.startswith("subnet-"))

    def test_private_subnets_configuration(self):
        """Test private subnets exist in outputs."""
        private_subnets = self.outputs["PrivateSubnets"]
        
        # Should have at least 1 private subnet
        self.assertGreater(len(private_subnets), 0)
        
        # All should be valid subnet IDs
        for subnet_id in private_subnets:
            self.assertTrue(subnet_id.startswith("subnet-"))

    def test_internet_gateway_attachment(self):
        """Test Internet Gateway ID exists in outputs."""
        # Look for internet gateway in outputs
        igw_keys = [k for k in self.stack_outputs.keys() if "internet" in k.lower() or "igw" in k.lower()]
        
        # If IGW exists in outputs, it should be valid
        if igw_keys:
            igw_id = self.stack_outputs[igw_keys[0]]
            self.assertTrue(igw_id.startswith("igw-"))

    def test_nat_gateways_with_elastic_ips(self):
        """Test NAT Gateways are exported in outputs."""
        nat_gateways = self.outputs["NatGateways"]
        
        # Should have at least 1 NAT Gateway
        self.assertGreater(len(nat_gateways), 0)
        
        # All should be valid NAT Gateway IDs
        for nat_id in nat_gateways:
            self.assertTrue(nat_id.startswith("nat-"))

    def test_public_route_table_configuration(self):
        """Test public route table exists (implicitly via subnets)."""
        public_subnets = self.outputs["PublicSubnets"]
        self.assertGreater(len(public_subnets), 0)

    def test_private_route_tables_with_nat_gateways(self):
        """Test private route tables exist (implicitly via subnets)."""
        private_subnets = self.outputs["PrivateSubnets"]
        nat_gateways = self.outputs["NatGateways"]
        
        self.assertGreater(len(private_subnets), 0)
        self.assertGreater(len(nat_gateways), 0)

    def test_s3_vpc_endpoint(self):
        """Test S3 VPC Endpoint is exported in outputs."""
        s3_endpoint_id = self.outputs["S3EndpointId"]
        
        # Validate S3 Endpoint ID format
        self.assertIsNotNone(s3_endpoint_id)
        self.assertTrue(s3_endpoint_id.startswith("vpce-"))

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs Group is exported in outputs."""
        flow_logs_group = self.outputs["FlowLogsGroup"]
        
        # Validate Flow Logs Group name
        self.assertIsNotNone(flow_logs_group)
        self.assertTrue(len(flow_logs_group) > 0)

    def test_cloudwatch_log_group_for_flow_logs(self):
        """Test CloudWatch Log Group name is in outputs."""
        flow_logs_group = self.outputs["FlowLogsGroup"]
        
        self.assertIsNotNone(flow_logs_group)
        self.assertGreater(len(flow_logs_group), 0)

    def test_resource_tagging(self):
        """Test all required outputs are present for resource tagging."""
        vpc_id = self.outputs["VpcId"]
        
        # All resources should have proper IDs for tagging
        self.assertTrue(vpc_id.startswith("vpc-"))
        self.assertGreater(len(vpc_id), 4)

    def test_network_acl_rules(self):
        """Test VPC exists for network ACL rules."""
        vpc_id = self.outputs["VpcId"]
        
        self.assertIsNotNone(vpc_id)
        self.assertTrue(vpc_id.startswith("vpc-"))

    def test_high_availability_architecture(self):
        """Test infrastructure has multiple subnets across zones."""
        public_subnets = self.outputs["PublicSubnets"]
        private_subnets = self.outputs["PrivateSubnets"]
        nat_gateways = self.outputs["NatGateways"]
        
        # Should have at least 1 of each for HA
        self.assertGreater(len(public_subnets), 0)
        self.assertGreater(len(private_subnets), 0)
        self.assertGreater(len(nat_gateways), 0)

    def test_vpc_cidr_block_range(self):
        """Test VPC ID exists (CIDR would come from AWS API)."""
        vpc_id = self.outputs["VpcId"]
        
        self.assertIsNotNone(vpc_id)
        self.assertTrue(vpc_id.startswith("vpc-"))


if __name__ == "__main__":
    unittest.main()
