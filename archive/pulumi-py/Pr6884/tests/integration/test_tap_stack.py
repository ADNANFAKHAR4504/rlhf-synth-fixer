"""
test_tap_stack_integration.py

Integration tests for live deployed TapStack Pulumi infrastructure.
Tests actual AWS resources created by the Pulumi stack.
"""

import unittest
import json
import os
import boto3
from botocore.exceptions import ClientError


class TestTapStackLiveIntegration(unittest.TestCase):
    """Integration tests against live deployed Pulumi stack."""

    @classmethod
    def setUpClass(cls):
        """Set up integration test with live stack outputs."""
        # Load outputs from flat-outputs.json
        outputs_path = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(__file__))),
            'cfn-outputs',
            'flat-outputs.json'
        )

        with open(outputs_path, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # AWS clients
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.dynamodb_client = boto3.client('dynamodb', region_name=cls.region)
        cls.cloudfront_client = boto3.client('cloudfront', region_name='us-east-1')

    def test_outputs_structure(self):
        """Test that all required outputs are present."""
        required_outputs = [
            'ALBDnsName',
            'CloudFrontDomainName',
            'RDSClusterEndpoint',
            'DynamoDBTableName',
            'VPCId',
            'ECSClusterName',
            'ECSServiceName',
            'TargetGroupArn'
        ]

        for output in required_outputs:
            self.assertIn(output, self.outputs, f"Missing output: {output}")
            self.assertIsNotNone(self.outputs[output], f"Output {output} is None")
            self.assertNotEqual(self.outputs[output], '', f"Output {output} is empty")

    def test_vpc_exists(self):
        """Test VPC exists and is available."""
        vpc_id = self.outputs['VPCId']

        try:
            response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
            self.assertEqual(len(response['Vpcs']), 1)
            vpc = response['Vpcs'][0]
            self.assertEqual(vpc['State'], 'available')
            self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')
        except ClientError as e:
            self.fail(f"VPC not found: {e}")

    def test_alb_exists_and_healthy(self):
        """Test ALB exists and is in active state."""
        alb_dns = self.outputs['ALBDnsName']

        try:
            # Get ALB by DNS name
            response = self.elbv2_client.describe_load_balancers()
            albs = [lb for lb in response['LoadBalancers']
                    if lb['DNSName'] == alb_dns]

            self.assertEqual(len(albs), 1, "ALB not found")
            alb = albs[0]
            self.assertEqual(alb['State']['Code'], 'active')
            self.assertEqual(alb['Scheme'], 'internet-facing')
            self.assertEqual(alb['Type'], 'application')
        except ClientError as e:
            self.fail(f"ALB not found: {e}")

    def test_target_group_exists(self):
        """Test Target Group exists with correct configuration."""
        target_group_arn = self.outputs['TargetGroupArn']

        try:
            response = self.elbv2_client.describe_target_groups(
                TargetGroupArns=[target_group_arn]
            )
            self.assertEqual(len(response['TargetGroups']), 1)
            tg = response['TargetGroups'][0]
            self.assertEqual(tg['Protocol'], 'HTTP')
            self.assertEqual(tg['Port'], 8080)
            self.assertEqual(tg['TargetType'], 'ip')
        except ClientError as e:
            self.fail(f"Target Group not found: {e}")

    def test_ecs_cluster_exists(self):
        """Test ECS cluster exists and is active."""
        cluster_name = self.outputs['ECSClusterName']

        try:
            response = self.ecs_client.describe_clusters(clusters=[cluster_name])
            self.assertEqual(len(response['clusters']), 1)
            cluster = response['clusters'][0]
            self.assertEqual(cluster['status'], 'ACTIVE')
            self.assertIn('capacityProviders', cluster)
        except ClientError as e:
            self.fail(f"ECS Cluster not found: {e}")

    def test_ecs_service_exists(self):
        """Test ECS service exists and is running."""
        cluster_name = self.outputs['ECSClusterName']
        service_name = self.outputs['ECSServiceName']

        try:
            response = self.ecs_client.describe_services(
                cluster=cluster_name,
                services=[service_name]
            )
            self.assertEqual(len(response['services']), 1)
            service = response['services'][0]
            self.assertEqual(service['status'], 'ACTIVE')
            self.assertEqual(service['launchType'], 'FARGATE')
            self.assertEqual(service['desiredCount'], 2)
        except ClientError as e:
            self.fail(f"ECS Service not found: {e}")

    def test_rds_cluster_exists(self):
        """Test RDS Aurora cluster exists and is available."""
        # Extract cluster identifier from endpoint
        endpoint = self.outputs['RDSClusterEndpoint']
        cluster_id = endpoint.split('.')[0]

        try:
            response = self.rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            self.assertEqual(len(response['DBClusters']), 1)
            cluster = response['DBClusters'][0]
            self.assertEqual(cluster['Status'], 'available')
            self.assertEqual(cluster['Engine'], 'aurora-postgresql')
            self.assertEqual(cluster['EngineMode'], 'provisioned')
            self.assertIn('ServerlessV2ScalingConfiguration',
cluster)
        except ClientError as e:
            self.fail(f"RDS Cluster not found: {e}")

    def test_dynamodb_table_exists(self):
        """Test DynamoDB table exists with correct configuration."""
        table_name = self.outputs['DynamoDBTableName']

        try:
            response = self.dynamodb_client.describe_table(TableName=table_name)
            table = response['Table']
            self.assertEqual(table['TableStatus'], 'ACTIVE')
            self.assertEqual(table['BillingModeSummary']['BillingMode'], 'PAY_PER_REQUEST')

            # Check TTL is enabled
            ttl_response = self.dynamodb_client.describe_time_to_live(TableName=table_name)
            self.assertEqual(ttl_response['TimeToLiveDescription']['TimeToLiveStatus'], 'ENABLED')
        except ClientError as e:
            self.fail(f"DynamoDB Table not found: {e}")

    def test_cloudfront_distribution_exists(self):
        """Test CloudFront distribution exists and is deployed."""
        domain_name = self.outputs['CloudFrontDomainName']

        try:
            # List all distributions and find ours
            response = self.cloudfront_client.list_distributions()
            if 'DistributionList' in response and 'Items' in response['DistributionList']:
                distributions = [d for d in response['DistributionList']['Items']
                                 if d['DomainName'] == domain_name]

                self.assertEqual(len(distributions), 1, "CloudFront distribution not found")
                dist = distributions[0]
                self.assertEqual(dist['Status'], 'Deployed')
                self.assertTrue(dist['Enabled'])
        except ClientError as e:
            self.fail(f"CloudFront Distribution not found: {e}")

    def test_environment_suffix_in_resources(self):
        """Test that all resources include environment suffix."""
        # Check that resource names contain environment suffix
        cluster_name = self.outputs['ECSClusterName']
        service_name = self.outputs['ECSServiceName']
        table_name = self.outputs['DynamoDBTableName']

        # Extract common prefix pattern (e.g., "pr6884", "synth101912383", etc.)
        # All resources should have a consistent suffix pattern
        # Check that names follow the pattern: ml-api-{resource}-{suffix}
        self.assertTrue(cluster_name.startswith('ml-api-cluster-'))
        self.assertTrue(service_name.startswith('ml-api-service-'))
        self.assertTrue(table_name.startswith('ml-api-sessions-'))
        
        # Verify they all have a suffix (non-empty after the prefix)
        cluster_suffix = cluster_name.replace('ml-api-cluster-', '')
        service_suffix = service_name.replace('ml-api-service-', '')
        table_suffix = table_name.replace('ml-api-sessions-', '')
        
        self.assertGreater(len(cluster_suffix), 0, "Cluster name missing suffix")
        self.assertGreater(len(service_suffix), 0, "Service name missing suffix")
        self.assertGreater(len(table_suffix), 0, "Table name missing suffix")

    def test_vpc_has_public_and_private_subnets(self):
        """Test VPC has both public and private subnets."""
        vpc_id = self.outputs['VPCId']

        try:
            response = self.ec2_client.describe_subnets(
                Filters=[{'Name': 'vpc-id', 'Values': [vpc_id]}]
            )

            subnets = response['Subnets']
            self.assertGreaterEqual(len(subnets), 6, "Expected at least 6 subnets (3 public + 3 private)")

            # Check for public and private subnets
            public_subnets = [s for s in subnets if s.get('MapPublicIpOnLaunch', False)]
            private_subnets = [s for s in subnets if not s.get('MapPublicIpOnLaunch', False)]

            self.assertGreaterEqual(len(public_subnets), 3)
            self.assertGreaterEqual(len(private_subnets), 3)
        except ClientError as e:
            self.fail(f"Subnets not found: {e}")

    def test_alb_listener_rules_exist(self):
        """Test ALB has listener rules for path-based routing."""
        alb_dns = self.outputs['ALBDnsName']

        try:
            # Get ALB ARN
            response = self.elbv2_client.describe_load_balancers()
            albs = [lb for lb in response['LoadBalancers'] if lb['DNSName'] == alb_dns]
            self.assertEqual(len(albs), 1)
            alb_arn = albs[0]['LoadBalancerArn']

            # Get listeners
            listeners_response = self.elbv2_client.describe_listeners(LoadBalancerArn=alb_arn)
            self.assertGreater(len(listeners_response['Listeners']), 0)

            listener_arn = listeners_response['Listeners'][0]['ListenerArn']

            # Get rules
            rules_response = self.elbv2_client.describe_rules(ListenerArn=listener_arn)
            # Should have at least default rule + 2 path-based rules (v1, v2)
            self.assertGreaterEqual(len(rules_response['Rules']), 3)
        except ClientError as e:
            self.fail(f"ALB listener rules not found: {e}")


if __name__ == '__main__':
    unittest.main()
