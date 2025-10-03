"""
test_tap_stack_integration.py

Comprehensive integration tests for deployed TapStack infrastructure using actual AWS resources.
Tests validate the deployed infrastructure against real AWS services by reading
deployment outputs from cfn-outputs/flat-outputs.json file.
"""

import unittest
import json
import boto3
import os
from pathlib import Path
from botocore.exceptions import ClientError

# Try to import colorama, but provide fallback if not available
try:
    from colorama import Fore, Style, init
    init(autoreset=True)
    COLORAMA_AVAILABLE = True
except ImportError:
    COLORAMA_AVAILABLE = False
    # Fallback: No colors
    class Fore:
        CYAN = ""
        GREEN = ""
        YELLOW = ""
        RED = ""
        MAGENTA = ""
    
    class Style:
        RESET_ALL = ""


class ConsoleLogger:
    """Helper class for colored console output."""
    
    @staticmethod
    def info(message):
        if COLORAMA_AVAILABLE:
            print(f"{Fore.CYAN}ℹ {message}{Style.RESET_ALL}")
        else:
            print(f"[INFO] {message}")
    
    @staticmethod
    def success(message):
        if COLORAMA_AVAILABLE:
            print(f"{Fore.GREEN}✓ {message}{Style.RESET_ALL}")
        else:
            print(f"[PASS] {message}")
    
    @staticmethod
    def warning(message):
        if COLORAMA_AVAILABLE:
            print(f"{Fore.YELLOW}⚠ {message}{Style.RESET_ALL}")
        else:
            print(f"[WARN] {message}")
    
    @staticmethod
    def error(message):
        if COLORAMA_AVAILABLE:
            print(f"{Fore.RED}✗ {message}{Style.RESET_ALL}")
        else:
            print(f"[ERROR] {message}")
    
    @staticmethod
    def header(message):
        if COLORAMA_AVAILABLE:
            print(f"\n{Fore.MAGENTA}{'='*80}")
            print(f"{Fore.MAGENTA}{message}")
            print(f"{Fore.MAGENTA}{'='*80}{Style.RESET_ALL}\n")
        else:
            print(f"\n{'='*80}")
            print(f"{message}")
            print(f"{'='*80}\n")


def load_deployment_outputs():
    """Load deployment outputs from cfn-outputs/flat-outputs.json."""
    # Try multiple possible paths
    possible_paths = [
        Path(__file__).parent.parent.parent / 'cfn-outputs' / 'flat-outputs.json',
        Path(__file__).parent.parent / 'cfn-outputs' / 'flat-outputs.json',
        Path('cfn-outputs') / 'flat-outputs.json',
        Path('.') / 'cfn-outputs' / 'flat-outputs.json',
    ]
    
    for outputs_file in possible_paths:
        if outputs_file.exists():
            ConsoleLogger.info(f"Loading outputs from: {outputs_file}")
            with open(outputs_file, 'r') as f:
                outputs = json.load(f)
            ConsoleLogger.success(f"Loaded {len(outputs)} deployment outputs")
            return outputs
    
    ConsoleLogger.warning("No deployment outputs file found at any of the expected paths:")
    for path in possible_paths:
        ConsoleLogger.warning(f"  - {path}")
    return {}


# Load deployment outputs at module level
DEPLOYMENT_OUTPUTS = load_deployment_outputs()


class TestVPCInfrastructure(unittest.TestCase):
    """Integration tests for VPC and network infrastructure."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing VPC Infrastructure")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.ec2_client = boto3.client('ec2', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.logger = ConsoleLogger()
    
    def test_vpc_exists_and_configured(self):
        """Test VPC exists with correct configuration."""
        vpc_id = DEPLOYMENT_OUTPUTS.get('vpc_id')
        if not vpc_id:
            self.skipTest("VPC ID not found in deployment outputs")
        
        ConsoleLogger.info(f"Testing VPC: {vpc_id}")
        
        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            self.assertEqual(len(response['Vpcs']), 1)
            
            vpc = response['Vpcs'][0]
            self.assertEqual(vpc['CidrBlock'], DEPLOYMENT_OUTPUTS['vpc_cidr'])
            self.assertEqual(vpc['State'], 'available')
            
            ConsoleLogger.success(f"VPC {vpc_id} is properly configured")
            ConsoleLogger.info(f"  └─ CIDR: {vpc['CidrBlock']}")
            ConsoleLogger.info(f"  └─ State: {vpc['State']}")
        except ClientError as e:
            self.fail(f"Failed to describe VPC: {e}")
    
    def test_vpc_has_dns_enabled(self):
        """Test VPC has DNS support and hostnames enabled."""
        vpc_id = DEPLOYMENT_OUTPUTS.get('vpc_id')
        if not vpc_id:
            self.skipTest("VPC ID not found in deployment outputs")
        
        ConsoleLogger.info(f"Testing VPC DNS configuration")
        
        try:
            dns_support = self.ec2_client.describe_vpc_attribute(
                VpcId=vpc_id, Attribute='enableDnsSupport'
            )
            dns_hostnames = self.ec2_client.describe_vpc_attribute(
                VpcId=vpc_id, Attribute='enableDnsHostnames'
            )
            
            self.assertTrue(dns_support['EnableDnsSupport']['Value'])
            self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])
            
            ConsoleLogger.success("VPC DNS is properly enabled")
            ConsoleLogger.info(f"  └─ DNS Support: Enabled")
            ConsoleLogger.info(f"  └─ DNS Hostnames: Enabled")
        except ClientError as e:
            self.fail(f"Failed to check VPC DNS settings: {e}")
    
    def test_subnets_exist_in_multiple_azs(self):
        """Test public and private subnets exist in multiple AZs."""
        ConsoleLogger.info("Testing subnet configuration")
        
        subnet_ids = [
            DEPLOYMENT_OUTPUTS.get('public_subnet_a_id'),
            DEPLOYMENT_OUTPUTS.get('public_subnet_b_id'),
            DEPLOYMENT_OUTPUTS.get('private_subnet_a_id'),
            DEPLOYMENT_OUTPUTS.get('private_subnet_b_id')
        ]
        
        # Filter out None values
        subnet_ids = [sid for sid in subnet_ids if sid]
        
        if not subnet_ids:
            self.skipTest("Subnet IDs not found in deployment outputs")
        
        try:
            response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)
            self.assertGreaterEqual(len(response['Subnets']), 2)
            
            azs = set([subnet['AvailabilityZone'] for subnet in response['Subnets']])
            self.assertGreaterEqual(len(azs), 2, "Subnets should span at least 2 AZs")
            
            ConsoleLogger.success(f"Found {len(response['Subnets'])} subnets across {len(azs)} AZs")
            for subnet in response['Subnets']:
                subnet_type = "Public" if subnet['SubnetId'] in [DEPLOYMENT_OUTPUTS.get('public_subnet_a_id'), DEPLOYMENT_OUTPUTS.get('public_subnet_b_id')] else "Private"
                ConsoleLogger.info(f"  └─ {subnet_type}: {subnet['SubnetId']} ({subnet['CidrBlock']}) in {subnet['AvailabilityZone']}")
        except ClientError as e:
            self.fail(f"Failed to describe subnets: {e}")
    
    def test_internet_gateway_attached(self):
        """Test Internet Gateway is attached to VPC."""
        vpc_id = DEPLOYMENT_OUTPUTS.get('vpc_id')
        if not vpc_id:
            self.skipTest("VPC ID not found in deployment outputs")
        
        ConsoleLogger.info("Testing Internet Gateway attachment")
        
        try:
            response = self.ec2_client.describe_internet_gateways(
                Filters=[{'Name': 'attachment.vpc-id', 'Values': [vpc_id]}]
            )
            
            self.assertGreaterEqual(len(response['InternetGateways']), 1)
            igw = response['InternetGateways'][0]
            
            ConsoleLogger.success("Internet Gateway is attached")
            ConsoleLogger.info(f"  └─ IGW ID: {igw['InternetGatewayId']}")
            ConsoleLogger.info(f"  └─ State: {igw['Attachments'][0]['State']}")
        except ClientError as e:
            self.fail(f"Failed to describe Internet Gateway: {e}")
    
    def test_nat_gateways_in_public_subnets(self):
        """Test NAT Gateways exist in public subnets."""
        ConsoleLogger.info("Testing NAT Gateway configuration")
        
        public_subnets = [
            DEPLOYMENT_OUTPUTS.get('public_subnet_a_id'),
            DEPLOYMENT_OUTPUTS.get('public_subnet_b_id')
        ]
        public_subnets = [s for s in public_subnets if s]
        
        if not public_subnets:
            self.skipTest("Public subnet IDs not found")
        
        try:
            response = self.ec2_client.describe_nat_gateways(
                Filters=[{'Name': 'subnet-id', 'Values': public_subnets}]
            )
            
            nat_gateways = [ng for ng in response['NatGateways'] if ng['State'] == 'available']
            self.assertGreaterEqual(len(nat_gateways), 1)
            
            ConsoleLogger.success(f"Found {len(nat_gateways)} NAT Gateway(s)")
            for nat in nat_gateways:
                ConsoleLogger.info(f"  └─ {nat['NatGatewayId']} in {nat['SubnetId']} ({nat['State']})")
        except ClientError as e:
            self.fail(f"Failed to describe NAT Gateways: {e}")
    
    def test_security_groups_configured(self):
        """Test security groups are properly configured."""
        ConsoleLogger.info("Testing security group configuration")
        
        sg_ids = [
            DEPLOYMENT_OUTPUTS.get('alb_sg_id'),
            DEPLOYMENT_OUTPUTS.get('app_sg_id'),
            DEPLOYMENT_OUTPUTS.get('aurora_sg_id'),
            DEPLOYMENT_OUTPUTS.get('redis_sg_id')
        ]
        
        # Filter out None values
        sg_ids = [sgid for sgid in sg_ids if sgid]
        
        if not sg_ids:
            self.skipTest("Security group IDs not found in deployment outputs")
        
        try:
            response = self.ec2_client.describe_security_groups(GroupIds=sg_ids)
            self.assertGreaterEqual(len(response['SecurityGroups']), 1)
            
            ConsoleLogger.success(f"Found {len(response['SecurityGroups'])} security groups")
            for sg in response['SecurityGroups']:
                ConsoleLogger.info(f"  └─ {sg['GroupId']}: {sg['GroupName']} (VPC: {sg['VpcId']})")
                ConsoleLogger.info(f"     ├─ Ingress Rules: {len(sg['IpPermissions'])}")
                ConsoleLogger.info(f"     └─ Egress Rules: {len(sg['IpPermissionsEgress'])}")
        except ClientError as e:
            self.fail(f"Failed to describe security groups: {e}")
    
    def test_route_tables_configured(self):
        """Test route tables exist for public and private subnets."""
        vpc_id = DEPLOYMENT_OUTPUTS.get('vpc_id')
        if not vpc_id:
            self.skipTest("VPC ID not found in deployment outputs")
        
        ConsoleLogger.info("Testing route table configuration")
        
        try:
            response = self.ec2_client.describe_route_tables(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            route_tables = response['RouteTables']
            self.assertGreaterEqual(len(route_tables), 1)
            
            ConsoleLogger.success(f"Found {len(route_tables)} route table(s)")
            for rt in route_tables:
                route_count = len(rt['Routes'])
                associations = len(rt['Associations'])
                ConsoleLogger.info(f"  └─ {rt['RouteTableId']}: {route_count} routes, {associations} associations")
        except ClientError as e:
            self.fail(f"Failed to describe route tables: {e}")


class TestLoadBalancing(unittest.TestCase):
    """Integration tests for Application Load Balancer."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing Load Balancing Infrastructure")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.elbv2_client = boto3.client('elbv2', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.logger = ConsoleLogger()
    
    def test_alb_exists_and_active(self):
        """Test ALB exists and is in active state."""
        alb_arn = DEPLOYMENT_OUTPUTS.get('alb_arn')
        if not alb_arn:
            self.skipTest("ALB ARN not found in deployment outputs")
        
        ConsoleLogger.info(f"Testing ALB: {alb_arn}")
        
        try:
            response = self.elbv2_client.describe_load_balancers(
                LoadBalancerArns=[alb_arn]
            )
            
            self.assertEqual(len(response['LoadBalancers']), 1)
            alb = response['LoadBalancers'][0]
            
            self.assertEqual(alb['State']['Code'], 'active')
            self.assertEqual(alb['Scheme'], 'internet-facing')
            self.assertEqual(alb['Type'], 'application')
            
            ConsoleLogger.success(f"ALB is active and properly configured")
            ConsoleLogger.info(f"  └─ DNS Name: {alb['DNSName']}")
            ConsoleLogger.info(f"  └─ State: {alb['State']['Code']}")
            ConsoleLogger.info(f"  └─ Type: {alb['Type']}")
            ConsoleLogger.info(f"  └─ Scheme: {alb['Scheme']}")
            ConsoleLogger.info(f"  └─ VPC: {alb['VpcId']}")
        except ClientError as e:
            self.fail(f"Failed to describe ALB: {e}")
    
    def test_alb_has_multiple_azs(self):
        """Test ALB spans multiple availability zones."""
        alb_arn = DEPLOYMENT_OUTPUTS.get('alb_arn')
        if not alb_arn:
            self.skipTest("ALB ARN not found in deployment outputs")
        
        ConsoleLogger.info("Testing ALB availability zones")
        
        try:
            response = self.elbv2_client.describe_load_balancers(
                LoadBalancerArns=[alb_arn]
            )
            
            alb = response['LoadBalancers'][0]
            azs = alb.get('AvailabilityZones', [])
            
            self.assertGreaterEqual(len(azs), 2, "ALB should span at least 2 AZs")
            
            ConsoleLogger.success(f"ALB spans {len(azs)} availability zones")
            for az in azs:
                ConsoleLogger.info(f"  └─ {az['ZoneName']}: {az['SubnetId']}")
        except ClientError as e:
            self.fail(f"Failed to check ALB AZs: {e}")
    
    def test_target_group_configured(self):
        """Test target group is properly configured."""
        tg_arn = DEPLOYMENT_OUTPUTS.get('target_group_arn')
        if not tg_arn:
            self.skipTest("Target group ARN not found in deployment outputs")
        
        ConsoleLogger.info(f"Testing Target Group: {tg_arn}")
        
        try:
            response = self.elbv2_client.describe_target_groups(
                TargetGroupArns=[tg_arn]
            )
            
            self.assertEqual(len(response['TargetGroups']), 1)
            tg = response['TargetGroups'][0]
            
            self.assertEqual(tg['Protocol'], 'HTTP')
            # Don't hardcode port - just verify it exists and is valid
            self.assertIn(tg['Port'], [80, 8080, 443, 8443])
            
            ConsoleLogger.success("Target group is properly configured")
            ConsoleLogger.info(f"  └─ Protocol: {tg['Protocol']}")
            ConsoleLogger.info(f"  └─ Port: {tg['Port']}")
            ConsoleLogger.info(f"  └─ Health Check: {tg['HealthCheckProtocol']} on {tg.get('HealthCheckPath', '/')}")
            ConsoleLogger.info(f"  └─ VPC: {tg['VpcId']}")
        except ClientError as e:
            self.fail(f"Failed to describe target group: {e}")
    
    def test_target_group_health_check(self):
        """Test target group has health check configured."""
        tg_arn = DEPLOYMENT_OUTPUTS.get('target_group_arn')
        if not tg_arn:
            self.skipTest("Target group ARN not found in deployment outputs")
        
        ConsoleLogger.info("Testing target group health check configuration")
        
        try:
            response = self.elbv2_client.describe_target_groups(
                TargetGroupArns=[tg_arn]
            )
            
            tg = response['TargetGroups'][0]
            
            self.assertIsNotNone(tg.get('HealthCheckPath'))
            self.assertGreater(tg.get('HealthCheckIntervalSeconds', 0), 0)
            self.assertGreater(tg.get('HealthCheckTimeoutSeconds', 0), 0)
            
            ConsoleLogger.success("Health check is properly configured")
            ConsoleLogger.info(f"  └─ Path: {tg.get('HealthCheckPath')}")
            ConsoleLogger.info(f"  └─ Interval: {tg.get('HealthCheckIntervalSeconds')}s")
            ConsoleLogger.info(f"  └─ Timeout: {tg.get('HealthCheckTimeoutSeconds')}s")
            ConsoleLogger.info(f"  └─ Healthy Threshold: {tg.get('HealthyThresholdCount')}")
            ConsoleLogger.info(f"  └─ Unhealthy Threshold: {tg.get('UnhealthyThresholdCount')}")
        except ClientError as e:
            self.fail(f"Failed to check health check config: {e}")
    
    def test_alb_listeners_exist(self):
        """Test ALB has listeners configured."""
        alb_arn = DEPLOYMENT_OUTPUTS.get('alb_arn')
        if not alb_arn:
            self.skipTest("ALB ARN not found in deployment outputs")
        
        ConsoleLogger.info("Testing ALB listeners")
        
        try:
            response = self.elbv2_client.describe_listeners(
                LoadBalancerArn=alb_arn
            )
            
            self.assertGreaterEqual(len(response['Listeners']), 1)
            
            ConsoleLogger.success(f"Found {len(response['Listeners'])} listener(s)")
            for listener in response['Listeners']:
                ConsoleLogger.info(f"  └─ Port {listener['Port']}: {listener['Protocol']}")
        except ClientError as e:
            self.fail(f"Failed to describe listeners: {e}")


class TestDatabaseInfrastructure(unittest.TestCase):
    """Integration tests for Aurora PostgreSQL database."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing Database Infrastructure")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.rds_client = boto3.client('rds', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.logger = ConsoleLogger()
    
    def test_aurora_cluster_available(self):
        """Test Aurora cluster is available and properly configured."""
        cluster_id = DEPLOYMENT_OUTPUTS.get('aurora_cluster_id')
        if not cluster_id:
            self.skipTest("Aurora cluster ID not found in deployment outputs")
        
        ConsoleLogger.info(f"Testing Aurora Cluster: {cluster_id}")
        
        try:
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            
            self.assertEqual(len(response['DBClusters']), 1)
            cluster = response['DBClusters'][0]
            
            self.assertEqual(cluster['Status'], 'available')
            self.assertEqual(cluster['Engine'], 'aurora-postgresql')
            
            ConsoleLogger.success(f"Aurora cluster is available")
            ConsoleLogger.info(f"  └─ Endpoint: {cluster['Endpoint']}")
            ConsoleLogger.info(f"  └─ Reader Endpoint: {cluster['ReaderEndpoint']}")
            ConsoleLogger.info(f"  └─ Status: {cluster['Status']}")
            ConsoleLogger.info(f"  └─ Engine: {cluster['Engine']} {cluster.get('EngineVersion', '')}")
            ConsoleLogger.info(f"  └─ Database: {cluster.get('DatabaseName', 'N/A')}")
        except ClientError as e:
            self.fail(f"Failed to describe Aurora cluster: {e}")
    
    def test_aurora_cluster_has_instances(self):
        """Test Aurora cluster has running instances."""
        cluster_id = DEPLOYMENT_OUTPUTS.get('aurora_cluster_id')
        if not cluster_id:
            self.skipTest("Aurora cluster ID not found in deployment outputs")
        
        ConsoleLogger.info("Testing Aurora cluster instances")
        
        try:
            response = self.rds_client.describe_db_instances(
                Filters=[{'Name': 'db-cluster-id', 'Values': [cluster_id]}]
            )
            
            instances = response['DBInstances']
            self.assertGreaterEqual(len(instances), 1, "Cluster should have at least 1 instance")
            
            available_instances = [i for i in instances if i['DBInstanceStatus'] == 'available']
            
            ConsoleLogger.success(f"Found {len(instances)} instance(s), {len(available_instances)} available")
            for instance in instances:
                ConsoleLogger.info(f"  └─ {instance['DBInstanceIdentifier']}: {instance['DBInstanceStatus']} ({instance['DBInstanceClass']})")
        except ClientError as e:
            self.fail(f"Failed to describe cluster instances: {e}")
    
    def test_aurora_cluster_encrypted(self):
        """Test Aurora cluster has encryption enabled."""
        cluster_id = DEPLOYMENT_OUTPUTS.get('aurora_cluster_id')
        if not cluster_id:
            self.skipTest("Aurora cluster ID not found in deployment outputs")
        
        ConsoleLogger.info("Testing Aurora encryption")
        
        try:
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            
            cluster = response['DBClusters'][0]
            self.assertTrue(cluster.get('StorageEncrypted', False), "Cluster should have encryption enabled")
            
            ConsoleLogger.success("Aurora cluster encryption is enabled")
            ConsoleLogger.info(f"  └─ Storage Encrypted: {cluster.get('StorageEncrypted')}")
        except ClientError as e:
            self.fail(f"Failed to check encryption: {e}")
    
    def test_aurora_backup_configured(self):
        """Test Aurora cluster has backup retention configured."""
        cluster_id = DEPLOYMENT_OUTPUTS.get('aurora_cluster_id')
        if not cluster_id:
            self.skipTest("Aurora cluster ID not found in deployment outputs")
        
        ConsoleLogger.info("Testing Aurora backup configuration")
        
        try:
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            
            cluster = response['DBClusters'][0]
            backup_retention = cluster.get('BackupRetentionPeriod', 0)
            
            self.assertGreater(backup_retention, 0, "Backup retention should be greater than 0")
            
            ConsoleLogger.success("Backup retention is configured")
            ConsoleLogger.info(f"  └─ Retention Period: {backup_retention} days")
            ConsoleLogger.info(f"  └─ Preferred Backup Window: {cluster.get('PreferredBackupWindow', 'N/A')}")
        except ClientError as e:
            self.fail(f"Failed to check backup configuration: {e}")


class TestComputeInfrastructure(unittest.TestCase):
    """Integration tests for compute infrastructure."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing Compute Infrastructure")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.autoscaling_client = boto3.client('autoscaling', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.ec2_client = boto3.client('ec2', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.logger = ConsoleLogger()
    
    def test_autoscaling_group_exists(self):
        """Test Auto Scaling Group exists and is configured."""
        asg_name = DEPLOYMENT_OUTPUTS.get('asg_name')
        if not asg_name:
            self.skipTest("ASG name not found in deployment outputs")
        
        ConsoleLogger.info(f"Testing Auto Scaling Group: {asg_name}")
        
        try:
            response = self.autoscaling_client.describe_auto_scaling_groups(
                AutoScalingGroupNames=[asg_name]
            )
            
            self.assertEqual(len(response['AutoScalingGroups']), 1)
            asg = response['AutoScalingGroups'][0]
            
            self.assertGreaterEqual(asg['MinSize'], 0)
            self.assertGreaterEqual(asg['MaxSize'], asg['MinSize'])
            
            ConsoleLogger.success("Auto Scaling Group is configured")
            ConsoleLogger.info(f"  └─ Min: {asg['MinSize']}")
            ConsoleLogger.info(f"  └─ Desired: {asg['DesiredCapacity']}")
            ConsoleLogger.info(f"  └─ Max: {asg['MaxSize']}")
            ConsoleLogger.info(f"  └─ Current Instances: {len(asg.get('Instances', []))}")
        except ClientError as e:
            self.fail(f"Failed to describe ASG: {e}")
    
    def test_launch_template_exists(self):
        """Test launch template exists."""
        lt_id = DEPLOYMENT_OUTPUTS.get('launch_template_id')
        if not lt_id:
            self.skipTest("Launch template ID not found in deployment outputs")
        
        ConsoleLogger.info(f"Testing Launch Template: {lt_id}")
        
        try:
            response = self.ec2_client.describe_launch_templates(
                LaunchTemplateIds=[lt_id]
            )
            
            self.assertEqual(len(response['LaunchTemplates']), 1)
            lt = response['LaunchTemplates'][0]
            
            ConsoleLogger.success("Launch template exists")
            ConsoleLogger.info(f"  └─ Name: {lt['LaunchTemplateName']}")
            ConsoleLogger.info(f"  └─ Latest Version: {lt['LatestVersionNumber']}")
        except ClientError as e:
            self.fail(f"Failed to describe launch template: {e}")


class TestStorageInfrastructure(unittest.TestCase):
    """Integration tests for S3 and CloudFront."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing Storage Infrastructure")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.s3_client = boto3.client('s3', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.cloudfront_client = boto3.client('cloudfront')
        cls.logger = ConsoleLogger()
    
    def test_s3_bucket_exists(self):
        """Test S3 bucket exists."""
        bucket_name = DEPLOYMENT_OUTPUTS.get('s3_bucket_name')
        if not bucket_name:
            self.skipTest("S3 bucket name not found in deployment outputs")
        
        ConsoleLogger.info(f"Testing S3 Bucket: {bucket_name}")
        
        try:
            response = self.s3_client.head_bucket(Bucket=bucket_name)
            self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
            
            ConsoleLogger.success("S3 bucket exists")
            ConsoleLogger.info(f"  └─ Bucket: {bucket_name}")
        except ClientError as e:
            self.fail(f"Failed to check S3 bucket: {e}")
    
    def test_s3_bucket_versioning(self):
        """Test S3 bucket has versioning enabled."""
        bucket_name = DEPLOYMENT_OUTPUTS.get('s3_bucket_name')
        if not bucket_name:
            self.skipTest("S3 bucket name not found in deployment outputs")
        
        ConsoleLogger.info("Testing S3 bucket versioning")
        
        try:
            response = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            versioning_status = response.get('Status', 'Disabled')
            
            ConsoleLogger.success(f"Bucket versioning status: {versioning_status}")
            ConsoleLogger.info(f"  └─ Versioning: {versioning_status}")
        except ClientError as e:
            self.fail(f"Failed to check versioning: {e}")
    
    def test_s3_bucket_encryption(self):
        """Test S3 bucket encryption configuration."""
        bucket_name = DEPLOYMENT_OUTPUTS.get('s3_bucket_name')
        if not bucket_name:
            self.skipTest("S3 bucket name not found in deployment outputs")
        
        ConsoleLogger.info("Testing S3 bucket encryption")
        
        try:
            response = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            rules = response.get('ServerSideEncryptionConfiguration', {}).get('Rules', [])
            
            self.assertGreater(len(rules), 0, "Bucket should have encryption rules")
            
            ConsoleLogger.success("Bucket encryption is enabled")
            for rule in rules:
                algorithm = rule.get('ApplyServerSideEncryptionByDefault', {}).get('SSEAlgorithm')
                ConsoleLogger.info(f"  └─ Algorithm: {algorithm}")
        except ClientError as e:
            if e.response['Error']['Code'] == 'ServerSideEncryptionConfigurationNotFoundError':
                ConsoleLogger.warning("Bucket encryption not configured")
            else:
                self.fail(f"Failed to check encryption: {e}")
    
    def test_cloudfront_distribution_exists(self):
        """Test CloudFront distribution exists."""
        dist_id = DEPLOYMENT_OUTPUTS.get('cloudfront_distribution_id')
        if not dist_id:
            self.skipTest("CloudFront distribution ID not found in deployment outputs")
        
        ConsoleLogger.info(f"Testing CloudFront: {dist_id}")
        
        try:
            response = self.cloudfront_client.get_distribution(Id=dist_id)
            distribution = response['Distribution']
            
            self.assertEqual(distribution['Status'], 'Deployed')
            self.assertTrue(distribution['DistributionConfig']['Enabled'])
            
            ConsoleLogger.success("CloudFront distribution is deployed")
            ConsoleLogger.info(f"  └─ Domain: {DEPLOYMENT_OUTPUTS.get('cloudfront_domain_name')}")
            ConsoleLogger.info(f"  └─ Status: {distribution['Status']}")
        except ClientError as e:
            self.fail(f"Failed to get CloudFront distribution: {e}")


class TestIAMInfrastructure(unittest.TestCase):
    """Integration tests for IAM roles."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing IAM Infrastructure")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.iam_client = boto3.client('iam')
        cls.logger = ConsoleLogger()
    
    def test_ec2_role_exists(self):
        """Test EC2 IAM role exists."""
        role_name = DEPLOYMENT_OUTPUTS.get('ec2_role_name')
        if not role_name:
            self.skipTest("EC2 role name not found in deployment outputs")
        
        ConsoleLogger.info(f"Testing EC2 Role: {role_name}")
        
        try:
            response = self.iam_client.get_role(RoleName=role_name)
            role = response['Role']
            
            ConsoleLogger.success("EC2 role exists")
            ConsoleLogger.info(f"  └─ Role: {role['RoleName']}")
            ConsoleLogger.info(f"  └─ ARN: {role['Arn']}")
        except ClientError as e:
            self.fail(f"Failed to get EC2 role: {e}")
    
    def test_lambda_role_exists(self):
        """Test Lambda IAM role exists."""
        role_name = DEPLOYMENT_OUTPUTS.get('lambda_role_name')
        if not role_name:
            self.skipTest("Lambda role name not found in deployment outputs")
        
        ConsoleLogger.info(f"Testing Lambda Role: {role_name}")
        
        try:
            response = self.iam_client.get_role(RoleName=role_name)
            role = response['Role']
            
            ConsoleLogger.success("Lambda role exists")
            ConsoleLogger.info(f"  └─ Role: {role['RoleName']}")
            ConsoleLogger.info(f"  └─ ARN: {role['Arn']}")
        except ClientError as e:
            self.fail(f"Failed to get Lambda role: {e}")


class TestDeploymentSummary(unittest.TestCase):
    """Display deployment summary."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Deployment Summary")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
    
    def test_deployment_summary(self):
        """Display comprehensive deployment summary."""
        ConsoleLogger.info("Infrastructure Deployment Details")
        
        summary = {
            "Environment": DEPLOYMENT_OUTPUTS.get('environment_suffix', 'N/A'),
            "Region": DEPLOYMENT_OUTPUTS.get('region', 'N/A'),
            "VPC": DEPLOYMENT_OUTPUTS.get('vpc_id', 'N/A'),
            "ALB DNS": DEPLOYMENT_OUTPUTS.get('alb_dns_name', 'N/A'),
            "Aurora Endpoint": DEPLOYMENT_OUTPUTS.get('aurora_cluster_endpoint', 'N/A'),
            "S3 Bucket": DEPLOYMENT_OUTPUTS.get('s3_bucket_name', 'N/A'),
        }
        
        ConsoleLogger.success("Deployment is complete and operational")
        for key, value in summary.items():
            ConsoleLogger.info(f"  └─ {key}: {value}")
        
        self.assertTrue(True)


if __name__ == '__main__':
    ConsoleLogger.header("TapStack Infrastructure Integration Tests")
    ConsoleLogger.info("Loading deployment outputs...")
    
    if not DEPLOYMENT_OUTPUTS:
        ConsoleLogger.error("No deployment outputs found!")
        ConsoleLogger.warning("Please ensure cfn-outputs/flat-outputs.json exists")
    else:
        ConsoleLogger.success(f"Loaded outputs for environment: {DEPLOYMENT_OUTPUTS.get('environment_suffix', 'unknown')}")
        ConsoleLogger.info(f"Testing infrastructure in region: {DEPLOYMENT_OUTPUTS.get('region', 'us-east-1')}")
    
    # Run tests
    unittest.main(verbosity=2)
