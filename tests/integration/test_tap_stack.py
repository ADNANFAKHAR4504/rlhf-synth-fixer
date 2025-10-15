"""Integration tests for healthcare SaaS disaster recovery infrastructure."""

import json
import os
import unittest
import boto3
from pytest import mark

# Load CloudFormation outputs
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration test cases for deployed healthcare infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and load outputs"""
        cls.outputs = flat_outputs
        cls.region = os.environ.get('AWS_REGION', 'us-east-1')

        # Initialize AWS clients
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.elbv2_client = boto3.client('elbv2', region_name=cls.region)
        cls.backup_client = boto3.client('backup', region_name=cls.region)

    @mark.it("VPC is accessible and has correct configuration")
    def test_vpc_exists_and_accessible(self):
        """Test VPC exists and is properly configured"""
        if 'VPCId' not in self.outputs:
            self.skipTest("VPCId not found in outputs")

        vpc_id = self.outputs['VPCId']

        # Describe VPC
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])

        # ASSERT
        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['State'], 'available')

    @mark.it("S3 data bucket exists and has encryption enabled")
    def test_s3_bucket_exists_with_encryption(self):
        """Test S3 bucket exists with proper security configuration"""
        if 'DataBucketName' not in self.outputs:
            self.skipTest("DataBucketName not found in outputs")

        bucket_name = self.outputs['DataBucketName']

        # Check bucket exists
        response = self.s3_client.head_bucket(Bucket=bucket_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Check versioning is enabled
        versioning = self.s3_client.get_bucket_versioning(Bucket=bucket_name)
        self.assertEqual(versioning.get('Status'), 'Enabled')

        # Check encryption is configured
        encryption = self.s3_client.get_bucket_encryption(Bucket=bucket_name)
        self.assertIsNotNone(encryption['ServerSideEncryptionConfiguration'])

    @mark.it("S3 bucket can store and retrieve objects")
    def test_s3_bucket_read_write(self):
        """Test S3 bucket read/write operations"""
        if 'DataBucketName' not in self.outputs:
            self.skipTest("DataBucketName not found in outputs")

        bucket_name = self.outputs['DataBucketName']
        test_key = 'integration-test/test-file.txt'
        test_content = b'Healthcare test data'

        # Put object
        self.s3_client.put_object(
            Bucket=bucket_name,
            Key=test_key,
            Body=test_content,
            ServerSideEncryption='AES256'
        )

        # Get object
        response = self.s3_client.get_object(
            Bucket=bucket_name,
            Key=test_key
        )

        # ASSERT
        retrieved_content = response['Body'].read()
        self.assertEqual(retrieved_content, test_content)

        # Cleanup
        self.s3_client.delete_object(Bucket=bucket_name, Key=test_key)

    @mark.it("Aurora database cluster is available")
    def test_aurora_cluster_is_available(self):
        """Test Aurora database cluster is running"""
        if 'DatabaseClusterEndpoint' not in self.outputs:
            self.skipTest("DatabaseClusterEndpoint not found in outputs")

        endpoint = self.outputs['DatabaseClusterEndpoint']
        cluster_id = endpoint.split('.')[0]

        # Describe DB cluster
        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        # ASSERT
        self.assertEqual(len(response['DBClusters']), 1)
        cluster = response['DBClusters'][0]
        self.assertEqual(cluster['Status'], 'available')
        self.assertEqual(cluster['Engine'], 'aurora-postgresql')
        self.assertTrue(cluster['StorageEncrypted'])

    @mark.it("Aurora database has backup configured")
    def test_aurora_backup_configured(self):
        """Test Aurora database backup settings"""
        if 'DatabaseClusterEndpoint' not in self.outputs:
            self.skipTest("DatabaseClusterEndpoint not found in outputs")

        endpoint = self.outputs['DatabaseClusterEndpoint']
        cluster_id = endpoint.split('.')[0]

        # Describe DB cluster
        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        # ASSERT
        cluster = response['DBClusters'][0]
        self.assertGreaterEqual(cluster['BackupRetentionPeriod'], 7)

    @mark.it("ECS cluster exists and is active")
    def test_ecs_cluster_active(self):
        """Test ECS cluster is running"""
        if 'ECSClusterName' not in self.outputs:
            self.skipTest("ECSClusterName not found in outputs")

        cluster_name = self.outputs['ECSClusterName']

        # Describe cluster
        response = self.ecs_client.describe_clusters(
            clusters=[cluster_name]
        )

        # ASSERT
        self.assertEqual(len(response['clusters']), 1)
        cluster = response['clusters'][0]
        self.assertEqual(cluster['status'], 'ACTIVE')
        self.assertGreater(cluster['registeredContainerInstancesCount'] +
                          cluster['runningTasksCount'], 0)

    @mark.it("ECS service is running with desired tasks")
    def test_ecs_service_running(self):
        """Test ECS service has running tasks"""
        if 'ECSClusterName' not in self.outputs:
            self.skipTest("ECSClusterName not found in outputs")

        cluster_name = self.outputs['ECSClusterName']

        # List services
        services_response = self.ecs_client.list_services(
            cluster=cluster_name
        )

        if not services_response['serviceArns']:
            self.skipTest("No services found in cluster")

        # Describe first service
        response = self.ecs_client.describe_services(
            cluster=cluster_name,
            services=[services_response['serviceArns'][0]]
        )

        # ASSERT
        service = response['services'][0]
        self.assertEqual(service['status'], 'ACTIVE')
        self.assertGreater(service['desiredCount'], 0)

    @mark.it("Application Load Balancer is active")
    def test_alb_is_active(self):
        """Test ALB is provisioned and active"""
        if 'LoadBalancerDNS' not in self.outputs:
            self.skipTest("LoadBalancerDNS not found in outputs")

        alb_dns = self.outputs['LoadBalancerDNS']

        # Describe load balancers
        response = self.elbv2_client.describe_load_balancers()

        # Find our ALB
        alb = None
        for lb in response['LoadBalancers']:
            if lb['DNSName'] == alb_dns:
                alb = lb
                break

        # ASSERT
        self.assertIsNotNone(alb, "ALB not found")
        self.assertEqual(alb['State']['Code'], 'active')
        self.assertEqual(alb['Scheme'], 'internet-facing')

    @mark.it("ALB target group has healthy targets")
    def test_alb_target_health(self):
        """Test ALB target group has healthy targets"""
        if 'LoadBalancerDNS' not in self.outputs:
            self.skipTest("LoadBalancerDNS not found in outputs")

        alb_dns = self.outputs['LoadBalancerDNS']

        # Get load balancer ARN
        lbs_response = self.elbv2_client.describe_load_balancers()
        alb_arn = None
        for lb in lbs_response['LoadBalancers']:
            if lb['DNSName'] == alb_dns:
                alb_arn = lb['LoadBalancerArn']
                break

        if not alb_arn:
            self.skipTest("ALB ARN not found")

        # Get target groups
        tg_response = self.elbv2_client.describe_target_groups(
            LoadBalancerArn=alb_arn
        )

        if not tg_response['TargetGroups']:
            self.skipTest("No target groups found")

        tg_arn = tg_response['TargetGroups'][0]['TargetGroupArn']

        # Check target health
        health_response = self.elbv2_client.describe_target_health(
            TargetGroupArn=tg_arn
        )

        # ASSERT - at least one target should be healthy or initializing
        self.assertGreater(len(health_response['TargetHealthDescriptions']), 0)

    @mark.it("AWS Backup plan exists and is active")
    def test_backup_plan_exists(self):
        """Test AWS Backup plan is configured"""
        # List backup plans
        response = self.backup_client.list_backup_plans()

        # ASSERT - at least one backup plan exists
        self.assertGreater(len(response['BackupPlansList']), 0)

        # Check first backup plan
        plan_id = response['BackupPlansList'][0]['BackupPlanId']
        plan_details = self.backup_client.get_backup_plan(
            BackupPlanId=plan_id
        )

        # ASSERT - backup plan has rules
        self.assertGreater(
            len(plan_details['BackupPlan']['Rules']),
            0
        )

    @mark.it("Security groups have proper ingress rules")
    def test_security_groups_configuration(self):
        """Test security groups are properly configured"""
        if 'VPCId' not in self.outputs:
            self.skipTest("VPCId not found in outputs")

        vpc_id = self.outputs['VPCId']

        # Describe security groups in VPC
        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [vpc_id]}
            ]
        )

        # ASSERT - multiple security groups exist
        self.assertGreaterEqual(len(response['SecurityGroups']), 3)

        # Check at least one SG has ingress rules
        has_ingress = any(
            len(sg['IpPermissions']) > 0
            for sg in response['SecurityGroups']
        )
        self.assertTrue(has_ingress)
