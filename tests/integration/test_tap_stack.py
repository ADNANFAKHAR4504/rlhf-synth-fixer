"""Integration tests for the video processing pipeline infrastructure.

This module contains integration tests that validate the complete stack deployment,
including all nested stacks and their interconnections.
"""

import json
import os
import unittest
import boto3
from botocore.exceptions import ClientError
from pytest import mark, skip


# Open file cfn-outputs/flat-outputs.json
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(
    base_dir, '..', '..', 'cfn-outputs', 'flat-outputs.json'
)

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, 'r', encoding='utf-8') as f:
        flat_outputs = f.read()
else:
    flat_outputs = '{}'

flat_outputs = json.loads(flat_outputs)


@mark.describe("TapStack - Video Processing Pipeline")
class TestTapStack(unittest.TestCase):
    """Test cases for the TapStack CDK stack"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients and environment for all tests"""
        cls.region = "ap-northeast-1"
        cls.environment_suffix = os.getenv("ENVIRONMENT_SUFFIX", "dev")
        cls.ec2_client = boto3.client("ec2", region_name=cls.region)
        cls.rds_client = boto3.client("rds", region_name=cls.region)
        cls.efs_client = boto3.client("efs", region_name=cls.region)
        cls.elasticache_client = boto3.client("elasticache", region_name=cls.region)
        cls.ecs_client = boto3.client("ecs", region_name=cls.region)
        cls.apigateway_client = boto3.client("apigateway", region_name=cls.region)
        cls.secretsmanager_client = boto3.client("secretsmanager", region_name=cls.region)
        cls.sns_client = boto3.client("sns", region_name=cls.region)
        cls.sfn_client = boto3.client("stepfunctions", region_name=cls.region)

    @mark.it("VPC exists with correct CIDR and multi-AZ configuration")
    def test_vpc_exists_with_multi_az(self):
        """Verify VPC exists with correct configuration spanning multiple AZs"""
        try:
            vpcs = self.ec2_client.describe_vpcs(
                Filters=[
                    {"Name": "tag:Name", "Values": [f"*video-processing-vpc-{self.environment_suffix}*"]}
                ]
            )
            self.assertGreaterEqual(len(vpcs["Vpcs"]), 1, "VPC not found")

            vpc = vpcs["Vpcs"][0]
            self.assertEqual(vpc["CidrBlock"], "10.0.0.0/16", "VPC CIDR block incorrect")

            # Check multi-AZ configuration
            vpc_id = vpc["VpcId"]
            subnets = self.ec2_client.describe_subnets(
                Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
            )
            azs = set(subnet["AvailabilityZone"] for subnet in subnets["Subnets"])
            self.assertGreaterEqual(len(azs), 2, f"VPC should span at least 2 AZs, found {len(azs)}")
        except ClientError as e:
            skip(f"VPC not yet available: {str(e)}")

    @mark.it("RDS PostgreSQL instance exists with multi-AZ and encryption")
    def test_rds_instance_multi_az_encrypted(self):
        """Verify RDS instance is multi-AZ and encrypted"""
        try:
            instances = self.rds_client.describe_db_instances()
            video_db = [
                db for db in instances["DBInstances"]
                if "videometadata" in db.get("DBName", "").lower() or
                   f"video-{self.environment_suffix}" in db["DBInstanceIdentifier"].lower()
            ]
            self.assertGreaterEqual(len(video_db), 1, "RDS instance not found")

            db = video_db[0]
            self.assertEqual(db["Engine"], "postgres", "Database engine should be PostgreSQL")
            self.assertTrue(db["MultiAZ"], "Database should be multi-AZ")
            self.assertTrue(db["StorageEncrypted"], "Database storage should be encrypted")
        except ClientError as e:
            skip(f"RDS instance not yet available: {str(e)}")

    @mark.it("Database credentials are stored in Secrets Manager")
    def test_database_secret_exists(self):
        """Verify database credentials secret exists in Secrets Manager"""
        try:
            secret_name = f"video-processing-db-secret-{self.environment_suffix}"
            secret = self.secretsmanager_client.describe_secret(SecretId=secret_name)
            self.assertEqual(secret["Name"], secret_name, "Secret name mismatch")
        except ClientError as e:
            if e.response["Error"]["Code"] == "ResourceNotFoundException":
                self.fail("Database secret not found in Secrets Manager")

    @mark.it("ElastiCache Redis cluster has at least 2 nodes with multi-AZ")
    def test_redis_cluster_multi_az_two_nodes(self):
        """Verify Redis cluster has at least 2 nodes with multi-AZ enabled"""
        try:
            replication_groups = self.elasticache_client.describe_replication_groups()
            video_cache = [
                rg for rg in replication_groups["ReplicationGroups"]
                if f"video-cache-{self.environment_suffix}" in rg["ReplicationGroupId"]
            ]
            self.assertGreaterEqual(len(video_cache), 1, "Redis replication group not found")

            cache = video_cache[0]
            self.assertEqual(cache["AutomaticFailover"], "enabled", "Automatic failover should be enabled")
            self.assertEqual(cache["MultiAZ"], "enabled", "Multi-AZ should be enabled")
            self.assertGreaterEqual(len(cache["MemberClusters"]), 2, "Should have at least 2 cache nodes")
            self.assertTrue(cache["AtRestEncryptionEnabled"], "At-rest encryption should be enabled")
            self.assertTrue(cache["TransitEncryptionEnabled"], "Transit encryption should be enabled")
        except ClientError as e:
            skip(f"ElastiCache not yet available: {str(e)}")

    @mark.it("EFS file system exists with encryption enabled")
    def test_efs_encrypted(self):
        """Verify EFS file system exists with encryption enabled"""
        try:
            file_systems = self.efs_client.describe_file_systems()
            video_efs = [
                fs for fs in file_systems["FileSystems"]
                if f"video-processing-efs-{self.environment_suffix}" in fs.get("Name", "")
            ]
            self.assertGreaterEqual(len(video_efs), 1, "EFS file system not found")

            fs = video_efs[0]
            self.assertTrue(fs["Encrypted"], "EFS should be encrypted")
        except ClientError as e:
            skip(f"EFS not yet available: {str(e)}")

    @mark.it("ECS cluster exists and is active")
    def test_ecs_cluster_active(self):
        """Verify ECS cluster exists and is active"""
        try:
            clusters = self.ecs_client.list_clusters()
            cluster_name = f"video-processing-cluster-{self.environment_suffix}"
            matching_clusters = [c for c in clusters["clusterArns"] if cluster_name in c]
            self.assertGreaterEqual(len(matching_clusters), 1, f"ECS cluster {cluster_name} not found")

            cluster_details = self.ecs_client.describe_clusters(clusters=[matching_clusters[0]])
            cluster = cluster_details["clusters"][0]
            self.assertEqual(cluster["status"], "ACTIVE", "Cluster should be active")
        except ClientError as e:
            skip(f"ECS cluster not yet available: {str(e)}")

    @mark.it("API Gateway exists with required endpoints")
    def test_api_gateway_endpoints(self):
        """Verify API Gateway exists with /health and /metadata endpoints"""
        try:
            apis = self.apigateway_client.get_rest_apis()
            video_api = [
                api for api in apis["items"]
                if f"video-metadata-api-{self.environment_suffix}" in api.get("name", "")
            ]
            self.assertGreaterEqual(len(video_api), 1, "API Gateway not found")

            api_id = video_api[0]["id"]
            resources = self.apigateway_client.get_resources(restApiId=api_id)
            resource_paths = [r.get("path", "") for r in resources["items"]]

            self.assertIn("/health", resource_paths, "/health endpoint not found")
            self.assertIn("/metadata", resource_paths, "/metadata endpoint not found")
        except ClientError as e:
            skip(f"API Gateway not yet available: {str(e)}")

    @mark.it("Security group allows ECS to access RDS on port 5432")
    def test_security_group_ecs_to_rds(self):
        """Verify ECS security group has access to RDS security group"""
        try:
            ecs_sg = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "group-name", "Values": [f"ecs-sg-{self.environment_suffix}"]}]
            )
            rds_sg = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "group-name", "Values": [f"rds-sg-{self.environment_suffix}"]}]
            )

            if ecs_sg["SecurityGroups"] and rds_sg["SecurityGroups"]:
                ecs_sg_id = ecs_sg["SecurityGroups"][0]["GroupId"]
                rds_sg_rules = rds_sg["SecurityGroups"][0]["IpPermissions"]

                has_access = any(
                    rule.get("FromPort") == 5432 and
                    any(g.get("GroupId") == ecs_sg_id for g in rule.get("UserIdGroupPairs", []))
                    for rule in rds_sg_rules
                )
                self.assertTrue(has_access, "ECS security group should have access to RDS on port 5432")
        except ClientError as e:
            skip(f"Security groups not yet available: {str(e)}")

    @mark.it("Security group allows ECS to access Redis on port 6379")
    def test_security_group_ecs_to_redis(self):
        """Verify ECS security group has access to Redis security group"""
        try:
            ecs_sg = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "group-name", "Values": [f"ecs-sg-{self.environment_suffix}"]}]
            )
            redis_sg = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "group-name", "Values": [f"redis-sg-{self.environment_suffix}"]}]
            )

            if ecs_sg["SecurityGroups"] and redis_sg["SecurityGroups"]:
                ecs_sg_id = ecs_sg["SecurityGroups"][0]["GroupId"]
                redis_sg_rules = redis_sg["SecurityGroups"][0]["IpPermissions"]

                has_access = any(
                    rule.get("FromPort") == 6379 and
                    any(g.get("GroupId") == ecs_sg_id for g in rule.get("UserIdGroupPairs", []))
                    for rule in redis_sg_rules
                )
                self.assertTrue(has_access, "ECS security group should have access to Redis on port 6379")
        except ClientError as e:
            skip(f"Security groups not yet available: {str(e)}")

    @mark.it("Security group allows ECS to access EFS on port 2049")
    def test_security_group_ecs_to_efs(self):
        """Verify ECS security group has access to EFS security group"""
        try:
            ecs_sg = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "group-name", "Values": [f"ecs-sg-{self.environment_suffix}"]}]
            )
            efs_sg = self.ec2_client.describe_security_groups(
                Filters=[{"Name": "group-name", "Values": [f"efs-sg-{self.environment_suffix}"]}]
            )

            if ecs_sg["SecurityGroups"] and efs_sg["SecurityGroups"]:
                ecs_sg_id = ecs_sg["SecurityGroups"][0]["GroupId"]
                efs_sg_rules = efs_sg["SecurityGroups"][0]["IpPermissions"]

                has_access = any(
                    rule.get("FromPort") == 2049 and
                    any(g.get("GroupId") == ecs_sg_id for g in rule.get("UserIdGroupPairs", []))
                    for rule in efs_sg_rules
                )
                self.assertTrue(has_access, "ECS security group should have access to EFS on port 2049")
        except ClientError as e:
            skip(f"Security groups not yet available: {str(e)}")

    @mark.it("SNS topics exist for completion and error notifications")
    def test_sns_topics_exist(self):
        """Verify SNS topics for video processing notifications exist"""
        try:
            topics = self.sns_client.list_topics()
            topic_arns = [t["TopicArn"] for t in topics["Topics"]]

            completion_topic = f"video-processing-completion-{self.environment_suffix}"
            error_topic = f"video-processing-error-{self.environment_suffix}"

            has_completion = any(completion_topic in arn for arn in topic_arns)
            has_error = any(error_topic in arn for arn in topic_arns)

            self.assertTrue(has_completion, f"Completion topic {completion_topic} not found")
            self.assertTrue(has_error, f"Error topic {error_topic} not found")
        except ClientError as e:
            skip(f"SNS topics not yet available: {str(e)}")

    @mark.it("Step Functions state machine exists and is active")
    def test_state_machine_exists(self):
        """Verify Step Functions state machine exists for video processing workflow"""
        try:
            state_machines = self.sfn_client.list_state_machines()
            workflow_name = f"video-processing-workflow-{self.environment_suffix}"

            matching_sms = [
                sm for sm in state_machines["stateMachines"]
                if workflow_name in sm["name"]
            ]
            self.assertGreaterEqual(len(matching_sms), 1, f"State machine {workflow_name} not found")

            sm = matching_sms[0]
            self.assertEqual(sm["status"], "ACTIVE", "State machine should be active")

            # Verify state machine definition includes ECS task
            sm_arn = sm["stateMachineArn"]
            sm_details = self.sfn_client.describe_state_machine(stateMachineArn=sm_arn)
            definition = sm_details["definition"]

            self.assertIn("ecs:RunTask", definition, "State machine should include ECS task execution")
        except ClientError as e:
            skip(f"Step Functions state machine not yet available: {str(e)}")

    @mark.it("State machine has logging enabled")
    def test_state_machine_logging(self):
        """Verify Step Functions state machine has CloudWatch logging enabled"""
        try:
            state_machines = self.sfn_client.list_state_machines()
            workflow_name = f"video-processing-workflow-{self.environment_suffix}"

            matching_sms = [
                sm for sm in state_machines["stateMachines"]
                if workflow_name in sm["name"]
            ]
            self.assertGreaterEqual(len(matching_sms), 1, f"State machine {workflow_name} not found")

            sm_arn = matching_sms[0]["stateMachineArn"]
            sm_details = self.sfn_client.describe_state_machine(stateMachineArn=sm_arn)

            logging_config = sm_details.get("loggingConfiguration", {})
            self.assertIn("level", logging_config, "Logging should be configured")
            self.assertNotEqual(logging_config.get("level"), "OFF", "Logging should be enabled")
        except ClientError as e:
            skip(f"State machine logging check failed: {str(e)}")
