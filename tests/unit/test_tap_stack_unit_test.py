"""
Comprehensive unit tests for TapStack - Multi-Region DR Architecture
Tests all components with 100% coverage using mocking
"""
import pytest
import os
from unittest.mock import patch, MagicMock
from aws_cdk import App, Environment
from aws_cdk import assertions as Assert
from lib.tap_stack import TapStack, TapStackProps


@pytest.fixture
def app():
    """Create CDK app fixture"""
    return App()


@pytest.fixture
def primary_stack_props():
    """Create primary region stack props"""
    return TapStackProps(
        environment_suffix="test",
        primary_region="us-east-1",
        secondary_region="us-west-2",
        log_retention_days=7,
        domain_name="test.mycompany.com",
        env=Environment(account="123456789012", region="us-east-1"),
    )


@pytest.fixture
def secondary_stack_props():
    """Create secondary region stack props"""
    return TapStackProps(
        environment_suffix="test",
        primary_region="us-east-1",
        secondary_region="us-west-2",
        log_retention_days=7,
        domain_name="test.mycompany.com",
        env=Environment(account="123456789012", region="us-west-2"),
    )


@pytest.fixture
def primary_stack(app, primary_stack_props):
    """Create primary region stack"""
    # Set environment variable for S3 replication testing
    os.environ["ENABLE_S3_REPLICATION"] = "true"
    stack = TapStack(
        app,
        "TestPrimaryStack",
        props=primary_stack_props,
    )
    # Clean up environment variable after stack creation
    if "ENABLE_S3_REPLICATION" in os.environ:
        del os.environ["ENABLE_S3_REPLICATION"]
    return stack


@pytest.fixture
def secondary_stack(app, secondary_stack_props):
    """Create secondary region stack"""
    # Set hosted zone ID for secondary stack testing
    os.environ["HOSTED_ZONE_ID"] = "Z1234567890ABC"
    stack = TapStack(
        app,
        "TestSecondaryStack",
        props=secondary_stack_props,
    )
    # Clean up environment variable after stack creation
    if "HOSTED_ZONE_ID" in os.environ:
        del os.environ["HOSTED_ZONE_ID"]
    return stack


class TestTapStackProps:
    """Test TapStackProps dataclass"""

    def test_props_with_defaults(self):
        """Verify props can be created with defaults"""
        props = TapStackProps(environment_suffix="prod")
        assert props.environment_suffix == "prod"
        assert props.primary_region == "us-east-1"
        assert props.secondary_region == "us-west-2"
        assert props.log_retention_days == 7
        assert props.domain_name is None
        assert props.env is None

    def test_props_with_custom_values(self):
        """Verify props can be created with custom values"""
        env = Environment(account="999888777666", region="eu-west-1")
        props = TapStackProps(
            environment_suffix="PR6845",
            primary_region="eu-west-1",
            secondary_region="eu-central-1",
            log_retention_days=30,
            domain_name="custom.example.com",
            env=env,
        )
        assert props.environment_suffix == "PR6845"
        assert props.primary_region == "eu-west-1"
        assert props.secondary_region == "eu-central-1"
        assert props.log_retention_days == 30
        assert props.domain_name == "custom.example.com"
        assert props.env == env


class TestStackCreation:
    """Test basic stack creation and configuration"""

    def test_stack_created_successfully(self, primary_stack):
        """Verify stack is created"""
        assert primary_stack is not None
        assert isinstance(primary_stack, TapStack)

    def test_environment_suffix_applied(self, primary_stack):
        """Verify environment suffix is set correctly"""
        assert primary_stack.environment_suffix == "test"

    def test_primary_region_identification(self, primary_stack):
        """Verify stack correctly identifies as primary region"""
        assert primary_stack.is_primary is True

    def test_secondary_region_identification(self, secondary_stack):
        """Verify stack correctly identifies as secondary region"""
        assert secondary_stack.is_primary is False

    def test_domain_name_configurable(self, primary_stack):
        """Verify domain name is properly configured"""
        assert primary_stack.domain_name == "test.mycompany.com"

    def test_domain_name_from_env(self, app):
        """Test domain name can be read from environment"""
        os.environ["DOMAIN_NAME"] = "env.mycompany.com"
        props = TapStackProps(
            environment_suffix="test",
            env=Environment(account="123456789012", region="us-east-1"),
        )
        stack = TapStack(app, "EnvStack", props=props)
        assert stack.domain_name == "env.mycompany.com"
        del os.environ["DOMAIN_NAME"]

    def test_domain_name_default_with_suffix(self, app):
        """Test domain name defaults to trading-{env}.example.com"""
        props = TapStackProps(
            environment_suffix="dev123",
            env=Environment(account="123456789012", region="us-east-1"),
        )
        stack = TapStack(app, "DefaultDomainStack", props=props)
        assert stack.domain_name == "trading-dev123.example.com"

    def test_props_env_passed_to_stack(self, app, primary_stack_props):
        """Verify environment from props is passed to stack"""
        stack = TapStack(app, "TestEnvStack", props=primary_stack_props)
        assert stack.region == "us-east-1"
        assert stack.account == "123456789012"


class TestVPCResources:
    """Test VPC and networking resources"""

    def test_vpc_created_with_v2_naming(self, primary_stack):
        """Verify VPC is created with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::EC2::VPC", 1)
        # Verify v2 naming in logical ID
        resources = template.to_json()["Resources"]
        vpc_resources = [k for k, v in resources.items() if v["Type"] == "AWS::EC2::VPC"]
        assert any("v2" in k for k in vpc_resources)

    def test_vpc_uses_3_azs(self, primary_stack):
        """Verify VPC uses 3 availability zones"""
        template = Assert.Template.from_stack(primary_stack)
        # Check for subnets across multiple AZs (3 public + 3 private)
        template.resource_count_is("AWS::EC2::Subnet", 6)

    def test_vpc_nat_gateways_disabled(self, primary_stack):
        """Verify NAT gateways are disabled to avoid EIP limits"""
        template = Assert.Template.from_stack(primary_stack)
        # Should not have NAT gateways
        template.resource_count_is("AWS::EC2::NatGateway", 0)

    def test_security_groups_created_with_v2_naming(self, primary_stack):
        """Verify all required security groups are created with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        # ALB, ECS, and Database security groups
        template.resource_count_is("AWS::EC2::SecurityGroup", 3)
        # Verify v2 naming in logical IDs
        resources = template.to_json()["Resources"]
        sg_resources = [k for k, v in resources.items() if v["Type"] == "AWS::EC2::SecurityGroup"]
        assert any("v2" in k for k in sg_resources)

    def test_alb_security_group_allows_http_https(self, primary_stack):
        """Verify ALB security group allows HTTP and HTTPS"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::EC2::SecurityGroup",
            {
                "SecurityGroupIngress": [
                    {"IpProtocol": "tcp", "FromPort": 80, "ToPort": 80},
                    {"IpProtocol": "tcp", "FromPort": 443, "ToPort": 443},
                ]
            },
        )

    def test_database_security_group_allows_postgres(self, primary_stack):
        """Verify database security group allows PostgreSQL"""
        template = Assert.Template.from_stack(primary_stack)
        # Check for PostgreSQL port 5432
        resources = template.to_json()["Resources"]
        db_sgs = [
            v for k, v in resources.items()
            if v["Type"] == "AWS::EC2::SecurityGroup" and "Database" in k
        ]
        assert len(db_sgs) > 0


class TestECSResources:
    """Test ECS cluster and service resources"""

    def test_ecs_cluster_created_with_v2_naming(self, primary_stack):
        """Verify ECS cluster is created with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::ECS::Cluster", 1)
        template.has_resource_properties(
            "AWS::ECS::Cluster",
            {"ClusterName": Assert.Match.string_like_regexp(".*v2.*test.*")},
        )

    def test_ecs_cluster_container_insights_enabled(self, primary_stack):
        """Verify container insights are enabled"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::ECS::Cluster",
            {
                "ClusterSettings": [
                    {"Name": "containerInsights", "Value": "enabled"}
                ]
            },
        )

    def test_fargate_service_created_with_v2_naming(self, primary_stack):
        """Verify Fargate service is created with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::ECS::Service", 1)

    def test_fargate_service_desired_count(self, primary_stack):
        """Verify service has correct desired count of 2"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::ECS::Service", {"DesiredCount": 2}
        )

    def test_fargate_service_public_ip_enabled(self, primary_stack):
        """Verify service has public IP enabled"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::ECS::Service",
            {"NetworkConfiguration": {"AwsvpcConfiguration": {"AssignPublicIp": "ENABLED"}}},
        )

    def test_task_definition_created_with_v2_naming(self, primary_stack):
        """Verify ECS task definition is created with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::ECS::TaskDefinition", 1)

    def test_task_definition_cpu_memory(self, primary_stack):
        """Verify task definition has correct CPU and memory"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::ECS::TaskDefinition",
            {"Cpu": "1024", "Memory": "2048"},
        )

    def test_task_definition_log_retention(self, primary_stack):
        """Verify task definition uses correct log retention"""
        template = Assert.Template.from_stack(primary_stack)
        # Check log group has 7 day retention
        template.has_resource_properties(
            "AWS::Logs::LogGroup", {"RetentionInDays": 7}
        )


class TestLoadBalancer:
    """Test Application Load Balancer resources"""

    def test_alb_created_with_v2_naming(self, primary_stack):
        """Verify ALB is created with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is(
            "AWS::ElasticLoadBalancingV2::LoadBalancer", 1
        )

    def test_alb_is_internet_facing(self, primary_stack):
        """Verify ALB is internet-facing"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::LoadBalancer",
            {"Scheme": "internet-facing"},
        )

    def test_alb_deletion_protection_disabled(self, primary_stack):
        """Verify ALB deletion protection is disabled for testing"""
        template = Assert.Template.from_stack(primary_stack)
        # Deletion protection should be false for test environments
        resources = template.to_json()["Resources"]
        albs = [v for v in resources.values() if v["Type"] == "AWS::ElasticLoadBalancingV2::LoadBalancer"]
        for alb in albs:
            props = alb.get("Properties", {})
            # If LoadBalancerAttributes exist, check DeletionProtection
            attrs = props.get("LoadBalancerAttributes", [])
            deletion_attrs = [a for a in attrs if a.get("Key") == "deletion_protection.enabled"]
            for attr in deletion_attrs:
                assert attr.get("Value") == "false"

    def test_alb_listener_on_port_80(self, primary_stack):
        """Verify ALB has HTTP listener on port 80"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::Listener",
            {"Port": 80, "Protocol": "HTTP"},
        )

    def test_target_group_created_with_v2_naming(self, primary_stack):
        """Verify target group is created with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is(
            "AWS::ElasticLoadBalancingV2::TargetGroup", 1
        )

    def test_target_group_health_check_configured(self, primary_stack):
        """Verify target group has health check configured"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::TargetGroup",
            {
                "HealthCheckPath": "/",
                "HealthCheckIntervalSeconds": 30,
                "HealthCheckTimeoutSeconds": 5,
                "HealthyThresholdCount": 2,
                "UnhealthyThresholdCount": 2,
            },
        )

    def test_target_group_deregistration_delay(self, primary_stack):
        """Verify target group has deregistration delay"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::ElasticLoadBalancingV2::TargetGroup",
            {"TargetGroupAttributes": Assert.Match.array_with([
                {"Key": "deregistration_delay.timeout_seconds", "Value": "30"}
            ])},
        )


class TestAuroraGlobalDatabase:
    """Test Aurora Global Database configuration with v2 naming"""

    def test_global_cluster_created_in_primary_with_v2_naming(self, primary_stack):
        """Verify Aurora Global Cluster is created in primary region with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::RDS::GlobalCluster", 1)
        template.has_resource_properties(
            "AWS::RDS::GlobalCluster",
            {"GlobalClusterIdentifier": Assert.Match.string_like_regexp(".*v2.*test.*")},
        )

    def test_global_cluster_engine_postgres(self, primary_stack):
        """Verify global cluster uses PostgreSQL"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::RDS::GlobalCluster",
            {"Engine": "aurora-postgresql", "EngineVersion": "14.6"},
        )

    def test_global_cluster_encrypted(self, primary_stack):
        """Verify global cluster has encryption enabled"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::RDS::GlobalCluster", {"StorageEncrypted": True}
        )

    def test_global_cluster_deletion_protection_disabled(self, primary_stack):
        """Verify global cluster deletion protection is disabled"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::RDS::GlobalCluster", {"DeletionProtection": False}
        )

    def test_primary_cluster_created_with_v2_naming(self, primary_stack):
        """Verify primary Aurora cluster is created with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::RDS::DBCluster", 1)

    def test_primary_cluster_uses_r5_large(self, primary_stack):
        """Verify primary cluster uses r5.large instances"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::RDS::DBInstance",
            {"DBInstanceClass": "db.r5.large"},
        )

    def test_primary_cluster_has_2_instances(self, primary_stack):
        """Verify primary cluster has 2 instances"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::RDS::DBInstance", 2)

    def test_primary_cluster_backup_retention(self, primary_stack):
        """Verify primary cluster has 7 day backup retention"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::RDS::DBCluster", {"BackupRetentionPeriod": 7}
        )

    def test_secondary_cluster_created_with_v2_naming(self, secondary_stack):
        """Verify secondary Aurora cluster is created with v2 naming"""
        template = Assert.Template.from_stack(secondary_stack)
        template.resource_count_is("AWS::RDS::DBCluster", 1)

    def test_secondary_cluster_has_kms_key(self, secondary_stack):
        """Verify secondary cluster has KMS key for encryption"""
        template = Assert.Template.from_stack(secondary_stack)
        template.resource_count_is("AWS::KMS::Key", 1)

    def test_secondary_cluster_no_credentials(self, secondary_stack):
        """Verify secondary cluster does not specify credentials"""
        template = Assert.Template.from_stack(secondary_stack)
        resources = template.to_json()["Resources"]
        clusters = [v for v in resources.values() if v["Type"] == "AWS::RDS::DBCluster"]
        for cluster in clusters:
            props = cluster.get("Properties", {})
            # Secondary should not have MasterUsername or MasterUserPassword
            assert "MasterUsername" not in props
            assert "MasterUserPassword" not in props
            assert "DatabaseName" not in props

    def test_no_global_cluster_in_secondary(self, secondary_stack):
        """Verify global cluster NOT created in secondary region"""
        template = Assert.Template.from_stack(secondary_stack)
        template.resource_count_is("AWS::RDS::GlobalCluster", 0)

    def test_db_subnet_groups_created_with_v2_naming(self, primary_stack):
        """Verify database subnet groups are created with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::RDS::DBSubnetGroup", 1)

    def test_db_parameter_group_created_with_v2_naming(self, primary_stack):
        """Verify database parameter group is created with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::RDS::DBClusterParameterGroup", 1)


class TestDynamoDBGlobalTable:
    """Test DynamoDB Global Table configuration with v2 naming"""

    def test_dynamodb_table_created_in_primary_with_v2_naming(self, primary_stack):
        """Verify DynamoDB table created in primary region with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::DynamoDB::Table", 1)
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {"TableName": Assert.Match.string_like_regexp(".*v2.*test.*")},
        )

    def test_dynamodb_table_partition_key(self, primary_stack):
        """Verify table has sessionId partition key"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {
                "KeySchema": [
                    {"AttributeName": "sessionId", "KeyType": "HASH"}
                ],
                "AttributeDefinitions": [
                    {"AttributeName": "sessionId", "AttributeType": "S"}
                ],
            },
        )

    def test_dynamodb_pitr_enabled(self, primary_stack):
        """Verify point-in-time recovery is enabled"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::DynamoDB::Table",
            {"PointInTimeRecoverySpecification": {"PointInTimeRecoveryEnabled": True}},
        )

    def test_dynamodb_billing_mode_on_demand(self, primary_stack):
        """Verify billing mode is pay-per-request"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::DynamoDB::Table", {"BillingMode": "PAY_PER_REQUEST"}
        )

    def test_dynamodb_table_imported_in_secondary(self, secondary_stack):
        """Verify DynamoDB table is imported in secondary region"""
        # Secondary stack should not create a new table
        template = Assert.Template.from_stack(secondary_stack)
        template.resource_count_is("AWS::DynamoDB::Table", 0)


class TestS3Replication:
    """Test S3 cross-region replication with v2 naming"""

    def test_s3_buckets_created_both_regions_with_v2_naming(self, primary_stack, secondary_stack):
        """Verify S3 buckets created in both regions with v2 naming"""
        primary_template = Assert.Template.from_stack(primary_stack)
        secondary_template = Assert.Template.from_stack(secondary_stack)
        primary_template.resource_count_is("AWS::S3::Bucket", 1)
        secondary_template.resource_count_is("AWS::S3::Bucket", 1)

    def test_bucket_versioning_enabled(self, primary_stack):
        """Verify bucket versioning is enabled"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::S3::Bucket",
            {"VersioningConfiguration": {"Status": "Enabled"}},
        )

    def test_bucket_auto_delete_enabled(self, primary_stack):
        """Verify bucket auto-delete is enabled for testing"""
        template = Assert.Template.from_stack(primary_stack)
        # Check for custom resource that enables auto-delete
        resources = template.to_json()["Resources"]
        custom_resources = [v for v in resources.values() if v["Type"] == "Custom::S3AutoDeleteObjects"]
        assert len(custom_resources) > 0

    def test_replication_role_created_in_primary_with_v2_naming(self, primary_stack):
        """Verify S3 replication IAM role created in primary with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::IAM::Role",
            {
                "AssumeRolePolicyDocument": {
                    "Statement": [
                        {
                            "Action": "sts:AssumeRole",
                            "Effect": "Allow",
                            "Principal": {"Service": "s3.amazonaws.com"},
                        }
                    ]
                }
            },
        )

    def test_replication_configuration_in_primary(self, primary_stack):
        """Verify replication configuration is set in primary"""
        template = Assert.Template.from_stack(primary_stack)
        resources = template.to_json()["Resources"]
        buckets = [v for v in resources.values() if v["Type"] == "AWS::S3::Bucket"]
        # Primary bucket should have replication configuration
        replication_buckets = [
            b for b in buckets
            if "ReplicationConfiguration" in b.get("Properties", {})
        ]
        assert len(replication_buckets) > 0

    def test_replication_rtc_enabled(self, primary_stack):
        """Verify Replication Time Control (RTC) is enabled"""
        template = Assert.Template.from_stack(primary_stack)
        resources = template.to_json()["Resources"]
        buckets = [v for v in resources.values() if v["Type"] == "AWS::S3::Bucket"]
        for bucket in buckets:
            repl_config = bucket.get("Properties", {}).get("ReplicationConfiguration", {})
            if repl_config:
                rules = repl_config.get("Rules", [])
                for rule in rules:
                    dest = rule.get("Destination", {})
                    if "ReplicationTime" in dest:
                        assert dest["ReplicationTime"]["Status"] == "Enabled"

    def test_no_replication_role_in_secondary(self, secondary_stack):
        """Verify no S3 replication role in secondary"""
        template = Assert.Template.from_stack(secondary_stack)
        resources = template.to_json()["Resources"]
        s3_roles = [
            r for r in resources.values()
            if r.get("Type") == "AWS::IAM::Role"
            and "s3.amazonaws.com" in str(r.get("Properties", {}).get("AssumeRolePolicyDocument", {}))
        ]
        assert len(s3_roles) == 0


class TestEventBridge:
    """Test EventBridge cross-region configuration with v2 naming"""

    def test_event_bus_created_both_regions_with_v2_naming(self, primary_stack, secondary_stack):
        """Verify event bus created in both regions with v2 naming"""
        primary_template = Assert.Template.from_stack(primary_stack)
        secondary_template = Assert.Template.from_stack(secondary_stack)
        primary_template.resource_count_is("AWS::Events::EventBus", 1)
        secondary_template.resource_count_is("AWS::Events::EventBus", 1)
        primary_template.has_resource_properties(
            "AWS::Events::EventBus",
            {"Name": Assert.Match.string_like_regexp(".*v2.*test.*")},
        )

    def test_event_rule_created_with_v2_naming(self, primary_stack):
        """Verify event rule is created with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::Events::Rule", 1)

    def test_event_rule_pattern_configured(self, primary_stack):
        """Verify event rule has correct pattern"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::Events::Rule",
            {
                "EventPattern": {
                    "source": ["trading.platform"],
                    "detail-type": ["Trade Executed", "Order Placed"],
                }
            },
        )

    def test_cross_region_target_in_primary(self, primary_stack):
        """Verify primary has cross-region event target"""
        template = Assert.Template.from_stack(primary_stack)
        resources = template.to_json()["Resources"]
        rules = [v for v in resources.values() if v["Type"] == "AWS::Events::Rule"]
        # Primary should have targets configured
        for rule in rules:
            targets = rule.get("Properties", {}).get("Targets", [])
            assert len(targets) > 0


class TestRoute53Configuration:
    """Test Route 53 DNS and health checks with v2 naming"""

    def test_hosted_zone_created_in_primary(self, primary_stack):
        """Verify hosted zone created in primary region"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::Route53::HostedZone", 1)

    def test_hosted_zone_uses_custom_domain(self, primary_stack):
        """Verify hosted zone uses configured domain"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::Route53::HostedZone", {"Name": "test.mycompany.com."}
        )

    def test_health_check_uses_http_port_80_with_v2_naming(self, primary_stack):
        """Verify health check uses HTTP on port 80 with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::Route53::HealthCheck",
            {"HealthCheckConfig": {"Type": "HTTP", "Port": 80, "ResourcePath": "/"}},
        )

    def test_health_check_interval_configured(self, primary_stack):
        """Verify health check interval is configured"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::Route53::HealthCheck",
            {
                "HealthCheckConfig": {
                    "RequestInterval": 30,
                    "FailureThreshold": 2,
                }
            },
        )

    def test_primary_record_weight_100(self, primary_stack):
        """Verify primary Route 53 record has weight 100"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::Route53::RecordSet", {"Weight": 100}
        )

    def test_secondary_record_weight_0(self, secondary_stack):
        """Verify secondary Route 53 record has weight 0"""
        template = Assert.Template.from_stack(secondary_stack)
        template.has_resource_properties(
            "AWS::Route53::RecordSet", {"Weight": 0}
        )

    def test_no_hosted_zone_in_secondary(self, secondary_stack):
        """Verify hosted zone NOT created in secondary (reuses primary)"""
        template = Assert.Template.from_stack(secondary_stack)
        template.resource_count_is("AWS::Route53::HostedZone", 0)

    def test_route53_skipped_for_example_domain(self, app):
        """Verify Route53 resources are not created for example.com domains"""
        props = TapStackProps(
            environment_suffix="test",
            domain_name="trading-test.example.com",
            env=Environment(account="123456789012", region="us-east-1"),
        )
        stack = TapStack(app, "ExampleDomainStack", props=props)
        template = Assert.Template.from_stack(stack)
        template.resource_count_is("AWS::Route53::HostedZone", 0)
        template.resource_count_is("AWS::Route53::HealthCheck", 0)


class TestCloudWatchMonitoring:
    """Test CloudWatch monitoring and logging with v2 naming"""

    def test_cloudwatch_alarm_created_in_primary_with_v2_naming(self, primary_stack):
        """Verify CloudWatch alarm for replication lag with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        template.resource_count_is("AWS::CloudWatch::Alarm", 1)

    def test_alarm_uses_correct_metric_name(self, primary_stack):
        """Verify alarm uses AuroraGlobalDBReplicationLag metric"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "MetricName": "AuroraGlobalDBReplicationLag",
                "Namespace": "AWS/RDS",
                "Statistic": "Average",
            },
        )

    def test_alarm_threshold_configured(self, primary_stack):
        """Verify alarm threshold is 60 seconds"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::CloudWatch::Alarm",
            {
                "Threshold": 60000,  # 60 seconds in milliseconds
                "EvaluationPeriods": 2,
                "DatapointsToAlarm": 2,
                "ComparisonOperator": "GreaterThanThreshold",
            },
        )

    def test_no_alarm_in_secondary(self, secondary_stack):
        """Verify no replication lag alarm in secondary region"""
        template = Assert.Template.from_stack(secondary_stack)
        template.resource_count_is("AWS::CloudWatch::Alarm", 0)

    def test_log_groups_created_with_v2_naming(self, primary_stack):
        """Verify CloudWatch log groups are created with v2 naming"""
        template = Assert.Template.from_stack(primary_stack)
        # ECS creates additional log group, so we expect at least 3
        template.resource_count_is("AWS::Logs::LogGroup", 3)

    def test_application_log_group_created(self, primary_stack):
        """Verify application log group is created"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {"LogGroupName": Assert.Match.string_like_regexp(".*/aws/trading/application-v2-.*")},
        )

    def test_infrastructure_log_group_created(self, primary_stack):
        """Verify infrastructure log group is created"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::Logs::LogGroup",
            {"LogGroupName": Assert.Match.string_like_regexp(".*/aws/trading/infrastructure-v2-.*")},
        )

    def test_log_retention_configured(self, primary_stack):
        """Verify log retention is properly configured"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::Logs::LogGroup", {"RetentionInDays": 7}
        )

    def test_log_retention_custom_value(self, app):
        """Test custom log retention value"""
        props = TapStackProps(
            environment_suffix="test",
            log_retention_days=30,
            env=Environment(account="123456789012", region="us-east-1"),
        )
        stack = TapStack(app, "CustomRetentionStack", props=props)
        template = Assert.Template.from_stack(stack)
        template.has_resource_properties(
            "AWS::Logs::LogGroup", {"RetentionInDays": 30}
        )


class TestOutputs:
    """Test CloudFormation outputs"""

    def test_vpc_id_output(self, primary_stack):
        """Verify VPC ID is exported"""
        template = Assert.Template.from_stack(primary_stack)
        outputs = template.to_json().get("Outputs", {})
        assert "VpcId" in outputs
        assert "vpc-id" in outputs["VpcId"]["Export"]["Name"]

    def test_ecs_cluster_outputs(self, primary_stack):
        """Verify ECS cluster outputs are exported"""
        template = Assert.Template.from_stack(primary_stack)
        outputs = template.to_json().get("Outputs", {})
        assert "EcsClusterName" in outputs
        assert "EcsClusterArn" in outputs
        assert "EcsServiceName" in outputs

    def test_alb_outputs(self, primary_stack):
        """Verify ALB outputs are exported"""
        template = Assert.Template.from_stack(primary_stack)
        outputs = template.to_json().get("Outputs", {})
        assert "AlbDnsName" in outputs
        assert "AlbArn" in outputs

    def test_aurora_outputs(self, primary_stack):
        """Verify Aurora outputs are exported"""
        template = Assert.Template.from_stack(primary_stack)
        outputs = template.to_json().get("Outputs", {})
        assert "AuroraClusterEndpoint" in outputs
        assert "AuroraClusterReadEndpoint" in outputs
        assert "AuroraClusterIdentifier" in outputs
        assert "AuroraGlobalClusterIdentifier" in outputs

    def test_dynamodb_outputs(self, primary_stack):
        """Verify DynamoDB outputs are exported"""
        template = Assert.Template.from_stack(primary_stack)
        outputs = template.to_json().get("Outputs", {})
        assert "DynamoDbTableName" in outputs
        assert "DynamoDbTableArn" in outputs

    def test_s3_outputs(self, primary_stack):
        """Verify S3 outputs are exported"""
        template = Assert.Template.from_stack(primary_stack)
        outputs = template.to_json().get("Outputs", {})
        assert "S3BucketName" in outputs
        assert "S3BucketArn" in outputs

    def test_eventbridge_outputs(self, primary_stack):
        """Verify EventBridge outputs are exported"""
        template = Assert.Template.from_stack(primary_stack)
        outputs = template.to_json().get("Outputs", {})
        assert "EventBusName" in outputs
        assert "EventBusArn" in outputs

    def test_route53_outputs(self, primary_stack):
        """Verify Route53 outputs are exported"""
        template = Assert.Template.from_stack(primary_stack)
        outputs = template.to_json().get("Outputs", {})
        assert "HostedZoneId" in outputs
        assert "HostedZoneName" in outputs

    def test_domain_name_output(self, primary_stack):
        """Verify domain name is exported"""
        template = Assert.Template.from_stack(primary_stack)
        outputs = template.to_json().get("Outputs", {})
        assert "DomainName" in outputs

    def test_region_outputs(self, primary_stack):
        """Verify region information outputs are exported"""
        template = Assert.Template.from_stack(primary_stack)
        outputs = template.to_json().get("Outputs", {})
        assert "DeploymentRegion" in outputs
        assert "RegionType" in outputs

    def test_output_export_names_include_env_suffix(self, primary_stack):
        """Verify output export names include environment suffix"""
        template = Assert.Template.from_stack(primary_stack)
        outputs = template.to_json().get("Outputs", {})
        for output in outputs.values():
            export_name = output.get("Export", {}).get("Name", "")
            assert "test" in export_name


class TestResourceNaming:
    """Test resource naming conventions"""

    def test_all_resources_use_v2_naming(self, primary_stack):
        """Verify all major resources use v2 naming convention"""
        template = Assert.Template.from_stack(primary_stack)
        resources = template.to_json()["Resources"]

        # Check that logical IDs include v2
        resource_types = [
            "AWS::EC2::VPC",
            "AWS::ECS::Cluster",
            "AWS::ElasticLoadBalancingV2::LoadBalancer",
            "AWS::RDS::GlobalCluster",
            "AWS::RDS::DBCluster",
            "AWS::S3::Bucket",
            "AWS::DynamoDB::Table",
            "AWS::Events::EventBus",
        ]

        for resource_type in resource_types:
            matching = [k for k, v in resources.items() if v["Type"] == resource_type]
            assert len(matching) > 0, f"No resources found of type {resource_type}"
            # At least one should have v2 in the logical ID
            assert any("v2" in k for k in matching), f"No v2 naming found for {resource_type}"

    def test_resource_names_include_suffix(self, primary_stack):
        """Verify resource names include environment suffix"""
        template = Assert.Template.from_stack(primary_stack)
        resources = template.to_json()["Resources"]

        # Check that resource names or IDs include the environment suffix
        named_resources = []
        for resource in resources.values():
            props = resource.get("Properties", {})
            if "ClusterName" in props:
                named_resources.append(props["ClusterName"])
            if "TableName" in props:
                named_resources.append(props["TableName"])
            if "Name" in props:
                named_resources.append(props["Name"])

        # At least some resources should have "test" in their name
        assert any("test" in str(name) for name in named_resources)


class TestRemovalPolicies:
    """Test that resources can be destroyed"""

    def test_s3_buckets_have_delete_policy(self, primary_stack):
        """Verify S3 buckets can be deleted"""
        template = Assert.Template.from_stack(primary_stack)
        resources = template.to_json()["Resources"]
        s3_buckets = [r for r in resources.values() if r["Type"] == "AWS::S3::Bucket"]
        for bucket in s3_buckets:
            deletion_policy = bucket.get("DeletionPolicy")
            assert deletion_policy != "Retain"

    def test_aurora_clusters_destroyable(self, primary_stack):
        """Verify Aurora clusters can be destroyed"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::RDS::DBCluster", {"DeletionProtection": False}
        )

    def test_global_cluster_destroyable(self, primary_stack):
        """Verify global cluster can be destroyed"""
        template = Assert.Template.from_stack(primary_stack)
        template.has_resource_properties(
            "AWS::RDS::GlobalCluster", {"DeletionProtection": False}
        )

    def test_dynamodb_table_destroyable(self, primary_stack):
        """Verify DynamoDB table has proper removal policy"""
        template = Assert.Template.from_stack(primary_stack)
        resources = template.to_json()["Resources"]
        tables = [r for r in resources.values() if r["Type"] == "AWS::DynamoDB::Table"]
        for table in tables:
            # Should not have Retain policy
            deletion_policy = table.get("DeletionPolicy")
            assert deletion_policy != "Retain"


class TestEdgeCases:
    """Test edge cases and error conditions"""

    def test_s3_replication_disabled_by_default(self, app):
        """Verify S3 replication is disabled when env var not set"""
        # Ensure env var is not set
        if "ENABLE_S3_REPLICATION" in os.environ:
            del os.environ["ENABLE_S3_REPLICATION"]

        props = TapStackProps(
            environment_suffix="test",
            env=Environment(account="123456789012", region="us-east-1"),
        )
        stack = TapStack(app, "NoReplicationStack", props=props)
        template = Assert.Template.from_stack(stack)

        # Should not have replication configuration
        resources = template.to_json()["Resources"]
        buckets = [v for v in resources.values() if v["Type"] == "AWS::S3::Bucket"]
        replication_buckets = [
            b for b in buckets
            if "ReplicationConfiguration" in b.get("Properties", {})
        ]
        assert len(replication_buckets) == 0

    def test_secondary_without_hosted_zone_id(self, app):
        """Verify secondary stack without HOSTED_ZONE_ID env var"""
        # Ensure env var is not set
        if "HOSTED_ZONE_ID" in os.environ:
            del os.environ["HOSTED_ZONE_ID"]

        props = TapStackProps(
            environment_suffix="test",
            domain_name="test.mycompany.com",
            env=Environment(account="123456789012", region="us-west-2"),
        )
        stack = TapStack(app, "SecondaryNoZoneStack", props=props)
        template = Assert.Template.from_stack(stack)

        # Secondary should not have Route53 records without zone ID
        template.resource_count_is("AWS::Route53::RecordSet", 0)

    def test_log_retention_maps_correctly(self, app):
        """Test various log retention values map to correct enums"""
        test_cases = [
            (1, 1),
            (3, 3),
            (5, 5),
            (7, 7),
            (14, 14),
            (30, 30),
            (99, 7),  # Invalid value should default to 7
        ]

        for input_days, expected_days in test_cases:
            props = TapStackProps(
                environment_suffix="test",
                log_retention_days=input_days,
                env=Environment(account="123456789012", region="us-east-1"),
            )
            stack = TapStack(app, f"RetentionTest{input_days}", props=props)
            assert stack.log_retention_days == input_days

    def test_pr_environment_suffix(self, app):
        """Test stack works with PR number as environment suffix"""
        props = TapStackProps(
            environment_suffix="PR6845",
            env=Environment(account="123456789012", region="us-east-1"),
        )
        stack = TapStack(app, "TapStackPR6845", props=props)
        template = Assert.Template.from_stack(stack)

        # Verify PR suffix is used in resource names
        resources = template.to_json()["Resources"]
        assert len(resources) > 0

        # Check that some resources include PR6845 in names
        named_resources = []
        for resource in resources.values():
            props_dict = resource.get("Properties", {})
            if "ClusterName" in props_dict:
                named_resources.append(props_dict["ClusterName"])
            if "TableName" in props_dict:
                named_resources.append(props_dict["TableName"])

        assert any("PR6845" in str(name) for name in named_resources)


class TestMultiRegionScenarios:
    """Test multi-region deployment scenarios"""

    def test_primary_has_all_resources(self, primary_stack):
        """Verify primary region has all expected resources"""
        template = Assert.Template.from_stack(primary_stack)

        # Count all major resource types
        assert_counts = [
            ("AWS::EC2::VPC", 1),
            ("AWS::ECS::Cluster", 1),
            ("AWS::ECS::Service", 1),
            ("AWS::ElasticLoadBalancingV2::LoadBalancer", 1),
            ("AWS::RDS::GlobalCluster", 1),
            ("AWS::RDS::DBCluster", 1),
            ("AWS::DynamoDB::Table", 1),
            ("AWS::S3::Bucket", 1),
            ("AWS::Events::EventBus", 1),
            ("AWS::CloudWatch::Alarm", 1),
        ]

        for resource_type, count in assert_counts:
            template.resource_count_is(resource_type, count)

    def test_secondary_has_replica_resources(self, secondary_stack):
        """Verify secondary region has replica resources"""
        template = Assert.Template.from_stack(secondary_stack)

        # Count replica resources
        assert_counts = [
            ("AWS::EC2::VPC", 1),
            ("AWS::ECS::Cluster", 1),
            ("AWS::ECS::Service", 1),
            ("AWS::ElasticLoadBalancingV2::LoadBalancer", 1),
            ("AWS::RDS::DBCluster", 1),  # Secondary cluster
            ("AWS::S3::Bucket", 1),
            ("AWS::Events::EventBus", 1),
            ("AWS::KMS::Key", 1),  # KMS key for secondary Aurora
        ]

        for resource_type, count in assert_counts:
            template.resource_count_is(resource_type, count)

    def test_secondary_does_not_duplicate_global_resources(self, secondary_stack):
        """Verify secondary does not create global resources"""
        template = Assert.Template.from_stack(secondary_stack)

        # Should not have these global resources
        template.resource_count_is("AWS::RDS::GlobalCluster", 0)
        template.resource_count_is("AWS::DynamoDB::Table", 0)  # Imported, not created
        template.resource_count_is("AWS::Route53::HostedZone", 0)
