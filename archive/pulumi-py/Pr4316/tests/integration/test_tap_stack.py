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
        # Load outputs from deployment - use relative path from project root
        project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        outputs_file = os.path.join(project_root, 'cfn-outputs', 'flat-outputs.json')

        if not os.path.exists(outputs_file):
            raise FileNotFoundError(f"Outputs file not found: {outputs_file}")

        with open(outputs_file, 'r', encoding='utf-8') as f:
            cls.outputs = json.load(f)

        # Initialize AWS clients
        cls.region = os.getenv('AWS_REGION', 'us-east-1')
        cls.ec2_client = boto3.client('ec2', region_name=cls.region)
        cls.rds_client = boto3.client('rds', region_name=cls.region)
        cls.ecs_client = boto3.client('ecs', region_name=cls.region)
        cls.s3_client = boto3.client('s3', region_name=cls.region)
        cls.logs_client = boto3.client('logs', region_name=cls.region)
        cls.kms_client = boto3.client('kms', region_name=cls.region)

        # Extract key identifiers from outputs
        cls.vpc_id = cls.outputs.get('vpc_id')
        cls.rds_endpoint = cls.outputs.get('rds_endpoint')
        cls.ecs_cluster_name = cls.outputs.get('ecs_cluster_name')
        cls.log_bucket_name = cls.outputs.get('log_bucket_name')
        cls.environment_suffix = cls.outputs.get('environment_suffix', 'synth2662635795')

    def test_vpc_exists_and_configured(self):
        """Test that VPC exists with correct configuration."""
        self.assertIsNotNone(self.vpc_id, "VPC ID must be in outputs")

        # Describe VPC
        response = self.ec2_client.describe_vpcs(VpcIds=[self.vpc_id])
        self.assertEqual(len(response['Vpcs']), 1)

        vpc = response['Vpcs'][0]
        self.assertEqual(vpc['CidrBlock'], '10.0.0.0/16')

        # Check DNS attributes
        dns_attrs = self.ec2_client.describe_vpc_attribute(
            VpcId=self.vpc_id,
            Attribute='enableDnsHostnames'
        )
        self.assertTrue(dns_attrs['EnableDnsHostnames']['Value'])

        dns_support = self.ec2_client.describe_vpc_attribute(
            VpcId=self.vpc_id,
            Attribute='enableDnsSupport'
        )
        self.assertTrue(dns_support['EnableDnsSupport']['Value'])

    def test_private_subnets_exist(self):
        """Test that private subnets exist in VPC."""
        response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'tag:Type', 'Values': ['private']}
            ]
        )

        subnets = response['Subnets']
        self.assertEqual(len(subnets), 2, "Should have 2 private subnets")

        # Verify they are in different AZs
        azs = [subnet['AvailabilityZone'] for subnet in subnets]
        self.assertEqual(len(set(azs)), 2, "Subnets should be in different AZs")

        # Verify CIDR blocks
        cidr_blocks = sorted([subnet['CidrBlock'] for subnet in subnets])
        self.assertIn('10.0.1.0/24', cidr_blocks)
        self.assertIn('10.0.2.0/24', cidr_blocks)

    def test_public_subnets_exist(self):
        """Test that public subnets exist in VPC."""
        response = self.ec2_client.describe_subnets(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'tag:Type', 'Values': ['public']}
            ]
        )

        subnets = response['Subnets']
        self.assertEqual(len(subnets), 2, "Should have 2 public subnets")

        # Verify CIDR blocks
        cidr_blocks = sorted([subnet['CidrBlock'] for subnet in subnets])
        self.assertIn('10.0.10.0/24', cidr_blocks)
        self.assertIn('10.0.11.0/24', cidr_blocks)

    def test_vpc_endpoints_exist(self):
        """Test that VPC endpoints for S3 and DynamoDB exist."""
        response = self.ec2_client.describe_vpc_endpoints(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]}
            ]
        )

        endpoints = response['VpcEndpoints']
        self.assertGreaterEqual(len(endpoints), 2, "Should have at least S3 and DynamoDB endpoints")

        # Check for S3 and DynamoDB endpoints
        service_names = [ep['ServiceName'] for ep in endpoints]
        s3_endpoint = any('s3' in name for name in service_names)
        dynamodb_endpoint = any('dynamodb' in name for name in service_names)

        self.assertTrue(s3_endpoint, "S3 VPC endpoint should exist")
        self.assertTrue(dynamodb_endpoint, "DynamoDB VPC endpoint should exist")

    def test_internet_gateway_exists(self):
        """Test that Internet Gateway is attached to VPC."""
        response = self.ec2_client.describe_internet_gateways(
            Filters=[
                {'Name': 'attachment.vpc-id', 'Values': [self.vpc_id]}
            ]
        )

        self.assertEqual(len(response['InternetGateways']), 1, "Should have 1 Internet Gateway")

        igw = response['InternetGateways'][0]
        self.assertEqual(igw['Attachments'][0]['State'], 'available')

    def test_rds_cluster_exists_and_encrypted(self):
        """Test that RDS cluster exists and is encrypted."""
        self.assertIsNotNone(self.rds_endpoint, "RDS endpoint must be in outputs")

        # Extract cluster identifier from endpoint
        cluster_id = self.rds_endpoint.split('.')[0]

        # Describe RDS cluster
        response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        self.assertEqual(len(response['DBClusters']), 1)

        cluster = response['DBClusters'][0]
        self.assertTrue(cluster['StorageEncrypted'], "RDS cluster must be encrypted")
        self.assertEqual(cluster['Engine'], 'aurora-postgresql')
        self.assertEqual(cluster['EngineMode'], 'provisioned')
        self.assertFalse(cluster['DeletionProtection'], "Deletion protection should be disabled")

    def test_rds_instance_exists(self):
        """Test that RDS instance exists in the cluster."""
        cluster_id = self.rds_endpoint.split('.')[0]

        # Get cluster to find instance
        cluster_response = self.rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )

        cluster = cluster_response['DBClusters'][0]
        self.assertGreater(len(cluster['DBClusterMembers']), 0, "Cluster should have at least one instance")

        instance_id = cluster['DBClusterMembers'][0]['DBInstanceIdentifier']

        # Describe instance
        instance_response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=instance_id
        )

        self.assertEqual(len(instance_response['DBInstances']), 1)
        instance = instance_response['DBInstances'][0]
        self.assertEqual(instance['DBInstanceClass'], 'db.serverless')

    def test_ecs_cluster_exists(self):
        """Test that ECS cluster exists."""
        self.assertIsNotNone(self.ecs_cluster_name, "ECS cluster name must be in outputs")

        # Describe ECS cluster
        response = self.ecs_client.describe_clusters(
            clusters=[self.ecs_cluster_name]
        )

        self.assertEqual(len(response['clusters']), 1)

        cluster = response['clusters'][0]
        self.assertEqual(cluster['status'], 'ACTIVE')
        self.assertEqual(cluster['clusterName'], self.ecs_cluster_name)

    def test_ecs_task_definition_exists(self):
        """Test that ECS task definition exists."""
        # List task definitions
        response = self.ecs_client.list_task_definitions(
            familyPrefix=f'payment-processor-{self.environment_suffix}'
        )

        self.assertGreater(len(response['taskDefinitionArns']), 0, "Task definition should exist")

        # Describe task definition
        task_def_arn = response['taskDefinitionArns'][0]
        task_def_response = self.ecs_client.describe_task_definition(
            taskDefinition=task_def_arn
        )

        task_def = task_def_response['taskDefinition']
        self.assertEqual(task_def['cpu'], '256')
        self.assertEqual(task_def['memory'], '512')
        self.assertEqual(task_def['networkMode'], 'awsvpc')
        self.assertIn('FARGATE', task_def['requiresCompatibilities'])

    def test_s3_log_bucket_exists_and_encrypted(self):
        """Test that S3 log bucket exists and is encrypted."""
        self.assertIsNotNone(self.log_bucket_name, "Log bucket name must be in outputs")

        # Check if bucket exists
        try:
            self.s3_client.head_bucket(Bucket=self.log_bucket_name)
        except ClientError:
            self.fail(f"S3 bucket {self.log_bucket_name} does not exist")

        # Check encryption
        encryption_response = self.s3_client.get_bucket_encryption(
            Bucket=self.log_bucket_name
        )

        rules = encryption_response['ServerSideEncryptionConfiguration']['Rules']
        self.assertGreater(len(rules), 0, "Bucket should have encryption configured")

        # Check versioning
        versioning_response = self.s3_client.get_bucket_versioning(
            Bucket=self.log_bucket_name
        )

        self.assertEqual(versioning_response['Status'], 'Enabled', "Versioning should be enabled")

    def test_s3_bucket_public_access_blocked(self):
        """Test that S3 bucket has public access blocked."""
        response = self.s3_client.get_public_access_block(
            Bucket=self.log_bucket_name
        )

        config = response['PublicAccessBlockConfiguration']
        self.assertTrue(config['BlockPublicAcls'])
        self.assertTrue(config['BlockPublicPolicy'])
        self.assertTrue(config['IgnorePublicAcls'])
        self.assertTrue(config['RestrictPublicBuckets'])

    def test_cloudwatch_log_group_exists(self):
        """Test that CloudWatch log group exists."""
        log_group_name = f'/ecs/payment-processor-{self.environment_suffix}'

        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=log_group_name
        )

        self.assertGreater(len(response['logGroups']), 0, "Log group should exist")

        log_group = response['logGroups'][0]
        self.assertEqual(log_group['logGroupName'], log_group_name)
        self.assertEqual(log_group['retentionInDays'], 7)

    def test_security_groups_exist(self):
        """Test that security groups exist for ECS and RDS."""
        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'group-name', 'Values': [
                    f'ecs-sg-{self.environment_suffix}',
                    f'rds-sg-{self.environment_suffix}'
                ]}
            ]
        )

        self.assertEqual(len(response['SecurityGroups']), 2, "Should have ECS and RDS security groups")

        sg_names = [sg['GroupName'] for sg in response['SecurityGroups']]
        self.assertIn(f'ecs-sg-{self.environment_suffix}', sg_names)
        self.assertIn(f'rds-sg-{self.environment_suffix}', sg_names)

    def test_rds_security_group_rules(self):
        """Test that RDS security group has correct ingress rules."""
        response = self.ec2_client.describe_security_groups(
            Filters=[
                {'Name': 'vpc-id', 'Values': [self.vpc_id]},
                {'Name': 'group-name', 'Values': [f'rds-sg-{self.environment_suffix}']}
            ]
        )

        self.assertEqual(len(response['SecurityGroups']), 1)

        rds_sg = response['SecurityGroups'][0]
        ingress_rules = rds_sg['IpPermissions']

        # Check for PostgreSQL port ingress
        postgres_rule = next(
            (rule for rule in ingress_rules if rule.get('FromPort') == 5432),
            None
        )

        self.assertIsNotNone(postgres_rule, "Should have ingress rule for PostgreSQL port 5432")
        self.assertEqual(postgres_rule['IpProtocol'], 'tcp')

    def test_kms_key_exists(self):
        """Test that KMS key exists for RDS encryption."""
        # List KMS keys
        response = self.kms_client.list_aliases()

        # Find RDS KMS alias
        rds_alias = next(
            (alias for alias in response['Aliases']
             if f'rds-{self.environment_suffix}' in alias['AliasName']),
            None
        )

        self.assertIsNotNone(rds_alias, "RDS KMS key alias should exist")

        # Describe the key
        key_response = self.kms_client.describe_key(
            KeyId=rds_alias['TargetKeyId']
        )

        key_metadata = key_response['KeyMetadata']
        self.assertEqual(key_metadata['KeyState'], 'Enabled')
        self.assertTrue(key_metadata['Enabled'])

    def test_vpc_flow_logs_configured(self):
        """Test that VPC Flow Logs are configured."""
        response = self.ec2_client.describe_flow_logs(
            Filters=[
                {'Name': 'resource-id', 'Values': [self.vpc_id]}
            ]
        )

        self.assertGreater(len(response['FlowLogs']), 0, "VPC Flow Logs should be configured")

        flow_log = response['FlowLogs'][0]
        self.assertEqual(flow_log['TrafficType'], 'ALL')
        self.assertEqual(flow_log['LogDestinationType'], 's3')


if __name__ == '__main__':
    unittest.main()
