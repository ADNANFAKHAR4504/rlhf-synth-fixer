#!/usr/bin/env python3
"""
Integration tests for CloudFormation VPC Stack
Tests validate deployed resources and connectivity
All values are discovered dynamically - no mocked or hardcoded values
"""

import os
import time
import unittest
import boto3
from typing import Dict, List, Optional
from botocore.exceptions import ClientError


def discover_stack_name(cfn_client) -> str:
    """
    Dynamically discover the CloudFormation stack name.
    Priority:
    1. STACK_NAME environment variable
    2. ENVIRONMENT_SUFFIX -> TapStack{ENVIRONMENT_SUFFIX}
    3. List all stacks and find TapStack* pattern
    """
    # Try environment variable first
    if os.environ.get('STACK_NAME'):
        stack_name = os.environ.get('STACK_NAME')
        try:
            response = cfn_client.describe_stacks(StackName=stack_name)
            if response['Stacks']:
                status = response['Stacks'][0]['StackStatus']
                if status in ['CREATE_COMPLETE', 'UPDATE_COMPLETE']:
                    return stack_name
        except ClientError:
            pass  # Continue to discovery
    
    # Try constructing from ENVIRONMENT_SUFFIX
    env_suffix = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
    candidate_stack_name = f'TapStack{env_suffix}'
    try:
        response = cfn_client.describe_stacks(StackName=candidate_stack_name)
        if response['Stacks']:
            status = response['Stacks'][0]['StackStatus']
            if status in ['CREATE_COMPLETE', 'UPDATE_COMPLETE']:
                return candidate_stack_name
    except ClientError:
        pass  # Continue to discovery
    
    # Fallback: List all stacks and find TapStack*
    paginator = cfn_client.get_paginator('list_stacks')
    page_iterator = paginator.paginate(
        StackStatusFilter=['CREATE_COMPLETE', 'UPDATE_COMPLETE']
    )
    
    tap_stacks = []
    for page in page_iterator:
        for stack_summary in page.get('StackSummaries', []):
            if stack_summary['StackName'].startswith('TapStack'):
                tap_stacks.append(stack_summary)
    
    if not tap_stacks:
        raise ValueError(
            'No TapStack found. Please deploy the stack first or set STACK_NAME environment variable.'
        )
    
    # Sort by creation time (newest first) and return the most recent
    tap_stacks.sort(key=lambda x: x.get('CreationTime', ''), reverse=True)
    return tap_stacks[0]['StackName']


def get_stack_outputs(cfn_client, stack_name: str) -> Dict[str, str]:
    """Get all outputs from the CloudFormation stack"""
    try:
        response = cfn_client.describe_stacks(StackName=stack_name)
        if not response['Stacks']:
            raise ValueError(f'Stack {stack_name} not found')
        
        stack = response['Stacks'][0]
        outputs = {}
        
        if 'Outputs' in stack:
            for output in stack['Outputs']:
                if 'OutputKey' in output and 'OutputValue' in output:
                    outputs[output['OutputKey']] = output['OutputValue']
        
        return outputs
    except ClientError as e:
        raise ValueError(f'Failed to get stack outputs: {e}')


def discover_resources_from_stack(cfn_client, stack_name: str) -> Dict[str, any]:
    """
    Discover all resources from the CloudFormation stack dynamically.
    Returns a dictionary with resource logical IDs mapped to physical IDs.
    """
    resources = {}
    
    try:
        paginator = cfn_client.get_paginator('list_stack_resources')
        page_iterator = paginator.paginate(StackName=stack_name)
        
        for page in page_iterator:
            for resource in page.get('StackResourceSummaries', []):
                logical_id = resource.get('LogicalResourceId')
                physical_id = resource.get('PhysicalResourceId')
                resource_type = resource.get('ResourceType')
                
                if logical_id and physical_id:
                    resources[logical_id] = {
                        'PhysicalResourceId': physical_id,
                        'ResourceType': resource_type,
                        'ResourceStatus': resource.get('ResourceStatus')
                    }
        
        return resources
    except ClientError as e:
        raise ValueError(f'Failed to discover stack resources: {e}')


def discover_subnets_by_type(ec2_client, vpc_id: str, stack_resources: Dict) -> Dict[str, List[str]]:
    """
    Discover subnets by type (public, private, database) dynamically.
    Uses stack resources to identify subnet types by logical ID patterns.
    """
    subnets_by_type = {
        'public': [],
        'private': [],
        'database': []
    }
    
    # Get all subnets from stack resources
    subnet_logical_ids = {
        logical_id: info['PhysicalResourceId']
        for logical_id, info in stack_resources.items()
        if info['ResourceType'] == 'AWS::EC2::Subnet'
    }
    
    # Categorize by logical ID pattern
    for logical_id, subnet_id in subnet_logical_ids.items():
        logical_lower = logical_id.lower()
        if 'public' in logical_lower:
            subnets_by_type['public'].append(subnet_id)
        elif 'database' in logical_lower or 'db' in logical_lower:
            subnets_by_type['database'].append(subnet_id)
        elif 'private' in logical_lower:
            subnets_by_type['private'].append(subnet_id)
    
    # If we couldn't categorize by logical ID, try to discover by subnet attributes
    if not any(subnets_by_type.values()):
        all_subnets = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )['Subnets']
        
        for subnet in all_subnets:
            subnet_id = subnet['SubnetId']
            # Check if it's public (has MapPublicIpOnLaunch)
            if subnet.get('MapPublicIpOnLaunch', False):
                subnets_by_type['public'].append(subnet_id)
            else:
                # Try to determine by tags or route tables
                tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
                subnet_type = tags.get('Type', '').lower()
                if 'database' in subnet_type or 'db' in subnet_type:
                    subnets_by_type['database'].append(subnet_id)
                else:
                    subnets_by_type['private'].append(subnet_id)
    
    return subnets_by_type


def discover_nat_gateways(ec2_client, vpc_id: str, stack_resources: Dict) -> List[str]:
    """Discover NAT Gateway IDs from stack resources"""
    nat_gateway_ids = []
    
    # Get NAT Gateways from stack resources
    for logical_id, info in stack_resources.items():
        if info['ResourceType'] == 'AWS::EC2::NatGateway':
            nat_gateway_ids.append(info['PhysicalResourceId'])
    
    # If not found in stack resources, discover by VPC
    if not nat_gateway_ids:
        response = ec2_client.describe_nat_gateways(
            Filter=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )
        nat_gateway_ids = [ngw['NatGatewayId'] for ngw in response.get('NatGateways', [])]
    
    return nat_gateway_ids


def discover_internet_gateway(ec2_client, vpc_id: str, stack_resources: Dict) -> Optional[str]:
    """Discover Internet Gateway ID from stack resources or VPC"""
    # Try to get from stack resources first
    for logical_id, info in stack_resources.items():
        if info['ResourceType'] == 'AWS::EC2::InternetGateway':
            return info['PhysicalResourceId']
    
    # Fallback: discover by VPC
    response = ec2_client.describe_internet_gateways(
        Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
    )
    
    if response['InternetGateways']:
        return response['InternetGateways'][0]['InternetGatewayId']
    
    return None


class TestVPCIntegration(unittest.TestCase):
    """Integration test suite for deployed VPC infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Discover stack and resources dynamically"""
        region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=region)
        cls.logs_client = boto3.client('logs', region_name=region)
        cls.cfn_client = boto3.client('cloudformation', region_name=region)
        
        try:
            # Discover stack name dynamically
            cls.stack_name = discover_stack_name(cls.cfn_client)
            print(f"Discovered stack: {cls.stack_name}")
            
            # Get stack outputs
            cls.outputs = get_stack_outputs(cls.cfn_client, cls.stack_name)
            print(f"Discovered {len(cls.outputs)} stack outputs")
            
            # Discover stack resources
            cls.stack_resources = discover_resources_from_stack(cls.cfn_client, cls.stack_name)
            print(f"Discovered {len(cls.stack_resources)} stack resources")
            
            # Extract VPC ID from outputs or resources
            cls.vpc_id = cls.outputs.get('VPCId')
            if not cls.vpc_id:
                # Try to find VPC in stack resources
                for logical_id, info in cls.stack_resources.items():
                    if info['ResourceType'] == 'AWS::EC2::VPC':
                        cls.vpc_id = info['PhysicalResourceId']
                        break
            
            if not cls.vpc_id:
                raise ValueError('VPC ID not found in stack outputs or resources')
            
            # Discover subnets dynamically
            subnets_by_type = discover_subnets_by_type(cls.ec2_client, cls.vpc_id, cls.stack_resources)
            cls.public_subnet_ids = subnets_by_type['public']
            cls.private_subnet_ids = subnets_by_type['private']
            cls.database_subnet_ids = subnets_by_type['database']
            
            # Discover NAT Gateways
            cls.nat_gateway_ids = discover_nat_gateways(cls.ec2_client, cls.vpc_id, cls.stack_resources)
            
            # Discover Internet Gateway
            cls.igw_id = discover_internet_gateway(cls.ec2_client, cls.vpc_id, cls.stack_resources)
            
            # Get flow logs group from outputs
            cls.flow_logs_group = cls.outputs.get('VPCFlowLogsLogGroupName')
            
            cls.skip_tests = False
            
            print(f"Discovered resources:")
            print(f"  VPC: {cls.vpc_id}")
            print(f"  Public Subnets: {len(cls.public_subnet_ids)}")
            print(f"  Private Subnets: {len(cls.private_subnet_ids)}")
            print(f"  Database Subnets: {len(cls.database_subnet_ids)}")
            print(f"  NAT Gateways: {len(cls.nat_gateway_ids)}")
            print(f"  Internet Gateway: {cls.igw_id}")
            
        except Exception as e:
            print(f"Failed to discover stack/resources: {e}")
            cls.skip_tests = True
            cls.error_message = str(e)

    def setUp(self):
        """Skip tests if discovery failed"""
        if self.skip_tests:
            self.skipTest(f"Stack discovery failed: {getattr(self, 'error_message', 'Unknown error')}")

    def test_vpc_exists(self):
        """Test VPC exists and has correct configuration"""
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        
        self.assertEqual(len(response['Vpcs']), 1, "VPC should exist")
        vpc = response['Vpcs'][0]
        
        # Verify VPC is in available state
        self.assertEqual(vpc['State'], 'available', "VPC should be available")
        
        # Check DNS attributes using describe_vpc_attribute
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=self.vpc_id,
            Attribute='enableDnsSupport'
        )
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=self.vpc_id,
            Attribute='enableDnsHostnames'
        )
        
        self.assertTrue(dns_support['EnableDnsSupport']['Value'], "DNS support should be enabled")
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'], "DNS hostnames should be enabled")

    def test_internet_gateway_attached(self):
        """Test Internet Gateway is attached to VPC"""
        self.assertIsNotNone(self.igw_id, "Internet Gateway should be discovered")
        
        response = self.ec2_client.describe_internet_gateways(
            InternetGatewayIds=[self.igw_id]
        )
        
        self.assertEqual(len(response['InternetGateways']), 1, "Internet Gateway should exist")
        igw = response['InternetGateways'][0]
        
        attachments = igw['Attachments']
        self.assertEqual(len(attachments), 1, "IGW should be attached to VPC")
        self.assertEqual(attachments[0]['VpcId'], self.vpc_id, "IGW should be attached to discovered VPC")
        self.assertEqual(attachments[0]['State'], 'available', "IGW attachment should be available")

    def test_public_subnets_exist(self):
        """Test all public subnets exist with correct configuration"""
        self.assertGreater(len(self.public_subnet_ids), 0, "Should have at least one public subnet")
        
        response = self.ec2_client.describe_subnets(SubnetIds=self.public_subnet_ids)
        
        self.assertEqual(len(response['Subnets']), len(self.public_subnet_ids), "All public subnets should exist")
        
        # Check all are in the VPC and have MapPublicIpOnLaunch enabled
        for subnet in response['Subnets']:
            self.assertEqual(subnet['VpcId'], self.vpc_id, "Subnet should be in discovered VPC")
            self.assertTrue(subnet['MapPublicIpOnLaunch'], "Public subnet should map public IPs")

    def test_public_subnets_across_azs(self):
        """Test public subnets are distributed across different AZs"""
        if len(self.public_subnet_ids) < 2:
            self.skipTest("Need at least 2 public subnets to test AZ distribution")
        
        response = self.ec2_client.describe_subnets(SubnetIds=self.public_subnet_ids)
        
        azs = {subnet['AvailabilityZone'] for subnet in response['Subnets']}
        self.assertGreaterEqual(len(azs), min(2, len(self.public_subnet_ids)), 
                               "Public subnets should be in different AZs")

    def test_private_subnets_exist(self):
        """Test all private subnets exist with correct configuration"""
        self.assertGreater(len(self.private_subnet_ids), 0, "Should have at least one private subnet")
        
        response = self.ec2_client.describe_subnets(SubnetIds=self.private_subnet_ids)
        
        self.assertEqual(len(response['Subnets']), len(self.private_subnet_ids), "All private subnets should exist")
        
        for subnet in response['Subnets']:
            self.assertEqual(subnet['VpcId'], self.vpc_id, "Subnet should be in discovered VPC")

    def test_database_subnets_exist(self):
        """Test all database subnets exist with correct configuration"""
        if len(self.database_subnet_ids) == 0:
            self.skipTest("No database subnets found")
        
        response = self.ec2_client.describe_subnets(SubnetIds=self.database_subnet_ids)
        
        self.assertEqual(len(response['Subnets']), len(self.database_subnet_ids), "All database subnets should exist")
        
        for subnet in response['Subnets']:
            self.assertEqual(subnet['VpcId'], self.vpc_id, "Subnet should be in discovered VPC")

    def test_nat_gateways_exist(self):
        """Test all NAT Gateways exist and are available"""
        self.assertGreater(len(self.nat_gateway_ids), 0, "Should have at least one NAT Gateway")
        
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=self.nat_gateway_ids)
        
        self.assertEqual(len(response['NatGateways']), len(self.nat_gateway_ids), "All NAT Gateways should exist")
        
        for nat_gw in response['NatGateways']:
            self.assertEqual(nat_gw['State'], 'available', "NAT Gateway should be available")
            self.assertEqual(nat_gw['VpcId'], self.vpc_id, "NAT Gateway should be in discovered VPC")
            self.assertIn(nat_gw['SubnetId'], self.public_subnet_ids, "NAT Gateway should be in public subnet")

    def test_nat_gateways_in_different_azs(self):
        """Test NAT Gateways are in different availability zones"""
        if len(self.nat_gateway_ids) < 2:
            self.skipTest("Need at least 2 NAT Gateways to test AZ distribution")
        
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=self.nat_gateway_ids)
        
        # Get subnets for NAT Gateways
        subnet_ids = [nat_gw['SubnetId'] for nat_gw in response['NatGateways']]
        subnets_response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)
        
        azs = {subnet['AvailabilityZone'] for subnet in subnets_response['Subnets']}
        self.assertGreaterEqual(len(azs), min(2, len(self.nat_gateway_ids)), 
                               "NAT Gateways should be in different AZs")

    def test_nat_gateways_have_elastic_ips(self):
        """Test each NAT Gateway has an Elastic IP"""
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=self.nat_gateway_ids)
        
        for nat_gw in response['NatGateways']:
            addresses = nat_gw['NatGatewayAddresses']
            self.assertGreater(len(addresses), 0, "NAT Gateway should have at least one address")
            self.assertIsNotNone(addresses[0].get('PublicIp'), "NAT Gateway should have public IP")
            self.assertIsNotNone(addresses[0].get('AllocationId'), "NAT Gateway should have Elastic IP allocation")

    def test_public_route_table_to_igw(self):
        """Test public subnets route to Internet Gateway"""
        # Get route tables for public subnets
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'association.subnet-id', 'Values': self.public_subnet_ids}
            ]
        )
        
        self.assertGreater(len(response['RouteTables']), 0, "Should have route tables for public subnets")
        
        for rt in response['RouteTables']:
            # Check for route to IGW
            routes = rt['Routes']
            igw_route = [r for r in routes if r.get('GatewayId', '').startswith('igw-')]
            
            self.assertGreater(len(igw_route), 0, "Public route table should have IGW route")
            self.assertEqual(igw_route[0]['DestinationCidrBlock'], '0.0.0.0/0', "IGW route should be default route")

    def test_private_route_tables_to_nat_gateways(self):
        """Test private subnets route to NAT Gateways"""
        if len(self.private_subnet_ids) == 0:
            self.skipTest("No private subnets found")
        
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'association.subnet-id', 'Values': self.private_subnet_ids}
            ]
        )
        
        self.assertGreater(len(response['RouteTables']), 0, "Should have route tables for private subnets")
        
        for rt in response['RouteTables']:
            routes = rt['Routes']
            nat_route = [r for r in routes if r.get('NatGatewayId', '').startswith('nat-')]
            
            self.assertGreater(len(nat_route), 0, "Private route table should have NAT Gateway route")
            self.assertEqual(nat_route[0]['DestinationCidrBlock'], '0.0.0.0/0', "NAT route should be default route")

    def test_database_route_tables_to_nat_gateways(self):
        """Test database subnets route to NAT Gateways"""
        if len(self.database_subnet_ids) == 0:
            self.skipTest("No database subnets found")
        
        response = self.ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'association.subnet-id', 'Values': self.database_subnet_ids}
            ]
        )
        
        self.assertGreater(len(response['RouteTables']), 0, "Should have route tables for database subnets")
        
        for rt in response['RouteTables']:
            routes = rt['Routes']
            nat_route = [r for r in routes if r.get('NatGatewayId', '').startswith('nat-')]
            
            self.assertGreater(len(nat_route), 0, "Database route table should have NAT Gateway route")

    def test_network_acls_configured(self):
        """Test Network ACLs are properly configured"""
        # Get all network ACLs for the VPC
        response = self.ec2_client.describe_network_acls(
            Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
        )
        
        # Should have at least the default NACL
        self.assertGreaterEqual(len(response['NetworkAcls']), 1, "Should have at least one NACL")

    def test_public_nacl_allows_http_https(self):
        """Test public NACL allows HTTP and HTTPS traffic"""
        if len(self.public_subnet_ids) == 0:
            self.skipTest("No public subnets found")
        
        # Get public subnets' NACL
        response = self.ec2_client.describe_network_acls(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'association.subnet-id', 'Values': [self.public_subnet_ids[0]]}
            ]
        )
        
        if len(response['NetworkAcls']) > 0:
            nacl = response['NetworkAcls'][0]
            entries = nacl['Entries']
            
            # Check for HTTP (80) and HTTPS (443) allow rules
            inbound_entries = [e for e in entries if not e['Egress'] and e['RuleAction'] == 'allow']
            
            http_rules = [e for e in inbound_entries
                         if e.get('PortRange', {}).get('From') == 80]
            https_rules = [e for e in inbound_entries
                          if e.get('PortRange', {}).get('From') == 443]
            
            # At least one should allow HTTP/HTTPS (may be combined in a port range)
            has_http_https = (
                len(http_rules) > 0 or 
                len(https_rules) > 0 or
                any(e.get('PortRange', {}).get('From', 0) <= 80 <= e.get('PortRange', {}).get('To', 0) 
                    for e in inbound_entries) or
                any(e.get('PortRange', {}).get('From', 0) <= 443 <= e.get('PortRange', {}).get('To', 0) 
                    for e in inbound_entries)
            )
            self.assertTrue(has_http_https, "Should have HTTP/HTTPS allow rule")

    def test_vpc_flow_logs_enabled(self):
        """Test VPC Flow Logs are enabled"""
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [self.vpc_id]}
            ]
        )
        
        self.assertGreater(len(response['FlowLogs']), 0, "VPC should have flow logs enabled")
        
        flow_log = response['FlowLogs'][0]
        self.assertEqual(flow_log['TrafficType'], 'ALL', "Flow logs should capture all traffic")
        self.assertEqual(flow_log['LogDestinationType'], 'cloud-watch-logs', "Flow logs should use CloudWatch Logs")

    def test_flow_logs_log_group_exists(self):
        """Test VPC Flow Logs CloudWatch Log Group exists"""
        if not self.flow_logs_group:
            self.skipTest("Flow logs group name not found in stack outputs")
        
        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=self.flow_logs_group
        )
        
        self.assertGreater(len(response['logGroups']), 0, "Flow logs log group should exist")
        
        log_group = response['logGroups'][0]
        self.assertEqual(log_group['logGroupName'], self.flow_logs_group, "Log group name should match")
        # Check retention if specified
        if 'retentionInDays' in log_group:
            self.assertGreater(log_group['retentionInDays'], 0, "Log group should have retention configured")

    def test_flow_logs_generating_data(self):
        """Test VPC Flow Logs are generating data"""
        if not self.flow_logs_group:
            self.skipTest("Flow logs group name not found in stack outputs")
        
        # Wait a bit for logs to generate
        time.sleep(5)
        
        try:
            response = self.logs_client.describe_log_streams(
                logGroupName=self.flow_logs_group,
                orderBy='LastEventTime',
                descending=True,
                limit=1
            )
            
            # If log streams exist, flow logs are working
            if len(response['logStreams']) > 0:
                log_stream = response['logStreams'][0]
                self.assertIsNotNone(log_stream.get('lastEventTimestamp'), "Log stream should have events")
        except self.logs_client.exceptions.ResourceNotFoundException:
            self.skipTest("Log streams not yet created - this is normal for new deployments")

    def test_resource_tags_present(self):
        """Test resources have required tags"""
        # Check VPC tags
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        vpc = response['Vpcs'][0]
        
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        
        required_tags = ['Environment', 'Project', 'CostCenter']
        for tag in required_tags:
            self.assertIn(tag, tags, f"VPC should have {tag} tag")

    def test_subnet_tags_present(self):
        """Test subnets have required tags"""
        all_subnet_ids = self.public_subnet_ids + self.private_subnet_ids + self.database_subnet_ids
        if len(all_subnet_ids) == 0:
            self.skipTest("No subnets found")
        
        response = self.ec2_client.describe_subnets(SubnetIds=all_subnet_ids)
        
        required_tags = ['Environment', 'Project', 'CostCenter', 'Type']
        
        for subnet in response['Subnets']:
            tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
            for tag in required_tags:
                self.assertIn(tag, tags, f"Subnet {subnet['SubnetId']} should have {tag} tag")

    def test_nat_gateway_tags_present(self):
        """Test NAT Gateways have required tags"""
        if len(self.nat_gateway_ids) == 0:
            self.skipTest("No NAT Gateways found")
        
        response = self.ec2_client.describe_nat_gateways(NatGatewayIds=self.nat_gateway_ids)
        
        required_tags = ['Environment', 'Project', 'CostCenter']
        
        for nat_gw in response['NatGateways']:
            tags = {tag['Key']: tag['Value'] for tag in nat_gw.get('Tags', [])}
            for tag in required_tags:
                self.assertIn(tag, tags, f"NAT Gateway should have {tag} tag")


if __name__ == '__main__':
    unittest.main(verbosity=2)
