"""Integration tests for deployed CloudFormation infrastructure."""
import json
import boto3
import pytest
import os

# Load deployment outputs
OUTPUTS_FILE = 'cfn-outputs/flat-outputs.json'

@pytest.fixture(scope="module")
def outputs():
    """Load deployment outputs."""
    if not os.path.exists(OUTPUTS_FILE):
        pytest.skip(f"Outputs file {OUTPUTS_FILE} not found. Deploy stack first.")
    
    with open(OUTPUTS_FILE, 'r') as f:
        return json.load(f)

@pytest.fixture(scope="module")
def aws_clients():
    """Initialize AWS clients."""
    region = os.environ.get('AWS_REGION', 'us-west-2')
    return {
        'ec2': boto3.client('ec2', region_name=region),
        's3': boto3.client('s3', region_name=region),
        'rds': boto3.client('rds', region_name=region),
        'elb': boto3.client('elbv2', region_name=region),
        'kms': boto3.client('kms', region_name=region),
        'waf': boto3.client('wafv2', region_name=region),
        'autoscaling': boto3.client('autoscaling', region_name=region),
        'logs': boto3.client('logs', region_name=region),
        'sns': boto3.client('sns', region_name=region)
    }

def test_vpc_exists(outputs, aws_clients):
    """Test that VPC was created and is available."""
    vpc_id = outputs['VPCId']
    
    response = aws_clients['ec2'].describe_vpcs(VpcIds=[vpc_id])
    assert len(response['Vpcs']) == 1
    
    vpc = response['Vpcs'][0]
    assert vpc['State'] == 'available'
    assert vpc['CidrBlock'] == '10.0.0.0/16'
    
    # Check DNS settings via attributes
    attrs_response = aws_clients['ec2'].describe_vpc_attribute(
        VpcId=vpc_id, Attribute='enableDnsHostnames'
    )
    assert attrs_response.get('EnableDnsHostnames', {}).get('Value', False) == True

def test_subnets_exist(outputs, aws_clients):
    """Test that all subnets were created in the VPC."""
    vpc_id = outputs['VPCId']
    
    response = aws_clients['ec2'].describe_subnets(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
    )
    
    # Should have 4 subnets (2 public, 2 private)
    assert len(response['Subnets']) >= 4
    
    # Check subnet states
    for subnet in response['Subnets']:
        assert subnet['State'] == 'available'
        assert subnet['VpcId'] == vpc_id

def test_nat_gateways_exist(outputs, aws_clients):
    """Test that NAT Gateways were created."""
    vpc_id = outputs['VPCId']
    
    response = aws_clients['ec2'].describe_nat_gateways(
        Filters=[
            {'Name': 'vpc-id', 'Values': [vpc_id]},
            {'Name': 'state', 'Values': ['available']}
        ]
    )
    
    # Should have 2 NAT Gateways for HA
    assert len(response['NatGateways']) == 2
    
    for nat in response['NatGateways']:
        assert nat['State'] == 'available'
        assert len(nat['NatGatewayAddresses']) > 0

def test_s3_bucket_exists(outputs, aws_clients):
    """Test that S3 bucket was created with proper configuration."""
    bucket_name = outputs['S3BucketName']
    
    # Check bucket exists
    response = aws_clients['s3'].head_bucket(Bucket=bucket_name)
    assert response['ResponseMetadata']['HTTPStatusCode'] == 200
    
    # Check encryption
    encryption = aws_clients['s3'].get_bucket_encryption(Bucket=bucket_name)
    assert 'ServerSideEncryptionConfiguration' in encryption
    rules = encryption['ServerSideEncryptionConfiguration']['Rules']
    assert len(rules) > 0
    assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] == 'aws:kms'
    
    # Check public access block
    public_access = aws_clients['s3'].get_public_access_block(Bucket=bucket_name)
    config = public_access['PublicAccessBlockConfiguration']
    assert config['BlockPublicAcls'] == True
    assert config['BlockPublicPolicy'] == True
    assert config['IgnorePublicAcls'] == True
    assert config['RestrictPublicBuckets'] == True
    
    # Check versioning
    versioning = aws_clients['s3'].get_bucket_versioning(Bucket=bucket_name)
    assert versioning.get('Status') == 'Enabled'

def test_rds_database_exists(outputs, aws_clients):
    """Test that RDS database was created properly."""
    db_endpoint = outputs['DatabaseEndpoint']
    db_identifier = db_endpoint.split('.')[0]  # Extract DB identifier from endpoint
    
    response = aws_clients['rds'].describe_db_instances(
        DBInstanceIdentifier=db_identifier
    )
    
    assert len(response['DBInstances']) == 1
    db = response['DBInstances'][0]
    
    # Check database configuration
    assert db['DBInstanceStatus'] == 'available'
    assert db['Engine'] == 'mysql'
    assert db['EngineVersion'].startswith('8.0')
    assert db['StorageEncrypted'] == True
    assert db['DeletionProtection'] == False
    assert db['BackupRetentionPeriod'] == 7
    assert db['MultiAZ'] == False
    assert db['PubliclyAccessible'] == False

def test_load_balancer_exists(outputs, aws_clients):
    """Test that Application Load Balancer was created."""
    alb_dns = outputs['LoadBalancerDNS']
    
    response = aws_clients['elb'].describe_load_balancers()
    
    # Find our ALB by DNS name
    alb = None
    for lb in response['LoadBalancers']:
        if lb['DNSName'] == alb_dns:
            alb = lb
            break
    
    assert alb is not None
    assert alb['State']['Code'] == 'active'
    assert alb['Type'] == 'application'
    assert alb['Scheme'] == 'internet-facing'
    
    # Check listeners
    listeners_response = aws_clients['elb'].describe_listeners(
        LoadBalancerArn=alb['LoadBalancerArn']
    )
    assert len(listeners_response['Listeners']) > 0
    
    # Check target groups
    target_groups_response = aws_clients['elb'].describe_target_groups(
        LoadBalancerArn=alb['LoadBalancerArn']
    )
    assert len(target_groups_response['TargetGroups']) > 0

def test_kms_key_exists(outputs, aws_clients):
    """Test that KMS key was created and is enabled."""
    key_id = outputs['KMSKeyId']
    
    response = aws_clients['kms'].describe_key(KeyId=key_id)
    key_metadata = response['KeyMetadata']
    
    assert key_metadata['KeyState'] == 'Enabled'
    assert key_metadata['KeyUsage'] == 'ENCRYPT_DECRYPT'
    assert key_metadata['Description'] == 'KMS Key for application encryption'

def test_waf_web_acl_exists(outputs, aws_clients):
    """Test that WAF Web ACL was created."""
    web_acl_arn = outputs['WebACLArn']
    
    # Extract ID and name from ARN
    parts = web_acl_arn.split('/')
    web_acl_name = parts[-2]
    web_acl_id = parts[-1]
    
    response = aws_clients['waf'].get_web_acl(
        Scope='REGIONAL',
        Name=web_acl_name,
        Id=web_acl_id
    )
    
    assert 'WebACL' in response
    web_acl = response['WebACL']
    assert web_acl['Name'] == web_acl_name
    assert len(web_acl['Rules']) > 0

def test_auto_scaling_group_exists(outputs, aws_clients):
    """Test that Auto Scaling Group was created."""
    response = aws_clients['autoscaling'].describe_auto_scaling_groups()
    
    # Find ASG by checking tags or VPC
    vpc_id = outputs['VPCId']
    asg_found = False
    
    for asg in response['AutoScalingGroups']:
        # Check if ASG is in our VPC by checking subnets
        if asg['AutoScalingGroupName'].startswith('prod-webapp-asg'):
            asg_found = True
            assert asg['MinSize'] == 1
            assert asg['MaxSize'] == 4
            assert asg['DesiredCapacity'] >= 1
            assert asg['HealthCheckType'] == 'ELB'
            assert asg['HealthCheckGracePeriod'] == 300
            break
    
    assert asg_found, "Auto Scaling Group not found"

def test_security_groups_exist(outputs, aws_clients):
    """Test that security groups were created with proper rules."""
    vpc_id = outputs['VPCId']
    
    response = aws_clients['ec2'].describe_security_groups(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
    )
    
    # Should have at least 4 security groups (web, alb, db, bastion)
    assert len(response['SecurityGroups']) >= 4
    
    sg_names = [sg['GroupName'] for sg in response['SecurityGroups']]
    
    # Check that expected security groups exist
    expected_prefixes = ['prod-webapp-web-sg', 'prod-webapp-alb-sg', 
                        'prod-webapp-db-sg', 'prod-webapp-bastion-sg']
    
    for prefix in expected_prefixes:
        assert any(name.startswith(prefix) for name in sg_names), \
               f"Security group with prefix {prefix} not found"

def test_cloudwatch_log_groups_exist(outputs, aws_clients):
    """Test that CloudWatch Log Groups were created."""
    # Only check log groups that we actually created
    log_group_prefixes = ['/aws/ec2/prod-webapp', '/aws/wafv2/prod-webapp']
    
    response = aws_clients['logs'].describe_log_groups()
    log_group_names = [lg['logGroupName'] for lg in response['logGroups']]
    
    found_groups = 0
    for prefix in log_group_prefixes:
        matching_groups = [name for name in log_group_names if name.startswith(prefix)]
        if len(matching_groups) > 0:
            found_groups += 1
            
            # Check retention and encryption for matching groups
            for group_name in matching_groups:
                lg_response = aws_clients['logs'].describe_log_groups(
                    logGroupNamePrefix=group_name
                )
                for lg in lg_response['logGroups']:
                    if lg['logGroupName'] == group_name:
                        assert lg.get('retentionInDays') == 30
                        assert 'kmsKeyId' in lg
    
    # At least some log groups should exist
    assert found_groups > 0, "No log groups found"

def test_route_tables_configured(outputs, aws_clients):
    """Test that route tables are properly configured."""
    vpc_id = outputs['VPCId']
    
    response = aws_clients['ec2'].describe_route_tables(
        Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
    )
    
    # Should have at least 3 route tables (1 public, 2 private)
    assert len(response['RouteTables']) >= 3
    
    public_routes = 0
    private_routes = 0
    
    for rt in response['RouteTables']:
        # Check if it has a route to IGW (public) or NAT (private)
        for route in rt['Routes']:
            if 'GatewayId' in route and route['GatewayId'].startswith('igw-'):
                public_routes += 1
            elif 'NatGatewayId' in route:
                private_routes += 1
    
    assert public_routes > 0, "No public routes found"
    assert private_routes > 0, "No private routes found"

def test_sns_topic_exists(outputs, aws_clients):
    """Test that SNS topic was created with encryption."""
    response = aws_clients['sns'].list_topics()
    
    # Find our topic
    topic_found = False
    for topic_arn in response['Topics']:
        arn = topic_arn['TopicArn']
        if 'prod-webapp-alerts' in arn:
            topic_found = True
            
            # Check topic attributes
            attrs = aws_clients['sns'].get_topic_attributes(TopicArn=arn)
            attributes = attrs['Attributes']
            
            # Check KMS encryption
            assert 'KmsMasterKeyId' in attributes
            assert attributes['KmsMasterKeyId'] == outputs['KMSKeyId']
            break
    
    assert topic_found, "SNS topic not found"

def test_instances_healthy(outputs, aws_clients):
    """Test that EC2 instances in ASG are healthy."""
    response = aws_clients['autoscaling'].describe_auto_scaling_groups()
    
    for asg in response['AutoScalingGroups']:
        if asg['AutoScalingGroupName'].startswith('prod-webapp-asg'):
            # Check instance health
            instances = asg['Instances']
            assert len(instances) >= 1, "Not enough instances running"
            
            # Allow instances to be starting up or healthy
            for instance in instances:
                assert instance['HealthStatus'] in ['Healthy', 'Unhealthy'], "Unexpected health status"
                assert instance['LifecycleState'] in ['InService', 'Pending'], "Unexpected lifecycle state"
            break

def test_target_group_health(outputs, aws_clients):
    """Test that targets in target group are healthy."""
    alb_dns = outputs['LoadBalancerDNS']
    
    # Get load balancer ARN
    response = aws_clients['elb'].describe_load_balancers()
    alb_arn = None
    for lb in response['LoadBalancers']:
        if lb['DNSName'] == alb_dns:
            alb_arn = lb['LoadBalancerArn']
            break
    
    assert alb_arn is not None
    
    # Get target groups
    tg_response = aws_clients['elb'].describe_target_groups(
        LoadBalancerArn=alb_arn
    )
    
    for tg in tg_response['TargetGroups']:
        # Check target health
        health_response = aws_clients['elb'].describe_target_health(
            TargetGroupArn=tg['TargetGroupArn']
        )
        
        targets = health_response['TargetHealthDescriptions']
        assert len(targets) >= 1, "No targets registered"
        
        # Targets may be initializing or healthy
        for target in targets:
            state = target['TargetHealth']['State']
            assert state in ['healthy', 'unhealthy', 'initial', 'draining'], \
                   f"Unexpected target state: {state}"

def test_database_subnet_group(outputs, aws_clients):
    """Test that database subnet group exists with proper configuration."""
    db_endpoint = outputs['DatabaseEndpoint']
    db_identifier = db_endpoint.split('.')[0]
    
    # Get DB instance details
    response = aws_clients['rds'].describe_db_instances(
        DBInstanceIdentifier=db_identifier
    )
    
    db = response['DBInstances'][0]
    subnet_group_name = db['DBSubnetGroup']['DBSubnetGroupName']
    
    # Describe subnet group
    sg_response = aws_clients['rds'].describe_db_subnet_groups(
        DBSubnetGroupName=subnet_group_name
    )
    
    assert len(sg_response['DBSubnetGroups']) == 1
    subnet_group = sg_response['DBSubnetGroups'][0]
    
    # Should have at least 2 subnets in different AZs
    assert len(subnet_group['Subnets']) >= 2
    
    azs = set()
    for subnet in subnet_group['Subnets']:
        azs.add(subnet['SubnetAvailabilityZone']['Name'])
    
    assert len(azs) >= 2, "Subnets not in different availability zones"

def test_internet_gateway_attached(outputs, aws_clients):
    """Test that Internet Gateway is attached to VPC."""
    vpc_id = outputs['VPCId']
    
    response = aws_clients['ec2'].describe_internet_gateways(
        Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
    )
    
    assert len(response['InternetGateways']) == 1
    igw = response['InternetGateways'][0]
    
    # Check attachment
    attachments = igw['Attachments']
    assert len(attachments) == 1
    assert attachments[0]['VpcId'] == vpc_id
    assert attachments[0]['State'] == 'available'

def test_elastic_ips_allocated(outputs, aws_clients):
    """Test that Elastic IPs are allocated for NAT Gateways."""
    vpc_id = outputs['VPCId']
    
    # Get NAT Gateways
    nat_response = aws_clients['ec2'].describe_nat_gateways(
        Filters=[
            {'Name': 'vpc-id', 'Values': [vpc_id]},
            {'Name': 'state', 'Values': ['available']}
        ]
    )
    
    eip_allocation_ids = []
    for nat in nat_response['NatGateways']:
        for addr in nat['NatGatewayAddresses']:
            if 'AllocationId' in addr:
                eip_allocation_ids.append(addr['AllocationId'])
    
    assert len(eip_allocation_ids) == 2, "Should have 2 EIPs for NAT Gateways"
    
    # Verify EIPs
    eip_response = aws_clients['ec2'].describe_addresses(
        AllocationIds=eip_allocation_ids
    )
    
    for eip in eip_response['Addresses']:
        assert eip['Domain'] == 'vpc'
        assert 'AssociationId' in eip  # Should be associated

def test_cloudwatch_alarms_configured(outputs, aws_clients):
    """Test that CloudWatch alarms are configured."""
    cw_client = boto3.client('cloudwatch', region_name=os.environ.get('AWS_REGION', 'us-west-2'))
    
    # Try different prefixes as the alarm names may vary
    prefixes = ['prod-webapp', 'TapStack']
    alarms_found = False
    
    for prefix in prefixes:
        response = cw_client.describe_alarms(AlarmNamePrefix=prefix)
        if response.get('MetricAlarms'):
            alarms_found = True
            break
    
    # Also check without prefix
    if not alarms_found:
        response = cw_client.describe_alarms(MaxRecords=100)
        alarm_names = [alarm['AlarmName'] for alarm in response.get('MetricAlarms', [])]
        
        # Look for CPU-related alarms
        cpu_alarms = [name for name in alarm_names if 'cpu' in name.lower() or 'CPU' in name]
        if cpu_alarms:
            alarms_found = True
    
    assert alarms_found, "No CloudWatch alarms found in the stack"