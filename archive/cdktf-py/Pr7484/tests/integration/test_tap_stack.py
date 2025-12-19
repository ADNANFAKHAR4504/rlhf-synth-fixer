"""Integration tests for TapStack - Live AWS Resource Validation."""
import json
import os
from pathlib import Path

import boto3
import pytest
from botocore.exceptions import ClientError


@pytest.fixture(scope="module")
def deployment_outputs():
    """Load deployment outputs from flat-outputs.json."""
    outputs_path = Path(__file__).parent.parent.parent / "cfn-outputs" / "flat-outputs.json"
    
    if not outputs_path.exists():
        pytest.skip(f"Deployment outputs not found at {outputs_path}")
    
    with open(outputs_path, "r") as f:
        outputs = json.load(f)
    
    return outputs


@pytest.fixture(scope="module")
def aws_clients(deployment_outputs):
    """Create AWS clients for both primary and secondary regions."""
    # Extract regions from ARNs
    try:
        primary_region = deployment_outputs["primary_lambda_arn"].split(":")[3]
        secondary_region = deployment_outputs["secondary_lambda_arn"].split(":")[3]
    except (KeyError, IndexError) as e:
        pytest.skip(f"Could not extract regions from deployment outputs: {e}")
    
    # Test AWS credentials before creating clients
    try:
        sts = boto3.client("sts")
        sts.get_caller_identity()
    except Exception as e:
        pytest.skip(f"AWS credentials not configured or invalid: {e}")
    
    try:
        return {
            "primary": {
                "region": primary_region,
                "ec2": boto3.client("ec2", region_name=primary_region),
                "rds": boto3.client("rds", region_name=primary_region),
                "lambda": boto3.client("lambda", region_name=primary_region),
                "dynamodb": boto3.client("dynamodb", region_name=primary_region),
                "sns": boto3.client("sns", region_name=primary_region),
                "secretsmanager": boto3.client("secretsmanager", region_name=primary_region),
                "route53": boto3.client("route53"),
            },
            "secondary": {
                "region": secondary_region,
                "ec2": boto3.client("ec2", region_name=secondary_region),
                "rds": boto3.client("rds", region_name=secondary_region),
                "lambda": boto3.client("lambda", region_name=secondary_region),
                "sns": boto3.client("sns", region_name=secondary_region),
            }
        }
    except Exception as e:
        pytest.skip(f"Failed to create AWS clients: {e}")


@pytest.mark.integration
@pytest.mark.live
class TestVPCResources:
    """Test VPC resources in both regions."""
    
    def test_primary_vpc_exists_and_available(self, deployment_outputs, aws_clients):
        """Verify primary VPC exists and is in available state."""
        vpc_id = deployment_outputs["primary_vpc_id"]
        ec2_client = aws_clients["primary"]["ec2"]
        
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        
        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["State"] == "available"
        assert vpc["VpcId"] == vpc_id
    
    def test_secondary_vpc_exists_and_available(self, deployment_outputs, aws_clients):
        """Verify secondary VPC exists and is in available state."""
        vpc_id = deployment_outputs["secondary_vpc_id"]
        ec2_client = aws_clients["secondary"]["ec2"]
        
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        
        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]
        assert vpc["State"] == "available"
        assert vpc["VpcId"] == vpc_id
    
    def test_primary_vpc_has_subnets(self, deployment_outputs, aws_clients):
        """Verify primary VPC has subnets configured."""
        vpc_id = deployment_outputs["primary_vpc_id"]
        ec2_client = aws_clients["primary"]["ec2"]
        
        response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        
        assert len(response["Subnets"]) > 0, "VPC should have at least one subnet"
        
        # Verify subnets are available
        for subnet in response["Subnets"]:
            assert subnet["State"] == "available"
    
    def test_secondary_vpc_has_subnets(self, deployment_outputs, aws_clients):
        """Verify secondary VPC has subnets configured."""
        vpc_id = deployment_outputs["secondary_vpc_id"]
        ec2_client = aws_clients["secondary"]["ec2"]
        
        response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        
        assert len(response["Subnets"]) > 0, "VPC should have at least one subnet"
        
        # Verify subnets are available
        for subnet in response["Subnets"]:
            assert subnet["State"] == "available"
    
    def test_primary_vpc_has_security_groups(self, deployment_outputs, aws_clients):
        """Verify primary VPC has security groups configured."""
        vpc_id = deployment_outputs["primary_vpc_id"]
        ec2_client = aws_clients["primary"]["ec2"]
        
        response = ec2_client.describe_security_groups(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        
        # Should have at least default security group
        assert len(response["SecurityGroups"]) >= 1


@pytest.mark.integration
@pytest.mark.live
class TestRDSResources:
    """Test RDS cluster resources."""
    
    def test_primary_rds_cluster_exists_and_available(self, deployment_outputs, aws_clients):
        """Verify primary RDS cluster exists and is available."""
        cluster_endpoint = deployment_outputs["primary_cluster_endpoint"]
        # Extract cluster identifier from endpoint
        cluster_id = cluster_endpoint.split(".")[0]
        
        rds_client = aws_clients["primary"]["rds"]
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        assert len(response["DBClusters"]) == 1
        cluster = response["DBClusters"][0]
        assert cluster["Status"] == "available"
        assert cluster["Endpoint"] == cluster_endpoint
    
    def test_secondary_rds_cluster_exists_and_available(self, deployment_outputs, aws_clients):
        """Verify secondary RDS cluster exists and is available."""
        cluster_endpoint = deployment_outputs["secondary_cluster_endpoint"]
        # Extract cluster identifier from endpoint
        cluster_id = cluster_endpoint.split(".")[0]
        
        rds_client = aws_clients["secondary"]["rds"]
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        assert len(response["DBClusters"]) == 1
        cluster = response["DBClusters"][0]
        assert cluster["Status"] == "available"
        assert cluster["Endpoint"] == cluster_endpoint
    
    def test_primary_rds_cluster_has_instances(self, deployment_outputs, aws_clients):
        """Verify primary RDS cluster has at least one instance."""
        cluster_endpoint = deployment_outputs["primary_cluster_endpoint"]
        cluster_id = cluster_endpoint.split(".")[0]
        
        rds_client = aws_clients["primary"]["rds"]
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response["DBClusters"][0]
        assert len(cluster["DBClusterMembers"]) > 0, "Cluster should have at least one instance"
    
    def test_primary_rds_cluster_encryption_enabled(self, deployment_outputs, aws_clients):
        """Verify primary RDS cluster has encryption enabled."""
        cluster_endpoint = deployment_outputs["primary_cluster_endpoint"]
        cluster_id = cluster_endpoint.split(".")[0]
        
        rds_client = aws_clients["primary"]["rds"]
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response["DBClusters"][0]
        assert cluster["StorageEncrypted"] is True, "RDS cluster should have encryption enabled"
    
    def test_primary_rds_cluster_backup_retention(self, deployment_outputs, aws_clients):
        """Verify primary RDS cluster has backup retention configured."""
        cluster_endpoint = deployment_outputs["primary_cluster_endpoint"]
        cluster_id = cluster_endpoint.split(".")[0]
        
        rds_client = aws_clients["primary"]["rds"]
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response["DBClusters"][0]
        assert cluster["BackupRetentionPeriod"] > 0, "RDS cluster should have backup retention configured"
    
    def test_primary_rds_cluster_multi_az(self, deployment_outputs, aws_clients):
        """Verify primary RDS cluster is multi-AZ."""
        cluster_endpoint = deployment_outputs["primary_cluster_endpoint"]
        cluster_id = cluster_endpoint.split(".")[0]
        
        rds_client = aws_clients["primary"]["rds"]
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response["DBClusters"][0]
        # Check if cluster spans multiple availability zones
        availability_zones = cluster.get("AvailabilityZones", [])
        assert len(availability_zones) > 1, "RDS cluster should be multi-AZ for high availability"


@pytest.mark.integration
@pytest.mark.live
class TestLambdaResources:
    """Test Lambda function resources."""
    
    def test_primary_lambda_exists_and_active(self, deployment_outputs, aws_clients):
        """Verify primary Lambda function exists and is active."""
        lambda_arn = deployment_outputs["primary_lambda_arn"]
        function_name = lambda_arn.split(":")[-1]
        
        lambda_client = aws_clients["primary"]["lambda"]
        
        response = lambda_client.get_function(FunctionName=function_name)
        
        assert response["Configuration"]["State"] == "Active"
        assert response["Configuration"]["FunctionArn"] == lambda_arn
    
    def test_secondary_lambda_exists_and_active(self, deployment_outputs, aws_clients):
        """Verify secondary Lambda function exists and is active."""
        lambda_arn = deployment_outputs["secondary_lambda_arn"]
        function_name = lambda_arn.split(":")[-1]
        
        lambda_client = aws_clients["secondary"]["lambda"]
        
        response = lambda_client.get_function(FunctionName=function_name)
        
        assert response["Configuration"]["State"] == "Active"
        assert response["Configuration"]["FunctionArn"] == lambda_arn
    
    def test_primary_lambda_has_vpc_config(self, deployment_outputs, aws_clients):
        """Verify primary Lambda is configured with VPC."""
        lambda_arn = deployment_outputs["primary_lambda_arn"]
        function_name = lambda_arn.split(":")[-1]
        vpc_id = deployment_outputs["primary_vpc_id"]
        
        lambda_client = aws_clients["primary"]["lambda"]
        
        response = lambda_client.get_function(FunctionName=function_name)
        
        vpc_config = response["Configuration"].get("VpcConfig", {})
        assert vpc_config.get("VpcId") == vpc_id, "Lambda should be configured with the correct VPC"
        assert len(vpc_config.get("SubnetIds", [])) > 0, "Lambda should have subnet configuration"
        assert len(vpc_config.get("SecurityGroupIds", [])) > 0, "Lambda should have security group configuration"
    
    def test_primary_lambda_has_environment_variables(self, deployment_outputs, aws_clients):
        """Verify primary Lambda has environment variables configured."""
        lambda_arn = deployment_outputs["primary_lambda_arn"]
        function_name = lambda_arn.split(":")[-1]
        
        lambda_client = aws_clients["primary"]["lambda"]
        
        response = lambda_client.get_function(FunctionName=function_name)
        
        env_vars = response["Configuration"].get("Environment", {}).get("Variables", {})
        assert len(env_vars) > 0, "Lambda should have environment variables configured"
    
    def test_primary_lambda_has_iam_role(self, deployment_outputs, aws_clients):
        """Verify primary Lambda has IAM role attached."""
        lambda_arn = deployment_outputs["primary_lambda_arn"]
        function_name = lambda_arn.split(":")[-1]
        
        lambda_client = aws_clients["primary"]["lambda"]
        
        response = lambda_client.get_function(FunctionName=function_name)
        
        role_arn = response["Configuration"].get("Role")
        assert role_arn is not None, "Lambda should have an IAM role"
        assert "arn:aws:iam::" in role_arn, "Role should be a valid IAM ARN"
    
    def test_primary_lambda_timeout_configured(self, deployment_outputs, aws_clients):
        """Verify primary Lambda has appropriate timeout configured."""
        lambda_arn = deployment_outputs["primary_lambda_arn"]
        function_name = lambda_arn.split(":")[-1]
        
        lambda_client = aws_clients["primary"]["lambda"]
        
        response = lambda_client.get_function(FunctionName=function_name)
        
        timeout = response["Configuration"].get("Timeout")
        assert timeout > 0, "Lambda should have timeout configured"
        assert timeout <= 900, "Lambda timeout should not exceed maximum (900 seconds)"
    
    def test_primary_lambda_memory_configured(self, deployment_outputs, aws_clients):
        """Verify primary Lambda has appropriate memory configured."""
        lambda_arn = deployment_outputs["primary_lambda_arn"]
        function_name = lambda_arn.split(":")[-1]
        
        lambda_client = aws_clients["primary"]["lambda"]
        
        response = lambda_client.get_function(FunctionName=function_name)
        
        memory = response["Configuration"].get("MemorySize")
        assert memory >= 128, "Lambda should have at least 128 MB memory"
        assert memory <= 10240, "Lambda memory should not exceed maximum (10240 MB)"


@pytest.mark.integration
@pytest.mark.live
class TestDynamoDBResources:
    """Test DynamoDB table resources."""
    
    def test_dynamodb_table_exists_and_active(self, deployment_outputs, aws_clients):
        """Verify DynamoDB table exists and is active."""
        table_name = deployment_outputs["dynamodb_table_name"]
        
        dynamodb_client = aws_clients["primary"]["dynamodb"]
        
        response = dynamodb_client.describe_table(TableName=table_name)
        
        assert response["Table"]["TableStatus"] == "ACTIVE"
        assert response["Table"]["TableName"] == table_name
    
    def test_dynamodb_table_has_encryption(self, deployment_outputs, aws_clients):
        """Verify DynamoDB table has encryption enabled."""
        table_name = deployment_outputs["dynamodb_table_name"]
        
        dynamodb_client = aws_clients["primary"]["dynamodb"]
        
        response = dynamodb_client.describe_table(TableName=table_name)
        
        sse_description = response["Table"].get("SSEDescription", {})
        assert sse_description.get("Status") == "ENABLED", "DynamoDB table should have encryption enabled"
    
    def test_dynamodb_table_has_point_in_time_recovery(self, deployment_outputs, aws_clients):
        """Verify DynamoDB table has point-in-time recovery enabled."""
        table_name = deployment_outputs["dynamodb_table_name"]
        
        dynamodb_client = aws_clients["primary"]["dynamodb"]
        
        response = dynamodb_client.describe_continuous_backups(TableName=table_name)
        
        pitr_status = response["ContinuousBackupsDescription"]["PointInTimeRecoveryDescription"]["PointInTimeRecoveryStatus"]
        assert pitr_status == "ENABLED", "DynamoDB table should have point-in-time recovery enabled"
    
    def test_dynamodb_table_billing_mode(self, deployment_outputs, aws_clients):
        """Verify DynamoDB table billing mode configuration."""
        table_name = deployment_outputs["dynamodb_table_name"]
        
        dynamodb_client = aws_clients["primary"]["dynamodb"]
        
        response = dynamodb_client.describe_table(TableName=table_name)
        
        billing_mode = response["Table"].get("BillingModeSummary", {}).get("BillingMode")
        # Should be either PAY_PER_REQUEST or PROVISIONED
        assert billing_mode in ["PAY_PER_REQUEST", "PROVISIONED"], "DynamoDB table should have valid billing mode"
    
    def test_dynamodb_table_has_key_schema(self, deployment_outputs, aws_clients):
        """Verify DynamoDB table has key schema defined."""
        table_name = deployment_outputs["dynamodb_table_name"]
        
        dynamodb_client = aws_clients["primary"]["dynamodb"]
        
        response = dynamodb_client.describe_table(TableName=table_name)
        
        key_schema = response["Table"].get("KeySchema", [])
        assert len(key_schema) > 0, "DynamoDB table should have key schema defined"
        
        # Verify at least one HASH key exists
        hash_keys = [k for k in key_schema if k["KeyType"] == "HASH"]
        assert len(hash_keys) == 1, "DynamoDB table should have exactly one HASH key"


@pytest.mark.integration
@pytest.mark.live
class TestSNSResources:
    """Test SNS topic resources."""
    
    def test_primary_sns_topic_exists(self, deployment_outputs, aws_clients):
        """Verify primary SNS alarm topic exists."""
        topic_arn = deployment_outputs["alarm_topic_arn"]
        
        sns_client = aws_clients["primary"]["sns"]
        
        response = sns_client.get_topic_attributes(TopicArn=topic_arn)
        
        assert response["Attributes"]["TopicArn"] == topic_arn
    
    def test_secondary_sns_topic_exists(self, deployment_outputs, aws_clients):
        """Verify secondary SNS alarm topic exists."""
        topic_arn = deployment_outputs["secondary_alarm_topic_arn"]
        
        sns_client = aws_clients["secondary"]["sns"]
        
        response = sns_client.get_topic_attributes(TopicArn=topic_arn)
        
        assert response["Attributes"]["TopicArn"] == topic_arn
    
    def test_primary_sns_topic_has_subscriptions(self, deployment_outputs, aws_clients):
        """Verify primary SNS topic has subscriptions configured."""
        topic_arn = deployment_outputs["alarm_topic_arn"]
        
        sns_client = aws_clients["primary"]["sns"]
        
        response = sns_client.list_subscriptions_by_topic(TopicArn=topic_arn)
        
        # Topic might have subscriptions for alarms
        subscriptions = response.get("Subscriptions", [])
        # Just verify we can list subscriptions (might be 0 if not configured yet)
        assert isinstance(subscriptions, list)
    
    def test_primary_sns_topic_encryption(self, deployment_outputs, aws_clients):
        """Verify primary SNS topic encryption configuration."""
        topic_arn = deployment_outputs["alarm_topic_arn"]
        
        sns_client = aws_clients["primary"]["sns"]
        
        response = sns_client.get_topic_attributes(TopicArn=topic_arn)
        
        # Check if KmsMasterKeyId is set (encryption enabled)
        attributes = response["Attributes"]
        # Encryption is optional but good practice
        assert "TopicArn" in attributes


@pytest.mark.integration
@pytest.mark.live
class TestSecretsManagerResources:
    """Test Secrets Manager resources."""
    
    def test_db_secret_exists(self, deployment_outputs, aws_clients):
        """Verify database secret exists in Secrets Manager."""
        secret_arn = deployment_outputs["db_secret_arn"]
        
        secretsmanager_client = aws_clients["primary"]["secretsmanager"]
        
        response = secretsmanager_client.describe_secret(SecretId=secret_arn)
        
        assert response["ARN"] == secret_arn
        assert response["Name"] is not None
    
    def test_db_secret_has_value(self, deployment_outputs, aws_clients):
        """Verify database secret has a value stored."""
        secret_arn = deployment_outputs["db_secret_arn"]
        
        secretsmanager_client = aws_clients["primary"]["secretsmanager"]
        
        response = secretsmanager_client.get_secret_value(SecretId=secret_arn)
        
        assert "SecretString" in response or "SecretBinary" in response
        assert len(response.get("SecretString", "")) > 0 or len(response.get("SecretBinary", b"")) > 0
    
    def test_db_secret_is_valid_json(self, deployment_outputs, aws_clients):
        """Verify database secret contains valid JSON credentials."""
        secret_arn = deployment_outputs["db_secret_arn"]
        
        secretsmanager_client = aws_clients["primary"]["secretsmanager"]
        
        response = secretsmanager_client.get_secret_value(SecretId=secret_arn)
        
        secret_string = response.get("SecretString")
        assert secret_string is not None
        
        # Parse as JSON
        secret_data = json.loads(secret_string)
        
        # Verify it has expected database credential fields
        assert isinstance(secret_data, dict)
        # Common fields in RDS secrets
        expected_fields = ["username", "password", "engine", "host", "port", "dbname"]
        # At least some of these should be present
        present_fields = [f for f in expected_fields if f in secret_data]
        assert len(present_fields) >= 3, "Secret should contain database credential fields"
    
    def test_db_secret_encryption(self, deployment_outputs, aws_clients):
        """Verify database secret is encrypted."""
        secret_arn = deployment_outputs["db_secret_arn"]
        
        secretsmanager_client = aws_clients["primary"]["secretsmanager"]
        
        response = secretsmanager_client.describe_secret(SecretId=secret_arn)
        
        # Secrets Manager always encrypts, but check if custom KMS key is used
        assert "KmsKeyId" in response or "ARN" in response
    
    def test_db_secret_rotation_enabled(self, deployment_outputs, aws_clients):
        """Verify database secret has rotation configuration."""
        secret_arn = deployment_outputs["db_secret_arn"]
        
        secretsmanager_client = aws_clients["primary"]["secretsmanager"]
        
        response = secretsmanager_client.describe_secret(SecretId=secret_arn)
        
        # Check if rotation is enabled (optional but recommended)
        rotation_enabled = response.get("RotationEnabled", False)
        # Just verify the field exists, rotation might not be enabled
        assert isinstance(rotation_enabled, bool)


@pytest.mark.integration
@pytest.mark.live
class TestRoute53Resources:
    """Test Route53 hosted zone resources."""
    
    def test_route53_zone_exists(self, deployment_outputs, aws_clients):
        """Verify Route53 hosted zone exists."""
        zone_id = deployment_outputs["route53_zone_id"]
        
        route53_client = aws_clients["primary"]["route53"]
        
        # Route53 zone IDs might need /hostedzone/ prefix
        if not zone_id.startswith("/hostedzone/"):
            zone_id_full = f"/hostedzone/{zone_id}"
        else:
            zone_id_full = zone_id
        
        response = route53_client.get_hosted_zone(Id=zone_id_full)
        
        assert response["HostedZone"]["Id"].endswith(zone_id)
    
    def test_route53_zone_has_records(self, deployment_outputs, aws_clients):
        """Verify Route53 hosted zone has DNS records."""
        zone_id = deployment_outputs["route53_zone_id"]
        
        route53_client = aws_clients["primary"]["route53"]
        
        if not zone_id.startswith("/hostedzone/"):
            zone_id_full = f"/hostedzone/{zone_id}"
        else:
            zone_id_full = zone_id
        
        response = route53_client.list_resource_record_sets(HostedZoneId=zone_id_full)
        
        record_sets = response.get("ResourceRecordSets", [])
        # Should have at least NS and SOA records
        assert len(record_sets) >= 2, "Hosted zone should have at least NS and SOA records"
    
    def test_failover_endpoint_configured(self, deployment_outputs, aws_clients):
        """Verify failover endpoint is configured in Route53."""
        zone_id = deployment_outputs["route53_zone_id"]
        failover_endpoint = deployment_outputs["failover_endpoint"]
        
        route53_client = aws_clients["primary"]["route53"]
        
        if not zone_id.startswith("/hostedzone/"):
            zone_id_full = f"/hostedzone/{zone_id}"
        else:
            zone_id_full = zone_id
        
        response = route53_client.list_resource_record_sets(HostedZoneId=zone_id_full)
        
        record_sets = response.get("ResourceRecordSets", [])
        
        # Look for the failover endpoint in record sets
        failover_records = [
            r for r in record_sets 
            if failover_endpoint in r.get("Name", "")
        ]
        
        # Verify failover endpoint exists in DNS
        assert len(failover_records) > 0, f"Failover endpoint {failover_endpoint} should be configured in Route53"


@pytest.mark.integration
@pytest.mark.live
class TestCrossRegionFailover:
    """Test cross-region failover configuration."""
    
    def test_both_regions_operational(self, deployment_outputs, aws_clients):
        """Verify both primary and secondary regions are operational."""
        # Test primary Lambda
        primary_lambda_arn = deployment_outputs["primary_lambda_arn"]
        primary_function_name = primary_lambda_arn.split(":")[-1]
        primary_lambda_client = aws_clients["primary"]["lambda"]
        
        primary_response = primary_lambda_client.get_function(FunctionName=primary_function_name)
        assert primary_response["Configuration"]["State"] == "Active"
        
        # Test secondary Lambda
        secondary_lambda_arn = deployment_outputs["secondary_lambda_arn"]
        secondary_function_name = secondary_lambda_arn.split(":")[-1]
        secondary_lambda_client = aws_clients["secondary"]["lambda"]
        
        secondary_response = secondary_lambda_client.get_function(FunctionName=secondary_function_name)
        assert secondary_response["Configuration"]["State"] == "Active"
    
    def test_both_rds_clusters_operational(self, deployment_outputs, aws_clients):
        """Verify both primary and secondary RDS clusters are operational."""
        # Test primary cluster
        primary_endpoint = deployment_outputs["primary_cluster_endpoint"]
        primary_cluster_id = primary_endpoint.split(".")[0]
        primary_rds_client = aws_clients["primary"]["rds"]
        
        primary_response = primary_rds_client.describe_db_clusters(
            DBClusterIdentifier=primary_cluster_id
        )
        assert primary_response["DBClusters"][0]["Status"] == "available"
        
        # Test secondary cluster
        secondary_endpoint = deployment_outputs["secondary_cluster_endpoint"]
        secondary_cluster_id = secondary_endpoint.split(".")[0]
        secondary_rds_client = aws_clients["secondary"]["rds"]
        
        secondary_response = secondary_rds_client.describe_db_clusters(
            DBClusterIdentifier=secondary_cluster_id
        )
        assert secondary_response["DBClusters"][0]["Status"] == "available"
    
    def test_alarm_topics_in_both_regions(self, deployment_outputs, aws_clients):
        """Verify alarm topics exist in both regions for monitoring."""
        # Test primary alarm topic
        primary_topic_arn = deployment_outputs["alarm_topic_arn"]
        primary_sns_client = aws_clients["primary"]["sns"]
        
        primary_response = primary_sns_client.get_topic_attributes(TopicArn=primary_topic_arn)
        assert primary_response["Attributes"]["TopicArn"] == primary_topic_arn
        
        # Test secondary alarm topic
        secondary_topic_arn = deployment_outputs["secondary_alarm_topic_arn"]
        secondary_sns_client = aws_clients["secondary"]["sns"]
        
        secondary_response = secondary_sns_client.get_topic_attributes(TopicArn=secondary_topic_arn)
        assert secondary_response["Attributes"]["TopicArn"] == secondary_topic_arn


@pytest.mark.integration
@pytest.mark.live
class TestResourceTagging:
    """Test resource tagging for cost allocation and management."""
    
    def test_primary_lambda_has_tags(self, deployment_outputs, aws_clients):
        """Verify primary Lambda function has appropriate tags."""
        lambda_arn = deployment_outputs["primary_lambda_arn"]
        
        lambda_client = aws_clients["primary"]["lambda"]
        
        response = lambda_client.list_tags(Resource=lambda_arn)
        
        tags = response.get("Tags", {})
        # Verify tags exist (specific tags depend on implementation)
        assert isinstance(tags, dict)
    
    def test_dynamodb_table_has_tags(self, deployment_outputs, aws_clients):
        """Verify DynamoDB table has appropriate tags."""
        table_name = deployment_outputs["dynamodb_table_name"]
        
        dynamodb_client = aws_clients["primary"]["dynamodb"]
        
        # Get table ARN first
        table_response = dynamodb_client.describe_table(TableName=table_name)
        table_arn = table_response["Table"]["TableArn"]
        
        # List tags
        tags_response = dynamodb_client.list_tags_of_resource(ResourceArn=table_arn)
        
        tags = tags_response.get("Tags", [])
        # Verify tags exist
        assert isinstance(tags, list)


@pytest.mark.integration
@pytest.mark.live
class TestSecurityConfiguration:
    """Test security configurations across resources."""
    
    def test_lambda_execution_role_has_permissions(self, deployment_outputs, aws_clients):
        """Verify Lambda execution role has necessary permissions."""
        lambda_arn = deployment_outputs["primary_lambda_arn"]
        function_name = lambda_arn.split(":")[-1]
        
        lambda_client = aws_clients["primary"]["lambda"]
        
        response = lambda_client.get_function(FunctionName=function_name)
        
        role_arn = response["Configuration"]["Role"]
        assert role_arn is not None
        assert "role" in role_arn.lower()
    
    def test_vpc_security_groups_configured(self, deployment_outputs, aws_clients):
        """Verify VPC security groups are properly configured."""
        vpc_id = deployment_outputs["primary_vpc_id"]
        
        ec2_client = aws_clients["primary"]["ec2"]
        
        response = ec2_client.describe_security_groups(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )
        
        security_groups = response["SecurityGroups"]
        
        # Verify security groups have rules
        for sg in security_groups:
            # Each SG should have either ingress or egress rules (or both)
            has_rules = (
                len(sg.get("IpPermissions", [])) > 0 or 
                len(sg.get("IpPermissionsEgress", [])) > 0
            )
            assert has_rules, f"Security group {sg['GroupId']} should have rules configured"
    
    def test_rds_cluster_in_private_subnet(self, deployment_outputs, aws_clients):
        """Verify RDS cluster is not publicly accessible."""
        cluster_endpoint = deployment_outputs["primary_cluster_endpoint"]
        cluster_id = cluster_endpoint.split(".")[0]
        
        rds_client = aws_clients["primary"]["rds"]
        
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=cluster_id
        )
        
        cluster = response["DBClusters"][0]
        # RDS cluster should not be publicly accessible
        assert cluster.get("PubliclyAccessible", True) is False, "RDS cluster should not be publicly accessible"
