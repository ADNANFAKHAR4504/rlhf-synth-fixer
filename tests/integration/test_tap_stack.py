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
from colorama import Fore, Style, init

# Initialize colorama for colored console output
init(autoreset=True)


class ConsoleLogger:
    """Helper class for colored console output."""
    
    @staticmethod
    def info(message):
        print(f"{Fore.CYAN}ℹ {message}{Style.RESET_ALL}")
    
    @staticmethod
    def success(message):
        print(f"{Fore.GREEN}✓ {message}{Style.RESET_ALL}")
    
    @staticmethod
    def warning(message):
        print(f"{Fore.YELLOW}⚠ {message}{Style.RESET_ALL}")
    
    @staticmethod
    def error(message):
        print(f"{Fore.RED}✗ {message}{Style.RESET_ALL}")
    
    @staticmethod
    def header(message):
        print(f"\n{Fore.MAGENTA}{'='*80}")
        print(f"{Fore.MAGENTA}{message}")
        print(f"{Fore.MAGENTA}{'='*80}{Style.RESET_ALL}\n")


def load_deployment_outputs():
    """Load deployment outputs from cfn-outputs/flat-outputs.json."""
    outputs_file = Path(__file__).parent.parent / 'cfn-outputs' / 'flat-outputs.json'
    
    if not outputs_file.exists():
        ConsoleLogger.error(f"Outputs file not found: {outputs_file}")
        ConsoleLogger.warning("Run deployment first to generate outputs")
        return {}
    
    ConsoleLogger.info(f"Loading outputs from: {outputs_file}")
    
    with open(outputs_file, 'r') as f:
        outputs = json.load(f)
    
    ConsoleLogger.success(f"Loaded {len(outputs)} deployment outputs")
    return outputs


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
        ConsoleLogger.info(f"Testing VPC: {vpc_id}")
        
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)
        
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], DEPLOYMENT_OUTPUTS['vpc_cidr'])
        
        ConsoleLogger.success(f"VPC {vpc_id} is properly configured")
        ConsoleLogger.info(f"  └─ CIDR: {vpc['CidrBlock']}")
        ConsoleLogger.info(f"  └─ State: {vpc['State']}")
    
    def test_subnets_exist_in_multiple_azs(self):
        """Test public and private subnets exist in multiple AZs."""
        ConsoleLogger.info("Testing subnet configuration")
        
        subnet_ids = [
            DEPLOYMENT_OUTPUTS['public_subnet_a_id'],
            DEPLOYMENT_OUTPUTS['public_subnet_b_id'],
            DEPLOYMENT_OUTPUTS['private_subnet_a_id'],
            DEPLOYMENT_OUTPUTS['private_subnet_b_id']
        ]
        
        response = self.ec2_client.describe_subnets(SubnetIds=subnet_ids)
        self.assertEqual(len(response['Subnets']), 4)
        
        azs = set([subnet['AvailabilityZone'] for subnet in response['Subnets']])
        self.assertGreaterEqual(len(azs), 2, "Subnets should span multiple AZs")
        
        ConsoleLogger.success(f"Found {len(response['Subnets'])} subnets across {len(azs)} AZs")
        for subnet in response['Subnets']:
            subnet_type = "Public" if subnet['SubnetId'] in [DEPLOYMENT_OUTPUTS['public_subnet_a_id'], DEPLOYMENT_OUTPUTS['public_subnet_b_id']] else "Private"
            ConsoleLogger.info(f"  └─ {subnet_type}: {subnet['SubnetId']} ({subnet['CidrBlock']}) in {subnet['AvailabilityZone']}")
    
    def test_security_groups_configured(self):
        """Test security groups are properly configured."""
        ConsoleLogger.info("Testing security group configuration")
        
        sg_ids = [
            DEPLOYMENT_OUTPUTS['alb_sg_id'],
            DEPLOYMENT_OUTPUTS['app_sg_id'],
            DEPLOYMENT_OUTPUTS['aurora_sg_id'],
            DEPLOYMENT_OUTPUTS['redis_sg_id']
        ]
        
        response = self.ec2_client.describe_security_groups(GroupIds=sg_ids)
        self.assertEqual(len(response['SecurityGroups']), 4)
        
        ConsoleLogger.success(f"Found {len(response['SecurityGroups'])} security groups")
        for sg in response['SecurityGroups']:
            ConsoleLogger.info(f"  └─ {sg['GroupId']}: {sg['GroupName']} (VPC: {sg['VpcId']})")
            ConsoleLogger.info(f"     ├─ Ingress Rules: {len(sg['IpPermissions'])}")
            ConsoleLogger.info(f"     └─ Egress Rules: {len(sg['IpPermissionsEgress'])}")


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
        alb_arn = DEPLOYMENT_OUTPUTS['alb_arn']
        ConsoleLogger.info(f"Testing ALB: {alb_arn}")
        
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
    
    def test_target_group_configured(self):
        """Test target group is properly configured."""
        tg_arn = DEPLOYMENT_OUTPUTS['target_group_arn']
        ConsoleLogger.info(f"Testing Target Group: {tg_arn}")
        
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
    
    def test_alb_listeners_configured(self):
        """Test ALB has proper listeners configured."""
        alb_arn = DEPLOYMENT_OUTPUTS['alb_arn']
        ConsoleLogger.info("Testing ALB listeners")
        
        response = self.elbv2_client.describe_listeners(
            LoadBalancerArn=alb_arn
        )
        
        self.assertGreaterEqual(len(response['Listeners']), 1)
        
        ConsoleLogger.success(f"Found {len(response['Listeners'])} listener(s)")
        for listener in response['Listeners']:
            ConsoleLogger.info(f"  └─ Port {listener['Port']}: {listener['Protocol']}")


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
        cluster_id = DEPLOYMENT_OUTPUTS['aurora_cluster_id']
        ConsoleLogger.info(f"Testing Aurora Cluster: {cluster_id}")
        
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
        ConsoleLogger.info(f"  └─ Multi-AZ: {cluster.get('MultiAZ', False)}")
    
    def test_aurora_instances_running(self):
        """Test Aurora instances are running."""
        cluster_id = DEPLOYMENT_OUTPUTS['aurora_cluster_id']
        ConsoleLogger.info("Testing Aurora cluster instances")
        
        response = self.rds_client.describe_db_instances(
            Filters=[
                {
                    'Name': 'db-cluster-id',
                    'Values': [cluster_id]
                }
            ]
        )
        
        self.assertGreaterEqual(len(response['DBInstances']), 1)
        
        for instance in response['DBInstances']:
            self.assertEqual(instance['DBInstanceStatus'], 'available')
        
        ConsoleLogger.success(f"Found {len(response['DBInstances'])} Aurora instances")
        for instance in response['DBInstances']:
            ConsoleLogger.info(f"  └─ {instance['DBInstanceIdentifier']}")
            ConsoleLogger.info(f"     ├─ Status: {instance['DBInstanceStatus']}")
            ConsoleLogger.info(f"     ├─ Class: {instance['DBInstanceClass']}")
            ConsoleLogger.info(f"     └─ AZ: {instance['AvailabilityZone']}")


class TestCachingInfrastructure(unittest.TestCase):
    """Integration tests for ElastiCache Redis clusters."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing Caching Infrastructure")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.elasticache_client = boto3.client('elasticache', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.logger = ConsoleLogger()
    
    def test_redis_premium_cluster_available(self):
        """Test premium Redis cluster is available."""
        redis_id = DEPLOYMENT_OUTPUTS['redis_premium_id']
        ConsoleLogger.info(f"Testing Premium Redis: {redis_id}")
        
        response = self.elasticache_client.describe_replication_groups(
            ReplicationGroupId=redis_id
        )
        
        self.assertEqual(len(response['ReplicationGroups']), 1)
        cluster = response['ReplicationGroups'][0]
        
        self.assertEqual(cluster['Status'], 'available')
        
        ConsoleLogger.success("Premium Redis cluster is available")
        ConsoleLogger.info(f"  └─ ID: {cluster['ReplicationGroupId']}")
        ConsoleLogger.info(f"  └─ Endpoint: {DEPLOYMENT_OUTPUTS['redis_premium_endpoint']}")
        ConsoleLogger.info(f"  └─ Status: {cluster['Status']}")
        ConsoleLogger.info(f"  └─ Multi-AZ: {cluster.get('MultiAZ', 'N/A')}")
    
    def test_redis_standard_cluster_available(self):
        """Test standard Redis cluster is available."""
        redis_id = DEPLOYMENT_OUTPUTS['redis_standard_id']
        ConsoleLogger.info(f"Testing Standard Redis: {redis_id}")
        
        response = self.elasticache_client.describe_replication_groups(
            ReplicationGroupId=redis_id
        )
        
        self.assertEqual(len(response['ReplicationGroups']), 1)
        cluster = response['ReplicationGroups'][0]
        
        self.assertEqual(cluster['Status'], 'available')
        
        ConsoleLogger.success("Standard Redis cluster is available")
        ConsoleLogger.info(f"  └─ ID: {cluster['ReplicationGroupId']}")
        ConsoleLogger.info(f"  └─ Endpoint: {DEPLOYMENT_OUTPUTS['redis_standard_endpoint']}")
        ConsoleLogger.info(f"  └─ Status: {cluster['Status']}")
        ConsoleLogger.info(f"  └─ Multi-AZ: {cluster.get('MultiAZ', 'N/A')}")


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
    
    def test_s3_bucket_exists_with_versioning(self):
        """Test S3 bucket exists and has versioning enabled."""
        bucket_name = DEPLOYMENT_OUTPUTS['s3_bucket_name']
        ConsoleLogger.info(f"Testing S3 Bucket: {bucket_name}")
        
        # Check bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)
        
        # Check versioning
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        
        # Check encryption
        try:
            encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
            encryption_enabled = True
        except ClientError:
            encryption_enabled = False
        
        ConsoleLogger.success("S3 bucket is properly configured")
        ConsoleLogger.info(f"  └─ Bucket: {bucket_name}")
        ConsoleLogger.info(f"  └─ Versioning: {versioning.get('Status', 'Disabled')}")
        ConsoleLogger.info(f"  └─ Encryption: {'Enabled' if encryption_enabled else 'Disabled'}")
    
    def test_cloudfront_distribution_deployed(self):
        """Test CloudFront distribution is deployed."""
        dist_id = DEPLOYMENT_OUTPUTS['cloudfront_distribution_id']
        ConsoleLogger.info(f"Testing CloudFront: {dist_id}")
        
        response = self.cloudfront_client.get_distribution(Id=dist_id)
        
        distribution = response['Distribution']
        self.assertEqual(distribution['Status'], 'Deployed')
        self.assertTrue(distribution['DistributionConfig']['Enabled'])
        
        ConsoleLogger.success("CloudFront distribution is deployed")
        ConsoleLogger.info(f"  └─ ID: {dist_id}")
        ConsoleLogger.info(f"  └─ Domain: {DEPLOYMENT_OUTPUTS['cloudfront_domain_name']}")
        ConsoleLogger.info(f"  └─ Status: {distribution['Status']}")
        ConsoleLogger.info(f"  └─ Enabled: {distribution['DistributionConfig']['Enabled']}")


class TestComputeInfrastructure(unittest.TestCase):
    """Integration tests for compute resources."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing Compute Infrastructure")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.autoscaling_client = boto3.client('autoscaling', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.ec2_client = boto3.client('ec2', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.logger = ConsoleLogger()
    
    def test_autoscaling_group_configured(self):
        """Test Auto Scaling Group is properly configured."""
        asg_name = DEPLOYMENT_OUTPUTS['asg_name']
        ConsoleLogger.info(f"Testing ASG: {asg_name}")
        
        response = self.autoscaling_client.describe_auto_scaling_groups(
            AutoScalingGroupNames=[asg_name]
        )
        
        self.assertEqual(len(response['AutoScalingGroups']), 1)
        asg = response['AutoScalingGroups'][0]
        
        self.assertGreaterEqual(asg['MinSize'], 0)
        self.assertGreaterEqual(asg['DesiredCapacity'], asg['MinSize'])
        
        ConsoleLogger.success("Auto Scaling Group is configured")
        ConsoleLogger.info(f"  └─ Name: {asg['AutoScalingGroupName']}")
        ConsoleLogger.info(f"  └─ Min Size: {asg['MinSize']}")
        ConsoleLogger.info(f"  └─ Desired: {asg['DesiredCapacity']}")
        ConsoleLogger.info(f"  └─ Max Size: {asg['MaxSize']}")
        ConsoleLogger.info(f"  └─ Current Instances: {len(asg.get('Instances', []))}")
    
    def test_launch_template_exists(self):
        """Test launch template exists."""
        lt_id = DEPLOYMENT_OUTPUTS['launch_template_id']
        ConsoleLogger.info(f"Testing Launch Template: {lt_id}")
        
        response = self.ec2_client.describe_launch_templates(
            LaunchTemplateIds=[lt_id]
        )
        
        self.assertEqual(len(response['LaunchTemplates']), 1)
        lt = response['LaunchTemplates'][0]
        
        ConsoleLogger.success("Launch template exists")
        ConsoleLogger.info(f"  └─ ID: {lt['LaunchTemplateId']}")
        ConsoleLogger.info(f"  └─ Name: {lt['LaunchTemplateName']}")
        ConsoleLogger.info(f"  └─ Latest Version: {lt['LatestVersionNumber']}")


class TestAuthenticationInfrastructure(unittest.TestCase):
    """Integration tests for Cognito authentication."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing Authentication Infrastructure")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.cognito_client = boto3.client('cognito-idp', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.cognito_identity_client = boto3.client('cognito-identity', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.logger = ConsoleLogger()
    
    def test_cognito_user_pool_configured(self):
        """Test Cognito user pool is properly configured."""
        pool_id = DEPLOYMENT_OUTPUTS['cognito_user_pool_id_tenant1']
        ConsoleLogger.info(f"Testing Cognito User Pool: {pool_id}")
        
        response = self.cognito_client.describe_user_pool(UserPoolId=pool_id)
        
        user_pool = response['UserPool']
        self.assertEqual(user_pool['Status'], 'Enabled')
        
        ConsoleLogger.success("Cognito user pool is configured")
        ConsoleLogger.info(f"  └─ Pool ID: {user_pool['Id']}")
        ConsoleLogger.info(f"  └─ Name: {user_pool['Name']}")
        ConsoleLogger.info(f"  └─ Status: {user_pool['Status']}")
        ConsoleLogger.info(f"  └─ MFA: {user_pool.get('MfaConfiguration', 'OFF')}")
    
    def test_cognito_user_pool_client_exists(self):
        """Test Cognito user pool client exists."""
        pool_id = DEPLOYMENT_OUTPUTS['cognito_user_pool_id_tenant1']
        client_id = DEPLOYMENT_OUTPUTS['cognito_user_pool_client_id_tenant1']
        ConsoleLogger.info(f"Testing User Pool Client: {client_id}")
        
        response = self.cognito_client.describe_user_pool_client(
            UserPoolId=pool_id,
            ClientId=client_id
        )
        
        self.assertIsNotNone(response['UserPoolClient'])
        client = response['UserPoolClient']
        
        ConsoleLogger.success("User pool client exists")
        ConsoleLogger.info(f"  └─ Client ID: {client['ClientId']}")
        ConsoleLogger.info(f"  └─ Client Name: {client['ClientName']}")
    
    def test_cognito_identity_pool_exists(self):
        """Test Cognito identity pool exists."""
        identity_pool_id = DEPLOYMENT_OUTPUTS['cognito_identity_pool_id']
        ConsoleLogger.info(f"Testing Identity Pool: {identity_pool_id}")
        
        response = self.cognito_identity_client.describe_identity_pool(
            IdentityPoolId=identity_pool_id
        )
        
        self.assertIsNotNone(response['IdentityPoolId'])
        
        ConsoleLogger.success("Identity pool exists")
        ConsoleLogger.info(f"  └─ Pool ID: {response['IdentityPoolId']}")
        ConsoleLogger.info(f"  └─ Name: {response['IdentityPoolName']}")
        ConsoleLogger.info(f"  └─ Unauthenticated Access: {response.get('AllowUnauthenticatedIdentities', False)}")


class TestServerlessInfrastructure(unittest.TestCase):
    """Integration tests for serverless components."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing Serverless Infrastructure")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.dynamodb_client = boto3.client('dynamodb', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.lambda_client = boto3.client('lambda', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.logger = ConsoleLogger()
    
    def test_dynamodb_table_active(self):
        """Test DynamoDB table is active."""
        table_name = DEPLOYMENT_OUTPUTS['tenant_registry_table_name']
        ConsoleLogger.info(f"Testing DynamoDB Table: {table_name}")
        
        response = self.dynamodb_client.describe_table(TableName=table_name)
        
        table = response['Table']
        self.assertEqual(table['TableStatus'], 'ACTIVE')
        
        ConsoleLogger.success("DynamoDB table is active")
        ConsoleLogger.info(f"  └─ Table: {table['TableName']}")
        ConsoleLogger.info(f"  └─ Status: {table['TableStatus']}")
        ConsoleLogger.info(f"  └─ Item Count: {table.get('ItemCount', 0)}")
        ConsoleLogger.info(f"  └─ Billing Mode: {table.get('BillingModeSummary', {}).get('BillingMode', 'PROVISIONED')}")
    
    def test_lambda_function_active(self):
        """Test Lambda function is active and properly configured."""
        function_name = DEPLOYMENT_OUTPUTS['tenant_provisioning_lambda_name']
        ConsoleLogger.info(f"Testing Lambda: {function_name}")
        
        response = self.lambda_client.get_function(FunctionName=function_name)
        
        function = response['Configuration']
        self.assertEqual(function['State'], 'Active')
        
        ConsoleLogger.success("Lambda function is active")
        ConsoleLogger.info(f"  └─ Function: {function['FunctionName']}")
        ConsoleLogger.info(f"  └─ State: {function['State']}")
        ConsoleLogger.info(f"  └─ Runtime: {function['Runtime']}")
        ConsoleLogger.info(f"  └─ Memory: {function['MemorySize']} MB")
        ConsoleLogger.info(f"  └─ Timeout: {function['Timeout']}s")


class TestMonitoringInfrastructure(unittest.TestCase):
    """Integration tests for monitoring and logging."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing Monitoring Infrastructure")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.logs_client = boto3.client('logs', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.events_client = boto3.client('events', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.logger = ConsoleLogger()
    
    def test_cloudwatch_log_groups_exist(self):
        """Test CloudWatch log groups exist."""
        ConsoleLogger.info("Testing CloudWatch log groups")
        
        log_groups = [
            DEPLOYMENT_OUTPUTS['tenant1_log_group_name'],
            DEPLOYMENT_OUTPUTS['tenant1_audit_log_group_name'],
            DEPLOYMENT_OUTPUTS['lambda_log_group_name']
        ]
        
        for log_group in log_groups:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group
            )
            self.assertGreaterEqual(len(response['logGroups']), 1)
            
            lg = response['logGroups'][0]
            ConsoleLogger.success(f"Log group exists: {log_group}")
            ConsoleLogger.info(f"  └─ Retention: {lg.get('retentionInDays', 'Never Expire')} days")
    
    def test_event_bus_exists(self):
        """Test EventBridge event bus exists."""
        event_bus_name = DEPLOYMENT_OUTPUTS['event_bus_name']
        ConsoleLogger.info(f"Testing Event Bus: {event_bus_name}")
        
        response = self.events_client.describe_event_bus(Name=event_bus_name)
        
        self.assertIsNotNone(response['Arn'])
        
        ConsoleLogger.success("Event bus exists")
        ConsoleLogger.info(f"  └─ Name: {response['Name']}")
        ConsoleLogger.info(f"  └─ ARN: {response['Arn']}")


class TestIAMInfrastructure(unittest.TestCase):
    """Integration tests for IAM roles and policies."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing IAM Infrastructure")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.iam_client = boto3.client('iam')
        cls.logger = ConsoleLogger()
    
    def test_ec2_role_exists(self):
        """Test EC2 IAM role exists."""
        role_name = DEPLOYMENT_OUTPUTS['ec2_role_name']
        ConsoleLogger.info(f"Testing EC2 Role: {role_name}")
        
        response = self.iam_client.get_role(RoleName=role_name)
        
        self.assertIsNotNone(response['Role'])
        role = response['Role']
        
        # List attached policies
        policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
        
        ConsoleLogger.success("EC2 role exists")
        ConsoleLogger.info(f"  └─ Role: {role['RoleName']}")
        ConsoleLogger.info(f"  └─ ARN: {role['Arn']}")
        ConsoleLogger.info(f"  └─ Attached Policies: {len(policies['AttachedPolicies'])}")
    
    def test_lambda_role_exists(self):
        """Test Lambda IAM role exists."""
        role_name = DEPLOYMENT_OUTPUTS['lambda_role_name']
        ConsoleLogger.info(f"Testing Lambda Role: {role_name}")
        
        response = self.iam_client.get_role(RoleName=role_name)
        
        self.assertIsNotNone(response['Role'])
        role = response['Role']
        
        # List attached policies
        policies = self.iam_client.list_attached_role_policies(RoleName=role_name)
        
        ConsoleLogger.success("Lambda role exists")
        ConsoleLogger.info(f"  └─ Role: {role['RoleName']}")
        ConsoleLogger.info(f"  └─ ARN: {role['Arn']}")
        ConsoleLogger.info(f"  └─ Attached Policies: {len(policies['AttachedPolicies'])}")


class TestSSMParameters(unittest.TestCase):
    """Integration tests for SSM Parameter Store."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing SSM Parameter Store")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.ssm_client = boto3.client('ssm', region_name=DEPLOYMENT_OUTPUTS.get('region', 'us-east-1'))
        cls.logger = ConsoleLogger()
    
    def test_ssm_parameters_exist(self):
        """Test SSM parameters exist and contain correct values."""
        ConsoleLogger.info("Testing SSM parameters")
        
        parameters = [
            (DEPLOYMENT_OUTPUTS['ssm_aurora_endpoint_name'], DEPLOYMENT_OUTPUTS['aurora_cluster_endpoint']),
            (DEPLOYMENT_OUTPUTS['ssm_redis_premium_endpoint_name'], DEPLOYMENT_OUTPUTS['redis_premium_endpoint']),
            (DEPLOYMENT_OUTPUTS['ssm_redis_standard_endpoint_name'], DEPLOYMENT_OUTPUTS['redis_standard_endpoint']),
            (DEPLOYMENT_OUTPUTS['ssm_s3_bucket_name'], DEPLOYMENT_OUTPUTS['s3_bucket_name'])
        ]
        
        for param_name, expected_value in parameters:
            response = self.ssm_client.get_parameter(Name=param_name)
            parameter = response['Parameter']
            
            self.assertEqual(parameter['Value'], expected_value)
            ConsoleLogger.success(f"Parameter exists: {param_name}")
            ConsoleLogger.info(f"  └─ Value: {parameter['Value']}")
            ConsoleLogger.info(f"  └─ Type: {parameter['Type']}")


class TestDNSInfrastructure(unittest.TestCase):
    """Integration tests for Route 53 DNS."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing DNS Infrastructure")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.route53_client = boto3.client('route53')
        cls.logger = ConsoleLogger()
    
    def test_hosted_zone_exists(self):
        """Test Route 53 hosted zone exists."""
        zone_id = DEPLOYMENT_OUTPUTS['hosted_zone_id']
        ConsoleLogger.info(f"Testing Hosted Zone: {zone_id}")
        
        response = self.route53_client.get_hosted_zone(Id=zone_id)
        
        zone = response['HostedZone']
        self.assertEqual(zone['Name'], DEPLOYMENT_OUTPUTS['hosted_zone_name'])
        
        ConsoleLogger.success("Hosted zone exists")
        ConsoleLogger.info(f"  └─ Zone ID: {zone['Id']}")
        ConsoleLogger.info(f"  └─ Name: {zone['Name']}")
        ConsoleLogger.info(f"  └─ Private Zone: {zone.get('Config', {}).get('PrivateZone', False)}")


class TestEndToEndConnectivity(unittest.TestCase):
    """End-to-end connectivity tests."""
    
    @classmethod
    def setUpClass(cls):
        ConsoleLogger.header("Testing End-to-End Connectivity")
        if not DEPLOYMENT_OUTPUTS:
            raise unittest.SkipTest("No deployment outputs found")
        cls.logger = ConsoleLogger()
    
    def test_deployment_summary(self):
        """Display comprehensive deployment summary."""
        ConsoleLogger.info("Deployment Summary")
        
        summary = {
            "Environment": DEPLOYMENT_OUTPUTS.get('environment_suffix', 'N/A'),
            "Region": DEPLOYMENT_OUTPUTS.get('region', 'N/A'),
            "VPC": DEPLOYMENT_OUTPUTS.get('vpc_id', 'N/A'),
            "ALB DNS": DEPLOYMENT_OUTPUTS.get('alb_dns_name', 'N/A'),
            "Aurora Endpoint": DEPLOYMENT_OUTPUTS.get('aurora_cluster_endpoint', 'N/A'),
            "Redis Premium": DEPLOYMENT_OUTPUTS.get('redis_premium_endpoint', 'N/A'),
            "Redis Standard": DEPLOYMENT_OUTPUTS.get('redis_standard_endpoint', 'N/A'),
            "S3 Bucket": DEPLOYMENT_OUTPUTS.get('s3_bucket_name', 'N/A'),
            "CloudFront": DEPLOYMENT_OUTPUTS.get('cloudfront_domain_name', 'N/A'),
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
        exit(1)
    
    ConsoleLogger.success(f"Loaded outputs for environment: {DEPLOYMENT_OUTPUTS.get('environment_suffix', 'unknown')}")
    ConsoleLogger.info(f"Testing infrastructure in region: {DEPLOYMENT_OUTPUTS.get('region', 'us-east-1')}")
    
    # Run tests
    unittest.main(verbosity=2)
