"""
Unit tests for EKS Cluster CloudFormation template.
Tests template structure, resources, parameters, and outputs.
"""
import json
import os
import pytest


@pytest.fixture
def template():
    """Load the CloudFormation template."""
    template_path = os.path.join(os.path.dirname(__file__), '..', '..', 'lib', 'eks-cluster.json')
    with open(template_path, 'r') as f:
        return json.load(f)


class TestTemplateStructure:
    """Test basic template structure and format."""

    def test_template_format_version(self, template):
        """Verify CloudFormation template version."""
        assert template['AWSTemplateFormatVersion'] == '2010-09-09'

    def test_template_has_description(self, template):
        """Verify template has a description."""
        assert 'Description' in template
        assert len(template['Description']) > 0

    def test_template_has_parameters(self, template):
        """Verify template has parameters section."""
        assert 'Parameters' in template
        assert len(template['Parameters']) > 0

    def test_template_has_resources(self, template):
        """Verify template has resources section."""
        assert 'Resources' in template
        assert len(template['Resources']) == 46

    def test_template_has_outputs(self, template):
        """Verify template has outputs section."""
        assert 'Outputs' in template
        assert len(template['Outputs']) == 9


class TestParameters:
    """Test CloudFormation parameters."""

    def test_environment_suffix_parameter(self, template):
        """Verify EnvironmentSuffix parameter exists and is configured correctly."""
        params = template['Parameters']
        assert 'EnvironmentSuffix' in params

        env_param = params['EnvironmentSuffix']
        assert env_param['Type'] == 'String'
        assert 'Description' in env_param
        assert 'AllowedPattern' in env_param
        assert env_param['AllowedPattern'] == '^[a-z0-9-]+$'

    def test_vpc_cidr_parameter(self, template):
        """Verify VpcCidr parameter exists and has correct default."""
        params = template['Parameters']
        assert 'VpcCidr' in params

        vpc_param = params['VpcCidr']
        assert vpc_param['Type'] == 'String'
        assert vpc_param['Default'] == '10.0.0.0/16'

    def test_eks_version_parameter(self, template):
        """Verify EKSVersion parameter exists and has correct default."""
        params = template['Parameters']
        assert 'EKSVersion' in params

        eks_param = params['EKSVersion']
        assert eks_param['Type'] == 'String'
        assert eks_param['Default'] == '1.28'


class TestKMSResources:
    """Test KMS encryption resources."""

    def test_kms_key_exists(self, template):
        """Verify KMS key resource exists."""
        resources = template['Resources']
        assert 'KMSKey' in resources
        assert resources['KMSKey']['Type'] == 'AWS::KMS::Key'

    def test_kms_key_rotation_enabled(self, template):
        """Verify KMS key rotation is enabled."""
        kms_key = template['Resources']['KMSKey']
        assert kms_key['Properties']['EnableKeyRotation'] is True

    def test_kms_key_has_policy(self, template):
        """Verify KMS key has a key policy."""
        kms_key = template['Resources']['KMSKey']
        assert 'KeyPolicy' in kms_key['Properties']

        policy = kms_key['Properties']['KeyPolicy']
        assert policy['Version'] == '2012-10-17'
        assert 'Statement' in policy
        assert len(policy['Statement']) >= 2

    def test_kms_key_allows_eks(self, template):
        """Verify KMS key policy allows EKS service."""
        kms_key = template['Resources']['KMSKey']
        statements = kms_key['Properties']['KeyPolicy']['Statement']

        eks_statement = next((s for s in statements if s.get('Sid') == 'Allow EKS to use the key'), None)
        assert eks_statement is not None
        assert eks_statement['Effect'] == 'Allow'
        assert eks_statement['Principal']['Service'] == 'eks.amazonaws.com'

    def test_kms_alias_exists(self, template):
        """Verify KMS alias exists and references key."""
        resources = template['Resources']
        assert 'KMSKeyAlias' in resources

        alias = resources['KMSKeyAlias']
        assert alias['Type'] == 'AWS::KMS::Alias'
        assert 'TargetKeyId' in alias['Properties']


class TestVPCResources:
    """Test VPC and networking resources."""

    def test_vpc_exists(self, template):
        """Verify VPC resource exists."""
        resources = template['Resources']
        assert 'VPC' in resources
        assert resources['VPC']['Type'] == 'AWS::EC2::VPC'

    def test_vpc_dns_enabled(self, template):
        """Verify VPC has DNS support enabled."""
        vpc = template['Resources']['VPC']
        props = vpc['Properties']
        assert props['EnableDnsHostnames'] is True
        assert props['EnableDnsSupport'] is True

    def test_internet_gateway_exists(self, template):
        """Verify Internet Gateway exists."""
        resources = template['Resources']
        assert 'InternetGateway' in resources
        assert resources['InternetGateway']['Type'] == 'AWS::EC2::InternetGateway'

    def test_vpc_gateway_attachment_exists(self, template):
        """Verify VPC Gateway Attachment exists."""
        resources = template['Resources']
        assert 'VPCGatewayAttachment' in resources
        assert resources['VPCGatewayAttachment']['Type'] == 'AWS::EC2::VPCGatewayAttachment'


class TestSubnets:
    """Test subnet configuration."""

    def test_private_subnets_exist(self, template):
        """Verify all three private subnets exist."""
        resources = template['Resources']
        assert 'PrivateSubnet1' in resources
        assert 'PrivateSubnet2' in resources
        assert 'PrivateSubnet3' in resources

        for i in range(1, 4):
            subnet = resources[f'PrivateSubnet{i}']
            assert subnet['Type'] == 'AWS::EC2::Subnet'
            assert subnet['Properties']['MapPublicIpOnLaunch'] is False

    def test_public_subnets_exist(self, template):
        """Verify all three public subnets exist."""
        resources = template['Resources']
        assert 'PublicSubnet1' in resources
        assert 'PublicSubnet2' in resources
        assert 'PublicSubnet3' in resources

        for i in range(1, 4):
            subnet = resources[f'PublicSubnet{i}']
            assert subnet['Type'] == 'AWS::EC2::Subnet'
            assert subnet['Properties']['MapPublicIpOnLaunch'] is True

    def test_private_subnet_cidrs(self, template):
        """Verify private subnet CIDR blocks."""
        resources = template['Resources']
        assert resources['PrivateSubnet1']['Properties']['CidrBlock'] == '10.0.1.0/24'
        assert resources['PrivateSubnet2']['Properties']['CidrBlock'] == '10.0.2.0/24'
        assert resources['PrivateSubnet3']['Properties']['CidrBlock'] == '10.0.3.0/24'

    def test_public_subnet_cidrs(self, template):
        """Verify public subnet CIDR blocks."""
        resources = template['Resources']
        assert resources['PublicSubnet1']['Properties']['CidrBlock'] == '10.0.101.0/24'
        assert resources['PublicSubnet2']['Properties']['CidrBlock'] == '10.0.102.0/24'
        assert resources['PublicSubnet3']['Properties']['CidrBlock'] == '10.0.103.0/24'

    def test_private_subnets_have_internal_elb_tag(self, template):
        """Verify private subnets have kubernetes internal-elb tag."""
        resources = template['Resources']
        for i in range(1, 4):
            subnet = resources[f'PrivateSubnet{i}']
            tags = subnet['Properties']['Tags']
            elb_tag = next((t for t in tags if t['Key'] == 'kubernetes.io/role/internal-elb'), None)
            assert elb_tag is not None
            assert elb_tag['Value'] == '1'


class TestNATGateways:
    """Test NAT Gateway configuration."""

    def test_nat_gateways_exist(self, template):
        """Verify all three NAT Gateways exist."""
        resources = template['Resources']
        assert 'NATGateway1' in resources
        assert 'NATGateway2' in resources
        assert 'NATGateway3' in resources

        for i in range(1, 4):
            nat_gw = resources[f'NATGateway{i}']
            assert nat_gw['Type'] == 'AWS::EC2::NatGateway'

    def test_nat_gateway_eips_exist(self, template):
        """Verify Elastic IPs for NAT Gateways exist."""
        resources = template['Resources']
        assert 'NATGateway1EIP' in resources
        assert 'NATGateway2EIP' in resources
        assert 'NATGateway3EIP' in resources

        for i in range(1, 4):
            eip = resources[f'NATGateway{i}EIP']
            assert eip['Type'] == 'AWS::EC2::EIP'
            assert eip['Properties']['Domain'] == 'vpc'

    def test_nat_gateway_eips_depend_on_igw_attachment(self, template):
        """Verify EIPs depend on VPC Gateway Attachment."""
        resources = template['Resources']
        for i in range(1, 4):
            eip = resources[f'NATGateway{i}EIP']
            assert 'DependsOn' in eip
            assert eip['DependsOn'] == 'VPCGatewayAttachment'


class TestRouteTables:
    """Test route table configuration."""

    def test_public_route_table_exists(self, template):
        """Verify public route table exists."""
        resources = template['Resources']
        assert 'PublicRouteTable' in resources
        assert resources['PublicRouteTable']['Type'] == 'AWS::EC2::RouteTable'

    def test_private_route_tables_exist(self, template):
        """Verify all three private route tables exist."""
        resources = template['Resources']
        assert 'PrivateRouteTable1' in resources
        assert 'PrivateRouteTable2' in resources
        assert 'PrivateRouteTable3' in resources

        for i in range(1, 4):
            rt = resources[f'PrivateRouteTable{i}']
            assert rt['Type'] == 'AWS::EC2::RouteTable'

    def test_public_route_exists(self, template):
        """Verify public route to IGW exists."""
        resources = template['Resources']
        assert 'PublicRoute' in resources

        route = resources['PublicRoute']
        assert route['Type'] == 'AWS::EC2::Route'
        assert route['Properties']['DestinationCidrBlock'] == '0.0.0.0/0'

    def test_private_routes_exist(self, template):
        """Verify private routes to NAT Gateways exist."""
        resources = template['Resources']
        for i in range(1, 4):
            assert f'PrivateRoute{i}' in resources
            route = resources[f'PrivateRoute{i}']
            assert route['Type'] == 'AWS::EC2::Route'
            assert route['Properties']['DestinationCidrBlock'] == '0.0.0.0/0'

    def test_subnet_route_table_associations(self, template):
        """Verify all subnets are associated with route tables."""
        resources = template['Resources']

        # Public subnets
        for i in range(1, 4):
            assert f'PublicSubnet{i}RouteTableAssociation' in resources

        # Private subnets
        for i in range(1, 4):
            assert f'PrivateSubnet{i}RouteTableAssociation' in resources


class TestSecurityGroups:
    """Test security group configuration."""

    def test_cluster_security_group_exists(self, template):
        """Verify cluster security group exists."""
        resources = template['Resources']
        assert 'ClusterSecurityGroup' in resources

        sg = resources['ClusterSecurityGroup']
        assert sg['Type'] == 'AWS::EC2::SecurityGroup'
        assert 'GroupDescription' in sg['Properties']

    def test_node_security_group_exists(self, template):
        """Verify node security group exists."""
        resources = template['Resources']
        assert 'NodeSecurityGroup' in resources

        sg = resources['NodeSecurityGroup']
        assert sg['Type'] == 'AWS::EC2::SecurityGroup'

    def test_security_group_ingress_rules(self, template):
        """Verify security group ingress rules exist."""
        resources = template['Resources']
        assert 'ClusterSecurityGroupIngressFromNodes' in resources
        assert 'NodeSecurityGroupIngressFromCluster' in resources
        assert 'NodeSecurityGroupIngressFromSelf' in resources

    def test_cluster_sg_allows_nodes_on_443(self, template):
        """Verify cluster SG allows nodes on port 443."""
        resources = template['Resources']
        ingress = resources['ClusterSecurityGroupIngressFromNodes']

        props = ingress['Properties']
        assert props['IpProtocol'] == 'tcp'
        assert props['FromPort'] == 443
        assert props['ToPort'] == 443


class TestIAMRoles:
    """Test IAM role configuration."""

    def test_cluster_role_exists(self, template):
        """Verify EKS cluster role exists."""
        resources = template['Resources']
        assert 'EKSClusterRole' in resources

        role = resources['EKSClusterRole']
        assert role['Type'] == 'AWS::IAM::Role'

    def test_cluster_role_has_eks_policies(self, template):
        """Verify cluster role has required EKS policies."""
        resources = template['Resources']
        role = resources['EKSClusterRole']

        policies = role['Properties']['ManagedPolicyArns']
        assert 'arn:aws:iam::aws:policy/AmazonEKSClusterPolicy' in policies
        assert 'arn:aws:iam::aws:policy/AmazonEKSVPCResourceController' in policies

    def test_node_role_exists(self, template):
        """Verify node instance role exists."""
        resources = template['Resources']
        assert 'NodeInstanceRole' in resources

        role = resources['NodeInstanceRole']
        assert role['Type'] == 'AWS::IAM::Role'

    def test_node_role_has_required_policies(self, template):
        """Verify node role has required policies."""
        resources = template['Resources']
        role = resources['NodeInstanceRole']

        policies = role['Properties']['ManagedPolicyArns']
        assert 'arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy' in policies
        assert 'arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy' in policies
        assert 'arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly' in policies
        assert 'arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore' in policies

    def test_node_instance_profile_exists(self, template):
        """Verify node instance profile exists."""
        resources = template['Resources']
        assert 'NodeInstanceProfile' in resources

        profile = resources['NodeInstanceProfile']
        assert profile['Type'] == 'AWS::IAM::InstanceProfile'


class TestEKSCluster:
    """Test EKS cluster configuration."""

    def test_eks_cluster_exists(self, template):
        """Verify EKS cluster resource exists."""
        resources = template['Resources']
        assert 'EKSCluster' in resources

        cluster = resources['EKSCluster']
        assert cluster['Type'] == 'AWS::EKS::Cluster'

    def test_eks_cluster_version(self, template):
        """Verify EKS cluster uses parameter for version."""
        resources = template['Resources']
        cluster = resources['EKSCluster']

        assert 'Version' in cluster['Properties']
        assert 'Ref' in cluster['Properties']['Version']
        assert cluster['Properties']['Version']['Ref'] == 'EKSVersion'

    def test_eks_cluster_private_endpoint(self, template):
        """Verify EKS cluster has private endpoint enabled."""
        resources = template['Resources']
        cluster = resources['EKSCluster']

        vpc_config = cluster['Properties']['ResourcesVpcConfig']
        assert vpc_config['EndpointPrivateAccess'] is True
        assert vpc_config['EndpointPublicAccess'] is False

    def test_eks_cluster_encryption_enabled(self, template):
        """Verify EKS cluster has encryption enabled."""
        resources = template['Resources']
        cluster = resources['EKSCluster']

        assert 'EncryptionConfig' in cluster['Properties']
        enc_config = cluster['Properties']['EncryptionConfig']
        assert len(enc_config) > 0
        assert 'secrets' in enc_config[0]['Resources']

    def test_eks_cluster_logging_enabled(self, template):
        """Verify EKS cluster has logging enabled."""
        resources = template['Resources']
        cluster = resources['EKSCluster']

        logging = cluster['Properties']['Logging']['ClusterLogging']
        enabled_types = logging['EnabledTypes']

        log_types = {t['Type'] for t in enabled_types}
        assert 'api' in log_types
        assert 'audit' in log_types
        assert 'authenticator' in log_types
        assert 'controllerManager' in log_types
        assert 'scheduler' in log_types

    def test_cloudwatch_log_group_exists(self, template):
        """Verify CloudWatch log group exists."""
        resources = template['Resources']
        assert 'CloudWatchLogGroup' in resources

        log_group = resources['CloudWatchLogGroup']
        assert log_group['Type'] == 'AWS::Logs::LogGroup'
        assert log_group['Properties']['RetentionInDays'] == 7


class TestOIDCProvider:
    """Test OIDC provider for IRSA."""

    def test_oidc_provider_exists(self, template):
        """Verify OIDC provider exists."""
        resources = template['Resources']
        assert 'OIDCProvider' in resources

        oidc = resources['OIDCProvider']
        assert oidc['Type'] == 'AWS::IAM::OIDCProvider'

    def test_oidc_provider_client_id(self, template):
        """Verify OIDC provider has correct client ID."""
        resources = template['Resources']
        oidc = resources['OIDCProvider']

        assert 'ClientIdList' in oidc['Properties']
        assert 'sts.amazonaws.com' in oidc['Properties']['ClientIdList']

    def test_oidc_provider_thumbprint(self, template):
        """Verify OIDC provider has thumbprint."""
        resources = template['Resources']
        oidc = resources['OIDCProvider']

        assert 'ThumbprintList' in oidc['Properties']
        assert len(oidc['Properties']['ThumbprintList']) > 0


class TestManagedNodeGroup:
    """Test managed node group configuration."""

    def test_managed_node_group_exists(self, template):
        """Verify managed node group exists."""
        resources = template['Resources']
        assert 'ManagedNodeGroup' in resources

        ng = resources['ManagedNodeGroup']
        assert ng['Type'] == 'AWS::EKS::Nodegroup'

    def test_managed_node_group_scaling(self, template):
        """Verify managed node group scaling configuration."""
        resources = template['Resources']
        ng = resources['ManagedNodeGroup']

        scaling = ng['Properties']['ScalingConfig']
        assert scaling['MinSize'] == 2
        assert scaling['MaxSize'] == 6
        assert scaling['DesiredSize'] == 2

    def test_managed_node_group_instance_type(self, template):
        """Verify managed node group instance type."""
        resources = template['Resources']
        ng = resources['ManagedNodeGroup']

        assert 't3.large' in ng['Properties']['InstanceTypes']

    def test_managed_node_group_ami_type(self, template):
        """Verify managed node group uses correct AMI type."""
        resources = template['Resources']
        ng = resources['ManagedNodeGroup']

        assert ng['Properties']['AmiType'] == 'AL2_x86_64'

    def test_managed_node_launch_template_exists(self, template):
        """Verify managed node launch template exists."""
        resources = template['Resources']
        assert 'ManagedNodeLaunchTemplate' in resources

        lt = resources['ManagedNodeLaunchTemplate']
        assert lt['Type'] == 'AWS::EC2::LaunchTemplate'

    def test_managed_node_launch_template_metadata(self, template):
        """Verify managed node launch template has IMDSv2 required."""
        resources = template['Resources']
        lt = resources['ManagedNodeLaunchTemplate']

        metadata = lt['Properties']['LaunchTemplateData']['MetadataOptions']
        assert metadata['HttpTokens'] == 'required'
        assert metadata['HttpPutResponseHopLimit'] == 1


class TestSelfManagedNodeGroup:
    """Test self-managed node group configuration."""

    def test_self_managed_launch_template_exists(self, template):
        """Verify self-managed launch template exists."""
        resources = template['Resources']
        assert 'SelfManagedNodeLaunchTemplate' in resources

        lt = resources['SelfManagedNodeLaunchTemplate']
        assert lt['Type'] == 'AWS::EC2::LaunchTemplate'

    def test_self_managed_launch_template_instance_type(self, template):
        """Verify self-managed launch template instance type."""
        resources = template['Resources']
        lt = resources['SelfManagedNodeLaunchTemplate']

        assert lt['Properties']['LaunchTemplateData']['InstanceType'] == 'm5.xlarge'

    def test_self_managed_launch_template_uses_optimized_ami(self, template):
        """Verify self-managed launch template uses EKS-optimized AMI."""
        resources = template['Resources']
        lt = resources['SelfManagedNodeLaunchTemplate']

        image_id = lt['Properties']['LaunchTemplateData']['ImageId']
        assert 'Fn::Sub' in image_id
        assert 'ssm' in image_id['Fn::Sub'].lower()
        assert 'eks' in image_id['Fn::Sub'].lower()

    def test_self_managed_launch_template_user_data(self, template):
        """Verify self-managed launch template has bootstrap script."""
        resources = template['Resources']
        lt = resources['SelfManagedNodeLaunchTemplate']

        assert 'UserData' in lt['Properties']['LaunchTemplateData']
        user_data = lt['Properties']['LaunchTemplateData']['UserData']
        assert 'Fn::Base64' in user_data

    def test_self_managed_launch_template_metadata(self, template):
        """Verify self-managed launch template has IMDSv2 required."""
        resources = template['Resources']
        lt = resources['SelfManagedNodeLaunchTemplate']

        metadata = lt['Properties']['LaunchTemplateData']['MetadataOptions']
        assert metadata['HttpTokens'] == 'required'
        assert metadata['HttpPutResponseHopLimit'] == 1

    def test_self_managed_asg_exists(self, template):
        """Verify self-managed Auto Scaling Group exists."""
        resources = template['Resources']
        assert 'SelfManagedNodeAutoScalingGroup' in resources

        asg = resources['SelfManagedNodeAutoScalingGroup']
        assert asg['Type'] == 'AWS::AutoScaling::AutoScalingGroup'

    def test_self_managed_asg_scaling(self, template):
        """Verify self-managed ASG scaling configuration."""
        resources = template['Resources']
        asg = resources['SelfManagedNodeAutoScalingGroup']

        props = asg['Properties']
        assert props['MinSize'] == '1'
        assert props['MaxSize'] == '4'
        assert props['DesiredCapacity'] == '2'


class TestResourceTags:
    """Test resource tagging."""

    def test_resources_have_environment_suffix_in_tags(self, template):
        """Verify resources use EnvironmentSuffix parameter in tags."""
        resources = template['Resources']

        # Check a sample of resources that should have Name tags with EnvironmentSuffix
        resources_to_check = ['KMSKey', 'VPC', 'EKSCluster', 'NodeSecurityGroup']

        for resource_name in resources_to_check:
            assert resource_name in resources
            resource = resources[resource_name]
            assert 'Tags' in resource['Properties']
            tags = resource['Properties']['Tags']
            name_tag = next((t for t in tags if t['Key'] == 'Name'), None)
            assert name_tag is not None
            assert 'Fn::Sub' in name_tag['Value']

    def test_no_hardcoded_environment_values(self, template):
        """Verify no hardcoded 'Production' values in Environment tags."""
        resources = template['Resources']
        hardcoded_values = []

        def check_for_hardcoded_env(obj, path=""):
            if isinstance(obj, dict):
                # Check if this is an Environment tag with hardcoded value
                if obj.get('Key') == 'Environment':
                    value = obj.get('Value')
                    # Value should be a dict with Fn::Sub, not a hardcoded string
                    if isinstance(value, str) and value.lower() in ['production', 'prod', 'staging', 'stage', 'dev', 'development']:
                        hardcoded_values.append((path, value))

                for key, val in obj.items():
                    check_for_hardcoded_env(val, f"{path}.{key}")
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    check_for_hardcoded_env(item, f"{path}[{i}]")

        check_for_hardcoded_env(resources, "Resources")
        assert len(hardcoded_values) == 0, f"Hardcoded environment values found: {hardcoded_values}"

    def test_hardcoded_environment_detection(self):
        """Test the hardcoded environment detection logic."""
        # Create a mock template with hardcoded environment value
        mock_template = {
            "Resources": {
                "TestResource": {
                    "Properties": {
                        "Tags": [
                            {"Key": "Environment", "Value": "Production"}
                        ]
                    }
                }
            }
        }

        hardcoded_values = []

        def check_for_hardcoded_env(obj, path=""):
            if isinstance(obj, dict):
                if obj.get('Key') == 'Environment':
                    value = obj.get('Value')
                    if isinstance(value, str) and value.lower() in ['production', 'prod', 'staging', 'stage', 'dev', 'development']:
                        hardcoded_values.append((path, value))
                for key, val in obj.items():
                    check_for_hardcoded_env(val, f"{path}.{key}")
            elif isinstance(obj, list):
                for i, item in enumerate(obj):
                    check_for_hardcoded_env(item, f"{path}[{i}]")

        check_for_hardcoded_env(mock_template["Resources"], "Resources")

        # This should detect the hardcoded value
        assert len(hardcoded_values) == 1
        assert hardcoded_values[0][1] == "Production"


class TestOutputs:
    """Test CloudFormation outputs."""

    def test_cluster_name_output(self, template):
        """Verify ClusterName output exists."""
        outputs = template['Outputs']
        assert 'ClusterName' in outputs
        assert 'Description' in outputs['ClusterName']
        assert 'Value' in outputs['ClusterName']

    def test_cluster_arn_output(self, template):
        """Verify ClusterArn output exists."""
        outputs = template['Outputs']
        assert 'ClusterArn' in outputs

    def test_cluster_endpoint_output(self, template):
        """Verify ClusterEndpoint output exists."""
        outputs = template['Outputs']
        assert 'ClusterEndpoint' in outputs

    def test_oidc_provider_arn_output(self, template):
        """Verify OIDCProviderArn output exists."""
        outputs = template['Outputs']
        assert 'OIDCProviderArn' in outputs

    def test_vpc_id_output(self, template):
        """Verify VpcId output exists."""
        outputs = template['Outputs']
        assert 'VpcId' in outputs

    def test_private_subnet_ids_output(self, template):
        """Verify PrivateSubnetIds output exists."""
        outputs = template['Outputs']
        assert 'PrivateSubnetIds' in outputs

    def test_node_security_group_output(self, template):
        """Verify NodeSecurityGroupId output exists."""
        outputs = template['Outputs']
        assert 'NodeSecurityGroupId' in outputs

    def test_managed_node_group_output(self, template):
        """Verify ManagedNodeGroupName output exists."""
        outputs = template['Outputs']
        assert 'ManagedNodeGroupName' in outputs

    def test_kms_key_output(self, template):
        """Verify KMSKeyId output exists."""
        outputs = template['Outputs']
        assert 'KMSKeyId' in outputs


class TestResourceDependencies:
    """Test resource dependencies."""

    def test_cluster_depends_on_log_group(self, template):
        """Verify EKS cluster depends on CloudWatch log group."""
        resources = template['Resources']
        cluster = resources['EKSCluster']

        assert 'DependsOn' in cluster
        assert 'CloudWatchLogGroup' in cluster['DependsOn']

    def test_eips_depend_on_gateway_attachment(self, template):
        """Verify EIPs depend on VPC Gateway Attachment."""
        resources = template['Resources']

        for i in range(1, 4):
            eip = resources[f'NATGateway{i}EIP']
            assert 'DependsOn' in eip
            assert eip['DependsOn'] == 'VPCGatewayAttachment'

    def test_public_route_depends_on_gateway_attachment(self, template):
        """Verify public route depends on VPC Gateway Attachment."""
        resources = template['Resources']
        route = resources['PublicRoute']

        assert 'DependsOn' in route
        assert route['DependsOn'] == 'VPCGatewayAttachment'
