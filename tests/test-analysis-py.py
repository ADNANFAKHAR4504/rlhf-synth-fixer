"""
REQUIRED Mock Configuration Setup for AWS Resource Analysis Testing
================================================================

This setup is MANDATORY for running and testing AWS resource analysis tasks.
All new resource analysis implementations must follow this testing framework
to ensure consistent mocking and validation of AWS resources.

Required Setup Steps:
-------------------

1. Environment Configuration (REQUIRED):
   - Ensure boto3 is configured with proper credentials
   - Set required environment variables:
     - AWS_ENDPOINT_URL
     - AWS_DEFAULT_REGION
     - AWS_ACCESS_KEY_ID 
     - AWS_SECRET_ACCESS_KEY

2. Create Mock Resource Setup (REQUIRED):
   a. Create a setup function (e.g., setup_your_resource()):
      - Use boto_client(service_name) to get AWS service client
      - Create your mock resources using boto3 API calls
      - Handle idempotency to avoid duplicate resources
      - Add error handling for existing resources

3. Create Test Function (REQUIRED):
   a. Define test function (e.g., test_your_resource_analysis())
   b. Call your setup function to create mock resources
   c. Call run_analysis_script() to execute analysis
   d. Assert expected results in the JSON output:
      - Check for correct section in results
      - Validate structure and required fields
      - Verify resource counts and metrics
      - Test specific resource attributes

Standard Implementation Template:
------------------------------
```python
def setup_your_resource():
    client = boto_client("your-service")
    # Create mock resources
    # Handle existing resources
    # Add configurations

def test_your_resource_analysis():
    # Setup resources
    setup_your_resource()
    
    # Run analysis
    results = run_analysis_script()
    
    # Validate results
    assert "YourSection" in results
    assert "ExpectedField" in results["YourSection"]
    # Add more specific assertions
```

Reference Implementations:
-----------------------
See existing implementations for detailed examples:
- EBS volumes (setup_ebs_volumes)
- Security groups (setup_security_groups)
- CloudWatch logs (setup_log_group_and_streams)

Note: Without this mock configuration setup, resource analysis tests will not 
function correctly and may produce invalid results.
"""

#!/usr/bin/env python3
"""
Comprehensive test suite for AWS Multi-VPC Compliance Analysis Tool
Uses Moto for complete AWS mocking
"""

import unittest
import json
import os
from unittest.mock import patch, MagicMock
import boto3
from moto import mock_aws
from moto.core import DEFAULT_ACCOUNT_ID as ACCOUNT_ID
from datetime import datetime

# Import the analysis module
from lib import analyse as analysis

class TestComplianceAnalyzer(unittest.TestCase):
    """Test suite for compliance analyzer"""
    
    @mock_aws
    def setUp(self):
        """Set up test environment"""
        self.session = boto3.Session(region_name='us-east-1')
        self.ec2 = self.session.client('ec2')
        self.route53 = self.session.client('route53')
        self.s3 = self.session.client('s3')
        self.logs = self.session.client('logs')
        
        # Create S3 bucket for flow logs
        self.s3.create_bucket(Bucket='flow-logs-bucket')
        
    def create_compliant_environment(self):
        """Create a fully compliant test environment"""
        # Create Payment VPC
        payment_vpc_response = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        self.payment_vpc_id = payment_vpc_response['Vpc']['VpcId']
        self.ec2.create_tags(
            Resources=[self.payment_vpc_id],
            Tags=[{'Key': 'Name', 'Value': 'Payment-VPC'}]
        )
        
        # Create Analytics VPC
        analytics_vpc_response = self.ec2.create_vpc(CidrBlock='10.2.0.0/16')
        self.analytics_vpc_id = analytics_vpc_response['Vpc']['VpcId']
        self.ec2.create_tags(
            Resources=[self.analytics_vpc_id],
            Tags=[{'Key': 'Name', 'Value': 'Analytics-VPC'}]
        )
        
        # Enable DNS support/hostnames
        for vpc_id in [self.payment_vpc_id, self.analytics_vpc_id]:
            self.ec2.modify_vpc_attribute(
                VpcId=vpc_id,
                EnableDnsSupport={'Value': True}
            )
            self.ec2.modify_vpc_attribute(
                VpcId=vpc_id,
                EnableDnsHostnames={'Value': True}
            )
        
        # Create subnets (3 per VPC, different AZs)
        self.payment_subnets = []
        self.analytics_subnets = []
        
        azs = ['us-east-1a', 'us-east-1b', 'us-east-1c']
        
        for i, az in enumerate(azs):
            # Payment VPC subnets
            payment_subnet = self.ec2.create_subnet(
                VpcId=self.payment_vpc_id,
                CidrBlock=f'10.1.{i}.0/24',
                AvailabilityZone=az
            )
            self.payment_subnets.append(payment_subnet['Subnet']['SubnetId'])
            
            # Analytics VPC subnets
            analytics_subnet = self.ec2.create_subnet(
                VpcId=self.analytics_vpc_id,
                CidrBlock=f'10.2.{i}.0/24',
                AvailabilityZone=az
            )
            self.analytics_subnets.append(analytics_subnet['Subnet']['SubnetId'])
        
        # Create VPC Peering
        peering_response = self.ec2.create_vpc_peering_connection(
            VpcId=self.payment_vpc_id,
            PeerVpcId=self.analytics_vpc_id
        )
        self.peering_id = peering_response['VpcPeeringConnection']['VpcPeeringConnectionId']
        
        # Accept peering
        self.ec2.accept_vpc_peering_connection(
            VpcPeeringConnectionId=self.peering_id
        )
        
        # Enable DNS resolution on peering
        self.ec2.modify_vpc_peering_connection_options(
            VpcPeeringConnectionId=self.peering_id,
            AccepterPeeringConnectionOptions={
                'AllowDnsResolutionFromRemoteVpc': True
            },
            RequesterPeeringConnectionOptions={
                'AllowDnsResolutionFromRemoteVpc': True
            }
        )
        
        # Create route tables and add routes
        for subnet_id in self.payment_subnets:
            rt_response = self.ec2.create_route_table(VpcId=self.payment_vpc_id)
            rt_id = rt_response['RouteTable']['RouteTableId']
            self.ec2.associate_route_table(
                RouteTableId=rt_id,
                SubnetId=subnet_id
            )
            self.ec2.create_route(
                RouteTableId=rt_id,
                DestinationCidrBlock='10.2.0.0/16',
                VpcPeeringConnectionId=self.peering_id
            )
        
        for subnet_id in self.analytics_subnets:
            rt_response = self.ec2.create_route_table(VpcId=self.analytics_vpc_id)
            rt_id = rt_response['RouteTable']['RouteTableId']
            self.ec2.associate_route_table(
                RouteTableId=rt_id,
                SubnetId=subnet_id
            )
            self.ec2.create_route(
                RouteTableId=rt_id,
                DestinationCidrBlock='10.1.0.0/16',
                VpcPeeringConnectionId=self.peering_id
            )
        
        # Create security groups with proper rules
        payment_sg_response = self.ec2.create_security_group(
            GroupName='payment-sg',
            Description='Payment VPC security group',
            VpcId=self.payment_vpc_id
        )
        self.payment_sg_id = payment_sg_response['GroupId']
        
        analytics_sg_response = self.ec2.create_security_group(
            GroupName='analytics-sg',
            Description='Analytics VPC security group',
            VpcId=self.analytics_vpc_id
        )
        self.analytics_sg_id = analytics_sg_response['GroupId']
        
        # Add security group rules
        for sg_id, peer_cidr in [(self.payment_sg_id, '10.2.0.0/16'), 
                                  (self.analytics_sg_id, '10.1.0.0/16')]:
            self.ec2.authorize_security_group_ingress(
                GroupId=sg_id,
                IpPermissions=[
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 443,
                        'ToPort': 443,
                        'IpRanges': [{'CidrIp': peer_cidr}]
                    },
                    {
                        'IpProtocol': 'tcp',
                        'FromPort': 5432,
                        'ToPort': 5432,
                        'IpRanges': [{'CidrIp': peer_cidr}]
                    }
                ]
            )
        
        # Create EC2 instances
        payment_instance_response = self.ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t3.micro',
            SubnetId=self.payment_subnets[0],
            SecurityGroupIds=[self.payment_sg_id],
            TagSpecifications=[{
                'ResourceType': 'instance',
                'Tags': [
                    {'Key': 'Name', 'Value': 'payment-app'},
                    {'Key': 'SSMEnabled', 'Value': 'true'}
                ]
            }]
        )
        self.payment_instance_id = payment_instance_response['Instances'][0]['InstanceId']
        
        analytics_instance_response = self.ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t3.micro',
            SubnetId=self.analytics_subnets[0],
            SecurityGroupIds=[self.analytics_sg_id],
            TagSpecifications=[{
                'ResourceType': 'instance',
                'Tags': [
                    {'Key': 'Name', 'Value': 'analytics-app'},
                    {'Key': 'SSMEnabled', 'Value': 'true'}
                ]
            }]
        )
        self.analytics_instance_id = analytics_instance_response['Instances'][0]['InstanceId']
        
        # Create VPC Flow Logs
        self.ec2.create_flow_logs(
            ResourceType='VPC',
            ResourceIds=[self.payment_vpc_id],
            TrafficType='ALL',
            LogDestinationType='s3',
            LogDestination='arn:aws:s3:::flow-logs-bucket/payment-vpc/',
            LogFormat='${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action} ${log-status}'
        )
        
        self.ec2.create_flow_logs(
            ResourceType='VPC',
            ResourceIds=[self.analytics_vpc_id],
            TrafficType='ALL',
            LogDestinationType='s3',
            LogDestination='arn:aws:s3:::flow-logs-bucket/analytics-vpc/',
            LogFormat='${version} ${account-id} ${interface-id} ${srcaddr} ${dstaddr} ${srcport} ${dstport} ${protocol} ${packets} ${bytes} ${start} ${end} ${action} ${log-status}'
        )
        
        # Create Route53 private hosted zones
        payment_zone_response = self.route53.create_hosted_zone(
            Name='payment.internal',
            VPC={
                'VPCRegion': 'us-east-1',
                'VPCId': self.payment_vpc_id
            },
            CallerReference=str(datetime.now().timestamp()),
            HostedZoneConfig={
                'PrivateZone': True,
                'Comment': 'Payment VPC private zone'
            }
        )
        self.payment_zone_id = payment_zone_response['HostedZone']['Id']
        
        analytics_zone_response = self.route53.create_hosted_zone(
            Name='analytics.internal',
            VPC={
                'VPCRegion': 'us-east-1',
                'VPCId': self.analytics_vpc_id
            },
            CallerReference=str(datetime.now().timestamp()),
            HostedZoneConfig={
                'PrivateZone': True,
                'Comment': 'Analytics VPC private zone'
            }
        )
        self.analytics_zone_id = analytics_zone_response['HostedZone']['Id']
        
        # Associate zones with both VPCs
        self.route53.associate_vpc_with_hosted_zone(
            HostedZoneId=self.payment_zone_id,
            VPC={
                'VPCRegion': 'us-east-1',
                'VPCId': self.analytics_vpc_id
            }
        )
        
        self.route53.associate_vpc_with_hosted_zone(
            HostedZoneId=self.analytics_zone_id,
            VPC={
                'VPCRegion': 'us-east-1',
                'VPCId': self.payment_vpc_id
            }
        )
    
    @mock_aws
    def test_compliant_environment_passes_all_checks(self):
        """Test that a compliant environment passes all checks"""
        self.create_compliant_environment()
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        
        # Mock the discovery methods that don't work properly in moto
        with patch.object(discovery, 'discover_flow_logs') as mock_flow_logs, \
             patch.object(discovery, 'discover_route53_zones') as mock_zones:
            
            # Mock flow logs to return expected data
            mock_flow_logs.return_value = [
                {
                    'FlowLogId': 'fl-payment',
                    'ResourceId': self.payment_vpc_id,
                    'TrafficType': 'ALL',
                    'LogDestinationType': 's3'
                },
                {
                    'FlowLogId': 'fl-analytics',
                    'ResourceId': self.analytics_vpc_id,
                    'TrafficType': 'ALL',
                    'LogDestinationType': 's3'
                }
            ]
            
            # Mock Route53 zones to return expected data
            mock_zones.return_value = [
                {
                    'Id': '/hostedzone/Z123',
                    'Name': 'payment.internal',
                    'Config': {'PrivateZone': True}
                },
                {
                    'Id': '/hostedzone/Z456',
                    'Name': 'analytics.internal',
                    'Config': {'PrivateZone': True}
                }
            ]
            
            analyzer = analysis.ComplianceAnalyzer(discovery)
            results = analyzer.analyze()
        
        # Debug output to see what's failing
        if results['compliance_summary']['failed'] != 0:
            print(f"\nFound {results['compliance_summary']['failed']} failing checks:")
            for finding in results['findings']:
                print(f"- {finding['issue_type']}: {finding['current_state']}")
        
        self.assertEqual(results['compliance_summary']['failed'], 0)
        self.assertEqual(len(results['findings']), 0)
        self.assertEqual(results['compliance_summary']['compliance_percentage'], 100.0)
    
    @mock_aws
    def test_missing_payment_vpc_detected(self):
        """Test that missing Payment VPC is detected"""
        # Only create Analytics VPC
        analytics_vpc_response = self.ec2.create_vpc(CidrBlock='10.2.0.0/16')
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for Payment VPC finding
        payment_vpc_findings = [f for f in results['findings'] 
                               if f['issue_type'] == 'Missing Payment VPC']
        self.assertEqual(len(payment_vpc_findings), 1)
        self.assertEqual(payment_vpc_findings[0]['severity'], 'CRITICAL')
        self.assertIn('SOC2', payment_vpc_findings[0]['frameworks'])
    
    @mock_aws
    def test_missing_analytics_vpc_detected(self):
        """Test that missing Analytics VPC is detected"""
        # Only create Payment VPC
        payment_vpc_response = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for Analytics VPC finding
        analytics_vpc_findings = [f for f in results['findings'] 
                                 if f['issue_type'] == 'Missing Analytics VPC']
        self.assertEqual(len(analytics_vpc_findings), 1)
        self.assertEqual(analytics_vpc_findings[0]['severity'], 'CRITICAL')
    
    @mock_aws
    def test_insufficient_subnets_detected(self):
        """Test that insufficient subnets are detected"""
        # Create VPC with only 2 subnets
        vpc_response = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        vpc_id = vpc_response['Vpc']['VpcId']
        
        # Create only 2 subnets
        for i in range(2):
            self.ec2.create_subnet(
                VpcId=vpc_id,
                CidrBlock=f'10.1.{i}.0/24',
                AvailabilityZone=f'us-east-1{chr(97+i)}'
            )
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for subnet finding
        subnet_findings = [f for f in results['findings'] 
                          if f['issue_type'] == 'Insufficient private subnets']
        self.assertGreater(len(subnet_findings), 0)
    
    @mock_aws
    def test_missing_vpc_peering_detected(self):
        """Test that missing VPC peering is detected"""
        # Create both VPCs but no peering
        self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        self.ec2.create_vpc(CidrBlock='10.2.0.0/16')
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for peering finding
        peering_findings = [f for f in results['findings'] 
                           if f['issue_type'] == 'Missing VPC peering']
        self.assertEqual(len(peering_findings), 1)
        self.assertEqual(peering_findings[0]['severity'], 'CRITICAL')
    
    @mock_aws
    def test_inactive_peering_detected(self):
        """Test that inactive peering is detected"""
        # Create VPCs and peering but don't accept it
        payment_vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        analytics_vpc = self.ec2.create_vpc(CidrBlock='10.2.0.0/16')
        
        peering = self.ec2.create_vpc_peering_connection(
            VpcId=payment_vpc['Vpc']['VpcId'],
            PeerVpcId=analytics_vpc['Vpc']['VpcId']
        )
        # Don't accept the peering - it will be in pending-acceptance state
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for inactive peering finding
        inactive_findings = [f for f in results['findings'] 
                            if f['issue_type'] == 'Inactive peering connection']
        self.assertEqual(len(inactive_findings), 1)
    
    @mock_aws
    def test_missing_routes_detected(self):
        """Test that missing routes are detected"""
        self.create_compliant_environment()
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        
        # Mock route tables to return tables without peering routes
        original_discover_route_tables = discovery.discover_route_tables
        def mock_discover_route_tables(vpc_id=None):
            route_tables = original_discover_route_tables(vpc_id)
            # Remove peering routes from the route tables
            for rt in route_tables:
                rt['Routes'] = [r for r in rt.get('Routes', []) 
                               if not r.get('VpcPeeringConnectionId')]
            return route_tables
        
        with patch.object(discovery, 'discover_route_tables', side_effect=mock_discover_route_tables):
            analyzer = analysis.ComplianceAnalyzer(discovery)
            results = analyzer.analyze()
        
        # Should detect missing route
        route_findings = [f for f in results['findings'] 
                         if f['issue_type'] == 'Missing peer VPC route']
        
        # Debug output
        if len(route_findings) == 0:
            print(f"\nNo missing route findings. All findings:")
            for finding in results['findings']:
                print(f"- {finding['issue_type']}: {finding['current_state']}")
        
        self.assertGreater(len(route_findings), 0)
    
    @mock_aws
    def test_wide_open_security_group_detected(self):
        """Test that wide open security groups are detected"""
        # Create VPC and security group
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']
        
        sg = self.ec2.create_security_group(
            GroupName='wide-open-sg',
            Description='Wide open SG',
            VpcId=vpc_id
        )
        
        # Add wide open rule
        self.ec2.authorize_security_group_ingress(
            GroupId=sg['GroupId'],
            IpPermissions=[{
                'IpProtocol': 'tcp',
                'FromPort': 443,
                'ToPort': 443,
                'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
            }]
        )
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for wide open SG finding
        sg_findings = [f for f in results['findings'] 
                      if f['issue_type'] == 'Wide open security group']
        self.assertGreater(len(sg_findings), 0)
        self.assertEqual(sg_findings[0]['severity'], 'CRITICAL')
    
    @mock_aws
    def test_unencrypted_protocols_detected(self):
        """Test that unencrypted protocols are detected"""
        # Create VPC and security group
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']
        
        sg = self.ec2.create_security_group(
            GroupName='unencrypted-sg',
            Description='Unencrypted protocols SG',
            VpcId=vpc_id
        )
        
        # Add unencrypted HTTP rule
        self.ec2.authorize_security_group_ingress(
            GroupId=sg['GroupId'],
            IpPermissions=[{
                'IpProtocol': 'tcp',
                'FromPort': 80,
                'ToPort': 80,
                'IpRanges': [{'CidrIp': '10.0.0.0/8'}]
            }]
        )
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for unencrypted protocol finding
        unencrypted_findings = [f for f in results['findings'] 
                               if f['issue_type'] == 'Unencrypted protocols allowed']
        self.assertGreater(len(unencrypted_findings), 0)
    
    @mock_aws
    def test_instance_with_public_ip_detected(self):
        """Test that instances with public IPs are detected"""
        # Create VPC and subnet
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']
        
        subnet = self.ec2.create_subnet(
            VpcId=vpc_id,
            CidrBlock='10.1.0.0/24',
            AvailabilityZone='us-east-1a'
        )
        
        # Modify subnet to assign public IPs
        self.ec2.modify_subnet_attribute(
            SubnetId=subnet['Subnet']['SubnetId'],
            MapPublicIpOnLaunch={'Value': True}
        )
        
        # Launch instance (will get public IP)
        instance = self.ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t3.micro',
            SubnetId=subnet['Subnet']['SubnetId']
        )
        
        # Manually set public IP in mock (Moto limitation)
        instance_id = instance['Instances'][0]['InstanceId']
        
        # Need to mock the public IP since Moto doesn't auto-assign
        with patch.object(analysis.AWSResourceDiscovery, 'discover_instances') as mock_discover:
            mock_discover.return_value = [{
                'InstanceId': instance_id,
                'VpcId': vpc_id,
                'SubnetId': subnet['Subnet']['SubnetId'],
                'PublicIpAddress': '54.1.2.3',
                'Tags': []
            }]
            
            discovery = analysis.AWSResourceDiscovery(self.session)
            discovery.discover_instances = mock_discover
            analyzer = analysis.ComplianceAnalyzer(discovery)
            results = analyzer.analyze()
        
        # Check for public IP finding
        public_ip_findings = [f for f in results['findings'] 
                             if f['issue_type'] == 'Instance has public IP']
        self.assertGreater(len(public_ip_findings), 0)
    
    @mock_aws
    def test_missing_ssm_tag_detected(self):
        """Test that missing SSM tags are detected"""
        # Create VPC and instance without SSM tag
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']
        
        subnet = self.ec2.create_subnet(
            VpcId=vpc_id,
            CidrBlock='10.1.0.0/24',
            AvailabilityZone='us-east-1a'
        )
        
        instance = self.ec2.run_instances(
            ImageId='ami-12345678',
            MinCount=1,
            MaxCount=1,
            InstanceType='t3.micro',
            SubnetId=subnet['Subnet']['SubnetId'],
            TagSpecifications=[{
                'ResourceType': 'instance',
                'Tags': [{'Key': 'Name', 'Value': 'test-instance'}]
            }]
        )
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for SSM tag finding
        ssm_findings = [f for f in results['findings'] 
                       if f['issue_type'] == 'SSM not enabled']
        self.assertGreater(len(ssm_findings), 0)
    
    @mock_aws
    def test_missing_flow_logs_detected(self):
        """Test that missing flow logs are detected"""
        # Create VPC without flow logs
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check for flow logs finding
        flow_log_findings = [f for f in results['findings'] 
                            if f['issue_type'] == 'Missing VPC Flow Logs']
        self.assertGreater(len(flow_log_findings), 0)
        self.assertEqual(flow_log_findings[0]['severity'], 'CRITICAL')
    
    @mock_aws
    def test_flow_logs_wrong_destination_detected(self):
        """Test that flow logs with wrong destination are detected"""
        self.create_compliant_environment()
        
        # Create flow log with CloudWatch destination instead of S3
        self.ec2.create_flow_logs(
            ResourceType='VPC',
            ResourceIds=[self.payment_vpc_id],
            TrafficType='ALL',
            LogDestinationType='cloud-watch-logs',
            LogGroupName='/aws/vpc/flowlogs',
            DeliverLogsPermissionArn='arn:aws:iam::123456789012:role/flowlogsRole'
        )
        
        # Need to mock the flow logs response properly
        with patch.object(analysis.AWSResourceDiscovery, 'discover_flow_logs') as mock_flow_logs:
            mock_flow_logs.return_value = [{
                'FlowLogId': 'fl-12345',
                'ResourceId': self.payment_vpc_id,
                'TrafficType': 'ALL',
                'LogDestinationType': 'cloud-watch-logs'
            }]
            
            discovery = analysis.AWSResourceDiscovery(self.session)
            discovery.discover_flow_logs = mock_flow_logs
            analyzer = analysis.ComplianceAnalyzer(discovery)
            results = analyzer.analyze()
        
        # Check for S3 destination finding
        s3_findings = [f for f in results['findings'] 
                      if f['issue_type'] == 'Flow logs not using S3']
        self.assertGreater(len(s3_findings), 0)
    
    @mock_aws
    def test_partial_flow_logs_detected(self):
        """Test that partial flow log capture is detected"""
        # Create VPC with partial flow logs
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        vpc_id = vpc['Vpc']['VpcId']
        
        # Create flow logs capturing only ACCEPT traffic
        self.ec2.create_flow_logs(
            ResourceType='VPC',
            ResourceIds=[vpc_id],
            TrafficType='ACCEPT',
            LogDestinationType='s3',
            LogDestination='arn:aws:s3:::flow-logs-bucket/partial/'
        )
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        
        # Mock flow logs to return the partial flow log
        with patch.object(discovery, 'discover_flow_logs') as mock_flow_logs:
            mock_flow_logs.return_value = [
                {
                    'FlowLogId': 'fl-partial',
                    'ResourceId': vpc_id,
                    'TrafficType': 'ACCEPT',  # Only ACCEPT, not ALL
                    'LogDestinationType': 's3'
                }
            ]
            
            analyzer = analysis.ComplianceAnalyzer(discovery)
            results = analyzer.analyze()
        
        # Check for partial capture finding
        partial_findings = [f for f in results['findings'] 
                           if f['issue_type'] == 'Incomplete flow log capture']
        
        # Debug output
        if len(partial_findings) == 0:
            print(f"\nNo partial flow log findings. All findings:")
            for finding in results['findings']:
                print(f"- {finding['issue_type']}: {finding['current_state']}")
        
        self.assertGreater(len(partial_findings), 0)
    
    @mock_aws
    def test_json_report_generation(self):
        """Test JSON report generation"""
        self.create_compliant_environment()
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Generate JSON report
        generator = analysis.ReportGenerator(results)
        test_json_file = 'test_report.json'
        generator.generate_json(test_json_file)
        
        # Verify JSON file exists and is valid
        self.assertTrue(os.path.exists(test_json_file))
        
        with open(test_json_file, 'r') as f:
            json_data = json.load(f)
        
        self.assertIn('compliance_summary', json_data)
        self.assertIn('findings', json_data)
        self.assertIn('total_checks', json_data['compliance_summary'])
        
        # Clean up
        os.remove(test_json_file)
    
    @mock_aws
    def test_html_report_generation(self):
        """Test HTML report generation"""
        self.create_compliant_environment()
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Generate HTML report
        generator = analysis.ReportGenerator(results)
        test_html_file = 'test_report.html'
        generator.generate_html(test_html_file)
        
        # Verify HTML file exists
        self.assertTrue(os.path.exists(test_html_file))
        
        # Check HTML content
        with open(test_html_file, 'r') as f:
            html_content = f.read()
        
        self.assertIn('AWS Multi-VPC Compliance Report', html_content)
        self.assertIn('Executive Summary', html_content)
        self.assertIn('Compliance by Framework', html_content)
        
        # Clean up
        os.remove(test_html_file)
    
    @mock_aws
    def test_framework_mapping(self):
        """Test that findings are properly mapped to frameworks"""
        # Create non-compliant environment
        vpc = self.ec2.create_vpc(CidrBlock='10.1.0.0/16')
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Verify framework mapping
        for finding in results['findings']:
            self.assertIsInstance(finding['frameworks'], list)
            self.assertGreater(len(finding['frameworks']), 0)
            for framework in finding['frameworks']:
                self.assertIn(framework, ['SOC2', 'PCI-DSS', 'GDPR'])
    
    @mock_aws
    def test_severity_levels(self):
        """Test that severity levels are properly assigned"""
        # Create various non-compliant scenarios
        self.ec2.create_vpc(CidrBlock='10.2.0.0/16')  # Missing Payment VPC
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check severity levels
        severities = [f['severity'] for f in results['findings']]
        for severity in severities:
            self.assertIn(severity, ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])
    
    @mock_aws
    def test_remediation_steps_provided(self):
        """Test that remediation steps are provided for all findings"""
        # Create non-compliant environment
        self.ec2.create_vpc(CidrBlock='10.2.0.0/16')
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check all findings have remediation steps
        for finding in results['findings']:
            self.assertIsNotNone(finding['remediation_steps'])
            self.assertNotEqual(finding['remediation_steps'], '')
    
    @mock_aws
    def test_compliance_percentage_calculation(self):
        """Test compliance percentage calculation"""
        self.create_compliant_environment()
        
        # Remove one compliance item (flow logs)
        flow_logs = self.ec2.describe_flow_logs()
        for fl in flow_logs['FlowLogs']:
            self.ec2.delete_flow_logs(FlowLogIds=[fl['FlowLogId']])
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        results = analyzer.analyze()
        
        # Check percentage calculation
        summary = results['compliance_summary']
        expected_percentage = (summary['passed'] / summary['total_checks']) * 100
        self.assertAlmostEqual(summary['compliance_percentage'], expected_percentage, places=2)
    
    @mock_aws
    def test_all_resource_types_checked(self):
        """Test that all required resource types are checked"""
        self.create_compliant_environment()
        
        discovery = analysis.AWSResourceDiscovery(self.session)
        analyzer = analysis.ComplianceAnalyzer(discovery)
        
        # Track which check methods are called
        checked_resources = set()
        
        original_methods = {
            '_check_vpc_architecture': analyzer._check_vpc_architecture,
            '_check_vpc_peering': analyzer._check_vpc_peering,
            '_check_routing': analyzer._check_routing,
            '_check_security_groups': analyzer._check_security_groups,
            '_check_ec2_instances': analyzer._check_ec2_instances,
            '_check_flow_logs': analyzer._check_flow_logs,
            '_check_route53_dns': analyzer._check_route53_dns
        }
        
        def track_check(method_name):
            def wrapper(*args, **kwargs):
                checked_resources.add(method_name)
                return original_methods[method_name](*args, **kwargs)
            return wrapper
        
        # Patch all check methods
        for method_name in original_methods:
            setattr(analyzer, method_name, track_check(method_name))
        
        analyzer.analyze()
        
        # Verify all resource types were checked
        expected_checks = {
            '_check_vpc_architecture',
            '_check_vpc_peering', 
            '_check_routing',
            '_check_security_groups',
            '_check_ec2_instances',
            '_check_flow_logs',
            '_check_route53_dns'
        }
        
        self.assertEqual(checked_resources, expected_checks)

    def tearDown(self):
        """Clean up after tests"""
        # Cleanup is handled by moto automatically
        pass

if __name__ == '__main__':
    # Run tests
    unittest.main(verbosity=2)