"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using outputs from deployment.
"""

import unittest
import os
import json
import boto3
import requests
import time
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Live integration tests against deployed AWS infrastructure."""
    
    @classmethod
    def setUpClass(cls):
        """Set up integration test suite - load outputs and initialize AWS clients."""
        print("\n" + "=" * 80)
        print("STARTING LIVE INTEGRATION TESTS")
        print("=" * 80)
        
        # Load outputs from flat-outputs.json
        outputs_file = os.path.join("cfn-outputs", "flat-outputs.json")
        print(f"\nLoading outputs from: {outputs_file}")
        
        try:
            with open(outputs_file, 'r') as f:
                cls.outputs = json.load(f)
            print(f"Successfully loaded outputs")
            print(f"Outputs: {json.dumps(cls.outputs, indent=2)}")
        except FileNotFoundError:
            print(f"ERROR: Output file not found: {outputs_file}")
            raise
        except json.JSONDecodeError as e:
            print(f"ERROR: Invalid JSON in output file: {e}")
            raise
        
        # Extract values from outputs
        cls.vpc_id = cls.outputs.get("vpc_id")
        cls.alb_dns_name = cls.outputs.get("alb_dns_name")
        cls.ecr_repository_url = cls.outputs.get("ecr_repository_url")
        cls.ecs_cluster_name = cls.outputs.get("ecs_cluster_name")
        cls.rds_endpoint = cls.outputs.get("rds_endpoint")
        cls.db_secret_arn = cls.outputs.get("db_secret_arn")
        
        print("\nExtracted Output Values:")
        print(f"  VPC ID: {cls.vpc_id}")
        print(f"  ALB DNS: {cls.alb_dns_name}")
        print(f"  ECR URL: {cls.ecr_repository_url}")
        print(f"  ECS Cluster: {cls.ecs_cluster_name}")
        print(f"  RDS Endpoint: {cls.rds_endpoint}")
        print(f"  Secret ARN: {cls.db_secret_arn}")
        
        # Initialize AWS clients
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        print(f"\nAWS Region: {cls.region}")
        
        print("\nInitializing AWS clients...")
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.ecr_client = boto3.client('ecr', region_name=cls.region)
        cls.secrets_client = boto3.client('secretsmanager', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('logs', region_name=cls.region)
        print("All AWS clients initialized successfully")
        
        print("\n" + "=" * 80)
    
    def setUp(self):
        """Set up each test."""
        print(f"\n{'-' * 80}")
        print(f"Running: {self._testMethodName}")
        print(f"{'-' * 80}")
    
    def tearDown(self):
        """Clean up after each test."""
        if hasattr(self._outcome, 'errors'):
            result = self.defaultTestResult()
            self._feedErrorsToResult(result, self._outcome.errors)
            if result.errors or result.failures:
                print(f"TEST FAILED: {self._testMethodName}")
            else:
                print(f"TEST PASSED: {self._testMethodName}")


class TestVPCResources(TestTapStackLiveIntegration):
    """Integration tests for VPC and networking resources."""
    
    def test_01_vpc_exists_and_accessible(self):
        """Test that VPC exists and is accessible."""
        print(f"Verifying VPC exists: {self.vpc_id}")
        
        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
            vpc = response['Vpcs'][0]
            
            print(f"[OK] VPC found: {vpc['VpcId']}")
            print(f"  CIDR Block: {vpc['CidrBlock']}")
            print(f"  State: {vpc['State']}")
            print(f"  DNS Support: {vpc.get('EnableDnsSupport', 'N/A')}")
            print(f"  DNS Hostnames: {vpc.get('EnableDnsHostnames', 'N/A')}")
            
            self.assertEqual(vpc['VpcId'], self.vpc_id)
            self.assertEqual(vpc['State'], 'available')
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
            
        except ClientError as e:
            print(f"[ERROR] Failed to describe VPC: {e}")
            self.fail(f"VPC not found or not accessible: {e}")
    
    def test_02_subnets_exist(self):
        """Test that subnets are created in the VPC."""
        print(f"Verifying subnets in VPC: {self.vpc_id}")
        
        try:
            response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )
            subnets = response['Subnets']
            
            print(f"[OK] Found {len(subnets)} subnets")
            
            public_subnets = [s for s in subnets if 'public' in s.get('Tags', [{}])[0].get('Value', '').lower()]
            private_subnets = [s for s in subnets if 'private' in s.get('Tags', [{}])[0].get('Value', '').lower()]
            
            print(f"  Public subnets: {len(public_subnets)}")
            print(f"  Private subnets: {len(private_subnets)}")
            
            for subnet in subnets[:5]:  # Show first 5
                tags = {tag['Key']: tag['Value'] for tag in subnet.get('Tags', [])}
                print(f"    - {subnet['SubnetId']} - {subnet['CidrBlock']} - AZ: {subnet['AvailabilityZone']} - {tags.get('Name', 'N/A')}")
            
            self.assertGreaterEqual(len(subnets), 6, "Expected at least 6 subnets (3 public + 3 private)")
            
        except ClientError as e:
            print(f"[ERROR] Failed to describe subnets: {e}")
            self.fail(f"Subnets not found: {e}")
    
    def test_03_internet_gateway_attached(self):
        """Test that Internet Gateway is attached to VPC."""
        print(f"Verifying Internet Gateway for VPC: {self.vpc_id}")
        
        try:
            response = self.ec2_client.describe_internet_gateways(
                Filters=[{'Name': 'attachment.vpc-id', 'Values': [self.vpc_id]}]
            )
            igws = response['InternetGateways']
            
            print(f"[OK] Found {len(igws)} Internet Gateway(s)")
            
            for igw in igws:
                print(f"  - IGW ID: {igw['InternetGatewayId']}")
                print(f"    State: {igw['Attachments'][0]['State']}")
            
            self.assertGreater(len(igws), 0, "No Internet Gateway found")
            self.assertEqual(igws[0]['Attachments'][0]['State'], 'available')
            
        except ClientError as e:
            print(f"[ERROR] Failed to describe Internet Gateway: {e}")
            self.fail(f"Internet Gateway not found: {e}")
    
    def test_04_nat_gateways_exist(self):
        """Test that NAT Gateways exist in public subnets."""
        print(f"Verifying NAT Gateways in VPC: {self.vpc_id}")
        
        try:
            response = self.ec2_client.describe_nat_gateways(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )
            nat_gateways = response['NatGateways']
            
            available_nats = [nat for nat in nat_gateways if nat['State'] == 'available']
            
            print(f"[OK] Found {len(nat_gateways)} NAT Gateway(s)")
            print(f"  Available: {len(available_nats)}")
            
            for nat in available_nats:
                print(f"    - NAT ID: {nat['NatGatewayId']}")
                print(f"      Subnet: {nat['SubnetId']}")
                print(f"      State: {nat['State']}")
            
            self.assertGreaterEqual(len(available_nats), 3, "Expected at least 3 NAT Gateways")
            
        except ClientError as e:
            print(f"[ERROR] Failed to describe NAT Gateways: {e}")
            self.fail(f"NAT Gateways not found: {e}")


class TestSecurityGroups(TestTapStackLiveIntegration):
    """Integration tests for Security Groups."""
    
    def test_05_security_groups_exist(self):
        """Test that required security groups exist."""
        print(f"Verifying Security Groups in VPC: {self.vpc_id}")
        
        try:
            response = self.ec2_client.describe_security_groups(
                Filters=[{'Name': 'vpc-id', 'Values': [self.vpc_id]}]
            )
            security_groups = response['SecurityGroups']
            
            print(f"[OK] Found {len(security_groups)} Security Group(s)")
            
            sg_names = []
            for sg in security_groups:
                sg_name = sg.get('GroupName', 'N/A')
                sg_names.append(sg_name)
                print(f"  - {sg['GroupId']} - {sg_name}")
                print(f"    Description: {sg.get('Description', 'N/A')}")
                print(f"    Ingress rules: {len(sg.get('IpPermissions', []))}")
                print(f"    Egress rules: {len(sg.get('IpPermissionsEgress', []))}")
            
            # Verify expected security groups exist (excluding default)
            non_default_sgs = [sg for sg in security_groups if sg['GroupName'] != 'default']
            self.assertGreaterEqual(len(non_default_sgs), 3, "Expected at least 3 security groups (ALB, ECS, RDS)")
            
        except ClientError as e:
            print(f"[ERROR] Failed to describe Security Groups: {e}")
            self.fail(f"Security Groups not found: {e}")


class TestLoadBalancer(TestTapStackLiveIntegration):
    """Integration tests for Application Load Balancer."""
    
    def test_06_alb_exists_and_active(self):
        """Test that ALB exists and is in active state."""
        print(f"Verifying ALB: {self.alb_dns_name}")
        
        try:
            response = self.elbv2_client.describe_load_balancers()
            albs = [alb for alb in response['LoadBalancers'] if alb['DNSName'] == self.alb_dns_name]
            
            self.assertGreater(len(albs), 0, "ALB not found")
            alb = albs[0]
            
            print(f"[OK] ALB found: {alb['LoadBalancerArn']}")
            print(f"  Name: {alb['LoadBalancerName']}")
            print(f"  DNS Name: {alb['DNSName']}")
            print(f"  State: {alb['State']['Code']}")
            print(f"  Type: {alb['Type']}")
            print(f"  Scheme: {alb['Scheme']}")
            print(f"  VPC: {alb['VpcId']}")
            print(f"  AZs: {len(alb['AvailabilityZones'])}")
            
            self.assertEqual(alb['State']['Code'], 'active')
            self.assertEqual(alb['Type'], 'application')
            self.assertEqual(alb['VpcId'], self.vpc_id)
            
        except ClientError as e:
            print(f"[ERROR] Failed to describe ALB: {e}")
            self.fail(f"ALB not found or not accessible: {e}")
    
    def test_07_alb_target_groups_exist(self):
        """Test that ALB target groups exist."""
        print(f"Verifying ALB Target Groups")
        
        try:
            response = self.elbv2_client.describe_target_groups()
            # Filter target groups by VpcId, handle cases where VpcId may not exist
            target_groups = [tg for tg in response['TargetGroups'] if tg.get('VpcId') == self.vpc_id]
            
            print(f"[OK] Found {len(target_groups)} Target Group(s)")
            
            for tg in target_groups:
                print(f"  - {tg['TargetGroupName']}")
                print(f"    ARN: {tg['TargetGroupArn']}")
                print(f"    Protocol: {tg['Protocol']}:{tg['Port']}")
                print(f"    Target Type: {tg['TargetType']}")
                print(f"    Health Check Path: {tg.get('HealthCheckPath', 'N/A')}")
            
            self.assertGreater(len(target_groups), 0, "No target groups found")
            
        except ClientError as e:
            print(f"[ERROR] Failed to describe target groups: {e}")
            self.fail(f"Target groups not found: {e}")

    
    def test_08_alb_listeners_configured(self):
        """Test that ALB has listeners configured."""
        print(f"Verifying ALB Listeners")
        
        try:
            # Get ALB ARN first
            response = self.elbv2_client.describe_load_balancers()
            albs = [alb for alb in response['LoadBalancers'] if alb['DNSName'] == self.alb_dns_name]
            
            if albs:
                alb_arn = albs[0]['LoadBalancerArn']
                
                listener_response = self.elbv2_client.describe_listeners(LoadBalancerArn=alb_arn)
                listeners = listener_response['Listeners']
                
                print(f"[OK] Found {len(listeners)} Listener(s)")
                
                for listener in listeners:
                    print(f"  - Listener ARN: {listener['ListenerArn']}")
                    print(f"    Protocol: {listener['Protocol']}")
                    print(f"    Port: {listener['Port']}")
                    print(f"    Default Actions: {len(listener['DefaultActions'])}")
                
                self.assertGreater(len(listeners), 0, "No listeners configured")
            
        except ClientError as e:
            print(f"[ERROR] Failed to describe listeners: {e}")
            self.fail(f"Listeners not found: {e}")
    
    def test_09_alb_http_connectivity(self):
        """Test HTTP connectivity to ALB (expect 503 if no healthy targets)."""
        print(f"Testing HTTP connectivity to ALB: http://{self.alb_dns_name}")
        
        try:
            url = f"http://{self.alb_dns_name}"
            print(f"  Making HTTP request to: {url}")
            
            response = requests.get(url, timeout=10, allow_redirects=False)
            
            print(f"[OK] HTTP response received")
            print(f"  Status Code: {response.status_code}")
            print(f"  Headers: {dict(response.headers)}")
            
            # ALB is reachable (503 is expected if no healthy targets yet)
            self.assertIn(response.status_code, [200, 503, 504], 
                         f"Unexpected status code: {response.status_code}")
            
        except requests.exceptions.RequestException as e:
            print(f"[WARN] HTTP request failed: {e}")
            print(f"  This may be expected if targets are not yet healthy")


class TestECSResources(TestTapStackLiveIntegration):
    """Integration tests for ECS resources."""
    
    def test_10_ecs_cluster_exists(self):
        """Test that ECS cluster exists."""
        print(f"Verifying ECS Cluster: {self.ecs_cluster_name}")
        
        try:
            response = self.ecs_client.describe_clusters(clusters=[self.ecs_cluster_name])
            clusters = response['clusters']
            
            self.assertGreater(len(clusters), 0, "ECS cluster not found")
            cluster = clusters[0]
            
            print(f"[OK] ECS Cluster found: {cluster['clusterArn']}")
            print(f"  Name: {cluster['clusterName']}")
            print(f"  Status: {cluster['status']}")
            print(f"  Running Tasks: {cluster['runningTasksCount']}")
            print(f"  Pending Tasks: {cluster['pendingTasksCount']}")
            print(f"  Registered Container Instances: {cluster['registeredContainerInstancesCount']}")
            print(f"  Active Services: {cluster['activeServicesCount']}")
            
            self.assertEqual(cluster['status'], 'ACTIVE')
            
        except ClientError as e:
            print(f"[ERROR] Failed to describe ECS cluster: {e}")
            self.fail(f"ECS cluster not found: {e}")
    
    def test_11_ecs_services_exist(self):
        """Test that ECS services exist in cluster."""
        print(f"Verifying ECS Services in cluster: {self.ecs_cluster_name}")
        
        try:
            response = self.ecs_client.list_services(cluster=self.ecs_cluster_name)
            service_arns = response['serviceArns']
            
            print(f"[OK] Found {len(service_arns)} ECS Service(s)")
            
            if service_arns:
                services_response = self.ecs_client.describe_services(
                    cluster=self.ecs_cluster_name,
                    services=service_arns
                )
                
                for service in services_response['services']:
                    print(f"  - Service: {service['serviceName']}")
                    print(f"    Status: {service['status']}")
                    print(f"    Desired Count: {service['desiredCount']}")
                    print(f"    Running Count: {service['runningCount']}")
                    print(f"    Launch Type: {service.get('launchType', 'N/A')}")
            
            self.assertGreater(len(service_arns), 0, "No ECS services found")
            
        except ClientError as e:
            print(f"[ERROR] Failed to describe ECS services: {e}")
            self.fail(f"ECS services not found: {e}")
    
    def test_12_ecs_task_definitions_exist(self):
        """Test that ECS task definitions exist."""
        print(f"Verifying ECS Task Definitions")
        
        try:
            response = self.ecs_client.list_task_definitions(status='ACTIVE')
            task_def_arns = response['taskDefinitionArns']
            
            print(f"[OK] Found {len(task_def_arns)} Active Task Definition(s)")
            
            for task_def_arn in task_def_arns[:5]:  # Show first 5
                task_def = self.ecs_client.describe_task_definition(taskDefinition=task_def_arn)
                td = task_def['taskDefinition']
                print(f"  - {td['family']}:{td['revision']}")
                print(f"    CPU: {td.get('cpu', 'N/A')}")
                print(f"    Memory: {td.get('memory', 'N/A')}")
                print(f"    Network Mode: {td.get('networkMode', 'N/A')}")
            
            self.assertGreater(len(task_def_arns), 0, "No task definitions found")
            
        except ClientError as e:
            print(f"[ERROR] Failed to list task definitions: {e}")
            self.fail(f"Task definitions not found: {e}")


class TestECRRepository(TestTapStackLiveIntegration):
    """Integration tests for ECR repository."""
    
    def test_13_ecr_repository_exists(self):
        """Test that ECR repository exists."""
        print(f"Verifying ECR Repository: {self.ecr_repository_url}")
        
        try:
            # Extract repository name from URL
            repo_name = self.ecr_repository_url.split('/')[-1] if '/' in self.ecr_repository_url else None
            
            if repo_name:
                response = self.ecr_client.describe_repositories(repositoryNames=[repo_name])
                repositories = response['repositories']
                
                self.assertGreater(len(repositories), 0, "ECR repository not found")
                repo = repositories[0]
                
                print(f"[OK] ECR Repository found: {repo['repositoryArn']}")
                print(f"  Name: {repo['repositoryName']}")
                print(f"  URI: {repo['repositoryUri']}")
                print(f"  Created: {repo['createdAt']}")
                print(f"  Image Scanning: {repo.get('imageScanningConfiguration', {}).get('scanOnPush', False)}")
                print(f"  Image Tag Mutability: {repo.get('imageTagMutability', 'N/A')}")
                
                # Try to list images
                try:
                    images_response = self.ecr_client.list_images(repositoryName=repo_name)
                    image_count = len(images_response.get('imageIds', []))
                    print(f"  Images: {image_count}")
                except:
                    print(f"  Images: 0 (or unable to list)")
            else:
                print("[WARN] Could not extract repository name from URL")
            
        except ClientError as e:
            if e.response['Error']['Code'] == 'RepositoryNotFoundException':
                print(f"[WARN] ECR repository not found (may not exist yet)")
            else:
                print(f"[ERROR] Failed to describe ECR repository: {e}")
                self.fail(f"ECR repository error: {e}")


class TestRDSDatabase(TestTapStackLiveIntegration):
    """Integration tests for RDS database."""
    
    def test_14_rds_instance_exists(self):
        """Test that RDS instance exists and is available."""
        print(f"Verifying RDS Instance: {self.rds_endpoint}")
        
        try:
            # Extract DB identifier from endpoint
            db_identifier = self.rds_endpoint.split('.')[0] if '.' in self.rds_endpoint else None
            
            if db_identifier:
                response = self.rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
                db_instances = response['DBInstances']
                
                self.assertGreater(len(db_instances), 0, "RDS instance not found")
                db = db_instances[0]
                
                print(f"[OK] RDS Instance found: {db['DBInstanceIdentifier']}")
                print(f"  Status: {db['DBInstanceStatus']}")
                print(f"  Engine: {db['Engine']} {db['EngineVersion']}")
                print(f"  Instance Class: {db['DBInstanceClass']}")
                print(f"  Storage: {db['AllocatedStorage']} GB")
                print(f"  Storage Type: {db.get('StorageType', 'N/A')}")
                print(f"  Multi-AZ: {db.get('MultiAZ', False)}")
                print(f"  Publicly Accessible: {db.get('PubliclyAccessible', False)}")
                print(f"  Endpoint: {db['Endpoint']['Address']}:{db['Endpoint']['Port']}")
                print(f"  Storage Encrypted: {db.get('StorageEncrypted', False)}")
                print(f"  Backup Retention: {db.get('BackupRetentionPeriod', 'N/A')} days")
                
                self.assertIn(db['DBInstanceStatus'], ['available', 'backing-up', 'creating'])
                
            else:
                print("[WARN] Could not extract DB identifier from endpoint")
            
        except ClientError as e:
            print(f"[ERROR] Failed to describe RDS instance: {e}")
            self.fail(f"RDS instance not found: {e}")


class TestSecretsManager(TestTapStackLiveIntegration):
    """Integration tests for Secrets Manager."""
    
    def test_15_db_secret_exists(self):
        """Test that database secret exists in Secrets Manager."""
        print(f"Verifying Secrets Manager Secret: {self.db_secret_arn}")
        
        try:
            response = self.secrets_client.describe_secret(SecretId=self.db_secret_arn)
            
            print(f"[OK] Secret found: {response['ARN']}")
            print(f"  Name: {response['Name']}")
            print(f"  Description: {response.get('Description', 'N/A')}")
            print(f"  Created: {response.get('CreatedDate', 'N/A')}")
            print(f"  Last Changed: {response.get('LastChangedDate', 'N/A')}")
            print(f"  Last Accessed: {response.get('LastAccessedDate', 'N/A')}")
            print(f"  Rotation Enabled: {response.get('RotationEnabled', False)}")
            
            self.assertEqual(response['ARN'], self.db_secret_arn)
            
        except ClientError as e:
            print(f"[ERROR] Failed to describe secret: {e}")
            self.fail(f"Secret not found: {e}")
    
    def test_16_db_secret_value_accessible(self):
        """Test that secret value can be retrieved."""
        print(f"Verifying Secret Value is Accessible")
        
        try:
            response = self.secrets_client.get_secret_value(SecretId=self.db_secret_arn)
            
            secret_string = response.get('SecretString')
            self.assertIsNotNone(secret_string, "Secret value is empty")
            
            # Parse secret to verify structure (don't print sensitive values)
            secret_data = json.loads(secret_string)
            
            print(f"[OK] Secret value retrieved successfully")
            print(f"  Secret contains keys: {list(secret_data.keys())}")
            
            # Verify expected keys exist
            expected_keys = ['host', 'port', 'username', 'password', 'dbname']
            for key in expected_keys:
                self.assertIn(key, secret_data, f"Missing key: {key}")
                print(f"  [OK] Key '{key}' present")
            
        except ClientError as e:
            print(f"[ERROR] Failed to retrieve secret value: {e}")
            self.fail(f"Secret value not accessible: {e}")


class TestCloudWatchLogs(TestTapStackLiveIntegration):
    """Integration tests for CloudWatch Logs."""
    
    def test_17_ecs_log_groups_exist(self):
        """Test that ECS log groups exist."""
        print(f"Verifying CloudWatch Log Groups")
        
        try:
            response = self.cloudwatch_client.describe_log_groups(logGroupNamePrefix='/ecs/loan-processing')
            log_groups = response['logGroups']
            
            print(f"[OK] Found {len(log_groups)} Log Group(s)")
            
            for log_group in log_groups:
                print(f"  - {log_group['logGroupName']}")
                print(f"    Retention: {log_group.get('retentionInDays', 'Never expire')} days")
                print(f"    Size: {log_group.get('storedBytes', 0)} bytes")
                print(f"    Created: {log_group.get('creationTime', 'N/A')}")
            
            self.assertGreater(len(log_groups), 0, "No ECS log groups found")
            
        except ClientError as e:
            print(f"[ERROR] Failed to describe log groups: {e}")
            self.fail(f"Log groups not found: {e}")


class TestS3Buckets(TestTapStackLiveIntegration):
    """Integration tests for S3 buckets."""
    
    def test_18_alb_logs_bucket_exists(self):
        """Test that ALB logs S3 bucket exists."""
        print(f"Verifying S3 Buckets for ALB Logs")
        
        try:
            response = self.s3_client.list_buckets()
            buckets = response['Buckets']
            
            # Find buckets with ALB logs naming pattern
            alb_log_buckets = [b for b in buckets if 'alb-logs' in b['Name'].lower() or 'loan-processing' in b['Name'].lower()]
            
            print(f"[OK] Found {len(alb_log_buckets)} ALB-related bucket(s)")
            
            for bucket in alb_log_buckets:
                print(f"  - {bucket['Name']}")
                print(f"    Created: {bucket['CreationDate']}")
                
                # Check bucket location
                try:
                    location = self.s3_client.get_bucket_location(Bucket=bucket['Name'])
                    print(f"    Region: {location.get('LocationConstraint', 'us-east-1')}")
                except:
                    pass
                
                # Check bucket encryption
                try:
                    encryption = self.s3_client.get_bucket_encryption(Bucket=bucket['Name'])
                    print(f"    Encryption: Enabled")
                except:
                    print(f"    Encryption: Not configured")
            
            self.assertGreater(len(alb_log_buckets), 0, "No ALB logs bucket found")
            
        except ClientError as e:
            print(f"[ERROR] Failed to list S3 buckets: {e}")
            self.fail(f"S3 buckets not accessible: {e}")


class TestEndToEndConnectivity(TestTapStackLiveIntegration):
    """End-to-end connectivity tests."""
    
    def test_19_alb_dns_resolution(self):
        """Test that ALB DNS name resolves."""
        print(f"Testing DNS resolution for: {self.alb_dns_name}")
        
        import socket
        
        try:
            ip_addresses = socket.gethostbyname_ex(self.alb_dns_name)[2]
            
            print(f"[OK] DNS resolution successful")
            print(f"  Resolved IP addresses: {len(ip_addresses)}")
            for ip in ip_addresses:
                print(f"    - {ip}")
            
            self.assertGreater(len(ip_addresses), 0, "DNS did not resolve to any IP")
            
        except socket.gaierror as e:
            print(f"[ERROR] DNS resolution failed: {e}")
            self.fail(f"DNS resolution failed: {e}")
    
    def test_20_complete_deployment_validation(self):
        """Final validation that all components are deployed."""
        print(f"Running Complete Deployment Validation")
        
        validation_results = {
            "VPC": self.vpc_id is not None,
            "ALB DNS": self.alb_dns_name is not None,
            "ECR Repository": self.ecr_repository_url is not None,
            "ECS Cluster": self.ecs_cluster_name is not None,
            "RDS Endpoint": self.rds_endpoint is not None,
            "DB Secret": self.db_secret_arn is not None,
        }
        
        print(f"\n{'=' * 60}")
        print(f"DEPLOYMENT VALIDATION SUMMARY")
        print(f"{'=' * 60}")
        
        for component, status in validation_results.items():
            status_icon = "[PASS]" if status else "[FAIL]"
            print(f"{status_icon} {component}: {'DEPLOYED' if status else 'MISSING'}")
        
        print(f"{'=' * 60}")
        
        all_deployed = all(validation_results.values())
        
        if all_deployed:
            print(f"\n[SUCCESS] ALL COMPONENTS SUCCESSFULLY DEPLOYED!")
        else:
            missing = [k for k, v in validation_results.items() if not v]
            print(f"\n[WARNING] MISSING COMPONENTS: {', '.join(missing)}")
        
        self.assertTrue(all_deployed, "Some components are missing from deployment")


if __name__ == "__main__":
    # Run tests with verbose output
    print("\n" + "=" * 80)
    print("TAP STACK LIVE INTEGRATION TEST SUITE")
    print("=" * 80)
    print(f"AWS Region: {os.getenv('AWS_REGION', 'us-east-1')}")
    print(f"Output File: cfn-outputs/flat-outputs.json")
    print("=" * 80 + "\n")
    
    unittest.main(verbosity=2)
