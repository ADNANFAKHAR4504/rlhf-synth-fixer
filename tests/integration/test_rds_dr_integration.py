"""
Integration Tests for RDS DR Infrastructure
Tests real AWS resources using deployment outputs
"""
import json
import boto3
import pytest
from pathlib import Path
import time

# Get the cfn-outputs path
OUTPUTS_FILE = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"


@pytest.fixture(scope="module")
def deployment_outputs():
    """Load deployment outputs from flat-outputs.json"""
    if not OUTPUTS_FILE.exists():
        pytest.skip("Deployment outputs not found - deployment may not have completed")

    with open(OUTPUTS_FILE, "r") as f:
        outputs = json.load(f)

    return outputs


@pytest.fixture(scope="module")
def rds_client_primary():
    """Create RDS client for primary region"""
    return boto3.client("rds", region_name="us-east-1")


@pytest.fixture(scope="module")
def rds_client_dr():
    """Create RDS client for DR region"""
    return boto3.client("rds", region_name="us-west-2")


@pytest.fixture(scope="module")
def ec2_client_primary():
    """Create EC2 client for primary region"""
    return boto3.client("ec2", region_name="us-east-1")


@pytest.fixture(scope="module")
def ec2_client_dr():
    """Create EC2 client for DR region"""
    return boto3.client("ec2", region_name="us-west-2")


@pytest.fixture(scope="module")
def lambda_client():
    """Create Lambda client for primary region"""
    return boto3.client("lambda", region_name="us-east-1")


@pytest.fixture(scope="module")
def cloudwatch_client():
    """Create CloudWatch client for primary region"""
    return boto3.client("cloudwatch", region_name="us-east-1")


@pytest.fixture(scope="module")
def kms_client_primary():
    """Create KMS client for primary region"""
    return boto3.client("kms", region_name="us-east-1")


@pytest.fixture(scope="module")
def kms_client_dr():
    """Create KMS client for DR region"""
    return boto3.client("kms", region_name="us-west-2")


@pytest.fixture(scope="module")
def secretsmanager_client():
    """Create Secrets Manager client for primary region"""
    return boto3.client("secretsmanager", region_name="us-east-1")


class TestRDSPrimaryInstance:
    """Test primary RDS instance"""

    def test_primary_instance_exists(self, deployment_outputs, rds_client_primary):
        """Verify primary RDS instance exists and is available"""
        endpoint = deployment_outputs.get("primary_endpoint")
        assert endpoint is not None, "Primary endpoint not found in outputs"

        # Extract instance identifier from endpoint
        instance_id = endpoint.split(".")[0]

        # Describe the instance
        response = rds_client_primary.describe_db_instances(DBInstanceIdentifier=instance_id)
        assert len(response["DBInstances"]) == 1, "Primary instance not found"

        instance = response["DBInstances"][0]
        assert instance["DBInstanceStatus"] == "available", \
            f"Primary instance not available: {instance['DBInstanceStatus']}"

    def test_primary_instance_configuration(self, deployment_outputs, rds_client_primary):
        """Verify primary instance has correct configuration"""
        endpoint = deployment_outputs.get("primary_endpoint")
        instance_id = endpoint.split(".")[0]

        response = rds_client_primary.describe_db_instances(DBInstanceIdentifier=instance_id)
        instance = response["DBInstances"][0]

        # Verify encryption
        assert instance["StorageEncrypted"] is True, "Primary instance not encrypted"

        # Verify backup retention
        assert instance["BackupRetentionPeriod"] >= 7, \
            f"Backup retention too low: {instance['BackupRetentionPeriod']}"

        # Verify engine
        assert instance["Engine"] in ["postgres", "mysql", "mariadb"], \
            f"Unexpected database engine: {instance['Engine']}"

    def test_primary_instance_connectivity(self, deployment_outputs, rds_client_primary):
        """Verify primary instance endpoint is reachable format"""
        endpoint = deployment_outputs.get("primary_endpoint")
        assert endpoint is not None, "Primary endpoint missing"

        # Validate endpoint format
        assert ":" in endpoint, "Endpoint should include port"
        assert ".rds.amazonaws.com:" in endpoint, "Invalid RDS endpoint format"

    def test_primary_instance_tags(self, deployment_outputs, rds_client_primary):
        """Verify primary instance has proper tags"""
        arn = deployment_outputs.get("primary_arn")
        assert arn is not None, "Primary ARN not found"

        response = rds_client_primary.list_tags_for_resource(ResourceName=arn)
        tags = {tag["Key"]: tag["Value"] for tag in response["TagList"]}

        # Verify required tags exist
        assert "Environment" in tags, "Environment tag missing"
        assert "Project" in tags, "Project tag missing"


class TestRDSDRReplica:
    """Test DR RDS replica"""

    def test_dr_replica_exists(self, deployment_outputs, rds_client_dr):
        """Verify DR replica exists and is available"""
        endpoint = deployment_outputs.get("dr_replica_endpoint")
        assert endpoint is not None, "DR replica endpoint not found in outputs"

        instance_id = endpoint.split(".")[0]

        response = rds_client_dr.describe_db_instances(DBInstanceIdentifier=instance_id)
        assert len(response["DBInstances"]) == 1, "DR replica not found"

        instance = response["DBInstances"][0]
        assert instance["DBInstanceStatus"] == "available", \
            f"DR replica not available: {instance['DBInstanceStatus']}"

    def test_dr_replica_is_read_replica(self, deployment_outputs, rds_client_dr):
        """Verify DR instance is configured as read replica"""
        endpoint = deployment_outputs.get("dr_replica_endpoint")
        instance_id = endpoint.split(".")[0]

        response = rds_client_dr.describe_db_instances(DBInstanceIdentifier=instance_id)
        instance = response["DBInstances"][0]

        # Read replicas have ReadReplicaSourceDBInstanceIdentifier
        assert "ReadReplicaSourceDBInstanceIdentifier" in instance, \
            "DR instance is not configured as read replica"

    def test_dr_replica_encryption(self, deployment_outputs, rds_client_dr):
        """Verify DR replica is encrypted"""
        endpoint = deployment_outputs.get("dr_replica_endpoint")
        instance_id = endpoint.split(".")[0]

        response = rds_client_dr.describe_db_instances(DBInstanceIdentifier=instance_id)
        instance = response["DBInstances"][0]

        assert instance["StorageEncrypted"] is True, "DR replica not encrypted"

    def test_replication_lag(self, deployment_outputs, rds_client_dr):
        """Verify replication lag is within acceptable limits"""
        endpoint = deployment_outputs.get("dr_replica_endpoint")
        instance_id = endpoint.split(".")[0]

        response = rds_client_dr.describe_db_instances(DBInstanceIdentifier=instance_id)
        instance = response["DBInstances"][0]

        # StatusInfos contains replication status
        if "StatusInfos" in instance and len(instance["StatusInfos"]) > 0:
            for status_info in instance["StatusInfos"]:
                if status_info["StatusType"] == "read replication":
                    # If status is normal, replication is healthy
                    assert status_info["Normal"] is True, "Replication lag detected"


class TestVPCInfrastructure:
    """Test VPC infrastructure in both regions"""

    def test_primary_vpc_exists(self, ec2_client_primary):
        """Verify primary VPC exists"""
        response = ec2_client_primary.describe_vpcs(
            Filters=[{"Name": "tag:Project", "Values": ["RDS-DR"]}]
        )
        assert len(response["Vpcs"]) >= 1, "Primary VPC not found"

    def test_dr_vpc_exists(self, ec2_client_dr):
        """Verify DR VPC exists"""
        response = ec2_client_dr.describe_vpcs(
            Filters=[{"Name": "tag:Project", "Values": ["RDS-DR"]}]
        )
        assert len(response["Vpcs"]) >= 1, "DR VPC not found"

    def test_primary_subnets_exist(self, ec2_client_primary):
        """Verify primary VPC has required subnets"""
        response = ec2_client_primary.describe_subnets(
            Filters=[{"Name": "tag:Project", "Values": ["RDS-DR"]}]
        )
        # Should have at least 2 subnets (private for RDS)
        assert len(response["Subnets"]) >= 2, \
            f"Insufficient subnets in primary VPC: {len(response['Subnets'])}"

    def test_dr_subnets_exist(self, ec2_client_dr):
        """Verify DR VPC has required subnets"""
        response = ec2_client_dr.describe_subnets(
            Filters=[{"Name": "tag:Project", "Values": ["RDS-DR"]}]
        )
        # Should have at least 2 subnets (private for RDS)
        assert len(response["Subnets"]) >= 2, \
            f"Insufficient subnets in DR VPC: {len(response['Subnets'])}"


class TestVPCPeering:
    """Test VPC peering connection"""

    def test_peering_connection_exists(self, deployment_outputs, ec2_client_primary):
        """Verify VPC peering connection exists"""
        peering_id = deployment_outputs.get("vpc_peering_id")
        assert peering_id is not None, "VPC peering ID not found in outputs"

        response = ec2_client_primary.describe_vpc_peering_connections(
            VpcPeeringConnectionIds=[peering_id]
        )
        assert len(response["VpcPeeringConnections"]) == 1, "Peering connection not found"

    def test_peering_connection_active(self, deployment_outputs, ec2_client_primary):
        """Verify VPC peering connection is active"""
        peering_id = deployment_outputs.get("vpc_peering_id")

        response = ec2_client_primary.describe_vpc_peering_connections(
            VpcPeeringConnectionIds=[peering_id]
        )
        peering = response["VpcPeeringConnections"][0]

        assert peering["Status"]["Code"] == "active", \
            f"Peering connection not active: {peering['Status']['Code']}"

    def test_peering_routes_configured(self, deployment_outputs, ec2_client_primary, ec2_client_dr):
        """Verify routes for peering are configured in both regions"""
        peering_id = deployment_outputs.get("vpc_peering_id")

        # Check primary region route tables
        primary_rts = ec2_client_primary.describe_route_tables(
            Filters=[{"Name": "tag:Project", "Values": ["RDS-DR"]}]
        )

        # Check for routes using peering connection
        primary_has_peering_route = False
        for rt in primary_rts["RouteTables"]:
            for route in rt["Routes"]:
                if route.get("VpcPeeringConnectionId") == peering_id:
                    primary_has_peering_route = True
                    break

        assert primary_has_peering_route, "Primary VPC missing peering routes"

        # Check DR region route tables
        dr_rts = ec2_client_dr.describe_route_tables(
            Filters=[{"Name": "tag:Project", "Values": ["RDS-DR"]}]
        )

        dr_has_peering_route = False
        for rt in dr_rts["RouteTables"]:
            for route in rt["Routes"]:
                if route.get("VpcPeeringConnectionId") == peering_id:
                    dr_has_peering_route = True
                    break

        assert dr_has_peering_route, "DR VPC missing peering routes"


class TestKMSEncryption:
    """Test KMS encryption keys"""

    def test_primary_kms_key_exists(self, deployment_outputs, kms_client_primary):
        """Verify primary KMS key exists"""
        key_id = deployment_outputs.get("kms_key_primary")
        assert key_id is not None, "Primary KMS key ID not found"

        response = kms_client_primary.describe_key(KeyId=key_id)
        assert response["KeyMetadata"]["KeyState"] == "Enabled", \
            f"Primary KMS key not enabled: {response['KeyMetadata']['KeyState']}"

    def test_dr_kms_key_exists(self, deployment_outputs, kms_client_dr):
        """Verify DR KMS key exists"""
        key_id = deployment_outputs.get("kms_key_dr")
        assert key_id is not None, "DR KMS key ID not found"

        response = kms_client_dr.describe_key(KeyId=key_id)
        assert response["KeyMetadata"]["KeyState"] == "Enabled", \
            f"DR KMS key not enabled: {response['KeyMetadata']['KeyState']}"

    def test_kms_key_rotation(self, deployment_outputs, kms_client_primary):
        """Verify KMS key rotation is enabled for primary key"""
        key_id = deployment_outputs.get("kms_key_primary")

        response = kms_client_primary.get_key_rotation_status(KeyId=key_id)
        assert response["KeyRotationEnabled"] is True, "KMS key rotation not enabled"


class TestLambdaFunction:
    """Test Lambda failover monitoring function"""

    def test_lambda_function_exists(self, deployment_outputs, lambda_client):
        """Verify Lambda function exists"""
        function_name = deployment_outputs.get("lambda_function_name")
        assert function_name is not None, "Lambda function name not found"

        response = lambda_client.get_function(FunctionName=function_name)
        assert response["Configuration"]["State"] == "Active", \
            f"Lambda function not active: {response['Configuration']['State']}"

    def test_lambda_function_configuration(self, deployment_outputs, lambda_client):
        """Verify Lambda function has correct configuration"""
        function_name = deployment_outputs.get("lambda_function_name")

        response = lambda_client.get_function(FunctionName=function_name)
        config = response["Configuration"]

        # Verify runtime
        assert config["Runtime"].startswith("python"), \
            f"Unexpected runtime: {config['Runtime']}"

        # Verify timeout is reasonable
        assert config["Timeout"] >= 30, f"Timeout too low: {config['Timeout']}"

        # Verify memory
        assert config["MemorySize"] >= 128, f"Memory too low: {config['MemorySize']}"

    def test_lambda_function_can_invoke(self, deployment_outputs, lambda_client):
        """Verify Lambda function can be invoked (dry run)"""
        function_name = deployment_outputs.get("lambda_function_name")

        # Use DryRun invocation type to test without actually running
        try:
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType="DryRun"
            )
            assert response["StatusCode"] == 204, "Lambda dry run invocation failed"
        except lambda_client.exceptions.InvalidRequestContentException:
            # DryRun not supported, try actual invocation with test event
            response = lambda_client.invoke(
                FunctionName=function_name,
                InvocationType="RequestResponse",
                Payload=json.dumps({"test": True})
            )
            assert response["StatusCode"] == 200, "Lambda invocation failed"


class TestCloudWatchAlarms:
    """Test CloudWatch alarms"""

    def test_replication_lag_alarm_exists(self, cloudwatch_client):
        """Verify replication lag alarm is configured"""
        response = cloudwatch_client.describe_alarms(
            AlarmNamePrefix="rds",
            MaxRecords=100
        )

        # Look for replication lag alarm
        lag_alarm_found = False
        for alarm in response["MetricAlarms"]:
            if "lag" in alarm["AlarmName"].lower() or "replica" in alarm["AlarmName"].lower():
                lag_alarm_found = True
                break

        assert lag_alarm_found, "Replication lag alarm not found"

    def test_cpu_alarms_exist(self, cloudwatch_client):
        """Verify CPU alarms are configured"""
        response = cloudwatch_client.describe_alarms(
            AlarmNamePrefix="rds",
            MaxRecords=100
        )

        # Look for CPU alarms
        cpu_alarm_count = 0
        for alarm in response["MetricAlarms"]:
            if "cpu" in alarm["AlarmName"].lower():
                cpu_alarm_count += 1

        assert cpu_alarm_count >= 1, "CPU alarms not found"

    def test_sns_topic_for_alarms_exists(self, deployment_outputs):
        """Verify SNS topic for alarms exists"""
        sns_topic_arn = deployment_outputs.get("sns_topic_arn")
        assert sns_topic_arn is not None, "SNS topic ARN not found"

        # Validate ARN format
        assert sns_topic_arn.startswith("arn:aws:sns:"), "Invalid SNS topic ARN format"


class TestSecretsManager:
    """Test Secrets Manager integration"""

    def test_secret_exists(self, deployment_outputs, secretsmanager_client):
        """Verify database password secret exists"""
        secret_arn = deployment_outputs.get("secret_arn")
        assert secret_arn is not None, "Secret ARN not found"

        response = secretsmanager_client.describe_secret(SecretId=secret_arn)
        assert response["ARN"] == secret_arn, "Secret ARN mismatch"

    def test_secret_has_value(self, deployment_outputs, secretsmanager_client):
        """Verify secret has a value (not checking actual value for security)"""
        secret_arn = deployment_outputs.get("secret_arn")

        response = secretsmanager_client.get_secret_value(SecretId=secret_arn)
        assert "SecretString" in response, "Secret value not found"
        assert len(response["SecretString"]) > 0, "Secret value is empty"


class TestResourceTagging:
    """Test resource tagging compliance"""

    def test_rds_instances_have_tags(self, deployment_outputs, rds_client_primary, rds_client_dr):
        """Verify all RDS instances have required tags"""
        primary_arn = deployment_outputs.get("primary_arn")
        dr_arn = deployment_outputs.get("dr_replica_arn")

        # Check primary tags
        primary_tags = rds_client_primary.list_tags_for_resource(ResourceName=primary_arn)
        primary_tag_keys = [tag["Key"] for tag in primary_tags["TagList"]]
        assert "Environment" in primary_tag_keys, "Primary missing Environment tag"
        assert "Project" in primary_tag_keys, "Primary missing Project tag"

        # Check DR tags
        dr_tags = rds_client_dr.list_tags_for_resource(ResourceName=dr_arn)
        dr_tag_keys = [tag["Key"] for tag in dr_tags["TagList"]]
        assert "Environment" in dr_tag_keys, "DR replica missing Environment tag"
        assert "Project" in dr_tag_keys, "DR replica missing Project tag"


class TestEndToEndWorkflow:
    """Test complete workflow scenarios"""

    def test_complete_dr_setup_validated(self, deployment_outputs):
        """Verify all components of DR setup are present"""
        required_outputs = [
            "primary_endpoint",
            "dr_replica_endpoint",
            "primary_arn",
            "dr_replica_arn",
            "kms_key_primary",
            "kms_key_dr",
            "lambda_function_name",
            "vpc_peering_id",
            "sns_topic_arn"
        ]

        for output in required_outputs:
            assert output in deployment_outputs, f"Required output missing: {output}"
            assert deployment_outputs[output] is not None, f"Output {output} is None"

    def test_cross_region_connectivity_setup(self, deployment_outputs, ec2_client_primary):
        """Verify cross-region connectivity is properly configured"""
        peering_id = deployment_outputs.get("vpc_peering_id")
        assert peering_id is not None, "VPC peering not configured"

        # Verify peering is active
        response = ec2_client_primary.describe_vpc_peering_connections(
            VpcPeeringConnectionIds=[peering_id]
        )
        assert response["VpcPeeringConnections"][0]["Status"]["Code"] == "active", \
            "Cross-region connectivity not active"

    def test_monitoring_and_alerting_configured(self, deployment_outputs, cloudwatch_client):
        """Verify complete monitoring and alerting setup"""
        # Lambda for monitoring
        lambda_name = deployment_outputs.get("lambda_function_name")
        assert lambda_name is not None, "Monitoring Lambda not configured"

        # SNS for alerts
        sns_arn = deployment_outputs.get("sns_topic_arn")
        assert sns_arn is not None, "Alert SNS topic not configured"

        # CloudWatch alarms
        response = cloudwatch_client.describe_alarms(MaxRecords=100)
        alarm_count = len(response["MetricAlarms"])
        assert alarm_count >= 2, f"Insufficient alarms configured: {alarm_count}"
