"""
Additional unit tests for CloudFormation template resource validation.
Tests resource counts, types, and basic properties.
"""

import json
import pytest
import subprocess
from pathlib import Path

def load_template():
    """Load and parse the CloudFormation template."""
    template_path = Path(__file__).parent.parent.parent / 'lib' / 'TapStack.yml'
    # Convert YAML to JSON using cfn-flip to handle CloudFormation intrinsic functions
    result = subprocess.run(['cfn-flip', str(template_path)], capture_output=True, text=True)
    if result.returncode != 0:
        raise ValueError(f"Failed to parse CloudFormation template: {result.stderr}")
    return json.loads(result.stdout)

@pytest.fixture
def cfn_template():
    """Fixture to provide the parsed CloudFormation template."""
    return load_template()

class TestResourceCounts:
    """Test resource counts in the template."""
    
    def test_total_resource_count(self, cfn_template):
        """Test that template has expected number of resources."""
        resources = cfn_template.get('Resources', {})
        # Count all resources
        assert len(resources) > 40  # Should have at least 40 resources
        assert len(resources) < 100  # Shouldn't have more than 100 resources
    
    def test_vpc_resource_count(self, cfn_template):
        """Test VPC-related resource counts."""
        resources = cfn_template.get('Resources', {})
        vpc_resources = [k for k, v in resources.items() if 'VPC' in v.get('Type', '')]
        assert len(vpc_resources) >= 1
    
    def test_subnet_count(self, cfn_template):
        """Test that we have correct number of subnets."""
        resources = cfn_template.get('Resources', {})
        subnets = [k for k, v in resources.items() if v.get('Type') == 'AWS::EC2::Subnet']
        assert len(subnets) == 4  # 2 public + 2 private
    
    def test_security_group_count(self, cfn_template):
        """Test that we have correct number of security groups."""
        resources = cfn_template.get('Resources', {})
        security_groups = [k for k, v in resources.items() if v.get('Type') == 'AWS::EC2::SecurityGroup']
        assert len(security_groups) >= 3  # EC2, RDS, Lambda
    
    def test_iam_role_count(self, cfn_template):
        """Test that we have correct number of IAM roles."""
        resources = cfn_template.get('Resources', {})
        iam_roles = [k for k, v in resources.items() if v.get('Type') == 'AWS::IAM::Role']
        assert len(iam_roles) >= 3  # EC2, Lambda, CloudTrail
    
    def test_s3_bucket_count(self, cfn_template):
        """Test that we have correct number of S3 buckets."""
        resources = cfn_template.get('Resources', {})
        s3_buckets = [k for k, v in resources.items() if v.get('Type') == 'AWS::S3::Bucket']
        assert len(s3_buckets) >= 2  # SecureS3Bucket and CloudTrailS3Bucket

class TestResourceTypes:
    """Test that all expected resource types are present."""
    
    def test_compute_resources_exist(self, cfn_template):
        """Test that compute resources exist."""
        resources = cfn_template.get('Resources', {})
        resource_types = [v.get('Type') for v in resources.values()]
        
        assert 'AWS::EC2::Instance' in resource_types
        assert 'AWS::Lambda::Function' in resource_types
        assert 'AWS::EC2::LaunchTemplate' in resource_types
    
    def test_storage_resources_exist(self, cfn_template):
        """Test that storage resources exist."""
        resources = cfn_template.get('Resources', {})
        resource_types = [v.get('Type') for v in resources.values()]
        
        assert 'AWS::S3::Bucket' in resource_types
        assert 'AWS::RDS::DBInstance' in resource_types
    
    def test_networking_resources_exist(self, cfn_template):
        """Test that networking resources exist."""
        resources = cfn_template.get('Resources', {})
        resource_types = [v.get('Type') for v in resources.values()]
        
        assert 'AWS::EC2::VPC' in resource_types
        assert 'AWS::EC2::Subnet' in resource_types
        assert 'AWS::EC2::InternetGateway' in resource_types
        assert 'AWS::EC2::NatGateway' in resource_types
        assert 'AWS::EC2::RouteTable' in resource_types
        assert 'AWS::EC2::Route' in resource_types
        assert 'AWS::EC2::VPCEndpoint' in resource_types
    
    def test_monitoring_resources_exist(self, cfn_template):
        """Test that monitoring resources exist."""
        resources = cfn_template.get('Resources', {})
        resource_types = [v.get('Type') for v in resources.values()]
        
        assert 'AWS::CloudWatch::Alarm' in resource_types
        assert 'AWS::Logs::LogGroup' in resource_types
        assert 'AWS::CloudTrail::Trail' in resource_types
        assert 'AWS::Events::Rule' in resource_types

class TestParameterValidation:
    """Test parameter configuration and validation."""
    
    def test_required_parameters_exist(self, cfn_template):
        """Test that all required parameters exist."""
        params = cfn_template.get('Parameters', {})
        required_params = ['Environment', 'Owner', 'EnvironmentSuffix', 'TrustedCIDR', 'DBUsername', 'DBPassword']
        for param in required_params:
            assert param in params
    
    def test_parameter_types(self, cfn_template):
        """Test that parameters have correct types."""
        params = cfn_template.get('Parameters', {})
        assert params['Environment']['Type'] == 'String'
        assert params['Owner']['Type'] == 'String'
        assert params['EnvironmentSuffix']['Type'] == 'String'
        assert params['TrustedCIDR']['Type'] == 'String'
        assert params['DBUsername']['Type'] == 'String'
        assert params['DBPassword']['Type'] == 'String'
    
    def test_parameter_constraints(self, cfn_template):
        """Test that parameters have proper constraints."""
        params = cfn_template.get('Parameters', {})
        
        # DBPassword should be NoEcho
        assert params['DBPassword']['NoEcho'] == True
        
        # DBUsername should have constraints
        assert 'MinLength' in params['DBUsername']
        assert 'MaxLength' in params['DBUsername']
        assert 'AllowedPattern' in params['DBUsername']
        
        # TrustedCIDR should have pattern
        assert 'AllowedPattern' in params['TrustedCIDR']

class TestTagCompliance:
    """Test that all resources have required tags."""
    
    def test_taggable_resources_have_tags(self, cfn_template):
        """Test that all taggable resources have Environment and Owner tags."""
        resources = cfn_template.get('Resources', {})
        
        # List of resource types that support tags
        taggable_types = [
            'AWS::EC2::VPC', 'AWS::EC2::Subnet', 'AWS::EC2::InternetGateway',
            'AWS::EC2::NatGateway', 'AWS::EC2::RouteTable', 'AWS::EC2::SecurityGroup',
            'AWS::EC2::Instance', 'AWS::EC2::EIP', 'AWS::RDS::DBInstance',
            'AWS::RDS::DBSubnetGroup', 'AWS::S3::Bucket', 'AWS::Lambda::Function',
            'AWS::CloudTrail::Trail', 'AWS::CloudWatch::Alarm', 'AWS::Logs::LogGroup',
            'AWS::IAM::Role', 'AWS::EC2::VPCEndpoint', 'AWS::Events::Rule'
        ]
        
        for resource_name, resource in resources.items():
            resource_type = resource.get('Type', '')
            if resource_type in taggable_types:
                if 'Properties' in resource and 'Tags' in resource['Properties']:
                    tags = resource['Properties']['Tags']
                    tag_keys = [tag['Key'] for tag in tags]
                    assert 'Environment' in tag_keys, f"{resource_name} missing Environment tag"
                    assert 'Owner' in tag_keys, f"{resource_name} missing Owner tag"

class TestDependencies:
    """Test resource dependencies are properly configured."""
    
    def test_cloudtrail_depends_on_bucket_policy(self, cfn_template):
        """Test that CloudTrail depends on bucket policy."""
        resources = cfn_template.get('Resources', {})
        cloudtrail = resources.get('CloudTrail', {})
        assert 'DependsOn' in cloudtrail
        assert 'CloudTrailS3BucketPolicy' in cloudtrail['DependsOn']
    
    def test_nat_gateway_depends_on_igw_attachment(self, cfn_template):
        """Test that NAT Gateway EIP depends on IGW attachment."""
        resources = cfn_template.get('Resources', {})
        nat_eip = resources.get('NatGateway1EIP', {})
        assert 'DependsOn' in nat_eip
        assert 'InternetGatewayAttachment' in nat_eip['DependsOn']
    
    def test_routes_depend_on_gateway_attachment(self, cfn_template):
        """Test that routes depend on gateway attachment."""
        resources = cfn_template.get('Resources', {})
        public_route = resources.get('DefaultPublicRoute', {})
        assert 'DependsOn' in public_route
        assert 'InternetGatewayAttachment' in public_route['DependsOn']

class TestIntrinsicFunctions:
    """Test proper use of CloudFormation intrinsic functions."""
    
    def test_uses_ref_for_parameters(self, cfn_template):
        """Test that template uses !Ref for parameter references."""
        resources = cfn_template.get('Resources', {})
        # Check VPC tags reference parameters
        vpc = resources.get('VPC', {})
        tags = vpc.get('Properties', {}).get('Tags', [])
        for tag in tags:
            if tag['Key'] == 'Environment':
                assert isinstance(tag['Value'], dict)
                assert 'Ref' in tag['Value']
    
    def test_uses_sub_for_naming(self, cfn_template):
        """Test that template uses !Sub for resource naming."""
        resources = cfn_template.get('Resources', {})
        # Check bucket naming
        bucket = resources.get('SecureS3Bucket', {})
        bucket_name = bucket.get('Properties', {}).get('BucketName')
        if bucket_name:
            assert isinstance(bucket_name, dict)
            assert 'Fn::Sub' in bucket_name
    
    def test_uses_getatt_for_attributes(self, cfn_template):
        """Test that template uses !GetAtt for resource attributes."""
        resources = cfn_template.get('Resources', {})
        # Check EC2 instance profile reference
        launch_template = resources.get('EC2LaunchTemplate', {})
        iam_profile = launch_template.get('Properties', {}).get('LaunchTemplateData', {}).get('IamInstanceProfile', {})
        if 'Arn' in iam_profile:
            assert isinstance(iam_profile['Arn'], dict)
            assert 'Fn::GetAtt' in iam_profile['Arn']

class TestOutputsConfiguration:
    """Test CloudFormation outputs configuration."""
    
    def test_output_count(self, cfn_template):
        """Test that template has sufficient outputs."""
        outputs = cfn_template.get('Outputs', {})
        assert len(outputs) >= 15  # Should have at least 15 outputs
    
    def test_outputs_have_descriptions(self, cfn_template):
        """Test that all outputs have descriptions."""
        outputs = cfn_template.get('Outputs', {})
        for output_name, output_config in outputs.items():
            assert 'Description' in output_config, f"Output {output_name} missing description"
    
    def test_outputs_have_values(self, cfn_template):
        """Test that all outputs have values."""
        outputs = cfn_template.get('Outputs', {})
        for output_name, output_config in outputs.items():
            assert 'Value' in output_config, f"Output {output_name} missing value"
    
    def test_outputs_use_environment_suffix(self, cfn_template):
        """Test that output exports use EnvironmentSuffix."""
        outputs = cfn_template.get('Outputs', {})
        for output_name, output_config in outputs.items():
            if 'Export' in output_config:
                export_name = output_config['Export']['Name']
                if isinstance(export_name, dict) and 'Fn::Sub' in export_name:
                    assert '${EnvironmentSuffix}' in export_name['Fn::Sub']

class TestComplianceRequirements:
    """Test specific compliance requirements from PROMPT.md."""
    
    def test_rds_engine_version(self, cfn_template):
        """Test that RDS uses a valid MySQL engine version."""
        resources = cfn_template.get('Resources', {})
        rds = resources.get('RDSInstance', {})
        engine = rds.get('Properties', {}).get('Engine')
        assert engine == 'mysql'
        # Version should be 8.0.x
        version = rds.get('Properties', {}).get('EngineVersion', '')
        assert version.startswith('8.0')
    
    def test_lambda_runtime(self, cfn_template):
        """Test that Lambda uses a supported Python runtime."""
        resources = cfn_template.get('Resources', {})
        lambda_fn = resources.get('LambdaFunction', {})
        runtime = lambda_fn.get('Properties', {}).get('Runtime')
        assert 'python' in runtime
        assert runtime in ['python3.9', 'python3.10', 'python3.11', 'python3.12']
    
    def test_s3_versioning_enabled(self, cfn_template):
        """Test that S3 buckets have versioning enabled."""
        resources = cfn_template.get('Resources', {})
        secure_bucket = resources.get('SecureS3Bucket', {})
        versioning = secure_bucket.get('Properties', {}).get('VersioningConfiguration', {})
        assert versioning.get('Status') == 'Enabled'
    
    def test_cloudtrail_validation_enabled(self, cfn_template):
        """Test that CloudTrail has log file validation enabled."""
        resources = cfn_template.get('Resources', {})
        trail = resources.get('CloudTrail', {})
        assert trail.get('Properties', {}).get('EnableLogFileValidation') == True

class TestNetworkSegmentation:
    """Test network segmentation and isolation."""
    
    def test_public_private_subnet_separation(self, cfn_template):
        """Test that public and private subnets use different CIDR blocks."""
        resources = cfn_template.get('Resources', {})
        
        public_subnet1 = resources.get('PublicSubnet1', {})
        public_subnet2 = resources.get('PublicSubnet2', {})
        private_subnet1 = resources.get('PrivateSubnet1', {})
        private_subnet2 = resources.get('PrivateSubnet2', {})
        
        # Get CIDR blocks
        public_cidr1 = public_subnet1.get('Properties', {}).get('CidrBlock')
        public_cidr2 = public_subnet2.get('Properties', {}).get('CidrBlock')
        private_cidr1 = private_subnet1.get('Properties', {}).get('CidrBlock')
        private_cidr2 = private_subnet2.get('Properties', {}).get('CidrBlock')
        
        # Ensure all are different
        cidrs = [public_cidr1, public_cidr2, private_cidr1, private_cidr2]
        assert len(set(cidrs)) == 4  # All should be unique
    
    def test_route_table_associations(self, cfn_template):
        """Test that subnets are associated with correct route tables."""
        resources = cfn_template.get('Resources', {})
        
        # Check public subnet associations
        assert 'PublicSubnet1RouteTableAssociation' in resources
        assert 'PublicSubnet2RouteTableAssociation' in resources
        
        # Check private subnet associations
        assert 'PrivateSubnet1RouteTableAssociation' in resources
        assert 'PrivateSubnet2RouteTableAssociation' in resources