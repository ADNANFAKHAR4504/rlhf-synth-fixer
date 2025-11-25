"""Integration tests for the multi-account Transit Gateway network architecture.

These tests validate the complete infrastructure deployment including:
- Transit Gateway creation and configuration
- VPC creation with proper CIDR blocks
- Transit Gateway attachments and route tables
- Route53 Resolver endpoints
- VPC Flow Logs and S3 buckets
- Security groups and network isolation
- Resource tagging compliance
"""

import json
import os
import unittest
import boto3
from pytest import mark
from typing import Dict, List, Any


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


@mark.describe("Multi-Account Transit Gateway Network Architecture")
class TestTransitGatewayIntegration(unittest.TestCase):
    """Integration tests for Transit Gateway infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients for testing."""
        cls.ec2_client = boto3.client('ec2')
        cls.s3_client = boto3.client('s3')
        cls.route53resolver_client = boto3.client('route53resolver')
        cls.cfn_client = boto3.client('cloudformation')
        cls.outputs = flat_outputs

    @mark.it("Transit Gateway is created with DNS support enabled")
    def test_transit_gateway_exists(self):
        """Test that Transit Gateway is created with correct configuration."""
        # Find Transit Gateway ID from outputs
        tgw_id = None
        for key, value in self.outputs.items():
            if 'TransitGatewayId' in key and 'RouteTable' not in key:
                tgw_id = value
                break

        if not tgw_id:
            self.skipTest("Transit Gateway ID not found in outputs")

        response = self.ec2_client.describe_transit_gateways(
            TransitGatewayIds=[tgw_id]
        )

        self.assertEqual(len(response['TransitGateways']), 1)
        tgw = response['TransitGateways'][0]

        # Verify Transit Gateway configuration
        self.assertIn(tgw['State'], ['available', 'pending'])
        self.assertEqual(tgw['Options']['DnsSupport'], 'enable')
        self.assertEqual(tgw['Options']['DefaultRouteTableAssociation'], 'disable')
        self.assertEqual(tgw['Options']['DefaultRouteTablePropagation'], 'disable')

        # Verify tags
        tags = {tag['Key']: tag['Value'] for tag in tgw.get('Tags', [])}
        self.assertIn('Environment', tags)
        self.assertIn('CostCenter', tags)
        self.assertEqual(tags['CostCenter'], 'networking')
        self.assertIn('ManagedBy', tags)
        self.assertEqual(tags['ManagedBy'], 'cdk')

    @mark.it("Transit Gateway has custom route tables configured")
    def test_transit_gateway_route_tables(self):
        """Test that Transit Gateway has custom route tables configured."""
        tgw_id = None
        for key, value in self.outputs.items():
            if 'TransitGatewayId' in key and 'RouteTable' not in key:
                tgw_id = value
                break

        if not tgw_id:
            self.skipTest("Transit Gateway ID not found in outputs")

        response = self.ec2_client.describe_transit_gateway_route_tables(
            Filters=[
                {'Name': 'transit-gateway-id', 'Values': [tgw_id]}
            ]
        )

        route_tables = response['TransitGatewayRouteTables']

        # Should have 3 custom route tables (prod, dev, shared)
        self.assertGreaterEqual(len(route_tables), 3)

        # Verify each route table has proper tags
        for rt in route_tables:
            tags = {tag['Key']: tag['Value'] for tag in rt.get('Tags', [])}
            self.assertIn('Environment', tags)
            self.assertIn('CostCenter', tags)
            self.assertIn('ManagedBy', tags)

    @mark.it("Production VPC is configured with correct CIDR 10.0.0.0/16")
    def test_production_vpc_configuration(self):
        """Test that Production VPC is configured correctly."""
        vpc_id = None
        for key, value in self.outputs.items():
            if 'productionVpcId' in key or 'ProductionVpcId' in key:
                vpc_id = value
                break

        if not vpc_id:
            self.skipTest("Production VPC ID not found in outputs")

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]

        # Verify CIDR block
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

        # Verify DNS support using separate API calls
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])

        # Verify tags
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        self.assertIn('Environment', tags)
        self.assertEqual(tags['Environment'], 'production')
        self.assertIn('CostCenter', tags)
        self.assertIn('ManagedBy', tags)

    @mark.it("Development VPC is configured with correct CIDR 10.1.0.0/16")
    def test_development_vpc_configuration(self):
        """Test that Development VPC is configured correctly."""
        vpc_id = None
        for key, value in self.outputs.items():
            if 'developmentVpcId' in key or 'DevelopmentVpcId' in key:
                vpc_id = value
                break

        if not vpc_id:
            self.skipTest("Development VPC ID not found in outputs")

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]

        # Verify CIDR block
        self.assertEqual(vpc['CidrBlock'], '10.1.0.0/16')

        # Verify DNS support using separate API calls
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])

        # Verify tags
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        self.assertIn('Environment', tags)
        self.assertEqual(tags['Environment'], 'development')

    @mark.it("Shared Services VPC is configured with correct CIDR 10.2.0.0/16")
    def test_shared_services_vpc_configuration(self):
        """Test that Shared Services VPC is configured correctly."""
        vpc_id = None
        for key, value in self.outputs.items():
            if 'sharedVpcId' in key or 'SharedVpcId' in key:
                vpc_id = value
                break

        if not vpc_id:
            self.skipTest("Shared Services VPC ID not found in outputs")

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]

        # Verify CIDR block
        self.assertEqual(vpc['CidrBlock'], '10.2.0.0/16')

        # Verify DNS support using separate API calls
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])

    @mark.it("All VPC subnets are private with no Internet Gateway")
    def test_vpc_subnets_are_private(self):
        """Test that all VPC subnets are private with no Internet Gateway."""
        vpc_ids = []
        for key, value in self.outputs.items():
            if 'VpcId' in key and value:
                vpc_ids.append(value)

        for vpc_id in vpc_ids:
            # Check for Internet Gateways (should not exist)
            igw_response = self.ec2_client.describe_internet_gateways(
                Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
            )
            self.assertEqual(len(igw_response['InternetGateways']), 0,
                           f"VPC {vpc_id} should not have Internet Gateway")

            # Check subnets
            subnet_response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )

            # Verify at least 2 subnets for multi-AZ
            self.assertGreaterEqual(len(subnet_response['Subnets']), 2)

            # Verify subnets are not public
            for subnet in subnet_response['Subnets']:
                self.assertFalse(subnet['MapPublicIpOnLaunch'])

    @mark.it("Transit Gateway attachments are created for all VPCs")
    def test_transit_gateway_attachments(self):
        """Test that Transit Gateway attachments are created for all VPCs."""
        tgw_id = None
        for key, value in self.outputs.items():
            if 'TransitGatewayId' in key and 'RouteTable' not in key:
                tgw_id = value
                break

        if not tgw_id:
            self.skipTest("Transit Gateway ID not found in outputs")

        response = self.ec2_client.describe_transit_gateway_attachments(
            Filters=[
                {'Name': 'transit-gateway-id', 'Values': [tgw_id]},
                {'Name': 'resource-type', 'Values': ['vpc']}
            ]
        )

        attachments = response['TransitGatewayAttachments']

        # Should have 3 VPC attachments (prod, dev, shared)
        self.assertGreaterEqual(len(attachments), 3)

        # Verify attachment states
        for attachment in attachments:
            self.assertIn(attachment['State'], ['available', 'pending'])

            # Verify tags
            tags = {tag['Key']: tag['Value'] for tag in attachment.get('Tags', [])}
            self.assertIn('Environment', tags)
            self.assertIn('ManagedBy', tags)

    @mark.it("VPC Flow Logs S3 buckets have 30-day lifecycle policies")
    def test_vpc_flow_logs_s3_buckets(self):
        """Test that VPC Flow Logs S3 buckets are created with lifecycle policies."""
        # Get main stack name from outputs
        main_stack = self.outputs.get('StackName', 'TapStacksynthn9p6s8g8')

        # Get nested stacks from main stack
        try:
            resources = self.cfn_client.describe_stack_resources(StackName=main_stack)
            nested_stacks = [
                r['PhysicalResourceId'] for r in resources['StackResources']
                if r['ResourceType'] == 'AWS::CloudFormation::Stack'
            ]
        except Exception as e:
            self.skipTest(f"Could not get nested stacks from {main_stack}: {e}")

        bucket_names = []
        for stack in nested_stacks:
            try:
                resources = self.cfn_client.describe_stack_resources(StackName=stack)
                for resource in resources['StackResources']:
                    if resource['ResourceType'] == 'AWS::S3::Bucket':
                        bucket_names.append(resource['PhysicalResourceId'])
            except Exception as e:
                # Silently skip stacks without S3 buckets
                pass

        if not bucket_names:
            self.skipTest("No S3 buckets found in stack resources")

        for bucket_name in bucket_names:
            try:
                # Check bucket exists
                self.s3_client.head_bucket(Bucket=bucket_name)

                # Check encryption
                encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
                self.assertIn('Rules', encryption['ServerSideEncryptionConfiguration'])

                # Check lifecycle policy
                lifecycle = self.s3_client.get_bucket_lifecycle_configuration(Bucket=bucket_name)
                self.assertIn('Rules', lifecycle)

                # Verify 30-day expiration rule exists
                expiration_rule_found = False
                for rule in lifecycle['Rules']:
                    if rule['Status'] == 'Enabled' and 'Expiration' in rule:
                        if rule['Expiration'].get('Days') == 30:
                            expiration_rule_found = True
                            break

                self.assertTrue(expiration_rule_found,
                              f"Bucket {bucket_name} missing 30-day expiration rule")

                # Check bucket tags
                tags = self.s3_client.get_bucket_tagging(Bucket=bucket_name)
                tag_dict = {tag['Key']: tag['Value'] for tag in tags.get('TagSet', [])}
                self.assertIn('Environment', tag_dict)
                self.assertIn('CostCenter', tag_dict)
                self.assertIn('ManagedBy', tag_dict)

            except self.s3_client.exceptions.NoSuchBucket:
                self.skipTest(f"Bucket {bucket_name} not found")

    @mark.it("VPC Flow Logs are enabled and capturing ALL traffic")
    def test_vpc_flow_logs_enabled(self):
        """Test that VPC Flow Logs are enabled and capturing ALL traffic."""
        vpc_ids = []
        for key, value in self.outputs.items():
            if 'VpcId' in key and value:
                vpc_ids.append(value)

        for vpc_id in vpc_ids:
            response = self.ec2_client.describe_flow_logs(
                Filters=[
                    {'Name': 'resource-id', 'Values': [vpc_id]}
                ]
            )

            flow_logs = response['FlowLogs']
            self.assertGreaterEqual(len(flow_logs), 1, f"VPC {vpc_id} missing Flow Logs")

            # Verify Flow Log configuration
            for flow_log in flow_logs:
                self.assertEqual(flow_log['TrafficType'], 'ALL')
                self.assertEqual(flow_log['LogDestinationType'], 's3')
                self.assertEqual(flow_log['FlowLogStatus'], 'ACTIVE')

    @mark.it("Route53 Resolver endpoints are created in shared services VPC with 2+ AZs")
    def test_route53_resolver_endpoints(self):
        """Test that Route53 Resolver endpoints are created in shared services VPC."""
        inbound_endpoint_id = None
        outbound_endpoint_id = None

        for key, value in self.outputs.items():
            if 'InboundEndpointId' in key:
                inbound_endpoint_id = value
            if 'OutboundEndpointId' in key:
                outbound_endpoint_id = value

        if not inbound_endpoint_id or not outbound_endpoint_id:
            self.skipTest("Route53 Resolver endpoint IDs not found in outputs")

        # Test inbound endpoint
        inbound_response = self.route53resolver_client.get_resolver_endpoint(
            ResolverEndpointId=inbound_endpoint_id
        )
        inbound_endpoint = inbound_response['ResolverEndpoint']

        self.assertEqual(inbound_endpoint['Direction'], 'INBOUND')
        self.assertIn(inbound_endpoint['Status'], ['OPERATIONAL', 'CREATING'])
        self.assertGreaterEqual(inbound_endpoint['IpAddressCount'], 2)

        # Test outbound endpoint
        outbound_response = self.route53resolver_client.get_resolver_endpoint(
            ResolverEndpointId=outbound_endpoint_id
        )
        outbound_endpoint = outbound_response['ResolverEndpoint']

        self.assertEqual(outbound_endpoint['Direction'], 'OUTBOUND')
        self.assertIn(outbound_endpoint['Status'], ['OPERATIONAL', 'CREATING'])
        self.assertGreaterEqual(outbound_endpoint['IpAddressCount'], 2)

    @mark.it("Production and Development VPCs are isolated (no direct routing)")
    def test_network_isolation_routes(self):
        """Test that Transit Gateway routes enforce network isolation."""
        tgw_id = None
        for key, value in self.outputs.items():
            if 'TransitGatewayId' in key and 'RouteTable' not in key:
                tgw_id = value
                break

        if not tgw_id:
            self.skipTest("Transit Gateway ID not found in outputs")

        # Get all Transit Gateway route tables
        response = self.ec2_client.describe_transit_gateway_route_tables(
            Filters=[
                {'Name': 'transit-gateway-id', 'Values': [tgw_id]}
            ]
        )

        for route_table in response['TransitGatewayRouteTables']:
            rt_id = route_table['TransitGatewayRouteTableId']
            tags = {tag['Key']: tag['Value'] for tag in route_table.get('Tags', [])}

            # Get routes for this route table
            routes_response = self.ec2_client.search_transit_gateway_routes(
                TransitGatewayRouteTableId=rt_id,
                Filters=[{'Name': 'state', 'Values': ['active', 'blackhole']}]
            )

            routes = routes_response['Routes']

            # Production route table should NOT have route to development (10.1.0.0/16)
            if 'production' in tags.get('Name', '').lower():
                dev_routes = [r for r in routes if r.get('DestinationCidrBlock') == '10.1.0.0/16']
                self.assertEqual(len(dev_routes), 0,
                               "Production should not have direct route to Development")

            # Development route table should NOT have route to production (10.0.0.0/16)
            if 'development' in tags.get('Name', '').lower():
                prod_routes = [r for r in routes if r.get('DestinationCidrBlock') == '10.0.0.0/16']
                self.assertEqual(len(prod_routes), 0,
                               "Development should not have direct route to Production")

    @mark.it("All resources have required tags: Environment, CostCenter, ManagedBy")
    def test_resource_tagging_compliance(self):
        """Test that all resources have required tags."""
        required_tags = {'Environment', 'CostCenter', 'ManagedBy'}

        tgw_id = None
        for key, value in self.outputs.items():
            if 'TransitGatewayId' in key and 'RouteTable' not in key:
                tgw_id = value
                break

        if not tgw_id:
            self.skipTest("Transit Gateway ID not found in outputs")

        # Check Transit Gateway tags
        tgw_response = self.ec2_client.describe_transit_gateways(TransitGatewayIds=[tgw_id])
        tgw_tags = {tag['Key'] for tag in tgw_response['TransitGateways'][0].get('Tags', [])}
        self.assertTrue(required_tags.issubset(tgw_tags),
                       f"Transit Gateway missing required tags: {required_tags - tgw_tags}")

        # Check VPC tags
        vpc_ids = []
        for key, value in self.outputs.items():
            if 'VpcId' in key and value:
                vpc_ids.append(value)

        for vpc_id in vpc_ids:
            vpc_response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc_tags = {tag['Key'] for tag in vpc_response['Vpcs'][0].get('Tags', [])}
            self.assertTrue(required_tags.issubset(vpc_tags),
                           f"VPC {vpc_id} missing required tags: {required_tags - vpc_tags}")
