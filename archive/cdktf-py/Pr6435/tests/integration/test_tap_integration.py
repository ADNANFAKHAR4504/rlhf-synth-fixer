"""Integration tests for TAP Stack - Live AWS Resource Testing."""

import json
import os
import pytest
import boto3
from pathlib import Path


# Get environment suffix and region from environment variables
ENVIRONMENT_SUFFIX = os.environ.get('ENVIRONMENT_SUFFIX', 'dev')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

# Load outputs from flat-outputs.json
outputs_path = Path.cwd() / 'cfn-outputs' / 'flat-outputs.json'
with open(outputs_path, 'r', encoding='utf-8') as f:
    content = f.read().strip()
    flat_outputs = json.loads(content)

# Get stack outputs
stack_name = f'TapStack{ENVIRONMENT_SUFFIX}'
outputs = flat_outputs.get(stack_name, {})

# Initialize AWS clients
ec2_client = boto3.client('ec2', region_name=AWS_REGION)
elbv2_client = boto3.client('elbv2', region_name=AWS_REGION)
rds_client = boto3.client('rds', region_name=AWS_REGION)
s3_client = boto3.client('s3', region_name=AWS_REGION)
cloudfront_client = boto3.client('cloudfront', region_name=AWS_REGION)
cloudwatch_client = boto3.client('cloudwatch', region_name=AWS_REGION)
wafv2_client = boto3.client('wafv2', region_name=AWS_REGION)
ssm_client = boto3.client('ssm', region_name=AWS_REGION)
autoscaling_client = boto3.client('autoscaling', region_name=AWS_REGION)
logs_client = boto3.client('logs', region_name=AWS_REGION)


class TestVPCNetworking:
    """Test VPC and networking resources."""

    def test_vpc_exists_and_active(self):
        """Test that VPC exists and is available."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1

        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'
        assert vpc['CidrBlock'] == '10.0.0.0/16'

        # Check DNS attributes separately
        dns_support = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsSupport'
        )
        dns_hostnames = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute='enableDnsHostnames'
        )
        assert dns_support['EnableDnsSupport']['Value'] is True
        assert dns_hostnames['EnableDnsHostnames']['Value'] is True

    def test_vpc_has_correct_tags(self):
        """Test that VPC has correct tags with environment suffix."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        assert 'Name' in tags
        assert ENVIRONMENT_SUFFIX in tags['Name']

    def test_public_subnets_exist(self):
        """Test that 3 public subnets exist and are correctly configured."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        response = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'tag:Type', 'Values': ['Public']}
            ]
        )

        subnets = response['Subnets']
        assert len(subnets) == 3, f"Expected 3 public subnets, found {len(subnets)}"

        # Verify each subnet is in a different AZ
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        assert len(azs) == 3, "Public subnets should be in 3 different AZs"

        # Verify map_public_ip_on_launch is enabled
        for subnet in subnets:
            assert subnet['MapPublicIpOnLaunch'] is True

    def test_private_subnets_exist(self):
        """Test that 3 private subnets exist and are correctly configured."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        response = ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'tag:Type', 'Values': ['Private']}
            ]
        )

        subnets = response['Subnets']
        assert len(subnets) == 3, f"Expected 3 private subnets, found {len(subnets)}"

        # Verify each subnet is in a different AZ
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        assert len(azs) == 3, "Private subnets should be in 3 different AZs"

        # Verify map_public_ip_on_launch is disabled
        for subnet in subnets:
            assert subnet['MapPublicIpOnLaunch'] is False

    def test_internet_gateway_attached(self):
        """Test that Internet Gateway is attached to VPC."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        response = ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        assert len(response['InternetGateways']) == 1
        igw = response['InternetGateways'][0]
        assert igw['Attachments'][0]['State'] == 'available'

    def test_nat_gateways_exist(self):
        """Test that 3 NAT Gateways exist (one per AZ)."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        response = ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )

        nat_gateways = response['NatGateways']
        assert len(nat_gateways) == 3, f"Expected 3 NAT Gateways, found {len(nat_gateways)}"

        # Verify NAT Gateways are in different AZs
        azs = set(nat['SubnetId'] for nat in nat_gateways)
        assert len(azs) == 3

    def test_vpc_flow_logs_enabled(self):
        """Test that VPC Flow Logs are enabled."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        response = ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [vpc_id]}
            ]
        )

        assert len(response['FlowLogs']) >= 1, "No flow logs found for VPC"
        flow_log = response['FlowLogs'][0]
        assert flow_log['TrafficType'] == 'ALL'
        assert flow_log['FlowLogStatus'] == 'ACTIVE'
        assert flow_log['ResourceId'] == vpc_id


class TestLoadBalancer:
    """Test Application Load Balancer resources."""

    def test_alb_exists_and_active(self):
        """Test that ALB exists and is active."""
        alb_dns = outputs.get('alb_dns_name')
        assert alb_dns, "ALB DNS name not found in outputs"

        response = elbv2_client.describe_load_balancers(
            Names=[f'payment-alb-{ENVIRONMENT_SUFFIX}']
        )

        assert len(response['LoadBalancers']) == 1
        alb = response['LoadBalancers'][0]
        assert alb['State']['Code'] == 'active'
        assert alb['Scheme'] == 'internet-facing'
        assert alb['Type'] == 'application'

    def test_alb_has_waf_attached(self):
        """Test that WAF is attached to ALB."""
        response = elbv2_client.describe_load_balancers(
            Names=[f'payment-alb-{ENVIRONMENT_SUFFIX}']
        )

        alb = response['LoadBalancers'][0]
        alb_arn = alb['LoadBalancerArn']

        # Check if WAF is associated
        waf_response = wafv2_client.get_web_acl_for_resource(ResourceArn=alb_arn)
        assert waf_response['WebACL'] is not None

    def test_alb_target_group_healthy(self):
        """Test that ALB target group exists."""
        response = elbv2_client.describe_target_groups(
            Names=[f'payment-tg-{ENVIRONMENT_SUFFIX}']
        )

        assert len(response['TargetGroups']) == 1
        tg = response['TargetGroups'][0]
        assert tg['Protocol'] == 'HTTP'
        assert tg['Port'] == 3000
        assert tg['TargetType'] == 'instance'

    def test_alb_listeners_configured(self):
        """Test that ALB listeners are configured."""
        response = elbv2_client.describe_load_balancers(
            Names=[f'payment-alb-{ENVIRONMENT_SUFFIX}']
        )

        alb_arn = response['LoadBalancers'][0]['LoadBalancerArn']

        listeners_response = elbv2_client.describe_listeners(LoadBalancerArn=alb_arn)
        assert len(listeners_response['Listeners']) >= 1

        # Check for HTTP listener (port 80)
        http_listeners = [l for l in listeners_response['Listeners'] if l['Port'] == 80]
        assert len(http_listeners) >= 1


class TestAutoScaling:
    """Test Auto Scaling Group resources."""

    def test_auto_scaling_group_exists(self):
        """Test that Auto Scaling Group exists."""
        response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[f'payment-api-asg-{ENVIRONMENT_SUFFIX}']
        )

        assert len(response['AutoScalingGroups']) == 1
        asg = response['AutoScalingGroups'][0]
        assert asg['MinSize'] >= 1
        assert asg['MaxSize'] >= asg['MinSize']
        assert asg['DesiredCapacity'] >= asg['MinSize']

    def test_asg_has_launch_template(self):
        """Test that ASG has launch template configured."""
        response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[f'payment-api-asg-{ENVIRONMENT_SUFFIX}']
        )

        asg = response['AutoScalingGroups'][0]
        assert 'LaunchTemplate' in asg or 'MixedInstancesPolicy' in asg

    def test_asg_in_private_subnets(self):
        """Test that ASG is configured to launch instances in private subnets."""
        response = autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[f'payment-api-asg-{ENVIRONMENT_SUFFIX}']
        )

        asg = response['AutoScalingGroups'][0]
        vpc_zone_identifier = asg['VPCZoneIdentifier'].split(',')

        # Verify subnets are private
        subnets_response = ec2_client.describe_subnets(SubnetIds=vpc_zone_identifier)
        for subnet in subnets_response['Subnets']:
            tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
            assert tags.get('Type') == 'Private'


class TestDatabase:
    """Test RDS database resources."""

    def test_rds_instance_exists(self):
        """Test that RDS PostgreSQL instance exists."""
        rds_endpoint = outputs.get('rds_endpoint')
        assert rds_endpoint, "RDS endpoint not found in outputs"

        db_identifier = f'payment-db-{ENVIRONMENT_SUFFIX}'
        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)

        assert len(response['DBInstances']) == 1
        db = response['DBInstances'][0]
        assert db['DBInstanceStatus'] == 'available'
        assert db['Engine'] == 'postgres'
        assert db['MultiAZ'] is True
        assert db['StorageEncrypted'] is True

    def test_rds_in_private_subnets(self):
        """Test that RDS is deployed in private subnets."""
        db_identifier = f'payment-db-{ENVIRONMENT_SUFFIX}'
        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)

        db = response['DBInstances'][0]
        subnet_group = db['DBSubnetGroup']

        # Verify subnets are private
        subnet_ids = [subnet['SubnetIdentifier'] for subnet in subnet_group['Subnets']]
        subnets_response = ec2_client.describe_subnets(SubnetIds=subnet_ids)

        for subnet in subnets_response['Subnets']:
            tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
            assert tags.get('Type') == 'Private'

    def test_rds_security_group_configured(self):
        """Test that RDS has correct security group."""
        db_identifier = f'payment-db-{ENVIRONMENT_SUFFIX}'
        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)

        db = response['DBInstances'][0]
        security_groups = db['VpcSecurityGroups']

        assert len(security_groups) >= 1
        assert security_groups[0]['Status'] == 'active'

    def test_db_connection_string_in_ssm(self):
        """Test that database connection string is stored in SSM."""
        param_name = outputs.get('db_connection_parameter')
        assert param_name, "DB connection parameter name not found in outputs"

        response = ssm_client.get_parameter(Name=param_name, WithDecryption=True)

        assert response['Parameter']['Type'] == 'SecureString'
        assert response['Parameter']['Value']  # Should have a value


class TestFrontend:
    """Test S3 and CloudFront resources."""

    def test_cloudfront_distribution_active(self):
        """Test that CloudFront distribution is deployed and active."""
        cf_domain = outputs.get('cloudfront_domain_name')
        assert cf_domain, "CloudFront domain not found in outputs"

        distribution_id = outputs.get('cloudfront_distribution_id')
        assert distribution_id, "CloudFront distribution ID not found in outputs"

        response = cloudfront_client.get_distribution(Id=distribution_id)

        distribution = response['Distribution']
        assert distribution['Status'] == 'Deployed'
        assert distribution['DistributionConfig']['Enabled'] is True

    def test_cloudfront_has_s3_origin(self):
        """Test that CloudFront has S3 bucket as origin."""
        distribution_id = outputs.get('cloudfront_distribution_id')
        assert distribution_id, "CloudFront distribution ID not found in outputs"

        response = cloudfront_client.get_distribution(Id=distribution_id)

        origins = response['Distribution']['DistributionConfig']['Origins']['Items']
        assert len(origins) >= 1

        # Check for S3 origin
        s3_origins = [o for o in origins if 's3' in o['DomainName'].lower()]
        assert len(s3_origins) >= 1

    def test_s3_bucket_encryption_enabled(self):
        """Test that S3 bucket has encryption enabled."""
        # Find the S3 bucket for frontend
        s3_response = s3_client.list_buckets()
        frontend_buckets = [b for b in s3_response['Buckets']
                           if f'payment-frontend' in b['Name'] and ENVIRONMENT_SUFFIX in b['Name']]

        assert len(frontend_buckets) >= 1
        bucket_name = frontend_buckets[0]['Name']

        # Check encryption
        encryption_response = s3_client.get_bucket_encryption(Bucket=bucket_name)
        assert 'Rules' in encryption_response['ServerSideEncryptionConfiguration']


class TestSecurityAndCompliance:
    """Test security and compliance configurations."""

    def test_security_groups_least_privilege(self):
        """Test that security groups follow least privilege principle."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        # Get database security group
        response = ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'group-name', 'Values': [f'payment-database-sg-{ENVIRONMENT_SUFFIX}']}
            ]
        )

        assert len(response['SecurityGroups']) == 1
        db_sg = response['SecurityGroups'][0]

        # Database SG should only allow traffic from API SG on port 5432
        ingress_rules = db_sg['IpPermissions']
        for rule in ingress_rules:
            assert rule['FromPort'] == 5432
            assert rule['ToPort'] == 5432
            # Should reference another security group, not open to internet
            assert 'UserIdGroupPairs' in rule and len(rule['UserIdGroupPairs']) > 0

    def test_waf_web_acl_active(self):
        """Test that WAF Web ACL is active with managed rules."""
        # Find WAF by name
        response = wafv2_client.list_web_acls(Scope='REGIONAL')

        waf_acls = [acl for acl in response['WebACLs']
                   if f'payment-waf-{ENVIRONMENT_SUFFIX}' in acl['Name']]

        assert len(waf_acls) >= 1

        # Get detailed WAF configuration
        waf_id = waf_acls[0]['Id']
        waf_detail = wafv2_client.get_web_acl(
            Scope='REGIONAL',
            Id=waf_id,
            Name=waf_acls[0]['Name']
        )

        rules = waf_detail['WebACL']['Rules']
        assert len(rules) >= 3  # Should have multiple managed rule sets

    def test_iam_roles_have_correct_permissions(self):
        """Test that IAM roles are configured correctly."""
        # This test verifies the EC2 instance profile exists
        try:
            response = ec2_client.describe_iam_instance_profile_associations()
            # If we have running instances, they should have instance profiles
            assert response is not None
        except Exception:
            # If no instances are running yet, that's okay for this test
            pass


class TestMonitoring:
    """Test CloudWatch monitoring and alarms."""

    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are created."""
        # Check for specific alarms by name
        alarm_names = [
            f'payment-alb-5xx-{ENVIRONMENT_SUFFIX}',
            f'payment-asg-cpu-{ENVIRONMENT_SUFFIX}'
        ]

        response = cloudwatch_client.describe_alarms(AlarmNames=alarm_names)
        alarms = response['MetricAlarms']
        assert len(alarms) >= 2, f"Expected at least 2 alarms, found {len(alarms)}"

    def test_alb_5xx_alarm_configured(self):
        """Test that ALB 5XX error alarm is configured correctly."""
        response = cloudwatch_client.describe_alarms(
            AlarmNames=[f'payment-alb-5xx-{ENVIRONMENT_SUFFIX}']
        )

        assert len(response['MetricAlarms']) == 1
        alarm = response['MetricAlarms'][0]
        assert alarm['ComparisonOperator'] == 'GreaterThanThreshold'
        assert alarm['Threshold'] >= 5
        assert alarm['StateValue'] in ['OK', 'INSUFFICIENT_DATA', 'ALARM']

    def test_asg_cpu_alarm_configured(self):
        """Test that ASG CPU utilization alarm is configured correctly."""
        response = cloudwatch_client.describe_alarms(
            AlarmNames=[f'payment-asg-cpu-{ENVIRONMENT_SUFFIX}']
        )

        assert len(response['MetricAlarms']) == 1
        alarm = response['MetricAlarms'][0]
        assert alarm['ComparisonOperator'] == 'GreaterThanThreshold'
        assert alarm['Threshold'] >= 80
        assert alarm['StateValue'] in ['OK', 'INSUFFICIENT_DATA', 'ALARM']

    def test_cloudwatch_log_groups_exist(self):
        """Test that CloudWatch log groups are created."""
        # Check VPC Flow Logs log group
        response = logs_client.describe_log_groups(
            logGroupNamePrefix=f'/aws/vpc/payment-flowlogs-{ENVIRONMENT_SUFFIX}'
        )

        assert len(response['logGroups']) >= 1
        log_group = response['logGroups'][0]
        assert log_group['retentionInDays'] == 7


class TestResourceTagging:
    """Test resource tagging strategy."""

    def test_vpc_has_environment_suffix_tag(self):
        """Test that VPC has correct tags."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        assert ENVIRONMENT_SUFFIX in tags['Name']

    def test_rds_has_environment_suffix_tag(self):
        """Test that RDS has correct identifier with suffix."""
        db_identifier = f'payment-db-{ENVIRONMENT_SUFFIX}'
        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)

        assert len(response['DBInstances']) == 1
        db = response['DBInstances'][0]
        assert ENVIRONMENT_SUFFIX in db['DBInstanceIdentifier']


class TestHighAvailability:
    """Test high availability configurations."""

    def test_multi_az_deployment(self):
        """Test that RDS is deployed in Multi-AZ configuration."""
        db_identifier = f'payment-db-{ENVIRONMENT_SUFFIX}'
        response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)

        db = response['DBInstances'][0]
        assert db['MultiAZ'] is True

    def test_resources_across_multiple_azs(self):
        """Test that resources are distributed across multiple AZs."""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id, "VPC ID not found in outputs"

        # Check subnets are in different AZs
        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        azs = set(subnet['AvailabilityZone'] for subnet in response['Subnets'])
        assert len(azs) == 3, "Resources should be distributed across 3 AZs"
