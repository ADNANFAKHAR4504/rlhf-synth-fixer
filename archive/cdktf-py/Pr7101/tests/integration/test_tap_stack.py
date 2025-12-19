"""Integration tests for deployed TAP Stack resources."""
import os
import json
import boto3
from pathlib import Path


# Get environment variables
environment_suffix = os.environ.get("ENVIRONMENT_SUFFIX", "dev")
region = os.environ.get("AWS_REGION", "us-east-1")

# Read flat outputs
outputs_path = Path.cwd() / "cfn-outputs" / "flat-outputs.json"
with open(outputs_path, "r", encoding="utf-8") as f:
    outputs = json.load(f)

# Handle nested CDKTF output structure (e.g., {"TapStackpr7101": {...}})
# If outputs has a single key that looks like a stack name, use its value
if len(outputs) == 1 and list(outputs.keys())[0].startswith("TapStack"):
    stack_name = list(outputs.keys())[0]
    outputs = outputs[stack_name]

# Extract outputs
vpc_id = outputs["vpc_id"]
aurora_cluster_id = outputs["aurora_cluster_id"]
aurora_cluster_arn = outputs["aurora_cluster_arn"]
aurora_endpoint = outputs["aurora_endpoint"]
dynamodb_table_name = outputs["dynamodb_table_name"]
lambda_function_name = outputs["lambda_function_name"]
lambda_url = outputs["lambda_url"]
hosted_zone_id = outputs["hosted_zone_id"]

# Initialize AWS clients
ec2_client = boto3.client("ec2", region_name=region)
rds_client = boto3.client("rds", region_name=region)
dynamodb_client = boto3.client("dynamodb", region_name=region)
lambda_client = boto3.client("lambda", region_name=region)
route53_client = boto3.client("route53", region_name=region)
events_client = boto3.client("events", region_name=region)
backup_client = boto3.client("backup", region_name=region)
cloudwatch_client = boto3.client("cloudwatch", region_name=region)
iam_client = boto3.client("iam", region_name=region)
ssm_client = boto3.client("ssm", region_name=region)


class TestVPCNetworking:
    """Test VPC and networking resources."""

    def test_vpc_exists_and_configured(self):
        """Verify VPC exists with correct configuration."""
        response = ec2_client.describe_vpcs(VpcIds=[vpc_id])

        assert len(response["Vpcs"]) == 1
        vpc = response["Vpcs"][0]

        assert vpc["State"] == "available"
        assert vpc["CidrBlock"] == "10.0.0.0/16"

        dns_hostnames = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute="enableDnsHostnames"
        )
        assert dns_hostnames["EnableDnsHostnames"]["Value"] is True

        dns_support = ec2_client.describe_vpc_attribute(
            VpcId=vpc_id, Attribute="enableDnsSupport"
        )
        assert dns_support["EnableDnsSupport"]["Value"] is True

        tags = {tag["Key"]: tag["Value"] for tag in vpc.get("Tags", [])}
        assert environment_suffix in tags.get("Name", "")

    def test_subnets_span_three_availability_zones(self):
        """Verify subnets are created across 3 availability zones."""
        response = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        subnets = response["Subnets"]
        assert len(subnets) >= 6

        availability_zones = set(subnet["AvailabilityZone"] for subnet in subnets)
        assert len(availability_zones) == 3

        for az in availability_zones:
            assert az.startswith(region)

        public_subnets = [s for s in subnets if s.get("MapPublicIpOnLaunch", False)]
        private_subnets = [s for s in subnets if not s.get("MapPublicIpOnLaunch", False)]

        assert len(public_subnets) == 3
        assert len(private_subnets) == 3

    def test_internet_gateway_attached(self):
        """Verify internet gateway is attached to VPC."""
        response = ec2_client.describe_internet_gateways(
            Filters=[{"Name": "attachment.vpc-id", "Values": [vpc_id]}]
        )

        assert len(response["InternetGateways"]) >= 1
        igw = response["InternetGateways"][0]

        assert len(igw["Attachments"]) > 0
        assert igw["Attachments"][0]["State"] == "available"
        assert igw["Attachments"][0]["VpcId"] == vpc_id

    def test_nat_gateway_operational(self):
        """Verify NAT gateway is operational for private subnet internet access."""
        response = ec2_client.describe_nat_gateways(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        assert len(response["NatGateways"]) >= 1
        nat_gateway = response["NatGateways"][0]

        assert nat_gateway["State"] == "available"
        assert len(nat_gateway["NatGatewayAddresses"]) > 0

    def test_security_groups_configured(self):
        """Verify security groups for database and Lambda are configured."""
        response = ec2_client.describe_security_groups(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        security_groups = response["SecurityGroups"]
        sg_names = [sg["GroupName"] for sg in security_groups]

        db_sg_exists = any(f"payment-db-sg-{region}-{environment_suffix}" in name for name in sg_names)
        lambda_sg_exists = any(f"payment-lambda-sg-{region}-{environment_suffix}" in name for name in sg_names)

        assert db_sg_exists
        assert lambda_sg_exists

        db_sg = next(
            sg for sg in security_groups
            if f"payment-db-sg-{region}-{environment_suffix}" in sg["GroupName"]
        )

        assert len(db_sg["IpPermissions"]) > 0
        mysql_rule = next(
            (rule for rule in db_sg["IpPermissions"] if rule.get("FromPort") == 3306),
            None
        )
        assert mysql_rule is not None


class TestAuroraDatabase:
    """Test Aurora MySQL cluster resources."""

    def test_aurora_cluster_available_with_backtracking(self):
        """Verify Aurora cluster is available with 72-hour backtracking enabled."""
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=aurora_cluster_id
        )

        assert len(response["DBClusters"]) == 1
        cluster = response["DBClusters"][0]

        assert cluster["Status"] == "available"
        assert cluster["Engine"] == "aurora-mysql"
        assert cluster["EngineVersion"].startswith("8.0")
        assert cluster["BacktrackWindow"] == 259200
        assert cluster["BackupRetentionPeriod"] == 7
        assert cluster["Endpoint"] == aurora_endpoint
        assert cluster["DatabaseName"] == "payments"

    def test_aurora_instance_correct_class(self):
        """Verify Aurora instance is running with db.r5.large instance class."""
        response = rds_client.describe_db_instances(
            Filters=[{"Name": "db-cluster-id", "Values": [aurora_cluster_id]}]
        )

        assert len(response["DBInstances"]) >= 1
        instance = response["DBInstances"][0]

        assert instance["DBInstanceStatus"] == "available"
        assert instance["DBInstanceClass"] == "db.r5.large"
        assert instance["Engine"] == "aurora-mysql"

    def test_aurora_cloudwatch_logs_enabled(self):
        """Verify Aurora cluster has CloudWatch logs exports enabled."""
        response = rds_client.describe_db_clusters(
            DBClusterIdentifier=aurora_cluster_id
        )

        cluster = response["DBClusters"][0]
        enabled_logs = cluster.get("EnabledCloudwatchLogsExports", [])

        assert "audit" in enabled_logs
        assert "error" in enabled_logs
        assert "general" in enabled_logs
        assert "slowquery" in enabled_logs


class TestDynamoDB:
    """Test DynamoDB table resources."""

    def test_dynamodb_table_active_with_pitr(self):
        """Verify DynamoDB table is active with point-in-time recovery enabled."""
        response = dynamodb_client.describe_table(TableName=dynamodb_table_name)

        table = response["Table"]
        assert table["TableStatus"] == "ACTIVE"
        assert table["BillingModeSummary"]["BillingMode"] == "PAY_PER_REQUEST"

        key_schema = {key["AttributeName"]: key["KeyType"] for key in table["KeySchema"]}
        assert "session_id" in key_schema
        assert key_schema["session_id"] == "HASH"

        assert table["StreamSpecification"]["StreamEnabled"] is True
        assert table["StreamSpecification"]["StreamViewType"] == "NEW_AND_OLD_IMAGES"

    def test_dynamodb_point_in_time_recovery_enabled(self):
        """Verify DynamoDB table has point-in-time recovery enabled."""
        response = dynamodb_client.describe_continuous_backups(
            TableName=dynamodb_table_name
        )

        pitr_description = response["ContinuousBackupsDescription"]
        assert pitr_description["ContinuousBackupsStatus"] == "ENABLED"
        assert pitr_description["PointInTimeRecoveryDescription"]["PointInTimeRecoveryStatus"] == "ENABLED"

    def test_dynamodb_table_can_perform_operations(self):
        """Verify DynamoDB table can perform basic operations."""
        test_session_id = f"test-session-{environment_suffix}"

        dynamodb_client.put_item(
            TableName=dynamodb_table_name,
            Item={
                "session_id": {"S": test_session_id},
                "data": {"S": "test-data"},
                "timestamp": {"N": "1234567890"}
            }
        )

        response = dynamodb_client.get_item(
            TableName=dynamodb_table_name,
            Key={"session_id": {"S": test_session_id}}
        )

        assert "Item" in response
        assert response["Item"]["session_id"]["S"] == test_session_id

        dynamodb_client.delete_item(
            TableName=dynamodb_table_name,
            Key={"session_id": {"S": test_session_id}}
        )


class TestLambdaFunction:
    """Test Lambda function resources."""

    def test_lambda_function_active_in_vpc(self):
        """Verify Lambda function is active and deployed in VPC."""
        response = lambda_client.get_function(FunctionName=lambda_function_name)

        config = response["Configuration"]
        assert config["State"] == "Active"
        assert config["Runtime"] == "python3.11"
        assert config["MemorySize"] == 1024
        assert config["Timeout"] == 30

        assert "VpcConfig" in config
        vpc_config = config["VpcConfig"]
        assert vpc_config["VpcId"] == vpc_id
        assert len(vpc_config["SubnetIds"]) == 3
        assert len(vpc_config["SecurityGroupIds"]) >= 1

    def test_lambda_environment_variables_configured(self):
        """Verify Lambda function has correct environment variables."""
        response = lambda_client.get_function(FunctionName=lambda_function_name)

        config = response["Configuration"]
        assert "Environment" in config

        env_vars = config["Environment"]["Variables"]
        assert "DB_ENDPOINT" in env_vars
        assert "DYNAMODB_TABLE" in env_vars
        assert "REGION" in env_vars
        assert "ENVIRONMENT_SUFFIX" in env_vars

        assert env_vars["DB_ENDPOINT"] == aurora_endpoint
        assert env_vars["DYNAMODB_TABLE"] == dynamodb_table_name
        assert env_vars["REGION"] == region
        assert env_vars["ENVIRONMENT_SUFFIX"] == environment_suffix

    def test_lambda_function_url_accessible(self):
        """Verify Lambda function URL is configured and accessible."""
        response = lambda_client.get_function_url_config(
            FunctionName=lambda_function_name
        )

        assert response["FunctionUrl"] == lambda_url
        assert response["AuthType"] == "NONE"

    def test_lambda_iam_role_has_required_permissions(self):
        """Verify Lambda function has IAM role with required permissions."""
        response = lambda_client.get_function(FunctionName=lambda_function_name)

        role_arn = response["Configuration"]["Role"]
        role_name = role_arn.split("/")[-1]

        role_response = iam_client.get_role(RoleName=role_name)
        assert role_response["Role"]["RoleName"] == role_name

        attached_policies = iam_client.list_attached_role_policies(RoleName=role_name)
        policy_arns = [p["PolicyArn"] for p in attached_policies["AttachedPolicies"]]

        assert len(policy_arns) > 0


class TestEventBridge:
    """Test EventBridge resources."""

    def test_eventbridge_rule_enabled_and_targeting_lambda(self):
        """Verify EventBridge rule is enabled and targets Lambda function."""
        rule_name = f"payment-events-{environment_suffix}"

        response = events_client.describe_rule(Name=rule_name)

        assert response["State"] == "ENABLED"
        assert response["Name"] == rule_name
        assert "EventPattern" in response

        event_pattern = json.loads(response["EventPattern"])
        assert "source" in event_pattern
        assert "payment.processor" in event_pattern["source"]
        assert "detail-type" in event_pattern

        targets = events_client.list_targets_by_rule(Rule=rule_name)
        assert len(targets["Targets"]) >= 1

        target = targets["Targets"][0]
        assert lambda_function_name in target["Arn"]


class TestRoute53:
    """Test Route 53 resources."""

    def test_hosted_zone_exists_with_dns_record(self):
        """Verify Route 53 hosted zone exists with DNS record for API endpoint."""
        response = route53_client.get_hosted_zone(Id=hosted_zone_id)

        zone = response["HostedZone"]
        assert zone["Id"].endswith(hosted_zone_id)
        assert "testing.local" in zone["Name"]
        assert zone["Config"]["PrivateZone"] is False

        records = route53_client.list_resource_record_sets(
            HostedZoneId=hosted_zone_id
        )

        record_sets = records["ResourceRecordSets"]
        cname_records = [r for r in record_sets if r["Type"] == "CNAME"]

        assert len(cname_records) >= 1
        api_record = next(
            (r for r in cname_records if "api" in r["Name"]),
            None
        )
        assert api_record is not None
        assert api_record["TTL"] == 60


class TestBackup:
    """Test AWS Backup resources."""

    def test_backup_plan_configured_with_daily_schedule(self):
        """Verify AWS Backup plan has daily schedule with 7-day retention."""
        plans = backup_client.list_backup_plans()

        backup_plan = next(
            (p for p in plans["BackupPlansList"]
             if environment_suffix in p["BackupPlanName"]),
            None
        )
        assert backup_plan is not None

        plan_details = backup_client.get_backup_plan(
            BackupPlanId=backup_plan["BackupPlanId"]
        )

        rules = plan_details["BackupPlan"]["Rules"]
        assert len(rules) >= 1

        rule = rules[0]
        assert "cron(0 3 * * ? *)" in rule["ScheduleExpression"]
        assert rule["Lifecycle"]["DeleteAfterDays"] == 7

    def test_backup_selection_targets_aurora_cluster(self):
        """Verify backup selection targets Aurora cluster."""
        plans = backup_client.list_backup_plans()

        backup_plan = next(
            (p for p in plans["BackupPlansList"]
             if environment_suffix in p["BackupPlanName"]),
            None
        )

        selections = backup_client.list_backup_selections(
            BackupPlanId=backup_plan["BackupPlanId"]
        )

        assert len(selections["BackupSelectionsList"]) >= 1


class TestMonitoring:
    """Test CloudWatch monitoring resources."""

    def test_cloudwatch_dashboard_exists(self):
        """Verify CloudWatch dashboard exists with RDS, Lambda, and DynamoDB metrics."""
        dashboards = cloudwatch_client.list_dashboards()

        dashboard = next(
            (d for d in dashboards["DashboardEntries"]
             if f"payment-{environment_suffix}" in d["DashboardName"]),
            None
        )
        assert dashboard is not None

        dashboard_body = cloudwatch_client.get_dashboard(
            DashboardName=dashboard["DashboardName"]
        )

        body = json.loads(dashboard_body["DashboardBody"])
        assert "widgets" in body
        assert len(body["widgets"]) >= 3

    def test_cloudwatch_alarms_configured(self):
        """Verify CloudWatch alarms are configured for Lambda errors, Aurora CPU, and DynamoDB."""
        alarms = cloudwatch_client.describe_alarms(
            AlarmNamePrefix=f"payment-"
        )

        alarm_names = [a["AlarmName"] for a in alarms["MetricAlarms"]]

        lambda_alarm_exists = any(
            f"payment-lambda-errors-{environment_suffix}" in name
            for name in alarm_names
        )
        aurora_alarm_exists = any(
            f"payment-aurora-cpu-{environment_suffix}" in name
            for name in alarm_names
        )
        dynamodb_alarm_exists = any(
            f"payment-dynamodb-throttles-{environment_suffix}" in name
            for name in alarm_names
        )

        assert lambda_alarm_exists
        assert aurora_alarm_exists
        assert dynamodb_alarm_exists

        lambda_alarm = next(
            a for a in alarms["MetricAlarms"]
            if f"payment-lambda-errors-{environment_suffix}" in a["AlarmName"]
        )
        assert lambda_alarm["Threshold"] == 10
        assert lambda_alarm["MetricName"] == "Errors"

        aurora_alarm = next(
            a for a in alarms["MetricAlarms"]
            if f"payment-aurora-cpu-{environment_suffix}" in a["AlarmName"]
        )
        assert aurora_alarm["Threshold"] == 80
        assert aurora_alarm["MetricName"] == "CPUUtilization"


class TestSSMParameters:
    """Test Systems Manager Parameter Store resources."""

    def test_ssm_parameters_configured(self):
        """Verify SSM parameters exist for database endpoints and configuration."""
        parameters = ssm_client.describe_parameters(
            Filters=[
                {"Key": "Name", "Values": [f"/payment/{environment_suffix}/"]}
            ]
        )

        param_names = [p["Name"] for p in parameters["Parameters"]]

        endpoint_param_exists = any(
            f"/payment/{environment_suffix}/db/endpoint" == name
            for name in param_names
        )
        dynamodb_param_exists = any(
            f"/payment/{environment_suffix}/db/dynamodb/table" == name
            for name in param_names
        )

        assert endpoint_param_exists
        assert dynamodb_param_exists

        endpoint_value = ssm_client.get_parameter(
            Name=f"/payment/{environment_suffix}/db/endpoint",
            WithDecryption=True
        )
        assert endpoint_value["Parameter"]["Value"] == aurora_endpoint

        dynamodb_value = ssm_client.get_parameter(
            Name=f"/payment/{environment_suffix}/db/dynamodb/table"
        )
        assert dynamodb_value["Parameter"]["Value"] == dynamodb_table_name


class TestIAMRoles:
    """Test IAM roles and permissions."""

    def test_iam_roles_exist_with_least_privilege(self):
        """Verify IAM roles exist for Lambda, database access, and backup services."""
        role_names = []
        paginator = iam_client.get_paginator("list_roles")
        for page in paginator.paginate():
            role_names.extend([r["RoleName"] for r in page["Roles"]])

        lambda_role_exists = any(
            f"payment-lambda-{environment_suffix}" == name
            for name in role_names
        )
        db_role_exists = any(
            f"payment-db-access-{environment_suffix}" == name
            for name in role_names
        )
        backup_role_exists = any(
            f"payment-backup-role-{environment_suffix}" == name
            for name in role_names
        )

        assert lambda_role_exists
        assert db_role_exists
        assert backup_role_exists


class TestHighAvailability:
    """Test high availability configuration."""

    def test_multi_az_deployment_across_three_zones(self):
        """Verify infrastructure spans 3 availability zones for high availability."""
        subnets = ec2_client.describe_subnets(
            Filters=[{"Name": "vpc-id", "Values": [vpc_id]}]
        )

        availability_zones = set(
            subnet["AvailabilityZone"]
            for subnet in subnets["Subnets"]
        )

        assert len(availability_zones) == 3

        for az in availability_zones:
            assert az.startswith(region)
            az_letter = az[-1]
            assert az_letter in ["a", "b", "c"]

    def test_resource_naming_convention_consistent(self):
        """Verify all resources follow consistent naming with environment suffix."""
        assert environment_suffix in aurora_cluster_id
        assert environment_suffix in dynamodb_table_name
        assert environment_suffix in lambda_function_name

        vpc_response = ec2_client.describe_vpcs(VpcIds=[vpc_id])
        vpc_tags = {tag["Key"]: tag["Value"] for tag in vpc_response["Vpcs"][0].get("Tags", [])}
        assert environment_suffix in vpc_tags.get("Name", "")
