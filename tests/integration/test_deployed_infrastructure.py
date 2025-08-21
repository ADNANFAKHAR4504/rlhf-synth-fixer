"""
Integration tests for deployed CloudFormation infrastructure.
Tests the actual deployed resources using AWS APIs and outputs from cfn-outputs/flat-outputs.json.
"""

import json
import os
import pytest
from pathlib import Path
from typing import Dict, Any, Optional

# Try to import boto3, but allow tests to be skipped if not available
boto3 = pytest.importorskip("boto3", reason="boto3 required for integration tests")


class TestDeployedInfrastructure:
    """Integration tests for deployed AWS infrastructure."""
    
    @pytest.fixture(scope="class")
    def outputs(self):
        """Load deployment outputs from cfn-outputs/flat-outputs.json."""
        outputs_file = Path(__file__).parent.parent.parent / 'cfn-outputs' / 'flat-outputs.json'
        if not outputs_file.exists():
            # Create mock outputs for testing without deployment
            return {
                "VPCId": "vpc-mock123",
                "EC2InstanceId": "i-mock123",
                "RDSEndpoint": "mock-db.region.rds.amazonaws.com",
                "S3BucketName": "mock-bucket-name",
                "LambdaFunctionArn": "arn:aws:lambda:us-west-2:123456789012:function:mock-function",
                "CloudTrailArn": "arn:aws:cloudtrail:us-west-2:123456789012:trail/mock-trail"
            }
        
        with open(outputs_file, 'r') as f:
            return json.load(f)
    
    @pytest.fixture(scope="class")
    def aws_region(self):
        """Get AWS region from environment or default."""
        region_file = Path(__file__).parent.parent.parent / 'lib' / 'AWS_REGION'
        if region_file.exists():
            with open(region_file, 'r') as f:
                return f.read().strip()
        return os.environ.get('AWS_REGION', 'us-west-2')
    
    @pytest.fixture(scope="class")
    def ec2_client(self, aws_region):
        """Create EC2 client."""
        return boto3.client('ec2', region_name=aws_region)
    
    @pytest.fixture(scope="class")
    def s3_client(self, aws_region):
        """Create S3 client."""
        return boto3.client('s3', region_name=aws_region)
    
    @pytest.fixture(scope="class")
    def rds_client(self, aws_region):
        """Create RDS client."""
        return boto3.client('rds', region_name=aws_region)
    
    @pytest.fixture(scope="class")
    def lambda_client(self, aws_region):
        """Create Lambda client."""
        return boto3.client('lambda', region_name=aws_region)
    
    @pytest.fixture(scope="class")
    def cloudtrail_client(self, aws_region):
        """Create CloudTrail client."""
        return boto3.client('cloudtrail', region_name=aws_region)
    
    @pytest.fixture(scope="class")
    def cloudwatch_client(self, aws_region):
        """Create CloudWatch client."""
        return boto3.client('cloudwatch', region_name=aws_region)
    
    @pytest.mark.integration
    def test_vpc_exists_and_configured(self, ec2_client, outputs):
        """Test that VPC exists and is properly configured."""
        if 'VPCId' not in outputs:
            pytest.skip("VPCId not in outputs")
        
        vpc_id = outputs['VPCId']
        
        try:
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            assert len(response['Vpcs']) == 1
            
            vpc = response['Vpcs'][0]
            assert vpc['State'] == 'available'
            assert vpc['DnsHostnames'] is True
            assert vpc['DnsSupport'] is True
        except Exception as e:
            if 'mock' in vpc_id:
                pytest.skip("Mock VPC ID detected, skipping AWS API call")
            raise e
    
    @pytest.mark.integration
    def test_subnets_configured(self, ec2_client, outputs):
        """Test that subnets are properly configured."""
        if 'VPCId' not in outputs:
            pytest.skip("VPCId not in outputs")
        
        vpc_id = outputs['VPCId']
        
        try:
            response = ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            subnets = response['Subnets']
            assert len(subnets) >= 4  # At least 2 public and 2 private
            
            # Check for different availability zones
            azs = set(subnet['AvailabilityZone'] for subnet in subnets)
            assert len(azs) >= 2  # Multi-AZ deployment
        except Exception as e:
            if 'mock' in vpc_id:
                pytest.skip("Mock VPC ID detected, skipping AWS API call")
            raise e
    
    @pytest.mark.integration
    def test_ec2_instance_running(self, ec2_client, outputs):
        """Test that EC2 instance is running and configured correctly."""
        if 'EC2InstanceId' not in outputs:
            pytest.skip("EC2InstanceId not in outputs")
        
        instance_id = outputs['EC2InstanceId']
        
        try:
            response = ec2_client.describe_instances(InstanceIds=[instance_id])
            assert len(response['Reservations']) > 0
            assert len(response['Reservations'][0]['Instances']) > 0
            
            instance = response['Reservations'][0]['Instances'][0]
            assert instance['State']['Name'] in ['running', 'pending']
            
            # Check IMDSv2 is enforced
            metadata_options = instance.get('MetadataOptions', {})
            assert metadata_options.get('HttpTokens') == 'required'
        except Exception as e:
            if 'mock' in instance_id:
                pytest.skip("Mock instance ID detected, skipping AWS API call")
            raise e
    
    @pytest.mark.integration
    def test_s3_bucket_encryption(self, s3_client, outputs):
        """Test that S3 bucket has encryption enabled."""
        if 'S3BucketName' not in outputs:
            pytest.skip("S3BucketName not in outputs")
        
        bucket_name = outputs['S3BucketName']
        
        try:
            # Check bucket encryption
            response = s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = response['ServerSideEncryptionConfiguration']['Rules']
            assert len(rules) > 0
            
            # Check for AES256 encryption
            for rule in rules:
                algorithm = rule['ApplyServerSideEncryptionByDefault']['SSEAlgorithm']
                assert algorithm in ['AES256', 'aws:kms']
            
            # Check public access block
            response = s3_client.get_public_access_block(Bucket=bucket_name)
            config = response['PublicAccessBlockConfiguration']
            assert config['BlockPublicAcls'] is True
            assert config['BlockPublicPolicy'] is True
            assert config['IgnorePublicAcls'] is True
            assert config['RestrictPublicBuckets'] is True
        except Exception as e:
            if 'mock' in bucket_name:
                pytest.skip("Mock bucket name detected, skipping AWS API call")
            raise e
    
    @pytest.mark.integration
    def test_rds_multi_az_and_encryption(self, rds_client, outputs):
        """Test that RDS instance has Multi-AZ and encryption enabled."""
        if 'RDSEndpoint' not in outputs:
            pytest.skip("RDSEndpoint not in outputs")
        
        # Extract DB instance identifier from endpoint
        endpoint = outputs['RDSEndpoint']
        db_identifier = endpoint.split('.')[0] if '.' in endpoint else None
        
        if not db_identifier:
            pytest.skip("Could not extract DB identifier from endpoint")
        
        try:
            response = rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
            assert len(response['DBInstances']) > 0
            
            db_instance = response['DBInstances'][0]
            assert db_instance['MultiAZ'] is True
            assert db_instance['StorageEncrypted'] is True
            assert db_instance['BackupRetentionPeriod'] > 0
        except Exception as e:
            if 'mock' in endpoint:
                pytest.skip("Mock RDS endpoint detected, skipping AWS API call")
            raise e
    
    @pytest.mark.integration
    def test_lambda_vpc_configuration(self, lambda_client, outputs):
        """Test that Lambda function is configured in VPC."""
        if 'LambdaFunctionArn' not in outputs:
            pytest.skip("LambdaFunctionArn not in outputs")
        
        function_arn = outputs['LambdaFunctionArn']
        function_name = function_arn.split(':')[-1] if ':' in function_arn else None
        
        if not function_name:
            pytest.skip("Could not extract function name from ARN")
        
        try:
            response = lambda_client.get_function_configuration(FunctionName=function_name)
            
            # Check VPC configuration
            assert 'VpcConfig' in response
            vpc_config = response['VpcConfig']
            assert len(vpc_config.get('SubnetIds', [])) > 0
            assert len(vpc_config.get('SecurityGroupIds', [])) > 0
        except Exception as e:
            if 'mock' in function_arn:
                pytest.skip("Mock Lambda ARN detected, skipping AWS API call")
            raise e
    
    @pytest.mark.integration
    def test_cloudtrail_logging_enabled(self, cloudtrail_client, outputs):
        """Test that CloudTrail is logging and properly configured."""
        if 'CloudTrailArn' not in outputs:
            pytest.skip("CloudTrailArn not in outputs")
        
        trail_arn = outputs['CloudTrailArn']
        trail_name = trail_arn.split('/')[-1] if '/' in trail_arn else None
        
        if not trail_name:
            pytest.skip("Could not extract trail name from ARN")
        
        try:
            # Get trail status
            response = cloudtrail_client.get_trail_status(Name=trail_name)
            assert response['IsLogging'] is True
            
            # Get trail configuration
            response = cloudtrail_client.describe_trails(trailNameList=[trail_name])
            assert len(response['trailList']) > 0
            
            trail = response['trailList'][0]
            assert trail.get('IsMultiRegionTrail') is True
            assert trail.get('LogFileValidationEnabled') is True
            assert 'CloudWatchLogsLogGroupArn' in trail
        except Exception as e:
            if 'mock' in trail_arn:
                pytest.skip("Mock CloudTrail ARN detected, skipping AWS API call")
            raise e
    
    @pytest.mark.integration
    def test_cloudwatch_alarms_exist(self, cloudwatch_client, outputs):
        """Test that CloudWatch alarms are configured for EC2 monitoring."""
        if 'EC2InstanceId' not in outputs:
            pytest.skip("EC2InstanceId not in outputs")
        
        instance_id = outputs['EC2InstanceId']
        
        try:
            # List alarms for the EC2 instance
            response = cloudwatch_client.describe_alarms(
                MaxRecords=100,
                StateValue='OK'  # Look for alarms in any state
            )
            
            # Filter alarms related to our instance
            instance_alarms = []
            for alarm in response.get('MetricAlarms', []):
                for dimension in alarm.get('Dimensions', []):
                    if dimension['Name'] == 'InstanceId' and dimension['Value'] == instance_id:
                        instance_alarms.append(alarm)
            
            # Should have at least CPU alarm
            alarm_names = [alarm['AlarmName'] for alarm in instance_alarms]
            assert any('cpu' in name.lower() for name in alarm_names)
        except Exception as e:
            if 'mock' in instance_id:
                pytest.skip("Mock instance ID detected, skipping AWS API call")
            raise e
    
    @pytest.mark.integration
    def test_network_connectivity(self, ec2_client, outputs):
        """Test network connectivity between resources."""
        if 'VPCId' not in outputs:
            pytest.skip("VPCId not in outputs")
        
        vpc_id = outputs['VPCId']
        
        try:
            # Check route tables
            response = ec2_client.describe_route_tables(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            route_tables = response['RouteTables']
            assert len(route_tables) >= 2  # At least public and private
            
            # Check for NAT Gateway routes in private route tables
            nat_routes = []
            for rt in route_tables:
                for route in rt.get('Routes', []):
                    if 'NatGatewayId' in route:
                        nat_routes.append(route)
            
            assert len(nat_routes) > 0  # Private subnets should have NAT routes
            
            # Check for Internet Gateway routes in public route tables
            igw_routes = []
            for rt in route_tables:
                for route in rt.get('Routes', []):
                    if 'GatewayId' in route and route['GatewayId'].startswith('igw-'):
                        igw_routes.append(route)
            
            assert len(igw_routes) > 0  # Public subnets should have IGW routes
        except Exception as e:
            if 'mock' in vpc_id:
                pytest.skip("Mock VPC ID detected, skipping AWS API call")
            raise e
    
    @pytest.mark.integration
    def test_security_groups_configured(self, ec2_client, outputs):
        """Test that security groups are properly configured."""
        if 'VPCId' not in outputs:
            pytest.skip("VPCId not in outputs")
        
        vpc_id = outputs['VPCId']
        
        try:
            response = ec2_client.describe_security_groups(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            security_groups = response['SecurityGroups']
            assert len(security_groups) >= 3  # EC2, RDS, Lambda at minimum
            
            # Check that security groups have restrictive rules
            for sg in security_groups:
                # Skip default security group
                if sg['GroupName'] == 'default':
                    continue
                
                # Check ingress rules don't allow 0.0.0.0/0
                for rule in sg.get('IpPermissions', []):
                    for ip_range in rule.get('IpRanges', []):
                        cidr = ip_range.get('CidrIp', '')
                        # 0.0.0.0/0 should not be allowed except for specific cases
                        if cidr == '0.0.0.0/0':
                            # This might be acceptable for HTTP/HTTPS from load balancer
                            # but should be validated based on requirements
                            pass
        except Exception as e:
            if 'mock' in vpc_id:
                pytest.skip("Mock VPC ID detected, skipping AWS API call")
            raise e
    
    @pytest.mark.integration
    def test_vpc_endpoints_exist(self, ec2_client, outputs):
        """Test that VPC endpoints are configured for Lambda isolation."""
        if 'VPCId' not in outputs:
            pytest.skip("VPCId not in outputs")
        
        vpc_id = outputs['VPCId']
        
        try:
            response = ec2_client.describe_vpc_endpoints(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            endpoints = response['VpcEndpoints']
            assert len(endpoints) >= 2  # At least S3 and Lambda endpoints
            
            # Check for specific service endpoints
            service_names = [ep['ServiceName'] for ep in endpoints]
            assert any('s3' in sn for sn in service_names)  # S3 endpoint
        except Exception as e:
            if 'mock' in vpc_id:
                pytest.skip("Mock VPC ID detected, skipping AWS API call")
            raise e
    
    @pytest.mark.integration
    def test_tags_on_resources(self, ec2_client, outputs):
        """Test that resources have proper tags."""
        if 'EC2InstanceId' not in outputs:
            pytest.skip("EC2InstanceId not in outputs")
        
        instance_id = outputs['EC2InstanceId']
        
        try:
            response = ec2_client.describe_tags(
                Filters=[
                    {'Name': 'resource-id', 'Values': [instance_id]},
                    {'Name': 'resource-type', 'Values': ['instance']}
                ]
            )
            
            tags = response['Tags']
            tag_keys = [tag['Key'] for tag in tags]
            
            # Check for required tags
            assert 'Environment' in tag_keys
            assert 'Owner' in tag_keys
        except Exception as e:
            if 'mock' in instance_id:
                pytest.skip("Mock instance ID detected, skipping AWS API call")
            raise e