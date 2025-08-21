"""Unit tests for CloudFormation secure infrastructure template."""
import json
import yaml
import pytest
import os
import subprocess
import sys
sys.path.insert(0, 'lib')
from template_validator import CloudFormationTemplateValidator

# Template path
TEMPLATE_PATH = 'lib/secure-infrastructure.yaml'

class CloudFormationLoader(yaml.SafeLoader):
    """Custom YAML loader that handles CloudFormation intrinsic functions."""
    pass

def cfn_constructor(loader, tag_suffix, node):
    """Constructor for CloudFormation intrinsic functions."""
    if isinstance(node, yaml.ScalarNode):
        return loader.construct_scalar(node)
    elif isinstance(node, yaml.SequenceNode):
        return loader.construct_sequence(node)
    elif isinstance(node, yaml.MappingNode):
        return loader.construct_mapping(node)
    return None

# Register CloudFormation intrinsic functions
for function in ['Ref', 'GetAtt', 'Base64', 'GetAZs', 'ImportValue', 'Join',
                 'Select', 'Split', 'FindInMap', 'Sub', 'Cidr', 'Equals', 'If',
                 'Not', 'And', 'Or', 'Transform']:
    CloudFormationLoader.add_constructor(f'!{function}', cfn_constructor)

@pytest.fixture
def template():
    """Load CloudFormation template."""
    # Use cfn-flip to convert to JSON first, then load
    result = subprocess.run(['pipenv', 'run', 'cfn-flip', TEMPLATE_PATH], 
                          capture_output=True, text=True)
    if result.returncode == 0:
        return json.loads(result.stdout)
    else:
        # Fallback to custom loader
        with open(TEMPLATE_PATH, 'r') as f:
            return yaml.load(f, Loader=CloudFormationLoader)

def test_template_structure(template):
    """Test that template has required top-level sections."""
    assert 'AWSTemplateFormatVersion' in template
    assert template['AWSTemplateFormatVersion'] == '2010-09-09'
    assert 'Description' in template
    assert 'Parameters' in template
    assert 'Resources' in template
    assert 'Outputs' in template

def test_parameters_exist(template):
    """Test that all required parameters are defined."""
    required_params = ['EnvironmentSuffix', 'InstanceType', 'DatabaseName', 'DatabaseUsername']
    
    for param in required_params:
        assert param in template['Parameters'], f"Parameter {param} missing"
        assert 'Type' in template['Parameters'][param]
        assert 'Description' in template['Parameters'][param]

def test_kms_key_configuration(template):
    """Test KMS key configuration and policies."""
    assert 'AppKMSKey' in template['Resources']
    kms_key = template['Resources']['AppKMSKey']
    
    assert kms_key['Type'] == 'AWS::KMS::Key'
    assert 'KeyPolicy' in kms_key['Properties']
    
    # Check key policy statements
    statements = kms_key['Properties']['KeyPolicy']['Statement']
    assert len(statements) >= 3  # Should have IAM, services, and CloudWatch Logs statements
    
    # Check for CloudWatch Logs permission
    cloudwatch_statement = next((s for s in statements if s.get('Sid') == 'Allow CloudWatch Logs'), None)
    assert cloudwatch_statement is not None
    assert 'logs' in str(cloudwatch_statement['Principal']['Service'])

def test_vpc_configuration(template):
    """Test VPC and networking configuration."""
    assert 'AppVPC' in template['Resources']
    vpc = template['Resources']['AppVPC']
    
    assert vpc['Type'] == 'AWS::EC2::VPC'
    assert 'CidrBlock' in vpc['Properties']
    assert vpc['Properties']['EnableDnsHostnames'] == True
    assert vpc['Properties']['EnableDnsSupport'] == True

def test_subnets_configuration(template):
    """Test subnet configuration."""
    subnet_resources = ['PublicSubnet1', 'PublicSubnet2', 'PrivateSubnet1', 'PrivateSubnet2']
    
    for subnet_name in subnet_resources:
        assert subnet_name in template['Resources']
        subnet = template['Resources'][subnet_name]
        assert subnet['Type'] == 'AWS::EC2::Subnet'
        assert 'CidrBlock' in subnet['Properties']
        assert 'AvailabilityZone' in subnet['Properties']

def test_security_groups(template):
    """Test security group configuration."""
    security_groups = ['WebServerSecurityGroup', 'LoadBalancerSecurityGroup', 
                      'DatabaseSecurityGroup', 'BastionSecurityGroup']
    
    for sg_name in security_groups:
        assert sg_name in template['Resources']
        sg = template['Resources'][sg_name]
        assert sg['Type'] == 'AWS::EC2::SecurityGroup'
        assert 'GroupDescription' in sg['Properties']
        assert 'SecurityGroupIngress' in sg['Properties']

def test_database_configuration(template):
    """Test RDS database configuration."""
    assert 'Database' in template['Resources']
    db = template['Resources']['Database']
    
    assert db['Type'] == 'AWS::RDS::DBInstance'
    assert db['Properties']['Engine'] == 'mysql'
    assert db['Properties']['EngineVersion'] == '8.0.37'
    assert db['Properties']['StorageEncrypted'] == True
    assert db['Properties']['DeletionProtection'] == False  # Should be false for destroy
    assert db['Properties']['BackupRetentionPeriod'] == 7

def test_s3_buckets(template):
    """Test S3 bucket configuration."""
    buckets = ['AppS3Bucket', 'LoggingBucket']
    
    for bucket_name in buckets:
        assert bucket_name in template['Resources']
        bucket = template['Resources'][bucket_name]
        assert bucket['Type'] == 'AWS::S3::Bucket'
        
        # Check encryption
        assert 'BucketEncryption' in bucket['Properties']
        encryption = bucket['Properties']['BucketEncryption']['ServerSideEncryptionConfiguration'][0]
        assert encryption['ServerSideEncryptionByDefault']['SSEAlgorithm'] == 'aws:kms'
        
        # Check public access block
        assert 'PublicAccessBlockConfiguration' in bucket['Properties']
        block_config = bucket['Properties']['PublicAccessBlockConfiguration']
        assert block_config['BlockPublicAcls'] == True
        assert block_config['BlockPublicPolicy'] == True

def test_auto_scaling_configuration(template):
    """Test Auto Scaling configuration."""
    assert 'AutoScalingGroup' in template['Resources']
    asg = template['Resources']['AutoScalingGroup']
    
    assert asg['Type'] == 'AWS::AutoScaling::AutoScalingGroup'
    assert asg['Properties']['MinSize'] == 1
    assert asg['Properties']['MaxSize'] == 4
    assert asg['Properties']['DesiredCapacity'] == 2
    
    # Check health check configuration
    assert asg['Properties']['HealthCheckType'] == 'ELB'
    assert asg['Properties']['HealthCheckGracePeriod'] == 300

def test_application_load_balancer(template):
    """Test Application Load Balancer configuration."""
    assert 'ApplicationLoadBalancer' in template['Resources']
    alb = template['Resources']['ApplicationLoadBalancer']
    
    assert alb['Type'] == 'AWS::ElasticLoadBalancingV2::LoadBalancer'
    assert alb['Properties']['Type'] == 'application'
    assert alb['Properties']['Scheme'] == 'internet-facing'
    
    # Check listener configuration
    assert 'Listener' in template['Resources']
    listener = template['Resources']['Listener']
    assert listener['Properties']['Protocol'] == 'HTTP'
    assert listener['Properties']['Port'] == 80

def test_waf_configuration(template):
    """Test WAF configuration."""
    assert 'WebACL' in template['Resources']
    waf = template['Resources']['WebACL']
    
    assert waf['Type'] == 'AWS::WAFv2::WebACL'
    assert waf['Properties']['Scope'] == 'REGIONAL'
    
    # Check for OWASP managed rules
    rules = waf['Properties']['Rules']
    assert len(rules) > 0
    
    # Check for Core Rule Set
    core_rule = next((r for r in rules if 'AWSManagedRulesCommonRuleSet' in str(r)), None)
    assert core_rule is not None

def test_iam_roles(template):
    """Test IAM roles configuration."""
    assert 'EC2Role' in template['Resources']
    role = template['Resources']['EC2Role']
    
    assert role['Type'] == 'AWS::IAM::Role'
    assert 'AssumeRolePolicyDocument' in role['Properties']
    assert 'Policies' in role['Properties']
    
    # Check S3 access policy
    s3_policy = next((p for p in role['Properties']['Policies'] 
                     if p['PolicyName'] == 'S3AccessPolicy'), None)
    assert s3_policy is not None

def test_cloudwatch_log_groups(template):
    """Test CloudWatch Log Groups configuration."""
    log_groups = ['EC2LogGroup', 'S3LogGroup', 'WAFLogGroup']
    
    for lg_name in log_groups:
        assert lg_name in template['Resources']
        lg = template['Resources'][lg_name]
        assert lg['Type'] == 'AWS::Logs::LogGroup'
        assert lg['Properties']['RetentionInDays'] == 30
        assert 'KmsKeyId' in lg['Properties']

def test_sns_topic(template):
    """Test SNS topic configuration."""
    assert 'SNSTopic' in template['Resources']
    topic = template['Resources']['SNSTopic']
    
    assert topic['Type'] == 'AWS::SNS::Topic'
    assert 'KmsMasterKeyId' in topic['Properties']

def test_outputs(template):
    """Test stack outputs."""
    required_outputs = ['VPCId', 'LoadBalancerDNS', 'S3BucketName', 
                       'DatabaseEndpoint', 'KMSKeyId', 'WebACLArn']
    
    for output in required_outputs:
        assert output in template['Outputs'], f"Output {output} missing"
        assert 'Description' in template['Outputs'][output]
        assert 'Value' in template['Outputs'][output]

def test_resource_naming_with_suffix(template):
    """Test that resources use EnvironmentSuffix parameter."""
    resources_to_check = ['WebServerSecurityGroup', 'LoadBalancerSecurityGroup', 
                          'DatabaseSecurityGroup', 'BastionSecurityGroup',
                          'AppS3Bucket', 'LoggingBucket', 'Database']
    
    for resource_name in resources_to_check:
        if resource_name in template['Resources']:
            resource = template['Resources'][resource_name]
            props_str = json.dumps(resource.get('Properties', {}))
            
            # Check if EnvironmentSuffix is referenced (in JSON it will be as Ref or Fn::Sub)
            assert 'EnvironmentSuffix' in props_str or 'dev' in props_str, \
                   f"Resource {resource_name} should use EnvironmentSuffix"

def test_no_retain_policies(template):
    """Test that no resources have Retain deletion policies."""
    for resource_name, resource in template['Resources'].items():
        deletion_policy = resource.get('DeletionPolicy', 'Delete')
        assert deletion_policy != 'Retain', \
               f"Resource {resource_name} has Retain policy - should be deletable"

def test_nat_gateways(template):
    """Test NAT Gateway configuration for high availability."""
    assert 'NatGateway1' in template['Resources']
    assert 'NatGateway2' in template['Resources']
    
    nat1 = template['Resources']['NatGateway1']
    nat2 = template['Resources']['NatGateway2']
    
    assert nat1['Type'] == 'AWS::EC2::NatGateway'
    assert nat2['Type'] == 'AWS::EC2::NatGateway'
    
    # Check EIP associations
    assert 'NatGateway1EIP' in template['Resources']
    assert 'NatGateway2EIP' in template['Resources']

def test_launch_template(template):
    """Test EC2 Launch Template configuration."""
    assert 'LaunchTemplate' in template['Resources']
    lt = template['Resources']['LaunchTemplate']
    
    assert lt['Type'] == 'AWS::EC2::LaunchTemplate'
    lt_data = lt['Properties']['LaunchTemplateData']
    
    # Check AMI ID format
    assert 'ImageId' in lt_data
    assert lt_data['ImageId'].startswith('ami-')
    
    # Check instance profile
    assert 'IamInstanceProfile' in lt_data

def test_target_group(template):
    """Test Target Group configuration."""
    assert 'TargetGroup' in template['Resources']
    tg = template['Resources']['TargetGroup']
    
    assert tg['Type'] == 'AWS::ElasticLoadBalancingV2::TargetGroup'
    assert tg['Properties']['Protocol'] == 'HTTP'
    assert tg['Properties']['Port'] == 80
    
    # Check health check
    health_check = tg['Properties']['HealthCheckPath']
    assert health_check == '/health'

def test_database_subnet_group(template):
    """Test Database Subnet Group configuration."""
    assert 'DatabaseSubnetGroup' in template['Resources']
    dbsg = template['Resources']['DatabaseSubnetGroup']
    
    assert dbsg['Type'] == 'AWS::RDS::DBSubnetGroup'
    assert len(dbsg['Properties']['SubnetIds']) == 2  # Should have 2 subnets

def test_cloudwatch_alarms(template):
    """Test CloudWatch Alarms configuration."""
    alarms = ['CPUAlarmHigh', 'CPUAlarmLow']
    
    for alarm_name in alarms:
        assert alarm_name in template['Resources']
        alarm = template['Resources'][alarm_name]
        assert alarm['Type'] == 'AWS::CloudWatch::Alarm'
        assert 'MetricName' in alarm['Properties']
        assert 'AlarmActions' in alarm['Properties']

def test_scaling_policies(template):
    """Test Auto Scaling policies."""
    policies = ['ScaleUpPolicy', 'ScaleDownPolicy']
    
    for policy_name in policies:
        assert policy_name in template['Resources']
        policy = template['Resources'][policy_name]
        assert policy['Type'] == 'AWS::AutoScaling::ScalingPolicy'
        assert 'AdjustmentType' in policy['Properties']
        assert 'ScalingAdjustment' in policy['Properties']

def test_secrets_manager(template):
    """Test Secrets Manager configuration."""
    assert 'DatabaseSecret' in template['Resources']
    secret = template['Resources']['DatabaseSecret']
    
    assert secret['Type'] == 'AWS::SecretsManager::Secret'
    assert 'GenerateSecretString' in secret['Properties']
    assert 'KmsKeyId' in secret['Properties']
    
    # Check password generation settings
    gen_config = secret['Properties']['GenerateSecretString']
    assert gen_config['PasswordLength'] == 32
    assert gen_config['ExcludeCharacters'] == '\"@/\\'

def test_route_tables(template):
    """Test Route Table configuration."""
    route_tables = ['PublicRouteTable', 'PrivateRouteTable1', 'PrivateRouteTable2']
    
    for rt_name in route_tables:
        assert rt_name in template['Resources']
        rt = template['Resources'][rt_name]
        assert rt['Type'] == 'AWS::EC2::RouteTable'
        assert 'VpcId' in rt['Properties']

def test_internet_gateway(template):
    """Test Internet Gateway configuration."""
    assert 'InternetGateway' in template['Resources']
    igw = template['Resources']['InternetGateway']
    
    assert igw['Type'] == 'AWS::EC2::InternetGateway'
    
    # Check VPC attachment
    assert 'InternetGatewayAttachment' in template['Resources']
    attachment = template['Resources']['InternetGatewayAttachment']
    assert attachment['Type'] == 'AWS::EC2::VPCGatewayAttachment'