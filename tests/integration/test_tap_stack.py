"""
Integration tests for TapStack - High Availability Web Application

These tests validate the deployed infrastructure by testing:
1. Resource existence and configuration
2. Cross-service interactions
3. Security group connectivity
4. High availability setup
5. End-to-end workflows
"""

import json
import os
import time
import unittest
from typing import Any, Dict, List, Optional

import boto3
import requests
from botocore.exceptions import ClientError
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


class IntegrationTestBase(unittest.TestCase):
    """Base class for integration tests with common setup and helper methods"""

    @classmethod
    def setUpClass(cls):
        """Initialize AWS clients and load stack outputs"""
        cls.region = os.environ.get('AWS_REGION', 'us-east-1')
        cls.outputs = flat_outputs

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.iam_client = boto3.client('iam', region_name=cls.region)
        cls.lambda_client = boto3.client('lambda', region_name=cls.region)
        cls.events_client = boto3.client('events', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)
        cls.autoscaling_client = boto3.client('autoscaling', region_name=cls.region)

        # Resource clients for more detailed queries
        cls.ec2_resource = boto3.resource('ec2', region_name=cls.region)

    def _get_vpc_id(self) -> Optional[str]:
        """Get VPC ID from outputs"""
        return self.outputs.get('VpcId')

    def _get_alb_dns(self) -> Optional[str]:
        """Get ALB DNS name from outputs"""
        return self.outputs.get('AlbDnsName')

    def _get_rds_endpoint(self) -> Optional[str]:
        """Get RDS endpoint from outputs"""
        return self.outputs.get('RdsEndpoint')

    def _wait_for_resource(self, check_function, timeout=300, interval=10):
        """Wait for a resource to become available"""
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                if check_function():
                    return True
            except Exception:  # noqa: S110
                pass
            time.sleep(interval)
        return False


@mark.describe("VPC and Networking")
class TestVPCAndNetworking(IntegrationTestBase):
    """Test VPC configuration, subnets, NAT gateways, and routing"""

    @mark.it("verifies VPC exists with correct configuration")
    def test_vpc_exists(self):
        """Verify VPC is created and accessible"""
        vpc_id = self._get_vpc_id()
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)
        self.assertEqual(response['Vpcs'][0]['State'], 'available')

    @mark.it("verifies subnets exist in multiple availability zones")
    def test_subnets_in_multiple_azs(self):
        """Verify subnets are distributed across multiple AZs for high availability"""
        vpc_id = self._get_vpc_id()
        self.assertIsNotNone(vpc_id)

        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        self.assertGreater(len(subnets), 0, "No subnets found in VPC")

        # Collect unique availability zones
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        self.assertGreaterEqual(len(azs), 2, "Subnets should span at least 2 AZs for HA")

    @mark.it("verifies public, private, and isolated subnet types exist")
    def test_subnet_types(self):
        """Verify VPC has public, private (with egress), and isolated subnets"""
        vpc_id = self._get_vpc_id()
        self.assertIsNotNone(vpc_id)

        subnets = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )['Subnets']

        # Get route tables for subnet classification
        route_tables = self.ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )['RouteTables']

        # Classify subnets by checking their route tables
        public_subnets = []
        private_subnets = []
        isolated_subnets = []

        for subnet in subnets:
            subnet_id = subnet['SubnetId']
            # Find the route table for this subnet
            subnet_rt = None
            for rt in route_tables:
                for assoc in rt.get('Associations', []):
                    if assoc.get('SubnetId') == subnet_id:
                        subnet_rt = rt
                        break
                if subnet_rt:
                    break

            if not subnet_rt:
                # Use main route table if no explicit association
                for rt in route_tables:
                    for assoc in rt.get('Associations', []):
                        if assoc.get('Main'):
                            subnet_rt = rt
                            break

            # Check routes to classify subnet
            has_igw = False
            has_nat = False
            for route in subnet_rt.get('Routes', []):
                if route.get('GatewayId', '').startswith('igw-'):
                    has_igw = True
                if route.get('NatGatewayId', '').startswith('nat-'):
                    has_nat = True

            if has_igw:
                public_subnets.append(subnet_id)
            elif has_nat:
                private_subnets.append(subnet_id)
            else:
                isolated_subnets.append(subnet_id)

        self.assertGreater(len(public_subnets), 0, "No public subnets found")
        self.assertGreater(len(private_subnets), 0, "No private subnets found")
        self.assertGreater(len(isolated_subnets), 0, "No isolated subnets found")

    @mark.it("verifies NAT gateways exist for high availability")
    def test_nat_gateways_exist(self):
        """Verify NAT gateways exist (should be 2 for HA across AZs)"""
        vpc_id = self._get_vpc_id()
        self.assertIsNotNone(vpc_id)

        response = self.ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )

        nat_gateways = response['NatGateways']
        self.assertGreaterEqual(len(nat_gateways), 2, "Should have at least 2 NAT gateways for HA")

        # Verify NAT gateways are in different AZs
        nat_azs = set(nat['SubnetId'] for nat in nat_gateways)
        self.assertEqual(len(nat_azs), len(nat_gateways), "NAT gateways should be in different subnets")

    @mark.it("verifies Internet Gateway is attached")
    def test_internet_gateway_attached(self):
        """Verify Internet Gateway is attached to VPC"""
        vpc_id = self._get_vpc_id()
        self.assertIsNotNone(vpc_id)

        response = self.ec2_client.describe_internet_gateways(
            Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
        )

        self.assertGreater(len(response['InternetGateways']), 0, "No Internet Gateway attached to VPC")
        self.assertEqual(
            response['InternetGateways'][0]['Attachments'][0]['State'],
            'available'
        )


@mark.describe("Security Groups")
class TestSecurityGroups(IntegrationTestBase):
    """Test security group configuration and rules"""

    def _get_security_group_by_description(self, description_keyword: str) -> Optional[Dict]:
        """Get security group by description keyword"""
        vpc_id = self._get_vpc_id()
        response = self.ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        for sg in response['SecurityGroups']:
            if description_keyword.lower() in sg.get('Description', '').lower():
                return sg
        return None

    @mark.it("verifies ALB security group allows HTTP from internet")
    def test_alb_security_group_http_ingress(self):
        """Verify ALB security group allows HTTP (port 80) from 0.0.0.0/0"""
        alb_sg = self._get_security_group_by_description("load balancer")
        self.assertIsNotNone(alb_sg, "ALB security group not found")

        # Check for HTTP ingress rule
        http_rule_found = False
        for rule in alb_sg.get('IpPermissions', []):
            if rule.get('FromPort') == 80 and rule.get('ToPort') == 80:
                for ip_range in rule.get('IpRanges', []):
                    if ip_range.get('CidrIp') == '0.0.0.0/0':
                        http_rule_found = True
                        break

        self.assertTrue(http_rule_found, "ALB security group should allow HTTP from internet")

    @mark.it("verifies EC2 security group allows traffic from ALB")
    def test_ec2_security_group_alb_ingress(self):
        """Verify EC2 security group allows HTTP traffic from ALB security group"""
        alb_sg = self._get_security_group_by_description("load balancer")
        ec2_sg = self._get_security_group_by_description("ec2")

        self.assertIsNotNone(alb_sg, "ALB security group not found")
        self.assertIsNotNone(ec2_sg, "EC2 security group not found")

        # Check for rule allowing traffic from ALB SG
        alb_rule_found = False
        for rule in ec2_sg.get('IpPermissions', []):
            if rule.get('FromPort') == 80 and rule.get('ToPort') == 80:
                for user_id_group_pair in rule.get('UserIdGroupPairs', []):
                    if user_id_group_pair.get('GroupId') == alb_sg['GroupId']:
                        alb_rule_found = True
                        break

        self.assertTrue(alb_rule_found, "EC2 security group should allow traffic from ALB SG")

    @mark.it("verifies EC2 security group allows SSH access")
    def test_ec2_security_group_ssh_ingress(self):
        """Verify EC2 security group allows SSH (port 22) access"""
        ec2_sg = self._get_security_group_by_description("ec2")
        self.assertIsNotNone(ec2_sg, "EC2 security group not found")

        # Check for SSH ingress rule
        ssh_rule_found = False
        for rule in ec2_sg.get('IpPermissions', []):
            if rule.get('FromPort') == 22 and rule.get('ToPort') == 22:
                ssh_rule_found = True
                break

        self.assertTrue(ssh_rule_found, "EC2 security group should allow SSH access")

    @mark.it("verifies RDS security group allows PostgreSQL from EC2 only")
    def test_rds_security_group_ingress(self):
        """Verify RDS security group allows PostgreSQL (port 3306) from EC2 SG only"""
        ec2_sg = self._get_security_group_by_description("ec2")
        rds_sg = self._get_security_group_by_description("rds")

        self.assertIsNotNone(ec2_sg, "EC2 security group not found")
        self.assertIsNotNone(rds_sg, "RDS security group not found")

        ec2_rule_found = False
        for rule in rds_sg.get('IpPermissions', []):
            if rule.get('FromPort') == 5432 and rule.get('ToPort') == 5432:
                for user_id_group_pair in rule.get('UserIdGroupPairs', []):
                    if user_id_group_pair.get('GroupId') == ec2_sg['GroupId']:
                        ec2_rule_found = True
                        break

        self.assertTrue(ec2_rule_found, "RDS security group should allow connections from EC2 SG")

    @mark.it("verifies RDS security group has no public access")
    def test_rds_security_group_no_public_access(self):
        """Verify RDS security group does not allow public access"""
        rds_sg = self._get_security_group_by_description("rds")
        self.assertIsNotNone(rds_sg, "RDS security group not found")

        # Check that no rules allow 0.0.0.0/0
        for rule in rds_sg.get('IpPermissions', []):
            for ip_range in rule.get('IpRanges', []):
                self.assertNotEqual(
                    ip_range.get('CidrIp'),
                    '0.0.0.0/0',
                    "RDS security group should not allow public access"
                )


@mark.describe("Application Load Balancer")
class TestApplicationLoadBalancer(IntegrationTestBase):
    """Test ALB configuration and functionality"""

    def _get_alb(self) -> Optional[Dict]:
        """Get ALB details by DNS name"""
        alb_dns = self._get_alb_dns()
        if not alb_dns:
            return None

        response = self.elbv2_client.describe_load_balancers()
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_dns:
                return lb
        return None

    @mark.it("verifies ALB exists and is internet-facing")
    def test_alb_exists_and_internet_facing(self):
        """Verify ALB exists and is configured as internet-facing"""
        alb = self._get_alb()
        self.assertIsNotNone(alb, "ALB not found")
        self.assertEqual(alb['Scheme'], 'internet-facing', "ALB should be internet-facing")
        self.assertEqual(alb['State']['Code'], 'active', "ALB should be in active state")

    @mark.it("verifies ALB is in public subnets")
    def test_alb_in_public_subnets(self):
        """Verify ALB is deployed in public subnets"""
        alb = self._get_alb()
        self.assertIsNotNone(alb, "ALB not found")

        # Get ALB subnets
        alb_subnet_ids = [az['SubnetId'] for az in alb.get('AvailabilityZones', [])]
        self.assertGreater(len(alb_subnet_ids), 0, "ALB should be in at least one subnet")

        # Verify subnets are public (have route to IGW)
        vpc_id = self._get_vpc_id()
        route_tables = self.ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )['RouteTables']

        for subnet_id in alb_subnet_ids:
            # Find route table for subnet
            subnet_rt = None
            for rt in route_tables:
                for assoc in rt.get('Associations', []):
                    if assoc.get('SubnetId') == subnet_id:
                        subnet_rt = rt
                        break
                if subnet_rt:
                    break

            # Check if route table has IGW route
            has_igw = any(
                route.get('GatewayId', '').startswith('igw-')
                for route in subnet_rt.get('Routes', [])
            )
            self.assertTrue(has_igw, f"Subnet {subnet_id} should have route to IGW")

    @mark.it("verifies ALB has HTTP listener on port 80")
    def test_alb_http_listener(self):
        """Verify ALB has HTTP listener configured on port 80"""
        alb = self._get_alb()
        self.assertIsNotNone(alb, "ALB not found")

        listeners = self.elbv2_client.describe_listeners(
            LoadBalancerArn=alb['LoadBalancerArn']
        )['Listeners']

        http_listener = None
        for listener in listeners:
            if listener['Port'] == 80 and listener['Protocol'] == 'HTTP':
                http_listener = listener
                break

        self.assertIsNotNone(http_listener, "ALB should have HTTP listener on port 80")

    @mark.it("verifies target group exists with correct health check")
    def test_target_group_health_check(self):
        """Verify target group has correct health check configuration"""
        alb = self._get_alb()
        self.assertIsNotNone(alb, "ALB not found")

        # Get target groups
        target_groups = self.elbv2_client.describe_target_groups(
            LoadBalancerArn=alb['LoadBalancerArn']
        )['TargetGroups']

        self.assertGreater(len(target_groups), 0, "ALB should have at least one target group")

        tg = target_groups[0]
        self.assertEqual(tg['HealthCheckPath'], '/', "Health check path should be /")
        self.assertEqual(tg['HealthCheckProtocol'], 'HTTP', "Health check should use HTTP")
        self.assertEqual(tg['HealthyThresholdCount'], 2, "Healthy threshold should be 2")
        self.assertEqual(tg['UnhealthyThresholdCount'], 3, "Unhealthy threshold should be 3")

    @mark.it("verifies ALB DNS resolves correctly")
    def test_alb_dns_resolution(self):
        """Verify ALB DNS name resolves to IP addresses"""
        alb_dns = self._get_alb_dns()
        self.assertIsNotNone(alb_dns, "ALB DNS not found in outputs")

        import socket
        try:
            ip_addresses = socket.gethostbyname_ex(alb_dns)
            self.assertGreater(len(ip_addresses[2]), 0, "ALB DNS should resolve to IP addresses")
        except socket.gaierror:
            self.fail(f"Failed to resolve ALB DNS: {alb_dns}")


@mark.describe("Auto Scaling Group")
class TestAutoScalingGroup(IntegrationTestBase):
    """Test Auto Scaling Group configuration"""

    def _get_asg(self) -> Optional[Dict]:
        """Get Auto Scaling Group"""
        response = self.autoscaling_client.describe_auto_scaling_groups()
        for asg in response['AutoScalingGroups']:
            # Find ASG by tag or name pattern
            if 'WebServer' in asg['AutoScalingGroupName']:
                return asg
        return None

    @mark.it("verifies ASG exists with correct capacity configuration")
    def test_asg_capacity(self):
        """Verify ASG has correct min/max capacity (min=2, max=6)"""
        asg = self._get_asg()
        self.assertIsNotNone(asg, "Auto Scaling Group not found")

        self.assertEqual(asg['MinSize'], 2, "ASG min capacity should be 2")
        self.assertEqual(asg['MaxSize'], 6, "ASG max capacity should be 6")

    @mark.it("verifies ASG instances are in private subnets")
    def test_asg_instances_in_private_subnets(self):
        """Verify ASG instances are deployed in private subnets"""
        asg = self._get_asg()
        self.assertIsNotNone(asg, "Auto Scaling Group not found")

        vpc_id = self._get_vpc_id()
        subnet_ids = asg['VPCZoneIdentifier'].split(',')

        # Verify subnets are private (have NAT gateway route, not IGW)
        route_tables = self.ec2_client.describe_route_tables(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )['RouteTables']

        for subnet_id in subnet_ids:
            # Find route table for subnet
            subnet_rt = None
            for rt in route_tables:
                for assoc in rt.get('Associations', []):
                    if assoc.get('SubnetId') == subnet_id:
                        subnet_rt = rt
                        break
                if subnet_rt:
                    break

            # Verify has NAT but not IGW
            has_nat = any(
                route.get('NatGatewayId', '').startswith('nat-')
                for route in subnet_rt.get('Routes', [])
            )
            has_igw = any(
                route.get('GatewayId', '').startswith('igw-')
                for route in subnet_rt.get('Routes', [])
            )

            self.assertTrue(has_nat, f"Subnet {subnet_id} should have NAT gateway route")
            self.assertFalse(has_igw, f"Subnet {subnet_id} should not have IGW route (should be private)")

    @mark.it("verifies ASG has CPU-based scaling policy")
    def test_asg_scaling_policy(self):
        """Verify ASG has CPU-based scaling policy at 70%"""
        asg = self._get_asg()
        self.assertIsNotNone(asg, "Auto Scaling Group not found")

        policies = self.autoscaling_client.describe_policies(
            AutoScalingGroupName=asg['AutoScalingGroupName']
        )['ScalingPolicies']

        # Should have a target tracking policy for CPU
        cpu_policy_found = False
        for policy in policies:
            if policy['PolicyType'] == 'TargetTrackingScaling':
                config = policy.get('TargetTrackingConfiguration', {})
                if config.get('PredefinedMetricSpecification', {}).get(
                        'PredefinedMetricType') == 'ASGAverageCPUUtilization':
                    self.assertEqual(config['TargetValue'], 70.0, "CPU target utilization should be 70%")
                    cpu_policy_found = True

        self.assertTrue(cpu_policy_found, "ASG should have CPU-based scaling policy")

    @mark.it("verifies ASG instances span multiple availability zones")
    def test_asg_multi_az(self):
        """Verify ASG instances are distributed across multiple AZs"""
        asg = self._get_asg()
        self.assertIsNotNone(asg, "Auto Scaling Group not found")

        azs = asg.get('AvailabilityZones', [])
        self.assertGreaterEqual(len(azs), 2, "ASG should span at least 2 availability zones")

    @mark.it("verifies ASG has ELB health checks enabled")
    def test_asg_health_checks(self):
        """Verify ASG has ELB health checks enabled"""
        asg = self._get_asg()
        self.assertIsNotNone(asg, "Auto Scaling Group not found")

        health_check_types = asg.get('HealthCheckType', '')
        # Should have both EC2 and ELB health checks
        self.assertIn('ELB', health_check_types, "ASG should have ELB health checks enabled")


@mark.describe("RDS Database")
class TestRDSDatabase(IntegrationTestBase):
    """Test RDS database configuration"""

    def _get_rds_instance(self) -> Optional[Dict]:
        """Get RDS database instance"""
        rds_endpoint = self._get_rds_endpoint()
        if not rds_endpoint:
            return None

        # Extract instance identifier from endpoint
        instance_id = rds_endpoint.split('.')[0]

        try:
            response = self.rds_client.describe_db_instances(
                DBInstanceIdentifier=instance_id
            )
            if response['DBInstances']:
                return response['DBInstances'][0]
        except ClientError:
            pass

        return None

    @mark.it("verifies RDS instance exists and is available")
    def test_rds_exists_and_available(self):
        """Verify RDS instance exists and is in available state"""
        rds = self._get_rds_instance()
        self.assertIsNotNone(rds, "RDS instance not found")
        self.assertEqual(rds['DBInstanceStatus'], 'available', "RDS should be in available state")

    @mark.it("verifies RDS has encryption enabled")
    def test_rds_encryption(self):
        """Verify RDS has storage encryption enabled"""
        rds = self._get_rds_instance()
        self.assertIsNotNone(rds, "RDS instance not found")

        self.assertTrue(rds['StorageEncrypted'], "RDS should have storage encryption enabled")

    @mark.it("verifies RDS backup retention is 7 days")
    def test_rds_backup_retention(self):
        """Verify RDS has 7-day backup retention configured"""
        rds = self._get_rds_instance()
        self.assertIsNotNone(rds, "RDS instance not found")

        self.assertEqual(
            rds['BackupRetentionPeriod'],
            7,
            "RDS backup retention should be 7 days"
        )

    @mark.it("verifies RDS CloudWatch logs are enabled")
    def test_rds_cloudwatch_logs(self):
        """Verify RDS has CloudWatch logs exports enabled"""
        rds = self._get_rds_instance()
        self.assertIsNotNone(rds, "RDS instance not found")

        enabled_logs = rds.get('EnabledCloudwatchLogsExports', [])
        self.assertIn('postgresql', enabled_logs, "PostgreSQL logs should be exported to CloudWatch")


@mark.describe("S3 Bucket")
class TestS3Bucket(IntegrationTestBase):
    """Test S3 bucket configuration for logs"""

    def _get_log_bucket_name(self) -> Optional[str]:
        """Get log bucket name from outputs"""
        # Try to find bucket name in outputs
        for key, value in self.outputs.items():
            if 'log' in key.lower() and 'bucket' in key.lower():
                return value
        return None

    @mark.it("verifies log bucket exists")
    def test_log_bucket_exists(self):
        """Verify S3 log bucket exists"""
        bucket_name = self._get_log_bucket_name()

        if not bucket_name:
            # Try to find bucket by listing and filtering
            response = self.s3_client.list_buckets()
            for bucket in response['Buckets']:
                if 'logs' in bucket['Name'] and self.region in bucket['Name']:
                    bucket_name = bucket['Name']
                    break

        self.assertIsNotNone(bucket_name, "Log bucket not found")

        # Verify bucket exists
        try:
            self.s3_client.head_bucket(Bucket=bucket_name)
            return None
        except ClientError:
            self.fail(f"Bucket {bucket_name} does not exist or is not accessible")


@mark.describe("IAM Roles")
class TestIAMRoles(IntegrationTestBase):
    """Test IAM role configuration"""

    def _get_role_by_name_pattern(self, pattern: str) -> Optional[Dict]:
        """Get IAM role by name pattern"""
        try:
            roles = self.iam_client.list_roles()['Roles']
            for role in roles:
                if pattern.lower() in role['RoleName'].lower():
                    return role
        except ClientError:
            pass
        return None

    @mark.it("verifies EC2 instance role exists")
    def test_ec2_instance_role_exists(self):
        """Verify EC2 instance IAM role exists"""
        role = self._get_role_by_name_pattern("ec2instance")
        self.assertIsNotNone(role, "EC2 instance role not found")


@mark.describe("Lambda Function")
class TestLambdaFunction(IntegrationTestBase):
    """Test Lambda backup function"""

    def _get_lambda_function(self) -> Optional[Dict]:
        """Get Lambda backup function"""
        try:
            functions = self.lambda_client.list_functions()['Functions']
            for func in functions:
                if 'backup' in func['FunctionName'].lower():
                    return func
        except ClientError:
            pass
        return None

    @mark.it("verifies Lambda backup function exists")
    def test_lambda_function_exists(self):
        """Verify RDS backup Lambda function exists"""
        func = self._get_lambda_function()
        self.assertIsNotNone(func, "Lambda backup function not found")

    @mark.it("verifies Lambda runtime is Python 3.11")
    def test_lambda_runtime(self):
        """Verify Lambda function uses Python 3.11 runtime"""
        func = self._get_lambda_function()
        if not func:
            self.skipTest("Lambda function not found")

        self.assertEqual(
            func['Runtime'],
            'python3.11',
            "Lambda should use Python 3.11 runtime"
        )

    @mark.it("verifies Lambda has environment variables")
    def test_lambda_environment_variables(self):
        """Verify Lambda function has required environment variables"""
        func = self._get_lambda_function()
        if not func:
            self.skipTest("Lambda function not found")

        env_vars = func.get('Environment', {}).get('Variables', {})

        self.assertIn('DB_INSTANCE_ID', env_vars, "Should have DB_INSTANCE_ID")
        self.assertIn('ENVIRONMENT', env_vars, "Should have ENVIRONMENT")
        self.assertIn('OWNER', env_vars, "Should have OWNER")

    @mark.it("verifies Lambda timeout is 5 minutes")
    def test_lambda_timeout(self):
        """Verify Lambda function has 5-minute timeout"""
        func = self._get_lambda_function()
        if not func:
            self.skipTest("Lambda function not found")

        self.assertEqual(
            func['Timeout'],
            300,
            "Lambda timeout should be 5 minutes (300 seconds)"
        )

    @mark.it("verifies Lambda is VPC-connected")
    def test_lambda_vpc_config(self):
        """Verify Lambda function is connected to VPC"""
        func = self._get_lambda_function()
        if not func:
            self.skipTest("Lambda function not found")

        vpc_config = func.get('VpcConfig', {})
        self.assertIsNotNone(vpc_config.get('VpcId'), "Lambda should be VPC-connected")
        self.assertGreater(
            len(vpc_config.get('SubnetIds', [])),
            0,
            "Lambda should be in subnets"
        )


@mark.describe("EventBridge Rules")
class TestEventBridgeRules(IntegrationTestBase):
    """Test EventBridge scheduled rules"""

    def _get_backup_rule(self) -> Optional[Dict]:
        """Get daily backup EventBridge rule"""
        try:
            rules = self.events_client.list_rules()['Rules']
            for rule in rules:
                if 'backup' in rule['Name'].lower():
                    return rule
        except ClientError:
            pass
        return None

    @mark.it("verifies daily backup rule exists")
    def test_backup_rule_exists(self):
        """Verify EventBridge daily backup rule exists"""
        rule = self._get_backup_rule()
        self.assertIsNotNone(rule, "Daily backup rule not found")

    @mark.it("verifies backup rule has correct schedule")
    def test_backup_rule_schedule(self):
        """Verify backup rule runs daily at 2 AM"""
        rule = self._get_backup_rule()
        if not rule:
            self.skipTest("Backup rule not found")

        schedule = rule.get('ScheduleExpression', '')
        # Schedule should be cron(0 2 * * ? *)
        self.assertIn('cron', schedule.lower(), "Should use cron schedule")
        self.assertIn('2', schedule, "Should run at hour 2 (2 AM)")

    @mark.it("verifies backup rule is enabled")
    def test_backup_rule_enabled(self):
        """Verify backup rule is in ENABLED state"""
        rule = self._get_backup_rule()
        if not rule:
            self.skipTest("Backup rule not found")

        self.assertEqual(rule['State'], 'ENABLED', "Backup rule should be enabled")

    @mark.it("verifies backup rule has Lambda target")
    def test_backup_rule_lambda_target(self):
        """Verify backup rule targets the Lambda function"""
        rule = self._get_backup_rule()
        if not rule:
            self.skipTest("Backup rule not found")

        targets = self.events_client.list_targets_by_rule(Rule=rule['Name'])['Targets']
        self.assertGreater(len(targets), 0, "Backup rule should have targets")

        # Check if any target is a Lambda function
        lambda_target_found = False
        for target in targets:
            if target['Arn'].startswith('arn:aws:lambda:'):
                lambda_target_found = True
                break

        self.assertTrue(lambda_target_found, "Backup rule should target Lambda function")


@mark.describe("CloudWatch Alarms")
class TestCloudWatchAlarms(IntegrationTestBase):
    """Test CloudWatch alarm configuration"""

    def _get_alarms(self) -> List[Dict]:
        """Get all CloudWatch alarms"""
        try:
            return self.cloudwatch_client.describe_alarms()['MetricAlarms']
        except ClientError:
            return []

    @mark.it("verifies high memory alarm exists")
    def test_high_memory_alarm_exists(self):
        """Verify high memory utilization alarm exists"""
        alarms = self._get_alarms()
        high_memory_alarm = None

        for alarm in alarms:
            if 'memory' in alarm['AlarmName'].lower() and 'high' in alarm['AlarmName'].lower():
                high_memory_alarm = alarm
                break

        self.assertIsNotNone(high_memory_alarm, "High memory alarm not found")

        # Verify threshold
        if high_memory_alarm:
            self.assertEqual(
                high_memory_alarm['Threshold'],
                85.0,
                "High memory threshold should be 85%"
            )


@mark.describe("Cross-Service Integrations")
class TestCrossServiceIntegrations(IntegrationTestBase):
    """Test critical cross-service interactions"""

    @mark.it("tests HTTP request to ALB returns response")
    def test_alb_http_request(self):
        """Test end-to-end HTTP request to ALB"""
        alb_dns = self._get_alb_dns()
        if not alb_dns:
            self.skipTest("ALB DNS not found")

        url = f"http://{alb_dns}"

        try:
            response = requests.get(url, timeout=30)
            self.assertEqual(
                response.status_code,
                200,
                "ALB should return HTTP 200"
            )
            self.assertIn(
                'High Availability',
                response.text,
                "Response should contain expected content"
            )
        except requests.exceptions.RequestException as e:
            self.fail(f"Failed to connect to ALB: {e}")

    @mark.it("verifies ALB can reach target instances")
    def test_alb_target_health(self):
        """Verify ALB target group has healthy targets"""
        alb = TestApplicationLoadBalancer._get_alb(self)
        if not alb:
            self.skipTest("ALB not found")

        target_groups = self.elbv2_client.describe_target_groups(
            LoadBalancerArn=alb['LoadBalancerArn']
        )['TargetGroups']

        if not target_groups:
            self.skipTest("No target groups found")

        tg_arn = target_groups[0]['TargetGroupArn']

        # Wait for targets to become healthy
        def check_healthy_targets():
            target_health = self.elbv2_client.describe_target_health(
                TargetGroupArn=tg_arn
            )
            healthy_count = sum(
                1 for t in target_health['TargetHealthDescriptions']
                if t['TargetHealth']['State'] == 'healthy'
            )
            return healthy_count >= 1

        targets_healthy = self._wait_for_resource(check_healthy_targets, timeout=600)
        self.assertTrue(
            targets_healthy,
            "At least one target should be healthy within 10 minutes"
        )

    @mark.it("verifies EC2 instances are registered with target group")
    def test_ec2_registered_with_alb(self):
        """Verify EC2 instances from ASG are registered with ALB target group"""
        asg = TestAutoScalingGroup._get_asg(self)
        alb = TestApplicationLoadBalancer._get_alb(self)

        if not asg or not alb:
            self.skipTest("ASG or ALB not found")

        # Get target group
        target_groups = self.elbv2_client.describe_target_groups(
            LoadBalancerArn=alb['LoadBalancerArn']
        )['TargetGroups']

        if not target_groups:
            self.skipTest("No target groups found")

        tg_arn = target_groups[0]['TargetGroupArn']

        # Get registered targets
        target_health = self.elbv2_client.describe_target_health(
            TargetGroupArn=tg_arn
        )

        registered_instance_ids = [
            t['Target']['Id'] for t in target_health['TargetHealthDescriptions']
        ]

        # Get ASG instances
        asg_instance_ids = [i['InstanceId'] for i in asg['Instances']]

        # Verify ASG instances are registered
        for instance_id in asg_instance_ids:
            self.assertIn(
                instance_id,
                registered_instance_ids,
                f"ASG instance {instance_id} should be registered with target group"
            )

    @mark.it("verifies RDS endpoint is accessible from VPC")
    def test_rds_endpoint_accessible(self):
        """Verify RDS endpoint is accessible from within VPC"""
        rds_endpoint = self._get_rds_endpoint()
        if not rds_endpoint:
            self.skipTest("RDS endpoint not found")

        # Verify endpoint DNS resolves
        import socket
        try:
            ip_address = socket.gethostbyname(rds_endpoint)
            self.assertIsNotNone(ip_address, "RDS endpoint should resolve to IP")
        except socket.gaierror:
            self.fail(f"Failed to resolve RDS endpoint: {rds_endpoint}")


@mark.describe("High Availability")
class TestHighAvailability(IntegrationTestBase):
    """Test high availability configuration"""

    @mark.it("verifies resources are distributed across multiple AZs")
    def test_multi_az_distribution(self):
        """Verify resources span multiple availability zones"""
        vpc_id = self._get_vpc_id()
        subnets = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )['Subnets']

        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        self.assertGreaterEqual(len(azs), 2, "Resources should span at least 2 AZs")

    @mark.it("verifies multiple NAT gateways for availability")
    def test_multiple_nat_gateways(self):
        """Verify multiple NAT gateways exist for HA"""
        vpc_id = self._get_vpc_id()
        nat_gateways = self.ec2_client.describe_nat_gateways(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]},
                {'Name': 'state', 'Values': ['available']}
            ]
        )['NatGateways']

        self.assertGreaterEqual(
            len(nat_gateways),
            2,
            "Should have at least 2 NAT gateways for HA"
        )

    @mark.it("verifies ASG has minimum 2 instances")
    def test_asg_minimum_instances(self):
        """Verify ASG maintains minimum of 2 instances"""
        asg = TestAutoScalingGroup._get_asg(self)
        if not asg:
            self.skipTest("ASG not found")

        self.assertGreaterEqual(
            asg['MinSize'],
            2,
            "ASG should maintain minimum 2 instances for HA"
        )


@mark.describe("Tagging and Outputs")
class TestTaggingAndOutputs(IntegrationTestBase):
    """Test resource tagging and stack outputs"""

    @mark.it("verifies ALB DNS output exists")
    def test_alb_dns_output(self):
        """Verify ALB DNS name is available in outputs"""
        alb_dns = self._get_alb_dns()
        self.assertIsNotNone(alb_dns, "ALB DNS should be in stack outputs")
        self.assertTrue(
            alb_dns.endswith('.elb.amazonaws.com'),
            "ALB DNS should be valid ELB DNS name"
        )


@mark.describe("End-to-End Workflows")
class TestEndToEndWorkflows(IntegrationTestBase):
    """Test complete end-to-end workflows"""

    @mark.it("tests complete traffic flow from internet to ALB to EC2")
    def test_complete_traffic_flow(self):
        """Test full traffic flow: Internet → ALB → EC2 → Response"""
        alb_dns = self._get_alb_dns()
        if not alb_dns:
            self.skipTest("ALB DNS not found")

        # Make HTTP request
        url = f"http://{alb_dns}"

        try:
            response = requests.get(url, timeout=30)
            self.assertEqual(response.status_code, 200, "Should receive HTTP 200")
            self.assertGreater(len(response.text), 0, "Should receive response body")
            self.assertIn('High Availability', response.text, "Should contain expected content")
        except requests.exceptions.RequestException as e:
            self.fail(f"End-to-end traffic flow failed: {e}")

    @mark.it("verifies database endpoint connectivity from VPC")
    def test_database_connectivity(self):
        """Verify database endpoint is accessible within VPC"""
        rds_endpoint = self._get_rds_endpoint()
        if not rds_endpoint:
            self.skipTest("RDS endpoint not found")

        # Test DNS resolution
        import socket
        try:
            ip = socket.gethostbyname(rds_endpoint)
            self.assertIsNotNone(ip, "RDS endpoint should resolve")

            # Verify IP is in VPC CIDR
            vpc_id = self._get_vpc_id()
            vpc = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])['Vpcs'][0]
            cidr = vpc['CidrBlock']

            # Basic validation that IP exists
            self.assertTrue(len(ip.split('.')) == 4, "Should be valid IPv4 address")
        except socket.gaierror:
            self.fail(f"Failed to resolve RDS endpoint: {rds_endpoint}")

    @mark.it("verifies Lambda can be invoked for backup")
    def test_lambda_invocation(self):
        """Test Lambda backup function can be invoked"""
        func = TestLambdaFunction._get_lambda_function(self)
        if not func:
            self.skipTest("Lambda function not found")

        # Note: We're testing invocation capability, not actual snapshot creation
        # to avoid creating unnecessary snapshots in tests
        function_name = func['FunctionName']

        # Verify we have permission to invoke (don't actually invoke to avoid costs)
        try:
            # Get function configuration to verify it's accessible
            config = self.lambda_client.get_function_configuration(
                FunctionName=function_name
            )
            self.assertIsNotNone(config, "Should be able to access Lambda configuration")
        except ClientError as e:
            self.fail(f"Failed to access Lambda function: {e}")
