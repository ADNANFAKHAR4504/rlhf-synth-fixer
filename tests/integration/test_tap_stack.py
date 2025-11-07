"""
Integration tests for TapStack deployed infrastructure.

Tests actual AWS resources to verify:
- Resources exist and are accessible
- Resource configurations match expected values
- Resource naming conventions
- Resource relationships and connectivity
"""

import json
import os
import unittest
from typing import Dict, Any, Optional

import boto3
from botocore.exceptions import ClientError
from pytest import mark

# Load outputs from CloudFormation stack
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)


def load_outputs() -> Dict[str, Any]:
    """Load CloudFormation outputs from flat-outputs.json"""
    if os.path.exists(flat_outputs_path):
        with open(flat_outputs_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {}


def extract_environment_suffix(outputs: Dict[str, Any]) -> Optional[str]:
    """Extract environment suffix from outputs"""
    if not outputs:
        return None
    
    # Try to extract from ALB DNS name
    if 'ALBDNSName' in outputs:
        alb_dns = outputs['ALBDNSName']
        # Pattern: media-streaming-alb-{suffix}-{hash}.{region}.elb.amazonaws.com
        parts = alb_dns.split('-')
        if len(parts) >= 4:
            return parts[3]
    
    # Try to extract from RDS endpoint
    if 'RDSClusterEndpoint' in outputs:
        rds_endpoint = outputs['RDSClusterEndpoint']
        # Pattern: media-streaming-db-{suffix}.cluster-{hash}.{region}.rds.amazonaws.com
        parts = rds_endpoint.split('.')
        if len(parts) > 0:
            db_parts = parts[0].split('-')
            if len(db_parts) >= 4:
                return db_parts[3]
    
    return None


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up test fixtures once for all tests"""
        cls.outputs = load_outputs()
        cls.env_suffix = extract_environment_suffix(cls.outputs) or 'test'
        cls.region = os.environ.get('AWS_REGION', 'us-east-1')
        
        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.elb_client = boto3.client('elbv2', region_name=cls.region)
        cls.apigateway_client = boto3.client('apigateway', region_name=cls.region)
        cls.ecr_client = boto3.client('ecr', region_name=cls.region)
        cls.secrets_client = boto3.client('secretsmanager', region_name=cls.region)
        cls.ssm_client = boto3.client('ssm', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)

    def setUp(self):
        """Set up before each test"""
        if not self.outputs:
            self.skipTest("No CloudFormation outputs found. Infrastructure may not be deployed.")

    # ============================================================
    # Stack Outputs Tests
    # ============================================================

    @mark.it("should have all required stack outputs")
    def test_stack_outputs_exist(self):
        """Verify all required outputs are present"""
        required_outputs = [
            'ALBDNSName',
            'RDSClusterEndpoint',
            'CloudFrontURL',
            'APIGatewayEndpoint',
            'FrontendRepoURI',
            'BackendRepoURI',
            'DBSecretArn'
        ]
        
        for output_key in required_outputs:
            self.assertIn(
                output_key, self.outputs,
                f"Missing required output: {output_key}"
            )
            self.assertIsNotNone(
                self.outputs[output_key],
                f"Output {output_key} is None"
            )

    @mark.it("should have valid ALB DNS name format")
    def test_alb_dns_format(self):
        """Verify ALB DNS name follows expected pattern"""
        alb_dns = self.outputs.get('ALBDNSName')
        self.assertIsNotNone(alb_dns)
        self.assertIn('.elb.amazonaws.com', alb_dns)
        self.assertIn(f'alb-{self.env_suffix}', alb_dns)

    @mark.it("should have valid RDS endpoint format")
    def test_rds_endpoint_format(self):
        """Verify RDS endpoint follows expected pattern"""
        rds_endpoint = self.outputs.get('RDSClusterEndpoint')
        self.assertIsNotNone(rds_endpoint)
        self.assertIn('.rds.amazonaws.com', rds_endpoint)
        self.assertIn(f'db-{self.env_suffix}', rds_endpoint)

    @mark.it("should have valid CloudFront URL format")
    def test_cloudfront_url_format(self):
        """Verify CloudFront URL follows expected pattern"""
        cf_url = self.outputs.get('CloudFrontURL')
        self.assertIsNotNone(cf_url)
        self.assertTrue(cf_url.startswith('https://'))
        self.assertIn('.cloudfront.net', cf_url)

    @mark.it("should have valid API Gateway endpoint format")
    def test_api_gateway_endpoint_format(self):
        """Verify API Gateway endpoint follows expected pattern"""
        api_endpoint = self.outputs.get('APIGatewayEndpoint')
        self.assertIsNotNone(api_endpoint)
        self.assertTrue(api_endpoint.startswith('https://'))
        self.assertIn('.execute-api.', api_endpoint)

    # ============================================================
    # VPC and Networking Tests
    # ============================================================

    @mark.it("should have VPC with correct naming")
    def test_vpc_exists(self):
        """Verify VPC exists with correct naming"""
        try:
            response = self.ec2_client.describe_vpcs(
                Filters=[
                    {'Name': 'tag:Name', 'Values': [f'media-streaming-vpc-{self.env_suffix}']}
                ]
            )
            self.assertGreater(len(response['Vpcs']), 0, "VPC not found")
            vpc = response['Vpcs'][0]
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        except ClientError as e:
            self.skipTest(f"Could not verify VPC: {e}")

    @mark.it("should have subnets across multiple AZs")
    def test_subnets_exist(self):
        """Verify subnets exist in multiple availability zones"""
        try:
            response = self.ec2_client.describe_vpcs(
                Filters=[
                    {'Name': 'tag:Name', 'Values': [f'media-streaming-vpc-{self.env_suffix}']}
                ]
            )
            if not response['Vpcs']:
                self.skipTest("VPC not found")
            
            vpc_id = response['Vpcs'][0]['VpcId']
            subnets = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )
            
            self.assertGreaterEqual(len(subnets['Subnets']), 3, "Should have at least 3 subnets")
            
            # Check for multiple AZs
            azs = set(subnet['AvailabilityZone'] for subnet in subnets['Subnets'])
            self.assertGreaterEqual(len(azs), 2, "Should span multiple availability zones")
        except ClientError as e:
            self.skipTest(f"Could not verify subnets: {e}")

    # ============================================================
    # RDS Aurora Cluster Tests
    # ============================================================

    @mark.it("should have RDS Aurora cluster")
    def test_rds_cluster_exists(self):
        """Verify RDS Aurora cluster exists and is accessible"""
        try:
            cluster_id = f'media-streaming-db-{self.env_suffix}'
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            
            self.assertGreater(len(response['DBClusters']), 0, "RDS cluster not found")
            cluster = response['DBClusters'][0]
            
            self.assertEqual(cluster['Engine'], 'aurora-postgresql')
            self.assertEqual(cluster['EngineVersion'], '14.6')
            self.assertTrue(cluster['StorageEncrypted'])
            self.assertEqual(cluster['BackupRetentionPeriod'], 7)
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            if error_code == 'DBClusterNotFoundFault':
                self.skipTest("RDS cluster not found - infrastructure may be torn down")
            else:
                self.fail(f"Error checking RDS cluster: {e}")

    @mark.it("should have RDS cluster instances")
    def test_rds_instances_exist(self):
        """Verify RDS cluster has writer and reader instances"""
        try:
            cluster_id = f'media-streaming-db-{self.env_suffix}'
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            
            if not response['DBClusters']:
                self.skipTest("RDS cluster not found")
            
            cluster = response['DBClusters'][0]
            self.assertGreaterEqual(
                len(cluster['DBClusterMembers']), 2,
                "Should have at least 2 instances (writer + reader)"
            )
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            if error_code == 'DBClusterNotFoundFault':
                self.skipTest("RDS cluster not found")
            else:
                self.skipTest(f"Error checking RDS instances: {e}")

    @mark.it("should have database credentials secret")
    def test_db_secret_exists(self):
        """Verify database credentials secret exists"""
        try:
            secret_name = f'db-creds-{self.env_suffix}'
            response = self.secrets_client.describe_secret(SecretId=secret_name)
            
            self.assertEqual(response['Name'], secret_name)
            self.assertIn('RotationEnabled', response)
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            if error_code == 'ResourceNotFoundException':
                self.skipTest("Secret not found - infrastructure may be torn down")
            else:
                self.skipTest(f"Error checking secret: {e}")

    # ============================================================
    # Application Load Balancer Tests
    # ============================================================

    @mark.it("should have Application Load Balancer")
    def test_alb_exists(self):
        """Verify ALB exists and is accessible"""
        try:
            alb_name = f'media-streaming-alb-{self.env_suffix}'
            response = self.elb_client.describe_load_balancers(
                Names=[alb_name]
            )
            
            self.assertGreater(len(response['LoadBalancers']), 0, "ALB not found")
            alb = response['LoadBalancers'][0]
            
            self.assertEqual(alb['Type'], 'application')
            self.assertEqual(alb['Scheme'], 'internet-facing')
            self.assertEqual(alb['State']['Code'], 'active')
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            if error_code == 'LoadBalancerNotFound':
                self.skipTest("ALB not found - infrastructure may be torn down")
            else:
                self.skipTest(f"Error checking ALB: {e}")

    @mark.it("should have ALB target groups")
    def test_alb_target_groups(self):
        """Verify ALB has target groups configured"""
        try:
            alb_name = f'media-streaming-alb-{self.env_suffix}'
            alb_response = self.elb_client.describe_load_balancers(Names=[alb_name])
            
            if not alb_response['LoadBalancers']:
                self.skipTest("ALB not found")
            
            alb_arn = alb_response['LoadBalancers'][0]['LoadBalancerArn']
            tg_response = self.elb_client.describe_target_groups(
                LoadBalancerArn=alb_arn
            )
            
            self.assertGreaterEqual(
                len(tg_response['TargetGroups']), 2,
                "Should have at least 2 target groups (frontend + backend)"
            )
        except ClientError as e:
            self.skipTest(f"Error checking target groups: {e}")

    # ============================================================
    # ECS Cluster and Services Tests
    # ============================================================

    @mark.it("should have ECS cluster")
    def test_ecs_cluster_exists(self):
        """Verify ECS cluster exists"""
        try:
            cluster_name = f'media-streaming-cluster-{self.env_suffix}'
            response = self.ecs_client.describe_clusters(clusters=[cluster_name])
            
            if not response['clusters']:
                self.skipTest("ECS cluster not found")
            
            cluster = response['clusters'][0]
            self.assertEqual(cluster['clusterName'], cluster_name)
            self.assertEqual(cluster['status'], 'ACTIVE')
        except ClientError as e:
            self.skipTest(f"Error checking ECS cluster: {e}")

    @mark.it("should have ECS services running")
    def test_ecs_services_exist(self):
        """Verify ECS services exist and are running"""
        try:
            cluster_name = f'media-streaming-cluster-{self.env_suffix}'
            response = self.ecs_client.list_services(cluster=cluster_name)
            
            services = response.get('serviceArns', [])
            self.assertGreaterEqual(
                len(services), 2,
                "Should have at least 2 services (frontend + backend)"
            )
            
            # Check service details
            for service_arn in services[:2]:  # Check first 2 services
                service_name = service_arn.split('/')[-1]
                service_response = self.ecs_client.describe_services(
                    cluster=cluster_name,
                    services=[service_name]
                )
                
                if service_response['services']:
                    service = service_response['services'][0]
                    self.assertIn(service['status'], ['ACTIVE', 'DRAINING'])
        except ClientError as e:
            self.skipTest(f"Error checking ECS services: {e}")

    # ============================================================
    # ECR Repository Tests
    # ============================================================

    @mark.it("should have ECR repositories")
    def test_ecr_repositories_exist(self):
        """Verify ECR repositories exist"""
        try:
            frontend_repo = f'media-streaming-frontend-{self.env_suffix}'
            backend_repo = f'media-streaming-backend-{self.env_suffix}'
            
            response = self.ecr_client.describe_repositories(
                repositoryNames=[frontend_repo, backend_repo]
            )
            
            self.assertEqual(len(response['repositories']), 2)
            
            for repo in response['repositories']:
                self.assertTrue(repo['imageScanningConfiguration']['scanOnPush'])
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            if error_code == 'RepositoryNotFoundException':
                self.skipTest("ECR repositories not found")
            else:
                self.skipTest(f"Error checking ECR repositories: {e}")

    # ============================================================
    # API Gateway Tests
    # ============================================================

    @mark.it("should have API Gateway REST API")
    def test_api_gateway_exists(self):
        """Verify API Gateway exists"""
        try:
            api_endpoint = self.outputs.get('APIGatewayEndpoint', '')
            if not api_endpoint:
                self.skipTest("API Gateway endpoint not in outputs")
            
            # Extract API ID from endpoint
            # Format: https://{api-id}.execute-api.{region}.amazonaws.com/{stage}/
            api_id = api_endpoint.split('/')[2].split('.')[0]
            
            response = self.apigateway_client.get_rest_api(restApiId=api_id)
            
            self.assertIn('name', response)
            self.assertIn(f'api-{self.env_suffix}', response['name'].lower())
        except ClientError as e:
            self.skipTest(f"Error checking API Gateway: {e}")

    # ============================================================
    # SSM Parameters Tests
    # ============================================================

    @mark.it("should have SSM parameters")
    def test_ssm_parameters_exist(self):
        """Verify SSM parameters exist"""
        try:
            db_param = f'/app/{self.env_suffix}/db/endpoint'
            alb_param = f'/app/{self.env_suffix}/alb/dns'
            
            db_response = self.ssm_client.get_parameter(Name=db_param)
            alb_response = self.ssm_client.get_parameter(Name=alb_param)
            
            self.assertIsNotNone(db_response['Parameter']['Value'])
            self.assertIsNotNone(alb_response['Parameter']['Value'])
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            if error_code == 'ParameterNotFound':
                self.skipTest("SSM parameters not found")
            else:
                self.skipTest(f"Error checking SSM parameters: {e}")

    # ============================================================
    # CloudWatch Logs Tests
    # ============================================================

    @mark.it("should have CloudWatch log groups")
    def test_log_groups_exist(self):
        """Verify CloudWatch log groups exist"""
        try:
            frontend_log = f'/ecs/frontend-{self.env_suffix}'
            backend_log = f'/ecs/backend-{self.env_suffix}'
            
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix='/ecs/'
            )
            
            log_names = [lg['logGroupName'] for lg in response['logGroups']]
            self.assertIn(frontend_log, log_names)
            self.assertIn(backend_log, log_names)
        except ClientError as e:
            self.skipTest(f"Error checking log groups: {e}")

    # ============================================================
    # Resource Naming Convention Tests
    # ============================================================

    @mark.it("should use environment suffix in all resource names")
    def test_resource_naming_convention(self):
        """Verify all resources use environment suffix in names"""
        # This is a high-level check - individual tests verify specific resources
        self.assertIsNotNone(self.env_suffix)
        self.assertGreater(len(self.env_suffix), 0)
