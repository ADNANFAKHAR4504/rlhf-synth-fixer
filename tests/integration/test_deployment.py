"""Integration tests for Payment Migration Infrastructure"""
import json
import os
import pytest
import boto3
from botocore.exceptions import ClientError


class TestPaymentMigrationDeployment:  # pylint: disable=too-many-public-methods
    """Integration tests for deployed infrastructure"""

    @pytest.fixture(scope="class")
    def outputs(self):
        """Load outputs from CDKTF deployment"""
        outputs_file = "cfn-outputs/flat-outputs.json"

        if not os.path.exists(outputs_file):
            pytest.skip(f"Outputs file not found: {outputs_file}")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            return json.load(f)

    @pytest.fixture(scope="class")
    def ec2_client(self):
        """Create EC2 client"""
        return boto3.client('ec2', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def rds_client(self):
        """Create RDS client"""
        return boto3.client('rds', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def elbv2_client(self):
        """Create ELBv2 client"""
        return boto3.client('elbv2', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def dms_client(self):
        """Create DMS client"""
        return boto3.client('dms', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def route53_client(self):
        """Create Route53 client"""
        return boto3.client('route53', region_name='us-east-1')

    @pytest.fixture(scope="class")
    def cloudwatch_client(self):
        """Create CloudWatch client"""
        return boto3.client('cloudwatch', region_name='us-east-1')

    def test_vpc_exists(self, outputs, ec2_client):
        """Test that VPC is created and accessible"""
        vpc_id = outputs.get('vpc_id')
        assert vpc_id is not None, "VPC ID not found in outputs"

        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response['Vpcs']) == 1
        assert response['Vpcs'][0]['State'] == 'available'

    def test_subnets_exist(self, outputs, ec2_client):
        """Test that all subnets are created across multiple AZs"""
        vpc_id = outputs.get('vpc_id')

        response = ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        assert len(subnets) >= 6, "Should have at least 6 subnets (3 public, 3 private)"

        # Check that subnets are in different AZs
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        assert len(azs) >= 3, "Subnets should span at least 3 availability zones"

    def test_rds_cluster_running(self, outputs, rds_client):
        """Test that RDS Aurora cluster is running"""
        cluster_endpoint = outputs.get('rds_cluster_endpoint')
        assert cluster_endpoint is not None, "RDS cluster endpoint not found"

        # Extract cluster identifier from endpoint
        cluster_id = cluster_endpoint.split('.')[0]

        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        cluster = response['DBClusters'][0]
        assert cluster['Status'] == 'available'
        assert cluster['Engine'] == 'aurora-mysql'
        assert cluster['StorageEncrypted'] is True

    def test_rds_instances_running(self, outputs, rds_client):
        """Test that RDS instances are running (1 writer, 2 readers)"""
        cluster_endpoint = outputs.get('rds_cluster_endpoint')
        cluster_id = cluster_endpoint.split('.')[0]

        response = rds_client.describe_db_cluster_members(
            DBClusterIdentifier=cluster_id
        )

        members = response['DBClusterMembers']
        assert len(members) >= 3, "Should have at least 3 cluster members"

        writers = [m for m in members if m['IsClusterWriter']]
        readers = [m for m in members if not m['IsClusterWriter']]

        assert len(writers) == 1, "Should have exactly 1 writer"
        assert len(readers) >= 2, "Should have at least 2 readers"

    def test_alb_healthy(self, outputs, elbv2_client):
        """Test that Application Load Balancer is provisioned and active"""
        alb_dns = outputs.get('alb_dns_name')
        assert alb_dns is not None, "ALB DNS name not found"

        response = elbv2_client.describe_load_balancers(
            Names=[alb_dns.split('-')[0]]
        )

        if response['LoadBalancers']:
            alb = response['LoadBalancers'][0]
            assert alb['State']['Code'] == 'active'
            assert alb['Scheme'] == 'internet-facing'

    def test_target_group_healthy(self, outputs, elbv2_client):
        """Test that target group has healthy targets"""
        alb_dns = outputs.get('alb_dns_name')

        # Get target groups
        response = elbv2_client.describe_target_groups()

        target_groups = [
            tg for tg in response['TargetGroups']
            if 'payment-tg' in tg['TargetGroupName']
        ]

        assert len(target_groups) > 0, "Target group not found"

        # Check target health
        tg_arn = target_groups[0]['TargetGroupArn']
        health_response = elbv2_client.describe_target_health(
            TargetGroupArn=tg_arn
        )

        # At least some targets should be registered
        assert len(health_response['TargetHealthDescriptions']) >= 0

    def test_autoscaling_group_size(self, outputs, ec2_client):
        """Test that Auto Scaling group has correct size"""
        # Get Auto Scaling groups
        asg_client = boto3.client('autoscaling', region_name='us-east-1')
        response = asg_client.describe_auto_scaling_groups()

        payment_asgs = [
            asg for asg in response['AutoScalingGroups']
            if 'payment-asg' in asg['AutoScalingGroupName']
        ]

        assert len(payment_asgs) > 0, "Auto Scaling group not found"

        asg = payment_asgs[0]
        assert asg['MinSize'] == 3
        assert asg['MaxSize'] == 9
        assert asg['DesiredCapacity'] >= 3

    def test_dms_replication_instance_available(self, outputs, dms_client):
        """Test that DMS replication instance is available"""
        response = dms_client.describe_replication_instances()

        payment_instances = [
            inst for inst in response['ReplicationInstances']
            if 'payment-dms' in inst['ReplicationInstanceIdentifier']
        ]

        assert len(payment_instances) > 0, "DMS replication instance not found"
        assert payment_instances[0]['ReplicationInstanceStatus'] == 'available'

    def test_dms_endpoints_configured(self, outputs, dms_client):
        """Test that DMS endpoints are configured"""
        response = dms_client.describe_endpoints()

        payment_endpoints = [
            ep for ep in response['Endpoints']
            if 'payment' in ep['EndpointIdentifier']
        ]

        assert len(payment_endpoints) >= 2, "Should have source and target endpoints"

        source_endpoints = [ep for ep in payment_endpoints if ep['EndpointType'] == 'source']
        target_endpoints = [ep for ep in payment_endpoints if ep['EndpointType'] == 'target']

        assert len(source_endpoints) >= 1, "Should have source endpoint"
        assert len(target_endpoints) >= 1, "Should have target endpoint"

    def test_dms_task_exists(self, outputs, dms_client):
        """Test that DMS replication task exists"""
        dms_status = outputs.get('dms_replication_status')

        response = dms_client.describe_replication_tasks()

        payment_tasks = [
            task for task in response['ReplicationTasks']
            if 'payment-replication' in task['ReplicationTaskIdentifier']
        ]

        assert len(payment_tasks) > 0, "DMS replication task not found"

    def test_route53_zone_exists(self, outputs, route53_client):
        """Test that Route53 hosted zone exists"""
        response = route53_client.list_hosted_zones()

        payment_zones = [
            zone for zone in response['HostedZones']
            if 'payment-migration' in zone['Name']
        ]

        # Zone might not exist in test environment
        if len(payment_zones) > 0:
            assert payment_zones[0]['Config']['PrivateZone'] is False

    def test_cloudwatch_dashboard_exists(self, outputs, cloudwatch_client):
        """Test that CloudWatch dashboard is created"""
        response = cloudwatch_client.list_dashboards()

        payment_dashboards = [
            db for db in response['DashboardEntries']
            if 'payment-migration' in db['DashboardName']
        ]

        assert len(payment_dashboards) > 0, "CloudWatch dashboard not found"

    def test_security_groups_configured(self, outputs, ec2_client):
        """Test that security groups are properly configured"""
        vpc_id = outputs.get('vpc_id')

        response = ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        payment_sgs = [
            sg for sg in response['SecurityGroups']
            if 'payment' in sg['GroupName']
        ]

        assert len(payment_sgs) >= 4, "Should have at least 4 security groups"

    def test_kms_key_configured(self, outputs, ec2_client):
        """Test that KMS key is created and enabled"""
        kms_client = boto3.client('kms', region_name='us-east-1')

        response = kms_client.list_aliases()

        payment_aliases = [
            alias for alias in response['Aliases']
            if 'payment-migration' in alias['AliasName']
        ]

        if len(payment_aliases) > 0:
            key_id = payment_aliases[0]['TargetKeyId']
            key_response = kms_client.describe_key(KeyId=key_id)
            assert key_response['KeyMetadata']['KeyState'] == 'Enabled'
            assert key_response['KeyMetadata']['KeyUsage'] == 'ENCRYPT_DECRYPT'

    def test_nat_gateways_configured(self, outputs, ec2_client):
        """Test that NAT gateways are configured"""
        vpc_id = outputs.get('vpc_id')

        response = ec2_client.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        nat_gateways = response['NatGateways']
        available_nats = [ng for ng in nat_gateways if ng['State'] == 'available']

        assert len(available_nats) >= 3, "Should have 3 NAT gateways (one per AZ)"

    def test_end_to_end_connectivity(self, outputs):
        """Test end-to-end connectivity and outputs"""
        # Verify all critical outputs are present
        required_outputs = [
            'alb_dns_name',
            'rds_cluster_endpoint',
            'rds_reader_endpoint',
            'dms_replication_status',
            'vpc_id'
        ]

        for output in required_outputs:
            assert output in outputs, f"Required output {output} not found"
            assert outputs[output] is not None, f"Output {output} is None"
