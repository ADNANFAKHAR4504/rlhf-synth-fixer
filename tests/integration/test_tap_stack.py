"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import os
import json
import boto3
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load stack outputs from flat-outputs.json
        outputs_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(f"Stack outputs file not found: {outputs_file}")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Parse JSON string values back to their proper types
        # Some outputs (like subnet IDs) are stored as JSON strings and need to be parsed
        for key, value in cls.outputs.items():
            if isinstance(value, str):
                # Try to parse as JSON if it looks like JSON (starts with [ or {)
                if value.startswith('[') or value.startswith('{'):
                    try:
                        cls.outputs[key] = json.loads(value)
                    except json.JSONDecodeError:
                        # If parsing fails, keep as string
                        pass

        # Initialize AWS clients
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.cloudfront_client = boto3.client('cloudfront', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)

    def test_vpc_exists_and_configured(self):
        """Test VPC exists with correct configuration."""
        vpc_id = self.outputs['vpc_id']

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]

        # Verify VPC configuration
        self.assertEqual(vpc['State'], 'available')

        # Check DNS attributes separately
        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsSupport'
        )
        dns_hostnames = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id,
            Attribute='enableDnsHostnames'
        )

        self.assertTrue(dns_support['EnableDnsSupport']['Value'])
        self.assertTrue(dns_hostnames['EnableDnsHostnames']['Value'])

    def test_subnets_exist_in_multiple_azs(self):
        """Test public and private subnets exist across multiple AZs."""
        public_subnet_ids = self.outputs['public_subnet_ids']
        private_subnet_ids = self.outputs['private_subnet_ids']

        # Verify we have 3 subnets of each type
        self.assertEqual(len(public_subnet_ids), 3)
        self.assertEqual(len(private_subnet_ids), 3)

        # Verify public subnets
        public_response = self.ec2_client.describe_subnets(SubnetIds=public_subnet_ids)
        public_azs = {subnet['AvailabilityZone'] for subnet in public_response['Subnets']}
        self.assertEqual(len(public_azs), 3, "Public subnets should span 3 AZs")

        # Verify private subnets
        private_response = self.ec2_client.describe_subnets(SubnetIds=private_subnet_ids)
        private_azs = {subnet['AvailabilityZone'] for subnet in private_response['Subnets']}
        self.assertEqual(len(private_azs), 3, "Private subnets should span 3 AZs")

    def test_rds_instance_exists_and_configured(self):
        """Test RDS instance exists with Multi-AZ and proper configuration."""
        rds_endpoint = self.outputs['rds_endpoint']
        db_identifier = rds_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)

        self.assertEqual(len(response['DBInstances']), 1)
        db_instance = response['DBInstances'][0]

        # Verify RDS configuration
        self.assertEqual(db_instance['Engine'], 'postgres')
        self.assertTrue(db_instance['MultiAZ'], "RDS should be Multi-AZ")
        self.assertTrue(db_instance['StorageEncrypted'], "RDS storage should be encrypted")
        self.assertEqual(db_instance['DBInstanceClass'], 'db.t3.medium')
        self.assertEqual(db_instance['DBName'], self.outputs['rds_database_name'])

    def test_ecs_cluster_exists(self):
        """Test ECS cluster exists and is active."""
        cluster_name = self.outputs['ecs_cluster_name']

        response = self.ecs_client.describe_clusters(clusters=[cluster_name])

        self.assertEqual(len(response['clusters']), 1)
        cluster = response['clusters'][0]

        self.assertEqual(cluster['status'], 'ACTIVE')
        self.assertEqual(cluster['clusterName'], cluster_name)

    def test_ecs_service_exists_and_running(self):
        """Test ECS service exists with desired task count."""
        cluster_name = self.outputs['ecs_cluster_name']
        service_name = self.outputs['ecs_service_name']

        response = self.ecs_client.describe_services(
            cluster=cluster_name,
            services=[service_name]
        )

        self.assertEqual(len(response['services']), 1)
        service = response['services'][0]

        self.assertEqual(service['status'], 'ACTIVE')
        self.assertEqual(service['launchType'], 'FARGATE')
        self.assertEqual(service['desiredCount'], 2)

    def test_alb_exists_and_configured(self):
        """Test Application Load Balancer exists with correct configuration."""
        alb_arn = self.outputs['alb_arn']

        response = self.elbv2_client.describe_load_balancers(LoadBalancerArns=[alb_arn])

        self.assertEqual(len(response['LoadBalancers']), 1)
        alb = response['LoadBalancers'][0]

        self.assertEqual(alb['State']['Code'], 'active')
        self.assertEqual(alb['Type'], 'application')
        self.assertEqual(alb['Scheme'], 'internet-facing')

    def test_target_groups_exist(self):
        """Test blue and green target groups exist."""
        blue_tg_arn = self.outputs['target_group_blue_arn']
        green_tg_arn = self.outputs['target_group_green_arn']

        response = self.elbv2_client.describe_target_groups(
            TargetGroupArns=[blue_tg_arn, green_tg_arn]
        )

        self.assertEqual(len(response['TargetGroups']), 2)

        for tg in response['TargetGroups']:
            self.assertEqual(tg['Protocol'], 'HTTP')
            self.assertEqual(tg['Port'], 8000)
            self.assertEqual(tg['TargetType'], 'ip')
            self.assertEqual(tg['HealthCheckPath'], '/health')

    def test_s3_buckets_exist_and_versioned(self):
        """Test S3 buckets exist with versioning enabled."""
        frontend_bucket = self.outputs['frontend_bucket_name']
        alb_logs_bucket = self.outputs['alb_logs_bucket_name']
        flow_logs_bucket = self.outputs['flow_logs_bucket_name']

        for bucket_name in [frontend_bucket, alb_logs_bucket, flow_logs_bucket]:
            # Check bucket exists
            try:
                self.s3_client.head_bucket(Bucket=bucket_name)
            except ClientError:
                self.fail(f"Bucket {bucket_name} does not exist")

            # Check versioning is enabled
            versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
            self.assertEqual(versioning.get('Status'), 'Enabled',
                           f"Versioning should be enabled for {bucket_name}")

    def test_cloudfront_distribution_exists(self):
        """Test CloudFront distribution exists and is deployed."""
        distribution_id = self.outputs['cloudfront_distribution_id']

        response = self.cloudfront_client.get_distribution(Id=distribution_id)

        distribution = response['Distribution']
        self.assertEqual(distribution['Status'], 'Deployed')
        self.assertTrue(distribution['DistributionConfig']['Enabled'])

    def test_cloudwatch_log_groups_exist(self):
        """Test CloudWatch log groups exist with correct retention."""
        ecs_log_group = self.outputs['ecs_log_group_name']
        alb_log_group = self.outputs['alb_log_group_name']

        for log_group_name in [ecs_log_group, alb_log_group]:
            response = self.logs_client.describe_log_groups(
                logGroupNamePrefix=log_group_name
            )

            matching_groups = [g for g in response['logGroups'] if g['logGroupName'] == log_group_name]
            self.assertEqual(len(matching_groups), 1, f"Log group {log_group_name} should exist")

            log_group = matching_groups[0]
            self.assertEqual(log_group['retentionInDays'], 90)

    def test_alb_dns_resolution(self):
        """Test ALB DNS name resolves."""
        alb_dns = self.outputs['alb_dns_name']

        # Verify DNS format
        self.assertIn('.elb.amazonaws.com', alb_dns)

        # Verify ALB is accessible via describe (doesn't test actual HTTP connectivity)
        alb_arn = self.outputs['alb_arn']
        response = self.elbv2_client.describe_load_balancers(LoadBalancerArns=[alb_arn])
        self.assertEqual(len(response['LoadBalancers']), 1)

    def test_cloudfront_domain_resolution(self):
        """Test CloudFront domain name is valid."""
        cloudfront_domain = self.outputs['cloudfront_domain_name']

        # Verify domain format
        self.assertIn('.cloudfront.net', cloudfront_domain)

        # Verify distribution exists
        distribution_id = self.outputs['cloudfront_distribution_id']
        response = self.cloudfront_client.get_distribution(Id=distribution_id)
        self.assertIsNotNone(response['Distribution'])

    def test_environment_suffix_in_resource_names(self):
        """Test environment suffix is used in resource naming."""
        env_suffix = self.outputs['environment_suffix']

        # Check VPC ID is retrievable (suffix should be in tags/name)
        vpc_id = self.outputs['vpc_id']
        self.assertIsNotNone(vpc_id)

        # Check ECS cluster name contains suffix
        cluster_name = self.outputs['ecs_cluster_name']
        self.assertIn(env_suffix, cluster_name)

        # Check bucket names contain suffix
        for bucket_key in ['frontend_bucket_name', 'alb_logs_bucket_name', 'flow_logs_bucket_name']:
            bucket_name = self.outputs[bucket_key]
            self.assertIn(env_suffix, bucket_name)

    def test_rds_connectivity_through_security_groups(self):
        """Test RDS is properly secured and not publicly accessible."""
        rds_endpoint = self.outputs['rds_endpoint']
        db_identifier = rds_endpoint.split('.')[0]

        response = self.rds_client.describe_db_instances(DBInstanceIdentifier=db_identifier)
        db_instance = response['DBInstances'][0]

        # Verify RDS is not publicly accessible
        self.assertFalse(db_instance['PubliclyAccessible'],
                        "RDS should not be publicly accessible")


if __name__ == '__main__':
    unittest.main()
