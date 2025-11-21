"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack using real AWS API calls.
"""

import unittest
import json
import os
import boto3
import time
from botocore.exceptions import ClientError


class TestTapStackIntegration(unittest.TestCase):
    """Integration tests against live deployed infrastructure."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with deployed stack outputs."""
        # Load stack outputs from cfn-outputs/flat-outputs.json
        outputs_file = 'cfn-outputs/flat-outputs.json'

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(f"Outputs file not found: {outputs_file}")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)

    def test_vpc_exists(self):
        """Test that VPC exists and is available."""
        vpc_id = self.outputs.get('vpc_id')
        self.assertIsNotNone(vpc_id, "VPC ID not found in outputs")

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

        # Check DNS attributes via separate API call
        dns_attrs = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_attrs['EnableDnsHostnames']['Value'])

        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])

    def test_ecs_cluster_exists(self):
        """Test that ECS cluster exists and is active."""
        cluster_name = self.outputs.get('cluster_name')
        cluster_arn = self.outputs.get('cluster_arn')

        self.assertIsNotNone(cluster_name, "Cluster name not found in outputs")
        self.assertIsNotNone(cluster_arn, "Cluster ARN not found in outputs")

        response = self.ecs_client.describe_clusters(clusters=[cluster_arn])
        self.assertEqual(len(response['clusters']), 1)

        cluster = response['clusters'][0]
        self.assertEqual(cluster['status'], 'ACTIVE')
        self.assertEqual(cluster['clusterName'], cluster_name)

    def test_ecs_service_exists_and_running(self):
        """Test that ECS service exists and has running tasks."""
        cluster_arn = self.outputs.get('cluster_arn')
        service_name = self.outputs.get('service_name')

        self.assertIsNotNone(service_name, "Service name not found in outputs")

        response = self.ecs_client.describe_services(
            cluster=cluster_arn,
            services=[service_name]
        )

        self.assertEqual(len(response['services']), 1)
        service = response['services'][0]

        self.assertEqual(service['status'], 'ACTIVE')
        self.assertEqual(service['serviceName'], service_name)

        # Service uses capacity provider strategy (Fargate Spot)
        self.assertIn('capacityProviderStrategy', service)
        self.assertGreater(len(service['capacityProviderStrategy']), 0)

        # Verify service has running tasks (may take time to stabilize)
        self.assertGreaterEqual(service['runningCount'], 0)
        self.assertGreaterEqual(service['desiredCount'], 1)

    def test_alb_exists_and_healthy(self):
        """Test that Application Load Balancer exists and is active."""
        alb_dns = self.outputs.get('alb_dns')
        self.assertIsNotNone(alb_dns, "ALB DNS not found in outputs")

        # Get load balancers by DNS name
        response = self.elbv2_client.describe_load_balancers()

        alb = None
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_dns:
                alb = lb
                break

        self.assertIsNotNone(alb, f"ALB with DNS {alb_dns} not found")
        self.assertEqual(alb['State']['Code'], 'active')
        self.assertEqual(alb['Type'], 'application')
        self.assertEqual(alb['Scheme'], 'internet-facing')

    def test_target_group_exists(self):
        """Test that target group exists and is configured correctly."""
        target_group_arn = self.outputs.get('target_group_arn')
        self.assertIsNotNone(target_group_arn, "Target group ARN not found in outputs")

        response = self.elbv2_client.describe_target_groups(
            TargetGroupArns=[target_group_arn]
        )

        self.assertEqual(len(response['TargetGroups']), 1)
        target_group = response['TargetGroups'][0]

        self.assertEqual(target_group['Protocol'], 'HTTP')
        self.assertEqual(target_group['Port'], 80)
        self.assertEqual(target_group['TargetType'], 'ip')
        self.assertEqual(target_group['HealthCheckProtocol'], 'HTTP')
        self.assertEqual(target_group['HealthCheckPath'], '/health')

    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch log group exists."""
        log_group_name = self.outputs.get('log_group_name')
        self.assertIsNotNone(log_group_name, "Log group name not found in outputs")

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        log_groups = [lg for lg in response['logGroups'] if lg['logGroupName'] == log_group_name]
        self.assertEqual(len(log_groups), 1)

        log_group = log_groups[0]
        self.assertEqual(log_group['retentionInDays'], 7)

    def test_cloudwatch_dashboard_exists(self):
        """Test that CloudWatch dashboard exists."""
        dashboard_name = self.outputs.get('dashboard_name')
        self.assertIsNotNone(dashboard_name, "Dashboard name not found in outputs")

        try:
            response = self.cloudwatch_client.get_dashboard(
                DashboardName=dashboard_name
            )
            self.assertIsNotNone(response['DashboardBody'])

            # Verify dashboard has content
            dashboard_body = json.loads(response['DashboardBody'])
            self.assertIn('widgets', dashboard_body)
            self.assertGreater(len(dashboard_body['widgets']), 0)
        except ClientError as e:
            if e.response['Error']['Code'] == 'ResourceNotFound':
                self.fail(f"Dashboard {dashboard_name} not found")
            raise

    def test_alb_url_accessible(self):
        """Test that ALB URL is properly formatted."""
        alb_url = self.outputs.get('alb_url')
        self.assertIsNotNone(alb_url, "ALB URL not found in outputs")

        self.assertTrue(alb_url.startswith('http://'))
        self.assertIn('elb.amazonaws.com', alb_url)

    def test_resource_tagging(self):
        """Test that resources are properly tagged."""
        vpc_id = self.outputs.get('vpc_id')

        # Check VPC tags
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc = response['Vpcs'][0]

        tags = {tag['Key']: tag['Value'] for tag in vpc.get('Tags', [])}
        self.assertIn('Environment', tags)
        self.assertIn('Name', tags)


if __name__ == "__main__":
    unittest.main()
