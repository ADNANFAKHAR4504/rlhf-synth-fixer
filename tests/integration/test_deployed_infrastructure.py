"""
Integration tests for deployed fraud detection infrastructure
Uses actual stack outputs from cfn-outputs/flat-outputs.json
"""

import unittest
import json
import os
import boto3
from botocore.exceptions import ClientError


class TestDeployedInfrastructure(unittest.TestCase):
    """
    Integration tests that validate the actual deployed AWS resources
    """

    @classmethod
    def setUpClass(cls):
        """Load stack outputs once for all tests"""
        outputs_path = os.path.join(os.path.dirname(__file__), '..', '..', 'cfn-outputs', 'flat-outputs.json')
        with open(outputs_path, 'r') as f:
            cls.outputs = json.load(f)

        cls.region = cls.outputs.get('region', 'eu-west-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.sns_client = boto3.client('sns', region_name=cls.region)
        cls.cloudwatch_client = boto3.client('cloudwatch', region_name=cls.region)

    def test_vpc_exists(self):
        """Test that VPC exists and is available"""
        vpc_id = self.outputs['vpc_id']
        self.assertIsNotNone(vpc_id)

        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)
        self.assertEqual(response['Vpcs'][0]['State'], 'available')

    def test_alb_exists_and_accessible(self):
        """Test that ALB exists and is in active state"""
        alb_arn = self.outputs['alb_arn']
        alb_dns = self.outputs['alb_dns_name']

        self.assertIsNotNone(alb_arn)
        self.assertIsNotNone(alb_dns)

        response = self.elbv2_client.describe_load_balancers(LoadBalancerArns=[alb_arn])
        self.assertEqual(len(response['LoadBalancers']), 1)
        self.assertEqual(response['LoadBalancers'][0]['State']['Code'], 'active')

    def test_ecs_cluster_exists(self):
        """Test that ECS cluster exists and is active"""
        cluster_arn = self.outputs['ecs_cluster_arn']
        cluster_name = self.outputs['ecs_cluster_name']

        self.assertIsNotNone(cluster_arn)
        self.assertIsNotNone(cluster_name)

        response = self.ecs_client.describe_clusters(clusters=[cluster_arn])
        self.assertEqual(len(response['clusters']), 1)
        self.assertEqual(response['clusters'][0]['status'], 'ACTIVE')

    def test_aurora_cluster_exists(self):
        """Test that Aurora cluster exists and is available"""
        cluster_arn = self.outputs['aurora_cluster_arn']
        cluster_endpoint = self.outputs['aurora_endpoint']

        self.assertIsNotNone(cluster_arn)
        self.assertIsNotNone(cluster_endpoint)

        # Extract cluster identifier from ARN
        cluster_id = cluster_arn.split(':')[-1].replace('cluster:', '')

        response = self.rds_client.describe_db_clusters(DBClusterIdentifier=cluster_id)
        self.assertEqual(len(response['DBClusters']), 1)
        self.assertEqual(response['DBClusters'][0]['Status'], 'available')

    def test_dynamodb_table_exists(self):
        """Test that DynamoDB table exists and is active"""
        table_name = self.outputs['dynamodb_table_name']
        table_arn = self.outputs['dynamodb_table_arn']

        self.assertIsNotNone(table_name)
        self.assertIsNotNone(table_arn)

        response = self.dynamodb_client.describe_table(TableName=table_name)
        self.assertEqual(response['Table']['TableStatus'], 'ACTIVE')
        self.assertEqual(response['Table']['TableArn'], table_arn)

    def test_sns_topic_exists(self):
        """Test that SNS topic exists"""
        topic_arn = self.outputs['sns_topic_arn']

        self.assertIsNotNone(topic_arn)

        response = self.sns_client.get_topic_attributes(TopicArn=topic_arn)
        self.assertIsNotNone(response['Attributes'])
        self.assertEqual(response['Attributes']['TopicArn'], topic_arn)

    def test_cloudwatch_dashboard_exists(self):
        """Test that CloudWatch dashboard exists"""
        dashboard_name = self.outputs['dashboard_name']

        self.assertIsNotNone(dashboard_name)

        response = self.cloudwatch_client.get_dashboard(DashboardName=dashboard_name)
        self.assertIsNotNone(response['DashboardBody'])

    def test_environment_is_dev(self):
        """Test that environment is correctly set to dev"""
        environment = self.outputs['environment']
        self.assertEqual(environment, 'dev')

    def test_region_is_eu_west_1(self):
        """Test that region is correctly set to eu-west-1"""
        region = self.outputs['region']
        self.assertEqual(region, 'eu-west-1')


if __name__ == "__main__":
    unittest.main()
