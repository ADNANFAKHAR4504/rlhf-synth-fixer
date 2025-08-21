"""
Unit tests for CloudFormation template validation and compliance.
Tests all requirements from PROMPT.md for secure and compliant infrastructure.
"""

import json
import pytest
import os
import subprocess
from pathlib import Path

# Load the CloudFormation template
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

@pytest.fixture
def resources(cfn_template):
    """Fixture to provide the resources section of the template."""
    return cfn_template.get('Resources', {})

@pytest.fixture
def parameters(cfn_template):
    """Fixture to provide the parameters section of the template."""
    return cfn_template.get('Parameters', {})

@pytest.fixture
def outputs(cfn_template):
    """Fixture to provide the outputs section of the template."""
    return cfn_template.get('Outputs', {})

class TestTemplateStructure:
    """Test the basic structure of the CloudFormation template."""
    
    def test_template_has_required_sections(self, cfn_template):
        """Test that template has all required top-level sections."""
        assert 'AWSTemplateFormatVersion' in cfn_template
        assert cfn_template['AWSTemplateFormatVersion'] == '2010-09-09'
        assert 'Description' in cfn_template
        assert 'Parameters' in cfn_template
        assert 'Resources' in cfn_template
        assert 'Outputs' in cfn_template
        assert 'Mappings' in cfn_template
    
    def test_has_environment_suffix_parameter(self, parameters):
        """Test that EnvironmentSuffix parameter exists."""
        assert 'EnvironmentSuffix' in parameters
        assert parameters['EnvironmentSuffix']['Type'] == 'String'
    
    def test_has_environment_and_owner_parameters(self, parameters):
        """Test that Environment and Owner parameters exist for tagging."""
        assert 'Environment' in parameters
        assert 'Owner' in parameters
        assert parameters['Environment']['Type'] == 'String'
        assert parameters['Owner']['Type'] == 'String'

class TestVPCConfiguration:
    """Test VPC and networking configuration."""
    
    def test_vpc_exists_with_custom_config(self, resources):
        """Test that VPC exists with custom configuration."""
        assert 'VPC' in resources
        vpc = resources['VPC']
        assert vpc['Type'] == 'AWS::EC2::VPC'
        assert 'CidrBlock' in vpc['Properties']
        assert vpc['Properties']['EnableDnsHostnames'] == True
        assert vpc['Properties']['EnableDnsSupport'] == True
    
    def test_has_public_subnets(self, resources):
        """Test that public subnets exist."""
        assert 'PublicSubnet1' in resources
        assert 'PublicSubnet2' in resources
        assert resources['PublicSubnet1']['Type'] == 'AWS::EC2::Subnet'
        assert resources['PublicSubnet2']['Type'] == 'AWS::EC2::Subnet'
    
    def test_has_private_subnets(self, resources):
        """Test that private subnets exist."""
        assert 'PrivateSubnet1' in resources
        assert 'PrivateSubnet2' in resources
        assert resources['PrivateSubnet1']['Type'] == 'AWS::EC2::Subnet'
        assert resources['PrivateSubnet2']['Type'] == 'AWS::EC2::Subnet'
    
    def test_subnets_use_dynamic_azs(self, resources):
        """Test that subnets use dynamic AZ selection instead of hardcoded."""
        for subnet_name in ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2']:
            subnet = resources[subnet_name]
            az = subnet['Properties']['AvailabilityZone']
            # Check for !Select and !GetAZs intrinsic functions
            assert isinstance(az, dict)
            assert 'Fn::Select' in az
    
    def test_has_internet_gateway(self, resources):
        """Test that Internet Gateway exists and is attached."""
        assert 'InternetGateway' in resources
        assert 'InternetGatewayAttachment' in resources
        assert resources['InternetGateway']['Type'] == 'AWS::EC2::InternetGateway'
        assert resources['InternetGatewayAttachment']['Type'] == 'AWS::EC2::VPCGatewayAttachment'
    
    def test_has_nat_gateway(self, resources):
        """Test that NAT Gateway exists for private subnet internet access."""
        assert 'NatGateway1' in resources
        assert 'NatGateway1EIP' in resources
        assert resources['NatGateway1']['Type'] == 'AWS::EC2::NatGateway'
        assert resources['NatGateway1EIP']['Type'] == 'AWS::EC2::EIP'
    
    def test_has_route_tables(self, resources):
        """Test that route tables exist for public and private subnets."""
        assert 'PublicRouteTable' in resources
        assert 'PrivateRouteTable1' in resources
        assert 'DefaultPublicRoute' in resources
        assert 'DefaultPrivateRoute1' in resources

class TestIAMRoles:
    """Test IAM roles follow least privilege principle."""
    
    def test_ec2_role_exists(self, resources):
        """Test that EC2 role exists with proper configuration."""
        assert 'EC2Role' in resources
        assert 'EC2InstanceProfile' in resources
        role = resources['EC2Role']
        assert role['Type'] == 'AWS::IAM::Role'
        assert 'AssumeRolePolicyDocument' in role['Properties']
        assert 'Policies' in role['Properties']
    
    def test_lambda_execution_role_exists(self, resources):
        """Test that Lambda execution role exists."""
        assert 'LambdaExecutionRole' in resources
        role = resources['LambdaExecutionRole']
        assert role['Type'] == 'AWS::IAM::Role'
        assert 'ManagedPolicyArns' in role['Properties']
        # Check for VPC access policy
        assert 'arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole' in role['Properties']['ManagedPolicyArns']
    
    def test_cloudtrail_role_exists(self, resources):
        """Test that CloudTrail role exists."""
        assert 'CloudTrailRole' in resources
        role = resources['CloudTrailRole']
        assert role['Type'] == 'AWS::IAM::Role'
        assert 'Policies' in role['Properties']
    
    def test_roles_have_tags(self, resources):
        """Test that IAM roles have Environment and Owner tags."""
        role_names = ['EC2Role', 'LambdaExecutionRole', 'CloudTrailRole']
        for role_name in role_names:
            role = resources[role_name]
            assert 'Tags' in role['Properties']
            tags = role['Properties']['Tags']
            tag_keys = [tag['Key'] for tag in tags]
            assert 'Environment' in tag_keys
            assert 'Owner' in tag_keys

class TestSecurityGroups:
    """Test security groups configuration."""
    
    def test_ec2_security_group_exists(self, resources):
        """Test that EC2 security group exists with restricted access."""
        assert 'EC2SecurityGroup' in resources
        sg = resources['EC2SecurityGroup']
        assert sg['Type'] == 'AWS::EC2::SecurityGroup'
        assert 'SecurityGroupIngress' in sg['Properties']
        
        # Check that ingress rules reference TrustedCIDR parameter
        for rule in sg['Properties']['SecurityGroupIngress']:
            if 'CidrIp' in rule:
                assert isinstance(rule['CidrIp'], dict) and 'Ref' in rule['CidrIp']
    
    def test_rds_security_group_exists(self, resources):
        """Test that RDS security group exists."""
        assert 'RDSSecurityGroup' in resources
        sg = resources['RDSSecurityGroup']
        assert sg['Type'] == 'AWS::EC2::SecurityGroup'
        assert 'SecurityGroupIngress' in sg['Properties']
        
        # Check that RDS only allows access from EC2 security group
        ingress = sg['Properties']['SecurityGroupIngress'][0]
        assert 'SourceSecurityGroupId' in ingress
    
    def test_lambda_security_group_exists(self, resources):
        """Test that Lambda security group exists."""
        assert 'LambdaSecurityGroup' in resources
        sg = resources['LambdaSecurityGroup']
        assert sg['Type'] == 'AWS::EC2::SecurityGroup'
        assert 'SecurityGroupEgress' in sg['Properties']
    
    def test_security_groups_have_tags(self, resources):
        """Test that security groups have proper tags."""
        sg_names = ['EC2SecurityGroup', 'RDSSecurityGroup', 'LambdaSecurityGroup']
        for sg_name in sg_names:
            sg = resources[sg_name]
            assert 'Tags' in sg['Properties']
            tags = sg['Properties']['Tags']
            tag_keys = [tag['Key'] for tag in tags]
            assert 'Environment' in tag_keys
            assert 'Owner' in tag_keys

class TestS3Buckets:
    """Test S3 bucket configuration and encryption."""
    
    def test_s3_buckets_exist(self, resources):
        """Test that S3 buckets exist."""
        assert 'SecureS3Bucket' in resources
        assert 'CloudTrailS3Bucket' in resources
    
    def test_s3_buckets_have_encryption(self, resources):
        """Test that S3 buckets have AES-256 encryption enabled."""
        bucket_names = ['SecureS3Bucket', 'CloudTrailS3Bucket']
        for bucket_name in bucket_names:
            bucket = resources[bucket_name]
            assert bucket['Type'] == 'AWS::S3::Bucket'
            assert 'BucketEncryption' in bucket['Properties']
            encryption_config = bucket['Properties']['BucketEncryption']['ServerSideEncryptionConfiguration'][0]
            assert encryption_config['ServerSideEncryptionByDefault']['SSEAlgorithm'] == 'AES256'
    
    def test_s3_buckets_block_public_access(self, resources):
        """Test that S3 buckets block all public access."""
        bucket_names = ['SecureS3Bucket', 'CloudTrailS3Bucket']
        for bucket_name in bucket_names:
            bucket = resources[bucket_name]
            public_access = bucket['Properties']['PublicAccessBlockConfiguration']
            assert public_access['BlockPublicAcls'] == True
            assert public_access['BlockPublicPolicy'] == True
            assert public_access['IgnorePublicAcls'] == True
            assert public_access['RestrictPublicBuckets'] == True
    
    def test_s3_buckets_have_tags(self, resources):
        """Test that S3 buckets have proper tags."""
        bucket_names = ['SecureS3Bucket', 'CloudTrailS3Bucket']
        for bucket_name in bucket_names:
            bucket = resources[bucket_name]
            assert 'Tags' in bucket['Properties']
            tags = bucket['Properties']['Tags']
            tag_keys = [tag['Key'] for tag in tags]
            assert 'Environment' in tag_keys
            assert 'Owner' in tag_keys
    
    def test_cloudtrail_bucket_policy(self, resources):
        """Test that CloudTrail S3 bucket has proper bucket policy."""
        assert 'CloudTrailS3BucketPolicy' in resources
        policy = resources['CloudTrailS3BucketPolicy']
        assert policy['Type'] == 'AWS::S3::BucketPolicy'

class TestCloudTrail:
    """Test CloudTrail logging configuration."""
    
    def test_cloudtrail_exists(self, resources):
        """Test that CloudTrail trail exists."""
        assert 'CloudTrail' in resources
        trail = resources['CloudTrail']
        assert trail['Type'] == 'AWS::CloudTrail::Trail'
    
    def test_cloudtrail_configuration(self, resources):
        """Test CloudTrail configuration for multi-region and validation."""
        trail = resources['CloudTrail']
        props = trail['Properties']
        assert props['IsMultiRegionTrail'] == True
        assert props['EnableLogFileValidation'] == True
        assert props['IncludeGlobalServiceEvents'] == True
        assert props['IsLogging'] == True
    
    def test_cloudtrail_has_cloudwatch_logs(self, resources):
        """Test that CloudTrail sends logs to CloudWatch."""
        trail = resources['CloudTrail']
        assert 'CloudWatchLogsLogGroupArn' in trail['Properties']
        assert 'CloudWatchLogsRoleArn' in trail['Properties']
    
    def test_cloudtrail_log_group_exists(self, resources):
        """Test that CloudTrail log group exists."""
        assert 'CloudTrailLogGroup' in resources
        log_group = resources['CloudTrailLogGroup']
        assert log_group['Type'] == 'AWS::Logs::LogGroup'
        assert 'RetentionInDays' in log_group['Properties']

class TestRDSConfiguration:
    """Test RDS database configuration."""
    
    def test_rds_instance_exists(self, resources):
        """Test that RDS instance exists."""
        assert 'RDSInstance' in resources
        rds = resources['RDSInstance']
        assert rds['Type'] == 'AWS::RDS::DBInstance'
    
    def test_rds_multi_az_enabled(self, resources):
        """Test that RDS has Multi-AZ deployment enabled."""
        rds = resources['RDSInstance']
        assert rds['Properties']['MultiAZ'] == True
    
    def test_rds_encryption_enabled(self, resources):
        """Test that RDS has encryption at rest enabled."""
        rds = resources['RDSInstance']
        assert rds['Properties']['StorageEncrypted'] == True
    
    def test_rds_backup_configured(self, resources):
        """Test that RDS has backup retention configured."""
        rds = resources['RDSInstance']
        assert 'BackupRetentionPeriod' in rds['Properties']
        assert rds['Properties']['BackupRetentionPeriod'] > 0
    
    def test_rds_subnet_group_exists(self, resources):
        """Test that RDS subnet group exists."""
        assert 'DBSubnetGroup' in resources
        subnet_group = resources['DBSubnetGroup']
        assert subnet_group['Type'] == 'AWS::RDS::DBSubnetGroup'
    
    def test_rds_has_tags(self, resources):
        """Test that RDS instance has proper tags."""
        rds = resources['RDSInstance']
        assert 'Tags' in rds['Properties']
        tags = rds['Properties']['Tags']
        tag_keys = [tag['Key'] for tag in tags]
        assert 'Environment' in tag_keys
        assert 'Owner' in tag_keys

class TestEC2Configuration:
    """Test EC2 instance configuration."""
    
    def test_ec2_launch_template_exists(self, resources):
        """Test that EC2 launch template exists."""
        assert 'EC2LaunchTemplate' in resources
        template = resources['EC2LaunchTemplate']
        assert template['Type'] == 'AWS::EC2::LaunchTemplate'
    
    def test_ec2_imdsv2_enforced(self, resources):
        """Test that EC2 instances use IMDSv2 exclusively."""
        template = resources['EC2LaunchTemplate']
        metadata_options = template['Properties']['LaunchTemplateData']['MetadataOptions']
        assert metadata_options['HttpTokens'] == 'required'
        assert metadata_options['HttpEndpoint'] == 'enabled'
    
    def test_ec2_instance_exists(self, resources):
        """Test that EC2 instance exists."""
        assert 'EC2Instance' in resources
        instance = resources['EC2Instance']
        assert instance['Type'] == 'AWS::EC2::Instance'
    
    def test_ec2_uses_launch_template(self, resources):
        """Test that EC2 instance uses launch template."""
        instance = resources['EC2Instance']
        assert 'LaunchTemplate' in instance['Properties']
        assert 'LaunchTemplateId' in instance['Properties']['LaunchTemplate']
    
    def test_ec2_has_tags(self, resources):
        """Test that EC2 instance has proper tags."""
        instance = resources['EC2Instance']
        assert 'Tags' in instance['Properties']
        tags = instance['Properties']['Tags']
        tag_keys = [tag['Key'] for tag in tags]
        assert 'Environment' in tag_keys
        assert 'Owner' in tag_keys

class TestLambdaConfiguration:
    """Test Lambda function configuration."""
    
    def test_lambda_function_exists(self, resources):
        """Test that Lambda function exists."""
        assert 'LambdaFunction' in resources
        lambda_fn = resources['LambdaFunction']
        assert lambda_fn['Type'] == 'AWS::Lambda::Function'
    
    def test_lambda_vpc_configured(self, resources):
        """Test that Lambda runs in VPC without public internet access."""
        lambda_fn = resources['LambdaFunction']
        assert 'VpcConfig' in lambda_fn['Properties']
        vpc_config = lambda_fn['Properties']['VpcConfig']
        assert 'SecurityGroupIds' in vpc_config
        assert 'SubnetIds' in vpc_config
        assert len(vpc_config['SubnetIds']) > 0
    
    def test_lambda_log_group_exists(self, resources):
        """Test that Lambda log group exists."""
        assert 'LambdaLogGroup' in resources
        log_group = resources['LambdaLogGroup']
        assert log_group['Type'] == 'AWS::Logs::LogGroup'
    
    def test_lambda_has_tags(self, resources):
        """Test that Lambda function has proper tags."""
        lambda_fn = resources['LambdaFunction']
        assert 'Tags' in lambda_fn['Properties']
        tags = lambda_fn['Properties']['Tags']
        tag_keys = [tag['Key'] for tag in tags]
        assert 'Environment' in tag_keys
        assert 'Owner' in tag_keys

class TestCloudWatchAlarms:
    """Test CloudWatch alarms configuration."""
    
    def test_ec2_cpu_alarm_exists(self, resources):
        """Test that EC2 CPU utilization alarm exists."""
        assert 'EC2CPUAlarm' in resources
        alarm = resources['EC2CPUAlarm']
        assert alarm['Type'] == 'AWS::CloudWatch::Alarm'
        assert alarm['Properties']['MetricName'] == 'CPUUtilization'
    
    def test_ec2_status_check_alarm_exists(self, resources):
        """Test that EC2 status check alarm exists."""
        assert 'EC2StatusCheckFailedAlarm' in resources
        alarm = resources['EC2StatusCheckFailedAlarm']
        assert alarm['Type'] == 'AWS::CloudWatch::Alarm'
        assert alarm['Properties']['MetricName'] == 'StatusCheckFailed'
    
    def test_alarms_have_tags(self, resources):
        """Test that CloudWatch alarms have proper tags."""
        alarm_names = ['EC2CPUAlarm', 'EC2StatusCheckFailedAlarm']
        for alarm_name in alarm_names:
            alarm = resources[alarm_name]
            assert 'Tags' in alarm['Properties']
            tags = alarm['Properties']['Tags']
            tag_keys = [tag['Key'] for tag in tags]
            assert 'Environment' in tag_keys
            assert 'Owner' in tag_keys

class TestVPCEndpoints:
    """Test VPC endpoints for Lambda isolation."""
    
    def test_s3_vpc_endpoint_exists(self, resources):
        """Test that S3 VPC endpoint exists."""
        assert 'S3VPCEndpoint' in resources
        endpoint = resources['S3VPCEndpoint']
        assert endpoint['Type'] == 'AWS::EC2::VPCEndpoint'
        assert endpoint['Properties']['VpcEndpointType'] == 'Gateway'
    
    def test_lambda_vpc_endpoint_exists(self, resources):
        """Test that Lambda VPC endpoint exists."""
        assert 'LambdaVPCEndpoint' in resources
        endpoint = resources['LambdaVPCEndpoint']
        assert endpoint['Type'] == 'AWS::EC2::VPCEndpoint'
        assert endpoint['Properties']['VpcEndpointType'] == 'Interface'
    
    def test_ssm_vpc_endpoint_exists(self, resources):
        """Test that SSM VPC endpoint exists."""
        assert 'SSMVPCEndpoint' in resources
        endpoint = resources['SSMVPCEndpoint']
        assert endpoint['Type'] == 'AWS::EC2::VPCEndpoint'
        assert endpoint['Properties']['VpcEndpointType'] == 'Interface'

class TestOutputs:
    """Test CloudFormation outputs."""
    
    def test_essential_outputs_exist(self, outputs):
        """Test that essential outputs are exported."""
        essential_outputs = [
            'VPCId', 'EC2InstanceId', 'RDSEndpoint', 
            'S3BucketName', 'LambdaFunctionArn', 'CloudTrailArn'
        ]
        for output_name in essential_outputs:
            assert output_name in outputs
            assert 'Value' in outputs[output_name]
            assert 'Description' in outputs[output_name]
    
    def test_outputs_have_export_names(self, outputs):
        """Test that outputs have export names with EnvironmentSuffix."""
        for output_name, output_config in outputs.items():
            if 'Export' in output_config:
                export_name = output_config['Export']['Name']
                # Check that export name uses !Sub with EnvironmentSuffix
                assert isinstance(export_name, dict)
                assert 'Fn::Sub' in export_name

class TestResourceNaming:
    """Test that resources use EnvironmentSuffix for naming."""
    
    def test_resources_use_environment_suffix(self, resources):
        """Test that resource names include EnvironmentSuffix."""
        resources_to_check = [
            ('EC2Role', 'RoleName'),
            ('LambdaExecutionRole', 'RoleName'),
            ('CloudTrailRole', 'RoleName'),
            ('EC2InstanceProfile', 'InstanceProfileName'),
            ('EC2LaunchTemplate', 'LaunchTemplateName'),
            ('LambdaFunction', 'FunctionName'),
            ('CloudTrail', 'TrailName'),
            ('EC2CPUAlarm', 'AlarmName'),
            ('EC2StatusCheckFailedAlarm', 'AlarmName'),
            ('S3EventRule', 'Name'),
            ('DBSubnetGroup', 'DBSubnetGroupName'),
            ('RDSInstance', 'DBInstanceIdentifier'),
            ('EC2SecurityGroup', 'GroupName'),
            ('RDSSecurityGroup', 'GroupName'),
            ('LambdaSecurityGroup', 'GroupName')
        ]
        
        for resource_name, property_name in resources_to_check:
            if resource_name in resources:
                resource = resources[resource_name]
                if property_name in resource.get('Properties', {}):
                    name_value = resource['Properties'][property_name]
                    # Check that the name uses !Sub with EnvironmentSuffix
                    if isinstance(name_value, dict) and 'Fn::Sub' in name_value:
                        assert '${EnvironmentSuffix}' in name_value['Fn::Sub'] or \
                               '${EnvironmentSuffix}' in str(name_value)

class TestEventBridge:
    """Test EventBridge configuration for S3 events."""
    
    def test_s3_event_rule_exists(self, resources):
        """Test that S3 EventBridge rule exists."""
        assert 'S3EventRule' in resources
        rule = resources['S3EventRule']
        assert rule['Type'] == 'AWS::Events::Rule'
        assert rule['Properties']['State'] == 'ENABLED'
    
    def test_s3_bucket_has_eventbridge_enabled(self, resources):
        """Test that S3 bucket has EventBridge notifications enabled."""
        bucket = resources['SecureS3Bucket']
        assert 'NotificationConfiguration' in bucket['Properties']
        assert 'EventBridgeConfiguration' in bucket['Properties']['NotificationConfiguration']
        assert bucket['Properties']['NotificationConfiguration']['EventBridgeConfiguration']['EventBridgeEnabled'] == True

class TestRegionConfiguration:
    """Test that resources are configured for us-west-2 region."""
    
    def test_has_region_mapping(self, cfn_template):
        """Test that template has region mapping for AMIs."""
        assert 'Mappings' in cfn_template
        assert 'RegionMap' in cfn_template['Mappings']
        assert 'us-west-2' in cfn_template['Mappings']['RegionMap']
        assert 'us-east-1' in cfn_template['Mappings']['RegionMap']
    
    def test_ec2_uses_region_mapping(self, resources):
        """Test that EC2 launch template uses region mapping for AMI."""
        template = resources['EC2LaunchTemplate']
        image_id = template['Properties']['LaunchTemplateData']['ImageId']
        # Check for !FindInMap intrinsic function
        assert isinstance(image_id, dict)
        assert 'Fn::FindInMap' in image_id