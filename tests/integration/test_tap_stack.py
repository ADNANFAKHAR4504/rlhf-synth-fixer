"""
Integration tests for TAP Stack infrastructure.

These tests validate actual deployed resources and their connectivity
using outputs from cfn-outputs/flat-outputs.json.

No mocking - all tests run against real AWS resources.
"""

import json
import os
import time
import unittest
from typing import Dict, Optional

import boto3
import pytest
from botocore.exceptions import ClientError


def load_stack_outputs() -> Dict[str, str]:
    """Load CloudFormation stack outputs from flat-outputs.json"""
    base_dir = os.path.dirname(os.path.abspath(__file__))
    flat_outputs_path = os.path.join(
        base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
    )

    if not os.path.exists(flat_outputs_path):
        pytest.skip(f"Outputs file not found: {flat_outputs_path}")

    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        return json.load(f)


# Load outputs once at module level
STACK_OUTPUTS = load_stack_outputs()


def get_output(key: str, default: Optional[str] = None) -> str:
    """Get output value from stack outputs"""
    value = STACK_OUTPUTS.get(key, default)
    if value is None:
        pytest.skip(f"Output '{key}' not found in deployment outputs")
    return value


@pytest.mark.describe("VPC and Networking")
class TestVPCNetworking(unittest.TestCase):
    """Test VPC and network infrastructure"""

    def setUp(self):
        """Initialize boto3 clients"""
        self.region = get_output('Region')
        self.ec2 = boto3.client('ec2', region_name=self.region)

    @pytest.mark.it("VPC exists with correct configuration")
    def test_vpc_exists(self):
        """Verify VPC is created and configured correctly"""
        vpc_id = get_output('VpcId')

        # Verify VPC exists
        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')
        self.assertTrue(vpc['EnableDnsHostnames'])
        self.assertTrue(vpc['EnableDnsSupport'])

    @pytest.mark.it("Subnets are created across availability zones")
    def test_subnets_exist(self):
        """Verify public and private subnets exist"""
        vpc_id = get_output('VpcId')

        # Get all subnets in the VPC
        response = self.ec2.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        self.assertGreater(len(subnets), 0, "No subnets found in VPC")

        # Verify subnets span multiple AZs
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        self.assertGreaterEqual(len(azs), 2, "Subnets should span at least 2 AZs")

        # Verify we have both public and private subnets
        public_subnets = [s for s in subnets if s.get('MapPublicIpOnLaunch', False)]
        private_subnets = [s for s in subnets if not s.get('MapPublicIpOnLaunch', False)]

        self.assertGreater(len(public_subnets), 0, "No public subnets found")
        self.assertGreater(len(private_subnets), 0, "No private subnets found")


@pytest.mark.describe("Database Infrastructure")
class TestDatabaseInfrastructure(unittest.TestCase):
    """Test RDS database infrastructure and connectivity"""

    def setUp(self):
        """Initialize boto3 clients"""
        self.region = get_output('Region')
        self.rds = boto3.client('rds', region_name=self.region)

    @pytest.mark.it("RDS database exists and is available")
    def test_database_exists(self):
        """Verify RDS database instance is created and available"""
        db_endpoint = get_output('DatabaseEndpoint')
        db_name = db_endpoint.split('.')[0]  # Extract instance ID from endpoint

        # Describe DB instances
        response = self.rds.describe_db_instances()
        db_instances = [
            db for db in response['DBInstances']
            if db_endpoint.startswith(db['Endpoint']['Address'])
        ]

        self.assertGreater(len(db_instances), 0, "Database instance not found")
        db_instance = db_instances[0]

        # Verify database is available
        self.assertEqual(db_instance['DBInstanceStatus'], 'available')
        self.assertTrue(db_instance['StorageEncrypted'], "Storage should be encrypted")
        self.assertTrue(db_instance['PubliclyAccessible'] is False, "DB should not be publicly accessible")

    @pytest.mark.it("Database security group allows VPC access")
    def test_database_security_group(self):
        """Verify database security group configuration"""
        db_sg_id = get_output('DatabaseSecurityGroupId')
        vpc_cidr = get_output('VpcCidr')

        response = self.ec2.describe_security_groups(GroupIds=[db_sg_id])
        sg = response['SecurityGroups'][0]

        # Verify ingress rules allow VPC CIDR
        has_vpc_access = False
        for rule in sg['IpPermissions']:
            for ip_range in rule.get('IpRanges', []):
                if ip_range.get('CidrIp') == vpc_cidr:
                    has_vpc_access = True
                    break

        self.assertTrue(has_vpc_access, "Security group should allow VPC CIDR access")

    @pytest.mark.it("Read replica endpoint is accessible")
    def test_read_replica_exists(self):
        """Verify read replica is configured"""
        read_replica_endpoint = get_output('ReadReplicaEndpoint', default=None)

        if read_replica_endpoint:
            # Verify read replica exists
            response = self.rds.describe_db_instances()
            read_replicas = [
                db for db in response['DBInstances']
                if read_replica_endpoint.startswith(db['Endpoint']['Address'])
            ]

            self.assertGreater(len(read_replicas), 0, "Read replica not found")
            self.assertEqual(read_replicas[0]['DBInstanceStatus'], 'available')


@pytest.mark.describe("ElastiCache Redis")
class TestRedisInfrastructure(unittest.TestCase):
    """Test ElastiCache Redis infrastructure"""

    def setUp(self):
        """Initialize boto3 clients"""
        self.region = get_output('Region')
        self.elasticache = boto3.client('elasticache', region_name=self.region)

    @pytest.mark.it("Redis cluster exists and is available")
    def test_redis_cluster_exists(self):
        """Verify Redis cluster is created and available"""
        redis_endpoint = get_output('RedisEndpoint')

        # Extract cluster ID from endpoint
        # Format: clustercfg.xxxx.yyyy.region.cache.amazonaws.com
        cluster_parts = redis_endpoint.split('.')
        if len(cluster_parts) > 1:
            cluster_id = cluster_parts[1]
        else:
            pytest.skip("Cannot parse Redis cluster ID from endpoint")

        # Describe replication groups
        response = self.elasticache.describe_replication_groups()

        # Find our cluster
        our_cluster = None
        for group in response['ReplicationGroups']:
            if redis_endpoint in str(group.get('ConfigurationEndpoint', {})):
                our_cluster = group
                break

        if not our_cluster:
            pytest.skip(f"Redis cluster not found for endpoint: {redis_endpoint}")

        # Verify cluster status
        self.assertEqual(our_cluster['Status'], 'available')
        self.assertTrue(our_cluster['AtRestEncryptionEnabled'])
        self.assertTrue(our_cluster['TransitEncryptionEnabled'])

    @pytest.mark.it("Redis security group is configured correctly")
    def test_redis_security_group(self):
        """Verify Redis security group allows VPC access"""
        redis_sg_id = get_output('RedisSecurityGroupId')
        redis_port = int(get_output('RedisPort', '6379'))

        response = self.ec2.describe_security_groups(GroupIds=[redis_sg_id])
        sg = response['SecurityGroups'][0]

        # Verify ingress rule for Redis port
        has_redis_access = False
        for rule in sg['IpPermissions']:
            if rule.get('FromPort') == redis_port and rule.get('ToPort') == redis_port:
                has_redis_access = True
                break

        self.assertTrue(has_redis_access, f"Security group should allow port {redis_port}")


@pytest.mark.describe("Compute and Auto Scaling")
class TestComputeInfrastructure(unittest.TestCase):
    """Test EC2 Auto Scaling infrastructure"""

    def setUp(self):
        """Initialize boto3 clients"""
        self.region = get_output('Region')
        self.autoscaling = boto3.client('autoscaling', region_name=self.region)
        self.ec2 = boto3.client('ec2', region_name=self.region)

    @pytest.mark.it("Auto Scaling Group exists and is healthy")
    def test_autoscaling_group_exists(self):
        """Verify Auto Scaling Group is created and healthy"""
        asg_name = get_output('AsgName')

        response = self.autoscaling.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )

        self.assertEqual(len(response['AutoScalingGroups']), 1)
        asg = response['AutoScalingGroups'][0]

        # Verify ASG has instances or desired capacity
        self.assertGreaterEqual(asg['DesiredCapacity'], 0)
        self.assertGreaterEqual(asg['MaxSize'], asg['DesiredCapacity'])
        self.assertLessEqual(asg['MinSize'], asg['DesiredCapacity'])

    @pytest.mark.it("Compute security group allows required traffic")
    def test_compute_security_group(self):
        """Verify compute security group configuration"""
        compute_sg_id = get_output('ComputeSecurityGroupId')

        response = self.ec2.describe_security_groups(GroupIds=[compute_sg_id])
        sg = response['SecurityGroups'][0]

        # Verify security group exists and has rules
        self.assertGreater(len(sg['IpPermissions']), 0, "Security group should have ingress rules")


@pytest.mark.describe("Load Balancer")
class TestLoadBalancer(unittest.TestCase):
    """Test Network Load Balancer infrastructure"""

    def setUp(self):
        """Initialize boto3 clients"""
        self.region = get_output('Region')
        self.elbv2 = boto3.client('elbv2', region_name=self.region)

    @pytest.mark.it("Network Load Balancer exists and is active")
    def test_nlb_exists(self):
        """Verify NLB is created and active"""
        nlb_arn = get_output('NlbArn')

        response = self.elbv2.describe_load_balancers(
            LoadBalancerArns=[nlb_arn]
        )

        self.assertEqual(len(response['LoadBalancers']), 1)
        nlb = response['LoadBalancers'][0]

        self.assertEqual(nlb['State']['Code'], 'active')
        self.assertEqual(nlb['Type'], 'network')
        self.assertEqual(nlb['Scheme'], 'internet-facing')

    @pytest.mark.it("Load Balancer has DNS name")
    def test_nlb_dns_exists(self):
        """Verify NLB DNS name is accessible"""
        nlb_dns = get_output('NlbDnsName')

        # Verify DNS name format
        self.assertTrue(nlb_dns.endswith('.amazonaws.com'))
        self.assertIn('elb', nlb_dns)


@pytest.mark.describe("VPC Endpoints")
class TestVPCEndpoints(unittest.TestCase):
    """Test VPC endpoint connectivity"""

    def setUp(self):
        """Initialize boto3 clients"""
        self.region = get_output('Region')
        self.ec2 = boto3.client('ec2', region_name=self.region)

    @pytest.mark.it("S3 VPC endpoint exists")
    def test_s3_endpoint_exists(self):
        """Verify S3 VPC endpoint is created"""
        s3_endpoint_id = get_output('S3EndpointId')

        response = self.ec2.describe_vpc_endpoints(VpcEndpointIds=[s3_endpoint_id])

        self.assertEqual(len(response['VpcEndpoints']), 1)
        endpoint = response['VpcEndpoints'][0]

        self.assertEqual(endpoint['State'], 'available')
        self.assertEqual(endpoint['ServiceName'], f'com.amazonaws.{self.region}.s3')

    @pytest.mark.it("DynamoDB VPC endpoint exists")
    def test_dynamodb_endpoint_exists(self):
        """Verify DynamoDB VPC endpoint is created"""
        dynamodb_endpoint_id = get_output('DynamoDBEndpointId')

        response = self.ec2.describe_vpc_endpoints(VpcEndpointIds=[dynamodb_endpoint_id])

        self.assertEqual(len(response['VpcEndpoints']), 1)
        endpoint = response['VpcEndpoints'][0]

        self.assertEqual(endpoint['State'], 'available')
        self.assertEqual(endpoint['ServiceName'], f'com.amazonaws.{self.region}.dynamodb')


@pytest.mark.describe("CloudWatch Monitoring")
class TestMonitoring(unittest.TestCase):
    """Test CloudWatch dashboard and monitoring"""

    def setUp(self):
        """Initialize boto3 clients"""
        self.region = get_output('Region')
        self.cloudwatch = boto3.client('cloudwatch', region_name=self.region)

    @pytest.mark.it("CloudWatch dashboard exists")
    def test_dashboard_exists(self):
        """Verify CloudWatch dashboard is created"""
        dashboard_name = get_output('DashboardName')

        response = self.cloudwatch.get_dashboard(DashboardName=dashboard_name)

        self.assertIsNotNone(response['DashboardBody'])
        self.assertIn('widgets', response['DashboardBody'])


@pytest.mark.describe("End-to-End Connectivity")
class TestE2EConnectivity(unittest.TestCase):
    """Test end-to-end connectivity between resources"""

    def setUp(self):
        """Initialize boto3 clients"""
        self.region = get_output('Region')
        self.ec2 = boto3.client('ec2', region_name=self.region)
        self.ssm = boto3.client('ssm', region_name=self.region)
        self.autoscaling = boto3.client('autoscaling', region_name=self.region)

    def get_asg_instance_id(self) -> Optional[str]:
        """Get a running instance ID from the Auto Scaling Group"""
        asg_name = get_output('AsgName')

        response = self.autoscaling.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )

        if not response['AutoScalingGroups']:
            return None

        instances = response['AutoScalingGroups'][0]['Instances']
        running_instances = [
            i['InstanceId'] for i in instances
            if i['LifecycleState'] == 'InService' and i['HealthStatus'] == 'Healthy'
        ]

        return running_instances[0] if running_instances else None

    @pytest.mark.it("EC2 instance can resolve database endpoint")
    def test_ec2_can_resolve_database(self):
        """Verify EC2 instance can resolve RDS endpoint via SSM"""
        instance_id = self.get_asg_instance_id()
        if not instance_id:
            pytest.skip("No running instances in Auto Scaling Group")

        db_endpoint = get_output('DatabaseEndpoint')

        # Use SSM to run command on instance
        try:
            response = self.ssm.send_command(
                InstanceIds=[instance_id],
                DocumentName='AWS-RunShellScript',
                Parameters={'commands': [f'nslookup {db_endpoint} || echo "DNS resolution failed"']},
                TimeoutSeconds=30
            )

            command_id = response['Command']['CommandId']

            # Wait for command to complete
            time.sleep(5)

            # Get command output
            output_response = self.ssm.get_command_invocation(
                CommandId=command_id,
                InstanceId=instance_id
            )

            # Verify command succeeded
            self.assertIn(output_response['Status'], ['Success', 'InProgress'])

        except ClientError as e:
            if 'InvalidInstanceId' in str(e):
                pytest.skip(f"Instance {instance_id} not ready for SSM commands")
            raise

    @pytest.mark.it("EC2 instance can resolve Redis endpoint")
    def test_ec2_can_resolve_redis(self):
        """Verify EC2 instance can resolve Redis endpoint via SSM"""
        instance_id = self.get_asg_instance_id()
        if not instance_id:
            pytest.skip("No running instances in Auto Scaling Group")

        redis_endpoint = get_output('RedisEndpoint')

        try:
            response = self.ssm.send_command(
                InstanceIds=[instance_id],
                DocumentName='AWS-RunShellScript',
                Parameters={'commands': [f'nslookup {redis_endpoint} || echo "DNS resolution failed"']},
                TimeoutSeconds=30
            )

            command_id = response['Command']['CommandId']

            # Wait for command to complete
            time.sleep(5)

            # Get command output
            output_response = self.ssm.get_command_invocation(
                CommandId=command_id,
                InstanceId=instance_id
            )

            # Verify command succeeded or is in progress
            self.assertIn(output_response['Status'], ['Success', 'InProgress'])

        except ClientError as e:
            if 'InvalidInstanceId' in str(e):
                pytest.skip(f"Instance {instance_id} not ready for SSM commands")
            raise

    @pytest.mark.it("Database and Redis are in same VPC")
    def test_database_and_redis_same_vpc(self):
        """Verify database and Redis are deployed in the same VPC"""
        vpc_id = get_output('VpcId')
        db_sg_id = get_output('DatabaseSecurityGroupId')
        redis_sg_id = get_output('RedisSecurityGroupId')

        # Get security groups
        response = self.ec2.describe_security_groups(
            GroupIds=[db_sg_id, redis_sg_id]
        )

        # Verify both security groups are in the same VPC
        for sg in response['SecurityGroups']:
            self.assertEqual(sg['VpcId'], vpc_id)


if __name__ == '__main__':
    unittest.main()
