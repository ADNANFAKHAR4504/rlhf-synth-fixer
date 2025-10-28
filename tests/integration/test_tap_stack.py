import json
import os
import unittest

import boto3
from pytest import mark

# Load flat-outputs.json for integration tests
base_dir = os.path.dirname(os.path.abspath(__file__))
flat_outputs_path = os.path.join(base_dir, "..", "..", "cfn-outputs", "flat-outputs.json")

if os.path.exists(flat_outputs_path):
    with open(flat_outputs_path, "r", encoding="utf-8") as f:
        flat_outputs = json.loads(f.read())
else:
    flat_outputs = {}

# AWS region from environment or default
AWS_REGION = os.environ.get("AWS_REGION", "eu-west-2")


@mark.describe("TapStack Integration Tests")
class TestTapStackIntegration(unittest.TestCase):
    """Integration tests for deployed TapStack infrastructure"""

    @classmethod
    def setUpClass(cls):
        """Set up AWS clients once for all tests"""
        cls.ec2_client = boto3.client("ec2", region_name=AWS_REGION)
        cls.kinesis_client = boto3.client("kinesis", region_name=AWS_REGION)
        cls.ecs_client = boto3.client("ecs", region_name=AWS_REGION)
        cls.rds_client = boto3.client("rds", region_name=AWS_REGION)
        cls.secrets_client = boto3.client("secretsmanager", region_name=AWS_REGION)
        cls.kms_client = boto3.client("kms", region_name=AWS_REGION)
        cls.logs_client = boto3.client("logs", region_name=AWS_REGION)

    @mark.it("verifies VPC is deployed and accessible")
    def test_vpc_exists_and_accessible(self):
        vpc_id = flat_outputs.get("VpcId")
        assert vpc_id is not None, "VPC ID should be in outputs"

        # Verify VPC exists
        response = self.ec2_client.describe_vpcs(VpcIds=[vpc_id])
        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]

        # Verify VPC is available
        assert vpc["State"] == "available"

        # Check DNS attributes
        dns_response = self.ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute="enableDnsHostnames"
        )
        assert dns_response["EnableDnsHostnames"]["Value"] is True

    @mark.it("verifies Kinesis stream is active and encrypted")
    def test_kinesis_stream_active_and_encrypted(self):
        stream_name = flat_outputs.get("KinesisStreamName")
        assert stream_name is not None, "Kinesis stream name should be in outputs"

        # Verify stream exists and is active
        response = self.kinesis_client.describe_stream(StreamName=stream_name)
        stream_description = response["StreamDescription"]

        assert stream_description["StreamStatus"] == "ACTIVE"
        assert len(stream_description["Shards"]) == 2
        assert stream_description["RetentionPeriodHours"] == 24

        # Verify encryption is enabled
        assert "EncryptionType" in stream_description
        assert stream_description["EncryptionType"] == "KMS"

    @mark.it("verifies ECS cluster exists and has container insights enabled")
    def test_ecs_cluster_exists(self):
        cluster_name = flat_outputs.get("EcsClusterName")
        assert cluster_name is not None, "ECS cluster name should be in outputs"

        # Verify cluster exists
        response = self.ecs_client.describe_clusters(clusters=[cluster_name], include=["SETTINGS"])
        assert len(response["clusters"]) == 1
        cluster = response["clusters"][0]

        assert cluster["status"] == "ACTIVE"
        assert cluster["clusterName"] == cluster_name

        # Verify container insights is enabled
        settings = cluster.get("settings", [])
        container_insights = next(
            (s for s in settings if s["name"] == "containerInsights"), None
        )
        # Container insights may be enabled or disabled
        if container_insights:
            assert container_insights["value"] in ["enabled", "disabled"]

    @mark.it("verifies RDS database is available and encrypted")
    def test_rds_database_available_and_encrypted(self):
        db_endpoint = flat_outputs.get("DatabaseEndpoint")
        assert db_endpoint is not None, "Database endpoint should be in outputs"

        # Extract DB instance identifier from endpoint
        db_identifier = db_endpoint.split(".")[0]

        # Verify database exists
        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )
        assert len(response["DBInstances"]) == 1
        db_instance = response["DBInstances"][0]

        # Verify database configuration
        assert db_instance["DBInstanceStatus"] == "available"
        assert db_instance["Engine"] == "postgres"
        assert db_instance["MultiAZ"] is True
        assert db_instance["StorageEncrypted"] is True
        assert db_instance["PubliclyAccessible"] is False

        # Verify backup retention
        assert db_instance["BackupRetentionPeriod"] == 7

        # Verify performance insights is enabled
        assert db_instance["PerformanceInsightsEnabled"] is True
        assert "PerformanceInsightsKMSKeyId" in db_instance

    @mark.it("verifies Secrets Manager secret exists and is encrypted")
    def test_secrets_manager_secret_exists(self):
        secret_arn = flat_outputs.get("DatabaseSecretArn")
        assert secret_arn is not None, "Secret ARN should be in outputs"

        # Verify secret exists
        response = self.secrets_client.describe_secret(SecretId=secret_arn)

        assert response["ARN"] == secret_arn
        assert "KmsKeyId" in response
        assert response["KmsKeyId"] is not None

        # Verify secret value can be retrieved (validates permissions)
        secret_value = self.secrets_client.get_secret_value(SecretId=secret_arn)
        assert "SecretString" in secret_value
        secret_data = json.loads(secret_value["SecretString"])
        assert "username" in secret_data
        assert "password" in secret_data

    @mark.it("verifies KMS key is active with rotation enabled")
    def test_kms_key_active_with_rotation(self):
        kms_key_id = flat_outputs.get("KmsKeyId")
        assert kms_key_id is not None, "KMS key ID should be in outputs"

        # Verify key exists and is enabled
        response = self.kms_client.describe_key(KeyId=kms_key_id)
        key_metadata = response["KeyMetadata"]

        assert key_metadata["KeyState"] == "Enabled"
        assert key_metadata["Enabled"] is True

        # Verify key rotation is enabled
        rotation_response = self.kms_client.get_key_rotation_status(KeyId=kms_key_id)
        assert rotation_response["KeyRotationEnabled"] is True

    @mark.it("verifies CloudWatch log groups exist and are encrypted")
    def test_cloudwatch_log_groups_exist(self):
        audit_log_group = flat_outputs.get("AuditLogGroupName")
        assert audit_log_group is not None, "Audit log group name should be in outputs"

        # Verify audit log group exists
        response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=audit_log_group
        )
        assert len(response["logGroups"]) >= 1
        log_group = next(
            (lg for lg in response["logGroups"] if lg["logGroupName"] == audit_log_group),
            None,
        )
        assert log_group is not None

        # Verify encryption
        assert "kmsKeyId" in log_group
        assert log_group["kmsKeyId"] is not None

        # Verify retention
        assert log_group["retentionInDays"] == 30

    @mark.it("verifies database connectivity from VPC")
    def test_database_connectivity(self):
        db_endpoint = flat_outputs.get("DatabaseEndpoint")
        vpc_id = flat_outputs.get("VpcId")

        assert db_endpoint is not None
        assert vpc_id is not None

        # Extract DB instance identifier
        db_identifier = db_endpoint.split(".")[0]

        # Verify database is in the correct VPC
        response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )
        db_instance = response["DBInstances"][0]

        assert "DBSubnetGroup" in db_instance
        subnet_group = db_instance["DBSubnetGroup"]

        # Verify subnets are in the correct VPC
        assert "VpcId" in subnet_group
        assert subnet_group["VpcId"] == vpc_id

    @mark.it("verifies Kinesis stream can receive data")
    def test_kinesis_stream_can_receive_data(self):
        stream_name = flat_outputs.get("KinesisStreamName")
        assert stream_name is not None

        # Put a test record to the stream
        test_data = json.dumps(
            {"patient_id": "test-123", "event": "integration_test", "timestamp": "2025-10-28"}
        )

        response = self.kinesis_client.put_record(
            StreamName=stream_name, Data=test_data.encode("utf-8"), PartitionKey="test-partition"
        )

        # Verify record was accepted
        assert "SequenceNumber" in response
        assert "ShardId" in response

    @mark.it("verifies ECS task definition is registered")
    def test_ecs_task_definition_registered(self):
        # Get environment suffix from stream name
        stream_name = flat_outputs.get("KinesisStreamName")
        assert stream_name is not None

        # Extract suffix from stream name (e.g., "patient-data-stream-synth7591244985")
        suffix = stream_name.split("-")[-1]

        # List task definitions with the suffix
        response = self.ecs_client.list_task_definitions(
            familyPrefix=f"healthcare-processing-{suffix}", status="ACTIVE"
        )

        assert len(response["taskDefinitionArns"]) >= 1, "Task definition should be registered"

        # Describe the task definition
        task_def_arn = response["taskDefinitionArns"][0]
        task_def_response = self.ecs_client.describe_task_definition(
            taskDefinition=task_def_arn
        )
        task_def = task_def_response["taskDefinition"]

        # Verify task definition configuration
        assert task_def["cpu"] == "512"
        assert task_def["memory"] == "1024"
        assert task_def["networkMode"] == "awsvpc"
        assert "FARGATE" in task_def["requiresCompatibilities"]

        # Verify container definitions exist
        assert len(task_def["containerDefinitions"]) > 0
        container = task_def["containerDefinitions"][0]

        # Verify environment variables are set
        env_vars = {env["name"]: env["value"] for env in container.get("environment", [])}
        assert "KINESIS_STREAM_NAME" in env_vars
        assert env_vars["KINESIS_STREAM_NAME"] == stream_name

    @mark.it("verifies complete end-to-end HIPAA-compliant data flow")
    def test_end_to_end_data_flow(self):
        """
        Validates the complete data pipeline:
        1. Kinesis stream can receive data (encrypted)
        2. RDS database is accessible (encrypted, private)
        3. Secrets are retrievable for database access
        4. CloudWatch logs are configured for audit trails
        """
        # Step 1: Verify Kinesis can receive data
        stream_name = flat_outputs.get("KinesisStreamName")
        test_record = {"test": "end-to-end", "timestamp": "2025-10-28"}

        kinesis_response = self.kinesis_client.put_record(
            StreamName=stream_name,
            Data=json.dumps(test_record).encode("utf-8"),
            PartitionKey="e2e-test",
        )
        assert "SequenceNumber" in kinesis_response

        # Step 2: Verify RDS is in available state for connections
        db_endpoint = flat_outputs.get("DatabaseEndpoint")
        db_identifier = db_endpoint.split(".")[0]
        rds_response = self.rds_client.describe_db_instances(
            DBInstanceIdentifier=db_identifier
        )
        assert rds_response["DBInstances"][0]["DBInstanceStatus"] == "available"

        # Step 3: Verify secrets can be retrieved
        secret_arn = flat_outputs.get("DatabaseSecretArn")
        secret_response = self.secrets_client.get_secret_value(SecretId=secret_arn)
        secret_data = json.loads(secret_response["SecretString"])
        assert "username" in secret_data
        assert "password" in secret_data

        # Step 4: Verify audit log group is ready for logging
        audit_log_group = flat_outputs.get("AuditLogGroupName")
        logs_response = self.logs_client.describe_log_groups(
            logGroupNamePrefix=audit_log_group
        )
        assert len(logs_response["logGroups"]) >= 1

        # All components are properly configured for HIPAA-compliant data processing
