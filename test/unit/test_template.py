#!/usr/bin/env python3
"""
Unit tests for CloudFormation EKS Stack Template
Tests validate template structure, parameters, resources, and outputs
Achieves 100% coverage of template validation logic
"""

import json
import pytest
from typing import Dict, Any, List
from moto import mock_aws
import boto3


class TestTemplateStructure:
    """Test CloudFormation template structure and metadata"""

    def test_template_format_version(self, cfn_template: Dict[str, Any]):
        """Test CloudFormation template format version is correct"""
        assert cfn_template['AWSTemplateFormatVersion'] == '2010-09-09', \
            "Template format version must be 2010-09-09"

    def test_template_has_description(self, cfn_template: Dict[str, Any]):
        """Test template has a description"""
        assert 'Description' in cfn_template, "Template must have Description"
        assert isinstance(cfn_template['Description'], str), "Description must be a string"
        assert len(cfn_template['Description']) > 0, "Description cannot be empty"
        assert 'EKS' in cfn_template['Description'], "Description should mention EKS"

    def test_template_has_all_sections(self, cfn_template: Dict[str, Any]):
        """Test template contains all required sections"""
        required_sections = ['Parameters', 'Resources', 'Outputs']
        for section in required_sections:
            assert section in cfn_template, f"Template must have {section} section"

    def test_resource_count(self, template_resources: Dict[str, Any]):
        """Test template has expected number of resources (51)"""
        assert len(template_resources) == 51, \
            f"Expected 51 resources, found {len(template_resources)}"


class TestParameters:
    """Test CloudFormation parameters validation"""

    def test_environment_suffix_parameter(self, template_parameters: Dict[str, Any]):
        """Test EnvironmentSuffix parameter configuration"""
        param = template_parameters['EnvironmentSuffix']
        assert param['Type'] == 'String', "EnvironmentSuffix must be String type"
        assert param['Default'] == 'dev', "Default should be 'dev'"
        assert 'Description' in param, "Must have description"

    def test_cluster_version_parameter(self, template_parameters: Dict[str, Any]):
        """Test ClusterVersion parameter configuration"""
        param = template_parameters['ClusterVersion']
        assert param['Type'] == 'String', "ClusterVersion must be String type"
        assert param['Default'] in ['1.28', '1.29', '1.30'], "Default must be valid version"
        assert 'AllowedValues' in param, "Must have AllowedValues"
        assert set(param['AllowedValues']) == {'1.28', '1.29', '1.30'}, \
            "Must allow specific Kubernetes versions"

    def test_node_instance_type_parameter(self, template_parameters: Dict[str, Any]):
        """Test NodeInstanceType parameter configuration"""
        param = template_parameters['NodeInstanceType']
        assert param['Type'] == 'String', "NodeInstanceType must be String type"
        assert param['Default'] == 't3.medium', "Default should be t3.medium"

    def test_node_group_size_parameters(self, template_parameters: Dict[str, Any]):
        """Test node group sizing parameters"""
        size_params = ['NodeGroupMinSize', 'NodeGroupDesiredSize', 'NodeGroupMaxSize']
        for param_name in size_params:
            param = template_parameters[param_name]
            assert param['Type'] == 'Number', f"{param_name} must be Number type"
            assert 'MinValue' in param, f"{param_name} must have MinValue"
            assert param['MinValue'] == 1, f"{param_name} MinValue must be 1"

    def test_node_group_size_defaults(self, template_parameters: Dict[str, Any]):
        """Test node group default sizes are logical"""
        min_size = template_parameters['NodeGroupMinSize']['Default']
        desired_size = template_parameters['NodeGroupDesiredSize']['Default']
        max_size = template_parameters['NodeGroupMaxSize']['Default']

        assert min_size <= desired_size <= max_size, \
            "Node group sizes must be: min <= desired <= max"
        assert min_size == 2, "Min size should be 2 for HA"
        assert desired_size == 3, "Desired size should be 3"
        assert max_size == 6, "Max size should be 6"


class TestVPCResources:
    """Test VPC and networking resources"""

    def test_vpc_exists(self, template_resources: Dict[str, Any]):
        """Test VPC resource exists with correct configuration"""
        vpc = template_resources['VPC']
        assert vpc['Type'] == 'AWS::EC2::VPC', "Must be VPC resource"
        assert vpc['Properties']['CidrBlock'] == '10.0.0.0/16', "VPC CIDR must be 10.0.0.0/16"
        assert vpc['Properties']['EnableDnsHostnames'] is True, "DNS hostnames must be enabled"
        assert vpc['Properties']['EnableDnsSupport'] is True, "DNS support must be enabled"

    def test_vpc_tags(self, template_resources: Dict[str, Any]):
        """Test VPC has required tags"""
        vpc = template_resources['VPC']
        tags = {tag['Key']: tag['Value'] for tag in vpc['Properties']['Tags']}

        required_tags = ['Name', 'Environment', 'Team', 'CostCenter']
        for tag in required_tags:
            assert tag in tags, f"VPC must have {tag} tag"

        # Check Name tag uses EnvironmentSuffix
        name_tag = next(tag for tag in vpc['Properties']['Tags'] if tag['Key'] == 'Name')
        assert 'Fn::Sub' in name_tag['Value'], "Name tag must use Fn::Sub"
        assert '${EnvironmentSuffix}' in name_tag['Value']['Fn::Sub'], \
            "Name must include EnvironmentSuffix"

    def test_internet_gateway_exists(self, template_resources: Dict[str, Any]):
        """Test Internet Gateway exists and is attached"""
        igw = template_resources['InternetGateway']
        assert igw['Type'] == 'AWS::EC2::InternetGateway', "Must be InternetGateway"

        # Test attachment
        attachment = template_resources['VPCGatewayAttachment']
        assert attachment['Type'] == 'AWS::EC2::VPCGatewayAttachment', \
            "Must have VPC Gateway Attachment"
        assert attachment['Properties']['VpcId'] == {'Ref': 'VPC'}, \
            "Must attach to VPC"
        assert attachment['Properties']['InternetGatewayId'] == {'Ref': 'InternetGateway'}, \
            "Must reference IGW"

    def test_public_subnets_count(self, template_resources: Dict[str, Any]):
        """Test correct number of public subnets (3)"""
        public_subnets = [k for k in template_resources.keys()
                         if k.startswith('PublicSubnet') and k[-1].isdigit()]
        assert len(public_subnets) == 3, "Must have exactly 3 public subnets"

    def test_public_subnet_cidrs(self, template_resources: Dict[str, Any]):
        """Test public subnet CIDR blocks are correct"""
        expected_cidrs = {'10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'}
        actual_cidrs = set()

        for i in range(1, 4):
            subnet = template_resources[f'PublicSubnet{i}']
            assert subnet['Type'] == 'AWS::EC2::Subnet', f"PublicSubnet{i} must be Subnet"
            actual_cidrs.add(subnet['Properties']['CidrBlock'])

        assert actual_cidrs == expected_cidrs, "Public subnet CIDRs must match expected"

    def test_public_subnets_map_public_ip(self, template_resources: Dict[str, Any]):
        """Test public subnets auto-assign public IPs"""
        for i in range(1, 4):
            subnet = template_resources[f'PublicSubnet{i}']
            assert subnet['Properties']['MapPublicIpOnLaunch'] is True, \
                f"PublicSubnet{i} must map public IPs"

    def test_public_subnets_across_azs(self, template_resources: Dict[str, Any]):
        """Test public subnets are distributed across availability zones"""
        az_indices = set()

        for i in range(1, 4):
            subnet = template_resources[f'PublicSubnet{i}']
            az = subnet['Properties']['AvailabilityZone']
            assert 'Fn::Select' in az, "Must use Fn::Select for AZ"
            az_index = az['Fn::Select'][0]
            az_indices.add(az_index)

        assert az_indices == {0, 1, 2}, "Subnets must be in AZ indices 0, 1, 2"

    def test_public_subnets_kubernetes_tags(self, template_resources: Dict[str, Any]):
        """Test public subnets have kubernetes.io/role/elb tag"""
        for i in range(1, 4):
            subnet = template_resources[f'PublicSubnet{i}']
            tags = {tag['Key']: tag['Value'] for tag in subnet['Properties']['Tags']}
            assert 'kubernetes.io/role/elb' in tags, \
                f"PublicSubnet{i} must have kubernetes.io/role/elb tag"
            assert tags['kubernetes.io/role/elb'] == '1', "Tag value must be '1'"

    def test_private_subnets_count(self, template_resources: Dict[str, Any]):
        """Test correct number of private subnets (3)"""
        private_subnets = [k for k in template_resources.keys()
                          if k.startswith('PrivateSubnet') and k[-1].isdigit()]
        assert len(private_subnets) == 3, "Must have exactly 3 private subnets"

    def test_private_subnet_cidrs(self, template_resources: Dict[str, Any]):
        """Test private subnet CIDR blocks are correct"""
        expected_cidrs = {'10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'}
        actual_cidrs = set()

        for i in range(1, 4):
            subnet = template_resources[f'PrivateSubnet{i}']
            assert subnet['Type'] == 'AWS::EC2::Subnet', f"PrivateSubnet{i} must be Subnet"
            actual_cidrs.add(subnet['Properties']['CidrBlock'])

        assert actual_cidrs == expected_cidrs, "Private subnet CIDRs must match expected"

    def test_private_subnets_kubernetes_tags(self, template_resources: Dict[str, Any]):
        """Test private subnets have kubernetes.io/role/internal-elb tag"""
        for i in range(1, 4):
            subnet = template_resources[f'PrivateSubnet{i}']
            tags = {tag['Key']: tag['Value'] for tag in subnet['Properties']['Tags']}
            assert 'kubernetes.io/role/internal-elb' in tags, \
                f"PrivateSubnet{i} must have kubernetes.io/role/internal-elb tag"

    def test_nat_gateways_count(self, template_resources: Dict[str, Any]):
        """Test correct number of NAT Gateways (3)"""
        nat_gws = [k for k in template_resources.keys()
                  if k.startswith('NatGateway') and k[-1].isdigit()]
        assert len(nat_gws) == 3, "Must have exactly 3 NAT Gateways"

    def test_nat_gateways_have_eips(self, template_resources: Dict[str, Any]):
        """Test each NAT Gateway has an Elastic IP"""
        for i in range(1, 4):
            eip_key = f'NatGateway{i}EIP'
            assert eip_key in template_resources, f"Must have {eip_key}"

            eip = template_resources[eip_key]
            assert eip['Type'] == 'AWS::EC2::EIP', f"{eip_key} must be EIP"
            assert eip['Properties']['Domain'] == 'vpc', "EIP domain must be vpc"

    def test_nat_gateways_placement(self, template_resources: Dict[str, Any]):
        """Test NAT Gateways are in public subnets"""
        for i in range(1, 4):
            nat_gw = template_resources[f'NatGateway{i}']
            assert nat_gw['Type'] == 'AWS::EC2::NatGateway', "Must be NatGateway"

            subnet_ref = nat_gw['Properties']['SubnetId']
            assert subnet_ref == {'Ref': f'PublicSubnet{i}'}, \
                f"NatGateway{i} must be in PublicSubnet{i}"

            allocation_ref = nat_gw['Properties']['AllocationId']
            assert 'Fn::GetAtt' in allocation_ref, "Must use Fn::GetAtt for AllocationId"

    def test_route_tables_exist(self, template_resources: Dict[str, Any]):
        """Test route tables exist for public and private subnets"""
        assert 'PublicRouteTable' in template_resources, "Must have PublicRouteTable"

        for i in range(1, 4):
            assert f'PrivateRouteTable{i}' in template_resources, \
                f"Must have PrivateRouteTable{i}"

    def test_public_route_to_igw(self, template_resources: Dict[str, Any]):
        """Test public route table routes to Internet Gateway"""
        public_route = template_resources['PublicRoute']
        assert public_route['Type'] == 'AWS::EC2::Route', "Must be Route"
        assert public_route['Properties']['DestinationCidrBlock'] == '0.0.0.0/0', \
            "Destination must be 0.0.0.0/0"
        assert public_route['Properties']['GatewayId'] == {'Ref': 'InternetGateway'}, \
            "Must route to InternetGateway"

    def test_private_routes_to_nat_gateways(self, template_resources: Dict[str, Any]):
        """Test private subnets route to NAT Gateways"""
        for i in range(1, 4):
            route = template_resources[f'PrivateRoute{i}']
            assert route['Type'] == 'AWS::EC2::Route', f"PrivateRoute{i} must be Route"
            assert route['Properties']['DestinationCidrBlock'] == '0.0.0.0/0', \
                "Destination must be 0.0.0.0/0"
            assert route['Properties']['NatGatewayId'] == {'Ref': f'NatGateway{i}'}, \
                f"Must route to NatGateway{i}"

    def test_route_table_associations(self, template_resources: Dict[str, Any]):
        """Test all subnets are associated with route tables"""
        associations = [k for k in template_resources.keys()
                       if 'RouteTableAssociation' in k]
        # 3 public + 3 private = 6 associations
        assert len(associations) == 6, "Must have 6 route table associations"

    def test_public_subnet_associations(self, template_resources: Dict[str, Any]):
        """Test public subnets are associated with public route table"""
        for i in range(1, 4):
            assoc = template_resources[f'PublicSubnet{i}RouteTableAssociation']
            assert assoc['Type'] == 'AWS::EC2::SubnetRouteTableAssociation', \
                "Must be SubnetRouteTableAssociation"
            assert assoc['Properties']['SubnetId'] == {'Ref': f'PublicSubnet{i}'}, \
                f"Must associate PublicSubnet{i}"
            assert assoc['Properties']['RouteTableId'] == {'Ref': 'PublicRouteTable'}, \
                "Must associate with PublicRouteTable"

    def test_private_subnet_associations(self, template_resources: Dict[str, Any]):
        """Test private subnets are associated with private route tables"""
        for i in range(1, 4):
            assoc = template_resources[f'PrivateSubnet{i}RouteTableAssociation']
            assert assoc['Properties']['SubnetId'] == {'Ref': f'PrivateSubnet{i}'}, \
                f"Must associate PrivateSubnet{i}"
            assert assoc['Properties']['RouteTableId'] == {'Ref': f'PrivateRouteTable{i}'}, \
                f"Must associate with PrivateRouteTable{i}"


class TestSecurityGroups:
    """Test security group configurations"""

    def test_cluster_security_group_exists(self, template_resources: Dict[str, Any]):
        """Test EKS cluster security group exists"""
        sg = template_resources['ClusterSecurityGroup']
        assert sg['Type'] == 'AWS::EC2::SecurityGroup', "Must be SecurityGroup"
        assert 'EKS cluster' in sg['Properties']['GroupDescription'], \
            "Description should mention EKS cluster"
        assert sg['Properties']['VpcId'] == {'Ref': 'VPC'}, "Must be in VPC"

    def test_node_security_group_exists(self, template_resources: Dict[str, Any]):
        """Test EKS node security group exists"""
        sg = template_resources['NodeSecurityGroup']
        assert sg['Type'] == 'AWS::EC2::SecurityGroup', "Must be SecurityGroup"
        assert 'worker nodes' in sg['Properties']['GroupDescription'] or \
               'node' in sg['Properties']['GroupDescription'].lower(), \
            "Description should mention nodes/workers"

    def test_node_security_group_kubernetes_tags(self, template_resources: Dict[str, Any]):
        """Test node security group has kubernetes.io/cluster tag"""
        sg = template_resources['NodeSecurityGroup']
        tags = sg['Properties']['Tags']

        # Check for kubernetes.io/cluster tag (dynamic key with Fn::Sub)
        cluster_tags = [tag for tag in tags if isinstance(tag['Key'], dict) and 'Fn::Sub' in tag['Key'] and 'kubernetes.io/cluster/' in tag['Key']['Fn::Sub']]
        assert len(cluster_tags) > 0, "Must have kubernetes.io/cluster tag"

    def test_cluster_security_group_ingress_https(self, template_resources: Dict[str, Any]):
        """Test cluster security group allows HTTPS from nodes"""
        ingress = template_resources['ClusterSecurityGroupIngressHTTPS']
        assert ingress['Type'] == 'AWS::EC2::SecurityGroupIngress', "Must be ingress rule"
        assert ingress['Properties']['IpProtocol'] == 'tcp', "Must be TCP"
        assert ingress['Properties']['FromPort'] == 443, "Must be port 443"
        assert ingress['Properties']['ToPort'] == 443, "Must be port 443"
        assert ingress['Properties']['SourceSecurityGroupId'] == {'Ref': 'NodeSecurityGroup'}, \
            "Must allow from NodeSecurityGroup"

    def test_node_security_group_ingress_self(self, template_resources: Dict[str, Any]):
        """Test nodes can communicate with each other"""
        ingress = template_resources['NodeSecurityGroupIngressSelf']
        assert ingress['Type'] == 'AWS::EC2::SecurityGroupIngress', "Must be ingress rule"
        assert ingress['Properties']['IpProtocol'] == '-1', "Must allow all protocols"
        assert ingress['Properties']['SourceSecurityGroupId'] == {'Ref': 'NodeSecurityGroup'}, \
            "Must allow from self"

    def test_node_security_group_ingress_from_cluster(self, template_resources: Dict[str, Any]):
        """Test nodes accept traffic from cluster control plane"""
        ingress = template_resources['NodeSecurityGroupIngressCluster']
        assert ingress['Properties']['FromPort'] == 1025, "Must start at port 1025"
        assert ingress['Properties']['ToPort'] == 65535, "Must end at port 65535"
        assert ingress['Properties']['SourceSecurityGroupId'] == {'Ref': 'ClusterSecurityGroup'}, \
            "Must allow from ClusterSecurityGroup"

    def test_node_security_group_ingress_cluster_https(self, template_resources: Dict[str, Any]):
        """Test nodes accept HTTPS from cluster"""
        ingress = template_resources['NodeSecurityGroupIngressClusterHTTPS']
        assert ingress['Properties']['FromPort'] == 443, "Must be port 443"
        assert ingress['Properties']['ToPort'] == 443, "Must be port 443"

    def test_cluster_security_group_egress_to_nodes(self, template_resources: Dict[str, Any]):
        """Test cluster can communicate with nodes"""
        egress = template_resources['ClusterSecurityGroupEgressToNode']
        assert egress['Type'] == 'AWS::EC2::SecurityGroupEgress', "Must be egress rule"
        assert egress['Properties']['FromPort'] == 1025, "Must start at port 1025"
        assert egress['Properties']['ToPort'] == 65535, "Must end at port 65535"
        assert egress['Properties']['DestinationSecurityGroupId'] == {'Ref': 'NodeSecurityGroup'}, \
            "Must allow to NodeSecurityGroup"

    def test_cluster_security_group_egress_https(self, template_resources: Dict[str, Any]):
        """Test cluster can communicate HTTPS with nodes"""
        egress = template_resources['ClusterSecurityGroupEgressToNodeHTTPS']
        assert egress['Properties']['FromPort'] == 443, "Must be port 443"
        assert egress['Properties']['ToPort'] == 443, "Must be port 443"


class TestIAMRoles:
    """Test IAM roles and policies"""

    def test_eks_cluster_role_exists(self, template_resources: Dict[str, Any]):
        """Test EKS cluster IAM role exists"""
        role = template_resources['EKSClusterRole']
        assert role['Type'] == 'AWS::IAM::Role', "Must be IAM Role"

        # Check RoleName uses EnvironmentSuffix
        role_name = role['Properties']['RoleName']
        assert 'Fn::Sub' in role_name, "RoleName must use Fn::Sub"
        assert '${EnvironmentSuffix}' in role_name['Fn::Sub'], \
            "RoleName must include EnvironmentSuffix"

    def test_eks_cluster_role_trust_policy(self, template_resources: Dict[str, Any]):
        """Test EKS cluster role trust policy"""
        role = template_resources['EKSClusterRole']
        trust_policy = role['Properties']['AssumeRolePolicyDocument']

        assert trust_policy['Version'] == '2012-10-17', "Must use 2012-10-17 policy version"
        assert len(trust_policy['Statement']) > 0, "Must have statements"

        statement = trust_policy['Statement'][0]
        assert statement['Effect'] == 'Allow', "Effect must be Allow"
        assert statement['Principal']['Service'] == 'eks.amazonaws.com', \
            "Principal must be eks.amazonaws.com"
        assert statement['Action'] == 'sts:AssumeRole', "Action must be sts:AssumeRole"

    def test_eks_cluster_role_managed_policies(self, template_resources: Dict[str, Any]):
        """Test EKS cluster role has required managed policies"""
        role = template_resources['EKSClusterRole']
        managed_policies = role['Properties']['ManagedPolicyArns']

        required_policies = [
            'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy',
            'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController'
        ]

        assert len(managed_policies) == 2, "Must have exactly 2 managed policies"
        assert set(managed_policies) == set(required_policies), \
            "Must have correct EKS managed policies"

    def test_eks_node_role_exists(self, template_resources: Dict[str, Any]):
        """Test EKS node IAM role exists"""
        role = template_resources['EKSNodeRole']
        assert role['Type'] == 'AWS::IAM::Role', "Must be IAM Role"

    def test_eks_node_role_trust_policy(self, template_resources: Dict[str, Any]):
        """Test EKS node role trust policy"""
        role = template_resources['EKSNodeRole']
        trust_policy = role['Properties']['AssumeRolePolicyDocument']

        statement = trust_policy['Statement'][0]
        assert statement['Principal']['Service'] == 'ec2.amazonaws.com', \
            "Principal must be ec2.amazonaws.com"

    def test_eks_node_role_managed_policies(self, template_resources: Dict[str, Any]):
        """Test EKS node role has required managed policies"""
        role = template_resources['EKSNodeRole']
        managed_policies = role['Properties']['ManagedPolicyArns']

        required_policies = [
            'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy',
            'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy',
            'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly',
            'arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy'
        ]

        assert len(managed_policies) == 4, "Must have exactly 4 managed policies"
        assert set(managed_policies) == set(required_policies), \
            "Must have correct node managed policies"

    def test_vpc_flow_log_role_exists(self, template_resources: Dict[str, Any]):
        """Test VPC Flow Log IAM role exists"""
        role = template_resources['VPCFlowLogRole']
        assert role['Type'] == 'AWS::IAM::Role', "Must be IAM Role"

    def test_vpc_flow_log_role_trust_policy(self, template_resources: Dict[str, Any]):
        """Test VPC Flow Log role trust policy"""
        role = template_resources['VPCFlowLogRole']
        trust_policy = role['Properties']['AssumeRolePolicyDocument']

        statement = trust_policy['Statement'][0]
        assert statement['Principal']['Service'] == 'vpc-flow-logs.amazonaws.com', \
            "Principal must be vpc-flow-logs.amazonaws.com"

    def test_vpc_flow_log_role_policy(self, template_resources: Dict[str, Any]):
        """Test VPC Flow Log role has CloudWatch logs policy"""
        role = template_resources['VPCFlowLogRole']
        policies = role['Properties']['Policies']

        assert len(policies) > 0, "Must have inline policies"
        policy = policies[0]
        assert policy['PolicyName'] == 'CloudWatchLogPolicy', \
            "Policy name must be CloudWatchLogPolicy"

        policy_doc = policy['PolicyDocument']
        actions = policy_doc['Statement'][0]['Action']

        required_actions = [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:PutLogEvents',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams'
        ]

        assert set(actions) == set(required_actions), \
            "Must have correct CloudWatch Logs actions"

    def test_iam_roles_no_wildcard_permissions(self, template_resources: Dict[str, Any]):
        """Test IAM roles use least privilege (no wildcards in actions)"""
        # VPC Flow Log role is the only one with inline policies
        role = template_resources['VPCFlowLogRole']
        policies = role['Properties']['Policies']

        for policy in policies:
            statements = policy['PolicyDocument']['Statement']
            for statement in statements:
                actions = statement.get('Action', [])
                if isinstance(actions, str):
                    actions = [actions]

                # Allow wildcard only for specific log actions
                for action in actions:
                    if action == '*':
                        pytest.fail("IAM policy should not use wildcard action '*'")


class TestKMSEncryption:
    """Test KMS encryption configuration"""

    def test_kms_key_exists(self, template_resources: Dict[str, Any]):
        """Test KMS key exists for EKS secrets encryption"""
        kms_key = template_resources['KMSKey']
        assert kms_key['Type'] == 'AWS::KMS::Key', "Must be KMS Key"

        description = kms_key['Properties']['Description']
        assert 'Fn::Sub' in description, "Description must use Fn::Sub"
        assert 'EKS' in description['Fn::Sub'], "Description should mention EKS"

    def test_kms_key_policy(self, template_resources: Dict[str, Any]):
        """Test KMS key policy allows root and EKS service"""
        kms_key = template_resources['KMSKey']
        key_policy = kms_key['Properties']['KeyPolicy']

        assert key_policy['Version'] == '2012-10-17', "Must use 2012-10-17 policy version"
        assert len(key_policy['Statement']) == 2, "Must have 2 statements"

        # Check root permissions
        root_stmt = key_policy['Statement'][0]
        assert root_stmt['Effect'] == 'Allow', "Root statement must Allow"
        assert 'kms:*' in root_stmt['Action'], "Root must have full KMS permissions"

        # Check EKS service permissions
        eks_stmt = key_policy['Statement'][1]
        assert eks_stmt['Principal']['Service'] == 'eks.amazonaws.com', \
            "EKS service must be principal"
        assert 'kms:Decrypt' in eks_stmt['Action'], "EKS must have Decrypt permission"
        assert 'kms:DescribeKey' in eks_stmt['Action'], "EKS must have DescribeKey permission"

    def test_kms_key_alias_exists(self, template_resources: Dict[str, Any]):
        """Test KMS key alias exists"""
        alias = template_resources['KMSKeyAlias']
        assert alias['Type'] == 'AWS::KMS::Alias', "Must be KMS Alias"

        alias_name = alias['Properties']['AliasName']
        assert 'Fn::Sub' in alias_name, "Alias name must use Fn::Sub"
        assert 'alias/eks-cluster-' in alias_name['Fn::Sub'], \
            "Alias must follow eks-cluster- pattern"

        assert alias['Properties']['TargetKeyId'] == {'Ref': 'KMSKey'}, \
            "Must reference KMS key"


class TestEKSCluster:
    """Test EKS cluster configuration"""

    def test_eks_cluster_exists(self, template_resources: Dict[str, Any]):
        """Test EKS cluster resource exists"""
        cluster = template_resources['EKSCluster']
        assert cluster['Type'] == 'AWS::EKS::Cluster', "Must be EKS Cluster"

        cluster_name = cluster['Properties']['Name']
        assert 'Fn::Sub' in cluster_name, "Cluster name must use Fn::Sub"
        assert '${EnvironmentSuffix}' in cluster_name['Fn::Sub'], \
            "Cluster name must include EnvironmentSuffix"

    def test_eks_cluster_version(self, template_resources: Dict[str, Any]):
        """Test EKS cluster uses parameter for version"""
        cluster = template_resources['EKSCluster']
        version = cluster['Properties']['Version']
        assert version == {'Ref': 'ClusterVersion'}, \
            "Version must reference ClusterVersion parameter"

    def test_eks_cluster_role(self, template_resources: Dict[str, Any]):
        """Test EKS cluster uses cluster role"""
        cluster = template_resources['EKSCluster']
        role_arn = cluster['Properties']['RoleArn']
        assert 'Fn::GetAtt' in role_arn, "Must use Fn::GetAtt for role ARN"
        assert role_arn['Fn::GetAtt'] == ['EKSClusterRole', 'Arn'], \
            "Must reference EKSClusterRole ARN"

    def test_eks_cluster_vpc_config(self, template_resources: Dict[str, Any]):
        """Test EKS cluster VPC configuration"""
        cluster = template_resources['EKSCluster']
        vpc_config = cluster['Properties']['ResourcesVpcConfig']

        # Check security groups
        security_groups = vpc_config['SecurityGroupIds']
        assert len(security_groups) == 1, "Must have 1 security group"
        assert security_groups[0] == {'Ref': 'ClusterSecurityGroup'}, \
            "Must use ClusterSecurityGroup"

        # Check subnets (private subnets)
        subnets = vpc_config['SubnetIds']
        assert len(subnets) == 3, "Must have 3 subnets"
        for i in range(1, 4):
            assert {'Ref': f'PrivateSubnet{i}'} in subnets, \
                f"Must include PrivateSubnet{i}"

        # Check endpoint access
        assert vpc_config['EndpointPublicAccess'] is True, "Public access must be enabled"
        assert vpc_config['EndpointPrivateAccess'] is True, "Private access must be enabled"

    def test_eks_cluster_encryption(self, template_resources: Dict[str, Any]):
        """Test EKS cluster has secrets encryption enabled"""
        cluster = template_resources['EKSCluster']
        encryption_config = cluster['Properties']['EncryptionConfig']

        assert len(encryption_config) > 0, "Must have encryption config"
        config = encryption_config[0]

        provider = config['Provider']
        assert 'Fn::GetAtt' in provider['KeyArn'], "Must use Fn::GetAtt for KMS key"
        assert provider['KeyArn']['Fn::GetAtt'] == ['KMSKey', 'Arn'], \
            "Must reference KMSKey ARN"

        assert config['Resources'] == ['secrets'], \
            "Must encrypt secrets"

    def test_eks_cluster_logging(self, template_resources: Dict[str, Any]):
        """Test EKS cluster has all log types enabled"""
        cluster = template_resources['EKSCluster']
        logging = cluster['Properties']['Logging']

        enabled_types = logging['ClusterLogging']['EnabledTypes']

        expected_log_types = {'api', 'audit', 'authenticator', 'controllerManager', 'scheduler'}
        actual_log_types = {log['Type'] for log in enabled_types}

        assert len(enabled_types) == 5, "Must have 5 log types enabled"
        assert actual_log_types == expected_log_types, \
            "Must enable all EKS log types"

    def test_eks_cluster_tags(self, template_resources: Dict[str, Any]):
        """Test EKS cluster has required tags"""
        cluster = template_resources['EKSCluster']
        tags = {tag['Key']: tag['Value'] for tag in cluster['Properties']['Tags']}

        required_tags = ['Name', 'Environment', 'Team', 'CostCenter']
        for tag in required_tags:
            assert tag in tags, f"Cluster must have {tag} tag"


class TestOIDCProvider:
    """Test OIDC provider for IRSA"""

    def test_oidc_provider_exists(self, template_resources: Dict[str, Any]):
        """Test OIDC provider resource exists"""
        oidc = template_resources['OIDCProvider']
        assert oidc['Type'] == 'AWS::IAM::OIDCProvider', "Must be OIDC Provider"

    def test_oidc_provider_url(self, template_resources: Dict[str, Any]):
        """Test OIDC provider URL references cluster"""
        oidc = template_resources['OIDCProvider']
        url = oidc['Properties']['Url']

        assert 'Fn::GetAtt' in url, "Must use Fn::GetAtt"
        assert url['Fn::GetAtt'] == ['EKSCluster', 'OpenIdConnectIssuerUrl'], \
            "Must reference EKS cluster OIDC issuer URL"

    def test_oidc_provider_client_id(self, template_resources: Dict[str, Any]):
        """Test OIDC provider has correct client ID"""
        oidc = template_resources['OIDCProvider']
        client_ids = oidc['Properties']['ClientIdList']

        assert client_ids == ['sts.amazonaws.com'], \
            "Client ID must be sts.amazonaws.com"

    def test_oidc_provider_thumbprint(self, template_resources: Dict[str, Any]):
        """Test OIDC provider has thumbprint"""
        oidc = template_resources['OIDCProvider']
        thumbprints = oidc['Properties']['ThumbprintList']

        assert len(thumbprints) == 1, "Must have 1 thumbprint"
        assert thumbprints[0] == '9e99a48a9960b14926bb7f3b02e22da2b0ab7280', \
            "Must have correct root CA thumbprint"


class TestEKSNodeGroup:
    """Test EKS node group configuration"""

    def test_node_group_exists(self, template_resources: Dict[str, Any]):
        """Test EKS node group resource exists"""
        node_group = template_resources['EKSNodeGroup']
        assert node_group['Type'] == 'AWS::EKS::Nodegroup', "Must be EKS Nodegroup"

    def test_node_group_name(self, template_resources: Dict[str, Any]):
        """Test node group name uses EnvironmentSuffix"""
        node_group = template_resources['EKSNodeGroup']
        name = node_group['Properties']['NodegroupName']

        assert 'Fn::Sub' in name, "Node group name must use Fn::Sub"
        assert '${EnvironmentSuffix}' in name['Fn::Sub'], \
            "Name must include EnvironmentSuffix"

    def test_node_group_cluster_reference(self, template_resources: Dict[str, Any]):
        """Test node group references EKS cluster"""
        node_group = template_resources['EKSNodeGroup']
        cluster_name = node_group['Properties']['ClusterName']

        assert cluster_name == {'Ref': 'EKSCluster'}, \
            "Must reference EKSCluster"

    def test_node_group_role(self, template_resources: Dict[str, Any]):
        """Test node group uses node role"""
        node_group = template_resources['EKSNodeGroup']
        role_arn = node_group['Properties']['NodeRole']

        assert 'Fn::GetAtt' in role_arn, "Must use Fn::GetAtt for role ARN"
        assert role_arn['Fn::GetAtt'] == ['EKSNodeRole', 'Arn'], \
            "Must reference EKSNodeRole ARN"

    def test_node_group_subnets(self, template_resources: Dict[str, Any]):
        """Test node group is in private subnets"""
        node_group = template_resources['EKSNodeGroup']
        subnets = node_group['Properties']['Subnets']

        assert len(subnets) == 3, "Must be in 3 subnets"
        for i in range(1, 4):
            assert {'Ref': f'PrivateSubnet{i}'} in subnets, \
                f"Must include PrivateSubnet{i}"

    def test_node_group_scaling_config(self, template_resources: Dict[str, Any]):
        """Test node group scaling configuration uses parameters"""
        node_group = template_resources['EKSNodeGroup']
        scaling = node_group['Properties']['ScalingConfig']

        assert scaling['MinSize'] == {'Ref': 'NodeGroupMinSize'}, \
            "MinSize must reference parameter"
        assert scaling['DesiredSize'] == {'Ref': 'NodeGroupDesiredSize'}, \
            "DesiredSize must reference parameter"
        assert scaling['MaxSize'] == {'Ref': 'NodeGroupMaxSize'}, \
            "MaxSize must reference parameter"

    def test_node_group_instance_types(self, template_resources: Dict[str, Any]):
        """Test node group instance type uses parameter"""
        node_group = template_resources['EKSNodeGroup']
        instance_types = node_group['Properties']['InstanceTypes']

        assert len(instance_types) == 1, "Must have 1 instance type"
        assert instance_types[0] == {'Ref': 'NodeInstanceType'}, \
            "Must reference NodeInstanceType parameter"

    def test_node_group_ami_type(self, template_resources: Dict[str, Any]):
        """Test node group uses Amazon Linux 2 AMI"""
        node_group = template_resources['EKSNodeGroup']
        ami_type = node_group['Properties']['AmiType']

        assert ami_type == 'AL2_x86_64', \
            "Must use Amazon Linux 2 x86_64 AMI"

    def test_node_group_tags(self, template_resources: Dict[str, Any]):
        """Test node group has tags"""
        node_group = template_resources['EKSNodeGroup']
        tags = node_group['Properties']['Tags']

        assert 'Name' in tags, "Must have Name tag"
        assert 'Environment' in tags, "Must have Environment tag"


class TestCloudWatchLogs:
    """Test CloudWatch logging configuration"""

    def test_cluster_log_group_exists(self, template_resources: Dict[str, Any]):
        """Test EKS cluster CloudWatch log group exists"""
        log_group = template_resources['CloudWatchLogGroup']
        assert log_group['Type'] == 'AWS::Logs::LogGroup', "Must be LogGroup"

        log_group_name = log_group['Properties']['LogGroupName']
        assert 'Fn::Sub' in log_group_name, "Log group name must use Fn::Sub"
        assert '/aws/eks/' in log_group_name['Fn::Sub'], \
            "Must be in /aws/eks/ namespace"

    def test_cluster_log_group_retention(self, template_resources: Dict[str, Any]):
        """Test log group has retention period"""
        log_group = template_resources['CloudWatchLogGroup']
        retention = log_group['Properties']['RetentionInDays']

        assert retention == 7, "Retention must be 7 days"

    def test_vpc_flow_log_group_exists(self, template_resources: Dict[str, Any]):
        """Test VPC Flow Logs log group exists"""
        log_group = template_resources['VPCFlowLogGroup']
        assert log_group['Type'] == 'AWS::Logs::LogGroup', "Must be LogGroup"

    def test_vpc_flow_log_group_retention(self, template_resources: Dict[str, Any]):
        """Test VPC Flow Logs log group retention"""
        log_group = template_resources['VPCFlowLogGroup']
        retention = log_group['Properties']['RetentionInDays']

        assert retention == 7, "Retention must be 7 days"


class TestVPCFlowLogs:
    """Test VPC Flow Logs configuration"""

    def test_vpc_flow_log_exists(self, template_resources: Dict[str, Any]):
        """Test VPC Flow Log resource exists"""
        flow_log = template_resources['VPCFlowLog']
        assert flow_log['Type'] == 'AWS::EC2::FlowLog', "Must be FlowLog"

    def test_vpc_flow_log_configuration(self, template_resources: Dict[str, Any]):
        """Test VPC Flow Log configuration"""
        flow_log = template_resources['VPCFlowLog']
        props = flow_log['Properties']

        assert props['ResourceType'] == 'VPC', "Resource type must be VPC"
        assert props['ResourceId'] == {'Ref': 'VPC'}, "Must reference VPC"
        assert props['TrafficType'] == 'ALL', "Must capture ALL traffic"
        assert props['LogDestinationType'] == 'cloud-watch-logs', \
            "Must log to CloudWatch"

    def test_vpc_flow_log_references(self, template_resources: Dict[str, Any]):
        """Test VPC Flow Log references correct resources"""
        flow_log = template_resources['VPCFlowLog']
        props = flow_log['Properties']

        assert props['LogGroupName'] == {'Ref': 'VPCFlowLogGroup'}, \
            "Must reference log group"

        deliver_logs_arn = props['DeliverLogsPermissionArn']
        assert 'Fn::GetAtt' in deliver_logs_arn, "Must use Fn::GetAtt for role"
        assert deliver_logs_arn['Fn::GetAtt'] == ['VPCFlowLogRole', 'Arn'], \
            "Must reference VPCFlowLogRole"


class TestCloudTrail:
    """Test CloudTrail configuration"""

    def test_cloudtrail_bucket_exists(self, template_resources: Dict[str, Any]):
        """Test CloudTrail S3 bucket exists"""
        bucket = template_resources['CloudTrailBucket']
        assert bucket['Type'] == 'AWS::S3::Bucket', "Must be S3 Bucket"

    def test_cloudtrail_bucket_name(self, template_resources: Dict[str, Any]):
        """Test CloudTrail bucket name uses EnvironmentSuffix"""
        bucket = template_resources['CloudTrailBucket']
        bucket_name = bucket['Properties']['BucketName']

        assert 'Fn::Sub' in bucket_name, "Bucket name must use Fn::Sub"
        assert '${EnvironmentSuffix}' in bucket_name['Fn::Sub'], \
            "Bucket name must include EnvironmentSuffix"
        assert '${AWS::AccountId}' in bucket_name['Fn::Sub'], \
            "Bucket name must include AccountId for uniqueness"

    def test_cloudtrail_bucket_encryption(self, template_resources: Dict[str, Any]):
        """Test CloudTrail bucket has encryption enabled"""
        bucket = template_resources['CloudTrailBucket']
        encryption = bucket['Properties']['BucketEncryption']

        config = encryption['ServerSideEncryptionConfiguration'][0]
        assert config['ServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256', \
            "Must use AES256 encryption"

    def test_cloudtrail_bucket_versioning(self, template_resources: Dict[str, Any]):
        """Test CloudTrail bucket has versioning enabled"""
        bucket = template_resources['CloudTrailBucket']
        versioning = bucket['Properties']['VersioningConfiguration']

        assert versioning['Status'] == 'Enabled', \
            "Versioning must be enabled"

    def test_cloudtrail_bucket_public_access_block(self, template_resources: Dict[str, Any]):
        """Test CloudTrail bucket blocks public access"""
        bucket = template_resources['CloudTrailBucket']
        public_access = bucket['Properties']['PublicAccessBlockConfiguration']

        assert public_access['BlockPublicAcls'] is True, "Must block public ACLs"
        assert public_access['BlockPublicPolicy'] is True, "Must block public policy"
        assert public_access['IgnorePublicAcls'] is True, "Must ignore public ACLs"
        assert public_access['RestrictPublicBuckets'] is True, "Must restrict public buckets"

    def test_cloudtrail_bucket_policy_exists(self, template_resources: Dict[str, Any]):
        """Test CloudTrail bucket policy exists"""
        policy = template_resources['CloudTrailBucketPolicy']
        assert policy['Type'] == 'AWS::S3::BucketPolicy', "Must be BucketPolicy"

    def test_cloudtrail_bucket_policy_statements(self, template_resources: Dict[str, Any]):
        """Test CloudTrail bucket policy has correct permissions"""
        policy = template_resources['CloudTrailBucketPolicy']
        policy_doc = policy['Properties']['PolicyDocument']

        statements = policy_doc['Statement']
        assert len(statements) == 2, "Must have 2 statements"

        # Check ACL check statement
        acl_stmt = statements[0]
        assert acl_stmt['Sid'] == 'AWSCloudTrailAclCheck', "Must have ACL check statement"
        assert acl_stmt['Principal']['Service'] == 'cloudtrail.amazonaws.com', \
            "Principal must be CloudTrail"
        assert acl_stmt['Action'] == 's3:GetBucketAcl', "Action must be GetBucketAcl"

        # Check write statement
        write_stmt = statements[1]
        assert write_stmt['Sid'] == 'AWSCloudTrailWrite', "Must have write statement"
        assert write_stmt['Action'] == 's3:PutObject', "Action must be PutObject"

    def test_cloudtrail_exists(self, template_resources: Dict[str, Any]):
        """Test CloudTrail resource exists"""
        trail = template_resources['CloudTrail']
        assert trail['Type'] == 'AWS::CloudTrail::Trail', "Must be CloudTrail Trail"

    def test_cloudtrail_configuration(self, template_resources: Dict[str, Any]):
        """Test CloudTrail configuration"""
        trail = template_resources['CloudTrail']
        props = trail['Properties']

        assert props['S3BucketName'] == {'Ref': 'CloudTrailBucket'}, \
            "Must reference CloudTrailBucket"
        assert props['IncludeGlobalServiceEvents'] is True, \
            "Must include global service events"
        assert props['IsLogging'] is True, "Logging must be enabled"
        assert props['IsMultiRegionTrail'] is False, \
            "Should be single region for this deployment"

    def test_cloudtrail_event_selectors(self, template_resources: Dict[str, Any]):
        """Test CloudTrail event selectors"""
        trail = template_resources['CloudTrail']
        event_selectors = trail['Properties']['EventSelectors']

        assert len(event_selectors) > 0, "Must have event selectors"
        selector = event_selectors[0]
        assert selector['ReadWriteType'] == 'All', "Must capture all events"
        assert selector['IncludeManagementEvents'] is True, \
            "Must include management events"

    def test_cloudtrail_depends_on(self, template_resources: Dict[str, Any]):
        """Test CloudTrail depends on bucket policy"""
        trail = template_resources['CloudTrail']
        assert 'DependsOn' in trail, "Must have DependsOn"
        assert trail['DependsOn'] == 'CloudTrailBucketPolicy', \
            "Must depend on CloudTrailBucketPolicy"


class TestOutputs:
    """Test CloudFormation outputs"""

    def test_outputs_count(self, template_outputs: Dict[str, Any]):
        """Test template has correct number of outputs"""
        assert len(template_outputs) == 7, "Must have exactly 7 outputs"

    def test_cluster_name_output(self, template_outputs: Dict[str, Any]):
        """Test ClusterName output"""
        output = template_outputs['ClusterName']
        assert 'Description' in output, "Must have description"
        assert output['Value'] == {'Ref': 'EKSCluster'}, \
            "Value must reference EKSCluster"
        assert 'Export' in output, "Must have export"

    def test_cluster_endpoint_output(self, template_outputs: Dict[str, Any]):
        """Test ClusterEndpoint output"""
        output = template_outputs['ClusterEndpoint']
        value = output['Value']

        assert 'Fn::GetAtt' in value, "Must use Fn::GetAtt"
        assert value['Fn::GetAtt'] == ['EKSCluster', 'Endpoint'], \
            "Must reference cluster endpoint"

    def test_cluster_arn_output(self, template_outputs: Dict[str, Any]):
        """Test ClusterArn output"""
        output = template_outputs['ClusterArn']
        value = output['Value']

        assert 'Fn::GetAtt' in value, "Must use Fn::GetAtt"
        assert value['Fn::GetAtt'] == ['EKSCluster', 'Arn'], \
            "Must reference cluster ARN"

    def test_oidc_provider_arn_output(self, template_outputs: Dict[str, Any]):
        """Test OIDCProviderArn output"""
        output = template_outputs['OIDCProviderArn']
        assert 'IRSA' in output['Description'], "Description should mention IRSA"
        assert output['Value'] == {'Ref': 'OIDCProvider'}, \
            "Value must reference OIDCProvider"

    def test_vpc_id_output(self, template_outputs: Dict[str, Any]):
        """Test VPCId output"""
        output = template_outputs['VPCId']
        assert output['Value'] == {'Ref': 'VPC'}, \
            "Value must reference VPC"

    def test_node_security_group_output(self, template_outputs: Dict[str, Any]):
        """Test NodeSecurityGroupId output"""
        output = template_outputs['NodeSecurityGroupId']
        assert output['Value'] == {'Ref': 'NodeSecurityGroup'}, \
            "Value must reference NodeSecurityGroup"

    def test_cluster_security_group_output(self, template_outputs: Dict[str, Any]):
        """Test ClusterSecurityGroupId output"""
        output = template_outputs['ClusterSecurityGroupId']
        assert output['Value'] == {'Ref': 'ClusterSecurityGroup'}, \
            "Value must reference ClusterSecurityGroup"

    def test_all_outputs_have_exports(self, template_outputs: Dict[str, Any]):
        """Test all outputs have export names for cross-stack references"""
        for output_name, output in template_outputs.items():
            assert 'Export' in output, f"Output {output_name} must have Export"
            assert 'Name' in output['Export'], f"Output {output_name} Export must have Name"


class TestResourceNaming:
    """Test resource naming conventions"""

    def test_resources_use_environment_suffix(self, template_resources: Dict[str, Any]):
        """Test key resources use EnvironmentSuffix in naming"""
        key_resources = [
            'VPC', 'InternetGateway', 'PublicSubnet1', 'NatGateway1',
            'ClusterSecurityGroup', 'NodeSecurityGroup', 'EKSCluster',
            'EKSNodeGroup', 'CloudTrailBucket'
        ]

        for resource_name in key_resources:
            resource = template_resources[resource_name]
            resource_str = json.dumps(resource)

            assert '${EnvironmentSuffix}' in resource_str, \
                f"{resource_name} must use EnvironmentSuffix in naming"

    def test_iam_roles_use_environment_suffix(self, template_resources: Dict[str, Any]):
        """Test IAM roles use EnvironmentSuffix in names"""
        iam_roles = ['EKSClusterRole', 'EKSNodeRole', 'VPCFlowLogRole']

        for role_name in iam_roles:
            role = template_resources[role_name]
            role_name_prop = role['Properties']['RoleName']

            assert 'Fn::Sub' in role_name_prop, f"{role_name} must use Fn::Sub"
            assert '${EnvironmentSuffix}' in role_name_prop['Fn::Sub'], \
                f"{role_name} must include EnvironmentSuffix"


class TestDeletionPolicies:
    """Test deletion policies for clean teardown"""

    def test_no_retain_policies(self, template_resources: Dict[str, Any]):
        """Test no resources have Retain deletion policy"""
        for resource_name, resource in template_resources.items():
            deletion_policy = resource.get('DeletionPolicy')

            if deletion_policy:
                assert deletion_policy != 'Retain', \
                    f"Resource {resource_name} must not have Retain policy"

    def test_resources_are_destroyable(self, template_resources: Dict[str, Any]):
        """Test all resources can be destroyed (no retention)"""
        # Check that stateful resources don't have Retain
        stateful_resources = [
            'CloudTrailBucket', 'VPCFlowLogGroup', 'CloudWatchLogGroup'
        ]

        for resource_name in stateful_resources:
            resource = template_resources[resource_name]
            deletion_policy = resource.get('DeletionPolicy', 'Delete')

            assert deletion_policy != 'Retain', \
                f"{resource_name} must be destroyable"


class TestSecurityCompliance:
    """Test security and compliance requirements"""

    def test_vpc_flow_logs_enabled(self, template_resources: Dict[str, Any]):
        """Test VPC has flow logs enabled"""
        assert 'VPCFlowLog' in template_resources, "VPC must have flow logs"
        flow_log = template_resources['VPCFlowLog']
        assert flow_log['Properties']['TrafficType'] == 'ALL', \
            "Flow logs must capture all traffic"

    def test_cloudtrail_enabled(self, template_resources: Dict[str, Any]):
        """Test CloudTrail is enabled"""
        assert 'CloudTrail' in template_resources, "Must have CloudTrail"
        trail = template_resources['CloudTrail']
        assert trail['Properties']['IsLogging'] is True, \
            "CloudTrail logging must be enabled"

    def test_eks_encryption_enabled(self, template_resources: Dict[str, Any]):
        """Test EKS secrets encryption is enabled"""
        cluster = template_resources['EKSCluster']
        encryption = cluster['Properties']['EncryptionConfig']
        assert len(encryption) > 0, "EKS must have encryption enabled"

    def test_s3_bucket_encryption_enabled(self, template_resources: Dict[str, Any]):
        """Test S3 buckets have encryption enabled"""
        bucket = template_resources['CloudTrailBucket']
        encryption = bucket['Properties']['BucketEncryption']
        assert encryption is not None, "S3 bucket must have encryption"

    def test_s3_bucket_versioning_enabled(self, template_resources: Dict[str, Any]):
        """Test S3 buckets have versioning enabled"""
        bucket = template_resources['CloudTrailBucket']
        versioning = bucket['Properties']['VersioningConfiguration']
        assert versioning['Status'] == 'Enabled', \
            "S3 bucket versioning must be enabled"

    def test_eks_logging_enabled(self, template_resources: Dict[str, Any]):
        """Test EKS has all log types enabled"""
        cluster = template_resources['EKSCluster']
        logging = cluster['Properties']['Logging']
        enabled_types = logging['ClusterLogging']['EnabledTypes']

        assert len(enabled_types) == 5, \
            "All 5 EKS log types must be enabled"


class TestResourceTags:
    """Test resource tagging for cost allocation and management"""

    def test_vpc_has_required_tags(self, template_resources: Dict[str, Any]):
        """Test VPC has all required tags"""
        vpc = template_resources['VPC']
        tags = {tag['Key']: tag['Value'] for tag in vpc['Properties']['Tags']}

        required_tags = ['Name', 'Environment', 'Team', 'CostCenter']
        for tag in required_tags:
            assert tag in tags, f"VPC must have {tag} tag"

    def test_subnets_have_tags(self, template_resources: Dict[str, Any]):
        """Test subnets have naming tags"""
        for i in range(1, 4):
            for subnet_type in ['PublicSubnet', 'PrivateSubnet']:
                subnet = template_resources[f'{subnet_type}{i}']
                tags = {tag['Key']: tag['Value'] for tag in subnet['Properties']['Tags']}
                assert 'Name' in tags, f"{subnet_type}{i} must have Name tag"

    def test_eks_cluster_has_tags(self, template_resources: Dict[str, Any]):
        """Test EKS cluster has complete tags"""
        cluster = template_resources['EKSCluster']
        tags = {tag['Key']: tag['Value'] for tag in cluster['Properties']['Tags']}

        required_tags = ['Name', 'Environment', 'Team', 'CostCenter']
        for tag in required_tags:
            assert tag in tags, f"EKS cluster must have {tag} tag"


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short'])
