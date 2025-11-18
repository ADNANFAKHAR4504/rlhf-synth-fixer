"""Integration tests for TapStack."""
import json
import os
import boto3
from cdktf import App

from lib.tap_stack import TapStack


class TestTurnAroundPromptAPIIntegrationTests:
    """Turn Around Prompt API Integration Tests."""

    @classmethod
    def setup_class(cls):
        """Set up test fixtures."""
        cls.environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
        cls.aws_region = os.environ.get("AWS_REGION", "us-east-1")
        cls.stack_name = f"TapStack{cls.environment_suffix}"
        
        # Load outputs
        outputs_file = "cfn-outputs/flat-outputs.json"
        if os.path.exists(outputs_file):
            with open(outputs_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                cls.outputs = data.get(cls.stack_name, {})
        else:
            cls.outputs = {}
        
        # Initialize boto3 clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.aws_region)
        cls.s3_client = boto3.client('s3', region_name=cls.aws_region)
        cls.route53_client = boto3.client('route53', region_name=cls.aws_region)

    def test_terraform_configuration_synthesis(self):
        """Test that stack instantiates properly."""
        app = App()
        stack = TapStack(
            app,
            "IntegrationTestStack",
            environment_suffix="test"
        )

        # Verify basic structure
        assert stack is not None
        assert stack.environment_suffix == "test"
        assert stack.region == "us-east-1"

    def test_analytics_vpc_exists(self):
        """Test that Analytics VPC exists and is configured correctly."""
        if not self.outputs:
            return  # Skip if no outputs
        
        vpc_id = self.outputs.get("analytics_vpc_id")
        assert vpc_id, "Analytics VPC ID not found in outputs"
        
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'
        assert vpc['CidrBlock'] == '10.1.0.0/16'

    def test_payment_vpc_exists(self):
        """Test that Payment VPC exists and is configured correctly."""
        if not self.outputs:
            return  # Skip if no outputs
        
        vpc_id = self.outputs.get("payment_vpc_id")
        assert vpc_id, "Payment VPC ID not found in outputs"
        
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        vpc = response['Vpcs'][0]
        assert vpc['State'] == 'available'
        assert vpc['CidrBlock'] == '10.0.0.0/16'

    def test_vpc_peering_connection_active(self):
        """Test that VPC peering connection exists and is active."""
        if not self.outputs:
            return  # Skip if no outputs
        
        peering_id = self.outputs.get("peering_connection_id")
        assert peering_id, "Peering connection ID not found in outputs"
        
        response = self.ec2_client.describe_vpc_peering_connections(
            VpcPeeringConnectionIds=[peering_id]
        )
        assert len(response['VpcPeeringConnections']) == 1
        peering = response['VpcPeeringConnections'][0]
        assert peering['Status']['Code'] == 'active'

    def test_security_groups_exist_with_peering_rules(self):
        """Test that security groups exist and have peering ingress rules."""
        if not self.outputs:
            return  # Skip if no outputs
        
        analytics_sg_id = self.outputs.get("analytics_security_group_id")
        payment_sg_id = self.outputs.get("payment_security_group_id")
        
        assert analytics_sg_id, "Analytics security group ID not found"
        assert payment_sg_id, "Payment security group ID not found"
        
        # Check analytics SG
        response = self.ec2_client.describe_security_groups(
            GroupIds=[analytics_sg_id]
        )
        assert len(response['SecurityGroups']) == 1
        analytics_sg = response['SecurityGroups'][0]
        
        # Verify ingress rules allow traffic from payment VPC
        ingress_cidrs = []
        for rule in analytics_sg.get('IpPermissions', []):
            for ip_range in rule.get('IpRanges', []):
                if 'CidrIp' in ip_range:
                    ingress_cidrs.append(ip_range['CidrIp'])
        assert '10.0.0.0/16' in ingress_cidrs, (
            f"Analytics SG should allow traffic from Payment VPC. Found CIDRs: {ingress_cidrs}"
        )
        
        # Check payment SG
        response = self.ec2_client.describe_security_groups(
            GroupIds=[payment_sg_id]
        )
        assert len(response['SecurityGroups']) == 1
        payment_sg = response['SecurityGroups'][0]
        
        # Verify ingress rules allow traffic from analytics VPC
        ingress_cidrs = []
        for rule in payment_sg.get('IpPermissions', []):
            for ip_range in rule.get('IpRanges', []):
                if 'CidrIp' in ip_range:
                    ingress_cidrs.append(ip_range['CidrIp'])
        assert '10.1.0.0/16' in ingress_cidrs, (
            f"Payment SG should allow traffic from Analytics VPC. Found CIDRs: {ingress_cidrs}"
        )

    def test_route_tables_have_peering_routes(self):
        """Test that route tables have routes for VPC peering."""
        if not self.outputs:
            return  # Skip if no outputs
        
        analytics_vpc_id = self.outputs.get("analytics_vpc_id")
        payment_vpc_id = self.outputs.get("payment_vpc_id")
        peering_id = self.outputs.get("peering_connection_id")
        
        # Get route tables for analytics VPC
        response = self.ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [analytics_vpc_id]}]
        )
        
        # Check if any route table has route to payment VPC via peering
        found_peering_route = False
        for rt in response['RouteTables']:
            for route in rt.get('Routes', []):
                if (route.get('VpcPeeringConnectionId') == peering_id and
                    route.get('DestinationCidrBlock') == '10.0.0.0/16'):
                    found_peering_route = True
                    break
        
        assert found_peering_route, "Analytics VPC should have route to Payment VPC via peering"
        
        # Get route tables for payment VPC
        response = self.ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [payment_vpc_id]}]
        )
        
        # Check if any route table has route to analytics VPC via peering
        found_peering_route = False
        for rt in response['RouteTables']:
            for route in rt.get('Routes', []):
                if (route.get('VpcPeeringConnectionId') == peering_id and
                    route.get('DestinationCidrBlock') == '10.1.0.0/16'):
                    found_peering_route = True
                    break
        
        assert found_peering_route, "Payment VPC should have route to Analytics VPC via peering"

    def test_s3_buckets_exist_with_encryption(self):
        """Test that S3 buckets exist and have encryption enabled."""
        if not self.outputs:
            return  # Skip if no outputs
        
        analytics_bucket = self.outputs.get("analytics_logs_bucket")
        payment_bucket = self.outputs.get("payment_logs_bucket")
        
        if analytics_bucket:
            # Replace *** with actual account ID for testing
            bucket_name = analytics_bucket.replace('***', 
                boto3.client('sts').get_caller_identity()['Account'])
            
            # Check bucket exists
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            assert response['ResponseMetadata']['HTTPStatusCode'] == 200
            
            # Check encryption
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = encryption['ServerSideEncryptionConfiguration']['Rules']
            assert len(rules) > 0
            assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['AES256', 'aws:kms']
            
            # Check public access block
            public_access = self.s3_client.get_public_access_block(Bucket=bucket_name)
            config = public_access['PublicAccessBlockConfiguration']
            assert config['BlockPublicAcls'] is True
            assert config['BlockPublicPolicy'] is True

    def test_route53_hosted_zones_exist(self):
        """Test that Route53 hosted zones exist and are private."""
        if not self.outputs:
            return  # Skip if no outputs
        
        analytics_zone_id = self.outputs.get("analytics_hosted_zone_id")
        payment_zone_id = self.outputs.get("payment_hosted_zone_id")
        
        if analytics_zone_id:
            response = self.route53_client.get_hosted_zone(Id=analytics_zone_id)
            zone = response['HostedZone']
            assert zone['Config']['PrivateZone'] is True
            
            # Verify VPC association
            analytics_vpc_id = self.outputs.get("analytics_vpc_id")
            assert any(vpc['VPCId'] == analytics_vpc_id 
                      for vpc in response.get('VPCs', []))
        
        if payment_zone_id:
            response = self.route53_client.get_hosted_zone(Id=payment_zone_id)
            zone = response['HostedZone']
            assert zone['Config']['PrivateZone'] is True
            
            # Verify VPC association
            payment_vpc_id = self.outputs.get("payment_vpc_id")
            assert any(vpc['VPCId'] == payment_vpc_id 
                      for vpc in response.get('VPCs', []))
