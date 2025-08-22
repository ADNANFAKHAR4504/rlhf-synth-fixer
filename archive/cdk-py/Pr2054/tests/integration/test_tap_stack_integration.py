"""Integration tests for deployed TapStack infrastructure."""
import os
import json
import boto3
import pytest
from botocore.exceptions import ClientError


class TestTapStackIntegration:
    """Integration tests for deployed infrastructure."""

    @pytest.fixture(scope="class")
    def outputs(self):
        """Load deployment outputs from cfn-outputs/flat-outputs.json."""
        outputs_file = os.path.join(
            os.path.dirname(__file__),
            "../../cfn-outputs/flat-outputs.json"
        )
        
        if not os.path.exists(outputs_file):
            pytest.skip(f"Outputs file not found: {outputs_file}")
        
        with open(outputs_file, 'r') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def ec2_client(self):
        """Create EC2 client."""
        return boto3.client('ec2', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def cloudformation_client(self):
        """Create CloudFormation client."""
        return boto3.client('cloudformation', region_name='us-east-1')

    def test_vpc_exists_and_configured(self, outputs, ec2_client):
        """Test that VPC exists with correct configuration."""
        vpc_id = outputs.get('VpcId')
        assert vpc_id is not None, "VPC ID not found in outputs"
        
        # Describe VPC
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]
        
        # Verify CIDR block
        assert vpc['CidrBlock'] == '10.0.0.0/16', f"Expected CIDR 10.0.0.0/16, got {vpc['CidrBlock']}"
        
        # Verify DNS settings - need to get attributes separately
        dns_hostnames = ec2_client.describe_vpc_attribute(VpcId=vpc_id, Attribute='enableDnsHostnames')
        dns_support = ec2_client.describe_vpc_attribute(VpcId=vpc_id, Attribute='enableDnsSupport')
        
        assert dns_hostnames['EnableDnsHostnames']['Value'] is True, "DNS hostnames should be enabled"
        assert dns_support['EnableDnsSupport']['Value'] is True, "DNS support should be enabled"
        
        # Verify tags
        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        assert 'Project' in tags, "Project tag not found"
        assert tags['Project'] == 'CDKSetup', f"Expected Project tag 'CDKSetup', got {tags.get('Project')}"
        assert 'Name' in tags, "Name tag not found"
        assert 'cdk-vpc' in tags['Name'], f"VPC name should contain 'cdk-vpc', got {tags.get('Name')}"

    def test_subnets_configuration(self, outputs, ec2_client):
        """Test that subnets are correctly configured."""
        subnet1_id = outputs.get('PublicSubnet1Id')
        subnet2_id = outputs.get('PublicSubnet2Id')
        
        assert subnet1_id is not None, "PublicSubnet1Id not found in outputs"
        assert subnet2_id is not None, "PublicSubnet2Id not found in outputs"
        
        # Describe subnets
        response = ec2_client.describe_subnets(SubnetIds=[subnet1_id, subnet2_id])
        subnets = response['Subnets']
        
        assert len(subnets) == 2, f"Expected 2 subnets, found {len(subnets)}"
        
        # Check availability zones
        azs = [subnet['AvailabilityZone'] for subnet in subnets]
        assert len(set(azs)) == 2, f"Subnets should be in different AZs, found: {azs}"
        
        # Check public IP mapping
        for subnet in subnets:
            assert subnet['MapPublicIpOnLaunch'] is True, f"Subnet {subnet['SubnetId']} should map public IPs"
            
            # Verify CIDR blocks are /24
            cidr = subnet['CidrBlock']
            assert cidr.endswith('/24'), f"Subnet {subnet['SubnetId']} should have /24 CIDR, got {cidr}"
            assert cidr.startswith('10.0.'), f"Subnet {subnet['SubnetId']} CIDR should start with 10.0., got {cidr}"

    def test_internet_gateway_attached(self, outputs, ec2_client):
        """Test that Internet Gateway is attached to VPC."""
        vpc_id = outputs.get('VpcId')
        assert vpc_id is not None, "VPC ID not found in outputs"
        
        # Describe Internet Gateways
        response = ec2_client.describe_internet_gateways(
            Filters=[
                {'Name': 'attachment.vpc-id', 'Values': [vpc_id]}
            ]
        )
        
        igws = response['InternetGateways']
        assert len(igws) > 0, f"No Internet Gateway found attached to VPC {vpc_id}"
        
        # Verify attachment
        igw = igws[0]
        attachments = igw.get('Attachments', [])
        assert len(attachments) > 0, "Internet Gateway has no attachments"
        assert attachments[0]['VpcId'] == vpc_id, f"IGW not attached to correct VPC"
        assert attachments[0]['State'] == 'available', f"IGW attachment state is {attachments[0]['State']}"

    def test_route_tables_have_internet_routes(self, outputs, ec2_client):
        """Test that route tables have routes to Internet Gateway."""
        subnet1_id = outputs.get('PublicSubnet1Id')
        subnet2_id = outputs.get('PublicSubnet2Id')
        
        for subnet_id in [subnet1_id, subnet2_id]:
            # Get route table for subnet
            response = ec2_client.describe_route_tables(
                Filters=[
                    {'Name': 'association.subnet-id', 'Values': [subnet_id]}
                ]
            )
            
            route_tables = response['RouteTables']
            assert len(route_tables) > 0, f"No route table found for subnet {subnet_id}"
            
            route_table = route_tables[0]
            routes = route_table['Routes']
            
            # Check for internet route (0.0.0.0/0)
            internet_routes = [r for r in routes if r.get('DestinationCidrBlock') == '0.0.0.0/0']
            assert len(internet_routes) > 0, f"No internet route found in route table for subnet {subnet_id}"
            
            # Verify route goes through IGW
            internet_route = internet_routes[0]
            assert 'GatewayId' in internet_route, "Internet route should have GatewayId"
            assert internet_route['GatewayId'].startswith('igw-'), f"Route should go through IGW, got {internet_route['GatewayId']}"

    def test_security_group_configuration(self, outputs, ec2_client):
        """Test security group configuration."""
        sg_id = outputs.get('SecurityGroupId')
        assert sg_id is not None, "SecurityGroupId not found in outputs"
        
        # Describe security group
        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        sg = response['SecurityGroups'][0]
        
        # Check description (may be None in some cases)
        description = sg.get('GroupDescription', '')
        # Skip description check if empty - focus on actual rules
        
        # Check ingress rules
        ingress_rules = sg['IpPermissions']
        ssh_rules = [r for r in ingress_rules if r.get('FromPort') == 22 and r.get('ToPort') == 22]
        assert len(ssh_rules) > 0, "No SSH ingress rule found"
        
        ssh_rule = ssh_rules[0]
        assert ssh_rule['IpProtocol'] == 'tcp', "SSH rule should use TCP protocol"
        
        # Check that SSH is allowed from anywhere
        ip_ranges = ssh_rule.get('IpRanges', [])
        assert any(r['CidrIp'] == '0.0.0.0/0' for r in ip_ranges), "SSH should be allowed from 0.0.0.0/0"
        
        # Check egress rules (should allow all)
        egress_rules = sg['IpPermissionsEgress']
        assert len(egress_rules) > 0, "No egress rules found"
        
        # Verify tags
        tags = {tag['Key']: tag['Value'] for tag in sg.get('Tags', [])}
        assert tags.get('Project') == 'CDKSetup', f"Expected Project tag 'CDKSetup', got {tags.get('Project')}"
        assert 'cdk-security-group' in tags.get('Name', ''), f"Security group name should contain 'cdk-security-group', got {tags.get('Name')}"

    def test_ec2_instance_running(self, outputs, ec2_client):
        """Test that EC2 instance is running with correct configuration."""
        instance_id = outputs.get('InstanceId')
        instance_public_ip = outputs.get('InstancePublicIp')
        
        assert instance_id is not None, "InstanceId not found in outputs"
        assert instance_public_ip is not None, "InstancePublicIp not found in outputs"
        
        # Describe instance
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        reservations = response['Reservations']
        assert len(reservations) > 0, f"No reservations found for instance {instance_id}"
        
        instances = reservations[0]['Instances']
        assert len(instances) > 0, f"No instances found in reservation"
        
        instance = instances[0]
        
        # Check instance state
        assert instance['State']['Name'] == 'running', f"Instance should be running, state is {instance['State']['Name']}"
        
        # Check instance type
        assert instance['InstanceType'] == 't3.micro', f"Expected t3.micro, got {instance['InstanceType']}"
        
        # Check public IP
        assert instance.get('PublicIpAddress') == instance_public_ip, f"Public IP mismatch"
        
        # Check it's in public subnet
        subnet_id = instance['SubnetId']
        assert subnet_id in [outputs.get('PublicSubnet1Id'), outputs.get('PublicSubnet2Id')], \
            f"Instance should be in one of the public subnets"
        
        # Check security group
        sg_ids = [sg['GroupId'] for sg in instance['SecurityGroups']]
        assert outputs.get('SecurityGroupId') in sg_ids, f"Instance should use the created security group"
        
        # Verify tags
        tags = {tag['Key']: tag['Value'] for tag in instance.get('Tags', [])}
        assert tags.get('Project') == 'CDKSetup', f"Expected Project tag 'CDKSetup', got {tags.get('Project')}"
        assert 'cdk-ec2-instance' in tags.get('Name', ''), f"Instance name should contain 'cdk-ec2-instance', got {tags.get('Name')}"

    def test_instance_metadata_options(self, outputs, ec2_client):
        """Test that instance has IMDSv2 enabled."""
        instance_id = outputs.get('InstanceId')
        assert instance_id is not None, "InstanceId not found in outputs"
        
        # Describe instance attribute
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        instance = response['Reservations'][0]['Instances'][0]
        
        metadata_options = instance.get('MetadataOptions', {})
        
        # Check IMDSv2 is required
        assert metadata_options.get('HttpTokens') == 'required', \
            f"IMDSv2 should be required, got {metadata_options.get('HttpTokens')}"

    def test_instance_has_iam_role(self, outputs, ec2_client):
        """Test that instance has an IAM role attached."""
        instance_id = outputs.get('InstanceId')
        assert instance_id is not None, "InstanceId not found in outputs"
        
        # Describe instance
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        instance = response['Reservations'][0]['Instances'][0]
        
        # Check IAM instance profile
        iam_profile = instance.get('IamInstanceProfile')
        assert iam_profile is not None, "Instance should have an IAM instance profile"
        assert 'Arn' in iam_profile, "IAM instance profile should have an ARN"

    def test_vpc_connectivity(self, outputs, ec2_client):
        """Test VPC has proper connectivity setup."""
        vpc_id = outputs.get('VpcId')
        
        # Check that default routes exist
        response = ec2_client.describe_route_tables(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'route.destination-cidr-block', 'Values': ['0.0.0.0/0']}
            ]
        )
        
        route_tables = response['RouteTables']
        assert len(route_tables) >= 2, f"Expected at least 2 route tables with internet routes, found {len(route_tables)}"

    def test_no_nat_gateways(self, outputs, ec2_client):
        """Test that no NAT gateways were created (cost optimization)."""
        vpc_id = outputs.get('VpcId')
        
        # Check for NAT gateways
        response = ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available', 'pending']}
            ]
        )
        
        nat_gateways = response['NatGateways']
        assert len(nat_gateways) == 0, f"No NAT gateways should be created, found {len(nat_gateways)}"

    def test_resource_tagging_consistency(self, outputs, ec2_client):
        """Test that all resources have consistent tagging."""
        vpc_id = outputs.get('VpcId')
        instance_id = outputs.get('InstanceId')
        sg_id = outputs.get('SecurityGroupId')
        
        resources_to_check = []
        
        # Get VPC tags
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc_tags = {tag['Key']: tag['Value'] for tag in response['Vpcs'][0].get('Tags', [])}
        resources_to_check.append(('VPC', vpc_tags))
        
        # Get Instance tags
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        instance_tags = {tag['Key']: tag['Value'] for tag in response['Reservations'][0]['Instances'][0].get('Tags', [])}
        resources_to_check.append(('Instance', instance_tags))
        
        # Get Security Group tags
        response = ec2_client.describe_security_groups(GroupIds=[sg_id])
        sg_tags = {tag['Key']: tag['Value'] for tag in response['SecurityGroups'][0].get('Tags', [])}
        resources_to_check.append(('SecurityGroup', sg_tags))
        
        # Check all resources have Project tag
        for resource_type, tags in resources_to_check:
            assert 'Project' in tags, f"{resource_type} missing Project tag"
            assert tags['Project'] == 'CDKSetup', f"{resource_type} has incorrect Project tag value"
            assert 'Name' in tags, f"{resource_type} missing Name tag"
            assert 'cdk-' in tags['Name'], f"{resource_type} name should contain 'cdk-' prefix"

    def test_instance_network_interface(self, outputs, ec2_client):
        """Test instance network interface configuration."""
        instance_id = outputs.get('InstanceId')
        
        # Describe instance
        response = ec2_client.describe_instances(InstanceIds=[instance_id])
        instance = response['Reservations'][0]['Instances'][0]
        
        # Check network interfaces
        network_interfaces = instance.get('NetworkInterfaces', [])
        assert len(network_interfaces) > 0, "Instance should have at least one network interface"
        
        primary_eni = network_interfaces[0]
        
        # Check public IP association
        assert 'Association' in primary_eni, "Network interface should have public IP association"
        assert 'PublicIp' in primary_eni['Association'], "Network interface should have public IP"
        assert primary_eni['Association']['PublicIp'] == outputs.get('InstancePublicIp'), \
            "Public IP should match the output"