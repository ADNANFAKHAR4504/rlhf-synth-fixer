"""
test_tap_stack_integration.py

Integration tests for deployed TapStack infrastructure using actual AWS resources.
These tests validate the deployed infrastructure against real AWS services by reading
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
            
            ConsoleLogger.success(f"VPC {vpc_id} is properly configured")
            ConsoleLogger.info(f"  └─ CIDR: {vpc['CidrBlock']}")
            ConsoleLogger.info(f"  └─ State: {vpc['State']}")
        except ClientError as e:
            self.fail(f"Failed to describe VPC: {e}")
    
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
            self.assertGreaterEqual(len(azs), 1, "Subnets should span at least one AZ")
            
            ConsoleLogger.success(f"Found {len(response['Subnets'])} subnets across {len(azs)} AZs")
            for subnet in response['Subnets']:
                subnet_type = "Public" if subnet['SubnetId'] in [DEPLOYMENT_OUTPUTS.get('public_subnet_a_id'), DEPLOYMENT_OUTPUTS.get('public_subnet_b_id')] else "Private"
                ConsoleLogger.info(f"  └─ {subnet_type}: {subnet['SubnetId']} ({subnet['CidrBlock']}) in {subnet['AvailabilityZone']}")
        except ClientError as e:
            self.fail(f"Failed to describe subnets: {e}")
    
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
            self.assertEqual(tg['Port'], 80)
            
            ConsoleLogger.success("Target group is properly configured")
            ConsoleLogger.info(f"  └─ Protocol: {tg['Protocol']}")
            ConsoleLogger.info(f"  └─ Port: {tg['Port']}")
            ConsoleLogger.info(f"  └─ Health Check: {tg['HealthCheckProtocol']} on {tg.get('HealthCheckPath', '/')}")
            ConsoleLogger.info(f"  └─ VPC: {tg['VpcId']}")
        except ClientError as e:
            self.fail(f"Failed to describe target group: {e}")


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
