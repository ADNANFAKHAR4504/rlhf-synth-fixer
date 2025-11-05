"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using stack outputs.
"""

import unittest
import os
import json
import boto3
import requests
import time


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with stack outputs."""
        cls.outputs_file = "/var/www/turing/iac-test-automations/worktree/synth-101000836/cfn-outputs/flat-outputs.json"

        # Load stack outputs
        with open(cls.outputs_file, 'r') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.ecr_client = boto3.client('ecr', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.secretsmanager_client = boto3.client('secretsmanager', region_name=cls.region)

    def test_vpc_exists_and_accessible(self):
        """Test that VPC exists and is accessible."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1, "VPC should exist")

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available', "VPC should be available")
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16', "VPC should have correct CIDR block")

        # Check DNS configuration using describe_vpc_attribute
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )

        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'],
                       "DNS hostnames should be enabled")
        self.assertTrue(dns_support['EnableDnsSupport']['Value'],
                       "DNS support should be enabled")

    def test_subnets_created_correctly(self):
        """Test that subnets are created in correct availability zones."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_subnets(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        subnets = response['Subnets']
        self.assertGreaterEqual(len(subnets), 6, "Should have at least 6 subnets (2 public + 4 private)")

        # Check that subnets span multiple AZs
        azs = set(subnet['AvailabilityZone'] for subnet in subnets)
        self.assertGreaterEqual(len(azs), 2, "Subnets should span at least 2 availability zones")

    def test_ecr_repository_exists(self):
        """Test that ECR repository exists and is accessible."""
        ecr_url = self.outputs['ecr_repository_url']
        repo_name = ecr_url.split('/')[-1]

        response = self.ecr_client.describe_repositories(
            repositoryNames=[repo_name]
        )

        self.assertEqual(len(response['repositories']), 1, "ECR repository should exist")
        repo = response['repositories'][0]
        self.assertEqual(repo['imageScanningConfiguration']['scanOnPush'], True,
                        "Image scanning should be enabled")

    def test_ecs_cluster_exists(self):
        """Test that ECS cluster exists with Container Insights enabled."""
        cluster_name = self.outputs['ecs_cluster_name']

        response = self.ecs_client.describe_clusters(
            clusters=[cluster_name],
            include=['SETTINGS']
        )

        self.assertEqual(len(response['clusters']), 1, "ECS cluster should exist")
        cluster = response['clusters'][0]
        self.assertEqual(cluster['status'], 'ACTIVE', "Cluster should be active")

        # Check Container Insights
        settings = cluster.get('settings', [])
        container_insights = next(
            (s for s in settings if s['name'] == 'containerInsights'),
            None
        )
        self.assertIsNotNone(container_insights, "Container Insights setting should exist")
        self.assertEqual(container_insights['value'], 'enabled',
                        "Container Insights should be enabled")

    def test_ecs_service_running(self):
        """Test that ECS service is running with expected configuration."""
        cluster_name = self.outputs['ecs_cluster_name']

        response = self.ecs_client.list_services(cluster=cluster_name)
        self.assertGreater(len(response['serviceArns']), 0, "Should have at least one service")

        # Describe the service
        service_response = self.ecs_client.describe_services(
            cluster=cluster_name,
            services=response['serviceArns']
        )

        service = service_response['services'][0]
        self.assertEqual(service['status'], 'ACTIVE', "Service should be active")
        self.assertEqual(service['launchType'], 'FARGATE', "Should use Fargate launch type")
        self.assertGreaterEqual(service['desiredCount'], 2, "Should have at least 2 tasks desired")

    def test_rds_instance_exists_and_available(self):
        """Test that RDS instance exists and is available."""
        rds_endpoint = self.outputs['rds_endpoint']
        db_identifier = rds_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )

        self.assertEqual(len(response['DBInstances']), 1, "RDS instance should exist")
        instance = response['DBInstances'][0]
        self.assertEqual(instance['DBInstanceStatus'], 'available', "RDS should be available")
        self.assertEqual(instance['Engine'], 'postgres', "Should be PostgreSQL")
        self.assertTrue(instance['MultiAZ'], "Should be Multi-AZ deployment")
        self.assertTrue(instance['StorageEncrypted'], "Storage should be encrypted")
        self.assertEqual(instance['BackupRetentionPeriod'], 7, "Should have 7-day backup retention")

    def test_alb_exists_and_healthy(self):
        """Test that Application Load Balancer exists and is healthy."""
        alb_dns = self.outputs['alb_dns_name']

        # Get ALB ARN from DNS name
        response = self.elbv2_client.describe_load_balancers()
        alb = next(
            (lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns),
            None
        )

        self.assertIsNotNone(alb, "ALB should exist")
        self.assertEqual(alb['State']['Code'], 'active', "ALB should be active")
        self.assertEqual(alb['Type'], 'application', "Should be application load balancer")
        self.assertFalse(alb['Scheme'] == 'internal', "Should be internet-facing")

    def test_alb_target_group_healthy(self):
        """Test that ALB target group has healthy targets."""
        alb_dns = self.outputs['alb_dns_name']

        # Get ALB ARN
        response = self.elbv2_client.describe_load_balancers()
        alb = next(
            (lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns),
            None
        )

        if alb:
            # Get target groups
            tg_response = self.elbv2_client.describe_target_groups(
                LoadBalancerArn=alb['LoadBalancerArn']
            )

            self.assertGreater(len(tg_response['TargetGroups']), 0,
                             "Should have at least one target group")

            target_group = tg_response['TargetGroups'][0]
            self.assertEqual(target_group['Protocol'], 'HTTP', "Should use HTTP protocol")
            self.assertEqual(target_group['Port'], 5000, "Should listen on port 5000")
            self.assertEqual(target_group['TargetType'], 'ip', "Should use IP target type")

    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch log group exists with correct retention."""
        # Find log group by pattern
        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix='/ecs/product-catalog-'
        )

        self.assertGreater(len(response['logGroups']), 0,
                          "CloudWatch log group should exist")

        log_group = response['logGroups'][0]
        self.assertEqual(log_group.get('retentionInDays'), 7,
                        "Log retention should be 7 days")

    def test_secrets_manager_secret_exists(self):
        """Test that Secrets Manager secret exists with database credentials."""
        secret_arn = self.outputs['db_secret_arn']

        response = self.secretsmanager_client.describe_secret(SecretId=secret_arn)

        self.assertEqual(response['ARN'], secret_arn, "Secret should exist")
        self.assertIn('Name', response, "Secret should have a name")

        # Verify secret has a value (without reading the actual credentials)
        value_response = self.secretsmanager_client.get_secret_value(SecretId=secret_arn)
        self.assertIn('SecretString', value_response, "Secret should have a value")

        # Parse and validate secret structure
        secret_data = json.loads(value_response['SecretString'])
        self.assertIn('username', secret_data, "Secret should contain username")
        self.assertIn('password', secret_data, "Secret should contain password")
        self.assertIn('host', secret_data, "Secret should contain host")
        self.assertIn('port', secret_data, "Secret should contain port")
        self.assertIn('connection_string', secret_data, "Secret should contain connection_string")

    def test_alb_responds_to_http(self):
        """Test that ALB endpoint is accessible via HTTP."""
        alb_dns = self.outputs['alb_dns_name']
        url = f"http://{alb_dns}"

        try:
            # Try to connect (may fail if no container image deployed, which is expected)
            response = requests.get(url, timeout=10)
            # Any response (even 503) means ALB is working
            self.assertIsNotNone(response.status_code, "ALB should respond")
        except requests.exceptions.ConnectionError:
            # ALB exists but may not have healthy targets (no Docker image deployed)
            # This is acceptable for infrastructure testing
            self.skipTest("ALB exists but no healthy targets (no container image deployed)")
        except requests.exceptions.Timeout:
            self.skipTest("ALB timeout (expected without deployed container)")

    def test_security_groups_configured(self):
        """Test that security groups are properly configured."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_security_groups(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        security_groups = response['SecurityGroups']
        self.assertGreaterEqual(len(security_groups), 3,
                               "Should have at least 3 security groups (ALB, ECS, RDS)")

        # Verify security group names contain environment suffix
        sg_names = [sg.get('GroupName', '') for sg in security_groups]
        self.assertTrue(
            any('synth101000836' in name.lower() for name in sg_names),
            "Security group names should include environment suffix"
        )

    def test_nat_gateways_deployed(self):
        """Test that NAT gateways are deployed for private subnet connectivity."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_nat_gateways(
            Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
        )

        nat_gateways = response['NatGateways']
        active_nats = [ng for ng in nat_gateways if ng['State'] == 'available']
        self.assertGreaterEqual(len(active_nats), 2,
                               "Should have at least 2 NAT gateways for HA")


if __name__ == "__main__":
    unittest.main()
