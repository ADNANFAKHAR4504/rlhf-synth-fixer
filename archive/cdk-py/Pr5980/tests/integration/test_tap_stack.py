"""
Integration tests for DisasterRecoveryStack

These tests validate the deployed infrastructure using real AWS resources.
They read outputs from cfn-outputs/flat-outputs.json which is populated
after deployment.
"""
import json
import os
import unittest

import boto3
from pytest import mark

# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("DisasterRecoveryStack Integration Tests")
class TestDisasterRecoveryStackIntegration(unittest.TestCase):
    """Integration test cases for the DisasterRecoveryStack"""

    def setUp(self):
        """Set up for integration tests"""
        self.outputs = flat_outputs
        self.region = os.getenv('AWS_REGION', 'us-east-1')

    @mark.it("validates VPC exists and is properly configured")
    def test_vpc_exists(self):
        """Test that VPC exists with correct configuration"""
        if 'VpcId' not in self.outputs:
            self.skipTest("VPC ID not in outputs - stack may not be deployed")

        ec2_client = boto3.client('ec2', region_name=self.region)
        vpc_id = self.outputs['VpcId']

        # Verify VPC exists
        vpcs = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(vpcs['Vpcs']), 1)
        vpc = vpcs['Vpcs'][0]

        # Verify VPC has correct tags
        self.assertIsNotNone(vpc['Tags'])
        name_tag = next((t for t in vpc['Tags'] if t['Key'] == 'Name'), None)
        self.assertIsNotNone(name_tag)
        self.assertIn('payment-vpc', name_tag['Value'])

    @mark.it("validates Aurora database cluster is accessible")
    def test_aurora_cluster_accessible(self):
        """Test that Aurora cluster endpoint is reachable"""
        if 'DatabaseEndpoint' not in self.outputs and 'DatabaseEndpointDR' not in self.outputs:
            self.skipTest("Database endpoint not in outputs - stack may not be deployed")

        rds_client = boto3.client('rds', region_name=self.region)

        # Get cluster identifier from environment or outputs
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')
        cluster_id = f"payment-db-{env_suffix}"

        # Verify cluster exists
        try:
            response = rds_client.describe_db_clusters(
                DBClusterIdentifier=cluster_id
            )
            self.assertEqual(len(response['DBClusters']), 1)
            cluster = response['DBClusters'][0]

            # Verify cluster is encrypted
            self.assertTrue(cluster['StorageEncrypted'])

            # Verify cluster has correct engine
            self.assertEqual(cluster['Engine'], 'aurora-postgresql')

        except rds_client.exceptions.DBClusterNotFoundFault:
            self.fail(f"Aurora cluster {cluster_id} not found")

    @mark.it("validates ECS cluster exists and has services")
    def test_ecs_cluster_has_services(self):
        """Test that ECS cluster exists with running services"""
        if 'ClusterName' not in self.outputs:
            self.skipTest("Cluster name not in outputs - stack may not be deployed")

        ecs_client = boto3.client('ecs', region_name=self.region)
        cluster_name = self.outputs['ClusterName']

        # Verify cluster exists
        clusters = ecs_client.describe_clusters(clusters=[cluster_name])
        self.assertEqual(len(clusters['clusters']), 1)
        cluster = clusters['clusters'][0]
        self.assertEqual(cluster['status'], 'ACTIVE')

        # Verify cluster has services
        services = ecs_client.list_services(cluster=cluster_name)
        self.assertGreater(len(services['serviceArns']), 0,
                          "Cluster should have at least one service")

    @mark.it("validates ALB is healthy and accessible")
    def test_alb_is_healthy(self):
        """Test that Application Load Balancer is healthy"""
        if 'LoadBalancerDNS' not in self.outputs:
            self.skipTest("ALB DNS not in outputs - stack may not be deployed")

        elbv2_client = boto3.client('elbv2', region_name=self.region)
        alb_dns = self.outputs['LoadBalancerDNS']

        # Find ALB by DNS name
        load_balancers = elbv2_client.describe_load_balancers()
        alb = next((lb for lb in load_balancers['LoadBalancers']
                   if lb['DNSName'] == alb_dns), None)

        self.assertIsNotNone(alb, f"ALB with DNS {alb_dns} not found")
        self.assertEqual(alb['State']['Code'], 'active')
        self.assertEqual(alb['Scheme'], 'internet-facing')
        self.assertEqual(alb['Type'], 'application')

        # Check target groups
        target_groups = elbv2_client.describe_target_groups(
            LoadBalancerArn=alb['LoadBalancerArn']
        )
        self.assertGreater(len(target_groups['TargetGroups']), 0,
                          "ALB should have at least one target group")

    @mark.it("validates Lambda function exists and is configured correctly")
    def test_lambda_function_exists(self):
        """Test that Lambda function exists with correct configuration"""
        if 'LambdaFunctionArn' not in self.outputs:
            self.skipTest("Lambda ARN not in outputs - stack may not be deployed")

        lambda_client = boto3.client('lambda', region_name=self.region)
        function_arn = self.outputs['LambdaFunctionArn']
        function_name = function_arn.split(':')[-1]

        # Get function configuration
        response = lambda_client.get_function(FunctionName=function_name)
        config = response['Configuration']

        # Verify function configuration
        self.assertEqual(config['Runtime'], 'python3.11')
        self.assertEqual(config['Handler'], 'index.handler')
        self.assertEqual(config['Timeout'], 30)
        self.assertEqual(config['MemorySize'], 512)
        self.assertIn('payment-validation', config['FunctionName'])

    @mark.it("validates S3 bucket exists with versioning enabled")
    def test_s3_bucket_versioning(self):
        """Test that S3 bucket exists with versioning enabled"""
        bucket_key = 'LogBucketName' if 'LogBucketName' in self.outputs else 'LogBucketNameDR'
        if bucket_key not in self.outputs:
            self.skipTest("S3 bucket name not in outputs - stack may not be deployed")

        s3_client = boto3.client('s3', region_name=self.region)
        bucket_name = self.outputs[bucket_key]

        # Verify bucket exists
        try:
            s3_client.head_bucket(Bucket=bucket_name)
        except s3_client.exceptions.NoSuchBucket:
            self.fail(f"S3 bucket {bucket_name} not found")

        # Verify versioning is enabled
        versioning = s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled',
                        "S3 bucket versioning should be enabled")

        # Verify encryption
        encryption = s3_client.get_bucket_encryption(Bucket=bucket_name)
        self.assertIn('ServerSideEncryptionConfiguration', encryption)
        self.assertGreater(len(encryption['ServerSideEncryptionConfiguration']['Rules']), 0)

    @mark.it("validates SNS topic exists and can be subscribed to")
    def test_sns_topic_exists(self):
        """Test that SNS topic exists for alerts"""
        if 'SNSTopicArn' not in self.outputs:
            self.skipTest("SNS topic ARN not in outputs - stack may not be deployed")

        sns_client = boto3.client('sns', region_name=self.region)
        topic_arn = self.outputs['SNSTopicArn']

        # Verify topic exists
        try:
            attributes = sns_client.get_topic_attributes(TopicArn=topic_arn)
            self.assertIn('Attributes', attributes)
            self.assertIn('payment-alerts', attributes['Attributes']['TopicArn'])
        except sns_client.exceptions.NotFoundException:
            self.fail(f"SNS topic {topic_arn} not found")

        # Verify topic has subscriptions
        subscriptions = sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
        self.assertGreater(len(subscriptions['Subscriptions']), 0,
                          "SNS topic should have at least one subscription")

    @mark.it("validates CloudWatch alarms exist for monitoring")
    def test_cloudwatch_alarms_exist(self):
        """Test that CloudWatch alarms are configured"""
        if not self.outputs:
            self.skipTest("No outputs available - stack may not be deployed")

        cloudwatch_client = boto3.client('cloudwatch', region_name=self.region)
        env_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'test')

        # Expected alarm names
        expected_alarms = [
            f"alb-unhealthy-targets-{env_suffix}",
            f"ecs-low-task-count-{env_suffix}"
        ]

        # Check for primary region specific alarm
        if 'DatabaseEndpoint' in self.outputs:
            expected_alarms.append(f"db-replication-lag-{env_suffix}")

        # Verify alarms exist
        alarms = cloudwatch_client.describe_alarms(
            AlarmNames=expected_alarms
        )

        found_alarms = [alarm['AlarmName'] for alarm in alarms['MetricAlarms']]
        for expected_alarm in expected_alarms:
            self.assertIn(expected_alarm, found_alarms,
                         f"Alarm {expected_alarm} should exist")

    @mark.it("validates cross-resource connectivity")
    def test_cross_resource_connectivity(self):
        """Test that resources can communicate with each other"""
        if 'VpcId' not in self.outputs or 'ClusterName' not in self.outputs:
            self.skipTest("Required outputs not available - stack may not be deployed")

        ec2_client = boto3.client('ec2', region_name=self.region)
        ecs_client = boto3.client('ecs', region_name=self.region)

        vpc_id = self.outputs['VpcId']
        cluster_name = self.outputs['ClusterName']

        # Get ECS service details
        services = ecs_client.list_services(cluster=cluster_name)
        if services['serviceArns']:
            service_details = ecs_client.describe_services(
                cluster=cluster_name,
                services=[services['serviceArns'][0]]
            )
            service = service_details['services'][0]

            # Verify service is in the correct VPC
            if 'networkConfiguration' in service:
                subnets = service['networkConfiguration']['awsvpcConfiguration']['subnets']
                if subnets:
                    subnet_info = ec2_client.describe_subnets(SubnetIds=[subnets[0]])
                    self.assertEqual(subnet_info['Subnets'][0]['VpcId'], vpc_id,
                                   "ECS service should be in the correct VPC")

    @mark.it("validates disaster recovery readiness")
    def test_disaster_recovery_readiness(self):
        """Test that disaster recovery components are in place"""
        if not self.outputs:
            self.skipTest("No outputs available - stack may not be deployed")

        # Verify we have either primary or DR endpoints
        has_primary = 'DatabaseEndpoint' in self.outputs
        has_dr = 'DatabaseEndpointDR' in self.outputs

        self.assertTrue(has_primary or has_dr,
                       "Should have at least one database endpoint (primary or DR)")

        # Verify we have ALB for failover
        self.assertIn('LoadBalancerDNS', self.outputs,
                     "Should have ALB DNS for failover routing")

        # Verify we have monitoring in place
        self.assertIn('SNSTopicArn', self.outputs,
                     "Should have SNS topic for alerts")
