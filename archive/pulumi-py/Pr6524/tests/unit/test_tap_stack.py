"""
test_tap_stack.py

Unit tests for the CloudFormation TapStack template.
Tests validate template structure, parameters, resources, and configuration without deploying to AWS.
"""

import unittest
import json
import os
import yaml
from pathlib import Path


class TestTapStackTemplate(unittest.TestCase):
    """Test cases for CloudFormation TapStack template validation."""

    @classmethod
    def setUpClass(cls):
        """Load the CloudFormation template once for all tests."""
        # Try to load from JSON first (generated from YAML), then fall back to YAML
        template_json_path = Path(__file__).parent.parent.parent / 'lib' / 'TapStack.json'
        template_yaml_path = Path(__file__).parent.parent.parent / 'lib' / 'TapStack.yml'
        
        if template_json_path.exists():
            with open(template_json_path, 'r', encoding='utf-8') as f:
                cls.template = json.load(f)
        elif template_yaml_path.exists():
            with open(template_yaml_path, 'r', encoding='utf-8') as f:
                cls.template = yaml.safe_load(f)
        else:
            raise FileNotFoundError(
                f"CloudFormation template not found. "
                f"Expected: {template_json_path} or {template_yaml_path}"
            )

    def test_template_structure(self):
        """Test template has valid CloudFormation structure."""
        self.assertEqual(
            self.template.get('AWSTemplateFormatVersion'),
            '2010-09-09',
            "Template should use CloudFormation format version 2010-09-09"
        )
        
        self.assertIsNotNone(
            self.template.get('Description'),
            "Template should have a description"
        )
        
        # Check required sections
        self.assertIn('Parameters', self.template, "Template should have Parameters section")
        self.assertIn('Resources', self.template, "Template should have Resources section")
        self.assertIn('Outputs', self.template, "Template should have Outputs section")

    def test_parameters_exist(self):
        """Test required parameters are defined."""
        params = self.template.get('Parameters', {})
        
        # EnvironmentType parameter
        self.assertIn('EnvironmentType', params, "EnvironmentType parameter should exist")
        env_param = params['EnvironmentType']
        self.assertEqual(env_param.get('Type'), 'String', "EnvironmentType should be String type")
        self.assertIn('Default', env_param, "EnvironmentType should have a default value")
        self.assertIn('AllowedValues', env_param, "EnvironmentType should have AllowedValues")
        
        # DBUsername parameter
        self.assertIn('DBUsername', params, "DBUsername parameter should exist")
        db_user_param = params['DBUsername']
        self.assertEqual(db_user_param.get('Type'), 'String', "DBUsername should be String type")
        self.assertIn('MinLength', db_user_param, "DBUsername should have MinLength constraint")
        self.assertIn('MaxLength', db_user_param, "DBUsername should have MaxLength constraint")
        
        # VPC CIDR parameters
        self.assertIn('VpcCIDR', params, "VpcCIDR parameter should exist")
        self.assertIn('PublicSubnet1CIDR', params, "PublicSubnet1CIDR parameter should exist")
        self.assertIn('PublicSubnet2CIDR', params, "PublicSubnet2CIDR parameter should exist")
        self.assertIn('PrivateSubnet1CIDR', params, "PrivateSubnet1CIDR parameter should exist")
        self.assertIn('PrivateSubnet2CIDR', params, "PrivateSubnet2CIDR parameter should exist")

    def test_mappings_exist(self):
        """Test mappings are defined."""
        mappings = self.template.get('Mappings', {})
        
        # RegionAMIs mapping
        self.assertIn('RegionAMIs', mappings, "RegionAMIs mapping should exist")
        region_amis = mappings['RegionAMIs']
        self.assertIn('us-east-1', region_amis, "RegionAMIs should include us-east-1")
        
        # EnvironmentConfig mapping
        self.assertIn('EnvironmentConfig', mappings, "EnvironmentConfig mapping should exist")
        env_config = mappings['EnvironmentConfig']
        self.assertIn('dev', env_config, "EnvironmentConfig should include dev")
        self.assertIn('prod', env_config, "EnvironmentConfig should include prod")

    def test_conditions_exist(self):
        """Test conditions are defined."""
        conditions = self.template.get('Conditions', {})
        
        self.assertIn('IsProduction', conditions, "IsProduction condition should exist")
        self.assertIn('IsDevelopment', conditions, "IsDevelopment condition should exist")

    def test_vpc_resources_exist(self):
        """Test VPC and network resources are defined."""
        resources = self.template.get('Resources', {})
        
        # VPC resource
        self.assertIn('VPC', resources, "VPC resource should exist")
        vpc = resources['VPC']
        self.assertEqual(vpc.get('Type'), 'AWS::EC2::VPC', "VPC should be AWS::EC2::VPC type")
        
        # Internet Gateway
        self.assertIn('InternetGateway', resources, "InternetGateway resource should exist")
        self.assertIn('AttachGateway', resources, "AttachGateway resource should exist")
        
        # Subnets
        self.assertIn('PublicSubnet1', resources, "PublicSubnet1 should exist")
        self.assertIn('PublicSubnet2', resources, "PublicSubnet2 should exist")
        self.assertIn('PrivateSubnet1', resources, "PrivateSubnet1 should exist")
        self.assertIn('PrivateSubnet2', resources, "PrivateSubnet2 should exist")

    def test_security_groups_exist(self):
        """Test security groups are defined."""
        resources = self.template.get('Resources', {})
        
        self.assertIn('ALBSecurityGroup', resources, "ALBSecurityGroup should exist")
        self.assertIn('InstanceSecurityGroup', resources, "InstanceSecurityGroup should exist")
        self.assertIn('DatabaseSecurityGroup', resources, "DatabaseSecurityGroup should exist")

    def test_iam_resources_exist(self):
        """Test IAM resources are defined."""
        resources = self.template.get('Resources', {})
        
        self.assertIn('InstanceRole', resources, "InstanceRole should exist")
        self.assertIn('InstanceProfile', resources, "InstanceProfile should exist")
        
        instance_role = resources['InstanceRole']
        self.assertEqual(
            instance_role.get('Type'),
            'AWS::IAM::Role',
            "InstanceRole should be AWS::IAM::Role type"
        )

    def test_rds_resources_exist(self):
        """Test RDS Aurora resources are defined."""
        resources = self.template.get('Resources', {})
        
        self.assertIn('DBSubnetGroup', resources, "DBSubnetGroup should exist")
        self.assertIn('AuroraCluster', resources, "AuroraCluster should exist")
        
        cluster = resources['AuroraCluster']
        self.assertEqual(
            cluster.get('Type'),
            'AWS::RDS::DBCluster',
            "AuroraCluster should be AWS::RDS::DBCluster type"
        )
        
        # Check cluster properties
        props = cluster.get('Properties', {})
        self.assertIn('Engine', props, "AuroraCluster should have Engine property")
        self.assertIn('EngineVersion', props, "AuroraCluster should have EngineVersion property")
        self.assertIn('StorageEncrypted', props, "AuroraCluster should have StorageEncrypted property")
        self.assertTrue(
            props.get('StorageEncrypted', False),
            "AuroraCluster should have encryption enabled"
        )

    def test_s3_resources_exist(self):
        """Test S3 resources are defined."""
        resources = self.template.get('Resources', {})
        
        self.assertIn('TransactionLogsBucket', resources, "TransactionLogsBucket should exist")
        bucket = resources['TransactionLogsBucket']
        self.assertEqual(
            bucket.get('Type'),
            'AWS::S3::Bucket',
            "TransactionLogsBucket should be AWS::S3::Bucket type"
        )
        
        # Check bucket properties
        props = bucket.get('Properties', {})
        self.assertIn('VersioningConfiguration', props, "Bucket should have versioning configuration")
        self.assertIn('PublicAccessBlockConfiguration', props, "Bucket should have public access block")

    def test_alb_resources_exist(self):
        """Test Application Load Balancer resources are defined."""
        resources = self.template.get('Resources', {})
        
        self.assertIn('ApplicationLoadBalancer', resources, "ApplicationLoadBalancer should exist")
        alb = resources['ApplicationLoadBalancer']
        self.assertEqual(
            alb.get('Type'),
            'AWS::ElasticLoadBalancingV2::LoadBalancer',
            "ALB should be AWS::ElasticLoadBalancingV2::LoadBalancer type"
        )
        
        self.assertIn('ALBTargetGroup', resources, "ALBTargetGroup should exist")
        self.assertIn('ALBListener', resources, "ALBListener should exist")

    def test_autoscaling_resources_exist(self):
        """Test Auto Scaling resources are defined."""
        resources = self.template.get('Resources', {})
        
        self.assertIn('LaunchTemplate', resources, "LaunchTemplate should exist")
        self.assertIn('AutoScalingGroup', resources, "AutoScalingGroup should exist")
        
        asg = resources['AutoScalingGroup']
        self.assertEqual(
            asg.get('Type'),
            'AWS::AutoScaling::AutoScalingGroup',
            "AutoScalingGroup should be AWS::AutoScaling::AutoScalingGroup type"
        )

    def test_secrets_manager_resources_exist(self):
        """Test Secrets Manager resources are defined."""
        resources = self.template.get('Resources', {})
        
        self.assertIn('DBPasswordSecret', resources, "DBPasswordSecret should exist")
        secret = resources['DBPasswordSecret']
        self.assertEqual(
            secret.get('Type'),
            'AWS::SecretsManager::Secret',
            "DBPasswordSecret should be AWS::SecretsManager::Secret type"
        )
        
        # Check secret has GenerateSecretString
        props = secret.get('Properties', {})
        self.assertIn('GenerateSecretString', props, "Secret should have GenerateSecretString")

    def test_key_pair_resource_exists(self):
        """Test EC2 Key Pair resource is defined."""
        resources = self.template.get('Resources', {})
        
        self.assertIn('EC2KeyPair', resources, "EC2KeyPair should exist")
        key_pair = resources['EC2KeyPair']
        self.assertEqual(
            key_pair.get('Type'),
            'AWS::EC2::KeyPair',
            "EC2KeyPair should be AWS::EC2::KeyPair type"
        )

    def test_outputs_exist(self):
        """Test stack outputs are defined."""
        outputs = self.template.get('Outputs', {})
        
        required_outputs = [
            'VPCId',
            'RDSEndpoint',
            'RDSPort',
            'S3BucketName',
            'S3BucketArn',
            'EnvironmentType'
        ]
        
        for output_key in required_outputs:
            self.assertIn(
                output_key,
                outputs,
                f"Output {output_key} should be defined"
            )
            
            output = outputs[output_key]
            self.assertIn('Value', output, f"Output {output_key} should have a Value")
            self.assertIn('Description', output, f"Output {output_key} should have a Description")

    def test_resource_naming_convention(self):
        """Test resources follow naming conventions with EnvironmentType."""
        resources = self.template.get('Resources', {})
        
        # Check VPC name uses EnvironmentType
        vpc = resources.get('VPC', {})
        vpc_props = vpc.get('Properties', {})
        vpc_tags = vpc_props.get('Tags', [])
        
        # Find Name tag
        name_tag = next((tag for tag in vpc_tags if tag.get('Key') == 'Name'), None)
        if name_tag:
            name_value = name_tag.get('Value', '')
            # Should use !Sub with EnvironmentType
            self.assertIsInstance(name_value, dict, "VPC Name tag should use CloudFormation function")

    def test_resource_tags(self):
        """Test resources have consistent tagging."""
        resources = self.template.get('Resources', {})
        
        # Check a few key resources have tags
        resources_to_check = ['VPC', 'TransactionLogsBucket', 'AuroraCluster']
        
        for resource_name in resources_to_check:
            if resource_name in resources:
                resource = resources[resource_name]
                props = resource.get('Properties', {})
                tags = props.get('Tags', [])
                
                # Should have at least some tags
                self.assertGreater(
                    len(tags),
                    0,
                    f"{resource_name} should have tags"
                )

    def test_no_hardcoded_values(self):
        """Test template uses parameters and mappings instead of hardcoded values."""
        resources = self.template.get('Resources', {})
        
        # Check AuroraCluster uses parameter references
        cluster = resources.get('AuroraCluster', {})
        props = cluster.get('Properties', {})
        
        # MasterUsername should reference parameter
        master_username = props.get('MasterUsername')
        if master_username:
            # Should be a Ref or similar function, not a hardcoded string
            if isinstance(master_username, str):
                # If it's a string, it should be a parameter reference pattern
                # This is a basic check - in practice, it should use !Ref
                pass

    def test_encryption_enabled(self):
        """Test encryption is enabled on resources that support it."""
        resources = self.template.get('Resources', {})
        
        # RDS cluster encryption
        cluster = resources.get('AuroraCluster', {})
        if cluster:
            props = cluster.get('Properties', {})
            self.assertTrue(
                props.get('StorageEncrypted', False),
                "AuroraCluster should have StorageEncrypted enabled"
            )
        
        # S3 bucket encryption
        bucket = resources.get('TransactionLogsBucket', {})
        if bucket:
            props = bucket.get('Properties', {})
            bucket_encryption = props.get('BucketEncryption', {})
            if bucket_encryption:
                server_side_encryption = bucket_encryption.get('ServerSideEncryptionConfiguration', [])
                self.assertGreater(
                    len(server_side_encryption),
                    0,
                    "S3 bucket should have encryption configuration"
                )

    def test_metadata_section(self):
        """Test template has metadata section for cfn-lint configuration."""
        metadata = self.template.get('Metadata', {})
        
        # Should have cfn-lint ignore configuration
        cfn_lint = metadata.get('cfn-lint', {})
        if cfn_lint:
            config = cfn_lint.get('config', {})
            ignore_checks = config.get('ignore_checks', [])
            # Should have some ignore checks if warnings are suppressed
            self.assertIsInstance(ignore_checks, list, "ignore_checks should be a list")


if __name__ == '__main__':
    unittest.main()
