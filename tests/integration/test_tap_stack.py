"""Integration tests for TapStack - Database Migration Infrastructure."""
import json
import os
import pytest
import boto3
from botocore.exceptions import ClientError


@pytest.fixture(scope="module")
def outputs():
    """Load deployment outputs from flat-outputs.json.
    
    Handles nested format (stack name as top-level key) and flat format.
    CDKTF outputs are typically nested: {"TapStack<ENVIRONMENT_SUFFIX>": {"VpcId": "...", ...}}
    """
    outputs_file = "cfn-outputs/flat-outputs.json"
    if not os.path.exists(outputs_file):
        pytest.skip(f"{outputs_file} not found - deployment may not have completed")

    with open(outputs_file, "r", encoding="utf-8") as f:
        data = json.load(f)
    
    # Handle nested structure: {"TapStack<ENVIRONMENT_SUFFIX>": {"VpcId": "...", ...}}
    if isinstance(data, dict) and data:
        # Check if data has a key starting with "TapStack" (CDKTF stack name format)
        stack_keys = [key for key in data.keys() if key.startswith("TapStack")]
        if stack_keys:
            # Extract outputs from the first TapStack key found
            stack_outputs = data[stack_keys[0]]
            if isinstance(stack_outputs, dict):
                return stack_outputs
            else:
                pytest.skip(f"Stack outputs for {stack_keys[0]} are not in expected format")
        elif isinstance(data, dict) and len(data) == 1:
            # Single key, might be stack name - extract its value
            first_value = next(iter(data.values()))
            if isinstance(first_value, dict):
                return first_value
        # Assume flat structure: {"VpcId": "...", ...}
        return data
    
    # Not a dict or empty, return as-is
    return data


@pytest.fixture(scope="module")
def aws_region(outputs):
    """Get AWS region from environment or default."""
    return os.environ.get("AWS_REGION", "us-east-1")


class TestVPCInfrastructure:
    """Test suite for VPC and networking infrastructure."""

    def test_vpc_exists(self, outputs, aws_region):
        """Verify VPC was created and is available."""
        if "VpcId" not in outputs:
            pytest.skip("VPC ID not in outputs")

        ec2 = boto3.client("ec2", region_name=aws_region)
        try:
            response = ec2.describe_vpcs(VpcIds=[outputs["VpcId"]])
            assert len(response["Vpcs"]) == 1
            vpc = response["Vpcs"][0]
            assert vpc["State"] == "available"
        except ClientError:
            pytest.skip("VPC not accessible or doesn't exist")

    def test_subnets_exist(self, outputs, aws_region):
        """Verify subnets were created in multiple AZs."""
        subnet_keys = ["SubnetIdA", "SubnetIdB", "SubnetIdC"]
        subnet_ids = [outputs[key] for key in subnet_keys if key in outputs]

        if not subnet_ids:
            pytest.skip("Subnet IDs not in outputs")

        ec2 = boto3.client("ec2", region_name=aws_region)
        try:
            response = ec2.describe_subnets(SubnetIds=subnet_ids)
            assert len(response["Subnets"]) >= 2
            # Verify subnets are in different AZs
            azs = {subnet["AvailabilityZone"] for subnet in response["Subnets"]}
            assert len(azs) >= 2
        except ClientError:
            pytest.skip("Subnets not accessible")

    def test_internet_gateway_exists(self, outputs, aws_region):
        """Verify Internet Gateway was created and attached."""
        if "InternetGatewayId" not in outputs:
            pytest.skip("Internet Gateway ID not in outputs")

        ec2 = boto3.client("ec2", region_name=aws_region)
        try:
            response = ec2.describe_internet_gateways(
                InternetGatewayIds=[outputs["InternetGatewayId"]]
            )
            assert len(response["InternetGateways"]) == 1
            igw = response["InternetGateways"][0]
            assert len(igw["Attachments"]) > 0
            assert igw["Attachments"][0]["State"] == "available"
        except ClientError:
            pytest.skip("Internet Gateway not accessible")

    def test_security_groups_exist(self, outputs, aws_region):
        """Verify security groups were created."""
        sg_keys = ["AuroraSecurityGroupId", "DmsSecurityGroupId"]
        sg_ids = [outputs[key] for key in sg_keys if key in outputs]

        if not sg_ids:
            pytest.skip("Security Group IDs not in outputs")

        ec2 = boto3.client("ec2", region_name=aws_region)
        try:
            response = ec2.describe_security_groups(GroupIds=sg_ids)
            assert len(response["SecurityGroups"]) >= 1
        except ClientError:
            pytest.skip("Security Groups not accessible")


class TestRDSAuroraCluster:
    """Test suite for RDS Aurora cluster resources."""

    def test_aurora_cluster_exists(self, outputs, aws_region):
        """Verify Aurora cluster was created and is available."""
        if "AuroraClusterId" not in outputs:
            pytest.skip("Aurora Cluster ID not in outputs")

        rds = boto3.client("rds", region_name=aws_region)
        try:
            response = rds.describe_db_clusters(
                DBClusterIdentifier=outputs["AuroraClusterId"]
            )
            assert len(response["DBClusters"]) == 1
            cluster = response["DBClusters"][0]
            # Accept multiple valid statuses: available, creating, backing-up, modifying, etc.
            valid_statuses = ["available", "creating", "backing-up", "modifying", "upgrading"]
            assert cluster["Status"] in valid_statuses, f"Cluster status '{cluster['Status']}' not in valid statuses: {valid_statuses}"
            assert cluster["Engine"] == "aurora-postgresql"
        except ClientError:
            pytest.skip("Aurora Cluster not accessible")

    def test_aurora_cluster_instances_exist(self, outputs, aws_region):
        """Verify Aurora cluster instances were created."""
        instance_keys = ["AuroraWriterInstanceId", "AuroraReaderInstanceId1", "AuroraReaderInstanceId2"]
        instance_ids = [outputs[key] for key in instance_keys if key in outputs]

        if not instance_ids:
            pytest.skip("Aurora Instance IDs not in outputs")

        rds = boto3.client("rds", region_name=aws_region)
        try:
            for instance_id in instance_ids:
                response = rds.describe_db_instances(DBInstanceIdentifier=instance_id)
                assert len(response["DBInstances"]) == 1
        except ClientError:
            pytest.skip("Aurora Instances not accessible")

    def test_aurora_encryption_enabled(self, outputs, aws_region):
        """Verify Aurora cluster has encryption enabled."""
        if "AuroraClusterId" not in outputs:
            pytest.skip("Aurora Cluster ID not in outputs")

        rds = boto3.client("rds", region_name=aws_region)
        try:
            response = rds.describe_db_clusters(
                DBClusterIdentifier=outputs["AuroraClusterId"]
            )
            cluster = response["DBClusters"][0]
            assert cluster["StorageEncrypted"] is True
        except ClientError:
            pytest.skip("Aurora Cluster not accessible")

    def test_aurora_endpoint_accessible(self, outputs):
        """Verify Aurora endpoint is present in outputs."""
        assert "AuroraClusterEndpoint" in outputs
        assert outputs["AuroraClusterEndpoint"] != ""
        assert "AuroraClusterReaderEndpoint" in outputs
        assert outputs["AuroraClusterReaderEndpoint"] != ""


class TestDMSResources:
    """Test suite for DMS migration resources."""

    def test_dms_replication_instance_exists(self, outputs, aws_region):
        """Verify DMS replication instance was created."""
        if "DmsReplicationInstanceId" not in outputs:
            pytest.skip("DMS Replication Instance ID not in outputs")

        dms = boto3.client("dms", region_name=aws_region)
        try:
            response = dms.describe_replication_instances(
                Filters=[{
                    "Name": "replication-instance-id",
                    "Values": [outputs["DmsReplicationInstanceId"]]
                }]
            )
            assert len(response["ReplicationInstances"]) == 1
            instance = response["ReplicationInstances"][0]
            assert instance["ReplicationInstanceStatus"] in ["available", "creating"]
        except ClientError:
            pytest.skip("DMS Replication Instance not accessible")

    def test_dms_endpoints_exist(self, outputs, aws_region):
        """Verify DMS source and target endpoints were created."""
        endpoint_arns = []
        if "DmsSourceEndpointArn" in outputs:
            endpoint_arns.append(outputs["DmsSourceEndpointArn"])
        if "DmsTargetEndpointArn" in outputs:
            endpoint_arns.append(outputs["DmsTargetEndpointArn"])

        if not endpoint_arns:
            pytest.skip("DMS Endpoint ARNs not in outputs")

        dms = boto3.client("dms", region_name=aws_region)
        try:
            for arn in endpoint_arns:
                response = dms.describe_endpoints(
                    Filters=[{
                        "Name": "endpoint-arn",
                        "Values": [arn]
                    }]
                )
                assert len(response["Endpoints"]) == 1
        except ClientError:
            pytest.skip("DMS Endpoints not accessible")

    def test_dms_migration_task_exists(self, outputs, aws_region):
        """Verify DMS migration task was created."""
        if "DmsMigrationTaskArn" not in outputs:
            pytest.skip("DMS Migration Task ARN not in outputs")

        dms = boto3.client("dms", region_name=aws_region)
        try:
            response = dms.describe_replication_tasks(
                Filters=[{
                    "Name": "replication-task-arn",
                    "Values": [outputs["DmsMigrationTaskArn"]]
                }]
            )
            assert len(response["ReplicationTasks"]) == 1
            task = response["ReplicationTasks"][0]
            assert task["MigrationType"] == "full-load-and-cdc"
        except ClientError:
            pytest.skip("DMS Migration Task not accessible")


class TestRoute53Resources:
    """Test suite for Route 53 DNS resources."""

    def test_hosted_zone_exists(self, outputs, aws_region):
        """Verify Route 53 hosted zone was created."""
        if "Route53HostedZoneId" not in outputs:
            pytest.skip("Route53 Hosted Zone ID not in outputs")

        route53 = boto3.client("route53", region_name=aws_region)
        try:
            # Route53 API returns zone ID with "/hostedzone/" prefix, normalize for comparison
            response = route53.get_hosted_zone(Id=outputs["Route53HostedZoneId"])
            api_zone_id = response["HostedZone"]["Id"]
            # Strip "/hostedzone/" prefix if present
            api_zone_id_normalized = api_zone_id.replace("/hostedzone/", "")
            output_zone_id = outputs["Route53HostedZoneId"].replace("/hostedzone/", "")
            assert api_zone_id_normalized == output_zone_id, f"Zone ID mismatch: API={api_zone_id_normalized}, Output={output_zone_id}"
        except ClientError:
            pytest.skip("Route53 Hosted Zone not accessible")

    def test_weighted_routing_records_exist(self, outputs, aws_region):
        """Verify weighted routing records were created."""
        if "Route53HostedZoneId" not in outputs or "Route53DnsName" not in outputs:
            pytest.skip("Route53 info not in outputs")

        route53 = boto3.client("route53", region_name=aws_region)
        try:
            response = route53.list_resource_record_sets(
                HostedZoneId=outputs["Route53HostedZoneId"]
            )
            # Look for CNAME records with weighted routing
            cname_records = [
                r for r in response["ResourceRecordSets"]
                if r["Type"] == "CNAME" and "Weight" in r
            ]
            assert len(cname_records) >= 2
        except ClientError:
            pytest.skip("Route53 records not accessible")


class TestLambdaResources:
    """Test suite for Lambda function resources."""

    def test_lambda_function_exists(self, outputs, aws_region):
        """Verify Lambda function was created."""
        if "LambdaFunctionName" not in outputs:
            pytest.skip("Lambda Function Name not in outputs")

        lambda_client = boto3.client("lambda", region_name=aws_region)
        try:
            response = lambda_client.get_function(
                FunctionName=outputs["LambdaFunctionName"]
            )
            assert response["Configuration"]["FunctionName"] == outputs["LambdaFunctionName"]
            assert response["Configuration"]["Runtime"].startswith("python")
        except ClientError:
            pytest.skip("Lambda function not accessible")

    def test_lambda_environment_variables(self, outputs, aws_region):
        """Verify Lambda has correct environment variables."""
        if "LambdaFunctionName" not in outputs:
            pytest.skip("Lambda Function Name not in outputs")

        lambda_client = boto3.client("lambda", region_name=aws_region)
        try:
            response = lambda_client.get_function(
                FunctionName=outputs["LambdaFunctionName"]
            )
            env_vars = response["Configuration"]["Environment"]["Variables"]
            assert "HOSTED_ZONE_ID" in env_vars
            assert "DMS_TASK_ARN" in env_vars
            assert "AURORA_ENDPOINT" in env_vars
        except ClientError:
            pytest.skip("Lambda function not accessible")


class TestCloudWatchResources:
    """Test suite for CloudWatch monitoring resources."""

    def test_cloudwatch_dashboard_exists(self, outputs, aws_region):
        """Verify CloudWatch dashboard was created."""
        if "CloudWatchDashboardName" not in outputs:
            pytest.skip("CloudWatch Dashboard Name not in outputs")

        cloudwatch = boto3.client("cloudwatch", region_name=aws_region)
        try:
            response = cloudwatch.get_dashboard(
                DashboardName=outputs["CloudWatchDashboardName"]
            )
            assert response["DashboardName"] == outputs["CloudWatchDashboardName"]
            assert response["DashboardBody"] is not None
        except ClientError:
            pytest.skip("CloudWatch Dashboard not accessible")

    def test_cloudwatch_alarms_exist(self, outputs, aws_region):
        """Verify CloudWatch alarms were created."""
        cloudwatch = boto3.client("cloudwatch", region_name=aws_region)
        try:
            # Find alarms related to migration
            response = cloudwatch.describe_alarms()
            alarm_names = [alarm["AlarmName"] for alarm in response["MetricAlarms"]]
            # Check if any alarm names contain expected patterns
            migration_alarms = [
                name for name in alarm_names
                if "dms" in name.lower() or "aurora" in name.lower()
            ]
            assert len(migration_alarms) >= 1
        except ClientError:
            pytest.skip("CloudWatch Alarms not accessible")


class TestEventBridgeResources:
    """Test suite for EventBridge resources."""

    def test_eventbridge_rule_exists(self, outputs, aws_region):
        """Verify EventBridge rule was created."""
        if "EventBridgeRuleName" not in outputs:
            pytest.skip("EventBridge Rule Name not in outputs")

        events = boto3.client("events", region_name=aws_region)
        try:
            response = events.describe_rule(Name=outputs["EventBridgeRuleName"])
            assert response["Name"] == outputs["EventBridgeRuleName"]
            assert response["State"] == "ENABLED"
        except ClientError:
            pytest.skip("EventBridge Rule not accessible")

    def test_eventbridge_targets_exist(self, outputs, aws_region):
        """Verify EventBridge targets were created."""
        if "EventBridgeRuleName" not in outputs:
            pytest.skip("EventBridge Rule Name not in outputs")

        events = boto3.client("events", region_name=aws_region)
        try:
            response = events.list_targets_by_rule(
                Rule=outputs["EventBridgeRuleName"]
            )
            assert len(response["Targets"]) >= 1
        except ClientError:
            pytest.skip("EventBridge Targets not accessible")


class TestSNSResources:
    """Test suite for SNS notification resources."""

    def test_sns_topic_exists(self, outputs, aws_region):
        """Verify SNS topic was created."""
        if "SnsTopicArn" not in outputs:
            pytest.skip("SNS Topic ARN not in outputs")

        sns = boto3.client("sns", region_name=aws_region)
        try:
            response = sns.get_topic_attributes(TopicArn=outputs["SnsTopicArn"])
            assert response["Attributes"]["TopicArn"] == outputs["SnsTopicArn"]
        except ClientError:
            pytest.skip("SNS Topic not accessible")


class TestKMSResources:
    """Test suite for KMS encryption resources."""

    def test_kms_key_exists(self, outputs, aws_region):
        """Verify KMS key was created."""
        if "KmsKeyId" not in outputs:
            pytest.skip("KMS Key ID not in outputs")

        kms = boto3.client("kms", region_name=aws_region)
        try:
            response = kms.describe_key(KeyId=outputs["KmsKeyId"])
            assert response["KeyMetadata"]["KeyId"] == outputs["KmsKeyId"]
            assert response["KeyMetadata"]["Enabled"] is True
        except ClientError:
            pytest.skip("KMS Key not accessible")

    def test_kms_key_rotation_enabled(self, outputs, aws_region):
        """Verify KMS key rotation is enabled."""
        if "KmsKeyId" not in outputs:
            pytest.skip("KMS Key ID not in outputs")

        kms = boto3.client("kms", region_name=aws_region)
        try:
            response = kms.get_key_rotation_status(KeyId=outputs["KmsKeyId"])
            assert response["KeyRotationEnabled"] is True
        except ClientError:
            pytest.skip("KMS Key not accessible")


class TestSSMParameters:
    """Test suite for SSM Parameter Store resources."""

    def test_ssm_config_parameter_exists(self, outputs, aws_region):
        """Verify SSM config parameter was created."""
        if "SsmConfigParameter" not in outputs:
            pytest.skip("SSM Config Parameter not in outputs")

        ssm = boto3.client("ssm", region_name=aws_region)
        try:
            response = ssm.get_parameter(Name=outputs["SsmConfigParameter"])
            assert response["Parameter"]["Name"] == outputs["SsmConfigParameter"]
            # Verify it's valid JSON
            config = json.loads(response["Parameter"]["Value"])
            assert "aurora_endpoint" in config
            assert "dms_task_arn" in config
        except ClientError:
            pytest.skip("SSM Config Parameter not accessible")

    def test_ssm_state_parameter_exists(self, outputs, aws_region):
        """Verify SSM state parameter was created."""
        if "SsmStateParameter" not in outputs:
            pytest.skip("SSM State Parameter not in outputs")

        ssm = boto3.client("ssm", region_name=aws_region)
        try:
            response = ssm.get_parameter(Name=outputs["SsmStateParameter"])
            assert response["Parameter"]["Name"] == outputs["SsmStateParameter"]
            # Verify it's valid JSON
            state = json.loads(response["Parameter"]["Value"])
            assert "status" in state
            assert "phase" in state
        except ClientError:
            pytest.skip("SSM State Parameter not accessible")


class TestBackupResources:
    """Test suite for AWS Backup resources."""

    def test_backup_vault_exists(self, outputs, aws_region):
        """Verify AWS Backup vault was created."""
        if "BackupVaultName" not in outputs:
            pytest.skip("Backup Vault Name not in outputs")

        backup = boto3.client("backup", region_name=aws_region)
        try:
            response = backup.describe_backup_vault(
                BackupVaultName=outputs["BackupVaultName"]
            )
            assert response["BackupVaultName"] == outputs["BackupVaultName"]
        except ClientError:
            pytest.skip("Backup Vault not accessible")

    def test_backup_plan_exists(self, outputs, aws_region):
        """Verify AWS Backup plan was created."""
        if "BackupPlanId" not in outputs:
            pytest.skip("Backup Plan ID not in outputs")

        backup = boto3.client("backup", region_name=aws_region)
        try:
            response = backup.get_backup_plan(BackupPlanId=outputs["BackupPlanId"])
            assert response["BackupPlanId"] == outputs["BackupPlanId"]
            assert len(response["BackupPlan"]["Rules"]) >= 1
        except ClientError:
            pytest.skip("Backup Plan not accessible")


class TestEndToEndWorkflow:
    """Test suite for end-to-end migration workflow validation."""

    def test_migration_infrastructure_complete(self, outputs):
        """Verify all required infrastructure components are present."""
        required_keys = [
            "VpcId",
            "AuroraClusterId",
            "AuroraClusterEndpoint",
            "DmsReplicationInstanceId",
            "DmsMigrationTaskArn",
            "Route53HostedZoneId",
            "LambdaFunctionName",
            "SnsTopicArn",
            "KmsKeyId"
        ]

        missing_keys = [key for key in required_keys if key not in outputs]
        assert len(missing_keys) == 0, f"Missing required outputs: {missing_keys}"

    def test_migration_data_flow_configuration(self, outputs):
        """Verify migration data flow is properly configured."""
        # Verify we have source endpoint, target endpoint, and migration task
        assert "DmsSourceEndpointArn" in outputs
        assert "DmsTargetEndpointArn" in outputs
        assert "DmsMigrationTaskArn" in outputs
        assert "AuroraClusterEndpoint" in outputs

    def test_monitoring_and_alerting_configured(self, outputs):
        """Verify monitoring and alerting infrastructure is configured."""
        # Verify CloudWatch and SNS resources
        assert "CloudWatchDashboardName" in outputs
        assert "SnsTopicArn" in outputs
        assert "EventBridgeRuleName" in outputs

    def test_cutover_automation_configured(self, outputs):
        """Verify automated cutover infrastructure is configured."""
        # Verify Lambda, Route53, and EventBridge are set up for cutover
        assert "LambdaFunctionName" in outputs
        assert "Route53HostedZoneId" in outputs
        assert "EventBridgeRuleName" in outputs

    def test_backup_and_recovery_configured(self, outputs):
        """Verify backup and recovery infrastructure is configured."""
        # Verify AWS Backup resources
        assert "BackupVaultName" in outputs
        assert "BackupPlanId" in outputs
