"""Integration tests for transaction processing infrastructure."""
import json
import os
import time
import unittest

import boto3


class TestTapStackIntegrationTest(unittest.TestCase):
    """Integration tests using actual deployed AWS resources."""

    @classmethod
    def setUpClass(cls):
        """Load stack outputs and initialize AWS clients."""
        outputs_path = os.path.join(
            os.path.dirname(__file__), '..', '..', 'cfn-outputs', 'flat-outputs.json'
        )

        with open(outputs_path, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        cls.region = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')
        cls.ec2 = boto3.client('ec2', region_name=cls.region)
        cls.s3 = boto3.client('s3', region_name=cls.region)
        cls.rds = boto3.client('rds', region_name=cls.region)
        cls.elbv2 = boto3.client('elbv2', region_name=cls.region)
        cls.ecs = boto3.client('ecs', region_name=cls.region)
        cls.iam = boto3.client('iam', region_name=cls.region)
        cls.logs = boto3.client('logs', region_name=cls.region)

    def test_vpc_exists_and_accessible(self):
        """Test that VPC exists and is accessible."""
        vpc_id = self.outputs['vpc_id']
        self.assertIsNotNone(vpc_id)

        response = self.ec2.describe_vpcs(VpcIds=[vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)
        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

    def test_s3_buckets_exist(self):
        """Test that S3 buckets exist and are accessible."""
        app_logs_bucket = self.outputs['app_logs_bucket']
        transaction_bucket = self.outputs['transaction_data_bucket']

        # Test app logs bucket
        response = self.s3.head_bucket(Bucket=app_logs_bucket)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Test transaction data bucket
        response = self.s3.head_bucket(Bucket=transaction_bucket)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    def test_s3_buckets_have_encryption(self):
        """Test that S3 buckets have encryption enabled."""
        app_logs_bucket = self.outputs['app_logs_bucket']

        response = self.s3.get_bucket_encryption(Bucket=app_logs_bucket)
        rules = response['ServerSideEncryptionConfiguration']['Rules']
        self.assertGreater(len(rules), 0)
        self.assertEqual(
            rules[0]['ApplyServerSideEncryptionByDefault']['SSEAlgorithm'],
            'AES256'
        )

    def test_target_group_exists(self):
        """Test that ALB target group exists."""
        tg_arn = self.outputs['alb_target_group_arn']
        self.assertIsNotNone(tg_arn)

        response = self.elbv2.describe_target_groups(
            TargetGroupArns=[tg_arn]
        )

        self.assertEqual(len(response['TargetGroups']), 1)
        tg = response['TargetGroups'][0]
        self.assertEqual(tg['Protocol'], 'HTTP')
        self.assertEqual(tg['Port'], 8080)
        self.assertEqual(tg['TargetType'], 'ip')

    def test_target_group_has_health_check(self):
        """Test that target group has health check configured."""
        tg_arn = self.outputs['alb_target_group_arn']

        response = self.elbv2.describe_target_groups(
            TargetGroupArns=[tg_arn]
        )

        tg = response['TargetGroups'][0]
        self.assertEqual(tg['HealthCheckPath'], '/health')
        self.assertEqual(tg['HealthCheckProtocol'], 'HTTP')
        self.assertIsNotNone(tg['HealthyThresholdCount'])

    def test_ecs_cluster_exists(self):
        """Test that ECS cluster exists."""
        cluster_name = self.outputs['ecs_cluster_name']
        self.assertIsNotNone(cluster_name)

        response = self.ecs.describe_clusters(clusters=[cluster_name])

        self.assertEqual(len(response['clusters']), 1)
        cluster = response['clusters'][0]
        self.assertEqual(cluster['status'], 'ACTIVE')
        self.assertEqual(cluster['clusterName'], cluster_name)

    def test_iam_roles_exist(self):
        """Test that ECS IAM roles exist."""
        task_role_arn = self.outputs['ecs_task_role_arn']
        execution_role_arn = self.outputs['ecs_task_execution_role_arn']

        self.assertIsNotNone(task_role_arn)
        self.assertIsNotNone(execution_role_arn)

        # Extract role names from ARNs
        task_role_name = task_role_arn.split('/')[-1]
        execution_role_name = execution_role_arn.split('/')[-1]

        # Verify task role
        response = self.iam.get_role(RoleName=task_role_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

        # Verify execution role
        response = self.iam.get_role(RoleName=execution_role_name)
        self.assertEqual(response['ResponseMetadata']['HTTPStatusCode'], 200)

    def test_iam_task_role_has_s3_permissions(self):
        """Test that ECS task role has S3 permissions."""
        task_role_arn = self.outputs['ecs_task_role_arn']
        task_role_name = task_role_arn.split('/')[-1]

        response = self.iam.list_role_policies(RoleName=task_role_name)
        self.assertGreater(
            len(response['PolicyNames']), 0,
            "Task role should have inline policies"
        )

        # Get policy document
        policy_name = response['PolicyNames'][0]
        policy_response = self.iam.get_role_policy(
            RoleName=task_role_name,
            PolicyName=policy_name
        )

        policy_doc = policy_response['PolicyDocument']

        # Check for S3 permissions
        s3_actions = []
        for statement in policy_doc['Statement']:
            if isinstance(statement['Action'], list):
                s3_actions.extend([a for a in statement['Action'] if 's3:' in a])
            elif 's3:' in statement['Action']:
                s3_actions.append(statement['Action'])

        self.assertGreater(len(s3_actions), 0, "Should have S3 permissions")

    def test_security_group_exists(self):
        """Test that ECS security group exists."""
        sg_id = self.outputs['ecs_security_group_id']
        self.assertIsNotNone(sg_id)

        response = self.ec2.describe_security_groups(GroupIds=[sg_id])
        self.assertEqual(len(response['SecurityGroups']), 1)

        sg = response['SecurityGroups'][0]
        self.assertGreater(len(sg['IpPermissions']), 0,
                          "Security group should have ingress rules")

    def test_all_outputs_are_non_empty(self):
        """Test that all outputs have values."""
        required_outputs = [
            'vpc_id',
            'alb_dns_name',
            'rds_endpoint',
            'rds_reader_endpoint',
            'app_logs_bucket',
            'transaction_data_bucket',
            'ecs_cluster_name',
            'ecs_task_role_arn',
            'ecs_task_execution_role_arn',
            'ecs_security_group_id',
            'alb_target_group_arn',
            'private_subnet_ids'
        ]

        for output_name in required_outputs:
            self.assertIn(output_name, self.outputs,
                         f"Output {output_name} should exist")
            value = self.outputs[output_name]
            self.assertIsNotNone(value,
                                f"Output {output_name} should not be None")
            if isinstance(value, str):
                self.assertNotEqual(value, '',
                                   f"Output {output_name} should not be empty")
            elif isinstance(value, list):
                self.assertGreater(len(value), 0,
                                  f"Output {output_name} should not be empty list")


if __name__ == "__main__":
    unittest.main()
