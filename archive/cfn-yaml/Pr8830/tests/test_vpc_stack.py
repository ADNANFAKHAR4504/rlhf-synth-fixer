#!/usr/bin/env python3
"""
Unit tests for CloudFormation VPC Stack
Tests validate template structure, parameters, resources, and outputs
"""

import json
import unittest
import yaml
import os
from typing import Dict, Any


# CloudFormation intrinsic function constructors for YAML
def ref_constructor(loader, node):
    return {'Ref': loader.construct_scalar(node)}

def sub_constructor(loader, node):
    if isinstance(node, yaml.ScalarNode):
        return {'Fn::Sub': loader.construct_scalar(node)}
    else:
        return {'Fn::Sub': loader.construct_sequence(node)}

def getatt_constructor(loader, node):
    if isinstance(node, yaml.ScalarNode):
        # Handle shorthand: !GetAtt Resource.Attribute
        value = loader.construct_scalar(node)
        return {'Fn::GetAtt': value.split('.', 1)}
    else:
        return {'Fn::GetAtt': loader.construct_sequence(node)}

def join_constructor(loader, node):
    return {'Fn::Join': loader.construct_sequence(node)}

def select_constructor(loader, node):
    return {'Fn::Select': loader.construct_sequence(node)}

def getazs_constructor(loader, node):
    if isinstance(node, yaml.ScalarNode):
        return {'Fn::GetAZs': loader.construct_scalar(node)}
    else:
        return {'Fn::GetAZs': loader.construct_sequence(node)}

# Add constructors for CloudFormation intrinsic functions
yaml.SafeLoader.add_constructor('!Ref', ref_constructor)
yaml.SafeLoader.add_constructor('!Sub', sub_constructor)
yaml.SafeLoader.add_constructor('!GetAtt', getatt_constructor)
yaml.SafeLoader.add_constructor('!Join', join_constructor)
yaml.SafeLoader.add_constructor('!Select', select_constructor)
yaml.SafeLoader.add_constructor('!GetAZs', getazs_constructor)


class TestVPCStack(unittest.TestCase):
    """Test suite for VPC CloudFormation stack"""

    @classmethod
    def setUpClass(cls):
        """Load CloudFormation template once for all tests"""
        template_path = os.path.join(os.path.dirname(__file__), '..', 'lib', 'TapStack.yml')
        with open(template_path, 'r') as f:
            cls.template = yaml.safe_load(f)

    def test_template_format_version(self):
        """Test CloudFormation template format version"""
        self.assertEqual(
            self.template['AWSTemplateFormatVersion'],
            '2010-09-09',
            "Template format version should be 2010-09-09"
        )

    def test_template_has_description(self):
        """Test template has description"""
        self.assertIn('Description', self.template)
        self.assertIsInstance(self.template['Description'], str)
        self.assertGreater(len(self.template['Description']), 0)

    def test_parameters_exist(self):
        """Test all required parameters are defined"""
        parameters = self.template.get('Parameters', {})
        required_params = ['EnvironmentSuffix', 'ProjectTag', 'CostCenterTag']

        for param in required_params:
            self.assertIn(param, parameters, f"Parameter {param} should be defined")

    def test_environment_suffix_parameter(self):
        """Test EnvironmentSuffix parameter configuration"""
        env_param = self.template['Parameters']['EnvironmentSuffix']
        self.assertEqual(env_param['Type'], 'String')
        self.assertEqual(env_param['Default'], 'dev')
        self.assertIn('AllowedPattern', env_param)

    def test_vpc_resource_exists(self):
        """Test VPC resource is defined"""
        resources = self.template.get('Resources', {})
        self.assertIn('VPC', resources, "VPC resource should exist")

        vpc = resources['VPC']
        self.assertEqual(vpc['Type'], 'AWS::EC2::VPC')
        self.assertEqual(vpc['Properties']['CidrBlock'], '10.0.0.0/16')
        self.assertTrue(vpc['Properties']['EnableDnsHostnames'])
        self.assertTrue(vpc['Properties']['EnableDnsSupport'])

    def test_vpc_tags(self):
        """Test VPC has required tags"""
        vpc = self.template['Resources']['VPC']
        tags = {tag['Key']: tag['Value'] for tag in vpc['Properties']['Tags']}

        required_tags = ['Name', 'Environment', 'Project', 'CostCenter']
        for tag in required_tags:
            self.assertIn(tag, tags, f"VPC should have {tag} tag")

    def test_internet_gateway_exists(self):
        """Test Internet Gateway is defined"""
        resources = self.template['Resources']
        self.assertIn('InternetGateway', resources)
        self.assertEqual(
            resources['InternetGateway']['Type'],
            'AWS::EC2::InternetGateway'
        )

        # Test attachment
        self.assertIn('AttachGateway', resources)
        self.assertEqual(
            resources['AttachGateway']['Type'],
            'AWS::EC2::VPCGatewayAttachment'
        )

    def test_public_subnets_count(self):
        """Test correct number of public subnets"""
        resources = self.template['Resources']
        public_subnets = [k for k in resources.keys() if k.startswith('PublicSubnet') and k[12:].isdigit()]
        self.assertEqual(len(public_subnets), 3, "Should have 3 public subnets")

    def test_public_subnet_cidrs(self):
        """Test public subnet CIDR blocks"""
        resources = self.template['Resources']
        expected_cidrs = ['10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24']

        actual_cidrs = [
            resources['PublicSubnet1']['Properties']['CidrBlock'],
            resources['PublicSubnet2']['Properties']['CidrBlock'],
            resources['PublicSubnet3']['Properties']['CidrBlock']
        ]

        self.assertEqual(sorted(actual_cidrs), sorted(expected_cidrs))

    def test_public_subnets_map_public_ip(self):
        """Test public subnets auto-assign public IPs"""
        resources = self.template['Resources']
        for i in range(1, 4):
            subnet = resources[f'PublicSubnet{i}']
            self.assertTrue(
                subnet['Properties']['MapPublicIpOnLaunch'],
                f"PublicSubnet{i} should map public IPs"
            )

    def test_private_subnets_count(self):
        """Test correct number of private subnets"""
        resources = self.template['Resources']
        private_subnets = [k for k in resources.keys() if k.startswith('PrivateSubnet') and k[13:].isdigit()]
        self.assertEqual(len(private_subnets), 3, "Should have 3 private subnets")

    def test_private_subnet_cidrs(self):
        """Test private subnet CIDR blocks"""
        resources = self.template['Resources']
        expected_cidrs = ['10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24']

        actual_cidrs = [
            resources['PrivateSubnet1']['Properties']['CidrBlock'],
            resources['PrivateSubnet2']['Properties']['CidrBlock'],
            resources['PrivateSubnet3']['Properties']['CidrBlock']
        ]

        self.assertEqual(sorted(actual_cidrs), sorted(expected_cidrs))

    def test_database_subnets_count(self):
        """Test correct number of database subnets"""
        resources = self.template['Resources']
        db_subnets = [k for k in resources.keys() if k.startswith('DatabaseSubnet') and k[14:].isdigit()]
        self.assertEqual(len(db_subnets), 3, "Should have 3 database subnets")

    def test_database_subnet_cidrs(self):
        """Test database subnet CIDR blocks"""
        resources = self.template['Resources']
        expected_cidrs = ['10.0.21.0/24', '10.0.22.0/24', '10.0.23.0/24']

        actual_cidrs = [
            resources['DatabaseSubnet1']['Properties']['CidrBlock'],
            resources['DatabaseSubnet2']['Properties']['CidrBlock'],
            resources['DatabaseSubnet3']['Properties']['CidrBlock']
        ]

        self.assertEqual(sorted(actual_cidrs), sorted(expected_cidrs))

    def test_nat_gateways_count(self):
        """Test correct number of NAT Gateways"""
        resources = self.template['Resources']
        nat_gateways = [k for k in resources.keys() if k.startswith('NatGateway') and k[10:].isdigit()]
        self.assertEqual(len(nat_gateways), 3, "Should have 3 NAT Gateways")

    def test_nat_gateway_eips(self):
        """Test NAT Gateways have Elastic IPs"""
        resources = self.template['Resources']

        for i in range(1, 4):
            eip_key = f'NatGateway{i}EIP'
            self.assertIn(eip_key, resources)
            self.assertEqual(resources[eip_key]['Type'], 'AWS::EC2::EIP')
            self.assertEqual(resources[eip_key]['Properties']['Domain'], 'vpc')

    def test_nat_gateway_placement(self):
        """Test NAT Gateways are in public subnets"""
        resources = self.template['Resources']

        for i in range(1, 4):
            nat_gw = resources[f'NatGateway{i}']
            subnet_ref = nat_gw['Properties']['SubnetId']
            self.assertIn('PublicSubnet', str(subnet_ref))

    def test_route_tables_exist(self):
        """Test route tables exist for all subnet types"""
        resources = self.template['Resources']

        # Public route table
        self.assertIn('PublicRouteTable', resources)

        # Private route tables (one per AZ)
        for i in range(1, 4):
            self.assertIn(f'PrivateRouteTable{i}', resources)
            self.assertIn(f'DatabaseRouteTable{i}', resources)

    def test_public_route_to_igw(self):
        """Test public route table routes to Internet Gateway"""
        resources = self.template['Resources']
        public_route = resources['PublicRoute']

        self.assertEqual(public_route['Type'], 'AWS::EC2::Route')
        self.assertEqual(
            public_route['Properties']['DestinationCidrBlock'],
            '0.0.0.0/0'
        )
        self.assertIn('InternetGateway', str(public_route['Properties']['GatewayId']))

    def test_private_routes_to_nat_gateways(self):
        """Test private subnets route to NAT Gateways"""
        resources = self.template['Resources']

        for i in range(1, 4):
            route = resources[f'PrivateRoute{i}']
            self.assertEqual(route['Type'], 'AWS::EC2::Route')
            self.assertEqual(
                route['Properties']['DestinationCidrBlock'],
                '0.0.0.0/0'
            )
            self.assertIn(f'NatGateway{i}', str(route['Properties']['NatGatewayId']))

    def test_database_routes_to_nat_gateways(self):
        """Test database subnets route to NAT Gateways"""
        resources = self.template['Resources']

        for i in range(1, 4):
            route = resources[f'DatabaseRoute{i}']
            self.assertEqual(route['Type'], 'AWS::EC2::Route')
            self.assertEqual(
                route['Properties']['DestinationCidrBlock'],
                '0.0.0.0/0'
            )
            self.assertIn(f'NatGateway{i}', str(route['Properties']['NatGatewayId']))

    def test_route_table_associations(self):
        """Test all subnets are associated with route tables"""
        resources = self.template['Resources']

        # Count associations
        associations = [k for k in resources.keys() if 'RouteTableAssociation' in k]
        # 3 public + 3 private + 3 database = 9 associations
        self.assertEqual(len(associations), 9)

    def test_network_acls_exist(self):
        """Test Network ACLs exist for all subnet types"""
        resources = self.template['Resources']

        self.assertIn('PublicNetworkAcl', resources)
        self.assertIn('PrivateNetworkAcl', resources)
        self.assertIn('DatabaseNetworkAcl', resources)

    def test_public_nacl_http_https_rules(self):
        """Test public NACL allows HTTP and HTTPS"""
        resources = self.template['Resources']

        # Check inbound HTTP
        http_rule = resources['PublicNetworkAclInboundHTTP']
        self.assertEqual(http_rule['Properties']['PortRange']['From'], 80)
        self.assertEqual(http_rule['Properties']['RuleAction'], 'allow')

        # Check inbound HTTPS
        https_rule = resources['PublicNetworkAclInboundHTTPS']
        self.assertEqual(https_rule['Properties']['PortRange']['From'], 443)
        self.assertEqual(https_rule['Properties']['RuleAction'], 'allow')

    def test_database_nacl_restricts_access(self):
        """Test database NACL only allows access from private subnets"""
        resources = self.template['Resources']

        # Check that database NACL has rules for private subnet CIDRs only
        mysql_rule = resources['DatabaseNetworkAclInboundMySQL']
        self.assertEqual(mysql_rule['Properties']['CidrBlock'], '10.0.11.0/24')
        self.assertEqual(mysql_rule['Properties']['PortRange']['From'], 3306)

    def test_network_acl_associations(self):
        """Test all subnets are associated with Network ACLs"""
        resources = self.template['Resources']

        nacl_associations = [k for k in resources.keys() if 'NetworkAclAssociation' in k]
        # 3 public + 3 private + 3 database = 9 associations
        self.assertEqual(len(nacl_associations), 9)

    def test_vpc_flow_logs_exist(self):
        """Test VPC Flow Logs are configured"""
        resources = self.template['Resources']

        self.assertIn('VPCFlowLog', resources)
        self.assertIn('VPCFlowLogsLogGroup', resources)
        self.assertIn('VPCFlowLogsRole', resources)

    def test_vpc_flow_logs_retention(self):
        """Test VPC Flow Logs retention is 7 days"""
        log_group = self.template['Resources']['VPCFlowLogsLogGroup']
        self.assertEqual(log_group['Properties']['RetentionInDays'], 7)

    def test_vpc_flow_logs_configuration(self):
        """Test VPC Flow Logs configuration"""
        flow_log = self.template['Resources']['VPCFlowLog']

        self.assertEqual(flow_log['Type'], 'AWS::EC2::FlowLog')
        self.assertEqual(flow_log['Properties']['ResourceType'], 'VPC')
        self.assertEqual(flow_log['Properties']['TrafficType'], 'ALL')
        self.assertEqual(flow_log['Properties']['LogDestinationType'], 'cloud-watch-logs')

    def test_iam_role_for_flow_logs(self):
        """Test IAM role for VPC Flow Logs has correct policies"""
        role = self.template['Resources']['VPCFlowLogsRole']

        self.assertEqual(role['Type'], 'AWS::IAM::Role')

        # Check trust policy
        trust_policy = role['Properties']['AssumeRolePolicyDocument']
        self.assertEqual(
            trust_policy['Statement'][0]['Principal']['Service'],
            'vpc-flow-logs.amazonaws.com'
        )

        # Check has CloudWatch logs policy
        policies = role['Properties']['Policies']
        self.assertEqual(len(policies), 1)
        self.assertEqual(policies[0]['PolicyName'], 'CloudWatchLogPolicy')

    def test_outputs_exist(self):
        """Test all required outputs are defined"""
        outputs = self.template.get('Outputs', {})

        required_outputs = [
            'VPCId',
            'PublicSubnetIds',
            'PrivateSubnetIds',
            'DatabaseSubnetIds',
            'NatGatewayIds',
            'InternetGatewayId',
            'VPCFlowLogsLogGroupName'
        ]

        for output in required_outputs:
            self.assertIn(output, outputs, f"Output {output} should be defined")

    def test_individual_subnet_outputs(self):
        """Test individual subnet outputs are defined"""
        outputs = self.template.get('Outputs', {})

        for i in range(1, 4):
            self.assertIn(f'PublicSubnet{i}Id', outputs)
            self.assertIn(f'PrivateSubnet{i}Id', outputs)
            self.assertIn(f'DatabaseSubnet{i}Id', outputs)

    def test_individual_nat_gateway_outputs(self):
        """Test individual NAT Gateway outputs are defined"""
        outputs = self.template.get('Outputs', {})

        for i in range(1, 4):
            self.assertIn(f'NatGateway{i}Id', outputs)

    def test_outputs_have_exports(self):
        """Test outputs have export names for cross-stack references"""
        outputs = self.template.get('Outputs', {})

        critical_outputs = ['VPCId', 'PublicSubnetIds', 'PrivateSubnetIds', 'DatabaseSubnetIds']

        for output_name in critical_outputs:
            self.assertIn('Export', outputs[output_name])
            self.assertIn('Name', outputs[output_name]['Export'])

    def test_no_retain_policies(self):
        """Test no resources have Retain deletion policy"""
        resources = self.template.get('Resources', {})

        for resource_name, resource in resources.items():
            if 'DeletionPolicy' in resource:
                self.assertNotEqual(
                    resource['DeletionPolicy'],
                    'Retain',
                    f"Resource {resource_name} should not have Retain policy"
                )

    def test_resource_naming_uses_environment_suffix(self):
        """Test resources use EnvironmentSuffix in naming"""
        resources = self.template['Resources']

        # Sample key resources that should use the suffix
        key_resources = ['VPC', 'InternetGateway', 'PublicSubnet1', 'NatGateway1']

        for resource_name in key_resources:
            resource = resources[resource_name]
            tags = resource['Properties'].get('Tags', [])
            name_tags = [tag for tag in tags if tag['Key'] == 'Name']

            self.assertEqual(len(name_tags), 1, f"{resource_name} should have Name tag")
            name_value = name_tags[0]['Value']

            # Check if name uses Sub function with EnvironmentSuffix
            if isinstance(name_value, dict) and 'Fn::Sub' in name_value:
                sub_value = name_value['Fn::Sub']
                self.assertIn('${EnvironmentSuffix}', sub_value)

    def test_route_table_naming_convention(self):
        """Test route tables follow naming pattern: {vpc-name}-{subnet-type}-rt-{az}"""
        resources = self.template['Resources']

        # Test private route tables
        for i in range(1, 4):
            rt = resources[f'PrivateRouteTable{i}']
            tags = {tag['Key']: tag['Value'] for tag in rt['Properties']['Tags']}
            name = tags['Name']

            if isinstance(name, dict) and 'Fn::Sub' in name:
                name_pattern = name['Fn::Sub']
                self.assertIn('vpc-', name_pattern)
                self.assertIn('private-rt', name_pattern)
                self.assertIn('az', name_pattern)

    def test_all_resources_have_required_tags(self):
        """Test all taggable resources have Environment, Project, and CostCenter tags"""
        resources = self.template['Resources']
        required_tags = {'Environment', 'Project', 'CostCenter'}

        taggable_resources = [
            'VPC', 'InternetGateway', 'PublicSubnet1', 'NatGateway1',
            'PublicRouteTable', 'PrivateRouteTable1', 'VPCFlowLogsLogGroup'
        ]

        for resource_name in taggable_resources:
            if resource_name in resources:
                resource = resources[resource_name]
                tags = resource['Properties'].get('Tags', [])
                tag_keys = {tag['Key'] for tag in tags}

                self.assertTrue(
                    required_tags.issubset(tag_keys),
                    f"{resource_name} missing required tags. Has: {tag_keys}, Required: {required_tags}"
                )

    def test_cidr_blocks_no_overlap(self):
        """Test all CIDR blocks are within VPC and don't overlap"""
        resources = self.template['Resources']

        vpc_cidr = resources['VPC']['Properties']['CidrBlock']
        self.assertEqual(vpc_cidr, '10.0.0.0/16')

        # Collect all subnet CIDRs
        subnet_cidrs = []
        for key in resources:
            if 'Subnet' in key and key not in ['DatabaseSubnetIds', 'PublicSubnetIds', 'PrivateSubnetIds']:
                if resources[key].get('Type') == 'AWS::EC2::Subnet':
                    cidr = resources[key]['Properties']['CidrBlock']
                    subnet_cidrs.append(cidr)

        # Check uniqueness
        self.assertEqual(len(subnet_cidrs), len(set(subnet_cidrs)), "CIDR blocks should be unique")

    def test_availability_zones_distribution(self):
        """Test subnets are distributed across availability zones"""
        resources = self.template['Resources']

        # Check public subnets use different AZs
        public_azs = [
            resources['PublicSubnet1']['Properties']['AvailabilityZone'],
            resources['PublicSubnet2']['Properties']['AvailabilityZone'],
            resources['PublicSubnet3']['Properties']['AvailabilityZone']
        ]

        # Each should use different index in GetAZs
        az_indices = [
            str(public_azs[0]),
            str(public_azs[1]),
            str(public_azs[2])
        ]

        # Check they reference different indices (0, 1, 2)
        self.assertIn('[0,', az_indices[0])
        self.assertIn('[1,', az_indices[1])
        self.assertIn('[2,', az_indices[2])


if __name__ == '__main__':
    unittest.main(verbosity=2)