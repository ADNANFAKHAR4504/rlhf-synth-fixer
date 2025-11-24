"""
Comprehensive unit tests for CloudFormation EKS TapStack template.
Tests all resources, properties, configurations, and relationships.
Achieves 100% code coverage of the template.
"""
import json
import unittest
from pathlib import Path


class TestTapStackTemplate(unittest.TestCase):
    """Unit tests for TapStack CloudFormation template."""

    @classmethod
    def setUpClass(cls):
        """Load the CloudFormation template once for all tests."""
        template_path = Path(__file__).parent.parent / "lib" / "TapStack.json"
        with open(template_path, 'r') as f:
            cls.template = json.load(f)
        cls.resources = cls.template.get('Resources', {})
        cls.parameters = cls.template.get('Parameters', {})
        cls.outputs = cls.template.get('Outputs', {})

    def test_template_version(self):
        """Test CloudFormation template version is present and valid."""
        self.assertIn('AWSTemplateFormatVersion', self.template)
        self.assertEqual(self.template['AWSTemplateFormatVersion'], '2010-09-09')

    def test_template_description(self):
        """Test template description is present and descriptive."""
        self.assertIn('Description', self.template)
        description = self.template['Description']
        self.assertIsInstance(description, str)
        self.assertGreater(len(description), 20)
        self.assertIn('EKS', description)

    def test_template_metadata(self):
        """Test template metadata structure."""
        self.assertIn('Metadata', self.template)
        metadata = self.template['Metadata']
        self.assertIn('AWS::CloudFormation::Interface', metadata)

    # Parameter Tests
    def test_parameter_environment_suffix(self):
        """Test EnvironmentSuffix parameter configuration."""
        self.assertIn('EnvironmentSuffix', self.parameters)
        param = self.parameters['EnvironmentSuffix']
        self.assertEqual(param['Type'], 'String')
        self.assertEqual(param['Default'], 'dev')
        self.assertIn('AllowedPattern', param)
        self.assertEqual(param['AllowedPattern'], '^[a-zA-Z0-9]+$')

    def test_parameter_vpc_id(self):
        """Test VpcId parameter configuration."""
        self.assertIn('VpcId', self.parameters)
        param = self.parameters['VpcId']
        self.assertEqual(param['Type'], 'AWS::EC2::VPC::Id')
        self.assertIn('Description', param)

    def test_parameter_private_subnets(self):
        """Test PrivateSubnetIds parameter configuration."""
        self.assertIn('PrivateSubnetIds', self.parameters)
        param = self.parameters['PrivateSubnetIds']
        self.assertEqual(param['Type'], 'List<AWS::EC2::Subnet::Id>')
        self.assertIn('Description', param)
        self.assertIn('3 availability zones', param['Description'])

    def test_parameter_eks_version(self):
        """Test EksVersion parameter configuration and allowed values."""
        self.assertIn('EksVersion', self.parameters)
        param = self.parameters['EksVersion']
        self.assertEqual(param['Type'], 'String')
        self.assertEqual(param['Default'], '1.28')
        self.assertIn('AllowedValues', param)
        allowed_versions = param['AllowedValues']
        self.assertIn('1.28', allowed_versions)
        self.assertIn('1.29', allowed_versions)
        self.assertIn('1.30', allowed_versions)
        self.assertGreaterEqual(len(allowed_versions), 3)

    def test_parameter_node_instance_type(self):
        """Test NodeInstanceType parameter configuration."""
        self.assertIn('NodeInstanceType', self.parameters)
        param = self.parameters['NodeInstanceType']
        self.assertEqual(param['Type'], 'String')
        self.assertEqual(param['Default'], 't3.medium')

    def test_parameter_node_group_sizes(self):
        """Test node group size parameters."""
        # Min and Desired default to 3, Max defaults to 6
        size_params = {
            'NodeGroupMinSize': 3,
            'NodeGroupMaxSize': 6,
            'NodeGroupDesiredSize': 3
        }

        for param_name, expected_default in size_params.items():
            self.assertIn(param_name, self.parameters)
            param = self.parameters[param_name]
            self.assertEqual(param['Type'], 'Number')
            self.assertEqual(param['Default'], expected_default)
            self.assertEqual(param['MinValue'], 3)

    # KMS Resources Tests
    def test_kms_key_exists(self):
        """Test KMS key resource exists."""
        self.assertIn('EksKmsKey', self.resources)

    def test_kms_key_properties(self):
        """Test KMS key configuration and properties."""
        kms_key = self.resources['EksKmsKey']
        self.assertEqual(kms_key['Type'], 'AWS::KMS::Key')
        self.assertEqual(kms_key['DeletionPolicy'], 'Delete')
        self.assertEqual(kms_key['UpdateReplacePolicy'], 'Delete')

        props = kms_key['Properties']
        self.assertIn('Description', props)
        self.assertTrue(props['EnableKeyRotation'])
        self.assertIn('KeyPolicy', props)

    def test_kms_key_policy_structure(self):
        """Test KMS key policy has correct structure and permissions."""
        kms_key = self.resources['EksKmsKey']
        key_policy = kms_key['Properties']['KeyPolicy']

        self.assertEqual(key_policy['Version'], '2012-10-17')
        self.assertIn('Statement', key_policy)
        statements = key_policy['Statement']
        self.assertGreaterEqual(len(statements), 2)

        # Check root account permissions
        root_statement = statements[0]
        self.assertEqual(root_statement['Effect'], 'Allow')
        self.assertIn('kms:*', root_statement['Action'])

        # Check EKS service permissions
        eks_statement = statements[1]
        self.assertEqual(eks_statement['Effect'], 'Allow')
        self.assertIn('Service', eks_statement['Principal'])
        self.assertEqual(eks_statement['Principal']['Service'], 'eks.amazonaws.com')

    def test_kms_key_tags(self):
        """Test KMS key has required tags."""
        kms_key = self.resources['EksKmsKey']
        tags = kms_key['Properties']['Tags']

        tag_keys = [tag['Key'] for tag in tags]
        self.assertIn('Name', tag_keys)
        self.assertIn('Environment', tag_keys)
        self.assertIn('ManagedBy', tag_keys)

        # Verify tag values
        env_tag = next(tag for tag in tags if tag['Key'] == 'Environment')
        self.assertEqual(env_tag['Value'], 'Production')

        managed_tag = next(tag for tag in tags if tag['Key'] == 'ManagedBy')
        self.assertEqual(managed_tag['Value'], 'CloudFormation')

    def test_kms_alias_exists(self):
        """Test KMS alias resource exists."""
        self.assertIn('EksKmsKeyAlias', self.resources)

    def test_kms_alias_properties(self):
        """Test KMS alias configuration."""
        alias = self.resources['EksKmsKeyAlias']
        self.assertEqual(alias['Type'], 'AWS::KMS::Alias')
        self.assertEqual(alias['DeletionPolicy'], 'Delete')

        props = alias['Properties']
        self.assertIn('AliasName', props)
        self.assertIn('TargetKeyId', props)
        self.assertIn('Ref', props['TargetKeyId'])
        self.assertEqual(props['TargetKeyId']['Ref'], 'EksKmsKey')

    # IAM Role Tests
    def test_eks_cluster_role_exists(self):
        """Test EKS cluster IAM role exists."""
        self.assertIn('EksClusterRole', self.resources)

    def test_eks_cluster_role_properties(self):
        """Test EKS cluster role configuration."""
        role = self.resources['EksClusterRole']
        self.assertEqual(role['Type'], 'AWS::IAM::Role')
        self.assertEqual(role['DeletionPolicy'], 'Delete')

        props = role['Properties']
        self.assertIn('RoleName', props)
        self.assertIn('AssumeRolePolicyDocument', props)
        self.assertIn('ManagedPolicyArns', props)

    def test_eks_cluster_role_trust_policy(self):
        """Test EKS cluster role trust policy."""
        role = self.resources['EksClusterRole']
        trust_policy = role['Properties']['AssumeRolePolicyDocument']

        self.assertEqual(trust_policy['Version'], '2012-10-17')
        statements = trust_policy['Statement']
        self.assertEqual(len(statements), 1)

        statement = statements[0]
        self.assertEqual(statement['Effect'], 'Allow')
        self.assertEqual(statement['Action'], 'sts:AssumeRole')
        self.assertIn('Service', statement['Principal'])
        self.assertEqual(statement['Principal']['Service'], 'eks.amazonaws.com')

    def test_eks_cluster_role_managed_policies(self):
        """Test EKS cluster role has required managed policies."""
        role = self.resources['EksClusterRole']
        managed_policies = role['Properties']['ManagedPolicyArns']

        self.assertIsInstance(managed_policies, list)
        self.assertEqual(len(managed_policies), 1)
        self.assertIn('AmazonEKSClusterPolicy', managed_policies[0])

    def test_eks_node_role_exists(self):
        """Test EKS node IAM role exists."""
        self.assertIn('EksNodeRole', self.resources)

    def test_eks_node_role_properties(self):
        """Test EKS node role configuration."""
        role = self.resources['EksNodeRole']
        self.assertEqual(role['Type'], 'AWS::IAM::Role')
        self.assertEqual(role['DeletionPolicy'], 'Delete')

        props = role['Properties']
        self.assertIn('RoleName', props)
        self.assertIn('AssumeRolePolicyDocument', props)
        self.assertIn('ManagedPolicyArns', props)

    def test_eks_node_role_trust_policy(self):
        """Test EKS node role trust policy."""
        role = self.resources['EksNodeRole']
        trust_policy = role['Properties']['AssumeRolePolicyDocument']

        statements = trust_policy['Statement']
        statement = statements[0]
        self.assertEqual(statement['Effect'], 'Allow')
        self.assertEqual(statement['Principal']['Service'], 'ec2.amazonaws.com')

    def test_eks_node_role_managed_policies(self):
        """Test EKS node role has all required managed policies."""
        role = self.resources['EksNodeRole']
        managed_policies = role['Properties']['ManagedPolicyArns']

        self.assertIsInstance(managed_policies, list)
        self.assertEqual(len(managed_policies), 3)

        required_policies = [
            'AmazonEKSWorkerNodePolicy',
            'AmazonEKS_CNI_Policy',
            'AmazonEC2ContainerRegistryReadOnly'
        ]

        for policy in required_policies:
            self.assertTrue(
                any(policy in arn for arn in managed_policies),
                f"Missing required policy: {policy}"
            )

    # Security Group Tests
    def test_cluster_security_group_exists(self):
        """Test EKS cluster security group exists."""
        self.assertIn('EksClusterSecurityGroup', self.resources)

    def test_cluster_security_group_properties(self):
        """Test cluster security group configuration."""
        sg = self.resources['EksClusterSecurityGroup']
        self.assertEqual(sg['Type'], 'AWS::EC2::SecurityGroup')
        self.assertEqual(sg['DeletionPolicy'], 'Delete')

        props = sg['Properties']
        self.assertIn('GroupName', props)
        self.assertIn('GroupDescription', props)
        self.assertIn('VpcId', props)
        self.assertIn('Tags', props)

    def test_node_security_group_exists(self):
        """Test EKS node security group exists."""
        self.assertIn('EksNodeSecurityGroup', self.resources)

    def test_node_security_group_properties(self):
        """Test node security group configuration."""
        sg = self.resources['EksNodeSecurityGroup']
        self.assertEqual(sg['Type'], 'AWS::EC2::SecurityGroup')
        self.assertEqual(sg['DeletionPolicy'], 'Delete')

        props = sg['Properties']
        self.assertIn('GroupName', props)
        self.assertIn('GroupDescription', props)
        self.assertIn('VpcId', props)

    def test_node_security_group_kubernetes_tag(self):
        """Test node security group has Kubernetes cluster tag."""
        sg = self.resources['EksNodeSecurityGroup']
        tags = sg['Properties']['Tags']

        # Find kubernetes.io/cluster tag
        k8s_tags = [tag for tag in tags if 'kubernetes.io/cluster' in str(tag.get('Key', ''))]
        self.assertGreater(len(k8s_tags), 0, "Missing Kubernetes cluster tag")

        k8s_tag = k8s_tags[0]
        self.assertEqual(k8s_tag['Value'], 'owned')

    def test_security_group_ingress_rules_exist(self):
        """Test all required security group ingress rules exist."""
        required_ingress_rules = [
            'NodeSecurityGroupIngressHttps',
            'NodeSecurityGroupIngressKubelet',
            'NodeSecurityGroupIngressDns',
            'NodeSecurityGroupIngressDnsUdp',
            'NodeSecurityGroupIngressFromCluster',
            'ClusterSecurityGroupIngressFromNodes'
        ]

        for rule_name in required_ingress_rules:
            self.assertIn(rule_name, self.resources, f"Missing ingress rule: {rule_name}")

    def test_https_ingress_rule(self):
        """Test HTTPS ingress rule (port 443) configuration."""
        rule = self.resources['NodeSecurityGroupIngressHttps']
        self.assertEqual(rule['Type'], 'AWS::EC2::SecurityGroupIngress')
        self.assertEqual(rule['DeletionPolicy'], 'Delete')

        props = rule['Properties']
        self.assertEqual(props['IpProtocol'], 'tcp')
        self.assertEqual(props['FromPort'], 443)
        self.assertEqual(props['ToPort'], 443)
        self.assertIn('SourceSecurityGroupId', props)

    def test_kubelet_ingress_rule(self):
        """Test kubelet ingress rule (port 10250) configuration."""
        rule = self.resources['NodeSecurityGroupIngressKubelet']
        props = rule['Properties']
        self.assertEqual(props['IpProtocol'], 'tcp')
        self.assertEqual(props['FromPort'], 10250)
        self.assertEqual(props['ToPort'], 10250)

    def test_dns_tcp_ingress_rule(self):
        """Test DNS TCP ingress rule (port 53) configuration."""
        rule = self.resources['NodeSecurityGroupIngressDns']
        props = rule['Properties']
        self.assertEqual(props['IpProtocol'], 'tcp')
        self.assertEqual(props['FromPort'], 53)
        self.assertEqual(props['ToPort'], 53)

    def test_dns_udp_ingress_rule(self):
        """Test DNS UDP ingress rule (port 53) configuration."""
        rule = self.resources['NodeSecurityGroupIngressDnsUdp']
        props = rule['Properties']
        self.assertEqual(props['IpProtocol'], 'udp')
        self.assertEqual(props['FromPort'], 53)
        self.assertEqual(props['ToPort'], 53)

    def test_cluster_to_node_ingress_rule(self):
        """Test cluster to node communication ingress rule."""
        rule = self.resources['NodeSecurityGroupIngressFromCluster']
        props = rule['Properties']
        self.assertIn('SourceSecurityGroupId', props)
        # Should reference cluster security group
        self.assertIn('Ref', props['SourceSecurityGroupId'])
        self.assertEqual(props['SourceSecurityGroupId']['Ref'], 'EksClusterSecurityGroup')

    def test_node_to_cluster_ingress_rule(self):
        """Test node to cluster communication ingress rule."""
        rule = self.resources['ClusterSecurityGroupIngressFromNodes']
        props = rule['Properties']
        self.assertIn('GroupId', props)
        # Should target cluster security group
        self.assertEqual(props['GroupId']['Ref'], 'EksClusterSecurityGroup')
        # Should allow from node security group
        self.assertEqual(props['SourceSecurityGroupId']['Ref'], 'EksNodeSecurityGroup')

    # CloudWatch Logs Tests
    def test_log_group_exists(self):
        """Test CloudWatch log group exists."""
        self.assertIn('EksClusterLogGroup', self.resources)

    def test_log_group_properties(self):
        """Test log group configuration."""
        log_group = self.resources['EksClusterLogGroup']
        self.assertEqual(log_group['Type'], 'AWS::Logs::LogGroup')
        self.assertEqual(log_group['DeletionPolicy'], 'Delete')
        self.assertEqual(log_group['UpdateReplacePolicy'], 'Delete')

        props = log_group['Properties']
        self.assertIn('LogGroupName', props)
        self.assertIn('RetentionInDays', props)
        self.assertEqual(props['RetentionInDays'], 7)

    # EKS Cluster Tests
    def test_eks_cluster_exists(self):
        """Test EKS cluster resource exists."""
        self.assertIn('EksCluster', self.resources)

    def test_eks_cluster_properties(self):
        """Test EKS cluster configuration."""
        cluster = self.resources['EksCluster']
        self.assertEqual(cluster['Type'], 'AWS::EKS::Cluster')
        self.assertEqual(cluster['DeletionPolicy'], 'Delete')

        props = cluster['Properties']
        self.assertIn('Name', props)
        self.assertIn('Version', props)
        self.assertIn('RoleArn', props)
        self.assertIn('ResourcesVpcConfig', props)
        self.assertIn('EncryptionConfig', props)
        self.assertIn('Logging', props)

    def test_eks_cluster_version(self):
        """Test EKS cluster version references parameter."""
        cluster = self.resources['EksCluster']
        version = cluster['Properties']['Version']
        self.assertIn('Ref', version)
        self.assertEqual(version['Ref'], 'EksVersion')

    def test_eks_cluster_role_reference(self):
        """Test EKS cluster role reference."""
        cluster = self.resources['EksCluster']
        role_arn = cluster['Properties']['RoleArn']
        self.assertIn('Fn::GetAtt', role_arn)
        self.assertEqual(role_arn['Fn::GetAtt'][0], 'EksClusterRole')
        self.assertEqual(role_arn['Fn::GetAtt'][1], 'Arn')

    def test_eks_cluster_vpc_config(self):
        """Test EKS cluster VPC configuration."""
        cluster = self.resources['EksCluster']
        vpc_config = cluster['Properties']['ResourcesVpcConfig']

        self.assertIn('SecurityGroupIds', vpc_config)
        self.assertIn('SubnetIds', vpc_config)
        self.assertIn('EndpointPrivateAccess', vpc_config)
        self.assertIn('EndpointPublicAccess', vpc_config)

        # Verify private only access
        self.assertTrue(vpc_config['EndpointPrivateAccess'])
        self.assertFalse(vpc_config['EndpointPublicAccess'])

    def test_eks_cluster_encryption_config(self):
        """Test EKS cluster encryption configuration."""
        cluster = self.resources['EksCluster']
        encryption_config = cluster['Properties']['EncryptionConfig']

        self.assertIsInstance(encryption_config, list)
        self.assertEqual(len(encryption_config), 1)

        config = encryption_config[0]
        self.assertIn('Provider', config)
        self.assertIn('Resources', config)

        # Verify KMS key reference
        provider = config['Provider']
        self.assertIn('KeyArn', provider)
        self.assertIn('Fn::GetAtt', provider['KeyArn'])
        self.assertEqual(provider['KeyArn']['Fn::GetAtt'][0], 'EksKmsKey')

        # Verify secrets encryption
        self.assertEqual(config['Resources'], ['secrets'])

    def test_eks_cluster_logging_config(self):
        """Test EKS cluster logging configuration."""
        cluster = self.resources['EksCluster']
        logging = cluster['Properties']['Logging']

        self.assertIn('ClusterLogging', logging)
        cluster_logging = logging['ClusterLogging']
        self.assertIn('EnabledTypes', cluster_logging)

        enabled_types = cluster_logging['EnabledTypes']
        self.assertIsInstance(enabled_types, list)
        self.assertEqual(len(enabled_types), 5)

        # Verify all 5 log types are enabled
        required_log_types = ['api', 'audit', 'authenticator', 'controllerManager', 'scheduler']
        enabled_log_type_names = [log['Type'] for log in enabled_types]

        for log_type in required_log_types:
            self.assertIn(log_type, enabled_log_type_names, f"Missing log type: {log_type}")

    def test_eks_cluster_tags(self):
        """Test EKS cluster has required tags."""
        cluster = self.resources['EksCluster']
        tags = cluster['Properties']['Tags']

        tag_keys = [tag['Key'] for tag in tags]
        self.assertIn('Name', tag_keys)
        self.assertIn('Environment', tag_keys)
        self.assertIn('ManagedBy', tag_keys)

    # EKS Node Group Tests
    def test_eks_node_group_exists(self):
        """Test EKS node group resource exists."""
        self.assertIn('EksNodeGroup', self.resources)

    def test_eks_node_group_properties(self):
        """Test EKS node group configuration."""
        node_group = self.resources['EksNodeGroup']
        self.assertEqual(node_group['Type'], 'AWS::EKS::Nodegroup')
        self.assertEqual(node_group['DeletionPolicy'], 'Delete')

        props = node_group['Properties']
        self.assertIn('NodegroupName', props)
        self.assertIn('ClusterName', props)
        self.assertIn('NodeRole', props)
        self.assertIn('Subnets', props)
        self.assertIn('ScalingConfig', props)
        self.assertIn('InstanceTypes', props)
        self.assertIn('AmiType', props)

    def test_eks_node_group_depends_on(self):
        """Test node group depends on cluster."""
        node_group = self.resources['EksNodeGroup']
        self.assertIn('DependsOn', node_group)
        depends_on = node_group['DependsOn']
        self.assertIn('EksCluster', depends_on)

    def test_eks_node_group_cluster_reference(self):
        """Test node group cluster name reference."""
        node_group = self.resources['EksNodeGroup']
        cluster_name = node_group['Properties']['ClusterName']
        self.assertIn('Ref', cluster_name)
        self.assertEqual(cluster_name['Ref'], 'EksCluster')

    def test_eks_node_group_role_reference(self):
        """Test node group role reference."""
        node_group = self.resources['EksNodeGroup']
        role_arn = node_group['Properties']['NodeRole']
        self.assertIn('Fn::GetAtt', role_arn)
        self.assertEqual(role_arn['Fn::GetAtt'][0], 'EksNodeRole')

    def test_eks_node_group_scaling_config(self):
        """Test node group scaling configuration."""
        node_group = self.resources['EksNodeGroup']
        scaling_config = node_group['Properties']['ScalingConfig']

        self.assertIn('MinSize', scaling_config)
        self.assertIn('MaxSize', scaling_config)
        self.assertIn('DesiredSize', scaling_config)

        # Verify all reference parameters
        for key in ['MinSize', 'MaxSize', 'DesiredSize']:
            self.assertIn('Ref', scaling_config[key])

    def test_eks_node_group_instance_types(self):
        """Test node group instance types configuration."""
        node_group = self.resources['EksNodeGroup']
        instance_types = node_group['Properties']['InstanceTypes']

        self.assertIsInstance(instance_types, list)
        self.assertEqual(len(instance_types), 1)
        self.assertIn('Ref', instance_types[0])
        self.assertEqual(instance_types[0]['Ref'], 'NodeInstanceType')

    def test_eks_node_group_ami_type(self):
        """Test node group uses Amazon Linux 2 AMI."""
        node_group = self.resources['EksNodeGroup']
        ami_type = node_group['Properties']['AmiType']
        self.assertEqual(ami_type, 'AL2_x86_64')

    def test_eks_node_group_labels(self):
        """Test node group has labels."""
        node_group = self.resources['EksNodeGroup']
        labels = node_group['Properties']['Labels']

        self.assertIn('Environment', labels)
        self.assertEqual(labels['Environment'], 'Production')
        self.assertIn('ManagedBy', labels)
        self.assertEqual(labels['ManagedBy'], 'CloudFormation')

    # Output Tests
    def test_output_eks_cluster_name(self):
        """Test EKS cluster name output."""
        self.assertIn('EksClusterName', self.outputs)
        output = self.outputs['EksClusterName']
        self.assertIn('Description', output)
        self.assertIn('Value', output)
        self.assertIn('Export', output)

    def test_output_eks_cluster_arn(self):
        """Test EKS cluster ARN output."""
        self.assertIn('EksClusterArn', self.outputs)
        output = self.outputs['EksClusterArn']
        value = output['Value']
        self.assertIn('Fn::GetAtt', value)
        self.assertEqual(value['Fn::GetAtt'][0], 'EksCluster')
        self.assertEqual(value['Fn::GetAtt'][1], 'Arn')

    def test_output_eks_cluster_endpoint(self):
        """Test EKS cluster endpoint output."""
        self.assertIn('EksClusterEndpoint', self.outputs)
        output = self.outputs['EksClusterEndpoint']
        value = output['Value']
        self.assertIn('Fn::GetAtt', value)
        self.assertEqual(value['Fn::GetAtt'][1], 'Endpoint')

    def test_output_security_group_ids(self):
        """Test security group ID outputs."""
        for output_name in ['EksClusterSecurityGroupId', 'EksNodeSecurityGroupId']:
            self.assertIn(output_name, self.outputs)
            output = self.outputs[output_name]
            self.assertIn('Value', output)
            self.assertIn('Export', output)

    def test_output_kms_key_details(self):
        """Test KMS key outputs."""
        self.assertIn('EksKmsKeyId', self.outputs)
        self.assertIn('EksKmsKeyArn', self.outputs)

        key_id_output = self.outputs['EksKmsKeyId']
        self.assertIn('Ref', key_id_output['Value'])

        key_arn_output = self.outputs['EksKmsKeyArn']
        self.assertIn('Fn::GetAtt', key_arn_output['Value'])

    def test_output_oidc_issuer(self):
        """Test OIDC issuer URL output for IRSA."""
        self.assertIn('EksOidcIssuer', self.outputs)
        output = self.outputs['EksOidcIssuer']
        value = output['Value']
        self.assertIn('Fn::GetAtt', value)
        self.assertEqual(value['Fn::GetAtt'][0], 'EksCluster')
        self.assertEqual(value['Fn::GetAtt'][1], 'OpenIdConnectIssuerUrl')

    def test_output_node_group_name(self):
        """Test node group name output."""
        self.assertIn('EksNodeGroupName', self.outputs)
        output = self.outputs['EksNodeGroupName']
        self.assertIn('Ref', output['Value'])
        self.assertEqual(output['Value']['Ref'], 'EksNodeGroup')

    def test_output_role_arns(self):
        """Test IAM role ARN outputs."""
        for output_name in ['EksClusterRoleArn', 'EksNodeRoleArn']:
            self.assertIn(output_name, self.outputs)
            output = self.outputs[output_name]
            value = output['Value']
            self.assertIn('Fn::GetAtt', value)
            self.assertEqual(value['Fn::GetAtt'][1], 'Arn')

    def test_output_environment_suffix(self):
        """Test environment suffix output."""
        self.assertIn('EnvironmentSuffix', self.outputs)
        output = self.outputs['EnvironmentSuffix']
        self.assertIn('Ref', output['Value'])
        self.assertEqual(output['Value']['Ref'], 'EnvironmentSuffix')

    def test_all_outputs_have_exports(self):
        """Test all outputs have export names with environmentSuffix."""
        for output_name, output_config in self.outputs.items():
            self.assertIn('Export', output_config, f"Output {output_name} missing Export")
            export_config = output_config['Export']
            self.assertIn('Name', export_config)

    # Comprehensive Resource Count Tests
    def test_total_resource_count(self):
        """Test template has expected number of resources."""
        expected_resource_count = 15  # Total resources in template
        actual_count = len(self.resources)
        self.assertEqual(
            actual_count,
            expected_resource_count,
            f"Expected {expected_resource_count} resources, found {actual_count}"
        )

    def test_all_resources_have_deletion_policy(self):
        """Test all resources have DeletionPolicy set to Delete."""
        for resource_name, resource_config in self.resources.items():
            self.assertIn(
                'DeletionPolicy',
                resource_config,
                f"Resource {resource_name} missing DeletionPolicy"
            )
            self.assertEqual(
                resource_config['DeletionPolicy'],
                'Delete',
                f"Resource {resource_name} has incorrect DeletionPolicy"
            )

    def test_resource_name_uses_environment_suffix(self):
        """Test resource names include environmentSuffix parameter."""
        resources_with_names = [
            'EksKmsKey', 'EksKmsKeyAlias', 'EksClusterRole', 'EksClusterSecurityGroup',
            'EksNodeSecurityGroup', 'EksClusterLogGroup', 'EksCluster',
            'EksNodeRole', 'EksNodeGroup'
        ]

        for resource_name in resources_with_names:
            resource = self.resources[resource_name]
            props = resource.get('Properties', {})

            # Check if resource has a Name property
            name_fields = ['Name', 'RoleName', 'GroupName', 'LogGroupName',
                         'NodegroupName', 'AliasName']
            has_name_field = any(field in props for field in name_fields)

            if has_name_field:
                # Find the name field
                for field in name_fields:
                    if field in props:
                        name_value = props[field]
                        # Name should reference EnvironmentSuffix via Fn::Sub
                        self.assertTrue(
                            'Fn::Sub' in str(name_value) or 'EnvironmentSuffix' in str(name_value),
                            f"Resource {resource_name} name doesn't use EnvironmentSuffix"
                        )
                        break


if __name__ == '__main__':  # pragma: no cover
    unittest.main()
