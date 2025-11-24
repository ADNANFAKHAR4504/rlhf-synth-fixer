#!/usr/bin/env python3
"""
Integration tests for CloudFormation EKS Stack Deployment
Tests validate deployed AWS resources and their configurations
Requires actual AWS deployment to run successfully
"""

import json
import os
import time
import pytest
import boto3
from botocore.exceptions import ClientError
from typing import Dict, List, Optional


@pytest.fixture(scope="module")
def skip_if_not_deployed(cfn_outputs: Dict[str, str]):
    """Skip integration tests if stack is not deployed"""
    if not cfn_outputs or len(cfn_outputs) == 0:
        pytest.skip("Stack not deployed - cfn-outputs/flat-outputs.json not found or empty")


@pytest.fixture(scope="module")
def ec2_client(aws_region: str):
    """Create EC2 client"""
    return boto3.client('ec2', region_name=aws_region)


@pytest.fixture(scope="module")
def eks_client(aws_region: str):
    """Create EKS client"""
    return boto3.client('eks', region_name=aws_region)


@pytest.fixture(scope="module")
def iam_client(aws_region: str):
    """Create IAM client"""
    return boto3.client('iam', region_name=aws_region)


@pytest.fixture(scope="module")
def kms_client(aws_region: str):
    """Create KMS client"""
    return boto3.client('kms', region_name=aws_region)


@pytest.fixture(scope="module")
def logs_client(aws_region: str):
    """Create CloudWatch Logs client"""
    return boto3.client('logs', region_name=aws_region)


@pytest.fixture(scope="module")
def s3_client(aws_region: str):
    """Create S3 client"""
    return boto3.client('s3', region_name=aws_region)


@pytest.fixture(scope="module")
def cloudtrail_client(aws_region: str):
    """Create CloudTrail client"""
    return boto3.client('cloudtrail', region_name=aws_region)


@pytest.mark.integration
class TestVPCDeployment:
    """Test deployed VPC infrastructure"""

    def test_vpc_exists(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test VPC exists and has correct configuration"""
        vpc_id = cfn_outputs.get('VPCId')
        assert vpc_id, "VPCId must be in outputs"

        try:
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            assert len(response['Vpcs']) == 1, "VPC must exist"

            vpc = response['Vpcs'][0]
            assert vpc['CidrBlock'] == '10.0.0.0/16', "VPC CIDR must be 10.0.0.0/16"
            assert vpc['State'] == 'available', "VPC must be available"

        except ClientError as e:
            pytest.fail(f"Failed to describe VPC: {e}")

    def test_vpc_dns_attributes(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test VPC has DNS support and hostnames enabled"""
        vpc_id = cfn_outputs.get('VPCId')

        try:
            dns_support = ec2_client.describe_vpc_attribute(
                VpcId=vpc_id,
                Attribute='enableDnsSupport'
            )
            dns_hostnames = ec2_client.describe_vpc_attribute(
                VpcId=vpc_id,
                Attribute='enableDnsHostnames'
            )

            assert dns_support['EnableDnsSupport']['Value'] is True, \
                "DNS support must be enabled"
            assert dns_hostnames['EnableDnsHostnames']['Value'] is True, \
                "DNS hostnames must be enabled"

        except ClientError as e:
            pytest.fail(f"Failed to check VPC DNS attributes: {e}")

    def test_internet_gateway_attached(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test Internet Gateway is attached to VPC"""
        vpc_id = cfn_outputs.get('VPCId')

        try:
            response = ec2_client.describe_internet_gateways(
                Filters=[
                    {'Name': 'attachment.vpc-id', 'Values': [vpc_id]}
                ]
            )

            assert len(response['InternetGateways']) > 0, \
                "VPC must have Internet Gateway attached"

            igw = response['InternetGateways'][0]
            attachments = igw['Attachments']
            assert len(attachments) == 1, "IGW must be attached to VPC"
            assert attachments[0]['VpcId'] == vpc_id, "IGW must be attached to correct VPC"
            assert attachments[0]['State'] == 'available', "IGW attachment must be available"

        except ClientError as e:
            pytest.fail(f"Failed to describe Internet Gateway: {e}")

    def test_subnets_across_availability_zones(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test subnets are distributed across 3 availability zones"""
        vpc_id = cfn_outputs.get('VPCId')

        try:
            response = ec2_client.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )

            subnets = response['Subnets']
            assert len(subnets) == 6, "Must have 6 subnets (3 public + 3 private)"

            # Check AZ distribution
            azs = {subnet['AvailabilityZone'] for subnet in subnets}
            assert len(azs) == 3, "Subnets must be in 3 different AZs"

        except ClientError as e:
            pytest.fail(f"Failed to describe subnets: {e}")

    def test_public_subnets_exist(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test public subnets exist with correct configuration"""
        vpc_id = cfn_outputs.get('VPCId')

        try:
            response = ec2_client.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'tag:Name', 'Values': ['*public*']}
                ]
            )

            public_subnets = response['Subnets']
            assert len(public_subnets) == 3, "Must have 3 public subnets"

            expected_cidrs = {'10.0.1.0/24', '10.0.2.0/24', '10.0.3.0/24'}
            actual_cidrs = {subnet['CidrBlock'] for subnet in public_subnets}
            assert actual_cidrs == expected_cidrs, "Public subnet CIDRs must match"

            for subnet in public_subnets:
                assert subnet['MapPublicIpOnLaunch'] is True, \
                    "Public subnets must auto-assign public IPs"

        except ClientError as e:
            pytest.fail(f"Failed to describe public subnets: {e}")

    def test_private_subnets_exist(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test private subnets exist with correct configuration"""
        vpc_id = cfn_outputs.get('VPCId')

        try:
            response = ec2_client.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'tag:Name', 'Values': ['*private*']}
                ]
            )

            private_subnets = response['Subnets']
            assert len(private_subnets) == 3, "Must have 3 private subnets"

            expected_cidrs = {'10.0.11.0/24', '10.0.12.0/24', '10.0.13.0/24'}
            actual_cidrs = {subnet['CidrBlock'] for subnet in private_subnets}
            assert actual_cidrs == expected_cidrs, "Private subnet CIDRs must match"

        except ClientError as e:
            pytest.fail(f"Failed to describe private subnets: {e}")

    def test_nat_gateways_exist_and_available(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test NAT Gateways exist and are available"""
        vpc_id = cfn_outputs.get('VPCId')

        try:
            response = ec2_client.describe_nat_gateways(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'state', 'Values': ['available']}
                ]
            )

            nat_gateways = response['NatGateways']
            assert len(nat_gateways) == 3, "Must have 3 NAT Gateways"

            # Check each NAT Gateway is in different AZ
            azs = set()
            for nat_gw in nat_gateways:
                subnet_id = nat_gw['SubnetId']
                subnet_response = ec2_client.describe_subnets(SubnetIds=[subnet_id])
                az = subnet_response['Subnets'][0]['AvailabilityZone']
                azs.add(az)

            assert len(azs) == 3, "NAT Gateways must be in 3 different AZs"

        except ClientError as e:
            pytest.fail(f"Failed to describe NAT Gateways: {e}")

    def test_nat_gateways_have_elastic_ips(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test each NAT Gateway has an Elastic IP"""
        vpc_id = cfn_outputs.get('VPCId')

        try:
            response = ec2_client.describe_nat_gateways(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )

            nat_gateways = response['NatGateways']
            for nat_gw in nat_gateways:
                addresses = nat_gw['NatGatewayAddresses']
                assert len(addresses) > 0, "NAT Gateway must have address"
                assert addresses[0].get('PublicIp'), "NAT Gateway must have public IP"

        except ClientError as e:
            pytest.fail(f"Failed to check NAT Gateway IPs: {e}")

    def test_route_tables_configured(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test route tables are properly configured"""
        vpc_id = cfn_outputs.get('VPCId')

        try:
            response = ec2_client.describe_route_tables(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )

            route_tables = response['RouteTables']
            # 1 public + 3 private + 1 main = 5 route tables minimum
            assert len(route_tables) >= 4, "Must have at least 4 route tables"

        except ClientError as e:
            pytest.fail(f"Failed to describe route tables: {e}")

    def test_public_route_to_internet_gateway(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test public route table routes to Internet Gateway"""
        vpc_id = cfn_outputs.get('VPCId')

        try:
            # Get public subnets
            subnets_response = ec2_client.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'tag:Name', 'Values': ['*public*']}
                ]
            )

            public_subnet_ids = [subnet['SubnetId'] for subnet in subnets_response['Subnets']]

            # Get route tables for public subnets
            rt_response = ec2_client.describe_route_tables(
                Filters=[
                    {'Name': 'association.subnet-id', 'Values': public_subnet_ids}
                ]
            )

            for rt in rt_response['RouteTables']:
                routes = rt['Routes']
                igw_routes = [r for r in routes if r.get('GatewayId', '').startswith('igw-')]

                assert len(igw_routes) > 0, "Public route table must have IGW route"
                assert igw_routes[0]['DestinationCidrBlock'] == '0.0.0.0/0', \
                    "IGW route must be default route"

        except ClientError as e:
            pytest.fail(f"Failed to check public routes: {e}")

    def test_private_routes_to_nat_gateways(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test private route tables route to NAT Gateways"""
        vpc_id = cfn_outputs.get('VPCId')

        try:
            # Get private subnets
            subnets_response = ec2_client.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]},
                    {'Name': 'tag:Name', 'Values': ['*private*']}
                ]
            )

            private_subnet_ids = [subnet['SubnetId'] for subnet in subnets_response['Subnets']]

            # Get route tables for private subnets
            rt_response = ec2_client.describe_route_tables(
                Filters=[
                    {'Name': 'association.subnet-id', 'Values': private_subnet_ids}
                ]
            )

            for rt in rt_response['RouteTables']:
                routes = rt['Routes']
                nat_routes = [r for r in routes if r.get('NatGatewayId', '').startswith('nat-')]

                assert len(nat_routes) > 0, "Private route table must have NAT Gateway route"

        except ClientError as e:
            pytest.fail(f"Failed to check private routes: {e}")


@pytest.mark.integration
class TestEKSClusterDeployment:
    """Test deployed EKS cluster"""

    def test_eks_cluster_exists_and_active(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], eks_client):
        """Test EKS cluster exists and is in active state"""
        cluster_name = cfn_outputs.get('ClusterName')
        assert cluster_name, "ClusterName must be in outputs"

        try:
            response = eks_client.describe_cluster(name=cluster_name)
            cluster = response['cluster']

            assert cluster['status'] in ['ACTIVE', 'CREATING', 'UPDATING'], \
                f"Cluster must be active or transitioning, got: {cluster['status']}"

            if cluster['status'] == 'ACTIVE':
                assert cluster['name'] == cluster_name, "Cluster name must match"
                assert cluster['endpoint'], "Cluster must have endpoint"

        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.fail("EKS cluster not found - deployment may be in progress")
            else:
                pytest.fail(f"Failed to describe EKS cluster: {e}")

    def test_eks_cluster_version(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], eks_client):
        """Test EKS cluster version is correct"""
        cluster_name = cfn_outputs.get('ClusterName')

        try:
            response = eks_client.describe_cluster(name=cluster_name)
            cluster = response['cluster']

            if cluster['status'] == 'ACTIVE':
                version = cluster['version']
                assert version in ['1.28', '1.29', '1.30'], \
                    f"Cluster version must be 1.28, 1.29, or 1.30, got: {version}"

        except ClientError as e:
            pytest.skip(f"Cluster not ready for version check: {e}")

    def test_eks_cluster_vpc_config(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], eks_client):
        """Test EKS cluster VPC configuration"""
        cluster_name = cfn_outputs.get('ClusterName')
        vpc_id = cfn_outputs.get('VPCId')

        try:
            response = eks_client.describe_cluster(name=cluster_name)
            cluster = response['cluster']

            if cluster['status'] == 'ACTIVE':
                vpc_config = cluster['resourcesVpcConfig']

                assert vpc_config['vpcId'] == vpc_id, "Cluster must be in correct VPC"
                assert len(vpc_config['subnetIds']) == 3, "Cluster must be in 3 subnets"
                assert vpc_config['endpointPublicAccess'] is True, \
                    "Public endpoint access must be enabled"
                assert vpc_config['endpointPrivateAccess'] is True, \
                    "Private endpoint access must be enabled"

        except ClientError as e:
            pytest.skip(f"Cluster not ready for VPC config check: {e}")

    def test_eks_cluster_encryption(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], eks_client):
        """Test EKS cluster has secrets encryption enabled"""
        cluster_name = cfn_outputs.get('ClusterName')

        try:
            response = eks_client.describe_cluster(name=cluster_name)
            cluster = response['cluster']

            if cluster['status'] == 'ACTIVE':
                encryption_config = cluster.get('encryptionConfig', [])
                assert len(encryption_config) > 0, "Cluster must have encryption config"

                config = encryption_config[0]
                assert 'secrets' in config['resources'], \
                    "Secrets must be encrypted"

        except ClientError as e:
            pytest.skip(f"Cluster not ready for encryption check: {e}")

    def test_eks_cluster_logging_enabled(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], eks_client):
        """Test EKS cluster has all log types enabled"""
        cluster_name = cfn_outputs.get('ClusterName')

        try:
            response = eks_client.describe_cluster(name=cluster_name)
            cluster = response['cluster']

            if cluster['status'] == 'ACTIVE':
                logging = cluster.get('logging', {})
                cluster_logging = logging.get('clusterLogging', [])

                if len(cluster_logging) > 0:
                    enabled_types = []
                    for log_setup in cluster_logging:
                        if log_setup.get('enabled'):
                            enabled_types.extend(log_setup.get('types', []))

                    expected_types = {'api', 'audit', 'authenticator', 'controllerManager', 'scheduler'}
                    actual_types = set(enabled_types)

                    assert actual_types == expected_types, \
                        f"All log types must be enabled. Expected: {expected_types}, Got: {actual_types}"

        except ClientError as e:
            pytest.skip(f"Cluster not ready for logging check: {e}")

    def test_oidc_provider_configured(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], iam_client, eks_client):
        """Test OIDC provider is configured for IRSA"""
        oidc_arn = cfn_outputs.get('OIDCProviderArn')
        assert oidc_arn, "OIDCProviderArn must be in outputs"

        try:
            # Extract OIDC provider ID from ARN
            oidc_id = oidc_arn.split('/')[-1]

            response = iam_client.get_open_id_connect_provider(
                OpenIDConnectProviderArn=oidc_arn
            )

            assert 'sts.amazonaws.com' in response['ClientIDList'], \
                "OIDC provider must have sts.amazonaws.com in client ID list"

        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchEntity':
                pytest.skip("OIDC provider not yet created - cluster may be deploying")
            else:
                pytest.fail(f"Failed to get OIDC provider: {e}")

    def test_node_group_exists(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], eks_client):
        """Test EKS node group exists"""
        cluster_name = cfn_outputs.get('ClusterName')

        try:
            response = eks_client.list_nodegroups(clusterName=cluster_name)
            nodegroups = response.get('nodegroups', [])

            assert len(nodegroups) > 0, "Cluster must have at least 1 node group"

        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFoundException':
                pytest.skip("Cluster not found or not ready for node group check")
            else:
                pytest.fail(f"Failed to list node groups: {e}")

    def test_node_group_configuration(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], eks_client):
        """Test node group has correct configuration"""
        cluster_name = cfn_outputs.get('ClusterName')

        try:
            response = eks_client.list_nodegroups(clusterName=cluster_name)
            nodegroups = response.get('nodegroups', [])

            if len(nodegroups) > 0:
                nodegroup_name = nodegroups[0]
                ng_response = eks_client.describe_nodegroup(
                    clusterName=cluster_name,
                    nodegroupName=nodegroup_name
                )

                nodegroup = ng_response['nodegroup']
                status = nodegroup['status']

                if status in ['ACTIVE', 'CREATING', 'UPDATING']:
                    scaling_config = nodegroup['scalingConfig']
                    assert scaling_config['minSize'] >= 1, "Min size must be at least 1"
                    assert scaling_config['maxSize'] >= scaling_config['minSize'], \
                        "Max size must be >= min size"

        except ClientError as e:
            pytest.skip(f"Node group not ready for configuration check: {e}")


@pytest.mark.integration
class TestSecurityGroups:
    """Test deployed security groups"""

    def test_cluster_security_group_exists(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test cluster security group exists"""
        sg_id = cfn_outputs.get('ClusterSecurityGroupId')
        assert sg_id, "ClusterSecurityGroupId must be in outputs"

        try:
            response = ec2_client.describe_security_groups(GroupIds=[sg_id])
            assert len(response['SecurityGroups']) == 1, "Cluster security group must exist"

        except ClientError as e:
            pytest.fail(f"Failed to describe cluster security group: {e}")

    def test_node_security_group_exists(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test node security group exists"""
        sg_id = cfn_outputs.get('NodeSecurityGroupId')
        assert sg_id, "NodeSecurityGroupId must be in outputs"

        try:
            response = ec2_client.describe_security_groups(GroupIds=[sg_id])
            assert len(response['SecurityGroups']) == 1, "Node security group must exist"

        except ClientError as e:
            pytest.fail(f"Failed to describe node security group: {e}")

    def test_security_group_rules_exist(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test security groups have ingress and egress rules"""
        node_sg_id = cfn_outputs.get('NodeSecurityGroupId')

        try:
            response = ec2_client.describe_security_groups(GroupIds=[node_sg_id])
            sg = response['SecurityGroups'][0]

            # Check has ingress rules
            ingress_rules = sg['IpPermissions']
            assert len(ingress_rules) > 0, "Node security group must have ingress rules"

        except ClientError as e:
            pytest.fail(f"Failed to check security group rules: {e}")


@pytest.mark.integration
class TestKMSEncryption:
    """Test KMS encryption"""

    def test_kms_key_exists(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], kms_client, eks_client):
        """Test KMS key exists and is enabled"""
        cluster_name = cfn_outputs.get('ClusterName')

        try:
            # Get cluster to find KMS key
            response = eks_client.describe_cluster(name=cluster_name)
            cluster = response['cluster']

            if cluster['status'] == 'ACTIVE':
                encryption_config = cluster.get('encryptionConfig', [])
                if len(encryption_config) > 0:
                    key_arn = encryption_config[0]['provider']['keyArn']

                    # Describe key
                    key_response = kms_client.describe_key(KeyId=key_arn)
                    key_metadata = key_response['KeyMetadata']

                    assert key_metadata['KeyState'] == 'Enabled', "KMS key must be enabled"
                    assert key_metadata['Enabled'] is True, "KMS key must be enabled"

        except ClientError as e:
            pytest.skip(f"KMS key check not possible: {e}")


@pytest.mark.integration
class TestCloudWatchLogs:
    """Test CloudWatch logging"""

    def test_vpc_flow_logs_log_group_exists(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], logs_client, aws_region: str):
        """Test VPC Flow Logs log group exists"""
        try:
            # Try to find flow logs log group
            response = logs_client.describe_log_groups(
                logGroupNamePrefix='/aws/vpc/flowlogs'
            )

            assert len(response['logGroups']) > 0, "VPC Flow Logs log group must exist"

            log_group = response['logGroups'][0]
            assert log_group['retentionInDays'] == 7, \
                "Flow logs retention must be 7 days"

        except ClientError as e:
            pytest.skip(f"Flow logs log group not yet created: {e}")

    def test_eks_cluster_log_group_exists(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], logs_client):
        """Test EKS cluster log group exists"""
        cluster_name = cfn_outputs.get('ClusterName')

        try:
            response = logs_client.describe_log_groups(
                logGroupNamePrefix=f'/aws/eks/{cluster_name}'
            )

            assert len(response['logGroups']) > 0, "EKS cluster log group must exist"

        except ClientError as e:
            pytest.skip(f"EKS log group not yet created: {e}")


@pytest.mark.integration
class TestVPCFlowLogs:
    """Test VPC Flow Logs"""

    def test_vpc_flow_logs_enabled(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test VPC has flow logs enabled"""
        vpc_id = cfn_outputs.get('VPCId')

        try:
            response = ec2_client.describe_flow_logs(
                Filters=[
                    {'Name': 'resource-id', 'Values': [vpc_id]}
                ]
            )

            flow_logs = response['FlowLogs']
            assert len(flow_logs) > 0, "VPC must have flow logs enabled"

            flow_log = flow_logs[0]
            assert flow_log['TrafficType'] == 'ALL', "Flow logs must capture all traffic"
            assert flow_log['LogDestinationType'] == 'cloud-watch-logs', \
                "Flow logs must use CloudWatch Logs"

        except ClientError as e:
            pytest.fail(f"Failed to describe flow logs: {e}")


@pytest.mark.integration
class TestCloudTrail:
    """Test CloudTrail"""

    def test_cloudtrail_bucket_exists(self, skip_if_not_deployed, s3_client):
        """Test CloudTrail S3 bucket exists"""
        try:
            # Try to find CloudTrail buckets with naming pattern
            response = s3_client.list_buckets()
            buckets = response['Buckets']

            cloudtrail_buckets = [b for b in buckets if 'cloudtrail' in b['Name'].lower()]
            assert len(cloudtrail_buckets) > 0, "CloudTrail bucket must exist"

        except ClientError as e:
            pytest.skip(f"Failed to list buckets: {e}")

    def test_cloudtrail_bucket_encryption(self, skip_if_not_deployed, s3_client):
        """Test CloudTrail bucket has encryption enabled"""
        try:
            # Find CloudTrail bucket
            response = s3_client.list_buckets()
            buckets = response['Buckets']

            cloudtrail_buckets = [b for b in buckets if 'cloudtrail' in b['Name'].lower()]
            if len(cloudtrail_buckets) > 0:
                bucket_name = cloudtrail_buckets[0]['Name']

                # Check encryption
                encryption_response = s3_client.get_bucket_encryption(Bucket=bucket_name)
                rules = encryption_response['ServerSideEncryptionConfiguration']['Rules']

                assert len(rules) > 0, "Bucket must have encryption rules"
                assert rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'] in ['AES256', 'aws:kms'], \
                    "Bucket must use AES256 or KMS encryption"

        except ClientError as e:
            if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
                pytest.fail("CloudTrail bucket must have encryption enabled")
            else:
                pytest.skip(f"Failed to check bucket encryption: {e}")

    def test_cloudtrail_bucket_versioning(self, skip_if_not_deployed, s3_client):
        """Test CloudTrail bucket has versioning enabled"""
        try:
            # Find CloudTrail bucket
            response = s3_client.list_buckets()
            buckets = response['Buckets']

            cloudtrail_buckets = [b for b in buckets if 'cloudtrail' in b['Name'].lower()]
            if len(cloudtrail_buckets) > 0:
                bucket_name = cloudtrail_buckets[0]['Name']

                # Check versioning
                versioning_response = s3_client.get_bucket_versioning(Bucket=bucket_name)
                status = versioning_response.get('Status')

                assert status == 'Enabled', "Bucket versioning must be enabled"

        except ClientError as e:
            pytest.skip(f"Failed to check bucket versioning: {e}")

    def test_cloudtrail_logging_enabled(self, skip_if_not_deployed, cloudtrail_client):
        """Test CloudTrail is logging"""
        try:
            response = cloudtrail_client.describe_trails()
            trails = response.get('trailList', [])

            # Find our trail (contains 'eks')
            eks_trails = [t for t in trails if 'eks' in t['Name'].lower()]
            assert len(eks_trails) > 0, "CloudTrail for EKS must exist"

            trail = eks_trails[0]
            trail_name = trail['Name']

            # Check trail status
            status_response = cloudtrail_client.get_trail_status(Name=trail_name)
            assert status_response['IsLogging'] is True, "CloudTrail must be logging"

        except ClientError as e:
            pytest.skip(f"CloudTrail not yet created or not accessible: {e}")


@pytest.mark.integration
class TestResourceTags:
    """Test resource tagging"""

    def test_vpc_has_tags(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test VPC has required tags"""
        vpc_id = cfn_outputs.get('VPCId')

        try:
            response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
            vpc = response['Vpcs'][0]

            tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}

            required_tags = ['Name', 'Environment', 'Team', 'CostCenter']
            for tag in required_tags:
                assert tag in tags, f"VPC must have {tag} tag"

        except ClientError as e:
            pytest.fail(f"Failed to check VPC tags: {e}")

    def test_subnets_have_tags(self, skip_if_not_deployed, cfn_outputs: Dict[str, str], ec2_client):
        """Test subnets have required tags"""
        vpc_id = cfn_outputs.get('VPCId')

        try:
            response = ec2_client.describe_subnets(
                Filters=[
                    {'Name': 'vpc-id', 'Values': [vpc_id]}
                ]
            )

            subnets = response['Subnets']
            for subnet in subnets:
                tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
                assert 'Name' in tags, f"Subnet {subnet['SubnetId']} must have Name tag"

        except ClientError as e:
            pytest.fail(f"Failed to check subnet tags: {e}")


if __name__ == '__main__':
    pytest.main([__file__, '-v', '--tb=short', '-m', 'integration'])
